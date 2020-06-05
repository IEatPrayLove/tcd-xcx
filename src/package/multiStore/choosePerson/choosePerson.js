import Taro, { Component } from '@tarojs/taro'
import {
  View, Swiper, SwiperItem, Image, Text, ScrollView, Block
} from '@tarojs/components'
import { AtMessage } from 'taro-ui'
import { connect } from '@tarojs/redux'
import {
  getPlatFormId, getServerPic, getUserDetail, navToPage, needLogin, parseQuery, showToast
} from '../../../utils/utils'
import './choosePerson.scss'
import PageLoading from '../../../components/PageLoading/PageLoading'

@connect(({ loading: { effects } }) => ({
  effects
}))
class ChoosePerson extends Component {
  config = {
    navigationBarTitleText: '',
    // onReachBottomDistance: 50,
    // enablePullDownRefresh: true,
    backgroundTextStyle: 'dark'
  };

  constructor() {
    super()
    this.state = {
      tableList: [],
      tableNum: 1,
      tableId: '',
      merchantId: '',
      brandId: '',
      tableInfo: {},
      payType: 0,
      tableName: '',
      newTable: true
    }
  }

  componentWillMount() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    })
    if (!needLogin()) return
  }

  componentDidShow() {
    const { q } = this.$router.params
    if (needLogin()) {
      if (q) {
        const { tableId, merchantId, brandId } = parseQuery(decodeURIComponent(q))
        this.getTableInfo({ tableId, merchantId, brandId })
        this.setState({
          tableId, merchantId, brandId
        })
      } else {
        this.getTableInfo(this.$router.params)
        this.setState(this.$router.params)
      }
    }
  }

  // 选择人数
  personChoose = num => {
    this.setState({
      tableNum: num
    })
  };

  // 获取扫码品牌门店桌号信息
  getTableInfo = ({ tableId, merchantId, brandId, payType, tableName }) => {
    this.props.dispatch({
      type: 'orderDishes/getScanInfoAction',
      payload: {
        merchant: merchantId,
        merchantTable: tableId
      },
      callback: ({ ok, data }) => {
        if (ok) {
          const { tableName, payType, new: newTable, peopleNum } = data
          // newTable: true 允许拼桌 false 直接进入
          if (newTable) {
            const tableList = []
            const { peopleNum } = data
            const [ start, end ] = peopleNum.split('-')
            for (let i = 0; i <= end - 0; i++) {
              if (start - 0 <= i) {
                tableList.push(i)
              }
            }
            Taro.setNavigationBarTitle({
              title: data.brandName
            })
            this.setState({
              tableInfo: data,
              tableList,
              tableNum: tableList[0],
              payType,
              tableName,
              newTable
            })
          } else {
            Taro.redirectTo({ url: `/package/multiStore/scanningIndex/scanningIndex?personNum=${peopleNum}&tableInfo=${JSON.stringify(data)}&merchantId=${merchantId}&tableId=${tableId}&brandId=${brandId}&payType=${payType}&tableName=${tableName}&newTable=${newTable}` })
          }
        } else {
          Taro.showModal({
            content: data.message || '服务错误',
            showCancel: false,
            confirmText: '返回',
            confirmColor: '#FF623D',
            success: () => Taro.navigateBack()
          })
        }
      }
    })
  };

  // 开始点餐
  startOrder = () => {
    const {
      tableNum, tableInfo, merchantId, tableId, brandId, payType, tableName, newTable
    } = this.state
    Taro.redirectTo({ url: `/package/multiStore/scanningIndex/scanningIndex?personNum=${tableNum}&tableInfo=${JSON.stringify(tableInfo)}&merchantId=${merchantId}&tableId=${tableId}&brandId=${brandId}&payType=${payType}&tableName=${tableName}&newTable=${newTable}` })
  };

  render() {
    const { tableList, tableNum, tableInfo } = this.state
    const { effects } = this.props
    return (
      <View className="chooseBox">
        {
          effects['orderDishes/getScanInfoAction'] && (
            <PageLoading />
          )
        }
        <Image className="chooseBg" mode="aspectFill" src="http://resource.canyingdongli.com/only_merchant/choose_bg.png" />
        <View className="chooseModalBox">
          <Image className="merchantLogo" src={getServerPic(tableInfo.headImgUrl)} />
          <View className="chooseModalName">
            欢迎来到
            {tableInfo.merchantName}
          </View>
          <View className="chooseModalTitle">你好,请问几位？</View>
          <View className="chooseModalTableNum">
            <Text>当前桌号：</Text>
            <Text>{tableInfo.tableName}</Text>
          </View>
          <ScrollView
            className="chooseModalTable"
            scrollY
          >
            <View className="flex-row flex-wrap flex-jc">
              {
                tableList && tableList.map((item, index) => (
                  <View className={`chooseModalTableItem ${tableNum === item ? 'tableActive' : ''}`} key={index} onClick={this.personChoose.bind(this, item)}>
                    {item}
                    人
                  </View>
                ))
              }
            </View>
          </ScrollView>
          <View className="chooseModalBtn" onClick={this.startOrder}>开始点餐</View>
        </View>
        <AtMessage />
      </View>
    )
  }
}
export default ChoosePerson
