import Taro, { Component } from "@tarojs/taro";
import {
  View,
  Image,
  Text,
  Button,
  Block,
  ScrollView
} from "@tarojs/components";
import { connect } from "@tarojs/redux";
import "./scanningConfirm.scss";
import { AtFloatLayout } from "taro-ui";
import {
  formatCurrency,
  getPlatFormId,
  getServerPic,
  getShareInfo,
  getUserDistributor,
  hideLoading,
  imitateObjectValues,
  navToPage,
  objNotNull,
  showLoading,
  showToast,
  toDecimal,
  getUserDetail,
  saveUserDetail,
  getUserLocation,
  needLogin
} from "../../../utils/utils";
import {
  APP_ID,
  DEFAULT_PLAT_FORM_ID,
  STATIC_IMG_URL
} from "../../../config/baseUrl";
import {
  COUPON_CONDITION,
  PAY_STORED,
  PAY_WECHAT,
  PAYMENT
} from "../../../config/config";
import IconFont from "../../../components/IconFont/IconFont";
import Payment from "../../../components/Payment/Payment";
import ChooseVipCard from '../../../components/chooseVipCard/chooseVipCard'
import CryptoJS from 'crypto-js'

const { onfire } = Taro.getApp();
@connect(({}) => ({}))
export default class scanningConfirm extends Component {
  config = {
    navigationBarTitleText: "订单详情",
    navigationBarBackgroundColor: "#ffffff",
    navigationBarTextStyle: "black",
    enablePullDownRefresh: true
  };

  constructor() {
    super();
    this.state = {
      shoppingCar: {},
      goods: [],
      tableInfo: {},
      remark: "",
      usableRedPackage: [],
      unUsableRedPackage: [],
      confirmRedPackage: {},
      currentRedPackage: {},
      payment: PAY_WECHAT,
      payBoxVisible: false,
      payType: 0,
      orderSn: "",
      sureOrder: false,
      enterpriseGuid: null,
      wxtoken: null,
      openId: null,
      // orderInterval:null,
      brandId: null,
      checkVolume: {},
      weappuserId: null,
      platformId:null,
      phone:null,
      newOrderGuid:null,
      vipCard: 0,
      cardVisble: false,
      alreadyStoredCards: [], //会员卡列表
      selectesCard: {},
      otherMemberPay:null,
      storedPayParams:null,
      saleTotlePrice:null,
      payAmount:null,
      enableMemberPrice:false,
      totlePrice:null,
      productFee:null,
      merchantId:null,
      tableId:null,
      diningTableName:null,
      goodsName:null,
      storeName:null,
    }
    this.wxCode = ''
  }
  componentWillMount() {
    this.getEnterpriseName();
    this.getID();
    const {enterpriseGuid, wxtoken, openId} = this.$router.preload;
    if(enterpriseGuid){
      this.setState({
        enterpriseGuid: enterpriseGuid,
        wxtoken: wxtoken,
        openId: openId
      });
    }
    console.log('this.$router.preload=>>>>>>>>>>>',this.$router.preload)
  }

  componentDidMount() {
    const { orderingInfo, tableInfo, payType, allProduct, orderSn, enterpriseGuid, wxtoken, openId } = this.$router.preload;
    if (Number(payType) === 1) {
      orderingInfo.feeStatus = orderingInfo.tableFee.feeStatus;
      orderingInfo.totalFee = orderingInfo.tableFee.totalFee;
      orderingInfo.totalAmount = orderingInfo.productFee;
    }
    const {orderingInfo:{productFee}} =  this.$router.preload;
    console.log(orderingInfo);
    this.setState(
      {
        goods: payType - 0 === 0 ? this.getOrderGoods() : allProduct,
        shoppingCar: orderingInfo,
        tableInfo,
        payType: Number(payType),
        orderSn,
        productFee,
      },
      () => {
        if (enterpriseGuid) {
          this.getOtherBonus();
          this.getOtherPlatformData(1)
        } else {
          this.getUserCanUseBonus();
        }
      }
    );
    if (enterpriseGuid) {
      

      //商家未接单时监听商家是否接单
      if (!orderingInfo.sureOrder) {

      } else if (orderingInfo.sureOrder) {
        //商家接单后
        this.setState({
          sureOrder: orderingInfo.sureOrder
        });
      }
    }
  }

  componentWillUnmount() {
    
  }

  // 下拉刷新
  onPullDownRefresh() {
    // console.log("下拉刷新");
    Taro.stopPullDownRefresh()
    this.getOrdeState();
  }

  getOrderGoods = () => {
    const {
      allProduct,
      orderingInfo: { productInTrolleyDTO },
      currentMerchant: { id: merchantId },
      brandId
    } = this.$router.preload;
    return allProduct
      .reduce(
        (arr, { shopDishProductCats }) => [...arr, ...shopDishProductCats],
        []
      )
      .reduce((arr, acc) => {
        const { shopDishSkus, dishImageUrl } = acc
        shopDishSkus.map(ele => {
          const { id } = ele;
          productInTrolleyDTO.map(car => {
            const {
              productId: carSkuId,
              attribute,
              dishName,
              number,
              price,
              numLimitType,
              shopLimitType,
              limitBuyNum
            } = car;
            let isAttribute = true;
            let isAttributeList = [];
            isAttributeList.push(true);
            for (const key in attribute) {
              arr.map(val => {
                val.selfSupportDishPropertyTempList.map(o => {
                  if (o.id == key && o.details == attribute[key]) {
                    isAttributeList.push(false);
                  } else {
                    isAttributeList.push(true);
                  }
                });
              });
            }
            if (isAttributeList.includes(true)) {
              isAttribute = true;
            } else {
              isAttribute = false;
            }
            if (carSkuId === id && isAttribute) {
              const attr = attribute
                ? imitateObjectValues(attribute).join(",")
                : "";
              const productName = `${dishName}${attr && `(${attr})`}`;
              const selfSupportDishPropertyTempList = [];
              for (const key in attribute) {
                selfSupportDishPropertyTempList.push({
                  id: key,
                  merchantId,
                  brandId,
                  name: "",
                  details: attribute[key]
                });
              }
              arr.push({
                productType: 64,
                activityId: null,
                activityType: null,
                packFee: 0,
                productName,
                skuId: carSkuId,
                productNum: number,
                productPrice: price,
                imageUrl: dishImageUrl,
                numLimitType,
                shopLimitType,
                limitBuyNum,
                spec: {
                  name: productName,
                  packNum: "",
                  packPrice: "",
                  price
                },
                selfSupportDishPropertyTempList
              });
            }
          });
        });
        return arr;
      }, []);
  };

  // 获取 weappuserId  platformId
  getID = () => {
    Taro.getStorage({
      key: "tc_island_user_detail",
      success: res => {
        console.log("res.data.weappUserId", res.data.weappUserId);
        this.setState({
          weappuserId: res.data.weappUserId,
          platformId: res.data.platformId,
          phone: res.data.phone
        });
      }
    });
  };

