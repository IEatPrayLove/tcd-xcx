import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Image, Text, Block, Button
} from '@tarojs/components'
import {
  AtTabs, AtLoadMore, AtActivityIndicator,
  AtMessage
} from 'taro-ui'
import { connect } from '@tarojs/redux'
import './couponList.scss'
import { SIZE } from '../../config/config'
import IconFont from '../../components/IconFont/IconFont'
import { STATIC_IMG_URL } from '../../config/baseUrl'
import {
  dateFormat, getServerPic, navToPage, dateFormatWithDate, hideLoading, showToast, toDecimal
} from '../../utils/utils'
import NoData from '../../components/NoData/NoData'

const dayjs = require('dayjs')

@connect(({ loading: { effects } }) => ({ effects }))
export default class CouponList extends PureComponent {
  config = {
    navigationBarTitleText: '我的卡券',
    navigationBarBackgroundColor: '#fff',
    navigationBarTextStyle: 'black'
  };

  constructor() {
    super()
    this.state = {
      current: 0,
      list: [],
      pagination: {
        page: 0,
        size: SIZE,
        state: '',
        thirdPartyType: ''
      },
      noData: false,
      paging: 'loading',
      finishOrderId: null
    }
    this.tabList = [{ title: '全部' }, { title: '卡券' }, { title: '中奖券' }]
  }

  componentWillMount() {
    this.loadingList()
  }

  onReachBottom() {
    const {
      pagination, pagination: { page }, paging
    } = this.state
    if (paging === 'noMore') return
    this.setState({
      pagination: { ...pagination, page: page + 1 }
    }, () => {
      this.loadingList()
    })
  }

