import Taro, { Component } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtLoadMore, AtActivityIndicator } from 'taro-ui'
import './order.scss'
import { ACTION_CANCEL_ORDER, ACTION_REMINDER_ORDER, ORDER_TABS, SIZE } from '../../config/config'
import OrderList from '../../components/OrderList/OrderList'
import {
  getPlatFormId, hideLoading, isArray, isFunction, objNotNull, showLoading, showToast
} from '../../utils/utils'

let pageScrollTop = {} // 订单列表滚动条位置记录

// @authenticate
@connect(({ loading, order }) => ({
  ajaxLoading: loading,
  orderList: order.orderList
}))
class Order extends Component {
    config = {
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
      navigationBarTitleText: '我的订单',
      backgroundTextStyle: 'dark',
      onReachBottomDistance: 50,
      enablePullDownRefresh: true
    };

    constructor() {
      super()
      const key = this.$router.params.key || ''
      const currentTabs = ORDER_TABS.find(o => (o.key === key))
      const currentTab = currentTabs || ORDER_TABS[0]
      const currentPage = {}
      currentPage[currentTab.key] = 0
      // 初始化每种类型订单的初始化滚动位置
      ORDER_TABS.filter(o => !o.hide).map(o => {
        pageScrollTop[o.key] = 0
      })
      /* let scrollTop = {};
        scrollTop[currentTab["key"]] = 0; */

      this.state = {
        currentTab,
        currentPage,

        loadMore: false,
        oldTime: new Date().getTime()

        // tabStock: [currentTabs["key"] || ORDER_TABS[0]["key"]],//当前tab栈
      }
    }

    componentWillMount() {
    }

    componentDidMount() {
      this.loadOrderList()
    }

    // 监听用户下拉动作,下拉加载第一页
    onPullDownRefresh() {
      // 页码设置为第一页
      const tempPage = {}
      tempPage[this.state.currentTab.key] = 0
      // 滚动条回到初始位置
      const scrollTop = {}
      scrollTop[this.state.currentTab.key] = 0
      pageScrollTop = { ...pageScrollTop, ...scrollTop }
      const statObj = {
        currentPage: { ...this.state.currentPage, ...tempPage }
      }
      this.setState({ ...statObj }, () => {
        this.loadOrderList()
      })
    }

    // 滚动函数
    onPageScroll(e) {
      // 记录滚动条当前位置
      const scrollTop = {}
      scrollTop[this.state.currentTab.key] = e.scrollTop || 0
      pageScrollTop = { ...pageScrollTop, ...scrollTop }
    }

    // 监听上拉触底事件
    onReachBottom() {
      // console.log("触底了....");
      if (this.state.loadMore) {
        showToast('正在加载中...')
        return
      }
      const nowTime = new Date().getTime()
      const loadTime = nowTime - this.state.oldTime
      if (loadTime < 3000 && this.state.currentPage[this.state.currentTab.key] > 0) {
        // showToast("刷新过于频繁");
        return
      }
      this.setState({
        oldTime: nowTime
      }, () => {
        // 页码加+1
        const tempPage = {}
        tempPage[this.state.currentTab.key] = this.state.currentPage[this.state.currentTab.key] + 1
        // state状态修改
        const statObj = {
          currentPage: { ...this.state.currentPage, ...tempPage },
          loadMore: true
        }
        this.setState({ ...statObj }, () => {
          // 更新数据
          this.loadOrderList()
        })
      })
    }

    componentWillUnmount() {
    }

    componentDidShow() {
    }

    componentDidHide() {
    }


    // 加载订单列表
    loadOrderList = () => {
      const {
        currentPage,
        currentTab
      } = this.state
      const platformId = getPlatFormId()
      if (!platformId) {
        showToast('平台未知')
        return
      }
      // console.log(currentPage);
      const sendData = {
        platformId,
        state: currentTab.key,
        page: currentPage[currentTab.key],
        size: SIZE
      }
      this.props.dispatch({
        type: 'order/getOrderListAction',
        payload: sendData,
        callback: ({ ok, data }) => {
          this.setState({ loadMore: false })
          hideLoading()

          // page滚动到之前的位置
          if (ok) {
            const tempTop = pageScrollTop[currentTab.key]
            setTimeout(() => {
              // console.log(tempTop);
              Taro.pageScrollTo({
                scrollTop: tempTop || 0, // pageScrollTop[currentTab.key] || 0,
                duration: 0
              })
            }, 100)
          }

          const temCurrentPage = this.state.currentPage[this.state.currentTab.key]
          if (temCurrentPage === 0) {
            Taro.stopPullDownRefresh()
            return
          }
          if (data.length === 0 && temCurrentPage > 0) { // 最后一页判断
            const tempPage = {}
            tempPage[this.state.currentTab.key] = temCurrentPage - 1
            const statObj = {
              currentPage: { ...this.state.currentPage, ...tempPage }
            }
            this.setState({ ...statObj })
          }
        }
      })
    };


