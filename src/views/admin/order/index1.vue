
<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-form ref="queryForm" :model="queryParams" :inline="true" label-width="68px">
          <el-form-item label="产品" prop="productId"><el-select
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
          <el-form-item label="客户" prop="customerId"><el-select
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
          <el-form-item label="备注" prop="remark"><el-input
            v-model="queryParams.remark"
            placeholder="请输入备注"
            clearable
            size="small"
            @keyup.enter.native="handleQuery"
          />
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

        <el-table v-loading="loading" :data="orderList" @selection-change="handleSelectionChange" @sort-change="handleSortChange">
          <el-table-column type="selection" width="55" align="center" /><el-table-column label="产品" align="center" prop="productId" :formatter="productIdFormat" width="100">
            <template slot-scope="scope">
              {{ productIdFormat(scope.row) }}
            </template>
          </el-table-column><el-table-column
            label="数量(个)"
            align="center"
            prop="productNum"
            :show-overflow-tooltip="true"
          /><el-table-column label="客户" align="center" prop="customerId" :formatter="customerIdFormat" width="100">
            <template slot-scope="scope">
              {{ customerIdFormat(scope.row) }}
            </template>
          </el-table-column><el-table-column
            label="总价(元)"
            align="center"
            prop="price"
            :show-overflow-tooltip="true"
          /><el-table-column
            label="备注"
            align="center"
            prop="remark"
            :show-overflow-tooltip="true"
          />
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
                slot="reference"
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
          v-show="total>0"
          :total="total"
          :page.sync="queryParams.pageIndex"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />

        <!-- 添加或修改对话框 -->
        <el-dialog :title="title" :visible.sync="open" width="500px">
          <el-form ref="form" :model="form" :rules="rules" label-width="80px">

            <el-form-item label="客户" prop="customerId">
              <el-select
                v-model="form.customerId"
                placeholder="请选择"
                clearable
                filterable
              >
                <el-option
                  v-for="dict in customerIdOptions"
                  :key="dict.key"
                  :label="dict.value"
                  :value="dict.key"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="产品" prop="productId">
              <el-select
                v-model="form.productId"
                placeholder="请选择"
                clearable
                filterable
                @change="handleProductChange"
              >
                <el-option
                  v-for="dict in productIdOptions"
                  :key="dict.key"
                  :label="dict.value"
                  :value="dict.key"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="产品单价" prop="singlePrice">
              <el-input
                v-model="form.singlePrice"
                placeholder="0.0000"
                @input="handleDecimalInput('singlePrice',6,4,$event)"
              />
            </el-form-item>

            <el-form-item label="数量(个)" prop="productNum">
              <el-input-number
                v-model="form.productNum"
                :min="1"
                :precision="0"
                :controls="true"
                placeholder="请输入数量"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="总价(元)" prop="price">
              <el-input
                v-model="form.price"
                placeholder="总价(元)"
                @input="handleDecimalInput('price',14,4,$event)"
              />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="form.remark"
                placeholder="备注"
              />
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

import { addOrder, delOrder, getOrder, listOrder, updateOrder } from '@/api/admin/order'

