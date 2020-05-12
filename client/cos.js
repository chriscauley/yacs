import React from 'react'
import { range } from 'lodash'
import ConfigHook from './ConfigHook'
import { VictoryLine, VictoryChart } from 'victory'

const resolution = 0.1
const DOMAIN = Math.PI * 5
const TERMS = 30

const schema = {
  type: 'object',
  properties: {
    series: {
      type: 'string',
      enum: ['cos', 'sin'],
      default: 'cos',
    },
    terms: {
      type: 'number',
      default: 5,
    },
  },
}

const withConfig = ConfigHook('taylor_series', { schema })

const cos = (x, terms) => {
  let result = 1
  let factorial = 1
  for (let i = 1; i < terms; i++) {
    factorial *= 2 * i - 1
    factorial *= 2 * i
    result += (Math.pow(-1, i) * Math.pow(x, 2 * i)) / factorial
  }
  return
}

const factorial = { 0: 1 }
range(1, TERMS * TERMS).forEach((i) => (factorial[i] = factorial[i - 1] * i))

const xs = range(-DOMAIN, DOMAIN + 1, resolution)

const perfect_cos = xs.map((x) => {
  return {
    x,
    y: Math.cos(x),
  }
})

const cos_taylor_terms = range(TERMS).map((n) => {
  return xs.map((x) => {
    return { x, y: (Math.pow(-1, n) * Math.pow(x, 2 * n)) / factorial[2 * n] }
  })
})

const cos_taylor_series = [cos_taylor_terms[0]]

range(1, TERMS).forEach((n) => {
  const even_polynomial = cos_taylor_terms[n]
  cos_taylor_series.push(
    cos_taylor_series[n - 1].map((xy, i) => {
      return {
        x: xy.x,
        y: xy.y + even_polynomial[i].y,
      }
    }),
  )
})

const Chart = ({ mainSeries, otherSeries = [] }) => (
  <VictoryChart padding={10} domain={{ y: [-2, 2] }}>
    <VictoryLine data={mainSeries} />
    {otherSeries.map((line, i) => (
      <VictoryLine
        data={line}
        style={{ data: { stroke: '#c43a31' } }}
        key={i}
      />
    ))}
  </VictoryChart>
)

const Charts = withConfig((props) => {
  const { terms, series } = props.config.formData
  return (
    <div className="flex flex-wrap">
      <div className="w-1/2">
        <Chart
          mainSeries={perfect_cos}
          otherSeries={cos_taylor_terms.slice(0, terms)}
        />
      </div>
      <div className="w-1/2">
        <Chart
          mainSeries={perfect_cos}
          otherSeries={cos_taylor_series.slice(0, terms)}
        />
      </div>
    </div>
  )
})

export default () => {
  return (
    <div className="flex -mx-2">
      <div className="w-1/4 p-2">
        <div className="m-2 p-2 border">
          <withConfig.Form customButton={true} autosubmit={true} />
        </div>
      </div>
      <div className="w-3/4 p-2">
        <Charts />
      </div>
    </div>
  )
}
