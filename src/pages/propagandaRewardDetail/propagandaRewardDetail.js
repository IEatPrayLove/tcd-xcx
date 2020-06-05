import Taro from '@tarojs/taro'
import {
  View, Image, Text, Swiper, SwiperItem, Block, Button
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import {
  AtButton, AtMessage, AtModal, AtModalAction, AtModalContent
} from 'taro-ui'
import './propagandaRewardDetail.scss'
import {
  getServerPic,
  dateFormatWithDate,
  objNotNull,
  navBackExeFun,
  calculateResidueTime,
  navToPage,
  getMinFans,
  getDateDiff,
  getTimeAry,
  getUserDetail,
  needLogin,
  saveCurrentLocation,
  latelyMerchant,
  getCurrentLoaction, showToast, getUserDistributor
} from '../../utils/utils'
import { ORDER_TABS, PROMOTE_TYPE_NAME } from '../../config/config'
import IconFont from '../../components/IconFont/IconFont'
import PageLoading from '../../components/PageLoading/PageLoading'
import { ALL_CITY } from '../../utils/city'

const dayjs = require('dayjs')

@connect(({ loading: { effects } }) => ({
  effects
}))
export default class propagandaRewardDetail extends Taro.PureComponent {
  config = {
    navigationBarTitleText: '',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      propagandaDetail: {},
      modalVisible: false,
      modalVisibleFail: false,
      modalVisibleGradeFail: false,
      successOrderInfo: {}, // 成功订单信息（用于跳转详情，计算剩余时间）
      failOrderChannelInfo: {}, // 失败 未认证渠道
      failOrderGradeInfo: {},
      failText: '',
      allChannel: [],
      deliveryArea: null, // 配送范围
      minShop: {} // 距离最近门店
    }
  }

  componentWillMount() {
    this.getDetail()
    const { dispatch } = this.props
    dispatch({
      type: 'propagandaReward/getAllChannelAction',
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            allChannel: data
          })
        }
      }
    })
  }

  componentDidShow() {
    if (!needLogin()) return
    this.getDetail()
  }

  // 首次进入自动定位坐标
  firstLocation = goodsDetail => {
    Taro.getLocation({
      type: 'gcj02',
      altitude: true,
      success: res => {
        if (res.errMsg === 'getLocation:ok') {
          // 获取实际位置
          this.props.dispatch({
            type: 'index/putPutLocationNameByPositionAction',
            payload: {
              position: `${res.longitude},${res.latitude}`
            },
            callback: ({ ok, data }) => {
              const {
                provinceName, cityName, areaName, position, name
              } = data
              saveCurrentLocation({
                address: `${provinceName}${cityName}${areaName}`,
                name,
                longitude: position.split(',')[0] - 0,
                latitude: position.split(',')[1] - 0
              })
              const minShop = latelyMerchant(goodsDetail.dishMerchantShippingInfo, getCurrentLoaction())
              this.loadMerchantInfo(minShop.merchantId)
              this.setState({
                deliveryArea: minShop.isDeliveryRange || false,
                minShop
              })
              this.getDetail()
            }
          })
        }
      },
      fail: res => {
        if (res.errMsg === 'getLocation:fail auth deny') {
          this.openWxSetting(goodsDetail)
        } else {
          showToast('定位失败,请手动定位')
        }
      }
    })
  }

  // 尝试打开用户授权 再进行获取
  openWxSetting = data => {
    Taro.showModal({
      title: '提示',
      content: '无法获取您的位置，请点击确定授权，授权后才能为您提供距离计算及外卖配送服务',
      success: res => {
        res.confirm && Taro.openSetting({
          success: res => {
            this.firstLocation(data)
          }
        })
      }
    })
  }

  // 小程序分享
  onShareAppMessage() {
    const detailId = this.$router.params.id
    const { code } = getUserDistributor()
    return {
      title: '推广悬赏',
      path: `/pages/propagandaRewardDetail/propagandaRewardDetail?id=${detailId}&code=${code || ''}`
    }
  }

  getDetail() {
    const detailId = this.$router.params.id
    this.props.dispatch({
      type: 'mine/getPropagandaDetailAction',
      payload: { id: detailId },
      callback: ({ ok, data }) => {
        if (ok) {
          const { platformName } = data
          Taro.setNavigationBarTitle({ title: platformName })
          this.setState({
            propagandaDetail: data
          })
        }
      }
    })
  }

  orderResidueTime = () => {
    const {
      successOrderInfo,
      successOrderInfo: { takeOrderTime, limitDay, endTime }
    } = this.state
    if (objNotNull(successOrderInfo)) {
      return calculateResidueTime(takeOrderTime, endTime, limitDay)
    }
  }

  getPropagandaOrder = (id, placeId) => {
    this.props.dispatch({
      type: 'propagandaReward/getPropagandaOrderAction',
      payload: { id },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            modalVisible: true,
            successOrderInfo: data
          })
          this.getDetail()
          navBackExeFun(id, 2, 'refreshTakeOrder', true)
        } else {
          if (data.message === '还未认证该渠道') {
            const { allChannel } = this.state
            this.setState({
              failOrderChannelInfo: allChannel.find(({ id: channelId }) => channelId === placeId),
              failText: data.message,
              modalVisibleFail: true
            })
            return
          }
          if (data.message === '你的等级没有达到宣发单要求等级哦') {
            const { allChannel } = this.state
            this.setState({
              failOrderGradeInfo: allChannel.find(({ id: channelId }) => channelId === placeId),
              modalVisibleGradeFail: true
            })
            return
          }
          Taro.atMessage({
            message: data.message,
            type: 'error'
          })
        }
      }
    })
  }

  // 渲染弹框操作按钮
  renderOperatingBtn = () => {
    const { successOrderInfo: { id } } = this.state
    const knowBtn = (
      <Button
        onClick={() => {
          this.setState({
            modalVisible: false
          })
        }}
      >
        知道了
      </Button>
    )
    const kookBtn = (
      <Button onClick={() => {
        this.setState({
          modalVisible: false
        })
        navToPage(`/pages/propagandaDetail/propagandaDetail?id=${id}`)
      }}
      >
        查看任务
      </Button>
    )
    return (
      <Block>
        {knowBtn}
        {kookBtn}
      </Block>
    )
  }

  getAddress = detail => {
    const { merchantCity, merchantProvince } = detail
    return ALL_CITY.filter(({ region_id }) => region_id === merchantCity || region_id === merchantProvince)
      .map(({ region_name }) => region_name).join('-')
  }

  render() {
    const {
      propagandaDetail, propagandaDetail: {
        islandUserModels = [], state: status,
        endTime, startTime, brandPromotePic
      },
      modalVisible, modalVisibleFail, modalVisibleGradeFail,
      failText, failOrderChannelInfo
    } = this.state
    const { effects = {} } = this.props
    const { id: userId } = getUserDetail()
    const isJoin = islandUserModels.findIndex(({ id: joinId }) => joinId === userId)
    const needPerson = propagandaDetail.numberPeople - propagandaDetail.takeCount
    return (
      <Block>
        {
          effects['mine/getPropagandaDetailAction'] && (
            <PageLoading />
          )
        }
        <View className="propagandaDetailSwiper">
          <Image src={getServerPic(brandPromotePic)} />
        </View>
        <View className="propagandaDetailBody">
          <View className="propagandaInfo">
            <View className="propagandaInfoTitle">
              <Text>
                {propagandaDetail.placeName}
                :
                {objNotNull(propagandaDetail) && PROMOTE_TYPE_NAME.find(o => o.key === propagandaDetail.promoteTypeName).name}
              </Text>
              <Text>
                {propagandaDetail.reward}
              </Text>
            </View>
            <View className="propagandaInfoPerson">
              <View className="infoPersonList flex-row flex-ac">
                {
                  islandUserModels && islandUserModels.length > 0 && (
                    <Block>
                      {
                        islandUserModels.slice(0, 3).map((item, index) => (
                          <View className="infoPersonItem" key={index}>
                            <Image src={getServerPic(item.head_pic)} />
                          </View>
                        ))
                      }
                      <View className="omit">...</View>
                    </Block>
                  )
                }
              </View>
              <View className="infoPersonCount">
                还需
                <Text>{propagandaDetail.numberPeople - propagandaDetail.takeCount}</Text>
                人
              </View>
            </View>
          </View>
          <View className="propagandaDetailContent">
            <View className="detailContentTitle">
              <View className="detailContentTitleCircle" />
              <Text>商家信息</Text>
            </View>
            <View className="detailStoreInfo">
              <View className="detailStoreInfoImg">
                <Image src={getServerPic(propagandaDetail.merchantHeadPic)} />
              </View>
              <View className="detailStoreInfoRight">
                <View className="storeInfoRightTitle">{propagandaDetail.platformName}</View>
                <View className="storeInfoRightWord">{propagandaDetail.merchantBusiness ? propagandaDetail.merchantBusiness : ''}</View>
              </View>
            </View>
            <View className="detailStoreRow">
              门店地址：
              <Text className="detailStoreRowWord">{this.getAddress(propagandaDetail)}</Text>
            </View>
            <View className="detailStoreRow">
              品牌介绍：
              <Text className="detailStoreRowWord">{propagandaDetail.merchantDetails ? propagandaDetail.merchantDetails : '暂无'}</Text>
            </View>
            <View className="line" />
            <View className="detailContentTitle mar-t">
              <View className="detailContentTitleCircle" />
              <Text>任务内容</Text>
            </View>
            <View className="detailStoreRow">
              推广渠道：
              <Text>{propagandaDetail.placeName}</Text>
            </View>
            <View className="detailStoreRow">
              达人要求：
              <text>
                {propagandaDetail.placeName}
                {
                  (propagandaDetail.placeName === '抖音' || propagandaDetail.placeName === '微信') ? getMinFans(propagandaDetail.expertGradeFansNumbers) : propagandaDetail.expertGradeFansNumbers
                }
                {
                  propagandaDetail.placeName === '抖音' ? '粉丝' : (propagandaDetail.placeName === '微信' ? '好友' : '等级')
                }
              </text>
            </View>
            <View className="detailStoreRow">
              具体要求：
              <Text>{propagandaDetail.requirementDescription}</Text>
            </View>
            <View className="detailStoreRow">
              具体事件：
              <Text>{propagandaDetail.event}</Text>
            </View>
            <View className="detailStoreRow">
              任务有效时间：
              <Text>
                {propagandaDetail.limitDay}
天
              </Text>
            </View>
            <View className="detailStoreRow">
              截止时间：
              <Text className="detailStoreRowWordRed">{propagandaDetail.endTime && propagandaDetail.endTime.replace('T', ' ')}</Text>
            </View>
          </View>
          <View className="orderTakingBox flex-row flex-ac">
            <View className="deadline">
              {status === 0 ? '开始日期：' : '截止日期：'}
              <Text className="time">{dayjs(status === 0 ? startTime : endTime || '').format('MM-DD HH:mm')}</Text>
            </View>
            <Button
              className={`takeOrderBtn ${status === 1 && isJoin === -1 && propagandaDetail.havePermissionTakeOrder + '' !== 'false' && needPerson > 0 ? 'redBtn' : 'garyBtn'}`}
              loading={effects['propagandaReward/getPropagandaOrderAction']}
              disabled={effects['propagandaReward/getPropagandaOrderAction']}
              onClick={() => {
                if (status === 1 && isJoin === -1 && propagandaDetail.havePermissionTakeOrder + '' !== 'false' && needPerson > 0) {
                  this.getPropagandaOrder(propagandaDetail.id, propagandaDetail.placeId)
                }
              }}
            >
              {
                status === -1 ? '已结束'
                  : status === 0 ? '未开始'
                    : status === 1 ? (isJoin === -1 && (propagandaDetail.havePermissionTakeOrder + '' !== 'false') ? needPerson > 0 ? '我要接单' : '有机会' : '已接单' ) : '未知'
              }
            </Button>
          </View>
        </View>
        {/* 成功弹窗 */}
        <AtModal
          isOpened={modalVisible}
          className="confirmModal"
        >
          <AtModalContent>
            <View className="success flex-col flex-ac">
              <Text>提交成功!</Text>
              <Text>
                剩余时间：
                {this.orderResidueTime()}
              </Text>
            </View>
          </AtModalContent>
          <AtModalAction>
            {this.renderOperatingBtn()}
          </AtModalAction>
        </AtModal>
        {/* 失败：未认证 */}
        <AtModal
          isOpened={modalVisibleFail}
          className="confirmModal"
          onClose={() => {
            this.setState({
              modalVisibleFail: false
            })
          }}
        >
          <AtModalContent>
            <Text>{failText}</Text>
          </AtModalContent>
          <AtModalAction>
            <Button onClick={() => {
              this.setState({
                modalVisibleFail: false
              })
            }}
            >
              暂不认证
            </Button>
            <Button onClick={() => {
              const { failOrderChannelInfo: { id } } = this.state
              this.props.dispatch({
                type: 'mine/examineCertificationAction',
                payload: { placeId: id },
                callback: ({ ok, data }) => {
                  if (ok) {
                    this.setState({
                      modalVisibleFail: false
                    })
                    if (!data) {
                      this.$preload({ ...failOrderChannelInfo })
                      navToPage('/pages/userCertification/userCertification')
                    } else {
                      Taro.atMessage({
                        message: '您已提交认证, 审核中!',
                        type: 'error'
                      })
                    }
                  }
                }
              })
            }}
            >
              立即认证
            </Button>
          </AtModalAction>
        </AtModal>
        {/* 失败：等级不够 */}
        <AtModal
          isOpened={modalVisibleGradeFail}
          className="confirmModal"
          onClose={() => {
            this.setState({
              modalVisibleGradeFail: false
            })
          }}
        >
          <AtModalContent>
            <Text>你的等级没有达到宣发单要求等级哦</Text>
          </AtModalContent>
          <AtModalAction>
            <Button onClick={() => {
              this.setState({
                modalVisibleGradeFail: false
              })
            }}
            >
              暂不认证
            </Button>
            <Button onClick={() => {
              const { failOrderGradeInfo, failOrderGradeInfo: { id } } = this.state
              this.props.dispatch({
                type: 'mine/examineCertificationAction',
                payload: { placeId: id },
                callback: ({ ok, data }) => {
                  if (ok) {
                    this.setState({
                      modalVisibleGradeFail: false
                    })
                    if (!data) {
                      this.$preload({ ...failOrderGradeInfo, update: true })
                      navToPage('/pages/userCertification/userCertification')
                    } else {
                      Taro.atMessage({
                        message: '您已提交认证, 审核中!',
                        type: 'error'
                      })
                    }
                  }
                }
              })
            }}
            >
              重新认证
            </Button>
          </AtModalAction>
        </AtModal>
        <AtMessage />
      </Block>
    )
  }
}
