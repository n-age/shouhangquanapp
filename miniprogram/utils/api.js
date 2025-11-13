// miniprogram/utils/api.js

/**
 * 通用的云函数调用封装
 * @param {string} name - 云函数名称
 * @param {string} action - 需要调用的 action
 * @param {object} params - 传递给 action 的参数
 * @returns {Promise}
 */
const callCloudFunction = (name, action, params = {}) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: name,
      data: {
        action: action,
        params: params
      }
    }).then(res => {
      if (res.result && res.result.errCode === 0) {
        resolve(res.result); // 只返回云函数的结果部分
      } else {
        // 统一处理业务逻辑错误
        wx.showToast({
          title: res.result.errMsg || '操作失败',
          icon: 'none'
        });
        reject(res.result);
      }
    }).catch(err => {
      // 统一处理网络或系统错误
      wx.showToast({
        title: '请求异常，请重试',
        icon: 'none'
      });
      console.error(`[API][${name}.${action}] Call failed:`, err);
      reject(err);
    });
  });
};

// 导出所有API
module.exports = {
  // 用户相关
  login: (userInfo) => callCloudFunction('users', 'login', { userInfo }),
  updateProfile: (userInfo) => callCloudFunction('users', 'updateProfile', { userInfo }),
  getPilotProfile: (pilotId) => callCloudFunction('users', 'getPilotProfile', { pilotId }),

  // 任务相关
  createTask: (taskData) => callCloudFunction('tasks', 'createTask', { taskData }),
  getTasks: (params) => callCloudFunction('tasks', 'getTasks', params),
  getTaskDetail: (taskId) => callCloudFunction('tasks', 'getTaskDetail', { taskId }),

  // 订单相关
  createOrder: (taskId) => callCloudFunction('orders', 'createOrder', { taskId }),
  getOrderList: (params) => callCloudFunction('orders', 'getOrderList', params),
  getOrderDetail: (orderId) => callCloudFunction('orders', 'getOrderDetail', { orderId }),
  payOrder: (orderId) => callCloudFunction('orders', 'payOrder', { orderId }),
  submitWork: (orderId, submission) => callCloudFunction('orders', 'submitWork', { orderId, submission }),
  confirmCompletion: (orderId) => callCloudFunction('orders', 'confirmCompletion', { orderId }),
  cancelOrder: (orderId) => callCloudFunction('orders', 'cancelOrder', { orderId }),

  // 新闻相关
  getNewsList: (params) => callCloudFunction('news', 'getNewsList', params),

  // 认证相关
  submitRealNameAuth: (authData) => callCloudFunction('auth', 'submitRealNameAuth', { authData }),

  // 管理员相关
  getPendingAuths: () => callCloudFunction('admin', 'getPendingAuths'),
  getAuthDetail: (authId) => callCloudFunction('admin', 'getAuthDetail', { authId }),
  updateAuthStatus: (authId, status, reason) => callCloudFunction('admin', 'updateAuthStatus', { authId, status, reason }),
};