  loadingList = () => {
    const { dispatch } = this.props
    const { pagination, list } = this.state
    dispatch({
      type: 'mine/getLunchAndCouponAction',
      payload: pagination,
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            list: [...list, ...data],
            noData: [...list, ...data].length <= 0,
            paging: data.length < SIZE ? 'noMore' : 'loading'
          })
        }
      }
    })
  }

  changeTabs = val => {
    const { current } = this.state
    if (current === val) return
    const type = ['', 'TAO_QUAN', 'FREE_LUNCH']
    this.setState({
      current: val,
      list: [],
      pagination: {
        page: 0,
        size: SIZE,
        state: '',
        thirdPartyType: type[val]
      },
      noData: false
    }, () => {
      this.loadingList()
    })
  }

  isUsed = val => () => {
    const { pagination } = this.state
    this.setState({
      pagination: { ...pagination, state: val, page: 0 },
      list: [],
      noData: false
    }, () => {
      this.loadingList()
    })
  }

  renderOperating = item => {
    const {
      useEndTime, orderState, islandFreeLunchDTO,
      id
    } = item
    const { productType } = islandFreeLunchDTO || {}
    const { finishOrderId } = this.state
    const { effects } = this.props
    if (this.isLoseEfficacy(item)) return <View> </View>
    if (orderState === 'FINISH') return <IconFont value="imgAlready" w={106} h={84} />
    if (orderState === 'PENDING' && productType == 1) return <View> </View>
    if (orderState === 'COOKING' && productType == 1) return (
      <Button
        className="operateBtn"
        onClick={this.finishOrder.bind(this, id)}
        loading={finishOrderId === id && effects['order/confirmReceiveAction']}
        disabled={finishOrderId === id && effects['order/confirmReceiveAction']}
      >
        确认收货
      </Button>
    )
    return <Button className="operateBtn">立即使用</Button>
  }

  finishOrder = (id, e) => {
    e.stopPropagation()
    this.setState({
      finishOrderId: id
    }, () => {
      this.props.dispatch({
        type: 'order/confirmReceiveAction',
        payload: { id },
        callback: ({ ok, data }) => {
          if (ok) {
            const { list } = this.state
            const template = JSON.parse(JSON.stringify(list))
            const modifyIndex = template.findIndex(({ id: itemId }) => itemId === id)
            template[modifyIndex].orderState = 'FINISH'
            Taro.atMessage({
              type: 'success',
              message: '操作成功'
            })
            this.setState({
              list: template
            })
          } else {
            Taro.atMessage({
              type: 'warning',
              message: '操作失败'
            })
          }
        }
      })
    })
  }

  goToCouponDetail = orderSn => {
    navToPage(`/pages/equityDetail/equityDetail?orderSn=${orderSn}`)
  }

  goToDishDetail = orderSn => {
    navToPage(`/pages/orderDetail/orderDetail?orderSn=${orderSn}&from=dine`)
  }

  renderCoupon(item) {
    const { finishOrderId } = this.state
    const { effects = {} } = this.props
    const {
      shopOrderProductInfoDTOS: [{
        productName, imageUrl, subtotal, skuId
      }], orderState, addTime, id, orderSn
    } = item
    const validityTime = dayjs(addTime * 1000).add(1, 'day').format('YYYY-M-D')
    return (
      <View
        className="couponWarp flex-row"
        key={skuId}
        onClick={this.goToCouponDetail.bind(this, orderSn)}
      >
        <Image className="logo" src={getServerPic(imageUrl)} />
        <View className="info flex1 flex-col flex-jc">
          <View className="name">{productName}</View>
          <View className="price">
            <Text>价格</Text>
            <Text>￥</Text>
            <Text>{subtotal}</Text>
          </View>
          <View className="date">{`有效期：${validityTime} 10:00`}</View>
        </View>
        <View className="operating">
          { (orderState === 'FINISH' || dayjs(`${dayjs(addTime * 1000).add(1, 'day').format('YYYY-M-D')} 10:00`).isBefore(dayjs()))
            ? <IconFont value="imgUsed2" w={106} h={84} />
            : (
              <Button
                className="operateBtn"
                loading={finishOrderId === id && effects['order/confirmReceiveAction']}
                disabled={finishOrderId === id && effects['order/confirmReceiveAction']}
                onClick={this.finishOrder.bind(this, id)}
              >
                确认使用
              </Button>
            )
          }
        </View>
      </View>
    )
  }

  isLoseEfficacy = item => {
    const {
      islandFreeLunchDTO,
      useEndTime, orderState
    } = item || {}
    const {
      status, productType, productEffectiveTime
    } = islandFreeLunchDTO || {}
    if (status === 'HAVE_RESULT') {
      if (
        (productType === 1 && dayjs(productEffectiveTime).isBefore(dayjs()))
        || (productType === 2 && orderState !== 'FINISH' && dayjs(useEndTime).isBefore(dayjs()))
      ) {
        return '(已失效)'
      }
      if (productType === 1 && orderState === 'PENDING') {
        return '未发货'
      }
    }
  }

  renderLunch(item) {
    console.log(item)
    const {
      shopOrderProductInfoDTOS: [{
        marketPrice
      }], id,
      islandFreeLunchDTO, useEndTime,
      orderSn, orderState, orderType
    } = item
    let logisticsTime = null
    let activelyName = '--'
    let effectiveTime = null
    let type = null
    if (islandFreeLunchDTO) {
      const {
        lotteryTime, productEffectiveDays, name,
        productEffectiveTime, productType
      } = islandFreeLunchDTO
      const dateTime = new Date(lotteryTime.replace('T', ' '))
      logisticsTime = dateTime.setDate(dateTime.getDate() + Number(productEffectiveDays))
      activelyName = name
      effectiveTime = productEffectiveTime
      type = productType
    }
    // console.log(type, useEndTime, effectiveTime)
    return (
      <View
        key={id}
        className="couponWarp flex-row "
        onClick={this.goToDishDetail.bind(this, orderSn)}
      >
        {
          item.thirdPartyType === 'LOCAL_TAO_QUAN' && item.shopOrderProductInfoDTOS[0].imageUrl ? 
          <Image className="logo" src={getServerPic(item.shopOrderProductInfoDTOS[0].imageUrl.split(',')[0])} />
          : <Image className="logo" src={`${STATIC_IMG_URL}/dineAndDash_logo.png`} />
        }
        <View className="info flex1 flex-col flex-jc">
          <View className="name">
            {
              item.thirdPartyType === 'LOCAL_TAO_QUAN' ? item.shopOrderProductInfoDTOS[0].productName : activelyName
            }
          </View>
          <View className="price">
            <Text>价值</Text>
            <Text>￥</Text>
            <Text>{item.thirdPartyType === 'LOCAL_TAO_QUAN' ? toDecimal(item.shopOrderProductInfoDTOS[0].productPrice) : toDecimal(marketPrice)}</Text>
          </View>
          <View className={`date ${type === 1 && orderState === 'PENDING' && 'green'}`}>
            {
              item.thirdPartyType === 'LOCAL_TAO_QUAN' ? (`有效期：${dateFormatWithDate(item.useEndTime, 'yyyy-MM-dd hh:mm')}`) : (type === 1 && orderState === 'PENDING' ? '' : `有效期：${dayjs(type === 2 ? useEndTime : effectiveTime).format('YYYY-M-DD HH:mm')}`)
            }
            {this.isLoseEfficacy(item)}
          </View>
        </View>
        <View className="operating">{this.renderOperating(item)}</View>
      </View>
    )
  }

  render() {
    const {
      current, paging, list,
      pagination: {
        state: useState, page
      },
      noData
    } = this.state
    const {
      effects = {}
    } = this.props
    return (
      <Block>
        <AtTabs className="tabs" current={current} tabList={this.tabList} onClick={this.changeTabs} />
        <View className="container">
          {/*<View className={`catItem ${useState === '' && 'catActive'}`} onClick={this.isUsed('')}>全部</View>*/}
          {/*<View className={`catItem ${useState === '1' && 'catActive'}`} onClick={this.isUsed('1')}>未使用</View>*/}
          {
            list.length > 0 && list.map(ele => {
              const { thirdPartyType, id } = ele
              return (
                <Block key={id}>
                  { thirdPartyType === 'TAO_QUAN' && this.renderCoupon(ele) }
                  {(thirdPartyType === 'FREE_LUNCH' || thirdPartyType === 'LOCAL_TAO_QUAN') && this.renderLunch(ele)}
                </Block>
              )
            })
          }
        </View>
        {
          list.length > 0 && <AtLoadMore status={paging} />
        }
        {
          noData && <NoData />
        }
        {
          effects['mine/getLunchAndCouponAction'] && page === 0 && (
            <View className="atLoading">
              <AtActivityIndicator mode="center" content="加载中..." />
            </View>
          )
        }
        <AtMessage />
      </Block>
    )
  }
}
