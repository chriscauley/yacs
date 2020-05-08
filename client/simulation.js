import { defaults, range, sortBy } from 'lodash'
import ConfigHook from './ConfigHook'

const mod = (a, b) => ((a % b) + b) % b

const MAX_TRIES = 50

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

class Geometry {
  constructor(options = {}) {
    // TODO split board options and simuation options (people, infected)
    this.options = defaults({}, options, DEFAULTS)
    this.wall_width = 3

    this.H = this.W = this.options.size + this.wall_width
    this.cache_geometries()
  }

  // utility functions for getting swapping between cartesian and disco geometries
  index2xy = (i) => this._index2xy[mod(i, this.LENGTH)]
  xy2index = (xy) => this._xy2index[xy[0]][xy[1]]
  dxy2dindex = (dxy) => dxy[0] + dxy[1] * this.W
  dindex2dxy = (dindex) => [mod(dindex, this.W), Math.floor(dindex / this.W)]

  slice(layer_name, x, y, w, h) {
    const results = []
    const layer = this[layer_name]
    range(x, w).forEach((x) =>
      range(y, h).forEach((y) => {
        const entity = layer[this.xy2index([x, y])]
        entity && results.push(entity)
      }),
    )
    return results
  }

  cache_geometries() {
    this.LENGTH = this.H * this.W

    //cache xy/index lookups
    this._index2xy = {}
    this._xy2index = {}
    range(this.W).forEach((x) => {
      this._xy2index[x] = {}
      range(this.H).forEach((y) => {
        const index = x + y * this.W
        this._xy2index[x][y] = index
        this._index2xy[index] = [x, y]
      })
    })

    // cache dxy/dindex lookups
    this._dxy2dindex = {}
    this._dindex2dxy = {}
    const DIRS = [-1, 0, 1]
    const MAX_RANGE = 8
    range(-MAX_RANGE, MAX_RANGE + 1).forEach((dx) => {
      this._dxy2dindex[dx] = {}
      range(-MAX_RANGE, MAX_RANGE + 1).forEach((dy) => {
        const dindex = dx + this.W * dy
        this._dxy2dindex[dx][dy] = dindex
        this._dindex2dxy[dindex] = [dx, dy]
      })
    })

    this._nearby = {
      cross: {},
      square: {},
      x: {},
    }
    const _keys = []
    Object.keys(this._nearby).forEach((key) => {
      _keys.push('_' + key)
      this._nearby['_' + key] = {}
    })
    range(-MAX_RANGE, MAX_RANGE + 1)
      .filter(Boolean)
      .forEach((r) => {
        _keys.forEach((_key) => {
          this._nearby[_key][r] = []
        })
        DIRS.forEach((dx) => {
          DIRS.forEach((dy) => {
            if (!dx && !dy) {
              return // no direction, doesn't point anywhere, skip it
            }

            const dindex = this.dxy2dindex([r * dx, r * dy])
            const type = dx && dy ? '_x' : '_cross'
            this._nearby[type][r].push(dindex)
            this._nearby._square[r].push(dindex)
          })
        })
      })
  }

  flipDindex(dindex) {
    const dxy = this.dindex2dxy(dindex)
    return this.dxy2dindex([-dxy[0], -dxy[1]])
  }

  getRandomDindex() {
    // currently this is just using range 1 index away in all 8 directions
    const geometry = this._nearby._square[1]
    return geometry[Math.floor(Math.random() * geometry.length)]
  }
}

class Board extends Geometry {
  constructor(options = {}) {
    // TODO split board options and simuation options (people, infected)
    options = defaults({}, options, DEFAULTS)
    super(options)
    this.pieces = {} // piece layer
    this.makeWalls()
  }

  makeWalls() {
    range(this.wall_width).forEach((width) => {
      range(this.W).forEach((x) =>
        this.set('pieces', this.xy2index([x, width]), ENUM.wall),
      )
      range(this.H).forEach((y) =>
        this.set('pieces', this.xy2index([width, y]), ENUM.wall),
      )
    })
  }

  getEmptyIndex(layer_name) {
    const layer = this[layer_name]
    let i = MAX_TRIES
    let index
    while (i--) {
      index = Math.floor(Math.random() * this.LENGTH)
      if (!layer[index]) {
        return index
      }
    }
    console.error('Unable to find empty index. Last try:', index)
  }

  isEmpty(layer_name, index) {
    return !!this[layer_name][mod(index, this.LENGTH)]
  }

  set(layer_name, index, entity) {
    const layer = this[layer_name]
    if (layer[index] && layer[index] !== entity) {
      throw `PauliExclusionError: Cannot put entity on index`
    }
    layer[index] = entity
    if (entity.type) {
      entity.index = index
    }
  }

  move(layer_name, old_index, new_index) {
    const layer = this[layer_name]
    const entity = layer[old_index]
    this.set(layer_name, new_index, entity)
    delete layer[old_index]
  }
}

export default class Simulation {
  constructor(options = {}) {
    this.options = defaults({}, options, DEFAULTS)
    this.reset()
  }

  reset() {
    this.board = new Board(this.options)

    range(1, this.options.people + 1).forEach((id) => {
      const index = this.board.getEmptyIndex('pieces')
      this.board.set('pieces', index, {
        id,
        type: 'person',
        status: ENUM.healthy,
        index,
        dindex: this.board.getRandomDindex(),
      })
    })

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

    const scatter = Object.keys(this.board.pieces).map((index) => {
      const entity = this.board.pieces[index]
      const xy = this.board.index2xy(index)
      return {
        x: xy[0],
        y: xy[1],
        symbol: SYMBOLS[entity.type || entity],
        size: 7,
        fill: FILLS[entity.status === undefined ? entity : entity.status],
      }
    })
    sortBy(scatter, 'id')
    return scatter
  }

  getDomain() {
    return {
      x: [this.board.wall_width - 1, this.board.W],
      y: [this.board.wall_width - 1, this.board.H],
    }
  }

  step() {
    Object.values(this.board.pieces)
      .filter((p) => p.type)
      .forEach((entity) => {
        const { index, dindex } = entity
        const new_index = mod(index + dindex, this.board.LENGTH)

        if (!dindex) {
          return // not currently moving
        }

        if (!this.board.isEmpty('pieces', new_index)) {
          this.board.move('pieces', index, new_index)
        } else {
          entity.dindex = this.board.flipDindex(dindex)
        }
      })
  }
}
