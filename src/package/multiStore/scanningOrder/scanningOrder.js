import Taro, { Component } from '@tarojs/taro'
import { View, Image, Text, Block } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import './scanningOrder.scss'
import {
  getServerPic, hideLoading, showToast, toDecimal
} from '../../../utils/utils'
import IconFont from '../../../components/IconFont/IconFont'
import PageLoading from '../../../components/PageLoading/PageLoading'
const STATIC_ICON_URL = 'http://resource.canyingdongli.com/island-zhuancan/icon/'

const dayjs = require('dayjs')

@connect(({
  loading: { effects }
}) => ({
  effects
}))
export default class ScanningOrder extends Component {
  config = {
    navigationBarTitleText: '订单详情',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      orderDetail: {},
      noOrder: false
    }
  }

  componentDidMount() {
    this.loadDetail()
  }

  loadDetail = () => {
    const { orderSn } = this.$router.params
    this.props.dispatch({
      type: 'order/getOrderDetailAction',
      payload: { orderSn },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            orderDetail: data,
            noOrder: false
          })
        } else {
          this.setState({
            noOrder: true
          })
        }
      }
    })
  }

  notFullReductionMoney = () => {
    // const {
    //   orderDetail: {
    //     fullReductionActivity,
    //     shopOrderProductInfoDTOS = []
    //   }
    // } = this.state
    // const requiredGoods = shopOrderProductInfoDTOS.reduce((acc, cur) =>  , 0)
  }


  render() {
    const {
      orderDetail: {
        orderState, shopOrderProductInfoDTOS = [],
        shopOrderExtendedInfoDTO,
        orderSn, amount, addTime, operateTime,
        totalAmount, fullReduction, tableName,
        peopleNum, mealNumber, couponFee, discountFee, tableFee
      }, noOrder
    } = this.state
    const { orderRemark } = shopOrderExtendedInfoDTO || {}
    const {
      effects = {}
    } = this.props
    return (
      <View className="orderBox">
        {
          effects['order/getOrderDetailAction'] && <PageLoading />
        }
        {
          noOrder && (
            <View
              className="noOrder flex-col flex-ac flex-jc"
            >
              <IconFont value="imgNoOrder" w={172} h={150} />
              <Text className="weight">订单生成中</Text>
              <Text
                className="refresh"
                onClick={this.loadDetail}
              >
                点击刷新
              </Text>
            </View>
          )
        }
        {
          orderState === 'PENDING' && (
            <View className="orderHeader">
              <View className="orderHeaderItem orderItemAgo">
                <Image src={`${STATIC_ICON_URL}scan_pay.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">已付款</View>
              </View>
              <View className="orderHeaderLine"/>
              <View className="orderHeaderItem">
                <Image src={`${STATIC_ICON_URL}scan_order.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">已付款</View>
              </View>
            </View>
          )
        }
        {
          orderState === 'COOKING' && (
            <View className="orderHeader">
              <View className="orderHeaderItem orderItemAgo">
                <Image src={`${STATIC_ICON_URL}scan_pay.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">已付款</View>
              </View>
              <View className="orderHeaderLine"/>
              <View className="orderHeaderItem orderItemAgo">
                <Image src={`${STATIC_ICON_URL}scan_order.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">已接单</View>
              </View>
              <View className="orderHeaderLine"/>
              <View className="orderHeaderItem">
                <Image src={`${STATIC_ICON_URL}scan_meal.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">用餐中</View>
              </View>
            </View>
          )
        }
        {
          orderState === 'CANCELLED' && (
            <View className="orderHeader">
              <View className="orderHeaderItem orderItemAgo">
                <Image src={`${STATIC_ICON_URL}scan_pay.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">已付款</View>
              </View>
              <View className="orderHeaderLine"/>
              <View className="orderHeaderItem orderItemAgo">
                <Image src={`${STATIC_ICON_URL}scan_order.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">待接单</View>
              </View>
              <View className="orderHeaderLine"/>
              <View className="orderHeaderItem">
                <Image src={`${STATIC_ICON_URL}scan_order.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">取消订单</View>
              </View>
            </View>
          )
        }
        {
          orderState === 'CANCELLED' && (
            <View className="orderCancelBox">
              <View className="orderCancelTitle">商家取消了订单</View>
              <View className="orderCancelWord marginT">取消原因：购买期间没有骑手接单</View>
              <View className="orderCancelWord paddingB">您支付的款项将会在1-7个工作日内返回您的原支付渠道</View>
              <View className="orderCancelFooter">
                <View className="cancelFooterTitle">退款进度</View>
                <View className="cancelFooterStatus">已退款</View>
              </View>
            </View>
          )
        }
        <View className="tableInfo flex-row flex-sb">
          <Text>{`桌号：${tableName} ${mealNumber ? `餐号：${mealNumber}` : ''}`}</Text>
          <Text>{`${peopleNum}人`}</Text>
        </View>
        <View className="orderInfo">
          <View className="orderInfoList">
            {
              shopOrderProductInfoDTOS.map(ele => {
                const {
                  imageUrl = '', productName, productNum,
                  skuId, productPrice
                } = ele
                const pictureUrl = imageUrl && imageUrl.split(',')[0]
                return (
                  <View className="orderListItem" key={skuId}>
                    {
                      pictureUrl && (
                        <View className="orderInfoImg flex-sk">
                          <Image src={getServerPic(pictureUrl)}/>
                        </View>
                      )
                    }
                    <View className="orderInfoName flex-row flex-ac flex-sb">
                      <View className="orderDishName">{productName}</View>
                      <View className="orderDishPay orderDishPayPositionBottom">
                        <View className="orderDishPayItem">
                          x
                          <Text>{productNum}</Text>
                        </View>
                        <View className="orderDishPayItem">
                          ￥
                          <Text>{productPrice}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )
              })
            }
          </View>
          {
            fullReduction > 0 && (
              <View className="orderInfoItem">
                <View className="orderFavourable">
                  <Text className="orderActive">满减</Text>
                </View>
                <View className="orderReduce">
                  <Text>-￥</Text>
                  {fullReduction}
                </View>
              </View>
            )
          }
          {
            tableFee && tableFee.totalFee && (
              <View className="orderInfoItem">
                <View className="orderFavourable">
                  <Text className="coupon">桌台费</Text>
                </View>
                <View className="orderReduce">
                  <Text>￥</Text>
                  {tableFee.totalFee}
                </View>
              </View>
            )
          }
          {
            couponFee && (
              <View className="orderInfoItem">
                <View className="orderFavourable">
                  <Text className="coupon">优惠券</Text>
                </View>
                <View className="orderReduce">
                  <Text>-￥</Text>
                  {couponFee}
                </View>
              </View>
            )
          }
          <View className="orderInfoItem">
            <View className="orderFavourable"/>
            <View className="orderReduce">
              {
                discountFee && (
                  <Text className="orderCutMoney">已优惠￥{toDecimal(discountFee)}</Text>
                )
              }
              <Text className="orderPayMoney">￥{amount}</Text>
            </View>
          </View>
        </View>
        {
          orderRemark && (
            <View className="orderRemarks">
              <View className="flex-sk">订单备注</View>
              <View className="ellipsis">{orderRemark}</View>
              <Image className="orderArrow flex-sk"
                     src={require('../../../images/icon/icon_arrow.png')}/>
            </View>
          )
        }
        <View className="orderTimeBox">
          <View className="orderTimeItem">
            <View>订单编号</View>
            <View>{orderSn}</View>
          </View>
          <View className="orderTimeItem">
            <View>创建时间</View>
            <View>{dayjs(addTime * 1000)
              .format('YYYY-MM-DD HH:mm:ss')}</View>
          </View>
          <View className="orderTimeItem">
            <View>接单时间</View>
            <View>{dayjs(operateTime * 1000).format('YYYY-MM-DD HH:mm:ss')}</View>
          </View>
          {
            orderState === 'CANCELLED' && (
              <View className="orderTimeItem">
                <View>取消时间</View>
                <View>{dayjs(operateTime * 1000)
                  .format('YYYY-MM-DD HH:mm:ss')}</View>
              </View>
            )
          }
        </View>
      </View>
    )
  }
}
