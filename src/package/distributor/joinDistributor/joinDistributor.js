import Taro, { Component } from '@tarojs/taro'
import {
  Button, Image, Text, View, Block
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import './joinDistributor.scss'
import {
  encodeURIObj,
  formatAttachPath,
  formatCurrency,
  getPlatFormId, getUserDistributor,
  hideLoading,
  navToPage, needLogin, parseQuery,
  readPartnerCode,
  savePartner,
  savePartnerCode,
  savePartnerRankInfo,
  savePartnerReward, setShareInfo, setUserDistributor,
  showLoading,
  showToast
} from '../../../utils/utils'
import {
  PARTNER_RIGHTS_EIGHT,
  PARTNER_RIGHTS_FOUR,
  PARTNER_RIGHTS_ONE,
  PARTNER_RIGHTS_SIXTEEN,
  PARTNER_RIGHTS_TWO,
  PARTNER_SET_FUNCTION_FOUR,
  PARTNER_SET_FUNCTION_ONE,
  PARTNER_SET_FUNCTION_TWO,
  PARTNER_SET_STATE_FIVE,
  PARTNER_SET_STATE_FOUR,
  PARTNER_SET_STATE_ONE,
  PARTNER_SET_STATE_THREE,
  PARTNER_SET_STATE_TWO,
  PARTNER_SET_STATE_SIX,
  PARTNER_SET_STATE_SEVEN,
  GRADE_RIGHTS
} from '../../../config/config'
import { STATIC_IMG_URL } from '../../../config/baseUrl'
import IconFont from '../../../components/IconFont/IconFont'

@connect(({ loading }) => ({
  ajaxLoading: loading
}))
class JoinDistributor extends Component {
    config = {
      navigationBarTextStyle: 'black',
      navigationBarTitleText: '加入合伙人',
      backgroundTextStyle: 'dark',
      navigationBarBackgroundColor: '#ffffff'
    };

    constructor() {
      super()
      this.state = {
        partnerDetail: null,
        selectedDish: null,
        newer: false,
        tcdCard: false,
        limitPrice: 0,
        chooseTcd: false
      }
    }

    componentDidShow() {
      if (!needLogin()) return
      const {
        params: { q }
      } = this.$router
      if (q) {
        const posterObj = parseQuery(decodeURIComponent(q))
        console.log('海报分享参数', posterObj)
        const { code } = posterObj
        setShareInfo({ code })
      }
      this.getPlatFormBasicInfo()
    }

    // 获取平台信息
    getPlatFormBasicInfo = async () => {
      showLoading()
      await this.props.dispatch({
        type: 'common/getPlatFormDetailAction',
        payload: {
          id: getPlatFormId()
        },
        callback: async res => {
          hideLoading()
          try {
            this.getPartnerInfo(res.data.brandId)
          } catch (e) {
            console.log('get partner info exception:', e)
          }
        }
      })
    };

    // 获取合伙人
    getPartnerInfo = async brandId => {
      await this.props.dispatch({
        type: 'common/getPartnerAction',
        payload: {
          brandId: getPlatFormId()
        },
        callback: async res => {
          if (res.ok && res.data) {
            setUserDistributor(res.data)
            Taro.switchTab({ url: '/pages/distributorIndex/distributorIndex' })
            // const { code } = res.data
            // if (code) {
            //   savePartnerCode(code)
            //   savePartner(res.data)
            //   // 获取合伙人等级设置
            //   await this.getPartnerRankInfo(res.data.rank)
            //   // 获取合伙人奖励设置
            //   await this.getPartnerShareReward(brandId)
            // }
          } else {
            // hideLoading();
            await this.getPlatPartnerSetConfig(brandId)
          }
        }
      })
    };

    // 拉取合伙人等级配置
    getPartnerRankInfo = rankId => {
      this.props.dispatch({
        type: 'distributor/getPartnerRankInfoAction',
        payload: {
          id: rankId
        },
        callback: res => {
          if (res.ok && res.data) {
            savePartnerRankInfo(res.data)
          }
        }
      })
    };

    // 拉取合伙人分成配置
    getPartnerShareReward = async brandId => {
      // 平台奖励配置
      const reward = { platform: '', platformDish: '' }
      await this.props.dispatch({
        type: 'common/getPlatformShareRewardAction',
        payload: {
          brandId: getPlatFormId()
        },
        callback: res => {
          if (res.ok && res.data) {
            reward.platform = res.data
            // console.log(res.data);
          }
        }
      })

      savePartnerReward(reward)
      hideLoading()
      // console.log("跳转合伙人....");
      // navToPage("/pages/distributor/distributor?flag=newPartner");
      Taro.redirectTo({ url: `/package/distributor/distributor${this.state.newer ? '?flag=newPartner' : ''}` })
    };

  getTcdCard = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'legendsCard/getLegendsCardMoneyAction',
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            limitPrice: data,
            tcdCard: true
          })
        }
      }
    })
  }

    // 获取平台合伙人设置
    getPlatPartnerSetConfig = async brandId => {
      /**
         * state:
         * 1 品牌没有设置等级 ；
         * 2 加入合伙人的条件是无门槛且加入成功  ；
         * 3 加入合伙人的条件是无门槛且加入失败  ；
         * 4 加入合伙人的条件是有门槛
         * 5 加入合伙人的条件的目标达成（对于新加入的人来说就是品牌等级设置不合理）
         */
      // 拉取平台合伙人
      // showLoading();
      await this.props.dispatch({
        type: 'distributor/getPartnerSetConfigAction',
        payload: { brandId: getPlatFormId(), code: readPartnerCode() || '' },
        callback: ({ ok, data }) => {
          console.log('合伙人信息', data)
          // hideLoading();
          switch (data.state) {
            case PARTNER_SET_STATE_ONE:
              showToast('未开通合伙人.')
              break
            case PARTNER_SET_STATE_TWO:
              // showToast('加入合伙人成功～');
              // navToPage("/pages/distributor/distributor?flag=newPartner");
              try {
                this.setState({ newer: true })
                this.getPartnerInfo(brandId)
              } catch (e) {
                console.log('get partner info exception:', e)
              }
              break
            case PARTNER_SET_STATE_THREE:
              showToast('加入合伙人失败～')
              break
            case PARTNER_SET_STATE_FOUR:
              this.setState({ partnerDetail: data }, () => {
                data.package && data.package.packageInfoList && this.chooseDishGroupHandle(data.package.packageInfoList[0])
              })
              break
            case PARTNER_SET_STATE_SIX:
              data.package.packageInfoList = []
              this.setState({ partnerDetail: data }, () => {
                this.chooseDishGroupHandle('tcd')
              })
              this.getTcdCard()
              break
            case PARTNER_SET_STATE_SEVEN:
              this.setState({ partnerDetail: data }, () => {
                data.package && data.package.packageInfoList && this.chooseDishGroupHandle(data.package.packageInfoList[0])
              })
              this.getTcdCard()
              break
            case PARTNER_SET_STATE_FIVE:
              break
          }
        }
      })
    };

    /**
     * 选择要购买的套餐
     * @param dish
     */
    chooseDishGroupHandle = dish => {
      const { partnerDetail } = this.state
      if (dish === 'tcd') {
        this.setState({
          chooseTcd: true
        })
        partnerDetail.package.packageInfoList = partnerDetail.package.packageInfoList.map(item => {
          item = { ...item, active: '' }
          return item
        })
        this.setState({ selectedDish: null })
        this.setState({ partnerDetail })
        return
      }
      partnerDetail.package.packageInfoList = partnerDetail.package.packageInfoList.map(item => {
        item = { ...item, active: item.dishId === dish.dishId }
        return item
      })
      this.setState({ selectedDish: dish })
      this.setState({ partnerDetail })
      this.setState({ chooseTcd: false })
    };

    /**
     * 加载套餐详情
     * @param dishId
     * @param platFormId
     */
    loadDishDetail = async (dishId, platFormId) => {
      showLoading()
      let dishDetail = null
      await this.props.dispatch({
        type: 'distributor/getShopDishesByIdsAction',
        payload: [dishId],
        callback: ({ ok, data }) => {
          dishDetail = data.pop()
          hideLoading()
        }
      })
      return dishDetail
    };

    /**
     * 记载门店详情
     * @param merchantId
     */
    loadMerchantInfo = async merchantId => {
      let merchantInfo = null
      await this.props.dispatch({
        type: 'goodsDetail/getMerchantInfoAction',
        payload: { merchantId },
        callback: ({ ok, data }) => {
          merchantInfo = data
        }
      })
      return merchantInfo
    };

    /**
     * 立即购买
     *
     * @returns {Promise.<void>}
     */
    buyNow = async () => {
      const { partnerDetail, selectedDish, chooseTcd } = this.state
      if (chooseTcd) {
        navToPage('/pages/dredgeUnionCard/dredgeUnionCard')
        return
      }
      let dishDetail = await this.loadDishDetail(selectedDish.dishId, partnerDetail.package.platformId)
      const merchantInfo = await this.loadMerchantInfo(dishDetail.merchantId)

      dishDetail = { shopDish: dishDetail }

      // navToPage(`/pages/orderConfirm/orderConfirm?partnerLevelId=${partnerDetail.package.id}&merchantInfo=${encodeURIObj(merchantInfo)}&goodsDetail=${encodeURIObj(dishDetail)}&formPage=partnerOrder`);
      navToPage(`/package/multiStore/packageOrderConfirm/packageOrderConfirm?partnerLevelId=${partnerDetail.package.id}&merchantInfo=${encodeURIObj(merchantInfo)}&goodsDetail=${encodeURIObj(dishDetail)}&formPage=partnerOrder`)
    };

    render() {
      const {
        partnerDetail = {}, selectedDish, tcdCard, limitPrice,
        chooseTcd
      } = this.state
      // active checked
      // if (!partnerDetail || !partnerDetail.package) return null
      const isRender = !partnerDetail || !partnerDetail.package
      // const PARTNER_RIGHTS = {}
      const PARTNER_RIGHTS = GRADE_RIGHTS.reduce((acc, { label, value, desc }) => (
        { ...acc, [value]: { title: label, brief: desc } }
      ), {})

      const partnerRightsKeys = Object.keys(PARTNER_RIGHTS)
      return (
        isRender ? (
          <View />
        ) : (
          <View
            scrollY
            className="flex-col join-wrap"
          >
            <View className="flex1 join-inwrap">
              <Image
                src={`${STATIC_IMG_URL}/distributor/banner.png`}
                className="banner"
              />
              <View className="content-wrap">
                {
                  partnerDetail && partnerDetail.package && (
                    <Block>
                      {partnerDetail && partnerDetail.package && partnerDetail.package.packageInfoList.length > 0 && <View className="buy-title">◆ 购买套餐立刻成为合伙人 ◆</View>}
                      <View className="goods-list">
                        {partnerDetail && partnerDetail.package && partnerDetail.package.packageInfoList && partnerDetail.package.packageInfoList.map((item, i) => (
                          <View
                            className={`flex-row goods-item ${item.active ? 'active' : ''}`}
                            hoverClass="hover"
                            hoverStartTime={10}
                            hoverStayTime={100}
                            key={i}
                            onClick={this.chooseDishGroupHandle.bind(this, item)}
                          >
                            <Image src={item.dishImageUrl && formatAttachPath(item.dishImageUrl.split(',')[0])} className="goods-logo" />
                            <View className="flex1 right flex-col flex-sb">
                              <View className="mulBreak text">{item.dishName}</View>
                              <View className="money">
                                <Text>¥</Text>
                                <Text className="rmb">{item.dishPrice}</Text>
                              </View>
                            </View>
                            {item.active && <IconFont value="imgHook" h={36} w={36} />}
                          </View>
                        ))}
                      </View>
                    </Block>
                  )
                }
                {
                  tcdCard && (
                    <Block>
                      <View className="buy-tcd">◆ 购买会员卡成为合伙人 ◆</View>
                      <View
                        className={`flex-row goods-item ${chooseTcd && 'active'} `}
                        hoverClass="hover"
                        hoverStartTime={10}
                        hoverStayTime={100}
                        // key={i}
                        onClick={this.chooseDishGroupHandle.bind(this, 'tcd')}
                      >
                        <Image src={`${STATIC_IMG_URL}/distributor_level/tc_card.png`} className="goods-logo" />
                        <View className="flex1 right flex-col flex-sb">
                          <View className="mulBreak text">会员卡</View>
                          <View className="money">
                            <Text>¥</Text>
                            <Text className="rmb">{limitPrice}</Text>
                          </View>
                        </View>
                        {chooseTcd && <IconFont value="imgHook" h={36} w={36} />}
                      </View>
                    </Block>
                  )
                }
                <View className="function-title">可用功能</View>
                <View className="flex-row flex-sb function-wrap">
                  {partnerDetail.package && PARTNER_SET_FUNCTION_ONE === (partnerDetail.package.levelFunction & PARTNER_SET_FUNCTION_ONE)
                  && (
                    <View className="function-item icons icon1">
                      <Text className="text">分享单品</Text>
                    </View>
                  )}
                  {partnerDetail.package && PARTNER_SET_FUNCTION_TWO === (partnerDetail.package.levelFunction & PARTNER_SET_FUNCTION_TWO)
                  && (
                    <View className="function-item icons icon2">
                      <Text className="text">分享平台</Text>
                    </View>
                  )}
                  {partnerDetail.package && PARTNER_SET_FUNCTION_FOUR === (partnerDetail.package.levelFunction & PARTNER_SET_FUNCTION_FOUR)
                  && (
                    <View className="function-item icons icon3">
                      <Text className="text">邀请合伙人</Text>
                    </View>
                  )}
                </View>
                <View className="function-title">权益说明</View>
                <View className="level-wrap">
                  {partnerRightsKeys.map((key, i) => (
                    parseInt(key) === (parseInt(key) & parseInt(partnerDetail.package.hierarchy))
                      ? (
                        <View className="flex-row flex-as level-item" key={`rights${i}`}>
                          <Image
                            src={`${STATIC_IMG_URL}/distributor/level_icon.png`}
                            className="level-icon"
                          />
                          <View className="flex1">
                            <View className="title">{PARTNER_RIGHTS[key].title}</View>
                            <View className="desc">{PARTNER_RIGHTS[key].brief}</View>
                          </View>
                        </View>
                      ) : null
                  ))}

                  <View className="flex-row flex-as level-item">
                    <Image
                      src={`${STATIC_IMG_URL}/distributor/level_icon.png`}
                      className="level-icon"
                    />
                    <View className="flex1">
                      <View className="title">满额提现</View>
                      <View className="desc">
                        满
                        {partnerDetail.package.fullWithdrawal}
                        即可提现
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <Button
              className="flex-row flex-ac flex-jc footer-wexin-pay"
              hoverClass="hover"
              onClick={this.buyNow.bind(this)}
            >
              <Text>立即购买</Text>
              {selectedDish ? (
                <Text className="money">
                  ¥
                  {formatCurrency(selectedDish.dishPrice)}
                </Text>
              ) : <Text className="money">{limitPrice}</Text>}
            </Button>
          </View>
        )
      )
    }
}
export default JoinDistributor
