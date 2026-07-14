import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { today, formatDateLong } from '../utils/date'
import { PRESET_EXERCISES, WORKOUT_TEMPLATES, MUSCLE_GROUPS } from '../data/exercises'
import { Plus, Trash2, CheckCircle, ChevronDown, Zap } from 'lucide-react'

const emptySet = () => ({ reps: '', weight: '', done: false })
const emptyExercise = (name = '', muscle = '') => ({
  id: Date.now() + Math.random(),
  name,
  muscle,
  notes: '',
  sets: [emptySet()],
})

export default function Today() {
  const [workoutLog, setWorkoutLog] = useLocalStorage('workoutLog', [])
  const [exercises, setExercises] = useState([])
  const [workoutName, setWorkoutName] = useState('')
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [muscleFilter, setMuscleFilter] = useState('All')
  const [customName, setCustomName] = useState('')
  const [saved, setSaved] = useState(false)

  const addExercise = (name, muscle) => {
    setExercises(prev => [...prev, emptyExercise(name, muscle)])
    setShowExercisePicker(false)
  }

  const addCustomExercise = () => {
    if (!customName.trim()) return
    addExercise(customName.trim(), muscleFilter === 'All' ? '' : muscleFilter)
    setCustomName('')
  }

  const removeExercise = (id) => setExercises(prev => prev.filter(e => e.id !== id))

  const updateExercise = (id, field, value) =>
    setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))

  const updateSet = (exId, setIdx, field, value) =>
    setExercises(prev => prev.map(e =>
      e.id === exId
        ? { ...e, sets: e.sets.map((s, i) => i === setIdx ? { ...s, [field]: value } : s) }
        : e
    ))

  const addSet = (exId) =>
    setExercises(prev => prev.map(e =>
      e.id === exId ? { ...e, sets: [...e.sets, emptySet()] } : e
    ))

  const removeSet = (exId, setIdx) =>
    setExercises(prev => prev.map(e =>
      e.id === exId ? { ...e, sets: e.sets.filter((_, i) => i !== setIdx) } : e
    ))

  const loadTemplate = (template) => {
    const exs = template.exercises.map(name => {
      const preset = PRESET_EXERCISES.find(p => p.name === name)
      return emptyExercise(name, preset?.muscle || '')
    })
    setExercises(exs)
    setWorkoutName(template.name)
    setShowTemplates(false)
  }

  const saveWorkout = () => {
    if (!exercises.length) return
    const entry = {
      id: Date.now(),
      date: today(),
      name: workoutName || 'Workout',
      exercises,
    }
    setWorkoutLog(prev => [entry, ...prev])
    setExercises([])
    setWorkoutName('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const filteredPresets = muscleFilter === 'All'
    ? PRESET_EXERCISES
    : PRESET_EXERCISES.filter(e => e.muscle === muscleFilter)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Today's Workout</h1>
        <p className="text-gray-400 text-sm mt-0.5">{formatDateLong(today())}</p>
      </div>

      {/* Workout name */}
      <input
        className="input text-lg font-semibold"
        placeholder="Workout name (e.g. Push Day)"
        value={workoutName}
        onChange={e => setWorkoutName(e.target.value)}
      />

      {/* Templates */}
      <div>
        <button
          className="btn-secondary w-full flex items-center justify-between"
          onClick={() => setShowTemplates(v => !v)}
        >
          <span className="flex items-center gap-2"><Zap size={16} /> Load Template</span>
          <ChevronDown size={16} className={showTemplates ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
        {showTemplates && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {WORKOUT_TEMPLATES.map(t => (
              <button
                key={t.name}
                onClick={() => loadTemplate(t)}
                className="card text-left hover:border-green-500/50 transition-colors"
              >
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{t.exercises.length} exercises</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Exercise list */}
      {exercises.map((ex, exIdx) => (
        <div key={ex.id} className="card space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-semibold">{ex.name}</p>
              {ex.muscle && <span className="text-xs text-green-400">{ex.muscle}</span>}
            </div>
            <button onClick={() => removeExercise(ex.id)} className="text-gray-600 hover:text-red-400 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>

          <input
            className="input text-sm"
            placeholder="Notes (optional)"
            value={ex.notes}
            onChange={e => updateExercise(ex.id, 'notes', e.target.value)}
          />

          {/* Sets */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 px-1">
              <span className="col-span-1">Set</span>
              <span className="col-span-5">Weight (lbs)</span>
              <span className="col-span-5">Reps</span>
            </div>
            {ex.sets.map((set, sIdx) => (
              <div key={sIdx} className="grid grid-cols-12 gap-2 items-center">
                <span className="col-span-1 text-sm text-gray-500">{sIdx + 1}</span>
                <input
                  className="col-span-5 input text-sm py-1.5"
                  placeholder="0"
                  type="number"
                  value={set.weight}
                  onChange={e => updateSet(ex.id, sIdx, 'weight', e.target.value)}
                />
                <input
                  className="col-span-5 input text-sm py-1.5"
                  placeholder="0"
                  type="number"
                  value={set.reps}
                  onChange={e => updateSet(ex.id, sIdx, 'reps', e.target.value)}
                />
                <button
                  onClick={() => removeSet(ex.id, sIdx)}
                  className="col-span-1 text-gray-700 hover:text-red-400 transition-colors flex justify-center"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <button onClick={() => addSet(ex.id)} className="text-green-400 text-sm font-medium flex items-center gap-1 hover:text-green-300">
            <Plus size={14} /> Add Set
          </button>
        </div>
      ))}

      {/* Add exercise */}
      <div>
        <button
          className="btn-secondary w-full flex items-center justify-center gap-2"
          onClick={() => setShowExercisePicker(v => !v)}
        >
          <Plus size={16} /> Add Exercise
        </button>

        {showExercisePicker && (
          <div className="card mt-2 space-y-3">
            {/* Muscle filter */}
            <div className="flex gap-2 flex-wrap">
              {['All', ...MUSCLE_GROUPS].map(g => (
                <button
                  key={g}
                  onClick={() => setMuscleFilter(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    muscleFilter === g ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Custom */}
            <div className="flex gap-2">
              <input
                className="input text-sm flex-1"
                placeholder="Custom exercise name..."
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomExercise()}
              />
              <button onClick={addCustomExercise} className="btn-primary px-3">Add</button>
            </div>

            {/* Preset list */}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredPresets.map(ex => (
                <button
                  key={ex.name}
                  onClick={() => addExercise(ex.name, ex.muscle)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm">{ex.name}</span>
                  <span className="text-xs text-gray-500">{ex.muscle}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      {exercises.length > 0 && (
        <button onClick={saveWorkout} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          {saved ? <><CheckCircle size={18} /> Saved!</> : 'Save Workout'}
        </button>
      )}

      {saved && !exercises.length && (
        <div className="card flex items-center gap-3 border-green-500/30">
          <CheckCircle size={20} className="text-green-400 shrink-0" />
          <p className="text-sm text-gray-300">Workout saved to your log.</p>
        </div>
      )}
    </div>
  )
}
