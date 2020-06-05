import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Image, Text
} from '@tarojs/components'
import {
  connect
} from '@tarojs/redux'
import {
  getServerPic, getUserDetail, getUserDistributor, objNotNull,
  dateFormatWithDate, formatCurrency, navToPage
} from '../../../utils/utils'
import {
  GRADE_FEATURE
} from '../../../config/config'

import './partnerGrade.scss'
import { STATIC_IMG_URL } from '../../../config/baseUrl'
const dayjs = require('dayjs')

@connect(({ distributor: { allLevels } }) => ({ allLevels }))
export default class PartnerGrade extends PureComponent {
  config = {
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '合伙人等级',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
  }

  render() {
    const { headPic, nickName, distributionReward } = getUserDetail()
    const { allLevels } = this.props
    const userBaseInfo = getUserDistributor()
    const rankInfo = userBaseInfo && userBaseInfo.partnerLevelModel || {}
    let levelFunctions = []
    if (objNotNull(rankInfo)) {
      if (rankInfo.levelFunction) {
        levelFunctions = GRADE_FEATURE.filter(o => (rankInfo.levelFunction & o.value) === o.value)
      }
    }
    return (
      <View className="level-wrap">
        <View className="index-header">
          <View className="flex-row header-area">
            <Image
              src={getServerPic(headPic)}
              className="level-header flex-sk"
            />
            <View className="flex-col name-area">
              <View className="name ellipsis">{nickName || '--'}</View>
              <View className="flex-row flex-ac level-tag-wrap">
                <View className="flex-row level-tag">
                  <Image
                    src={rankInfo.imageUrl ? getServerPic(rankInfo.imageUrl) : `${STATIC_IMG_URL}/distributor_level/level_def.png`}
                    className="level-logo"
                  />
                  <Text className="level-name">{rankInfo.levelName || '--'}</Text>
                </View>
                <View className="line" />
                <Text
                  className="join-time"
                >
                  {userBaseInfo.joinDate ? dateFormatWithDate(userBaseInfo.joinDate, 'yyyy-MM-dd') : '--'}
加入
                </Text>
              </View>
            </View>
            {
              !(allLevels.length > 0 && rankInfo.level === allLevels[allLevels.length - 1].level)
                ? (
                  <Text
                    className="level-upgrade-btn flex-sk"
                    onClick={() => {
                      navToPage('/package/distributor/gradeUpgrade/gradeUpgrade')
                    }}
                  >
                  等级升级
                  </Text>
                )
                : (
                  <Text className="level-upgrade-btn flex-sk">
                  已顶级
                  </Text>
                )
            }
          </View>
        </View>
        <View className="money-wrap">
          <View className="flex-row flex-sb">
            <View className="flex-col money-item earnings flex-sb">
              <Text className="title">已获取赏金</Text>
              <View className="flex-row money-value">
                <Text className="unit">¥</Text>
                <Text
                  className="money"
                >
                  {formatCurrency(distributionReward || 0)}
                </Text>
              </View>
            </View>
            <View className="flex-col money-item redpack flex-sb">
              <Text className="title">可领红包</Text>
              <View>
                <Text className="money">0</Text>
                <Text className="unit">个</Text>
              </View>
            </View>
          </View>
          <View className="flex-row flex-sb btns-wrap">
            <Text
              className="money-btn"
              onClick={() => {
                navToPage('/package/distributor/distributorRecord/distributorRecord')
              }}
            >
              查看详情
            </Text>
            <Text className="money-btn gray">
              立即领取
            </Text>
          </View>
        </View>
        <View className="rights-title">您的尊享权益</View>
        <Text
          className="rights-banner"
          onClick={() => {
            navToPage('/package/distributor/rightsExplain/rightsExplain')
          }}
          // to={"/LevelRights"}
        >
          {
            !(allLevels.length > 0 && rankInfo.level === allLevels[allLevels.length - 1].level)
            && <View className="upgrade-tips">升级获更多权益</View>
          }
        </Text>
        <View className="function-wrap">
          <View className="function-title">可用功能</View>
          <View className="flex-row flex-sb function-item-wrap">
            {
              levelFunctions.length > 0
                ? levelFunctions.map((o, i) => (
                  <View key={i} className={`function-item icon${o.value}`}>{o.label}</View>
                ))
                : <View>暂无可用功能</View>
            }
          </View>
        </View>
      </View>
    )
  }
}
