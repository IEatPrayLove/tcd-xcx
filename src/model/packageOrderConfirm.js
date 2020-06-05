import { getPrepay, saveShopOrder } from '../utils/api'
import { isFunction } from '../utils/utils'

export default {
  namespace: 'orderConfirm',
  state: {
    redPackage: [] // 红包信息
  },

  effects: {

    // 保存店铺订单
    * saveShopOrderAction({ payload, callback }, { call, put }) {
      const res = yield call(saveShopOrder, payload)
      isFunction(callback) && callback(res)
    },

    // 获取小程序预交易单
    * getPrepayAction({ payload, callback }, { call, put }) {
      const res = yield call(getPrepay, payload)
      isFunction(callback) && callback(res)
    }
  },

  reducers: {}

}
