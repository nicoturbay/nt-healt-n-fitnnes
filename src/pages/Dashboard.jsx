import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

// Targets: Fight Club physique — ~10% BF, ~158 lb, +5 lb muscle
// Nicolas: 42M, 5'11", baseline 163.1 lb / 16% BF
const KPI_LABEL = {
  weight_lb:           { label: 'Weight',          unit: 'lb',   icon: '⚖️',  good: 'lower',  target: 158,  note: 'Drop ~5 lb fat, gain ~5 lb muscle' },
  bmi:                 { label: 'BMI',              unit: '',     icon: '📊',  good: 'lower',  target: 22.0, note: 'Lean but not underweight' },
  body_fat_pct:        { label: 'Body Fat',         unit: '%',    icon: '🔥',  good: 'lower',  target: 10,   note: 'Fight Club definition starts here' },
  fat_free_lb:         { label: 'Lean Mass',        unit: 'lb',   icon: '💪',  good: 'higher', target: 142,  note: '+5 lb from current baseline' },
  muscle_mass_lb:      { label: 'Muscle Mass',      unit: 'lb',   icon: '🦾',  good: 'higher', target: 135,  note: '+5 lb lean muscle over 16-20 wks' },
  skeletal_muscle_pct: { label: 'Skeletal Muscle',  unit: '%',    icon: '🏋️',  good: 'higher', target: 57,   note: 'Rises as fat drops' },
  body_water_pct:      { label: 'Body Water',       unit: '%',    icon: '💧',  good: 'higher', target: 63,   note: 'Higher with more muscle' },
  subcut_fat_pct:      { label: 'Subcutaneous Fat', unit: '%',    icon: '📏',  good: 'lower',  target: 9,    note: 'Visible cuts below 10%' },
  bone_mass_lb:        { label: 'Bone Mass',        unit: 'lb',   icon: '🦴',  good: 'stable', target: 6.8,  note: 'Maintain — already optimal' },
  bmr_kcal:            { label: 'BMR',              unit: 'kcal', icon: '⚡',  good: 'higher', target: 1780, note: 'More muscle = higher resting burn' },
  visceral_fat:        { label: 'Visceral Fat',     unit: '',     icon: '🫀',  good: 'lower',  target: 4,    note: 'Already excellent — push lower' },
  protein_pct:         { label: 'Protein',          unit: '%',    icon: '🥩',  good: 'higher', target: 21,   note: 'Rises with muscle mass gains' },
  metabolic_age:       { label: 'Metabolic Age',    unit: 'yr',   icon: '🕐',  good: 'lower',  target: 34,   note: '8 years below real age' },
}

// ─── Goal Progress Engine (Fight Club targets) ───────────────────────────
const BASELINES = {
  weight_lb:           163.1,
  body_fat_pct:        16.0,
  fat_free_lb:         136.9,
  muscle_mass_lb:      130.0,
  skeletal_muscle_pct: 54.2,
  body_water_pct:      60.5,
  subcut_fat_pct:      14.2,
  bone_mass_lb:        6.8,
  bmr_kcal:            1695,
  visceral_fat:        6,
  protein_pct:         19.1,
  metabolic_age:       39,
  bmi:                 22.8,
}

const GOAL_WEIGHTS = {
  body_fat_pct:        25,
  muscle_mass_lb:      18,
  weight_lb:           12,
  subcut_fat_pct:      10,
  fat_free_lb:          8,
  skeletal_muscle_pct:  7,
  visceral_fat:         6,
  body_water_pct:       5,
  metabolic_age:        4,
  bmr_kcal:             3,
  protein_pct:          1,
  bone_mass_lb:         1,
}

const START_DATE = new Date('2026-07-15')
const TOTAL_WEEKS = 22

function weeksElapsed() {
  return Math.max(0, Math.round((new Date() - START_DATE) / (7 * 24 * 60 * 60 * 1000)))
}

