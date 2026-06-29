'use client'

import { useState, useCallback } from 'react'
import { getSession } from '@/lib/session'
import type { Chapter } from '@/content'
import RichEditor from './RichEditor'

interface Props {
  chapter: Chapter
  deelTitle: string
  deelLetter?: string
  deelColor: string
  overrides: Record<string, string>
  isDynamic?: boolean
  onSaved: (updates: Record<string, string>) => void
  onClose: () => void
  onDeleted?: () => void
}

interface Bron { title: string; author: string; year: string }

function parseBronnen(raw: string): Bron[] {
  try { return JSON.parse(raw) } catch { return [] }
}

export default function ChapterEditor({ chapter, deelTitle, deelLetter, deelColor, overrides, isDynamic, onSaved, onClose, onDeleted }: Props) {
  const ck = useCallback((suffix: string) => `ch:${chapter.id}:${suffix}`, [chapter.id])
  const t = (key: string, fallback: string) => overrides[ck(key)] ?? fallback

  const [bronnen, setBronnen] = useState<Bron[]>(() => parseBronnen(overrides[ck('bronnen')] ?? '[]'))

  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {}
    d['title'] = t('title', String(chapter.title))
    if (chapter.verse || isDynamic) {
      d['verse.ref'] = t('verse.ref', chapter.verse?.ref ?? '')
      d['verse.text'] = t('verse.text', chapter.verse?.text ?? '')
      if (chapter.verse?.pretext !== undefined || isDynamic) {
        d['verse.pretext'] = t('verse.pretext', chapter.verse?.pretext ?? '')
      }
    }
    d['verdieping.title'] = overrides[ck('verdieping.title')] ?? ''
    d['verdieping'] = overrides[ck('verdieping')] ?? ''
    if (chapter.intro !== undefined || isDynamic) {
      const stored = overrides[ck('intro')]
      d['intro'] = stored ?? (chapter.intro ? chapter.intro.split('\n\n').map((p, i) => overrides[ck(`intro.${i}`)] ?? p).join('\n\n') : '')
    }
    chapter.sections.forEach(s => {
      d[`s:${s.id}.title`] = t(`s:${s.id}.title`, s.title)
      if (s.intro) d[`s:${s.id}.intro`] = t(`s:${s.id}.intro`, s.intro)
      s.questions.forEach(q => {
        d[`s:${s.id}.q:${q.id}.text`] = t(`s:${s.id}.q:${q.id}.text`, q.text)
        // Always load hint (even without static hint, an override may exist)
        d[`s:${s.id}.q:${q.id}.hint`] = t(`s:${s.id}.q:${q.id}.hint`, q.hint ?? '')
        if (q.value) d[`s:${s.id}.q:${q.id}.value`] = t(`s:${s.id}.q:${q.id}.value`, q.value)
      })
    })
    chapter.subsections?.forEach(sub => {
      sub.sections.forEach(s => {
        d[`sub:${sub.id}.s:${s.id}.title`] = t(`sub:${sub.id}.s:${s.id}.title`, s.title)
        s.questions.forEach(q => {
          d[`sub:${sub.id}.s:${s.id}.q:${q.id}.text`] = t(`sub:${sub.id}.s:${s.id}.q:${q.id}.text`, q.text)
        })
      })
    })
    return d
  })

  interface ExtraQ { id: string; text: string; hint: string; type?: 'text' | 'meerkeuze' | 'slider'; options?: string[]; min?: number; max?: number }
  interface VirtualSection { id: string; type: 'personal' | 'samen' | 'reflection' | 'personal_man' | 'personal_vrouw'; title: string; questions: ExtraQ[] }

  // Extra questions added by editors per section
  const [extraQuestions, setExtraQuestions] = useState<Record<string, ExtraQ[]>>(() => {
    const map: Record<string, ExtraQ[]> = {}
    chapter.sections.forEach(s => {
      const raw = overrides[ck(`s:${s.id}:extra-questions`)]
      if (raw) { try { map[s.id] = JSON.parse(raw) } catch { /* ignore */ } }
    })
    return map
  })

  // Fully custom sections (title + type + questions) added by editors
  const [virtualSections, setVirtualSections] = useState<VirtualSection[]>(() => {
    try { return JSON.parse(overrides[ck('extra-sections')] ?? '[]') } catch { return [] }
  })

  function addExtraQuestion(sectionId: string) {
    const newQ: ExtraQ = { id: `eq${Date.now()}`, text: '', hint: '' }
    setExtraQuestions(prev => ({ ...prev, [sectionId]: [...(prev[sectionId] ?? []), newQ] }))
  }
  function updateExtraQuestion(sectionId: string, idx: number, updates: Partial<ExtraQ>) {
    setExtraQuestions(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId] ?? []).map((q, i) => i === idx ? { ...q, ...updates } : q),
    }))
  }
  function removeExtraQuestion(sectionId: string, idx: number) {
    setExtraQuestions(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId] ?? []).filter((_, i) => i !== idx),
    }))
  }

  function addVirtualSection() {
    setVirtualSections(prev => [...prev, { id: `vs${Date.now()}`, type: 'samen', title: 'Samen bespreken', questions: [] }])
  }
  function removeVirtualSection(id: string) {
    setVirtualSections(prev => prev.filter(s => s.id !== id))
  }
  function updateVirtualSection(id: string, field: 'type' | 'title', value: string) {
    setVirtualSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value as VirtualSection['type'] } : s))
  }
  function addVirtualQuestion(sectionId: string) {
    setVirtualSections(prev => prev.map(s => s.id === sectionId
      ? { ...s, questions: [...s.questions, { id: `vq${Date.now()}`, text: '', hint: '' }] } : s))
  }
  function updateVirtualQuestion(sectionId: string, idx: number, updates: Partial<ExtraQ>) {
    setVirtualSections(prev => prev.map(s => s.id === sectionId
      ? { ...s, questions: s.questions.map((q, i) => i === idx ? { ...q, ...updates } : q) } : s))
  }
  function removeVirtualQuestion(sectionId: string, idx: number) {
    setVirtualSections(prev => prev.map(s => s.id === sectionId
      ? { ...s, questions: s.questions.filter((_, i) => i !== idx) } : s))
  }

  // Track which question hint fields are expanded (for questions without a static hint)
  const [expandedHints, setExpandedHints] = useState<Set<string>>(() => {
    const keys = new Set<string>()
    chapter.sections.forEach(s => {
      s.questions.forEach(q => {
        const hintKey = `s:${s.id}.q:${q.id}.hint`
        if (overrides[ck(hintKey)]) keys.add(hintKey)
      })
    })
    chapter.subsections?.forEach(sub => {
      sub.sections.forEach(s => {
        s.questions.forEach(q => {
          const hintKey = `sub:${sub.id}.s:${s.id}.q:${q.id}.hint`
          if (overrides[ck(hintKey)]) keys.add(hintKey)
        })
      })
    })
    return keys
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function deleteChapter() {
    const session = getSession()
    if (!session) return
    setDeleting(true)
    if (isDynamic) {
      await fetch('/api/chapters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-member-name': session.memberName },
        body: JSON.stringify({ id: chapter.id }),
      })
    } else {
      const res = await fetch('/api/content?keys=app:hidden-chapters')
      const data = await res.json()
      const current: string[] = (() => { try { return JSON.parse(data.overrides?.['app:hidden-chapters'] ?? '[]') } catch { return [] } })()
      if (!current.includes(chapter.id)) current.push(chapter.id)
      await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-member-name': session.memberName },
        body: JSON.stringify({ key: 'app:hidden-chapters', value: JSON.stringify(current) }),
      })
    }
    setDeleting(false)
    onDeleted?.()
  }

  function set(key: string, value: string) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  async function saveAll() {
    setSaving(true)
    const session = getSession()
    const bronnenValue = JSON.stringify(bronnen.filter(b => b.title.trim()))
    const extraEntries: [string, string][] = [
      ...chapter.sections.map(s => [
        `s:${s.id}:extra-questions`,
        JSON.stringify((extraQuestions[s.id] ?? []).filter(q => q.text.trim())),
      ] as [string, string]),
      ['extra-sections', JSON.stringify(virtualSections.map(vs => ({ ...vs, questions: vs.questions.filter(q => q.text.trim()) })).filter(vs => vs.title.trim()))],
    ]
    const entries: [string, string][] = [...Object.entries(draft), ['bronnen', bronnenValue], ...extraEntries]
    await Promise.all(entries.map(([key, value]) =>
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-member-name': session?.memberName ?? '' },
        body: JSON.stringify({ key: ck(key), value }),
      })
    ))
    const updates: Record<string, string> = {}
    for (const [key, value] of entries) updates[ck(key)] = value
    onSaved(updates)
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1000)
  }

  const inputCls = 'w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300'
  const labelCls = 'block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1'

  const showVerse = !!(chapter.verse || isDynamic)
  const showIntro = chapter.intro !== undefined || isDynamic

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="text-stone-400 p-1 text-sm shrink-0">✕</button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: deelColor }}>
            {deelLetter ? `Deel ${deelLetter} — ` : ''}{deelTitle}
          </p>
          <p className="text-sm font-bold text-stone-900 truncate">Inhoud bewerken</p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="shrink-0 px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
        >
          {saved ? '✓ Opgeslagen' : saving ? 'Opslaan...' : 'Alles opslaan'}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

        {/* Title */}
        <div>
          <label className={labelCls}>Hoofdstuktitel</label>
          <input type="text" value={draft['title'] ?? ''} onChange={e => set('title', e.target.value)} className={inputCls} placeholder="Titel van dit hoofdstuk..." />
        </div>

        {/* Verse */}
        {showVerse && (
          <div className="bg-amber-50 rounded-2xl p-4 space-y-3 border border-amber-200">
            <p className={labelCls} style={{ color: '#92400e' }}>
              Bijbeltekst{isDynamic && !chapter.verse && <span className="font-normal normal-case tracking-normal text-amber-500 ml-1">(optioneel)</span>}
            </p>
            {(chapter.verse?.pretext !== undefined || isDynamic) && (
              <div>
                <label className={labelCls}>Voortekst</label>
                <input type="text" value={draft['verse.pretext'] ?? ''} onChange={e => set('verse.pretext', e.target.value)} className={inputCls} placeholder="bijv. Lees samen..." />
              </div>
            )}
            <div>
              <label className={labelCls}>Referentie</label>
              <input type="text" value={draft['verse.ref'] ?? ''} onChange={e => set('verse.ref', e.target.value)} className={inputCls} placeholder="bijv. Genesis 2:24" />
            </div>
            <div>
              <label className={labelCls}>Tekst</label>
              <RichEditor
                value={draft['verse.text'] ?? ''}
                onChange={v => set('verse.text', v)}
                placeholder="Bijbeltekst..."
                minHeight="60px"
              />
            </div>
          </div>
        )}

        {/* Intro */}
        {showIntro && (
          <div>
            <label className={labelCls}>Introductie{isDynamic && <span className="font-normal normal-case tracking-normal text-stone-300 ml-1">(optioneel)</span>}</label>
            <RichEditor
              value={draft['intro'] ?? ''}
              onChange={v => set('intro', v)}
              placeholder="Introductietekst voor dit hoofdstuk..."
              minHeight="120px"
            />
          </div>
        )}

        {/* Verdieping */}
        <div className="space-y-2">
          <label className={labelCls}>Verdieping <span className="font-normal normal-case tracking-normal text-stone-300">(optioneel — verschijnt als uitklapknop voor lezers)</span></label>
          <input
            type="text"
            value={draft['verdieping.title'] ?? ''}
            onChange={e => set('verdieping.title', e.target.value)}
            placeholder="Titel van de verdieping (optioneel)"
            className={inputCls}
          />
          <RichEditor
            value={draft['verdieping'] ?? ''}
            onChange={v => set('verdieping', v)}
            placeholder="Verdiepende tekst, achtergrondinfo, extra Bijbelverwijzingen..."
            minHeight="120px"
          />
        </div>

        {/* Bronnen */}
        <div>
          <label className={labelCls}>Bronnen <span className="font-normal normal-case tracking-normal text-stone-300">(optioneel)</span></label>
          <div className="space-y-3">
            {bronnen.map((b, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 grid grid-cols-[1fr_auto_auto] gap-2">
                    <input
                      type="text"
                      value={b.title}
                      onChange={e => setBronnen(prev => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                      placeholder="Titel"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={b.author}
                      onChange={e => setBronnen(prev => prev.map((x, j) => j === i ? { ...x, author: e.target.value } : x))}
                      placeholder="Auteur"
                      className={`${inputCls} w-32`}
                    />
                    <input
                      type="text"
                      value={b.year}
                      onChange={e => setBronnen(prev => prev.map((x, j) => j === i ? { ...x, year: e.target.value } : x))}
                      placeholder="Jaar"
                      className={`${inputCls} w-20`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setBronnen(prev => prev.filter((_, j) => j !== i))}
                    className="shrink-0 w-7 h-7 rounded-full bg-red-50 text-red-400 text-sm flex items-center justify-center"
                  >×</button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setBronnen(prev => [...prev, { title: '', author: '', year: '' }])}
              className="w-full py-2 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 text-xs font-medium hover:border-stone-300 transition-colors"
            >
              + Bron toevoegen
            </button>
          </div>
        </div>

        {/* Sections (static chapters only) */}
        {chapter.sections.map(s => (
          <div key={s.id} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-4">
            <div>
              <label className={labelCls}>Sectietitel</label>
              <input type="text" value={draft[`s:${s.id}.title`] ?? ''} onChange={e => set(`s:${s.id}.title`, e.target.value)} className={inputCls} />
            </div>
            {s.intro !== undefined && (
              <div>
                <label className={labelCls}>Sectie-introductie</label>
                <RichEditor
                  value={draft[`s:${s.id}.intro`] ?? ''}
                  onChange={v => set(`s:${s.id}.intro`, v)}
                  placeholder="Toelichting bij sectie..."
                  minHeight="60px"
                />
              </div>
            )}
            {s.questions.map((q, qi) => {
              const hintKey = `s:${s.id}.q:${q.id}.hint`
              const hasStaticHint = q.hint !== undefined
              const hintExpanded = hasStaticHint || expandedHints.has(hintKey)
              return (
              <div key={q.id} className="pl-3 border-l-2 border-stone-100 space-y-2">
                <p className={labelCls}>Vraag {qi + 1}</p>
                <div>
                  <label className="block text-[10px] text-stone-400 mb-0.5">Vraagtekst</label>
                  <input type="text" value={draft[`s:${s.id}.q:${q.id}.text`] ?? ''} onChange={e => set(`s:${s.id}.q:${q.id}.text`, e.target.value)} className={inputCls} />
                </div>
                {hintExpanded ? (
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5">
                      Toelichting (grijs, kleiner)
                      {!hasStaticHint && (
                        <button type="button" onClick={() => setExpandedHints(prev => { const n = new Set(prev); n.delete(hintKey); return n })}
                          className="ml-2 text-red-300 hover:text-red-400">verwijderen</button>
                      )}
                    </label>
                    <input type="text" value={draft[hintKey] ?? ''} onChange={e => set(hintKey, e.target.value)} className={inputCls} placeholder="Denk aan..." />
                  </div>
                ) : (
                  <button type="button"
                    onClick={() => setExpandedHints(prev => new Set(prev).add(hintKey))}
                    className="text-[10px] text-stone-400 hover:text-stone-600 border border-dashed border-stone-200 rounded-lg px-2 py-1 transition-colors">
                    + Toelichting toevoegen
                  </button>
                )}
                {q.value !== undefined && (
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5">Readonly tekst</label>
                    <RichEditor
                      value={draft[`s:${s.id}.q:${q.id}.value`] ?? ''}
                      onChange={v => set(`s:${s.id}.q:${q.id}.value`, v)}
                      minHeight="60px"
                    />
                  </div>
                )}
              </div>
            )})}

            {/* Extra questions added by editors */}
            {(extraQuestions[s.id] ?? []).map((eq, idx) => (
              <div key={eq.id} className="pl-3 border-l-2 border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <p className={labelCls}>Extra vraag {idx + 1}</p>
                  <button type="button" onClick={() => removeExtraQuestion(s.id, idx)}
                    className="text-[10px] text-red-400 hover:text-red-500">verwijderen</button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-stone-400 mb-0.5">Vraagtekst</label>
                    <input type="text" value={eq.text}
                      onChange={e => updateExtraQuestion(s.id, idx, { text: e.target.value })}
                      placeholder="Vraag..." className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5">Type</label>
                    <select value={eq.type ?? 'text'}
                      onChange={e => updateExtraQuestion(s.id, idx, { type: e.target.value as ExtraQ['type'] })}
                      className="px-2 py-2 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
                      <option value="text">Tekst</option>
                      <option value="meerkeuze">Meerkeuze</option>
                      <option value="slider">Slider</option>
                    </select>
                  </div>
                </div>
                {eq.type === 'meerkeuze' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] text-stone-400 mb-0.5">Opties</label>
                    {(eq.options ?? []).map((opt, oi) => (
                      <div key={oi} className="flex gap-1">
                        <input value={opt} onChange={e => { const o = [...(eq.options ?? [])]; o[oi] = e.target.value; updateExtraQuestion(s.id, idx, { options: o }) }}
                          placeholder={`Optie ${oi + 1}`} className={inputCls} />
                        <button type="button" onClick={() => updateExtraQuestion(s.id, idx, { options: (eq.options ?? []).filter((_, i) => i !== oi) })}
                          className="w-7 h-7 rounded-full bg-red-50 text-red-400 text-sm flex items-center justify-center shrink-0">×</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => updateExtraQuestion(s.id, idx, { options: [...(eq.options ?? []), ''] })}
                      className="text-[10px] text-stone-400 border border-dashed border-stone-200 rounded-lg px-2 py-1 hover:text-stone-600">+ Optie toevoegen</button>
                  </div>
                )}
                {eq.type === 'slider' && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] text-stone-400 mb-0.5">Min</label>
                      <input type="number" value={eq.min ?? 1} onChange={e => updateExtraQuestion(s.id, idx, { min: parseInt(e.target.value) || 1 })} className={inputCls} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-stone-400 mb-0.5">Max</label>
                      <input type="number" value={eq.max ?? 10} onChange={e => updateExtraQuestion(s.id, idx, { max: parseInt(e.target.value) || 10 })} className={inputCls} />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] text-stone-400 mb-0.5">Toelichting (grijs, optioneel)</label>
                  <input type="text" value={eq.hint}
                    onChange={e => updateExtraQuestion(s.id, idx, { hint: e.target.value })}
                    placeholder="Denk aan..." className={inputCls} />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => addExtraQuestion(s.id)}
              className="w-full py-2 border-2 border-dashed border-amber-200 rounded-xl text-amber-500 text-xs font-medium hover:border-amber-300 transition-colors">
              + Vraag toevoegen
            </button>
          </div>
        ))}

        {/* Virtual sections added by editors */}
        {virtualSections.map((vs, vsIdx) => {
          const borderColor = { personal: 'border-stone-200', samen: 'border-indigo-200', reflection: 'border-stone-200', personal_man: 'border-sky-200', personal_vrouw: 'border-rose-200' }[vs.type] ?? 'border-stone-200'
          const bgColor = { personal: 'bg-white', samen: 'bg-indigo-50', reflection: 'bg-white', personal_man: 'bg-sky-50', personal_vrouw: 'bg-rose-50' }[vs.type] ?? 'bg-white'
          return (
            <div key={vs.id} className={`${bgColor} rounded-2xl border ${borderColor} p-4 space-y-4`}>
              <div className="flex items-center justify-between">
                <p className={labelCls}>Nieuwe sectie {vsIdx + 1}</p>
                <button type="button" onClick={() => removeVirtualSection(vs.id)}
                  className="text-[10px] text-red-400 hover:text-red-500">sectie verwijderen</button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={labelCls}>Sectietitel</label>
                  <input type="text" value={vs.title}
                    onChange={e => updateVirtualSection(vs.id, 'title', e.target.value)}
                    placeholder="Naam van de sectie..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={vs.type}
                    onChange={e => updateVirtualSection(vs.id, 'type', e.target.value)}
                    className={inputCls}>
                    <option value="samen">Samen</option>
                    <option value="personal">Persoonlijk</option>
                    <option value="reflection">Reflectie</option>
                    <option value="personal_man">Man</option>
                    <option value="personal_vrouw">Vrouw</option>
                  </select>
                </div>
              </div>
              {vs.questions.map((q, qi) => (
                <div key={q.id} className="pl-3 border-l-2 border-stone-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className={labelCls}>Vraag {qi + 1}</p>
                    <button type="button" onClick={() => removeVirtualQuestion(vs.id, qi)}
                      className="text-[10px] text-red-400 hover:text-red-500">verwijderen</button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] text-stone-400 mb-0.5">Vraagtekst</label>
                      <input type="text" value={q.text}
                        onChange={e => updateVirtualQuestion(vs.id, qi, { text: e.target.value })}
                        placeholder="Vraag..." className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 mb-0.5">Type</label>
                      <select value={q.type ?? 'text'}
                        onChange={e => updateVirtualQuestion(vs.id, qi, { type: e.target.value as ExtraQ['type'] })}
                        className="px-2 py-2 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300">
                        <option value="text">Tekst</option>
                        <option value="meerkeuze">Meerkeuze</option>
                        <option value="slider">Slider</option>
                      </select>
                    </div>
                  </div>
                  {q.type === 'meerkeuze' && (
                    <div className="space-y-1">
                      <label className="block text-[10px] text-stone-400 mb-0.5">Opties</label>
                      {(q.options ?? []).map((opt, oi) => (
                        <div key={oi} className="flex gap-1">
                          <input value={opt} onChange={e => { const o = [...(q.options ?? [])]; o[oi] = e.target.value; updateVirtualQuestion(vs.id, qi, { options: o }) }}
                            placeholder={`Optie ${oi + 1}`} className={inputCls} />
                          <button type="button" onClick={() => updateVirtualQuestion(vs.id, qi, { options: (q.options ?? []).filter((_, i) => i !== oi) })}
                            className="w-7 h-7 rounded-full bg-red-50 text-red-400 text-sm flex items-center justify-center shrink-0">×</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => updateVirtualQuestion(vs.id, qi, { options: [...(q.options ?? []), ''] })}
                        className="text-[10px] text-stone-400 border border-dashed border-stone-200 rounded-lg px-2 py-1 hover:text-stone-600">+ Optie toevoegen</button>
                    </div>
                  )}
                  {q.type === 'slider' && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] text-stone-400 mb-0.5">Min</label>
                        <input type="number" value={q.min ?? 1} onChange={e => updateVirtualQuestion(vs.id, qi, { min: parseInt(e.target.value) || 1 })} className={inputCls} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-stone-400 mb-0.5">Max</label>
                        <input type="number" value={q.max ?? 10} onChange={e => updateVirtualQuestion(vs.id, qi, { max: parseInt(e.target.value) || 10 })} className={inputCls} />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5">Toelichting (grijs, optioneel)</label>
                    <input type="text" value={q.hint}
                      onChange={e => updateVirtualQuestion(vs.id, qi, { hint: e.target.value })}
                      placeholder="Denk aan..." className={inputCls} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addVirtualQuestion(vs.id)}
                className="w-full py-2 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 text-xs font-medium hover:border-stone-300 transition-colors">
                + Vraag toevoegen
              </button>
            </div>
          )
        })}

        <button type="button" onClick={addVirtualSection}
          className="w-full py-3 border-2 border-dashed border-stone-300 rounded-2xl text-stone-500 text-sm font-semibold hover:border-stone-400 transition-colors">
          + Sectie toevoegen
        </button>

        {/* Subsections */}
        {chapter.subsections?.map(sub => (
          <div key={sub.id} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-4">
            <p className={labelCls}>Onderdeel {sub.number} — {sub.title}</p>
            {sub.sections.map(s => (
              <div key={s.id} className="pl-3 border-l-2 border-stone-100 space-y-2">
                <div>
                  <label className="block text-[10px] text-stone-400 mb-0.5">Sectietitel</label>
                  <input type="text" value={draft[`sub:${sub.id}.s:${s.id}.title`] ?? ''} onChange={e => set(`sub:${sub.id}.s:${s.id}.title`, e.target.value)} className={inputCls} />
                </div>
                {s.questions.map((q, qi) => (
                  <div key={q.id}>
                    <label className="block text-[10px] text-stone-400 mb-0.5">Vraag {qi + 1}</label>
                    <input type="text" value={draft[`sub:${sub.id}.s:${s.id}.q:${q.id}.text`] ?? ''} onChange={e => set(`sub:${sub.id}.s:${s.id}.q:${q.id}.text`, e.target.value)} className={inputCls} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}

        {/* Danger zone */}
        <div className="border border-red-100 rounded-2xl p-4">
          <p className={`${labelCls} text-red-300`}>Hoofdstuk verwijderen</p>
          {!confirmDelete ? (
            <button type="button" onClick={() => setConfirmDelete(true)}
              className="w-full py-2 text-sm text-red-400 border border-dashed border-red-200 rounded-xl hover:bg-red-50 transition-colors">
              Verwijder dit hoofdstuk
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-stone-600">Weet je zeker? Dit kan niet ongedaan gemaakt worden.</p>
              <div className="flex gap-2">
                <button type="button" onClick={deleteChapter} disabled={deleting}
                  className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                  {deleting ? 'Verwijderen...' : 'Ja, verwijderen'}
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 bg-stone-100 text-stone-600 rounded-xl text-sm">
                  Annuleren
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}
