import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Text, Image
} from '@tarojs/components'
import {
  AtButton, AtMessage, AtModal, AtModalContent
} from 'taro-ui'
import {
  connect
} from '@tarojs/redux'

import './payCoupon.scss'
import IconFont from '../../components/IconFont/IconFont'
import {
  PAY_WECHAT, PAY_BALANCE, GOODS_TAKE_OUT, GOODS_COMMODITY
} from '../../config/config'
import {
  getPlatFormId, getServerPic,
  getShareInfo, getUserDetail,
  getUserDistributor, getUserLocation,
  navToPage, showLoading, hideLoading,
  replaceEmoji, showToast, dateFormat, saveUserDetail, judgeLegendsCard, toDecimal
} from '../../utils/utils'
import { APP_ID, PLATFORM_ID } from '../../config/baseUrl'
import PageLoading from '../../components/PageLoading/PageLoading'

@connect(({ loading: { effects } }) => ({
  effects: effects['mine/getUserMemberInfoAction'] || effects['goodsDetail/getDishDetailAction'] || effects['goodsDetail/getMerchantInfoAction']
}))
export default class PayCoupon extends PureComponent {
  config = {
    navigationBarTitleText: '',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      buyAmount: 1,
      buyMax: 0,
      payWay: PAY_WECHAT,
      couponDetail: {},
      goodsDetail: {},
      amountPrice: 0,
      banBalance: true,
      merchantInfo: {},
      balance: 0,
      modalVisible: false,
      goodsPicture: ''
    }
  }

  componentWillPreload({ dishId, skuId }) {
    const { dispatch } = this.props
    dispatch({
      type: 'goodsDetail/getDishDetailAction',
      payload: { platformId: PLATFORM_ID, dishId },
      callback: ({ ok, data }) => {
        if (ok) {
          const {
            shopDish: {
              shopDishSkus, dishName, limitBuyNum,
              shopLimitType, picture
            },
            dishMerchantShippingInfo: [{ merchantId }]
          } = data
          const curSku = shopDishSkus.find(o => o.id == skuId)
          dispatch({
            type: 'goodsDetail/getMerchantInfoAction',
            payload: { merchantId },
            callback: ({ ok: mOk, data: merchantInfo }) => {
              if (mOk) {
                this.setState({
                  merchantInfo
                })
              }
            }
          })
          Taro.setNavigationBarTitle({ title: dishName })
          this.setState({
            couponDetail: curSku,
            amountPrice: curSku.price,
            goodsDetail: data,
            buyMax: shopLimitType === 'ORDER_LIMIT' ? limitBuyNum : curSku.stock,
            goodsPicture: picture
          })
        }
      }
    })

    dispatch({
      type: 'mine/getUserMemberInfoAction',
      callback: ({ ok, data }) => {
        if (ok) {
          const { amount } = data
          this.setState({
            balance: amount
          })
        }
      }
    })
  }

  handleAdd = () => {
    const { buyAmount, buyMax, couponDetail: { price } } = this.state
    if (buyAmount >= buyMax) return
    this.setState({
      buyAmount: buyAmount + 1,
      amountPrice: price * (buyAmount + 1)
    })
  }

  handleSubtract = () => {
    const { buyAmount, couponDetail: { price } } = this.state
    if (buyAmount <= 1) return
    this.setState({
      buyAmount: buyAmount - 1,
      amountPrice: price * (buyAmount - 1)
    })
  }

  changePayWay = val => () => {
    const { balance, amountPrice } = this.state
    if (balance < amountPrice) return
    this.setState({
      payWay: val
    })
  }

  // 刷新余额信息
  refreshBalance = () => {
    const { dispatch } = this.props
    const userInfo = getUserDetail()
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

  // 封装订单
  makeOrder = () => {
    const {
      goodsDetail: {
        shopDish: {
          dishName, picture, thirdPartyType, productEffectiveDays
        }, useRules
      },
      merchantInfo: {
        merchantDetails: {
          address, position, principal_mobile
        },
        merchant_name, id: merchantId, merchantNo,
        userId, brand
      },
      couponDetail: {
        id, price, spec, boxNum, boxPrice, externaSkuNo
      }, buyAmount, amountPrice, payWay
    } = this.state
    const {
      nickName, phone, sex
    } = getUserDetail()
    const {
      longitude, latitude
    } = getUserLocation()
    const shopOrderProductInfoDTOS = [{
      packageInfoList: null,
      activityId: '', // product.sku.activityId,
      activityType: '', // product.sku.activityType,
      marketPrice: '', // product.marketPrice,
      packFee: 0,
      productName: dishName,
      skuId: id,
      productNum: buyAmount,
      productPrice: price,
      imageUrl: picture,
      spec: {
        name: spec,
        packNum: boxNum,
        packPrice: boxPrice,
        price
      },
      selfSupportDishPropertyTempList: []
    }]
    const shopOrderExtendedInfoDTO = {
      customerAddress: '',
      customerCoordinate: `${longitude},${latitude}`,
      customerGender: sex ? 'MEN' : 'WOMEN',
      customerName: replaceEmoji(nickName),
      customerPhone: phone,
      merchantAddress: replaceEmoji(address),
      merchantCoordinate: position,
      merchantDistance: 0, // merchant.merchantDetails.discount,
      merchantName: merchant_name,
      merchantPhone: principal_mobile,
      orderSend: '', // useDate,
      receiveId: '',
      orderRemark: '', // this.state.remark,
      orderMark: '',
      reserveTime: ''
    }
    const baseOrder = {
      amount: amountPrice, // 以后端计算为准
      // "discountFee": '',
      merchantId,
      merchantNo,
      merchantUserId: userId,
      brandId: brand,
      // "packFee": moneyInfo.totalPackFee,
      // orderState: 'PENDING', // 以后端计算为准
      orderType: 'TAO_QUAN', // shopDish.productType === GOODS_TICKET ? "DELIVERY_TO_HOME" : "TO_THE_STORE",
      platformId: PLATFORM_ID,
      // "platformUserId": plat?plat.createdBy:null,
      // printState: 'UNPRINT', // 以后端计算为准
      shopOrderExtendedInfoDTO,
      shopOrderProductInfoDTOS,
      thirdPartyType,
      productEffectiveDays,
      payWay: payWay === PAY_WECHAT ? 2 : 4, // 微信支付
      useRules// 使用规则
      // couponSn: confirmRedPackage.hongBaoSn || null, // todo 红包
      // couponId: confirmRedPackage.id || null,
      // fullReductionActivity: null// this.state.fullMinusActivities
    }
    if (thirdPartyType === 'TAO_QUAN') {
      baseOrder.shopOrderProductInfoDTOS[0].externalSkuNo = externaSkuNo
    }
    return baseOrder
  }

  handleBuy = ({ detail: { userInfo } }) => {
    const { islandUserMemberDTO } = getUserDetail()
    if (!judgeLegendsCard(islandUserMemberDTO)) {
      this.setState({ modalVisible: true })
      return
    }
    if (userInfo) {
      const { dispatch } = this.props
      showLoading('请求支付中...', true)
      Taro.login({
        success: ({ code }) => {
          dispatch({
            type: 'orderConfirm/saveShopOrderAction',
            payload: this.makeOrder(),
            callback: ({ ok, data }) => {
              if (ok) {
                const newOrder = data
                if (!newOrder.payUrl) {
                  // 余额支付
                  this.refreshBalance()
                  Taro.redirectTo({ url: `/pages/rightsCoupon/couponResult?orderSn=${newOrder.orderSn}` })
                  // 测试跳转到详情用,发版的时候注释
                  // navToPage(`/pages/payResult/payResult?totalPrice=${newOrder.amount}
                  // &orderSn=${newOrder.orderSn}&id=${newOrder.id}`);
                  // hideLoading(showToast('支付地址获取失败'))
                  return
                }
                const tradeNo = newOrder.payUrl.match(/(\d{32})/ig)[0]
                dispatch({
                  type: 'orderConfirm/getPrepayAction',
                  payload: {
                    tradeNo,
                    wxCode: code,
                    appId: APP_ID
                  },
                  callback: ({ ok: pOk, data: payData }) => {
                    hideLoading()
                    if (pOk) {
                      const payInfo = JSON.parse(payData.payInfo)
                      Taro.requestPayment(
                        {
                          timeStamp: payInfo.timeStamp,
                          nonceStr: payInfo.nonceStr,
                          package: payInfo.package,
                          signType: 'MD5',
                          paySign: payInfo.paySign,
                          success: () => {
                            Taro.redirectTo({ url: `/pages/rightsCoupon/couponResult?orderSn=${newOrder.orderSn}` })
                          }
                        }
                      )
                    }
                  }
                })
              } else {
                Taro.atMessage({
                  type: 'error',
                  message: data.message ? data.message : '下单失败！请重试。'
                })
              }
            }
          })
        }
      })
    }
  }

  render() {
    const {
      buyAmount, payWay, amountPrice,
      couponDetail: {
        spec, specImageUrl, price, originalPrice
      }, goodsPicture,
      banBalance, buyMax, balance,
      goodsDetail: { useRules = [] },
      modalVisible
    } = this.state
    const { effects } = this.props
    let dateTime = new Date()
    dateTime = dateTime.setDate(dateTime.getDate() + 1) // 当前日期加上一天
    return (
      <Block>
        {
          effects && <PageLoading />
        }
        <View className="couponDetail">
          <View className="flex-row flex-ac">
            <Image className="couponImg" src={getServerPic(specImageUrl || goodsPicture)} />
            <View>
              <Text className="couponName">{spec}</Text>
              <View>
                <Text className="price">{price}</Text>
                {
                  originalPrice && (
                    <Text className="originalPrice">{`官方价：￥${toDecimal(originalPrice)}`}</Text>
                  )
                }
              </View>
            </View>
          </View>
          <View className="line flex-row flex-ac flex-sb">
            <Text />
          </View>
          <Text className="maturity">{`有效期：次日（${dateFormat(dateTime / 1000, 'yyyy-MM-dd')}）10:00前有效`}</Text>
        </View>
        <View className="buyInfo">
          <View className="buyAmount flex-row flex-ac">
            <Text className="maxBuy flex1">{`（最多购买${buyMax}张）`}</Text>
            <View className="Modified flex-row flex-ac">
              <IconFont value="imgSubtract" w={46} h={46} onClick={this.handleSubtract} />
              <Text className="amount">{buyAmount}</Text>
              <IconFont value="imgAdd" w={46} h={46} onClick={this.handleAdd} />
            </View>
          </View>
          <View className="coupons flex-row flex-ac">
            <Text className="title flex1">优惠券</Text>
            <View>
              <Text className="notUsed">暂无可用</Text>
              <IconFont value="icon-arrow-right-copy-copy" size={30} />
            </View>
          </View>
          <View className="couponPrice">
            <Text>已优惠0元</Text>
            {' '}
            <Text>总计</Text>
            {' '}
            <Text className="payPrice">{toDecimal(amountPrice)}</Text>
          </View>
        </View>
        <View className="buyWay">
          <View
            className={`way flex-row flex-ac ${balance < amountPrice && 'banBalance'}`}
            onClick={this.changePayWay(PAY_BALANCE)}
          >
            <IconFont value="imgPayPacket2" h={34} w={34} mr={20} />
            <Text className="flex1">{`会员余额支付（余额￥${balance}）`}</Text>
            {
              payWay === PAY_BALANCE && <IconFont value="imgArrowOrange" h={34} w={34} />
            }
            {
              balance < amountPrice && <Text>余额不足</Text>
            }
          </View>
          <View
            className="way flex-row flex-ac"
            onClick={this.changePayWay(PAY_WECHAT)}
          >
            <IconFont value="imgPayWechat" h={30} w={35} mr={20} />
            <Text className="flex1">微信零钱</Text>
            {
              payWay === PAY_WECHAT && <IconFont value="imgArrowOrange" h={34} w={34} />
            }
          </View>
        </View>
        <View className="useRule flex-col">
          <Text>使用须知</Text>
          {
            useRules.map((ele, index) => (
              <Text key={index}>{ele}</Text>
            ))
          }
        </View>
        <AtButton
          openType="getUserInfo"
          className="payBtn"
          onGetUserInfo={this.handleBuy}
        >
          {`${payWay === PAY_WECHAT ? '微信' : '余额'}支付￥${toDecimal(amountPrice)}`}
        </AtButton>
        <AtModal isOpened={modalVisible}>
          <AtModalContent className="cashOutModal">
            <View className="modalContent">你还未开通会员卡</View>
            <View className="modalContent">开通后即可享权益商品折扣1折起</View>
            <View className="modalBtnGroup">
              <View
                className="modalBtn modalBtnCancel"
                onClick={() => {
                  this.setState({
                    modalVisible: false
                  })
                }}
              >
                暂不开通
              </View>
              <View
                className="modalBtn modalBtnConfirm"
                onClick={() => {
                  this.setState({
                    modalVisible: false
                  })
                  navToPage('/pages/dredgeUnionCard/dredgeUnionCard')
                }}
              >
                立即开通
              </View>
            </View>
          </AtModalContent>
        </AtModal>
        <AtMessage />
      </Block>
    )
  }
}
