import {Component} from "@tarojs/taro";
import {Button, Image, View} from "@tarojs/components";
import "./login.scss";
import {connect} from "@tarojs/redux";
import {
    formatAttachPath,
    hideLoading,
    loginCompleteGo,
    saveAuthenticate,
    saveLoginCompleteGo,
    showLoading,
    showToast,
    trimAllSpace,
    validatePhone
} from "../../utils/utils";
import {APP_ID} from "../../config/baseUrl";

const COUNT_DOWN = 60;
let countDownInt = null;

/**
 * 手机登录
 */
@connect(({common, index, loading}) => ({
    ajaxLoading: loading,
    userInfo: common.userInfo,
    platFormSettings: common.platFormSettings
}))
class PhoneLogin extends Component {

    config = {
        navigationBarTitleText: "手机登陆",
        navigationBarBackgroundColor: '#ffffff',
        navigationBarTextStyle: 'black'
    };

    constructor() {
        super();
        this.state = {
            mobile: "",
            code: "",
            countDown: COUNT_DOWN
        };
    }

    componentWillMount() {
    }

    componentDidMount() {
    }

    changeMobile = (e) => {
        this.setState({mobile: e.detail.value});
    };

    changeCode = (e) => {
        this.setState({code: e.detail.value});
    };

    //关闭倒计时
    closetCountDown = () => {
        clearInterval(countDownInt);
        this.setState({countDown: COUNT_DOWN});
    };

    //启动定时器
    codeInterTime = () => {
        countDownInt = setInterval(() => {
            this.setState({countDown: this.state.countDown - 1},
                () => {
                    if (this.state.countDown === 0) {
                        this.closetCountDown();
                    }
                });
        }, 1000);
    };

    //发送验证码
    sendMobileValidationCode = () => {
        if (!validatePhone(this.state.mobile)) {
            showToast("手机号码有误，请重新输入");
            return;
        }
        if (0 < this.state.countDown && this.state.countDown < 60) return;
        this.codeInterTime();
        this.props.dispatch({
            type: "common/sendUserMobileCodeAction",
            payload: {
                mobile: this.state.mobile
            },
            callback: ({ok, data}) => {
                if (ok) {
                    showToast("验证码发送成功");
                } else {
                    showToast("验证码发送失败");
                    this.closetCountDown();
                }
            }
        });
    };


    //检验登录数据
    validateData = (showToast) => {
        const {
            mobile,
            code
        } = this.state;
        if (!trimAllSpace(mobile)) {
            showToast && showToast("请输入手机号");
            return false;
        }

        if (!validatePhone(mobile)) {
            showToast && showToast("手机号码有误，请重新输入");
            return false;
        }
        if (trimAllSpace(code).length !== 6) {
            showToast && showToast("验证码输入有错误");
            return false;
        }
        return true;
    };

    //登录
    loginHandle = () => {
        if (!this.validateData(true)) return;
        showLoading();
        this.props.dispatch({
            type: "common/weAppLoginByMobileCodeAction",
            payload: {
                username: this.state.mobile,
                loginType: "mobileCode",
                grant_type: "password",
                code: this.state.code,
                appId: APP_ID
            },
            callback: ({ok, data}) => {
                hideLoading();
                if (ok) {
                    saveAuthenticate(data);
                    if (this.$router.params.page === "distributor") {
                        saveLoginCompleteGo("distributor");
                    }
                    loginCompleteGo(3);
                    // Taro.navigateBack({delta: 3});
                } else {
                    this.closetCountDown();
                    if (data.error_description === "Bad credentials") {
                        showToast("用户名或验证码错误");
                    } else if (data.errno === "ECONNREFUSED") {
                        showToast("登录失败,请与管理员联系");
                    } else {
                        showToast("登录失败,请与管理员联系");
                    }
                }
            }
        });
    };

    render() {

        const {countDown} = this.state;
        const {
            ajaxLoading = {},
            platFormSettings = []
        } = this.props;
        const currentPlatSetting = platFormSettings.length > 0 && platFormSettings[0] || {};
        return (
            <View className="flex-col phone-login-wrap">
                <View className="login-logo flex-col flex-ac">
                    <Image className="logo"
                           src={currentPlatSetting.logo ? formatAttachPath(currentPlatSetting.logo) : ''}
                    />
                    <View className="name">{currentPlatSetting.userName || "--"}</View>
                </View>
                <View className="login-input-wrap">
                    <View className="flex-row flex-ac flex-sb item">
                        <Input className="flex1 input"
                               placeholder={"请输入手机号"}
                               placeholderClass="input-placeholder"
                               maxLength={11}
                               value={this.state.mobile}
                               onInput={this.changeMobile}
                               cursor-spacing={100}
                               type={"number"}
                        />
                        {
                            countDown === COUNT_DOWN ?
                                <Button className="get-code" onClick={this.sendMobileValidationCode}>获取验证码</Button>
                                :
                                <Text className="count-down">（{countDown}）</Text>
                        }
                    </View>
                </View>
                <View className="login-input-wrap">
                    <View className="flex-row flex-ac flex-sb item">
                        <Input className="flex1 input"
                               placeholder={"请输入验证码"}
                               value={this.state.code}
                               placeholderClass="input-placeholder"
                               maxLength={6}
                               onInput={this.changeCode}
                               cursor-spacing={50}
                               type={"number"}
                        />
                    </View>
                </View>
                <Button className="phone-btn"
                        hoverClass="hover"
                        disabled={!this.validateData() || ajaxLoading.effects["common/weAppLoginByMobileCodeAction"] === true}
                        loading={ajaxLoading.effects["common/weAppLoginByMobileCodeAction"] === true}
                        onClick={this.loginHandle}
                >
                    登陆
                </Button>
            </View>
        );
    }
}

export default PhoneLogin;
