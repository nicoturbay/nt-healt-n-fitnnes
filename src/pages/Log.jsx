import { useState, useEffect, useMemo } from 'react'
import { Dumbbell, Flame, Scale, ChevronDown, ChevronUp, Calendar, RefreshCw } from 'lucide-react'

const SB_URL = 'https://gjusyswosfbrgngwjvbx.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdXN5c3dvc2ZicmduZ3dqdmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDM4MTAsImV4cCI6MjA5OTYxOTgxMH0.fW0Bocfsod-qjEw5n2Kx4E_IIputn38nCWuhyWFcOfw'

function sbFetch(table, params = '') {
  return fetch(`${SB_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
  }).then(r => r.json())
}

function todayET() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

function fmtDate(str) {
  const d = new Date(str + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function fmtNum(v, dec = 1) {
  if (v == null) return '—'
  return typeof v === 'number' ? (v % 1 === 0 ? v : v.toFixed(dec)) : v
}

// ─── Entry cards ────────────────────────────────────────────────────────────

function WorkoutCard({ log }) {
  const [open, setOpen] = useState(false)
  const exercises = Object.entries(log.exercises || {})
  const filled = exercises.filter(([, sets]) => sets.some(s => s.reps))

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Dumbbell size={14} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{log.workout_name}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{filled.length} exercises logged</p>
        </div>
        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full flex-shrink-0">Workout</span>
        {open ? <ChevronUp size={14} className="text-zinc-600 flex-shrink-0" /> : <ChevronDown size={14} className="text-zinc-600 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-zinc-800 pt-3">
          {filled.map(([exId, sets]) => {
            const filledSets = sets.filter(s => s.reps)
            const name = exId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            return (
              <div key={exId}>
                <p className="text-xs text-zinc-400 mb-1">{name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {filledSets.map((s, i) => (
                    <span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                      {s.reps} reps{s.weight ? ` @ ${s.weight} lb` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MealCard({ log }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
          <Flame size={14} className="text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{log.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {log.calories ? `${log.calories} kcal` : ''}{log.protein ? ` · ${log.protein}g protein` : ''}
          </p>
        </div>
        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full flex-shrink-0">Meal</span>
        {open ? <ChevronUp size={14} className="text-zinc-600 flex-shrink-0" /> : <ChevronDown size={14} className="text-zinc-600 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-3">
          <div className="grid grid-cols-4 gap-2">
            {[['Cal', log.calories], ['Protein', `${log.protein}g`], ['Carbs', `${log.carbs}g`], ['Fat', `${log.fat}g`]].map(([label, val]) => (
              <div key={label} className="text-center">
                <p className="text-base font-bold text-white">{val ?? '—'}</p>
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
          {log.note && <p className="text-xs text-zinc-500 mt-3">{log.note}</p>}
        </div>
      )}
    </div>
  )
}

function WeightCard({ log }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Scale size={14} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Weigh-in: {log.weight_lb} lb</p>
          <p className="text-xs text-zinc-500 mt-0.5">{log.body_fat_pct}% body fat · metabolic age {log.metabolic_age}</p>
        </div>
        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full flex-shrink-0">Weight</span>
        {open ? <ChevronUp size={14} className="text-zinc-600 flex-shrink-0" /> : <ChevronDown size={14} className="text-zinc-600 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Weight', `${fmtNum(log.weight_lb)} lb`],
              ['Body Fat', `${fmtNum(log.body_fat_pct)}%`],
              ['Muscle', `${fmtNum(log.muscle_mass_lb)} lb`],
              ['Water', `${fmtNum(log.body_water_pct)}%`],
              ['Visceral Fat', fmtNum(log.visceral_fat, 0)],
              ['Metabolic Age', fmtNum(log.metabolic_age, 0)],
              ['BMI', fmtNum(log.bmi)],
              ['BMR', `${fmtNum(log.bmr_kcal, 0)} kcal`],
              ['Protein %', `${fmtNum(log.protein_pct)}%`],
            ].map(([label, val]) => (
              <div key={label} className="bg-zinc-800 rounded-lg px-3 py-2">
                <p className="text-sm font-semibold text-white">{val}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Daily totals banner (for meal days) ─────────────────────────────────────
function DailyMealTotals({ meals }) {
  if (!meals.length) return null
  const totals = meals.reduce((acc, m) => ({
    cal:     acc.cal     + (m.calories || 0),
    protein: acc.protein + (m.protein  || 0),
    carbs:   acc.carbs   + (m.carbs    || 0),
    fat:     acc.fat     + (m.fat      || 0),
  }), { cal: 0, protein: 0, carbs: 0, fat: 0 })

  const GOALS = { cal: 2400, protein: 165, carbs: 240, fat: 70 }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-3">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Daily Totals</p>
      <div className="grid grid-cols-4 gap-2">
        {[['Cal', totals.cal, GOALS.cal, ''], ['Protein', totals.protein, GOALS.protein, 'g'], ['Carbs', totals.carbs, GOALS.carbs, 'g'], ['Fat', totals.fat, GOALS.fat, 'g']].map(([label, val, goal, unit]) => {
          const pct = Math.min(100, Math.round((val / goal) * 100))
          const color = pct >= 90 ? '#34d399' : pct >= 60 ? '#60a5fa' : '#fb923c'
          return (
            <div key={label} className="text-center">
              <p className="text-sm font-bold text-white">{Math.round(val)}{unit}</p>
              <p className="text-xs text-zinc-600">/{goal}{unit}</p>
              <div className="bg-zinc-800 rounded-full h-1 mt-1 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Log() {
  const [workouts,  setWorkouts]  = useState([])
  const [meals,     setMeals]     = useState([])
  const [weights,   setWeights]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  // Date filter: null = all recent, or 'YYYY-MM-DD'
  const [dateFilter, setDateFilter] = useState(null)
  const [range,      setRange]      = useState('week') // 'day' | 'week' | 'month' | 'all'
  const [typeFilter, setTypeFilter] = useState('all')

  const loadAll = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      sbFetch('workout_logs',           'order=id.desc&limit=100'),
      sbFetch('meal_logs',              'order=id.desc&limit=200'),
      sbFetch('body_composition_logs',  'order=id.desc&limit=100'),
    ])
      .then(([w, m, b]) => {
        setWorkouts(Array.isArray(w) ? w : [])
        setMeals(Array.isArray(m) ? m : [])
        setWeights(Array.isArray(b) ? b : [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => { loadAll() }, [])

  // Build date range cutoff
  const cutoff = useMemo(() => {
    if (dateFilter) return null // exact date mode
    const d = new Date()
    if (range === 'day')   d.setDate(d.getDate() - 1)
    else if (range === 'week')  d.setDate(d.getDate() - 7)
    else if (range === 'month') d.setDate(d.getDate() - 30)
    else return null
    return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  }, [range, dateFilter])

  const inRange = (dateStr) => {
    if (dateFilter) return dateStr === dateFilter
    if (!cutoff) return true
    return dateStr >= cutoff
  }

  // Filter all sources
  const filteredWorkouts = workouts.filter(w => inRange(w.date))
  const filteredMeals    = meals.filter(m => inRange(m.date))
  const filteredWeights  = weights.filter(b => inRange(b.date))

  // Collect all dates
  const allDates = useMemo(() => {
    const set = new Set()
    if (typeFilter === 'all' || typeFilter === 'workout') filteredWorkouts.forEach(w => set.add(w.date))
    if (typeFilter === 'all' || typeFilter === 'meal')    filteredMeals.forEach(m => set.add(m.date))
    if (typeFilter === 'all' || typeFilter === 'weight')  filteredWeights.forEach(b => set.add(b.date))
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [filteredWorkouts, filteredMeals, filteredWeights, typeFilter])

  const today = todayET()

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Log</h1>
        <button onClick={loadAll} className="text-zinc-500 hover:text-white transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-zinc-500 flex-shrink-0" />
        <input
          type="date"
          value={dateFilter || ''}
          max={today}
          onChange={e => { setDateFilter(e.target.value || null); setRange('all') }}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-600 flex-1"
        />
        {dateFilter && (
          <button
            onClick={() => { setDateFilter(null); setRange('week') }}
            className="text-xs text-zinc-500 hover:text-white px-2 py-1 rounded-lg bg-zinc-800"
          >
            Clear
          </button>
        )}
      </div>

      {/* Range filter (hidden when date is pinned) */}
      {!dateFilter && (
        <div className="flex bg-zinc-900 rounded-xl p-1 gap-1">
          {[['day','Today'],['week','Week'],['month','Month'],['all','All']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${range === key ? 'bg-green-500 text-black' : 'text-zinc-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        {[['all','All'], ['workout','Workouts'], ['meal','Meals'], ['weight','Weigh-ins']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${typeFilter === key ? 'bg-green-500 border-green-500 text-black' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-2">
        {[
          ['Workouts', filteredWorkouts.length, 'text-blue-400'],
          ['Meals',    filteredMeals.length,    'text-orange-400'],
          ['Weigh-ins',filteredWeights.length,  'text-purple-400'],
        ].map(([label, count, color]) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">
          Failed to load: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center py-16 text-zinc-600">
          <RefreshCw size={24} className="animate-spin mb-3" />
          <p className="text-sm">Loading...</p>
        </div>
      )}

      {/* Entries grouped by date */}
      {!loading && allDates.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col items-center py-14 text-center">
          <p className="text-zinc-400 font-medium">No entries found</p>
          <p className="text-zinc-600 text-sm mt-1">
            {dateFilter ? `Nothing logged on ${fmtDate(dateFilter)}` : 'Nothing logged for this period'}
          </p>
        </div>
      )}

      {!loading && allDates.map(date => {
        const dayWorkouts = (typeFilter === 'all' || typeFilter === 'workout') ? filteredWorkouts.filter(w => w.date === date) : []
        const dayMeals    = (typeFilter === 'all' || typeFilter === 'meal')    ? filteredMeals.filter(m => m.date === date) : []
        const dayWeights  = (typeFilter === 'all' || typeFilter === 'weight')  ? filteredWeights.filter(b => b.date === date) : []

        return (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-3">
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">
                {date === today ? 'Today' : date === (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toLocaleDateString('en-CA', {timeZone:'America/New_York'}) })() ? 'Yesterday' : fmtDate(date)}
              </p>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <div className="space-y-2">
              {/* Weigh-ins first */}
              {dayWeights.map(b => <WeightCard key={b.id} log={b} />)}

              {/* Workouts */}
              {dayWorkouts.map(w => <WorkoutCard key={w.id} log={w} />)}

              {/* Meal totals banner, then individual meals */}
              {dayMeals.length > 0 && <DailyMealTotals meals={dayMeals} />}
              {dayMeals.map(m => <MealCard key={m.id} log={m} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
