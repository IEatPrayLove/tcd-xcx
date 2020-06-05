import Taro, {Component} from "@tarojs/taro";
import {View, Block, Image, Button} from "@tarojs/components";
import "./checkIn.scss";
// import close from "../../images/icons/icon_close_white.png";
import { AtCalendar, AtButton, AtModal, AtModalContent } from "taro-ui";
import {connect} from "@tarojs/redux";
import {showToast} from "../../../utils/utils";

@connect(({loading})=>({
    ajaxLoading: loading
}))
export default class CheckIn extends Taro.Component{
    static options = {
        addGlobalClass: true
    };
    config = {
        navigationBarTitleText: "签到",
    };

    constructor(){
        super();
        this.state = {
            rpVisible:false, //红包弹窗
            checkInModel:1, //1 连续签到  2 累计签到
            checkInDay:0, // 已经签到天数
            signDay:0,// 设置的签到天数
            checkInState:false, //是否签到
            id:'',
            marksDays:[], //已签到日期
            full:0,
            less:0,
            isReceiveHongBao:false, //是否领取红包

            ruleModalVisible:false
        }
    }
    componentDidMount(){
        let checkIn = JSON.parse(this.$router.params.checkIn);
        const marks = checkIn.consumerSignDTO.recordList&&checkIn.consumerSignDTO.recordList.map(ele=>({value:ele.signTime}));
        this.setState({
            checkInModel:checkIn.signModel,
            signDay:checkIn.signDay,
            checkInState:checkIn.consumerSignDTO.isSing,
            id:checkIn.consumerSignDTO.id,
            rpVisible:checkIn.consumerSignDTO.isCanReceiveHongBao,
            marksDays:marks||[],
            full:checkIn.consumerSignDTO.threshold,
            less:checkIn.consumerSignDTO.benefit
        },()=>{
            if(this.state.checkInModel === 1){
                this.setState({
                    checkInDay:checkIn.consumerSignDTO.signDay
                })
            }else {
                this.setState({
                    checkInDay:checkIn.consumerSignDTO.allSignDay
                })
            }
        })
    }
    closeRpModal = () => {
        if(!this.state.isReceiveHongBao){
            this.getRedPackage()
        }
        this.setState({
            rpVisible:false
        })
    };
    checkIn = () => {
        const id = this.state.id;
        this.props.dispatch({
            type:'checkIn/checkInAction',
            payload:{id},
            callback:res => {
                if(res.ok){
                    showToast('签到成功');
                    this.setState({
                        checkInDay:this.state.checkInDay + 1,
                        marksDays:[...this.state.marksDays, {value:res.data.singDate}],
                        checkInState:true,
                    });
                    if(res.data.isCanReceiveHongBao){
                        this.setState({
                            rpVisible:true,
                            full:res.data.threshold,
                            less:res.data.benefit
                        })
                    }
                }else if(res.response){
                    showToast(res.response);
                }else {
                    showToast('签到失败, 请重试!')
                }
            }
        })
    };
    getRedPackage = () => {
        this.props.dispatch({
            type:'checkIn/getRedPackageAction',
            payload:this.state.id,
            callback:res => {
                if(res.ok){
                    this.setState({
                        isReceiveHongBao:true
                    });
                    showToast('领取成功!');
                }else {
                    showToast('领取失败, 请重试!');
                }
            }
        })
    };
    openRule = () => {
        this.setState({
            ruleModalVisible:true
        })
    };
    closeRule = () => {
        this.setState({
            ruleModalVisible:false
        })
    };
    render(){
        const {
            rpVisible,
            checkInModel,
            signDay,
            checkInDay,
            checkInState,
            marksDays,
            isReceiveHongBao,
            ruleModalVisible,
            full,
            less
        } = this.state;
        return(
            <Block>
                <View className="container">
                    <View className="checkHeader flex-col flex-ac flex-jc">
                        <Text className="checkDay">
                            {checkInModel === 1 ?'连续':'累计'}签到{signDay}天
                        </Text>
                        <Text className="checkRule" onClick={this.openRule}>规则</Text>
                        <Image className="checkGift" src={require('../../images/checkIn_gift.png')}/>
                    </View>
                    <AtCalendar marks={marksDays} className="calendar"/>
                </View>
                <View className="checkFooter">
                    <View className="checkIn flex-row flex-ac">
                        <Image className="checkContinuousImg" src={require('../../images/check_continuous.png')} />
                        <View className="checkContinuousTitle flex1">您已{checkInModel === 1 ?'连续':'累计'}签到第<Text style={{color:'#FF623D'}}>{checkInDay}</Text>天</View>
                        {
                            checkInState ? <View className="isSing">已签到</View> :<View
                                className="checkInBtn"
                                onClick={this.checkIn}
                            >立即签到</View>
                        }
                    </View>
                </View>

                {/*红包弹窗*/}
                {
                    rpVisible &&
                    <View className="redPackageModal flex-row flex-ac flex-jc">
                        <View className="rpContainer flex-col flex-ac">
                            <Image className="close" src={close} onClick={this.closeRpModal}/>
                            <Text className="title">恭喜你获得红包</Text>
                            <Text className="amount">满{full}减{less}</Text>
                            <View className={`receiveBtn ${isReceiveHongBao?'notReceive':'receive'}`}
                                  onClick={this.getRedPackage}
                            >{isReceiveHongBao?'已领取':'领取'}</View>
                            {
                                isReceiveHongBao && <Text className="mine">已放入 "我的红包" </Text>
                            }
                        </View>
                    </View>
                }
                {/*规则弹窗*/}
                {
                    ruleModalVisible &&
                    <View className="ruleModal">
                        <View className="ruleContainer">
                            <View className="ruleHeader">
                                活动规则
                            </View>
                            <View className="rule">1.用户连续签到7天，可获得门店满减优惠券。第8天签到则重新开始一个7日轮回，视为首日签到；</View>
                            <View className="rule">2.活动的优惠券具体面额、有效时间以实际到账的优惠券为准；</View>
                            <View className="rule">3.领取的优惠券可在【我的】-【优惠券】列表中查看；</View>
                            <View className="rule">4.活动期间，如发现通过非正常途径获得优惠券，平台有权利最会所得优惠券。</View>
                            <Image className="close" src={close} onClick={this.closeRule}/>
                        </View>
                    </View>
                }
            </Block>
        )
    }
}
