import Taro from '@tarojs/taro'
import {
  View, Image, Text, Button
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtIcon, AtModal, AtModalContent } from 'taro-ui'
import './brandCoupon.scss'
import { STATIC_IMG_URL } from '../../config/baseUrl'
import {
  getServerPic, getUserDetail, navToPage, needLogin,
  judgeLegendsCard, toDecimal, showLoading, hideLoading
} from '../../utils/utils'
import IconFont from '../../components/IconFont/IconFont'

@connect(() => ({}))
export default class brandCoupon extends Taro.PureComponent {
  config = {
    navigationBarTitleText: '',
    navigationBarBackgroundColor: '#fff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      couponList: [],
      modalVisible: false,
      checkedItem: '',
      isLegendsCard: false,
      posterImg: ''
    }
  }

  componentWillPreload({ dishId, dishName, dishImageUrl }) {
    const { dispatch } = this.props
    dispatch({
      type: 'rightsCoupon/getCouponDetailAction',
      payload: { dishId },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            couponList: data,
            posterImg: dishImageUrl
          })
        }
      }
    })
    return dishName
  }

  componentWillMount() {
    Taro.setNavigationBarTitle({ title: this.$preloadData })
    const { islandUserMemberDTO } = getUserDetail()
    this.setState({
      isLegendsCard: judgeLegendsCard(islandUserMemberDTO)
    })
  }

  handleBuy = () => {
    const { checkedItem } = this.state
    if (!needLogin() || !checkedItem) {
      return
    }
    showLoading()
    this.props.dispatch({
      type: 'dineAndDash/judgeDineStockAction',
      payload: {
        skuId: checkedItem
      },
      callback: ({ ok, data }) => {
        hideLoading()
        if (ok && !data) {
          Taro.showModal({
            content: '该卡券已售完！',
            confirmColor: '#FF643D',
            showCancel: false
          })
          return
        }
        const { params: { dishId } } = this.$router
        navToPage(`/pages/rightsCoupon/payCoupon?dishId=${dishId}&skuId=${checkedItem}`)
      }
    })
  }

  render() {
    const {
      couponList, modalVisible, checkedItem,
      isLegendsCard, posterImg
    } = this.state
    return (
      <View className="brandCouponBox">
        <View className="brandCouponHeader">
          <Image mode="aspectFill" src={getServerPic(posterImg)} />
        </View>
        <View className="brandCouponBody">
          {
            !isLegendsCard && (
              <View
                className="brandCouponBodyTCK"
                onClick={() => {
                  navToPage('/pages/dredgeUnionCard/dredgeUnionCard')
                }}
              >
                <View className="brandCouponBodyLeft">
                  <IconFont value="imgLegendsLogo2" h={43} w={49} />
                  <View className="brandCouponBodyWord">开通会员卡，商品最低1折起</View>
                </View>
                <View className="brandCouponBodyRight">
                  <View className="brandCouponBodyLine" />
                  <View className="brandCouponBodyBtn">立即开通</View>
                  <AtIcon value="chevron-right" size="15" color="#fff" />
                </View>
              </View>
            )
          }
          <View className="brandCouponList">
            {
              couponList && couponList.length > 0 && couponList.map(item => {
                const {
                  spec, originalPrice, price,
                  picture, id, stock
                } = item
                return (
                  <View
                    className={`brandCouponItem ${checkedItem === id && 'active'}`}
                    key={id}
                    onClick={() => {
                      if (!(stock <= 0)) {
                        this.setState({
                          checkedItem: id
                        })
                      }
                    }}
                  >
                    {
                      checkedItem === id && <Image className="brandCouponItemCheck" src={`${STATIC_IMG_URL}/icon/treasury_sponsor.png`} />
                    }
                    <Image src={getServerPic(picture)} />
                    <View className={`brandCouponItemInfo flex1 flex-col flex-jc`}>
                      <View className="brandCouponItemWord">{spec}</View>
                      <View className="brandCouponItemPrice">{originalPrice ? `官方价：￥${toDecimal(originalPrice)}` : ''}</View>
                      <View className="brandCouponItemPriceBox flex-row flex-ac">
                        <View className="brandCouponItemUnit">￥</View>
                        <View className="brandCouponItemPriceNum">{price}</View>
                        <IconFont value="imgRightExclusive" h={34} w={140} ml={8} />
                        {
                          stock <= 0 && (<View className="sellOut flex1">已售罄</View>)
                        }
                      </View>
                    </View>
                  </View>
                )
              })
            }
          </View>
        </View>
        <View className="brandCouponFooter">
          <View
            className="brandCouponFooterHome"
            onClick={() => {
              Taro.switchTab({ url: '/pages/index/index'})
            }}
          >
            <Image src={`${STATIC_IMG_URL}/icon/card_home.png`} />
          </View>
          <View
            className={`brandCouponFooterBtn ${!checkedItem && 'disabled'}`}
            onClick={this.handleBuy}
          >
            查看详情
          </View>
        </View>

        {/* 确认提现 */}
        <AtModal isOpened={modalVisible}>
          <AtModalContent className="cashOutModal">
            <View className="modalContent">你还未开通平台会员卡</View>
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
      </View>
    )
  }
}
