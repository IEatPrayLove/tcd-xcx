import Taro from '@tarojs/taro'
import { DEFAULT_PLAT_FORM_ID, PLATFORM_ID, PRVIMG_URL } from '../config/baseUrl'
import {
  CACHE_PREV,
  MAX_EXPECTED_SEND_DAY, NAV_LINK,
  PARTNER_RIGHTS_EIGHT,
  PARTNER_RIGHTS_FOUR,
  SHOP_ACTIVITY_TYPE
} from '../config/config'
import Base64 from './Base64'

const dayjs = require('dayjs')

// export function time

/**
 * 判断是否是函数
 */
export function isFunction(fun) {
  return !!(fun && typeof fun === 'function')
}

/**
 * 跳转页面
 * @param url 页面url,在app.js中配置的
 * @param needLogin 是否需要登录才能使用
 */
export function navToPage(url, needLogin = true, loginPage) {
  if (needLogin && !getAuthenticate()) {
    Taro.navigateTo({ url: `/pages/login/login?page${loginPage}` })
  } else {
    if (url.indexOf('/pages/distributorIndex/distributorIndex') > -1 && getUserDistributor()) {
      Taro.switchTab({ url: url })
      return
    } else if (url.indexOf('/pages/distributorIndex/distributorIndex') > -1 && !getUserDistributor()) {
      url = '/pages/dredgeUnionCard/dredgeUnionCard'
    }
    Taro.navigateTo({
      url
      // delta: 0
    })
  }
}

/**
 * 路由中对象参数的传递编码
 * @param params
 * @returns {string}
 */
export function encodeURIObj(params) {
  return objNotNull(params) ? encodeURIComponent(JSON.stringify(params)
    .replace(/\%/g, '这是一个百分号')) : ''
}

/**
 * 路由中对象参数的传递解码
 * @param params
 * @returns {{}}
 */
export function decodeURIObj(params) {
  // console.log(decodeURIComponent(params));
  return params ? JSON.parse(decodeURIComponent(params)
    .replace(/这是一个百分号/g, '%')) : {}
}

// 服务器上图片地址
export function getServerPic(url) {
  if (!url) {
    return null
  }
  // 美团,饿了么图片
  if (url.indexOf('http') === 0 || url.indexOf('https') === 0) {
    return url
  }
  return `${PRVIMG_URL}${url}`
}


/**
 * 根据选择器获取元素的方法封装(微信小程序中有效)
 * @param scope 作用域(小程序/h5)
 * @param selector 选择器名称:类/id选择器
 * @param execCallback 获取结果回调函数
 */
export function getSelectorAll(selector, execCallback, scope) {
  const query = Taro.createSelectorQuery()
    .in(scope)
  // 获取右边商品列表元素的高度
  query.selectAll(selector)
    .boundingClientRect()
  query.exec(res => {
    isFunction(execCallback) && execCallback(res)
  })
}

/**
 * 格式化附件地址
 *
 * @param path
 * @returns {*}
 */
export function formatAttachPath(path) {
  return path && path.indexOf('http') < 0 ? PRVIMG_URL + path : path
}

/**
 * 将数值四舍五入(保留2位小数)后格式化成金额形式
 * @param num 数值(Number或者String)
 * @return 金额格式的字符串,如'1,234,567.45'
 * @type String
 */
export function formatCurrency(num) {
  if (!num && num !== 0) {
    return '--'
  }
  num = num.toString()
    .replace(/\$|\,/g, '')
  if (isNaN(num)) {
    num = '0'
  }
  const sign = (num == (num = Math.abs(num)))
  num = Math.floor(num * 100 + 0.50000000001)
  let cents = num % 100
  num = Math.floor(num / 100)
    .toString()
  if (cents < 10) {
    cents = `0${cents}`
  }
  for (let i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++) {
    num = `${num.substring(0, num.length - (4 * i + 3))},${
      num.substring(num.length - (4 * i + 3))}`
  }
  return (`${((sign) ? '' : '-') + num}.${cents}`)
}

/**
 * 求两个经纬度坐标之间的距离
 * @param lat1
 * @param lat2
 * @param lng1
 * @param lng2
 * @returns {number}
 */
export function calculateDistanceByCoordinate(lat1, lat2, lng1, lng2) {
  const radLat1 = lat1 * Math.PI / 180.0
  const radLat2 = lat2 * Math.PI / 180.0
  const a = radLat1 - radLat2
  const b = (lng1 * Math.PI / 180.0) - (lng2 * Math.PI / 180.0)
  let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
  s *= 6378.137
  // EARTH_RADIUS;
  s = Math.round(s * 10000) / 10000
  s = s.toFixed(1)
  return s - 0
}

export function getCacheName(name) {
  return `${CACHE_PREV}${name}`
}

/**
 * 存储平台编号
 *
 * @param id
 */
export function savePlatFormId(id) {
  Taro.setStorageSync(getCacheName('id'), id)
}

/**
 * 获取平台编号
 */
export function getPlatFormId() {
  const id = Taro.getStorageSync(getCacheName('id'))
  return id || DEFAULT_PLAT_FORM_ID
}

/**
 * 缓存登陆后特殊跳转
 */
export function saveLoginCompleteGo(loginCompleteGo) {
  Taro.setStorageSync(getCacheName('login_complete_go'), loginCompleteGo)
}

/**
 * 读取登陆后特殊跳转
 */
export function readLoginCompleteGo() {
  const loginCompleteGo = Taro.getStorageSync(getCacheName('login_complete_go'))
  return loginCompleteGo || ''
}

/**
 * 缓存用户坐标
 */
export function saveUserLocation(location) {
  Taro.setStorageSync(getCacheName('user_location'), location)
}

/**
 * 获取用户坐标
 */
export function getUserLocation() {
  const location = Taro.getStorageSync(getCacheName('user_location'))
  return location || {}
}

/**
 *  格式化时间
 * @param time 传入的时间戳
 * @param fmt 格式样式: "yyyy-MM-dd hh:mm:ss.S" ==> 2006-07-02 08:09:04.423
 *                      "yyyy-MM-dd hh:mm:ss" ==> 2006-07-02 08:09:04
 *                      "yyyy-M-d h:m:s.S"  ==> 2006-7-2 8:9:4.18
 *                      "yyyy-M-d h:m:s"  ==> 2006-7-2 8:9:4
 *
 * @returns {*}
 */
export function dateFormat(time, fmt = 'yyyy-MM-dd hh:mm') {
  if (!time) {
    return
  }
  const date = new Date(time * 1000)
  const o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds() // 毫秒
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (`${date.getFullYear()}`).substr(4 - RegExp.$1.length))
  }
  for (const k in o) {
    if (new RegExp(`(${k})`).test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : ((`00${o[k]}`).substr((`${o[k]}`).length)))
    }
  }
  return fmt
}


