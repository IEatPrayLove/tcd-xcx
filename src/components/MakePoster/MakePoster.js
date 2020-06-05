import Taro, { Component } from '@tarojs/taro'
import { Image, View } from '@tarojs/components'
import TaroCanvasDrawer from '../taro-plugin-canvas'
import { AtCurtain } from 'taro-ui'
import './MakePoster.scss'

export default class MakePoster extends Component {
  constructor(props) {
    super(props)
    this.state = {
      // 绘制的图片
      shareImage: null
    }
  }

  // 绘制成功回调函数 （必须实现）=> 接收绘制结果、重置 TaroCanvasDrawer 状态
  onCreateSuccess = result => {
    const { tempFilePath, errMsg } = result
    Taro.hideLoading()
    if (errMsg === 'canvasToTempFilePath:ok') {
      this.setState({
        shareImage: tempFilePath
      })
    } else {
      Taro.showToast({ icon: 'none', title: errMsg || '出现错误' })
      console.log(errMsg)
    }
  }

  // 绘制失败回调函数 （必须实现）=> 接收绘制错误信息、重置 TaroCanvasDrawer 状态
  onCreateFail = error => {
    Taro.hideLoading()
    console.log(error)
  }

  resetImg = () => {
    const { onClose } = this.props
    onClose()
    this.setState({
      shareImage: null
    })
  }

  render() {
    const { shareImage } = this.state
    const { renderStatus, config } = this.props
    return (
      <View onTouchMove={e => e.stopPropagation()}>
        <AtCurtain
          isOpened={renderStatus}
          onClose={this.resetImg}
        >
          <Image
            className="posterImg"
            src={shareImage}
            mode="aspectFit"
            lazy-load
            showMenuByLongpress
          />
          {
            // 由于部分限制，目前组件通过状态的方式来动态加载
            renderStatus
            && (
              <TaroCanvasDrawer
                config={config} // 绘制配置
                onCreateSuccess={this.onCreateSuccess} // 绘制成功回调
                onCreateFail={this.onCreateFail}
              />
            )
          }
        </AtCurtain>
      </View>
    )
  }
}
