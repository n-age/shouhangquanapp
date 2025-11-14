// cloudfunctions/main/orders.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;


/**
 * Retrieves a list of orders for the current user (either as publisher or pilot).
 * @param {object} event - The event object.
 * @param {object} event.payload - The query parameters.
 * @param {string} [event.payload.status] - The order status to filter by.
 * @param {number} [event.payload.page=1] - The page number.
 * @param {number} [event.payload.pageSize=10] - The number of items per page.
 */
async function getOrderList(event, context) {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const { status, page = 1, pageSize = 10 } = event.payload;

    try {
        const query = {
            _openid: openid, // This assumes you have an _openid field in your Orders collection linked to the user
        };
        if (status && status.toLowerCase() !== 'all') {
            query.status = status;
        }

        const ordersCollection = db.collection('Orders');
        const totalResult = await ordersCollection.where(query).count();
        const total = totalResult.total;

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
            .unwind({ path: '$taskInfo', preserveNullAndEmptyArrays: true })
            .end();

        return { success: true, data: orderRes.list, hasMore: (page * pageSize) < total };
    } catch (e) {
        console.error("Error in getOrderList: ", e);
        return { success: false, message: 'Database error.', error: e.message };
    }
}

/**
 * Retrieves the details of a single order.
 * @param {object} event - The event object.
 * @param {object} event.payload - The query parameters.
 * @param {string} event.payload.id - The ID of the order.
 */
async function getOrderDetail(event, context) {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const { id } = event.payload;
    if (!id) return { success: false, message: 'Order ID is required.' };

    try {
        const orderRes = await db.collection('Orders').aggregate()
            .match({ _id: id, _openid: openid }) // Security: ensure user can only fetch their own orders
            .lookup({ from: 'Tasks', localField: 'taskId', foreignField: '_id', as: 'taskInfo' })
            .lookup({ from: 'Users', localField: 'publisherId', foreignField: '_id', as: 'publisherInfo' })
            .lookup({ from: 'Users', localField: 'pilotId', foreignField: '_id', as: 'pilotInfo' })
            .unwind({ path: '$taskInfo', preserveNullAndEmptyArrays: true })
            .unwind({ path: '$publisherInfo', preserveNullAndEmptyArrays: true })
            .unwind({ path: '$pilotInfo', preserveNullAndEmptyArrays: true })
            .project({ // Sanitize sensitive data
                'publisherInfo.balance': 0, 'publisherInfo.openid': 0,
                'pilotInfo.balance': 0, 'pilotInfo.openid': 0,
            })
            .end();

        if (orderRes.list.length === 0) {
            return { success: false, message: 'Order not found or access denied.' };
        }

        return { success: true, data: orderRes.list[0] };
    } catch (e) {
        console.error("Error in getOrderDetail: ", e);
        return { success: false, message: 'Database error.', error: e.message };
    }
}

/**
 * Creates an order when a pilot accepts a task.
 * @param {object} event - The event object.
 * @param {object} event.payload - The data for creating the order.
 * @param {string} event.payload.taskId - The ID of the task being accepted.
 */
