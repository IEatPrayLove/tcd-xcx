import Taro from '@tarojs/taro'
import {
  View, Image, Text
} from '@tarojs/components'
import { AtTabs, AtTabsPane, AtActivityIndicator } from 'taro-ui'
import './certificationRecord.scss'
import { connect } from '@tarojs/redux'
import { STATIC_IMG_URL } from '../../config/baseUrl'
import { SIZE } from '../../config/config'
import { dateFormatWithDate } from '../../utils/utils'

@connect(({ loading: { effects } }) => ({
  effects
}))
export default class certificationRecord extends Taro.PureComponent {
  config = {
    navigationBarTitleText: '认证记录'
  };

  constructor() {
    super()
    this.state = {
      currentTab: 0,
      tabList: [
        {
          title: '全部'
        },
        {
          title: '审核中'
        },
        {
          title: '已审核'
        }
      ],
      recordList: [],
      page: 0,
      loading: false,
      isOver: false
    }
  }

  componentWillMount() {
    this.getCertificationList()
  }

  onReachBottom() {
    const { page } = this.state
    this.setState({
      loading: true,
      page: page + 1
    }, () => {
      this.getCertificationList()
    })
  }

  handleClick(value) {
    this.setState({
      currentTab: value,
      recordList: [],
      page: 0,
      loading: false
    }, () => {
      this.getCertificationList()
    })
  }

  getCertificationList() {
    const { currentTab, page, recordList } = this.state
    const checkStatus = currentTab === 0 ? '' : (currentTab === 1 ? -1 : 2)
    this.props.dispatch({
      type: 'mine/dertificationRecordAction',
      payload: {
        checkState: checkStatus, // -1:未审核 0:审核失败  1:审核成功 2:已审核
        page,
        size: SIZE,
        sort: 'id,desc'
      },
      callback: res => {
        if (res.ok) {
          if (res.data.length > 0) {
            this.setState({
              recordList: [...recordList, ...res.data],
              loading: false
            })
          } else {
            this.setState({
              isOver: true
            })
          }
        }
      }
    })
  }

  renderloadingBlock = () => {
    const { isOver } = this.state
    return (
      <View className="loadBlock">
        {
          isOver && <Text>没有更多了</Text>
        }
        {
          !isOver && <AtActivityIndicator content="加载中... " color="#F59F2E" size={32} />
        }
      </View>
    )
  }

