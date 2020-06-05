/* eslint-disable no-unused-vars */
import Taro, { Component, navigateTo } from '@tarojs/taro'
import {
  Block, Image, ScrollView, Text, View, Button
} from '@tarojs/components'
import {
  CAR_TYPE_SHOP,
  CATEGORY_ANCHOR_PREFIX,
  CATEGORY_TABS_HEIGHT,
  CONTEXT_ANCHOR_PREFIX,
  DISH_HOT,
  DISH_OFFER,
  LOCATION_TYPE_HEIGHT,
  MENU_FOOTER_HEIGHT,
  FLL_CUT,
  SHOP_MODE_ENUM
} from '../../config/config'
import './Menu.scss'
import '../../styles/base.scss'
import {
  getServerPic,
  navToPage,
  needLogin,
  objNotNull,
  readTempBuyCar,
  saveBuyCar,
  saveTempBuyCar,
  showToast,
  toDecimal,
  getUserDetail,
  judgeLegendsCard
} from '../../utils/utils'
import { STATIC_IMG_URL } from '../../config/baseUrl'

// const virtualMerchantActivity = [];
export default class Menu extends Component {
  constructor(props) {
    super(props)
    this.state = {
      windowScrollHeight: '', // 左右滚动区域高度
      goods: [],
      rightToView: '', // 右侧锚点
      leftToView: '', // 左侧锚点
      highlightCategoryId: '', // 左侧分类高亮
      currentCar: null,
      skuDish: {}, // 需要选择规格的商品
      currentSku: {}, // 当前选中的规格
      currentAttr: {}, // 当前选中的属性
      showCarDetail: false, // 是否显示购物车详情
      showSkuModal: false, // 显示选择规格弹层
      detailModal: false, // 显示商品详情
      dishInfo: {},
      linkageLocking: false
    }
    this.categoryScrollHeight = []// 各个分类标题离顶部高度
    this.windowHeight = ''
  }

  componentDidMount() {
    // 根据当前设备计算左右滚动区域高度
    const {
      goodsData = [], pageUpperContentHeight, currentMerchant = {}, shopCar, virtualMerchantActivity = []
    } = this.props
    Taro.getSystemInfo({
      success: res => {
        if (res.errMsg === 'getSystemInfo:ok') {
          this.windowHeight = res.windowHeight
          const percent = res.windowWidth / 750 // 当前设备1rpx对应的px值
          const MenuHeader = 0
          const MenuFotter = (MENU_FOOTER_HEIGHT * percent).toFixed(2) - 0
          const categoryTabs = (CATEGORY_TABS_HEIGHT * percent).toFixed(2) - 0
          const addrAndType = (LOCATION_TYPE_HEIGHT * percent).toFixed(2) - 0
          const fullCut = virtualMerchantActivity.length === 0 ? 0 : (FLL_CUT * percent).toFixed(2) - 0;
          console.log("74goodsData=>>>>>>>>>>>",goodsData)
          goodsData.map(o => {
            const query = Taro.createSelectorQuery()
              .in(this.$scope)
            query.select(`#${CONTEXT_ANCHOR_PREFIX + o.id}`)
              .boundingClientRect(res => {
                this.categoryScrollHeight.push(parseInt(res.top - MenuHeader - categoryTabs - pageUpperContentHeight - fullCut))
              })
              .exec()
          })
          this.setState({
            windowScrollHeight: parseInt(res.windowHeight - MenuHeader - MenuFotter - addrAndType - categoryTabs - fullCut),
            highlightCategoryId: goodsData[0] && goodsData[0].id
          })
        }
      }
    })
    this.setState({ currentCar: readTempBuyCar(CAR_TYPE_SHOP, currentMerchant.id) })
  }

  componentWillReceiveProps(nextProps) {
    const { currentMerchant } = this.props
    this.setState({ currentCar: readTempBuyCar(CAR_TYPE_SHOP, currentMerchant.id) })
  }

  // 右侧滚动函数
  onRightScroll = e => {
    const curScrollTop = e.currentTarget.scrollTop.toFixed(2) - 0
    const { highlightCategoryId, linkageLocking } = this.state
    if (linkageLocking) return
    const { goodsData } = this.props
    const findIndex = (val, arr) => (arr.findIndex(el => el > val) - 1)
    let index = findIndex(parseInt(curScrollTop), this.categoryScrollHeight)
    index = index != -2 ? index : this.categoryScrollHeight.length - 1;
    if(index>-1){
      if (highlightCategoryId === goodsData[index].id) return
      this.setState({
        highlightCategoryId: goodsData[index].id,
        leftToView: CATEGORY_ANCHOR_PREFIX + goodsData[index].id
      })
    }else{
      return 
    }

  }

  // 解锁-右侧滚动
  moveRightScroll = () => {
    this.setState({
      linkageLocking: false
    })
  }

  // 右侧滚动到底部
  onRightToLower = () => {
    const { goodsData } = this.props
    this.setState({
      highlightCategoryId: goodsData[goodsData.length - 1].id
    })
  }

