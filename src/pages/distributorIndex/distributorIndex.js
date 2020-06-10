import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Text, Image, Button, MovableArea, MovableView
} from '@tarojs/components'
import {
  AtList, AtListItem, AtCurtain
} from 'taro-ui'
import {
  connect
} from '@tarojs/redux'
import './index.scss'
import {
  getServerPic, getUserDetail, getUserDistributor, navToPage, needLogin, objNotNull, judgeLegendsCard, toDecimal, productTypeAnd
} from '../../utils/utils'
import { platformPoster, productPoster, merchantPoster } from '../../config/posterConfig'
import IconFont from '../../components/IconFont/IconFont'
import { STATIC_IMG_URL, INDEX_URL, APP_ID, PRODUCT_URL, PLATFORM_ID, MERCHANT_URL } from '../../config/baseUrl'
import {
  TUTORIAL_IMG, MERCHANT_MODEL
} from '../../config/config'
import MakePoster from '../../components/MakePoster/MakePoster'


// import distributor1 from '../../images/icon/distributor1.png'
// import distributor2 from '../../images/icon/distributor2.png'
// import distributor3 from '../../images/icon/distributor3.png'
const SIZE = 6;
@connect(() => ({}))
export default class DistributorIndex extends PureComponent {
  config = {
    navigationBarTitleText: '合伙人中心',
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#ffffff',
    disableScroll: true
  }

