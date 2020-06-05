import Taro from '@tarojs/taro'
import {
  View, ScrollView, Text,
  Image, Block
} from '@tarojs/components'
import './LimitGoods.scss'
import IconFont from '../IconFont/IconFont'
import {
  GOODS_MODEL
} from '../../config/config'
import {
  getServerPic,
  productTypeAnd,
  findMinSku, objNotNull, toDecimal, navToPage
} from '../../utils/utils'

const dayjs = require('dayjs')


export default function LimitGoods({ details = {}, distributionList = [] }) {
  const {
    shopDish, imagePath, saleEndTime,
    dishId, platId, merchantId
  } = details
  const {
    productType, dishName, shopDishSkus = []
  } = shopDish || {}
  const [residueStock, sellAmount, initAmount] = shopDishSkus.reduce((acc, { stock, saleNum, initNum }) => {
    acc[0] += stock
    acc[1] += saleNum
    acc[2] += initNum
    return acc
  }, [0, 0, 0])
  const curSku = findMinSku(shopDishSkus)
  const memberPrice = curSku.memberPrice !== null && curSku.memberPrice !== undefined ? `${curSku.memberPrice}` : false
  const distribute = distributionList.find(({ id }) => id === dishId)
  const goodsModel = GOODS_MODEL.find(o => productTypeAnd(productType, o.value))
  let tcdEarn = null
  if (objNotNull(distribute)) {
    tcdEarn = toDecimal(curSku.price * distribute.distributorProportion / 100)
  }
  return (
    <View className="limitGoodsContainer">
      <View
        className="container flex-row"
        onClick={() => {
          navToPage(`/pages/goodsDetails/goodsDetails?dishId=${dishId}&platFormId=${platId}&merchantId=${merchantId}`)
        }}
      >
        <View className="pictureSection flex-sk">
          <Text className={`statusLabel ${goodsModel && goodsModel.className}`}>
            {
              goodsModel && goodsModel.label.slice(0, 2)
            }
          </Text>
          <Image mode="aspectFill" src={getServerPic(imagePath)} />
          <View className="remainingTime flex-row">
            <text>结束时间</text>
            <text>{dayjs(saleEndTime).format('YYYY-MM-DD')}</text>
          </View>
        </View>
        <View className="goodsSection flex-gw flex-col flex-sb">
          <View className="goodsName">{dishName}</View>
          <View className="surplus flex-row flex-ac">
            <View className="progress">
              <View className="curSurplus" style={{ width: `${(sellAmount + initAmount) / (residueStock + sellAmount + initAmount) * 100}%` }} />
            </View>
            <Text>{`还剩${residueStock}份`}</Text>
          </View>
          <View className="flex-row flex-ac">
            {
              memberPrice && (
                <Block>
                  <IconFont value="imgMemberPrice2" h={28} w={64} />
                  <Text className="memberPrice">{memberPrice}</Text>
                </Block>
              )
            }
            {
              tcdEarn && (
                <View className="tc flex-row flex-ac">
                  <IconFont value="imgLegendsLogo3" w={24} h={22} mr={4} />
                  <Text className="money ellipsis">{`会员再返￥${tcdEarn}`}</Text>
                  <View className="triangle" />
                </View>
              )
            }
          </View>
          <View className="buy flex-row flex-sb flex-ac">
            <View>
              <Text className="priceUnit">￥</Text>
              <Text className="price">{curSku.price}</Text>
              {
                curSku.originalPrice && curSku.originalPrice > curSku.price && (
                  <Text className="originalPrice">{`￥${curSku.originalPrice}`}</Text>
                )
              }
            </View>
            <View className="buyBtn">去抢购></View>
          </View>
        </View>
      </View>
    </View>
  )
}
