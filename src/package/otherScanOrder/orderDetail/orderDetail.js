import Taro, { Component } from '@tarojs/taro'
import {
  Button, Image, Map, ScrollView, Text, View
} from '@tarojs/components'
import { AtCountdown, AtIcon } from 'taro-ui'
import './orderDetail.scss'
import { connect } from '@tarojs/redux'
import {
  callPhone,
  dateFormat,
  dateFormatWithDate,
  encodeURIObj,
  formatAttachPath,
  formatCurrency,
  getServerPic,
  hideLoading,
  isArray,
  isFunction,
  navToPage,
  objNotNull,
  showLoading,
  showToast,
  strToSpace,
  toDecimal,
  saveCodeSign, getPlatFormId
} from '../../../utils/utils'
import {
  KEY_DISTRIBUTION,
  KEY_EAT_IN,
  KEY_RECEIVE,
  KEY_TASK_OUT,
  KEY_TO_STORE,
  KEY_PICK_UP,
  KEY_OFFER_PAY
} from '../../../config/config'
import { STATIC_IMG_URL } from '../../../config/baseUrl'
import MyImage from '../../../components/MyImage/MyImage'
import merIcon from '../../../images/icon/icon_merchant.png' // 门店图标
import riderIcon from '../../../images/icon/icon_horseman.png' // 骑手图标
import userIcon from '../../../images/icon/icon_location_red.png' // 客户图标
import FloatLayout from '../../../components/FloatLayout/FloatLayout'

const ACTION_CANCEL_ORDER = 'order/cancelOrderAction' // 取消订单
const ACTION_REMINDER_ORDER = 'order/reminderOrderAction'// 催单
/**
 * 订单详情页面
 */
@connect(({ loading, index }) => ({
  ajaxLoading: loading
  // curMerchantInfo: index.curMerchantInfo
}))
class OrderDetail extends Component {
  config = {
    navigationBarTitleText: '详情'
  }

