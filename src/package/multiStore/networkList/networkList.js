import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { AtIcon, AtModal } from 'taro-ui'
import { connect } from '@tarojs/redux'
import './networkList.scss'
import { getUserLocation, typeAnd, locationArea, navToPage } from '../../../utils/utils'
import { MERHCANT_WEEK } from '../../../config/config'
import { PLATFORM_ID, STATIC_IMG_URL } from '../../../config/baseUrl'

@connect(({   }) => ({
    
}))
export default class NetworkList extends PureComponent {
    config = {
        navigationBarTitleText: '分店列表',
        navigationBarBackgroundColor: '#ffffff',
        navigationBarTextStyle: 'black'
    }

    constructor() {
        super()
        this.state = {
            merchantId: Number(this.$router.params.merchantId),
            nowMerchant: {},
            otherMerchant: [],
            isOutDistance: false,
            shippingInfo: [],
            position: '',
            shippingType: 1
        }
    }

    componentDidShow() {
        this.loadMerchantList()
    }

    // 获取门店
    loadMerchantList = () => {
        const { merchantId } = this.state
        const { longitude, latitude } = getUserLocation()
        this.props.dispatch({
            type: 'merchant/getAllMerchantAction',
            payload: {
                page: 0,
                orderType: 2,
                size: 9999,
                outerOrderMod: 2,
                position: `${longitude},${latitude}`,
                platformId: PLATFORM_ID
            },
            callback: ({ ok, data, header }) => {
                if (ok) {
                    const merchant = data.filter(item => item.id === merchantId)
                    const merchantList = data.filter(item => item.id !== merchantId)
                    this.setState({
                        nowMerchant: merchant[0] || {},
                        otherMerchant: merchantList
                    })
                }
            }
        })
    }

    // 计算营业时间
    shopTime = businessHours => {
        const businessWeek = MERHCANT_WEEK.filter(ele => typeAnd(businessHours, ele.value))
        const week = businessWeek.map(item => item.name) || []
        return week.length === 7 ? '周一至周日' : week.join(',')
    }

    // 获取门店信息
    getMerchant = merchantId => {
        this.props.dispatch({
            type: 'merchant/getMerchantDetailAction',
            payload: {
                platformId: PLATFORM_ID,
                merchantId
            },
            callback: ({ ok, data }) => {
                if (ok) {
                    const { shippingType, merchantShippingInfoDTO, merchantDTO } = data
                    const { longitude, latitude } = getUserLocation()
                    if (shippingType === 1) {
                        if (locationArea(merchantShippingInfoDTO ? merchantShippingInfoDTO.shippingRange : [], {
                            longitude, latitude
                        })) {
                            Taro.reLaunch({ url: `/package/multiStore/orderDishes/orderDishes?id=${merchantId}` })
                        } else {
                            this.setState({
                                shippingInfo: merchantShippingInfoDTO.shippingRange,
                                position: merchantDTO && merchantDTO.merchantDetails && merchantDTO.merchantDetails.position ? merchantDTO.merchantDetails.position : '',
                                shippingType,
                                isOutDistance: true
                            })
                        }
                    } else {
                        this.setState({
                            shippingType,
                            position: merchantDTO && merchantDTO.merchantDetails && merchantDTO.merchantDetails.position ? merchantDTO.merchantDetails.position : ''
                        })
                        this.getSelfRange(merchantDTO.merchantNo, merchantId)
                    }
                }
            }
        })
    }

    // 获取自配送范围
    getSelfRange = (merchantNo, merchantId) => {
        this.props.dispatch({
            type: 'takeOutConfirm/getSendSetAction',
            payload: { merchantNo },
            callback: ({ ok, data }) => {
                if (ok) {
                    const { priceAndRangeDtoList = [] } = data
                    const { longitude, latitude } = getUserLocation()
                    const areaList = priceAndRangeDtoList.filter(item => item.range && locationArea(JSON.parse(item.range), { longitude, latitude }))
                    if (areaList.length > 0) {
                        Taro.reLaunch({ url: `/package/multiStore/orderDishes/orderDishes?id=${merchantId}` })
                    } else {
                        this.setState({
                            shippingInfo: priceAndRangeDtoList,
                            isOutDistance: true
                        })
                    }
                }
            }
        })
    }

