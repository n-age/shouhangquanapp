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

  fetchPilotProfile(pilotId) {
    this.setData({ isLoading: true });

    wx.cloud.callFunction({
      name: 'users',
      data: {
        action: 'getPilotProfile',
        params: { pilotId: pilotId }
      },
      success: res => {
        if (res.result && res.result.errCode === 0) {
          this.setData({
            pilotInfo: res.result.data,
            isLoading: false
          });
        } else {
          wx.showToast({ title: res.result.errMsg || '加载失败', icon: 'none' });
          this.setData({ isLoading: false });
        }
      },
      fail: (err) => {
        wx.showToast({ title: '请求失败', icon: 'none' });
        this.setData({ isLoading: false });
        console.error("Failed to fetch pilot profile:", err);
      }
    });
  },

  navigateBack() {
    wx.navigateBack();
  }
});
