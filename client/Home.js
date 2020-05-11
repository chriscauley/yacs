import React from 'react'
import withSimulation from './withSimulation'
import withStats from './withStats'
import { VictoryStack, VictoryArea } from 'victory'
import { FILLS } from './sprite'
import css from '@unrest/css'
const ref = React.createRef(null)

const stat_order = ['dead', 'infected', 'recovered', 'healthy']
const colorScale = stat_order.map((c) => FILLS[c])

const SimulationControls = withSimulation((props) => {
  const { simulation, actions } = props.config
  if (!simulation) {
    return (
      <button className={css.button()} onClick={actions.newSimulation}>
        Start Simulation
      </button>
    )
  }
  return (
    <div>
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
  )
})

const SimulationStats = withStats((props) => {
  const { stats } = props
  if (!stats.history || stats.history.length === 0) {
    return <SimulationControls />
  }
  const x_max = Math.max(stats.history.length, 50)
  return (
    <div>
      <div className="mb-4">
        <SimulationControls />
        {stat_order.map((name) => (
          <div key={name}>
            {name}: {stats.last[name]}
          </div>
        ))}
      </div>
      <div style={{ width: 300 }}>
        {x_max > 0 && (
          <VictoryStack colorScale={colorScale} padding={0}>
            {stat_order.map((name) => (
              <VictoryArea key={name} data={stats[name]} />
            ))}
          </VictoryStack>
        )}
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
    <div className="flex -mx-3">
      <div className="w-1/2 p-4">
        <SimulationStats />
      </div>
      <div className="w-1/2 p-4">
        <SimulationCanvas />
      </div>
    </div>
  )
}
