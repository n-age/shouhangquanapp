// miniprogram/pages/order-list/order-list.js
const app = getApp();

Page({
  data: {
    tabs: [
      { label: '全部', status: 'all' },
      { label: '待支付', status: 'pending_payment' },
      { label: '进行中', status: 'in_progress' },
      { label: '待确认', status: 'pending_confirmation' },
      { label: '已完成', status: 'completed' }
    ],
    currentTab: 'all',
    orderList: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false,
  },

  onLoad(options) {
    // Wait for login to complete before fetching data
    app.waitForLogin().then(() => {
        this.fetchOrders();
    });
  },

const api = require('../../utils/api.js');
const config = require('../../utils/config.js');

// ...
  fetchOrders(isLoadMore = false) {
    if (!this.data.hasMore && isLoadMore) return;
    if (this.data.isLoading) return;
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
    }).catch(() => this.setData({ isLoading: false }));
  },

  onTabClick(e) {
    const { status } = e.currentTarget.dataset;
    this.setData({
      currentTab: status,
      orderList: [],
      page: 1,
      hasMore: true,
    }, () => {
      this.fetchOrders();
    });
  },

  loadMoreOrders() {
    this.fetchOrders(true);
  },

  goToOrderDetail(e) {
      const { id } = e.currentTarget.dataset;
      wx.navigateTo({
          url: `/pages/order-details/order-details?id=${id}`,
      });
  },

  navigateBack() {
    wx.navigateBack();
  }
});
