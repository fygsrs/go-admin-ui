<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-form :model="queryParams" :inline="true" label-width="88px">
          <el-form-item label="统计类型:" prop="type">
            <el-select v-model="queryParams.type" size="small" @change="handleQuery">
              <el-option :value="1" label="每日" />
              <el-option :value="2" label="月度" />
              <el-option :value="3" label="年度" />
            </el-select>
          </el-form-item>

          <el-form-item label="统计日期:">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd HH:mm:ss"
              :picker-options="pickerOptions"
              @change="handleDateChange"
            />
          </el-form-item>

          <el-form-item label="客户:" prop="customerId">
            <el-select
              v-model="queryParams.customerId"
              placeholder="请选择客户"
              clearable
              filterable
              remote
              reserve-keyword
              :remote-method="handleCustomerSearch"
              :loading="customerLoading"
              size="small"
              @clear="handleClearCustomer"
              @visible-change="handleCustomerDropdownVisible"
            >
              <el-option
                v-for="item in customerOptions"
                :key="item.key"
                :label="item.value"
                :value="item.key"
              />
              <div v-if="customerHasMore && customerOptions.length > 0" style="text-align: center; padding: 6px 0;">
                <el-button type="text" size="mini" @click="loadMoreCustomers">加载更多</el-button>
              </div>
              <el-option
                v-if="!customerLoading && customerOptions.length === 0"
                disabled
                value=""
                label="无匹配客户"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table
          ref="table"
          v-loading="loading"
          :data="statList"
          :span-method="objectSpanMethod"
          border
        >
          <el-table-column label="统计日期" align="center" prop="statTime" width="120" />
          <el-table-column label="客户名" align="center" prop="customerName" />
          <el-table-column label="成交额(元)" align="center" prop="totalAmount" />
          <el-table-column label="开单数" align="center" prop="orderNum" />
          <el-table-column label="产品名称" align="center" prop="productName" />
          <el-table-column label="产品累计数量" align="center" prop="productNum" />
        </el-table>
        <!-- 分页组件 -->
        <div class="pagination-container" style="margin-top: 16px; text-align: right;">
          <el-pagination
            :current-page="pageNum"
            :page-size="pageSize"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            :page-sizes="[10, 20, 50, 100]"
            @size-change="handlePageSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { listCustomer } from '@/api/admin/customer'
import { getStatTable } from '@/api/admin/order'

