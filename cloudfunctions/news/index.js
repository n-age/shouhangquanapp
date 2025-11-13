// cloudfunctions/news/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, params } = event;

  switch (action) {
    case 'getNewsList':
      return await getNewsList(params);
    // 可以在此添加其他新闻相关的action, 如 'getNewsDetail'
    default:
      return {
        errCode: 404,
        errMsg: 'Action not found'
      };
  }
};

/**
 * 获取新闻列表（分页、分类）
 * @param {object} params - 查询参数 { category, page, pageSize }
 */
async function getNewsList(params) {
  const { category, page = 1, pageSize = 10 } = params;

  try {
    const query = {
      isPublished: true // 只查询已发布的文章
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    const newsCollection = db.collection('News');

    const totalResult = await newsCollection.where(query).count();
    const total = totalResult.total;

    const newsResult = await newsCollection
      .where(query)
      .orderBy('publishedAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .field({ // 列表页不需要完整的文章内容，减少数据传输
        title: 1,
        coverImageUrl: 1,
        author: 1, // 'author' in schema is 'source' on frontend
        category: 1,
        publishedAt: 1,
        createdAt: 1,
      })
      .get();

    return {
      errCode: 0,
      errMsg: 'Success',
      data: newsResult.data,
      total: total,
      hasMore: (page * pageSize) < total
    };

  } catch (e) {
    console.error('Error in getNewsList:', e);
    return {
      errCode: 500,
      errMsg: 'Database operation failed',
      error: e
    };
  }
}
