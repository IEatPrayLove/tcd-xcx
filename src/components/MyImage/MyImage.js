import Taro from '@tarojs/taro'
import { Image } from '@tarojs/components'

export default class MyImage extends Taro.Component {
  static options = {
    addGlobalClass: true
  }

  static externalClasses = ['my-class']

  constructor(props) {
    super(props)
    // console.log(this.props.src, this.props.errorLoad);
    this.state = {
      src: this.props.src
    }
  }

  onErrorImg = (e) => {
    // console.log(e);
    this.setState({ src: this.props.errorLoad })
  }

  render() {
    return (
      <Image src={this.state.src || this.props.errorLoad}
             className="my-class"
             onError={this.onErrorImg.bind(this)}
      />
    )
  }
}
