import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Image, Text,
  MovableView, MovableArea
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import {
  AtCurtain, AtActivityIndicator, AtIcon
} from 'taro-ui'

import './dineAndDash.scss'
import IconFont from '../../components/IconFont/IconFont'
import {
  getServerPic,
  calculateDistanceByCoordinate,
  getUserLocation,
  navToPage,
  getDateDiff,
  getTimeAry,
  objNotNull,
  parseQuery,
  setShareInfo,
  getShareInfo,
  needLogin,
  saveCurrentLocation,
  latelyMerchant,
  getCurrentLoaction,
  showToast,
  getUserDistributor
} from '../../utils/utils'
import {
  TALENT_DAD, LEGENDS_DAD, CONDITION_DAD
} from '../../config/config'
import { PLATFORM_ID, STATIC_IMG_URL } from '../../config/baseUrl'
import NoData from '../../components/NoData/NoData'

const dayjs = require('dayjs')

@connect(({ loading: { effects } }) => ({ effects }))
export default class DineAndDash extends PureComponent {
  config = {
    navigationBarTitleText: '霸王餐',
    navigationBarBackgroundColor: '#FF643D',
    enablePullDownRefresh: true,
    backgroundTextStyle: 'dark'
  }

  constructor() {
    super()
    this.state = {
      dineAndDashList: [],
      awardList: [],
      awardModalVisible: false,
      noData: false,
      ruleVisible: false,
      recommend: {},
      recommendVisible: false,
      deliveryArea: null, // 配送范围
      minShop: {} // 距离最近门店
    }
  }

  componentDidShow() {
    if (!needLogin()) return
    this.initialize()
  }

  onPullDownRefresh() {
    this.setState({
      dineAndDashList: []
    }, () => {
      this.initialize()
      Taro.stopPullDownRefresh()
    })
  }

  componentDidMount() {
    const { dispatch } = this.props
    dispatch({
      type: 'dineAndDash/getDineAndDashRecommendAction',
      callback: ({ ok, data }) => {
        if (ok && objNotNull(data)) {
          const { join, sale } = data
          if (join || !sale) return
          this.setState({
            recommend: data,
            recommendVisible: true
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
              this.initialize()
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
  onShareAppMessage() {
    // const { goodsDetail: { dishId, shopDish: { dishName } }, merchantInfo: { id } } = this.props
    const { code } = getUserDistributor()
    return {
      title: '霸王餐',
      path: `/pages/dineAndDash/dineAndDash?code=${code || ''}`
    }
  }

  initialize = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'dineAndDash/getDineAndDashListAction',
      callback: ({ ok, data }) => {
        if (ok && data.length > 0) {
          this.setState({
            dineAndDashList: data.sort((a, b) => {
              const { islandFreeLunchDTO: { lotteryTime: lotteryTimeA } } = a
              const { islandFreeLunchDTO: { lotteryTime: lotteryTimeB } } = b
              return dayjs(lotteryTimeA).isBefore(lotteryTimeB) ? 1 : -1
            })
          })
        } else {
          this.setState({
            noData: true
          })
        }
      }
    })
    dispatch({
      type: 'dineAndDash/viewDineAndDashAwardAction',
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            awardList: data,
            awardModalVisible: data.length > 0
          })
        }
      }
    })
  }

  changeState = (state, val) => () => {
    this.setState({
      [state]: val
    })
  }

  // 获取专享标签
  getActivelyLabel = config => {
    const {
      islandFreeLunchCondition,
      islandFreeLunchUserIdentity,
      winRatioConfig
    } = config
    if (islandFreeLunchCondition === 'USER_LEVEL') {
      return false
    }
    if (islandFreeLunchCondition === 'USER_IDENTITY') {
      return islandFreeLunchUserIdentity.map(ele => CONDITION_DAD[ele]).join(', ')
    }
  }

  // 立即查看获奖纪律，并关闭弹窗
  viewRecord = () => {
    navToPage('/pages/dineAndDash/dineAndDashRecord')
    const { dispatch } = this.props
    const { awardList } = this.state
    const idList = awardList.reduce((acc, { id }) => [...acc, id], []).join(';')
    dispatch({
      type: 'dineAndDash/closeDineAndDashAwardAction',
      payload: {
        id: idList
      }
    })
    this.setState({
      awardModalVisible: false
    })
  }

  renderOperation(ele) {
    const { join, status } = ele
    if (join) {
      return <View className="btn already">已报名</View>
    }
    if (status === 'SIGNING') {
      return <View className="btn">免费抢</View>
    }
    if (status === 'UNSTART') {
      return <View> </View>
    }
    return <View className="btn already">已截止</View>
  }

