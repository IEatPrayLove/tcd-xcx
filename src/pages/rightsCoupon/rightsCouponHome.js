import Taro from '@tarojs/taro'
import {
  View, Image, Text, Button, Block
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import {
  AtActivityIndicator
} from 'taro-ui'
import './rightsCouponHome.scss'
import IconFont from '../../components/IconFont/IconFont'
import { getServerPic, getTimestamp, imitateObjectValues, navToPage } from '../../utils/utils'
import {
  BRAND_COUPON
} from '../../config/config'
import NoData from '../../components/NoData/NoData'

@connect(({ loading: { effects } }) => ({ effects }))
export default class rightsCouponHome extends Taro.PureComponent {
  config = {
    navigationBarTitleText: '权益淘券',
    navigationBarBackgroundColor: '#fff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      recommendCouponList: [],
      couponList: [],
      couponCategory: [],
      noData: false
    }
  }

  componentDidMount() {
    const { dispatch } = this.props
    dispatch({
      type: 'rightsCoupon/getRecommendCouponAction',
      payload: {
        type: BRAND_COUPON
      },
      callback: ({ ok, data }) => {
        if (ok && imitateObjectValues(data).length > 0) {
          this.setState({
            recommendCouponList: imitateObjectValues(data)
          })
        }
      }
    })
    dispatch({
      type: 'rightsCoupon/getCouponListAction',
      callback: ({ ok, data }) => {
        const couponList = imitateObjectValues(data)
        if (ok && couponList.length > 0) {
          const category = couponList.reduce((acc, { categoryName }, i) => {
            acc[categoryName] = (acc[categoryName] || []).concat(couponList[i]).sort((a, b) => getTimestamp(b.topTime) - getTimestamp(a.topTime))
            return acc
          }, {})
          this.setState({
            couponList: imitateObjectValues(category),
            couponCategory: Object.keys(category)
          })

          // this.setState({ couponList })
        } else {
          this.setState({
            noData: true
          })
        }
      }
    })
  }

  goToCouponDetail = ({ dishId, dishName, dishImageUrl }) => () => {
    navToPage(`/pages/rightsCoupon/brandCoupon?dishId=${dishId}&dishName=${dishName}&dishImageUrl=${dishImageUrl}`)
  }

  render() {
    const {
      recommendCouponList, couponList,
      noData, couponCategory
    } = this.state
    const {
      effects = {}
    } = this.props
    return (
      <View className="rightsCouponBox">
        {
          recommendCouponList.length > 0 && (
            <Block>
              <View className="rightsCouponHeader">
                <View className="rightsCouponHeaderTitle">
                  <IconFont value="imgStar" w="35" h="35" />
                  <View className="headerTitleWord">分享</View>
                  <View className="headerTitleEn">· Recommended</View>
                </View>
                <View className="rightsCouponHeaderList">
                  {
                    recommendCouponList.map(ele => {
                      const {
                        dishId, dishName, tagStr, picture, dishImageUrl
                      } = ele
                      return (
                        <View
                          key={dishId}
                          className="headerListItem"
                          onClick={this.goToCouponDetail({ dishId, dishName, dishImageUrl })}
                        >
                          {tagStr && (<View className="headerListItemTip">{tagStr}</View>)}
                          <Image src={getServerPic(picture)} />
                          <View className="headerListItemWord ellipsis">{dishName}</View>
                        </View>
                      )
                    })
                  }
                </View>
              </View>
              <View className="grayLine" />
            </Block>
          )
        }
        <View className="rightsCouponList">
          {
            couponCategory.map((o, index) => (
              <Block key={o}>
                <View className="rightsCouponListHeader">
                  <View className="listHeaderLine" />
                  <View className="listHeaderWord">{o}</View>
                </View>
                <View className="rightsCouponHeaderList">
                  {
                    couponList[index].length > 0 && couponList[index].map(ele => {
                      const {
                        dishName, picture, tagStr, dishId, dishImageUrl
                      } = ele
                      return (
                        <View
                          className="headerListItem"
                          key={dishId}
                          onClick={this.goToCouponDetail({ dishId, dishName, dishImageUrl })}
                        >
                          {tagStr && (<View className="headerListItemTip">{tagStr}</View>)}
                          <Image src={getServerPic(picture)} />
                          <View className="headerListItemWord ellipsis">{dishName}</View>
                        </View>
                      )
                    })
                  }
                </View>
              </Block>
            ))
          }
          {
            effects['rightsCoupon/getCouponListAction'] && (
              <View className="atLoading">
                <AtActivityIndicator mode="center" content="加载中..." />
              </View>
            )
          }
          {
            noData && (<NoData />)
          }
        </View>
      </View>
    )
  }
}
