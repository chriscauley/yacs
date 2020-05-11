import { defaults, range } from 'lodash'
import ENUM from './enum'
import sprites from './sprite'
import Random from '@unrest/random'

const MAX_TRIES = 50
const SAMPLE_RATE = 100
const COLLISION_SKIP = 4
const FRAME_SKIP = 2

export const DEFAULTS = {
  people: 200,
  infected: 1,
  lethality: 0.1,
  duration: 100,
  size: 500,
  radius: 5,
  dt: 0.1,
}

export default class Simulation {
  constructor(options = {}) {
    window.SIM = this
    this.options = defaults({}, options, DEFAULTS)
    this.random = new Random(this.options.seed)
    this.turn = 0
    this.duration = this.options.duration / this.options.dt
    this.wall_width = 1
    this.W = this.H = this.options.size
    this.reset()
  }

  start(store) {
    this.store = store
    this.started = new Date().valueOf()

    // prep animations
    this.sprites = sprites()
    this.temp_canvas = document.createElement('canvas')
    this.temp_canvas.width = this.W + this.options.radius * 2
    this.temp_canvas.height = this.H + this.options.radius * 2

    this.frame = 0
    this.animationFrame = requestAnimationFrame(this.draw)
  }
  stop() {
    cancelAnimationFrame(this.animationFrame)
  }

  newPiece(piece) {
    piece.x = this.random() * this.W
    piece.y = this.random() * this.H
    piece.angle = this.random() * 2 * Math.PI
    this.pieces.push(piece)
  }

  reset() {
    this.pieces = []
    this.stats = []

    range(1, this.options.people + 1).forEach((id) =>
      this.newPiece({
        id,
        type: 'person',
        status: ENUM.healthy,
      }),
    )

    // really useful for debugging
    // const p0 = this.pieces[0]
    // const p1 = this.pieces[1]

    // p0.y = 50
    // p1.y = 200
    // p0.x = 200 + this.options.radius
    // p1.x = 200
    // p1.angle = p0.angle = Math.PI/2

    let to_infect = this.options.infected
    let tries = MAX_TRIES
    const people = Object.values(this.pieces).filter((p) => p.type === 'person')
    while (to_infect && tries) {
      const entity = this.random.choice(people)
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
    entity.infected_until = this.turn + this.duration * (1.5 - this.random())
  }

  step() {
    const pieces = Object.values(this.pieces).filter((p) => p.type)
    const { dt, radius } = this.options
    const { W, H } = this
    this.turn += 1

    const delta = radius * dt

    for (let index = 0; index < pieces.length; index++) {
      const p = pieces[index]
      if (p.status === ENUM.dead) {
        continue
      }
      p.x += Math.cos(p.angle) * delta
      p.y += Math.sin(p.angle) * delta
    }

    // check collision every other frame fro efficiency
    if (this.turn % COLLISION_SKIP) {
      return
    }

    for (let index = 0; index < pieces.length; index++) {
      const p = pieces[index]
      // left/right wall check
      if (p.x < 0) {
        p.x = 0
        p.angle = Math.PI - p.angle
      } else if (p.x > W) {
        p.x = W
        p.angle = Math.PI - p.angle
      }

      // top bottom wall check
      if (p.y < 0) {
        p.angle = -p.angle
        p.y = 0
      } else if (p.y > H) {
        p.y = H
        p.angle = -p.angle
      }
    }

    // check collisions
    const z = 4 * radius * radius
    for (let i1 = 0; i1 < pieces.length; i1++) {
      const p1 = pieces[i1]
      for (let i2 = i1 + 1; i2 < pieces.length; i2++) {
        const p2 = pieces[i2]
        const dx2 = Math.pow(p1.x - p2.x, 2)
        const dy2 = Math.pow(p1.y - p2.y, 2)
        if (dx2 + dy2 < z) {
          this.collide(p1, p2)
        }
      }
      if (p1.status === ENUM.infected && p1.infected_until < this.turn) {
        p1.status =
          this.random() < this.options.lethality ? ENUM.dead : ENUM.recovered
      }
    }

    this.recordStats()
    this.store && this.store.actions.step()
    this.afterStep && this.afterStep()
  }

  collide(p1, p2) {
    separate(p1, p2, this.options.radius)
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    const n_angle = Math.atan(dy / dx) - Math.PI / 2

    p1.angle = angleReflect(p1.angle, n_angle)
    p2.angle = angleReflect(p2.angle, n_angle)

    if (p1.status === ENUM.dead || p2.status === ENUM.dead) {
      p1.dx = -p1.dx
      p1.dy = -p1.dy
      p2.dx = -p2.dx
      p2.dy = -p2.dy
      return
    }

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
      counts[key] = this.pieces.filter((p) => p.status === value).length
    })

    counts.turn = this.turn
    counts.frame = this.frame
    const now = new Date().valueOf()
    counts.fps = Math.floor((1000 * this.frame) / (now - this.started))
    return counts
  }

  draw = () => {
    cancelAnimationFrame(this.animationFrame)
    this.animationFrame = requestAnimationFrame(this.draw)
    this.step()
    this.frame++
    if (!this.canvas || this.frame % FRAME_SKIP !== 0) {
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

  recordStats() {
    const time = new Date().valueOf()
    const samples = (time - this.started) / SAMPLE_RATE
    if (
      !this.pieces.find((p) => p.status === ENUM.infected) ||
      this.stats.length > samples
    ) {
      return
    }
    this.last_stat = time
    const result = { time }
    Object.entries(ENUM).forEach(([key, value]) => {
      result[key] = this.pieces.filter((p) => p.status === value).length
    })
    this.stats.push(result)
  }
}

function angleReflect(incidenceAngle, surfaceAngle) {
  // https://stackoverflow.com/a/54442598
  const tau = Math.PI * 2
  const a = surfaceAngle * 2 - incidenceAngle
  return a >= tau ? a - tau : a < 0 ? a + tau : a
}

export const separate = (p1, p2, radius) => {
  // makes p1 and p2 exactly 2 * radius apart because overlapping pieces become stuck
  if (p1.x > p2.x) {
    const temp = p1
    p1 = p2
    p2 = temp
  }
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
  const move_xy = radius - distance / 2
  const n_angle = Math.atan(dy / dx)
  const move_x = Math.cos(n_angle) * move_xy
  const move_y = Math.sin(n_angle) * move_xy
  p1.x -= move_x
  p1.y -= move_y
  p2.x += move_x
  p2.y += move_y
}
