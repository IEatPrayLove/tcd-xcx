import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Image, Text
} from '@tarojs/components'
import './couponResult.scss'
import { STATIC_IMG_URL } from '../../config/baseUrl'
import ContactModal from '../../components/ContactModal/ContactModal'
import { navToPage } from '../../utils/utils'

const { onfire } = Taro.getApp()

export default class CouponResult extends PureComponent {
  config = {
    navigationBarTitleText: '支付成功',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      accountsModal: false
    }
  }

  closeAccountModal = () => {
    this.setState({
      accountsModal: false
    })
  }

  componentDidShow() {
    onfire.on('WebViewMessage', message => {
      this.setState({
        accountsModal: message
      })
    })
  }

  componentWillUnmount() {
    onfire.un('WebViewMessage')
  }

  render() {
    const { accountsModal } = this.state
    return (
      <View className="flex-col flex-ac">
        <Image className="resultLog" src={`${STATIC_IMG_URL}/icon_pay_success.png`}/>
        <Text className="title">支付成功</Text>
        <View className="flex-row flex-jc">
          <View className="operation flex-row flex-jc">
            <View onClick={() => {
              const { orderSn } = this.$router.params
              Taro.redirectTo({ url: `/pages/equityDetail/equityDetail?orderSn=${orderSn}` })
            }}
            >
              查看订单
            </View>
          </View>
          <ContactModal />
        </View>
      </View>
    )
  }
}
