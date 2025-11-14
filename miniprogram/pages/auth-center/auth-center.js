// miniprogram/pages/auth-center/auth-center.js
const app = getApp();

Page({
  data: {
    authStatus: {
      realName: 'unverified',
      enterprise: 'unverified',
      pilot: 'unverified',
      realNameText: '未认证',
      enterpriseText: '未认证',
      pilotText: '未认证',
    }
  },

  onShow() {
    // onShow ensures the status is updated every time the page is viewed
    this.updateAuthStatus();
  },

  updateAuthStatus() {
    const userInfo = app.globalData.userInfo;
    if (!userInfo) {
      // Handle case where user info is not loaded yet
      app.waitForLogin().then(user => this.processStatus(user));
    } else {
      this.processStatus(userInfo);
    }
  },

  processStatus(userInfo) {
    // This is a simplified logic. A real application might fetch the latest
    // pending status from a dedicated API if a user has multiple applications.
    const statusMap = {
      unverified: '未认证',
      pending: '审核中',
      approved: '已通过',
      rejected: '已驳回',
    };

    // For simplicity, we directly use the user flags.
    // A more complex logic would be to query the Authentications collection
    // to find 'pending' or 'rejected' states.
    const getStatus = (verifiedFlag) => verifiedFlag ? 'approved' : 'unverified';

    const realNameStatus = getStatus(userInfo.isRealNameVerified);
    const enterpriseStatus = getStatus(userInfo.isEnterpriseVerified);
    const pilotStatus = getStatus(userInfo.isPilotVerified);

    this.setData({
      authStatus: {
        realName: realNameStatus,
        enterprise: enterpriseStatus,
        pilot: pilotStatus,
        realNameText: statusMap[realNameStatus],
        enterpriseText: statusMap[enterpriseStatus],
        pilotText: statusMap[pilotStatus],
      }
    });
  },

  navigateToAuth(e) {
    const { type, status } = e.currentTarget.dataset;

    if (status === 'approved') {
      return wx.showToast({ title: '您已通过此项认证', icon: 'none' });
    }
    if (status === 'pending') {
      return wx.showToast({ title: '您的申请正在审核中', icon: 'none' });
    }

    const urlMap = {
      realName: '/pages/auth-real-name/auth-real-name',
      enterprise: '/pages/auth-enterprise/auth-enterprise',
      pilot: '/pages/auth-pilot/auth-pilot',
    };

    const url = urlMap[type];
    if (url) {
      wx.navigateTo({ url });
    }
  },

  navigateBack() {
    wx.navigateBack();
  }
});
