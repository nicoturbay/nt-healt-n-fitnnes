// Always derive the current date in Eastern time to avoid UTC rollover after 8 PM ET
export const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())

// Format any Date object as YYYY-MM-DD in Eastern time
export const dateToET = (date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(date)

// Eastern day-of-week (0=Sun…6=Sat) for any Date object
export const getDayOfWeekET = (date = new Date()) => {
  const dayStr = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(date)
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(dayStr)
}

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
