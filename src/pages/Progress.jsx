import { useState, useRef } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useRemoteData } from '../hooks/useRemoteData'
import { today, formatDate } from '../utils/date'
import { Plus, Trash2, Camera, Scale, TrendingUp, ZoomIn, X } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-gray-400">{label}</p>
        <p className="text-white font-semibold">{payload[0].value} lbs</p>
      </div>
    )
  }
  return null
}

export default function Progress() {
  const [progressEntries, setProgressEntries] = useRemoteData('progress-entries.json', [])
  const [lightbox, setLightbox] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: today(), weight: '', note: '', photos: [] })
  const fileRef = useRef()

  const addEntry = () => {
    if (!form.weight && !form.note && !form.photos.length) return
    const entry = {
      id: Date.now(),
      date: form.date,
      weight: form.weight ? parseFloat(form.weight) : null,
      note: form.note,
      photos: form.photos,
      source: 'manual',
    }
    setProgressEntries(prev => [entry, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)))
    setForm({ date: today(), weight: '', note: '', photos: [] })
    setShowForm(false)
  }

  const handlePhotos = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = e => {
        setForm(f => ({ ...f, photos: [...f.photos, { src: e.target.result, name: file.name }] }))
      }
      reader.readAsDataURL(file)
    })
  }

  const deleteEntry = (id) => setProgressEntries(prev => prev.filter(e => e.id !== id))

  // Chart data
  const weightEntries = progressEntries
    .filter(e => e.weight)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-20)
    .map(e => ({ date: formatDate(e.date), weight: e.weight }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Progress</h1>
        <button onClick={() => setShowForm(e => !e)} className="btn-primary flex items-center gap-1.5 py-2 px-3 text-sm">
          <Plus size={15} /> Log Update
        </button>
      </div>

      {/* Channel note */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
        <p className="text-blue-400 text-xs font-medium mb-0.5">Automatic Progress Tracking</p>
        <p className="text-gray-400 text-xs">
          Send photos and measurements to <span className="text-blue-400">#progress</span> and Clawckie will log them here automatically.
        </p>
      </div>

      {/* Weight chart */}
      {weightEntries.length > 1 && (
        <div className="card">
          <p className="font-semibold mb-4">Weight Trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightEntries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} domain={['auto', 'auto']} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log form */}
      {showForm && (
        <div className="card space-y-3">
          <p className="font-semibold">Log Progress Update</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Weight (lbs)</label>
              <input className="input" type="number" placeholder="175" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Note</label>
            <textarea className="input resize-none" rows={2} placeholder="How are you feeling? Any measurements?" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <div>
            <label className="label">Photos</label>
            <div
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-gray-700 rounded-xl p-5 flex flex-col items-center gap-1.5 cursor-pointer hover:border-green-500/40 transition-colors"
            >
              <Camera size={20} className="text-gray-600" />
              <p className="text-xs text-gray-500">Tap to add progress photos</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { handlePhotos(e.target.files); e.target.value = '' }} />
            {form.photos.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {form.photos.map((p, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden">
                    <img src={p.src} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))}
                      className="absolute top-0.5 right-0.5 bg-black/70 rounded-full p-0.5">
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={addEntry} className="btn-primary flex-1">Save Update</button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {progressEntries.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <TrendingUp size={36} className="text-gray-700 mb-3" />
          <p className="font-medium text-gray-400">No progress logged yet</p>
          <p className="text-gray-600 text-sm mt-1">Add your first update or send a photo to #progress</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-800" />
          <div className="space-y-4">
            {progressEntries.map((entry, idx) => (
              <div key={entry.id} className="relative flex gap-4">
                {/* Dot */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center z-10 ${idx === 0 ? 'bg-green-500' : 'bg-gray-800 border border-gray-700'}`}>
                  {entry.photos?.length ? <Camera size={13} className={idx === 0 ? 'text-black' : 'text-gray-500'} /> : <Scale size={13} className={idx === 0 ? 'text-black' : 'text-gray-500'} />}
                </div>

                {/* Card */}
                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500">{formatDate(entry.date)}</p>
                      {entry.weight && (
                        <p className="font-bold text-lg text-green-400 mt-0.5">{entry.weight} lbs</p>
                      )}
                    </div>
                    <button onClick={() => deleteEntry(entry.id)} className="text-gray-700 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {entry.note && <p className="text-gray-300 text-sm">{entry.note}</p>}

                  {entry.source === 'channel' && (
                    <span className="inline-block text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                      via #progress
                    </span>
                  )}

                  {entry.photos?.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {entry.photos.map((photo, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer" onClick={() => setLightbox(photo)}>
                          <img src={photo.src} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn size={16} className="text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.src} className="w-full rounded-2xl" alt="" />
            <button onClick={() => setLightbox(null)} className="absolute top-3 right-3 bg-black/60 rounded-full p-2">
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
