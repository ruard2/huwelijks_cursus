'use client'

import { useEffect, useState } from 'react'
import { getSession } from '@/lib/session'
import { DELEN } from '@/content'
import { TAKEAWAY_QS } from './TakeawayBlock'

interface TakeawayAnswer {
  id: string
  chapterId: string
  questionId: string
  value: string
  member: { id: string; name: string }
}

interface ChapterMeta { id: string; title: string; deelTitle: string; deelColor: string }

function buildChapterMeta(chapterOverrides: Record<string, string>): ChapterMeta[] {
  const out: ChapterMeta[] = []
  for (const deel of DELEN) {
    for (const ch of deel.chapters) {
      out.push({
        id: ch.id,
        title: chapterOverrides[`ch:${ch.id}:title`] ?? ch.title,
        deelTitle: deel.title,
        deelColor: deel.color,
      })
    }
  }
  return out
}

export default function TakeawaySummary() {
  const [byChapter, setByChapter] = useState<Record<string, TakeawayAnswer[]>>({})
  const [myId, setMyId] = useState('')
  const [chapterMeta, setChapterMeta] = useState<ChapterMeta[]>([])
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) return
    setMyId(s.memberId)

    fetch(`/api/takeaways?memberId=${s.memberId}`)
      .then(r => r.json())
      .then(data => setByChapter(data.byChapter ?? {}))

    // Load overrides for chapter titles
    const allChIds = DELEN.flatMap(d => d.chapters.map(c => c.id))
    const keys = allChIds.map(id => `ch:${id}:title`).join(',')
    fetch(`/api/content?keys=${encodeURIComponent(keys)}`)
      .then(r => r.json())
      .then(data => setChapterMeta(buildChapterMeta(data.overrides ?? {})))
  }, [])

  const chaptersWithAnswers = chapterMeta.filter(c => byChapter[c.id]?.length)

  function printPDF() {
    setPrinting(true)
    setTimeout(() => { window.print(); setPrinting(false) }, 200)
  }

  if (chaptersWithAnswers.length === 0) return (
    <div className="bg-stone-50 rounded-2xl border border-stone-200 px-4 py-6 text-center">
      <p className="text-stone-400 text-sm">Nog geen "Wat neem je mee?" antwoorden gevonden.</p>
      <p className="text-stone-300 text-xs mt-1">Ze verschijnen hier zodra jullie de hoofdstukken doorlopen.</p>
    </div>
  )

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #takeaway-print { display: block !important; position: fixed; inset: 0; background: white; padding: 2rem; overflow: auto; z-index: 9999; }
        }
        #takeaway-print { display: none; }
      `}</style>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Jullie meeneemlessen per hoofdstuk</p>
        <button onClick={printPDF} disabled={printing}
          className="text-xs text-stone-500 border border-stone-200 rounded-xl px-3 py-1.5 hover:bg-stone-50 transition-colors flex items-center gap-1.5">
          ⬇ PDF
        </button>
      </div>

      <div className="space-y-5">
        {chaptersWithAnswers.map(ch => {
          const answers = byChapter[ch.id] ?? []
          const myAnswers = answers.filter(a => a.member.id === myId)
          const partnerAnswers = answers.filter(a => a.member.id !== myId)
          const partnerName = partnerAnswers[0]?.member.name?.split(' ')[0]

          return (
            <div key={ch.id} className="rounded-2xl border border-stone-100 overflow-hidden">
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: ch.deelColor + '18', borderBottom: `2px solid ${ch.deelColor}33` }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ch.deelColor }} />
                <p className="text-xs font-bold text-stone-800 leading-snug">{ch.title}</p>
              </div>
              <div className="divide-y divide-stone-50">
                {TAKEAWAY_QS.map(q => {
                  const myA = myAnswers.find(a => a.questionId === q.id)
                  const partnerA = partnerAnswers.find(a => a.questionId === q.id)
                  if (!myA?.value && !partnerA?.value) return null
                  return (
                    <div key={q.id} className="px-4 py-3">
                      <p className="text-[10px] text-stone-400 italic mb-2">{q.text}</p>
                      <div className="space-y-2">
                        {myA?.value && (
                          <div>
                            <p className="text-[10px] font-semibold text-stone-400 mb-0.5">{myA.member?.name?.split(' ')[0]}</p>
                            <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">{myA.value}</p>
                          </div>
                        )}
                        {partnerA?.value && (
                          <div>
                            <p className="text-[10px] font-semibold text-stone-400 mb-0.5">{partnerName}</p>
                            <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">{partnerA.value}</p>
                          </div>
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

      {/* Hidden print view */}
      <div id="takeaway-print">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Tussenstand en beloften</h1>
        <p style={{ color: '#78716c', fontSize: '0.85rem', marginBottom: '2rem' }}>Huwelijkscursus — meeneemlessen per hoofdstuk</p>
        {chaptersWithAnswers.map(ch => {
          const answers = byChapter[ch.id] ?? []
          const myAnswers = answers.filter(a => a.member.id === myId)
          const partnerAnswers = answers.filter(a => a.member.id !== myId)
          return (
            <div key={ch.id} style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 'bold', borderBottom: `2px solid ${ch.deelColor}`, paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>
                {ch.title}
              </h2>
              {TAKEAWAY_QS.map(q => {
                const myA = myAnswers.find(a => a.questionId === q.id)
                const partnerA = partnerAnswers.find(a => a.questionId === q.id)
                if (!myA?.value && !partnerA?.value) return null
                return (
                  <div key={q.id} style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#78716c', fontStyle: 'italic', marginBottom: '0.25rem' }}>{q.text}</p>
                    {myA?.value && <p style={{ fontSize: '0.875rem', marginBottom: '0.15rem' }}><strong>{myA.member?.name?.split(' ')[0]}:</strong> {myA.value}</p>}
                    {partnerA?.value && <p style={{ fontSize: '0.875rem' }}><strong>{partnerA.member?.name?.split(' ')[0]}:</strong> {partnerA.value}</p>}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </>
  )
}
