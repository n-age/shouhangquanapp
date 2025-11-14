// miniprogram/pages/my-profile/my-profile.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false
  },

  onLoad() {
    // Watch for changes in global userInfo
    app.watch('userInfo', this.userInfoHandler);
  },

  onUnload() {
    // Unwatch to prevent memory leaks
    app.unwatch('userInfo', this.userInfoHandler);
  },

  userInfoHandler(userInfo) {
    this.setData({
      userInfo: userInfo,
      isLoggedIn: !!userInfo
    });
  },

  onShow() {
    // Set initial data on show
    this.userInfoHandler(app.globalData.userInfo);
  },

  handleLogin() {
    if (this.data.isLoggedIn) return;

    // 推荐使用 wx.getUserProfile 获取用户信息，而非 wx.getUserInfo
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        const userInfo = res.userInfo;
const api = require('../../utils/api.js');
// ...
    api.updateProfile(userInfo).then(() => {
      const newUserInfo = { ...app.globalData.userInfo, ...userInfo };
      app._updateGlobalData('userInfo', newUserInfo);
      // The watcher will update the current page's data
        });
      },
      fail: () => {
        wx.showToast({ title: '授权失败', icon: 'none'});
      }
    });
  },

  navigateToPage(e) {
    const { url } = e.currentTarget.dataset;
    if (!this.data.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({ url });
  }
});
