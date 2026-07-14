import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { today } from '../utils/date'
import { DEFAULT_WORKOUT_PLAN, CATEGORY_META } from '../data/workoutPlan'
import { CheckCircle2, Plus, Minus, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'

function ExerciseCard({ exercise, onLog }) {
  const meta = CATEGORY_META[exercise.category] || CATEGORY_META.chest
  const [expanded, setExpanded] = useState(true)
  const [sets, setSets] = useState(
    Array.from({ length: exercise.targetSets }, () => ({ reps: '', weight: '' }))
  )
  const [logged, setLogged] = useState(false)

  const updateSet = (i, field, val) => {
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }
  const addSet = () => setSets(prev => [...prev, { reps: '', weight: '' }])
  const removeSet = () => setSets(prev => prev.length > 1 ? prev.slice(0, -1) : prev)

  const handleLog = () => {
    const filledSets = sets.filter(s => s.reps)
    if (!filledSets.length) return
    onLog(exercise.id, exercise.name, filledSets)
    setLogged(true)
  }

  return (
    <div className={`rounded-2xl overflow-hidden border transition-colors ${logged ? 'border-green-500/40 bg-green-500/5' : 'border-gray-800 bg-gray-900'}`}>
      {/* Header */}
      <div
        className={`px-4 py-3 flex items-center gap-3 cursor-pointer select-none ${meta.light}`}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Category badge */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${meta.color} text-black`}>
          {exercise.category.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{exercise.name}</p>
            {logged && <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />}
          </div>
          <p className={`text-xs mt-0.5 ${meta.text}`}>{meta.label} · {exercise.targetSets}×{exercise.targetReps}</p>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-500 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 space-y-4">
          {/* Description */}
          <p className="text-gray-400 text-sm leading-relaxed">{exercise.description}</p>

          {/* Illustration placeholder */}
          <div className={`rounded-xl h-24 flex items-center justify-center ${meta.light} border border-dashed border-gray-700`}>
            <div className="text-center">
              <Dumbbell size={24} className={`${meta.text} mx-auto`} />
              <p className="text-xs text-gray-600 mt-1">Illustration coming soon</p>
            </div>
          </div>

          {/* Set logger */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Log Sets</p>
              <div className="flex items-center gap-2">
                <button onClick={removeSet} className="text-gray-600 hover:text-white transition-colors">
                  <Minus size={14} />
                </button>
                <span className="text-xs text-gray-500">{sets.length} sets</span>
                <button onClick={addSet} className="text-gray-600 hover:text-white transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-12 gap-2 mb-1.5">
              <div className="col-span-1 text-xs text-gray-600 text-center">#</div>
              <div className="col-span-1 text-xs text-gray-600 text-center">Prev</div>
              <div className="col-span-5 text-xs text-gray-600 text-center">Weight (lbs)</div>
              <div className="col-span-5 text-xs text-gray-600 text-center">Reps</div>
            </div>

            <div className="space-y-2">
              {sets.map((set, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 text-xs text-gray-600 text-center font-medium">{i + 1}</div>
                  <div className="col-span-1 text-xs text-gray-700 text-center">–</div>
                  <input
                    className="col-span-5 input text-center py-1.5 text-sm"
                    type="number"
                    placeholder="0"
                    value={set.weight}
                    onChange={e => updateSet(i, 'weight', e.target.value)}
                  />
                  <input
                    className="col-span-5 input text-center py-1.5 text-sm"
                    type="number"
                    placeholder={exercise.targetReps.split('–')[0]}
                    value={set.reps}
                    onChange={e => updateSet(i, 'reps', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Log button */}
          <button
            onClick={handleLog}
            disabled={logged}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
              logged
                ? 'bg-green-500/20 text-green-400 cursor-default'
                : 'bg-green-500 text-black hover:bg-green-400 active:scale-[0.98]'
            }`}
          >
            {logged ? '✓ Logged' : 'Log Exercise'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Workout() {
  const [workoutPlan] = useLocalStorage('workoutPlan', DEFAULT_WORKOUT_PLAN)
  const [workoutLogs, setWorkoutLogs] = useLocalStorage('workoutLogs', [])

  const todayStr = today()
  const dayOfWeek = new Date().getDay()
  const todayKey = workoutPlan.schedule?.[dayOfWeek]

  // Find today's workout or the next one
  let displayKey = todayKey
  let displayLabel = "Today"
  let daysAhead = 0

  if (!todayKey) {
    // Find next scheduled day
    for (let i = 1; i <= 7; i++) {
      const nextDow = (dayOfWeek + i) % 7
      if (workoutPlan.schedule?.[nextDow]) {
        displayKey = workoutPlan.schedule[nextDow]
        daysAhead = i
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        displayLabel = i === 1 ? 'Tomorrow' : dayNames[nextDow]
        break
      }
    }
  }

  const workout = displayKey ? workoutPlan.workouts?.[displayKey] : null
  const todayLogged = workoutLogs.some(w => w.date === todayStr && w.workoutKey === displayKey)

  const [exerciseLogs, setExerciseLogs] = useState({})

  const logExercise = (exerciseId, exerciseName, sets) => {
    setExerciseLogs(prev => ({ ...prev, [exerciseId]: sets }))
  }

  const finishWorkout = () => {
    if (!Object.keys(exerciseLogs).length) return
    const entry = {
      id: Date.now(),
      date: todayStr,
      workoutKey: displayKey,
      workoutName: workout.name,
      exercises: exerciseLogs,
      completedAt: new Date().toISOString(),
    }
    setWorkoutLogs(prev => [entry, ...prev])
    setExerciseLogs({})
  }

  const loggedCount = Object.keys(exerciseLogs).length
  const totalExercises = workout?.exercises?.length || 0
  const sessionComplete = todayLogged

  if (!workout) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Workout</h1>
        <div className="card flex flex-col items-center py-16 text-center">
          <Dumbbell size={40} className="text-gray-700 mb-4" />
          <p className="font-semibold text-lg">No workout plan yet</p>
          <p className="text-gray-500 text-sm mt-2 max-w-xs">
            Send Clawckie your gym equipment inventory and goals to get your custom workout plan.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${daysAhead === 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
              {displayLabel}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{workout.name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{workout.focus}</p>
        </div>
        {sessionComplete && (
          <div className="flex items-center gap-1.5 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-sm font-medium">
            <CheckCircle2 size={14} /> Done
          </div>
        )}
      </div>

      {/* Plan note */}
      {workoutPlan.note && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <p className="text-amber-400 text-xs">{workoutPlan.note}</p>
        </div>
      )}

      {/* Progress */}
      {!sessionComplete && loggedCount > 0 && (
        <div className="card">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Session progress</span>
            <span className="font-semibold">{loggedCount} / {totalExercises}</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(loggedCount / totalExercises) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Exercise cards */}
      <div className="space-y-3">
        {workout.exercises.map(exercise => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onLog={logExercise}
          />
        ))}
      </div>

      {/* Finish workout */}
      {!sessionComplete && loggedCount > 0 && (
        <button
          onClick={finishWorkout}
          className="w-full py-3 rounded-2xl bg-green-500 text-black font-bold text-base hover:bg-green-400 active:scale-[0.98] transition-all"
        >
          Finish Workout ({loggedCount}/{totalExercises} exercises)
        </button>
      )}

      {sessionComplete && (
        <div className="card text-center py-6">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-semibold">Workout logged!</p>
          <p className="text-gray-500 text-sm mt-1">See your history in the Log tab.</p>
        </div>
      )}
    </div>
  )
}
