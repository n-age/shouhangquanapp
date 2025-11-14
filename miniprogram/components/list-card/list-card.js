// miniprogram/components/list-card/list-card.js
const config = require('../../utils/config.js');

Component({
  properties: {
    item: { type: Object, value: {} },
    type: { type: String, value: 'task' } // 'task' or 'order'
  },
  data: {
    formattedItem: {}
  },
  lifetimes: {
    attached() {
      this.formatData();
    }
  },
  methods: {
    formatData() {
      const originalItem = this.data.item;
      let formatted = {};

      if (this.data.type === 'task') {
        formatted = {
          _id: originalItem._id,
          title: originalItem.title,
          reward: originalItem.reward,
          status: originalItem.status,
          statusText: config.ORDER_STATUS_MAP[originalItem.status] || '未知',
          tags: originalItem.tags || [],
          info: [
            { icon: 'business_center', text: `发布方: ${originalItem.publisherInfo.nickName || '匿名'}` },
            { icon: 'location_on', text: `地点: ${originalItem.address}` },
            { icon: 'event_busy', text: `截止: ${new Date(originalItem.deadline).toLocaleDateString()}` }
          ],
          actions: []
        };
      } else if (this.data.type === 'order') {
        formatted = {
          _id: originalItem._id,
          title: originalItem.taskInfo.title,
          reward: null,
          status: originalItem.status,
          statusText: config.ORDER_STATUS_MAP[originalItem.status] || '未知',
          tags: [],
          info: [
              { icon: 'numbers', text: `金额: ¥${originalItem.amount}` },
              { icon: 'schedule', text: `下单时间: ${new Date(originalItem.createdAt).toLocaleString()}` }
          ],
          actions: [{ text: '查看详情', type: 'primary' }]
        };
      }
      this.setData({ formattedItem: formatted });
    },
    onTap() {
      this.triggerEvent('cardtap', { itemId: this.data.item._id });
    }
  }
});
