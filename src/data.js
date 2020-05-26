'use strict'

import * as d3 from 'd3'

let dataCsv

const loadCsvFromUrl = (url) => {
  return d3.csv(url)
    .then(csv => {
      dataCsv = csv
    })
}

export {
  dataCsv,
  loadCsvFromUrl,
}