function computeGoalScore(data) {
  if (!data) return { score: 0, breakdown: [] }
  let weightedSum = 0, totalWeight = 0
  const breakdown = []
  for (const [field, weight] of Object.entries(GOAL_WEIGHTS)) {
    const meta = KPI_LABEL[field]
    const current = data[field]
    const baseline = BASELINES[field]
    const target = meta?.target
    if (current == null || baseline == null || target == null) continue
    let progress
    if (meta.good === 'stable') {
      progress = 1.0
    } else if (meta.good === 'lower') {
      const range = baseline - target
      progress = range === 0 ? 1 : Math.min(1, Math.max(0, (baseline - current) / range))
    } else {
      const range = target - baseline
      progress = range === 0 ? 1 : Math.min(1, Math.max(0, (current - baseline) / range))
    }
    weightedSum += weight * progress
    totalWeight += weight
    breakdown.push({ field, label: meta.label, icon: meta.icon, unit: meta.unit ?? '', progress, weight, current, target })
  }
  const score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0
  breakdown.sort((a, b) => a.progress - b.progress) // lowest progress first
  return { score, breakdown }
}

// ─── Absolute Health Score Engine ──────────────────────────────────────────
// Scores each KPI against clinical benchmarks for a 42-year-old male.
// Not progress toward a goal — your actual health state, right now.

function rangeScore(value, pts) {
  if (value <= pts[0][0]) return pts[0][1]
  if (value >= pts[pts.length - 1][0]) return pts[pts.length - 1][1]
  for (let i = 0; i < pts.length - 1; i++) {
    const [v0, s0] = pts[i], [v1, s1] = pts[i + 1]
    if (value >= v0 && value <= v1) {
      return Math.round(s0 + ((value - v0) / (v1 - v0)) * (s1 - s0))
    }
  }
  return 0
}

// Clinical reference ranges — 42-year-old male
const HEALTH_RANGES = {
  // ACE body fat standards: <6 essential, 6-13 athlete, 14-17 fit, 18-24 avg, 25+ obese
  body_fat_pct:        v => rangeScore(v, [[6,100],[13,95],[17,82],[20,65],[24,40],[28,15],[33,0]]),
  // Skeletal muscle %: 40-44 low, 44-50 avg, 50-55 good, 55+ excellent
  skeletal_muscle_pct: v => rangeScore(v, [[38,0],[44,40],[50,72],[55,90],[59,100]]),
  // Visceral fat: 1-4 excellent, 5-9 normal, 10-14 high, 15+ very high
  visceral_fat:        v => rangeScore(v, [[1,100],[4,96],[9,68],[14,28],[20,0]]),
  // Metabolic age vs chronological age 42
  metabolic_age:       v => rangeScore(v, [[28,100],[35,95],[42,72],[48,45],[56,18],[65,0]]),
  // Body water %: 55-65% healthy male range
  body_water_pct:      v => rangeScore(v, [[50,15],[55,60],[60,86],[63,100],[67,84],[72,55]]),
  // BMI: optimal 20-23 for lean males
  bmi:                 v => rangeScore(v, [[16,15],[18.5,72],[20,100],[23,100],[25,74],[27.5,44],[30,10],[35,0]]),
  // Subcutaneous fat %
  subcut_fat_pct:      v => rangeScore(v, [[7,100],[11,90],[15,74],[18,54],[22,28],[28,0]]),
  // Protein %: 16-20 normal, 20%+ excellent
  protein_pct:         v => rangeScore(v, [[13,20],[16,58],[18,80],[20,96],[23,100]]),
  // BMR for 42M at ~163 lb
  bmr_kcal:            v => rangeScore(v, [[1350,25],[1600,65],[1700,82],[1800,96],[1950,100]]),
  // Bone mass for 154-176 lb male
  bone_mass_lb:        v => rangeScore(v, [[5.5,35],[6.2,70],[6.6,92],[6.8,100],[7.3,100],[7.9,78]]),
}

// Weight = how much this metric influences the overall score
const SCORE_WEIGHTS = {
  body_fat_pct:        26,
  skeletal_muscle_pct: 20,
  visceral_fat:        16,
  metabolic_age:       14,
  body_water_pct:       8,
  bmi:                  6,
  subcut_fat_pct:       4,
  protein_pct:          3,
  bmr_kcal:             2,
  bone_mass_lb:         1,
}

