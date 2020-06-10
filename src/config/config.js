import { STATIC_IMG_URL } from './baseUrl'

export const CACHE_PREV = 'tc_island_'

// export const APP_ID = 22 // 赚餐平台编号
// export const platformId = 49 // 平台id

export const KEY_ALL = '' // 全部
export const KEY_ORDER_FINISH = 'finish'// 已完成
export const KEY_ORDER_REFUND = 'refund'// 退款
export const KEY_MERCHANT_USER = 'store'// 门店使用
export const KEY_DELIVERY = 'delivery'// 配送到家
export const KEY_ORDER_TIMEOUT = 'expired'// 已过期
export const KEY_ORDER_PENDING = 'pending' // 未完成

export const INDEX_COUPON = 1 // 主页会员权益展示
export const BRAND_COUPON = 8 // 权益页面分享
export const SIZE = 6

export const PAY_WECHAT = 'WECHAT'
export const PAY_BALANCE = 'BALANCE'
export const PAY_STORED = 'STORED'
export const PAYMENT = {
  [PAY_WECHAT]: 2,
  [PAY_BALANCE]: 4,
  [PAY_STORED]: 6
}

export const INDEX_BANNER = 1 // 首页banner图

export const SALE_STATE = { // 商品售卖状态
  0: {
    value: '抢光了',
    class: 'gray'
  },
  1: {
    value: '未开始',
    class: 'gray'
  },
  2: {
    value: '售卖中',
    class: 'red'
  },
  3: {
    value: '已结束',
    class: 'gray'
  }
}


export const MAX_EXPECTED_SEND_DAY = 5

export const SHOP_ACTIVITY_TYPE = {
  BONUS: {
    name: '红包',
    key: 1
  },
  FULL_SUB: {
    name: '满减',
    key: 2
  },
  SKILL: {
    name: '秒杀',
    key: 3
  },
  SHARE: {
    name: '分享',
    key: 4
  },
  OFFER: {
    name: '折扣',
    key: 5
  }
}

export const GOODS_TICKET = 1 // 商品配送到家(快递)
export const GOODS_TAKE_OUT = 2 // 外卖配送
export const GOODS_COMMODITY = 4 // 商品到店消费
export const GOODS_PICK_UP = 8 // 外卖自取
export const GOODS_MERCHANT = 16// 外卖套餐
export const ORDER_TYPE_NETWORK = 'NETWORK'// 外卖到家
export const ORDER_TYPE_STORE = 'TO_THE_STORE' // 到店消费订单
export const ORDER_TYPE_DELIVERY = 'DELIVERY_TO_HOME'// 快递到家
export const ORDER_TYPE_SCAN = 'SCAN_CODE' // 扫码点餐
export const ORDER_TYPE_SCAN_LATER = 'SCAN_CODE_PAY_LATER' // 扫码点餐后付款
export const ORDER_TYPE_OFFER = 'OFFER_TO_PAY' // 优惠买单
export const ORDER_TYPE_PICKUP = 'PICK_UP'// 外卖自取
export const GOODS_MODEL = [
  {
    label: '外卖到家',
    value: GOODS_TAKE_OUT,
    orderType: ORDER_TYPE_NETWORK,
    className: 'yellow'
  },
  {
    label: '到店消费',
    value: GOODS_COMMODITY,
    orderType: ORDER_TYPE_STORE,
    className: 'red'
  },
  {
    label: '物流到家',
    value: GOODS_TICKET,
    orderType: ORDER_TYPE_DELIVERY,
    className: 'green'
  }
]
export const GOODS_TYPE = [
  {
    label: '外卖到家',
    value: GOODS_TAKE_OUT,
    orderType: ORDER_TYPE_NETWORK
  },
  {
    label: '到店自提',
    value: GOODS_PICK_UP,
    orderType: ORDER_TYPE_PICKUP
  },
  {
    label: '到店消费',
    value: GOODS_COMMODITY,
    orderType: ORDER_TYPE_STORE
  },
  {
    label: '物流到家',
    value: GOODS_TICKET,
    orderType: ORDER_TYPE_DELIVERY
  }
]
export const MERCHANT_MODEL = [
  {
    label: '外卖',
    value: 2,
    className: 'yellow'
  },
  {
    label: '堂食',
    value: 1,
    className: 'red'
  },
  {
    label: '快递',
    value: 4,
    className: 'green'
  },
  {
    label: '堂食',
    value: 16,
    className: 'red'
  },
  {
    label: '堂食',
    value: 8,
    className: 'red'
  }
]
export const TALENT_GRADE_TYPE = {
  FANS: {
    label: '粉丝数',
    type: 'fansNum'
  },
  FRIENDS: {
    label: '好友数',
    type: 'fansNum'
  },
  GRADES: {
    label: '用户等级',
    type: 'grade'
  }
}
export const PROMOTE_TYPE_NAME = [
  {
    key: 'GRAPHIC',
    name: '图文'
  },
  {
    key: 'VIDEO',
    name: '视频'
  },
  {
    key: 'LIVE',
    name: '直播'
  }
]
export const PROMOTE_TYPE = {
  GRAPHIC: '图文',
  VIDEO: '视频',
  LIVE: '直播'
}
export const ACTION_CANCEL_ORDER = 'order/cancelOrderAction' // 取消订单
export const ACTION_REMINDER_ORDER = 'order/reminderOrderAction'// 催单
// 订单tab选项卡切换
export const ORDER_TABS = [
  {
    key: KEY_ALL,
    name: '全部'
  },
  {
    key: KEY_ORDER_PENDING,
    name: '未完成'
  },
  {
    key: KEY_ORDER_FINISH,
    name: '已完成'
  },
  {
    key: KEY_ORDER_TIMEOUT,
    name: '无效'
  }
  // {
  //   key: KEY_MERCHANT_USER,
  //   name: '门店使用'
  // },
  // {
  //   key: KEY_DELIVERY,
  //   name: '配送到家'
  // },
  // {key: KEY_ORDER_UNFINISH, name: "未完成"},
  // {
  //   key: KEY_ORDER_REFUND,
  //   name: '退款',
  //   hide: true
  // },
]
export const SCROLL_LOCATION = 'scroll_'

