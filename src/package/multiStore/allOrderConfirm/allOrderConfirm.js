import Taro, { Component } from '@tarojs/taro'
import {
  Button, Image, Input, Picker, Text, View,
  Block, ScrollView
} from '@tarojs/components'
import {
  AtFloatLayout, AtIcon, AtModal, AtModalContent
} from 'taro-ui'
import { connect } from '@tarojs/redux'
import './allOrderConfirm.scss'
import { objNotNull, getUserLocation, showLoading, hideLoading, locationArea, navToPage, decodeURIObj, formatAttachPath, formatCurrency, showToast, trimAllSpace, toDecimal, replaceEmoji, getPlatFormId, getUserDistributor, getShareInfo, productTypeAnd, getUserDetail, validatePhone, saveUserDetail, readBuyCar, judgeLegendsCard, clearBuyCar } from '../../../utils/utils'
import { GOODS_TYPE, GOODS_TAKE_OUT, GOODS_TICKET, GOODS_COMMODITY, PAY_WECHAT, PAY_STORED, PAYMENT, SHOP_MODE_ENUM, ORDER_TYPE_NETWORK, GOODS_PICK_UP, CAR_TYPE_SHOP } from '../../../config/config'
import { PLATFORM_ID } from '../../../config/baseUrl'
import IconFont from '../../../components/IconFont/IconFont'
import Payment from '../../../components/Payment/Payment'

const dayjs = require('dayjs')

const TOP_UP_ACCOUNT = {
    Phone: '手机号',
    QQ: '腾讯QQ',
    WeChat: '微信号'
}

@connect(({ orderDishes, loading }) => ({
    platformSystemSetting: orderDishes.platformSystemSetting,
    ajaxLoading:loading
}))
class AllOrderConfirm extends Component {
    config = {
        navigationBarTitleText: '确认订单'
    }

    constructor() {
        super()
        const goodsDetail = this.$router.params.goodsDetail && decodeURIObj(this.$router.params.goodsDetail) || {}
        this.state = {
            merchantId: this.$router.params.merchantId || null,
            goodsDetail, // 套餐商品信息
            merchantInfo: {}, // 门店信息
            tabs: [],  // 根据商品类型选择下单方式 
            currentTab: {}, // 当前选中的下单类型tab
            formPage: this.$router.params.formPage || '',  // PACKAGE： 套餐商品
            userAddress: {}, // 用户地址
            gender: 'WOMEN', // 到店消费性别
            isInRange: false, // 是否在配送范围之内
            shippingType: 1, // 配送类型
            shippingRange: [], // 配送范围
            checkRange: {}, // 用户所在范围
            sendSet: {}, // 配送信息
            times: null, // 送餐时间组
            currentTakeOutTime: {
                date: '',
                time: ''
            }, // 当前选中的外卖预定时间
            currentEatInTime: {
                date: '',
                time: ''
            }, // 当前选中的堂食预定时间
            showTakeOutTimeModal: false, // 选择外卖预定时间弹层
            showEatInTimeModal: false, // 选择堂食预定时间弹层
            confirmTakeOutTime: {}, // 确定选中的外卖时间
            confirmEatInTime: {}, // 确定的堂食预定时间
            happyPlayPeopleNum: Array(goodsDetail.repeatPeoplenum || 0).fill({}),
            idCard: '', // 用户需填写的身份证
            isPrize: false, // 是否为霸王餐领奖商品
            buyNums: goodsDetail.shopDish && goodsDetail.shopDish.minOrderCount ? goodsDetail.shopDish.minOrderCount > goodsDetail.shopDish.buyNums ? goodsDetail.shopDish.minOrderCount : (goodsDetail.shopDish.buyNums || 1) : 1, // 购买数量
            currentRedPackage: {}, // 当前选中红包
            confirmRedPackage: {}, // 确定的时候红包缓存
            limitPrice: 0,
            hasLegendsCard: false,
            showRedPackModal: false, // 使用红包弹层
            couponList: [], // 用户优惠券
            usableRedPackage: [], // 可用红包
            unUsableRedPackage: [], // 不可用红包
            remark: '', // 订单备注
            payBoxVisible: false,
            payType: PAY_WECHAT, // 支付方式
            deliveryTime: '', // 送达时间
            confirmCurrentTime: {}, // 确定的当前选中时间
            carInfo: {  // 外卖购物车
                dishes: {},
                merchant: {}
            },
            fullMinusActivities: null, // 满减活动
            moneyInfo: {
                totalNums: 0,
                totalPrice: 0,
                minusMoney: 0,
                fullMinusMoney: 0,
                totalPackFee: 0,
                bonusMoney: 0,
                amount: 0
            }
        }
    }

