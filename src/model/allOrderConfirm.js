import {
    getSendInfo,
    getMerchantDetail
} from '../utils/api'
import { isFunction } from '../utils/utils'
  
export default {
    namespace: 'allOrderConfirm',
    state: {
        
    },

    effects: {
        // 获取配送信息
        * getSendInfoAction({ payload, callback }, { call, put }) {
            const res = yield call(getSendInfo, payload)
            isFunction(callback) && callback(res)
        },
        // 获取门店详情
        * getMerchantDetailAction({ payload, callback }, { call, put }) {
            const res = yield call(getMerchantDetail, payload)
            isFunction(callback) && callback(res)
        }
    },

    reducers: {
        
    }
}
  