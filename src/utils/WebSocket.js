import Taro from '@tarojs/taro'
import { isFunction } from './utils'
import { WEBSOCKET_PLATFORM } from '../config/baseUrl'

export default class WebSocket {
  task = null;

  /**
   * 初始化websocket
   *
   * @param url socket地址
   * @param accessToken 凭证，不传则只能订阅公共主题
   * @param subscribeTopics 订阅主题组
   * @param callback 回调函数
   */
  connect = (url, accessToken, subscribeTopics, callback, { fail, success } = {}) => {
    if (!this.task) {
      Taro.connectSocket({
        url: `${url}`,
        success: () => {},
        fail: () => {}
      }).then(task => {
        task.onOpen(() => {
          console.log('onOpen')
          task.send({ data: '["CONNECT\\naccept-version:1.1,1.0\\nheart-beat:10000,10000\\n\\n\\u0000"]' })
          this.task = task
          isFunction(success) && success()
        })
        task.onMessage(msg => {
          // console.log('onMessage: ', msg)
          try {
            const data = JSON.parse(JSON.parse(msg.data))
            isFunction(callback) && callback(data)
          } catch (e) {

          }
          // if (msg.data.substr(0, 1) == 'a') {
          //   const receiveStr = JSON.parse(msg.data.substr(1))[0]
          //   const receiveMessage = receiveStr.split('\n')
          //   if (receiveMessage[0] == 'CONNECTED') {
          //     subscribeTopics.forEach(item => {
          //       task.send({ data: `["SUBSCRIBE\\nid:sub-0\\ndestination:${item}\\n\\n\\u0000"]` })
          //     })
          //   }
          //   if (receiveMessage[0] == 'MESSAGE') {
          //     const parseReceiveData = JSON.parse(receiveStr.split('\n\n')[1].replace(/[\\\n\\\r\\\u0000]/g, ''))
          //     if (callback && isFunction(callback)) callback(parseReceiveData)
          //   }
          // }
        })
        task.onError(msg => {
          console.log('connect fail', msg)
          isFunction(fail) && fail()
        })
      })
    }
  }

  /**
   * 关闭链接
   *
   */
  close = () => {
    this.task.close()
  }
}
