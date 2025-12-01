// miniprogram/pages/task-hall/task-hall.js
const api = require('../../utils/api.js');
const app = getApp();

Page({
  data: {
    taskList: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false,
    filters: {}
  },

  onLoad(options) {
    app.waitForLogin().then(() => {
        this.fetchTasks();
    });
  },

  onShow() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 0
        })
      }
      // Refresh data in case of changes
      this.onPullDownRefresh();
  },

  onSearchInput(e) {
    this.setData({
      'filters.keyword': e.detail.value,
      taskList: [],
      page: 1,
      hasMore: true,
    });
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.fetchTasks(), 300);
  },

  onFilterTap(e) {
      const filterType = e.currentTarget.dataset.type;
      wx.showToast({
        title: `Filter by ${filterType} (not yet implemented)`,
        icon: 'none'
      });
  },

  onPullDownRefresh() {
    this.setData({
      taskList: [],
      page: 1,
      hasMore: true,
    });
    this.fetchTasks().finally(() => {
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
      this.setData({
        taskList: this.data.taskList.concat(res.data),
        hasMore: res.hasMore,
        page: this.data.page + 1,
        isLoading: false
      });
    }).catch(() => {
      this.setData({ isLoading: false });
    });
  },

  handleCardTap(e) {
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
