// miniprogram/pages/my-profile/index.js
Page({
  data: {
    user: {
      nickname: "无人机飞手",
      id: "123456"
    },
    authStatus: [
      { name: "实名认证", type: "realname", certified: false },
      { name: "飞手认证", type: "pilot", certified: false },
      { name: "企业认证", type: "enterprise", certified: false }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3 // Set the selected tab to 'My Profile'
      });
    }
  },

  navigateToAuth(e) {
    const authType = e.currentTarget.dataset.type;
    if (authType === 'realname') {
      wx.navigateTo({
        url: '/pages/auth-realname/index',
      });
    } else {
      wx.showToast({
        title: '该功能暂未开放',
        icon: 'none'
      });
    }
  }
});
