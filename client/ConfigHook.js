import React from 'react'
import globalHook from 'use-global-hook'
import Storage from '@unrest/storage'
import Form from '@unrest/react-jsonschema-form'

class ConfigForm extends React.Component {
  state = {}
  onSubmit = (formData) => this.props.config.actions.save(formData)
  onChange = (formData) => this.setState({ formData })
  render() {
    const { config, ...props } = this.props
    const { schema, uiSchema, formData } = config
    return (
      <Form
        formData={this.state.formData || formData}
        schema={schema}
        uiSchema={uiSchema}
        onSubmit={this.onSubmit}
        onChange={this.onChange}
        {...props}
      />
    )
  }
}

export default (name, { initial, schema, uiSchema, actions }) => {
  const storage = new Storage('app_config__' + name)
  const base_actions = {
    save: (store, formData) => {
      storage.set('formData', formData)
      store.setState({ formData })
      store.actions.onSave(formData)
    },
    onSave() {},
  }
  const makeHook = globalHook(
    React,
    { formData: storage.get('formData') || initial },
    { ...base_actions, ...actions },
  )

  const connect = (Component, { propName = 'config' } = {}) => {
    return function ConfigProvider(props) {
      const [state, actions] = makeHook()
      const connectedProps = {
        ...props,
        [propName]: {
          schema,
          uiSchema,
          ...state,
          actions,
        },
      }
      return <Component {...connectedProps} />
    }
  }

  connect.Form = connect(ConfigForm)

  return connect
}
