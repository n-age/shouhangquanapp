// cloudfunctions/tasks/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action, taskData, taskId } = event;

  switch (action) {
    case 'createTask':
      return await createTask(openid, taskData);
    case 'getTasks':
      return await getTasks(event.params);
    case 'getTaskDetail':
      return await getTaskDetail(event.params);
    default:
      return {
        errCode: 404,
        errMsg: 'Action not found'
      };
  }
};

/**
 * 获取单个任务的详细信息
 * @param {object} params - 查询参数 { taskId }
 */
async function getTaskDetail(params) {
  const { taskId } = params;

  if (!taskId) {
    return { errCode: 1, errMsg: 'Missing taskId' };
  }

  try {
    const tasksCollection = db.collection('Tasks');
    const taskResult = await tasksCollection.aggregate()
      .match({
        _id: taskId
      })
      .lookup({
        from: 'Users',
        localField: 'publisherId',
        foreignField: '_id',
        as: 'publisherInfo',
      })
      .project({
        // project all fields except publisherInfo array
        'publisherInfo._id': 0,
        'publisherInfo.openid': 0, // exclude sensitive info
        'publisherInfo.balance': 0,
        // merge publisherInfo object
        publisherInfo: cloud.aggregate.arrayElemAt(['$publisherInfo', 0]),
      })
      .end();

    if (taskResult.list.length === 0) {
      return { errCode: 2, errMsg: 'Task not found' };
    }

    const task = taskResult.list[0];

    // Sanitize publisher info
    if (task.publisherInfo) {
      task.publisherInfo = {
        nickName: task.publisherInfo.nickName,
        avatarUrl: task.publisherInfo.avatarUrl
      };
    }

    return {
      errCode: 0,
      errMsg: 'Success',
      data: task,
    };

  } catch (e) {
    console.error('Error in getTaskDetail:', e);
    return {
      errCode: 500,
      errMsg: 'Database operation failed',
      error: e,
    };
  }
}

/**
 * 获取任务列表（分页、筛选）
 * @param {object} params - 查询参数 { page, pageSize, filters }
 */
async function getTasks(params) {
  const { page = 1, pageSize = 10, filters = {} } = params;

  try {
    let query = {
      status: 'open' // 默认只查询开放中的任务
    };

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
      .sort({
        createdAt: -1
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lookup({
        from: 'Users',
        localField: 'publisherId',
        foreignField: '_id',
        as: 'publisherInfo',
      })
      .project({
        title: 1,
        reward: 1,
        tags: 1,
        address: 1,
        deadline: 1,
        status: 1,
        publisherInfo: cloud.aggregate.arrayElemAt(['$publisherInfo', 0]),
      })
      .end();

    // 只取出需要的发布者信息，避免敏感信息泄露
    const sanitizedList = tasksResult.list.map(task => {
        if (task.publisherInfo) {
            task.publisherInfo = {
                nickName: task.publisherInfo.nickName,
                avatarUrl: task.publisherInfo.avatarUrl
            };
        }
        return task;
    });

    return {
      errCode: 0,
      errMsg: 'Success',
      data: sanitizedList,
      hasMore: (page * pageSize) < total
    };

  } catch (e) {
    console.error('Error in getTasks:', e);
    return {
      errCode: 500,
      errMsg: 'Database operation failed',
      error: e
    };
  }
}

/**
 * 创建新任务
 * @param {string} openid - 发布者的openid
 * @param {object} taskData - 任务数据
 */
async function createTask(openid, taskData) {
  const { title, description, category, reward, deadline, location } = taskData;

  // --- 安全和数据校验 ---
  if (!title || !description || !category || !reward || !deadline || !location) {
    return { errCode: 1, errMsg: 'Missing required fields' };
  }

  try {
    // 1. 获取发布者的 userId
    const userResult = await db.collection('Users').where({ _openid: openid }).limit(1).get();
    if (userResult.data.length === 0) {
      return { errCode: 2, errMsg: 'User not found' };
    }
    const user = userResult.data[0];

    // 2. 检查用户是否经过认证 (根据业务逻辑决定，这里假设已认证)
    // if (!user.isRealNameVerified && !user.isEnterpriseVerified) {
    //   return { errCode: 3, errMsg: 'User not verified' };
    // }

    // 3. 写入 Tasks 集合
    const tasksCollection = db.collection('Tasks');
    const addTaskResult = await tasksCollection.add({
      data: {
        publisherId: user._id,
        title,
        description,
        tags: [category], // 使用tags数组更灵活
        reward,
        deadline: new Date(deadline),
        location: location.geo, // 存储GeoPoint
        address: location.address,
        status: 'open', // 初始状态为开放中
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    return {
      errCode: 0,
      errMsg: 'Task created successfully',
      taskId: addTaskResult._id
    };

  } catch (e) {
    console.error('Error in createTask:', e);
    return {
      errCode: 500,
      errMsg: 'Database operation failed',
      error: e
    };
  }
}