  render() {
    const {
      currentTab, tabList, recordList, loading
    } = this.state
    return (
      <View>
        <AtTabs current={currentTab} tabList={tabList} className="attestationTab" onClick={this.handleClick.bind(this)}>
          <AtTabsPane current={currentTab} className="attestationTabItem" index={0}>
            <View className="attestationList">
              {
                recordList && recordList.map((item, index) => (
                  <View className="attestationItem" key={index}>
                    <View className="attestationItemTitle">
                      <Text className="itemTitleTime">
                        提交时间：
                        {item.createTime.replace('T', ' ')}
                      </Text>
                      {
                        item.checkResult === -1 && <Text className="itemTitleStatus_ing">审核中</Text>
                      }
                      {
                        item.checkResult !== -1 && <Text className="itemTitleStatus_ed">已审核</Text>
                      }
                    </View>
                    <View className="attestationItemBody">
                      <View className="attestationStatusImg">
                        {
                          item.checkResult === 0 && <Image src={`${STATIC_IMG_URL}/attestation-fail.png`} />
                        }
                        {
                          item.checkResult === 1 && <Image src={`${STATIC_IMG_URL}/attestation-success.png`} />
                        }
                      </View>
                      <View className="attestationItemInfo">
                        <View className="itemInfoCircle" />
                        认证平台：
                        {item.placeName}
                      </View>
                      <View className="attestationItemInfo">
                        <View className="itemInfoCircle" />
                        认证内容：
                      </View>
                      <View className="userName">
                        {item.placeName}
                        用户名：
                        {item.placeUserName}
                      </View>
                      <View className="attestationItemInfo">
                        {item.placeName}
                        ID：
                        {item.placeUserId }
                      </View>
                      <View className="attestationItemInfo">
                        粉丝数：
                        {item.fansNum }
                      </View>
                      {
                        item.checkResult !== -1 && (
                          <View className="attestationItemInfo">
                            审核时间：
                            {item.checkTime && item.checkTime.replace('T', ' ')}
                          </View>
                        )
                      }
                      {
                        item.checkResult === 0 && (
                          <Text className="failedResult">
                            {`失败原因：${item.checkFailReason || '--'}`}
                          </Text>
                        )
                      }
                    </View>
                  </View>
                ))
              }
              {
                loading && this.renderloadingBlock()
              }
            </View>
          </AtTabsPane>
          <AtTabsPane current={currentTab} className="attestationTabItem" index={1}>
            <View className="attestationList">
              {
                recordList && recordList.map((item, index) => (
                  <View className="attestationItem" key={index}>
                    <View className="attestationItemTitle">
                      <Text className="itemTitleTime">
                        提交时间：
                        {dateFormatWithDate(item.createTime)}
                      </Text>
                      {
                        item.checkResult === -1 && <Text className="itemTitleStatus_ing">审核中</Text>
                      }
                      {
                        item.checkResult !== -1 && <Text className="itemTitleStatus_ed">已审核</Text>
                      }
                    </View>
                    <View className="attestationItemBody">
                      <View className="attestationItemInfo">
                        <View className="itemInfoCircle" />
                        认证平台：
                        {item.placeName}
                      </View>
                      <View className="attestationItemInfo">
                        <View className="itemInfoCircle" />
                        认证内容：
                      </View>
                      <View className="attestationItemInfo">
                        {item.placeName}
                        用户名：
                        {item.placeUserName}
                      </View>
                      <View className="attestationItemInfo">
                        {item.placeName}
                        ID：
                        {item.placeUserId }
                      </View>
                      <View className="attestationItemInfo">
                        粉丝数：
                        {item.fansNum }
                      </View>
                    </View>
                  </View>
                ))
              }
              {
                loading && this.renderloadingBlock()
              }
            </View>
          </AtTabsPane>
          <AtTabsPane current={currentTab} className="attestationTabItem" index={2}>
            <View className="attestationList">
              {
                recordList && recordList.map((item, index) => (
                  <View className="attestationItem" key={index}>
                    <View className="attestationItemTitle">
                      <Text className="itemTitleTime">
                        提交时间：
                        {dateFormatWithDate(item.createTime)}
                      </Text>
                      {
                        item.checkResult === -1 && <Text className="itemTitleStatus_ing">审核中</Text>
                      }
                      {
                        item.checkResult !== -1 && <Text className="itemTitleStatus_ed">已审核</Text>
                      }
                    </View>
                    <View className="attestationItemBody">
                      <View className="attestationStatusImg">
                        {
                          item.checkResult === 0 && <Image src={`${STATIC_IMG_URL}/attestation-fail.png`} />
                        }
                        {
                          item.checkResult === 1 && <Image src={`${STATIC_IMG_URL}/attestation-success.png`} />
                        }
                      </View>
                      <View className="attestationItemInfo">
                        <View className="itemInfoCircle" />
                        认证平台：
                        {item.placeName}
                      </View>
                      <View className="attestationItemInfo">
                        <View className="itemInfoCircle" />
                        认证内容：
                      </View>
                      <View className="attestationItemInfo">
                        {item.placeName}
                        用户名：
                        {item.placeUserName}
                      </View>
                      <View className="attestationItemInfo">
                        {item.placeName}
                        ID：
                        {item.placeUserId }
                      </View>
                      <View className="attestationItemInfo">
                        粉丝数：
                        {item.fansNum }
                      </View>
                      <View className="attestationItemInfo">
                        审核时间：
                        {item.checkTime && item.checkTime.replace('T', ' ')}
                      </View>
                      {
                        item.checkResult === 0 && (
                          <Text className="failedResult">
                            {`失败原因：${item.checkFailReason || '--'}`}
                          </Text>
                        )
                      }
                    </View>
                  </View>
                ))
              }
              {
                loading && this.renderloadingBlock()
              }
            </View>
          </AtTabsPane>
        </AtTabs>
      </View>
    )
  }
}
