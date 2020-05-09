import { defaults } from 'lodash'

const DEFAULTS = {
  size: 30,
}

export default class Board {
  constructor(options) {
    this.options = defaults({}, options, DEFAULTS)
    this.pieces = []
    this.wall_width = 1
    this.W = this.H = this.options.size
  }
  newPiece(piece) {
    const theta = Math.random() * Math.PI * 2
    piece.x = Math.random() * this.W
    piece.y = Math.random() * this.H
    piece.dx = Math.cos(theta)
    piece.dy = Math.sin(theta)
    this.pieces.push(piece)
  }
}
