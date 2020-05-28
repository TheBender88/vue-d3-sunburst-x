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
      <div v-show="toggleNoData" class="nodata">NO DATA LOADED</div>
      <svg ref="svg" class="d3svg"/>
      <div class="field-list">
        <div>GROUP ORDER</div>
        <div is="transition-group">
          <div
            v-for="(f, i) in fields"
            :key="f.name"
            @click="groupOrderToggle(i)"
            :class="f.selected ? '' : 'inactive'"
            draggable="true"
            @dragstart="dragStart(i, $event)"
            @dragover="dragOver(i, $event)"
            @drop="dragDrop(i, $event)"
          >{{ f.name }}</div>
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
      toggleNoData: 1,
      toggleHelp: 0,
      fields: [], // { name: 'Delta', selected: 1 },
      breadcrumbs: [],
    }
  },
  computed: {
    updateTrigger () {
      return {
        columns: this.columns,
        rows: this.rows,
      }
    },
    selectedFields () {
      return this.fields.filter(e => e.selected === 1).map(e => e.name)
    },
  },
  watch: {
    'updateTrigger': {
      deep: true,
      handler: function (newVal, oldVal) {
        if (oldVal.columns !== newVal.columns) {
          this.initFields()
        }
        this.dataChanged()
      }
    },
  },
  mounted () {
    this.initFields()
    this.dataChanged()
  },
  methods: {
    initFields () {
      const f = this.columns.slice(0, -1).map(e => {
        return { name: e, selected: 1 }
      })
      this.$set(this, 'fields', f)
    },
    dataChanged () {
      if (this.selectedFields.length === 0 || this.rows.length === 0) {
        this.toggleNoData = 1
        return
      }
      this.toggleNoData = 0
      v.initData({
        rootName: this.rootName,
        fields: this.selectedFields,
        rows: this.rows,
      })
      v.initView({
        container: this.$refs['svg'],
        breadcrumbsCallback: this.breadcrumbsUpdate,
      })
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
      this.dataChanged()
    },
    groupOrderToggle (i) {
      if (this.selectedFields.length === 1 && this.fields[i].selected === 1) return // Need at least one active
      this.fields[i].selected ^= 1
      this.dataChanged()
    },
    breadcrumbsUpdate (breadcrumbs) {
      this.$set(this, 'breadcrumbs', breadcrumbs)
    },
  },
}
</script>

<style scoped>
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
  .field-list > div:nth-child(2) > div {
    margin: 2px;
    border: 1px solid #060;
    padding: 4px 12px;
    cursor: pointer;
    text-align: center;
    background: #f8fff8;
    color: #060;
    transition: all 500ms;
  }
  .field-list > div:nth-child(2) > div.inactive {
    border-color: #600;
    color: #600;
    background: #fff8f8;
    opacity: 0.5;
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
