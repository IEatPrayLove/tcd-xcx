import Taro, { useEffect, useState } from '@tarojs/taro'
import {
    Button, Text, View, Input, ScrollView
  } from '@tarojs/components'
  import { useDispatch } from '@tarojs/redux'
import IconFont from '../IconFont/IconFont'
import {  AtIcon, } from 'taro-ui'
import './todrderDetail.scss'
import {
    getServerPic,navToPage
} from '../../utils/utils'
/**
 * @param cardVisble 是否显示选择弹窗
 * @param payment 支付方式
 * @param onChange 支付方式监听函数
 * @param storeModal 储值卡弹窗
 */
export default function ToOrderDetail({merchantDetail = {},orderSn=null,wxtoken=null,enterpriseGuid=null,openId=null,payType=1,memberInfoGuid=null,merchantId=null,brandId=null,currentMerchant=null,tableInfo=null}) {
    // const getOrderInfo=()=>{
    //     const orderInfo = {
    //         orderSn:null,
    //         wxtoken:null,
    //         enterpriseGuid:null,
    //         openId:null,
    //     }
    //     Taro.getStorage({
    //         key: 'tc_island_orderInfo',
    //         success: res => {
    //             orderInfo.orderSn = res.data.orderSn
    //             orderInfo.wxtoken = res.data.wxtoken
    //             orderInfo.enterpriseGuid = res.data.enterpriseGuid
    //             orderInfo.openId = res.data.openId  
    //         }
    //     })
    //     console.log(orderInfo)
    //     return orderInfo
    
    // }
    let  orderState =true;
    const dispatch = useDispatch()
    const toOrder = ()=>{
        if(orderSn){
            this.$preload({
                tableInfo: tableInfo,
                currentMerchant,
                fromPage: 'first_index'
            })
            navToPage(`/package/otherScanOrder/scanOrderDetail/scanOrderDetail?merchantId=${merchantId}&orderSn=${orderSn}&payType=${payType}&enterpriseGuid=${enterpriseGuid}&openId=${openId}&wxtoken=${wxtoken}&memberInfoGuid=${memberInfoGuid}&brandId=${brandId}`)
           // Taro.redirectTo({url:`/package/multiStore/scanOrderDetail/scanOrderDetail?merchantId=${merchantId}&orderSn=${orderSn}&payType=${payType}&enterpriseGuid=${enterpriseGuid}&openId=${openId}&wxtoken=${wxtoken}&memberInfoGuid=${memberInfoGuid}&brandId=${brandId}`})
        }
    }

   
    return  (orderSn&&orderState&&
        <View className="tagVBox flex-row" onClick={()=>toOrder()}>
            <View className="tagImg flex-col flex-ac">
            
                <AtIcon className="arrowIcon" value="shopping-bag" size="20" color="black" />
                {/* <image src={getServerPic(merchantAvatar)}></image> */}
            </View>
            <View className="tagtxt flex-col flex-ac flex-row">
                <View >扫码点餐</View>
                <View>待付款</View>
            </View>
            <View className="tagIcon flex-col flex-ac">
            <AtIcon className="arrowIcon" value="chevron-right" size="20" color="#999" />
            </View>
        </View>
    )
}