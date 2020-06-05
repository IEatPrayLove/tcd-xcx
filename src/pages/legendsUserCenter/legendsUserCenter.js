import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Swiper, SwiperItem, Image,
  Text, Button, Block
} from '@tarojs/components'
import {
  connect
} from '@tarojs/redux'
import {
  AtButton, AtIcon, AtMessage, AtActivityIndicator
} from 'taro-ui'
import { TaroCanvasDrawer } from '../../components/taro-plugin-canvas'

import './legendsUserCenter.scss'
import IconFont from '../../components/IconFont/IconFont'

import {
  getUserDetail,
  getAuthenticate,
  needLogin,
  navToPage,
  getServerPic,
  objNotNull,
  remainingTime,
  judgeLegendsCard,
  getUserDistributor,
  setShareInfo,
  parseQuery,
  getBuyCard, saveUserDetail
} from '../../utils/utils'
import {MYSELF_URL, APP_ID, SERVER_IMG, POSTER_URL} from '../../config/baseUrl'
import UserDynamic from '../../components/UserDynamic/UserDynamic'
import NoData from '../../components/NoData/NoData'
import PageLoading from '../../components/PageLoading/PageLoading'

const { onfire } = Taro.getApp()

@connect(({
  common: { userDynamic }
}) => ({ userDynamic }))
export default class LegendsUserCenter extends PureComponent {
  config = {
    navigationBarTitleText: '会员',
  }

