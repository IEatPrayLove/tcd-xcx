
/**
 * 类型(单个类型)
 * @param data
 * @param otherData
 * @param extendData
**/
function ourTypeStruct(itemTypeDTO,otherData={},extendData={}){
	const aType = {
	   name : itemTypeDTO.name,
	   id : itemTypeDTO.typeGuid,
	   merchantId : itemTypeDTO.merchantId,
	   sequence : itemTypeDTO.sort,
	   shopDishProductCats : [],
	   isType : 1,
	   description : null,
	   addDate : null,
	   brandId : null,
	   catSourceType : null,
	   catType : null,
	   count : null,
	   display : true,
	   isDelete : false,
	   eleMeCatId : null,
	   meiTuanCatId : null, 
	   shopDishProduct : null,
	   saleType : null,
	   oldCatId : null,
	   thirdNo : null,
	   type : null,
	   userId : null,
   }

   return aType;
}

/**
* 类型列表
* @param data
* @param otherData
* @param extendData
**/

function typeList (itemTypeDTOS,otherData={},extendData={}){
   const theTypeList = [];
   for(let i=0;i<itemTypeDTOS.length;i++){
	   if(itemTypeDTOS[i].sort > 0){           //掌控者类型中存在热销的类别
		   const aType = ourTypeStruct(itemTypeDTOS[i]);
		   theTypeList.push(aType);
	   }else{
			
	   }
	   
   }
   return theTypeList;
}

/**
* 商品
* @param data
* @param otherData
* @param extendData
**/
function ourGoodStruct(itemInfoDTO,otherData={},extendData={}){
   const aGood = {
	   brandId : null,
	   description : itemInfoDTO.description?itemInfoDTO.description:null,
	   dishImageUrl : itemInfoDTO.pictureUrl,
	   dishName : itemInfoDTO.name?itemInfoDTO.name:null,
	   id : itemInfoDTO.itemGuid?itemInfoDTO.itemGuid:null,
	   type : itemInfoDTO.typeGuid,
	   merchantId : null,
	   price : itemInfoDTO.showPrice?itemInfoDTO.showPrice:null,
	   saleNum : itemInfoDTO.isSoldOut?itemInfoDTO.isSoldOut:null,
	   enablePreferentialPrice : itemInfoDTO.enablePreferentialPrice?true:false,
	   shopDishAttributes : updateShopDishAttributes(itemInfoDTO),
	   shopDishSkus : updateShopDishSkus(itemInfoDTO),
	   stock : 99,
	   minOrderCount : itemInfoDTO.minOrderNum
   };
   return aGood;
   
   function updateShopDishSkus(arr){
	   let shopDishSkus = [];
	   if(arr.skuList.length>0){
			   for(let i=0;i<arr.skuList.length;i++){
					   const shopDishSku ={
							   id:arr.skuList[i].skuGuid,
							   price:arr.skuList[i].salePrice,
							   stock:99,
							   // stock:arr.skuList[i].residueQuantity,
							   spec:arr.skuList[i].name,
							   merchantId:null,
							   memberPrice:arr.skuList[i].memberPrice,
							   originalPrice:null,
							   limitMemberPrice:arr.skuList[i].enablePreferentialPrice ,  //是否有会员价
							   // saleNum:     ,
							   specImageUrl: null,  
							   enablePreferentialPrice: arr.skuList[i].enablePreferentialPrice        
					   }
					   shopDishSkus.push(shopDishSku);

			   }
	   }
	   return shopDishSkus;
   }
   
   function updateShopDishAttributes(itemInfoDTO){
	   //取得细节
	   function getDetails(itemInfoDTO){
		   let str = ''
		   if(itemInfoDTO.attrList.length>0){ 
				   for(let i=0;i<itemInfoDTO.attrList.length;i++){
					   if(i ===0){
						   str += itemInfoDTO.attrList[i].name
					   }else{
						   str +=','+ itemInfoDTO.attrList[i].name
					   }         
				   }   
		   }    
		   return str
	   }
	   function getDefaultArr(attrlist){
		   return attrlist.filter((item)=>{if(item.uck==1) return true})	
	   }
	   function getDefaultAttr(uckarr){
		   let attrStr = [];
		   for(let i=0;i<uckarr.length;i++){
			   attrStr.push(uckarr[i].name)
		   }
		   return attrStr
	   }
	   function getUckattrGuid(uckarr){
		   let attrGuidArr = [];
		   for(let i=0;i<uckarr.length;i++){
			   attrGuidArr.push(uckarr[i].attrGuid)
		   }
		   return attrGuidArr;
	   };
	   let shopDishAttributes = [];
	   if(itemInfoDTO.attrGroupList.length>0){
			   for(let i=0;i<itemInfoDTO.attrGroupList.length;i++){
					   console.log('uckArr=>>>>>>>>>>>>>')
					   const shopDishAttribute ={
							   brandId :null,
							   details : getDetails(itemInfoDTO.attrGroupList[i]),
							   name : itemInfoDTO.attrGroupList[i].name,
							   merchantId : null,
							   id:itemInfoDTO.attrGroupList[i].attrGroupGuid,
							   isRequired: itemInfoDTO.attrGroupList[i].isRequired,  //是否必选: 0 否 1 是
							   isMultiChoice:itemInfoDTO.attrGroupList[i].isMultiChoice,  //是否多选:0 否 1 是
							   uckArr:getDefaultArr(itemInfoDTO.attrGroupList[i].attrList),//itemInfoDTO.attrGroupList[i].attrList.filter((item)=>{if(item.uck==1) return true})  ,                           //默认选择的口味
							   uckAttrStr:getDefaultAttr(getDefaultArr(itemInfoDTO.attrGroupList[i].attrList)),
							   uckattrGuid:getUckattrGuid(getDefaultArr(itemInfoDTO.attrGroupList[i].attrList)),
							   
					   }
					   shopDishAttributes.push(shopDishAttribute);
			   }
	   }
	   return shopDishAttributes;
   }
}


