import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Text, Button
} from '@tarojs/components'

import './applySuccess.scss'
import IconFont from '../../components/IconFont/IconFont'
import { PLATFORM_ID, STATIC_IMG_URL } from '../../config/baseUrl'
import {getUserDetail, getUserDistributor, navToPage, remainingTime} from '../../utils/utils'
import ContactModal from '../../components/ContactModal/ContactModal'

const { onfire } = Taro.getApp()

export default class ApplySuccess extends PureComponent {
  config = {
    navigationBarTitleText: '报名成功',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      accountsModal: false
    }
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

  onShareAppMessage() {
    const { dineInfo } = this.$router.params
    const {
      dishId, merchantId, skuId, infoDAD
    } = JSON.parse(dineInfo)
    const { nickName } = getUserDetail()
    const { code } = getUserDistributor()
    return {
      title: `${nickName}邀请你免费参与霸王餐抽奖`,
      path: `/pages/goodsDetails/goodsDetails?dishId=${dishId}&platFormId=${PLATFORM_ID}&merchantId=${merchantId}&skuId=${skuId}&from=DineAndDash&infoDAD=${infoDAD}&code=${code || ''}`,
      imageUrl: `${STATIC_IMG_URL}/dineAndDash_logo.png`
    }
  }

  closeAccountModal = () => {
    this.setState({
      accountsModal: false
    })
  }

  render() {
    const { time } = this.$router.params
    const { accountsModal } = this.state
    return (
      <View className="container flex-col flex-ac">

        <IconFont value="imgApplySuccess" h={120} w={120}/>
        <Text className="title" a>报名成功</Text>
        <View className="lotteryTime">
          <Text>距离开奖还有：</Text>
          <Text className="time">{remainingTime(time)}</Text>
        </View>
        <Text className="resultMsg">中奖结果将通过平台微信公众号或短信通知到您</Text>
        <View className="flex-row">
          <Button openType="share" className="invitePartner">邀请好友参与</Button>
          <ContactModal />
          {/*<Button*/}
          {/*  className="invitePartner"*/}
          {/*  onClick={() => {*/}
          {/*    navToPage('/pages/activePage/activePage?page=account')*/}
          {/*  }}*/}
          {/*>*/}
          {/*  关注公众号*/}
          {/*</Button>*/}
        </View>
        <Text
          className="viewOther"
          onClick={() => {
            Taro.navigateBack({ delta: 2 })
          }}
        >
          查看其他活动
        </Text>
      </View>
    )
  }
}
