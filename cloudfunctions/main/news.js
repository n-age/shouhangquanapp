// cloudfunctions/main/news.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * Retrieves a paginated list of news articles.
 * @param {object} event - The event object.
 * @param {object} event.payload - The query parameters.
 * @param {string} [event.payload.category] - The category to filter by.
 * @param {number} [event.payload.page=1] - The page number.
 * @param {number} [event.payload.pageSize=10] - The number of items per page.
 */
async function getNewsList(event, context) {
  const { category, page = 1, pageSize = 10 } = event.payload;

  try {
    const query = { isPublished: true };
    if (category && category.toLowerCase() !== 'all') {
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
      .field({
        content: 0, // Exclude full content for list view
      })
      .get();

    return {
      success: true,
      data: newsResult.data,
      hasMore: (page * pageSize) < total
    };
  } catch (e) {
    console.error('Error in getNewsList:', e);
    return { success: false, message: 'Database operation failed.', error: e.message };
  }
}

/**
 * Retrieves the full details of a single news article.
 * @param {object} event - The event object.
 * @param {object} event.payload - The query parameters.
 * @param {string} event.payload.id - The ID of the news article.
 */
async function getNewsDetail(event, context) {
  const { id } = event.payload;
  if (!id) {
    return { success: false, message: 'News ID is required.' };
  }

  try {
    const newsResult = await db.collection('News').doc(id).get();

    if (!newsResult.data || !newsResult.data.isPublished) {
        return { success: false, message: 'News article not found or not published.' };
    }

    // Optional: Increment view count here
    // await db.collection('News').doc(id).update({ data: { views: db.command.inc(1) } });

    return { success: true, data: newsResult.data };
  } catch (e) {
    console.error('Error in getNewsDetail:', e);
    return { success: false, message: 'Database operation failed.', error: e.message };
  }
}

module.exports = {
  getNewsList,
  getNewsDetail
};