import { listProduct } from '@/api/admin/product'
import { listCustomer } from '@/api/admin/customer'
import Decimal from 'decimal.js'
export default {
  name: 'Order',
  components: {
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 总条数
      total: 0,
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      isEdit: false,
      // 类型数据字典
      typeOptions: [],
      orderList: [],

      // 关系表类型
      productIdOptions: [],
      customerIdOptions: [],
      pauseSinglePriceWatch: false,
      pauseProductNumWatch: false,

      // 查询参数
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        productId: undefined,
        customerId: undefined,
        remark: undefined

      },
      // 表单参数
      form: {
      },
      // 表单校验
      rules: { productId: [{ required: true, message: '产品不能为空', trigger: 'blur' }],
        customerId: [{ required: true, message: '客户不能为空', trigger: 'blur' }],
        productNum: [
          { required: true, message: '请输入数量', trigger: 'blur' },
          {
            pattern: /^[1-9]\d*$/,
            message: '数量必须为正整数',
            trigger: 'blur'
          }
        ],
        singlePrice: [{ required: true, message: '单价不能为空', trigger: 'blur' }],
        price: [{ required: true, message: '总价不能为空', trigger: 'blur' }]
      }
    }
  },
  watch: {
    'form.singlePrice'() {
      if (!this.pauseSinglePriceWatch) {
        this.updatePrice()
      } else {
        this.pauseSinglePriceWatch = false
      }
    },
    'form.productNum'() {
      if (!this.pauseProductNumWatch) {
        this.updatePrice()
      } else {
        this.pauseProductNumWatch = false
      }
    }
  },
  created() {
    console.log('✅ 正在加载我写的 index.vue！') // ← 加这行
    this.getList()
    this.getProductItems()
    this.getCustomerItems()
  },
  methods: {
    /** 查询参数列表 */
    getList() {
      this.loading = true
      listOrder(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.orderList = response.data.list
        this.total = response.data.count
        this.loading = false
      }
      )
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {

        id: undefined,
        productId: undefined,
        productNum: undefined,
        customerId: undefined,
        singlePrice: undefined,
        price: undefined,
        remark: undefined
      }
      this.resetForm('form')
    },
    getImgList: function() {
      this.form[this.fileIndex] = this.$refs['fileChoose'].resultList[0].fullUrl
    },
    fileClose: function() {
      this.fileOpen = false
    },
    productIdFormat(row) {
      return this.selectItemsLabel(this.productIdOptions, row.productId)
    },
    customerIdFormat(row) {
      return this.selectItemsLabel(this.customerIdOptions, row.customerId)
    },
    // 关系
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
    // 文件
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageIndex = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.handleQuery()
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加订单'
      this.isEdit = false
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 排序回调函数 */
    handleSortChange(column, prop, order) {
      prop = column.prop
      order = column.order
      if (this.order !== '' && this.order !== prop + 'Order') {
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
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id =
                row.id || this.ids
      getOrder(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改订单'
        this.isEdit = true
        this.pauseSinglePriceWatch = true
        this.pauseProductNumWatch = true
      })
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateOrder(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess(response.msg)
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          } else {
            addOrder(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess(response.msg)
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      var Ids = (row.id && [row.id]) || this.ids

      this.$confirm('是否确认删除编号为"' + Ids + '"的数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return delOrder({ 'ids': Ids })
      }).then((response) => {
        if (response.code === 200) {
          this.msgSuccess(response.msg)
          this.open = false
          this.getList()
        } else {
          this.msgError(response.msg)
        }
      }).catch(function() {
      })
    },
    handleDecimalInput(field, maxInteger, maxDecimal, value) {
      if (value == null) {
        this.form[field] = ''
        return
      }

      // 只保留数字和小数点，并确保最多一个小数点
      let input = value.replace(/[^\d.]/g, '')
      const dots = input.split('.').length - 1
      if (dots > 1) {
        // 保留第一个点之后的所有非点字符
        const firstDotIndex = input.indexOf('.')
        input = input.substring(0, firstDotIndex + 1) + input.substring(firstDotIndex + 1).replace(/\./g, '')
      }

      const [integer, decimal] = input.split('.')

      // 限制整数位
      let result = (integer || '').slice(0, maxInteger)

      // 如果用户输入了小数点（即使后面没数字），保留它
      if (input.includes('.')) {
        const dec = (decimal || '').slice(0, maxDecimal)
        result += '.' + dec
      }

      this.form[field] = result
    },
    handleProductChange(productId) {
      // 根据 productId 找到对应的选项
      const selected = this.productIdOptions.find(item => item.key === productId)

      if (selected) {
        // 自动填充价格（保留小数或格式化按需处理）
        this.form.singlePrice = selected.price.toString()
      } else {
        // 如果没选中（比如清空），清空价格
        this.form.singlePrice = ''
      }
    },
    updatePrice() {
      const { singlePrice, productNum } = this.form
      if (!singlePrice || !productNum) {
        this.form.price = ''
        return
      }

      try {
        const p = new Decimal(singlePrice)
        const n = new Decimal(productNum)
        const total = p.mul(n)

        // 向下截断，保留4位小数（匹配 decimal(12,4)）
        this.form.price = total.toDecimalPlaces(4, Decimal.ROUND_DOWN).toString()
      } catch (e) {
        console.info(e)
        this.form.price = ''
      }
    }
  }
}
</script>
