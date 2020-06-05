import Taro from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import {
  View, Image, Text, Swiper, SwiperItem,
  Block
} from '@tarojs/components'
import {
  AtIcon, AtModal, AtModalAction, AtModalContent
} from 'taro-ui'
import './index.scss'
import {
  navToPage,
  getUserDetail,
  formatCurrency,
  getServerPic,
  advertisingLinks,
  judgeLegendsCard,
  getAuthenticate, getPlatFormInfo
} from '../../utils/utils'
import { PLATFORM_ID, STATIC_IMG_URL } from '../../config/baseUrl'
import PageLoading from '../../components/PageLoading/PageLoading'
import UserDynamic from '../../components/UserDynamic/UserDynamic'

const { onfire } = Taro.getApp()

@connect(({
  loading: { effects },
  common: { userDynamic }
}) => ({
  effects: effects['treasury/getTalentInfo']
  || effects['treasury/getTreasuryInfo']
  || effects['treasury/getWithdrawRequire']
  || effects['index/getAppletsAdAction']
  || effects['common/getPlatFormSystemSettingByIdAction']
  || effects['storedMoney/getStoredCardForPhoneAction'],
  userDynamic
}))
export default class Index extends Taro.Component {
  config = {
    navigationBarTitleText: '金库',
    navigationBarBackgroundColor: '#FF623D',
    navigationBarTextStyle: 'white'
  }

  constructor() {
    super()
    this.state = {
      amount: 0, // 当前总余额
      distributionReward: 0, // 分享赏金
      promotionReward: 0, // 达人累计赏金
      limitWithdraws: 0, // 限制提现金额
      cycleType: null,
      limitNumber: null, // 提现次数
      modalVisible: false,
      withdrawsNumberLimitType: null, // 提现限制
      profits: {
        distruibutionYesterdayAmount: 0,
        promotionTotalAmount: 0,
        distruibutionTotalAmount: 0,
        promotionYesterdayAmount: 0
      },
      isExpert: false,
      treasuryAd: [], // 金库广告位
      isLogin: true,
      pageLoading: true,
      userNotice: [],
      storedCards: {},
      hasStoredCards: true
    }
  }

  componentDidHide() {
    onfire.un('ReceiveMessages')
    this.setState({
      pageLoading: false
    })
  }

  componentDidShow() {
    const isLogin = getAuthenticate()
    console.log(isLogin)
    this.getStoredCards()
    if (isLogin) {
      this.getTreasuryInfo()
      this.getWithdrawRequire()
      this.getTalentInfo() // 是否认证达人
      this.getTreasureProfits()
      this.getTreasuryAd()
    }
    this.setState({
      isLogin: !!isLogin
    })
    onfire.on('ReceiveMessages', message => {
      this.setState(({ userNotice }) => ({ userNotice: [...userNotice, message].slice(-10) }))
    })
  }

