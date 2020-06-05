import Taro, { Component } from '@tarojs/taro'
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
            tableFee: 0,
            fromPage: ''
        }
      }
    

    componentDidShow() {
        Taro.setNavigationBarColor({
          backgroundColor: Taro.getStorageSync('systemColor'),
          frontColor: "#ffffff"
        })
        this.getOrder()
    }

    onPullDownRefresh() {
        this.getOrder()
        Taro.stopPullDownRefresh()
    }

    getOrder = () => {
        const { merchantId, orderSn } = this.state
        this.props.dispatch({
          type: 'orderDishes/getOrderAction',
          payload: {
            platFormId: PLATFORM_ID,
            merchantId,
            orderSn,
            isCompute: true
          },
          callback: (res) => {
            if (res.ok && res.data && res.data[0]) {
                this.setState({
                    orderInfo: res.data[0],
                    productList: res.data[0].shopOrderProductInfoDTOS || [],
                    tableFee: res.data[0].tableFee.totalFee || 0
                })
              }
          }
        })
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

    render() {
        const { orderSn, orderInfo, productList = [], tableFee } = this.state
        const { tableInfo, currentMerchant, fromPage } = this.$router.preload
        let productNumber = 0
        productList.map(item => {productNumber += Number(item.productNum)})

        return (
            <View className="detailBox">
                <View className="detailHeader" style={{ background: `${Taro.getStorageSync('systemColor')}` }}>
                    <View className="flex-row flex-sb flex-ac">
                        <View className="flex-row">
                            <Image className="onPayImg" src={`${STATIC_IMG_URL}/icon/no_pay.png`} />
                            <View className="noPayWord">待付款</View>
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
                <View className="whiteBox orderHistory">
                    <View className="orderOnce">
                        <View className="dishTitle">已选商品({productList.length})</View>
                        <View className="dishList">
                            {
                                productList.map(ele => {
                                    const { imageUrl, productName, spec, selfSupportDishPropertyTempList, productNum, productPrice } = ele
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
                                            <View className="dishPrcie">
                                                <Text>￥</Text>
                                                <Text>{productPrice}</Text>
                                            </View>
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
                <View className="orderFooter flex-row flex-sb">
                    <View 
                        className="footerPrice"
                        onClick={() => {
                            if (fromPage === 'index') {
                                Taro.navigateBack()
                            } else {
                                Taro.navigateBack({ delta: 2 })
                            }
                        }}
                    >
                        继续加菜
                    </View>
                    <View 
                        className="submitBtn"
                        onClick={() => {
                            this.$preload({
                                allProduct: productList,
                                orderingInfo: orderInfo,
                                payType: this.$router.params.payType,
                                tableInfo,
                                currentMerchant,
                                orderSn
                            })
                            navToPage('/package/multiStore/scanningConfirm/scanningConfirm')
                        }}
                    >
                        订单结算
                    </View>
                </View>
            </View>
        )
    }
}