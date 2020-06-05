import { Component } from '@tarojs/taro'
import { Button, View } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import {
  formatAttachPath,
  hideLoading,
  loginCompleteGo,
  navToPage,
  saveAuthenticate,
  saveLoginCompleteGo,
  showLoading,
  showToast
} from '../../utils/utils'

import './login.scss'
import { APP_ID } from '../../config/baseUrl'

@connect(({ common, index }) => ({
  userInfo: common.userInfo,
  platFormSettings: common.platFormSettings
}))
class Bind extends Component {
  config = {
    navigationBarTitleText: '快捷绑定',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
  }

  /**
   * 获取手机号
   *
   * @param res
   */
  getPhoneNumber = (res) => {
    const root = this
    if (res.detail) {
      wx.login({
        success(resCode) {
          root.bindWeAppUserAccount(res, resCode.code)
        }
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
    // 发起网络请求
    showLoading()
    this.props.dispatch({
      type: 'common/bindWeAppAccountAction',
      payload: {
        encryptedData: res.detail.encryptedData,
        iv: res.detail.iv,
        code: code,
        nickName: this.props.userInfo.nickName,
        avatarUrl: this.props.userInfo.avatarUrl,
        sex: this.props.userInfo.gender,
        appId: APP_ID
      },
      callback: (res) => {
        hideLoading()
        // 如果用户不存在 则跳转到绑定页面
        // console.log(res.ok);
        if (res.ok) {
          // TODO 再次请求登陆
          // navToPage('/pages/index/index');
          this.weAppUserLogin()
        } else {
          showToast('登录失败')
        }
      }
    })
  }

  /**
   * 再次拉取授权
   */
  weAppUserLogin = () => {
    const root = this
    showLoading()
    wx.login({
      success(resCode) {
        root.props.dispatch({
          type: 'common/weAppLoginAction',
          payload: {
            username: resCode.code,
            loginType: 'weApp',
            grant_type: 'password',
            appId: APP_ID
          },
          callback: (res) => {
            hideLoading()
            // 如果用户不存在 则跳转到绑定页面
            if (res.statusCode !== 200 && res.statusCode !== 201) {
              showToast('系统异常~')
            } else {
              saveAuthenticate(res.data)
              if (root.$router && root.$router.params && root.$router.params.page === 'distributor') {
                saveLoginCompleteGo('distributor')
              }
              // TODO 跳转到记忆页面
              loginCompleteGo(2)
              // Taro.navigateBack({delta: 2});
              // navToPage('/pages/user/user');
            }
          }
        })
      },
      complete(res) {
        hideLoading()
      }
    })
  }

  goMobileLogin = () => {
    navToPage(`/pages/login/phoneLogin?page=${this.$router.page}`, false)
  }

  render() {
    const {
      platFormSettings = []
    } = this.props
    const currentPlatSetting = platFormSettings.length > 0 && platFormSettings[0] || {} //.filter(setting => setting.id === DEFAULT_PLAT_FORM_ID)[0];

    return <View className="flex-col flex-ac login-wrap">
      <View className="merchant-wrap flex-col flex-ac" style={'margin-bottom:100px;'}>
        <Image className="logo"
               src={currentPlatSetting.logo ? formatAttachPath(currentPlatSetting.logo) : ''}
        />
        <View className="name">{currentPlatSetting.userName || '未知商户'}</View>
      </View>
      <Button className="login-btn green"
              hoverClass="hover"
              loading={false}
              open-type="getPhoneNumber" onGetPhoneNumber={this.getPhoneNumber}
      >
        微信登录
      </Button>
      <Button className="login-btn out-green"
              hoverClass="hover"
              loading={false}
              onClick={this.goMobileLogin}
      >
        手机号登陆/注册
      </Button>
    </View>
  }
}

export default Bind
