import Color from 'color'

const COLORS = {
  infected: '#C62828',
  healthy: '#81D4FA',
  recovered: '#81F481',
  dead: '#000000',
}

export const STROKES = {}
export const FILLS = {}
Object.entries(COLORS).forEach(([key, color]) => {
  STROKES[key] = color
  FILLS[key] = Color(color).lighten(0.1).alpha(0.8).string()
})

const radius = 30
const lineWidth = radius / 4

export default () => {
  const images = {}
  Object.keys(COLORS).forEach((key) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = radius * 2
    const ctx = canvas.getContext('2d')
    ctx.arc(radius, radius, radius - lineWidth / 2, 0, 2 * Math.PI, false)
    ctx.fillStyle = FILLS[key]
    ctx.fill()
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = STROKES[key]
    ctx.stroke()

    const img = document.createElement('img')
    img.src = canvas.toDataURL()
    images[key] = img
  })
  return images
}
