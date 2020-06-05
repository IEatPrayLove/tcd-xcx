import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import {
  AtLoadMore
} from 'taro-ui'
import { connect } from '@tarojs/redux'
import './merchantFunction.scss'
import IconFont from '../../../components/IconFont/IconFont'
import Merchant from '../../../components/Merchant/Merchant'
import {
  getCurrentLoaction,
  getPlatFormId, getUserDetail,
  getUserDistributor,
  getUserLocation, latelyMerchant, needLogin,
  saveCurrentLocation, showToast,
  showLoading, hideLoading, navToPage
} from '../../../utils/utils'
import { SIZE } from '../../../config/config'
import { PLATFORM_ID } from '../../../config/baseUrl'

const TAKE_OUT = 2
const SCANNING = 16
const FAVOURABLE = 8
const ALL = 26

@connect(() => ({}))
export default class MerchantList extends PureComponent {
  config = {
    navigationBarTitleText: '全部门店',
    navigationBarBackgroundColor: '#FF623D',
    enablePullDownRefresh: true,
    backgroundTextStyle: 'dark'
  }

  constructor() {
    super()
    const { merchantType } = Taro.getStorageSync('merchantType')
    this.state = {
      catModalVisible: false,
      deliveryArea: null, // 配送范围
      minShop: {}, // 距离最近门店
      pagination: {
        curPage: 0,
        merchantType: merchantType || ALL,
        sort: 2,
        merchantList: []
      },
      noMore: false,
      enterpriseGuid: null,
      userId: null,
      platformId: '',
      openid: ''
    }
  }

  componentDidShow() {
    if (!needLogin()) return
    showLoading()
    const { merchantType } = Taro.getStorageSync('merchantType')
    this.setState({
      pagination: {
        curPage: 0,
        merchantType: merchantType || 2,
        sort: 2,
        merchantList: []
      }
    }, () => {
      const { pagination } = this.state
      this.loadMerchantList(pagination)
      this.getEnterPriseId()
      this.getU_PID()
    })
  }

  componentDidMount() {
    
  }

  loadMerchantList = pagination => {
    const { dispatch } = this.props
    const { longitude, latitude } = getUserLocation()
    const {
      curPage, merchantType, sort, merchantList
    } = pagination
    dispatch({
      type: 'merchant/getAllMerchantAction',
      payload: {
        page: curPage,
        orderType: sort,
        size: SIZE,
        outerOrderMod: merchantType === '' ? '' : merchantType - 0,
        position: `${longitude},${latitude}`,
        platformId: getPlatFormId() // 49
      },
      callback: ({ ok, data, header }) => {
        if (ok) {
          Taro.stopPullDownRefresh()
          const newList = [...merchantList, ...data]
          const total = header['X-Total-Count'] - 0
          // newList.sort((a, b) => {
          //   console.log(a)
          //   return a.distance - 0 > b.distance - 0;
          // })
          this.setState({
            noMore: total === newList.length,
            pagination: {
              ...pagination,
              merchantList: newList,
              lastMerchantType: merchantType
            }
          }, () => {
            hideLoading()
          })
        }
      }
    })
  }

  // 上拉加载
  onReachBottom() {
    const {
      pagination,
      pagination: { curPage },
      noMore
    } = this.state
    if (noMore) return
    this.loadMerchantList({
      ...pagination,
      curPage: curPage + 1
    })
  }

