// miniprogram/pages/task-details/index.js
const config = require('../../utils/config.js');

// Mock database of tasks
const MOCK_TASKS = {
  'task001': {
    _id: 'task001',
    title: '水稻田飞防作业',
    reward: 1500,
    status: 'open',
    address: '广东省广州市天河区',
    deadline: new Date('2024-11-20').toLocaleDateString(),
    description: '100亩水稻田农药喷洒，要求有经验飞手。',
    publisherInfo: { nickName: '广州农业合作社' }
  },
  'task002': {
    _id: 'task002',
    title: '果园航拍摄影',
    reward: 800,
    status: 'open',
    address: '广西壮族自治区桂林市',
    deadline: new Date('2024-11-25').toLocaleDateString(),
    description: '为果园拍摄宣传片素材，要求高清画质。',
    publisherInfo: { nickName: '桂林旅游发展局' }
  }
};

Page({
  data: {
    task: null,
    taskId: null
  },

  onLoad(options) {
    const taskId = options.id;
    if (taskId) {
      this.setData({ taskId });
      this.fetchTaskDetails(taskId);
    }
  },

  fetchTaskDetails(taskId) {
    // Simulate an API call to fetch task details
    const taskData = MOCK_TASKS[taskId];
    if (taskData) {
      taskData.statusText = config.TASK_STATUS_MAP[taskData.status] || '未知';
      this.setData({
        task: taskData
      });
    }
  }
});
