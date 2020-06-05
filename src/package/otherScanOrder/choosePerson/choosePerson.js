import Taro, { Component, showLoading, hideLoading } from '@tarojs/taro'
import {
  View, Swiper, SwiperItem, Image, Text, ScrollView, Block
} from '@tarojs/components'
import { AtMessage ,AtIcon} from 'taro-ui'
import { connect } from '@tarojs/redux'
import {
  getPlatFormId, getServerPic, getUserDetail, navToPage, needLogin, parseQuery, showToast, removeSearchHistory
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
      newTable: true,
      enterpriseGuid:'',
      openId:'',
      wxtoken:'',
      orderSn:null,
      peopleNum:null,
      phone:null,
      changeData:null,
      otherPersonNum:{numArr:[1,2,3,4,5,6,7,8,9,'clear',0,'back']},
      storeTouch:[],
    }
  }

  componentWillMount() {
       //是否已经存在未支付订单

    if (!needLogin()) return
    Taro.setNavigationBarColor({
      backgroundColor: Taro.getStorageSync('systemColor'),
      frontColor: "#ffffff"
    });
    console.log('56this.$router.params=>>>>>>>>>>>>>>',this.$router.params);
    const { wxtoken}  = this.$router.params;{
      if(wxtoken){                //通过是否存在wxtoken 来判断是否是直接从微信扫过来的
        this.setState(this.$router.params);
      }else{
        if(needLogin()){
          showLoading(); 
          const {weappUserId,platformId} = this.getU_PID();
          this.getEnterPriseId(weappUserId,platformId,res); 
        }
      }
    }
    

    this.getNowOrder(this.callbackGetNowOrder); 
    // this.getTableInfo(this.$router.params)
    
    
  }

  componentDidShow() {
    
  };

  // 选择人数
  personChoose = num => {
    this.setState({
      tableNum: num
    })
  };

  //两个平台之间数据统一
  dataTraslate = (data,merchantAvatar=null)=>{
    const tableInfo = {};
    tableInfo.payType = 1;
    tableInfo.brandName = data.tdata.brandName;
    tableInfo.merchantName = data.tdata.storeName
    tableInfo.tableName = data.tdata.diningTableCode;
    tableInfo.tableNum = data.tdata.diningTableGuid;
    tableInfo.headImgUrl = merchantAvatar;
    tableInfo.diningTableCode= data.tdata.diningTableCode;
    tableInfo.diningTableGuid= data.tdata.diningTableGuid
    tableInfo.areaGuid= data.tdata.areaGuid
    tableInfo.areaName= data.tdata.areaName
    tableInfo.storeGuid= data.tdata.storeGuid
    tableInfo.brandGuid= data.tdata.brandGuid
    tableInfo.storeName= data.tdata.storeName
    tableInfo.wxUserInfoDTO= data.tdata.wxUserInfoDTO ;
    return tableInfo;
  };

  

  // 获取扫码品牌门店桌号信息
  getTableInfo = ({ tableId, merchantId, brandId, payType, tableName, enterpriseGuid ,openId, wxtoken, phone,merchantAvatar, preId,preBrandId}) => {
    //判断平台
    if(enterpriseGuid){
      this.props.dispatch({
        type:'otherPlatform/getConsumerInfoAction',
        payload:{
          headerMessage:{
            enterpriseGuid:enterpriseGuid,
            openId:openId,
            wxtoken:wxtoken,
          },
          otherPlatform:true,
        },
        callback:({ok,data})=>{
          if(ok&&data.code==0){
            const {isLogin} = data.tdata.wxUserInfoDTO
            if(!isLogin){  //未登录 =>>>进行登录
              const{areaGuid,areaName,diningTableGuid,diningTableCode:diningTableName,storeGuid,storeName,brandGuid} = data.tdata;
              const tableCode = diningTableName;
              this.otherLogin(this.callbackOtherLogin,{areaGuid,areaName,diningTableGuid,diningTableName,tableCode,storeGuid,storeName,brandGuid})
            }
            const {orderSn} = this.state;
            const tableName = data.tdata.diningTableCode;
            const payType = 1;
            const newTable = orderSn?false:true;   //有无未完成订单
            const changedata = this.dataTraslate(data,merchantAvatar);
            console.log('changedata=>>>>>>>>>>>>>>',changedata)           
            Taro.setNavigationBarTitle({
              title: changedata.merchantName
            });
            const tableList = [];
            this.setState({
              tableInfo: changedata,
              tableList,
              payType,
              tableName,
              newTable,
            })
            console.log('148=>>>>>>',newTable,orderSn)
            if(!newTable){   //是不是新订单
              this.getCurrentOrder(this.callbackGetCurrentOrder)
            }        
          }
          else{
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
  };

  // 开始点餐
  startOrder = () => {
    const {
      tableNum, tableInfo, merchantId, tableId, brandId, payType, tableName, newTable,enterpriseGuid,openId,wxtoken,phone
    } = this.state;
    const {merchantAvatar,preBrandId,preId} = this.$router.params;
    const perNum = this.calSelectedNum();
      Taro.setStorage({
        key:'tc_island_tableInfo',
        data:{
          perNum,tableInfo:JSON.stringify(tableInfo),merchantId,tableId,brandId,tableName,phone,enterpriseGuid,openId,wxtoken,payType:1,merchantAvatar
        }
      })
      Taro.redirectTo({
        url:`/package/otherScanOrder/scanningIndex/scanningIndex?personNum=${enterpriseGuid?perNum:tableNum}&tableInfo=${JSON.stringify(tableInfo)}&merchantId=${merchantId}&tableId=${tableId}&brandId=${brandId}&payType=${payType}&tableName=${tableName}&newTable=${newTable}&enterpriseGuid=${enterpriseGuid}&openId=${openId}&wxtoken=${wxtoken}&phone=${phone}&preBrandId=${preBrandId}&preId=${preId}`
      })
  
    
  };


  /**
   * 
   * 
   * 另一平台 getNowOrder/callbackGetNowOrder/getCurrentOrder/callbackGetCurrentOrder/getComsumerInfo/callbackGetComsumerInfo/otherLogin/callbackOtherLogin
   * otherLogin/callbackOtherLogin/updatePersonNum/deleteTouch/clearTouch/calSelectedNum/updateScrollViewClass
   */

  //判断是否存在未完成订单   1=>>获取订单号   2=>>判断该订单是否被支付
  getNowOrder= (callback)=>{
    const {enterpriseGuid, openId, wxtoken} = this.$router.params
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
    const {enterpriseGuid, openId, wxtoken,brandId,merchantId,tableId,phone} = this.$router.params
    if(ok&&data.code == 0){
      console.log('230=>>>>',data);    //state =>>>>   0:待确认，1待支付，2:已完成，3:已取消    
      if(data.tdata.length>0){
        const unpayOrder = data.tdata.filter((item)=> item.state ==1||item.state ==0 );   //得到未支付订单
        // console.log("236 unpayOrder=>>>>",unpayOrder)
        
        if(unpayOrder.length>0){    //length > 0 说明存在未支付订单
          const {guid:orderSn} = unpayOrder[0]  ;
          this.setState(
            { orderSn},
            ()=>{
              console.log('orderSn  242=>>>>',orderSn);
             }
            )
          showLoading();
          this.getTableInfo(this.$router.params)
        }else{
          Taro.setStorage({
            key:'tc_island_orderInfo',
            data:{
              orderSn:null,wxtoken:null,enterpriseGuid:null,openId:null,payType:null,memberInfoGuid:null,merchantId:null,brandId:null,tableInfo:{},merchantInfo:{}
            }
          })
          this.setState(
            {orderSn:null},    //不存在未完成订单
          )
          this.getTableInfo(this.$router.params)
         
          // return 
        }
      }else if(data.tdata.length==0){                          //第一次来，不存在订单信息
        Taro.setStorage({
          key:'tc_island_orderInfo',
          data:{
            orderSn:null,wxtoken:null,enterpriseGuid:null,openId:null,payType:null,memberInfoGuid:null,merchantId:null,brandId:null,tableInfo:{},merchantInfo:{}
          }
        })
        this.setState(
          {orderSn:null},    //不存在未完成订单
        )
        this.getTableInfo(this.$router.params)
      }
    }
  }

  //存在未完成订单后需要去取得该订单数据
  getCurrentOrder = (callback)=>{
    const {enterpriseGuid, openId, wxtoken} = this.$router.params;
    const {orderSn} = this.state;
    const {dispatch} = this.props
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
      callback,
    })
  }

  //请求未完成订单的回调
  callbackGetCurrentOrder =  ({ok,data}) => {
    if(ok&&data.code ==0){  
      const {guestCount} = data.tdata; 
      const{tableName,payType,newTable,tableInfo:changedata,orderSn} = this.state;
      const {enterpriseGuid, openId, wxtoken,brandId,merchantId,tableId,phone,preBrandId,preId} = this.$router.params;

      hideLoading();
      Taro.redirectTo({ url: `/package/otherScanOrder/scanningIndex/scanningIndex?personNum=${guestCount}&tableInfo=${JSON.stringify(changedata)}&merchantId=${merchantId}&tableId=${tableId}&brandId=${brandId}&payType=${payType}&tableName=${tableName}&newTable=${newTable}&enterpriseGuid=${enterpriseGuid}&openId=${openId}&orderSn=${orderSn}&wxtoken=${wxtoken}&phone=${phone}&preBrandId=${preBrandId}&preId=${preId}` })
      
    }
    
    
  }



  //另一个平台未登录时 前去 登录
  // login
  otherLogin = (callback,data)=>{
    const{dispatch} = this.props;
    const {areaGuid,areaName,diningTableGuid,diningTableName,tableCode,storeGuid,storeName,brandGuid} = data;
    const {enterpriseGuid,wxtoken,openId} = this.state;
    dispatch({
      type:'otherPlatform/otherLoginAction',
      payload:{
        headerMessage:{
          enterpriseGuid,
          openId,
          wxtoken,
        },
        otherPlatform:true,
        otherdata:{
          // account,
          areaGuid,    //
          areaName,    //
          diningTableGuid,    //
          diningTableName,    //
          // brandGuid,    
          storeGuid,    //
          tableCode,   //
          openId ,      //
          isLogin:true,
          enterpriseGuid,
          brandGuid,
        },
      },
      callback,
    })
  }
  callbackOtherLogin = ({ok,data})=>{
    if(ok&&data.code==0){
    }
  }


  //更新用户选择的人数
  updatePersonNum = (item)=>{
    const {storeTouch} = this.state;
    if(typeof item ==='number'){
      if(item===0&&storeTouch.length==0){    //人数不能未0
        return 
      }    
      if(storeTouch.length<2){     
        storeTouch.push(item); 
        this.setState({
          storeTouch
        })
      }else if(storeTouch.length==2){     
        showToast("选择人数请少于99");
        return      //最多只能选择99人
        storeTouch.shift();
        if(storeTouch[0]==0){storeTouch.shift()}     //前一个数是0的时候
        storeTouch.push(item);
        this.setState({
          storeTouch
        })
     }
    }
  }

  //删除前一个数
  deleteTouch = ()=>{
    const {storeTouch} = this.state;
    if(storeTouch.length==0){
      return 
    }else{
      storeTouch.pop();
      this.setState({
        storeTouch,
      })
    }
  }

  //清除选择的人数
  clearTouch =()=>{
    const {storeTouch} = this.state;
    this.setState({
      storeTouch:[],
    })
  }

  //得到选择的人数
  calSelectedNum= ()=>{
    const {storeTouch} = this.state;
    if(storeTouch.length==0){
      return 1
    }else if(storeTouch.length==1){
      return Number(storeTouch[0])
    }else if(storeTouch.length== 2){
      return  Number(storeTouch.join('')) ;
    }
  }


  updateScrollViewClass = ()=>{
    const{enterpriseGuid} = this.state;
    if(enterpriseGuid){
      return 'chooseModalTable otherScroll'
    }else{
      return 'chooseModalTable'
    }
  }


  //直接从微信扫码进入时  需要获取{Token}{diningTableGuid}{brandGuid}{enterpriseGuid}{storeGuid}{openid}{phone} {merchantAvatar}{preBrandId}{preId}
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
    // const {merchantAvatar,id,brand} = this.findMerchant(storeGuid)
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
          this.setState({
            wxtoken:Token,
            tableId:diningTableGuid,
            brandId:brandGuid,
            enterpriseGuid:enterpriseGuid,
            merchantId:storeGuid,
            openId:openid,
            phone:phone,
            merchantAvatar:null,   //merchantAvatar
            preBrandId:   null,   //brand,
            preId:null,   //id
          })
          navToPage(`/package/otherScanOrder/choosePerson/choosePerson?wxtoken=${Token}&tableId=${diningTableGuid}&brandId=${brandGuid}&enterpriseGuid=${enterpriseGuid}&merchantId=${storeGuid}&openId=${openid}&phone=${phone}&merchantAvatar=${merchantAvatar}&preBrandId=${brand}&preId=${id}`)
          hideLoading();
        } else {
          showToast(data.message)
          hideLoading();
        }
      }
    })

  }



  render() {
    const { tableList, tableNum, tableInfo,enterpriseGuid,otherPersonNum:{numArr} } = this.state;
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
          {
            enterpriseGuid
            ?<View className="chooseModalTitle">
              <Text>{`共${this.calSelectedNum()}人`}</Text>
            </View>
            :<View className="chooseModalTitle">你好,请问几位？</View>
            
          }
         {/* <View className="chooseModalTitle">你好,请问几位？</View> */}
          <View className="chooseModalTableNum">
            <Text>当前桌号：</Text>
            <Text>{tableInfo.tableName}</Text>
          </View>
          <ScrollView
            className={this.updateScrollViewClass()} 
            scrollY
          > 
          {
            enterpriseGuid? 
            <View className="flex-row flex-wrap flex-jc">
                { //<View onClick={this.updatePersonNum.bind(this,item)} className="chooseModalTableItem otherItem" hover-class="hover">{item}</View>
                //<View onClick={this.deleteTouch.bind(this,item)} className="chooseModalTableItem otherItem" hover-class="hover"><AtIcon value="close-circle" size="18" color="#999" /></View>
                numArr.map((item,index)=>(
                
                  (item !=='back'&&item !=='clear')?
                  (<View onClick={this.updatePersonNum.bind(this,item)} className="chooseModalTableItem otherItem" hover-class="hover" key={item}>{item}</View>)
                  :(
                    item==='back'?
                    <View onClick={this.deleteTouch.bind(this,item)} className="chooseModalTableItem otherItem" hover-class="hover" key={item}><AtIcon value="close-circle" size="18" color="#999" /></View>
                    :<View onClick={this.clearTouch.bind(this,item)} className="chooseModalTableItem otherItem" hover-class="hover" key={item}>清空</View>)
                  
                 
                ))
             
                
                // <View onClick={this.updatePersonNum.bind(item)} className="otherchooseperson">
                //   <View type="1">1</View><View type="2">2</View><View type="3">3</View>
                //   <View type="4">4</View><View type="5">5</View><View type="6">6</View>
                //   <View type="7">7</View><View type="8">8</View><View type="9">9</View>
                //   <View type="clear">清空</View><View type="1">8</View><View type="back">*</View>
                // </View>
                
              }
            </View>
            
            :
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
          }
           
          </ScrollView>
          <View className="chooseModalBtn" onClick={this.startOrder}>开始点餐</View>
        </View>
        <AtMessage />
      </View>
    )
  }
}
export default ChoosePerson
