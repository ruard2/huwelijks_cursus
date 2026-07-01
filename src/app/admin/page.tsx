'use client'

import { useState, useEffect } from 'react'

type Tab = 'stats' | 'couples' | 'comments' | 'flags' | 'versions'

interface Change {
  id: string
  key: string
  begeleiderName: string
  value: string
  baseValue: string | null
  updatedAt: string
}

interface Comment {
  id: string
  chapterId: string
  text: string
  read: boolean
  createdAt: string
  member: {
    name: string
    couple: { code: string; begeleiderName: string | null }
  }
}

interface Flag {
  id: string
  coupleCode: string
  memberNames: string
  begeleiderName: string
  chapterId: string
  questionText: string
  answerValue?: string
  note?: string
  read: boolean
  createdAt: string
}

interface Stats {
  begeleiderCount: number
  coupleCount: number
  memberCount: number
  comments: Comment[]
  flags: Flag[]
}

interface MemberProgress {
  id: string
  name: string
  chaptersCompleted: number
  totalChaptersStarted: number
  answerCount: number
  byChapter: { chapterId: string; count: number }[]
  progressByChapter: { chapterId: string; done: boolean }[]
}

interface CoupleData {
  id: string
  code: string
  begeleiderName: string | null
  createdAt: string
  members: MemberProgress[]
}

