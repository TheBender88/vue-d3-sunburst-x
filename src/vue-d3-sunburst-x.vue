 <template>
  <div class="outer">
    <div class="header">
      <ul id="breadcrumb">
        <li v-for="(v, k) in breadcrumbs" :key="k"><a>{{ v }}</a></li>
      </ul>
    </div>
    <div class="inner">
      <div class="help" @click="toggleHelp ^= 1">
        <div>
          <span>?</span>
          <span v-show="toggleHelp">HELP</span>
        </div>
        <div v-show="toggleHelp">
          <ul>
            <li>
              ZOOMING IN/OUT
              <ul>
                <li>IN: click on any sector of the circle</li>
                <li>OUT: click on the center circle</li>
              </ul>
            </li>
            <li>
              GROUP NESTING ORDER
              <ul>
                <li>TOGGLE: left click on a field in the GROUP ORDER to toggle between enabled and disabled</li>
                <li>REORDER: drag and drop a field in the GROUP ORDER to change the priority of the nested groups</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
      <div v-show="flagNoData" class="nodata">NO DATA LOADED</div>
      <svg ref="svg" class="d3svg"/>
      <div class="field-list">
        <div>GROUP ORDER</div>
        <div is="transition-group">
          <template v-for="(f, i) in fields">
            <div class="field-wrapper" :key="`0/${f.name}`">
              <div
                :key="`1/${f.name}`"
                @click="groupOrderToggle(i)"
                :class="'field-name' + (f.selected ? '' : ' inactive')"
                draggable="true"
                @dragstart="dragStart(i, $event)"
                @dragover="dragOver(i, $event)"
                @drop="dragDrop(i, $event)"
              >
                {{ f.name }}
              </div>
              <div :key="`2/${f.name}`" class="filter-options">
                <template v-for="(val, opt) in filters[f.name]">
                  <div :key="opt">
                    <span @click="filters[f.name][opt] ^= 1">
                      <input
                        v-model="filters[f.name][opt]"
                        type="checkbox"
                        :true-value="1"
                        :false-value="0"
                        :key="i"
                      >
                      {{ opt }}
                    </span>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as d from './data'
import * as v from './sunburst'
export default {
  props: {
    rootName: {
      type: String,
      required: false,
      default () { return 'Root' },
    },
    columns: {
      type: Array,
      required: false,
      default () { return [] }
    },
    rows: {
      type: Array,
      required: false,
      default () { return [] }
    },
  },
  data () {
    return {
      flagNoData: 1,
      toggleHelp: 0,
      fields: [], // { name: 'Delta', selected: 1 },
      breadcrumbs: [],
      filters: {},
      flagFiltersSet: 0,
    }
  },
  computed: {
    filteredRows () {
      let rows = this.rows
      Object.entries(this.filters).forEach(([field, options]) => {
        if (field === 'Total') return
        rows = rows.filter(r => options[r[field]])
      })
      return rows
    },
    selectedFields () {
      return this.fields.filter(e => e.selected === 1).map(e => e.name)
    },
  },
  watch: {
    '$props': {
      deep: true,
      handler: function () {
        this.initFields()
        this.initData()
      }
    },
    'filters': {
      deep: true,
      handler: function () {
        if (!this.flagFiltersSet) {
          this.flagFiltersSet = 1
          return
        }
        this.initData()
      }
    },
  },
  mounted () {
    // temp (testing for autoreload)
    this.initFields()
    this.initData()
  },
  methods: {
    initFields () {
      // console.log('initFields')
      const f = this.columns.slice(0, -1).map(e => {
        return { name: e, selected: 1 }
      })
      this.$set(this, 'fields', f)
      this.initFilters()
    },
    initFilters () {
      // console.log('initFilters')
      const filters = d.generateFilterOptions({
        columns: this.columns,
        rows: this.rows,
      })
      this.flagFiltersSet = 0
      this.$set(this, 'filters', filters)
    },
    initData () {
      // console.log('initData')
      if (this.filteredRows.length === 0) {
        this.flagNoData = 1
        this.$refs['svg'].innerHTML = ''
        return
      }
      this.flagNoData = 0
      v.initData({
        rootName: this.rootName,
        fields: this.selectedFields,
        // rows: this.rows,
        rows: this.filteredRows,
      })
      this.initView()
    },
    initView () {
      // console.log('initView')
      v.initView({
        container: this.$refs['svg'],
        breadcrumbsCallback: this.breadcrumbsUpdate,
      })
    },
    filterToggleSet () {
      console.log('...')
    },
    dragStart (i, e) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', i.toString())
    },
    dragDrop (to, e) {
      e.preventDefault()
      let from = parseInt(e.dataTransfer.getData('text/plain'))
      this.groupOrderMove(from, to)
    },
    dragOver (i, e) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'over'
    },
    groupOrderMove (i, j) {
      if (i === j) return
      if (i < 0 || j < 0) return
      const max = this.fields.length - 1
      if (i > max || j > max) return
      const f = this.fields.slice()
      const e = f.splice(i, 1)[0]
      f.splice(j, 0, e)
      this.$set(this, 'fields', f)
      this.initData()
    },
    groupOrderToggle (i) {
      if (this.selectedFields.length === 1 && this.fields[i].selected === 1) return // Need at least one active
      this.fields[i].selected ^= 1
      this.initData()
    },
    breadcrumbsUpdate (breadcrumbs) {
      this.$set(this, 'breadcrumbs', breadcrumbs)
    },
  },
}
</script>

