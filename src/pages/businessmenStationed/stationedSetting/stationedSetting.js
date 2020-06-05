import Taro, { PureComponent } from '@tarojs/taro'
import {
  View, Input, Text, Picker, Image, Button, ScrollView
} from '@tarojs/components'
import './stationedSetting.scss'
import {
  AtImagePicker, AtIcon, AtMessage, AtModal, AtModalHeader, AtModalContent, AtModalAction
} from 'taro-ui'
import { connect } from '@tarojs/redux'
import { getAuthenticate, getServerPic, navToPage } from '../../../utils/utils'
import { SERVER_IMG, STATIC_IMG_URL, UPLOAD_URL } from '../../../config/baseUrl'
import { ALL_CITY } from '../../../utils/city'

@connect(({ businessmenStationed }) => ({}))
export default class businessmenStationed extends PureComponent {
  config = {
    navigationBarTitleText: '商家入驻'
  }

  constructor() {
    super()
    this.state = {
      industry: '', // 选择的行业索引
      industryList: [], // 行业列表
      scaleList: [
        { name: '连锁', value: 1, visible: true },
        { name: '单店', value: 2, visible: false }
      ], // 品牌规模
      rangeOptions: [],
      provinceOptions: [], // 省列表
      cityOptions: [], // 市列表
      isImage: false,
      logo: [],
      licenseList: [],
      isExample: false,
      isAgree: false,
      tcdPlatformId: null,
      platformId: '',
      brandName: '',
      industryId: null,
      imageUrl: '',
      userName: '',
      userPhone: '',
      city: [],
      cityText: '',
      licenseNo: '',
      storeNum: null,
      cityList: [],
      setId: '',
      agreementVisible: false
    }
  }

  componentWillMount() {
    this.getBusinessAction()
    this.getPlatformAction()
    this.getTcdPlatformAction()
    const provinceOptions = []
    const cityOptions = []
    const rangeOptions = []
    ALL_CITY.map((ele, index) => {
      ele.level === 1
      && provinceOptions.push({
        value: ele.region_id,
        label: ele.region_name,
        parentId: ele.parentId
      })
    })
    rangeOptions.push(provinceOptions)
    ALL_CITY.map((ele, index) => {
      ele.level === 2
      && ele.parentId === '11' && cityOptions.push({
        value: ele.region_id,
        label: ele.region_name,
        parentId: ele.parentId
      })
    })
    rangeOptions.push(cityOptions)
    this.setState({
      provinceOptions,
      cityOptions,
      rangeOptions
    })
  }

  // 获取平台id
  getTcdPlatformAction = () => {
    this.props.dispatch({
      type: 'businessmenStationed/getTcdPlatformAction',
      callback: res => {
        if (res.ok) {
          this.setState({
            tcdPlatformId: res.data
          })
        }
      }
    })
  }

  // 获取平台id
  getPlatformAction = () => {
    Taro.getStorage({
      key: 'userId'
    }).then(res => {
      this.props.dispatch({
        type: 'businessmenStationed/getPlatformAction',
        payload: {
          userId: res.data
        },
        callback: ({ ok, data }) => {
          if (ok && data.length > 0) {
            this.setState({
              platformId: data[0].id
            }, () => {
              this.stationedRecordInfoAction()
            })
          }
        }
      })
    })
  }

