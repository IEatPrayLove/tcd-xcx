import { Component } from '@tarojs/taro'
import { ScrollView, View, Text, Block } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import {
  AtActivityIndicator
} from 'taro-ui'
import {
  copyToClipboard, decodeURIObj, objNotNull, showToast
} from '../../utils/utils'
import './logisticsInfo.scss'
import NoData from '../../components/NoData/NoData'

/**
 * 物流信息页面
 */
@connect(({ loading, order }) => ({
  ajaxLoading: loading
}))
class LogisticsInfo extends Component {
    config = {
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
      navigationBarTitleText: '物流信息',
      disableScroll: true
    };

    constructor() {
      super()

      this.state = {
        orderLog: [], // 快递节点
        orderDetail: {}
      }
    }

    componentWillMount() {
    }

    componentDidMount() {
      const orderDetail = this.$router.params.order && decodeURIObj(this.$router.params.order) || {}
      this.setState({ orderDetail })
      if (objNotNull(orderDetail)) {
        if (orderDetail.fastMailSn && orderDetail.fastMailCompanyCode) {
          this.loadOrderLog(orderDetail.fastMailSn, orderDetail.fastMailCompanyCode)
        } else {
          showToast('物流信息未知')
        }
        // this.loadOrderLog("9894667336157", "ems");
      }
    }

    // 加载订单物流信息
    loadOrderLog = (waybillNo, ems) => {
      this.props.dispatch({
        type: 'order/getOrderLogisticsAction',
        payload: { waybillNo, companyCode: ems },
        callback: ({ data, ok }) => {
          // console.log(data);
          if (data.code === 0) {
            this.setState({
              orderLog: data.data[0].data
            })
          }
        }
      })
    };

    // 复制单号
    copyBillSn = text => {
      copyToClipboard(text)
    };


    render() {
      const { ajaxLoading = {} } = this.props
      const { orderLog = [], orderDetail = {} } = this.state

      return (
        <Block>
          {
            objNotNull(ajaxLoading) && ajaxLoading.effects['order/getOrderLogisticsAction'] && (
              <View className="atLoading"><AtActivityIndicator mode="center" content="加载中..." /></View>
            )
          }
          <ScrollView
            className="flex-col logistics-wrap"
            scrollY
          >
            <View className="header">
              <View className="item">
                <Text className="title">物流公司：</Text>
                <Text className="name">{orderDetail.fastMailCompany || '快递公司未知'}</Text>
              </View>
              <View className="flex-row item">
                <Text className="title">物流单号：</Text>
                <View className="flex-row flex-sb flex-ac flex1">
                  <Text className="name">{orderDetail.fastMailSn}</Text>
                  <Text
                    className="copy"
                    onClick={this.copyBillSn.bind(this, orderDetail.fastMailSn)}
                  >
                    复制
                  </Text>
                </View>
              </View>
            </View>
            <ScrollView
              className="flex1 list-scroll"
              scrollY
            >
              <View className="scroll-in more-one">
                {
                  orderLog.length > 0
                  && orderLog.map((o, i) => {
                    const dates = o.time && o.time.split(' ') || []
                    const date = dates.length > 0 ? dates[0].split('-') : []
                    const showDate = date.length === 3 ? `${date[1]}-${date[2]}` : '未知'
                    return (
                      <View className="flex-row flex-as item" key={i}>
                        {/* <View className="dot"/> */}
                        <View className="flex-col time">
                          <Text className="date">{showDate}</Text>
                          <Text className="hour">{dates[1]}</Text>
                        </View>
                        <View className="flex1 flex-row flex-ac right">
                          {/* <View className="title">已收货</View> */}
                          <View className="content">{o.context}</View>
                        </View>
                      </View>
                    )
                  })
                }
                {/*  <View className="flex-row flex-as item">
                            <View className="flex-col time">
                                <Text className="date">01-03</Text>
                                <Text className="hour">14：22</Text>
                            </View>
                            <View className="flex1 right">
                                <View className="title">已收货</View>
                                <View className="content">您已在成都武侯区航利中心完成取件，如有疑问请电联 028-64169041/17760527177，您的快递已经妥投，合
                                    作愉快，谢谢。</View>
                            </View>
                        </View>
                        <View className="flex-row flex-as item">
                            <View className="flex-col time">
                                <Text className="date">01-03</Text>
                                <Text className="hour">14：22</Text>
                            </View>
                            <View className="flex1 right">
                                <View className="title">已发货</View>
                                <View className="content">包裹正在等待揽收</View>
                            </View>
                        </View>
                        <View className="flex-row flex-as item">
                            <View className="flex-col time">
                                <Text className="date">01-03</Text>
                                <Text className="hour">14：22</Text>
                            </View>
                            <View className="flex1 right">
                                <View className="title">已发货</View>
                                <View className="content">包裹正在等待揽收</View>
                            </View>
                        </View>
                        <View className="flex-row flex-as item">
                            <View className="flex-col time">
                                <Text className="date">01-03</Text>
                                <Text className="hour">14：22</Text>
                            </View>
                            <View className="flex1 right">
                                <View className="title">已发货</View>
                                <View className="content">包裹正在等待揽收</View>
                            </View>
                        </View> */}
              </View>
            </ScrollView>
          </ScrollView>
        </Block>
      )
    }
}

export default LogisticsInfo
