// cloudfunctions/main/tasks.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

async function createTask(event, context) {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const { title, description, category, reward, deadline, location, address } = event.payload;

    if (!title || !description || !category || !reward || !deadline || !location || !address) {
        return { success: false, message: 'Missing required fields.' };
    }

    if (typeof reward !== 'number' || reward <= 0) {
        return { success: false, message: 'Invalid reward amount.'};
    }

    try {
        const userResult = await db.collection('Users').where({ _openid: openid }).limit(1).get();
        if (userResult.data.length === 0) {
            return { success: false, message: 'User not found.' };
        }
        const user = userResult.data[0];
        if (user.verifications?.realName?.status !== 'approved' && user.verifications?.enterprise?.status !== 'approved') {
            return { success: false, message: 'Please complete real-name or enterprise verification before publishing tasks.' };
        }

        const addTaskResult = await db.collection('Tasks').add({
            data: {
                publisherId: user._id,
                title,
                description,
                tags: [category],
                reward,
                deadline: new Date(deadline),
                location: new db.Geo.Point(location.longitude, location.latitude),
                address,
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        return { success: true, message: 'Task created successfully.', taskId: addTaskResult._id };
    } catch (e) {
        console.error('Error in createTask:', e);
        return { success: false, message: 'Database operation failed.', error: e.message };
    }
}

async function getTasks(event, context) {
    const { page = 1, pageSize = 10, filters = {} } = event.payload;

    try {
        let query = { status: 'open' };
        if (filters.keyword) {
            query = _.and([
                query,
                _.or([
                    { title: db.RegExp({ regexp: filters.keyword, options: 'i' }) },
                    { address: db.RegExp({ regexp: filters.keyword, options: 'i' }) }
                ])
            ]);
        }

        const tasksCollection = db.collection('Tasks');
        const totalResult = await tasksCollection.where(query).count();
        const total = totalResult.total;

        const tasksResult = await tasksCollection.aggregate()
            .match(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lookup({
                from: 'Users',
                localField: 'publisherId',
                foreignField: '_id',
                as: 'publisherInfo',
            })
            .unwind({ path: '$publisherInfo', preserveNullAndEmptyArrays: true })
            .project({
                'publisherInfo.balance': 0,
                'publisherInfo.openid': 0,
            })
            .end();

        return { success: true, data: tasksResult.list, hasMore: (page * pageSize) < total };
    } catch (e) {
        console.error('Error in getTasks:', e);
        return { success: false, message: 'Database operation failed.', error: e.message };
    }
}

async function getTaskDetail(event, context) {
    const { id } = event.payload;
    if (!id) return { success: false, message: 'Task ID is required.' };

    try {
        const taskResult = await db.collection('Tasks').aggregate()
            .match({ _id: id })
            .lookup({
                from: 'Users',
                localField: 'publisherId',
                foreignField: '_id',
                as: 'publisherInfo',
            })
            .unwind({ path: '$publisherInfo', preserveNullAndEmptyArrays: true })
            .project({
                'publisherInfo.balance': 0,
                'publisherInfo.openid': 0,
            })
            .end();

        if (taskResult.list.length === 0) {
            return { success: false, message: 'Task not found.' };
        }

        return { success: true, data: taskResult.list[0] };
    } catch (e) {
        console.error('Error in getTaskDetail:', e);
        return { success: false, message: 'Database operation failed.', error: e.message };
    }
}

async function getPublishedTasks(event, context) {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    try {
        const user = await db.collection('Users').where({_openid: openid}).get();
        if(user.data.length === 0) return {success: false, message: 'User not found.'};
        const userId = user.data[0]._id;

        const tasks = await db.collection('Tasks').where({
            publisherId: userId
        })
        .orderBy('createdAt', 'desc')
        .get();

        return { success: true, data: tasks.data };
    } catch(e) {
        console.error('Error in getPublishedTasks:', e);
        return { success: false, message: 'Failed to fetch published tasks.', error: e.message };
    }
}

module.exports = {
    createTask,
    getTasks,
    getTaskDetail,
    getPublishedTasks
};
