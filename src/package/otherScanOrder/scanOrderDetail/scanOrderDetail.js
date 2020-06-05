import Taro, { Component, showLoading, hideLoading } from '@tarojs/taro'
import { View  } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import './scanOrderDetail.scss'
import { getServerPic, navToPage, showToast, toDecimal, dateFormat } from '../../../utils/utils'
import { AtIcon } from 'taro-ui'

import { STATIC_IMG_URL, PLATFORM_ID  } from '../../../config/baseUrl'

@connect(({  }) => ({

}))

export default class scanOrderDetail extends Component {
    config = {
        navigationBarTitleText: '订单详情',
        enablePullDownRefresh: true
    }

    constructor() {
        super()
        this.state = {
            merchantId: this.$router.params.merchantId,
            orderSn: this.$router.params.orderSn,
            orderInfo: {},
			productList: [],
			cancelProductList: [],
            peddingProductList:[],
            payedProductList:[],
            orderState:null,
            tableFee: 0,
            fromPage: '',
            enterpriseGuid:this.$router.params.enterpriseGuid,
            wxtoken:this.$router.params.wxtoken,
            openId:this.$router.params.openId,
            memberInfoGuid: this.$router.params.memberInfoGuid ? this.$router.params.memberInfoGuid : null,
            brandId: this.$router.params.brandId,
            areaInfo: {
                areaGuid: null,
                areaName: null
            }
        }
    }


    componentWillMount(){
        console.log('this.$router.preload=>>>>>>>',this.$router.preload)
    }

    
    componentDidShow() {
        Taro.setNavigationBarColor({
          backgroundColor: Taro.getStorageSync('systemColor'),
          frontColor: "#ffffff"
		});
		showLoading();
        this.getOrder();
    }

    onPullDownRefresh() {
        this.getOrder()
        Taro.stopPullDownRefresh()
    }

    

