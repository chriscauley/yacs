import React from 'react'

import withSimulation from './withSimulation'

export default function Sidebar() {
  return <withSimulation.Form submitText="New Simulation" />
}
