import Taro, { Component } from '@tarojs/taro'
import {
  Text, View, Input, Button, Block, ScrollView
} from '@tarojs/components'
import {
  AtFloatLayout
} from 'taro-ui'
import './preferentialPayment.scss'
import { connect } from '@tarojs/redux'
import { APP_ID } from '../../../config/baseUrl'
import {
  decodeURIObj,
  getCodeDishId,
  hideLoading,
  navToPage,
  saveCodeDishId,
  saveCodeSign,
  saveQrPartnerCode,
  showLoading,
  showToast,
  getPlatFormId,
  judgeIsPartner,
  getUserDetail,
  saveUserDetail, toDecimal, getUserDistributor, getShareInfo, formatCurrency,
  objNotNull, encodeURIObj, needLogin, parseQuery
} from '../../../utils/utils'
import IconFont from '../../../components/IconFont/IconFont'
import Payment from '../../../components/Payment/Payment'
import {
  COUPON_CONDITION, PAY_WECHAT, PAYMENT, PAY_STORED
} from '../../../config/config'

@connect(({ merchant, loading }) => ({
  ajaxLoading: loading
}))
export default class PreferentialPayment extends Taro.Component {
  config = {
    navigationBarTitleText: '优惠买单',
    onReachBottomDistance: 50,
    enablePullDownRefresh: true
  };

  constructor() {
    super()
    // const payment = decodeURIObj(this.$router.params.payment)
    this.state = {
      salePrice: '',
      noPreferential: '',
      discount: '', // payment.discount
      canUseCoupon: '', // payment.overlayDiscounts
      isShareDistribution: '', // payment.inDistribution
      discountFee: 0,
      amount: 0,
      merchantInfo: {}, // 门店信息
      distributorProportion: '',
      formPage: this.$router.params.formPage || '',
      payment: PAY_WECHAT,
      usableRedPackage: [],
      unUsableRedPackage: [],
      showRedPackModal: false,
      currentRedPackage: {},
      confirmRedPackage: {},
      distributionRatio: '',
      couponList: [],
      payBoxVisible: false,
      merchantId: '',
      brandId: ''
    }
    this.wxCode = ''
  }

  componentDidShow() {
    const { q, merchantId, brandId } = this.$router.params;
    if (q) {
      const {  merchant, brand } = parseQuery(decodeURIComponent(q))
      this.setState({
        merchantId: merchant,
        brandId: brand
      }, () => {
        this.getMerchantDistributorInfo()
        this.getMerchant()
        this.getMerchantDetail()
      })
    } else {
      this.setState({
        merchantId,
        brandId
      }, () => {
        this.getMerchantDistributorInfo()
        this.getMerchant()
        this.getMerchantDetail()
      })
    }
  }

