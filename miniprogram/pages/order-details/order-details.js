// miniprogram/pages/order-details/order-details.js
const app = getApp();

Page({
  data: {
    orderId: null,
    order: null,
    isLoading: true,
    isPublisher: false, // Is the current user the one who published the task?
  },

  onLoad(options) {
    const orderId = options.id;
    if (!orderId) {
      wx.showToast({ title: '缺少订单ID', icon: 'none' });
      return wx.navigateBack();
    }
    this.setData({ orderId });
    app.waitForLogin().then(() => {
      this.fetchOrderDetail(orderId);
    });
  },

const api = require('../../utils/api.js');
// ...
  fetchOrderDetail(orderId) {
    this.setData({ isLoading: true });
    api.getOrderDetail(orderId).then(res => {
      this.setData({
        order: this.formatOrder(res.data),
        isPublisher: res.data.publisherId === app.globalData.userInfo._id,
        isLoading: false
      });
    }).catch(() => this.setData({ isLoading: false }));
  },

  formatOrder(order) {
    const statusMap = {
      pending_payment: { headline: '订单待支付', subline: '请在24小时内完成支付' },
      in_progress: { headline: '订单进行中', subline: '飞手正在努力工作中' },
      pending_confirmation: { headline: '待客户确认', subline: '飞手已提交工作成果' },
      completed: { headline: '订单已完成', subline: '感谢您的使用' },
      cancelled: { headline: '订单已取消', subline: '' }
    };
    const paymentStatusMap = { unpaid: '待支付', paid: '已支付' };

    return {
      ...order,
      statusHeadline: statusMap[order.status]?.headline || '未知状态',
      statusSubline: statusMap[order.status]?.subline || '',
      paymentStatusText: paymentStatusMap[order.paymentStatus] || '未知',
      formattedCreateDate: new Date(order.createdAt).toLocaleString()
    };
  },

  handleAction(e) {
    const { action } = e.currentTarget.dataset;
    wx.showLoading({ title: '处理中...' });

    // The api module has functions like payOrder, confirmCompletion, etc.
    // We can call them dynamically.
    api[`${action}Order`](this.data.orderId).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '操作成功', icon: 'success' });
      this.fetchOrderDetail(this.data.orderId); // Refresh data
    }).catch(() => {
      wx.hideLoading();
      // Error is handled in api.js
    });
  },

  goToTaskDetail() {
      wx.navigateTo({ url: `/pages/task-details/task-details?id=${this.data.order.taskId}` });
  },

  navigateBack() {
    wx.navigateBack();
  }
});
