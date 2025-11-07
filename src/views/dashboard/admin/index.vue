<template>
  <div class="dashboard-editor-container">
    <el-row :gutter="12">
      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card title="总销售额" total="￥126,560">
          <el-tooltip slot="action" class="item" effect="dark" content="指标说明" placement="top-start">
            <i class="el-icon-warning-outline" />
          </el-tooltip>
          <div>
            <trend flag="top" style="margin-right: 16px;" rate="12">
              <span slot="term">周同比</span>
            </trend>
            <trend flag="bottom" rate="11">
              <span slot="term">日同比</span>
            </trend>
          </div>
          <template slot="footer">日均销售额<span>￥ 234.56</span></template>
        </chart-card>
      </el-col>
      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card title="访问量" :total="8846">
          <el-tooltip slot="action" class="item" effect="dark" content="指标说明" placement="top-start">
            <i class="el-icon-warning-outline" />
          </el-tooltip>
          <div>
            <mini-area />
          </div>
          <template slot="footer">日访问量<span> {{ '1234' }}</span></template>
        </chart-card>
      </el-col>
      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card title="支付笔数" :total="6560">
          <el-tooltip slot="action" class="item" effect="dark" content="指标说明" placement="top-start">
            <i class="el-icon-warning-outline" />
          </el-tooltip>
          <div>
            <mini-bar />
          </div>
          <template slot="footer">转化率 <span>60%</span></template>
        </chart-card>
      </el-col>
      <el-col :sm="24" :xs="24" :md="6" :xl="6" :lg="6" :style="{ marginBottom: '12px' }">
        <chart-card title="运营活动效果" total="78%">
          <el-tooltip slot="action" class="item" effect="dark" content="指标说明" placement="top-start">
            <i class="el-icon-warning-outline" />
          </el-tooltip>
          <div>
            <mini-progress color="rgb(19, 194, 194)" :target="80" :percentage="78" height="8px" />
          </div>
          <template slot="footer">
            <trend flag="top" style="margin-right: 16px;" rate="12">
              <span slot="term">同周比</span>
            </trend>
            <trend flag="bottom" rate="80">
              <span slot="term">日环比</span>
            </trend>
          </template>
        </chart-card>
      </el-col>
    </el-row>
    <el-card :bordered="false" :body-style="{ padding: '0' }">
      <div class="salesCard">
        <!-- 切换日/月/年 -->
        <el-tabs v-model="activeTab" @tab-click="handleTabChange">
          <el-tab-pane label="日开单额" name="1" />
          <el-tab-pane label="月开单额" name="2" />
          <el-tab-pane label="年开单额" name="3" />
        </el-tabs>

        <el-row>
          <!-- 主柱状图 -->
          <el-col :xl="16" :lg="12" :md="12" :sm="24" :xs="24">
            <bar
              :list="mainChartData"
              :title="tabTitles[activeTab]"
              :vertical="true"
              @bar-click="handleBarClick"
            />
          </el-col>
          <el-col :xl="8" :lg="12" :md="12" :sm="24" :xs="24">
            <h4 v-if="rankTitle" class="rank-title">{{ rankTitle }}</h4>
            <rank-list :list="customerData" class="rank-col" />
          </el-col>
        </el-row>

        <!-- 客户明细横向柱状图（仅当有选中时间时显示） -->
        <!--        <el-row v-if="selectedTime" style="margin-top: 24px;">-->
        <!--          <el-col :span="24">-->
        <!--            <h4 style="padding-left: 16px; margin-bottom: 12px;">-->
        <!--              {{ selectedTimeLabel }} 客户开单明细-->
        <!--            </h4>-->
        <!--            <bar-->
        <!--              :list="customerData"-->
        <!--              title=""-->
        <!--              :vertical="true"-->
        <!--            />-->
        <!--          </el-col>-->
        <!--        </el-row>-->
      </div>
    </el-card>
  </div>
</template>

<script>
import { getOrderStat, getOrderCustomerStat } from '@/api/admin/order'
import Bar from '@/components/Bar2.vue'
import RankList from '@/components/RankList/index'
import MiniArea from '@/components/MiniArea/index.vue'
import Trend from '@/components/Trend/index.vue'
import MiniProgress from '@/components/MiniProgress/index.vue'
import MiniBar from '@/components/MiniBar/index.vue'
import ChartCard from '@/components/ChartCard/index.vue'

export default {
  name: 'DashboardAdmin',
  components: {
    ChartCard, MiniBar, MiniProgress, Trend, MiniArea,
    RankList,
    Bar
  },
  data() {
    return {
      activeTab: '1', // 默认日
      tabTitles: {
        '1': '日开单额',
        '2': '月开单额',
        '3': '年开单额'
      },
      mainChartData: [],
      customerData: [],
      selectedTime: null, // 如 "20251107"
      selectedTimeLabel: '',
      rankTitle: ''
    }
  },
  async mounted() {
    await this.loadMainChart()
  },
  methods: {
    // 切换 Tab 时重新加载主图表
    async handleTabChange(tab) {
      this.selectedTime = null
      this.customerData = []
      await this.loadMainChart()
    },
    getLimit(type) {
      if (type === 1) {
        return 31
      } else if (type === 2) {
        return 12
      } else if (type === 3) {
        return 10
      }
      return 10
    },

    // 加载日/月/年总览数据
    async loadMainChart() {
      try {
        const res = await getOrderStat({
          type: parseInt(this.activeTab),
          limit: this.getLimit(parseInt(this.activeTab))
        })
        if (res.code === 200) {
          // 转换后端数据格式为 Bar 组件需要的 { x, y }
          this.mainChartData = res.data.map(item => ({
            x: item.time,
            y: item.amount
          }))
        }
      } catch (error) {
        console.error('加载统计失败', error)
        this.$message.error('加载数据失败')
      }
    },

    // 点击主柱状图某一项
    async handleBarClick(item) {
      const timeStr = item.x // 如 "2025", "202511", "20251107"

      // 根据 type 补全时间格式（后端要求）

      this.selectedTime = timeStr
      this.rankTitle = '客户交易额排行榜（' + timeStr + '）'

      // 加载客户明细
      try {
        const res = await getOrderCustomerStat({
          type: parseInt(this.activeTab),
          time: timeStr
        })
        if (res.code === 200) {
          this.customerData = res.data.map(item => ({
            name: item.customerName,
            total: item.totalAmount
          }))
        }
      } catch (error) {
        console.error('加载客户明细失败', error)
        this.$message.error('加载客户明细失败')
        this.customerData = []
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-editor-container {
  padding: 12px;
  background-color: rgb(240, 242, 245);
  position: relative;

  .github-corner {
    position: absolute;
    top: 0;
    border: 0;
    right: 0;
  }

  .chart-wrapper {
    background: #fff;
    padding: 16px 16px 0;
    margin-bottom: 32px;
  }
}

::v-deep .el-tabs__item{
   padding-left: 16px!important;
   height: 50px;
   line-height: 50px;
}

@media (max-width:1024px) {
  .chart-wrapper {
    padding: 8px;
  }
}

.rank-col {
  height: 380px;
  overflow-y: auto;
  padding-right: 8px; /* 可选：避免滚动条遮挡内容 */
}
</style>
