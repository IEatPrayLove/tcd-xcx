import { getUserAddress } from '../utils/api'
import { isFunction, locationArea, objNotNull } from '../utils/utils'

export default {
  namespace: 'userAddress',
  state: {
    addressList: [], // 地址列表
    notInRangeList: [] // 不在范围的地址
  },

  effects: {
    // 获取用户地址
    * getUserAddressAction({ payload, callback }, { call, put }) {
      const res = yield call(getUserAddress)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'getUserAddressResult',
          payload: {
            list: res.data,
            range: payload
          }
        })
      }
    },

    // 修改(新增/编辑)地址(前端操作)
    * modifyAddressAction({ payload, callback }, { call, put }) {
      yield put({
        type: 'modifyAddressResult',
        payload: payload,
        callback: callback
      })
    }
  },

  reducers: {
    getUserAddressResult(state, { payload }) {
      let notInRangeList = []
      let InRangeList = [...payload.list]
      if (objNotNull(payload.range)) {
        InRangeList = []
        payload.list.map(ele => {
          const [longitude, latitude] = ele.coordinate.split(',')
          locationArea(payload.range, {
            longitude,
            latitude
          }) ? InRangeList.push(ele) : notInRangeList.push(ele)
        })
      }
      return {
        ...state,
        addressList: InRangeList,
        notInRangeList
      }
    },
    modifyAddressResult(state, { payload, callback }) {
      isFunction(callback) && callback({ ok: true })
      return {
        ...state,
        addressList: payload.type === 'EDIT' ? state.addressList.map(o => {
          return o.id === payload.data.id ? { ...payload.data } : { ...o }
        }) : [...state.addressList, payload.data]
      }
    }
  }

}
