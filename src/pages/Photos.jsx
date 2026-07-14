import { useState, useRef } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { today, formatDate, sortByDateDesc } from '../utils/date'
import { Camera, Trash2, X, ZoomIn, Upload } from 'lucide-react'

export default function Photos() {
  const [photos, setPhotos] = useLocalStorage('photoLog', [])
  const [lightbox, setLightbox] = useState(null)
  const [note, setNote] = useState('')
  const [date, setDate] = useState(today())
  const fileRef = useRef()

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (e) => {
        const entry = {
          id: Date.now() + Math.random(),
          date,
          note,
          src: e.target.result,
          name: file.name,
        }
        setPhotos(prev => sortByDateDesc([entry, ...prev]))
        setNote('')
      }
      reader.readAsDataURL(file)
    })
  }

  const onFileChange = (e) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  const onDrop = (e) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const deletePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id))
    if (lightbox?.id === id) setLightbox(null)
  }

  // Group by date
  const grouped = photos.reduce((acc, p) => {
    if (!acc[p.date]) acc[p.date] = []
    acc[p.date].push(p)
    return acc
  }, {})
  const dates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a))

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Progress Photos</h1>

      {/* Upload area */}
      <div className="card space-y-3">
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <input className="input" placeholder="e.g. Week 4 front" value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current.click()}
          className="border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-green-500/50 transition-colors"
        >
          <Upload size={28} className="text-gray-600" />
          <p className="text-gray-400 text-sm font-medium">Tap to upload or drag & drop</p>
          <p className="text-gray-600 text-xs">JPG, PNG, WEBP</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
      </div>

      {/* Photo grid */}
      {dates.length === 0 && (
        <div className="card flex flex-col items-center py-12 text-center">
          <Camera size={36} className="text-gray-700 mb-3" />
          <p className="text-gray-400 font-medium">No photos yet</p>
          <p className="text-gray-600 text-sm mt-1">Upload your first progress photo above.</p>
        </div>
      )}

      {dates.map(d => (
        <div key={d}>
          <p className="text-sm font-semibold text-gray-400 mb-2">{formatDate(d)}</p>
          <div className="grid grid-cols-3 gap-2">
            {grouped[d].map(photo => (
              <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-800">
                <img
                  src={photo.src}
                  alt={photo.note || photo.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setLightbox(photo)}
                    className="bg-black/60 rounded-full p-1.5 text-white hover:bg-black/80 transition-colors"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="bg-black/60 rounded-full p-1.5 text-white hover:bg-red-500/80 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {photo.note && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                    <p className="text-xs text-white truncate">{photo.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.note} className="w-full rounded-2xl" />
            {lightbox.note && (
              <p className="text-center text-gray-300 text-sm mt-3">{lightbox.note}</p>
            )}
            <p className="text-center text-gray-500 text-xs mt-1">{formatDate(lightbox.date)}</p>
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => { deletePhoto(lightbox.id); setLightbox(null) }}
                className="btn-secondary flex items-center gap-2 text-red-400"
              >
                <Trash2 size={15} /> Delete
              </button>
              <button onClick={() => setLightbox(null)} className="btn-secondary flex items-center gap-2">
                <X size={15} /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
