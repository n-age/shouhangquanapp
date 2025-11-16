// cloudfunctions/main/orders.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

async function getOrderList(event, context) {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const { status, page = 1, pageSize = 10 } = event.payload;

    try {
        const user = await db.collection('Users').where({_openid: openid}).get();
        if(user.data.length === 0) return {success: false, message: 'User not found.'};

        const userId = user.data[0]._id;

        const query = _.or([
            { publisherId: userId },
            { pilotId: userId }
        ]);

        if (status && status !== 'all') {
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

async function getOrderDetail(event, context) {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const { id } = event.payload;
    if (!id) return { success: false, message: 'Order ID is required.' };

    try {
        const user = await db.collection('Users').where({_openid: openid}).get();
        if(user.data.length === 0) return {success: false, message: 'User not found.'};
        const userId = user.data[0]._id;

        const orderRes = await db.collection('Orders').aggregate()
            .match({ _id: id })
            .lookup({ from: 'Tasks', localField: 'taskId', foreignField: '_id', as: 'taskInfo' })
            .lookup({ from: 'Users', localField: 'publisherId', foreignField: '_id', as: 'publisherInfo' })
            .lookup({ from: 'Users', localField: 'pilotId', foreignField: '_id', as: 'pilotInfo' })
            .unwind({ path: '$taskInfo', preserveNullAndEmptyArrays: true })
            .unwind({ path: '$publisherInfo', preserveNullAndEmptyArrays: true })
            .unwind({ path: '$pilotInfo', preserveNullAndEmptyArrays: true })
            .end();

        if (orderRes.list.length === 0) {
            return { success: false, message: 'Order not found.' };
        }

        const order = orderRes.list[0];
        if(order.publisherId !== userId && order.pilotId !== userId) {
            return {success: false, message: 'Access denied.'};
        }

        if(order.publisherInfo) {
            delete order.publisherInfo.openid;
            delete order.publisherInfo.balance;
        }
        if(order.pilotInfo) {
            delete order.pilotInfo.openid;
            delete order.pilotInfo.balance;
        }

        return { success: true, data: order };
    } catch (e) {
        console.error("Error in getOrderDetail: ", e);
        return { success: false, message: 'Database error.', error: e.message };
    }
}

async function createOrder(event, context) {
    const wxContext = cloud.getWXContext();
    const pilotOpenid = wxContext.OPENID;
    const { taskId } = event.payload;

    if (!taskId) return { success: false, message: 'Task ID is required.' };

    const transaction = await db.startTransaction();
    try {
        const pilotUserRes = await transaction.collection('Users').where({ _openid: pilotOpenid }).get();
        if (pilotUserRes.data.length === 0) {
            await transaction.rollback();
            return { success: false, message: 'Pilot user not found.' };
        }
        const pilotUser = pilotUserRes.data[0];
        if (pilotUser.verifications?.pilot?.status !== 'approved') {
            await transaction.rollback();
            return { success: false, message: 'Pilot authentication is required to accept tasks.' };
        }

        const taskDoc = transaction.collection('Tasks').doc(taskId);
        const taskRes = await taskDoc.get();
        if (!taskRes.data) {
            await transaction.rollback();
            return { success: false, message: 'Task not found.' };
        }
        const task = taskRes.data;

        if (task.status !== 'open') {
            await transaction.rollback();
            return { success: false, message: 'This task is no longer available.' };
        }
        if (task.publisherId === pilotUser._id) {
            await transaction.rollback();
            return { success: false, message: "You cannot accept your own task." };
        }

        await taskDoc.update({ data: { status: 'in_progress', pilotId: pilotUser._id } });

        const orderNumber = `ORD-${Date.now()}`;
        const addRes = await transaction.collection('Orders').add({
            data: {
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
