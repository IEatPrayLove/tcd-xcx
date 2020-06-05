import Taro, { Component } from '@tarojs/taro'
import {
  Button, View, OpenData, Image,
  Text
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import {
  AtModal, AtModalContent, AtMessage, AtModalAction,
  AtCurtain
} from 'taro-ui'
import {
  formatAttachPath,
  getPlatFormId,
  hideLoading,
  saveAuthenticate,
  savePartner,
  savePartnerCode,
  savePartnerRankInfo,
  savePartnerReward,
  saveUserInfo,
  showLoading,
  showToast,
  getUserInfo,
  saveUserDetail, getUserDetail, getAuthenticate, objNotNull, setUserDistributor, getShareInfo
} from '../../utils/utils'

import './login.scss'
import { APP_ID, UPLOAD_URL } from '../../config/baseUrl'

@connect(({ common, loading }) => ({
  userInfo: common.userInfo,
  // platFormSettings: common.platFormSettings,
  ajaxLoading: loading
}))
class Login extends Component {
  config = {
    navigationBarTitleText: '平台登录',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      loading: false,
      signUp: false,
      signUpLoading: false,
      platFormSettings: {}
    }
  }

  componentWillPreload() {
    const { dispatch } = this.props
    dispatch({
      type: 'common/getPlatFormSystemSettingByIdAction',
      payload: { id: getPlatFormId() },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            platFormSettings: data // 接口返回为数组
          })
          Taro.setNavigationBarTitle({ title: data.appName })
        }
      }
    })
  }

  componentDidMount() {
    // 获取平台系统设置信息
    // this.props.dispatch()
  }

  getUserInfo = userInfo => {
    this.setState({ loading: true })
    if (userInfo.detail.userInfo) { // 同意
      saveUserInfo(userInfo.detail.userInfo)
      this.weAppLogin()
    } else { // 拒绝,保持当前页面，直到同意
      this.setState({ loading: false })
    }
  }

  // 获取用户分享信息
  getUserDistributorInfo = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'mine/getDistributorByPlatformAction',
      callback: ({ ok, data }) => {
        if (ok && objNotNull(data)) {
          setUserDistributor(data)
        }
      }
    })
  }

  weAppLogin = newData => {
    const root = this
    Taro.login({
      success(res) {
        // this.weAppLogin(res, userInfo.detail.userInfo)
        if (res.code) {
          // 发起网络请求
          console.log('登录参数:')
          console.log({
            username: res.code,
            loginType: 'weApp',
            grant_type: 'password',
            appId: APP_ID
          })
          console.log('******************')
          root.props.dispatch({
            type: 'common/weAppLoginAction',
            payload: {
              username: res.code,
              loginType: 'weApp',
              grant_type: 'password',
              appId: APP_ID
            },
            callback: res => {
              root.setState({
                loading: false,
                signUpLoading: false
              })
              if (res.statusCode !== 200) {
                root.setState({
                  signUp: true
                })
                Taro.atMessage({
                  type: 'info',
                  message: '请注册!'
                })
              } else {
                const { nickName, avatarUrl: headPic } = getUserInfo()
                console.log('登录接口返回', res.data)
                saveAuthenticate(res.data, () => {
                  root.props.dispatch({
                    type: 'mine/judgeIslandUserAction',
                    payload: {
                      headPic,
                      nickName
                    },
                    callback: ({ ok, data }) => {
                      console.log('用户信息是否成功', true)
                      console.log('获取用户信息', data)
                      if (ok) {
                        saveUserDetail(data)
                        if (newData && newData === 'new') {
                          Taro.setStorage({ key: 'isNewUser', data: 'new' })
                          Taro.switchTab({ url: '/pages/mine/mine' })
                        } else {
                          Taro.navigateBack()
                        }
                      } else {
                        Taro.atMessage({
                          message: '登录失败，请重试！',
                          type: 'error'
                        })
                      }
                    }
                  })
                  root.getUserDistributorInfo()
                })
              }
            }
          })
        } else {
          Taro.showToast({ title: '登录失败~' })
        }
      },
      fail() {
        this.setState({
          loading: false,
          signUpLoading: false
        })
      },
      complete() {
      }
    })
  }

  /**
   * 获取手机号
   *
   * @param res
   */
  getPhoneNumber = res => {
    const root = this
    if (res.detail.encryptedData) {
      Taro.login({
        success(resCode) {
          root.bindWeAppUserAccount(res, resCode.code)
        }
      }, () => {
        
      })
    } else {
      Taro.atMessage({
        message: '获取手机号失败，请重试！',
        type: 'error'
      })
    }
  }

  /**
   * 创建并绑定账号
   *
   * @param res
   * @param code
   */
  bindWeAppUserAccount = (res, code) => {
    const userInfo = getUserInfo()
    // 发起网络请求
    // showLoading()
    this.setState({
      signUpLoading: true
    })
    const { code: partnerCode = '' } = getShareInfo()
    console.log('注册合伙人code:', partnerCode)
    console.log(typeof partnerCode)
    this.props.dispatch({
      type: 'common/bindWeAppAccountAction',
      payload: {
        encryptedData: res.detail.encryptedData,
        iv: res.detail.iv,
        code,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        sex: userInfo.gender,
        appId: APP_ID,
        partnerCode: partnerCode && partnerCode !== 'undefined' ? partnerCode : ''
      },
      callback: res => {
        // hideLoading()
        if (res.ok) {
          this.weAppLogin('new')
          // TODO 再次请求登陆
        } else {
          Taro.atMessage({
            message: '注册失败，请重试！',
            type: 'error'
          })
          this.setState({
            signUpLoading: false
          })
        }
      }
    })
  }

  render() {
    const {
      ajaxLoading
    } = this.props
    // const currentPlatSetting = platFormSettings.length > 0 && platFormSettings[0] || {} // TODO 暂时先取第一个平台 .filter(setting => setting.id === DEFAULT_PLAT_FORM_ID)
    const {
      loading, signUp, platFormSettings,
      signUpLoading
    } = this.state
    return (
      <View className="flex-col flex-ac login-wrap">
        <View className="flex-col flex-ac  merchant-wrap">
          <Image
            className="logo"
            src={platFormSettings.appLogo ? formatAttachPath(platFormSettings.appLogo) : ''}
          />
          <View className="name">{platFormSettings.appName}</View>
        </View>
        <Button
          className={`login-btn green ${loading && 'out-green'}`}
          hoverClass="hover"
          loading={loading}
          disabled={loading}
          open-type="getUserInfo"
          onGetUserInfo={this.getUserInfo}
        >
          微信登录
        </Button>
        <AtCurtain
          isOpened={signUp}
          // isOpened={true}
          onClose={() => {
            this.setState({
              signUp: false
            })
          }}
        >
          <View className="signUpModal">
            <Text>您目前还没有授权，快来授权吧</Text>
            <Button
              hoverClass="hover"
              open-type="getPhoneNumber"
              onGetPhoneNumber={this.getPhoneNumber}
              loading={signUpLoading}
            >
              立即授权
            </Button>
          </View>
        </AtCurtain>
        <AtMessage />
      </View>
    )
  }
}

export default Login