  // 刷新余额信息
  refreshBalance = () => {
    const { dispatch } = this.props;
    const userInfo = getUserDetail();
    dispatch({
      type: "mine/getUserMemberInfoAction",
      callback: ({ ok, data }) => {
        if (ok) {
          const { amount } = data;
          saveUserDetail({
            ...userInfo,
            amount
          });
        }
      }
    });
  };

  // 发布：scanningIndex页面重新获取桌台信息
  issueGetTable = () => {
    onfire.fire("getTableMsg");
  };


  issueGetTable = () => {
    onfire.fire('getTableMsg')
  }

  // 判断是否是储值支付
  judgeIsStoredPay = () => {
    const { payment } = this.state;
    if (payment === PAY_STORED) {
      console.log("会员支付")
      Taro.eventCenter.trigger("openPasswordModal", true);
      return true;
    }
    return false;
  };

  getUserInfo = userInfo => {
    Taro.setStorageSync("userAddress", "");
    if (!needLogin()) return;
    const root = this;
    if (userInfo.detail.userInfo) {
      // 同意
      wx.login({
        success(res) {
          root.wxCode = res.code;
          if (!root.judgeIsStoredPay()) {
            root.payment();
          }
        }
      });
    } else {
      // 拒绝,保持当前页面，直到同意
    }
  };

  payment = storedPayParams => {
    const { enterpriseGuid } = this.state;
    const { dispatch } = this.props;
    if (enterpriseGuid) {
      showLoading();
      const { payment} = this.state;
      this.setState({
        otherMemberPay:storedPayParams,
        storedPayParams
      },this.checkOrder(this.callbackCheckOrder))     
    } 
  };

  // 输入订单备注
  inputRemark = () => {
    navToPage(`/package/orderRemark/orderRemark?oldRemark=${this.state.remark}`);
  };

  // 从其他页面返回回调函数
  goBackCll = params => {
    this.setState({
      remark: params
    });
  };

  // 获取enpertPriseName   
  getEnterpriseName = () => {
    Taro.getStorage({
      key: "tc_island_platform",
      success: res => {
        this.setState({
          enterpriseName: res.data.appName
        });
      }
    });
    Taro.getStorage({
      key: "tc_island_tableInfo",
      success: res => {
        this.setState({
          merchantId: res.data.merchantId,
          tableId:res.data.tableId,
        });
      }
    });


  };


  /**
   * otherplatform 
   * fun=>>> getUserCanUseBonus/getOtherBonus/checkRedPackage/... /encrypt
   * 
   */

  /**
   * 获取用户红包
   * */
  getUserCanUseBonus = () => {
    const {
      payType,
      shoppingCar: { totalAmount, reducePrice, totalFee, discountFee }
    } = this.state;
    // const { orderingInfo, tableInfo } = this.$router.preload
    // const { totalAmount, reducePrice, totalFee, productFee } = orderingInfo
    const payPrice =
      payType === 0
        ? totalAmount - reducePrice + totalFee
        : totalAmount - discountFee + totalFee;
    console.log(payPrice);
    this.props.dispatch({
      type: "userCoupons/getUserOfferCouponAction",
      payload: { platformId: getPlatFormId(), status: 0 },
      callback: ({ ok, data }) => {
        if (ok) {
          const redPackage = data;
          const usableRedPackage = [];
          const unUsableRedPackage = [];
          if (redPackage.length > 0) {
            redPackage.map(o => {
              let useCondition = false;
              switch (o.couponType) {
                case "PLATFORM_USE":
                  useCondition = true;
                  break;
                case "TO_THE_SHOP":
                  useCondition = true;
                  break;
                default:
                  useCondition = false;
              }
              if (o.demandPrice <= payPrice && useCondition) {
                usableRedPackage.push(o);
              } else {
                unUsableRedPackage.push(o);
              }
            });
          }
          this.setState({
            usableRedPackage,
            unUsableRedPackage
          });
        }
      }
    });
  };

  // 获取mdm优惠券
  getOtherBonus = () => {
    // getVolumeListAction
    const { enterpriseGuid } = this.state;
    const {
      openId,
      brandId,
      memberInfoGuid,
      merchantId,
      wxtoken
    } = this.$router.preload;
    console.log(memberInfoGuid);
    console.log(brandId);
    this.props.dispatch({
      type: "otherPlatform/getVolumeListAction",
      payload: {
        headerMessage: {
          enterpriseGuid,
          openId,
          wxtoken,
          "Content-Type": "application/json"
        },
        otherdata: {
          brandGuid: brandId, // 品牌GUID
          enterpriseGuid, // 企业GUID
          mayUseVolume: 0, // 优惠券状态，0可使用的，1已失效的
          memberInfoGuid, // 平台会员GUID
          storeGuid: merchantId, // 门店id
          volumeType: -1 // 券分类，-1全部类型，0代金卷,1折扣卷,2兑换卷
        },
        otherPlatform: true
      },
      callback: ({ ok, data }) => {
        if (ok) {
          if (data.tdata) {
            const { memberVolumeList } = data.tdata;
            console.log(memberVolumeList);
            const usableRedPackage = memberVolumeList;
            const unUsableRedPackage = [];
            // if (redPackage.length > 0) {
            //   redPackage.map(o => {
            //     let useCondition = false
            //     switch (o.couponType) {
            //       case 'PLATFORM_USE': useCondition = true; break
            //       case 'TO_THE_SHOP': useCondition = true; break
            //       default: useCondition = false
            //     }
            //     if (o.demandPrice <= payPrice && useCondition) {
            //       usableRedPackage.push(o)
            //     } else {
            //       unUsableRedPackage.push(o)
            //     }
            //   })
            // }

            this.setState(
              {
                usableRedPackage,
                unUsableRedPackage
              },
              () => {
                console.log(this.state.usableRedPackage);
              }
            );
          }
        }
      }
    });
  };

  // 选择优惠券
  checkRedPackage = item => {
    const { currentRedPackage, confirmRedPackage } = this.state;
    let stateObj = { currentRedPackage: item };
    if (item.id === confirmRedPackage.id) {
      // 当前选中的是已使用的红包
      Taro.showModal({
        title: "确定不使用优惠券吗？",
        confirmText: "是",
        cancelText: "否"
      }).then(res => {
        if (res.confirm) {
          stateObj = {
            currentRedPackage: {},
            confirmRedPackage: {},
            showRedPackModal: false
          };
          this.setState(stateObj);
        }
      });
      return;
    }
    this.setState(stateObj);
  };

