import {
  getDineAndDashList, signUpDineAndDash,
  viewDineAndDashAward, closeDineAndDashAward,
  getDineAndDashRecordList, getDineAndDashRecommend,
  judgeDineStock
} from '../../utils/api'
import {
  isFunction
} from '../../utils/utils'

export default {
  namespace: 'dineAndDash',

  state: {},

  effects: {
    // 获取霸王餐列表
    * getDineAndDashListAction({ callback }, { call }) {
      const res = yield call(getDineAndDashList)
      isFunction(callback) && callback(res)
    },
    // 参与报名
    * signUpDineAndDashAction({ payload, callback }, { call }) {
      const res = yield call(signUpDineAndDash, payload)
      isFunction(callback) && callback(res)
    },
    // 获取霸王餐中奖弹窗
    * viewDineAndDashAwardAction({ payload, callback }, { call }) {
      const res = yield call(viewDineAndDashAward, payload)
      isFunction(callback) && callback(res)
    },
    // 关闭霸王餐中奖弹窗
    * closeDineAndDashAwardAction({ payload, callback }, { call }) {
      const res = yield call(closeDineAndDashAward, payload)
      isFunction(callback) && callback(res)
    },
    // 获取霸王餐记录
    * getDineAndDashRecordAction({ payload, callback }, { call }) {
      const res = yield call(getDineAndDashRecordList, payload)
      isFunction(callback) && callback(res)
    },
    // 获取霸王餐分享
    * getDineAndDashRecommendAction({ payload, callback }, { call }) {
      const res = yield call(getDineAndDashRecommend, payload)
      isFunction(callback) && callback(res)
    },
    // 判断霸王餐商品库存
    * judgeDineStockAction({ payload, callback }, { call }) {
      const res = yield call(judgeDineStock, payload)
      isFunction(callback) && callback(res)
    }
  },

  reducers: {}

}