  // 获取入驻信息
  stationedRecordInfoAction = () => {
    const {
      platformId, scaleList, logo, licenseList, rangeOptions, provinceOptions, cityOptions, city
    } = this.state
    this.props.dispatch({
      type: 'businessmenStationed/stationedRecordInfoAction',
      payload: {
        platformId,
        type: 1
      },
      callback: ({ ok, data }) => {
        if (ok) {
          this.setState({
            brandName: data.brandName,
            industryId: data.businessId,
            storeNum: data.merchantNum,
            userName: data.contactName,
            userPhone: data.contactPhone,
            licenseNo: data.businessLicenseNo,
            setId: data.id
          }, () => {
            if (data.brandScale) {
              const scale = JSON.parse(JSON.stringify(scaleList))
              if (data.brandScale === 1) {
                scale[0].visible = true
              } else {
                scale[0].visible = false
              }
              this.setState({
                scaleList: scale
              })
            }
            const logoList = JSON.parse(JSON.stringify(logo))
            const license = JSON.parse(JSON.stringify(licenseList))
            logoList.push({
              data: data.brandLogo,
              url: SERVER_IMG + data.brandLogo
            })
            license.push({
              data: data.businessLicenseUrl,
              url: SERVER_IMG + data.businessLicenseUrl
            })
            this.setState({
              logo: logoList,
              licenseList: license
            })
            const cityList = []
            const rangeList = JSON.parse(JSON.stringify(rangeOptions))
            const cityListIndex = []
            let province
            let cityText
            provinceOptions.map((item, index) => {
              if (item.value === data.province) {
                province = item.label
                cityListIndex.push(index)
                ALL_CITY.map((ele, num) => {
                  ele.level === 2
                  && ele.parentId === data.province && cityList.push({
                    value: ele.region_id,
                    label: ele.region_name,
                    parentId: ele.parentId
                  })
                })
              }
            })
            cityList.map((item, index) => {
              if (item.value === data.city) {
                cityText = item.label
                cityListIndex.push(index)
              }
            })
            const cityWord = province + cityText
            rangeList.splice(1, 1, cityList)
            const cityId = JSON.parse(JSON.stringify(city))
            cityId.push(data.province)
            cityId.push(data.city)
            this.setState({
              cityOptions: cityList,
              rangeOptions: rangeList,
              city: cityId,
              cityText: cityWord,
              cityList: cityListIndex,
              isAgree: true
            })
          })
        }
      }
    })
  }

  // 获取行业列表
  getBusinessAction = () => {
    this.props.dispatch({
      type: 'businessmenStationed/getBusinessAction',
      callback: res => {
        if (res.ok) {
          this.setState({
            industryList: res.data
          }, () => {
            res.data.map((item, index) => {
              if (item.id === this.state.industryId) {
                this.setState({
                  industry: index
                })
              }
            })
          })
        }
      }
    })
  }

  // logo图片上传
  modifyAvatar = (files, operationType, index) => {
    const { logo } = this.state
    if (operationType === 'remove') {
      const template = JSON.parse(JSON.stringify(logo))
      template.splice(index, 1)
      this.setState({
        logo: template
      })
      return
    }
    const root = this
    Taro.uploadFile({
      url: UPLOAD_URL,
      header: { Authorization: `Bearer ${getAuthenticate().access_token}` },
      filePath: files[logo.length].url,
      name: 'file',
      success: ({ data }) => {
        if (data) {
          root.setState({
            logo: [...root.state.logo, { url: SERVER_IMG + JSON.parse(data).url, data: JSON.parse(data).url }]
          })
        }
      }
    })
  }

  // 营业执照上传
  modifyAvatarLicense = (files, operationType, index) => {
    const { licenseList } = this.state
    if (operationType === 'remove') {
      const template = JSON.parse(JSON.stringify(licenseList))
      template.splice(index, 1)
      this.setState({
        licenseList: template
      })
      return
    }
    const root = this
    Taro.uploadFile({
      url: UPLOAD_URL,
      header: { Authorization: `Bearer ${getAuthenticate().access_token}` },
      filePath: files[licenseList.length].url,
      name: 'file',
      success: ({ data }) => {
        if (data) {
          root.setState({
            licenseList: [...root.state.licenseList, { url: SERVER_IMG + JSON.parse(data).url, data: JSON.parse(data).url }]
          })
        }
      }
    })
  }

  showImg = (number, file) => {
    this.setState({
      isImage: true,
      imageUrl: file.data,
      isExample: false
    })
  }

