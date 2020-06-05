import {
  bindWeAppAccount,
  existsPartner,
  getDefaultUserAddress,
  getPlatFormDetail,
  getPlatformDishReward,
  getPlatformMerchantDishReward,
  getPlatformShareReward,
  getPlatFormSystemSettingById,
  getUserAccount,
  getUserCanUseBonus,
  isPartner,
  sendUserMobileCode,
  weAppLoginByCode,
  weAppLoginByMobileCode,
  getPlatFormById,
  getBonusPoolConfig,
  shieldCard,
  platformSystem,
  getPlatformByDistribution, getMultiPayInfo,
  getPlatformColor,


  //另一平台专用接口
  getOpenID,
  getToken,
  getPersonNum,
  getConsumerInfo,
  getOtherPlatformGoods,
  otherplatFormJoinCart,
  otherplatFormCartContent,
  otherClearCartContent,
  otherSubmitCart,
  preSubOrderB,
  otherPay_wechat, 
  otherPay_member,
  getOtherOrders,
  otherOrderCheck,
  otherOrderSet,
  otherMemberMes,
  getVolumeList,
  useVolume,
  confirmUseVolume,
  otherOrderbyGuid,
  getMemberCardList,
  switchCard,
  otherLogin,
  getConsumerInfoPost,
  popWindow
} from '../utils/api'
import { isFunction } from '../utils/utils'
import { STATIC_IMG_URL } from '../config/baseUrl'

