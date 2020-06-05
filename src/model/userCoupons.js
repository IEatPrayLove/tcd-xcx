import {
  getUserOfferCoupon, getExpiredOfferCoupon
} from '../utils/api'
import { isFunction } from '../utils/utils'

export default {
  namespace: 'userCoupons',
  state: {},

  effects: {
    /**
         * 获取用户红包
         *
         * @param payload
         * @param callback
         * @param call
         * @param put
         */
    * getUserOfferCouponAction({ payload, callback }, { call, put }) {
      const res = yield call(getUserOfferCoupon, payload)
      isFunction(callback) && callback(res)
    },
    * getExpiredOfferCouponAction({ callback }, { call }) {
      const res = yield call(getExpiredOfferCoupon)
      isFunction(callback) && callback(res)
    }

  },
  reducers: {

  }
}
