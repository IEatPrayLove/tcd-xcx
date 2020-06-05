import Taro from "@tarojs/taro";
import * as config from "../config/baseUrl";
import {noConsole, IP} from "../config/baseUrl";
import {checkNetWorkStatus, getAuthenticate, hideLoading, showToast} from "./utils";

const request_data = {
  platform: "wap",
  rent_mode: 2,
};

// 获取本地缓存中的token,如果不存在,则说名还没有登录过,需要登录
function buildAuthorization(url) {
  // 登录
  if (config.GET_TOKEN_URL.indexOf(url) > -1) {
    return "Basic d2ViX2FwcDo=";
  }
  const tokenVal = getAuthenticate();
  return (tokenVal) ? `Bearer ${tokenVal.access_token}` : "";
}

/**
 * get请求
 * @param url
 * @param options
 * @returns {Object}
 */
export function $get(url, options) {
  return request(url, {...options, method: "GET"});
}

/**
 * post请求
 * @param url
 * @param options
 * @returns {Object}
 */
export function $post(url, options) {
  return request(url, {...options, method: "POST"});
}

/**
 * put请求
 * @param url
 * @param options
 * @returns {Object}
 */
export function $put(url, options) {
  return request(url, {...options, method: "PUT"});
}

/**
 * delete请求
 * @param url
 * @param options
 * @returns {Object}
 */
export function $delete(url, options) {
  return request(url, {...options, method: "DELETE"});
}

//公用底层接口请求封装
export default function request(url, options = {method: "GET", data: {}}) {
  if (!noConsole) {
    console.log(`${new Date().toLocaleString()}【 M=${url} 】P=${JSON.stringify(options.data)}`);
  }

  // console.log(config.GET_TOKEN_URL.indexOf(url));
  let data = {
    // ...request_data,
    ...options.data
  };
  Array.isArray(options.data) ? data = options.data : null;

  //另一个平台需要数据存入header才可以正确的请求回数据
  // let otherPlatform = false ;
  
  // if(data.headerMessage){
  //   console.log(data)
  //   otherPlatform = true;
  // }else{
  //   otherPlatform = false;
  // }

  return Taro.request({
    url: IP + url,
    // data: data.enterpriseGuid?data.otherdata:data,   
    data:data.otherPlatform?data.otherdata:data,
    // header: {
    //   "Accept": "application/json, text/plain, */*",
    //   "Content-Type": `${config.GET_TOKEN_URL.indexOf(url) > -1 ? "application/x-www-form-urlencoded;" : "application/json; charset=utf-8"}`,
    //   'Cache-Control': 'max-age=60',
    //   'source':'8',   //other plantform header need 
    //   Authorization: buildAuthorization(url),
    // },
    //三目运算符判断使用哪一个平台的header 
    header:data.otherPlatform
    ?{ 
      "Accept": "application/json, text/plain, */*",
      "Content-Type": `${config.GET_TOKEN_URL.indexOf(url) > -1 ? "application/x-www-form-urlencoded;" : "application/json; charset=utf-8"}`,'Cache-Control': 'max-age=60',
      Authorization: buildAuthorization(url),
      'source':'8',   //other plantform header need
      ...data.headerMessage
    }
    :{
      "Accept": "application/json, text/plain, */*",
      "Content-Type": `${config.GET_TOKEN_URL.indexOf(url) > -1 ? "application/x-www-form-urlencoded;" : "application/json; charset=utf-8"}`,
     'Cache-Control': 'max-age=60',
      Authorization: buildAuthorization(url),
     'source':'8',   //other plantform header need  
    },



    method: options.method.toUpperCase(),
  }).then((res) => {
    const {statusCode, data} = res;
    if (statusCode >= 200 && statusCode < 300) {
      if (!noConsole) {
        console.log(`${new Date().toLocaleString()}【 M=${url} 】【接口响应：】`, res.data);
      }
      if (res.errMsg && res.errMsg !== "request:ok") {
        Taro.showToast({
          title: `${res.data.error.message}~` || res.data.error.code,
          icon: "none",
          mask: true,
        });
      }
      res = {...res, ok: true};
      return res;
    } else {
      console.error("网络请求错误，状态码:", statusCode);
      hideLoading();
      switch (statusCode) {
        case 404:
          showToast("接口不存在");
          break;
        case 401:
          //showToast("您还没有登录或者登录已过期");
          //Taro.eventCenter.trigger("needLogin");
          /*setTimeout(() => {
              Taro.showModal({title: "此功能需要授权才能使用，请先去授权", confirmText: "去授权", cancelText: "取消"}).then(res => {
                  if (res.confirm) {
                  }
              });
              //navToPage("/pages/login/login");
          }, 2000);*/
          break;
        case 500:
          showToast("服务器错误");
        default:
        // showToast("接口未知错误");
      }
      // throw new Error(`网络请求错误，状态码${statusCode}`);
    }
    res = {...res, ok: false, statusCode: statusCode};
    // console.log(res);
    return res;
  }).catch(error => {
    console.log(error)
    checkNetWorkStatus();
    const errorCode = error.errMsg || "";//{errMsg: "request:fail timeout"}
    if (errorCode === "request:fail timeout") {
      hideLoading(showToast("请求超时~~"));
    }
    return {ok: false, data: {}};
  });
}
