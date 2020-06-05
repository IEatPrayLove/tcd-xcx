import Taro from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import {
  Block, Button, Image, ScrollView,
  Swiper, SwiperItem, Text, View,
  OfficialAccount
} from '@tarojs/components'
import {
  AtGrid, AtActivityIndicator,
  AtCurtain, AtBadge, AtLoadMore
} from 'taro-ui'
import './index.scss'
import {
  getServerPic,
  getSysInfo,
  getUserDetail,
  advertisingLinks,
  navToPage,
  objNotNull,
  saveUserDetail,
  saveUserLocation,
  setUserDistributor,
  judgeLegendsCard,
  getUserLocation,
  arrayChunk,
  randomIntegerInRange,
  getTimestamp,
  imitateObjectValues,
  latelyMerchant,
  getUserDistributor,
  parseQuery,
  getShareInfo,
  setShareInfo,
  resetName,
  getIndexModalTime,
  setIndexModalTime,
  getBuyCard,
  clearBuyCard, getPlatFormId, showToast, getPlatFormInfo,showLoading,hideLoading,needLogin
} from '../../utils/utils'
import {
  STATIC_IMG_URL, PLATFORM_ID, WEBSOCKET_IP, DEFAULT_PLAT_FORM_ID, POSTER_URL
} from '../../config/baseUrl'
import {
  INDEX_COUPON, PROMOTE_TYPE, INDEX_BANNER, NAV_LINK,
  DYNAMIC, DYNAMIC_TYPE
} from '../../config/config'
import Goods from '../../components/Goods/Goods'
import IconFont from '../../components/IconFont/IconFont'
import LimitGoods from '../../components/LimitGoods/LimitGoods'
import Footer from '../../components/Footer/Footer'
import WebSocket from '../../utils/WebSocket'
import amapFile from '../../utils/amap-wx'
import Merchant from '../../components/Merchant/Merchant'
import ToOrderDetail from '../../components/ToOrderDetail/ToOrderDetail'

import { getPlatform } from '../../utils/api'

const AMap = new amapFile.AMapWX({ key: '94b742bf454bf235ba9642d698557af7' })
const dayjs = require('dayjs')

const { onfire } = Taro.getApp()
const SIZE = 6 // 推荐门店每页显示条数

@connect(({
  loading: { effects },
  common: { userDynamic }
}) => ({
  effects,
  userDynamic
}))
class Index extends Taro.PureComponent {
  config = {
    // navigationBarTitleText: '首页',
    enablePullDownRefresh: true,
    backgroundTextStyle: 'dark'
  }

  constructor() {
    super()
    this.state = {
      recommendGoodsList: [],
      userLocation: getUserLocation(),
      recommendPropaganda: [],
      distributionList: [], // 分享商品
      brandCoupon: [],
      bonusPool: Array(6)
        .fill(0),
      bannerList: [],
      platformSetting: {},
      navLink: [],
      waistAd1: {}, // 腰部广告1
      waistAd2: {}, // 腰部广告2
      indexModal: {}, // 首页弹窗
      closeAccount: false,
      accountModal: true,
      userNotice: [], // 用户滚动信息
      curPage: 0, // 推荐商家分页
      merchantNoData: false,
      merchantList: [], // 推荐门店列表
      brandList: [], // 推荐品牌
      bonusPoolIsClose: false, // 奖金池是否关闭
      allMerchantAndBrand: [], // 所有门店&&品牌
      renderStatus: false,
      platformDetail: {}, // 平台详情
      systemColor: '',
      orderState:false,
      orderInfo:{
        orderSn:null,wxtoken:null,enterpriseGuid:null,openId:null,payType:null,memberInfoGuid:null,merchantId:null,brandId:null
      }
    }
  }

  componentWillMount() {
    onfire.on('ReceiveMessages', message => {
      this.setState(({ userNotice }) => ({ userNotice: [...userNotice, message].slice(-10) }))
    })
  }

