import {
  getDistributorProduct, distributorAllLevel, getDistributorInfo,
  getPartnerSetConfig, getShopDishesByIds, getPartnerRankInfo,
  getQrcodeSharePoster, getGoodsConfig, getTeamMemberList,
  getTeamInfo, getDistributorOrder, getDistributorAmount,
  getDistributeMerchant, getDistributorCommodity, getDistributorMerchant
} from '../utils/api'

import {
  isFunction
} from '../utils/utils'

export default {
  namespace: 'distributor',

  state: {
    allLevels: [],
    distributorInfo: {}
  },

  effects: {
    * getDistributorProductAction({ callback, payload }, { call }) {
      const res = yield call(getDistributorProduct, payload)
      isFunction(callback) && callback(res)
    },
    * distributorAllLevelAction({ callback }, { call, put }) {
      const res = yield call(distributorAllLevel)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'setAllLevelResult',
          payload: res.data
        })
      }
    },
    * getDistributorInfoAction({ callback, payload }, { call, put }) {
      const res = yield call(getDistributorInfo, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'setDistributorInfoResult',
          payload: res.data
        })
      }
    },
    // 获取分销商品
    *getDistributorCommodityAction({ callback, payload }, { call, put }) {
      const res = yield call(getDistributorCommodity, payload);
      isFunction(callback) && callback(res)
    },
    // 分销门店
    *getDistributorMerchantAction({ callback, payload }, { call, put }) {
      const res = yield call(getDistributorMerchant, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 获取平台合伙人设置
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getPartnerSetConfigAction({ payload, callback }, { call, put }) {
      const res = yield call(getPartnerSetConfig, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 获取原始菜品数组
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getShopDishesByIdsAction({ payload, callback }, { call, put }) {
      const res = yield call(getShopDishesByIds, payload)
      isFunction(callback) && callback(res)
    },

    /**
     * 获取合伙人等级配置信息
     *
     * @param payload
     * @param callback
     * @param call
     * @param put
     */* getPartnerRankInfoAction({ payload, callback }, { call, put }) {
      const res = yield call(getPartnerRankInfo, payload)
      isFunction(callback) && callback(res)
    },

    // 获取分享海报
    * getQrcodeSharePosterAction({ payload, callback }, { call, put }) {
      const res = yield call(getQrcodeSharePoster, payload)
      isFunction(callback) && callback(res)
    },
    // 获取分享订单
    * getDistributorOrderAction({ payload, callback }, { call, put }) {
      const res = yield call(getDistributorOrder, payload)
      isFunction(callback) && callback(res)
    },
    * getDistributorAmountAction({ payload, callback }, { call, put }) {
      const res = yield call(getDistributorAmount, payload)
      isFunction(callback) && callback(res)
    },

    // 获取商品配置信息(分享海报等)
    * getGoodsConfigAction({ payload, callback }, { call, put }) {
      const res = yield call(getGoodsConfig, payload)
      isFunction(callback) && callback(res)
    },
    * getTeamMemberList({ callback, payload }, { call }) {
      const res = yield call(getTeamMemberList, payload)
      isFunction(callback) && callback(res)
    },
    * getTeamInfo({ callback, payload }, { call }) {
      const res = yield call(getTeamInfo, payload)
      isFunction(callback) && callback(res)
    },
    * getDistributeMerchant({ callback, payload }, { call }) {
      const res = yield call(getDistributeMerchant, payload)
      isFunction(callback) && callback(res)
    }
  },

  reducers: {
    setAllLevelResult(state, { payload }) {
      return {
        ...state,
        allLevels: payload
      }
    },
    setDistributorInfoResult(state, { payload }) {
      return {
        ...state,
        distributorInfo: payload
      }
    }
  }

}
