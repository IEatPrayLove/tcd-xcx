import Taro, { Component } from '@tarojs/taro'
import {
  Button, Input, ScrollView, Text, View
} from '@tarojs/components'
import './takeOutConfirm.scss'
import { connect } from '@tarojs/redux'
import {
  AtFloatLayout
} from 'taro-ui'
import FloatLayout from '../../../components/FloatLayout/FloatLayout'
import {
  CAR_TYPE_SHOP,
  KEY_RECEIVE,
  KEY_TASK_OUT, COUPON_CONDITION,
  ORDER_CONFIRM_TABS, SHOP_MODE_ENUM, PAY_WECHAT, PAY_STORED, PAYMENT
} from '../../../config/config'
import {
  dateFormatWithDate,
  formatAttachPath,
  getUserLocation,
  getPlatFormId,
  hideLoading,
  locationArea,
  navToPage,
  needLogin,
  objNotNull,
  readBuyCar,
  saveTempBuyCar,
  showLoading,
  showToast,
  toDecimal, saveUserDetail,
  typeAnd, formatCurrency, getUserDetail, getUserDistributor, getShareInfo, judgeLegendsCard
} from '../../../utils/utils'
import { APP_ID } from '../../../config/baseUrl'
import MyImage from '../../../components/MyImage/MyImage'
import IconFont from '../../../components/IconFont/IconFont'
import Payment from '../../../components/Payment/Payment'

// const APP_ID = getAppId()

/**
 * 订单确认
 */
// @authenticate
@connect(({ common, index, loading, orderDishes }) => ({
  userInfo: common.userInfo,
  platformSystemSetting: orderDishes.platformSystemSetting,
  ajaxLoading: loading,
  curMerchantInfo: index.curMerchantInfo
}))
class OrderConfirm extends Component {
  config = {
    navigationBarTitleText: '确认订单'
    // navigationBarTextStyle: 'black',
    // navigationBarBackgroundColor: '#ffffff'
  }

