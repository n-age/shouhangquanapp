// miniprogram/pages/auth-pilot/index.js
Page({
  data: {
    formData: {
      droneModel: '',
      experience: null
    },
    licenseUrl: ''
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  uploadLicense() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ licenseUrl: tempFilePath });
      }
    });
  },

  handleSubmit() {
    const { droneModel, experience } = this.data.formData;
    const { licenseUrl } = this.data;

    if (!droneModel || !experience || !licenseUrl) {
      wx.showToast({
        title: '请填写所有信息并上传执照',
        icon: 'none'
      });
      return;
    }

    // Simulate API submission
    console.log('Submitting pilot auth data:', { ...this.data.formData, licenseUrl });
    wx.showLoading({ title: '提交中...' });

    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '提交成功，请等待审核',
        icon: 'success'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 1000);
  }
});
