import {
  getLevelInfo,
  setLevelStatus
} from '../../utils/api'
import { isFunction } from '../../utils/utils'


export default {
  namespace: 'rightsDescription',

  state: {},

  effects: {
    // 获取当前等级和所获得的的优惠券信息
    * getLevelInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(getLevelInfo, payload)
      isFunction(callback) && callback(res)
    },
    // 设置已读状态
    * setLevelStatusAction({ payload, callback }, { call, put }) {
      const res = yield call(setLevelStatus, payload)
      isFunction(callback) && callback(res)
    }
  },

  reducers: {}
}
