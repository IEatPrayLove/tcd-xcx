import Taro, { Component } from '@tarojs/taro'
import { Button, View, Text, Block } from '@tarojs/components'
import {
  connect
} from '@tarojs/redux'
import './payResult.scss'
import {
  formatCurrency, navToPage, objNotNull, toDecimal,
  judgeLegendsCard, getUserDetail, saveUserDetail, showToast, getUserDistributor, getServerPic
} from '../../../utils/utils'
import IconFont from '../../../components/IconFont/IconFont'
import ContactModal from '../../../components/ContactModal/ContactModal'
import { APP_ID, MERCHANT_URL, JOIN_DISTRIBUTION } from '../../../config/baseUrl'
import { merchantPoster } from '../../../config/posterConfig'
import MakePoster from '../../../components/MakePoster/MakePoster'

const { onfire } = Taro.getApp()

/**
 * 支付结果页面
 */
@connect(() => ({}))
export default class PayResult extends Component {
  config = {
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
    navigationBarTitleText: '支付成功'
  }

  constructor() {
    super()
    const { type } = this.$router.params
    this.state = {
      notBuyLegendsCard: false,
      accountsModal: false,
      orderType: type,
      makePoster: {
        renderStatus: false,
        config: {}
      }
    }
  }

  componentWillMount() {
    const { dispatch } = this.props
    const { orderType } = this.state
    const { id } = getUserDetail()
    console.log('orderType,id',orderType,id)

    // dispatch({
    //   type: 'legendsCard/getUserLegendsCardInfoAction',
    //   payload: {
    //     userId: id
    //   },
    //   callback: ({ ok, data }) => {
    //     if (ok) {
    //       this.setState({
    //         notBuyLegendsCard: !judgeLegendsCard(data)
    //       })
    //     }
    //   }
    // })
    // if (orderType === 'OFFER_TO_PAY') {
    //   const { merchantId } = this.$router.params
    //   dispatch({
    //     type: 'merchant/getMerchantDistributorInfo',
    //     payload: {
    //       merchantId: [merchantId]
    //     },
    //     callback: ({ ok, data }) => {
    //       if (ok && data && data.length) {
    //         const [{ distributorPoster }] = data
    //         distributorPoster && this.makeMerchantPoster(getServerPic(distributorPoster))
    //       }
    //     }
    //   })
    // }
  }

  // 门店海报分享
  makeMerchantPoster = posterUrl => {
    const { merchantId } = this.$router.params
    const { code } = getUserDistributor()
    const { dispatch } = this.props
    Taro.showLoading({
      title: '绘制中...',
      mask: true
    })
    dispatch({
      type: 'legendsCard/getShareQrCodeAction',
      payload: {
        qrContent: encodeURIComponent(`${JOIN_DISTRIBUTION}?code=${code || ''}`),
        userId: getUserDetail().id,
        appId: APP_ID
      },
      callback: ({ ok, data }) => {
        if (ok && data.url) {
          this.setState({
            makePoster: {
              renderStatus: true,
              config: merchantPoster({ qrUrl: data.url, posterUrl })
            }
          })
        } else {
          Taro.hideLoading()
        }
      }
    })
  }

  getOrderDetail = () => {
    const { type: orderType, orderSn ,enterpriseGuid,wxtoken, openId} = this.$router.params;
    console.log("this.$router.params=>>>>>>",this.$router.params)
    if (!orderSn) {
      showToast('订单编码未知')
      return
    }
    if (orderType === 'NETWORK' || orderType === 'OFFER_TO_PAY') {
      navToPage(`/package/multiStore/orderDetail/orderDetail?orderSn=${orderSn}`)
      return
    }
    if (orderType === 'SCAN_CODE') {
      navToPage(`/package/otherScanOrder/scanningOrder/scanningOrder?orderSn=${orderSn}&enterpriseGuid=${enterpriseGuid}&wxtoken=${wxtoken}&openId=${openId}`)
      return
    }
    Taro.redirectTo({ url: `/package/otherScanOrder/orderDetail?orderSn=${this.$router.params.orderSn}&id=${this.$router.params.id}&enterpriseGuid=${enterpriseGuid}&wxtoken=${wxtoken}&openId=${openId}` })
  }

  closeAccountModal = () => {
    this.setState({
      accountsModal: false
    })
  }

  componentDidShow() {
    onfire.on('WebViewMessage', message => {
      this.setState({
        accountsModal: message
      })
    })
  }

  componentWillUnmount() {
    onfire.un('WebViewMessage')
  }

  render() {
    const { notBuyLegendsCard, accountsModal, makePoster } = this.state
    return (
      <View className="flex-col pay-result-wrap">

        <View className="flex-col flex-ac flex-ac header">
          <View className="circle" />
          <View className="title">付款成功</View>
          {
            notBuyLegendsCard && (
              <View className="cardWarp">
                <View className="nielloCard flex-row flex-ac">
                  <IconFont w={48} h={43} value="imgLegendsLogo2" mr={8} />
                  <Text className="flex1">购买会员卡，自购返现分享返现</Text>
                  <View
                    className="btn"
                    onClick={() => {
                      navToPage('/pages/dredgeUnionCard/dredgeUnionCard')
                    }}
                  >
                    立即开通
                    <IconFont value="icon-arrow-right-copy-copy" color="#F5D3A5" size={26} />
                  </View>
                </View>
              </View>
            )
          }
          <View className="flex-row flex-ac flex-jc footer">
            <ContactModal />
            <Button
              className="btn detail"
              onClick={this.getOrderDetail.bind(this)}
            >
              订单详情
            </Button>
          </View>
        </View>
        {/* 海报 */}
        <MakePoster
          {...makePoster}
          onClose={() => {
            this.setState({
              makePoster: {
                renderStatus: false,
                config: {}
              }
            })
          }}
        />
      </View>
    )
  }
}
