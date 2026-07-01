'use client'

import { useState } from 'react'

export const TAKEAWAY_QS = [
  { id: 'takeaway.learned', text: 'Wat heb je in dit hoofdstuk geleerd over jezelf, je relatie of God?' },
  { id: 'takeaway.remember', text: 'Wat wil je niet vergeten uit dit hoofdstuk?' },
  { id: 'takeaway.concrete', text: 'Wat wil je concreet meenemen in jullie huwelijk?' },
  { id: 'takeaway.promise', text: 'Is er iets wat je aan je man/vrouw wilt beloven of meegeven?' },
] as const

interface AnswerEntry { value: string }
interface AnswerPair { mine?: AnswerEntry; partner?: AnswerEntry }

interface Props {
  answers: Record<string, AnswerPair>
  onChange: (questionId: string, value: string) => void
}

export default function TakeawayBlock({ answers, onChange }: Props) {
  const [pickerFor, setPickerFor] = useState<string | null>(null)

  const takeawayIds = new Set<string>(TAKEAWAY_QS.map(q => q.id))
  const pickable = Object.entries(answers)
    .filter(([id, a]) => !takeawayIds.has(id) && id !== 'personal:done' && a.mine?.value)
    .map(([, a]) => a.mine!.value)
    .filter((v, i, arr) => arr.indexOf(v) === i) // dedup

  return (
    <div className="mt-6 rounded-2xl border-2 border-stone-900 bg-white overflow-hidden">
      <div className="bg-stone-900 px-4 py-3">
        <p className="text-white font-bold text-sm">Wat neem je mee?</p>
        <p className="text-stone-400 text-xs mt-0.5 leading-snug">
          Neem even de tijd om dit persoonlijk in te vullen. Je antwoorden worden later meegenomen naar Deel H: Tussenstand en beloften. Daar komen jullie inzichten per hoofdstuk bij elkaar.
        </p>
      </div>
      <div className="p-4 space-y-4">
        {TAKEAWAY_QS.map(q => {
          const val = answers[q.id]?.mine?.value ?? ''
          const isOpen = pickerFor === q.id
          return (
            <div key={q.id}>
              <p className="text-sm font-medium text-stone-700 mb-1.5">{q.text}</p>
              <div className="relative">
                <textarea
                  value={val}
                  onChange={e => onChange(q.id, e.target.value)}
                  placeholder="Jouw antwoord..."
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[72px] resize-none"
                  style={{ paddingRight: pickable.length ? '2.5rem' : undefined }}
                />
                {pickable.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPickerFor(isOpen ? null : q.id)}
                    title="Kies uit eerdere antwoorden in dit hoofdstuk"
                    className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isOpen ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
                  >
                    ⊕
                  </button>
                )}
              </div>
              {isOpen && (
                <div className="mt-1 border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 px-3 pt-2 pb-1">
                    Klik om over te nemen
                  </p>
                  <div className="max-h-44 overflow-y-auto divide-y divide-stone-100">
                    {pickable.map((v, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { onChange(q.id, v); setPickerFor(null) }}
                        className="w-full text-left px-3 py-2.5 text-xs text-stone-700 hover:bg-white transition-colors leading-relaxed"
                      >
                        {v.length > 140 ? v.slice(0, 140) + '...' : v}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
