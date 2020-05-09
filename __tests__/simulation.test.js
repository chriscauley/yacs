import Simulation from '../client/simulation'

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