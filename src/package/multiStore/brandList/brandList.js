import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Text, Image, Block
} from '@tarojs/components'
import {
  AtLoadMore
} from 'taro-ui'
import {
  connect
} from '@tarojs/redux'
import './brandList.scss'
import { getPlatFormId, getServerPic, getUserLocation, navToPage } from '../../../utils/utils'
import { SIZE } from '../../../config/config'
import NoData from '../../../components/NoData/NoData'
import PageLoading from '../../../components/PageLoading/PageLoading'

@connect(({
  loading: { effects }
}) => ({
  effects
}))
export default class BrandList extends PureComponent {

  config = {
    navigationBarTitleText: '所有品牌',
    enablePullDownRefresh: true
  }

  constructor() {
    super()
    this.state = {
      brandList: [],
      size: SIZE,
      curPage: 0,
      loadMore: true
    }
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    })
  }

  componentDidMount() {
    const { curPage } = this.state
    this.getBrandList(curPage)
  }

  getBrandList = page => {
    const { brandList } = this.state
    const { dispatch } = this.props
    const { longitude, latitude } = getUserLocation()
    dispatch({
      type: 'merchant/getBrandListAction',
      payload: {
        page,
        size: SIZE,
        platformId: getPlatFormId(), // 数据测试: 平台Id, 49
        position: `${longitude},${latitude}`
      },
      callback: ({ ok, data, header }) => {
        if (ok) {
          Taro.stopPullDownRefresh()
          const newList = [...brandList, ...data]
          const total = header['X-Total-Count']
          this.setState({
            brandList: newList,
            loadMore: !(total == newList.length),
            curPage: page
          })
        }
      }
    })
  }

  onReachBottom() {
    const { curPage, loadMore } = this.state
    if (loadMore) {
      this.getBrandList(curPage + 1)
    }
  }

  onPullDownRefresh() {
    this.setState({
      brandList: []
    }, () => {
      this.getBrandList(0)
    })
  }

  render() {
    const { loadMore, brandList, curPage } = this.state
    return (
      <Block>
        {
          brandList.map(ele => {
            const {
              id, brandName, brandLogo, merchantNum,
              brandTag, consumptionPerPerson,
              nearestMerchantDTO, brandDetailPic
            } = ele
            const {
              merchant_name, distance
            } = nearestMerchantDTO || {}
            return (
              <View
                className="brandItem flex-row"
                key={id}
                onClick={() => {
                  this.$preload({
                    id, brandName, brandLogo, brandDetailPic
                  })
                  navToPage(`/package/multiStore/brandDetail/brandDetail`)
                }}
              >
                <Image mode="aspectFill" className="flex-sk" src={getServerPic(brandLogo)}/>
                <View className="brandInfo flex-col flex-sb flex-gw">
                  <Text className="brandName">{brandName}</Text>
                  <View className="flex-row flex-sb">
                    {brandTag && (<Text className="brandDsc">{brandTag}</Text>)}
                    {consumptionPerPerson && (<Text>{consumptionPerPerson}</Text>)}
                  </View>
                  <Text>{`共${merchantNum}家门店`}</Text>
                  {
                    merchant_name && (
                      <View className="flex-row flex-sb">
                        <Text>{`最近门店：${merchant_name}`}</Text>
                        {distance && (<Text>{`${distance}m`}</Text>)}
                      </View>
                    )
                  }
                  <View className="line"/>
                </View>
              </View>
            )
          })
        }
        <AtLoadMore status={loadMore ? 'loading' : 'noData'} />
      </Block>
    )
  }
}
