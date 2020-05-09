import { defaults, range, sortBy } from 'lodash'
import ENUM from './enum'
import ConfigHook from './ConfigHook'
import Board from './board/continuous'
import sprites from './sprite'

const MAX_TRIES = 50

export const DEFAULTS = {
  people: 5,
  infected: 1,
  lethality: 0.1,
  duration: 10,
  size: 500,
  radius: 7,
  dt: 1,
}

export const schema = {
  type: 'object',
  properties: {
    people: { type: 'integer' },
    infected: { type: 'integer' },
    lethality: { type: 'number' },
    duration: { type: 'integer' },
    size: { type: 'integer' },
    radius: { type: 'integer' },
    dt: { type: 'number' },
  },
}

const actions = {
  onSave(store, formData) {
    if (store.state.simulation) {
      store.state.simulation.stop()
    }
    const simulation = new Simulation(formData)
    store.setState({ step: 0, simulation })
    window.INTERVAL = setInterval(() => store.actions.step(), 10)
  },
  step(store) {
    const start = new Date().valueOf()
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
    this.turn = 0
    this.duration = this.options.duration / this.options.dt
    this.reset()
  }

  animate() {
    this.sprites = sprites()
    this.temp_canvas = document.createElement('canvas')
    this.temp_canvas.width = this.board.W + this.options.radius * 2
    this.temp_canvas.height = this.board.H + this.options.radius * 2
    this.frame = 0
    this.animationFrame = requestAnimationFrame(this.draw)
  }
  stop() {
    cancelAnimationFrame(this.animationFrame)
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
        this.infect(entity)
        to_infect--
      }
      tries--
    }
    if (to_infect) {
      console.error("Didn't infect everyone!")
    }
  }

  infect(entity) {
    entity.status = ENUM.infected
    entity.infected_until = this.turn + this.duration * (1.5 - Math.random())
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
      [ENUM.recovered]: '#81F481',
      [ENUM.dead]: '#444',
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
    const { dt, radius } = this.options
    const { W, H } = this.board
    this.turn += 1

    const delta = radius * dt

    pieces.forEach((p) => {
      if (p.status === ENUM.dead) {
        return
      }
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
          this.collide(p1, p2, radius * 2 - Math.sqrt(dx2 + dy2))
        }
      })
    })

    pieces.forEach((p) => {
      if (p.status === ENUM.infected && p.infected_until < this.turn) {
        p.status =
          Math.random() < this.options.lethality ? ENUM.dead : ENUM.recovered
      }
    })
    this.draw()
  }

  collide(p1, p2, displacement) {
    // #! TODO this math isn't quite right
    // walk back each ball equal to displacement amount
    p1.x -= p1.dx * displacement
    p1.y -= p1.dy * displacement
    p2.x -= p2.dx * displacement
    p2.y -= p2.dy * displacement

    if (p1.status === ENUM.dead || p2.status === ENUM.dead) {
      p1.dx = -p1.dx
      p1.dy = -p1.dy
      p2.dx = -p2.dx
      p2.dy = -p2.dy
      return
    }

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
      this.infect(p2)
    } else if (p2.status === ENUM.infected && p1.status === ENUM.healthy) {
      this.infect(p1)
    }
  }

  getCounts() {
    const counts = {}
    const entries = Object.entries(ENUM)
    entries.forEach(([key, value]) => {
      counts[key] = this.board.pieces.filter((p) => p.status === value).length
    })
    return counts
  }

  draw = () => {
    this.frame++
    if (!this.canvas || this.frame % 2 !== 0) {
      return
    }
    const ctx = this.temp_canvas.getContext('2d')
    const s = this.options.radius * 2
    ctx.clearRect(0, 0, this.temp_canvas.width, this.temp_canvas.height)
    this.pieces.forEach(({ status, x, y }) => {
      ctx.drawImage(this.sprites[status], Math.floor(x), Math.floor(y), s, s)
    })
    const ctx2 = this.canvas.getContext('2d')
    ctx2.clearRect(0, 0, this.temp_canvas.width, this.temp_canvas.height)
    ctx2.drawImage(this.temp_canvas, 0, 0)
  }
}
