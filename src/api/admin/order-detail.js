import request from '@/utils/request'

// 查询OrderDetail列表
export function listOrderDetail(query) {
  return request({
    url: '/api/v1/order-detail',
    method: 'get',
    params: query
  })
}

// 查询OrderDetail详细
export function getOrderDetail(id) {
  return request({
    url: '/api/v1/order-detail/' + id,
    method: 'get'
  })
}

// 新增OrderDetail
export function addOrderDetail(data) {
  return request({
    url: '/api/v1/order-detail',
    method: 'post',
    data: data
  })
}

// 修改OrderDetail
export function updateOrderDetail(data) {
  return request({
    url: '/api/v1/order-detail/' + data.id,
    method: 'put',
    data: data
  })
}

// 删除OrderDetail
export function delOrderDetail(data) {
  return request({
    url: '/api/v1/order-detail',
    method: 'delete',
    data: data
  })
}

