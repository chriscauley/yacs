import Simulation, { DEFAULTS } from './simulation'
import ConfigHook from '@unrest/react-config-hook'

export const schema = {
  type: 'object',
  properties: {
    people: { type: 'integer' },
    infected: { type: 'integer' },
    lethality: { type: 'number' },
    duration: { type: 'integer' },
    size: { type: 'integer' },
    radius: { type: 'integer' },
    dt: { type: 'number' },
  },
}

const actions = {
  onSave: (store) => store.actions.newSimulation(),
  stop: (store) => {
    store.state.simulation.stop()
    store.actions.step()
  },
  start: (store) => {
    store.state.simulation.start()
    store.actions.step()
  },
  newSimulation(store) {
    if (store.state.simulation) {
      store.state.simulation.stop()
    }
    const simulation = new Simulation(store.state.formData)
    simulation.start(store)
    store.setState({ step: 0, simulation })
  },
  step(store) {
    // this is just here to trigger reflow in react
    store.setState({ step: store.state.step + 1 })
  },
}

export default ConfigHook('simulation', {
  initial: { formData: DEFAULTS },
  schema,
  actions,
})