    componentWillMount() {
        Taro.setNavigationBarColor({
          backgroundColor: Taro.getStorageSync('systemColor'),
          frontColor: "#ffffff"
        })
        const carInfo = readBuyCar()
        this.setState({ 
            carInfo
        }, () => {
            this.loadUserDefaultAddress()
            this.getMerchantDetail()
        })
        
    }

    componentDidMount() {
        this.makeSendTimes()
    }

    componentDidShow() {
        this.getSendInfo()
    }

    // 判断是否来自于合伙人那边的订单
    formPartnerOrder = () => this.state.formPage === 'partnerOrder'

    // 获取配送信息
    getSendInfo = () => {
        const { dispatch } = this.props
        const { merchantId } = this.state
        console.log('128=>>>>>>>>>',PLATFORM_ID,merchantId)
        dispatch({
            type: 'allOrderConfirm/getSendInfoAction',
            payload: { 
                platformId: PLATFORM_ID,
                merchantId
            },
            callback: ({ ok, data }) => {
                console.log('136 获取配送信息=>>>>>>>>>>',ok,data)
                if (ok) {
                    const { shippingType, shippingRange } = data
                    const rangeList = shippingRange.filter(item => locationArea(item.range, getUserLocation()))
                    const nowRangePrice = Math.min.apply(Math, rangeList.map(o => {
                        return o.sendPrice
                    }))
                    const nowRange = rangeList.filter(o => o.sendPrice === nowRangePrice)
                    this.setState({
                        shippingType,
                        isInRange: rangeList.length > 0,
                        shippingRange,
                        sendSet: data,
                        checkRange: nowRange[0] || {}
                    })
                }
            }
        })
    }

    // 获取门店信息
    getMerchantDetail = () => {
        const { dispatch } = this.props
        const { merchantId, carInfo, formPage, goodsDetail } = this.state;
        console.log('获取门店信息')
        dispatch({
            type: 'allOrderConfirm/getMerchantDetailAction',
            payload: { 
                platformId: PLATFORM_ID,
                merchantId
            },
            callback: ({ ok, data }) => {
                console.log('167getMerchantDetailAction=>>>>>>>>>>',data)
                if (ok) {
                    const { merchantDTO } = data
                    let carDetail = JSON.parse(JSON.stringify(carInfo))
                    carDetail.dishes = readBuyCar().dishes
                    carDetail.merchant = merchantDTO
                    let tabs = [];
                    console.log("173formPage=>>>>>>>>",formPage)
                    if (formPage === 'PACKAGE') {
                        if (objNotNull(goodsDetail) && objNotNull(goodsDetail.shopDish) && goodsDetail.shopDish.productType) {
                            tabs = GOODS_TYPE.filter(o => productTypeAnd(goodsDetail.shopDish.productType, o.value))
                            this.setState({
                                tabs: tabs.length > 0 ? tabs : [], // 根据商品类型选择下单方式
                                currentTab: tabs.length > 0 ? tabs[0] : {} // 当前选中的下单类型tab
                            })
                        }
                    } else if (formPage === 'NETWORK') {
                        if ((merchantDTO.platFormMerchantDTO && merchantDTO.platFormMerchantDTO.outerOrderMod && (merchantDTO.platFormMerchantDTO.outerOrderMod & SHOP_MODE_ENUM.SHIPPING.key)) === SHOP_MODE_ENUM.SHIPPING.key) {
                            tabs.push({
                                label: '外卖到家',
                                value: 2,
                                orderType: 'NETWORK'
                            })
                        }
                    }
                    if (merchantDTO.platFormMerchantDTO && merchantDTO.platFormMerchantDTO.pickUpSelf) {
                        tabs.push({
                            label: '到店自提',
                            value: 8,
                            orderType: 'PICK_UP'
                        })
                    }
                    this.setState({
                        merchantInfo: merchantDTO || {},
                        carInfo: carDetail,
                        tabs,
                        currentTab: tabs.length > 0 ? tabs[0] : {} // 当前选中的下单类型tab
                    }, () => {
                        if (formPage === 'NETWORK') {
                            this.getTotalPrice()
                        }
                    })
                }
            }
        })
    }

    // 获取用户选择的地址
    loadUserDefaultAddress = id => {
        const { dispatch } = this.props
        showLoading()
        dispatch({
            type: 'common/getUserDefaultAddressAction',
            payload: { id },
            callback: ({ ok, data }) => {
                hideLoading()
                if (ok) {
                    if (!data) {
                        return
                    }
                    this.setState({ userAddress: data })
                }
            }
        })
    }

