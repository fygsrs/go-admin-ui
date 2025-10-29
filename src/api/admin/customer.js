import request from '@/utils/request'

// 查询Customer列表
export function listCustomer(query) {
  return request({
    url: '/api/v1/customer',
    method: 'get',
    params: query
  })
}

// 查询Customer详细
export function getCustomer(customerId) {
  return request({
    url: '/api/v1/customer/' + customerId,
    method: 'get'
  })
}

// 新增Customer
export function addCustomer(data) {
  return request({
    url: '/api/v1/customer',
    method: 'post',
    data: data
  })
}

// 修改Customer
export function updateCustomer(data) {
  return request({
    url: '/api/v1/customer/' + data.customerId,
    method: 'put',
    data: data
  })
}

// 删除Customer
export function delCustomer(data) {
  return request({
    url: '/api/v1/customer',
    method: 'delete',
    data: data
  })
}

// 修改客户状态
export function changeCustomerStatus(e) {
  const data = {
    customerId: e.customerId,
    status: e.status
  }
  return request({
    url: '/api/v1/customer/status',
    method: 'put',
    data: data
  }).then(response => {
    if (response.code !== 200) {
      // 抛出错误，让 Promise 变成 reject
      return Promise.reject(new Error(response.msg || '操作失败'))
    }
    return response
  })
}

