import Taro, { Component } from '@tarojs/taro'
import { View, Block, Image } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import './payResult.scss'
import IconFont from '../../../components/IconFont/IconFont'
import { decodeURIObj, encodeURIObj, navToPage } from '../../../utils/utils'

@connect(({ storedMoney: { alreadyStoredCards } }) => ({
  alreadyStoredCards
}))
export default class PayResult extends Component {
  config = {
    navigationBarTitleText: '充值成功',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  render() {
    const cardInfo = decodeURIObj(this.$router.params.cardInfo)
    return (
      <Block>
        <Image className="icon" src="" />
        <View className="title">充值成功</View>
        <View className="btnSection flex-row flex-jc">
          <View onClick={() => Taro.switchTab({ url: '/pages/mine/mine' })}>查看余额</View>
          <View
            onClick={() => {
              const { cardGuid } = cardInfo
              const { alreadyStoredCards } = this.props
              const newData = alreadyStoredCards.find(ele => ele.cardGuid === cardGuid)
              navToPage(`/package/storedMoney/paymentCode/paymentCode?cardInfo=${encodeURIObj(newData)}`)
            }}
          >
            去买单
          </View>
        </View>
      </Block>
    )
  }
}