/* 转换时间(时间格式为2018-06-02T04:01:29Z 转换) */
export function dateFormatWithDate(datetime, fmt = 'yyyy-MM-dd hh:mm') {
  const date = new Date()
  date.setTime(Date.parse(datetime))
  const o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds() // 毫秒
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (`${date.getFullYear()}`).substr(4 - RegExp.$1.length))
  }
  for (const k in o) {
    if (new RegExp(`(${k})`).test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : ((`00${o[k]}`).substr((`${o[k]}`).length)))
    }
  }
  return fmt
}

// 转换时间(时间格式为2018-06-02T04:01:29Z 转换 => 标准时间戳
export function getTimestamp(time) {
  const date = new Date()
  return date.setTime(Date.parse(time))
}

/**
 * 带T时间少8小时处理
 * @param dateForm 带T的时间格式:2018-08-21T16:00:00Z
 * @param fmt :yyyy-MM-dd hh:mm:ss
 * @returns {string}
 */
export function handleFormDate(dateForm, fmt) {
  if (!dateForm) {
    return '--'
  }
  const o = new Date(dateForm).getTime() / 1000 + 8 * 3600
  return dateFormat(o, fmt)
}

/**
 * 补0一位
 *
 * @param val
 * @returns {string}
 */
export function fixedZero(val) {
  return val * 1 < 10 ? `0${val}` : val
}

export function readQrPartnerCode() {
  return Taro.getStorageSync(getCacheName('qrPartner_code'))
}

/**
 * 获取时间差
 *
 * @param type
 * @returns {[null,null]}
 */
export function getTimeDistance(type) {
  const now = new Date()
  const oneDay = 1000 * 60 * 60 * 24

  if (type === 'today') {
    now.setHours(0)
    now.setMinutes(0)
    now.setSeconds(0)
    return [moment(now), moment(now.getTime() + (oneDay - 1000))]
  }

  if (type === 'week') {
    let day = now.getDay()
    now.setHours(0)
    now.setMinutes(0)
    now.setSeconds(0)

    if (day === 0) {
      day = 6
    } else {
      day -= 1
    }

    const beginTime = now.getTime() - (day * oneDay)

    return [moment(beginTime), moment(beginTime + ((7 * oneDay) - 1000))]
  }

  if (type === 'month') {
    const year = now.getFullYear()
    const month = now.getMonth()
    const nextDate = moment(now)
      .add(1, 'months')
    const nextYear = nextDate.year()
    const nextMonth = nextDate.month()

    return [moment(`${year}-${fixedZero(month + 1)}-01 00:00:00`), moment(moment(`${nextYear}-${fixedZero(nextMonth + 1)}-01 00:00:00`)
      .valueOf() - 1000)]
  }

  if (type === 'year') {
    const year = now.getFullYear()

    return [moment(`${year}-01-01 00:00:00`), moment(`${year}-12-31 23:59:59`)]
  }
}

/**
 * 获取目标日期距离当前日期的时间差
 *
 * @param date
 * @returns {number}
 */
export function minusTime(date) {
  const d1 = new Date(date)
  const d2 = new Date()
  return (d1.getTime() - d2.getTime()) / 1000
}

/**
 * 格式化店铺信息
 *
 * @param merchant
 */
export function formatMerchantInfo(merchant) {
  if (merchant.merchantActivityList) {
    merchant.merchantActivityList = merchant.merchantActivityList.map(activity => {
      const tagName = []
      switch (activity.activityType) {
        case SHOP_ACTIVITY_TYPE.FULL_SUB.key:
          activity.activityInfo.fullReductionlist && activity.activityInfo.fullReductionlist.map(reduce => {
            tagName.push(`满${reduce.fullMoney}减${reduce.cutMoney}`)
          })
          activity.icoName = '减'
          activity.icoClassName = 'yellow'
          break
        case SHOP_ACTIVITY_TYPE.SKILL.key:
          activity.icoName = '秒'
          activity.icoClassName = 'green'
          tagName.push('限时秒杀')
          break
        case SHOP_ACTIVITY_TYPE.OFFER.key:
          activity.icoName = '折'
          activity.icoClassName = 'purple'
          activity.activityInfo.map(item => {
            tagName.push(item.activeName)
          })
          break
      }
      activity.tagName = tagName.join('；')
      return { ...activity }
    })
  }

  if (merchant.merchantDetails && merchant.merchantDetails.position) {
    const location = merchant.merchantDetails.position.split(',')
    const userLocation = getUserLocation()
    merchant.merchantDetails = {
      ...merchant.merchantDetails,
      longitude: location[0],
      latitude: location[1]
    }
    merchant.distance = userLocation.latitude ? calculateDistanceByCoordinate(userLocation.latitude, merchant.merchantDetails.latitude, userLocation.longitude, merchant.merchantDetails.longitude) : '未授权'
  }

  if (merchant.merchantDetails && merchant.merchantDetails.industryStr) {
    const industryTagName = merchant.merchantDetails.industryStr.split(' ')
    merchant.merchantDetails.industryTagName = industryTagName
  }
}

/**
 * 调用打电话
 * @param phoneNumber
 */
export function callPhone(phoneNumber) {
  if (!phoneNumber) {
    showToast('联系电话未提供')
    return
  }
  Taro.makePhoneCall({
    phoneNumber: `${phoneNumber}`,
    success: () => {

    },
    fail: () => {

    }
  })
}

/**
 * 存储用户信息
 *
 * @param userInfo
 * @param callback
 */
export function saveUserInfo(userInfo, callback) {
  Taro.setStorage({
    key: getCacheName('user_info'),
    data: userInfo
  })
    .then(res => { // 将用户信息存入缓存中
      isFunction(callback) && callback(res)
    })
}

/**
 * 获取用户信息
 *
 * @param userInfo
 * @param callback
 */
export function getUserInfo() {
  return Taro.getStorageSync(getCacheName('user_info'))
}

/**
 * 储存用户详细信息
 */
export function saveUserDetail(userDetail) {
  Taro.setStorage({
    key: getCacheName('user_detail'),
    data: userDetail
  })
}

/*
* 获取用户详细信息
*/
export function getUserDetail() {
  return Taro.getStorageSync(getCacheName('user_detail'))
}

export function clearUserDetail() {
  Taro.removeStorageSync(getCacheName('user_detail'))
}

export function clearUserInfo() {
  Taro.removeStorageSync(getCacheName('user_info'))
}

