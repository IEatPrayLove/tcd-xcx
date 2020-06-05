import Taro, { Component } from '@tarojs/taro'
import {
  Button, Image, Input, Picker, Text, View,
  Block, ScrollView
} from '@tarojs/components'
import {
  AtFloatLayout, AtIcon, AtModal, AtModalContent
} from 'taro-ui'
import { connect } from '@tarojs/redux'
import './packageOrderConfirm.scss'
import {
  dateFormatWithDate,
  decodeURIObj,
  formatAttachPath,
  formatCurrency,
  getUserLocation,
  getPlatFormId,
  hideLoading,
  latelyMerchant,
  locationArea,
  makeTimeStepByServiceTime,
  navToPage,
  objNotNull,
  productTypeAnd,
  readPartnerCode,
  replaceEmoji,
  showLoading,
  showToast,
  trimAllSpace,
  getPartnerCode,
  setShareInfo,
  getUserDistributor,
  getUserInfo,
  clearShareInfo,
  getShareInfo, getUserDetail,
  saveUserDetail, judgeLegendsCard,
  toDecimal,
  validatePhone
} from '../../../utils/utils'
import {
  GOODS_COMMODITY,
  GOODS_MODEL,
  GOODS_PICK_UP,
  GOODS_TAKE_OUT,
  GOODS_TICKET,
  COUPON_CONDITION,
  PAY_WECHAT, PAY_STORED, PAYMENT
} from '../../../config/config'
import { APP_ID } from '../../../config/baseUrl'
import IconFont from '../../../components/IconFont/IconFont'
import Payment from '../../../components/Payment/Payment'

const dayjs = require('dayjs')

const testReds = [{
  id: 1,
  name: '红包1'
}, {
  id: 2,
  name: '红包2'
}]
const TOP_UP_ACCOUNT = {
  Phone: '手机号',
  QQ: '腾讯QQ',
  WeChat: '微信号'
}
/**
 * 订单确认
 */
// @authenticate
@connect(({
  loading, orderConfirm, common, goodsDetail
}) => ({
  merchantInfo: goodsDetail.merchantInfo,
  redPackage: common.redPackage,
  ajaxLoading: loading
}))
class PackageOrderConfirm extends Component {
  config = {
    navigationBarTitleText: '确认订单'
  }