export default {
  name: 'OrderStat',
  data() {
    return {
      loading: false,
      statList: [],
      dateRange: [],
      total: 0, // 总条数
      pageNum: 1, // 当前页码
      pageSize: 10,
      queryParams: {
        type: 1, // 默认每日
        start: '',
        end: '',
        customerId: undefined,
        pageIndex: 1, // 新增
        pageSize: 10 // 新增
      },
      // 客户下拉
      customerOptions: [],
      customerLoading: false,
      customerPage: 1,
      customerPageSize: 20,
      customerTotal: 0,
      customerName: '',
      customerHasMore: false,

      pickerOptions: {
        shortcuts: [
          {
            text: '当日',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setHours(0, 0, 0, 0)
              // 结束时间设为当天 23:59:59.999
              end.setHours(23, 59, 59, 999)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近一天',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 1)
              start.setHours(0, 0, 0, 0)
              // 结束时间设为当天 23:59:59.999
              end.setHours(23, 59, 59, 999)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近一周',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
              start.setHours(0, 0, 0, 0)
              // 结束时间设为当天 23:59:59.999
              end.setHours(23, 59, 59, 999)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近一个月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
              start.setHours(0, 0, 0, 0)
              // 结束时间设为当天 23:59:59.999
              end.setHours(23, 59, 59, 999)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近一年',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setFullYear(start.getFullYear() - 1)
              start.setHours(0, 0, 0, 0)
              // 结束时间设为当天 23:59:59.999
              end.setHours(23, 59, 59, 999)
              // 可选：确保是完整的一年（考虑闰年）
              // 如果今天是 2025-02-29，去年可能是 2024-02-29（合法）
              picker.$emit('pick', [start, end])
            }
          }
        ]
      },

      mergeColumns: ['statTime', 'customerName', 'totalAmount', 'orderNum'],
      spanArr: [],
      pos: 0
    }
  },
  created() {
    this.initDateRange()
    this.handleQuery()
    this.fetchCustomers({ customerName: '', page: 1 })
  },
  methods: {
    // 每页条数改变
    handlePageSizeChange(val) {
      this.pageSize = val
      this.pageNum = 1 // 重置到第一页
      this.handleQuery()
    },

    // 页码改变
    handlePageChange(val) {
      this.pageNum = val
      this.handleQuery()
    },

    // 重置时也要重置分页
    resetQuery() {
      this.dateRange = []
      this.queryParams = {
        type: 1,
        start: '',
        end: '',
        customerId: undefined,
        pageIndex: 1,
        pageSize: 10
      }
      this.pageNum = 1
      this.pageSize = 10
      this.initDateRange()
      this.handleQuery()
    },
    handleClearCustomer() {
      this.queryParams.customerId = undefined
    },
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0') // 月份从0开始
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    initDateRange() {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30) // 30天前

      this.dateRange = [start, end]

      // 格式化为 yyyy-MM-dd HH:mm:ss 字符串
      this.queryParams.start = this.formatDate(start)
      this.queryParams.end = this.formatDate(end)
    },
    handleDateChange(val) {
      if (val) {
        this.queryParams.start = val[0]
        this.queryParams.end = val[1]
      } else {
        this.queryParams.start = ''
        this.queryParams.end = ''
      }
    },
    handleQuery() {
      // 同步分页参数到 queryParams
      this.queryParams.pageIndex = this.pageNum
      this.queryParams.pageSize = this.pageSize

      this.loading = true
      getStatTable(this.queryParams).then(res => {
        if (res.code === 200) {
          this.statList = res.data.list || []
          this.total = res.data.count || 0
          this.getSpanArr(this.statList)
        } else {
          this.statList = []
          this.total = 0
          this.$message.warning(res.msg || '获取失败')
        }
        this.loading = false
      }).catch(err => {
        console.error(err)
        this.loading = false
        this.statList = []
        this.total = 0
        this.$message.error('请求失败')
      })
    },

    // ========== 客户下拉 ==========
    handleCustomerDropdownVisible(visible) {
      if (visible) {
        this.customerPage = 1
        this.customerName = ''
        this.fetchCustomers({ customerName: '', page: 1 })
      }
    },
    handleCustomerSearch(query) {
      this.customerName = query.trim()
      this.customerPage = 1
      this.fetchCustomers({ customerName: this.customerName, page: 1 })
    },
    fetchCustomers({ customerName, page }) {
      this.customerLoading = true
      listCustomer({
        status: '2',
        customerName,
        pageIndex: page,
        pageSize: this.customerPageSize
      }).then(res => {
        const list = (res.data.list || []).map(item => ({
          key: item.customerId,
          value: item.customerName
        }))
        this.customerTotal = res.data.count || 0
        this.customerHasMore = list.length + (page - 1) * this.customerPageSize < this.customerTotal

        if (page === 1) {
          this.customerOptions = list
        } else {
          this.customerOptions = [...this.customerOptions, ...list]
        }
      }).finally(() => {
        this.customerLoading = false
      })
    },
    loadMoreCustomers() {
      this.customerPage += 1
      this.fetchCustomers({ customerName: this.customerName, page: this.customerPage })
    },

    // ========== 行合并逻辑 ==========
    getSpanArr(data) {
      this.spanArr = []
      this.pos = 0
      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          this.spanArr.push(1)
          this.pos = 0
        } else {
          if (data[i].id === data[i - 1].id) {
            this.spanArr[this.pos] += 1
            this.spanArr.push(0)
          } else {
            this.spanArr.push(1)
            this.pos = i
          }
        }
      }
    },
    objectSpanMethod({ rowIndex, columnIndex }) {
      const prop = this.$refs.table.columns[columnIndex]?.property
      if (this.mergeColumns.includes(prop)) {
        const rowspan = this.spanArr[rowIndex]
        return {
          rowspan: rowspan,
          colspan: rowspan > 0 ? 1 : 0
        }
      }
      return { rowspan: 1, colspan: 1 }
    }
  }
}
</script>

<style scoped>
/* 表头和单元格：确保有下边框 */
::v-deep .expand-table-wrapper .el-table__header th,
::v-deep .expand-table-wrapper .el-table__body td {
  border-bottom: 3px solid #e5e5e5 !important;
  border-right: 3px solid #e5e5e5 !important;
}

/* 第一列左侧边框（可选） */
::v-deep .expand-table-wrapper .el-table__header th:first-child,
::v-deep .expand-table-wrapper .el-table__body td:first-child {
  border-left: 3px solid #e5e5e5 !important;
}

/* 表格外边框 */
::v-deep .expand-table-wrapper .el-table {
//border: 3px solid #e5e5e5 !important;
  border-top: none !important; /* 避免和表头重复 */
}

/* 表头背景 */
::v-deep .expand-table-wrapper .el-table__header th {
  background-color: #8cc5ff !important;
  color: #333 !important;
  font-weight: bold !important;
}

/* 注意：scoped 可能导致样式不生效，必要时使用 ::v-deep 或全局样式 */
::v-deep .el-table--border,
::v-deep .el-table--border th,
::v-deep .el-table--border td {
  border-color: #d1d1d1 !important; /* 改为黑色 */
  border-width: 1px !important;  /* 确保是 1px 或更粗 */
}

/* 如果你想加粗外边框 */
::v-deep .el-table--border {
  border: 1px solid #d1d1d1	 !important;
}
</style>
