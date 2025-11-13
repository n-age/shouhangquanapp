// miniprogram/pages/task-details/task-details.js
Page({
  data: {
    taskId: null,
    task: null,
    isLoading: true,
  },

  onLoad(options) {
    const taskId = options.id;
    if (taskId) {
      this.setData({ taskId });
      this.fetchTaskDetail(taskId);
    } else {
      wx.showToast({ title: '缺少任务ID', icon: 'none' });
      wx.navigateBack();
    }
  },

  fetchTaskDetail(taskId) {
    this.setData({ isLoading: true });
    wx.cloud.callFunction({
      name: 'tasks',
      data: {
        action: 'getTaskDetail',
        params: { taskId }
      },
      success: res => {
        if (res.result && res.result.errCode === 0) {
          this.setData({
            task: this.formatTask(res.result.data),
            isLoading: false
          });
        } else {
          this.setData({ isLoading: false });
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      },
      fail: err => {
        this.setData({ isLoading: false });
        wx.showToast({ title: '请求失败', icon: 'none' });
        console.error("Failed to fetch task detail:", err);
      }
    });
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
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      return wx.showToast({ title: '请先登录', icon: 'none' });
    }
    if (!app.globalData.userInfo || !app.globalData.userInfo.isPilotVerified) {
      return wx.showToast({ title: '只有认证飞手才能抢单', icon: 'none' });
    }

    wx.showLoading({ title: '正在抢单...' });

    wx.cloud.callFunction({
      name: 'orders',
      data: {
        action: 'createOrder',
        params: { taskId: this.data.taskId }
      }
    })
    .then(res => {
      wx.hideLoading();
      if (res.result && res.result.errCode === 0) {
        wx.showToast({ title: '抢单成功！', icon: 'success' });
        // 抢单成功后，跳转到新生成的订单详情页
        wx.redirectTo({
          url: `/pages/order-details/order-details?id=${res.result.orderId}`
        });
      } else {
        wx.showToast({ title: res.result.errMsg || '抢单失败', icon: 'none' });
      }
    })
    .catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '请求异常', icon: 'none' });
      console.error("Failed to create order:", err);
    });
  },

  navigateBack() {
    wx.navigateBack();
  }
});
