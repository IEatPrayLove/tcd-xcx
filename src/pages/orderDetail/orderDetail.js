import Taro, { Component } from '@tarojs/taro'
import {
  Button, CoverImage, CoverView, Image, Map, View,
  Canvas
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtCountdown, AtActivityIndicator } from 'taro-ui'
import './orderDetail.scss'
import {
  calculateDistanceByCoordinate,
  callPhone,
  copyToClipboard,
  dateFormat,
  dateFormatWithDate,
  encodeURIObj,
  formatCurrency,
  getServerPic, getSysInfo, getUserLocation,
  hideLoading,
  isFunction,
  navBackExeFun,
  navToPage,
  objNotNull,
  showLoading,
  showToast,
  strToSpace
} from '../../utils/utils'
import FloatLayout from '../../components/FloatLayout/FloatLayout'
import {
  ACTION_CANCEL_ORDER, ORDER_TYPE_DELIVERY, ORDER_TYPE_NETWORK, ORDER_TYPE_STORE, ACTION_REMINDER_ORDER
} from '../../config/config'
import { DEFAULT_PLAT_FORM_ID, STATIC_IMG_URL } from '../../config/baseUrl'
import drawQrcode from '../../utils/weapp.qrcode.esm'
import riderIcon from '../../images/icon/icon_horseman.png' // 骑手图标

let sendLocationInterval = 0// 获取配送员坐标定时器
let pendingTimeInterval// 待接单倒计时
/**
 * 订单详情页面
 */
// @authenticate
@connect(({ loading, order }) => ({
  ajaxLoading: loading
  // orderDetail: order.orderDetail
}))
class OrderDetail extends Component {
    config = {
      navigationBarTitleText: '订单详情',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
      // disableScroll: true
    };

    constructor() {
      super()
      this.state = {
        showQrcodeLayout: false, // 商家消费二维码弹层展示
        showCustomerCodeLayout: false, // 消费码弹层
        showNetworkLayout: false, // 外卖订单流程弹窗
        currentOrder: {},
        orderSn: '', // 订单编号,

        orderLog: [], // 快递节点
        orderDetail: {},
        horseManLat: '',
        horseManLng: '',

        sendObj: {}, // 预计送达时间
        networkStateLog: [], // 外卖订单状态流程
        formPage: this.$router.params.formPage || '',
        // networkPendingTime: "10:00",
        timer: 10, // 倒计时
        merchantList: [], // 关联商品的门店列表
        fromPage: ''
      }
    }

    componentWillMount() {
    }

    componentDidMount() {
      const orderSn = this.$router.params.orderSn || ''
      const fromPage = this.$router.params.from
      if (orderSn) {
        this.setState({ orderSn, fromPage }, () => this.loadOrderDetail())
      }
    }

    // 加载订单信息数据
    loadOrderDetail = () => {
      const { orderSn } = this.state
      if (!orderSn) {
        showToast('订单编号未知')
        return
      }
      // showLoading()
      this.props.dispatch({
        type: 'order/getOrderDetailAction',
        payload: { orderSn },
        callback: ({ ok, data }) => {
          hideLoading()
          if (ok) {
            // console.log('data', data);
            this.setState({ orderDetail: { ...data } }, () => {
              if (data.orderType === ORDER_TYPE_NETWORK) {
                this.netWorkLoad()
              }
            }) // orderState: "DISTRIBUTION"
            if (data.orderType === ORDER_TYPE_DELIVERY && data.orderState !== 'PENDING' && data.orderState !== 'CANCELLED') {
              if (data.fastMailSn && data.fastMailCompanyCode) {
                this.loadOrderLog(data.fastMailSn, data.fastMailCompanyCode)
              } else {
                showToast('物流信息未知')
              }
            }
            if (data.orderType === ORDER_TYPE_STORE && data.orderState === 'PENDING') {
              const dishId = data.shopOrderProductInfoDTOS[0].productId
              this.props.dispatch({
                type: 'goodsDetail/getDishDetailAction',
                payload: { platformId: DEFAULT_PLAT_FORM_ID, dishId },
                callback: ({ ok, data }) => {
                  if (ok) {
                    this.setState({
                      merchantList: data.dishMerchantShippingInfo
                    })
                  }
                }
              })
            }
          }
        }
      })
    };

    // 外卖配送执行
    netWorkLoad = () => {
      const { orderDetail } = this.state
      const state = orderDetail.orderState
      if (state === 'PENDING' && !orderDetail.requestRefundsFlag) { // 外卖订单待接单倒计时
        const curTimer = new Date().getTime()
        const minusTime = (10 - (curTimer - orderDetail.addTime * 1000) / 1000 / 60).toFixed(1)
        // 计时结束
        if (minusTime <= 0) {
          this.autoCancelOrder(orderDetail)
        }
        this.setState({
          timer: minusTime - 0
        })
      }
      // 只有配送员取单中和配送中需要获取
      if (state === 'PERSON_PENDING' || state === 'TAKE_A_SINGLE' || state === 'DISTRIBUTION' || state === 'FINISH') {
        this.loadShippingInfo()
      }
    };

    // 获取外卖配送员信息
    loadShippingInfo = () => {
      const { orderDetail } = this.state
      this.props.dispatch({
        type: 'order/getMeiShippingAction',
        payload: { orderSn: orderDetail.orderSn },
        callback: ({ ok, headers, data }) => {
          // console.log(data);
          if (ok && objNotNull(data)) {
            this.setState({ sendObj: data }, () => {
              // 配送员取单中和配送中,需要获取坐标
              if (orderDetail.orderState === 'TAKE_A_SINGLE' || orderDetail.orderState === 'DISTRIBUTION') {
                this.loadShippingLocation()
                sendLocationInterval = setInterval(() => this.loadShippingLocation(), 10000)
              }
            })
          }
        }
      })
    };

    // 获取配送员坐标信息
    loadShippingLocation = () => {
      const { sendObj } = this.state
      this.props.dispatch({
        type: 'order/getRiderLocationAction',
        payload: { deliveryId: sendObj.deliveryId, meiTuanDeliveryId: sendObj.shippingId },
        callback: ({ ok, headers, data }) => {
          if (ok && objNotNull(data)) {
            this.setState({
              horseManLat: data.lat / 1000000,
              horseManLng: data.lng / 1000000
            })
          }
          // console.log(data);
        }
      })
    };

    // 加载订单物流信息
    loadOrderLog = (waybillNo, ems) => {
      this.props.dispatch({
        type: 'order/getOrderLogisticsAction',
        payload: { waybillNo, companyCode: ems },
        callback: ({ data, ok }) => {
          // console.log(data);
          if (data.code === 0 && data.data.length > 1 && data.data[0].data) {
            this.setState({
              orderLog: data.data[0].data || []
            })
          }
        }
      })
    };

    componentWillUnmount() {
      this.props.dispatch({
        type: 'order/clearOrderDetailAction'
      })
      clearInterval(sendLocationInterval)
      clearInterval(pendingTimeInterval)
    }

    componentDidShow() {
      this.mapCtx = wx.createMapContext('map') // map为地图的id
    }

    componentDidHide() {
    }

    // 拨打电话
    onClickCallPhone = phoneNumber => {
      callPhone(phoneNumber)
    };

