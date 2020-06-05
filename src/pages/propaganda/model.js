import {
  getPropagandaOrderList, finishPropagandaOrder, submitPropaganda,
  withdrawPropaganda
} from '../../utils/api'
import { isFunction } from '../../utils/utils'

export default {
  namespace: 'propaganda',

  state: {},

  effects: {
    // 宣发任务列表
    * getPropagandaOrderList({ payload, callback }, { call, put }) {
      const res = yield call(getPropagandaOrderList, payload)
      isFunction(callback) && callback(res)
    },
    // 手动结束宣传任务
    * finishPropagandaOrderAction({ payload, callback }, { call, put }) {
      const res = yield call(finishPropagandaOrder, payload)
      isFunction(callback) && callback(res)
    },
    // 提交宣发任务单
    * submitPropagandaAction({ payload, callback }, { call, put }) {
      const res = yield call(submitPropaganda, payload)
      isFunction(callback) && callback(res)
    },
    // 撤回宣发任务单
    * withdrawPropagandaAction({ payload, callback }, { call, put }) {
      const res = yield call(withdrawPropaganda, payload)
      isFunction(callback) && callback(res)
    }
  },

  reducers: {}

}
