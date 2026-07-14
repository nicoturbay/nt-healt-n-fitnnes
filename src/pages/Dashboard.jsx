import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { today, formatDate } from '../utils/date'
import { DEFAULT_WORKOUT_PLAN } from '../data/workoutPlan'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { Link } from 'react-router-dom'
import { Dumbbell, Flame, Scale, TrendingUp, Activity, ChevronRight, Target } from 'lucide-react'

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

export default function Dashboard() {
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

  const todayKey = workoutPlan.schedule?.[dayOfWeek]
  const todayWorkout = todayKey ? workoutPlan.workouts?.[todayKey] : null
  const todayLogged = workoutLogs.some(w => w.date === todayStr)

  // Week dates
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - dayOfWeek)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })
  const plannedDays = weekDays.filter(d => workoutPlan.schedule?.[(new Date(d).getDay())]).length
  const completedDays = workoutLogs.filter(w => weekDays.includes(w.date)).length

  // Today's nutrition
  const todayMeals = meals.filter(m => m.date === todayStr)
  const todayCalories = todayMeals.reduce((s, m) => s + (Number(m.calories) || 0), 0)
  const todayProtein = todayMeals.reduce((s, m) => s + (Number(m.protein) || 0), 0)

  // Weight
  const latestWeight = weights[0]
  const prevWeight = weights[1]
  const weightDelta = latestWeight && prevWeight ? (latestWeight.weight - prevWeight.weight).toFixed(1) : null

  // Streak
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

  const calPct = Math.min(100, Math.round((todayCalories / goals.calories) * 100))
  const protPct = Math.min(100, Math.round((todayProtein / goals.protein) * 100))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">{formatDate(todayStr)}</p>
      </div>

      {todayWorkout ? (
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
      )}

      <div className="space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">This Week</p>
        <div className="grid grid-cols-2 gap-3">
          <KPICard icon={Dumbbell} label="Workouts" value={`${completedDays} / ${plannedDays}`} sub="sessions done" color="text-blue-400" to="/log" />
          <KPICard icon={Activity} label="Streak" value={`${streak}d`} sub="consecutive days" color="text-green-400" />
        </div>

        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-4">Today's Nutrition</p>
        <div className="grid grid-cols-2 gap-3">
          <KPICard icon={Flame} label="Calories" value={todayCalories ? `${todayCalories}` : '–'} sub={`goal: ${goals.calories} kcal`} color="text-orange-400" to="/nutrition" />
          <KPICard icon={Target} label="Protein" value={todayProtein ? `${todayProtein}g` : '–'} sub={`goal: ${goals.protein}g`} color="text-yellow-400" to="/nutrition" />
        </div>

        {(calPct > 0 || protPct > 0) && (
          <div className="card space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-400">Calories</span><span className="text-gray-500">{calPct}%</span></div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${calPct}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-400">Protein</span><span className="text-gray-500">{protPct}%</span></div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${protPct}%` }} /></div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-4">Body Metrics</p>
        <div className="grid grid-cols-2 gap-3">
          <KPICard icon={Scale} label="Weight" value={latestWeight ? `${latestWeight.weight} lbs` : '–'} sub={weightDelta !== null ? `${weightDelta > 0 ? '+' : ''}${weightDelta} from last` : 'no data yet'} color="text-purple-400" to="/progress" />
          <KPICard icon={TrendingUp} label="Logged" value={`${weights.length}`} sub="weigh-ins total" color="text-teal-400" to="/progress" />
        </div>
      </div>

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
