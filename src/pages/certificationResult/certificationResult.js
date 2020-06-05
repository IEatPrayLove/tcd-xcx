import Taro from '@tarojs/taro'
import {
  View, Text, Block, Image
} from '@tarojs/components'
import './certificationResult.scss'
import IconFont from '../../components/IconFont/IconFont'
import { STATIC_IMG_URL } from '../../config/baseUrl'

export default class CertificationResult extends Taro.PureComponent {

  config = {
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
  }

  render() {
    return (
      <Block>
        <View className="pageSteps flex-row flex-ac flex-jc">
          <View className="flex-col flex-ac">
            <IconFont value="imgCerPlatform" w={64} h={64} />
            <Text className="stepDes">平台认证</Text>
          </View>
          <Text className="line" />
          <View className="flex-col flex-ac">
            <View className="cerStep">
              <IconFont value="imgCerVerify" w={64} h={64} />
              <View className="imgCerStatus">
                <IconFont value="imgCerIng" w={18} h={18} />
              </View>
            </View>
            <Text className="stepDes">客服审核中</Text>
          </View>
        </View>
        <View className="result">
          <Image src={`${STATIC_IMG_URL}/cer_ing.png`} className="resultImg" />
          <View className="result-title">达人审核中</View>
          <View className="result-content">3-7个工作日内会有审核结果，请耐心等待</View>
        </View>
        <View className="flex-row flex-ac flex-jc">
          <View
            className="btn goIndex"
            onClick={() => {
              Taro.switchTab({
                url: '/pages/index/index'
              })
            }}
          >
            回到主页
          </View>
          <View
            className="btn finish"
            onClick={() => {
              Taro.navigateBack()
            }}
          >
            完成
          </View>
        </View>
      </Block>
    )
  }
}
