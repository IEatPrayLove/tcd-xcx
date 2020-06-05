import Taro from '@tarojs/taro'

// import * as config from "../../../config/baseUrl";

import {
  Image, Text, View, Block
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import './merchantDetail.scss'
import {
  calculateDistanceByCoordinate,
  callPhone,
  encodeURIObj,
  getCurrentLoaction,
  getPlatFormId,
  getServerPic,
  getUserLocation,
  navToPage,
  typeAnd,
  parseQuery,
  showToast,
  judgeIsPartner,
  setShareInfo,
  saveCurrentLocation,
  latelyMerchant, needLogin, getUserDistributor
} from '../../../utils/utils'
import { MERHCANT_WEEK, SHOP_MODE_ENUM } from '../../../config/config'
import { STATIC_IMG_URL, IP } from '../../../config/baseUrl'
import IconFont from '../../../components/IconFont/IconFont'
import Goods from '../../../components/Goods/Goods'

@connect(() => ({}))
export default class merchantDetail extends Taro.Component {
  config = {
    navigationBarTitleText: '加载中...',
    onReachBottomDistance: 50
  }

  constructor() {
    super()
    const {
      params: {
        q, id, brandId
      }
    } = this.$router
    let curMerchantId = id
    let curBrandId = brandId
    // console.log('微信分享参数', shareCode)
    if (q) {
      console.log(q)
      const posterObj = parseQuery(decodeURIComponent(q))
      console.log('海报分享参数', posterObj)
      const { code, merchantId, brandId } = posterObj
      curMerchantId = merchantId
      curBrandId = brandId
      setShareInfo({ code })
    }
    this.state = {
      currentPage: 0,
      merchantId: curMerchantId,
      brandId: curBrandId,
      packageList: [],
      merchantInfo: {},
      merchantDetail: {},
      distance: 0,
      businessWeek: [],
      distributionList: [],
      openOfferToPay: false,
      openScanCode: false,
      merchantActivity: [],
      distributorInfo: [],
      distributorProportion: '',
      deliveryArea: null, // 配送范围
      minShop: {}, // 距离最近门店,
      enterPriseGuidBool: false, // 判断平台   true =>>>  通吃岛\
      enterpriseGuid: '',
      userId: '',
      platformId: '',
      openId: '',
      phone:null,
      nickname:null,
      headImgUrl:null,
      sex:null,
      thirdNo:null,
      merchantAvatar:null,
      preId:null,
      preBrandId:null,
    }
  }

  componentWillMount() {
    const {
      params: {
        code: shareCode
      }
    } = this.$router
    setShareInfo({ code: shareCode })
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: '#ffffff'
    })


    this.getU_PID();
    this.getEnterPriseId();
    
    // console.log("107=>>>>>>>>>>>>",this.$router.params);
    const {thirdNo=null,merchantAvatar=null,id=null,brandId=null} = this.$router.params;
    this.setState({
      thirdNo,
      merchantAvatar,
      preId:id,
      preBrandId:brandId
    })
  }

  componentDidShow() {
    if (!needLogin()) return
    this.getMerchant()
    this.getMerchantDetail()
    this.getPackage()
    this.getMerchantActivity()
    this.getMerchantDistributorInfo()
  }

  // 获取userID和platformID
  getU_PID = () => {

    Taro.getStorage({
      key: 'tc_island_user_detail',
      success: res => {
        this.setState({
          userId : res.data.weappUserId,
          platformId : res.data.platformId,
          phone : res.data.phone,
          nickname:res.data.nickName,
          headImgUrl:res.data.headPic,
          sex:res.data.sex
        })
      }
    })
  }

  // 判断平台
  getEnterPriseId = () => {
    const {dispatch} = this.props;
    dispatch({
      type: 'common/getPlatFormSystemSettingByIdAction',   //
      callback: ({ ok, data }) => {
        if (ok) {
          console.log('119     是否含有enterPriseId', data)
          const { enterpriseGuid } = data
          this.setState({
            enterpriseGuid:enterpriseGuid
          })
          // this.state.enterpriseGuid = enterpriseGuid

          // this.state.enterpriseGuid = '2003051656002600009'
        }
      }
    })
  }

  // 不同平台的操作
  differentPlatformAction= res => {
    this.getOpenId(({ok,data})=>{this.callbackGetOpenId({ok,data},res)},res);
  }

  // 首次进入自动定位坐标
  firstLocation = goodsDetail => {
    Taro.getLocation({
      type: 'gcj02',
      altitude: true,
      success: res => {
        if (res.errMsg === 'getLocation:ok') {
          // 获取实际位置
          this.props.dispatch({
            type: 'index/putPutLocationNameByPositionAction',
            payload: {
              position: `${res.longitude},${res.latitude}`
            },
            callback: ({ ok, data }) => {
              const {
                provinceName, cityName, areaName, position, name
              } = data
              saveCurrentLocation({
                address: `${provinceName}${cityName}${areaName}`,
                name,
                longitude: position.split(',')[0] - 0,
                latitude: position.split(',')[1] - 0
              })
              const minShop = latelyMerchant(goodsDetail.dishMerchantShippingInfo, getCurrentLoaction())
              this.loadMerchantInfo(minShop.merchantId)
              this.setState({
                deliveryArea: minShop.isDeliveryRange || false,
                minShop
              })
              const { pagination } = this.state
              this.loadMerchantList(pagination)
            }
          })
        }
      },
      fail: res => {
        if (res.errMsg === 'getLocation:fail auth deny') {
          this.openWxSetting(goodsDetail)
        } else {
          showToast('定位失败,请手动定位')
        }
      }
    })
  }

  // 尝试打开用户授权 再进行获取
  openWxSetting = data => {
    Taro.showModal({
      title: '提示',
      content: '无法获取您的位置，请点击确定授权，授权后才能为您提供距离计算及外卖配送服务',
      success: res => {
        res.confirm && Taro.openSetting({
          success: res => {
            this.firstLocation(data)
          }
        })
      }
    })
  }

  // 小程序分享
  onShareAppMessage() {
    // const { goodsDetail: { dishId, shopDish: { dishName } }, merchantInfo: { id } } = this.props
    const { code } = getUserDistributor()
    const { merchantId, brandId, merchantDetail } = this.state
    return {
      title: merchantDetail.merchant_name || '门店详情',
      path: `/package/multiStore/merchantDetail/merchantDetail?id=${merchantId}&brandId=${brandId}&code=${code || ''}`
    }
  }

  // 获取门店分销业务
  getMerchantDistributorInfo = () => {
    const { dispatch } = this.props
    const { merchantId } = this.state
    dispatch({
      type: 'merchant/getMerchantDistributorInfo',
      payload: {
        merchantId: [merchantId]
      },
      callback: ({ ok, data }) => {
        if (ok && data) {
          const { openDistribution, distributorMerchantDetail, distributorProportion } = data.find(({ merchantId: id }) => id == merchantId) || {}
          this.setState({
            distributorInfo: openDistribution ? distributorMerchantDetail : [],
            distributorProportion
          })
        }
      }
    })
  }

  // 获取门店满减信息
  getMerchantActivity = () => {
    const { dispatch } = this.props
    const { merchantId } = this.state
    dispatch({
      type: 'merchant/getMerchantActivityAction',
      payload: {
        merchantId
      },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            merchantActivity: data
          })
        }
      }
    })
  }

  // 获取套餐
  getPackage = () => {
    const { currentPage, merchantId, brandId } = this.state
    this.props.dispatch({
      type: 'merchant/getPackageAction',
      payload: {
        page: currentPage,
        size: 999999,
        platformId: getPlatFormId(),
        brandId,
        merchantId,
        dishName: '',
        type: 5 // 1: 快递到家 4: 到店消费
      },
      callback: ({ ok, data }) => {
        if (ok && data.length) {
          this.getProductDistribution(data.map(({ dishId }) => dishId))
          this.setState({
            packageList: data.filter(item => item.isShow)
          })
        }
      }
    })
  }

  // 套餐类型
  packageType = num => {
    const businessHour = [1, 2, 4, 8, 16, 32].reduce((acc, ele) => {
      if (typeAnd(num - 0, ele)) {
        switch (ele) {
          case 1:
            acc.push('快递到家')
            break
          case 2:
            acc.push('外卖点餐')
            break
          case 4:
            acc.push('到店消费')
            break
          case 8:
            acc.push('外卖自提')
            break
          case 16:
            acc.push('外卖套餐')
            break
          case 32:
            acc.push('线上兑换')
            break
        }
      }
      return acc
    }, [])
    if (JSON.stringify(businessHour)
      .indexOf('外卖点餐') !== -1 || JSON.stringify(businessHour)
      .indexOf('外卖自提') !== -1 || JSON.stringify(businessHour)
      .indexOf('外卖套餐') !== -1) {
      return true
    }
    return false
  }

  // 获取门店信息
  getMerchant = () => {
    const { merchantId, brandId } = this.state
    this.props.dispatch({
      type: 'merchant/getMerchantAction',
      payload: {
        platformId: getPlatFormId(),
        brandId,
        merchantId
      },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            merchantInfo: data
          })
        }
      }
    })
  }

  // 获取门店详情
  getMerchantDetail = () => {
    const { merchantId } = this.state
    this.props.dispatch({
      type: 'merchant/getMerchantDetailAction',
      payload: {
        merchantId,
        platformId: getPlatFormId()
      },
      callback: res => {
        Taro.setNavigationBarTitle({ title: res.data.merchantDTO.merchant_name })
        this.setState({
          merchantDetail: res.data.merchantDTO,
          openOfferToPay: res.data.openOfferToPay,
          openScanCode: res.data.openScanCode
        }, () => {
          const { merchantDetail } = this.state
          const businessWeek = MERHCANT_WEEK.filter(ele => typeAnd(merchantDetail.businessHours, ele.value))
          this.setState({
            distance: this.getDistance(),
            businessWeek
          })
        })
      }
    })
  }

  // 判断商品是否为分享商品
  getProductDistribution = dishIds => {
    const { dispatch } = this.props
    dispatch({
      type: 'index/getProductIsDistributionAction',
      payload: { dishIds },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            distributionList: data
          })
        }
      }
    })
  }

  // 计算门店距离
  getDistance = () => {
    const { merchantDetail } = this.state
    const [longitude, latitude] = merchantDetail.merchantDetails.position.split(',')
    const userLocation = getUserLocation()
    return calculateDistanceByCoordinate(latitude, userLocation.latitude, longitude, userLocation.longitude)
  }

  // 打开地图
  openLocation = merchantDetails => {
    const positions = merchantDetails.position.split(',')
    Taro.openLocation({
      latitude: Number(positions[1]),
      longitude: Number(positions[0]),
      name: merchantDetails.address,
      // address: shopDish.dishName,
      scale: 28,
      success: () => {

      },
      fail: error => {
        console.log(error)
      }
    })
  }

  // 拨打电话
  callPhone = phoneNumber => {
    callPhone(phoneNumber)
  }

  // 跳转
  onNavigateTo = url => {
    navToPage(url, true)
  }

  //请求openId
  getOpenId = (callback,data)=>{
    const {dispatch} = this.props
    const {  userId, platformId} = this.state;
   
    dispatch({
      type: 'otherPlatform/getOpenIDAction',
      payload: {
        userId,
        platformId
      },
      callback
    })
  }

  callbackGetOpenId =({ok,data},res)=>{
    if (ok) {
      this.setState({
        openid: data.identity
      })
      const openid = data.identity;
      const { areaGuid, brandGuid, diningTableGuid, storeGuid } = res;
      // 取token
      this.getWxtoken((response)=>{this.callbackGetWxtoken(response,{ areaGuid, brandGuid, diningTableGuid, storeGuid,openid})},{ areaGuid, brandGuid, diningTableGuid, storeGuid,openid })
    } else {
      showToast('data error')
    }

  }

  getWxtoken =(callback,data)=>{
    const { areaGuid, brandGuid, diningTableGuid, storeGuid,openid } = data;
    const {dispatch} = this.props;
    const { enterpriseGuid,nickname,headImgUrl,sex} = this.state;
    
    const cnnickname = encodeURI(nickname);   //中文需要进行一次转化
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
        headImgUrl,       
      },
      callback
    })

  }
  callbackGetWxtoken = (response,data)=>{
    if (response.data.code == 0) {
      const { enterpriseGuid, phone,merchantAvatar,preId,preBrandId} = this.state;
      console.log('556=>>>>>>>>>>>>',merchantAvatar)
      const Token = response.data.tdata.token;
      const {brandGuid, diningTableGuid, storeGuid,openid } =data;
      navToPage(`/package/otherScanOrder/choosePerson/choosePerson?wxtoken=${Token}&tableId=${diningTableGuid}&brandId=${brandGuid}&enterpriseGuid=${enterpriseGuid}&merchantId=${storeGuid}&openId=${openid}&phone=${phone}&merchantAvatar=${merchantAvatar}&preBrandId=${preBrandId}&preId=${preId}`)
    } else {
      showToast(response.data.message)
    }

  }

  //获取订单信息


  //获取订单信息回调

  

  render() {
    const {
      packageList, merchantInfo, merchantDetail, merchantActivity, distributorInfo,
      distance, businessWeek, merchantId, distributionList, openOfferToPay, openScanCode, brandId
    } = this.state
    const {
      merchantCount
    } = merchantInfo
    const {
      merchant_name, merchantAvatar,
      categorys, merchantDetails,
      merchantDetails: {
        serviceDescription, address, principal_mobile
      } = {},
      platFormMerchantDTO: {
        merchantAroundPic
      } = {}
    } = merchantDetail
    const merchantList = merchantAroundPic && merchantAroundPic.split(',') || []
    const showList = merchantList.slice(0, 3)
    const { takeOutActivity, scanningActivity } = merchantActivity.reduce((acc, { fullReductionlist, businessType }) => ({ ...acc, [businessType === null ? 'takeOutActivity' : 'scanningActivity']: fullReductionlist }),
      {})
    const {
      NETWORK, OFFER_TO_PAY, SCAN_CODE
    } = distributorInfo.reduce((acc, { distributorOrderType }) => ({ [distributorOrderType]: true, ...acc }), {})
    return (
      <Block>
        <View className="detailSection">
          <View className="header flex-row">
            <Image src={getServerPic(merchantAvatar)} mode="aspectFill" className="flex-sk" />
            <View className="info flex-col flex-sb flex-gw">
              <Text className="merchantName">{merchant_name}</Text>
              <View className="flex-row flex-je">
                {
                  categorys && categorys.map((ele, index) => <Text key={index}>{ele}</Text>)
                }
                {
                  // merchantCount && (
                  //   <View
                  //     // onClick={() => navToPage('/package/multiStore/brandDetail/brandDetail')}
                  //   >
                  //     {`全部${merchantCount}家门店`}
                  //     <IconFont value="icon-arrow-right-copy-copy" color="#ffffff" size={26}/>
                  //   </View>
                  // )
                }
              </View>
            </View>
          </View>
          <View className="businessSection">
            <View className="flex-row flex-as">
              <View className="flex-row flex-ac">
                <IconFont value="imgServer" h={25} w={22} />
                <Text className="title">营业时间：</Text>
              </View>
              <Text className="businessTime">
                {
                  businessWeek && businessWeek.map(ele => (
                    <Text key={ele.value}>
                      {ele.name}
                      、
                    </Text>
                  ))
                }
                {' '}
                {merchantDetail.shopHours}
              </Text>
            </View>
            <View className="service">
              {
                // console.log(serviceDescription)
              }
              {
                serviceDescription && serviceDescription[0].serviceTag && serviceDescription.map((ele, index) => <Text key={index}>{ele.serviceTag}</Text>)
              }
            </View>
          </View>
          <View className="addressSection flex-row flex-ac">
            <IconFont value="icon-dizhi" size={30} />
            <Text
              className="address flex-gw ellipsis"
              onClick={this.openLocation.bind(this, merchantDetails)}
            >
              {address}
            </Text>
            <IconFont
              value="icon-phone"
              size={30}
              onClick={this.callPhone.bind(this, principal_mobile)}
            />
          </View>
          {
            showList && (
              <View className="picSection flex-row">
                {showList.map((ele, index) => (
                  <View className="container">
                    <Image
                      key={index}
                      src={getServerPic(ele)}
                      mode="aspectFill"
                      onClick={() => {
                        Taro.previewImage({
                          current: getServerPic(ele),
                          urls: merchantList.map(o => getServerPic(o))
                        })
                      }}
                    />
                  </View>
                ))}
                {
                  merchantList.length > 3 && (
                    <View className="thumbnail flex-row flex-ac">
                      <IconFont value="imgThumbnail" h={20} w={20} mr={10} />
                      <Text>{merchantList.length}</Text>
                    </View>
                  )
                }
              </View>
            )
          }
        </View>
        <View className="merchantBox">
          {
            !judgeIsPartner() && (
              <View
                className="buyTCD flex-row flex-ae"
                onClick={() => Taro.switchTab({ url: '/package/distributor/index/index' })}
              >
                <Text className="flex-gw">开通会员，点餐可返10%，一年预计可赚￥5412</Text>
                <Text>立即开通</Text>
                <IconFont value="imgArrowBrown" ml={18} h={25} w={15} />
              </View>
            )
          }
          {
            (merchantDetail.platFormMerchantDTO && (merchantDetail.platFormMerchantDTO.outerOrderMod & SHOP_MODE_ENUM.SHIPPING.key)) === SHOP_MODE_ENUM.SHIPPING.key ? (
              <View className="merchantFunctionBox">
                <View className="functionTitle">
                  <View className="functionName">
                    <Text>外卖</Text>
                    {NETWORK && (<Text className="member">会员再返</Text>)}
                  </View>
                  <View
                    className="functionDes"
                    onClick={this.onNavigateTo.bind(this, `/package/multiStore/orderDishes/orderDishes?id=${merchantId}`)}
                  >
                    外卖
                  </View>
                </View>
                <View className="functionDetail">
                  <View className="functionFull">
                    {
                      takeOutActivity && (
                        <Block>
                          <Text className="label">满</Text>
                          {
                            takeOutActivity.map((item, index) => (
                              <Text key={index}>
                                {item.fullMoney}
                                减
                                {item.cutMoney}
                              </Text>
                            ))
                          }
                        </Block>
                      )
                    }
                  </View>
                  {
                    merchantInfo.countNetWork > 0 && (
                      <View className="functionSale">
                        售
                        {merchantInfo.countNetWork}
                      </View>
                    )
                  }
                </View>
              </View>
            ) : null
          }
          {
            openScanCode && (
              <View className="merchantFunctionBox">
                <View className="functionTitle">
                  <View className="functionName">
                    <Text>扫码点餐</Text>
                    {SCAN_CODE && (<Text className="member">会员再返</Text>)}
                  </View>
                  <View
                    className="functionDes"
                    onClick={() => {

                      Taro.scanCode({
                        scanType: ['qrCode'],
                        success: res => {
                          console.log(res);
                          const {result} = res;
                          console.log('704 parseQuery(result)', parseQuery(result));
                          const {tag=null} = parseQuery(result)
                          if (tag==1) {    // tag:1 通吃岛平台数据
                            const { thirdNo } = this.state;
                            console.log('704 parseQuery(result)', parseQuery(result),thirdNo)
                            if (thirdNo == parseQuery(result).storeGuid) {
                              this.differentPlatformAction(parseQuery(result))
                            } else {
                              console.log(thirdNo, parseQuery(result).storeGuid)
                              showToast('二维码与当前门店不匹配')
                            }
                          }else{
                            const { result } = res
                            const { brandId, merchantId: id, tableId } = parseQuery(result)
                            if (merchantId !== id) {
                              showToast('二维码与当前门店不匹配')
                              return
                            }
                            if (id && tableId && brandId) {
                              navToPage(`/package/multiStore/choosePerson/choosePerson?merchantId=${id}&tableId=${tableId}&brandId=${brandId}`)
                              return
                            }
                            showToast('二维码有误')
                          }
                        }
                      })
                    }}
                  >
                    立即点餐
                  </View>
                </View>
                <View className="functionDetail">
                  <View className="functionFull">
                    {/* 掌控者平台的满活动，在商品之中，店铺没有   zxk :false*/}
                    {
                      scanningActivity && false && (  
                        <Block>
                          <Text className="label">满</Text>
                          {
                            scanningActivity.map((ele, index) => (
                              <Text key={index}>
                                {ele.fullMoney}
                                减
                                {ele.cutMoney}
                              </Text>
                            ))
                          }
                        </Block>
                      )
                    }
                  </View>
                  {
                    merchantInfo.countNetWork > 0 && (
                      <View className="functionSale">
                        售
                        {merchantInfo.countScan}
                      </View>
                    )
                  }
                </View>
              </View>
            )
          }
          {
            openOfferToPay && (
              <View className="merchantFunctionBox">
                <View className="functionTitle">
                  <View className="functionName">
                    <Text>优惠买单</Text>
                    {OFFER_TO_PAY && (<Text className="member">会员再返</Text>)}
                  </View>
                  <View
                    className="functionDes"
                    onClick={() => {
                      const ratio = distributorInfo.find(({ distributorOrderType }) => distributorOrderType === 'OFFER_TO_PAY')
                      const { distributorProportion } = this.state
                      navToPage(`/package/multiStore/preferentialPayment/preferentialPayment?merchantId=${merchantId}&brandId=${brandId}`)
                    }}
                  >
                    买单
                  </View>
                </View>
                <View className="functionDetail">
                  {
                    merchantInfo.discount === 10 ? <View className="functionWord">手机买单更便捷</View> : (
                      <View className="functionWord">
                        优惠买单，
                        {merchantInfo.discount}
                        折优惠
                      </View>
                    )
                  }
                  {
                    merchantInfo.countOffer > 0 && (
                      <View className="functionSale">
                        售
                        {merchantInfo.countOffer}
                      </View>
                    )
                  }
                </View>
              </View>
            )
          }
          {
            packageList && packageList.length && (
              <Block>
                <View className="recommendTitle">
                  <Image src={`${STATIC_IMG_URL}/icon/icon_package.png`} />
                  <Text>超值套餐</Text>
                </View>
                <View className="packageList">
                  {
                    packageList.map(item => {
                      const { id } = item
                      return (
                        <Goods
                          key={id}
                          details={item}
                          userLocation={getUserLocation()}
                          distributionList={distributionList}
                        />
                      )
                    })
                  }
                </View>
              </Block>
            )
          }

        </View>
      </Block>
    )
  }
}