/*
* 主页弹窗时间
* */
export function getIndexModalTime() {
  return Taro.getStorageSync(getCacheName('index_modal'))
}

export function setIndexModalTime(time) {
  Taro.setStorageSync(getCacheName('index_modal'), time)
}

/*
* 会员卡支付成功缓存
* */

export function getBuyCard() {
  return Taro.getStorageSync(getCacheName('tc_card'))
}

export function setBuyCard() {
  Taro.setStorageSync(getCacheName('tc_card'), {
    status: true,
    time: new Date()
  })
}

export function clearBuyCard() {
  Taro.clearStorageSync(getCacheName('tc_card'))
}

/**
 * 存储会话
 *
 * @param authenticate
 * @param callback
 */
export function saveAuthenticate(authenticate, callback) {
  Taro.setStorage({
    key: getCacheName('authenticate'),
    data: authenticate
  })
    .then(res => { // 将用户信息存入缓存中
      isFunction(callback) && callback(res)
    })
}

/*
* 清空会话
* */
export function clearAuthenticate() {
  Taro.removeStorageSync(getCacheName('authenticate'))
}

/**
 * 获取会话
 *
 * @param authenticate
 * @returns {null}
 */
export function getAuthenticate() {
  let auth = Taro.getStorageSync(getCacheName('authenticate'))
  auth = auth && auth != 'null' ? auth : null
  if (auth) {
    try {
      const baseToken = Base64.decode(auth.access_token.split('.')[1])
      const expire = baseToken.match(/"exp":(\d+)/i)[1]
      const userId = baseToken.match(/"id":(\d+)/i)[1]

      if (expire <= ((new Date().getTime()) / 1000)) {
        auth = null
        saveAuthenticate()
        return false
      }
      auth = {
        ...auth,
        expire,
        userId
      }
    } catch (e) {
      console.log(e)
    }
  }
  return auth
}


/**
 * 点击添加商品购物车动画效果
 * @param pots
 * @param amount
 * @returns {{bezier_points: Array}}
 */
export function bezier(pots, amount) {
  let pot
  let lines
  const ret = []
  let points
  for (let i = 0; i <= amount; i++) {
    points = pots.slice(0)
    lines = []
    while (pot = points.shift()) {
      if (points.length) {
        lines.push(pointLine([pot, points[0]], i / amount))
      } else if (lines.length > 1) {
        points = lines
        lines = []
      } else {
        break
      }
    }
    ret.push(lines[0])
  }

  function pointLine(points, rate) {
    let pointA
    let pointB
    let pointDistance
    let xDistance
    let yDistance
    let tan
    let radian
    let tmpPointDistance
    let ret = []
    pointA = points[0]// 点击
    pointB = points[1]// 中间
    xDistance = pointB.x - pointA.x
    yDistance = pointB.y - pointA.y
    pointDistance = Math.pow(Math.pow(xDistance, 2) + Math.pow(yDistance, 2), 1 / 2)
    tan = yDistance / xDistance
    radian = Math.atan(tan)
    tmpPointDistance = pointDistance * rate
    ret = {
      x: pointA.x + tmpPointDistance * Math.cos(radian),
      y: pointA.y + tmpPointDistance * Math.sin(radian)
    }
    return ret
  }

  return {
    bezier_points: ret
  }
}


/**
 * 判断对象是否为空对象
 * @param obj
 * @returns {boolean}
 */
export function objNotNull(obj = {}) {
  return !obj ? false : imitateObjectValues(obj).length > 0
}

/**
 * 显示toast提示
 * @param msg
 */
export function showToast(msg = '提示信息', duration = 1500) {
  Taro.showToast({
    icon: 'none',
    title: msg,
    duration
  })
}

/**
 * 存储临时购物车
 *
 * @param type
 * @param id
 * @param data
 */
export function saveTempBuyCar(type, id, data) {
  Taro.setStorage({
    key: getCacheName(`${type}_temp_buy_car_${id}`),
    data
  })
}

/**
 * 获取临时购物车
 *
 * @param type
 * @param id
 * @returns {any | any}
 */
export function readTempBuyCar(type, id) {
  const tempCar = Taro.getStorageSync(getCacheName(`${type}_temp_buy_car_${id}`))
  return tempCar || {}
}

/**
 * 保存购物车
 * @param data
 */
export function saveBuyCar(data) {
  return Taro.setStorage({
    key: getCacheName('buy_car'),
    data
  })
}

/**
 * 清除购物车
 * @param data
 */
export function clearBuyCar() {
  return Taro.removeStorageSync(getCacheName('buy_car'))
}

/**
 * 读取购物车
 * @returns {any | any}
 */
export function readBuyCar() {
  return Taro.getStorageSync(getCacheName('buy_car'))
}

// 缓存当前定位地址坐标等信息
export function saveCurrentLocation(data) {
  return Taro.setStorageSync(getCacheName('current_location'), data)
}

// 获取当前定位地址坐标等信息
export function getCurrentLoaction() {
  return Taro.getStorageSync(getCacheName('current_location'))
}

/**
 * 存储合伙人编号
 *
 * @param code
 * @returns {Promise<any>}
 */
export function savePartnerCode(code) {
  return Taro.setStorage({
    key: getCacheName('partner_code'),
    data: `${code}`
  })
}

/**
 * 读取合伙人编号
 *
 * @returns {any | any}
 */
export function readPartnerCode() {
  return Taro.getStorageSync(getCacheName('partner_code'))
}

/**
 * 存储合伙人信息
 * @param code
 */
export function savePartner(partner) {
  return Taro.setStorageSync(getCacheName('partner'), partner)
}

/**
 * 读取合伙人信息
 *
 * @returns {any | any}
 */
export function readPartner() {
  return Taro.getStorageSync(getCacheName('partner'))
}

/**
 * 存储合伙人奖励配置
 * @param code
 */
export function savePartnerReward(reward) {
  return Taro.setStorageSync(getCacheName('partner_reward'), reward)
}

/**
 * 读取合伙人奖励配置
 *
 * @returns {any | any}
 */
export function readPartnerReward() {
  return Taro.getStorageSync(getCacheName('partner_reward'))
}

/**
 * 存储合伙人等级配置
 * @param code
 */
export function savePartnerRankInfo(rank) {
  return Taro.setStorageSync(getCacheName('partner_rank'), rank)
}

/**
 * 读取合伙人等级配置
 *
 * @returns {any | any}
 */
export function readPartnerRankInfo() {
  return Taro.getStorageSync(getCacheName('partner_rank'))
}

/**
 * 计算合伙人分享收益
 *
 * @returns {any | any}
 */
