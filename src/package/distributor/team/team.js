import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Text, Image, Button
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import {
  dateFormatWithDate,
  navToPage,
  getUserDetail,
  getServerPic,
  getUserDistributor
} from '../../../utils/utils'
import './team.scss'
import { TaroCanvasDrawer } from '../../../components/taro-plugin-canvas'

import IconFont from '../../../components/IconFont/IconFont'
import { APP_ID, MYSELF_URL, STATIC_IMG_URL, SERVER_IMG } from '../../../config/baseUrl'

@connect(({ distributor: { distributorInfo } }) => ({
  distributorInfo
}))
export default class Team extends PureComponent {
  config = {
    navigationBarTitleText: '我的团队',
    navigationBarTextStyle: 'white',
    navigationBarBackgroundColor: '#FF643D'
  }

  constructor() {
    super()
    this.state = {
      teamInfo: {},
      shareModalVisible: false,
      config: null,
      // 绘制的图片
      shareImage: null,
      // TaroCanvasDrawer 组件状态
      canvasStatus: false,
      rssConfig: {
        width: 750,
        height: 1334,
        backgroundColor: '#fff',
        debug: false,
        images: [
          {
            url: 'https://cydl-resource.oss-cn-zhangjiakou.aliyuncs.com/island-zhuancan/generatepPosters.png',
            width: 750,
            height: 1334,
            y: 0,
            x: 0,
            zIndex: 10
          },
          {
            url: null,
            width: 120,
            height: 120,
            x: 228,
            y: 1193,
            zIndex: 12
          }
        ]
      }
    }
  }

  componentDidShow() {
    this.getTeamInfo()
  }

