import { defaults, range } from 'lodash'
import ENUM from '../enum'

const mod = (a, b) => ((a % b) + b) % b

const MAX_TRIES = 50

export const DEFAULTS = {
  size: 30,
}

// separating geometry into a separate class just to keep them distict
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

  movePiece(entity) {
    const { index, dindex } = entity

    if (!dindex) {
      return // not currently moving
    }
    const new_index = mod(index + dindex, this.LENGTH)
    if (!this.isEmpty('pieces', new_index)) {
      this.move('pieces', index, new_index)
    } else {
      entity.dindex = this.flipDindex(dindex)
      const new_index = mod(index + entity.dindex, this.LENGTH)
      if (!this.isEmpty('pieces', new_index)) {
        this.move('pieces', index, new_index)
      }
    }
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
    range(1, MAX_RANGE + 1)
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

    _keys.forEach((_key) => {
      const key = _key.slice(1)
      this._nearby[key][0] = []
      range(1, MAX_RANGE + 1).forEach((r) => {
        this._nearby[key][r] = [
          ...this._nearby[_key][r],
          ...this._nearby[key][r - 1],
        ]
      })
      delete this._nearby[key][0]
    })
  }

  look(layer_name, geometry, index, range) {
    const layer = this[layer_name]
    const deltas = this._nearby[geometry][range]
    return deltas
      .map((dindex) => layer[mod(index + dindex, this.LENGTH)])
      .filter(Boolean)
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

export default class Board extends Geometry {
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
    throw 'Unable to find empty index. Last try: ' + index
  }

  newPiece(piece) {
    defaults(piece, {
      index: this.getEmptyIndex('pieces'),
      dindex: this.getRandomDindex(),
    })
    this.set('pieces', piece.index, piece)
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
