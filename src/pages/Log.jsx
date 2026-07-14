import { useState, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { formatDate } from '../utils/date'
import { Dumbbell, Flame, TrendingUp, Scale, Filter } from 'lucide-react'

const TYPES = {
  workout:  { label: 'Workout',  icon: Dumbbell,   color: 'bg-blue-500/20 text-blue-400',   dot: 'bg-blue-400'   },
  meal:     { label: 'Meal',     icon: Flame,       color: 'bg-orange-500/20 text-orange-400', dot: 'bg-orange-400' },
  progress: { label: 'Progress', icon: TrendingUp,  color: 'bg-green-500/20 text-green-400',  dot: 'bg-green-400'  },
  weight:   { label: 'Weight',   icon: Scale,       color: 'bg-purple-500/20 text-purple-400', dot: 'bg-purple-400' },
}

function LogItem({ entry }) {
  const meta = TYPES[entry.type] || TYPES.workout
  const Icon = meta.icon
  const [open, setOpen] = useState(false)

  return (
    <div className="flex gap-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${meta.color}`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 border-b border-gray-800 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{entry.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatDate(entry.date)}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${meta.color}`}>{meta.label}</span>
        </div>

        {open && entry.detail && (
          <div className="mt-2 space-y-1">
            {entry.detail.map((line, i) => (
              <p key={i} className="text-xs text-gray-400">{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Log() {
  const [workoutLogs] = useLocalStorage('workoutLogs', [])
  const [mealLogs] = useLocalStorage('mealLogs', [])
  const [progressEntries] = useLocalStorage('progressEntries', [])
  const [weightLog] = useLocalStorage('weightLog', [])

  const [view, setView] = useState('week')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showFilter, setShowFilter] = useState(false)

  const now = new Date()
  const cutoff = useMemo(() => {
    const d = new Date(now)
    if (view === 'day') d.setDate(now.getDate() - 1)
    else if (view === 'week') d.setDate(now.getDate() - 7)
    else d.setDate(now.getDate() - 30)
    return d
  }, [view])

  const inRange = (dateStr) => new Date(dateStr) >= cutoff

  // Compile all entries
  const entries = useMemo(() => {
    const all = []

    workoutLogs.filter(w => inRange(w.date)).forEach(w => {
      const exerciseNames = Object.keys(w.exercises || {})
      const detail = exerciseNames.map(name => {
        const sets = w.exercises[name]
        return `${name}: ${sets.map(s => `${s.reps} reps @ ${s.weight || '–'} lbs`).join(', ')}`
      })
      all.push({
        id: `workout-${w.id}`,
        type: 'workout',
        date: w.date,
        ts: new Date(w.completedAt || w.date).getTime(),
        title: w.workoutName,
        detail,
      })
    })

    mealLogs.filter(m => inRange(m.date)).forEach(m => {
      const macros = [
        m.calories && `${m.calories} kcal`,
        m.protein && `${m.protein}g protein`,
        m.carbs && `${m.carbs}g carbs`,
        m.fat && `${m.fat}g fat`,
      ].filter(Boolean)
      all.push({
        id: `meal-${m.id}`,
        type: 'meal',
        date: m.date,
        ts: m.id,
        title: m.name,
        detail: macros.length ? macros : undefined,
      })
    })

    progressEntries.filter(e => inRange(e.date)).forEach(e => {
      const detail = []
      if (e.weight) detail.push(`Weight: ${e.weight} lbs`)
      if (e.note) detail.push(e.note)
      if (e.photos?.length) detail.push(`${e.photos.length} photo${e.photos.length > 1 ? 's' : ''} attached`)
      all.push({
        id: `progress-${e.id}`,
        type: 'progress',
        date: e.date,
        ts: e.id,
        title: e.weight ? `Progress — ${e.weight} lbs` : 'Progress update',
        detail,
      })
    })

    weightLog.filter(w => inRange(w.date)).forEach(w => {
      all.push({
        id: `weight-${w.id}`,
        type: 'weight',
        date: w.date,
        ts: w.id,
        title: `Weigh-in: ${w.weight} lbs`,
        detail: undefined,
      })
    })

    return all.sort((a, b) => b.ts - a.ts)
  }, [workoutLogs, mealLogs, progressEntries, weightLog, view])

  const filtered = typeFilter === 'all' ? entries : entries.filter(e => e.type === typeFilter)

  // Group by date
  const byDate = filtered.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = []
    acc[e.date].push(e)
    return acc
  }, {})
  const dates = Object.keys(byDate).sort((a, b) => new Date(b) - new Date(a))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Log</h1>
        <button onClick={() => setShowFilter(e => !e)} className="text-gray-400 hover:text-white transition-colors">
          <Filter size={18} />
        </button>
      </div>

      {/* Time filter */}
      <div className="flex bg-gray-900 rounded-xl p-1 gap-1">
        {[['day','Today'],['week','Week'],['month','Month']].map(([key, label]) => (
          <button key={key} onClick={() => setView(key)} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === key ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      {showFilter && (
        <div className="flex gap-2 flex-wrap">
          {[['all','All'], ...Object.entries(TYPES).map(([k, v]) => [k, v.label])].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${typeFilter === key ? 'bg-green-500 border-green-500 text-black' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(TYPES).map(([type, meta]) => {
          const count = entries.filter(e => e.type === type).length
          const Icon = meta.icon
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
              className={`card flex flex-col items-center py-3 transition-colors ${typeFilter === type ? 'border-green-500/40' : ''}`}
            >
              <Icon size={16} className={meta.color.split(' ')[1]} />
              <p className="text-lg font-bold mt-1">{count}</p>
              <p className="text-xs text-gray-600">{meta.label.toLowerCase()}</p>
            </button>
          )
        })}
      </div>

      {/* Entries */}
      {dates.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <p className="text-gray-500">No entries for this period.</p>
          <p className="text-gray-600 text-sm mt-1">Log a workout, meal, or progress update to get started.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {dates.map(date => (
            <div key={date}>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">{formatDate(date)}</p>
              <div className="space-y-3">
                {byDate[date].map(entry => <LogItem key={entry.id} entry={entry} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
