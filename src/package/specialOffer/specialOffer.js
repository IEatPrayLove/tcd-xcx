import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Text, ScrollView
} from '@tarojs/components'
import {
  AtSearchBar, AtTabs, AtActivityIndicator, AtLoadMore
} from 'taro-ui'
import { connect } from '@tarojs/redux'
import Goods from '../../components/Goods/Goods'

import './specialOffer.scss'
import IconFont from '../../components/IconFont/IconFont'
import NoData from '../../components/NoData/NoData'
import {
  getUserLocation, saveUserLocation
} from '../../utils/utils'
import { PLATFORM_ID } from '../../config/baseUrl'
import { SIZE } from '../../config/config'
import amapFile from '../../utils/amap-wx'

const AMap = new amapFile.AMapWX({ key: '94b742bf454bf235ba9642d698557af7' })

@connect(({ loading: { effects } }) => ({ effects }))
export default class SpecialOffer extends PureComponent {
  config = {
    navigationBarTitleText: '星选特惠',
    enablePullDownRefresh: true
  }

  constructor() {
    super()
    this.state = {
      searchVal: '',
      tabList: [{ title: '全部▾' }, { title: '智能排序' }, { title: '距离最近' }, { title: '最新分享' }],
      curTab: 1,
      userAddress: getUserLocation(),
      recommendGoodsList: [],
      distributionList: [],
      currentPage: 0,
      typeList: [],
      isScroll: true,
      categoryId: '',
      typeVisible: false,
      noData: false,
      reachBottomState: 'loading'
    }
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    })
  }

  componentDidMount() {
    const { id } = this.$router.params
    if (id) {
      this.setState({ categoryId: id }, () => {
        this.getStarType()
        this.getStarSelectListAction()
      })
    } else {
      this.getStarType()
      this.getStarSelectListAction()
    }
  }

  onPullDownRefresh() {
    this.clearGoodsList()
    Taro.stopPullDownRefresh()
  }

  getProductDistribution = dishIds => {
    if (dishIds.length <= 0) return
    const { dispatch } = this.props
    const { distributionList } = this.state
    dispatch({
      type: 'index/getProductIsDistributionAction',
      payload: { dishIds },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            distributionList: [...distributionList, ...data]
          })
        }
      }
    })
  }

  search = val => {
    this.setState({
      searchVal: val
    })
  }

  confirmSearch = () => {
    this.setState({
      recommendGoodsList: [],
      currentPage: 0,
      curTab: 1
    }, () => {
      this.getStarSelectListAction()
    })
  }

  clearGoodsList = () => {
    this.setState({
      recommendGoodsList: [],
      currentPage: 0,
      curTab: 1,
      searchVal: '',
      reachBottomState: 'loading',
      noData: false
    }, () => {
      this.getStarSelectListAction()
    })
  }

  selectedTab = val => {
    const { curTab, typeVisible } = this.state
    if (curTab === val && val !== 0) return
    if (val === 0) {
      this.setState({
        typeVisible: !typeVisible
      })
      return
    }
    this.setState({
      curTab: val,
      isScroll: val !== 0,
      recommendGoodsList: [],
      distributionList: [],
      noData: false,
      typeVisible: false,
      currentPage: 0,
      reachBottomState: 'loading'
    }, () => {
      if (val !== 0) {
        this.getStarSelectListAction()
      }
    })
  }

  getStarSelectListAction = () => {
    const {
      curTab, currentPage, searchVal, userAddress, categoryId,
      recommendGoodsList
    } = this.state
    this.props.dispatch({
      type: 'index/getStarSelectListAction',
      payload: {
        platformId: PLATFORM_ID,
        type: curTab + 1,
        lng: userAddress.longitude || 116.460000,
        lat: userAddress.latitude || 39.920000,
        dishName: searchVal,
        categoryId,
        page: currentPage,
        size: SIZE
      },
      callback: ({ ok, data }) => {
        if (ok) {
          const newData = data.map(({
            imagePath, dishMerchantShippingInfo, tagStr,
            dishState, saleEndTime, dishId, platId,
            merchantId, lat, lng, shopDish: {
              dishName, productType, shopDishSkus
            }, id
          }) => ({
            imagePath, dishMerchantShippingInfo, tagStr,
            dishState, saleEndTime, dishId, platId,
            merchantId, lat, lng, shopDish: {
              dishName, productType, shopDishSkus
            }, id
          }))
          // const query = Taro.createSelectorQuery().in(this.$scope)

          const newList = [...recommendGoodsList, ...newData]
          // console.log(newList)
          this.getProductDistribution(newData.map(o => o.dishId))
          this.setState({
            recommendGoodsList: newList,
            noData: newList.length <= 0
          })
          if (newData.length < SIZE) {
            this.setState({
              reachBottomState: 'noMore'
            })
          }
        }
      }
    })
  }

  getStarType = () => {
    this.props.dispatch({
      type: 'index/getStarTypeAction',
      payload: {
        platformId: PLATFORM_ID,
        functionType: 'PACKAGE',
        page: 0,
        size: 999
      },
      callback: res => {
        const { tabList, categoryId } = this.state

        if (res.ok) {
          res.data && res.data.forEach(item => {
            item.id == categoryId && (tabList[0].title = item.categoryName)
          })
          this.setState({
            typeList: res.data,
            tabList
          })
        }
      }
    })
  }

  onReachBottom() {
    const { currentPage, reachBottomState } = this.state
    if (reachBottomState === 'noMore') return
    this.setState({
      currentPage: currentPage + 1
    }, () => {
      this.getStarSelectListAction()
    })
  }

  chooseLocation = () => {
    Taro.chooseLocation({
      success: res => {
        if (res.name && res.errMsg === 'chooseLocation:ok') { // 手动选择地址
          const { latitude: lat, longitude: lng } = res
          AMap.getRegeo({
            location: `${lng},${lat}`,
            success: ([{ longitude, latitude, name }]) => {
              const userLocation = {
                longitude,
                latitude,
                name
              }
              saveUserLocation(userLocation)
              this.setState({
                userAddress: userLocation
              })
            }
          })
        }
      }
    })
  };

  render() {
    const {
      searchVal, tabList, curTab, userAddress: { name },
      recommendGoodsList, typeList, isScroll, typeVisible, userAddress,
      currentPage, noData, reachBottomState, distributionList
    } = this.state
    const { effects = {} } = this.props
    return (
      <View className={`${!isScroll ? 'specialOfferBox' : ''}`}>
        <View className="header">
          <View className="search flex-row flex-ac">
            <View onClick={this.chooseLocation} className="flex-row">
              <IconFont value="imgAddr" w={38} h={40} mr={10} />
              <Text className="name ellipsis">{name}</Text>
            </View>
            <View className="searchInt flex1">
              <AtSearchBar
                value={searchVal}
                onChange={this.search}
                onActionClick={this.confirmSearch}
                onClear={this.clearGoodsList}
                placeholder="请输入商品名"
              />
            </View>
          </View>
          <AtTabs
            current={curTab}
            tabList={tabList}
            onClick={this.selectedTab}
          />
          {
            typeVisible && (
              <View className="category">
                <ScrollView
                  scrollY
                  className="categoryWarp"
                >
                  <View>
                    <View onClick={() => {
                      const { tabList } = this.state
                      tabList[0].title = '全部▾'
                      this.setState({
                        categoryId: '',
                        typeVisible: false,
                        tabList,
                        recommendGoodsList: [],
                        distributionList: [],
                        curTab: 0,
                        currentPage: 0,
                        reachBottomState: 'loading'
                      }, () => {
                        this.getStarSelectListAction()
                      })
                    }}
                    >
                      全部
                    </View>
                    {
                      typeList && typeList.map((item, index) => (
                        <View
                          key={index}
                          onClick={() => {
                            const { tabList } = this.state
                            tabList[0].title = `${item.categoryName}▾`
                            this.setState({
                              categoryId: item.id,
                              typeVisible: false,
                              tabList,
                              recommendGoodsList: [],
                              distributionList: [],
                              curTab: 0,
                              currentPage: 0,
                              reachBottomState: 'loading'
                            }, () => {
                              this.getStarSelectListAction()
                            })
                          }}
                        >
                          {item.categoryName}
                        </View>
                      ))
                    }
                  </View>
                </ScrollView>
              </View>
            )
          }
        </View>
        {
          effects['index/getStarSelectListAction'] && currentPage === 0 && (
            <View className="atLoading">
              <AtActivityIndicator mode="center" content="加载中..." />
            </View>
          )
        }
        <View className="recommendGoodsList">
          <View className="recommendGoodsItem" />
          {
            noData && (<NoData />)
          }
          {
            recommendGoodsList.length > 0 && recommendGoodsList.map(ele => (
              <Goods
                key={ele.id}
                details={ele}
                userLocation={userAddress}
                distributionList={distributionList}
                id={`good-${ele.id}`}
              />
            ))
          }
          {
            recommendGoodsList.length > 0 && <AtLoadMore status={reachBottomState} />
          }
        </View>

        {/* 分类遮罩层 */}
        {
          typeVisible && (
            <View
              className="categoryMask"
              onClick={() => {
                this.setState({
                  typeVisible: false
                })
              }}
            />
          )
        }
      </View>
    )
  }
}