  // 提交
  submitForm = () => {
    const {
      brandName, industryId, tcdPlatformId, scaleList, logo, userName, userPhone, city, licenseList, licenseNo, isAgree, storeNum, platformId, setId
    } = this.state
    let brandScale = null
    scaleList.map((item, index) => {
      if (item.visible === true) {
        if (index === 0) {
          brandScale = 1
        } else {
          brandScale = 2
        }
      }
    })
    if (brandName === '') {
      Taro.atMessage({
        message: '品牌名称不能为空',
        type: 'error'
      })
    } else if (industryId === '') {
      Taro.atMessage({
        message: '所属行业不能为空',
        type: 'error'
      })
    } else if (logo.length === 0) {
      Taro.atMessage({
        message: '品牌logo不能为空',
        type: 'error'
      })
    } else if (userName === '') {
      Taro.atMessage({
        message: '联系人不能为空',
        type: 'error'
      })
    } else if (userPhone === '') {
      Taro.atMessage({
        message: '联系电话不能为空',
        type: 'error'
      })
    } else if (city[0] === '' || city[1] === '') {
      Taro.atMessage({
        message: '省或市不能为空',
        type: 'error'
      })
    } else if (licenseList.length === 0) {
      Taro.atMessage({
        message: '营业执照不能为空',
        type: 'error'
      })
    } else if (licenseNo === '') {
      Taro.atMessage({
        message: '营业执照编码不能为空',
        type: 'error'
      })
    } else if (isAgree) {
      Taro.getStorage({
        key: 'userId'
      }).then(val => {
        this.props.dispatch({
          type: 'businessmenStationed/submitBrandInfoAction',
          payload: {
            tcdPlatformId,
            platFormId: platformId && platformId !== null && platformId !== '' ? platformId : '',
            id: setId,
            brandAndMerchantType: 'MERCHANT',
            brandName, // 品牌名称
            businessId: industryId, // 所属行业
            brandScale,
            merchantNum: storeNum,
            brandLogo: logo[0].data,
            contactName: userName,
            contactPhone: userPhone,
            province: city[0],
            city: city[1],
            businessLicenseUrl: licenseList[0].data,
            businessLicenseNo: licenseNo,
            userId: val.data
          },
          callback: res => {
            if (res.ok) {
              Taro.redirectTo({ url: '/pages/businessmenStationed/stationedSubmit/stationedSubmit' })
            } else {
              Taro.atMessage({
                message: res.data.message,
                type: 'error'
              })
            }
          }
        })
      })
    } else {
      Taro.atMessage({
        message: '请同意认证协议',
        type: 'error'
      })
    }
  }

