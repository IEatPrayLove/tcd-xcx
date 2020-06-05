import Taro from '@tarojs/taro'
import { Text } from '@tarojs/components'
import { isFunction } from '../../utils/utils'
import './IconFont.scss'
import './IconImg.scss'

export default function IconFont({
  value, size, color, pr, w, h, mr, onClick, ml
}) {
  if (w || h) {
    const styles = {
      width: Taro.pxTransform(w),
      height: Taro.pxTransform(h),
      'margin-right': Taro.pxTransform(mr),
      'margin-left': Taro.pxTransform(ml)
    }
    return (
      <Text onClick={e => { isFunction(onClick) && onClick(e) }} className={`iconImg ${value}`} style={styles} />
    )
  }
  const styles = {
    'font-size': Taro.pxTransform(size),
    color,
    'padding-right': Taro.pxTransform(pr)
  }
  return (
    <Text onClick={e => { isFunction(onClick) && onClick(e) }} className={`iconfont ${value}`} style={styles} />
  )
}

IconFont.defaultProps = {
  color: '#999999',
  pr: 0,
  mr: 0
}