  // 右侧滚动到顶部
  onRightToUpper = () => {
    const { goodsData } = this.props
    this.setState({
      highlightCategoryId: goodsData[0].id
    })
  }

  // 左侧点击分类函数
  categoryChange = e => {
    if (!this.props.currentSwiper) {
      this.props.onSwiperToUnder()
      return
    }
    const { id } = e.currentTarget.dataset
    this.setState({
      leftToView: CATEGORY_ANCHOR_PREFIX + id,
      rightToView: CONTEXT_ANCHOR_PREFIX + id,
      highlightCategoryId: id,
      linkageLocking: true
    })
  }

  // 添加购物车
  _addCar = item => {

    console.log(item, 222)

    // 获取用户会员信息
    const { islandUserMemberDTO } = getUserDetail()
    // 如果是会员  judge ==> true 如果不是会员   judge ==>false
    const judge = judgeLegendsCard(islandUserMemberDTO)
    item.sku = item.sku && item.sku.id ? item.sku : item.shopDishSkus[0]


    // 判断是否仅会员购买商品
    if ((item.sku.limitMemberPrice && judge) || (!item.sku.limitMemberPrice && (judge || !judge))) {
      const { currentCar } = this.state
      const key = `${item.id}_${item.skuId ? item.skuId : 0}_${item.attrId ? item.attrId : 0}`
      const num = 'num'
      // item.sku = item.sku && item.sku.id ? item.sku : item.shopDishSkus;
      // 检测秒杀限购
      console.log(item.sku && currentCar[key] && item.sku.orderRestriction > 0 && currentCar[key].num + 1 > item.sku.orderRestriction, 3333)
      if (item.sku && currentCar[key] && item.sku.orderRestriction > 0 && currentCar[key].num + 1 > item.sku.orderRestriction) {
        showToast('超过秒杀限购次数')
        return
      }
      if (currentCar[key]) {
        currentCar[key][num] = currentCar[key][num] + 1
      } else {
        currentCar[key] = item
        currentCar[key][num] = item.minOrderCount && item.minOrderCount > 0 ? item.minOrderCount : 1
      }

      // 判断时候开启限购
      console.log(currentCar);
      var temp = {};
      Object.entries(currentCar).map(([key, item]) => {
        if (temp[item.id]) {
          temp[item.id] += item.num
          if (temp[item.id] > item.limitBuyNum && item.numLimitType == "1") {
            showToast("超出限购数量")
            delete (currentCar[key])
          }
        } else {
          temp[item.id] = item.num
        }
      })
      console.log(temp)
      // console.log(temp)
      // let newarr = temp.reduce((total, cur, next) => {
      //   if (temp[cur].id == temp[next].id) {
      //     return total = temp[cur].num + temp[next].num
      //   }
      // }, [])
      // console.log(newarr)


      if (currentCar[key][num] > item.limitBuyNum && item.numLimitType == "1") {
        showToast('超过限购数量')
        currentCar[key][num] -= 1;
        return
      }

      saveTempBuyCar(CAR_TYPE_SHOP, this.props.currentMerchant.id, currentCar)
      this.setState({
        currentCar: { ...currentCar }
      })
    } else if (item.sku.limitMemberPrice && !judge) {
      Taro.showModal({
        content: '您还不是会员，请先开通会员再购买',
        cancelText: '取消',
        confirmText: '去开通'
      }).then(res => {
        if (res.confirm) {
          Taro.navigateTo({
            url: '/pages/dredgeUnionCard/dredgeUnionCard'
          })
        }
      })
    }
  }

  _onSubDishCar = (item, e) => {
    e.stopPropagation()
    if (!this.props.currentSwiper) {
      this.props.onSwiperToUnder()
      return
    }
    const { currentCar } = this.state
    const key = `${item.id}_${item.skuId ? item.skuId : 0}_${item.attrId ? item.attrId : 0}`
    const num = 'num'
    currentCar[key][num] = currentCar[key][num] - 1
    if (currentCar[key][num] < 1 || currentCar[key][num] < item.minOrderCount) {
      delete currentCar[key]
    }
    saveTempBuyCar(CAR_TYPE_SHOP, this.props.currentMerchant.id, currentCar)
    this.setState({
      currentCar: { ...currentCar }
    })
    if (!objNotNull(currentCar)) {
      this.setState({ showCarDetail: false })
    }
  }

  // 添加商品到购物车
  onAddDishCar = (item, e) => {
    e.stopPropagation()
    if (!this.props.currentSwiper) {
      this.props.onSwiperToUnder()
      return
    }
    // console.log(item);
    // ADD_CAR_ANIMATION && this.startAnimation(e);
    // this._addCar(item)
    this._addCar(item)
  }

  // 显示购物车详情
  showCarDetail = () => {
    if (!objNotNull(this.state.currentCar) && !this.state.showCarDetail) {
      showToast('请先添加商品')
      return
    }
    this.setState({ showCarDetail: !this.state.showCarDetail })
  }

