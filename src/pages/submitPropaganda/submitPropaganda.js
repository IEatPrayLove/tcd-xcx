import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Block, Textarea, Button, Text,
  Image
} from '@tarojs/components'
import { connect } from '@tarojs/redux'
import {
  AtImagePicker, AtButton, AtModal, AtModalContent, AtModalAction,
  AtMessage
} from 'taro-ui'
import './submitPropaganda.scss'
import { getAuthenticate, navToPage } from '../../utils/utils'
import { UPLOAD_URL, SERVER_IMG } from '../../config/baseUrl'
import { CHANNEL_EXAMPLE } from '../../config/config'


@connect(({ loading: { effects } }) => ({
  effects
}))
export default class SubmitPropaganda extends PureComponent {
  config = {
    navigationBarTitleText: '提交任务',
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#ffffff'
  }

  constructor() {
    super()
    this.state = {
      imgFiles: [],
      modalVisible: false,
      textVal: '',
      taskExample: [],
      showGradeType: ''
    }
  }

  componentDidMount() {
    const { showGradeType = '' } = this.$router.params
    this.setState({
      showGradeType,
      taskExample: showGradeType ? CHANNEL_EXAMPLE[showGradeType] : []
    })
  }

  onUploadImg = (files, operationType, index) => {
    const { imgFiles } = this.state
    if (operationType === 'remove') {
      const template = JSON.parse(JSON.stringify(imgFiles))
      template.splice(index, 1)
      this.setState({
        imgFiles: template
      })
      return
    }
    Taro.showLoading({
      title: '上传中',
      mask: true
    })
    const uploadList = files.filter(ele => ele.file).map(fileItem => {
      const { file } = fileItem
      if (file) {
        return new Promise((resolve, reject) => {
          Taro.uploadFile({
            url: UPLOAD_URL,
            header: { Authorization: `Bearer ${getAuthenticate().access_token}` },
            filePath: file.path,
            name: 'file',
            success: ({ data }) => {
              if (data) {
                resolve({ url: SERVER_IMG + JSON.parse(data).url, data: JSON.parse(data).url })
              }
            }
          })
        })
      }
    })
    Promise.all(uploadList).then(res => {
      this.setState({
        imgFiles: [...imgFiles, ...res]
      })
      Taro.hideLoading()
    }).catch(() => {
      Taro.atMessage({
        message: '图片上传失败,请重试!',
        type: 'error'
      })
      Taro.hideLoading()
    })
  }

  onSubmit = () => {
    const { textVal, imgFiles } = this.state
    const { params: { id } } = this.$router
    if (!textVal) {
      Taro.atMessage({
        message: '请填写任务说明',
        type: 'error'
      })
      return
    }
    if (imgFiles.length < 3) {
      Taro.atMessage({
        message: '至少上传3张凭证图片',
        type: 'error'
      })
      return
    }
    const promotePic = imgFiles.map(ele => ele.data).join(',')
    this.props.dispatch({
      type: 'propaganda/submitPropagandaAction',
      payload: {
        id,
        taskDescription: textVal,
        promotePic
      },
      callback: ({ ok, data: { message } }) => {
        if (ok) {
          this.setState({
            modalVisible: true
          })
        } else {
          Taro.atMessage({
            message,
            type: 'error'
          })
        }
      }
    })
  }

  render() {
    const {
      imgFiles, modalVisible, textVal, taskExample
    } = this.state
    const {
      effects = {}
    } = this.props
    return (
      <Block>
        <Textarea
          value={textVal}
          onInput={e => {
            this.setState({
              textVal: e.detail.value
            })
          }}
          placeholderClass="placeholderDes"
          className="description"
          placeholder="请输入您的任务说明（100字内）"
          maxlength={100}
        />
        <AtImagePicker
          mode="aspectFit"
          length={3}
          count={6}
          files={imgFiles}
          onChange={this.onUploadImg}
          className="uploadImg"
          showAddBtn={imgFiles.length < 6}
        />
        <View className="exampleWarp">
          <View className="exampleTitle">实例</View>
          {
            taskExample.map((ele, index) => {
              const { label, url } = ele
              return (
                <View className={`example flex-row flex-ac ${index % 2 && 'reverse'}`} key={index}>
                  <Image className="flex-sk" src={url} />
                  <View className="interval" />
                  <View>
                    <View className="step">{index + 1}</View>
                    <Text className="msg">{label}</Text>
                  </View>
                </View>
              )
            })
          }
        </View>
        <Button
          className="submitBtn"
          onClick={this.onSubmit}
          disabled={effects['propaganda/submitPropagandaAction']}
          loading={effects['propaganda/submitPropagandaAction']}
        >
          确认提交
        </Button>
        <AtModal
          isOpened={modalVisible}
          onClose={() => {
            this.setState({
              modalVisible: false
            })
          }}
        >
          <AtModalContent>
            <View className="modalContainer flex-col">
              <Text>提交成功!</Text>
              <Text>3个工作日内会有审核结果，请耐心等待</Text>
            </View>
          </AtModalContent>
          <AtModalAction>
            <Button onClick={() => {
              const { params: { from } } = this.$router
              switch (from) {
                case 'list': Taro.navigateBack(); break
                case 'detail': Taro.navigateBack({ delta: 2 }); break
                default: Taro.navigateBack()
              }
              this.setState({
                modalVisible: false
              })
            }}
            >
              好的
            </Button>
            <Button onClick={() => {
              const { params: { id, from } } = this.$router
              switch (from) {
                case 'list': Taro.redirectTo({ url: `/pages/propagandaDetail/propagandaDetail?id=${id}` }); break
                case 'detail': Taro.navigateBack(); break
                default: Taro.navigateBack()
              }
              this.setState({
                modalVisible: false
              })
            }}
            >
              查看详情
            </Button>
          </AtModalAction>
        </AtModal>
        <AtMessage />
      </Block>
    )
  }
}
