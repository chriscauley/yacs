import React from 'react'
import withSimulation from './withSimulation'
import withStats from './withStats'
import css from '@unrest/css'
const ref = React.createRef(null)

const stat_order = ['infected', 'dead', 'recovered', 'shelter', 'healthy']

const SimulationControls = withSimulation((props) => {
  const { simulation, actions } = props.config
  if (!simulation) {
    actions.newSimulation()
    return (
      <button className={css.button()} onClick={actions.newSimulation}>
        Start Simulation
      </button>
    )
  }
  return (
    <div>
      <div className="mb-2">
        {simulation.playing ? (
          <button className={css.button()} onClick={actions.stop}>
            <i className={css.icon('pause')} /> Pause Simulation
          </button>
        ) : (
          <button className={css.button()} onClick={actions.start}>
            <i className={css.icon('play')} /> Unpause Simulation
          </button>
        )}
      </div>
      <button className={css.button()} onClick={actions.newSimulation}>
        <i className={css.icon('refresh')} /> Restart Simulation
      </button>
    </div>
  )
})

const SimulationStats = withStats((props) => {
  const { stats } = props
  if (!stats.history || stats.history.length === 0) {
    return <SimulationControls />
  }
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex">
        <SimulationControls />
        <div className="ml-4">
          {stat_order.map((name) => (
            <div key={name}>
              {name}: {stats.last[name]}
            </div>
          ))}
        </div>
      </div>
      <div className="relative">
        <div
          className="absolute border-b-4 border-red-500 z-10 w-full"
          style={{ top: '80%' }}
        />
        <img src={window.daturl} style={{ width: '100%', height: 400 }} />
      </div>
    </div>
  )
})

const SimulationCanvas = withStats(
  withSimulation((props) => {
    const { simulation } = props.config
    if (!simulation) {
      return null
    }
    simulation.canvas = ref.current
    simulation.setStats = props.setStats
    return (
      <canvas
        width={simulation.temp_canvas.width}
        height={simulation.temp_canvas.height}
        className="border"
        ref={ref}
      />
    )
  }),
)

export default function Home() {
  return (
    <div className="flex">
      <div className="w-1/2 p-4">
        <SimulationStats />
      </div>
      <div className="w-1/2 p-4">
        <SimulationCanvas />
      </div>
    </div>
  )
}