  constructor() {
    super()
    const goodsDetail = this.$router.params.goodsDetail && decodeURIObj(this.$router.params.goodsDetail) || {}
    this.state = {
      testShowAddress: false, // 显示选中的地址,此处只是作为测试,实际逻辑要根据地址选中的来,

      gender: 'WOMEN', // 到店消费性别
      userAddress: {}, // 用户地址

      showRedPackModal: false, // 使用红包弹层
      currentRedPackage: {}, // 当前选中红包
      confirmRedPackage: {}, // 确定的时候红包缓存
      buyNums: goodsDetail.shopDish && goodsDetail.shopDish.minOrderCount ? goodsDetail.shopDish.minOrderCount > goodsDetail.shopDish.buyNums ? goodsDetail.shopDish.minOrderCount : (goodsDetail.shopDish.buyNums || 1) : 1, // 外卖到家购买数量
      // redPackage: [],//可用红包
      usableRedPackage: [], // 可用红包
      unUsableRedPackage: [], // 不可用红包

      merchantInfo: this.$router.params.merchantInfo && decodeURIObj(this.$router.params.merchantInfo) || {}, // 门店信息
      goodsDetail,
      partnerLevelId: this.$router.params.partnerLevelId || null,
      formPage: this.$router.params.formPage || '',

      firstEnter: true, // 是否是正向进入页面

      tabs: [], // tabs.length > 0 ? tabs : [],//根据商品类型选择下单方式
      currentTab: {}, // tabs.length > 0 ? tabs[0] : {},//当前选中的下单类型tab

      showSelectTimeModal: false, // 选择时间弹层
      platformSystemSetting: {}, // 平台设置信息,
      takeOutTimes: [], // 外卖配送送达时间
      tempCurrentTakeDate: {}, // 当前选中的日期
      tempCurrentTime: {}, // 临时存储当前选中的时间
      confirmCurrentTime: {}, // 确定的当前选中时间

      remark: '', // 订单备注
      curMerchantRange: [], // 商品详情页判断的最合适门店
      reservationTime: '', // 预约时间(乐玩)
      deliveryTime: '', // 送达时间
      idCard: '', // 用户需填写的身份证
      payType: PAY_WECHAT, // 支付方式
      payModal: false, // 余额支付弹窗

      isPrize: false, // 是否为霸王餐领奖商品
      balance: 0, // 余额
      isBuyCard: false,
      hasLegendsCard: false,
      limitPrice: 0,
      legendsCardInfo: {},
      couponList: [], // 用户优惠券
      buyEarn: 0,
      happyPlayPeopleNum: Array(goodsDetail.repeatPeoplenum || 0).fill({}),
      account: '', // 乐玩充值账号
      payBoxVisible: false
    }
    this.wxCode = ''
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    })
    // 获取用户默认地址(正向跳转的时候只需要执行一次)
    this.loadUserDefaultAddress()
  }

  componentDidMount() {
    const { goodsDetail } = this.state
    const { dispatch } = this.props
    let tabs = []
    // console.log(goodsDetail);
    // showToast("当前定位超出外卖配送范围");
    if (objNotNull(goodsDetail) && objNotNull(goodsDetail.shopDish) && goodsDetail.shopDish.productType) {
      tabs = GOODS_MODEL.filter(o => productTypeAnd(goodsDetail.shopDish.productType, o.value))
      this.setState({
        tabs: tabs.length > 0 ? tabs : [], // 根据商品类型选择下单方式
        currentTab: tabs.length > 0 ? tabs[0] : {}// 当前选中的下单类型tab
      })
      const { dishId } = goodsDetail
      dispatch({
        type: 'index/getProductIsDistributionAction',
        payload: { dishIds: [dishId] },
        callback: ({ ok, data: distribute }) => {
          if (ok && distribute.length > 0) {
            const { distributorProportion } = distribute[0]
            this.setState({
              buyEarn: distributorProportion / 100
            })
          }
        }
      })
    }
    this.loadUserDefaultAddress()
  }

  componentDidShow() {
    /* const {goodsDetail} = this.state;
     const shopDish = goodsDetail.shopDish || {}; */
    const { merchantInfo, goodsDetail } = this.state
    const { dispatch } = this.props
    // console.log(goodsDetail);
    if (!merchantInfo.brand) {
      console.log('品牌未知')
      return
    }
    // 获取用户红包
    this.loadRedPackageList(merchantInfo.brand)
    // 商品类型支持配送到家,则需要计算送达时间
    if (!this.formPartnerOrder() && objNotNull(goodsDetail.shopDish) && goodsDetail.shopDish.productType && productTypeAnd(goodsDetail.shopDish.productType, GOODS_TAKE_OUT)) {
      this.loadPlatformSetting()
    }
    // this.loadUserDefaultAddress();

    // 霸王餐中奖
    const { from } = this.$router.params
    if (from === 'dine') {
      this.setState({
        isPrize: true
      })
    }

    // 获取余额
    dispatch({
      type: 'mine/getUserMemberInfoAction',
      callback: ({ ok, data }) => {
        if (ok) {
          const { amount } = data
          this.setState({
            balance: amount
          })
        }
      }
    })

    const { islandUserMemberDTO } = getUserDetail()
    // 判断是否享有会员卡会员
    if (!judgeLegendsCard(islandUserMemberDTO)) {
      this.setState({
        hasLegendsCard: true
      })
      dispatch({
        type: 'legendsCard/getLegendsCardMoneyAction',
        callback: ({ ok, data }) => {
          if (ok) {
            this.setState({
              limitPrice: data
            })
          }
        }
      })
      dispatch({
        type: 'legendsCard/getLegendsCardInfoAction',
        callback: ({ ok, data }) => {
          if (ok) {
            this.setState({
              legendsCardInfo: data
            })
          }
        }
      })
    }
  }

  // 是否购买会员卡
  handleBuyCard = () => {
    this.setState({
      isBuyCard: !this.state.isBuyCard
    })
  }

  /** *****送达时间****** */
  // 先读取平台设置(从中读取平台营业时间)
  loadPlatformSetting = () => {
    this.props.dispatch({
      type: 'common/getPlatFormSystemSettingByIdAction',
      payload: { id: getPlatFormId() },
      callback: ({ ok, data }) => {
        if (ok) {
          const platform = data[0]
          this.setState({ platformSystemSetting: platform }, () => {
            this.makeSendTimes()
          })
        }
      }
    })
  }

  /* 送达时间 */
  makeSendTimes = openModal => {
    // console.log(this.state.merchantInfo, this.state.platformSystemSetting)
    const times = makeTimeStepByServiceTime('立即送达', this.state.merchantInfo, this.state.platformSystemSetting)// this.makeTimeStepByServiceTime("立即送餐");
    // console.log(times);
    if (times.length > 0) {
      let stateObj = { takeOutTimes: times }
      if (times[0].times.length > 0) { // 需要打开弹窗,点击了
        if (openModal) {
          stateObj = {
            ...stateObj,
            tempCurrentTakeDate: times[0],
            tempCurrentTime: {
              date: times[0].date,
              realDate: times[0].realDate,
              time: times[0].times[0]
            },
            showSelectTimeModal: true
          }
        } else {
          stateObj = {
            ...stateObj,
            confirmCurrentTime: {
              showDate: '',
              date: times[0].date,
              realDate: times[0].realDate,
              time: times[0].times[0]
            }
          }
        }
      }
      this.setState({ ...stateObj })
    }
  }

  /** ********************** */
  // 加载红包数据列表
  loadRedPackageList = brandId => {
    this.props.dispatch({
      type: 'userCoupons/getUserOfferCouponAction',
      payload: { status: 0 },
      callback: ({ ok, data }) => {
        // console.log(data);
        if (ok) {
          this.setState({
            couponList: data
          }, () => {
            this.calculateUsableRedPack()
          })
        }
      }
    })
  }

  // 计算可用红包
  calculateUsableRedPack = () => {
    const { couponList: redPackage, currentTab: { value } } = this.state
    const usableRedPackage = []
    const unUsableRedPackage = []
    if (redPackage.length > 0) {
      redPackage.map(o => {
        let useCondition = false
        if (o.couponType === 'PLATFORM_USE') useCondition = true
        if (o.couponType === 'PACKAGE') {
          switch (o.packageType) {
            case 1: useCondition = value === GOODS_COMMODITY; break
            case 4: useCondition = value === GOODS_TICKET; break
            case 7: useCondition = true; break
            // case 'TAKE_OUT': useCondition = value === GOODS_TAKE_OUT; break
            default: useCondition = false
          }
        }
        if (o.demandPrice <= this.getTotalPrice(true) && useCondition) {
          usableRedPackage.push(o)
        } else {
          unUsableRedPackage.push(o)
        }
      })
    }
    let stateObj = {
      usableRedPackage,
      unUsableRedPackage
    }
    if (unUsableRedPackage.length === redPackage.length) { // 所有红包都不可用的时候
      stateObj = {
        ...stateObj,
        currentRedPackage: {}, // 当前选中红包
        confirmRedPackage: {}
      }
    }
    // console.log(stateObj);
    this.setState(stateObj)
  }

  // 获取用户选择的地址(从地址返回的时候需要执行此函数)
  loadUserDefaultAddress = id => {
    showLoading()
    this.props.dispatch({
      type: 'common/getUserDefaultAddressAction',
      payload: { id },
      callback: ({ ok, data }) => {
        hideLoading()
        if (ok) {
          if (!data) {
            return
          }
          if (this.$router.params.formPage === 'partnerOrder') {
            this.setState({ userAddress: data })
            return
          }
          this.setState({ userAddress: data })
          return
          const location = data.coordinate.split(',')
          // 获取订单页详情判断的门店信息
          let curMerchantRange = []
          this.state.goodsDetail.dishMerchantShippingInfo.map(ele => {
            if (ele.merchantId === this.props.merchantInfo.merchantDetails.merchantId) {
              curMerchantRange = ele.shippingRange
            }
          })
          // console.log(this.state.goodsDetail.dishMerchantShippingInfo)
          // console.log(curMerchantRange);
          if ((this.state.goodsDetail.dishMerchantShippingInfo.length <= 1 && !curMerchantRange) || locationArea(curMerchantRange, {
            latitude: location[1],
            longitude: location[0]
          })) {
            this.setState({ userAddress: data })
          }
          this.setState({
            curMerchantRange
          })
          // let minShop = latelyMerchant(this.state.goodsDetail.dishMerchantShippingInfo, {longitude:location[0],latitude:location[1]});
          // if(!minShop.isDeliveryRange && this.state.currentTab['value'] === GOODS_TAKE_OUT  ){
          //     return
          // }
          // this.setState({userAddress: data});
        }
      }
    })
  }

  // 外部删除了当前用户使用的地址,则此页面也同步删除
  publicRemoveAddress = id => {
    if (this.state.userAddress.id === id) {
      this.setState({ userAddress: {} })
    }
  }

  // 收货地址修改
  onChangeAddress = () => {
    // 实际需要跳转
    // const range= JSON.stringify(this.state.goodsDetail.dishMerchantShippingInfo);
    const { curMerchantRange } = this.state
    navToPage(`/package/userAddress/userAddress?formPage=orderConfirm&rangeArea=${JSON.stringify(curMerchantRange)}&orderType=${this.state.currentTab.value}`)
  }

  // 到店消费预定人性别
  choseGender = gender => {
    this.setState({ gender })
  }

  // 到店消费预订姓名和电话输入
  inputChange = (params, e) => {
    const { userAddress } = this.state
    const stateObj = {}
    stateObj[params] = replaceEmoji(e.target.value)
    // console.log(stateObj);
    this.setState({ userAddress: { ...this.state.userAddress, ...stateObj } })
  }

  /** *******红包选择********* */
  // 使用红包弹层控制
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

  // 选中红包
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

  /** *****商品加减,计算价格******* */
  // 减少数量
  subGoods = () => {
    // console.log(this.state.goodsDetail)
    const { goodsDetail: { repeatPeoplenum }, happyPlayPeopleNum } = this.state
    if (this.state.buyNums === 1) {
      showToast('至少需要购买一个')
      return
    }
    this.setState({
      buyNums: this.state.buyNums - 1,
      happyPlayPeopleNum: happyPlayPeopleNum.slice(0, happyPlayPeopleNum.length - repeatPeoplenum)
    }, () => {
      this.calculateUsableRedPack()
    })
  }

  // 增加数量
  addGoods = shopDishSkus => {
    const { goodsDetail: { repeatPeoplenum }, happyPlayPeopleNum } = this.state
    const max = this.state.goodsDetail.limitBuyNum || ''
    if (this.state.buyNums >= shopDishSkus.stock) {
      showToast('已超过最大库存,不能在添加了')
      return
    }
    if (max && this.state.buyNums >= this.state.goodsDetail.limitBuyNum) {
      showToast(`每人限购${this.state.goodsDetail.limitBuyNum}份`)
      return
    }

    this.setState({
      buyNums: this.state.buyNums + 1,
      happyPlayPeopleNum: happyPlayPeopleNum.concat(Array(repeatPeoplenum || 0).fill({}))
    }, () => {
      this.calculateUsableRedPack()
    })
  }

  // 计算商品小计,总计价格isSubTotal:是否是小计
  getTotalPrice = isSubTotal => {
    const {
      goodsDetail,
      merchantInfo,
      buyNums,
      confirmRedPackage,
      currentTab,
      isPrize,
      isBuyCard,
      limitPrice,
      hasLegendsCard
    } = this.state
    if (isPrize) return 0
    const shopDish = goodsDetail.shopDish || {}
    const shopDishSkus = shopDish.currentSku ? shopDish.currentSku : shopDish.shopDishSkus && shopDish.shopDishSkus.length > 0 && shopDish.shopDishSkus[0] || {}
    let totalPrice = shopDishSkus.price * buyNums

    // 会员价
    if (shopDishSkus.memberPrice !== null && shopDishSkus.memberPrice !== undefined && !hasLegendsCard) {
      totalPrice = shopDishSkus.memberPrice * buyNums
    }

    if (isSubTotal) { // 小计,计算商品价格*数量就行,直接返回
      return totalPrice
    }
    // 总计,需要计算其他参数
    if (currentTab.value === GOODS_TAKE_OUT) { // 外卖到家
      if (!shopDishSkus.freeBoxPrice && shopDishSkus.boxPrice > 0) { // 不免餐盒费的情况
        totalPrice += shopDishSkus.boxPrice * buyNums
      }
      if (merchantInfo.shippingPrice > 0) { // 配送费
        totalPrice += merchantInfo.shippingPrice
      }
    }
    if (currentTab.value === GOODS_TICKET && shopDish.deliverFee) { // 快递到家,正常需要加上快递费
      totalPrice += shopDish.deliverFee
    }
    if (confirmRedPackage.amountOfCoupon > 0) { // 有红包使用的时候,总计需要减去红包
      totalPrice -= confirmRedPackage.amountOfCoupon
    }
    if (totalPrice < 0) {
      totalPrice = 0
    }
    if (isBuyCard) {
      totalPrice += limitPrice
    }
    return totalPrice
  }

  /** ******************支付逻辑****************** */
  // 封装订单
  makeOrder = storedPayParams => {
    const {
      merchantInfo,
      goodsDetail,
      confirmRedPackage,
      gender,
      userAddress,
      buyNums,
      partnerLevelId,
      currentTab,
      confirmCurrentTime,
      reservationTime,
      deliveryTime,
      goodsDetail: {
        dishId, thirdPartyType
      },
      isPrize,
      payType,
      isBuyCard,
      limitPrice,
      happyPlayPeopleNum,
      idCard
    } = this.state
    const shopDish = goodsDetail.shopDish || {}
    const shopOrderProductInfoDTOS = []
    const skus = shopDish.currentSku ? [shopDish.currentSku] : shopDish.shopDishSkus
    const shopDishAttributes = shopDish.currentAttr ? shopDish.currentAttr : (shopDish.shopDishAttributes && shopDish.shopDishAttributes.length > 0 ? shopDish.shopDishAttributes : [])
    skus.length > 0 && skus.map((o, i) => {
      // 套餐信息
      let packageInfo = null
      shopDish.shopDishSkus.map(ele => {
        if (ele.id === o.id) {
          packageInfo = ele.skuPackageInfoList
        }
      })
      shopOrderProductInfoDTOS.push({
        productType: currentTab.value,
        packageInfoList: packageInfo,
        activityId: '', // product.sku.activityId,
        activityType: '', // product.sku.activityType,
        marketPrice: '', // product.marketPrice,
        packFee: 0, // parseFloat(toDecimal(product.num * (product.sku.boxNum * product.sku.boxPrice))),
        productName: shopDish.dishName,
        skuId: o.id,
        productNum: buyNums,
        productPrice: o.price,
        imageUrl: shopDish.picture,
        spec: {
          name: currentTab.value === GOODS_TAKE_OUT ? shopDish.selectedSkuAndAttrStr : shopDish.dishName + (o.spec || ''),
          packNum: o.boxNum || '',
          packPrice: o.boxPrice || '',
          price: o.price || ''
        },
        // 不再判断 到店消费 才有属性 有属性都算
        selfSupportDishPropertyTempList: shopDishAttributes.length > 0 ? shopDishAttributes.map(a => ({
          id: a.id,
          merchantId: merchantInfo.id,
          brandId: merchantInfo.brand,
          name: a.name || '',
          details: a.details || ''
        })) : [],
        thirdPartyType: isPrize ? thirdPartyType : null,
        externalSkuNo: o.externaSkuNo
      })
    })
    const isPartnerOrder = this.formPartnerOrder()// 是否是从合伙人那边来的订单
    let sendTime = ''
    if (!isPartnerOrder && currentTab.value === GOODS_TAKE_OUT && confirmCurrentTime.time) { // 外卖到家需要传送达时间
      sendTime = `${confirmCurrentTime.showDate ? confirmCurrentTime.showDate : ''}${confirmCurrentTime.time}`
    }
    const oneTicketData = ''
    // if (goodsDetail.repeatPeoplenum === 1) {
    //   oneTicketData = [{
    //     name: replaceEmoji(userAddress.userName),
    //     mobile: userAddress.phone,
    //     idcard: idCard
    //   }]
    // }
    const shopOrderExtendedInfoDTO = {
      customerAddress: isPartnerOrder ? '　' : currentTab.value === GOODS_COMMODITY ? '' : userAddress.address + userAddress.detailAddress,
      customerCoordinate: isPartnerOrder ? '　' : userAddress.coordinate || '',
      customerGender: isPartnerOrder ? 'MEN' : gender,
      customerName: isPartnerOrder ? '　' : replaceEmoji(userAddress.userName),
      customerPhone: isPartnerOrder ? '　' : userAddress.phone,
      merchantAddress: replaceEmoji(merchantInfo.merchantDetails.address),
      merchantCoordinate: merchantInfo.merchantDetails.position,
      merchantDistance: 0, // merchant.merchantDetails.discount,
      merchantName: merchantInfo.merchant_name,
      merchantPhone: merchantInfo.merchantDetails.principal_mobile,
      orderSend: sendTime, // useDate,
      receiveId: merchantInfo.receiveAccountId,
      orderRemark: currentTab.value === GOODS_TAKE_OUT ? this.state.remark : '', // this.state.remark,
      orderMark: currentTab.value === GOODS_TAKE_OUT ? this.state.remark : '',
      // reserveTime: (reservationTime || deliveryTime) ? (`${new Date(reservationTime || deliveryTime).getTime()}`).slice(0, 10) - 0 : '',
      plainday: (reservationTime || deliveryTime) ? (`${new Date(reservationTime || deliveryTime).getTime()}`).slice(0, 10) - 0 : '',
      ticketdata: (goodsDetail.repeatPeoplenum >= 1 && goodsDetail.repeatFields) ? JSON.stringify(happyPlayPeopleNum) : '',
      idcard: goodsDetail.requireIdcard === 1 ? idCard : ''
    }
    const baseOrder = {
      amount: formatCurrency(this.getTotalPrice()) || 0, // 以后端计算为准
      // "discountFee": '',
      merchantId: merchantInfo.id,
      merchantNo: merchantInfo.merchantNo,
      merchantUserId: merchantInfo.userId,
      brandId: merchantInfo.brand,
      // "packFee": moneyInfo.totalPackFee,
      orderState: 'PENDING', // 以后端计算为准
      orderType: currentTab.orderType, // shopDish.productType === GOODS_TICKET ? "DELIVERY_TO_HOME" : "TO_THE_STORE",
      platformId: getPlatFormId(),
      // "platformUserId": plat?plat.createdBy:null,
      printState: 'UNPRINT', // 以后端计算为准
      deliverFee: shopDish.deliverFee ? formatCurrency(shopDish.deliverFee) : null,
      shopOrderExtendedInfoDTO,
      shopOrderProductInfoDTOS,
      orderSource: currentTab.value === GOODS_COMMODITY ? 'PACKAGE' : 'DELIVERY_TO_HOME',
      // couponSn: confirmRedPackage.hongBaoSn || null, // todo 红包
      couponId: confirmRedPackage.id || null,
      fullReductionActivity: null, // this.state.fullMinusActivities
      payWay: PAYMENT[payType], // 微信支付
      thirdPartyType,
      bindingBuy: isBuyCard,
      ...storedPayParams
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
    // 霸王餐物流商品领取
    if (isPrize) {
      baseOrder.thirdPartyType = 'FREE_LUNCH'
      baseOrder.infoId = this.$router.params.activelyId
      baseOrder.islandFreeLunchId = this.$router.params.dineId
    }

    if (partnerLevelId) {
      baseOrder.partnerLevelId = partnerLevelId
    }

    if (isBuyCard) {
      baseOrder.amount = toDecimal(this.getTotalPrice() - limitPrice)
      baseOrder.tcCardAmount = limitPrice
    }
    return baseOrder
  }

  // 刷新会员卡
  refreshLegends = () => {
    const { dispatch } = this.props
    const userInfo = getUserDetail()
    // 刷新会员卡信息
    dispatch({
      type: 'legendsCard/getUserLegendsCardInfoAction',
      payload: {
        userId: userInfo.id
      },
      callback: ({ ok, data }) => {
        if (ok) {
          saveUserDetail({ ...userInfo, islandUserMemberDTO: data })
        }
      }
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

  // 保存订单
  saveOrder = storedPayParams => {
    showLoading('订单生成中..', true)
    const { currentTab, goodsDetail } = this.state
    if (currentTab.value === GOODS_TAKE_OUT) { // 外卖配送,需要去拿最近的门店信息
      const minShop = latelyMerchant(goodsDetail.dishMerchantShippingInfo, getUserLocation())
      if (minShop.merchantId) {
        // 加载门店信息数据
        this.props.dispatch({
          type: 'goodsDetail/getMerchantInfoAction',
          payload: { merchantId: minShop.merchantId },
          callback: ({ ok, data }) => {
            // console.log(data);
            if (ok) {
              this.setState({ merchantInfo: data }, () => this.submitOrder(storedPayParams))
            }
          }
        })
      } else {
        showToast('最近的门店id不存在')
      }
    } else {
      this.submitOrder(storedPayParams)
    }
  }

  submitOrder = storedPayParams => {
    const { wxCode } = this
    const order = this.makeOrder(storedPayParams)
    // 生成订单(保存订单)
    this.props.dispatch({
      type: 'orderConfirm/saveShopOrderAction',
      payload: order,
      callback: res => {
        if (res.ok) {
          showLoading('请求支付中...', true)
          const newOrder = res.data
          if (!newOrder.payUrl) {
            if(newOrder.useMdmPay){
              // 监听聚合支付返回支付串
              let tryPayCount = 0, maxPayCount = 10;
              const loopCallMultiPay = () => {
                this.props.dispatch({
                  type: 'common/getMultiPayInfoAction',
                  payload: {
                    orderSn
                  },
                  callback: ({ ok, data }) => {
                    hideLoading()
                    if (ok) {
                      if(tryPayCount < maxPayCount && !data.payInfo && data.state == 'WAIT_PAY'){
                        setTimeout(loopCallMultiPay, 3000);
                      }

                      ++tryPayCount;
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
              loopCallMultiPay();
              return
            }

            const { isPrize, isBuyCard } = this.state
            // 霸王餐物流商品领奖
            if (isPrize) {
              const pages = Taro.getCurrentPages()
              const prevPage = pages[pages.length - 2]
              prevPage.$component.loadList()
              Taro.navigateBack()
              return
            }
            // 余额支付
            this.refreshBalance()
            if (isBuyCard) {
              this.refreshLegends()
            }
            Taro.redirectTo({ url: `/pages/payResult/payResult?totalPrice=${newOrder.amount}&orderSn=${newOrder.orderSn}&id=${newOrder.id}` })
            // hideLoading(showToast('支付地址获取失败'))
            return
          }
          const tradeNo = newOrder.payUrl.match(/(\d{32})/ig)[0]
          // 获取预交易单
          this.props.dispatch({
            type: 'orderConfirm/getPrepayAction',
            payload: {
              tradeNo,
              wxCode,
              appId: APP_ID
            },
            callback: ({ ok, data }) => {
              hideLoading()
              if (ok) {
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
        } else {
          hideLoading()
          const { data = {} } = res
          showToast(data.message)
          const error = res.header['X-shopApp-error']
          let errMsg = ''
          if (error === 'error.businessHoursError') {
            showToast('商家不在营业状态,请稍后下单')
            return
          } if (error === 'error.merchantNumberOut') {
            showToast('商品超出营业数量,请重新下单')
          } else if (error === 'error.isWholeClose') {
            showToast('全站打烊,请明天再来')
          } else if (error === 'error.not-login') { // error.hongBao-error
            showToast('用户未登录,请登录账号')
            navToPage('/pages/login/login')
          } else if (error === 'error.hongBao-error') { //
            showToast('优惠券不可使用')
          } else if (error === 'error.soldOut') {
            const errorMsg = (res.header['X-shopApp-params']).split(',')
            errMsg = errMsg.substring(0, errMsg.length - 1)
            showToast('购买数量已超过库存数,请重新选择商品数量')
            // showToast(`${errorMsg}的购买数量已超过库存数,请重新选择商品`);
          } else if (error === 'error.exceed-limit-num') {
            showToast('购买的商品数量超出最大购买数量')
          }
        }
      }
    })
  }

  // 支付第一步
  getUserInfo = userInfo => {
    // Taro.redirectTo({url: "/pages/orderDetail/orderDetail"});
    // return;
    const inputData = this.formPartnerOrder() ? true : this._checkSubmit()
    if (!inputData) {
      return
    }
    const root = this
    if (userInfo.detail.userInfo) { // 同意
      this.setState({
        payModal: false
      })
      wx.login({
        success(res) {
          // console.log(res);
          root.wxCode = res.code
          if (!root.judgeIsStoredPay()) {
            root.saveOrder()
          }
        }
      })
    } else { // 拒绝,保持当前页面，直到同意
      hideLoading()
    }
  }

  // 判断是否是储值支付
  judgeIsStoredPay = () => {
    const { payType } = this.state
    if (payType === PAY_STORED) {
      Taro.eventCenter.trigger('openPasswordModal', true)
      return true
    }
    return false
  }

  // 检测是否可以提交支付,返回填写数据的封装
  _checkSubmit = () => {
    const {
      goodsDetail,
      userAddress,
      currentTab,
      confirmCurrentTime,
      reservationTime,
      deliveryTime,
      happyPlayPeopleNum,
      idCard,
      account
    } = this.state
    const phoneReg = /^1\d{10}$/
    const idCardReg = /^(^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$)|(^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$)$/
    const nameReg = /^[\u4E00-\u9FA5]{2,4}$/
    const shopDish = goodsDetail.shopDish || {}
    if (currentTab.value === GOODS_COMMODITY) { // 到店消费
      if (!nameReg.test(userAddress.userName)) {
        showToast('姓名必须2个字符及以上')
        return false
      }
      if (!validatePhone(userAddress.phone)) {
        showToast('电话格式有误')
        return false
      }
      if (happyPlayPeopleNum && happyPlayPeopleNum.length >= 1 && goodsDetail.repeatFields) {
        for (let i = 0; i < happyPlayPeopleNum.length; i++) {
          const ele = happyPlayPeopleNum[i]
          if (!ele.name) {
            showToast(`请填写客户${i + 1}的名字`)
            return false
          }
          if (!nameReg.test(ele.name)) {
            showToast(`客户${i + 1}的名字需是中文格式`)
            return false
          }
          if (!phoneReg.test(ele.mobile)) {
            showToast(`请正确填写客户${i + 1}的手机号`)
            return false
          }
          if (!idCardReg.test(ele.idcard)) {
            showToast(`请正确填写客户${i + 1}的身份证号码`)
            return false
          }
        }
      }
      if (goodsDetail.requireDay === 1 && !reservationTime) {
        showToast('预约时间必须填写')
        return false
      }
      if (goodsDetail.requireIdcard === 1 && !idCardReg.test(idCard)) {
        showToast('请填写正确的身份证号')
        return false
      }
      if (goodsDetail.requireRecharge && !account) {
        showToast('请填写充值账号')
        return false
      }
      return true
    }
    if (currentTab.value === GOODS_TICKET || currentTab.value === GOODS_TAKE_OUT) { // 快递到家或者外卖配送到家,都需要选择地址
      if (!objNotNull(userAddress)) {
        showToast('地址必须选择')
        return false
      }
      if (goodsDetail.fresh === 1 && currentTab.value === GOODS_TICKET && !deliveryTime) {
        showToast('送达时间必须选择')
        return false
      }
      if (currentTab.value === GOODS_TAKE_OUT && !objNotNull(confirmCurrentTime)) {
        showToast('送达时间必须选择')
        return false
      }
      return true
    }
  }

  // 判断是否来自于合伙人那边的订单
  formPartnerOrder = () => this.state.formPage === 'partnerOrder'

  // 从其他页面返回回调函数
  goBackCll = params => {
    this.setState({ remark: params })
  }

  // 选择时间, 填写身份证号码
  makeOrderInfo = (type, e) => {
    this.setState({
      [type]: e.detail.value
    })
  }

  // 余额支付
  balancePay = () => {
    const { balance } = this.state
    if (this.getTotalPrice() > balance) return
    this.setState({
      payType: 0
    })
  }

  // 乐玩
  inputHappyPlayPeople = (type, index, e) => {
    const { happyPlayPeopleNum } = this.state
    const template = JSON.parse(JSON.stringify(happyPlayPeopleNum))
    template[index][type] = e.detail.value
    this.setState({
      happyPlayPeopleNum: template
    })
  }

  // 关闭支付
  closePayment = () => {
    this.setState({
      payBoxVisible: false
    })
  }

  render() {
    const {
      gender,

      showRedPackModal,
      currentRedPackage,
      buyNums,

      merchantInfo,
      goodsDetail,

      userAddress,
      confirmRedPackage = {},
      usableRedPackage,
      unUsableRedPackage,
      formPage,

      currentTab,
      tabs,
      showSelectTimeModal,
      remark,
      takeOutTimes,
      tempCurrentTakeDate,
      tempCurrentTime,
      confirmCurrentTime,
      reservationTime,
      idCard,
      deliveryTime,
      payType,
      payModal,
      isPrize,
      balance,
      isBuyCard,
      limitPrice,
      legendsCardInfo: { price },
      hasLegendsCard,
      buyEarn,
      happyPlayPeopleNum,
      payBoxVisible
    } = this.state
    const shopDish = goodsDetail.shopDish || {}
    const shopDishSkus = shopDish.currentSku ? shopDish.currentSku : shopDish.shopDishSkus && shopDish.shopDishSkus.length > 0 && shopDish.shopDishSkus[0] || {}
    const { ajaxLoading = {} } = this.props

    if (!objNotNull(shopDish)) {
      return <View />
    }
    // console.log(this.state.userAddress.userName);
    let takeTimes = []
    if (objNotNull(this.state.tempCurrentTakeDate) && this.state.tempCurrentTakeDate.times.length > 0) {
      takeTimes = this.state.tempCurrentTakeDate.times
    }
    const notFormDine = this.$router.params.from !== 'dine'
    return (
      <Block>
        <View className="flex-col order-confirm-wrap">
          <View className="flex1 flex-col content-wrap">
            {
              !(this.formPartnerOrder())
              && (
                <View className="header-area">
                  {
                    tabs.length > 1
                    && (
                      <View className="flex-row flex-ae order-type-tabs">
                        {
                          tabs.map((o, i) => (
                            <View
                              key={i}
                              className={`flex1 order-type-item ${currentTab.value === o.value ? 'active' : ''}`}
                              onClick={() => {
                                this.setState({
                                  currentTab: o,
                                  confirmRedPackage: {}
                                }, () => {
                                  this.calculateUsableRedPack()
                                })
                              }}
                            >
                              {o.label}
                            </View>
                          ))
                        }
                      </View>
                    )
                  }
                  {
                    objNotNull(currentTab)
                    && (
                      <View className="header">
                        {
                          currentTab.value === GOODS_TAKE_OUT && !latelyMerchant(goodsDetail.dishMerchantShippingInfo, getUserLocation()).isDeliveryRange ? (
                            <View className="againPosition flex-col flex-sa flex-ac">
                              <Text className="title">您当前位置超出了商家配送范围了哦~</Text>
                              <View
                                className="againBtn"
                                onClick={() => {
                                  const { latitude, longitude } = getUserLocation()
                                  Taro.navigateTo({
                                    // 传递当前用户位置
                                    url: `/pages/mapRange/mapRange?latitude=${latitude}&longitude=${longitude}&range=${JSON.stringify(goodsDetail.dishMerchantShippingInfo)}&orderConfirm=true`
                                  })
                                }}
                              >
                                  重新定位
                              </View>
                            </View>
                          )
                            // 外卖到家和快递到家
                            : (currentTab.value === GOODS_TICKET || currentTab.value === GOODS_TAKE_OUT)
                              ? (
                                <Block>
                                  {
                                  objNotNull(userAddress)
                                    ? (
                                      <View
                                        className="flex-row flex-ac flex-sb address-wrap"
                                        hoverClass="hover"
                                        hoverStartTime={10}
                                        hoverStayTime={100}
                                        onClick={this.onChangeAddress.bind(this)}
                                      >
                                        <View className="flex1 left">
                                          <View
                                            className="name"
                                          >
                                            {`${`${userAddress.userName}  ${userAddress.phone}`}`}
                                          </View>
                                          <View className="address">
                                            {
                                              userAddress.enabled
                                              && <Text className="def-tag">默认</Text>
                                            }
                                            {`${userAddress.address}${userAddress.detailAddress}`}
                                          </View>
                                        </View>
                                        <IconFont value="icon-arrow-right-copy-copy" size={36} />
                                      </View>
                                    )
                                    : (
                                      <View className="flex-row flex-ac flex-jc add-addr-wrap">
                                        <Button
                                          className="add-address-btn"
                                          hoverClass="hover"
                                          onClick={this.onChangeAddress.bind(this)}
                                        >
                                          <Text className="plus">+</Text>
                                          <Text>
                                            {
                                              currentTab.value === GOODS_TAKE_OUT
                                                ? '添加配送地址' : '添加收货地址'
                                            }
                                          </Text>
                                        </Button>
                                      </View>
                                    )
                                }
                                  {
                                  // 外卖到家,需要选择送到时间
                                  currentTab.value === GOODS_TAKE_OUT
                                  && (
                                    <View className="flex-row flex-ac flex-sb time-select">
                                      <Text className="mei-tag">美团专送</Text>
                                      <View
                                        className="flex-row flex-ac send-time"
                                        onClick={() => {
                                          // 重新计算时间
                                          this.makeSendTimes(true)
                                        }}
                                      >
                                        <Text>送达时间</Text>
                                        <Text
                                          className={`time ${!confirmCurrentTime.time ? 'gray' : 'black'}`}
                                        >
                                          {
                                            !confirmCurrentTime.time ? '请选择时间' : `${confirmCurrentTime.time}${confirmCurrentTime.showDate ? confirmCurrentTime.showDate : ''}`
                                          }
                                        </Text>
                                        <IconFont value="icon-arrow-right-copy-copy" size={36} />
                                      </View>
                                    </View>
                                  )
                                }
                                  {
                                  // 配送, 需要选择送达时间
                                  currentTab.value === GOODS_TICKET && goodsDetail.fresh === 1
                                  && (
                                    <View className="flex-row flex-ac flex-sb item">
                                      <View className="title">送达时间：</View>
                                      <Picker
                                        mode="date"
                                        onChange={this.makeOrderInfo.bind(this, 'deliveryTime')}
                                      >
                                        <View className="reservationTime flex-row flex-ac flex-sb">
                                          {deliveryTime || '请选择送达时间'}
                                        </View>
                                      </Picker>
                                    </View>
                                  )
                                }
                                </Block>
                              )
                              : currentTab.value === GOODS_COMMODITY
                                ? (
                                  <Block>
                                    <View className="flex-row flex-sb item">
                                      <View className="title">预订人姓名：</View>
                                      <View className="flex1">
                                        <Input
                                          placeholder="请输入预定人姓名"
                                          className="inpt"
                                          placeholderClass="inpt-placeholder"
                                          maxLength={10}
                                          value={this.state.userAddress.userName}
                                          type="text"
                                          onInput={this.inputChange.bind(this, 'userName')}
                                        />
                                        <View className="flex-row gender-wrap">
                                          <Button
                                            className={`gender-btn ${gender === 'WOMEN' ? 'active' : ''}`}
                                            onClick={this.choseGender.bind(this, 'WOMEN')}
                                          >
                                          女士
                                          </Button>
                                          <Button
                                            className={`gender-btn ${gender === 'MEN' ? 'active' : ''}`}
                                            onClick={this.choseGender.bind(this, 'MEN')}
                                          >
                                          先生
                                          </Button>
                                        </View>
                                      </View>
                                    </View>
                                    <View className="flex-row flex-ac flex-sb item">
                                      <View className="title">预订人号码：</View>
                                      <Input
                                        placeholder="请输入手机号码"
                                        className="flex1 inpt"
                                        type="number"
                                        placeholderClass="inpt-placeholder"
                                        maxLength={11}
                                        value={userAddress.phone}
                                        onInput={this.inputChange.bind(this, 'phone')}
                                      />
                                    </View>
                                    {
                                    goodsDetail.requireRecharge && (
                                      <View className="flex-row flex-ac flex-sb item">
                                        <View className="title">充值账号：</View>
                                        <Input
                                          placeholder={`请输入您的${TOP_UP_ACCOUNT[goodsDetail.requireRecharge]}账号`}
                                          className="flex1 inpt"
                                          placeholderClass="inpt-placeholder"
                                          onInput={this.makeOrderInfo.bind(this, 'account')}
                                        />
                                      </View>
                                    )
                                  }
                                    {
                                    goodsDetail.requireDay === 1
                                    && (
                                    <View className="flex-row flex-ac flex-sb item">
                                      <View className="title">预约时间：</View>
                                      <Picker
                                        mode="date"
                                        onChange={this.makeOrderInfo.bind(this, 'reservationTime')}
                                        start={dayjs().add((goodsDetail.advanceDay || 0) + 1, 'day').format('YYYY-MM-DD')}
                                      >
                                        <View className="reservationTime flex-row flex-ac flex-sb">
                                          {reservationTime || '请选择日期'}
                                        </View>
                                      </Picker>
                                    </View>
                                    )
                                  }
                                    {
                                    goodsDetail.requireIdcard === 1
                                    && (
                                    <View className="flex-row flex-ac flex-sb item">
                                      <View className="title">身份证号码：</View>
                                      <Input
                                        placeholder="请输入身份证号码"
                                        className="flex1 inpt"
                                        // type={"number"}
                                        placeholderClass="inpt-placeholder"
                                        maxLength={18}
                                        value={idCard}
                                        onInput={this.makeOrderInfo.bind(this, 'idCard')}
                                      />
                                    </View>
                                    )
                                  }
                                    {
                                    happyPlayPeopleNum && happyPlayPeopleNum.length >= 1 && goodsDetail.repeatFields && (
                                      <View className="peopleNum">
                                        {
                                          happyPlayPeopleNum.map((ele, index) => (
                                            <View className="peopleItem" key={index}>
                                              <Text className="peopleTitle">{`游客(${index + 1})`}</Text>
                                              <View className="flex-row flex-ac flex-sb peopleIpt">
                                                <View className="title">姓名：</View>
                                                <Input
                                                  placeholder="请输入姓名"
                                                  className="flex1 inpt"
                                                  placeholderClass="inpt-placeholder"
                                                  onInput={e => this.inputHappyPlayPeople('name', index, e)}
                                                />
                                              </View>
                                              <View className="flex-row flex-ac flex-sb peopleIpt">
                                                <View className="title">电话：</View>
                                                <Input
                                                  placeholder="请输入电话"
                                                  className="flex1 inpt"
                                                  placeholderClass="inpt-placeholder"
                                                  type="number"
                                                  onInput={e => this.inputHappyPlayPeople('mobile', index, e)}
                                                />
                                              </View>
                                              <View className="flex-row flex-ac flex-sb peopleIpt">
                                                <View className="title">身份证：</View>
                                                <Input
                                                  placeholder="请输入身份证"
                                                  className="flex1 inpt"
                                                  placeholderClass="inpt-placeholder"
                                                  // type={"number"}
                                                  onInput={e => this.inputHappyPlayPeople('idcard', index, e)}
                                                />
                                              </View>
                                            </View>
                                          ))
                                        }
                                      </View>
                                    )
                                  }
                                  </Block>
                                )
                                : (
                                  <View
                                    style="font-size:20px;text-align:center;padding:20px;color:#999;"
                                  >
                                    {currentTab.value === GOODS_PICK_UP ? '暂不支持外卖自取' : '商品类型未知,暂时不能下单'}
                                  </View>
                                )
                        }
                      </View>
                    )
                  }
                  <View className="border-bag" />
                </View>
              )
            }

            {/* 订单费用详情 */}
            <View className="flex1 order-detail">
              <View className="order-detail-in">
                <View className="merchantName">{merchantInfo.merchant_name}</View>
                <View className="flex-row header">
                  <Image
                    className="logo"
                    src={formatAttachPath(shopDish.picture)}
                  />
                  <View className="flex-col flex-sb flex1">
                    <View className="mulBreak goods-name">
                      {shopDish.dishName || '暂无名称'}
                    </View>
                    {
                      shopDish.minOrderCount && shopDish.minOrderCount > 0 && <View className="minCount">{`${shopDish.minOrderCount}件起购`}</View>
                    }
                    <View className="flex-row flex-ae">
                      <View className="flex1 price">
                        <Text className="rmb">¥</Text>
                        <Text className="money">{formatCurrency(isPrize ? shopDishSkus.originalPrice : (shopDishSkus.memberPrice !== null && shopDishSkus.memberPrice !== undefined && !hasLegendsCard ? shopDishSkus.memberPrice : shopDishSkus.price))}</Text>
                        <Text
                          className="goods-name gray"
                        >
                          {shopDish.selectedSkuAndAttrStr}
                        </Text>
                      </View>
                      {
                        !isPrize && (
                          <View className="flex-row flex-ac add-goods-wrap">
                            {
                              (buyNums > 1 && shopDish.minOrderCount < buyNums)
                              && (
                                <View
                                  className="btn cut"
                                  hoverClass="hover"
                                  hoverStartTime={10}
                                  hoverStayTime={100}
                                  onClick={this.subGoods.bind(this)}
                                >
                                  -
                                </View>
                              )
                            }
                            <View className="part">{buyNums}</View>
                            {
                              !(this.formPartnerOrder())
                              && (
                                <View
                                  className="btn add"
                                  hoverClass="hover"
                                  hoverStartTime={10}
                                  hoverStayTime={100}
                                  onClick={this.addGoods.bind(this, shopDishSkus)}
                                >
                                  +
                                </View>
                              )
                            }
                          </View>
                        )
                      }
                    </View>
                  </View>
                </View>
                <View className="fee-wrap">
                  <View className="flex-row flex-sb flex-ac item">
                    <Text className="name">小计</Text>
                    <Text className="price">
                      ￥
                      {formatCurrency(this.getTotalPrice(true))}
                    </Text>
                  </View>
                  {
                    // 快递商品运费
                    currentTab.value === GOODS_TICKET
                    && (
                      <View className="flex-row flex-sb flex-ac item">
                        <Text className="name">运费</Text>
                        <Text
                          className="price-sub"
                        >
                          ￥
                          {shopDish.deliverFee ? shopDish.deliverFee : 0}
                        </Text>
                      </View>
                    )
                  }
                  {
                    // 外卖到家餐盒费和配送费
                    currentTab.value === GOODS_TAKE_OUT
                    && (
                      <Block>
                        <View className="flex-row flex-sb flex-ac item">
                          <Text className="name">餐盒费</Text>
                          <Text
                            className="price-sub"
                          >
                            ￥
                            {!shopDishSkus.freeBoxPrice ? formatCurrency(shopDishSkus.boxPrice * buyNums) : '0'}
                          </Text>
                        </View>
                        <View className="flex-row flex-sb flex-ac item">
                          <Text className="name">配送费</Text>
                          <Text
                            className="price-sub"
                          >
                            ￥
                            {merchantInfo.shippingPrice ? formatCurrency(merchantInfo.shippingPrice) : '0'}
                          </Text>
                        </View>
                      </Block>
                    )
                  }
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
                        {confirmRedPackage.amountOfCoupon > 0 ? '已使用1个优惠券' : usableRedPackage.length > 0 ? `${usableRedPackage.length}个优惠券可用` : '暂无可用'}
                      </Text>
                      <IconFont value="icon-arrow-right-copy-copy" size={36} />
                    </View>
                  </View>
                </View>
                <View className="flex-row flex-je flex-ae price-total">
                  {
                    usableRedPackage.length > 0 && confirmRedPackage.amountOfCoupon > 0
                    && (
                      <Text
                        className="discounts"
                      >
                        已优惠￥
                        {formatCurrency(confirmRedPackage.amountOfCoupon)}
                      </Text>
                    )
                  }
                  <Text className="rel">总计</Text>
                  <Text className="rmb">￥</Text>
                  <Text className="money">
                    {formatCurrency(isBuyCard ? this.getTotalPrice() - limitPrice : this.getTotalPrice())}
                  </Text>
                </View>
                {
                  hasLegendsCard && notFormDine && (
                    <View className="advertImgBox flex-row flex-ac flex-sb ">
                      <View className="cardLogo" />
                      <View>
                        <View className="openCard">开通会员卡，预计一年能省￥3542</View>
                        <Text className="counteract">下单5次即可抵消开卡余额</Text>
                      </View>
                      <View className="flex-col flex-ac">
                        <View className="limitPrice">限时价</View>
                        <View className="flex-row flex-ac">
                          <Text className="original">
                            ￥
                            {price}
                          </Text>
                          <Text className="price">
                            ￥
                            {limitPrice}
                          </Text>
                          {
                            isBuyCard
                              ? <IconFont value="imgHook" h={36} w={36} onClick={this.handleBuyCard} />
                              : <View className="notHook" onClick={this.handleBuyCard} />
                          }
                        </View>
                        <View className="economize">
                          本单省
                          <Text>{toDecimal(this.getTotalPrice() * buyEarn)}</Text>
                          元
                        </View>
                      </View>
                    </View>
                  )
                }
                
              </View>
            </View>
          
          </View>

          {
            // 外卖到家,需要有订单备注
            currentTab.value === GOODS_TAKE_OUT
            && (
              <View
                className="flex-row flex-ac flex-sb order-remark"
                onClick={() => {
                  navToPage(`/package/orderRemark/orderRemark?oldRemark=${remark}`, false)
                }}
              >
                <Text className="title">订单备注</Text>
                <View className="flex1 flex-row flex-ac flex-je">
                  <View
                    className={`remark flex1 ellipsis ${trimAllSpace(remark).length === 0 ? 'gray' : ''}`}
                  >
                    {trimAllSpace(remark).length > 0 ? remark : '您的口味、偏好等'}
                  </View>
                  <IconFont value="icon-arrow-right-copy-copy" size={36} />
                </View>
              </View>
            )
          }
          {
            notFormDine && (
            <Button
              className="flex-row flex-ac flex-jc footer-wexin-pay"
              hoverClass="hover"
              // open-type="getUserInfo"
              disabled={!(currentTab.value) || (ajaxLoading.effects['orderConfirm/getPrepayAction'] || ajaxLoading.effects['orderConfirm/saveShopOrderAction'])}
              // onGetUserInfo={this.getUserInfo}
              loading={ajaxLoading.effects['orderConfirm/getPrepayAction'] || ajaxLoading.effects['orderConfirm/saveShopOrderAction']}
              onClick={() => {
                this.setState({
                  payBoxVisible: true
                })
              }}
            >
              确认支付
            </Button>
            )
          }
          {
            !notFormDine && (
              <Button
                className="flex-row flex-ac flex-jc footer-wexin-pay"
                hoverClass="hover"
                open-type="getUserInfo"
                disabled={!(currentTab.value) || (ajaxLoading.effects['orderConfirm/getPrepayAction'] || ajaxLoading.effects['orderConfirm/saveShopOrderAction'])}
                onGetUserInfo={this.getUserInfo}
                loading={ajaxLoading.effects['orderConfirm/getPrepayAction'] || ajaxLoading.effects['orderConfirm/saveShopOrderAction']}
              >
                <Text>立即领奖</Text>
                <Text className="money">
                  ¥
                  {formatCurrency(this.getTotalPrice())}
                </Text>
              </Button>
            )
          }

        </View>

        {/* 余额支付弹窗 */}
        <AtModal isOpened={payModal}>
          <AtModalContent>
            <View className="modalClose">
              <AtIcon
                value="close-circle"
                size="20"
                color="#BFBFBF"
                onClick={() => {
                  this.setState({
                    payModal: false
                  })
                }}
              />
            </View>
            <View className="payModalTitle">余额零钱支付</View>
            <View className="payMoney">
              <Text className="payUnit">￥</Text>
              <Text className="payMoneyNum">
                {' '}
                {this.getTotalPrice()}
              </Text>
            </View>
            <Button
              className="comfirmPay"
              open-type="getUserInfo"
              // disabled={!(currentTab.value) || (ajaxLoading.effects['orderConfirm/getPrepayAction'] || ajaxLoading.effects['orderConfirm/saveShopOrderAction'])}
              onGetUserInfo={this.getUserInfo}
              // loading={ajaxLoading.effects['orderConfirm/getPrepayAction'] || ajaxLoading.effects['orderConfirm/saveShopOrderAction']}
            >
              确认支付
            </Button>
          </AtModalContent>
        </AtModal>
        {/* 使用红包弹窗 */}
        <AtFloatLayout
          isOpened={showRedPackModal}
          onClose={() => { this.setState({ showRedPackModal: false }) }}
          className="redModal"
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
            <View
              // scrollY
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
            </View>
          </View>
        </AtFloatLayout>
        
        
        {/* 选择送达时间弹层组件 */}
        <AtFloatLayout
          isOpened={showSelectTimeModal}
          onClose={() => {
            this.setState({
              tempCurrentTime: {},
              tempCurrentTakeDate: {},
              showSelectTimeModal: false
            })
          }}
        >
          <View className="flex-col package-wrap">
            <View className="flex-row flex-ac flex-sb modal-header">
              <Button
                className="title-btn cancel hide"
                hoverClass="hover"
                onClick={() => {
                  this.setState({
                    tempCurrentTime: {},
                    tempCurrentTakeDate: {},
                    showSelectTimeModal: false
                  })
                }}
              >
                取消
              </Button>
              <View className="flex1 title">请选择送达时间</View>
              <Button
                className={`title-btn confirm ${!tempCurrentTime.time ? 'disabled' : ''}`}
                hoverClass="hover"
                disabled={!tempCurrentTime.time}
                onClick={() => {
                  this.setState({
                    confirmCurrentTime: { ...tempCurrentTime },
                    tempCurrentTakeDate: {},
                    showSelectTimeModal: false
                  })
                }}
              >
                确定
              </Button>
            </View>
            <View className="flex-row time-wrap">
              <Block>
                <View className="left">
                  {
                    takeOutTimes.length > 0 && takeOutTimes.map((o, i) => (
                      <View
                        key={i}
                        className={`item ${tempCurrentTakeDate.realDate === o.realDate ? 'active' : ''}`}
                        onClick={() => {
                          if (this.state.tempCurrentTakeDate.realDate !== o.realDate) {
                            this.setState({
                              tempCurrentTakeDate: o,
                              tempCurrentTime: {
                                showDate: i > 0 ? o.date : '',
                                date: o.date,
                                realDate: o.realDate,
                                time: o.times[0]
                              }
                            })
                          }
                        }}
                      >
                        {o.date}
                      </View>
                    ))
                  }
                </View>
                <View className="flex1 right">
                  {
                    takeTimes.length > 0 && takeTimes.map((o, i) => (
                      <View
                        key={i}
                        className={`item ${(tempCurrentTime.realDate === tempCurrentTakeDate.realDate) && (tempCurrentTime.time === o) ? 'active' : ''}`}
                        onClick={() => {
                          this.setState({
                            tempCurrentTime: {
                              ...tempCurrentTime,
                              // realDate: tempCurrentTakeDate.realDate,
                              // date: tempCurrentTakeDate.date,
                              time: o
                            }
                          })
                        }}
                      >
                        {o}
                      </View>
                    ))
                  }
                </View>
              </Block>
            </View>
          </View>
        </AtFloatLayout>
        {
          notFormDine && (
            <Payment
              createOrder={this.saveOrder}
              payBoxVisible={payBoxVisible}
              paymentAmount={this.getTotalPrice()}
              payment={payType}
              onChange={val => {
                this.setState({
                  payType: val
                })
              }}
              getUserInfo={this.getUserInfo}
              closePayment={this.closePayment}
            />
          )
        }
      </Block>
    )
  }
}

export default PackageOrderConfirm