  // 获取储值卡信息
  getStoredCards = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'common/getPlatFormSystemSettingByIdAction',
      callback: ({ ok, data }) => {
        if (ok) {
          const { enterpriseGuid } = data
          this.setState({
            hasStoredCards: !!enterpriseGuid
          })
          // 获取储值卡信息
          if (enterpriseGuid && getAuthenticate()) {
            const { phone } = getUserDetail()
            dispatch({
              type: 'storedMoney/getStoredCardForPhoneAction',
              payload: {
                platformId: PLATFORM_ID,
                enterpriseGuid,
                phone
              },
              callback: res => {
                if (res.ok) {
                  this.setState({
                    storedCards: res.data
                  })
                }
              }
            })
          }
        }
      }
    })
  }
  // 达人
  getTalentInfo = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'treasury/getTalentInfo',
      params: {},
      callback: res => {
        if (res.ok && res.data.authList.length > 0) {
          this.setState({
            isExpert: true
          })
        }
      }
    })
  }

  // 获取金额详细
  getTreasuryInfo = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'treasury/getTreasuryInfo',
      payload: {},
      callback: res => {
        if (res.ok) {
          this.setState({
            amount: res.data.amount,
            distributionReward: res.data.distributionReward,
            promotionReward: res.data.promotionReward
          })
        }
      }
    })
  }

  // 获取提现条件
  getWithdrawRequire = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'treasury/getWithdrawRequire',
      payload: {},
      callback: res => {
        if (res.ok && res.data.withdrawsNumberLimitType == 'CYCLE_LIMIT') {
          this.setState({
            limitNumber: res.data.tcdWithdrawsCycleLimitVM[0].limitNumber,
            cycleType: res.data.tcdWithdrawsCycleLimitVM[0].cycleType,
            limitWithdraws: res.data.limitWithdraws
          })
        } else {
          this.setState({
            withdrawsNumberLimitType: res.data.withdrawsNumberLimitType,
            limitWithdraws: res.data.limitWithdraws
          })
        }
      }
    })
  }

  // 获取广告位
  getTreasuryAd = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'index/getAppletsAdAction',
      payload: {
        positionCode: 5
      },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            treasuryAd: data
          })
        }
      }
    })
  }

  // 判断提现的次数满足情况
  judgeIsWithdraw = () => {
    const { dispatch } = this.props
    const { withdrawsNumberLimitType, amount } = this.state
    if (withdrawsNumberLimitType == 'NO_LIMIT') {
      // 如果体现无限制的化就可以一直去提现
      this.handleRouter(`/pages/treasury/cashOut/cashOut?amount=${amount}`)()
    } else {
      // 判断次数是否达到了提现的次数
      dispatch({
        type: 'treasury/judgeIsWithdraw',
        payload: {},
        callback: res => {
          if (res.ok) {
            if (res.data == false) { // 已经达到提现次数的话就弹窗提醒
              this.setState({
                modalVisible: true
              })
            } else {
              // 跳转去提现的页面
              this.handleRouter(`/pages/treasury/cashOut/cashOut?amount=${amount}`)()
            }
          }
        }
      })
    }
  }

  // 获取收益明细
  getTreasureProfits = () => {
    const { dispatch } = this.props
    const userInfo = getUserDetail()
    dispatch({
      type: 'treasury/getTreasureProfits',
      payload: {},
      callback: res => {
        if (res.ok) {
          this.setState({
            profits: {
              distruibutionYesterdayAmount: res.data.distruibutionYesterdayAmount,
              promotionTotalAmount: res.data.promotionTotalAmount,
              distruibutionTotalAmount: res.data.distruibutionTotalAmount,
              promotionYesterdayAmount: res.data.promotionYesterdayAmount
            }
          })
        }
      }
    })
  }

  handleRouter = page => () => {
    if (page === '/pages/dredgeUnionCard/dredgeUnionCard') {
      navToPage('/pages/dredgeUnionCard/dredgeUnionCard')
    } else {
      navToPage(page)
    }
  }

  // handleRouterSwitch = () => {
  //   Taro.switchTab({ url: '/pages/dredgeUnionCard/dredgeUnionCard' })
  // }

  render() {
    const {
      amount, distributionReward, promotionReward, cycleType,
      limitNumber, modalVisible, profits, isExpert, treasuryAd,
      isLogin, limitWithdraws, pageLoading, userNotice, storedCards,
      hasStoredCards
    } = this.state
    const {
      effects = false
    } = this.props
    const { memberCardListRespDTOs = [] } = storedCards
    const allStoredMoney = memberCardListRespDTOs.reduce((acc, { cardMoney }) => acc + cardMoney, 0)
    return (
      <Block>
        {
          effects && pageLoading && (
            <PageLoading />
          )
        }
        {
          !isLogin && (
            <View className="notLogin flex-col flex-ac flex-jc">
              <Image src={`${STATIC_IMG_URL}/treasury_log.png`} />
              <Text>您还没有登录,快去登录吧~</Text>
              <View onClick={() => { Taro.navigateTo({ url: '/pages/login/login' }) }}>登录</View>
            </View>
          )
        }
        <View className="treasuryBox">
          <View className="treasuryHeader">
            <View className="flex-row flex-ac flex-sb dynamicWarp">
              {
                userNotice.length > 0 ? (
                  <UserDynamic type={['DISTRIBUTOR', 'PROMOTION', 'USER_WITHDRAW']} data={userNotice} />
                ) : <View />
              }
              <View
                className="remainderDetail"
                onClick={this.handleRouter('/pages/treasury/balanceRecord/balanceRecord')}
              >
                余额明细
              </View>
            </View>
            <View className="treasuryRemainderTitle">
              当前总余额
            </View>
            <View className="treasuryRemainder">{formatCurrency(amount + allStoredMoney)}</View>
            <View className="treasuryLine" />
            <View className="treasuryGrandTotal">
              累计收益
              <Text>
                {' '}
                {
                  <Text>{(distributionReward === 0 && promotionReward === 0) ? 0 : (isNaN((distributionReward + promotionReward).toFixed(2)) ? 0 : (distributionReward + promotionReward).toFixed(2))}</Text>
                }
                {' '}
              </Text>
              元
            </View>
            <View
              className="treasuryRemainderTitle"
              onClick={this.handleRouter('/pages/treasury/cashOutRecord/cashOutRecord')}
            >
              提现明细
            </View>
          </View>
          <View className="treasuryBody">
            <View className="withdrawAndStored flex-row flex-sb">
              <View className={`withdraw flex-col flex-sb flex1 ${!hasStoredCards && 'notStored'}`}> {/* notStored */}
                <Text className="title">收益余额</Text>
                <Text className="money">{`￥${amount}`}</Text>
                {amount >= limitWithdraws ? (
                  <View className="btn" onClick={this.judgeIsWithdraw}>提现</View>
                ) : (
                  <View className="prompt">{`余额达到￥${limitWithdraws}可提现`}</View>
                )}
              </View>
              {hasStoredCards && (
                <View
                  className="stored flex-col flex-sb flex1"
                  onClick={() => {
                    if (memberCardListRespDTOs.length) navToPage('/package/storedMoney/index/index')
                    else navToPage('/package/storedMoney/cardList/cardList')
                  }}
                >
                  <Text className="title">储值会员</Text>
                  <Text className="money">{`￥${formatCurrency(allStoredMoney)}`}</Text>
                  <View className="btn">充值</View>
                </View>
              )}
            </View>
            <View
              className="treasuryBodyItem flex-row flex-ac flex-sb"
              onClick={() => {
                if (parseFloat(profits.distruibutionTotalAmount).toFixed(2) !== '0.00') {
                  navToPage('/pages/treasury/commissionTotal/commissionTotal?type=retail')
                }
              }}
            >
              <View className="flex-col">
                <View className="treasuryItemTitle">分享累计赏金（元）</View>
                <View className="treasuryItemMoney">{parseFloat(profits.distruibutionTotalAmount).toFixed(2)}</View>
              </View>
              <View
                className="treasuryItemRight"
                onClick={e => {
                  e.stopPropagation()
                }}
              >
                {
                  parseFloat(profits.distruibutionTotalAmount).toFixed(2) === '0.00'
                    ? (
                      <View className="itemRightTitle" onClick={judgeLegendsCard(getUserDetail().islandUserMemberDTO) ? this.handleRouter('/package/specialOffer/specialOffer') : this.handleRouter('/pages/dredgeUnionCard/dredgeUnionCard')}>
                        <Text>{judgeLegendsCard(getUserDetail().islandUserMemberDTO) ? '立刻分享商品获得赏金' : '立刻拥有获得赏金权益'}</Text>
                      </View>
                    )
                    : (
                      <View className="itemRightTitle">
                        昨日收益：
                        <Text>
                          ￥
                          {profits.distruibutionYesterdayAmount}
                        </Text>
                      </View>
                    )
                }
                <AtIcon className="itemRightIcon" value="chevron-right" size="15" color="#999" />
              </View>
            </View>
            <View
              className="treasuryBodyItem flex-row flex-ac flex-sb"
              onClick={() => {
                if (parseFloat(profits.promotionTotalAmount).toFixed(2) !== '0.00') {
                  navToPage('/pages/treasury/commissionTotal/commissionTotal?type=expert')
                }
              }}
            >
              <View className="flex-col">
                <View className="treasuryItemTitle">达人累计赏金（元）</View>
                <View className="treasuryItemMoney">{parseFloat(profits.promotionTotalAmount).toFixed(2)}</View>
              </View>
              <View
                className="treasuryItemRight"
                onClick={e => {
                  e.stopPropagation()
                }}
              >
                {
                  parseFloat(profits.promotionTotalAmount).toFixed(2) === '0.00'
                    ? (
                      <View className="itemRightTitle" onClick={isExpert ? this.handleRouter('/pages/propagandaReward/propagandaReward') : this.handleRouter('/pages/achievementCertification/achievementCertification')}>
                        <View className="itemRightTitleBlue">{isExpert ? '立刻完成任务获得赏金' : '立刻认证达人获得赏金'}</View>
                      </View>
                    )
                    : (
                      <View className="itemRightTitle">
                        昨日收益：
                        <Text>
                          ￥
                          {profits.promotionYesterdayAmount}
                        </Text>
                      </View>
                    )
                }
                <AtIcon className="itemRightIcon" value="chevron-right" size="15" color="#999" />
              </View>
            </View>
            {
              treasuryAd.length > 0 && (
                <Swiper
                  className="treasuryAd"
                  indicatorDots={treasuryAd.length > 1}
                  circular
                  autoplay
                >
                  {
                    treasuryAd.map(ele => {
                      const { imageUrl, id } = ele
                      return (
                        <SwiperItem key={id}>
                          <Image
                            src={getServerPic(imageUrl)}
                            onClick={() => { advertisingLinks(ele) }}
                          />
                        </SwiperItem>
                      )
                    })
                  }
                </Swiper>
              )
            }
          </View>
          <AtModal
            className="cashOutFail"
            isOpened={modalVisible}
            onClose={() => {
              this.setState({
                modalVisible: false
              })
            }}
          >
            <AtModalContent className="prompt">
              {
                cycleType == 'DAY' ? '一天内只可以体现'
                  : cycleType == 'HALF_MONTH' ? '半月内只可以体现'
                  : cycleType == 'MONTH' ? '一月内只可以体现'
                    : cycleType == 'HALF_YEAR' ? '半年内只可以体现'
                      : cycleType == 'YEAR' ? '一年内只可以体现'
                        : '一星期内只可以体现'}
              {limitNumber}次哦~
            </AtModalContent>
            <AtModalAction>
              <Button
                onClick={() => {
                  this.setState({
                    modalVisible: false
                  })
                }}
              >
                知道了
              </Button>
            </AtModalAction>
          </AtModal>
        </View>
      </Block>
    )
  }
}