    // 选项卡切换
    onClickTab = item => {
      if (this.state.currentTab.key === item.key) return
      let statObjb = { currentTab: item }
      const tempKeys = Object.keys(this.state.currentPage)
      const hasClick = tempKeys.length > 0 && tempKeys.includes(item.key)
      if (!hasClick) {
        // 如果当前tab没有被点击过,则刷新数据,否则不刷新
        const tempPage = {}
        tempPage[item.key] = 0
        // 当前滚动条位置设置为0
        const scrollTop = {}
        scrollTop[item.key] = 0
        pageScrollTop = { ...pageScrollTop, ...scrollTop }
        statObjb = {
          ...statObjb,
          currentPage: { ...this.state.currentPage, ...tempPage }
        }
      }
      this.setState(statObjb, () => {
        // 每次点击tab时都会发送请求

        this.loadOrderList()
        // 滚动到之前记录的位置
        setTimeout(() => {
          // console.log(pageScrollTop[item.key]);
          Taro.pageScrollTo({
            scrollTop: pageScrollTop[item.key] || 0,
            duration: 0
          })
        }, 100)
      })
    };

    // store中更新订单列表(前端更新),订单详情页面也会调用
    publicModifyOrder = data => {
      const { currentTab } = this.state || {}
      if (!objNotNull(currentTab)) {
        showToast('当前状态未知,数据更新失败,请刷新重试')
        return
      }
      this.props.dispatch({
        type: 'order/modifyCurrentListAction',
        payload: { key: currentTab.key, newOrder: data },
        callback: ({ ok }) => {
          // 当前滚动条位置设置为0
          pageScrollTop[currentTab.key] = pageScrollTop[currentTab.key] // {...pageScrollTop, ...scrollTop};
          if (!ok) {
            showToast('列表更新失败')
          }
        }
      })
    };

    // 取消订单
    cancelOrder = (item, e) => {
      // e.stopPropagation();
      Taro.showModal({
        content: '是否取消订单?',
        cancelText: '关闭',
        confirmText: '确认',
        confirmColor: '#FBAB48'
      }).then(res => {
        // console.log(item.callback);
        const sendData = item.callback ? item.sendData : item
        // return;
        if (res.confirm) {
          this._commonDispatch(sendData, ACTION_CANCEL_ORDER, ({ ok, data }) => {
            if (ok) {
              showToast('取消中,等待商家确认')
              isFunction(item.callback) && item.callback({ ok, data })
            } else {
              showToast('取消失败')
            }
          })
        }
      })
    };

    // 商家未接单取消订单
    autoCancelOrder = item => {
      const sendData = item.callback ? item.sendData : item
      this._commonDispatch(sendData, ACTION_CANCEL_ORDER, ({ ok, data }) => {
        if (ok) {
          showToast('取消中,等待商家确认退款')
          isFunction(item.callback) && item.callback({ ok, data })
        } else {
          showToast('取消失败')
        }
      })
    };

    // 催单
    reminderOrder = (item, e) => {
      // e.stopPropagation();
      if (!item.id) {
        showToast('订单id未知')
        return
      }
      showLoading('正在为您催单，请耐心等候', true)
      this._commonDispatch({ id: item.id }, ACTION_REMINDER_ORDER, ({ ok, data }) => {
        hideLoading()
        if (ok) {
          showToast('催单成功')
        } else {
          showToast('催单失败')
        }
      })
    };

    // 公用发送dispatch方法
    _commonDispatch = (payload, type, callback) => {
      this.props.dispatch({
        type,
        payload: { currentTabKey: this.state.currentTab.key, param: payload },
        callback: res => {
          isFunction(callback) && callback(res)
        }
      })
    };

    render() {
      const {
        currentTab,
        loadMore
      } = this.state
      const {
        orderList = {},
        ajaxLoading = {}
      } = this.props
      return (
        <View className="flex-col order-wrap">
          <View className="flex-row flex-ac flex-sa  order-tab">
            {
                ORDER_TABS.filter(o => !o.hide).map((o, i) => (
                  <View
                    key={i}
                    className={`tab-item ${currentTab.key === o.key ? 'active' : ''}`}
                    onClick={this.onClickTab.bind(this, o)}
                  >
                    {o.name}
                  </View>
                ))
            }
          </View>
          <View className="flex1">
            <OrderList
              currentTab={currentTab}
              currentList={isArray(orderList[currentTab.key]) ? orderList[currentTab.key].slice(0) : []}
              cancelAjaxLoading={objNotNull(ajaxLoading) && ajaxLoading.effects[ACTION_CANCEL_ORDER]}
              onModifyOrder={this.publicModifyOrder.bind(this)}
              onCancelOrder={this.cancelOrder.bind(this)}
              onReminderOrder={this.reminderOrder.bind(this)}
            />
          </View>
          {
            <AtLoadMore status={loadMore ? 'loading' : 'noMore'} />
          }
        </View>
      )
    }
}

export default Order
