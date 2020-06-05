import Taro, { PureComponent } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { AtBadge } from 'taro-ui'
import './legendsCardRight.scss'
import IconFont from '../../components/IconFont/IconFont'
import { STATIC_IMG_URL } from '../../config/baseUrl'
import { navToPage } from '../../utils/utils'

export default class LegendsCardRight extends PureComponent {
  config = {
    navigationBarTitleText: '权益卡联盟',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
  }

  render() {
    return (
      <View className="pageWarp">
        <View className="legendsCardPrivilege">
          <View className="title flex-row flex-ac flex-jc">
            <Text>会员卡尊享6大特权</Text>
          </View>
          <View className="privilegeWarp flex-row flex-wrap flex-sb">
            <View className="item flex-col flex-ac">
              <View className="flex1">
                <IconFont value="imgPrivilege1" h={80} w={100} />
              </View>
              <View className="privilegeInfo">商品黑金专享价</View>
            </View>
            <View className="item flex-col flex-ac">
              <View className="flex1">
                <IconFont value="imgPrivilege2" h={70} w={70} />
              </View>
              <View className="privilegeInfo">自购商品返现</View>
            </View>
            <View className="item flex-col flex-ac">
              <View className="flex1">
                <IconFont value="imgPrivilege3" h={80} w={84} />
              </View>
              <View className="privilegeInfo">推广商品返现</View>
            </View>
            <View className="item flex-col flex-ac">
              <View className="flex1">
                <IconFont value="imgPrivilege4" h={74} w={86} />
              </View>
              <View className="privilegeInfo">奖金池金额瓜分</View>
            </View>
            <View className="item flex-col flex-ac">
              <View className="flex1">
                <IconFont value="imgPrivilege5" h={68} w={94} />
              </View>
              <View className="privilegeInfo">邀请团队返现30%</View>
            </View>
            <View className="item flex-col flex-ac">
              <View className="flex1">
                <IconFont value="imgPrivilege6" h={66} w={82} />
              </View>
              <View className="privilegeInfo">品牌全年折扣1折起</View>
            </View>
          </View>
        </View>
        {/* <View className="brandProduct">
          <View className="title flex-row flex-ac flex-jc">
            <Text>品牌商品</Text>
          </View>
          <View className="flex-row">
            <View className="brandItem flex-col flex-ac">
              <AtBadge value="8.6折">
                <Image src={`${STATIC_IMG_URL}/brand/brand_1.png`} />
              </AtBadge>
              <Text className="name">星巴克</Text>
              <Text className="discount">饮品券8.6折起</Text>
            </View>
            <View className="brandItem flex-col flex-ac">
              <Image src={`${STATIC_IMG_URL}/brand/brand_2.png`} />
              <Text className="name">奈雪的茶</Text>
              <Text className="discount">饮品券8.2折起</Text>
            </View>
            <View className="brandItem flex-col flex-ac">
              <Image src={`${STATIC_IMG_URL}/brand/brand_3.png`} />
              <Text className="name">哈根达斯</Text>
              <Text className="discount">低至6折起</Text>
            </View>
            <View className="brandItem flex-col flex-ac">
              <Image src={`${STATIC_IMG_URL}/brand/brand_4.png`} />
              <Text className="name">满记甜品</Text>
              <Text className="discount">特享6.6折起</Text>
            </View>
          </View>
          <View className="flex-row">
            <View className="brandItem flex-col flex-ac">
              <Image src={`${STATIC_IMG_URL}/brand/brand_5.png`} />
              <Text className="name">肯德基</Text>
              <Text className="discount">低至5.9折起</Text>
            </View>
            <View className="brandItem flex-col flex-ac">
              <Image src={`${STATIC_IMG_URL}/brand/brand_6.png`} />
              <Text className="name">必胜客</Text>
              <Text className="discount">特享8.4折起</Text>
            </View>
            <View className="brandItem flex-col flex-ac">
              <AtBadge value="5折">
                <Image src={`${STATIC_IMG_URL}/brand/brand_7.png`} />
              </AtBadge>
              <Text className="name">汉堡王</Text>
              <Text className="discount">低至5折起</Text>
            </View>
            <View className="brandItem flex-col flex-ac">
              <Image src={`${STATIC_IMG_URL}/brand/brand_8.png`} />
              <Text className="name">幸福西饼</Text>
              <Text className="discount">低至0.4折起</Text>
            </View>
          </View>
          <View className="flex-row">
            <View className="brandItem flex-col flex-ac">
              <Image src={`${STATIC_IMG_URL}/brand/brand_9.png`} />
              <Text className="name">淘票票电影</Text>
              <Text className="discount">特享7.9折起</Text>
            </View>
            <View className="brandItem flex-col flex-ac">
              <AtBadge value="4折">
                <Image src={`${STATIC_IMG_URL}/brand/brand_10.png`} />
              </AtBadge>
              <Text className="name">爱奇艺会员</Text>
              <Text className="discount">特享4折起</Text>
            </View>
            <View className="brandItem flex-col flex-ac">
              <Image src={`${STATIC_IMG_URL}/brand/brand_11.png`} />
              <Text className="name">腾讯会员</Text>
              <Text className="discount">特享6折起</Text>
            </View>
            <View className="brandItem flex-col flex-ac">
              <Image src={`${STATIC_IMG_URL}/brand/brand_12.png`} />
              <Text className="name">网易云音乐</Text>
              <Text className="discount">特享6.6折起</Text>
            </View>
          </View>
        </View>
        <View
          className="allBrandBtn"
          onClick={() => {
            navToPage('/pages/rightsCoupon/rightsCouponHome')
          }}
        >
          查看全部品牌>
        </View> */}
      </View>
    )
  }
}
