import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { today } from '../utils/date'
import { DEFAULT_WORKOUT_PLAN, CATEGORY_META } from '../data/workoutPlan'
import { CheckCircle2, Plus, Minus, Dumbbell } from 'lucide-react'

function ExerciseCard({ exercise, onLog }) {
  const meta = CATEGORY_META[exercise.category] || CATEGORY_META.chest
  const [sets, setSets] = useState(Array.from({ length: exercise.targetSets }, () => ({ reps: '', weight: '' })))
  const [logged, setLogged] = useState(false)

  const updateSet = (i, field, val) => setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  const addSet = () => setSets(prev => [...prev, { reps: '', weight: '' }])
  const removeSet = () => setSets(prev => prev.length > 1 ? prev.slice(0, -1) : prev)

  const handleLog = () => {
    const filled = sets.filter(s => s.reps)
    if (!filled.length) return
    onLog(exercise.id, exercise.name, filled)
    setLogged(true)
  }

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden border transition-all h-full ${logged ? 'border-green-500/50 bg-green-500/5' : 'border-gray-800 bg-gray-900'}`}>
      <div className={`px-4 py-3 ${meta.light} flex items-center gap-2.5`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${meta.color} text-black`}>
          {exercise.category.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{exercise.name}</p>
          <p className={`text-xs mt-0.5 ${meta.text}`}>{meta.label}</p>
        </div>
        {logged && <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />}
      </div>

      <p className="text-gray-500 text-xs px-4 pt-3 leading-relaxed">{exercise.description}</p>

      <div className={`mx-4 mt-3 rounded-xl h-20 flex items-center justify-center ${meta.light} border border-dashed border-gray-800`}>
        <div className="text-center">
          <Dumbbell size={18} className={`${meta.text} mx-auto`} />
          <p className="text-[10px] text-gray-700 mt-0.5">Illustration coming soon</p>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.light} ${meta.text}`}>
            {exercise.targetSets} × {exercise.targetReps}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={removeSet} className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"><Minus size={11} /></button>
            <span className="text-xs text-gray-500 w-10 text-center">{sets.length} sets</span>
            <button onClick={addSet} className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"><Plus size={11} /></button>
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
              <input className="col-span-6 bg-gray-800 border border-gray-700 rounded-lg text-center text-xs py-1.5 text-white placeholder-gray-600 focus:outline-none focus:border-gray-500" type="number" placeholder="0" value={set.weight} onChange={e => updateSet(i, 'weight', e.target.value)} />
              <input className="col-span-5 bg-gray-800 border border-gray-700 rounded-lg text-center text-xs py-1.5 text-white placeholder-gray-600 focus:outline-none focus:border-gray-500" type="number" placeholder={exercise.targetReps.toString().split('–')[0]} value={set.reps} onChange={e => updateSet(i, 'reps', e.target.value)} />
            </div>
          ))}
        </div>

        <button onClick={handleLog} disabled={logged} className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition-all ${logged ? 'bg-green-500/20 text-green-400 cursor-default' : 'bg-green-500 text-black hover:bg-green-400 active:scale-[0.98]'}`}>
          {logged ? '✓ Logged' : 'Log Exercise'}
        </button>
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
  const [exerciseLogs, setExerciseLogs] = useState({})
  const [saving, setSaving] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)

  const logExercise = (exerciseId, exerciseName, sets) =>
    setExerciseLogs(prev => ({ ...prev, [exerciseId]: sets }))

  const finishWorkout = async () => {
    if (!Object.keys(exerciseLogs).length) return
    setSaving(true)
    const entry = {
      id: Date.now(),
      date: todayStr,
      workout_key: displayKey,
      workout_name: workout.name,
      exercises: exerciseLogs,
      completed_at: new Date().toISOString(),
    }
    await supabase.from('workout_logs').insert(entry)
    setSaving(false)
    setSessionComplete(true)
    setExerciseLogs({})
  }

  const loggedCount = Object.keys(exerciseLogs).length
  const totalExercises = workout?.exercises?.length || 0

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${daysAhead === 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>{displayLabel}</span>
          <div>
            <h1 className="text-2xl font-bold leading-tight">{workout.name}</h1>
            <p className="text-gray-500 text-sm">{workout.focus}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loggedCount > 0 && !sessionComplete && (
            <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1.5 rounded-full">{loggedCount}/{totalExercises} logged</span>
          )}
          {sessionComplete && (
            <span className="flex items-center gap-1.5 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
          {!sessionComplete && loggedCount > 0 && (
            <button onClick={finishWorkout} disabled={saving} className="bg-green-500 text-black font-bold text-sm px-4 py-2 rounded-xl hover:bg-green-400 transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : 'Finish Workout'}
            </button>
          )}
        </div>
      </div>

      {workoutPlan.note && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
          <p className="text-amber-400 text-xs">{workoutPlan.note}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workout.exercises.map(exercise => (
          <ExerciseCard key={exercise.id} exercise={exercise} onLog={logExercise} />
        ))}
      </div>

      {!sessionComplete && loggedCount > 0 && (
        <button onClick={finishWorkout} disabled={saving} className="w-full py-3 rounded-2xl bg-green-500 text-black font-bold hover:bg-green-400 transition-colors disabled:opacity-60">
          {saving ? 'Saving...' : `Finish Workout (${loggedCount}/${totalExercises} exercises logged)`}
        </button>
      )}

      {sessionComplete && (
        <div className="card text-center py-6">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-semibold">Workout saved to Supabase!</p>
          <p className="text-gray-500 text-sm mt-1">Visible everywhere, instantly.</p>
        </div>
      )}
    </div>
  )
}
