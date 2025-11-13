// miniprogram/pages/profile-pilot/profile-pilot.js
Page({
  data: {
    pilotId: null,
    pilotInfo: {
      // 默认的空数据结构，防止WXML渲染时报错
      avatarUrl: '',
      nickName: '加载中...',
      level: '',
      bio: '',
      stats: {
        flightHours: 0,
        completedTasks: 0,
        rating: 'N/A'
      },
      skills: [],
      completedMissions: []
    },
    isLoading: true,
  },

  onLoad(options) {
    const pilotId = options.id;
    if (pilotId) {
      this.setData({ pilotId });
      this.fetchPilotProfile(pilotId);
    } else {
      wx.showToast({
        title: '缺少飞手ID',
        icon: 'none',
        complete: () => wx.navigateBack()
      });
    }
  },

const api = require('../../utils/api.js');
// ...
  fetchPilotProfile(pilotId) {
    this.setData({ isLoading: true });
    api.getPilotProfile(pilotId).then(res => {
      this.setData({
        pilotInfo: res.data,
        isLoading: false
      });
    }).catch(() => this.setData({ isLoading: false }));
  },

  navigateBack() {
    wx.navigateBack();
  }
});
