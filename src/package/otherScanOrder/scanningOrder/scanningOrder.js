import Taro, { Component } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import './scanningOrder.scss'
import {
  getServerPic, toDecimal
} from '../../../utils/utils'
import IconFont from '../../../components/IconFont/IconFont'
import PageLoading from '../../../components/PageLoading/PageLoading'
const STATIC_ICON_URL = 'http://resource.canyingdongli.com/island-zhuancan/icon/'

const dayjs = require('dayjs')

@connect(({
  loading: { effects }
}) => ({
  effects
}))
export default class ScanningOrder extends Component {
  config = {
    navigationBarTitleText: '订单详情',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      orderDetail: {},
      noOrder: false
    }
  }
  componentWillMount(){
    console.log('this.$router.params')
  }

  componentDidMount() {
    this.loadDetail()
  }
  componentWillUnmount () {
    console.log("卸载")
    Taro.redirectTo({url:'/pages/index/index'})
  }


  loadDetail = () => {
    const { orderSn ,enterpriseGuid,openId, wxtoken,} = this.$router.params;
    console.log('this.$router.params',this.$router.params)
    if(enterpriseGuid){
      console.log("请求订单数据")
      this.props.dispatch({
        type:'otherPlatform/getAllCurrentOrderAction',
          payload:{
            headerMessage:{
              enterpriseGuid,
              openId,
              wxtoken,
            },
            otherdata:{ orderGuid:orderSn},
            otherPlatform:true,
          },
          callback:({ok,data})=>{
            console.log('下拉获取订单数据变化',data)
            if(ok&&data.code==0){
              // orderState  订单状态,0待确认(待接单,快餐不存在)，1已接单（待支付），2已完成，3已取消
              const newdata = this.translateData(data.tdata);
              console.log(newdata);
              this.setState({
                orderDetail: newdata,
                noOrder: false
              })
            }else{
              this.setState({
                noOrder: true
              })
            }
            // Taro.redirectTo({ url: `/pages/payResult/payResult?orderSn=${data.orderSn}&type=SCAN_CODE` });  
          }
      })
    }else{
      this.props.dispatch({
        type: 'order/getOrderDetailAction',
        payload: { orderSn },
        callback: ({ ok, data }) => {
          console.log(data);
          if (ok) {
            this.setState({
              orderDetail: data,
              noOrder: false
            })
          } else {
            this.setState({
              noOrder: true
            })
          }
        }
      })
    }
   
  }

  //数据格式转化
  translateData = (tdata)=>{
    const {tableOrderDetailDTO} = tdata;
    const newOrderDetail = {
      addTime: Math.floor(new Date(tdata.gmtCreate).getTime()/1000),
      addIp:tdata.guid,
      amount: tdata.payAmount,   //价格
      bindingBuy: null,
      brandAndMerchantType: null,
      brandId: tdata.brandGuid,    
      brandName: tdata.brandName,
      brokerage: null,
      brokerageAmount: null,
      consumerId: null,  
      consumerPhone: null,
      countFlag: false,
      couponFee: 0,
      couponId: null,
      couponSn: null,
      dayCount: 2,
      deliverFee: null,
      deliveryId: null,
      discountDetail: "{}",
      discountFee: 0,
      expired: false,
      externalBrandNo: null,
      externalMerchantNo: null,
      fastMailCompany: null,
      fastMailCompanyCode: null,
      fastMailSn: null,
      firstOrderSub: 0,
      freeShipping: false,
      fullReduction: 0,
      fullReductionActivity: null,
      haveOriginalProduct: false,
      holderCardRechargeDTO: null,
      id: tdata.orderGuid,
      infoId: null,
      islandFreeLunchDTO: null,
      islandFreeLunchId: null,
      islandFreeLunchUserInfoDTO: null,
      joinResult: null,
      leWanOrderNo: null,
      mealNumber: null,
      memberAmount: null,
      memberConsumptionGuid: null,
      memberInfoCardGuid: null,
      memberInfoGuid: null,
      merchantId: tdata.storeGuid,
      merchantModel:{id:tdata.storeGuid,merchant_name:tdata.storeName} ,  
      merchantName: null,
      merchantNo: tdata.storeGuid,
      merchantPhone: null,
      merchantRefunds: null,
      merchantRefundsReason: null,
      merchantRevoked: false,
      merchantUserId: null,
      noDiscountFee: null,
      notUseCount: 0,
      offerDiscountDetailsDTO: null,
      oldPlatformId: 142,
      operateTime: Math.floor(new Date(tdata.checkoutTime).getTime()/1000),       //取消时间
      orderActivityList: [],
      orderCount: null,
      orderNum: 0,
      orderSn: tdata.orderNo,
      orderSource: "QR_ORDER",
      orderState: "PENDING",    //orderState  订单状态,0待确认(待接单,快餐不存在)，1已接单（待支付），2已完成，3已取消
      orderStateInfo: null,
      orderToThirdParty: null,
      orderType: "SCAN_CODE",
      orderWriteOffCodeDTOS: null,
      outRefundNo: null,
      packFee: 0,
      partnerCommission: null,
      partnerLevelId: null,
      payPassword: null,
      payState: "PAYED",  //tdata.orderState
      payTime: Math.floor(new Date(tdata.checkoutTime).getTime()/1000),   //结算时间
      payUrl: "",
      payWay: 4,
      paymentOrderCode: tdata.orderNo,
      peopleNum: tdata.guestCount,
      personName: null,
      personPhone: null,
      platformId: 161,
      platformUserId: null,
      printState: "PRINTED",
      printTime: 1587020806,
      productEffectiveDays: null,
      productFee: 30,
      rangeCode: null,
      receipt: false,
      refundsFee: null,
      refundsSuccess: null,
      remindersCount: 0,
      remindersFlag: 0,
      requestRefunds: null,
      requestRefundsFlag: false,
      requestRefundsReason: null,
      requestRefundsTime: null,
      sendDeliveryState: "UNSEND",
      sendDeliveryTime: null,
      sendPrice: null,
      settlement: true,
      settlementDate: "2020-04-16T07:06:45.000Z",
      shareUserId: null,
      shippingFee: 0,
      shippingListModels: null,
      shopHongBaoDTO: null,
      shopOrderExtendedInfoDTO: [],
      shopOrderProductInfoDTOS:getShopOrderProductInfoDTOS(tableOrderDetailDTO),
      shoppingCartUid: null,
      spikeActivity: false,
      tableFee: 0,//{feeStatus: 1, fee: 4, totalFee: 4},
      tableName: tdata.diningTableCode,
      tableNum: tdata.diningTableGuid,
      tcCardAmount: 0,
      tcdMerchantNo: 7376845944046847,
      thirdPartyType: null,
      toTheStoreRefundsFlag: null,
      totalAmount: tdata.payAmount,   //payAmount计算了折扣之后的价格
      unfinishedReason: null,
      useEndTime: null,
      useMdmPay: false,
      useMerchantList: null,
      useRules: null,
      useStartTime: null,
      whoRefunds: null,
      settlementItemDTOs:tdata.settlementItemDTOs
    }


    function getShopOrderProductInfoDTOS(tableOrderDetailDTO){
      const  shopOrderProductInfoDTOS = [];
      const { orderBatchDTOs } = tableOrderDetailDTO[0];
      for(let i=0;i<orderBatchDTOs.length;i++){  
        for(let j=0;j<orderBatchDTOs[i].dineItemDTOs.length;j++){   
                 
              const orderProductInfoDTO = {
                  activityId: null,
                  activityType: null,
                  categoryName: null,
                  cost: null,
                  externalSkuNo: null,
                  id: null,
                  imageUrl:orderBatchDTOs[i].dineItemDTOs[j].itemImg,
                  itemGuid: null,
                  itemName: null,
                  marketPrice: 0,
                  memberPrice: orderBatchDTOs[i].dineItemDTOs[j].hasMemberPrice?orderBatchDTOs[i].dineItemDTOs[j].saleTotlePrice/orderBatchDTOs[i].dineItemDTOs[j].amount:null,  //没有会员卡时没有saleTotlePrice
                  mustChoose: false,
                  packFee: 0,
                  packageInfoList: null,
                  productId: orderBatchDTOs[i].dineItemDTOs[j].skuGuid,
                  productName: orderBatchDTOs[i].dineItemDTOs[j].itemName,
                  productNum: orderBatchDTOs[i].dineItemDTOs[j].amount,
                  productPrice: orderBatchDTOs[i].dineItemDTOs[j].totlePrice/orderBatchDTOs[i].dineItemDTOs[j].amount + getAttrPrice(orderBatchDTOs[i].dineItemDTOs[j].itemAttrDTOS),    //不能直接用price 使用的会员卡的时候没有price 只有saleTotlePrice和totlePrice
                  productType: orderBatchDTOs[i].dineItemDTOs[j].itemGuid,
                  selfSupportDishPropertyTempList: getSelfSupportDishPropertyTempList(orderBatchDTOs[i].dineItemDTOs[j].itemAttrDTOS) ,
                  shopOrderId: null,
                  skuId: orderBatchDTOs[i].dineItemDTOs[j].skuGuid,
                  spec: getSpec(orderBatchDTOs[i].dineItemDTOs[j].itemAttrDTOS,orderBatchDTOs[i].dineItemDTOs[j].skuName,orderBatchDTOs[i].dineItemDTOs[j].totlePrice/orderBatchDTOs[i].dineItemDTOs[j].amount),
                  subtotal: 20,
                  thirdNo: null,
                  thirdPartyType: null,
                  typeThirdNo: null,
                  tableName: tableOrderDetailDTO[0].tableCode,
                  tableNum: tableOrderDetailDTO[0].tableGuid,
                  tcCardAmount: 0,
                  tcdMerchantNo: null,
                  thirdPartyType: null,
                  toTheStoreRefundsFlag: null,
                  totalAmount: null,
                  unfinishedReason: null,
                  useEndTime: null,
                  useMdmPay: false,
                  useMerchantList: null,
                  useRules: null,
                  useStartTime: null,
                  whoRefunds: null,
                  hasMemberPrice: orderBatchDTOs[i].dineItemDTOs[j].hasMemberPrice
              }
              shopOrderProductInfoDTOS.push(orderProductInfoDTO)
        }    
      }
      return shopOrderProductInfoDTOS;
    }

        //得到口味
    function getSpec (itemAttrDTOS,skuName,price){
        if(itemAttrDTOS){
            if(itemAttrDTOS.length>0){
                let strAttr  = skuName +='('
                for(let i=0;i<itemAttrDTOS.length;i++){
                    strAttr += itemAttrDTOS[i].attrName + ' ';     
                }
                strAttr +=')'
                const spec = {
                    name:strAttr?strAttr:'',
                    packNum: null,
                    packPrice: null,
                    price: price,
                    skuGuid: null,
                    unit: null,
                };
                return spec
                
            }else{
                const spec = {
                    name:'',
                    packNum: null,
                    packPrice: null,
                    price: null,
                    skuGuid: null,
                    unit: null,
                };
                return spec
            }
        }else{
            const spec = {
                name:'',
                packNum: null,
                packPrice: null,
                price: null,
                skuGuid: null,
                unit: null,
            };
            return spec
        }
      
    }
  
      function getSelfSupportDishPropertyTempList(itemAttrDTOS){
  
          const selfSupportDishPropertyTempList = [];
          if(itemAttrDTOS){
              if(itemAttrDTOS.length>0){  
                  for(let i=0;i<itemAttrDTOS.length;i++){
                      const  aSelfSupportDishProperty = {
                          details:itemAttrDTOS[i].attrName,
                          id: itemAttrDTOS[i].attrGuid,
                          name: "",
                      }
                      selfSupportDishPropertyTempList.push(aSelfSupportDishProperty);
                  }
                 
              }
          }
         
  
          return selfSupportDishPropertyTempList
      }
  
      //得到口味价格
      function getAttrPrice(itemAttrDTOS){
        let attrPrice = 0;
        if(itemAttrDTOS){
          if(itemAttrDTOS.length>0){
            for(let i=0;i<itemAttrDTOS.length;i++){
              attrPrice += itemAttrDTOS[i].attrPrice
            }
            
          }
        }
        
        return attrPrice;
      }

    return newOrderDetail


    


  }
 

  notFullReductionMoney = () => {
    // const {
    //   orderDetail: {
    //     fullReductionActivity,
    //     shopOrderProductInfoDTOS = []
    //   }
    // } = this.state
    // const requiredGoods = shopOrderProductInfoDTOS.reduce((acc, cur) =>  , 0)
  }


  render() {
    const {
      orderDetail: {
        orderState, shopOrderProductInfoDTOS = [],
        shopOrderExtendedInfoDTO,
        orderSn, amount, addTime, operateTime,
        totalAmount, fullReduction, tableName,
        peopleNum, mealNumber, couponFee, discountFee, tableFee,
      }, noOrder,enterpriseGuid
    } = this.state
    const { orderRemark } = shopOrderExtendedInfoDTO || {}
    const {
      effects = {}
    } = this.props
    return (
      <View className="orderBox">
        {
          effects['order/getOrderDetailAction'] && <PageLoading />
        }
        {
          noOrder && (
            <View
              className="noOrder flex-col flex-ac flex-jc"
            >
              <IconFont value="imgNoOrder" w={172} h={150} />
              <Text className="weight">订单生成中</Text>
              <Text
                className="refresh"
                onClick={this.loadDetail}
              >
                点击刷新
              </Text>
            </View>
          )
        }
        {
          orderState === 'PENDING' && (
            <View className="orderHeader">
              <View className="orderHeaderItem orderItemAgo">
                <Image src={`${STATIC_ICON_URL}scan_pay.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">已接单</View>
              </View>
              <View className="orderHeaderLine"/>
              <View className="orderHeaderItem">
                <Image src={`${STATIC_ICON_URL}scan_order.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">已付款</View>
              </View>
            </View>
          )
        }
        {
          orderState === 'COOKING' && (
            <View className="orderHeader">
              <View className="orderHeaderItem orderItemAgo">
                <Image src={`${STATIC_ICON_URL}scan_pay.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">已付款</View>
              </View>
              <View className="orderHeaderLine"/>
              <View className="orderHeaderItem orderItemAgo">
                <Image src={`${STATIC_ICON_URL}scan_order.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">已接单</View>
              </View>
              <View className="orderHeaderLine"/>
              <View className="orderHeaderItem">
                <Image src={`${STATIC_ICON_URL}scan_meal.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">用餐中</View>
              </View>
            </View>
          )
        }
        {
          orderState === 'CANCELLED' && (
            <View className="orderHeader">
              <View className="orderHeaderItem orderItemAgo">
                <Image src={`${STATIC_ICON_URL}scan_pay.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">已付款</View>
              </View>
              <View className="orderHeaderLine"/>
              <View className="orderHeaderItem orderItemAgo">
                <Image src={`${STATIC_ICON_URL}scan_order.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">待接单</View>
              </View>
              <View className="orderHeaderLine"/>
              <View className="orderHeaderItem">
                <Image src={`${STATIC_ICON_URL}scan_order.png`}
                       className="orderItemImg"/>
                <View className="orderItemWord">取消订单</View>
              </View>
            </View>
          )
        }
        {
          orderState === 'CANCELLED' && (
            <View className="orderCancelBox">
              <View className="orderCancelTitle">商家取消了订单</View>
              <View className="orderCancelWord marginT">取消原因：购买期间没有骑手接单</View>
              <View className="orderCancelWord paddingB">您支付的款项将会在1-7个工作日内返回您的原支付渠道</View>
              <View className="orderCancelFooter">
                <View className="cancelFooterTitle">退款进度</View>
                <View className="cancelFooterStatus">已退款</View>
              </View>
            </View>
          )
        }
        <View className="tableInfo flex-row flex-sb">
          <Text>{`桌号：${tableName} ${mealNumber ? `餐号：${mealNumber}` : ''}`}</Text>
          <Text>{`${peopleNum}人`}</Text>
        </View>
        <View className="orderInfo">
          <View className="orderInfoList">
            {
              shopOrderProductInfoDTOS.map(ele => {
                const {
                  imageUrl = '', productName, productNum,
                  skuId, productPrice
                } = ele
                const pictureUrl = imageUrl && imageUrl.split(',')[0]
                return (
                  <View className="orderListItem" key={skuId}>
                    {
                      pictureUrl && (
                        <View className="orderInfoImg flex-sk">
                          <Image src={getServerPic(pictureUrl)}/>
                        </View>
                      )
                    }
                    <View className="orderInfoName flex-row flex-ac flex-sb">
                      <View className="orderDishName">{productName}</View>
                      <View className="orderDishPay orderDishPayPositionBottom">
                        <View className="orderDishPayItem">
                          x
                          <Text>{productNum}</Text>
                        </View>
                        <View className="orderDishPayItem">
                          ￥
                          <Text>{productPrice}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )
              })
            }
          </View>
          {
            fullReduction > 0 && (
              <View className="orderInfoItem">
                <View className="orderFavourable">
                  <Text className="orderActive">满减</Text>
                </View>
                <View className="orderReduce">
                  <Text>-￥</Text>
                  {fullReduction}
                </View>
              </View>
            )
          }
          {
            tableFee && tableFee.totalFee && (
              <View className="orderInfoItem">
                <View className="orderFavourable">
                  <Text className="coupon">桌台费</Text>
                </View>
                <View className="orderReduce">
                  <Text>￥</Text>
                  {tableFee.totalFee}
                </View>
              </View>
            )
          }
          {
            couponFee && (
              <View className="orderInfoItem">
                <View className="orderFavourable">
                  <Text className="coupon">优惠券</Text>
                </View>
                <View className="orderReduce">
                  <Text>-￥</Text>
                  {couponFee}
                </View>
              </View>
            )
          }
          {/* {settlementItemDTOs&&settlementItemDTOs.length>0(
            settlementItemDTOs.map((e,i)=>{
                const{itemName,ioType,moneyAmount,type} = e
                const addOrReduce = ioType==0?"-":"+";
              return (<View className="orderInfoItem">
                      <View className="orderFavourable">
                      <Text className="coupon">{itemName}</Text>
                    </View>
                    <View className="orderReduce">
                      <Text>{addOrReduce}￥</Text>
                      {moneyAmount}
                    </View>
                    </View>)
              })
            )  */}

          <View className="orderInfoItem">
            <View className="orderFavourable"/>
            <View className="orderReduce">
              {
                discountFee && (
                  <Text className="orderCutMoney">已优惠￥{toDecimal(discountFee)}</Text>
                )
              }
              <Text className="orderPayMoney">￥{amount}</Text>
            </View>
          </View>
        </View>
        {
          orderRemark && (
            <View className="orderRemarks">
              <View className="flex-sk">订单备注</View>
              <View className="ellipsis">{orderRemark}</View>
              <Image 
                className="orderArrow flex-sk"
                src={`${STATIC_ICON_URL}/icon_arrow.png`}
              />
            </View>
          )
        }
        <View className="orderTimeBox">
          <View className="orderTimeItem">
            <View>订单编号</View>
            <View>{orderSn}</View>
          </View>
          <View className="orderTimeItem">
            <View>创建时间</View>
            <View>{dayjs(addTime * 1000)
              .format('YYYY-MM-DD HH:mm:ss')}</View>
          </View>
          {
            !enterpriseGuid&& <View className="orderTimeItem">
            <View>支付时间</View>
            <View>{dayjs(operateTime * 1000).format('YYYY-MM-DD HH:mm:ss')}</View>
          </View>
          }
         
          {
            orderState === 'CANCELLED' && (
              <View className="orderTimeItem">
                <View>取消时间</View>
                <View>{dayjs(operateTime * 1000)
                  .format('YYYY-MM-DD HH:mm:ss')}</View>
              </View>
            )
          }
        </View>
      </View>
    )
  }
}