    getOrder = () => {
        const { merchantId, orderSn,enterpriseGuid,wxtoken,openId } = this.state;
        console.log(orderSn);
        if(enterpriseGuid){
            this.props.dispatch({
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
                  console.log('buynow ok=>>',ok);
                  console.log('buynow data=>>',data.tdata.tableOrderDetailDTO);
                  const {orderState} = data.tdata;
                //   if(orderState==2){   //订单以支付
                //     Taro.redirectTo({url:`/package/multiStore/merchantDetail/merchantDetail?id=${merchantId}&brandId=${brandId}`})
                //   }
				  hideLoading();
                  if(ok&&data.code ==0){
                    
                    const ourOrderDataType = this.translateUnpayOrder(data.tdata,orderSn)
                    console.log(' 73 order=>>>>>',ourOrderDataType);
                    this.setState({
                        orderInfo: ourOrderDataType,
                        productList: ourOrderDataType.shopOrderProductInfoDTOSType.state_1 || [],
                        tableFee: ourOrderDataType.tableFee.totalFee || 0,
                        areaInfo: {
                            areaGuid: data.tdata.areaGuid,
                            areaName: data.tdata.areaName
						},
						cancelProductList: ourOrderDataType.shopOrderProductInfoDTOSType.state_3 || [],
                        peddingProductList:ourOrderDataType.shopOrderProductInfoDTOSType.state_0 || [],
                        payedProductList:ourOrderDataType.shopOrderProductInfoDTOSType.state_2 || [],
                        orderState:ourOrderDataType.orderState
						
                    })
                  }


                }
            })
        }

    }

    // 复制订单号
    copyOrderSn = orderSn => {
        Taro.setClipboardData({
            data: orderSn,
            success: () => {
                showToast('已复制!')
            }
        })
    }


    //转换未支付订单数据
    translateUnpayOrder = (data,orderSn)=>{     //tableOrderDetailDTO    to  res.data[0]
        const{tableOrderDetailDTO,gmtCreate,enableMemberPrice,saleTotlePrice,totlePrice,orderState,payAmount} = data;
        const time = Math.floor(new Date(gmtCreate).getTime()/1000);
        if(tableOrderDetailDTO.length>0){
            const oldOrder = {
                shopOrderProductInfoDTOS:getShopOrderProductInfoDTOS(tableOrderDetailDTO).shopOrderProductInfoDTOS,
                tableFee: {feeStatus: 0, fee: 0, totalFee: 0},
                orderNum: tableOrderDetailDTO[0].orderBatchDTOs.length,
                tableName: tableOrderDetailDTO[0].diningTableName,
                tableNum: tableOrderDetailDTO[0].tableGuid,
                peopleNum: tableOrderDetailDTO[0].guestCount,
                orderSn: orderSn,
                productFee: orderState==2?payAmount:enableMemberPrice?saleTotlePrice:totlePrice,  
                // productFee: getAllPrice(tableOrderDetailDTO[0].orderBatchDTOs), 
                addTime: time,
				sureOrder:orderState==1?true:false,
                shopOrderProductInfoDTOSType:getShopOrderProductInfoDTOS(tableOrderDetailDTO).shopOrderProductInfoDTOSType,
                orderState,
            }

            return oldOrder
        };

        //得到订单信息
        function getShopOrderProductInfoDTOS(tableOrderDetailDTO){
            const  shopOrderProductInfoDTOS = [];
            const shopOrderProductInfoDTOSType={
                state_0:[],
                state_1:[],
                state_2:[],
                state_3:[],
                state_4:[],
                state_5:[],
                state_6:[],
            }
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
                        memberPrice: orderBatchDTOs[i].dineItemDTOs[j].hasMemberPrice?orderBatchDTOs[i].dineItemDTOs[j].saleTotlePrice:null,
                        mustChoose: false,
                        packFee: 0,
                        packageInfoList: null,
                        productId: orderBatchDTOs[i].dineItemDTOs[j].skuGuid,
                        productName: orderBatchDTOs[i].dineItemDTOs[j].itemName,
                        productNum: orderBatchDTOs[i].dineItemDTOs[j].amount,
                        productPrice: orderBatchDTOs[i].dineItemDTOs[j].totlePrice/orderBatchDTOs[i].dineItemDTOs[j].amount,
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
                        hasMemberPrice:orderBatchDTOs[i].dineItemDTOs[j].hasMemberPrice,
                        state:orderBatchDTOs[i].state // 0待确认，1已下单，2已支付，3已取消，4，已退菜，5待支付，6已完成
					}
					if(orderBatchDTOs[i].state!=3){
                        shopOrderProductInfoDTOS.push(orderProductInfoDTO);
                    }
                    // 将其放入不同的
                    if(orderBatchDTOs[i].state==0){
                        shopOrderProductInfoDTOSType.state_0.push(orderProductInfoDTO);
                    }else if(orderBatchDTOs[i].state==1){
                        shopOrderProductInfoDTOSType.state_1.push(orderProductInfoDTO)
                    }else if(orderBatchDTOs[i].state==2){
                        shopOrderProductInfoDTOSType.state_2.push(orderProductInfoDTO)
                    }else if(orderBatchDTOs[i].state==3){
                        shopOrderProductInfoDTOSType.state_3.push(orderProductInfoDTO)
                    }else if(orderBatchDTOs[i].state==4){
                        shopOrderProductInfoDTOSType.state_4.push(orderProductInfoDTO)
                    }else if(orderBatchDTOs[i].state==5){
                        shopOrderProductInfoDTOSType.state_5.push(orderProductInfoDTO)
                    }else if(orderBatchDTOs[i].state==6){
                        shopOrderProductInfoDTOSType.state_6.push(orderProductInfoDTO)
                    }      
              }
            }
            return {shopOrderProductInfoDTOS,shopOrderProductInfoDTOSType};
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


    }

    //根据有无会员价修改类名
    updateClassnameA = (state)=>{
        if(state){
          return 'dishPrcie hadMemberPrice'
        }else{
          return 'dishPrcie'
        }
    }
    

    render() {
        const { orderSn, orderInfo, productList = [], tableFee,enterpriseGuid,wxtoken, openId, memberInfoGuid, brandId, merchantId, areaInfo ,peddingProductList,cancelProductList,payedProductList,orderState} = this.state
        const { tableInfo, currentMerchant, fromPage } = this.$router.preload
		let productNumber = 0;
		let peddingProductNum = 0;
        let cancelProductNum = 0;
        let payedProductNum = 0;
		productList.map(item => {productNumber += Number(item.productNum)});
		if(peddingProductList.length>0){
			peddingProductList.map(item => {peddingProductNum += Number(item.productNum)});
		}
		if(cancelProductList.length>0){
			cancelProductList.map(item => {cancelProductNum += Number(item.productNum)});
		}
        
        if(payedProductList.length>0){
			payedProductList.map(item => {payedProductNum += Number(item.productNum)});
		}
		

        console.log("fromPage=>>>>",fromPage)
        return (
            <View className="detailBox">
                <View className="detailHeader" style={{ background: `${Taro.getStorageSync('systemColor')}` }}>
                    <View className="flex-row flex-sb flex-ac">
                        <View className="flex-row">
                            <Image className="onPayImg" src={`${STATIC_IMG_URL}/icon/no_pay.png`} />
                            <View className="noPayWord">{orderState!=2?"待支付":"已付款"}</View>
                        </View>
                        <View className="orderType">扫码点餐</View>
                    </View>
                </View>
                <View className="whiteBox tableInfo">
                    <View className="infoItem flex-row flex-sb">
                        <Text className="tableNum">桌号：{tableInfo.tableName}  </Text>
                        <Text>{tableInfo.peopleNum}人</Text>
                    </View>
                </View>
                {/* 未被接单的批次 */}

				{
					peddingProductList.length>0&&(
						<View className="whiteBox orderHistory">
							<View className="orderOnce">
								<View className="dishTitle">待接单({peddingProductList.length})</View>
								<View className="dishList">
									{
										peddingProductList.map(ele => {
											const { imageUrl, productName, spec, selfSupportDishPropertyTempList, productNum, productPrice ,memberPrice,hasMemberPrice} = ele
											const pictureUrl = imageUrl && imageUrl.split(',')[0]
											const skuAttrUp = spec.name
											const skuAttrDown = selfSupportDishPropertyTempList.map(({ details }) => details).join('/')
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
													<View className={this.updateClassnameA(hasMemberPrice)}>
														<Text>￥</Text>
														<Text>{productPrice}</Text>
													</View>
													{hasMemberPrice&&
													(<View className="dishPrcie">
															<Text>￥</Text>
															<Text>{memberPrice}</Text>
														</View>)
													}
												
												</View>
											)}
										)
									}
		
								</View>
							</View>
							<View className="totalMoney flex-row flex-je flex-ae">
								<Text>共{peddingProductNum}件商品</Text>
							</View>
						</View>
					)
				}
        


				 {/* 被取消的订单 */}
				 {
					cancelProductList.length>0&&(
						<View className="whiteBox orderHistory">
							<View className="orderOnce">
								<View className="dishTitle">已取消({productList.length})</View>
								<View className="dishList">
									{
										cancelProductList.map(ele => {
											const { imageUrl, productName, spec, selfSupportDishPropertyTempList, productNum, productPrice ,memberPrice,hasMemberPrice} = ele
											const pictureUrl = imageUrl && imageUrl.split(',')[0]
											const skuAttrUp = spec.name
											const skuAttrDown = selfSupportDishPropertyTempList.map(({ details }) => details).join('/')
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
													<View className={this.updateClassnameA(hasMemberPrice)}>
														<Text>￥</Text>
														<Text>{productPrice}</Text>
													</View>
													{hasMemberPrice&&
													(<View className="dishPrcie">
															<Text>￥</Text>
															<Text>{memberPrice}</Text>
														</View>)
													}
												
												</View>
											)}
										)
									}
		
								</View>
							</View>
							<View className="totalMoney flex-row flex-je flex-ae">
								<Text>共{cancelProductNum}件商品</Text>
							</View>
						</View>

					)
				 }
				

                {/* 已经被接单的批次 */}
				{
					productList.length>0&&(
						<View className="whiteBox orderHistory">
						<View className="orderOnce">
							<View className="dishTitle">已选商品({productList.length})</View>
							<View className="dishList">
								{
									productList.map(ele => {
										const { imageUrl, productName, spec, selfSupportDishPropertyTempList, productNum, productPrice ,memberPrice,hasMemberPrice} = ele
										const pictureUrl = imageUrl && imageUrl.split(',')[0]
										const skuAttrUp = spec.name
										const skuAttrDown = selfSupportDishPropertyTempList.map(({ details }) => details).join('/')
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
												<View className={this.updateClassnameA(hasMemberPrice)}>
													<Text>￥</Text>
													<Text>{productPrice}</Text>
												</View>
												{hasMemberPrice&&
												   (<View className="dishPrcie">
														<Text>￥</Text>
														<Text>{memberPrice}</Text>
													</View>)
												}
											   
											</View>
										)}
									)
								}
	
							</View>
						</View>
						<View className="totalMoney flex-row flex-sb flex-ae">
							<Text className="tableFeeTitle">桌台费</Text>
							<Text className="tableFee">{`￥${tableFee}`}</Text>
						</View>
						<View className="totalMoney flex-row flex-je flex-ae">
							<Text>共{productNumber}件商品</Text>
							<Text className="marL">总计</Text>
							<Text className="priceUnit">￥</Text>
							<Text className="priceMoney">{toDecimal(orderInfo.productFee + tableFee)}</Text>
						</View>
					</View>
					)
				}

                  {/* 已经支付的商品 */}
				{
					payedProductList.length>0&&(
						<View className="whiteBox orderHistory">
						<View className="orderOnce">
							<View className="dishTitle">已选商品({payedProductList.length})</View>
							<View className="dishList">
								{
									payedProductList.map(ele => {
										const { imageUrl, productName, spec, selfSupportDishPropertyTempList, productNum, productPrice ,memberPrice,hasMemberPrice} = ele
										const pictureUrl = imageUrl && imageUrl.split(',')[0]
										const skuAttrUp = spec.name
										const skuAttrDown = selfSupportDishPropertyTempList.map(({ details }) => details).join('/')
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
												<View className={this.updateClassnameA(hasMemberPrice)}>
													<Text>￥</Text>
													<Text>{productPrice}</Text>
												</View>
												{hasMemberPrice&&
												   (<View className="dishPrcie">
														<Text>￥</Text>
														<Text>{memberPrice}</Text>
													</View>)
												}
											   
											</View>
										)}
									)
								}
	
							</View>
						</View>
						<View className="totalMoney flex-row flex-sb flex-ae">
							<Text className="tableFeeTitle">桌台费</Text>
							<Text className="tableFee">{`￥${tableFee}`}</Text>
						</View>
						<View className="totalMoney flex-row flex-je flex-ae">
							<Text>共{productNumber}件商品</Text>
							<Text className="marL">总计</Text>
							<Text className="priceUnit">￥</Text>
							<Text className="priceMoney">{toDecimal(orderInfo.productFee + tableFee)}</Text>
						</View>
					</View>
					)
				}
               


                <View className="whiteBox orderDetail">
                    <View className="detailItem">
                        <View
                            className="copy"
                            onClick={this.copyOrderSn.bind(this, orderSn)}
                        >
                            复制
                        </View>
                        <Text className="detailTitle">订单编号</Text>
                        <Text className="detailWord">{orderSn || ''}</Text>
                    </View>
                    <View className="detailItem">
                        <Text className="detailTitle">创建时间</Text>
                        <Text className="detailWord">{dateFormat(orderInfo.addTime)}</Text>
                    </View>
                </View>

                {/* 订单未结算 */}
                {
                    orderState!=2
                    ?(
                        <View className="orderFooter flex-row flex-sb">
                            <View
                                className="footerPrice"
                                onClick={() => {
                                if (fromPage === 'index') {
                                    Taro.navigateBack()
                                }else if(fromPage ==='first_index'){
                                    Taro.getStorage({
                                        key: 'tc_island_tableInfo',
                                        success: res => {
                                          const {perNum,tableInfo,merchantId,tableId,brandId,tableName,phone,enterpriseGuid,openId,wxtoken,payType} = res.data; 
                                          Taro.redirectTo({url:`/package/otherScanOrder/scanningIndex/scanningIndex?personNum=${perNum}&tableInfo=${tableInfo}&merchantId=${merchantId}&tableId=${tableId}&brandId=${brandId}&payType=${payType}&tableName=${tableName}&newTable=${false}&enterpriseGuid=${enterpriseGuid}&openId=${openId}&orderSn=${orderSn}&wxtoken=${wxtoken}&phone=${phone}`})
                                        }
                                    })
                                } else {
                                    if(enterpriseGuid){
                                        Taro.navigateBack()
                                    }else{
                                        Taro.navigateBack({ delta: 2 })
                                    }
                                   
                                }
                            }}
                            >
                            继续加菜
                            </View>
    
    
                        {
                            peddingProductList.length==0&&productList.length>0?(
                                <View className="submitBtn"
                                    onClick={() => {                         
                                    if(enterpriseGuid){
                                        this.$preload({
                                            allProduct: productList,
                                            orderingInfo: orderInfo,
                                            payType: this.$router.params.payType,
                                            tableInfo,
                                            currentMerchant,
                                            orderSn,
                                            enterpriseGuid,
                                            wxtoken,
                                            openId,
                                            memberInfoGuid,
                                            brandId,
                                            merchantId,
                                            areaInfo
                                        })
                                    }                        
                                    navToPage('/package/otherScanOrder/scanningConfirm/scanningConfirm')
                                    }}
                                >
                                订单结算
                                </View>
                            ):(
                                <View className="submitBtn unOperate">无可结算订单</View>
                            )
                        }
                       
                        </View>
                    )
                    :(
                        <View className="orderFooter flex-row flex-sb">    
                            <View className="submitBtn orderPayed">订单已完成</View>
                        </View>
                    )
                }

                {/* <View className="orderFooter flex-row flex-sb">
                    <View
                        className="footerPrice"
                        onClick={() => {
                            if (fromPage === 'index') {
                                Taro.navigateBack()
                            }else if(fromPage ==='first_index'){
                                Taro.getStorage({
                                    key: 'tc_island_tableInfo',
                                    success: res => {
                                      const {perNum,tableInfo,merchantId,tableId,brandId,tableName,phone,enterpriseGuid,openId,wxtoken,payType} = res.data; 
                                      Taro.redirectTo({url:`/package/otherScanOrder/scanningIndex/scanningIndex?personNum=${perNum}&tableInfo=${tableInfo}&merchantId=${merchantId}&tableId=${tableId}&brandId=${brandId}&payType=${payType}&tableName=${tableName}&newTable=${false}&enterpriseGuid=${enterpriseGuid}&openId=${openId}&orderSn=${orderSn}&wxtoken=${wxtoken}&phone=${phone}`})
                                    }
                                })
                            } else {
                                if(enterpriseGuid){
                                    Taro.navigateBack()
                                }else{
                                    Taro.navigateBack({ delta: 2 })
                                }
                               
                            }
                        }}
                    >
                        继续加菜
                    </View>


                    {
                        peddingProductList.length==0?(
                            <View className="submitBtn"
                                onClick={() => {                         
                                if(enterpriseGuid){
                                    this.$preload({
                                        allProduct: productList,
                                        orderingInfo: orderInfo,
                                        payType: this.$router.params.payType,
                                        tableInfo,
                                        currentMerchant,
                                        orderSn,
                                        enterpriseGuid,
                                        wxtoken,
                                        openId,
                                        memberInfoGuid,
                                        brandId,
                                        merchantId,
                                        areaInfo
                                    })
                                }                        
                                navToPage('/package/otherScanOrder/scanningConfirm/scanningConfirm')
                                }}
                            >
                            订单结算
                            </View>
                        ):(
                            <View className="submitBtn unOperate">存在待处理订单</View>
                        )
                    }
                   
                </View> */}
            </View>
        )
    }
}
