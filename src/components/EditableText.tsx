'use client'

import { useState, useRef } from 'react'
import { getSession } from '@/lib/session'

interface Props {
  contentKey: string
  value: string
  tag?: 'p' | 'h1' | 'h2' | 'h3' | 'span'
  className?: string
  multiline?: boolean
  onSaved?: (key: string, value: string) => void
}

export default function EditableText({ contentKey, value, tag = 'p', className = '', multiline = true, onSaved }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  async function save() {
    if (draft === value) { setEditing(false); return }
    setSaving(true)
    const session = getSession()
    await fetch('/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-member-name': session?.memberName ?? '',
      },
      body: JSON.stringify({ key: contentKey, value: draft }),
    })
    setSaving(false)
    setEditing(false)
    onSaved?.(contentKey, draft)
  }

  if (editing) {
    return (
      <span className="block relative">
        {multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className={`${className} w-full bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none min-h-[60px]`}
            autoFocus
            onFocus={e => { const l = e.target.value.length; e.target.setSelectionRange(l, l) }}
          />
        ) : (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className={`${className} w-full bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400`}
            autoFocus
          />
        )}
        <span className="flex gap-2 mt-1">
          <button
            onClick={save}
            disabled={saving}
            className="text-xs bg-amber-500 text-white px-3 py-1 rounded-lg font-medium"
          >
            {saving ? '...' : 'Opslaan'}
          </button>
          <button
            onClick={() => { setDraft(value); setEditing(false) }}
            className="text-xs text-stone-400 px-2 py-1"
          >
            Annuleren
          </button>
        </span>
      </span>
    )
  }

  const Tag = tag
  return (
    <Tag className={`${className} group relative inline`}>
      {value}
      <button
        onClick={() => { setDraft(value); setEditing(true) }}
        className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-100 text-amber-600 hover:bg-amber-200 align-middle"
        title="Tekst bewerken"
        style={{ fontSize: 11 }}
      >
        ✏️
      </button>
    </Tag>
  )
}