  /** **********选择规格********* */
  // 控制选中规格弹层关闭打开
  showSkuModalCtrl = (item, e) => {
    console.log(item, 444)
    const { showSkuModal } = this.state
    if (!this.props.currentSwiper) {
      this.props.onSwiperToUnder()
      return
    }
    let stateObj = {
      showSkuModal: !showSkuModal,
      skuDish: {},
      currentSku: {},
      currentAttr: {}
    }
    if (objNotNull(item)) {
      const temAtrr = {}
      if (item.shopDishAttributes && item.shopDishAttributes.length > 0) { // 商品属性显示数据结构拼装
        const temArr = item.shopDishAttributes.filter(o => o.details.length > 0)
          .map(o => ({
            ...o,
            details: o.details.split(','),
          }))
        if (temArr && temArr.length > 0) { // 默认选中第一个属性中第一项
          temArr.map((item, index) => {
            temAtrr[item.id] = item.details[0]
          })
        }
      }
      stateObj = {
        ...stateObj,
        skuDish: item,
        currentSku: (item.shopDishSkus && item.shopDishSkus.length > 1 && item.shopDishSkus[0]) || {}, // 默认选中第一个规格
        currentAttr: temAtrr // 默认选中第一个属性中的第一项
      }
    }
    this.setState(stateObj)
    this.props.onOpenMask()
  }

  // 选择规格
  onClickSku = item => {
    // 限购条件
    const { currentSku } = this.state
    let stateObj = { currentSku: {} }// 如果已经是选中状态,则取消选中
    // if (currentSku.id !== item.id) { //没有选中
    stateObj = { currentSku: item }
    // }
    this.setState({ ...stateObj })
  }

  // 属性选择
  onClickAtrr = (attr, item) => {
    const { currentAttr } = this.state
    // if (currentAttr[`${attr.id}`] && currentAttr[`${attr.id}`] === item) { //如果已经是选中状态,则取消选中
    //   delete currentAttr[`${attr.id}`];
    // } else { //没有选中
    currentAttr[`${attr.id}`] = item
    // }
    this.setState({ ...currentAttr })
  }

  // 添加有规格的商品入购物车
  addSkuCar = () => {
    const {
      skuDish, // 选择规格的商品
      currentSku, // 当前选中的规格
      currentAttr// 当前选中的属性
    } = this.state
    // 构建规格属性商品在购物车的结构....
    const item = {
      ...skuDish,
      skuId: currentSku.id,
      attrId: Object.values(currentAttr)
        .join('_'),
      sku: currentSku,
      attr: currentAttr,
      limitMemberPrice: currentSku.limitMemberPrice
    }
    const tempNames = []
    if (item.sku.spec) {
      tempNames.push(item.sku.spec)
    }
    if (item.attr && Object.keys(item.attr).length > 0) {
      tempNames.push(Object.values(item.attr)
        .join(','))
    }
    item.dishName += `(${tempNames.join(', ')})`
    this._addCar(item)
    this.setState({ showSkuModal: !this.state.showSkuModal })
  }

