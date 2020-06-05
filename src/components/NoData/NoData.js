import { Component } from '@tarojs/taro'
import { Image, Text, View } from '@tarojs/components'
import { STATIC_IMG_URL } from '../../config/baseUrl'
import './NoData.scss'

/**
 * 没有数据
 */
export default class NoData extends Component {
    static options = {
      addGlobalClass: true
    };

    constructor() {
      super()
      this.state = {}
    }

    render() {
      const {
        msg,
        noDataImg,
        noPaddingTop
      } = this.props
      return (
        <View
          className="flex-col flex-ac nodata-wrap"
          style={{ paddingTop: noPaddingTop ? 0 : '' }}
        >
          <Image
            src={noDataImg || `${STATIC_IMG_URL}/nodata/index.png`}
            className="nodata-img"
            mode="aspectFit"
          />
          <Text className="nodata-msg">{msg || '暂无数据'}</Text>
        </View>
      )
    }
}
