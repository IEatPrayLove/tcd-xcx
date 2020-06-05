import Taro from '@tarojs/taro'
import {
  View, Image, Text, Swiper, SwiperItem
} from '@tarojs/components'
import { AtIcon } from 'taro-ui'
import './rightsDescription.scss'
import { connect } from '@tarojs/redux'
import { getUserDetail, dateFormatWithDate, navToPage, getSysInfo } from '../../utils/utils'
import { STATIC_IMG_URL } from '../../config/baseUrl'

@connect(({ loading: { effects } }) => ({
  effects
}))
export default class rightsDescription extends Taro.PureComponent {
  config = {
    navigationBarTitleText: '权益介绍',
    navigationBarBackgroundColor: '#fff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      rightsList: [
        { checked: true, name: '升级礼包' },
        { checked: false, name: '霸王餐抽取' },
        { checked: false, name: '会员卡' },
        { checked: false, name: '体验官' },
        { checked: false, name: '百元礼品卡' },
        { checked: false, name: 'TC俱乐部' },
        { checked: false, name: '年会优先入选' }
      ],
      nowIndex: 0
    }
  }

  componentWillMount() {

  }



  render() {
    const {
      rightsList, nowIndex
    } = this.state
    const { windowWidth } = getSysInfo()
    const ratio = 750 / windowWidth
    return (
      <View className="rightsBox">
        <Swiper
          className="descContainer"
          previousMargin={277 / ratio}
          nextMargin={277 / ratio}
          onChange={e => {
            const { detail: { current: index } } = e
            const list = JSON.parse(JSON.stringify(rightsList))
            list.map((one, num) => {
              if (index === num) {
                one.checked = true
              } else {
                one.checked = false
              }
            })
            this.setState({
              rightsList: list,
              nowIndex: index
            })
          }}
        >
          {
            rightsList && rightsList.map((item, index) => (
              <SwiperItem
                key={index}
                className="rightsHeaderItem"
              >
                {
                  index === 0 ? (!item.checked ? <Image src={`${STATIC_IMG_URL}/rights/icon1.png`} /> : <Image src={`${STATIC_IMG_URL}/rights/icon1_check.png`} />)
                    : (index === 1 ? (!item.checked ? <Image src={`${STATIC_IMG_URL}/rights/icon2.png`} /> : <Image src={`${STATIC_IMG_URL}/rights/icon2_check.png`} />)
                    : (index === 2 ? (!item.checked ? <Image src={`${STATIC_IMG_URL}/rights/icon3.png`} /> : <Image src={`${STATIC_IMG_URL}/rights/icon3_check.png`} />)
                      : (index === 3 ? (!item.checked ? <Image src={`${STATIC_IMG_URL}/rights/icon4.png`} /> : <Image src={`${STATIC_IMG_URL}/rights/icon4_check.png`} />)
                        : (index === 4 ? (!item.checked ? <Image src={`${STATIC_IMG_URL}/rights/icon5.png`} /> : <Image src={`${STATIC_IMG_URL}/rights/icon5_check.png`} />)
                          : (index === 5 ? (!item.checked ? <Image src={`${STATIC_IMG_URL}/rights/icon6.png`} /> : <Image src={`${STATIC_IMG_URL}/rights/icon6_check.png`} />)
                            : (index === 6 ? (!item.checked ? <Image src={`${STATIC_IMG_URL}/rights/icon7.png`} /> : <Image src={`${STATIC_IMG_URL}/rights/icon7_check.png`} />) : ''))))))
                }
                <View className="rightsHeaderName">{item.name}</View>
              </SwiperItem>
            ))
          }
        </Swiper>
        <View className="arrow" />
        <View className="rightsBody">
          <View className="rightsBanner">
            {
              nowIndex === 0 ? <Image src={`${STATIC_IMG_URL}/rights/right1.png`} />
                : (nowIndex === 1 ? <Image src={`${STATIC_IMG_URL}/rights/right2.png`} />
                  : (nowIndex === 2 ? <Image src={`${STATIC_IMG_URL}/rights/right3.png`} />
                    : (nowIndex === 3 ? <Image src={`${STATIC_IMG_URL}/rights/right4.png`} />
                      : (nowIndex === 4 ? <Image src={`${STATIC_IMG_URL}/rights/right5.png`} />
                        : (nowIndex === 5 ? <Image src={`${STATIC_IMG_URL}/rights/right6.png`} />
                          : (nowIndex === 6 ? <Image src={`${STATIC_IMG_URL}/rights/right7.png`} /> : ''))))))
            }
          </View>
          <View className="rightsUse">
            <View className="rightsLevelTitle">使用指南</View>
            {
              nowIndex === 0 && (
              <View className="rightsUseBody">
                <View className="rightsUseWord">1、升级礼-包，指Lv会员升级到新等级时，奖励的优惠券礼包，礼包由抵用券等奖品构成，等级越高，礼包价值越高.</View>
                <View className="rightsUseWord">2、升级时，礼包将由【平台】公众号推送消息告知，领取后，可进入平台小程序-我的-卡券包查看并使用.</View>
                <View className="rightsUseWord">3、抵用券请在对应的使用有效期内使用，具体使用规则可点击对应券进行查看.</View>
                <View className="rightsUseWord">4、每个用户每个等级仅可领取一次升级礼包</View>
                <View className="rightsUseWord">5、如发现违规作弊行为(包含但不限于冒充身份、虚假评价、虚假刷单等)，平台将有权取消概用户后续的报名资格，必要时追究法律责任.</View>
              </View>
              )
            }
            {
              nowIndex === 1 && (
              <View className="rightsUseBody">
                <View className="rightsUseWord">1、霸王餐，是指平台Lv会员可免费报名参加霸王餐活动，等级越高、活跃度越高中奖率越高.</View>
                <View className="rightsUseWord">2、霸王餐中奖平均价值在199元，如中奖后未按规则完成对应动作，将会影响后期中奖概率.</View>
                <View className="rightsUseWord">3、霸王餐中奖后请根据使用规则，并在规定期限内使用，过期后无效.</View>
                <View className="rightsUseWord">4、如发现违规作弊行为(包含但不限于冒充身份、虚假评价、虚假刷单等)，平台将有权取消概用户后续的报名资格，必要时追究法律责任.</View>
                <View className="rightsUseWord">5、各等级权益每月不定时更新，每期内容可能不同，请以页面实际情况为准 </View>
              </View>
              )
            }
            {
              nowIndex === 2 && (
              <View className="rightsUseBody">
                <View className="rightsUseWord">1、会员卡，是指平台Lv会员可优惠购买平台原价299元/年的会员卡，享受对应黑金会员权益，等级越高购买价越便宜.</View>
                <View className="rightsUseWord">2、进入购买页面开通后，即可享受对应会员卡自购省钱、分享赚钱、团队扩展、奖金池瓜分等6大省钱权益.</View>
                <View className="rightsUseWord">3、会员卡有效期为一年，开通后无需重复开通，到期限截止后可进行对应续费开通.</View>
                <View className="rightsUseWord">4、如发现违规作弊行为(包含但不限于冒充身份、虚假评价、虚假刷单等)，平台将有权取消概用户后续的报名资格，必要时追究法律责任.</View>
                <View className="rightsUseWord">5、各等级权益每月不定时更新，每期内容可能不同，请以页面实际情况为准 </View>
              </View>
              )
            }
            {
              nowIndex === 3 && (
              <View className="rightsUseBody">
                <View className="rightsUseWord">1、体验官，指达到等级会员，即可报名参加由平台联合商户举办的菜品体验活动.</View>
                <View className="rightsUseWord">2、体验官，目前采用邀请制度，最终参与资格将以最终每期公布的竞选规则决定.</View>
                <View className="rightsUseWord">3、每期中奖邀请的体验官将在【平台】公众号进行公布，每期活动也可在平台平台公众号、抖音、微博获取最新消息.</View>
                <View className="rightsUseWord">4、如发现违规作弊行为(包含但不限于冒充身份、虚假评价、虚假刷单等)，平台将有权取消概用户后续的报名资格，必要时追究法律责任.</View>
                <View className="rightsUseWord">5、各等级权益每月不定时更新，每期内容可能不同，请以页面实际情况为准 </View>
              </View>
              )
            }
            {
              nowIndex === 4 && (
              <View className="rightsUseBody">
                <View className="rightsUseWord">1、百元礼品卡，指L8会员可免费获得一张价值100元的平台礼品卡，如遇领取失败情况，请通过客服联系我们.</View>
                <View className="rightsUseWord">2、激活流程：达到等级后系统会自动触发一张卡在你的卡券中，点击激活即可将卡内金额转到余额中.</View>
                <View className="rightsUseWord">3、平台礼品卡激活后，3年内有效。该卡内余额可在平台通用，无门槛使用，但不可提现.</View>
                <View className="rightsUseWord">4、如发现违规作弊行为(包含但不限于冒充身份、虚假评价、虚假刷单等)，平台将有权取消概用户后续的报名资格，必要时追究法律责任.</View>
                <View className="rightsUseWord">5、各等级权益每月不定时更新，每期内容可能不同，请以页面实际情况为准 </View>
              </View>
              )
            }
            {
              nowIndex === 5 && (
              <View className="rightsUseBody">
                <View className="rightsUseWord">1、会员卡，是指平台Lv会员可优惠购买平台原价299元/年的会员卡，享受对应黑金会员权益，等级越高购买价越便宜.</View>
                <View className="rightsUseWord">2、进入购买页面开通后，即可享受对应会员卡自购省钱、分享赚钱、团队扩展、奖金池瓜分等6大省钱权益.</View>
                <View className="rightsUseWord">3、会员卡有效期为一年，开通后无需重复开通，到期限截止后可进行对应续费开通.</View>
                <View className="rightsUseWord">4、如发现违规作弊行为(包含但不限于冒充身份、虚假评价、虚假刷单等)，平台将有权取消概用户后续的报名资格，必要时追究法律责任.</View>
                <View className="rightsUseWord">5、各等级权益每月不定时更新，每期内容可能不同，请以页面实际情况为准 </View>
              </View>
              )
            }
            {
              nowIndex === 6 && (
              <View className="rightsUseBody">
                <View className="rightsUseWord">1、年会优先入选，指会员可以报名参加年度举办的平台会员年终盛典。年终盛典除了可以和其它会员交流以外，还可获得年终会福利大礼包。</View>
                <View className="rightsUseWord">2、年终盛典会员均可报名参与，最终参与资格由每年年终盛典公布的竞选规则决定，其中Lv.6~Lv.8会员被成功邀请的概率更高.</View>
                <View className="rightsUseWord">3、更多年终盛典详情，可在每年11月开始关注【平台】公众号、微博、抖音获取最新通知消息哦！</View>
                <View className="rightsUseWord">4、如发现违规作弊行为(包含但不限于冒充身份、虚假评价、虚假刷单等)，平台将有权取消概用户后续的报名资格，必要时追究法律责任.</View>
                <View className="rightsUseWord">5、各等级权益每月不定时更新，每期内容可能不同，请以页面实际情况为准 </View>
              </View>
              )
            }
          </View>
        </View>
      </View>
    )
  }
}