async function createOrder(event, context) {
    const wxContext = cloud.getWXContext();
    const pilotOpenid = wxContext.OPENID;
    const { taskId } = event.payload;

    if (!taskId) return { success: false, message: 'Task ID is required.' };

    // Use a transaction for atomicity
    const transaction = await db.startTransaction();
    try {
        const pilotUserRes = await transaction.collection('Users').where({ _openid: pilotOpenid }).get();
        if (pilotUserRes.data.length === 0) {
            await transaction.rollback(-100);
            return { success: false, message: 'Pilot user not found.' };
        }
        const pilotUser = pilotUserRes.data[0];
        if (pilotUser.verifications?.pilot?.status !== 'approved') {
            await transaction.rollback(-100);
            return { success: false, message: 'Pilot authentication is required to accept tasks.' };
        }

        const taskDoc = transaction.collection('Tasks').doc(taskId);
        const taskRes = await taskDoc.get();
        if (!taskRes.data) {
            await transaction.rollback(-100);
            return { success: false, message: 'Task not found.' };
        }
        const task = taskRes.data;

        if (task.status !== 'open') {
            await transaction.rollback(-100);
            return { success: false, message: 'This task is no longer available.' };
        }
        if (task.publisherId === pilotUser._id) {
            await transaction.rollback(-100);
            return { success: false, message: "You cannot accept your own task." };
        }

        await taskDoc.update({ data: { status: 'in_progress', pilotId: pilotUser._id } });

        const orderNumber = `ORD-${Date.now()}`;
        const addRes = await transaction.collection('Orders').add({
            data: {
                _openid: pilotOpenid, // Link order to user
                taskId: taskId,
                publisherId: task.publisherId,
                pilotId: pilotUser._id,
                orderNumber: orderNumber,
                amount: task.reward,
                status: 'pending_payment',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        await transaction.commit();
        return { success: true, message: 'Order created successfully.', orderId: addRes._id };
    } catch (e) {
        await transaction.rollback();
        console.error('Error in createOrder transaction:', e);
        return { success: false, message: 'Failed to create order due to a transaction error.', error: e.message };
    }
}

/**
 * Updates the status of an order based on user actions.
 * @param {object} event - The event object.
 * @param {object} event.payload - The data for the status update.
 * @param {string} event.payload.orderId - The ID of the order to update.
 * @param {string} event.payload.action - The action being performed (e.g., 'pay', 'submit_work').
 * @param {object} [event.payload.data] - Additional data for the action (e.g., submission details).
 */
async function updateOrderStatus(event, context) {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const { orderId, action, data } = event.payload;

    if (!orderId || !action) {
        return { success: false, message: 'Order ID and action are required.' };
    }

    const transaction = await db.startTransaction();
    try {
        const orderDoc = transaction.collection('Orders').doc(orderId);
        const orderRes = await orderDoc.get();

        if (!orderRes.data) {
            await transaction.rollback();
            return { success: false, message: 'Order not found.' };
        }
        const order = orderRes.data;
        const user = await transaction.collection('Users').where({ _openid: openid }).get();
        const currentUserId = user.data[0]._id;

        let updateData = {};
        let canUpdate = false;

        // State transition logic
        switch (action) {
            case 'pay':
                if (order.status === 'pending_payment' && currentUserId === order.publisherId) {
                    updateData = { status: 'in_progress' };
                    canUpdate = true;
                }
                break;
            case 'submit_work':
                if (order.status === 'in_progress' && currentUserId === order.pilotId) {
                    updateData = { status: 'pending_confirmation', workSubmission: data };
                    canUpdate = true;
                }
                break;
            case 'confirm_completion':
                if (order.status === 'pending_confirmation' && currentUserId === order.publisherId) {
                    updateData = { status: 'completed' };
                    // Here you might also update the associated task's status
                    await transaction.collection('Tasks').doc(order.taskId).update({data: { status: 'completed'}});
                    canUpdate = true;
                }
                break;
            case 'cancel':
                if (['pending_payment', 'in_progress'].includes(order.status) && [order.publisherId, order.pilotId].includes(currentUserId)) {
                    updateData = { status: 'cancelled' };
                     await transaction.collection('Tasks').doc(order.taskId).update({data: { status: 'open', pilotId: null }});
                    canUpdate = true;
                }
                break;
        }

        if (!canUpdate) {
            await transaction.rollback();
            return { success: false, message: 'Invalid action or permission denied for the current order status.' };
        }

        updateData.updatedAt = new Date();
        await orderDoc.update({ data: updateData });

        await transaction.commit();
        return { success: true, message: 'Order status updated successfully.' };
    } catch (e) {
        await transaction.rollback();
        console.error('Error in updateOrderStatus transaction:', e);
        return { success: false, message: 'Transaction failed.', error: e.message };
    }
}


module.exports = {
  createOrder,
  getOrderList,
  getOrderDetail,
  updateOrderStatus
};
