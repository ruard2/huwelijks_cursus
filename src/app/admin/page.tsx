'use client'

import { useState, useEffect } from 'react'

interface Change {
  id: string
  key: string
  begeleiderName: string
  value: string
  baseValue: string | null
  updatedAt: string
}

function parseKey(key: string) {
  // ch:chapterId:rest → extract chapter + field
  const m = key.match(/^ch:([^:]+):(.+)$/)
  if (m) return { chapter: m[1], field: m[2] }
  return { chapter: '', field: key }
}

function labelKey(key: string) {
  const { chapter, field } = parseKey(key)
  if (!chapter) return key
  const parts = field.split('.')
  return parts[parts.length - 1]
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [changes, setChanges] = useState<Change[]>([])
  const [loading, setLoading] = useState(false)
  const [promoted, setPromoted] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('hc_admin_token')
    if (saved) { setToken(saved); loadChanges(saved) }
  }, [])

  async function handleLogin() {
    setLoginLoading(true); setLoginError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) { setLoginError(data.error ?? 'Fout wachtwoord'); return }
      sessionStorage.setItem('hc_admin_token', data.token)
      setToken(data.token)
      loadChanges(data.token)
    } catch { setLoginError('Er ging iets mis.') }
    finally { setLoginLoading(false) }
  }

  async function loadChanges(t: string) {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/overrides', {
        headers: { 'x-admin-token': t },
      })
      if (!res.ok) { setError('Laden mislukt'); return }
      const data = await res.json()
      setChanges(data.changes ?? [])
    } catch { setError('Laden mislukt') }
    finally { setLoading(false) }
  }

  async function promote(change: Change) {
    if (!token) return
    const res = await fetch('/api/admin/overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ key: change.key, value: change.value }),
    })
    if (res.ok) {
      setPromoted(p => new Set(p).add(change.id))
      setChanges(prev => prev.map(c => c.key === change.key ? { ...c, baseValue: change.value } : c))
    }
  }

  function logout() {
    sessionStorage.removeItem('hc_admin_token')
    setToken(null)
    setChanges([])
    setPassword('')
  }

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-stone-900 mb-1 text-center">Admin</h1>
          <p className="text-stone-400 text-sm text-center mb-8">Huwelijkscursus beheer</p>
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Wachtwoord"
              autoFocus
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button
              onClick={handleLogin}
              disabled={loginLoading || !password}
              className="w-full py-3 bg-stone-900 text-white rounded-xl font-semibold disabled:opacity-40"
            >
              {loginLoading ? 'Bezig...' : 'Inloggen'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  // Group changes by key
  const byKey: Record<string, Change[]> = {}
  for (const c of changes) {
    if (!byKey[c.key]) byKey[c.key] = []
    byKey[c.key].push(c)
  }

  // Group keys by chapter
  const byChapter: Record<string, string[]> = {}
  for (const key of Object.keys(byKey)) {
    const { chapter } = parseKey(key)
    const grp = chapter || 'overig'
    if (!byChapter[grp]) byChapter[grp] = []
    byChapter[grp].push(key)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Admin dashboard</h1>
            <p className="text-stone-500 text-sm mt-1">Aanpassingen van begeleiders overnemen in basisversie</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => loadChanges(token)}
              className="px-4 py-2 border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-stone-100"
            >
              Vernieuwen
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-stone-100"
            >
              Uitloggen
            </button>
          </div>
        </div>

        {loading && <p className="text-stone-400 text-center py-12">Laden...</p>}
        {error && <p className="text-red-500 text-center py-4">{error}</p>}

        {!loading && changes.length === 0 && (
          <div className="text-center py-16 text-stone-400">
            <p className="text-4xl mb-4">✓</p>
            <p className="font-medium">Geen begeleider-aanpassingen</p>
            <p className="text-sm mt-1">Alles is gelijk aan de basisversie</p>
          </div>
        )}

        {Object.entries(byChapter).map(([chapter, keys]) => (
          <div key={chapter} className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
              {chapter === 'overig' ? 'Overig' : `Hoofdstuk: ${chapter}`}
            </h2>

            <div className="space-y-4">
              {keys.map(key => {
                const rows = byKey[key]
                const baseValue = rows[0]?.baseValue

                return (
                  <div key={key} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                    {/* Key header */}
                    <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
                      <p className="text-xs font-mono text-stone-500">{key}</p>
                    </div>

                    {/* Base value */}
                    {baseValue !== null && (
                      <div className="px-5 py-3 border-b border-stone-100">
                        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Huidige basisversie</p>
                        <p className="text-sm text-stone-700 whitespace-pre-wrap">{baseValue ?? <span className="italic text-stone-300">niet ingesteld</span>}</p>
                      </div>
                    )}

                    {/* Per-begeleider changes */}
                    <div className="divide-y divide-stone-100">
                      {rows.map(c => {
                        const isDone = promoted.has(c.id)
                        const isSame = c.value === c.baseValue
                        return (
                          <div key={c.id} className="px-5 py-4 flex gap-4 items-start">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-stone-500 mb-1">{c.begeleiderName}</p>
                              <p className="text-sm text-stone-800 whitespace-pre-wrap">{c.value}</p>
                              <p className="text-xs text-stone-300 mt-1">
                                {new Date(c.updatedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="shrink-0">
                              {isDone ? (
                                <span className="text-xs text-green-600 font-medium">✓ Overgenomen</span>
                              ) : isSame ? (
                                <span className="text-xs text-stone-300">Zelfde als basis</span>
                              ) : (
                                <button
                                  onClick={() => promote(c)}
                                  className="px-4 py-2 bg-stone-900 text-white text-sm rounded-xl font-medium hover:bg-stone-700"
                                >
                                  Overnemen
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
