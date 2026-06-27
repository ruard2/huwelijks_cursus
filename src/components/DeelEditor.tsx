'use client'

import { useState } from 'react'
import { getSession } from '@/lib/session'
import type { Deel } from '@/content'
import RichEditor from './RichEditor'

interface Props {
  deel: Deel
  overrides: Record<string, string>
  onSaved: (updates: Record<string, string>) => void
  onClose: () => void
}

export default function DeelEditor({ deel, overrides, onSaved, onClose }: Props) {
  const ck = (suffix: string) => `deel:${deel.id}:${suffix}`
  const t = (key: string, fallback: string) => overrides[ck(key)] ?? fallback

  const [title, setTitle] = useState(t('title', deel.title))
  const [intro, setIntro] = useState(t('intro', deel.intro))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveAll() {
    setSaving(true)
    const session = getSession()
    const entries: [string, string][] = [
      [ck('title'), title],
      [ck('intro'), intro],
    ]
    await Promise.all(entries.map(([key, value]) =>
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-member-name': session?.memberName ?? '' },
        body: JSON.stringify({ key, value }),
      })
    ))
    const updates: Record<string, string> = {}
    for (const [key, value] of entries) updates[key] = value
    onSaved(updates)
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1000)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-xl">
        {/* Handle */}
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-100 shrink-0">
          <button onClick={onClose} className="text-stone-400 text-sm">✕</button>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: deel.color }}>
              {deel.letter ? `Deel ${deel.letter}` : 'Blok'} bewerken
            </p>
          </div>
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            {saved ? '✓ Opgeslagen' : saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Introductietekst</label>
            <RichEditor
              value={intro}
              onChange={setIntro}
              placeholder="Introductietekst voor dit blok..."
              minHeight="140px"
            />
          </div>
          <div className="h-4" />
        </div>
      </div>
    </>
  )
}
