import {
  deleteUserAddressById,
  putLocationNameByCoordinate,
  saveUserAddress
} from '../../utils/api'
import { isFunction } from '../../utils/utils'

export default {
  namespace: 'userAddressModify',
  state: {},

  effects: {
    // 保存用户地址
    * saveUserAddressAction({ payload, callback }, { call, put }) {
      const res = yield call(saveUserAddress, payload)
      isFunction(callback) && callback(res)
    },
    // 删除用户地址
    * deleteUserAddressByIdAction({ payload, callback }, { call, put }) {
      const res = yield call(deleteUserAddressById, payload)
      isFunction(callback) && callback(res)
    },
    * putPutLocationNameByPositionAction({ payload, callback }, { call, put }) {
      const res = yield call(putLocationNameByCoordinate, payload)
      isFunction(callback) && callback(res)
    }
  },

  reducers: {}

}
