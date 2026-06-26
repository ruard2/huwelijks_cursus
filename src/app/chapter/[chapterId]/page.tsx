'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getChapter, Chapter, Deel, Section, Subsection, Question } from '@/content'
import { encryptAnswer, decryptAnswer } from '@/lib/crypto'
import { getPusherClient, coupleChannel, EVENTS } from '@/lib/pusher'
import type Pusher from 'pusher-js'
import type { Channel } from 'pusher-js'

interface AnswerRecord {
  memberId: string
  memberName: string
  chapterId: string
  questionId: string
  value: string
  isPrivate: boolean
}

interface AnswerMap {
  [questionId: string]: {
    mine?: AnswerRecord
    partner?: AnswerRecord
  }
}

function buildKey(section: Section | null, subsection: Subsection | null, q: Question) {
  if (subsection) return `${subsection.id}.${q.id}`
  if (section) return `${section.id}.${q.id}`
  return q.id
}

export default function ChapterPage() {
  const router = useRouter()
  const params = useParams()
  const chapterId = params.chapterId as string

  const [session, setSessionData] = useState<ReturnType<typeof getSession>>(null)
  const [chapterData, setChapterData] = useState<{ chapter: Chapter; deel: Deel } | null>(null)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const pusherRef = useRef<InstanceType<typeof Pusher> | null>(null)
  const channelRef = useRef<Channel | null>(null)
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSessionData(s)

    const cd = getChapter(chapterId)
    if (!cd) { router.replace('/home'); return }
    setChapterData(cd)

    loadAnswers(s.memberId, chapterId)
    setupPusher(s.coupleCode, s.memberId, chapterId, s.coupleCode)

    return () => {
      if (channelRef.current) {
        pusherRef.current?.unsubscribe(coupleChannel(s.coupleCode))
      }
      pusherRef.current?.disconnect()
    }
  }, [router, chapterId])

  function setupPusher(code: string, myId: string, chapId: string, coupleCode: string) {
    const client = getPusherClient()
    pusherRef.current = client
    const channel = client.subscribe(coupleChannel(code))
    channelRef.current = channel

    channel.bind(EVENTS.ANSWER_UPDATED, async (data: {
      memberId: string; memberName: string; chapterId: string
      questionId: string; value: string; isPrivate: boolean
    }) => {
      if (data.chapterId !== chapId) return
      if (data.memberId === myId) return

      let displayValue = data.value
      if (data.isPrivate && data.value) {
        displayValue = await decryptAnswer(data.value, coupleCode)
      }

      setAnswers(prev => ({
        ...prev,
        [data.questionId]: {
          ...prev[data.questionId],
          partner: {
            memberId: data.memberId,
            memberName: data.memberName,
            chapterId: data.chapterId,
            questionId: data.questionId,
            value: displayValue,
            isPrivate: data.isPrivate,
          },
        },
      }))
    })
  }

  async function loadAnswers(memberId: string, chapId: string) {
    const res = await fetch(`/api/answers?memberId=${memberId}&chapterId=${chapId}`)
    if (!res.ok) return
    const data = await res.json()
    const s = getSession()!

    const map: AnswerMap = {}
    for (const a of data.answers as AnswerRecord[]) {
      const key = a.questionId
      if (!map[key]) map[key] = {}

      let displayValue = a.value
      if (a.isPrivate && a.value) {
        displayValue = await decryptAnswer(a.value, s.coupleCode)
      }

      const record = { ...a, value: displayValue }
      if (a.memberId === memberId) {
        map[key].mine = record
      } else {
        map[key].partner = record
      }
    }
    setAnswers(map)
  }

  const saveAnswer = useCallback(async (
    questionId: string,
    value: string,
    isPrivate: boolean
  ) => {
    const s = getSession()
    if (!s) return

    let storedValue = value
    if (isPrivate && value) {
      storedValue = await encryptAnswer(value, s.coupleCode)
    }

    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-member-id': s.memberId },
      body: JSON.stringify({ chapterId, questionId, value: storedValue, isPrivate }),
    })
  }, [chapterId])

  function handleChange(questionId: string, value: string) {
    const isPrivate = answers[questionId]?.mine?.isPrivate ?? false
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], mine: { ...(prev[questionId]?.mine ?? {}), questionId, value, isPrivate } as AnswerRecord },
    }))

    clearTimeout(saveTimers.current[questionId])
    saveTimers.current[questionId] = setTimeout(() => {
      saveAnswer(questionId, value, isPrivate)
    }, 800)
  }

  function togglePrivate(questionId: string) {
    const current = answers[questionId]?.mine
    const newPrivate = !(current?.isPrivate ?? false)
    const value = current?.value ?? ''

    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        mine: { ...(prev[questionId]?.mine ?? {}), questionId, value, isPrivate: newPrivate } as AnswerRecord,
      },
    }))

    saveAnswer(questionId, value, newPrivate)
  }

  async function markDone(done: boolean) {
    const s = getSession()
    if (!s) return
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-member-id': s.memberId },
      body: JSON.stringify({ chapterId, done }),
    })
    router.back()
  }

  if (!session || !chapterData) return null
  const { chapter, deel } = chapterData

  const subsectionToShow = chapter.subsections?.find(s => s.id === activeSubsection)

  function renderQuestion(q: Question, section: Section | null, subsection: Subsection | null) {
    const key = buildKey(section, subsection, q)
    const myAnswer = answers[key]?.mine
    const partnerAnswer = answers[key]?.partner
    const isPrivate = myAnswer?.isPrivate ?? false

    if (q.type === 'readonly') {
      return (
        <div key={q.id} className="mb-5">
          <p className="text-sm font-medium text-stone-700 mb-2">{q.text}</p>
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <p className="text-stone-600 text-sm italic leading-relaxed">{q.value}</p>
          </div>
        </div>
      )
    }

    if (q.type === 'checkbox' && q.options) {
      const selected = myAnswer?.value ? JSON.parse(myAnswer.value) as string[] : []
      const partnerSelected = partnerAnswer?.value ? JSON.parse(partnerAnswer.value) as string[] : []

      function toggleOption(opt: string) {
        const newSelected = selected.includes(opt)
          ? selected.filter(s => s !== opt)
          : [...selected, opt]
        const value = JSON.stringify(newSelected)
        setAnswers(prev => ({
          ...prev,
          [key]: { ...prev[key], mine: { ...(prev[key]?.mine ?? {}), questionId: key, value, isPrivate } as AnswerRecord },
        }))
        saveAnswer(key, value, isPrivate)
      }

      return (
        <div key={q.id} className="mb-6">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-stone-700">{q.text}</p>
            <button onClick={() => togglePrivate(key)} title={isPrivate ? 'Privé (alleen partner ziet dit)' : 'Klik om privé te maken'} className="shrink-0 mt-0.5">
              {isPrivate ? '🔒' : '👁'}
            </button>
          </div>
          {q.hint && <p className="text-xs text-stone-400 mb-3">{q.hint}</p>}
          <div className="grid grid-cols-2 gap-2">
            {q.options.map(opt => {
              const isMine = selected.includes(opt)
              const isPartner = partnerSelected.includes(opt)
              return (
                <button
                  key={opt}
                  onClick={() => toggleOption(opt)}
                  className={`text-left px-3 py-2 rounded-xl text-sm border transition-all ${
                    isMine ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200'
                  }`}
                >
                  <span>{opt}</span>
                  {isPartner && <span className="ml-1 text-xs opacity-60">({partnerAnswer?.memberName?.split(' ')[0]})</span>}
                </button>
              )
            })}
          </div>
          {q.other && (
            <input
              type="text"
              placeholder="Anders, namelijk..."
              className="mt-2 w-full px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          )}
        </div>
      )
    }

    if (q.type === 'parts' && q.parts) {
      return (
        <div key={q.id} className="mb-6">
          <p className="text-sm font-medium text-stone-700 mb-3">{q.text}</p>
          {q.hint && <p className="text-xs text-stone-400 mb-3">{q.hint}</p>}
          {q.parts.map(part => {
            const partKey = `${key}.${part.id}`
            const myPart = answers[partKey]?.mine
            const partnerPart = answers[partKey]?.partner
            const partPrivate = myPart?.isPrivate ?? false
            return (
              <div key={part.id} className="mb-3">
                <p className="text-xs font-semibold text-stone-500 mb-1">{part.label}</p>
                <div className="relative">
                  <textarea
                    value={myPart?.value ?? ''}
                    onChange={e => handleChange(partKey, e.target.value)}
                    placeholder={part.placeholder ?? 'Schrijf hier...'}
                    className="w-full px-4 py-3 pr-10 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                  <button
                    onClick={() => togglePrivate(partKey)}
                    className="absolute top-3 right-3 text-base"
                    title={partPrivate ? 'Privé' : 'Klik voor privé'}
                  >
                    {partPrivate ? '🔒' : '👁'}
                  </button>
                </div>
                {partnerPart?.value && (
                  <div className="mt-1 bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-600 mb-0.5">{partnerPart.memberName}</p>
                    <p className="text-sm text-stone-700">{partnerPart.value}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )
    }

    return (
      <div key={q.id} className="mb-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-medium text-stone-700">{q.text}</p>
          <button
            onClick={() => togglePrivate(key)}
            title={isPrivate ? 'Privé (alleen partner ziet dit)' : 'Klik om privé te maken'}
            className="shrink-0 mt-0.5 text-base"
          >
            {isPrivate ? '🔒' : '👁'}
          </button>
        </div>
        {q.hint && <p className="text-xs text-stone-400 mb-2">{q.hint}</p>}
        <textarea
          value={myAnswer?.value ?? ''}
          onChange={e => handleChange(key, e.target.value)}
          placeholder={q.placeholder ?? 'Jouw antwoord...'}
          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-300 min-h-[80px]"
        />
        {partnerAnswer?.value && (
          <div className="mt-2 bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 mb-0.5">{partnerAnswer.memberName}</p>
            <p className="text-sm text-stone-700 whitespace-pre-wrap">{partnerAnswer.value}</p>
          </div>
        )}
      </div>
    )
  }

  function renderSection(section: Section, subsection: Subsection | null = null) {
    const colorMap: Record<string, string> = {
      personal: 'text-stone-700',
      samen: 'text-indigo-700',
      reflection: 'text-stone-700',
      personal_man: 'text-sky-700',
      personal_vrouw: 'text-rose-700',
    }
    const bgMap: Record<string, string> = {
      personal: 'bg-stone-50 border-stone-200',
      samen: 'bg-indigo-50 border-indigo-200',
      reflection: 'bg-stone-50 border-stone-200',
      personal_man: 'bg-sky-50 border-sky-200',
      personal_vrouw: 'bg-rose-50 border-rose-200',
    }

    return (
      <div key={section.id} className={`mb-5 rounded-2xl border p-4 ${bgMap[section.type] ?? 'bg-white border-stone-200'}`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${colorMap[section.type] ?? 'text-stone-700'}`}>
          {section.title}
        </h3>
        {section.intro && (
          <p className="text-xs text-stone-500 mb-3 italic leading-relaxed">{section.intro}</p>
        )}
        {section.questions.map(q => renderQuestion(q, section, subsection))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-2 sticky top-0 z-10">
        <button
          onClick={() => setShowExitDialog(true)}
          className="text-stone-400 p-1 text-sm"
        >
          ← Terug
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate" style={{ color: deel.color }}>
            {deel.letter ? `Deel ${deel.letter}` : ''} — {chapter.number}
          </p>
          <p className="text-sm font-semibold text-stone-900 truncate leading-tight">{chapter.title}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {chapter.verse && (
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-2xl px-4 py-3 mb-5">
            {chapter.verse.pretext && (
              <p className="text-xs text-amber-600 mb-1 italic">{chapter.verse.pretext}</p>
            )}
            <p className="text-xs font-bold text-amber-700 mb-1">{chapter.verse.ref}</p>
            <p className="text-sm text-amber-900 italic leading-relaxed">{chapter.verse.text}</p>
          </div>
        )}

        {chapter.intro && (
          <div className="bg-white rounded-2xl p-4 border border-stone-100 mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Wat zien we hier?</h3>
            {chapter.intro.split('\n\n').map((para, i) => (
              <p key={i} className="text-sm text-stone-700 leading-relaxed mb-2 last:mb-0">{para}</p>
            ))}
          </div>
        )}

        {chapter.subsections && chapter.subsections.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-3 font-medium">Onderdelen</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {chapter.subsections.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubsection(activeSubsection === sub.id ? null : sub.id)}
                  className={`text-left rounded-2xl p-4 border transition-all active:scale-95 ${
                    activeSubsection === sub.id
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-700 border-stone-200'
                  }`}
                >
                  <p className={`text-xs font-bold mb-1 ${activeSubsection === sub.id ? 'text-stone-300' : 'text-stone-400'}`}>
                    {sub.number}
                  </p>
                  <p className="text-xs font-semibold leading-snug">{sub.title}</p>
                </button>
              ))}
            </div>

            {subsectionToShow && (
              <div className="bg-white rounded-2xl p-4 border border-stone-200 mb-3">
                <h3 className="font-bold text-stone-900 text-sm mb-2">{subsectionToShow.number} — {subsectionToShow.title}</h3>
                {subsectionToShow.intro.split('\n\n').map((para, i) => (
                  <p key={i} className="text-sm text-stone-600 leading-relaxed mb-2 last:mb-0">{para}</p>
                ))}
                <div className="mt-4">
                  {subsectionToShow.sections.map(s => renderSection(s, subsectionToShow))}
                </div>
              </div>
            )}
          </div>
        )}

        {chapter.sections.map(s => renderSection(s))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-4 py-3">
        <button
          onClick={() => setShowExitDialog(true)}
          className="w-full py-3 bg-stone-900 text-white rounded-2xl font-semibold text-sm"
        >
          Klaar met dit hoofdstuk
        </button>
      </div>

      {showExitDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-stone-900 text-lg mb-2">Hoofdstuk verlaten</h2>
            <p className="text-stone-500 text-sm mb-5">Wil je dit hoofdstuk markeren als gedaan?</p>
            <div className="space-y-2">
              <button
                onClick={() => markDone(true)}
                className="w-full py-3 bg-stone-900 text-white rounded-2xl font-semibold"
              >
                ✓ Markeer als gedaan
              </button>
              <button
                onClick={() => { setShowExitDialog(false); router.back() }}
                className="w-full py-3 bg-stone-100 text-stone-700 rounded-2xl font-medium"
              >
                Gewoon verlaten
              </button>
              <button
                onClick={() => setShowExitDialog(false)}
                className="w-full py-3 text-stone-400 text-sm"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
