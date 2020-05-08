import React from 'react'
import { withSimulation } from './simulation'
import css from '@unrest/css'
import { VictoryScatter, VictoryChart, VictoryAxis } from 'victory'

export default withSimulation(function Home(props) {
  const { simulation, actions } = props.config
  if (!simulation) {
    return 'Start a simulation!!'
  }
  const style = { data: { fill: (o) => o.datum.fill } }

  return (
    <div>
      <button className={css.button()} onClick={actions.step}>
        Step!
      </button>
      <div style={{ width: 500, height: 500 }}>
        <VictoryChart
          width={500}
          height={500}
          padding={{ top: 0, bottom: 0, left: 0, right: 0 }}
        >
          <VictoryAxis
            tickFormat={() => ''}
            style={{ axis: { stroke: 'none' } }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={() => ''}
            style={{ axis: { stroke: 'none' } }}
          />
          <VictoryScatter
            data={simulation.getScatter()}
            domain={simulation.getDomain()}
            style={style}
          />
        </VictoryChart>
      </div>
    </div>
  )
})
