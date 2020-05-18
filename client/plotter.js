import { FILLS } from './sprite'

const status_order = ['infected', 'dead', 'recovered', 'shelter', 'healthy']
status_order.reverse()
const colorScale = status_order.map((c) => FILLS[c])

export default (total) => {
  let dx = 3
  let t = 0
  const canvas = document.createElement('canvas')
  const extra = document.createElement('canvas')
  extra.style.imageRendering = 'pixelated'
  canvas.width = canvas.height = extra.width = extra.height = total

  return {
    status_order,
    resize() {
      let ctx = canvas.getContext('2d')
      if (dx > 1 && canvas.width >= dx * total) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(extra, 0, 0, extra.width, total)
        extra.getContext('2d').clearRect(0, 0, extra.width, extra.height)
        t = t / dx
        dx = 1
      } else {
        extra.width = canvas.width + total
        const extractx = extra.getContext('2d')
        extractx.drawImage(canvas, 0, 0)
        canvas.width += total
        ctx = canvas.getContext('2d')
        ctx.drawImage(extra, 0, 0)
      }
    },
    plot(numbers) {
      if (canvas.width < t + dx) {
        this.resize()
      }
      const ctx = canvas.getContext('2d')
      let sum = 0
      numbers.forEach((number, i) => {
        ctx.fillStyle = colorScale[i]
        ctx.fillRect(t, sum, dx, number)
        sum += number
      })
      t += dx
      extra.width = total
      const extractx = extra.getContext('2d')
      extractx.drawImage(
        canvas,
        0,
        0,
        t - dx,
        total,
        0,
        0,
        Math.min(t, total),
        total,
      )
      window.daturl = this.dataURL = extra.toDataURL()
    },
  }
}
