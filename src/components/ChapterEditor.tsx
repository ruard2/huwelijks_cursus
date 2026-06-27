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
  onSaved: (updates: Record<string, string>) => void
  onClose: () => void
}

export default function ChapterEditor({ chapter, deelTitle, deelLetter, deelColor, overrides, onSaved, onClose }: Props) {
  const ck = useCallback((suffix: string) => `ch:${chapter.id}:${suffix}`, [chapter.id])
  const t = (key: string, fallback: string) => overrides[ck(key)] ?? fallback

  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {}
    d['title'] = t('title', String(chapter.title))
    if (chapter.verse) {
      d['verse.ref'] = t('verse.ref', chapter.verse.ref)
      d['verse.text'] = t('verse.text', chapter.verse.text)
      if (chapter.verse.pretext) d['verse.pretext'] = t('verse.pretext', chapter.verse.pretext)
    }
    d['verse2.ref'] = overrides[ck('verse2.ref')] ?? ''
    d['verse2.text'] = overrides[ck('verse2.text')] ?? ''
    if (chapter.intro) {
      const stored = overrides[ck('intro')]
      d['intro'] = stored ?? chapter.intro.split('\n\n').map((p, i) => overrides[ck(`intro.${i}`)] ?? p).join('\n\n')
    }
    chapter.sections.forEach(s => {
      d[`s:${s.id}.title`] = t(`s:${s.id}.title`, s.title)
      if (s.intro) d[`s:${s.id}.intro`] = t(`s:${s.id}.intro`, s.intro)
      s.questions.forEach(q => {
        d[`s:${s.id}.q:${q.id}.text`] = t(`s:${s.id}.q:${q.id}.text`, q.text)
        if (q.hint) d[`s:${s.id}.q:${q.id}.hint`] = t(`s:${s.id}.q:${q.id}.hint`, q.hint)
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

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(key: string, value: string) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  async function saveAll() {
    setSaving(true)
    const session = getSession()
    const entries = Object.entries(draft)
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
          <input type="text" value={draft['title'] ?? ''} onChange={e => set('title', e.target.value)} className={inputCls} />
        </div>

        {/* Verse */}
        {chapter.verse && (
          <div className="bg-amber-50 rounded-2xl p-4 space-y-3 border border-amber-200">
            <p className={labelCls} style={{ color: '#92400e' }}>Bijbeltekst</p>
            {chapter.verse.pretext !== undefined && (
              <div>
                <label className={labelCls}>Voortekst</label>
                <input type="text" value={draft['verse.pretext'] ?? ''} onChange={e => set('verse.pretext', e.target.value)} className={inputCls} />
              </div>
            )}
            <div>
              <label className={labelCls}>Referentie</label>
              <input type="text" value={draft['verse.ref'] ?? ''} onChange={e => set('verse.ref', e.target.value)} className={inputCls} />
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

        {/* Second verse (always editable, purely DB-driven) */}
        <div className="bg-amber-50 rounded-2xl p-4 space-y-3 border border-amber-200">
          <p className={labelCls} style={{ color: '#92400e' }}>Tweede bijbeltekst <span className="font-normal normal-case tracking-normal text-amber-500">(optioneel)</span></p>
          <div>
            <label className={labelCls}>Referentie</label>
            <input type="text" value={draft['verse2.ref'] ?? ''} onChange={e => set('verse2.ref', e.target.value)} className={inputCls} placeholder="bijv. Johannes 3:16" />
          </div>
          <div>
            <label className={labelCls}>Tekst</label>
            <RichEditor
              value={draft['verse2.text'] ?? ''}
              onChange={v => set('verse2.text', v)}
              placeholder="Bijbeltekst..."
              minHeight="60px"
            />
          </div>
        </div>

        {/* Intro */}
        {chapter.intro !== undefined && (
          <div>
            <label className={labelCls}>Introductie (Wat zien we hier?)</label>
            <RichEditor
              value={draft['intro'] ?? ''}
              onChange={v => set('intro', v)}
              placeholder="Introductietekst..."
              minHeight="120px"
            />
          </div>
        )}

        {/* Sections */}
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
            {s.questions.map((q, qi) => (
              <div key={q.id} className="pl-3 border-l-2 border-stone-100 space-y-2">
                <p className={labelCls}>Vraag {qi + 1}</p>
                <div>
                  <label className="block text-[10px] text-stone-400 mb-0.5">Vraagtekst</label>
                  <input type="text" value={draft[`s:${s.id}.q:${q.id}.text`] ?? ''} onChange={e => set(`s:${s.id}.q:${q.id}.text`, e.target.value)} className={inputCls} />
                </div>
                {q.hint !== undefined && (
                  <div>
                    <label className="block text-[10px] text-stone-400 mb-0.5">Toelichting (grijs)</label>
                    <input type="text" value={draft[`s:${s.id}.q:${q.id}.hint`] ?? ''} onChange={e => set(`s:${s.id}.q:${q.id}.hint`, e.target.value)} className={inputCls} />
                  </div>
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
            ))}
          </div>
        ))}

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

        <div className="h-8" />
      </div>
    </div>
  )
}
