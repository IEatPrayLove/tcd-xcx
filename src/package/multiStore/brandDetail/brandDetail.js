import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Text, Image
} from '@tarojs/components'
import {
  AtLoadMore
} from 'taro-ui'
import {
  connect
} from '@tarojs/redux'

import './brandDetail.scss'
import {
  getCurrentLoaction,
  getPlatFormId,
  getServerPic,
  getUserLocation, latelyMerchant,
  navToPage, needLogin,
  productTypeAnd, saveCurrentLocation, showToast
} from '../../../utils/utils'
import { MERCHANT_MODEL, SIZE } from '../../../config/config'

@connect(() => ({}))
export default class BrandDetail extends PureComponent {
  config = {
    navigationBarTitleText: '加载中...',
    enablePullDownRefresh: true
  }

  constructor() {
    super()
    this.state = {
      curPage: 0,
      merchantList: [],
      pagination: {
        curPage: 0,
        sort: 2
      },
      noMore: false,
      brandInfo: { ...this.$router.preload },
      deliveryArea: null, // 配送范围
      minShop: {}, // 距离最近门店
    }
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    })
  }

  componentDidShow() {
    console.log(this.$router.params)
    if (!needLogin()) return
  }

  componentDidMount() {
    const {
      pagination,
      brandInfo: { brandName }
    } = this.state
    Taro.setNavigationBarTitle({ title: brandName || '品牌详情' })
    this.getMerchantList(pagination)
  }

  getMerchantList = ({ curPage, sort }) => {
    const { dispatch } = this.props
    const { brandInfo: { id }, merchantList } = this.state
    const { longitude, latitude } = getUserLocation()
    dispatch({
      type: 'merchant/getMerchantByBrandAction',
      payload: {
        page: curPage,
        orderType: sort,
        size: SIZE,
        position: `${longitude},${latitude}`,
        brandId: id,
        platformId: getPlatFormId() // 测试数据: 平台id, 49
      },
      callback: ({ ok, data, header }) => {
        if (ok) {
          Taro.stopPullDownRefresh()
          const newList = [...merchantList, ...data]
          const total = header['X-Total-Count'] - 0
          this.setState({
            merchantList: newList,
            noMore: total === newList.length
          })
        }
      }
    })
  }

  listSortHandle = val => {
    const { pagination } = this.state
    this.setState({
      pagination: { curPage: 0, sort: val },
      merchantList: [],
      noMore: false
    }, () => {
      this.getMerchantList(this.state.pagination)
    })
  }

  onReachBottom() {
    const {
      pagination: { sort, curPage }, noMore
    } = this.state
    if (noMore) return
    this.setState({
      pagination: { sort, curPage: curPage + 1 }
    }, () => {
      this.getMerchantList(this.state.pagination)
    })
  }

  onPullDownRefresh() {
    this.setState(({ pagination }) => ({
      merchantList: [],
      pagination: { ...pagination, curPage: 0 }
    }), () => {
      this.getMerchantList(this.state.pagination)
    })
  }

  render() {
    const {
      pagination: { sort },
      brandInfo: { brandLogo, brandDetailPic },
      merchantList, noMore
    } = this.state
    return (
      <Block>
        <Image mode="aspectFill" className="brandBanner" src={getServerPic(brandDetailPic)} />
        <View className="brandPic flex-col flex-ac flex-jc">
          <Image mode="aspectFill" src={getServerPic(brandLogo)} />
          <Text>全部门店</Text>
        </View>
        <View className="brandList">
          <View className="category flex-row">
            <Text onClick={() => this.listSortHandle(2)} className={sort === 2 && 'active'}>最近门店</Text>
            <Text onClick={() => this.listSortHandle(3)} className={sort === 3 && 'active'}>人气最高</Text>
          </View>
          {
            merchantList.map(ele => {
              const {
                id, merchant_name, merchantAvatar,
                merchantActivityList, distance, brand,
                platFormMerchantDTO: { outerOrderMod } = {},
                brandDTO: { brandTag } = {},
                shippingInfo, maxRebate,thirdNo
              } = ele
              const { minSendPrice, startPrice } = shippingInfo || {}
              const merchantMod = MERCHANT_MODEL.filter(({ value }) => productTypeAnd(outerOrderMod, value))
                .reduce((acc, cur) => (acc.findIndex(o => o.label === cur.label) === -1 ? [...acc, cur] : acc), [])
              const merchantDistance = distance >= 1 ? `${distance}km` : `${distance * 1000}m`

              const moneyOff = (merchantActivityList || []).reduce((acc, { activityType, activityInfo }) => {
                if (activityType === 2) { // 2: 满减活动
                  return activityInfo.find(({ businessType }, index) => businessType === null || activityInfo.length - 1 === index).fullReductionlist
                }
              }, [])
              return (
                <View
                  className="header flex-row"
                  key={id}
                  onClick={() => {
                    navToPage(`/package/multiStore/merchantDetail/merchantDetail?id=${id}&brandId=${brand}&thirdNo=${thirdNo}&merchantAvatar=${merchantAvatar}`)
                  }}
                >
                  <Image mode="aspectFill" src={getServerPic(merchantAvatar)} className="merchantPic flex-sk" />
                  <View className="merchantInfo flex-col flex-sb flex-gw">
                    <View className="flex-row flex-ac">
                      <Text className="merchantName">{merchant_name}</Text>
                      {
                        merchantMod.map(o => {
                          const { className, label, value } = o
                          return (
                            <Text key={value} className={`label ${className}`}>{label}</Text>
                          )
                        })
                      }
                    </View>
                    <View className="delivery flex-row flex-ac">
                      {
                        maxRebate && (
                          <View className="earn flex-row">
                            <Text>分享返</Text>
                            <Text>{`￥${maxRebate}`}</Text>
                          </View>
                        )
                      }
                      {
                        brandTag && (
                          <Text className="ellipsis brandTag">{brandTag}</Text>
                        )
                      }
                    </View>
                    <View className="distribution flex-row flex-sb">
                      <Text>
                        {startPrice ? `起送￥${startPrice}` : ''}
                        {minSendPrice ? ` 配送费￥${minSendPrice}` : ''}
                      </Text>
                      <Text>{merchantDistance}</Text>
                    </View>
                    <View className="merchantDiscount">
                      {
                        moneyOff.length > 0 && (
                          <Block>
                            <Text className="bg">满</Text>
                            {
                              moneyOff.map((o, index) => {
                                const { fullMoney, cutMoney } = o
                                return (
                                  <Text
                                    className={`bd ${index === moneyOff.length - 1 && 'last'}`}
                                    key={fullMoney}
                                  >
                                    {`满${fullMoney}减${cutMoney}`}
                                  </Text>
                                )
                              })
                            }
                          </Block>
                        )
                      }
                    </View>
                    <View className="line" />
                  </View>
                </View>
              )
            })
          }
        </View>
        <AtLoadMore status={noMore ? 'noMore' : 'loading'} />
      </Block>
    )
  }
}
