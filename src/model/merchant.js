import {
  getPackage, getMerchant, getMerchantDetail,
  getMerchantInfo, saveShopOrder, getPrepay,
  getBrandList, getMerchantByBrand, getAllMerchant,
  getMerchantActivity, getMerchantDistributorInfo
} from '../utils/api'

import {
  isFunction
} from '../utils/utils'

export default {
  namespace: 'merchant',

  state: {},

  effects: {
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
    // 获取门店信息
    * getMerchantDetailAction({ payload, callback }, { call, put }) {
      const res = yield call(getMerchantDetail, payload)
      isFunction(callback) && callback(res)
    },
    // 获取门店详情
    * getMerchantInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(getMerchantInfo, payload)
      isFunction(callback) && callback(res)
    },
    // 保存店铺订单
    * saveShopOrderAction({ payload, callback }, { call, put }) {
      const res = yield call(saveShopOrder, payload)
      isFunction(callback) && callback(res)
    },
    // 获取小程序预交易单
    * getPrepayAction({ payload, callback }, { call, put }) {
      const res = yield call(getPrepay, payload)
      isFunction(callback) && callback(res)
    },
    // 获取所有品牌列表
    * getBrandListAction({ payload, callback }, { call, put }) {
      const res = yield call(getBrandList, payload)
      isFunction(callback) && callback(res)
    },
    * getMerchantByBrandAction({ payload, callback }, { call, put }) {
      const res = yield call(getMerchantByBrand, payload)
      isFunction(callback) && callback(res)
    },
    // 获取所有门店
    * getAllMerchantAction({ payload, callback }, { call, put }) {
      const res = yield call(getAllMerchant, payload)
      isFunction(callback) && callback(res)
    },
    // 获取门店满减活动
    * getMerchantActivityAction({ payload, callback }, { call, put }) {
      const res = yield call(getMerchantActivity, payload)
      isFunction(callback) && callback(res)
    },
    // 获取门店分销列表
    * getMerchantDistributorInfo({ payload, callback }, { call, put }) {
      const res = yield call(getMerchantDistributorInfo, payload)
      isFunction(callback) && callback(res)
    }
  },

  reducers: {}

}
