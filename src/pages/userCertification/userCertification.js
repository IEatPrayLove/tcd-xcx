import Taro from '@tarojs/taro'
import {
  Block, Button, Image, Text, View, Form, Input
} from '@tarojs/components'
import {
  AtForm, AtInput, AtButton, AtMessage
} from 'taro-ui'
import { connect } from '@tarojs/redux'
import IconFont from '../../components/IconFont/IconFont'
import './userCertification.scss'
import { STATIC_IMG_URL, UPLOAD_URL, SERVER_IMG } from '../../config/baseUrl'
import { TALENT_GRADE_TYPE } from '../../config/config'
import {
  getAuthenticate, hideLoading, navToPage,
  showLoading, notEmpty, isNumber, getUserDetail,
  removeAllSpace, getServerPic
} from '../../utils/utils'

@connect(({ loading: { effects } }) => ({
  effects
}))
export default class UserCertification extends Taro.PureComponent {
  config = {
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black'
  }

  constructor() {
    super()
    this.state = {
      uploadImgUrl: '',
      platformInfo: {}
    }
  }

  componentWillMount() {
    const platformInfo = this.$router.preload
    this.setState({
      platformInfo
    })
    Taro.setNavigationBarTitle({ title: platformInfo.name || '--' })
  }

  uploadImg = () => {
    const root = this
    Taro.chooseImage({
      count: 1,
      success: res => {
        showLoading()
        Taro.uploadFile({
          url: UPLOAD_URL,
          header: { Authorization: `Bearer ${getAuthenticate().access_token}` },
          filePath: res.tempFilePaths[0],
          name: 'file',
          success: response => {
            hideLoading()
            root.setState({
              uploadImgUrl: JSON.parse(response.data).url
            })
          }
        })
      }
    })
  }

  onSubmit = e => {
    const { value } = e.detail
    const {
      uploadImgUrl, platformInfo: { id, islandPromotionExpertAuthDTOS, update },
      platformInfo: { showGradeType }
    } = this.state
    const { dispatch } = this.props
    if (!uploadImgUrl) {
      Taro.atMessage({
        message: '请上传认证图片',
        type: 'error'
      })
      return
    }
    for (const key in value) {
      if (!notEmpty(value[key])) {
        Taro.atMessage({
          message: '请完善认证信息',
          type: 'error'
        })
        return
      }
      if (key === 'fansNum' || key === 'grade') {
        if (!isNumber(value[key])) {
          Taro.atMessage({
            message: `${key === 'fansNum' ? showGradeType === 'FRIENDS' ? '好友数' : '粉丝数' : '等级'}有误，请输入数字！`,
            type: 'error'
          })
          return
        }
      }
    }
    showLoading('提交中')
    if (update) {
      dispatch({
        type: 'mine/updateTalentCertificationAction',
        payload: {
          ...value,
          authPic: uploadImgUrl,
          id: islandPromotionExpertAuthDTOS[0].id
        },
        callback: ({ ok, data: { message } }) => {
          hideLoading()
          ok && Taro.redirectTo({ url: '/pages/certificationResult/certificationResult' })
          message && Taro.atMessage({
            message,
            type: 'warning'
          })
        }
      })
    } else {
      dispatch({
        type: 'mine/addTalentCertificationAction',
        payload: {
          ...value,
          placeId: id,
          authPic: uploadImgUrl
        },
        callback: ({ ok, data: { message } }) => {
          hideLoading()
          ok && Taro.redirectTo({ url: '/pages/certificationResult/certificationResult' })
          message && Taro.atMessage({
            message,
            type: 'warning'
          })
        }
      })
    }
  }

  renderGradeType = () => {
    const { platformInfo: { showGradeType, name } } = this.state
    return (
      <Block>
        {
          showGradeType === 'GRADES'
          && (
            <View className="inputItem flex-row flex-ac">
              <Text className="label">{`${name}粉丝数：`}</Text>
              <Input
                name="fansNum"
                placeholder={`请输入${name}粉丝数`}
                placeholderClass="placeholderStyle"
                type="number"
              />
            </View>
          )
        }
        <View className="inputItem flex-row flex-ac">
          <Text className="label">
            {name}
            {TALENT_GRADE_TYPE[showGradeType].label}
            ：
          </Text>
          <Input
            name={TALENT_GRADE_TYPE[showGradeType].type}
            placeholder={`请输入${name}${TALENT_GRADE_TYPE[showGradeType].label}`}
            placeholderClass="placeholderStyle"
            type="number"
          />
        </View>
      </Block>
    )
  }

  render() {
    const {
      uploadImgUrl, platformInfo: { referencePic, name }
    } = this.state
    const { effects } = this.props
    const { phone, nickName } = getUserDetail()
    return (
      <Block>
        <View className="headerSteps flex-row flex-ac flex-jc">
          <View className="flex-col flex-ac">
            <IconFont value="imgCerPlatform" w={64} h={64} />
            <Text className="stepDes">平台认证</Text>
          </View>
          <Text className="line" />
          <View className="flex-col flex-ac">
            <IconFont value="imgCerCustomer" w={64} h={64} />
            <Text className="stepDes">客服审核</Text>
          </View>
        </View>
        <View className="certification">
          <View className="title">上传图片</View>
          <Text className="description">（禁止盗用他人图片及违禁图片，发现将会冻结达人权益）</Text>
          <View className="uploadImg flex-col flex-ac flex-jc" onClick={this.uploadImg}>
            {
              uploadImgUrl
                ? (<Image src={getServerPic(uploadImgUrl)} mode="aspectFit"/>)
                : (
                  <Block>
                    <IconFont value="icon-xiangji" size={100} color="#F59F2E" />
                    <View className="uploadDes">{`请上传清晰显示${name}用户名、ID和粉丝数的图片`}</View>
                  </Block>
                )
            }
          </View>
          <View className="title">示例</View>
          <Image
            mode="aspectFit"
            src={getServerPic(referencePic)}
            className="example"
            onClick={() => {
              Taro.previewImage({
                urls: [getServerPic(referencePic)]
              })
            }}
          />
        </View>
        <View className="inputCertificates">
          <View className="title">
            认证资料
            <Text>（必须与图片内容相符）</Text>
          </View>
          <Form onSubmit={this.onSubmit}>
            <View className="inputItem flex-row flex-ac">
              <Text className="label">{`${name}名称：`}</Text>
              <Input
                name="placeUserName"
                placeholder={`请输入${name}用户名`}
                placeholderClass="placeholderStyle"
                value={removeAllSpace(name) === '微信' ? nickName : ''}
              />
            </View>
            <View className="inputItem flex-row flex-ac">
              <Text className="label">{`${name}账号：`}</Text>
              <Input
                name="placeUserId"
                placeholder={`请输入${name}用户账号`}
                placeholderClass="placeholderStyle"
                value={removeAllSpace(name) === '微信' ? phone : ''}
              />
            </View>
            { this.renderGradeType() }
            <View className="divider" />
            <View className="submitBtn">
              <Button
                formType="submit"
                hoverClass="active"
              >
                提交
              </Button>
            </View>
          </Form>
        </View>
        <AtMessage />
      </Block>
    )
  }
}
