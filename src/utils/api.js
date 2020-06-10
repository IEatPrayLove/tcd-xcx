import Taro from '@tarojs/taro'
import * as config from '../config/baseUrl'
import {
  $delete, $get, $post, $put
} from './request'
import { APP_ID } from '../config/baseUrl'
import { PLATFORM_ID } from '../config/baseUrl'

// 获取平台分类下菜品
export function getRecommendGoods(params) {
  return $get(`${config.API_PLATFORM}/get-platform-package/${params.platformId}`)
}

// 绑定微信小程序账号
export async function bindWeAppAccount(params) {
  return $post(`${config.API_UAA}/create-we-app-account`, { data: params })
}

// 检测平台合伙人
export async function existsPartner() {
  return $get(`${config.API_MERCHANT}/exists-distributors-by-platform/${config.PLATFORM_ID}`)
}

// 获取用户选择的地址
export async function getDefaultUserAddress(params) {
  return $get(`${config.API_UAA}/user-addresses/userId/enabled?id=${params.id || ''}`)
}

// 获取平台详情
export async function getPlatFormDetail(params) {
  return $get(`${config.API_PLATFORM}/plat-form-users/${params.id}`)
}

// 获取平台商户合伙人分成数据
export async function getPlatformDishReward(params) {
  return $get(`${config.API_MERCHANT}/distributor-merchant-configs-by-brand/${params.brandId}?page=0&size=999`)
}

// 获取平台菜品合伙人分成数据
export async function getPlatformMerchantDishReward(params) {
  return $get(`${config.API_MERCHANT}/distributor-merchant-shops-by-brand/${params.brandId}?page=0&size=9999`)
}

// 获取平台合伙人分成数据
export async function getPlatformShareReward(params) {
  return $get(`${config.API_MERCHANT}/distributor-configs-by-platform/${params.brandId}`)
}

// 获取用户红包
export async function getUserCanUseBonus(params) {
  // return $get(`${config.API_SHOP}/self/consumer-use-hongbao?brandId=${params.brandId}`)
  return $get(`${config.API_SHOP}/user/can-use-hong-bao/${params.platformId}`)
}

// 判断用户是否是合伙人
export async function isPartner(params) {
  return $get(`${config.API_MERCHANT}/is-it-a-partner?brandId=${params.brandId}`)
}

// 登录获取token
export async function fakeAccountLogin(params) {
  return $post('/uaa/oauth/token', {
    data: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic d2ViX2FwcDo='
    }
  })
}

// 验证手机号是否被注册
export async function getPhoneReg(params) {
  return $get(`${config.API_UAA}/check-user-by-phone?phone=${params}`)
}

// 短信验证码发送
export async function sendUserMobileCode(params) {
  return $get(`${config.API_TRANSCATION}/sendValidationCode/${params}`)
}

//  注册
export async function registerUser(params) {
  return $post(`${config.API_UAA}/register-by-app`, { data: params })
}

// 登录成功后判断跳转判断
export async function decideSkip(params) {
  return $get(`${config.API_PLATFORM}/login-platform-type?userId=${params.userId}`, {
    headers: {
      Authorization: `Bearer${Taro.setStorage({
        key: 'loginToken'
      })}`
    }
  })
}

// 入驻记录信息获取
export async function stationedRecordInfo(params) {
  return $get(`${config.API_MERCHANT}/get-single-merchant-mode-brand-info?platformId=${params.platformId}&type=${params.type}`)
}

// 行业列表
export async function getBusiness() {
  return $get(`${config.API_MERCHANT}/industries/all`)
}

// 提交商业入驻信息
export async function submitBrandInfo(params) {
  return $post(`${config.API_MERCHANT}/create-brand-and-entering-tcd/app`, { data: params })
}

// 获取平台id
export async function getPlatform(params) {
  return $get(`${config.API_PLATFORM}/get-plat-form-users/${params.userId}`)
}

// 获取平台平台id
export async function getTcdPlatform() {
  return $get(`${config.API_PLATFORM}/get-tcd-platform-id`)
}

// 微信小程序登录
export async function weAppLoginByCode(params) {
  return $post(`${config.GET_TOKEN_URL}`, { data: params })
}

// 手机号快速登录
export async function weAppLoginByMobileCode(params) {
  return $post(`${config.GET_TOKEN_URL}`, { data: params })
}

// 获取平台系统设置
export async function getPlatFormSystemSettingById(params) {
  return $get(`${config.API_PLATFORM}/system-settings/platFormUser/${params.id}`)
}

// 获取在赚餐中用户信息
export async function getUserAccount() {
  return $get(`${config.API_UAA}/account`)
}

/**
 * 获取商品详情
 * @param params
 * @returns {Promise<Object>}
 */
export async function getDishDetail(params) {
  return $get(`${config.API_PLATFORM}/get-special-offer-platform-dish-info?dishId=${params.dishId}&platformId=${params.platformId}&skuId=${params.skuId || ''}`)
}

/**
 * 获取商品详情(富文本)
 * @param params
 * @returns {Promise<Object>}
 */
export async function getDishWxParse(params) {
  return $get(`${config.API_SHOP}/self/dish-details-info?dishId=${params.dishId}&state=1`)
}

/**
 * 获取门店信息
 * @param params
 * @returns {Promise<Object>}
 */
export async function getMerchantInfo(params) {
  return $get(`${config.API_MERCHANT}/get-merchant-info-by-id?merchantId=${params.merchantId}`)
}

// 门店信息
export async function getScanningMerchantInfo(params) {
  return $get(`${config.API_PLATFORM}/get-c-merchant-info/${params.platformId}`)
}


// 获取微信富文本数据
export async function getWeChatArticleContent(params) {
  return $post(`${config.API_SYS}/get-wx-request`, { data: params })
}

// 获取预交易单
export async function getPrepay(params) {
  return $get(`${config.API_TRANSCATION}/pay-we-app/${params.tradeNo}?wxCode=${params.wxCode}&appId=${params.appId}`)
}

// 生成订单
export async function saveShopOrder(params) {
  return $post(`${config.API_SHOP}/shop-orders/self`, { data: params })
}

// 取消订单
export async function cancelOrder(params) {
  return $put(`${config.API_SHOP}/shop-orders/consumer-cancelled`, { data: params })
}

// 催单
export async function reminderOrder(params) {
  return $put(`${config.API_SHOP}/shop-orders/reminder?id=${params.id}`)
}