<style scoped>
  .field-wrapper {
    display: flex;
    position: relative;
  }
  .field-name {
    display: inline-flex;
    width: 100%;
    margin: 2px;
    border: 1px solid #060;
    padding: 4px 12px;
    cursor: pointer;
    text-align: center;
    background: #f8fff8;
    color: #060;
    transition: all 500ms;
    overflow: visible;
  }
  .field-name.inactive {
    border-color: #600;
    color: #600;
    background: #fff8f8;
    opacity: 0.5;
  }
  .filter-options {
    display: none;
    position: absolute;
    width: 100%;
    top: 2px;
    left: 90%;
    border: 1px solid #999;
    background: #ffc;
    z-index: 9;
  }
  .field-wrapper:hover .filter-options {
    display: block;
  }
  .filter-options > div {
    cursor: pointer;
  }
  .filter-options > div:hover {
    color: #00f;
    background: rgba(0, 0, 0, 0.1);
  }

  .outer {
    display: inline-grid;
    /*font-family: Arial,sans-serif;*/
    font-family: "Calibri Light",sans-serif;
    /*font-family: Calibri,sans-serif;*/
  }

  /* HEADER */
  .header {
    border: 1px solid #000;
    font-weight: bold;
    background: #ffe;
    padding: 2px;
    border-bottom-width: 0;
  }

  #breadcrumb {
    list-style: none;
    display: inline-flex;
    padding: 0;
    margin: 0;
    font-weight: normal;
  }
  #breadcrumb .icon {
    font-size: 14px;
  }
  #breadcrumb li {
    float: left;
  }
  #breadcrumb li a {
    color: #FFF;
    display: block;
    background: #3498db;
    text-decoration: none;
    position: relative;
    height: 28px;
    line-height: 28px;
    padding: 0 10px 0 5px;
    text-align: center;
    margin-right: 16px;
  }
  #breadcrumb li:nth-child(even) a {
    background-color: #2980b9;
  }
  #breadcrumb li:nth-child(even) a:before {
    border-color: #2980b9;
    border-left-color: transparent;
  }
  #breadcrumb li:nth-child(even) a:after {
    border-left-color: #2980b9;
  }
  #breadcrumb li:first-child a {
    padding-left: 15px;
    -moz-border-radius: 4px 0 0 4px;
    -webkit-border-radius: 4px;
    border-radius: 4px 0 0 4px;
  }
  #breadcrumb li:first-child a:before {
    border: none;
  }
  #breadcrumb li:last-child a {
    padding-right: 15px;
    -moz-border-radius: 0 4px 4px 0;
    -webkit-border-radius: 0;
    border-radius: 0 4px 4px 0;
  }
  #breadcrumb li:last-child a:after {
    border: none;
  }
  #breadcrumb li a:before, #breadcrumb li a:after {
    content: "";
    position: absolute;
    top: 0;
    border: 0 solid #3498db;
    border-width: 14px 10px;
    width: 0;
    height: 0;
  }
  #breadcrumb li a:before {
    left: -14px;
    border-left-color: transparent;
  }
  #breadcrumb li a:after {
    left: 100%;
    border-color: transparent;
    border-left-color: #3498db;
  }
  #breadcrumb li a:hover {
    background-color: #1abc9c;
  }
  #breadcrumb li a:hover:before {
    border-color: #1abc9c;
    border-left-color: transparent;
  }
  #breadcrumb li a:hover:after {
    border-left-color: #1abc9c;
  }
  #breadcrumb li a:active {
    background-color: #16a085;
  }
  #breadcrumb li a:active:before {
    border-color: #16a085;
    border-left-color: transparent;
  }
  #breadcrumb li a:active:after {
    border-left-color: #16a085;
  }

  /* INNER CONTAINER */
  .inner {
    display: inline-flex;
    position: relative;
  }

  /* HELP BOX */
  .help {
    position: absolute;
    left: 0;
    border: 1px solid #666;
    padding: 2px;
    background: #eee;
    cursor: pointer;
  }
  .help > div:nth-child(1) {
    font-weight: bold;
  }
  .help > div:nth-child(1) > span:nth-child(1) {
    display: inline-block;
    width: 1em;
    text-align: center;
  }
  .help > div:nth-child(2) {
    padding: 4px;
  }
  .help ul {
    margin: 0;
  }

  /* NO DATA */
  .nodata {
    position: absolute;
    top: 50%;
    left: 25%;
    border: 1px solid #900;
    padding: 0.5em;
    background: #fee;
    color: #900
  }

  /* SVG CONTAINER */
  svg {
    padding: 2px;
  }

  /* FIELD LIST CHOOSER */
  .field-list {
    border: 1px solid #000;
    background: #eee;
    font-size: 1em;
    border-left-width: 0;
  }
  .field-list > div:nth-child(1) {
    background: #ccc;
    border: 1px solid #000;
    color: #000;
    margin: 2px;
    padding: 4px 12px;
    font-weight: bold;
  }

  .d3svg {
    border: 1px solid #000;
    width: 800px;
    height: 800px;
  }
</style>

<style>
  div.circle-title {
    /*border: 1px solid #000;*/
    font-size: 1.5em;
    white-space: pre;
    height: 100%;
    width: 100%;
    text-align: center;
    display: flex;
    justify-content: center;
    /*align-content: center;*/
    flex-direction: column;
  }
</style>
