import Taro, { Component } from '@tarojs/taro'
import {
  View, Button, Text, Image, Block
} from '@tarojs/components'

import './Merchant.scss'
import { getServerPic, navToPage, productTypeAnd, showToast, parseQuery } from '../../utils/utils'
import { MERCHANT_MODEL } from '../../config/config'

export default function Merchant({ merchantDetail = {} }) {
  const {
    merchant_name: merchantName, merchantAvatar,
    distance, merchantActivityList, id, brand,thirdNo,
    platFormMerchantDTO: {
      outerOrderMod, picShowType, merchantAroundPic = '', shopDishList = []
    } = {},
    brandDTO: { brandTag } = {},
    shippingInfo, categorys, offerDiscount, maxRebate
  } = merchantDetail
  const { startPrice, minSendPrice } = shippingInfo || {}
  const merchantMod = MERCHANT_MODEL.filter(({ value }) => productTypeAnd(outerOrderMod, value))
    .reduce((acc, cur) => (acc.findIndex(ele => ele.label === cur.label) === -1 ? [...acc, cur] : acc), [])
  const merchantDistance = distance >= 1 ? `${distance}km` : `${distance * 1000}m`
  const moneyOff = (merchantActivityList || []).reduce((acc, { activityType, activityInfo }) => {
    if (activityType === 2) { // 2: 满减活动
      return activityInfo.find(({ businessType }, index) => businessType === null || activityInfo.length - 1 === index).fullReductionlist
    }
  }, [])
  const picList = picShowType === 2
    ? merchantAroundPic && merchantAroundPic.split(',').slice(0, 3)
      .map((ele, index) => ({
        url: ele,
        type: 'MERCHANT',
        index
      }))
    : shopDishList && shopDishList.map((ele, index) => ({
      ...ele,
      url: ele.dishImageUrl && ele.dishImageUrl.split(',')[0],
      type: 'DISH',
      index
    }))
  return (
    <View
      className="merchantContainer"
      onClick={() => {
        if (Taro.getStorageSync('merchantType') == 2) {
          navToPage(`/package/multiStore/orderDishes/orderDishes?id=${id}`)
        } else if (Taro.getStorageSync('merchantType') == 8) {
          navToPage(`/package/multiStore/preferentialPayment/preferentialPayment?merchantId=${id}&brandId=${brand}`)
        } else if (Taro.getStorageSync('merchantType') == 16) {
          Taro.scanCode({
            scanType: ['qrCode'],
            success: res => {
                const { result } = res
                const { brandId, tableId } = parseQuery(result)
                if (parseQuery(result).id && parseQuery(result).id !== id) {
                  showToast('二维码与当前门店不匹配')
                  return
                }
                if (id && tableId && brandId) {
                  navToPage(`/package/multiStore/choosePerson/choosePerson?merchantId=${id}&tableId=${tableId}&brandId=${brandId}`)
                  return
                }
                showToast('二维码有误')
              
            }
          })
        } else {
          navToPage(`/package/multiStore/merchantDetail/merchantDetail?id=${id}&brandId=${brand}&thirdNo=${thirdNo}&merchantAvatar=${merchantAvatar}`)
        }
      }}
    >
      <View className="header flex-row">
        <Image
          mode="aspectFill"
          className="merchantPic flex-sk"
          src={getServerPic(merchantAvatar)}
        />
        <View className="merchantInfo flex-col flex-sb flex-gw">
          <View className="flex-row flex-ac">
            <Text className="merchantName">{merchantName}</Text>
            {
              merchantMod.map(ele => {
                const { className, label, value } = ele
                return (
                  <Text key={value} className={`label ${className}`}>{label}</Text>
                )
              })
            }
          </View>
          <View className="delivery flex-row flex-ac">
            {
              maxRebate && (
                <View className="earn flex-row flex-sk">
                  {`分享返${maxRebate}%`}
                </View>
              )
            }
            {
              brandTag && (
                <Text className="ellipsis brandTag">{brandTag}</Text>
              )
            }
            {
              merchantMod.find(({ value }) => value === 2) && (
                <Text className="flex-gw flex-sk">
                  {startPrice ? `起送 ¥${startPrice}` : ''}
                </Text>
              )
            }
            <Text className="flex-sk">{merchantDistance}</Text>
          </View>
        </View>
      </View>
      {
        categorys && (
          <View className="merchantCat flex-row flex-ac">
            {categorys.map((ele, index) => <Text key={index}>{ele}</Text>)}
          </View>
        )
      }
      <View className="merchantDiscount flex-row flex-ac">
        {
          moneyOff.length > 0 && (
            <Block>
              <Text className="bgYellow">减</Text>
              {
                moneyOff.map((ele, index) => {
                  const { fullMoney, cutMoney } = ele
                  return (
                    <Text
                      className={`bd ${index === moneyOff.length - 1 && 'last'}`}
                      key={fullMoney}
                    >
                      {`满${fullMoney}减${cutMoney}`}
                    </Text>
                  )
                })
              }
            </Block>
          )
        }
        {
          offerDiscount && (
            <Block>
              <Text className="bg">买</Text>
              <Text className="discount">{`买单享${offerDiscount}折`}</Text>
            </Block>
          )
        }
      </View>
      {
        picList && picList.length && (
          <View className="flex-row">
            {
              picList.map(ele => {
                const {
                  url, type, index,
                  dishName, price
                } = ele
                const isDish = type === 'DISH'
                return (
                  <View
                    className="goods flex-col flex-ac"
                    key={index}
                  >
                    <View className="pictureSection">
                      <Image src={getServerPic(url)} mode="aspectFill" />
                      {isDish && (<Text className="price">{`￥${price}`}</Text>)}
                    </View>
                    {isDish && (<Text className="goodsName ellipsis">{dishName}</Text>)}
                  </View>
                )
              })
            }
          </View>
        )
      }
    </View>
  )
}