  // 下拉刷新
  onPullDownRefresh() {
    this.loadMerchantList({
      curPage: 0,
      merchantType: ALL,
      sort: 1,
      merchantList: []
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
              const { pagination } = this.state
              this.loadMerchantList(pagination)
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

  // 小程序分享
  // onShareAppMessage() {
  //   // const { goodsDetail: { dishId, shopDish: { dishName } }, merchantInfo: { id } } = this.props
  //   const { code } = getUserDistributor()
  //   const { merchantType } = this.state.pagination
  //   return {
  //     title: merchantType === 8 ? '优惠买单' : '所有门店',
  //     path: `/pages/merchantList/merchantList?merchantType=${merchantType}&code=${code || ''}`
  //   }
  // }

  // 关闭分类弹窗
  closeCatModal = () => {
    this.setState(({ pagination, pagination: { lastMerchantType } }) => ({
      catModalVisible: false,
      pagination: { ...pagination, merchantType: lastMerchantType }
    }))
  }

  // 列表排序
  listSortHandle = val => {
    const { pagination } = this.state
    this.loadMerchantList({
      ...pagination,
      sort: val,
      curPage: 0,
      merchantList: []
    })
  }

  // 列表分类查找
  listCatHandel = val => {
    this.setState(({ pagination, pagination: { merchantType } }) => ({
      pagination: {
        ...pagination,
        merchantType: val,
        lastMerchantType: merchantType
      }
    }))
  }

  // 分类确认弹窗
  confirmBtn = () => {
    const { pagination } = this.state
    this.loadMerchantList({
      ...pagination,
      curPage: 0,
      merchantList: []
    })
    this.setState({
      catModalVisible: false
    })
  }

  // 获取userID和platformID
  getU_PID = () => {
    Taro.getStorage({
      key: 'tc_island_user_detail',
      success: res => {
        this.setState({
          userId: res.data.weappUserId,
          platformId: res.data.platformId,
          phone: res.data.phone,
        })
      }
    })
  }

  // 判断平台
  getEnterPriseId = () => {
    this.props.dispatch({
      type: 'common/getPlatFormSystemSettingByIdAction',
      callback: ({ ok, data }) => {
        if (ok) {
          const { enterpriseGuid } = data
          this.setState({
            enterpriseGuid
          })
        }
      }
    })
  }

  // 不同平台的操作
  differentPlatformAction = res => {
    // console.log(res);

    const { dispatch } = this.props
    /*
      areaGuid: "6638270379783618560"
      brandGuid: "6638270377459974144"
      diningTableGuid: "6638270379808784385"
      storeGuid: "6638270377413836800"
       */
    const {
      areaGuid, brandGuid, diningTableGuid, storeGuid
    } = res
    const { enterpriseGuid, phone, userId, platformId} = this.state

    // 获取openID
    dispatch({
      type: 'common/getOpenIDAction',
      payload: {
        userId,
        platformId
      },
      callback: res => {
        // console.log('res.ok')
        if (res.ok) {
          this.setState({
            openid: res.data.identity
          })
          const openid = res.data.identity
          // 取token
          dispatch({
            type: 'common/getOtherPlantFormTOKENAction',
            payload: {
              areaGuid,
              brandGuid,
              diningTableGuid,
              enterpriseGuid,
              storeGuid,
              openid
            },
            callback: response => {
              if (response.data.code == 0) {
                const Token = response.data.tdata.token
                navToPage(`/package/multiStore/choosePerson/choosePerson?wxtoken=${Token}&tableId=${diningTableGuid}&brandId=${brandGuid}&enterpriseGuid=${enterpriseGuid}&merchantId=${storeGuid}&openId=${res.data.identity}&phone=${phone}`)
              } else {
                // showToast(response.data.message);
                showToast('二维码有误')
              }
            }
          })
        } else {
          showToast('data error')
        }
      }
    })
  }

  componentWillUnmount () {
    Taro.setStorageSync('merchantType', '')
  }

  componentDidHide () {
    Taro.setStorageSync('merchantType', '')
  }

  render() {
    const {
      catModalVisible, noMore,
      pagination: { sort, merchantList, merchantType }, enterpriseGuid
    } = this.state
    return (
      <Block>
        <View className="headerTabs flex-row flex-ac">
          <Text onClick={() => this.listSortHandle(2)} className={sort === 2 && 'active'}>综合排序</Text>
          <Text onClick={() => this.listSortHandle(3)} className={sort === 3 && 'active'}>销量最高</Text>
          <Text onClick={() => this.listSortHandle(1)} className={sort === 1 && 'active'}>新品推荐</Text>

          <View
            className="category flex-row flex-ac flex-gw flex-je"
            onClick={() => {
              this.setState({
                catModalVisible: true
              })
            }}
          >
            <Text>全部</Text>
            <IconFont value="imgArrowBottom" h={11} w={16} ml={16} />
          </View>
          {/* 分类弹窗 */}
          {
            catModalVisible && (
              <View
                className="catModal"
                onClick={this.closeCatModal}
                onTouchMove={e => e.stopPropagation()}
              >
                <View className="container" onClick={e => e.stopPropagation()}>
                  <View className="catItem flex-row flex-wrap">
                    <Text className={merchantType === ALL && 'active'} onClick={() => this.listCatHandel(ALL)}>全部</Text>
                    <Text className={merchantType === TAKE_OUT && 'active'} onClick={() => this.listCatHandel(TAKE_OUT)}>外卖</Text>
                    <Text className={merchantType === SCANNING && 'active'} onClick={() => this.listCatHandel(SCANNING)}>扫码点餐</Text>
                    <Text className={merchantType === FAVOURABLE && 'active'} onClick={() => this.listCatHandel(FAVOURABLE)}>优惠买单</Text>
                  </View>
                  <View className="operateBtn flex-row">
                    <Text onClick={this.closeCatModal}>取消</Text>
                    <Text onClick={this.confirmBtn}>确认</Text>
                  </View>
                </View>
              </View>
            )
          }
        </View>
        {
          merchantList.map(ele => <Merchant key={ele.id} merchantDetail={ele} enterpriseGuid={enterpriseGuid} differentPlatformAction={this.differentPlatformAction} />)
        }
        {/* <AtLoadMore status={noMore ? 'noMore' : 'loading'} /> */}
      </Block>
    )
  }
}
