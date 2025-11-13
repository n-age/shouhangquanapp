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

  onLaunch: function () {
    // ... (cloud init code remains the same)

    this.globalData = {
      userInfo: null,
      openid: null,
      isLoggedIn: false,
    };

    // Encapsulate login in a promise
    this.loginPromise = this.doLogin();
  },

  doLogin: function() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'users',
        data: {
          action: 'login',
          userInfo: {} // Initially pass empty user info
        }
      }).then(res => {
        if (res.result && res.result.errCode === 0) {
          console.log('Login successful, user data:', res.result.data);
          this.globalData.userInfo = res.result.data;
          this.globalData.openid = res.result.data._openid;
          this.globalData.isLoggedIn = true;
          // If there are callbacks waiting for login, execute them
          if (this.loggedInCallback) {
            this.loggedInCallback(res.result.data);
          }
          resolve(res.result.data);
        } else {
          console.error('[云函数] [users:login] failed:', res.result.errMsg);
          reject(new Error(res.result.errMsg));
        }
      }).catch(err => {
        console.error('[云函数] [users:login] call failed:', err);
        reject(err);
      });
    });
  },

  // Provide a function for pages to wait for login completion
  waitForLogin: function() {
    return this.loginPromise;
  }
});
