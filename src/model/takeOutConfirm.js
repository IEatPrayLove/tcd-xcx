import {
  deleteUserAddressById, getDefaultUserAddress, getPrepay,
  getShopFullMinusActivity, getUserAddress, getUserCanUseBonus,
  saveDefaultUserAddress, saveShopOrder, getSendSet, getUserAddressById, saveUserAddress,
  searchMerchant
} from '../utils/api'
import { isFunction } from '../utils/utils'

export default {
  namespace: 'takeOutConfirm',
  state: {},

  effects: {
    /**
     * 获取用户默认地址
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getUserDefaultAddressAction({ payload, callback }, { call, put }) {
      const res = yield call(getDefaultUserAddress, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 获取店铺红包
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getUserCanUseBonusAction({ payload, callback }, { call, put }) {
      const res = yield call(getUserCanUseBonus, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 获取店铺满减活动
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getShopFullMinusActivityAction({ payload, callback }, { call, put }) {
      const res = yield call(getShopFullMinusActivity, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 保存店铺订单
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* saveShopOrderAction({ payload, callback }, { call, put }) {
      const res = yield call(saveShopOrder, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 获取小程序预交易单
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getPrepayAction({ payload, callback }, { call, put }) {
      const res = yield call(getPrepay, payload)
      isFunction(callback) && callback(res)
    },
    // 获取门店配送信息
    * getSendSetAction({ payload, callback }, { call, put }) {
      const res = yield call(getSendSet, payload)
      isFunction(callback) && callback(res)
    },
    /**
     * 获取用户地址
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */
    * getUserAddressAction({ payload, callback }, { call, put }) {
      const res = yield call(getUserAddress, payload)
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
    /**
     * 删除用户地址
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */
    * deleteUserAddressByIdAction({ payload, callback }, { call, put }) {
      const res = yield call(deleteUserAddressById, payload)
      isFunction(callback) && callback(res)
    },
    /**
     * 设置默认用户地址
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */
    * saveDefaultUserAddressAction({ payload, callback }, { call, put }) {
      const res = yield call(saveDefaultUserAddress, payload)
      isFunction(callback) && callback(res)
    },
    /**
     * 获取用户地址详细信息
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */
    * getUserAddressByIdAction({ payload, callback }, { call, put }) {
      const res = yield call(getUserAddressById, payload)
      isFunction(callback) && callback(res)
    },
    /**
     * 保存用户地址
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */
    * saveUserAddressAction({ payload, callback }, { call, put }) {
      const res = yield call(saveUserAddress, payload)
      isFunction(callback) && callback(res)
    },
    /**
     * 搜索门店
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */
    * searchMerchantAction({ payload, callback }, { call, put }) {
      const res = yield call(searchMerchant, payload)
      isFunction(callback) && callback(res)
    },


 


  },
  reducers: {}
}
