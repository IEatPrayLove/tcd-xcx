import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Text, Image, Button
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import {
  AtTabs, AtActivityIndicator, AtCurtain
} from 'taro-ui'
import './dineAndDashRecord.scss'
import IconFont from '../../components/IconFont/IconFont'
import {
  encodeURIObj,
  getCurrentLoaction,
  getServerPic, getUserLocation,
  latelyMerchant,
  navToPage, showLoading, hideLoading
} from '../../utils/utils'
import { PLATFORM_ID, STATIC_IMG_URL } from '../../config/baseUrl'
import NoData from '../../components/NoData/NoData'
import { CONDITION_DAD, LEGENDS_DAD, TALENT_DAD } from '../../config/config'

const dayjs = require('dayjs')

@connect(({ loading: { effects } }) => ({ effects }))
export default class DineAndDashRecord extends PureComponent {
  config = {
    navigationBarTitleText: '我的霸王餐',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      current: 0,
      recordList: [],
      noData: false,
      noStock: false
    }
    this.tabList = [{ title: '全部' }, { title: '待体验' }, { title: '已体验' }]
  }

  componentDidMount() {
    this.loadList()
  }

  loadList = (type = '') => {
    const { dispatch } = this.props
    dispatch({
      type: 'dineAndDash/getDineAndDashRecordAction',
      payload: { type },
      callback: ({ ok, data }) => {
        if (ok && data.length > 0) {
          this.setState({ recordList: data })
        } else {
          this.setState({
            noData: true
          })
        }
      }
    })
  }

  onChangeTabs = current => {
    const { current: preCur } = this.state
    if (preCur === current) {
      return
    }
    this.setState({
      current,
      recordList: [],
      noData: false
    })
    this.loadList(current === 0 ? '' : current)
  }

  // 加载门店信息数据
  loadMerchantInfo = (merchantId, goodsDetail, activelyId, lunchId) => {
    const { dispatch } = this.props
    dispatch({
      type: 'goodsDetail/getMerchantInfoAction',
      payload: { merchantId },
      callback: ({ ok, data }) => {
        hideLoading()
        if (ok) {
          navToPage(`/package/multiStore/packageOrderConfirm/packageOrderConfirm?merchantInfo=${encodeURIObj(data)}&goodsDetail=${encodeURIObj(goodsDetail)}&from=dine&dineId=${lunchId}&activelyId=${activelyId}`)
        }
      }
    })
  }

  goAffirmAddress(item) {
    const {
      islandFreeLunchDTO: { productId: dishId, skuId, id: lunchId },
      id: activelyId
    } = item
    const { dispatch } = this.props
    showLoading()
    dispatch({
      type: 'dineAndDash/judgeDineStockAction',
      payload: { skuId },
      callback: res => {
        if (res.ok && res.data) {
          dispatch({
            type: 'goodsDetail/getDishDetailAction',
            payload: {
              platformId: PLATFORM_ID,
              dishId,
              skuId
            },
            callback: ({ ok, data }) => {
              if (ok) {
                const minShop = latelyMerchant(data.dishMerchantShippingInfo, getUserLocation())
                this.loadMerchantInfo(minShop.merchantId, data, activelyId, lunchId)
              } else {
                hideLoading()
              }
            }
          })
        } else {
          this.setState({
            noStock: true
          })
          hideLoading()
        }
      }
    })
  }

  goOrderDetail(orderSn) {
    navToPage(`/pages/orderDetail/orderDetail?orderSn=${orderSn}&id=&from=dine`)
  }

  // 获取专享标签
  getActivelyLabel = config => {
    const condition = config.filter(({ joinCondition }) => (
      joinCondition === TALENT_DAD || joinCondition === LEGENDS_DAD
    ))
    return condition.length > 0 ? condition.map(o => CONDITION_DAD[o.joinCondition]).join('，') : ''
  }

  // 是否失效
  isLoseEfficacy = item => {
    const {
      status, productType,
      shopOrderDTO, islandFreeLunchDTO: { productEffectiveTime }
    } = item
    const { orderState } = shopOrderDTO || {}
    if (status === 'HAVE_RESULT') {
      if (
        dayjs(productEffectiveTime).isBefore(dayjs()) && !shopOrderDTO
      ) {
        return '(已失效)'
      }
      if (orderState === 'PENDING') { // productType === 1 &&
        return productType === 1 ? '未发货' : '（待体验）'
      }
    }
  }

  renderLabel(status) {
    let label = ''
    let labelClass = ''
    switch (status) {
      case 'LOSE': label = '已结束'; labelClass = 'end'; break
      case 'WAIT_RESULT': label = '待公布'; labelClass = 'wait'; break
      default: label = ''
    }
    return (
      <Text className={`label ${labelClass}`}>{label}</Text>
    )
  }

  confirmReceive = item => {
    const { dispatch } = this.props
    const { shopOrderDTO } = item
    const { id } = shopOrderDTO || {}
    showLoading('确认中')
    dispatch({
      type: 'order/confirmReceiveAction',
      payload: { id },
      callback: ({ ok }) => {
        hideLoading()
        if (ok) {
          this.loadList(this.state.current)
        } else {
          Taro.atMessage({
            type: 'warning',
            message: '操作失败'
          })
        }
      }
    })
  }

  renderOperating(item) {
    const {
      status, productType, shopOrderDTO,
      islandFreeLunchDTO: { productEffectiveTime }
    } = item
    const { orderState, useEndTime } = shopOrderDTO || {}
    if (orderState === 'FINISH') {
      return (<IconFont value="imgAlready" h={84} w={106} />)
    }
    if (orderState === 'COOKING' && productType === 1) {
      return (<Button className="btn" onClick={this.confirmReceive.bind(this, item)}>确认收货</Button>)
    }
    if (status === 'HAVE_RESULT' && dayjs(dayjs()).isBefore(productEffectiveTime) && !shopOrderDTO) return (<Button className="btn" onClick={this.goAffirmAddress.bind(this, item)}>中奖确认</Button>)
    // if (status === 'HAVE_RESULT' && productType === 2 && dayjs(dayjs()).isBefore(useEndTime)) return (<Button className="btn" onClick={this.goOrderDetail.bind(this, shopOrderDTO.orderSn)}>立即使用</Button>)
    return <view />
  }

  render() {
    const {
      current, recordList, noData,
      noStock
    } = this.state
    const { effects = {} } = this.props
    return (
      <Block>
        <AtTabs
          className="pageTabs"
          current={current}
          tabList={this.tabList}
          onClick={this.onChangeTabs}
        />
        {
          noData && (<NoData />)
        }
        {
          effects['dineAndDash/getDineAndDashRecordAction'] && (
            <View className="loading">
              <AtActivityIndicator mode="center" content="加载中..." />
            </View>
          )
        }
        <View className="recordWarp">
          {
            recordList.map(ele => {
              const {
                islandFreeLunchDTO: {
                  lotteryTime, productPrice, name,
                  winRatioConfig, productId: dishId,
                  merchantId, skuId, productEffectiveTime
                }, picture, status, useStatus, id,
                productType, islandFreeLunchId, shopOrderDTO
              } = ele
              const label = this.getActivelyLabel(winRatioConfig)
              const { useEndTime, orderState } = shopOrderDTO || {}
              return (
                <View
                  className="recordItem flex-row"
                  key={id}
                  onClick={() => {
                    if (shopOrderDTO) {
                      const { orderSn } = shopOrderDTO
                      navToPage(`/pages/orderDetail/orderDetail?orderSn=${orderSn}&from=dine`)
                      return
                    }
                    if (status === 'HAVE_RESULT' && productType === 1 && dayjs(dayjs()).isBefore(productEffectiveTime)) {
                      this.goAffirmAddress(ele)
                      return
                    }
                    navToPage(`/pages/goodsDetails/goodsDetails?dishId=${dishId}&platFormId=${PLATFORM_ID}&merchantId=${merchantId}&skuId=${skuId}&from=DineAndDash&infoDAD=${JSON.stringify({ condition: winRatioConfig, label, id: islandFreeLunchId })}`, false)
                  }}
                >
                  <View className="left flex-sk">
                    {
                      status === 'HAVE_RESULT'
                        ? (<Image src={`${STATIC_IMG_URL}/dineAndDash_logo.png`} />)
                        : (<Image src={getServerPic(picture)} />)
                    }
                    {this.renderLabel(status)}
                  </View>
                  <View className="activityDetail flex-col flex-sb flex1">
                    <View className="name">{name}</View>
                    <View className="flex-row flex-ac">
                      <View className="priceWarp flex1">
                        <View className="price">
                          <Text>价值</Text>
                          <Text>{productPrice}</Text>
                        </View>
                        <Text className="lottery">
                          {
                            status === 'HAVE_RESULT'
                              ? (!(productType === 1 && orderState === 'PENDING') ? `有效期：${dayjs(productType === 2 ? useEndTime : productEffectiveTime).format('YYYY-M-DD HH:mm')}` : '')
                              : `开奖时间：${dayjs(lotteryTime).format('YYYY-M-DD HH:mm')}`
                          }
                          <Text className={`${orderState === 'PENDING' && 'green'}`}>{this.isLoseEfficacy(ele)}</Text>
                        </Text>
                      </View>
                      <View className="operating" onClick={e => e.stopPropagation()}>
                        {this.renderOperating(ele)}
                      </View>
                    </View>
                  </View>
                </View>
              )
            })
          }
        </View>
        <AtCurtain
          isOpened={noStock}
          onClose={() => {
            this.setState({
              noStock: false
            })
          }}
        >
          <View className="noStock">
            亲爱的小主，很遗憾该商品已被抽完，请联系客服人员帮您更换同等价值的商品~
            <Image src={`${STATIC_IMG_URL}/contact.png`} />
            <Button
              openType="contact"
              className="contactBtn"
              onClick={() => {
                this.setState({
                  noStock: false
                })
              }}
            >
联系客服
            </Button>
          </View>
        </AtCurtain>
      </Block>
    )
  }
}
