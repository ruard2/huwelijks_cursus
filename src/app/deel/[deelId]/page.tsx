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
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSessionData(s)
    fetch(`/api/progress?memberId=${s.memberId}`)
      .then(r => r.json())
      .then(data => setProgress(data.progress ?? []))
  }, [router])

  if (!deel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-500">Blok niet gevonden</p>
      </div>
    )
  }

  if (!session) return null

  function isChapterDone(chapterId: string, memberId: string) {
    return progress.some(p => p.chapterId === chapterId && p.memberId === memberId && p.done)
  }

  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-stone-400 p-1">
            ← Terug
          </button>
        </div>
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">
          <div className="mb-6">
            {deel.letter && (
              <span className="text-sm font-bold uppercase tracking-wider mb-2 block" style={{ color: deel.color }}>
                Deel {deel.letter}
              </span>
            )}
            <h1 className="text-2xl font-bold text-stone-900 leading-snug">{deel.title}</h1>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 mb-6">
            <p className="text-stone-700 text-sm leading-relaxed">{deel.intro}</p>
          </div>

          <div className="mb-6">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-3 font-medium">Hoofdstukken in dit blok</p>
            <div className="space-y-2">
              {deel.chapters.map(ch => (
                <div
                  key={ch.id}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-stone-100"
                >
                  <span className="text-xs font-bold text-stone-400 w-6 shrink-0">{ch.number}</span>
                  <span className="text-sm text-stone-700 flex-1">{ch.title}</span>
                  {isChapterDone(ch.id, session.memberId) && (
                    <span className="text-green-500 text-sm">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-3">
            <button
              onClick={() => setShowIntro(false)}
              className="w-full py-4 text-white rounded-2xl font-semibold text-base active:scale-95 transition-transform"
              style={{ backgroundColor: deel.color }}
            >
              Verder naar hoofdstukken →
            </button>
            <button
              onClick={() => router.back()}
              className="w-full py-3 bg-stone-100 text-stone-600 rounded-2xl font-medium text-sm"
            >
              Terug naar overzicht
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => setShowIntro(true)} className="text-stone-400 p-1">
          ← Terug
        </button>
        <div>
          {deel.letter && <span className="text-xs font-bold" style={{ color: deel.color }}>Deel {deel.letter}</span>}
          <p className="text-sm font-semibold text-stone-900">{deel.title}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full px-4 py-6">
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-4 font-medium">Kies een hoofdstuk</p>
        <div className="grid grid-cols-1 gap-3">
          {deel.chapters.map((ch) => {
            const myDone = isChapterDone(ch.id, session.memberId)
            const partnerDone = progress.some(
              p => p.chapterId === ch.id && p.memberId !== session.memberId && p.done
            )
            const partnerName = progress.find(
              p => p.chapterId === ch.id && p.memberId !== session.memberId
            )?.memberName

            return (
              <button
                key={ch.id}
                onClick={() => router.push(`/chapter/${ch.id}`)}
                className="w-full text-left bg-white rounded-2xl p-5 shadow-sm border border-stone-100 active:scale-95 transition-transform"
              >
                <div className="flex items-start gap-3">
                  <span className="text-sm font-bold shrink-0 w-7 pt-0.5" style={{ color: deel.color }}>
                    {ch.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900 text-sm leading-snug">{ch.title}</p>
                    {ch.verse && (
                      <p className="text-xs text-stone-400 mt-1 italic">{ch.verse.ref}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {myDone && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">✓ Jij klaar</span>
                      )}
                      {partnerDone && partnerName && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">✓ {partnerName} klaar</span>
                      )}
                    </div>
                  </div>
                  <span className="text-stone-300 shrink-0">›</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
