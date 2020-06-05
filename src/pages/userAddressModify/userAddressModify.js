import Taro, { Component } from '@tarojs/taro'
import { Button, Input, Map, Switch, View } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import './userAddressModify.scss'
import {
  decodeURIObj,
  locationArea,
  navBackExeFun,
  showToast,
  validatePhone
} from '../../utils/utils'
import { GOODS_TAKE_OUT } from '../../config/config'
import IconFont from '../../components/IconFont/IconFont'

/**
 * 修改地址页面
 */
@connect(({ loading, goodsDetail }) => ({
  ajaxLoading: loading,
  merchantInfo: goodsDetail.merchantInfo
}))
export default class UserAddressModify extends Component {

  config = {
    'navigationBarBackgroundColor': '#ffffff',
    'navigationBarTextStyle': 'black',
    'navigationBarTitleText': '新增地址'
  }

  constructor() {
    super()
    const oldAddress = this.$router.params.oldAddress && decodeURIObj(this.$router.params.oldAddress) || {}
    this.state = {
      formPage: this.$router.params.formPage || '',//是否来自于订单页面
      range: [], // 来自订单页面的范围

      provinceId: '',
      cityId: '',
      countyId: '',

      userAddress: {
        userName: '',
        phone: '',
        detailAddress: '',//详细地址
        address: '',//带省市区的地址,
        coordinate: '',//地址坐标
        enabled: false,
        ...oldAddress //门店信息
      },

      polygons: [], //门店配送范围
      markers: [], //门店以及地址标记
      centerLng: '', //地图中心经度
      canterLat: '' //地图中心纬度
    }
    if (oldAddress.id) {
      Taro.setNavigationBarTitle({ title: '编辑地址' })
    }
  }

  // componentWillMount() {
  // }


  componentDidMount() {

  }

  inputChange = (params, e) => {
    const temp = {}
    temp[params] = e.target.value
    this.setState({ userAddress: { ...this.state.userAddress, ...temp } })
  }

  onChangeSwitch = (e) => {
    const temp = {}
    temp['enabled'] = e.detail.value
    this.setState({ userAddress: { ...this.state.userAddress, ...temp } })
  }

  // 提交修改保存
  saveSubmit = () => {
    const { userAddress, formPage, range, orderType } = this.state
    if (!userAddress.userName) {
      showToast('联系人不能为空')
      return
    }
    if (!userAddress.phone) {
      showToast('联系电话不能为空')
      return
    }
    if (!validatePhone(userAddress.phone)) {
      showToast('联系电话格式不正确')
      return
    }
    if (!userAddress.address) {
      showToast('收货地址不能为空')
      return
    }
    if (!userAddress.detailAddress) {
      showToast('详细地址不能为空')
      return
    }
    if (range && formPage && formPage === 'orderConfirm' && orderType === GOODS_TAKE_OUT) {
      const userLocation = this.state.userAddress.coordinate.split(',')
      if (!locationArea(range, {
        longitude: userLocation[0],
        latitude: userLocation[1]
      })) {
        Taro.showModal({
          content: '您设置的地址已超出该商品配送范围请重新设置',
          showCancel: false,
          cancelText: '知道了',
          confirmColor: '#FBAB48'
        })
        return
      }
    }
    this.props.dispatch({
      type: 'userAddressModify/saveUserAddressAction',
      payload: userAddress,
      callback: ({ ok, data }) => {
        if (ok) {
          //如果是来自于下单页面
          if (formPage && formPage === 'orderConfirm') {
            navBackExeFun(data.id, 3, 'loadUserDefaultAddress')
            return
          }
          showToast(`${userAddress.id ? '修改成功' : '新增成功'}`)
          Taro.navigateBack()
        } else {
          showToast('保存失败')
        }
      }
    })
  }

  // 删除用户地址
  delAddress = () => {
    const { userAddress, formPage } = this.state
    Taro.showModal({ title: '确定删除吗？' })
      .then(res => {
        if (res.confirm) {
          if (!userAddress.id) {
            return
          }
          this.props.dispatch({
            type: 'userAddressModify/deleteUserAddressByIdAction',
            payload: { id: userAddress.id },
            callback: ({ ok }) => {
              if (ok) {
                showToast(`删除成功`)
                Taro.navigateBack()
                //如果是来自于下单页面,则执行删除之前方法
                if (formPage && formPage === 'orderConfirm') {
                  navBackExeFun(userAddress.id, 3, 'publicRemoveAddress', true)
                }
              } else {
                showToast('删除失败')
              }
            }
          })
        }
      })
  }

