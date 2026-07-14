export const today = () => new Date().toISOString().split('T')[0]

export const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export const formatDateLong = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export const sortByDateDesc = (arr, key = 'date') =>
  [...arr].sort((a, b) => new Date(b[key]) - new Date(a[key]))

export const groupByDate = (arr, key = 'date') =>
  arr.reduce((acc, item) => {
    const d = item[key]
    if (!acc[d]) acc[d] = []
    acc[d].push(item)
    return acc
  }, {})
