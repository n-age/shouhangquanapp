// miniprogram/pages/my-profile/my-profile.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false
  },

  onShow() {
    // 页面显示时，尝试从 globalData 获取用户信息
    // 这是为了确保即使用户信息在后台更新，页面返回时也能展示最新状态
    this.setData({
      userInfo: app.globalData.userInfo,
      isLoggedIn: app.globalData.isLoggedIn
    });

    // 如果 globalData 还没有用户信息，则等待登录完成
    if (!app.globalData.isLoggedIn) {
      app.loggedInCallback = userInfo => {
        this.setData({
          userInfo: userInfo,
          isLoggedIn: true
        });
      };
    }
  },

  handleLogin() {
    if (this.data.isLoggedIn) return;

    // 推荐使用 wx.getUserProfile 获取用户信息，而非 wx.getUserInfo
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        const userInfo = res.userInfo;
        // 在这里，我们应该调用一个云函数来更新用户的头像和昵称
        wx.cloud.callFunction({
          name: 'users',
          data: {
            action: 'updateProfile',
            userInfo: {
              nickName: userInfo.nickName,
              avatarUrl: userInfo.avatarUrl,
              gender: userInfo.gender
            }
          }
        }).then(() => {
          // 更新本地 globalData 和当前页面数据
          app.globalData.userInfo.nickName = userInfo.nickName;
          app.globalData.userInfo.avatarUrl = userInfo.avatarUrl;
          this.setData({
            userInfo: app.globalData.userInfo
          });
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