/**
* 将商品加入类型列表之中
* @param itemInfoDTOS
* @param itemTypeDTOS
**/
function addGoodToType(itemInfoDTOS,itemTypeDTOS){
   let newType = [];
   const typeArr = typeList(itemTypeDTOS)
   for(let i=0;i<itemInfoDTOS.length;i++){

	   const newGood = ourGoodStruct(itemInfoDTOS[i]);
	   
	   for(let j=0;j<typeArr.length;j++){
		 if(newGood.type == typeArr[j].id){
		   newGood.price = typeArr[j].showPrice;
		   typeArr[j].shopDishProductCats.push(newGood);
		 }
	   }
   }
   newType = typeArr;
   return newType;
}	



/**
* 渲染页面的数据
* @param data
* @param otherData
* @param extendData
**/
function ourRenderData(data,otherData={},extendData={}){
   const{itemInfoDTOS,itemTypeDTOS} = data;
   const renderData = addGoodToType(itemInfoDTOS,itemTypeDTOS);
   return renderData
   
   //将每一个商品数据加入对应的类型之中就可以得到渲染页面的

}


/**
* 购物车单个商品的数据格式
* @param data
* @param otherData
* @param extendData
**/
function shopCartGood(data,otherData={},extendData={}){
   const cartGood = {
	   attribute: getAttr(data.attrGroupList)?getAttr(data.attrGroupList):'',    //"uck": 1    {id: name}
	   cat: data.enablePreferentialPrice?1:2,    //1是原价商品，2是优惠商品，3是必选商品   enablePreferentialPrice为true表示可用会员价
	   dishName: data.name,
	   limitBuyNum: null,
	   minCount: data.minOrderNum,
	   mustCondition: 0,         //是否必须
	   numLimitType: null,
	   number: data.currentCount,   // currentCount
	   oneNum: 1,
	   originalPrice: null,
	   price: getPrice(data.skuList).salePrice,
	   productId: getProductId(data.skuList),
	   shopLimitType: null,
	   spec: getspec(data.skuList)?getspec(data.skuList):'',
	   trueProductId: data.itemGuid,
	   enablePreferentialPrice: data.enablePreferentialPrice,                    //getPrice(data.skuList).enablePreferentialPrice,
	   memberPrice:getPrice(data.skuList).memberPrice
   }

   return cartGood

   function getAttr(attrGroupList){
	   if(attrGroupList.length>0){
		   let attribute = {};
		   for(let i=0;i<attrGroupList.length;i++){           
			   const id = attrGroupList[i].attrGroupGuid;
				const attrArr = attrGroupList[i].attrList.filter(item=>item.uck === 1);
			   		// attribute[id]  =  attrGroupList[i].attrList.filter(item=>item.uck === 1)[0].name


			   let attrStr = '';
			   for(let j=0;j<attrArr.length;j++){
					if(j>0){
						attrStr += ','
						attrStr += attrArr[j].name;
					}else{
						attrStr += attrArr[j].name;
					}
			   } 
			   attribute[id] = attrStr;



		   }
		   return attribute;
	   }
   }

   function getspec(skuList){
	   if(skuList.length>1){         //当其长度大于1 时表明是规格选项  当长度为1时说明只有一种规格，忽略
		   const specBox = skuList.filter( item=> item.uck === 1 );     
		   return specBox[0].name;
	   }
   }

   function getProductId(skuList){
	 if(skuList.length>0){
	   const specBox = skuList.filter( item=> item.uck === 1 )
	   return specBox[0].skuGuid
	 }
   }

   function getPrice(skuList){
	 const priceMessage = {
	   memberPrice:null,
	   salePrice:null,
	   enablePreferentialPrice:false
	 }
	 if(skuList.length>0){
	   const specBox = skuList.filter( item=> item.uck === 1 )
	   priceMessage.memberPrice=specBox[0].memberPrice;
	   priceMessage.salePrice=specBox[0].salePrice;
	   priceMessage.enablePreferentialPrice=specBox[0].enablePreferentialPrice;         
	 }
	 return priceMessage
   }

   function getAttrPrice(itemAttrDTOS){
	 let attrPrice = 0;
	 if(itemAttrDTOS.length>0){
	   for(let i=0;i<itemAttrDTOS.length;i++){
		 attrPrice += itemAttrDTOS[i].attrPrice
	   }
	   
	 }
	 return attrPrice;
   }
}


function shopCartGoodsList(data,otherData={},extendData={}){
   let goodList = [];
   if(data.length>0){
	 for(let i=0;i<data.length;i++){
	   goodList.push(shopCartGood(data[i]))   //data[i]  =>>>>> 单个商品
	 }
   } 
   return goodList;
   
   // console.log(cartGood);      
}

function orderData(data,otherData={},extendData={}){
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

   
   
   
 



export {ourRenderData,shopCartGoodsList,orderData}