  constructor() {
    super()
    this.state = {
      currentTab: {},

      remark: '',
      showRedPackModal: false, // 使用红包弹层
      showTakeOutTimeModal: false, // 选择外卖预定时间弹层
      showEatInTimeModal: false, // 选择堂食预定时间弹层
      currentRedPackage: {}, // 当前选中红包
      currentTakeOutTime: {
        date: '',
        time: ''
      }, // 当前选中的外卖预定时间
      currentEatInTime: {
        date: '',
        time: ''
      }, // 当前选中的堂食预定时间

      times: null, // 送餐时间组

      confirmTakeOutTime: {}, // 确定选中的外卖时间
      confirmEatInTime: {}, // 确定的堂食预定时间

      fullMinusActivities: null, // 满减活动
      carInfo: {
        dishes: {},
        merchant: {},
        moneyInfo: {
          totalNums: 0,
          totalPrice: 0,
          minusMoney: 0,
          fullMinusMoney: 0,
          totalPackFee: 0,
          bonusMoney: 0,
          amount: 0
        }
      },
      userAddress: {},
      bonus: [], // 可用红包
      noBonus: [], // 不可用红包
      userLocation: getUserLocation(),
      merchantRange: [], // 门店范围
      sendSet: {},
      isInArea: false,
      rangeCode: '',
      sendPrice: 0,
      isFullMinus: true,
      usableRedPackage: [],
      unUsableRedPackage: [],
      payment: PAY_WECHAT,
      redPackage: [],
      payBoxVisible: false,
      shippingInfo: readBuyCar().shippingInfo
    }
    this.wxCode = ''
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: '#ffffff'
    })
    const carInfo = readBuyCar()
    carInfo.moneyInfo = {
      totalNums: 0,
      totalPrice: 0,
      minusMoney: 0,
      totalPackFee: 0,
      fullMinusMoney: 0,
      bonusMoney: 0
    }
    this.setState({ carInfo }, () => {
      this.calculateCarMoney()
    })
    const { shippingRange } = (carInfo.merchant.shippingInfoModel || carInfo.merchant.shippingInfoModel !== null) ? carInfo.merchant.shippingInfoModel : {}
    this.setState({
      merchantRange: shippingRange
    })
  }

  componentDidMount() {
    this.makeSendTimes()
  }

  componentDidShow() {
    // 选项卡切换
    // const { merchant } = this.state.carInfo

    // 获取用户默认地址
    this.getSendSetAction()
    this.getUserCanUseBonus()
  }

  // 获取自配送信息
  getSendSetAction = () => {
    const { carInfo } = this.state
    const { useMtShipping, shippingRange } = (carInfo.merchant.shippingInfoModel || carInfo.merchant.shippingInfoModel !== null) ? carInfo.merchant.shippingInfoModel : {}
    this.props.dispatch({
      type: 'takeOutConfirm/getSendSetAction',
      payload: { merchantNo: carInfo.merchant.merchantNo },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            sendSet: data
          }, () => {
            this.getUserDefaultAddress()
            const { currentTab } = this.state
            if (!objNotNull(currentTab)) {
              if ((this.state.sendSet.shippingType === 2) || (useMtShipping && shippingRange && (carInfo.merchant.platFormMerchantDTO && (carInfo.merchant.platFormMerchantDTO.outerOrderMod & SHOP_MODE_ENUM.SHIPPING.key)) === SHOP_MODE_ENUM.SHIPPING.key)) {
                this.setState({
                  currentTab: ORDER_CONFIRM_TABS[0]
                })
              } else if (carInfo.merchant.platFormMerchantDTO.pickUpSelf) {
                this.setState({
                  currentTab: ORDER_CONFIRM_TABS[1]
                })
              }
            }
          })
          const areaList = []
          data.priceAndRangeDtoList.map((item, index) => {
            if (item.range !== null) {
              if (locationArea(JSON.parse(item.range), getUserLocation())) {
                areaList.push(true)
              }
            }
          })
          if (areaList.length > 0) {
            this.setState({
              isInArea: true
            })
          } else {
            this.setState({
              isInArea: false
            })
          }
        }
      }
    })
  }

  // 计算价格
  calculateCarMoney = () => {
    const {
      carInfo, fullMinusActivities, currentTab, redPackage, shippingInfo
    } = this.state
    // 购物车数据计算
    const carList = Object.values(carInfo.dishes) || []
    let totalNums = 0 // 点餐总分数
    let totalPrice = 0 // 总价格
    let minusMoney = 0 // 优惠费用（所有的）
    let fullMinusMoney = 0 // 满减
    let shippingMoney = this.state.sendSet.shippingType === 2 ? this.state.sendPrice : shippingInfo && shippingInfo.shippingPrice ? shippingInfo.shippingPrice : 0
    const bonusMoney = carInfo.moneyInfo.bonusMoney ? carInfo.moneyInfo.bonusMoney : 0; let // 红包
      totalPackFee = 0 // 餐盒费
    // 获取用户会员信息
    const { islandUserMemberDTO } = getUserDetail()
    // 如果是会员  judge ==> true 如果不是会员   judge ==>false
    const judge = judgeLegendsCard(islandUserMemberDTO)
    if (carList.length > 0) {
      totalNums = carList.map(o => o.num).reduce((o1, o2) => (o1 + o2)) // 总分数计算

      if (judge) {
        totalPrice = carList.map(o => (o.num * (o.sku.memberPrice ? o.sku.memberPrice : o.sku.price))).reduce((o1, o2) => (o1 + o2)) // 总价格计算(可能会比较复杂)
      } else {
        totalPrice = carList.map(o => (o.num * o.sku.price)).reduce((o1, o2) => (o1 + o2)) // 总价格计算(可能会比较复杂)
      }

      totalPackFee = carList.map(o => (!o.sku.freeBoxPrice ? (o.num * o.sku.boxNum * o.sku.boxPrice) : 0)).reduce((o1, o2) => (o1 + o2)) // 总餐盒费计算
      totalPrice = toDecimal(totalPrice)
      totalPackFee = toDecimal(totalPackFee) ? toDecimal(totalPackFee) : 0
    }
    // console.log("餐盒费", totalPackFee);
    // 满减活动
    if (carInfo.merchant.openActivity && fullMinusActivities && fullMinusActivities.openActivity) {
      if (fullMinusActivities.offerActivity) {
        if (fullMinusActivities && fullMinusActivities.fullReductionlist) {
          fullMinusActivities.fullReductionlist.forEach(item => {
            if (totalPrice >= item.fullMoney) {
              minusMoney = parseFloat(minusMoney) + parseFloat(item.cutMoney)
              fullMinusMoney = item.cutMoney
            }
          })
        }
      } else {
        let isFull = true
        carList.map(item => {
          if (item.sku.originalPrice > item.sku.price) {
            isFull = false
            this.setState({
              isFullMinus: false
            })
          }
        })
        if (isFull && fullMinusActivities && fullMinusActivities.fullReductionlist) {
          fullMinusActivities.fullReductionlist.forEach(item => {
            if (totalPrice >= item.fullMoney) {
              minusMoney = parseFloat(minusMoney) + parseFloat(item.cutMoney)
              fullMinusMoney = item.cutMoney
            }
          })
        }
      }
    }
    // 加上红包
    minusMoney = parseFloat(minusMoney) + parseFloat(bonusMoney)

    // 订单类型 如果堂食不加包装费 不加配送费
    if (currentTab.tag === 'EATNOW') {
      totalPackFee = 0
      shippingMoney = 0
    }

    // 订单类型 如果自取 不加配送费
    if (currentTab.tag === 'PICK_UP') {
      shippingMoney = 0
    }

    const amount = toDecimal(parseFloat(totalPrice || 0) + parseFloat(totalPackFee || 0) + parseFloat(shippingMoney || 0) - parseFloat(minusMoney || 0))
    // console.log(amount);
    this.setState({
      carInfo: {
        ...this.state.carInfo,
        moneyInfo: {
          totalNums,
          totalPrice,
          minusMoney,
          fullMinusMoney,
          totalPackFee,
          shippingMoney,
          bonusMoney,
          amount: amount >= 0 ? amount : 0
        }
      }
    }, () => {
      if (!this.state.fullMinusActivities) {
        this.getShopFullMinusActivity()
      }
    })
    this.calculatorCoupon(redPackage)
  }

  /**
   * 获取用户默认地址
   * */
  getUserDefaultAddress = () => {
    const { sendSet, carInfo } = this.state
    this.props.dispatch({
      type: 'takeOutConfirm/getUserDefaultAddressAction',
      payload: {},
      callback: ({ ok, data }) => {
        if (ok) {
          if (data) {
            const [longitude, latitude] = data.coordinate.split(',')
            const { currentTab } = this.state
            // console.log(currentTab, data)
            if (currentTab.key === 'ORDER_CONFIRM_TABS') return
            if (sendSet.shippingType === 2) {
              const rangeList = sendSet.priceAndRangeDtoList.filter(item => JSON.parse(item.range) !== null)
              const rangeIn = rangeList.filter(item => locationArea(JSON.parse(item.range), {
                latitude,
                longitude
              }))
              if (rangeIn.length > 0) {
                const nowRangePrice = Math.min.apply(Math, rangeIn.map(o => {
                  return o.sendPrice
                }))
                const nowRange = rangeIn.filter(o => o.sendPrice === nowRangePrice)

                this.setState({
                  rangeCode: nowRange.length > 0 ? nowRange[0].num : '',
                  sendPrice: nowRangePrice,
                  userAddress: data
                }, () => {
                  this.calculateCarMoney()
                })
              }
            } else {
              const { useMtShipping, shippingRange } = (carInfo.merchant.shippingInfoModel || carInfo.merchant.shippingInfoModel !== null) ? carInfo.merchant.shippingInfoModel : {}
              if (!locationArea(shippingRange, {
                latitude,
                longitude
              })) {
                if (Taro.getStorageSync('userAddress') && Taro.getStorageSync('userAddress') !== '' && Taro.getStorageSync('userAddress') !== null) {
                  this.setState({
                    userAddress: JSON.parse(Taro.getStorageSync('userAddress'))
                  })
                } else {
                  this.setState({
                    userAddress: {}
                  })
                }
              } else if (Taro.getStorageSync('userAddress') && Taro.getStorageSync('userAddress') !== '' && Taro.getStorageSync('userAddress') !== null) {
                this.setState({
                  userAddress: JSON.parse(Taro.getStorageSync('userAddress'))
                })
              } else {
                this.setState({ userAddress: data })
              }
            }
          }
        }
      }
    })
  }

  // 判断用户是否在门店配送范围内
  // judgeIsMerchantRange = (range, location) => {
  //     return locationArea(range, location);
  // };
  /**
   * 封装订单
   */
  makeOrder = storedPayParams => {
    const {
      userAddress, currentEatInTime, currentTakeOutTime, currentTab,
      payment, fullMinusActivities, sendSet, shippingInfo, rangeCode, sendPrice, currentRedPackage, remark, carInfo
    } = this.state
    const { merchant, moneyInfo, dishes } = carInfo
    // console.log('用户地址', userAddressList);
    let useDate = ''
    switch (currentTab.tag) {
      case 'NETWORK': // 外卖
        // console.log("单点", currentTakeOutTime);
        if (currentTakeOutTime.time === '立即送餐') {
          useDate = currentTakeOutTime.time
        } else if (currentTakeOutTime.date.slice(0, 2) === '今天') {
          useDate = currentTakeOutTime.time
        } else {
          useDate = [currentTakeOutTime.date, currentTakeOutTime.time].join(' ')
        }
        break
      default:
        useDate = [currentEatInTime.date, currentEatInTime.time].join(' ')
        break
    }
    const shopOrderProducts = []
    const skus = Object.values(dishes)
    skus.forEach(product => {
      const attrs = []
      if (product.attr) {
        const attrIds = Object.keys(product.attr)
        const attrValues = Object.values(product.attr)
        for (const key in attrValues) {
          const name = product.shopDishAttributes.filter(item => (item.id === attrIds[key]))
          attrs.push({
            id: attrIds[key],
            merchantId: merchant.id,
            brandId: merchant.brand,
            name: name && name.length > 0 ? name[0].name : '',
            details: attrValues[key]
          })
        }
      }
      // console.log(product);
      shopOrderProducts.push({
        productType: currentTab.tag === 'NETWORK' ? 2 : 4,
        activityId: product.sku.activityId,
        activityType: product.sku.activityType,
        marketPrice: product.marketPrice,
        packFee: parseFloat(toDecimal(product.num * (product.sku.boxNum * product.sku.boxPrice))),
        productName: product.dishName,
        skuId: product.sku.id,
        productNum: product.num,
        productPrice: product.sku.price,
        imageUrl: product.dishImageUrl && product.dishImageUrl.split(',')[0],
        spec: {
          name: product.sku && product.sku.spec ? product.sku.spec : product.dishName,
          packNum: product.sku && product.sku.boxNum ? product.sku.boxNum : 0,
          packPrice: product.sku && product.sku.boxPrice ? product.sku.boxPrice : 0,
          price: product.sku && product.sku.price ? product.sku.price : 0,
          // "boxNum": product.sku && product.sku.boxNum ? product.sku.boxNum : "",
          boxPrice: product.sku && product.sku.boxPrice ? product.sku.boxPrice : 0,
          freeBoxPrice: product.sku && product.sku.freeBoxPrice ? product.sku.freeBoxPrice : 0
        },
        selfSupportDishPropertyTempList: attrs
      })
    })
    const shopOrderExtendedInfoDTO = {
      customerAddress: userAddress.address + userAddress.detailAddress,
      // "customerCoordinate": "string",
      customerGender: userAddress.gender,
      customerName: userAddress.userName,
      customerPhone: userAddress.phone,
      customerCoordinate: userAddress.coordinate,
      merchantAddress: merchant.merchantDetails.address,
      merchantCoordinate: merchant.merchantDetails.position,
      merchantDistance: 0, // merchant.merchantDetails.discount,
      merchantName: merchant.merchant_name,
      merchantPhone: merchant.merchantDetails.principal_mobile,
      orderSend: useDate,
      receiveId: merchant.receiveAccountId,
      orderRemark: remark,
      orderMark: remark
    }
    const baseOrder = {
      orderSource: currentTab.tag === 'NETWORK' ? 'TAKEAWAY_MEAL' : 'PICK_UP', // 订单来源: PACKAGE(套餐) TAKEAWAY_MEAL(外卖点餐)
      // orderSource: 'TAKEAWAY_MEAL',
      amount: moneyInfo.amount, // toDecimal(parseFloat(moneyInfo.totalPackFee) + parseFloat(moneyInfo.totalPrice)), //(parseFloat(this.state.amount) + parseFloat(this.state.merchant.shippingPrice ? this.state.merchant.shippingPrice : '0') + parseFloat(this.state.packFee)).toFixed(2),//以后端计算为准
      // "discountFee": '',
      merchantId: merchant.id,
      merchantNo: merchant.merchantNo,
      merchantUserId: merchant.userId,
      brandId: merchant.brand,
      // "packFee": moneyInfo.totalPackFee,
      orderState: 'PENDING', // 以后端计算为准
      orderType: currentTab.tag, // 以后端计算为准
      platformId: getPlatFormId(),
      // "platformUserId": plat?plat.createdBy:null,
      printState: 'UNPRINT', // 以后端计算为准
      shopOrderExtendedInfoDTO,
      shopOrderProductInfoDTOS: shopOrderProducts,
      // couponSn: this.state.currentRedPackage.hongBaoSn ? this.state.currentRedPackage.hongBaoSn : null, // todo 红包
      couponId: currentRedPackage.id ? currentRedPackage.id : null,
      fullReductionActivity: fullMinusActivities && fullMinusActivities.fullReductionlist && fullMinusActivities.fullReductionlist.length ? fullMinusActivities : {},
      rangeCode: sendSet.shippingType === 2 ? rangeCode : '',
      sendPrice: sendSet.shippingType === 2 ? sendPrice : shippingInfo && shippingInfo.shippingPrice ? shippingInfo.shippingPrice : 0,
      payWay: PAYMENT[payment],
      ...storedPayParams
    }
    console.log(baseOrder)
    const { code: partnerCode } = getUserDistributor()
    const { code: shareCode } = getShareInfo()
    console.log('用户自己的分享code', partnerCode)
    console.log('分享参数', getShareInfo())
    if (partnerCode) {
      baseOrder.code = partnerCode
    } else if (shareCode) {
      baseOrder.code = shareCode
    }

    return baseOrder
  }

  /**
   * 获取用户满减活动
   * */
  getShopFullMinusActivity = () => {
    this.props.dispatch({
      type: 'takeOutConfirm/getShopFullMinusActivityAction',
      payload: this.makeOrder(),
      callback: ({ ok, data }) => {
        if (ok) {
          // console.log(this.state.fullMinusActivities)
          this.setState({
            fullMinusActivities: data
          }, () => {
            this.calculateCarMoney()
          })
        }
      }
    })
  }

  redPackageType = val => {
    const list = []
    if (JSON.stringify(val)
      .indexOf('TO_THE_STORE') !== -1) {
      list.push('到店使用')
    }
    if (JSON.stringify(val)
      .indexOf('NETWORK') !== -1) {
      list.push('外卖套餐')
    }
    if (JSON.stringify(val)
      .indexOf('DELIVERY_TO_HOME') !== -1) {
      list.push('物流到家')
    }
    return list
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
          this.calculatorCoupon(data)
        }
      }
    })
  }

  calculatorCoupon = data => {
    const { moneyInfo } = this.state
    const redPackage = data
    const usableRedPackage = []
    const unUsableRedPackage = []
    if (redPackage.length > 0) {
      redPackage.map(o => {
        let useCondition = false
        switch (o.couponType) {
          case 'PLATFORM_USE': useCondition = true; break
          case 'TAKE_OUT': useCondition = true; break
          default: useCondition = false
        }
        if (o.demandPrice <= moneyInfo.totalPrice && useCondition) {
          usableRedPackage.push(o)
        } else {
          unUsableRedPackage.push(o)
        }
      })
    }
    this.setState({
      usableRedPackage,
      unUsableRedPackage,
      redPackage
    })
  }

  onClickTab = item => {
    if (this.state.currentTab.key === item.key) {
      return
    }
    switch (item.key) {
      case KEY_TASK_OUT:
        this.makeSendTimes()
        break
      default:
        this.makeInviteTimes()
        break
    }
    this.setState({ currentTab: item }, () => {
      this.calculateCarMoney()
      this.getUserCanUseBonus()
    })
  }

  // 收货地址修改
  onChangeAddress = () => {
    // 实际需要跳转
    // navToPage("/pages/userAddressList/userAddressList?from=buyCar");
    // const {merchantRange} = this.state;
    // navToPage(`/pages/userAddressList/userAddressList?from=buyCar&rangeArea=${JSON.stringify(merchantRange)}`);
    const { merchantRange, currentTab, sendSet } = this.state
    if (sendSet.shippingType === 2) {
      navToPage(`/package/multiStore/userAddressList/userAddressList?from=buyCar&rangeArea=${JSON.stringify(sendSet)}&type=${currentTab.key}&selfSend=true`)
    } else {
      navToPage(`/package/multiStore/userAddressList/userAddressList?from=buyCar&rangeArea=${JSON.stringify(merchantRange)}&type=${currentTab.key}&selfSend=false`)
    }
    // 此处只作为测试
    // this.setState({testShowAddress: !this.state.testShowAddress});
  }

  inputChange = (params, e) => {
    const temp = this.state.userAddress
    temp[params] = e.target.value
    this.setState({ userAddress: { ...temp } }, () => {
      // console.log(this.state.userAddressList)
    })
  }

  choseGender = gender => {
    this.setState({
      userAddress: {
        ...this.state.userAddress,
        gender
      }
    })
  }

  // 输入订单备注
  inputRemark = () => {
    Taro.setStorageSync('userAddress', JSON.stringify(this.state.userAddressList))
    navToPage(`/package/orderRemark/orderRemark?oldRemark=${this.state.remark}`)
  }

  // 从其他页面返回回调函数
  goBackCll = params => {
    this.setState({
      remark: params
    })
  }

  /** *******红包选择********* */
  // 使用红包弹层控制
  useRedPackModal = isConfirm => {
    const { showRedPackModal, usableRedPackage } = this.state
    if (!usableRedPackage.length) return
    let stateObj = { showRedPackModal: !showRedPackModal }
    if (isConfirm === true) {
      stateObj = {
        ...stateObj,
        confirmRedPackage: this.state.currentRedPackage
      }
    }
    this.setState({ ...stateObj })
  }

  // 选中红包
  checkRedPackage = item => {
    const {
      currentRedPackage, moneyInfo, moneyInfo: {
        amount, bonusMoney
      }
    } = this.state
    const totalAmount = amount + bonusMoney
    let stateObj = { currentRedPackage: item }
    if (item.id === currentRedPackage.id) {
      stateObj = { currentRedPackage: {} }
      this.setState({
        currentRedPackage: stateObj.currentRedPackage,
        carInfo: {
          ...this.state.carInfo,
          moneyInfo: {
            ...moneyInfo,
            bonusMoney: 0,
            amount: totalAmount
          }
        }
      }, () => {
        // console.log(this.state.carInfo)
        this.calculateCarMoney()
      })
    } else if (moneyInfo.amount >= item.demandPrice) {
      this.setState({
        currentRedPackage: stateObj.currentRedPackage,
        carInfo: {
          ...this.state.carInfo,
          moneyInfo: {
            ...moneyInfo,
            amount: totalAmount - item.amountOfCoupon,
            bonusMoney: item.amountOfCoupon
          }
        }
      }, () => {
        this.calculateCarMoney()
      })
    }
  }

  /** *******外卖预定时间选择********* */
  takeoutTimeModal = isConfirm => {
    const { showTakeOutTimeModal } = this.state
    let stateObj = { showTakeOutTimeModal: !showTakeOutTimeModal }
    if (isConfirm === true) {
      stateObj = {
        ...stateObj,
        confirmTakeOutTime: this.state.currentTakeOutTime
      }
    }
    this.setState({ ...stateObj })
  }

  // 选择外卖时间
  checkTakeOutTime = (item, param) => {
    const { currentTakeOutTime } = this.state
    const stateObj = { ...currentTakeOutTime }
    stateObj[param] = item
    if (stateObj.date === currentTakeOutTime.date && stateObj.time === currentTakeOutTime.time) {
      return
    }
    this.setState({ currentTakeOutTime: { ...stateObj } })
  }

  /** *******堂食预定时间选择********* */
  eatinTimeModal = isConfirm => {
    const { showEatInTimeModal } = this.state
    let stateObj = { showEatInTimeModal: !showEatInTimeModal }
    if (isConfirm === true) { // 确定
      stateObj = {
        ...stateObj,
        confirmEatInTime: this.state.currentEatInTime
      }
    }
    this.setState({ ...stateObj })
  }

  // 选择堂食预定时间
  checkEatInTime = (item, param) => {
    const { currentEatInTime } = this.state
    const stateObj = { ...currentEatInTime }
    stateObj[param] = item
    if (stateObj.date === currentEatInTime.date && stateObj.time === currentEatInTime.time) {
      return
    }
    this.setState({ currentEatInTime: { ...stateObj } })
  }

  goPage = url => {
    navToPage(url)
  }

  // 生成服务时间
  makeTimeStepByServiceTime = defaultItem => {
    const { merchant } = this.state.carInfo
    // 获取平台服务时间
    const platSetting = this.props.platformSystemSetting ? this.props.platformSystemSetting[0] : null
    let platServiceTimes = platSetting ? platSetting.businessHours : null
    let startTime
    let endTime
    let platStartTime
    let platEndTime

    if (platServiceTimes) {
      platServiceTimes = platServiceTimes.split('-')
      platStartTime = parseFloat(platServiceTimes[0].replace(':', '.')), platEndTime = parseFloat(platServiceTimes[1].replace(':', '.'))
    }
    // 获取商户服务时间
    // let merchant = CommonUtil.getMerchant(CommonUtil.getCurrentMerchant()),
    let merchantServiceTimes = merchant.shopHours
    let merchantStartTime
    let merchantEndTime
    if (merchantServiceTimes) {
      merchantServiceTimes = merchantServiceTimes.split(',')
      if (merchantServiceTimes.length > 1) { // 多个时间段 取最开始 和 最后结束时间 中间忽略
        merchantStartTime = parseFloat(merchantServiceTimes[0].split('-')[0].replace(':', '.'))
        merchantEndTime = parseFloat(merchantServiceTimes[merchantServiceTimes.length - 1].split('-')[1].replace(':', '.'))
      } else {
        const tempTimes = merchantServiceTimes[0].split('-')
        merchantStartTime = parseFloat(tempTimes[0].replace(':', '.'))
        merchantEndTime = parseFloat(tempTimes[1].replace(':', '.'))
      }
    }

    merchantEndTime = merchantEndTime > merchantStartTime ? merchantEndTime : 24
    startTime = Math.max(platStartTime || 0, merchantStartTime || 0) // 开始时间取最晚
    endTime = Math.min(platEndTime || 24, merchantEndTime || 24) // 结束时间取最早

    const currentDate = new Date()
    const currentHoursMinute = parseFloat(`${currentDate.getHours()}.${currentDate.getMinutes()}`)
    const tmpStartTime = startTime.toString()
      .split('.')

    let startMinute = startTime < currentHoursMinute ? currentDate.getMinutes() <= 10 ? 0 : 30 : tmpStartTime.length > 1 ? tmpStartTime[1] : 0
    let startHour = startTime < currentHoursMinute ? currentDate.getMinutes() >= 40 ? currentDate.getHours() + 1 : currentDate.getHours() : parseFloat(startTime.toString()
      .split('.')[0])

    let sendTimes
    if (currentHoursMinute >= endTime) {
      sendTimes = []
      startHour = parseFloat(startTime.toString()
        .split('.')[0])
      startMinute = tmpStartTime.length > 1 ? tmpStartTime[1] : 0
    } else {
      sendTimes = [defaultItem]
    }

    let hour = startHour
    let maxStep = (parseInt(endTime.toString()
      .split('.')) - startHour + 1) * 2 // 用结束时间减去当前时间 得到剩余时间 乘以半小时步长值
    let currentInOpenTime = false

    for (let i = 1; i < maxStep; i++) {
      const endMinute = startMinute + 30

      const step = `${hour}:${startMinute <= 0 ? '00' : startMinute}-${endMinute >= 60 ? hour + 1 : hour}:${endMinute >= 60 ? '00' : endMinute}`

      if (merchantServiceTimes && merchantServiceTimes.length > 1) { // 如果设置了多个时间段 那么要排除不服务的时间段
        const tempStep = step.split('-')
        const stepStartTime = parseFloat(tempStep[0].replace(':', '.'))
        const stepEndTime = parseFloat(tempStep[1].replace(':', '.'))
        let inTimePlan = false
        merchantServiceTimes.forEach(item => {
          const timeUnit = item.split('-')
          let sTime = timeUnit[0]
          let eTime = timeUnit[1]
          sTime = parseFloat(sTime.replace(':', '.'))
          eTime = parseFloat(eTime.replace(':', '.'))
          if (stepStartTime >= sTime && stepEndTime <= eTime) {
            inTimePlan = true
          }
          if (currentHoursMinute >= sTime && currentHoursMinute <= eTime) {
            // 在营业时间内
            currentInOpenTime = true
          }
        })
        if (inTimePlan) {
          sendTimes.push(step)
        }
      } else {
        sendTimes.push(step)
        currentInOpenTime = true
      }

      startMinute += 30
      if (startMinute >= 60) {
        hour++
        hour = hour >= 24 ? 0 : hour
        startMinute = 0
      }
    }

    if (!currentInOpenTime) {
      sendTimes.shift() // 如果当前时间不在 营业时间段内 弹出数组首元素
    }

    const otherSendTimes = []
    if (currentHoursMinute < endTime) {
      startMinute = tmpStartTime.length > 1 ? tmpStartTime[1] : 0
      startHour = parseFloat(startTime.toString()
        .split('.')[0])
      hour = startHour, maxStep = (parseInt(endTime.toString()
        .split('.')) - startHour + 1) * 2 // 用结束时间减去当前时间 得到剩余时间 乘以半小时步长值
      const d = new Date()
      d.setTime(d.getTime() + 24 * 60 * 60 * 1000)
      for (let i = 1; i < maxStep; i++) {
        const endMinute = startMinute + 30

        const step = `${hour < 10 ? '0' + hour : hour}:${startMinute <= 0 ? '00' : startMinute}-${endMinute >= 60 ? ((hour + 1) < 10 ? '0' + (hour + 1) : (hour + 1)) : (hour < 10 ? '0' + hour : hour)}:${endMinute >= 60 ? '00' : endMinute}`
        if (merchantServiceTimes && merchantServiceTimes.length > 1) { // 如果设置了多个时间段 那么要排除不服务的时间段
          const tempStep = step.split('-')
          const stepStartTime = parseFloat(tempStep[0].replace(':', '.'))
          const stepEndTime = parseFloat(tempStep[1].replace(':', '.'))
          let inTimePlan = false
          merchantServiceTimes.forEach(item => {
            const timeUnit = item.split('-')
            let sTime = timeUnit[0]
            let eTime = timeUnit[1]
            sTime = parseFloat(sTime.replace(':', '.'))
            eTime = parseFloat(eTime.replace(':', '.'))
            if (stepStartTime >= sTime && stepEndTime <= eTime) {
              inTimePlan = true
            }
          })
          if (inTimePlan) {
            otherSendTimes.push(`${step}`)
          }
        } else {
          otherSendTimes.push(`${step}`)
        }

        startMinute += 30
        if (startMinute >= 60) {
          hour++
          hour = hour >= 24 ? 0 : hour
          startMinute = 0
        }
      }
    }
    const countDay = 7
    const dateTimes = []
    for (let i = 0; i < countDay; i++) {
      const d = new Date()
      d.setTime(d.getTime() + (i * 86400000))
      d.getDay()
      dateTimes.push({
        date: `${i === 0 ? '今天' : ''}（${d.getMonth() + 1}月-${d.getDate()}日）`,
        times: i === 0 ? sendTimes : otherSendTimes
      })
    }
    return dateTimes
  }

  /* 送达时间 */
  makeSendTimes = () => {
    const times = this.makeTimeStepByServiceTime('立即送餐')
    if (times.length > 0) {
      this.setState({
        times,
        currentTakeOutTime: {
          date: times[0].date,
          time: times[0].times[0]
        },
        currentEatInTime: {
          date: times[0].date,
          time: times[0].times[0]
        }
      })
    }
  }

  /* 马上备餐的时间 */
  makeInviteTimes = () => {
    const times = this.makeTimeStepByServiceTime('立即备餐')

    if (times.length > 0) {
      this.setState({
        times,
        currentTakeOutTime: {
          date: times[0].date,
          time: times[0].times[0]
        },
        currentEatInTime: {
          date: times[0].date,
          time: times[0].times[0]
        }
      })
    }
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
    const { userAddress, currentTab, carInfo } = this.state
    const _this = this
    if (!userAddress) {
      switch (currentTab.tag) {
        case 'NETWORK':
          showToast('请选择您的收货地址')
          break
        default:
          showToast('请填写您的预定信息')
          break
      }
      return
    }
    if (carInfo.merchant.remarkRequired && !this.state.orderRemark) {
      this.msg.error('订单备注为必填项,请填写您的订单备注')
      return
    }
    if (currentTab.tag === 'PICK_UP') {
      if (!userAddress.phone) {
        showToast('请填写您的手机号')
        return
      }
      if (!/^1[3-9](\d{9})$/.test(userAddress.phone)) {
        showToast('手机号格式不正确')
        return
      }
    }
    showLoading('支付中', true)
    this.props.dispatch({
      type: 'takeOutConfirm/saveShopOrderAction',
      payload: this.makeOrder(storedPayParams),
      callback: res => {
        if (res.ok) {
          if (!res.data.payUrl) {
            if (res.data.useMdmPay) {
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
                      if (tryPayCount < maxPayCount && !data.payInfo && data.state == 'WAIT_PAY') {
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

            // 余额支付
            saveTempBuyCar(CAR_TYPE_SHOP, _this.makeOrder(storedPayParams).merchantId, {})
            this.refreshBalance()
            Taro.redirectTo({ url: `/pages/payResult/payResult?orderSn=${res.data.orderSn}&type=NETWORK` })
            return
          }
          if (res.data.payState === 'UNPAY') {
            // 获取预交易单
            const { orderSn } = res.data
            const tradeNo = res.data.payUrl.match(/(\d{32})/ig)[0]
            this.props.dispatch({
              type: 'takeOutConfirm/getPrepayAction',
              payload: {
                tradeNo,
                wxCode: this.wxCode,
                appId: APP_ID
              },
              callback: ({ ok, data }) => {
                hideLoading()
                if (ok) {
                  const payInfo = JSON.parse(data.payInfo)
                  if(!payInfo)return showToast('获取支付信息错误，支付失败')
                  wx.requestPayment(
                    {
                      timeStamp: payInfo.timeStamp,
                      nonceStr: payInfo.nonceStr,
                      package: payInfo.package,
                      signType: 'MD5',
                      paySign: payInfo.paySign,
                      success(res) {
                        // const codeDishId = getCodeDishId()
                        // const qrPartnerCode = readQrPartnerCode()
                        // if (!codeDishId) {
                        //   saveCodeSign('')
                        // }
                        // if (qrPartnerCode) {
                        //   saveQrPartnerCode('')
                        // }
                        // Taro.redirectTo({url: "/pages/order/order"});
                        // const codeDishId
                        // saveCodeDishId('');
                        // saveCodeSign('');
                        Taro.redirectTo({ url: `/pages/payResult/payResult?orderSn=${orderSn}&type=NETWORK` })
                        saveTempBuyCar(CAR_TYPE_SHOP, _this.makeOrder(storedPayParams).merchantId, {})
                      },
                      fail(res) {
                        showToast('支付失败')
                        console.log("微信支付失败",res)
                      },
                      complete(res) {

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
            Taro.redirectTo({ url: `/pages/payResult/payResult?orderSn=${res.data.orderSn}&type=NETWORK` })
            saveTempBuyCar(CAR_TYPE_SHOP, _this.makeOrder(storedPayParams).merchantId, {})
          }
        } else {
          hideLoading()
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
            showToast('红包不可使用')
          } else if (error === 'error.soldOut') {
            const errorMsg = (res.header['X-shopApp-params']).split(',')
            errMsg = errMsg.substring(0, errMsg.length - 1)
            showToast(`${errorMsg}的购买数量已超过库存数,请重新选择商品`)
          } else {
            showToast(res.data.message)
          }
        }
      }
    })
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
            root.saveOrder()
          }
        }
      })
    } else { // 拒绝,保持当前页面，直到同意

    }
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

  againChooseAddress = () => {
    const { latitude, longitude } = getUserLocation()
    const { carInfo, sendSet, shippingInfo } = this.state
    const { position } = carInfo.merchant.merchantDetails
    const shippingRange = sendSet.shippingType === 2 ? sendSet.priceAndRangeDtoList : shippingInfo.shippingRange

    const range = [{
      shippingRange,
      position
    }]
    if (sendSet.shippingType === 2) {
      Taro.navigateTo({
        // 传递当前用户位置
        url: `/package/multiStore/mapRange/mapRange?latitude=${latitude}&longitude=${longitude}&range=${JSON.stringify(range)}&orderConfirm=true&selfSend=true`
      })
    } else {
      Taro.navigateTo({
        // 传递当前用户位置
        url: `/package/multiStore/mapRange/mapRange?latitude=${latitude}&longitude=${longitude}&range=${JSON.stringify(range)}&orderConfirm=true&selfSend=false`
      })
    }
  }

  // 关闭支付
  closePayment = () => {
    this.setState({
      payBoxVisible: false
    })
  }

  render() {
    const { islandUserMemberDTO } = getUserDetail()
    // 如果是会员  judge ==> true 如果不是会员   judge ==>false
    const judge = judgeLegendsCard(islandUserMemberDTO)
    const {
      currentTab,
      remark,

      showRedPackModal,
      currentRedPackage,

      showTakeOutTimeModal,
      showEatInTimeModal,
      currentTakeOutTime,
      currentEatInTime,

      confirmTakeOutTime,
      confirmEatInTime,

      carInfo,
      userAddress,
      times,
      bonus,
      noBonus,
      sendSet,
      isInArea,
      usableRedPackage,
      unUsableRedPackage,
      payment,
      payBoxVisible,
      shippingInfo
    } = this.state

    const {
      merchant,
      dishes,
      moneyInfo
    } = carInfo
    const { ajaxLoading, curMerchantInfo } = this.props
    // console.log(carInfo);
    let currentTimes = times ? times.filter(o => o.date === currentTakeOutTime.date) : null
    currentTimes = currentTimes && currentTimes.length > 0 ? currentTimes[0].times : []
    let currentEatTimes = times ? times.filter(o => o.date === currentEatInTime.date) : null
    currentEatTimes = currentEatTimes && currentEatTimes.length > 0 ? currentEatTimes[0].times : []

    // 购物车数据计算
    const carList = Object.values(dishes) || []
    // 优惠商品
    const originalPrice = carList.reduce((acc, { num, sku: { price, originalPrice } }) => acc + (originalPrice ? (originalPrice - price) * num : 0), 0)
    const { longitude, latitude } = getUserLocation()
    // console.log(usableRedPackage)
    // console.log(unUsableRedPackage)
    // console.log(this.state.sendPrice)
    // console.log(sendSet.shippingType === 2 ? this.state.sendPrice : merchant.shippingPrice || 0)

    return (
      <View className="flex-col order-confirm-wrap">
        {/* 下单类型 */}
        <View className="flex-row flex-sb flex-ae tabs-wrap">
          {
            ORDER_CONFIRM_TABS.map((o, i) => {
              const { shippingRange, useMtShipping } = (merchant.shippingInfoModel || merchant.shippingInfoModel !== null) ? merchant.shippingInfoModel : {}
              return (
                // (merchant.shopMod & o.value) === o.value &&
                // carInfo.merchant.platFormMerchantDTO.pickUpSelf
                // carInfo.merchant
                o.key === KEY_TASK_OUT ? ((sendSet.shippingType === 2) || (useMtShipping && shippingRange && (carInfo.merchant.platFormMerchantDTO && (carInfo.merchant.platFormMerchantDTO.outerOrderMod & SHOP_MODE_ENUM.SHIPPING.key)) === SHOP_MODE_ENUM.SHIPPING.key)
                  ? (
                    <View
                      key={i}
                      className={`flex1 tab-item ${currentTab.key === o.key ? 'active' : ''}`}
                      onClick={this.onClickTab.bind(this, o)}
                    >
                      {o.name}
                    </View>
                  ) : null)
                  : o.key === KEY_RECEIVE ? carInfo.merchant.platFormMerchantDTO.pickUpSelf
                    ? (
                      <View
                        key={i}
                        className={`flex1 tab-item ${currentTab.key === o.key ? 'active' : ''}`}
                        onClick={this.onClickTab.bind(this, o)}
                      >
                        {o.name}
                      </View>
                    ) : null
                    : (
                      <View
                        key={i}
                        className={`flex1 tab-item ${currentTab.key === o.key ? 'active' : ''}`}
                        onClick={this.onClickTab.bind(this, o)}
                      >
                        {o.name}
                      </View>
                    )
              )
            })
          }
        </View>
        <View className="flex1 content-wrap">
          <View className="header">
            {
              currentTab.key === KEY_TASK_OUT
                ? (
                  <Fragment>
                    {
                      (sendSet.shippingType === 2 ? isInArea : (shippingInfo && shippingInfo.shippingRange && locationArea(shippingInfo.shippingRange, {
                        longitude,
                        latitude
                      }))) ? (objNotNull(userAddress)
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
                                className="ellipsis address"
                              >
                                {userAddress.address}
                                {userAddress.detailAddress}
                              </View>
                              <View
                                className="name"
                              >
                                {userAddress.userName}
                              （
                                {userAddress.gender === 'MEN' ? '先生' : '女士'}
                              ）
                                {userAddress.phone}
                              </View>
                            </View>
                            <View className="arrow" />
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
                              <Text>新增收货地址</Text>
                            </Button>
                          </View>
                        ))
                        : (
                          <View className="againPosition flex-col flex-sa flex-ac">
                            <Text className="title">您当前位置超出了商家配送范围了哦~</Text>
                            <View className="againBtn" onClick={this.againChooseAddress}>重新定位</View>
                          </View>
                        )
                    }
                    <View
                      className="flex-row flex-ac flex-sb item"
                      hoverClass="hover"
                      hoverStartTime={10}
                      hoverStayTime={100}
                      onClick={this.takeoutTimeModal.bind(this)}
                    >
                      <View className="title">送达时间</View>
                      <Input
                        className="flex1 ellipsis inpt"
                        type="text"
                        placeholder="请选择送达时间"
                        placeholderClass="inpt-placeholder"
                        value={`${objNotNull(confirmTakeOutTime) ? confirmTakeOutTime.date === times[0].date ? confirmTakeOutTime.time : `${confirmTakeOutTime.date}（${confirmTakeOutTime.time}）` : '尽快收到'}`}
                        disabled
                      />
                      <View className="arrow" />
                    </View>
                  </Fragment>
                )
                : (
                  <Fragment>
                    <View className="flex-row flex-sb item">
                      <View className="title">订餐人姓名</View>
                      <View className="flex1">
                        <Input
                          placeholder="请输入订餐人姓名"
                          className="inpt"
                          placeholderClass="inpt-placeholder"
                          maxLength={10}
                          onInput={this.inputChange.bind(this, 'userName')}
                          value={userAddress.userName}
                        />
                        <View className="flex-row gender-wrap">
                          <Button
                            className={`gender-btn ${userAddress.gender === 'WOMEN' ? 'active' : ''}`}
                            onClick={this.choseGender.bind(this, 'WOMEN')}
                          >
                            女士
                          </Button>
                          <Button
                            className={`gender-btn ${userAddress.gender === 'MEN' ? 'active' : ''}`}
                            onClick={this.choseGender.bind(this, 'MEN')}
                          >
                            先生
                          </Button>
                        </View>
                      </View>
                    </View>
                    <View className="flex-row flex-ac flex-sb item">
                      <View className="title">联系电话</View>
                      <Input
                        placeholder="请输入电话号码"
                        className="flex1 inpt"
                        type="number"
                        placeholderClass="inpt-placeholder"
                        maxLength={11}
                        onInput={this.inputChange.bind(this, 'phone')}
                        value={userAddress.phone}
                      />
                    </View>
                    <View
                      className="flex-row flex-ac flex-sb item"
                      hoverClass="hover"
                      hoverStartTime={10}
                      hoverStayTime={100}
                      onClick={this.eatinTimeModal.bind(this)}
                    >
                      <View className="title">预定时间</View>
                      <Input
                        className="flex1 ellipsis inpt"
                        type="text"
                        placeholder="请选择预定时间"
                        placeholderClass="inpt-placeholder"
                        value={`${objNotNull(confirmEatInTime) ? confirmEatInTime.date === times[0].date ? confirmEatInTime.time : `${confirmEatInTime.date}(${confirmEatInTime.time})` : '立即备餐'}`}
                        disabled
                      />
                      <View className="arrow" />
                    </View>
                  </Fragment>
                )
            }
          </View>

          {/* 订单费用详情 */}
          <View className="order-detail">
            <View
              className="list-header"
              onClick={this.goPage.bind(this, `/pages/shop/shop?id=${merchant.merchantNo}`)}
            >
              <View className="flex-row flex-ac header-in">
                {/* <Image className="logo"
                                       src={formatAttachPath(merchant.merchantAvatar)}
                                /> */}
                <MyImage
                  src={formatAttachPath(merchant.merchantAvatar)}
                  my-class="logo"
                  errorLoad={require('../../images/demo/test_dish.png')}
                />
                <View className="flex-row flex-ac flex1">
                  <Text className="ellipsis merchant-name">{merchant.merchant_name}</Text>
                </View>
              </View>
            </View>
            <View className="food-list">
              <View className="food-in">
                {carList.map((item, i) => (
                  <View
                    className="flex-row item"
                    key={i}
                  >
                    <MyImage
                      src={formatAttachPath(item.dishImageUrl && item.dishImageUrl.split(',')[0])}
                      my-class="food-img"
                      errorLoad={require('../../images/demo/test_dish.png')}
                    />
                    <View className="flex-col flex1 right">
                      <View className="flex-row flex-sb">
                        <Text className="flex1 ellipsis name">{item.dishName}</Text>
                        {
                          judge && item.sku.memberPrice
                            ?
                            <Text className="price">
                              ￥
                          {item.sku.memberPrice}
                            </Text>
                            :
                            <Text className="price">
                              ￥
                          {item.sku.price}
                            </Text>
                        }
                      </View>
                      <Text className="num">
                        X
                        {item.num}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <View className="fee-wrap">
              <View className="flex-row flex-sb flex-ac item">
                <Text className="name">餐盒费</Text>
                <View>
                  <Text className="rmb">￥</Text>
                  <Text className="price">{moneyInfo.totalPackFee}</Text>
                </View>
              </View>
              {
                currentTab.key === 'NETWORK'
                && (
                  <View className="flex-row flex-sb flex-ac item">
                    <Text className="name">配送费</Text>
                    <View>
                      <Text className="rmb">￥</Text>
                      <Text
                        className="price"
                      >
                        {sendSet.shippingType === 2 ? this.state.sendPrice : shippingInfo && shippingInfo.shippingPrice ? shippingInfo.shippingPrice : 0}
                      </Text>
                    </View>
                  </View>
                )
              }
              {moneyInfo.fullMinusMoney && this.state.isFullMinus
                && (
                  <View className="flex-row flex-ac activity-wrap">
                    <View className="flex-row flex-ac flex1">
                      <Text className="activity-tag yellow">减</Text>
                      <Text className="activity-text">满减</Text>
                    </View>
                    <View>
                      <Text className="rmb">-￥</Text>
                      <Text className="price">{toDecimal(moneyInfo.fullMinusMoney)}</Text>
                    </View>
                  </View>
                )}
              {bonus && bonus.length > 0
                && (
                  <View
                    className="flex-row flex-ac flex-jc activity-wrap red-package-wrap"
                    hoverClass="hover"
                    hoverStartTime={10}
                    hoverStayTime={100}
                    onClick={this.useRedPackModal.bind(this)}
                  >
                    <View className="flex-row flex-ac flex1">
                      <View className="activity-tag red">红</View>
                      <View className="activity-text">使用红包</View>
                    </View>
                    <View className="normal text">
                      {moneyInfo.bonusMoney > 0
                        ? (
                          <View>
                            <Text className="rmb">-￥</Text>
                            <Text className="price">{toDecimal(moneyInfo.bonusMoney)}</Text>
                          </View>
                        )
                        : (
                          <Fragement>
                            可用
                            <Text className="rmb">
                              {bonus.filter(item => moneyInfo.amount >= item.threshold).length}
                            </Text>
                      个
                          </Fragement>
                        )
                      }
                    </View>
                    <View className="arrow" />
                  </View>
                )}
            </View>
            <View className="couponContainer">
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
                    className={`ticket ${currentRedPackage.amountOfCoupon > 0 ? 'used' : usableRedPackage.length > 0 ? 'num' : ''}`}
                  >
                    {currentRedPackage.amountOfCoupon > 0 ? '已使用1个优惠券' : usableRedPackage.length > 0 ? `${usableRedPackage.length}个优惠券可用` : '暂无可用'}
                  </Text>
                  <IconFont value="icon-arrow-right-copy-copy" size={36} />
                </View>
              </View>
            </View>
            <View className="flex-row flex-je flex-ac price-total">
              {moneyInfo.minusMoney
                && (
                  <Text className="discounts">
                    已优惠￥
                    {toDecimal(moneyInfo.minusMoney + originalPrice)}
                  </Text>
                )}
              <Text className="rel">实付</Text>
              <Text className="rmb">￥</Text>
              <Text className="money">{toDecimal(moneyInfo.amount)}</Text>
            </View>

          </View>

          {/* 支付方式 */}
          <View className="pay-way">
            {/* <View className="flex-row flex-ac flex-sb item">
                            <Text className="title">支付方式</Text>
                            <Text className="name">在线支付</Text>
                        </View> */}
            <View
              className="flex-row flex-ac flex-sb item"
              hoverClass="hover"
              hoverStartTime={10}
              hoverStayTime={100}
              onClick={this.inputRemark.bind(this)}
            >
              <Text className="title">订单备注</Text>
              <View className="flex1 flex-row flex-je flex-ac">
                <Text className="ellipsis title" style="margin-right:15px;">
                  {remark || '您的口味偏好'}
                </Text>
                <View className="arrow" />
              </View>
            </View>
          </View>
        </View>

        {/* 底部 */}
        <View className="flex-row flex-ac flex-sb footer-wrap">
          <View className="flex1 flex-row flex-sb flex-ac">
            <View
              className="discounts"
            >
              {moneyInfo.minusMoney || originalPrice ? `已优惠￥${toDecimal(moneyInfo.minusMoney + originalPrice)}` : ''}
            </View>
            <View>
              <Text className="rmb">¥</Text>
              <Text className="money">{toDecimal(moneyInfo.amount)}</Text>
            </View>
          </View>
          <Button
            className="pay-btn"
            hoverClass="hover"
            disabled={ajaxLoading.effects['orderConfirm/saveShopOrderAction'] || ajaxLoading.effects['orderConfirm/getPrepayAction']}
            loading={ajaxLoading.effects['orderConfirm/saveShopOrderAction'] || ajaxLoading.effects['orderConfirm/getPrepayAction']}
            onClick={() => {
              this.setState({
                payBoxVisible: true
              })
            }}
          // open-type="getUserInfo"
          // onGetUserInfo={this.getUserInfo}
          >
            确认支付
          </Button>
        </View>

        {/* <View className="flex-row flex-ac flex-sb footer-wexin-pay hide"> */}
        {/*  <Text>已优惠￥10</Text> */}
        {/*  <View> */}
        {/*    <Text>微信支付</Text> */}
        {/*    <Text className="money">¥33</Text> */}
        {/*  </View> */}
        {/* </View> */}

        {/* 使用红包弹窗 */}
        <AtFloatLayout
          isOpened={showRedPackModal}
          onClose={() => { this.setState({ showRedPackModal: false }) }}
        >
          <View className="flex-col package-wrap">
            <View className="flex-row flex-ac flex-sb modal-header">
              <View className="flex1 title">请选择优惠券</View>
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
                        <View className="date">{`${COUPON_CONDITION[couponType]}商品使用`}</View>
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
        {/* 选择外卖时间弹窗 */}
        {
          showTakeOutTimeModal
          && (
            <FloatLayout onCloseLayout={this.takeoutTimeModal.bind(this)}>
              <View className="flex-col package-wrap">
                <View className="flex-row flex-ac flex-sb modal-header">
                  <Button
                    className="title-btn cancel"
                    hoverClass="hover"
                    onClick={this.takeoutTimeModal.bind(this)}
                  >
                    取消
                </Button>
                  <View className="title">请选择时间</View>
                  <Button
                    className={`title-btn confirm ${!(currentTakeOutTime.date && currentTakeOutTime.time) ? 'disabled' : ''}`}
                    hoverClass="hover"
                    disabled={!(currentTakeOutTime.date && currentTakeOutTime.time)}
                    onClick={this.takeoutTimeModal.bind(this, true)}
                  >
                    确定
                </Button>
                </View>
                <View className="flex-row time-wrap">
                  <View className="left">
                    {
                      times.map((o, i) => (
                        <View
                          key={i}
                          className={`item ${currentTakeOutTime.date === o.date ? 'active' : ''}`}
                          onClick={this.checkTakeOutTime.bind(this, o.date, 'date')}
                        >
                          {o.date}
                        </View>
                      ))
                    }
                  </View>
                  <View className="flex1 right">
                    {
                      currentTimes.map((o, i) => (
                        <View
                          key={i}
                          className={`item ${currentTakeOutTime.time === o ? 'active' : ''}`}
                          onClick={this.checkTakeOutTime.bind(this, o, 'time')}
                        >
                          {o}
                        </View>
                      ))
                    }
                  </View>
                </View>
              </View>
            </FloatLayout>
          )
        }

        {/* 选择堂食预定时间弹窗 */}
        {
          showEatInTimeModal
          && (
            <FloatLayout onCloseLayout={this.eatinTimeModal.bind(this)}>
              <View className="flex-col package-wrap">
                <View className="flex-row flex-ac flex-sb modal-header">
                  <Button
                    className="title-btn cancel"
                    hoverClass="hover"
                    onClick={this.eatinTimeModal.bind(this)}
                  >
                    取消
                </Button>
                  <View className="title">请选择时间</View>
                  <Button
                    className={`title-btn confirm ${!(currentEatInTime.date && currentEatInTime.time) ? 'disabled' : ''}`}
                    hoverClass="hover"
                    disabled={!(currentEatInTime.date && currentEatInTime.time)}
                    onClick={this.eatinTimeModal.bind(this, true)}
                  >
                    确定
                </Button>
                </View>
                <View className="flex-row time-wrap">
                  <View className="left">
                    {
                      times.map((o, i) => (
                        <View
                          key={i}
                          className={`item ${currentEatInTime.date === o.date ? 'active' : ''}`}
                          onClick={this.checkEatInTime.bind(this, o.date, 'date')}
                        >
                          {o.date}
                        </View>
                      ))
                    }
                  </View>
                  <View className="flex1 right">
                    {
                      currentEatTimes.map((o, i) => (
                        <View
                          key={i}
                          className={`item ${currentEatInTime.time === o ? 'active' : ''}`}
                          onClick={this.checkEatInTime.bind(this, o, 'time')}
                        >
                          {o}
                        </View>
                      ))
                    }
                  </View>
                </View>
              </View>
            </FloatLayout>
          )
        }
        <Payment
          createOrder={this.saveOrder}
          payBoxVisible={payBoxVisible}
          paymentAmount={moneyInfo.amount}
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

export default OrderConfirm
