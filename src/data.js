'use strict'

import * as d3 from 'd3'

let dataCsv

const loadCsvFromUrl = (url) => {
  return d3.csv(url)
    .then(csv => {
      dataCsv = csv
    })
}

const generateFilterOptions = ({ columns, rows }) => {
  const f = {}
  rows.forEach(row => {
    Object.entries(row).forEach(([k, v]) => {
      if (k === 'Total') return
      if (f[k] === undefined) f[k] = new Set()
      f[k].add(v)
    })
  })

  const options = {}
  Object.keys(f).forEach(field => {
    const o = {}
    Array.from(f[field]).sort().forEach(value => {
      o[value] = 1
    })
    options[field] = o
  })
  return options
}

export {
  dataCsv,
  loadCsvFromUrl,
  generateFilterOptions,
}
