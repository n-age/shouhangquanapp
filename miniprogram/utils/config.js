// miniprogram/utils/config.js

const ORDER_STATUS_MAP = {
  pending_payment: '待支付',
  in_progress: '进行中',
  pending_confirmation: '待确认',
  completed: '已完成',
  cancelled: '已取消',
};

const CERTIFICATE_TYPES = [
  '民航局UTC执照',
  '中国AOPA合格证',
  'ASFC证书'
];

const TASK_CATEGORIES = [
  '航拍摄影',
  '测绘勘察',
  '农业植保',
  '巡检安防',
  '影视制作'
];

module.exports = {
  ORDER_STATUS_MAP,
  CERTIFICATE_TYPES,
  TASK_CATEGORIES,
};
