import Taro, { Component } from '@tarojs/taro'
import {
  Block, Input, View, Text
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import './modifyPassWord.scss'
import IconFont from '../../../components/IconFont/IconFont'
import { PLATFORM_ID } from '../../../config/baseUrl'
import { showToast } from '../../../utils/utils'

@connect(() => ({}))
export default class ModifyPassWord extends Component {
  config = {
    navigationBarTitleText: '修改密码',
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#ffffff'
  }

  state = {
    animationData: {},
    notShowPassword: true,
    inputValue: ''
  }

  componentDidMount() {
    const animation = Taro.createAnimation({
      duration: 500,
      timingFunction: 'ease'
    })
    this.animation = animation
  }

  nextStep = () => {
    const { dispatch } = this.props
    const { inputValue } = this.state
    if (!inputValue) {
      showToast('请输入密码')
      return
    }
    dispatch({
      type: 'storedMoney/verifyStoredPasswordAction',
      payload: {
        password: inputValue,
        platformId: PLATFORM_ID
      },
      callback: ({ ok, data }) => {
        if (ok && data) {
          this.animation.left('-100%').step()
          this.setState({
            animationData: this.animation.export(),
            inputValue: ''
          })
        } else {
          showToast('密码错误！请重新输入')
        }
      }
    })
  }

  showPassword = () => {
    this.setState(prev => ({
      notShowPassword: !prev.notShowPassword
    }))
  }

  inputPassword = ({ detail: { value } }) => {
    this.setState({
      inputValue: value
    })
  }

  confirmModify = () => {
    const { dispatch } = this.props
    const { inputValue } = this.state
    if (!inputValue) {
      showToast('请输入密码')
      return
    }
    dispatch({
      type: 'storedMoney/modifyStoredPasswordAction',
      payload: {
        password: inputValue,
        platformId: PLATFORM_ID
      },
      callback: ({ ok, data }) => {
        if (ok) {
          Taro.navigateBack()
        } else {
          showToast('修改密码失败！请重试')
        }
      }
    })
  }

  render() {
    const {
      animationData, notShowPassword, inputValue
    } = this.state
    return (
      <View className="container" animation={animationData}>
        <View className="confirmPassword">
          <View className="inputSection flex-row flex-ac">
            <Input
              className="inputPassWord flex1"
              placeholder="请输入旧的支付密码"
              password={notShowPassword}
              value={inputValue}
              onInput={this.inputPassword}
            />
            <IconFont
              value={notShowPassword ? 'imgStoredView' : 'imgStoredNotView'}
              onClick={this.showPassword}
              w={42}
              h={28}
            />
          </View>
          <View className="prompt">密码输入错误请重新输入</View>
          <View
            className="next"
            onClick={this.nextStep}
          >
            下一步
          </View>
        </View>
        <View className="modifyPassword">
          <View className="inputSection flex-row flex-ac">
            <Input
              className="inputPassWord flex1"
              placeholder="请输入新的支付密码"
              password={notShowPassword}
              value={inputValue}
              onInput={this.inputPassword}
            />
            <IconFont
              value={notShowPassword ? 'imgStoredView' : 'imgStoredNotView'}
              onClick={this.showPassword}
              w={42}
              h={28}
            />
          </View>
          <View
            className="next"
            onClick={this.confirmModify}
          >
            确认修改
          </View>
        </View>
      </View>
    )
  }
}
