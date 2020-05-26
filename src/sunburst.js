'use strict'

import * as d3 from 'd3'

const maxLayersVisible = 3

let width = 800
let height = 800
// let radius = width / 8
let radius = width / (2 + 2 * maxLayersVisible)

let arc
let dataNested
let root
let parent
let label
let svgRootGroup
let path
let centerLabel

const initArc = () => {
  arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))
}

const initDataFromCsv = ({ csv, fields, rootName }) => {
  let nest = d3.nest()
  fields.forEach(k => {
    nest.key(d => d[k])
      .sortKeys(d3.ascending)
  })
  nest.rollup((leaves) => {
    return d3.sum(leaves, d => d.Total)
  })
  dataNested = nest.entries(csv)
  root = d3.hierarchy({ key: rootName ?? 'ROOT', values: dataNested }, d => d.values)
    .sum(d => d.value)
}

const initData = ({ rootName, fields, rows }) => {
  let nest = d3.nest()
  fields.forEach(k => {
    nest.key(d => d[k])
      .sortKeys(d3.ascending)
  })
  nest.rollup((leaves) => {
    return d3.sum(leaves, d => d.Total)
  })
  dataNested = nest.entries(rows)
  root = d3.hierarchy({ key: rootName, values: dataNested }, d => d.values)
    .sum(d => d.value)
}

const arcVisible = (d) => {
  return d.y1 <= (maxLayersVisible + 1) && d.y0 >= 1 && d.x1 > d.x0
  // return true
}

const labelVisible = (d) => {
  return d.y1 <= (maxLayersVisible + 1) && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03
  // return true
}

const labelTransform = (d) => {
  const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
  const y = (d.y0 + d.y1) / 2 * radius;
  return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
}

const initView = ({ container, breadcrumbsCallback }) => {
  // Partition
  const part = d3.partition()
    .size([2 * Math.PI, root.height + 1])
  part(root)
  root.each(d => d.current = d)

  // Color gradient
  // todo: count unique keys/names
  const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, root.children.length + 1))
  // const color = d3.scaleOrdinal().range(d3.schemeDark2)

  // Label ??

  // Container
  const svg = d3.select(container)
    .attr('viewBox', [0, 0, width, height])
    .style('font', '14px sans-serif')

  svg.selectAll('*').remove()
  svgRootGroup = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  initArc()
  path = svgRootGroup.append('g')
    .selectAll('path')
    .data(root.descendants().slice(1))
    .join('path')
    .attr('fill', d => { while (d.depth > 1) d = d.parent; return color(d.data.key) })
    // .attr('fill', d => color(d.data.key))
    .attr('fill-opacity', d => arcVisible(d.current) ? 1 - (d.ancestors().length - 1) * 0.2 : 0)
    .attr('stroke', 'rgba(0,0,0,0.5)')
    .attr('stroke-width', d => +arcVisible(d))
    .attr('d', d => arc(d.current))

  // Click event
  breadcrumbsCallback(root.ancestors().map(d => `${d.data.key} (${d.value})`).reverse())
  const clickedHandler = (p) => {
    const breadcrumbs = p.ancestors().map(d => `${d.data.key} (${d.value})`).reverse()
    breadcrumbsCallback(breadcrumbs)
    clicked(p)
  }
  path.filter(d => d.children)
    .style('cursor', 'pointer')
    .on('click', clickedHandler)

  // Title
  path.append('title')
    // .text(d => `${d.ancestors().map(d => d.data.key).reverse().join('/')}\n${format(d.value)}`)
    .text(d => `${d.ancestors().map(d => d.data.key).reverse().join('\n/ ')}\n${d.value}`)

  // Label
  label = svgRootGroup.append('g')
    .attr('pointer-events', 'none')
    .attr('text-anchor', 'middle')
    .style('user-select', 'none')
    .selectAll('text')
    .data(root.descendants().slice(1))
    .join('text')
    .attr('dy', '0.35em')
    .attr('fill-opacity', d => +labelVisible(d.current))
    .attr('transform', d => labelTransform(d.current))
    // .text(d => d.data.key)
    .text(d => `${d.data.key} (${d.value})`)

  // Center circle
  parent = svgRootGroup.append('circle')
    .datum(root)
    .attr('r', radius)
    .attr('fill', 'none')
    // .attr('fill', '#ffc')
    .attr('pointer-events', 'all')
    // .attr('stroke', 'rgba(0,0,0,0.5)')
    // .attr('stroke-width', 1)
    .on('click', clickedHandler)

  centerLabel = svgRootGroup.append('foreignObject')
    .attr('pointer-events', 'none')
    .attr('width', radius * 2)
    .attr('height', radius * 2)
    .attr('x', -radius)
    .attr('y', -radius)
    .append('xhtml:div')
    .attr('class', 'circle-title')
    .html(root.ancestors().map(d => `${d.data.key} (${d.value})`).reverse().join('\n⇓\n'))
}

function clicked (p) {
  parent.datum(p.parent || root)

  centerLabel.html(`${p.data.key} (${p.value})`)
  // todo: transition root (center circle)

  root.each(d => d.target = {
    x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
    x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
    y0: Math.max(0, d.y0 - p.depth),
    y1: Math.max(0, d.y1 - p.depth)
  })

  const t = svgRootGroup.transition().duration(750)

  path.transition(t)
    .tween('data', d => {
      const i = d3.interpolate(d.current, d.target)
      return t => d.current = i(t)
    })
    .filter(function(d) {
      return +this.getAttribute('fill-opacity') || arcVisible(d.target)
    })
    .attr('fill-opacity', d => arcVisible(d.target) ? 1 - (d.ancestors().length - 1) * 0.2 : 0)
    // .attr('stroke-width', d => arcVisible(d) ? 1 : 0)
    // .attr('stroke-width', d => arcVisible(d) ? 1 : 0)
    .attr('stroke-width', d => +arcVisible(d.target))
    .attrTween('d', d => () => arc(d.current))

  label.filter(function(d) {
    return +this.getAttribute('fill-opacity') || labelVisible(d.target)
  }).transition(t)
    .attr('fill-opacity', d => +labelVisible(d.target))
    .attrTween('transform', d => () => labelTransform(d.current))
}

export {
  initDataFromCsv,
  initData,
  initView,
}