  renderStartTime(time) {
    const startTime = new Date(getDateDiff(time.replace('T', ' ')))
    const timeAry = getTimeAry(startTime)
    return (
      <View className="flex-row flex-ac">
        {timeAry.map(o => <Text key={o} className="item">{o}</Text>)}
      </View>
    )
  }

  render() {
    const {
      dineAndDashList, awardList,
      awardModalVisible, noData, ruleVisible,
      recommend, recommendVisible
    } = this.state
    const {
      effects = {}
    } = this.props
    return (
      <Block>
        <View className="pageHeader">
          <View
            className="rule"
            onClick={() => {
              this.setState({
                ruleVisible: true
              })
            }}
          >
            规则介绍
          </View>
        </View>
        <View className="listWarp">
          {
            dineAndDashList && dineAndDashList.length > 0 && dineAndDashList.map(ele => {
              const {
                activityName, merchantAddress, merchantName, dishId,
                picture, price, merchantPosition, skuId, winRatioConfig,
                merchantId, freeLunchId, join, status, startTime, originalPrice,
                islandFreeLunchDTO
              } = ele
              const [lng, lat] = merchantPosition.split(',')
              const { longitude, latitude } = getUserLocation()
              const distance = calculateDistanceByCoordinate(lat, latitude, lng, longitude)
              const label = this.getActivelyLabel(islandFreeLunchDTO)
              return (
                <View
                  key={freeLunchId}
                  className="productItem flex-row"
                  onClick={() => {
                    // this.$preload({ condition: winRatioConfig, label, id: freeLunchId })
                    navToPage(`/pages/goodsDetails/goodsDetails?dishId=${dishId}&platFormId=${PLATFORM_ID}&merchantId=${merchantId}&skuId=${skuId}&from=DineAndDash&infoDAD=${JSON.stringify({ condition: islandFreeLunchDTO, label, id: freeLunchId })}`, false)
                  }}
                >
                  <View className="productImg flex-sk">
                    <Image src={getServerPic(picture)} mode="aspectFit" />
                    {
                      label && (
                        <View className="label sweepTheDeck">
                          {label}
                          专享
                        </View>
                      )
                    }
                  </View>
                  <View className="flex-col flex-sb flex1">
                    <Text className="productName">
                      {
                        label ? `【${label}专享】` : ''
                      }
                      {activityName}
                    </Text>
                    <Text className="merchantName">{merchantName}</Text>
                    <View className="flex-row flex-ac">
                      <IconFont value="icon-dizhi" size={30} />
                      <View className="address ellipsis">
                        {distance}
                        km｜
                        {merchantAddress}
                      </View>
                    </View>
                    <View className="productBottom flex-row flex-ac">
                      <Text className="priceTitle">价值</Text>
                      <Text className="price flex1">{originalPrice || price}</Text>
                      {this.renderOperation(ele)}
                    </View>
                    {
                      status === 'UNSTART' && (
                        <View className="deadline flex-row flex-ac">
                          <Text className="title">开始时间：</Text>
                          {this.renderStartTime(startTime)}
                        </View>
                      )
                    }
                  </View>
                </View>
              )
            })
          }
          {
            dineAndDashList.length === 0 && effects['dineAndDash/getDineAndDashListAction'] && (
              <View className="atLoading">
                <AtActivityIndicator content="加载中..." mode="center" />
              </View>
            )
          }
          {
            noData && (
              <NoData />
            )
          }
        </View>
        <MovableArea className="movableArea">
          <MovableView
            className="participateRecord"
            direction="all"
          >
            {/* 霸王餐活动记录 */}
            <Image
              src={`${STATIC_IMG_URL}/dineAndDash.png`}
              onClick={() => { navToPage('/pages/dineAndDash/dineAndDashRecord') }}
            />
          </MovableView>
        </MovableArea>

        {/* 中奖弹窗 */}
        <AtCurtain
          className="winningModal"
          isOpened={awardModalVisible}
          onClose={this.viewRecord}
        >
          <View className="bg">
            <View className="productContainer">
              {
                awardList.map(ele => {
                  const {
                    picture, islandFreeLunchName, id,
                    islandFreeLunchDTO,
                    islandFreeLunchDTO: {
                      productPrice, winRatioConfig
                    }
                  } = ele
                  return (
                    <View className="flex-row product" key={id}>
                      <Image className="productImg" src={getServerPic(picture)} />
                      <View className="flex1">
                        <Text className="productName">
                          {this.getActivelyLabel(islandFreeLunchDTO) ? `【${this.getActivelyLabel(islandFreeLunchDTO)}专享】` : ''}
                          {islandFreeLunchName}
                        </Text>
                        <Text className="priceTitle">价值</Text>
                        <Text className="price">{productPrice}</Text>
                      </View>
                    </View>
                  )
                })
              }
              <View
                className="nowView"
                onClick={this.viewRecord}
              >
                立即查看
              </View>
            </View>
          </View>
        </AtCurtain>

        {/* 霸王餐抽奖弹窗 */}
        <AtCurtain
          isOpened={recommendVisible}
          onClose={() => {
            this.setState({
              recommendVisible: false
            })
          }}
        >
          <View className="lotteryModal">
            <View className="productContainer">
              <View className="flex-row">
                <Image className="productImg" src={getServerPic(recommend.picture)} />
                <View className="flex1">
                  <Text className="productName">{recommend.activityName}</Text>
                  <View className="flex-row flex-ac">
                    <Text className="quantity flex1">{recommend.productNum}</Text>
                    <Text className="priceTitle">价值</Text>
                    <Text className="price">{recommend.price}</Text>
                  </View>
                </View>
              </View>
              <View
                className="nowView"
                onClick={() => {
                  const {
                    recommend: {
                      dishId, merchantId, skuId, freeLunchId,
                      islandFreeLunchDTO
                    }
                  } = this.state
                  const label = this.getActivelyLabel(islandFreeLunchDTO)
                  navToPage(`/pages/goodsDetails/goodsDetails?dishId=${dishId}&platFormId=${PLATFORM_ID}&merchantId=${merchantId}&skuId=${skuId}&from=DineAndDash&infoDAD=${JSON.stringify({ condition: islandFreeLunchDTO, label, id: freeLunchId })}`, false)
                  this.setState({
                    recommendVisible: false
                  })
                }}
              >
                免费抢
              </View>
            </View>
          </View>
        </AtCurtain>

        {
          ruleVisible && (
            <View className="ruleModalMask">
              <View className="ruleModalBox">
                <View className="ruleModalTitle">规则介绍</View>
                <View className="ruleModalContent">
                  <View className="ruleTitle marB">霸王餐抽奖活动完全公平，采用随机制中奖规则如下：</View>
                  <View className="ruleRow marB">
                    <View className="ruleRowCircle">1</View>
                    <View className="ruleRowWord">用户点击参与即可成功报名普通霸王餐，如果高级霸王餐则需达成对应报名条件方可进行正常报名；</View>
                  </View>
                  <View className="ruleRow marB">
                    <View className="ruleRowCircle">2</View>
                    <View className="ruleRowWord">用户点击参与即可成功报名普通霸王餐，如果高级霸王餐则需达成对应报名条件方可进行正常报名；</View>
                  </View>
                  <View className="ruleRow marB">
                    <View className="ruleRowCircle">3</View>
                    <View className="ruleRowWord">
                      每位用户
                      <Text>每天最多报名三次</Text>
                      霸王餐，单个霸王餐同一时间只能报名一次，不可进行重复报名；
                    </View>
                  </View>
                  <View className="ruleRow marB">
                    <View className="ruleRowCircle">4</View>
                    <View className="ruleRowWord">
                      用户中奖后如果为到店消费类产品，请在规定的时间内到店体验，出示对应核销码即可；如果为物流产品则需提报对应的地址奖品将在中奖后7个工作日内寄出
                      <Text>(若不填写相关信息则视为自动放弃)</Text>
                    </View>
                  </View>
                  <View className="ruleRow marB">
                    <View className="ruleRowCircle">5</View>
                    <View className="ruleRowWord">
                      <Text>如中奖后无法前往或未完成对应要求，则会影响下次霸王餐的中奖概率哦；</Text>
                    </View>
                  </View>
                  <View className="ruleRow">
                    <View className="ruleRowCircle">6</View>
                    <View className="ruleRowWord">
                      用户中奖后将会在平台
                      <Text>公众号进行消息推送</Text>
                      ，取消关注则无法查收对应中奖消息推送。
                    </View>
                  </View>
                </View>
              </View>
              <View
                className="ruleModalClose"
                onClick={() => {
                  this.setState({
                    ruleVisible: false
                  })
                }}
              >
                <AtIcon value="close-circle" size="30" color="#fff" />
              </View>
            </View>
          )
        }
      </Block>
    )
  }
}
