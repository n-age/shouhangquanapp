// miniprogram/pages/order-list/order-list.js
const app = getApp();
const api = require('../../utils/api.js');
const config = require('../../utils/config.js');

Page({
  data: {
    tabs: Object.keys(config.ORDER_STATUS_MAP).map(key => ({
        label: config.ORDER_STATUS_MAP[key],
        status: key
    })),
    currentTab: 'all',
    orderList: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false,
  },

  onLoad(options) {
    app.waitForLogin().then(() => {
        this.fetchOrders();
    });
  },

  onPullDownRefresh() {
    this.resetAndFetch();
  },

  onReachBottom() {
      this.fetchOrders(true);
  },

  fetchOrders(isLoadMore = false) {
    if ((!this.data.hasMore && isLoadMore) || this.data.isLoading) return;
    this.setData({ isLoading: true });

    api.getOrderList({
      status: this.data.currentTab,
      page: this.data.page,
      pageSize: this.data.pageSize
    }).then(res => {
      this.setData({
        orderList: isLoadMore ? [...this.data.orderList, ...res.data] : res.data,
        hasMore: res.hasMore,
        page: this.data.page + 1,
        isLoading: false
      });
    }).catch(() => this.setData({ isLoading: false }))
      .finally(() => wx.stopPullDownRefresh());
  },

  resetAndFetch() {
    this.setData({
      orderList: [],
      page: 1,
      hasMore: true,
    }, () => {
      this.fetchOrders();
    });
  },

  onTabClick(e) {
    const { status } = e.currentTarget.dataset;
    this.setData({ currentTab: status });
    this.resetAndFetch();
  },

  goToOrderDetail(e) {
      const { itemId } = e.detail;
      wx.navigateTo({
          url: `/pages/order-details/order-details?id=${itemId}`,
      });
  },

  navigateBack() {
    wx.navigateBack();
  }
});
