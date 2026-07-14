import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { today } from '../utils/date'
import { DEFAULT_WORKOUT_PLAN, CATEGORY_META } from '../data/workoutPlan'
import { CheckCircle2, Plus, Minus, Dumbbell } from 'lucide-react'

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

      <div className={`mx-4 mt-3 rounded-xl h-56 flex items-center justify-center ${meta.light} border border-dashed border-gray-800`}>
        <div className="text-center">
          <Dumbbell size={32} className={`${meta.text} mx-auto`} />
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

export default function Workout() {
  const [workoutPlan] = useLocalStorage('workoutPlan', DEFAULT_WORKOUT_PLAN)
  const todayStr = today()
  const dayOfWeek = new Date().getDay()
  const todayKey = workoutPlan.schedule?.[dayOfWeek]

  let displayKey = todayKey
  let displayLabel = 'Today'
  let daysAhead = 0

  if (!todayKey) {
    for (let i = 1; i <= 7; i++) {
      const nextDow = (dayOfWeek + i) % 7
      if (workoutPlan.schedule?.[nextDow]) {
        displayKey = workoutPlan.schedule[nextDow]
        daysAhead = i
        const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
        displayLabel = i === 1 ? 'Tomorrow' : names[nextDow]
        break
      }
    }
  }

  const workout = displayKey ? workoutPlan.workouts?.[displayKey] : null

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
      date: todayStr,
      workout_key: displayKey,
      workout_name: workout.name,
      exercises: Object.fromEntries(withData.map(([id, e]) => [id, e.sets])),
      completed_at: new Date().toISOString(),
    }
    await supabase.from('workout_logs').insert(entry)
    setSaving(false)
    setSessionComplete(true)
  }

  if (!workout) {
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${daysAhead === 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
          {displayLabel}
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-tight">{workout.name}</h1>
          <p className="text-gray-500 text-sm">{workout.focus}</p>
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
            key={exercise.id}
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