export default {
  namespace: 'common',
  state: {
    currentUserAccount: {}, // 当前用户登录用户的账户信息
    userInfo: null,
    userAccount: null,
    platForm: null,
    platFormSettings: [], // 平台设置信息
    userCurrentAddress: {}, // 用户选择的地址
    redPackage: [], // 用户红包列表
    userLocation: {}, // 用户地址
    userDynamic: [ // 用户动态
      {
        headPic: `${STATIC_IMG_URL}/wechatAvatar/avatar (1).png`, userName: '行**', amount: '200', sysWebSocketResponseType: 'BUY_GOODS'
      },
      {
        headPic: `${STATIC_IMG_URL}/wechatAvatar/avatar (2).png`, userName: '一**', amount: '15.6', sysWebSocketResponseType: 'DISTRIBUTOR'
      },
      {
        headPic: `${STATIC_IMG_URL}/wechatAvatar/avatar (4).png`, userName: '李**', amount: '500', sysWebSocketResponseType: 'PROMOTION'
      },
      {
        headPic: `${STATIC_IMG_URL}/wechatAvatar/avatar (5).png`, userName: '一**', amount: '15.6', sysWebSocketResponseType: 'DISTRIBUTOR'
      },
      {
        headPic: `${STATIC_IMG_URL}/wechatAvatar/avatar (6).png`, userName: '小**', amount: '9.25', sysWebSocketResponseType: 'BUY_GOODS'
      },
      {
        headPic: `${STATIC_IMG_URL}/wechatAvatar/avatar (8).png`, userName: '行**', amount: '9.2', sysWebSocketResponseType: 'PROMOTION'
      },
      {
        headPic: `${STATIC_IMG_URL}/wechatAvatar/avatar (10).png`, userName: '王**', amount: '350', sysWebSocketResponseType: 'USER_WITHDRAW'
      },
      {
        headPic: `${STATIC_IMG_URL}/wechatAvatar/avatar (11).png`, userName: '毕**', amount: '11.2', sysWebSocketResponseType: 'DISTRIBUTOR'
      },
      {
        headPic: `${STATIC_IMG_URL}/wechatAvatar/avatar (12).png`, userName: 'M**', amount: '7.25', sysWebSocketResponseType: 'BUY_GOODS'
      },
      {
        headPic: `${STATIC_IMG_URL}/wechatAvatar/avatar (5).png`, userName: '一**', amount: '15.6', sysWebSocketResponseType: 'USER_WITHDRAW'
      }
    ]
  },

  effects: {
    // 获取平台色调
    * getPlatformColorAction({ payload, callback }, { call, put }) {
      const res = yield call(getPlatformColor, payload)
      isFunction(callback) && callback(res)
    },

    // 获取奖金池基础配置
    * getBonusPoolConfig({ callback }, { call }) {
      const res = yield call(getBonusPoolConfig)
      isFunction(callback) && callback(res)
    },
    // 存储微信授权
    * changeUserInfoAction({ payload }, { put }) {
      yield put({
        type: 'changeUserInfoResult',
        payload
      })
    },


    // 微信小程序登录
    * weAppLoginAction({ payload, callback }, { call, put }) {
      const res = yield call(weAppLoginByCode, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'weAppLoginResult',
          payload: res.data
        })
      }
    },

    // 获取当前用户账户信息
    * getCurrentUserAction({ payload, callback }, { call, put }) {
      const res = yield call(getUserAccount, payload)
      isFunction(callback) && callback(res)
      // if (res.ok) {
      //   yield put({
      //     type: 'getCurrentUserResult',
      //     payload: res.data
      //   })
      // }
    },
    * getUserDynamicAction({ payload, callback }, { call, put }) {
      yield put({
        type: 'getUserDynamicResult',
        payload
      })
    },
    * weAppLoginByMobileCodeAction({ payload, callback }, { call, put }) {
      const res = yield call(weAppLoginByMobileCode, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'weAppLoginResult',
          payload: res.data
        })
      }
    },

    /**
     * 绑定微信小程序账号
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */
    * bindWeAppAccountAction({ payload, callback }, { call, put }) {
      const res = yield call(bindWeAppAccount, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'weAppLoginResult',
          payload: res.data
        })
      }
    },

    /**
     * 发送短信验证码
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* 
     sendUserMobileCodeAction({ payload, callback }, { call, put }) {
      const res = yield call(sendUserMobileCode, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 获取平台详情
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */
    * getPlatFormDetailAction({ payload, callback }, { call, put }) {
      const res = yield call(getPlatFormDetail, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'getPlatFormDetailResult',
          payload: res.data
        })
      }
    },

    // 获取平台系统设置信息
    * getPlatFormSystemSettingByIdAction({ payload, callback }, { call, put }) {
      const res = yield call(platformSystem, payload)
      isFunction(callback) && callback(res)
      // if (res.ok) {
      //   yield put({
      //     type: 'getPlatFormSystemSettingByIdResult',
      //     payload: res.data
      //   })
      // }
    },

    /**
     * 获取平台基础信息
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */
    * getPlatFormByIdAction({ payload, callback }, { call, put }) {
      const res = yield call(getPlatFormById, payload)
      isFunction(callback) && callback(res)
    },

    // 设置用户当前选中的配送地址
    * setUserCurrentAddressAction({ payload }, { call, put }) {
      yield put({
        type: 'setUserCurrentAddressActionResult',
        payload
      })
    },
    // 获取用户默认地址
    * getUserDefaultAddressAction({ payload, callback }, { call, put }) {
      const res = yield call(getDefaultUserAddress, payload)
      isFunction(callback) && callback(res)
    },

    // 获取红包列表
    * getRedPackageAction({ payload, callback }, { call, put }) {
      const res = yield call(getUserCanUseBonus, payload)
      if (res.ok) {
        yield put({
          type: 'getRedPackageResult',
          payload: res.data
        })
      }
      isFunction(callback) && callback(res)
    },

    /**
     * 检测是否是平台合伙人
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getPartnerAction({ payload, callback }, { call, put }) {
      const res = yield call(existsPartner, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 获取平台合伙人分成信息
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getPlatformShareRewardAction({ payload, callback }, { call, put }) {
      const res = yield call(getPlatformShareReward, payload)
      isFunction(callback) && callback(res)
    },


    // 获取平台菜品合伙人分成信息
    * getPlatformDishRewardAction({ payload, callback }, { call, put }) {
      const res = yield call(getPlatformDishReward, payload)
      isFunction(callback) && callback(res)
    },

    // 判断用户是否是合伙人
    * isPartnerAction({ payload, callback }, { call, put }) {
      const res = yield call(isPartner, payload)
      isFunction(callback) && callback(res)
    },

    // 获取平台菜品合伙人分成信息
    * getPlatformMerchantDishRewardAction({ payload, callback }, { call, put }) {
      const res = yield call(getPlatformMerchantDishReward, payload)
      isFunction(callback) && callback(res)
    },

    * shieldCardAction({ callback }, { call }) {
      const res = yield call(shieldCard)
      isFunction(callback) && callback(res)
    },

    * getPlatformByDistributionAction({ callback }, { call }) {
      const res = yield call(getPlatformByDistribution)
      isFunction(callback) && callback(res)
    },

    // 获取聚合预支付信息
    * getMultiPayInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(getMultiPayInfo, payload)
      isFunction(callback) && callback(res)
      // if (res.ok) {
      //   yield put({
      //     type: 'getPlatFormSystemSettingByIdResult',
      //     payload: res.data
      //   })
      // }
    },

    /** 
     * openID
     * @param payload
     * @param callback
     * @param call
    */  
    * getOpenIDAction({ callback ,payload}, { call}) {
        const res = yield call(getOpenID, payload);
        isFunction(callback) && callback(res);

    },
    /** 
     * other plantform TOKEN
     * @param payload
     * @param callback
     * @param call
     */  
    * getOtherPlantFormTOKENAction({callback,payload},{call}){
        const res = yield call(getToken,payload);
        isFunction(callback) && callback(res);
    },
     


  },
  




  reducers: {
    /**
     * 传递微信授权信息
     *
     * @param payload
     * @param put
     */
    changeUserInfoResult(state, { payload }) {
      return {
        ...state,
        userInfo: payload
      }
    },

    /**
     * 传递微信小程序登陆后状态
     *
     * @param state
     * @param payload
     * @returns {{userAccount: *}}
     */
    weAppLoginResult(state, { payload }) {
      return {
        ...state,
        userAccount: payload
      }
    },

    /**
     * 传递平台详情状态
     *
     * @param state
     * @param payload
     * @returns {{userAccount: *}}
     */
    getPlatFormDetailResult(state, { payload }) {
      return {
        ...state,
        platForm: payload
      }
    },

    // 平台信息获取结果缓存
    getPlatFormSystemSettingByIdResult(state, { payload }) {
      return {
        ...state,
        platFormSettings: payload
      }
    },
    setUserCurrentAddressActionResult(state, { payload }) {
      return {
        ...state,
        userCurrentAddress: payload
      }
    },
    getRedPackageResult(state, { payload }) {
      return {
        ...state,
        redPackage: payload
      }
    },
    getCurrentUserResult(state, { payload }) {
      return {
        ...state,
        currentUserAccount: payload
      }
    },
    getUserLocationResult(state, { payload }) {
      return {
        ...state,
        userLocation: payload
      }
    },
    getUserDynamicResult(state, { payload }) {
      const { userDynamic } = state
      return {
        ...state,
        userDynamic: [...userDynamic, payload] <= 10 || [...userDynamic, payload].slice(-10)
      }
    },
  }
}
