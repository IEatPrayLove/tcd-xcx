import {
  getDishDetail,
  getDishWxParse,
  getMerchantInfo,
  getWeChatArticleContent,
  getDineAndDashDetail,
  getPlatformByDistribution,
  getSharePersonByDish
} from '../../utils/api'
import { isFunction } from '../../utils/utils'

export default {
  namespace: 'goodsDetail',
  state: {
    merchantInfo: {}, // 门店信息
    wxParseInfo: {}, // 富文本信息
    goodsDetail: {}// 商品详情信息
  },

  effects: {
    // 获取商品门店信息
    * getMerchantInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(getMerchantInfo, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'getMerchantInfoResult',
          payload: res.data
        })
      }
    },
    // 获取商品富文本详情信息
    * getDishWxParseAction({ payload, callback }, { call, put }) {
      const res = yield call(getDishWxParse, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'getDishWxParseResult',
          payload: res.data
        })
      }
    },
    // 获取商品详情信息
    * getDishDetailAction({ payload, callback }, { call, put }) {
      const res = yield call(getDishDetail, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'getDishDetailResult',
          payload: res.data
        })
      }
    },

    * clearPropsAction(_, { put }) {
      yield put({
        type: 'clearPropsResult'
      })
    },

    /**
     * 获取微信富文本详情
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getWeChatArticleContentAction({ payload, callback }, { call, put }) {
      const res = yield call(getWeChatArticleContent, payload)
      isFunction(callback) && callback(res)
    },
    // 获取霸王餐详情接口
    * getDineAndDashDetailAction({ payload, callback }, { call }) {
      const res = yield call(getDineAndDashDetail, payload)
      isFunction(callback) && callback(res)
    },
    // 获取菜品分享人数
    * getSharePersonByDishAction({ callback, payload }, { call }) {
      const res = yield call(getSharePersonByDish, payload)
      isFunction(callback) && callback(res)
    }
  },

  reducers: {
    getMerchantInfoResult(state, { payload }) {
      return {
        ...state,
        merchantInfo: payload
      }
    },

    getDishWxParseResult(state, { payload }) {
      return {
        ...state,
        wxParseInfo: payload
      }
    },
    getDishDetailResult(state, { payload }) {
      return {
        ...state,
        goodsDetail: payload
      }
    },
    clearPropsResult(state, _) {
      return {
        ...state,
        merchantInfo: {}, // 门店信息
        wxParseInfo: {}, // 富文本信息
        goodsDetail: {}// 商品详情信息
      }
    }
  }

}
