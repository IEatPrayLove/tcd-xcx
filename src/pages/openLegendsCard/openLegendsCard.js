import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Swiper, SwiperItem, Image, Text,
  Block, Button
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtBadge, AtIcon } from 'taro-ui'
import './openLegendsCard.scss'
import IconFont from '../../components/IconFont/IconFont'
import {
  getUserDetail,
  navToPage,
  judgeLegendsCard,
  parseQuery,
  setShareInfo, arrayChunk, getPlatFormInfo
} from '../../utils/utils'
import {DEFAULT_PLAT_FORM_ID, STATIC_IMG_URL} from '../../config/baseUrl'
import { DYNAMIC } from '../../config/config'
import PageLoading from '../../components/PageLoading/PageLoading'
import UserDynamic from '../../components/UserDynamic/UserDynamic'

@connect(({
  loading: effects,
  common: { userDynamic }
}) => ({
  effects, userDynamic
}))
export default class OpenLegendsCard extends PureComponent {
  config = {
    navigationBarTitleText: `${getPlatFormInfo().appName}`,
    navigationBarBackgroundColor: '#FF633D'
  }

  constructor() {
    super()
    this.state = {
      ruleVisible: false,
      imgLoading: true,
      limitPrice: 9.9
    }
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    })
  }

  componentDidShow() {
    const { dispatch } = this.props
    dispatch({
      type: 'common/shieldCardAction',
      callback: ({ ok, data }) => {
        if (ok) {
          // this.setState({
          //   development: !data
          // })
          if (!data) {
            Taro.reLaunch({ url: '/pages/activePage/activePage' })
          }
          else{
            dispatch({
              type: 'legendsCard/getLegendsCardMoneyAction',
              callback: ({ ok, data }) => {
                if (ok) {
                  this.setState({
                    limitPrice: data
                  })
                }
              }
            })
          }
        } else {
          Taro.reLaunch({ url: '/pages/activePage/activePage' })
        }
      }
    })
    const { islandUserMemberDTO } = getUserDetail()
    if (judgeLegendsCard(islandUserMemberDTO)) {
      Taro.switchTab({ url: '/package/distributor/legendsUserCenter/legendsUserCenter' })
    }
  }

  render() {
    const { ruleVisible, imgLoading, limitPrice } = this.state
    const { userDynamic } = this.props
    return (
      <Block>
        { imgLoading && <PageLoading />}
        <View className="pageWarp">
          <Image
            className="legendsImg"
            mode="widthFix"
            src={`${STATIC_IMG_URL}/legends-card.png`}
            onLoad={() => {
              this.setState({
                imgLoading: false
              })
            }}
          />
          <View className="dynamicWarp">
            <UserDynamic type={['DISTRIBUTOR', 'PROMOTION', 'USER_WITHDRAW']} data={userDynamic} />
          </View>
          <View className="pageBottom">
            <View
              className="problem flex-col flex-ac flex-jc"
              onClick={() => {
                Taro.switchTab({ url: '/pages/index/index' })
              }}
            >
              <IconFont value="imgHome" h={40} w={40} />
              <Text className="text">首页</Text>
            </View>
            <View className="pageBottomLine" />
            <View
              className="problem flex-col flex-ac flex-jc"
              onClick={() => {
                this.setState({
                  ruleVisible: true
                })
              }}
            >
              <IconFont value="imgProblem" h={40} w={40} />
              <Text className="text">
                疑问
              </Text>
            </View>
            <AtBadge value="奖金56354">
              <View
                className="nowOpen flex-col flex-ac flex-jc"
                onClick={() => {
                  navToPage('/pages/dredgeUnionCard/dredgeUnionCard')
                }}
              >
                <Text className="price">
                  {limitPrice}元立即开通
                </Text>
    {/*<Text className="des">享受权益</Text>*/}
              </View>
            </AtBadge>
          </View>
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
        </View>
      </Block>
    )
  }
}
