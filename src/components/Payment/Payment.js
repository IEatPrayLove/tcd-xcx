import Taro, { useEffect, useState, showLoading, hideLoading, setStorage } from '@tarojs/taro'
import {
  Button, Text, View, Input, ScrollView
} from '@tarojs/components'
import { useDispatch } from '@tarojs/redux'
import {
  AtActionSheet, AtIcon,
  AtModal, AtModalAction, AtModalContent, AtModalHeader
} from 'taro-ui'
import { PAY_BALANCE, PAY_WECHAT, PAY_STORED } from '../../config/config'
import IconFont from '../IconFont/IconFont'
import './Payment.scss'
import { getUserMemberInfo } from '../../utils/api'
import {
  getPlatFormInfo, getUserDetail, objNotNull, showToast, formatCurrency
} from '../../utils/utils'
import { PLATFORM_ID } from '../../config/baseUrl'
/**
 * @param paymentAmount 支付总金额
 * @param payment 支付方式
 * @param onChange 支付方式监听函数
 * @param storeModal 储值卡弹窗
 */
export default function Payment({
  paymentAmount = 0, payment = PAY_WECHAT, onChange, createOrder, payBoxVisible, otherwxtoken, otherstate=null, otheropenId, otherenterpriseGuid, orderSn = null,
}) {
  const dispatch = useDispatch()
  const [balance, setBalance] = useState(0) // 用户余额
  const [passwordModal, setPasswordModal] = useState(false) // 密码弹窗
  const [storedCards, setStoredCards] = useState([]) // 用户储值卡
  const [userPayInfo, setUserPayInfo] = useState([]) //  用户支付方式
  // const [storedModal, setStoredModal] = useState(false) // 储值卡选择弹窗控制
  const [password, setPassword] = useState('');
  const [passwordArr,setPasswordArr] = useState([])   //数组
  const [cardContainer, setCardContainer] = useState({ // 储值卡选择与确认选择
    selected: {}, temporary: {}
  })
  const translateCardList = (cardlist,memberInfo,unPayList)=>{
    const data = {
      memberCardListRespDTOs :cardlist,
      memberInfoDTO:memberInfo,
      storeNoOpenCardListRespDTOs:unPayList
    }
    return data;
  }
  
    
  useEffect(() => {
    const { enterpriseGuid } = getPlatFormInfo()
    const { phone } = getUserDetail()
    // 获取用户余额
    getUserMemberInfo().then(({ ok, data }) => {
      if (ok) setBalance(data.amount)
    })
    console.log(paymentAmount)
    // 获取用户储值卡列表
    if(otherstate){
      showLoading();
      dispatch({
        type:'otherPlatform/getOtherPlatformGoodsAction',    //otherPlatform/getMemberCardAction  common/getOtherPlatformGoodsAction
        payload:{
          headerMessage:{
            enterpriseGuid:otherenterpriseGuid,
            wxtoken:otherwxtoken,
            openId:otheropenId
          },
          otherdata:{
            // orderGuid :orderSn,
            wxPermission:1
          },
          otherPlatform : true,  
        },
        callback:({ok,data})=>{
          if(ok&&data.code==0){
            const{cardList} = data.tdata
            const selectedCard = cardList.filter(item=>item.uck==1);
            const unSelectCard = cardList.filter(item=>item.uck==0)
            dispatch({    //请求会员数据
              type:'otherPlatform/otherMemberMesAction',
              payload:{
                headerMessage:{
                  enterpriseGuid:otherenterpriseGuid,
                  wxtoken:otherwxtoken,
                  openId:otheropenId,
                },
                otherdata:{   
                  enterpriseGuid:otherenterpriseGuid,
                  phoneNumOrOpenid:otheropenId},
                otherPlatform:true,
              },
              callback:({ok,data})=>{
                hideLoading();
                if(ok  && data.code == 0){
                  const memberInfo = data.tdata;
                  /**
                   * selectedCard 掌控者选中的会员卡 uck ==> 1
                   * list  筛选出余额足够支付的会员卡 
                   * newdata 将从掌控者取得的数据 转换为我们的这边的数据结构 之后的数据
                   */
                  //渲染卡的列表
                  const list = selectedCard.filter(item => item.cardMoney > paymentAmount);  //选中的会员卡之中，余额足够支付的卡片;
                  const unpayList = selectedCard.filter(item => item.cardMoney < paymentAmount) ;
                  unpayList.push(...unSelectCard);
                  const newdata = translateCardList(selectedCard,memberInfo,unpayList)//   若需要不显示余额不足的会员卡，将这里的 selectedCard 改为list 即刻;                 
                  setStoredCards(newdata);      
                  if (list.length > 0) {
                    onChange(PAY_STORED);                    
                    setCardContainer(prevState => ({
                      ...prevState,
                      temporary: list[0],
                      selected: list[0]
                    }))
                  } else {
                    onChange(PAY_WECHAT)
                  }
                }
              }
            })
          }else{
            hideLoading();
            showToast("支付失败")
          }
        }
      })
    }else{
      dispatch({
        type: 'storedMoney/getStoredCardForPhoneAction',
        payload: {
          platformId: PLATFORM_ID,
          enterpriseGuid,
          phone
        },
        callback: ({ ok, data }) => {
          if (ok) {
            console.log('70=>>>>>',data);
            setStoredCards(data)
            const { memberCardListRespDTOs = [] } = data
            const list = memberCardListRespDTOs.filter(item => item.cardMoney > paymentAmount)
            if (list.length > 0) {
              onChange(PAY_STORED)
              setCardContainer(prevState => ({
                ...prevState,
                temporary: list[0],
                selected: list[0]
              }))
            } else {
              onChange(PAY_WECHAT)
            }
          }
        }
      })
    
    }
    dispatch({
      type: 'storedMoney/getUserPayInfoSettingAction',
      payload:{
        platformId: PLATFORM_ID,
      },
      callback: ({ok, data})=>{
        if(ok){
          let payInfo = [];
          if([1, 3, 5, 7].includes(data.supportPayWay))payInfo.push(1);
          if([2, 3, 6, 7].includes(data.supportPayWay))payInfo.push(2);
          if([4, 5, 6, 7].includes(data.supportPayWay))payInfo.push(4);
          setUserPayInfo(payInfo);
        }
      }
    })
    
    Taro.eventCenter.on('openPasswordModal', res => {
      setPasswordModal(res)
    })
    return () => Taro.eventCenter.off('openPasswordModal')
  }, [])
  // 选择未余额支付时，支付金额改变，并支付金额大于余额，自动选中微信支付
  if (paymentAmount > balance && payment === PAY_BALANCE) onChange(PAY_WECHAT)

  if (cardContainer.selected && cardContainer.selected.cardMoney < paymentAmount) {
    setCardContainer({
      temporary: {},
      selected: {}
    })
    onChange(PAY_WECHAT)
  }
  // // 确认选择储值卡
  // const confirmCard = () => {
  //   if (objNotNull(cardContainer.temporary)) {
  //     setCardContainer(prevState => ({
  //       ...prevState,
  //       selected: prevState.temporary
  //     }))
  //     // setStoredModal(false)
  //     onChange(PAY_STORED)
  //   }
  // }
  // // 打开储值卡选择弹窗
  // const openCardModal = () => {
  //   // setStoredModal(true)
  // }
  // // 关闭储值卡选择弹窗
  // const closeCardModal = () => {
  //   // setStoredModal(false)
  //   setCardContainer(prevState => ({
  //     ...prevState,
  //     temporary: prevState.selected
  //   }))
  // }
  // 选择支付的储值卡
  const selectPayCard = card => {
    const { cardMoney } = card
    if (cardMoney >= paymentAmount) {
      setCardContainer(prevState => ({
        ...prevState,
        temporary: card,
        selected: card
      }))
    }
  }
  const inputPassword = ({ detail: { value } }) => {
    console.log(value);
    setPassword(value)
    setPasswordArr(value.split(''))
  }
  const closePasswordModal = () => {
    setPasswordModal(false)
    setPassword('')
    setPasswordArr([])
  }
  const confirmPassword = () => {
    if (!password) {
      showToast('请输入正确的密码格式！')
      return
    }
    const { memberInfoDTO: { memberInfoGuid } } = storedCards
    const { selected: { memberInfoCardGuid } } = cardContainer
    setPasswordModal(false);
    createOrder({
      memberInfoGuid,
      payPassword: password,
      memberInfoCardGuid
    })
  }
  // const { selected } = cardContainer;
  const { memberCardListRespDTOs = [] } = storedCards
  const { isStorePay = true, closePayment } = this.props;
  return (
    <AtActionSheet isOpened={payBoxVisible}>
      <View className="payBox">
        <View className="payTitle">
          支付方式
          <View
            className="closeButton"
            onClick={() => closePayment()}
          >
            <AtIcon value="close" size="18" color="#999" />
          </View>
        </View>
        <View className="payMoney">
          <Text>￥</Text>
          {formatCurrency(paymentAmount)}
        </View>
        <View className="buyWay">
          {
            userPayInfo.includes(4) && isStorePay && memberCardListRespDTOs && memberCardListRespDTOs.length > 0 && (
              <View
                className="way flex-row flex-ac"
                onClick={() => {
                  if(objNotNull(cardContainer.selected)){
                    onChange(PAY_STORED)
                  }else{
                    showToast("余额不足,请使用其余支付方式");
                  }
                }}
              >
                <IconFont value="imgStoredPay" h={30} w={46} mr={20} />
                <Text className="flex1">储值余额支付</Text>
                {/* imgCheck */}
                {payment === PAY_STORED ? (<IconFont value="imgArrowOrange" h={34} w={34} />) : (<IconFont value="imgCheck" h={34} w={34} />)}
              </View>
            )
          }
          {( 
          <ScrollView
            scrollX
            className="storeCard"
          >{
            console.log(userPayInfo.includes(4),memberCardListRespDTOs)
          }
            { userPayInfo.includes(4) && 
              memberCardListRespDTOs.map((ele, index) => {
                const { cardName, cardMoney, cardGuid } = ele
                const { temporary: { cardGuid: temporaryGuid } = {} } = cardContainer
                const active = cardGuid === temporaryGuid
                return (
                  <View
                    className={active ? 'activeCard cardBox' : 'notActiveCard cardBox'}
                    key={index}
                    onClick={() => selectPayCard(ele)}
                  >
                    <View className="cardName">{cardName}</View>
                    <View className="flex-row flex-sb flex-ac">
                      {paymentAmount > cardMoney ? (
                        <View className="flex-row flex-ac">
                          <View className="cardMoneyTitle">余额不足</View>
                        </View>
                      ) : (
                        <View className="flex-row flex-ac">
                          <View className="cardMoneyTitle">余额</View>
                          <View className="cardMoney">{`￥${cardMoney}`}</View>
                        </View>
                      )}
                      <IconFont value={active ? 'imgStoredRechargeYes' : 'imgStoredRechargeNo'} h={25} w={25} />
                    </View>
                  </View>
                )
              })
            }
          </ScrollView>)
          }
         

          {/* 余额支付 */}
          {!otherstate&&
            ( <View
              className={`way flex-row flex-ac ${balance < paymentAmount && 'banBalance'}`}
              onClick={() => {
                if (balance < paymentAmount) return
                onChange(PAY_BALANCE)
              }}
            >
              <IconFont value="imgPayPacket2" h={34} w={34} mr={20} />
              <Text className="flex1">{`收益余额支付（余额￥${balance}）`}</Text>
              {payment === PAY_BALANCE ? (<IconFont value="imgArrowOrange" h={34} w={34} />) : (<IconFont value="imgCheck" h={34} w={34} />)}
              {balance < paymentAmount && <Text>余额不足</Text>}
            </View>)
          }
         

          {/* 微信支付 */}
          <View
            className="way flex-row flex-ac"
            onClick={() => onChange(PAY_WECHAT)}
          >
            <IconFont value="imgPayWechat" h={30} w={35} mr={20} />
            <Text className="flex1">微信零钱</Text>
            {payment === PAY_WECHAT ? (<IconFont value="imgArrowOrange" h={34} w={34} />) : (<IconFont value="imgCheck" h={34} w={34} />)}
          </View>
          {/* {storedModal && ( */}
          {/* <View className="storedModal" onTouchMove={e => e.stopPropagation()}> */}
          {/*  <View className="modalContainer"> */}
          {/*    {memberCardListRespDTOs.map((ele, index) => { */}
          {/*      const { cardName, cardMoney, cardGuid } = ele */}
          {/*      const { temporary: { cardGuid: temporaryGuid } = {} } = cardContainer */}
          {/*      const active = cardGuid === temporaryGuid */}
          {/*      return ( */}
          {/*        <View */}
          {/*          key={index} */}
          {/*          className="cardItem flex-row flex-ac" */}
          {/*          onClick={() => selectPayCard(ele)} */}
          {/*        > */}
          {/*          <IconFont value={active ? 'imgChooseStoredCard' : 'imgNotChooseStoredCard'} h={30} w={40} /> */}
          {/*          <View className="flex-col cardBalance flex1"> */}
          {/*            <Text>{cardName}</Text> */}
          {/*            <Text>{paymentAmount > cardMoney ? '余额不足' : `余额￥${cardMoney}`}</Text> */}
          {/*          </View> */}
          {/*          <View className={active ? 'active' : 'notActive'} /> */}
          {/*        </View> */}
          {/*      ) */}
          {/*    })} */}
          {/*    <View className="operate flex-row flex-sb"> */}
          {/*      <View onClick={closeCardModal}>取消</View> */}
          {/*      <View onClick={confirmCard}>确认</View> */}
          {/*    </View> */}
          {/*  </View> */}
          {/* </View> */}
          {/* )} */}
          {/* 密码输入框 */}
          <AtModal
            isOpened={passwordModal}
            className="passwordModal"
          >
            <AtModalHeader>请输入密码</AtModalHeader>
            <AtModalContent>
              <Input
                password
                placeholder="请输入密码"
                value={password}
                onInput={inputPassword}
                style={{ textAlign: 'center' }}
              />
        
         


            </AtModalContent>
            <AtModalAction>
              <Button onClick={() => {
                setPassword('')
                setPasswordArr([])
                closePasswordModal()
              }}
              >
                取消
              </Button>
              <Button onClick={() => {
                setPassword('')
                setPasswordArr([])
                confirmPassword()
              }}
              >
                确定
              </Button>
            </AtModalAction>
          </AtModal>
          {
            // passwordModal ? 
            // <View className="dialog">
            //   <View className="input_main">
            //     <View className="input_title">
            //       <Text>密码</Text>
            //     </View>
            //     <View className="write-title">请输入密码</View>
            //     <View className="input_row">
            //       {
            //         [0,1,2,3,4,5].map((item,index) => {
            //           return (
            //             <View key={index} className="pwd_item">
            //               {
            //                 this.state.pwdVal.length>index ? <Text className="pwd_itemtext"></Text> : null
            //               }
            //             </View>
            //           )
            //         })
            //       }
            //     </View>
            //     <Input focus={this.state.payFocus} password type="number" maxLength="6" onInput={this.inputPwd} className="input_control"></Input>
            //   </View>
            //   <View className='btn_row'>
            //     <Button onClick={() => {
            //       setPassword('')
            //       setPasswordArr([])
            //       closePasswordModal()
            //     }}
            //     >
            //       取消
            //     </Button>
            //     <Button onClick={() => {
            //       setPassword('')
            //       setPasswordArr([])
            //       confirmPassword()
            //     }}
            //     >
            //       确定
            //     </Button>
            //   </View>              
            // </View> 
            // : null
          }



        </View>
        <Button
          className="pay-btn"
          hoverClass="hover"
          // onClick={this.saveOrder.bind(this)}
          open-type="getUserInfo"
          onGetUserInfo={this.props.getUserInfo}
        >
          {`${payment === PAY_WECHAT ? '微信' : payment === PAY_STORED ? '储值' : '余额'}支付`}
        </Button>
      </View>
    </AtActionSheet>
  )
}
