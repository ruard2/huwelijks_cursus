'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getDeel, getChapter } from '@/content'
import { isEditor } from '@/lib/roles'
import { renderContent } from '@/lib/renderContent'
import DeelEditor from '@/components/DeelEditor'

interface ProgressEntry {
  memberId: string
  memberName: string
  chapterId: string
  done: boolean
}

interface DynamicChapter {
  id: string
  deelId: string
  order: number
}

export default function DeelPage() {
  const router = useRouter()
  const params = useParams()
  const deelId = params.deelId as string
  const deel = getDeel(deelId)

  const [session, setSessionData] = useState<ReturnType<typeof getSession>>(null)
  const [progress, setProgress] = useState<ProgressEntry[]>([])
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [showEditor, setShowEditor] = useState(false)
  const [dynamicChapters, setDynamicChapters] = useState<DynamicChapter[]>([])
  const [chapterOverrides, setChapterOverrides] = useState<Record<string, string>>({})
  const [creating, setCreating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [hiddenChapters, setHiddenChapters] = useState<string[]>([])

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSessionData(s)
    fetch(`/api/progress?memberId=${s.memberId}`)
      .then(r => r.json())
      .then(data => setProgress(data.progress ?? []))
    fetch(`/api/content?prefix=deel:${deelId}:`)
      .then(r => r.json())
      .then(data => setOverrides(data.overrides ?? {}))
    fetch('/api/content?keys=app:hidden-chapters')
      .then(r => r.json())
      .then(data => { try { setHiddenChapters(JSON.parse(data.overrides?.['app:hidden-chapters'] ?? '[]')) } catch { /* ignore */ } })
    if (deel && deel.chapters.length > 0) {
      const chKeys = deel.chapters.flatMap(ch => [`ch:${ch.id}:verse.ref`, `ch:${ch.id}:title`]).join(',')
      fetch(`/api/content?keys=${encodeURIComponent(chKeys)}`)
        .then(r => r.json())
        .then(d => setChapterOverrides(prev => ({ ...prev, ...(d.overrides ?? {}) })))
    }
    fetchDynamicChapters()
  }, [router, deelId])

  async function fetchDynamicChapters() {
    const res = await fetch(`/api/chapters?deelId=${deelId}`)
    if (!res.ok) return
    const data = await res.json()
    const chapters: DynamicChapter[] = data.chapters ?? []
    setDynamicChapters(chapters)
    if (chapters.length > 0) {
      const titleKeys = chapters.flatMap((c: DynamicChapter) => [`ch:${c.id}:title`, `ch:${c.id}:verse.ref`]).join(',')
      const r2 = await fetch(`/api/content?keys=${encodeURIComponent(titleKeys)}`)
      if (r2.ok) {
        const d2 = await r2.json()
        setChapterOverrides(prev => ({ ...prev, ...(d2.overrides ?? {}) }))
      }
    }
  }

  async function createChapter() {
    if (!session) return
    setCreating(true)
    const res = await fetch('/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-member-name': session.memberName },
      body: JSON.stringify({ deelId }),
    })
    if (res.ok) {
      const data = await res.json()
      sessionStorage.setItem('hc_open_editor', data.chapter.id)
      router.push(`/chapter/${data.chapter.id}`)
    }
    setCreating(false)
  }

  async function deleteChapter(id: string) {
    if (!session) return
    await fetch('/api/chapters', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-member-name': session.memberName },
      body: JSON.stringify({ id }),
    })
    const newHidden = [...hiddenChapters, id]
    setHiddenChapters(newHidden)
    await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-member-name': session.memberName },
      body: JSON.stringify({ key: 'app:hidden-chapters', value: JSON.stringify(newHidden) }),
    })
    setDynamicChapters(prev => prev.filter(c => c.id !== id))
    setDeleteConfirm(null)
  }

  if (!deel) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-stone-400 text-sm">Blok niet gevonden</p>
    </div>
  )

  if (!session) return null

  const editor = isEditor(session.memberName)
  const ck = (suffix: string) => `deel:${deelId}:${suffix}`
  const t = (key: string, fallback: string) => overrides[ck(key)] ?? fallback
  const deelTitle = t('title', deel.title)
  const deelIntro = t('intro', deel.intro)

  function isChapterDone(chapterId: string, memberId: string) {
    return progress.some(p => p.chapterId === chapterId && p.memberId === memberId && p.done)
  }

  const dynChapterIds = new Set(dynamicChapters.map(dc => dc.id))
  const staticChapters = deel.chapters
    .filter(ch => !hiddenChapters.includes(ch.id) && !dynChapterIds.has(ch.id))
    .map((ch, idx) => ({
      id: ch.id,
      title: chapterOverrides[`ch:${ch.id}:title`] ?? ch.title,
      verse: chapterOverrides[`ch:${ch.id}:verse.ref`] ?? ch.verse?.ref,
      idx,
      isDynamic: false,
    }))
  const dynChapters = dynamicChapters.map((dc, i) => {
    const staticCh = getChapter(dc.id)?.chapter
    return {
      id: dc.id,
      title: chapterOverrides[`ch:${dc.id}:title`] ?? staticCh?.title ?? 'Nieuw hoofdstuk',
      verse: chapterOverrides[`ch:${dc.id}:verse.ref`] ?? staticCh?.verse?.ref,
      idx: deel.chapters.length + i,
      isDynamic: true,
    }
  })
  const savedChapterOrder: string[] = (() => {
    try { return JSON.parse(overrides[`deel:${deelId}:chapter-order`] ?? '[]') } catch { return [] }
  })()
  const unsortedChapters = [...staticChapters, ...dynChapters]
  const allChapters = savedChapterOrder.length > 0
    ? [...unsortedChapters].sort((a, b) => {
        const ai = savedChapterOrder.indexOf(a.id)
        const bi = savedChapterOrder.indexOf(b.id)
        if (ai === -1 && bi === -1) return 0
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      })
    : unsortedChapters

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-5 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-stone-400 p-1 -ml-1 text-sm">←</button>
        <div className="min-w-0 flex-1">
          {deel.letter && (
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: deel.color }}>
              Deel {deel.letter}
            </p>
          )}
          <p className="text-sm font-bold text-stone-900 leading-tight truncate">{deelTitle}</p>
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

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Intro card */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5 mb-6">
          {renderContent(deelIntro, 'text-stone-600 text-sm leading-relaxed')}
        </div>

        {/* Chapter list */}
        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mb-3 px-1">
          Hoofdstukken in dit blok
        </p>
        <div className="space-y-2">
          {allChapters.map((ch, displayIdx) => {
            const myDone = isChapterDone(ch.id, session.memberId)
            const partnerEntry = progress.find(
              p => p.chapterId === ch.id && p.memberId !== session.memberId && p.done
            )
            return (
              <div key={ch.id} className="relative group">
                <button
                  onClick={() => router.push(`/chapter/${ch.id}`)}
                  className="w-full text-left bg-white rounded-2xl border border-stone-100 px-5 py-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
                >
                  <span
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={myDone
                      ? { backgroundColor: deel.color, color: 'white' }
                      : { backgroundColor: '#f5f5f4', color: '#a8a29e' }}
                  >
                    {myDone ? '✓' : displayIdx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 leading-snug">{ch.title}</p>
                    {ch.verse && (
                      <p className="text-xs text-stone-400 mt-0.5 italic truncate">{ch.verse}</p>
                    )}
                    {partnerEntry && (
                      <p className="text-xs mt-1" style={{ color: deel.color }}>
                        ✓ {partnerEntry.memberName.split(' ')[0]} klaar
                      </p>
                    )}
                  </div>
                  <span className="text-stone-300 shrink-0">›</span>
                </button>
                {editor && ch.isDynamic && (
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteConfirm(ch.id) }}
                    className="absolute right-12 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-red-50 text-red-400 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Verwijder hoofdstuk"
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}

          {/* Add chapter button for editors */}
          {editor && (
            <button
              onClick={createChapter}
              disabled={creating}
              className="w-full text-left bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl px-5 py-4 flex items-center gap-3 text-stone-400 hover:border-stone-300 hover:text-stone-500 transition-colors disabled:opacity-50"
            >
              <span className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-400 text-lg font-light shrink-0">+</span>
              <span className="text-sm font-medium">{creating ? 'Aanmaken...' : 'Voeg hoofdstuk toe'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-stone-900 text-lg mb-2">Hoofdstuk verwijderen</h2>
            <p className="text-stone-500 text-sm mb-5">
              Weet je zeker dat je dit hoofdstuk wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => deleteChapter(deleteConfirm)}
                className="w-full py-3 bg-red-500 text-white rounded-2xl font-semibold"
              >
                Ja, verwijderen
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="w-full py-3 bg-stone-100 text-stone-700 rounded-2xl font-medium"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditor && (
        <DeelEditor
          deel={deel}
          overrides={overrides}
          chapters={allChapters.map(ch => ({ id: ch.id, title: ch.title, isDynamic: ch.isDynamic }))}
          onSaved={updates => setOverrides(prev => ({ ...prev, ...updates }))}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}
