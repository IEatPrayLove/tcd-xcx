import {
  getStoredCardForPhone, getStoredMoneyCardInfo,
  openStoredCard, getCardRechargeRule, getStoredCardDetail,
  verifyStoredPassword, modifyStoredPassword, getStoredMerchantId, getRuleMerchant,
  getUserPayInfoSetting,
} from '../utils/api'
import { isFunction } from '../utils/utils'

export default {
  namespace: 'storedMoney',
  state: {
    alreadyStoredCards: [],
    notStoredCards: [],
    userMemberInfo: {},
    curStoredCardIndex: 0,
    curStoredCard: {}
  },
  effects: {
    // 获取已开通及未开通的卡
    * getStoredCardForPhoneAction({ payload, callback }, { call, put, select }) {
      const res = yield call(getStoredCardForPhone, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        const { memberCardListRespDTOs } = res.data
        const { enterpriseGuid } = payload
        const curStoredCardIndex = yield select(state => state.storedMoney.curStoredCardIndex)
        yield put({
          type: 'getStoredCardDetailAction',
          payload: {
            newList: memberCardListRespDTOs,
            curStoredCardIndex,
            enterpriseGuid
          }
        })
        yield put({
          type: 'setStoredCards',
          payload: res.data
        })
      }
    },
    // 开通储值卡
    * openStoredCardAction({ payload, callback }, { call }) {
      const res = yield call(openStoredCard, payload)
      isFunction(callback) && callback(res)
    },
    // 获取开卡规则
    * getCardRechargeRuleAction({ payload, callback }, { call }) {
      const res = yield call(getCardRechargeRule, payload)
      isFunction(callback) && callback(res)
    },
    // 获取储值卡详情
    * getStoredCardDetailAction({ payload, callback }, { call, select, put }) {
      const { newList, curStoredCardIndex, enterpriseGuid } = payload
      const oldList = yield select(state => state.storedMoney.alreadyStoredCards)
      const alreadyStoredCards = newList || oldList
      let storedCardIndex = curStoredCardIndex
      let cardGuid = null
      if (!alreadyStoredCards || !alreadyStoredCards.length) return
      if (alreadyStoredCards[storedCardIndex]) {
        cardGuid = alreadyStoredCards[storedCardIndex].cardGuid
      } else {
        storedCardIndex = 0
        cardGuid = alreadyStoredCards[storedCardIndex].cardGuid
      }
      const param = {
        cardGuid,
        enterpriseGuid
      }
      const res = yield call(getStoredCardDetail, param)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'setCurStoredCardDetail',
          payload: {
            curStoredCardIndex: storedCardIndex,
            curStoredCard: res.data
          }
        })
      }
    },
    // 验证储值密码
    * verifyStoredPasswordAction({ payload, callback }, { call }) {
      const res = yield call(verifyStoredPassword, payload)
      isFunction(callback) && callback(res)
    },
    // 修改储值密码
    * modifyStoredPasswordAction({ payload, callback }, { call }) {
      const res = yield call(modifyStoredPassword, payload)
      isFunction(callback) && callback(res)
    },
    // 获取充值所需的平台id
    * getStoredMerchantIdAction({ payload, callback }, { call }) {
      const res = yield call(getStoredMerchantId, payload)
      isFunction(callback) && callback(res)
    },
    // 储值规则适用门店
    * getRuleMerchantAction({ payload, callback }, { call }) {
      const res = yield call(getRuleMerchant, payload)
      isFunction(callback) && callback(res)
    },
    // 获取用户支付配置信息
    * getUserPayInfoSettingAction({payload, callback}, {call}){
      const res = yield call(getUserPayInfoSetting, payload);
      isFunction(callback) && callback(res)
    }
  },
  reducers: {
    setStoredCards(state, { payload }) {
      const {
        memberCardListRespDTOs,
        storeNoOpenCardListRespDTOs,
        memberInfoDTO
      } = payload
      return {
        ...state,
        alreadyStoredCards: memberCardListRespDTOs,
        notStoredCards: storeNoOpenCardListRespDTOs,
        userMemberInfo: memberInfoDTO
      }
    },
    setCurStoredCardDetail(state, { payload }) {
      const { curStoredCardIndex, curStoredCard } = payload
      return {
        ...state,
        curStoredCardIndex,
        curStoredCard
      }
    }
  }
}
