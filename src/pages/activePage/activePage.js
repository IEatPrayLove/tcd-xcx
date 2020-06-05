import Taro, { PureComponent } from '@tarojs/taro'
import { WebView } from '@tarojs/components'
import { connect } from '@tarojs/redux'

import {
  ACTIVE_URL, PLATFORM_ID, SERVER_IP
} from '../../config/baseUrl'
import { getUserDetail, encodeURIObj } from '../../utils/utils'

const { onfire } = Taro.getApp()
@connect(({ common, loading }) => ({
  platFormSettings: common.platFormSettings,
  ajaxLoading: loading
}))
export default class ActivePage extends PureComponent {
  config = {
    navigationBarTitleText: '加载中...',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      baseUrl: '',
      from: ''
    }
  }

  componentWillMount() {
    const { page } = this.$router.params
    const { dispatch } = this.props
    // 获取用户达人认证信息
    dispatch({
      type: 'mine/getTalentInfoAction'
    })
    // 获取用户消费订单、权益卡券、宣传任务数量
    dispatch({
      type: 'common/getPlatFormSystemSettingByIdAction',
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            from: page
          })
          if (page === 'account') {
            const { weappUserId } = getUserDetail()
            // const encode = encodeURIObj(`http://test.canyingdongli.com/uaa/api/get-the-openId-and-save?platformId=${PLATFORM_ID}&userId=${weappUserId}`)
            this.setState({
              // baseUrl: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx49b72696409fd41b&redirect_uri=http%3a%2f%2ftest.canyingdongli.com%2fuaa%2fapi%2fget-the-openId-and-save%3fplatformId%3d${PLATFORM_ID}%26userId%3d${weappUserId}&response_type=code&scope=snsapi_userinfo&state=1&connect_redirect=1#wechat_redirect`
              baseUrl: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${data.publicAccountAppId}&redirect_uri=https%3a%2f%2f${SERVER_IP}%2fuaa%2fapi%2fget-the-openId-and-save%3fplatformId%3d${PLATFORM_ID}%26userId%3d${weappUserId}&response_type=code&scope=snsapi_userinfo&state=1&connect_redirect=1#wechat_redirect`
            })
          } else {
            this.setState({
              baseUrl: `${ACTIVE_URL}?site=talent`
            })
          }
        }
      }
    })
  }

  onMessage = e => {
    console.log(e)
    const { from } = this.state
    const { detail: { data } } = e
    if (from === 'account' && data && data[0] === 'Official_Accounts_Back') {
      onfire.fire('WebViewMessage', true)
    }
  }

  render() {
    const { baseUrl } = this.state
    return (
      <WebView onMessage={this.onMessage} src={baseUrl} />
      // <WebView onMessage={this.onMessage} src="http://127.0.0.1:10086/#/pages/notConcern/notConcern" />
      // <WebView onMessage={this.onMessage} src="http://127.0.0.1:10086/index.html?site=talent" />
    )
  }
}
