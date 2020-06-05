import Taro, { Component } from '@tarojs/taro'
import {
  Button, Image, ScrollView, Swiper, SwiperItem, Text, View,
  Block
} from '@tarojs/components'
import {
  AtActionSheet, AtActionSheetItem, AtFloatLayout, AtBadge,
  AtModal, AtModalContent, AtModalAction, AtMessage
} from 'taro-ui'
import { connect } from '@tarojs/redux'
import TaroCanvasDrawer from 'taro-plugin-canvas'
import './goodsDetails.scss'
import {
  calculateDistanceByCoordinate, calculateReward, callPhone,
  dateFormatWithDate, encodeURIObj, formatAttachPath,
  formatSaleCount, getCurrentLoaction, getPlatFormId,
  getSelectorAll, getServerPic, getUserDetail, getUserLocation,
  hideLoading, isFunction, latelyMerchant, navToPage, objNotNull,
  productTypeAnd, readPartner, saveCurrentLocation, showLoading,
  showToast, toDecimal, judgeLegendsCard, remainingTime, getUserDistributor, needLogin,
  setShareInfo, parseQuery, getShareInfo, findMinSku
} from '../../utils/utils'
// import FloatLayout from '../../components/FloatLayout/FloatLayout'
import {
  GOODS_COMMODITY, GOODS_PICK_UP, GOODS_MERCHANT,
  GOODS_TAKE_OUT, GOODS_TICKET, LEGENDS_DAD, SALE_STATE, TALENT_DAD
} from '../../config/config'
// import withShare from '../../component/WithShare/WithShare'
import {
  APP_ID, MYSELF_URL, PLATFORM_ID, POSTER_URL,
  SERVER_IMG, PRODUCT_URL, STATIC_IMG_URL
} from '../../config/baseUrl'
import IconFont from '../../components/IconFont/IconFont'
import MakePoster from '../../components/MakePoster/MakePoster'
import { productPoster } from '../../config/posterConfig'
import PageLoading from '../../components/PageLoading/PageLoading'
import UserDynamic from '../../components/UserDynamic/UserDynamic'

import html2wxml from '../../components/html2wxml-template/html2wxml'
// import member from '../member/member'
import Footer from '../../components/Footer/Footer'

const dayjs = require('dayjs')

const { onfire } = Taro.getApp()

/**
 * 商品详情页面
 */
const shareObject = {
  title: '',
  imageUrl: '',
  path: ''
}

// @withShare(shareObject)
@connect(({
  goodsDetail, loading, mine, common
}) => {
  const shopDish = goodsDetail.goodsDetail.shopDish || {}
  const imgUrls = shopDish.dishImageUrl && shopDish.dishImageUrl.length > 0 ? shopDish.dishImageUrl.split(',')
    .map(o => getServerPic(o))
    : shopDish.homeImage ? [getServerPic(shopDish.homeImage)]
      : shopDish.picture ? [getServerPic(shopDish.picture)] : []
  const shopDishSkus = shopDish.shopDishSkus && shopDish.shopDishSkus.length > 0 && shopDish.shopDishSkus || []
  const useRules = goodsDetail.goodsDetail.useRules && goodsDetail.goodsDetail.useRules.length > 0 && goodsDetail.goodsDetail.useRules || []
  const merchantDetails = goodsDetail.merchantInfo && goodsDetail.merchantInfo.merchantDetails || {}
  const temAttrs = shopDish.shopDishAttributes && shopDish.shopDishAttributes.length > 0 && shopDish.shopDishAttributes || []
  let shopDishAttributes = []
  if (temAttrs.length > 0) { // 计算属性,多余一个以上的属性才让其选择
    const temps = temAttrs.filter(o => o.details.length > 0)
    if (temps.length > 0) {
      shopDishAttributes = temps.map(o => ({
        ...o,
        details: o.details.split(',')
      }))
    }
  }
  return {
    ajaxLoading: loading,
    pageLoading: loading.effects['goodsDetail/getDishDetailAction'] || loading.effects['goodsDetail/getSharePersonByDishAction'] || loading.effects['goodsDetail/getSharePersonByDishAction'],
    merchantInfo: goodsDetail.merchantInfo,
    goodsDetail: goodsDetail.goodsDetail,

    shopDish,
    imgUrls,
    shopDishSkus,
    useRules,
    merchantDetails,
    shopDishAttributes,
    talentPlatform: mine.talentPlatform,
    userDynamic: common.userDynamic
  }
})
class GoodsDetail extends Component {
  config = {
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
    navigationBarTitleText: '商品详情',
    // disableScroll: true,
    usingComponents: {
      'share-button': 'plugin://goodsSharePlugin/share-button',
      htmltowxml: 'plugin://htmltowxml/view'
    }
  }

  constructor() {
    super()

    this.state = {
      showServiceModal: false, // 服务详情弹层控制
      currentSwiper: 0, // 当前商品轮播图片数字
      dishContent: null,
      article: null,

      sharePosterModal: false, // 分享海报弹窗,
      refSwiperNumHeight: false,
      showSkusModal: false, // 多规格商品选择,

      currentSku: {},
      currentAttr: null,
      buyNums: 1, // 当前选中的数量
      deliveryArea: null, // 配送范围

      minShop: {}, // 距离最近门店

      shareModalVisible: false, // 分享弹窗
      joinGroup: false, // 加入福利群弹窗
      fromDAD: false, // 是否来自霸王餐
      conditionDAD: {}, // 霸王餐资格配置
      isLegendsCard: false, // 是否持有会员卡
      signUpFailModal: false, // 霸王餐报名失败弹窗
      activityDAD: {}, // 霸王餐详情

      shareImage: null, // 分享海报地址
      canvasStatus: false,
      config: null,
      productDis: {}, // 商品分享规格
      isPartner: false,
      userImages: [],
      makePoster: {
        renderStatus: false,
        config: {}
      },
      userNotice: [],
      notMember: false,
      userLocation: getUserLocation()
    }

    this.refSwiperNumContainer = null
  }

  componentWillMount() {

  }

  componentDidMount() {
    onfire.on('GetLocation', message => {
      // console.log('接受的坐标信息', message)
      this.setState({
        userLocation: message
      })
    })
  }