// 确认收货
export async function confirmReceive(params) {
  return $put(`${config.API_SHOP}/shop-orders/consumer-finish?id=${params.id}`)
}

// 获取美团外卖配送员信息
export async function getMeiShipping(params) {
  return $get(`${config.API_OPERATION}/get-shipping-order-by-order-sn?orderSn=${params.orderSn}`)
}

// 获取订单详情信息
export async function getOrderDetail(params) {
  return $get(`${config.API_SHOP}/order-info?orderSn=${params.orderSn}`)
}

// 根据订单状态返回订单列表
export async function getOrderList(params) {
  return $get(`${config.API_SHOP}/get-special-offer-platform-order-by-state?platformId=${params.platformId}&state=${params.state}&page=${params.page}&size=${params.size}&sort=id,asc`)
}

// 获取订单物流信息
export async function getOrderLogistics(params) {
  return $get(`${config.API_SYS}/get-shipping-detail?waybill_no=${params.waybillNo}&exp_company_code=${params.companyCode}`)
}

// 通过订单编号获取订单状态
export async function getOrderStateLog(params) {
  return $get(`${config.API_SHOP}/get-order-state-info-by-order-sn?orderSn=${params.orderSn}`)
}

// 获取美团外卖配送员位置坐标
export async function getRiderLocation(params) {
  return $get(`${config.API_OPERATION}/mt-get-rider-location?deliveryId=${params.deliveryId}&meiTuanDeliveryId=${params.meiTuanDeliveryId}`)
}

// 订单统计
export async function orderAccount(params) {
  return $get(`${config.API_SHOP}/count-special-offer-order-by-state?platformId=${params.platformId}`)
}

// 获取用户地址
export async function getUserAddress() {
  return $get(`${config.API_UAA}/user-addresses/userId?page=0&size=999`)
}

// 删除用户地址
export async function deleteUserAddressById(params) {
  return $delete(`${config.API_UAA}/user-addresses/${params.id}`)
}

// 获取坐标地理位置名称
export async function putLocationNameByCoordinate(params) {
  return $post(`${config.API_MERCHANT}/user-positions`, { data: params })
}

// 存储用户地址
export async function saveUserAddress(params) {
  return $put(`${config.API_UAA}/user-addresses`, { data: params })
}

/** ***********************************************平台用户模块**************************** */

// 平台用户登录
export async function judgeIslandUser(params) {
  return $get(`${config.API_ISLAND}/self-island-user/${config.PLATFORM_ID}?headPic=${params.headPic}&nickName=${params.nickName}`)
}

// 修改用户信息
export async function modifyIslandUser(params) {
  return $put(`${config.API_ISLAND}/island-user/${config.PLATFORM_ID}?birthDay=${params.birthday}&headPic=${params.headPic}&nickName=${params.nickName}&sex=${params.sex}`)
}

// 获取用户达人信息
export function getTalentInfo() {
  return $get(`${config.API_ISLAND}/get-auth-info-no-auth-info/${config.PLATFORM_ID}`)
}

// 添加达人认证信息
export function addTalentCertification(params) {
  return $post(`${config.API_ISLAND}/island-promotion-expert-auths`, { data: { ...params, platformId: config.PLATFORM_ID } })
}

// 重新认证达人信息
export function updateTalentCertification(params) {
  return $get(`${config.API_ISLAND}/re-auth-island-promotion-expert-auths`, { data: { ...params, platformId: config.PLATFORM_ID } })
}

// 查看是否已提交渠道认证
export async function examineCertification(params) {
  return $get(`${config.API_ISLAND}/is-submit-auth-placeId/${params.placeId}/${config.PLATFORM_ID}`)
}
// 认证记录
export function dertificationRecord(params) {
  return $get(`${config.API_ISLAND}/get-island-promotion-expert-auths-info?checkState=${params.checkState}&page=${params.page}&size=${params.size}&sort=${params.sort}&platformId=${config.PLATFORM_ID}`)
}

// 查询推广悬赏列表
export function getPropagandaList(params) {
  return $get(`${config.API_ISLAND}/show-weapp-island-promotions?page=${params.page}&placeId=${params.placeId}&placeType=${params.placeType}&size=${params.size}&sort=${params.sort}&state=${params.state}&grade=${params.grade}&tcdId=${config.PLATFORM_ID}&comOrder=${params.comOrder}`)
}

// 获取所有宣发渠道
export function getAllChannel() {
  return $get(`${config.API_ISLAND}/get-list-island-promotion-places-weapp/${config.PLATFORM_ID}`)
}

// 获取当前渠道等级
export function getChannelLevel(params) {
  return $get(`${config.API_ISLAND}/island-promotion-expert-grades-place-id/${params.id}/${config.PLATFORM_ID}`)
}


// 获取悬赏详情
export function getPropagandaDetail(params) {
  return $get(`${config.API_ISLAND}/island-promotion-orders-weapp/${params.id}`)
}

// 获取悬赏详情
export function getTaskDetail(params) {
  return $get(`${config.API_ISLAND}/get-orders-detail-info-weapp/${params.id}`)
}
// 宣发接单
export function getPropagandaOrder(params) {
  return $put(`${config.API_ISLAND}/take-island-promotion-orders-promotion-id/${params.id}/${config.PLATFORM_ID}`)
}

// 宣发任务列表
export function getPropagandaOrderList(params) {
  return $get(`${config.API_ISLAND}/self-list-island-promotion-orders?orderState=${params.orderState}&page=${params.page}&size=${params.size}&tcdId=${config.PLATFORM_ID}&sort=id,desc`)
}

// 结束订单
export function finishPropagandaOrder(params) {
  return $put(`${config.API_ISLAND}/close-island-promotion-orders-promotion-id/${params.id}`)
}

// 提交宣发任务单
export function submitPropaganda(params) {
  return $post(`${config.API_ISLAND}/upload-island-promotion-orders-promotion-id/${params.id}?promotePic=${params.promotePic}&taskDescription=${params.taskDescription}`)
}

// 撤回提交宣发任务订单
export function withdrawPropaganda(params) {
  return $put(`${config.API_ISLAND}/withdraw-island-promotion-orders-promotion-id/${params.id}`)
}

/* *****************************加入平台合伙人************************ */
// 获取平台基础数据
export async function getPlatFormById(params) {
  return $get(`${config.API_PLATFORM}/plat-form-users/${params.id}`)
}

// 获取商品配置信息(分享海报等)
export async function getGoodsConfig(params) {
  return $get(`${config.API_MERCHANT}/distributor-merchant-shops-by-goods/${params.goodsId}?platformId=${params.platformId}`)
}

