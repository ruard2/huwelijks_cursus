'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/session'
import { DELEN } from '@/content'

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

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSessionData(s)
    fetchProgress(s.memberId)

    const seen = localStorage.getItem('hc_order_notice')
    if (!seen) {
      setShowOrderNotice(true)
      localStorage.setItem('hc_order_notice', '1')
    }
  }, [router])

  async function fetchProgress(memberId: string) {
    const res = await fetch(`/api/progress?memberId=${memberId}`)
    if (res.ok) {
      const data = await res.json()
      setProgress(data.progress)
    }
  }

  function getDeelDone(deelId: string): number {
    if (!session) return 0
    const deel = DELEN.find(d => d.id === deelId)
    if (!deel) return 0
    return deel.chapters.filter(c =>
      progress.some(p => p.chapterId === c.id && p.memberId === session.memberId && p.done)
    ).length
  }

  if (!session) return null

  const totalChapters = DELEN.reduce((sum, d) => sum + d.chapters.length, 0)
  const totalDone = DELEN.reduce((sum, d) => sum + getDeelDone(d.id), 0)
  const overallPct = totalChapters > 0 ? Math.round((totalDone / totalChapters) * 100) : 0

  return (
    <div className="min-h-screen bg-stone-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-[11px] text-stone-400 uppercase tracking-wider">Ingelogd als</p>
          <p className="font-semibold text-stone-900 text-sm leading-tight">{session.memberName}</p>
        </div>
        {session.isSingle ? (
          <span className="text-[11px] bg-stone-100 text-stone-500 px-3 py-1 rounded-full font-medium">Persoonlijk</span>
        ) : (
          <div className="text-right">
            <p className="text-[11px] text-stone-400 uppercase tracking-wider">Koppelcode</p>
            <p className="font-mono font-bold text-stone-900 text-sm tracking-widest">{session.coupleCode}</p>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4">
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
            const total = deel.chapters.length
            const allDone = total > 0 && done === total
            const pct = total > 0 ? (done / total) * 100 : 0

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
                    <p className="font-bold text-stone-900 text-sm leading-snug">{deel.title}</p>
                    <p className="text-stone-400 text-xs mt-1 line-clamp-1">{deel.intro.slice(0, 80)}</p>
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
      </div>
    </div>
  )
}
