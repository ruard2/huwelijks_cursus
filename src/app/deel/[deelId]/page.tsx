'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getDeel } from '@/content'

interface ProgressEntry {
  memberId: string
  memberName: string
  chapterId: string
  done: boolean
}

export default function DeelPage() {
  const router = useRouter()
  const params = useParams()
  const deelId = params.deelId as string
  const deel = getDeel(deelId)

  const [session, setSessionData] = useState<ReturnType<typeof getSession>>(null)
  const [progress, setProgress] = useState<ProgressEntry[]>([])

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSessionData(s)
    fetch(`/api/progress?memberId=${s.memberId}`)
      .then(r => r.json())
      .then(data => setProgress(data.progress ?? []))
  }, [router])

  if (!deel) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-stone-400 text-sm">Blok niet gevonden</p>
    </div>
  )

  if (!session) return null

  function isChapterDone(chapterId: string, memberId: string) {
    return progress.some(p => p.chapterId === chapterId && p.memberId === memberId && p.done)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-5 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-stone-400 p-1 -ml-1 text-sm">
          ←
        </button>
        <div className="min-w-0">
          {deel.letter && (
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: deel.color }}>
              Deel {deel.letter}
            </p>
          )}
          <p className="text-sm font-bold text-stone-900 leading-tight truncate">{deel.title}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Intro card */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5 mb-6">
          <p className="text-stone-600 text-sm leading-relaxed">{deel.intro}</p>
        </div>

        {/* Chapter list */}
        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mb-3 px-1">
          Hoofdstukken in dit blok
        </p>
        <div className="space-y-2">
          {deel.chapters.map((ch, idx) => {
            const myDone = isChapterDone(ch.id, session.memberId)
            const partnerEntry = progress.find(
              p => p.chapterId === ch.id && p.memberId !== session.memberId && p.done
            )

            return (
              <button
                key={ch.id}
                onClick={() => router.push(`/chapter/${ch.id}`)}
                className="w-full text-left bg-white rounded-2xl border border-stone-100 px-5 py-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
              >
                {/* Number circle */}
                <span
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={myDone
                    ? { backgroundColor: deel.color, color: 'white' }
                    : { backgroundColor: '#f5f5f4', color: '#a8a29e' }
                  }
                >
                  {myDone ? '✓' : idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 leading-snug">{ch.title}</p>
                  {ch.verse && (
                    <p className="text-xs text-stone-400 mt-0.5 italic truncate">{ch.verse.ref}</p>
                  )}
                  {partnerEntry && (
                    <p className="text-xs mt-1" style={{ color: deel.color }}>
                      ✓ {partnerEntry.memberName.split(' ')[0]} klaar
                    </p>
                  )}
                </div>

                <span className="text-stone-300 shrink-0">›</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
