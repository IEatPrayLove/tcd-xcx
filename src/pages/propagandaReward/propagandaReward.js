import Taro, { PureComponent } from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import {
  View, Swiper, SwiperItem, Block, Image, Text, Button
} from '@tarojs/components'
import {
  AtButton, AtModal, AtModalContent, AtModalAction, AtLoadMore,
  AtActivityIndicator, AtMessage, AtIcon
} from 'taro-ui'

import IconFont from '../../components/IconFont/IconFont'
import NoData from '../../components/NoData/NoData'
import './propagandaReward.scss'

import { PROMOTE_TYPE_NAME } from '../../config/config'
import { STATIC_IMG_URL } from '../../config/baseUrl'
import {
  dateFormat,
  navToPage,
  calculateResidueTime,
  objNotNull,
  getServerPic,
  getUserDetail,
  showLoading,
  hideLoading,
  needLogin,
  saveCurrentLocation,
  latelyMerchant,
  getCurrentLoaction,
  showToast,
  getUserDistributor
} from '../../utils/utils'

const dayjs = require('dayjs')

const SIZE = 6

@connect(({ loading: { effects } }) => ({
  effects
}))
export default class PropagandaReward extends PureComponent {
  config = {
    navigationBarTitleText: '推广悬赏',
    navigationBarBackgroundColor: '#FF643D',
    backgroundTextStyle: 'dark',
    enablePullDownRefresh: true
  }

  constructor() {
    super()
    this.state = {
      categoryCur: 0,
      modalVisible: false,
      filterPanel: false,
      currentPage: 0,
      allChannel: [], // 所有渠道
      propagandaList: [], // 推广宣发列表
      curChannel: [], // 选中渠道
      curChannelLevel: [],
      curLevel: {},
      sort: '',
      comOrder: true, // 分享排序
      successOrderInfo: {}, // 成功订单信息（用于跳转详情，计算剩余时间）
      failOrderChannelInfo: {}, // 失败 未认证渠道
      noData: false,
      reachBottomState: 'loading',
      modalVisibleFail: false,
      failText: '',
      failType: '',
      ruleVisible: false,
      deliveryArea: null, // 配送范围
      minShop: {} // 距离最近门店
    }
  }

  componentWillMount() {
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
    dispatch({ type: 'mine/getTalentInfoAction' })
    this.loadingPropagandaList()
  }

  componentDidShow() {
    if (!needLogin()) return
    const { dispatch } = this.props
    dispatch({
      type: 'propagandaReward/getAllChannelAction',
      callback: res => {
        if (res.ok) {
          this.setState({
            allChannel: res.data
          })
        }
      }
    })
    dispatch({ type: 'mine/getTalentInfoAction' })
    this.loadingPropagandaList()
  }

  // 首次进入自动定位坐标
  firstLocation = goodsDetail => {
    const { dispatch } = this.props
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
              dispatch({
                type: 'propagandaReward/getAllChannelAction',
                callback: res => {
                  if (res.ok) {
                    this.setState({
                      allChannel: res.data
                    })
                  }
                }
              })
              dispatch({ type: 'mine/getTalentInfoAction' })
              this.loadingPropagandaList()
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
    const { code } = getUserDistributor()
    return {
      title: '推广悬赏',
      path: `/pages/propagandaReward/propagandaReward?code=${code || ''}`
    }
  }

  onReachBottom() {
    const { currentPage, reachBottomState } = this.state
    if (reachBottomState === 'noMore') return
    this.setState({
      currentPage: currentPage + 1
    }, () => {
      this.loadingPropagandaList()
    })
  }

  onPullDownRefresh() {
    this.setState({
      propagandaList: [],
      currentPage: 0,
      reachBottomState: 'loading'
    }, () => {
      this.loadingPropagandaList()
    })
  }

  loadingPropagandaList = () => {
    const {
      currentPage, sort, curChannel, curLevel,
      propagandaList, comOrder
    } = this.state
    const { dispatch } = this.props
    dispatch({
      type: 'propagandaReward/getPropagandaListAction',
      payload: {
        page: currentPage,
        placeId: curChannel.id || '',
        placeType: '',
        size: SIZE,
        sort,
        state: '',
        grade: curLevel.placeGrade || '',
        comOrder
      },
      callback: ({ ok, data }) => {
        if (ok) {
          dispatch({
            type: 'propagandaReward/updateAuthorAction',
            payload: data.map(({ id }) => id).join(',')
          })
          this.setState({
            propagandaList: [...propagandaList, ...data],
            noData: [...propagandaList, ...data].length <= 0
          })
          if (data.length < SIZE) {
            this.setState({
              reachBottomState: 'noMore'
            })
          }
        }
        Taro.stopPullDownRefresh()
      }
    })
  }