// 获取合伙人当前等级信息
export async function getPartnerRankInfo(params) {
  return $get(`${config.API_PLATFORM}/partner-levels/${params.id}`)
}

// 合伙人包含二维码的分享海报
export async function getQrcodeSharePoster(params) {
  return $get(`${config.API_MERCHANT}/share/make-image?post=${params.post}&url=${encodeURIComponent(params.url)}&qrCodeXValve=${params.qrCodeXValve}&qrCodeYValue=${params.qrCodeYValue}&qrCodeSize=${params.qrCodeSize}`)
}

// 获取原生商品组
export async function getShopDishesByIds(params) {
  return $post(`${config.API_SHOP}/self-support-dishes-by-ids`, { data: params })
}

// 获取特惠分享商品
export async function getRecommendationList(params) {
  return $get(`${config.API_PLATFORM}/platform-recommend/dish-info/${params.platformId}?type=${params.type}`)
}

// 获取星选列表 lng经度 lat：纬度
export async function getStarSelectList(params) {
  return $get(`${config.API_PLATFORM}/platform-star-dish/page?type=${params.type}&platformId=${params.platformId}&lng=${params.lng}&lat=${params.lat}&dishName=${params.dishName}&categoryId=${params.categoryId}&page=${params.page}&size=${params.size}&sort=id,asc`)
}

// 获取星选类型
export async function getStarType(params) {
  return $get(`${config.API_PLATFORM}/platform-category/function-type?platformId=${params.platformId}&functionType=${params.functionType}&page=${params.page}&size=${params.size}&sort=id,asc`)
}

// 奖金池基础配置获取
export function getBonusPool(params) {
  return $post(`${config.API_ISLAND}/get-island-rewards-pool-basic-config-list`)
}

/* *****************会员卡相关**************************** */

// 判断当前用户开通会员卡需要多杀钱
export function getLegendsCardMoney() {
  return $get(`${config.API_ISLAND}/get-price-member/${config.PLATFORM_ID}`)
}

// 获取会员卡信息
export function getLegendsCardInfo() {
  return $get(`${config.API_ISLAND}/island-right-and-interest-settings-with-platform-id/${config.PLATFORM_ID}`)
}

// 购买会员卡
export function buyLegendsCard(params) {
  return $post(`${config.API_MERCHANT}/distributor-pays`, { data: params })
}

// 获取会员卡瓜分奖金
export function getLegendsBounty() {
  return $get(`${config.API_ISLAND}/get-last-island-rewards-pool-participants-win-total-money?platFormId=${config.PLATFORM_ID}`)
}

// 获取用户优惠券
export function getUserOfferCoupon(params) {
  return $get(`${config.API_ISLAND}/get-all-island-coupon-used-info?platFormId=${config.PLATFORM_ID}&status=${params.status}`)
}

// 获取已过期的优惠券
export function getExpiredOfferCoupon() {
  return $get(`${config.API_ISLAND}/get-all-island-coupon-cannot-used?platFormId=${config.PLATFORM_ID}`)
}

// 获取用户会员信息
export async function getUserLegendsCardInfo(params) {
  return $get(`${config.API_ISLAND}/island-user-members-user/${config.PLATFORM_ID}/${params.userId}`)
}

// 获取奖金池基本配置
export function getBonusPoolConfig() {
  return $get(`${config.API_ISLAND}/get-island-rewards-pool-basic-config-list?platFormId=${config.PLATFORM_ID}`)
}

// 获取上一期赏金奖金池活动信息
export function getLastTermBonusPoolInfo() {
  return $get(`${config.API_ISLAND}/get-last-island-rewards-pool-participants-win-total-money?platFormId=${config.PLATFORM_ID}`)
}

// 获取本期赏金池活动信息
export function getThisPeriodBonusPoolInfo() {
  return $get(`${config.API_ISLAND}/get-latest-island-rewards-pool-participants-win-total-money?platFormId=${config.PLATFORM_ID}`)
}

// 获取霸王餐列表
export function getDineAndDashList() {
  return $get(`${config.API_ISLAND}/get-c-free-lunch/info/${config.PLATFORM_ID}`)
}

// 获取霸王餐商品详情
export function getDineAndDashDetail(params) {
  return $post(`${config.API_ISLAND}/goto-island-free-lunch-dishes-detail?id=${params.id}&platformId=${config.PLATFORM_ID}`)
}

// 获取会员卡分享二维码
export function getShareQrCode(params) {
  return $get(`${config.API_MERCHANT}/share/make-card/${params.appId}/${params.userId}?qrContent=${params.qrContent}`)
}

// 霸王餐报名
export function signUpDineAndDash(params) {
  return $post(`${config.API_ISLAND}/create-island-free-lunch-user-info`, { data: params })
}

// 霸王餐获奖弹窗
export function viewDineAndDashAward() {
  return $get(`${config.API_ISLAND}/get-island-free-lunch-win-user-info?platFormId=${config.PLATFORM_ID}`)
}

// 关闭霸王餐弹窗
export function closeDineAndDashAward(params) {
  return $post(`${config.API_ISLAND}/update-island-free-lunch-win-user-view-info?platFormId=${config.PLATFORM_ID}&id=${params.id}`)
}

// 获取霸王餐活动记录
export function getDineAndDashRecordList(params) {
  return $get(`${config.API_ISLAND}/get-island-free-lunch-joined-info?platFormId=${config.PLATFORM_ID}&type=${params.type}`)
}

// 获取分享权益卡卷
export function getRecommendCoupon(params) {
  return $get(`${config.API_SHOP}/get-tao-quan-dish-recommend-info?platformId=${config.PLATFORM_ID}&type=${params.type}`)
}

// 获取权益卡卷
export function getCouponList() {
  return $get(`${config.API_SHOP}/get-tao-quan-dish-info?platformId=${config.PLATFORM_ID}`)
}

// 获取卡卷详情
export function getCouponDetail(params) {
  return $get(`${config.API_SHOP}/get-tao-quan-dish-sku-info?dishId=${params.dishId}`)
}

// 获取会员权益配置
export function getUserMemberConfig() {
  return $get(`${config.API_ISLAND}/island-right-and-interest-settings?platformId=${config.PLATFORM_ID}&enjoyWay=GRADE`)
}

// 获取会员升级攻略
export function getUpgradeRaiders() {
  return $get(`${config.API_ISLAND}/upgrade-strategy/${config.PLATFORM_ID}`)
}

