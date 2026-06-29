'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getChapter } from '@/content'
import type { Chapter, Deel, Section, Subsection, Question } from '@/content'
import { encryptAnswer, decryptAnswer } from '@/lib/crypto'
import { getPusherClient, coupleChannel, EVENTS } from '@/lib/pusher'
import { isEditor } from '@/lib/roles'
import { renderContent } from '@/lib/renderContent'
import ChapterEditor from '@/components/ChapterEditor'
import CommentPopup from '@/components/CommentPopup'
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
  [questionId: string]: { mine?: AnswerRecord; partner?: AnswerRecord }
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
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [showEditor, setShowEditor] = useState(false)
  const [isDynamic, setIsDynamic] = useState(false)
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null)
  const [showVerdieping, setShowVerdieping] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const pusherRef = useRef<InstanceType<typeof Pusher> | null>(null)
  const channelRef = useRef<Channel | null>(null)
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const ck = useCallback((suffix: string) => `ch:${chapterId}:${suffix}`, [chapterId])
  const t = useCallback((key: string, fallback: string) => overrides[key] ?? fallback, [overrides])
  function txt(key: string, fallback: string) { return t(ck(key), fallback) }

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSessionData(s)
    const cd = getChapter(chapterId)
    if (cd) {
      setChapterData(cd)
    } else {
      // Try dynamic (DB) chapter
      fetch(`/api/chapters?id=${chapterId}`)
        .then(r => r.json())
        .then(data => {
          if (!data.chapter) { router.replace('/home'); return }
          const { getDeel } = require('@/content') as typeof import('@/content')
          const deel = getDeel(data.chapter.deelId)
          if (!deel) { router.replace('/home'); return }
          const synthChapter: Chapter = {
            id: chapterId,
            number: '',
            title: '',
            deelId: data.chapter.deelId,
            sections: [],
          }
          setChapterData({ chapter: synthChapter, deel })
          setIsDynamic(true)
          // Auto-open editor if this was just created (no title set yet)
          const flagId = sessionStorage.getItem('hc_open_editor')
          if (flagId === chapterId) {
            sessionStorage.removeItem('hc_open_editor')
            setShowEditor(true)
          }
        })
    }
    loadAnswers(s.memberId, chapterId)
    loadOverrides(chapterId)
    setupPusher(s.coupleCode, s.memberId, chapterId, s.coupleCode)
    return () => {
      if (channelRef.current) pusherRef.current?.unsubscribe(coupleChannel(s.coupleCode))
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
      if (data.chapterId !== chapId || data.memberId === myId) return
      let displayValue = data.value
      if (data.isPrivate && data.value) displayValue = await decryptAnswer(data.value, coupleCode)
      setAnswers(prev => ({
        ...prev,
        [data.questionId]: { ...prev[data.questionId], partner: { ...data, value: displayValue } },
      }))
    })
  }

  async function loadOverrides(chapId: string) {
    const res = await fetch(`/api/content?prefix=ch:${chapId}:`)
    if (res.ok) setOverrides((await res.json()).overrides)
  }

  async function loadAnswers(memberId: string, chapId: string) {
    const res = await fetch(`/api/answers?memberId=${memberId}&chapterId=${chapId}`)
    if (!res.ok) return
    const s = getSession()!
    const map: AnswerMap = {}
    for (const a of (await res.json()).answers as AnswerRecord[]) {
      if (!map[a.questionId]) map[a.questionId] = {}
      let displayValue = a.value
      if (a.isPrivate && a.value) displayValue = await decryptAnswer(a.value, s.coupleCode)
      if (a.memberId === memberId) map[a.questionId].mine = { ...a, value: displayValue }
      else map[a.questionId].partner = { ...a, value: displayValue }
    }
    setAnswers(map)
  }

  const saveAnswer = useCallback(async (questionId: string, value: string, isPrivate: boolean) => {
    const s = getSession()
    if (!s) return
    let storedValue = value
    if (isPrivate && value) storedValue = await encryptAnswer(value, s.coupleCode)
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
    saveTimers.current[questionId] = setTimeout(() => saveAnswer(questionId, value, isPrivate), 800)
  }

  function togglePrivate(questionId: string) {
    const current = answers[questionId]?.mine
    const newPrivate = !(current?.isPrivate ?? false)
    const value = current?.value ?? ''
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], mine: { ...(prev[questionId]?.mine ?? {}), questionId, value, isPrivate: newPrivate } as AnswerRecord },
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
  const editor = isEditor(session.memberName)
  const subsectionToShow = chapter.subsections?.find(s => s.id === activeSubsection)

  function renderQuestion(q: Question, section: Section | null, subsection: Subsection | null) {
    const qKey = buildKey(section, subsection, q)
    const myAnswer = answers[qKey]?.mine
    const partnerAnswer = answers[qKey]?.partner
    const isPrivate = myAnswer?.isPrivate ?? false
    const prefix = subsection
      ? `sub:${subsection.id}.s:${section?.id}.q:${q.id}`
      : `s:${section?.id}.q:${q.id}`
    const qText = txt(`${prefix}.text`, q.text)
    const qHintRaw = txt(`${prefix}.hint`, q.hint ?? '')
    const qHint = qHintRaw || undefined

    if (q.type === 'readonly') {
      const val = txt(`${prefix}.value`, q.value ?? '')
      return (
        <div key={q.id} className="mb-5">
          <p className="text-sm font-medium text-stone-700 mb-2">{qText}</p>
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            {renderContent(val, 'text-stone-600 text-sm italic leading-relaxed')}
          </div>
        </div>
      )
    }

    if (q.type === 'checkbox' && q.options) {
      const selected = myAnswer?.value ? JSON.parse(myAnswer.value) as string[] : []
      const partnerSelected = partnerAnswer?.value ? JSON.parse(partnerAnswer.value) as string[] : []
      const showPartner = section?.type === 'samen' || selected.length > 0
      function toggleOption(opt: string) {
        const newSelected = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]
        const value = JSON.stringify(newSelected)
        setAnswers(prev => ({ ...prev, [qKey]: { ...prev[qKey], mine: { ...(prev[qKey]?.mine ?? {}), questionId: qKey, value, isPrivate } as AnswerRecord } }))
        saveAnswer(qKey, value, isPrivate)
      }
      return (
        <div key={q.id} className="mb-6">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-stone-700">{qText}</p>
            <button onClick={() => togglePrivate(qKey)} className="shrink-0 mt-0.5 text-base">{isPrivate ? '🔒' : '👁'}</button>
          </div>
          {qHint && <p className="text-xs text-stone-400 mb-3">{qHint}</p>}
          <div className="grid grid-cols-2 gap-2">
            {q.options.map(opt => {
              const isMine = selected.includes(opt)
              const isPartner = showPartner && partnerSelected.includes(opt)
              return (
                <button key={opt} onClick={() => toggleOption(opt)}
                  className={`text-left px-3 py-2 rounded-xl text-sm border transition-all ${isMine ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200'}`}>
                  {opt}{isPartner && <span className="ml-1 text-xs opacity-60">({partnerAnswer?.memberName?.split(' ')[0]})</span>}
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    if (q.type === 'parts' && q.parts) {
      return (
        <div key={q.id} className="mb-6">
          <p className="text-sm font-medium text-stone-700 mb-3">{qText}</p>
          {qHint && <p className="text-xs text-stone-400 mb-3">{qHint}</p>}
          {q.parts.map(part => {
            const partKey = `${qKey}.${part.id}`
            const myPart = answers[partKey]?.mine
            const partnerPart = answers[partKey]?.partner
            const partPrivate = myPart?.isPrivate ?? false
            return (
              <div key={part.id} className="mb-3">
                <p className="text-xs font-semibold text-stone-500 mb-1">{part.label}</p>
                <div className="relative">
                  <textarea value={myPart?.value ?? ''} onChange={e => handleChange(partKey, e.target.value)}
                    placeholder={part.placeholder ?? 'Schrijf hier...'}
                    className="w-full px-4 py-3 pr-10 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-300" />
                  <button onClick={() => togglePrivate(partKey)} className="absolute top-3 right-3 text-base">{partPrivate ? '🔒' : '👁'}</button>
                </div>
                {partnerPart?.value && (section?.type === 'samen' || !!myPart?.value) && (
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
          <p className="text-sm font-medium text-stone-700">{qText}</p>
          <button onClick={() => togglePrivate(qKey)} className="shrink-0 mt-0.5 text-base">{isPrivate ? '🔒' : '👁'}</button>
        </div>
        {qHint && <p className="text-xs text-stone-400 mb-2">{qHint}</p>}
        <textarea value={myAnswer?.value ?? ''} onChange={e => handleChange(qKey, e.target.value)}
          placeholder={q.placeholder ?? 'Jouw antwoord...'}
          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-300 min-h-[80px]" />
        {partnerAnswer?.value && (section?.type === 'samen' || !!myAnswer?.value) && (
          <div className="mt-2 bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 mb-0.5">{partnerAnswer.memberName}</p>
            <p className="text-sm text-stone-700 whitespace-pre-wrap">{partnerAnswer.value}</p>
          </div>
        )}
      </div>
    )
  }

  function renderExtraQ(eq: { id: string; text: string; hint: string; type?: string; options?: string[]; min?: number; max?: number }, qKey: string, sectionType?: string) {
    const myAnswer = answers[qKey]?.mine
    const partnerAnswer = answers[qKey]?.partner
    const isPrivate = myAnswer?.isPrivate ?? false
    const showPartner = sectionType === 'samen' || !!myAnswer?.value
    const togglePriv = () => {
      const newPrivate = !isPrivate
      const value = myAnswer?.value ?? ''
      setAnswers(prev => ({ ...prev, [qKey]: { ...prev[qKey], mine: { ...(prev[qKey]?.mine ?? {}), questionId: qKey, value, isPrivate: newPrivate } as AnswerRecord } }))
      saveAnswer(qKey, value, newPrivate)
    }
    return (
      <div key={qKey} className="mb-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-medium text-stone-700">{eq.text}</p>
          <button onClick={togglePriv} className="shrink-0 mt-0.5 text-base">{isPrivate ? '🔒' : '👁'}</button>
        </div>
        {eq.hint && <p className="text-xs text-stone-400 mb-2">{eq.hint}</p>}
        {(!eq.type || eq.type === 'text') && (
          <textarea value={myAnswer?.value ?? ''} onChange={e => handleChange(qKey, e.target.value)}
            placeholder="Jouw antwoord..."
            className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-300 min-h-[80px]" />
        )}
        {eq.type === 'meerkeuze' && (eq.options ?? []).length > 0 && (() => {
          const andersActive = myAnswer?.value?.startsWith('Anders:') ?? false
          return (
            <>
              <div className="grid grid-cols-2 gap-2">
                {(eq.options ?? []).map(opt => {
                  const isAnders = /^Anders:?\s*$/.test(opt.trim())
                  const isSelected = isAnders ? andersActive : myAnswer?.value === opt
                  return (
                    <button key={opt}
                      onClick={() => handleChange(qKey, isAnders ? (andersActive ? '' : 'Anders: ') : (isSelected ? '' : opt))}
                      className={`text-left px-3 py-2 rounded-xl text-sm border transition-all ${isSelected ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200'}`}>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {andersActive && (
                <input type="text"
                  value={(myAnswer?.value ?? '').replace(/^Anders:\s*/, '')}
                  onChange={e => handleChange(qKey, 'Anders: ' + e.target.value)}
                  placeholder="Typ hier je eigen antwoord..."
                  className="mt-2 w-full px-4 py-2 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              )}
            </>
          )
        })()}
        {eq.type === 'slider' && (
          <div className="px-1">
            <input type="range" min={eq.min ?? 1} max={eq.max ?? 10} step={1}
              value={myAnswer?.value ? Number(myAnswer.value) : (eq.min ?? 1)}
              onChange={e => handleChange(qKey, e.target.value)}
              className="w-full accent-stone-900" />
            <div className="flex justify-between text-xs text-stone-400 mt-1">
              <span>{eq.min ?? 1}</span>
              <span className="font-semibold text-stone-700 text-sm">{myAnswer?.value || (eq.min ?? 1)}</span>
              <span>{eq.max ?? 10}</span>
            </div>
          </div>
        )}
        {partnerAnswer?.value && showPartner && (
          <div className="mt-2 bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 mb-0.5">{partnerAnswer.memberName}</p>
            <p className="text-sm text-stone-700 whitespace-pre-wrap">{partnerAnswer.value}</p>
          </div>
        )}
      </div>
    )
  }

  function renderSection(section: Section, subsection: Subsection | null = null) {
    const bgMap: Record<string, string> = {
      personal: 'bg-stone-50 border-stone-200',
      samen: 'bg-indigo-50 border-indigo-200',
      reflection: 'bg-stone-50 border-stone-200',
      personal_man: 'bg-sky-50 border-sky-200',
      personal_vrouw: 'bg-rose-50 border-rose-200',
    }
    const labelMap: Record<string, string> = {
      personal: 'text-stone-500', samen: 'text-indigo-600', reflection: 'text-stone-500',
      personal_man: 'text-sky-600', personal_vrouw: 'text-rose-600',
    }
    const prefix = subsection ? `sub:${subsection.id}.s:${section.id}` : `s:${section.id}`
    const sectionTitle = txt(`${prefix}.title`, section.title)
    const sectionIntro = section.intro ? txt(`${prefix}.intro`, section.intro) : null

    const extraKey = ck(subsection ? `sub:${subsection.id}.s:${section.id}:extra-questions` : `s:${section.id}:extra-questions`)
    const extraQuestions: { id: string; text: string; hint: string; type?: string; options?: string[]; min?: number; max?: number }[] = (() => {
      try { return JSON.parse(overrides[extraKey] ?? '[]') } catch { return [] }
    })()

    if (section.questions.length === 0 && extraQuestions.length === 0) return null

    return (
      <div key={section.id} className={`mb-5 rounded-2xl border p-4 ${bgMap[section.type] ?? 'bg-white border-stone-200'}`}>
        <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${labelMap[section.type] ?? 'text-stone-500'}`}>
          {sectionTitle}
        </h3>
        {sectionIntro && renderContent(sectionIntro, 'text-xs text-stone-500 mb-3 italic leading-relaxed')}
        {section.questions.map(q => renderQuestion(q, section, subsection))}
        {extraQuestions.map(eq => {
          const qKey = subsection ? `${subsection.id}.${eq.id}` : `${section.id}.${eq.id}`
          return renderExtraQ(eq, qKey, section.type)
        })}
      </div>
    )
  }

  const introValue = overrides[ck('intro')] ?? chapter.intro?.split('\n\n').map((p, i) => overrides[ck(`intro.${i}`)] ?? p).join('\n\n')
  const dynamicVerseRef = overrides[ck('verse.ref')]
  const chapterTitle = txt('title', String(chapter.title)) || 'Nieuw hoofdstuk'

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-2 sticky top-0 z-10">
        <button onClick={() => setShowExitDialog(true)} className="text-stone-400 p-1 text-sm">← Terug</button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest truncate" style={{ color: deel.color }}>
            {deel.letter ? `Deel ${deel.letter}` : ''}{chapter.number ? ` — ${chapter.number}` : ''}
          </p>
          <p className="text-sm font-semibold text-stone-900 truncate leading-tight">{chapterTitle}</p>
        </div>
        {editor && (
          <button
            onClick={() => setShowEditor(true)}
            className="shrink-0 flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-xl"
          >
            ✏️ Bewerken
          </button>
        )}
      </div>

      {/* Empty state for new dynamic chapters */}
      {isDynamic && !dynamicVerseRef && !introValue && (
        <div className="max-w-lg mx-auto px-4 pt-12 pb-6 text-center">
          <p className="text-stone-400 text-sm mb-4">Dit is een nieuw hoofdstuk. Klik op Bewerken om inhoud toe te voegen.</p>
          {editor && (
            <button
              onClick={() => setShowEditor(true)}
              className="inline-flex items-center gap-2 bg-amber-500 text-white font-bold px-5 py-3 rounded-2xl text-sm"
            >
              ✏️ Bewerken
            </button>
          )}
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6 pb-32">
        {/* Static verse OR dynamic verse from overrides */}
        {(chapter.verse || dynamicVerseRef) && (
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-2xl px-4 py-3 mb-5">
            {(chapter.verse?.pretext || overrides[ck('verse.pretext')]) && (
              <p className="text-xs text-amber-600 mb-1 italic">
                {txt('verse.pretext', chapter.verse?.pretext ?? '')}
              </p>
            )}
            <p className="text-xs font-bold text-amber-700 mb-1">
              {txt('verse.ref', chapter.verse?.ref ?? '')}
            </p>
            {renderContent(txt('verse.text', chapter.verse?.text ?? ''), 'text-sm text-amber-900 italic leading-relaxed')}
          </div>
        )}

        {(chapter.intro !== undefined || (isDynamic && introValue)) && introValue && (
          <div className="bg-white rounded-2xl p-4 border border-stone-100 mb-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Wat zien we hier?</h3>
            {renderContent(introValue, 'text-sm text-stone-700 leading-relaxed mb-2 last:mb-0')}
          </div>
        )}

        {/* Verdieping */}
        {overrides[ck('verdieping')] && (
          <div className="mb-5">
            <button
              onClick={() => setShowVerdieping(v => !v)}
              className="w-full flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-indigo-100 active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <span className="text-indigo-500 text-base">📖</span>
                <span className="text-sm font-semibold text-indigo-700">Verdieping</span>
              </div>
              <span className={`text-indigo-400 text-sm transition-transform duration-200 ${showVerdieping ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {showVerdieping && (
              <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-4">
                {overrides[ck('verdieping.title')] && (
                  <p className="text-base font-bold text-indigo-900 mb-3">{overrides[ck('verdieping.title')]}</p>
                )}
                {renderContent(overrides[ck('verdieping')], 'text-sm text-indigo-900 leading-relaxed')}
              </div>
            )}
          </div>
        )}

        {chapter.subsections && chapter.subsections.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-3 font-semibold">Onderdelen</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {chapter.subsections.map(sub => (
                <button key={sub.id} onClick={() => setActiveSubsection(activeSubsection === sub.id ? null : sub.id)}
                  className={`text-left rounded-2xl p-4 border transition-all active:scale-95 ${activeSubsection === sub.id ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200'}`}>
                  <p className={`text-[10px] font-bold mb-1 ${activeSubsection === sub.id ? 'text-stone-300' : 'text-stone-400'}`}>{sub.number}</p>
                  <p className="text-xs font-semibold leading-snug">{sub.title}</p>
                </button>
              ))}
            </div>
            {subsectionToShow && (
              <div className="bg-white rounded-2xl p-4 border border-stone-200 mb-3">
                <h3 className="font-bold text-stone-900 text-sm mb-2">{subsectionToShow.number} — {subsectionToShow.title}</h3>
                {renderContent(subsectionToShow.intro, 'text-sm text-stone-600 leading-relaxed mb-2')}
                <div className="mt-4">
                  {subsectionToShow.sections
                    .filter(s => editor || !session.isSingle || s.type !== 'samen')
                    .map(s => renderSection(s, subsectionToShow))}
                </div>
              </div>
            )}
          </div>
        )}

        {chapter.sections
          .filter(s => editor || !session.isSingle || s.type !== 'samen')
          .map(s => renderSection(s))}

        {/* Virtual sections added by editors */}
        {(() => {
          try {
            const bgMap: Record<string, string> = { personal: 'bg-stone-50 border-stone-200', samen: 'bg-indigo-50 border-indigo-200', reflection: 'bg-stone-50 border-stone-200', personal_man: 'bg-sky-50 border-sky-200', personal_vrouw: 'bg-rose-50 border-rose-200' }
            const labelMap: Record<string, string> = { personal: 'text-stone-500', samen: 'text-indigo-600', reflection: 'text-stone-500', personal_man: 'text-sky-600', personal_vrouw: 'text-rose-600' }
            const vSections: { id: string; type: string; title: string; questions: { id: string; text: string; hint: string }[] }[] = JSON.parse(overrides[ck('extra-sections')] ?? '[]')
            return vSections
              .filter(vs => vs.questions.length > 0)
              .filter(vs => editor || !session.isSingle || vs.type !== 'samen')
              .map(vs => (
                <div key={vs.id} className={`mb-5 rounded-2xl border p-4 ${bgMap[vs.type] ?? 'bg-white border-stone-200'}`}>
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${labelMap[vs.type] ?? 'text-stone-500'}`}>{vs.title}</h3>
                  {vs.questions.map(q => renderExtraQ(q, `${vs.id}.${q.id}`, vs.type))}
                </div>
              ))
          } catch { return null }
        })()}

        {/* Bronnen */}
        {(() => {
          try {
            const bronnen: { title: string; author: string; year: string }[] = JSON.parse(overrides[ck('bronnen')] ?? '[]')
            if (!bronnen.length) return null
            return (
              <div className="mt-6 bg-stone-50 rounded-2xl border border-stone-100 px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Bronnen</p>
                <ul className="space-y-1.5">
                  {bronnen.map((b, i) => (
                    <li key={i} className="text-xs text-stone-500 leading-snug">
                      {b.author && <span>{b.author}{b.year ? ` (${b.year})` : ''}. </span>}
                      <span className="italic">{b.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          } catch { return null }
        })()}

        <div className="mt-4 pt-4 border-t border-stone-100">
          <CommentPopup chapterId={chapterId} chapterTitle={txt('title', String(chapter.title))} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-4 py-3">
        <button onClick={() => setShowExitDialog(true)} className="w-full py-3 bg-stone-900 text-white rounded-2xl font-semibold text-sm">
          Klaar met dit hoofdstuk
        </button>
      </div>

      {showExitDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-stone-900 text-lg mb-2">Hoofdstuk verlaten</h2>
            <p className="text-stone-500 text-sm mb-5">Wil je dit hoofdstuk markeren als gedaan?</p>
            <div className="space-y-2">
              <button onClick={() => markDone(true)} className="w-full py-3 bg-stone-900 text-white rounded-2xl font-semibold">✓ Markeer als gedaan</button>
              <button onClick={() => { setShowExitDialog(false); router.back() }} className="w-full py-3 bg-stone-100 text-stone-700 rounded-2xl font-medium">Gewoon verlaten</button>
              <button onClick={() => setShowExitDialog(false)} className="w-full py-3 text-stone-400 text-sm">Annuleren</button>
            </div>
          </div>
        </div>
      )}

      {showEditor && (
        <ChapterEditor
          chapter={chapter}
          deelTitle={deel.title}
          deelLetter={deel.letter}
          deelColor={deel.color}
          overrides={overrides}
          isDynamic={isDynamic}
          onSaved={updates => setOverrides(prev => ({ ...prev, ...updates }))}
          onClose={() => setShowEditor(false)}
          onDeleted={() => router.replace(`/deel/${chapter.deelId}`)}
        />
      )}
    </div>
  )
}
