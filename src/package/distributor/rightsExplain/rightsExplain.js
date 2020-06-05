import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Text, Image, ScrollView
} from '@tarojs/components'
import './rightsExplain.scss'
import { GRADE_RIGHTS } from '../../../config/config'
import { getUserDistributor, strReplaceParams } from '../../../utils/utils'
import IconFont from '../../../components/IconFont/IconFont'

export default class RightsExplain extends PureComponent {
  config = {
    navigationBarTitleText: '等级权益说明',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
    disableScroll: true
  }

  constructor() {
    super()
    const { partnerLevelModel = {} } = getUserDistributor()
    const { hierarchy } = partnerLevelModel
    this.state = {
      hierarchys : GRADE_RIGHTS.filter(o => (hierarchy & o.value) === o.value)
    }
  }

  render() {
    const { hierarchys } = this.state
    return (
      <View className="pageWarp">
        <ScrollView
          className="rightsExplain"
          scrollY
        >
          {
            hierarchys.map((o, i) => (
              <View
                className="flex-row flex-sb upgrade-rights-item"
                key={i}
              >
                <View className="flex-col rights-right">
                  <View
                    className="upgrade-rights-title flex-row flex-ac"
                  >
                    <IconFont value="imgMember" h={20} w={24} mr={10} />
                    <Text>{o.value === 8 ? strReplaceParams(o.label) : o.label}</Text>
                  </View>
                  <View
                    className="upgrade-rights-content"
                  >
                    {o.value === 8 ? strReplaceParams(o.desc) : o.desc}
                  </View>
                </View>
              </View>
            ))
          }
        </ScrollView>
      </View>
    )
  }
}
