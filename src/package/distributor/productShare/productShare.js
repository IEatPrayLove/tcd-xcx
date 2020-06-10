import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Image, Text, Button, Block
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtLoadMore } from 'taro-ui'
import './productShare.scss'

import {
  getServerPic,
  toDecimal, formatSaleCount,
  randomIntegerInRange, getUserDistributor, getUserDetail, getPlatFormId,
  objNotNull, productTypeAnd, showToast
} from '../../../utils/utils'
import IconFont from '../../../components/IconFont/IconFont'
import {
  APP_ID, MYSELF_URL, PLATFORM_ID, POSTER_URL, PRODUCT_URL, SERVER_IMG,
  MERCHANT_URL, INDEX_URL
} from '../../../config/baseUrl'
import { platformPoster, productPoster, merchantPoster } from '../../../config/posterConfig'
import NoData from '../../../components/NoData/NoData'
import PageLoading from '../../../components/PageLoading/PageLoading'
import MakePoster from '../../../components/MakePoster/MakePoster'
import { MERCHANT_MODEL } from '../../../config/config'

const SIZE = 4

@connect(({ loading: { effects } }) => ({
  effects
}))
export default class ProductShare extends PureComponent {
  config = {
    navigationBarTitleText: '分享悬赏',
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#ffffff',
    enablePullDownRefresh: true,
    backgroundTextStyle: 'dark'
  }

  constructor() {
    super()
    this.state = {
      productList: undefined,
      // merchantList: undefined,
      platFormSettings: {},
      pagination: {
        page: 0,
        size: SIZE,
        loadMore: 'loading'
      },
      makePoster: {
        renderStatus: false,
        config: {}
      },
      distributorCat: 'DISH',
      platformDistribution: {}
    }
  }

