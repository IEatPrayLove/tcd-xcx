import Taro, { Component } from '@tarojs/taro'
import {
  Block, Button, Image, ScrollView, Text, View
} from '@tarojs/components'
import {
  AtIcon, AtInput, AtTag
} from 'taro-ui'
import './search.scss'
import { connect } from '@tarojs/redux'
import {
  getSearchHistory,
  saveSearchHistory,
  trimAllSpace,
  removeSearchHistory,
  getPlatFormId,
  getUserLocation, productTypeAnd, getServerPic, showLoading, hideLoading, navToPage
} from '../../../utils/utils'
import {
  MERCHANT_MODEL,
  SIZE
} from '../../../config/config'
import NoData from '../../../components/NoData/NoData'
import { STATIC_IMG_URL } from '../../../config/baseUrl'

/**
 * 搜索页面
 */
@connect(({
  loading: { effects }
}) => ({
  effects
}))
export default class Search extends Component {
    config = {
      navigationBarTitleText: '搜索'
    };

    constructor() {
      super()
      this.state = {
        searchWord: '', // 搜索关键字
        showResult: false, // 显示搜索结果页面
        searchHistory: [], // 搜索历史
        userLocation: getUserLocation(),
        currentPage: 0,
        merchantList: []
      }
    }

    componentWillMount() {
      Taro.setNavigationBarColor({
        backgroundColor: Taro.getStorageSync('systemColor'),
        frontColor: "#ffffff"
      })
    }

    componentDidMount() {
      getSearchHistory(res => {
        this.setState({
          searchHistory: res.data ? res.data : []
        })
      })
    }

    // 搜索框输入变化
    handleChange = value => {
      if (!value) {
        this.setState({
          showResult: false
        })
      }
      this.setState({
        searchWord: value
      })
    };

    // 搜索函数执行
    onSearch = () => {
      if (!this.state.searchWord) return
      const searchWord = trimAllSpace(this.state.searchWord)
      const { currentPage, userLocation = {} } = this.state
      const { longitude, latitude } = userLocation || {}
      // 储存搜索历史
      searchWord
        && getSearchHistory(res => {
          const history = res.data || []
          const index = history.indexOf(searchWord)
          index === -1 ? history.length > 6 && history.pop() : history.splice(index, 1).unshift(searchWord)
          saveSearchHistory([trimAllSpace(searchWord), ...history])
          this.setState({
            searchHistory: [trimAllSpace(searchWord), ...history]
          })
        })
      this.setState({ showResult: !this.state.showResult })
      showLoading()
      this.props.dispatch({
        type: 'takeOutConfirm/searchMerchantAction',
        payload: {
          platformId: getPlatFormId(),
          key: searchWord,
          position: `${longitude || 116.460000},${latitude || 39.920000}`,
          page: currentPage,
          size: SIZE
        },
        callback: ({ ok, data }) => {
          hideLoading()
          if (ok) {
            this.setState({
              merchantList: data
            })
          }
        }
      })
    };

    // 清空搜索历史
    removeHistory = () => {
      removeSearchHistory(res => {
        this.setState({
          searchHistory: []
        })
      })
    }

