import Taro, { Component } from '@tarojs/taro'
import {
  View, Image, Text, Button, Block,
  Swiper, SwiperItem
} from '@tarojs/components'
import { connect } from '@tarojs/redux'

import './index.scss'
import IconFont from '../../../components/IconFont/IconFont'
import { PLATFORM_ID } from '../../../config/baseUrl'
import {
  encodeURIObj, getPlatFormInfo, getUserDetail, navToPage
} from '../../../utils/utils'

@connect(({
  storedMoney: {
    alreadyStoredCards, curStoredCardIndex, curStoredCard, userMemberInfo
  }
}) => ({
  alreadyStoredCards, curStoredCard, curStoredCardIndex, userMemberInfo
}))
export default class Index extends Component {
  config = {
    navigationBarTitleText: '储值',
    // enablePullDownRefresh: true
  }

  state = {
    cardRights: {
      common: {},
      level: {}
    },
    systemColor: Taro.getStorageSync('systemColor')
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    })
  }

  componentDidShow() {
    const { dispatch } = this.props
    const { enterpriseGuid } = getPlatFormInfo()
    const { phone } = getUserDetail()
    dispatch({
      type: 'storedMoney/getStoredCardForPhoneAction',
      payload: {
        platformId: PLATFORM_ID,
        enterpriseGuid,
        phone
      },
      callback: ({ ok, data }) => {
        if (ok && (!data.memberCardListRespDTOs || data.memberCardListRespDTOs.length === 0)) {
          Taro.reLaunch({ url: '/package/storedMoney/cardList/cardList' })
        }
      }
    })
  }

  cardChange = ({ detail: { current } }) => {
    const { dispatch } = this.props
    const { enterpriseGuid } = getPlatFormInfo()
    dispatch({
      type: 'storedMoney/getStoredCardDetailAction',
      payload: {
        curStoredCardIndex: current,
        enterpriseGuid
      }
    })
  }

  goToRecharge = () => {
    const { alreadyStoredCards, curStoredCardIndex } = this.props
    const cardInfo = alreadyStoredCards[curStoredCardIndex]
    navToPage(`/package/storedMoney/recharge/recharge?cardInfo=${encodeURIObj(cardInfo)}`)
  }

  render() {
    const { alreadyStoredCards, curStoredCardIndex, curStoredCard = {}, userMemberInfo = {} } = this.props
    const { systemColor } = this.state
    const { items = [] } = curStoredCard
    const { cardIntegral = 0, cardGrowthValue = 0 } = alreadyStoredCards && alreadyStoredCards[curStoredCardIndex] || {}
    return (
      <View className="container" style={{ borderTop: `1px solid ${systemColor}` }}>
        <View className="headerBg" style={{ backgroundColor: `${systemColor}` }} />
        <Swiper
          onChange={this.cardChange}
          className="storedCardSection"
        >
          {alreadyStoredCards.map((ele, index) => {
            const {
              cardLevelName, cardMoney, cardName, cardColour,
              cardIcon, systemManagementCardNum
            } = ele
            return (
              <SwiperItem
                className="storedCardItem"
                current={curStoredCardIndex}
                key={index}
              >
                <View
                  className="flex-col flex-sb item"
                  style={cardIcon ? { backgroundImage:  `url(${cardIcon})`} : { backgroundColor: cardColour }}
                  onClick={() => navToPage(`/package/storedMoney/paymentCode/paymentCode?cardInfo=${encodeURIObj(alreadyStoredCards[curStoredCardIndex])}&memberInfo=${encodeURIObj(userMemberInfo)}`)}
                >
                  <View className="flex-row flex-sb">
                    <View className="flex-col flex-sb flex-as avatar">
                      <Text>{cardName}</Text>
                      <Text className="grade">{cardLevelName}</Text>
                    </View>
                    <IconFont value="imgQrCode" h={80} w={80} />
                  </View>
                  <View className="balanceTitle">储值余额</View>
                  <View className="balance">{`￥${cardMoney}`}</View>
                  <View className="flex-row flex-sb">
                    <Text>{`永久有效 NO.${systemManagementCardNum}`}</Text>
                    <Text>{`${curStoredCardIndex + 1}/${alreadyStoredCards.length}`}</Text>
                  </View>
                </View>
              </SwiperItem>
            )
          })}
        </Swiper>
        <View className="underSection">
          <Button
            className="rechargeBtn"
            onClick={this.goToRecharge}
          >
            去充值
          </Button>
          <View
            className="moreCards"
            onClick={() => navToPage('/package/storedMoney/cardList/cardList')}
          >
            更多储值卡
          </View>
          <View className="growUpProgress">
            <View className="growUp">
              <Text>当前成长值：</Text>
              <Text>{cardGrowthValue}</Text>
            </View>
            <View className="flex-row progress flex-ac">
              {items.map(ele => {
                const { cardLevelGrowthValue, cardLevelName } = ele
                const reached = cardGrowthValue >= cardLevelGrowthValue
                return (
                  <Block key={cardLevelGrowthValue}>
                    <Text className={`line flex1 ${reached ? 'reachedLine' : 'unreachedLine'} `} />
                    <View className={`item flex-row flex-ac ${reached ? 'reachedLine' : 'unreachedLine'}`}>
                      <Text className={`grade ${reached ? 'reachedTitle' : 'unreachedTitle'}`}>{cardLevelName}</Text>
                    </View>
                    <Text className={`line flex1 ${reached ? 'reachedLine' : 'unreachedLine'}`} />
                  </Block>
                )
              })}
            </View>
          </View>
          <View className="integralSection">
            <Text>卡内积分</Text>
            <View className="value">{cardIntegral}</View>
          </View>
          <View className="rightsSection">
            <Text>当前权益</Text>
            <View className="flex-row flex-ac rights flex-sb">
              {
                ((alreadyStoredCards[curStoredCardIndex].memberRights.commonDiscountRights && alreadyStoredCards[curStoredCardIndex].memberRights.commonDiscountRights.length > 0) || (alreadyStoredCards[curStoredCardIndex].memberRights.levelDiscountRights && alreadyStoredCards[curStoredCardIndex].memberRights.levelDiscountRights > 0)) && (
                <View
                  className="flex-col flex-ac"
                  onClick={() => navToPage(`/package/storedMoney/memberRights/memberRights?rightsInfo=${encodeURIObj(alreadyStoredCards[curStoredCardIndex].memberRights)}&type=discountRights`)}
                >
                  <IconFont value="imgStoredDiscount" h={80} w={80} />
                  <Text className="rightsName">会员折扣</Text>
                </View>
                )
              }
              {
                (alreadyStoredCards[curStoredCardIndex].memberRights.commonUpgradeRights || alreadyStoredCards[curStoredCardIndex].memberRights.levelUpgradeRights) && (
                  <View
                    className="flex-col flex-ac"
                    onClick={() => navToPage(`/package/storedMoney/memberRights/memberRights?rightsInfo=${encodeURIObj(alreadyStoredCards[curStoredCardIndex].memberRights)}&type=updateRights`)}
                  >
                    <IconFont value="imgStoredUpgrade" h={80} w={80} />
                    <Text className="rightsName">升级奖励</Text>
                  </View>
                )
              }
              {
                (alreadyStoredCards[curStoredCardIndex].memberRights.commonBirthdayRights || alreadyStoredCards[curStoredCardIndex].memberRights.levelBirthdayRights) && (
                  <View
                    className="flex-col flex-ac"
                    onClick={() => navToPage(`/package/storedMoney/memberRights/memberRights?rightsInfo=${encodeURIObj(alreadyStoredCards[curStoredCardIndex].memberRights)}&type=birthRights`)}
                  >
                    <IconFont value="imgStoredBirthday" h={80} w={80} />
                    <Text className="rightsName">生日特权</Text>
                  </View>
                )
              }
              {
                (alreadyStoredCards[curStoredCardIndex].memberRights.commonMemberPrice || alreadyStoredCards[curStoredCardIndex].memberRights.levelMemberPrice) && (
                  <View
                    className="flex-col flex-ac"
                    onClick={() => navToPage(`/package/storedMoney/memberRights/memberRights?rightsInfo=${encodeURIObj(alreadyStoredCards[curStoredCardIndex].memberRights)}&type=memberRights`)}
                  >
                    <IconFont value="imgStoredMemberPrice" h={80} w={80} />
                    <Text className="rightsName">会员价</Text>
                  </View>
                )
              }
            </View>
          </View>
        </View>
      </View>
    )
  }
}