    // 控制消费者二维码弹层
    useTicketModal = e => {
      e.stopPropagation()
      this.setState({ showQrcodeLayout: !this.state.showQrcodeLayout }, () => {
        const { showQrcodeLayout, orderDetail } = this.state
        if (showQrcodeLayout) {
          const { orderWriteOffCodeDTOS } = orderDetail
          const { windowWidth } = getSysInfo()
          const ratio = 750 / windowWidth
          // Taro.request({
          //   url: orderWriteOffCodeDTOS[0].codeUrl
          // }).then(res => {
          //   console.log('返回数据', res)
          // }).catch(res => {
          //   console.log('哈哈', res)
          // })
          // console.log(orderWriteOffCodeDTOS[0].writeOffCode)
          // console.log(HAPPYPLAY_URL + orderWriteOffCodeDTOS[0].writeOffCode)
          // return
          drawQrcode({
            width: 364 / ratio,
            height: 364 / ratio,
            canvasId: 'consumerCode',
            // text: HAPPYPLAY_URL + orderWriteOffCodeDTOS[0].writeOffCode
            text: orderWriteOffCodeDTOS[0].codeUrl
          })
        }
      })
    };

    // 消费码弹层
    allCodeModal = e => {
      e.stopPropagation()
      this.setState({ showCustomerCodeLayout: !this.state.showCustomerCodeLayout })
    };

    // 订单流程节点数据获取
    ctrlNetworkLayout = e => {
      e.stopPropagation()
      if (this.state.showNetworkLayout) {
        this.setState({ showNetworkLayout: !this.state.showNetworkLayout })
      } else {
        this.loadNetWorkStateLog()
      }
    };

    // 获取订单流程节点日志
    loadNetWorkStateLog = () => {
      const { orderDetail } = this.state
      showLoading()
      this.props.dispatch({
        type: 'order/getOrderStateLogAction',
        payload: { orderSn: orderDetail.orderSn },
        callback: ({ ok, data }) => {
          hideLoading()
          if (ok) {
            if (data.length > 0) {
              this.setState({
                networkStateLog: data.map(o => ({ ...o, msg: this.networkOrderProgress(o.orderState) })),
                showNetworkLayout: true
              })
            } else {
              showToast('订单流程数据不存在')
            }
          } else {
            showToast('流程节点获取失败')
          }
        }
      })
    };

    /** *****操作按钮****** */
    // 查看物流信息
    navigateToLogistics = item => {
      navToPage(`/pages/logisticsInfo/logisticsInfo?order=${encodeURIObj(item)}`)
    };

