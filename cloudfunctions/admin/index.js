// cloudfunctions/admin/index.js
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
  const { action } = event;

  // 简单的权限校验：检查调用者是否是管理员
  // 实际项目中，应该有一个专门的管理员列表进行校验
  const isAdmin = await checkIsAdmin(openid);
  if (!isAdmin) {
    return {
      errCode: 403,
      errMsg: 'Permission denied. Not an admin.'
    };
  }

  switch (action) {
    case 'getPendingAuths':
      return await getPendingAuths();
    case 'getAuthDetail':
      return await getAuthDetail(event.params);
    case 'updateAuthStatus':
      return await updateAuthStatus(event.params);
    default:
      return {
        errCode: 404,
        errMsg: 'Action not found'
      };
  }
};

/**
 * 获取单个认证申请的详细信息
 * @param {object} params - { authId }
 */
async function getAuthDetail(params) {
  const { authId } = params;
  if (!authId) return { errCode: 1, errMsg: 'Missing authId' };

  try {
    const res = await db.collection('Authentications').aggregate()
      .match({ _id: authId })
      .lookup({
        from: 'Users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo',
      })
      .project({
        'userInfo.balance': 0, 'userInfo.openid': 0,
        userInfo: cloud.aggregate.arrayElemAt(['$userInfo', 0])
      })
      .end();

    if (res.list.length === 0) {
      return { errCode: 2, errMsg: 'Authentication not found' };
    }
    return { errCode: 0, errMsg: 'Success', data: res.list[0] };
  } catch (e) {
    return { errCode: 500, errMsg: 'Database error', error: e };
  }
}

/**
 * 更新认证状态
 * @param {object} params - { authId, status, reason }
 */
async function updateAuthStatus(params) {
  const { authId, status, reason } = params;
  if (!authId || !status) return { errCode: 1, errMsg: 'Missing parameters' };
  if (!['approved', 'rejected'].includes(status)) return { errCode: 2, errMsg: 'Invalid status' };

  try {
    const auths = db.collection('Authentications');
    const authRecord = await auths.doc(authId).get();
    if (!authRecord.data) return { errCode: 3, errMsg: 'Record not found' };

    await auths.doc(authId).update({
      data: {
        status: status,
        rejectReason: reason || null,
        updatedAt: new Date()
      }
    });

    // 如果批准，则更新Users表
    if (status === 'approved') {
      const users = db.collection('Users');
      const authInfo = authRecord.data;
      const updateData = {};
      if (authInfo.type === 'realName') {
        updateData.isRealNameVerified = true;
        updateData.realName = authInfo.data.realName;
      } else if (authInfo.type === 'enterprise') {
        updateData.isEnterpriseVerified = true;
      } else if (authInfo.type === 'pilot') {
        updateData.isPilotVerified = true;
      }
      await users.doc(authInfo.userId).update({ data: updateData });
    }

    return { errCode: 0, errMsg: 'Update successful' };
  } catch (e) {
    return { errCode: 500, errMsg: 'Database error', error: e };
  }
}

/**
 * 检查用户是否是管理员
 * (这是一个简化的示例，实际项目应有更安全的校验方式)
 * @param {string} openid - 用户的openid
 */
async function checkIsAdmin(openid) {
  // 在这里可以查询数据库中的管理员列表
  // 为简化，我们暂时假设白名单或某个用户角色
  const adminList = ["YOUR_ADMIN_OPENID_HERE"]; // 替换为实际的管理员OpenID

  const user = await db.collection('Users').where({ _openid: openid }).get();
  if(user.data.length > 0 && user.data[0].role.includes('admin')){
      return true;
  }

  return adminList.includes(openid);
}


/**
 * 获取所有待审核的认证列表
 */
async function getPendingAuths() {
  try {
    const res = await db.collection('Authentications').aggregate()
      .match({
        status: 'pending'
      })
      .sort({
        createdAt: -1 // 按创建时间倒序
      })
      .lookup({
        from: 'Users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo',
      })
      .project({
        _id: 1,
        type: 1,
        data: 1,
        createdAt: 1,
        // 将userInfo数组的第一个元素（即匹配到的用户）合并到主对象中
        userInfo: cloud.aggregate.arrayElemAt(['$userInfo', 0])
      })
      .end();

    return {
      errCode: 0,
      errMsg: 'Success',
      data: res.list
    };

  } catch (e) {
    console.error('Error in getPendingAuths:', e);
    return {
      errCode: 500,
      errMsg: 'Database operation failed',
      error: e
    };
  }
}
