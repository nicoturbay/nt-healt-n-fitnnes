import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { today, formatDate } from '../utils/date'
import { Plus, Trash2, Target, Flame, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const MACRO_COLORS = {
  calories: { bar: 'bg-orange-400', text: 'text-orange-400' },
  protein:  { bar: 'bg-yellow-400', text: 'text-yellow-400' },
  carbs:    { bar: 'bg-blue-400',   text: 'text-blue-400'   },
  fat:      { bar: 'bg-purple-400', text: 'text-purple-400' },
}

function formatTime(meal) {
  // Use created_at (set by Supabase), fall back to id (which is Date.now())
  const ts = meal.created_at || (meal.id && meal.id > 1000000000000 ? new Date(meal.id) : null)
  if (!ts) return null
  const d = new Date(ts)
  if (isNaN(d)) return null
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function MacroBar({ label, value, goal, macro }) {
  const pct = Math.min(100, goal ? Math.round((value / goal) * 100) : 0)
  const m = MACRO_COLORS[macro] || MACRO_COLORS.protein
  const over = goal && value > goal
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={`font-medium ${over ? 'text-red-400' : 'text-gray-300'}`}>{value} / {goal}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : m.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function MealCard({ meal, onDelete }) {
  const time = formatTime(meal)
  return (
    <div className="card flex justify-between items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{meal.name}</p>
          {time && <span className="text-xs text-gray-600 flex-shrink-0">{time}</span>}
        </div>
        {meal.note && <p className="text-xs text-gray-500 mt-0.5">{meal.note}</p>}
        {meal.source === 'nutrition-channel' && (
          <span className="text-xs text-blue-400">via #nutrition</span>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {meal.calories > 0 && <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">{meal.calories} kcal</span>}
          {meal.protein > 0 && <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">{meal.protein}g protein</span>}
          {meal.carbs > 0 && <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{meal.carbs}g carbs</span>}
          {meal.fat > 0 && <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">{meal.fat}g fat</span>}
        </div>
      </div>
      <button onClick={() => onDelete(meal.id)} className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function offsetDate(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function friendlyDate(dateStr) {
  const todayStr = today()
  if (dateStr === todayStr) return 'Today'
  if (dateStr === offsetDate(todayStr, -1)) return 'Yesterday'
  if (dateStr === offsetDate(todayStr, 1)) return 'Tomorrow'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Nutrition() {
  const [meals, setMeals] = useState([])
  const [goals, setGoals] = useState({ calories: 2500, protein: 180, carbs: 280, fat: 80 })
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('daily')
  const [selectedDate, setSelectedDate] = useState(today())
  const [showGoalEditor, setShowGoalEditor] = useState(false)
  const [goalDraft, setGoalDraft] = useState(goals)
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', note: '', date: today() })

  const todayStr = today()

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('nutrition-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_logs' }, () => fetchData())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchData = async () => {
    const [mealsRes, goalsRes] = await Promise.all([
      supabase.from('meal_logs').select('*').order('date', { ascending: false }).order('id', { ascending: false }),
      supabase.from('nutrition_goals').select('*').eq('id', 1).single(),
    ])
    if (mealsRes.data) setMeals(mealsRes.data)
    if (goalsRes.data) { setGoals(goalsRes.data); setGoalDraft(goalsRes.data) }
    setLoading(false)
  }

  // Filter meals
  const now = new Date()
  const filtered = meals.filter(m => {
    const d = new Date(m.date)
    if (view === 'daily') return m.date === selectedDate
    if (view === 'weekly') { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w }
    if (view === 'monthly') { const mo = new Date(now); mo.setDate(now.getDate() - 30); return d >= mo }
    return true
  })

  const totals = filtered.reduce((a, m) => ({
    calories: a.calories + (Number(m.calories) || 0),
    protein:  a.protein  + (Number(m.protein)  || 0),
    carbs:    a.carbs    + (Number(m.carbs)    || 0),
    fat:      a.fat      + (Number(m.fat)      || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const mult = view === 'weekly' ? 7 : view === 'monthly' ? 30 : 1
  const scaledGoals = {
    calories: goals.calories * mult, protein: goals.protein * mult,
    carbs: goals.carbs * mult,       fat: goals.fat * mult,
  }

  const addMeal = async () => {
    if (!form.name) return
    const entry = {
      id: Date.now(),
      date: form.date,
      name: form.name,
      note: form.note || null,
      calories: Number(form.calories) || 0,
      protein:  Number(form.protein)  || 0,
      carbs:    Number(form.carbs)    || 0,
      fat:      Number(form.fat)      || 0,
      source: 'manual',
    }
    const { error } = await supabase.from('meal_logs').insert(entry)
    if (!error) {
      setMeals(prev => [entry, ...prev])
      setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', note: '', date: today() })
    }
  }

  const deleteMeal = async (id) => {
    await supabase.from('meal_logs').delete().eq('id', id)
    setMeals(prev => prev.filter(m => m.id !== id))
  }

  const saveGoals = async () => {
    await supabase.from('nutrition_goals').upsert({ ...goalDraft, id: 1, updated_at: new Date().toISOString() })
    setGoals(goalDraft)
    setShowGoalEditor(false)
  }

  const byDate = filtered.reduce((acc, m) => { if (!acc[m.date]) acc[m.date] = []; acc[m.date].push(m); return acc }, {})
  const sortedDates = Object.keys(byDate).sort((a, b) => new Date(b) - new Date(a))

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-gray-500 text-sm">Loading...</div></div>

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nutrition</h1>
        <button onClick={() => setShowGoalEditor(e => !e)} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
          <Target size={13} /> Goals {showGoalEditor ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {showGoalEditor && (
        <div className="card space-y-3">
          <p className="font-semibold text-sm">Daily Targets</p>
          <div className="grid grid-cols-2 gap-3">
            {['calories','protein','carbs','fat'].map(k => (
              <div key={k}>
                <label className="label capitalize">{k} {k === 'calories' ? '(kcal)' : '(g)'}</label>
                <input className="input" type="number" value={goalDraft[k]} onChange={e => setGoalDraft(g => ({ ...g, [k]: Number(e.target.value) }))} />
              </div>
            ))}
          </div>
          <button onClick={saveGoals} className="btn-primary w-full">Save Goals</button>
        </div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
        <p className="text-blue-400 text-xs font-medium mb-0.5">Live sync active</p>
        <p className="text-gray-400 text-xs">Post meals in <span className="text-blue-400">#nutrition</span> and they appear here in real time.</p>
      </div>

      {/* View tabs */}
      <div className="flex bg-gray-900 rounded-xl p-1 gap-1">
        {[['daily','Day'],['weekly','Week'],['monthly','Month']].map(([key, label]) => (
          <button key={key} onClick={() => setView(key)} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === key ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}>{label}</button>
        ))}
      </div>

      {/* Date navigation — only in daily view */}
      {view === 'daily' && (
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setSelectedDate(d => offsetDate(d, -1))}
            className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex-1 relative">
            <div className="flex items-center justify-center gap-2">
              <span className={`text-sm font-semibold ${selectedDate === todayStr ? 'text-green-400' : 'text-white'}`}>
                {friendlyDate(selectedDate)}
              </span>
              <Calendar size={13} className="text-gray-600" />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            />
          </div>

          <button
            onClick={() => setSelectedDate(d => offsetDate(d, 1))}
            className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight size={18} />
          </button>

          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Today
            </button>
          )}
        </div>
      )}

      {/* Macro KPIs */}
      <div className="card space-y-3">
        <p className="font-semibold text-sm">
          {view === 'daily' ? friendlyDate(selectedDate) : view === 'weekly' ? 'This Week' : 'This Month'}
        </p>
        <MacroBar macro="calories" label="Calories (kcal)" value={totals.calories} goal={scaledGoals.calories} />
        <MacroBar macro="protein"  label="Protein (g)"     value={totals.protein}  goal={scaledGoals.protein}  />
        <MacroBar macro="carbs"    label="Carbs (g)"       value={totals.carbs}    goal={scaledGoals.carbs}    />
        <MacroBar macro="fat"      label="Fat (g)"         value={totals.fat}      goal={scaledGoals.fat}      />
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-gray-800">
          {[['kcal',totals.calories,'text-orange-400'],['g pro',totals.protein,'text-yellow-400'],['g carbs',totals.carbs,'text-blue-400'],['g fat',totals.fat,'text-purple-400']].map(([unit,val,cls]) => (
            <div key={unit} className="text-center">
              <p className={`text-lg font-bold ${cls}`}>{Math.round(val)}</p>
              <p className="text-xs text-gray-600">{unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Log form */}
      <div className="card space-y-3">
        <p className="font-semibold text-sm">Log a Meal</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className="label">Meal Name</label>
            <input className="input" placeholder="e.g. Chicken & rice bowl" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          <div><label className="label">Calories</label><input className="input" type="number" placeholder="500" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} /></div>
          <div><label className="label">Protein (g)</label><input className="input" type="number" placeholder="40" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} /></div>
          <div><label className="label">Carbs (g)</label><input className="input" type="number" placeholder="60" value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} /></div>
          <div><label className="label">Fat (g)</label><input className="input" type="number" placeholder="15" value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} /></div>
          <div className="col-span-2">
            <label className="label">Note</label>
            <input className="input" placeholder="e.g. post-workout" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
        </div>
        <button onClick={addMeal} className="btn-primary w-full flex items-center justify-center gap-2"><Plus size={16} /> Log Meal</button>
      </div>

      {/* Meal list */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-10 text-center">
          <Flame size={32} className="text-gray-700 mb-2" />
          <p className="text-gray-500 text-sm">
            No meals logged {view === 'daily' ? `for ${friendlyDate(selectedDate).toLowerCase()}` : `this ${view === 'weekly' ? 'week' : 'month'}`}.
          </p>
        </div>
      ) : view === 'daily' ? (
        <div className="space-y-2">{filtered.map(m => <MealCard key={m.id} meal={m} onDelete={deleteMeal} />)}</div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => (
            <div key={date}>
              <p className="text-xs text-gray-500 font-semibold mb-2">{formatDate(date)}</p>
              <div className="space-y-2">{byDate[date].map(m => <MealCard key={m.id} meal={m} onDelete={deleteMeal} />)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
