// miniprogram/pages/task-hall/task-hall.js
Page({
  data: {
    taskList: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false,
    filters: {} // for future filter implementation
  },

  onLoad(options) {
    this.fetchTasks();
  },

  onPullDownRefresh() {
    this.setData({
      taskList: [],
      page: 1,
      hasMore: true,
    });
    this.fetchTasks().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  fetchTasks() {
    if (!this.data.hasMore || this.data.isLoading) {
      return Promise.resolve();
    }
    this.setData({ isLoading: true });

    return wx.cloud.callFunction({
      name: 'tasks',
      data: {
        action: 'getTasks',
        params: {
          page: this.data.page,
          pageSize: this.data.pageSize,
          filters: this.data.filters
        }
      }
    }).then(res => {
      if (res.result && res.result.errCode === 0) {
        const fetchedTasks = res.result.data.map(task => this.formatTask(task));
        this.setData({
          taskList: this.data.taskList.concat(fetchedTasks),
          hasMore: res.result.hasMore,
          page: this.data.page + 1,
          isLoading: false
        });
      } else {
        this.setData({ isLoading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    }).catch(err => {
      this.setData({ isLoading: false });
      wx.showToast({ title: '请求异常', icon: 'none' });
      console.error("Failed to fetch tasks: ", err);
    });
  },

  loadMoreTasks() {
    this.fetchTasks();
  },

  formatTask(task) {
    // Format data for display
    return {
      ...task,
      deadline: new Date(task.deadline).toLocaleDateString(),
      statusText: this.getStatusText(task.status),
      publisherInfo: task.publisherInfo || { nickName: '匿名用户' } // handle missing publisher info
    };
  },

  getStatusText(status) {
    const statusMap = {
      'open': '招募中',
      'in_progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || '未知';
  },

  goToTaskDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/task-details/task-details?id=${id}`,
    });
  },

  goToCreateTask() {
    wx.navigateTo({
      url: '/pages/task-create/task-create',
    });
  },

  goToMyProfile() {
    wx.switchTab({
      url: '/pages/my-profile/my-profile',
    });
  }
});