  // 打开关闭优惠券弹窗
  useRedPackModal = isConfirm => {
    const {
      showRedPackModal,
      confirmRedPackage,
      usableRedPackage,
      unUsableRedPackage
    } = this.state;
    if (usableRedPackage.length === 0 && unUsableRedPackage.length === 0) {
      showToast("没有可用的优惠券");
      return;
    }
    let stateObj = {
      showRedPackModal: !showRedPackModal,
      currentRedPackage: {}
    };
    if (isConfirm === true) {
      // 点击确定
      stateObj = {
        ...stateObj,
        confirmRedPackage: this.state.currentRedPackage
      };
    }
    if (!showRedPackModal && objNotNull(confirmRedPackage)) {
      // 打开的时候有之前选中的红包
      stateObj = {
        ...stateObj,
        currentRedPackage: confirmRedPackage
      };
    }
    this.setState({ ...stateObj });
  };

  // 计算价格
  calculateTotalAmount = () => {
    const {enterpriseGuid,payAmount,productFee} = this.state;
 
    
    if(enterpriseGuid){
      return payAmount?payAmount:productFee
    }else{
      const {
        shoppingCar: { totalAmount, reducePrice = 0, totalFee, discountFee = 0 },
        confirmRedPackage: { amountOfCoupon = 0 },
        payType,vipCard,enterpriseGuid
      } = this.state;
      const payPrice =
        payType === 0
          ? totalAmount - reducePrice + totalFee
          : totalAmount - reducePrice + totalFee;
      if (amountOfCoupon) {
        return toDecimal(payPrice - amountOfCoupon);
      }
      return toDecimal(payPrice);
    }
  
  };

  //获取订单状态
  getOrdeState = ()=>{
    const {dispatch} = this.props;
    const { enterpriseGuid, wxtoken, openId, orderSn } = this.$router.preload;
    dispatch({
      type: "otherPlatform/getAllCurrentOrderAction",
      payload: {
        headerMessage: {
          enterpriseGuid,
          wxtoken,
          openId
        },
        otherPlatform: true,
        otherdata: {
          orderGuid: orderSn
        }
      },
      callback: ({ ok, data }) => {
        if (ok && data.code == 0) {
          const{tdata:{orderState}} = data;
          if(orderState==2){
            this.clearStorage();
            Taro.redirectTo({
              url: `/package/otherScanOrder/otherPageResult/payResult?orderSn=${orderSn}&enterpriseGuid=${enterpriseGuid}&wxtoken=${wxtoken}&openId=${openId}&type=SCAN_CODE`
            });
            this.setState({
              sureOrder: orderState
            }); 
          }else{
            return
          }                  
        }
      }
    });
  }





 

  // 得到订单商品名字
  getOrderGoodsNmae = tableOrderDetailDTO => {
    let nameStr = "";
    if (
      tableOrderDetailDTO.length > 0 &&
      tableOrderDetailDTO[0].orderBatchDTOs.length > 0
    ) {
      for (let j = 0; j < tableOrderDetailDTO[0].orderBatchDTOs.length; j++) {
        if (j > 0) {
          nameStr += ",";
        }
        if (tableOrderDetailDTO[0].orderBatchDTOs[j].dineItemDTOs.length > 0) {
          for (
            let i = 0;
            i < tableOrderDetailDTO[0].orderBatchDTOs[j].dineItemDTOs.length;
            i++
          ) {
            if (i > 0) {
              nameStr +=
                "," +
                tableOrderDetailDTO[0].orderBatchDTOs[j].dineItemDTOs[i]
                  .itemName;
            } else {
              nameStr +=
                tableOrderDetailDTO[0].orderBatchDTOs[j].dineItemDTOs[i]
                  .itemName;
            }
          }
        }
      }
    }
    return nameStr;
    // const namearr = [];
    // if(tableOrderDetailDTO.length>0&&tableOrderDetailDTO[0].orderBatchDTOs.length>0){
    //     for(let i=0;tableOrderDetailDTO.length>0&&tableOrderDetailDTO[0].orderBatchDTOs[i].length;i++){
    //       if(tableOrderDetailDTO.length>0&&tableOrderDetailDTO[0].orderBatchDTOs[i].length>0){
    //         for(let j=0;tableOrderDetailDTO[0].orderBatchDTOs[i].dineItemDTOs.length;j++){
    //           namearr.push(tableOrderDetailDTO[0].orderBatchDTOs[i].dineItemDTOs[j])
    //         }
    //       }
    //     }
    // }
    // namearr.map()
  };


  // 预订单 A.查询订单信息  (未使用)
  preSubOrderA = callback => {
    const { dispatch } = this.props;
    const {
      wxtoken,
      openId,
      orderSn,
      enterpriseGuid,
      merchantId
    } = this.$router.preload;
    dispatch({
      type: "otherPlatform/otherOrderSetAction",
      payload: {
        headerMessage: {
          enterpriseGuid,
          openId,
          wxtoken,
          source: 8,
          storeGuid: merchantId
        },
        otherdata: {
          orderGuid: orderSn,
          date: new Date().getTime()
        },
        otherPlatform: true
      },
      callback
    });
  };

  // 预订单A 回调函数
  callbackPreSubOrderA = ({ ok, data }) => {
    if (ok && data.code == 0) {
      // orderState  订单状态,0待确认(待接单,快餐不存在)，1已接单（待支付），2已完成，3已取消
      const {
        orderState,
        totlePrice,
        payAmount,
        saleTotlePrice,
        orderGuid,               //商户端的订单guid
        tableOrderDetailDTO,
        storeName,
        enableMemberPrice,
        enterpriseName
      } = data.tdata;

      this.setState({
        enableMemberPrice,
        totlePrice,
        saleTotlePrice,
        payAmount,
      })
      const goodsname = this.getOrderGoodsNmae(tableOrderDetailDTO);
      if (orderState == 1) {
        this.setState(
          { newOrderGuid: orderGuid },
          this.preSubOrderB(this.callbackPreSubOrderB, {
            payAmount,
            orderGuid,
            storeName,
            goodsname,
            enterpriseName
          })
        );
      } else if (orderState == 2) {
        Taro.redirectTo({
          url: `/package/otherPageResult/payResult?orderSn=${orderSn}&enterpriseGuid=${enterpriseGuid}&type=SCAN_CODE`
        });
      }
    }
  };

