// main/index.js
'use strict';

// Import handlers for different modules
const adminHandler = require('./admin');
const authHandler = require('./auth');
const newsHandler = require('./news');
const ordersHandler = require('./orders');
const tasksHandler = require('./tasks');
const usersHandler = require('./users');
const imageHandler = require('./image');


exports.main = async (event, context) => {
  // Check if the function was triggered by COS
  if (event.Records && event.Records[0] && event.Records[0].cos) {
    console.log('COS trigger detected. Starting image processing...');
    return await imageHandler.processUpload(event, context);
  }

  // Standard API call routing
  const { type, payload } = event;
  console.log(`Incoming API call type: ${type}`);

  switch (type) {
    // Admin routes
    case 'admin.getReviewList':
      return await adminHandler.getReviewList(event, context);
    case 'admin.review':
      return await adminHandler.review(event, context);

    // Auth routes
    case 'auth.submitRealName':
      return await authHandler.submitRealName(event, context);
    case 'auth.submitEnterprise':
      return await authHandler.submitEnterprise(event, context);
    case 'auth.submitPilot':
      return await authHandler.submitPilot(event, context);
    case 'auth.getAuthStatus':
      return await authHandler.getAuthStatus(event, context);

    // News routes
    case 'news.getNewsList':
      return await newsHandler.getNewsList(event, context);
    case 'news.getNewsDetail':
      return await newsHandler.getNewsDetail(event, context);

    // Orders routes
    case 'orders.createOrder':
      return await ordersHandler.createOrder(event, context);
    case 'orders.getOrderList':
      return await ordersHandler.getOrderList(event, context);
    case 'orders.getOrderDetail':
      return await ordersHandler.getOrderDetail(event, context);
    case 'orders.updateOrderStatus':
        return await ordersHandler.updateOrderStatus(event, context);

    // Tasks routes
    case 'tasks.createTask':
      return await tasksHandler.createTask(event, context);
    case 'tasks.getTasks':
      return await tasksHandler.getTasks(event, context);
    case 'tasks.getTaskDetail':
      return await tasksHandler.getTaskDetail(event, context);
    case 'tasks.getPublishedTasks':
        return await tasksHandler.getPublishedTasks(event, context);

    // Users routes
    case 'users.updateProfile':
      return await usersHandler.updateProfile(event, context);

    default:
      return {
        statusCode: 404,
        body: {
            success: false,
            message: 'Function not found'
        }
      };
  }
};