// 获取所有等级
export async function getAllMember() {
  return $get(`${config.API_ISLAND}/list-island-user-member-grade-settings/${config.PLATFORM_ID}`)
}

// 获取所有等级下的用户数
export function memberGradePeopleNum() {
  return $get(`${config.API_ISLAND}/list-user-count-island-user-member-grade-settings/${config.PLATFORM_ID}`)
}

// 获取用户会员信息
export function getUserMemberInfo() {
  return $get(`${config.API_ISLAND}/find-island-user/${config.PLATFORM_ID}`)
}

// 获取主页分享宣发任务
export function getRecommendPropaganda() {
  return $get(`${config.API_PLATFORM}/find-promotion-info-recommend-activity-c/${config.PLATFORM_ID}?type=9`)
}

// 小程序广告位接口
export function getAppletsAd(params) {
  return $get(`${config.API_PLATFORM}/system-banners/show/position?platFormUserId=${config.PLATFORM_ID}&positionCode=${params.positionCode}`)
}

// 获取平台下分享设置
export function getPlatformByDistribution() {
  return $get(`${config.API_MERCHANT}/platform-distribution-config/${config.PLATFORM_ID}`)
}

// 获取商品是否为分享商品
export function getProductIsDistribution(params) {
  return $get(`${config.API_MERCHANT}/get-tcd-distributor-merchant-shop-id-with-dish-id/${config.PLATFORM_ID}?dishIds=${params.dishIds}`)
}

// 获取优惠卷使用信息
export function getCouponUseInfo(params) {
  return $get(`${config.API_ISLAND}/get-all-island-coupon-used-info?platFormId=${params.platFormId}&status=${params.status}`)
}

// 获取霸王餐权益卡卷
export function getLunchAndCoupon(params) {
  return $get(`${config.API_SHOP}/get-tao-quan-and-free-lunch-special-offer-platform-order-by-state?platformId=${config.PLATFORM_ID}&state=${params.state}&page=${params.page}&size=${params.size}&sort=&thirdPartyType=${params.thirdPartyType}`)
}

// 获取主页导航
export function getIndexNav(params) {
  return $get(`${config.API_PLATFORM}/find-c-navigation?platformId=${config.PLATFORM_ID}&type=${params.type}`)
}

// 金库模块开始
// 获取当前总余额 分享累计赏金 达人类及赏金 累计收益
export function getTreasuryInfo(params) {
  return $get(`${config.API_ISLAND}/island-user-info/${config.PLATFORM_ID}`)
}

// 获取提现满足的条件
export function getWithdrawRequire(params) {
  return $get(`${config.API_ISLAND}/island-basic-infos/${config.PLATFORM_ID}`)
}

// 判断是否可以提现
export function judgeIsWithdraw(params) {
  return $post(`${config.API_ISLAND}/check-island-user-withdraws/${config.PLATFORM_ID}`)
}

// 创建用户提现记录
export function createWidthdraw(params) {
  return $post(`${config.API_ISLAND}/island-user-withdraws`, { data: params })
}
// 获取提现记录列表
export function getWidthdrawRecordList(params) {
  return $get(`${config.API_ISLAND}/find/island-user-withdraws?status=${params.status}&page=${params.page}&size=${params.size}&tcdId=${config.PLATFORM_ID}&sort=id,desc`)
}
// 获取每条提现记录的提现明细
export function getWithdrawDetail(params) {
  return $get(`${config.API_ISLAND}/island-user-withdraws/${params.id}`)
}

// 获取余额记录
export function getBalanceRecordList(params) {
  return $get(`${config.API_ISLAND}/island-user-balance-records-weapp?platformId=${config.PLATFORM_ID}&page=${params.page}&size=${params.size}&time=${params.time}&tradeSources=${params.tradeSources}&sort=${params.sort}`)
}

// 获取分享或者达人赏金记录
export function getRetailExpertList(params) {
  if (params.userProfitTypes == 'PROMOTION_PROFIT') {
    return $get(`${config.API_ISLAND}/user-profits-by-weappUserId?platformId=${config.PLATFORM_ID}&userProfitTypes=${params.userProfitTypes}&time=${params.time}&placeId=${params.placeId}&page=${params.page}&size=${params.size}&sort=id,desc`)
  }
  return $get(`${config.API_ISLAND}/user-profits-by-weappUserId?platformId=${config.PLATFORM_ID}&userProfitTypes=${params.userProfitTypes}&time=${params.time}&page=${params.page}&size=${params.size}&sort=id,desc`)
}
// 获取分享或者达人赏金的详情
export function getRetailExpertDetail(params) {
  return $get(`${config.API_ISLAND}/user-profits/${params.id}`)
}
// 获取昨日分享收益，宣发总收益，分享总收益，昨日分享总收益
export function getTreasureProfits(params) {
  return $get(`${config.API_ISLAND}/sum-user-profits-by-weappUserId?platformId=${config.PLATFORM_ID}`)
}
// 获取余额记录中的累计收入累计支出
export function getBalanceAmount(params) {
  return $get(`${config.API_ISLAND}/sum-user-balance-records-by-weappUserId?platformId=${config.PLATFORM_ID}`)
}

// 获取用户拉入人数及赏金总数
export function userDragInto() {
  return $get(`${config.API_ISLAND}/user-join-num-profits-by-weappUserId?platformId=${config.PLATFORM_ID}`)
}

// 获取赏金池活动配置
export function getRewardPoolConfig() {
  return $get(`${config.API_ISLAND}/get-island-rewards-pool-config-list-by-times?platFormId=${config.PLATFORM_ID}`)
}

// 根据小程序用户表id获取会员卡收益明细
export function getUserLegendsCardDetail(params) {
  return $get(`${config.API_ISLAND}/user-profits-info-list-by-weappUserId?platformId=${config.PLATFORM_ID}&endTime=${params.endTime}&startTime=${params.startTime}`)
}

// 我的页面，消费订单、权益卡券、宣传任务数量
export function getUserOrderQuantity() {
  return $get(`${config.API_SHOP}/find-c-order-num/login/${config.PLATFORM_ID}`)
}

// 增加用户访问记录
export function setUserVisitRecord() {
  return $get(`${config.API_ISLAND}/island-access-records/${config.PLATFORM_ID}`)
}

// 更新阅读数
export function updateAuthor(params) {
  return $get(`${config.API_ISLAND}/add-island-promotions-reader-count?ids=${params}`)
}

