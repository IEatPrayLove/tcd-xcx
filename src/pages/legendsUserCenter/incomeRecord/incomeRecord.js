import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Text, Image, Picker
} from '@tarojs/components'
import {
  AtIcon, AtActivityIndicator
} from 'taro-ui'
import { connect } from '@tarojs/redux'
import './incomeRecord.scss'
import {
  judgeTimeRange, getDateDiff, getUserDetail, getServerPic
} from '../../../utils/utils'
import NoData from '../../../components/NoData/NoData'
import { STATIC_IMG_URL } from '../../../config/baseUrl'

@connect(({ loading: { effects } }) => ({ effects }))
export default class incomeRecord extends PureComponent {
  config = {
    navigationBarTitleText: '收益记录',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      totalTerm: [], // 总期数
      curTerm: {}, // 当前期数
      curTermList: {},
      typeVisible: false,
      typeList: [{ id: 1, categoryName: '本期' }, { id: 2, categoryName: '往期' }],
      categoryId: '',
      typeName: '本期',
      noData: false
    }
  }

  componentDidMount() {
    const { dispatch } = this.props
    dispatch({
      type: 'legendsCard/getRewardPoolConfigAction',
      callback: ({ ok, data }) => {
        if (ok && data.length > 0) {
          let totalTerm = data.map(ele => ({ ...ele, term: `${ele.times}期` }))
          let { endTime, startTime } = data[0]
          this.getUserLegendsDetail(`${startTime}Z`, `${endTime}Z`)
          endTime = new Date(getDateDiff(endTime.replace('T', ' '))).getTime()
          startTime = new Date(getDateDiff(startTime.replace('T', ' '))).getTime()
          if (judgeTimeRange(startTime, endTime)) {
            totalTerm[0].term = '本期'
          }
          this.setState({
            totalTerm,
            curTerm: totalTerm[0]
          })
        }
      }
    })
  }

  getUserLegendsDetail = (startTime, endTime) => {
    const { dispatch } = this.props
    dispatch({
      type: 'legendsCard/getUserLegendsCardDetail',
      payload: {
        startTime, endTime
      },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            curTermList: data,
            noData: data.userProfitList.length <= 0
          })
        }
      }
    })
  }

  changeTerm = e => {
    const { value } = e.detail
    const { totalTerm } = this.state
    let { endTime, startTime } = totalTerm[value]
    this.getUserLegendsDetail(`${startTime}Z`, `${endTime}Z`)
    this.setState({
      curTerm: totalTerm[value],
      noData: false
    })
  }

  render() {
    const {
      typeVisible, typeName, typeList, noData,
      totalTerm, curTerm: { term }, curTermList: {
        totalReward, pullNumber, userProfitList = []
      }
    } = this.state
    const { effects = {} } = this.props
    return (
      <View className="incomeBox">
        <View className="incomeHeader">
          <Picker
            mode="selector"
            range={totalTerm}
            rangeKey="term"
            onChange={this.changeTerm}
          >
            <View
              className="incomeType"
            >
              {term}
              {
                !typeVisible && <AtIcon value="chevron-down" size="15" color="#999" />
              }
              {
                typeVisible && <AtIcon value="chevron-up" size="15" color="#999" />
              }
            </View>
          </Picker>
          <View className="incomeInfo">
            <View className="incomeInfoItem marR">
              获得赏金：
              <Text>{`￥${totalReward || 0}`}</Text>
            </View>
            <View className="incomeInfoItem">{`办理人数：${pullNumber || 0}`}</View>
          </View>
        </View>
        <View className="incomeList">
          {
            (effects['legendsCard/getRewardPoolConfigAction'] || effects['legendsCard/getUserLegendsCardDetail']) && (
              <View className="loading">
                <AtActivityIndicator mode="center" content="加载中..." />
              </View>
            )
          }
          {
            noData && (
              <NoData />
            )
          }
          {
            userProfitList.map(ele => {
              const {
                id, changeAmount, userProfitType, createTime,
                islandUserDTO: { headPic, nickName }
              } = ele
              // DISTRIBUTOR_CARD_PROFIT 分享会员卡收益
              // DISTRIBUTOR_CARD_REWARDS_POOL_PROFIT 分享会员卡瓜分赏金池
              return (
                <View key={id} className="incomeListItem">
                  <View className="incomeItemHeader">
                    <Image src={userProfitType === 'DISTRIBUTOR_CARD_REWARDS_POOL_PROFIT' ? `${STATIC_IMG_URL}/icon/income.png` : getServerPic(headPic)} />
                  </View>
                  <View className="incomeItemBody">
                    <View className="incomeItemTitle">
                      { userProfitType === 'DISTRIBUTOR_CARD_REWARDS_POOL_PROFIT' ? '瓜分奖金池' : nickName}
                    </View>
                    <View className="incomeItemTime">{createTime.replace('T', ' ')}</View>
                    <View className="incomeItemMoney">{`+${changeAmount}`}</View>
                  </View>
                </View>
              )
            })
          }
        </View>
      </View>
    )
  }
}
