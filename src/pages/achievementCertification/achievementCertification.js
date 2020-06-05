import Taro from '@tarojs/taro'
import { Block, Image, View, Text, Button } from '@tarojs/components'
import { AtMessage } from 'taro-ui'
import './achievementCertification.scss'
import { STATIC_IMG_URL } from '../../config/baseUrl'
import IconFont from '../../components/IconFont/IconFont'

export default class achievementCertification extends Taro.PureComponent {
  config = {
    navigationBarTitleText: '达人认证'
  };

  constructor() {
    super()
    this.state = {
      achieveAgree: false
    }
  }

  approve = () => {
    Taro.redirectTo({ url: '/pages/platformCertification/platformCertification' })
  }

  render() {
    return (
      <Block>
        <Image src={`${STATIC_IMG_URL}/certification_bg.png`} className="pageHeader" />
        <View className="flex-row flex-ac flex-jc">
          <IconFont value="imgBubbles_right" w={44} h={23} />
          <Text className="title">认证流程</Text>
          <IconFont value="imgBubbles_left" w={44} h={23} />
        </View>
        <View className="rules">
          <View className="item">
            <Text>1</Text>
            <Text>最低认证门槛：</Text>
          </View>
          <View className="doorsill flex-col">
            <Text>• 微信：好友数>=200</Text>
            <Text>• 抖音：粉丝数量>=0.1W</Text>
            <Text>• 大众点评：用户等级>=LV1</Text>
          </View>
          <View className="item">
            <Text>2</Text>
            <Text>选择认证平台</Text>
          </View>
          <View className="item">
            <Text>3</Text>
            <Text>上传凭证截图及填写认证资料</Text>
          </View>
          <View className="item">
            <Text>4</Text>
            <Text>平台客服审核（预计3个工作日内）</Text>
          </View>
          <View className="item">
            <Text>5</Text>
            <Text>认证记录中查看认证结果，审核未通过可重新提交。已认证的渠道1个月可更新认证1次</Text>
          </View>
        </View>
        <View className="buttonWarp">
          <Button className="nowBtn" onClick={this.approve}>立即认证</Button>
        </View>
      </Block>
    )
  }
}
