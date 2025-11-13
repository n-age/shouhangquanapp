// miniprogram/pages/news-list/news-list.js
Page({
  data: {
    categories: [
      { id: 'all', name: '全部' },
      { id: 'industry', name: '行业动态' },
      { id: 'policy', name: '政策法规' },
      { id: 'technology', name: '技术前沿' },
      { id: 'stories', name: '飞手故事' }
    ],
    currentCategory: 'all',
    newsList: [],
    isLoading: true,
    page: 1,
    hasMore: true,
  },

  onLoad(options) {
    this.fetchNews();
  },

const api = require('../../utils/api.js');
// ...
  fetchNews(isLoadMore = false) {
    if (!this.data.hasMore && isLoadMore) return;
    this.setData({ isLoading: true });

    api.getNewsList({
      category: this.data.currentCategory,
      page: this.data.page,
      pageSize: 10
    }).then(res => {
      const fetchedList = res.data.map(item => ({
        ...item,
        timeSince: this.formatTimeSince(item.publishedAt || item.createdAt)
      }));
      this.setData({
        newsList: isLoadMore ? [...this.data.newsList, ...fetchedList] : fetchedList,
        hasMore: res.hasMore,
        isLoading: false
      });
    }).catch(() => this.setData({ isLoading: false }));
  },

  onCategoryTap(e) {
    const { id } = e.currentTarget.dataset;
    if (this.data.currentCategory === id) return;

    this.setData({
      currentCategory: id,
      page: 1,
      newsList: [],
      hasMore: true
    });
    this.fetchNews();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.setData({ page: this.data.page + 1 });
      this.fetchNews(true);
    }
  },

  goToNewsDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/news-details/news-details?id=${id}`,
    });
  },

  formatTimeSince(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    let interval = seconds / 86400;
    if (interval > 3) return new Date(dateString).toLocaleDateString();
    if (interval > 1) return Math.floor(interval) + "天前";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "小时前";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "分钟前";
    return "刚刚";
  }
});
