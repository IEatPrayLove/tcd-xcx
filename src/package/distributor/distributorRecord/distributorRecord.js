import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Image, Text, Picker
} from '@tarojs/components'
import {
  AtLoadMore
} from 'taro-ui'
import { connect } from '@tarojs/redux'
import './distributorRecord.scss'
import IconFont from '../../../components/IconFont/IconFont'
import PageLoading from '../../../components/PageLoading/PageLoading'
import NoData from '../../../components/NoData/NoData'
import { STATIC_IMG_URL } from '../../../config/baseUrl'
import { DISTRIBUTOR_ORDER_TYPE } from '../../../config/config'
import { getUserDetail, navToPage } from '../../../utils/utils'

const dayjs = require('dayjs')
const SIZE = 8

@connect(({ loading: { effects } }) => ({ effects }))
export default class DistributorRecord extends PureComponent {
  config = {
    // navigationBarTitleText: '分享记录',
    navigationBarTitleText: '收益记录',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.userDetail = getUserDetail()
    this.state = {
      pattern: '',
      totalInfo: {},
      recordInfo: {},
      catModalVisible: false,
      tabs: DISTRIBUTOR_ORDER_TYPE,
      pagination: {
        page: 0,
        size: SIZE,
        loadMore: 'loading',
        type: ''
      }
    }
  }

