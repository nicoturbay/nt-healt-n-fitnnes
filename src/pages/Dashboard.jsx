import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const KPI_LABEL = {
  weight_lb:           { label: 'Weight',           unit: 'lb',   icon: '⚖️',  good: 'lower', target: 162 },
  bmi:                 { label: 'BMI',               unit: '',     icon: '📊',  good: 'lower', target: 22.0 },
  body_fat_pct:        { label: 'Body Fat',          unit: '%',    icon: '🔥',  good: 'lower', target: 12 },
  fat_free_lb:         { label: 'Lean Mass',         unit: 'lb',   icon: '💪',  good: 'higher', target: 140 },
  muscle_mass_lb:      { label: 'Muscle Mass',       unit: 'lb',   icon: '🦾',  good: 'higher', target: 136 },
  skeletal_muscle_pct: { label: 'Skeletal Muscle',   unit: '%',    icon: '🏋️',  good: 'higher', target: 56 },
  body_water_pct:      { label: 'Body Water',        unit: '%',    icon: '💧',  good: 'higher', target: 62 },
  subcut_fat_pct:      { label: 'Subcutaneous Fat',  unit: '%',    icon: '📏',  good: 'lower', target: 12 },
  bone_mass_lb:        { label: 'Bone Mass',         unit: 'lb',   icon: '🦴',  good: 'stable', target: 6.8 },
  bmr_kcal:            { label: 'BMR',               unit: 'kcal', icon: '⚡',  good: 'higher', target: 1750 },
  visceral_fat:        { label: 'Visceral Fat',      unit: '',     icon: '🫀',  good: 'lower', target: 5 },
  protein_pct:         { label: 'Protein',           unit: '%',    icon: '🥩',  good: 'higher', target: 21 },
  metabolic_age:       { label: 'Metabolic Age',     unit: 'yr',   icon: '🕐',  good: 'lower', target: 35 },
}

function trend(curr, prev, key) {
  if (!prev || prev[key] == null || curr[key] == null) return null
  const delta = curr[key] - prev[key]
  if (Math.abs(delta) < 0.1) return { dir: 'flat', delta }
  return { dir: delta > 0 ? 'up' : 'down', delta }
}

function trendColor(dir, good) {
  if (dir === 'flat') return 'text-zinc-400'
  if (good === 'stable') return 'text-zinc-400'
  if (good === 'higher') return dir === 'up' ? 'text-emerald-400' : 'text-rose-400'
  if (good === 'lower')  return dir === 'down' ? 'text-emerald-400' : 'text-rose-400'
  return 'text-zinc-400'
}

function trendArrow(dir) {
  if (dir === 'flat') return '→'
  return dir === 'up' ? '↑' : '↓'
}

function KPICard({ field, value, prev }) {
  const meta = KPI_LABEL[field]
  if (!meta) return null
  const t = trend({ [field]: value }, prev, field)
  const formatted = field === 'bmi' ? value?.toFixed(1)
    : field === 'visceral_fat' || field === 'metabolic_age' ? value
    : value?.toFixed(1)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 uppercase tracking-wide">{meta.label}</span>
        <span className="text-base">{meta.icon}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">
          {formatted ?? '—'}
          <span className="text-sm font-normal text-zinc-500 ml-1">{meta.unit}</span>
        </span>
        {t && (
          <span className={`text-sm font-medium pb-0.5 ${trendColor(t.dir, meta.good)}`}>
            {trendArrow(t.dir)} {Math.abs(t.delta).toFixed(1)}
          </span>
        )}
      </div>
      {meta.target != null && (
        <div className="text-xs text-zinc-600 mt-1">
          Target: {meta.target}{meta.unit}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [latest, setLatest] = useState(null)
  const [prev, setPrev] = useState(null)
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Body composition — latest 2 readings
      const { data: bodyData } = await supabase
        .from('body_composition_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(2)

      if (bodyData?.length > 0) setLatest(bodyData[0])
      if (bodyData?.length > 1) setPrev(bodyData[1])

      // Today's meals
      const today = new Date().toISOString().slice(0, 10)
      const { data: mealData } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('date', today)
        .order('id', { ascending: false })

      setMeals(mealData || [])
      setLoading(false)
    }
    load()
  }, [])

  const todayMacros = meals.reduce(
    (acc, m) => ({
      cal: acc.cal + (m.calories || 0),
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fat: acc.fat + (m.fat || 0),
    }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const GOALS = { cal: 2400, protein: 165, carbs: 240, fat: 70 }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Loading...
      </div>
    )
  }

  const bodyKpis = [
    'weight_lb', 'body_fat_pct', 'muscle_mass_lb', 'skeletal_muscle_pct',
    'fat_free_lb', 'body_water_pct', 'subcut_fat_pct', 'visceral_fat',
    'bone_mass_lb', 'bmr_kcal', 'protein_pct', 'metabolic_age'
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {latest
            ? `Last weigh-in: ${latest.date} at ${latest.time?.slice(0, 5) ?? ''}`
            : 'No weigh-in data yet. Send your scale screenshot to #data-input.'}
        </p>
      </div>

      {/* Body Composition Grid */}
      {latest ? (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Body Composition</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {bodyKpis.map(field => (
              <KPICard key={field} field={field} value={latest[field]} prev={prev} />
            ))}
          </div>
          {latest.bmi != null && (
            <div className="mt-3 flex items-center gap-2">
              <KPICard field="bmi" value={latest.bmi} prev={prev} />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center text-zinc-500">
          No body composition data yet. Send your smart scale screenshot to #data-input each morning.
        </div>
      )}

      {/* Today's Nutrition */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Today's Nutrition</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Calories', val: todayMacros.cal, goal: GOALS.cal, unit: 'kcal', color: 'text-orange-400' },
            { label: 'Protein',  val: todayMacros.protein, goal: GOALS.protein, unit: 'g', color: 'text-blue-400' },
            { label: 'Carbs',    val: todayMacros.carbs, goal: GOALS.carbs, unit: 'g', color: 'text-yellow-400' },
            { label: 'Fat',      val: todayMacros.fat, goal: GOALS.fat, unit: 'g', color: 'text-rose-400' },
          ].map(({ label, val, goal, unit, color }) => {
            const pct = Math.min(100, Math.round((val / goal) * 100))
            return (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{label}</div>
                <div className={`text-xl font-bold ${color}`}>
                  {Math.round(val)}<span className="text-sm font-normal text-zinc-500 ml-1">{unit}</span>
                </div>
                <div className="mt-2 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full bg-current ${color}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-zinc-600 mt-1">{pct}% of {goal}{unit}</div>
              </div>
            )
          })}
        </div>
        {meals.length > 0 && (
          <div className="mt-3 text-xs text-zinc-500">{meals.length} meal{meals.length !== 1 ? 's' : ''} logged today</div>
        )}
      </div>

    </div>
  )
}