  regionsCallBack = (params) => {
    console.log(params)
  }

  // 从地图定位收货地址
  choseLocation = (e) => {
    Taro.chooseLocation({
      success: (res) => {
        this.setState({
          userAddress: {
            ...this.state.userAddress,
            coordinate: [res.longitude, res.latitude].join(','),
            address: res.address + res.name
          },
          markers: [...this.state.markers.slice(0, 1), {
            id: 2,
            longitude: res.longitude,
            latitude: res.latitude,
            // iconPath: locationIcon,
            width: 20,
            height: 26
          }],
          centerLng: res.longitude,
          canterLat: res.latitude
        })
      }
    })
  }

  render() {
    const {
      userAddress = {},
      formPage = '',
      orderType,
      polygons,
      markers,
      centerLng,
      canterLat
    } = this.state

    const { ajaxLoading = {} } = this.props
    return (
      <View className='user-info-wrap'>
        {
          formPage === 'orderConfirm' && orderType === GOODS_TAKE_OUT &&
          <Map
            id="merchantRange"
            className="map"
            polygons={polygons}
            markers={markers}
            longitude={centerLng}
            latitude={canterLat}
            scale={14}
          />
        }
        <View className="content-wrap">
          <View className="flex-row flex-ac flex-sb item">
            <View className="title">联系人：</View>
            <Input placeholder="请填写收货人姓名"
                   className="flex1 inpt"
                   placeholderClass="inpt-placeholder"
                   maxLength={10}
                   value={userAddress.userName}
                   onInput={this.inputChange.bind(this, 'userName')}
            />
          </View>
          <View className="flex-row flex-ac flex-sb item">
            <View className="title">电话号码：</View>
            <Input placeholder="请填写收货人电话号码"
                   className="flex1 inpt"
                   type={'number'}
                   placeholderClass="inpt-placeholder"
                   maxLength={11}
                   value={userAddress.phone}
                   onInput={this.inputChange.bind(this, 'phone')}
            />
          </View>

          <View className="flex-row flex-ac flex-sb item"
                onClick={this.choseLocation.bind(this)}
          >
            <View className="title">收货地址：</View>
            {
              !userAddress.address && <IconFont value="icon-dizhi" size={26} />
            }
            <View
              className={`mulBreak flex1 address inpt ${!userAddress.address ? 'inpt-placeholder' : ''}`}>
              {userAddress.address || '请选择收获地址'}
            </View>
            {
              !userAddress.address && <IconFont value="icon-arrow-right-copy-copy" size={26} />
            }
          </View>

          <View className="flex-row flex-ac flex-sb item">
            <View className="title">详细地址：</View>
            <Input placeholder="街道、门牌号等"
                   className="flex1 inpt"
                   type={'text'}
                   placeholderClass="inpt-placeholder"
                   maxLength={100}
                   value={userAddress.detailAddress}
                   onInput={this.inputChange.bind(this, 'detailAddress')}
            />
          </View>
        </View>
        <View className="flex-row flex-ac flex-je set-default-address">
          <Text style={'margin-right:10px;'}>设为默认地址</Text>
          <Switch type={'switch'}
                  className="my-switch-close"
                  color={'#FBAB48'}
                  checked={userAddress.enabled}
                  onChange={this.onChangeSwitch.bind(this)}
          />
        </View>

        <Button className="option-btns save"
                hoverClass="hover"
                loading={ajaxLoading.effects['userAddressModify/saveUserAddressAction']}
                disabled={ajaxLoading.effects['userAddressModify/saveUserAddressAction']}
                onClick={this.saveSubmit.bind(this)}
        >
          {formPage && formPage === 'orderConfirm' ? '保存并使用' : '保存'}
        </Button>
        {
          userAddress.id &&
          <Button className="option-btns cancel"
                  hoverClass="hover"
                  loading={ajaxLoading.effects['userAddressModify/deleteUserAddressByIdAction']}
                  disabled={ajaxLoading.effects['userAddressModify/deleteUserAddressByIdAction']}
                  onClick={this.delAddress.bind(this)}
          >
            删除
          </Button>
        }
      </View>
    )
  }
}