  componentDidMount() {
    const { dispatch } = this.props
    dispatch({
      type: 'common/getPlatFormSystemSettingByIdAction',
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            platFormSettings: data
          })
        }
      }
    })
    dispatch({
      type: 'common/getPlatformByDistributionAction',
      callback: ({ ok, data }) => {
        if (ok) this.setState({ platformDistribution: data })
      }
    })
    this.loadList()
  }

  loadList = () => {
    const { dispatch } = this.props
    const { distributorCat } = this.state
    const {
      pagination,
      pagination: { page, size }
    } = this.state
    dispatch({
      type: distributorCat === 'MERCHANT' ? 'distributor/getDistributeMerchant' : 'distributor/getDistributorProductAction',
      payload: {
        page, size
      },
      callback: ({ ok, data }) => {
        Taro.stopPullDownRefresh()
        if (ok) {
          const { productList = [] } = this.state
          const newList = [...productList, ...data]
          this.setState({
            productList: newList,
            pagination: { ...pagination, loadMore: data.length < SIZE ? 'noMore' : 'loading' }
          })
        } else {
          this.setState({
            productList: []
          })
        }
      }
    })
    // dispatch({
    //   type: 'distributor/getDistributeMerchant',
    //   callback: ({ ok, data }) => {
    //     if (ok) {
    //       this.setState({
    //         merchantList: data
    //       })
    //     }
    //   }
    // })
  }

  onReachBottom() {
    const {
      pagination,
      pagination: { page, loadMore }
    } = this.state
    if (loadMore === 'noMore') return
    this.setState({
      pagination: { ...pagination, page: page + 1 }
    }, () => {
      this.loadList()
    })
  }

  onPullDownRefresh() {
    this.setState({
      pagination: {
        page: 0,
        loadMore: 'loading',
        size: SIZE
      },
      productList: undefined
    }, () => {
      this.loadList()
    })
  }

  onShareAppMessage(res) {
    const {
      product = {}, platform = {}, merchant = {}
    } = res.target.dataset
    const { code } = getUserDistributor()
    if (objNotNull(merchant)) {
      const {
        merchantId, brandId, logo, merchantName
      } = merchant
      return {
        title: merchantName,
        imageUrl: getServerPic(logo),
        path: `/package/multiStore/merchantDetail/merchantDetail?id=${merchantId}&brandId=${brandId}&code=${code || ''}`
      }
    }
    if (objNotNull(platform)) {
      const { appLogo, appName } = platform
      return {
        title: appName,
        imageUrl: getServerPic(appLogo),
        path: `/pages/index/index?dishId=code=${code || ''}`
      }
    }
    const {
      shopDishSkus = [], shareName, merchantId,
      dishPic = ''
    } = product
    const minSku = shopDishSkus ? shopDishSkus.sort((a, b) => a.price - b.price)[0] : {}
    const { dishId } = minSku
    return {
      title: shareName,
      imageUrl: getServerPic(dishPic.split(',')[0]),
      path: `/pages/goodsDetails/goodsDetails?dishId=${dishId}&platFormId=${PLATFORM_ID}&merchantId=${merchantId}&code=${code || ''}`
    }
  }

  // 平台海报生成
  makeTcdPoster = poster => {
    console.log('ping')
    if (!poster) {
      showToast('海报图片有误！')
      return
    }
    Taro.showLoading({
      title: '绘制中...',
      mask: true
    })
    const { dispatch } = this.props
    const { code } = getUserDistributor()
    dispatch({
      type: 'legendsCard/getShareQrCodeAction',
      payload: {
        qrContent: `${INDEX_URL}?code=${code || ''}`,
        userId: getUserDetail().id,
        appId: APP_ID
      },
      callback: ({ ok, data }) => {
        if (ok && data.url) {
          this.setState({
            makePoster: {
              renderStatus: true,
              config: platformPoster({ codeUrl: data.url, posterUrl: poster })
            }
          })
        } else {
          Taro.hideLoading()
        }
      }
    })
  }


  // 门店海报分享
  makeMerchantPoster = (posterUrl, append) => {
    console.log('men')
    Taro.showLoading({
      title: '绘制中...',
      mask: true
    })
    const { dispatch } = this.props
    const { code } = getUserDistributor()
    const { merchantId, brandId } = append
    dispatch({
      type: 'legendsCard/getShareQrCodeAction',
      payload: {
        qrContent: encodeURIComponent(`${MERCHANT_URL}?merchantId=${merchantId}&brandId=${brandId}&code=${code || ''}`),
        userId: getUserDetail().id,
        appId: APP_ID
      },
      callback: ({ ok, data }) => {
        if (ok && data.url) {
          this.setState({
            makePoster: {
              renderStatus: true,
              config: merchantPoster({ qrUrl: data.url, posterUrl })
            }
          })
        } else {
          Taro.hideLoading()
        }
      }
    })
  }

  // 商品海报分享
  makeProductPoster = shareInfo => {
    console.log('shang')
    const { code } = getUserDistributor()
    const { nickName, headPic } = getUserDetail()
    const {
      shopDishSkus,
      shopDishSkus: [{ dishId }],
      dishPic: imagePath,
      shareName: dishName,
      dishDescription: description,
      merchantId: id, merchantName: merchant_name,
      merchantAddress: address,
      merchantPrincipalMobile: principal_mobile,
      tcdDistributorProportion
    } = shareInfo
    const { dispatch } = this.props
    const dishSku = shopDishSkus.reduce(
      (acc, cur) => (acc.price > cur.price ? cur : acc)
    )
    const buyEarn = toDecimal(dishSku.price * tcdDistributorProportion * 0.01)
    const { memberPrice, price, originalPrice } = dishSku
    const OriginalPrice = originalPrice ? originalPrice : price
    Taro.showLoading({
      title: '绘制中...'
    })
    dispatch({
      type: 'legendsCard/getShareQrCodeAction',
      payload: {
        qrContent: encodeURIComponent(`${PRODUCT_URL}?code=${code || ''}&dishId=${dishId}&merchantId=${id}&platFormId=${PLATFORM_ID}`),
        userId: getUserDetail().id,
        appId: APP_ID
      },
      callback: ({ ok, data }) => {
        if (ok && data.url) {
          const config = productPoster({
            headPic,
            imagePath,
            codeUrl: data.url,
            nickName,
            dishName,
            description,
            price: memberPrice ? memberPrice : price,
            OriginalPrice,
            shopDishSkus,
            merchant_name,
            address,
            principal_mobile,
            buyEarn
          })
          this.setState({
            makePoster: { renderStatus: true, config }
          })
        } else {
          Taro.hideLoading()
        }
      }
    })
  }

  // 分销分类
  catChange = val => {
    this.setState({
      distributorCat: val,
      productList: [],
      pagination: {
        page: 0,
        loadMore: 'loading',
        size: SIZE
      }
    }, () => {
      this.loadList()
    })
  }

  render() {
    const {
      productList = [], canvasStatus, shareImage,
      config, platFormSettings, pagination: { loadMore, page },
      platFormSettings: { appLogo }, makePoster, merchantList,
      distributorCat,
      platformDistribution: { partnerRecruitmentPoster, imageSlogan, totalProfit },
    } = this.state
    console.log(platFormSettings,'platFormSettings')
    const {
      effects = {}
    } = this.props
    return (
      <Block>
        {
          ((effects['distributor/getDistributorProductAction'] && page === 0)
            || effects['common/getPlatFormSystemSettingByIdAction']) && (
            <PageLoading />
          )
        }
        <Text className="typeTitle">
          <Text />
          平台推广
        </Text>
        <View className="platform flex-row">
          <Image className="flex-sk" src={getServerPic(appLogo)} />
          <View className="flex-col">
            <Text className="price">￥{totalProfit}</Text>
            <View className="shareWrite platformMsg">
              <View
                className="copy"
                onClick={() => {
                  if (!imageSlogan) {
                    showToast('暂无分享文案！')
                    return
                  }
                  Taro.setClipboardData({
                    data: imageSlogan
                  })
                }}
              >
                复制
              </View>
              <Text>分享文案：</Text>
              <Text>{imageSlogan || '--'}</Text>
            </View>
            <View className="shareBtn flex-row flex-je">
              <Button
                className="weChatBtn flex-row flex-ac"
                data-platform={platFormSettings}
                openType="share"
              >
                <IconFont value="imgShareIcon" w={25} h={26} mr={10} />
                直接分享
              </Button>
              <Button
                className="posterBtn flex-row flex-ac"
                onClick={() => this.makeTcdPoster(partnerRecruitmentPoster)}
              >
                <IconFont value="imgPosterIcon" w={28} h={26} mr={10} />
                生成海报
              </Button>
            </View>
          </View>
        </View>

        <View className="distributorCat">
          <Text onClick={() => this.catChange('DISH')} className={`${distributorCat === 'DISH' && 'active'}`}>商品分享</Text>
          <Text onClick={() => this.catChange('MERCHANT')} className={`${distributorCat === 'MERCHANT' && 'active'}`}>门店分享</Text>
        </View>
        {
          distributorCat === 'DISH' ? (
            <Block>
              {
                productList && productList.map(ele => {
                  const {
                    dishPic = '', shareName, shareBrief,
                    tcdDistributorProportion, shopDishSkus = [],
                    id, totalDistributionRewards
                  } = ele
                  const minSku = shopDishSkus ? shopDishSkus.sort((a, b) => a.price - b.price)[0] : {}
                  const price = toDecimal(minSku.price * tcdDistributorProportion * 0.01)
                  return (
                    <View className="productContainer" key={id}>
                      <View className="flex-row">
                        <Image className="productImg flex-sk" src={dishPic ? getServerPic(dishPic.split(',')[0]) : ''} />
                        <View className="productInfo flex-col flex-sb">
                          <Text>{shareName}</Text>
                          <Text>{minSku.price}</Text>
                        </View>
                      </View>
                      <View className="line" />
                      <View className="shareEarnings flex-row flex-sb">
                        <Text>{`￥${price}`}</Text>
                        <Text>{`￥${totalDistributionRewards || 0}`}</Text>
                      </View>
                      <View className="shareWrite">
                        <View
                          className="copy"
                          onClick={() => {
                            Taro.setClipboardData({ data: shareBrief })
                          }}
                        >
                          复制
                        </View>
                        <Text>分享文案：</Text>
                        <Text>{shareBrief}</Text>
                      </View>
                      <View className="shareBtn flex-row flex-je">
                        <Button
                          className="weChatBtn flex-row flex-ac"
                          data-product={ele}
                          openType="share"
                        >
                          <IconFont value="imgShareIcon" w={25} h={26} mr={10} />
                          直接分享
                        </Button>
                        <Button
                          className="posterBtn flex-row flex-ac"
                          onClick={() => { this.makeProductPoster(ele) }}
                        >
                          <IconFont value="imgPosterIcon" w={28} h={26} mr={10} />
                          生成海报
                        </Button>
                      </View>
                    </View>
                  )
                })
              }
            </Block>
          ) : (
            <Block>
              {
                productList && productList.map(ele => {
                  const {
                    merchantName, logo, id, brandId,
                    distributorMerchantDetail, merchantId,
                    platFormMerchantDTO: { outerOrderMod } = {},
                    merchantDTO: { merchantDetails: { address } = {} } = {},
                    distributorWords, displayMoney, distributorPoster, totalDisplayMoney
                  } = ele
                  const merchantMod = MERCHANT_MODEL.filter(({ value }) => productTypeAnd(outerOrderMod, value))
                    .reduce((acc, cur) => (acc.findIndex(o => o.label === cur.label) === -1 ? [...acc, cur] : acc), [])
                  const maxRatio = distributorMerchantDetail.reduce((acc, { ratio }) => (acc > ratio ? acc : ratio))
                  return (
                    <View className="productContainer" key={id}>
                      <View className="flex-row">
                        <Image className="productImg flex-sk" src={getServerPic(logo)} />
                        <View className="merchantInfo">
                          <View className="flex-row flex-ac">
                            <Text className="merchantName ellipsis">{merchantName}</Text>
                            {
                              merchantMod.map(o => {
                                const { className, label, value } = o
                                return (
                                  <Text key={value} className={`label ${className}`}>{label}</Text>
                                )
                              })
                            }
                          </View>
                          <Text className="merchantAddress">{`门店地址: ${address}`}</Text>
                        </View>
                      </View>
                      <View className="line" />
                      <View className="shareEarnings flex-row flex-sb">
                        <Text>{`${maxRatio}%`}</Text>
                        <Text>{`￥${totalDisplayMoney || 0}`}</Text>
                      </View>
                      <View className="shareWrite">
                        <View
                          className="copy"
                          onClick={() => {
                            Taro.setClipboardData({ data: distributorWords })
                          }}
                        >
                          复制
                        </View>
                        <Text>分享文案：</Text>
                        <Text>{distributorWords}</Text>
                      </View>
                      <View className="shareBtn flex-row flex-je">
                        <Button
                          className="weChatBtn flex-row flex-ac"
                          data-merchant={ele}
                          openType="share"
                        >
                          <IconFont value="imgShareIcon" w={25} h={26} mr={10} />
                          直接分享
                        </Button>
                        <Button
                          className="posterBtn flex-row flex-ac"
                          onClick={() => {
                            const append = { merchantId, brandId }
                            this.makeMerchantPoster(getServerPic(distributorPoster), append)
                          }}
                        >
                          <IconFont value="imgPosterIcon" w={28} h={26} mr={10} />
                          生成海报
                        </Button>
                      </View>
                    </View>
                  )
                })
              }
            </Block>
          )
        }
        {
          productList && productList.length <= 0 && (
            <NoData />
          )
        }

        {
          productList && productList.length !== 0 && (
            <AtLoadMore status={loadMore} />
          )
        }
        {/* 海报 */}
        <MakePoster
          {...makePoster}
          onClose={() => {
            this.setState({
              makePoster: {
                renderStatus: false,
                config: {}
              }
            })
          }}
        />
      </Block>
    )
  }
}