// 获取菜品参与分享人数
export function getSharePersonByDish() {
  return $get(`${config.API_ISLAND}/random-find-user-image?platformId=${config.PLATFORM_ID}`)
}

// 获取当前等级和所获得的的优惠券信息
export function getLevelInfo(params) {
  return $get(`${config.API_ISLAND}/get-state-info-island-user-pop-up-state-infos/${params.platformId}/${params.userId}`)
}

// 设置已读状态
export function setLevelStatus(params) {
  return $get(`${config.API_ISLAND}/set-state-island-user-pop-up-state-infos/${params.platformId}`)
}

// 获取霸王餐分享商品
export function getDineAndDashRecommend() {
  return $get(`${config.API_ISLAND}/find-free-lunch-pop-ups/${config.PLATFORM_ID}`)
}

// 获取分享商品
export function getDistributorProduct(params) {
  return $get(`${config.API_MERCHANT}/tcd-distributor-merchant-shops-check-success-list?platformId=${config.PLATFORM_ID}&page=${params.page}&size=${params.size}`)
}

// 获取分销门店
export function getDistributorMerchant(params) {
  return $get(`${config.API_MERCHANT}/get-brand-by-platform-id?platformId=${config.PLATFORM_ID}`)
}
// 获取分销商品
export function getDistributorCommodity(params) {
  return $get(`${config.API_PLATFORM}/platform-distributor/dish-info-show-tcd-merchant-back?platformId=${config.PLATFORM_ID}&page=${params.page}&size=${params.size}&checkState=1`)
}

// 屏蔽
export function shieldCard() {
  return $get(`${config.API_ISLAND}/test-sland-basic-infos`)
}

export function platformSystem() {
  return $get(`${config.API_UAA}/apps-by-platform-and-type/${config.PLATFORM_ID}?appType=1`)
}

/* ****************************************合伙人相关接口********************************************* */
export function distributorAllLevel() {
  return $get(`${config.API_PLATFORM}/get-all-partner-level-by-platform-id?platformId=${config.PLATFORM_ID}`)
}

export function getDistributorInfo(params) {
  return $get(`${config.API_MERCHANT}/tcd-distributors-by-platform-userId/${config.PLATFORM_ID}/${params.distributorUserId}`)
}

export async function getPartnerSetConfig(params) {
  return $get(`${config.API_PLATFORM}/get-partner-info-by-platform-id?platformId=${config.PLATFORM_ID}&code=${params.code}`)
}
// 获取我的团队页面数据
export function getTeamInfo(params) {
  return $get(`${config.API_MERCHANT}/tcd-distributors-by-platform-userId/${config.PLATFORM_ID}/${params.userId}`)
}

// 获取一级团队列表
export function getTeamMemberList(params) {
  if (params.team == 'one') {
    return $get(`${config.API_MERCHANT}/tcd-sub-one-distributors-by-parent/${config.PLATFORM_ID}/${params.parentId}?page=${params.page}&size=${params.size}&sort=id,desc`)
  }
  return $get(`${config.API_MERCHANT}/tcd-sub-two-distributors-by-parent/${config.PLATFORM_ID}/${params.parentId}?page=${params.page}&size=${params.size}&sort=id,desc`)
}

// 获取分享订单
export function getDistributorOrder(params) {
  return $get(`${config.API_MERCHANT}/find/tcd-distributor-orders?platformId=${config.PLATFORM_ID}&weappUserId=${params.weappUserId}&pattern=${params.pattern}&page=${params.page}&size=${params.size}&sort=id,desc`)
}

// 获取累计达人分享赏金和分享数
export function getDistributorAmount(params) {
  return $get(`${config.API_ISLAND}/sum-user-profits-platform-weapp-profit-count/${config.PLATFORM_ID}/${params.userId}`)
}

// 获取主页弹窗
export function getIndexModal() {
  return $get(`${config.API_PLATFORM}/system-banners-tcd/show/popup?platFormUserId=${config.PLATFORM_ID}`)
}

// 关闭主页弹窗记录
export function closeIndexModal(params) {
  return $post(`${config.API_PLATFORM}/island-user-banner-pop-up-records/${config.PLATFORM_ID}/${params.adId}`)
}

// 判断霸王餐商品库存
export function judgeDineStock(params) {
  return $get(`${config.API_SHOP}/judge-the-stock-if-adequate?skuId=${params.skuId}&platformId=${config.PLATFORM_ID}`)
}

// 判断用户是否关注公众号
export function judgeOfficialAccounts(params) {
  return $get(`${config.API_UAA}/get-user_plat_account_info?platformId=${config.PLATFORM_ID}&platType=4&userId=${params.userId}`)
}

// 首页推荐商户
export async function getRecommendList(params) {
  return $get(`${config.API_MERCHANT}/merchants-by-recommend-merchant-id?page=${params.page}&size=${params.size}&platformId=${params.platformId}&type=${params.type}&sort=${params.sort}&position=${params.position}`)
}

// 获取套餐商品
export async function getPackage(params) {
  return $get(`${config.API_PLATFORM}/get-platform-dish-by-condition?page=${params.page}&size=${params.size}&platformId=${params.platformId}&brandId=${params.brandId}&merchantId=${params.merchantId}&dishName=${params.dishName}&type=${params.type}&sort=id,desc`)
}

// 获取门点详情
export async function getMerchant(params) {
  return $get(`${config.API_MERCHANT}/get-merchant-add-info?platformId=${params.platformId}&brandId=${params.brandId}&merchantId=${params.merchantId}`)
}

// 获取门点信息
export async function getMerchantDetail(params) {
  return $get(`${config.API_MERCHANT}/get-merchant-shipping-info-by-merchantid?merchantId=${params.merchantId}&platformId=${params.platformId}`)
}

/**
 * 签到-- 当前签到信息
 *
 * */
export function getCheckInInfo(params) {
  return $get(`${config.API_SHOP}/get-user-sign-info?platformId=${params.platformId}`)
}

// 门店分类菜品
export async function getMerchantDish(params) {
  return $get(`${config.API_SHOP}/c-merchant-dish-info?merchantId=${params.merchantId}&catSourceType=TAKE_AWAY`)
}

// 根据商户编号获取商户详细信息
export async function getPlatFormAllMerchantInfos(params) {
  return $get(`${config.API_MERCHANT}/merchants-by-merchant-no/${params.merchantNos}`)
}