export function calculateReward(item) {
  if (!item) return
  const { platform, platformDish, platformDishDetail } = Taro.getStorageSync(getCacheName('partner_reward')) || {}
  let reward = 0

  // 验证等级权益
  const rankInfo = readPartnerRankInfo()

  // 不存在等级或该等级不能享受收益直接返回
  if (!rankInfo || PARTNER_RIGHTS_FOUR !== (rankInfo.hierarchy & PARTNER_RIGHTS_FOUR)) return ''

  // 当前合伙人编号 不等于 当前合伙人信息中的编号 不享受权益
  const partnerInfo = readPartner()
  // console.log(partnerInfo.code,readPartnerCode(),readPartnerCode() !== partnerInfo.code);
  // if (partnerInfo && readPartnerCode() != partnerInfo.code) return "";
  // 等级不享受 不返现
  if (!rankInfo || PARTNER_RIGHTS_FOUR !== (rankInfo.hierarchy & PARTNER_RIGHTS_FOUR)) return ''

  // 等级加权
  const rankProfitRate = PARTNER_RIGHTS_EIGHT === (rankInfo.hierarchy & PARTNER_RIGHTS_EIGHT) ? rankInfo.extraRatio || 0 : 0

  if (platform) {
    const rewardRate = platform.supplierRates.selfReceiveReward || 0
    if (platform.supplierRates.rewardType !== 1) {
      reward = rewardRate
    } else {
      reward = toDecimal(item.price * (rewardRate + rankProfitRate) / 100)
    }
  }
  if (platformDish) {
    platformDish.forEach(merchant => {
      if (merchant.foods && merchant.supplierRates) {
        const rewardRate = merchant.supplierRates.selfReceiveReward || 0
        const rewardType = merchant.supplierRates.rewardType || 1
        merchant.foods.forEach(dishId => {
          if (dishId === item.dishId) {
            if (rewardType === 2) {
              reward = rewardRate
            } else {
              reward = toDecimal(item.price * (rewardRate + rankProfitRate) / 100)
            }
          }
        })
      }
    })
  }

  if (platformDishDetail) {
    platformDishDetail.forEach(dishDetail => {
      if (item.dishId === dishDetail.goodsId && dishDetail.distributorProportion) {
        reward = toDecimal(item.price * (dishDetail.distributorProportion + rankProfitRate) / 100)
      }
    })
  }

  return reward ? `赚${reward}元` : ''
}


/**
 * 格式化平台菜品数据
 *
 * @param platDish
 */
export function formatPlatDish(platDish) {
  /* let clientDate = new Date();
  let startDate = new Date(Date.parse(platDish.saleStartTime));
  let endDate = new Date(Date.parse(platDish.saleEndTime));
  let state = SALE_STATE.PROCESSING;

  state = clientDate.getTime() >= startDate.getTime() && clientDate.getTime() < endDate.getTime() ? SALE_STATE.PROCESSING :
      (clientDate.getTime() >= endDate.getTime() ? SALE_STATE.FINISH : SALE_STATE.NOT_START);
  state = Math.max(...(platDish && platDish.shopDish && platDish.shopDish.shopDishSkus ? platDish.shopDish.shopDishSkus.map(item => item.stock) : [])) <= 0 ? SALE_STATE.OVER : state;

  platDish.saleState = state; */
  const shopDishSkus = platDish.shopDish && platDish.shopDish.shopDishSkus && platDish.shopDish.shopDishSkus.length > 0 && platDish.shopDish.shopDishSkus || []
  platDish.shopDish.saleCount = shopDishSkus.length > 0 && shopDishSkus.map(sku => sku.saleNum)
    .reduce((o1, o2) => o1 + o2) || 0
  platDish.shopDish.price = shopDishSkus.length > 0 && toDecimal(Math.min(...shopDishSkus.map(sku => sku.price))) || 0
  platDish.shopDish.originalPrice = shopDishSkus > 0 && toDecimal(Math.max(...shopDishSkus.map(sku => sku.originalPrice))) || 0
}

/**
 * 解决数值溢出问题
 *
 * @param x
 * @returns {number}
 */
export function toDecimal(x) {
  let val = Number(x)
  if (!isNaN(parseFloat(val))) {
    val = val.toFixed(2) * 1
  }
  return val
}

/**
 * 返回上级页面时执行页面中的方法,使用此方法可以反向传参等...
 * @param params:需要传递的参数
 * @param pageNo:需要返回的页面栈2:上一个页面,3:上上个页面,...
 * @param callback:返回的页面中需要执行的回调函数
 * @param noBack :近执行之前页面中的方法,不返回
 * 注意:此方法只适用于navigateTo跳转的页面返回
 */
export function navBackExeFun(params, pageNo = 2, callback, noBack) {
  const pages = Taro.getCurrentPages()
  if (pages.length > 1) {
    // 要返回的上一个页面实例对象
    const prePage = pages[pages.length - pageNo].$component
    // console.log(prePage);
    // 关键在这里
    isFunction(prePage[callback]) && prePage[callback](params)
    !noBack && Taro.navigateBack({ delta: pageNo - 1 })
  }
}

/**
 * 显示loading弹层
 * @param title
 * @param mask
 */
export function showLoading(title = '加载中', mask = true) {
  Taro.showLoading({
    title,
    mask
  })
}

// 关闭loading弹层
export function hideLoading(callBack) {
  Taro.hideLoading({
    complete: () => {
      isFunction(callBack) && callBack()
    }
  })
}

/**
 * 字符串以多少个空格分割
 * @param str
 * @param num
 * @returns {string}
 */
export function strToSpace(str, num = 4) {
  if (!str) {
    return ''
  }
  const arr = str.split('')
  let newStr = ''
  arr.map((o, i) => {
    newStr += o
    if ((i + 1) % num === 0 && i !== arr.length - 1) {
      newStr += '  '
    }
  })
  return newStr
}

/**
 * 复制方法
 * @param text
 */
export function copyToClipboard(text) {
  if (!text) {
    showToast('空内容不能复制')
    return
  }
  Taro.setClipboardData({
    data: text,
    success: res => {
      showToast('复制成功')
    }
  })
}

/**
 * 小程序导航栏白色修改
 * @param bgColor 背景颜色
 * @param textBlack 标题颜色:black / white
 * @param title 标题 内容
 * @returns {{navigationBarBackgroundColor: string, navigationBarTextStyle: string, navigationBarTitleText: string}}
 */
export function wxBarColorSet({ bgColor = '#ffffff', textBlack = 'black', title = '标题' }) {
  return {
    navigationBarBackgroundColor: bgColor,
    navigationBarTextStyle: textBlack,
    navigationBarTitleText: title
  }
}

/**
 * 替换emoji表情
 * @param str
 * @returns {*}
 */
