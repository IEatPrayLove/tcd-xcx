import Taro, { Component } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'

import './memberRights.scss'
import Payment from '../../../components/Payment/Payment'
import { decodeURIObj } from '../../../utils/utils'

export default class MemberRights extends Component {
  config = {
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#ffffff'
  }

  constructor() {
    super()
    this.state = {
      cardRights: decodeURIObj(this.$router.params.rightsInfo),
      rightsType: this.$router.params.type
    }
  }

  render() {
    const { cardRights, rightsType } = this.state
    return (
      <View className="container">
        <View className="rightsBox">
          {
            ((cardRights.commonDiscountRights && cardRights.commonDiscountRights.length > 0) || cardRights.commonUpgradeRights || cardRights.commonBirthdayRights || cardRights.commonMemberPrice) && (
            <View className="rightsTitle">
              <Text>通用权益</Text>
            </View>
            )
          }
          <View className="rightsContent">
            {
              rightsType === 'discountRights' && cardRights.commonDiscountRights.map(item => <Text decode className="rightsWord">{item}</Text>)
            }
            {
              rightsType === 'updateRights' && <Text decode className="rightsWord">{cardRights.commonUpgradeRights}</Text>
            }
            {
              rightsType === 'birthRights' && <Text decode className="rightsWord">{cardRights.commonBirthdayRights}</Text>
            }
            {
              rightsType === 'memberRights' && <Text decode className="rightsWord">{cardRights.commonMemberPrice}</Text>
            }
          </View>
          {
            ((cardRights.levelDiscountRights && cardRights.levelDiscountRights.length > 0) || cardRights.levelUpgradeRights || cardRights.levelBirthdayRights || cardRights.levelMemberPrice) && (
            <View className="rightsTitle">
              <Text>等级权益</Text>
            </View>
            )
          }
          <View className="rightsContent">
            {
              rightsType === 'discountRights' && cardRights.levelDiscountRights.map(item => <Text decode className="rightsWord">{item}</Text>)
            }
            {
              rightsType === 'updateRights' && <Text decode className="rightsWord">{cardRights.levelUpgradeRights}</Text>
            }
            {
              rightsType === 'birthRights' && <Text decode className="rightsWord">{cardRights.levelBirthdayRights}</Text>
            }
            {
              rightsType === 'memberRights' && <Text decode className="rightsWord">{cardRights.levelMemberPrice}</Text>
            }
          </View>
        </View>
        {/* <View className="item"> */}
        {/*  <Text>权益名称</Text> */}
        {/*  <Text>西部计划大白菜见下表</Text> */}
        {/* </View> */}
        {/* <View className="item"> */}
        {/*  <Text>优惠说明</Text> */}
        {/*  <Text> */}
        {/*    orem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus sapien nunc eget. */}
        {/*  </Text> */}
        {/* </View> */}
        {/* <View className="item"> */}
        {/*  <Text>权益奖励 </Text> */}
        {/*  <Text>按天算-部分时段-10:00至12:00</Text> */}
        {/* </View> */}
        {/* <View className="coupon flex-row"> */}
        {/*  <View className="money flex-col"> */}
        {/*    <Text>5</Text> */}
        {/*    <Text>无门槛</Text> */}
        {/*  </View> */}
        {/*  <View className="couponInfo flex-col flex-sb"> */}
        {/*    <Text>水果生鲜满减券</Text> */}
        {/*    <Text>代金券-仅限到门店使用</Text> */}
        {/*    <View className="btn">立即领取</View> */}
        {/*  </View> */}
        {/* </View> */}
        {/* <View className="item"> */}
        {/*  <Text>赠送成长值</Text> */}
        {/*  <Text>100点</Text> */}
        {/* </View> */}
        {/* <View className="item"> */}
        {/*  <Text>赠送积分</Text> */}
        {/*  <Text>100个</Text> */}
        {/* </View> */}
      </View>
    )
  }
}
