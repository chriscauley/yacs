import ENUM from './enum'
import Color from 'color'

const FILLS = {
  [ENUM.infected]: '#C62828',
  [ENUM.healthy]: '#81D4FA',
  [ENUM.recovered]: '#81F481',
  [ENUM.dead]: '#000000',
}
const lineWidth = 1
const radius = 30

export default () => {
  const images = {}
  Object.entries(FILLS).forEach(([key, color]) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = radius * 2
    const ctx = canvas.getContext('2d')
    ctx.arc(radius, radius, radius - lineWidth / 2, 0, 2 * Math.PI, false)
    ctx.fillStyle = Color(color).alpha(0.75).string()
    ctx.fill()
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = color
    ctx.stroke()

    const img = document.createElement('img')
    img.src = canvas.toDataURL()
    images[key] = img
  })
  return images
}
