import Taro, { PureComponent } from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import {
  View, Block, Text, Picker, Image
} from '@tarojs/components'
import { AtTabs, AtLoadMore } from 'taro-ui'
import IconFont from '../../../components/IconFont/IconFont'
import './commissionTotal.scss'
import { dateFormat, navToPage, dateFormatWithDate } from '../../../utils/utils'
import NoData from '../../../components/NoData/NoData'
import { STATIC_IMG_URL } from '../../../config/baseUrl'
// import { SIZE } from '../../config/config'
const SIZE = 8

const dayjs = require('dayjs')

@connect(({ loading: { effects } }) => ({
  effects
}))
export default class BalanceRecord extends PureComponent {
  config = {
    navigationBarTitleText: '',
    navigationBarBackgroundColor: '#fff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      type: this.$router.params.type, // expert 达人
      curTime: dateFormat(new Date().getTime() / 1000, 'yyyy-MM'),
      dateArrow: false,
      filterPanelVisible: false, // 分类面板
      current: 0,
      list: [],
      userProfitTypes: '',
      placeId: '',
      pagination: {
        page: 0,
        size: SIZE,
        userProfitTypes: this.$router.params.type === 'expert' ? 'PROMOTION_PROFIT' : 'DISTRIBUTOR_CARD_REWARDS_POOL_PROFIT,DISTRIBUTOR_GOODS_PROFIT,DISTRIBUTOR_CARD_PROFIT',
        placeId: ''
      },
      paging: 'loading',
      noData: false,
      channelOption: [],
      incomeAmount: 0,
      totalIncomeAmount: 0
    }
  }

  componentDidMount() {
    let titleText = ''
    if (this.$router.params.type === 'expert') {
      titleText = '达人累计赏金'
    } else {
      titleText = '分享累计赏金'
    }
    Taro.setNavigationBarTitle({
      title: titleText
    })
    if (this.$router.params.type === 'expert') {
      this.getAllChannel()
    }
    this.loadingList()
  }

  componentDidShow() {
    // let titleText = ''
    // if (this.$router.params.type === 'expert') {
    //   titleText = '达人累计赏金'
    // } else {
    //   titleText = '分享累计赏金'
    // }
    // Taro.setNavigationBarTitle({
    //   title: titleText
    // })
    // if (this.$router.params.type === 'expert') {
    //   this.getAllChannel()
    // }
    // this.loadingList()
  }

  getAllChannel = () => {
    const { dispatch } = this.props
    const channel = [{ id: '', label: '全部' }]
    dispatch({
      type: 'treasury/getAllChannel',
      payload: {},
      callback: res => {
        if (res.ok) {
          for (const item of res.data) {
            channel.push({ id: item.id, label: item.name })
          }
          this.setState({
            channelOption: channel
          })
        }
      }
    })
  }

  onReachBottom() {
    const {
      pagination, pagination: { page }, paging
    } = this.state
    if (paging === 'noMore') return
    this.setState({
      pagination: { ...pagination, page: page + 1 }
    }, () => {
      this.loadingList()
    })
  }

  loadingList = () => {
    const { dispatch } = this.props
    const { pagination, list, curTime } = this.state
    dispatch({
      type: 'treasury/getRetailExpertList',
      payload: { ...pagination, time: curTime },
      callback: ({ ok, data }) => {
        if (ok) {
          if (pagination.page === 0) {
            this.setState({
              list: data.list,
              paging: data.list.length < SIZE ? 'noMore' : 'loading',
              incomeAmount: data.incomeAmount,
              totalIncomeAmount: data.totalIncomeAmount
            })
          } else {
            this.setState({
              list: [...list, ...data.list],
              paging: data.list.length < SIZE ? 'noMore' : 'loading'
            })
          }
          if ([...list, ...data.list].length <= 0) {
            this.setState({
              noData: true
            })
          } else {
            this.setState({
              noData: false
            })
          }
        }
      }
    })
  }

  onDateChange = e => {
    this.rotateArrow()
    this.setState({
      curTime: e.detail.value,
      pagination: {
        page: 0,
        size: SIZE,
        userProfitTypes: this.state.userProfitTypes,
        placeId: this.state.placeId
      }
    }, () => {
      this.loadingList()
    })
  }

  rotateArrow = () => {
    this.setState({
      dateArrow: !this.state.dateArrow
    })
  }

  renderRetail = () => {
    const { list, type } = this.state
    return (
      <Block>
        {
          list && list.length > 0 && list.map(ele => {
            return (
              <View
                key={ele.id}
                className="distributionTime"
                onClick={() => {
                  navToPage(`/pages/treasury/commissionDetail/commissionDetail?id=${ele.id}&type=${type}`)
                }}
              >
                <View className="distributionLeft">
                  <Image src={ele.userProfitType === 'DISTRIBUTOR_CARD_PROFIT' ? `${STATIC_IMG_URL}/icon/commition_TCK.png` : `${STATIC_IMG_URL}/icon/commition_retailStore.png`} />
                  <View className="distributionLeInfo">
                    <View className="name ellipsis">
                      {
                        type === 'retail' && (
                          <Text>
                            {ele.userProfitType === 'DISTRIBUTOR_CARD_PROFIT' ? '会员卡赏金'
                              : ele.userProfitType === 'DISTRIBUTOR_GOODS_PROFIT' ? '分享商品'
                                : ele.userProfitType === 'DISTRIBUTOR_CARD_REWARDS_POOL_PROFIT' ? '分享会员卡瓜分赏金'
                                  : ele.userProfitType === 'PROMOTION_PROFIT' ? '宣发收益' : '其他'}
                            {
                              ele.distributorShopName !== null ? (
                                <Text>
                                  {' '}
                                  -
                                  {ele.distributorShopName}
                                </Text>
                              ) : ''
                            }
                          </Text>
                        )
                      }
                      {
                        type === 'expert' && (
                          <Text>
                            {ele.promotionMerchantName}
                            -
                            {ele.placeName}
                            {ele.placeType === 'LIVE' ? '直播' : ele.placeType === 'VIDEO' ? '视频' : ele.placeType === 'GRAPHIC' ? '图文' : '其他'}
                            推广
                          </Text>
                        )
                      }
                    </View>
                    <Text className="time">{dayjs(this.$router.params.type === 'expert' ? ele.promotionCheckTime : ele.createTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
                  </View>
                </View>
                <View className="add">
                  +
                  {ele.changeAmount}
                </View>
              </View>
            )
          })
        }
      </Block>
    )
  }

  // 切换类型
  changeUserProfitTypes = e => {
    const { type } = this.state
    if (type === 'expert') {
      this.setState({
        pagination: {
          page: 0,
          size: SIZE,
          userProfitTypes: 'PROMOTION_PROFIT',
          placeId: Number(e.target.id) === 0 ? '' : Number(e.target.id)
        },
        placeId: Number(e.target.id) === 0 ? '' : Number(e.target.id)
      }, () => {
        this.loadingList()
      })
    } else {
      let userProfitTypes = ''
      const retailType = ['DISTRIBUTOR_CARD_REWARDS_POOL_PROFIT', 'DISTRIBUTOR_GOODS_PROFIT', 'DISTRIBUTOR_CARD_PROFIT']
      switch (e.target.id) {
        case 'goods':
          userProfitTypes = retailType[1]
          break
        case 'card':
          userProfitTypes = retailType[2]
          break
        default:
          userProfitTypes = retailType
      }

      this.setState({
        pagination: {
          page: 0,
          size: SIZE,
          userProfitTypes
        },
        userProfitTypes: e.target.id
      }, () => {
        this.loadingList()
      })
    }
  }

  render() {
    const {
      curTime, dateArrow, noData,
      filterPanelVisible, userProfitTypes,
      list, paging, type, placeId, channelOption,
      incomeAmount, totalIncomeAmount
    } = this.state
    const {
      effects
    } = this.props
    return (
      <Block>
        <View className="pageHeader">
          <View className="categoryWarp">
            <View style={{ display: 'inline-block' }}>
              <Picker
                fields="month"
                mode="date"
                onChange={this.onDateChange}
                onCancel={() => {
                  this.rotateArrow('dateArrow')
                }}
                value={curTime}
              >
                <View
                  className={`${dateArrow && 'filterActive'} filterDate`}
                  onClick={() => {
                    this.rotateArrow('dateArrow')
                  }}
                >
                  {curTime}
                </View>
              </Picker>
            </View>
            <View className="categoryBottom flex-row flex-ac">
              <Text className="income">
                本月收益：￥
                {incomeAmount}
              </Text>
              <Text className="flex1">
                累计收益：￥
                {totalIncomeAmount}
              </Text>
              <View
                className="allCategory flex-row flex-ac"
                onClick={() => {
                  this.setState({
                    filterPanelVisible: !filterPanelVisible
                  })
                }}
              >
                <Text className="title">全部类型</Text>
                <IconFont value={filterPanelVisible ? 'imgCategoryActive' : 'imgCategory'} h={22} w={24} />
              </View>
            </View>
            {
              filterPanelVisible && type === 'retail'
              && (
                <View className="categoryPanel flex-row flex-wrap flex-sb" onClick={e => this.changeUserProfitTypes(e)}>
                  <View className={`item ${userProfitTypes === '' ? 'active' : ''}`} id="">全部</View>
                  <View className={`item ${userProfitTypes === 'goods' ? 'active' : ''}`} id="goods">分享商品</View>
                  <View className={`item ${userProfitTypes === 'card' ? 'active' : ''}`} id="card">分享会员卡</View>
                </View>
              )
            }
            {
              filterPanelVisible && type === 'expert'
              && (
                <View className="categoryPanel flex-row flex-wrap flex-sb" onClick={e => this.changeUserProfitTypes(e)}>
                  {
                    channelOption.map(item => (
                      <View className={`item ${(placeId === item.id) ? 'active' : ''}`} id={item.id} key={item.id}>
                        {item.label}
                      </View>
                    ))
                  }
                </View>
              )
            }
          </View>
        </View>
        {/*{*/}
          {/*effects['treasury/getRetailExpertList'] && (*/}
            {/*<View></View>*/}
          {/*)*/}
        {/*}*/}
        {
          filterPanelVisible
          && (
            <View className="categoryMask" onClick={() => { this.setState({ filterPanelVisible: false }) }} />
          )
        }
        {this.renderRetail()}
        {
          list.length > 0 && <AtLoadMore status={paging} />
        }
        {
          noData && <NoData />
        }
      </Block>
    )
  }
}
