import React from 'react'
import { range } from 'lodash'
import ConfigHook from './ConfigHook'
import { VictoryLine, VictoryChart } from 'victory'

const resolution = 0.3
const PERIODS = 3
const DOMAIN = Math.PI * PERIODS
const TERMS = 10 * PERIODS

const base_colors = {
  red: '#e6261f',
  orange: '#eb7532',
  yellow: '#f7d038',
  green: '#a3e048',
  teal: '#49da9a',
  blue: '#34bbe6',
  indigo: '#4355db',
  purple: '#d23be7',
}

const colors = Object.values(base_colors)

const uiSchema = {
  terms: {
    'ui:widget': 'range',
  },
  highlight: {
    'ui:widget': 'range',
  },
}

const series_names = ['cos', 'sin']

const schema = {
  type: 'object',
  properties: {
    series: {
      type: 'string',
      enum: series_names,
      default: 'cos',
    },
    terms: {
      type: 'integer',
      default: 5,
      maximum: TERMS,
      minimum: 0,
    },
    highlight: {
      type: 'integer',
      default: 0,
      maximum: TERMS,
      minimum: 0,
    },
  },
}

const TermBox = ({ odd, n }) => (
  <span className="flex items-center" key={n}>
    <span className="mx-2">{odd ? '-' : '+'}</span>
    <div className="text-center">
      x<sup>{2 * n}</sup>
      <div className={denominator}>{2 * n} !</div>
    </div>
  </span>
)

const LegendBox = ({ n, children }) => (
  <div className="flex items-center">
    <span
      className="w-4 h-4 border-black inline-block mr-2"
      style={{ background: colors[n % colors.length] }}
    />
    {children}
  </div>
)

const withConfig = ConfigHook('taylor_series', { schema, uiSchema })

const factorial = { 0: 1 }
range(1, TERMS * TERMS).forEach((i) => (factorial[i] = factorial[i - 1] * i))

const xs = range(-DOMAIN, DOMAIN + 1, resolution)
const denominator = 'border-t border-black mt-1 pt-1'

const SERIES = {
  cos: {
    taylor_terms: range(TERMS).map((n) => {
      return xs.map((x) => {
        return {
          x,
          y: (Math.pow(-1, n) * Math.pow(x, 2 * n)) / factorial[2 * n],
        }
      })
    }),
    getTerm: (n) => TermBox({ odd: n % 2, n: n * 2 }),
  },
  sin: {
    taylor_terms: range(TERMS).map((n) => {
      return xs.map((x) => {
        return {
          x,
          y: (Math.pow(-1, n) * Math.pow(x, 2 * n + 1)) / factorial[2 * n + 1],
        }
      })
    }),
    getTerm: (n) => TermBox({ odd: n % 2, n: n * 2 + 1 }),
  },
}

series_names.forEach((series_name) => {
  const _series = SERIES[series_name]
  _series.terms = range(TERMS).map((n) => _series.getTerm(n))
  _series.terms_legend = _series.terms.map((term, n) => (
    <LegendBox n={n} key={n}>
      {term}
    </LegendBox>
  ))

  const series_children = []
  _series.series_legend = _series.terms.map((current_term, n) => {
    series_children.push(current_term)
    return (
      <LegendBox n={n} key={n}>
        {series_children.length > 5
          ? ['...', ...series_children.slice(series_children.length - 5)]
          : series_children.slice()}
      </LegendBox>
    )
  })

  _series.perfect = xs.map((x) => ({ x, y: Math[series_name](x) }))

  _series.taylor_series = [_series.taylor_terms[0]]

  range(1, TERMS).forEach((n) => {
    const taylor_term = _series.taylor_terms[n]
    _series.taylor_series.push(
      _series.taylor_series[n - 1].map((xy, i) => {
        return {
          x: xy.x,
          y: xy.y + taylor_term[i].y,
        }
      }),
    )
  })

  _series.taylor_series.forEach((series, i) => {
    _series.taylor_series[i] = series.filter((xy) => xy.y < 4)
  })
  _series.taylor_terms.forEach((series, i) => {
    _series.taylor_terms[i] = series.filter((xy) => xy.y < 4)
  })
})

const Chart = ({ mainSeries, otherSeries = [], highlight }) => (
  <VictoryChart padding={10} domain={{ y: [-2, 2] }}>
    <VictoryLine data={mainSeries} />
    {otherSeries.map((line, i) => (
      <VictoryLine
        data={line}
        style={{
          data: {
            stroke: colors[i % colors.length],
            strokeWidth: highlight === i ? 9 : 2,
          },
        }}
        key={i}
      />
    ))}
    {highlight < otherSeries.length && (
      <VictoryLine
        data={otherSeries[highlight]}
        style={{
          data: {
            stroke: 'black',
            strokeWidth: 2,
          },
        }}
      />
    )}
  </VictoryChart>
)

const Charts = withConfig((props) => {
  const { highlight, terms, series } = props.config.formData
  return (
    <div className="flex flex-wrap">
      <div className="w-1/2">
        <Chart
          mainSeries={SERIES[series].perfect}
          otherSeries={SERIES[series].taylor_terms.slice(0, terms)}
          highlight={highlight}
        />
        {SERIES[series].terms_legend[highlight]}
      </div>
      <div className="w-1/2">
        <Chart
          mainSeries={SERIES[series].perfect}
          otherSeries={SERIES[series].taylor_series.slice(0, terms)}
          highlight={highlight}
        />
        {SERIES[series].series_legend[highlight]}
      </div>
    </div>
  )
})

export default function Cos() {
  return (
    <div className="flex -mx-2 w-full">
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
