import '@tarojs/async-await'
import Taro, { Component } from '@tarojs/taro'
import { connect, Provider } from '@tarojs/redux'

import { platformSystem } from './utils/api'

import dva from './dva'
import models from './model'

import Index from './pages/index'
import './app.scss'
import './styles/base.scss'
import amapFile from './utils/amap-wx'
import {
  getUserDetail,
  objNotNull,
  saveUserDetail,
  saveUserLocation,
  setUserDistributor,
  savePlatFormId, getUserLocation,
  savePlatFormInfo,
  getPlatFormInfo
} from './utils/utils'
import WebSocket from './utils/WebSocket'
import { PLATFORM_ID, WEBSOCKET_IP, WEBSOCKET_PLATFORM } from './config/baseUrl'

const onfire = require('./utils/onfire.min.js');
// import './styles/iconFont.scss'

const dvaApp = dva.createApp({
  initialState: {},
  models
})
const store = dvaApp.getStore()
// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

const AMap = new amapFile.AMapWX({ key: '94b742bf454bf235ba9642d698557af7' })

@connect(({ }) => ({}))
class App extends Component {
  config = {
    pages: [
      'pages/distributorIndex/distributorIndex',
      'pages/index/index',
      'pages/certificationResult/certificationResult',
      // 'pages/userCoupons/userCoupons',
      'pages/payResult/payResult',
      'pages/dredgeUnionCard/dredgeUnionCard',
      'pages/treasury/index',
      'pages/treasury/balanceRecord/balanceRecord',
      'pages/treasury/cashOut/cashOut',
      'pages/treasury/cashOutRecord/cashOutRecord',
      'pages/treasury/cashOutProgress/cashOutProgress',
      'pages/treasury/commissionTotal/commissionTotal',
      'pages/treasury/commissionDetail/commissionDetail',
      'pages/agreement/agreement',
      

      'pages/activePage/activePage',
      'pages/legendsUserCenter/incomeRecord/incomeRecord',
      'pages/legendsCardRight/legendsCardRight',
      'pages/mine/mine',
      'pages/rightsDescription/rightsDescription',
      'pages/openLegendsCard/openLegendsCard',
      'pages/userInfo/modifyName',
      'pages/achievementCertification/achievementCertification',
      'pages/equityDetail/equityDetail',
      // 'pages/businessmenStationed/stationedLogin/stationedLogin',
      // 'pages/businessmenStationed/stationedSetting/stationedSetting',
      'pages/propagandaReward/propagandaReward',
      // 'pages/businessmenStationed/stationedRecord/stationedRecord',
      // 'pages/businessmenStationed/stationedRegister/stationedRegister',

      'pages/orderDetail/orderDetail',
      'pages/rightsCoupon/couponResult',
      // 'pages/businessmenStationed/stationedSubmit/stationedSubmit',
      // 'pages/member/member',
      'pages/dineAndDash/dineAndDash',
      'pages/dineAndDash/dineAndDashRecord',
      'pages/legendsUserCenter/legendsUserCenter',
      'pages/rightsCoupon/payCoupon',

      'pages/rightsCoupon/rightsCouponHome',
      // 'pages/specialOffer/specialOffer',
      'pages/rightsCoupon/brandCoupon',
      'pages/dineAndDash/applySuccess',
      // 'pages/legendsCardRight/legendsCardRight',

      // 'pages/treasury/treasury',
      'pages/propaganda/propaganda',
      'pages/propagandaDetail/propagandaDetail',
      'pages/certificationRecord/certificationRecord',
      'pages/propagandaRewardDetail/propagandaRewardDetail',
      'pages/equityVolume/equityVolume',
      'pages/submitPropaganda/submitPropaganda',
      'pages/platformCertification/platformCertification',
      'pages/userCertification/userCertification',
      'pages/login/login',
      'pages/goodsDetails/goodsDetails',
      'pages/merchantList/merchantList',
      // 'pages/orderRemark/orderRemark',
      // 'pages/member/member',
      // 'pages/userAddress/userAddress',
      'pages/userAddressModify/userAddressModify',
      'pages/userInfo/userInfo',
      'pages/order/order',
      'pages/logisticsInfo/logisticsInfo',
      'pages/treasury/balanceDetail/balanceDetail',
      'pages/orderDishes/orderDishes'
    ],
    subpackages: [
      {
        root: 'package',
        pages: [
          'userAddress/userAddress',
          'specialOffer/specialOffer',
          'orderRemark/orderRemark',
          'member/member',
          'userCoupons/userCoupons',
          'couponList/couponList',
          'distributor/team/team',


          'distributor/partnerGrade/partnerGrade',
          'distributor/gradeUpgrade/gradeUpgrade',
          'distributor/distributorRecord/distributorRecord',
          'distributor/rightsExplain/rightsExplain',
          'distributor/joinDistributor/joinDistributor',
          'distributor/recordDetail/recordDetail',
          'distributor/teamMembers/teamMembers',
          'distributor/productShare/productShare',

          'multiStore/merchantDetail/merchantDetail',
          'multiStore/orderDishes/orderDishes',
          'multiStore/choosePerson/choosePerson',
          'multiStore/scanningIndex/scanningIndex',
          'multiStore/scanningOrder/scanningOrder',
          'multiStore/merchantList/merchantList',
          'multiStore/brandList/brandList',
          'multiStore/brandDetail/brandDetail',
          'multiStore/scanningConfirm/scanningConfirm',
          'multiStore/preferentialPayment/preferentialPayment',
          'multiStore/takeOutConfirm/takeOutConfirm',
          'multiStore/mapRange/mapRange',
          'multiStore/mapRange/search/searchAddress',
          'multiStore/userAddressList/userAddressList',
          'multiStore/userAddressAdd/userAddressAdd',
          'multiStore/search/search',
          'multiStore/orderDetail/orderDetail',
          'multiStore/scanningHistory/scanningHistory',
          'multiStore/scanOrderDetail/scanOrderDetail',
          'multiStore/networkList/networkList',
          'multiStore/packageOrderConfirm/packageOrderConfirm',
          'multiStore/merchantFunction/merchantFunction',
          // 'multiStore/otherPageResult/payResult',
          'multiStore/checkIn/checkIn',
          'multiStore/allOrderConfirm/allOrderConfirm',

          'storedMoney/index/index',
          'storedMoney/recharge/recharge',
          'storedMoney/paymentCode/paymentCode',
          'storedMoney/payResult/payResult',
          'storedMoney/modifyPassWord/modifyPassWord',
          'storedMoney/cardList/cardList',
          'storedMoney/memberRights/memberRights',
          'storedMoney/rechargeMerchant/rechargeMerchant',

          'otherScanOrder/choosePerson/choosePerson',
          'otherScanOrder/scanningIndex/scanningIndex',
          'otherScanOrder/scanningHistory/scanningHistory',
          'otherScanOrder/scanOrderDetail/scanOrderDetail',
          'otherScanOrder/scanningConfirm/scanningConfirm',
          'otherScanOrder/otherPageResult/payResult',
          'otherScanOrder/scanningOrder/scanningOrder',

        ]
      }
    ],
    preloadRule: {
      // 'pages/index/index': {
      //   network: 'all',
      //   packages: ['package']
      // }
    },
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#fff',
      navigationBarTitleText: '测试环境',
      navigationBarTextStyle: 'white'
    },
    tabBar: {
      color: '#333333',
      selectedColor: '#FF633D',
      backgroundColor: '#FAFAFA',
      borderStyle: 'white',
      list: [
        {
          pagePath: 'pages/index/index',
          text: '首页',
          iconPath: 'images/index.png',
          selectedIconPath: 'images/index_selected.png'
        },
        {
          pagePath: 'pages/merchantList/merchantList',
          text: '外卖',
          iconPath: 'images/takeaway.png',
          selectedIconPath: 'images/takeaway_selected.png'
        },
        // {
        //   pagePath: 'pages/distributorIndex/distributorIndex',
        //   text: '会员',
        //   iconPath: 'images/member.png',
        //   selectedIconPath: 'images/member_selected.png'
        // },
        {
          pagePath: 'pages/treasury/index',
          text: '金库',
          iconPath: 'images/treasury.png',
          selectedIconPath: 'images/treasury_selected.png'
        },
        {
          pagePath: 'pages/distributorIndex/distributorIndex',
          text: '合伙人',
          iconPath: 'images/partner.png',
          selectedIconPath: 'images/partner_selected.png'
        },
        {
          pagePath: 'pages/mine/mine',
          text: '我的',
          iconPath: 'images/mine.png',
          selectedIconPath: 'images/mine_selected.png'
        }
      ]
    },
    permission: {
      'scope.userLocation': {
        desc: '您的位置将用于计算店铺和您的距离'
      }
    },
    plugins: {
      goodsSharePlugin: {
        version: '4.0.1',
        provider: 'wx56c8f077de74b07c'
      },
      htmltowxml: {
        version: '1.4.0',
        provider: 'wxa51b9c855ae38f3c'
      }
    },
    networkTimeout: {
      connectSocket: 5000
    }
  }

  constructor() {
    super()
    this.onfire = onfire;
  }

  componentDidMount() {
    savePlatFormId(PLATFORM_ID) // PLATFORM_ID
    Taro.getSystemInfo({//  获取页面的有关信息
      success: res => {
        Taro.setStorageSync('systemInfo', res)
      }
    })
    // 判断是否保存过用户地址
    if (!objNotNull(getUserLocation())) this.getUserLocation()
    const socket = new WebSocket()
    const that = this
    socket.connect(`${WEBSOCKET_IP}/websocket/${WEBSOCKET_PLATFORM}`, '',
      ['/topic/public/message', '/user/topic/private/message'], message => {
        try {
          if (Object.prototype.toString.call(message) === '[object Object]' && 'userName' in message) {
            that.onfire.fire('ReceiveMessages', message)
          }
        } catch (e) {

        }
      })
    platformSystem().then(({ ok, data }) => {
      if (ok) savePlatFormInfo(data)
    })
    this.props.dispatch({
      type: 'common/getPlatformColorAction',
      payload: {
        id: PLATFORM_ID
      },
      callback: res => {
        if (res.ok && res.data.settingColor) {
          Taro.setStorageSync('systemColor', res.data.color)
          Taro.setNavigationBarColor({
            backgroundColor: Taro.getStorageSync('systemColor'),
            frontColor: '#ffffff'
          })
        } else {
          Taro.setStorageSync('systemColor', '#FF623D')
          Taro.setNavigationBarColor({
            backgroundColor: Taro.getStorageSync('systemColor'),
            frontColor: '#ffffff'
          })
        }
      }
    })
  }

  getUserLocation = () => {
    Taro.getLocation({
      type: 'gcj02',
      altitude: true,
      success: res => {
        // 根据坐标获取地理位置名称
        if (objNotNull(res) && res.errMsg === 'getLocation:ok') {
          const { latitude: lat, longitude: lng } = res
          AMap.getRegeo({
            location: `${lng},${lat}`,
            success: ([{ longitude, latitude, name }]) => {
              const userLocation = {
                longitude,
                latitude,
                name
              }
              this.onfire.fire('GetLocation', userLocation)
              saveUserLocation(userLocation)
            }
          })
        }
      },
      fail: res => {
        this.openWxSetting()
      }
    })
  }

  openWxSetting = () => {
    Taro.showModal({
      title: '提示',
      content: '无法获取您的位置，请授权',
      showCancel: false,
      success: res => {
        res.confirm && Taro.openSetting({
          success: () => {
            this.getUserLocation()
          }
        })
      }
    })
  }


  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render() {
    return (
      <Provider store={store}>
        <Index />
        { /**扫码点餐订单 */





        }
      </Provider>
    )
  }
}

Taro.render(<App />, document.getElementById('app'))
