import {
  cancelOrder,
  confirmReceive,
  getMeiShipping,
  getOrderDetail,
  getOrderList,
  getOrderLogistics,
  getOrderStateLog,
  getRiderLocation,
  orderAccount,
  reminderOrder
} from '../utils/api'
import { isArray, isFunction, objNotNull, showToast } from '../utils/utils'
import { KEY_ALL, KEY_DELIVERY, KEY_ORDER_FINISH } from '../config/config'

//订单models
export default {
  namespace: 'order',
  state: {
    orderAccount: {},//订单统计
    orderList: {},//订单列表,
    orderDetail: {}//订单详情信息
  },

  effects: {
    //订单统计
    * orderAccountAction({ payload, callback }, { call, put }) {
      const res = yield call(orderAccount, payload)
      isFunction(callback) && callback(res)
      yield put({
        type: 'orderAccountResult',
        payload: res.data
      })
    },

    //根据状态获得订单列表
    * getOrderListAction({ payload, callback }, { call, put }) {
      const res = yield call(getOrderList, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'getOrderListResult',
          payload: res.data,
          page: payload.page,
          orderState: payload.state
        })
      }
    },
    //获取订单详情信息
    * getOrderDetailAction({ payload, callback }, { call, put }) {
      const res = yield call(getOrderDetail, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'getOrderDetailResult',
          payload: res.data
        })
      }
    },

    //确认收货
    * confirmReceiveAction({ payload, callback }, { call, put }) {
      const res = yield call(confirmReceive, payload)
      isFunction(callback) && callback(res)
      if (res.ok) {
        yield put({
          type: 'getOrderDetailResult',
          payload: res.data
        })
      }
    },

    //查看订单物流
    * getOrderLogisticsAction({ payload, callback }, { call, put }) {
      const res = yield call(getOrderLogistics, payload)
      isFunction(callback) && callback(res)
    },

    //取消订单
    * cancelOrderAction({ payload, callback }, { call, put }) {
      const res = yield call(cancelOrder, payload.param)
      isFunction(callback) && callback(res)
      if (res.ok && payload.currentTabKey !== undefined) { //传递当前订单列表选项卡key的时候需要更新,否则不更新
        yield put({
          type: 'cancelRefreshOrder',
          payload: { ...res.data }, // merchant: payload.param.merchant
          currentTabKey: payload.currentTabKey
        })
      }
    },

    //催单
    * reminderOrderAction({ payload, callback }, { call, put, select }) {
      const res = yield call(reminderOrder, payload.param)
      isFunction(callback) && callback(res)
    },

    //更新当前订单列表
    * modifyCurrentListAction({ payload, callback }, { call, put }) {
      yield put({
        type: 'modifyCurrentListResult',
        payload: payload.newOrder,
        key: payload.key,
        callback: callback
      })
    },

    //获取美团外卖配送员信息
    * getMeiShippingAction({ payload, callback }, { call, put }) {
      const res = yield call(getMeiShipping, payload)
      isFunction(callback) && callback(res)
    },

    // 获取美团配送员位置坐标
    * getRiderLocationAction({ payload, callback }, { call, put }) {
      const res = yield call(getRiderLocation, payload)
      isFunction(callback) && callback(res)
    },

    //获取订单状态节点
    * getOrderStateLogAction({ payload, callback }, { call, put }) {
      const res = yield call(getOrderStateLog, payload)
      isFunction(callback) && callback(res)
    },

    //清空订单详情数据
    * clearOrderDetailAction(_, { call, put }) {
      yield put({
        type: 'clearOrderDetailResult'
      })
    }

  },

  reducers: {
    orderAccountResult(state, { payload }) {
      return {
        ...state,
        orderAccount: payload
      }
    },
    getOrderListResult(state, { payload, page, orderState }) {
      if (!payload || payload.length === 0) {
        // showToast('没有更多数据了')
        //return state;
      }
      const listObj = {}
      listObj[orderState] = page > 0 ? [...state.orderList[orderState], ...payload] : [...payload]
      return {
        ...state,
        orderList: { ...state.orderList, ...listObj }
      }
    },
    getOrderDetailResult(state, { payload }) {
      return {
        ...state,
        orderDetail: payload
      }
    },
    //前端修改订单状态
    modifyCurrentListResult(state, { payload, key, callback }) {
      //console.log(state.orderList);
      //console.log(key);
      const oldList = state.orderList[key] || []
      const newOrder = payload || {}
      if (oldList.length > 0 && newOrder.id) {
        let newOrderList = {}
        if (key === KEY_ALL) {//如果是在全部页面操作
          //全部直接修改即可
          newOrderList[key] = oldList.map((o, i) => {
            return o.id === newOrder.id ? { ...newOrder } : { ...o }
          })
          //配送到家页面,存在这条数据则需要从里面删除
          const olderDeliveryList = state.orderList[KEY_DELIVERY] || []
          if (olderDeliveryList.length > 0 && objNotNull(olderDeliveryList.find(o => o.id === newOrder.id))) {
            newOrderList[KEY_DELIVERY] = olderDeliveryList.filter(o => o.id !== newOrder.id)
          }
        } else { //不在全部页面操作
          //原来的页面要删除操作的那条数据
          newOrderList[key] = oldList.filter(o => o.id !== newOrder.id)
          //全部里面的数据如果存在则直接修改,不存在则添加
          const olderAllList = state.orderList[KEY_ALL] || []
          if (olderAllList.length > 0) {
            if (objNotNull(olderAllList.find(o => o.id === newOrder.id))) { // 存在则直接修改
              newOrderList[KEY_ALL] = olderAllList.map(o => (o.id === newOrder.id ? { ...newOrder } : { ...o }))
            } else { //不存在添加到第一条
              newOrderList[KEY_ALL] = [newOrder, ...olderAllList]
            }
          } else { //全部里面还没有数据的时候,添加到第一条
            newOrderList[KEY_ALL] = [payload]
          }
        }
        //不管在那个页面操作,已完成里面都要添加一条新的
        newOrderList[KEY_ORDER_FINISH] = state.orderList[KEY_ORDER_FINISH] && state.orderList[KEY_ORDER_FINISH].length > 0 ? [newOrder, ...state.orderList[KEY_ORDER_FINISH]] : [newOrder]//已完成里面也要加上
        //console.log(newOrderList);
        isFunction(callback) && callback({ ok: true })
        return {
          ...state,
          orderList: { ...state.orderList, ...newOrderList }
        }
      }
      isFunction(callback) && callback({ ok: false })
    },

    //取消订单刷新列表
    cancelRefreshOrder(state, { payload, currentTabKey }) {
      let stateObj = state.orderList[currentTabKey],
        newList = {}

      newList[currentTabKey] = stateObj.map(o => {
        if (o.id === payload.id) {
          return { ...payload }
        }
        return { ...o }
      })
      if (currentTabKey === KEY_ALL) { //如果是在全部选项卡里面,且配送到家选项卡里面有数据,更新
        const tempArr = state.orderList[KEY_DELIVERY]
        if (isArray(tempArr) && tempArr.length > 0 && tempArr.find(o => o.id === payload.id)) {
          newList[KEY_DELIVERY] = tempArr.map(o => {
            if (o.id === payload.id) {
              return { ...payload }
            }
            return { ...o }
          })
        }
      }
      if (currentTabKey === KEY_DELIVERY) {
        const tempArr = state.orderList[KEY_ALL]
        if (isArray(tempArr) && tempArr.length > 0 && tempArr.find(o => o.id === payload.id)) {
          newList[KEY_ALL] = tempArr.map(o => {
            if (o.id === payload.id) {
              return { ...payload }
            }
            return { ...o }
          })
        }
      }
      return {
        ...state,
        orderList: { ...state.orderList, ...newList }
      }
    }

  },

  clearOrderDetailResult(state, _) {
    return {
      ...state,
      orderDetail: {}
    }
  }

}
