'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { useEffect, useState, useCallback } from 'react'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export default function RichEditor({ value, onChange, placeholder, minHeight = '80px' }: Props) {
  const [, setTick] = useState(0)
  const forceUpdate = useCallback(() => setTick(t => t + 1), [])

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onTransaction: forceUpdate,
    editorProps: {
      attributes: {
        class: 'rich-editor-content focus:outline-none',
        style: `min-height: ${minHeight}; padding: 10px 12px;`,
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return null

  const btnBase = 'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors'
  const active = 'bg-stone-900 text-white border-stone-900'
  const inactive = 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'

  return (
    <>
      <style>{`
        .rich-editor-content p { margin: 0 0 0.5em; line-height: 1.6; font-size: 0.875rem; }
        .rich-editor-content p:last-child { margin-bottom: 0; }
        .rich-editor-content p:empty::after { content: '\\00a0'; }
        .rich-editor-content ul { margin: 0.25em 0 0.5em 1.25em; list-style: disc; }
        .rich-editor-content li { margin-bottom: 0.25em; font-size: 0.875rem; line-height: 1.5; }
        .rich-editor-content strong { font-weight: 700; }
        .rich-editor-content em { font-style: italic; }
        .rich-editor-content u { text-decoration: underline; }
      `}</style>
      <div className="border border-stone-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-amber-300">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-stone-100 bg-stone-50">
          <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
            className={`${btnBase} font-bold ${editor.isActive('bold') ? active : inactive}`}>B</button>
          <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
            className={`${btnBase} italic ${editor.isActive('italic') ? active : inactive}`}>I</button>
          <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }}
            className={`${btnBase} underline ${editor.isActive('underline') ? active : inactive}`}>U</button>
          <div className="w-px h-4 bg-stone-200 mx-1" />
          <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
            className={`${btnBase} ${editor.isActive('bulletList') ? active : inactive}`}>•</button>
        </div>
        {/* Editor */}
        <div className="relative">
          {editor.isEmpty && placeholder && (
            <p className="absolute top-2.5 left-3 text-stone-300 text-sm pointer-events-none select-none">{placeholder}</p>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  )
}
