import React from 'react'

import { withSimulation } from './simulation'

export default function Sidebar() {
  return <withSimulation.Form submitText="New Simulation" />
}
