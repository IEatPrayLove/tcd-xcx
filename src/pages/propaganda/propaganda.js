import Taro, { PureComponent } from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import {
  View, Block, Text, Image, Button
} from '@tarojs/components'
import {
  AtTabs, AtButton, AtModal, AtModalContent, AtModalAction, AtMessage,
  AtActivityIndicator, AtLoadMore
} from 'taro-ui'
import NoData from '../../components/NoData/NoData'
import './propaganda.scss'
import { SIZE, PROPAGANDA_ORDER_STATE } from '../../config/config'
import { SERVER_IMG, STATIC_IMG_URL } from '../../config/baseUrl'
import { navToPage, calculateResidueTime, toDecimal } from '../../utils/utils'

const dayjs = require('dayjs')

@connect(({ loading: { effects } }) => ({
  effects
}))
export default class Propaganda extends PureComponent {
  config = {
    navigationBarTitleText: '任务订单',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
  }

  constructor() {
    super()
    this.state = {
      current: 0,
      tabList: [{ title: '全部' }, { title: '进行中' }, { title: '已完成' }, { title: '无效' }],
      modalText: '', // 弹窗显示文字
      modalVisible: false,
      orderState: '', // 订单状态
      curPage: 0, // 页数
      size: SIZE,
      propagandaList: [],
      reachBottomState: 'loading',
      noData: false
    }
    this.operating = null
  }

  componentDidShow() {
    this.setState({
      reachBottomState: 'loading',
      curPage: 0,
      noData: false,
      propagandaList: []
    }, () => {
      this.loadingList()
    })
  }

  componentDidHide() {
    this.setState({
      curPage: 0,
      propagandaList: []
    })
  }

  onReachBottom() {
    const { curPage, reachBottomState } = this.state
    if (reachBottomState === 'noMore') return
    this.setState({
      curPage: curPage + 1
    }, () => {
      this.loadingList()
    })
  }

