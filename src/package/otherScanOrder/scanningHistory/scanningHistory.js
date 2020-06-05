import Taro, { Component } from '@tarojs/taro'
import { View  } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import './scanningHistory.scss'
import { getServerPic, toDecimal, navToPage, imitateObjectValues, showLoading, hideLoading, showToast } from '../../../utils/utils'
import { AtIcon } from 'taro-ui'

import { STATIC_IMG_URL, PLATFORM_ID } from '../../../config/baseUrl'

@connect(({ orderDishes }) => ({
  
}))
export default class ScanningHistory extends Component {
  config = {
    navigationBarTitleText: '确认订单',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      merchantId: this.$router.params.merchantId,
      orderSn: this.$router.params.orderSn&&this.$router.params.orderSn!='undefined'?this.$router.params.orderSn:null,
      newGoods: [],
      shoppingCar: {},
      tableInfo: {},
      historyGoodes: [],
      friendSettleVisible: false,
      remark: '',
      orderingInfo: {},
      oldOrder: {},
      oldProcuct: [],
      payType: 0,
      merchantInfo: {},
      clickNum: 1,
      tableFee: 0,


      enterpriseGuid:this.$router.params.enterpriseGuid?this.$router.params.enterpriseGuid:null,
      wxtoken:this.$router.params.wxtoken?this.$router.params.wxtoken:null,
      openId:this.$router.params.openId?this.$router.params.openId:null,
      peopleNum:this.$router.params.peopleNum?this.$router.params.peopleNum:null,
      orderRecordGuid:null,
      memberInfoGuid: this.$router.params.memberInfoGuid ? this.$router.params.memberInfoGuid : null
    }
  }

  componentDidUpdate(){
   
  }

  componentDidMount() {
    const { orderSn,enterpriseGuid } = this.state;
    const { orderingInfo, tableInfo, payType, currentMerchant } = this.$router.preload;
    console.log('orderSn+=>>>>>',this.$router.params)
    console.log('newGoods=>>>>',this.$router.preload)
    if (orderSn && orderSn !== 'null'&&orderSn!=="undefined") {
      console.log(orderSn);
      this.getOrder(orderSn)
    }
    this.setState({
      newGoods: this.getOrderGoods(this.$router.preload),
      shoppingCar: orderingInfo,
      tableInfo,
      payType,
      merchantInfo: currentMerchant,
      tableFee: orderingInfo.totalFee
    })
  }

  getOrder = orderSn => {
    const { merchantId ,enterpriseGuid,wxtoken,openId} = this.state;
    const dispatch = this.props.dispatch
    if(enterpriseGuid){
       this.getCurrentorder(this.callbackgetCurrentOrder,orderSn)
    }
  
  }

  getOrderGoods = item => {
    const {
      allProduct,
      orderingInfo: { productInTrolleyDTO },
      currentMerchant: { id: merchantId },
      brandId
    } = item;
    return allProduct
      .reduce((arr, { shopDishProductCats }) => [...arr, ...shopDishProductCats], [])
      .reduce((arr, acc) => {
        const { shopDishSkus, dishImageUrl } = acc
        shopDishSkus.map(ele => {
          const { id } = ele
          productInTrolleyDTO.map(car => {
            const {
              productId: carSkuId, attribute = '',
              dishName, number, price,enablePreferentialPrice,memberPrice,
              numLimitType, shopLimitType, limitBuyNum, spec, trueProductId
            } = car
            let isAttribute = true
            let isAttributeList = []
            isAttributeList.push(true)
            for (const key in attribute) {
              arr.map(val => {
                val.selfSupportDishPropertyTempList.map(o => {
                  if (o.id == key && o.details == attribute[key]) {
                    isAttributeList.push(false)
                  } else {
                    isAttributeList.push(true)
                  }
                })
              })
            }
            if (isAttributeList.includes(true)) {
              isAttribute = true
            } else {
              isAttribute = false
            }
            if (carSkuId === id && isAttribute) {
              const attr = attribute ? imitateObjectValues(attribute)
                .join(',') : ''
              const productName = `${dishName}`
              const productDes = `${spec && spec !== null ? spec : ''}${attr && `(${attr})`}`
              const selfSupportDishPropertyTempList = []
              for (const key in attribute) {
                selfSupportDishPropertyTempList.push({
                  id: key,
                  merchantId,
                  brandId,
                  name: '',
                  details: attribute[key]
                })
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
                memberPrice:enablePreferentialPrice?memberPrice:null,
                enablePreferentialPrice:enablePreferentialPrice,
                imageUrl: dishImageUrl,
                numLimitType,
                shopLimitType,
                limitBuyNum,
                spec: {
                  name: productDes || '',
                  packNum: '',
                  packPrice: '',
                  price
                },
                productId: trueProductId,
                selfSupportDishPropertyTempList
              })
            }
          })
        })
        return arr
      }, [])
  }

  // 计算价格
  calculateTotalAmount = () => {
    const {
      shoppingCar: {
        totalAmount, reducePrice, totalFee
      }
    } = this.state
    const payPrice = totalAmount - reducePrice + totalFee
    return toDecimal(payPrice)
  }

  // 提交订单
  submitOrder = () => {
    showLoading('订单正在提交中...')
    const { newGoods, tableInfo, shoppingCar, remark, orderSn ,enterpriseGuid,openId,wxtoken,peopleNum} = this.state
    const {
      currentMerchant,
      brandId
    } = this.$router.preload
    let extendedInfo = {
      orderMark: remark
    }
    if(enterpriseGuid){
      this.props.dispatch({
        type:'otherPlatform/otherSubmitOrderAction',
        payload:{
          headerMessage:{
            enterpriseGuid,
            openId,
            wxtoken,
          },
          otherPlatform:true,
          otherdata:{
            remark,
            userCount:peopleNum,
          }
        },
        callback:({ok,data})=>{
          console.log(data);
          if(ok&&data.code ==0 ){
            hideLoading()
            console.log(data);   //orderGuid:6651394249394749440;

            if(data.tdata.errorMsg){
              showToast("数据已经失效");
              Taro.navigateBack();
            }else{
              this.setState({
                friendSettleVisible: true,
                orderSn: data.tdata.orderRecordGuid,
              })
              const {brandId,  memberInfoGuid,  merchantId, payType} = this.$router.params;
              const {tableInfo,merchantInfo} = this.state;
              console.log("这个是paytype=>>>>",payType,this.$router.params)
              Taro.setStorage({
                key:'tc_island_orderInfo',
                data:{
                  orderSn:data.tdata.orderRecordGuid,wxtoken,enterpriseGuid,openId,payType,memberInfoGuid,merchantId,brandId,tableInfo,merchantInfo
                }
              })
            }
           
          
          
          }
          else{
            hideLoading()
            showToast(res.data.message);
          }
          
        }
      })
    }
  
  }

  // 输入订单备注
  inputRemark = () => {
    navToPage(`/package/orderRemark/orderRemark?oldRemark=${this.state.remark}`)
  }

  // 从其他页面返回回调函数
  goBackCll = params => {
    this.setState({
      remark: params
    })
  }

  //另一个平台获取订单信息
  getCurrentorder = (callback,orderSn)=>{
    const {enterpriseGuid,wxtoken,openId} = this.state;
    const dispatch = this.props.dispatch;
    console.log("获取已有订单",orderSn)
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
      callback
    })

  }

  //获取另一个平台订单信息的回调
  callbackgetCurrentOrder =  ({ok,data}) => {
    const{orderSn} = this.state;
    if(ok&&data.code==0){
      const time = Math.floor(new Date(data.tdata.gmtCreate).getTime()/1000);
      const {orderNo,saleTotlePrice,totlePrice,enableMemberPrice} = data.tdata
      const ourOrderDataType = this.translateUnpayOrder(data.tdata.tableOrderDetailDTO,orderSn,time,orderNo,saleTotlePrice,totlePrice,enableMemberPrice);
      console.log("ourOrderDataType=>>>>>.",ourOrderDataType)
      this.setState({
        oldOrder:ourOrderDataType,
        oldProcuct: ourOrderDataType.shopOrderProductInfoDTOS || [],
        clickNum: ourOrderDataType.orderNum - 0 + 1 || 1,
        tableFee:ourOrderDataType.tableFee.totalFee || 0
      })
    }
  }

  //将另一个平台的订单数据转化为我们平台的订单数据的数据结构
  translateUnpayOrder = (tableOrderDetailDTO,orderSn,time,orderNo,saleTotlePrice,totlePrice,enableMemberPrice)=>{     //tableOrderDetailDTO    to  res.data[0]
    if(tableOrderDetailDTO.length>0){
        const oldOrder = {
            id:orderSn,
            shopOrderProductInfoDTOS:getShopOrderProductInfoDTOS(tableOrderDetailDTO),
            tableFee: {feeStatus: 0, fee: 0, totalFee: 0},
            orderNum: tableOrderDetailDTO[0].orderBatchDTOs.length,
            tableName: tableOrderDetailDTO[0].diningTableName,
            tableNum: tableOrderDetailDTO[0].tableGuid,
            peopleNum: tableOrderDetailDTO[0].guestCount,
            orderSn: orderSn,
            productFee:  enableMemberPrice?saleTotlePrice:totlePrice ,                   //getAllPrice(tableOrderDetailDTO[0].orderBatchDTOs),
            addTime: time,
            sureOrder:getSureOrder(tableOrderDetailDTO[0].orderBatchDTOs),
        }

        return oldOrder
    };
    //得到是否被商家接单的状态
    function getSureOrder(orderBatchDTOs){
        
        return orderBatchDTOs.every((item)=> item.state==1)
        
    }

    //得到总价
    function getAllPrice(orderBatchDTOs){
        let totalPrise = 0;  
        for(let i=0;i<orderBatchDTOs.length;i++){
            for(let j=0;j<orderBatchDTOs[i].dineItemDTOs.length;j++){ 
              if(orderBatchDTOs[i].dineItemDTOs[j].hasMemberPrice){
                totalPrise += orderBatchDTOs[i].dineItemDTOs[j].saleTotlePrice
              }else{
                totalPrise += orderBatchDTOs[i].dineItemDTOs[j].totlePrice
              }
                
            }

        }
        return totalPrise
    }
    //得到订单信息
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
                    hasMemberPrice: orderBatchDTOs[i].dineItemDTOs[j].hasMemberPrice,
                    state:orderBatchDTOs[i].state // 0待确认，1已下单，2已支付，3已取消，4，已退菜，5待支付，6已完成
                }
                if(orderBatchDTOs[i].state!=3){
                  shopOrderProductInfoDTOS.push(orderProductInfoDTO)
                }
                
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


  }

  //根据有无会员价,修改calssname
  updateClassnameA = (state)=>{
    if(state){
      return 'dishPrcie hadMemberPrice'
    }else{
      return 'dishPrcie'
    }
  }

  render() {
    const { newGoods, friendSettleVisible, remark, tableInfo, oldOrder, merchantId, orderSn, oldProcuct = [], payType, merchantInfo, shoppingCar, clickNum, tableFee ,enterpriseGuid,wxtoken,openId,memberInfoGuid} = this.state
    let productNumber = 0
    newGoods.map(item => {productNumber += Number(item.productNum)})
    oldProcuct.map(item => {productNumber += Number(item.productNum)})
    console.log('516 newGoods=>>>',newGoods)
    return (
      <View className="historyBox">
        <View className="allTitle flex-row flex-ac">
          <Image src={`${STATIC_IMG_URL}/icon/bell.png`} />
          堂食点餐
        </View>
        <View className="whiteBox orderInfo">
          <View className="infoItem flex-row flex-sb">
            <Text className="tableNum">桌号：{tableInfo.tableName}  </Text>
            <Text>{tableInfo.peopleNum}人</Text>
          </View>
          <View
            className="infoItem flex-row flex-sb"
            onClick={this.inputRemark}
          >
            <Text className="tableNum">订单备注</Text>
            <View className="flex-row flexac">
              <View className="otherWord ellipsis">{remark}</View>
              <AtIcon value="chevron-right" size="16" color="#666" />
            </View>
          </View>
        </View>
        <View className="whiteBox orderHistory">
          <View className="orderOnce">
            {/* {{enterpriseGuid?'点餐':} */}
            <View className="onceTitle">{`第${clickNum}次点餐`}</View>
            <View className="dishTitle">已选商品({newGoods.length})</View>
            <View className="dishList">
              {
                newGoods.map(ele => {
                  const { imageUrl, productName, spec, selfSupportDishPropertyTempList, productNum, productPrice, memberPrice,enablePreferentialPrice} = ele
                  const pictureUrl = imageUrl && imageUrl.split(',')[0]
                  // const skuAttrUp = spec.name
                  // const skuAttrDown = selfSupportDishPropertyTempList.map(({ details }) => details).join('/')
                  return (
                    <View className="dishItem flex-row">
                      <View className="dishLeft flex-row">
                        {
                          imageUrl && (
                            <Image className="dishImg" src={getServerPic(pictureUrl)} />
                          )
                        }
                        <View className="dishInfo flex-col flex-sb">
                          <View className="dishName ellipsis">{productName}</View>
                          <View className="dishSku ellipsis">{spec.name || ''}</View>
                        </View>
                      </View>
                      <View className="dishNum">x{productNum}</View>
                      {/* {enterpriseGuid&&

                      } */}
                      <View className={this.updateClassnameA(enablePreferentialPrice)}>
                        <Text>￥</Text>
                        <Text>{productPrice}</Text>
                      </View>
                      {
                        memberPrice &&(
                          <View className="dishPrcie memberPrice">
                          <Text>￥</Text>
                          <Text>{memberPrice}</Text>
                        </View>
                        )
                      }

                     
                    </View>
                  )
                })
              }
            </View>
            
          </View>
          {
            oldOrder.id && (
              <View className="orderOnce">
                <View className="onceTitle">历史点餐</View>
                {/* <View className="dishTitle">必选商品({newGoods.length})</View> */}
                <View className="dishTitle">已选商品({oldOrder.shopOrderProductInfoDTOS.length})</View>
                <View className="dishList">
                  {
                    oldProcuct.map(ele => {
                      const { imageUrl, productName, spec, selfSupportDishPropertyTempList, productNum, productPrice,memberPrice ,hasMemberPrice,state} = ele
                      const pictureUrl = imageUrl && imageUrl.split(',')[0]
                      // const skuAttrUp = spec.name
                      // const skuAttrDown = selfSupportDishPropertyTempList.map(({ details }) => details).join('/')
                      return (

                        <View>
                           <View className="dishItem flex-row">
                              <View className="dishLeft flex-row">
                                {
                                  imageUrl && (
                                    <Image className="dishImg" src={getServerPic(pictureUrl)} />
                                  )
                                }
                                <View className="dishInfo flex-col flex-sb">
                                  <View className="dishName ellipsis">{productName}</View>
                                  <View className="dishSku ellipsis">{spec.name || ''}</View>
                                </View>
                              </View>
                              <View className="dishNum">x{productNum}</View>
                              <View className={this.updateClassnameA(hasMemberPrice)}>
                                <Text>￥</Text>
                                <Text>{productPrice}</Text>
                              </View>
                              {
                                hasMemberPrice&&memberPrice&&( <View className="dishPrcie memberPrice">
                                              <Text>￥</Text>
                                              <Text>{memberPrice}</Text>
                                            </View>)    
                              }  
                            </View>
                            {
                            (state==3||state==4)&&(
                              <View className='batchState'>已取消 </View>
                            )
                            }
                         
                        </View>
                       
                      )
                    })
                  }
                </View>
              </View>
            )
          }
          { tableFee!==0 &&
            (<View className="totalMoney flex-row flex-sb flex-ae">
                <Text className="tableFeeTitle">桌台费</Text>
                <Text className="tableFee">{`￥${tableFee}`}</Text>
              </View>  
            )
          }
            <View className="totalMoney flex-row flex-je flex-ae">
              <Text>共{productNumber}件商品</Text>
              <Text className="marL">总计</Text>
              <Text className="priceUnit">￥</Text>
              <Text className="priceMoney">{toDecimal((shoppingCar.totalAmount || 0) + (oldOrder.productFee || 0) + (tableFee || 0))}</Text>
            </View>
        
          
          {/* <View className="totalMoney flex-row flex-sb flex-ae">
            <Text className="tableFeeTitle">桌台费</Text>
            <Text className="tableFee">{`￥${tableFee}`}</Text>
          </View>
          <View className="totalMoney flex-row flex-je flex-ae">
            <Text>共{productNumber}件商品</Text>
            <Text className="marL">总计</Text>
            <Text className="priceUnit">￥</Text>
            <Text className="priceMoney">{toDecimal((shoppingCar.totalAmount || 0) + (oldOrder.productFee || 0) + (tableFee || 0))}</Text>
          </View> */}
        </View>
        {/* <View className="whiteBox orderDetail">
          <View className="detailItem">
            <View className="copy">复制</View>
            <Text className="detailTitle">订单编号</Text>
            <Text className="detailWord">101011011011110000</Text>
          </View>
          <View className="detailItem">
            <Text className="detailTitle">创建时间</Text>
            <Text className="detailWord">2018-06-12    12:00:26</Text>
          </View>
        </View> */}
        <View className="orderFooter flex-row flex-sb">
          <View className="footerPrice flex-row">
            <View className="priceBox">
              <Text className="marR">总计</Text>
              <Text>￥</Text>
              <Text>{toDecimal((shoppingCar.totalAmount || 0) + (oldOrder.productFee || 0) + (tableFee || 0))}</Text>
            </View>
          </View>
          <View className="submitBtn" onClick={this.submitOrder}>提交订单</View>
        </View>

        {/* 订单提交 */}
        {
          friendSettleVisible && (
            <View className="friendSettleMask">
              <View className="friendSettleBox">
                <Image
                  className="friendSettleImg"
                  src={`${STATIC_IMG_URL}/friend_settle.png`}
                />
                <View className="friendSettleWord">
                  <View className="marB">订单已提交成功</View>
                  <View>后厨正在为您备餐请您耐心等待~</View>
                </View>
                <View className="friendSettleBtn">
                  <View
                    className="settleBtnItem ghostBtn"
                    onClick={() => {
                      this.setState({
                        friendSettleVisible: false
                      }, () => {
                        Taro.navigateBack({
                          orderSn
                        })
                      })
                    }}
                  >
                    继续加菜
                  </View>
                  <View
                    className="settleBtnItem confirmBtn"
                    onClick={() => {
                      this.$preload({
                        tableInfo,
                        currentMerchant: merchantInfo,
                        fromPage: 'history'
                      })
                      this.setState({
                        friendSettleVisible: false
                      }, () => {
                        if(enterpriseGuid){      
                          const { brandId } = this.$router.preload
                          
                          Taro.redirectTo({url:`/package/otherScanOrder/scanOrderDetail/scanOrderDetail?merchantId=${merchantId}&orderSn=${orderSn}&payType=${payType}&enterpriseGuid=${enterpriseGuid}&wxtoken=${wxtoken}&openId=${openId}&memberInfoGuid=${memberInfoGuid}&brandId=${brandId}`})
                          //navToPage(`/package/multiStore/scanOrderDetail/scanOrderDetail?merchantId=${merchantId}&orderSn=${orderSn}&payType=${payType}&enterpriseGuid=${enterpriseGuid}&wxtoken=${wxtoken}&openId=${openId}&memberInfoGuid=${memberInfoGuid}&brandId=${brandId}`)
                        }else{
                          navToPage(`/package/multiStore/scanOrderDetail/scanOrderDetail?merchantId=${merchantId}&orderSn=${orderSn}&payType=${payType}`)
                        }
                        
                      })
                    }}
                  >
                    查看订单
                  </View>
                </View>
              </View>
            </View>
          )
        }
      </View>
    )
  }
}