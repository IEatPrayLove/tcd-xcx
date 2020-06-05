import Taro from '@tarojs/taro'
import {
  Image, ScrollView, Swiper, SwiperItem, Text, View
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import {
  AtActivityIndicator, AtButton, AtIcon, AtProgress
} from 'taro-ui'
import './orderDishes.scss'
import {
  calculateDistanceByCoordinate,
  callPhone,
  dateFormatWithDate,
  formatAttachPath,
  getCurrentLoaction,
  getPlatFormId,
  getServerPic, getUserLocation,
  hideLoading,
  navToPage,
  needLogin,
  objNotNull,
  saveCurrentLocation,
  showLoading,
  showToast,
  timeIsRange,
  typeAnd
} from '../../../utils/utils'
import {
  BANNER_POSITION,
  CATEGORY_TABS_HEIGHT,
  GOODS_MODEL,
  HOME_NAV_TEST,
  HOME_TABS,
  LOCATION_TYPE_HEIGHT,
  MERHCANT_WEEK,
  PROMPT, SHOP_MODE_ENUM, SIZE
} from '../../../config/config'
import { STATIC_IMG_URL } from '../../../config/baseUrl'
import Menu from '../../../components/Menu/Menu'

/* if (process.env.TARO_ENV === "weapp") {
    require("taro-ui/dist/weapp/css/index.css")
} else if (process.env.TARO_ENV === "h5") {
    require("taro-ui/dist/h5/css/index.css")
} */

@connect(({ orderDishes, loading }) => ({
  ajaxLoading: loading,
  platformSystemSetting: orderDishes.platformSystemSetting,
  isSnoring: orderDishes.isSnoring
}))
class OrderDishes extends Taro.Component {
  config = {
    navigationBarTitleText: '轮流赚',
    onReachBottomDistance: 50,
    // enablePullDownRefresh: true,
    backgroundTextStyle: 'dark'
  }

  constructor() {
    super()
    let systemInfo = {}
    Taro.getSystemInfo({//  获取页面的有关信息
      success(res) {
        systemInfo = res
        Taro.setStorageSync('systemInfo', res)
      }
    })
    this.state = {
      page: 1,
      // 平台焦点图
      banners: [],
      merchantId: this.$router.params.id,
      // 平台系统设置
      platformSystemSetting: {},
      // 平台导航
      topNavs: [],
      // 用户坐标（带地址名称）
      location: { name: '请授权' },
      // 平台促销商品
      promotionDishes: [],
      // 平台所有合作商户
      merchants: [],
      // 平台推荐分类
      recommendCategories: [],
      // 用户坐标（仅坐标，不带其它行政位置信息）
      userLocation: {
        longitude: '',
        latitude: ''
      },
      showGoTop: false, // 显示回到底部图标
      currentTab: 0, // 当前选中的选项卡
      pageUpperContentHeight: '',
      menuIsScroll: false, // 菜单左右滑动控制
      pageIsScroll: true, // 主页滚动设置, 保证每次滚动只执行一次
      windowHeight: systemInfo.windowHeight, // 当前设备高度
      pageScrollTop: 0,
      pageScrollAnchor: '',
      currentMerchant: {},
      dishList: [],
      maskVisible: false,
      currentSwiper: 0,
      showCarVisible: true,
      showPromptVisible: false,
      businessWeek: [],
      adInfo: {}, // 主页广告弹窗
      adVisible: true, // 弹窗状态
      shopHours: '',
      businessHours: '',
      merchantIndex: 0,
      favourableList: [],
      shippingType: null,
      shippingInfo: {}
    }
    this.percent = systemInfo.windowWidth / 750
  }

  onShareAppMessage(options) {
    // return custom share data when user share.
    if (options.from === 'menu') {


    }
    return {
      success(res) {
        // console.log(res);
      },
      // ## 转发操作失败/取消 后的回调处理，一般是个提示语句即可
      fail() {

      }
    }
  }

  componentWillMount() {
    // this.firstLocation()
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: '#ffffff'
    })
  }

  componentDidShow() {
    // this.initData()
    if (!needLogin()) return
    showLoading()
    this.initData()
    this.setState({
      currentSwiper: 0,
      menuIsScroll: false
    }, () => {
      const query = Taro.createSelectorQuery()
      try {
        query.select('#pageUpperContent')
          .boundingClientRect(res => {
            // console.log(res)
            this.setState({
              pageUpperContentHeight: res === null ? 0 : res.height
            })
          })
          .exec()
      } catch (e) {
        this.setState({
          pageUpperContentHeight: 0
        })
      }
    })
  }

  firstLocation = () => {
    const userLocation = getCurrentLoaction()
    if (!userLocation) {
      Taro.getLocation({
        type: 'gcj02',
        altitude: true,
        success: res => {
          // 根据坐标获取地理位置名称
          if (objNotNull(res) && res.errMsg === 'getLocation:ok') {
            this.props.dispatch({
              type: 'orderDishes/putPutLocationNameByPositionAction',
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
                this.setState({
                  location: data,
                  showPromptVisible: false
                })
              }
            })
          }
        },
        fail: res => {
          if (res.errMsg === 'getLocation:fail auth deny') {
            showToast('请打开位置授权')
            this.setState({
              showPromptVisible: PROMPT.UNAUTHORIZED
            })
          } else {
            showToast('定位失败,请手动定位')
          }
        }
      })
    } else {
      this.setState({
        location: userLocation
      })
    }
  }

  initData = () => {
    // 获取首页数据
    this.props.dispatch({
      type: 'orderDishes/getPlatFormSystemSettingByIdAction',
      payload: { id: getPlatFormId() },
      callback: ({ ok, data }) => {
        if (ok && data.length > 0) {
          const platform = data[0] || {}
          this.setState({ page: platform.homeModel })
        } else {
          showToast('系统异常~请重新打开试试')
        }
      }
    })

    // 获取门店信息
    this.props.dispatch({
      type: 'orderDishes/getMerchantDetailAction',
      payload: {
        merchantId: this.state.merchantId,
        platformId: getPlatFormId()
      },
      callback: ({ ok, data }) => {
        if (ok) {
          const merchantInfo = data.merchantDTO
          this.setState({
            platformSystemSetting: data.merchantDTO,
            shippingType: data.shippingType,
            shippingInfo: data.shippingType === 2 ? data.shippingInfo : data.merchantShippingInfoDTO
          })
          Taro.setNavigationBarTitle({ title: data.merchantDTO.merchant_name || '轮流赚' })
          merchantInfo.shippingInfoModel = data.merchantShippingInfoDTO
          this.setState({
            shopHours: merchantInfo.shopHours,
            businessHours: merchantInfo.businessHours
            // merchantIndex: index
          }, () => {
            const week = new Date().getDay()
            const timer = this.state.shopHours.split(',')
              .some(ele => {
                const [beginTime, endTime] = ele.split('-')
                return timeIsRange(beginTime, endTime)
              })
            if (!typeAnd(this.state.businessHours, MERHCANT_WEEK[week].value) || !timer || merchantInfo.platFormMerchantDTO.merchantStatus === 0 || merchantInfo.platFormMerchantDTO.merchantStatus === 2) {
              this.setState({
                showPromptVisible: PROMPT.REST
              })
            }
            const businessWeek = MERHCANT_WEEK.filter(ele => typeAnd(this.state.businessHours, ele.value))
            this.setState({
              businessWeek
            })
          })
          this.props.dispatch({
            type: 'orderDishes/getMerchantDishAction',
            payload: {
              merchantId: this.state.merchantId
            },
            callback: res => {
              this.setState({
                currentMerchant: merchantInfo,
                dishList: res.data,
                currentTab: res.data.length === 0 ? 1 : 0
              })
            }
          })
        }
      }
    })

    // 获取满减信息
    this.props.dispatch({
      type: 'orderDishes/getFullReductionAction',
      payload: {
        platformId: getPlatFormId(),
        merchantIdList: [this.state.merchantId]
      },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            favourableList: data.length > 0 ? data[0].fullReductionlist : []
          })
        }
      }
    })
    hideLoading()
  }

  // 用户手动选择位置
  chooseLocation = () => {
    Taro.chooseLocation({
      success: res => {
        if (res.name && res.errMsg === 'chooseLocation:ok') { // 手动选择地址
          const {
            address, name, latitude, longitude
          } = res
          saveCurrentLocation({
            address,
            name,
            longitude,
            latitude
          })
          this.setState({
            location: res
          })
        }
      },
      fail: res => {
        if (res.errMsg === 'chooseLocation:fail auth deny') {
          this.openWxSetting()
        } else if (!(res.errMsg === 'chooseLocation:fail cancel')) {
          showToast('定位失败,请再次定位')
        }
      }
    })
  }

  // 尝试打开用户授权 再进行获取
  openWxSetting = () => {
    Taro.showModal({
      title: '提示',
      content: '无法获取您的位置，请点击确定授权，授权后才能为您提供距离计算及外卖配送服务',
      success: res => {
        res.confirm && Taro.openSetting({
          success: res => {
            this.firstLocation()
          }
        })
      }
    })
  }

  componentDidMount() {

  }

  componentDidHide() {
    this.setState({
      adVisible: false
    })
  }

  // 监听用户下拉动作,下拉加载第一页
  onPullDownRefresh() {
    this.loadDishList(true)
  }

  // 跳转
  onNavigateTo = url => {
    navToPage(url, true)
  }

  // page滚动函数
  onPageScroll({ scrollTop }) {
    if (scrollTop > 150) {
      this.setState({ showGoTop: true })
    } else {
      this.setState({ showGoTop: false })
    }
  }

  // 点击选项卡切换函数
  onClickTabs = val => {
    this.setState({
      currentTab: val,
      currentSwiper: 1
    })
  }

  swiperChange = e => {
    this.setState({
      currentSwiper: e.currentTarget.current,
      menuIsScroll: e.currentTarget.current === 1 || false
    })
  }

  swiperToUnder = () => {
    this.setState({
      currentSwiper: 1
    })
  }

  getDistance = () => {
    const [longitude, latitude] = this.state.currentMerchant.merchantDetails.position.split(',');
    const userLocation = getUserLocation()
    return calculateDistanceByCoordinate(latitude, userLocation.latitude, longitude, userLocation.longitude)
  }

  callPhone = phoneNumber => {
    callPhone(phoneNumber)
  }

  openLocation = merchantDetails => {
    const positions = merchantDetails.position.split(',')
    Taro.openLocation({
      latitude: Number(positions[1]),
      longitude: Number(positions[0]),
      name: merchantDetails.address,
      // address: shopDish.dishName,
      scale: 28,
      success: () => {

      },
      fail: error => {
        console.log(error)
      }
    })
  }

  // 链接到活动页
  bannerGoLink = val => {
    // console.log(val);
    if (val.dishId) {
      this.onNavigateTo(`/pages/goodsDetail/goodsDetail?dishId=${val.dishId}&platFormId=${getPlatFormId()}&merchantId=${this.state.currentMerchant.id}`)
    }
    if (val.imageLink) {
      navToPage(`/pages/activeWebView/activeWebView?link=${val.imageLink}`)
    }
  }

  // 关闭广告弹窗
  closeAd = () => {
    this.setState({
      adVisible: !this.state.adVisible
    })
  }

  render() {
    const {
      page,
      banners = [],
      topNavs,
      userLocation,
      promotionDishes,
      showGoTop,
      currentTab,
      menuIsScroll,
      currentMerchant,
      pageUpperContentHeight,
      location,
      windowHeight,
      pageIsScroll,
      pageScrollAnchor,
      dishList,
      maskVisible,
      currentSwiper,
      showPromptVisible,
      businessWeek,
      platformSystemSetting,
      adInfo,
      adVisible,
      favourableList,
      shippingType,
      shippingInfo,
      merchantId
    } = this.state
    const { platFormMerchantDTO: { merchantNetworkPropagandaPic } = {} } = currentMerchant || {}
    const { ajaxLoading } = this.props
    return (
      <View>
        <Swiper
          style={{ height: `${windowHeight}px` }}
          vertical
          nextMargin={windowHeight - pageUpperContentHeight}
          onChange={this.swiperChange}
          current={currentSwiper}
        >
          <SwiperItem>
            <View id="pageUpperContent">
              <View 
                className="merchantChoose flex-row flex-ac"
                onClick={() => {
                  navToPage(`/package/multiStore/networkList/networkList?merchantId=${merchantId}`)
                }}
              >
                <Image src={`${STATIC_IMG_URL}/icon/location_white.png`} />
                <Text>{currentMerchant.merchant_name}</Text>
                <AtIcon value="chevron-down" size="14" color="#fff" />
              </View>
              <Block>
                <View className="merchantBanner">
                  <Image src={getServerPic(merchantNetworkPropagandaPic)} />
                </View>
              </Block>
            </View>
          </SwiperItem>
          {/* { */}
          {/*  dishList && dishList.length > 0 && */}
          <SwiperItem style={{
            overflow: 'visible',
            paddingTop: '1px'
          }}
          >
            <View>
              <View
                hidden={!menuIsScroll}
                id="addrAndType"
                className="flex-row flex-sb flex-ac addrAndType"
              >
                <View 
                  className="nowMerchantBox flex-row flex-ac"
                  onClick={() => {
                    navToPage(`/package/multiStore/networkList/networkList?merchantId=${merchantId}`)
                  }}
                >
                  <Image src={`${STATIC_IMG_URL}/icon/location_color.png`} />
                  <Text>{currentMerchant.merchant_name}</Text>
                  <AtIcon value="chevron-down" size="14" color="#999" />
                </View>
                <View className="merchantType">
                  {(platformSystemSetting.platFormMerchantDTO && (platformSystemSetting.platFormMerchantDTO.outerOrderMod & SHOP_MODE_ENUM.SHIPPING.key)) === SHOP_MODE_ENUM.SHIPPING.key
                    ? <Text className="item network">外卖</Text> : null}
                  {(platformSystemSetting.platFormMerchantDTO && (platformSystemSetting.platFormMerchantDTO.outerOrderMod & SHOP_MODE_ENUM.RESERVE.key)) === SHOP_MODE_ENUM.RESERVE.key
                    ? <Text className="item pickUp">堂食</Text> : null}
                  {(platformSystemSetting.platFormMerchantDTO && (platformSystemSetting.platFormMerchantDTO.outerOrderMod & SHOP_MODE_ENUM.SHIPPING.key)) === SHOP_MODE_ENUM.SHIPPING.key && platformSystemSetting.platFormMerchantDTO.pickUpSelf
                  ? <Text className="item wuliu">自提</Text> : null}
                  {/* {(platformSystemSetting.platFormMerchantDTO && (platformSystemSetting.platFormMerchantDTO.outerOrderMod & SHOP_MODE_ENUM.RECEIVE.key)) === SHOP_MODE_ENUM.RECEIVE.key
                    ? <Text className="item wuliu">物流</Text> : null} */}
                  {/* <Text className="item network">外卖</Text> */}
                  {/* <Text className="item pickUp">自提</Text> */}
                </View>
              </View>
              <View className="tabBar flex-row flex-sa flex-ac">
                {
                  HOME_TABS.map((ele, i) => (
                    <View
                      className={`${currentTab === i && 'active'} tabItem flex-col flex-sb flex-ac`}
                      key={ele + i}
                      onClick={this.onClickTabs.bind(this, i)}
                    >
                      <span>{ele.title}</span>
                    </View>
                  ))
                }
              </View>
              {
                currentTab === 0 ? dishList && dishList.length > 0 && pageUpperContentHeight && currentMerchant
                  && (
                  <Menu
                    goodsData={dishList}
                    isScroll={menuIsScroll}
                    pageUpperContentHeight={pageUpperContentHeight}
                    virtualMerchantActivity={favourableList}
                    currentMerchant={currentMerchant}
                    onSwiperToUnder={this.swiperToUnder}
                    currentSwiper={currentSwiper}
                    showPromptVisible={showPromptVisible} // 底部有提示时, 购物车不显示
                    shippingInfo={shippingInfo}
                  />
                  )
                  : (
                    <View
                      className="merchantInfo"
                      style={{ height: `${parseInt(windowHeight - (CATEGORY_TABS_HEIGHT + LOCATION_TYPE_HEIGHT) * this.percent)}px` }}
                    >
                      {/* <View className="partner" onClick={this.onNavigateTo.bind(this, "/pages/distributor/distributor")}> */}
                      {/* <Text className="title">9.9开通合伙人，自购还可享7.5折</Text> */}
                      {/* <Text className="btn">| 立即加入</Text> */}
                      {/* </View> */}
                      <View className="merchantTitle flex-row">
                        <Image
                          className="merchantImg"
                          src={platformSystemSetting && getServerPic(platformSystemSetting.merchantAvatar)}
                        />
                        <View className="flex-col">
                          <Text className="merchantName">{currentMerchant.merchant_name}</Text>
                          <Text className="distance">
                            距您：
                            {objNotNull(currentMerchant) && this.getDistance()}
                            km
                          </Text>
                        </View>
                      </View>
                      <View className="merchantAddress">
                        <Text className="title">门店地址：</Text>
                        <Text
                          className="address ellipsis flex1"
                          onClick={this.openLocation.bind(this, currentMerchant.merchantDetails)}
                        >
                          {currentMerchant.merchantDetails.address}
                        </Text>
                        <text className="line" />
                        <Image
                          className="phoneIcon"
                          src={`${STATIC_IMG_URL}/icon/icon_phone.png`}
                          onClick={this.callPhone.bind(this, currentMerchant.merchantDetails.principal_mobile)}
                        />
                      </View>
                      <View className="openTime flex-row flex-ac">
                        <Text className="title">营业时间：</Text>
                        <Text className="time">
                          {
                          businessWeek && businessWeek.map(ele => (
                            <Text
                              key={ele.value}
                            >
                              {ele.name}
                              、
                            </Text>
                          ))
                        }
                          {' '}
                          {currentMerchant.shopHours}
                        </Text>
                      </View>
                      <View className="line" />
                      <View className="service flex-row flex-ac">
                        <Text className="title">配送服务：</Text>
                        <Text className="mt">{shippingType === 2 ? '自配送' : '美团专送'}</Text>
                        {' '}
                        <Text className="msg">品质送出服务</Text>
                      </View>
                    </View>
                  )
              }
            </View>
          </SwiperItem>
          {/* } */}
        </Swiper>
        {/* <Image */}
        {/* onClick={this.onNavigateTo.bind(this, "/pages/distributor/distributor")} */}
        {/* className={`share ${menuIsScroll && "shareHide"}`} */}
        {/* src={require("../../images/share.png")} */}
        {/* /> */}
        {
          showPromptVisible
          && (
          <View className="underPrompt flex-row flex-ac flex-jc">
            {
              showPromptVisible === PROMPT.UNAUTHORIZED && (
              <Block>
                <View className="title">允许获取您位置后才可点餐哦</View>
                <View
                  className="btn"
                  onClick={this.openWxSetting}
                >
                  立即允许
                </View>
              </Block>
              )}
            {
              showPromptVisible === PROMPT.REST
              && <View className="title">本店已休息</View>
            }
          </View>
          )
        }
        {/* 广告弹窗 */}
        {
          adInfo.imageUrl && adVisible
          && (
          <View className="adModal">
            <View className="adContainer">
              <Image
                className="adImg"
                src={getServerPic(adInfo.imageUrl)}
                onClick={this.bannerGoLink.bind(this, adInfo)}
              />
              <Image
                className="adClose"
                src={require('../../images/icons/icon_close_white.png')}
                onClick={this.closeAd}
              />
            </View>
          </View>
          )
        }
      </View>
    )
  }
}

export default OrderDishes
