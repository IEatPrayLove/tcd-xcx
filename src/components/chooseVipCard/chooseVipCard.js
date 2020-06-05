import Taro, { useEffect, useState } from '@tarojs/taro'
import {
  Text, View
} from '@tarojs/components'
import { useDispatch } from '@tarojs/redux'
import IconFont from '../IconFont/IconFont'
import './chooseVipCard.scss'
import {
  showToast, hideLoading, showLoading
} from '../../utils/utils'
import {
    STATIC_IMG_URL, 
  } from '../../config/baseUrl' 
/**
 * @param cardVisble 是否显示选择弹窗
 * @param payment 支付方式
 * @param onChange 支付方式监听函数
 * @param storeModal 储值卡弹窗
 */
//Payment
export default function VipCard({ cardVisble, alreadyStoredCards = [], openMemberCardList, getOtherPlatformData, selectesCard = {}, enterpriseGuid, openId, wxtoken, selectMemberCard, changeCardVisible ,paypage=false}) {
    const dispatch = useDispatch()

    // //确认会员卡
    // const sureMemberCard = () => {
    //   switchMemberCard()
    // }

    //切换会员卡
    const switchMemberCard= () => {
        const { memberInfoCardGuid } = selectesCard;
        showLoading();
        dispatch({
            type:'otherPlatform/switchCardAction',
            payload:{
            headerMessage:{
                enterpriseGuid, openId, wxtoken,
                'Content-Type':'application/json',
            },
            otherdata:{
                memberInfoCardGuid, 
            },
            otherPlatform: true,
            },
            callback: ({ ok, data }) => {
                if(ok && data.code == 0){
                    changeCardVisible()
                    hideLoading();
                    showToast('选择成功');
                    getOtherPlatformData(0) 
                }else{
                    hideLoading();
                    showToast('选择成功')
                }
            }
        })
    }

    return  (
        <View>
            { 
                cardVisble && (
                    <View className="cardListMask"  onClick={() => {
                        openMemberCardList()
                    }}> 
                        <View className="cardListBox" onClick={e => {
                            e.stopPropagation()
                        }}>
                            <View className="cardHeader flex-row flex-ac flex-sb">
                                <View className="cardCancel cardButton" onClick={() => {
                                    openMemberCardList()
                                }}>取消</View>
                                <View className="cardTitle">请选择会员卡</View>
                                <View className="cardSure cardButton" onClick={() => {
                                    switchMemberCard()
                                }}>确认使用</View>
                            </View>
                            <View className="cardContent">
                                <Swiper
                                    className="storedCardSection"
                                >
                                    {
                                        alreadyStoredCards.map((ele, index) => {
                                            const {
                                                cardLevelName, cardMoney, cardName, cardColour,
                                                cardIcon, systemManagementCardNum, cardLevelNum, cardGuid
                                            } = ele
                                            return (
                                                <SwiperItem
                                                    className="storedCardItem"
                                                    current={0}
                                                    key={index}
                                                >
                                                    <View
                                                        className="flex-col flex-sb item"
                                                        style={ {backgroundImage:`url(${STATIC_IMG_URL}/cardBg/${cardColour}.png)`}}
                                                        // style={cardIcon ? { backgroundImage: cardIcon } : { backgroundColor: cardColour }}
                                                        onClick={() => {
                                                            selectMemberCard(ele)
                                                        }}
                                                    >
                                                        <View className="flex-row flex-sb contentHeader">
                                                            <View className="flex-col flex-sb flex-as avatar">
                                                            <Text>{cardName}</Text>
                                                            <Text className="grade">{cardLevelName} lv{cardLevelNum}</Text>
                                                            </View>
                                                            {
                                                                selectesCard && selectesCard.systemManagementCardNum && selectesCard.systemManagementCardNum == systemManagementCardNum && (
                                                                    <IconFont value="imgHook" h={34} w={34}  className="cardICon"/>
                                                                )
                                                            }
                                                        </View>
                                                        <View className="balanceTitle">储值余额</View>
                                                        <View className="balance">{`￥${cardMoney}`}</View>
                                                        <View className="flex-row flex-sb">
                                                        <Text>{`永久有效 NO.${systemManagementCardNum}`}</Text>
                                                        <Text>{`${index + 1}/${alreadyStoredCards.length}`}</Text>
                                                        </View>
                                                    </View>
                                                </SwiperItem>
                                            )
                                        })
                                    }
                                </Swiper>
                            </View>
                        </View>
                    </View>
                )
            }
        </View>
    )
}