  constructor() {
    super()
    this.state = {
      userInfo: {},
      legendsCardInfo: {},
      nowRank: false,
      shareModalVisible: false,
      modalVisible: false,
      // 绘图配置文件
      config: null,
      // 绘制的图片
      shareImage: null,
      // TaroCanvasDrawer 组件状态
      canvasStatus: false,
      rssConfig: {
        width: 750,
        height: 1334,
        backgroundColor: '#fff',
        debug: false,
        images: [
          {
            url: `${POSTER_URL}/generatepPosters.png`,
            width: 750,
            height: 1334,
            y: 0,
            x: 0,
            zIndex: 10
          },
          {
            url: null,
            width: 120,
            height: 120,
            x: 228,
            y: 1193,
            zIndex: 12
          }
        ]
      },
      // 上期奖金池配置
      lastTerm: {},
      // 本期奖金池配置
      thisPeriod: {},
      // 分享信息
      distributorInfo: {},
      // 规则弹窗
      ruleVisible: false,
      // 用户拉入如数及赏金数
      userDragInto: {},
      pageLoading: true,
      buyLoading: false,
      userNotice: []
    }
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    })
  }

  getUserLegendsCardInfo = () => {
    const userInfo = getUserDetail()
    const { dispatch } = this.props
    dispatch({
      type: 'legendsCard/getUserLegendsCardInfoAction',
      payload: {
        userId: userInfo.id
      },
      callback: res => {
        if (res.ok && res.data) {
          this.setState({
            legendsCardInfo: res.data,
            userInfo,
            buyLoading: false,
            pageLoading: false
          })
          saveUserDetail({ ...userInfo, islandUserMemberDTO: res.data })
          // 获取当前用户分享信息
          dispatch({
            type: 'mine/getDistributorByPlatformAction',
            callback: ({ ok, data }) => {
              if (ok && data) {
                this.setState({
                  distributorInfo: data
                })
              }
            }
          })
          // 获取本期奖金池
          dispatch({
            type: 'legendsCard/getThisPeriodBonusPoolInfoAction',
            callback: ({ ok, data }) => {
              if (ok && data) {
                this.setState({ thisPeriod: data })
              }
            }
          })
          // 获取上期奖金池
          dispatch({
            type: 'legendsCard/getLastTermBonusPoolInfoAction',
            callback: ({ ok, data }) => {
              if (ok && data) {
                this.setState({ lastTerm: data })
              }
            }
          })
          // 获取会员卡赏金信息
          // dispatch({
          //   type: 'legendsCard/getLegendsBountyAction',
          //   callback: ({ ok, data }) => {
          //     // console.log(data)
          //   }
          // })
          // 获取所有用户拉入人数和赏金总额
          dispatch({
            type: 'legendsCard/userDragIntoAction',
            callback: ({ ok, data }) => {
              if (ok) {
                this.setState({
                  userDragInto: data
                })
              }
            }
          })
        } else {
          this.setState({
            buyLoading: true,
            pageLoading: false
          })
          // Taro.redirectTo({ url: '/pages/openLegendsCard/openLegendsCard' })
        }
      }
    })
  }

  componentDidShow() {
    const { params: { q, code: shareCode } } = this.$router
    console.log('二维码参数:', q)
    console.log('微信分享参数:', shareCode)
    if (q) {
      const posterObj = parseQuery(decodeURIComponent(q))
      const { code } = posterObj
      setShareInfo({ code })
    }
    if (shareCode) setShareInfo({ code: shareCode })
    const { islandUserMemberDTO } = getUserDetail()
    // 判断用户是否购买会员卡，没有购买跳转开通页面
    console.log(islandUserMemberDTO)
    if (!judgeLegendsCard(islandUserMemberDTO)) {
      // 会员卡支付后有一定延迟，页面进入等待
      if (getBuyCard() && getBuyCard().status) {
        this.setState({
          buyLoading: true,
          pageLoading: false
        })
      } else {
        Taro.redirectTo({ url: '/pages/dredgeUnionCard/dredgeUnionCard' })
      }
      return
    }
    this.getUserLegendsCardInfo()
    onfire.on('ReceiveMessages', message => {
      this.setState(({ userNotice }) => ({ userNotice: [...userNotice, message].slice(-10) }))
    })
  }

  componentDidHide() {
    onfire.un('ReceiveMessages')
  }

  // 调用绘画 => canvasStatus 置为true、同时设置config
  canvasDrawFunc = (config = this.state.rssConfig) => {
    this.setState({
      canvasStatus: true,
      config
    })
  }

  // 绘制成功回调函数 （必须实现）=> 接收绘制结果、重置 TaroCanvasDrawer 状态
  onCreateSuccess = result => {
    const { tempFilePath, errMsg } = result
    Taro.hideLoading()
    if (errMsg === 'canvasToTempFilePath:ok') {
      this.setState({
        shareImage: tempFilePath,
        // 重置 TaroCanvasDrawer 状态，方便下一次调用
        canvasStatus: true,
        config: null
      })
    } else {
      // 重置 TaroCanvasDrawer 状态，方便下一次调用
      this.setState({
        canvasStatus: false,
        config: null
      })
      Taro.showToast({ icon: 'none', title: errMsg || '出现错误' })
    }
    // 预览
    // Taro.previewImage({
    //   current: tempFilePath,
    //   urls: [tempFilePath]
    // })
  }

  // 绘制失败回调函数 （必须实现）=> 接收绘制错误信息、重置 TaroCanvasDrawer 状态
  onCreateFail = error => {
    Taro.hideLoading()
    // Taro.showTabBar()
    // 重置 TaroCanvasDrawer 状态，方便下一次调用
    this.setState({
      canvasStatus: false,
      config: null
    })
  }

  onShareAppMessage() {
    const { shareImage } = this.state
    const { nickName } = getUserDetail()
    const { code } = getUserDistributor()
    console.log('用户code:', `/pages/legendsUserCenter/legendsUserCenter?code=${code || ''}`)
    return {
      title: `${nickName}邀请你开通会员卡享受商品自购返现，分享赚钱`,
      path: `/pages/legendsUserCenter/legendsUserCenter?code=${code || ''}`,
      imageUrl: shareImage
    }
  }

  handleEarn = () => {
    this.setState({
      shareModalVisible: true
    })
  }

  closeShareModal = () => {
    this.setState({
      shareImage: null,
      canvasStatus: false
    }, () => {
      // Taro.showTabBar()
    })
  }

  // 生成二维码
  makeQrCode = () => {
    Taro.showLoading({
      title: '绘制中...',
      mask: true
    })
    // Taro.hideTabBar({
    //   animation: true,
    //   success: () => {
        
    //   }
    // })
    const { dispatch } = this.props
    const { rssConfig, distributorInfo: { code } } = this.state
    dispatch({
      type: 'legendsCard/getShareQrCodeAction',
      payload: {
        qrContent: `${MYSELF_URL}?code=${code || ''}`,
        userId: getUserDetail().id,
        appId: APP_ID
      },
      callback: ({ ok, data }) => {
        if (ok && data.url) {
          const template = JSON.parse(JSON.stringify(rssConfig))
          template.images[1].url = SERVER_IMG + data.url
          this.setState({
            rssConfig: template
          }, () => {
            this.canvasDrawFunc()
          })
        } else {
          Taro.hideLoading()
          // Taro.showTabBar()
        }
      }
    })
  }

  renderThisPeriod = () => {
    const {
      thisPeriod: {
        islandRewardsPoolAllParticipantsInfo: ranking,
        islandRewardsPoolNewTimesConfigDTO: {
          totalMoney, endTime, winRatioConfig
        }
      }
    } = this.state
    return (
      <View>
        <View className="legendsRankMoney">
          {totalMoney || 0}
          <Text>元</Text>
        </View>
        <View className="legendsRankMoneyTip">攻略提示：参与者越多，奖金池奖金越多哦~</View>
        <View className="legendsRankRules">
          {
            winRatioConfig.length > 0 && winRatioConfig.map(ele => {
              const {
                level, startRank, rewardRatio, endRank
              } = ele
              return (
                <View
                  className="legendsRankRulesItem"
                  key={level}
                >
                  排行榜第
                  {
                    (startRank == 1 && startRank == endRank) ? startRank : `${startRank} - ${endRank}`
                  }
                  {/*{startRank}*/}
                  {/*-*/}
                  {/*{endRank}*/}
                  名获奖金池金额
                  {rewardRatio}
                  %
                </View>
              )
            })
          }
          <View className="legendsRankRulesItem">邀请人数相同时，先上榜者可参与瓜分奖金</View>
        </View>
        <View className="legendsRankEndTime">
          距离本场冲榜活动结束仅剩
          {remainingTime(endTime)}
        </View>
        <View className="legendsRankUserList">
          {
            ranking.length > 0 && ranking.map(o => {
              // console.log(o)
              const {
                invitedNum, rewards, nickName,
                rank, headPic, id
              } = o
              return (
                <Block key={id}>
                  {
                    rank ? (
                      <View
                        className="legendsRankUserItem"
                        key={rank}
                      >
                        <View className="legendsRankUserInfo">
                          <Image src={getServerPic(headPic)} />
                          <View className="legendsRankUserName ellipsis">{nickName}</View>
                          <View className="legendsRankUserNo">{rank}</View>
                        </View>
                        <View className="legendsRankUserMoney flex-sk">
                          <View>
                            本期已邀
                            {invitedNum}
                            人
                          </View>
                          <View>
                            预计可多赚
                            {rewards || 0}
                            元
                          </View>
                        </View>
                      </View>
                    ) : null
                  }
                </Block>
              )
            })
          }
        </View>
        <View className="promptRank">
          该活动只展示参与人员前50名
        </View>
      </View>
    )
  }

  renderLastTerm = () => {
    const {
      lastTerm: {
        islandRewardsPoolAllParticipantsInfo: ranking,
        islandRewardsPoolParticipantsInfo,
        islandRewardsPoolNewTimesConfigDTO: {
          totalMoney, endTime, winRatioConfig
        }
      }
    } = this.state
    return (
      <View>
        <View className="legendsRankLastTitle">上期赏金池</View>
        <View className="legendsRankMoney mar-t">
          {totalMoney}
          <Text>元</Text>
        </View>
        {
          objNotNull(islandRewardsPoolParticipantsInfo[0]) && (
            <View className="legendsRankMyInfo">
              <View className="legendsRankMyNo">
                您的排名：
                <Text>{islandRewardsPoolParticipantsInfo[0].rank || '--'}</Text>
              </View>
              <View className="legendsRankMyNo">
                瓜分金额：
                <Text>{`${islandRewardsPoolParticipantsInfo[0].rewards || 0}元`}</Text>
              </View>
            </View>
          )
        }
        <View className="legendsRankEndTime endTimeFont">活动已结束，奖金已发放到您的“金库-余额“中。下期活动等您</View>
        <View className="legendsRankUserList">
          {
            ranking.length > 0 && ranking.map(o => {
              const {
                invitedNum, rewards, nickName,
                rank, headPic, id, totalRewards
              } = o
              return (
                <Block key={id}>
                  {
                      rank ? (
                        <View
                          className="legendsRankUserItem"
                          key={rank}
                        >
                          <View className="legendsRankUserInfo">
                            <Image src={getServerPic(headPic)} />
                            <View className="legendsRankUserName ellipsis">{nickName}</View>
                            <View className="legendsRankUserNo">{rank}</View>
                          </View>
                          <View className="legendsRankUserMoney flex-sk">
                            <View>
                              销售赏金
                              <Text className="colorRed">{totalRewards}</Text>
                              元
                            </View>
                            <View>
                              排行奖金
                              <Text className="colorRed">{rewards}</Text>
                              元
                            </View>
                          </View>
                        </View>
                      ) : null
                    }
                </Block>
              )
            })
          }
        </View>
      </View>
    )
  }

  render() {
    const {
      nowRank, modalVisible, canvasStatus, shareImage,
      shareModalVisible, ruleVisible,
      legendsCardInfo: { memberCardNo, memberEndTime },
      userInfo: { nickName, headPic, phone },
      lastTerm, thisPeriod, distributorInfo,
      userDragInto: {
        pullNumber, totalReward
      }, pageLoading, buyLoading,
      userNotice
    } = this.state
    const legendsCardEndTime = memberEndTime ? memberEndTime.split('T')[0] : '--'
    return (
      <View className="legendsRankBox">
        {
          buyLoading && (
            <View
              className="noOrder flex-col flex-ac flex-jc"
              onMoveTo={e => e.stopPropagation()}
            >
              <IconFont value="imgNoOrder" w={172} h={150} />
              <View className="weight flex-col flex-ac">
                <Text>会员卡生成中</Text>
                <Text>请稍后...</Text>
              </View>
              <Text
                className="refresh"
                onClick={() => {
                  this.setState({
                    pageLoading: true
                  }, () => {
                    this.getUserLegendsCardInfo()
                  })
                }}
              >
                点击刷新
              </Text>
            </View>
          )
        }
        {
          pageLoading && <View className="loading"><PageLoading /></View>
        }
        <View className="pageHeader">
          <UserDynamic type={['DISTRIBUTOR', 'PROMOTION', 'USER_WITHDRAW']} data={userNotice} />
          <View className="userCenter flex-row">
            <Image className="avatar flex-sk" src={getServerPic(headPic)} />
            <View className="userWarp">
              <View className="userMsg flex-row flex-ac">
                <Text className="ellipsis">{nickName}</Text>
                <Text>
                  （
                  {phone}
                  ）
                </Text>
              </View>
              <View className="legendsCard flex-row flex-ac">
                <IconFont value="imgDiamondCenter" w={30} h={25} mr={6} />
                <Text>
                  卡号：
                  {memberCardNo}
                </Text>
              </View>
              <View className="flex-row flex-ac">
                <Text className="cardDate">
                  {legendsCardEndTime}
                  到期
                </Text>
                <View
                  className="renewalFee"
                  onClick={() => { navToPage('/pages/dredgeUnionCard/dredgeUnionCard') }}
                >
                  续费
                </View>
                {/* <View
                  className="legendsRight"
                  onClick={() => { navToPage('/pages/legendsCardRight/legendsCardRight') }}
                >
                  权益
                </View> */}
              </View>
            </View>
          </View>
          <View className="sharePartner flex-col flex-ac">
            <Text className="title">邀好友 赚赏金</Text>
            <View className="rule flex-row flex-ac">
              {
                objNotNull(distributorInfo) && distributorInfo.partnerLevelModel.tcCardCashBack && (
                  <Text>{`每邀1人获奖${objNotNull(distributorInfo) && distributorInfo.partnerLevelModel.tcCardCashBack}元`}</Text>
                )
              }
              <View
                className="ruleBtn"
                onClick={() => {
                  this.setState({
                    ruleVisible: true
                  })
                }}
              >
                规则
              </View>
            </View>
            <View className="shareIncome flex-row">
              <View className="handle flex-gw flex-col flex-ac flex-jc">
                <Text>{pullNumber}</Text>
                <Text>已办理</Text>
              </View>
              <View className="bounty flex-gw flex-col flex-ac flex-jc">
                <Text>{totalReward}</Text>
                <Text>赏金到手</Text>
              </View>
              <View
                className="record flex-gw flex-col flex-ac flex-jc"
                onClick={() => {
                  navToPage('/pages/legendsUserCenter/incomeRecord/incomeRecord')
                }}
              >
                <Text>收益记录</Text>
              </View>
            </View>
            <Text
              className="prompt"
              onClick={() => {
                Taro.switchTab({ url: '/pages/treasury/index' })
              }}
            >
              { totalReward > 0 ? '赏金已到“金库-余额"中，去提现' : ''}
            </Text>
            <AtButton className="earnBounty" onClick={this.makeQrCode}>
              立即赚赏金
            </AtButton>
          </View>
        </View>
        <View className="legendsRank">
          <View className="legendsRankNav">
            <View
              className={`legendsRankNavItem ${!nowRank && 'rankBg'}`}
              onClick={() => {
                this.setState({
                  nowRank: true
                })
              }}
            >
              上期排行
            </View>
            <View
              className={`legendsRankNavItem ${nowRank && 'rankBg'}`}
              onClick={() => {
                this.setState({
                  nowRank: false
                })
              }}
            >
              本期排行
            </View>
          </View>
          {
            !nowRank && (objNotNull(thisPeriod) ? this.renderThisPeriod() : <NoData />)
          }
          {
            nowRank && (objNotNull(lastTerm) ? this.renderLastTerm() : <NoData />)
          }
        </View>
        {/* 上期活动结算 */}
        {/* <View className="previousSettlementMask"> */}
        {/*  <View className=""></View> */}
        {/* </View> */}
        {
          modalVisible && (
            <View className="previousSettlementMask">
              <View className="previousSettlementBox">
                <View className="previousSettlementTitle">恭喜你获得上期活动瓜分赏金</View>
                <View className="previousSettlementMoney">￥500</View>
                <View className="previousSettlementRank">
                  <View>邀请人数：2131人</View>
                  <View>排名25名</View>
                </View>
                <View className="previousSettlementBtn">参与本轮活动</View>
                <View className="previousSettlementTip">赏金已到“金库”余额中</View>
              </View>
              <AtIcon
                className="dredgeSuccessClose"
                value="close-circle"
                size="40"
                color="#fff"
                onClick={() => {
                  this.setState({
                    modalVisible: false
                  })
                }}
              />
            </View>
          )
        }
        {/* 海报生成 */}
        {
          canvasStatus && (
            <View
              className="previousSettlementMask"
              onTouchMove={e => { e.stopPropagation() }}
              onClick={this.closeShareModal}
            >
              <View
                className="generatepPostersBox"
                onClick={e => {
                  e.stopPropagation()
                }}
              >
                <Image
                  className="shareImage"
                  src={shareImage}
                  mode="aspectFit"
                />
                <TaroCanvasDrawer
                  style={{ display: 'none' }}
                  config={this.state.config} // 绘制配置
                  onCreateSuccess={this.onCreateSuccess} // 绘制成功回调
                  onCreateFail={this.onCreateFail}
                />
              </View>
              {
                shareImage
                && (
                  <View
                    className="bottomShare flex-row flex-ac"
                    onClick={e => {
                      e.stopPropagation()
                    }}
                  >
                    <Button
                      className="shareBtn flex-col flex-ac flex-sb"
                      open-type="share"
                      onClick={this.closeShareModal}
                    >
                      <IconFont value="imgSharePartner" h={90} w={90} />
                      <Text>好友分享</Text>
                    </Button>
                    <View
                      className="savePicBtn flex-col flex-ac flex-sb"
                      onClick={() => {
                        const { shareImage } = this.state
                        Taro.saveImageToPhotosAlbum({
                          filePath: shareImage,
                          success: () => {
                            Taro.atMessage({
                              message: '您的推广海报已存入手机相册，赶快分享给好友吧',
                              type: 'success'
                            })
                            this.closeShareModal()
                          },
                          fail: ({ errMsg }) => {
                            if (errMsg === 'saveImageToPhotosAlbum:fail:auth denied' || errMsg === 'saveImageToPhotosAlbum:fail auth deny') {
                              Taro.showModal({
                                title: '提示',
                                content: '需要您授权保存相册',
                                showCancel: false,
                                success: () => {
                                  Taro.openSetting({
                                    success: ({ authSetting }) => {
                                      if (authSetting['scope.writePhotosAlbum']) {
                                        Taro.atMessage({
                                          message: '获取权限成功,再次点击图片即可保存',
                                          type: 'success'
                                        })
                                      } else {
                                        Taro.atMessage({
                                          message: '获取权限失败，将无法保存到相册哦~',
                                          type: 'error'
                                        })
                                      }
                                    }
                                  })
                                }
                              })
                            }
                          }
                        })
                      }}
                    >
                      <IconFont value="imgSavePic" h={90} w={90} />
                      <Text>保存图片分享</Text>
                    </View>
                  </View>
                )
              }
            </View>
          )
        }
        {
          ruleVisible && (
            <View
              className="ruleModalMask"
              onTouchMove={e => {
                e.stopPropagation()
              }}
            >
              <View className="ruleModalBox">
                <View className="ruleModalContent">
                  <View className="ruleModalTitle">常见疑问</View>
                  <View className="ruleRow marBS">
                    <View className="ruleRowCircle2" />
                    <View className="ruleRowWordQuestion">办理之后还会收费吗？</View>
                  </View>
                  <View className="ruleRow marB">
                    <View className="ruleRowCircle" />
                    <View className="ruleRowWord">会员按照年付费开通，在有效期限内不会再收取任何费用，到期后续费即可。</View>
                  </View>
                  <View className="ruleRow marBS">
                    <View className="ruleRowCircle2" />
                    <View className="ruleRowWordQuestion">付费后多久开通对应权益？</View>
                  </View>
                  <View className="ruleRow marB">
                    <View className="ruleRowCircle" />
                    <View className="ruleRowWord">付费开通后即可享受对应权益，在个人中心可查看对应权益内容。</View>
                  </View>
                  <View className="ruleRow marBS">
                    <View className="ruleRowCircle2" />
                    <View className="ruleRowWordQuestion">平台会员卡赠送的会员会员卡和品牌权益卡有什么用呢？</View>
                  </View>
                  <View className="ruleRow marB">
                    <View className="ruleRowCircle" />
                    <View className="ruleRowWord">平台会员卡会员权益用户可进行对应奖金池瓜分等六大权益；品牌权益卡则可进行对应指定品牌如星巴克等品牌商品折扣购买。</View>
                  </View>
                </View>
              </View>
              <View
                className="ruleModalClose"
                onClick={() => {
                  this.setState({
                    ruleVisible: false
                  })
                }}
              >
                <AtIcon value="close-circle" size="30" color="#fff" />
              </View>
            </View>
          )
        }
        <AtMessage />
      </View>
    )
  }
}
