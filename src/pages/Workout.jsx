import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { today, dateToET, getDayOfWeekET } from '../utils/date'
import { DEFAULT_WORKOUT_PLAN, CATEGORY_META } from '../data/workoutPlan'
import { CheckCircle2, Plus, Minus, Dumbbell, ChevronLeft, ChevronRight, Pencil, Calendar, ArrowLeftRight } from 'lucide-react'

// SwapPanel — inline alternative picker
function SwapPanel({ exercise, currentId, onSelect, onClose }) {
  const meta = CATEGORY_META[exercise.category] || CATEGORY_META.chest
  const alts = exercise.alternatives || []
  const isOriginal = currentId === exercise.id

  return (
    <div className="mt-2 rounded-xl border border-gray-700 bg-gray-950 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400">Swap Exercise</span>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xs transition-colors">Done</button>
      </div>
      <div className="p-2 space-y-1">
        {/* Original exercise option */}
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
            isOriginal ? `${meta.light} ${meta.text}` : 'hover:bg-gray-800 text-gray-300'
          }`}
        >
          <div>
            <p className="text-xs font-semibold">{exercise.name}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Original · {exercise.startingWeight}</p>
          </div>
          {isOriginal && <CheckCircle2 size={14} className={meta.text} />}
        </button>

        {alts.map(alt => {
          const isSelected = currentId === alt.id
          return (
            <button
              key={alt.id}
              onClick={() => onSelect(alt)}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                isSelected ? `${meta.light} ${meta.text}` : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <div>
                <p className="text-xs font-semibold">{alt.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{alt.startingWeight}</p>
              </div>
              {isSelected && <CheckCircle2 size={14} className={meta.text} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ExerciseCard — input only, no log button
function ExerciseCard({ exercise, onChange, completed, initialSets, swappedExercise, onSwapOpen, showSwap, onSwapClose, onSwapSelect }) {
  const displayExercise = swappedExercise
    ? { ...exercise, ...swappedExercise, id: exercise.id, alternatives: exercise.alternatives, category: exercise.category, muscleGroup: exercise.muscleGroup }
    : exercise

  const meta = CATEGORY_META[exercise.category] || CATEGORY_META.chest
  const isSwapped = !!swappedExercise
  const currentSwapId = swappedExercise ? swappedExercise.id : exercise.id

  const [sets, setSets] = useState(
    initialSets?.length
      ? initialSets
      : Array.from({ length: exercise.targetSets }, () => ({ reps: '', weight: '' }))
  )

  const updateSet = (i, field, val) => {
    const next = sets.map((s, idx) => idx === i ? { ...s, [field]: val } : s)
    setSets(next)
    onChange(exercise.id, displayExercise.name, next)
  }

  const addSet = () => {
    const next = [...sets, { reps: '', weight: '' }]
    setSets(next)
    onChange(exercise.id, displayExercise.name, next)
  }

  const removeSet = () => {
    if (sets.length <= 1) return
    const next = sets.slice(0, -1)
    setSets(next)
    onChange(exercise.id, displayExercise.name, next)
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
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{displayExercise.name}</p>
            {isSwapped && (
              <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 leading-none">SWAP</span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${meta.text}`}>{meta.label}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {exercise.alternatives?.length > 0 && (
            <button
              onClick={showSwap ? onSwapClose : onSwapOpen}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                showSwap
                  ? `${meta.color} text-black`
                  : isSwapped
                  ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title="Swap exercise"
            >
              <ArrowLeftRight size={13} />
            </button>
          )}
          {completed && <CheckCircle2 size={16} className="text-green-400" />}
        </div>
      </div>

      {/* Swap panel (inline, above description) */}
      {showSwap && (
        <div className="px-4 pt-3">
          <SwapPanel
            exercise={exercise}
            currentId={currentSwapId}
            onSelect={onSwapSelect}
            onClose={onSwapClose}
          />
        </div>
      )}

      <p className="text-gray-500 text-xs px-4 pt-3 leading-relaxed">{displayExercise.description}</p>

      {/* padding-top 75% = 4:3 ratio — works on iOS Safari unlike aspect-ratio CSS */}
      <div className={`mx-4 mt-3 rounded-xl relative overflow-hidden ${meta.light} border border-gray-800`} style={{ paddingTop: '75%' }}>
        {displayExercise.image ? (
          <img
            src={displayExercise.image}
            alt={displayExercise.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Dumbbell size={32} className={`${meta.text}`} />
            <p className="text-xs text-gray-600 mt-2">Illustration coming soon</p>
          </div>
        )}
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

        {filledSets > 0 && (
          <p className={`mt-3 text-xs text-center ${filledSets === sets.length ? 'text-green-400' : 'text-gray-500'}`}>
            {filledSets}/{sets.length} sets filled
          </p>
        )}
      </div>
    </div>
  )
}

