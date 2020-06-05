import Taro from '@tarojs/taro'
import {
  View, Image, SwiperItem, Swiper,
  Block, Text
} from '@tarojs/components'
import { arrayChunk, getServerPic, resetName } from '../../utils/utils'
import { DYNAMIC_TYPE } from '../../config/config'
import './UserDynamic.scss'

export default function UserDynamic({
  type = [], data = []
}) {
  const newData = data.filter(({ sysWebSocketResponseType }) => type.includes(sysWebSocketResponseType))
  return (
    <Block>
      {
        newData.length > 0 ? (
          <Swiper
            className="userSwiper"
            circular
            autoplay
            vertical
            interval={2000}
          >
            {
              newData.map((ele, idx) => {
                const {
                  amount, headPic, sysWebSocketResponseType,
                  userName
                } = ele
                return (
                  <SwiperItem key={idx} className="group flex-row flex-ac">
                    <Image className="userImg flex-sk" src={getServerPic(headPic)}/>
                    <View className="userInfo ellipsis">
                      {`${resetName(userName)}，${DYNAMIC_TYPE[sysWebSocketResponseType]}￥${amount}`}
                    </View>
                  </SwiperItem>
                )
              })
            }
          </Swiper>
        ) : <View className="placeholder" />
      }
    </Block>
  )
}