    // 确认收货
    confirmReceive = (item, e) => {
      Taro.showModal({ title: '是否确认商品已到达您的手中？' }).then(res => {
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
                navBackExeFun(data, 2, 'publicModifyOrder')
              }
            }
          })
        }
      })
    };

    // 复制到粘贴板
    copyOrderSn = text => {
      copyToClipboard(text)
    };

    /** *****外卖订单操作****** */
    // 取消订单
    bindCancelOrder = order => {
      if (this.state.formPage === 'orderList') { // 页面从订单列表跳转过来的,走订单里面的取消逻辑
        navBackExeFun({
          sendData: order,
          callback: ({ ok, data }) => {
            this.setState({ orderDetail: data })
          }
        }, 2, 'cancelOrder', true)
      } else { // 否则走自身的取消逻辑
        this._cancelOrder(order)
      }
    };

    // 倒计时自动取消订单
    autoCancelOrder = order => {
      if (this.state.formPage === 'orderList' && !order.requestRefundsFlag) { // 页面从订单列表跳转过来的,走订单里面的取消逻辑
        navBackExeFun({
          sendData: order,
          callback: ({ ok, data }) => {
            this.setState({ orderDetail: data })
          }
        }, 2, 'autoCancelOrder', true)
      } else { // 否则走自身的取消逻辑
        this._autoCancelOrder(order)
      }
    };

    // 商家未接单取消订单
    _autoCancelOrder = item => {
      this._commonDispatch(item, ACTION_CANCEL_ORDER, ({ ok, data }) => {
        if (ok) {
          showToast('取消中,等待商家确认退款')
          this.setState({ orderDetail: data })
        } else {
          showToast('取消失败')
        }
      })
    };

    // 取消订单
    _cancelOrder = item => {
      Taro.showModal({
        content: '确定要取消订单吗?',
        cancelText: '否',
        confirmText: '是',
        confirmColor: '#ccc'
      }).then(res => {
        if (res.confirm) {
          this._commonDispatch(item, ACTION_CANCEL_ORDER, ({ ok, data }) => {
            if (ok) {
              showToast('取消中,等待商家确认')
              this.setState({ orderDetail: data })
            } else {
              showToast('取消失败')
            }
          })
        }
      })
    };

    // 公用发送dispatch方法
    _commonDispatch = (payload, type, callback) => {
      this.props.dispatch({
        type,
        payload: { currentTabKey: undefined, param: payload },
        callback: res => {
          isFunction(callback) && callback(res)
        }
      })
    };

    // 催单操作
    bindRemindOrder = order => {
      // navBackExeFun(order, 2, "reminderOrder", true);

      if (!order.id) {
        showToast('订单id未知')
        return
      }
      showLoading('正在为您催单，请耐心等候', true)
      this._commonDispatch({ id: order.id }, ACTION_REMINDER_ORDER, ({ ok, data }) => {
        hideLoading()
        if (ok) {
          showToast('催单成功')
        } else {
          showToast('催单失败')
        }
      })
    };

    // 外卖订单流程展示
    networkOrderProgress = orderState => {
      const allStateMsg = {
        PENDING: '订单已支付',
        COOKING: '商家出餐中',
        PERSON_PENDING: '骑手待接单',
        TAKE_A_SINGLE: '骑手取单中',
        DISTRIBUTION: '骑手配送中',
        FINISH: '订单已送达'
      }
      return allStateMsg[orderState]
    };

    /** *****外卖订单地图控制****** */
    // 设置地图的marker
    getMapMarks = order => {
      const shopOrderExtendedInfoDTO = order.shopOrderExtendedInfoDTO || {}
      if (!objNotNull(shopOrderExtendedInfoDTO)) {
        return []
      }
      let merchantLocations = [] // 商户坐标
      if (!shopOrderExtendedInfoDTO.merchantCoordinate || shopOrderExtendedInfoDTO.merchantCoordinate.length === 0) {
        return []
      }
      merchantLocations = shopOrderExtendedInfoDTO.merchantCoordinate.split(',')
      if (merchantLocations.length <= 0) {
        return []
      }

      // marker上的label公用配置
      const labelCommon = {
        color: '#333',
        fontSize: 12,
        borderRadius: '100px',
        padding: '5px',
        textAlign: 'center',
        bgColor: '#fff'
      }
      if (order.orderState === 'PENDING' || order.orderState === 'COOKING' || order.orderState === 'PERSON_PENDING') {
        return [{
          iconPath: `${STATIC_IMG_URL}/icon/icon_location_merchant.png`,
          id: 0,
          latitude: Number(merchantLocations[1]), // 23.099994,
          longitude: Number(merchantLocations[0]),
          width: 42,
          height: 50,
          label: {
            content: order.orderState === 'PENDING' ? '商家待接单' : order.orderState === 'COOKING' ? '商家备餐中' : order.orderState === 'PERSON_PENDING' ? '骑手待接单' : '',
            anchorX: '-40px',
            anchorY: '-80px',
            ...labelCommon
          }
        }]
      } if (order.orderState === 'TAKE_A_SINGLE') { // 骑手取单中
        return [{
          iconPath: `${STATIC_IMG_URL}/icon/icon_location_merchant.png`,
          id: 0,
          latitude: Number(merchantLocations[1]), // 23.099994,
          longitude: Number(merchantLocations[0]),
          width: 42,
          height: 50,
          label: {
            content: '等待骑手中',
            anchorX: '-40px',
            anchorY: '-80px',
            ...labelCommon
          }
        }, {
          iconPath: riderIcon,
          id: 1,
          latitude: this.state.horseManLat, // 23.099994,
          longitude: this.state.horseManLat,
          width: 34,
          height: 43
          /*  label: {
                      content: "骑手取单中",
                      anchorX: "-32px",
                      anchorY: "-70px",
                      ...labelCommon
                  } */
        }]
      } if (order.orderState === 'DISTRIBUTION') { // 配送中
        let userLocations = []// 用户坐标
        if (shopOrderExtendedInfoDTO.customerCoordinate && shopOrderExtendedInfoDTO.customerCoordinate.length > 0) {
          userLocations = shopOrderExtendedInfoDTO.customerCoordinate.split(',')
        }

        // 骑手的Mark
        let sendMarks = [{
          iconPath: riderIcon,
          id: 1,
          latitude: this.state.horseManLat, // 23.099994,
          longitude: this.state.horseManLng,
          width: 34,
          height: 43
          /* label: {
                    content: "配送中",
                    anchorX: "-32px",
                    anchorY: "-70px",
                    ...labelCommon
                } */
        }]
        if (userLocations.length > 0) { // 用户坐标存在
          sendMarks = [
            ...sendMarks,
            {
              iconPath: require('../../images/icons/icon_location_user.png'),
              id: 0,
              latitude: Number(userLocations[1]),
              longitude: Number(userLocations[0]),
              width: 34,
              height: 43
              /* label: {
                            content: "等待骑手中",
                            anchorX: "-40px",
                            anchorY: "-80px",
                            ...labelCommon
                        } */
            }
          ]
        }
        return sendMarks
      }
    };

    includePointsFn = (Point1, Point2) => {
      // 缩放视野展示所有经纬度(小程序API提供)
      this.mapCtx.includePoints({
        padding: [80, 50, 80, 50],
        points: [Point1, Point2]
      })
    };

    // 返回需要地图缩放包含多个点的坐标
    getIncludePoints = order => {
      const shopOrderExtendedInfoDTO = order.shopOrderExtendedInfoDTO || {}
      if (!objNotNull(shopOrderExtendedInfoDTO)) {
        return []
      }
      let merchantLocations = [] // 商户左边
      if (!shopOrderExtendedInfoDTO.merchantCoordinate || shopOrderExtendedInfoDTO.merchantCoordinate.length === 0) {
        return []
      }
      merchantLocations = shopOrderExtendedInfoDTO.merchantCoordinate.split(',')
      if (merchantLocations.length <= 0) {
        return []
      }
      if (order.orderState === 'TAKE_A_SINGLE') {
        return [{
          latitude: 30.65552,
          longitude: 104.077758
        }, {
          latitude: Number(merchantLocations[1]),
          longitude: Number(merchantLocations[0])
        }]
      }
    };

    // 获取地图中心点位置坐标
    getMapCenter = order => {
      const shopOrderExtendedInfoDTO = order.shopOrderExtendedInfoDTO || {}
      if (!objNotNull(shopOrderExtendedInfoDTO)) {
        return [this.state.horseManLng, this.state.horseManLat]
      }
      let merchantLocations = [] // 商户坐标
      if (!shopOrderExtendedInfoDTO.merchantCoordinate || shopOrderExtendedInfoDTO.merchantCoordinate.length === 0) {
        return [this.state.horseManLng, this.state.horseManLat]
      }
      merchantLocations = shopOrderExtendedInfoDTO.merchantCoordinate.split(',')
      if (merchantLocations.length <= 0) {
        return [this.state.horseManLng, this.state.horseManLat]
      }
      // || order.orderState === "TAKE_A_SINGLE"
      if (order.orderState === 'PENDING' || order.orderState === 'COOKING' || order.orderState === 'PERSON_PENDING' || order.orderState === 'TAKE_A_SINGLE') { // 还没获取骑手坐标之前,定位到门店坐标视图
        return [Number(merchantLocations[0]), Number(merchantLocations[1])]
      }
      return [this.state.horseManLng, this.state.horseManLat]
    };

    render() {
      const {
        showQrcodeLayout,
        showCustomerCodeLayout,
        orderLog,
        orderDetail,
        showNetworkLayout,
        sendObj,
        networkStateLog,
        merchantList,
        fromPage
      } = this.state

      const {
        // orderDetail = {},
        ajaxLoading = {}
      } = this.props
      // const orderDetail = {orderState:"COOKING",...this.state.orderDetail};

      if (objNotNull(ajaxLoading) && ajaxLoading.effects['order/getOrderListAction']) {
        return (
          <View className="nodata">加载中....</View>
        )
      }

      /* if (objNotNull(ajaxLoading) && !ajaxLoading.effects["order/getOrderListAction"] && !objNotNull(orderDetail)) {
             return (
                 <View className="nodata">暂无数据</View>
             );
         } */
      const shopOrderProductInfoDTOS = orderDetail.shopOrderProductInfoDTOS && orderDetail.shopOrderProductInfoDTOS.length > 0 && orderDetail.shopOrderProductInfoDTOS[0] || {}
      const shopOrderExtendedInfoDTO = orderDetail.shopOrderExtendedInfoDTO || {}

      const allCode = orderDetail.orderWriteOffCodeDTOS && orderDetail.orderWriteOffCodeDTOS.length > 0 && orderDetail.orderWriteOffCodeDTOS || []
      // console.log('code', allCode)
      let usableCodes = [] // 可用的消费码
      let usedCodes = []// 已使用的消费码
      if (allCode.length > 0) {
        usableCodes = allCode.filter(o => !o.useState)
        usedCodes = allCode.filter(o => o.useState)
      }
      /* console.log(usableCodes);
         console.log(usedCodes); */
      /* let merchantLocations = [];
        if (orderDetail.orderType === "NETWORK" && objNotNull(shopOrderExtendedInfoDTO)) {
            merchantLocations = shopOrderExtendedInfoDTO.merchantCoordinate.split(",");
        } */
      let lng; let
        lat
      if (shopOrderExtendedInfoDTO.merchantCoordinate) {
        const location = shopOrderExtendedInfoDTO.merchantCoordinate.split(',')
        lng = location[0]
        lat = location[1]
      }
      const { longitude, latitude } = getUserLocation()
      return (
        <Block>
          {
                    objNotNull(orderDetail)
                      ? (
                        <View
                          className="order-detail-wrap"
                          scrollY
                        >
                          {
                            // 外卖到家订单
                            (orderDetail.orderType === ORDER_TYPE_NETWORK && orderDetail.orderState !== 'CANCELLED' && (!orderDetail.requestRefunds || (orderDetail.requestRefunds && orderDetail.requestRefundsFlag === false)))
                              ? (
                                <Block>
                                  {
                                        orderDetail.orderState === 'FINISH' ? (
                                          <View className="network-finish-wrap">
                                            <View
                                              className="flex-row flex-jc flex-ac mb-gap"
                                              onClick={this.ctrlNetworkLayout.bind(this)}
                                            >
                                              <Text className="state-name">订单已经完成</Text>
                                              <Image
                                                src={`${STATIC_IMG_URL}/icon/icon_arrow.png`}
                                                className="state-link"
                                              />
                                            </View>
                                            <View className="state-msg mb-gap">感谢您对赚餐平台的信任，期待再次光临</View>
                                            <View className="flex-row flex-ac flex-sb state-finish-wrap">
                                              <View className="flex-row flex-ac flex1">
                                                <Image
                                                  src={require('../../../images/icon/icon_horseman_avator.png')}
                                                  className="person-avatar"
                                                />
                                                <View>
                                                  <View
                                                    className="flex-row flex-ac mei-name-wrap"
                                                  >
                                                    <View
                                                      className="person-name"
                                                    >
                                                      {sendObj.courierName || '--'}
                                                    </View>
                                                    <View
                                                      className="mei-tag"
                                                    >
                                                      美团专送
                                                    </View>
                                                  </View>
                                                  {/* <View className="flex-row flex-ac">
                                                                <Image
                                                                    src={require("../../images/icons/icon_star.png")}
                                                                    className="person-star"
                                                                />
                                                                <Image
                                                                    src={require("../../images/icons/icon_star.png")}
                                                                    className="person-star"
                                                                />
                                                                <Image
                                                                    src={require("../../images/icons/icon_star.png")}
                                                                    className="person-star"
                                                                />
                                                                <Image
                                                                    src={require("../../images/icons/icon_star.png")}
                                                                    className="person-star"
                                                                />
                                                                <Image
                                                                    src={require("../../images/icons/icon_star.png")}
                                                                    className="person-star"
                                                                />
                                                                <View className="person-star-num">4.9分</View>
                                                            </View> */}
                                                </View>
                                              </View>
                                              <Image
                                                src={require('../../images/icons/icon_phone_gray.png')}
                                                className="person-phone"
                                                onClick={() => {
                                                  callPhone(sendObj.courierPhone)
                                                }}
                                              />
                                            </View>
                                          </View>
                                        )
                                          : (
                                            <Block>
                                              <View className="network-map-wrap">
                                                <Map
                                                  id="map"
                                                  longitude={this.getMapCenter(orderDetail)[0]}
                                                  latitude={this.getMapCenter(orderDetail)[1]}
                                                  scale="16"
                                                  markers={this.getMapMarks(orderDetail)}
                                                  show-location
                                                        // include-points={this.getIncludePoints(orderDetail)}
                                                        /* controls={{controls}}
                                                         bindcontroltap="controltap"
                                                         markers="{{markers}}"
                                                         bindmarkertap="markertap"
                                                         polyline="{{polyline}}"
                                                         bindregionchange="regionchange"
                                                         show-location */
                                                  style="width: 100%; height: 100%;"
                                                />
                                              </View>
                                              <View className="network-state-wrap">
                                                <View className="network-state-inwrap">
                                                  {/* 倒计时 */}
                                                  <CoverView
                                                    className="flex-row flex-jc flex-ac mb-gap"
                                                    onClick={this.ctrlNetworkLayout.bind(this)}
                                                  >
                                                    <CoverView className="state-name">
                                                      {orderDetail.orderState === 'PENDING' ? '待接单' : null}
                                                      {orderDetail.orderState === 'COOKING' ? '商家已接单' : null}
                                                      {orderDetail.orderState === 'PERSON_PENDING' ? '配送员待接单' : null}
                                                      {orderDetail.orderState === 'TAKE_A_SINGLE' ? '骑手正在赶往商家' : null}
                                                      {orderDetail.orderState === 'DISTRIBUTION' ? '骑手正在送货' : null}
                                                    </CoverView>
                                                    <CoverImage
                                                      src={`${STATIC_IMG_URL}/icon/icon_arrow.png`}
                                                      className="state-link"
                                                    />
                                                  </CoverView>
                                                  {
                                                            orderDetail.orderState === 'PENDING' && (
                                                            <CoverView
                                                              className="state-msg mb-gap"
                                                            >
                                                              10分钟内商家未接单，将自动取消
                                                            </CoverView>
                                                            )}
                                                  <View className="flex-row flex-ac flex-jc mb-gap">
                                                    <CoverImage
                                                      src={`${STATIC_IMG_URL}/icon/icon_time.png`}
                                                      className="state-time-icon"
                                                    />
                                                    <CoverView className="state-msg">
                                                      {orderDetail.orderState === 'PENDING' ? '剩余时间：' : '预计送达时间：'}
                                                    </CoverView>
                                                    {/* <Button className="state-time">
                                                                <CoverView>
                                                                    {
                                                                        orderDetail.orderState === "PENDING" ? 10 :
                                                                            orderDetail.orderState === "COOKING" ? shopOrderExtendedInfoDTO.orderSend :
                                                                                sendObj.expectedDeliveryTime && dateFormat(sendObj.expectedDeliveryTime, "hh:mm") || ""
                                                                    }
                                                                </CoverView>
                                                            </Button> */}
                                                    <View
                                                      className="state-time"
                                                    >
                                                      {
                                                                    orderDetail.orderState === 'PENDING' ? (
                                                                      <AtCountdown
                                                                        format={{ hours: ':', minutes: ':', seconds: '' }}
                                                                        minutes={this.state.timer}
                                                                        onTimeUp={() => {
                                                                          console.log('yes')
                                                                          this.autoCancelOrder(orderDetail)
                                                                        }}
                                                                      />
                                                                    )
                                                                      : orderDetail.orderState === 'COOKING' ? shopOrderExtendedInfoDTO.orderSend
                                                                        : sendObj.expectedDeliveryTime && dateFormat(sendObj.expectedDeliveryTime, 'hh:mm') || ''
                                                                }
                                                    </View>
                                                    <CoverView />
                                                  </View>
                                                  {
                                                            (orderDetail.orderState === 'PENDING' || orderDetail.orderState === 'COOKING' || orderDetail.orderState === 'PERSON_PENDING')
                                                              ? (
                                                                <CoverView className="flex-row flex-jc state-btn-wrap">
                                                                  {
                                                                        (orderDetail.orderState === 'PENDING' || orderDetail.orderState === 'COOKING')
                                                                          ? (
                                                                            <CoverView
                                                                              className="network-order-btn"
                                                                              hoverClass="hover"
                                                                              hoverStayTime={100}
                                                                              loading={ajaxLoading.effects[ACTION_CANCEL_ORDER]}
                                                                              disabled={ajaxLoading.effects[ACTION_CANCEL_ORDER]}
                                                                              onClick={this.bindCancelOrder.bind(this, orderDetail)}
                                                                            >
                                                                                取消订单
                                                                            </CoverView>
                                                                          )
                                                                          : null
                                                                    }
                                                                  {
                                                                        (orderDetail.orderState === 'PENDING' || orderDetail.orderState === 'PERSON_PENDING')
                                                                          ? (
                                                                            <CoverView
                                                                              className="network-order-btn"
                                                                              hoverClass="hover"
                                                                              hoverStayTime={100}
                                                                                // loading={currentItem.id === o.id && ajaxLoading.effects[ACTION_REMINDER_ORDER]}
                                                                                // disabled={currentItem.id === o.id && ajaxLoading.effects[ACTION_REMINDER_ORDER]}
                                                                              onClick={this.bindRemindOrder.bind(this, orderDetail)}
                                                                            >
                                                                                催单
                                                                            </CoverView>
                                                                          )
                                                                          : null
                                                                    }
                                                                </CoverView>
                                                              )
                                                              : (
                                                                <Block>
                                                                  <CoverImage
                                                                    className="person-line"
                                                                    src={require('../../images/icons/icon_dashed.png')}
                                                                  />
                                                                  <CoverView
                                                                    className="flex-row flex-ac flex-sb state-person-wrap"
                                                                  >
                                                                    <CoverView className="flex-row flex-ac flex1">
                                                                      <CoverImage
                                                                        src={require('../../../images/icon/icon_horseman_avator.png')}
                                                                        className="person-avatar"
                                                                      />
                                                                      <CoverView>
                                                                        <CoverView
                                                                          className="flex-row flex-ac mei-name-wrap"
                                                                        >
                                                                          <CoverView
                                                                            className="person-name"
                                                                          >
                                                                            {sendObj.courierName || '--'}
                                                                          </CoverView>
                                                                          <CoverView
                                                                            className="mei-tag"
                                                                          >
                                                                            美团专送
                                                                          </CoverView>
                                                                        </CoverView>
                                                                        {/* <CoverView className="flex-row flex-ac hide">
                                                                                    <CoverImage
                                                                                        src={require("../../images/icons/icon_star.png")}
                                                                                        className="person-star"
                                                                                    />
                                                                                    <CoverImage
                                                                                        src={require("../../images/icons/icon_star.png")}
                                                                                        className="person-star"
                                                                                    />
                                                                                    <CoverImage
                                                                                        src={require("../../images/icons/icon_star.png")}
                                                                                        className="person-star"
                                                                                    />
                                                                                    <CoverImage
                                                                                        src={require("../../images/icons/icon_star.png")}
                                                                                        className="person-star"
                                                                                    />
                                                                                    <CoverImage
                                                                                        src={require("../../images/icons/icon_star.png")}
                                                                                        className="person-star"
                                                                                    />
                                                                                    <CoverView
                                                                                        className="person-star-num">4.9分</CoverView>
                                                                                </CoverView> */}
                                                                      </CoverView>
                                                                    </CoverView>
                                                                    <CoverImage
                                                                      src={require('../../images/icons/icon_phone_gray.png')}
                                                                      className="person-phone"
                                                                      onClick={() => {
                                                                        callPhone(sendObj.courierPhone)
                                                                        // showToast("点击了");
                                                                      }}
                                                                    />
                                                                  </CoverView>
                                                                </Block>
                                                              )
                                                        }

                                                  {orderDetail.requestRefunds && (
                                                  <CoverView className="flex-row flex-ac flex-jc mb-gap">
                                                    <CoverView
                                                      className="state-time"
                                                    >
                                                      {!orderDetail.merchantRefunds ? `无法取消：${orderDetail.merchantRefundsReason}` : ''}
                                                    </CoverView>
                                                    <CoverView />
                                                  </CoverView>
                                                  )}

                                                  <CoverView className="dot-dash left" />
                                                  <CoverView className="dot-dash right" />
                                                </View>
                                              </View>
                                            </Block>
                                          )
                                    }
                                </Block>
                              )
                              : (
                                <Block>
                                  {/* 头部--配送中 */}
                                  <View className="flex-row flex-jc detail-header">
                                    {
                                            orderDetail.orderType === ORDER_TYPE_DELIVERY && orderDetail.payState === 'PAYED'
                                              ? orderDetail.orderState === 'PENDING' ? (
                                                <Block>
                                                  <View className="item payed">已付款</View>
                                                  <View className="item unship active">待发货</View>
                                                </Block>
                                              ) : orderDetail.orderState === 'COOKING' ? (
                                                <Block>
                                                  <View className="item payed">已付款</View>
                                                  <View className="item unship">待发货</View>
                                                  <View className="item unship active">已发货</View>
                                                </Block>
                                              ) : orderDetail.orderState === 'FINISH' ? (
                                                <Block>
                                                  <View className="item payed">已付款</View>
                                                  <View className="item unship">待发货</View>
                                                  <View className="item unship">已发货</View>
                                                  <View className="item finish active">已完成</View>
                                                </Block>
                                              ) : null
                                              : orderDetail.orderType === ORDER_TYPE_STORE && orderDetail.payState === 'PAYED'
                                                ? orderDetail.orderState === 'PENDING' ? orderDetail.expired
                                                  ? (
                                                    <Block>
                                                      <View className="item payed">已付款</View>
                                                      <View className="item unship">待使用</View>
                                                      <View className="item timeout active">已过期</View>
                                                    </Block>
                                                  )
                                                  : (
                                                    <Block>
                                                      <View className="item payed">已付款</View>
                                                      <View className="item unship active">待使用</View>
                                                    </Block>
                                                  )
                                                  : orderDetail.orderState === 'FINISH' ? (
                                                    <Block>
                                                      <View className="item payed">已付款</View>
                                                      <View className="item unused">待使用</View>
                                                      <View className="item used active">已使用</View>
                                                    </Block>
                                                  )
                                                    : null
                                                : orderDetail.orderType === ORDER_TYPE_NETWORK && orderDetail.payState === 'PAYED'
                                                  ? orderDetail.orderState === 'CANCELLED' || orderDetail.requestRefunds
                                                    ? (
                                                      <Block>
                                                        <View className="item payed">已付款</View>
                                                        <View className="item pending">待接单</View>
                                                        <View className="item receive">已接单</View>
                                                        <View className="item cancel active">取消订单</View>
                                                      </Block>
                                                    )
                                                    : null
                                                  : <View className="nodata">订单类型未知</View>
                                        }
                                  </View>

                                  {/* 物流和消费者信息 */}
                                  <View className="customer-info">
                                    {
                                            orderDetail.orderType === ORDER_TYPE_DELIVERY
                                              ? (
                                                <Block>
                                                  {/* 快递节点(配送中) */}
                                                  {
                                                        orderDetail.orderState === 'PENDING' ? (
                                                          <View className="flex-row item">
                                                            <View className="info-icon shipping" />
                                                            <View className="flex-row flex-ac shipping-wrap">
                                                              <View
                                                                className="mulBreak shipping-node"
                                                              >
                                                                商家正在为您全力备货中...
                                                              </View>
                                                              {/* <View className="time">2019-01-04 22:42:42</View> */}
                                                            </View>
                                                          </View>
                                                        ) : orderLog.length > 0
                                                            && (
                                                            <View
                                                              className="flex-row flex-sb item"
                                                              onClick={this.navigateToLogistics.bind(this, orderDetail)}
                                                            >
                                                              <View className="info-icon shipping" />
                                                              <View className="flex1 shipping-wrap">
                                                                <View className="flex-row flex-sb flex-ac">
                                                                  <View
                                                                    className="mulBreak shipping-node"
                                                                  >
                                                                    {orderLog[0].context || '快递节点未知'}
                                                                  </View>
                                                                  <View className="icon icon-arrow-right arrow" />
                                                                </View>
                                                                <View
                                                                  className="time"
                                                                >
                                                                  {orderLog[0].time || '时间未知'}
                                                                </View>
                                                              </View>
                                                            </View>
                                                            )
                                                        // : orderDetail.orderState === "FINISH" ?
                                                        /* <View className="flex-row flex-sb item">
                                                            <View className="info-icon shipping"/>
                                                            <View className="flex1 shipping-wrap">
                                                                <View className="flex-row flex-sb flex-ac">
                                                                    <View
                                                                        className="mulBreak shipping-node">您已收货</View>
                                                                    <View className="icon icon-arrow-right arrow"/>
                                                                </View>
                                                                <View className="time">2019-01-04 22:42:42</View>
                                                            </View>
                                                        </View> */

                                                    }
                                                  {/* 用户地址(外卖配送) */}
                                                  {
                                                    shopOrderExtendedInfoDTO.customerName && shopOrderExtendedInfoDTO.customerPhone && (
                                                      <View className="flex-row flex-ac flex-sb item">
                                                        <View className="info-icon location" />
                                                        <View className="flex1">
                                                          <View
                                                            className="title"
                                                          >
                                                            {`${shopOrderExtendedInfoDTO.customerName || '姓名未知'}  ${shopOrderExtendedInfoDTO.customerPhone || '号码未知'}`}
                                                          </View>
                                                          {
                                                            shopOrderExtendedInfoDTO.customerAddress && (
                                                              <View
                                                                className="mulBreak sub-title"
                                                              >
                                                                {shopOrderExtendedInfoDTO.customerAddress || '地址未知'}
                                                              </View>
                                                            )
                                                          }
                                                          
                                                        </View>
                                                      </View>
                                                    )
                                                  }
                                                  
                                                </Block>
                                              )
                                              : orderDetail.orderType === ORDER_TYPE_STORE
                                                ? (
                                                  <Block>
                                                    {/* 用户信息(门店使用) */}
                                                    {
                                                      shopOrderExtendedInfoDTO.customerName && shopOrderExtendedInfoDTO.customerPhone && (
                                                        <View className="flex-row flex-ac flex-sb item">
                                                          <View className="info-icon user" />
                                                          <View className="flex1">
                                                            <View
                                                              className="title"
                                                            >
                                                              {`${shopOrderExtendedInfoDTO.customerName}（${shopOrderExtendedInfoDTO.customerGender === 'WOMEN' ? '女士' : '先生'}）`}
                                                            </View>
                                                            <View
                                                              className="sub-title"
                                                            >
                                                              {shopOrderExtendedInfoDTO.customerPhone || '号码未知'}
                                                            </View>
                                                          </View>
                                                        </View>
                                                      )
                                                    }
                                                    
                                                    {/* 优惠券信息(门店使用) */}
                                                    {
                                                        allCode.length > 0
                                                        && (
                                                        <View className="flex-row flex-ac flex-sb item">
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
                                                                  : usableCodes.length > 0 ? orderDetail.expired
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
                                                                          {dateFormatWithDate(orderDetail.useEndTime)}
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
                                                                                      <Text className="more-code">∨</Text>
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
                                                                              {dateFormatWithDate(orderDetail.useStartTime, 'yyyy-MM-dd')}
                                                                                    至
                                                                              {dateFormatWithDate(orderDetail.useEndTime, 'yyyy-MM-dd')}
                                                                            </Text>
                                                                          </View>
                                                                        </View>
                                                                      </Block>
                                                                    )
                                                                    : null
                                                            }
                                                          {
                                                            (orderDetail.orderState === 'PENDING' || orderDetail.orderState === 'COOKING' && !orderDetail.expired)
                                                                && (
                                                                  <View 
                                                                    className="qrcodeBox flex-row flex-jc flex-ac"
                                                                    onClick={this.useTicketModal.bind(this)}
                                                                  >
                                                                    <Image
                                                                      src={require('../../images/demo/test_qrcode.png')}
                                                                      className="qrcode"
                                                                    />
                                                                  </View>
                                                                )
                                                            }
                                                        </View>
                                                        )
                                                    }
                                                  </Block>
                                                )
                                                : orderDetail.orderType === ORDER_TYPE_NETWORK
                                                  ? (
                                                    <Block>
                                                      {
                                                            orderDetail.orderState === 'CANCELLED' && orderDetail.requestRefunds
                                                              ? orderDetail.whoRefunds === 1
                                                                ? orderDetail.merchantRefunds
                                                                  ? (
                                                                    <View className="network-cancel-wrap">
                                                                      <View className="cancel-title">您取消了订单</View>
                                                                      <View
                                                                        className="cancel-msg"
                                                                      >
                                                                      您支付的款项将会在1-7个工作日内返回您的原支付渠道
                                                                      </View>
                                                                      <View
                                                                        className="flex-row flex-sb cancel-footer"
                                                                      >
                                                                        <Text>退款进度</Text>
                                                                        <Text className="yellow">已退款</Text>
                                                                      </View>
                                                                    </View>
                                                                  )
                                                                  : null
                                                                : orderDetail.merchantRefunds
                                                                  ? (
                                                                    <View className="network-cancel-wrap">
                                                                      <View className="cancel-title">商家取消了订单</View>
                                                                      <View
                                                                        className="cancel-msg"
                                                                      >
                                                                        取消原因：
                                                                        {orderDetail.merchantRefundsReason || ''}
                                                                      </View>
                                                                      <View
                                                                        className="cancel-msg"
                                                                      >
                                                                        您支付的款项将会在1-7个工作日内返回您的原支付渠道
                                                                      </View>
                                                                      <View className="flex-row flex-sb cancel-footer">
                                                                        <Text>退款进度</Text>
                                                                        <Text className="yellow">已退款</Text>
                                                                      </View>
                                                                    </View>
                                                                  )
                                                                  : null
                                                              : orderDetail.orderState === 'PENDING' && orderDetail.requestRefunds
                                                                ? (
                                                                  <View className="network-cancel-wrap">
                                                                    <View className="cancel-title">您取消了订单</View>
                                                                    <View
                                                                      className="cancel-msg"
                                                                    >
                                                                      正在等待商家确认，请耐心等待
                                                                    </View>
                                                                    <View
                                                                      className="flex-row flex-sb cancel-footer"
                                                                    >
                                                                      <Text>退款进度</Text>
                                                                      <Text className="yellow">退款中</Text>
                                                                    </View>
                                                                  </View>
                                                                )
                                                                : null
                                                        }
                                                      {/* { */}
                                                      {/* //商户取消的订单 */}
                                                      {/* orderDetail.orderState === "CANCELLED" && orderDetail.requestRefunds ? */}
                                                      {/* <View className="network-cancel-wrap"> */}
                                                      {/* <View className="cancel-title">商家取消了订单</View> */}
                                                      {/* <View */}
                                                      {/* className="cancel-msg">取消原因：{orderDetail.merchantRefundsReason || ""}</View> */}
                                                      {/* <View */}
                                                      {/* className="cancel-msg">您支付的款项将会在1-7个工作日内返回您的原支付渠道</View> */}
                                                      {/* <View className="flex-row flex-sb cancel-footer"> */}
                                                      {/* <Text>退款进度</Text> */}
                                                      {/* <Text className="yellow">已退款</Text> */}
                                                      {/* </View> */}
                                                      {/* </View> */}
                                                      {/* : */}
                                                      {/* orderDetail.requestRefunds ? //用户发起的取消订单 */}
                                                      {/* orderDetail.merchantRefunds ? */}
                                                      {/* <View className="network-cancel-wrap"> */}
                                                      {/* <View className="cancel-title">您取消了订单</View> */}
                                                      {/* <View */}
                                                      {/* className="cancel-msg">您支付的款项将会在1-7个工作日内返回您的原支付渠道</View> */}
                                                      {/* <View */}
                                                      {/* className="flex-row flex-sb cancel-footer"> */}
                                                      {/* <Text>退款进度</Text> */}
                                                      {/* <Text className="yellow">已退款</Text> */}
                                                      {/* </View> */}
                                                      {/* </View> */}
                                                      {/* : */}
                                                      {/* <View className="network-cancel-wrap"> */}
                                                      {/* <View className="cancel-title">您取消了订单</View> */}
                                                      {/* <View */}
                                                      {/* className="cancel-msg">正在等待商家确认，请耐心等待</View> */}
                                                      {/* /!*<View */}
                                                      {/* className="flex-row flex-sb cancel-footer"> */}
                                                      {/* <Text>退款进度</Text> */}
                                                      {/* <Text className="yellow">退款中</Text> */}
                                                      {/* </View>*!/ */}
                                                      {/* </View> */}
                                                      {/* : null */}

                                                      {/* } */}
                                                    </Block>
                                                  )
                                                  : <View className="nodata">订单类型未知</View>
                                        }
                                  </View>
                                  <View className="border-bag" />
                                </Block>
                              )
                        }

                          {/* 商家信息(门店使用显示) */}
                          {
                            orderDetail.orderType === ORDER_TYPE_STORE
                            && (
                            <View className="merchant-info-wrap">
                              <View className="title">商家信息</View>
                              <View className="flex-row flex-sb flex-ac merchant-address">
                                <View
                                  className="flex1"
                                  onClick={() => {
                                    const positions = shopOrderExtendedInfoDTO.merchantCoordinate.split(',')
                                    wx.openLocation({
                                      latitude: Number(positions[1]),
                                      longitude: Number(positions[0]),
                                      name: shopOrderExtendedInfoDTO.merchantAddress,
                                      address: shopOrderExtendedInfoDTO.merchantName,
                                      scale: 28,
                                      success: () => {

                                      },
                                      fail: error => {
                                        console.log(error)
                                      }
                                    })
                                  }}
                                >
                                  <View className="name ellipsis flex-row flex-sb">
                                    <Text>{shopOrderExtendedInfoDTO.merchantName || '未知商家名'}</Text>
                                    {
                                                orderDetail.orderType === ORDER_TYPE_STORE && orderDetail.orderState === 'PENDING' && (
                                                <Text
                                                  className="merchantList"
                                                  onClick={e => {
                                                    e.stopPropagation()
                                                    navToPage(`/package/multiStore/merchantList/merchantList?merchantList=${JSON.stringify(merchantList)}`, false)
                                                  }}
                                                >
                                                  {merchantList.length}
                                                  家适用门店
                                                </Text>
                                                )}
                                  </View>
                                  {
                                    shopOrderExtendedInfoDTO.merchantAddress && (
                                      <View className="flex-row flex-ac address">
                                        <Text className="location" />
                                        <Text style={{ marginRight: '10px' }}>
                                          {shopOrderExtendedInfoDTO.merchantCoordinate && calculateDistanceByCoordinate(latitude, lat, longitude, lng)}
                                          km
                                        </Text>
                                        <Text
                                          className="flex1 ellipsis detail"
                                        >
                                          {shopOrderExtendedInfoDTO.merchantAddress || '地址未知'}
                                        </Text>
                                      </View>
                                    )
                                  }
                                  
                                </View>
                                <View className="line" />
                                <View
                                  className="phone-call"
                                  onClick={e => {
                                    e.stopPropagation()
                                    this.onClickCallPhone(shopOrderExtendedInfoDTO.merchantPhone)
                                  }}
                                />
                              </View>
                            </View>
                            )
                        }

                          {/* 订单商品详情 */}
                          <View className="order-goods">
                            <View className="merchantName">{orderDetail.shopOrderExtendedInfoDTO.merchantName}</View>
                            <View
                              className="flex-row flex-ac header"
                              onClick={() => {
                                if (!orderDetail.partnerLevelId) { // 购买合伙人升级的套餐不能跳转
                                  navToPage(`/pages/goodsDetails/goodsDetails?dishId=${shopOrderProductInfoDTOS.productId}&platFormId=${orderDetail.platformId}&merchantId=${orderDetail.merchantId}`)
                                }
                              }}
                            >
                              <Image
                                src={
                                    shopOrderProductInfoDTOS.imageUrl ? getServerPic(shopOrderProductInfoDTOS.imageUrl)
                                      : require('../../images/demo/test_dish.png')
                                }
                                className="dish-img"
                              />
                              <View className="flex-col flex-sb flex1 right">
                                <View
                                  className="mulBreak name"
                                >
                                  {shopOrderProductInfoDTOS.productName || '未知商品名'}
                                </View>
                                <View className="flex-row flex-sb price-wrap flex-ae">
                                  <View>
                                    <Text className="rmb">¥</Text>
                                    <Text
                                      className="money"
                                    >
                                      {formatCurrency(fromPage === 'dine' ? (orderDetail.thirdPartyType === 'LOCAL_TAO_QUAN' ?  shopOrderProductInfoDTOS.productPrice : shopOrderProductInfoDTOS.marketPrice) : (orderDetail.memberAmount || shopOrderProductInfoDTOS.productPrice))}
                                    </Text>
                                    {
                                      orderDetail.orderType === ORDER_TYPE_NETWORK
                                      && <Text className="rmb gray">{shopOrderProductInfoDTOS.spec.name || ''}</Text>
                                    }
                                  </View>
                                  <View className="num">
                                    x
                                    {shopOrderProductInfoDTOS.productNum}
                                  </View>
                                </View>
                              </View>
                            </View>
                            <View className="fee-wrap">
                              <View className="flex-row flex-sb flex-ac item">
                                <Text className="name">商品金额</Text>
                                <Text
                                  className="price"
                                >
                                  ￥
                                  {formatCurrency(shopOrderProductInfoDTOS.productNum * (fromPage === 'dine' ? (orderDetail.thirdPartyType === 'LOCAL_TAO_QUAN' ?  shopOrderProductInfoDTOS.productPrice : shopOrderProductInfoDTOS.marketPrice) : (orderDetail.memberAmount || shopOrderProductInfoDTOS.productPrice)))}
                                </Text>
                              </View>
                              {
                                    orderDetail.orderType === ORDER_TYPE_NETWORK
                                    && (
                                    <Block>
                                      <View className="flex-row flex-sb flex-ac item">
                                        <Text className="name">包装费</Text>
                                        <Text
                                          className="price"
                                        >
                                          ￥
                                          {formatCurrency(orderDetail.packFee)}
                                        </Text>
                                      </View>
                                      <View className="flex-row flex-sb flex-ac item">
                                        <Text className="name">配送费</Text>
                                        <Text
                                          className="price"
                                        >
                                          ￥
                                          {formatCurrency(orderDetail.shippingFee)}
                                        </Text>
                                      </View>
                                    </Block>
                                    )
                                }
                              {
                                    orderDetail.orderType === ORDER_TYPE_DELIVERY
                                    && (
                                    <View className="flex-row flex-sb flex-ac item">
                                      <Text className="name">运费</Text>
                                      <Text
                                        className="price"
                                      >
                                        {orderDetail.shippingFee > 0 ? `￥${formatCurrency(orderDetail.shippingFee)}` : '包邮'}
                                      </Text>
                                    </View>
                                    )
                                }
                              <View className="flex-row flex-sb flex-ac item">
                                <Text className="name">优惠券</Text>
                                <Text
                                  className="price"
                                >
                                  {`${orderDetail.couponFee ? `-￥${formatCurrency(orderDetail.couponFee)}` : '无'}`}
                                </Text>
                              </View>
                            </View>
                          </View>
                          {/* 订单费用总计 */}
                          <View className="flex-row flex-je flex-ac price-total">
                            <Text className="rel">支付总计</Text>
                            <Text className="rmb">￥</Text>
                            <Text className="money">{formatCurrency(orderDetail.amount)}</Text>
                          </View>

                          {/* 套餐详情(到店消费商品需要) */}
                          {/* { */}
                          {/* orderDetail.orderType === ORDER_TYPE_STORE && shopOrderProductInfoDTOS.selfSupportDishPropertyTempList && shopOrderProductInfoDTOS.selfSupportDishPropertyTempList.length > 0 && */}
                          {/* <View className="group-goods-detail"> */}
                          {/* <View className="detail-title">套餐详情</View> */}
                          {/* <View className="list-detail"> */}
                          {/* { */}
                          {/* shopOrderProductInfoDTOS.selfSupportDishPropertyTempList.map((o, i) => { */}
                          {/* return ( */}
                          {/* <View className="flex-row flex-ac item" */}
                          {/* key={i} */}
                          {/* > */}
                          {/* <View */}
                          {/* className="flex1 flex-row title">{`${o.name}`}{o.details && "（" + o.details + "）"}</View> */}
                          {/* /!*<View className="num">x1</View>*!/ */}
                          {/* </View> */}
                          {/* ); */}
                          {/* }) */}
                          {/* } */}
                          {/* </View> */}
                          {/* </View> */}
                          {/* } */}

                          { /* 套餐详情 */
                            orderDetail.shopOrderProductInfoDTOS
                            && orderDetail.shopOrderProductInfoDTOS.length > 0
                            && orderDetail.shopOrderProductInfoDTOS[0]
                            && orderDetail.shopOrderProductInfoDTOS[0].length > 0
                            && (
                            <View className="package">
                              <View className="packageTitle">套餐详情</View>
                              {
                                    orderDetail.shopOrderProductInfoDTOS.map((ele, index) => (
                                      <Block key={index}>
                                        <View className="packageName">
                                          {ele.productName}
                                          ：
                                        </View>
                                        {
                                                ele.packageInfoList
                                                && ele.packageInfoList.length > 0
                                                && ele.packageInfoList.map((item, index) => (
                                                  <View key={index} className="item flex-row flex-sb">
                                                    <Text>
                                                      •
                                                      {item.dishName || '（未知）'}
                                                      （
                                                      {item.dishNum || '（未知）'}
                                                      份）
                                                    </Text>
                                                    <Text>
                                                      ￥
                                                      {item.dishNum * item.dishPrice || 0}
                                                    </Text>
                                                  </View>
                                                ))
                                            }
                                      </Block>
                                    ))
                                }
                            </View>
                            )
                        }
                          {
                            orderDetail.orderType === ORDER_TYPE_NETWORK
                            && (
                            <View className="order-pay-wrap">
                              <View className="flex-row flex-sb item">
                                <Text className="title">配送地址</Text>
                                <View
                                  className="flex1 description"
                                >
                                  {shopOrderExtendedInfoDTO.customerAddress}
                                </View>
                              </View>
                              <View className="flex-row flex-sb flex-ac item">
                                <Text className="title">送达时间</Text>
                                <View className="flex1 description">{shopOrderExtendedInfoDTO.orderSend}</View>
                              </View>
                              <View className="flex-row flex-sb flex-ac item">
                                <Text className="title">订单备注</Text>
                                <View
                                  className="flex1 description"
                                >
                                  {shopOrderExtendedInfoDTO.orderRemark || '--'}
                                </View>
                              </View>
                            </View>
                            )
                        }

                          {/* 订单号 */}
                          <View className="order-pay-wrap">
                            <View className="flex-row flex-sb flex-ac item">
                              <Text className="title">订单编号</Text>
                              <View className="flex1 description">{orderDetail.orderSn || '未知编号'}</View>
                              <Button
                                className="order-btn"
                                hoverClass="hover"
                                onClick={this.copyOrderSn.bind(this, orderDetail.orderSn)}
                              >
                                复制
                              </Button>
                            </View>
                            <View className="flex-row flex-sb flex-ac item">
                              <Text className="title">创建时间</Text>
                              <View className="flex1 description">{dateFormat(orderDetail.addTime)}</View>
                            </View>
                            {
                                orderDetail.orderState === 'CANCELLED' && (
                                <View className="flex-row flex-sb flex-ac item">
                                  <Text className="title">取消时间</Text>
                                  <View className="flex1 description">{dateFormat(orderDetail.operateTime)}</View>
                                </View>
                                )}
                            {
                              fromPage !== 'dine' && (
                                <View className="flex-row flex-sb flex-ac item">
                                  <Text className="title">支付方式</Text>
                                  <View className="flex1 description">
                                    {orderDetail.payWay === 4 ? '余额支付' : orderDetail.payWay === 6 ? '储值支付' : '微信支付'}
                                  </View>
                                </View>
                              )
                            }
                            {
                                orderDetail.orderType === ORDER_TYPE_DELIVERY
                                && (
                                <Block>
                                  <View className="flex-row flex-sb flex-ac item">
                                    <Text className="title">发货时间</Text>
                                    <View
                                      className="flex1 description"
                                    >
                                      {orderDetail.orderState === 'PENDING' ? '待发货' : '2018-06-12 12:00:26'}
                                    </View>
                                  </View>
                                  {
                                        orderDetail.orderState === 'FINISH' && (
                                        <View className="flex-row flex-sb flex-ac item">
                                          <Text className="title">收货时间</Text>
                                          <View className="flex1 description">2018-06-12 12:00:26</View>
                                        </View>
                                        )}
                                </Block>
                                )
                            }
                            {
                                orderDetail.orderType === ORDER_TYPE_STORE
                                && (
                                <View className="flex-row flex-sb flex-ac item">
                                  <Text className="title">过期时间</Text>
                                  <View
                                    className="flex1 description"
                                  >
                                    {orderDetail.useEndTime ? dateFormatWithDate(orderDetail.useEndTime) : '永久有效'}
                                  </View>
                                </View>
                                )
                            }
                          </View>

                          {/* 对订单的操作按钮区域 */}
                          <View className="flex-row flex-ac flex-jc option-wrap">
                            {/* <Button className="order-btn hide" hoverClass="hover">取消订单</Button> */}
                            {
                                // orderDetail.orderType == ORDER_TYPE_STORE && orderDetail.orderState !== "PENDING" &&
                                orderDetail.orderType === ORDER_TYPE_DELIVERY && orderDetail.orderState !== 'PENDING' && orderDetail.orderState !== 'CANCELLED' && (
                                <Block>
                                  {
                                    <Button
                                      className="order-btn"
                                      hoverClass="hover"
                                      onClick={this.navigateToLogistics.bind(this, orderDetail)}
                                    >
                                            查看物流
                                    </Button>
                                    }
                                  {
                                        orderDetail.orderState !== 'FINISH' && (
                                        <Button
                                          className="order-btn yellow"
                                          hoverClass="hover"
                                          disabled={ajaxLoading.effects['order/confirmReceiveAction']}
                                          loading={ajaxLoading.effects['order/confirmReceiveAction']}
                                          onClick={this.confirmReceive.bind(this, orderDetail)}
                                        >
                                            确认收到
                                        </Button>
                                        )}
                                </Block>
                                )}
                          </View>

                          {/* 客服 */}
                          <Button
                            className="flex-col flex-ac flex-jc link-merchant"
                            open-type="contact"
                          >
                            <View className="phone-icon" />
                            <View className="text">客服</View>
                          </Button>

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
                                {
                                  ((orderDetail.thirdPartyType === 'LE_WAN') || (orderDetail.thirdPartyType === 'FREE_LUNCH' && orderDetail.shopOrderProductInfoDTOS[0].thirdPartyType === 'LE_WAN')) ? (
                                    <Canvas className="qrcode-img" canvasId="consumerCode" />
                                  ) : (
                                    <Image
                                      src={usableCodes[0] && usableCodes[0].codeUrl ? getServerPic(usableCodes[0].codeUrl) : require('../../images/demo/test_qrcode.png')}
                                      className="qrcode-img"
                                    />
                                  )
                                }
                              </View>
                            </FloatLayout>
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
                                          : orderDetail.expired
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
                          {
                            showNetworkLayout
                            && (
                            <CoverView
                              className="network-mask"
                              onClick={this.ctrlNetworkLayout.bind(this)}
                            >
                              <CoverView
                                className="network-progress"
                                onClick={e => {
                                  e.stopPropagation()
                                }}
                              >
                                {
                                        // this.networkOrderProgress(orderDetail.orderState).length > 1 &&
                                        networkStateLog.length > 1
                                        && <CoverView className="state-line" />
                                    }
                                {
                                        networkStateLog.map((o, i) => (
                                          <CoverView
                                            className="flex-row flex-sb flex-ac network-item"
                                            key={i}
                                          >
                                            <CoverView className="flex-row flex-ac">
                                              <CoverView className="state-dot" />
                                              <CoverView className="state-name">{o.msg}</CoverView>
                                            </CoverView>
                                            <CoverView
                                              className="state-order-time"
                                            >
                                              {dateFormat(o.addTime, 'MM-dd hh:mm')}
                                            </CoverView>
                                          </CoverView>
                                        ))
                                    }
                              </CoverView>
                              <CoverImage
                                className="network-close"
                                onClick={this.ctrlNetworkLayout.bind(this)}
                                src={`${STATIC_IMG_URL}/icon/icon_close.png`}
                              />

                            </CoverView>
                            )
                        }
                        </View>
                      )
                      : (
                        <View className="atLoading">
                          <AtActivityIndicator mode="center" content="订单加载中..." />
                        </View>
                      )
                }
        </Block>
      )
    }
}

export default OrderDetail
