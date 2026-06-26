'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setSession, getSession } from '@/lib/session'

type Mode = 'choose' | 'solo' | 'create' | 'join'

export default function LandingPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('choose')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const session = getSession()
    if (session) router.replace('/home')
  }, [router])

  function back() { setMode('choose'); setError('') }

  async function handleSolo() {
    if (!name.trim()) return setError('Vul je naam in')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/couple/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error)
      setSession({ ...data, isSingle: true })
      router.push('/intro')
    } catch { setError('Er ging iets mis. Probeer het opnieuw.') }
    finally { setLoading(false) }
  }

  async function handleCreate() {
    if (!name.trim()) return setError('Vul je naam in')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/couple/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error)
      setSession({ ...data, isSingle: false })
      router.push('/intro')
    } catch { setError('Er ging iets mis. Probeer het opnieuw.') }
    finally { setLoading(false) }
  }

  async function handleJoin() {
    if (!name.trim() || !code.trim()) return setError('Vul naam en code in')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/couple/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error)
      setSession({ ...data, isSingle: false })
      router.push('/intro')
    } catch { setError('Er ging iets mis. Probeer het opnieuw.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-stone-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">💍</div>
          <h1 className="text-2xl font-bold text-stone-900">Huwelijkscursus</h1>
          <p className="text-stone-500 text-sm mt-2">Ontdek wat God bedoelt met liefde en trouw</p>
        </div>

        {mode === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('solo')}
              className="w-full text-left bg-white border border-stone-200 rounded-2xl p-5 active:scale-95 transition-transform"
            >
              <p className="font-bold text-stone-900 text-base">Persoonlijke verkenning</p>
              <p className="text-stone-500 text-sm mt-1 leading-snug">Alleen doen, in eigen tempo. Ontdek wat jij meebrengt in een relatie.</p>
            </button>
            <button
              onClick={() => setMode('create')}
              className="w-full text-left bg-stone-900 text-white rounded-2xl p-5 active:scale-95 transition-transform"
            >
              <p className="font-bold text-base">Samen als koppel starten</p>
              <p className="text-stone-300 text-sm mt-1 leading-snug">Maak een gedeelde ruimte aan — jullie zien elkaars antwoorden live.</p>
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full text-left bg-white border border-stone-200 rounded-2xl p-5 active:scale-95 transition-transform"
            >
              <p className="font-bold text-stone-900 text-base">Deelnemen met koppelcode</p>
              <p className="text-stone-500 text-sm mt-1 leading-snug">Je partner heeft al een ruimte aangemaakt.</p>
            </button>
          </div>
        )}

        {mode === 'solo' && (
          <div className="space-y-4">
            <button onClick={back} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div className="bg-stone-100 rounded-2xl p-4">
              <p className="text-sm text-stone-600 leading-relaxed">Je werkt alleen. De persoonlijke reflectievragen zijn zichtbaar — gezamenlijke gespreksonderwerpen sla je over.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Jouw naam</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSolo()}
                placeholder="Bijv. Sarah"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleSolo}
              disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform"
            >
              {loading ? 'Bezig...' : 'Begin →'}
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <button onClick={back} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Jouw naam</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Bijv. Sarah"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform"
            >
              {loading ? 'Bezig...' : 'Koppelcode aanmaken →'}
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <button onClick={back} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Koppelcode</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Bijv. TROUW-4821"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 tracking-widest"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Jouw naam</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="Bijv. Ruard"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform"
            >
              {loading ? 'Bezig...' : 'Deelnemen →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
