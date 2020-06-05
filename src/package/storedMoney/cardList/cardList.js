import Taro, { Component } from '@tarojs/taro'
import {
  View, Block, Image, Text
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import './cardList.scss'
import {
  getPlatFormInfo, getUserDetail, hideLoading, showLoading, needLogin
} from '../../../utils/utils'
import { PLATFORM_ID } from '../../../config/baseUrl'
import NoData from '../../../components/NoData/NoData'

@connect(({
  storedMoney: { notStoredCards, userMemberInfo },
  loading: { effects }
}) => ({ notStoredCards, userMemberInfo }))
export default class CardList extends Component {
  config = {
    navigationBarTitleText: '领取储值卡'
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    })
    this.refreshCardsData()
  }

  openStoredCard = (cardName, cardGuid, systemManagementGuid) => {
    const { dispatch, userMemberInfo } = this.props
    const { enterpriseGuid } = getPlatFormInfo()
    const { memberInfoGuid } = userMemberInfo
    showLoading()
    dispatch({
      type: 'storedMoney/openStoredCardAction',
      payload: {
        cardGuid,
        cardName,
        systemManagementGuid,
        enterpriseGuid,
        memberInfoGuid
      },
      callback: ({ ok }) => {
        hideLoading()
        if (ok) {
          // this.refreshCardsData()
          Taro.showModal({
            content: '您已成功领取一张储值卡',
            cancelText: '继续领取',
            confirmText: '确定',
            confirmColor: '#FF643D',
            success: ({ confirm }) => {
              if (confirm) {
                Taro.redirectTo({ url: '/package/storedMoney/index/index' })
              }
            }
          })
        }
      }
    })
  }

  refreshCardsData = () => {
    const { dispatch } = this.props
    const { enterpriseGuid } = getPlatFormInfo()
    const { phone } = getUserDetail()
    dispatch({
      type: 'storedMoney/getStoredCardForPhoneAction',
      payload: {
        platformId: PLATFORM_ID,
        enterpriseGuid,
        phone
      }
    })
  }

  render() {
    const { notStoredCards = [] } = this.props
    return (
      <Block>
        {(!notStoredCards.length || notStoredCards.length === 0) && (<NoData />)}
        {notStoredCards.length && notStoredCards.length > 0 && notStoredCards.map((ele, index) => {
          const {
            cardColour, cardName,
            cardGuid, systemManagementGuid
          } = ele
          return (
            <View key={index} className="cardItem" style={{ backgroundColor: cardColour }}>
              <View className="cardName">{cardName}</View>
              <View
                className="getBtn"
                onClick={() => this.openStoredCard(cardName, cardGuid, systemManagementGuid)}
              >
                领取
              </View>
              <View className="deadline">永久有效</View>
            </View>
          )
        })}
      </Block>
    )
  }
}