// 宣发任务订单（状态）
export const PROPAGANDA_ORDER_STATE = {
  PROMOTEING: {
    label: '推广中',
    time: '剩余时间'
  },
  CHECKING: {
    label: '审核中',
    time: '提交时间'
  },
  FINISH: {
    label: '已完成',
    time: '提交时间'
  },
  DISABLE: {
    label: '无效',
    time: '结束时间'
  },
  OVERTIME: {
    label: '超时',
    time: '失效时间'
  },
  CLOSETASK: {
    label: '手动结束',
    time: '结束时间'
  },
  NOTPASS: {
    label: '未通过',
    time: '审核时间'
  }
}


export const PARTNER_SET_STATE_ONE = 1 // 品牌没有设置等级
export const PARTNER_SET_STATE_TWO = 2 // 品牌没有设置等级
export const PARTNER_SET_STATE_THREE = 3 // 加入合伙人的条件是无门槛且加入失败
export const PARTNER_SET_STATE_FOUR = 4 // 加入合伙人的条件是有门槛
export const PARTNER_SET_STATE_FIVE = 5 // 加入合伙人的条件的目标达成（对于新加入的人来说就是品牌等级设置不合理）
export const PARTNER_SET_STATE_SIX = 6 // 加入合伙人的条件是购买会员卡
export const PARTNER_SET_STATE_SEVEN = 7 // 加入条件是购买会员卡或购买套餐

export const PARTNER_SET_FUNCTION_ONE = 1 // 分享单品
export const PARTNER_SET_FUNCTION_TWO = 2 // 分享平台
export const PARTNER_SET_FUNCTION_FOUR = 4 // 邀请合伙人

export const TALENT_DAD = 'ISLAND_FREE_LUNCH_PROMOTIONEXPERTAUTH'
export const LEGENDS_DAD = 'ISLAND_FREE_LUNCH_USERMEMBER'
export const CONDITION_DAD = {
  [TALENT_DAD]: 'Dv达人',
  [LEGENDS_DAD]: '会员卡'
}
export const NAV_LINK = {
  0: '/pages/propagandaReward/propagandaReward',
  1: '/package/specialOffer/specialOffer',
  2: '/pages/distributorIndex/distributorIndex',
  3: '/pages/dineAndDash/dineAndDash',
  4: '/pages/rightsCoupon/rightsCouponHome',
  5: '/pages/platformCertification/platformCertification',
  7: '/package/storedMoney/index/index',
  11: '/pages/merchantList/merchantList',
  12: '/package/multiStore/brandList/brandList'
}

export const COUPON_CONDITION = {
  PLATFORM_USE: '平台通用',
  TO_THE_SHOP: '到店消费',
  WU_LIU: '物流到家',
  TAKE_OUT: '外卖专用',
  OFFER_OF_PAY: '优惠买单',
  PACKAGE: '套餐商品'
}