  // 预订单 B.下单
  preSubOrderB = (callback, data) => {
    const { dispatch } = this.props;
    const { payAmount, orderGuid, storeName, goodsname } = data;
    const { enterpriseName, weappuserId, platformId,openId ,orderSn,enterpriseGuid,merchantId} = this.state;
    const {
      tableInfo:{storeGuid,brandGuid,wxUserInfoDTO:{headImgUrl,isLogin,nickname,sex}}} = this.$router.preload
    const attachDataObj = {
      serialVersionUID:0,
      deviceType:0,
      deviceId:null,
      enterpriseGuid:enterpriseGuid,
      enterpriseName:enterpriseName,
      storeGuid:storeGuid,
      storeName:storeName,
      userGuid:null,
      userName:null,
      account:null,
      requestTimestamp:0,
      saasCallBackUrl:null,
      isQuickReceipt:true,
      isLast:true,
      openId,
    }
    dispatch({
      type: "otherPlatform/preSubOrderBAction",
      payload: {
        platAndUser: {
          platformId:platformId, //49
          weappuserId,
          orderSource: 2
        },
        bodyData: {
          amount: payAmount*100,          //后台要求*100
          enterpriseName: enterpriseName,
          orderGUID: orderGuid   ,//orderGuid,      
          goodsName: goodsname,
          body: "聚合(微信)支付",
          storeName: storeName,
          outNotifyUrl: "/gateway/app/agg/callback",
          attachDataObj,
        }
      },
      callback
    });
  };

  // 预订单B 回调函数
  callbackPreSubOrderB = ({ ok, data }) => {
    if(ok&&data){
    //通知对面我们来支付了
    this.wechatPayMoney(this.callbackWechatPayMoney);
      
    }
    else{
      hideLoading()
      showToast('网络有点差呦')
    }
  };



  //支付前settlement/check
  checkOrder =(callback)=>{
    const{dispatch} = this.props;
    const {
      wxtoken,
      openId,
      orderSn,
      enterpriseGuid,
    } = this.state;
    dispatch({
      type:'otherPlatform/otherOrderCheckAction',
      payload:{
        headerMessage:{
          enterpriseGuid,
          wxtoken,
          openId
        },
        otherdata:{
          orderGuid:orderSn,
        
        },
        otherPlatform : true,  
      },
      callback,

    })
  }
  callbackCheckOrder = ({ok,data})=>{
    if(ok&&data.tdata.code==0){
      //setment
      this.settlementOrder(this.callbackSettlementOrder)
    }
  }


  //支付前settlement/
  settlementOrder =(callback)=>{
    console.log('settlement')
    const{dispatch} = this.props;
    const {
      wxtoken,
      openId,
      orderSn,
      enterpriseGuid,
    } = this.state;
    dispatch({
      type:'otherPlatform/otherOrderSetAction',
      payload:{
        headerMessage:{
          enterpriseGuid,
          wxtoken,
          openId
        },
        otherdata:{
          orderGuid:orderSn,
          date: new Date().getTime()
        },
        otherPlatform : true,  
      },
      callback,

    })
  }
  callbackSettlementOrder = ({ok,data})=>{
    if(ok&&data.code==0){
      //setment
     
      const{payment} = this.state;


      
      const {
        orderState,
        totlePrice,
        saleTotlePrice,
        orderGuid,               //商户端的订单guid
        tableOrderDetailDTO,
        storeName,
        enableMemberPrice,
  
        payAmount,
        tableOrderDetailDTO:[{diningTableName}]
      } = data.tdata;

        const goodsname = this.getOrderGoodsNmae(tableOrderDetailDTO);
      this.setState(
        { newOrderGuid: orderGuid, diningTableName,goodsname,storeName,payAmount},
        this.prePay(this.callbcakPrepay)
      )

      // if(payment =="WECHAT"){
      //   const {
      //     orderState,
      //     totlePrice,
      //     saleTotlePrice,
      //     orderGuid,               //商户端的订单guid
      //     tableOrderDetailDTO,
      //     storeName,
      //     enableMemberPrice,
    
      //     payAmount,
      //     tableOrderDetailDTO:[{diningTableName}]
      //   } = data.tdata;
      //   // const payAmount = enableMemberPrice?saleTotlePrice:totlePrice;
      //   const goodsname = this.getOrderGoodsNmae(tableOrderDetailDTO);
      //   if (orderState == 1) {
      //     this.setState(
      //       { newOrderGuid: orderGuid, diningTableName},
      //       this.preSubOrderB(this.callbackPreSubOrderB, {
      //         payAmount,
      //         orderGuid,
      //         storeName,
      //         goodsname,
      //       })
      //     );
      //   } else if (orderState == 2) {
      //     Taro.redirectTo({
      //       url: `/package/otherPageResult/payResult?orderSn=${orderSn}&enterpriseGuid=${enterpriseGuid}&type=SCAN_CODE`
      //     });
      //   }
      // }else if(payment =="STORED"){       
      //   this.prePay(this.callbcakPrepay)
      // }

    }else{
      showToast("网络错误")
    }
  }
  

  //请求支付 prePayAction
  prePay =(callback)=>{
    const {dispatch} = this.props;
    const {enterpriseGuid,wxtoken,openId,orderSn} =this.state;
    dispatch({
      type:'otherPlatform/prePayAction',
      payload:{
        headerMessage:{
          enterpriseGuid,
          wxtoken,
          openId
        },
        otherdata:{
          orderGuid:orderSn
        },
        otherPlatform : true,  
      },
      callback
    })
  }
  callbcakPrepay = ({ok,data})=>{
    if(ok&&data.tdata.result==0){    //	integer($int32) 0：成功，1：失败
      const{payment,goodsname,newOrderGuid,payAmount,storeName} = this.state;
      if(payment =="WECHAT"){
          // this.preSubOrderB(this.callbackPreSubOrderB, {
          //   payAmount,
          //   orderGuid:newOrderGuid,
          //   storeName,
          //   goodsname,
          // })
          this.otherWechat(this.callbackotherWechat)
      }else{
        this.memberPay()
      }
      
    }     
   
  }

  //不知道调来有没有用的对面的请求
  otherWechat =(callback)=>{
    const {dispatch} = this.props;
    const {newOrderGuid,orderSn,enterpriseGuid,wxtoken,openId} = this.state;
    const outNotifyUrl = `/package/otherScanOrder/otherPageResult/payResult?orderSn=${newOrderGuid}&enterpriseGuid=${enterpriseGuid}&type=SCAN_CODE`
    dispatch({
      type:'otherPlatform/otherWechatAction',
      payload:{
        headerMessage:{
          enterpriseGuid,
          wxtoken,
          openId
        },
        otherdata:{
          orderGuid:orderSn,
          outNotifyUrl,
          deviceType:15,
        },
        otherPlatform : true,  
      },
      callback
    })
  }
  callbackotherWechat = ({ok,data})=>{
    console.log(data);
    if(ok){
      const{payment,goodsname,newOrderGuid,payAmount,storeName} = this.state;
      this.preSubOrderB(this.callbackPreSubOrderB, {
        payAmount,
        orderGuid:newOrderGuid,
        storeName,
        goodsname,
      })
    }
  }

