const api = require('../../utils/api.js');

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

  onShow() {
    // Refresh data on show in case a task was created or updated
    this.onPullDownRefresh();
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
      title: `Filter by ${filterType} (not implemented yet)`,
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

  onReachBottom() {
    this.fetchTasks();
  },

  fetchTasks() {
    if (!this.data.hasMore || this.data.isLoading) {
      return Promise.resolve();
    }
    this.setData({ isLoading: true });

    return api.getTasks({
      page: this.data.page,
      pageSize: this.data.pageSize,
      filters: this.data.filters
    }).then(res => {
      // Now we pass the raw task data directly to the list
      const fetchedTasks = res.data;
      this.setData({
        taskList: this.data.taskList.concat(fetchedTasks),
        hasMore: res.hasMore,
        page: this.data.page + 1,
        isLoading: false
      });
    }).catch(() => {
      this.setData({ isLoading: false });
    });
  },

  handleCardTap(e) {
    const taskId = e.currentTarget.dataset.item._id;
    wx.navigateTo({
      url: `/pages/task-details/task-details?id=${taskId}`,
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
