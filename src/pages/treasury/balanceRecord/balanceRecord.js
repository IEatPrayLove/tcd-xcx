import Taro, { PureComponent } from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import {
  View, Block, Text, Picker
} from '@tarojs/components'
import { AtTabs, AtLoadMore } from 'taro-ui'
import IconFont from '../../../components/IconFont/IconFont'
import './balanceRecord.scss'
import {
  dateFormat,
  formatCurrency,
  dateFormatWithDate,
  navToPage,
  encodeURIObj
} from '../../../utils/utils'
import { BALANCE_TYPE } from '../../../config/config'

const SIZE = 8

@connect(({ loading: { effects } }) => ({
  effects
}))
export default class BalanceRecord extends PureComponent {
  config = {
    navigationBarTitleText: '余额记录',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
  }

  constructor() {
    super()
    this.state = {
      curDate: dateFormat(new Date().getTime() / 1000, 'yyyy-MM'),
      dateArrow: false,
      categoryArrow: false,
      filterPanelVisible: false, // 分类面板
      current: 0,
      list: [],
      tradeSources: 'all',
      pagination: {
        page: 0,
        size: SIZE,
        tradeSources: ''
      },
      paging: 'loading',
      balance: {
        incomeAmount: 0.00,
        spendingAmount: 0.00
      },
      incomeAmountSearch: 0.00,
      spendingAmountSearch: 0.00
    }
  }

  componentDidShow() {
    this.loadingList()
    this.getBalanceAmount()
  }