  //会员支付
  memberPay = ()=>{
    const {enterpriseGuid,wxtoken,openId,orderSn} = this.state
    const {storedPayParams:{memberInfoGuid,payPassword,memberInfoCardGuid}} = this.state;
    const {dispatch} = this.props;
    const secretKey = 'x2ulFqJhFFFh3el9'   //对面平台给的
    const ourpwd = this.encrypt(payPassword,secretKey);  //加密
    console.log('会员支付')
    dispatch({
      type:'otherPlatform/memberPayAction',
      payload:{
        headerMessage:{
          enterpriseGuid,
          wxtoken,
          openId
        },
        otherdata:{
          memberPassWord:ourpwd,
          orderGuid:orderSn
        },
        otherPlatform : true,  
      },
      callback:({ok,data})=>{
        console.log(data)
        if(ok&&data.message=='成功'&&data.tdata.result ==0){
          hideLoading();
          this.clearStorage();
          Taro.redirectTo({
            url: `/package/otherScanOrder/otherPageResult/payResult?orderSn=${orderSn}&enterpriseGuid=${enterpriseGuid}&wxtoken=${wxtoken}&openId=${openId}&type=SCAN_CODE`
          });
        }else{
          showToast("支付失败");
        }
      }
    })
  }


  //预下单的支付，通知对面平台B
  orderpPay =()=>{

  }

  //预下单的支付，通知对面平台B
  orderDefrey = (callback)=>{
    const {dispatch} = this.props;
    const {enterpriseGuid,wxtoken,openId,diningTableName,enterpriseName,phone:phoneNum,newOrderGuid} = this.state;
    // const {areaInfo:{areaGuid,areaName},tableInfo:{tableName:tableCode,tableNum:diningTableGuid}} = this.$router.preload
    const {
      tableInfo:{areaGuid,areaName,diningTableCode,diningTableGuid,storeGuid,storeName,brandGuid,wxUserInfoDTO:{headImgUrl,isLogin,nickname,sex}},
      
  
    } = this.$router.preload
    const wxStoreConsumerDTO = {
      areaGuid,areaName,diningTableGuid,diningTableName,openId,storeGuid,tableCode:diningTableCode,

      account:null,brandGuid:null,brandLogo:null,brandName:null,consumerGuid:null,enterpriseGuid,enterpriseName,headImgUrl,city:null,
      isLogin,memberInfoGuid:null,nickName:encodeURI(nickname),phone:null,phoneNum,province:null,sex,storeName,unionId:null,userGuid:null,
      userName:null,
    }
    // const outNotifyUrl = '/gateway/app/agg/callback';   //  

    const outNotifyUrl = `/package/otherScanOrder/otherPageResult/payResult?orderSn=${newOrderGuid}&enterpriseGuid=${enterpriseGuid}&type=SCAN_CODE`
    dispatch({
      type:'otherPlatform/orderDefreyAction',
      payload:{
        headerMessage:{
          enterpriseGuid,
          wxtoken,
          openId
        },
        otherdata:{
          outNotifyUrl,
          wxStoreConsumerDTO,
        },
        otherPlatform : true,  
      },
      callback

    })
  }
  
  callbackOrderDefrey =({ok,data})=>{
    if(ok&&data.tdata.couldPay==1){
      console("可支付");
      this.wechatPayMoney(this.callbackWechatPayMoney);
    }else{
      showToast(data.tdata.errorMsg)
    }
  }

  // 预下单后的支付(聚合支付)  轮询
  wechatPayMoney = callback => {
    const { dispatch } = this.props;
    const { newOrderGuid, weappuserId, platformId ,orderSn} = this.state;
    console.log("聚合支付")
    dispatch({
      type: "otherPlatform/otherPay_wechatAction",
      payload: {
        platformId: platformId, // 49
        weappuserId,
        orderSource: 2,
        orderGUID: newOrderGuid//newOrderGuid  // 不能用orderSn 
      },
      callback
    });
  };


  callbackWechatPayMoney = ({ ok, data }) => {
    if (ok) {
      if ((data.state = "WAIT_PAY")) {     
        if(data.payInfo){                //防止延迟无法获取payinfo信息,5s后在请求一次
          const { newOrderGuid, enterpriseGuid ,orderSn,wxtoken,openId} = this.state
          const payInfo = JSON.parse(data.payInfo);
          Taro.requestPayment({
            timeStamp: payInfo.timeStamp,
            nonceStr: payInfo.nonceStr,
            package: payInfo.package,
            signType: "MD5",
            paySign: payInfo.paySign,
            success(res) {
              hideLoading();
              console.log("支付成功", res);
              this.clearStorage()
              Taro.redirectTo({
                url: `/package/otherScanOrder/otherPageResult/payResult?orderSn=${orderSn}&enterpriseGuid=${enterpriseGuid}&wxtoken=${wxtoken}&openId=${openId}&type=SCAN_CODE`
              });
              this.issueGetTable();
            },
            fail(res) {
              showToast("支付失败");
            },
            complete(res) {
              hideLoading();
              // navToPage('/pages/order/order');
            }
          });
        }else{
          this.wechatPayMoney(this.callback5s)
        }
      }
      else{
        hideLoading();
        showToast("暂时无法支付，请稍后再试")
      }
    }
  };

  //5s请求后的回调
  callback5s =({ok,data})=>{
    if(ok){
      if(data.stata='WAIT_PAY'&&data.payInfo){
        const { newOrderGuid, enterpriseGuid,orderSn ,wxtoken,openId} = this.state
        const payInfo = JSON.parse(data.payInfo);
        Taro.requestPayment({
          timeStamp: payInfo.timeStamp,
          nonceStr: payInfo.nonceStr,
          package: payInfo.package,
          signType: "MD5",
          paySign: payInfo.paySign,
          success(res) {
            hideLoading();
            console.log("支付成功", res);
            this.clearStorage()
            Taro.redirectTo({
              url: `/package/otherScanOrder/otherPageResult/payResult?orderSn=${orderSn}&enterpriseGuid=${enterpriseGuid}&wxtoken=${wxtoken}&openId=${openId}&type=SCAN_CODE`
            });
            // this.issueGetTable();
          },
          fail(res) {
            showToast("支付失败");
          },
          complete(res) {
            hideLoading();
            // navToPage('/pages/order/order');
          }
        });
      }else{
        hideLoading();
        showToast(data.msg)
      }
    }else{
      hideLoading();
      showToast("网络错误")
    }
  }

  // 关闭支付
  closePayment = () => {
    this.setState({
      payBoxVisible: false
    });
  };