export function replaceEmoji(str) {
  return str.replace(/\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/gi, '')
}

/**
 * 用户使用了需要登录的功能
 * @param page
 */
export function needLogin(page, callback) {
  if (!getAuthenticate()) {
    isFunction(callback) && callback()
    navToPage(`/pages/login/login?page=${page}`, false)
    return false
  }
  return true
}

/**
 * 去掉字符串中所有空格
 * @param str
 * @returns {*}
 */
export function trimAllSpace(str) {
  return str.replace(/\s+/g, '')
}


/**
 * 验证手机号码是否合法
 * @param phone
 */
export function validatePhone(phone) {
  return (/^1\d{10}$/.test(phone))
}


/**
 * 获取设备系统信息
 * @returns {any | undefined}
 */
export function getSysInfo() {
  return Taro.getStorageSync('systemInfo')
}

/**
 * 检测网络状态
 */
export function checkNetWorkStatus() {
  Taro.onNetworkStatusChange(res => {
    console.log(res.isConnected)
    if (!res.isConnected) {
      showToast('网络连接不可用')
    }
    console.log(res.networkType)
  })
}

/**
 * 登陆完成跳转
 */
export function loginCompleteGo(delta = 1) {
  console.log(readLoginCompleteGo(), 'run login back!')
  switch (readLoginCompleteGo()) {
    case 'distributor':
      saveLoginCompleteGo('')
      // Taro.switchTab({url: "/pages/distributor/distributorLayout"});
      navToPage(`/pages/distributor/distributor?platId=${getPlatFormId()}&code=${readPartnerCode()}`, false)
      // Taro.redirectTo({url:`/pages/distributor/distributor?platId=${getPlatFormId()}&code=${readPartnerCode()}`});
      break
    default:
      Taro.navigateBack({ delta })
      break
  }
}

/**
 * 格式化销量
 *
 * @param item
 * @returns {*}
 */
export function formatSaleCount(item) {
  const saleArr = item && isArray(item) && item.map(sku => {
    let { saleNum, initNum } = sku
    saleNum = saleNum || 0
    initNum = initNum || 0
    return saleNum + initNum
  })
  return saleArr && saleArr.length > 0 ? saleArr.reduce((a, b) => a + b) : 0
}


export function formatPhone(phone) {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}


// 打开导航地图
export function openLocation(positions, name, address) {
  /* Taro.openLocation({
      latitude: Number(positions[1]),
      longitude: Number(positions[0]),
      name: name,
      address: address,
      scale: 28
  }); */
}

// 计算商品类型
export function productTypeAnd(type, value) {
  return (type & value) === value
}

// 生成服务时间
export function makeTimeStepByServiceTime(defaultItem, merchant, platSetting) {
  // console.log(defaultItem, merchant, platSetting);
  // const merchant = this.state.merchantInfo;
  // 获取平台服务时间
  // let platSetting = objNotNull(this.state.platformSystemSetting) ? this.state.platformSystemSetting : null,
  let platServiceTimes = platSetting ? platSetting.businessHours : null
  let startTime
  let endTime
  let platStartTime
  let platEndTime

  if (platServiceTimes) {
    platServiceTimes = platServiceTimes.split('-')
    platStartTime = parseFloat(platServiceTimes[0].replace(':', '.')), platEndTime = parseFloat(platServiceTimes[1].replace(':', '.'))
  }
  // 获取商户服务时间
  // let merchant = CommonUtil.getMerchant(CommonUtil.getCurrentMerchant()),
  let merchantServiceTimes = merchant.shopHours
  let merchantStartTime
  let merchantEndTime
  if (merchantServiceTimes) {
    merchantServiceTimes = merchantServiceTimes.split(',')
    if (merchantServiceTimes.length > 1) { // 多个时间段 取最开始 和 最后结束时间 中间忽略
      merchantStartTime = parseFloat(merchantServiceTimes[0].split('-')[0].replace(':', '.'))
      merchantEndTime = parseFloat(merchantServiceTimes[merchantServiceTimes.length - 1].split('-')[1].replace(':', '.'))
    } else {
      const tempTimes = merchantServiceTimes[0].split('-')
      merchantStartTime = parseFloat(tempTimes[0].replace(':', '.'))
      merchantEndTime = parseFloat(tempTimes[1].replace(':', '.'))
    }
  }

  startTime = Math.max(platStartTime || 0, merchantStartTime || 0) // 开始时间取最晚
  endTime = Math.min(platEndTime || 24, merchantEndTime || 24) // 结束时间取最早

  const currentDate = new Date()
  const currentHoursMinute = parseFloat(`${currentDate.getHours()}.${currentDate.getMinutes()}`)
  const tmpStartTime = startTime.toString()
    .split('.')

  let startMinute = startTime < currentHoursMinute ? currentDate.getMinutes() <= 10 ? 0 : 30 : tmpStartTime.length > 1 ? tmpStartTime[1] : 0
  let startHour = startTime < currentHoursMinute ? currentDate.getMinutes() >= 40 ? currentDate.getHours() + 1 : currentDate.getHours() : parseFloat(startTime.toString()
    .split('.')[0])

  let sendTimes
  if (currentHoursMinute >= endTime) {
    sendTimes = []
    startHour = parseFloat(startTime.toString()
      .split('.')[0])
    startMinute = tmpStartTime.length > 1 ? tmpStartTime[1] : 0
  } else {
    sendTimes = [defaultItem]
  }

  let hour = startHour
  let maxStep = (parseInt(endTime.toString()
    .split('.')) - startHour + 1) * 2 // 用结束时间减去当前时间 得到剩余时间 乘以半小时步长值
  let currentInOpenTime = false

  for (let i = 1; i < maxStep; i++) {
    const endMinute = startMinute + 30

    const step = `${fixZero(hour)}:${startMinute <= 0 ? '00' : fixZero(startMinute)}-${endMinute >= 60 ? fixZero(hour + 1) : fixZero(hour)}:${endMinute >= 60 ? '00' : fixZero(endMinute)}`

    if (merchantServiceTimes && merchantServiceTimes.length > 1) { // 如果设置了多个时间段 那么要排除不服务的时间段
      const tempStep = step.split('-')
      const stepStartTime = parseFloat(tempStep[0].replace(':', '.'))
      const stepEndTime = parseFloat(tempStep[1].replace(':', '.'))
      let inTimePlan = false
      merchantServiceTimes.forEach(item => {
        const timeUnit = item.split('-')
        let sTime = timeUnit[0]
        let eTime = timeUnit[1]
        sTime = parseFloat(sTime.replace(':', '.'))
        eTime = parseFloat(eTime.replace(':', '.'))
        if (stepStartTime >= sTime && stepEndTime <= eTime) {
          inTimePlan = true
        }
        if (currentHoursMinute >= sTime && currentHoursMinute <= eTime) {
          // 在营业时间内
          currentInOpenTime = true
        }
      })
      if (inTimePlan) {
        sendTimes.push(step)
      }
    } else {
      sendTimes.push(step)
      if (currentHoursMinute <= endTime && currentHoursMinute >= startTime) {
        currentInOpenTime = true
      }
    }

    startMinute += 30
    if (startMinute >= 60) {
      hour++
      hour = hour >= 24 ? 0 : hour
      startMinute = 0
    }
  }

  if (!currentInOpenTime) {
    sendTimes.shift() // 如果当前时间不在 营业时间段内 弹出数组首元素
  }

  // console.log(sendTimes);

  const otherSendTimes = []
  if (currentHoursMinute < endTime) {
    startMinute = tmpStartTime.length > 1 ? tmpStartTime[1] : 0
    startHour = parseFloat(startTime.toString()
      .split('.')[0])
    hour = startHour, maxStep = (parseInt(endTime.toString()
      .split('.')) - startHour + 1) * 2 // 用结束时间减去当前时间 得到剩余时间 乘以半小时步长值
    const d = new Date()
    d.setTime(d.getTime() + 24 * 60 * 60 * 1000)
    for (let i = 1; i < maxStep; i++) {
      const endMinute = startMinute + 30

      const step = `${fixZero(hour)}:${startMinute <= 0 ? '00' : fixZero(startMinute)}-${endMinute >= 60 ? fixZero(hour + 1) : fixZero(hour)}:${endMinute >= 60 ? '00' : fixZero(endMinute)}`
      if (merchantServiceTimes && merchantServiceTimes.length > 1) { // 如果设置了多个时间段 那么要排除不服务的时间段
        const tempStep = step.split('-')
        const stepStartTime = parseFloat(tempStep[0].replace(':', '.'))
        const stepEndTime = parseFloat(tempStep[1].replace(':', '.'))
        let inTimePlan = false
        merchantServiceTimes.forEach(item => {
          const timeUnit = item.split('-')
          let sTime = timeUnit[0]
          let eTime = timeUnit[1]
          sTime = parseFloat(sTime.replace(':', '.'))
          eTime = parseFloat(eTime.replace(':', '.'))
          if (stepStartTime >= sTime && stepEndTime <= eTime) {
            inTimePlan = true
          }
        })
        if (inTimePlan) {
          otherSendTimes.push(`${step}`)
        }
      } else {
        otherSendTimes.push(`${step}`)
      }

      startMinute += 30
      if (startMinute >= 60) {
        hour++
        hour = hour >= 24 ? 0 : hour
        startMinute = 0
      }
    }
  }
  const countDay = MAX_EXPECTED_SEND_DAY
  const dateTimes = []

  // console.log(sendTimes, otherSendTimes);

  for (let i = 0; i < countDay; i++) {
    const d = new Date()
    d.setTime(d.getTime() + (i * 86400000))
    d.getDay()
    dateTimes.push({
      date: `${i == 0 ? '今天' : ''}（${d.getMonth() + 1}月-${d.getDate()}日）`,
      times: i == 0 ? sendTimes : otherSendTimes,
      realDate: dateFormat(d.getTime() / 1000, 'MM-dd')
    })
  }

  return dateTimes || []
}