// 获取平台下所有商户
export async function getPlatFormAllMerchants(params) {
  return $get(`${config.API_PLATFORM}/plat-form-merchants/platform-user-all?platFormUserId=${params.id}`)
}

// 获取平台设置的首页焦点图
export async function getPlatFormBanners(params) {
  return $get(`${config.API_PLATFORM}/system-banners/show?positionCode=${params.positionCode}&platFormUserId=${params.id}`)
}

// 获取平台推荐分类
export async function getPlatFormRecommendCat(params) {
  return $get(`${config.API_PLATFORM}/plat-form-merchant-recommends/platform-user?platFormUserId=${params.id}&page=0&size=999&sort=index,desc`)
}

// 获取平台设置的分类导航
export async function getPlatFormTopNavs(params) {
  return $get(`${config.API_PLATFORM}/plat-form-shop-categories/platform-user/show?platFormUserId=${params.id}&page=0&size=20&sort=id,desc`)
}

// 获取平台设置的促销商品
export async function getPromotionDishes(params) {
  return $get(`${config.API_SHOP}/self/home-dish-info?platFormId=${params.id}`)
}

// 推荐商品
export async function recommendDish(params) {
  return $get(`${config.API_PLATFORM}/platform-recommend/dish-info/${params.platformId}?many=true`)
}

// 获取主页弹窗
export async function getIndexAd(params) {
  return $get(`${config.API_PLATFORM}/system-banners/show/popup?platFormUserId=${params.platformId}&positionCode=${params.positionCode}`)
}

// 获取满减信息
export async function getFullReduction(params) {
  return $get(`${config.API_SHOP}/get-platform/merchant-open-full-activity?platformId=${params.platformId}&merchantIdList=${params.merchantIdList}`)
}

// 获取品牌下所有门店
export async function getBrandMerchant(params) {
  return $get(`${config.API_MERCHANT}/merchants-get-bind-merchant-by-platform?platformId=${params.platformId}&page=${params.page}&size=${params.size}&brandId=${params.brandId}&position=${params.position}`)
}

// 获取门店信息
export async function getBrand(params) {
  return $get(`${config.API_MERCHANT}/brands/${params.id}`)
}

// 获取扫码品牌门店桌号信息
export async function getScanInfo(params) {
  return $get(`${config.API_MERCHANT}/get-qr-oder-base-info?merchant=${params.merchant}&merchantTable=${params.merchantTable}`)
}

// 获取点餐信息
export async function getOrderingInfo(params) {
  return $get(`${config.API_MERCHANT}/get-shopping-trolley?platForm=${config.DEFAULT_PLAT_FORM_ID}&brandId=${params.brandId}&merchant=${params.merchant}&merchantTable=${params.merchantTable}&uid=${params.uid}&userId=${params.userId}&peopleNum=${params.peopleNum}&nickName=${params.nickName}&headImageUrl=${params.headImageUrl}&payType=${params.payType}`)
}

// 获取推荐商品
export function getRecommendProduct(params) {
  return $get(`${config.API_SHOP}/c-merchant-recommend?merchantId=${params.merchantId}`)
}

// 获取扫码点餐商品
export async function getDishHome(params) {
  return $get(`${config.API_SHOP}/c-merchant-qr-dish-info?merchantId=${params.merchantId}&catSourceType=FOOD_AT_HOME`)
}

// 获取满减活动
export function fullReduction(params) {
  return $get(`${config.API_SHOP}/_search/c-qr-code-order-promotions-all?merchant=${params.merchantId}&type=0&platForm=${config.DEFAULT_PLAT_FORM_ID}`)
}

// 扫码点餐加入购物车
export async function joinCart(params) {
  return $post(`${config.API_MERCHANT}/put-product-to-shopping-trolley`, { data: params })
}

// 结束好友点餐
export async function finishScanning(params) {
  return $get(`${config.API_MERCHANT}/create-shopping-trolley-order?merchant=${params.merchantId}&merchantTable=${params.merchantTable}&uid=${params.uid}`)
}

//  重新选取人数
export function updatePeopleNum(params) {
  return $put(`${config.API_MERCHANT}/update-people-num?merchant=${params.merchant}&merchantTable=${params.merchantTable}&uid=${params.uid}&peopleNum=${params.peopleNum}&brandId=${params.brandId}`)
}

// 获取店铺活动
export async function getShopFullMinusActivity(params) {
  return $post(`${config.API_SHOP}/self/merchant-find-full-activity`, { data: params })
}

// 获取门店配送信息
export async function getSendSet(params) {
  return $get(`${config.API_MERCHANT}/new-merchant-getone-by-merchantno?merchantNo=${params.merchantNo}`)
}

// 设置默认用户地址
export async function saveDefaultUserAddress(params) {
  return $put(`${config.API_UAA}/user-addresses/userId`, { data: params })
}

// 根据地址编号获取用户地址详情
export async function getUserAddressById(params) {
  return $get(`${config.API_UAA}/user-addresses/${params.id}`)
}

// 获取品牌列表
export async function getBrandList(params) {
  return $get(`${config.API_MERCHANT}/list-brand-and-merchant-info-with-platform?page=${params.page}&size=${params.size}&platformId=${params.platformId}&position=${params.position}&sort=id,asc`)
}

// 根据品牌获取门店列表
export async function getMerchantByBrand(params) {
  return $get(`${config.API_MERCHANT}/list-merchant-info-with-platform?page=${params.page}&size=${params.size}&platformId=${params.platformId}&brandId=${params.brandId}&position=${params.position}&orderType=${params.orderType}&orderSort=2`)
}

// 获取平台下所有的门店
export async function getAllMerchant(params) {
  return $get(`${config.API_MERCHANT}/list-merchant-info-with-platform?page=${params.page}&size=${params.size}&platformId=${params.platformId}&outerOrderMod=${params.outerOrderMod}&position=${params.position}&orderSort=2&orderType=${params.orderType}`)
}
// 搜索门店
export async function searchMerchant(params) {
  return $get(`${config.API_MERCHANT}/list-merchant-dish-info-with-platform-name?platformId=${params.platformId}&key=${params.key}&position=${params.position}&page=${params.page}&size=${params.size}&sort=id,desc`)
}

// 首页推荐品牌
export async function getRecommendBrand() {
  return $get(`${config.API_PLATFORM}/platform-brand-recommends-info/list?platformId=${PLATFORM_ID}`)
}

