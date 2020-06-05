import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Text, Image
} from '@tarojs/components'
import {
  connect
} from '@tarojs/redux'
import {
  getServerPic,
  getUserDistributor,
  objNotNull,
  strReplaceParams,
  formatCurrency,
  hideLoading,
  showLoading,
  toDecimal,
  getUserLocation,
  latelyMerchant,
  encodeURIObj, navToPage, setUserDistributor
} from '../../../utils/utils'
import { GRADE_FEATURE, GRADE_RIGHTS } from '../../../config/config'
import { STATIC_IMG_URL } from '../../../config/baseUrl'
import './gradeUpgrade.scss'
import dredgeUnionCard from '../../dredgeUnionCard/dredgeUnionCard'
import IconFont from '../../../components/IconFont/IconFont'

@connect(({ distributor: { allLevels } }) => ({ allLevels }))
export default class GradeUpgrade extends PureComponent {
  config = {
    navigationBarTextStyle: 'black',
    navigationBarTitleText: '等级升级',
    navigationBarBackgroundColor: '#ffffff'
  }

  constructor() {
    super()
    this.state = {
      allLevels: [], // 所有等级
      locationState: {}, // 路由中的参数
      nextLevels: [], // 当前等级后的所有等级
      currentNextLevel: {}, // 当前选中的下一个等级
      selectDish: {}, // 当前选中的套餐对象
      loading: false,
      limitPrice: 0
    }
  }

  componentWillMount() {

  }

  componentDidShow() {
    const { dispatch } = this.props
    dispatch({
      type: 'mine/getDistributorByPlatformAction',
      callback: ({ ok, data }) => {
        if (ok && objNotNull(data)) {
          setUserDistributor(data)
          const { allLevels } = this.props
          // const allLevels = CommonUtil.readPartnerRank() || [];
          const userBaseInfo = data
          // const {userBaseInfo} = this.props.location.state;
          const rankInfo = userBaseInfo && userBaseInfo.partnerLevelModel || {}
          let stateObj = {
            locationState: userBaseInfo || {}
          }
          if (allLevels.length > 0) {
            stateObj = {
              ...stateObj,
              allLevels
            }
            // 组装下一个等级的所有等级
            if (objNotNull(rankInfo) && rankInfo.level) {
              const nextLevels = allLevels.filter(o => o.level > rankInfo.level)
              stateObj = {
                ...stateObj,
                nextLevels: nextLevels.length > 0 ? nextLevels : [],
                currentNextLevel: nextLevels.length > 0 ? nextLevels[0] : {}
              }
              // 默认选中套餐
              const { thresholdCondition } = stateObj.currentNextLevel
              let buyPackage = null
              let tcdCard = null
              if (thresholdCondition && ((thresholdCondition & 2) === 2)) { // 购买套餐
                buyPackage = true
              }
              if (thresholdCondition && ((thresholdCondition & 4) === 4)) { // 会员卡购买
                tcdCard = true
              }
              if (buyPackage && objNotNull(stateObj.currentNextLevel) && stateObj.currentNextLevel.packageInfoList && stateObj.currentNextLevel.packageInfoList.length > 0) {
                stateObj = {
                  ...stateObj,
                  selectDish: stateObj.currentNextLevel.packageInfoList[0]
                }
              }
              if (tcdCard && !buyPackage){
                this.setState({ selectDish: { dishId: 'tcd' } })
              }
            }
          }
          this.setState({ ...stateObj })
          this.getTcdCard()
        }
      }
    })
  }

