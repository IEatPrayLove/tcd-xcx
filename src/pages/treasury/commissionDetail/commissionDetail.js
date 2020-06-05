import Taro, { PureComponent } from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import {
  View, Block, Image, Text
} from '@tarojs/components'

import './commissionDetail.scss'
import { dateFormatWithDate, getServerPic } from '../../../utils/utils'

@connect(({ loading: { effects } }) => ({
  effects
}))
export default class CommissionDetail extends PureComponent {
  config = {
    navigationBarTitleText: '分享收益详情',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
  }

  constructor(props) {
    super(props)
    this.state = {
      id: this.$router.params.id,
      type: this.$router.params.type,
      dataInfo: {}
    }
  }

  componentDidShow() {
    this.getRetailExpertDetail()
  }

  // 获取分享或者达人赏金的详情

  getRetailExpertDetail = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'treasury/getRetailExpertDetail',
      payload: {
        id: this.state.id
      },
      callback: res => {
        if (res.ok) {
          this.setState({
            dataInfo: res.data
          })
        }
      }
    })
  }

  render() {
    const { dataInfo, type } = this.state

    return (
      <View className="page">
        <View className="flex-col flex-ac imgLogoContent">
          {/* {
            dataInfo.userProfitType == 'DISTRIBUTOR_GOODS_PROFIT'&& */}
          <View className="flex-col">
            <Image src={getServerPic(dataInfo.promotionMerchantHeadPic)} className="imgLogo" />
            {
              type === 'expert' && <Text className="name">{dataInfo.promotionMerchantName}</Text>
            }
          </View>
          {/* } */}
          <Text className="income">
            ￥
            {dataInfo.changeAmount}
          </Text>
        </View>
        <View className="info">
          <View className="flex-row infoItem">
            <Text>收益来源</Text>
            {
              type === 'retail' && (
              <View className="flex-col">
                <Text className="colorBlack marB">
                  {dataInfo.userProfitType === 'DISTRIBUTOR_GOODS_PROFIT' ? '分享商品-自购'
                    : dataInfo.userProfitType === 'DISTRIBUTOR_CARD_PROFIT' ? '会员卡赏金'
                      : dataInfo.userProfitType === 'DISTRIBUTOR_GOODS_PROFIT' ? '分享商品' : '会员卡瓜分赏金'}
                </Text>
                <Text className="colorBlack goodsName">{dataInfo.distributorShopName === null ? '' : dataInfo.distributorShopName}</Text>
              </View>
              )
            }
            {
              type === 'expert' && (
              <View className="flex-col">
                <Text className="colorBlack marB">
                  {dataInfo.promotionMerchantName}
                  -
                  {dataInfo.placeName}
                  {dataInfo.placeType === 'LIVE' ? '直播' : dataInfo.placeType === 'VIDEO' ? '视频' : dataInfo.placeType === 'GRAPHIC' ? '图文' : '其他'}
                  推广
                </Text>
              </View>
              )
            }
          </View>
          <View className="infoItem">
            <Text>当前状态</Text>
            <Text className="colorBlack">已存入余额</Text>
          </View>
          {
            type === 'expert' && (
            <View className="infoItem">
              <Text>审核时间</Text>
              <Text className="colorBlack">{dateFormatWithDate(dataInfo.changeDate)}</Text>
            </View>
            )
          }
          {
            type === 'retail' && (
            <View className="infoItem">
              <Text>收益时间</Text>
              <Text className="colorBlack">{dateFormatWithDate(dataInfo.createTime)}</Text>
            </View>
            )
          }
          {
            dataInfo.orderSn && (
              <View className="infoItem">
                <Text>订单编号</Text>
                <Text className="colorBlack">{dataInfo.orderSn}</Text>
              </View>
            )
          }
          {
            dataInfo.paymentOrderCode && (
              <View className="infoItem">
                <Text>交易单号</Text>
                <Text className="colorBlack">{dataInfo.paymentOrderCode}</Text>
              </View>
            )
          }
        </View>
      </View>
    )
  }
}
