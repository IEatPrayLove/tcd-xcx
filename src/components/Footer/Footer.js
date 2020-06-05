import Taro from '@tarojs/taro'
import {
  Image, Text, View, Block
} from '@tarojs/components'
import './Footer.scss'
import { STATIC_IMG_URL } from '../../config/baseUrl'

function Footer() {
  return (
    <View className="footer">
      <Image src={`${STATIC_IMG_URL}/footer-tip.png`} className="footerImg" />
      <View className="footerDesc">
        <View className="footerLine" />
        <Text>赚餐提供技术支持</Text>
        <View className="footerLine" />
      </View>
    </View>
  )
}

export default Footer
