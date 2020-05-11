import React from 'react'
import css from '@unrest/css'
import withSimulation from './withSimulation'

const Modal = ({ close }) => (
  <div className={css.modal.outer()}>
    <div className={css.modal.mask()} onClick={close}></div>
    <div className={css.modal.content()}>
      <withSimulation.Form onSuccess={close} />
    </div>
  </div>
)

export default class ConfigForm extends React.Component {
  state = {}
  open = () => this.setState({ open: true })
  close = () => this.setState({ open: false })
  render() {
    if (this.state.open) {
      return <Modal close={this.close} />
    }
    return (
      <div className="fixed bottom-0 left-0 m-4">
        <button className={css.button('text-4xl circle')} onClick={this.open}>
          <i className={css.icon('gear')} />
        </button>
      </div>
    )
  }
}
