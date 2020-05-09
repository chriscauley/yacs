import Simulation, { DEFAULTS } from './simulation'
import ConfigHook from './ConfigHook'

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
  onSave(store, formData) {
    if (store.state.simulation) {
      store.state.simulation.stop()
    }
    const simulation = new Simulation(formData)
    simulation.animate()
    store.setState({ step: 0, simulation })
    window.INTERVAL = setInterval(() => store.actions.step(), 10)
  },
  step(store) {
    store.state.simulation.step()
    store.setState({ step: store.state.step + 1 })
  },
}

export default ConfigHook('simulation', {
  initial: DEFAULTS,
  schema,
  actions,
})
