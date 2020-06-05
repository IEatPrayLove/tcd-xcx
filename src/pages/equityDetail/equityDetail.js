import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Image, Text
} from '@tarojs/components'
import {
  connect
} from '@tarojs/redux'
import './equityDetail.scss'
import { dateFormat, getServerPic, objNotNull } from '../../utils/utils'
import PageLoading from '../../components/PageLoading/PageLoading'
import IconFont from '../../components/IconFont/IconFont'

const dayjs = require('dayjs')

@connect(({
  loading: { effects }
}) => ({
  effects
}))
export default class EquityDetail extends PureComponent {
  config = {
    navigationBarTitleText: '卡券详情',
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#ffffff'
  }

  constructor() {
    super()
    this.state = {
      orderDetail: {},
      noOrder: false,
      orderSn: null,
      screenBrightness: null
    }
  }

  componentWillPreload(params) {
    const { orderSn } = params
    this.setState({ orderSn: orderSn || fromMsg }, this.loadDetail)
  }

  componentDidMount() {
    const { orderSn: fromMsg } = this.$router.params
    console.log(fromMsg)
  }

  loadDetail = () => {
    const { dispatch } = this.props
    const { orderSn } = this.state
    Taro.getScreenBrightness({
      success: ({ value }) => {
        this.setState({
          screenBrightness: value
        })
      }
    })
    dispatch({
      type: 'order/getOrderDetailAction',
      payload: { orderSn },
      callback: ({ ok, data }) => {
        if (ok && objNotNull(data)) {
          Taro.setScreenBrightness({
            value: 1
          })
          const {
            shopOrderProductInfoDTOS: [{ imageUrl, productName }],
            orderWriteOffCodeDTOS,
            orderSn, addTime, useRules
          } = data
          this.setState({
            orderDetail: {
              imageUrl,
              productName,
              consumeCode: orderWriteOffCodeDTOS,
              orderSn,
              addTime,
              useRules
            },
            noOrder: false
          })
        } else {
          this.setState({
            noOrder: true
          })
        }
      }
    })
  }

  componentWillUnmount() {
    const { screenBrightness } = this.state
    Taro.setScreenBrightness({
      value: screenBrightness
    })
  }

  render() {
    const {
      orderDetail: {
        imageUrl, productName, orderSn, addTime,
        consumeCode = [], useRules = []
      }, noOrder
    } = this.state
    const {
      effects = {}
    } = this.props
    const validityTime = dayjs(addTime * 1000).add(1, 'day').format('YYYY-M-D')
    return (
      <Block>
        {
          effects['order/getOrderDetailAction'] && <PageLoading />
        }
        {
          noOrder && (
            <View
              className="noOrder flex-col flex-ac flex-jc"
            >
              <IconFont value="imgNoOrder" w={172} h={150} />
              <Text className="weight">订单生成中</Text>
              <Text
                className="refresh"
                onClick={this.loadDetail}
              >
                点击刷新
              </Text>
            </View>
          )
        }
        <View className="couponInfo flex-col flex-ac flex-sb">
          <Image className="logo" src={getServerPic(imageUrl)} />
          <Text className="name">{productName}</Text>
          <Text className="validDay">{`${validityTime} 10:00`}</Text>
        </View>
        <View className="consumerCode flex-col flex-ac flex-sb">
          <Text className="title">消费码</Text>
          {
            consumeCode.map(ele => {
              const {
                codeUrl, writeOffCode, id,
                reserveUrl, leWanCodeType
              } = ele
              return (
                <Block key={id}>
                  {
                    leWanCodeType === 1 ? (
                      <View className="flex-col flex-ac">
                        <Text className="code">
                          {reserveUrl}
                        </Text>
                        <View
                          className="copy"
                          onClick={() => {
                            Taro.setClipboardData({
                              data: reserveUrl
                            })
                          }}
                        >
                          复制
                        </View>
                      </View>
                    ) : (
                      <Image
                        className="codeImg"
                        src={leWanCodeType === 0 ? reserveUrl : getServerPic(codeUrl)}
                        mode="aspectFit"
                        onClick={() => {
                          Taro.previewImage({
                            current: getServerPic(leWanCodeType === 0 ? reserveUrl : getServerPic(codeUrl)), // 当前显示图片的http链接
                            urls: [getServerPic(leWanCodeType === 0 ? reserveUrl : getServerPic(codeUrl))] // 需要预览的图片http链接列表
                          })
                        }}
                      />
                    )
                  }
                </Block>
              )
            })
          }
        </View>
        <View className="couponRule flex-col">
          <Text className="buyDay">{`购买时间： ${dateFormat(addTime)}`}</Text>
          <Text>{`订单编号： ${orderSn}`}</Text>
          <Text className="ruleTitle">使用须知</Text>
          {
            useRules.map((ele, index) => <Text key={index}>{`${ele}`}</Text>)
          }
        </View>
      </Block>
    )
  }
}
