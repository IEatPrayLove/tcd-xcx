import { getTreasuryInfo,getWithdrawRequire,judgeIsWithdraw,createWidthdraw,getWidthdrawRecordList,
  getWithdrawDetail,getBalanceRecordList,getRetailExpertList,getRetailExpertDetail,getAllChannel,
  getTreasureProfits,getTalentInfo,getBalanceAmount, getCashOutWay } from '../../utils/api'
import { isFunction } from '../../utils/utils'

  export default {
    namespace: 'treasury',

    state: {},

    effects: {

        //获取用户信息（当前总余额/分享累计拥金/达人累计赏金/累计收益）
        * getTreasuryInfo({ payload, callback }, { call, put }) {
            const res = yield call(getTreasuryInfo, payload)
            isFunction(callback) && callback(res)
        },
        //获取体现的条件
        * getWithdrawRequire({ payload, callback }, { call, put }) {
            const res = yield call(getWithdrawRequire, payload)
            isFunction(callback) && callback(res)
        },
        //判断是否可以体现
        * judgeIsWithdraw({ payload, callback }, { call, put }) {
            const res = yield call(judgeIsWithdraw, payload)
            isFunction(callback) && callback(res)
        },
        //创建提现记录
        * createWidthdraw({ payload, callback }, { call, put }) {
            const res = yield call(createWidthdraw, payload)
            isFunction(callback) && callback(res)
        },
        //获取提现记录
        * getWidthdrawRecordList({ payload, callback }, { call, put }) {
          const res = yield call(getWidthdrawRecordList, payload)
          isFunction(callback) && callback(res)
        },
        //获取提现审核记录的明细
        * getWithdrawDetail({ payload, callback }, { call, put }) {
          const res = yield call(getWithdrawDetail, payload)
          isFunction(callback) && callback(res)
        },
        //获取金库余额记录
        * getBalanceRecordList({ payload, callback }, { call, put }) {
          const res = yield call(getBalanceRecordList, payload)
          isFunction(callback) && callback(res)
        },
        //获取分享或者达人赏金记录
        * getRetailExpertList({ payload, callback }, { call, put }) {
          const res = yield call(getRetailExpertList, payload)
          isFunction(callback) && callback(res)
        },
        //获取分享或者达人赏金的详情
        * getRetailExpertDetail({ payload, callback }, { call, put }) {
          const res = yield call(getRetailExpertDetail, payload)
          isFunction(callback) && callback(res)
        },
        //获取宣发渠道
        * getAllChannel({ payload, callback }, { call, put }) {
          const res = yield call(getAllChannel, payload)
          isFunction(callback) && callback(res)
        },
        //获取昨日分享收益，宣发总收益，分享总收益，昨日分享总收益
        * getTreasureProfits({ payload, callback }, { call, put }) {
          const res = yield call(getTreasureProfits, payload)
          isFunction(callback) && callback(res)
        },
        //获取达人信息
        * getTalentInfo({ payload, callback }, { call, put }) {
          const res = yield call(getTalentInfo, payload)
          isFunction(callback) && callback(res)
        },
        //获取余额记录累计收入支出
        * getBalanceAmount({ payload, callback }, { call, put }) {
          const res = yield call(getBalanceAmount, payload)
          isFunction(callback) && callback(res)
        },
        // 体现支付方式
        * getCashOutWayAction({ payload, callback }, { call, put }) {
          const res = yield call(getCashOutWay, payload)
          isFunction(callback) && callback(res)
        }
    },

    reducers: {}

  }
