import { Component } from '@tarojs/taro'
import {
  Block, ScrollView, Text, View
} from '@tarojs/components'
import { AtTabs, AtTabsPane } from 'taro-ui'
import { connect } from '@tarojs/redux'
import './userCoupons.scss'
import {
  dateFormatWithDate, navToPage, showToast
} from '../../utils/utils'
import { STATIC_IMG_URL } from '../../config/baseUrl'

import NoData from '../../components/NoData/NoData'
import IconFont from '../../components/IconFont/IconFont'

const dayjs = require('dayjs')
// const relativeTime = require('dayjs/plugin/relativeTime')
//
// dayjs.extend(relativeTime)
/**
 * 我的红包页面
 */
// @authenticate
@connect(({}) => ({
}))
class UserCoupons extends Component {
  config = {
    navigationBarTitleText: '我的优惠券',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
  };

  constructor() {
    super()
    this.state = {
      current: 0,
      redList: [],
      noData: false
    }
  }

  componentWillMount() {

  }

  componentDidMount() {
    this.getConsumerBonus()
  }

  getConsumerBonus = () => {
    this.props.dispatch({
      type: 'userCoupons/getUserOfferCouponAction',
      payload: {
        status: this.state.current
      },
      callback: res => {
        if (res.ok) {
          this.setState({
            redList: res.data,
            noData: res.data.length === 0
          })
        } else {
          this.setState({
            noData: true
          })
          showToast('服务器错误, 请重试!')
        }
      }
    })
  };

  handleClick(value) {
    const { current } = this.state
    if (value === current) return
    this.setState({
      current: value,
      redList: [],
      noData: false
    }, () => {
      if (value !== 3) {
        this.getConsumerBonus()
      } else {
        this.props.dispatch({
          type: 'userCoupons/getExpiredOfferCouponAction',
          callback: res => {
            if (res.ok) {
              this.setState({
                redList: res.data,
                noData: res.data.length === 0
              })
            } else {
              this.setState({
                noData: true
              })
              showToast('服务器错误, 请重试!')
            }
          }
        })
      }
    })
  }

  render() {
    const { redList, noData, current } = this.state
    const tabList = [{ title: '未使用' }, { title: '已使用' }, { title: '已过期' }]
    return (
      <Block>
        <ScrollView>
          <AtTabs
            current={this.state.current}
            tabList={tabList}
            onClick={this.handleClick.bind(this)}
          >
            {
            tabList.map((ele, index) => (
              <AtTabsPane key={index} current={this.state.current} index={index}>
                <View className="red">
                  {
                    redList && redList.length > 0 && redList.map(o => {
                      const oldCoupon = dayjs(o.endDate).diff(dayjs(), 'hour') <= 24
                      const newCoupon = dayjs().diff(dayjs(o.insertDate), 'hour') <= 24
                      return (
                        <View className="redItem flex-row" key={o.id}>
                          {
                            this.state.current !== 0 && (
                              <View className="tip-gray">
                                <View className="tip-word">{this.state.current === 1 ? '已使用' : '已过期'}</View>
                              </View>
                            )
                          }
                          {
                            this.state.current === 0 && (oldCoupon || newCoupon) && (
                              <View className="label">
                                <IconFont h={78} w={78} value={newCoupon ? 'imgNewCoupon' : 'imgOldCoupon'} />
                              </View>
                            )
                          }
                          <View className={`flex-col flex-jc flex-ac ${this.state.current !== 0 ? 'used' : 'unused'} `}>
                            <View className="amount">
                              <Text>￥</Text>
                              {o.amountOfCoupon}
                            </View>
                            {
                              o.demandPrice === 0 ? (<View className="full">无门槛使用</View>) : (
                                <View className="full">
                                  满
                                  {o.demandPrice}
                                  可用
                                </View>
                              )
                            }
                          </View>
                          <View className="info flex-col flex1" style={{ justifyContent: 'space-between' }}>
                            <Text className="redName">{o.couponName}</Text>
                            <Text className="redUser">
                              {
                                o.couponType === 'PLATFORM_USE' ? '平台通用'
                                  : o.couponType === 'TO_THE_SHOP' ? '限到店消费使用'
                                  : o.couponType === 'WU_LIU' ? '限物流到家使用'
                                    : o.couponType === 'TAKE_OUT' ? '限外卖专用使用' : ''
                              }
                            </Text>
                            <Text
                              className="redDay"
                            >
                              {dateFormatWithDate(o.insertDate, 'yyyy-MM-dd') }
                              {' '}
                              至
                              {' '}
                              {dateFormatWithDate(o.endDate, 'yyyy-MM-dd')}
                            </Text>
                            {
                              o.status === 0 && current !== 2 && (
                                <View
                                  className="useBtn"
                                  onClick={() => {
                                    navToPage('/package/specialOffer/specialOffer')
                                  }}
                                >
                                  去使用
                                </View>
                              )
                            }
                          </View>
                        </View>
                      )
                    })
                    }
                </View>

                {
                  noData
                  && (
                    <NoData
                      noDataImg={`${STATIC_IMG_URL}/nodata/index.png`}
                      msg="暂无数据"
                    />
                  )
                }
              </AtTabsPane>
            ))
          }
          </AtTabs>
        </ScrollView>
      </Block>
    )
  }
}
export default UserCoupons