  // 选择渠道
  selectChannel = ele => {
    this.setState({
      curChannel: ele,
      curLevel: {}
    }, () => {
      this.props.dispatch({
        type: 'propagandaReward/getChannelLevelAction',
        payload: { id: ele.id },
        callback: ({ ok, data }) => {
          if (ok) {
            this.setState({
              curChannelLevel: data
            })
          } else {
            this.setState({
              curChannelLevel: []
            })
          }
        }
      })
    })
  }

  // 选择等级
  selectLevel = val => {
    this.setState({
      curLevel: val
    })
  }

  // 头部标签页筛选
  onChangeCategory = val => {
    const { filterPanel, categoryCur, sort } = this.state
    if (val === categoryCur && val === 1) return
    if (val === 3) {
      this.setState({
        filterPanel: !filterPanel
      })
      return
    }
    let curSort = ''
    if (val === 2) {
      curSort = sort === 'reward,desc' ? 'reward,asc' : 'reward,desc'
    } else if (val === 1) {
      curSort = 'id,desc'
    }
    this.setState({
      comOrder: val === 0 ? true : '',
      currentPage: 0,
      curChannel: {},
      curLevel: {},
      curChannelLevel: [],
      propagandaList: [],
      categoryCur: val,
      sort: curSort,
      noData: false,
      reachBottomState: 'loading'
    }, () => {
      this.loadingPropagandaList()
    })
  }