// 等级功能
export const GRADE_FEATURE = [
  {
    label: '分享单品',
    value: 1
  },
  {
    label: '分享平台',
    value: 2
  },
  {
    label: '邀请合伙人',
    value: 4
  }
]

export const PARTNER_RIGHTS_ONE = 1 // 获一级下线提成
export const PARTNER_RIGHTS_TWO = 2 // 获二级下线提成
export const PARTNER_RIGHTS_FOUR = 4 // 自身消费可享受返现
export const PARTNER_RIGHTS_EIGHT = 8 // 提成提成比例额外增加
export const PARTNER_RIGHTS_SIXTEEN = 16 // 全部物流商品免邮

export const DISTRIBUTOR_ORDER_TYPE = [
  {
    label: '全部类型',
    value: '',
    active: false,
  },
  {
    // label: '分销门店',
    label: '奖金池瓜分',
    value: 5,
    active: false,
  },
  {
    label: '分享商品',
    value: 2,
    active: false,
  },
  {
    // label: '邀请团队',
    label: '招募团队收益',
    value: 3,
    active: false,
  }
]

// 等级权益
export const GRADE_RIGHTS = [
  {
    label: '获一级团队成员提成',
    value: 1,
    desc: '可获得您的一级团队成员分享产生消费的返现。\n举个栗子：小明通过您的邀请信息加入合伙人，小明分享的商品链接或海报成功产生消费，您将获得对应返现。'
  },
  {
    label: '获二级团队成员提成',
    value: 2,
    desc: '可获得您的二级团队成员分享产生消费的返现。\n举个栗子：小明通过您的邀请信息加入合伙人，小花通过小明的邀请信息加入合伙人，小花分享的商品链接或海报成功产生消费，您都可以获得对应返现。'
  },
  {
    label: '提成比例按平台/单品实际提成比例',
    value: 4,
    desc: '商城标有会员卡返现的商品，分享给好友或自己成功购买后产生的商品返现或分享平台好友购买任意标有会员卡返现的商品产生的平台返现。\n举个栗子：您消费100元或您朋友通过您分享的链接消费100元，返现比例是30%，您获得的返现是30元。'
  },
  {
    label: '返现额外加权',
    value: 8,
    desc: '在获取返现的基础上额外增加。\n举个栗子：您消费套餐B100元，返现比例是30%，没有加权您返现是30元，若加权是10%，则您最终返现比例是40%，返现金额是40元。'
  },
  {
    label: '全部物流商品免邮',
    value: 16,
    desc: '平台所有需要快递物流商品均免邮费。'
  },
  {
    label: '会员卡分享返现',
    value: 32,
    desc: '好友通过你分享的会员卡链接或海报成功开通后，您将获得对应返现。该好友也将成为您的一级团队成员。'
  },
  {
    label: '奖金池瓜分',
    value: 64,
    desc: '每期奖金池会有不同金额的奖金额，奖金额会根据本期本期参与活动的合伙人排名进行奖金瓜分，邀请团队成员越多奖金越多。'
  }
]
export const DYNAMIC = [
  {
    avatar: `${STATIC_IMG_URL}/wechatAvatar/avatar (1).png`,
    nickName: '行**',
    des: '获推广金￥200'
  },
  {
    avatar: `${STATIC_IMG_URL}/wechatAvatar/avatar (2).png`,
    nickName: '一**',
    des: '商品返现￥15.6'
  },
  {
    avatar: `${STATIC_IMG_URL}/wechatAvatar/avatar (3).png`,
    nickName: 'R**',
    des: '分享返现￥11.6'
  },
  {
    avatar: `${STATIC_IMG_URL}/wechatAvatar/avatar (4).png`,
    nickName: '李**',
    des: '获推广金￥500'
  },
  {
    avatar: `${STATIC_IMG_URL}/wechatAvatar/avatar (5).png`,
    nickName: '一**',
    des: '商品返现￥15.6'
  },
  {
    avatar: `${STATIC_IMG_URL}/wechatAvatar/avatar (6).png`,
    nickName: '小**',
    des: '分享返现￥9.25'
  },
  {
    avatar: `${STATIC_IMG_URL}/wechatAvatar/avatar (7).png`,
    nickName: '麦**',
    des: '分享返现￥7.5'
  },
  {
    avatar: `${STATIC_IMG_URL}/wechatAvatar/avatar (8).png`,
    nickName: '行**',
    des: '商品返现￥9.2'
  },
  {
    avatar: `${STATIC_IMG_URL}/wechatAvatar/avatar (10).png`,
    nickName: '王**',
    des: '获推广金￥350'
  },
  {
    avatar: `${STATIC_IMG_URL}/wechatAvatar/avatar (11).png`,
    nickName: '毕**',
    des: '商品返现￥11.2'
  },
  {
    avatar: `${STATIC_IMG_URL}/wechatAvatar/avatar (12).png`,
    nickName: 'M**',
    des: '商品返现￥7.25'
  },
  {
    avatar: `${STATIC_IMG_URL}/wechatAvatar/avatar (5).png`,
    nickName: '一**',
    des: '商品返现￥15.6'
  }
]

