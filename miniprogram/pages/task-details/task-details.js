// miniprogram/pages/task-details/task-details.js
const app = getApp();
// ...
Page({
  data: {
    taskId: null,
    task: null,
    isLoading: true,
    isAccepting: false,
    userInfo: null,
    isPublisher: false,
  },

  onLoad(options) {
    const taskId = options.id;
    if (taskId) {
      this.setData({
        taskId,
        userInfo: app.globalData.userInfo
      });
      this.fetchTaskDetail(taskId);
    } else {
      wx.showToast({ title: '缺少任务ID', icon: 'none' });
      wx.navigateBack();
    }
  },

const api = require('../../utils/api.js');
// ...
  fetchTaskDetail(taskId) {
    this.setData({ isLoading: true });
    api.getTaskDetail(taskId).then(res => {
      this.setData({
        task: this.formatTask(res.data),
        isLoading: false
      });
    }).catch(() => this.setData({ isLoading: false }));
  },

  formatTask(task) {
    return {
      ...task,
      deadline: new Date(task.deadline).toLocaleDateString(),
      statusText: this.getStatusText(task.status),
      publisherInfo: task.publisherInfo || { nickName: '匿名用户', avatarUrl: '' }
    };
  },

  getStatusText(status) {
    const statusMap = {
      'open': '开放中',
      'in_progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || '未知';
  },

  acceptTask() {
    // Frontend permission check is now supplemented by wx:if in WXML
    if (!this.data.userInfo || !this.data.userInfo.isPilotVerified) {
      return wx.showToast({ title: '只有认证飞手才能抢单', icon: 'none' });
    }

    this.setData({ isAccepting: true });

    api.createOrder(this.data.taskId).then(res => {
      wx.showToast({ title: '抢单成功！', icon: 'success' });
      wx.redirectTo({
        url: `/pages/order-details/order-details?id=${res.orderId}`
      });
    }).finally(() => {
      this.setData({ isAccepting: false });
    });
  },

  navigateBack() {
    wx.navigateBack();
  }
});
