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

  fetchOrderDetail(orderId) {
    this.setData({ isLoading: true });
    wx.cloud.callFunction({
      name: 'orders',
      data: { action: 'getOrderDetail', params: { orderId } }
    }).then(res => {
      if (res.result && res.result.errCode === 0) {
        this.setData({
          order: this.formatOrder(res.result.data),
          isPublisher: res.result.data.publisherId === app.globalData.userInfo._id,
          isLoading: false
        });
      } else {
        this.setData({ isLoading: false });
        wx.showToast({ title: res.result.errMsg || '加载失败', icon: 'none' });
      }
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

    wx.cloud.callFunction({
      name: 'orders',
      data: {
        action: `${action}Order`, // e.g., 'payOrder', 'completeOrder'
        params: { orderId: this.data.orderId }
        // For 'submitWork', you'd include a payload: params: { orderId: '...', submission: {...} }
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.errCode === 0) {
        wx.showToast({ title: '操作成功', icon: 'success' });
        this.fetchOrderDetail(this.data.orderId); // Refresh data
      } else {
        wx.showToast({ title: res.result.errMsg || '操作失败', icon: 'none' });
      }
    }).catch(() => {
        wx.hideLoading();
        wx.showToast({ title: '请求异常', icon: 'none' });
    });
  },

  goToTaskDetail() {
      wx.navigateTo({ url: `/pages/task-details/task-details?id=${this.data.order.taskId}` });
  },

  navigateBack() {
    wx.navigateBack();
  }
});
