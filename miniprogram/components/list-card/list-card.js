// miniprogram/components/list-card/list-card.js
Component({
  properties: {
    item: {
      type: Object,
      value: {}
    }
  },
  data: {},
  methods: {
    onTap() {
      // Trigger a custom event to notify the parent page
      this.triggerEvent('cardtap', { itemId: this.data.item._id });
    }
  }
});
