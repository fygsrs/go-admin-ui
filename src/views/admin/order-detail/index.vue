<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <!-- 查询表单 -->
        <el-form ref="queryForm" :model="queryParams" :inline="true" label-width="88px">
          <el-form-item label="单号" prop="orderId">
            <el-input v-model="queryParams.orderId" placeholder="请输入单号" clearable size="small" @keyup.enter.native="handleQuery" />
          </el-form-item>

          <el-form-item label="产品" prop="productId">
            <el-select v-model="queryParams.productId" placeholder="请选择产品" size="small" clearable filterable>
              <el-option
                v-for="item in productIdOptions"
                :key="item.key"
                :label="item.value"
                :value="item.key"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="客户" prop="customerId">
            <el-select v-model="queryParams.customerId" placeholder="请选择客户" size="small" clearable filterable>
              <el-option
                v-for="item in customerIdOptions"
                :key="item.key"
                :label="item.value"
                :value="item.key"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="开单时间">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd HH:mm:ss"
              size="small"
              :picker-options="pickerOptions"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 表格 -->
        <el-table
          v-loading="loading"
          :data="orderDetailList"
          border
          default-sort="{ prop: 'createdAt', order: 'descending' }"
          @sort-change="handleSortChange"
        >
          <el-table-column label="开单时间" align="center" prop="createdAt" sortable width="160">
            <template slot-scope="scope">
              {{ parseTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="单号" align="center" prop="orderId" />
          <el-table-column label="客户名" align="center" prop="customerName" />
          <el-table-column label="品名/规格" align="center" prop="productName" />
          <el-table-column label="数量(个)" align="center" prop="productNum" />
          <el-table-column label="单价(元/个)" align="center" prop="singlePrice" />
          <el-table-column label="金额(元)" align="center" prop="price" />
          <el-table-column label="备注" align="center" prop="remark" />

          <!-- 操作列（可选保留） -->
        </el-table>

        <!-- 分页 -->
        <pagination
          v-show="total > 0"
          :total="total"
          :page.sync="queryParams.pageIndex"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />

        <!-- 新增/编辑弹窗 -->
        <el-dialog :title="title" :visible.sync="open" width="500px">
          <el-form ref="form" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="单号" prop="orderId">
              <el-input v-model.number="form.orderId" placeholder="请输入单号" />
            </el-form-item>
            <el-form-item label="产品" prop="productId">
              <el-select v-model="form.productId" placeholder="请选择产品">
                <el-option
                  v-for="item in productIdOptions"
                  :key="item.key"
                  :label="item.value"
                  :value="item.key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="客户" prop="customerId">
              <el-select v-model="form.customerId" placeholder="请选择客户">
                <el-option
                  v-for="item in customerIdOptions"
                  :key="item.key"
                  :label="item.value"
                  :value="item.key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="数量" prop="productNum">
              <el-input-number v-model="form.productNum" :min="1" controls-position="right" style="width: 100%" />
            </el-form-item>
            <el-form-item label="单价(元)" prop="singlePrice">
              <el-input v-model="form.singlePrice" placeholder="0.0000" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" maxlength="100" show-word-limit />
            </el-form-item>
          </el-form>
          <div slot="footer" class="dialog-footer">
            <el-button type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="cancel">取 消</el-button>
          </div>
        </el-dialog>
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { addOrderDetail, delOrderDetail, getOrderDetail, listOrderDetail, updateOrderDetail } from '@/api/admin/order-detail'
import { listProduct } from '@/api/admin/product'
import { listCustomer } from '@/api/admin/customer'

export default {
  name: 'OrderDetail',
  data() {
    return {
      loading: true,
      total: 0,
      open: false,
      title: '',
      isEdit: false,
      orderDetailList: [],
      productIdOptions: [],
      customerIdOptions: [],
      dateRange: [],
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        orderId: undefined,
        productId: undefined,
        customerId: undefined,
        createdAtOrder: 'desc' // 默认降序
      },
      form: {
        id: undefined,
        orderId: undefined,
        productId: undefined,
        customerId: undefined,
        productNum: 1,
        singlePrice: '',
        remark: ''
      },
      rules: {
        orderId: [{ required: true, message: '单号不能为空', trigger: 'blur' }],
        productId: [{ required: true, message: '产品不能为空', trigger: 'change' }],
        customerId: [{ required: true, message: '客户不能为空', trigger: 'change' }],
        productNum: [{ required: true, message: '数量不能为空', trigger: 'blur' }],
        singlePrice: [{ required: true, message: '单价不能为空', trigger: 'blur' }]
      },
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
      }
    }
  },
  created() {
    this.getList()
    this.getProductItems()
    this.getCustomerItems()
  },
  methods: {
    getList() {
      this.loading = true
      listOrderDetail(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.orderDetailList = response.data.list
        this.total = response.data.count
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageIndex = 1
      this.getList()
    },
    resetQuery() {
      this.dateRange = []
      this.$refs.queryForm.resetFields()
      this.queryParams.createdAtOrder = 'desc'
      this.handleQuery()
    },
    handleSortChange({ prop, order }) {
      if (prop === 'createdAt') {
        this.queryParams.createdAtOrder = order === 'descending' ? 'desc' : 'asc'
        this.getList()
      }
    },
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '新增订单明细'
      this.isEdit = false
    },
    handleUpdate(row) {
      getOrderDetail(row.id).then(response => {
        this.form = { ...response.data }
        this.open = true
        this.title = '修改订单明细'
        this.isEdit = true
      })
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid) return
        const api = this.form.id ? updateOrderDetail : addOrderDetail
        api(this.form).then(res => {
          if (res.code === 200) {
            this.msgSuccess(res.msg)
            this.open = false
            this.getList()
          } else {
            this.msgError(res.msg)
          }
        })
      })
    },
    handleDelete(row) {
      this.$confirm(`确认删除该订单明细？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        delOrderDetail({ ids: [row.id] }).then(res => {
          if (res.code === 200) {
            this.msgSuccess(res.msg)
            this.getList()
          }
        })
      })
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      this.form = {
        id: undefined,
        orderId: undefined,
        productId: undefined,
        customerId: undefined,
        productNum: 1,
        singlePrice: '',
        remark: ''
      }
      this.$refs.form && this.$refs.form.resetFields()
    },
    getProductItems() {
      listProduct({ status: '2', pageSize: 9999 }).then(res => {
        this.productIdOptions = (res.data.list || []).map(item => ({
          key: item.id,
          value: item.productName
        }))
      })
    },
    getCustomerItems() {
      listCustomer({ status: '2', pageSize: 9999 }).then(res => {
        this.customerIdOptions = (res.data.list || []).map(item => ({
          key: item.customerId,
          value: item.customerName
        }))
      })
    }
  }
}
</script>
