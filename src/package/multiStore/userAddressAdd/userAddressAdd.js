import Taro, { Component } from '@tarojs/taro'
import { Button, Input, View } from '@tarojs/components'
import './userAddressAdd.scss'
import { connect } from '@tarojs/redux'
import { getAuthenticate, navToPage } from '../../../utils/utils'

/**
 * 修改地址页面
 */
// @authenticate
@connect(({ takeOutConfirm }) => ({}))
class UserAddressAdd extends Component {
    config = {
      navigationBarTitleText: '选择地址'
    };

    constructor() {
      super()
      this.state = {
        userAddress: {
        },
        from: false
      }
    }

    componentWillMount() {
      Taro.setNavigationBarColor({
        backgroundColor: Taro.getStorageSync('systemColor'),
        frontColor: "#ffffff"
      })
      const { id } = this.$router.params
      if (id && id > 0) {
        this.getUserAddressById(id)
      }
    }

    componentDidMount() {
    }

    /**
     * 根据编号获取用户收货地址
     * @param id
     */
    getUserAddressById = id => {
      this.props.dispatch({
        type: 'takeOutConfirm/getUserAddressByIdAction',
        payload: { id },
        callback: ({ ok, data }) => {
          this.setState({ userAddress: data })
        }
      })
    };

    inputChange = (params, e) => {
      const temp = this.state.userAddress
      temp[params] = e.target.value
      this.setState({ userAddress: { ...temp } })
    };

    choseGender = gender => {
      this.setState({ userAddress: { ...this.state.userAddress, gender } })
    };

    componentDidShow() {
      if (this.$router.params.from && this.$router.params.from === 'buyCar') {
        this.setState({ from: this.$router.params.from })
      }
    }

    /**
     * 存储收货地址
     */
    saveSubmit = () => {
      const { userAddress } = this.state
      // console.log(userAddress);
      if (!userAddress.userName) {
        Taro.showToast({
          title: '收货人不能为空',
          icon: 'none'
        })
        return
      }
      if (!userAddress.phone) {
        Taro.showToast({
          title: '电话不能为空',
          icon: 'none'
        })
        return
      }
      if (userAddress.phone.length < 11) {
        Taro.showToast({
          title: '请输入11位电话号码',
          icon: 'none'
        })
        return
      }
      if (!userAddress.address) {
        Taro.showToast({
          title: '地址不能为空',
          icon: 'none'
        })
        return
      }
      if (!userAddress.detailAddress) {
        Taro.showToast({
          title: '门牌号不能为空',
          icon: 'none'
        })
        return
      }

      this.props.dispatch({
        type: 'takeOutConfirm/saveUserAddressAction',
        payload: userAddress,
        callback: ({ ok, data }) => {
          if (ok) {
            this.saveDefaultUserAddress(data)
            if (this.state.from) {
              Taro.navigateBack({ delta: 2 })
              return
            }
            this.setState({ userAddress: data })
            Taro.showToast({ title: '保存地址成功' })
            Taro.navigateBack()
          } else {
            Taro.showToast({ title: '系统错误' })
          }
        }
      })
    };

    saveDefaultUserAddress = item => {
      this.props.dispatch({
        type: 'takeOutConfirm/saveDefaultUserAddressAction',
        payload: { id: item.id, userId: getAuthenticate().userId },
        callback: ({ ok, data }) => {
          if (ok) {

          }
        }
      })
    };

    /**
     * 从地图定位收货地址
     *
     * @param e
     */
    choseLocation = e => {
      const root = this
      Taro.chooseLocation({
        success(res) {
          root.setState({
            userAddress: {
              ...root.state.userAddress,
              address: res.name,
              coordinate: [res.longitude, res.latitude].join(',')
            }
          })
        }
      })
    };

    render() {
      const {
        userAddress
      } = this.state

      return (
        <View className="user-info-wrap">
          <View className="content-wrap">
            <View className="flex-row flex-sb item">
              <View className="title">联系人：</View>
              <View className="flex1">
                <Input
                  placeholder="请输入联系人姓名"
                  className="inpt"
                  placeholderClass="inpt-placeholder"
                  maxLength={10}
                  value={userAddress ? userAddress.userName : ''}
                  onInput={this.inputChange.bind(this, 'userName')}
                />
                <View className="flex-row gender-wrap">
                  <Button
                    className={`gender-btn ${userAddress.gender === 'WOMEN' ? 'active' : ''}`}
                    onClick={this.choseGender.bind(this, 'WOMEN')}
                  >
                                    女士
                  </Button>
                  <Button
                    className={`gender-btn ${userAddress.gender === 'MEN' ? 'active' : ''}`}
                    onClick={this.choseGender.bind(this, 'MEN')}
                  >
                                    先生
                  </Button>
                </View>
              </View>
            </View>
            <View className="flex-row flex-ac flex-sb item">
              <View className="title">电话号码：</View>
              <Input
                placeholder="请输入电话号码"
                className="flex1 inpt"
                type="number"
                placeholderClass="inpt-placeholder"
                maxLength={11}
                value={userAddress ? userAddress.phone : ''}
                onInput={this.inputChange.bind(this, 'phone')}
              />
            </View>

            <View className="flex-row flex-ac flex-sb item nobb">
              <View className="title">收货地址：</View>
              <View className="flex1">
                <Input
                  placeholder="点击选择..."
                  className="flex1 inpt"
                  type="text"
                  placeholderClass="inpt-placeholder"
                  maxLength={100}
                  value={userAddress ? userAddress.address : ''}
                  onInput={this.inputChange.bind(this, 'address')}
                  onClick={this.choseLocation}
                />
              </View>
            </View>

            <View className="flex-row flex-ac flex-sb item">
              <View className="title">门牌号：</View>
              <Input
                placeholder="请填写详细地址(如：门牌号)"
                className="flex1 inpt"
                type="text"
                placeholderClass="inpt-placeholder"
                maxLength={100}
                value={userAddress ? userAddress.detailAddress : ''}
                onInput={this.inputChange.bind(this, 'detailAddress')}
              />
            </View>
          </View>

          <Button
            className="save"
            hoverClass="save-hover"
            loading={false}
            onClick={this.saveSubmit.bind(this)}
          >
                    保存
          </Button>
        </View>
      )
    }
}

export default UserAddressAdd