function kpiTier(s) {
  if (s >= 90) return { label: 'Elite',         color: '#f59e0b' }
  if (s >= 75) return { label: 'Excellent',     color: '#34d399' }
  if (s >= 60) return { label: 'Good',          color: '#60a5fa' }
  if (s >= 45) return { label: 'Average',       color: '#a78bfa' }
  if (s >= 28) return { label: 'Below Avg',     color: '#fb923c' }
  return              { label: 'Poor',           color: '#f87171' }
}

function computeScore(data) {
  if (!data) return { score: 0, breakdown: [] }
  let weightedSum = 0, totalWeight = 0
  const breakdown = []
  for (const [field, weight] of Object.entries(SCORE_WEIGHTS)) {
    const scoreFn = HEALTH_RANGES[field]
    const current = data[field]
    if (!scoreFn || current == null) continue
    const kpiScore = scoreFn(current)
    weightedSum += weight * kpiScore
    totalWeight += weight
    breakdown.push({
      field,
      label:    KPI_LABEL[field]?.label ?? field,
      icon:     KPI_LABEL[field]?.icon ?? '',
      unit:     KPI_LABEL[field]?.unit ?? '',
      kpiScore, weight, value: current,
      tier: kpiTier(kpiScore),
    })
  }
  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
  // sort weakest first — most actionable at top
  breakdown.sort((a, b) => a.kpiScore - b.kpiScore)
  return { score, breakdown }
}

function scoreStatus(score) {
  if (score >= 90) return { label: 'Elite',         color: '#f59e0b' }
  if (score >= 75) return { label: 'Excellent',     color: '#34d399' }
  if (score >= 60) return { label: 'Good',          color: '#60a5fa' }
  if (score >= 45) return { label: 'Average',       color: '#a78bfa' }
  if (score >= 28) return { label: 'Below Average', color: '#fb923c' }
  return                  { label: 'Poor',           color: '#f87171' }
}

