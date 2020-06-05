import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Text, Image, Button
} from '@tarojs/components'
import {
  AtList, AtListItem, AtCurtain
} from 'taro-ui'
import {
  connect
} from '@tarojs/redux'
import './index.scss'
import {
  getServerPic, getUserDetail, getUserDistributor, navToPage, needLogin, objNotNull, judgeLegendsCard
} from '../../utils/utils'
import IconFont from '../../components/IconFont/IconFont'
import { STATIC_IMG_URL } from '../../config/baseUrl'
import {
  TUTORIAL_IMG
} from '../../config/config'

// import distributor1 from '../../images/icon/distributor1.png'
// import distributor2 from '../../images/icon/distributor2.png'
// import distributor3 from '../../images/icon/distributor3.png'

@connect(() => ({}))
export default class DistributorIndex extends PureComponent {
  config = {
    navigationBarTitleText: '合伙人中心',
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#ffffff',
    disableScroll: true
  }

  constructor() {
    super()
    this.userDetail = getUserDetail()
    this.userDistibutor = getUserDistributor()
    this.state = {
      allLevels: [],
      distributorInfo: {},
      tutorialModal: false,
      tutorialView: [],
      tutorialStep: 0,
      bonusPool: 0
    }
  }

  componentDidShow() {
    if (!needLogin()) return
    const { islandUserMemberDTO } = getUserDetail()
    if (!judgeLegendsCard(islandUserMemberDTO)) {
      // 会员卡支付后有一定延迟，页面进入等待
      Taro.reLaunch({ url: '/pages/dredgeUnionCard/dredgeUnionCard' })
    }
    const { dispatch } = this.props
    const { distributorUserId } = this.userDistibutor
    this.userDistibutor = getUserDistributor()
    dispatch({
      type: 'distributor/distributorAllLevelAction',
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            allLevels: data
          })
        }
      }
    })
    if (distributorUserId) {
      dispatch({
        type: 'distributor/getDistributorInfoAction',
        payload: {
          distributorUserId
        },
        callback: ({ ok, data }) => {
          if (ok) {
            this.setState({
              distributorInfo: data
            })
          }
        }
      })
    }
    // 获取赏金池
    dispatch({
      type: 'common/getBonusPoolConfig',
      callback: ({ ok, data }) => {
        if (ok && objNotNull(data)) {
          const { totalMoney } = data
          if (totalMoney < 500) {
            this.setState({
              bonusPool: 32846
            })
            return
          }
          this.setState({
            bonusPool: new Number(totalMoney).toFixed(2)
          })
        }
      }
    })
  }

  viewTutorial = type => {
    this.setState({
      tutorialView: TUTORIAL_IMG[type],
      tutorialModal: false
    })
  }

  nextStep = () => {
    const { tutorialStep, tutorialView } = this.state
    if (tutorialView.length - 1 === tutorialStep) {
      this.setState({
        tutorialView: [],
        tutorialStep: 0
      })
      return
    }
    this.setState({
      tutorialStep: tutorialStep + 1
    })
  }

  render() {
    const { nickName, headPic } = this.userDetail
    const { partnerLevelModel } = this.userDistibutor
    const {
      allLevels, tutorialModal,
      tutorialView, tutorialStep,
      distributorInfo: {
        orderCount = 0,
        countTeam = 0,
        islandUserDTO = {}
      }, bonusPool
    } = this.state
    const { distributionReward = 0 } = islandUserDTO
    return (
      <Block>
        <View className="header">
          <View className="userInfo flex-row flex-ac">
            <Image src={getServerPic(headPic)} className="avatarImg" />
            <View className="flex1">
              <View className="nickName ellipsis">{nickName}</View>
              <View
                className="partner flex-row flex-ac flex-jc"
                onClick={() => { navToPage('/package/distributor/partnerGrade/partnerGrade') }}
              >
                <IconFont value="imgPartnerIcon" h={32} w={38} />
                <View className="title">合伙人</View>
                <IconFont value="icon-arrow-right-copy-copy" size={26} color="#fff" />
              </View>
            </View>
            {
              !(allLevels.length > 0 && partnerLevelModel.level === allLevels[allLevels.length - 1].level) && (
                <IconFont
                  value="imgPartnerUpgrade"
                  h={100}
                  w={100}
                  onClick={() => {
                    navToPage('/package/distributor/gradeUpgrade/gradeUpgrade')
                  }}
                />
              )
            }
          </View>
          {/* <View className="record flex-row flex-sb">
            <View className="item flex-col flex-ac">
              <Text>{distributionReward}</Text>
              <Text>累计收益（元）</Text>
            </View>
            <View className="item flex-col flex-ac">
              <Text>{orderCount}</Text>
              <Text>累计分享单</Text>
            </View>
            <View className="item flex-col flex-ac">
              <Text>{countTeam}</Text>
              <Text>团队总人数</Text>
            </View>
          </View> */}
          <View className="record">
            <View>
              <Text>当前余额(元)</Text>
            </View>
            <View className="flex-row flex-sb">
              <View className="balance">
                756.52
                </View>
              <View>
                <View className="balance-detail">余额明细</View>
                <Button className="balance-detail tixian">提现</Button>
              </View>
            </View>
          </View>
          <View className="flex-row flex-jc">
            <View
              className="distributorItem flex-row flex-ac flex-sb"
              onClick={() => { navToPage('/package/distributor/productShare/productShare') }}
            >
              <IconFont value="imgPartnerReward" h={68} w={74} />
              <View className="flex-col">
                <Text className="title">分享悬赏</Text>
                <Text className="msg">分享素材助你快捷赚钱</Text>
              </View>
            </View>
            <View
              className="distributorItem flex-row flex-ac flex-sb"
              onClick={() => { navToPage('/package/distributor/team/team') }}
            >
              <IconFont value="imgPartnerTeam" h={70} w={72} />
              <View className="flex-col">
                <Text className="title">我的团队</Text>
                <Text className="msg">团队成员越多收益越多</Text>
              </View>
            </View>
          </View>
        </View>
        <View className="distributorAd" onClick={() => { navToPage('/pages/legendsUserCenter/legendsUserCenter') }}>
          <Text>{bonusPool}</Text>
        </View>
        <View className="distributorList">
          <AtList>
            <AtListItem
              title="分享记录"
              arrow="right"
              thumb={`${STATIC_IMG_URL}/icon/distributor1.png`}
              onClick={() => {
                navToPage('/package/distributor/distributorRecord/distributorRecord')
              }}
            />
            <AtListItem
              title="新手引导"
              arrow="right"
              thumb={`${STATIC_IMG_URL}/icon/distributor3.png`}
              onClick={() => {
                this.setState({
                  tutorialModal: true
                })
              }}
            />
          </AtList>
        </View>
        {
          tutorialView.length > 0 && (
            <View className="tutorial">
              <Image
                className="tutorialImg"
                src={tutorialView[tutorialStep]}
              />
              <View className="tutorialOperate" onClick={this.nextStep}>
                {
                  tutorialStep + 1 === tutorialView.length ? <IconFont value="imgKnow" h={100} w={250} /> : <IconFont value="imgNext" h={100} w={250} />
                }
              </View>
            </View>
          )
        }
        <AtCurtain
          isOpened={tutorialModal}
          onClose={() => {
            this.setState({
              tutorialModal: false
            })
          }}
        >
          <View className="tutorialWarp">
            <View onClick={() => { this.viewTutorial('team') }}>分享单品</View>
            <View onClick={() => { this.viewTutorial('product') }}>团队邀请</View>
          </View>
        </AtCurtain>
      </Block>
    )
  }
}
