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
    const chapterIds = deel.chapters.map(c => c.id)
    return chapterIds.filter(cid =>
      progress.some(p => p.chapterId === cid && p.memberId === session.memberId && p.done)
    ).length
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      <div className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-xs text-stone-400">Ingelogd als</p>
          <p className="font-semibold text-stone-900 text-sm">{session.memberName}</p>
        </div>
        {session.isSingle ? (
          <span className="text-xs bg-stone-100 text-stone-500 px-3 py-1 rounded-full">Persoonlijke verkenning</span>
        ) : (
          <div className="text-right">
            <p className="text-xs text-stone-400">Koppelcode</p>
            <p className="font-mono font-bold text-stone-900 text-sm tracking-wider">{session.coupleCode}</p>
          </div>
        )}
      </div>

      {showOrderNotice && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
          <span className="text-lg shrink-0">💡</span>
          <div className="flex-1">
            <p className="text-sm text-amber-800">We raden aan de blokken in volgorde te doen, maar je kunt ook in eigen volgorde werken. Klik op een blok om te beginnen.</p>
          </div>
          <button onClick={() => setShowOrderNotice(false)} className="text-amber-400 text-lg leading-none shrink-0">×</button>
        </div>
      )}

      <div className="px-4 pt-6">
        <h1 className="text-xl font-bold text-stone-900 mb-1">Huwelijkscursus</h1>
        <p className="text-stone-500 text-sm mb-6">Kies een blok om te beginnen</p>

        <div className="grid grid-cols-1 gap-3">
          {DELEN.map((deel) => {
            const done = getDeelDone(deel.id)
            const total = deel.chapters.length
            const allDone = total > 0 && done === total

            return (
              <button
                key={deel.id}
                onClick={() => router.push(`/deel/${deel.id}`)}
                className="w-full text-left bg-white rounded-2xl p-5 shadow-sm border border-stone-100 active:scale-95 transition-transform"
                style={{ borderLeftWidth: 4, borderLeftColor: deel.color }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {deel.letter && (
                      <span className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: deel.color }}>
                        Deel {deel.letter}
                      </span>
                    )}
                    <h2 className="font-bold text-stone-900 text-base leading-snug">{deel.title}</h2>
                    <p className="text-stone-500 text-xs mt-1 line-clamp-2">{deel.intro.slice(0, 100)}...</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {allDone ? (
                      <span className="text-green-500 text-xl">✓</span>
                    ) : (
                      <span className="text-stone-300 text-xl">›</span>
                    )}
                    {total > 0 && (
                      <span className="text-xs text-stone-400">{done}/{total}</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