  // 清空购物车
  _clearCar = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要清空购物车吗'
    })
      .then(res => {
        if (res.confirm) {
          saveTempBuyCar(CAR_TYPE_SHOP, this.props.currentMerchant.id, {})
          this.setState({
            currentCar: {},
            showCarDetail: !this.state.showCarDetail
          }, () => {
            showToast('购物车已清空')
          })
        }
        // console.log(res.confirm, res.cancel);
      })
  }

  // 阻止购物车详情面板冒泡事件
  stopPropagation = e => {
    e.stopPropagation()
  }

  onOrderNow = () => {
    if (!needLogin()) {
      return
    }
    this.setState({ showCarDetail: false })
    const { currentMerchant } = this.props
    const { currentCar } = this.state
    saveBuyCar({
      dishes: currentCar,
    }).then(() => {
      navToPage(`/package/multiStore/allOrderConfirm/allOrderConfirm?merchantId=${currentMerchant.id}&formPage=NETWORK`)
    })
  }

  // 计算销量
  formatSaleCount = item => {
    const saleArr = item && item.map(sku => {
      let { saleNum, initNum } = sku
      saleNum = saleNum || 0
      initNum = initNum || 0
      return saleNum + initNum
    })
    return saleArr && saleArr.length > 0 ? saleArr.reduce((a, b) => a + b) : 0
  }

  // 显示商品详情
  showDetail = value => {
    this.props.onSwiperToUnder()
    this.setState({
      detailModal: true,
      dishInfo: value
    })
  }

  // 关闭商品详情
  closeDetail = () => {
    this.setState({
      detailModal: false
    })
  }

  render() {
    const {
      showSkuModal,
      windowScrollHeight,
      rightToView,
      leftToView,
      highlightCategoryId,
      currentCar,
      skuDish,
      currentSku,
      currentAttr,
      showCarDetail,
      detailModal,
      dishInfo
    } = this.state
    const {
      goodsData, isScroll, currentMerchant = {}, showPromptVisible, virtualMerchantActivity, shippingInfo
    } = this.props
    // console.log(currentMerchant)
    let carList = currentCar && Object.values(currentCar) || []
    let totalNums = 0 // 点餐份数
    let toTalPrice = 0 // 总价格
    let totalPackFee = 0 // 餐盒费

    // 判断是否只能是会员购买字段 limitMemberPrice
    // console.log(carList);
    carList = carList.filter(o => o.id)
    // 获取用户会员信息
    const { islandUserMemberDTO } = getUserDetail()
    // 如果是会员  judge ==> true 如果不是会员   judge ==>false
    const judge = judgeLegendsCard(islandUserMemberDTO)
    if (carList.length > 0) {

      totalNums = carList.map(o => o.num)
        .reduce((o1, o2) => (o1 + o2)) // 总份数计算

      toTalPrice = carList.map(o => {
        return (
          toTalPrice = carList.map(o => (o.sku && judge && o.sku.price && o.num && o.sku.memberPrice ? o.num * (o.sku.memberPrice || 0) : o.num * (o.sku.price || 0)))
            .reduce((o1, o2) => (o1 + o2)) // 总价格计算(可能会比较复杂)
        )
      })
      totalPackFee = carList.map(o => (o.sku && !o.sku.freeBoxPrice && o.sku.boxPrice && o.sku.boxNum ? (o.num * o.sku.boxNum * o.sku.boxPrice) : 0))
        .reduce((o1, o2) => (o1 + o2)) // 总餐盒费计算
      toTalPrice = toDecimal(parseFloat(toTalPrice) + parseFloat(totalPackFee))
      totalPackFee = toDecimal(totalPackFee)
    }

    // 费用计算
    // const startShippingFee = currentMerchant && currentMerchant.startPrice || 0;//起送费用

    // 选择规格数据
    const skus = (skuDish.shopDishSkus && skuDish.shopDishSkus.length > 1 && skuDish.shopDishSkus.filter(o => o.stock > 0)) || []
    let attrs = skuDish.shopDishAttributes || []
    if (attrs.length > 0) { // 属性
      attrs = attrs.filter(o => o.details.length > 0)
        .map(o => ({
          ...o,
          details: o.details.split(',')
        }))
    }
    // console.log('skuDish', skuDish)
    // console.log("skus", skus);
    // console.log("attrs", attrs);
    let skuPrices = 0
    if (objNotNull(skuDish) && skuDish.shopDishSkus) {
      skuPrices = skuDish && Math.min(...skuDish.shopDishSkus.map(a => Number(a.price))) // 规格显示的是最小价格
    }
    // 显示规格和属性描述
    let skuAndAtrrText = ''
    const skuAndAtrr = []

    if (objNotNull(currentSku)) { // 规格
      skuAndAtrr.push(currentSku.spec)
    }
    if (objNotNull(currentAttr)) { // 属性
      skuAndAtrr.push(...Object.values(currentAttr))
    }
    skuAndAtrrText = skuAndAtrr.length > 0 ? `（${skuAndAtrr.join('，')}）` : ''

    // 添加sku商品到购物车按钮可用条件
    const addSkuBtnUsable = (objNotNull(skuDish) && (objNotNull(currentAttr) || objNotNull(currentSku)))
    const infoCar = currentCar && currentCar[`${dishInfo.id}_0_0`] || null
    return (
      <Block>
        <View className="menuContent">
          {
            virtualMerchantActivity && virtualMerchantActivity.length > 0
            && (
              <View className="menuHeader flex-row flex-ac">
                <Text className="label">满</Text>
                {
                  virtualMerchantActivity.map(ele => (
                    <Text className="activity" key={i}>
                      满
                      {ele.fullMoney}
                      {' '}
                      减
                      {ele.cutMoney}
                    </Text>
                  ))
                }
              </View>
            )
          }
          <View style={{ display: 'flex' }}>
            <ScrollView
              className="scrollViewLeft"
              scrollY={isScroll}
              style={{
                height: `${windowScrollHeight}px`,
                background: '#F7F7F7'
              }}
              scroll-with-animation
              scrollIntoView={leftToView}
            >
              {
                goodsData && goodsData.length > 0 && goodsData.map(o => (o.saleType === DISH_HOT || o.saleType === DISH_OFFER
                  ? (
                    <View
                      key={o.id}
                      className={`flex-row flex-ac specialCategory ${o.saleType === DISH_HOT ? 'catHot' : null} ${o.saleType === DISH_OFFER ? 'catOffer' : null} ${o.id === highlightCategoryId ? 'specialActive' : 'specialInactive'}`}
                      onClick={this.categoryChange.bind(this)}
                      data-id={o.id}
                      id={CATEGORY_ANCHOR_PREFIX + o.id}
                    >
                      <span>{o.name}</span>
                    </View>
                  )
                  : (
                    <View
                      key={o.id}
                      className={`category ${o.id === highlightCategoryId ? 'active' : 'inactive'}`}
                      onClick={this.categoryChange.bind(this)}
                      data-id={o.id}
                      id={CATEGORY_ANCHOR_PREFIX + o.id}
                    >
                      {o.name}
                    </View>
                  )))
              }
            </ScrollView>

            <ScrollView
              className="scrollViewRight"
              scrollY={isScroll}
              style={{ height: `${windowScrollHeight}px` }}
              scrollIntoView={rightToView}
              onScroll={this.onRightScroll}
              // onScrollToLower={this.onRightToLower}
              // onScrollToUpper={this.onRightToUpper}
              scroll-with-animation
              onTouchStart={this.moveRightScroll}
            >
              {
                goodsData && goodsData.length > 0 && goodsData.map(o =>
                  // const temAttrs = o.shopDishAttributes;
                  // const validAttrs = temAttrs.length > 0 && temAttrs.filter(a => a.details.length > 1);
                  (
                    <View key={o.id} style={{ position: 'relative' }}>
                      <Text id={CONTEXT_ANCHOR_PREFIX + o.id} />
                      <View className="categoryTitle">{o.name}</View>
                      {
                        o.shopDishProductCats && o.shopDishProductCats.length > 0 && o.shopDishProductCats.map(ele => {
                          const temCar = currentCar && currentCar[`${ele.id}_0_0`] || null
                          // 有效属性
                          const temAttrs = ele.shopDishAttributes
                          const validAttrs = temAttrs.length > 0 && temAttrs.filter(a => a.details.length > 1)
                          // 判断是否可以购买
                          let canBuy = false
                          if (ele.shopDishSkus.length > 0 && (Math.max(...ele.shopDishSkus.map(a => Number(a.stock))) > 0)) {
                            canBuy = true
                          }
                          return (
                            <View
                              className="goods"
                              style={{ display: 'flex' }}
                              key={ele.id}
                              onClick={this.showDetail.bind(this, ele)}
                            >
                              <Image
                                className="goodsImg"
                                src={getServerPic(ele.dishImageUrl.split(',')[0])}
                              />
                              <View className="goodsInfo" style={{ flex: 1 }}>
                                <View className="goodsName">{ele.dishName}</View>
                                <View className="description">{ele.description || '--'}</View>
                                <View
                                  className="salesVolume"
                                >
                                  销量：
                                  {this.formatSaleCount(ele.shopDishSkus)}
                                </View>
                                {
                                  ele.shopDishSkus[0].memberPrice
                                    ?
                                    <View className="memberPrice">
                                      <Text className="memberPriceContext">会员价</Text>
                                      <View>
                                        <Text className="memberPriceIcon">￥</Text>
                                        <Text className="memberPriceText">{ele.shopDishSkus[0].memberPrice}</Text>
                                      </View>
                                    </View>
                                    :
                                    " "
                                }
                                <View
                                  className="goodsPrice"
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <View className="priceInfo">
                                    {
                                      ele.shopDishSkus[0].memberPrice && judge
                                        ?
                                        <Text
                                          className="price"
                                          style={{
                                            textDecoration: 'line-through #f00'
                                          }}
                                        >
                                          {ele.shopDishSkus[0].price}
                                        </Text>
                                        :
                                        ele.shopDishSkus[0].memberPrice
                                          ?
                                          <Text className="price">{ele.shopDishSkus[0].price}</Text>
                                          :
                                          <Text className="oprice">{ele.shopDishSkus[0].price}</Text>
                                    }
                                    <Text className="originalPrice">
                                      {
                                        ele.shopDishSkus && ele.shopDishSkus[0] && ele.shopDishSkus[0].originalPrice && ele.shopDishSkus[0].originalPrice !== 0 ? `￥${ele.shopDishSkus[0].originalPrice.toFixed(2)}` : ''
                                      }
                                    </Text>
                                    {/* { */}
                                    {/*  ele.shopDishSkus[0].originalPrice && <Text className="originalPrice">￥{formatCurrency(ele.shopDishSkus[0].originalPrice)}</Text> */}
                                    {/* } */}
                                    {/* <View className="limit"> */}
                                    {/* /!*<Text className="discount">x折</Text>*!/ */}
                                    {/* { */}
                                    {/* ele.numLimitType === 1 && */}
                                    {/* <Text>{COMMODITY_LIMIT[ele.shopLimitType]}{ele.limitBuyNum}份</Text> */}
                                    {/* } */}
                                    {/* </View> */}
                                  </View>
                                  <View onClick={this.stopPropagation}>
                                    {
                                      !canBuy
                                        ? <View className="sale-out">已售罄</View>
                                        : (ele.shopDishSkus.length > 1 || (validAttrs && validAttrs.length > 0))
                                          ? (
                                            <Button
                                              className="chose-sku"
                                              hoverClass="hover"
                                              onClick={this.showSkuModalCtrl.bind(this, ele)}
                                              disabled={!canBuy}
                                            >
                                              选规格
                                            </Button>
                                          )
                                          : (
                                            <View className="addAndSub">
                                              {
                                                temCar
                                                && (
                                                  <Block>
                                                    <Button
                                                      className="btn cut"
                                                      hoverClass="hover"
                                                      hoverStartTime={10}
                                                      hoverStayTime={100}
                                                      onClick={this._onSubDishCar.bind(this, ele)}
                                                    >
                                                      -
                                                </Button>
                                                    <View
                                                      className="part"
                                                    >
                                                      {temCar.num}
                                                    </View>
                                                  </Block>
                                                )
                                              }
                                              <Button
                                                className="btn add"
                                                hoverClass="hover"
                                                hoverStartTime={10}
                                                hoverStayTime={100}
                                                onClick={this.onAddDishCar.bind(this, ele)}
                                                disabled={!canBuy}
                                              >
                                                +
                                              </Button>
                                            </View>
                                          )
                                    }
                                  </View>
                                </View>
                                <View className="minCount">
                                  {
                                    ele.minOrderCount && ele.minOrderCount > 0 && <View>{`${ele.minOrderCount}件起购`}</View>
                                  }
                                  {
                                    ele.limitBuyNum && ele.limitBuyNum > 0 && ele.shopLimitType === "ORDER_LIMIT"
                                      ?
                                      <View style={{ marginLeft: '5px' }}>{`每单限购${ele.limitBuyNum}件`}</View>
                                      :
                                      ele.limitBuyNum && ele.limitBuyNum > 0 && ele.shopLimitType === "USE_LIMIT"
                                        ?
                                        <View style={{ marginLeft: '5px' }}>{`每人限购${ele.limitBuyNum}件`}</View>
                                        :
                                        ele.limitBuyNum && ele.limitBuyNum > 0 && ele.shopLimitType === "DAY_LIMIT"
                                          ?
                                          <View style={{ marginLeft: '5px' }}>{`每日限购${ele.limitBuyNum}件`}</View>
                                          :
                                          ''
                                  }
                                </View>
                              </View>
                            </View>
                          )
                        })
                      }
                    </View>
                  ))
              }
            </ScrollView>
          </View>
          <View className="cartBar">
            {
              !showPromptVisible && (
                <View className="carContainer">
                  <View
                    className="car-icon"
                    hoverClass="hover"
                    hoverStartTime={10}
                    hoverStayTime={100}
                    onClick={this.showCarDetail.bind(this)}
                  >
                    {totalNums > 0 && <View className="red-dot">{totalNums}</View>}
                  </View>
                  <View className="flex-col flex-jc fee-wap">
                    <View className="price">
                      <Text className="rmb">¥</Text>
                      <Text className="num">{toTalPrice}</Text>
                    </View>
                    <View
                      className="shipping"
                    >
                      {/* '￥0起' */}
                      {shippingInfo.minSendPrice ? `配送费${shippingInfo.minSendPrice}元起` : shippingInfo.shippingPrice ? `配送费${shippingInfo.shippingPrice}元` : '￥0元起'}
                    </View>
                  </View>
                  {
                    (currentMerchant.platFormMerchantDTO && (currentMerchant.platFormMerchantDTO.outerOrderMod & SHOP_MODE_ENUM.SHIPPING.key)) === SHOP_MODE_ENUM.SHIPPING.key ? shippingInfo && shippingInfo.startPrice ? (
                      <Button
                        className={`bill-btn ${shippingInfo && shippingInfo.startPrice && (toTalPrice < shippingInfo.startPrice) ? '' : 'active'} ${(shippingInfo && shippingInfo.startPrice && ((toTalPrice < shippingInfo.startPrice || !objNotNull(this.state.currentCar || {})))) || totalNums === 0 ? 'disabled' : ''}`}
                        disabled={(shippingInfo && shippingInfo.startPrice && (toTalPrice < shippingInfo.startPrice || !objNotNull(this.state.currentCar || {}))) || totalNums === 0}
                        hoverClass="hover"
                        onClick={this.onOrderNow.bind(this)}
                      >
                        {
                          shippingInfo && shippingInfo.startPrice && (toTalPrice < shippingInfo.startPrice) ? `￥${shippingInfo.startPrice}起送` : '立即下单'
                        }
                      </Button>
                    ) : (
                        <Button
                          className={`bill-btn ${shippingInfo && shippingInfo.sendingPrice && (toTalPrice < shippingInfo.sendingPrice) ? '' : 'active'} ${(shippingInfo && shippingInfo.sendingPrice && ((toTalPrice < shippingInfo.sendingPrice || !objNotNull(this.state.currentCar || {})))) || totalNums === 0 ? 'disabled' : ''}`}
                          disabled={(shippingInfo && shippingInfo.sendingPrice && (toTalPrice < shippingInfo.sendingPrice || !objNotNull(this.state.currentCar || {}))) || totalNums === 0}
                          hoverClass="hover"
                          onClick={this.onOrderNow.bind(this)}
                        >
                          {
                            shippingInfo && shippingInfo.sendingPrice && (toTalPrice < shippingInfo.sendingPrice) ? `￥${shippingInfo.sendingPrice}起送` : '立即下单'
                          }
                        </Button>
                      )
                      : (
                        <Button
                          className="bill-btn disabled"
                          disabled
                        >
                          暂未开放
                        </Button>
                      )
                  }
                </View>
              )
            }
          </View>
        </View>

        {
          showCarDetail
          && (
            <View
              className="car-detail"
              onClick={this.showCarDetail.bind(this)}
              style={{ height: `${this.windowHeight}px` }}
            >
              <View
                className="flex-col car-detail-in"
                hoverStopPropagation
                onClick={this.stopPropagation.bind(this)}
              >
                <View className="flex-row flex-ac flex-sb header">
                  <View className="title">已选商品</View>
                  <View
                    className="clear-btn"
                    hoverClass="hover"
                    hoverStartTime={10}
                    hoverStayTime={100}
                    onClick={this._clearCar.bind(this)}
                  >
                    清空商品
                  </View>
                </View>
                {/* <View> */}
                <ScrollView
                  scrollY="true"
                  className="scroll-car"
                >
                  {
                    carList.length && carList.map((o, i) => {
                      return (
                        <View className="flex-row flex-ac flex-sb item" key={i}>
                          <View className="flex1">
                            <View className="ellipsis name">{o.dishName}</View>
                          </View>
                          <View className="price">
                            <Text className="rmb">¥</Text>
                            <Text>{o.sku.memberPrice && judge ? toDecimal(o.sku.memberPrice) : toDecimal(o.sku.price)}</Text>
                          </View>
                          <View className="flex-row flex-ac">
                            {
                              o.num > 0
                              && (
                                <View>
                                  <View
                                    className="btn cut"
                                    hoverClass="hover"
                                    hoverStartTime={10}
                                    hoverStayTime={100}
                                    onClick={this._onSubDishCar.bind(this, o)}
                                  >
                                    -
                                </View>
                                  <View className="part">{o.num}</View>
                                </View>
                              )
                            }
                            <View
                              className="btn add"
                              hoverClass="hover"
                              hoverStartTime={10}
                              hoverStayTime={100}
                              onClick={this._addCar.bind(this, o)}
                            >
                              +
                            </View>
                          </View>
                        </View>
                      )
                    })
                  }
                  {totalPackFee && (
                    <View className="flex-row flex-ac flex-sb item">
                      <View className="flex1">
                        <View className="ellipsis name">餐盒费</View>
                      </View>
                      <View className="price">
                        <Text className="rmb">¥</Text>
                        <Text>{totalPackFee}</Text>
                      </View>
                    </View>
                  )}
                </ScrollView>
                {/* </View> */}
              </View>
            </View>
          )
        }
        {/* 选择规格弹层 */}
        {
          showSkuModal
          && (
            <View
              className="sku-wrap flex-row flex-ac"
              // onClick={this.showSkuModalCtrl.bind(this)}
              style={{
                height: `${this.windowHeight}px`,
                zIndex: 1000
              }}
              onTouchMove={this.stopPropagation}
            >
              <ScrollView
                className="sku-inwrap"
                scroll-y
              >
                <View className="ellipsis header">
                  {skuDish.dishName}
                  <View
                    className="close-sku-panel"
                    onClick={this.showSkuModalCtrl.bind(this)}
                  />
                </View>
                <View className="content-wrap" onClick={this.stopPropagation}>
                  {
                    skus.length > 0
                    && (
                      <Block>
                        <View className="title">
                          规格：
                    </View>
                        <View className="flex-row flex-ac item-list">
                          {
                            skus.map((o, i) => (
                              <Button
                                key={i}
                                className={`item ${objNotNull(currentSku) && currentSku.id === o.id ? 'active' : ''}`}
                                hoverClass="hover"
                                onClick={this.onClickSku.bind(this, o)}
                              >
                                {o.spec}
                              </Button>
                            ))
                          }
                        </View>
                      </Block>
                    )
                  }
                  {
                    attrs.length > 0
                    && (
                      <Block>
                        {
                          attrs.map((o, i) => (
                            <Block key={i}>
                              <View className="title">
                                {o.name}
                            ：
                          </View>
                              <View className="flex-row flex-ac item-list">
                                {
                                  o.details.map((a, j) => {
                                    const select = currentAttr[`${o.id}`] === a || false
                                    return (
                                      <Button
                                        key={`${i}_${j}`}
                                        className={`item ${select ? 'active' : ''}`}
                                        hoverClass="hover"
                                        onClick={this.onClickAtrr.bind(this, o, a, j)}
                                      >
                                        {a}
                                      </Button>
                                    )
                                  })
                                }
                              </View>
                            </Block>
                          ))
                        }
                      </Block>
                    )
                  }
                </View>
                <View className="flex-row flex-sb flex-ac footer">
                  <View className="flex-row flex-ae">
                    <View className="flex-row flex-je price">
                      <Text className="rmb">¥</Text>
                      <View
                        className="money"
                      >
                        {
                          judge && currentSku.memberPrice
                            ?
                            (currentSku.memberPrice || currentSku.memberPrice === 0) || skuPrices
                            :
                            (currentSku.price || currentSku.price === 0) || skuPrices
                        }
                      </View>
                    </View>
                    <Text className="sku">{skuAndAtrrText}</Text>
                  </View>
                  <Button
                    className={`add-car-btn ${addSkuBtnUsable ? '' : 'disabled'}`}
                    hoverClass="hover"
                    disabled={!addSkuBtnUsable}
                    onClick={this.addSkuCar.bind(this)}
                  >
                    加入购物车
                </Button>
                </View>
              </ScrollView>
            </View>
          )
        }
        {/* 商品详情弹窗 */}
        {
          detailModal
          && (
            <View
              className="dishDetailMask"
              style={{ height: `${this.windowHeight}px` }}
              onClick={this.closeDetail}
            >
              <View className="dishDetailBox">
                <Image
                  src={`${STATIC_IMG_URL}/icon/icon_shutDown.png`}
                  className="closeImg"
                  onClick={this.closeDetail}
                />
                <View className="dishImg">
                  <Image src={getServerPic(dishInfo.dishImageUrl.split(',')[0])} />
                </View>
                <View className="dishInfoBox">
                  <View className="dishInfoName ellipsis">{dishInfo.dishName}</View>
                  <View
                    className="dishInfoDes"
                  >
                    {dishInfo.description === null ? '暂无描述' : dishInfo.description}
                  </View>
                  <View className="dishInfoDes">
                    销量
                  {this.formatSaleCount(dishInfo.shopDishSkus)}
                  </View>
                  <View className="dishInfoFooter">
                    <View className="infoFooterLeft">
                      <Text>￥</Text>
                      <Text>{dishInfo.shopDishSkus[0].price}</Text>
                      <Text className="originalPrice">
                        {
                          dishInfo.shopDishSkus && dishInfo.shopDishSkus[0] && dishInfo.shopDishSkus[0].originalPrice && dishInfo.shopDishSkus[0].originalPrice !== 0 ? `￥${dishInfo.shopDishSkus[0].originalPrice.toFixed(2)}` : ''
                        }
                      </Text>
                      {/* { */}
                      {/*  dishInfo.shopDishSkus[0].originalPrice && <Text>￥{formatCurrency(dishInfo.shopDishSkus[0].originalPrice)}</Text> */}
                      {/* } */}
                    </View>
                    <View>
                      {
                        !(dishInfo.shopDishSkus && dishInfo.shopDishSkus.length > 0 && (Math.max(...dishInfo.shopDishSkus.map(a => Number(a.stock))) > 0))
                          ? <View className="sale-out">已售罄</View>
                          : (dishInfo.shopDishSkus && dishInfo.shopDishSkus.length > 1 || ((dishInfo.shopDishSkus && dishInfo.shopDishSkus.length > 0 && (Math.max(...dishInfo.shopDishSkus.map(a => Number(a.stock))) > 0)) && (dishInfo.shopDishSkus.length > 0 && (Math.max(...dishInfo.shopDishSkus.map(a => Number(a.stock))) > 0)).length > 0))
                            ? (
                              <Button
                                className="chose-sku"
                                hoverClass="hover"
                                onClick={this.showSkuModalCtrl.bind(this, dishInfo)}
                                disabled={!(dishInfo.shopDishSkus && dishInfo.shopDishSkus.length > 0 && (Math.max(...dishInfo.shopDishSkus.map(a => Number(a.stock))) > 0))}
                              >
                                选规格
                              </Button>
                            )
                            : (
                              <View className="addAndSub">
                                {
                                  infoCar
                                  && (
                                    <Block>
                                      <Button
                                        className="btn cut"
                                        hoverClass="hover"
                                        hoverStartTime={10}
                                        hoverStayTime={100}
                                        onClick={this._onSubDishCar.bind(this, dishInfo)}
                                      >
                                        -
                                </Button>
                                      <View className="part">{infoCar.num}</View>
                                    </Block>
                                  )
                                }
                                <Button
                                  className="btn add"
                                  hoverClass="hover"
                                  hoverStartTime={10}
                                  hoverStayTime={100}
                                  onClick={this.onAddDishCar.bind(this, dishInfo)}
                                  disabled={!(dishInfo.shopDishSkus && dishInfo.shopDishSkus.length > 0 && (Math.max(...dishInfo.shopDishSkus.map(a => Number(a.stock))) > 0))}
                                >
                                  +
                              </Button>
                              </View>
                            )
                      }
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )
        }
      </Block >
    )
  }
}