  componentDidMount() {
    const { dispatch } = this.props
    this.setState({
      systemColor: Taro.getStorageSync('systemColor')
    })
    const userDetail = getUserDetail()
    this.getPlatformDetail()
    this.initialize()
    this.getLocation()
    const {
      params: { q, code }
    } = this.$router
    if (q) {
      const posterObj = parseQuery(decodeURIComponent(q))
      const { code: posterCode } = posterObj
      console.log('主页海报分享code', posterCode)
      setShareInfo({
        code: posterCode
      })
    }
    if (code) {
      console.log('主页参数分享code', code)
      setShareInfo({ code })
    }

    // 获取主页弹窗
    dispatch({
      type: 'index/getIndexModalAction',
      callback: ({ ok, data }) => {
        if (ok) {
          if (!userDetail) {
            const lastModal = getIndexModalTime()
            if (!lastModal || (dayjs()
              .diff(dayjs(lastModal), 'day') >= 1)) {
              this.setState({
                indexModal: data[0]
              })
              setIndexModalTime(new Date())
            }
            return
          }
          this.setState({
            indexModal: data[0]
          })
        }
      }
    })
  }

  componentDidShow() {
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    })
    onfire.one('GetLocation', message => {
      this.setState({
        userLocation: message
      })
    })
    const {orderState} = this.state
    this.setState({
      orderState:!orderState
    })
    this.getOrderInfo() 

  }

  componentDidHide() {
    onfire.un('ReceiveMessages')
    this.setState({
      indexModal: {}
    })
  }

  onPullDownRefresh() {
    this.setState({
      curPage: 0,
      merchantList: [],
      merchantNoData: false,
      renderStatus: false
    }, () => {
      this.initialize()
    })
  }

  initialize = () => {
    Taro.stopPullDownRefresh()
    const { dispatch } = this.props
    const userDetail = getUserDetail()
    const { curPage, userLocation = {} } = this.state
    const { longitude, latitude } = userLocation || {}
    // 清除通吃卡购买记录
    const { time } = getBuyCard()
    if (time && dayjs()
      .diff(dayjs(time), 'minute') >= 10) {
      clearBuyCard()
    }

    dispatch({
      type: 'index/getAllIndexInterfaceAction',
      payload: {
        advertisement: { positionCode: INDEX_BANNER },
        recommendGood: {
          platformId: PLATFORM_ID,
          type: 1
        },
        recommendPropaganda: {},
        recommendCoupon: { type: INDEX_COUPON },
        indexNav: { type: 1 },
        recommendMerchant: {
          page: curPage,
          size: SIZE,
          platformId: PLATFORM_ID, // PLATFORM_ID,
          type: 1,
          sort: 'id,desc',
          position: `${longitude || 116.460000},${latitude || 39.920000}`
        }
      },
      callback: res => {
        const {
          appletsAd, recommendGood, recommendPropaganda,
          recommendCoupon, indexNav, bonusPool, recommendMerchant,
          recommendBrand, bonusPollIsClose, allMerchantAndBrand
        } = res
        const { totalMoney = 0 } = bonusPool

        this.setState({
          bannerList: appletsAd.filter(({ popupType }) => popupType === 0),
          waistAd1: appletsAd.find(({ popupType }) => popupType === 7),
          waistAd2: appletsAd.find(({ popupType }) => popupType === 8),
          recommendGoodsList: this.sortProduct(recommendGood, userLocation),
          recommendPropaganda,
          bonusPool: new Number(totalMoney < 500 ? 32846.50 : totalMoney).toFixed(2),
          brandCoupon: imitateObjectValues(recommendCoupon)
            .sort((a, b) => getTimestamp(b.topTime) - getTimestamp(a.topTime)),
          navLink: indexNav.map(ele => ({
            ...ele,
            image: getServerPic(ele.picUrl),
            value: ele.name
          })),
          merchantList: recommendMerchant,
          merchantNoData: recommendMerchant.length < SIZE,
          brandList: recommendBrand,
          bonusPollIsClose: bonusPollIsClose.rewardsPollOpenState,
          allMerchantAndBrand,
          renderStatus: true
        })
      }
    })
    if (userDetail) {
      dispatch({
        type: 'index/getLoginInterfaceAction',
        payload: {
          userId: userDetail.id
        },
        callback: res => {
          const {
            tcdCard, memberInfo, partner
          } = res
          const {
            gradeName, growthValue, grade, amount
          } = memberInfo
          saveUserDetail({
            ...userDetail,
            grade,
            gradeName,
            growthValue,
            amount
          })
          saveUserDetail({
            ...userDetail,
            islandUserMemberDTO: tcdCard
          })
          setUserDistributor(partner)
        }
      })
    }
  }

  // 上拉加载
  onReachBottom() {
    const { merchantNoData } = this.state
    if (merchantNoData) return
    this.setState(({ curPage }) => ({
      curPage: curPage + 1
    }), () => {
      this.getMerchantList()
    })
  }

  // 获取平台设置
  getPlatformDetail = () => {
    const { dispatch } = this.props
    // 获取推荐商家
    dispatch({
      type: 'index/getSystemSettingAction',
      payload: {},
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({ platformDetail: data })
        }
      }
    })
  }

  // 获取推荐商家
  getMerchantList = () => {
    const { curPage, userLocation = {} } = this.state
    const { dispatch } = this.props
    const { longitude, latitude } = userLocation || {}
    // 获取推荐商家
    dispatch({
      type: 'index/getRecommendMerchantAction',
      payload: {
        page: curPage,
        size: SIZE,
        platformId: getPlatFormId(),
        type: 1,
        sort: 'id,desc',
        position: `${longitude || 116.460000},${latitude || 39.920000}`
      },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState(({ merchantList }) => ({
            merchantList: [...merchantList, ...data],
            merchantNoData: data.length < SIZE
          }))
        }
      }
    })
  }

  sortProduct = (list, location) => {
    let notSell = []
    let template = list.map(ele => {
      const { dishMerchantShippingInfo } = ele
      const { distances } = latelyMerchant(dishMerchantShippingInfo, location)
      return ({
        ...ele,
        minDistance: distances
      })
    })
      .sort((a, b) => a.minDistance - b.minDistance)
      .filter(ele => {
        if (ele.dishState === 2) {
          return true
        }
        notSell = [...notSell, ele]
        return false
      })
    template = [...template, ...notSell]
    this.getProductDistribution(template.map(o => o.dishId))
    return template.map(ele => ({
      ...ele,
      content: ''
    }))
  }

  // 判断商品是否为分享商品
  getProductDistribution = dishIds => {
    if (!dishIds.length) return
    const { dispatch } = this.props
    dispatch({
      type: 'index/getProductIsDistributionAction',
      payload: { dishIds: dishIds || [] },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            distributionList: data
          })
        }
      }
    })
  }

  goToCouponDetail = ({ dishId, dishName, picture }) => {
    navToPage(`/pages/rightsCoupon/brandCoupon?dishId=${dishId}&dishName=${dishName}&dishImageUrl=${picture}`)
  }

  navigation = item => {
    const { functionPosition } = item
    if (functionPosition === 15) {
      navToPage('/package/multiStore/merchantList/merchantList?merchantType=8') // 优惠买单
    }
    if (functionPosition === 14) {
      if(needLogin()){
        Taro.scanCode({
          scanType: ['qrCode'],
          success: res => {
            const { result } = res;
            console.log('412=>>>>>>>>',parseQuery(result));
            const {tag =null} = parseQuery(result);
            if(tag==1){       //tag用于标识不同平台的数据 通吃岛平台 =>>>>>> tag:1  
              this.scanCodeAction(parseQuery(result))
              return 
            }else{
              const { brandId, merchantId: id, tableId } = parseQuery(result);
              navToPage(`/package/multiStore/choosePerson/choosePerson?merchantId=${id}&tableId=${tableId}&brandId=${brandId}`);
              return
            }
          }
        })
      }

    }
    if (!NAV_LINK[functionPosition]) {
      if (item.otherUrl) {
        navToPage(item.otherUrl)
      }
      return
    }
    if (functionPosition === 2) {
      Taro.switchTab({ url: NAV_LINK[functionPosition] })
      return
    }
    navToPage(NAV_LINK[functionPosition])
  }

  goToLegendsCard = () => {
    const { islandUserMemberDTO } = getUserDetail()
    if (judgeLegendsCard(islandUserMemberDTO)) {
      navToPage('/pages/legendsUserCenter/legendsUserCenter')
    } else {
      navToPage('/pages/dredgeUnionCard/dredgeUnionCard')
    }
  }

  getLocation = () => {
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
              const { recommendGoodsList } = this.state
              if (recommendGoodsList && recommendGoodsList.length > 0) {
                this.sortProduct(recommendGoodsList, userLocation)
              }
              this.setState({
                userLocation
              }, () => {
                this.initialize()
              })
            }
          })
        }
      }
    })
  }

  onShareAppMessage() {
    const { code } = getUserDistributor()
    const { appName } = getPlatFormInfo()
    return {
      title: `${appName}`,
      path: `/pages/index/index?code=${code}`,
      // imageUrl: `${POSTER_URL}/home-poster.jpg`
    }
  }

  chooseLocation = () => {
    Taro.chooseLocation({
      success: ({ latitude, longitude, name }) => {
        const newLocation = {
          latitude,
          longitude,
          name
        }
        saveUserLocation(newLocation)
        this.setState({
          userLocation: newLocation
        }, () => {
          this.initialize()
        })
      }
    })
  }

  // 以下为 类函数式组件，命名以render开头
  renderNotice(item) {
    return (
      <View className="flex-row flex-ac">
        {
          item.map((ele, index) => {
            const {
              amount, headPic, sysWebSocketResponseType,
              userName
            } = ele
            return (
              <Block key={index}>
                <Image className="userImg flex-sk" src={getServerPic(headPic)} />
                <Text
                  className="info ellipsis"
                >
                  {`${resetName(userName)}，${DYNAMIC_TYPE[sysWebSocketResponseType]}￥${amount.toFixed(1)}`}
                </Text>
              </Block>
            )
          })
        }
      </View>
    )
  }

  renderMedia() {
    const { recommendPropaganda: list } = this.state
    return (
      <ScrollView
        className="mediaScroll"
        scrollX
      >
        {
          list.map(ele => {
            const {
              placeTypePromotePic, placeName, id,
              promoteTypeName, reward, expertGrade,
              takeCount = 0, numberPeople, endTime = '',
              islandUserModels = [], state: status,
              havePermissionTakeOrder, event
            } = ele
            const userList = islandUserModels.slice(0, 3)
            const { id: userId } = getUserDetail()
            const isJoin = islandUserModels.findIndex(({ id: joinId }) => joinId === userId)
            const needPerson = numberPeople - takeCount
            return (
              <View
                className="mediaItem"
                hoverClass="clickHover"
                key={id}
                onClick={() => {
                  navToPage(`/pages/propagandaRewardDetail/propagandaRewardDetail?id=${id}`)
                }}
              >
                <Image src={getServerPic(placeTypePromotePic)} className="mediaImg" mode="aspectFill" />
                <View className="mediaInfo">
                  <Text className="mediaName">
                    {event}
                  </Text>
                  <View className="placeType">
                    {`${placeName}-${PROMOTE_TYPE[promoteTypeName]}`}
                  </View>
                  <View className="bounty">
                    <Text>
                      ￥
                      {reward}
                    </Text>
                    /单
                  </View>
                  <View className="require">
                    {placeName}
                    <Text>
                      Lv
                      {expertGrade}
                    </Text>
                  </View>
                </View>
                <View className="flex-row flex-sb flex-ac mediaFooter">
                  <View className="userImg flex-row flex-ac flex1">
                    <View className="flex-row flex-ac">
                      {
                        islandUserModels.length > 0 && (
                          <Block>
                            {
                              userList.map(o => (
                                <Image key={o.id} src={getServerPic(o.head_pic)} />
                              ))
                            }
                            <View className="omit">...</View>
                          </Block>
                        )
                      }
                    </View>
                    <Text decode>
                      还需&nbsp;
                      <Text style={{ color: '#FBAB48' }}>{`${numberPeople - takeCount} `}</Text>
                      人
                    </Text>
                  </View>
                  <Button
                    className={`grabOrderBtn ${status === 1 && isJoin === -1 && `${havePermissionTakeOrder}` !== 'false' && needPerson > 0 ? '' : 'gray'}`}
                  >
                    {
                      status === -1 ? '已结束'
                        : status === 0 ? '未开始'
                          : status === 1 ? (isJoin === -1 && (`${havePermissionTakeOrder}` !== 'false') ? needPerson > 0 ? '我要接单' : '有机会' : '已接单') : '未知'
                    }
                  </Button>
                </View>
                <View className="goodsEndTime flex-je flex-row">
                  <Text>结束时间</Text>
                  <Text>
                    {dayjs(endTime)
                      .format('YYYY-MM-DD')}
                  </Text>
                </View>
              </View>
            )
          })
        }
      </ScrollView>
    )
  }

  recordIndexModal = id => {
    const { dispatch } = this.props
    dispatch({
      type: 'index/closeIndexModalAction',
      payload: {
        adId: id
      }
    })
  }
  getOrderInfo = ()=>{
    Taro.getStorage({
      key: 'tc_island_orderInfo',
      success: res => {

        const {orderSn,wxtoken,enterpriseGuid,openId,payType,memberInfoGuid,merchantId,brandId,currentMerchant,tableInfo} = res.data
        const orderInfo = {orderSn,wxtoken,enterpriseGuid,openId,payType,memberInfoGuid,merchantId,brandId,currentMerchant,tableInfo};
        const {dispatch} = this.props;
        if(orderSn){

          dispatch({
            type: 'otherPlatform/getAllCurrentOrderAction',
            payload: {
              headerMessage:{
                enterpriseGuid,
                wxtoken,
                openId,
              },
              otherPlatform:true,
              otherdata:{
                orderGuid:orderSn,
              }
            },
            callback: ({ok,data}) => {
                if(ok&&data.code==0){
                    const orderState= data.tdata.orderState==2?false:true;
                    if(!orderState){
                        Taro.setStorage({
                            key:'tc_island_orderInfo',
                            data:{
                                orderSn:null,wxtoken:null,enterpriseGuid:null,openId:null,payType:null,memberInfoGuid:null,merchantId:null,brandId:null,tableInfo:{},merchantInfo:{}
                            }
                        })
                        Taro.setStorage({
                            key:'tc_island_tableInfo',
                            data:{
                                perNum:null,tableInfo:null,merchantId:null,tableId:null,brandId:null,tableName:null,phone:null,enterpriseGuid:null,openId:null,wxtoken:null,payType:null,merchantAvatar:null
                            }
                        })
                    }else{
                      console.log('orderInfo+.....',orderInfo)
                      this.setState({
                        orderState:true,
                        orderInfo,
                        
                      })
                    }
                }
            }
        })
        
        }
      }
    })
  }

  //扫码点餐获取门店
  //获取userID和platformID
  getU_PID = () => {
    const {weappUserId,platformId,phone,nickName,headPic,sex} = Taro.getStorageSync('tc_island_user_detail');
    return {weappUserId,platformId,phone,nickName,headPic,sex};
  
  }
  //获取enterPriseId
  getEnterPriseId = (weappUserId,platformId,res) => {
    const {dispatch} = this.props;
    dispatch({
      type: 'common/getPlatFormSystemSettingByIdAction',   //
      callback: ({ ok, data }) => {
        if (ok) {
          const { enterpriseGuid } = data
          this.getOPenId(weappUserId,platformId,res,enterpriseGuid); 
        }else{
          showToast("企业信息错误")
          hideLoading();
        }
      }
    })
  }

  //获取openID
  getOPenId= (userId=null,platformId=null,result={},enterpriseGuid=null)=>{
    const { dispatch } = this.props;
    dispatch({
      type: 'otherPlatform/getOpenIDAction',
      payload: {
        userId,
        platformId
      },
      callback:({ok,data}) =>{
        if(ok){
          const {identity:openid} = data;
          this.getToken(openid,result,enterpriseGuid)
        }else{
          showToast('用户信息错误')
          hideLoading();
        }
      }
    })
  }

  //请求token 
  getToken =(openid=null,result={},enterpriseGuid=null)=>{
    const { dispatch } = this.props;
    const {phone,nickName,headPic,sex} = this.getU_PID();
    const {areaGuid,brandGuid, diningTableGuid,storeGuid} = result;
    const {merchantAvatar,id,brand} = this.findMerchant(storeGuid)
    const cnnickname = encodeURI(nickName);
    dispatch({
      type: 'otherPlatform/getOtherPlantFormTOKENAction',
      payload: {
        areaGuid,
        brandGuid,
        diningTableGuid,
        enterpriseGuid,
        storeGuid,
        openid,
        nickname:cnnickname,
        sex,
        headImgUrl:headPic,
      },
      callback: ({ok,data}) => {
        if (ok) {
          const Token = data.tdata.token; 
          navToPage(`/package/otherScanOrder/choosePerson/choosePerson?wxtoken=${Token}&tableId=${diningTableGuid}&brandId=${brandGuid}&enterpriseGuid=${enterpriseGuid}&merchantId=${storeGuid}&openId=${openid}&phone=${phone}&merchantAvatar=${merchantAvatar}&preBrandId=${brand}&preId=${id}`)
          hideLoading();
        } else {
          showToast(data.message)
          hideLoading();
        }
      }
    })

  }

  //找到门店
  findMerchant = (storeGuid)=>{
    const {merchantList} = this.state;
    const currentMerchat = merchantList.filter(item=>item.thirdNo==storeGuid);
    return currentMerchat[0]
  }

  //扫码识别操作
  scanCodeAction = (res)=>{
    // const {enterpriseGuid} = this.state;
    // 依据不同平台进行不同的操作 （是否有enterpriseGuId是判断平台的标准）;  
    showLoading(); 
    const {weappUserId,platformId} = this.getU_PID();
    this.getEnterPriseId(weappUserId,platformId,res); 
  }

  render() {
    const {
      bannerList, recommendPropaganda, brandCoupon,
      recommendGoodsList, userLocation: { name }, navLink,
      waistAd1, waistAd2, distributionList, bonusPool,
      indexModal = {}, closeAccount, accountModal,
      userNotice, merchantList, merchantNoData, brandList,
      bonusPollIsClose, allMerchantAndBrand, renderStatus,
      platformDetail, userLocation, systemColor,orderState,orderInfo
    } = this.state;
    const{orderSn,wxtoken,enterpriseGuid,openId,payType,memberInfoGuid,merchantId,brandId,currentMerchant,tableInfo} = orderInfo;
    const { allBrand, allMerchant } = allMerchantAndBrand
    return (
      <View className="pageContainer">
        {
          !renderStatus && (
            <View className="loading">
              <AtActivityIndicator mode="center" content="加载中..." />
            </View>
          )
        }
        {/* banner */}
        <View className="pageHeader" >
          <View className="pageBack" style={{ background: `${Taro.getStorageSync('systemColor')}` }} />
          <View className="indexHead">
            <View className="indexLocation flex-row flex-ac ellipsis" onClick={this.chooseLocation}>
              {/* <IconFont value="imgIndexLocation" h={26} w={21} mr={8} /> */}
              <Text className="ellipsis">{name}</Text>
              <Image className="flex-sk" src={require('../../images/icon/angle_up.png')} />
            </View>
            <View
              className="indexSearch flex-sk"
              onClick={() => {
                navToPage('/package/multiStore/search/search')
              }}
            >
              今天吃什么？
            </View>
          </View>
          <Swiper
            className="bannerWarp"
            circular
            indicatorDots
            autoplay
          >
            {
              bannerList.length > 0 && bannerList.map(ele => {
                const { id, imageUrl } = ele
                return (
                  <SwiperItem key={id}>
                    <Image
                      className="bannerImg"
                      src={getServerPic(imageUrl)}
                      onClick={() => {
                        advertisingLinks(ele, this)
                      }}
                    />
                  </SwiperItem>
                )
              })
            }
          </Swiper>
        </View>

        <View className="notice flex-row flex-ac">
            <Image className="dynamicIcon" src={`${STATIC_IMG_URL}/dynamic.png`} />
            <Swiper
              className="dynamicWarp flex1"
              circular
              autoplay
              vertical
              interval={2000}
            >
              {
                arrayChunk(userNotice, 2)
                  .map((o, index) => {
                    return (
                      (
                        <SwiperItem key={index}>
                          {this.renderNotice(o)}
                        </SwiperItem>
                      )
                    )
                  })
              }
            </Swiper>
          </View>

        {/* 导航 */}
        <View className="indexNav">
          <AtGrid
            columnNum={4}
            data={navLink}
            hasBorder={false}
            onClick={this.navigation}
          />
        </View>

        {/* 媒体宣发 */}
        {
            recommendPropaganda.length && (
              <View className="member" style={{ marginTop: '-10px' }}>
                <View className="title">
                  <Text>推广赚钱</Text>
                  <Text />
                  <Text>最高赏金1万元</Text>
                  <View
                    className="more flex-row flex-ac"
                    onClick={() => {
                      navToPage('/pages/propagandaReward/propagandaReward')
                    }}
                  >
                    <Text>更多</Text>
                    <IconFont value="icon-arrow-right-copy-copy" size={30} />
                  </View>
                </View>
                {this.renderMedia()}
              </View>
            )
          }

        {/* 奖金池banner */}
        {
          bonusPollIsClose && (
            <View
              className="bonusPools"
              onClick={this.goToLegendsCard}
            >
              <Text>{bonusPool}</Text>
            </View>
          )
        }

        {/* 推荐商品 */}
        {
          recommendGoodsList.length && (
            <View className="member" style={{ marginTop: '-10px' }}>
              <View className="title">
                <Text>限时抢购</Text>
                <Text />
                <Text>最低￥9.9</Text>
                <View
                  className="more flex-row flex-ac"
                  onClick={() => {
                    navToPage('/package/specialOffer/specialOffer')
                  }}
                >
                  <Text>更多</Text>
                  <IconFont value="icon-arrow-right-copy-copy" size={30} />
                </View>
              </View>
              <ScrollView
                scrollX
                className="limitGoods"
              >
                {
                  recommendGoodsList.map(ele => (
                    <LimitGoods
                      key={ele.id}
                      details={ele}
                      distributionList={distributionList}
                    />
                  ))
                }
              </ScrollView>
            </View>
          )
        }

        

        <View style={{
          // background: '#f4f4f4',
          overflow: 'hidden'
        }}
        >

          {/* 平台大V 腰部广告位（2） */}
          <View className="enteringAd">
            {
              objNotNull(waistAd1) && (
                <Image
                  onClick={() => {
                    advertisingLinks(waistAd1, this)
                  }}
                  className="adImg1"
                  src={getServerPic(waistAd1.imageUrl)}
                />
              )
            }
            {
              objNotNull(waistAd2) && (
                <Image
                  onClick={() => {
                    advertisingLinks(waistAd2, this)
                  }}
                  className="adImg2"
                  src={getServerPic(waistAd2.imageUrl)}
                />
              )
            }
          </View>
          {/* 会员权益 */}
          {
            brandCoupon && brandCoupon.length && (
              <View className="member">
                <View className="title">
                  <Text>会员权益</Text>
                  <Text />
                  <Text>一次开通,终身受益</Text>
                  <View
                    className="more flex-row flex-ac"
                    onClick={() => {
                      navToPage('/pages/rightsCoupon/rightsCouponHome')
                    }}
                  >
                    <Text>更多</Text>
                    <IconFont value="icon-arrow-right-copy-copy" size={30} />
                  </View>
                </View>
                <View className="brandCoupon flex-row flex-wrap">
                  {
                    brandCoupon.map(ele => {
                      const {
                        picture, dishName, dishId, tagStr,
                        dishImageUrl
                      } = ele
                      return (
                        <View
                          className="couponItem flex-col flex-ac flex-sk"
                          key={dishId}
                          onClick={() => {
                            this.goToCouponDetail({
                              dishId,
                              dishName,
                              picture: dishImageUrl
                            })
                          }}
                        >
                          <AtBadge value={tagStr}>
                            <Image src={getServerPic(picture)} />
                          </AtBadge>
                          <Text className="ellipsis">{dishName}</Text>
                        </View>
                      )
                    })
                  }
                </View>
              </View>
            )
          }
          {/* 品牌 */}
          {
            brandList.length && (
              <View className="member">
                <View className="title flex-row flex-sb flex-ac">
                  <Text>旗下品牌</Text>
                  {/* <Text />
                  <Text>{`${allBrand || 13}个餐饮品牌,${allMerchant && allMerchant.openNum || 700}余家门店`}</Text> */}
                  <View
                    className="more flex-row flex-ac"
                    onClick={() => {
                      navToPage('/package/multiStore/brandList/brandList')
                    }}
                  >
                    <Text>更多</Text>
                    <IconFont value="icon-arrow-right-copy-copy" size={30} />
                  </View>
                </View>
                <ScrollView
                  scrollX
                  className="limitGoods"
                >
                  {
                    brandList.map(ele => {
                      const {
                        brandDTO: {
                          brandLogo, brandName, brandTag, brandDetailPic
                        }, brandId
                      } = ele
                      return (
                        <View
                          className="brandItem"
                          key={brandId}
                          onClick={() => {
                            this.$preload({
                              id: brandId, brandName, brandLogo, brandDetailPic
                            })
                            navToPage('/package/multiStore/brandDetail/brandDetail')
                          }}
                        >
                          <View className="flex-col flex-ac">
                            <Image src={getServerPic(brandLogo)} mode="aspectFit" />
                            <View className="ellipsis">{brandName}</View>
                            {
                              brandTag && (<View className="ellipsis">{brandTag}</View>)
                            }
                          </View>
                        </View>
                      )
                    })
                  }
                </ScrollView>
              </View>
            )
          }

          {/* 推荐商家 */}
          {!platformDetail.homeModel ? (
            <View className="member">
              <View className="title flex-row flex-sb flex-ac">
                <Text>商家门店</Text>
                {/* <Text />
                <Text>最高赏金10万元</Text> */}
                <View
                  className="more flex-row flex-ac"
                  onClick={() => {
                    navToPage(`/package/multiStore/merchantList/merchantList`)
                  }}
                >
                  <Text>更多</Text>
                  <IconFont value="icon-arrow-right-copy-copy" size={30} />
                </View>
              </View>
              {
              merchantList.map(ele => <Merchant key={ele.id} merchantDetail={ele} />)
            }
            {/* {
              !merchantNoData && <AtLoadMore status={'loading'} />
            } */}
            </View>
          )
            : (
              <View className="member">
                {/* 行业头部商家 */}
                {/* <Image src={`${STATIC_IMG_URL}/top_header.png`} className="topMerchant"/> */}
                {/* 分享商品 */}
                <View className="title">
                  <Text>口口相传</Text>
                  <Text />
                  <Text>分享还返现，最高返现95%</Text>
                  <View
                    className="more flex-row flex-ac"
                    onClick={() => {
                      navToPage('/pages/specialOffer/specialOffer')
                    }}
                  >
                    <Text>更多</Text>
                    <IconFont value="icon-arrow-right-copy-copy" size={30} />
                  </View>
                </View>

                {/* 商品列表 */}
                <View className="goodsList">
                  {
                recommendGoodsList.length > 0 && recommendGoodsList.map(ele => (
                  <Goods
                    key={ele.id}
                    details={ele}
                    userLocation={userLocation}
                    distributionList={distributionList}
                  />
                ))
              }
                  {
                    <View className="bottomLine flex-row flex-ac flex-sb">
                      <Text>我也是有底线的</Text>
                    </View>
              }
                </View>
              </View>
            )}
        </View>
        {orderState&&
          <View className="orderTag">
            <ToOrderDetail merchantDetail={null} orderSn={orderSn?orderSn:null} wxtoken={wxtoken?wxtoken:null} enterpriseGuid={enterpriseGuid?enterpriseGuid:enterpriseGuid} openId={openId?openId:openId} payType = {1} memberInfoGuid={memberInfoGuid?memberInfoGuid:null} merchantId={merchantId?merchantId:null} brandId={brandId?brandId:null} currentMerchant={currentMerchant?currentMerchant:null} tableInfo={tableInfo?tableInfo:null}></ToOrderDetail>
          </View>}
        <Footer />

        {/* 首页广告弹窗 */}
        <AtCurtain
          isOpened={objNotNull(indexModal)}
          onClose={() => {
            this.setState({
              indexModal: {}
            }, () => {
              this.recordIndexModal(indexModal.id)
            })
          }}
        >
          <Image
            src={getServerPic(indexModal.imageUrl)}
            className="curtainImg"
            mode="aspectFit"
            onClick={() => {
              advertisingLinks(indexModal, this)
              this.recordIndexModal(indexModal.id)
            }}
          />
        </AtCurtain>
        {
          accountModal && (
            <View className="attention">
              <OfficialAccount
                onload={() => {
                  this.setState({
                    closeAccount: true
                  })
                }}
              />
              {
                closeAccount && (
                  <View
                    className="closeAccount"
                    onClick={() => {
                      this.setState({
                        accountModal: false
                      })
                    }}
                  >
                    <IconFont value="imgClose" h={50} w={50} />
                  </View>
                )
              }
            </View>
          )
        }

     
      </View>
    )
  }
}

export default Index
