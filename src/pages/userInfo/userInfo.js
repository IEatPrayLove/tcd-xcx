import Taro, { PureComponent } from '@tarojs/taro'
import { Picker, View, Button } from '@tarojs/components'
import { AtList, AtListItem, AtMessage } from 'taro-ui'
import { connect } from '@tarojs/redux'
import {
  getUserInfo, getUserDetail, navToPage, getAuthenticate,
  getServerPic, saveUserDetail, clearUserInfo, clearUserDetail,
  clearAuthenticate, clearUserDistributor, clearBuyCard, getBuyCard
} from '../../utils/utils'
import './userInfo.scss'
import { UPLOAD_URL } from '../../config/baseUrl'

@connect(({ loading: { effects } }) => ({
  effects
}))
export default class UserInfo extends Taro.PureComponent {
  config = {
    navigationBarTitleText: '个人信息',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
  };

  constructor() {
    super()
    this.state = {
      userInfo: getUserDetail(),
      selectorGender: ['女', '男']
    }
  }

  infoChange(e, type) {
    const { userInfo } = this.state
    this.setState({
      userInfo: {
        ...userInfo,
        [type]: e.detail.value
      }
    })
  }

  modifyAvatar = () => {
    const { userInfo } = this.state
    const root = this
    Taro.chooseImage({
      count: 1,
      success: res => {
        Taro.uploadFile({
          url: UPLOAD_URL,
          header: { Authorization: `Bearer ${getAuthenticate().access_token}` },
          filePath: res.tempFilePaths[0],
          name: 'file',
          success: response => {
            if (response.data) {
              root.setState({
                userInfo: { ...userInfo, headPic: JSON.parse(response.data).url }
              })
            } else {
              Taro.atMessage({
                message: '上传头像失败，请重试！',
                type: 'error'
              })
            }
          }
        })
      }
    })
  }

  onSubmit = () => {
    const {
      nickName, sex, birthday, headPic
    } = this.state.userInfo
    const {
      nickName: originalName,
      sex: originalSex,
      birthday: originalBirthday,
      headPic: originalHeadPic
    } = getUserDetail()
    if (
      originalName === nickName
        && originalSex === sex - 0
        && originalBirthday === birthday
        && headPic === originalHeadPic
    ) {
      return
    }
    this.props.dispatch({
      type: 'mine/modifyIslandUserAction',
      payload: {
        birthday: birthday || '',
        headPic,
        nickName,
        sex
      },
      callback: ({ ok, data }) => {
        if (ok) {
          const {
            headPic, nickName, sex, birthday
          } = data
          const userDetail = getUserDetail()
          saveUserDetail({
            ...userDetail,
            headPic,
            nickName,
            sex,
            birthday
          })
          Taro.navigateBack()
          return
        }
        !ok && this.setState({
          userInfo: getUserDetail()
        })
        Taro.atMessage({
          message: ok ? '修改成功！' : '修改失败，请重试！',
          type: ok ? 'success' : 'error'
        })
      }
    })
  }

  // 修改名字
  modifyName = val => {
    const { userInfo } = this.state
    this.setState({
      userInfo: { ...userInfo, nickName: val }
    }, this.onSubmit)
    Taro.navigateBack()
  }

  dropOut = () => {
    Taro.showModal({
      title: '提示',
      content: '是否退出登录?',
      confirmColor: '#FF643D',
      success: ({ confirm }) => {
        if (confirm) {
          clearUserInfo()
          clearUserDetail()
          clearAuthenticate()
          clearUserDistributor()
          if (getBuyCard()) {
            clearBuyCard()
          }
          Taro.switchTab({ url: '/pages/mine/mine' })
        }
      }
    })
  }

  render() {
    const {
      userInfo: {
        headPic, nickName, sex, birthday, phone
      },
      selectorGender
    } = this.state
    return (
      <View className="userInfoPage">
        <AtList>
          <AtListItem
            title="头像"
            extraThumb={getServerPic(headPic)}
            arrow="right"
            onClick={this.modifyAvatar}
          />
          <AtListItem
            title="昵称"
            extraText={nickName}
            arrow="right"
            onClick={() => {
              navToPage(`/pages/userInfo/modifyName?name=${nickName}`)
            }}
          />
          <Picker
            mode="selector"
            range={selectorGender}
            value={sex}
            onChange={e => this.infoChange(e, 'sex')}
          >
            <AtListItem title="性别" extraText={sex == 1 ? '男' : '女'} arrow="right" />
          </Picker>
          <Picker
            mode="date"
            onChange={e => this.infoChange(e, 'birthday')}
          >
            <AtListItem title="生日" extraText={birthday || '--'} arrow="right" />
          </Picker>
          <AtListItem title="绑定手机号" extraText={phone} arrow="right" />
          <View className="exit">
            <AtListItem
              title="储值支付密码"
              extraText="修改"
              onClick={() => {
                navToPage('/package/storedMoney/modifyPassWord/modifyPassWord')
              }}
            />
          </View>
          <View className="exit">
            <AtListItem
              title="登录"
              extraText="退出登录"
              onClick={this.dropOut}
            />
          </View>
        </AtList>
        <Button
          hoverClass="activeBtn"
          className="saveBtn"
          onClick={this.onSubmit}
        >
          保存
        </Button>
        <AtMessage />
      </View>
    )
  }
}
