import Taro, { Component } from '@tarojs/taro'
import { Button, Textarea, View } from '@tarojs/components'
import './orderRemark.scss'
import { isFunction } from '../../utils/utils'

/**
 * 订单备注
 */
export default class OrderRemark extends Component {

  config = {
    navigationBarTitleText: '订单备注',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
  }

  constructor() {
    super()
    this.state = {
      remark: '' // 评语
    }
  }

  componentWillMount() {
    this.setState({ remark: this.$router.params.oldRemark })
  }

  // 输入评语函数
  onInputRemark = (e) => {
    this.setState({ remark: e.target.value })
  }

  submitRemark = (e) => {
    const { remark } = this.state
    const pages = Taro.getCurrentPages()
    const prevPage = pages[pages.length - 2]
    const prevComponent = prevPage.$component || {}
    isFunction(prevComponent.goBackCll) && prevComponent.goBackCll(remark)
    Taro.navigateBack()
  }

  render() {
    const { remark } = this.state
    return (
      <View className='order-remark-wrap'>
        <View className="remark-wrap">
                    <Textarea autoFocus
                              placeholder={'请填写您的备注要求(最多50字)'}
                              showConfirmBar={false}
                              maxlength={50}
                              value={remark}
                              className="text-area"
                              onInput={this.onInputRemark.bind(this)}
                              placeholderStyle={'color:#C3C2C2;font-size:13px'}
                              cursorSpacing={100}
                    />
        </View>

        <Button className="confirm-btn"
                hoverClass="hover"
                onClick={this.submitRemark.bind(this)}
        >
          确认
        </Button>
      </View>
    )
  }
}

