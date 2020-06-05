import Taro, { Component } from '@tarojs/taro'
import {
  View, Image
} from '@tarojs/components'
import {
  AtModal
} from 'taro-ui'
import './NewUserRaiders.scss'
import { STATIC_IMG_URL } from '../../config/baseUrl'

/**
 * @param isShow 是否开启弹窗
 * @param closeOnClickOverlay 点击浮层的时候时候自动关闭
 */
export default class NewUserRaiders extends Component {
  constructor() {
    super()
    this.state = {
      raidersList: [
        {
          id: 'one',
          image: 'raiders_item1.png',
          title: '自购返佣',
          tip: '开通会员享有会员价还可返现'
        },
        {
          id: 'two',
          image: 'raiders_item2.png',
          title: '分享赚钱',
          tip: '好友下单你获返佣'
        },
        {
          id: 'three',
          image: 'raiders_item3.png',
          title: '奖金池',
          tip: '邀请好友开通会员瓜分百万现金'
        },
        {
          id: 'four',
          image: 'raiders_item4.png',
          title: '任务赏金',
          tip: '认证达人接任务获赏金'
        }
      ],
      imgList: {
        ['one']: [
          'self_buy1.png',
          'self_buy2.png',
          'self_buy3.png',
          'self_buy4.png',
          'self_buy5.png'
        ],
        ['two']: [
          'share_earn1.png',
          'share_earn2.png',
          'share_earn3.png',
          'share_earn4.png',
          'share_earn5.png'
        ],
        ['three']: [
          'bonus_pool1.png',
          'bonus_pool2.png',
          'bonus_pool3.png',
          'bonus_pool4.png',
          'bonus_pool5.png'
        ],
        ['four']: [
          'task_bonus1.png',
          'task_bonus2.png',
          'task_bonus3.png',
          'task_bonus4.png',
          'task_bonus5.png',
          'task_bonus6.png'
        ]
      },
      raidersDetailVisible: false,
      chooseRaiders: '',
      chooseRaidersOne: 1
    }
  }

  // 选择要展示的详情
  chooseOneRaiders = item => {
    console.log(item.id)
    this.setState({
      raidersDetailVisible: true,
      chooseRaiders: item.id
    }, () => {
      console.log(this.state.imgList[item.id][this.state.chooseRaidersOne])
    })
  }

  // 展示第几张图
  showOnePic = () => {
    const { chooseRaiders, chooseRaidersOne } = this.state
    const { changeRaiders } = this.props
    if (chooseRaiders !== 4) {
      if (chooseRaidersOne < 5) {
        this.setState({
          chooseRaidersOne: chooseRaidersOne - 0 + 1
        })
      } else {
        this.setState({
          chooseRaidersOne: 1,
          raidersDetailVisible: false
        }, () => {
          changeRaiders(true)
        })
      }
    } else if (chooseRaiders === 4) {
      if (chooseRaidersOne < 6) {
        this.setState({
          chooseRaidersOne: chooseRaidersOne - 0 + 1
        })
      } else {
        this.setState({
          chooseRaidersOne: 1,
          raidersDetailVisible: false
        }, () => {
          changeRaiders(true)
        })
      }
    }
  }
  
  render() {
    const { raidersDetailVisible, imgList, chooseRaidersOne, raidersList } = this.state
    const { changeRaiders, isShow, closeOnClickOverlay } = this.props
    
    return (
      <View className="raiderDetail">
        {
          raidersDetailVisible && (
            <View className="detailBox">
              <View className="detailItem">
                <Image
                  src={`${STATIC_IMG_URL}/${imgList[chooseRaiders][chooseRaidersOne - 1]}`}
                  onClick={() => {
                    this.showOnePic()
                  }}
                />
              </View>
            </View>
          )
        }
        <AtModal 
          isOpened={isShow}
          closeOnClickOverlay={closeOnClickOverlay}
        >
          <View className="raidersBox">
            <Image 
              src={`${STATIC_IMG_URL}/raiders_close.png`}
              className="raidersClose"
              onClick={() => {
                changeRaiders(false, 'go')
              }}
            />
            <View className="raiderHeader">
              <Image src={`${STATIC_IMG_URL}/raiders_header.png`} />
            </View>
            <View className="raidersList">
              <View className="listTitle">请选择想要了解的攻略</View>
              {
                raidersList && raidersList.map(item => (
                  <View 
                    className="flex-row listItem" 
                    key={item.id}
                    onClick={() => {
                      changeRaiders(false)
                      this.chooseOneRaiders(item)
                    }}
                  >
                    <View className="itemLeft">
                      <Image src={`${STATIC_IMG_URL}/${item.image}`} />
                    </View>
                    <View className="itemRight">
                      <View className="itemTitle">{item.title}</View>
                      <View className="itemTip">{item.tip}</View>
                    </View>
                  </View>
                ))
              }
            </View>
          </View>
        </AtModal>
      </View>
    )
  }
}