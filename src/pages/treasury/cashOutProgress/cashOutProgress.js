import Taro from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import {
  View, Image, Text
} from '@tarojs/components'
import './cashOutProgress.scss'
import {
  dateFormatWithDate, showToast, getServerPic
} from '../../../utils/utils'
import { PLATFORM_ID, STATIC_IMG_URL } from '../../../config/baseUrl'
import ContactModal from '../../../components/ContactModal/ContactModal'


@connect(({ loading: { effects } }) => ({
  effects
}))
export default class cashOutProgress extends Taro.Component {
  config = {
    navigationBarTitleText: '提现明细',
    navigationBarBackgroundColor: '#fff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      preloadData: {},
      payInfo: {},
      dataInfo: {},
      from: ''
    }
  }

  componentDidShow() {
    const { from, cashInfo } = this.$router.preload
    this.setState({
      preloadData: cashInfo,
      from
    })
    if (from === 'record') {
      this.getWithdrawDetail(cashInfo.id)
    }
    this.getCashOutWayAction()
  }

  getWithdrawDetail = id => {
    const { dispatch } = this.props
    dispatch({
      type: 'treasury/getWithdrawDetail',
      payload: {
        id
      },
      callback: res => {
        if (res.ok) {
          this.setState({
            dataInfo: res.data
          })
        }
      }
    })
  }

  getCashOutWayAction = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'treasury/getCashOutWayAction',
      payload: {
        platformId: PLATFORM_ID
      },
      callback: res => {
        if (res.ok) {
          this.setState({
            payInfo: res.data
          })
        } else {
          Taro.atMessage({
            message: res.data.message,
            type: 'error'
          })
        }
      }
    })
  }

  render() {
    const {
      preloadData = {},
      payInfo,
      dataInfo,
      from
    } = this.state
    return (
      <View className="cashOutProgressBox">
        <View className="cashTip">提现金额</View>
        <View className="cashNum">{`￥${parseFloat(preloadData.withdraw).toFixed(2)}`}</View>
        {
          // payInfo.payWay  1.私下转账 2.微信自动转账
          payInfo.payWay === 1 && ((from === 'record' && dataInfo.state === 'WAIT_VERIFY') || from === 'cashOut') && (
            <View className="wechatBox">
              <View className="tipsTitle">由于商家使用的是私下转账的模式请添加商户微信：</View>
              <View className="wechatNum flex-row flex-ac flex-jc">
                <Text>{payInfo.personalCountTransferWachatNo}</Text>
                <View 
                  className="copyWe"
                  onClick={() => {
                    Taro.setClipboardData({
                      data: payInfo.personalCountTransferWachatNo
                    }).then(() => { 
                      showToast('复制成功')
                    })
                  }}
                >
                  复制
                </View>
              </View>
              <Image className="wechatImg" src={getServerPic(payInfo.personalCountTransferWachatQrUrl)} />
            </View>
          )
        }
        <View className="progressBox">
          <View className="progressTip">当前状态</View>
          <View className="cashOutProgressLine" />
          <View className="cashOutProgressItem">
            <View className="cashOutProgressIcon">
              <View className="cashOutProgressCircle" />
            </View>
            <View className="cashOutProgressContent">
              <View className="cashOutProgressTitle">提现申请已提交</View>
              <View className="cashOutProgressTip">{dateFormatWithDate(preloadData.addDate)}</View>
            </View>
          </View>
          {
            from === 'record' ? (
              <View className="cashOutProgressItem cashOutItemMar">
                <View className="cashOutProgressIcon">
                  {
                    dataInfo.state === 'WAIT_VERIFY' ? (
                      <Image src={`${STATIC_IMG_URL}/icon/treasury_wait.png`} />
                    ) : dataInfo.allowFlag ? (
                      <Image src={`${STATIC_IMG_URL}/icon/treasury_success.png`} />
                    ) : (
                      <Image src={`${STATIC_IMG_URL}/icon/treasury_fail.png`} />
                    )
                  }
                </View>
                <View className="cashOutProgressContent">
                  <View className="cashOutProgressTitle">
                    {
                      dataInfo.state === 'WAIT_VERIFY' ? '商家审核中'
                        : dataInfo.allowFlag ? '审核通过' 
                          : '审核失败'
                    }
                  </View>
                  <View className="cashOutProgressTip">
                    {
                      dataInfo.state === 'WAIT_VERIFY' ? '预计会在1-3个工作日反馈审核结果' 
                        : dataInfo.allowFlag ? (
                          <View>
                            提现金额商户将通过个人微信转账形式为您转款
                          </View>
                        )
                        : '审核失败'
                    }
                    {
                      dataInfo.allowFlag === false && (
                        <Text>
                          拒绝理由：
                          {dataInfo.notices}
                        </Text>
                      )
                    }
                    {dataInfo.allowFlag != null && <View>{dateFormatWithDate(dataInfo.stateChangeDate)}</View>}
                  </View>
                </View>
              </View>
            ) : (
              <View className="cashOutProgressItem cashOutItemMar">
                <View className="cashOutProgressIcon">
                  <Image src={`${STATIC_IMG_URL}/icon/treasury_wait.png`} />
                </View>
                <View className="cashOutProgressContent">
                  <View className="cashOutProgressTitle">商家审核中</View>
                  <View className="cashOutProgressTip">预计会在1-3个工作日反馈审核结果</View>
                </View>
              </View>
            )
          }
        </View>
        <View className="cashOutProgressInfo">
          <View className="cashOutInfoItem">
            <Text>交易单号</Text>
            <Text className="cashOutInfoItemWord">{preloadData.orderSn}</Text>
          </View>
          {
            dataInfo.allowFlag && (
              <View className="cashOutInfoItem">
                <Text>商户微信</Text>
                <View className="cashOutInfoItemWord flex-row">
                  {payInfo.personalCountTransferWachatNo}
                  <View 
                    className="copyWe"
                    onClick={() => {
                      Taro.setClipboardData({
                        data: payInfo.personalCountTransferWachatNo
                      }).then(() => { 
                        showToast('复制成功')
                      })
                    }}
                  >
                    复制
                  </View>
                </View>
              </View>
            )
          }
          {
            dataInfo.allowFlag && (
              <View className="cashOutInfoItem">
                <Image className="weImg" src={getServerPic(payInfo.personalCountTransferWachatQrUrl)} />
              </View>
            )
          }
        </View>

        <ContactModal />
        {/* <AtModal isOpened={modalVisible}>
          <AtModalContent className="cashOutModal">
            <View className="modalTitle">
              <AtIcon
                value="close"
                size="15"
                color="#333"
                onClick={() => {
                  this.setState({
                    modalVisible: false
                  })
                }}
              />
            </View>
            <View
              className="modalMoney"
              onClick={() => {
                this.setState({
                  modalVisible: false
                })
              }}
            >
              点击按钮，发送"999"加客服微信
            </View>
            <View className="modalBtnGroup">
              <Button
                className="modalBtn modalBtnCancel"
                openType="contact"
                onClick={() => {
                  this.setState({
                    modalVisible: false
                  })
                }}
              >
                立即加入
              </Button>
            </View>
          </AtModalContent>
        </AtModal> */}
      </View>
    )
  }
}