  render() {
    const {
      industry, industryList, scaleList, logo, isImage, imageUrl, city, isExample, isAgree, brandName, userName, userPhone, rangeOptions, provinceOptions, cityText, licenseList, licenseNo, storeNum, cityList, agreementVisible
    } = this.state
    return (
      <View className="setBox">
        <View className="setForm">
          <View className="setFormItem">
            <View className="setFormLeft">
              <Text>*</Text>
              品牌名称
            </View>
            <View className="setFormRight">
              <Input
                placeholder-class="setInputStyle"
                placeholder="请输入你的品牌名称"
                value={brandName}
                onInput={e => {
                  this.setState({
                    brandName: e.detail.value
                  })
                }}
              />
            </View>
          </View>
          <View className="setFormItem">
            <View className="setFormLeft">
              <Text>*</Text>
              所属行业
            </View>
            <View className="setFormRight">
              <Picker
                mode="selector"
                range={industryList}
                rangeKey="industryName"
                value={industry}
                onChange={e => {
                  this.setState({
                    industry: e.detail.value,
                    industryId: industryList[e.detail.value].id
                  })
                }}
              >
                {
                  industry === '' && <Text>请选择您的所属行业</Text>
                }
                {
                  industry !== '' && <Text className="setFormIndustry">{industryList[industry].industryName}</Text>
                }
              </Picker>
              {/* <View className="setFormDown"> */}
              {/*  <IconFont value="imgDown" w="21" h="12" /> */}
              {/* </View> */}
            </View>
          </View>
          <View className="setFormItemOther">
            <View className="setFormLeft">
              <Text>*</Text>
              品牌规模
            </View>
            <View className="setFormRight">
              <View className="setFormRadio">
                {
                  scaleList && scaleList.map((item, index) => (
                    <View
                      className="setFormRadioItem"
                      key={index}
                      onClick={() => {
                        const list = JSON.parse(JSON.stringify(scaleList))
                        list.map((one, num) => {
                          if (index !== num) {
                            one.visible = false
                          } else {
                            one.visible = true
                          }
                        })
                        this.setState({
                          scaleList: list
                        })
                      }}
                    >
                      {
                        item.visible && <Image src={`${STATIC_IMG_URL}/icon/stationed_radio_check.png`} />
                      }
                      {
                        !item.visible && <Image src={`${STATIC_IMG_URL}/icon/stationed_radio.png`} />
                      }
                      {item.name}
                    </View>
                  ))
                }
              </View>
              {/* { */}
              {/*  scaleList[0].visible === true && ( */}
              {/*  <View className="setFormInput"> */}
              {/*    <Input */}
              {/*      placeholder-class="setInputStyle" */}
              {/*      placeholder="请输入门店数量" */}
              {/*      value={storeNum} */}
              {/*      onInput={e => { */}
              {/*        this.setState({ */}
              {/*          storeNum: e.detail.value */}
              {/*        }) */}
              {/*      }} */}
              {/*    /> */}
              {/*  </View> */}
              {/*  ) */}
              {/* } */}
            </View>
          </View>
          <View className="setFormItemOther">
            <View className="setFormLeft">
              <Text>*</Text>
              品牌Logo
            </View>
            <View className="setFormRight">
              <View className="setFormUpload">
                <AtImagePicker
                  length={1}
                  files={logo}
                  onChange={this.modifyAvatar}
                  className="uploadImg"
                  showAddBtn={logo.length < 2}
                  onImageClick={this.showImg}
                />
              </View>
              <View className="setFormTip">请上传与品牌气质吻合的logo能提高用户进店概率哦。</View>
            </View>
          </View>
          <View className="setFormItem">
            <View className="setFormLeft">
              <Text>*</Text>
              联系人
            </View>
            <View className="setFormRight">
              <Input
                placeholder-class="setInputStyle"
                placeholder="请输入联系人名字"
                value={userName}
                onInput={e => {
                  this.setState({
                    userName: e.detail.value
                  })
                }}
              />
            </View>
          </View>
          <View className="setFormItem">
            <View className="setFormLeft">
              <Text>*</Text>
              联系电话
            </View>
            <View className="setFormRight">
              <Input
                placeholder-class="setInputStyle"
                placeholder="请输入联系电话"
                value={userPhone}
                onInput={e => {
                  this.setState({
                    userPhone: e.detail.value
                  })
                }}
              />
            </View>
          </View>
          <View className="setFormItem">
            <View className="setFormLeft">
              <Text>*</Text>
              所在城市
            </View>
            <View className="setFormRight">
              <Picker
                mode="multiSelector"
                range={rangeOptions}
                rangeKey="label"
                value={cityList}
                onColumnChange={e => {
                  const city = []
                  const range = rangeOptions
                  if (e.detail.column === 0) {
                    ALL_CITY.map((ele, index) => {
                      ele.level === 2
                      && ele.parentId === provinceOptions[e.detail.value].value && city.push({
                        value: ele.region_id,
                        label: ele.region_name,
                        parentId: ele.parentId
                      })
                    })
                    rangeOptions.splice(1, 1, city)
                    this.setState({
                      rangeOptions: range,
                      cityOptions: city
                    })
                  }
                }}
                onChange={e => {
                  let province = null
                  let city = null
                  let cityWord = ''
                  const cityArray = []
                  province = rangeOptions[0][e.detail.value[0]].value
                  cityArray.push(province)
                  city = rangeOptions[1][e.detail.value[1]].value
                  cityArray.push(city)
                  cityWord = rangeOptions[0][e.detail.value[0]].label + rangeOptions[1][e.detail.value[1]].label
                  this.setState({
                    city: cityArray,
                    cityText: cityWord,
                    cityList: e.detail.value
                  })
                }}
              >
                {
                  city.length === 0 && <Text>省-市</Text>
                }
                {
                  city.length !== 0 && <Text className="setFormIndustry">{cityText}</Text>
                }
              </Picker>
            </View>
          </View>
          <View className="setFormItemOther">
            <View className="setFormLeft">
              <Text>*</Text>
              营业执照
            </View>
            <View className="setFormRight">
              <View className="setFormUpload">
                <AtImagePicker
                  length={1}
                  files={licenseList}
                  onChange={this.modifyAvatarLicense}
                  className="uploadImg"
                  showAddBtn={licenseList.length < 2}
                  onImageClick={this.showImg}
                />
              </View>
              <View className="setFormTip">请上传与营业执照支持JPG、JPEG、PNG</View>
              <View
                className="setFormExamples"
                onClick={() => {
                  this.setState({
                    isImage: true,
                    isExample: true
                  })
                }}
              >
                示例
              </View>
            </View>
          </View>
          <View className="setFormItem">
            <View className="setFormLeft">
              <Text>*</Text>
              营业执照编号
            </View>
            <View className="setFormRight">
              <Input
                placeholder-class="setInputStyle"
                placeholder="请输入营业执照编号"
                value={licenseNo}
                onInput={e => {
                  this.setState({
                    licenseNo: e.detail.value
                  })
                }}
              />
            </View>
          </View>
          <View className="agreeRow">
            {
              !isAgree && (
              <Image
                src={`${STATIC_IMG_URL}/icon/stationed_radio.png`}
                onClick={() => {
                  this.setState({
                    isAgree: true
                  })
                }}
              />
              )
            }
            {
              isAgree && (
              <Image
                src={`${STATIC_IMG_URL}/icon/stationed_radio_check.png`}
                onClick={() => {
                  this.setState({
                    isAgree: false
                  })
                }}
              />
              )
            }
            我已经阅读并已同意
            <Text onClick={() => {
              this.setState({
                agreementVisible: true
              })
            }}
            >
              《平台服务协议》
            </Text>
          </View>
          <View className="setFormBtn" onClick={this.submitForm}>确认提交</View>
        </View>
        {
          isImage && (
          <View className="imgModalMask">
            <View className="imgModalBox">
              {
                !isExample && <Image src={getServerPic(imageUrl)} mode="aspectFit" />
              }
              {
                isExample && <Image src={`${STATIC_IMG_URL}/example.png`} mode="aspectFit" />
              }
            </View>
            <View
              className="closeBtn"
              onClick={() => {
                this.setState({
                  isImage: false
                })
              }}
            >
              <AtIcon value="close-circle" size="30" color="#fff" />
            </View>
          </View>
          )
        }
        <AtMessage />
        <AtModal isOpened={agreementVisible}>
          <AtModalHeader>平台商户入驻服务协议</AtModalHeader>
          <AtModalContent>
            <ScrollView className="agreementBox">
              <View>
                <View>一、总则</View>
                <View>
                    1. 1.1《平台本地生活服务平台服务协议》（以下简称本协议）为您（即商户）与成都平台信息技术有限公司（以下简称平台）就平台本地生活服务服务达成的协议。平台在此特别提醒您认真阅读、充分理解本协议。商户应认真阅读、充分理解本协议中各条款，特别涉及免除或者限制平台责任的免责条款，对商户的权利限制的条款，法律适用、争议解决方式的条款。
                </View>
                <View>
                    2. 1.2请您审慎阅读并选择同意或不同意本协议，除非您接受本协议所有条款，否则您无权使用本协议项下相关服务。您的申请、使用、帐号获取和登录等行为表明您自愿接受本协议的全部内容并受其约束，不得以任何理由包括但不限于未能认真阅读本协议等作为纠纷抗辩理由
                </View>
                <View>
                    3. 1.3本协议可由平台随时更新，更新后的协议条款一旦公布即代替原来的协议条款，不再另行个别通知。您可在网站查阅最新版协议条款。在平台修改本协议条款后，如果您不接受修改后的条款，请立即停止使用平台提供的服务，您继续使用平台提供的服务将被视为已接受了修改后的协议。
                </View>
              </View>
              <View>
                <View>二、定义</View>
                <View>
                    1. 2.1平台：是搭建、提供及维护本地生活服务服务信息发布的平台，用户和商户通过平台对订餐、外卖、广告推广等服务达成合意。
                </View>
                <View>
                    2. 2.2用户：是指在平台上发布订餐、外卖、任务接单服务需求、创建任务事项信息的具有完全民事权利能力和行为能力的自然人。
                </View>
                <View>
                    3. 2.3商户：即本协议中的“您”，是指通过平台自主选择接受用户发布的订餐、外卖、推广服务任务信息、完成任务事项的依据中国法律合法成立并有效存续的法人或其他商事主体。
                </View>
              </View>
              <View>
                <View>三、商户的权利义务</View>
                <View>
                    1. 3.1商户应保证其为一家依据中国法律合法成立并有效存续的法人或其他商事主体，能够独立承担法律责任，并具有履行本合同所需一切权利及能力；同时商户应当提供盖章的资质证明复印件，如涉及特殊行业需要特定的资质或许可证等的，商户也应予以提供。前述资料包括但不限于商户营业执照、前置许可证件、外卖商品说明、页面信息文案所需资料（包括图片、商家介绍）等。商户保证提供的文件内容真实有效，不侵犯任何第三方的合法权益，由于信息虚假或不准确造成的一切后果与损失均由商户承担。商户的名称、地址和有效联系方式、许可证等信息发生变化的，商户应在一个工作日内书面或邮件通知平台。由于商户未及时通知，给商户自身及平台造成的一切损失均由商户承担。
                </View>
                <View>
                    2. 3.2商户应向平台提供外卖商品的具体信息和详细说明。商户应保证自身具备提供本合同项下商品及履行本合同项下商户提供商品外卖活动所有必要的资质批文、管理制度及合格人员，送达平台用户的外卖商品与页面描述一致且质量合格。
                </View>
                <View>
                    3. 3.3商户提供的外卖商品应符合国家法律、法规、规章的规定。如因商户外卖商品存在质量或安全问题造成平台用户投诉、索赔、经济损失等相关后果均由商户承担，如平台基于前述情况向消费者先行赔付的，平台有权向商户追偿，追偿方式包括但不限于在结算给商户的相关款项中直接扣除该赔付金额。
                </View>
                <View>
                    4. 3.4商户为平台开辟绿色通道，具体事宜如：商户在接收到平台用户的订单后，应优先处理平台用户的订单，并由商户负责将订单中所述的商品及时送达至平台用户。外卖送达过程采取合理包装及方式，保证送达平台用户商品安全、及时、无污染。
                </View>
                <View>
                    5. 3.5商户不应就在线标注价格之外向平台用户收取任何线下费用。如平台用户所订购商品售罄，经商户与平台用户沟通后，商户可就替代商品线下向用户收取差价部分。
                </View>
                <View>
                    6. 3.6如平台用户要求就餐发票，由商户负责全额提供，平台系统通知商户用户下单信息后，如商户因商品售罄等原因，不能提供的，商户应立即电话通知下单信息的用户和平台，并做好合理的安抚和处理措施，如因此造成平台用户投诉、经济损失等相关后果均由商户承担。
                </View>
                <View>
                    7. 3.7商户应严格按照双方协商签订的活动方案为平台用户提供相应的优惠价格或赠品，不允许出现故意拒不提供的行为，否则由此产生的用户投诉和损失均由商户承担
                </View>
                <View>
                    8. 3.8商户承诺自己在使用平台时不会出现以下违规行为，如因出现以下违规行为导致任何法律后果的发生，由商户自行承担所有法律责任。
                </View>
                <View>
                    9. 3.8.1违反国家法律、法规要求以及各种社会公共利益或公共道德的行为。
                </View>
                <View>
                    10. 3.8.2违反平台相关规定的行为（包括但不限于制造虚假订单、利用系统漏洞获取利润、违规套现、对用户消费欺诈、无故取消订单、无故拒绝配送等）。
                </View>
                <View>
                    11. 3.8.3其他损害平台、用户和其他商户利益的行为。
                </View>
                <View>
                    12. 3.9商户可以通过用户名和密码登陆平台本地生活服务商家后台，商户应对密码安全及通知实施的行为负责，商户不得以任何形式将用户名和密码转让或泄露给第三方。
                </View>
                <View>
                    13. 3.10商户提供的银行账户信息须准确，如发生变更应立即通知平台，否则，由此造成的款项延误等后果均由商户承担。
                </View>
                <View>
                    14. 3.11商户保证经营场所内实际销售价格不得低于商品在线标注价格，且不得唆使或引导平台用户放弃在平台本地生活服务服务，改为其他形式的商户和平台用户直接交易，否则平台有权立即终止合作并要求商户按照协议第六条承担违约责任。
                </View>
                <View>
                    15. 3.12商户同意平台可能会与第三方合作向商户提供相关的网络服务，在此情况下，如该第三方同意承担与平台同等的保护用户隐私的责任，则平台有权将用户的信息资料等提供给该第三方。另外，在不透露单个商户隐私资料的前提下，平台有权对整个商户数据库进行分析并对商户数据库进行商业上的利用。
                </View>
                <View>
                    16. 3.13商户同意平台拥有通过信息推送、平台公示、短信、电话、邮件等形式向您通知告知信息的权利，商户允许平台向其发送商业性电子信息。
                </View>
              </View>
              <View>
                <View>四、平台权利与义务</View>
                <View>
                    1. 4.1平台为商户提供本协议项下约定的平台本地生活服务平台的网络展示，并按照平台约定向商户入驻折扣利率进行商品售卖。
                </View>
                <View>
                    2. 4.2平台为商户在消费群体中做相关宣传介绍并进行相关分享，以提升商户的知名度。商户同意授权平台使用其品牌、LOGO、名称、商标等知识产权。
                </View>
                <View>
                    3. 4.3平台有权对商户拟在平台发布的内容、信息进行审核，必要时可删改。平台有权对不符合法律法规、政策规定的内容或任何侵犯第三方合法权益的内容予以删改或拒绝发布，但甲乙双方确认，平台的前述审核、删改不为平台设置任何义务，也不免除商户根据本协议应承担的责任。
                </View>
                <View>
                    4. 4.4如任何第三方向平台投诉，平台经核实后，有权要求商户配合解决该投诉。如出现不符合法律法规、政策规定或侵犯第三方合法权益的内容的，平台有权在不通知商户的情况下做下线处理。
                </View>
                <View>
                    5. 4.5商户店铺内所售品类如有违反平台经营范围的相关规定或有向消费者私自售卖违禁品的行为，平台有权按照相关规定对商户进行处罚，并举报至相关行政主管部门。
                </View>
                <View>
                    6. 4.6如活动方案中涉及平台承担相应成本费用的内容，则平台应按合同中双方约定的结算方式，定期由平台系统自动结算的方式为商户支付活动期间产生的成本费用。
                </View>
                <View>
                    7. 4.7平台用户退订情形，平台应在收到退订申请后告知商户取消对应外卖订餐项目。商户应根据平台通知做相应的调整。
                </View>
                <View>
                    8. 4.8如商户违反本协议第三条项下约定的义务，平台有权随时停止提供服务，并操作商户商品信息下线。
                </View>
                <View>
                    9. 4.9本协议项下服务终止时，平台有权删除平台本地生活服务上的商户已发布的外卖商品信息，且有权拒绝向商户提供相关信息；平台有权保存商户资质信息、商品信息、交易记录等相关资料。
                </View>
              </View>
              <View>
                <View>五、知识产权</View>
                <View>
                    1. 5.1双方的品牌归各自所有。双方均不可在对方未经授权的情况下使用对方名称、Logo以及涉及相关内容的销售、促销宣传材料及广告、报纸、杂志、宣传单等，如因此产生的所有不良后果及损失违约方全部承担。本协议第4.2条有约定的除外。
                </View>
              </View>
              <View>
                <View>六、食品安全保障</View>
                <View>
                    1. 6.1 商户提供的资质应符合国家相关法律的规定，并且符合发布相关商品的要求，当平台要求提供时可以在24小时内提供资质完成备案，如果因无法提供相关资质导致平台的损失需要由商户承担。
                </View>
                <View>
                    2. 6.2 商户提供的外卖商品应符合国家法律、法规、规章的规定。如因商户外卖商品存在质量或安全问题造成平台用户投诉、索赔、经济损失等相关后果均由商户承担，如平台基于前述情况向消费者先行赔付的，平台有权向商户追偿，追偿方式包括但不限于在结算给商户的相关款项中直接扣除该赔付金额。
                </View>
              </View>
              <View>
                <View>七、违约责任</View>
                <View>
                    1. 7.1任何一方违反本协议所规定的义务导致另一方受到包括但不限于投诉、举报、诉讼或处罚、赔偿等损失，违约方在收到守约方要求纠正其违约行为的书面通知之日，应立即停止其违约的行为，并在10日内赔偿守约方因此受到的所有损失。
                </View>
                <View>
                    2. 7.2本协议任何一方均应对其获得的对方的业务、经营、财务状况和其他保密资料予以严格保密，不得以任何形式向任何第三方披露。如因任何一方未能履行保密义务而给其他方造成任何损失的，应承担赔偿责任。
                </View>
              </View>
              <View>
                <View>八、免责条款</View>
                <View>
                    1. 8.1不论在何种情况下，平台均不对由于互联网正常的设备维护，互联网络连接故障，电脑、通讯或其他系统的故障，电力故障，黑客攻击、病毒侵袭、罢工，劳动争议，暴乱，起义，骚乱，生产力或生产资料不足，火灾，洪水，风暴，爆炸，战争，政府行为，司法行政机关的命令或第三方的不作为而造成的不能服务或延迟服务承担责任。
                </View>
                <View>
                    2. 8.2商户同意自行承担使用网络服务的风险，平台不作任何类型的担保，包括但不限于：不担保服务一定能满足商户的要求；不担保服务不会受中断，对服务的及时性，安全性，出错发生不担保；对在平台上以及第三方合作得到的任何服务或交易进程，不作担保；对平台服务所涉及的技术及信息的有效性、准确性、正确性、可靠性、稳定性、完整性和及时性不作出任何承诺和保证；不担保平台服务的适用性没有错误或疏漏。
                </View>
              </View>
              <View>
                <View>九、争议解决</View>
                <View>1. 9.1本协议的订立、执行和解释及争议的解决均应适用中华人民共和国法律。</View>
                <View>2. 9.2就本协议内容或执行发生任何争议，应友好协商解决。协商不成时，均可向被告所在地的有管辖权的法院诉讼解决。</View>
              </View>
              {/* </View> */}
            </ScrollView>
          </AtModalContent>
          <AtModalAction>
            <Button onClick={() => {
              this.setState({
                agreementVisible: false
              })
            }}
            >
              确定
            </Button>
          </AtModalAction>
        </AtModal>
      </View>
    )
  }
}
