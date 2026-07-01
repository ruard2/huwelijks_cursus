'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, setSession } from '@/lib/session'
import { DELEN, getChapter } from '@/content'
import { isAdmin } from '@/lib/roles'
import ProfileMenu from '@/components/ProfileMenu'

interface CommentEntry {
  id: string
  chapterId: string
  text: string
  read: boolean
  createdAt: string
  member: { name: string }
}

interface ProgressEntry {
  memberId: string
  memberName: string
  chapterId: string
  done: boolean
}

export default function HomePage() {
  const router = useRouter()
  const [session, setSessionData] = useState<ReturnType<typeof getSession>>(null)
  const [progress, setProgress] = useState<ProgressEntry[]>([])
  const [showOrderNotice, setShowOrderNotice] = useState(false)
  const [tab, setTab] = useState<'home' | 'comments' | 'flags' | 'versions'>('home')
  const [comments, setComments] = useState<CommentEntry[]>([])
  const [flags, setFlags] = useState<{ id: string; memberNames: string; coupleCode: string; chapterId: string; questionText: string; answerValue?: string; note?: string; read: boolean; createdAt: string }[]>([])
  const [bChanges, setBChanges] = useState<{ id: string; key: string; begeleiderName: string; value: string; baseValue: string | null; updatedAt: string }[]>([])
  const [adoptedKeys, setAdoptedKeys] = useState<Set<string>>(new Set())
  const [showProfile, setShowProfile] = useState(false)
  const [deelOverrides, setDeelOverrides] = useState<Record<string, string>>({})
  const [hiddenChapters, setHiddenChapters] = useState<string[]>([])
  const [dynamicChapters, setDynamicChapters] = useState<{ id: string; deelId: string }[]>([])

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSessionData(s)
    fetchProgress(s.memberId)
    if (isAdmin(s.memberName)) { fetchComments(s.memberName); fetchFlags('Ruard Stolper'); fetchBChanges(s.memberName) }
    fetch('/api/content?prefix=deel:')
      .then(r => r.json())
      .then(data => setDeelOverrides(data.overrides ?? {}))
      .catch(() => {})
    fetch('/api/content?keys=app:hidden-chapters')
      .then(r => r.json())
      .then(data => { try { setHiddenChapters(JSON.parse(data.overrides?.['app:hidden-chapters'] ?? '[]')) } catch { /* ignore */ } })
      .catch(() => {})
    fetch('/api/chapters?all=true')
      .then(r => r.json())
      .then(data => setDynamicChapters(data.chapters ?? []))
      .catch(() => {})

    const seen = localStorage.getItem('hc_order_notice')
    if (!seen) {
      setShowOrderNotice(true)
      localStorage.setItem('hc_order_notice', '1')
    }
  }, [router])

  async function fetchBChanges(memberName: string) {
    const res = await fetch('/api/content/begeleider-changes', { headers: { 'x-member-name': memberName } })
    if (res.ok) { const data = await res.json(); setBChanges(data.changes ?? []) }
  }

  async function adoptChange(id: string, key: string, value: string) {
    const s = getSession()
    if (!s) return
    await fetch('/api/content/begeleider-changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-member-name': s.memberName },
      body: JSON.stringify({ id, key, value }),
    })
    setAdoptedKeys(prev => new Set([...prev, `${key}`]))
    setBChanges(prev => prev.map(c => c.id === id ? { ...c, baseValue: value } : c))
  }

  async function fetchFlags(begeleiderName: string) {
    const res = await fetch(`/api/flags?begeleiderName=${encodeURIComponent(begeleiderName)}`)
    if (res.ok) { const data = await res.json(); setFlags(data.flags ?? []) }
  }

  async function markFlagRead(id: string) {
    await fetch('/api/flags', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, read: true }) })
    setFlags(prev => prev.map(f => f.id === id ? { ...f, read: true } : f))
  }

  async function fetchComments(memberName: string) {
    const res = await fetch('/api/comments', { headers: { 'x-member-name': memberName } })
    if (res.ok) {
      const data = await res.json()
      setComments(data.comments)
    }
  }

  async function markRead(id: string, memberName: string) {
    await fetch('/api/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-member-name': memberName },
      body: JSON.stringify({ id }),
    })
    setComments(prev => prev.map(c => c.id === id ? { ...c, read: true } : c))
  }

  async function fetchProgress(memberId: string) {
    const res = await fetch(`/api/progress?memberId=${memberId}`)
    if (res.ok) {
      const data = await res.json()
      setProgress(data.progress)
    }
  }

  function visibleChapters(deelId: string): { id: string }[] {
    const deel = DELEN.find(d => d.id === deelId)
    const dynIds = new Set(dynamicChapters.map(c => c.id))
    const staticChs = (deel?.chapters ?? [])
      .filter(c => !hiddenChapters.includes(c.id) && !dynIds.has(c.id))
    const dynChs = dynamicChapters.filter(c => c.deelId === deelId && !hiddenChapters.includes(c.id))
    return [...staticChs, ...dynChs]
  }

  function getDeelDone(deelId: string): number {
    if (!session) return 0
    return visibleChapters(deelId).filter(c =>
      progress.some(p => p.chapterId === c.id && p.memberId === session.memberId && p.done)
    ).length
  }

  if (!session) return null

  const admin = isAdmin(session.memberName)
  const unreadCount = comments.filter(c => !c.read).length

  const totalChapters = DELEN.reduce((sum, d) => sum + visibleChapters(d.id).length, 0)
  const totalDone = DELEN.reduce((sum, d) => sum + getDeelDone(d.id), 0)
  const overallPct = totalChapters > 0 ? Math.round((totalDone / totalChapters) * 100) : 0

  return (
    <div className="min-h-screen bg-stone-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => setShowProfile(true)} className="text-left active:opacity-70 transition-opacity">
          <p className="text-[11px] text-stone-400 uppercase tracking-wider">Ingelogd als</p>
          <p className="font-semibold text-stone-900 text-sm leading-tight flex items-center gap-1">
            {session.memberName}
            <span className="text-stone-300 text-xs">›</span>
          </p>
        </button>
        {session.isSingle ? (
          <span className="text-[11px] bg-stone-100 text-stone-500 px-3 py-1 rounded-full font-medium">Persoonlijk</span>
        ) : (
          <div className="text-right">
            <p className="text-[11px] text-stone-400 uppercase tracking-wider">Koppelcode</p>
            <p className="font-mono font-bold text-stone-900 text-sm tracking-widest">{session.coupleCode}</p>
          </div>
        )}
      </div>

      {/* Admin tab bar */}
      {admin && (
        <div className="bg-white border-b border-stone-100 flex overflow-x-auto">
          <button onClick={() => setTab('home')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap px-2 ${tab === 'home' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400'}`}>
            Overzicht
          </button>
          <button onClick={() => setTab('flags')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative whitespace-nowrap px-2 ${tab === 'flags' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400'}`}>
            Doorgestuurd
            {flags.filter(f => !f.read).length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold">{flags.filter(f => !f.read).length}</span>
            )}
          </button>
          <button onClick={() => setTab('comments')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative whitespace-nowrap px-2 ${tab === 'comments' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400'}`}>
            Reacties
            {unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold">{unreadCount}</span>
            )}
          </button>
          <button onClick={() => setTab('versions')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative whitespace-nowrap px-2 ${tab === 'versions' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400'}`}>
            Versies
            {bChanges.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold">{bChanges.length}</span>
            )}
          </button>
        </div>
      )}

      {/* Flags panel (admin only) */}
      {admin && tab === 'flags' && (
        <div className="max-w-lg mx-auto px-4 py-6">
          {flags.length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-12">Nog niets doorgestuurd</p>
          ) : (
            <div className="space-y-3">
              {flags.map(f => (
                <div key={f.id} className={`bg-white rounded-2xl border p-4 ${f.read ? 'border-stone-100 opacity-60' : 'border-indigo-200'}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-bold text-stone-900">{f.memberNames}</p>
                      <p className="text-[11px] text-stone-400">{new Date(f.createdAt).toLocaleDateString('nl-NL')}</p>
                    </div>
                    {!f.read && (
                      <button onClick={() => markFlagRead(f.id)}
                        className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full shrink-0">
                        Gelezen
                      </button>
                    )}
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
          )}
        </div>
      )}

      {/* Versions panel (admin only) */}
      {admin && tab === 'versions' && (
        <div className="max-w-lg mx-auto px-4 py-6">
          {bChanges.length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-12">Geen aanpassingen van begeleiders gevonden</p>
          ) : (
            <div className="space-y-4">
              {/* Group by begeleider */}
              {[...new Set(bChanges.map(c => c.begeleiderName))].map(bName => {
                const changes = bChanges.filter(c => c.begeleiderName === bName)
                return (
                  <div key={bName} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                    <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100">
                      <p className="text-xs font-bold text-amber-800">{bName}</p>
                      <p className="text-[10px] text-amber-600">{changes.length} aanpassing{changes.length !== 1 ? 'en' : ''}</p>
                    </div>
                    <div className="divide-y divide-stone-50">
                      {changes.map(c => {
                        const adopted = adoptedKeys.has(c.key) || (c.baseValue === c.value)
                        return (
                          <div key={c.id} className="px-4 py-3">
                            <p className="text-[10px] font-mono text-stone-400 mb-1.5 break-all">{c.key}</p>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div className="bg-stone-50 rounded-xl px-3 py-2">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">Basis</p>
                                <p className="text-xs text-stone-500 leading-relaxed line-clamp-3">{c.baseValue || <span className="italic opacity-50">leeg</span>}</p>
                              </div>
                              <div className="bg-amber-50 rounded-xl px-3 py-2">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600 mb-1">{bName.split(' ')[0]}</p>
                                <p className="text-xs text-stone-700 leading-relaxed line-clamp-3">{c.value}</p>
                              </div>
                            </div>
                            {adopted ? (
                              <p className="text-[10px] text-green-600 font-semibold">✓ Overgenomen</p>
                            ) : (
                              <button
                                onClick={() => adoptChange(c.id, c.key, c.value)}
                                className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-xl font-semibold hover:bg-stone-700 transition-colors"
                              >
                                Overnemen als basistekst
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Comments panel (admin only) */}
      {admin && tab === 'comments' && (
        <div className="max-w-lg mx-auto px-4 py-6">
          {comments.length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-12">Nog geen reacties</p>
          ) : (
            <div className="space-y-3">
              {comments.map(c => {
                const cd = getChapter(c.chapterId)
                return (
                  <div key={c.id} className={`bg-white rounded-2xl border p-4 ${c.read ? 'border-stone-100 opacity-60' : 'border-stone-200'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-xs font-bold text-stone-900">{c.member.name}</p>
                        <p className="text-[11px] text-stone-400">
                          {cd ? `${cd.chapter.number} — ${cd.chapter.title}` : c.chapterId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-[10px] text-stone-300">{new Date(c.createdAt).toLocaleDateString('nl-NL')}</p>
                        {!c.read && (
                          <button
                            onClick={() => markRead(c.id, session.memberName)}
                            className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full"
                          >
                            Gelezen
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-stone-700 leading-relaxed">{c.text}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      {(!admin || tab === 'home') && <div className="max-w-lg mx-auto px-4">
        {/* Hero */}
        <div className="pt-7 pb-5">
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Huwelijkscursus</h1>
          <p className="text-stone-400 text-sm mt-1">
            {totalDone === 0
              ? 'Kies een blok om te beginnen'
              : `${totalDone} van ${totalChapters} hoofdstukken afgerond`}
          </p>
          {totalDone > 0 && (
            <div className="mt-3 h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${overallPct}%`, backgroundColor: '#292524' }}
              />
            </div>
          )}
        </div>

        {showOrderNotice && (
          <div className="mb-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex gap-3 items-start">
            <span className="text-base shrink-0 mt-0.5">💡</span>
            <p className="text-xs text-amber-800 leading-relaxed flex-1">We raden de volgorde aan, maar je kunt ook in eigen tempo een blok kiezen.</p>
            <button onClick={() => setShowOrderNotice(false)} className="text-amber-300 text-xl leading-none shrink-0 -mt-0.5">×</button>
          </div>
        )}

        {/* Deel list */}
        <div className="space-y-2">
          {DELEN.map((deel) => {
            const done = getDeelDone(deel.id)
            const total = visibleChapters(deel.id).length
            const allDone = total > 0 && done === total
            const pct = total > 0 ? (done / total) * 100 : 0
            const deelTitle = deelOverrides[`deel:${deel.id}:title`] ?? deel.title
            const rawIntro = deelOverrides[`deel:${deel.id}:intro`] ?? deel.intro
            const deelIntroText = rawIntro.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

            return (
              <button
                key={deel.id}
                onClick={() => router.push(`/deel/${deel.id}`)}
                className="w-full text-left bg-white rounded-2xl border border-stone-100 overflow-hidden active:scale-[0.98] transition-transform"
              >
                {/* Color accent bar */}
                <div className="h-0.5 w-full" style={{ backgroundColor: deel.color }} />
                <div className="px-5 py-4 flex items-center gap-4">
                  {/* Left: label + title */}
                  <div className="flex-1 min-w-0">
                    {deel.letter && (
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: deel.color }}>
                        Deel {deel.letter}
                      </p>
                    )}
                    <p className="font-bold text-stone-900 text-sm leading-snug">{deelTitle}</p>
                    <p className="text-stone-400 text-xs mt-1 line-clamp-1">{deelIntroText.slice(0, 100)}</p>
                  </div>
                  {/* Right: progress */}
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {allDone ? (
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: deel.color }}>✓</span>
                    ) : (
                      <span className="text-stone-300 text-lg">›</span>
                    )}
                    <span className="text-[11px] text-stone-400 tabular-nums">{done}/{total}</span>
                  </div>
                </div>
                {/* Progress bar per deel */}
                {pct > 0 && (
                  <div className="h-0.5 w-full bg-stone-100">
                    <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: deel.color }} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>}

      {showProfile && (
        <ProfileMenu
          onClose={() => setShowProfile(false)}
          onNameChanged={name => {
            const s = getSession()
            if (s) { setSession({ ...s, memberName: name }); setSessionData({ ...s, memberName: name }) }
          }}
          onLogout={() => router.replace('/')}
        />
      )}
    </div>
  )
}
