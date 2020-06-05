import Taro, { Component } from '@tarojs/taro'
import {
  View, Swiper, SwiperItem, Image, Text, ScrollView, Block,
  Button
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtIcon, AtProgress ,AtCurtain} from 'taro-ui'
import './scanningIndex.scss'
import {
  getAuthenticate,
  getPlatFormId,
  getServerPic,
  navToPage,
  objNotNull, readTempBuyCar,
  saveTempBuyCar,
  timeIsRange,
  toDecimal, typeAnd, getUserInfo, hideLoading,
  imitateObjectValues, showLoading, getUserDetail, showToast, needLogin,getIndexModalTime,getCacheName,advertisingLinks
} from '../../../utils/utils'
import {
  CONTEXT_ANCHOR_PREFIX,
  DISH_HOT,
  DISH_OFFER,
  CATEGORY_ANCHOR_PREFIX,
  CAR_TYPE_SHOP,
  MERHCANT_WEEK,
  PROMPT,
  SHOPPING_CART,
  MENU_HEADER_HEIGHT,
  MENU_FOOTER_HEIGHT,
  CATEGORY_TABS_HEIGHT,
  LOCATION_TYPE_HEIGHT,
  SHOPPING_CAR_STATUS,
  LIMIT_TYPE
} from '../../../config/config'
import {
  DEFAULT_PLAT_FORM_ID,
  STATIC_IMG_URL,
  WEBSOCKET_IP_ORDERING,
  PLATFORM_ID,
  OTHERWEBSOCKET_IP,
  OTHERWEBSOCKET_PORT
} from '../../../config/baseUrl'
import WebSocket from '../../../utils/WebSocket'
import PageLoading from '../../../components/PageLoading/PageLoading'
import IconFont from '../../../components/IconFont/IconFont'
import { getPlatform } from '../../../utils/api'
import ChooseVipCard from '../../../components/chooseVipCard/chooseVipCard'
import {ourRenderData,shopCartGoodsList} from '../model/operateData'

const dayjs = require('dayjs')

const maxConnectTime = 3;
const { onfire } = Taro.getApp();

@connect(({
  loading: { effects }
}) => ({
  effects
}))
class ScanningIndex extends Component {
  config = {
    navigationBarTitleText: '',
    onReachBottomDistance: 50,
    // enablePullDownRefresh: true,
  }

  constructor() {
    super()
    const systemInfo = Taro.getStorageSync('systemInfo')
    // console.log('邀请uid', this.$router.params.uid)
    this.state = {
      windowHeight: systemInfo.windowHeight, // 当前设备高度
      pageUpperContentHeight: 0,
      indexModal: {}, // 首页弹窗
      dishList: [],
      windowScrollHeight: '', // 左右滚动区域高度
      leftToView: '', // 左侧锚点
      cartVisible: false, // 购物车弹窗merchantAdvertisement
      cardVisble: false,    //会员卡列表
      friendBuyVisible: false, // 好友买单弹窗
      friendSettleVisible: false, // 好友结算弹窗
      personList: [],
      personNum: Number(this.$router.params.personNum),
      personNumCopy: Number(this.$router.params.personNum),
      tableId: this.$router.params.tableId,
      payType: Number(this.$router.params.payType),
      newTable: this.$router.params.newTable,
      tableName: this.$router.params.tableName,
      choosePersonVisible: false,
      merchantInfoHeight: 0,
      favourableVisible: false,
      tableInfo: {},
      merchantId: this.$router.params.merchantId,
      currentCar: null,
      highlightCategoryId: '', // 左侧分类高亮
      showSkuModal: false,
      skuDish: {}, // 需要选择规格的商品
      currentMerchant: {},
      currentSku: {}, // 当前选中的规格
      currentAttr: {}, // 当前选中的属性
      currentSwiper: 0,
      menuIsScroll: false, // 菜单左右滑动控制
      uid: this.$router.params.uid || '',
      orderingInfo: {},
      brandId: this.$router.params.brandId,
      productList: {},
      operate: null,
      userInfo: {},
      subDishId: null,
      recommendDish: [],
      fullReduction: [],
      linkageLocking: false,
      requiredDish: {},
      partnerPrompt: {},
      allProduct: [],
      userId: getAuthenticate() && getAuthenticate().userId,
      orderOverStatus: false,
      ad: '',
      orderSn: null,
      shoppingCarStatus: null,
      socketIsSuccess: false,
      showFinishBtn: true,
      enterpriseGuid: this.$router.params.enterpriseGuid,    //平台判断
      openId: this.$router.params.openId,
      wxtoken: this.$router.params.wxtoken,
      preBrandId: this.$router.params.preBrandId,
      preId:this.$router.params.preId,


      otherplatformGoods:[],
      otherPlatformData:{},
      peopleNum:0,
      orderSnState:this.$router.params.orderSn,
      isMember:false,   //是否是会员
      memberInfoGuid:null, //会员账号
      alreadyStoredCards:[], //会员卡列表
      selectedCard: {},
      detailModal: false, // 显示商品详情
      dishInfo: {},
    }
    this.categoryScrollHeight = []// 各个分类标题离顶部高度
    this.promptState = true,
    this.connectTime = 0,
    this.socket = null
  }

  
  
  componentDidMount() {

    needLogin()
    onfire.on('getTableMsg', () => {
      this.setState({
        uid: ''
      })
    })
  }

  // socket消息提示(好友点菜/结束点菜)
  partnerPrompt = ({ message, type }) => {
    if (!this.promptState) clearTimeout(this.timeout)
    this.promptState = false
    this.setState({
      partnerPrompt: { ...message, type }
    })
    this.timeout = setTimeout(() => {
      this.promptState = true
      this.setState({
        partnerPrompt: {}
      })
    }, 3000)
  }

