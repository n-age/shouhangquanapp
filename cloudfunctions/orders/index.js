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
    default:
      return { errCode: 404, errMsg: 'Action not found' };
  }
};

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