  getBalanceAmount = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'treasury/getBalanceAmount',
      payload: {},
      callback: res => {
        if (res.ok) {
          this.setState({
            balance: {
              incomeAmount: res.data.incomeAmount,
              spendingAmount: res.data.spendingAmount
            }
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
    const { pagination, list, curDate } = this.state
    dispatch({
      type: 'treasury/getBalanceRecordList',
      payload: { ...pagination, time: curDate, sort: 'id,desc' },
      callback: ({ ok, data }) => {
        if (ok) {
          if (pagination.page === 0) {
            this.setState({
              list: data.list,
              paging: data.list.length < SIZE ? 'noMore' : 'loading',
              incomeAmountSearch: data.incomeAmount,
              spendingAmountSearch: data.spendingAmount
            })
          } else {
            this.setState({
              list: [...list, ...data.list],
              paging: data.list.length < SIZE ? 'noMore' : 'loading'
            })
          }
        }
      }
    })
  }

  renderBanlance = () => {
    const { list } = this.state
    return (
      <Block>
        {
          list.map((ele, index) => (
            <View
              className="recordItem flex-row"
              key={index}
              onClick={() => navToPage(`/pages/treasury/balanceDetail/balanceDetail?balanceInfo=${encodeURIObj(ele)}`)}
            >
              <IconFont value={ele.runningType === 'INCOME' ? 'imgIncome' : 'imgExpenditure'} h={66} w={66} mr={16} />
              <View className="flex1 recordRight">
                <View className="top flex-row flex-ac">
                  <Text className="title flex1">
                    {ele.runningType === 'INCOME' ? '收入' : '支出'}
                    -
                    {
                      ele.tradeSources === 'BUY_GOODS' ? (<Text>{ele.shopName ? ele.shopName : '购买商品'}</Text>)
                        : BALANCE_TYPE[ele.tradeSources]
                    }
                  </Text>
                  {/* {ele.runningType == 'INCOME' && <Text className="state">审核中</Text>} */}
                </View>
                <View className="flex-row flex-ac">
                  <Text className="date flex1">{dateFormatWithDate(ele.stateChangeDate)}</Text>
                  <Text className="expenditure">
                    {ele.runningType === 'INCOME' ? '+' : '-'}
                    ￥
                    {ele.amount}
                  </Text>
                </View>
              </View>
            </View>
          ))
        }
      </Block>
    )
  }

  onDateChange = e => {
    this.rotateArrow('dateArrow')
    const { tradeSources } = this.state.pagination
    this.setState({
      curDate: e.detail.value,
      pagination: {
        page: 0,
        size: SIZE,
        tradeSources
      }
    }, () => {
      this.loadingList()
    })
  }

  rotateArrow = type => {
    this.setState({
      [type]: !this.state[type]
    })
  }

  // 切换类型
  changeTradeSources = e => {
    const type = ['BUY_GOODS', 'BUY_TC_CARD', 'RECHARGE', // 消费
      'DISTRIBUTION_CASHBACK', 'DISTRIBUTION_CARD_CASHBACK', 'DISTRIBUTOR_CARD_REWARDS_POOL', // 分享
      'PROMOTION_PRICE', // 达人
      'WITHDRAWAL' // 提现
    ]
    let tradeSources = ''

    switch (e.target.id) {
      case 'buy':
        tradeSources = type.slice(0, 3)
        break
      case 'distrbute':
        tradeSources = type.slice(3, 6)
        break
      case 'expert':
        tradeSources = type.slice(6, 7)
        break
      case 'widthdraw':
        tradeSources = type.slice(7, 8)
        break
      default:
        tradeSources = ''
    }
    this.setState({
      pagination: {
        page: 0,
        size: SIZE,
        tradeSources
      },
      tradeSources: e.target.id
    }, () => {
      this.loadingList()
    })
  }

  render() {
    const {
      curDate, dateArrow, filterPanelVisible, list, paging, tradeSources, balance, incomeAmountSearch, spendingAmountSearch
    } = this.state
    return (
      <Block>
        <View className="pageHeader">
          <View className="statistics flex-row flex-sb">
            <View className="flex-col flex-sb">
              <Text className="title">累计收入（元）</Text>
              <Text className="total">{formatCurrency(balance.incomeAmount)}</Text>
            </View>
            <View className="flex-col flex-sb">
              <Text className="title">累计支出（元）</Text>
              <Text className="total">{formatCurrency(balance.spendingAmount)}</Text>
            </View>
          </View>
          <View className="categoryWarp">
            <View style={{ display: 'inline-block' }}>
              <Picker
                fields="month"
                mode="date"
                onChange={this.onDateChange}
                onCancel={() => {
                  this.rotateArrow('dateArrow')
                }}
                value={curDate}
              >
                <View
                  className={`${dateArrow && 'filterActive'} filterDate`}
                  onClick={() => {
                    this.rotateArrow('dateArrow')
                  }}
                >
                  {curDate}
                </View>
              </Picker>
            </View>
            <View className="categoryBottom flex-row flex-ac">
              <Text className="income">
                收入：￥
                {incomeAmountSearch}
              </Text>
              <Text className="flex1">
                支出：￥
                {spendingAmountSearch}
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
              filterPanelVisible
              && (
                <View className="categoryPanel flex-row flex-wrap flex-sb" onClick={e => this.changeTradeSources(e)}>
                  <View className={`item ${tradeSources === 'all' ? 'active' : ''}`} id="all">全部</View>
                  <View className={`item ${tradeSources === 'distrbute' ? 'active' : ''}`} id="distrbute">分享</View>
                  <View className={`item ${tradeSources === 'expert' ? 'active' : ''}`} id="expert">达人</View>
                  <View className={`item ${tradeSources === 'widthdraw' ? 'active' : ''}`} id="widthdraw">提现</View>
                  <View className={`item ${tradeSources === 'buy' ? 'active' : ''}`} id="buy">消费</View>
                </View>
              )
            }
          </View>
        </View>
        {
          filterPanelVisible
          && (
            <View className="categoryMask" onClick={() => { this.setState({ filterPanelVisible: false }) }} />
          )
        }
        {this.renderBanlance()}
        {
          list.length > 0 && <AtLoadMore status={paging} />
        }
      </Block>
    )
  }
}
