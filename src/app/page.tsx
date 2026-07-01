'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { setSession, getSession } from '@/lib/session'

type Mode = 'choose' | 'solo' | 'create' | 'join' | 'register-begeleider' | 'begeleider-done'

function stripTitle(name: string) {
  return name.replace(/^(ds\.?|dr\.?|drs\.?|prof\.?|ir\.?|mr\.?)\s+/i, '').trim()
}

function BegeleiderSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function search(q: string) {
    onChange(q)
    if (timer.current) clearTimeout(timer.current)
    if (!q.trim()) { setSuggestions([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/begeleiders?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.begeleiders ?? [])
        setOpen(true)
      }
    }, 200)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => search(e.target.value)}
        onFocus={() => { if (value.trim()) setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Zoek op naam (bijv. Koeman)..."
        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map(s => (
            <button key={s.id} type="button"
              onMouseDown={() => { onChange(s.name); setOpen(false) }}
              className="w-full text-left px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 border-b border-stone-100 last:border-b-0">
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('choose')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [begeleiderName, setBegeleiderName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registeredBegeleider, setRegisteredBegeleider] = useState('')
  const [shareMsg, setShareMsg] = useState('')

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
      if (!res.ok) { setError(data.error); return }
      const bg = begeleiderName.trim() || 'Ruard Stolper'
      await fetch('/api/couples', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupleCode: data.coupleCode, begeleiderName: bg }),
      })
      setSession({ ...data, isSingle: false, begeleiderName: bg })
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
      if (!res.ok) { setError(data.error); return }
      const coupleRes = await fetch(`/api/couples?code=${data.coupleCode}`)
      const coupleData = coupleRes.ok ? await coupleRes.json() : {}
      setSession({ ...data, isSingle: false, begeleiderName: coupleData.couple?.begeleiderName ?? 'Ruard Stolper' })
      router.push('/intro')
    } catch { setError('Er ging iets mis. Probeer het opnieuw.') }
    finally { setLoading(false) }
  }

  async function handleRegisterBegeleider() {
    if (!name.trim()) return setError('Vul je naam in')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/begeleiders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Er ging iets mis'); return }
      setRegisteredBegeleider(name.trim())
      setShareMsg(`Hoi! Ik begeleide jullie bij de huwelijkscursus. Zoek bij het aanmelden naar: ${name.trim()}`)
      setMode('begeleider-done')
    } catch { setError('Er ging iets mis. Probeer het opnieuw.') }
    finally { setLoading(false) }
  }

  const inputCls = 'w-full px-4 py-3 border border-stone-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-stone-400'

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
            <button onClick={() => setMode('solo')}
              className="w-full text-left bg-white border border-stone-200 rounded-2xl p-5 active:scale-95 transition-transform">
              <p className="font-bold text-stone-900 text-base">Persoonlijke verkenning</p>
              <p className="text-stone-500 text-sm mt-1 leading-snug">Alleen doen, in eigen tempo.</p>
            </button>
            <button onClick={() => setMode('create')}
              className="w-full text-left bg-stone-900 text-white rounded-2xl p-5 active:scale-95 transition-transform">
              <p className="font-bold text-base">Samen als koppel starten</p>
              <p className="text-stone-300 text-sm mt-1 leading-snug">Maak een gedeelde ruimte aan — jullie zien elkaars antwoorden live.</p>
            </button>
            <button onClick={() => setMode('join')}
              className="w-full text-left bg-white border border-stone-200 rounded-2xl p-5 active:scale-95 transition-transform">
              <p className="font-bold text-stone-900 text-base">Deelnemen met koppelcode</p>
              <p className="text-stone-500 text-sm mt-1 leading-snug">Je partner heeft al een ruimte aangemaakt.</p>
            </button>
            <button onClick={() => { setMode('register-begeleider'); setName(''); setError('') }}
              className="w-full text-left bg-white border border-dashed border-stone-300 rounded-2xl p-4 active:scale-95 transition-transform">
              <p className="font-semibold text-stone-600 text-sm">Begeleider registreren</p>
              <p className="text-stone-400 text-xs mt-0.5">Zodat stellen jou kunnen koppelen als hun begeleider.</p>
            </button>
          </div>
        )}

        {mode === 'solo' && (
          <div className="space-y-4">
            <button onClick={back} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div className="bg-stone-100 rounded-2xl p-4">
              <p className="text-sm text-stone-600 leading-relaxed">Je werkt alleen. Gezamenlijke gespreksonderwerpen sla je over.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Jouw naam</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSolo()}
                placeholder="Bijv. Sarah" className={inputCls} autoFocus />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleSolo} disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform">
              {loading ? 'Bezig...' : 'Begin →'}
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <button onClick={back} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Jouw naam</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Bijv. Sarah" className={inputCls} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Begeleider</label>
              <BegeleiderSearch value={begeleiderName} onChange={setBegeleiderName} />
              <p className="text-xs text-stone-400 mt-1">Laat leeg voor standaard begeleider (Ruard Stolper)</p>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleCreate} disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform">
              {loading ? 'Bezig...' : 'Koppelcode aanmaken →'}
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <button onClick={back} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Koppelcode</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Bijv. TROUW-4821"
                className={`${inputCls} tracking-widest`} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Jouw naam</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="Bijv. Ruard" className={inputCls} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleJoin} disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform">
              {loading ? 'Bezig...' : 'Deelnemen →'}
            </button>
          </div>
        )}

        {mode === 'register-begeleider' && (
          <div className="space-y-4">
            <button onClick={back} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div className="bg-stone-100 rounded-2xl p-4">
              <p className="text-sm text-stone-600 leading-relaxed">
                Registreer je als begeleider zodat stellen jou kunnen vinden en koppelen als hun begeleider.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Jouw naam (zoals stellen je kennen)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegisterBegeleider()}
                placeholder="Bijv. Jan Koeman" className={inputCls} autoFocus />
              <p className="text-xs text-stone-400 mt-1">Tip: titelprefix (ds., dr.) wordt genegeerd bij zoeken.</p>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleRegisterBegeleider} disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform">
              {loading ? 'Bezig...' : 'Registreren →'}
            </button>
          </div>
        )}

        {mode === 'begeleider-done' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✓</div>
              <p className="font-bold text-stone-900 text-lg">{registeredBegeleider}</p>
              <p className="text-stone-500 text-sm mt-1">Je bent geregistreerd als begeleider</p>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Deel met stellen</p>
              <p className="text-sm text-stone-700 leading-relaxed">{shareMsg}</p>
            </div>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ text: shareMsg }).catch(() => {})
                } else {
                  navigator.clipboard.writeText(shareMsg).then(() => alert('Gekopieerd!')).catch(() => {})
                }
              }}
              className="w-full py-3 bg-stone-900 text-white rounded-2xl font-semibold text-sm active:scale-95 transition-transform">
              Deel ↗
            </button>
            <button onClick={back} className="w-full py-3 bg-stone-100 text-stone-600 rounded-2xl text-sm font-medium">
              Terug naar start
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
