import Taro from '@tarojs/taro'
import {
  View, Text, Input, Block
} from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import { getCurrentLoaction } from '../../../../utils/utils'
import './searchAddress.scss'
import { STATIC_IMG_URL } from '../../../../config/baseUrl'

const amapFile = require('../../../../utils/amap-wx')

export default class searchAddress extends Taro.Component {
  constructor() {
    super()
    const userLocation = getCurrentLoaction()
    this.state = {
      tips: {},
      userLocation
    }
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    })
  }

    bindInput = e => {
      const { longitude, latitude } = this.state.userLocation
      const that = this
      const keywords = e.detail.value
      const myAmapFun = new amapFile.AMapWX({ key: '94b742bf454bf235ba9642d698557af7' })
      myAmapFun.getInputtips({
        keywords,
        location: `${longitude},${latitude}`,
        city: '成都',
        success: data => {
          if (data && data.tips) {
            that.setState({
              tips: data.tips
            })
          }
        }
      })
    };

    bindSearch = val => {
      const { location, name, district } = val
      const [longitude, latitude] = location.split(',')
      const pages = Taro.getCurrentPages()
      const prevPage = pages[pages.length - 2]
      console.log(pages)
      prevPage.$component.setState({
        longitude,
        latitude,
        location: {
          address: district,
          name,
          latitude,
          longitude
        },
        markers: [...prevPage.$component.state.markers.slice(0, -1), {
          iconPath: `${STATIC_IMG_URL}/icon/icon_location_red.png`,
          zIndex: 1,
          id: 0,
          latitude,
          longitude,
          width: 20,
          height: 26
        }]
      }, () => {
        Taro.navigateBack()
      })
    };

    render() {
      const { tips } = this.state
      return (
        <Block>
          <View className="search-header">
            <View className="flex-row flex-ac input-wrap">
              <Input
                className="inputAddress flex1"
                onInput={this.bindInput}
                placeholder="请输入地址"
              />
              <Text className="line">|</Text>
              <AtIcon value="search" size={24} color="#999" />
            </View>
          </View>
          <View className="searchContainer">
            {
                        tips && tips.length > 0 && tips.map((ele, index) => (
                          <View
                            className="addressItem"
                            key={index}
                            onClick={this.bindSearch.bind(this, ele)}
                          >
                            <View className="nameTitle">{ele.name}</View>
                            <View className="addressMsg">{ele.district}</View>
                          </View>
                        ))
                    }
          </View>
        </Block>
      )
    }
}
