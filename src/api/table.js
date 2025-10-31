// 查询列表
export function getItems(f, query) {
  query = query || { pageSize: 10000 }
  return f(query)
}

export function setItems(response, k, v, extraFields = []) {
  const data = []
  k = k || 'id'
  v = v || 'name'

  if (response.data && response.data.list && response.data.list.length > 0) {
    response.data.list.forEach(e => {
      const item = {
        key: e[k] != null ? e[k] : null,
        value: e[v] != null ? e[v] : null
      }

      // 新增：遍历 extraFields，把额外字段也加进去
      extraFields.forEach(field => {
        item[field] = e[field] != null ? e[field] : null
      })

      data.push(item)
    })
    return data
  }
  return data // 注意：原函数在不满足条件时返回 undefined，建议统一返回 []
}
