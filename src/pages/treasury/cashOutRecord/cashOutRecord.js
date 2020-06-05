import Taro from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import {
  View, Image, Text, Block, Button
} from '@tarojs/components'
import { AtTabs, AtLoadMore } from 'taro-ui'
import './cashOutRecord.scss'
import IconFont from '../../../components/IconFont/IconFont'
import { dateFormatWithDate, navToPage } from '../../../utils/utils'
import NoData from '../../../components/NoData/NoData'

const SIZE = 8

@connect(({ loading: { effects } }) => ({
  effects
}))
export default class cashOutRecord extends Taro.PureComponent {
  config = {
    navigationBarTitleText: '提现记录',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
  };

  constructor(props) {
    super(props)
    this.state = {
      current: 0,
      list: [],
      pagination: {
        page: 0,
        size: SIZE,
        status: ''
      },
      paging: 'loading',
      noData: false
    }
    this.tabList = [{ title: '全部' }, { title: '审核中' }, { title: '已审核' }]
  }

  componentWillMount() {
    this.loadingList()
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

  // 切换Tab
  changeTabs = val => {
    const { current } = this.state
    if (current === val) return
    const type = ['', 'WAIT_VERIFY', 'WAIT_PAY, PAYED,INVALID']
    this.setState({
      current: val,
      list: [],
      pagination: {
        page: 0,
        size: SIZE,
        status: type[val]
      }
    }, () => {
      this.loadingList()
    })
  }

  // 获取提现数据
  loadingList = () => {
    const { dispatch } = this.props
    const { pagination, list } = this.state
    dispatch({
      type: 'treasury/getWidthdrawRecordList',
      payload: pagination,
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            list: [...list, ...data],
            paging: data.length < SIZE ? 'noMore' : 'loading',
            noData: [...list, ...data].length <= 0
          })
        }
      }
    })
  }

  // 渲染提现的每一条数据
  renderWidthdraw = () => {
    const { list } = this.state
    return (
      <Block>
        {
          list.map(ele => (
            <View
              key={ele.id}
              className="recordItem flex-row"
              onClick={() => { 
                this.$preload({
                  from: 'record',
                  cashInfo: ele
                })
                Taro.redirectTo({ url: '/pages/treasury/cashOutProgress/cashOutProgress' })
              }}
            >
              <IconFont value="imgExpenditure" h={66} w={66} mr={16} />
              <View className="flex1 recordRight">
                <View className="top flex-row flex-ac">
                  <Text className="title flex1">提现</Text>
                  <Text className="state" style={{ color: ele.state === 'WAIT_VERIFY' ? '#6997FF' : ele.allowFlag ? '#00C703' : '#FF643D' }}>
                    {ele.state === 'WAIT_VERIFY' ? '审核中'
                      : ele.allowFlag === true ? '通过' : '拒绝'}
                  </Text>
                </View>
                <View className="flex-row flex-ac">
                  <Text className="date flex1">{dateFormatWithDate(ele.addDate)}</Text>
                  <Text className="expenditure">
                    -￥
                    {parseFloat(ele.withdraw).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        }
      </Block>
    )
  }

  render() {
    const {
      current, list, paging, noData
    } = this.state
    return (
      <Block>
        <AtTabs current={current} tabList={this.tabList} onClick={this.changeTabs} />
        <View>
          {this.renderWidthdraw()}
        </View>
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
