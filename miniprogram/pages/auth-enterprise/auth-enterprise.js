// miniprogram/pages/auth-enterprise/auth-enterprise.js
const api = require('../../utils/api.js');

Page({
  data: {
    enterpriseName: '',
    creditCode: '',
    licenseImageUrl: '',
    licenseFileID: '',
    canSubmit: false,
  },

  validateForm() {
    const { enterpriseName, creditCode, licenseImageUrl } = this.data;
    const isFormValid = enterpriseName.trim().length > 0 &&
                        creditCode.trim().length === 18 &&
                        licenseImageUrl;
    this.setData({ canSubmit: !!isFormValid });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value }, () => this.validateForm());
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        this.setData({ licenseImageUrl: res.tempFiles[0].tempFilePath }, () => this.validateForm());
      }
    });
  },

  submit() {
    if (!this.data.canSubmit) return;

    wx.showLoading({ title: '正在提交...' });
    const { enterpriseName, creditCode, licenseImageUrl } = this.data;
    const cloudPath = `auth-images/license-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    wx.cloud.uploadFile({
      cloudPath: cloudPath + licenseImageUrl.match(/\.[^.]+?$/)[0],
      filePath: licenseImageUrl
    }).then(res => {
      return api.submitEnterpriseAuth({
        enterpriseName,
        creditCode,
        licenseFileID: res.fileID
      });
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '提交成功！', icon: 'success', duration: 2000 });
      setTimeout(() => wx.navigateBack(), 2000);
    }).catch(err => {
      wx.hideLoading();
      console.error('Enterprise auth submission failed:', err);
      // Error toast is already handled by api.js or uploadFile's implicit reject
    });
  },

  navigateBack() {
    wx.navigateBack();
  }
});
