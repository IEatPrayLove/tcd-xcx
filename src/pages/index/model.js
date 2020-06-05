import {
  getRecommendGoods, getRecommendationList, getAppletsAd,
  getStarSelectList, getStarType, getRecommendPropaganda,
  getProductIsDistribution, getIndexNav, setUserVisitRecord,
  getIndexModal, closeIndexModal, getRecommendList, getRecommendCoupon,
  getTalentInfo, getUserLegendsCardInfo, getUserMemberInfo, existsPartner,
  getBonusPoolConfig, getRecommendBrand, getBonusPoolIsClose,
  getAllMerchantList, getAllBrandList, getSystemSetting
} from '../../utils/api'
import { isFunction } from '../../utils/utils'

export default {
  namespace: 'index',

  state: {},

  effects: {
    // 主页所有接口
    * getAllIndexInterfaceAction({ payload, callback }, { call, put, all }) {
      const {
        advertisement, recommendGood,
        recommendPropaganda, recommendCoupon,
        indexNav, recommendMerchant
      } = payload
      const res = yield all([
        call(getAppletsAd, advertisement),
        call(getRecommendationList, recommendGood),
        call(getRecommendPropaganda, recommendPropaganda),
        call(getRecommendCoupon, recommendCoupon),
        call(getIndexNav, indexNav),
        call(getBonusPoolConfig),
        call(getRecommendList, recommendMerchant),
        call(getRecommendBrand),
        call(getBonusPoolIsClose),
        call(getAllMerchantList),
        call(getAllBrandList)
      ])
      if (res.every(({ ok }) => ok)) {
        callback({
          appletsAd: res[0].data,
          recommendGood: res[1].data,
          recommendPropaganda: res[2].data,
          recommendCoupon: res[3].data,
          indexNav: res[4].data,
          bonusPool: res[5].data,
          recommendMerchant: res[6].data,
          recommendBrand: res[7].data,
          bonusPollIsClose: res[8].data,
          allMerchantAndBrand: {
            allMerchant: res[9].data,
            allBrand: res[10].data
          }
        })
      }
    },
    // 主页需要登录的接口
    * getLoginInterfaceAction({ payload, callback }, { call, put, all }) {
      const res = yield all([
        call(getUserLegendsCardInfo, payload),
        call(getUserMemberInfo),
        call(existsPartner),
        call(getTalentInfo),
        call(setUserVisitRecord)
      ])
      if (res.every(({ ok }) => ok)) {
        callback({
          tcdCard: res[0].data,
          memberInfo: res[1].data,
          partner: res[2].data
        })
        // yield put({
        //   type: 'mine/saveTalentPlatform',
        //   payload: res[3].data
        // })
      }
    },
    * getRecommendGoodsAction({ payload, callback }, { call }) {
      const res = yield call(getRecommendGoods, payload)
      isFunction(callback) && callback(res)
    },
    // 获取特惠分享商品
    * getRecommendationListAction({ payload, callback }, { call }) {
      const res = yield call(getRecommendationList, payload)
      isFunction(callback) && callback(res)
    },
    // 获取星选列表
    * getStarSelectListAction({ payload, callback }, { call }) {
      const res = yield call(getStarSelectList, payload)
      isFunction(callback) && callback(res)
    },
    // 获取星选类型
    * getStarTypeAction({ payload, callback }, { call }) {
      const res = yield call(getStarType, payload)
      isFunction(callback) && callback(res)
    },
    // 获取宣发任务分享信息
    * getRecommendPropagandaAction({ payload, callback }, { call }) {
      const res = yield call(getRecommendPropaganda, payload)
      isFunction(callback) && callback(res)
    },
    // 获取小程序广告位
    * getAppletsAdAction({ payload, callback }, { call }) {
      const res = yield call(getAppletsAd, payload)
      isFunction(callback) && callback(res)
    },
    // 获取商品是否为分享商品
    * getProductIsDistributionAction({ payload, callback }, { call }) {
      const res = yield call(getProductIsDistribution, payload)
      isFunction(callback) && callback(res)
    },
    // 获取主页导航
    * getIndexNavAction({ payload, callback }, { call }) {
      const res = yield call(getIndexNav, payload)
      isFunction(callback) && callback(res)
    },
    // 增加用户访问记录
    * setUserVisitRecordAction({ callback }, { call }) {
      const res = yield call(setUserVisitRecord)
      isFunction(callback) && callback(res)
    },
    // 获取主页弹窗
    * getIndexModalAction({ callback }, { call }) {
      const res = yield call(getIndexModal)
      isFunction(callback) && callback(res)
    },
    // 关闭主页弹窗记录
    * closeIndexModalAction({ callback, payload }, { call }) {
      const res = yield call(closeIndexModal, payload)
      isFunction(callback) && callback(res)
    },
    * getRecommendMerchantAction({ callback, payload }, { call, put }) {
      const res = yield call(getRecommendList, payload)
      isFunction(callback) && callback(res)
    },
    // 获取平台系统设置
    * getSystemSettingAction({ callback, payload }, { call, put }) {
      const res = yield call(getSystemSetting, payload)
      isFunction(callback) && callback(res)
    },

  
  },

  reducers: {}

}
