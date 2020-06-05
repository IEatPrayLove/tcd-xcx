import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Input
} from '@tarojs/components'
import './stationedRegister.scss'
import { AtMessage } from 'taro-ui'
import { connect } from '@tarojs/redux'
import { navToPage } from '../../../utils/utils'

@connect(({ businessmenStationed }) => ({}))
export default class stationedRegister extends PureComponent {
  config = {
    navigationBarTitleText: '商家入驻'
  }

  constructor() {
    super()
    this.state = {
      isCountdown: false,
      countdownTime: 60,
      popupVisible: false,
      phoneNum: '',
      phoneCode: '',
      passwordWord: ''
    }
  }

  // 手机正则表达式
  isPoneAvailable = poneInput => {
    const myreg = /^[1][3,4,5,6,7,8,9][0-9]{9}$/
    if (!myreg.test(poneInput)) {
      return false
    }
    return true
  }

  // 检查手机是否注册
  checkPhoneReg = () => {
    const { phoneNum } = this.state
    if (!phoneNum || !this.isPoneAvailable(phoneNum)) {
      Taro.atMessage({
        message: '请先输入正确的手机号码',
        type: 'error'
      })
    }
    this.props.dispatch({
      type: 'businessmenStationed/getPhoneRegAction',
      payload: phoneNum,
      callback: ({ ok, data }) => {
        if (ok) {
          this.sendUserMobileCodeAction(phoneNum)
        } else if (data.code === 500) {
          Taro.atMessage({
            message: data.message,
            type: 'error'
          })
        } else {
          Taro.atMessage({
            message: '未知错误',
            type: 'error'
          })
        }
      }
    })
  };

  // 获取验证码
  sendUserMobileCodeAction = phoneNum => {
    this.props.dispatch({
      type: 'businessmenStationed/sendUserMobileCodeAction',
      payload: phoneNum,
      callback: ({ ok, data }) => {
        if (ok) {
          this.countTime()
        }
      }
    })
  }

  // 验证码倒计时
  countTime = () => {
    const { countdownTime } = this.state
    this.setState({
      isCountdown: true,
      countdownTime: 60
    }, () => {
      let time = countdownTime
      const timeClock = setInterval(() => {
        time--
        this.setState({
          countdownTime: time
        })
        if (time === 0) {
          clearInterval(timeClock)
          this.setState({
            countdownTime: 60,
            isCountdown: false
          })
        }
      }, 1000)
    })
  }

  // 注册
  registerUserAction = () => {
    const { phoneNum, phoneCode, passwordWord } = this.state
    this.props.dispatch({
      type: 'businessmenStationed/registerUserAction',
      payload: {
        login: phoneNum,
        validateCode: phoneCode,
        password: passwordWord,
        authorities: ['ROLE_USER']
      },
      callback: ({ ok, data }) => {
        if (ok) {
          Taro.atMessage({
            message: '注册成功',
            type: 'success'
          })
          setTimeout(() => {
            navToPage('/pages/businessmenStationed/stationedLogin/stationedLogin')
          }, 2000)
        }
      }
    })
  }

  render() {
    const {
      isCountdown, countdownTime, popupVisible, phoneNum, phoneCode, passwordWord
    } = this.state
    return (
      <View className="loginBox">
        <AtMessage />
        <View className="loginHeader">平台入驻注册</View>
        <View className="loginForm">
          <View className="loginFormItem">
            <Input
              placeholder-class="setInputStyle"
              value={phoneNum}
              placeholder="请输入手机号"
              onInput={e => {
                this.setState({
                  phoneNum: e.detail.value
                })
              }}
            />
            <View className="loginItemRight">
              <View className="loginLine" />
              {
                !isCountdown && (
                <View
                  className="loginCodeBtn"
                  onClick={() => {
                    this.checkPhoneReg()
                  }}
                >
                  发送验证码
                </View>
                )
              }
              {
                isCountdown && (
                <View className="loginCodeBtn">
                  {countdownTime}
                  s
                </View>
                )
              }
            </View>
          </View>
          <View className="loginFormItem">
            <Input
              placeholder-class="setInputStyle"
              placeholder="验证码"
              value={phoneCode}
              onInput={e => {
                this.setState({
                  phoneCode: e.detail.value
                })
              }}
            />
          </View>
          <View className="loginFormItem">
            <Input
              placeholder-class="setInputStyle"
              placeholder="密码:6到16位，必须包含数字和字母"
              style={{ width: '100%' }}
              value={passwordWord}
              type="password"
              onInput={e => {
                this.setState({
                  passwordWord: e.detail.value
                })
              }}
            />
          </View>
          <View className="loginFormBtn" onClick={this.registerUserAction}>注册</View>
          <View
            className="loginFormBtnGhost"
            onClick={() => {
              navToPage('/pages/businessmenStationed/stationedLogin/stationedLogin')
            }}
          >
            已有账号，立即登录
          </View>
        </View>
        {
          popupVisible && (
          <View className="loginMask">
            <View className="loginPopupBox">
              <View className="loginPopupWord">您已经是赚餐商户请到赚餐后台点击入驻平台</View>
              <View
                className="loginPopupBtn"
                onClick={() => {
                  this.setState({
                    popupVisible: false
                  })
                }}
              >
                好的
              </View>
            </View>
          </View>
          )
        }
      </View>
    )
  }
}
