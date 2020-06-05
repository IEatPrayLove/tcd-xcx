import {
  judgeIslandUser, modifyIslandUser, getTalentInfo, addTalentCertification,
  updateTalentCertification, examineCertification, dertificationRecord, getPropagandaDetail,
  getTaskDetail, getUserMemberConfig, getUpgradeRaiders, getAllMember, getUserMemberInfo,
  memberGradePeopleNum, existsPartner, getLunchAndCoupon, getUserOrderQuantity, judgeOfficialAccounts, getPublicQR
} from '../../utils/api'
import { isFunction } from '../../utils/utils'

export default {
  namespace: 'mine',

  state: {
    talentPlatform: {}
  },

  effects: {
    // 判断是否是平台用户
    * judgeIslandUserAction({ payload, callback }, { call, put }) {
      const res = yield call(judgeIslandUser, payload)
      isFunction(callback) && callback(res)
    },
    // 修改用户信息
    * modifyIslandUserAction({ payload, callback }, { call, put }) {
      const res = yield call(modifyIslandUser, payload)
      isFunction(callback) && callback(res)
    },
    // 查看当前用户达人已认证和未认证平台
    * getTalentInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(getTalentInfo)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'saveTalentPlatform',
          payload: res.data
        })
      }
    },
    * addTalentCertificationAction({ payload, callback }, { call, put }) {
      const res = yield call(addTalentCertification, payload)
      isFunction(callback) && callback(res)
    },
    // 重新达人认证
    * updateTalentCertificationAction({ payload, callback }, { call, put }) {
      const res = yield call(updateTalentCertification, payload)
      isFunction(callback) && callback(res)
    },
    // 查看当前达人平台是否认证
    * examineCertificationAction({ payload, callback }, { call, put }) {
      const res = yield call(examineCertification, payload)
      isFunction(callback) && callback(res)
    },
    // 认证记录
    * dertificationRecordAction({ payload, callback }, { call, put }) {
      const res = yield call(dertificationRecord, payload)
      isFunction(callback) && callback(res)
    },
    // 悬赏详情
    * getPropagandaDetailAction({ payload, callback }, { call, put }) {
      const res = yield call(getPropagandaDetail, payload)
      isFunction(callback) && callback(res)
    },
    // 任务详情
    * getTaskDetailAction({ payload, callback }, { call, put }) {
      const res = yield call(getTaskDetail, payload)
      isFunction(callback) && callback(res)
    },
    // 获取平台会员权益配置
    * getUserMemberConfigAction({ payload, callback }, { call, put }) {
      const res = yield call(getUserMemberConfig, payload)
      isFunction(callback) && callback(res)
    },
    // 获取升级攻略
    * getUpgradeRaidersAction({ payload, callback }, { call, put }) {
      const res = yield call(getUpgradeRaiders, payload)
      isFunction(callback) && callback(res)
    },
    // 获取所有等级
    * getAllMemberAction({ callback }, { call }) {
      const res = yield call(getAllMember)
      isFunction(callback) && callback(res)
    },
    // 获取用户会员信息
    * getUserMemberInfoAction({ callback }, { call }) {
      const res = yield call(getUserMemberInfo)
      isFunction(callback) && callback(res)
    },
    // 获取不同平台会员等级下有多少人
    * getMemberGradePeopleNumAction({ callback }, { call }) {
      const res = yield call(memberGradePeopleNum)
      isFunction(callback) && callback(res)
    },
    // 获取合伙人信息
    * getDistributorByPlatformAction({ callback }, { call, put }) {
      const res = yield call(existsPartner)
      isFunction(callback) && callback(res)
    },
    // 霸王餐和淘券商品订单:
    * getLunchAndCouponAction({ payload, callback }, { call, put }) {
      const res = yield call(getLunchAndCoupon, payload)
      isFunction(callback) && callback(res)
    },
    // 获取用户消费订单、权益卡券、宣传任务数量
    * getUserOrderQuantityAction({ payload, callback }, { call, put }) {
      const res = yield call(getUserOrderQuantity, payload)
      isFunction(callback) && callback(res)
    },
    // 判断用户是否关注公众号
    * judgeOfficialAccountsAction({ payload, callback }, { call, put }) {
      const res = yield call(judgeOfficialAccounts, payload)
      isFunction(callback) && callback(res)
    },
    // 获取公众号二维码
    * getPublicQRAction({ payload, callback }, { call, put }) {
      const res = yield call(getPublicQR, payload)
      isFunction(callback) && callback(res)
    }
  },

  reducers: {
    saveTalentPlatform(state, { payload }) {
      return {
        ...state,
        talentPlatform: payload
      }
    }
  }

}
