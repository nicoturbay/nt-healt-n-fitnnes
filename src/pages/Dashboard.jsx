import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { today, formatDate } from '../utils/date'
import { DEFAULT_WORKOUT_PLAN } from '../data/workoutPlan'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { Link } from 'react-router-dom'
import { Dumbbell, Flame, Scale, TrendingUp, Activity, ChevronRight, Target, Utensils } from 'lucide-react'

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
]

function PeriodSelector({ active, onChange }) {
  return (
    <div className="flex bg-gray-900 rounded-xl p-1 gap-1">
      {PERIODS.map(p => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`flex-1 text-xs font-medium py-1.5 px-2 rounded-lg transition-colors ${
            active === p.key
              ? 'bg-gray-700 text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

function KPICard({ icon: Icon, label, value, sub, color = 'text-green-400', to }) {
  const inner = (
    <div className="card flex items-center gap-4 hover:border-gray-700 transition-colors">
      <div className={`p-3 rounded-xl bg-gray-800 ${color}`}><Icon size={20} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      {to && <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />}
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

function ProgressBar({ label, pct, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-500">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

function getDateRange(period) {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  if (period === 'today') {
    return { start: todayStr, end: todayStr }
  }
  if (period === 'week') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    return { start: start.toISOString().split('T')[0], end: todayStr }
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start: start.toISOString().split('T')[0], end: todayStr }
  }
  return { start: null, end: null } // all time
}

function filterByPeriod(records, period, dateField = 'date') {
  const { start, end } = getDateRange(period)
  if (!start) return records
  return records.filter(r => r[dateField] >= start && r[dateField] <= end)
}

export default function Dashboard() {
  const [period, setPeriod] = useState('today')
  const [meals, setMeals] = useState([])
  const [weights, setWeights] = useState([])
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [goals, setGoals] = useState({ calories: 2500, protein: 180 })
  const [workoutPlan] = useLocalStorage('workoutPlan', DEFAULT_WORKOUT_PLAN)

  const todayStr = today()
  const dayOfWeek = new Date().getDay()

  useEffect(() => {
    fetchAll()
    const ch = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_logs' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weight_log' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workout_logs' }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const fetchAll = async () => {
    const [m, w, wl, g] = await Promise.all([
      supabase.from('meal_logs').select('*').order('date', { ascending: false }),
      supabase.from('weight_log').select('*').order('date', { ascending: false }),
      supabase.from('workout_logs').select('*').order('date', { ascending: false }),
      supabase.from('nutrition_goals').select('*').eq('id', 1).single(),
    ])
    if (m.data) setMeals(m.data)
    if (w.data) setWeights(w.data)
    if (wl.data) setWorkoutLogs(wl.data)
    if (g.data) setGoals(g.data)
  }

  // --- Period-filtered data ---
  const filteredMeals = useMemo(() => filterByPeriod(meals, period), [meals, period])
  const filteredWorkouts = useMemo(() => filterByPeriod(workoutLogs, period), [workoutLogs, period])
  const filteredWeights = useMemo(() => filterByPeriod(weights, period), [weights, period])

  // --- Nutrition stats ---
  const totalCalories = filteredMeals.reduce((s, m) => s + (Number(m.calories) || 0), 0)
  const totalProtein = filteredMeals.reduce((s, m) => s + (Number(m.protein) || 0), 0)
  const totalCarbs = filteredMeals.reduce((s, m) => s + (Number(m.carbs) || 0), 0)
  const totalFat = filteredMeals.reduce((s, m) => s + (Number(m.fat) || 0), 0)
  const mealCount = filteredMeals.length

  // Days in period for averages
  const periodDays = useMemo(() => {
    if (period === 'today') return 1
    if (period === 'week') return 7
    if (period === 'month') return new Date().getDate()
    const firstMeal = meals.length ? meals[meals.length - 1]?.date : null
    if (!firstMeal) return 1
    const diff = Math.ceil((new Date() - new Date(firstMeal)) / 86400000) || 1
    return diff
  }, [period, meals])

  const avgCalories = periodDays > 1 ? Math.round(totalCalories / periodDays) : null
  const avgProtein = periodDays > 1 ? Math.round(totalProtein / periodDays) : null

  // --- Workout stats ---
  const workoutCount = filteredWorkouts.length
  const { start: wStart, end: wEnd } = getDateRange(period)

  const plannedInPeriod = useMemo(() => {
    if (!wStart) {
      // all time — just count all logs
      return null
    }
    let count = 0
    let d = new Date(wStart)
    const end = new Date(wEnd)
    while (d <= end) {
      if (workoutPlan.schedule?.[d.getDay()]) count++
      d.setDate(d.getDate() + 1)
    }
    return count
  }, [period, wStart, wEnd, workoutPlan])

  // --- Weight ---
  const latestWeight = weights[0]
  const prevWeight = weights[1]
  const weightDelta = latestWeight && prevWeight ? (latestWeight.weight - prevWeight.weight).toFixed(1) : null
  const firstWeight = filteredWeights.length > 1 ? filteredWeights[filteredWeights.length - 1] : null
  const weightChange = firstWeight && latestWeight && firstWeight.id !== latestWeight.id
    ? (latestWeight.weight - firstWeight.weight).toFixed(1)
    : null

  // --- Streak ---
  const allLogDates = useMemo(() => new Set([
    ...workoutLogs.map(w => w.date),
    ...meals.map(m => m.date),
  ]), [workoutLogs, meals])

  let streak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    if (allLogDates.has(d.toISOString().split('T')[0])) streak++
    else break
  }

  // --- Today's workout (always shown) ---
  const todayWorkout = workoutPlan.schedule?.[dayOfWeek]
    ? workoutPlan.workouts?.[workoutPlan.schedule[dayOfWeek]]
    : null
  const todayLogged = workoutLogs.some(w => w.date === todayStr)

  // --- Week grid ---
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - dayOfWeek)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const calPct = goals.calories ? Math.round((period === 'today' ? totalCalories : avgCalories ?? totalCalories) / goals.calories * 100) : 0
  const protPct = goals.protein ? Math.round((period === 'today' ? totalProtein : avgProtein ?? totalProtein) / goals.protein * 100) : 0

  const nutritionLabel = period === 'today' ? "Today's Nutrition"
    : period === 'week' ? 'Nutrition — This Week'
    : period === 'month' ? 'Nutrition — This Month'
    : 'Nutrition — All Time'

  const workoutLabel = period === 'today' ? "Today's Workout"
    : period === 'week' ? 'Workouts — This Week'
    : period === 'month' ? 'Workouts — This Month'
    : 'Workouts — All Time'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">{formatDate(todayStr)}</p>
      </div>

      <PeriodSelector active={period} onChange={setPeriod} />

      {/* Today's workout card — only on Today view */}
      {period === 'today' && (
        todayWorkout ? (
          <Link to="/workout">
            <div className={`rounded-2xl p-5 border ${todayLogged ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-900 border-gray-800 hover:border-gray-700'} transition-colors`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Today's Workout</p>
                  <p className="text-xl font-bold">{todayWorkout.name}</p>
                  <p className="text-gray-400 text-sm mt-0.5">{todayWorkout.focus}</p>
                  <p className="text-gray-500 text-xs mt-1">{todayWorkout.exercises.length} exercises</p>
                </div>
                <div className={`p-3 rounded-xl ${todayLogged ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                  {todayLogged ? <span className="text-lg">✓</span> : <Dumbbell size={20} />}
                </div>
              </div>
              {!todayLogged && <div className="mt-4 flex items-center gap-2 text-green-400 text-sm font-medium">Start workout <ChevronRight size={14} /></div>}
              {todayLogged && <p className="mt-3 text-green-400 text-sm font-medium">Completed today</p>}
            </div>
          </Link>
        ) : (
          <div className="card"><p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Today</p><p className="text-gray-400">Rest day</p></div>
        )
      )}

      {/* Workout KPIs */}
      <div className="space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{workoutLabel}</p>
        <div className="grid grid-cols-2 gap-3">
          {period !== 'today' ? (
            <>
              <KPICard
                icon={Dumbbell}
                label="Sessions"
                value={plannedInPeriod !== null ? `${workoutCount} / ${plannedInPeriod}` : `${workoutCount}`}
                sub="completed"
                color="text-blue-400"
                to="/log"
              />
              <KPICard icon={Activity} label="Streak" value={`${streak}d`} sub="consecutive days" color="text-green-400" />
            </>
          ) : (
            <>
              <KPICard
                icon={Dumbbell}
                label="Workouts"
                value={weekDays.filter(d => workoutLogs.some(w => w.date === d)).length + ' / ' + weekDays.filter(d => !!workoutPlan.schedule?.[new Date(d + 'T12:00:00').getDay()]).length}
                sub="this week"
                color="text-blue-400"
                to="/log"
              />
              <KPICard icon={Activity} label="Streak" value={`${streak}d`} sub="consecutive days" color="text-green-400" />
            </>
          )}
        </div>
      </div>

      {/* Nutrition KPIs */}
      <div className="space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{nutritionLabel}</p>
        <div className="grid grid-cols-2 gap-3">
          <KPICard
            icon={Flame}
            label={period === 'today' ? 'Calories' : 'Avg Calories'}
            value={period === 'today'
              ? (totalCalories ? `${totalCalories}` : '–')
              : (avgCalories !== null ? `${avgCalories}/day` : (totalCalories ? `${totalCalories}` : '–'))
            }
            sub={period === 'today' ? `goal: ${goals.calories} kcal` : `${totalCalories.toLocaleString()} total`}
            color="text-orange-400"
            to="/nutrition"
          />
          <KPICard
            icon={Target}
            label={period === 'today' ? 'Protein' : 'Avg Protein'}
            value={period === 'today'
              ? (totalProtein ? `${totalProtein}g` : '–')
              : (avgProtein !== null ? `${avgProtein}g/day` : (totalProtein ? `${totalProtein}g` : '–'))
            }
            sub={period === 'today' ? `goal: ${goals.protein}g` : `${totalProtein}g total`}
            color="text-yellow-400"
            to="/nutrition"
          />
        </div>

        {period !== 'today' && (totalCalories > 0 || totalProtein > 0) && (
          <div className="grid grid-cols-2 gap-3">
            <KPICard
              icon={Utensils}
              label="Meals Logged"
              value={`${mealCount}`}
              sub={`${(mealCount / periodDays).toFixed(1)}/day avg`}
              color="text-pink-400"
              to="/nutrition"
            />
            <KPICard
              icon={TrendingUp}
              label="Carbs / Fat"
              value={avgCalories !== null ? `${Math.round(totalCarbs / periodDays)}g / ${Math.round(totalFat / periodDays)}g` : `${totalCarbs}g / ${totalFat}g`}
              sub={period === 'today' ? 'carbs / fat' : 'daily avg'}
              color="text-teal-400"
            />
          </div>
        )}

        {/* Progress bars — today shows vs goal, other periods show vs daily avg goal */}
        {(calPct > 0 || protPct > 0) && (
          <div className="card space-y-3">
            <ProgressBar
              label={period === 'today' ? 'Calories vs goal' : 'Avg calories vs goal'}
              pct={calPct}
              color="bg-orange-400"
            />
            <ProgressBar
              label={period === 'today' ? 'Protein vs goal' : 'Avg protein vs goal'}
              pct={protPct}
              color="bg-yellow-400"
            />
          </div>
        )}
      </div>

      {/* Body Metrics */}
      <div className="space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Body Metrics</p>
        <div className="grid grid-cols-2 gap-3">
          <KPICard
            icon={Scale}
            label="Weight"
            value={latestWeight ? `${latestWeight.weight} lbs` : '–'}
            sub={
              period === 'today' && weightDelta !== null
                ? `${weightDelta > 0 ? '+' : ''}${weightDelta} from last`
                : period !== 'today' && weightChange !== null
                ? `${weightChange > 0 ? '+' : ''}${weightChange} lbs this period`
                : 'latest reading'
            }
            color="text-purple-400"
            to="/progress"
          />
          <KPICard
            icon={TrendingUp}
            label="Weigh-ins"
            value={`${filteredWeights.length}`}
            sub={period === 'all' ? 'total logged' : 'this period'}
            color="text-teal-400"
            to="/progress"
          />
        </div>
      </div>

      {/* Week grid — always shown */}
      <div className="card">
        <p className="text-sm font-semibold mb-3">This Week</p>
        <div className="grid grid-cols-7 gap-1">
          {['S','M','T','W','T','F','S'].map((d, i) => {
            const dateStr = weekDays[i]
            const planned = !!workoutPlan.schedule?.[i]
            const done = workoutLogs.some(w => w.date === dateStr)
            const isToday = dateStr === todayStr
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className={`text-xs ${isToday ? 'text-white font-bold' : 'text-gray-600'}`}>{d}</span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border ${done ? 'bg-green-500 border-green-500 text-black' : isToday && planned ? 'border-green-500 text-green-400' : planned ? 'border-gray-700 text-gray-600' : 'border-transparent text-gray-700'}`}>
                  {done ? '✓' : planned ? '●' : '·'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
