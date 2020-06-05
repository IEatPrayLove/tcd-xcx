import Taro from '@tarojs/taro'
import {
  View, Block, Image, Text, Button,
  ScrollView
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtGrid, AtMessage, AtActivityIndicator } from 'taro-ui'
import './platformCertification.scss'
import { SERVER_IMG } from '../../config/baseUrl'
import { getServerPic, hideLoading, navToPage, showLoading } from '../../utils/utils'
import IconFont from '../../components/IconFont/IconFont'

@connect(({ loading: { effects }, mine: { talentPlatform } }) => ({
  effects, talentPlatform
}))
export default class PlatformCertification extends Taro.PureComponent {
  config = {
    navigationBarTitleText: '达人中心',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      channel: {},
      selectChannel: {}
    }
  }

  componentWillMount() {
    const { dispatch } = this.props
    dispatch({
      type: 'mine/getTalentInfoAction',
      callback: ({ ok, data }) => {
        if (ok) {
          const { authList = [] } = data
          this.setState({
            channel: data
          })
          if (authList.length > 0) {
            this.setState({
              selectChannel: authList[0]
            })
          }
        }
      }
    })
  }

  goToUserCertification = number => {
    showLoading('加载中')
    const { channel: { noAuthList = [] } } = this.state
    this.examineCertification(noAuthList[number].id, () => {
      this.$preload(noAuthList[number])
      navToPage('/pages/userCertification/userCertification')
    })
  }

  reCertification = platformInfo => {
    showLoading('加载中')
    this.examineCertification(platformInfo.id, () => {
      this.$preload({ ...platformInfo, update: true })
      navToPage('/pages/userCertification/userCertification')
    })
  }

  examineCertification = (placeId, fuc) => {
    this.props.dispatch({
      type: 'mine/examineCertificationAction',
      payload: { placeId },
      callback: ({ ok, data }) => {
        hideLoading()
        if (ok) {
          if (!data) {
            fuc()
          } else {
            Taro.atMessage({
              message: '您已提交认证, 审核中!',
              type: 'error'
            })
          }
        }
      }
    })
  }

  renderNoAuth = () => {
    const { channel: { noAuthList = [] } } = this.state
    return (
      <View className="noAuth">
        {
          noAuthList.map((ele, index) => {
            const { logo, name, id } = ele
            return (
              <View
                className="item flex-row flex-ac"
                key={id}
                onClick={() => {
                  this.goToUserCertification(index)
                }}
              >
                <Image mode="aspectFill" src={getServerPic(logo)} />
                <Text className="channelName flex1">{name}</Text>
                <View>
                  <Text className="immediately">立即认证</Text>
                  <IconFont value="icon-arrow-right-copy-copy" size={26} />
                </View>
              </View>
            )
          })
        }
      </View>
    )
  }

  renderAuth = () => {
    const {
      channel: { authList = [] },
      selectChannel: { id: channelId }
    } = this.state
    return (
      <ScrollView
        className="renderAuth"
        scrollX
      >
        {
          authList.map(ele => {
            const {
              islandPromotionExpertAuthDTOS: [{
                placeName
              }], logo, id
            } = ele
            return (
              <View className="channel" key={id}>
                <View
                  className={`warp flex-col flex-ac flex-jc ${channelId === id && 'active'}`}
                  onClick={() => {
                    this.setState({
                      selectChannel: ele
                    })
                  }}
                >
                  <Image mode="aspectFill" src={getServerPic(logo)} />
                  <Text className="ellipsis">{placeName}</Text>
                </View>
              </View>
            )
          })
        }
      </ScrollView>
    )
  }

  render() {
    const {
      channel: { authList = [], noAuthList = [] },
      effects = {}, selectChannel
    } = this.state
    const {
      islandPromotionExpertAuthDTOS = [{}]
    } = selectChannel
    const [{
      placeName, placeUserName, fansNum, checkGrade,
      placeUserId, grade
    }] = islandPromotionExpertAuthDTOS
    return (
      <Block>
        {
          effects['mine/examineCertificationAction']
          && (
            <View className="atLoading">
              <AtActivityIndicator mode="center" size={50} />
            </View>
          )
        }
        {
          authList.length > 0
          && (
            <Block>
              <View className="title flex-row flex-ac">
                <View className="state flex1">已认证平台：</View>
                <View
                  className="certificationRecord"
                  onClick={() => {
                    navToPage('/pages/certificationRecord/certificationRecord')
                  }}
                >
                  认证记录
                </View>
              </View>
              {this.renderAuth()}
              <View className="talentInfo flex-row flex-wrap">
                <View className="item">
                  <Text>
                    {placeName}
                    名称：
                  </Text>
                  <View className="ellipsis">{placeUserName}</View>
                </View>
                <View className="item">
                  <Text>
                    { placeName === '微信' ? '好友数：' : '粉丝数：'}
                  </Text>
                  <View>{fansNum}</View>
                </View>
                <View className="item">
                  <Text>
                    {placeName}
                    账号：
                  </Text>
                  <View>{placeUserId}</View>
                </View>
                <View className="item">
                  <Text>
                    认证等级：
                  </Text>
                  <View>{checkGrade}</View>
                </View>
                {
                  grade && (
                    <View className="item">
                      <Text>
                        {`${placeName}等级：`}
                      </Text>
                      <View>{grade}</View>
                    </View>
                  )
                }
                <Button
                  className="againBtn"
                  onClick={() => {
                    this.reCertification(selectChannel)
                  }}
                >
                  重新认证
                </Button>
              </View>
            </Block>
          )
        }
        {
          noAuthList.length > 0
          && (
            <Block>
              <View className="title flex-row flex-ac">
                <View className="state flex1">未认证平台：</View>
                {
                  authList.length <= 0 && (
                    <View
                      className="certificationRecord"
                      onClick={() => {
                        navToPage('/pages/certificationRecord/certificationRecord')
                      }}
                    >
                      认证记录
                    </View>
                  )
                }
              </View>
              {this.renderNoAuth()}
            </Block>
          )
        }
        <AtMessage />
      </Block>
    )
  }
}
