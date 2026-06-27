'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { useEffect } from 'react'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export default function RichEditor({ value, onChange, placeholder, minHeight = '80px' }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
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
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-amber-300">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-stone-100 bg-stone-50">
        <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
          className={`${btnBase} ${editor.isActive('bold') ? active : inactive}`}>B</button>
        <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
          className={`${btnBase} italic ${editor.isActive('italic') ? active : inactive}`}>I</button>
        <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }}
          className={`${btnBase} underline ${editor.isActive('underline') ? active : inactive}`}>U</button>
        <div className="w-px h-4 bg-stone-200 mx-1" />
        <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().setParagraph().run() }}
          className={`${btnBase} ${editor.isActive('paragraph') && !editor.isActive('bulletList') ? active : inactive}`}>¶</button>
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
  )
}
