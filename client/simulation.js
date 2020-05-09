import { defaults, range, sortBy } from 'lodash'
import ENUM from './enum'
import ConfigHook from './ConfigHook'
import Board from './board/continuous'

const MAX_TRIES = 50

export const DEFAULTS = {
  people: 5,
  infected: 1,
  lethality: 0.1,
  duration: 5,
  size: 500,
  radius: 7,
  steps: 1,
}

export const schema = {
  type: 'object',
  properties: {
    people: { type: 'integer' },
    infected: { type: 'integer' },
    // lethality: { type: 'number' },
    // duration: { type: 'integer' },
    size: { type: 'integer' },
    radius: { type: 'integer' },
    steps: { type: 'number' },
  },
}

const actions = {
  onSave(store, formData) {
    const simulation = new Simulation(formData)
    store.setState({ step: 0, simulation })
    window.INTERVAL = setInterval(() => store.actions.step(), 20)
  },
  step(store) {
    store.state.simulation.step()
    store.setState({ step: store.state.step + 1 })
  },
}

export const withSimulation = ConfigHook('simulation', {
  initial: DEFAULTS,
  schema,
  actions,
})

export default class Simulation {
  constructor(options = {}) {
    this.options = defaults({}, options, DEFAULTS)
    this.reset()
  }

  reset() {
    this.board = new Board(this.options)

    range(1, this.options.people + 1).forEach((id) =>
      this.board.newPiece({
        id,
        type: 'person',
        status: ENUM.healthy,
      }),
    )

    let to_infect = this.options.infected
    let tries = MAX_TRIES
    const people = Object.values(this.board.pieces).filter(
      (p) => p.type === 'person',
    )
    while (to_infect && tries) {
      const entity = people[Math.floor(Math.random() * people.length)]
      if (entity.status === ENUM.healthy) {
        entity.status = ENUM.infected
        to_infect--
      }
      tries--
    }
    if (to_infect) {
      console.error("Didn't infect everyone!")
    }
  }

  getScatter() {
    const SYMBOLS = {
      [ENUM.wall]: 'square',
      person: 'circle',
    }
    const FILLS = {
      [ENUM.wall]: 'black',
      [ENUM.infected]: '#C62828',
      [ENUM.healthy]: '#81D4FA',
    }

    const scatter = this.board.pieces.map((piece) => {
      return {
        x: piece.x,
        y: piece.y,
        symbol: SYMBOLS[piece.type || piece],
        size: this.options.radius,
        fill: FILLS[piece.status === undefined ? piece : piece.status],
        id: piece.id,
      }
    })
    const s2 = sortBy(scatter, 'id')
    return s2
  }

  getDomain() {
    return {
      x: [this.board.wall_width - 1, this.board.W],
      y: [this.board.wall_width - 1, this.board.H],
    }
  }

  step() {
    const pieces = Object.values(this.board.pieces).filter((p) => p.type)
    const { steps, radius } = this.options
    const { W, H } = this.board

    const delta = radius * steps

    pieces.forEach((p) => {
      p.x += p.dx * delta
      p.y += p.dy * delta

      // left/right wall check
      if (p.x < 0) {
        p.x = 0
        p.dx = Math.abs(p.dx)
      } else if (p.x > W) {
        p.x = W
        p.dx = -Math.abs(p.dx)
      }

      // top bottom wall check
      if (p.y < 0) {
        p.y = 0
        p.dy = Math.abs(p.dy)
      } else if (p.y > H) {
        p.y = H
        p.dy = -Math.abs(p.dy)
      }
    })

    // check collisions
    const z = 4 * radius * radius
    pieces.forEach((p1, i) => {
      pieces.slice(i + 1).forEach((p2) => {
        const dx2 = Math.pow(p1.x - p2.x, 2)
        const dy2 = Math.pow(p1.y - p2.y, 2)
        if (dx2 + dy2 < z) {
          collide(p1, p2, radius * 2 - Math.sqrt(dx2 + dy2))
        }
      })
    })
  }
}

const collide = (p1, p2, displacement) => {
  // walk back each ball equal to displacement amount
  p1.x -= p1.dx * displacement
  p1.y -= p1.dy * displacement
  p2.x -= p2.dx * displacement
  p2.y -= p2.dy * displacement

  const theta1 = Math.atan2(p1.dy, p1.dx)
  const theta2 = Math.atan2(p2.dy, p2.dx)
  const phi = Math.atan2(p2.y - p1.y, p2.x - p1.x)
  const v1 = Math.sqrt(p1.dx * p1.dx + p1.dy * p1.dy)
  const v2 = Math.sqrt(p2.dx * p2.dx + p2.dy * p2.dy)

  p1.dx =
    v2 * Math.cos(theta2 - phi) * Math.cos(phi) +
    v1 * Math.sin(theta1 - phi) * Math.cos(phi + Math.PI / 2)
  p1.dy =
    v2 * Math.cos(theta2 - phi) * Math.sin(phi) +
    v1 * Math.sin(theta1 - phi) * Math.sin(phi + Math.PI / 2)
  p2.dx =
    v1 * Math.cos(theta1 - phi) * Math.cos(phi) +
    v2 * Math.sin(theta2 - phi) * Math.cos(phi + Math.PI / 2)
  p2.dy =
    v1 * Math.cos(theta1 - phi) * Math.sin(phi) +
    v2 * Math.sin(theta2 - phi) * Math.sin(phi + Math.PI / 2)
  if (p1.status === ENUM.infected && p2.status === ENUM.healthy) {
    p2.status = ENUM.infected
  } else if (p2.status === ENUM.infected && p1.status === ENUM.healthy) {
    p1.status = ENUM.infected
  }
}
