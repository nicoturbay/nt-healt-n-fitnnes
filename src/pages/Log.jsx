import { useLocalStorage } from '../hooks/useLocalStorage'
import { formatDate, sortByDateDesc } from '../utils/date'
import { Trash2, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'
import { useState } from 'react'

function WorkoutCard({ entry, onDelete }) {
  const [open, setOpen] = useState(false)
  const totalSets = entry.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)

  return (
    <div className="card">
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setOpen(v => !v)}
      >
        <div>
          <p className="font-semibold">{entry.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{formatDate(entry.date)} · {entry.exercises.length} exercises · {totalSets} sets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
            className="text-gray-600 hover:text-red-400 transition-colors p-1"
          >
            <Trash2 size={15} />
          </button>
          {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-gray-800 pt-4">
          {entry.exercises.map(ex => (
            <div key={ex.id}>
              <div className="flex items-center gap-2 mb-2">
                <p className="font-medium text-sm">{ex.name}</p>
                {ex.muscle && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">{ex.muscle}</span>}
              </div>
              {ex.notes && <p className="text-xs text-gray-500 mb-2 italic">{ex.notes}</p>}
              <div className="grid grid-cols-3 gap-1 text-xs">
                <span className="text-gray-600 font-medium">Set</span>
                <span className="text-gray-600 font-medium">Weight</span>
                <span className="text-gray-600 font-medium">Reps</span>
                {ex.sets.map((set, i) => (
                  <>
                    <span key={`s${i}`} className="text-gray-400">{i + 1}</span>
                    <span key={`w${i}`} className="text-white">{set.weight ? `${set.weight} lbs` : '--'}</span>
                    <span key={`r${i}`} className="text-white">{set.reps || '--'}</span>
                  </>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Log() {
  const [workoutLog, setWorkoutLog] = useLocalStorage('workoutLog', [])
  const sorted = sortByDateDesc(workoutLog)

  const deleteEntry = (id) => setWorkoutLog(prev => prev.filter(e => e.id !== id))

  if (!sorted.length) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Workout Log</h1>
        <div className="card flex flex-col items-center py-12 text-center">
          <Dumbbell size={36} className="text-gray-700 mb-3" />
          <p className="text-gray-400 font-medium">No workouts yet</p>
          <p className="text-gray-600 text-sm mt-1">Complete your first workout on the Today tab.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workout Log</h1>
        <span className="text-gray-500 text-sm">{sorted.length} sessions</span>
      </div>

      <div className="space-y-3">
        {sorted.map(entry => (
          <WorkoutCard key={entry.id} entry={entry} onDelete={deleteEntry} />
        ))}
      </div>
    </div>
  )
}
