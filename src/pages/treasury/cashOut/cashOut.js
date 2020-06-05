import Taro from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import {
  View, Image, Text, Button, Input
} from '@tarojs/components'
import {
  AtMessage, AtModal, AtModalAction, AtModalContent
} from 'taro-ui'
import './cashOut.scss'
import { hideLoading, showLoading } from '../../../utils/utils'
import * as config from '../../../config/baseUrl'

@connect(({ loading: { effects } }) => ({
  effects
}))
export default class cashOut extends Taro.PureComponent {
  config = {
    navigationBarTitleText: '提现申请',
    navigationBarBackgroundColor: '#fff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      money: this.$router.params.amount,
      cashOutMoney: '',
      modalVisible: false,
      limitWithdraws: 0, // 提现金额
      widthdrawRequireModalVisible: false
    }
  }

  componentDidShow() {
    this.getWithdrawRequire()
  }

  // 获取提现条件
  getWithdrawRequire =() => {
    const { dispatch } = this.props
    dispatch({
      type: 'treasury/getWithdrawRequire',
      payload: {},
      callback: res => {
        if (res.ok) {
          this.setState({
            limitWithdraws: res.data.limitWithdraws
          })
        }
      }
    })
  }

  // 提现跳转 如果满足提现的输入金额大于体现限制的金额可以跳转，否则提示
  isSatisfyWidthdraw = () => {
    const { limitWithdraws, cashOutMoney } = this.state
    if (parseFloat(limitWithdraws) > parseFloat(cashOutMoney)) {
      this.setState({
        widthdrawRequireModalVisible: true
      })
    } else {
      this.setState({
        modalVisible: true
      })
    }
  }

  // 确认提现 创建提现记录
  createWidthdraw = () => {
    const { cashOutMoney } = this.state
    const { dispatch } = this.props
    showLoading()
    dispatch({
      type: 'treasury/createWidthdraw',
      payload: {
        tcdId: config.PLATFORM_ID,
        withdraw: cashOutMoney,
        userOpenId: '11111'
      },
      callback: res => {
        hideLoading()
        if (res.ok) {
          this.$preload({
            from: 'cashOut',
            cashInfo: res.data
          })
          Taro.redirectTo({ url: '/pages/treasury/cashOutProgress/cashOutProgress' })
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
      money, cashOutMoney, modalVisible, widthdrawRequireModalVisible, limitWithdraws
    } = this.state
    return (
      <View className="cashOutBox">
        <View className="cashOutPayWay">
          到账账户：
          <Image src={`${config.STATIC_IMG_URL}/icon/pay_wechat.png`} />
          <Text>微信零钱</Text>
        </View>
        <View className="cashOutBody">
          <View className="cashOutTitle">提现金额</View>
          <View className="cashOutInput">
            <Text>￥</Text>
            <Input
              value={cashOutMoney}
              placeholder="请输入提现金额"
              placeholder-class="cashOutInputPlaceholder"
              type="digit"
              onInput={e => {
                this.setState({
                  cashOutMoney: e.detail.value
                })
              }}
              onBlur={e => {
                this.setState({
                  cashOutMoney: Number(e.detail.value).toFixed(2)
                })
              }}
            />
          </View>
          <View className="cashOutInfo">
            总余额为￥
            {money}
            <Text
              className="cashOutAll"
              onClick={() => {
                this.setState({
                  cashOutMoney: money
                })
              }}
            >
              全部提现
            </Text>
          </View>
          <View
            className="cashOutBtn"
            onClick={this.isSatisfyWidthdraw}
          >
            提现
          </View>
        </View>
        {/* 确认提现 */}
        <AtModal isOpened={modalVisible}>
          <AtModalContent className="cashOutModal">
            <View className="modalTitle">确认提现</View>
            <View
              className="modalMoney"
              onClick={() => {
                this.setState({
                  modalVisible: false
                })
              }}
            >
              {cashOutMoney}
            </View>
            <View className="modalBtnGroup">
              <View
                className="modalBtn modalBtnCancel"
                onClick={() => {
                  this.setState({
                    modalVisible: false
                  })
                }}
              >
                取消
              </View>
              <View
                className="modalBtn modalBtnConfirm"
                onClick={this.createWidthdraw}
              >
                确认提现
              </View>
            </View>
          </AtModalContent>
        </AtModal>
        {/* 是否满足提现要求 输入金额大于限制金额 */}
        <AtModal
          className="confirmModal"
          isOpened={widthdrawRequireModalVisible}
          onClose={() => {
            this.setState({
              widthdrawRequireModalVisible: false
            })
          }}
        >
          <AtModalContent>
            <View className="hint">{`提现金额不得低于${limitWithdraws}`}</View>
          </AtModalContent>
          <AtModalAction>
            <Button
              onClick={() => {
                this.setState({
                  widthdrawRequireModalVisible: false
                })
              }}
            >
              知道了
            </Button>
          </AtModalAction>
        </AtModal>
        <AtMessage />
      </View>
    )
  }
}
