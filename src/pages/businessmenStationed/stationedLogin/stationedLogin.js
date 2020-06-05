import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Input
} from '@tarojs/components'
import './stationedLogin.scss'
import { connect } from '@tarojs/redux'
import { navToPage } from '../../../utils/utils'
import Base64 from '../../../utils/Base64'

@connect(({ businessmenStationed }) => ({}))
export default class stationedLogin extends PureComponent {
  config = {
    navigationBarTitleText: '商家入驻'
  }

  constructor() {
    super()
    this.state = {
      popupVisible: false,
      phoneNum: '',
      password: '',
      userId: ''
    }
  }

  fakeAccountLoginAction = () => {
    const { phoneNum, password } = this.state
    this.props.dispatch({
      type: 'businessmenStationed/fakeAccountLoginAction',
      payload: {
        grant_type: 'password',
        username: phoneNum,
        password
      },
      callback: ({ ok, data }) => {
        if (ok) {
          const baseToken = Base64.decode(data.access_token.split('.')[1])
          const userId = baseToken.match(/"id":(\d+)/i)[1]
          Taro.setStorage({
            key: 'userId',
            data: userId
          }).then(res => {
            this.decideSkipAction()
          })
          Taro.setStorage({
            key: 'loginToken',
            data: data.access_token
          })
        }
      }
    })
  }

  decideSkipAction = () => {
    Taro.getStorage({
      key: 'userId'
    }).then(res => {
      this.setState({
        userId: res.data
      }, () => {
        this.props.dispatch({
          type: 'businessmenStationed/decideSkipAction',
          payload: {
            userId: this.state.userId
          },
          callback: ({ ok, data }) => {
            if (ok) {
              if (data === 1) { // 存在购买平台
                this.setState({
                  popupVisible: true
                })
              } else if (data === 2 || data === 3) { // 游客已经申请入驻成功
                Taro.redirectTo({ url: '/pages/businessmenStationed/stationedRecord/stationedRecord' })
              } else if (data === 4) {
                navToPage('/pages/businessmenStationed/stationedSetting/stationedSetting')
              }
            }
          }
        })
      })
    })
  }

  render() {
    const { popupVisible, phoneNum, password } = this.state
    return (
      <View className="loginBox">
        <View className="loginHeader">平台登录</View>
        <View className="loginForm">
          <View className="loginFormItem">
            <Input
              placeholder-class="setInputStyle"
              placeholder="请输入手机号"
              value={phoneNum}
              onInput={e => {
                this.setState({
                  phoneNum: e.detail.value
                })
              }}
            />
          </View>
          <View className="loginFormItem">
            <Input
              placeholder-class="setInputStyle"
              placeholder="请输入密码"
              type="password"
              style={{ width: '100%' }}
              value={password}
              onInput={e => {
                this.setState({
                  password: e.detail.value
                })
              }}
            />
          </View>
          <View
            className="loginFormBtn"
            onClick={() => {
              this.fakeAccountLoginAction()
            }}
          >
            登录
          </View>
          <View
            className="loginFormBtnGhost"
            onClick={() => {
              navToPage('/pages/businessmenStationed/stationedRegister/stationedRegister')
            }}
          >
            没有账号，立即注册
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
                    }, () => {
                      navToPage('/pages/businessmenStationed/stationedRegister/stationedRegister')
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
