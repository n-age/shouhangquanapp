// miniprogram/components/list-card/list-card.js
const config = require('../../utils/config.js');

Component({
  properties: {
    item: {
      type: Object,
      value: {},
      observer: 'formatItem' // Re-format the item whenever it changes
    },
    type: {
      type: String, // 'task', 'order', 'review'
      value: 'task'
    }
  },

  data: {
    formattedItem: {}
  },

  methods: {
    formatItem(newItem) {
      if (!newItem || !this.properties.type) {
        return;
      }
      let formatted = {};
      switch (this.properties.type) {
        case 'task':
          formatted = this.formatTask(newItem);
          break;
        case 'order':
          formatted = this.formatOrder(newItem);
          break;
        case 'review':
            formatted = this.formatReview(newItem);
            break;
      }
      this.setData({
        formattedItem: formatted
      });
    },

    formatTask(task) {
      return {
        _id: task._id,
        title: task.title,
        reward: `¥${task.reward}`,
        statusClass: task.status,
        statusText: config.TASK_STATUS_MAP[task.status] || '未知',
        tags: task.tags || [],
        info: [
          { icon: 'business_center', text: `发布方: ${task.publisherInfo?.nickName || '匿名用户'}` },
          { icon: 'location_on', text: `地点: ${task.address}` },
          { icon: 'event_busy', text: `截止: ${new Date(task.deadline).toLocaleDateString()}` }
        ],
        actions: []
      };
    },

    formatOrder(order) {
      return {
        _id: order._id,
        title: order.taskInfo?.title || '订单信息',
        reward: `¥${order.amount}`,
        statusClass: order.status,
        statusText: config.ORDER_STATUS_MAP[order.status] || '未知',
        tags: [],
        info: [
           { icon: 'numbers', text: `订单号: ${order.orderNumber}` },
           { icon: 'calendar_today', text: `创建时间: ${new Date(order.createdAt).toLocaleString()}` }
        ],
        actions: [ { text: '查看详情', type: 'primary' } ]
      };
    },

    formatReview(auth) {
        return {
            _id: auth._id,
            title: `${auth.userInfo.nickName}的${config.AUTH_TYPE_MAP[auth.type] || '认证'}申请`,
            reward: '',
            statusClass: 'pending',
            statusText: '待审核',
            tags: [],
            info: [
                { icon: 'badge', text: `申请类型: ${config.AUTH_TYPE_MAP[auth.type] || '未知'}` },
                { icon: 'calendar_today', text: `申请时间: ${new Date(auth.createdAt).toLocaleString()}` }
            ],
            actions: [ { text: '前往审核', type: 'primary' } ]
        }
    },

    onTap() {
      // Trigger an event that the parent page can listen to
      this.triggerEvent('cardtap', { itemId: this.data.formattedItem._id });
    }
  }
});