  getTcdCard = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'legendsCard/getLegendsCardMoneyAction',
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            limitPrice: data
          })
        }
      }
    })
  }

  renderCondition = item => {
    const packageInfoList = item.packageInfoList || []
    const userBaseInfo = this.state.locationState
    const rankInfo = userBaseInfo && userBaseInfo.partnerLevelModel || {}
    const { limitPrice, selectDish = {} } = this.state
    if (!objNotNull(item)) {
      return (<View className="nodata">升级条件未知</View>)
    }
    if (item.joinCondition === 'NO_THRESHOLD') {
      return (<View className="nodata">无门槛升级</View>)
    }
    if (item.joinCondition === 'HAVE_THRESHOLD') {
      let saleroom = false
      let saleroomInfo = {}
      let number = false
      let numberInfo = {}
      let buyPackage = false
      let tcdCard = false
      if (item.thresholdCondition && ((item.thresholdCondition & 1) === 1)) { // 目标达标
        if (item.goalCondition) {
          if ((item.goalCondition & 1) === 1) { // 销售额目标
            saleroom = true
            saleroomInfo = {
              nowNum: objNotNull(userBaseInfo) && userBaseInfo.salesAccumulative ? userBaseInfo.salesAccumulative : 0,
              totalNum: item.saleGoal,
              condition: 1,
              progressing: ((Number(objNotNull(userBaseInfo) && userBaseInfo.salesAccumulative ? userBaseInfo.salesAccumulative : 0) / Number(item.saleGoal)) * 100).toFixed(2)
            }
          }
          if ((item.goalCondition & 2) === 2) { // 邀请合伙人数
            number = true
            numberInfo = {
              nowNum: objNotNull(userBaseInfo) && userBaseInfo.distributorNumAccumulative ? userBaseInfo.distributorNumAccumulative : 0,
              totalNum: item.partnerNum,
              condition: 2,
              progressing: ((Number(objNotNull(userBaseInfo) && userBaseInfo.distributorNumAccumulative ? userBaseInfo.distributorNumAccumulative : 0) / Number(item.partnerNum)) * 100).toFixed(2)
            }
          }
        }
      }
      if (item.thresholdCondition && ((item.thresholdCondition & 2) === 2)) { // 购买套餐
        buyPackage = true
      }
      if (item.thresholdCondition && ((item.thresholdCondition & 4) === 4)) { // 会员卡购买
        tcdCard = true
      }
      return (
        <Block>
          {
            saleroom && (
              <View className="flex-row flex-sb flex-ac condition-item">
                <View className="condition-title-wrap">
                  <Text className="condition-title">销售金额达：</Text>
                  <Text className="condition-unit">¥</Text>
                  <Text className="condition-num">{item.saleGoal}</Text>
                </View>
                <View className="condition-progress">
                  <View className="condition-progressing" style={{ width: `${saleroomInfo.progressing}%` }}>
                    <View className="condition-tip" style={{ left: `${saleroomInfo.progressing}%` }}>
                      {saleroomInfo.condition === 1 ? ` ¥${saleroomInfo.nowNum}` : `${saleroomInfo.nowNum}人`}
                    </View>
                    <Text className="line-progressing" />
                  </View>
                </View>
                <View className="condition-value">
                  {objNotNull(saleroomInfo) && saleroomInfo.nowNum ? saleroomInfo.nowNum : 0}
                  /
                  {item.saleGoal}
                </View>
              </View>
            )
          }
          {
            number && (
              <View className="flex-row flex-sb flex-ac condition-item">
                <View className="condition-title-wrap">
                  <Text className="condition-title">邀请合伙人：</Text>
                  <Text className="condition-num">{item.partnerNum}</Text>
                  <Text className="condition-unit">人</Text>
                </View>
                <View className="condition-progress">
                  <View className="condition-progressing" style={{ width: `${numberInfo.progressing}%` }}>
                    <View className="condition-tip" style={{ left: `${numberInfo.progressing}%` }}>
                      {numberInfo.condition === 1 ? ` ¥${numberInfo.nowNum}` : `${numberInfo.nowNum}人`}
                    </View>
                    <Text className="line-progressing" />
                  </View>
                </View>
                <View className="condition-value">
                  {objNotNull(numberInfo) && numberInfo.nowNum ? numberInfo.nowNum : 0}
                  /
                  {item.partnerNum}
                </View>
              </View>
            )
          }
          {
            buyPackage && (
              <Block>
                <View className="buy-upgrade-btn" />
                <View className="buy-upgrade-title">点击购买以下任何一个套餐立刻升级</View>
                {
                  packageInfoList && packageInfoList.length > 0 && packageInfoList.map((o, i) => (
                    <View
                      className={`flex-row flex-ac goods-item ${objNotNull(this.state.selectDish) && this.state.selectDish.dishId === o.dishId && 'goods-active'}`}
                      key={i}
                      onClick={() => {
                        this.setState({ selectDish: o })
                      }}
                    >
                      <Image
                        src={o.dishImageUrl ? getServerPic(o.dishImageUrl.split(',')[0]) : require('../assets/teaset1.jpg')}
                        className="goods-img"
                      />
                      <View className="flex-col flex-sb goods-right">
                        <View className="goods-desc">{o.dishName || '--'}</View>
                        <View className="goods-price">
                          <Text className="goods-rmb">¥</Text>
                          <Text
                            className="goods-money"
                          >
                            {formatCurrency(o.dishPrice)}
                          </Text>
                        </View>
                      </View>
                      {
                        objNotNull(this.state.selectDish) && this.state.selectDish.dishId === o.dishId
                        && (
                          <View
                            className="buy-checked-btn"
                            onClick={e => {
                              e.stopPropagation()
                              this.setState({
                                selectDish: {}
                              })
                            }}
                          />
                        )
                      }
                    </View>
                  ))
                }
              </Block>
            )
          }
          {
            tcdCard && (
              <View
                className={`flex-row flex-ac goods-item ${selectDish.dishId === 'tcd' && 'goods-active'}`}
                onClick={() => {
                  this.setState({ selectDish: { dishId: 'tcd' } })
                }}
              >
                <Image
                  src={`${STATIC_IMG_URL}/distributor_level/tc_card.png`}
                  className="goods-img"
                />
                <View className="flex-col flex-sb goods-right">
                  <View className="goods-desc">开通会员卡</View>
                  <View className="goods-price">
                    <Text className="goods-rmb">¥</Text>
                    <Text
                      className="goods-money"
                    >
                      {limitPrice}
                    </Text>
                  </View>
                </View>
                {
                  selectDish.dishId === 'tcd' && (
                    <View
                      className="buy-checked-btn"
                      onClick={e => {
                        e.stopPropagation()
                        this.setState({
                          selectDish: {}
                        })
                      }}
                    />
                  )
                }
              </View>
            )
          }
        </Block>
      )
    }
    return <View />
  }

  loadDishDetail = (dishId, platFormId) => {
    const { dispatch } = this.props
    dispatch({
      type: 'goodsDetail/getDishDetailAction',
      payload: {
        platformId: platFormId,
        dishId
      },
      callback: ({ ok, data = {} }) => {
        if (ok) {
          this.loadMerchantInfo(data)
        } else {
          hideLoading()
          Taro.showModal({
            content: '该商品已下架！',
            confirmText: '查看更多',
            confirmColor: '#FF643D',
            showCancel: false,
            success: () => {
              Taro.switchTab({ url: '/pages/index/index' })
            }
          })
        }
      }
    })
  }

  loadMerchantInfo = ({ shopDish: dishDetail }) => {
    this.props.dispatch({
      type: 'goodsDetail/getMerchantInfoAction',
      payload: { merchantId: dishDetail.merchantId },
      callback: ({ ok, data }) => {
        hideLoading()
        if (ok) {
          const { selectDish, currentNextLevel } = this.state
          console.log(dishDetail)
          const dishSku = dishDetail.shopDishSkus.filter(ele => ele.id === selectDish.skuId)

          dishDetail = { shopDish: { ...dishDetail, shopDishSkus: dishSku } }
          Taro.navigateTo({ url: `/package/multiStore/packageOrderConfirm/packageOrderConfirm?partnerLevelId=${currentNextLevel.id}&merchantInfo=${encodeURIObj(data)}&goodsDetail=${encodeURIObj(dishDetail)}&formPage=partnerOrder` })
        }
      }
    })
  }

  buyNow = async () => {
    const {
      currentNextLevel, selectDish, locationState
    } = this.state
    if (selectDish.dishId === 'tcd') {
      navToPage('/pages/dredgeUnionCard/dredgeUnionCard')
      return
    }
    const userBaseInfo = locationState
    const rankInfo = userBaseInfo && userBaseInfo.partnerLevelModel || {}
    this.loadDishDetail(selectDish.dishId, rankInfo.platformId)
    showLoading()
    // let dishDetail = await this.loadDishDetail(selectDish.dishId, rankInfo.platformId);
    // let merchantInfo = await this.loadMerchantInfo(dishDetail.merchantId);
    //
    // let dishSku = dishDetail.shopDishSkus.filter(ele => ele.id === selectDish.skuId);
    //
    // dishDetail = {shopDish: {...dishDetail, shopDishSkus:dishSku}};
    // Taro.navigateTo({url: `/pages/packageOrderConfirm/packageOrderConfirm?partnerLevelId=${currentNextLevel.id}&merchantInfo=${encodeURIObj(merchantInfo)}&goodsDetail=${encodeURIObj(dishDetail)}&formPage=partnerOrder`});
  }

  render() {
    const {
      allLevels,
      locationState = {},
      currentNextLevel,
      nextLevels,
      loading,
      limitPrice
    } = this.state
    const rankInfo = locationState && locationState.partnerLevelModel || {}
    let levelFunctions = []
    if (objNotNull(rankInfo)) {
      if (rankInfo.levelFunction) {
        levelFunctions = GRADE_FEATURE.filter(o => (rankInfo.levelFunction & o.value) === o.value)
      }
    }

    // 计算可用的功能
    let canUseFunctions = []
    if (objNotNull(currentNextLevel) && currentNextLevel.levelFunction) {
      canUseFunctions = GRADE_FEATURE.filter(o => (currentNextLevel.levelFunction & o.value) === o.value)
    }

    // 计算等级权益
    let hierarchys = []
    if (objNotNull(currentNextLevel) && currentNextLevel.hierarchy) {
      hierarchys = GRADE_RIGHTS.filter(o => (currentNextLevel.hierarchy & o.value) === o.value)
    }

    // console.log(this.state.selectDish)
    return (
      <Block>
        <View className="level-grade-header">
          <View className="flex-col level-name-wrap">
            <Image
              src={rankInfo && rankInfo.imageUrl ? getServerPic(rankInfo.imageUrl) : `${STATIC_IMG_URL}/distributor_level/level_def.png`}
              className="upgrade-level-icon"
            />
            <Text className="level-current-name">{rankInfo.levelName || '--'}</Text>
          </View>
          <View className="flex-row new-level-progress flex-row flex-ac flex-jc">
            {
              allLevels.length > 0 && allLevels.map((o, i) => (
                <View key={i} className={`item flex-row flex-ac ${rankInfo.level >= o.level && 'level-item-active'}`}>
                  <View className="circle" />
                  <Text className="name">{o.levelName}</Text>
                </View>
              ))
            }
          </View>
        </View>

        <View className="flex-row flex-sa upgrade-level-wrap">
          {
            nextLevels.length > 0 && nextLevels.map((o, i) => (
              <View
                key={i}
                className={`flex-col flex-ac flex-jc level-upgrade-item ${o.id === currentNextLevel.id && 'current-level'}`}
                onClick={() => {
                  let stateObj = {
                    currentNextLevel: o,
                    selectDish: {}
                  }
                  let buyPackage = null
                  let tcdCard = null
                  if (o.thresholdCondition && ((o.thresholdCondition & 2) === 2)) { // 购买套餐
                    buyPackage = true
                  }
                  if (o.thresholdCondition && ((o.thresholdCondition & 4) === 4)) { // 会员卡购买
                    tcdCard = true
                  }
                  // 默认选中套餐
                  if (buyPackage && o.packageInfoList && o.packageInfoList.length > 0) {
                    stateObj = {
                      ...stateObj,
                      selectDish: o.packageInfoList[0]
                    }
                  }
                  this.setState({ ...stateObj })
                  if (tcdCard && !buyPackage) {
                    this.setState({ selectDish: { dishId: 'tcd' } })
                  }
                }}
              >
                <View className="level-icon-wrap">
                  <Image
                    src={o.imageUrl ? getServerPic(o.imageUrl) : `${STATIC_IMG_URL}/level_def.png`}
                    className="upgrade-level-img"
                  />
                </View>
                <Text className="upgrade-level-name ellipsis">{o.levelName || ''}</Text>
              </View>
            ))
          }
        </View>

        <View className="upgrade-condition-wrap">
          <View className="flex-row upgrade-title-wrap flex-ac">
            <View className="line" />
            <View className="upgrade-condition-title">升级条件</View>
            <View className="upgrade-condition-subtitle">达到以下其中一个条件即可升级</View>
          </View>
          {this.renderCondition(currentNextLevel)}
          <View className="upgrade-function-title flex-row flex-ac">
            <View className="line" />
            <Text>可用功能</Text>
          </View>
          <View className="upgrade-function-wrap">
            <View className="flex-row flex-sb upgrade-function-item-wrap">
              {
                canUseFunctions.length > 0
                  ? canUseFunctions.map((o, i) => (
                    <View
                      className={`upgrade-function-item icon${o.value}`}
                      key={i}
                    >
                      {o.label}
                    </View>
                  ))
                  : <View>暂无可用功能</View>
              }
            </View>
          </View>

          <View className="upgrade-function-title flex-row flex-ac">
            <View className="line" />
            <Text>等级权益</Text>
          </View>
          <View className="level-rights-wrap">
            {
              hierarchys.length > 0
                ? hierarchys.map((o, i) => (
                  <View
                    className="flex-row flex-sb upgrade-rights-item"
                    key={i}
                  >
                    <View className="flex-col rights-right">
                      <View
                        className="upgrade-rights-title flex-row flex-ac"
                      >
                        <IconFont value="imgMember" h={20} w={24} mr={10} />
                        <Text>{o.value === 8 ? strReplaceParams(o.label, currentNextLevel.extraRatio) : o.label}</Text>
                      </View>
                      <View
                        className="upgrade-rights-content"
                      >
                        {o.value === 8 ? strReplaceParams(o.desc, currentNextLevel.extraRatio) : o.desc}
                      </View>
                    </View>
                  </View>
                ))
                : <View className="nodata">暂无可用的等级权益</View>
            }
          </View>
        </View>

        {
          objNotNull(this.state.selectDish) && (currentNextLevel.thresholdCondition && ((currentNextLevel.thresholdCondition & 2) === 2)
            || currentNextLevel.thresholdCondition && ((currentNextLevel.thresholdCondition & 4) === 4)
          )
          && (
            <Block>
              {
                loading ? (
                    <View className="flex-row flex-jc flex-ac go-weapp-buy">
                      <Text className="weapp-text">微信支付</Text>
                      <Text
                        className="weapp-pay-money"
                      >
                        ¥
                        {formatCurrency(this.state.selectDish.dishPrice)}
                      </Text>
                    </View>
                  )
                  : (
                    <View
                      className="flex-row flex-jc flex-ac go-weapp-buy"
                      onClick={this.buyNow.bind(this)}
                    >
                      <View className="weapp-text">微信支付</View>
                      <View
                        className="weapp-pay-money"
                      >
                        ¥
                        {
                          this.state.selectDish.dishId === 'tcd' ? limitPrice : formatCurrency(this.state.selectDish.dishPrice)
                        }
                      </View>
                    </View>
                  )
              }
            </Block>
          )
        }
      </Block>
    )
  }
}
