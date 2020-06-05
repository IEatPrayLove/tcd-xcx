import {
  getLegendsCardMoney, getLegendsCardInfo, buyLegendsCard, getPrepay,
  getUserLegendsCardInfo, existsPartner, getThisPeriodBonusPoolInfo, getLastTermBonusPoolInfo,
  getShareQrCode, getLegendsBounty, userDragInto, getRewardPoolConfig, getUserLegendsCardDetail
} from '../../utils/api'
import {
  isFunction
} from '../../utils/utils'

export default {
  namespace: 'legendsCard',

  state: {
    legendsCardInfo: {},
    limitLegendsCardPrice: 0
  },

  effects: {
    // 获取会员卡现时价
    * getLegendsCardMoneyAction({ payload, callback }, { call, put }) {
      const res = yield call(getLegendsCardMoney)
      isFunction(callback) && callback(res)
      // if (res.ok) {
      //   yield put({
      //     type: 'limitPriceResult',
      //     payload: res.data
      //   })
      // }
    },
    // 会员卡信息
    * getLegendsCardInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(getLegendsCardInfo)
      isFunction(callback) && callback(res)
      // if (res.ok) {
      //   yield put({
      //     type: 'legendsCardInfoResult',
      //     payload: res.data
      //   })
      // }
    },
    // 购买会员卡
    * buyLegendsCardAction({ payload, callback }, { call, put }) {
      const res = yield call(buyLegendsCard, payload)
      isFunction(callback) && callback(res)
    },
    // 获取小程序预交易单
    * getPrepayAction({ payload, callback }, { call, put }) {
      const res = yield call(getPrepay, payload)
      isFunction(callback) && callback(res)
    },
    // 获取用户最新的会员信息
    * getUserLegendsCardInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(getUserLegendsCardInfo, payload)
      isFunction(callback) && callback(res)
    },
    // 获取本期奖金池信息
    * getThisPeriodBonusPoolInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(getThisPeriodBonusPoolInfo)
      isFunction(callback) && callback(res)
    },
    // 获取上期奖金池信息
    * getLastTermBonusPoolInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(getLastTermBonusPoolInfo)
      isFunction(callback) && callback(res)
    },
    // 获取分享二维码
    * getShareQrCodeAction({ payload, callback }, { call, put }) {
      const res = yield call(getShareQrCode, payload)
      isFunction(callback) && callback(res)
    },
    // 获取会员卡赏金
    * getLegendsBountyAction({ callback }, { call }) {
      const res = yield call(getLegendsBounty)
      isFunction(callback) && callback(res)
    },
    // 获取用户拉入人数及总赏金
    * userDragIntoAction({ callback }, { call }) {
      const res = yield call(userDragInto)
      isFunction(callback) && callback(res)
    },
    // 获取奖金池基础配置
    * getRewardPoolConfigAction({ callback }, { call }) {
      const res = yield call(getRewardPoolConfig)
      isFunction(callback) && callback(res)
    },
    // 获取会员卡收入明细
    * getUserLegendsCardDetail({ payload, callback }, { call }) {
      const res = yield call(getUserLegendsCardDetail, payload)
      isFunction(callback) && callback(res)
    }
  },

  reducers: {
    legendsCardInfoResult(state, { payload }) {
      return {
        ...state,
        legendsCardInfo: payload
      }
    },
    limitPriceResult(state, { payload }) {
      return {
        ...state,
        limitLegendsCardPrice: payload
      }
    }
  }

}
