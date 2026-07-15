import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

const KPI_LABEL = {
  weight_lb:           { label: 'Weight',          unit: 'lb',   icon: '⚖️',  good: 'lower',  target: 162 },
  bmi:                 { label: 'BMI',              unit: '',     icon: '📊',  good: 'lower',  target: 22.0 },
  body_fat_pct:        { label: 'Body Fat',         unit: '%',    icon: '🔥',  good: 'lower',  target: 12 },
  fat_free_lb:         { label: 'Lean Mass',        unit: 'lb',   icon: '💪',  good: 'higher', target: 140 },
  muscle_mass_lb:      { label: 'Muscle Mass',      unit: 'lb',   icon: '🦾',  good: 'higher', target: 136 },
  skeletal_muscle_pct: { label: 'Skeletal Muscle',  unit: '%',    icon: '🏋️',  good: 'higher', target: 56 },
  body_water_pct:      { label: 'Body Water',       unit: '%',    icon: '💧',  good: 'higher', target: 62 },
  subcut_fat_pct:      { label: 'Subcutaneous Fat', unit: '%',    icon: '📏',  good: 'lower',  target: 12 },
  bone_mass_lb:        { label: 'Bone Mass',        unit: 'lb',   icon: '🦴',  good: 'stable', target: 6.8 },
  bmr_kcal:            { label: 'BMR',              unit: 'kcal', icon: '⚡',  good: 'higher', target: 1750 },
  visceral_fat:        { label: 'Visceral Fat',     unit: '',     icon: '🫀',  good: 'lower',  target: 5 },
  protein_pct:         { label: 'Protein',          unit: '%',    icon: '🥩',  good: 'higher', target: 21 },
  metabolic_age:       { label: 'Metabolic Age',    unit: 'yr',   icon: '🕐',  good: 'lower',  target: 35 },
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

// ─── SVG Timeline Chart ────────────────────────────────────────────────────
function TimelineChart({ data, field, meta }) {
  const [hovered, setHovered] = useState(null)
  const W = 600, H = 220, PAD = { top: 20, right: 20, bottom: 40, left: 48 }
  const iW = W - PAD.left - PAD.right
  const iH = H - PAD.top - PAD.bottom

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">No historical data yet.</div>
  }

  const values = data.map(d => d[field]).filter(v => v != null)
  if (values.length === 0) return null

  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 1
  const padV = range * 0.15

  const yMin = minV - padV
  const yMax = maxV + padV

  const xScale = i => PAD.left + (i / (data.length - 1 || 1)) * iW
  const yScale = v => PAD.top + iH - ((v - yMin) / (yMax - yMin)) * iH

  // Target line y
  const targetY = meta.target != null ? yScale(meta.target) : null
  const showTarget = targetY != null && targetY >= PAD.top && targetY <= PAD.top + iH

  // Build path
  const points = data.map((d, i) => {
    const v = d[field]
    return v != null ? [xScale(i), yScale(v)] : null
  }).filter(Boolean)

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const areaPath = points.length > 1
    ? `${linePath} L${points[points.length-1][0].toFixed(1)},${(PAD.top+iH).toFixed(1)} L${points[0][0].toFixed(1)},${(PAD.top+iH).toFixed(1)} Z`
    : ''

  // Y axis ticks
  const tickCount = 4
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => yMin + (yMax - yMin) * (i / tickCount))

  // X axis labels — show up to 6
  const xLabels = data.length <= 6
    ? data.map((d, i) => ({ i, label: d.date?.slice(5) }))
    : [0, Math.floor(data.length * 0.25), Math.floor(data.length * 0.5), Math.floor(data.length * 0.75), data.length - 1]
        .map(i => ({ i, label: data[i]?.date?.slice(5) }))

  const goodColor = meta.good === 'higher' ? '#34d399' : meta.good === 'lower' ? '#f87171' : '#60a5fa'
  const lineColor = '#6366f1' // indigo for the actual line always

  return (
    <div className="relative w-full" style={{ paddingBottom: `${(H / W) * 100}%` }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full"
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {ticks.map((v, i) => {
          const y = yScale(v)
          return (
            <g key={i}>
              <line x1={PAD.left} x2={PAD.left + iW} y1={y} y2={y} stroke="#27272a" strokeWidth="1" />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fill="#52525b" fontSize="10">
                {v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}
              </text>
            </g>
          )
        })}

        {/* Target line */}
        {showTarget && (
          <g>
            <line
              x1={PAD.left} x2={PAD.left + iW}
              y1={targetY} y2={targetY}
              stroke={goodColor} strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6"
            />
            <text x={PAD.left + iW + 4} y={targetY + 4} fill={goodColor} fontSize="9" opacity="0.8">
              Goal
            </text>
          </g>
        )}

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill="url(#area-grad)" />}

        {/* Line */}
        {linePath && <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

        {/* Dots + hover targets */}
        {data.map((d, i) => {
          const v = d[field]
          if (v == null) return null
          const cx = xScale(i), cy = yScale(v)
          const isHov = hovered === i
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={isHov ? 6 : 3.5} fill={isHov ? lineColor : '#18181b'} stroke={lineColor} strokeWidth="2" />
              {/* invisible larger hit area */}
              <rect
                x={cx - 20} y={PAD.top} width={40} height={iH}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
              />
            </g>
          )
        })}

        {/* X axis labels */}
        {xLabels.map(({ i, label }) => (
          <text key={i} x={xScale(i)} y={H - 6} textAnchor="middle" fill="#52525b" fontSize="10">
            {label}
          </text>
        ))}

        {/* Hover tooltip */}
        {hovered !== null && data[hovered]?.[field] != null && (() => {
          const d = data[hovered]
          const v = d[field]
          const cx = xScale(hovered), cy = yScale(v)
          const tipW = 90, tipH = 36
          const tx = Math.min(Math.max(cx - tipW / 2, PAD.left), PAD.left + iW - tipW)
          const ty = cy - tipH - 10 < PAD.top ? cy + 12 : cy - tipH - 10
          return (
            <g>
              <rect x={tx} y={ty} width={tipW} height={tipH} rx="6" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
              <text x={tx + tipW / 2} y={ty + 13} textAnchor="middle" fill="#a1a1aa" fontSize="9">{d.date}</text>
              <text x={tx + tipW / 2} y={ty + 28} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">
                {typeof v === 'number' && v % 1 !== 0 ? v.toFixed(1) : v}{meta.unit}
              </text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

// ─── KPI Timeline Modal ────────────────────────────────────────────────────
function KPIModal({ field, meta, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('body_composition_logs')
      .select('*')
      .order('date', { ascending: true })
      .then(({ data }) => {
        setHistory((data || []).filter(d => d[field] != null))
        setLoading(false)
      })
  }, [field])

  const first = history[0]
  const last = history[history.length - 1]
  const totalDelta = first && last ? last[field] - first[field] : null
  const t = totalDelta != null ? trend({ [field]: last?.[field] }, { [field]: first?.[field] }, field) : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{meta.icon}</span>
              <h2 className="text-lg font-bold text-white">{meta.label}</h2>
              {meta.unit && <span className="text-zinc-500 text-sm">({meta.unit})</span>}
            </div>
            {meta.target != null && (
              <p className="text-xs text-zinc-500 mt-0.5">Target: {meta.target}{meta.unit}</p>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Summary stats */}
        {!loading && history.length >= 2 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'First', value: first?.[field] },
              { label: 'Latest', value: last?.[field] },
              { label: 'Change', value: totalDelta, isChange: true },
            ].map(({ label, value, isChange }) => (
              <div key={label} className="bg-zinc-800 rounded-xl p-3 text-center">
                <p className="text-xs text-zinc-500 mb-1">{label}</p>
                <p className={`text-base font-bold ${isChange && t ? trendColor(t.dir, meta.good) : 'text-white'}`}>
                  {isChange
                    ? `${value > 0 ? '+' : ''}${typeof value === 'number' ? value.toFixed(1) : value}`
                    : typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value
                  }{meta.unit}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        {loading ? (
          <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">Loading...</div>
        ) : (
          <TimelineChart data={history} field={field} meta={meta} />
        )}

        <p className="text-xs text-zinc-600 text-center">{history.length} data point{history.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────
function KPICard({ field, value, prev, onClick }) {
  const meta = KPI_LABEL[field]
  if (!meta) return null
  const t = trend({ [field]: value }, prev, field)
  const formatted = typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value

  return (
    <button
      onClick={() => onClick(field)}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1 text-left hover:border-zinc-600 hover:bg-zinc-800/60 active:scale-[0.98] transition-all cursor-pointer w-full"
    >
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
        <div className="text-xs text-zinc-600 mt-1">Target: {meta.target}{meta.unit}</div>
      )}
    </button>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [latest, setLatest] = useState(null)
  const [prev, setPrev] = useState(null)
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeKpi, setActiveKpi] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: bodyData } = await supabase
        .from('body_composition_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(2)

      if (bodyData?.length > 0) setLatest(bodyData[0])
      if (bodyData?.length > 1) setPrev(bodyData[1])

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

  const handleKpiClick = useCallback((field) => setActiveKpi(field), [])
  const handleClose = useCallback(() => setActiveKpi(null), [])

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-500">Loading...</div>

  const bodyKpis = [
    'weight_lb', 'body_fat_pct', 'muscle_mass_lb', 'skeletal_muscle_pct',
    'fat_free_lb', 'body_water_pct', 'subcut_fat_pct', 'visceral_fat',
    'bone_mass_lb', 'bmr_kcal', 'protein_pct', 'metabolic_age', 'bmi',
  ]

  return (
    <>
      <div className="max-w-4xl mx-auto p-4 space-y-6">

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
            <p className="text-xs text-zinc-600 mb-3">Tap any card to see your progress over time.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {bodyKpis.map(field => (
                <KPICard key={field} field={field} value={latest[field]} prev={prev} onClick={handleKpiClick} />
              ))}
            </div>
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
              { label: 'Calories', val: todayMacros.cal,     goal: GOALS.cal,     unit: 'kcal', color: 'text-orange-400' },
              { label: 'Protein',  val: todayMacros.protein, goal: GOALS.protein, unit: 'g',    color: 'text-blue-400'   },
              { label: 'Carbs',    val: todayMacros.carbs,   goal: GOALS.carbs,   unit: 'g',    color: 'text-yellow-400' },
              { label: 'Fat',      val: todayMacros.fat,     goal: GOALS.fat,     unit: 'g',    color: 'text-rose-400'   },
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

      {/* KPI Timeline Modal */}
      {activeKpi && KPI_LABEL[activeKpi] && (
        <KPIModal field={activeKpi} meta={KPI_LABEL[activeKpi]} onClose={handleClose} />
      )}
    </>
  )
}
