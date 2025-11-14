// miniprogram/pages/task-create/task-create.js
const config = require('../../utils/config.js');

Page({
  data: {
    categories: config.TASK_CATEGORIES,
    categoryIndex: null,
    currentDate: new Date().toISOString().split('T')[0],
    deadline: '',
    location: {
      address: '',
      latitude: null,
      longitude: null,
    },
  },

  bindCategoryChange(e) {
    this.setData({
      categoryIndex: e.detail.value
    });
  },

  bindDateChange(e) {
    this.setData({
      deadline: e.detail.value
    });
  },

  chooseLocation() {
    wx.chooseLocation({
      success: res => {
        this.setData({
          location: {
            address: res.address,
            latitude: res.latitude,
            longitude: res.longitude,
          }
        });
      },
      fail: err => {
        if (err.errMsg.includes('cancel')) return;
        wx.showToast({
          title: '选择地点失败',
          icon: 'none'
        });
      }
    });
  },

  formSubmit(e) {
    const formData = e.detail.value;
    const { location, categoryIndex, categories } = this.data;

    // --- 表单验证 ---
    if (!formData.title.trim()) {
      return wx.showToast({ title: '请输入任务标题', icon: 'none' });
    }
    if (!formData.description.trim()) {
      return wx.showToast({ title: '请输入任务描述', icon: 'none' });
    }
    if (categoryIndex === null) {
      return wx.showToast({ title: '请选择任务类型', icon: 'none' });
    }
    if (!location.address) {
      return wx.showToast({ title: '请选择任务地点', icon: 'none' });
    }
    if (!formData.deadline) {
      return wx.showToast({ title: '请选择截止日期', icon: 'none' });
    }
    if (!formData.reward || parseFloat(formData.reward) <= 0) {
      return wx.showToast({ title: '请输入有效的报酬金额', icon: 'none' });
    }

const api = require('../../utils/api.js');
// ...
    wx.showLoading({ title: '发布中...' });

    const taskData = {
      title: formData.title,
      description: formData.description,
      category: categories[categoryIndex],
      reward: parseFloat(formData.reward),
      deadline: formData.deadline,
      location: {
        address: location.address,
        geo: new wx.cloud.database().Geo.Point(location.longitude, location.latitude)
      }
    };

    api.createTask(taskData).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/task-hall/task-hall' });
      }, 1500);
    }).catch(() => wx.hideLoading());
  },

  navigateBack() {
    wx.navigateBack();
  }
});
