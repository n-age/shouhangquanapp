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
    // 抢单逻辑
    // 1. 检查用户是否为已认证的飞手
    // 2. 调用云函数创建订单
    wx.showLoading({ title: '正在抢单...' });

    // wx.cloud.callFunction({ name: 'orders', data: { action: 'createOrder', params: { taskId: this.data.taskId } } })
    // .then(res => { ... });

    // 模拟成功
    setTimeout(() => {
        wx.hideLoading();
        wx.showToast({ title: '抢单成功！', icon: 'success' });
        // 跳转到订单详情页
    }, 1000);
  },

  navigateBack() {
    wx.navigateBack();
  }
});