function parseKey(key: string) {
  const m = key.match(/^ch:([^:]+):(.+)$/)
  if (m) return { chapter: m[1], field: m[2] }
  return { chapter: '', field: key }
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [tab, setTab] = useState<Tab>('stats')
  const [stats, setStats] = useState<Stats | null>(null)
  const [couples, setCouples] = useState<CoupleData[]>([])
  const [changes, setChanges] = useState<Change[]>([])
  const [loading, setLoading] = useState(false)
  const [promoted, setPromoted] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [expandedCouple, setExpandedCouple] = useState<string | null>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('hc_admin_token')
    if (saved) { setToken(saved); loadAll(saved) }
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
      loadAll(data.token)
    } catch { setLoginError('Er ging iets mis.') }
    finally { setLoginLoading(false) }
  }

  async function loadAll(t: string) {
    setLoading(true); setError('')
    try {
      const [statsRes, changesRes, couplesRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'x-admin-token': t } }),
        fetch('/api/admin/overrides', { headers: { 'x-admin-token': t } }),
        fetch('/api/admin/couples', { headers: { 'x-admin-token': t } }),
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (changesRes.ok) setChanges((await changesRes.json()).changes ?? [])
      if (couplesRes.ok) setCouples((await couplesRes.json()).couples ?? [])
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

  async function markCommentRead(id: string) {
    if (!token) return
    await fetch('/api/admin/stats', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ type: 'comment', id }) })
    setStats(prev => prev ? { ...prev, comments: prev.comments.map(c => c.id === id ? { ...c, read: true } : c) } : prev)
  }

  async function markFlagRead(id: string) {
    if (!token) return
    await fetch('/api/admin/stats', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ type: 'flag', id }) })
    setStats(prev => prev ? { ...prev, flags: prev.flags.map(f => f.id === id ? { ...f, read: true } : f) } : prev)
  }

  function logout() {
    sessionStorage.removeItem('hc_admin_token')
    setToken(null); setStats(null); setChanges([]); setPassword('')
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

  const unreadComments = stats?.comments.filter(c => !c.read).length ?? 0
  const unreadFlags = stats?.flags.filter(f => !f.read).length ?? 0
  const pendingVersions = changes.filter(c => c.value !== c.baseValue).length

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-stone-900">Admin</h1>
          <p className="text-stone-400 text-xs">Huwelijkscursus beheer</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadAll(token)} className="px-3 py-1.5 border border-stone-200 rounded-xl text-xs text-stone-600 hover:bg-stone-50">
            Vernieuwen
          </button>
          <button onClick={logout} className="px-3 py-1.5 border border-stone-200 rounded-xl text-xs text-stone-600 hover:bg-stone-50">
            Uitloggen
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-stone-100 flex overflow-x-auto">
        {([
          { id: 'stats', label: 'Overzicht', badge: 0 },
          { id: 'couples', label: 'Koppels', badge: 0 },
          { id: 'comments', label: 'Opmerkingen', badge: unreadComments },
          { id: 'flags', label: 'Doorgestuurd', badge: unreadFlags },
          { id: 'versions', label: 'Versies', badge: pendingVersions },
        ] as { id: Tab; label: string; badge: number }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative whitespace-nowrap px-3 ${tab === t.id ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400'}`}
          >
            {t.label}
            {t.badge > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {loading && <p className="text-stone-400 text-center py-12 text-sm">Laden...</p>}
      {error && <p className="text-red-500 text-center py-4 text-sm">{error}</p>}

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ── OVERZICHT ── */}
        {tab === 'stats' && stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Begeleiders', value: stats.begeleiderCount },
                { label: 'Koppels', value: stats.coupleCount },
                { label: 'Gebruikers', value: stats.memberCount },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-stone-100 p-4 text-center">
                  <p className="text-3xl font-bold text-stone-900">{s.value}</p>
                  <p className="text-xs text-stone-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-stone-100 p-4">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Activiteit</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Ongelezen opmerkingen</span>
                  <span className="font-semibold text-stone-900">{unreadComments}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Ongelezen doorgestuurd</span>
                  <span className="font-semibold text-stone-900">{unreadFlags}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Begeleider-aanpassingen</span>
                  <span className="font-semibold text-stone-900">{changes.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── KOPPELS ── */}
        {tab === 'couples' && (
          couples.length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-12">Geen koppels gevonden</p>
          ) : (
            <div className="space-y-3">
              {couples.map(c => {
                const totalAnswers = c.members.reduce((s, m) => s + m.answerCount, 0)
                const totalDone = c.members.reduce((s, m) => s + m.chaptersCompleted, 0)
                const isExpanded = expandedCouple === c.id
                const memberNames = c.members.map(m => m.name).join(' & ') || '–'
                // chapters started by any member
                const allChapterIds = [...new Set(c.members.flatMap(m => [
                  ...m.byChapter.map(b => b.chapterId),
                  ...m.progressByChapter.map(p => p.chapterId),
                ]))]

                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                    <button
                      onClick={() => setExpandedCouple(isExpanded ? null : c.id)}
                      className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-stone-900 text-sm">{memberNames}</p>
                          {c.begeleiderName && (
                            <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{c.begeleiderName}</span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-stone-400">{c.code}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div>
                          <p className="text-sm font-bold text-stone-900">{totalDone}</p>
                          <p className="text-[10px] text-stone-400">hfst klaar</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-900">{totalAnswers}</p>
                          <p className="text-[10px] text-stone-400">antwoorden</p>
                        </div>
                        <span className="text-stone-300 text-lg">{isExpanded ? '∧' : '∨'}</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-stone-100 px-5 py-4 space-y-4">
                        {/* Per lid */}
                        {c.members.map(m => (
                          <div key={m.id}>
                            <p className="text-xs font-bold text-stone-700 mb-2">{m.name}</p>
                            <div className="flex gap-4 text-xs text-stone-500 mb-3">
                              <span><strong className="text-stone-800">{m.chaptersCompleted}</strong> afgerond</span>
                              <span><strong className="text-stone-800">{m.answerCount}</strong> antwoorden ingevuld</span>
                            </div>
                            {/* Per hoofdstuk dat begonnen is */}
                            {allChapterIds.length > 0 && (
                              <div className="space-y-1">
                                {allChapterIds.sort().map(chapId => {
                                  const answered = m.byChapter.find(b => b.chapterId === chapId)?.count ?? 0
                                  const prog = m.progressByChapter.find(p => p.chapterId === chapId)
                                  const done = prog?.done ?? false
                                  return (
                                    <div key={chapId} className="flex items-center gap-3 text-xs">
                                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${done ? 'bg-stone-800 text-white' : answered > 0 ? 'bg-stone-200 text-stone-600' : 'bg-stone-100 text-stone-300'}`}>
                                        {done ? '✓' : answered > 0 ? '…' : '–'}
                                      </span>
                                      <span className="text-stone-500 font-mono">{chapId}</span>
                                      <span className={answered > 0 ? 'text-stone-700' : 'text-stone-300'}>
                                        {answered > 0 ? `${answered} antwoord${answered !== 1 ? 'en' : ''}` : 'geen antwoorden'}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── OPMERKINGEN ── */}
        {tab === 'comments' && stats && (
          stats.comments.length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-12">Nog geen opmerkingen</p>
          ) : (
            <div className="space-y-3">
              {stats.comments.map(c => (
                <div key={c.id} className={`bg-white rounded-2xl border p-4 ${c.read ? 'border-stone-100 opacity-60' : 'border-stone-200'}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-bold text-stone-900">{c.member.name}</p>
                      <p className="text-[11px] text-stone-400">
                        {c.member.couple.code}
                        {c.member.couple.begeleiderName ? ` · ${c.member.couple.begeleiderName}` : ''}
                        {' · '}Hfst {c.chapterId}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-[10px] text-stone-300">{new Date(c.createdAt).toLocaleDateString('nl-NL')}</p>
                      {!c.read && (
                        <button onClick={() => markCommentRead(c.id)} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                          Gelezen
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-stone-700 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── DOORGESTUURD ── */}
        {tab === 'flags' && stats && (
          stats.flags.length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-12">Nog niets doorgestuurd</p>
          ) : (
            <div className="space-y-3">
              {stats.flags.map(f => (
                <div key={f.id} className={`bg-white rounded-2xl border p-4 ${f.read ? 'border-stone-100 opacity-60' : 'border-indigo-200'}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-bold text-stone-900">{f.memberNames}</p>
                      <p className="text-[11px] text-stone-400">{f.coupleCode} · {f.begeleiderName} · Hfst {f.chapterId}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-[10px] text-stone-300">{new Date(f.createdAt).toLocaleDateString('nl-NL')}</p>
                      {!f.read && (
                        <button onClick={() => markFlagRead(f.id)} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                          Gelezen
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-stone-800 mb-1">{f.questionText}</p>
                  {f.answerValue && (
                    <p className="text-xs text-stone-500 italic mb-2 bg-stone-50 rounded-lg px-3 py-1.5">"{f.answerValue}"</p>
                  )}
                  {f.note && (
                    <div className="bg-indigo-50 rounded-xl px-3 py-2 border border-indigo-100">
                      <p className="text-[10px] font-semibold text-indigo-500 mb-0.5">Opmerking</p>
                      <p className="text-sm text-stone-700">{f.note}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* ── VERSIES ── */}
        {tab === 'versions' && (() => {
          const byKey: Record<string, Change[]> = {}
          for (const c of changes) {
            if (!byKey[c.key]) byKey[c.key] = []
            byKey[c.key].push(c)
          }
          const byChapter: Record<string, string[]> = {}
          for (const key of Object.keys(byKey)) {
            const { chapter } = parseKey(key)
            const grp = chapter || 'overig'
            if (!byChapter[grp]) byChapter[grp] = []
            byChapter[grp].push(key)
          }

          return changes.length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-12">Geen begeleider-aanpassingen</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(byChapter).map(([chapter, keys]) => (
                <div key={chapter}>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
                    {chapter === 'overig' ? 'Overig' : `Hoofdstuk: ${chapter}`}
                  </h2>
                  <div className="space-y-4">
                    {keys.map(key => {
                      const rows = byKey[key]
                      const baseValue = rows[0]?.baseValue
                      return (
                        <div key={key} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                          <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
                            <p className="text-xs font-mono text-stone-500">{key}</p>
                          </div>
                          {baseValue !== null && (
                            <div className="px-5 py-3 border-b border-stone-100">
                              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Huidige basisversie</p>
                              <p className="text-sm text-stone-700 whitespace-pre-wrap">{baseValue || <span className="italic text-stone-300">leeg</span>}</p>
                            </div>
                          )}
                          <div className="divide-y divide-stone-100">
                            {rows.map(c => {
                              const isDone = promoted.has(c.id)
                              const isSame = c.value === c.baseValue
                              return (
                                <div key={c.id} className="px-5 py-4 flex gap-4 items-start">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-stone-500 mb-1">{c.begeleiderName}</p>
                                    <p className="text-sm text-stone-800 whitespace-pre-wrap">{c.value}</p>
                                    <p className="text-xs text-stone-300 mt-1">{new Date(c.updatedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                  </div>
                                  <div className="shrink-0">
                                    {isDone ? (
                                      <span className="text-xs text-green-600 font-medium">✓ Overgenomen</span>
                                    ) : isSame ? (
                                      <span className="text-xs text-stone-300">Zelfde als basis</span>
                                    ) : (
                                      <button onClick={() => promote(c)} className="px-4 py-2 bg-stone-900 text-white text-sm rounded-xl font-medium hover:bg-stone-700">
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
          )
        })()}
      </div>
    </div>
  )
}