// 用户动态类型
export const DYNAMIC_TYPE = {
  BUY_GOODS: '购买商品赚',
  DISTRIBUTOR: '分享商品赚',
  PROMOTION: '宣发推广赚',
  USER_WITHDRAW: '用户提现'
}


// 分享教程
export const TUTORIAL_IMG = {
  product: [
    `${STATIC_IMG_URL}/tutorial/team_sept_1.png`,
    `${STATIC_IMG_URL}/tutorial/team_sept_2.png`
  ],
  team: [
    `${STATIC_IMG_URL}/tutorial/product_sept_1.png`,
    `${STATIC_IMG_URL}/tutorial/product_sept_2.png`,
    `${STATIC_IMG_URL}/tutorial/product_sept_3.png`,
    `${STATIC_IMG_URL}/tutorial/product_sept_4.png`
  ]
}

export const CHANNEL_EXAMPLE = {
  FANS: [
    {
      label: '上传能清晰展示用户信息和视频的截图',
      url: `${STATIC_IMG_URL}/channel_example/fans_example_1.png`
    },
    {
      label: '上传清晰地任务抖音视频截图',
      url: `${STATIC_IMG_URL}/channel_example/fans_example_2.png`
    },
    {
      label: '上传清晰地任务抖音视频的带有二维码的分享图',
      url: `${STATIC_IMG_URL}/channel_example/fans_example_3.png`
    }
  ],
  FRIENDS: [
    {
      label: '上传能清晰展示用户信息截图',
      url: `${STATIC_IMG_URL}/channel_example/friends_example_1.png`
    },
    {
      label: '上传清晰地任务微信朋友圈截图',
      url: `${STATIC_IMG_URL}/channel_example/friends_example_2.png`
    }
  ],
  GRADES: [
    {
      label: '上传大众点评个人主页动态列表中发布的任务截图',
      url: `${STATIC_IMG_URL}/channel_example/grades_example_1.png`
    },
    {
      label: '上传在大众点评发布的任务文章详情顶部的门店图文/视频及点评文字',
      url: `${STATIC_IMG_URL}/channel_example/grades_example_2.png`
    },
    {
      label: '上传在大众点评发布的任务文章详情中部的门店截图及浏览量',
      url: `${STATIC_IMG_URL}/channel_example/grades_example_3.png`
    }
  ]
}
export const MON = 1
export const TUES = 2
export const WED = 4
export const THUR = 8
export const FRI = 16
export const SAT = 32
export const SUN = 64
export const MERHCANT_WEEK = [
  {
    value: SUN,
    name: '周天'
  },
  {
    value: MON,
    name: '周一'
  },
  {
    value: TUES,
    name: '周二'
  },
  {
    value: WED,
    name: '周三'
  },
  {
    value: THUR,
    name: '周四'
  },
  {
    value: FRI,
    name: '周五'
  },
  {
    value: SAT,
    name: '周六'
  }
]

// 商品特殊分类
export const DISH_HOT = 1 // 热销
export const DISH_OFFER = 2 // 优惠

export const FLL_CUT = 100

export const ADD_CAR_ANIMATION = false // 菜品添加购物车是否需要动画效果

export const CAR_TYPE_SHOP = 'shop'// 购物车类型 - 店铺
export const CAR_TYPE_DISH = 'dish'// 购物车类型 - 商品

// 联动菜单相关
export const CATEGORY_ANCHOR_PREFIX = 'CATEGORY' // 左侧分类锚点
export const CONTEXT_ANCHOR_PREFIX = 'CONTEXT' // 右侧内容锚点

export const MENU_HEADER_HEIGHT = 100// 头部高度
export const MENU_FOOTER_HEIGHT = 90// 底部高度
export const CATEGORY_TABS_HEIGHT = 80// 分类标签页高度
export const LOCATION_TYPE_HEIGHT = 85 // 地址&门店类型

export const SHOPPING_CART = 90 // 购物车高度
// 主页单店选项卡配置
export const HOME_TABS = [
  { title: '全部商品' },
  { title: '商家信息' }
]

