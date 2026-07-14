import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { today, formatDate, sortByDateDesc } from '../utils/date'
import { Plus, Trash2, Apple, ChevronDown } from 'lucide-react'

const emptyMeal = () => ({
  id: Date.now() + Math.random(),
  name: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
})

function MacroBar({ label, value, goal, color }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{value}g <span className="text-gray-500">/ {goal}g</span></span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Nutrition() {
  const [nutritionLog, setNutritionLog] = useLocalStorage('nutritionLog', [])
  const [goals, setGoals] = useLocalStorage('nutritionGoals', { calories: 2500, protein: 180, carbs: 250, fat: 80 })
  const [meals, setMeals] = useState([emptyMeal()])
  const [date, setDate] = useState(today())
  const [showGoals, setShowGoals] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const updateMeal = (id, field, value) =>
    setMeals(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))

  const removeMeal = (id) => setMeals(prev => prev.filter(m => m.id !== id))

  const totals = meals.reduce((acc, m) => ({
    calories: acc.calories + (parseFloat(m.calories) || 0),
    protein: acc.protein + (parseFloat(m.protein) || 0),
    carbs: acc.carbs + (parseFloat(m.carbs) || 0),
    fat: acc.fat + (parseFloat(m.fat) || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const saveDay = () => {
    const validMeals = meals.filter(m => m.name.trim())
    if (!validMeals.length) return
    const entry = { id: Date.now(), date, meals: validMeals, totals }
    setNutritionLog(prev => {
      const filtered = prev.filter(e => e.date !== date)
      return sortByDateDesc([entry, ...filtered])
    })
    setMeals([emptyMeal()])
  }

  const sorted = sortByDateDesc(nutritionLog)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Nutrition</h1>

      {/* Goals */}
      <div className="card">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setShowGoals(v => !v)}
        >
          <span className="font-semibold">Daily Goals</span>
          <ChevronDown size={16} className={`text-gray-500 transition-transform ${showGoals ? 'rotate-180' : ''}`} />
        </button>
        {showGoals && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {['calories', 'protein', 'carbs', 'fat'].map(k => (
              <div key={k}>
                <label className="label">{k} {k === 'calories' ? '(kcal)' : '(g)'}</label>
                <input
                  className="input"
                  type="number"
                  value={goals[k]}
                  onChange={e => setGoals(prev => ({ ...prev, [k]: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="label">Date</label>
        <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {/* Meals */}
      <div className="space-y-3">
        {meals.map((meal, idx) => (
          <div key={meal.id} className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 font-medium">Meal {idx + 1}</span>
              {meals.length > 1 && (
                <button onClick={() => removeMeal(meal.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <input
              className="input"
              placeholder="Meal name (e.g. Chicken & Rice)"
              value={meal.name}
              onChange={e => updateMeal(meal.id, 'name', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              {[['calories', 'Calories (kcal)'], ['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'], ['fat', 'Fat (g)']].map(([k, lbl]) => (
                <div key={k}>
                  <label className="label">{lbl}</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="0"
                    value={meal[k]}
                    onChange={e => updateMeal(meal.id, k, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setMeals(prev => [...prev, emptyMeal()])}
        className="btn-secondary w-full flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add Meal
      </button>

      {/* Daily totals */}
      <div className="card space-y-3">
        <p className="font-semibold">Today's Totals</p>
        <div className="flex justify-between items-center">
          <span className="text-3xl font-bold text-white">{Math.round(totals.calories)}</span>
          <span className="text-gray-500 text-sm">/ {goals.calories} kcal</span>
        </div>
        <MacroBar label="Protein" value={Math.round(totals.protein)} goal={goals.protein} color="bg-blue-500" />
        <MacroBar label="Carbs" value={Math.round(totals.carbs)} goal={goals.carbs} color="bg-yellow-500" />
        <MacroBar label="Fat" value={Math.round(totals.fat)} goal={goals.fat} color="bg-orange-500" />
      </div>

      <button onClick={saveDay} className="btn-primary w-full py-3">Save Day</button>

      {/* History */}
      <div>
        <button
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          onClick={() => setShowHistory(v => !v)}
        >
          <ChevronDown size={14} className={showHistory ? 'rotate-180 transition-transform' : 'transition-transform'} />
          Nutrition History ({sorted.length} days)
        </button>

        {showHistory && sorted.length > 0 && (
          <div className="mt-3 space-y-2">
            {sorted.map(entry => (
              <div key={entry.id} className="card">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{formatDate(entry.date)}</span>
                  <span className="text-green-400 font-semibold">{Math.round(entry.totals.calories)} kcal</span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                  <span>P: {Math.round(entry.totals.protein)}g</span>
                  <span>C: {Math.round(entry.totals.carbs)}g</span>
                  <span>F: {Math.round(entry.totals.fat)}g</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {showHistory && !sorted.length && (
          <div className="mt-3 card flex flex-col items-center py-8 text-center">
            <Apple size={28} className="text-gray-700 mb-2" />
            <p className="text-gray-500 text-sm">No nutrition history yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