    render() {
      const {
        searchWord,
        showResult,
        searchHistory,
        merchantList
      } = this.state

      const { effects } = this.props
      return (
        <View className="flex-col search-page">
          <View className="search-header ">
            <View className="flex-row flex-ac input-wrap">
              <View className="flex1">
                <AtInput
                  autoFocus
                  className="iput"
                  placeholder="请输入商品/门店"
                  placeholderStyle="color:#999;font-size:14px;"
                  value={searchWord}
                  name="key"
                  type="text"
                  clear
                  border={false}
                  onChange={this.handleChange.bind(this)}
                />
              </View>
              <Text className="line">|</Text>
              <Button
                className="search-btn"
                hoverClass="search-hover"
                plain
                onClick={this.onSearch.bind(this)}
              >
                <AtIcon value="search" size={18} color="#999" />
              </Button>
            </View>
          </View>
          <View className="flex1 search-container">
            {
              !effects['takeOutConfirm/searchMerchantAction'] && showResult ? (
                <View className="flex-col result-wrap">
                  <ScrollView
                    className="flex1"
                    scrollY
                  >
                    {
                      merchantList && !merchantList.length && <NoData />
                    }
                    {
                      merchantList && merchantList.map(item => {
                        const {
                          maxRebate, id, merchantAvatar, offerDiscount, brand
                        } = item
                        const merchantMod = MERCHANT_MODEL.filter(({ value }) => productTypeAnd(item.outerOrderMod, value))
                        const { startPrice, minSendPrice } = item.shippingInfo || {}
                        const merchantDistance = item.distance >= 1 ? `${item.distance}km` : `${item.distance * 1000}m`
                        const moneyOff = item.merchantActivityList.reduce((acc, { activityType, activityInfo: { fullReductionlist } }) => {
                          if (activityType === 2) {
                            return fullReductionlist
                          }
                        }, [])
                        return (
                          <View 
                            className="flex-row item" 
                            key={id}
                            onClick={() => navToPage(`/package/multiStore/merchantDetail/merchantDetail?id=${id}&brandId=${brand}`)}
                          >
                            <Image
                              src={getServerPic(merchantAvatar)}
                              className="img"
                            />
                            <View className="flex1 right">
                              <View className="flex-row flex-ac name-wrap">
                                <Text className="name">{item.merchant_name}</Text>
                                {
                                  merchantMod.map(ele => {
                                    const { className, label, value } = ele
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
                                      <Text>{`${maxRebate}%`}</Text>
                                    </View>
                                  )
                                }
                                <Text className="flex-gw">
                                  {startPrice ? `起送 ¥${startPrice}` : ''}
                                  {minSendPrice ? ` 配送费 ￥${minSendPrice}` : ''}
                                </Text>
                                <Text>{merchantDistance}</Text>
                              </View>
                              <View className="merchantDiscount flex-row flex-ac">
                                {
                                  moneyOff.length > 0 && (
                                    <Block>
                                      <Text className="bg">满</Text>
                                      {
                                        moneyOff.map((ele, num) => {
                                          const { fullMoney, cutMoney } = ele
                                          return (
                                            <Text
                                              className={`bd ${num === moneyOff.length - 1 && 'last'}`}
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
                                {
                                  offerDiscount && (
                                    <Block>
                                      <Text className="bg" style={{ marginLeft: Taro.pxTransform(10) }}>买</Text>
                                      <Text className="discount">{`买单享${offerDiscount}折`}</Text>
                                    </Block>
                                  )
                                }
                              </View>
                              {
                                item.shopDishList && item.shopDishList.length > 0 && item.shopDishList.map((one, num) => (
                                  <View className="flex-row dish-item gap" key={num}>
                                    <Image
                                      src={getServerPic(one.dishImageUrl)}
                                      className="dish-img"
                                    />
                                    <View className="flex-col flex1 flex-sb right">
                                      <View className="flex-col">
                                        <Text className="dish-name ellipsis">{one.dishName}</Text>
                                        <Text className="retain">{one.description ? one.description : ''}</Text>
                                        <Text className="retain">
                                          月销
                                          {one.saleNum}
                                        </Text>
                                      </View>
                                      <View className="dish-price">
                                        <Text>¥</Text>
                                        <Text className="now-price">{`￥${one.price}`}</Text>
                                        {/* <Text className="old-price">¥22</Text> */}
                                      </View>
                                    </View>
                                  </View>
                                ))
                              }
                              <Text
                                className="more-dish"
                              >
                                查看本店更多相关商品>>
                              </Text>
                            </View>
                          </View>
                        )
                      })
                    }
                  </ScrollView>
                </View>
              )
                : (
                  <View className="flex-col history-wrap">
                    <View className="history-title">
                      <Text>历史搜索</Text>
                      <Image
                        src={`${STATIC_IMG_URL}/icon/icon_del.png`}
                        className="img"
                        onClick={this.removeHistory}
                      />
                    </View>
                    <View className=" flex1 key-list">
                      {
                        searchHistory && searchHistory.length > 0 && searchHistory.map((o, i) => (
                          <AtTag
                            key={i}
                            className="tag-item"
                            onClick={this.handleChange.bind(this, o)}
                          >
                            {o}
                          </AtTag>
                        ))
                      }
                    </View>
                  </View>
                )
            }
          </View>
        </View>
      )
    }
}
