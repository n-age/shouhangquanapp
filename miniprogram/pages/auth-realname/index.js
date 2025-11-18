// miniprogram/pages/auth-realname/index.js
Page({
  data: {
    formData: {
      realName: '',
      idCardNumber: ''
    },
    idCardFrontUrl: '',
    idCardBackUrl: ''
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  uploadImage(e) {
    const type = e.currentTarget.dataset.type;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        if (type === 'front') {
          this.setData({ idCardFrontUrl: tempFilePath });
        } else if (type === 'back') {
          this.setData({ idCardBackUrl: tempFilePath });
        }
      }
    });
  },

  handleSubmit() {
    const { realName, idCardNumber } = this.data.formData;
    const { idCardFrontUrl, idCardBackUrl } = this.data;

    if (!realName || !idCardNumber || !idCardFrontUrl || !idCardBackUrl) {
      wx.showToast({
        title: '请填写所有信息并上传照片',
        icon: 'none'
      });
      return;
    }

    // Simulate API submission
    console.log('Submitting real name auth data:', { ...this.data.formData, idCardFrontUrl, idCardBackUrl });
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
