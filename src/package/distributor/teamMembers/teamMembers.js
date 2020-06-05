import Taro from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import {
  View, Image, Text, Block, Button
} from '@tarojs/components'
import { AtTabs, AtLoadMore } from 'taro-ui'
import './teamMembers.scss'
import { SIZE } from '../../../config/config'
import IconFont from '../../../components/IconFont/IconFont'
import { dateFormatWithDate, getServerPic } from '../../../utils/utils'
import NoData from '../../../components/NoData/NoData'

@connect(({ loading: { effects } }) => ({
  effects
}))
export default class teamMembers extends Taro.PureComponent {
  config = {
    navigationBarTitleText: '',
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#ffffff'
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
      paging: 'loading'
    }
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

  // 获取提现数据
  loadingList = () => {
    const team = this.$router.params.team;
    const parentId = this.$router.params.parentId;
    const { dispatch } = this.props
    const { pagination, list } = this.state
    Taro.setNavigationBarTitle({ title: team === 'two' ? '二级团队' : '一级团队' })
    dispatch({
      type: 'distributor/getTeamMemberList',
      payload: {
        team:team,
        parentId:parentId,
        ...pagination
      },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            list: [...list, ...data],
            paging: data.length < SIZE ? 'noMore' : 'loading'
          })
        }
      }
    })
  }

  // 渲染提现的每一条数据
  renderTeamMember = () => {
    const { list } = this.state
    return (
      <Block>
        {
          list.map(ele => (
            <View
              className="teamItem flex-row"
              key={ele.id}
            >
              <Image className="logo" src={getServerPic(ele.islandUserDTO&&ele.islandUserDTO.headPic)}/>
              <View className="flex1 teamRight">
                <View className="top">
                  <Text className="title flex1">{ele.islandUserDTO&&ele.islandUserDTO.nickName}</Text>
                  <Image className="rankLogo" src={getServerPic(ele.rankLogo)} />
                </View>
                <View className="flex-row flex-ac">
                  <Text className="date flex1">加入时间：{dateFormatWithDate(ele.joinDate)}</Text>
                </View>
                <View className="flex-row flex-ac">
                  <Text className="date flex1">累计分享单量：{ele.orderCount}</Text>
                  <View className="flex-row flex-ac date">
                    <Text>我获得的收益：</Text>
                    <Text className="inCome">
                      ￥{ele.selfProfit?parseFloat(ele.selfProfit).toFixed(2):'0.00'}
                    </Text>
                  </View>

                </View>
              </View>
            </View>
          ))
        }
      </Block>
    )
  }

  render() {
    const { current, list, paging } = this.state
    return (
      <Block>
        <View>
          {this.renderTeamMember()}
        </View>
        {
          list && list.length <= 0 && (
            <NoData />
          )
        }
        {
          list.length > 0 && <AtLoadMore status={paging} />
        }
      </Block>
    )
  }
}
