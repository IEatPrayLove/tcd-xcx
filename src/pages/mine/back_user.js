import Taro, { Component } from '@tarojs/taro'
import { Button, Image, View } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import './user.scss'
import {
  formatAttachPath,
  formatPhone,
  getPlatFormId,
  getUserInfo,
  hideLoading,
  navToPage,
  needLogin,
  objNotNull,
  readPartner,
  saveAuthenticate,
  saveUserInfo,
  showLoading
} from '../../utils/utils'
import {
  KEY_ALL,
  KEY_DELIVERY,
  KEY_MERCHANT_USER,
  KEY_ORDER_FINISH,
  KEY_ORDER_REFUND,
  KEY_ORDER_TIMEOUT
} from '../../config/config'

/**
 * 美食页面
 */
  // @authenticate
@connect(({ loading, order, common }) => ({
  orderAccount: order.orderAccount,
  currentUserAccount: common.currentUserAccount
}))
class BackUser extends Component {

  config = {
    navigationBarTitleText: '我的'
  }

  constructor() {
    super()
    this.state = {
      userInfo: {}
    }
  }

  componentWillMount() {
  }

  componentDidMount() {
    console.log('show....')
  }

  componentDidShow() {
    getUserInfo(res => {
      this.setState({ userInfo: res.data })
      if (objNotNull(res.data)) {
        this.loadAccountInfo()
      }
    })
    this.loadOrderAccount()
  }

  //获取当前用户账户信息
  loadAccountInfo = () => {
    // 获取当前用户信息
    this.props.dispatch({
      type: 'common/getCurrentUserAction',
      callback: ({ ok, data }) => {

      }
    })
  }

  //判断是否是合伙人
  loadIsPartner = () => {
    this.props.dispatch({
      type: 'common/isPartnerAction',
      payload: { brandId: getPlatFormId() }
    })
  }

  //加载订单统计
  loadOrderAccount = () => {
    const platformId = getPlatFormId()
    if (!platformId) {
      return
    }
    showLoading()
    this.props.dispatch({
      type: 'order/orderAccountAction',
      payload: { platformId: platformId },
      callback: () => {
        hideLoading()
      }
    })
  }

  //跳转到相应设置页面
  onNavigateSetPage = (url) => {
    navToPage(url)
  }

  //我的订单页面
  onClickMyOrder = (key) => {
    navToPage(`/pages/order/order?key=${key}`)
  }

  //跳转合伙人邀请专题
  goDistributorTopic = () => {
    if (!needLogin('distributor')) return
    navToPage(`/pages/distributor/distributor?platId=${getPlatFormId()}`, false)
  }

  goLogin = () => {
    navToPage('/pages/login/login')
  }

  /**
   * 用户退出
   */
  userLogout = () => {
    Taro.showModal({ title: '是否确认退出账号？' })
      .then(res => {
        if (res.confirm) {
          saveUserInfo(null)
          saveAuthenticate(null)
          // savePartner(null)
          // savePartnerReward(null)
          // savePartnerRankInfo(null)
          Taro.switchTab({ url: `/pages/index/index` })
        }
      })
  }

  render() {
    const {
      orderAccount = {},
      currentUserAccount = {}
    } = this.props

    const {
      userInfo = {}
    } = this.state


    // console.log(currentUserAccount);

    return (
      <View className='user-wrap'>
        <View className="flex-row user-banner">
          <View className="flex-row flex-ac flex-jc avatar-wrap ">
            <Image className="avatar"
                   src={objNotNull(userInfo) && userInfo.avatarUrl ? formatAttachPath(userInfo.avatarUrl) : require('../../images/user_avatar.png')}
            />
          </View>
          <View className="flex-col flex1 flex-jc right">
            {
              objNotNull(userInfo) ?
                <Block>
                  <View className="flex-row flex-ac ellipsis name">
                    <Text className="text">{userInfo.nickName}</Text>
                    {
                      objNotNull(readPartner()) &&
                      <Text className="partner-icon"/>
                    }
                  </View>
                  <View
                    className="phone">{currentUserAccount.login ? formatPhone(currentUserAccount.login) : '--'}</View>
                </Block>
                :
                <Block>
                  <Text className="login-text" onClick={this.goLogin.bind(this)}>登录/注册</Text>
                  <Text className="slogan">让您从此惠生活</Text>
                </Block>
            }

          </View>
          <Button className="flex-col flex-sb partner-wrap"
                  onClick={this.goDistributorTopic.bind(this)}
          >
            <View className="text">合伙人</View>
            <View className="btns">GO ></View>
          </Button>
        </View>

        <View className="my-order">
          <View className="my-order-inwrap">
            <View className="flex-row flex-ac flex-sb header"
                  onClick={this.onClickMyOrder.bind(this, KEY_ALL)}
            >
              <Text className="title">我的订单</Text>
              <View className="flex-row flex-ac all">
                <Text>查看全部</Text>
                <Text className="icon icon-arrow-right"/>
              </View>
            </View>
            <View className="flex-row flex-sb oder-items">
              <View className="flex1 item btn1"
                    onClick={this.onClickMyOrder.bind(this, KEY_MERCHANT_USER)}
              >
                <View className="name">门店使用</View>
                {
                  orderAccount.toTheStoreCount > 0 &&
                  <View className="dot">{orderAccount.toTheStoreCount}</View>
                }
              </View>
              <View className="flex1 item btn2"
                    onClick={this.onClickMyOrder.bind(this, KEY_DELIVERY)}
              >
                <View className="name">配送到家</View>
                {
                  orderAccount.deliveryToHomeCount > 0 &&
                  <View className="dot">{orderAccount.deliveryToHomeCount}</View>
                }
              </View>
              <View className="flex1 item btn3"
                    onClick={this.onClickMyOrder.bind(this, KEY_ORDER_FINISH)}
              >
                <View className="name">已完成</View>
              </View>
              <View className="flex1 item btn4 hide"
                    onClick={this.onClickMyOrder.bind(this, KEY_ORDER_REFUND)}
              >
                <View className="name">退款</View>
              </View>
              <View className="flex1 item btn5"
                    onClick={this.onClickMyOrder.bind(this, KEY_ORDER_TIMEOUT)}
              >
                <View className="name">无效订单</View>
              </View>
            </View>
          </View>
        </View>

        <View className="ad-img-wrap" onClick={this.goDistributorTopic.bind(this)}>
          <Image className="ad-img"
                 mode='aspectFill'
                 src={require('../../images/user_ad_def.png')}
          />
        </View>

        <View className="set-list">
          <Button className="item"
                  hoverClass="item-hover"
                  onClick={this.onNavigateSetPage.bind(this, '/pages/userRedPackage/userRedPackage')}
          >
            <View className="flex-row flex-ac flex-sb item-in">
              <View className="set-icon coupon"/>
              <View className="flex1 title">优惠券</View>
              <View className="arrow"/>
            </View>
          </Button>
          <Button className="item"
                  hoverClass="item-hover"
                  onClick={this.onNavigateSetPage.bind(this, '/package/userAddress/userAddress')}
          >
            <View className="flex-row flex-ac flex-sb item-in">
              <View className="set-icon location"/>
              <View className="flex1 title">地址管理</View>
              <View className="arrow"/>
            </View>
          </Button>
        </View>
        {
          objNotNull(userInfo) &&
          <Button className="login-out"
                  hoverClass="login-out-hover"
                  onClick={this.userLogout.bind(this)}
                  disabled={!objNotNull(userInfo)}
          >
            {!objNotNull(userInfo) ? '已退出' : '退出登录'}
          </Button>
        }
      </View>
    )
  }
}

export default Back_user

