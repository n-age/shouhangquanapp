// miniprogram/app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入您的环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'YOUR_ENV_ID_HERE', //  <-- 在部署文档中已指示用户修改此处
        traceUser: true,
      });
    }

    this.globalData = {
      userInfo: null,
      openid: null
    };

    // 尝试获取用户登录态
    this.getUserOpenId();
  },

  getUserOpenId: function() {
    wx.cloud.callFunction({
      name: 'auth', // 假设auth云函数中有'getOpenId'的action
      data: {
        action: 'getOpenId'
      },
      success: res => {
        if (res.result && res.result.openid) {
          this.globalData.openid = res.result.openid;
          // 后续可以根据openid查询用户信息
        }
      },
      fail: err => {
        console.error('[云函数] [auth:getOpenId] 调用失败', err);
      }
    });
  }
});
