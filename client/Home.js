import React from 'react'
import withSimulation from './withSimulation'
import { VictoryStack, VictoryArea } from 'victory'
import { FILLS } from './sprite'
import css from '@unrest/css'
const ref = React.createRef(null)

const stat_order = ['dead', 'infected', 'recovered', 'healthy']
const colorScale = stat_order.map((c) => FILLS[c])

const SimulationStats = withSimulation((props) => {
  const { simulation, actions } = props.config
  if (!simulation) {
    return (
      <button className={css.button()} onClick={actions.newSimulation}>
        Start Simulation
      </button>
    )
  }
  if (simulation.stats.length === 0) {
    return null
  }
  const series = stat_order.map((name) => ({
    name,
    data: simulation.stats.map((s, i) => ({
      y: s[name],
      x: i,
    })),
  }))
  const x_max = Math.max(simulation.stats.length, 50)
  return (
    <div className="flex flex-col">
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
      <div className="mb-4">
        {stat_order.map((name) => (
          <div key={name}>
            {name}: {simulation.last_stat[name]}
          </div>
        ))}
      </div>
      <div>
        <VictoryStack
          colorScale={colorScale}
          padding={0}
          maxDomain={{ x: x_max }}
        >
          {series.map((series) => (
            <VictoryArea key={series.name} data={series.data} />
          ))}
        </VictoryStack>
      </div>
    </div>
  )
})

const SimulationCanvas = withSimulation((props) => {
  const { simulation } = props.config
  if (!simulation) {
    return null
  }
  simulation.canvas = ref.current
  return (
    <canvas
      width={simulation.temp_canvas.width}
      height={simulation.temp_canvas.height}
      className="border"
      ref={ref}
    />
  )
})

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