  componentDidShow() {
    // 四个入口进入商品详情
    // 1. 霸王餐
    // 2. 商品列表
    // 3. 小程序分享
    // 4. 海报分享
    // console.log('路由参数', this.$router)

    // if (!needLogin()) return
    const { dispatch } = this.props
    const { islandUserMemberDTO } = getUserDetail()
    const {
      params: {
        from, code, dishId, platFormId, q
      }
    } = this.$router

    // 判断是否是购买会员卡
    if (judgeLegendsCard(islandUserMemberDTO)) {
      this.setState({
        isLegendsCard: true
      })
    }
    // 判断是否是合伙人
    if (getUserDistributor()) {
      this.setState({
        isPartner: true
      })
    }
    // 4. 通过海报分享进入商品详情
    if (q) {
      const posterObj = parseQuery(decodeURIComponent(q))
      const { code: posterCode, dishId: posterDishId } = posterObj
      setShareInfo({
        code: posterCode,
        dishId: posterDishId
      })
      this.loadDishDetail(posterDishId, PLATFORM_ID)
      return
    }
    // 1. 判断是否来自霸王餐
    if (from === 'DineAndDash') {
      const infoDAD = JSON.parse(this.$router.params.infoDAD)
      this.setState({
        fromDAD: true,
        conditionDAD: infoDAD
      })
      dispatch({
        type: 'goodsDetail/getDineAndDashDetailAction',
        payload: {
          id: infoDAD.id,
          platformId: PLATFORM_ID
        },
        callback: ({ ok, data }) => {
          if (ok) {
            const {
              ifHadJoined,
              islandFreeLunchDTO: {
                name, lotteryTime, endTime,
                productNum, status, startTime,
                joinNum, description: freeLunchDes
              }
            } = data
            this.setState({
              activityDAD: {
                ifHadJoined,
                joinedUserNum: joinNum,
                activityName: name,
                lotteryTime: lotteryTime.replace('T', ' '),
                lotteryRemainTime: remainingTime(lotteryTime),
                remainingTime: remainingTime(endTime),
                productNum,
                status,
                endTime,
                startTime,
                freeLunchDes
              }
            })
          }
        }
      })
    }
    // 3. 小程序分享
    if (code) {
      // console.log('已本地存储分享信息:', {
      //   code, dishId
      // })
      setShareInfo({
        code, dishId
      })
    }
    // 加载商品详情
    this.loadDishDetail(dishId, platFormId)
    onfire.on('ReceiveMessages', message => {
      this.setState(({ userNotice }) => ({ userNotice: [...userNotice, message].slice(-10) }))
    })
  }

  componentDidHide() {
    onfire.un('ReceiveMessages')
  }

  // 加载门店信息数据
  loadMerchantInfo = merchantId => {
    this.props.dispatch({
      type: 'goodsDetail/getMerchantInfoAction',
      payload: { merchantId },
      callback: ({ ok, data }) => {
        // console.log('门店信息', data)
      }
    })
  }

