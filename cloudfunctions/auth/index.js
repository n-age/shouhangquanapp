// cloudfunctions/auth/index.js
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
  const { action, authData } = event;

  switch (action) {
    case 'getOpenId':
      return {
        openid: openid,
      };
    case 'submitRealNameAuth':
      return await submitRealNameAuth(openid, authData);
    // 可以在此添加其他认证相关的action，如 submitEnterpriseAuth, submitPilotAuth等
    default:
      return {
        errCode: 404,
        errMsg: 'Action not found'
      };
  }
};

/**
 * 提交实名认证申请
 * @param {string} openid - 用户的openid
 * @param {object} authData - 认证数据
 */
async function submitRealNameAuth(openid, authData) {
  const { realName, idCardNumber, idCardFileID } = authData;

  // 数据校验
  if (!realName || !idCardNumber || !idCardFileID) {
    return {
      errCode: 1,
      errMsg: 'Missing required fields'
    };
  }

  try {
    const users = db.collection('Users');
    const authentications = db.collection('Authentications');

    // 获取当前用户的userId
    const userResult = await users.where({ _openid: openid }).limit(1).get();
    if (userResult.data.length === 0) {
      return {
        errCode: 2,
        errMsg: 'User not found'
      }
    }
    const userId = userResult.data[0]._id;

    // 检查是否已有待审核的实名认证申请
    const existingAuth = await authentications.where({
      userId: userId,
      type: 'realName',
      status: 'pending'
    }).count();

    if (existingAuth.total > 0) {
      return {
        errCode: 3,
        errMsg: 'You have a pending authentication request.'
      };
    }

    // 写入新的认证记录
    await authentications.add({
      data: {
        userId: userId,
        type: 'realName',
        data: {
          realName,
          idCardNumber,
          idCardImageUrl: idCardFileID, // 注意这里存储的是FileID
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return {
      errCode: 0,
      errMsg: 'Submission successful'
    };

  } catch (e) {
    console.error('Error in submitRealNameAuth:', e);
    return {
      errCode: 500,
      errMsg: 'Database operation failed',
      error: e
    };
  }
}
