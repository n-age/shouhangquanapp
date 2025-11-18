// miniprogram/pages/task-create/index.js
Page({
  data: {
    formData: {
      title: '',
      description: '',
      reward: null,
      address: ''
    }
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  handleSubmit() {
    // Basic validation
    const { title, description, reward, address } = this.data.formData;
    if (!title || !description || !reward || !address) {
      wx.showToast({
        title: '请填写所有字段',
        icon: 'none'
      });
      return;
    }

    // Simulate API submission
    console.log('Submitting form data:', this.data.formData);
    wx.showToast({
      title: '发布成功',
      icon: 'success'
    });

    // Navigate back to the task hall after a short delay
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  }
});
