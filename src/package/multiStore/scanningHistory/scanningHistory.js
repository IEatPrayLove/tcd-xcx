import Taro, { Component } from '@tarojs/taro'
import { View  } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import './scanningHistory.scss'
import { getServerPic, toDecimal, navToPage, imitateObjectValues, showLoading, hideLoading } from '../../../utils/utils'
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
      orderSn: this.$router.params.orderSn,
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
      tableFee: 0
    }
  }

  componentDidMount() {
    const { orderSn } = this.state
    const { orderingInfo, tableInfo, payType, currentMerchant } = this.$router.preload
    if (orderSn && orderSn !== 'null') {
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
    const { merchantId } = this.state
    this.props.dispatch({
      type: 'orderDishes/getOrderAction',
      payload: {
        platFormId: PLATFORM_ID,
        merchantId,
        orderSn,
        isCompute: false
      },
      callback: (res) => {
        if (res.ok && res.data && res.data[0]) {
          this.setState({
            oldOrder: res.data[0],
            oldProcuct: res.data[0].shopOrderProductInfoDTOS || [],
            clickNum: res.data[0].orderNum - 0 + 1 || 1,
            tableFee: res.data[0].tableFee.totalFee || 0
          })
        }
      }
    })
  }

  getOrderGoods = item => {
    const {
      allProduct,
      orderingInfo: { productInTrolleyDTO },
      currentMerchant: { id: merchantId },
      brandId
    } = item
    return allProduct
      .reduce((arr, { shopDishProductCats }) => [...arr, ...shopDishProductCats], [])
      .reduce((arr, acc) => {
        const { shopDishSkus, dishImageUrl } = acc
        shopDishSkus.map(ele => {
          const { id } = ele
          productInTrolleyDTO.map(car => {
            const {
              productId: carSkuId, attribute = '',
              dishName, number, price,
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
    const { newGoods, tableInfo, shoppingCar, remark, orderSn } = this.state
    const {
      currentMerchant,
      brandId
    } = this.$router.preload
    let extendedInfo = {
      orderMark: remark
    }
    this.props.dispatch({
      type: 'orderDishes/submitOrderAction',
      payload: {
        peopleNum: tableInfo.peopleNum,
        tableNum: tableInfo.tableNum,
        tableName: tableInfo.tableName,
        shoppingCartUid: shoppingCar.uid,
        shopOrderExtendedInfoDTO: extendedInfo,
        shopOrderProductInfoDTOS: newGoods,
        orderType: "SCAN_CODE_PAY_LATER",
        merchantId: currentMerchant.id,
        merchantNo: currentMerchant.merchantNo,
        merchantUserId: currentMerchant.userId,
        brandId,
        platformId: PLATFORM_ID,
        orderSn: orderSn === 'null' ? '' : orderSn
      },
      callback: (res) => {
        if (res.ok) {
          this.setState({
            friendSettleVisible: true,
            orderSn: res.data.orderSn
          }, () => {
            hideLoading()
          })
        } else {
          hideLoading()
          showToast(res.data.message)
        }
      }
    })
  }

  // 输入订单备注
  inputRemark = () => {
    navToPage(`/pages/orderRemark/orderRemark?oldRemark=${this.state.remark}`)
  }

  // 从其他页面返回回调函数
  goBackCll = params => {
    this.setState({
      remark: params
    })
  }

  render() {
    const { newGoods, friendSettleVisible, remark, tableInfo, oldOrder, merchantId, orderSn, oldProcuct = [], payType, merchantInfo, shoppingCar, clickNum, tableFee } = this.state
    let productNumber = 0
    newGoods.map(item => {productNumber += Number(item.productNum)})
    oldProcuct.map(item => {productNumber += Number(item.productNum)})

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
            <View className="onceTitle">第{clickNum}次点餐</View>
            <View className="dishTitle">已选商品({newGoods.length})</View>
            <View className="dishList">
              {
                newGoods.map(ele => {
                  const { imageUrl, productName, spec, selfSupportDishPropertyTempList, productNum, productPrice } = ele
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
                      <View className="dishPrcie">
                        <Text>￥</Text>
                        <Text>{productPrice}</Text>
                      </View>
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
                      const { imageUrl, productName, spec, selfSupportDishPropertyTempList, productNum, productPrice } = ele
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
                          <View className="dishPrcie">
                            <Text>￥</Text>
                            <Text>{productPrice}</Text>
                          </View>
                        </View>
                      )
                    })
                  }
                </View>
              </View>
            )
          }
          <View className="totalMoney flex-row flex-sb flex-ae">
            <Text className="tableFeeTitle">桌台费</Text>
            <Text className="tableFee">{`￥${tableFee}`}</Text>
          </View>
          <View className="totalMoney flex-row flex-je flex-ae">
            <Text>共{productNumber}件商品</Text>
            <Text className="marL">总计</Text>
            <Text className="priceUnit">￥</Text>
            <Text className="priceMoney">{toDecimal((shoppingCar.totalAmount || 0) + (oldOrder.productFee || 0) + (tableFee || 0))}</Text>
          </View>
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
                        Taro.navigateBack()
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
                        navToPage(`/package/multiStore/scanOrderDetail/scanOrderDetail?merchantId=${merchantId}&orderSn=${orderSn}&payType=${payType}`)
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