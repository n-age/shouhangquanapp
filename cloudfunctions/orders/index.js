// cloudfunctions/orders/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action, params } = event;

  switch (action) {
    case 'createOrder':
      return await createOrder(openid, params.taskId);
    case 'getOrderList':
      return await getOrderList(openid, params);
    case 'getOrderDetail':
      return await getOrderDetail(openid, params.orderId);
    case 'payOrder':
      return await updateOrderStatus(openid, params.orderId, 'pay');
    case 'submitWork':
      return await updateOrderStatus(openid, params.orderId, 'submit', params.submission);
    case 'confirmCompletion':
      return await updateOrderStatus(openid, params.orderId, 'complete');
    case 'cancelOrder':
      return await updateOrderStatus(openid, params.orderId, 'cancel');
    default:
      return { errCode: 404, errMsg: 'Action not found' };
  }
};

async function getOrderList(openid, params) {
    const { status, page = 1, pageSize = 10 } = params;
    try {
        const users = await db.collection('Users').where({ _openid: openid }).get();
        if (users.data.length === 0) {
            return { errCode: 1, errMsg: 'User not found' };
        }
        const userId = users.data[0]._id;

        const query = _.or([
            { publisherId: userId },
            { pilotId: userId }
        ]);

        if (status && status !== 'all') {
            query.status = status;
        }

        const ordersCollection = db.collection('Orders');
        const total = await ordersCollection.where(query).count();

        const orderRes = await ordersCollection.aggregate()
            .match(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lookup({
                from: 'Tasks',
                localField: 'taskId',
                foreignField: '_id',
                as: 'taskInfo'
            })
            .project({
                'taskInfo.description': 0, // Exclude large fields
                taskInfo: cloud.aggregate.arrayElemAt(['$taskInfo', 0])
            })
            .end();

        return {
            errCode: 0,
            errMsg: 'Success',
            data: orderRes.list,
            hasMore: (page * pageSize) < total.total
        };
    } catch (e) {
        console.error("Error in getOrderList: ", e);
        return { errCode: 500, errMsg: 'Database error' };
    }
}

async function getOrderDetail(openid, orderId) {
    if (!orderId) return { errCode: 1, errMsg: 'orderId is required' };
    try {
        const users = await db.collection('Users').where({ _openid: openid }).get();
        if (users.data.length === 0) return { errCode: 2, errMsg: 'User not found' };
        const currentUser = users.data[0];

        const orderRes = await db.collection('Orders').aggregate()
            .match({ _id: orderId })
            .lookup({ from: 'Tasks', localField: 'taskId', foreignField: '_id', as: 'taskInfo' })
            .lookup({ from: 'Users', localField: 'publisherId', foreignField: '_id', as: 'publisherInfo' })
            .lookup({ from: 'Users', localField: 'pilotId', foreignField: '_id', as: 'pilotInfo' })
            .project({
                'taskInfo': cloud.aggregate.arrayElemAt(['$taskInfo', 0]),
                'publisherInfo': cloud.aggregate.arrayElemAt(['$publisherInfo', 0]),
                'pilotInfo': cloud.aggregate.arrayElemAt(['$pilotInfo', 0]),
                // Include all original order fields
                _id: 1, taskId: 1, publisherId: 1, pilotId: 1, orderNumber: 1, amount: 1,
                status: 1, paymentStatus: 1, createdAt: 1, updatedAt: 1, workSubmission: 1,
            })
            .end();

        if (orderRes.list.length === 0) {
            return { errCode: 3, errMsg: 'Order not found' };
        }

        const order = orderRes.list[0];

        // Security check: ensure the current user is part of this order
        if (order.publisherId !== currentUser._id && order.pilotId !== currentUser._id) {
            return { errCode: 403, errMsg: 'Permission denied' };
        }

        // Sanitize user data before sending to client
        if (order.publisherInfo) {
            order.publisherInfo = { _id: order.publisherInfo._id, nickName: order.publisherInfo.nickName, avatarUrl: order.publisherInfo.avatarUrl };
        }
        if (order.pilotInfo) {
            order.pilotInfo = { _id: order.pilotInfo._id, nickName: order.pilotInfo.nickName, avatarUrl: order.pilotInfo.avatarUrl };
        }

        return { errCode: 0, errMsg: 'Success', data: order };
    } catch (e) {
        console.error("Error in getOrderDetail: ", e);
        return { errCode: 500, errMsg: 'Database error' };
    }
}

async function updateOrderStatus(openid, orderId, operation, payload = {}) {
    if (!orderId) return { errCode: 1, errMsg: 'orderId is required' };
    try {
        const users = await db.collection('Users').where({ _openid: openid }).get();
        if (users.data.length === 0) return { errCode: 2, errMsg: 'User not found' };
        const currentUser = users.data[0];

        // Start transaction
        const transaction = await db.startTransaction();
        const ordersInTransaction = transaction.collection('Orders');
        const orderRes = await ordersInTransaction.doc(orderId).get();

        if (!orderRes.data) {
            await transaction.rollback();
            return { errCode: 3, errMsg: 'Order not found' };
        }
        const order = orderRes.data;
        let updateData = {};

        // State machine logic
        switch (operation) {
            case 'pay':
                if (order.publisherId !== currentUser._id) { await transaction.rollback(); return { errCode: 403, errMsg: 'Only the publisher can pay.' }; }
                if (order.status !== 'pending_payment') { await transaction.rollback(); return { errCode: 4, errMsg: 'Order is not awaiting payment.' }; }
                updateData = { status: 'in_progress', paymentStatus: 'paid', paidAt: new Date() };
                break;
            case 'submit':
                if (order.pilotId !== currentUser._id) { await transaction.rollback(); return { errCode: 403, errMsg: 'Only the pilot can submit work.' }; }
                if (order.status !== 'in_progress') { await transaction.rollback(); return { errCode: 4, errMsg: 'Order is not in progress.' }; }
                updateData = { status: 'pending_confirmation', workSubmission: payload };
                break;
            case 'complete':
                if (order.publisherId !== currentUser._id) { await transaction.rollback(); return { errCode: 403, errMsg: 'Only the publisher can complete the order.' }; }
                if (order.status !== 'pending_confirmation') { await transaction.rollback(); return { errCode: 4, errMsg: 'Work has not been submitted yet.' }; }
                updateData = { status: 'completed', completedAt: new Date() };
                // Here you would also handle transferring funds from platform to pilot
                break;
            case 'cancel':
                if (order.publisherId !== currentUser._id && order.pilotId !== currentUser._id) { await transaction.rollback(); return { errCode: 403, errMsg: 'Permission denied.' }; }
                // More complex logic can be added here, e.g., cannot cancel after payment
                if (['completed', 'cancelled'].includes(order.status)) { await transaction.rollback(); return { errCode: 4, errMsg: 'Order cannot be cancelled.' }; }
                updateData = { status: 'cancelled' };
                // Also need to revert the task status back to 'open'
                await transaction.collection('Tasks').doc(order.taskId).update({ data: { status: 'open' }});
                break;
            default:
                await transaction.rollback();
                return { errCode: 5, errMsg: 'Invalid operation' };
        }

        updateData.updatedAt = new Date();
        await ordersInTransaction.doc(orderId).update({ data: updateData });

        await transaction.commit();
        return { errCode: 0, errMsg: 'Status updated successfully' };
    } catch (e) {
        console.error("Error in updateOrderStatus: ", e);
        // Transaction is auto-rolled back on error
        return { errCode: 500, errMsg: 'Database error' };
    }
}

/**
 * Creates an order when a pilot accepts a task.
 * @param {string} pilotOpenid - The openid of the pilot accepting the task.
 * @param {string} taskId - The _id of the task being accepted.
 */
async function createOrder(pilotOpenid, taskId) {
  if (!taskId) {
      return { errCode: 100, errMsg: 'Task ID is required.' };
  }
  try {
    const users = db.collection('Users');
    const tasks = db.collection('Tasks');
    const orders = db.collection('Orders');

    // 1. Get pilot's user data and perform permission check
    const pilotUserRes = await users.where({ _openid: pilotOpenid }).get();
    if (pilotUserRes.data.length === 0) {
      return { errCode: 1, errMsg: 'Pilot not found.' };
    }
    const pilotUser = pilotUserRes.data[0];
    if (!pilotUser.isPilotVerified) {
      return { errCode: 2, errMsg: 'Only verified pilots can accept tasks.' };
    }

    // Use a transaction to ensure atomicity
    const transaction = await db.startTransaction();
    const tasksInTransaction = transaction.collection('Tasks');
    const ordersInTransaction = transaction.collection('Orders');

    // 2. Get task data and perform precondition checks within the transaction
    const taskRes = await tasksInTransaction.doc(taskId).get();
    if (!taskRes.data) {
      await transaction.rollback();
      return { errCode: 3, errMsg: 'Task not found.' };
    }
    const task = taskRes.data;

    if (task.status !== 'open') {
      await transaction.rollback();
      return { errCode: 4, errMsg: 'This task is no longer open for acceptance.' };
    }
    if (task.publisherId === pilotUser._id) {
      await transaction.rollback();
      return { errCode: 5, errMsg: 'You cannot accept your own task.' };
    }

    // 3. Atomically update task status and create the order
    const updateTaskRes = await tasksInTransaction.doc(taskId).update({
      data: {
        status: 'in_progress',
        updatedAt: new Date()
      }
    });

    // If update fails (e.g. another user just took it), rollback and notify
    if (updateTaskRes.stats.updated === 0) {
        await transaction.rollback();
        return { errCode: 6, errMsg: 'Failed to accept the task. It may have been taken by another pilot.' };
    }

    const orderNumber = `ORD-${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const newOrder = await ordersInTransaction.add({
      data: {
        taskId: taskId,
        publisherId: task.publisherId,
        pilotId: pilotUser._id,
        orderNumber: orderNumber,
        amount: task.reward,
        status: 'pending_payment',
        paymentStatus: 'unpaid',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await transaction.commit();

    return { errCode: 0, errMsg: 'Order created successfully.', orderId: newOrder._id };

  } catch (e) {
    console.error('Error in createOrder:', e);
    // The transaction will automatically be rolled back on error if not committed
    return { errCode: 500, errMsg: 'An error occurred while creating the order.' };
  }
}
