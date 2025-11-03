<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-form ref="queryForm" :model="queryParams" :inline="true" label-width="68px">
          <el-form-item label="产品" prop="productId">
            <el-select
              v-model="queryParams.productId"
              placeholder="请选择"
              clearable
              filterable
              size="small"
            >
              <el-option
                v-for="dict in productIdOptions"
                :key="dict.key"
                :label="dict.value"
                :value="dict.key"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="客户" prop="customerId">
            <el-select
              v-model="queryParams.customerId"
              placeholder="请选择"
              clearable
              filterable
              size="small"
            >
              <el-option
                v-for="dict in customerIdOptions"
                :key="dict.key"
                :label="dict.value"
                :value="dict.key"
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
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="客户" align="center" prop="customerId" :formatter="customerIdFormat" width="120" />
          <el-table-column label="本期总额(元)" align="center" prop="totalAmount" />
          <el-table-column label="上期欠款(元)" align="center" prop="lastDebt" />
          <el-table-column label="已付款(元)" align="center" prop="paidAmount" />
          <el-table-column label="累计欠款(元)" align="center" prop="debt" />
          <el-table-column
            label="创建时间"
            align="center"
            prop="createdAt"
            width="155px"
            sortable="custom"
          >
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
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
                  v-permisaction="['admin:order:remove']"
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
                    placeholder="请选择"
                    clearable
                    filterable
                    @change="handleCustomerSelect(form.customerId)"
                  >
                    <el-option
                      v-for="dict in customerIdOptions"
                      :key="dict.key"
                      :label="dict.value"
                      :value="dict.key"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <!-- 明细表格 -->
            <el-form-item label="订单明细" required>
              <el-table :data="form.items" style="width: 100%">
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

                <el-table-column label="单价(元/个)" width="200">
                  <template slot-scope="scope">
                    <el-input
                      placeholder="0.0000"
                      :value="displayPrice('singlePrice',scope.$index)"
                      @input="handleDecimalInputItem('singlePrice', scope.$index, 6, 4, $event)"
                      @blur="formatFieldOnBlur('singlePrice', 4,scope.$index)"
                    />
                  </template>
                </el-table-column>

                <el-table-column label="数量(个)" width="200">
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

                <el-table-column label="金额(元)" width="200">
                  <template slot-scope="scope">
                    <el-input
                      placeholder="0.0000"
                      :value="displayPrice('price',scope.$index)"
                      @input="handlePriceInputItem('price', scope.$index, 10, 4, $event)"
                      @blur="formatFieldOnBlur('price', 4,scope.$index)"
                    />
                  </template>
                </el-table-column>

                <el-table-column label="备注" width="200">
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
import { addOrder, delOrder, getLastRecord, getOrder, listOrder, updateOrder } from '@/api/admin/order'
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
      orderList: [],
      productIdOptions: [],
      customerIdOptions: [],
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        productId: undefined,
        customerId: undefined
      },
      form: {
        id: undefined,
        customerId: undefined,
        lastDebt: '',
        debt: '',
        paidAmount: '',
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
      }
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
  created() {
    console.log('✅ 正在加载我写的 index.vue！')
    this.getList()
    this.getProductItems()
    this.getCustomerItems()
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
        paidAmount: '',
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
      this.getItems(listProduct, undefined).then(res => {
        this.productIdOptions = this.setItems(res, 'id', 'productName', ['price'])
      })
    },
    getCustomerItems() {
      this.getItems(listCustomer, undefined).then(res => {
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
      const ids = (row.id && [row.id]) || this.ids
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
      const customer = this.customerIdOptions.find(c => c.key === customerId)
      if (customer) {
        getLastRecord(customerId).then(response => {
          const data = response.data
          if (data && data.debt) {
            this.form.lastDebt = data.debt
          }
        })
      }
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
    }
  }
}
</script>

<style scoped>
.delete-popconfirm ::v-deep .el-popconfirm__action {
  text-align: center;
}
</style>
