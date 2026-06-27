'use client'

import { useState } from 'react'
import { getSession, setSession, clearSession } from '@/lib/session'

interface Props {
  onClose: () => void
  onNameChanged: (name: string) => void
  onLogout: () => void
}

export default function ProfileMenu({ onClose, onNameChanged, onLogout }: Props) {
  const session = getSession()
  const [view, setView] = useState<'menu' | 'name' | 'reset' | 'confirm-logout'>('menu')
  const [newName, setNewName] = useState(session?.memberName ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function saveName() {
    if (!newName.trim()) return setError('Vul een naam in')
    setSaving(true)
    setError('')
    const s = getSession()
    if (!s) return
    const res = await fetch('/api/member', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-member-id': s.memberId },
      body: JSON.stringify({ name: newName }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setSession({ ...s, memberName: data.memberName })
    onNameChanged(data.memberName)
    setSaving(false)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 max-w-lg mx-auto shadow-xl">
        {/* Handle */}
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />

        {view === 'menu' && (
          <>
            <div className="mb-5">
              <p className="text-xs text-stone-400 uppercase tracking-wider">Ingelogd als</p>
              <p className="text-lg font-bold text-stone-900 mt-0.5">{session?.memberName}</p>
              {!session?.isSingle && (
                <p className="text-xs text-stone-400 mt-0.5 font-mono tracking-widest">{session?.coupleCode}</p>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setView('name')}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-stone-50 rounded-2xl text-left active:bg-stone-100 transition-colors"
              >
                <span className="text-xl">✏️</span>
                <div>
                  <p className="text-sm font-semibold text-stone-900">Naam wijzigen</p>
                  <p className="text-xs text-stone-400">Pas je weergavenaam aan</p>
                </div>
              </button>

              <button
                onClick={() => setView('reset')}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-stone-50 rounded-2xl text-left active:bg-stone-100 transition-colors"
              >
                <span className="text-xl">🔄</span>
                <div>
                  <p className="text-sm font-semibold text-stone-900">Opgeslagen antwoorden</p>
                  <p className="text-xs text-stone-400">Bekijk of wis jouw voortgang</p>
                </div>
              </button>

              <button
                onClick={() => setView('confirm-logout')}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-red-50 rounded-2xl text-left active:bg-red-100 transition-colors"
              >
                <span className="text-xl">🚪</span>
                <div>
                  <p className="text-sm font-semibold text-red-700">Uitloggen</p>
                  <p className="text-xs text-red-400">Sessie beëindigen op dit apparaat</p>
                </div>
              </button>
            </div>
          </>
        )}

        {view === 'name' && (
          <>
            <button onClick={() => setView('menu')} className="text-stone-400 text-sm mb-4 flex items-center gap-1">← Terug</button>
            <h2 className="font-bold text-stone-900 text-lg mb-4">Naam wijzigen</h2>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-stone-400 mb-2"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button
              onClick={saveName}
              disabled={saving}
              className="w-full py-3.5 bg-stone-900 text-white rounded-2xl font-semibold disabled:opacity-50"
            >
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </>
        )}

        {view === 'reset' && (
          <>
            <button onClick={() => setView('menu')} className="text-stone-400 text-sm mb-4 flex items-center gap-1">← Terug</button>
            <h2 className="font-bold text-stone-900 text-lg mb-2">Opgeslagen antwoorden</h2>
            <p className="text-stone-500 text-sm mb-6 leading-relaxed">
              Al jouw antwoorden zijn opgeslagen in de cloud en gekoppeld aan jouw naam en koppelcode. Ze blijven bewaard als je uitlogt en opnieuw inlogt met dezelfde naam.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Wil je antwoorden wissen?</strong> Dat is nu nog niet mogelijk via de app. Neem contact op met de beheerder.
              </p>
            </div>
            <button onClick={onClose} className="w-full py-3 bg-stone-100 text-stone-700 rounded-2xl font-medium text-sm">
              Sluiten
            </button>
          </>
        )}

        {view === 'confirm-logout' && (
          <>
            <h2 className="font-bold text-stone-900 text-lg mb-2">Uitloggen?</h2>
            <p className="text-stone-500 text-sm mb-6 leading-relaxed">
              Je sessie wordt beëindigd op dit apparaat. Jouw antwoorden en voortgang blijven bewaard — je kunt opnieuw inloggen met dezelfde naam en koppelcode.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => { clearSession(); onLogout() }}
                className="w-full py-3.5 bg-red-600 text-white rounded-2xl font-semibold"
              >
                Ja, uitloggen
              </button>
              <button onClick={onClose} className="w-full py-3 text-stone-400 text-sm">
                Annuleren
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
