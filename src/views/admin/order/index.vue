<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-form ref="queryForm" :model="queryParams" :inline="true" label-width="88px">
          <el-form-item label="查询单号:" prop="id">
            <el-input
              v-model="queryParams.id"
              placeholder="请输入单号"
              clearable
              size="small"
            />
          </el-form-item>
          <el-form-item label="查询日期:">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd HH:mm:ss"
              :picker-options="pickerOptions"
            />
          </el-form-item>
          <el-form-item label="查询客户" prop="customerId">
            <el-select
              v-model="queryParams.customerId"
              placeholder="请选择或输入客户名称"
              clearable
              filterable
              remote
              reserve-keyword
              :remote-method="handleCustomerSearch"
              :loading="customerLoading"
              size="small"
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

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              v-permisaction="['admin:order:add']"
              type="primary"
              icon="el-icon-plus"
              size="mini"
              @click="handleAdd"
            >新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['admin:order:edit']"
              type="success"
              icon="el-icon-edit"
              size="mini"
              :disabled="single"
              @click="handleUpdate"
            >修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['admin:order:export']"
              type="warning"
              icon="el-icon-upload"
              size="mini"
              :loading="downloadLoading"
              :disabled="multiple"
              @click="handleExport"
            > {{ downloadLoading ? '导出中...' : '导出单据' }}
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['admin:order:remove']"
              type="danger"
              icon="el-icon-delete"
              size="mini"
              :disabled="multiple"
              @click="handleDelete"
            >删除
            </el-button>
          </el-col>
        </el-row>

        <el-table
          v-loading="loading"
          :data="orderList"
          :span-method="objectSpanMethod"
          border
          :default-sort="{ prop: 'createdAt', order: 'desc' }"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
        >
          <el-table-column type="selection" width="55" align="center" prop="selection" />
          <el-table-column
            label="开单时间"
            align="center"
            prop="createdAt"
            width="155px"
            sortable="custom"
          >
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单号" align="center" prop="id" />
          <el-table-column label="客户" align="center" prop="customerName" />
          <el-table-column label="品名/规格" prop="productName" align="center" />
          <el-table-column label="数量(个)" prop="productNum" align="center" />
          <el-table-column label="单价(元/个)" prop="singlePrice" align="center" />
          <el-table-column label="金额(元)" prop="price" align="center" />
          <el-table-column label="备注" prop="remark" align="center" />
          <el-table-column label="本期总额(元)" align="center" prop="totalAmount" />
          <el-table-column label="上期欠款(元)" align="center" prop="lastDebt" />
          <el-table-column label="已付款(元)" align="center" prop="paidAmount" />
          <el-table-column label="累计欠款(元)" align="center" prop="debt" />
          <el-table-column label="操作" align="center" prop="operation" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button
                v-permisaction="['admin:order:edit']"
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleUpdate(scope.row)"
              >修改
              </el-button>
              <el-popconfirm
                class="delete-popconfirm"
                title="确认要删除吗?"
                confirm-button-text="删除"
                @confirm="handleDelete(scope.row)"
              >
                <el-button
                  slot="reference"
                  v-permisaction="['admin:product:remove']"
                  size="mini"
                  type="text"
                  icon="el-icon-delete"
                >删除
                </el-button>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="total > 0"
          :total="total"
          :page.sync="queryParams.pageIndex"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />

        <!-- 添加或修改对话框 -->
        <el-dialog :title="title" :visible.sync="open" width="1300px">
          <el-form ref="form" :model="form" :rules="rules" label-width="150px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="客户" prop="customerId">
                  <el-select
                    v-model="form.customerId"
                    placeholder="请选择或输入客户名称"
                    clearable
                    filterable
                    remote
                    reserve-keyword
                    :remote-method="handleDialogCustomerSearch"
                    :loading="dialogCustomerLoading"
                    @visible-change="handleDialogCustomerDropdownVisible"
                    @change="handleCustomerSelect(form.customerId)"
                  >
                    <el-option
                      v-for="item in dialogCustomerOptions"
                      :key="item.key"
                      :label="item.value"
                      :value="item.key"
                    />
                    <div v-if="dialogCustomerHasMore && dialogCustomerOptions.length > 0" style="text-align: center; padding: 6px 0;">
                      <el-button type="text" size="mini" @click="loadMoreDialogCustomers">加载更多</el-button>
                    </div>
                    <el-option
                      v-if="!dialogCustomerLoading && dialogCustomerOptions.length === 0"
                      disabled
                      value=""
                      label="无匹配客户"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <!-- 明细表格 -->
            <el-form-item label="订单明细" required>
              <el-table :data="form.items" style="width: 120%">
                <el-table-column label="品名/规格" width="220">
                  <template slot-scope="scope">
                    <el-select
                      v-model="scope.row.productId"
                      placeholder="请选择产品"
                      filterable
                      clearable
                      @change="handleProductSelect(scope.$index, scope.row.productId)"
                    >
                      <el-option
                        v-for="item in productIdOptions"
                        :key="item.key"
                        :label="item.value"
                        :value="item.key"
                      />
                    </el-select>
                  </template>
                </el-table-column>

                <el-table-column label="数量(个)" width="160">
                  <template slot-scope="scope">
                    <el-input-number
                      v-model="scope.row.productNum"
                      :min="1"
                      :precision="0"
                      controls-position="right"
                      style="width: 100%"
                      @change="updateItemAmount(scope.$index)"
                    />
                  </template>
                </el-table-column>

                <el-table-column label="单价(元/个)" width="120">
                  <template slot-scope="scope">
                    <el-input
                      placeholder="0.0000"
                      :value="displayPrice('singlePrice',scope.$index)"
                      @input="handleDecimalInputItem('singlePrice', scope.$index, 6, 4, $event)"
                      @blur="formatFieldOnBlur('singlePrice', 4,scope.$index)"
                    />
                  </template>
                </el-table-column>

                <el-table-column label="金额(元)" width="150">
                  <template slot-scope="scope">
                    <el-input
                      placeholder="0.0000"
                      :value="displayPrice('price',scope.$index)"
                      @input="handlePriceInputItem('price', scope.$index, 10, 4, $event)"
                      @blur="formatFieldOnBlur('price', 4,scope.$index)"
                    />
                  </template>
                </el-table-column>

                <el-table-column label="备注" width="300">
                  <template slot-scope="scope">
                    <el-input
                      v-model="scope.row.remark"
                      placeholder="备注"
                      maxlength="50"
                      show-word-limit
                    />
                  </template>
                </el-table-column>

                <el-table-column label="操作" width="80">
                  <template slot-scope="scope">
                    <el-button
                      type="danger"
                      icon="el-icon-delete"
                      size="mini"
                      :disabled="form.items.length === 1"
                      @click="removeItem(scope.$index)"
                    />
                  </template>
                </el-table-column>
              </el-table>

              <el-row>
                <el-col :span="24" style="text-align: right; margin-top: 10px;">
                  <el-button type="primary" size="mini" @click="addItem">
                    + 添加产品
                  </el-button>
                </el-col>
              </el-row>
            </el-form-item>

            <el-form-item label="本期交易总额" prop="totalAmount">
              <el-input
                placeholder="自动计算或手动输入"
                style="width: 400px"
                :value="displayPrice('totalAmount')"
                @input="handleDebtInput('totalAmount', $event)"
                @blur="formatFieldOnBlur('totalAmount', 2)"
              />
            </el-form-item>

            <el-form-item label="上期欠款金额" prop="lastDebt">
              <el-input
                placeholder="0.00"
                style="width: 400px"
                :value="displayPrice('lastDebt')"
                @input="handleDebtInput('lastDebt', $event)"
                @blur="formatFieldOnBlur('lastDebt', 2)"
              />
            </el-form-item>

            <el-form-item label="已付款金额" prop="paidAmount">
              <el-input
                placeholder="0.00"
                style="width: 400px"
                :value="displayPrice('paidAmount')"
                @input="handleDebtInput('paidAmount', $event)"
                @blur="formatFieldOnBlur('paidAmount', 2)"
              />
            </el-form-item>
            <el-form-item label="开单累计欠款(元)">
              <el-input :value="cumulativeDebt" readonly style="width: 400px" />
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
import { addOrder, delOrder, getLastRecord, getOrder, listOrder, updateOrder, exportOrder } from '@/api/admin/order'
import { listProduct } from '@/api/admin/product'
import { listCustomer } from '@/api/admin/customer'
import Decimal from 'decimal.js'

