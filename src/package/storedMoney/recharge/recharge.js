import Taro, { Component } from '@tarojs/taro'
import {
  View, Text, Button, Block, Input
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
// import { AtActionSheet, AtIcon } from 'taro-ui'

import './recharge.scss'
import IconFont from '../../../components/IconFont/IconFont'
import {
  decodeURIObj,
  getUserDetail,
  showToast,
  hideLoading,
  getPlatFormId,
  showLoading,
  encodeURIObj,
  navToPage,
  getPlatFormInfo,
  formatCurrency, getUserLocation
} from '../../../utils/utils'
import {
  PAY_WECHAT, PAYMENT
} from '../../../config/config'
import { APP_ID, PLATFORM_ID } from '../../../config/baseUrl'
import Payment from '../../../components/Payment/Payment'

@connect(() => ({}))
export default class Index extends Component {
  config = {
    navigationBarTitleText: '充值金额',
    enablePullDownRefresh: true,
    backgroundTextStyle: 'dark'
  }

  state = {
    isShowInput: false,
    cardInfo: {},
    rechargeRule: [],
    inputValue: '',
    // curRechargeCard: {},
    // merchantId: '',
    chooseRule: {},
    payBoxVisible: false,
    payment: PAY_WECHAT,
    rechargeType: 0,
    merchant: {},
    systemColor: Taro.getStorageSync('systemColor')
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: '#ffffff'
    })
    this.loadMerchantList()
  }

  componentDidShow() {
    const cardInfo = decodeURIObj(this.$router.params.cardInfo)
    const { dispatch } = this.props
    const { systemManagementGuid, cardLevelName } = cardInfo
    const { enterpriseGuid } = getPlatFormInfo()
    dispatch({
      type: 'storedMoney/getCardRechargeRuleAction',
      payload: {
        systemManagementGuid,
        enterpriseGuid
      },
      callback: ({ ok, data }) => {
        if (ok) {
          const { allCardRechargeRules = [] } = data
          const ruleList = allCardRechargeRules.reduce((acc, cur) => {
            const { stepNunber, levelNameJson } = cur
            const curGrade = acc.find(({ grade }) => grade === stepNunber)
            if (curGrade) {
              return acc.map(ele => {
                if (ele.grade === stepNunber) {
                  return { ...ele, rule: [...ele.rule, cur] }
                }
                return ele
              })
            }
            return [...acc, {
              grade: stepNunber,
              gradeName: levelNameJson,
              rule: [cur]
            }]
          }, [])
          this.setState({
            cardInfo,
            rechargeRule: ruleList.filter(item => item.gradeName.split(',').includes(cardLevelName)),
            rechargeType: data.rechargeType
          })
        }
      }
    })
  }

  // 获取门店
  loadMerchantList = () => {
    const cardInfo = decodeURIObj(this.$router.params.cardInfo)
    const { systemManagementGuid } = cardInfo
    const { enterpriseGuid } = getPlatFormInfo()
    const { longitude, latitude } = getUserLocation()
    this.props.dispatch({
        type: 'merchant/getAllMerchantAction',
        payload: {
            page: 0,
            orderType: 2,
            size: 9999,
            outerOrderMod: 26,
            position: `${longitude},${latitude}`,
            platformId: PLATFORM_ID
        },
        callback: ({ ok, data }) => {
            if (ok && data && data.length) {
              // getRuleMerchantAction
              this.props.dispatch({
                type: 'storedMoney/getRuleMerchantAction',
                payload: {
                  systemManagementGuid,
                  enterpriseGuid
                },
                callback: res => {
                  const list = data.filter(item => res.data.storeGuid.includes(item.thirdNo))
                  const { merchantNo, id } = list[0]
                  this.setState({
                    merchant: list[0] || {},
                    merchantInfo: { merchantNo, merchantId: id }
                  })
                }
              })
            }
        }
    })
  }

  chooseRecharge = o => {
    const { guid } = o
    const { isShowInput, rechargeType } = this.state
    this.setState({
      isShowInput: isShowInput === guid ? '' : guid,
      inputValue: rechargeType === 1 ? '' : o.rechargeFull,
      // curRechargeCard: isShowInput === guid ? {} : o,
      chooseRule: o
    })
  }

  inputMoney = ({ target: { value } }) => {
    this.setState({
      inputValue: value - 0
    })
  }

  getUserInfo = userInfo => {
    const { inputValue } = this.state
    if (inputValue && inputValue > 0) {
      if (userInfo.detail.userInfo) { // 同意
        const root = this
        Taro.login({
          success(res) {
            // console.log(res);
            root.createOrder(res.code)
          }
        })
      }
    }
  }

  rechargeSuccess = () => {
    const { dispatch } = this.props
    const { enterpriseGuid } = getPlatFormInfo()
    const { phone } = getUserDetail()
    const { cardInfo } = this.state
    dispatch({
      type: 'storedMoney/getStoredCardForPhoneAction',
      payload: {
        platformId: PLATFORM_ID,
        enterpriseGuid,
        phone
      }
    })
    this.setState({
      inputValue: '',
      isShowInput: ''
    })
    navToPage(`/package/storedMoney/payResult/payResult?cardInfo=${encodeURIObj(cardInfo)}`)
  }

  createOrder = wxCode => {
    const {
      inputValue, noPreferential,
      salePrice, payment, confirmRedPackage, chooseRule,
      cardInfo: { memberInfoCardGuid }, merchantInfo
    } = this.state
    const _this = this
    showLoading('请求支付中...', true)
    this.props.dispatch({
      type: 'merchant/saveShopOrderAction',
      payload: {
        orderSource: 'HOLDER_CARD_RECHARGE',
        amount: inputValue,
        orderState: 'PENDING',
        orderType: 'HOLDER_CARD_RECHARGE',
        platformId: getPlatFormId(),
        printState: 'UNPRINT',
        couponSn: null,
        couponId: null,
        fullReductionActivity: null,
        noDiscountFee: '',
        productFee: null,
        payWay: PAYMENT[payment],
        shippingFee: chooseRule.giftTypeJson && chooseRule.giftTypeJson.split(',').includes('0') ? chooseRule.giftMoney * (inputValue / chooseRule.rechargeFull).toFixed(2) : 0,
        memberInfoCardGuid,
        ...merchantInfo
      },
      callback: res => {
        if (res.ok) {
          const newOrder = res.data
          if (res.data.payState === 'UNPAY') {
            const tradeNo = newOrder.payUrl.match(/(\d{32})/ig)[0]
            // 获取预交易单
            _this.props.dispatch({
              type: 'merchant/getPrepayAction',
              payload: { tradeNo, wxCode, appId: APP_ID },
              callback: ({ ok, data }) => {
                hideLoading()
                if (ok) {
                  const payInfo = JSON.parse(data.payInfo)
                  Taro.requestPayment({
                    timeStamp: payInfo.timeStamp,
                    nonceStr: payInfo.nonceStr,
                    package: payInfo.package,
                    signType: 'MD5',
                    paySign: payInfo.paySign,
                    success() {
                      _this.rechargeSuccess()
                      // const codeDishId = getCodeDishId()
                      // if (!codeDishId) {
                      //   saveCodeSign('')
                      // } else if (codeDishId == _this.state.goodsDetail.dishId) {
                      //   saveCodeSign('')
                      //   saveCodeDishId('')
                      //   saveQrPartnerCode('')
                      // }
                      // // saveCodeDishId('');
                      // // saveCodeSign('');
                      // // navToPage(`/pages/payResult/payResult?totalPrice=${newOrder.amount}&orderSn=${newOrder.orderSn}&id=${newOrder.id}`);
                      // Taro.redirectTo({ url: `/pages/payResult/payResult?orderSn=${orderSn}&type=OFFER_TO_PAY&merchantId=${merchantInfo.id}` })
                    }
                  })
                }
              }
            })
          } else {
            hideLoading()
            _this.rechargeSuccess()
            this.setState({
              payBoxVisible: false
            })
          }
        } else {
          hideLoading()
          const error = res.header['X-shopApp-error']
          let errMsg = ''
          if (error === 'error.businessHoursError') {
            showToast('商家不在营业状态,请稍后下单')
          } else if (error === 'error.merchantNumberOut') {
            showToast('商品超出营业数量,请重新下单')
          } else if (error === 'error.isWholeClose') {
            showToast('全站打烊,请明天再来')
          } else if (error === 'error.not-login') { // error.hongBao-error
            showToast('用户未登录,请登录账号')
            navToPage('/pages/login/login')
          } else if (error === 'error.hongBao-error') { //
            showToast('红包不可使用')
          } else if (error === 'error.soldOut') {
            const errorMsg = (res.header['X-shopApp-params']).split(',')
            errMsg = errMsg.substring(0, errMsg.length - 1)
            showToast('购买数量已超过库存数,请重新选择商品数量')
            // showToast(`${errorMsg}的购买数量已超过库存数,请重新选择商品`);
          } else if (error === 'error.exceed-limit-num') {
            showToast('购买的商品数量超出最大购买数量')
          } else {
            showToast(res.data.message)
          }
        }
      }
    })
  };

  // 关闭支付
  closePayment = () => {
    this.setState({
      payBoxVisible: false
    })
  }

  // 从其他页面返回回调函数
  goBackCll = params => {
    const { merchantNo, id } = JSON.parse(params)
    this.setState({
      merchant: JSON.parse(params),
      merchantInfo: { merchantNo, merchantId: id }
    })
  }


  render() {
    const {
      isShowInput, cardInfo: {
        cardColour, cardMoney = 0,
        cardName, systemManagementGuid
      }, rechargeRule, inputValue, payBoxVisible, payment, rechargeType, merchant, systemColor
    } = this.state

    return (
      <View className="container">
        <View 
          className="rechargeHead"
          style={{ backgroundColor: `${systemColor}` }}
        >
          <View className="balanceSection" style={{ backgroundColor: cardColour }}>
            <View className="cardName">{cardName}</View>
            <View>储值余额</View>
            <View className="balance">{`￥${cardMoney}`}</View>
          </View>
        </View>
        
        <View className="rechargeMerchant flex-row flex-ac flex-sb">
          <Text>{merchant.merchant_name}</Text>
          <View 
            className="changeBtn"
            onClick={() => {
              navToPage(`/package/storedMoney/rechargeMerchant/rechargeMerchant?merchantId=${merchant.id}&systemManagementGuid=${systemManagementGuid}`)
            }}
          >
            切换充值门店
          </View>
        </View>
        {
          rechargeType !== 0 && rechargeRule.length > 0 && (
          <View className="rechargeSection">
            {rechargeRule.map(ele => {
              const { grade, gradeName, rule } = ele
              return (
                <Block key={grade}>
                  <View className="title">
                    <Text>{gradeName}</Text>
                  </View>
                  {rule.map((o, index) => {
                    const {
                      rechargeFull, giftMoney, giftIntegral,
                      giftGrowth, guid,
                      giftTypeJson, cardRechargeVolumeDTOList, limitGiftMoney, giftNum
                    } = o
                    return (
                      <Block key={guid}>
                        <View className={`rechargeItem ${isShowInput === guid && 'active'}`}>
                          <Text className="full">
                            每满
                            <Text>{`${rechargeFull}元`}</Text>
                          </Text>
                          <View className="flex-row flex-sb flex-ac">
                            <View className="give">
                              {giftGrowth && giftTypeJson.split(',').includes('2') && (
                              <Block>
                                  成长值
                                <Text>{`+${giftGrowth}`}</Text>
                              </Block>
                              )}
                              {' '}
                              {giftIntegral && giftTypeJson.split(',').includes('1') && (
                              <Block>
                                  积分
                                <Text>{`+${giftIntegral}`}</Text>
                              </Block>
                              )}
                              {cardRechargeVolumeDTOList && cardRechargeVolumeDTOList.length > 0 && giftTypeJson.split(',').includes('3') && (
                                <Block>
                                  {
                                    cardRechargeVolumeDTOList.map(item => <Text className="colorBlack">{`${item.volumeName}*${item.giftNum}`}</Text>)
                                  }
                                </Block>
                              )}
                            </View>
                            <IconFont onClick={() => this.chooseRecharge(o)} value={isShowInput === guid ? 'imgStoredRechargeYes' : 'imgStoredRechargeNo'} h={50} w={50} />
                          </View>
                          <View className="rechargeGift">{limitGiftMoney === 0 ? '不限次数' : ( giftNum === 1 ? '仅限首次' : `仅限${giftNum}次` )}</View>
                          {giftMoney && giftTypeJson.split(',').includes('0') && <View className="label">{`送${giftMoney}元`}</View>}
                        </View>
                        {isShowInput === guid && rechargeType === 1 && (
                        <View className="inputSection flex-col">
                          <View className="flex-row flex-ac flex-sb">
                            <Input
                              value={inputValue}
                              placeholder="请输入金额"
                              className="input"
                              onInput={this.inputMoney}
                            />
                            <Button
                              className="btn"
                                // onGetUserInfo={this.getUserInfo}
                                // open-type="getUserInfo"
                              onClick={() => {
                                if (inputValue === '') {
                                  showToast('请输入充值金额')
                                } else {
                                  this.setState({
                                    payBoxVisible: true
                                  })
                                }
                              }}
                            >
                                立即充值
                            </Button>
                          </View>
                          {giftMoney && inputValue >= rechargeFull && giftTypeJson.split(',').includes('0') && (
                          <View className="amount">{`送${giftMoney * (inputValue / rechargeFull)}元，共得${formatCurrency((inputValue - 0) + (giftMoney * (inputValue / rechargeFull)))}元`}</View>
                          )}
                        </View>
                        )}
                      </Block>
                    )
                  })}
                </Block>
              )
            })}
          </View>
          )
        }

        {
          (rechargeType === 0 || rechargeRule.length === 0) && (
            <View className="rechargeSection">
              <View className="noRulesRecharge">
                <View className="noRulesTitle">充值金额</View>
                <View className="flex-row flex-ae inputRecharge">
                  <Text>￥</Text>
                  <Input
                    value={inputValue}
                    placeholder="请输入充值金额"
                    onInput={this.inputMoney}
                    placeholder-class="rechargePlace"
                  />
                </View>
              </View>
              <Button
                className="noRuleBtn"
                onClick={() => {
                  if (inputValue === '') {
                    showToast('请输入充值金额')
                  } else {
                    this.setState({
                      payBoxVisible: true
                    })
                  }
                }}
              >
                立即充值
              </Button>
            </View>
          )
        }

        {
          rechargeType === 2 && (
          <Button
            className="pay-btn pay-position"
            onClick={() => {
              if (inputValue === '') {
                showToast('请选择充值金额')
              } else {
                this.setState({
                  payBoxVisible: true
                })
              }
            }}
          >
            立即充值
          </Button>
          )
        }

        {/* 支付弹窗 */}
        <Payment
          isStorePay={false}
          payBoxVisible={payBoxVisible}
          payment={payment}
          paymentAmount={inputValue}
          onChange={val => {
            this.setState({
              payment: val
            })
          }}
          getUserInfo={this.getUserInfo}
          closePayment={this.closePayment}
        />
      </View>
    )
  }
}
