// miniprogram/utils/api.js

/**
 * A unified wrapper for calling the main cloud function.
 * @param {string} type - The route/action type (e.g., 'users.login').
 * @param {object} payload - The data to be sent to the function.
 * @param {boolean} [showLoading=false] - Whether to show a loading toast.
 * @returns {Promise}
 */
const callCloud = (type, payload = {}, showLoading = false) => {
  return new Promise((resolve, reject) => {
    if (showLoading) {
      wx.showLoading({ title: '加载中...' });
    }

    wx.cloud.callFunction({
      name: 'main', // All calls go to the 'main' function
      data: {
        type: type,
        payload: payload
      }
    }).then(res => {
      if (showLoading) {
        wx.hideLoading();
      }
      if (res.result && res.result.success) {
        resolve(res.result); // Resolve with the entire result object { success, data, ... }
      } else {
        // Handle business logic errors returned from the cloud function
        wx.showToast({
          title: res.result.message || '操作失败',
          icon: 'none'
        });
        console.error(`[API Error][${type}]`, res.result);
        reject(res.result);
      }
    }).catch(err => {
      if (showLoading) {
        wx.hideLoading();
      }
      // Handle network or system errors
      wx.showToast({
        title: '网络请求失败',
        icon: 'none'
      });
      console.error(`[API Call Failed][${type}]`, err);
      reject(err);
    });
  });
};

// Export all API methods
module.exports = {
  // User related
  login: () => callCloud('users.login'),
  updateProfile: (userInfo) => callCloud('users.updateProfile', userInfo),
  getPilotProfile: (pilotId) => callCloud('users.getPilotProfile', { pilotId }),

  // Task related
  createTask: (taskData) => callCloud('tasks.createTask', taskData, true),
  getTasks: (params) => callCloud('tasks.getTasks', params),
  getTaskDetail: (id) => callCloud('tasks.getTaskDetail', { id }, true),
  getPublishedTasks: () => callCloud('tasks.getPublishedTasks'),

  // Order related
  createOrder: (taskId) => callCloud('orders.createOrder', { taskId }, true),
  getOrderList: (params) => callCloud('orders.getOrderList', params),
  getOrderDetail: (id) => callCloud('orders.getOrderDetail', { id }, true),
  updateOrderStatus: (orderId, action, data) => callCloud('orders.updateOrderStatus', { orderId, action, data }, true),

  // News related
  getNewsList: (params) => callCloud('news.getNewsList', params),
  getNewsDetail: (id) => callCloud('news.getNewsDetail', { id }, true),

  // Auth related
  submitRealName: (authData) => callCloud('auth.submitRealName', authData, true),
  submitEnterprise: (authData) => callCloud('auth.submitEnterprise', authData, true),
  submitPilot: (authData) => callCloud('auth.submitPilot', authData, true),
  getAuthStatus: () => callCloud('auth.getAuthStatus'),

  // Admin related
  getReviewList: () => callCloud('admin.getReviewList'),
  review: (authId, status, reason) => callCloud('admin.review', { authId, status, reason }, true),
};