  // 选择优惠券
  useVolume = volume => {
    showLoading();
    const {
      merchantId,
      orderSn,
      enterpriseGuid,
      wxtoken,
      openId,
      brandId,
      orderingInfo,
      tableInfo,
      areaInfo
    } = this.$router.preload;
    const { nickName, avatarUrl, gender } = getUserDetail();
    this.props.dispatch({
      type: "otherPlatform/useVolumeAction",
      payload: {
        headerMessage: {
          enterpriseGuid,
          wxtoken,
          openId,
          storeGuid: merchantId
        },
        otherPlatform: true,
        otherdata: {
          orderGuid: orderSn,
          type: 2,
          volumeCode: volume.volumeCode,
          wxStoreConsumerDTO: {
            openId,
            nickName,
            headImgUrl: avatarUrl,
            sex: gender,
            enterpriseGuid,
            storeGuid: merchantId,
            storeName: tableInfo.merchantName,
            diningTableGuid: tableInfo.tableNum,
            tableCode: tableInfo.tableName,
            diningTableName: tableInfo.tableName,
            areaGuid: areaInfo.areaGuid,
            areaName: areaInfo.areaName,
            brandName: "",
            brandGuid: brandId,
            brandLogo: "",
            isLogin: true
          }
        }
      },
      callback: ({ ok, data }) => {
        if (ok) {
          hideLoading();
          this.setState({
            checkVolume: volume
          });
        }
      }
    });
  };

  // 确认使用优惠券
  confirmUseVolume = () => {
    // confirmUseVolumeAction
    const {
      merchantId,
      orderSn,
      enterpriseGuid,
      wxtoken,
      openId,
      brandId,
      orderingInfo,
      tableInfo,
      areaInfo
    } = this.$router.preload;
    const { nickName, avatarUrl, gender } = getUserDetail();
    const { checkVolume } = this.state;
    this.props.dispatch({
      type: "otherPlatform/confirmUseVolumeAction",
      payload: {
        headerMessage: {
          enterpriseGuid,
          wxtoken,
          openId: "",
          storeGuid: merchantId
        },
        otherPlatform: true,
        otherdata: {
          type: 2,
          volumeCode: checkVolume.volumeCode,
          wxStoreConsumerDTO: {
            openId,
            nickName,
            headImgUrl: avatarUrl,
            sex: gender,
            enterpriseGuid,
            storeGuid: merchantId,
            storeName: tableInfo.merchantName,
            diningTableGuid: tableInfo.tableNum,
            tableCode: tableInfo.tableName,
            diningTableName: tableInfo.tableName,
            areaGuid: areaInfo.areaGuid,
            areaName: areaInfo.areaName,
            brandName: "",
            brandGuid: brandId,
            brandLogo: "",
            isLogin: true
          }
        }
      },
      callback: ({ ok, data }) => {
        if (ok) {
          hideLoading();
          this.setState({
            showRedPackModal: false
          });
          this.callBackVolume()
        }
      }
    });
  };

  // 使用优惠券后回调
  callBackVolume = () => {
    const { dispatch } = this.props;
    const {
      wxtoken,
      openId,
      orderSn,
      enterpriseGuid,
      merchantId
    } = this.$router.preload;
    dispatch({
      type: "otherPlatform/otherOrderSetAction",
      payload: {
        headerMessage: {
          enterpriseGuid,
          openId,
          wxtoken,
          source: 8,
          storeGuid: merchantId
        },
        otherdata: {
          orderGuid: orderSn,
          date: new Date().getTime()
        },
        otherPlatform: true
      },
      callback: ({ ok, data }) => {
        const {orderingInfo} = this.state;
        if(ok&&data.code==0){
          this.setState({
            confirmRedPackage: {
              amountOfCoupon: data.tdata.couponFee,
            },
            payAmount:data.tdata.payAmount,
            saleTotlePrice:data.tdata.saleTotlePrice,
            totlePrice:data.tdata.totlePrice,
            enableMemberPrice:data.tdata.enableMemberPrice,
            vipCard: data.tdata.memberCardFee?data.tdata.memberCardFee:0,
          })
        }
    
      }
    })
  }