  // 加载商品详情数据
  loadDishDetail = (dishId, platFormId) => {
    const { dispatch } = this.props
    dispatch({
      type: 'goodsDetail/getDishDetailAction',
      payload: {
        platformId: platFormId,
        dishId
      },
      callback: ({ ok, data = {} }) => {
        if (ok) {
          const {
            shopDish: { shopDishSkus }, isShow
          } = data
          const { fromDAD } = this.state
          if (!isShow && !fromDAD) {
            Taro.showModal({
              content: '该商品已下架！',
              confirmText: '查看更多',
              confirmColor: '#FF643D',
              showCancel: false,
              success: () => {
                Taro.switchTab({ url: '/pages/index/index' })
              }
            })
          }
          const price = Math.min(...(shopDishSkus.map(item => toDecimal(item.price))))
          dispatch({
            type: 'index/getProductIsDistributionAction',
            payload: { dishIds: [dishId] },
            callback: ({ ok: dOk, data: distribute }) => {
              if (dOk && distribute.length > 0) {
                const { distributorProportion, oneLevelProportion } = distribute[0]
                const minSku = findMinSku(shopDishSkus)
                const productMemberPrice = (minSku.memberPrice !== null && minSku.memberPrice !== undefined) ? `${minSku.memberPrice}` : false
                this.setState({
                  productDis: {
                    shareEarn: toDecimal((productMemberPrice || price) * distributorProportion / 100),
                    buyEarn: toDecimal((productMemberPrice || price) * distributorProportion / 100)
                  }
                })
              }
            }
          })
          const article = data && JSON.parse(data.content) || '<div style=\'font-size: 12px;color: #999999;padding-bottom: 12px;\'>暂无商品详情</div>'
          html2wxml && html2wxml.html2wxml('article', article, this, 5)
          // if (data.shopDish.productType === 2) { //仅仅外卖的时候,需要拿最近的门店信息
          const { userLocation } = this.state
          // console.log('用户坐标', userLocation)
          if (objNotNull(userLocation)) { // 首先获取用户之前的定位坐标,看是否存在
            const minShop = latelyMerchant(data.dishMerchantShippingInfo, userLocation)
            this.loadMerchantInfo(minShop.merchantId)
            this.setState({
              deliveryArea: minShop.isDeliveryRange || false,
              minShop
            })
          } else { // 没有当前位置坐标,提示用户定位
            // this.firstLocation(data)
          }
          // } else { //否则直接拿当前添加商品的时候的门店信息
          //     this.loadMerchantInfo(data.merchantId);
          // }
        } else {
          Taro.showModal({
            content: '该商品已下架！',
            confirmText: '查看更多',
            confirmColor: '#FF643D',
            showCancel: false,
            success: () => {
              Taro.switchTab({ url: '/pages/index/index' })
            }
          })
        }
      }
    })
    dispatch({
      type: 'goodsDetail/getSharePersonByDishAction',
      payload: { dishId },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            userImages: data
          })
        }
      }
    })
  }

  // 首次进入自动定位坐标
  firstLocation = goodsDetail => {
    Taro.getLocation({
      type: 'gcj02',
      altitude: true,
      success: res => {
        if (res.errMsg === 'getLocation:ok') {
          // 获取实际位置
          this.props.dispatch({
            type: 'index/putPutLocationNameByPositionAction',
            payload: {
              position: `${res.longitude},${res.latitude}`
            },
            callback: ({ ok, data }) => {
              const {
                provinceName, cityName, areaName, position, name
              } = data
              saveCurrentLocation({
                address: `${provinceName}${cityName}${areaName}`,
                name,
                longitude: position.split(',')[0] - 0,
                latitude: position.split(',')[1] - 0
              })
              const minShop = latelyMerchant(goodsDetail.dishMerchantShippingInfo, getCurrentLoaction())
              this.loadMerchantInfo(minShop.merchantId)
              this.setState({
                deliveryArea: minShop.isDeliveryRange || false,
                minShop
              })
            }
          })
        }
      },
      fail: res => {
        if (res.errMsg === 'getLocation:fail auth deny') {
          this.openWxSetting(goodsDetail)
        } else {
          showToast('定位失败,请手动定位')
        }
      }
    })
  }

  // 尝试打开用户授权 再进行获取
  openWxSetting = data => {
    Taro.showModal({
      title: '提示',
      content: '无法获取您的位置，请点击确定授权，授权后才能为您提供距离计算及外卖配送服务',
      success: res => {
        res.confirm && Taro.openSetting({
          success: res => {
            this.firstLocation(data)
          }
        })
      }
    })
  }

  // 加载商品富文本详情数据
  loadDishWxParse = dishId => {
    this.props.dispatch({
      type: 'goodsDetail/getDishWxParseAction',
      payload: { dishId },
      callback: ({ ok, data }) => {
        if (ok) {
          // const article = data && JSON.parse(data.content) || '<div style=\'font-size: 12px;color: #999999;padding-bottom: 12px;\'>暂无商品详情</div>'
          // html2wxml && html2wxml.html2wxml('article', article, this, 5)
          // this.setState({dishContent: data.content});
          hideLoading()
        }
      }
    })
  }

  setData = data => {
    // console.log(data);
    this.setState({ ...this.state, ...data })
  }

  componentWillUnmount() {
    this.props.dispatch({
      type: 'goodsDetail/clearPropsAction'
    })
  }

  componentDidHide() {
  }

  $setSharePath = () => {
    const { goodsDetail } = this.props
    return `/pages/goodsDetail/goodsDetail?dishId=${goodsDetail.shopDish.id}&platFormId=${getPlatFormId()}&merchantId=${goodsDetail.merchantId}`
  }

  $setShareTitle = () => {
    const { goodsDetail } = this.props
    return goodsDetail.shopDish.shareContent ? goodsDetail.shopDish.shareContent : goodsDetail.shopDish.dishName
  }

  $setShareImageUrl = () => {
    const { goodsDetail } = this.props
    return formatAttachPath(goodsDetail.shopDish.picture)
  }

  // 拨打电话
  onClickCallPhone = phoneNumber => {
    callPhone(phoneNumber)
  }

  clickServiceModal = () => {
    this.setState({ showServiceModal: !this.state.showServiceModal })
  }

  // 商品轮播图片滚动数字显示
  onChangeSwiper = swiper => {
    const currentSwiper = swiper.detail.current
    getSelectorAll(this.refSwiperNumContainer._selector, res => {
      this.setState({
        currentSwiper,
        refSwiperNumHeight: res[0][0].height
      })
    }, this.$scope)
  }

  refSwiperNumValue = node => {
    this.refSwiperNumContainer = node
  }

  // 返回首页
  goHomePage = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  // 立即抢购
  buyNow = goodsDetail => {
    const { userLocation } = this.state
    if (!userLocation) {
      // this.openWxSetting(goodsDetail)
      return
    }
    const { productType } = goodsDetail.shopDish
    const { deliveryArea, minShop } = this.state
    const { merchantInfo: { id } } = this.props
    if (productType === GOODS_TAKE_OUT && !deliveryArea) {
      Taro.showModal({
        content: '您当前定位已超出该商品的配送范围可重新定位进行购买',
        confirmText: '重新定位',
        confirmColor: '#FBAB48'
      })
        .then(res => {
          if (res.confirm) {
            const { latitude, longitude } = location
            Taro.navigateTo({
              // 传递当前用户位置
              url: `/pages/mapRange/mapRange?latitude=${latitude}&longitude=${longitude}&range=${JSON.stringify(goodsDetail.dishMerchantShippingInfo)}`
            })
          }
        })
      return
    }
    if (objNotNull(this.state.currentSku)) {
      goodsDetail.shopDish.currentSku = this.state.currentSku
    }
    if (this.state.currentAttr) {
      goodsDetail.shopDish.currentAttr = this.state.currentAttr
    }
    const selectedStr = this.formatGoodsDetailSelected()
    if (selectedStr && selectedStr !== '()') {
      goodsDetail.shopDish.selectedSkuAndAttrStr = selectedStr
    }
    if (this.state.buyNums) {
      goodsDetail.shopDish.buyNums = this.state.buyNums
    }
    // 判断库存
    const { shopDish: { shopDishSkus } } = goodsDetail
    showLoading()
    this.props.dispatch({
      type: 'dineAndDash/judgeDineStockAction',
      payload: {
        skuId: objNotNull(this.state.currentSku) ? this.state.currentSku.id : shopDishSkus[0].id
      },
      callback: ({ ok, data }) => {
        hideLoading()
        if (ok && !data) {
          Taro.showModal({
            content: '该商品已售完！',
            confirmColor: '#FF643D',
            showCancel: false
          })
          return
        }
        navToPage(`/package/multiStore/allOrderConfirm/allOrderConfirm?merchantId=${id}&goodsDetail=${encodeURIObj({ ...goodsDetail, content: '' })}&formPage=PACKAGE`)
      }
    })
  }

  // 选择属性
  clickAttr = (shopDish, item, detail) => {
    const currentAttr = this.state.currentAttr || {}
    currentAttr[`${shopDish.id}_${item.id}`] = {
      name: item.name,
      details: detail,
      id: item.id
    }
    this.setState({
      currentAttr
    })
  }

  // 增加数量
  addGoods = shopDishSkus => {
    if (this.state.buyNums >= shopDishSkus.stock) {
      showToast('已超过最大库存,不能在添加了')
      return
    }
    this.setState({ buyNums: this.state.buyNums + 1 })
  }

  // 减少数量
  cutGoods = () => {
    this.setState({ buyNums: this.state.buyNums - 1 })
  }

  // 格式化规格属性
  formatGoodsDetailSelected = () => {
    const { currentSku, currentAttr } = this.state
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

  /** ********合伙人海报生成失败************ */

  // 关闭分享弹窗
  closeShareModal = () => {
    this.setState({
      shareModalVisible: false
    })
  }

  // 霸王餐报名
  handleSignUp = () => {
    const {
      conditionDAD: { condition }, isLegendsCard,
      activityDAD: { ifHadJoined, status }
    } = this.state
    const {
      islandFreeLunchCondition,
      islandFreeLunchUserIdentity,
      winRatioConfig
    } = condition
    if (ifHadJoined || status !== 'SIGNING') return
    const { talentPlatform: { authList }, dispatch } = this.props
    const { grade } = getUserDetail()
    let meetCondition = true
    if (islandFreeLunchCondition === 'USER_IDENTITY') {
      islandFreeLunchUserIdentity.map(ele => {
        if ((ele === TALENT_DAD && authList.length <= 0) || (ele === LEGENDS_DAD && !isLegendsCard)) {
          meetCondition = false
        }
      })
    }
    if (islandFreeLunchCondition === 'USER_LEVEL' && winRatioConfig[0].grade > grade) {
      meetCondition = false
    }
    // console.log(condition)
    // console.log(meetCondition)
    if (!meetCondition) {
      this.setState({
        signUpFailModal: true
      })
    } else {
      const { id } = JSON.parse(this.$router.params.infoDAD)
      const { activityDAD: { remainingTime } } = this.state
      showLoading('报名中')
      dispatch({
        type: 'dineAndDash/signUpDineAndDashAction',
        payload: {
          islandFreeLunchId: id,
          platFormId: PLATFORM_ID
        },
        callback: ({ ok, data: { message } }) => {
          hideLoading()
          if (ok) {
            const { params } = this.$router
            const {
              activityDAD: {
                lotteryTime
              }
            } = this.state
            navToPage(`/pages/dineAndDash/applySuccess?time=${lotteryTime}&dineInfo=${JSON.stringify(params)}`)
          } else {
            Taro.showModal({
              title: '',
              content: message || '报名失败，请重试!',
              showCancel: false,
              confirmColor: '#FF643D'
            })
          }
        }
      })
    }
  }

  signUpFailLevelCondition = () => {
    const { conditionDAD: { condition = {} } } = this.state
    const {
      islandFreeLunchCondition,
      winRatioConfig
    } = condition
    if (islandFreeLunchCondition === 'USER_LEVEL') {
      return winRatioConfig[0].grade
    }
    return false
  }

  // 调用绘画 => canvasStatus 置为true、同时设置config
  canvasDrawFunc = () => {
    const { code } = getUserDistributor()
    const { nickName, headPic } = getUserDetail()
    const {
      dispatch,
      goodsDetail: {
        dishId, imagePath, shopDish: {
          dishName, description, shopDishSkus // Math.max(...(shopDishSkus.map(item => toDecimal(item.originalPrice))))
        }
      },
      merchantInfo: {
        id, merchant_name, merchantDetails: {
          address, principal_mobile
        }
      }
    } = this.props
    const {
      productDis: { buyEarn }
    } = this.state
    const price = Math.min(...(shopDishSkus.map(item => toDecimal(item.memberPrice ? item.memberPrice : item.price))))
    const OriginalPrice = Math.max(...(shopDishSkus.map(item => toDecimal(item.memberPrice ? item.price : item.originalPrice))))
    this.closeShareModal()
    Taro.showLoading({
      title: '绘制中...'
    })
    dispatch({
      type: 'legendsCard/getShareQrCodeAction',
      payload: {
        qrContent: encodeURIComponent(`${PRODUCT_URL}?code=${code || ''}&dishId=${dishId}&merchantId=${id}&platFormId=${PLATFORM_ID}`),
        userId: getUserDetail().id,
        appId: APP_ID
      },
      callback: ({ ok, data }) => {
        if (ok && data.url) {
          const config = productPoster({
            headPic,
            imagePath,
            codeUrl: data.url,
            nickName,
            dishName,
            description,
            price,
            OriginalPrice,
            shopDishSkus,
            merchant_name,
            address,
            principal_mobile,
            buyEarn
          })
          this.setState({
            makePoster: {
              renderStatus: true,
              config
            }
          })
        } else {
          Taro.hideLoading()
        }
      }
    })
  }

  // 小程序分享
  onShareAppMessage() {
    const { goodsDetail: { dishId, shopDish: { dishName } }, merchantInfo: { id } } = this.props
    const { code } = getUserDistributor()
    return {
      title: dishName,
      path: `/pages/goodsDetails/goodsDetails?dishId=${dishId}&platFormId=${PLATFORM_ID}&merchantId=${id}&code=${code || ''}`
    }
  }

  // 获取霸王餐中奖商品信息
  getDineDashPrice = () => {
    const { skuId } = this.$router.params
    const { shopDishSkus = [] } = this.props
    const { originalPrice, price } = shopDishSkus.find(({ id }) => skuId == id) || {}
    return originalPrice || price || 0
  }

  // 判断是否认证达人
  judgeTalent = condition => {
    const {
      islandFreeLunchCondition,
      islandFreeLunchUserIdentity,
      winRatioConfig
    } = condition
    const { talentPlatform = {} } = this.props
    const { authList } = talentPlatform
    if (islandFreeLunchCondition === 'USER_IDENTITY' && islandFreeLunchUserIdentity.includes(TALENT_DAD) && authList <= 0) {
      return true
    }
    return false
  }

  judgeTcd = condition => {
    const {
      isLegendsCard
    } = this.state
    const {
      islandFreeLunchCondition,
      islandFreeLunchUserIdentity,
      winRatioConfig
    } = condition
    if (islandFreeLunchCondition === 'USER_IDENTITY' && islandFreeLunchUserIdentity.includes(LEGENDS_DAD) && !isLegendsCard) {
      return true
    }
    return false
  }

  render() {
    const {
      showServiceModal, currentSwiper, refSwiperNumHeight = false,
      showSkusModal, currentSku, currentAttr, buyNums, deliveryArea,
      shareModalVisible, joinGroup, fromDAD, conditionDAD: { condition = [], label },
      isLegendsCard, signUpFailModal, productDis, productDis: { shareEarn, buyEarn }, isPartner,
      activityDAD: {
        ifHadJoined, joinedUserNum, activityName,
        lotteryTime, remainingTime, productNum,
        lotteryRemainTime, status, endTime = '', startTime = '',
        freeLunchDes
      }, config, canvasStatus, shareImage, userImages, makePoster,
      userNotice, notMember, userLocation
    } = this.state
    const {
      merchantInfo, goodsDetail, shopDish = {}, imgUrls = [],
      shopDishSkus = [], useRules = [], merchantDetails = {},
      shopDishAttributes, ajaxLoading = {}, pageLoading
    } = this.props
    let lng
    let lat
    if (merchantDetails.position) {
      const location = merchantDetails.position.split(',')
      lng = location[0]
      lat = location[1]
    }
    const { longitude, latitude } = userLocation
    const minSku = findMinSku(shopDishSkus)
    const productMemberPrice = (minSku.memberPrice !== null && minSku.memberPrice !== undefined) ? `${minSku.memberPrice}` : false
    // let productMemberPrice
    // const hasMemberPrice = shopDishSkus.some(({ limitMemberPrice, memberPrice }) => {
    //   if (limitMemberPrice && memberPrice) {
    //     productMemberPrice = memberPrice
    //     return true
    //   }
    //   return false
    // })
    return (
      <View className="flex-col goods-detail-wrap">
        {
          pageLoading && (
            <PageLoading />
          )
        }
        <ScrollView
          className="flex1 goods-scroll-wrap"
          scrollY={!showServiceModal || !showSkusModal}
        >
          {/* 商品轮播图片 */}
          <View className="goods-swiper">
            {
              !fromDAD && userNotice.length > 0 && (
                <View className="uerDynamic">
                  <UserDynamic type={['BUY_GOODS']} data={userNotice} />
                </View>
              )
            }
            {
              objNotNull(productDis) && isPartner && (
                <View
                  className="imageBackBtn"
                  onClick={() => {
                    this.setState({
                      shareModalVisible: true
                    })
                  }}
                >
                  {`分享返￥${toDecimal(isPartner && shareEarn)}`}
                </View>
              )
            }
            <Swiper
              indicatorColor="#fff"
              indicatorActiveColor="#FF643D"
              circular
              indicatorDots
              autoplay
              displayMultipleItems
              className="swiper-container"
              // onChange={this.onChangeSwiper.bind(this)}
            >
              {
                imgUrls.map((item, idx) => (
                  <SwiperItem
                    key={idx}
                    className="swiper-item"
                    // onClick={this.onSwiperClick.bind(this, item)}
                  >
                    <Image
                      mode="aspectFill"
                      src={item}
                      className="slide-image swiper-img"
                      lazyLoad
                    />
                  </SwiperItem>
                ))
              }
            </Swiper>
          </View>
          {/* 商品信息 */}
          <View className="goods-info">
            <View className="flex-row title">
              {
                fromDAD && label
                && (
                  <Text className="goods-type-tag">
                    {label}
                    专享
                  </Text>
                )
              }
              {fromDAD ? activityName : shopDish.dishName}
            </View>
            <View className="mulBreak description">
              {fromDAD ? freeLunchDes : (shopDish.description || '')}
            </View>
            <View className="flex-row flex-sb flex-ac">
              <View>
                {
                  productMemberPrice && (
                    <View className="memberPrice flex-row flex-ac">
                      <Text>{productMemberPrice}</Text>
                      <IconFont value="imgMemberPrice" h={28} w={93} />
                    </View>
                  )
                }
                <Text className="priceTitle">{fromDAD ? '价值' : '价格'}</Text>
                <Text className="rmb">¥</Text>
                {
                  fromDAD ? (
                    <Text
                      className="money"
                    >
                      {this.getDineDashPrice()}
                    </Text>
                  ) : (
                    <Block>
                      <Text
                        className="money"
                      >
                        {shopDishSkus && shopDishSkus.length > 0 && minSku.price || ''}
                      </Text>
                      {
                        shopDishSkus && shopDishSkus.length > 0 && minSku.originalPrice && (
                          <Text className="old-price">
                            {shopDishSkus && shopDishSkus.length > 0 && `￥${minSku.originalPrice}` || ''}
                          </Text>
                        )
                      }
                    </Block>
                  )
                }
                {
                  goodsDetail.limitBuyNum
                  && (
                    <Text class="purchaseLimit">
                      (每人限购
                      {goodsDetail.limitBuyNum}
                      份)
                    </Text>
                  )
                }
              </View>

              {
                fromDAD ? (
                  <View className="signUpNum">{productNum}</View>
                ) : (
                  <View>
                    <IconFont value="icon-dizhi" size={26} />
                    <Text className="sale">
                      {merchantDetails.position && calculateDistanceByCoordinate(latitude, lat, longitude, lng)}
                      km
                    </Text>
                    {/* <Text className="sale"> */}
                    {/* 销量： */}
                    {/* {formatSaleCount(shopDishSkus)} */}
                    {/* </Text> */}
                    <Text className="sale" style="margin:0 10px;">|</Text>
                    <Text
                      className="sale"
                    >
                      剩余：
                      {shopDishSkus && shopDishSkus.length > 0 && shopDishSkus.map(sku => sku.stock || 0)
                        .reduce((a, b) => a + b) || 0}
                    </Text>
                  </View>
                )
              }
            </View>
            {
              shopDish.deliverFee && (
              <View className="goodsSendFee">
                运费：
                {shopDish.deliverFee}
                元
              </View>
              )
            }
          </View>
          {
            // 是否购买会员卡
            !isLegendsCard && (
              <View className="cardWarp">
                <View className="nielloCard flex-row flex-ac">
                  <IconFont w={48} h={43} value="imgLegendsLogo2" mr={8} />
                  {
                    objNotNull(productDis) ? (<Text className="flex1">{`开通会员卡，购买本产品预计赚￥${toDecimal(buyEarn)}`}</Text>)
                      : (<Text className="flex1">开通会员卡，预计一年能省￥3542</Text>)
                  }
                  <View
                    className="btn"
                    onClick={() => {
                      navToPage('/pages/dredgeUnionCard/dredgeUnionCard')
                    }}
                  >
                    立即开通
                    <IconFont value="icon-arrow-right-copy-copy" color="#F5D3A5" size={26} />
                  </View>
                </View>
              </View>
            )
          }
          <View className="marketingInfo">
            {
              fromDAD ? (
                <View className="prizeInfo flex-row flex-ac flex-sb">
                  <Text>
                    开奖时间：
                    {lotteryTime}
                  </Text>
                  <Text>
                    已参与
                    {joinedUserNum || 0}
                    人
                  </Text>
                </View>
              ) : (
                <View className="takePartIn">
                  <View className="peopleBuy flex-row flex-ac">
                    <View className="peopleImg flex-row flex-ac">
                      {
                        userImages.map((o, index) => <Image key={index} src={getServerPic(o)} />)
                      }
                    </View>
                    <View className="peopleNum flex1">
                      {`已参与${goodsDetail.lookNum || 0}人`}
                    </View>
                    <View>
                      {
                        objNotNull(productDis) && isPartner ? (
                          <View className="shareBackBtn">
                            {`返￥${toDecimal(isPartner && shareEarn)}`}
                          </View>
                        ) : null
                      }
                      <View
                        className="partnerBtn flex-row flex-ac flex-sb"
                        onClick={() => {
                          this.setState({
                            shareModalVisible: true
                          })
                        }}
                      >
                        <IconFont value="imgRedPackage" h={30} w={24} mr={8} />
                        <Text className="makeMoney">邀好友一起抢</Text>
                      </View>
                    </View>
                  </View>
                  {/* <View className="peopleGroup flex-row flex-ac">
                    <IconFont h={76} w={76} mr={30} value="imgGroup" />
                    <View className="groupMsg flex-col flex1">
                      加入平台成都本地生活福利群
                    </View>
                    <View
                      className="joinGroupBtn"
                      onClick={() => {
                        this.setState({
                          joinGroup: true
                        })
                      }}
                    >
                      加入
                    </View>
                  </View> */}
                </View>
              )
            }
          </View>
          {/* 门店信息 */}
          <View className="merchant-info">
            {
              (
                productTypeAnd(shopDish.productType, GOODS_COMMODITY)
                || productTypeAnd(shopDish.productType, GOODS_TAKE_OUT)
              )
              && (
              <Block>
                <View className="merchantName flex-row flex-sb">
                  <Text>{merchantInfo.merchant_name}</Text>
                  {/* <Text */}
                  {/* onClick={() => { */}
                  {/* navToPage(`/pages/merchantList/merchantList?merchantList=${JSON.stringify(goodsDetail.dishMerchantShippingInfo)}`, false) */}
                  {/* }} */}
                  {/* > */}
                  {/* {goodsDetail.dishMerchantShippingInfo.length} */}
                  {/* 家门店适用 */}
                  {/* </Text> */}
                </View>
                <View
                  className="flex-row flex-ac item"
                  onClick={() => {
                    const positions = merchantDetails.position.split(',')
                    Taro.openLocation({
                      latitude: Number(positions[1]),
                      longitude: Number(positions[0]),
                      name: merchantDetails.address,
                      address: shopDish.dishName,
                      scale: 28,
                      success: () => {

                      },
                      fail: error => {
                        console.log(error)
                      }
                    })
                  }}
                >
                  <View className="flex-row flex-ac title">
                    <IconFont value="icon-dizhi" size={26} color="#999999" pr={6} />
                    门店地址：
                  </View>
                  <View className="flex-row flex-ac content">
                    {`${merchantDetails.position && calculateDistanceByCoordinate(latitude, lat, longitude, lng)}km`}
                  </View>
                  <View className="line" />
                  <View
                    className="flex1 ellipsis content"
                  >
                    {' '}
                    {merchantDetails.address || '未知地址'}
                  </View>
                  <View onClick={e => {
                    e.stopPropagation()
                  }}
                  >
                    <IconFont
                      size={32}
                      value="icon-phone"
                      onClick={() => {
                        this.onClickCallPhone(merchantDetails.principal_mobile)
                      }}
                    />
                  </View>
                </View>
                <View className="flex-row flex-ac item">
                  <View className="flex-row flex-ac title">
                    <IconFont value="icon-shijian" size={26} color="#999999" pr={6} />
                    营业时间：
                  </View>
                  <View className="flex1 ellipsis content">{merchantInfo.shopHours || '全天营业'}</View>
                </View>
              </Block>
              )
            }
            {
              (merchantDetails.serviceDescription && merchantDetails.serviceDescription.length > 0)
              && (
              <View
                className="flex-row flex-ac item"
                style="padding-bottom:0;"
                key={i}
                onClick={this.clickServiceModal.bind(this)}
              >
                <View className="flex-row flex1">
                  <View className="flex-row flex-as title">
                    <IconFont value="icon-biaoqian" size={26} color="#999999" pr={6} />
                    服务说明：
                  </View>
                  <View className="flex1 flex-row flex-wrap content">
                    {
                      merchantDetails.serviceDescription.map((o, i) => (
                        <View key={i} className="service-tag">{o.serviceTag || '--'}</View>
                      ))
                    }
                  </View>
                </View>
                <IconFont value="icon-arrow-right-copy-copy" size="26" color="#999999" />
              </View>
              )
            }
          </View>
          {/* 商品详情 */}
          <View className="goods-detail">
            <View className="flex-row flex-ac flex-jc title">
              <View className="flex-row flex-ac line" />
              <Text className="text">商品详情</Text>
              <View className="flex-row flex-ac line" />
            </View>
            {/* 富文本商品详情 */}
            {
              process.env.TARO_ENV === 'weapp'
                ? (
                  <View
                    style={refSwiperNumHeight ? `height: ${refSwiperNumHeight}px` : ''}
                    ref={this.refSwiperNumValue}
                  >
                    <import src="../../components/html2wxml-template/html2wxml.wxml" />
                    <template is="html2wxml" data="{{wxmlData:article}}" />
                  </View>
                )
                : (
                  <View className="flex-col flex-ac flex-jc">
                    {shopDish.content}
                  </View>
                )
            }
          </View>

          {/* 购买须知 */}
          {
            productTypeAnd(shopDish.productType, GOODS_COMMODITY) && !fromDAD
            && (
            <View className="buy-relues">
              <View className="area-title">
                购买须知
              </View>
              {
                productTypeAnd(shopDish.productType, GOODS_COMMODITY)
                && (
                <View className="item">
                  <View className="title">有效期</View>
                  <View className="content">
                    {
                      shopDish.useStartTime && shopDish.useEndTime
                        ? `•${dateFormatWithDate(shopDish.useStartTime, 'yyyy-MM-dd')}至${dateFormatWithDate(shopDish.useEndTime, 'yyyy-MM-dd')}`
                        : '•永久有效'
                    }
                  </View>
                </View>
                )
              }
              <View className="item">
                <View className="title">使用规则</View>
                {
                  useRules.length > 0
                    ? useRules.map((o, i) => (
                      <View className="content" key={i}>
                        •
                        {o}
                      </View>
                    ))
                    : <View className="content">• 无规则限制</View>
                }
              </View>
            </View>
            )
          }
          <Footer />
        </ScrollView>

        {/* 立即购买 */}
        {
          objNotNull(shopDish) && !fromDAD
          && (
          <View className="flex-row flex-sb goods-detail-footer">
            {
              productMemberPrice && !isLegendsCard && (
                <View className="openTcdCard flex-row flex-ac">
                  <Text className="flex-gw">
                    开通会员卡仅售￥
                    {productMemberPrice}
                    {isPartner && objNotNull(productDis) ? `,下单还可再返￥${toDecimal(buyEarn)}元` : ''}
                  </Text>
                  <Text onClick={() => navToPage('/pages/dredgeUnionCard/dredgeUnionCard')}>立即开通</Text>
                  <IconFont onClick={() => navToPage('/pages/dredgeUnionCard/dredgeUnionCard')} value="imgBrownArrow" h={23} w={15} ml={12} />
                </View>
              )
            }
            <View className="flex-row flex-jc flex-ac footerInfo">
              <Button
                className="btn go-home"
                hoverClass="hover"
                onClick={this.goHomePage.bind(this)}
              >
                {/* <IconFont w={38} h={38} value="imgIndexBlack" /> */}
                <Image src={`${STATIC_IMG_URL}/detail-home.png`} />
                <View className="footerBtnTxt">返回首页</View>
              </Button>
              <View className="footerLine" />
              <Button
                className="btn go-client"
                // open-type="contact"
                onClick={() => {
                  Taro.makePhoneCall({
                    phoneNumber: merchantDetails.principal_mobile
                  })
                }}
              >
                <Image src={`${STATIC_IMG_URL}/detail-phone.png`} />
                <View className="footerBtnTxt">联系客服</View>
              </Button>
            </View>
            <Button
              className={`flex1 btn buy-now ${(productTypeAnd(shopDish.productType, GOODS_COMMODITY) || productTypeAnd(shopDish.productType, GOODS_TICKET) || ((productTypeAnd(shopDish.productType, GOODS_TAKE_OUT))) || productTypeAnd(shopDish.productType, GOODS_PICK_UP) || productTypeAnd(shopDish.productType, GOODS_MERCHANT)) && goodsDetail.dishState === 2 && 'yellow' || 'gray'}`}
              hoverClass="hover"
              disabled={goodsDetail.dishState !== 2 || !productTypeAnd(shopDish.productType, GOODS_COMMODITY) && !productTypeAnd(shopDish.productType, GOODS_TICKET) && !((productTypeAnd(shopDish.productType, GOODS_TAKE_OUT))) && !productTypeAnd(shopDish.productType, GOODS_PICK_UP) && !productTypeAnd(shopDish.productType, GOODS_MERCHANT)}
              onClick={() => {
                if (shopDishSkus.length > 1 || shopDishAttributes.length > 0) { // 多规格,多属性商品
                  const currentAttrs = {}
                  shopDishAttributes.map(item => {
                    const attrValues = item.details || []
                    currentAttrs[`${shopDish.id}_${item.id}`] = {
                      name: item.name,
                      details: attrValues[0],
                      id: item.id
                    }
                  })
                  this.setState({
                    currentSku: shopDishSkus[0],
                    currentAttr: currentAttrs,
                    showSkusModal: true
                  })
                } else {
                  const { islandUserMemberDTO } = getUserDetail()
                  if (productMemberPrice && minSku.limitMemberPrice && !judgeLegendsCard(islandUserMemberDTO)) {
                    this.setState({
                      notMember: true
                    })
                    return
                  }
                  this.buyNow(goodsDetail)
                }
              }}
            >
              {
                (
                  !productTypeAnd(shopDish.productType, GOODS_COMMODITY)
                  && !productTypeAnd(shopDish.productType, GOODS_TICKET)
                  && !productTypeAnd(shopDish.productType, GOODS_TAKE_OUT)
                  && !productTypeAnd(shopDish.productType, GOODS_PICK_UP)
                  && !productTypeAnd(shopDish.productType, GOODS_MERCHANT)
                ) ? '商品类型未知'
                : goodsDetail.dishState === 2 ? (
                  <Text
                    class="shareReward"
                  >
                    立即下单
                    {isPartner && objNotNull(productDis) ? `（赚￥${toDecimal(buyEarn)}元）` : ''}
                    {calculateReward(shopDishSkus[0]) && `（${calculateReward(shopDishSkus[0])}）`}
                  </Text>
                )
                  : (SALE_STATE[goodsDetail.dishState]) && SALE_STATE[goodsDetail.dishState].value || '未知状态'}
            </Button>
          </View>
          )
        }
        {/* 霸王餐 立即报名 */}
        {
          fromDAD && (
            <View className="signUp flex-row flex-ac">
              <IconFont
                value="imgIndex"
                h={40}
                w={40}
                onClick={() => {
                  Taro.switchTab({ url: '/pages/index/index' })
                }}
              />
              <View className="deadline flex-col flex1">
                {
                  dayjs(endTime).isBefore(dayjs()) ? (
                    <Block>
                      <Text className="title">截止日期：</Text>
                      <Text className="time">{endTime.replace('T', ' ')}</Text>
                    </Block>
                  ) : ifHadJoined ? (
                    <Block>
                      <Text className="title">距离开奖还有：</Text>
                      <Text className="time">{lotteryRemainTime}</Text>
                    </Block>
                  ) : status === 'SIGNING' ? (
                    <Block>
                      <Text className="title">距离报名截止：</Text>
                      <Text className="time">{remainingTime}</Text>
                    </Block>
                  ) : status === 'UNSTART' && (
                    <Block>
                      <Text className="title">开始日期：</Text>
                      <Text className="time">{startTime.replace('T', ' ')}</Text>
                    </Block>
                  )
                }
              </View>
              <Button
                className={`signUpBtn ${(ifHadJoined || (status !== 'SIGNING')) && 'alreadySignUp'}`}
                onClick={this.handleSignUp}
                disabled={ajaxLoading.effects['dineAndDash/signUpDineAndDashAction']}
                loading={ajaxLoading.effects['dineAndDash/signUpDineAndDashAction']}
              >
                {dayjs(endTime).isBefore(dayjs()) ? '已截止' : ifHadJoined ? '已报名' : (status === 'SIGNING' ? '我要报名' : (status === 'UNSTART' && '未开始'))}
              </Button>
            </View>
          )
        }
        <AtFloatLayout
          isOpened={showServiceModal}
          onClose={() => {
            this.setState({ showServiceModal: !this.state.showServiceModal })
          }}
        >
          <View className="flex-col service-warp">
            <View className="header">服务说明</View>
            <View className="service-list flex1">
              {
                (merchantDetails.serviceDescription && merchantDetails.serviceDescription.length > 0)
                && merchantDetails.serviceDescription.map((o, i) => (
                  <View
                    className="item"
                    key={i}
                  >
                    <View className="title">{o.serviceTag || '--'}</View>
                    <View className="content">{o.serviceTagDescription || '暂无说明'}</View>
                  </View>
                ))
              }
            </View>
          </View>
        </AtFloatLayout>

        <AtFloatLayout
          className="specificationModal"
          isOpened={showSkusModal}
          onClose={() => {
            this.setState({ showSkusModal: !this.state.showSkusModal })
          }}
        >
          <View className="flex-col skus-wrap">
            <View className="header">规格/属性选择</View>
            <View className="skus-content">
              {
                shopDishSkus.length > 1
                && (
                <Block>
                  <View className="title">规格：</View>
                  <View className="flex-row sku-item-wrap flex-wrap">
                    {
                      shopDishSkus.map((o, i) => (
                        <Button
                          key={i}
                          className={`sku-item ${currentSku.id === o.id ? 'active' : ''}`}
                          onClick={() => {
                            this.setState({ currentSku: o })
                          }}
                        >
                          {o.spec}
                        </Button>
                      ))
                    }
                  </View>
                </Block>
                )
              }
              {
                shopDishAttributes && shopDishAttributes.length > 0
                && (
                <Block>
                  {
                    shopDishAttributes.map((o, i) => (
                      <View key={i}>
                        <View className="title">
                          {o.name}
                          ：
                        </View>
                        <View className="flex-row sku-item-wrap flex-wrap">
                          {
                              o.details.map((a, j) => (
                                <Button
                                  key={`${o.id}_${j}_${a}`}
                                  _attr={o}
                                  className={`sku-item ${currentAttr[`${shopDish.id}_${o.id}`] && currentAttr[`${shopDish.id}_${o.id}`].details === a ? 'active' : ''}`}
                                  onClick={this.clickAttr.bind(this, shopDish, o, a)}
                                >
                                  {a}
                                </Button>
                              ))
                            }
                        </View>
                      </View>
                    ))
                  }
                </Block>
                )
              }
            </View>
            <View className="line" />
            <View className="flex-row flex-jc price-wrap">
              <View className="flex1">
                <View className="flex-row flex-ae">
                  <Text className="rmb">¥</Text>
                  <Text className="price-num">{toDecimal(((isLegendsCard && currentSku.memberPrice !== null && currentSku.memberPrice !== undefined) ? currentSku.memberPrice : currentSku.price) * buyNums)}</Text>
                  <Text className="sku-attr">
                    {
                      this.formatGoodsDetailSelected()
                    }
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-jc flex-ac">
                {
                  buyNums > 1
                  && (
                  <View
                    className="btn cut"
                    hoverClass="hover"
                    hoverStartTime={10}
                    hoverStayTime={100}
                    onClick={this.cutGoods.bind(this)}
                  >
                    －
                  </View>
                  )
                }
                <View className="part">{buyNums}</View>
                <View
                  className="btn add"
                  hoverClass="hover"
                  hoverStartTime={10}
                  hoverStayTime={100}
                  onClick={this.addGoods.bind(this, currentSku)}
                >
                  +
                </View>
              </View>
            </View>
            <Button
              className="sku-buy-btn"
              hoverClass="hover"
              onClick={() => {
                if (currentSku.memberPrice !== null && currentSku.memberPrice !== undefined && currentSku.limitMemberPrice && !isLegendsCard) {
                  this.setState({
                    notMember: true,
                    showSkusModal: false
                  })
                  return
                }
                this.buyNow(goodsDetail)
                this.setState({
                  showSkusModal: false
                })
              }}
            >
              立即购买
            </Button>
          </View>
        </AtFloatLayout>

        <AtActionSheet
          onClose={() => {
            this.setState({ shareModalVisible: false })
          }}
          className="shareModal"
          isOpened={shareModalVisible}
        >
          <AtActionSheetItem onClick={this.closeShareModal}>
            <Button open-type="share" className="shareBtn">分享给朋友</Button>
          </AtActionSheetItem>
          <AtActionSheetItem onClick={this.canvasDrawFunc}>
            <View className="sharePoster">生成海报</View>
          </AtActionSheetItem>
          <AtActionSheetItem onClick={this.closeShareModal}>
            {
              objNotNull(goodsDetail)
              && (
                <View className="goodArticle flex-row flex-ac flex-jc">
                  <shareButton
                    product={{
                      item_code: `${goodsDetail.dishId}`,
                      title: goodsDetail.shopDish.dishName,
                      desc: goodsDetail.shopDish.description,
                      category_list: '美食',
                      image_list: [getServerPic(goodsDetail.shopDish.dishImageUrl)],
                      src_mini_program_path: `/pages/goodsDetails/goodsDetails?dishId=${goodsDetail.dishId}&platFormId=${PLATFORM_ID}&merchantId=${goodsDetail.merchantId}`
                    }}
                    type={1}
                    btn-class="articleTitle"
                  />
                </View>
              )
            }
          </AtActionSheetItem>
        </AtActionSheet>

        {/* 分享海报弹窗 */}
        <MakePoster
          {...makePoster}
          onClose={() => {
            this.setState({
              makePoster: {
                renderStatus: false,
                config: {}
              }
            })
          }}
        />

        <AtModal
          className="joinGroup"
          isOpened={joinGroup}
          onClose={() => {
            this.setState({
              joinGroup: false
            })
          }}
        >
          <AtModalContent>
            <Text>点击按钮，发送“666”\n立刻加入福利群</Text>
          </AtModalContent>
          <AtModalAction>
            <Button
              openType="contact"
              onClick={() => {
                this.setState({
                  joinGroup: false
                })
              }}
            >
                确定
            </Button>
          </AtModalAction>
        </AtModal>

        {/* 报名失败弹窗 */}
        <AtModal
          isOpened={signUpFailModal}
          className="failModal"
          onClose={() => {
            this.setState({
              signUpFailModal: false
            })
          }}
        >
          <AtModalContent>
            <View className="flex-col">
              <Text className="title">报名失败！</Text>
              <Text>满足以下条件即可报名：</Text>
              {
                this.signUpFailLevelCondition() && (
                  <Text>
                    用户等级达到Tv
                    {this.signUpFailLevelCondition()}
                  </Text>
                )
              }
              {
                this.judgeTalent(condition) && (
                  <Text onClick={() => { navToPage('/pages/achievementCertification/achievementCertification') }}>
                    认证达人，
                    <Text className="now">立即认证>></Text>
                  </Text>
                )
              }
              {
                this.judgeTcd(condition) && (
                  <Text onClick={() => { navToPage('/pages/dredgeUnionCard/dredgeUnionCard') }}>
                    购买会员卡，
                    <Text className="now">立即购买>></Text>
                  </Text>
                )
              }
              <View
                className="btn"
                onClick={() => {
                  Taro.navigateBack()
                }}
              >
                参与其它活动
              </View>
            </View>
          </AtModalContent>
        </AtModal>

        {/* 加入会员弹窗 */}
        {
          notMember && (
            <View className="memberModal">
              <View className="container flex-col flex-ac">
                <View>您目前还不是会员</View>
                <View>快来成为会员享受福利吧</View>
                <View
                  className="now"
                  onClick={() => {
                    this.setState({
                      notMember: false
                    })
                    navToPage('/pages/dredgeUnionCard/dredgeUnionCard')
                  }}
                >
                  立即成为会员
                </View>
                <View className="reject" onClick={() => this.setState({ notMember: false })}>残忍拒绝</View>
              </View>
            </View>
          )
        }
        <AtMessage />
      </View>
    )
  }
}


export default GoodsDetail
