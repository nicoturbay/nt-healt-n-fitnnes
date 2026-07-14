import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useRemoteData } from '../hooks/useRemoteData'
import { today, formatDate } from '../utils/date'
import { Plus, Trash2, Target, Flame, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

const MACRO_COLORS = {
  calories: { bar: 'bg-orange-400', text: 'text-orange-400' },
  protein:  { bar: 'bg-yellow-400', text: 'text-yellow-400' },
  carbs:    { bar: 'bg-blue-400',   text: 'text-blue-400'   },
  fat:      { bar: 'bg-purple-400', text: 'text-purple-400' },
}

function MacroBar({ label, value, goal, ...macroKey }) {
  const pct = Math.min(100, goal ? Math.round((value / goal) * 100) : 0)
  const m = MACRO_COLORS[macroKey.macro] || MACRO_COLORS.protein
  const over = goal && value > goal
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={`font-medium ${over ? 'text-red-400' : 'text-gray-300'}`}>
          {value} / {goal}
        </span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : m.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Nutrition() {
  const [goals, setGoals] = useLocalStorage('nutritionGoals', { calories: 2500, protein: 180, carbs: 280, fat: 80 })
  const [mealLogs, setMealLogs, loadingMeals] = useRemoteData('meal-logs.json', [])
  const [view, setView] = useState('daily')
  const [showGoalEditor, setShowGoalEditor] = useState(false)
  const [goalDraft, setGoalDraft] = useState(goals)
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', note: '', date: today() })

  const todayStr = today()

  // Filter meals by view
  const now = new Date()
  const filteredMeals = mealLogs.filter(m => {
    const d = new Date(m.date)
    if (view === 'daily') return m.date === todayStr
    if (view === 'weekly') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
      return d >= weekAgo
    }
    if (view === 'monthly') {
      const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30)
      return d >= monthAgo
    }
    return true
  })

  const totals = filteredMeals.reduce((acc, m) => ({
    calories: acc.calories + (Number(m.calories) || 0),
    protein: acc.protein + (Number(m.protein) || 0),
    carbs: acc.carbs + (Number(m.carbs) || 0),
    fat: acc.fat + (Number(m.fat) || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  // For weekly/monthly, scale goals
  const goalMultiplier = view === 'weekly' ? 7 : view === 'monthly' ? 30 : 1
  const scaledGoals = {
    calories: goals.calories * goalMultiplier,
    protein: goals.protein * goalMultiplier,
    carbs: goals.carbs * goalMultiplier,
    fat: goals.fat * goalMultiplier,
  }

  const addMeal = () => {
    if (!form.name) return
    const entry = { id: Date.now(), ...form, calories: Number(form.calories) || 0, protein: Number(form.protein) || 0, carbs: Number(form.carbs) || 0, fat: Number(form.fat) || 0 }
    setMealLogs(prev => [entry, ...prev])
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', note: '', date: today() })
  }

  const deleteMeal = (id) => setMealLogs(prev => prev.filter(m => m.id !== id))

  const saveGoals = () => { setGoals(goalDraft); setShowGoalEditor(false) }

  // Group meals by date for weekly/monthly view
  const mealsByDate = filteredMeals.reduce((acc, m) => {
    if (!acc[m.date]) acc[m.date] = []
    acc[m.date].push(m)
    return acc
  }, {})
  const sortedDates = Object.keys(mealsByDate).sort((a, b) => new Date(b) - new Date(a))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nutrition</h1>
        <button onClick={() => setShowGoalEditor(e => !e)} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
          <Target size={13} /> Goals {showGoalEditor ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Goal editor */}
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

      {/* Nutrition plan note */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
        <p className="text-blue-400 text-xs font-medium mb-0.5">Your Nutrition Plan</p>
        <p className="text-gray-400 text-xs">
          Plan will be set after you share your goal and personal data. Log meals below to track your macros.
          You can also send meal photos to the <span className="text-blue-400">#nutrition</span> channel and Clawckie will log them for you.
        </p>
      </div>

      {/* View toggle */}
      <div className="flex bg-gray-900 rounded-xl p-1 gap-1">
        {[['daily','Today'],['weekly','Week'],['monthly','Month']].map(([key, label]) => (
          <button key={key} onClick={() => setView(key)} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === key ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Macro summary */}
      <div className="card space-y-3">
        <p className="font-semibold text-sm">{view === 'daily' ? 'Today' : view === 'weekly' ? 'This Week' : 'This Month'}</p>
        <MacroBar macro="calories" label={`Calories (kcal)`} value={totals.calories} goal={scaledGoals.calories} />
        <MacroBar macro="protein"  label={`Protein (g)`}    value={totals.protein}  goal={scaledGoals.protein}  />
        <MacroBar macro="carbs"    label={`Carbs (g)`}      value={totals.carbs}    goal={scaledGoals.carbs}    />
        <MacroBar macro="fat"      label={`Fat (g)`}        value={totals.fat}      goal={scaledGoals.fat}      />
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-gray-800">
          {[['kcal', totals.calories, 'text-orange-400'],['g protein', totals.protein, 'text-yellow-400'],['g carbs', totals.carbs, 'text-blue-400'],['g fat', totals.fat, 'text-purple-400']].map(([unit, val, cls]) => (
            <div key={unit} className="text-center">
              <p className={`text-lg font-bold ${cls}`}>{val}</p>
              <p className="text-xs text-gray-600">{unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Log a meal */}
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
          <div>
            <label className="label">Calories</label>
            <input className="input" type="number" placeholder="500" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
          </div>
          <div>
            <label className="label">Protein (g)</label>
            <input className="input" type="number" placeholder="40" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
          </div>
          <div>
            <label className="label">Carbs (g)</label>
            <input className="input" type="number" placeholder="60" value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} />
          </div>
          <div>
            <label className="label">Fat (g)</label>
            <input className="input" type="number" placeholder="15" value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Note (optional)</label>
            <input className="input" placeholder="e.g. post-workout" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
        </div>
        <button onClick={addMeal} className="btn-primary w-full flex items-center justify-center gap-2">
          <Plus size={16} /> Log Meal
        </button>
      </div>

      {/* Meal history */}
      {filteredMeals.length === 0 ? (
        <div className="card flex flex-col items-center py-10 text-center">
          <Flame size={32} className="text-gray-700 mb-2" />
          <p className="text-gray-500 text-sm">No meals logged {view === 'daily' ? 'today' : `this ${view === 'weekly' ? 'week' : 'month'}`}.</p>
        </div>
      ) : view === 'daily' ? (
        <div className="space-y-2">
          {filteredMeals.sort((a,b) => b.id - a.id).map(meal => (
            <MealCard key={meal.id} meal={meal} onDelete={deleteMeal} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => (
            <div key={date}>
              <p className="text-xs text-gray-500 font-semibold mb-2">{formatDate(date)}</p>
              <div className="space-y-2">
                {mealsByDate[date].map(meal => (
                  <MealCard key={meal.id} meal={meal} onDelete={deleteMeal} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MealCard({ meal, onDelete }) {
  return (
    <div className="card flex justify-between items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{meal.name}</p>
        {meal.note && <p className="text-xs text-gray-500 mt-0.5">{meal.note}</p>}
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
