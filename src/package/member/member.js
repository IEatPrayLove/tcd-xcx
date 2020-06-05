import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Image, Text,
  Swiper, SwiperItem, ScrollView
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtIcon } from 'taro-ui'
import PageLoading from '../../components/PageLoading/PageLoading'

import './member.scss'
import {
  dateFormatWithDate, getServerPic, getUserDetail, navToPage, saveUserDetail
} from '../../utils/utils'
import { STATIC_IMG_URL, PLATFORM_ID } from '../../config/baseUrl'

@connect(({ loading: { effects } }) => ({ effects }))
export default class Member extends PureComponent {
  config = {
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
    navigationBarTitleText: '等级权益'
  };

  constructor() {
    super()
    this.state = {
      current: getUserDetail().grade - 1,
      gradeList: [], // 等级及等级下的所有权益
      rightsList: [], // 所有权益
      upgradeRaiders: [], // 升级攻略
      modalVisible: false,
      modalVisible2: false,
      couponsList: [],
      grades: 0,
      userDetail: {}
    }
  }

  async componentDidMount() {
    this.getLevelInfoAction()
    const { dispatch } = this.props
    let allGrade = {}
    await dispatch({
      type: 'mine/getMemberGradePeopleNumAction',
      callback: ({ ok, data }) => {
        if (ok) {
          allGrade = data
        }
      }
    })
    dispatch({
      type: 'mine/getUserMemberConfigAction',
      callback: ({ ok, data: rights }) => {
        if (ok) {
          const gradeList = allGrade.reduce((
            acc, {
              grade, name, growthValue, userNum
            }
          ) => (
            [...acc, {
              rights: rights.filter(({ userGrade }) => (
                userGrade.findIndex(({ usergrade: rightGrade }) => rightGrade === grade) !== -1
              )),
              name,
              growthValue,
              grade,
              userNum
            }]
          ), [])
          this.setState({
            gradeList,
            rightsList: rights
          })
        }
      }
    })
    dispatch({
      type: 'mine/getUpgradeRaidersAction',
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            upgradeRaiders: data
          })
        }
      }
    })
    dispatch({
      type: 'mine/getUserMemberInfoAction',
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            userDetail: data
          })
        }
      }
    })
  }

  swiperChange = ({ detail: { current } }) => {
    // this.setState({ current })
  }

  // 获取升级信息
  getLevelInfoAction = () => {
    this.props.dispatch({
      type: 'rightsDescription/getLevelInfoAction',
      payload: {
        platformId: PLATFORM_ID,
        userId: getUserDetail().id
      },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            grades: data.grade,
            couponsList: data.islandCouponUseHistoryDTOS ? data.islandCouponUseHistoryDTOS : [],
            modalVisible: data.popUp && data.islandCouponUseHistoryDTOS && data.islandCouponUseHistoryDTOS.length > 0,
            modalVisible2: data.popUp && (!data.islandCouponUseHistoryDTOS || data.islandCouponUseHistoryDTOS.length === 0)
          })
        }
      }
    })
  }

  // 设置弹窗已读状态
  setLevelStatusAction = () => {
    this.props.dispatch({
      type: 'rightsDescription/setLevelStatusAction',
      payload: {
        platformId: PLATFORM_ID
      },
      callback: ({ ok, data }) => {}
    })
  }

  getLevelState = (userGrade, grade) => ((userGrade >= grade) ? (userGrade === grade ? '当前等级' : '已达到') : '待升级')

  render() {
    const {
      current, gradeList, rightsList,
      upgradeRaiders, modalVisible, modalVisible2, couponsList, grades,
      userDetail
    } = this.state
    const {
      nickName, grade: userGrade, registerTime = '', headPic,
      growthValue: userGrowthValue, grade, couponList
    } = userDetail
    const { effects = {} } = this.props
    return (
      <Block>
        {
          (
            effects['mine/getMemberGradePeopleNumAction']
            || effects['mine/getMemberGradePeopleNumAction']
            || effects['mine/getUpgradeRaidersAction']
            || effects['mine/getUserMemberInfoAction']
          ) && (
            <PageLoading />
          )
        }
        <View className="pageOn">
          <View className="userDetail flex-row">
            <Image className="avatar" src={getServerPic(headPic)} />
            <View className="info flex1 flex-col flex-sb">
              <View>
                <View className="name ellipsis">{nickName}</View>
                <Text className="level">
                  Tv
                  {userGrade}
                </Text>
              </View>
              <View className="signUpTime">
                注册时间:
                {registerTime.split('T')[0]}
              </View>
            </View>
            <View className="growthValue flex-col flex-ac">
              <Text>{userGrowthValue}</Text>
              <Text>成长值</Text>
            </View>
          </View>
          <View className="levelLine flex-row flex-jc">
            {
              gradeList.map(ele => {
                const { name, grade: memberGrade } = ele
                return (
                  <View key={memberGrade} className={`levelItem flex-row flex-ac ${memberGrade - 1 <= current && 'active'}`}>
                    <View className="circle">
                      <Text className="level">{name}</Text>
                    </View>
                  </View>
                )
              })
            }
          </View>
          <Swiper
            className="swiperLevel"
            previousMargin={Taro.pxTransform(60)}
            nextMargin={Taro.pxTransform(60)}
            current={current}
            onChange={this.swiperChange}
          >
            {
              gradeList.map((ele, index) => {
                const {
                  growthValue, name: gradeName, grade,
                  rights, userNum
                } = ele
                const growth = userGrade >= grade
                return (
                  <SwiperItem key={grade}>
                    <View className="swiperItem">
                      <View className="flex-row flex-sb">
                        <View className="levelLeft flex-col">
                          <View className="title">
                            <Text>{gradeName}</Text>
                            <Text>{this.getLevelState(userGrade, grade)}</Text>
                          </View>
                          <Text className="growthValue">
                            {growth ? `当前成长值${userGrowthValue}` : `成长值达到${growthValue}即可升级`}
                          </Text>
                          <Text className="peopleNum">{`已有${userNum}人达到该等级`}</Text>
                        </View>
                        <View className="levelLog">
                          {
                            index === 0 ? <Image className="levelImg" src={`${STATIC_IMG_URL}/level/1.png`} />
                              : (index === 1 ? <Image className="levelImg" src={`${STATIC_IMG_URL}/level/2.png`} />
                                : (index === 2 ? <Image className="levelImg" src={`${STATIC_IMG_URL}/level/3.png`} />
                                  : (index === 3 ? <Image className="levelImg" src={`${STATIC_IMG_URL}/level/4.png`} />
                                    : (index === 4 ? <Image className="levelImg" src={`${STATIC_IMG_URL}/level/5.png`} />
                                      : (index === 5 ? <Image className="levelImg" src={`${STATIC_IMG_URL}/level/6.png`} />
                                        : (index === 6 ? <Image className="levelImg" src={`${STATIC_IMG_URL}/level/7.png`} />
                                          : (index === 7 ? <Image className="levelImg" src={`${STATIC_IMG_URL}/level/8.png`} /> : '')))))))
                          }
                        </View>
                      </View>
                      <View className="rightsWarp">
                        {
                          rightsList.map(o => {
                            const {
                              name, logo, unlitLogo, id: rightId
                            } = o
                            const { rights: curRights } = ele
                            const isRight = curRights.findIndex(({ id }) => id === rightId)
                            return (
                              <View
                                className="rightsItem"
                                key={rightId}
                                onClick={() => {
                                  navToPage('/pages/rightsDescription/rightsDescription')
                                }}
                              >
                                <Image src={getServerPic(isRight !== -1 ? logo : unlitLogo)} />
                                <Text className="ellipsis">{name}</Text>
                              </View>
                            )
                          })
                        }
                      </View>
                    </View>
                  </SwiperItem>
                )
              })
            }
          </Swiper>
        </View>
        <ScrollView
          className="flex1 upgrade"
          scrollY
        >
          <Text className="title flex-row flex-ac flex-jc">升级攻略</Text>
          <View className="upgradeCondition">
            {
              upgradeRaiders.map(ele => {
                const { name, id, value } = ele
                return (
                  <View key={id} className="condition flex-row flex-ac flex-sb">
                    <Text>{name}</Text>
                    <Text>{`+${value}`}</Text>
                  </View>
                )
              })
            }
          </View>
        </ScrollView>
        {
          modalVisible && (
            <View className="rightsModalMask">
              <View className="rightsModalBox">
                <Image src={`${STATIC_IMG_URL}/right_head.png`} />
                <View className="rightModalTitle">
                  恭喜你升级到Tv
                  {grade}
                  获升级礼包
                </View>
                <View className="rightsModalBody">
                  <View className="rightsModalList">
                    {
                      couponsList && couponsList.map((item, index) => (
                        <View className="rightsModalItem" key={index}>
                          <View className="rightsItemLeft">
                            <Text className="rightsItemSign">￥</Text>
                            <Text className="rightsItemMoney">{item.amountOfCoupon}</Text>
                            <View className="rightsItemCondition">{item.useType === '满减券' ? `满${item.demandPrice}可用` : '无门槛'}</View>
                          </View>
                          <View className="rightsItemRight">
                            <View className="rightsItemTitle">
                              <Text className="rightsItemTitleTip">礼包券</Text>
                              {item.couponName}
                            </View>
                            <View className="rightsItemTime">
                              {dateFormatWithDate(item.insertDate, 'yyyy.MM.dd')}
                              {' '}
                              -
                              {' '}
                              {dateFormatWithDate(item.endDate, 'yyyy.MM.dd')}
                            </View>
                          </View>
                        </View>
                      ))
                    }
                  </View>
                  <View className="rightsModalTip">礼包券已到”我的-优惠券“</View>
                  <View
                    className="rightsModalBtn"
                    onClick={() => {
                      navToPage('/package/userCoupons/userCoupons')
                      this.setLevelStatusAction()
                    }}
                  >
                    去查看
                  </View>
                </View>
              </View>
              <View
                className="rightsModalClose"
                onClick={() => {
                  this.setState({
                    modalVisible: false
                  }, () => {
                    this.setLevelStatusAction()
                  })
                }}
              >
                <AtIcon value="close-circle" size="30" color="#fff" />
              </View>
            </View>
          )
        }
        {
          modalVisible2 && (
            <View className="rightsModalMask">
              <View className="rightsModalBox" style={{ marginTop: '20%' }}>
                <Image src={`${STATIC_IMG_URL}/right_head.png`} />
                <View className="rights-content">
                  <View className="rights-content-title">恭喜你升级到</View>
                  <View className="rights-content-level">
                    Tv
                    {grades}
                  </View>
                  <View
                    className="rights-content-btn"
                    onClick={() => {
                      this.setState({
                        modalVisible2: false
                      }, () => {
                        this.setLevelStatusAction()
                      })
                    }}
                  >
                    我知道了
                  </View>
                </View>
              </View>
              <View
                className="rightsModalClose"
                onClick={() => {
                  this.setState({
                    modalVisible2: false
                  }, () => {
                    this.setLevelStatusAction()
                  })
                }}
              >
                <AtIcon value="close-circle" size="30" color="#fff" />
              </View>
            </View>
          )
        }
      </Block>
    )
  }
}
