// miniprogram/utils/config.js

const ORDER_STATUS_MAP = {
  'all': '全部',
  'pending_payment': '待支付',
  'in_progress': '进行中',
  'pending_confirmation': '待确认',
  'completed': '已完成',
  'cancelled': '已取消'
};

const TASK_STATUS_MAP = {
  'open': '招募中',
  'in_progress': '进行中',
  'completed': '已完成',
  'cancelled': '已取消'
};

const AUTH_TYPE_MAP = {
  'realName': '实名认证',
  'enterprise': '企业认证',
  'pilot': '飞手认证'
}

module.exports = {
  ORDER_STATUS_MAP,
  TASK_STATUS_MAP,
  AUTH_TYPE_MAP
};