export default {
  name: 'Order',
  components: {},
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      total: 0,
      title: '',
      open: false,
      isEdit: false,
      downloadLoading: false,
      orderList: [],
      productIdOptions: [],
      customerIdOptions: [],
      dateRange: [],
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        productId: undefined,
        customerId: undefined,
        createdAtOrder: 'desc'
      },
      // 客户下拉 - 查询页
      customerOptions: [],
      customerLoading: false,
      customerPage: 1,
      customerPageSize: 20,
      customerTotal: 0,
      customerName: '',
      customerHasMore: false,

      // 客户下拉 - 对话框内
      dialogCustomerOptions: [],
      dialogCustomerLoading: false,
      dialogCustomerPage: 1,
      dialogCustomerPageSize: 20,
      dialogCustomerTotal: 0,
      dialogCustomerName: '',
      dialogCustomerHasMore: false,
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
      form: {
        id: undefined,
        customerId: undefined,
        lastDebt: '',
        debt: '',
        paidAmount: '0',
        totalAmount: '',
        items: [
          {
            productId: undefined,
            singlePrice: '',
            productNum: 1,
            price: '',
            remark: ''
          }
        ]
      },
      rules: {
        customerId: [{ required: true, message: '客户不能为空', trigger: 'blur' }],
        lastDebt: [{ required: true, message: '上期欠款不能为空', trigger: 'blur' }],
        paidAmount: [{ required: true, message: '已付款不能为空', trigger: 'blur' }],
        totalAmount: [{ required: true, message: '本期交易总额不能为空', trigger: 'blur' }]
      },
      mergeColumns: [
        'selection',
        'id',
        'customerName',
        'totalAmount',
        'lastDebt',
        'paidAmount',
        'debt',
        'createdAt',
        'operation'
      ],
      spanArr: [], // 存储每行的合并行数
      pos: 0
    }
  },
  computed: {
    cumulativeDebt() {
      const last = this.form.lastDebt ? new Decimal(this.form.lastDebt) : new Decimal(0)
      const total = this.form.totalAmount ? new Decimal(this.form.totalAmount) : new Decimal(0)
      const paid = this.form.paidAmount ? new Decimal(this.form.paidAmount) : new Decimal(0)
      return last.plus(total).minus(paid).toDecimalPlaces(2, Decimal.ROUND_DOWN).toFixed(2).toString()
    }
  },
  watch: {
    orderList: {
      handler(newVal) {
        if (newVal && newVal.length) {
          this.getSpanArr(newVal)
        }
      },
      immediate: true
    }
  },
  created() {
    this.getList()
    this.getProductItems()
    // this.getCustomerItems()
  },
  methods: {
    getList() {
      this.loading = true
      listOrder(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.orderList = response.data.list
        this.total = response.data.count
        this.loading = false
      })
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      this.form = {
        id: undefined,
        customerId: undefined,
        lastDebt: '',
        paidAmount: '0',
        totalAmount: '',
        remark: '',
        items: [
          {
            productId: undefined,
            singlePrice: '',
            productNum: 1,
            price: '',
            remark: ''
          }
        ]
      }
      this.resetForm('form')
    },
    productIdFormat(row) {
      return this.selectItemsLabel(this.productIdOptions, row.productId)
    },
    customerIdFormat(row) {
      return this.selectItemsLabel(this.customerIdOptions, row.customerId)
    },
    getProductItems() {
      this.getItems(listProduct, { status: '2', pageSize: 9999 }).then(res => {
        this.productIdOptions = this.setItems(res, 'id', 'productName', ['price'])
      })
    },
    getCustomerItems() {
      this.getItems(listCustomer, { status: '2' }).then(res => {
        this.customerIdOptions = this.setItems(res, 'customerId', 'customerName')
      })
    },
    handleQuery() {
      this.queryParams.pageIndex = 1
      this.getList()
    },
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.queryParams['createdAtOrder'] = 'desc'
      this.handleQuery()
    },
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加订单'
      this.isEdit = false
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleSortChange(column) {
      const { prop, order } = column
      if (this.order && this.order !== prop + 'Order') {
        this.queryParams[this.order] = undefined
      }
      if (order === 'descending') {
        this.queryParams[prop + 'Order'] = 'desc'
        this.order = prop + 'Order'
      } else if (order === 'ascending') {
        this.queryParams[prop + 'Order'] = 'asc'
        this.order = prop + 'Order'
      } else {
        this.queryParams[prop + 'Order'] = undefined
      }
      this.getList()
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids[0]
      getOrder(id).then(response => {
        const data = response.data
        this.form = {
          id: data.id,
          customerId: data.customerId,
          lastDebt: data.lastDebt,
          paidAmount: data.paidAmount,
          totalAmount: data.totalAmount,
          items: (data.items || []).map(item => ({
            productId: item.productId,
            singlePrice: item.singlePrice,
            productNum: item.productNum,
            price: item.price,
            remark: item.remark
          }))
        }
        this.ensureCustomerInDialogOptions(data.customerId, data.customerName)
        this.open = true
        this.title = '修改订单'
        this.isEdit = true
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (!valid) return

        const hasInvalidItem = this.form.items.some(
          item => !item.productId || !item.singlePrice || !item.productNum || !item.price
        )
        if (hasInvalidItem) {
          this.$message.warning('请填写完整的订单明细')
          return
        }
        this.form.debt = this.cumulativeDebt
        const api = this.form.id ? updateOrder : addOrder
        api(this.form).then(response => {
          if (response.code === 200) {
            this.msgSuccess(response.msg)
            this.open = false
            this.getList()
          } else {
            this.msgError(response.msg)
          }
        })
      })
    },
    handleDelete(row) {
      const ids = (row.id && [row.id]) || [...new Set(this.ids)]
      this.$confirm(`是否确认删除编号为"${ids}"的数据项?`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => delOrder({ ids }))
        .then(response => {
          if (response.code === 200) {
            this.msgSuccess(response.msg)
            this.getList()
          } else {
            this.msgError(response.msg)
          }
        })
        .catch(() => {
        })
    },
    // 通用金额输入限制（主表）
    handleDebtInput(field, value) {
      if (value == null) {
        this.form[field] = ''
        return
      }
      let input = value.replace(/[^\d.]/g, '')
      const dots = input.split('.').length - 1
      if (dots > 1) {
        const i = input.indexOf('.')
        input = input.slice(0, i + 1) + input.slice(i + 1).replace(/\./g, '')
      }
      const [int, dec] = input.split('.')
      let res = (int || '').slice(0, 12)
      if (input.includes('.')) {
        res += '.' + (dec || '').slice(0, 2)
      }
      this.form[field] = res
    },
    // 明细行单价输入
    handleDecimalInputItem(field, index, maxInt, maxDec, value) {
      if (value == null) {
        this.form.items[index][field] = ''
        return
      }
      let input = value.replace(/[^\d.]/g, '')
      const dots = input.split('.').length - 1
      if (dots > 1) {
        const i = input.indexOf('.')
        input = input.slice(0, i + 1) + input.slice(i + 1).replace(/\./g, '')
      }
      const [int, dec] = input.split('.')
      let res = (int || '').slice(0, maxInt)
      if (input.includes('.')) {
        res += '.' + (dec || '').slice(0, maxDec)
      }
      this.form.items[index][field] = res
      this.updateItemAmount(index)
    },
    // 明细行金额输入
    handlePriceInputItem(field, index, maxInt, maxDec, value) {
      if (value == null) {
        this.form.items[index][field] = ''
        return
      }
      let input = value.replace(/[^\d.]/g, '')
      const dots = input.split('.').length - 1
      if (dots > 1) {
        const i = input.indexOf('.')
        input = input.slice(0, i + 1) + input.slice(i + 1).replace(/\./g, '')
      }
      const [int, dec] = input.split('.')
      let res = (int || '').slice(0, maxInt)
      if (input.includes('.')) {
        res += '.' + (dec || '').slice(0, maxDec)
      }
      this.form.items[index][field] = res
      this.recalcTotalAmount()
    },
    handleProductSelect(index, productId) {
      const item = this.form.items[index]
      const product = this.productIdOptions.find(p => p.key === productId)
      if (product) {
        item.singlePrice = product.price.toString()
        this.updateItemAmount(index)
      }
    },
    handleCustomerSelect(customerId) {
      getLastRecord(customerId).then(response => {
        const data = response.data
        if (data && data.debt) {
          this.form.lastDebt = data.debt
        }
      })
    },
    updateItemAmount(index) {
      const item = this.form.items[index]
      if (item.singlePrice && item.productNum) {
        try {
          const p = new Decimal(item.singlePrice)
          const n = new Decimal(item.productNum)
          item.price = p.mul(n).toDecimalPlaces(4, Decimal.ROUND_DOWN).toFixed(4).toString()
        } catch (e) {
          item.price = ''
        }
      } else {
        item.price = ''
      }
      this.recalcTotalAmount()
    },
    recalcTotalAmount() {
      let sum = new Decimal(0)
      for (const item of this.form.items) {
        if (item.price) {
          sum = sum.plus(new Decimal(item.price))
        }
      }
      this.form.totalAmount = sum.toDecimalPlaces(4, Decimal.ROUND_DOWN).toFixed(2).toString()
    },
    addItem() {
      this.form.items.push({
        productId: undefined,
        singlePrice: '',
        productNum: 1,
        price: '',
        remark: ''
      })
    },
    removeItem(index) {
      if (this.form.items.length > 1) {
        this.form.items.splice(index, 1)
        this.recalcTotalAmount()
      }
    },
    formatFieldOnBlur(field, precise, index) {
      let val
      if (index !== undefined) {
        val = this.form.items[index][field]
      } else {
        val = this.form[field]
      }
      if (val && val !== '') {
        const num = parseFloat(val)
        if (!isNaN(num)) {
          if (index !== undefined) {
            // 失焦时把 model 更新为格式化后的字符串（如 '12.3000'）
            this.form.items[index][field] = num.toFixed(precise)
          } else {
            this.form[field] = num.toFixed(precise)
          }
        }
      }
    },
    displayPrice(field, index) {
      if (index !== undefined) {
        return this.form.items[index][field]
      } else {
        return this.form[field]
      }
    },
    handleExport(row) {
      const ids = (row.id && [row.id]) || [...new Set(this.ids)]
      if (!ids) {
        this.$message.warning('请选中要导出的记录')
        return
      }
      const msg = ids.length === 1
        ? `编号为 "${ids[0]}" 的数据项`
        : `${ids.length} 条选中记录`
      this.$confirm(`是否确认导出 ${msg}?`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          // 用户点击了“确定”
          this.downloadLoading = true
          return exportOrder(ids)
        })
        .then(response => {
          // 接口请求成功
          const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          })

          let fileName = '导出单.xlsx'
          const contentDisposition = response.headers['content-disposition']
          if (contentDisposition) {
            const match = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^'"]*)['"]?/i)
            if (match && match[1]) {
              fileName = decodeURIComponent(match[1])
            }
          }
          // 下载文件
          if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            // IE
            window.navigator.msSaveOrOpenBlob(blob, fileName)
          } else {
            // 其他浏览器
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
          }
        })
        .catch(error => {
          if (error && error.message !== 'cancel') {
            this.$message.error('导出失败，请稍后重试')
            console.error('导出错误:', error)
          }
        })
        .finally(() => {
          this.downloadLoading = false
        })
    },
    // ========== 查询区域客户下拉 ==========
    handleCustomerDropdownVisible(visible) {
      if (visible) {
        this.customerPage = 1
        this.customerName = ''
        this.fetchCustomers({ customerName: '', page: 1 })
      } else {
        // 可选：清空临时数据（但会丢失已加载项，一般不清）
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
        const list = this.setItems(res || [], 'customerId', 'customerName')
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

    // ========== 对话框内客户下拉 ==========
    handleDialogCustomerDropdownVisible(visible) {
      if (visible) {
        this.dialogCustomerPage = 1
        this.dialogCustomerName = ''
        this.fetchDialogCustomers({ customerName: '', page: 1 })
      }
    },
    handleDialogCustomerSearch(query) {
      this.dialogCustomerName = query.trim()
      this.dialogCustomerPage = 1
      this.fetchDialogCustomers({ customerName: this.dialogCustomerName, page: 1 })
    },
    fetchDialogCustomers({ customerName, page }) {
      this.dialogCustomerLoading = true
      listCustomer({
        status: '2',
        customerName,
        pageIndex: page,
        pageSize: this.dialogCustomerPageSize
      }).then(res => {
        const list = this.setItems(res || [], 'customerId', 'customerName')
        this.dialogCustomerTotal = res.data.count || 0
        this.dialogCustomerHasMore = list.length + (page - 1) * this.dialogCustomerPageSize < this.dialogCustomerTotal

        if (page === 1) {
          this.dialogCustomerOptions = list
        } else {
          this.dialogCustomerOptions = [...this.dialogCustomerOptions, ...list]
        }
      }).finally(() => {
        this.dialogCustomerLoading = false
      })
    },
    loadMoreDialogCustomers() {
      this.dialogCustomerPage += 1
      this.fetchDialogCustomers({ keyword: this.dialogCustomerName, page: this.dialogCustomerPage })
    },
    ensureCustomerInDialogOptions(customerId, customerName) {
      // 检查是否已存在
      const exists = this.dialogCustomerOptions.some(opt => opt.key === customerId)
      if (!exists) {
        // 插入到顶部或末尾（建议顶部，方便看到）
        this.dialogCustomerOptions.unshift({
          key: customerId,
          value: customerName || `客户ID: ${customerId}`
        })
      }
    },
    // 初始化合并数组（每次数据变化时调用）
    getSpanArr(data) {
      this.spanArr = []
      this.pos = 0
      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          this.spanArr.push(1)
          this.pos = 0
        } else {
          // 判断当前行的 orderId 是否和上一行相同
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

    // Element UI 的 span-method 回调
    objectSpanMethod({ row, column, rowIndex, columnIndex }) {
      const prop = column.property
      // 只对指定列做合并
      if (this.mergeColumns.includes(prop)) {
        const rowspan = this.spanArr[rowIndex]
        const colspan = rowspan > 0 ? 1 : 0
        return {
          rowspan,
          colspan
        }
      }
      // 其他列（如单价、数量等）不合并
      return {
        rowspan: 1,
        colspan: 1
      }
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
