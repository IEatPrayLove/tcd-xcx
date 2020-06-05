import Taro from '@tarojs/taro'
import {
  Image, Text, View, Block
} from '@tarojs/components'
import './Goods.scss'
import { PRVIMG_URL } from '../../config/baseUrl'
import IonFont from '../IconFont/IconFont'
import { GOODS_TAKE_OUT, SALE_STATE } from '../../config/config'

import {
  dateFormatWithDate, latelyMerchant, navToPage,
  productTypeAnd, calculateDistanceByCoordinate, toDecimal, getServerPic,
  findMinSku, objNotNull
} from '../../utils/utils'

function Goods({
  details = {}, userLocation = {}, distributionList = []
}) {
  const {
    imagePath, dishMerchantShippingInfo, tagStr,
    dishState, saleEndTime, dishId, platId,
    merchantId, lat, lng, shopDish = {}
  } = details
  const {
    dishName, productType, shopDishSkus = []
  } = shopDish
  const distribute = distributionList.find(({ id }) => id === dishId)
  const saleState = SALE_STATE[dishState]
  const totalNum = shopDishSkus.reduce((acc, { initNum, saleNum }) => acc + initNum + saleNum, 0)
  const minSku = findMinSku(shopDishSkus)
  const { latitude, longitude } = userLocation
  const distance = calculateDistanceByCoordinate(lat, latitude, lng, longitude)
  const merchant = userLocation && latelyMerchant(dishMerchantShippingInfo, userLocation)
  const tag = tagStr && tagStr.split(',')
  const productMemberPrice = (minSku.memberPrice !== null && minSku.memberPrice !== undefined) ? minSku.memberPrice + '' : false
  let tcdEarn = null
  if (objNotNull(distribute)) {
    tcdEarn = toDecimal((productMemberPrice || minSku.price) * distribute.distributorProportion / 100)
  }
  return (
    <View
      className="flex-row flex-as goodsItem"
      onClick={() => {
        navToPage(`/pages/goodsDetails/goodsDetails?dishId=${dishId}&platFormId=${platId}&merchantId=${merchantId}`)
      }}
    >
      <View className="imgWarp flex-sk">
        <View className="imgContainer">
          <Image mode="aspectFill" className="goodsImg" src={getServerPic(imagePath)} />
          <View className="goodsEndTime flex-je flex-row">
            <Text>结束时间</Text>
            <Text>{dateFormatWithDate(saleEndTime, 'yyyy-MM-dd')}</Text>
          </View>
          <View className={`goodsSaleState ${saleState.class}`}>{saleState.value}</View>
        </View>
      </View>
      <View>
        <View className="goodsInfo flex-col">
          <Text className="goodsName">
            {productTypeAnd(productType, GOODS_TAKE_OUT) && <Text className="takeOutTag">可外卖</Text>}
            {dishName}
          </Text>
          <View className="disAndSale flex-row flex-ae flex1">
            <IonFont value="icon-dizhi" color="#999999" size="22" pr="6" />
            <Text>
              {merchant.minDistance || `${distance}km` || '请授权'}
            </Text>
            <Text className="line">|</Text>
            <Text>
              销量：
              {totalNum}
            </Text>
          </View>
          <View>
            {
              productMemberPrice && (
                <View className="memberPrice flex-row flex-ac">
                  <Text>会员价</Text>
                  <Text className="flex-gw">{productMemberPrice}</Text>
                  {
                    distribute && tcdEarn && (
                      <View className="tc flex-row flex-ac">
                        <IonFont value="imgLegendsLogo3" w={24} h={22} mr={4} />
                        <Text className="money ellipsis">{`会员再返￥${tcdEarn}`}</Text>
                        <View className="triangle" />
                      </View>
                    )
                  }
                </View>
              )
            }
            <View className="goodsPrice flex-row flex-ae">
              <Text>￥</Text>
              <Text className={!minSku.originalPrice && 'flex-gw'}>{minSku.price}</Text>
              {
                minSku.originalPrice && (
                  <Text className="flex-gw">
                    ￥
                    {minSku.originalPrice}
                  </Text>
                )
              }
              {
                distribute && tcdEarn && !productMemberPrice && (
                  <View className="tc flex-row flex-ac">
                    <IonFont value="imgLegendsLogo3" w={24} h={22} mr={4} />
                    <Text className="money ellipsis">{`会员再返￥${tcdEarn}`}</Text>
                    <View className="triangle" />
                  </View>
                )
              }
            </View>
          </View>
        </View>
        {
          tag && tag.length > 0 && (
            <View className="tagsWrap flex-row">
              {
                tag.map((ele, index) => (
                  <View
                    className={`goods-tag tagColor${index}`}
                    key={index}
                  >
                    {ele}
                  </View>
                ))
              }
            </View>
          )
        }
      </View>
    </View>
  )
}

export default Goods
// export default Taro.memo(Goods)
