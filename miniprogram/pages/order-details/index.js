// miniprogram/pages/order-details/index.js
const config = require('../../utils/config.js');

// Mock database of orders
const MOCK_ORDERS = {
  'order001': {
    _id: 'order001',
    orderNumber: 'DRN20241117-001',
    amount: 1500,
    status: 'inprogress',
    createdAt: new Date('2024-11-17 11:00').toLocaleString(),
    taskInfo: { _id: 'task001', title: '水稻田飞防作业' },
    pilotInfo: { _id: 'pilot001', nickName: '飞手小张' },
    publisherInfo: { _id: 'pub001', nickName: '广州农业合作社' }
  },
  'order002': {
    _id: 'order002',
    orderNumber: 'DRN20241118-002',
    amount: 800,
    status: 'completed',
    createdAt: new Date('2024-11-18 09:30').toLocaleString(),
    taskInfo: { _id: 'task002', title: '果园航拍摄影' },
    pilotInfo: { _id: 'pilot002', nickName: '飞手小李' },
    publisherInfo: { _id: 'pub002', nickName: '桂林旅游发展局' }
  }
};

Page({
  data: {
    order: null,
    orderId: null
  },

  onLoad(options) {
    const orderId = options.id;
    if (orderId) {
      this.setData({ orderId });
      this.fetchOrderDetails(orderId);
    }
  },

  fetchOrderDetails(orderId) {
    // Simulate an API call
    const orderData = MOCK_ORDERS[orderId];
    if (orderData) {
      orderData.statusText = config.ORDER_STATUS_MAP[orderData.status] || '未知';
      this.setData({
        order: orderData
      });
    }
  }
});
