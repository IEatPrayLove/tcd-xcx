import Taro, { useState, useEffect } from '@tarojs/taro'
import {
  View, Image, Text, Button, Block
} from '@tarojs/components'
import {
  AtModal, AtModalContent, AtModalAction
} from 'taro-ui'
import { judgeOfficialAccounts } from '../../utils/api'
import './ContactModal.scss'
import { getUserDetail, navToPage } from '../../utils/utils'

const { onfire } = Taro.getApp()

export default function ContactModal() {
  const [visible, setVisible] = useState(false)
  const [btnVisible, setBtnVisible] = useState(false)
  useEffect(() => {
    const { weappUserId } = getUserDetail()
    judgeOfficialAccounts({
      userId: weappUserId
    }).then(({ ok, data }) => {
      if (ok) {
        setBtnVisible(!data)
      } else {
        setBtnVisible(true)
      }
    })
    onfire.on('WebViewMessage', message => {
      setVisible(message)
    })
    return () => {
      onfire.un('WebViewMessage')
    }
  }, [])
  const onClose = () => {
    setVisible(false)
  }
  return (
    <Block>
      {/* {
        btnVisible && (
          <Button
            className="attentionBtn"
            onClick={() => {
              navToPage('/pages/activePage/activePage?page=account')
            }}
          >
            关注公众号
          </Button>
        )
      } */}
      <AtModal
        isOpened={visible}
        closeOnClickOverlay={false}
      >
        <AtModalContent>
          <View className="accountsMsg">
            <View>点击按钮，发送“888”</View>
            <View>关注公众号及时获取最新动态</View>
          </View>
        </AtModalContent>
        <AtModalAction>
          <Button onClick={onClose}>
            关闭
          </Button>
          <Button openType="contact" onClick={onClose}>
            确定
          </Button>
        </AtModalAction>
      </AtModal>
    </Block>
  )
}