// ─── Arc Ring (SVG) ───────────────────────────────────────────────────────
function ArcRing({ score, color }) {
  const R = 52, C = 64, STROKE = 9
  const circ = 2 * Math.PI * R
  // Arc goes from -225deg to +45deg (270deg sweep = 75% of circle)
  const SWEEP = 0.75
  const dashArray = circ
  const trackOffset = circ * (1 - SWEEP)
  const fillOffset  = circ * (1 - SWEEP * (score / 100))
  const rot = -225
  return (
    <svg width={C * 2} height={C * 2} viewBox={`0 0 ${C*2} ${C*2}`} className="shrink-0">
      {/* track */}
      <circle cx={C} cy={C} r={R} fill="none" stroke="#27272a" strokeWidth={STROKE}
        strokeDasharray={`${circ * SWEEP} ${circ * (1 - SWEEP)}`}
        strokeLinecap="round"
        transform={`rotate(${rot} ${C} ${C})`} />
      {/* fill */}
      <circle cx={C} cy={C} r={R} fill="none" stroke={color} strokeWidth={STROKE}
        strokeDasharray={`${circ * SWEEP * (score/100)} ${circ * (1 - SWEEP * (score/100))}`}
        strokeLinecap="round"
        transform={`rotate(${rot} ${C} ${C})`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x={C} y={C - 4} textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="sans-serif">
        {score}
      </text>
      <text x={C} y={C + 14} textAnchor="middle" fill="#71717a" fontSize="9" fontFamily="sans-serif">
        / 100
      </text>
    </svg>
  )
}

// ─── Overall Score Card ───────────────────────────────────────────────────
function OverallScoreCard({ latest, prev }) {
  const { score, breakdown } = computeScore(latest)
  const { score: prevScore } = computeScore(prev)
  const status = scoreStatus(score)
  const delta  = prev ? score - prevScore : null

  // Show all KPIs, weakest first (most actionable)
  const rows = breakdown

  return (
    <div
      className="col-span-2 sm:col-span-3 lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5"
      style={{ borderColor: status.color + '33' }}
    >
      <div className="flex flex-col sm:flex-row gap-5 items-start">

        {/* LEFT — arc + score + label */}
        <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-2 shrink-0">
          <ArcRing score={score} color={status.color} />
          <div className="sm:text-center">
            <div className="font-bold text-base" style={{ color: status.color }}>{status.label}</div>
            <div className="text-xs text-zinc-500 mt-1">Health score · 42M</div>
            {delta !== null && (
              <div className={`text-xs font-medium mt-1 ${ delta >= 0 ? 'text-emerald-400' : 'text-rose-400' }`}>
                {delta >= 0 ? '+' : ''}{delta} pts since last
              </div>
            )}
          </div>
        </div>

        {/* DIVIDER */}
        <div className="hidden sm:block w-px bg-zinc-800 self-stretch" />

        {/* RIGHT — KPI breakdown, weakest first */}
        <div className="flex-1 w-full">
          <div className="text-xs text-zinc-500 uppercase tracking-wide mb-3">How you measure up · weakest first</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {rows.map(({ field, label, icon, unit, kpiScore, weight, value, tier }) => (
              <div key={field}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <span>{icon}</span>{label}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: tier.color }}>
                    {tier.label}
                  </span>
                </div>
                <div className="bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${kpiScore}%`, backgroundColor: tier.color }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-700 mt-0.5">
                  <span>{value != null ? (typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value) : '—'}{unit}</span>
                  <span>{kpiScore}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Goal Progress Card ───────────────────────────────────────────────────
function GoalProgressCard({ latest, prev }) {
  const { score, breakdown } = computeGoalScore(latest)
  const { score: prevScore } = computeGoalScore(prev)
  const delta    = prev ? score - prevScore : null
  const elapsed  = weeksElapsed()
  const remaining = Math.max(0, TOTAL_WEEKS - elapsed)

  const goalColor =
    score >= 80 ? '#f59e0b' :
    score >= 55 ? '#34d399' :
    score >= 30 ? '#60a5fa' : '#a78bfa'

  const goalLabel =
    score >= 95 ? 'Fight Club Ready' :
    score >= 75 ? 'Advanced'         :
    score >= 50 ? 'Strong Progress'  :
    score >= 25 ? 'Building'         : 'Getting Started'

  return (
    <div
      className="col-span-2 sm:col-span-3 lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5"
      style={{ borderColor: goalColor + '33' }}
    >
      <div className="flex flex-col sm:flex-row gap-5 items-start">

        {/* LEFT — arc + label */}
        <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-2 shrink-0">
          <ArcRing score={score} color={goalColor} />
          <div className="sm:text-center">
            <div className="font-bold text-base" style={{ color: goalColor }}>{goalLabel}</div>
            <div className="text-xs text-zinc-500 mt-1">Goal progress · 22 wks</div>
            <div className="text-xs text-zinc-600 mt-0.5">
              {delta !== null && (
                <span className={delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {delta >= 0 ? '+' : ''}{delta} pts &nbsp;
                </span>
              )}
              Wk {elapsed} · {remaining} left
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="hidden sm:block w-px bg-zinc-800 self-stretch" />

        {/* RIGHT — KPI progress bars, lowest first */}
        <div className="flex-1 w-full">
          <div className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Progress toward Fight Club · furthest behind first</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {breakdown.map(({ field, label, icon, unit, progress, weight, current, target }) => {
              const pct = Math.round(progress * 100)
              const barColor =
                pct >= 75 ? '#34d399' :
                pct >= 45 ? '#60a5fa' :
                pct >= 20 ? '#fb923c' : '#f87171'
              return (
                <div key={field}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <span>{icon}</span>{label}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: barColor }}>{pct}%</span>
                  </div>
                  <div className="bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-700 mt-0.5">
                    <span>{current != null ? (typeof current === 'number' && current % 1 !== 0 ? current.toFixed(1) : current) : '—'}{unit}</span>
                    <span>Target: {target}{unit}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
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
              <p className="text-xs text-zinc-500 mt-0.5">Target: {meta.target}{meta.unit}{meta.note && <span className="text-zinc-600"> · {meta.note}</span>}</p>
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
        <div className="text-xs text-zinc-600 mt-1" title={meta.note}>Target: {meta.target}{meta.unit}</div>
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
              <OverallScoreCard latest={latest} prev={prev} />
              <GoalProgressCard latest={latest} prev={prev} />
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
