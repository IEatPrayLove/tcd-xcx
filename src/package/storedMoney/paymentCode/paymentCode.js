import Taro, { Component } from '@tarojs/taro'
import {
  View, Image, Text, Button, Block, Input
} from '@tarojs/components'
import { connect } from '@tarojs/redux'

import './paymentCode.scss'
import IconFont from '../../../components/IconFont/IconFont'
import { decodeURIObj, encodeURIObj, navToPage } from '../../../utils/utils'

@connect(() => ({}))
export default class Index extends Component {
  config = {
    navigationBarTitleText: '支付码',
    navigationBarBackgroundColor: '#FFC349',
    enablePullDownRefresh: true,
    backgroundTextStyle: 'dark',
    disableScroll: true
  }

  state = {
    cardInfo: {}
  }

  componentDidMount() {
    this.setState({
      cardInfo: decodeURIObj(this.$router.params.cardInfo),
      memberInfo: decodeURIObj(this.$router.params.memberInfo)
    })
  }

  render() {
    const {
      cardInfo: { systemManagementCardNum, cardMoney, cardQRCode = '', cardQRCode2 = '' },
      memberInfo: { memberQRCode = '' }
    } = this.state
    const array = Taro.base64ToArrayBuffer(cardQRCode2)
    const base64 = Taro.arrayBufferToBase64(array)
    return (
      <Block>
        <View className="container">
          <View className="number">{`储值卡号:${systemManagementCardNum}`}</View>
          <View className="titleBalance">储值余额（元）</View>
          <View className="balance">{cardMoney}</View>
          <Image className="qrCode" src={`data:image/png;base64,${base64}`} />
          {/*<View className="cuttingLine flex-row flex-ac">*/}
          {/*  <View className="flex1 line" />*/}
          {/*</View>*/}
          {/*<View className="otherPayment">*/}
          {/*  <View className="title">其他支付方式</View>*/}
          {/*  <View className="flex-row flex-ac">*/}
          {/*    <IconFont value="imgPayWechat" h={30} w={35} mr={20} />*/}
          {/*    <Text className="flex1 weChat">微信支付</Text>*/}
          {/*    <IconFont value="icon-arrow-right-copy-copy" size={30} />*/}
          {/*  </View>*/}
          {/*</View>*/}
        </View>
        <View
          className="rechargeBtn"
          onClick={() => {
            const { cardInfo } = this.state
            Taro.redirectTo({ url: `/package/storedMoney/recharge/recharge?cardInfo=${encodeURIObj(cardInfo)}` })
          }}
        >
          充值
        </View>
      </Block>
    )
  }
}
