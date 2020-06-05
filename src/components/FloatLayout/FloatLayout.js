import { Component } from '@tarojs/taro'
import { View } from '@tarojs/components'
import './FloatLayout.scss'
import { isFunction } from '../../utils/utils'

/**
 * 底部弹层组件
 */
export default class FloatLayout extends Component {
  constructor() {
    super()
  }

  // 阻止面板冒泡事件
  stopPropagation = (e) => {
    e.stopPropagation()
  }

  //点击遮罩关闭弹窗
  onCloseLayout = (e) => {
    if (this.props.clickMaskClose === false) {
      return
    }
    isFunction(this.props.onCloseLayout) && this.props.onCloseLayout()
  }

  render() {
    const {
      wrapHeight,
      noLayoutWrap = false
    } = this.props
    return (
      <View className="mask"
            onClick={this.onCloseLayout.bind(this)}
      >
        {
          noLayoutWrap ?
            <View onClick={this.stopPropagation.bind(this)}>
              {this.props.children}
            </View>
            :
            <View className="layout-wrap"
                  onClick={this.stopPropagation.bind(this)}
                  style={`height:${wrapHeight}px;`}
            >
              {this.props.children}
            </View>
        }
      </View>
    )
  }
}