  constructor() {
    super()
    this.state = {
      order: {}, // 订单详情
      mapMarks: [],
      showCustomerCodeLayout: false, // 消费码弹层
      showQrcodeLayout: false, // 商家消费二维码弹层展示
      curMerchantInfo: {}, // 门店信息
      shippingType: 2
    }
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: '#ffffff'
    })
    const orderSn = this.$router.params.orderSn || ''
    this.loadOrderDetail(orderSn)
  }

  componentDidMount() {
    // Taro.createMapContext()
  }

  componentWillUnmount() {
  }

  componentDidShow() {
  }

  // 获取门店信息
  getMerchantDetailAction = merchantId => {
    this.props.dispatch({
      type: 'merchant/getMerchantDetailAction',
      payload: {
        merchantId,
        platformId: getPlatFormId()
      },
      callback: ({ ok, data }) => {
        if (ok) {
          console.log(data)
        }
      }
    })
  }

  // 加载订单详情数据
  loadOrderDetail = orderSn => {
    if (!orderSn) {
      showToast('订单SN未知')
      return
    }
    showLoading()
    this.props.dispatch({
      type: 'order/getOrderDetailAction',
      payload: { orderSn },
      callback: ({ ok, data }) => {
        hideLoading()
        if (ok) {
          this.setState({ order: data })
          const orderInf = data
          this.props.dispatch({
            type: 'merchant/getMerchantDetailAction',
            payload: {
              merchantId: orderInf.merchantId,
              platformId: getPlatFormId()
            },
            callback: ({ ok, data }) => {
              if (ok) {
                const merchantInfo = data
                this.setState({
                  curMerchantInfo: merchantInfo.merchantDTO,
                  shippingType: merchantInfo.shippingType
                })
                if (orderInf.orderType === 'NETWORK') {
                  // const {curMerchantInfo} = this.props
                  // console.log(curMerchantInfo)
                  const [lng, lat] = merchantInfo.merchantDTO.merchantDetails.position.split(',')
                  const [customerLng, customerLat] = orderInf.shopOrderExtendedInfoDTO.customerCoordinate.split(',')
                  if (orderInf.orderState === 'TAKE_A_SINGLE' || orderInf.orderState === 'DISTRIBUTION') {
                    this.props.dispatch({
                      type: 'order/getRiderLocationAction',
                      payload: { orderSn: orderInf.orderSn },
                      callback: res => {
                        if (res.ok) {
                          if (data.orderState === 'TAKE_A_SINGLE') {
                            this.setState({
                              mapMarks: [{
                                latitude: res.data.data.lat / Math.pow(10, 6),
                                longitude: res.data.data.lng / Math.pow(10, 6),
                                iconPath: riderIcon,
                                width: 30,
                                height: 36
                              }, {
                                latitude: lat,
                                longitude: lng,
                                iconPath: merIcon,
                                width: 30,
                                height: 36
                              }]
                            })
                          } else {
                            this.setState({
                              mapMarks: [{
                                latitude: res.data.data.lat / Math.pow(10, 6),
                                longitude: res.data.data.lng / Math.pow(10, 6),
                                iconPath: riderIcon,
                                width: 30,
                                height: 36
                              }, {
                                latitude: customerLat,
                                longitude: customerLng,
                                iconPath: userIcon,
                                width: 20,
                                height: 24
                              }]
                            })
                          }
                        }
                      }
                    })
                  } else {
                    let title = ''
                    if (orderInf.orderState === 'PENDING') {
                      title = '等待商家接单'
                    } else if (orderInf.orderState === 'COOKING') {
                      title = '商家正在备餐'
                    } else if (orderInf.orderState === 'PERSON_PENDING') {
                      title = '配送员待接单'
                    }
                    this.setState({
                      mapMarks: [{
                        latitude: lat,
                        longitude: lng,
                        iconPath: merIcon,
                        width: 30,
                        height: 36,
                        label: {
                          content: title,
                          padding: 8,
                          bgColor: '#ffffff',
                          borderRadius: 10,
                          anchorX: -44,
                          anchorY: -70
                        }
                      }, {
                        latitude: customerLat,
                        longitude: customerLng,
                        iconPath: userIcon,
                        width: 20,
                        height: 24
                      }]
                    })
                  }
                }
              }
            }
          })
        } else {
          showToast('加载数据出错~')
        }
      }
    })
  }

  // 拨打电话
  onClickCallPhone = phoneNumber => {
    callPhone(phoneNumber)
  }

  // 跳转到门店页面
  navigateToShop = (id, e) => {
    if (!id) {
      // showToast("门店未知");
      return
    }
    // navToPage(`/pages/shop/shop?id=${id}`);
    e.stopPropagation()
  }

  // 订单类型
  getOrderType = item => {
    switch (item.orderType) {
      case KEY_TASK_OUT: // 外卖订单
        return {
          class: 'yellow',
          name: '配送订单'
        }
      case KEY_EAT_IN: // 堂食预定
        return {
          class: 'green',
          name: '堂食预定'
        }
      case KEY_PICK_UP: // 到店自取
        return {
          class: 'blue',
          name: '到店自取'
        }
      case KEY_DISTRIBUTION:
        return {
          class: 'blue',
          name: '物流到家'
        }
      case KEY_OFFER_PAY:
        return {
          class: 'yellow',
          name: '优惠买单'
        }
      default:
        return {
          class: 'gray',
          name: '类型未知'
        }
    }
  }

  // 包装费
  getPackFee = item => {
    let totalPackFee = 0 // 包装费
    const products = item.shopOrderProductInfoDTOS || []
    if (products.length > 0) {
      totalPackFee = toDecimal(
        products.reduce((o1, o2) => (o1.packFee + o2.packFee))
      )
    }
    return totalPackFee
  }

  // 满减
  getFullMinusMoney = item => {
    let fullMinusMoney = 0
    const fullReductionActivity = item.fullReductionActivity || null // 满减活动
    const fullReductionlist = fullReductionActivity && isArray(fullReductionActivity.fullReductionlist) && fullReductionActivity.fullReductionlist || []

    if (fullReductionlist.length > 0) {
      fullReductionlist.map(item => {
        if (totalPrice >= item.fullMoney) {
          minusMoney = parseFloat(minusMoney) + parseFloat(item.cutMoney)
          fullMinusMoney = item.cutMoney
        }
      })
    }
    return fullMinusMoney
  }

  // 催单
  reminderOrder = (item, e) => {
    e.stopPropagation()
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
  }

  // 取消订单
  cancelOrder = (item, e) => {
    e.stopPropagation()
    Taro.showModal({
      content: '确定要取消订单吗?',
      cancelText: '否',
      confirmText: '是',
      confirmColor: '#ccc'
    })
      .then(res => {
        if (res.confirm) {
          this._commonDispatch(item, ACTION_CANCEL_ORDER, ({ ok, data }) => {
            if (ok) {
              const orderSn = this.$router.params.orderSn || ''
              this.loadOrderDetail(orderSn)
              showToast('取消成功')
            } else {
              showToast('取消失败')
            }
          })
        }
      })
  }

  // 公用发送dispatch方法
  _commonDispatch = (payload, type, callback) => {
    this.props.dispatch({
      type,
      payload: { param: payload },
      callback: res => {
        isFunction(callback) && callback(res)
      }
    })
  }

  // 复制订单号
  copyOrderSn = orderSn => {
    Taro.setClipboardData({
      data: orderSn,
      success: () => {
        showToast('已复制!')
      }
    })
  }

  // 查看物流
  viewLogistics = item => {
    navToPage(`/pages/logisticsInfo/logisticsInfo?order=${encodeURIObj(item)}`)
  }

  // 确认收货
  confirmReceive = item => {
    this.props.dispatch({
      type: 'order/confirmReceiveAction',
      payload: {
        id: item.id
      },
      callback: res => {
        if (res.ok) {
          showToast('已确认！')
          const orderSn = this.$router.params.orderSn || ''
          this.loadOrderDetail(orderSn)
        } else {
          showToast('系统错误, 请重试！')
        }
      }
    })
  }

  allCodeModal = e => {
    e.stopPropagation()
    this.setState({ showCustomerCodeLayout: !this.state.showCustomerCodeLayout })
  }

  useTicketModal = e => {
    e.stopPropagation()
    this.setState({ showQrcodeLayout: !this.state.showQrcodeLayout })
  }

  // 是否渲染地图
  canShowMap = order => !order.requestRefundsFlag
    && order.payState !== 'UNPAY'
    && order.orderState !== 'FINISH'
    && order.orderType === KEY_TASK_OUT

  render() {
    const {
      order = {}, mapMarks, showCustomerCodeLayout, showQrcodeLayout, curMerchantInfo
    } = this.state
    const { ajaxLoading = {} } = this.props
    // const [lng, lat] =curMerchantInfo.length > 0 && curMerchantInfo[0].merchantDetails.position.split(',');
    const allCode = order.orderWriteOffCodeDTOS && order.orderWriteOffCodeDTOS.length > 0 && order.orderWriteOffCodeDTOS || []
    let usableCodes = [] // 可用的消费码
    let usedCodes = []// 已使用的消费码
    if (allCode.length > 0) {
      usableCodes = allCode.filter(o => !o.useState)
      usedCodes = allCode.filter(o => o.useState)
    }
    const { offerDiscountDetailsDTO, payWay } = order || {}
    const { otherDisCount = [] } = offerDiscountDetailsDTO || {}
    const isUseConpon = otherDisCount.find(({ activityCode }) => activityCode === 1)
    if (ajaxLoading.effects['order/getOrderDetailAction']) {
      return (
        <View className="nodata">
          加载中....
        </View>
      )
    } if (!objNotNull(order)) {
      return (
        <View className="nodata">
          暂无数据
        </View>
      )
    }
    return (
      <Block>
        {
          this.canShowMap(order)
          && (
          <View className="orderMap">
            <Map
              className="map"
              markers={mapMarks}
              include-points={mapMarks}
            />
          </View>
          )
        }
        <ScrollView
          className={`order-detail-wrap ${this.canShowMap(order) && 'lessMapHeight'}`}
          scrollY
        >
          {
            order.requestRefundsFlag
              ? (
                <View className="text-center" style="font-size:14px;">
                  {
                  order.refundsSuccess ? '退款成功'
                    : order.payState === 'UNPAY' ? '已取消（未支付）'
                      : (order.orderState === 'CANCELLED') ? '已取消'
                        : (order.orderState !== 'CANCELLED') ? '退款中'
                          : null
                }
                </View>
              )
              : order.payState === 'UNPAY'
                ? (
                  <View className="flex-col flex-ac detail-header">
                    <View className="title">您还未支付订单</View>
                    <View className="tips">请尽快支付订单,以便商家为你提供更好的服务</View>
                    <View className="flex-row flex-ac gap">
                      <Button
                        className="none-margin order-btn"
                        hoverClass="order-btn-hover"
                        style="margin-left:0"
                        onClick={this.cancelOrder.bind(this, order)}
                      >
                    取消订单
                      </Button>
                      <Button
                        className="none-margin order-btn"
                        hoverClass="order-btn-hover"
                      >
                    去支付
                      </Button>
                    </View>
                  </View>
                )
                : order.orderState === 'FINISH'
                  ? (
                    <Block>
                      <View className="flex-col flex-ac detail-header">
                        <View className="title">已完成</View>
                        <View className="tips">
感谢您对
                          {curMerchantInfo.merchant_name}
的信任，期待您的下次光临！
                        </View>
                        {/* <View className="flex-row flex-ac gap"> */}
                        {/* <Button className="none-margin order-btn" */}
                        {/* hoverClass="order-btn-hover" */}
                        {/* style={"margin-left:0"} */}
                        {/* > */}
                        {/* 再来一单 */}
                        {/* </Button> */}
                        {/* <Button className="none-margin order-btn" */}
                        {/* hoverClass="order-btn-hover" */}
                        {/* > */}
                        {/* 评论 */}
                        {/* </Button> */}
                        {/* </View> */}
                      </View>
                      {
                    order.orderType === 'NETWORK' && this.state.shippingType !== 2
                    && (
                    <View className="flex-row courier-wrap">
                      <Image
                        className="header"
                        src={require('../../../images/icon/icon_horseman_avator.png')}
                      />
                      <View className="flex1 right">
                        <View className="title">配送员：</View>
                        <View className="flex-row flex-sb flex-ac">
                          <Text className="flex1 ellipsis name">{order.personName || '--'}</Text>
                          <AtIcon
                            prefixClass="icon"
                            value="phone"
                            size={18}
                            color="#CCCCCC"
                            onClick={this.onClickCallPhone.bind(this, order.personPhone)}
                          />
                        </View>
                      </View>
                    </View>
                    )
                  }
                    </Block>
                  )
                  : (
                    <Block>
                      {
                    // 外卖订单
                    order.orderType === KEY_TASK_OUT
                    && (
                    <Block>
                      {
                        (order.orderState === 'PENDING' || order.orderState === 'COOKING')
                        && (
                        <View className="flex-col flex-ac detail-header">
                          <View
                            className="title"
                          >
                            {order.orderState === 'PENDING' ? '未接单' : '已接单'}
                          </View>
                          <View
                            className="tips"
                          >
                            {order.orderState === 'PENDING' ? '正在催商家接单，请耐心等待！' : '商家已接单，请耐心等候'}
                          </View>
                          <View className="flex-row flex-ac gap">
                            <Button
                              className="none-margin order-btn"
                              hoverClass="order-btn-hover"
                              style="margin-left:0"
                              onClick={this.cancelOrder.bind(this, order)}
                            >
                              取消订单
                            </Button>
                            <Button
                              className="none-margin order-btn"
                              hoverClass="order-btn-hover"
                              onClick={this.reminderOrder.bind(this, order)}
                            >
                              催单
                            </Button>
                          </View>
                        </View>
                        )
                      }
                      {
                        order.orderState === 'PERSON_PENDING'
                        && (
                        <View className="flex-col flex-ac detail-header">
                          <View className="title">配送员未接单</View>
                          <View className="tips">配送员还未接单,请耐心等待</View>
                          <View className="flex-row flex-ac gap">
                            <Button
                              className="none-margin order-btn"
                              hoverClass="order-btn-hover"
                              style="margin-left:10px"
                              onClick={this.reminderOrder.bind(this, order)}
                            >
                              催单
                            </Button>
                          </View>
                        </View>
                        )
                      }
                      {
                        (order.orderState === 'TAKE_A_SINGLE' || order.orderState === 'DISTRIBUTION')
                        && (
                        <Block>
                          <View className="flex-col flex-ac detail-header">
                            <View
                              className="title"
                            >
                              {order.orderState === 'TAKE_A_SINGLE' ? '取单中' : '配送中'}
                            </View>
                            <View
                              className="tips"
                            >
                              {order.orderState === 'TAKE_A_SINGLE' ? '配送员正赶往商家，请耐心等待！' : '订单正在来的路上，请耐心等待！'}
                            </View>
                          </View>
                          <View className="flex-row courier-wrap">
                            <Image
                              className="header"
                              src={`${STATIC_IMG_URL}/icon/test_header.jpg`}
                            />
                            <View className="flex1 right">
                              <View className="title">配送员：</View>
                              <View className="flex-row flex-sb flex-ac">
                                <Text className="flex1 ellipsis name">{order.personName}</Text>
                                <AtIcon
                                  prefixClass="icon"
                                  value="phone"
                                  size={18}
                                  color="#CCCCCC"
                                  onClick={this.onClickCallPhone.bind(this, order.personPhone)}
                                />
                              </View>
                            </View>
                          </View>
                        </Block>
                        )
                      }
                    </Block>
                    )
                  }
                      {
                    // 物流到家
                    order.orderType === KEY_DISTRIBUTION
                    && (
                    <Block>
                      {
                        (order.orderState === 'PENDING')
                        && (
                        <View className="flex-col flex-ac detail-header">
                          <View
                            className="title"
                          >
待发货
                          </View>
                          <View className="flex-row flex-ac gap">
                            {/* <Button className="none-margin order-btn" */}
                            {/*        hoverClass="order-btn-hover" */}
                            {/*        style={"margin-left:0"} */}
                            {/*        onClick={this.cancelOrder.bind(this, order)} */}
                            {/* > */}
                            {/*  取消订单 */}
                            {/* </Button> */}
                            <Button
                              className="none-margin order-btn"
                              hoverClass="order-btn-hover"
                              onClick={this.reminderOrder.bind(this, order)}
                            >
                              催单
                            </Button>
                          </View>
                        </View>
                        )
                      }
                      {
                        (order.orderState === 'COOKING')
                        && (
                        <View className="flex-col flex-ac detail-header">
                          <View
                            className="title"
                          >
已发货
                          </View>
                          <View className="flex-row flex-ac gap">
                            <Button
                              className="none-margin order-btn"
                              hoverClass="order-btn-hover"
                              style="margin-left:0"
                              onClick={this.viewLogistics.bind(this, order)}
                            >
                              查看物流
                            </Button>
                            <Button
                              className="none-margin order-btn"
                              hoverClass="order-btn-hover"
                              style="margin-left:14px"
                              onClick={this.confirmReceive.bind(this, order)}
                            >
                              确认收货
                            </Button>
                          </View>
                        </View>
                        )
                      }
                    </Block>
                    )
                  }
                      {
                    // 到店消费
                    order.orderType === KEY_TO_STORE
                    && (
                    <Block>
                      <View className="flex-col flex-ac detail-header">
                        <View
                          className="title"
                        >
待使用
                        </View>
                        {
                          allCode.length > 0
                          && (
                          <View className="flex-row flex-ac flex-sb ticketItem">
                            <View className="info-icon ticket" />
                            {

                              // 全部消费码都用了,不做过期判断
                              usedCodes.length === allCode.length
                                ? (
                                  <View className="flex1">
                                    {
                                    usedCodes.length === 1
                                      ? (
                                        <View
                                          className="flex-row flex-ac title"
                                        >
                                          {strToSpace(objNotNull(usedCodes[0]) && usedCodes[0].writeOffCode, 4)}
                                        </View>
                                      )
                                      : (
                                        <View
                                          className="flex-row flex-ac title"
                                          onClick={this.allCodeModal.bind(this)}
                                        >
                                          {strToSpace(objNotNull(usedCodes[0]) && usedCodes[0].writeOffCode, 4)}
                                          <Text className="more-code">∨</Text>
                                        </View>
                                      )
                                  }
                                    <View className="time">
                                      {usedCodes.length}
张已使用
                                      {usedCodes.length === 1 ? `  ${dateFormatWithDate(usedCodes[0].useDate)}` : ''}
                                    </View>
                                  </View>
                                )
                                // 没有使用的消费码
                                : usableCodes.length > 0 ? order.expired
                                  ? (
                                    <View className="flex1">
                                      {
                                    usableCodes.length === 1
                                      ? (
                                        <View
                                          className="flex-row flex-ac title"
                                        >
                                          {strToSpace(objNotNull(usableCodes[0]) && usableCodes[0].writeOffCode, 4)}
                                        </View>
                                      )
                                      : (
                                        <View
                                          className="flex-row flex-ac title"
                                          onClick={this.allCodeModal.bind(this)}
                                        >
                                          {strToSpace(objNotNull(usableCodes[0]) && usableCodes[0].writeOffCode, 4)}
                                          <Text className="more-code">∨</Text>
                                        </View>
                                      )
                                  }
                                      <View className="time">
                                        {usableCodes.length}
张已无效
                                    |
                                        {' '}
                                        {dateFormatWithDate(order.useEndTime)}
                                        <Text
                                          style="color:#FF623D"
                                        >
已过期
                                        </Text>
                                      </View>
                                    </View>
                                  )
                                  : (
                                    <Block>
                                      <View className="flex1">
                                        {
                                      usableCodes.length === 1
                                        ? (
                                          <View
                                            className="flex-row flex-ac title"
                                          >
                                            {strToSpace(objNotNull(usableCodes[0]) && usableCodes[0].writeOffCode, 4)}
                                          </View>
                                        )
                                        : (
                                          <View
                                            className="flex-row flex-ac title"
                                            onClick={this.allCodeModal.bind(this)}
                                          >
                                            {strToSpace(objNotNull(usableCodes[0]) && usableCodes[0].writeOffCode, 4)}
                                            <Text
    className="more-code"
  >
∨
  </Text>
                                          </View>
                                        )
                                    }
                                        <View className="time">
      <Text>
                                        {usableCodes.length}
张可用
                                      </Text>
      <Text style="margin:0 10px;">|</Text>
      <Text>
                                        {dateFormatWithDate(order.useStartTime, 'yyyy-MM-dd')}
                                        至
                                        {dateFormatWithDate(order.useEndTime, 'yyyy-MM-dd')}
                                      </Text>
    </View>
                                      </View>
                                    </Block>
                                  )
                                  : null
                            }
                            {
                              order.orderState === 'PENDING' && !order.expired
                              && (
                              <Image
                                src={require('../../../images/demo/test_qrcode.png')}
                                className="qrcode"
                                onClick={this.useTicketModal.bind(this)}
                              />
                              )
                            }
                          </View>
                          )
                        }
                      </View>
                    </Block>
                    )
                  }
                      {
                    // 堂食预定单
                    order.orderType === KEY_EAT_IN
                    && (
                    <Block>
                      {
                        (order.orderState === 'PENDING' || order.orderState === 'COOKING')
                        && (
                        <View className="flex-col flex-ac detail-header">
                          <View
                            className="title"
                          >
                            {order.orderState === 'PENDING' ? '未接单' : '待享用'}
                          </View>
                          <View
                            className="tips"
                          >
                            {order.orderState === 'PENDING' ? '正在催商家接单，请耐心等待！' : '订单已预约，请您在预约时间内尽快去到门店享用'}
                          </View>
                          <View className="flex-row flex-ac gap">
                            <Button
                              className="none-margin order-btn"
                              hoverClass="order-btn-hover"
                              style="margin-left:0"
                              onClick={this.cancelOrder.bind(this, order)}
                            >
                              取消预定
                            </Button>
                            {
                              order.orderState === 'PENDING'
                              && (
                              <Button
                                className="none-margin order-btn"
                                hoverClass="order-btn-hover"
                                onClick={this.reminderOrder.bind(this, order)}
                              >
                                催单
                              </Button>
                              )
                            }
                          </View>
                        </View>
                        )
                      }
                    </Block>
                    )
                  }
                      {
                    // 自取订单
                    order.orderType === KEY_PICK_UP
                    && (
                    <Block>
                      {
                        (order.orderState === 'PENDING' || order.orderState === 'COOKING')
                        && (
                        <View className="flex-col flex-ac detail-header">
                          <View
                            className="title"
                          >
                            {order.orderState === 'PENDING' ? '未接单' : '出餐中'}
                          </View>
                          <View
                            className="tips"
                          >
                            {order.orderState === 'PENDING' ? '正在催商家接单，请耐心等待！' : '商家正在出餐中，请耐心等待'}
                          </View>
                          <View className="flex-row flex-ac gap">
                            {
                              order.orderState === 'PENDING'
                              && (
                              <Block>
                                <Button
                                  className="none-margin order-btn"
                                  hoverClass="order-btn-hover"
                                  style="margin-left:10"
                                  onClick={this.cancelOrder.bind(this, order)}
                                >
                                  取消预定
                                </Button>
                                <Button
                                  className="none-margin order-btn"
                                  hoverClass="order-btn-hover"
                                  onClick={this.reminderOrder.bind(this, order)}
                                >
                                  催单
                                </Button>
                              </Block>
                              )
                            }
                            {
                              order.orderState === 'COOKING'
                              && (
                              <Block>
                                <Button
                                  className="none-margin order-btn"
                                  hoverClass="order-btn-hover"
                                  onClick={this.confirmReceive.bind(this, order)}
                                >
                                  确认取餐
                                </Button>
                                <Button
                                  className="none-margin order-btn"
                                  hoverClass="order-btn-hover"
                                  style="margin-left:10"
                                  onClick={this.cancelOrder.bind(this, order)}
                                >
                                  取消预定
                                </Button>
                              </Block>
                              )
                            }
                          </View>
                        </View>
                        )
                      }
                    </Block>
                    )
                  }

                    </Block>
                  )
          }
          {/* 自取时间 */}
          {
            order.orderType === KEY_PICK_UP
            && (
            <View className="self-wrap">
              <View className="flex-row flex-ac item">
                <AtIcon prefixClass="icon" value="clock" size={18} color="#FCB251" />
                <Text className="title">自取时间</Text>
                <View
                  className="flex1 description"
                >
                  {order && order.shopOrderExtendedInfoDTO.orderSend}
                </View>
              </View>
              <View className="flex-row flex-jc item">
                <View className="location-wrap">
                  <AtIcon prefixClass="icon" value="location" size={16} color="#FCB251" />
                </View>
                <Text className="title">自取地址</Text>
                <View
                  className="flex1 description"
                >
                  {curMerchantInfo && curMerchantInfo.merchantDetails.address}
                </View>
              </View>
            </View>
            )
          }

          {/* 预约时间 */}
          {
            order.orderType === KEY_EAT_IN
            && (
            <View className="make-wrap">
              <View className="flex-row flex-ac item">
                <AtIcon prefixClass="icon" value="clock" size={18} color="#FCB251" />
                <Text className="title">预约剩余时间：</Text>
                <AtCountdown
                  format={{
                    hours: ' 时 ',
                    minutes: ' 分',
                    seconds: ''
                  }}
                  day={2}
                  hours={1}
                  minutes={1}
                  seconds={10}
                  isCard={false}
                  className="time-wrap"
                />
                <View className="flex1 description" />
              </View>
              <View className="flex-row flex-jc item">
                <View className="location-wrap">
                  <AtIcon prefixClass="icon" value="location" size={16} color="#FCB251" />
                </View>
                <Text className="title">门店地址：</Text>
                <View className="flex1 description">侯区莱蒙都会商街6号侯区莱蒙都会商街6号侯区莱蒙都会商街6号</View>
              </View>
            </View>
            )
          }

          {/* 订单费用详情 */}
          <View className="list-header">
            <View
              className="flex-row flex-ac header-in"
              onClick={this.navigateToShop.bind(this, order.merchant ? order.merchant.merchantNo : '')}
            >
              <Image src={getServerPic(curMerchantInfo.merchantAvatar)} className="logo" />
              <View className="flex-row flex-ac flex1">
                <Text
                  className="ellipsis merchant-name"
                >
                  {curMerchantInfo.merchant_name}
                </Text>
                {/* <AtIcon value="chevron-right" className="arrow" size={18}/> */}
              </View>
              <Text
                className={`order-type-tag ${this.getOrderType(order).class}`}
              >
                {this.getOrderType(order).name}
              </Text>
            </View>
          </View>
          {
            order.shopOrderProductInfoDTOS && order.shopOrderProductInfoDTOS.length > 0
            && (
            <View className="food-list">
              <View className="food-in">
                {
                  order.shopOrderProductInfoDTOS.map((o, i) => (
                    <View className="flex-row item" key={i}>
                      {/* <Image className="food-img"
                                               src={require("../../images/demo/test_dish.png")}
                                        /> */}
                      <MyImage
                        src={o.imageUrl && formatAttachPath(o.imageUrl)}
                        my-class="food-img"
                        errorLoad={require('../../../images/demo/test_dish.png')}
                      />
                      <View className="flex-col flex1 right">
                        <View className="flex-row flex-sb">
                          <Text
                            className="flex1 ellipsis name"
                          >
                            {o.productName}
                          </Text>
                          <Text className="price">
￥
                            {formatCurrency(o.productPrice)}
                          </Text>
                        </View>
                        <Text className="num">
X
                          {o.productNum}
                        </Text>
                      </View>
                    </View>
                  ))
                }
              </View>
            </View>
            )
          }
          {
            order.orderType !== 'OFFER_TO_PAY' && (
            <View className="fee-wrap">
              <View className="flex-row flex-sb flex-ac item">
                <Text className="name">包装费</Text>
                <View>
                  <Text className="rmb">￥</Text>
                  <Text className="price">{formatCurrency(order.packFee)}</Text>
                </View>
              </View>
              {
                order.orderType === KEY_TASK_OUT
                && (
                <View className="flex-row flex-sb flex-ac item">
                  <Text className="name">配送费</Text>
                  <View>
                    <Text className="rmb">￥</Text>
                    <Text className="price">{formatCurrency(order.shippingFee)}</Text>
                  </View>
                </View>
                )
              }
              <View className="flex-row flex-ac activity-wrap">
                <View className="flex1">
                  <Text className="activity-tag yellow">减</Text>
                  <Text className="activity-text">优惠</Text>
                </View>
                <View>
                  <Text className="rmb">-￥</Text>
                  <Text
                    className="price"
                  >
                    {formatCurrency(order.fullReduction + order.couponFee)}
                  </Text>
                </View>
              </View>
            </View>
            )
          }
          {
            order.orderType === 'OFFER_TO_PAY' && (
            <View className="discountBox">
              <View className="flex-row flex-sb discountItem">
                <Text>原价</Text>
                <Text className="price">
                  ￥
                  {order.productFee}
                </Text>
              </View>
              <View className="flex-row flex-sb discountItem">
                <View>
                  买单折扣:
                  <Text
                    className="discount"
                  >
                    {order.offerDiscountDetailsDTO && order.offerDiscountDetailsDTO.discount || '--'}
                    折
                  </Text>
                </View>
                <Text
                  className="price"
                >
                  -￥
                  {formatCurrency(order.offerDiscountDetailsDTO && order.offerDiscountDetailsDTO.disCountFee)}
                </Text>
              </View>
              {
                isUseConpon && (
                  <View className="flex-row flex-sb discountItem">
                    <View>
                      优惠券:
                      <Text className="discount">{`${formatCurrency(isUseConpon.discount) || '--'}元优惠券`}</Text>
                    </View>
                    <Text className="price">{`-￥${formatCurrency(isUseConpon.disMoney)}`}</Text>
                  </View>
                )
              }
            </View>
            )
          }
          <View className="flex-row flex-je flex-ac price-total">
            <Text className="discounts">已优惠</Text>
            <Text className="rmb">
              ￥
              {order.orderType === 'OFFER_TO_PAY' ? formatCurrency(order.offerDiscountDetailsDTO && order.offerDiscountDetailsDTO.disCountFee + (isUseConpon ? isUseConpon.disMoney : 0)) : formatCurrency(order.fullReduction + order.couponFee)}
            </Text>
            <Text className="rel">实付</Text>
            <Text className="rel">￥</Text>
            <Text className="money">{formatCurrency(order.amount)}</Text>
          </View>

          {/* 配送地址 */}
          {
            order.shopOrderExtendedInfoDTO && (order.orderType !== KEY_OFFER_PAY) && (
            <View className="address-wrap">
              <Block>
                <View className="flex-row flex-sb item">
                  <View className="title">
                    {order.orderType === KEY_TASK_OUT ? '配送地址'
                      : order.orderType === KEY_PICK_UP ? '取餐人'
                        : order.orderType === KEY_EAT_IN ? '订餐人'
                          : order.orderType === KEY_DISTRIBUTION ? '收货人'
                            : order.orderType === KEY_TO_STORE && '订餐人'
                    }
                  </View>
                  <View className="flex1 description">
                    {order.orderType === KEY_TASK_OUT
                    && <View>{order.shopOrderExtendedInfoDTO.customerAddress}</View>}
                    {/* {`${order.orderType === KEY_TASK_OUT && order.shopOrderExtendedInfoDTO.customerAddress}`} */}
                    {`${order.shopOrderExtendedInfoDTO.customerName}（${order.shopOrderExtendedInfoDTO.customerGender === 'MEN' ? '先生' : '女士'}）${order.shopOrderExtendedInfoDTO.customerPhone}`}
                  </View>
                </View>
                <View className="flex-row flex-sb item">
                  <View className="title">
                    {
                    order.orderType === KEY_PICK_UP ? '预约时间' : '送达时间'
                  }
                  </View>
                  <View
                    className="flex1 description"
                  >
                    {order.shopOrderExtendedInfoDTO.orderSend}
                  </View>
                </View>
                <View className="flex-row flex-sb item">
                  <View className="title">订单备注</View>
                  <View
                    className="flex1 description"
                  >
                    {order.shopOrderExtendedInfoDTO.orderRemark || '--'}
                  </View>
                </View>
              </Block>
            </View>
            )
          }
          {/* 订单号 */}
          <View className="order-pay-wrap">
            <View className="flex-row flex-sb item">
              <Text className="title">订单编号</Text>
              <View className="flex1 description">{order.orderSn}</View>
              <View
                className="copyOrderSnBtn"
                onClick={this.copyOrderSn.bind(this, order.orderSn)}
              >
复制
              </View>
            </View>
            <View className="flex-row flex-sb item">
              <Text className="title">订单时间</Text>
              <View
                className="flex1 description"
              >
                {dateFormat(order.addTime, 'yyyy-MM-dd hh:mm')}
              </View>
            </View>
            <View className="flex-row flex-sb item">
              <Text className="title">支付方式</Text>

              <View className="flex1 description">{payWay === 4 ? '余额支付' : payWay === 6 ? '储值支付' : '微信支付'}</View>
            </View>
          </View>

          {
            order.merchantPhone && (
              <View
                className="flex-col flex-ac flex-jc link-merchant"
                onClick={this.onClickCallPhone.bind(this, order.merchantPhone)}
              >
                <AtIcon prefixClass="icon" value="phone" size={22} color="#fff" />
                <View className="text">联系商家</View>
              </View>
            )
          }

          {/* 消费码弹层 */}
          {
            showCustomerCodeLayout && allCode.length > 0
            && (
            <FloatLayout
              onCloseLayout={this.allCodeModal.bind(this)}
              wrapHeight={0}
              noLayoutWrap
            >
              <View className="flex-col flex-ac code-wrap">
                {
                  usedCodes.length === allCode.length
                    ? (
                      <View className="top-wrap">
                        <View className="title">
已使用的消费码
                          <View
                            className="close"
                            onClick={this.allCodeModal.bind(this)}
                          >
x
                          </View>
                        </View>
                        {
                        usedCodes.map((o, i) => (
                          <View
                            className="flex-row flex-sb flex-ac time-out-wrap"
                            key={i}
                          >
                            <Text
                              className="timeout-code"
                            >
                              {strToSpace(o.writeOffCode)}
                            </Text>
                            <Text
                              className="timeout-time"
                            >
                              {dateFormatWithDate(o.useDate)}
                            </Text>
                          </View>
                        )
                          /* return (<View className="code gray"
                                        key={i}>{o.writeOffCode && strToSpace(o.writeOffCode)}</View>); */
                        )
                      }
                      </View>
                    )
                    : order.expired
                      ? (
                        <Block>
                          {
                        usableCodes.length > 0
                        && (
                        <View className="top-wrap">
                          <View className="title">
过期消费码
                            <View
                              className="close"
                              onClick={this.allCodeModal.bind(this)}
                            >
x
</View>
                          </View>
                          {
                            usableCodes.map((o, i) => (
                              <View
                                className="code gray"
                                key={i}
                              >
                                {o.writeOffCode && strToSpace(o.writeOffCode)}
                              </View>
                            ))
                          }
                        </View>
                        )
                      }
                          {
                        usedCodes.length > 0
                        && (
                        <Block>
                          <View className="flex-row flex-ac used-title-wrap">
                            <View className="flex-row flex-ac flex-sb used-title">
                              <Text>已使用的消费码</Text>
                            </View>
                          </View>
                          {
                            <View className="bottom-wrap">
                              {
                                usedCodes.map((o, i) => (
                                  <View
                                    className="flex-row flex-sb flex-ac time-out-wrap"
                                    key={i}
                                  >
                                    <Text
                                      className="timeout-code"
                                    >
                                      {strToSpace(o.writeOffCode)}
                                    </Text>
                                    <Text
                                      className="timeout-time"
                                    >
                                      {dateFormatWithDate(o.useDate)}
                                    </Text>
                                  </View>
                                ))
                              }
                            </View>
                          }
                        </Block>
                        )
                      }
                        </Block>
                      )
                      : (
                        <Block>
                          {
                        usableCodes.length > 0
                        && (
                        <View className="top-wrap">
                          <View className="title">
待使用的消费码
                            <View
                              className="close"
                              onClick={this.allCodeModal.bind(this)}
                            >
x
</View>
                          </View>
                          {
                            usableCodes.map((o, i) => (
                              <View
                                key={i}
                                className="code"
                              >
                                {strToSpace(o.writeOffCode)}
                              </View>
                            ))
                          }
                        </View>
                        )
                      }
                          {
                        usedCodes.length > 0
                        && (
                        <Block>
                          <View className="flex-row flex-ac used-title-wrap">
                            {/* <View className="test-dot"/> */}
                            <View className="flex-row flex-ac flex-sb used-title">
                              <Text>已使用的消费码</Text>
                            </View>
                          </View>
                          <View className="bottom-wrap">
                            {
                              usedCodes.map((o, i) => (
                                <View
                                  key={i}
                                  className="flex-row flex-sb flex-ac time-out-wrap"
                                >
                                  <Text
                                    className="timeout-code"
                                  >
                                    {strToSpace(o.writeOffCode)}
                                  </Text>
                                  <Text
                                    className="timeout-time"
                                  >
                                    {dateFormatWithDate(o.useDate)}
                                  </Text>
                                </View>
                              ))
                            }
                          </View>
                        </Block>
                        )
                      }
                        </Block>
                      )
                }
              </View>
            </FloatLayout>
            )
          }

          {/* 商家扫码消费 */}
          {
            showQrcodeLayout && usableCodes.length > 0
            && (
            <FloatLayout
              onCloseLayout={this.useTicketModal.bind(this)}
              wrapHeight={0}
            >
              <View className="flex-col flex-ac qrcode-wrap">
                <View className="title">
                  商家扫描二维码即可消费
                  <View className="close" onClick={this.useTicketModal.bind(this)}>x</View>
                </View>
                <Image
                  src={usableCodes[0] && usableCodes[0].codeUrl ? getServerPic(usableCodes[0].codeUrl) : require('../../../images/demo/test_qrcode.png')}
                  className="qrcode-img"
                />
              </View>
            </FloatLayout>
            )
          }
        </ScrollView>
      </Block>
    )
  }
}
