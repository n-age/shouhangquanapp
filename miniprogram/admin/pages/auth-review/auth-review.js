// miniprogram/admin/pages/auth-review/auth-review.js
Page({
  data: {
    pendingList: [],
    pendingCount: 0,
    isLoading: true,
  },

  onLoad(options) {
    // 页面加载时获取待审核列表
    this.getPendingAuths();
  },

  onShow() {
    // 每次进入页面时都刷新列表，确保数据最新
    this.getPendingAuths();
  },

  getPendingAuths() {
    this.setData({ isLoading: true });
    wx.cloud.callFunction({
      name: 'admin',
      data: {
        action: 'getPendingAuths'
      },
      success: res => {
        if (res.result && res.result.errCode === 0) {
          const formattedList = res.result.data.map(item => {
            return {
              ...item,
              icon: this.getIconForType(item.type),
              title: this.getTitleForType(item.type, item.data),
              description: this.getDescriptionForType(item.type, item.data),
              timeSince: this.formatTimeSince(item.createdAt)
            };
          });
          this.setData({
            pendingList: formattedList,
            pendingCount: formattedList.length,
            isLoading: false
          });
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' });
          this.setData({ isLoading: false });
        }
      },
      fail: err => {
        wx.showToast({ title: '请求失败', icon: 'none' });
        this.setData({ isLoading: false });
        console.error("Failed to get pending auths: ", err);
      }
    });
  },

  getIconForType(type) {
    switch (type) {
      case 'realName': return 'badge';
      case 'enterprise': return 'business_center';
      case 'pilot': return 'flight_takeoff';
      default: return 'help';
    }
  },

  getTitleForType(type, data) {
    switch (type) {
      case 'realName': return '实名认证申请';
      case 'enterprise': return '企业认证申请';
      case 'pilot': return '飞手认证申请';
      default: return '未知认证申请';
    }
  },

  getDescriptionForType(type, data) {
    // 示例，可以根据具体data内容来生成描述
    if (data && data.realName) return `申请人: ${data.realName}`;
    if (data && data.enterpriseName) return `企业: ${data.enterpriseName}`;
    return '详情待查';
  },

  formatTimeSince(dateString) {
    // 简单的相对时间格式化
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " 年前";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " 月前";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " 天前";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " 小时前";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " 分钟前";
    return "刚刚";
  },

  goToReviewDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/admin/pages/auth-review-detail/auth-review-detail?id=${id}` });
  },

  navigateBack() {
    wx.navigateBack();
  }
});
