import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Button, Image
} from '@tarojs/components'
import './stationedSubmit.scss'
import { navToPage } from '../../../utils/utils'
import { STATIC_IMG_URL } from '../../../config/baseUrl'

export default class stationedSubmit extends PureComponent {
  config = {
    navigationBarTitleText: '商家入驻'
  }

  constructor() {
    super()
    this.state = {

    }
  }

  render() {
    return (
      <View className="submitBox">
        <Image className="submitImg" src={`${STATIC_IMG_URL}/icon/stationed_submit.png`} />
        <View className="submitTitle">入驻资料已提交成功</View>
        <View className="submitWord">我们将在3-7个工作日内审核完成</View>
        <View className="submitWord">审核结果将通过短信通知或微信公众号查询</View>
        <View className="submitBtnGroup">
          <View
            className="submitBtnGhost"
            onClick={() => {
              Taro.switchTab({
                url: '/pages/index/index'
              })
            }}
          >
            返回商城
          </View>
          <Button className="submitBtn" openType="contact">关注公众号</Button>
        </View>
      </View>
    )
  }
}