    // 到店消费预定人性别
    choseGender = gender => {
        this.setState({ gender })
    }

    // 收货地址修改
    onChangeAddress = () => {
        const { currentTab, sendSet } = this.state
        navToPage(`/package/multiStore/userAddressList/userAddressList?from=buyCar&rangeArea=${JSON.stringify(sendSet)}&type=${currentTab.key}`)
    }

    // 送达时间
    makeSendTimes = openModal => {
        const times = this.makeTimeStepByServiceTime('立即送餐', this.state.merchantInfo, this.state.platformSystemSetting)
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

    // 外卖预定时间选择
    takeoutTimeModal = isConfirm => {
        const { showTakeOutTimeModal, currentTakeOutTime } = this.state
        let stateObj = { showTakeOutTimeModal: !showTakeOutTimeModal }
        if (isConfirm === true) {
            stateObj = {
                ...stateObj,
                confirmTakeOutTime: currentTakeOutTime
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

    // 堂食预定时间选择
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

    // 生成服务时间
    makeTimeStepByServiceTime = defaultItem => {
        const { merchantInfo } = this.state
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
        let merchantServiceTimes = merchantInfo.shopHours
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
        const tmpStartTime = startTime.toString().split('.')

        let startMinute = startTime < currentHoursMinute ? currentDate.getMinutes() <= 10 ? 0 : 30 : tmpStartTime.length > 1 ? tmpStartTime[1] : 0
        let startHour = startTime < currentHoursMinute ? currentDate.getMinutes() >= 40 ? currentDate.getHours() + 1 : currentDate.getHours() : parseFloat(startTime.toString().split('.')[0])

        let sendTimes
        if (currentHoursMinute >= endTime) {
            sendTimes = []
            startHour = parseFloat(startTime.toString().split('.')[0])
            startMinute = tmpStartTime.length > 1 ? tmpStartTime[1] : 0
        } else {
            sendTimes = [defaultItem]
        }

        let hour = startHour
        let maxStep = (parseInt(endTime.toString().split('.')) - startHour + 1) * 2 // 用结束时间减去当前时间 得到剩余时间 乘以半小时步长值
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
            startHour = parseFloat(startTime.toString().split('.')[0])
            hour = startHour, maxStep = (parseInt(endTime.toString().split('.')) - startHour + 1) * 2 // 用结束时间减去当前时间 得到剩余时间 乘以半小时步长值
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

     // 计算商品小计,总计价格isSubTotal:是否是小计
    getTotalPrice = isSubTotal => {
        const {
            goodsDetail, merchantInfo, buyNums, confirmRedPackage, currentTab, isPrize, isBuyCard, limitPrice, hasLegendsCard, checkRange, carInfo, formPage, fullMinusActivities, moneyInfo
        } = this.state
        if (isPrize) return 0
        let totalPrice = 0

        const { islandUserMemberDTO } = getUserDetail()
        const judge = judgeLegendsCard(islandUserMemberDTO)
        let moneyDetail = JSON.parse(JSON.stringify(moneyInfo))
        
        if (formPage === 'PACKAGE') {
            const shopDish = goodsDetail.shopDish || {}
            const shopDishSkus = shopDish.currentSku ? shopDish.currentSku : shopDish.shopDishSkus && shopDish.shopDishSkus.length > 0 && shopDish.shopDishSkus[0] || {}
            totalPrice = shopDishSkus.price * buyNums
            // 会员价
            if (shopDishSkus.memberPrice && !hasLegendsCard) {
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
                if (checkRange.sendPrice > 0) { // 配送费
                    totalPrice += checkRange.sendPrice
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
        } else {
            const carList = Object.values(carInfo.dishes) || []
            let totalNums = 0 // 点餐总分数
            let minusMoney = 0 // 优惠费用（所有的）
            let fullMinusMoney = 0 // 满减
            let bonusMoney = moneyDetail.bonusMoney ? moneyDetail.bonusMoney : 0; // 餐盒费
            let shippingMoney = checkRange.sendPrice
            let totalPackFee = 0 // 红包
            const { merchant = {} } = carInfo
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
                totalPrice += totalPackFee
            }
            // 满减活动
            if (merchant.openActivity && fullMinusActivities && fullMinusActivities.openActivity) {
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
            totalPrice += fullMinusMoney

            // 加上红包
            minusMoney = parseFloat(minusMoney) + parseFloat(bonusMoney)
            totalPrice += minusMoney
            console.log(shippingMoney)
            console.log(checkRange)
            let amount = toDecimal(parseFloat(totalPrice || 0) + parseFloat(totalPackFee || 0) + parseFloat(shippingMoney || 0) - parseFloat(minusMoney || 0))
            moneyDetail = {
                totalNums,
                totalPrice,
                minusMoney,
                fullMinusMoney,
                totalPackFee,
                shippingMoney,
                bonusMoney,
                amount
            }
            this.setState({
                moneyInfo: moneyDetail
            }, () => {
                this.getShopFullMinusActivity()
            })
        }
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

    // 加载红包数据列表
    loadRedPackageList = brandId => {
        this.props.dispatch({
            type: 'userCoupons/getUserOfferCouponAction',
            payload: { status: 0 },
            callback: ({ ok, data }) => {
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
        const { couponList: redPackage, currentTab: { value }, moneyInfo } = this.state
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
                if (formPage === 'PACKAGE' ? (o.demandPrice <= this.getTotalPrice(true) && useCondition) : (o.demandPrice <= moneyInfo.amount && useCondition)) {
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
        this.setState(stateObj)
    }

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
            }).then(res => {
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

    // 从其他页面返回回调函数
    goBackCll = params => {
        this.setState({ remark: params })
    }

    // 余额支付
    balancePay = () => {
        const { balance, moneyInfo } = this.state
        if (formPage === 'PACKAGE' ? (this.getTotalPrice() > balance) : (moneyInfo.amount > balance)) return
        this.setState({
            payType: 0
        })
    }
    
    // 关闭支付
    closePayment = () => {
        this.setState({
            payBoxVisible: false
        })
    }

    // 保存订单
    saveOrder = storedPayParams => {
        console.log('0000')
        const { userAddress } = this.state
        showLoading('订单生成中..', true)
        const { currentTab, goodsDetail } = this.state
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
        this.submitOrder(storedPayParams)
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
                        if (newOrder.useMdmPay) {
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
                                            wx.requestPayment({
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
                                            })
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
                                wx.requestPayment({
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
                                })
                            }
                        }
                    })
                    clearBuyCar()
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
            idCard,
            shippingType,
            checkRange,
            formPage,
            carInfo,
            moneyInfo
        } = this.state
        const { merchant, dishes } = carInfo
        const shopOrderProductInfoDTOS = []
        let skus = []
        let merchantDetail = formPage === 'PACKAGE' ? merchantInfo : merchant
        if (formPage === 'PACKAGE') {
            const shopDish = goodsDetail.shopDish || {}
            skus = shopDish.currentSku ? [shopDish.currentSku] : shopDish.shopDishSkus
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
                        merchantId: merchantDetail.id,
                        brandId: merchantDetail.brand,
                        name: a.name || '',
                        details: a.details || ''
                    })) : [],
                    thirdPartyType: isPrize ? thirdPartyType : null,
                    externalSkuNo: o.externaSkuNo
                })
            })
        } else {
            skus = Object.values(dishes)
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
                shopOrderProductInfoDTOS.push({
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
        }
        
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
            merchantCoordinate: merchantDetail.merchantDetails.position,
            merchantDistance: 0, // merchant.merchantDetails.discount,
            merchantName: merchantDetail.merchant_name,
            merchantPhone: merchantDetail.merchantDetails.principal_mobile,
            orderSend: sendTime, // useDate,
            receiveId: merchantDetail.receiveAccountId,
            orderRemark: currentTab.value === GOODS_TAKE_OUT ? this.state.remark : '', // this.state.remark,
            orderMark: currentTab.value === GOODS_TAKE_OUT ? this.state.remark : '',
            // reserveTime: (reservationTime || deliveryTime) ? (`${new Date(reservationTime || deliveryTime).getTime()}`).slice(0, 10) - 0 : '',
            plainday: (reservationTime || deliveryTime) ? (`${new Date(reservationTime || deliveryTime).getTime()}`).slice(0, 10) - 0 : '',
            ticketdata: (goodsDetail.repeatPeoplenum >= 1 && goodsDetail.repeatFields) ? JSON.stringify(happyPlayPeopleNum) : '',
            idcard: goodsDetail.requireIdcard === 1 ? idCard : ''
        }
        console.log(moneyInfo)
        const baseOrder = {
            amount: formPage === 'PACKAGE' ? (formatCurrency(this.getTotalPrice()) || 0) : formatCurrency(moneyInfo.amount), // 以后端计算为准
            // "discountFee": '',
            merchantId: merchantDetail.id,
            merchantNo: merchantDetail.merchantNo,
            merchantUserId: merchantDetail.userId,
            brandId: merchantDetail.brand,
            // "packFee": moneyInfo.totalPackFee,
            orderState: 'PENDING', // 以后端计算为准
            orderType: currentTab.orderType, // shopDish.productType === GOODS_TICKET ? "DELIVERY_TO_HOME" : "TO_THE_STORE",
            platformId: getPlatFormId(),
            // "platformUserId": plat?plat.createdBy:null,
            printState: 'UNPRINT', // 以后端计算为准
            deliverFee: formPage === 'PACKAGE' && goodsDetail.shopDish && goodsDetail.shopDish.deliverFee ? formatCurrency(goodsDetail.shopDish.deliverFee) : null,
            shopOrderExtendedInfoDTO,
            shopOrderProductInfoDTOS,
            orderSource: currentTab.value === GOODS_COMMODITY ? 'PACKAGE' : 'DELIVERY_TO_HOME',
            // couponSn: confirmRedPackage.hongBaoSn || null, // todo 红包
            couponId: confirmRedPackage.id || null,
            fullReductionActivity: null, // this.state.fullMinusActivities
            payWay: PAYMENT[payType], // 微信支付
            thirdPartyType,
            bindingBuy: isBuyCard,
            rangeCode: shippingType === 2 ? checkRange.num : '',
            sendPrice: shippingType === 2 ? checkRange.sendPrice || '' : '',
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
            baseOrder.amount = toDecimal(formPage === 'PACKAGE' ? (this.getTotalPrice() - limitPrice) : toDecimal(moneyInfo.amount - limitPrice))
            baseOrder.tcCardAmount = limitPrice
        }
        return baseOrder
    }

    // 到店消费预订姓名和电话输入
    inputChange = (params, e) => {
        const { userAddress } = this.state
        const stateObj = {}
        stateObj[params] = replaceEmoji(e.target.value)
        // console.log(stateObj);
        this.setState({ userAddress: { ...userAddress, ...stateObj } })
    }

    // 选择时间, 填写身份证号码
    makeOrderInfo = (type, e) => {
        this.setState({
            [type]: e.detail.value
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
                    const { amount } = data
                    saveUserDetail({
                        ...userInfo,
                        amount
                    })
                }
            }
        })
    }

