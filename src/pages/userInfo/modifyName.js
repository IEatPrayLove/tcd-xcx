import Taro, { PureComponent } from '@tarojs/taro'
import {
  Input, Block, Button
} from '@tarojs/components'
import './modifyName.scss'

export default class ModifyName extends PureComponent {
  config = {
    navigationBarTitleText: '修改昵称',
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#ffffff'
  }

  constructor() {
    super()
    this.state = {
      name: ''
    }
  }

  componentDidMount() {
    const { name } = this.$router.params
    this.setState({ name })
  }

  nameInput = ({ detail: { value } }) => {
    this.setState({
      name: value
    })
  }

  handelSave = () => {
    const { name } = this.state
    if (!name) return
    const pages = Taro.getCurrentPages()
    const beforePage = pages[pages.length - 2]
    beforePage.$component.modifyName(name)
  }

  render() {
    const { name } = this.state
    return (
      <Block>
        <Input
          className="nameIpt"
          placeholder="请输入用户名"
          placeholderClass="nameIntPlace"
          value={name}
          onInput={this.nameInput}
          maxLength={16}
        />
        <Button className="saveBtn" onClick={this.handelSave}>保存</Button>
      </Block>
    )
  }
}
