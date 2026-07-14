import { useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { today } from '../utils/date'
import { DEFAULT_WORKOUT_PLAN, CATEGORY_META } from '../data/workoutPlan'
import { CheckCircle2, Plus, Minus, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react'

// ExerciseCard — input only, no log button
function ExerciseCard({ exercise, onChange, completed }) {
  const meta = CATEGORY_META[exercise.category] || CATEGORY_META.chest
  const [sets, setSets] = useState(
    Array.from({ length: exercise.targetSets }, () => ({ reps: '', weight: '' }))
  )

  const updateSet = (i, field, val) => {
    const next = sets.map((s, idx) => idx === i ? { ...s, [field]: val } : s)
    setSets(next)
    onChange(exercise.id, exercise.name, next)
  }

  const addSet = () => {
    const next = [...sets, { reps: '', weight: '' }]
    setSets(next)
    onChange(exercise.id, exercise.name, next)
  }

  const removeSet = () => {
    if (sets.length <= 1) return
    const next = sets.slice(0, -1)
    setSets(next)
    onChange(exercise.id, exercise.name, next)
  }

  const filledSets = sets.filter(s => s.reps).length

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden border transition-all h-full ${
      completed ? 'border-green-500/50 bg-green-500/5' : 'border-gray-800 bg-gray-900'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 ${meta.light} flex items-center gap-2.5`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${meta.color} text-black`}>
          {exercise.category.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{exercise.name}</p>
          <p className={`text-xs mt-0.5 ${meta.text}`}>{meta.label}</p>
        </div>
        {completed && <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />}
      </div>

      <p className="text-gray-500 text-xs px-4 pt-3 leading-relaxed">{exercise.description}</p>

      {/* aspect-[4/3] keeps ratio consistent at any card width */}
      <div className={`mx-4 mt-3 rounded-xl aspect-[4/3] relative overflow-hidden ${meta.light} border border-dashed border-gray-800`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Dumbbell size={32} className={`${meta.text}`} />
          <p className="text-xs text-gray-600 mt-2">Illustration coming soon</p>
        </div>
      </div>

      {/* Sets */}
      <div className="px-4 pt-3 pb-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.light} ${meta.text}`}>
            {exercise.targetSets} × {exercise.targetReps}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={removeSet} className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
              <Minus size={11} />
            </button>
            <span className="text-xs text-gray-500 w-10 text-center">{sets.length} sets</span>
            <button onClick={addSet} className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
              <Plus size={11} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-1 mb-1">
          <div className="col-span-1 text-[10px] text-gray-700 text-center">#</div>
          <div className="col-span-6 text-[10px] text-gray-600 text-center">lbs</div>
          <div className="col-span-5 text-[10px] text-gray-600 text-center">reps</div>
        </div>

        <div className="space-y-1.5 flex-1">
          {sets.map((set, i) => (
            <div key={i} className="grid grid-cols-12 gap-1 items-center">
              <div className="col-span-1 text-[10px] text-gray-700 text-center font-medium">{i + 1}</div>
              <input
                className="col-span-6 bg-gray-800 border border-gray-700 rounded-lg text-center text-xs py-1.5 text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
                type="number" placeholder="0" value={set.weight}
                onChange={e => updateSet(i, 'weight', e.target.value)}
              />
              <input
                className="col-span-5 bg-gray-800 border border-gray-700 rounded-lg text-center text-xs py-1.5 text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
                type="number" placeholder={exercise.targetReps.toString().split('–')[0]} value={set.reps}
                onChange={e => updateSet(i, 'reps', e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Progress indicator — no button */}
        {filledSets > 0 && (
          <p className={`mt-3 text-xs text-center ${filledSets === sets.length ? 'text-green-400' : 'text-gray-500'}`}>
            {filledSets}/{sets.length} sets filled
          </p>
        )}
      </div>
    </div>
  )
}

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function dateFromOffset(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d
}

function formatDayLabel(offset, date) {
  if (offset === 0) return 'Today'
  if (offset === 1) return 'Tomorrow'
  if (offset === -1) return 'Yesterday'
  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`
}

export default function Workout() {
  const [workoutPlan] = useLocalStorage('workoutPlan', DEFAULT_WORKOUT_PLAN)
  const todayStr = today()

  // offset = days from today; 0 = today
  const [offset, setOffset] = useState(() => {
    // start on today if it has a workout, otherwise find next planned day
    const dow = new Date().getDay()
    if (workoutPlan.schedule?.[dow]) return 0
    for (let i = 1; i <= 7; i++) {
      if (workoutPlan.schedule?.[(dow + i) % 7]) return i
    }
    return 0
  })

  const selectedDate = useMemo(() => dateFromOffset(offset), [offset])
  const selectedDow = selectedDate.getDay()
  const selectedDateStr = selectedDate.toISOString().split('T')[0]
  const workoutKey = workoutPlan.schedule?.[selectedDow] ?? null
  const workout = workoutKey ? workoutPlan.workouts?.[workoutKey] : null
  const dayLabel = formatDayLabel(offset, selectedDate)
  const isToday = offset === 0
  const isFuture = offset > 0

  // Navigate to prev/next planned workout day
  const navigate = (dir) => {
    setOffset(prev => {
      for (let i = 1; i <= 14; i++) {
        const next = prev + dir * i
        const dow = dateFromOffset(next).getDay()
        if (workoutPlan.schedule?.[dow]) return next
      }
      return prev
    })
    setExerciseData({})
    setSessionComplete(false)
  }

  // All exercise data lives here, updated on every keystroke
  const [exerciseData, setExerciseData] = useState({})
  const [saving, setSaving] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)

  const handleExerciseChange = useCallback((id, name, sets) => {
    setExerciseData(prev => ({ ...prev, [id]: { name, sets } }))
  }, [])

  // Count exercises with at least one rep filled
  const filledCount = Object.values(exerciseData).filter(
    e => e.sets.some(s => s.reps)
  ).length
  const totalExercises = workout?.exercises?.length || 0

  const logWorkout = async () => {
    const withData = Object.entries(exerciseData).filter(([, e]) => e.sets.some(s => s.reps))
    if (!withData.length) return
    setSaving(true)
    const entry = {
      id: Date.now(),
      date: selectedDateStr,
      workout_key: workoutKey,
      workout_name: workout.name,
      exercises: Object.fromEntries(withData.map(([id, e]) => [id, e.sets])),
      completed_at: new Date().toISOString(),
    }
    await supabase.from('workout_logs').insert(entry)
    setSaving(false)
    setSessionComplete(true)
  }

  if (!workoutKey && !workout) {
    // No plan at all
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Workout</h1>
        <div className="card flex flex-col items-center py-16 text-center">
          <Dumbbell size={40} className="text-gray-700 mb-4" />
          <p className="font-semibold text-lg">No workout plan yet</p>
          <p className="text-gray-500 text-sm mt-2 max-w-xs">Send Clawckie your gym equipment and goals to get your custom plan.</p>
        </div>
      </div>
    )
  }

  if (sessionComplete) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Workout</h1>
        <div className="card flex flex-col items-center py-16 text-center">
          <CheckCircle2 size={48} className="text-green-400 mb-4" />
          <p className="font-bold text-xl">Workout logged</p>
          <p className="text-gray-500 text-sm mt-2">
            {filledCount} of {totalExercises} exercises saved.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
            isToday ? 'bg-green-500/20 text-green-400' : isFuture ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400'
          }`}>
            {dayLabel}
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-tight">{workout.name}</h1>
            <p className="text-gray-500 text-sm">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {workout.focus}
            </p>
          </div>
        </div>
        {/* Prev / Next navigation */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            title="Previous workout"
          >
            <ChevronLeft size={18} />
          </button>
          {!isToday && (
            <button
              onClick={() => { setOffset(0); setExerciseData({}); setSessionComplete(false) }}
              className="px-3 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={() => navigate(1)}
            className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            title="Next workout"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {workoutPlan.note && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
          <p className="text-amber-400 text-xs">{workoutPlan.note}</p>
        </div>
      )}

      {/* Exercise cards — input only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workout.exercises.map(exercise => (
          <ExerciseCard
            key={`${selectedDateStr}-${exercise.id}`}
            exercise={exercise}
            onChange={handleExerciseChange}
            completed={exerciseData[exercise.id]?.sets?.every(s => s.reps)}
          />
        ))}
      </div>

      {/* Single log button */}
      <button
        onClick={logWorkout}
        disabled={saving || filledCount === 0}
        className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
          filledCount > 0
            ? 'bg-green-500 text-black hover:bg-green-400 active:scale-[0.99]'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        } disabled:opacity-60`}
      >
        {saving
          ? 'Saving...'
          : filledCount > 0
          ? `Log Workout${filledCount < totalExercises ? ` (${filledCount}/${totalExercises} exercises)` : ''}`
          : 'Fill in at least one exercise to log'
        }
      </button>
    </div>
  )
}
