import React from 'react'
import withSimulation from './withSimulation'
import css from '@unrest/css'
const ref = React.createRef(null)

export default withSimulation(function Home(props) {
  const { simulation, actions } = props.config
  if (!simulation) {
    return 'Start a simulation!!'
  }
  const counts = Object.entries(simulation.getCounts())
  counts.sort()
  simulation.canvas = ref.current
  return (
    <div>
      <button className={css.button()} onClick={actions.step}>
        Step!
      </button>
      <div>
        {counts.map((c) => (
          <div key={c[0]}>
            {c[0]}: {c[1]}
          </div>
        ))}
      </div>
      <canvas
        width={simulation.temp_canvas.width}
        height={simulation.temp_canvas.height}
        className="border"
        ref={ref}
      />
    </div>
  )
})
