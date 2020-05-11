import React from 'react'
import globalHook from 'use-global-hook'

const actions = {
  setState(store, stats) {
    store.setState(stats)
  },
}

const makeHook = globalHook(React, {}, actions)
export default (Component) => (props) => {
  const [state, actions] = makeHook()
  return <Component stats={state} setStats={actions.setState} {...props} />
}