// 分销门店
export async function getDistributeMerchant(params) {
  return $get(`${config.API_MERCHANT}/get-all-merchant-by-condition?platformId=${PLATFORM_ID}&page=${params.page}&size=${params.size}&isOpen=${true}`)
}

// 查看奖金池是否关闭
export async function getBonusPoolIsClose() {
  return $get(`${config.API_ISLAND}/get-basic-info-island-bounty-pools/${PLATFORM_ID}`)
}

// 查找优惠活动
export async function getMerchantActivity(params) {
  return $get(`${config.API_SHOP}/_search-list/qr-code-order-promotions-all?platForm=${PLATFORM_ID}&merchant=${params.merchantId}`)
}

// 获取所有门店数量
export async function getAllMerchantList() {
  return $get(`${config.API_MERCHANT}/get-tcd-merchant-business-state-num?tcdPlatformId=${PLATFORM_ID}`)
}

// 获取所有门店数量
export async function getAllBrandList() {
  return $get(`${config.API_MERCHANT}/count-brand-/entering-success/${PLATFORM_ID}`)
}

// 获取门店开启的分销业务
export async function getMerchantDistributorInfo(params) {
  return $get(`${config.API_MERCHANT}/get-all-by-merchant-id-list?platformId=${PLATFORM_ID}&merchantIdList=${params.merchantId}`)
}

// 获取平台系统设置
export async function getSystemSetting() {
  return $get(`${config.API_PLATFORM}/system-setting/${PLATFORM_ID}`)
}

// 储值-获取未领取的储值卡
export async function getStoredMoneyCardInfo({ platformId, enterpriseGuid }) {
  return $get(`${config.API_MERCHANT}/get_cards?platformId=${platformId}&enterpriseGuid=${enterpriseGuid}`)
}

// 储值-根据用户手机获取已领取的储值卡
export async function getStoredCardForPhone({ enterpriseGuid, phone, platformId }) {
  return $get(`${config.API_MERCHANT}/user_get_cards?platformId=${platformId}&enterpriseGuid=${enterpriseGuid}&phone=${phone}`)
}

// 支付-获取后配置的用户支付信息
export async function getUserPayInfoSetting({ platformId }) {
  return $get(`${config.API_PLATFORM}/plat-form-users/${platformId}`);
}

// 储值-开卡
export async function openStoredCard({
  cardGuid, cardName, systemManagementGuid, enterpriseGuid, memberInfoGuid
}) {
  return $post(`${config.API_MERCHANT}/open_card?cardGuid=${cardGuid}&cardName=${cardName}&systemManagementGuid=${systemManagementGuid}&enterpriseGuid=${enterpriseGuid}&memberInfoGuid=${memberInfoGuid}`)
}

// 储值-获取充值规则
export async function getCardRechargeRule({
  systemManagementGuid, enterpriseGuid
}) {
  return $get(`${config.API_MERCHANT}/card_rule?systemManagementGuid=${systemManagementGuid}&enterpriseGuid=${enterpriseGuid}`)
}

// 储值-获取储值卡详情
export async function getStoredCardDetail({
  enterpriseGuid, cardGuid
}) {
  return $get(`${config.API_MERCHANT}/card_detail?enterpriseGuid=${enterpriseGuid}&cardGuid=${cardGuid}`)
}

// 储值-验证储值密码
export async function verifyStoredPassword({ platformId, password }) {
  return $post(`${config.API_ISLAND}/user-check-password?platformId=${platformId}&password=${password}`)
}

// 储值-修改密码
export async function modifyStoredPassword({ platformId, password }) {
  return $post(`${config.API_ISLAND}/user-update-password?platformId=${platformId}&password=${password}`)
}

// 储值-获取储值支付所需的门店id
export async function getStoredMerchantId({ platformId }) {
  return $get(`${config.API_MERCHANT}/get-merchantNo-by-platform?platformid=${platformId}`)
}

// 轮询获取聚合支付信息
export async function getMultiPayInfo(params) {
  return $get(`${config.API_TRANSCATION}/mdmpay-prepay-polling?orderGUID=${params.orderSn}&platformId=${PLATFORM_ID}&orderSource=1`)
}

// 获取平台色调
export async function getPlatformColor(params) {
  return $get(`${config.API_PLATFORM}/get-color-platform-id/${params.id}`)
}

// 获取公众号二维码
export async function getPublicQR(params) {
  return $get(`${config.API_UAA}/apps-by-platform-and-type/${params.platformId}?appType=1`)
}

// 扫码点餐确认订单
// /shop-orders/qr
export async function submitOrder(params) {
  return $post(`${config.API_SHOP}/shop-orders/qr`, { data: params })
}

// 获取扫码点餐确认订单
export async function getOrder(params) {
  return $get(`${config.API_SHOP}/shopOrder/qr/search?merchantId=${params.merchantId}&orderSn=${params.orderSn}&platFormId=${params.platFormId}&isCompute=${params.isCompute}`)
}

//获取openID
export async function getOpenID(params) {
  return $get(`${config.API_UAA}/get-plat-account-by-user-id-and-platformId/${params.userId}?platformId=${params.platformId}&platType=3`)
}


/*
  other platform router
  1022 - end
*/
//获取token
export async function getToken(params) {
  return $post(`${config.API_GETTOKEN}areaGuid=${params.areaGuid}&brandGuid=${params.brandGuid}&diningTableGuid=${params.diningTableGuid}&enterpriseGuid=${params.enterpriseGuid}&storeGuid=${params.storeGuid}&wxUserInfoDTO.openId=${params.openid}&wxUserInfoDTO.headImgUrl=${params.headImgUrl}&wxUserInfoDTO.nickname=${params.nickname}&wxUserInfoDTO.sex=${params.sex}`)
}

//未登录，登录
export async function otherLogin(params) {
  console.log('1023=>>>>', params)
  return $post(`${config.API_OTHERPLATFORM}${config.API_LOGINOTHER}`, { data: params })
}

//获取就餐人数
export async function getPersonNum(params) {
  return $get(`${config.API_UAA}areaGuid=${params.areaGuid}&brandGuid=${params.brandGuid}&diningTableGuid=${params.diningTableGuid}&enterpriseGuid=${params.enterpriseGuid}&storeGuid=${params.storeGuid}&wxUserInfoDTO.openId=${params.openId}`)
}

//获取用户信息 get方法
export async function getConsumerInfo(params) {
  // console.log(`${config.API_OTHERPLATFORM}${config.API_OTHERCUMSUMER}`);

  return $get(`${config.API_OTHERPLATFORM}${config.API_OTHERCUMSUMER}`, { data: params })
}

