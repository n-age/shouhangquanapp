// miniprogram/pages/task-create/task-create.js
Page({
  data: {
    categories: ['航拍摄影', '测绘勘察', '农业植保', '巡检安防', '影视制作'],
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

    wx.showLoading({ title: '发布中...' });

    // 调用云函数创建任务
    wx.cloud.callFunction({
      name: 'tasks',
      data: {
        action: 'createTask',
        taskData: {
          title: formData.title,
          description: formData.description,
          category: categories[categoryIndex],
          reward: parseFloat(formData.reward),
          deadline: formData.deadline,
          location: {
            address: location.address,
            // 创建地理位置点
            geo: new wx.cloud.database().Geo.Point(location.longitude, location.latitude)
          }
        }
      },
      success: res => {
        wx.hideLoading();
        if (res.result && res.result.errCode === 0) {
          wx.showToast({ title: '发布成功', icon: 'success' });
          // 发布成功后，跳转到任务大厅或我的发布列表
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/task-hall/task-hall'
            });
          }, 1500);
        } else {
          wx.showToast({ title: res.result.errMsg || '发布失败', icon: 'none' });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({ title: '请求失败，请重试', icon: 'none' });
        console.error("Failed to create task: ", err);
      }
    });
  },

  navigateBack() {
    wx.navigateBack();
  }
});
