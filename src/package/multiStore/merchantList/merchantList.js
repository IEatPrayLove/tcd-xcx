import Taro from '@tarojs/taro'
import { Block, View } from '@tarojs/components'
import { AtFloatLayout } from 'taro-ui'
import './merchantList.scss'
// import FloatLayout from '../../components/FloatLayout/FloatLayout'
import {
  calculateDistanceByCoordinate,
  getUserLocation,
  getPlatFormId
} from '../../../utils/utils'
import { useDispatch } from '@tarojs/redux'

const SIZE = 6 // 推荐门店每页显示条数


export default class MerchantList extends Taro.Component {
  constructor() {
    super()

    this.state = {
      merchantList: [],
      showServiceModal: false,
      curService: {},
      curPage: 0, // 推荐商家分页
      userLocation: getUserLocation(),
    }
  }

  componentWillMount() {
    // this.setState({
    //   merchantList: JSON.parse(this.$router.params.merchantList)
    // })
    this.getMerchantList();
  }

  serviceChange = (index) => {
    const { merchantList } = this.state
    this.setState({
      showServiceModal: true,
      curService: merchantList[index].serviceDescription || []
    })
  }
  clickServiceModal = () => {
    this.setState({ showServiceModal: !this.state.showServiceModal })
  }

  getMerchantList = () => {
    const { curPage, userLocation = {} } = this.state
    const dispatch = useDispatch()
    const { longitude, latitude } = userLocation || {}
    // 获取推荐商家
    dispatch({
      type: 'index/getRecommendMerchantAction',
      payload: {
        page: curPage,
        size: SIZE,
        platformId: getPlatFormId(),
        type: 1,
        sort: 'id,desc',
        position: `${longitude || 116.460000},${latitude || 39.920000}`
      },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState(
            ({ merchantList }) => ({
              merchantList: [...merchantList, ...data],
              merchantNoData: data.length < SIZE
            })
          )
        }
      }
    })
  }

  render() {
    const { merchantList, showServiceModal, curService } = this.state
    return (
      <Block>
        {
          merchantList && merchantList.length > 0 && merchantList.map((ele, index) => {
            let lng,
              lat
            if (ele.position) {
              const location = ele.position.split(',')
              lng = location[0]
              lat = location[1]
            }
            // const [lng, lat] = ele.position.split(',');
            const { longitude, latitude } = getUserLocation()
            return (
              <View className="MerItem" key={index}>
                <View className="merName">{ele.merchantName}</View>
                <View className="merAddress  flex-row flex-ac">
                  <Text className="addInfo flex1 ellipsis">
                    {ele.position && calculateDistanceByCoordinate(latitude, lat, longitude, lng)}km
                    | {ele.address}
                  </Text>
                  <Text className="playPhone"
                        onClick={() => {
                          Taro.makePhoneCall({
                            phoneNumber: ele.merchantTel
                          })
                        }}
                  />
                </View>
                <View className="merService flex-row flex-ac"
                      onClick={() => {
                        this.serviceChange(index)
                      }}
                >
                  <Text>服务说明：</Text>
                  {
                    ele.serviceDescription && ele.serviceDescription.length > 0 && ele.serviceDescription.map((o, i) =>
                      <Text className="ellipsis" key={i}>
                        {o.serviceTag || '--'}
                      </Text>
                    )
                  }
                </View>
              </View>
            )
          })
        }
        <AtFloatLayout isOpened={showServiceModal} onClose={() => {
          this.setState({ showServiceModal: !this.state.showServiceModal })
        }}>
          <View className="flex-col service-warp">
            <View className="header">服务说明</View>
            <View className="service-list flex1">
              {
                (curService && curService.length > 0) &&
                curService.map((o, i) => {
                  return (
                    <View className="item"
                          key={i}
                    >
                      <View className="title">{o.serviceTag || '--'}</View>
                      <View className="content">{o.serviceTagDescription || '暂无说明'}</View>
                    </View>
                  )
                })
              }
            </View>
          </View>
        </AtFloatLayout>
      </Block>
    )
  }
}
