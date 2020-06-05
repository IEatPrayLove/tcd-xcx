import Taro, { Component } from '@tarojs/taro'
import {
  Button, Image, Text, View, Block
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import './OrderList.scss'
import {
  callPhone,
  dateFormat,
  encodeURIObj,
  formatCurrency,
  getServerPic,
  hideLoading,
  isFunction,
  navToPage,
  objNotNull,
  showLoading,
  showToast
} from '../../utils/utils'
import { STATIC_IMG_URL } from '../../config/baseUrl'
import {
  ACTION_CANCEL_ORDER,
  ACTION_REMINDER_ORDER, ORDER_TYPE,
  ORDER_TYPE_DELIVERY,
  ORDER_TYPE_NETWORK,
  SCROLL_LOCATION,
  ORDER_TYPE_SCAN, ORDER_TYPE_STORE,
  ORDER_TYPE_OFFER,
  ORDER_TYPE_SCAN_LATER
} from '../../config/config'
import NoData from '../NoData/NoData'
import order from '../../model/order'

const pullTime = new Date().getTime()
const PICK_UP = 'PICK_UP'

/**
 * 订单列表组件
 */
@connect(({ loading }) => ({
  ajaxLoading: loading
  // orderList: order.orderList
}))
class OrderList extends Component {
  static options = {
    addGlobalClass: true
  }

  constructor(props) {
    super(props)
    this.state = {
      currentItem: {}
      /* currentTab: this.props.currentTab || ORDER_TABS[0],
           currentPage: 0,
           size: 12 */
      // callThis: this.props.callThis || {}
      // oldTime: new Date().getTime()
      // currentList: props.currentList || []
    }
  }

  componentDidShow() {
    // console.log("orderList show....");
  }

  componentWillMount() {
    // console.log("will...");
  }

  componentDidMount() {
  }

  // 跳转到详情
  navigateToDetail = item => {
    const { orderType, orderSn } = item
    console.log(orderType)
    if (!orderSn) {
      showToast('订单编码未知')
      return
    }
    if (orderType === 'NETWORK' || orderType === 'OFFER_TO_PAY' || orderType === 'PICK_UP') {
      navToPage(`/package/multiStore/orderDetail/orderDetail?orderSn=${orderSn}`)
      return
    }
    if (orderType === 'SCAN_CODE' || orderType === 'SCAN_CODE_PAY_LATER') {
      navToPage(`/package/multiStore/scanningOrder/scanningOrder?orderSn=${orderSn}`)
      return
    }
    navToPage(`/pages/orderDetail/orderDetail?orderSn=${orderSn}&id=${item.id}&formPage=orderList`)
  }


  // 订单状态判断
  getOrderState = item => {
    let obj = {
      color: 'deep',
      name: '未知状态'
    }
    if (item.expired) {
      return {
        color: 'gray',
        name: '已过期'
      }
    }
    if (item.orderType === ORDER_TYPE_NETWORK) {
      if (item.orderState === 'CANCELLED') {
        /* if (!item.requestRefunds) { //商户发起的退款
                  return {
                      color: "deep",
                      name: "已退款"
                  };
              } */
        return {
          color: 'deep',
          name: '已取消'
        }
      }
      if (item.requestRefunds) { // 用户发起的退款
        if (item.requestRefundsFlag === false) {
          return {
            color: 'yellow',
            name: '拒绝退款'
          }
        }
        if (item.refundsSuccess) {
          return {
            color: 'yellow',
            name: '已退款'
          }
        }
        return {
          color: 'yellow',
          name: '取消中'
        }
      }
    }


    switch (item.orderState) {
      case 'PENDING': // 待处理(外卖订单)、未使用（到店消费）、待发货（快寄配送到家）
        if (item.orderType === PICK_UP || item.orderType === ORDER_TYPE_STORE) { // 到店消费
          obj = {
            color: 'yellow',
            name: '待使用'
          }
        } else if (item.orderType === ORDER_TYPE_NETWORK) { // 外卖到家
          obj = {
            color: 'yellow',
            name: '待接单'
          }
        } else if (item.orderType === ORDER_TYPE_DELIVERY) { // 快递到家
          obj = {
            color: 'yellow',
            name: '待发货'
          }
        } else if (item.orderType === ORDER_TYPE_SCAN) {
          obj = {
            color: 'yellow',
            name: '商家未接单'
          }
        } else if (item.orderType === ORDER_TYPE_OFFER) {
          obj = {
            color: 'deep',
            name: '已完成'
          }
        }
        break
      case 'COOKING': // 出餐中（外卖订单）、已发货（快寄配送到家）,
        if (item.orderType === PICK_UP || item.orderType === ORDER_TYPE_STORE) {
          obj = {
            color: 'yellow',
            name: '待使用'
          }
        } else if (item.orderType === ORDER_TYPE_NETWORK) {
          obj = {
            color: 'deep',
            name: '出餐中'
          }
        } else if (item.orderType === ORDER_TYPE_DELIVERY) {
          obj = {
            color: 'green',
            name: '已发货'
          }
        } else if (item.orderType === ORDER_TYPE_SCAN) {
          obj = {
            color: 'yellow',
            name: '用餐中'
          }
        } else if (item.orderType === ORDER_TYPE_SCAN_LATER) {
          obj = {
            color: 'deep',
            name: '已完成'
          }
        } else if (item.orderType === ORDER_TYPE_OFFER) {
          obj = {
            color: 'deep',
            name: '已完成'
          }
        }
        break
      case 'TAKE_A_SINGLE': // 取单中（外卖订单）,
        if (item.orderType === ORDER_TYPE_NETWORK) {
          obj = {
            color: 'green',
            name: '取单中'
          }
        }
        break
      case 'DISTRIBUTION': // 配送中（外卖订单）,
        if (item.orderType === ORDER_TYPE_NETWORK) {
          obj = {
            color: 'green',
            name: '配送中'
          }
        }
        break
      case 'FINISH': // 已完成（外卖订单、到店消费、快寄配送到家）,
        obj = {
          color: 'deep',
          name: '已完成'
        }
        break
      case 'CANCELLED': // 已取消（外卖订单、到店消费、快寄配送到家）,
        obj = {
          color: 'deep',
          name: '已取消'
        }
        break
      case 'PERSON_PENDING': // 配送员待接单（外卖订单）
        obj = {
          color: 'deep',
          name: '配送员待接单'
        }
        break
    }
    return obj
  }

  clickBtnWrap = e => {
    e.stopPropagation()
  }

  /** *****操作按钮****** */
  // 查看物流信息
  navigateToLogistics = item => {
    navToPage(`/pages/logisticsInfo/logisticsInfo?order=${encodeURIObj(item)}`)
  }

  // 确认收货
  confirmReceive = (item, e) => {
    this.setState({
      currentItem: item
    }, () => {
      Taro.showModal({
        title: '是否确认商品已到达您的手中？',
        confirmColor: '#FF643D'
      })
        .then(res => {
          if (res.confirm) {
            if (!item.id) {
              showToast('订单未知')
              return
            }
            showLoading('请稍候', true)
            this.props.dispatch({
              type: 'order/confirmReceiveAction',
              payload: { id: item.id },
              callback: ({ ok, data }) => {
                hideLoading()
                if (ok) {
                  showToast('操作成功')
                  this.publicModifyOrder(data)
                } else {
                  showToast('操作失败')
                }
              }
            })
          }
        })
    })
  }

  // store中更新订单列表(前端更新),订单详情页面也会调用
  publicModifyOrder = data => {
    isFunction(this.props.onModifyOrder) && this.props.onModifyOrder(data)
  }

  /** *********订单操作方法******** */
  // 取消订单
  cancelOrder = (item, e) => {
    // e.stopPropagation();
    this.setState({ currentItem: item }, () => {
      isFunction(this.props.onCancelOrder) && this.props.onCancelOrder(item)
    })
  }

  // 催单
  reminderOrder = (item, e) => {
    // e.stopPropagation();
    this.setState({ currentItem: item }, () => {
      isFunction(this.props.onReminderOrder) && this.props.onReminderOrder(item)
    })
  }

  // 去支付订单
  goPayOrder = (item, e) => {
    e.stopPropagation()
  }

  // 联系骑手
  linkCourier = (item, e) => {
    // 获取外卖配送员信息
    e.stopPropagation()
    this.loadShippingInfo(item)
  }

  // 获取外卖配送员信息
  loadShippingInfo = orderDetail => {
    this.props.dispatch({
      type: 'order/getMeiShippingAction',
      payload: { orderSn: orderDetail.orderSn },
      callback: ({ ok, headers, data }) => {
        // console.log(data);
        if (ok && objNotNull(data)) {
          callPhone(data.courierPhone)
        }
      }
    })
  }

  // 再来一单
  againOrder = (item, e) => {
    e.stopPropagation()
    navToPage(`/pages/shop/shop?id=${item.merchantNo}&page=order&order=${ecodeURIObj(item)}`, true)
  }

  // 去评论
  goToComment = (item, e) => {
    e.stopPropagation()
  }

  render() {
    const {
      ajaxLoading = {}
    } = this.props
    const currentList = this.props.currentList || []

    const { currentItem } = this.state
    // if (!currentList) {
    //   return (<View />)
    // }
    // if (currentList.length === 0 && objNotNull(ajaxLoading) && !(ajaxLoading.effects['order/getOrderListAction'])) {
    //   return (
    //     <View className="scroll-wrap">
    //       <NoData
    //         noDataImg={`${STATIC_IMG_URL}/nodata/order.png`}
    //         msg="您还没有订单哦"
    //       />
    //     </View>
    //   )
    // }
    // console.log("++++", ajaxLoading.effects[ACTION_CANCEL_ORDER]);
    return (
      <Block>
        {
          !currentList ? <View />
            : currentList.length === 0 && objNotNull(ajaxLoading) && !(ajaxLoading.effects['order/getOrderListAction'])
              ? (
                <View className="scroll-wrap">
                  <NoData
                    msg="您还没有订单哦"
                  />
                </View>
              )
              : (
                <View className="scroll-wrap">
                  {
                  currentList && currentList.length > 0 && currentList.map((o, i) => {
                    const {
                      merchantModel: {
                        merchant_name, merchantAvatar
                      } = {}, offerDiscountDetailsDTO = {}
                    } = o
                    const orderState = this.getOrderState(o) || {}
                    let shopOrderProductInfoDTOS = o.shopOrderProductInfoDTOS[0] || {}
                    if (o.orderType === 'SCAN_CODE') {
                      shopOrderProductInfoDTOS = o.shopOrderProductInfoDTOS.find(({ imageUrl }) => imageUrl) || {}
                    }
                    const tempName = shopOrderProductInfoDTOS.productName ? shopOrderProductInfoDTOS.productName : '未知商品名'
                    const isOfferPay = o.orderType === 'OFFER_TO_PAY'
                    return (
                      <View
                        className={`order-item ${SCROLL_LOCATION}${o.id}`}
                        onClick={this.navigateToDetail.bind(this, o)}
                        key={o.id}
                      >
                        <View className="flex-row flex-ac flex-sb order-header">
                          <View className="flex-row flex-ac">
                            <Text
                              // className={`order-type-tag ${o.expired ? 'gray' : o.orderType === ORDER_TYPE_NETWORK ? 'red' : o.orderType === ORDER_TYPE_STORE ? 'yellow' : 'green'}`}
                              className={`order-type-tag ${ORDER_TYPE[o.orderType].className}`}
                            >
                              {ORDER_TYPE[o.orderType].label}
                              {/* {o.orderType === ORDER_TYPE_NETWORK ? '外卖到家' : o.orderType === ORDER_TYPE_STORE ? '门店使用' : o.orderType === ORDER_TYPE_DELIVERY ? '物流到家' : '到店自提'} */}
                            </Text>
                            <Text className="order-time">{dateFormat(o.addTime)}</Text>
                          </View>
                          <Text
                            className={`order-state ${orderState.color}`}
                          >
                            {orderState.name}
                          </Text>
                        </View>
                        <View className="flex-row order-content">
                          <Image
                            className="dish-logo"
                            src={getServerPic(isOfferPay ? merchantAvatar : shopOrderProductInfoDTOS.imageUrl && shopOrderProductInfoDTOS.imageUrl.split(',')[0])}
                          />
                          <View className="flex1 flex-col flex-sb right">
                            <View
                              className="mulBreak dish-name"
                            >
                              {isOfferPay ? merchant_name : tempName}
                            </View>
                            {
                              isOfferPay ? (
                                <View className="offerPay flex-row flex-sb">
                                  <Text>{`￥${offerDiscountDetailsDTO.totalDisMoney || 0}`}</Text>
                                  <View>
                                    总计：
                                    <Text className="rmb">¥</Text>
                                    <Text
                                      className="money"
                                    >
                                      {formatCurrency(o.amount)}
                                    </Text>
                                  </View>
                                </View>
                              ) : (
                                <View className="flex-col num">
                                  <Text>
                                    单价：¥
                                    {formatCurrency(shopOrderProductInfoDTOS.productPrice)}
                                  </Text>
                                  <View className="flex-row flex-ac flex-sb total-wrap">
                                    <Text>
                                      数量：
                                      {shopOrderProductInfoDTOS.productNum ? shopOrderProductInfoDTOS.productNum : '0'}
                                    </Text>
                                    <View>
                                      总计：
                                      <Text className="rmb">¥</Text>
                                      <Text
                                        className="money"
                                      >
                                        {formatCurrency(o.amount)}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              )
                            }
                          </View>
                        </View>
                        {
                          // 物流到家的商品
                          o.orderType === ORDER_TYPE_DELIVERY && o.orderState !== 'PENDING' && o.orderState !== 'FINISH' && o.orderState !== 'CANCELLED' && (
                            <View
                              className="flex-row flex-je order-footer"
                              onClick={this.clickBtnWrap.bind(this)}
                            >
                              {
                                <Block>
                                  <Button
                                    className="order-btn"
                                    hoverClass="hover"
                                    onClick={this.navigateToLogistics.bind(this, o)}
                                  >
                                    查看物流
                                  </Button>
                                  <Button
                                    className="order-btn yellow"
                                    hoverClass="hover"
                                    disabled={currentItem.id === o.id && ajaxLoading.effects['order/confirmReceiveAction']}
                                    loading={currentItem.id === o.id && ajaxLoading.effects['order/confirmReceiveAction']}
                                    onClick={this.confirmReceive.bind(this, o)}
                                  >
                                    确认收到
                                  </Button>
                                </Block>
                              }
                            </View>
                          )}
                        {
                          // 外卖到家的商品
                          o.orderType === ORDER_TYPE_NETWORK
                          && (
                            <View
                              className="flex-row flex-je order-footer"
                              onClick={this.clickBtnWrap.bind(this)}
                            >
                              {
                                // (商户用户)取消中,退款中,或者已取消的单子,无任何操作
                                o.requestRefunds && (o.requestRefundsFlag || o.orderState === 'CANCELLED')
                                  ? null
                                  : (
                                    <Block>
                                      {
                                        // 未接单or出餐中
                                        // (o.orderState === "PENDING" || o.orderState === "COOKING") &&
                                        (o.orderState === 'PENDING')
                                        && (
                                          <Block>
                                            <Button
                                              className="order-btn"
                                              hoverClass="hover"
                                              loading={currentItem.id === o.id && ajaxLoading.effects[ACTION_CANCEL_ORDER]}
                                              disabled={currentItem.id === o.id && ajaxLoading.effects[ACTION_CANCEL_ORDER]}
                                              onClick={this.cancelOrder.bind(this, o)}
                                            >
                                              取消订单
                                            </Button>
                                            <Button
                                              className="order-btn"
                                              hoverClass="hover"
                                              loading={currentItem.id === o.id && ajaxLoading.effects[ACTION_REMINDER_ORDER]}
                                              disabled={currentItem.id === o.id && ajaxLoading.effects[ACTION_REMINDER_ORDER]}
                                              onClick={this.reminderOrder.bind(this, o)}
                                            >
                                              催单
                                            </Button>
                                          </Block>
                                        )
                                      }
                                      {
                                        // 配送员待接单
                                        o.orderState === 'PERSON_PENDING' && (
                                          <Button
                                            className="order-btn"
                                            hoverClass="hover"
                                            loading={currentItem.id === o.id && ajaxLoading.effects[ACTION_REMINDER_ORDER]}
                                            disabled={currentItem.id === o.id && ajaxLoading.effects[ACTION_REMINDER_ORDER]}
                                            onClick={this.reminderOrder.bind(this, o)}
                                          >
                                            催单
                                          </Button>
                                        )}
                                      {
                                        // 配送员取单中or配送中
                                        (o.orderState === 'TAKE_A_SINGLE' || o.orderState === 'DISTRIBUTION')
                                        && (
                                          <Button
                                            className="order-btn"
                                            hoverClass="hover"
                                            onClick={this.linkCourier.bind(this, o)}
                                          >
                                            联系骑手
                                          </Button>
                                        )
                                      }
                                      {
                                        // 已完成
                                        o.orderState === 'FINISH' && (
                                          <Block>
                                            {/* <Button className="order-btn"
                                                        hoverClass="hover"
                                                        onClick={() => {
                                                        }}
                                                >
                                                    再来一单
                                                </Button>
                                                <Button className="order-btn"
                                                        hoverClass="hover"
                                                        onClick={() => {
                                                        }}
                                                >
                                                    评论
                                                </Button> */}
                                          </Block>
                                        )}
                                    </Block>
                                  )
                              }
                            </View>
                          )
                        }
                      </View>
                    )
                  })
                }
                </View>
              )
        }
      </Block>
    )
  }
}

export default OrderList