    // 格式化规格属性
    formatGoodsDetailSelected = (currentSku, currentAttr) => {
        let result = currentSku.spec ? `(${currentSku.spec}` : '('
        if (currentAttr) {
            const attrKeys = Object.keys(currentAttr) || []
            attrKeys.forEach(key => {
                // result += `${result !== "(" ? "/" : ""}${currentAttr[key].name}:${currentAttr[key].details}`;
                result += `${result !== '(' ? '/' : ''}${currentAttr[key].details}`
            })
        }
        result += ')'

        return result
    }

    // 获取用户满减活动
    getShopFullMinusActivity = () => {
        const { dispatch } = this.props
        dispatch({
            type: 'takeOutConfirm/getShopFullMinusActivityAction',
            payload: this.makeOrder(),
            callback: ({ ok, data }) => {
                if (ok) {
                    this.setState({
                        fullMinusActivities: data
                    })
                }
            }
        })
    }

    render() {
        const { tabs, currentTab, userAddress, gender, goodsDetail, isInRange, shippingType, shippingRange, times, happyPlayPeopleNum, showEatInTimeModal, showTakeOutTimeModal, idCard, merchantInfo, currentTakeOutTime, currentEatInTime, confirmTakeOutTime, isPrize, buyNums, usableRedPackage, unUsableRedPackage, isBuyCard, hasLegendsCard, showRedPackModal, remark, payBoxVisible, payType, checkRange, formPage, carInfo, moneyInfo } = this.state
        console.log(payType)
        console.log('1323currentTab=>>>>>>>>>>>>',currentTab)

        const { ajaxLoading } = this.props;

        const shopDish = goodsDetail.shopDish || {}
        const shopDishSkus = shopDish.currentSku ? shopDish.currentSku : shopDish.shopDishSkus && shopDish.shopDishSkus.length > 0 && shopDish.shopDishSkus[0] || {}
        const notFormDine = this.$router.params.from !== 'dine'

        let currentTimes = times ? times.filter(o => o.date === currentTakeOutTime.date) : null
        currentTimes = currentTimes && currentTimes.length > 0 ? currentTimes[0].times : []
        let currentEatTimes = times ? times.filter(o => o.date === currentEatInTime.date) : null
        currentEatTimes = currentEatTimes && currentEatTimes.length > 0 ? currentEatTimes[0].times : []

        // 购物车数据计算
        const carList = formPage === 'NETWORK' ? Object.values(carInfo.dishes ? carInfo.dishes : {}) : []
        const dishList = formPage === 'PACKAGE' ? goodsDetail : formPage === 'NETWORK' ? carList : []

        return (
            <Block>
                <View className="flex-col order-confirm-wrap">
                    <View className="flex1 flex-col content-wrap">
                        <View className="header-area">
                            {
                                tabs.length > 0 && (
                                    <View className="flex-row flex-ae order-type-tabs">
                                        {
                                            tabs.map(o => (
                                                <View
                                                    key={o.value}
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
                                objNotNull(currentTab) && (
                                    <View className="header">
                                        {
                                            currentTab.value === GOODS_TAKE_OUT && !isInRange ? (
                                                <View className="againPosition flex-col flex-sa flex-ac">
                                                    <Text className="title">您当前位置超出了商家配送范围了哦~</Text>
                                                    <View
                                                        className="againBtn"
                                                        onClick={() => {
                                                            const { latitude, longitude } = getUserLocation()
                                                            const { position } = merchantInfo.merchantDetails
                                                            const range = []
                                                            range.push({
                                                                shippingRange,
                                                                position
                                                            })
                                                            navToPage(`/package/multiStore/mapRange/mapRange?latitude=${latitude}&longitude=${longitude}&range=${JSON.stringify(range)}`)
                                                        }}
                                                    >
                                                        重新定位
                                                    </View>
                                                </View>
                                            )
                                            // 外卖到家和快递到家
                                            : (currentTab.value === GOODS_TICKET || currentTab.value === GOODS_TAKE_OUT) ? (
                                                <Block>
                                                    {
                                                        objNotNull(userAddress) ? (
                                                            <View
                                                                className="flex-row flex-ac flex-sb address-wrap"
                                                                hoverClass="hover"
                                                                hoverStartTime={10}
                                                                hoverStayTime={100}
                                                                onClick={this.onChangeAddress.bind(this)}
                                                            >
                                                                <View className="flex1 left">
                                                                    <View className="name">
                                                                        {`${`${userAddress.userName}  ${userAddress.phone}`}`}
                                                                    </View>
                                                                    <View className="address">
                                                                        {
                                                                            userAddress.enabled && <Text className="def-tag">默认</Text>
                                                                        }
                                                                        {`${userAddress.address}${userAddress.detailAddress}`}
                                                                    </View>
                                                                </View>
                                                                <IconFont value="icon-arrow-right-copy-copy" size={36} />
                                                            </View>
                                                        ) : (
                                                            <View className="flex-row flex-ac flex-jc add-addr-wrap">
                                                                <Button
                                                                    className="add-address-btn"
                                                                    hoverClass="hover"
                                                                    onClick={this.onChangeAddress.bind(this)}
                                                                >
                                                                    <Text className="plus">+</Text>
                                                                    <Text>
                                                                        {
                                                                            currentTab.value === GOODS_TAKE_OUT ? '添加配送地址' : '添加收货地址'
                                                                        }
                                                                    </Text>
                                                                </Button>
                                                            </View>
                                                        )
                                                    }
                                                    {
                                                        // 外卖到家,需要选择送到时间
                                                        currentTab.value === GOODS_TAKE_OUT && (
                                                            <View className="flex-row flex-ac flex-sb time-select">
                                                                <Text className="mei-tag">美团专送</Text>
                                                                <View
                                                                    className="flex-row flex-ac send-time"
                                                                    onClick={() => {
                                                                        // 重新计算时间
                                                                        this.takeoutTimeModal()
                                                                    }}
                                                                >
                                                                    <Text>送达时间</Text>
                                                                    <Text className={`time ${!confirmTakeOutTime.time ? 'gray' : 'black'}`}>
                                                                        {
                                                                            !confirmTakeOutTime.time ? '尽快收到' : `${confirmTakeOutTime.time}${confirmTakeOutTime.showDate ? confirmTakeOutTime.showDate : ''}`
                                                                        }
                                                                    </Text>
                                                                    <IconFont value="icon-arrow-right-copy-copy" size={36} />
                                                                </View>
                                                            </View>
                                                        )
                                                    }
                                                    {
                                                        // 配送, 需要选择送达时间
                                                        currentTab.value === GOODS_TICKET && goodsDetail.fresh === 1 && (
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
                                            ) : (currentTab.value === GOODS_COMMODITY || currentTab.value === GOODS_PICK_UP) ? (
                                                <Block>
                                                    <View className="flex-row flex-sb item">
                                                        <View className="title">预订人姓名：</View>
                                                        <View className="flex1">
                                                            <Input
                                                                placeholder="请输入预定人姓名"
                                                                className="inpt"
                                                                placeholderClass="inpt-placeholder"
                                                                maxLength={10}
                                                                value={userAddress.userName}
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
                                                        goodsDetail.requireDay === 1 && (
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
                                                </Block>
                                            ) : (
                                                <View style="font-size: 20px; text-align: center; padding: 20px; color: #999;">
                                                    {currentTab.value === GOODS_PICK_UP ? '暂不支持外卖自取' : '商品类型未知,暂时不能下单'}
                                                </View>
                                            )
                                        }
                                    </View>
                                )
                            }
                            <View className="border-bag" />
                        </View>
                        <View className="flex1 order-detail">
                            <View className="order-detail-in">
                                <View className="merchantName">{merchantInfo.merchant_name}</View>
                                {
                                    formPage === 'PACKAGE' ? (
                                        <View className="flex-row header">
                                            <Image
                                                className="logo"
                                                src={formatAttachPath(shopDish.picture)}
                                            />
                                            <View className="flex-col flex-sb flex1">
                                                <View className="mulBreak goods-name">{shopDish.dishName || '暂无名称'}</View>
                                                {
                                                    shopDish.minOrderCount && shopDish.minOrderCount > 0 && <View className="minCount">{`${shopDish.minOrderCount}件起购`}</View>
                                                }
                                                <View className="flex-row flex-ae">
                                                    <View className="flex1 price">
                                                        <Text className="rmb">¥</Text>
                                                        <Text className="money">
                                                            {
                                                                formatCurrency(isPrize ? shopDishSkus.originalPrice : (shopDishSkus.memberPrice && !hasLegendsCard ? shopDishSkus.memberPrice : shopDishSkus.price))
                                                            }
                                                        </Text>
                                                        <Text className="goods-name gray">
                                                            {shopDish.selectedSkuAndAttrStr}
                                                        </Text>
                                                    </View>
                                                    {
                                                        !isPrize && (
                                                            <View className="flex-row flex-ac add-goods-wrap">
                                                                {
                                                                    (buyNums > 1 && shopDish.minOrderCount < buyNums) && (
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
                                                                    !(this.formPartnerOrder()) && (
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
                                    ) : formPage === 'NETWORK' ? (
                                        <View>
                                            {
                                                dishList.map(item => {
                                                    return (
                                                        <View className="flex-row header">
                                                            <Image
                                                                className="logo"
                                                                src={formatAttachPath(item.dishImageUrl.split(',')[0])}
                                                            />
                                                            <View className="flex-col flex-sb flex1">
                                                                <View className="mulBreak goods-name">{item.dishName || '暂无名称'}</View>
                                                                {
                                                                    item.minOrderCount && item.minOrderCount > 0 && <View className="minCount">{`${item.minOrderCount}件起购`}</View>
                                                                }
                                                                <View className="flex-row flex-ae">
                                                                    <View className="flex1 price">
                                                                        <Text className="rmb">¥</Text>
                                                                        <Text className="money">
                                                                            {
                                                                                formatCurrency(isPrize ? item.sku.originalPrice : (item.sku.memberPrice && !hasLegendsCard ? item.sku.memberPrice : item.sku.price))
                                                                            }
                                                                        </Text>
                                                                        <Text className="goods-name gray">
                                                                            {this.formatGoodsDetailSelected(item.sku.spec, item.sku.shopDishAttributes) !== '()' ? this.formatGoodsDetailSelected(item.sku.spec, item.sku.shopDishAttributes) : '' }
                                                                        </Text>
                                                                    </View>
                                                                    <View className="flex-row flex-ac add-goods-wrap">{`x${item.num}`}</View>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    )
                                                })
                                            }
                                        </View>
                                    ) : null
                                }
                                <View className="fee-wrap">
                                    <View className="flex-row flex-sb flex-ac item">
                                        <Text className="name">小计</Text>
                                        <Text className="price">
                                            ￥
                                            {formPage === 'PACKAGE' ? formatCurrency(this.getTotalPrice(true)) : formatCurrency(moneyInfo.totalPrice)}
                                        </Text>
                                    </View>
                                    {
                                        // 快递商品运费
                                        currentTab.value === GOODS_TICKET && (
                                            <View className="flex-row flex-sb flex-ac item">
                                                <Text className="name">运费</Text>
                                                <Text className="price-sub">
                                                    ￥
                                                    {shopDish.deliverFee ? shopDish.deliverFee : 0}
                                                </Text>
                                            </View>
                                        )
                                    }
                                    {
                                        // 外卖到家餐盒费和配送费
                                        currentTab.value === GOODS_TAKE_OUT && (
                                            <Block>
                                                <View className="flex-row flex-sb flex-ac item">
                                                    <Text className="name">餐盒费</Text>
                                                    <Text className="price-sub">
                                                        ￥
                                                        {formPage === 'PACKAGE' ? (!shopDishSkus.freeBoxPrice ? formatCurrency(shopDishSkus.boxPrice * buyNums) : '0') : formatCurrency(moneyInfo.bonusMoney)}
                                                    </Text>
                                                </View>
                                                <View className="flex-row flex-sb flex-ac item">
                                                    <Text className="name">配送费</Text>
                                                    <Text className="price-sub">
                                                        ￥
                                                        {checkRange.sendPrice ? formatCurrency(checkRange.sendPrice) : '0'}
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
                                            <Text className={`ticket ${confirmRedPackage.amountOfCoupon > 0 ? 'used' : usableRedPackage.length > 0 ? 'num' : ''}`}>
                                                {confirmRedPackage.amountOfCoupon > 0 ? '已使用1个优惠券' : usableRedPackage.length > 0 ? `${usableRedPackage.length}个优惠券可用` : '暂无可用'}
                                            </Text>
                                            <IconFont value="icon-arrow-right-copy-copy" size={36} />
                                        </View>
                                    </View>
                                </View>
                                <View className="flex-row flex-je flex-ae price-total">
                                    {
                                        usableRedPackage.length > 0 && confirmRedPackage.amountOfCoupon > 0 && (
                                            <Text className="discounts">
                                                已优惠￥
                                                {formatCurrency(confirmRedPackage.amountOfCoupon)}
                                            </Text>
                                        )
                                    }
                                    <Text className="rel">总计</Text>
                                    <Text className="rmb">￥</Text>
                                    <Text className="money">{formPage === 'PACKAGE' ? (formatCurrency(isBuyCard ? this.getTotalPrice() - limitPrice : this.getTotalPrice())) : formatCurrency(moneyInfo.amount)}</Text>
                                </View>
                                {
                                    hasLegendsCard && notFormDine && (
                                        <View className="advertImgBox flex-row flex-ac flex-sb">
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
                                                    isBuyCard ? <IconFont value="imgHook" h={36} w={36} onClick={this.handleBuyCard} />
                                                    : <View className="notHook" onClick={this.handleBuyCard} />
                                                }
                                                </View>
                                                <View className="economize">
                                                    本单省
                                                    <Text>{formPage === 'PACKAGE' ? toDecimal(this.getTotalPrice() * buyEarn) : 0}</Text>
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
                        currentTab.value === GOODS_TAKE_OUT && (
                            <View
                                className="flex-row flex-ac flex-sb order-remark"
                                onClick={() => {
                                    navToPage(`/pages/orderRemark/orderRemark?oldRemark=${remark}`, false)
                                }}
                            >
                                <Text className="title">订单备注</Text>
                                <View className="flex1 flex-row flex-ac flex-je">
                                    <View className={`remark flex1 ellipsis ${trimAllSpace(remark).length === 0 ? 'gray' : ''}`}>
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
                                    {formPage === 'PACKAGE' ? formatCurrency(this.getTotalPrice()) : 0}
                                </Text>
                            </Button>
                        )
                    }
                </View>
            
                {/* 选择堂食预定时间弹窗 */}
                <AtFloatLayout
                    isOpened={showEatInTimeModal}
                    onCloseLayout={this.eatinTimeModal.bind(this)}
                >
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
                </AtFloatLayout>
                   
                {/* 选择外卖时间弹窗 */}
                <AtFloatLayout
                    isOpened={showTakeOutTimeModal}
                    onCloseLayout={this.takeoutTimeModal.bind(this)}
                >
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
                </AtFloatLayout>

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
                        <View className="list-wrap">
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
                                                    <View className="date">
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
                                            usableRedPackage.length > 0 && (
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
                        </View>
                    </View>
                </AtFloatLayout>

                {/* 支付弹窗 */}
                {
                    notFormDine && (
                        <Payment
                            createOrder={this.saveOrder}
                            payBoxVisible={payBoxVisible}
                            paymentAmount={formPage === 'PACKAGE' ? this.getTotalPrice() : moneyInfo.amount}
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

export default AllOrderConfirm