export function fixZero(i) {
  return i < 10 ? `0${i}` : i
}

/**
 * 判断是否是数组的兼容方法
 * @param arg
 * @returns {*}
 */
export function isArray(arg) {
  if (!Array.isArray) {
    // Array.isArray = function(arg){
    return Object.prototype.toString.call(arg) === '[object Array]'
    // }
  }
  return Array.isArray(arg)
}

// 计算坐标是否落在某个区域
export function pnpoly(nvert, vertx, verty, testx, testy) {
  let i
  let j
  let c = 0
  for (i = 0, j = nvert - 1; i < nvert; j = i++) {
    if (((verty[i] > testy) != (verty[j] > testy))
      && (testx < (vertx[j] - vertx[i]) * (testy - verty[i]) / (verty[j] - verty[i]) + vertx[i])) {
      c = !c
    }
  }
  return c
}

// 计算坐标是否落在某个区域
// 4.22 新加location参数, 次函数中就不在调用getCurrentLoaction获取当前位置
export function locationArea(sendAreas, location) {
  // / 坐标点是否在多边形内判断
  // / </summary>
  // / <param name="point"></param>
  // / <param name="pts"></param>
  // / <returns></returns>
  if (!sendAreas || sendAreas.length === 0) {
    return false
  }
  const userLocation = location
  if (!objNotNull(userLocation)) {
    return false
  }
  const point = {
    lat: userLocation.latitude,
    lng: userLocation.longitude
  }
  const pts = sendAreas.map(o => ({
    lat: Number(o[1]),
    lng: Number(o[0])
  }))
  // console.log(point);
  // console.log(pts);
  // 检查类型
  if (point == null || pts == null) {
    return false
  }

  const N = pts.length
  const boundOrVertex = true // 如果点位于多边形的顶点或边上，也算做点在多边形内，直接返回true
  let intersectCount = 0 // cross points count of x
  const precision = 2e-10 // 浮点类型计算时候与0比较时候的容差
  let p1
  let p2 // neighbour bound vertices
  const p = point // 测试点
  p1 = pts[0] // left vertex
  for (let i = 1; i <= N; ++i) {
    if (p.lat === p1.lat && p.lng === p1.lng) {
      return boundOrVertex // p is an vertex
    }
    p2 = pts[i % N] // right vertex
    if (p.lat < Math.min(p1.lat, p2.lat) || p.lat > Math.max(p1.lat, p2.lat)) {
      p1 = p2
      continue // next ray left point
    }

    if (p.lat > Math.min(p1.lat, p2.lat) && p.lat < Math.max(p1.lat, p2.lat)) {
      if (p.lng <= Math.max(p1.lng, p2.lng)) {
        if (p1.lat == p2.lat && p.lng >= Math.min(p1.lng, p2.lng)) {
          return boundOrVertex
        }
        if (p1.lng == p2.lng) {
          if (p1.lng == p.lng) {
            return boundOrVertex
          }

          ++intersectCount
        } else {
          const xinters = (p.lat - p1.lat) * (p2.lng - p1.lng) / (p2.lat - p1.lat)
            + p1.lng // cross point of lng
          if (Math.abs(p.lng - xinters) < precision) {
            return boundOrVertex
          }

          if (p.lng < xinters) {
            ++intersectCount
          }
        }
      }
    } else if (p.lat == p2.lat && p.lng <= p2.lng) {
      const p3 = pts[(i + 1) % N] // next vertex
      if (p.lat >= Math.min(p1.lat, p3.lat) && p.lat <= Math.max(p1.lat, p3.lat)) {
        ++intersectCount
      } else {
        intersectCount += 2
      }
    }
    p1 = p2 // next ray left point
  }
  if (intersectCount % 2 == 0) { // 偶数在多边形外
    return false
  }
  // 奇数在多边形内
  return true
}