// Read-only card shown when a workout has already been logged for this date
function LoggedExerciseCard({ exercise, sets }) {
  const meta = CATEGORY_META[exercise.category] || CATEGORY_META.chest
  const filled = (sets || []).filter(s => s.reps)
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-green-500/30 bg-green-500/5 h-full">
      <div className={`px-4 py-3 ${meta.light} flex items-center gap-2.5`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${meta.color} text-black`}>
          {exercise.category.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{exercise.name}</p>
          <p className={`text-xs mt-0.5 ${meta.text}`}>{meta.label}</p>
        </div>
        {filled.length > 0 && <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />}
      </div>

      <p className="text-gray-500 text-xs px-4 pt-3 leading-relaxed">{exercise.description}</p>

      <div className={`mx-4 mt-3 rounded-xl relative overflow-hidden ${meta.light} border border-gray-800`} style={{ paddingTop: '75%' }}>
        {exercise.image ? (
          <img src={exercise.image} alt={exercise.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Dumbbell size={32} className={meta.text} />
            <p className="text-xs text-gray-600 mt-2">Illustration coming soon</p>
          </div>
        )}
      </div>

      <div className="px-4 py-4 flex-1">
        {filled.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {filled.map((s, i) => (
              <span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full">
                Set {i + 1}: {s.reps} reps{s.weight ? ` @ ${s.weight} lb` : ''}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-600">Not logged</p>
        )}
      </div>
    </div>
  )
}

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function dateFromOffset(offset) {
  const nowET = today()
  const d = new Date(nowET + 'T12:00:00')
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
  const [workoutPlan, setWorkoutPlan] = useLocalStorage('workoutPlan', DEFAULT_WORKOUT_PLAN)

  // Cache-bust: if stored plan is missing alternatives or dayC, reload from updated default
  useEffect(() => {
    const allExercises = Object.values(workoutPlan.workouts || {}).flatMap(w => w.exercises || [])
    const missingAlternatives = allExercises.some(ex => !ex.alternatives)
    const missingDayC = !workoutPlan.workouts?.dayC
    if (missingAlternatives || missingDayC) setWorkoutPlan(DEFAULT_WORKOUT_PLAN)
  }, [])

  const todayStr = today()
  const dateInputRef = useRef(null)

  const [offset, setOffset] = useState(() => {
    const dow = getDayOfWeekET()
    if (workoutPlan.schedule?.[dow]) return 0
    for (let i = 1; i <= 7; i++) {
      if (workoutPlan.schedule?.[(dow + i) % 7]) return i
    }
    return 0
  })

  const selectedDate = useMemo(() => dateFromOffset(offset), [offset])
  const selectedDow = selectedDate.getDay()
  const selectedDateStr = dateToET(selectedDate)
  const workoutKey = workoutPlan.schedule?.[selectedDow] ?? null
  const workout = workoutKey ? workoutPlan.workouts?.[workoutKey] : null
  const dayLabel = formatDayLabel(offset, selectedDate)
  const isToday = offset === 0
  const isFuture = offset > 0

  const navigate = (dir) => {
    setOffset(prev => {
      for (let i = 1; i <= 14; i++) {
        const next = prev + dir * i
        const dow = dateFromOffset(next).getDay()
        if (workoutPlan.schedule?.[dow]) return next
      }
      return prev
    })
  }

  const jumpToDate = (dateStr) => {
    const base = new Date(today() + 'T12:00:00')
    const picked = new Date(dateStr + 'T12:00:00')
    const diff = Math.round((picked - base) / 86400000)
    setOffset(diff)
  }

  const [exerciseData, setExerciseData] = useState({})
  const [saving, setSaving] = useState(false)
  const [existingLog, setExistingLog] = useState(null)
  const [loadingLog, setLoadingLog] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // Swap state: { [exerciseId]: alternativeObject | null }
  // null means "reverted to original", key absence means never swapped
  const [swaps, setSwaps] = useState({})
  // Which exercise has the swap panel open right now
  const [openSwapId, setOpenSwapId] = useState(null)

  // Reset swaps when the date/workout changes
  useEffect(() => {
    setExistingLog(null)
    setEditMode(false)
    setExerciseData({})
    setSwaps({})
    setOpenSwapId(null)
    setLoadingLog(true)
    supabase
      .from('workout_logs')
      .select('*')
      .eq('date', selectedDateStr)
      .maybeSingle()
      .then(({ data }) => {
        setExistingLog(data || null)
        setLoadingLog(false)
      })
  }, [selectedDateStr])

  const handleExerciseChange = useCallback((id, name, sets) => {
    setExerciseData(prev => ({ ...prev, [id]: { name, sets } }))
  }, [])

  const handleSwapSelect = useCallback((exerciseId, alt) => {
    setSwaps(prev => ({ ...prev, [exerciseId]: alt || null }))
    setOpenSwapId(null)
  }, [])

  const filledCount = Object.values(exerciseData).filter(
    e => e.sets.some(s => s.reps)
  ).length
  const totalExercises = workout?.exercises?.length || 0

  const enterEditMode = () => {
    if (existingLog?.exercises) {
      const prefilledData = {}
      workout?.exercises?.forEach(ex => {
        const existingSets = existingLog.exercises?.[ex.id]
        if (existingSets) prefilledData[ex.id] = { name: ex.name, sets: existingSets }
      })
      setExerciseData(prefilledData)
    }
    setEditMode(true)
  }

  const logWorkout = async () => {
    const withData = Object.entries(exerciseData).filter(([, e]) => e.sets.some(s => s.reps))
    if (!withData.length) return
    setSaving(true)
    const entry = {
      date: selectedDateStr,
      workout_key: workoutKey,
      workout_name: workout.name,
      exercises: Object.fromEntries(withData.map(([id, e]) => [id, e.sets])),
      completed_at: new Date().toISOString(),
    }
    if (existingLog) {
      await supabase.from('workout_logs').update(entry).eq('id', existingLog.id)
    } else {
      await supabase.from('workout_logs').insert({ ...entry, id: Date.now() })
    }
    const { data } = await supabase.from('workout_logs').select('*').eq('date', selectedDateStr).maybeSingle()
    setExistingLog(data || null)
    setEditMode(false)
    setSaving(false)
  }

  const navControls = (
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
          onClick={() => setOffset(0)}
          className="px-3 h-9 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-xs text-green-400 hover:text-green-300 font-semibold transition-colors"
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
      <div className="relative">
        <button
          onClick={() => dateInputRef.current?.showPicker()}
          className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          title="Pick a date"
        >
          <Calendar size={16} />
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDateStr}
          onChange={e => e.target.value && jumpToDate(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          tabIndex={-1}
        />
      </div>
    </div>
  )

  if (!workoutKey && !workout) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-800 text-gray-400">
              {dayLabel}
            </span>
            <h1 className="text-2xl font-bold mt-2">Rest Day</h1>
            <p className="text-gray-500 text-sm">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {navControls}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col items-center py-12 text-center">
          <Dumbbell size={36} className="text-zinc-700 mb-3" />
          <p className="font-semibold text-base">Rest day</p>
          <p className="text-zinc-500 text-sm mt-1">Use the arrows or calendar to find a workout day</p>
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
        {navControls}
      </div>

      {workoutPlan.note && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
          <p className="text-amber-400 text-xs">{workoutPlan.note}</p>
        </div>
      )}

      {loadingLog ? (
        <div className="flex items-center justify-center py-10 text-zinc-500 text-sm">Loading...</div>
      ) : existingLog && !editMode ? (
        <>
          {/* Already-logged banner */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-green-400" />
              <div>
                <p className="text-sm font-semibold text-white">Workout logged</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {Object.values(existingLog.exercises || {}).filter(s => s.some(x => x.reps)).length} of {totalExercises} exercises
                </p>
              </div>
            </div>
            <button
              onClick={enterEditMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
          </div>
          {/* Read-only exercise cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workout.exercises.map(ex => (
              <LoggedExerciseCard key={ex.id} exercise={ex} sets={existingLog.exercises?.[ex.id]} />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Input exercise cards with swap support */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workout.exercises.map(exercise => (
              <ExerciseCard
                key={`${selectedDateStr}-${exercise.id}-${editMode ? 'edit' : 'new'}`}
                exercise={exercise}
                onChange={handleExerciseChange}
                completed={exerciseData[exercise.id]?.sets?.every(s => s.reps)}
                initialSets={editMode ? existingLog?.exercises?.[exercise.id] : null}
                swappedExercise={swaps[exercise.id] || null}
                onSwapOpen={() => setOpenSwapId(exercise.id)}
                showSwap={openSwapId === exercise.id}
                onSwapClose={() => setOpenSwapId(null)}
                onSwapSelect={(alt) => handleSwapSelect(exercise.id, alt)}
              />
            ))}
          </div>
          {editMode && (
            <button
              onClick={() => setEditMode(false)}
              className="w-full py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel — return to logged view
            </button>
          )}
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
              ? editMode
                ? `Update Workout${filledCount < totalExercises ? ` (${filledCount}/${totalExercises})` : ''}`
                : `Log Workout${filledCount < totalExercises ? ` (${filledCount}/${totalExercises} exercises)` : ''}`
              : 'Fill in at least one exercise to log'
            }
          </button>
        </>
      )}
    </div>
  )
}
