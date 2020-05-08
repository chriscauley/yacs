import { defaults, range } from 'lodash'
import ConfigHook from './ConfigHook'

const mod = (a, b) => ((a % b) + b) % b

const ENUM = {
  healthy: 0,
  infected: 1,
  recovered: 2,
  dead: 3,
  wall: 10,
}

export const DEFAULTS = {
  people: 5,
  infected: 1,
  lethality: 0.1,
  duration: 5,
  size: 30,
}

export const schema = {
  type: 'object',
  properties: {
    people: { type: 'integer' },
    infected: { type: 'integer' },
    lethality: { type: 'number' },
    duration: { type: 'integer' },
    size: { type: 'integer' },
  },
}

const actions = {
  onSave(store, formData) {
    const simulation = new Simulation(formData)
    store.setState({ step: 0, simulation })
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
    this.logs = []

    this.max_tries = this.options.people * 2
    this.wall_width = 3

    this.H = this.W = this.options.size + this.wall_width

    this.WH = this.H * this.W

    this.reset()
  }

  index2x = (index) => index % this.W
  index2y = (index) => Math.floor(index / this.W)
  index2xy = (index) => [this.index2x(index), this.index2y(index)]
  xy2index = (xy) => xy[0] + xy[1] * this.W

  dxy2dindex = (dxy) => dxy[0] + dxy[1] * this.W
  dindex2dxy = (dindex) => [mod(dindex, this.W), Math.floor(dindex / this.W)]

  log = (...args) =>
    this.logs.push({ type: 'log', date: new Date().valueOf(), args: args })

  makeWall = (xy) => {
    const index = this.xy2index(xy)
    if (this.data.board[index]) {
      return this.log('tried to make wall at occupied square', index)
    }
    this.data.board[index] = ENUM.wall
    this.data.walls.push(index)
  }

  makeDindexes() {
    const dis = [1, 0, -1]
    this.dindexes = []
    dis.forEach((dx) =>
      dis.forEach((dy) => this.dindexes.push(this.dxy2dindex([dx, dy]))),
    )
    this.dindexes = this.dindexes.filter(Boolean)
  }

  makeWalls() {
    range(this.wall_width).forEach((width) => {
      range(this.W).forEach((x) => this.makeWall([x, width]))
      range(this.H).forEach((y) => this.makeWall([width, y]))
    })
  }

  reset() {
    this.data = {
      ids: range(this.options.people),
      walls: [],
      entities: {},
      board: {},
    }

    this.makeWalls()
    this.makeDindexes()

    this.data.ids.forEach((id) => {
      const index = this.getEmptyIndex()
      this.data.board[index] = this.data.entities[id] = {
        id,
        status: ENUM.healthy,
        index,
        dindex: this.getRandomDindex(),
      }
    })

    let to_infect = this.options.infected
    let tries = this.max_tries
    while (to_infect && tries) {
      const id = this.data.ids[Math.floor(Math.random() * this.data.ids.length)]
      const entity = this.data.entities[id]
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

  getEmptyIndex() {
    let i = this.max_tries
    let index
    while (i--) {
      index = Math.floor(Math.random() * this.WH)
      if (!this.data.board[index]) {
        return index
      }
    }
    console.error('Unable to find empty index. Last try:', index)
  }

  getRandomDindex() {
    return this.dindexes[Math.floor(Math.random() * this.dindexes.length)]
  }

  flipDindex(dindex) {
    const dxy = this.dindex2dxy(dindex)
    return this.dxy2dindex([-dxy[0], -dxy[1]])
  }

  getScatter() {
    const { entities } = this.data
    let symbol = 'circle'
    let size = 7
    const fill = (id) =>
      entities[id].status === ENUM.infected ? '#C62828' : '#81D4FA'
    const scatter = this.data.ids.map((id) => {
      const [x, y] = this.index2xy(entities[id].index)
      return {
        x,
        y,
        symbol,
        size,
        fill: fill(id),
      }
    })

    symbol = 'square'
    size = 7
    this.data.walls.forEach((index) => {
      const [x, y] = this.index2xy(index)
      if (x < 2 || y < 2) {
        return
      }
      scatter.push({
        x,
        y,
        symbol,
        size,
      })
    })
    return scatter
  }

  getDomain() {
    return { x: [2, this.W], y: [2, this.H] }
  }

  step() {
    this.data.ids.forEach((id) => {
      const entity = this.data.entities[id]
      const { index, dindex } = entity
      const new_index = mod(index + dindex, this.WH)

      if (!dindex) {
        return // not currently moving
      }

      if (!this.data.board[new_index]) {
        entity.index = new_index
        delete this.data.board[index]
        this.data.board[new_index] = entity
      } else {
        entity.dindex = this.flipDindex(dindex)
      }
    })
  }
}
