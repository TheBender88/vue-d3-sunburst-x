<template>
  <div>
    <div>
      EXAMPLE 1
      <pre><button @click="generateRandomData">Randomize</button></pre>
      <pre><button @click="test1">test 1</button> COLUMNS: {{ columns.join(', ') }}</pre>
      <pre><button @click="test2">test 2</button> ROWS: {{ rows.map(e => e['Total']).slice(0, 5).join(', ') }}</pre>
    </div>
    <vue-d3-sunburst-x
      :root-name="rootName"
      :columns="columns"
      :rows="rows"
    />
  </div>
</template>

<script>
import VueD3SunburstX from '../src/vue-d3-sunburst-x.vue'
export default {
  components: {
    VueD3SunburstX,
  },
  data () {
    return {
      rootName: 'Example',
      columns: [],
      rows: [],
    }
  },
  mounted () {
    this.generateRandomData()
  },
  methods: {
    loadData () {
      console.log('loading ...')
    },
    generateRandomData () {
      const columns = [ 'Letter', 'Animal', 'Fruit', 'Country', 'Total' ]
      const groupNames = [
        // [ 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon' ],
        [ 'Alpha' ],
        [ 'Antelope', 'Baboon', 'Camel', 'Deer', 'Elephant' ],
        [ 'Apple', 'Banana', 'Coconut', 'Date', 'Elderberry'],
        [ 'Australia', 'Belgium', 'Canada', 'Denmark', 'Egypt' ]
      ]
      let rows = []
      const f = (a, b) => [].concat(...a.map(a => b.map(b => [].concat(a, b))))
      let cartesian = (a, b, ...c) => b ? cartesian(f(a, b), ...c): a
      let uniqueGroups = cartesian(...groupNames)
      uniqueGroups.forEach(g => {
        const value = parseInt(Math.random() * 100 - 50)
        if (value > 0) {
          const o = {}
          for (let i = 0; i < g.length; i++) {
            o[columns[i]] = g[[i]]
            o['Total'] = value
          }
          rows.push(o)
        }
      })
      this.$set(this, 'columns', columns)
      this.$set(this, 'rows', rows)
    },
    test1 () {
      const f = this.columns.slice(0, -1).reverse()
      f.push(this.columns.slice(-1)[0])
      this.$set(this, 'columns', f)
    },
    test2 () {
      this.rows.forEach(e => e.Total += 1)
    },
  },
}
</script>

<style scoped>
</style>
