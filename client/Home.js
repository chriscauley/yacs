import React from 'react'
import { withSimulation } from './simulation'
import { VictoryScatter, VictoryChart, VictoryAxis } from 'victory'

export default withSimulation(function Home(props) {
  const { simulation } = props.config
  if (!simulation) {
    return 'Start a simulation!!'
  }
  const style = { data: { fill: (o) => o.datum.fill } }

  return (
    <div style={{ width: 500, height: 500 }}>
      <VictoryChart width={500} height={500}>
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
  )
})