  componentWillMount() {
   
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    })
    console.log('this.$router.params',this.$router.params);
    const{merchantId,preId,personNum,tableInfo } = this.$router.params;
    const currentMerchant = {
      id:merchantId,
      preId,
    }
    this.setState({
      // personList: tableList,
      tableInfo: JSON.parse(tableInfo),
      peopleNum:personNum,
      currentMerchant
    }, () => {
      Taro.setNavigationBarTitle({
        title: JSON.parse(this.$router.params.tableInfo).brandName
      })
    })
    if(getAuthenticate()){
      this.productDataInitialize() 
    }
      //判断是否是另一个平台的会员
    this.ismember(this.callbackIsMember);  
    //判断有没有未完成订单
   
    
    
  }
  componentDidMount(){
    //弹窗
    this.getAdModal();
  }
  componentDidHide() {
    this.setState({
      indexModal: {}
    })
  }

  componentDidShow() {
    if (getAuthenticate()) {
      const {socketIsSuccess} = this.state
      if(!socketIsSuccess){
        this.connectSocket()
      }else{
        return 
      }
       ;
      // this.otherConnectSocket(); 
    }
    this.setState({
      currentSwiper: 0,
      menuIsScroll: false
    }, () => {
      const query = Taro.createSelectorQuery()
      try {
        query.select('#pageUpperContent')
          .boundingClientRect(({ height }) => {
            this.setState({
              pageUpperContentHeight: height
            })
          })
          .exec()
      } catch (e) {
        this.setState({
          pageUpperContentHeight: 0
        })
      }
      try {
        query.select('#merchantInfo')
          .boundingClientRect(({ height }) => {
            this.setState({
              merchantInfoHeight: height
            })
          })
          .exec()
      } catch (e) {
        this.setState({
          merchantInfoHeight: 0
        })
      }
    })
    this.getOtherPlatformCart(this.callbackGetOtherCartDataTwo);
    this.getNowOrder(this.callbackGetNowOrder);
  }

  connectSocket = () => {          // (url, accessToken, subscribeTopics, callback, { fail, success } = {})  url socket地址  accessToken 凭证，不传则只能订阅公共主题 subscribeTopics 订阅主题组 callback 回调函数
    const { tableId ,openId} = this.state
    Taro.connectSocket({
      url:`${OTHERWEBSOCKET_IP}/websocket/person/message/${tableId}/${openId}`,
      success:()=>{
        this.setState({ socketIsSuccess: true }) 
        console.log("连接成功")
      },
      fail:()=>{
        this.setState({ socketIsSuccess: false })        
        console.log("连接失败")
      }
    }).then(task=>{
      task.onOpen(()=>{       
        console.log('onOpen');
        this.socket = task;
        task.send({ data: '["CONNECT\\naccept-version:1.1,1.0\\nheart-beat:10000,10000\\n\\n\\u0000"]' })
      })
      task.onMessage(msg=>{
        const data = JSON.parse(msg.data);
        console.log(data)
        const {code} = data;
        switch(code){
          case 'shopcart':{
            console.log("购物车数据")
            this.getShoppingCar(this.callbackGetOtherCartData);
            break;
          }
          case 'order':{
            console.log("请求订单信息")
            break;
          }
        }
      })
      task.onError(msg => {
        // this.setState({ socketIsSuccess: false });
        console.log('connect fail onError', msg)   
      })
      task.onClose(msg => {
        console.log('connect close', msg)   
      })
    })
  }

  closeSocket =()=>{
    const { socketIsSuccess } = this.state
    console.log('socketIsSuccess=>>>>>>>>>',socketIsSuccess)
    if (socketIsSuccess) {
      this.setState({
        socketIsSuccess:!socketIsSuccess,
      })
      if(this.socket){
        console.log(this.socket);
        this.socket.close();
      }
   
    } 
  }


  componentWillUnmount() {
    // this.closeSocket();
  }



   // 下拉刷新
   onPullDownRefresh() {
    // console.log("下拉刷新");
    //重新获取购物车数据
    // this.getOtherPlatformCart(this.callbackGetOtherCartDataTwo) ;

    
  }

  //得到弹窗次数
  getModalCount=()=>{
    return Taro.getStorageSync(getCacheName('scanIndex_modal'));
  }

  //设置弹窗次数
  setModalCount=(data)=>{
    Taro.setStorageSync(getCacheName('scanIndex_modal'), data);
  }


  //清除弹窗


  //  广告弹窗
  getAdModal =()=>{
    const {dispatch} = this.props;
    const userDetail = getUserDetail();
    //判断是否是我们这边的会员
    const {islandUserMemberDTO } = userDetail;    //有则为一个对象，无为'' 
    const {preId} = this.$router.params;
    dispatch({
      type: 'otherPlatform/popWindowAction',
      payload: {
        merchantId:preId
      },
      callback: ({ ok, data }) => {
        if (ok) {
          console.log(data);
          const{ adStatus} = data;
          let BannerDTO= {}
          if(adStatus == 1 ){
            BannerDTO = data.systemBannerDTO
          }else{
            BannerDTO={};
          }
          console.log('355=>>>>>>>>>>>>>>>',BannerDTO)
  
          if(objNotNull(BannerDTO)){
            const {showUserType} = BannerDTO;      //showUserType 0=>全部 ；1 => 会员 2=>非会员
            switch(showUserType){
              case 0:{                       //全部用户
                this.decidePop(userDetail,BannerDTO);
                break;
              } 
              case 1:{                   //我们这边的会员
                if(objNotNull(islandUserMemberDTO)){
                  this.decidePop(userDetail,BannerDTO);
                  break;
                }
              }
              case 2:{              //非会员
                if(!objNotNull(islandUserMemberDTO)){
                  this.decidePop(userDetail,BannerDTO);
                  break;
                }
              }            
            }


          }else{       //没有弹窗信息，退出
            return
          }

        }else{
          showLoading("网络错误")
        }
      }
    })
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


  //判断当次是否进行弹窗
  decidePop =(userDetail,BannerDTO)=>{
    const {platformSystemBannerPopSettingVM:[{cycleType,popNumber}]} = BannerDTO; 
    if (userDetail) {
      const lastModal = this.getModalCount();
      if(cycleType=='FIRST'){   
        if(lastModal){
          this.setState({
            indexModal: {}
          })
        }else{
          this.setModalCount({'time':new Date(),'count':1})
          this.setState({
            indexModal: BannerDTO
          })
        }
      }else if(cycleType=='EVERY'){
        if(lastModal){
          const { time,count} = lastModal;
          if(dayjs().diff(time, 'day')>=1){
            this.setModalCount({'time':new Date(),'count':popNumber-1})
            this.setState({
              indexModal: BannerDTO
            })
          }else{
            if(count>0){
              this.setModalCount({'time':time,'count':count-1})
              this.setState({
                indexModal: BannerDTO
              })
            }else{
              this.setModalCount({'time':time,'count':0})
              this.setState({
                indexModal:{}
              })
            }
          }    
        }else{
          this.setModalCount({'time':new Date(),'count':popNumber-1})
          this.setState({
            indexModal: BannerDTO
          })
        }
      }
      return
    }
    this.setState({
      indexModal: BannerDTO
    })
  }
  


  // 获取页面商品
  productDataInitialize = () => {
    const { enterpriseGuid} = this.state
    // console.log(this.state)
    showLoading();
    if (enterpriseGuid) {
      
      this.getOtherPlatformData(1) 
    } 
    this.getAdAndStore();

    

  }


  // 获取购物车信息
  getShoppingCar = callback => {
    const { dispatch } = this.props
    const {
      tableId, merchantId, uid, personNum, brandId, payType, enterpriseGuid, openId, wxtoken,
    } = this.state
    const { nickName, avatarUrl } = getUserInfo()
    if(enterpriseGuid){
      this.getOtherPlatformCart(callback)
    }
    
  }

  // 获取购物车 渲染已选商品
  shoppingCarInitialize = ({ recommend, common }) => {
    const{enterpriseGuid} = this.state
    this.setState({ recommend, common})
    if(enterpriseGuid){
      this.getShoppingCar(this.callbackGetOtherCartData)
    }
   
    
  }

  // 用户点击+或-显示商品分类下商品的购买数
  calculateBuyNum = ({ shoppingCar, catItem, clear }) => {
    const { subDishId } = this.state
    return catItem.map(goods => {
      const { shopDishSkus = [] } = goods
      return {
        ...goods,
        shopDishSkus: shopDishSkus.map(skus => {
          const { id } = skus
          const curDish = shoppingCar.find(({ productId }) => productId === id)
          if ((!shoppingCar.find(({ productId }) => productId === subDishId) && subDishId === id) || clear) {
            return {
              ...skus,
              chooseNumber: 0
            }
          }
          if (curDish) {
            return {
              ...skus,
              chooseNumber: curDish.number
            }
          }
          return skus
        })
      }
    })
  }

  // 打开/关闭购物车弹窗
  openCart = () => {
    const { cartVisible } = this.state
    this.setState({
      cartVisible: !cartVisible
    })
  }

  // 阻止事件冒泡/捕获
  preventEvent = e => {
    e.stopPropagation()
  }

  // 好友买单弹窗
  openFriendBuy = () => {
    const { friendBuyVisible } = this.state
    this.setState({
      friendBuyVisible: !friendBuyVisible
    })
  }

  // 去首页逛逛/去订单
  goPage = url => {
    this.closeSocket();
    if (url === 'home') {
      navToPage('/pages/index/index')
    } else {
      navToPage('/pages/scanningOrder/orderDetail/orderDetail')
    }
    this.setState({
      friendSettleVisible: false
    })
  }

  // 选择人数
  personChoose = num => {
    this.setState({
      personNumCopy: num
    })
  }

  // 打开/关闭选择弹窗
  closeChoose = val => {
    const {
      choosePersonVisible, personNumCopy, personNum,
      orderingInfo, userId, payType, newTable
    } = this.state
    const { masterUserId } = orderingInfo
    if (masterUserId != userId || payType === 1 || newTable === 'false') return
    if (val === 1) {
      this.setState({
        personNum: personNumCopy,
        choosePersonVisible: !choosePersonVisible
      })
    } else {
      this.setState({
        personNumCopy: personNum,
        choosePersonVisible: !choosePersonVisible
      })
    }
  }

  // 优惠弹窗
  openFavourable = () => {
    const { favourableVisible } = this.state
    this.setState({
      favourableVisible: !favourableVisible
    })
  }

  // 左侧点击分类函数
  categoryChange = e => {
    const { id } = e.currentTarget.dataset
    // this.linkageLocking = false
    this.setState({
      leftToView: CATEGORY_ANCHOR_PREFIX + id,
      rightToView: CONTEXT_ANCHOR_PREFIX + id,
      highlightCategoryId: id,
      linkageLocking: true
    })
  }

  // 右侧滚动函数
  onRightScroll = e => {
    // if (!this.linkageLocking) return
    const curScrollTop = e.currentTarget.scrollTop.toFixed(2) - 0
    const { highlightCategoryId, dishList, linkageLocking } = this.state
    if (linkageLocking) return
    const findIndex = (val, arr) => (arr.findIndex(el => el > val) - 1)
    let index = findIndex(parseInt(curScrollTop), this.categoryScrollHeight)
    if (index < 0) return
    index = index != -2 ? index : this.categoryScrollHeight.length - 1
    if (highlightCategoryId === dishList[index].id) return
    this.setState({
      highlightCategoryId: dishList[index].id,
      leftToView: CATEGORY_ANCHOR_PREFIX + dishList[index].id
    })
  }

  // 右侧滚动到底部
  onRightToLower = () => {
    const { dishList } = this.state
    this.setState({
      highlightCategoryId: dishList[dishList.length - 1].id
    })
  }

  // 右侧滚动到顶部
  onRightToUpper = () => {
    const { dishList } = this.state
    this.setState({
      highlightCategoryId: dishList[0].id
    })
  }

  // 计算销量
  formatSaleCount = item => {
    const saleArr = item && item.map(sku => {
      let { saleNum, initNum } = sku
      saleNum = saleNum || 0
      initNum = initNum || 0
      return saleNum + initNum
    })
    return saleArr && saleArr.length > 0 ? saleArr.reduce((a, b) => a + b) : 0
  }

  // 控制选中规格弹层关闭打开
  showSkuModalCtrl = item => {
    let stateObj = {
      showSkuModal: !this.state.showSkuModal,
      skuDish: {},
      currentSku: {},
      currentAttr: {},
    }

    //规格是否可以多选
    
    if (objNotNull(item)) {
      let temAtrr = {}
      if (item.shopDishAttributes && item.shopDishAttributes.length > 0) { // 商品属性显示数据结构拼装
        console.log('item.shopDishAttributes=>>>>>>>>>>',item.shopDishAttributes)
        const temArr = item.shopDishAttributes.filter(o => o.details.length > 0)
          .map(o => ({
            ...o,
            details: o.details.split(',')
          }))
          
        if (temArr && temArr.length > 0) { // 默认选中第一个属性中第一项
          temAtrr = temArr.reduce((acc, cur) => ({
            ...acc,
            /** 原本的属性*/
            [cur.id]: cur.details[0],    //当其为必选时(isRequired==1)，才为其设置一个默认选项 
            /** */

            /** 属性可以多选 */    
            // [cur.id]:{
            //   isRequired:cur.isRequired,
            //   isMultiChoice:cur.isMultiChoice,
            //   uckattrGuid:cur.uckattrGuid,         //用于提交商品的时候使用
            //   details:cur.uckArr.length>0?cur.uckAttrStr:(cur.isRequired ? [cur.details[0]]:[])                     //cur.isRequired ==1 ? [cur.details[0]]:[]
            //   }
            /** 属性可以多选 */   

          }), {})
          // temAtrr[temArr[0].id] = temArr[0].details[0]
        }
      }

      stateObj = {
        ...stateObj,
        skuDish: item,
        currentSku: (item.shopDishSkus && item.shopDishSkus.length >= 1 && item.shopDishSkus[0]) || {}, // 默认选中第一个规格
        currentAttr: temAtrr // 默认选中第一个属性中的第一项
      }
    }
    console.log('stateObj=>>>>>>>>>>>>>>>',stateObj)
    // console.log(stateObj)
    this.setState(stateObj)
    // this.props.onOpenMask();
  }

  _onSubDishCar = (type, item) => {
    const {enterpriseGuid,dishList,orderingInfo} = this.state;
    const{productInTrolleyDTO} = orderingInfo
    console.log('sub1=>>>>',item);
    
    if(enterpriseGuid){
      console.log('productInTrolleyDTO=>>>>>>',productInTrolleyDTO);
      // console.log('dishList=>>>',dishList)
      let productInfo;
      if(productInTrolleyDTO&&productInTrolleyDTO.length>0){
        productInfo = productInTrolleyDTO.filter((good)=>good.trueProductId==item.id)[0]
        console.log(productInfo)
      }
      this.setState({
        operate: -1,
        productList: productInfo,
        subDishId: productInfo.productId
      }, 
      () => {
        this.joinCartAction()
      })
    }else{
      const { shopDishSkus: [{ originalPrice, price }], minOrderCount } = item
      let cat = 1
      if (originalPrice && originalPrice - price > 0) {
        cat = 2
      }
      const productInfo = {
        cat,
        dishName: item.dishName,
        number: 1,
        price: item.shopDishSkus[0].price,
        productId: item.shopDishSkus[0].id,
        originalPrice: cat === 2 ? originalPrice : '',
        minCount: minOrderCount && minOrderCount > 0 ? minOrderCount && minOrderCount : 0,
        trueProductId: item.id
      }
      this.setState({
        operate: -1,
        productList: productInfo,
        subDishId: item.shopDishSkus[0].id
      }, 
      () => {
        this.joinCartAction()
      })
    }
    
  }

  // 添加商品到购物车
  onAddDishCar = (type, item) => {
    console.log('add1=>>>>>',item)  //itemGuid    id
    const {
      shopDishSkus: [{ originalPrice, price }],
      numLimitType, limitBuyNum, shopLimitType
    } = item
    let cat = 1
    if (originalPrice && originalPrice - price > 0) {
      cat = 2
    }
    const productInfo = {
      cat,
      dishName: item.dishName,
      number: item.minOrderCount && item.minOrderCount > 0 ? item.minOrderCount : 1,
      price: item.shopDishSkus[0].price,
      productId: item.shopDishSkus[0].id,
      spec: item.shopDishSkus[0].spec,
      originalPrice: cat === 2 ? originalPrice : '',
      trueProductId: item.id,
      numLimitType,
      limitBuyNum,
      shopLimitType,
      minCount: item.minOrderCount && item.minOrderCount > 0 ? item.minOrderCount : 0
    }
    this.setState({
      operate: 1,
      productList: productInfo
    }, () => {
      this.joinCartAction()
    })
  }

  onAddDishCarShopping = item => {
    this.setState({
      operate: 1,
      productList: item
    }, () => {
      this.joinCartAction()
    })
  }

  onSubDishCarShopping = item => {
    console.log('sub2=>>>>>',item)
    const { mustCondition, number } = item
    // const { skuDish } = this.state
    if (mustCondition === 1 || mustCondition === 2) {
      if (mustCondition === 1) {
        const { personNum } = this.state
        if (number === personNum) return
      }
      if (mustCondition === 2) {
        if (number === 1) return
      }
    }
    // item.minCount = skuDish.minOrderCount && skuDish.minOrderCount > 0 ? skuDish.minOrderCount && skuDish.minOrderCount : 0
    
    this.setState({
      operate: -1,
      productList: item,
      subDishId: item.productId
    }, () => {
      this.joinCartAction()
    })
  }

  swiperChange = e => {
    this.setState({
      currentSwiper: e.currentTarget.current,
      menuIsScroll: e.currentTarget.current === 1 || false
    })
  }

  // 选择规格
  onClickSku = item => {
    const { currentSku } = this.state
    let stateObj = { currentSku: {} }// 如果已经是选中状态,则取消选中
    // if (currentSku.id !== item.id) { //没有选中
    stateObj = { currentSku: item }
    // }
    this.setState({ ...stateObj })
  }

  // 属性选择
  onClickAtrr = (attr, item) => {
    const { currentAttr } = this.state
    // if (currentAttr[`${attr.id}`] && currentAttr[`${attr.id}`] === item) { // 如果已经是选中状态,则取消选中
    //   delete currentAttr[`${attr.id}`]
    // } else { // 没有选中
    //   currentAttr[`${attr.id}`] = item
    // }

    /**原本的属性选择 */
    currentAttr[`${attr.id}`] = item;
    this.setState({ ...currentAttr });
    /**原本的属性选择 */

    /**属性多选 */
    // console.log('744 currentAttr=>>>>>>>>>>>>',currentAttr)
    // const {isRequired,isMultiChoice,details}  =  currentAttr[`${attr.id}`];
    // if(isMultiChoice==1){            //可以多选
    //   const state = details.find((i)=>i==item);     //判断所属属性是否已经被选择
    //   if(state){  //已存在则删除
    //     const ind = details.indexOf(item)
    //     if(isRequired==1){          //必选则不能让details为空
    //       if(details.length==1) return;
    //       else if(details.length>1){
    //         details.splice(ind,1);
    //       }
    //     }else{
    //       details.splice(ind,1);
    //     }
    //   }else{
    //     details.push(item)
    //   }
    // }else{
    //   details.pop();
    //   details.push(item)
    // }

    // this.setState({
    //   ...currentAttr, 
    // })
    /**属性多选 */

  }

  // 加入购物车
  joinCartAction = () => {
    const {
      brandId, merchantId, tableId, uid,
      operate, dishList, subDishId, recommendDish,enterpriseGuid,otherPlatformData,wxtoken,  openId
    } = this.state
    const userDetail = getUserInfo();
    this.setState({
      userInfo: userDetail
    }, () => {
      showLoading('加载中', true)
      if(enterpriseGuid){
        // console.log('1058 operate=>>>>',operate)
        
        //将商品加入购物车 或者移除   operate =>>>  1:增加  -1：减少   100：清空购物车
        if(operate!=100){
          this.otherCartDataPlay(this.callbackOtherCartPlay) 
          //清空购物车
        }else{
          this.otherClearCart(this.callbackotherCartClear)
        }
      //原平台操作
      }
     
    })
  }

  //依据itemGuid 找到当前商品 （转为另一平台加入购物车数据的结构时使用） 
  byitemGuidFindItem = (productList,arr)=>{
    // console.log(arr);
    console.log('832=>>>>>>>>>>>',productList)
    if(arr.length > 0){
      const itemInfo =  arr.filter(item=>item.itemGuid==productList.trueProductId)[0];
    
      return addCartData(itemInfo,productList);
      // console.log(addCartData(itemInfo,productList));
    };

    //将需要加入购物车的数据的一些属性修改（uck）
    function addCartData(obj,which){  
      const newObj = JSON.parse(JSON.stringify(obj));
      updateSkuList(which.spec,newObj.skuList);
      updaattrGroupListtaA(which.attribute,newObj.attrGroupList);
      //修改成选择的规格  uck =1 表示该规格被选中
      function updateSkuList(spec,skuList){
          if(skuList.length>0){
              for(let i=0;i<skuList.length;i++){
                  if(skuList[i].name==spec){
                      skuList[i].uck =1;
                  }else{
                      skuList[i].uck =0;
                  }
              }
          }
      };
      //修改口味   uck = 1 , 表示顾客选择的该口味
      function updaattrGroupListtaA(attribute,attrGroupList){
          for(let key in attribute){   

            
              //id =>>> 属于哪一种属性（attrGroupGuid）
              if(attrGroupList.length>0){
                  for(let i=0;i<attrGroupList.length;i++){
                      if(key == attrGroupList[i].attrGroupGuid){
                          for(let j=0;j<attrGroupList[i].attrList.length;j++){

                              if(attrGroupList[i].attrList[j].name == attribute[key]){
                                  attrGroupList[i].attrList[j].uck = 1
                              }else{
                                  attrGroupList[i].attrList[j].uck = 0
                              }
                          }
                      }
                  }
              }
          }
      };
      return newObj;
    }
  }

  moveRightScroll = () => {
    this.setState({
      linkageLocking: false
    })
  }

  // 规格弹窗，加入购物车
  addSkuCar = () => {
    const {
      currentSku, skuDish, currentAttr, orderingInfo
    } = this.state
    const {
      originalPrice, price,
      numLimitType, limitBuyNum, shopLimitType
    } = currentSku
    let cat = 1
    if (originalPrice && originalPrice - price > 0) {
      cat = 2
    }
    const productInfo = {
      cat,
      dishName: skuDish.dishName,
      number: skuDish.minOrderCount && skuDish.minOrderCount > 0 ? skuDish.minOrderCount : 1,
      price: currentSku.price,
      productId: currentSku.id,
      spec: currentSku.spec,
      attribute: currentAttr,
      originalPrice: cat === 2 ? originalPrice : '',
      trueProductId: skuDish.id,
      numLimitType,
      limitBuyNum,
      shopLimitType,
      minCount: skuDish.minOrderCount && skuDish.minOrderCount > 0 ? skuDish.minOrderCount : 0
    };
    console.log(productInfo);
    this.setState({
      operate: 1,
      productList: productInfo,
      showSkuModal: false
    }, () => {
      this.joinCartAction()
    })
  }

  // 清空购物车
  clearShoppingCart = () => {
    Taro.showModal({
      title: '确认清空购物车',
      confirmColor: '#FBAB48',
      success: ({ confirm }) => {
        if (confirm) {
          this.setState({
            operate: 100,
            cartVisible: false
          }, () => {     
            this.joinCartAction() 
          })
        }
      }
    })
  }

  // 重新选取人数
  updatePeopleNum = () => {
    const { dispatch } = this.props
    const {
      merchantId, uid, tableId, personNumCopy,
      brandId
    } = this.state
    showLoading()
    dispatch({
      type: 'orderDishes/updatePeopleNumAction',
      payload: {
        merchant: merchantId,
        merchantTable: tableId,
        uid,
        peopleNum: personNumCopy,
        brandId
      },
      callback: ({ ok, data }) => {
        hideLoading()
        if (ok) {
          this.setState({
            personNum: personNumCopy,
            orderingInfo: data,
            choosePersonVisible: false
          })
        }
      }
    })
  }

  // 邀请好友点餐
  onShareAppMessage(res) {
    const {
      tableId, merchantId, personNum, brandId,
      tableInfo, uid, payType, tableName, newTable
    } = this.state
    return {
      title: '邀请点餐',
      path: `/package/multiStore/scanningIndex/scanningIndex?personNum=${personNum}&tableInfo=${JSON.stringify(tableInfo)}&merchantId=${merchantId}&tableId=${tableId}&brandId=${brandId}&payType=${payType}&tableName=${tableName}&newTable=${newTable}&uid=${uid}`
    }
  }

  // 立即下单
  buyNow = noLink => {
    const {
      allProduct, orderingInfo, brandId, currentMerchant, tableInfo,
      personNum, userId, uid, tableId, merchantId, showFinishBtn, payType, tableName, orderSn,enterpriseGuid,wxtoken,openId,peopleNum, memberInfoGuid
    } = this.state
    const {
      dispatch
    } = this.props
    const { masterUserId, productInTrolleyDTO } = orderingInfo
    if (masterUserId != userId && payType === 0) return
    if (productInTrolleyDTO.every(({ cat }) => cat === 3)) {
      showToast('请添加商品')
      return
    }
    this.setState({
      cartVisible: false
    })
    showLoading();

    if(enterpriseGuid){
      //提交购物车
      dispatch({
        type:'otherPlatform/otherSubmitCartAction',
        payload:{
          headerMessage:{
            enterpriseGuid,
            wxtoken,
            openId,
          },
          otherPlatform:true,
        },
        callback:(ok,data)=>{
          hideLoading()
        }
      }) ;


    }
  
    let productOrder = {
      allProduct,
      orderingInfo,
      currentMerchant,
      brandId,
      tableInfo: {
        ...tableInfo,
        peopleNum: personNum
      },
      payType,
      enterpriseGuid
    }
    this.$preload(productOrder)
    if (noLink) {
      this.setState({
        showFinishBtn: !showFinishBtn
      })
      return
    }
    if(enterpriseGuid){    //判断属于哪一个平台 
      this.closeSocket();
      if (payType === 0) {
        navToPage('/package/otherScanOrder/scanningConfirm/scanningConfirm')
      } else {
        // console.log('productOrder',productOrder);
        const {orderSnState:orderSn}  = this.state;


        navToPage(`/package/otherScanOrder/scanningHistory/scanningHistory?merchantId=${merchantId}&enterpriseGuid=${enterpriseGuid}&wxtoken=${wxtoken}&openId=${openId}&peopleNum=${peopleNum}&memberInfoGuid=${memberInfoGuid}&orderSn=${orderSn}&brandId=${brandId}`)
      }
    }
   
  }

  // 好友选好了
  orderOver = () => {
    this.setState({
      operate: 2,
      cartVisible: false,
      orderOverStatus: true
    }, () => {
      this.joinCartAction()
    })
  }

  // 回到首页
  goHome = () => {
    Taro.reLaunch({ url: '/pages/index/index' })
  }

  
  

  // 查看订单详情
  goOrderDetail = () => {
    const { orderingInfo: { orderSn } } = this.state;
    this.closeSocket();
    navToPage(`/package/otherScanOrder/scanningOrder/scanningOrder?orderSn=${orderSn}`)
  }


  //判断是否是会员
  ismember = (callback)=>{
    console.log(this.$router.params)
    const{ enterpriseGuid,openId,wxtoken,phone} = this.$router.params;
    const {dispatch} = this.props;
  
    dispatch({
      type:'otherPlatform/otherMemberMesAction',
      payload:{
        headerMessage:{
          openId,
          wxtoken,
          enterpriseGuid,
        },
        otherdata:{   
          enterpriseGuid,
          phoneNumOrOpenid:phone
        },
        otherPlatform:true,
      },
      callback

    })
  }

  //判断是否是会员之后的回调
  callbackIsMember = ({ok,data})=>{
    if(ok  && data.code == 0){
      if(data.tdata && data.tdata.memberInfoGuid){
        //判断是会员之后请求会员卡
        // this.getMemberCardList(this.callbackGetMemberCardList,data.tdata.memberInfoGuid)
        this.setState({
          isMember: true,
          memberInfoGuid: data.tdata.memberInfoGuid
        })
      }
    }
  }
  


  //另一平台购物车数据转换为orderingInfo
  translateToOrderingInfo = (productInTrolleyDTO,price,state) =>{
    const newOrderingInfo = {
        createTime: null,
        fee: null,     //桌台费
        feeStatus: 0,    //是否有桌台费
        fullReducePrice: null,
        limitPeopleNum: "1-10",
        masterUserId: null,
        orderSn: this.state.orderSnState,         //订单号
        payType: 1,
        people: null,
        peopleNum: this.state.peopleNum,
        platFormId: null,
        productInTrolleyDTO: productInTrolleyDTO,
        reducePrice: null,
        shopFullReductionActivityDTO: null,
        status: 0,
        tableId: this.state.tableId,
        totalAmount: price   , //countTotalAmount(productInTrolleyDTO)?countTotalAmount(productInTrolleyDTO):0,
        totalFee: 0,
        uid: null,
        enablePreferentialPrice:state,
    }

    function countTotalAmount(goods){     //计算购物车商品总价
        let totalPrice = 0;
        if(goods.length>0){
            for(let i=0;i<goods.length;i++){
                totalPrice += goods[i].number * goods[i].price
            }
        }
        return totalPrice
    }
    return newOrderingInfo
  }

  //请求另一平台商品数据
  getOtherPlatformData = wxPermission =>{
    const { enterpriseGuid ,openId,wxtoken} = this.state
    const {dispatch}   =this.props;
    dispatch({
      type:'otherPlatform/getOtherPlatformGoodsAction',
      payload:{
        headerMessage:{
          enterpriseGuid,
          wxtoken,
          openId
        },
        otherdata:{
          wxPermission
        },
        otherPlatform : true,  
      },
      callback: ({ ok, data }) => {
        hideLoading();
        if(ok && data.code == 0){
          const shopDishProductCats = [];
          let translateData = ourRenderData(data.tdata);
          const{cardList} = data.tdata
          this.translateCartList(cardList);
          this.setState({
            otherPlatformData:data.tdata      //请求返回的数据
          })
          //请求购物车数据
          this.shoppingCarInitialize({
            recommend: shopDishProductCats,
            common : translateData// this.translateGoods(data.tdata)
          })
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
  }

  //获取另一平台数据后的回调
  callbackGetOtherGoodData = ({ok,data})=>{
  
    
  }

  //请求广告、门店数据
  getAdAndStore= ()=>{
    const{dispatch} = this.props;
    const{merchantId,preId} = this.state;
        // 获取门店信息
    dispatch({
      type: 'orderDishes/getMerchantInfoAction',
      payload: { platformId: getPlatFormId() },
      callback: ({ ok, data }) => {
        if (ok) {
          const curMerchant = data.find(({ thirdNo }) => thirdNo == merchantId)
          const { shopHours, businessHours } = curMerchant
          const week = new Date().getDay()
          const timer = shopHours.split(',')
            .some(ele => {
              const [beginTime, endTime] = ele.split('-')
              return timeIsRange(beginTime, endTime)
            })
          if (!typeAnd(businessHours, MERHCANT_WEEK[week].value) || !timer || curMerchant.status === 0 || curMerchant.status === 2) {
            this.setState({
              showPromptVisible: PROMPT.REST
            })
          }
          const businessWeek = MERHCANT_WEEK.filter(ele => typeAnd(businessHours, ele.value))
          this.setState({
            businessWeek,
            currentMerchant: curMerchant
          })
        }
      }
    })
    // 获取广告位
    dispatch({
      type: 'orderDishes/getMerchantDetailAction',
      payload: {
        merchantId:preId,
        platformId: getPlatFormId()
      },
      callback: ({ ok, data }) => {
        if (ok) {
          const {
            merchantDTO: {
              platFormMerchantDTO: { merchantScanCodePropagandaPic }
            }
          } = data
          this.setState({
            ad: merchantScanCodePropagandaPic
          })
        }
      }
    })
  }

  //从另一平台的数据中拿出cardList
  translateCartList = (data)=>{
    const alreadyStoredCards = data;
    const selectedCard = data.filter(item =>item.uck==1);
    
    const i=alreadyStoredCards.findIndex(item=>item.uck==1);
    // this.selectMemberCard(selectedCard[0])
    const a = alreadyStoredCards[i];
    alreadyStoredCards[i] = alreadyStoredCards[0];
    alreadyStoredCards[0] = a;
    //将选择的卡放到最前列
    this.setState({
      alreadyStoredCards,
      selectedCard:selectedCard[0]
    },()=>{
      console.log('1835 setSelectedCard=>>>>',selectedCard)
    })
  }

  //请求另一平台购物车数据
  getOtherPlatformCart = (callback) =>{
    const{dispatch} = this.props;
    const { enterpriseGuid ,openId,wxtoken} = this.state
    dispatch({
      type:'otherPlatform/getOtherPlatformCartcontent',
      payload:{
        headerMessage:{
          enterpriseGuid,
          openId,
          wxtoken,
        },
        otherdata:{ },
        otherPlatform:true,
      },
      callback,
    }) 
  }

  //另一平台请求购物车数据回调()  <未进行增删操作>
  callbackGetOtherCartData = ({ok,data})=>{

    const { recommend, common} = this.state;
    let theItemInfoDTOS
    if(ok&&data.code==0){
      theItemInfoDTOS = data.tdata.itemInfoDTOS?data.tdata.itemInfoDTOS:[]; 
    }else{
      theItemInfoDTOS = [];
      return 
    }  
    const{enablePreferentialPrice,originPrice,preferentialPrice} = data.tdata
    const productInTrolleyDTO = shopCartGoodsList(theItemInfoDTOS)

    const thePrice = enablePreferentialPrice?preferentialPrice:originPrice;


    const newOrdeingInfo = this.translateToOrderingInfo(productInTrolleyDTO,thePrice,enablePreferentialPrice);
    const {limitPeopleNum} = newOrdeingInfo;
    // 渲染推荐商品
    const newRecommend = this.calculateBuyNum({
      shoppingCar:productInTrolleyDTO || [], //productInTrolleyDTO || [],
      catItem: recommend
    })
    const newCommon = common.map(ele => ({
      ...ele,
      shopDishProductCats: this.calculateBuyNum({
        shoppingCar: productInTrolleyDTO || [],
        catItem: ele.shopDishProductCats
      })
    }))
      .filter(({ catType }) => catType !== 1)
    const tableList = []
    const [start, end] = limitPeopleNum.split('-')
    for (let i = 0; i <= end - 0; i++) {
      if (start - 0 <= i) {
        tableList.push(i)
      }
    }
    this.setState({
      personList: tableList,
      recommendDish: newRecommend,
      dishList: newCommon,
      orderingInfo:newOrdeingInfo,
      allProduct: common
    }, () => {
      // 根据当前设备计算左右滚动区域高度
      const {
        dishList, pageUpperContentHeight
      } = this.state
      Taro.getSystemInfo({
        success: res => {
          if (res.errMsg === 'getSystemInfo:ok') {
            const percent = res.windowWidth / 750 // 当前设备1rpx对应的px值
            const shoppingCart = (SHOPPING_CART * percent).toFixed(2) - 0
            dishList.map(o => {
              const query = Taro.createSelectorQuery()
                .in(this.$scope)
              query.select(`#${CONTEXT_ANCHOR_PREFIX + o.id}`)
                .boundingClientRect(res => {
                  this.categoryScrollHeight.push(parseInt(res.top) - pageUpperContentHeight)
                })
                .exec()
            })
            this.setState({
              windowScrollHeight: parseInt(res.windowHeight),
              highlightCategoryId: dishList[0].id
            })
          }
        }
      })
    })
  }

  //另一平台在购物车增删请求后，再次请求购物车数据(getOtherPlatformCart)后的回调参数
  callbackGetOtherCartDataTwo = ({ok,data})=>{
    hideLoading()
    const { operate, dishList, recommendDish} = this.state
    if(ok&&data.code == 0){
      const{enablePreferentialPrice,originPrice,preferentialPrice} = data.tdata  
      const productInTrolleyDTO = shopCartGoodsList(data.tdata.itemInfoDTOS)//将对面数据的形式，转化为我们这边的
      // console.log("1927  productInTrolleyDTO=>>>>>",productInTrolleyDTO);
      const thePrice = enablePreferentialPrice?preferentialPrice:originPrice
      const newOrderingInfo = this.translateToOrderingInfo(productInTrolleyDTO,thePrice,enablePreferentialPrice);
      // console.log(" 1930 newOrderingInfo=>>>",newOrderingInfo);
      const newRecommend = this.calculateBuyNum({
        shoppingCar: productInTrolleyDTO || [],
        catItem: recommendDish,
      })
      const newCommon = dishList.map(ele => ({
        ...ele,
        shopDishProductCats: this.calculateBuyNum({
          shoppingCar: productInTrolleyDTO || [],
          catItem: ele.shopDishProductCats,
          clear: operate === 100
        })
      }))
        .filter(({ catType }) => catType !== 1)
      this.setState({
        recommendDish: newRecommend,
        dishList: newCommon,
        subDishId: null,
        orderingInfo: newOrderingInfo
      })
      
    }else{
      showToast(data.message)
    }  
  }

  //购物车数据的增、删处理
  otherCartDataPlay = (callback) =>{
    const {productList, operate,enterpriseGuid,otherPlatformData,wxtoken, openId} = this.state
     //将商品加入购物车 或者移除   operate =>>>  1:增加  -1：减少   100：清空购物车
     const{dispatch} = this.props;
     const itemInfoDTO = this.byitemGuidFindItem(productList,otherPlatformData.itemInfoDTOS);
     dispatch({
       type: 'otherPlatform/otherPlatformJoinCartAction',
       payload:{
         headerMessage:{
           enterpriseGuid,
           openId,
           wxtoken,
           'Content-Type':'application/json',
         },
         otherdata:{
           "changeType": true,
           itemInfoDTO,
           "modifyNum": operate,        //增加或者减少商品  1=>>>增加    -1=>>>减少
         },
         otherPlatform:true,
       },
       callback
     })
   
  }


  //购物车进行增删处理后   再次请求购物车数据的 的回调
  callbackOtherCartPlay = ({ok,data}) =>{
    console.log('1963 购物车操作=>>>>',data)
    if(ok&&data.code == 0){
      //从后台取得购物车数据
      console.log("请求数据")
      this.getOtherPlatformCart(this.callbackGetOtherCartDataTwo)  
    }else{
      hideLoading()
      showToast(data.message)
    }
  }


  //清空购物车
  otherClearCart = (callback) =>{
    const { enterpriseGuid, wxtoken, openId} = this.state
    console.log("清空购物车")
    this.props.dispatch({
      type: 'otherPlatform/clearCartContentAction',
      payload:{
        headerMessage: { enterpriseGuid, openId, wxtoken},
        otherdata: {},
        otherPlatform: true,
      },
      callback
    })
  }

  //清空购物车后的回调
  callbackotherCartClear = ({ok,data})=>{
    if(ok&&data.code==0){ 
      this.getOtherPlatformCart(this.callbackGetOtherCartDataTwo)  
      hideLoading();
    } 
  }

  //memberlist
  openMemberCardList = () => {
    const { cardVisble, alreadyStoredCards } = this.state;
    if (alreadyStoredCards.length > 0) {
      this.setState({
        cardVisble: !cardVisble
      })
    } else {
      showToast('暂无会员卡哦')
    }
  }

 

  //selectMemberCard 选中会员卡操作
  selectMemberCard = (item) =>{
    console.log("carditem=>>>>",item)
    this.setState({
      selectedCard: item,
    })
  }

  //是会员时，添加划去原价的的classname
  addClassnameA = (state)=>{    //state =>>enablePreferentialPrice
    const {enterpriseGuid} = this.state;
    if(enterpriseGuid&&state){
      return 'availableMerber price' 
    }else{
      return 'price'
    }
  }

  changeCardVisible = () => {
    const { cardVisble } = this.state
    this.setState({
      cardVisble: !cardVisble
    })
  }

  //判断是否存在未完成订单
  getNowOrder= (callback)=>{
    const {enterpriseGuid, openId, wxtoken} = this.state
    // const {enterpriseGuid, openId, wxtoken,brandId,merchantId,tableId,phone} = this.$router.params
    if(enterpriseGuid){
      this.props.dispatch({
        type:'otherPlatform/getOtherPlatOrdersAction',
          payload:{
            headerMessage:{
              enterpriseGuid,
              openId,
              wxtoken,
            },
            otherdata:{ },
            otherPlatform:true,
          },
          callback,
      })
    }
  
  }

  //存在订单信息回调
  callbackGetNowOrder = ({ok,data})=>{
    if(ok&&data.code == 0){
      console.log('230=>>>>',data);    //state =>>>>   0:待确认，1待支付，2:已完成，3:已取消    
      if(data.tdata.length>0){
        const unpayOrder = data.tdata.filter((item)=> item.state ==1||item.state ==0 );   //得到未支付订单
        // console.log("236 unpayOrder=>>>>",unpayOrder)
        
        if(unpayOrder.length>0){    //length > 0 说明存在未支付订单
          const {guid:orderSn} = unpayOrder[0]  
          this.setState( { orderSn})
        }else{
          this.setState({
            orderSn:null
          })
          return 
        }
      }
    }
  }

  //购物车商品数量
  shopCartGoodsNum =(arr)=>{
    let count = 0;
    if(arr.length>0){
      for(let i=0;i<arr.length;i++){
        count+=arr[i].number
      }
    }
    return count
  }


    // 显示商品详情
  showDetail = value => {
    // this.props.onSwiperToUnder()
    this.setState({
      detailModal: true,
      dishInfo: value
    })
  }

  // 关闭商品详情
  closeDetail = () => {
    this.setState({
      detailModal: false
    })
  }


  render() {
    const {
      windowHeight, pageUpperContentHeight, cartVisible, friendBuyVisible, friendSettleVisible, personList,
      personNum, choosePersonVisible, merchantInfoHeight, favourableVisible, tableInfo,
      windowScrollHeight, leftToView, dishList, currentCar, highlightCategoryId, showSkuModal, skuDish, currentMerchant,
      currentSku, currentAttr, currentSwiper, menuIsScroll, rightToView, personNumCopy, orderingInfo, fullReduction = [],
      recommendDish = [], partnerPrompt, userId, orderOverStatus, ad, orderSn, shoppingCarStatus, merchantId, brandId,
      socketIsSuccess, showFinishBtn, payType, enterpriseGuid, openId, wxtoken, memberInfoGuid, cardVisble, alreadyStoredCards, selectedCard,preBrandId,preId,detailModal,
      dishInfo,indexModal
    } = this.state
    const { effects } = this.props;
    const infoCar = currentCar && currentCar[`${dishInfo.id}_0_0`] || null
    // 选择规格数据
    const skus = (skuDish.shopDishSkus && skuDish.shopDishSkus.length > 1 && skuDish.shopDishSkus.filter(o => o.stock > 0)) || []
    let attrs = skuDish.shopDishAttributes || []
    if (attrs.length > 0) { // 属性
    
      attrs = attrs.filter(o => o.details.length > 0)
        .map(o => ({
          ...o,
          details: o.details.split(',')
        }))
    }
    // console.log('skuDish', skuDish)
    // console.log("skus", skus);
    // console.log("attrs", attrs);
    let skuPrices = 0
    if (objNotNull(skuDish) && skuDish.shopDishSkus) {
      skuPrices = skuDish && Math.min(...skuDish.shopDishSkus.map(a => Number(a.price))) // 规格显示的是最小价格
    }
    // 显示规格和属性描述
    let skuAndAtrrText = ''
    const skuAndAtrr = []

    if (objNotNull(currentSku) && currentSku.spec) { // 规格
      skuAndAtrr.push(currentSku.spec)
    }
    if (objNotNull(currentAttr)) { // 属性

      /**属性多选 */
      // let changeCurrentAttr = {}
      // Object.entries(currentAttr).map(([key,value])=>{
      //   changeCurrentAttr[key] = value.details;
      // })
      // console.log(changeCurrentAttr);
      // skuAndAtrr.push(...imitateObjectValues(changeCurrentAttr))
      /**属性多选 */

      /**原本的属性选择 */
      skuAndAtrr.push(...imitateObjectValues(currentAttr))
      /**原本的属性选择 */
    }
    skuAndAtrrText = skuAndAtrr.length > 0 ? `（${skuAndAtrr.join('，')}）` : ''

    // 添加sku商品到购物车按钮可用条件
    const addSkuBtnUsable = (objNotNull(skuDish) && (objNotNull(currentAttr) || objNotNull(currentSku)))

    const {
      productInTrolleyDTO = [], totalAmount, reducePrice, people,
      masterUserId, totalFee, feeStatus, status
    } = orderingInfo
    const peopleAry = imitateObjectValues(people || {})
      .filter(({ id }) => id !== Number(getAuthenticate().userId))
    const finishPeople = peopleAry.reduce((arr, { status }) => (!status ? ++arr : arr), 0)
    const requiredProduct = (productInTrolleyDTO && productInTrolleyDTO.length > 0) ? productInTrolleyDTO.filter(({ cat }) => cat === 3) : []
    const product = (productInTrolleyDTO && productInTrolleyDTO.length > 0) ? productInTrolleyDTO.filter(({ cat }) => cat !== 3) : [];
    // console.log('2177requiredProduct=>>>>>>>>>>>>>',requiredProduct)
    // console.log('product',product);

    /*
    * 判断是否参与满减活动
    * 一. 满减活动不包含优惠商品时(isDiscounts = 0), 并且购物车中没有优惠商品(cat !== 2). 计算再买XX,减XX
    * 二. 满减活动包含优惠商品(isDiscounts = 1), 直接计算再买XX,减XX
    *
    * nextFull: 下一级满减活动
    * mustPrice: 必选商品金额
    * */
    let nextFull
    let fullPrice
    const isDiscounts = fullReduction.length > 0 && fullReduction.find(({ type }) => type === 0 || type === 1).type
    if ((isDiscounts === 0 && productInTrolleyDTO.every(({ cat }) => cat !== 2)) || (isDiscounts === 1)) {
      const mustPrice = productInTrolleyDTO.reduce((acc, { cat, price, number }) => acc + (cat === 3 ? price * number : 0), 0)
      fullPrice = totalAmount - mustPrice
      if (isDiscounts === 1) {
        fullPrice -= productInTrolleyDTO.reduce((acc, {
          cat, price, number, originalPrice
        }) => acc + (cat === 2 ? (originalPrice - price) * number : 0), 0)
      }
      nextFull = fullReduction.find(({ limit }) => fullPrice < limit)
    }
    return (
      <View className="scanningBox">
        {
          shoppingCarStatus && (
            <View className="statusMark flex-col flex-ac">
              {/* <IconFont value={SHOPPING_CAR_STATUS[shoppingCarStatus].icon} h={180} w={240} /> */}
              <Text className="title">{SHOPPING_CAR_STATUS[shoppingCarStatus].title}</Text>
              <View className="operate flex-row flex-ac flex-sa">
                <View onClick={() => Taro.navigateBack()}>退出</View>
              </View>
            </View>
          )
        }
        {
          (effects['orderDishes/getProductAction'] || !socketIsSuccess) && (
            <View style={{ zIndex: 999 }}>
              <PageLoading />
            </View>
          )
        }
        <View id="pageUpperContent">
          <View id="merchantInfo">
            <View className="flex-row flex-ac flex-sb">
              <View
                className="merchantName"
                onClick={() => {
                  this.closeSocket();
                  navToPage(`/package/multiStore/merchantDetail/merchantDetail?id=${preId}&brandId=${preBrandId}`)
                }}
              >
                <Image className="merchantIcon" src={getServerPic(tableInfo.headImgUrl)} />
                <Text>{tableInfo.merchantName}</Text>
                <AtIcon className="arrowIcon" value="chevron-right" size="20" color="#999" />
              </View>
              {
                payType === 0 && peopleAry && peopleAry.length && userId == masterUserId && showFinishBtn && (<View className="finishOrdering" onClick={() => this.buyNow(true)}>
                  结束好友点餐
                </View>)
              }
              {enterpriseGuid&&alreadyStoredCards.length>0?
                  (<View className='memberCardBox' onClick={this.openMemberCardList.bind(this)}>

                        <Image src={`${STATIC_IMG_URL}/icon/scan_vip.png`} className="orderIcon memberIcon" />
                        <Text>{selectedCard.cardName}</Text>
                        <Text className="at-icon at-icon-chevron-right arrowIcon"></Text>
                    </View>)
                    :
                    ( payType === 1 && orderingInfo.orderSn  &&
                      (<Image 
                        src={`${STATIC_IMG_URL}/icon/order_detail.png`} 
                        className="orderIcon"
                        onClick={() => {
                          let tableInfoOther = tableInfo
                          tableInfoOther.peopleNum = personNum
                          this.$preload({
                            tableInfo: tableInfoOther,
                            currentMerchant,
                            fromPage: 'index'
                          })
                          this.closeSocket();
                          navToPage(`/package/multiStore/scanOrderDetail/scanOrderDetail?merchantId=${merchantId}&orderSn=${orderingInfo.orderSn}&payType=${payType}`)
                        }}
                      />
                    ))
               
              }
            </View>
            <View className="merchantTableBox">
              <View className="merchantTable flex-row flex-ac">
                <View className="merchantTableItem">点餐</View>
                <View className="merchantTableItem">
                  桌号:
                  {tableInfo.tableName}
                </View>
                <View className="flex-row flex-ac" onClick={this.closeChoose}>
                  <Text className="person">
                    {personNum}
                    人
                  </Text>
                  <IconFont value="imgTreasuryArrow" h={22} w={13} mr={10} />
                </View>
              </View>
              {/* {!enterpriseGuid&&(
                <Button
                  className="inviteFriend"
                  openType="share"
                >
                  邀请好友点餐
                </Button>
              )

              } */}
              {!enterpriseGuid
                ?<Button className="inviteFriend" openType="share" > 邀请好友点餐 </Button>
                :( payType === 1 && (
                  <View className="orderBox">
                    <Image 
                      src={`${STATIC_IMG_URL}/icon/order_detail.png`} 
                      className="orderIcon"
                      onClick={() => {
                        if(orderSn){
                          let tableInfoOther = tableInfo
                          tableInfoOther.peopleNum = personNum
                          this.$preload({
                            tableInfo: tableInfoOther,
                            currentMerchant,
                            fromPage: 'index'
                          })
                          
                          if(enterpriseGuid){
                            this.closeSocket();
                            navToPage(`/package/otherScanOrder/scanOrderDetail/scanOrderDetail?merchantId=${merchantId}&orderSn=${orderSn}&payType=${payType}&enterpriseGuid=${enterpriseGuid}&openId=${openId}&wxtoken=${wxtoken}&memberInfoGuid=${memberInfoGuid}&brandId=${brandId}`)
                          }else{
                            navToPage(`/package/multiStore/scanOrderDetail/scanOrderDetail?merchantId=${merchantId}&orderSn=${orderingInfo.orderSn}&payType=${payType}`)
                          }
                        }else{
                          showToast("暂无未完成订单信息")
                        }
                    
                      }}
                    />
                    {
                      orderSn?<View className="orderState"></View>:null
                    }
                    
                  </View>
                
                ))
                
              }
              
              {/* <View className="finishFriend">结束好友点餐</View> */}
            </View>
            {
              peopleAry && peopleAry.length && (
                <View className="friendBox">
                  <View className="friendLeft">
                    <View className="friendHead">
                      {
                        peopleAry.map(ele => {
                          const { id, headImageUrl } = ele
                          return (
                            <Image
                              className="friendHeadItem"
                              src={getServerPic(headImageUrl)}
                              key={id}
                            />
                          )
                        })
                      }
                    </View>
                    <Text>好友一起点餐中~</Text>
                  </View>
                  {
                    payType === 0 && finishPeople && (<View>{`${finishPeople}人已点完`}</View>)
                  }
                </View>
              )
            }
            {
              // orderingInfo.people && orderingInfo.people !== null && orderingInfo.people.length > 0 && (
              //
              // )
            }
            {
              ad && (
                <View className="merchantAdvertisement">
                  <Image
                    className="adImage"
                    mode="aspectFill"
                    src={getServerPic(ad)}
                  />
                </View>
              )
            }
          </View>
          {
            fullReduction.length > 0 && (
              <View className="merchantFavourableBox">
                <View className="merchantFavourable">
                  {
                    fullReduction && fullReduction.map(ele => {
                      const { id, limit, reduce } = ele
                      return (
                        <View className="merchantFavourableItem" key={id}>
                          {`满${limit}减${reduce}`}
                        </View>
                      )
                    })
                  }
                </View>
                <View onClick={this.openFavourable} className="flex-sk">
                  {`${fullReduction.length}个优惠`}
                  <AtIcon value="chevron-down" size="12" color="#999" />
                </View>
              </View>
            )
          }
          <View className="limitedTime">
            <View className="limitedTitle">商家推荐</View>
            <ScrollView
              scrollX
              scrollWithAnimation
              className="scrollView"
            >
              {
                recommendDish.map(ele => {
                  const {
                    dishImageUrl = '', dishName, shopDishAttributes,
                    shopDishSkus, id
                  } = ele
                  const validAttrs = shopDishAttributes.length > 0 && shopDishAttributes.filter(a => a.details.length > 1)
                  const curChooseNumber = shopDishSkus.reduce((acc, { chooseNumber }) => acc + chooseNumber, 0)
                  const dishImage = dishImageUrl.split(',')[0]
                  let canBuy = false
                  if (shopDishSkus.length > 0 && (Math.max(...shopDishSkus.map(a => Number(a.stock))) > 0)) {
                    canBuy = true
                  }
                  return (
                    <View className="limitedProduct" key={id}>
                      <View className="limitedProductTop">
                        <Image src={getServerPic(dishImage)} />
                      </View>
                      <View className="limitedProductDown">
                        <View className="limitedProductName">{dishName}</View>
                        <View
                          className="limitedSaleNum"
                        >
                          月销量：
                          {this.formatSaleCount(shopDishSkus)}
                        </View>
                        <View className="limitedMoneyBox">
                          <View className="limitedMoneyLeft">
                            <Text>￥</Text>
                            <Text>{shopDishSkus[0].price}</Text>
                            <Text
                              style={{ textDecoration: 'line-through' }}
                            >
                              {shopDishSkus[0].originalPrice > 0 ? `￥${shopDishSkus[0].originalPrice}` : ''}
                            </Text>
                          </View>
                          <View className="limitedAddBox">
                            {
                              !canBuy
                                ? <View className="sale-out">已售罄</View>
                                : (ele.shopDishSkus.length > 1 || (validAttrs && validAttrs.length > 0))
                                  ? (
                                    <Button
                                      className="chose-sku"
                                      hoverClass="hover"
                                      onClick={this.showSkuModalCtrl.bind(this, ele)}
                                      disabled={!canBuy}
                                    >
                                    选规格
                                    </Button>
                                  )
                                  : (
                                    <View className="addAndSub">
                                      {
                                      curChooseNumber > 0 && (
                                        <Block>
                                          <Button
                                            className="btn cut"
                                            hoverClass="hover"
                                            hoverStartTime={10}
                                            hoverStayTime={100}
                                            onClick={this._onSubDishCar.bind(this, {}, ele)}
                                          >
                                            -
                                          </Button>
                                          <View
                                            className="part"
                                          >
                                            {curChooseNumber || 0}
                                          </View>
                                        </Block>
                                      )
                                    }

                                      <Button
                                        className="btn add"
                                        hoverClass="hover"
                                        hoverStartTime={10}
                                        hoverStayTime={100}
                                        onClick={this.onAddDishCar.bind(this, {}, ele)}
                                        disabled={!canBuy}
                                      >
                                      +
                                      </Button>
                                    </View>
                                  )
                            }
                          </View>
                        </View>
                        {
                          ele.minOrderCount && ele.minOrderCount > 0 && <View className="minCount">{`${ele.minOrderCount}件起购`}</View>
                        }
                      </View>
                    </View>
                  )
                })
              }
            </ScrollView>
          </View>
        </View>
        <View style={{ display: 'flex' }}>
          <ScrollView
            className="scrollViewLeft"
            scrollY
            style={{
              height: `${windowScrollHeight}px`,
              background: '#F7F7F7'
            }}
            scroll-with-animation
            scrollIntoView={leftToView}
          >
            {
              dishList && dishList.length > 0 && dishList.map(o => (o.saleType === DISH_HOT || o.saleType === DISH_OFFER
                ? (
                  <View
                    key={o.id}
                    className={`flex-row flex-ac specialCategory ${o.saleType === DISH_HOT ? 'catHot' : null} ${o.saleType === DISH_OFFER ? 'catOffer' : null} ${o.id === highlightCategoryId ? 'specialActive' : 'specialInactive'}`}
                    onClick={this.categoryChange.bind(this)}
                    data-id={o.id}
                    id={CATEGORY_ANCHOR_PREFIX + o.id}
                  >
                    <span>{o.name}</span>
                  </View>
                )
                : (
                  <View
                    key={o.id}
                    className={`category ${o.id === highlightCategoryId ? 'active' : 'inactive'}`}
                    onClick={this.categoryChange.bind(this)}
                    data-id={o.id}
                    id={CATEGORY_ANCHOR_PREFIX + o.id}
                  >
                    {o.name}
                  </View>
                )))
            }
          </ScrollView>

          <ScrollView
            className="scrollViewRight"
            scrollY
            style={{ height: `${windowScrollHeight}px` }}
            scrollIntoView={rightToView}
            onScroll={this.onRightScroll}
            onScrollToLower={this.onRightToLower}
            onScrollToUpper={this.onRightToUpper}
            scroll-with-animation
            onTouchStart={this.moveRightScroll}
          >
            {
              dishList && dishList.length > 0 && dishList.map(o =>
                // const temAttrs = o.shopDishAttributes;
                // const validAttrs = temAttrs.length > 0 && temAttrs.filter(a => a.details.length > 1);
                (
                  <View key={o.id} style={{ position: 'relative' }}>
                    <Text id={CONTEXT_ANCHOR_PREFIX + o.id} />
                    <View className="categoryTitle">{o.name}</View>
                    {
                      o.shopDishProductCats && o.shopDishProductCats.length > 0 && o.shopDishProductCats.map(ele => {
                        const {
                          shopDishSkus = [], limitBuyNum, numLimitType, shopLimitType
                        } = ele
                        const curChooseNumber = shopDishSkus.reduce((acc, { chooseNumber }) => acc + chooseNumber, 0)
                        // ele.chooseNumber = 0;
                        // const temCar = currentCar && currentCar[`${ele.id}_0_0`] || null;
                        // 有效属性
                        const temAttrs = ele.shopDishAttributes
                        const validAttrs = temAttrs.length > 0 && temAttrs.filter(a => a.details.length > 1)
                        // 判断是否可以购买
                        let canBuy = false
                        if (ele.shopDishSkus.length > 0 && (Math.max(...ele.shopDishSkus.map(a => Number(a.stock))) > 0)) {
                          canBuy = true
                        }
                        return (
                          <View className="goods" style={{ display: 'flex' }} key={ele.id} >
                            <Image
                              className="goodsImg"
                              src={getServerPic(ele.dishImageUrl.split(',')[0])} onClick={this.showDetail.bind(this, ele)}
                            />
                            <View className="goodsInfo flex-col flex-sb" style={{ flex: 1 }}>
                              <View className="goodsName">{ele.dishName}</View>
                              <View className="description">{ele.description || '--'}</View>
                              <View className="salesVolume">
                                销量：
                                {this.formatSaleCount(ele.shopDishSkus)}
                              </View>
                              {
                                //会员价
                              }
                              {
                                ele.shopDishSkus[0].memberPrice
                                  ?
                                  <View className="memberPrice">
                                    <Text className="memberPriceContext">会员价</Text>
                                    <View>
                                      <Text className="memberPriceIcon">￥</Text>
                                      <Text className="memberPriceText">{ele.shopDishSkus[0].memberPrice}</Text>
                                    </View>
                                  </View>
                                  :
                                  " "
                              }
                              <View
                                className="goodsPrice"
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  
                                }}
                              >
                                {/* ele.shopDishSkus[0].enablePreferentialPrice */}
                                <View className="priceInfo">
                                  <Text className={this.addClassnameA(ele.shopDishSkus[0].enablePreferentialPrice)}>{ele.shopDishSkus[0].price}</Text>
                                  {
                                    ele.shopDishSkus[0].originalPrice > 0 && (
                                      <Text
                                        className="originalPrice"
                                      >
                                        {ele.shopDishSkus[0].originalPrice}
                                      </Text>
                                    )
                                  }
                                  {
                                    numLimitType === 1 && (
                                      <View className="limit">
                                        {`${LIMIT_TYPE[shopLimitType]}： ${limitBuyNum}份`}
                                      </View>
                                    )
                                  }
                                </View>
                                <View>
                                  {
                                    !canBuy
                                      ? <View className="sale-out">已售罄</View>
                                      : (ele.shopDishSkus.length > 1 || (validAttrs && validAttrs.length > 0))
                                        ? (
                                          <Button
                                            className="chose-sku"
                                            hoverClass="hover"
                                            onClick={this.showSkuModalCtrl.bind(this, ele)}
                                            disabled={!canBuy}
                                          >
                                          选规格
                                          </Button>
                                        )
                                        : (
                                          <View className="addAndSub">
                                            {
                                            curChooseNumber > 0 && (
                                              <Block>
                                                <Button
                                                  className="btn cut"
                                                  hoverClass="hover"
                                                  hoverStartTime={10}
                                                  hoverStayTime={100}
                                                  onClick={this._onSubDishCar.bind(this, o, ele)}
                                                >
                                                  -
                                                </Button>
                                                <View
                                                  className="part"
                                                >
                                                  {curChooseNumber || 0}
                                                </View>
                                              </Block>
                                            )
                                          }
                                            {
                                            !(numLimitType === 1 && curChooseNumber >= limitBuyNum) && (
                                              <Button
                                                className="btn add"
                                                hoverClass="hover"
                                                hoverStartTime={10}
                                                hoverStayTime={100}
                                                onClick={this.onAddDishCar.bind(this, o, ele)}
                                                disabled={!canBuy}
                                              >
                                                +
                                              </Button>
                                            )
                                          }
                                          </View>
                                        )
                                  }
                                </View>
                              </View>
                              {
                                ele.minOrderCount && ele.minOrderCount > 0 && <View className="minCount">{`${ele.minOrderCount}件起购`}</View>
                              }
                            </View>
                          </View>
                        )
                      })
                    }
                  </View>
                ))
            }
          </ScrollView>
        </View>
        {/* 点餐提示 */}
        {
          objNotNull(partnerPrompt) && (
            <View className="friendTip">
              {
                partnerPrompt.type === 'ORDER' && (
                  <Block>
                    <Image src={getServerPic(partnerPrompt.headImgUrl)} />
                    <Text>{`${partnerPrompt.nickName}，`}</Text>
                    <Text className="promptGoods ellipsis">{partnerPrompt.productName}</Text>
                    <Text>{`${partnerPrompt.opreate - 0 ? '+' : '-'}1`}</Text>
                  </Block>
                )
              }
              {
               partnerPrompt.type === 'STOP' && (
                 <Block>
                   <Image src={getServerPic(partnerPrompt.headImgUrl)} />
                   <Text>{`${partnerPrompt.nickName}`}</Text>
                   <Text>结束点餐</Text>
                 </Block>
               )
              }
              {
                partnerPrompt.type === 'CLEAR' && (
                  <Block>
                    <Image src={getServerPic(partnerPrompt.headImgUrl)} />
                    <Text>{`${partnerPrompt.nickName}`}</Text>
                    <Text>清空了购物车!</Text>
                  </Block>
                )
              }
            </View>
          )
        }
        {/* 满减提示 */}
        {
          payType === 0 && fullReduction.length && !cartVisible && (
            <View className="favourableTip">
              {
                reducePrice ? `已减${reducePrice}元` : ''
              }
              {
                objNotNull(nextFull) && (
                  <Block>
                    再买
                    <Text>{toDecimal(nextFull.limit - fullPrice)}</Text>
                    元
                    <Text>{`减${nextFull.reduce}`}</Text>
                  </Block>
                )
              }
            </View>
          )
        }
        <View className="shoppingCart">
          <View className="shoppingLeft">
            <View className="cartBox" onClick={this.openCart}>
              <Image mode="aspectFit" src={`${STATIC_IMG_URL}/icon/icon_cart.png`} />
              <View className="cartNum">{this.shopCartGoodsNum(productInTrolleyDTO) || 0}</View>
            </View>
            <View className="cartMoney">
              <Text>
                {reducePrice > 0 && payType === 0 ? `￥${toDecimal(totalAmount + totalFee)}` : ''}
              </Text>
              {
                this.shopCartGoodsNum(productInTrolleyDTO)!=0&&(
                  <Text>共{this.shopCartGoodsNum(productInTrolleyDTO)}件商品</Text>
                )
              }
              
              <Text>￥</Text>
              {
                payType === 0 ? <Text>{toDecimal(totalAmount - reducePrice + totalFee) || 0}</Text> : <Text>{toDecimal(totalAmount + totalFee) || 0}</Text>
              }
            </View>
          </View>
          {
            payType === 1 ? (
              <View
                className="shoppingRight"
                onClick={() => this.buyNow()}
              >
                立即下单
              </View>
            ) :  userId != masterUserId ? (
              <View
                className="shoppingRight"
                onClick={this.orderOver}
              >
                选好了
              </View>
            ) : (
              <View
                className="shoppingRight"
                onClick={() => this.buyNow()}
              >
                立即下单
              </View>
            )
          }
        </View>

        {/* 购物车 */}
        {
          cartVisible && (
            <View className="shoppingCartMask" id="shoppingCart" onClick={this.openCart}>
              <View className="shoppingCartBox" onClick={this.preventEvent}>
                {
                  reducePrice && (
                    <View className="cartFavourable">{`已减${reducePrice}元`}</View>
                  )
                }
                <ScrollView
                  className="cartBox"
                  scroll-y
                >
                  <View className="cartTitle">
                    <Text>购物车</Text>
                    <View className="cartClear" onClick={this.clearShoppingCart}>
                      <Image src={`${STATIC_IMG_URL}/icon/icon_clear.png`} />
                      <Text>清空</Text>
                    </View>
                  </View>
                  {
                    feeStatus !== 0 && (
                      <View className="dishList">
                        <View className="dishItem">
                          <View className="dishItemLeft">
                            <View className="dishName">{`桌台费/${feeStatus === 1 ? '桌' : '人'}`}</View>
                          </View>
                          <View className="dishItemRight">
                            <View className="dishItemPrice">
                              <Text>￥</Text>
                              {toDecimal(totalFee?totalFee:0)}
                            </View>
                          </View>
                        </View>
                      </View>
                    )
                  }
                  {
                    requiredProduct.length > 0 && (
                      <View className="cartDishTitle">
                        <Text
                          className="cartDishTitleLeft"
                        >
                          {`必选商品(${requiredProduct.length})`}
                        </Text>
                        <Text className="cartDishTitleRight">必选商品不参与折扣</Text>
                      </View>
                    )
                  }
                  <View className="dishList">
                    {
                      requiredProduct && requiredProduct.length > 0 && requiredProduct.map(ele => {
                        const {
                          dishName, number,
                          productId, price, mustCondition,
                        } = ele
                        return (
                          <View className="dishItem" key={productId}>
                            <View className="dishItemLeft">
                              <View className="dishName">{dishName}</View>
                            </View>
                            <View className="dishItemRight">
                              <View className="dishItemPrice">
                                <Text>￥</Text>
                                
                                {toDecimal(price?price:0)}
                              </View>
                              <View className="limitedAddBox">
                                {
                                  // !((mustCondition === 1 && number === personNum) ||
                                  //   (mustCondition === 2 && number === 1)) && (
                                  //   <Image
                                  //     src={require('../../../images/icons/icon_subtract.png')}
                                  //     onClick={this.onSubDishCarShopping.bind(this, ele)}
                                  //   />
                                  // )
                                }
                                <Image
                                  src={`${STATIC_IMG_URL}/icon/icon_subtract.png`}
                                  onClick={this.onSubDishCarShopping.bind(this, ele)}
                                />
                                <Text>{number}</Text>
                                <Image
                                  src={`${STATIC_IMG_URL}/icon/icon_add.png`}
                                  onClick={this.onAddDishCarShopping.bind(this, ele)}
                                />
                              </View>
                            </View>
                          </View>
                        )
                      })
                    }
                  </View>
                  {
                    product.length > 0 && (
                      <View className="cartDishTitle">
                        <Text className="cartDishTitleLeft">{`已选商品(${product.length})`}</Text>
                      </View>
                    )
                  }
                  <View className="dishList">
      
                    { 
                      product.map(ele => {
                        const {
                          dishName, number, spec, attribute,
                          productId, price, numLimitType, limitBuyNum,enablePreferentialPrice,memberPrice
                        } = ele
                        const attr = imitateObjectValues(attribute || {})
                          .join('/')
                        return (
                          <View className="dishItem" key={productId}>
                            <View className="dishItemLeft">
                              <View className="dishName ellipsis">{dishName}</View>
                              <View
                                className="dishSku"
                              >
                                {`${spec}${spec && attr ? '/' : ''}${attr}`}
                              </View>
                            </View>
                            <View className="dishItemRight">
                              <View className="dishItemPrice">
                                <Text>￥</Text>
                                {toDecimal(enablePreferentialPrice?memberPrice:price)}
                              </View>
                              <View className="limitedAddBox">
                                <Image
                                  src={`${STATIC_IMG_URL}/icon/icon_subtract.png`}
                                  onClick={this.onSubDishCarShopping.bind(this, ele)}
                                />
                                <Text>{number}</Text>
                                {
                                  !(numLimitType === 1 && limitBuyNum <= number) ? (
                                    <Image
                                      src={`${STATIC_IMG_URL}/icon/icon_add.png`}
                                      onClick={this.onAddDishCarShopping.bind(this, ele)}
                                    />
                                  ) : (<Image />)
                                }
                              </View>
                            </View>
                          </View>
                        )
                      })
                    }
                  </View>
                </ScrollView>
              </View>
            </View>
          )
        }

        {/**会员卡列表 */}
        {
          alreadyStoredCards.length>0&&(       
          <ChooseVipCard 
            cardVisble={cardVisble}
            alreadyStoredCards={alreadyStoredCards}
            openMemberCardList={this.openMemberCardList}
            getOtherPlatformData={this.getOtherPlatformData}
            enterpriseGuid={enterpriseGuid}
            openId={openId}
            wxtoken={wxtoken}
            selectMemberCard={this.selectMemberCard}
            selectesCard={selectedCard}
            changeCardVisible={this.changeCardVisible}
          />)
        }
 
        

        {/* 好友买单弹窗 */}
        {
          friendBuyVisible && (
            <View className="friendBuyMask">
              <View className="friendBuyBox">
                <Image
                  className="friendBuyImg"
                  src={`${STATIC_IMG_URL}/friend_buy.png`}
                />
                <View className="friendBuyWord">{payType === 0 ? '点餐已结束好友正在积极买单中~' : '好友正在提交订单给后厨，请稍后点的单'}</View>
                <View className="friendBuyBtn" onClick={this.openFriendBuy}>确定</View>
              </View>
            </View>
          )
        }

        {/* 好友结算弹窗 */}
        {
          friendSettleVisible && (
            <View className="friendSettleMask">
              <View className="friendSettleBox">
                <Image
                  className="friendSettleImg"
                  src={`${STATIC_IMG_URL}/friend_settle.png`}
                />
                <View className="friendSettleWord">好友已下单并结算</View>
                <View className="friendSettleBtn">
                  <View
                    className="settleBtnItem ghostBtn"
                    onClick={this.goPage.bind(this, 'home')}
                  >
                    去首页逛逛
                  </View>
                  <View
                    className="settleBtnItem confirmBtn"
                    onClick={this.goPage.bind(this, 'order')}
                  >
                    查看订单
                  </View>
                </View>
              </View>
            </View>
          )
        }

        {/* 选择用餐人数 */}
        {
          choosePersonVisible && (
            <View className="choosePersonMask">
              <View className="choosePersonBox">
                {/* <Image */}
                {/*  className="chooseMerchantImg" */}
                {/*  src={require('../../../images/demo/test_logo.png')} */}
                {/* /> */}
                <View className="choosePersonTitle">用餐人数</View>
                <ScrollView
                  className="chooseModalTable"
                  scrollY
                >
                  <View className="choosePersonList">
                    {
                      personList && personList.map((item, index) => (
                        <View
                          className={`choosePersonItem ${personNumCopy === item ? 'choosePersonActive' : ''}`}
                          key={item.id}
                          onClick={this.personChoose.bind(this, item)}
                        >
                          {item}
                          人
                        </View>
                      ))
                    }
                  </View>
                </ScrollView>
                <View
                  className="choosePersonBtn"
                  onClick={this.updatePeopleNum}
                >
                  确定
                </View>
              </View>
              <View className="closeImgBox" onClick={this.closeChoose.bind(this, 2)}>
                <Image
                  className="closeImg"
                  src={`${STATIC_IMG_URL}/icon/icon_shutDown.png`}
                />
              </View>
            </View>
          )
        }

        {/* 店铺优惠 */}
        {
          favourableVisible && (
            <View
              className="favourableBox"
              style={{ height: `${windowHeight - merchantInfoHeight}px` }}
            >
              <View className="favourableList">
                <View className="favourableItem">
                  <Text className="favourableTips yellowTip flex-sk">满减</Text>
                  <Text className="favourableContent">
                    {
                      fullReduction.map(ele => {
                        const { limit, reduce } = ele
                        return `满${limit}减${reduce}块；`
                      })
                    }
                  </Text>
                </View>
              </View>
              <AtIcon
                className="favourableArrow"
                value="chevron-up"
                size="50"
                color="#ABABAB"
                onClick={this.openFavourable}
              />
            </View>
          )
        }

        {/* 选择规格弹层 */}
        {
          showSkuModal
          && (
            <View
              className="sku-wrap flex-row flex-ac"
              onClick={this.showSkuModalCtrl.bind(this)}
              style={{ height: `${this.state.windowHeight}px` }}
            >
              <View
                className="flex1 sku-inwrap"
                onClick={this.preventEvent.bind(this)}
              >
                <View className="ellipsis header">
                  {skuDish.dishName}
                  <View
                    className="close-sku-panel"
                    onClick={this.showSkuModalCtrl.bind(this)}
                  />
                </View>
                <View className="content-wrap">
                  {
                    skus.length > 0
                    && (
                      <Block>
                        <View className="title">
                          规格：
                        </View>
                        <View className="flex-row flex-ac item-list">
                          {
                            skus.map((o, i) => (
                              <Button
                                key={o.spec}
                                className={`item ${objNotNull(currentSku) && currentSku.id === o.id ? 'active' : ''}`}
                                hoverClass="hover"
                                onClick={this.onClickSku.bind(this, o)}
                              >
                                {o.spec}
                              </Button>
                            ))
                          }
                        </View>
                      </Block>
                    )
                  }
                  {
                    attrs.length > 0
                    && (
                      <Block>
                        {
                          attrs.map((o, i) => (
                            <Block key={o.name}>
                              <View className="title">
                                {o.name}
                                ：
                              </View>
                              <View className="flex-row flex-ac item-list">
                                {/*  const select = currentAttr[`${o.id}`] === a || false */}
                                {
                                  o.details.map((a, j) => {
                                    /**原本的属性选择 */
                                    const select = currentAttr[`${o.id}`] === a || false 
                                    /**原本的属性选择 */

                                    /**属性多选 */
                                    // const select = currentAttr[`${o.id}`].details.find((item)=>a===item) || false
                                    /**属性多选 */
                                    return (
                                      <Button
                                        key={`${i}_${j}`}
                                        className={`item ${select ? 'active' : ''}`}
                                        hoverClass="hover"
                                        onClick={this.onClickAtrr.bind(this, o, a, j)}
                                      >
                                        {a}
                                      </Button>
                                    )
                                  })
                                }
                              </View>
                            </Block>
                          ))
                        }
                      </Block>
                    )
                  }
                </View>
                <View className="flex-row flex-sb flex-ac footer">
                  <View className="flex-row flex-ae flex-ac">
                    <View className="flex-row flex-je price">
                      <Text className="rmb">¥</Text>
                      <View
                        className="money"
                      > {
                          enterpriseGuid&&currentSku.enablePreferentialPrice?currentSku.memberPrice:(currentSku.price || currentSku.price === 0) || skuPrices
                        }
                      </View>
                    </View>
                    <Text className="sku">{skuAndAtrrText}</Text>
                  </View>
                  <Button
                    className={`add-car-btn ${addSkuBtnUsable ? '' : 'disabled'}`}
                    hoverClass="hover"
                    disabled={!addSkuBtnUsable}
                    onClick={this.addSkuCar.bind(this)}
                  >
                    加入购物车
                  </Button>
                </View>
              </View>
            </View>
          )
        }

        {/* 好友结束弹窗 */}
        {
          orderOverStatus && (
            <View className="orderOverModel">
              <View className="container flex-col flex-ac flex-jc">
                <Image src={`${STATIC_IMG_URL}/orderOver.png`} />
                <Text>{payType === 0 ? '点餐已结束好友正在积极买单中~' : '好友正在提交订单给后厨，请等待提交完成再继续点餐'}</Text>
                <View className="flex-row btnContainer">
                  <View className="operateBtn flex1" onClick={this.goHome}>回到首页</View>
                </View>
              </View>
            </View>
          )
        }


        {/* 商品详情弹窗 */}
        {
          detailModal
          && (
            <View
              className="dishDetailMask"
              style={{ height: `603px` }}
              onClick={this.closeDetail}
            >
              <View className="dishDetailBox">
                <Image
                  src={`${STATIC_IMG_URL}/icon/icon_shutDown.png`}
                  className="closeImg"
                  onClick={this.closeDetail}
                />
                <View className="dishImg">
                  <Image src={getServerPic(dishInfo.dishImageUrl.split(',')[0])} />
                </View>
                <View className="dishInfoBox">
                  <View className="dishInfoName ellipsis">{dishInfo.dishName}</View>
                  <View
                    className="dishInfoDes"
                  >
                    {dishInfo.description === null ? '暂无描述' : dishInfo.description}
                  </View>
                  <View className="dishInfoDes">
                    销量
                  {this.formatSaleCount(dishInfo.shopDishSkus)}
                  </View>
                  <View className="dishInfoFooter">
                    <View className="infoFooterLeft">
                      <Text>￥</Text>
                      <Text>{dishInfo.shopDishSkus[0].price}</Text>
                      <Text className="originalPrice">
                        {
                          dishInfo.shopDishSkus && dishInfo.shopDishSkus[0] && dishInfo.shopDishSkus[0].originalPrice && dishInfo.shopDishSkus[0].originalPrice !== 0 ? `￥${dishInfo.shopDishSkus[0].originalPrice.toFixed(2)}` : ''
                        }
                      </Text>
                      {/* { */}
                      {/*  dishInfo.shopDishSkus[0].originalPrice && <Text>￥{formatCurrency(dishInfo.shopDishSkus[0].originalPrice)}</Text> */}
                      {/* } */}
                    </View>
                    {/* <View>
                      {
                        !(dishInfo.shopDishSkus && dishInfo.shopDishSkus.length > 0 && (Math.max(...dishInfo.shopDishSkus.map(a => Number(a.stock))) > 0))
                          ? <View className="sale-out">已售罄</View>
                          : (dishInfo.shopDishSkus && dishInfo.shopDishSkus.length > 1 || ((dishInfo.shopDishSkus && dishInfo.shopDishSkus.length > 0 && (Math.max(...dishInfo.shopDishSkus.map(a => Number(a.stock))) > 0)) && (dishInfo.shopDishSkus.length > 0 && (Math.max(...dishInfo.shopDishSkus.map(a => Number(a.stock))) > 0)).length > 0))
                            ? (
                              <Button
                                className="chose-sku"
                                hoverClass="hover"
                                onClick={this.showSkuModalCtrl.bind(this, dishInfo)}
                                disabled={!(dishInfo.shopDishSkus && dishInfo.shopDishSkus.length > 0 && (Math.max(...dishInfo.shopDishSkus.map(a => Number(a.stock))) > 0))}
                              >
                                选规格
                              </Button>
                            )
                            : (
                              <View className="addAndSub">
                                {
                                  infoCar
                                  && (
                                    <Block>
                                      <Button
                                        className="btn cut"
                                        hoverClass="hover"
                                        hoverStartTime={10}
                                        hoverStayTime={100}
                                        onClick={this._onSubDishCar.bind(this, dishInfo)}
                                      >
                                        -
                                </Button>
                                      <View className="part">{infoCar.num}</View>
                                    </Block>
                                  )
                                }
                                <Button
                                  className="btn add"
                                  hoverClass="hover"
                                  hoverStartTime={10}
                                  hoverStayTime={100}
                                  onClick={this.onAddDishCar.bind(this, dishInfo)}
                                  disabled={!(dishInfo.shopDishSkus && dishInfo.shopDishSkus.length > 0 && (Math.max(...dishInfo.shopDishSkus.map(a => Number(a.stock))) > 0))}
                                >
                                  +
                              </Button>
                              </View>
                            )
                      }
                    </View> */}
                  </View>
                </View>
              </View>
            </View>
          )
        }

        {/**广告弹窗 */}
        
        {objNotNull(indexModal)&&(
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
          </AtCurtain>)

        }
    
      </View>
    )
  }
}

export default ScanningIndex
