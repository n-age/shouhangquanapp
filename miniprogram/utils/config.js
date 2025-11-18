// miniprogram/utils/config.js
const TASK_STATUS_MAP = {
  open: '开放中',
  inprogress: '进行中',
  completed: '已完成',
  closed: '已关闭'
};

const ORDER_STATUS_MAP = {
  all: '全部',
  pending: '待处理',
  inprogress: '服务中',
  completed: '已完成',
  cancelled: '已取消'
};

const AUTH_TYPE_MAP = {
    realname: '实名认证',
    pilot: '飞手认证',
    enterprise: '企业认证'
};


module.exports = {
  TASK_STATUS_MAP,
  ORDER_STATUS_MAP,
  AUTH_TYPE_MAP
};
