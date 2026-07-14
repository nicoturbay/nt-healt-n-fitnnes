import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { today, formatDate, sortByDateDesc } from '../utils/date'
import { PRESET_EXERCISES } from '../data/exercises'
import { Plus, Trash2, TrendingUp, Trophy } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-gray-400">{label}</p>
        <p className="text-white font-semibold">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

export default function Progress() {
  const [weightLog, setWeightLog] = useLocalStorage('weightLog', [])
  const [prLog, setPrLog] = useLocalStorage('prLog', [])
  const [weightInput, setWeightInput] = useState('')
  const [weightDate, setWeightDate] = useState(today())
  const [prExercise, setPrExercise] = useState('')
  const [prWeight, setPrWeight] = useState('')
  const [prReps, setPrReps] = useState('')
  const [prDate, setPrDate] = useState(today())
  const [tab, setTab] = useState('weight')

  const addWeight = () => {
    if (!weightInput) return
    const entry = { id: Date.now(), date: weightDate, weight: parseFloat(weightInput) }
    setWeightLog(prev => sortByDateDesc([entry, ...prev.filter(e => e.date !== weightDate)]))
    setWeightInput('')
  }

  const addPR = () => {
    if (!prExercise || !prWeight) return
    const entry = { id: Date.now(), date: prDate, exercise: prExercise, weight: parseFloat(prWeight), reps: parseInt(prReps) || 1 }
    setPrLog(prev => sortByDateDesc([entry, ...prev]))
    setPrWeight('')
    setPrReps('')
  }

  const weightChartData = [...weightLog]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-30)
    .map(e => ({ date: formatDate(e.date), weight: e.weight }))

  // Best PR per exercise
  const bestPRs = prLog.reduce((acc, pr) => {
    if (!acc[pr.exercise] || pr.weight > acc[pr.exercise].weight) {
      acc[pr.exercise] = pr
    }
    return acc
  }, {})

  const prExercises = [...new Set([...PRESET_EXERCISES.map(e => e.name)])]

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Progress</h1>

      {/* Tabs */}
      <div className="flex bg-gray-900 rounded-xl p-1 gap-1">
        {[['weight', 'Body Weight'], ['pr', 'Personal Records']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'weight' && (
        <div className="space-y-4">
          {/* Log weight */}
          <div className="card space-y-3">
            <p className="font-semibold">Log Weight</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="label">Date</label>
                <input className="input" type="date" value={weightDate} onChange={e => setWeightDate(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="label">Weight (lbs)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="175"
                  value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addWeight()}
                />
              </div>
            </div>
            <button onClick={addWeight} className="btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={16} /> Log
            </button>
          </div>

          {/* Chart */}
          {weightChartData.length > 1 && (
            <div className="card">
              <p className="font-semibold mb-4">Weight Trend (last 30 entries)</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    width={35}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* History */}
          {weightLog.length > 0 && (
            <div className="card">
              <p className="font-semibold mb-3">History</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sortByDateDesc(weightLog).map(entry => (
                  <div key={entry.id} className="flex justify-between items-center py-1 border-b border-gray-800 last:border-0">
                    <span className="text-sm text-gray-400">{formatDate(entry.date)}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{entry.weight} lbs</span>
                      <button
                        onClick={() => setWeightLog(prev => prev.filter(e => e.id !== entry.id))}
                        className="text-gray-700 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!weightLog.length && (
            <div className="card flex flex-col items-center py-10 text-center">
              <TrendingUp size={32} className="text-gray-700 mb-2" />
              <p className="text-gray-500 text-sm">No weight logged yet.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'pr' && (
        <div className="space-y-4">
          {/* Log PR */}
          <div className="card space-y-3">
            <p className="font-semibold">Log PR</p>
            <div>
              <label className="label">Exercise</label>
              <input
                className="input"
                list="pr-exercises"
                placeholder="Select or type exercise..."
                value={prExercise}
                onChange={e => setPrExercise(e.target.value)}
              />
              <datalist id="pr-exercises">
                {prExercises.map(e => <option key={e} value={e} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="label">Date</label>
                <input className="input" type="date" value={prDate} onChange={e => setPrDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Weight (lbs)</label>
                <input className="input" type="number" placeholder="225" value={prWeight} onChange={e => setPrWeight(e.target.value)} />
              </div>
              <div>
                <label className="label">Reps</label>
                <input className="input" type="number" placeholder="1" value={prReps} onChange={e => setPrReps(e.target.value)} />
              </div>
            </div>
            <button onClick={addPR} className="btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={16} /> Save PR
            </button>
          </div>

          {/* Best PRs */}
          {Object.keys(bestPRs).length > 0 && (
            <div className="card">
              <p className="font-semibold mb-3 flex items-center gap-2"><Trophy size={16} className="text-yellow-400" /> Best Lifts</p>
              <div className="space-y-2">
                {Object.values(bestPRs).map(pr => (
                  <div key={pr.exercise} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                    <span className="text-sm font-medium">{pr.exercise}</span>
                    <div className="text-right">
                      <span className="font-bold text-green-400">{pr.weight} lbs</span>
                      <span className="text-gray-500 text-xs ml-1">× {pr.reps}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PR History */}
          {prLog.length > 0 && (
            <div className="card">
              <p className="font-semibold mb-3">All PRs</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sortByDateDesc(prLog).map(pr => (
                  <div key={pr.id} className="flex justify-between items-center py-1 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{pr.exercise}</p>
                      <p className="text-xs text-gray-500">{formatDate(pr.date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-semibold">{pr.weight} lbs</span>
                        <span className="text-gray-500 text-xs ml-1">× {pr.reps}</span>
                      </div>
                      <button
                        onClick={() => setPrLog(prev => prev.filter(e => e.id !== pr.id))}
                        className="text-gray-700 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!prLog.length && (
            <div className="card flex flex-col items-center py-10 text-center">
              <Trophy size={32} className="text-gray-700 mb-2" />
              <p className="text-gray-500 text-sm">No PRs logged yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
