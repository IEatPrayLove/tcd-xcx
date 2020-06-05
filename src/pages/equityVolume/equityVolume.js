import Taro, { PureComponent } from '@tarojs/taro'
import { View, Block, Image, Text } from '@tarojs/components'
import { AtTabs } from 'taro-ui'

import './equityVolume.scss'

export default class EquityVolume extends PureComponent {
  config = {
    navigationBarTitleText: '权益卡券'
  }
  constructor(){
    super()
    this.state = {
      curTab: 0,
      tabList: [{ title: '全部' }, { title: '未使用' }, { title: '已使用' }]
    }
  }

  selectedTab = val => {
    this.setState({
      curTab: val
    })
  }

  render() {
    const { curTab, tabList } = this.state
    return (
      <Block>
        <AtTabs
          current={curTab}
          tabList={tabList}
          onClick={this.selectedTab}
          className="headerTabs"
        />
        <View className="listWarp">
          <View className="volumeItem flex-row">
            <Image className="volumeLogo" src={require('../../images/demo/member1.png')} />
            <View className="volumeInfo flex-col flex-sb flex1">
              <Text className="name">肯德基葡式蛋挞（两只）</Text>
              <View className="flex-row flex-ac flex-sb">
                <Text className="price">￥7.8</Text>
                <View className="confirm">确认使用</View>
              </View>
              <Text className="time">有效期：2019.07.24</Text>
            </View>
          </View>
          <View className="volumeItem flex-row">
            <Image className="volumeLogo" src={require('../../images/demo/member1.png')} />
            <View className="volumeInfo flex-col flex-sb flex1">
              <Text className="name">肯德基葡式蛋挞（两只）</Text>
              <View className="flex-row flex-ac flex-sb">
                <Text className="price">￥7.8</Text>
                <View className="confirm">确认使用</View>
              </View>
              <Text className="time">有效期：2019.07.24</Text>
            </View>
          </View>
        </View>
      </Block>
    )
  }
}
