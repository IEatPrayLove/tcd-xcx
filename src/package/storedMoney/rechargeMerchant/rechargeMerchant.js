import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
// import { AtIcon, AtModal } from 'taro-ui'
import { connect } from '@tarojs/redux'
import './rechargeMerchant.scss'
import { getUserLocation, typeAnd, navToPage, isFunction, getPlatFormInfo } from '../../../utils/utils'
import { MERHCANT_WEEK } from '../../../config/config'
import { PLATFORM_ID, STATIC_IMG_URL } from '../../../config/baseUrl'


@connect(({}) => ({}))
export default class rechargeMerchant extends Component {
    config = {
        navigationBarTitleText: '分店列表',
        navigationBarBackgroundColor: '#ffffff',
        navigationBarTextStyle: 'black'
    }

    constructor() {
        super()
        this.state = {
            nowMerchant: {},
            otherMerchant: [],
            merchantId: Number(this.$router.params.merchantId)
        }
    }

    componentDidShow() {
        this.loadMerchantList()
    }

    // 获取门店
    loadMerchantList = () => {
        const { merchantId } = this.state
        const { enterpriseGuid } = getPlatFormInfo()
        const { longitude, latitude } = getUserLocation()
        this.props.dispatch({
            type: 'merchant/getAllMerchantAction',
            payload: {
                page: 0,
                orderType: 2,
                size: 9999,
                outerOrderMod: 26,
                position: `${longitude},${latitude}`,
                platformId: PLATFORM_ID
            },
            callback: ({ ok, data }) => {
                if (ok) {
                    this.props.dispatch({
                        type: 'storedMoney/getRuleMerchantAction',
                        payload: {
                            systemManagementGuid: this.$router.params.systemManagementGuid,
                            enterpriseGuid
                        },
                        callback: res => {
                            const list = data.filter(item => res.data.storeGuid.includes(item.thirdNo))
                            const merchant = list.filter(item => item.id === merchantId)
                            const merchantList = list.filter(item => item.id !== merchantId)
                            this.setState({
                                nowMerchant: merchant[0] || {},
                                otherMerchant: merchantList
                            })
                        }
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

    changeMerchant = merchant => {
        const pages = Taro.getCurrentPages()
        const prevPage = pages[pages.length - 2]
        const prevComponent = prevPage.$component || {}
        isFunction(prevComponent.goBackCll) && prevComponent.goBackCll(JSON.stringify(merchant))
        Taro.navigateBack()
    }

    render() {
        const { nowMerchant, otherMerchant } = this.state
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
                                        this.changeMerchant(nowMerchant)
                                    }}
                                >
                                    去充值
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
                                                this.changeMerchant(item)
                                            }}
                                        >
                                            去充值
                                        </View>
                                    </View>
                                </View>
                            ))
                        }
                    </View>
                </View>
            </View>
        )
    }
}