  // 筛选面板确认按钮
  confirmFilter = () => {
    this.setState({
      filterPanel: false,
      currentPage: 0,
      propagandaList: [],
      categoryCur: 3,
      noData: false,
      reachBottomState: 'loading',
      comOrder: ''
    }, () => {
      this.loadingPropagandaList()
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

  getPropagandaOrder = ele => {
    const { id, placeId } = ele
    showLoading()
    this.props.dispatch({
      type: 'propagandaReward/getPropagandaOrderAction',
      payload: { id },
      callback: ({ ok, data }) => {
        hideLoading()
        if (ok) {
          this.refreshTakeOrder(id)
          this.setState({
            modalVisible: true,
            successOrderInfo: data
          })
        } else {
          if (data.message === '还未认证该渠道' || data.message === '你的等级没有达到宣发单要求等级哦') {
            const { allChannel } = this.state
            this.setState({
              failOrderChannelInfo: allChannel.find(({ id: channelId }) => channelId === placeId),
              failText: data.message,
              modalVisibleFail: true,
              failType: data.message === '还未认证该渠道' ? 0 : 1
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

  orderResidueTime = () => {
    const {
      successOrderInfo,
      successOrderInfo: { takeOrderTime, limitDay, endTime }
    } = this.state
    if (objNotNull(successOrderInfo)) {
      return calculateResidueTime(takeOrderTime, endTime, limitDay)
    }
  }

  refreshTakeOrder = taskId => {
    const {
      nickName, headPic, id: uerId
    } = getUserDetail()
    const { propagandaList } = this.state
    const curIndex = propagandaList.findIndex(({ id }) => taskId === id)
    const template = JSON.parse(JSON.stringify(propagandaList))
    template[curIndex].islandUserModels.push({
      head_pic: headPic,
      id: uerId,
      nick_name: nickName
    })
    template[curIndex].takeCount++
    this.setState({
      propagandaList: template
    })
  }

  render() {
    const {
      categoryCur, modalVisible, filterPanel, propagandaList, allChannel,
      curChannel, curChannelLevel, curLevel, noData, currentPage, reachBottomState,
      failOrderChannelInfo, modalVisibleFail, failText, failType, ruleVisible
    } = this.state
    const { effects = {} } = this.props
    return (
      <Block>
        {
          (effects['propagandaReward/getChannelLevelAction'] || (effects['propagandaReward/getPropagandaListAction'] && currentPage === 0))
          && (
            <View className="atLoading">
              <AtActivityIndicator content="加载中..." mode="center" />
            </View>
          )
        }
        <View className="propagandaRule">
          <Image src={`${STATIC_IMG_URL}/propaganda_bg.png`} />
          <View
            className="rule"
            onClick={() => {
              this.setState({
                ruleVisible: true
              })
            }}
          >
            规则介绍
          </View>
        </View>
        <View className="categories flex-row flex-ac flex-sb">
          <View onClick={() => { this.onChangeCategory(0) }} className={`categoryItem flex-gw ${categoryCur === 0 && 'active'}`}>综合</View>
          <View onClick={() => { this.onChangeCategory(1) }} className={`categoryItem flex-gw ${categoryCur === 1 && 'active'}`}>最新</View>
          <View onClick={() => { this.onChangeCategory(2) }} className={`categoryItem flex-gw flex-row flex-ac flex-jc ${categoryCur === 2 && 'active'}`}>
            赏金
            <IconFont w={22} h={24} value={categoryCur === 2 ? 'imgSortActive' : 'imgSort'} ml={6} />
          </View>
          <View onClick={() => { this.onChangeCategory(3) }} className={`categoryItem flex-gw flex-row flex-ac flex-jc ${categoryCur === 3 && 'active'}`}>
            筛选
            <IconFont w={24} h={22} value={categoryCur === 3 ? 'imgCategoryOrange' : 'imgCategory'} ml={6} />
          </View>
          {
            filterPanel && (
            <View
              className="filterPanel"
              onClick={() => {
                this.setState({
                  filterPanel: false
                })
              }}
            >
              <View
                className="panelWarp"
                onClick={e => {
                  e.stopPropagation()
                }}
              >
                <View className="filterTitle">推广渠道</View>
                <View className="filterItem flex-row flex-wrap">
                  {
                    allChannel && allChannel.length > 0 && allChannel.map(ele => (
                      <View
                        key={ele.id}
                        className={`${curChannel.id === ele.id && 'selected'}`}
                        onClick={() => this.selectChannel(ele)}
                      >
                        {ele.name}
                      </View>
                    ))
                  }
                </View>
                <View className="filterTitle">平台等级</View>
                <View className="filterItem flex-row flex-wrap">
                  {
                    curChannelLevel && curChannelLevel.length > 0 && curChannelLevel.map(ele => (
                      <View
                        className={`${curLevel.placeGrade === ele.placeGrade && 'selected'}`}
                        key={ele.islandPromotionPlaceId}
                        onClick={() => this.selectLevel(ele)}
                      >
                        Dv
                        {ele.placeGrade}
                      </View>
                    ))
                  }
                </View>
              </View>
              <View className="bottomBtn flex-row">
                <View onClick={() => {
                  this.setState({
                    filterPanel: false
                  })
                }}
                >
                取消
                </View>
                <View onClick={this.confirmFilter}>确定</View>
              </View>
            </View>
            )
          }
        </View>
        {
          noData
          && (
            <NoData
              noDataImg={`${STATIC_IMG_URL}/nodata/index.png`}
              msg="暂无数据"
            />
          )
        }
        <View className="propagandaWarp">
          {
            (propagandaList && propagandaList.length > 0)
              && propagandaList.map(ele => {
                const {
                  merchantHeadPic, placeName, reward, platformName, expertGrade, endTime, id,
                  numberPeople, takeCount, state, promoteTypeName, islandUserModels, startTime,
                  havePermissionTakeOrder
                } = ele
                const needPerson = numberPeople - takeCount
                const { id: userId } = getUserDetail()
                const isJoin = islandUserModels.findIndex(({ id: joinId }) => joinId === userId)
                let label = null
                switch (state) {
                  case -1: { label = <View className="label grayLabel">已结束</View>; break }
                  case 0: { label = <View className="label oranLabel">未开始</View>; break }
                  case 1: { label = <View className="label">进行中</View>; break }
                  default: { label = <View className="label grayLabel">未知</View> }
                }
                const activeTime = state === 0 ? startTime : endTime
                return (
                  <View
                    className="propagandaItem flex-row flex-as"
                    key={id}
                    onClick={() => {
                      navToPage(`/pages/propagandaRewardDetail/propagandaRewardDetail?id=${id}`)
                    }}
                  >
                    <View className="logo">
                      <Image src={getServerPic(merchantHeadPic)} />
                      {label}
                    </View>
                    <View className="propagandaInfo flex1">
                      <View className="title flex-row flex-sb">
                        <Text className="name">
                          {placeName}
                          ：
                          {PROMOTE_TYPE_NAME.find(({ key }) => promoteTypeName === key).name}
                          推广
                        </Text>
                        <Text className="price">
                        ￥
                          {reward}
                        /单
                        </Text>
                      </View>
                      <Text className="promulgator">
                        {platformName || '--'}
                      </Text>
                      <View className="claim flex-row flex-sb flex-ac">
                        <Text className="placeName">{placeName}</Text>
                        <View className="level">
                          Dv
                          {expertGrade}
                        </View>
                        <Text className="flex1 need">
                          {needPerson >= 0 ? needPerson : 0}
                        </Text>
                      </View>
                      <View className="bottom flex-row flex-sb flex-ac">
                        <View className={`endTime ${state === 0 && 'startTime'}`}>
                          {dayjs(activeTime).format('MM-DD HH:mm')}
                        </View>
                        {
                        state === 1
                        && (
                          <View onClick={e => {
                            e.stopPropagation()
                          }}
                          >
                            {
                              (isJoin === -1 && (`${havePermissionTakeOrder}` !== 'false')) ? (needPerson > 0 ? (
                                <AtButton
                                  // loading={true}
                                  // disabled={true}
                                  className="rushOrderBtn orangeBtn"
                                  onClick={() => {
                                    this.getPropagandaOrder(ele)
                                  }}
                                >
                                    我要抢单
                                </AtButton>
                              ) : <View className="rushOrderBtn garyBtn">有机会</View>
                              ) : <View className="rushOrderBtn garyBtn">已接单</View>
                            }
                          </View>
                        )
                      }
                      </View>
                    </View>
                  </View>
                )
              })
          }
          {
            propagandaList && propagandaList.length > 0
            && (
              <AtLoadMore
                status={reachBottomState}
              />
            )
          }
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
        {/* 失败 */}
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
              const { failOrderChannelInfo, failOrderChannelInfo: { id } } = this.state
              this.props.dispatch({
                type: 'mine/examineCertificationAction',
                payload: { placeId: id },
                callback: ({ ok, data }) => {
                  if (ok) {
                    this.setState({
                      modalVisibleFail: false
                    })
                    if (!data) {
                      this.$preload({ ...failOrderChannelInfo, update: failType === 0 ? null : true })
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
              {failType === 0 ? '立即认证' : '重新认证'}
            </Button>
          </AtModalAction>
        </AtModal>
        <AtMessage />

        {
          ruleVisible && (
          <View
            className="ruleModalMask"
            onTouchMove={e => e.stopPropagation()}
          >
            <View className="ruleModalBox">
              <View className="ruleModalTitle">规则介绍</View>
              <View className="ruleModalContent">
                <View className="ruleTitle marB">平台目前提供了对应渠道认证方式，用户需要截图上传对应平台的资料即可完成达人入驻：</View>
                <View className="ruleRow marB">
                  <View className="ruleRowCircle">1</View>
                  <View className="ruleRowWord">目前平台提供三种渠道达人认证抖音、大众、微信，其它渠道暂未进行开放；</View>
                </View>
                <View className="ruleRow marB">
                  <View className="ruleRowCircle">2</View>
                  <View className="ruleRowWord">用户上传对应截图资料后将会进入客服审核后，审核工作周期预计在3个工作日内；</View>
                </View>
                <View className="ruleRow marB">
                  <View className="ruleRowCircle">3</View>
                  <View className="ruleRowWord">
                    每位用户
                    <Text>每月可申请一次</Text>
                    达人等级变更认证申请，不断提升平台达人推广等级；
                  </View>
                </View>
                <View className="ruleRow marB">
                  <View className="ruleRowCircle">4</View>
                  <View className="ruleRowWord">
                    用户认证成功后可在平台接商家发布的任务获取对应任务赏金，
                    <Text>平台严禁刷单操作，一经发现账号永久拉黑</Text>
                  </View>
                </View>
                <View className="ruleRow marB">
                  <View className="ruleRowCircle">5</View>
                  <View className="ruleRowWord">
                    每位用户
                    <Text>每日最多抢3次</Text>
                    任务发布订单，并需要规定时间内进行完成，如果超过完成时间则任务将进行对应释放；
                  </View>
                </View>
                <View className="ruleRow">
                  <View className="ruleRowCircle">6</View>
                  <View className="ruleRowWord">
                    <Text>客服人员将对账号进行不定期审核，一旦发现账号违规作弊，则将会对账号进行冻结。</Text>
                  </View>
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

      </Block>
    )
  }
}
