import {
  getPropagandaList, getAllChannel, getChannelLevel,
  getPropagandaOrder, updateAuthor
} from '../../utils/api'
import { isFunction } from '../../utils/utils'

export default {
  namespace: 'propagandaReward',

  state: {},

  effects: {
    // 宣发赏金列表
    * getPropagandaListAction({ payload, callback }, { call, put }) {
      const res = yield call(getPropagandaList, payload)
      isFunction(callback) && callback(res)
    },
    // 获取所有渠道（用于筛选）
    * getAllChannelAction({ payload, callback }, { call, put }) {
      const res = yield call(getAllChannel, payload)
      isFunction(callback) && callback(res)
    },
    // 获取渠道下的等级（用于筛选）
    * getChannelLevelAction({ payload, callback }, { call, put }) {
      const res = yield call(getChannelLevel, payload)
      isFunction(callback) && callback(res)
    },
    // 宣发 接单
    * getPropagandaOrderAction({ payload, callback }, { call, put }) {
      const res = yield call(getPropagandaOrder, payload)
      isFunction(callback) && callback(res)
    },
    // 更新阅读数
    * updateAuthorAction({ payload, callback }, { call }) {
      const res = yield call(updateAuthor, payload)
      isFunction(callback) && callback(res)
    }
  },

  reducers: {}

}
