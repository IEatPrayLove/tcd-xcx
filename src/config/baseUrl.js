export const noConsole = true // 输出日志信息


const DEV = process.env.NODE_ENV !== 'production' // 是否是生产坏境
// export const IP = DEV ? 'http://192.168.101.108:8080' : 'https://test.canyingdongli.com' // 黄朝燕
// export const IP = 'http://192.168.102.27:8080' // 代锐
// export const IP = 'http://192.168.101.117:8080' // 王颖
// export const IP = 'http://a14b2c88.ngrok.io' // 马晓林
// export const IP = 'http://192.168.101.76:8080' // 代锐
// export const IP = 'http://192.168.101.165:8080' // 罗世德
// export const WEBSOCKET_IP_ORDERING = 'ws://192.168.101.179:9091/websocket/person/' // 马晓林
export const IP = DEV ? 'https://test.canyingdongli.com' : 'https://clt.canyingdongli.com'
export const SERVER_IP = DEV ? 'test.canyingdongli.com' : 'clt.canyingdongli.com'
// export const IP = DEV ? 'https://clt.canyingdongli.com' : 'https://test.canyingdongli.com'
// export const SERVER_IP = DEV ? 'clt.canyingdongli.com' : 'test.canyingdongli.com'

export const WEBSOCKET_IP_ORDERING = DEV ? 'wss://socketweixin.canyingdongli.com/websocket/person/' : 'wss://socketweixin.canyingdongli.com/websocket/person/'
export const WEBSOCKET_IP = DEV ? 'wss://socketweixin.canyingdongli.com' : 'wss://socketweixin.canyingdongli.com'
//掌控者平台mqtt连接地址
export const OTHERWEBSOCKET_IP = DEV?'ws://192.168.102.105:9091':'ws://192.168.102.105:9091'     //马晓林 

export const SERVICE_PORT = DEV ? '80' : '80'
export const DEFAULT_PLAT_FORM_ID = DEV ? 142 :394 // 246 293 49 358 耗儿爷:122 多店:81  394.........
export const WEBSOCKET_PLATFORM = DEFAULT_PLAT_FORM_ID
export const APP_ID = DEV ? 85 : 95 // 赚餐平台编号 耗儿爷:83 多店:80  何师烧烤：95
export const PLATFORM_ID = DEFAULT_PLAT_FORM_ID
export const UPLOAD_URL = 'https://clt.canyingdongli.com/merchant/api/osses/upload/4/0'
export const GET_TOKEN_URL = '/uaa/oauth/token'

export const DOMAIN = `https://d.canyingdongli.com/${DEFAULT_PLAT_FORM_ID}/`
// api接口服务
export const API_ISLAND = '/island/api' // 平台
export const API_BRAND = '/merchant/api/brands' // 品牌
export const API_SEARCHBRAND = '/merchant/api/_search/brands'// 搜索品牌
export const API_MERCHANT = '/merchant/api'// 门店
export const API_AUTHORIZED = '/operation/api'// 外卖平台
export const API_SHOP = '/shop/api' // 商品
export const API_OPERATION = '/operation/api'// 运营管理
export const API_SYS = '/sys/api' // 系统设置
export const API_PLATFORM = '/platform/api' // 平台
export const API_ARTICLE = '/article/api' // 资讯
export const API_UAA = '/uaa/api' // 用户
export const API_TRANSCATION = '/transcation/api' // 交易