  componentDidMount() {
    const { weappUserId } = this.userDetail
    this.loadList()
    const { dispatch } = this.props
    dispatch({
      type: 'distributor/getDistributorAmountAction',
      payload: {
        userId: weappUserId
      },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            totalInfo: data
          })
        }
      }
    })
  }

  loadList = () => {
    const {
      pattern, pagination: {
        page, size, type
      }
    } = this.state
    const { dispatch } = this.props
    const { weappUserId } = this.userDetail
    dispatch({
      type: 'distributor/getDistributorOrderAction',
      payload: {
        weappUserId,
        pattern,
        page,
        size,
        type
      },
      callback: ({ ok, data }) => {
        const {
          list: newList,
          count: newCount,
          totolProfit: newTotolProfit
        } = data
        const {
          pagination,
          recordInfo: { list = [] }
        } = this.state
        if (ok) {
          this.setState({
            recordInfo: {
              list: [...list, ...newList],
              count: newCount,
              totolProfit: newTotolProfit
            },
            pagination: { ...pagination, loadMore: newList.length < SIZE ? 'noMore' : 'loading' }
          })
        } else {
          this.setState({
            recordInfo: {
              list: [],
              count: 0,
              totolProfit: 0
            }
          })
        }
      }
    })
  }
  closeCatModal() {
    this.setState({
      catModalVisible: !this.state.catModalVisible,
    })
  }
  // 分类确认弹窗
  confirmBtn = () => {
    const { pagination } = this.state
    this.loadMerchantList({
      ...pagination,
      curPage: 0,
      merchantList: []
    })
    this.setState({
      catModalVisible: false
    })
  }
  listCatHandel(value) {
    const { tabs } = this.state;
    const chooseactive = tabs.filter((item, index) => {
      item.active = false;
      if (item.value == value.value) {
        item.active = !item.active;
      }
      return tabs;
    })
    this.setState({
      tabs: chooseactive
    })
  }
  onReachBottom() {
    const {
      pagination,
      pagination: { page, loadMore }
    } = this.state
    const { effects = {} } = this.props
    if (loadMore === 'noMore' || effects['distributor/getDistributorOrderAction']) return
    this.setState({
      pagination: { ...pagination, page: page + 1 }
    }, () => {
      this.loadList()
    })
  }

  chooseType = e => {
    const { value } = e.detail
    const { pagination } = this.state
    this.setState({
      pattern: DISTRIBUTOR_ORDER_TYPE[value].value,
      chooseActive: false,
      recordInfo: {},
      pagination: {
        ...pagination,
        page: 0,
        type: DISTRIBUTOR_ORDER_TYPE[value].value,
        loadMore: 'loading'
      }
    }, () => {
      this.loadList()
    })
  }

  render() {
    const {
      chooseActive, pattern,
      totalInfo: { countOrder = 0, totalAmount = 0 },
      recordInfo: { count = 0, list, totolProfit = 0 },
      pagination: { loadMore, page }, catModalVisible, tabs
    } = this.state
    const { effects = {} } = this.props;

    return (
      <Block>
        {
          ((effects['distributor/getDistributorOrderAction'] && page === 0) || effects['distributor/getDistributorAmountAction']) && (
            <PageLoading content="订单加载中..." />
          )
        }
        <View className="pageHeader">
          <View className="grandTotal flex-row flex-sb">
            <View className="earnings">
              <View className="title flex-row flex-ac">
                <Text>累计收益(元)</Text>
              </View>
              <View className="total">{totalAmount}</View>
            </View>
            <View className="order">
              <View className="title flex-row flex-ac">
                <Text>累计分享单(单)</Text>
              </View>
              <Text className="total">{countOrder}</Text>
            </View>
          </View>
          <View className="flex-row flex-sb flex-ac">
            {/* <Picker
              mode="selector"
              range={DISTRIBUTOR_ORDER_TYPE}
              range-key="label"
              onChange={this.chooseType}
              onCancel={() => {
                this.setState({
                  chooseActive: false
                })
              }}
            >
              <View
                className="chooseType flex-row flex-ac"
                onClick={() => {
                  this.setState({
                    chooseActive: true
                  })
                }}
              >
                <Text className="type">{DISTRIBUTOR_ORDER_TYPE.find(ele => ele.value === pattern).label}</Text>
                <View className={`${chooseActive && 'chooseActive'} arrow`}>
                  <IconFont value="imgArrowDownGray" h={12} w={18} />
                </View>
              </View>
            </Picker> */}
            <View
              className="category flex-row flex-ac flex-je"
              onClick={() => {
                this.setState({
                  catModalVisible: !catModalVisible
                })
              }}
            >
              <Text>全部</Text>
              <IconFont value="imgArrowBottom" h={11} w={16} ml={16} />
            </View>
            {/* 分类弹窗 */}
            {catModalVisible && (
              <View
                className="catModal"
                onClick={this.closeCatModal}
                onTouchMove={e => e.stopPropagation()}
              >
                <View className="container" onClick={e => e.stopPropagation()}>
                  <View className="catItem flex-row flex-wrap">
                    {/* <Text className={merchantType === ALL && 'active'} onClick={() => this.listCatHandel(ALL)}>全部</Text>
                  <Text className={merchantType === TAKE_OUT && 'active'} onClick={() => this.listCatHandel(TAKE_OUT)}>分享商品</Text>
                  <Text className={merchantType === SCANNING && 'active'} onClick={() => this.listCatHandel(SCANNING)}>招募团队收益</Text>
                  <Text className={merchantType === FAVOURABLE && 'active'} onClick={() => this.listCatHandel(FAVOURABLE)}>招募团队</Text> */}
                    {tabs.map((item, index) => {
                      return (
                        <Text className={item.active ? "active" : ''} onClick={() => this.listCatHandel(item)}>{item.label}</Text>
                      )
                    })}
                  </View>
                  {/* <Text onClick={() => this.listCatHandel(TAKE_OUT)}>分享商品</Text>
                    <Text onClick={() => this.listCatHandel(SCANNING)}>招募团队收益</Text>
                    <Text onClick={() => this.listCatHandel(FAVOURABLE)}>招募团队</Text> */}

                  <View className="operateBtn flex-row">
                    <Text onClick={this.closeCatModal}>取消</Text>
                    <Text onClick={this.confirmBtn}>确认</Text>
                  </View>
                </View>
              </View>
            )
            }
            <Text className="curTotal" space="emsp">
              {`分享订单数：${count} 实际收益：￥${totolProfit}`}
            </Text>
          </View>
        </View>
        {
          list && list.length === 0 && (<NoData />)
        }
        {
          list && list.map(ele => {
            const {
              balance, profit, addDate, orderSn,
              level, pattern, id, distributorGoodsName,
              distributorTargetUserName, refunsFlag
            } = ele
            let log = null
            let name = null
            switch (pattern) {
              case 2: { // 分享商品
                log = `${STATIC_IMG_URL}/distributor_level/dis_product.png`
                name = distributorGoodsName
              } break
              case 3: { // 团队分享
                log = `${STATIC_IMG_URL}/distributor_level/dis_team.png`
                name = '邀请团队'
              } break
              case 5: { // 门店分销
                log = `${STATIC_IMG_URL}/distributor_level/dis_merchant.png`
                name = '分销门店'
              }
            }
            const distributorTeam = level === 1 ? '自己' : (level === 2 ? '一级团队' : '二级团队')
            const distributorName = level !== 1 && distributorTargetUserName
            return (
              <View
                key={id}
                className="recordItem flex-row"
                onClick={() => {
                  this.$preload(ele)
                  navToPage('/package/distributor/recordDetail/recordDetail')
                }}
              >
                <Image src={log} />
                <View className="flex-col flex1">
                  <View className="flex-row flex-ac flex-sb">
                    <Text className="name ellipsis">{name || '--'}</Text>
                    <Text className="state flex-sk finish">{refunsFlag ? '已退款' : balance ? '已完成' : '进行中'}</Text>
                  </View>
                  <Text className="distribution">{`分享者：${distributorTeam} ${distributorName ? `(${distributorName})` : ''}`}</Text>
                  <View className="flex-row flex-ac flex-sb">
                    <Text className="date">{dayjs(addDate).format('YYYY年MM月DD日 HH:mm:ss')}</Text>
                    <View className="earnings flex-row flex-ac">
                      <Text>{(balance || refunsFlag) ? '获得收益' : '预计收益 '}</Text>
                      <Text>￥</Text>
                      <Text>{refunsFlag ? 0 : profit}</Text>
                    </View>
                  </View>
                  <View className="line" />
                </View>
              </View>
            )
          })
        }
        {
          list && list.length !== 0 && (<AtLoadMore status={loadMore} />)
        }
      </Block>
    )
  }
}
