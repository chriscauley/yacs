import React from 'react'
import withSimulation from './withSimulation'
import { VictoryStack, VictoryArea } from 'victory'
import { FILLS } from './sprite'
import css from '@unrest/css'
const ref = React.createRef(null)

const stat_order = ['dead', 'infected', 'recovered', 'healthy']
const colorScale = stat_order.map((c) => FILLS[c])

export default withSimulation(function Home(props) {
  const { simulation, actions } = props.config
  if (!simulation) {
    return 'Start a simulation!!'
  }
  const last_stat = simulation.stats[simulation.stats.length - 1]
  simulation.canvas = ref.current
  const series = stat_order.map((name) => ({
    name,
    data: simulation.stats.map((s, i) => ({
      y: s[name],
      x: i,
    })),
  }))
  const x_max = Math.max(simulation.stats.length, 50)
  return (
    <div>
      <button className={css.button()} onClick={actions.step}>
        Step!
      </button>
      {simulation.stats.length > 0 && (
        <div className="flex">
          <div style={{ width: 400 }} className="mr-4 mb4">
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
          <div>
            {stat_order.map((name) => (
              <div key={name}>
                {name}: {last_stat[name]}
              </div>
            ))}
          </div>
        </div>
      )}
      <canvas
        width={simulation.temp_canvas.width}
        height={simulation.temp_canvas.height}
        className="border"
        ref={ref}
      />
    </div>
  )
})
