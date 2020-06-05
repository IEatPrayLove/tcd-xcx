import {
  sendUserMobileCode,
  getPhoneReg,
  fakeAccountLogin,
  registerUser,
  decideSkip,
  stationedRecordInfo,
  getBusiness,
  getPlatform,
  getTcdPlatform,
  submitBrandInfo
} from '../../utils/api'
import { isFunction } from '../../utils/utils'

export default {
  namespace: 'businessmenStationed',

  state: {

  },

  effects: {
    // 短信验证码发送
    * sendUserMobileCodeAction({ payload, callback }, { call, put }) {
      const res = yield call(sendUserMobileCode, payload)
      isFunction(callback) && callback(res)
    },
    // 验证手机号是否被注册
    * getPhoneRegAction({ payload, callback }, { call, put }) {
      const res = yield call(getPhoneReg, payload)
      isFunction(callback) && callback(res)
    },
    // 登录获取token
    * fakeAccountLoginAction({ payload, callback }, { call, put }) {
      const res = yield call(fakeAccountLogin, payload)
      isFunction(callback) && callback(res)
    },
    // 注册
    * registerUserAction({ payload, callback }, { call, put }) {
      const res = yield call(registerUser, payload)
      isFunction(callback) && callback(res)
    },
    // 登录成功后判断跳转判断
    * decideSkipAction({ payload, callback }, { call, put }) {
      const res = yield call(decideSkip, payload)
      isFunction(callback) && callback(res)
    },
    // 入驻记录信息获取
    * stationedRecordInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(stationedRecordInfo, payload)
      isFunction(callback) && callback(res)
    },
    // 行业列表
    * getBusinessAction({ payload, callback }, { call, put }) {
      const res = yield call(getBusiness, payload)
      isFunction(callback) && callback(res)
    },
    // 获取平台id
    * getPlatformAction({ payload, callback }, { call, put }) {
      const res = yield call(getPlatform, payload)
      isFunction(callback) && callback(res)
    },
    // 获取平台平台id
    * getTcdPlatformAction({ payload, callback }, { call, put }) {
      const res = yield call(getTcdPlatform, payload)
      isFunction(callback) && callback(res)
    },
    // 提交商业入驻信息
    * submitBrandInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(submitBrandInfo, payload)
      isFunction(callback) && callback(res)
    }
  },

  reducers: {

  }
}
