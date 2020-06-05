import {
  getOpenID,
  getToken,
  getPersonNum,
  getConsumerInfo,
  getOtherPlatformGoods,
  otherplatFormJoinCart,
  otherplatFormCartContent,
  otherClearCartContent,
  otherSubmitCart,
  preSubOrderB,
  otherPay_wechat, 
  otherPay_member,
  getOtherOrders,
  otherMemberMes,
  getVolumeList,
  useVolume,
  confirmUseVolume,
  otherOrderbyGuid,
  getMemberCardList,
  switchCard,
  otherLogin,
  getConsumerInfoPost,
  otherOrderCheck,
  otherOrderSet,
  prePay,
  memberPay,
  getMemberCard,
  orderDefrey,
  otherWechat,
  popWindow,
  sunmitOrder,
  getAllCurrentOrder,
} from '../utils/api'
import { isFunction } from '../utils/utils'

export default {
  namespace: 'otherPlatform',
  state: {
  },
  effects: {   
    * getOpenIDAction({ payload, callback }, { call }) {
      const res = yield call(getOpenID, payload);
      isFunction(callback) && callback(res);
    },

    * getOtherPlantFormTOKENAction({callback,payload},{call}){
        const res = yield call(getToken,payload);
        isFunction(callback) && callback(res);
    },

      /** 
     * other plantform login
     * @param payload
     * @param callback
     * @param
     * */
    * otherLoginAction({callback,payload},{call}){
      const res = yield call(otherLogin,payload);
      isFunction(callback) && callback(res);
    },

    /** 
     * 另一平台选在订餐人数
     * @param payload
     * @param callback
     * @param call
     */  
    * getPersonNumAction({payload,callback},{call}){
      const res = yield call(getPersonNum,payload);
      isFunction(callback) && callback(res);
    },


    /** 
    * 另一平台用户信息获取
     * @param payload
     * @param callback
     * @param call
    */

    *getConsumerInfoAction({payload,callback},{call}){
      const res = yield call(getConsumerInfo,payload);
      isFunction(callback) && callback(res);
    },


    /**
     * other plantform check   //otherOrderCheck
     * @param payload
     * @param callback
     * @param call
     */
    * otherOrderCheckAction({payload,callback},{call}){
      const res =yield call(otherOrderCheck,payload);
      isFunction(callback) && callback(res)
    },

       /**
     * @param payload
     * @param callback
     * @param call
     */
    *getConsumerInfoPOSTAction({payload,callback},{call}){
      const res = yield call(getConsumerInfoPost,payload);
      isFunction(callback) && callback(res);
    },

        /** 
    * 另一平台商铺商品信息
     * @param payload
     * @param callback
     * @param call
    */
   
   *getOtherPlatformGoodsAction({payload,callback},{call}){
    const res = yield call(getOtherPlatformGoods,payload);
    isFunction(callback) && callback(res);
  },

  /** 
  * 另一平台加入购物车
   * @param payload
   * @param callback
   * @param call
  */
  *otherPlatformJoinCartAction({payload,callback},{call}){
    const res = yield call(otherplatFormJoinCart,payload);
    isFunction(callback) && callback(res);
  },


  //otherplatFormCartContent
  /** 
  * 获取另一平台购物车内容
   * @param payload
    * @param callback
    * @param call
    */
  *getOtherPlatformCartcontent({payload,callback},{call}){
      const res = yield call(otherplatFormCartContent,payload);
      isFunction(callback) && callback(res);
  },

  //otherClearCartContent
    /** 
    * 清空另一平台购物车内容
    * @param payload
    * @param callback
    * @param call
    */
  *clearCartContentAction({payload,callback},{call}){
      const res = yield call(otherClearCartContent,payload);
      isFunction(callback) && callback(res);
  },
    //otherSubmitCart
    /** 
    * 提交购物车
    * @param payload
    * @param callback
    * @param call
    */
  *otherSubmitCartAction({payload,callback},{call}){
    const res = yield call(otherSubmitCart,payload);
    isFunction(callback) && callback(res);
  },

  /**  获取订单
    * @param payload
    * @param callback
    * @param call
  */
  *getOtherPlatOrdersAction({payload,callback},{call}){
    const res = yield call(getOtherOrders,payload);
    isFunction(callback) && callback(res);
  },

  /**
   * 预下单
   *
   * @param payload
   * @param callback
   * @param call
   */
  * preSubOrderBAction({payload,callback},{call}){
    const res = yield call(preSubOrderB, payload)     //
    isFunction(callback) && callback(res)
  },
  /**
   * otherPay_wechat
   */
  *otherPay_wechatAction({payload,callback},{call}){
    const res = yield call( otherPay_wechat,payload)     //
    isFunction(callback) && callback(res)
  },
  /**
   * 
   *getMemberCardList
   * 
   */
  *getMemberCardListAction({payload,callback},{call}){
    const res = yield call(getMemberCardList,payload)     //
    isFunction(callback) && callback(res)
  },
  /**
   * switchCard  切换会员卡
   * 
   */
  *switchCardAction({payload,callback},{call}){
    const res = yield call(switchCard,payload)
    isFunction(callback) && callback(res)
  },

  /**
   * 另一平台订单支付(会员支付)
   *
   * @param payload
   * @param callback
   * @param call
   */
  * otherPay_menmberAction({payload,callback},{call}){
    const res = yield call(otherPay_member, payload)
    isFunction(callback) && callback(res)
  },

   /** 
   * @param payload
   * @param callback
   * @param call
   * otherOrderbyGuid
   */
  * otherOrderbyGuidAction({payload,callback},{call}){
    const res = yield call(otherOrderbyGuid, payload)
    isFunction(callback) && callback(res)
  },

  /**
   * @param payload
   * @param callback
   * @param call
   * otherOrderSet 根据订单guid获取订单信息，包含结算信息
   */
  * otherOrderSetAction({payload,callback},{call}){
    const res = yield call(otherOrderSet, payload)
    isFunction(callback) && callback(res)
   },
   /**
   * @param payload
   * @param callback
   * @param call
   * otherMemberMes
   */
   * otherMemberMesAction({payload,callback},{call}){
    const res = yield call(otherMemberMes, payload)
    isFunction(callback) && callback(res)
   },
  


   /**
   * 另一平台优惠券列表
   *
   * @param payload
   * @param callback
   * @param call
   */
  *getVolumeListAction({payload,callback},{call}){
    const res = yield call(getVolumeList, payload)
    isFunction(callback) && callback(res)
  },
  
  /**
   * 另一平台使用优惠券
   *
   * @param payload
   * @param callback
   * @param call
   */
  *useVolumeAction({payload,callback},{call}){
    const res = yield call(useVolume, payload)
    isFunction(callback) && callback(res)
  },
  /**
   * 确认优惠券
   *
   * @param payload
   * @param callback
   * @param call
   */
  *confirmUseVolumeAction({payload,callback},{call}){
    const res = yield call(confirmUseVolume, payload)
    isFunction(callback) && callback(res)
  },
  * popWindowAction({payload,callback},{call}){
    const res =yield call(popWindow,payload);
    isFunction(callback) && callback(res)

  },

  /**
   * other plantform check   //prePay
   * @param payload
   * @param callback
   * @param call
   */
  * memberPayAction({payload,callback},{call}){
    const res =yield call(memberPay,payload);
    isFunction(callback) && callback(res)
  },


  //会员支付
  * prePayAction({payload,callback},{call}){
    const res =yield call(prePay,payload);
    isFunction(callback) && callback(res)
  },

  //请求支付会员卡
  * getMemberCardAction({payload,callback},{call}){
    const res =yield call(getMemberCard,payload);
    isFunction(callback) && callback(res)
  },

  //orderDefrey
  * orderDefreyAction({payload,callback},{call}){
    const res =yield call(orderDefrey,payload);
    isFunction(callback) && callback(res)
  },

  //otherWechat

  * otherWechatAction({payload,callback},{call}){
    const res =yield call(otherWechat,payload);
    isFunction(callback) && callback(res)
  },

  * popWindowAction({payload,callback},{call}){
    const res =yield call(popWindow,payload);
    isFunction(callback) && callback(res)

  },
  //scanningHistory => func (submitOrder)  提交订单 
  * otherSubmitOrderAction({payload,callback},{call}){
    const res = yield call(sunmitOrder, payload);
    isFunction(callback) && callback(res);
  },
  //获取当前未结算订单菜品
  * getAllCurrentOrderAction({payload,callback},{call}){
    const res = yield call(getAllCurrentOrder,payload);
    isFunction(callback) && callback(res);
  }
    



  },
  reducers: {
  }
}
