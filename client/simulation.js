import { defaults, range, sortBy } from 'lodash'
import ENUM from './enum'
import ConfigHook from './ConfigHook'
import Board from './board/discrete'

const MAX_TRIES = 50

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

    const scatter = Object.keys(this.board.pieces).map((index) => {
      const entity = this.board.pieces[index]
      const xy = this.board.index2xy(index)
      return {
        x: xy[0],
        y: xy[1],
        symbol: SYMBOLS[entity.type || entity],
        size: 8,
        fill: FILLS[entity.status === undefined ? entity : entity.status],
        id: entity.id,
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
    pieces.forEach((entity) => this.board.movePiece(entity))
    pieces
      .filter((p) => p.status === ENUM.infected)
      .forEach((piece) => {
        const nearby = this.board
          .look('pieces', 'square', piece.index, 1)
          .filter((p) => p.status === ENUM.healthy)
        nearby.forEach((p) => (p.status = ENUM.infected))
      })
  }
}