  getTeamInfo = () => {
    const { dispatch } = this.props
    dispatch({
      type: 'distributor/getTeamInfo',
      payload: {
        userId: getUserDetail().weappUserId
      },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            teamInfo: data
          })
        }
      }
    })
  }

  // 生成二维码
  makeQrCode = () => {
    Taro.showLoading({
      title: '绘制中...',
      mask: true
    })
    const { dispatch } = this.props
    const { rssConfig } = this.state
    const { code } = getUserDistributor()
    dispatch({
      type: 'legendsCard/getShareQrCodeAction',
      payload: {
        // qrContent: `${MYSELF_URL}?code=${code || ''}`,
        // userId: getUserDetail().id,
        // appId: APP_ID
        qrContent: `${MYSELF_URL}?code=977844367`,
        userId: 977844367,
        appId: APP_ID
        // qrContent: `${MYSELF_URL}?code=825631375`,
        // userId: 825631375,
        // appId: APP_ID
      },
      callback: ({ ok, data }) => {
        if (ok && data.url) {
          const template = JSON.parse(JSON.stringify(rssConfig))
          template.images[1].url = SERVER_IMG + data.url
          this.setState({
            rssConfig: template
          }, () => {
            this.canvasDrawFunc()
          })
        } else {
          Taro.hideLoading()
        }
      }
    })
  }

  // 调用绘画 => canvasStatus 置为true、同时设置config
  canvasDrawFunc = (config = this.state.rssConfig) => {
    this.setState({
      canvasStatus: true,
      config
    })
  }

  // 绘制成功回调函数 （必须实现）=> 接收绘制结果、重置 TaroCanvasDrawer 状态
  onCreateSuccess = result => {
    const { tempFilePath, errMsg } = result
    Taro.hideLoading()
    if (errMsg === 'canvasToTempFilePath:ok') {
      this.setState({
        shareImage: tempFilePath,
        // 重置 TaroCanvasDrawer 状态，方便下一次调用
        canvasStatus: true,
        config: null
      })
    } else {
      // 重置 TaroCanvasDrawer 状态，方便下一次调用
      this.setState({
        canvasStatus: false,
        config: null
      })
      Taro.showToast({ icon: 'none', title: errMsg || '出现错误' })
    }
    // 预览
    // Taro.previewImage({
    //   current: tempFilePath,
    //   urls: [tempFilePath]
    // })
  }

  // 绘制失败回调函数 （必须实现）=> 接收绘制错误信息、重置 TaroCanvasDrawer 状态
  onCreateFail = error => {
    Taro.hideLoading()
    Taro.showTabBar()
    // 重置 TaroCanvasDrawer 状态，方便下一次调用
    this.setState({
      canvasStatus: false,
      config: null
    })
  }

  closePosterModal = () => {
    this.setState({
      canvasStatus: false,
      shareImage: null
    })
  }

  render() {
    const {
      teamInfo, canvasStatus,
      shareImage, config
    } = this.state
    const {
      oneLevelDistributorDTO
    } = teamInfo
    // const { distributorInfo } = this.props;
    // console.log(distributorInfo)
    return (
      <Block>
        <View className="top-header">
          <Text>团队总人数</Text>
          <Text className="people-num">55</Text>
          <Text>招募成员</Text>
        </View>
        <Block>
          <View className="title">
            <Text>邀请人</Text>
          </View>
          <View className="recommend flex-row flex-ac">
            <Image
              className="firstTeam"
              src={`${STATIC_IMG_URL}/contact.png`}
            />
            <Text>小芝芝</Text>
          </View>
        </Block>
        <View className="title">
          <Text>我的团队成员</Text>
        </View>
        <View>
          <View className="recommend flex-row flex-ac">
            <Image
              className="firstTeam"
              src={`${STATIC_IMG_URL}/contact.png`}
            />
            <Text>小芝芝</Text>
          </View>
          <View className="recommend flex-row flex-ac">
            <View className="color pl">加入时间</View>
            <Text className="color ml">2020-19-23  10:23 </Text>
          </View>
          <View className="recommend flex-row flex-ac">
            <View className="color pl">累计分享单量</View>
            <View className="color" style={{marginLeft:'150px'}}>我获得的收益</View>
          </View>
        </View>
      </Block>
      //         <Block>
      //           <View className="header flex-col flex-ac flex-jc">
      //             <Text>已从团队获得收益</Text>
      //             <Text>{teamInfo.profitTeam ? parseFloat(teamInfo.profitTeam).toFixed(2) : '0.00'}</Text>
      //           </View>
      //           {
      //             oneLevelDistributorDTO && (
      //               <Block>
      //                 <View className="title flex-row flex-ac">
      //                   <Text>分享人</Text>
      //                 </View>
      //                 <View className="recommend flex-row flex-ac">
      //                   <Image className="firstTeam" src={getServerPic(oneLevelDistributorDTO.islandUserDTO.headPic)} />
      //                   <Text>{oneLevelDistributorDTO.islandUserDTO.nickName}</Text>
      //                 </View>
      //               </Block>
      //             )
      //           }
      //           <View className="title flex-row flex-ac">
      //             <Text>我的团队</Text>
      //           </View>
      //           <View className="team flex-row flex-ac flex-jc">
      //             <View
      //               className="member flex-col flex-ac"
      //               onClick={() => { navToPage(`/package/distributor/teamMembers/teamMembers?team=one&parentId=${teamInfo.id}`) }}
      //             >
      //               <Image className="firstTeam" src={`${STATIC_IMG_URL}/icon/firstTeam.png`} />
      //               <Text className="grade">一级成员</Text>
      //               <Text>
      //                 {teamInfo.oneSubordinate}
      // 人
      //             </Text>
      //             </View>
      //             <View className="verticalLine" />
      //             <View
      //               className="member flex-col flex-ac"
      //               onClick={() => { navToPage(`/package/distributor/teamMembers/teamMembers?team=two&parentId=${teamInfo.id}`) }}
      //             >
      //               <Image className="firstTeam" src={`${STATIC_IMG_URL}/icon/secondTeam.png`} />
      //               <Text className="grade">二级成员</Text>
      //               <Text>
      //                 {teamInfo.twoSubordinate}
      // 人
      //             </Text>
      //             </View>
      //           </View>
      //           <Button className="shareBtn" onClick={this.makeQrCode}>
      //             邀请伙伴
      //         </Button>

      //           {/* 海报生成 */}
      //           {
      //             canvasStatus && (
      //               <View
      //                 className="posterModal"
      //                 onClick={this.closePosterModal}
      //               >
      //                 {
      //                   shareImage && (
      //                     <View className="container flex-col flex-ac">
      //                       <Image
      //                         className="posterImage"
      //                         src={shareImage}
      //                         mode="aspectFit"
      //                         lazyLoad
      //                         showMenuByLongpress
      //                         onClick={e => {
      //                           e.stopPropagation()
      //                         }}
      //                       />
      //                       <IconFont value="imgClose" h={50} w={50} />
      //                     </View>
      //                   )
      //                 }
      //                 <TaroCanvasDrawer
      //                   config={config} // 绘制配置
      //                   onCreateSuccess={this.onCreateSuccess} // 绘制成功回调
      //                   onCreateFail={this.onCreateFail} // 绘制失败回调
      //                 />
      //               </View>
      //             )
      //           }
      //         </Block>
    )
  }
}
