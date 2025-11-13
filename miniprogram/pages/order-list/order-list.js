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
// ...
  fetchOrders(isLoadMore = false) {
    if (!this.data.hasMore && isLoadMore) return;
    this.setData({ isLoading: true });

    api.getOrderList({
      status: this.data.currentTab,
      page: this.data.page,
      pageSize: this.data.pageSize
    }).then(res => {
      const formattedList = res.data.map(this.formatOrder);
      this.setData({
        orderList: isLoadMore ? [...this.data.orderList, ...formattedList] : formattedList,
        hasMore: res.hasMore,
        isLoading: false
      });
    }).catch(() => this.setData({ isLoading: false }));
  },

  formatOrder(order) {
      const statusMap = {
        'pending_payment': '待支付', 'in_progress': '进行中', 'pending_confirmation': '待确认',
        'completed': '已完成', 'cancelled': '已取消'
      };
      return {
          ...order,
          statusText: statusMap[order.status] || '未知',
          formattedCreateDate: new Date(order.createdAt).toLocaleString()
      }
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
