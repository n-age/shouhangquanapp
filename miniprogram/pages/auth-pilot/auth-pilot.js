// miniprogram/pages/auth-pilot/auth-pilot.js
const api = require('../../utils/api.js');
const config = require('../../utils/config.js');

Page({
  data: {
    certificateTypes: config.CERTIFICATE_TYPES,
    certificateIndex: null,
    certificateNumber: '',
    // canSubmit is now handled implicitly by checking form fields before submit
  },

  onPickerChange(e) {
    this.setData({ certificateIndex: e.detail.value });
  },

  onInput(e) {
    this.setData({ certificateNumber: e.detail.value });
  },

  submit() {
    const { certificateTypes, certificateIndex, certificateNumber } = this.data;
    if (certificateIndex === null || !certificateNumber.trim()) {
      return wx.showToast({ title: '请填写所有信息', icon: 'none' });
    }

    const uploader = this.selectComponent('#uploader');
    if (!uploader.data.tempFilePath) {
        return wx.showToast({ title: '请上传证书照片', icon: 'none' });
    }

    wx.showLoading({ title: '正在提交...' });
    const cloudPath = `auth-images/pilot-cert-${Date.now()}`;

    uploader.upload(cloudPath).then(fileID => {
      return api.submitPilotAuth({
        certificateType: certificateTypes[certificateIndex],
        certificateNumber,
        certificateFileID: fileID
      });
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '提交成功！', icon: 'success', duration: 2000 });
      setTimeout(() => wx.navigateBack(), 2000);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
      console.error('Pilot auth submission failed:', err);
    });
  },

  navigateBack() {
    wx.navigateBack();
  }
});
