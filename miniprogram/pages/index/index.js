// miniprogram/pages/index/index.js
Page({
  data: {
    categories: [
      { text: "植保作业" },
      { text: "航拍摄影" },
      { text: "电力巡检" },
      { text: "全部服务" }
    ],
    news: [
      { text: "T50无人机现已全面上市，性能卓越！" }
    ],
    tasks: [
      {
        id: 1,
        title: "水稻田飞防作业",
        reward: 1500,
        location: "广东省广州市",
        area: "100亩",
        tags: ["加急"]
      },
      {
        id: 2,
        title: "果园航拍摄影",
        reward: 800,
        location: "广西壮族自治区桂林市",
        description: "3分钟宣传片素材",
        tags: []
      }
    ]
  },
  onLoad: function (options) {

  },
});
