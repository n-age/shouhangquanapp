// cloudfunctions/main/tasks.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

/**
 * Creates a new task.
 * @param {object} event - The event object.
 * @param {object} event.payload - The task data.
 */
async function createTask(event, context) {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const { title, description, category, reward, deadline, location, address } = event.payload;

    if (!title || !description || !category || !reward || !deadline || !location || !address) {
        return { success: false, message: 'Missing required fields.' };
    }

    // Basic validation
    if (typeof reward !== 'number' || reward <= 0) {
        return { success: false, message: 'Invalid reward amount.'};
    }

    try {
        const userResult = await db.collection('Users').where({ _openid: openid }).limit(1).get();
        if (userResult.data.length === 0) {
            return { success: false, message: 'User not found.' };
        }
        // It's good practice to check if the user is verified before allowing task creation
        const user = userResult.data[0];
        if (!user.verifications?.realName?.status === 'approved' && !user.verifications?.enterprise?.status === 'approved') {
            return { success: false, message: 'Please complete real-name or enterprise verification before publishing tasks.' };
        }

        const addTaskResult = await db.collection('Tasks').add({
            data: {
                publisherId: user._id,
                _openid: openid, // Store openid for easier queries
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

/**
 * Retrieves a list of tasks, typically for the task hall.
 * @param {object} event - The event object.
 * @param {object} event.payload - The query parameters.
 */
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

/**
 * Retrieves the details of a single task.
 * @param {object} event - The event object.
 * @param {object} event.payload - The query parameters.
 * @param {string} event.payload.id - The ID of the task.
 */
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

/**
 * Retrieves tasks published by the current user.
 * @param {object} event - The event object.
 */
async function getPublishedTasks(event, context) {
    const wxContext = cloud.getWXContext();
    const openid = wx.OPENID;

    try {
        const tasks = await db.collection('Tasks').where({
            _openid: openid
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