    // 重新定位
    againChooseAddress = () => {
        const { latitude, longitude } = getUserLocation()
        const { shippingInfo, position, shippingType } = this.state
        
        const range = [{
          shippingRange: shippingInfo,
          position
        }]
        if (shippingType === 2) {
          Taro.navigateTo({
            // 传递当前用户位置
            url: `/package/multiStore/mapRange/mapRange?latitude=${latitude}&longitude=${longitude}&range=${JSON.stringify(range)}&selfSend=true`
          })
        } else {
          Taro.navigateTo({
            // 传递当前用户位置
            url: `/package/multiStore/mapRange/mapRange?latitude=${latitude}&longitude=${longitude}&range=${JSON.stringify(range)}&selfSend=false`
          })
        }
    }

    render() {
        const { nowMerchant, otherMerchant, isOutDistance } = this.state

        return (
            <View className="merchant">
                <View 
                    className="searchBox flex-row flex-ac flex-sb"
                    onClick={() => {
                        navToPage('/package/multiStore/search/search')
                    }}
                >
                    <Text>请输入门店名称</Text>
                    <Image src={`${STATIC_IMG_URL}/icon/icon_search.png`} />
                </View>
                <View className="merchantBox">
                    <View className="merchantTitle">当前门店</View>
                    <View className="merchantList">
                        <View className="merchantItem flex-row flex-ac">
                            <View className="merchantLeft">
                                <View className="merchantName">{nowMerchant.merchant_name}</View>
                                <View className="merchantInfo flex-row flex-ac">
                                    <Image className="attrIcon" src={`${STATIC_IMG_URL}/icon/icon_address.png`} />
                                    <View className="infoWord">{nowMerchant.merchantDetails && nowMerchant.merchantDetails.address ? nowMerchant.merchantDetails.address : ''}</View>
                                </View>
                                <View className="merchantInfo flex-row flex-ac">
                                    <Image className="timeIcon" src={`${STATIC_IMG_URL}/icon/icon_time_gray.png`} />
                                    <View className="infoWord">
                                        {
                                            this.shopTime(nowMerchant.businessHours)
                                        }
                                        {' '}
                                        {nowMerchant.shopHours}
                                    </View>
                                </View>
                            </View>
                            <View className="merchantRight">
                                <View className="merchantDistance">{`${nowMerchant.distance || 0}Km`}</View>
                                <View 
                                    className="goShop"
                                    onClick={() => {
                                        Taro.reLaunch({ url: `/package/multiStore/orderDishes/orderDishes?id=${nowMerchant.id}` })
                                    }}
                                >
                                    去点餐
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
                <View className="merchantBox">
                    <View className="merchantTitle">其它门店</View>
                    <View className="merchantList">
                        {
                            otherMerchant.map(item => (
                                <View className="merchantItem flex-row flex-ac">
                                    <View className="merchantLeft">
                                        <View className="merchantName">{item.merchant_name}</View>
                                        <View className="merchantInfo flex-row flex-ac">
                                            <Image className="attrIcon" src={`${STATIC_IMG_URL}/icon/icon_address.png`} />
                                            <View className="infoWord">{item.merchantDetails && item.merchantDetails.address ? item.merchantDetails.address : ''}</View>
                                        </View>
                                        <View className="merchantInfo flex-row flex-ac">
                                            <Image className="timeIcon" src={`${STATIC_IMG_URL}/icon/icon_time_gray.png`} />
                                            <View className="infoWord">
                                                {
                                                    this.shopTime(item.businessHours)
                                                }
                                                {' '}
                                                {item.shopHours}
                                            </View>
                                        </View>
                                    </View>
                                    <View className="merchantRight">
                                        <View className="merchantDistance">{`${item.distance || 0}Km`}</View>
                                        <View 
                                            className="goShop"
                                            onClick={() => {
                                                this.getMerchant(item.id)
                                            }}
                                        >
                                            去点餐
                                        </View>
                                    </View>
                                </View>
                            ))
                        }
                    </View>
                </View>

                {/* 超出配送范围 */}
                <AtModal
                    isOpened={isOutDistance}
                    className="modalStyle"
                    // title='超出配送'
                    cancelText='取消'
                    confirmText='重新定位'
                    onClose={() => {
                        this.setState({
                            isOutDistance: false
                        })
                    }}
                    onCancel={() => {
                        this.setState({
                            isOutDistance: false
                        })
                    }}
                    onConfirm={() => {
                        this.setState({
                            isOutDistance: false
                        })
                        this.againChooseAddress()
                    }}
                    content='您当前所在的位置距离 已超出该门店配送范围'
                />
            </View>
        )
    }
}