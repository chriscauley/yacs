import { defaults, range } from 'lodash'

const ENUM = {
  healthy: 0,
  infected: 1,
  recovered: 2,
  dead: 3,
}

export default class Simulation {
  constructor(options = {}) {
    this.options = defaults({}, options, {
      people: 5,
      infected: 1,
      lethality: 0.1,
      duration: 5,
      radius: 0.01,
      size: 30,
    })

    this.max_tries = this.options.people * 2

    this.H = this.W = this.options.size

    this.WH = this.H * this.W

    this.reset()
  }

  reset() {
    this.data = {
      ids: range(this.options.people),
      xy: {},
      entities: {},
    }
    this.data.ids.forEach((id) => {
      const xy = this.getEmptyXY()
      this.data.xy[xy] = id
      this.data.entities[id] = {
        id,
        status: ENUM.healthy,
        xy,
        dxy: this.getRandomDXY(),
      }
    })

    let to_infect = this.options.infected
    let tries = this.max_tries
    while (to_infect && tries) {
      const index = Math.floor(Math.random() * this.data.ids.length)
      const id = this.data.ids[index]
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

  getEmptyXY() {
    let i = this.max_tries
    let xy
    while (i--) {
      xy = Math.floor(Math.random() * this.WH)
      if (!this.data.xy[xy]) {
        return xy
      }
    }
    console.error('Unable to find empty xy. Last try:', xy)
  }

  getRandomDXY() {
    const dy = Math.floor(Math.random() * 3) - 1
    const dx = Math.floor(Math.random() * 3) - 1
    return dx + this.W * dy
  }

  getX(id) {
    return this.data.entities[id].xy % this.W
  }

  getY(id) {
    return Math.floor(this.data.entities[id].xy / this.W)
  }

  getScatter() {
    return this.data.ids.map((id) => {
      return {
        x: this.getX(id),
        y: this.getY(id),
        shape: 'square',
        size: 7,
      }
    })
  }

  getDomain() {
    return { x: [0, this.W], y: [0, this.H] }
  }
}
