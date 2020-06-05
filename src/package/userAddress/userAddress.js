import Taro, { Component } from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import { Button, ScrollView, Text, View, Block } from '@tarojs/components'
import { AtActivityIndicator, AtMessage } from 'taro-ui'
import './userAddress.scss'
import {
  encodeURIObj,
  hideLoading,
  navBackExeFun,
  navToPage,
  showLoading,
  showToast
} from '../../utils/utils'
// import NoData from '../../component/NoData/NoData'
import { GOODS_TAKE_OUT } from '../../config/config'
import IconFont from '../../components/IconFont/IconFont'

/**
 * 我的地址页面
 */
//@authenticate
@connect(({ loading, userAddress }) => ({
  addressList: userAddress.addressList,
  notInRangeList: userAddress.notInRangeList,
  ajaxLoading: loading
}))
class UserAddress extends Component {

  config = {
    'navigationBarBackgroundColor': '#ffffff',
    'navigationBarTextStyle': 'black',
    'navigationBarTitleText': ''
  }

  constructor() {
    super()
    const formPage = this.$router.params.formPage || ''//是否来自于订单页面;
    // const rangeArea = this.$router.params.rangeArea
    this.state = {
      formPage: formPage//是否来自于订单页面
      // rangeArea:rangeArea, // 订单页来的配送范围
      // inRangeList:[],// 在范围的地址
      // notInRangeList:[] // 不在范围的地址
    }
  }

  componentWillMount() {
  }

  componentDidMount() {
    const { formPage } = this.state//是否来自于订单页面;
    if (formPage && formPage === 'orderConfirm') {
      Taro.setNavigationBarTitle({ title: '选择地址' })
    } else {
      Taro.setNavigationBarTitle({ title: '我的收货地址' })
    }
  }

  componentDidShow() {
    this.loadAddressList()
  }

  //加载用户地址信息
  loadAddressList = () => {
    // showLoading()
    const { formPage, rangeArea, orderType } = this.$router.params
    let payload = formPage && rangeArea && formPage === 'orderConfirm' && orderType - 0 === GOODS_TAKE_OUT ? JSON.parse(rangeArea) : []
    this.props.dispatch({
      type: 'userAddress/getUserAddressAction',
      payload,
      callback: () => {
        // hideLoading()
      }
    })
  }


  //跳转到新增地址
  addAddress = (type, item, e) => {
    if (type === 'EDIT') {
      e.stopPropagation()
    } else {
      const { addressList = [] } = this.props
      if (addressList.length >= 30) {
        showToast('最多只能添加30个地址')
        return
      }
    }
    navToPage(`/pages/userAddressModify/userAddressModify?oldAddress=${type === 'NEW' ? encodeURIObj({}) : encodeURIObj(item)}&formPage=${this.state.formPage}&range=${this.$router.params.rangeArea}&orderType=${this.$router.params.orderType}`)
  }

  //地址被点击
  onClickItem = (item) => {
    if (item.enabled) { //如果已经是默认地址
      this.setCurrentAddress(item)
      return
    }
    Taro.showModal({
      title: '是否设置为默认地址？',
      confirmText: '是',
      cancelText: '否'
    })
      .then(res => {
        if (res.confirm) {
          if (!item.id) {
            return
          }
          this.props.dispatch({
            type: 'userAddressModify/saveUserAddressAction',
            payload: {
              ...item,
              enabled: true
            },
            callback: ({ ok }) => {
              this.setCurrentAddress(item)
              if (ok) {
                showToast(`设置成功`)
                //重新获取一遍列表
                this.props.dispatch({
                  type: 'userAddress/getUserAddressAction',
                  callback: ({ ok }) => {
                  }
                })
              }
            }
          })
        } else {
          this.setCurrentAddress(item)
        }
      })
  }

  //设置用户当前使用的地址
  setCurrentAddress = (item) => {
    const { formPage } = this.state
    if (formPage && formPage === 'orderConfirm') { //来自于订单
      navBackExeFun(item.id, 2, 'loadUserDefaultAddress')
    }
  }

  renderAddressList = addressList => {
    return addressList.map((o, i) => {
      return (
        <View className="item-wrap"
              hoverClass="hover"
              hoverStartTime={10}
              hoverStayTime={100}
              key={i}
              onClick={() => { this.setCurrentAddress(o) }}
        >
          <View className="flex-row flex-ac item-in">
            <View onClick={e => e.stopPropagation()}>
              <IconFont value={o.enabled ? 'imgSelected' : 'imgNotSelected'} w={36} h={36} mr={10}
                        onClick={this.onClickItem.bind(this, o)} />
            </View>
            <View className="flex1">
              <View className="name">{`${o.userName + '  ' + o.phone}`}</View>
              {/*<View className="flex-row flex-sb flex-ac">*/}
              <View className="mulBreak flex1 address">
                {
                  o.enabled &&
                  <Text className="def-tag">默认</Text>
                }
                {o.address}{o.detailAddress || ''}
              </View>
              {/*</View>*/}
            </View>
            <View
              onClick={e => e.stopPropagation()}
            >
              <IconFont
                value="icon-xiugai"
                size={40}
                onClick={this.addAddress.bind(this, 'EDIT', o)}
              />
            </View>
          </View>
        </View>
      )
    })
  }
  render() {

    const {
      addressList = [],
      ajaxLoading,
      notInRangeList = []
    } = this.props
    if (ajaxLoading && ajaxLoading.effects['userAddress/getUserAddressAction']) {
      return (
        <View className="atLoading">
          <AtActivityIndicator mode='center' content='加载中...'/>
        </View>
      )
    }
    return (
      <View className='flex-col user-address-wrap'>
        <ScrollView className="flex1 address-list"
                    scrollY={true}
        >
          {
            addressList.length > 0
              ? this.renderAddressList(addressList)
              : null
          }
          {
            notInRangeList && notInRangeList.length > 0 ?
              <View className="noInRange">
                <View className="range">超出配送范围地址</View>
                {
                  notInRangeList.map((ele, index) => {
                    return (
                      <View className="item-wrap"
                        // hoverClass="hover"
                        // hoverStartTime={10}
                        // hoverStayTime={100}
                            key={index}
                      >
                        <View className="flex-row flex-ac item-in">
                          <View className="flex1">
                            <View className="name">{`${ele.userName + '  ' + ele.phone}`}</View>
                            {/*<View className="flex-row flex-sb flex-ac">*/}
                            <View className="mulBreak flex1 address">
                              {
                                ele.enabled &&
                                <Text className="def-tag">默认</Text>
                              }
                              {ele.address}{ele.detailAddress || ''}
                            </View>
                            {/*</View>*/}
                          </View>
                        </View>
                      </View>
                    )
                  })
                }
              </View> : null

          }
        </ScrollView>

        <Button className="flex-row flex-ac flex-jc add-address"
                hoverClass="add-address-hover"
                loading={false}
                onClick={this.addAddress.bind(this, 'NEW')}
        >
          <View className="add-icon">+</View>
          <Text>新增收货地址</Text>
        </Button>
      </View>
    )
  }
}

export default UserAddress
