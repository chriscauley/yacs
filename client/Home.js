import React from 'react'
import Simulation from './simulation'
import { VictoryScatter, VictoryChart, VictoryAxis } from 'victory'

const simulation = new Simulation()

export default function Home(_props) {
  return (
    <div style={{ width: 500, height: 500 }}>
      <VictoryChart width={500} height={500}>
        <VictoryAxis tickFormat={() => ''} />
        <VictoryAxis dependentAxis tickFormat={() => ''} />
        <VictoryScatter
          data={simulation.getScatter()}
          domain={simulation.getDomain()}
        />
      </VictoryChart>
    </div>
  )
}