// 单店模式-- 门店状态
export const PROMPT = {
  REST: 1, // 打烊
  UNAUTHORIZED: 2, //
  EXCEED: 3 // 超出配送范围
}

export const SHOP_MODE_ENUM = {
  SHIPPING: {
    name: '外卖送餐',
    key: 2
  },
  RECEIVE: {
    name: '物流到家',
    key: 4
  },
  RESERVE: {
    name: '堂食预定',
    key: 1
  }
}
export const KEY_RECEIVE = 'ORDER_CONFIRM_TABS' // 到店自取
export const KEY_TASK_OUT = 'NETWORK'// 外卖送餐
// 订单确认tab
export const ORDER_CONFIRM_TABS = [
  {
    key: KEY_TASK_OUT, name: '外卖到家', value: 1, tag: 'NETWORK'
  },
  {
    key: KEY_RECEIVE, name: '到店自取', value: 2, tag: 'PICK_UP'
  }
  // {key: KEY_EAT_IN, name: "堂食预定", value: 4, tag: 'EATNOW'}
]
// export const KEY_TASK_OUT = 'NETWORK'//外卖送餐
// // 订单确认tab
// export const ORDER_CONFIRM_TABS = [
//   {
//     key: KEY_TASK_OUT,
//     name: '外卖到家',
//     value: 1,
//     tag: 'NETWORK'
//   },
//   {
//     key: KEY_RECEIVE,
//     name: '到店自取',
//     value: 2,
//     tag: 'PICK_UP'
//   }
//   // {key: KEY_EAT_IN, name: "堂食预定", value: 4, tag: 'EATNOW'}
// ]

export const SHOPPING_CAR_STATUS = {
  MINE_FINISH: {
    title: '您已结束点餐，好友正在支付中',
    icon: 'imgOrderFinish'
  },
  MASTER_FINISH: {
    title: '好友正在支付中',
    icon: 'imgOrderFinish'
  },
  ORDER_CONFIRM: {
    title: '订单已支付',
    icon: 'imgOrderConfirm'
  }
}

export const ORDER_TYPE = {
  NETWORK: {
    label: '外卖点餐',
    className: 'yellow'
  },
  PICK_UP: {
    label: '到店自取',
    className: 'blue'
  },
  TO_THE_STORE: {
    label: '到店自取',
    className: 'blue'
  },
  DELIVERY_TO_HOME: {
    label: '物流到家',
    className: 'green'
  },
  SCAN_CODE: {
    label: '扫码点餐',
    className: 'yellow'
  },
  OFFER_TO_PAY: {
    label: '优惠买单',
    className: 'red'
  }
}
export const KEY_DISTRIBUTION = 'DELIVERY_TO_HOME' // 物流到家
export const KEY_EAT_IN = 'EATNOW'// 堂食预定
export const KEY_TO_STORE = 'TO_THE_STORE' // 到店消费
export const KEY_PICK_UP = 'PICK_UP'
export const KEY_OFFER_PAY = 'OFFER_TO_PAY' // 优惠买单
export const BALANCE_TYPE = {
  DISTRIBUTION_CASHBACK: '分享赏金',
  RECHARGE: '充值',
  PROMOTION_PRICE: '达人悬赏',
  BUY_TC_CARD: '购买会员卡',
  DISTRIBUTION_CARD_CASHBACK: '会员卡分享赏金',
  DISTRIBUTOR_CARD_REWARDS_POOL: '会员卡瓜分赏金池',
  WITHDRAWAL: '提现',
  DISTRIBUTION_CASHBACK_REFUNDS: '分销商品返现退款',
  BUY_GOODS_CASHBACK: '商品退款'
}
export const LIMIT_TYPE = {
  USE_LIMIT: '用户限购',
  ORDER_LIMIT: '每单限购',
  DAY_LIMIT: '每日限购'
}

export const KEY_PAY_WECHAT = 'WECHAT' // 微信支付
export const KEY_PAY_BALANCE = 'BALANCE' // 余额支付
export const KEY_PAY_CARD = 'CARD' // 储值卡支付
export const KEY_PAY_ALIPAY = 'ALIPAY' // 支付宝支付
export const KEY_PAY_BANK = 'BANK' // 支付宝支付
export const PAY_CHANNEL = {
  [KEY_PAY_WECHAT]: '微信',
  [KEY_PAY_BALANCE]: '余额',
  [KEY_PAY_CARD]: '储值卡',
  [KEY_PAY_ALIPAY]: '支付宝',
  [KEY_PAY_BANK]: '银行卡'
}
