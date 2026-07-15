import { useState, useEffect } from 'react'
import { AUTH_CONFIG } from '../config/auth'

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_CONFIG.SESSION_KEY)
    if (!raw) return false
    const { expires } = JSON.parse(raw)
    return Date.now() < expires
  } catch { return false }
}

function setSession() {
  const expires = Date.now() + AUTH_CONFIG.SESSION_DAYS * 24 * 60 * 60 * 1000
  localStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify({ expires }))
}

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(false)
  const [checked, setChecked] = useState(false)
  const [pw, setPw] = useState(\'\')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setAuthed(getSession())
    setChecked(true)
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const hash = await sha256(pw)
    if (hash === AUTH_CONFIG.HASH) {
      setSession()
      setAuthed(true)
    } else {
      setError(true)
      setPw(\'\')
    }
    setLoading(false)
  }

  if (!checked) return null
  if (authed) return children

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-4xl mb-3">🏋️</p>
          <h1 className="text-xl font-bold text-white">NT Fitness</h1>
          <p className="text-zinc-500 text-sm mt-1">Enter password to continue</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false) }}
            placeholder="Password"
            autoFocus
            className={\`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-white placeholder-zinc-600 outline-none text-sm transition-colors \${
              error ? \'border-rose-500 focus:border-rose-400\' : \'border-zinc-800 focus:border-zinc-600\'
            }\`}
          />
          {error && <p className="text-rose-400 text-xs text-center">Incorrect password</p>}
          <button
            type="submit"
            disabled={!pw || loading}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl text-sm hover:bg-zinc-200 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? \'Checking...\' : \'Enter\'}
          </button>
        </form>
        <p className="text-zinc-700 text-xs text-center">Session lasts {AUTH_CONFIG.SESSION_DAYS} days</p>
      </div>
    </div>
  )
}
