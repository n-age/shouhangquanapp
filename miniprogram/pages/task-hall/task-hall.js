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

  onSearchInput(e) {
    this.setData({
      'filters.keyword': e.detail.value,
      taskList: [],
      page: 1,
      hasMore: true,
    });
    // Add a debounce to avoid frequent API calls
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.fetchTasks(), 300);
  },

  onFilterTap(e) {
      // Placeholder for more complex filter logic (e.g., showing a dropdown menu)
      const filterType = e.currentTarget.dataset.type;
      wx.showToast({
        title: `Filter by ${filterType} (not implemented)`,
        icon: 'none'
      });
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

const api = require('../../utils/api.js');

// ... (Page data remains the same)

  fetchTasks() {
    if (!this.data.hasMore || this.data.isLoading) {
      return;
    }
    this.setData({ isLoading: true });

    api.getTasks({
      page: this.data.page,
      pageSize: this.data.pageSize,
      filters: this.data.filters
    }).then(res => {
      const fetchedTasks = res.data.map(task => this.formatTask(task));
      this.setData({
        taskList: this.data.taskList.concat(fetchedTasks),
        hasMore: res.hasMore,
        page: this.data.page + 1,
        isLoading: false
      });
    }).catch(() => {
      this.setData({ isLoading: false });
      // Error toast is now handled by the api module
    });
  },

  loadMoreTasks() {
    this.fetchTasks();
  },

  formatTask(task) {
    // Format task data to match the list-card component's expected structure
    return {
      _id: task._id,
      title: task.title,
      reward: task.reward,
      status: task.status,
      statusText: this.getStatusText(task.status),
      tags: task.tags || [],
      info: [
        { icon: 'business_center', text: `发布方: ${task.publisherInfo.nickName || '匿名用户'}` },
        { icon: 'location_on', text: `地点: ${task.address}` },
        { icon: 'event_busy', text: `截止: ${new Date(task.deadline).toLocaleDateString()}` }
      ],
      actions: [] // No actions on the list view
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
    const { itemId } = e.detail;
    wx.navigateTo({
      url: `/pages/task-details/task-details?id=${itemId}`,
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
