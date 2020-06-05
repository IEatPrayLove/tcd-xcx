import Taro from '@tarojs/taro'
import {
  View, Image, Text, Button
} from '@tarojs/components'
import './propagandaDetail.scss'
import { connect } from '@tarojs/redux'
import {
  AtMessage, AtModal, AtModalAction, AtModalContent
} from 'taro-ui'
import {
  getServerPic,
  dateFormatWithDate,
  navToPage,
  calculateResidueTime,
  objNotNull,
  getMinFans,
  toDecimal
} from '../../utils/utils'
import { ALL_CITY } from '../../utils/city'
import { STATIC_IMG_URL } from '../../config/baseUrl'

const dayjs = require('dayjs')

@connect(({ loading: { effects } }) => ({
  effects
}))

export default class propagandaRewardDetail extends Taro.PureComponent {
  config = {
    navigationBarTitleText: '任务详情',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
  }

  constructor() {
    super()
    this.state = {
      propagandaDetail: {},
      modalVisible: false,
      modalText: ''
    }
    this.operating = null
  }

  componentDidShow() {
    this.getPropagandaDetail()
  }

  getPropagandaDetail() {
    const detailId = this.$router.params.id
    this.props.dispatch({
      type: 'mine/getTaskDetailAction',
      payload: { id: detailId },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            propagandaDetail: data
          })
        }
      }
    })
  }

  getAddress = detail => {
    const { islandPromotionDTO: { merchantCity, merchantProvince } } = detail
    return ALL_CITY.filter(({ region_id }) => region_id === merchantCity || region_id === merchantProvince)
      .map(({ region_name }) => region_name).join('-')
  }

  render() {
    const { propagandaDetail, modalVisible, modalText } = this.state
    const {
      islandPromotionPlaceDTO = {},
      islandPromotionDTO = {},
      checkResult,
      orderState,
      checkFailReason
    } = propagandaDetail
    return (
      <View className="propagandaDetail">
        {/* 进行中 */}
        {
          orderState === 'PROMOTEING' && (
          <View className="propagandaHeader headerPaddIng">
            <View className="propagandaHeaderRow">
              <View className="propagandaHeaderItem headerItemMarL">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_success.png`} className="headerItemAgo" />
                  <View className="headerItemWord">已接单</View>
                </View>
              </View>
              <View className="propagandaHeaderArrow headerItemMarL" />
              <View className="propagandaHeaderItem headerItemMarL">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_clock.png`} />
                  <View className="headerItemWord">进行中</View>
                </View>
              </View>
            </View>
          </View>
          )
        }
        {/* 审核中 */}
        {
          orderState === 'CHECKING' && (
          <View className="propagandaHeader headerPaddCheck">
            <View className="propagandaHeaderRow">
              <View className="propagandaHeaderItem headerItemMarL">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_success.png`} className="headerItemAgo" />
                  <View className="headerItemWord">已接单</View>
                </View>
              </View>
              <View className="propagandaHeaderArrow headerItemMarL" />
              <View className="propagandaHeaderItem headerItemMarL">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_success.png`} className="headerItemAgo" />
                  <View className="headerItemWord">提交任务</View>
                </View>
              </View>
              <View className="propagandaHeaderArrow headerItemMarL" />
              <View className="propagandaHeaderItem headerItemMarL">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_success.png`} />
                  <View className="headerItemWord">审核中</View>
                </View>
              </View>
            </View>
          </View>
          )
        }
        {/* 未通过 */}
        {
          orderState === 'DISABLE' && checkResult === 0 && (
          <View className="propagandaHeader headerPaddCheck">
            <View className="propagandaHeaderRow">
              <View className="propagandaHeaderItem headerItemMarS">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_success.png`} className="headerItemAgo" />
                  <View className="headerItemWord">已接单</View>
                </View>
              </View>
              <View className="propagandaHeaderArrow headerItemMarS" />
              <View className="propagandaHeaderItem headerItemMarS">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_success.png`} className="headerItemAgo" />
                  <View className="headerItemWord">提交任务</View>
                </View>
              </View>
              <View className="propagandaHeaderArrow headerItemMarS" />
              <View className="propagandaHeaderItem headerItemMarS">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_success.png`} className="headerItemAgo" />
                  <View className="headerItemWord">审核</View>
                </View>
              </View>
              <View className="propagandaHeaderArrow headerItemMarS" />
              <View className="propagandaHeaderItem headerItemMarS">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_fail.png`} />
                  <View className="headerItemWord">未通过</View>
                </View>
              </View>
            </View>
          </View>
          )
        }
        {/* 已完成 */}
        {
          orderState === 'FINISH' && checkResult === 1 && (
          <View className="propagandaHeader headerPaddCheck">
            <View className="propagandaHeaderRow">
              <View className="propagandaHeaderItem headerItemMarS">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_success.png`} className="headerItemAgo" />
                  <View className="headerItemWord">已接单</View>
                </View>
              </View>
              <View className="propagandaHeaderArrow headerItemMarS" />
              <View className="propagandaHeaderItem headerItemMarS">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_success.png`} className="headerItemAgo" />
                  <View className="headerItemWord">提交任务</View>
                </View>
              </View>
              <View className="propagandaHeaderArrow headerItemMarS" />
              <View className="propagandaHeaderItem headerItemMarS">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_success.png`} className="headerItemAgo" />
                  <View className="headerItemWord">审核</View>
                </View>
              </View>
              <View className="propagandaHeaderArrow headerItemMarS" />
              <View className="propagandaHeaderItem headerItemMarS">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_success.png`} />
                  <View className="headerItemWord">已完成</View>
                </View>
              </View>
            </View>
          </View>
          )
        }
        {/* 手动结束 */}
        {
          orderState === 'DISABLE' && checkResult !== 0 && (
          <View className="propagandaHeader headerPaddIng">
            <View className="propagandaHeaderRow">
              <View className="propagandaHeaderItem headerItemMarL">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_success.png`} className="headerItemAgo" />
                  <View className="headerItemWord">已接单</View>
                </View>
              </View>
              <View className="propagandaHeaderArrow headerItemMarL" />
              <View className="propagandaHeaderItem headerItemMarL">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_fail.png`} />
                  <View className="headerItemWord">{propagandaDetail.closeTask ? '手动结束' : '无效'}</View>
                </View>
              </View>
            </View>
          </View>
          )
        }
        {/* 超时 */}
        {
          orderState === 'OVERTIME' && (
          <View className="propagandaHeader headerPaddIng">
            <View className="propagandaHeaderRow">
              <View className="propagandaHeaderItem headerItemMarL">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_success.png`} className="headerItemAgo" />
                  <View className="headerItemWord">已接单</View>
                </View>
              </View>
              <View className="propagandaHeaderArrow headerItemMarL" />
              <View className="propagandaHeaderItem headerItemMarL">
                <View className="headerItemImg flex-col flex-ac">
                  <Image src={`${STATIC_IMG_URL}/icon/propaganda_fail.png`} />
                  <View className="headerItemWord">超时</View>
                </View>
              </View>
            </View>
          </View>
          )
        }
        <View className="propagandaBody">
          {
            (orderState !== 'OVERTIME' && orderState !== 'DISABLE') && (
              <View className="propagandaRewardBox">
                <View className="propagandaBodyTitle">{propagandaDetail.orderState === 'FINISH' ? '获得赏金' : '当前赏金'}</View>
                <View className="propagandaBodyReward">
                  {
                    propagandaDetail.orderState === 'FINISH' ? toDecimal(propagandaDetail.reward - (propagandaDetail.reward * propagandaDetail.platformCommission * 0.01)) : propagandaDetail.reward
                  }
                  <Text>元</Text>
                </View>
                {
                  propagandaDetail.orderState && propagandaDetail.orderState === 'FINISH' && checkResult === 1 && (
                    <View className="propagandaRewardScale">
                      平台提成
                      {propagandaDetail.platformCommission}
                      %
                    </View>
                  )
                }
                {
                  propagandaDetail.orderState && propagandaDetail.orderState === 'PROMOTEING' && (
                    <View className="propagandaRewardTime">
                      剩余时间:
                      {calculateResidueTime(propagandaDetail.takeOrderTime, islandPromotionDTO.endTime, islandPromotionDTO.limitDay)}
                    </View>
                  )
                }
              </View>
            )
          }
          {
            orderState === 'FINISH' && checkResult === 1 && <View className="propagandaRewardTips">奖金将会在3个工作日内进入您的金库余额中</View>
          }
          {
            orderState === 'DISABLE' && checkResult === 0 && <View className="propagandaRewardTips">{`理由：${checkFailReason}`}</View>
          }
          {
            orderState === 'FINISH' && checkResult === 1 && <View className="propagandaLine" />
          }
          {
            orderState === 'OVERTIME' && <View className="propagandaRewardTips">未在截止时间内提交任务</View>
          }
          <View className="propagandaDetailContent">
            {
              propagandaDetail.orderState && propagandaDetail.orderState !== 'PROMOTEING' && propagandaDetail.orderState !== 'DISABLE' && propagandaDetail.orderState !== 'OVERTIME' && (
              <View className="detailContentTitle">任务凭证</View>
              )
            }
            {
              propagandaDetail.orderState && propagandaDetail.orderState !== 'PROMOTEING' && propagandaDetail.orderState !== 'DISABLE' && propagandaDetail.orderState !== 'OVERTIME' && (
              <View className="detailImgBox">
                <View className="detailImgDesc lineH">
                  <View className="detailDescTitle">任务描述：</View>
                  <View className="detailDescContent">{propagandaDetail.taskDescription ? propagandaDetail.taskDescription : '无'}</View>
                </View>
                <View className="detailImgFlex flex-row flex-wrap">
                  {
                    propagandaDetail.promotePic && propagandaDetail.promotePic.split(',').map((item, index) => <Image mode="aspectFit" key={index} src={getServerPic(item)} onClick={() => { Taro.previewImage({ urls: [getServerPic(item)] }) }} />)
                  }
                </View>
              </View>
              )
            }
            {
              !(orderState === 'DISABLE' && checkResult !== 0) && (<View className="propagandaLine" />)
            }
            {
              islandPromotionDTO && islandPromotionDTO.showMerchantInfo && islandPromotionDTO.showMerchantInfo !== null && islandPromotionDTO.showMerchantInfo === true && (
              <View className="detailContentTitle">发布者信息</View>
              )
            }
            {
              islandPromotionDTO && islandPromotionDTO.showMerchantInfo && islandPromotionDTO.showMerchantInfo !== null && islandPromotionDTO.showMerchantInfo === true && (
              <View className="detailStoreInfo">
                <View className="detailStoreInfoImg">
                  <Image src={getServerPic(islandPromotionDTO.merchantHeadPic)} />
                </View>
                <View className="detailStoreInfoRight">
                  <View className="storeInfoRightTitle">{islandPromotionDTO.platformName}</View>
                  <View className="storeInfoRightWord">{islandPromotionDTO.merchantBusiness ? islandPromotionDTO.merchantBusiness : ''}</View>
                </View>
              </View>
              )
            }
            {
              islandPromotionDTO && islandPromotionDTO.showMerchantInfo && islandPromotionDTO.showMerchantInfo !== null && islandPromotionDTO.showMerchantInfo === true && (
              <View className="detailStoreRow">
                <View className="detailStoreTitle">门店地址：</View>
                <View className="detailStoreRowWord">{this.getAddress(propagandaDetail)}</View>
              </View>
              )
            }
            {
              islandPromotionDTO && islandPromotionDTO.showMerchantInfo && islandPromotionDTO.showMerchantInfo !== null && islandPromotionDTO.showMerchantInfo === true && (
              <View className="detailStoreRow marB">
                <View className="detailStoreTitle">品牌介绍：</View>
                <View className="detailStoreRowWord">{islandPromotionDTO.merchantDetails ? islandPromotionDTO.merchantDetails : '暂无'}</View>
              </View>
              )
            }
            <View className="propagandaLine" />
            <View className="detailContentTitle">任务内容</View>
            <View className="detailStoreRow marN">
              <View className="detailStoreTitle">推广渠道：</View>
              <View className="detailStoreRowWord">{islandPromotionDTO.placeName}</View>
            </View>
            <View className="detailStoreRow">
              <View className="detailStoreTitle">达人要求：</View>
              <View className="detailStoreRowWord talentRequire flex-row flex-ac">
                <Image src={getServerPic(islandPromotionPlaceDTO.logo)} style={{ width: 30, height: 30, verticalAlign: 'middle' }} />
                <Text>
                  {islandPromotionDTO.placeName}
                  {
                    (islandPromotionDTO.placeName === '抖音' || islandPromotionDTO.placeName === '微信') ? getMinFans(islandPromotionDTO.expertGradeFansNumbers) : islandPromotionDTO.expertGradeFansNumbers
                  }
                  {
                    islandPromotionDTO.placeName === '抖音' ? '粉丝' : (islandPromotionDTO.placeName === '微信' ? '好友' : '等级')
                  }
                </Text>
              </View>
            </View>
            <View className="detailStoreRow preWord">
              <View className="detailStoreTitle">具体要求：</View>
              <View className="detailStoreRowWord">{islandPromotionDTO.requirementDescription}</View>
            </View>
            <View className="detailStoreRow">
              <View className="detailStoreTitle">具体事件：</View>
              <View className="detailStoreRowWord">{islandPromotionDTO.event}</View>
            </View>
            <View className="detailStoreRow">
              <View className="detailStoreTitle">有效时间：</View>
              <View className="detailStoreRowWord">
                {islandPromotionDTO.limitDay}
                天
              </View>
            </View>
            <View className="detailStoreRow marB">
              <View className="detailStoreTitle">截止时间：</View>
              <View className="detailStoreRowWordRed">{islandPromotionDTO.endTime && islandPromotionDTO.endTime.replace('T', ' ')}</View>
            </View>
            <View className="propagandaLine" />
            <View className="detailContentTitle">推广素材</View>
            <View className="detailStoreRowCopy">
              推广文字：
              <View
                className="copyBtn"
                onClick={() => {
                  Taro.setClipboardData({
                    data: islandPromotionDTO.promoteDescription
                  }).then(() => { })
                }}
              >
                复制
              </View>
            </View>
            <View className="detailStoreRow detailStoreRowWord lineH" style={{ color: '#333' }}>{islandPromotionDTO.promoteDescription}</View>
            <View className="detailStoreRow">
              推广图片：
            </View>
            {
              islandPromotionDTO.promotePic && propagandaDetail.islandPromotionDTO.promotePic !== null && (
              <View className="detailStoreRowFlex flex-row flex-wrap marB">
                {
                  islandPromotionDTO.promotePic.split(',').map((item, index) => <Image key={index} mode="aspectFit" onClick={() => { Taro.previewImage({ urls: [getServerPic(item)] }) }} src={getServerPic(item)} />)
                }
              </View>
              )
            }
            <View className="propagandaLine" />
            <View className="detailContentTitle">
              订单信息
              <View
                className="copyBtn"
                onClick={() => {
                  Taro.setClipboardData({
                    data: propagandaDetail.orderSn
                  }).then(() => { })
                }}
              >
                复制
              </View>
            </View>
            <View className="detailStoreRow">
              <View className="detailStoreTitle">订单编号：</View>
              <View className="detailStoreRowWord">{propagandaDetail.orderSn}</View>
            </View>
            <View className="detailStoreRow">
              <View className="detailStoreTitle">接单时间：</View>
              <View className="detailStoreRowWord">{dayjs(propagandaDetail.takeOrderTime).format('YYYY-MM-DD HH:mm:ss')}</View>
            </View>
            {
              propagandaDetail.orderState && propagandaDetail.orderState !== 'PROMOTEING' && (
              <View className="detailStoreRow">
                <View className="detailStoreTitle">
                  {((propagandaDetail.orderState === 'DISABLE' && propagandaDetail.checkResult !== 0) || propagandaDetail.orderState === 'OVERTIME') ? '结束时间：' : '提交时间：'}
                </View>
                <View className="detailStoreRowWord">
                  {dayjs(propagandaDetail.orderState === 'CHECKING'
                    ? propagandaDetail.submitTime : (propagandaDetail.orderState === 'DISABLE'
                      ? propagandaDetail.checkResult === 0 ? propagandaDetail.submitTime : propagandaDetail.closeTime : (propagandaDetail.orderState === 'OVERTIME'
                        ? propagandaDetail.endTime : propagandaDetail.createTime))).format('YYYY-MM-DD HH:mm:ss')}
                </View>
              </View>
              )
            }
            {
              propagandaDetail.orderState && (propagandaDetail.orderState === 'FINISH' || (propagandaDetail.orderState === 'DISABLE' && propagandaDetail.checkResult === 0)) && (
                <View className="detailStoreRow">
                  <View className="detailStoreTitle">审核时间：</View>
                  <View className="detailStoreRowWord">{dayjs(propagandaDetail.checkTime).format('YYYY-MM-DD HH:mm:ss')}</View>
                </View>
              )
            }
          </View>
        </View>
        {
          orderState === 'PROMOTEING' && (
          <View className="propagandaBtnBox">
            <View
              className="propagandaBtnS propagandaBtnGray"
              onClick={() => {
                this.setState({
                  modalVisible: true,
                  modalText: '是否确认结束该任务'
                })
                this.operating = () => {
                  this.props.dispatch({
                    type: 'propaganda/finishPropagandaOrderAction',
                    payload: { id: propagandaDetail.id },
                    callback: ({ ok, data }) => {
                      if (ok) {
                        Taro.atMessage({
                          message: '结束成功',
                          type: 'success'
                        })
                        this.getPropagandaDetail()
                      } else {
                        Taro.atMessage({
                          message: data.message,
                          type: 'error'
                        })
                      }
                    }
                  })
                }
              }}
            >
              结束任务
            </View>
            <View
              className="propagandaBtnS propagandaBtnRed"
              onClick={() => navToPage(`/pages/submitPropaganda/submitPropaganda?id=${propagandaDetail.id}&showGradeType=${islandPromotionPlaceDTO.showGradeType}&from=detail`)}
            >
              提交任务
            </View>
          </View>
          )
        }
        {
          propagandaDetail.orderState && (propagandaDetail.orderState === 'OVERTIME') && (
          <View className="propagandaBtnBox">
            <View
              className="propagandaBtnL propagandaBtnRed"
              onClick={() => {
                this.props.dispatch({
                  type: 'propagandaReward/getPropagandaOrderAction',
                  payload: { id: propagandaDetail.promoteId },
                  callback: ({ ok, data }) => {
                    if (ok) {
                      const { takeOrderTime, limitDay, endTime } = data
                      const residueTime = calculateResidueTime(takeOrderTime, endTime, limitDay)
                      this.setState({
                        modalVisible: true,
                        modalText: `接单成功\n剩余时间：${residueTime}`
                      })
                      this.operating = () => {
                        this.getPropagandaDetail()
                      }
                    } else {
                      Taro.atMessage({
                        message: data.message,
                        type: 'error'
                      })
                    }
                  }
                })
              }}
            >
              再次接单
            </View>
          </View>
          )
        }
        {
          propagandaDetail.orderState && ((propagandaDetail.orderState === 'DISABLE') && (`${propagandaDetail.havePermissionTakeOrder}` !== 'false')) && (
            <View className="propagandaBtnBox">
              <View
                className="propagandaBtnL propagandaBtnRed"
                onClick={() => {
                  this.props.dispatch({
                    type: 'propagandaReward/getPropagandaOrderAction',
                    payload: { id: propagandaDetail.promoteId },
                    callback: ({ ok, data }) => {
                      if (ok) {
                        const { takeOrderTime, limitDay, endTime } = data
                        const residueTime = calculateResidueTime(takeOrderTime, endTime, limitDay)
                        this.setState({
                          modalVisible: true,
                          modalText: `接单成功\n剩余时间：${residueTime}`
                        })
                        this.operating = () => {
                          this.getPropagandaDetail()
                        }
                      } else {
                        Taro.atMessage({
                          message: data.message,
                          type: 'error'
                        })
                      }
                    }
                  })
                }}
              >
                再次接单
              </View>
            </View>
          )
        }
        {
          propagandaDetail.orderState && propagandaDetail.orderState === 'CHECKING' && (
            <View className="propagandaBtnBox">
              <View
                className="propagandaBtnL propagandaBtnRed"
                onClick={() => {
                  this.setState({
                    modalVisible: true,
                    modalText: '是否撤回该任务'
                  })
                  this.operating = () => {
                    this.props.dispatch({
                      type: 'propaganda/withdrawPropagandaAction',
                      payload: { id: propagandaDetail.id },
                      callback: ({ ok, data }) => {
                        if (ok) {
                          Taro.atMessage({
                            message: '撤回成功',
                            type: 'success'
                          })
                          this.getPropagandaDetail()
                        } else {
                          Taro.atMessage({
                            message: data.message || '操作失败！',
                            type: 'error'
                          })
                        }
                      }
                    })
                  }
                }}
              >
                撤回任务
              </View>
            </View>
          )
        }
        <AtModal
          className="confirmModal"
          isOpened={modalVisible}
          onClose={() => {
            this.setState({
              modalVisible: false
            })
          }}
        >
          <AtModalContent>
            <Text>{modalText}</Text>
          </AtModalContent>
          <AtModalAction>
            <Button
              onClick={() => {
                this.setState({
                  modalVisible: false
                })
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                this.operating()
                this.setState({
                  modalVisible: false
                })
              }}
            >
              确定
            </Button>
          </AtModalAction>
        </AtModal>
        <AtMessage />
      </View>
    )
  }
}
