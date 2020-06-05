import {
  getCheckInInfo, getMerchantDish, getMerchantInfo,
  getPlatFormAllMerchantInfos, getPlatFormAllMerchants,
  getPlatFormBanners, getPlatFormById, getPlatFormRecommendCat,
  getPlatFormSystemSettingById, getPlatFormTopNavs, getPromotionDishes,
  putLocationNameByCoordinate, recommendDish, getIndexAd,
  getMerchantDetail, getFullReduction, getPackage, getMerchant,
  getBrandMerchant, getBrand, getScanInfo, getOrderingInfo, getRecommendProduct,
  getDishHome, fullReduction, joinCart, finishScanning, updatePeopleNum,
  getScanningMerchantInfo, submitOrder, getOrder, getFullCutAmount, getOtherOrderDetail, sunmitOrder,getAllCurrentOrder
} from '../utils/api'
import { isFunction, timeIsRange, typeAnd } from '../utils/utils'
import { MERHCANT_WEEK } from '../config/config'

export default {
  namespace: 'orderDishes',
  state: {
    platformSystemSetting: {},
    merchants: [],
    curMerchantInfo: {},
    isSnoring: false
  },

  effects: {
    /**
     * 获取平台基础信息
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getPlatFormByIdAction({ payload, callback }, { call, put }) {
      const res = yield call(getPlatFormById, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 获取平台系统设置
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getPlatFormSystemSettingByIdAction({ payload, callback }, { call, put }) {
      const res = yield call(getPlatFormSystemSettingById, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'getPlatFormSystemSettingByIdResult',
          payload: res.data
        })
      }
    },

    /**
     * 获取平台焦点图设置
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getPlatFormBannersAction({ payload, callback }, { call, put }) {
      const res = yield call(getPlatFormBanners, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 获取平台导航设置
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getPlatFormTopNavsAction({ payload, callback }, { call, put }) {
      const res = yield call(getPlatFormTopNavs, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 根据坐标获取实际地理位置
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* putPutLocationNameByPositionAction({ payload, callback }, { call, put }) {
      const res = yield call(putLocationNameByCoordinate, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 获取平台促销商品
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getPlatFormPromotionDishesAction({ payload, callback }, { call, put }) {
      const res = yield call(getPromotionDishes, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 获取平台所有合作商户
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getPlatFormMerchantsAction({ payload, callback }, { call, put }) {
      const res = yield call(getPlatFormAllMerchants, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 根据商户编号获取商户详情
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getPlatFormMerchantInfosAction({ payload, callback }, { call, put }) {
      const res = yield call(getPlatFormAllMerchantInfos, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'getPlatFormMerchantInfosResult',
          payload: res.data
        })
      }
    },

    /**
     * 获取平台推荐分类
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getPlatFormRecommendCatAction({ payload, callback }, { call, put }) {
      const res = yield call(getPlatFormRecommendCat, payload)
      isFunction(callback) && callback(res)
    },
    /**单店模式- 获取门店信息**/* getMerchantInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(getScanningMerchantInfo, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        const { shopHours, businessHours } = res.data[0]
        const week = new Date().getDay()
        const timer = shopHours.split(',')
          .some(ele => {
            const [beginTime, endTime] = ele.split('-')
            return timeIsRange(beginTime, endTime)
          })
        if (!typeAnd(businessHours, MERHCANT_WEEK[week].value) || !timer) {
          yield put({
            type: 'getIsSnoringMerchantResult',
            payload: true
          })
        }
        yield put({
          type: 'getCurrentMerchant',
          payload: res.data
        })
      }

    },
    /**单店模式- 获取门店菜品**/* getMerchantDishAction({ payload, callback }, { call, put }) {
      const res = yield call(getMerchantDish, payload)
      isFunction(callback) && callback(res)
    },
    /**获取推荐商品*/* recommendDishAction({ payload, callback }, { call, put }) {
      const res = yield call(recommendDish, payload)
      isFunction(callback) && callback(res)
    },
    /**获取签到信息*/* getCheckInInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(getCheckInInfo, payload)
      isFunction(callback) && callback(res)
    },
    /*获取主页弹窗*/
    * getIndexAdAction({ payload, callback }, { call, put }) {
      const res = yield call(getIndexAd, payload)
      isFunction(callback) && callback(res)
    },
    // 获取门店信息
    * getMerchantDetailAction({ payload, callback }, { call, put }) {
      const res = yield call(getMerchantDetail, payload)
      isFunction(callback) && callback(res)
    },
    // 获取满减信息
    * getFullReductionAction({ payload, callback }, { call, put }) {
      const res = yield call(getFullReduction, payload)
      isFunction(callback) && callback(res)
    },
    // 获取套餐商品
    * getPackageAction({ payload, callback }, { call, put }) {
      const res = yield call(getPackage, payload)
      isFunction(callback) && callback(res)
    },
    // 获取门点详情
    * getMerchantAction({ payload, callback }, { call, put }) {
      const res = yield call(getMerchant, payload)
      isFunction(callback) && callback(res)
    },
    // 获取品牌下所有门店
    * getBrandMerchantAction({ payload, callback }, { call, put }) {
      const res = yield call(getBrandMerchant, payload)
      isFunction(callback) && callback(res)
    },
    // 获取门店信息
    * getBrandAction({ payload, callback }, { call, put }) {
      const res = yield call(getBrand, payload)
      isFunction(callback) && callback(res)
    },
    * getScanInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(getScanInfo, payload)
      isFunction(callback) && callback(res)
    },
    * getOrderingInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(getOrderingInfo, payload)
      isFunction(callback) && callback(res)
    },
    // 获取推荐商品&全部商品&满减活动
    * getProductAction({ payload, callback }, { call, put, all }) {
      const [recommend, common, moneyOff] = yield all([
        call(getRecommendProduct, payload),
        call(getDishHome, payload),
        call(fullReduction, payload)
      ])
      if (recommend.ok && common.ok && moneyOff.ok) {
        isFunction(callback) && callback({
          common: common.data,
          recommend: recommend.data,
          moneyOff: moneyOff.data
        })
      }
    },
    * joinCartAction({ payload, callback }, { call, put }) {
      const res = yield call(joinCart, payload)
      isFunction(callback) && callback(res)
    },
    * finishScanningAction({ payload, callback }, { call, put }) {
      const res = yield call(finishScanning, payload)
      isFunction(callback) && callback(res)
    },
    // 重新选取人数
    * updatePeopleNumAction({ payload, callback }, { call, put }) {
      const res = yield call(updatePeopleNum, payload)
      isFunction(callback) && callback(res)
    },
    // 扫码点餐确认订单
    * submitOrderAction({ payload, callback }, { call, put }) {
      const res = yield call(submitOrder, payload)
      isFunction(callback) && callback(res)
    },
    // 获取扫码点餐确认订单
    * getOrderAction({ payload, callback }, { call, put }) {
      const res = yield call(getOrder, payload)
      isFunction(callback) && callback(res)
    },
    // 获取扫码点餐满减金额
    * getFullCutAmountAction({ payload, callback }, { call, put }) {
      const res = yield call(getFullCutAmount, payload)
      isFunction(callback) && callback(res)
    },


    /**
     * otherplatform router
     *  立即下单  => 提交订单 
     * 
     * getOtherOrderDetail, sunmitOrder
     */

    //scanningIndex => func(buynow)    立即下单 返回购物车数据
    * getOtherOrderDetailAction({payload,callback},{call}){
      const res = yield call(getOtherOrderDetail, payload);
      isFunction(callback) && callback(res);
    },

  },

  reducers: {
    save(state, { payload }) {
      return { ...state, ...payload }
    },

    /**
     * 获取平台系统设置结果
     *
     * @param state
     * @param payload
     * @returns {{platformSystemSetting: *}}
     */
    getPlatFormSystemSettingByIdResult(state, { payload }) {
      return {
        ...state,
        platformSystemSetting: payload
      }
    },

    /**
     * 获取商户详情结果集
     *
     * @param state
     * @param payload
     * @returns {{merchants: *}}
     */
    getPlatFormMerchantInfosResult(state, { payload }) {
      return {
        ...state,
        merchants: payload
      }
    },

    /**单店模式-- 获取商户信息*/
    getCurrentMerchant(state, { payload }) {
      return {
        ...state,
        curMerchantInfo: payload
      }
    },

    /**单电模式-- 店铺(打烊/营业)状态*/
    getIsSnoringMerchantResult(state, { payload }) {
      return {
        ...state,
        isSnoring: payload
      }
    }
  }

}
