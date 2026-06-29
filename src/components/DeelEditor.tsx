'use client'

import { useState, useRef } from 'react'
import { getSession } from '@/lib/session'
import { DELEN } from '@/content'
import type { Deel } from '@/content'
import RichEditor from './RichEditor'

interface ChapterItem { id: string; title: string; isDynamic: boolean }

interface Props {
  deel: Deel
  overrides: Record<string, string>
  chapters?: ChapterItem[]
  onSaved: (updates: Record<string, string>) => void
  onClose: () => void
}

export default function DeelEditor({ deel, overrides, chapters, onSaved, onClose }: Props) {
  const ck = (suffix: string) => `deel:${deel.id}:${suffix}`
  const t = (key: string, fallback: string) => overrides[ck(key)] ?? fallback

  const [title, setTitle] = useState(t('title', deel.title))
  const [intro, setIntro] = useState(t('intro', deel.intro))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [localOrder, setLocalOrder] = useState<ChapterItem[]>(() => {
    if (!chapters || chapters.length === 0) return []
    try {
      const savedOrder: string[] = JSON.parse(overrides[ck('chapter-order')] ?? '[]')
      if (savedOrder.length === 0) return chapters
      return [...chapters].sort((a, b) => {
        const ai = savedOrder.indexOf(a.id)
        const bi = savedOrder.indexOf(b.id)
        if (ai === -1 && bi === -1) return 0
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      })
    } catch { return chapters }
  })

  const dragIdx = useRef<number | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)

  const otherDelen = DELEN.filter(d => d.id !== deel.id)

  async function moveChapter(chapterId: string, targetDeelId: string) {
    const session = getSession()
    await fetch('/api/chapters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-member-name': session?.memberName ?? '' },
      body: JSON.stringify({ id: chapterId, deelId: targetDeelId }),
    })
    setLocalOrder(prev => prev.filter(c => c.id !== chapterId))
    setMovingId(null)
  }

  async function saveAll() {
    setSaving(true)
    const session = getSession()
    const entries: [string, string][] = [
      [ck('title'), title],
      [ck('intro'), intro],
      [ck('chapter-order'), JSON.stringify(localOrder.map(c => c.id))],
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
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-100 shrink-0">
          <button onClick={onClose} className="text-stone-400 text-sm">✕</button>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: deel.color }}>
              {deel.letter ? `Deel ${deel.letter}` : 'Blok'} bewerken
            </p>
          </div>
          <button onClick={saveAll} disabled={saving}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50">
            {saved ? '✓ Opgeslagen' : saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Titel</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Introductietekst</label>
            <RichEditor value={intro} onChange={setIntro} placeholder="Introductietekst voor dit blok..." minHeight="140px" />
          </div>

          {localOrder.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Volgorde hoofdstukken</label>
              <div className="space-y-1">
                {localOrder.map((ch, idx) => (
                  <div key={ch.id}>
                    <div
                      draggable
                      onDragStart={() => { dragIdx.current = idx }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => {
                        if (dragIdx.current === null || dragIdx.current === idx) return
                        const items = [...localOrder]
                        const [item] = items.splice(dragIdx.current, 1)
                        items.splice(idx, 0, item)
                        setLocalOrder(items)
                        dragIdx.current = null
                      }}
                      onDragEnd={() => { dragIdx.current = null }}
                      className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 cursor-grab active:cursor-grabbing active:bg-amber-50 active:border-amber-200 transition-colors"
                    >
                      <span className="text-stone-300 select-none text-base leading-none">⠿</span>
                      <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-500 text-[10px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                      <span className="text-sm text-stone-700 truncate flex-1">{ch.title}</span>
                      {ch.isDynamic && (
                        <button type="button"
                          onClick={() => setMovingId(movingId === ch.id ? null : ch.id)}
                          className="shrink-0 text-[10px] text-stone-400 hover:text-indigo-600 border border-stone-200 rounded-lg px-2 py-0.5 transition-colors">
                          → verplaats
                        </button>
                      )}
                    </div>

                    {movingId === ch.id && (
                      <div className="mt-1 ml-9 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                        <p className="text-[10px] text-indigo-500 font-semibold uppercase tracking-widest mb-2">Verplaats naar blok</p>
                        <div className="space-y-1">
                          {otherDelen.map(d => (
                            <button key={d.id} type="button"
                              onClick={() => moveChapter(ch.id, d.id)}
                              className="w-full text-left px-3 py-2 bg-white border border-indigo-100 rounded-lg text-sm text-stone-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors">
                              {d.letter ? `Deel ${d.letter} — ` : ''}{d.title}
                            </button>
                          ))}
                        </div>
                        <button type="button" onClick={() => setMovingId(null)}
                          className="mt-2 text-[10px] text-stone-400">Annuleer</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>
    </>
  )
}
