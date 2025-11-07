<template>
  <div :style="{ padding: '0 0 32px 32px' }">
    <h4 :style="{ marginBottom: '20px' }">{{ title }}</h4>
    <div ref="chartDom" :style="{ height: '254px', width: '100%' }" />
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'Bar',
  props: {
    title: {
      type: String,
      default: ''
    },
    list: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  data() {
    return {
      chart: null
    }
  },
  watch: {
    list: {
      handler() {
        this.renderChart()
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {
    this.initChart()
  },
  beforeUnmount() {
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
    window.removeEventListener('resize', this.chart?.resize)
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chartDom)
      this.chart.on('click', (params) => {
        if (params.componentType === 'series') {
          const originalItem = this.list.find(item => item.x === params.name)
          this.$emit('bar-click', {
            x: params.name,
            y: originalItem ? originalItem.y : params.value
          })
        }
      })
      window.addEventListener('resize', () => {
        this.chart?.resize()
      })
    },
    renderChart() {
      if (!this.chart || !this.list.length) return

      const categories = this.list.map(item => item.x)
      const values = this.list.map(item => parseFloat(item.y) || 0)

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'none' },
          formatter: (params) => {
            const param = params[0]
            const original = this.list.find(item => item.x === param.name)
            return `日期：${param.name}<br/>值：${original ? original.y : param.value}`
          },
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderColor: 'transparent',
          borderRadius: 4,
          textStyle: { color: '#fff' }
        },
        grid: {
          left: '5', // ←←← 关键：减少左侧边距（原为 '10%'，现在固定 30px）
          right: '20',
          bottom: '30',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisTick: { show: true },
          axisLine: {
            show: true,
            lineStyle: { color: '#ccc' }
          },
          axisLabel: {
            color: '#666',
            fontSize: 12 // ←←← 增大字体
          }
        },
        yAxis: {
          type: 'value',
          axisTick: { show: true },
          axisLine: {
            show: false,
            lineStyle: { color: '#ccc' }
          },
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed', // ← 虚线
              color: '#eee', // 可选：调整颜色更柔和
              width: 2 // 可选：线宽
            }
          },
          axisLabel: {
            color: '#666',
            fontSize: 12
          }
        },
        series: [{
          type: 'bar',
          barWidth: '40%',
          data: values,
          itemStyle: {
            color: '#1890FF'
          },
          emphasis: {
            itemStyle: {
              color: '#40A9FF'
            }
          }
        }]
      }

      this.chart.setOption(option, true)
    }
  }
}
</script>
