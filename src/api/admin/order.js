import request from '@/utils/request'

// 查询Order列表
export function listOrder(query) {
  return request({
    url: '/api/v1/order',
    method: 'get',
    params: query
  })
}

// 查询Order详细
export function getOrder(id) {
  return request({
    url: '/api/v1/order/' + id,
    method: 'get'
  })
}

// 查询Order详细
export function getLastRecord(customerId) {
  return request({
    url: '/api/v1/order/getLastRecord/' + customerId,
    method: 'get'
  })
}

// 新增Order
export function addOrder(data) {
  return request({
    url: '/api/v1/order',
    method: 'post',
    data: data
  })
}

// 修改Order
export function updateOrder(data) {
  return request({
    url: '/api/v1/order/' + data.id,
    method: 'put',
    data: data
  })
}

// 删除Order
export function delOrder(data) {
  return request({
    url: '/api/v1/order',
    method: 'delete',
    data: data
  })
}