//获取用户信息,post方法
export async function getConsumerInfoPost(params) {
  return $post(`${config.API_OTHERPLATFORM}${config.API_OTHERCUMSUMERPOST}`, { data: params })
}

//获取商铺商品信息
export async function getOtherPlatformGoods(params) {
  return $get(`${config.API_OTHERPLATFORM}${config.API_OTHERGOODS}`, { data: params })
}

//添加商品如购物车
export async function otherplatFormJoinCart(params) {
  return $post(`${config.API_OTHERPLATFORM}${config.API_OTHERCART}`, { data: params })
}


//获取购物车信息
export async function otherplatFormCartContent(params) {
  return $get(`${config.API_OTHERPLATFORM}${config.API_OTHERCARTCONTENT}`, { data: params })
}

//清空购物车
export async function otherClearCartContent(params) {
  return $get(`${config.API_OTHERPLATFORM}${config.API_CLEARCARTCONTENT}`, { data: params })
}

//提交购物车
export async function otherSubmitCart(params) {
  return $get(`${config.API_OTHERPLATFORM}${config.API_SUBMITCART}`, { data: params })
}


//获取当前订单信息
export async function getOtherPreOrderDetail(params) {
  return $get(`${config.API_OTHERPLATFORM}${config.API_GETORDERDETAIL}`, { data: params })
}

//获取订单
export async function getOtherOrders(params) {
  return $get(`${config.API_OTHERPLATFORM}${config.API_GETORDERS}`, { data: params })
}

//提交订单
export async function sunmitOrder(params) {
  return $post(`${config.API_OTHERPLATFORM}${config.API_SUBMITORDER}`, { data: params })
}

//获取当前未结算内的所有订单数据
export async function getAllCurrentOrder(params) {
  return $get(`${config.API_OTHERPLATFORM}${config.API_OTHERORDERBYID}/${params.otherdata.orderGuid}`, { data: params })
}

//聚合支付的微信支付之预下单
export async function preSubOrderB(params) {
  return $post(`${config.API_JUHEWECHAT}?platformId=${params.platAndUser.platformId}&weappuserId=${params.platAndUser.weappuserId}&orderSource=${params.platAndUser.orderSource}`, { data: params.bodyData })
}

//订单支付(微信)otherPay_wechatAction
export async function otherPay_wechat(params) {
  return $get(`${config.API_JUHEWECHATPAY}?platformId=${params.platformId}&weappuserId=${params.weappuserId}&orderSource=1&orderGUID=${params.orderGUID}`, { data: params })
}


//订单支付(会员)
export async function otherPay_member(params) {
  //API_OTHERMEMBERPAY
  return $post(`${config.API_OTHERPLATFORM}${config.API_OTHERPAYMBERPAY}`, { data: params })
}
//获取会员卡
export async function getMemberCardList(params) {
  return $post(`${config.API_OTHERPLATFORM}${config.API_GETMEMBERCARDLIST}`, { data: params })
}

//切换会员卡
export async function switchCard(params) {
  return $post(`${config.API_OTHERPLATFORM}${config.API_SWITCHCARD}`, { data: params })
}

//根据订单guid获取订单信息，订单未支付时不包含结算信息
export async function otherOrderbyGuid(params) {
  return $get(`${config.API_OTHERPLATFORM}${config.API_OTHERORDERBYID}/${params.otherdata.orderGuid}`, { data: params })
}

//API_OTHERORDERSETTLEMENT   根据订单guid获取订单信息，包含结算信息
export async function otherOrderSet(params) {
  return $get(`${config.API_OTHERPLATFORM}${config.API_OTHERORDERSETTLEMENT}/${params.otherdata.orderGuid}?orderGuid=${params.otherdata.orderGuid}&date=${params.otherdata.date}`, { data: params })
}

//进入买单订单状态检查
export async function otherOrderCheck(params) {
  return $get(`${config.API_OTHERPLATFORM}${config.API_OTHERORDERSTATUS}/${params.otherdata.orderGuid}`, { data: params })
}

//查询会员信息
export async function otherMemberMes(params) {
  return $get(`${config.API_OTHERPLATFORM}${config.API_MEMBERMESS}`, { data: params })
}

// 体现支付方式
export async function getCashOutWay(params) {
  return $get(`${config.API_TRANSCATION}/get-by-platfomr-id?platformId=${params.platformId}`)
}

// 储值规则适用门店
export async function getRuleMerchant(params) {
  return $get(`${config.API_MERCHANT}/card_rule_shop?systemManagementGuid=${params.systemManagementGuid}&enterpriseGuid=${params.enterpriseGuid}`)
}

// 优惠券列表
export async function getVolumeList(params) {
  return $post(`${config.API_OTHERPLATFORM}${config.API_VOLUMELIST}`, { data: params })
}

// 优惠券使用
export async function useVolume(params) {
  return $post(`${config.API_OTHERPLATFORM}${config.API_USE_VOLUM}`, { data: params })
}

// 确认优惠券
export async function confirmUseVolume(params) {
  return $post(`${config.API_OTHERPLATFORM}${config.API_CONFIRM_USE}`, { data: params })
}

// 获取配送信息
export async function getSendInfo(params) {
  return $get(`${config.API_MERCHANT}/platform-merchant-get-shippinginfo-show-c?platformId=${params.platformId}&merchantId=${params.merchantId}`)
}

export async function prePay(params) {
  return $get(`${config.API_OTHERPLATFORM}${config.API_PREPAY}`, { data: params })
}

//会员支付
export async function memberPay(params) {
  return $post(`${config.API_OTHERPLATFORM}${config.API_MEMBERPAY}`, { data: params })
}


//getMemberCard
export async function getMemberCard(params) {
  return $get(`${config.API_OTHERPLATFORM}${config.API_PAYWAY}`, { data: params })
}

//API_ORDERDEFREY  支付，通知对面
export async function orderDefrey(params) {
  return $post(`${config.API_OTHERPLATFORM}${config.API_ORDERDEFREY}`, { data: params })
}

//API_OTHERPAYWECHT
export async function otherWechat(params) {
  return $post(`${config.API_OTHERPLATFORM}${config.API_OTHERPAYWECHT}`, { data: params })
}

//扫码点餐弹窗
export async function popWindow(params) {
  console.log("1206=>>>>>>>>>>>>", params)
  return $get(`${config.API_MERCHANT}/qr-code-orders/${params.merchantId}`)
}