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

    // wx.cloud.callFunction({
    //   name: 'users', // 假设有一个名为 'users' 的云函数
    //   data: {
    //     action: 'getPilotProfile',
    //     pilotId: pilotId
    //   },
    //   success: res => {
    //     if (res.result && res.result.errCode === 0) {
    //       this.setData({
    //         pilotInfo: res.result.data,
    //         isLoading: false
    //       });
    //     } else {
    //       wx.showToast({ title: '加载失败', icon: 'none' });
    //     }
    //   },
    //   fail: () => {
    //     wx.showToast({ title: '请求失败', icon: 'none' });
    //   }
    // });

    // --- 使用静态模拟数据 ---
    // 在云函数未实现前，使用模拟数据进行UI开发和测试
    setTimeout(() => {
        this.setData({
            pilotInfo: {
                avatarUrl: '/static/images/default-avatar.png',
                nickName: '无人机大师',
                level: '平台认证高级飞手',
                bio: '拥有超过1200小时安全飞行经验的认证高级飞手。专注于商业航拍、农业植保和3D测绘建模。',
                stats: {
                    flightHours: '1,200+',
                    completedTasks: 85,
                    rating: '4.9'
                },
                skills: ['商业航拍', '农业植保', '测绘与建模', 'FPV'],
                completedMissions: [
                    { id: 1, title: '城市天际线商业宣传片航拍', imageUrl: '/static/images/mission-placeholder-1.png', date: '2023-10-15', location: '上海' },
                    { id: 2, title: '万亩农田植保喷洒作业', imageUrl: '/static/images/mission-placeholder-2.png', date: '2023-09-22', location: '河南' }
                ]
            },
            isLoading: false
        });
    }, 1000);
  },

  navigateBack() {
    wx.navigateBack();
  }
});
