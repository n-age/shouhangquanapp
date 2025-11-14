// miniprogram/pages/auth-pilot/auth-pilot.js
const api = require('../../utils/api.js');

Page({
  data: {
    certificateTypes: ['民航局UTC执照', '中国AOPA合格证', 'ASFC证书'],
    certificateIndex: null,
    certificateNumber: '',
    certificateImageUrl: '',
    canSubmit: false,
  },

  validateForm() {
    const { certificateIndex, certificateNumber, certificateImageUrl } = this.data;
    const isFormValid = certificateIndex !== null &&
                        certificateNumber.trim().length > 0 &&
                        certificateImageUrl;
    this.setData({ canSubmit: !!isFormValid });
  },

  onPickerChange(e) {
    this.setData({ certificateIndex: e.detail.value }, () => this.validateForm());
  },

  onInput(e) {
    this.setData({ certificateNumber: e.detail.value }, () => this.validateForm());
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        this.setData({ certificateImageUrl: res.tempFiles[0].tempFilePath }, () => this.validateForm());
      }
    });
  },

  submit() {
    if (!this.data.canSubmit) return;

    wx.showLoading({ title: '正在提交...' });
    const { certificateTypes, certificateIndex, certificateNumber, certificateImageUrl } = this.data;
    const cloudPath = `auth-images/pilot-cert-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    wx.cloud.uploadFile({
      cloudPath: cloudPath + certificateImageUrl.match(/\.[^.]+?$/)[0],
      filePath: certificateImageUrl
    }).then(res => {
      return api.submitPilotAuth({
        certificateType: certificateTypes[certificateIndex],
        certificateNumber,
        certificateFileID: res.fileID
      });
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '提交成功！', icon: 'success', duration: 2000 });
      setTimeout(() => wx.navigateBack(), 2000);
    }).catch(err => {
      wx.hideLoading();
      console.error('Pilot auth submission failed:', err);
    });
  },

  navigateBack() {
    wx.navigateBack();
  }
});