// 外卖商品距离计算
export function merchantDistance(locationStr) {
  // console.log(locationStr);
  if (!locationStr) {
    return '--'
  }
  // 门店坐标
  const merchantLatlngs = locationStr.split(',')
  // 当前定位坐标
  const userLocation = getCurrentLoaction()
  if (objNotNull(userLocation)) {
    const distance = calculateDistanceByCoordinate(userLocation.latitude, Number(merchantLatlngs[1]), userLocation.longitude, Number(merchantLatlngs[0]))
    // console.log(distance);
    return `${distance}公里`
  }
  return '--'
}

/**
 * 获取用户最近的门店
 * @param dishMerchantShippingInfo:商品绑定的门店信息列表
 * @param userLocation:用户当前坐标
 * @returns 最近门店距离的信息,最近距离是多少,最近距离是否超出配送范围
 *
 */
export function latelyMerchant(dishMerchantShippingInfo, userLocation) {
  if (!isArray(dishMerchantShippingInfo) || dishMerchantShippingInfo.length < 1) {
    return {}
  }
  const tempArr = dishMerchantShippingInfo.filter(o => o.position)
  if (!objNotNull(userLocation) || tempArr.length < 1) {
    return {}
  }
  // 首先计算出门店距离最近的门店
  let distances = tempArr.map((o, i) => {
    const merchantLatlngs = o.position.split(',')
    return {
      distance: calculateDistanceByCoordinate(userLocation.latitude, Number(merchantLatlngs[1]), userLocation.longitude, Number(merchantLatlngs[0])),
      index: i
    }
  })
  distances = distances.sort((a, b) => a.distance - b.distance)
  let minDistance
  let minIndex
  for (let i = 0; i < distances.length; i++) {
    if (locationArea(tempArr[distances[i].index].shippingRange, userLocation)) {
      minDistance = distances[i].distance
      minIndex = distances[i].index
      break
    }
  }
  if (!minDistance || !minIndex) {
    minDistance = distances[0].distance
    minIndex = distances[0].index
  }
  return {
    ...tempArr[minIndex],
    minDistance: `${minDistance}公里`, // 最近门店距离
    isDeliveryRange: locationArea(tempArr[minIndex].shippingRange, userLocation), // 是否超出配送范围
    distances: minDistance
  }
}


// 将xxxx-xx-xx的时间格式，转换为 xxxx/xx/xx的格式
export function getDateDiff(time) {
  return time.replace(/\-/g, '/')
}


/**
 * 计算宣发剩余时间
 *
 */
export function calculateResidueTime(takeOrderTime, endTime, limitDay) {
  const take = (new Date(getDateDiff(takeOrderTime.replace('T', ' ')))).getTime() + limitDay * 24 * 60 * 60 * 1000
  const end = (new Date(getDateDiff(endTime.replace('T', ' ')))).getTime()
  const now = (new Date()).getTime()
  const residueTime = take - now < end - now ? take - now : end - now

  // 计算天数
  const days = Math.floor(residueTime / (24 * 3600 * 1000))
  // 计算出小时数
  const leave1 = residueTime % (24 * 3600 * 1000) // 计算天数后剩余的毫秒数
  const hours = Math.floor(leave1 / (3600 * 1000))
  // 计算相差分钟数
  const leave2 = leave1 % (3600 * 1000) // 计算小时数后剩余的毫秒数
  const minutes = Math.floor(leave2 / (60 * 1000))
  return `${days}天${hours}小时${minutes}分钟`
}

export function remainingTime(endTime = '') {
  const end = (new Date(getDateDiff(endTime.replace('T', ' ')))).getTime()
  const now = (new Date()).getTime()
  const residueTime = end - now
  const days = Math.floor(residueTime / (24 * 3600 * 1000))
  // 计算出小时数
  const leave1 = residueTime % (24 * 3600 * 1000) // 计算天数后剩余的毫秒数
  const hours = Math.floor(leave1 / (3600 * 1000))
  // 计算相差分钟数
  const leave2 = leave1 % (3600 * 1000) // 计算小时数后剩余的毫秒数
  const minutes = Math.floor(leave2 / (60 * 1000))
  return `${days}天${hours}小时${minutes}分钟`
}

// 获取最小粉丝数    （1000, 2000]     输出1000
export function getMinFans(expertGradeFansNumbers) {
  const fansStr = expertGradeFansNumbers.substring(1)
  const fansNum = fansStr.substring(0, fansStr.length - 1)
  return fansNum.split(',')[0]
}

// 判断是否享有会员卡权益
export function judgeLegendsCard(cardInfo) {
  if (!cardInfo) {
    return false
  }
  const { memberEndTime } = cardInfo
  const end = (new Date(memberEndTime.replace('T', ' '))).getTime()
  const now = (new Date()).getTime()
  if (end - now < 0) {
    return false
  }
  return true
}

// 获取用户分享信息
export function getUserDistributor() {
  return Taro.getStorageSync(getCacheName('user_distributor'))
}

// 设置用户分享信息
export function setUserDistributor(data) {
  Taro.setStorageSync(getCacheName('user_distributor'), data)
}

// 清空用户分享信息
export function clearUserDistributor() {
  Taro.removeStorageSync(getCacheName('user_distributor'))
}

// 获取合伙人分享信息
export function getShareInfo() {
  return Taro.getStorageSync(getCacheName('share_info'))
}

// 设置合伙人分享信息
export function setShareInfo(data) {
  Taro.setStorageSync(getCacheName('share_info'), data)
}

// 清空合伙人分享信息
export function clearShareInfo() {
  Taro.removeStorageSync(getCacheName('share_info'))
}


// 获取平台分享设置
export function getPlatformDistributeSetting() {
  return Taro.getStorageSync(getCacheName('platform_setting'))
}

// 设置平台分享设置
export function setPlatformDistributeSetting(data) {
  Taro.setStorageSync(getCacheName('platform_setting'), data)
}

// 清空平台分享设置
export function clearPlatformDistributeSetting() {
  Taro.removeStorageSync(getCacheName('platform_setting'))
}


