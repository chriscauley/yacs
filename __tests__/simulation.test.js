import Simulation, { separate } from '../client/simulation'
import { range } from 'lodash'

const DEFAULTS = {
  people: 200,
  infected: 1,
  lethality: 0.1,
  duration: 100,
  size: 500,
  radius: 5,
  dt: 0.1,
  seed: 12345,
}

test("Snapshot simulation", () => {
  // this is mostly to ensure that the seeded randomness is consistent
  const simulation = new Simulation({seed: 12345, people: 2})
  expect(simulation.pieces).toMatchSnapshot()
  simulation.step()
  simulation.step()
  expect(simulation.pieces).toMatchSnapshot()
})

test("Step speed test", () => {
  const simulation = new Simulation(DEFAULTS)
  let i = 1000
  while (i--) {
    simulation.step()
  }
})

test("Collide speed test", () => {
  const simulation = new Simulation(DEFAULTS)
  const p0 = simulation.pieces[0]
  const p1 = simulation.pieces[1]
  let i = 1000
  while (i--) {
    simulation.collide(p0, p1, 0)
  }
})

test("Displacements", () => {
  // I had a lot of trouble getting picese to stop spawning inside each other, so I'm shotgun testing it here
  const getDistance = (p1, p2) => {
    const dx2 = Math.pow(p1.x - p2.x, 2)
    const dy2 = Math.pow(p1.y - p2.y, 2)
    return Math.sqrt(dx2 + dy2)
  }
  const radius = 30
  const cases = [
    [100,100,110,100],
    [100,100,100.001,110],
    [100,100,110,110],
    [100,100,90,90],
  ]
  range(100).forEach(() => {
    cases.push([100,100,100+2*Math.random()*radius-radius,100+2*Math.random()*radius-radius])
  })
  cases.forEach(([x1, y1, x2, y2]) => {
    const p1 = {x: x1, y: y1}
    const p2 = {x: x2, y: y2}
    const d1 = getDistance(p1, p2)
    separate(p1, p2, radius)
    const success = !Math.floor(60-getDistance(p1, p2).toFixed(2))
    !success && console.log(success, getDistance(p1, p2).toFixed(2), x2.toFixed(0), y2.toFixed(0), success, x2 > 100, y2 > 100)
    expect(success).toBe(true)
  })
})