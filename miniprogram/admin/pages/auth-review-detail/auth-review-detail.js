// miniprogram/admin/pages/auth-review-detail/auth-review-detail.js
Page({
  data: {
    authId: null,
    authDetail: null,
    isLoading: true,
  },

  onLoad(options) {
    const authId = options.id;
    if (authId) {
      this.setData({ authId });
      this.fetchAuthDetail(authId);
    } else {
      wx.showToast({ title: '缺少认证ID', icon: 'none' });
      wx.navigateBack();
    }
  },

  fetchAuthDetail(authId) {
    this.setData({ isLoading: true });
    wx.cloud.callFunction({
      name: 'admin',
      data: {
        action: 'getAuthDetail',
        params: { authId }
      }
    }).then(res => {
      if (res.result && res.result.errCode === 0) {
        this.setData({
          authDetail: this.formatAuthDetail(res.result.data),
          isLoading: false
        });
      } else {
        this.setData({ isLoading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    }).catch(err => {
      this.setData({ isLoading: false });
      wx.showToast({ title: '请求失败', icon: 'none' });
      console.error("Failed to fetch auth detail:", err);
    });
  },

  formatAuthDetail(detail) {
    const typeMap = { 'realName': '实名认证', 'enterprise': '企业认证', 'pilot': '飞手认证' };
    return {
      ...detail,
      typeText: typeMap[detail.type] || '未知类型',
      userInfo: {
        ...detail.userInfo,
        formattedJoinDate: new Date(detail.userInfo.createdAt).toLocaleDateString()
      }
    };
  },

  onApprove() {
    this.updateAuthStatus('approved');
  },

  onReject() {
    // 实际项目中，这里会弹出一个模态框让管理员填写拒绝原因
    wx.showModal({
      title: '确认拒绝',
      content: '请输入拒绝原因（选填）',
      editable: true,
      success: res => {
        if (res.confirm) {
          this.updateAuthStatus('rejected', res.content || '信息不符合要求');
        }
      }
    });
  },

  updateAuthStatus(status, reason = '') {
    wx.showLoading({ title: '处理中...' });
    wx.cloud.callFunction({
      name: 'admin',
      data: {
        action: 'updateAuthStatus',
        params: {
          authId: this.data.authId,
          status: status,
          reason: reason
        }
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.errCode === 0) {
        wx.showToast({ title: '操作成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '请求异常', icon: 'none' });
    });
  },

  previewImage(e) {
    const { src } = e.currentTarget.dataset;
    if (src) {
      wx.previewImage({
        urls: [src],
      });
    }
  },

  navigateBack() {
    wx.navigateBack();
  },
});
