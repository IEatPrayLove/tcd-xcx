import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Text
} from '@tarojs/components'
import './stationedRecord.scss'
import { connect } from '@tarojs/redux'
import { dateFormatWithDate, navToPage } from '../../../utils/utils'
// import { } from 'taro-ui'

@connect(({ businessmenStationed }) => ({}))
export default class stationedRecord extends PureComponent {
  config = {
    navigationBarTitleText: '入驻记录'
  }

  constructor() {
    super()
    this.state = {
      recordStatus: 2, // 0: 审核中   1: 审核失败   2: 入驻成功
      platformId: '',
      brandInfo: {}
    }
  }

  componentWillMount() {
    this.getPlatformAction()
  }

  // 获取平台id
  getPlatformAction = () => {
    Taro.getStorage({
      key: 'userId'
    }).then(res => {
      this.props.dispatch({
        type: 'businessmenStationed/getPlatformAction',
        payload: {
          userId: res.data
        },
        callback: ({ ok, data }) => {
          if (ok) {
            this.setState({
              platformId: data[0].id
            }, () => {
              this.stationedRecordInfoAction()
            })
          }
        }
      })
    })
  }

  // 获取入驻信息
  stationedRecordInfoAction = () => {
    const { platformId } = this.state
    this.props.dispatch({
      type: 'businessmenStationed/stationedRecordInfoAction',
      payload: {
        platformId,
        type: 1
      },
      callback: ({ ok, data }) => {
        if (ok) {
          console.log(data)
          this.setState({
            brandInfo: data
          })
        }
      }
    })
  }

  render() {
    const { brandInfo } = this.state
    // 入驻平台平台情况：1 未入驻 2 审核中 3 入驻成功 4 入驻失败 5 关闭营业 6关店
    return (
      <View className="recordBox">
        <View className="recordTitle">
          入驻申请记录
          {
            brandInfo.enteringInfo === 2 ? <Text className="recordStatus colorBlue">审核中</Text> : (brandInfo.enteringInfo === 4 ? <Text className="recordStatus colorRed">审核失败</Text> : <Text className="recordStatus colorGreen">审核成功</Text>)
          }
        </View>
        {
          brandInfo.enteringInfo === 4 && (
          <View className="recordWord marTM">
            失败原因：
            {brandInfo.reason}
          </View>
          )
        }
        <View className="recordWord marTL marB">{brandInfo.brandName}</View>
        <View className="recordWord marB">
          联系人：
          {brandInfo.contactName}
          (
          {brandInfo.contactPhone}
          )
        </View>
        <View className="recordWord">
          提交时间：
          {dateFormatWithDate(brandInfo.addDate)}
        </View>
        {
          brandInfo.enteringInfo === 4 && (
          <View
            className="recordSubmit"
            onClick={() => {
              navToPage('/pages/businessmenStationed/stationedSetting/stationedSetting')
            }}
          >
            重新提交
          </View>
          )
        }
        {
          brandInfo.enteringInfo === 3 && (
          <View className="recordSuccess">
            <View className="recordWord marB">您已入驻成功</View>
            <View className="recordWord">请到电脑端商户后台进行您的品牌管理</View>
            <View className="rewordLink marTM">http://manager.canyingdongli.com</View>
            <View
              className="recordSuccessBtn"
              onClick={() => {
                Taro.setClipboardData({
                  data: 'http://manager.canyingdongli.com'
                }).then(() => { })
              }}
            >
              复制网址
            </View>
          </View>
          )
        }
      </View>
    )
  }
}