  constructor() {
    super()
    this.userDetail = getUserDetail()
    this.userDistibutor = getUserDistributor()
    this.state = {
      allLevels: [],
      distributorInfo: {},
      tutorialModal: false,
      tutorialView: [],
      tutorialStep: 0,
      bonusPool: 0,
      currentTab: 1,
      tabTitle: [
        {
          title: '综合排序',
          active: false,
        },
        {
          title: '佣金最高',
          active: true,
        },
        {
          title: '热享门店',
          active: false,
        },
        {
          title: '最新商品',
          active: false,
        },
      ],
      platformDistribution: {},
      bonus: {},
      makePoster: {
        renderStatus: false,
        config: {}
      },
      distributorCat: 'DISH',
      pagination: {
        page: 0,
        size: SIZE,
        loadMore: 'loading'
      },
      productList: undefined,
      fixed: false,
      platFormSettings: {},
    }
  }
  handleClick(value, name) {
    this.setState({
      currentTab: Number(value),
      distributorCat: name
    })
  }
  onPageScroll(e) {
    // if (e.scrollTop >= 500) {
    //   this.setState({
    //     fixed: true
    //   })
    // }
  }
  clickItem(item) {
    const { tabTitle } = this.state;
    const selectItem = tabTitle.filter(arr => {
      arr.active = false;
      if (item.title === arr.title) {
        arr.active = !arr.active;
        return arr
      }
      return tabTitle
    })
    this.setState({
      tabTitle: selectItem
    })
  }
  // 获取平台
  getPlatform() {
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
  }
  // 分享平台
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
  // 平台发放奖金
  getBonus() {
    const { dispatch } = this.props;
    dispatch({
      type: 'common/getPlatformByDistributionAction',
      callback: ({ ok, data }) => {
        if (ok) this.setState({ bonus: data })
      }
    })
  }
  // 获取文案信息
  getMessage() {
    const { dispatch } = this.props;
    dispatch({
      type: 'common/getPlatformByDistributionAction',
      callback: ({ ok, data }) => {
        if (ok) this.setState({ platformDistribution: data })
      }
    })
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
  // 商品海报分享
  makeProductPoster = shareInfo => {
    console.log('shang')
    const { code } = getUserDistributor()
    const { nickName, headPic } = getUserDetail()
    const {
      shopDishSkus = [],
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
    console.log(dishSku, "dishSku")
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
  // 获取分享商品 getDistributorProductAction
  getShareCommodity() {
    const { dispatch } = this.props;
    const { distributorCat, pagination, pagination: { page, size } } = this.state;
    dispatch({
      type: 'distributor/getDistributorProductAction',
      payload: {
        page, size
      },
      callback: ({
        ok, data
      }) => {
        if (ok) {
          const { productList = [] } = this.state;
          const newList = [...productList, ...data];
          console.log(newList, "newList");
          this.setState({
            productList: data,
            pagination: { ...pagination, loadMore: data.length > SIZE ? 'noMore' : 'loading' }
          })
        } else {
          this.setState({
            productList: []
          })
        }
      }
    })
  }
  // 获取分享门店
  getShareMerchant() {
    const { dispatch } = this.props;
    const { distributorCat, pagination, pagination: { page, size } } = this.state;
    dispatch({
      type: 'distributor/getDistributeMerchant',
      payload: {
        page, size
      },
      callback: ({ ok, data }) => {
        if (ok) {
          console.log(data, 'data')
          this.setState({
            merchantList: data,
            // pagination: { ...pagination, loadMore: data.length > SIZE ? 'noMore' : 'loading' }
          })
        }
      }
    })
  }
  componentDidMount() {
    this.getBonus();
    this.getMessage();
    this.getShareCommodity();
    this.getPlatform();
    this.getShareMerchant();
  }
  componentDidShow() {
    if (!needLogin()) return
    const { islandUserMemberDTO } = getUserDetail()
    if (!judgeLegendsCard(islandUserMemberDTO)) {
      // 会员卡支付后有一定延迟，页面进入等待
      // Taro.reLaunch({ url: '/pages/dredgeUnionCard/dredgeUnionCard' })
      // console.log('不是会员跳转')
    }
    const { dispatch } = this.props
    const { distributorUserId } = this.userDistibutor
    this.userDistibutor = getUserDistributor()
    dispatch({
      type: 'distributor/distributorAllLevelAction',
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            allLevels: data
          })
        }
      }
    })
    if (distributorUserId) {
      dispatch({
        type: 'distributor/getDistributorInfoAction',
        payload: {
          distributorUserId
        },
        callback: ({ ok, data }) => {
          if (ok) {
            this.setState({
              distributorInfo: data
            })
          }
        }
      })
    }
    // 获取赏金池
    dispatch({
      type: 'common/getBonusPoolConfig',
      callback: ({ ok, data }) => {
        if (ok && objNotNull(data)) {
          const { totalMoney } = data
          if (totalMoney < 500) {
            this.setState({
              bonusPool: 32846
            })
            return
          }
          this.setState({
            bonusPool: new Number(totalMoney).toFixed(2)
          })
        }
      }
    })
  }

  viewTutorial = type => {
    this.setState({
      tutorialView: TUTORIAL_IMG[type],
      tutorialModal: false
    })
  }

  nextStep = () => {
    const { tutorialStep, tutorialView } = this.state
    if (tutorialView.length - 1 === tutorialStep) {
      this.setState({
        tutorialView: [],
        tutorialStep: 0
      })
      return
    }
    this.setState({
      tutorialStep: tutorialStep + 1
    })
  }
  toJoin() {
    navToPage('/pages/treasury/balanceRecord/balanceRecord')   // 余额明细
  }

  render() {
    const { nickName, headPic } = this.userDetail
    const { partnerLevelModel } = this.userDistibutor
    const {
      allLevels, tutorialModal,
      tutorialView, tutorialStep,
      distributorInfo: {
        orderCount = 0,
        countTeam = 0,
        islandUserDTO = {},
      }, bonusPool, tabTitle, platformDistribution, bonus, makePoster, distributorCat, productList, platFormSettings: { appLogo },
      merchantList,
    } = this.state
    const { distributionReward = 0 } = islandUserDTO
    return (
      <Block>
        <View className="header">
          <View className="userInfo flex-row flex-ac">
            <Image src={getServerPic(headPic)} className="avatarImg" />
            <View className="flex1">
              <View className="nickName ellipsis">{nickName}</View>
              <View
                className="partner flex-row flex-ac flex-jc"
                onClick={() => { navToPage('/package/distributor/partnerGrade/partnerGrade') }}
              >
                <IconFont value="imgPartnerIcon" h={32} w={38} />
                <View className="title">合伙人</View>
                <IconFont value="icon-arrow-right-copy-copy" size={26} color="#fff" />
              </View>
            </View>
            {
              !(allLevels.length > 0 && partnerLevelModel.level === allLevels[allLevels.length - 1].level) && (
                <IconFont
                  value="imgPartnerUpgrade"
                  h={100}
                  w={100}
                  onClick={() => {
                    navToPage('/package/distributor/gradeUpgrade/gradeUpgrade')
                  }}
                />
              )
            }
          </View>
          {/* <View className="record flex-row flex-sb">
            <View className="item flex-col flex-ac">
              <Text>{distributionReward}</Text>
              <Text>累计收益（元）</Text>
            </View>
            <View className="item flex-col flex-ac">
              <Text>{orderCount}</Text>
              <Text>累计分享单</Text>
            </View>
            <View className="item flex-col flex-ac">
              <Text>{countTeam}</Text>
              <Text>团队总人数</Text>
            </View>
          </View> */}
          <View className="record">
            <View className="current-balance">
              <Text>当前余额(元)</Text>
            </View>
            <View className="flex-row flex-sb flex-item">
              <View className="balance">
                <Text className="current-text">756.52</Text>
              </View>
              <View>
                <View onClick={this.toJoin.bind(this)} className="balance-detail">余额明细</View>
                <View onClick={() => {
                  navToPage('')
                }} className="balance-detail tixian">提现</View>
              </View>
            </View>
          </View>
          <View className="flex-row flex-jc">
            <View
              className="distributorItem flex-row flex-ac flex-sb"
              onClick={() => { navToPage('/package/distributor/distributorRecord/distributorRecord') }}
            >
              <IconFont value="imgPartnerReward" h={68} w={74} />
              <View className="flex-col">
                <Text className="title">收益记录</Text>
                <Text className="msg">分享越多累计收益越多</Text>
              </View>
            </View>
            <View
              className="distributorItem flex-row flex-ac flex-sb"
              onClick={() => { navToPage('/package/distributor/productShare/productShare') }}
            >
              <IconFont value="imgPartnerReward" h={68} w={74} />
              <View className="flex-col">
                <Text className="title">分享悬赏</Text>
                <Text className="msg">分享素材助你快捷赚钱</Text>
              </View>
            </View>
            <View
              className="distributorItem flex-row flex-ac flex-sb"
              onClick={() => { navToPage('/package/distributor/team/team') }}
            >
              <IconFont value="imgPartnerTeam" h={70} w={72} />
              <View className="flex-col">
                <Text className="title">我的团队</Text>
                <Text className="msg">团队成员越多收益越多</Text>
              </View>
            </View>
          </View>
        </View>
        {/* 广告 */}
        {/* <View className="distributorAd" onClick={() => { navToPage('/pages/legendsUserCenter/legendsUserCenter') }}>
          <Text>{bonusPool}</Text>
        </View> */}
        {/* 广告 */}
        {/* 引导 */}
        {/* <View className="distributorList">
          <AtList>
            <AtListItem
              title="分享记录"
              arrow="right"
              thumb={`${STATIC_IMG_URL}/icon/distributor1.png`}
              onClick={() => {
                navToPage('/package/distributor/distributorRecord/distributorRecord')
              }}
            />
            <AtListItem
              title="新手引导"
              arrow="right"
              thumb={`${STATIC_IMG_URL}/icon/distributor3.png`}
              onClick={() => {
                this.setState({
                  tutorialModal: true
                })
              }}
            />
          </AtList>
        </View> */}
        {/* 引导 */}
        {/* 推广赚钱 */}
        <View className='extension'>
          <View className="flex-row">
            <View className="shu">推广赚钱</View>
          </View>
        </View>
        <View className="extension">
          <View className="extension-content-box">
            <View className="extension-content-box-image-box">
              <Image
                src={getServerPic(appLogo)}
                className="extension-content-box-image"
              />
            </View>
            <View className="extension-content-box-right">
              <View className="flex-row flex-sb">
                <View className="title">平台分享</View>
                <View className="title mr">已发奖金：<Text className="color">￥{bonus.totalProfit}</Text></View>
              </View>
              <View className="mt">
                <Text
                  className="copy"
                  onClick={() => {
                    const { imageSlogan } = platformDistribution;
                    if (!imageSlogan) {
                      showToast('暂无分享文案！')
                      return
                    }
                    Taro.setClipboardData({
                      data: imageSlogan
                    })
                  }}
                >复制</Text>
                <Text className="copy-content">分享文案：{platformDistribution.imageSlogan}</Text>
              </View>
              <View className="shareBtn flex-row flex-je mt">
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
                  onClick={() => this.makeTcdPoster(platformDistribution.partnerRecruitmentPoster)}
                >
                  <IconFont value="imgPosterIcon" w={28} h={26} mr={10} />
                生成海报
              </Button>
              </View>
            </View>
          </View>
        </View>
        {/* 推广赚钱 */}
        {/* 门店分享 */}
        <ScrollView>
          <View className={`extension ${this.state.fixed ? 'fixed' : ''}`}>
            <View className="flex-row">
              <View onClick={this.handleClick.bind(this, 0, 'MERCHANT')}>
                <View className={`tab-title ${currentTab === 0 ? 'active' : ''}`}>门店分享</View>
              </View>
              <View style={{ marginLeft: '50px' }} onClick={this.handleClick.bind(this, 1, 'DISH')}>
                <View className={`tab-title ${currentTab === 1 ? 'active' : ''}`}>商品分享</View>
              </View>
            </View>
            <View className="flex-row flex-sb" style={{ marginTop: '30px' }}>
              {
                tabTitle && tabTitle.map((item, index) => {
                  return (
                    <View
                      key={item + index}
                      onClick={this.clickItem.bind(this, item)}
                    >
                      <View className={`tab-item ${item.active === true ? 'tab-item-active' : ''}`}>{item.title}</View>
                    </View>
                  )
                })
              }
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
                      merchantList && merchantList.map(ele => {
                        const {
                          merchantName, logo, id, brandId,
                          distributorMerchantDetail, merchantId,
                          // platFormMerchantDTO: { outerOrderMod } = {},
                          merchantDTO: { merchantDetails: { address } = {} } = {},
                          distributorWords, displayMoney, distributorPoster, totalDisplayMoney
                        } = ele
                        console.log(ele, "MERCHANT")
                        // const merchantMod = MERCHANT_MODEL.filter(({ value }) => productTypeAnd(outerOrderMod, value))
                          // .reduce((acc, cur) => (acc.findIndex(o => o.label === cur.label) === -1 ? [...acc, cur] : acc), [])
                        const maxRatio = distributorMerchantDetail.reduce((acc, { ratio }) => (acc > ratio ? acc : ratio))
                        return (
                          <View className="productContainer" key={id}>
                            <View className="flex-row">
                              <Image className="productImg flex-sk" src={getServerPic(logo)} />
                              <View className="merchantInfo">
                                <View className="flex-row flex-ac">
                                  <Text className="merchantName ellipsis">{merchantName}</Text>
                                  {/* {
                                    merchantMod.map(o => {
                                      const { className, label, value } = o
                                      return (
                                        <Text key={value} className={`label ${className}`}>{label}</Text>
                                      )
                                    })
                                  } */}
                                </View>
                                <Text className="merchantAddress">{`门店地址: ${address}`}</Text>
                              </View>
                            </View>
                            <View className="line" />
                            <View className="shareEarnings flex-row flex-sb">
                              {/* <Text>{`${maxRatio}%`}</Text> */}
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
            {/* <View className="slide-box">
            <View className="extension-content-box" style={{ marginTop: "30px" }}>
              <View className="extension-content-box-image-box">
                <Image
                  src={`${STATIC_IMG_URL}/contact.png`}
                  className="extension-content-box-image"
                />
              </View>
              <View className="extension-content-box-right">
                <View className="flex-row">
                  <View className="merchant-name">何师烧烤（丽都店）</View>
                  <View className="base take-out">外卖</View>
                  <View className="base home-food">堂食</View>
                </View>
                <View className="brand">川式火锅一线品牌</View>
                <View className="address">门店地址：成都市锦江区</View>
              </View>
            </View>
            <View className="emprt-line"></View>
            <View className="extension-content-box-right">
              <View className="flex-row flex-sb">
                <View className="title">分享赚</View>
                <View className="title mr">已发奖金：<Text className="color">￥1568</Text></View>
              </View>
              <View className="mt">
                <Text className="copy">复制</Text>
                <Text className="copy-content">分享文案：书香门第年底巨献海鲜豪华盛宴至尊无敌套餐国际超五星饕餮盛宴又放大招大招！</Text>
              </View>
              <View className="flex-row position mt pl pb">
                <View className="share">
                  <View className="item-center">
                    <Image className="image-icon" src={`${STATIC_IMG_URL}/share.png`} />
                    <Text className="share-content">直接分享</Text>
                  </View>
                </View>
                <View className="share bg" style={{ marginLeft: '10px' }}>
                  <View className="item-center">
                    <Image className="image-icon" src={`${STATIC_IMG_URL}/create.png`} />
                    <Text className="share-content">生成海报</Text>
                  </View>
                </View>
              </View>
            </View>
          </View> */}

          </View>
        </ScrollView>
        {/* 门店分享 */}
        {
          tutorialView.length > 0 && (
            <View className="tutorial">
              <Image
                className="tutorialImg"
                src={tutorialView[tutorialStep]}
              />
              <View className="tutorialOperate" onClick={this.nextStep}>
                {
                  tutorialStep + 1 === tutorialView.length ? <IconFont value="imgKnow" h={100} w={250} /> : <IconFont value="imgNext" h={100} w={250} />
                }
              </View>
            </View>
          )
        }
        <AtCurtain
          isOpened={tutorialModal}
          onClose={() => {
            this.setState({
              tutorialModal: false
            })
          }}
        >
          <View className="tutorialWarp">
            <View onClick={() => { this.viewTutorial('team') }}>分享单品</View>
            <View onClick={() => { this.viewTutorial('product') }}>团队邀请</View>
          </View>
        </AtCurtain>
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
      </Block >
    )
  }
}