  loadingList = () => {
    const {
      size, curPage, orderState, propagandaList
    } = this.state
    this.props.dispatch({
      type: 'propaganda/getPropagandaOrderList',
      payload: {
        orderState,
        size,
        page: curPage
      },
      callback: ({ ok, data }) => {
        if (ok) {
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
      }
    })
  }

  // 头部tab分类切换
  selectedTab = val => {
    let curTab = null
    switch (val) {
      case 1: curTab = -1; break
      case 2: curTab = 1; break
      case 3: curTab = 0; break
      default: curTab = ''
    }
    this.setState({
      current: val,
      curPage: 0,
      orderState: curTab,
      propagandaList: [],
      reachBottomState: 'loading',
      noData: false
    }, () => {
      this.loadingList()
    })
  }

  // 宣传任务头部 时间/状态 渲染
  renderHeader = ({
    orderState, closeTime, submitTime, takeOrderTime,
    endTime, limitDay, closeTask, checkResult
  }) => {
    const operatTime = closeTime || submitTime || takeOrderTime
    const [day, time] = operatTime.split('T')
    return (
      <View className="taskHeader flex-row flex-ac flex-sb">
        <Text className={`time ${orderState === 'PROMOTEING' && 'inProgress'}`}>
          {PROPAGANDA_ORDER_STATE[closeTask ? 'CLOSETASK' : ((orderState === 'DISABLE' && checkResult === 0) ? 'NOTPASS' : orderState)].time}
          ：
          {orderState === 'PROMOTEING' ? calculateResidueTime(takeOrderTime, endTime, limitDay) : orderState === 'OVERTIME' ? dayjs(endTime).format('YYYY-MM-DD HH:mm:ss') : `${day} ${time}`}
        </Text>
        <Text className="state">{PROPAGANDA_ORDER_STATE[closeTask ? 'CLOSETASK' : ((orderState === 'DISABLE' && checkResult === 0) ? 'NOTPASS' : orderState)].label}</Text>
      </View>
    )
  }

  // 宣传任务底部 操作按钮 渲染
  renderOperating = (orderState, id, promoteId, showGradeType, havePermissionTakeOrder, promotionState) => {
    const submitBtn = (
      <AtButton
        className="orangeBtn"
        onClick={() => navToPage(`/pages/submitPropaganda/submitPropaganda?id=${id}&showGradeType=${showGradeType}&from=list`)}
      >
      提交订单
      </AtButton>
    )
    const endBtn = (
      <AtButton
        className="grayBtn"
        onClick={() => {
          this.setState({
            modalVisible: true,
            modalText: '是否确认结束该任务'
          })
          this.operating = () => {
            this.props.dispatch({
              type: 'propaganda/finishPropagandaOrderAction',
              payload: { id },
              callback: ({ ok, data }) => {
                if (ok) {
                  Taro.atMessage({
                    message: '结束成功',
                    type: 'success'
                  })
                  this.setState({
                    curPage: 0,
                    propagandaList: []
                  }, () => {
                    this.loadingList()
                  })
                } else {
                  Taro.atMessage({
                    message: data.message,
                    type: 'error'
                  })
                }
              }
            })
          }
        }}
      >
        结束任务
      </AtButton>
    )
    const withdrawBtn = (
      <AtButton
        className="grayBtn"
        onClick={() => {
          this.setState({
            modalVisible: true,
            modalText: '是否撤回该任务'
          })
          this.operating = () => {
            this.props.dispatch({
              type: 'propaganda/withdrawPropagandaAction',
              payload: { id },
              callback: ({ ok, data }) => {
                if (ok) {
                  Taro.atMessage({
                    message: '撤回成功',
                    type: 'success'
                  })
                  this.setState({
                    curPage: 0,
                    propagandaList: []
                  }, () => {
                    this.loadingList()
                  })
                } else {
                  Taro.atMessage({
                    message: data.message || '操作失败！',
                    type: 'error'
                  })
                }
              }
            })
          }
        }}
      >
        撤回提交
      </AtButton>
    )
    const agingBtn = (
      <AtButton
        className="orangeBtn"
        onClick={() => {
          this.props.dispatch({
            type: 'propagandaReward/getPropagandaOrderAction',
            payload: { id: promoteId },
            callback: ({ ok, data }) => {
              if (ok) {
                const { takeOrderTime, limitDay, endTime } = data
                const residueTime = calculateResidueTime(takeOrderTime, endTime, limitDay)
                this.setState({
                  modalVisible: true,
                  modalText: `接单成功\n剩余时间：${residueTime}`
                })
                this.operating = () => {
                  this.setState({
                    curPage: 0,
                    propagandaList: [],
                    modalVisible: false
                  }, () => {
                    this.loadingList()
                  })
                }
              } else {
                Taro.atMessage({
                  message: data.message,
                  type: 'error'
                })
              }
            }
          })
        }}
      >
        再次接单
      </AtButton>
    )
    let btnGroup = null
    switch (orderState) {
      case 'PROMOTEING': { btnGroup = (
        <Block>
          {submitBtn}
          {endBtn}
        </Block>
      ); break }
      case 'CHECKING': { btnGroup = (<Block>{withdrawBtn}</Block>); break }
      case 'FINISH': { break }
      case 'OVERTIME': { btnGroup = (<Block>{agingBtn}</Block>); break }
      case 'DISABLE': { btnGroup = (havePermissionTakeOrder + '' !== 'false') ? (<Block>{agingBtn}</Block>) : (<View />); break }
      default: { break }
    }
    return (
      <View className="operatingBtn flex-row flex-je">
        {btnGroup}
      </View>
    )
  }

  renderReward = (orderState, reward, platformCommission) => {
    if (orderState === 'FINISH') {
      return (
        <Text>{`获得赏金：￥${toDecimal(reward - (reward * platformCommission * 0.01))}`}</Text>
      )
    }
    return <Text />
  }

  render() {
    const {
      current, tabList, modalVisible, modalText,
      propagandaList, reachBottomState, curPage, noData
    } = this.state
    const {
      effects = {}
    } = this.props
    return (
      <Block>
        {
          (effects['propagandaReward/getPropagandaOrderAction']
            || (effects['propaganda/getPropagandaOrderList'] && curPage === 0)
            || effects['propaganda/finishPropagandaOrderAction'])
            && (
            <View className="atLoading">
              <AtActivityIndicator mode="center" content="加载中" />
            </View>
            )
        }
        <AtTabs
          className="filterTabs"
          current={current}
          tabList={tabList}
          onClick={this.selectedTab}
        />
        {
          noData
          && (
            <NoData
              noDataImg={`${STATIC_IMG_URL}/nodata/index.png`}
              msg="暂无数据"
            />
          )
        }
        {
          propagandaList && propagandaList.length > 0 && (
            <View className="taskList">
              {
                propagandaList.map(ele => {
                  const {
                    islandPromotionDTO: { merchantHeadPic, promotionState }, submitTime,
                    islandPromotionPlaceDTO: { showGradeType }, platformCommission,
                    id, orderState, platformName, reward, placeName, promoteId, endTime,
                    limitDay, takeOrderTime, closeTime, havePermissionTakeOrder, closeTask,
                    checkResult
                  } = ele
                  return (
                    <View
                      className="taskItem"
                      key={id}
                      onClick={() => {
                        navToPage(`/pages/propagandaDetail/propagandaDetail?id=${id}`)
                      }}
                    >
                      {this.renderHeader({
                        orderState, closeTime, submitTime, takeOrderTime,
                        endTime, limitDay, closeTask, checkResult
                      })}
                      <View className="taskInfo flex-row flex-ac">
                        <Image className="taskLogo" src={SERVER_IMG + merchantHeadPic} />
                        <View className="taskMsg flex-col flex-sb">
                          <Text>{placeName}</Text>
                          <Text>
                            发布者：
                            {platformName}
                          </Text>
                          <Text>
                            赏金：￥
                            {reward}
                          </Text>
                          {this.renderReward(orderState, reward, platformCommission)}
                        </View>
                      </View>
                      <View
                        onClick={e => {
                          e.stopPropagation()
                        }}
                      >
                        {this.renderOperating(orderState, id, promoteId, showGradeType, havePermissionTakeOrder, promotionState)}
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
          )
        }


        <AtModal
          className="confirmModal"
          isOpened={modalVisible}
          onClose={() => {
            this.setState({
              modalVisible: false
            })
          }}
        >
          <AtModalContent>
            <Text>{modalText}</Text>
          </AtModalContent>
          <AtModalAction>
            <Button
              onClick={() => {
                this.setState({
                  modalVisible: false
                })
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                this.operating()
                this.setState({
                  modalVisible: false
                })
              }}
            >
              确定
            </Button>
          </AtModalAction>
        </AtModal>
        <AtMessage />
      </Block>
    )
  }
}
