import Taro, { Component } from '@tarojs/taro'
import {
  View, Image, Text, Button, Block, ScrollView
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import './scanningConfirm.scss'
import { AtFloatLayout } from 'taro-ui'
import {
  formatCurrency,
  getAppId,
  getCodeDishId,
  getPlatFormId,
  getServerPic, getShareInfo, getUserDistributor,
  hideLoading,
  imitateObjectValues,
  navToPage,
  objNotNull,
  readQrPartnerCode,
  saveCodeSign,
  saveQrPartnerCode,
  saveTempBuyCar,
  showLoading,
  showToast, toDecimal, getUserDetail, saveUserDetail, getUserLocation, needLogin
} from '../../../utils/utils'
import { APP_ID, DEFAULT_PLAT_FORM_ID } from '../../../config/baseUrl'
import {
  CAR_TYPE_SHOP, COUPON_CONDITION, PAY_STORED, PAY_WECHAT, PAYMENT
} from '../../../config/config'
import IconFont from '../../../components/IconFont/IconFont'
import Payment from '../../../components/Payment/Payment'

const { onfire } = Taro.getApp()
@connect(({  }) => ({

}))
export default class orderDetail extends Component {
  config = {
    navigationBarTitleText: '订单详情',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      shoppingCar: {},
      goods: [],
      tableInfo: {},
      remark: '',
      usableRedPackage: [],
      unUsableRedPackage: [],
      confirmRedPackage: {},
      currentRedPackage: {},
      payment: PAY_WECHAT,
      payBoxVisible: false,
      payType: 0,
      orderSn: ''
    }
    this.wxCode = ''
  }

  componentDidMount() {
    const { orderingInfo, tableInfo, payType, allProduct, orderSn } = this.$router.preload
    console.log(orderingInfo)
    if (Number(payType) === 1) {
      orderingInfo.feeStatus = orderingInfo.tableFee.feeStatus
      orderingInfo.totalFee = orderingInfo.tableFee.totalFee
      orderingInfo.totalAmount = orderingInfo.productFee
    }
    this.setState({
      goods: payType - 0 === 0 ? this.getOrderGoods() : allProduct,
      shoppingCar: orderingInfo,
      tableInfo,
      payType: Number(payType),
      orderSn
    }, () => {
      this.getUserCanUseBonus()
    })
  }

  getOrderGoods = () => {
    const {
      allProduct,
      orderingInfo: { productInTrolleyDTO },
      currentMerchant: { id: merchantId },
      brandId
    } = this.$router.preload
    return allProduct
      .reduce((arr, { shopDishProductCats }) => [...arr, ...shopDishProductCats], [])
      .reduce((arr, acc) => {
        const { shopDishSkus, dishImageUrl } = acc
        shopDishSkus.map(ele => {
          const { id } = ele
          productInTrolleyDTO.map(car => {
            const {
              productId: carSkuId, attribute,
              dishName, number, price,
              numLimitType, shopLimitType, limitBuyNum
            } = car
            let isAttribute = true
            let isAttributeList = []
            isAttributeList.push(true)
            for (const key in attribute) {
              arr.map(val => {
                val.selfSupportDishPropertyTempList.map(o => {
                  if (o.id == key && o.details == attribute[key]) {
                    isAttributeList.push(false)
                  } else {
                    isAttributeList.push(true)
                  }
                })
              })
            }
            if (isAttributeList.includes(true)) {
              isAttribute = true
            } else {
              isAttribute = false
            }
            if (carSkuId === id && isAttribute) {
              const attr = attribute ? imitateObjectValues(attribute)
                .join(',') : ''
              const productName = `${dishName}${attr && `(${attr})`}`
              const selfSupportDishPropertyTempList = []
              for (const key in attribute) {
                selfSupportDishPropertyTempList.push({
                  id: key,
                  merchantId,
                  brandId,
                  name: '',
                  details: attribute[key]
                })
              }
              arr.push({
                productType: 64,
                activityId: null,
                activityType: null,
                packFee: 0,
                productName,
                skuId: carSkuId,
                productNum: number,
                productPrice: price,
                imageUrl: dishImageUrl,
                numLimitType,
                shopLimitType,
                limitBuyNum,
                spec: {
                  name: productName,
                  packNum: '',
                  packPrice: '',
                  price
                },
                selfSupportDishPropertyTempList
              })
            }
          })
        })
        return arr
      }, [])
  }

  // 刷新余额信息
  refreshBalance = () => {
    const { dispatch } = this.props
    const userInfo = getUserDetail()
    dispatch({
      type: 'mine/getUserMemberInfoAction',
      callback: ({ ok, data }) => {
        if (ok) {
          const {
            amount
          } = data
          saveUserDetail({
            ...userInfo,
            amount
          })
        }
      }
    })
  }

  // 发布：scanningIndex页面重新获取桌台信息
  issueGetTable = () => {
    onfire.fire('getTableMsg')
  }

  // 判断是否是储值支付
  judgeIsStoredPay = () => {
    const { payment } = this.state
    if (payment === PAY_STORED) {
      Taro.eventCenter.trigger('openPasswordModal', true)
      return true
    }
    return false
  }

  getUserInfo = userInfo => {
    Taro.setStorageSync('userAddress', '')
    if (!needLogin()) return
    const root = this
    if (userInfo.detail.userInfo) { // 同意
      wx.login({
        success(res) {
          root.wxCode = res.code
          if (!root.judgeIsStoredPay()) {
            root.payment()
          }
        }
      })
    } else { // 拒绝,保持当前页面，直到同意

    }
  }

  payment = storedPayParams => {
    const {
      allProduct, orderingInfo: {
        uid, productInTrolleyDTO, totalAmount, totalFee = 0,
        reducePrice = 0, shopFullReductionActivityDTO,
        discountFee, tableFee
      }, currentMerchant, orderingInfo,
      payType,
      tableInfo: {
        peopleNum, tableName, tableNum
      }
    } = this.$router.preload
    const {
      goods, remark, confirmRedPackage, payment, orderSn
    } = this.state
    const {
      id, merchantNo, userId, brand, receiveAccountId,
      merchant_name,
      merchantDetails: { principal_mobile, position, address }
    } = currentMerchant
    const { nickName, phone, sex } = getUserDetail()
    const { longitude, latitude, name: userAddress } = getUserLocation()
    const payPrice = payType === 0 ? (totalAmount + totalFee - reducePrice) : (totalAmount + totalFee - discountFee)
    let baseOrder = {
      orderSource: 'QR_ORDER',
      amount: toDecimal(confirmRedPackage.id ? payPrice - confirmRedPackage.amountOfCoupon : payPrice),
      merchantId: id,
      merchantNo,
      merchantUserId: userId,
      brandId: brand,
      orderState: 'PENDING',
      orderType: payType === 0 ? 'SCAN_CODE' : 'SCAN_CODE_PAY_LATER',
      platformId: DEFAULT_PLAT_FORM_ID,
      printState: 'UNPRINT',
      couponSn: null,
      couponId: confirmRedPackage.id || null,
      fullReductionActivity: Number(payType) === 0 ? shopFullReductionActivityDTO : orderingInfo.fullReductionActivity,
      shopOrderExtendedInfoDTO: {
        customerAddress: userAddress,
        customerGender: sex - 0 === 2 ? 'WOMEN' : 'MEN',
        customerName: nickName,
        customerPhone: phone,
        customerCoordinate: `${longitude},${latitude}`,
        merchantAddress: address,
        merchantCoordinate: position,
        merchantDistance: 0,
        merchantName: merchant_name,
        merchantPhone: principal_mobile,
        orderSend: '',
        receiveId: receiveAccountId,
        orderRemark: remark,
        orderMark: ''
      },
      shopOrderProductInfoDTOS: goods,
      shoppingCartUid: Number(payType) === 0 ? uid : orderingInfo.shoppingCartUid,
      tableName,
      peopleNum,
      tableNum,
      payWay: PAYMENT[payment],
      ...storedPayParams
    }
    if (Number(payType) === 1) {
      baseOrder = {
        ...baseOrder,
        orderSn,
        id: orderingInfo.id,
        tableFee,
      }
    }
    const { code: partnerCode } = getUserDistributor()
    const { code: shareCode } = getShareInfo()
    console.log('用户自己的分享code', partnerCode)
    console.log('分享参数', getShareInfo())
    if (partnerCode) {
      baseOrder.code = partnerCode
    } else if (shareCode) {
      baseOrder.code = shareCode
    }
    showLoading()
    this.props.dispatch({
      type: 'orderConfirm/saveShopOrderAction',
      payload: baseOrder,
      callback: ({ ok, data }) => {
        if (ok) {
          if (!data.payUrl) {
            // 余额支付
            this.refreshBalance()
            Taro.redirectTo({ url: `/pages/payResult/payResult?orderSn=${data.orderSn}&type=SCAN_CODE` })
            this.issueGetTable()
            return
          }
          if (data.payState === 'UNPAY') {
            // 获取预交易单
            const { orderSn } = data
            const tradeNo = data.payUrl.match(/(\d{32})/ig)[0]
            this.props.dispatch({
              type: 'orderConfirm/getPrepayAction',
              payload: {
                tradeNo,
                wxCode: this.wxCode,
                appId: APP_ID
              },
              callback: ({ ok, data }) => {
                if (ok) {
                  const payInfo = JSON.parse(data.payInfo)
                  Taro.requestPayment(
                    {
                      timeStamp: payInfo.timeStamp,
                      nonceStr: payInfo.nonceStr,
                      package: payInfo.package,
                      signType: 'MD5',
                      paySign: payInfo.paySign,
                      success(res) {
                        hideLoading()
                        console.log('支付成功', res)
                        Taro.redirectTo({ url: `/pages/payResult/payResult?orderSn=${data.orderSn}&type=SCAN_CODE` })
                        this.issueGetTable()
                      },
                      fail(res) {
                      },
                      complete(res) {
                        hideLoading()
                        // navToPage('/pages/order/order');
                      }
                    }
                  )
                } else {
                  hideLoading()
                }
              }
            })
          } else if (res.data.payState === 'PAYED') {
            hideLoading()
            // Taro.redirectTo({ url: `/pages/payResult/payResult?moneyInfo=${JSON.stringify(_this.state.carInfo.moneyInfo)}&orderSn=${res.data.orderSn}` })
          }
        }
      }
    })
  }

  // 输入订单备注
  inputRemark = () => {
    navToPage(`/pages/orderRemark/orderRemark?oldRemark=${this.state.remark}`)
  }

  // 从其他页面返回回调函数
  goBackCll = params => {
    this.setState({
      remark: params
    })
  }

  /**
   * 获取用户红包
   * */
  getUserCanUseBonus = () => {
    const {
      payType, shoppingCar: { totalAmount, reducePrice, totalFee, discountFee }
    } = this.state
    // const { orderingInfo, tableInfo } = this.$router.preload
    // const { totalAmount, reducePrice, totalFee, productFee } = orderingInfo
    const payPrice = payType === 0 ? (totalAmount - reducePrice + totalFee) : (totalAmount - discountFee + totalFee)
    console.log(payPrice)
    this.props.dispatch({
      type: 'userCoupons/getUserOfferCouponAction',
      payload: { platformId: getPlatFormId(), status: 0 },
      callback: ({ ok, data }) => {
        if (ok) {
          const redPackage = data
          const usableRedPackage = []
          const unUsableRedPackage = []
          if (redPackage.length > 0) {
            redPackage.map(o => {
              let useCondition = false
              switch (o.couponType) {
                case 'PLATFORM_USE': useCondition = true; break
                case 'TO_THE_SHOP': useCondition = true; break
                default: useCondition = false
              }
              if (o.demandPrice <= payPrice && useCondition) {
                usableRedPackage.push(o)
              } else {
                unUsableRedPackage.push(o)
              }
            })
          }
          this.setState({
            usableRedPackage,
            unUsableRedPackage
          })
        }
      }
    })
  }

  checkRedPackage = item => {
    const { currentRedPackage, confirmRedPackage } = this.state
    let stateObj = { currentRedPackage: item }
    if (item.id === confirmRedPackage.id) { // 当前选中的是已使用的红包
      Taro.showModal({
        title: '确定不使用优惠券吗？',
        confirmText: '是',
        cancelText: '否'
      })
        .then(res => {
          if (res.confirm) {
            stateObj = {
              currentRedPackage: {},
              confirmRedPackage: {},
              showRedPackModal: false
            }
            this.setState(stateObj)
          }
        })
      return
    }
    this.setState(stateObj)
  }

  useRedPackModal = isConfirm => {
    const {
      showRedPackModal,
      confirmRedPackage,
      usableRedPackage,
      unUsableRedPackage
    } = this.state
    if (usableRedPackage.length === 0 && unUsableRedPackage.length === 0) {
      showToast('没有可用的优惠券')
      return
    }
    let stateObj = {
      showRedPackModal: !showRedPackModal,
      currentRedPackage: {}
    }
    if (isConfirm === true) { // 点击确定
      stateObj = {
        ...stateObj,
        confirmRedPackage: this.state.currentRedPackage
      }
    }
    if (!showRedPackModal && objNotNull(confirmRedPackage)) { // 打开的时候有之前选中的红包
      stateObj = {
        ...stateObj,
        currentRedPackage: confirmRedPackage
      }
    }
    this.setState({ ...stateObj })
  }

  // 计算价格
  calculateTotalAmount = () => {
    const {
      shoppingCar: {
        totalAmount, reducePrice = 0, totalFee, discountFee = 0
      },
      confirmRedPackage: { amountOfCoupon = 0 },
      payType
    } = this.state
    const payPrice = payType === 0 ? (totalAmount - reducePrice + totalFee) : (totalAmount - discountFee + totalFee)
    if (amountOfCoupon) {
      return toDecimal(payPrice - amountOfCoupon)
    }
    return toDecimal(payPrice)
  }

  // 关闭支付
  closePayment = () => {
    this.setState({
      payBoxVisible: false
    })
  }

  render() {
    const {
      shoppingCar: {
        totalAmount, reducePrice, totalFee,
        feeStatus, discountFee
      }, goods, unUsableRedPackage, currentRedPackage,
      usableRedPackage, remark, confirmRedPackage: {
        amountOfCoupon
      }, showRedPackModal, payment, payBoxVisible,
      tableInfo,
      tableInfo: { tableName, peopleNum },
      payType
    } = this.state
    return (
      <View className="orderBox">
        <View className="table">
          <View className="title flex-row flex-ac">
            <View className="icon" />
            <Text>堂食点餐</Text>
          </View>
          <View className="info flex-row flex-ac flex-sb">
            <Text>{`桌号：${tableName}`}</Text>
            <Text>{`${peopleNum}人`}</Text>
          </View>
        </View>
        <View className="orderInfo">
          <View className="orderInfoList">
            {
              goods.map(ele => {
                const {
                  skuId, imageUrl, productName, productPrice, productNum,
                  spec, selfSupportDishPropertyTempList
                } = ele
                // const skuAttr = `${spec.name}/${selfSupportDishPropertyTempList.map(({ details }) => details).join('/')}`
                const pictureUrl = imageUrl && imageUrl.split(',')[0]
                return (
                  <View className="orderListItem" key={skuId}>
                    {
                      imageUrl && (
                        <View className="orderInfoImg">
                          <Image src={getServerPic(pictureUrl)} />
                        </View>
                      )
                    }
                    <View className="orderInfoName flex-row flex-ac flex-sb">
                      <View className="orderDishName ellipsis">{productName}</View>
                      {/* <View className="orderDishSpecs">{skuAttr}</View> */}
                      <View className="orderDishPay orderDishPayPositionBottom">
                        <View className="orderDishPayItem">
                          x
                          <Text>{productNum}</Text>
                        </View>
                        <View className="orderDishPayItem">
                          ￥
                          <Text>{productPrice}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )
              })
            }
          </View>
          <View className="orderInfoItem">
            {
              feeStatus !== 0 && (
                <View className="orderFavourable">
                  {`桌台费/${feeStatus === 1 ? '桌' : '人'}：￥${totalFee}`}
                </View>
              )
            }
            <View className="orderReduce">
              {
                payType === 0 && reducePrice && (<Text className="orderCutMoney">{`已优惠￥${toDecimal(reducePrice)}`}</Text>)
              }
              {
                payType === 1 && discountFee && (<Text className="orderCutMoney">{`已优惠￥${toDecimal(discountFee)}`}</Text>)
              }
              <Text className="orderPayMoney">{`￥${this.calculateTotalAmount()}`}</Text>
            </View>
          </View>
        </View>
        <Payment
          createOrder={this.payment}
          payBoxVisible={payBoxVisible}
          paymentAmount={this.calculateTotalAmount()}
          payment={payment}
          onChange={val => {
            this.setState({
              payment: val
            })
          }}
          getUserInfo={this.getUserInfo}
          closePayment={this.closePayment}
        />
        <View className="fee-wrap">
          <View
            className="flex-row flex-sb flex-ac item ticket-wrap"
            hoverClass="hover"
            hoverStartTime={10}
            hoverStayTime={100}
            onClick={this.useRedPackModal.bind(this)}
          >
            <Text className="name">优惠券</Text>
            <View className="flex-row flex-ac can-use-ticket">
              <Text
                className={`ticket ${confirmRedPackage.amountOfCoupon > 0 ? 'used' : usableRedPackage.length > 0 ? 'num' : ''}`}
              >
                {confirmRedPackage.amountOfCoupon > 0 ? `已减${confirmRedPackage.amountOfCoupon}` : usableRedPackage.length > 0 ? `${usableRedPackage.length}个优惠券可用` : '暂无可用'}
              </Text>
              <IconFont value="icon-arrow-right-copy-copy" size={36} />
            </View>
          </View>
        </View>
        {
          payType === 0 && (
            <View
              className="orderRemarks flex-row flex-ac"
              onClick={this.inputRemark}
            >
              <View className="flex-sk">订单备注</View>
              <View className="ellipsis flex1 remark">{remark}</View>
              <Image
                className="orderArrow flex-sk"
                src={require('../../../images/icon/icon_arrow.png')}
              />
            </View>
          )
        }
        {/* <View className="orderCancel">取消订单</View> */}
        <Button
          className="orderPay"
          onClick={() => {
            this.setState({
              payBoxVisible: true
            })
          }}
          // onGetUserInfo={this.getUserInfo}
          // open-type="getUserInfo"
        >
          <Text>确认支付</Text>
          <Text>{`¥${this.calculateTotalAmount()}`}</Text>
        </Button>
        {/* 使用红包弹窗 */}
        <AtFloatLayout
          isOpened={showRedPackModal}
          onClose={() => { this.setState({ showRedPackModal: false }) }}
        >
          <View className="flex-col package-wrap">
            <View className="flex-row flex-ac flex-sb modal-header">
              <Button
                className="title-btn cancel hide"
                hoverClass="hover"
                onClick={this.useRedPackModal.bind(this)}
              >
                取消
              </Button>
              <View className="flex1 title">请选择优惠券</View>
              <Button
                className={`title-btn confirm ${!currentRedPackage.id ? 'disabled' : ''}`}
                hoverClass="hover"
                disabled={!currentRedPackage.id}
                onClick={this.useRedPackModal.bind(this, true)}
              >
                确定
              </Button>
            </View>
            <ScrollView
              scrollY
              className="list-wrap"
            >
              {
                usableRedPackage.map((o, i) => {
                  const {
                    amountOfCoupon, couponName, endDate,
                    id, demandPrice, couponType
                  } = o
                  return (
                    <View
                      className="flex-row flex-ac item"
                      hoverClass="hover"
                      hoverStartTime={10}
                      hoverStayTime={100}
                      key={i}
                      onClick={this.checkRedPackage.bind(this, o)}
                    >
                      <View className="flex-col flex-ac flex-jc left">
                        <View>
                          <Text className="rmb">￥</Text>
                          <Text className="money">{formatCurrency(amountOfCoupon)}</Text>
                        </View>
                        <Text className="description">
                          {demandPrice !== 0 ? `满${demandPrice}可用` : '无金额限制'}
                        </Text>
                      </View>
                      <View className="flex1 flex-col flex-sb right">
                        <View className="flex-row flex-ac flex-sb">
                          <View className="flex1 ellipsis title">
                            {couponName}
                          </View>
                          {
                            currentRedPackage.id === id
                            && <IconFont value="imgHook" h={34} w={34} />
                          }
                        </View>
                        <View className="date">{`${COUPON_CONDITION[couponType]}`}</View>
                        <View
                          className="date"
                        >
                          {endDate.replace('T', ' ')}
                          到期
                        </View>
                      </View>
                    </View>
                  )
                })
              }

              {
                unUsableRedPackage.length > 0
                && (
                  <Block>
                    {
                      usableRedPackage.length > 0
                      && (
                        <View className="flex-row flex-ac disabled-title">
                          <Text className="text">不可用优惠券</Text>
                        </View>
                      )
                    }
                    {
                      unUsableRedPackage.map((o, i) => {
                        const {
                          amountOfCoupon, couponName, endDate,
                          couponType, demandPrice
                        } = o
                        return (
                          <View
                            className="flex-row flex-ac item"
                            hoverClass="hover"
                            hoverStartTime={10}
                            hoverStayTime={100}
                            key={`disabled_${i}`}
                          >
                            <View className="flex-col flex-ac flex-jc disabled-ticket">
                              <View>
                                <Text className="rmb">￥</Text>
                                <Text
                                  className="money"
                                >
                                  {formatCurrency(amountOfCoupon)}
                                </Text>
                              </View>
                              <Text className="description">
                                {demandPrice !== 0 ? `满${demandPrice}可用` : '无金额限制'}
                              </Text>
                            </View>
                            <View className="flex1 flex-col flex-sb right">
                              <View className="flex-row flex-ac flex-sb">
                                <View className="flex1 ellipsis title">
                                  {couponName}
                                </View>
                              </View>
                              <View className="date">{`${COUPON_CONDITION[couponType]}商品使用`}</View>
                              <View
                                className="date"
                              >
                                {endDate.replace('T', ' ')}
                                到期
                              </View>
                              {/* <View */}
                              {/* className="limit" */}
                              {/* > */}
                              {/* 限本平台使用。限登陆手机号为 */}
                              {/* {o.consumerPhone || '本账号手机'} */}
                              {/* 使用。 */}
                              {/* </View> */}
                            </View>
                          </View>
                        )
                      })
                    }
                  </Block>
                )
              }
            </ScrollView>
          </View>
        </AtFloatLayout>
      </View>
    )
  }
}
