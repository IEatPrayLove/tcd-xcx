import Taro, { Component } from '@tarojs/taro'
import { Button, ScrollView, View } from '@tarojs/components'
import './userAddressList.scss'
import { connect } from '@tarojs/redux'
import {
  getAuthenticate,
  hideLoading,
  locationArea,
  navToPage,
  objNotNull,
  showLoading,
  showToast
} from '../../../utils/utils'

/**
 * 我的地址页面
 */
// @authenticate
@connect(({ common, userAddress }) => ({
  userInfo: common.userInfo
  // addressList: userAddressList.addressList,
  // notInRangeList: userAddressList.notInRangeList,
}))
class UserAddressList extends Component {
    config = {
      navigationBarTitleText: '我的地址'
    };

    constructor() {
      super()
      this.state = {
        userAddress: [],
        notInRangeList: [],
        from: false,
        userAddressList: []
      }
    }

    componentDidShow() {
      if (this.$router.params.from && this.$router.params.from === 'buyCar') {
        this.setState({ from: this.$router.params.from })
      }
      this.getUserAddress()
    }

    componentWillMount() {
      Taro.setNavigationBarColor({
        backgroundColor: Taro.getStorageSync('systemColor'),
        frontColor: "#ffffff"
      })
    }

    getUserAddress = () => {
      showLoading()
      const {
        from, rangeArea, type, selfSend
      } = this.$router.params
      // console.log(this.$router.params)
      const payload = from && rangeArea && from === 'buyCar' ? JSON.parse(rangeArea) : []
      // console.log(payload)
      this.props.dispatch({
        type: 'takeOutConfirm/getUserAddressAction',
        payload,
        callback: ({ ok, data }) => {
          hideLoading()
          if (ok) {
            this.setState({
              userAddressList: data
            })
            if (type !== 'NETWORK' && type !== 'PACKAGE') {
              this.setState({ userAddress: data })
            } else {
              const notInRangeList = []; const
                userAddress = []
              if (objNotNull(data)) {
                const rangeList = []
                JSON.parse(rangeArea).priceAndRangeDtoList.map(item => {
                  item.range && rangeList.push(item.range)
                })
                data.map(ele => {
                  rangeList.map(value => {
                    console.log(ele)
                    const [longitude, latitude] = ele.coordinate ? ele.coordinate.split(',') : ['', '']
                    if (locationArea(value, { longitude, latitude })) {
                      if (JSON.stringify(userAddress).indexOf(ele.id) === -1) {
                        userAddress.push(ele)
                      }
                    }
                  })
                })
                data.map(ele => {
                  if (JSON.stringify(userAddress).indexOf(ele.id) === -1 && JSON.stringify(notInRangeList).indexOf(ele.id) === -1) {
                    notInRangeList.push(ele)
                  }
                })
                // if (selfSend === 'true') {
                  
                // } else {
                //   data.map(ele => {
                //     const [longitude, latitude] = ele.coordinate ? ele.coordinate.split(',') : ['', '']
                //     locationArea(JSON.parse(rangeArea), { longitude, latitude }) ? userAddress.push(ele) : notInRangeList.push(ele)
                //   })
                // }
              }
              this.setState({
                notInRangeList,
                userAddress
              })
            }
          }
        }
      })
    }

    deleteUserAddress = id => {
      this.props.dispatch({
        type: 'takeOutConfirm/deleteUserAddressByIdAction',
        payload: { id },
        callback: ({ ok, data }) => {
          if (ok) {
            Taro.showToast({ title: '删除成功~' })
            this.getUserAddress()
          } else {
            showToast('系统错误，删除失败请稍候再试~')
          }
        }
      })
    }

    saveDefaultUserAddress = item => {
      this.props.dispatch({
        type: 'takeOutConfirm/saveDefaultUserAddressAction',
        payload: { id: item.id, userId: getAuthenticate().userId },
        callback: ({ ok, data }) => {
          if (ok) {
            // Taro.showToast({title: "删除成功~"});
            if (this.state.from) {
              Taro.navigateBack()
            } else {
              this.getUserAddress()
            }
          }
        }
      })
    };

    componentDidMount() {
    }

    addAddress = id => {
      if (id < 1 && this.state.userAddressList.length > 30) {
        Taro.showToast({ ttile: '您最多只能保存30条用户地址' })
        return
      }
      navToPage(`/package/multiStore/userAddressAdd/userAddressAdd?id=${id}&from=${this.state.from}`)
    };

    render() {
      const { userAddress, notInRangeList } = this.state
      const {
        // addressList = [],
        // ajaxLoading,
        // notInRangeList = []
      } = this.props
      return (
        <View className="flex-col user-address-wrap">
          <ScrollView
            className="flex1 address-list"
            scrollY
          >
            {
              userAddress.length > 0 ? userAddress.map((item, i) => (
                <View className="item-wrap" key={i}>
                  <View className="flex-row flex-ac item-in">
                    <Button
                      className={item.enabled ? 'check-icon active' : 'check-icon'}
                      hoverClass="hover"
                      onClick={this.saveDefaultUserAddress.bind(this, item)}
                    />
                    <View className="flex1">
                      <View className="ellipsis address">
                        {item.address}
                        {item.detailAddress}
                      </View>
                      <View className="flex-row flex-sb flex-ac">
                        <View
                          className="name"
                        >
                          {item.userName}
                          （
                          {item.gender === 'WOMEN' ? '女士' : '先生'}
                          ）
                          {item.phone}
                        </View>
                        <View className="flex-row flex-ac">
                          <Button
                            className="edit"
                            hoverClass="hover"
                            onClick={this.addAddress.bind(this, item.id)}
                          />
                          <Button
                            className="delete"
                            hoverClass="hover"
                            onClick={this.deleteUserAddress.bind(this, item.id)}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )) : <View className="rangeTitle" style="padding-top:20px;">暂无可用地址，请新增收货地址</View>
            }
            {
              notInRangeList.length > 0 && (
                <View>
                  <View className="rangeTitle">超出配送范围地址</View>
                  {
                    notInRangeList.map((item, i) => (
                      <View className="item-wrap" key={i}>
                        <View className="flex-row flex-ac item-in">
                          {/* <Button className={item.enabled ? "check-icon active" : "check-icon"} */}
                          {/* hoverClass="hover" */}
                          {/* onClick={this.saveDefaultUserAddress.bind(this, item)}/> */}
                          <View className="flex1">
                            <View className="ellipsis address">
                              {item.address}
                              {item.detailAddress}
                            </View>
                            <View className="flex-row flex-sb flex-ac">
                              <View
                                className="name"
                              >
                                {item.userName}
                                （
                                {item.gender === 'WOMEN' ? '女士' : '先生'}
                                ）
                                {item.phone}
                              </View>
                              <View className="flex-row flex-ac">
                                {/* <Button className="edit" hoverClass="hover" */}
                                {/* onClick={this.addAddress.bind(this, item.id)}/> */}
                                <Button
                                  className="delete"
                                  hoverClass="hover"
                                  onClick={this.deleteUserAddress.bind(this, item.id)}
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))
                  }
                </View>
              )
            }
          </ScrollView>

          <Button
            className="flex-row flex-ac flex-jc add-address"
            hoverClass="add-address-hover"
            loading={false}
            onClick={this.addAddress.bind(this, 0)}
          >
            <View className="add-icon">+</View>
            <Text>新增收货地址</Text>
          </Button>
        </View>
      )
    }
}

export default UserAddressList
