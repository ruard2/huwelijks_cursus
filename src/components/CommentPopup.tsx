'use client'

import { useState } from 'react'
import { getSession } from '@/lib/session'

interface Props {
  chapterId: string
  chapterTitle: string
}

export default function CommentPopup({ chapterId, chapterTitle }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function send() {
    if (!text.trim()) return
    setSending(true)
    const session = getSession()
    await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-member-id': session?.memberId ?? '',
      },
      body: JSON.stringify({ chapterId, text }),
    })
    setSending(false)
    setSent(true)
    setText('')
    setTimeout(() => { setSent(false); setOpen(false) }, 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors py-1"
        title="Reactie sturen naar beheerder"
      >
        <span className="text-base">💬</span>
        <span>Opmerking voor beheerder</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <h3 className="font-bold text-stone-900 text-base mb-1">Opmerking sturen</h3>
            <p className="text-xs text-stone-400 mb-4">Over: <span className="text-stone-600">{chapterTitle}</span></p>

            {sent ? (
              <div className="text-center py-4">
                <p className="text-green-600 font-medium">✓ Verstuurd!</p>
              </div>
            ) : (
              <>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Typ je opmerking, vraag of correctie..."
                  className="w-full border border-stone-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 min-h-[100px] resize-none"
                  autoFocus
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={send}
                    disabled={sending || !text.trim()}
                    className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-semibold text-sm disabled:opacity-40"
                  >
                    {sending ? 'Bezig...' : 'Versturen'}
                  </button>
                  <button
                    onClick={() => { setOpen(false); setText('') }}
                    className="px-4 py-3 bg-stone-100 text-stone-600 rounded-xl text-sm font-medium"
                  >
                    Annuleren
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
