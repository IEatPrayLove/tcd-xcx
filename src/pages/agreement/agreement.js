import { Component } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import './agreemen.scss'

export default class Agreement extends Component {
  config = {
    navigationBarTitleText: '会员服务协议',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor(props) {
    super(props)
    this.state = {

    }
  }

  render() {
    return (
      <View className="agreementWarp">

        <View>1.您应理解平台超级会员服务具备一定有效期，有效期届满后您未续费或重新开通的，平台超级会员服务终止，对应的平台超级会员权益失效。</View>
        <View>2.您应理解按本协议及相关规则使用平台超级会员服务，尊重平台超级会员服务使用限制及按本协议约定履行义务是您使用平台超级会员服务的前提，如您违反本协议的相关约定,平台会视您的实际违约情况选择中止、终止或解除本协议。</View>


        <View>
          <Text>3.您知悉并确认</Text>
          <Text className="bold">您所支付会员服务费用代表您开通、使用平台超级会员服务平台所付出的整体成本和努力，无法按照平台超级会员权益或有效期进行拆分。您开通平台超级会员服务后，若出现以下情形造成平台超级会员服务终止或中止的，您不应要求退还部分或全部会员服务费用:</Text>
          <View className="bold">1)您中途主动取消平台超级会员服务、放弃会员权益或终止资格的；</View>
          <View className="bold">2)平台根据平台规则、本协议及规则注销您的账号、终止您的平台用户资格。</View>
        </View>


        <View>4.若平台无合理理由即自行决定终止向您提供平台超级会员服务，作为对您作为平台超级会员的回馈，平台将根据届时终止超级会员服务通知中的约定向您做出相应补偿。</View>

        <View>5.因平台认定您为违反本协议或任何相关法律的行为、欺诈或滥用平台超级会员的行为、或损害平台利益或伤害其他用户的行为而导致的终止，平台不予退款。</View>


      </View>
    )
  }
}
