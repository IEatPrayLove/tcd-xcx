import {
  getCouponDetail, getCouponList, getRecommendCoupon, getCouponUseInfo
} from '../../utils/api'
import {
  isFunction
} from '../../utils/utils'

export default {
  namespace: 'rightsCoupon',

  state: {},

  effects: {
    * getRecommendCouponAction({ payload, callback }, { call }) {
      const res = yield call(getRecommendCoupon, payload)
      isFunction(callback) && callback(res)
    },
    * getCouponListAction({ payload, callback }, { call }) {
      const res = yield call(getCouponList, payload)
      isFunction(callback) && callback(res)
    },
    * getCouponDetailAction({ payload, callback }, { call }) {
      const res = yield call(getCouponDetail, payload)
      isFunction(callback) && callback(res)
    },
    * getCouponUseInfoAction({ payload, callback }, { call }) {
      const res = yield call(getCouponUseInfo, payload)
      isFunction(callback) && callback(res)
    }
  },

  reducers: {}

}