// 获取url路径参数
export function parseQuery(url) {
  const queryObj = {};
  // console.log(url);
  const reg = /[?&]([^=&#]+)=([^&#]*)/g
  const querys = url.match(reg);
  // console.log(querys)
  if (querys) {
    for (const i in querys) {
      const query = querys[i].split('=')
      const key = query[0].substr(1)
      const value = query[1]
      queryObj[key] ? queryObj[key] = [].concat(queryObj[key], value) : queryObj[key] = value
    }
  }
  return queryObj
}

// 执行广告位链接
export function advertisingLinks(params, _this) {
  if (!objNotNull(params)) return
  const {
    linkType, dishId, functionPosition,
    brandDTO = {}, categoryId
  } = params
  switch (linkType) {
    // case 1:
    //   navToPage(`/pages/specialOffer/specialOffer?categoryId=${categoryId}`)
    //   break
    case 0:
      navToPage('/pages/activePage/activePage')
      break
    case 2:
      navToPage(`/pages/goodsDetails/goodsDetails?dishId=${dishId}&platFormId=${PLATFORM_ID}&merchantId=`)
      break
    case 3: {
      if (functionPosition === 2) { // 会员权益页面
        Taro.switchTab({ url: NAV_LINK[functionPosition] })
        return
      }
      if (functionPosition === 5) { // 检测是否认证过达人
        const { islandPromotionExpertAuthDTOS } = getUserDetail()
        if (islandPromotionExpertAuthDTOS.length <= 0) {
          navToPage('/pages/achievementCertification/achievementCertification')
          return
        }
      }
      navToPage(NAV_LINK[functionPosition])
    }
      break
    case 5:
      navToPage(`/package/multiStore/merchantDetail/merchantDetail?id=${dishId}&brandId=`)
      break
    case 7:
      break
    case 6: {
      const {
        id, brandName, brandLogo, brandDetailPic
      } = brandDTO
      _this.$preload({
        id, brandName, brandLogo, brandDetailPic
      })
      navToPage('/package/multiStore/brandDetail/brandDetail')
    }
      break
    default:
      break
  }
}

// 判断当前时间是否在时间范围内
export function judgeTimeRange(startTime, endTime) {
  const curTime = new Date().getTime()
  if (curTime < endTime && curTime > startTime) {
    return true
  }
  return false
}

// 指定长度为数字前面补零
export function fillZero(num, n = 2) {
  if ((`${num}`).length >= n) return num
  return fillZero(`0${num}`, n)
}

// 获取时间（月，日，时，分）数组
export function getTimeAry(time) {
  return [
    fillZero(time.getMonth() + 1), fillZero(time.getDate()),
    fillZero(time.getHours()), fillZero(time.getMinutes())
  ]
}

// 数组分块
export const arrayChunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size))

// 生成随机整数
export const randomIntegerInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

export function strReplaceParams(str, params) {
  return str.replace(/\${params}/g, params)
}

export function imitateObjectValues(obj) {
  if (obj !== Object(obj)) throw new TypeError('Object.values called on a non-object')
  const val = []
  let key
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      val.push(obj[key])
    }
  }
  return val
}

// 判断是否是数字
export function isNumber(num) {
  const re = /^\d+$/
  if (re.test(num)) {
    return true
  }
  return false
}

// 判断是否是空串
export function notEmpty(text) {
  const textValue = text.replace(/(^\s*)|(\s*$)/g, '')
  if (textValue === null || textValue === '') {
    return false
  }
  return true
}

// 清空字符串中所有空格
export function removeAllSpace(str = '') {
  return str.replace(/\s+/g, '')
}

export function resetName(str) {
  return `${str.slice(0, 1)}**`
}

export function findMinSku(sku) {
  let curSku = sku.filter(({ memberPrice }) => memberPrice !== null && memberPrice !== undefined)
    .sort((a, b) => a.memberPrice - b.memberPrice)
  if (!curSku.length) {
    curSku = sku.sort((a, b) => a.price - b.price)
  }
  return curSku[0] || {}
}

// 判断当前时间是否在范围营业时间内
export function typeAnd(type, value) {
  return (type & value) === value
}

/**
 * 判断当前时间是否在一个时间段
 */
export function timeIsRange(beginTime, endTime) {
  const strb = beginTime.split(':')
  if (strb.length != 2) {
    return false
  }

  const stre = endTime.split(':')
  if (stre.length != 2) {
    return false
  }

  const b = new Date()
  const e = new Date()
  const n = new Date()

  b.setHours(strb[0])
  b.setMinutes(strb[1])
  e.setHours(stre[0])
  e.setMinutes(stre[1])

  if (n.getTime() - b.getTime() > 0 && n.getTime() - e.getTime() < 0) {
    return true
  }
  return false
}
/*
* 存储分销商品id
*/
export function saveCodeDishId(dishId) {
  Taro.setStorageSync(getCacheName('codeDishId'), dishId)
}
/*
* 获取分销商品id
*/
export function getCodeDishId() {
  return Taro.getStorageSync(getCacheName('codeDishId'))
}
/**
 * 储存分销订单来源
 */
export function saveCodeSign(codeSign) {
  Taro.setStorageSync(getCacheName('codeSign'), codeSign)
}
export function saveQrPartnerCode(code) {
  Taro.setStorage({ key: getCacheName('qrPartner_code'), data: code })
}
/**
 * 获取用户搜索历史
 * @returns {[]}
 */
export function getSearchHistory(callback) {
  Taro.getStorage({ key: getCacheName('searchHistory') }).then(res => {
    isFunction(callback) && callback(res)
  }).catch(() => {
    isFunction(callback) && callback({})
  })
}
/**
 * 储存用户搜索历史
 * @param history
 */
export function saveSearchHistory(history) {
  Taro.setStorage({ key: getCacheName('searchHistory'), data: history })
}
/**
 * 清除用户搜索历史
 */
export function removeSearchHistory(callback) {
  Taro.removeStorage({ key: getCacheName('searchHistory') }).then(res => {
    isFunction(callback) && callback(res)
  })
}

/**
 * 判断是否加入合伙人
 * */

export function judgeIsPartner() {
  return objNotNull(getUserDistributor())
}

/**
 * 函数节流
 * */
export function throttle(fn, ms = 1000) {
  let canRun = true
  return function () {
    if (!canRun) return
    canRun = false
    setTimeout((...args) => {
      fn.call(this, ...args)
      canRun = true
    }, ms)
  }
}

/**
 * 存储平台信息
 *
 * @param id
 */
export function savePlatFormInfo(data) {
  Taro.setStorageSync(getCacheName('platform'), data)
}

/**
 * 获取平台信息
 */
export function getPlatFormInfo() {
  const id = Taro.getStorageSync(getCacheName('platform'))
  return id || {}
}