  //请求另一平台商品数据
  getOtherPlatformData = wxPermission =>{
    const { enterpriseGuid, openId, wxtoken } = this.state
    const { dispatch } =this.props;
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
        if(ok && data.code == 0){
          const{cardList} = data.tdata
          this.translateCartList(cardList);
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

  //从另一平台的数据中拿出cardList
  translateCartList = (data)=>{
    const allCards = data;
    // const {dispatch} = this.props;
    // const {orderSn,enterpriseGuid,wxtoken,openId} = this.state;
    const alreadyStoredCards = allCards.filter(item=>item.uck==1)

    this.setState({
      alreadyStoredCards,
    })
    console.log('取卡')   
  }


  //memberlist
  openMemberCardList = () => {
    const { cardVisble, alreadyStoredCards, enterpriseGuid,sureOrder} = this.state;
    if(sureOrder && enterpriseGuid){
      if (alreadyStoredCards.length > 0) {
        this.setState({
          cardVisble: !cardVisble
        })
      } else {
        showToast('暂无会员卡哦')
      }
    }else{
      showToast("有订单商家未处理");
      return
    }

  }

  //selectMemberCard 选中会员卡操作
  selectMemberCard = (item) =>{
    this.setState({
      selectesCard: item,
    })
  }

  changeCardVisible = () => {
    const { cardVisble } = this.state
    this.setState({
      cardVisble: !cardVisble
    })
  }

  //根据有无会员价修改类名
  updateClassnameA = (state)=>{
    if(state){
      return 'orderDishPayItem hadMemberPrice'
    }else{
      return 'orderDishPayItem'
    }
  }

  //密码加密
  encrypt(word, keyStr){ 
    keyStr = keyStr ? keyStr : 'x2ulFqJhFFFh3el9';
    var key  = CryptoJS.enc.Utf8.parse(keyStr);//Latin1 w8m31+Yy/Nw6thPsMpO5fg==
    var srcs = CryptoJS.enc.Utf8.parse(word);
    var encrypted = CryptoJS.AES.encrypt(srcs, key, {mode:CryptoJS.mode.ECB,padding: CryptoJS.pad.Pkcs7});
    return encrypted.toString();
  }

  //清空缓存
  clearStorage = ()=>{
    Taro.setStorage({
      key:'tc_island_orderInfo',
      data:{
        orderSn:null,wxtoken:null,enterpriseGuid:null,openId:null,payType:null,memberInfoGuid:null,merchantId:null,brandId:null,tableInfo:{},merchantInfo:{}
      }
    })
    Taro.setStorage({
      key:'tc_island_tableInfo',
      data:{
        perNum:null,tableInfo:{},merchantId:null,tableId:null,brandId:null,tableName:null,phone:null,enterpriseGuid:null,openId:null,wxtoken:null,payType:null,merchantAvatar:null
      }
    })
  }







  render() {
    const {
      shoppingCar: {
        totalAmount,
        reducePrice,
        totalFee,
        feeStatus,
        discountFee
      },
      goods,
      unUsableRedPackage,
      currentRedPackage,
      usableRedPackage,
      remark,
      confirmRedPackage: { amountOfCoupon },
      showRedPackModal,
      payment,
      payBoxVisible,
      tableInfo,
      tableInfo: { tableName, peopleNum },
      payType,
      enterpriseGuid,
      checkVolume,
      vipCard,
      cardVisble,
      selectesCard,
      alreadyStoredCards,
      openId,
      wxtoken,
      orderSn
    } = this.state;
    return (
      <View className="orderBox">
        <View className="table">
          <View className="title flex-row flex-ac">
            <View className="icon" />
            <Text>堂食点餐</Text>
          </View>
          <View className="info flex-row flex-ac flex-sb">
            <Text>{`桌号：${tableName}`}</Text>
            <Text>{`${peopleNum}人`}</Text>
          </View>
        </View>
        <View className="orderInfo">
          <View className="orderInfoList">
            {goods.map(ele => {
              const {
                skuId,
                imageUrl,
                productName,
                productPrice,
                productNum,
                spec,
                selfSupportDishPropertyTempList,memberPrice,hasMemberPrice
              } = ele;
              // const skuAttr = `${spec.name}/${selfSupportDishPropertyTempList.map(({ details }) => details).join('/')}`
              const pictureUrl = imageUrl && imageUrl.split(",")[0];
              return (
                <View className="orderListItem" key={skuId}>
                  {imageUrl && (
                    <View className="orderInfoImg">
                      <Image src={getServerPic(pictureUrl)} />
                    </View>
                  )}
                  <View className="orderInfoName flex-row flex-ac flex-sb">
                    <View className="orderDishName ellipsis">
                      {productName}
                    </View>
                    {/* <View className="orderDishSpecs">{skuAttr}</View> */}
                    <View className="orderDishPay orderDishPayPositionBottom flex-row flex-ac flex-sb">
                      <View className="orderDishPayItem">
                        x<Text>{productNum}</Text>
                      </View>
                      <View className={this.updateClassnameA(hasMemberPrice)}>
                        ￥<Text>{productPrice}</Text>
                      </View>
                      {hasMemberPrice&&
                        (<View className="orderDishPayItem">
                          ￥<Text>{memberPrice}</Text>
                        </View>)   
                      }
                      
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
          <View className="orderInfoItem">
            {feeStatus !== 0 && (
              <View className="orderFavourable">
                {`桌台费/${feeStatus === 1 ? "桌" : "人"}：￥${totalFee}`}
              </View>
            )}
            <View className="orderReduce">
              {payType === 0 && reducePrice && (
                <Text className="orderCutMoney">{`已优惠￥${toDecimal(
                  reducePrice
                )}`}</Text>
              )}
              {payType === 1 && discountFee && (
                <Text className="orderCutMoney">{`已优惠￥${toDecimal(
                  discountFee
                )}`}</Text>
              )}
              <Text className="orderPayMoney">{`￥${ this.calculateTotalAmount()}`}</Text>
            </View>
          </View>
        </View>
        {payBoxVisible&&(  <Payment
          createOrder={this.payment}
          payBoxVisible={payBoxVisible}
          paymentAmount={this.calculateTotalAmount()}
          payment={payment}
          onChange={val => {
            console.log("583 confirm=>>>", val);
            this.setState({
              payment: val
            });
          }}
          getUserInfo={this.getUserInfo}
          closePayment={this.closePayment}
          otherstate ={enterpriseGuid?true:false}
          otherwxtoken = {wxtoken}
          otheropenId = {openId}
          otherenterpriseGuid= {enterpriseGuid}
          orderSn={orderSn}
        />)

        }
      
        <View className="fee-wrap">
          <View
            className="flex-row flex-sb flex-ac item ticket-wrap"
            onClick={this.openMemberCardList.bind(this)}
          >
            <Text className="name">会员卡</Text>
            <View className="flex-row flex-ac can-use-ticket">
              <Text className="ticket used">{`-￥${vipCard}`}</Text>
              <IconFont value="icon-arrow-right-copy-copy" size={36} />
            </View>
          </View>
          <View
            className="flex-row flex-sb flex-ac item ticket-wrap"
            hoverClass="hover"
            hoverStartTime={10}
            hoverStayTime={100}
            onClick={this.useRedPackModal.bind(this)}
          >
            <Text className="name">优惠券</Text>
            <View className="flex-row flex-ac can-use-ticket">
              {!enterpriseGuid ? (
                <Text
                  className={`ticket ${
                    confirmRedPackage.amountOfCoupon > 0
                      ? "used"
                      : usableRedPackage.length > 0
                      ? "num"
                      : ""
                  }`}
                >
                  {confirmRedPackage.amountOfCoupon > 0
                    ? `已减${confirmRedPackage.amountOfCoupon}`
                    : usableRedPackage.length > 0
                    ? `${usableRedPackage.length}个优惠券可用`
                    : "暂无可用"}
                </Text>
              ) : (
                <Text
                  className={`ticket ${
                    confirmRedPackage.amountOfCoupon > 0
                      ? "used"
                      : usableRedPackage.length > 0
                      ? "num"
                      : ""
                  }`}
                >
                  {confirmRedPackage.amountOfCoupon > 0
                    ? `已减${confirmRedPackage.amountOfCoupon}`
                    : usableRedPackage.length > 0
                    ? `选择优惠券`
                    : "暂无可用"}
                </Text>
              )}
              <IconFont value="icon-arrow-right-copy-copy" size={36} />
            </View>
          </View>
        </View>
        {payType === 0 && (
          <View
            className="orderRemarks flex-row flex-ac"
            onClick={this.inputRemark}
          >
            <View className="flex-sk">订单备注</View>
            <View className="ellipsis flex1 remark">{remark}</View>
            <Image
              className="orderArrow flex-sk"
              src={`${STATIC_IMG_URL}/icon/icon_arrow.png`}
            />
          </View>
        )}
        {/* <View className="orderCancel">取消订单</View> */}
        {/* <Button
          className="orderPay"
          onClick={() => {
            this.setState({
              payBoxVisible: true
            })
          }}
          // onGetUserInfo={this.getUserInfo}
          // open-type="getUserInfo"
        >
          <Text>确认支付</Text>
          <Text>{`¥${this.calculateTotalAmount()}`}</Text>
        </Button> */}
        {/* disabled={!this.state.sureOrder && enterpriseGuid} */}
        <Button
          disabled={!this.state.sureOrder && enterpriseGuid}
          className="orderPay"
          onClick={() => {
            this.setState({
              payBoxVisible: true
            })
          }}
          // onGetUserInfo={this.getUserInfo}
          // open-type="getUserInfo"
        >
          {/* *    {!enterpriseGuid
              ? "确认支付"
          : "支付功能尚未开通"}*/}
          <Text>
            {this.state.sureOrder || !enterpriseGuid
              ? "确认支付"
              : "商家还未接单"}
          </Text>
          <Text>{`¥${this.calculateTotalAmount()}`}</Text>
        </Button>

        {/* 使用红包弹窗 */}
        <AtFloatLayout
          isOpened={showRedPackModal}
          onClose={() => {
            this.setState({ showRedPackModal: false });
          }}
        >
          {!enterpriseGuid ? (
            <View className="flex-col package-wrap">
              <View className="flex-row flex-ac flex-sb modal-header">
                <Button
                  className="title-btn cancel hide"
                  hoverClass="hover"
                  onClick={this.useRedPackModal.bind(this)}
                >
                  取消
                </Button>
                <View className="flex1 title">请选择优惠券</View>
                <Button
                  className={`title-btn confirm ${
                    !currentRedPackage.id ? "disabled" : ""
                  }`}
                  hoverClass="hover"
                  disabled={!currentRedPackage.id}
                  onClick={this.useRedPackModal.bind(this, true)}
                >
                  确定
                </Button>
              </View>
              <ScrollView scrollY className="list-wrap">
                {usableRedPackage.map((o, i) => {
                  const {
                    amountOfCoupon,
                    couponName,
                    endDate,
                    id,
                    demandPrice,
                    couponType
                  } = o;
                  return (
                    <View
                      className="flex-row flex-ac item"
                      hoverClass="hover"
                      hoverStartTime={10}
                      hoverStayTime={100}
                      key={i}
                      onClick={this.checkRedPackage.bind(this, o)}
                    >
                      <View className="flex-col flex-ac flex-jc left">
                        <View>
                          <Text className="rmb">￥</Text>
                          <Text className="money">
                            {formatCurrency(amountOfCoupon)}
                          </Text>
                        </View>
                        <Text className="description">
                          {demandPrice !== 0
                            ? `满${demandPrice}可用`
                            : "无金额限制"}
                        </Text>
                      </View>
                      <View className="flex1 flex-col flex-sb right">
                        <View className="flex-row flex-ac flex-sb">
                          <View className="flex1 ellipsis title">
                            {couponName}
                          </View>
                          {currentRedPackage.id === id && (
                            <IconFont value="imgHook" h={34} w={34} />
                          )}
                        </View>
                        <View className="date">{`${COUPON_CONDITION[couponType]}`}</View>
                        <View className="date">
                          {endDate.replace("T", " ")}
                          到期
                        </View>
                      </View>
                    </View>
                  );
                })}

                {unUsableRedPackage.length > 0 && (
                  <Block>
                    {usableRedPackage.length > 0 && (
                      <View className="flex-row flex-ac disabled-title">
                        <Text className="text">不可用优惠券</Text>
                      </View>
                    )}
                    {unUsableRedPackage.map((o, i) => {
                      const {
                        amountOfCoupon,
                        couponName,
                        endDate,
                        couponType,
                        demandPrice
                      } = o;
                      return (
                        <View
                          className="flex-row flex-ac item"
                          hoverClass="hover"
                          hoverStartTime={10}
                          hoverStayTime={100}
                          key={`disabled_${i}`}
                        >
                          <View className="flex-col flex-ac flex-jc disabled-ticket">
                            <View>
                              <Text className="rmb">￥</Text>
                              <Text className="money">
                                {formatCurrency(amountOfCoupon)}
                              </Text>
                            </View>
                            <Text className="description">
                              {demandPrice !== 0
                                ? `满${demandPrice}可用`
                                : "无金额限制"}
                            </Text>
                          </View>
                          <View className="flex1 flex-col flex-sb right">
                            <View className="flex-row flex-ac flex-sb">
                              <View className="flex1 ellipsis title">
                                {couponName}
                              </View>
                            </View>
                            <View className="date">{`${COUPON_CONDITION[couponType]}商品使用`}</View>
                            <View className="date">
                              {endDate.replace("T", " ")}
                              到期
                            </View>
                            {/* <View */}
                            {/* className="limit" */}
                            {/* > */}
                            {/* 限本平台使用。限登陆手机号为 */}
                            {/* {o.consumerPhone || '本账号手机'} */}
                            {/* 使用。 */}
                            {/* </View> */}
                          </View>
                        </View>
                      );
                    })}
                  </Block>
                )}
              </ScrollView>
            </View>
          ) : (
            <View className="flex-col package-wrap">
              <View className="flex-row flex-ac flex-sb modal-header">
                <Button
                  className="title-btn cancel hide"
                  hoverClass="hover"
                  onClick={() => {
                    this.setState({
                      showRedPackModal: false,
                      checkVolume: {}
                    });
                  }}
                >
                  取消
                </Button>
                <View className="flex1 title">请选择优惠券</View>
                <Button
                  // ${!currentRedPackage.id ? 'disabled' : ''}
                  className={`title-btn confirm `}
                  hoverClass="hover"
                  // disabled={!currentRedPackage.id}
                  onClick={this.confirmUseVolume.bind(this, true)}
                >
                  确定
                </Button>
              </View>
              <ScrollView scrollY className="list-wrap">
                {usableRedPackage.map((o, i) => {
                  const {
                    volumeType,
                    volumeMoney,
                    useThresholdFull,
                    useThreshold,
                    volumeInfoName,
                    volumeEndDate,
                    volumeCode
                  } = o;
                  return (
                    <View
                      className="flex-row flex-ac item"
                      hoverClass="hover"
                      hoverStartTime={10}
                      hoverStayTime={100}
                      key={i}
                      onClick={this.useVolume.bind(this, o)}
                    >
                      <View className="flex-col flex-ac flex-jc left">
                        <View>
                          {volumeType !== 3 && <Text className="rmb">￥</Text>}
                          <Text className="money">
                            {volumeType === 0
                              ? formatCurrency(volumeMoney)
                              : volumeType === 3
                              ? "商品券"
                              : ""}
                          </Text>
                        </View>
                        {volumeType === 0 ? (
                          <Text className="description">
                            {useThreshold === 1
                              ? `满${useThresholdFull}可用`
                              : "无金额限制"}
                          </Text>
                        ) : null}
                      </View>
                      <View className="flex1 flex-col flex-sb right">
                        <View className="flex-row flex-ac flex-sb">
                          <View className="flex1 ellipsis title">
                            {volumeInfoName}
                          </View>
                          {checkVolume.volumeCode === volumeCode && (
                            <IconFont value="imgHook" h={34} w={34} />
                          )}
                        </View>
                        {/* <View className="date">{`${COUPON_CONDITION[couponType]}`}</View> */}
                        <View className="date">
                          {volumeEndDate}
                          到期
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </AtFloatLayout>

        {/**会员卡列表 */}
        <ChooseVipCard
          cardVisble={cardVisble}
          alreadyStoredCards={alreadyStoredCards}
          openMemberCardList={this.openMemberCardList}
          getOtherPlatformData={this.callBackVolume}
          enterpriseGuid={enterpriseGuid}
          openId={openId}
          wxtoken={wxtoken}
          selectMemberCard={this.selectMemberCard}
          selectesCard={selectesCard}
          changeCardVisible={this.changeCardVisible}
          paypage={true}
        />
      </View>
    )
  }
}