  componentWillMount() {
    if (!needLogin()) return
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: '#ffffff'
    })
    const { canUseCoupon } = this.state
    if (canUseCoupon) this.getUserCanUseBonus()
  }

  // 获取门店分销业务
  getMerchantDistributorInfo = () => {
    const { dispatch } = this.props
    const { merchantId } = this.state
    dispatch({
      type: 'merchant/getMerchantDistributorInfo',
      payload: {
        merchantId: [merchantId]
      },
      callback: ({ ok, data }) => {
        if (ok && data) {
          const { openDistribution, distributorMerchantDetail, distributorProportion } = data.find(({ merchantId: id }) => id == merchantId) || {}
          const distributorInfo = openDistribution ? distributorMerchantDetail : []
          const ratio = distributorInfo.find(({ distributorOrderType }) => distributorOrderType === 'OFFER_TO_PAY')
          this.setState({
            distributionRatio: ratio,
            distributorProportion
          })
        }
      }
    })
  }

  // 获取门店信息
  getMerchant = () => {
    const { merchantId, brandId } = this.state
    this.props.dispatch({
      type: 'merchant/getMerchantAction',
      payload: {
        platformId: getPlatFormId(),
        brandId,
        merchantId
      },
      callback: ({ ok, data }) => {
        if (ok) {
          const { discount, overlayDiscounts, inDistribution } = data
          this.setState({
            discount,
            canUseCoupon: overlayDiscounts,
            isShareDistribution: inDistribution
          })
        }
      }
    })
  }

  // 获取门店详情
  getMerchantDetail = () => {
    const { merchantId } = this.state
    this.props.dispatch({
      type: 'merchant/getMerchantDetailAction',
      payload: {
        merchantId,
        platformId: getPlatFormId()
      },
      callback: res => {
        const { merchantDTO = {} } = res.data
        this.setState({
          merchantInfo: merchantDTO
        })
      }
    })
  }

  // 小程序分享
  onShareAppMessage() {
  // const { goodsDetail: { dishId, shopDish: { dishName } }, merchantInfo: { id } } = this.props
    const { merchantId, brandId } = this.state
    const { code } = getUserDistributor()
    return {
      title: '优惠买单',
      path: `/package/multiStore/preferentialPayment/preferentialPayment?merchantId=${merchantId}&brandId=${brandId}&code=${code || ''}`
    }
  }

  // 消费总额
  saleChange = ({ target: { value } }) => {
    const { discount, noPreferential } = this.state
    const salePrice = Number(value)
    const payAmount = formatCurrency((salePrice - noPreferential) * discount / 10 + noPreferential)
    const discountFee = formatCurrency(salePrice - payAmount)
    this.setState({
      salePrice,
      discountFee,
      amount: payAmount
    }, () => {
      this.calculateCoupon()
    })
  };

  // 不参与优惠金额
  preferentialChange = ({ target: { value } }) => {
    const { discount, salePrice } = this.state
    const noPreferential = Number(value)
    if (salePrice === '') {
      showToast('请先填写消费金额')
    } else if (salePrice < noPreferential) {
      showToast('不参与金额不能大于消费总金额')
      this.setState({
        noPreferential: 0,
        discountFee: 0,
        amount: salePrice
      })
    } else {
      const payAmount = formatCurrency((salePrice - noPreferential) * discount / 10 + noPreferential)
      const discountFee = formatCurrency(salePrice - payAmount)
      this.setState({
        noPreferential,
        discountFee,
        amount: payAmount
      }, () => {
        this.calculateCoupon()
      })
    }
  };

  // 支付第一步
  getUserInfo = userInfo => {
    // Taro.redirectTo({url: "/pages/orderDetail/orderDetail"});
    // return;
    const inputData = this.formPartnerOrder() ? true : this._checkSubmit()
    if (!inputData) {
      return
    }
    const root = this
    // showLoading('订单生成中..', true)
    if (userInfo.detail.userInfo) { // 同意
      wx.login({
        success(res) {
          // console.log(res);
          root.wxCode = res.code
          if (!root.judgeIsStoredPay()) {
            root.createOrder()
          }
        }
      })
    } else { // 拒绝,保持当前页面，直到同意
      hideLoading()
    }
  };

  // 判断是否是储值支付
  judgeIsStoredPay = () => {
    const { payment } = this.state
    if (payment === PAY_STORED) {
      Taro.eventCenter.trigger('openPasswordModal', true)
      return true
    }
    return false
  }

  /**
   * 获取用户红包
   * */
  getUserCanUseBonus = () => {
    this.props.dispatch({
      type: 'userCoupons/getUserOfferCouponAction',
      payload: { platformId: getPlatFormId(), status: 0 },
      callback: ({ ok, data }) => {
        if (ok) {
          this.calculateCoupon(data)
        }
      }
    })
  }

  // 计算总价格
  calculateAmount = () => {
    const { amount, confirmRedPackage } = this.state
    let payPrice = amount
    if (objNotNull(confirmRedPackage)) {
      payPrice -= confirmRedPackage.amountOfCoupon
    }
    return toDecimal(payPrice)
  }

  // 计算可用及不可用红包
  calculateCoupon = (coupon = this.state.couponList) => {
    const { amount, canUseCoupon } = this.state
    const usableRedPackage = []
    const unUsableRedPackage = []
    if (coupon.length > 0) {
      coupon.map(o => {
        let useCondition = false
        switch (o.couponType) {
          case 'PLATFORM_USE': useCondition = true; break
          case 'OFFER_OF_PAY': useCondition = true; break
          default: useCondition = false
        }
        if (o.demandPrice <= amount && useCondition && canUseCoupon) {
          usableRedPackage.push(o)
        } else {
          unUsableRedPackage.push(o)
        }
      })
    }
    this.setState({
      usableRedPackage,
      unUsableRedPackage,
      couponList: coupon
    })
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

  // 生成订单
  createOrder = storedPayParams => {
    const {
      amount, merchantInfo, noPreferential,
      salePrice, payment, confirmRedPackage
    } = this.state
    console.log(merchantInfo)
    const { code: partnerCode } = getUserDistributor()
    const { code: shareCode } = getShareInfo()
    showLoading('支付中...', true)
    console.log('用户自己的分享code', partnerCode)
    console.log('分享参数', getShareInfo())
    let code = ''
    if (partnerCode) {
      code = partnerCode
    } else if (shareCode) {
      code = shareCode
    }
    const _this = this
    this.props.dispatch({
      type: 'merchant/saveShopOrderAction',
      payload: {
        orderSource: 'OFFER_TO_PAY',
        amount: this.calculateAmount(),
        merchantId: merchantInfo.id,
        merchantNo: merchantInfo.merchantNo,
        merchantUserId: merchantInfo.userId,
        brandId: merchantInfo.brand,
        orderState: 'PENDING',
        orderType: 'OFFER_TO_PAY',
        platformId: getPlatFormId(),
        printState: 'UNPRINT',
        couponSn: null,
        couponId: confirmRedPackage.id || null,
        fullReductionActivity: null,
        noDiscountFee: noPreferential === '' ? 0 : noPreferential,
        productFee: salePrice,
        payWay: PAYMENT[payment],
        code,
        ...storedPayParams
      },
      callback: res => {
        if (res.ok) {
          showLoading('请求支付中...', true)
          const newOrder = res.data
          const { orderSn, useMdmPay } = res.data
          const { amount } = res.data
          // const minusMoney = res.data.discountFee + res.data.couponFee;
          if (!newOrder.payUrl) {
            if (useMdmPay) {
              // 监听聚合支付返回支付串
              let tryPayCount = 0; const
                maxPayCount = 10
              const loopCallMultiPay = () => {
                this.props.dispatch({
                  type: 'common/getMultiPayInfoAction',
                  payload: {
                    orderSn
                  },
                  callback: ({ ok, data }) => {
                    hideLoading()
                    if (ok) {
                      if (tryPayCount < maxPayCount && !data.payInfo && data.state == 'WAIT_PAY') {
                        setTimeout(loopCallMultiPay, 3000)
                      }

                      ++tryPayCount
                      const payInfo = JSON.parse(data.payInfo)
                      const root = this
                      wx.requestPayment(
                        {
                          timeStamp: payInfo.timeStamp,
                          nonceStr: payInfo.nonceStr,
                          package: payInfo.package,
                          signType: 'MD5',
                          paySign: payInfo.paySign,
                          success(res) {
                            if (root.state.isBuyCard) {
                              root.refreshLegends()
                            }
                            Taro.redirectTo({ url: `/pages/payResult/payResult?totalPrice=${newOrder.amount}&orderSn=${newOrder.orderSn}&id=${newOrder.id}` })
                          }
                        }
                      )
                    }
                  }
                })
              }
              loopCallMultiPay()
              return
            }

            // 测试跳转到详情用,发版的时候注释
            // navToPage(`/pages/payResult/payResult?totalPrice=${newOrder.amount}&orderSn=${newOrder.orderSn}&id=${newOrder.id}`);
            this.refreshBalance()
            Taro.redirectTo({ url: `/pages/payResult/payResult?orderSn=${orderSn}&type=OFFER_TO_PAY&merchantId=${merchantInfo.id}` })
            return
            if (amount === 0) {
              Taro.redirectTo({ url: `/pages/payResult/payResult?orderSn=${orderSn}&type=OFFER_TO_PAY&merchantId=${merchantInfo.id}` })
            } else {
              hideLoading(showToast('支付地址获取失败'))
            }
          }
          if (res.data.payState === 'UNPAY') {
            const tradeNo = newOrder.payUrl.match(/(\d{32})/ig)[0]
            // 获取预交易单
            this.props.dispatch({
              type: 'merchant/getPrepayAction',
              payload: { tradeNo, wxCode: this.wxCode, appId: APP_ID },
              callback: ({ ok, data }) => {
                // console.log(data)
                hideLoading()
                if (ok) {
                  console.log(data)
                  if (!data.payInfo) {
                    showToast('支付唤起错误,请稍后重试...')
                    return
                  }
                  const payInfo = JSON.parse(data.payInfo)
                  wx.requestPayment({
                    timeStamp: payInfo.timeStamp,
                    nonceStr: payInfo.nonceStr,
                    package: payInfo.package,
                    signType: 'MD5',
                    paySign: payInfo.paySign,
                    success(res) {
                      const codeDishId = getCodeDishId()
                      if (!codeDishId) {
                        saveCodeSign('')
                      } else if (codeDishId == _this.state.goodsDetail.dishId) {
                        saveCodeSign('')
                        saveCodeDishId('')
                        saveQrPartnerCode('')
                      }
                      // saveCodeDishId('');
                      // saveCodeSign('');
                      // navToPage(`/pages/payResult/payResult?totalPrice=${newOrder.amount}&orderSn=${newOrder.orderSn}&id=${newOrder.id}`);
                      Taro.redirectTo({ url: `/pages/payResult/payResult?orderSn=${orderSn}&type=OFFER_TO_PAY&merchantId=${merchantInfo.id}` })
                    },
                    fail(res) {},
                    complete(res) {
                      // navToPage('/pages/order/order');
                    }
                  })
                }
              }
            })
          } else if (res.data.payState === 'PAYED') {
            Taro.redirectTo({ url: `/pages/payResult/payResult?orderSn=${orderSn}&type=OFFER_TO_PAY&merchantId=${merchantInfo.id}` })
          }
        } else {
          hideLoading()
          const error = res.header['X-shopApp-error']
          let errMsg = ''
          if (error === 'error.businessHoursError') {
            showToast('商家不在营业状态,请稍后下单')
          } else if (error === 'error.merchantNumberOut') {
            showToast('商品超出营业数量,请重新下单')
          } else if (error === 'error.isWholeClose') {
            showToast('全站打烊,请明天再来')
          } else if (error === 'error.not-login') { // error.hongBao-error
            showToast('用户未登录,请登录账号')
            navToPage('/pages/login/login')
          } else if (error === 'error.hongBao-error') { //
            showToast('红包不可使用')
          } else if (error === 'error.soldOut') {
            const errorMsg = (res.header['X-shopApp-params']).split(',')
            errMsg = errMsg.substring(0, errMsg.length - 1)
            showToast('购买数量已超过库存数,请重新选择商品数量')
            // showToast(`${errorMsg}的购买数量已超过库存数,请重新选择商品`);
          } else if (error === 'error.exceed-limit-num') {
            showToast('购买的商品数量超出最大购买数量')
          } else {
            showToast(res.data.message)
          }
        }
      }
    })
  };

  // 判断是否来自于合伙人那边的订单
  formPartnerOrder = () => this.state.formPage === 'partnerOrder';

  // 检测是否可以提交支付,返回填写数据的封装
  _checkSubmit = () => {
    const { salePrice } = this.state
    if (!salePrice) {
      showToast('请输入消费总金额')
      return false
    }
    return true
  };

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

  showDistributionRatio = () => {
    const {
      distributionRatio: { ratio } = {},
      distributorProportion, isShareDistribution
    } = this.state
    if (getUserDistributor() && isShareDistribution) {
      return Math.floor(this.calculateAmount() * ratio / 100 * distributorProportion / 100 * 100) / 100
    }
    return 0
  }

  // 关闭支付
  closePayment = () => {
    this.setState({
      payBoxVisible: false
    })
  }

  render() {
    const {
      salePrice, noPreferential, discount, discountFee,
      amount, payment, usableRedPackage, unUsableRedPackage,
      currentRedPackage, showRedPackModal, confirmRedPackage,
      canUseCoupon, payBoxVisible
    } = this.state
    const { ajaxLoading } = this.props
    return (
      <View className="paymentBox">
        <View className="saleBox">
          <View className="saleItem">
            <View className="saleTitle">消费总额</View>
            <Input
              placeholder="询问服务员后输入"
              className="saleInput"
              type="digit"
              placeholderClass="salePlaceholder"
              value={salePrice}
              onChange={this.saleChange}
            />
          </View>
          {
            discount !== 10 && (
              <View className="saleItem">
                <View className="saleTitle">不参与优惠金额</View>
                <Input
                  placeholder="询问服务员后输入"
                  className="saleInput"
                  type="digit"
                  placeholderClass="salePlaceholder"
                  value={noPreferential}
                  onChange={this.preferentialChange}
                />
              </View>
            )
          }
        </View>
        {
          discount !== 10 && (<View className="saleTips">*输入不参与优惠金额(如酒水、套餐)</View>)
        }
        <View className="saleBox">
          {
            discount !== 10 && (
              <View className="saleItem">
                <View className="saleDiscount">
                  <Text className="discountWord">优惠</Text>
                  <Text className="discountTitle">买单优惠:</Text>
                  <Text className="discountNum">
                    {discount}
                    折
                  </Text>
                </View>
                <View className="discountMoney">
                  <Text className="moneyUnit">-￥</Text>
                  <Text className="moneyNum">{toDecimal(salePrice - amount)}</Text>
                </View>
              </View>
            )
          }
          <View className="saleItem">
            <View className="saleTitle">实付金额</View>
            <View className="discountMoney">
              <Text className="moneyUnit">￥</Text>
              <Text className="moneyNum">{this.calculateAmount()}</Text>
            </View>
          </View>
          <View className="saleItem">
            <View className="discountTips">{`买单仅限于到店支付,请确认金额后提交${this.showDistributionRatio() ? `(本单已赚￥${this.showDistributionRatio()})` : ''}`}</View>
          </View>
        </View>
        {
          canUseCoupon && (
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
                    {confirmRedPackage.amountOfCoupon > 0 ? `-￥${confirmRedPackage.amountOfCoupon}` : usableRedPackage.length > 0 ? `${usableRedPackage.length}个优惠券可用` : '暂无可用'}
                  </Text>
                  <IconFont value="icon-arrow-right-copy-copy" size={36} />
                </View>
              </View>
            </View>
          )
        }

        {
          !judgeIsPartner() && (
            <View className="buyTCD">
              <View>开通合伙人, 本单预计可返10%, 一年预计可赚￥5412</View>
              <View className="joinArrow" onClick={() => navToPage('/pages/dredgeUnionCard/dredgeUnionCard')}>
                <Text>立即加入</Text>
                <IconFont value="imgArrowBrown" ml={18} h={25} w={15} />
              </View>
            </View>
          )
        }
        <Button
          className="payBox"
          // onGetUserInfo={this.getUserInfo}
          // open-type="getUserInfo"
          loading={ajaxLoading.effects['merchant/getPrepayAction'] || ajaxLoading.effects['merchant/saveShopOrderAction']}
          onClick={() => {
            this.setState({
              payBoxVisible: true
            })
          }}
        >
          <Text>确认支付</Text>
          <Text>
            ￥
            {this.calculateAmount()}
          </Text>
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
                unUsableRedPackage.length > 0 && (
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
        <Payment
          createOrder={this.createOrder}
          payBoxVisible={payBoxVisible}
          paymentAmount={this.calculateAmount()}
          payment={payment}
          onChange={val => {
            this.setState({
              payment: val
            })
          }}
          getUserInfo={this.getUserInfo}
          closePayment={this.closePayment}
        />
      </View>
    )
  }
}
