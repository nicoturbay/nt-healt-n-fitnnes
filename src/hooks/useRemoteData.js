/**
 * Fetches a JSON data file from the GitHub repo (raw.githubusercontent.com).
 * Falls back to localStorage for any user-entered data not yet pushed to GitHub.
 * On write, updates localStorage immediately (optimistic) and the GitHub file via
 * the /api/sync endpoint (not yet wired -- Clawckie pushes on your behalf for now).
 */
import { useState, useEffect } from 'react'

const REPO = 'nicoturbay/nt-healt-n-fitnnes'
const BRANCH = 'main'
const BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/src/data`

// Cache to avoid duplicate fetches within the same session
const cache = {}

export function useRemoteData(filename, fallback = []) {
  const localKey = `remote_${filename}`
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem(localKey)
      return stored ? JSON.parse(stored) : fallback
    } catch {
      return fallback
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (cache[filename]) {
      setData(cache[filename])
      setLoading(false)
      return
    }
    fetch(`${BASE}/${filename}?t=${Date.now()}`)
      .then(r => r.ok ? r.json() : null)
      .then(remote => {
        if (remote) {
          cache[filename] = remote
          setData(remote)
          localStorage.setItem(localKey, JSON.stringify(remote))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filename])

  const update = (updater) => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem(localKey, JSON.stringify(next))
      cache[filename] = next
      return next
    })
  }

  return [data, update, loading]
}
