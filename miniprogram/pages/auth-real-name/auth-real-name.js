// miniprogram/pages/auth-real-name/auth-real-name.js
Page({
  data: {
    realName: '',
    idCardNumber: '',
    idCardImageUrl: '', // 用于本地预览
    idCardFileID: '', // 用于存储上传到云存储后的FileID
    canSubmit: false
  },

  onLoad(options) {
    // 页面加载时的初始化逻辑
  },

  validateForm() {
    const { realName, idCardNumber, idCardImageUrl } = this.data;
    // 简单的验证逻辑：确保所有字段都已填写
    // 实际项目中会加入更复杂的验证，如身份证号格式验证
    const isValid = realName.trim().length > 0 && idCardNumber.trim().length === 18 && idCardImageUrl;
    this.setData({
      canSubmit: isValid
    });
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    }, () => {
      this.validateForm();
    });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success: res => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          idCardImageUrl: tempFilePath
        }, () => {
          this.validateForm();
        });
      }
    })
  },

  submit() {
    if (!this.data.canSubmit) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '正在提交...',
    });

    const { realName, idCardNumber, idCardImageUrl } = this.data;
    const cloudPath = `auth-images/id-card-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 1. 上传图片到云存储
    wx.cloud.uploadFile({
      cloudPath: cloudPath + idCardImageUrl.match(/\.[^.]+?$/)[0],
      filePath: idCardImageUrl,
      success: res => {
        this.setData({
          idCardFileID: res.fileID
        });

        // 2. 调用云函数提交认证信息
        wx.cloud.callFunction({
          name: 'auth',
          data: {
            action: 'submitRealNameAuth',
            authData: {
              realName: realName,
              idCardNumber: idCardNumber,
              idCardFileID: res.fileID
            }
          },
          success: authRes => {
            wx.hideLoading();
            wx.showToast({
              title: '提交成功！',
              icon: 'success',
              duration: 2000
            });
            // 提交成功后，可以跳转到认证中心页面或上一个页面
            setTimeout(() => {
              wx.navigateBack();
            }, 2000);
          },
          fail: err => {
            wx.hideLoading();
            wx.showToast({
              title: '提交失败，请重试',
              icon: 'none'
            });
            console.error('[云函数] [auth] 调用失败', err);
          }
        });
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '图片上传失败',
          icon: 'none'
        });
        console.error('[上传文件] 失败：', err);
      }
    });
  }
});
