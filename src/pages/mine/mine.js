/* eslint-disable no-unused-vars */
import Taro, { PureComponent } from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import {
  Block, Button, Image, Text, View, Swiper, SwiperItem
} from '@tarojs/components'
import {
  AtBadge, AtList, AtListItem, AtModal,
  AtModalAction, AtModalContent
} from 'taro-ui'

import {
  getAuthenticate, navToPage, objNotNull, getUserDetail, getServerPic,
  judgeLegendsCard, advertisingLinks, saveUserDetail, formatCurrency
} from '../../utils/utils'
import IconFont from '../../components/IconFont/IconFont'
import './mine.scss'
import { PLATFORM_ID, SERVER_IMG, STATIC_IMG_URL, WX_APPID } from '../../config/baseUrl'
import NewUserRaiders from '../../components/NewUserRaiders/NewUserRaiders'
import MakePoster from '../../components/MakePoster/MakePoster'
import { publicQR } from '../../config/posterConfig'

const dayjs = require('dayjs')
const { onfire } = Taro.getApp()

@connect(({ loading: { effects }, mine: { talentPlatform } }) => ({
  effects, talentPlatform
}))
export default class Mine extends PureComponent {
  config = {
    navigationBarTitleText: '我的'
  }

  constructor() {
    super()
    this.state = {
      userInfo: {},
      mineAd: [],
      amountOrder: {},
      isAccounts: false,
      accountsModal: false,
      storedCards: {},
      hasStoredCards: true,
      userRaidersModal: false,
      systemColor: Taro.getStorageSync('systemColor'),
      makePoster: {
        renderStatus: false,
        config: {}
      },
    }
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    })
  }

  componentDidMount() {
    const { dispatch } = this.props
    dispatch({
      type: 'index/getAppletsAdAction',
      payload: {
        positionCode: 3
      },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            mineAd: data
          })
        }
      }
    })
  }

  componentDidShow() {
    if (Taro.getStorageSync('isNewUser') === 'new') {
      this.setState({
        userRaidersModal: true
      }, () => {
        Taro.setStorage({ key: 'isNewUser', data: 'old' })
      })
    }
    const { dispatch } = this.props
    dispatch({
      type: 'common/getPlatFormSystemSettingByIdAction',
      callback: ({ ok, data }) => {
        // console.log("ok=>>>>>>" + ok)
        console.log(data)
        if (ok) {
          const { enterpriseGuid } = data;
          console.log(data);
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
    if (getAuthenticate()) {
      // 获取用户达人认证信息
      dispatch({
        type: 'mine/getTalentInfoAction'
      })
      // 获取用户消费订单、权益卡券、宣传任务数量
      dispatch({
        type: 'mine/getUserOrderQuantityAction',
        callback: ({ ok, data }) => {
          if (ok) {
            this.setState({
              amountOrder: data
            })
          }
        }
      })

      // 获取用户会员信息
      dispatch({
        type: 'mine/getUserMemberInfoAction',
        callback: ({ ok, data }) => {
          if (ok) {
            const {
              gradeName, growthValue, grade, amount
            } = data
            const userDetail = getUserDetail()
            const newUserDetail = {
              ...userDetail,
              grade,
              gradeName,
              growthValue,
              amount
            }
            this.setState({
              userInfo: newUserDetail
            })
            saveUserDetail(newUserDetail)
          }
        }
      })

      const { weappUserId } = getUserDetail()

      // 接受webView回来的消息
      onfire.on('WebViewMessage', message => {
        // console.log(message)
        Taro.showLoading({
          title: '绘制中...'
        })
        dispatch({
          type: 'mine/getPublicQRAction',
          payload: {
            platformId: PLATFORM_ID
          },
          callback: ({ ok, data }) => {
            // console.log(data)
            if (ok) {
              const config = publicQR({
                qrUrl: data.publicAccountPicUrl
              })
              this.setState({
                makePoster: {
                  renderStatus: true,
                  config
                }
              })
            }
          }
        })
      })

      // 判断用户是否关注公众号
      
      //先判断当前环境
      //如果是测试环境  则用http://test.canyingdongli.com/ 
      //否则用http://clt.canyingdongli.com/ 
      //appId也不要写死（wx49b72696409fd41b）这个值可以从这个接口中获取uaa/api/apps-by-platform-and-type/358?appType=1 publicAccountAppId字段
      //
      //
      // const baseUrl = `http://test.canyingdongli.com/uaa/api/get-the-openId-and-save?platformId=${PLATFORM_ID}&userId=${weappUserId}`
      Taro.request({
        // url: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx49b72696409fd41b&redirect_uri=http%3a%2f%2ftest.canyingdongli.com%2fuaa%2fapi%2fget-the-openId-and-save%3fplatformId%3d${PLATFORM_ID}%26userId%3d${weappUserId}&response_type=code&scope=snsapi_base&state=1&connect_redirect=1#wechat_redirect`,
        url: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WX_APPID}&redirect_uri=http%3a%2f%2ftest.canyingdongli.com%2fuaa%2fapi%2fget-the-openId-and-save%3fplatformId%3d${PLATFORM_ID}%26userId%3d${weappUserId}&response_type=code&scope=snsapi_base&state=1&connect_redirect=1#wechat_redirect`,
        success: res => {
          // console.log(res)
        }
      })
      dispatch({
        type: 'mine/judgeOfficialAccountsAction',
        payload: {
          userId: weappUserId
        },
        callback: ({ ok, data }) => {
          if (ok && data) {
            this.setState({
              isAccounts: false
            })
          } else {
            this.setState({
              isAccounts: true
            })
          }
        }
      })


    } else {
      this.setState({
        userInfo: {}
      })
    }
  }

  componentDidHide() {
    onfire.un('WebViewMessage')
  }

  goToSignIn = () => {
    if (objNotNull(this.state.userInfo)) {
      navToPage('/pages/userInfo/userInfo')
    } else {
      navToPage('/pages/login/login')
    }
  }

  renderTalentBadge = () => {
    const { authList: badge = [] } = this.props.talentPlatform
    if (!badge || (badge.length <= 0)) {
      return (
        <View
          className="nowCertification flex-row flex-ac"
          onClick={() => {
            navToPage('/pages/achievementCertification/achievementCertification')
          }}
        >
          <IconFont value="imgOmit" h={32} w={32} mr={6} />
          <Text>立即认证</Text>
        </View>
      )
    }
    const showBadge = badge.filter((ele, index) => index < 2)
    return (
      <View
        className="flex-row flex-ac"
        onClick={() => {
          navToPage('/pages/platformCertification/platformCertification')
        }}
      >
        {
            showBadge.map(ele => {
              const {
                id, logo, islandPromotionExpertAuthDTOS: [{ checkGrade }]
              } = ele
              return (
                <View key={id} className="talentItem flex-row flex-ac">
                  <Image src={SERVER_IMG + logo} />
                  <Text className="level">
                    Dv
                    {checkGrade}
                  </Text>
                </View>
              )
            })
          }
        <View className="omit flex1">···</View>
      </View>
    )
  }

  goToLegendsCardUserCenter = () => {
    // const {
    //   userInfo: { islandUserMemberDTO }
    // } = this.state
    // if (islandUserMemberDTO) {
    //   Taro.switchTab({ url: '/pages/distributorIndex/distributorIndex' })
    // } else {
      
    // }
    navToPage('/pages/dredgeUnionCard/dredgeUnionCard')
  }

  // 打开或关闭弹窗
  changeRaiders = data => {
    this.setState({
      userRaidersModal: data
    })
  }

  render() {
    const {
      userInfo,
      userInfo: {
        nickName, headPic, grade, islandUserMemberDTO, gradeName
      },
      mineAd, amountOrder: {
        allOrderCount, promotionCount, taoQuanCount
      }, isAccounts, accountsModal, storedCards, hasStoredCards, userRaidersModal, systemColor, makePoster
    } = this.state
    const { memberCardListRespDTOs = [] } = storedCards
    const allStoredMoney = memberCardListRespDTOs.reduce((acc, { cardMoney }) => acc + cardMoney, 0)
    return (
      <Block>
        <View
          className="mineHeader"
          id="pageHeader"
          style={{ backgroundColor: `${systemColor}` }}
        >
          <View className="flex-row">
            <Image
              className="userImg"
              mode="aspectFit"
              src={objNotNull(userInfo) ? getServerPic(headPic) : `${STATIC_IMG_URL}/icon/not_login.png`}
              onClick={this.goToSignIn}
            />
            <View className="userInfo flex1">
              {
                objNotNull(userInfo) ? (
                  <Block>
                    <View className="userName flex-row flex-ac">
                      <View
                        className="ellipsis"
                        onClick={() => { navToPage('/pages/userInfo/userInfo') }}
                      >
                        {nickName}
                      </View>
                      <View className="userLevel flex-sk flex-row flex-ac">
                        <IconFont value="imgCrown2" h={22} w={24} mr={4} />
                        {gradeName || '--'}
                      </View>
                    </View>
                    <View className="userTalent flex-row flex-ac">
                      <Text>达人：</Text>
                      {this.renderTalentBadge()}
                    </View>
                  </Block>
                ) : <View className="notSignIn" onClick={this.goToSignIn}>登录/注册</View>
              }
            </View>
            <View
              className="levelPower flex-row flex-ac flex-sa"
              onClick={() => { navToPage('/package/member/member') }}
            >
              <Text>等级权益</Text>
              <IconFont value="imgArrowBrown" w={10} h={20} />
            </View>
          </View>
          <View className="cardSection flex-row">
            <View
              className={`memberCard flex-col flex-sb flex1 ${!hasStoredCards && 'notStored'}`} // notStored
              onClick={this.goToLegendsCardUserCenter}
            >
              <View className="flex-row flex-ac">
                <Text>会员卡</Text>
                <IconFont color="#F8CE70" ml={6} value="icon-arrow-right-copy-copy" size={34} />
              </View>
              <Text className="cardNumber">{judgeLegendsCard(islandUserMemberDTO) ? islandUserMemberDTO.memberCardNo : '请购买会员卡' }</Text>
              <Text className="deadline">{judgeLegendsCard(islandUserMemberDTO) ? dayjs(islandUserMemberDTO.memberEndTime).format('YYYY-MM-DD') : ''}</Text>
            </View>
            {hasStoredCards && (
              <View
                onClick={() => {
                  if (memberCardListRespDTOs.length) navToPage('/package/storedMoney/index/index')
                  else navToPage('/package/storedMoney/cardList/cardList')
                }}
                className="storedMoney flex-col flex-sb flex1"
              >
                <View className="flex-row flex-ac">
                  <Text>储值卡</Text>
                  <IconFont color="#643019" ml={6} value="icon-arrow-right-copy-copy" size={34} />
                </View>
                <Text className="balance">{`￥${formatCurrency(allStoredMoney)}`}</Text>
                <Text className="deadline">永久有效</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* {
          isAccounts && (
            <View className="accounts flex-row flex-ac flex-sb">
              <Text>您还未关注公众号，关注后及时获取最新动态信息</Text>
              <Text
                className="attention"
                onClick={() => {
                  navToPage('/pages/activePage/activePage?page=account')
                }}
              >
                立即关注
              </Text>
            </View>
          )
        } */}
       
        <View className="userNav flex-row">
          <View
            className="navItem flex-col flex-ac flex-gw flex-jc"
            hoverClass="clickHover"
            onClick={() => {
              navToPage('/pages/order/order')
            }}
          >
            <AtBadge value={allOrderCount <= 0 ? '' : allOrderCount} maxValue={99}>
              <IconFont w={54} h={54} value="imgOrder" />
            </AtBadge>
            <Text className="title">消费订单</Text>
          </View>
          <View
            className="navItem flex-col flex-ac flex-gw flex-jc"
            hoverClass="clickHover"
            onClick={() => { navToPage('/package/couponList/couponList') }}
          >
            <AtBadge value={taoQuanCount <= 0 ? '' : taoQuanCount} maxValue={99}>
              <IconFont w={54} h={54} value="imgOffer" />
            </AtBadge>
            <Text className="title">我的卡券</Text>
          </View>
          <View
            className="navItem flex-col flex-ac flex-gw flex-jc"
            hoverClass="clickHover"
            onClick={() => { navToPage('/pages/propaganda/propaganda') }}
          >
            <AtBadge value={promotionCount <= 0 ? '' : promotionCount}>
              <IconFont w={54} h={54} value="imgTask" />
            </AtBadge>
            <Text className="title">宣传任务</Text>
          </View>
        </View>
        <View className="userManage">
          <AtList>
            {/* <AtListItem
              title="合伙人中心"
              arrow="right"
              thumb={`${STATIC_IMG_URL}/user_partner.png`}
              onClick={() => {
                navToPage('/package/distributor/index/index')
              }}
            /> */}
            <AtListItem
              title="优惠券"
              arrow="right"
              thumb={`${STATIC_IMG_URL}/user_volume.png`}
              onClick={() => {
                navToPage('/package/userCoupons/userCoupons')
              }}
            />
            <AtListItem
              title="地址管理"
              arrow="right"
              thumb={`${STATIC_IMG_URL}/user_addr.png`}
              onClick={() => { navToPage('/package/userAddress/userAddress') }}
            />
            {/*<AtListItem*/}
              {/*title="商家入驻"*/}
              {/*arrow="right"*/}
              {/*thumb={`${STATIC_IMG_URL}/user_index.png`}*/}
              {/*onClick={() => { navToPage('/pages/businessmenStationed/stationedLogin/stationedLogin') }}*/}
            {/*/>*/}
            <AtListItem
              title="新手攻略"
              arrow="right"
              thumb={`${STATIC_IMG_URL}/user_new.png`}
              onClick={() => this.changeRaiders(true)}
            />
          </AtList>
        </View>

        {/* 广告 */}
        {
          mineAd.length > 0 && (
            <Swiper
              className="mineAd"
              circular
              indicatorDots={mineAd.length > 1}
              autoplay
            >
              {
                mineAd.map(ele => {
                  const { imageUrl, id } = ele
                  return (
                    <SwiperItem key={id}>
                      <Image
                        className="adImg"
                        src={getServerPic(imageUrl)}
                        onClick={() => { advertisingLinks(ele, this) }}
                      />
                    </SwiperItem>
                  )
                })
              }
            </Swiper>
          )
        }

        {/* 分享海报弹窗 */}
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

        {/* 关注公众号弹窗 */}
        <AtModal
          isOpened={accountsModal}
          className="accountsModal"
        >
          <AtModalContent>
            点击按钮，发送“888”关注公众号及时获取最新动态
          </AtModalContent>
          <AtModalAction>
            <Button onClick={() => this.setState({ accountsModal: false })}>关闭</Button>
            <Button onClick={() => this.setState({ accountsModal: false })} openType="contact">
              确定
            </Button>
          </AtModalAction>
        </AtModal>

        {/* 新手攻略 */}
        <View className="raidersModal">
          <NewUserRaiders 
            isShow={userRaidersModal}
            closeOnClickOverlay={true}
            changeRaiders={this.changeRaiders}
          />
        </View>
      </Block>
    )
  }
}
