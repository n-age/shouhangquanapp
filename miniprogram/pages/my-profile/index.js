// miniprogram/pages/my-profile/index.js
Page({
  data: {
    user: {
      avatarUrl: '', // Will remain empty for placeholder
      nickname: "无人机飞手",
      id: "123456"
    },
    authStatus: [
      { name: "实名认证", certified: false },
      { name: "飞手认证", certified: false },
      { name: "企业认证", certified: false }
    ],
    menuItems: [
      { text: "关于我们", url: "/pages/about-us/index" },
      { text: "意见反馈", url: "/pages/feedback/index" }
    ]
  },
  onLoad: function (options) {

  },
});
