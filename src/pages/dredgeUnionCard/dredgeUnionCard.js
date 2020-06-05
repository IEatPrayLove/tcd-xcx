import Taro from '@tarojs/taro'
import {
  View, Image, Text, Button
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import {
  AtIcon, AtButton, AtModal, AtModalContent, AtActionSheet
} from 'taro-ui'
import './dredgeUnionCard.scss'
import IconFont from '../../components/IconFont/IconFont'
import {
  getUserDetail,
  getServerPic,
  showLoading,
  hideLoading,
  showToast,
  navToPage,
  saveUserDetail,
  getShareInfo,
  getUserDistributor,
  setUserDistributor,
  objNotNull,
  judgeLegendsCard,
  setBuyCard,
  getBuyCard,
  getAuthenticate 
} from '../../utils/utils'
import {
  APP_ID,
  PLATFORM_ID,
  STATIC_IMG_URL 
} from '../../config/baseUrl'
import {
  PAY_WECHAT, PAY_BALANCE
} from '../../config/config'
const dayjs = require('dayjs')

@connect(({ 
  legendsCard: { legendsCardInfo, limitLegendsCardPrice }, 
  loading: { effects } 
}) => ({
  effects, legendsCardInfo, limitLegendsCardPrice, 
}))
export default class dredgeUnionCard extends Taro.PureComponent {
  config = {
    navigationBarTitleText: '会员卡',
    navigationBarBackgroundColor: '#E5BB95',
    navigationBarTextStyle: 'white'
  }

  constructor() {
    super()
    this.state = {
      modalVisible: false,
      isWechat: true,
      userInfo: getUserDetail(),
      limitPrice: 0,
      legendsCardInfo: {},
      insufficient: true,
      balance: getUserDetail().amount,
      balancePayModal: false,
      tcdReturnMoney: 0,
      isRenew: false,
      memberEndTime: '',
      isLogin: true,
      rightsList: [
        'card_right1.png',
        'card_right2.png',
        'card_right3.png',
        'card_right4.png',
        'card_right5.png',
        'card_right6.png',
      ],
      payVisible: false
    }
  }

  componentWillMount() {
    
  }

  componentDidShow() {
    const isLogin = getAuthenticate()
    const { islandUserMemberDTO, id } = getUserDetail()
    const { dispatch } = this.props
    const { balance } = this.state
    if (isLogin) {
      dispatch({
        type: 'legendsCard/getLegendsCardMoneyAction',
        callback: ({ ok, data }) => {
          if (ok) {
            this.setState({
              limitPrice: data,
              insufficient: data > balance
            })
          }
        }
      })
      dispatch({
        type: 'legendsCard/getLegendsCardInfoAction',
        callback: ({ ok, data }) => {
          if (ok) {
            this.setState({
              legendsCardInfo: data
            })
          }
        }
      })
      dispatch({
        type: 'distributor/distributorAllLevelAction',
        callback: ({ ok, data }) => {
          if (ok && data) {
            this.setState({
              tcdReturnMoney: data[0].tcCardCashBack
            })
          }
        }
      })
      if (judgeLegendsCard(islandUserMemberDTO)) {
        this.setState({
          isRenew: true
        })
        dispatch({
          type: 'legendsCard/getUserLegendsCardInfoAction',
          payload: {
            userId: id
          },
          callback: ({ ok, data }) => {
            console.log(data)
            if (ok && data.memberEndTime) {
              this.setState({
                memberEndTime: data.memberEndTime
              })
            }
          }
        })
      }
      this.setState({
        userInfo: getUserDetail()
      })
    }
    this.setState({
      isLogin: !!isLogin,
      payVisible: false
    })
  }

  submitOrder = wxCode => {
    const { dispatch } = this.props
    const { userInfo: { id }, limitPrice, isWechat } = this.state
    const { code: partnerCode } = getUserDistributor()
    const { code: shareCode } = getShareInfo()
    console.log('用户分享信息', getUserDistributor())
    console.log('用户自己的分享code', partnerCode)
    console.log('分享参数', getShareInfo())
    let code = ''
    if (partnerCode) {
      code = partnerCode
    } else if (shareCode) {
      code = shareCode
    }
    console.log('会员卡分享参数', code)
    dispatch({
      type: 'legendsCard/buyLegendsCardAction',
      payload: {
        amount: limitPrice,
        code,
        platformId: PLATFORM_ID,
        userId: id,
        paymentChannels: isWechat ? PAY_WECHAT : PAY_BALANCE
      },
      callback: ({ ok, data }) => {
        if (ok) {
          const newOrder = data
          if (!newOrder.payUrl) {
            hideLoading()
            this.paySuccess()
            if (this.state.isRenew) {
              Taro.switchTab({ url: '/pages/distributorIndex/distributorIndex' })
              return
            }
            this.setState({
              balancePayModal: false, //
              modalVisible: true
            })
            // hideLoading(showToast('支付地址获取失败'))
            return
          }
          const tradeNo = newOrder.payUrl.match(/(\d{32})/ig)[0]
          // 获取预交易单
          dispatch({
            type: 'legendsCard/getPrepayAction',
            payload: {
              tradeNo,
              wxCode,
              appId: APP_ID
            },
            callback: res => {
              hideLoading()

              if(!res.data.payInfo){
                showToast('支付唤起错误,请稍后重试...')
                return
              }

              if (res.ok && res.data.payInfo) {


                const payInfo = JSON.parse(res.data.payInfo)
                const root = this
                Taro.requestPayment(
                  {
                    timeStamp: payInfo.timeStamp,
                    nonceStr: payInfo.nonceStr,
                    package: payInfo.package,
                    signType: 'MD5',
                    paySign: payInfo.paySign,
                    success(resPay) {
                      hideLoading()
                      root.paySuccess()
                      if (root.state.isRenew) {
                        Taro.switchTab({ url: '/pages/distributorIndex/distributorIndex' })
                        return
                      }
                      root.setState({
                        modalVisible: true
                      })
                    }
                  }
                )
              } else {
                hideLoading()
              }
            }
          })
        }
      }
    })
  }

  paySuccess = () => {
    const { dispatch } = this.props
    const { isWechat } = this.state
    const userInfo = getUserDetail()
    setBuyCard()
    dispatch({
      type: 'legendsCard/getUserLegendsCardInfoAction',
      payload: {
        userId: userInfo.id
      },
      callback: ({ ok, data }) => {
        if (ok) {
          saveUserDetail({ ...userInfo, islandUserMemberDTO: data })
        }
      }
    })
    dispatch({
      type: 'mine/getDistributorByPlatformAction',
      callback: ({ ok, data }) => {
        if (ok && objNotNull(data)) {
          setUserDistributor(data)
        }
      }
    })
    if (!isWechat) {
      // 刷新余额信息
      dispatch({
        type: 'mine/getUserMemberInfoAction',
        callback: ({ ok, data }) => {
          if (ok) {
            const {
              amount
            } = data
            saveUserDetail({
              ...userInfo,
              amount
            })
          }
        }
      })
    }
    this.setState({
      payVisible: false,
      modalVisible: true
    })
  }

  getUserInfo = userInfo => {
    const root = this
    if (userInfo.detail.userInfo) { // 同意
      showLoading('支付中..', true)
      this.setState({
        balancePayModal: false
      })
      Taro.login({
        success(res) {
          root.submitOrder(res.code)
        }
      })
    } else { // 拒绝,保持当前页面，直到同意
      hideLoading()
    }
  }

  balancePay = () => {
    const { insufficient, balance } = this.state
    if (insufficient || !balance) return
    this.setState({
      isWechat: false,
      // payVisible: false
    })
  }

  render() {
    const {
      modalVisible, isWechat, insufficient,
      userInfo: { headPic, nickName, phone },
      limitPrice, legendsCardInfo: { price, name},
      balance, balancePayModal, tcdReturnMoney,
      isRenew, memberEndTime, isLogin, rightsList, payVisible
    } = this.state
    const { effects = {} } = this.props
    return (
      <View className="dredgeBox">
        {
          !isLogin && (
            <View className="notLogin flex-col flex-ac flex-jc">
              <Image src={`${STATIC_IMG_URL}/treasury_log.png`} />
              <Text>您还没有登录,快去登录吧~</Text>
              <View onClick={() => { Taro.navigateTo({ url: '/pages/login/login' }) }}>登录</View>
            </View>
          )
        }
        <View className="dredgeHeader">
          <View className="dredgeHeadImg flex-sk">
            <Image src={getServerPic(headPic)} />
          </View>
          <View className="dredgeRight ">
            <View className="dredgeRightTitle flex-row flex-ac">
              <Text className="ellipsis userName">{nickName}</Text>
              <Text className="dredgeRightPhone">{`（${phone}）`}</Text>
            </View>
            {
              isRenew && <View className="dredgeWord">{dayjs(memberEndTime).format('YYYY-MM-DD')}到期</View>
            }
          </View>
        </View>
        <View className="dredgeBody">
          <View className="dredgeBodyHeader">
            <View className="dredgeBodyHeaderCard">
              <View className="headerCardTitle">{name}</View>
              <View className="headerTip">专享特权，预计每年可省2541元</View>
              <View className="headerCardMoney">
                <View className="headerCardUint">￥</View>
                <View className="headerCardNum">{limitPrice}</View>
                <View className="headerPrice">
                  <View className="priceTip">限时</View>
                  <View className="originalPrice">{price}</View>
                </View>
                <View className="headerCardTip">尊享会员卡100享特权</View>
              </View>
              <View className="headerCardRightTip">年卡</View>
            </View>
          </View>
          <View className="cardRightsBox flex-row flex-sb flex-wrap">
            {
              rightsList && rightsList.map((item, index) => <Image src={`${STATIC_IMG_URL}/${item}`} />)
            }
          </View>
          <View 
            className="confirmBtn"
            onClick={() => {
              this.setState({
                payVisible: true
              })
            }}
          >
            ￥
            {limitPrice}
            {
              !isRenew ? '立即开通' : '立即续费'
            }
          </View>
          <View className="agreement" onClick={() => navToPage('/pages/agreement/agreement')}>会员服务协议</View>
        </View>
        <AtActionSheet
          isOpened={payVisible}
          onClose={() => {
            this.setState({
              payVisible: false
            })
          }}
        >
          <View className="dredgeBodyPay">
            <View
              className="dredgeBodyPayItem"
              onClick={this.balancePay}
            >
              <View className="dredgeBodyPayItemWay">
                <IconFont value="imgPayPacket" w="38" h="43" />
                <Text className={`dredgeBodyPayItemWord ${(insufficient || !balance) && 'insufficient'}`}>{`会员余额支付（余额￥${balance || 0}）`}</Text>
              </View>
              {
                insufficient && (<Text className="insufficient">余额不足</Text>)
              }
              {
                !isWechat && <AtIcon value="check" size="18" color="#FF633D" />
              }
            </View>
            <View className="dredgeBodyPayLine" />
            <View
              className="dredgeBodyPayItem"
              onClick={() => {
                this.setState({
                  isWechat: true
                })
              }}
            >
              <View className="dredgeBodyPayItemWay">
                <IconFont value="imgPayWechat" w="38" h="43" />
                <Text className="dredgeBodyPayItemWord">微信支付</Text>
              </View>
              {
                isWechat && <AtIcon value="check" size="18" color="#FF633D" />
              }
            </View>
          </View>
          {
            isWechat ? (
              <AtButton
                className="payBtn"
                onGetUserInfo={this.getUserInfo}
                openType="getUserInfo"
              >
                {`微信支付￥${limitPrice}`}
              </AtButton>
            ) : (
              <AtButton
                className="payBtn"
                onClick={() => {
                  this.setState({
                    balancePayModal: true,
                    payVisible: false
                  })
                }}
              >
                {`余额支付￥${limitPrice}`}
              </AtButton>
            )
          }
        </AtActionSheet>

        {/* 开通成功 */}
        {
          modalVisible && (
          <View className="dredgeSuccessMask">
            <View className="dredgeSuccessBody">
              <View className="dredgeSuccessTitle">恭喜您</View>
              <View className="dredgeSuccessTitle">
                {
                  !isRenew ? '已开通会员卡' : '续费成功'
                }
              </View>
              {
                tcdReturnMoney && (
                  <View className="dredgeSuccessWord">
                    {`邀请好友获现金，每邀1人得${tcdReturnMoney}元邀请${Math.ceil(limitPrice / tcdReturnMoney)}位即可抵消会员卡金额`}
                  </View>
                )
              }
              <View
                className="dredgeSuccessBtn"
                onClick={() => {
                  Taro.switchTab({ url: '/pages/distributorIndex/distributorIndex' })
                  this.setState({
                    modalVisible: false
                  })
                }}
              >
                立即分享赚现金
              </View>
              <AtIcon
                className="dredgeSuccessClose"
                value="close-circle"
                size="40"
                color="#fff"
                onClick={() => {
                  Taro.switchTab({ url: '/pages/distributorIndex/distributorIndex' })
                  this.setState({
                    modalVisible: false
                  })
                }}
              />
            </View>
          </View>
          )
        }
        {/* 余额支付弹窗 */}
        <AtModal isOpened={balancePayModal}>
          <AtModalContent>
            <View className="modalClose">
              <AtIcon
                value="close-circle"
                size="20"
                color="#BFBFBF"
                onClick={() => {
                  this.setState({
                    balancePayModal: false
                  })
                }}
              />
            </View>
            <View className="payModalTitle">余额零钱支付</View>
            <View className="payMoney">
              <Text className="payUnit">￥</Text>
              <Text className="payMoneyNum">
                {' '}
                {limitPrice}
              </Text>
            </View>
            <Button
              className="comfirmPay"
              open-type="getUserInfo"
              disabled={effects['orderConfirm/saveShopOrderAction']}
              onGetUserInfo={this.getUserInfo}
              loading={effects['legendsCard/buyLegendsCardAction']}
            >
              确认支付
            </Button>
          </AtModalContent>
        </AtModal>
      </View>
    )
  }
}