//ohters platform API
export const API_GETTOKEN = '/holderWeixin/auth/getToken?'  //获取token
export const API_OTHERPLATFORM = '/holderWeixin'  //表示另一个平台
export const API_LOGINOTHER = '/wx_open/update_login'    //登录另一个平台
export const API_OTHERCUMSUMER = '/wx-store-menu/get_consumer'  //get方法获取session中的用户
export const API_OTHERCUMSUMERPOST = '/wx-store-menu/get_consumer_info'   //post方法获取用户信息
export const API_OTHERGOODS = '/deal/menu/item_config'   //商品
export const API_OTHERCART = '/deal/menu/item_modify'      //加入购物车
export const API_OTHERCARTCONTENT = '/deal/menu/shop_cart'   //获取购物车内容
export const API_CLEARCARTCONTENT = '/deal/menu/clear_shop_cart'   //清空购物车数据
export const API_SUBMITCART = '/deal/menu/submit_cart'          //提交购物车
export const API_GETORDERDETAIL = '/deal/menu/pre_order_list'     //获取当前订单信息
export const API_GETORDERS = '/deal/user_order/store'          //获取订单
export const API_SUBMITORDER = '/deal/menu/submit_order'      //提交订单
// export const API_CURRENTORDER = '/deal/order/detail'         //获取当前未结算内的所有订单信息
export const API_OTHERPAYWECHT = '/deal/pay/we_chat'         //微信支付
export const API_OTHERPAYMBERPAY = '/deal/pay/member'         //会员支付
export const API_OTHERORDERBYID = '/deal/order/detail'           //根据订单guid获取订单信息，订单未支付时不包含结算信息
export const API_OTHERORDERSETTLEMENT = '/deal/order/detail/settlement'   //根据订单guid获取订单信息，包含结算信息
export const API_OTHERORDERSTATUS = '/deal/order/settlement/check'                      //进入买单订单状态检查
export const API_MEMBERMESS = '/hsmcw/member/getMemberInfo'        //查询会员信息
export const API_VOLUMELIST = '/wx_member_center_volume/volume_list'  // 优惠券列表
export const API_USE_VOLUM = '/deal/member/discount'  // 优惠券使用
export const API_CONFIRM_USE = '/deal/member/prepay_confirm'  // 确认使用优惠券
export const API_GETMEMBERCARDLIST = '/wx_member_card/member_card_list'      //已开通会员卡列表
export const API_SWITCHCARD = '/deal/menu/switch_card'    //切换会员卡
export const API_JUHEWECHAT = '/transcation/api/mdmpay-order'    //聚合支付预下单
export const API_JUHEWECHATPAY ='/transcation/api/mdmpay-prepay-polling'   // 聚合支付
export const API_ORDERDEFREY = '/wx_store_trade_order/order_defrey'   //支付   通知对面

export const API_PREPAY = '/deal/pay/prepay'          //会员支付支付验证
export const API_MEMBERPAY = '/deal/pay/member'                //会员支付
export const API_PAYWAY = '/deal/pay/way'        //会员支付时的会员卡


export const SERVER_IMG = 'https://public-attach.canyingdongli.com/' // 图片前缀
export const PRVIMG_URL = 'https://public-attach.canyingdongli.com/' // 文件,图片地址前缀
export const STATIC_IMG_URL = 'http://resource.canyingdongli.com/island-zhuancan' // 静态,文件,图片地址前缀
export const MYSELF_URL = `https://d.canyingdongli.com/${DEFAULT_PLAT_FORM_ID}/linkcard` // 会员卡分享规则
export const PRODUCT_URL = `https://d.canyingdongli.com/${DEFAULT_PLAT_FORM_ID}/linkgood` // 商品分享规则
export const MERCHANT_URL = `https://d.canyingdongli.com/${DEFAULT_PLAT_FORM_ID}/linkmerchant` // 门店分销规则
export const JOIN_DISTRIBUTION = `https://d.canyingdongli.com/${DEFAULT_PLAT_FORM_ID}/linkdistribution` // 分销海报
export const INDEX_URL = `https://d.canyingdongli.com/${DEFAULT_PLAT_FORM_ID}/linkindex` // 平台分享规则
// export const POSTER_URL = `https://cydl-resource.oss-cn-zhangjiakou.aliyuncs.com/island-zhuancan/${DEFAULT_PLAT_FORM_ID}` // 海报地址
export const POSTER_URL = 'https://cydl-resource.oss-cn-zhangjiakou.aliyuncs.com/island-zhuancan'
export const ACTIVE_URL = `https://topic.365tcd.com/${DEFAULT_PLAT_FORM_ID}/index.html`
export const DISTRIBUTOR_URL = 'https://d.canyingdongli.com/'
// export const HAPPYPLAY_URL = 'https://weixin.lewan6.ren/wechat_html/page/merchant/merchantVerification.html?consumerCode='
export const HAPPYPLAY_URL = 'https://weixin.lewan6.ren/wechat_html/page/smsAppointment/smsQR.html?consumerCode='
// export const ACTIVE_URL = DEV ? 'http://topic.365tcd.com/index.html' : 'http://127.0.0.1:10086' // 活动页
