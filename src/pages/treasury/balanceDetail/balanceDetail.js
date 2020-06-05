import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Text
} from '@tarojs/components'
import './balanceDetail.scss'
import { dateFormatWithDate, decodeURIObj } from '../../../utils/utils'
import { BALANCE_TYPE, PAY_CHANNEL } from '../../../config/config'

export default class balanceDetail extends PureComponent {
  config = {
    navigationBarTitleText: '余额详情',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
  }

  constructor() {
    super()
    this.state = {
      balanceInfo: decodeURIObj(this.$router.params.balanceInfo)
    }
  }

  render() {
    const { balanceInfo } = this.state
    return (
      <View className="balanceDetail">
        <View className="balanceMoney">
          {balanceInfo.runningType === 'INCOME' ? '+' : '-'}
          ￥
          {balanceInfo.amount}
        </View>
        <View className="balanceInfo">
          <View className="flex-row flex-ac infoRow">
            <View className="infoTitle">收支类型</View>
            <View className="infoContent">{balanceInfo.runningType === 'INCOME' ? '收入' : '支出'}</View>
          </View>
          <View className="flex-row flex-ac infoRow">
            <View className="infoTitle">交易类型</View>
            <View className="infoContent">
              {
                balanceInfo.tradeSources === 'BUY_GOODS' ? (<Text>{balanceInfo.shopName ? balanceInfo.shopName : '购买商品'}</Text>)
                  : BALANCE_TYPE[balanceInfo.tradeSources]
              }
            </View>
          </View>
          <View className="flex-row flex-ac infoRow">
            <View className="infoTitle">支付方式</View>
            <View className="infoContent">
              {`${PAY_CHANNEL[balanceInfo.paymentChannels]}支付`}
            </View>
          </View>
          {
            (balanceInfo.tradeSources === 'RECHARGE' || balanceInfo.tradeSources === 'BUY_TC_CARD' || balanceInfo.tradeSources === 'WITHDRAWAL' || balanceInfo.tradeSources === 'BUY_GOODS_CASHBACK' || balanceInfo.tradeSources === 'BUY_GOODS') && (
            <View className="flex-row flex-ac infoRow">
              <View className="infoTitle">支付金额</View>
              <View className="infoContent">{`￥${balanceInfo.transactionAmount}`}</View>
            </View>
            )
          }
          <View className="flex-row flex-ac infoRow">
            <View className="infoTitle">交易时间</View>
            <View className="infoContent">{dateFormatWithDate(balanceInfo.stateChangeDate)}</View>
          </View>
          <View className="flex-row flex-ac infoRow">
            <View className="infoTitle">订单编号</View>
            <View className="infoContent">{balanceInfo.orderSn || '-'}</View>
          </View>
          <View className="flex-row flex-ac infoRow">
            <View className="infoTitle">交易编号</View>
            <View className="infoContent">{balanceInfo.paymentOrderCode || '-'}</View>
          </View>
        </View>
      </View>
    )
  }
}
