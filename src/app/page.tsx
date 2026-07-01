'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { setSession, getSession } from '@/lib/session'
import type { Session } from '@/lib/session'

type Mode =
  | 'choose'
  | 'solo' | 'create' | 'join' | 'join-pin'
  | 'set-pin'
  | 'forgot-code' | 'forgot-code-sent'
  | 'forgot-pin' | 'pin-reset-sent' | 'reset-pin'
  | 'register-begeleider' | 'begeleider-done'

function stripTitle(name: string) {
  return name.replace(/^(ds\.?|dr\.?|drs\.?|prof\.?|ir\.?|mr\.?)\s+/i, '').trim()
}

function PinInput({ value, onChange, placeholder = '• • • •', autoFocus = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean
}) {
  return (
    <input
      type="password"
      inputMode="numeric"
      maxLength={8}
      value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full px-4 py-3 border border-stone-200 rounded-xl text-base text-center tracking-[0.5em] bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
    />
  )
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
      if (res.ok) { const data = await res.json(); setSuggestions(data.begeleiders ?? []); setOpen(true) }
    }, 200)
  }

  return (
    <div className="relative">
      <input type="text" value={value} onChange={e => search(e.target.value)}
        onFocus={() => { if (value.trim()) setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Zoek op naam (bijv. Koeman)..."
        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-stone-400" />
      {open && suggestions.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map(s => (
            <button key={s.id} type="button" onMouseDown={() => { onChange(s.name); setOpen(false) }}
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
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [begeleiderName, setBegeleiderName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState('')
  const [registeredBegeleider, setRegisteredBegeleider] = useState('')
  const [shareMsg, setShareMsg] = useState('')
  const [pendingSession, setPendingSession] = useState<Partial<Session> & { coupleCode: string } | null>(null)

  useEffect(() => {
    if (getSession()) router.replace('/home')
  }, [router])

  function back() { setMode('choose'); setError(''); setPin(''); setNewPin(''); setConfirmPin('') }
  const inputCls = 'w-full px-4 py-3 border border-stone-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-stone-400'

  async function checkIsBegeleider(memberName: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/begeleiders?exact=${encodeURIComponent(memberName)}`)
      return res.ok && (await res.json()).isBegeleider === true
    } catch { return false }
  }

  function finishLogin(data: { coupleId: string; coupleCode: string; memberId: string; memberName: string; hasPin?: boolean; isSingle?: boolean }, isBegeleider: boolean, bg: string) {
    setSession({
      memberId: data.memberId,
      memberName: data.memberName,
      coupleId: data.coupleId,
      coupleCode: data.coupleCode,
      isSingle: data.isSingle ?? false,
      begeleiderName: bg,
      isBegeleider,
    })
    router.push('/intro')
  }

  // ── SOLO ──────────────────────────────────────────────────────────────
  async function handleSolo() {
    if (!name.trim()) return setError('Vul je naam in')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/couple/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error)
      setPendingSession({ ...data, isSingle: true, begeleiderName: 'Ruard Stolper' })
      setPin(''); setNewPin(''); setConfirmPin('')
      setMode('set-pin')
    } catch { setError('Er ging iets mis. Probeer het opnieuw.') }
    finally { setLoading(false) }
  }

  // ── CREATE ────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!name.trim()) return setError('Vul je naam in')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/couple/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      const bg = begeleiderName.trim() || 'Ruard Stolper'
      await fetch('/api/couples', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupleCode: data.coupleCode, begeleiderName: bg }),
      })
      setPendingSession({ ...data, isSingle: false, begeleiderName: bg })
      setPin(''); setNewPin(''); setConfirmPin('')
      setMode('set-pin')
    } catch { setError('Er ging iets mis. Probeer het opnieuw.') }
    finally { setLoading(false) }
  }

  // ── JOIN ──────────────────────────────────────────────────────────────
  async function handleJoin(withPin?: string) {
    if (!name.trim() || !code.trim()) return setError('Vul naam en code in')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/couple/join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code, pin: withPin }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      if (data.pinRequired) {
        setPin(''); setMode('join-pin'); return
      }

      const [coupleData, isBegeleider] = await Promise.all([
        fetch(`/api/couples?code=${data.coupleCode}`).then(r => r.ok ? r.json() as Promise<{ couple?: { begeleiderName?: string } }> : Promise.resolve({})),
        checkIsBegeleider(name.trim()),
      ])
      const bg = (coupleData as { couple?: { begeleiderName?: string } }).couple?.begeleiderName ?? 'Ruard Stolper'

      if (!data.hasPin) {
        // New member or member without PIN — offer set-pin
        setPendingSession({ ...data, isSingle: false, begeleiderName: bg, isBegeleider })
        setPin(''); setNewPin(''); setConfirmPin('')
        setMode('set-pin')
      } else {
        finishLogin(data, isBegeleider, bg)
      }
    } catch { setError('Er ging iets mis. Probeer het opnieuw.') }
    finally { setLoading(false) }
  }

  // ── SET PIN (after create/join) ───────────────────────────────────────
  async function handleSetPin(skip = false) {
    if (!pendingSession) return
    if (!skip) {
      if (!newPin) return setError('Voer een PIN in')
      if (newPin !== confirmPin) return setError('PINs komen niet overeen')
      if (newPin.length < 4) return setError('PIN moet minimaal 4 cijfers zijn')
    }

    setLoading(true); setError('')
    try {
      if (!skip && newPin && pendingSession.memberId) {
        await fetch('/api/member/pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-member-id': pendingSession.memberId },
          body: JSON.stringify({ newPin }),
        })
      }
      const isBegeleider = pendingSession.isBegeleider ?? await checkIsBegeleider(pendingSession.memberName ?? '')
      finishLogin(
        { coupleId: pendingSession.coupleId!, coupleCode: pendingSession.coupleCode, memberId: pendingSession.memberId!, memberName: pendingSession.memberName!, hasPin: !skip && !!newPin },
        isBegeleider,
        pendingSession.begeleiderName ?? 'Ruard Stolper',
      )
    } catch { setError('Er ging iets mis.') }
    finally { setLoading(false) }
  }

  function copyCode() {
    if (!pendingSession?.coupleCode) return
    navigator.clipboard.writeText(pendingSession.coupleCode).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // ── FORGOT CODE ───────────────────────────────────────────────────────
  async function handleForgotCode() {
    if (!email.trim()) return setError('Vul je e-mailadres in')
    setLoading(true); setError('')
    try {
      await fetch('/api/auth/forgot-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setMode('forgot-code-sent')
    } catch { setError('Er ging iets mis.') }
    finally { setLoading(false) }
  }

  // ── FORGOT PIN ────────────────────────────────────────────────────────
  async function handleForgotPin() {
    if (!code.trim() || !name.trim()) return setError('Vul koppelcode en naam in')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/forgot-pin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase(), name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setMaskedEmail(data.email ?? '')
      setResetToken('')
      setNewPin('')
      setConfirmPin('')
      setMode('reset-pin')
    } catch { setError('Er ging iets mis.') }
    finally { setLoading(false) }
  }

  // ── RESET PIN ─────────────────────────────────────────────────────────
  async function handleResetPin() {
    if (!resetToken.trim()) return setError('Vul de 6-cijferige code in')
    if (!newPin || newPin.length < 4) return setError('PIN moet minimaal 4 cijfers zijn')
    if (newPin !== confirmPin) return setError('PINs komen niet overeen')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/reset-pin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase(), name, token: resetToken, newPin }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      const isBegeleider = await checkIsBegeleider(name.trim())
      const coupleData = await fetch(`/api/couples?code=${data.coupleCode}`).then(r => r.ok ? r.json() as Promise<{ couple?: { begeleiderName?: string } }> : Promise.resolve({}))
      const bg = (coupleData as { couple?: { begeleiderName?: string } }).couple?.begeleiderName ?? 'Ruard Stolper'
      finishLogin(data, isBegeleider, bg)
    } catch { setError('Er ging iets mis.') }
    finally { setLoading(false) }
  }

  // ── REGISTER BEGELEIDER ───────────────────────────────────────────────
  async function handleRegisterBegeleider() {
    if (!name.trim()) return setError('Vul je naam in')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/begeleiders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Er ging iets mis'); return }
      setRegisteredBegeleider(name.trim())
      setShareMsg(`Hoi! Ik begeleid jullie bij de huwelijkscursus. Zoek bij het aanmelden naar: ${name.trim()}`)
      setMode('begeleider-done')
    } catch { setError('Er ging iets mis. Probeer het opnieuw.') }
    finally { setLoading(false) }
  }

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-stone-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">💍</div>
          <h1 className="text-2xl font-bold text-stone-900">Huwelijkscursus</h1>
          <p className="text-stone-500 text-sm mt-2">Ontdek wat God bedoelt met liefde en trouw</p>
        </div>

        {/* ── CHOOSE ── */}
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

        {/* ── SOLO ── */}
        {mode === 'solo' && (
          <div className="space-y-4">
            <button onClick={back} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div className="bg-stone-100 rounded-2xl p-4">
              <p className="text-sm text-stone-600 leading-relaxed">Je werkt alleen. Gezamenlijke gespreksonderwerpen sla je over.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Jouw naam</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Bijv. Sarah" className={inputCls} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">E-mailadres <span className="text-stone-400 font-normal">(voor herstel)</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jouw@email.nl" className={inputCls} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleSolo} disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform">
              {loading ? 'Bezig...' : 'Begin →'}
            </button>
          </div>
        )}

        {/* ── CREATE ── */}
        {mode === 'create' && (
          <div className="space-y-4">
            <button onClick={back} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Jouw naam</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Bijv. Sarah" className={inputCls} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">E-mailadres <span className="text-stone-400 font-normal">(voor herstel koppelcode/PIN)</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jouw@email.nl" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Begeleider</label>
              <BegeleiderSearch value={begeleiderName} onChange={setBegeleiderName} />
              <p className="text-xs text-stone-400 mt-1">Laat leeg voor Ruard Stolper</p>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleCreate} disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform">
              {loading ? 'Bezig...' : 'Koppelcode aanmaken →'}
            </button>
          </div>
        )}

        {/* ── JOIN ── */}
        {mode === 'join' && (
          <div className="space-y-4">
            <button onClick={back} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Koppelcode</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Bijv. TROUW-4821" className={`${inputCls} tracking-widest`} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Jouw naam</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="Bijv. Ruard" className={inputCls} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={() => handleJoin()} disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform">
              {loading ? 'Bezig...' : 'Deelnemen →'}
            </button>
            <button onClick={() => { setMode('forgot-code'); setEmail(''); setError('') }}
              className="w-full text-center text-xs text-stone-400 py-1">
              Koppelcode vergeten?
            </button>
          </div>
        )}

        {/* ── JOIN-PIN ── */}
        {mode === 'join-pin' && (
          <div className="space-y-4">
            <div className="text-center pt-2">
              <p className="text-2xl mb-2">🔒</p>
              <p className="font-bold text-stone-900">PIN invoeren</p>
              <p className="text-sm text-stone-500 mt-1">Welkom terug, {name}</p>
            </div>
            <PinInput value={pin} onChange={setPin} autoFocus />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button onClick={() => handleJoin(pin)} disabled={loading || !pin}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform">
              {loading ? 'Bezig...' : 'Inloggen →'}
            </button>
            <button onClick={() => { setMode('forgot-pin'); setPin(''); setError('') }}
              className="w-full text-center text-xs text-stone-400 py-1">
              PIN vergeten?
            </button>
            <button onClick={() => { setMode('join'); setError('') }}
              className="w-full text-center text-xs text-stone-400 py-1">
              ← Andere naam of code
            </button>
          </div>
        )}

        {/* ── SET-PIN (after create/join) ── */}
        {mode === 'set-pin' && pendingSession && (
          <div className="space-y-4">
            {/* Couple code — save this! */}
            <div className="bg-white rounded-2xl border-2 border-stone-900 overflow-hidden">
              <div className="bg-stone-900 px-4 py-3">
                <p className="text-white font-bold text-sm">Jouw koppelcode</p>
                <p className="text-stone-400 text-xs mt-0.5">Sla dit goed op — je hebt hem nodig om opnieuw in te loggen.</p>
              </div>
              <div className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-2xl font-bold tracking-widest text-stone-900">{pendingSession.coupleCode}</p>
                  <button onClick={copyCode}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                    {copied ? '✓ Gekopieerd' : 'Kopieer'}
                  </button>
                </div>
                <div className="mt-3 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    ⚠️ Bewaar deze code in je notities, foto of wachtwoordmanager. Zonder code kun je niet meer inloggen op een nieuw apparaat.
                  </p>
                </div>
              </div>
            </div>

            {/* Optional PIN */}
            <div className="bg-white rounded-2xl border border-stone-100 p-4">
              <p className="text-sm font-semibold text-stone-900 mb-1">PIN instellen <span className="text-stone-400 font-normal text-xs">(optioneel)</span></p>
              <p className="text-xs text-stone-400 mb-3 leading-relaxed">Bescherm je antwoorden met een PIN. Handig als je een gedeeld apparaat gebruikt.</p>
              <div className="space-y-2">
                <PinInput value={newPin} onChange={setNewPin} placeholder="Nieuwe PIN (min. 4 cijfers)" />
                {newPin.length >= 4 && (
                  <PinInput value={confirmPin} onChange={setConfirmPin} placeholder="Herhaal PIN" />
                )}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={() => handleSetPin(false)} disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform">
              {loading ? 'Bezig...' : newPin ? 'PIN instellen & beginnen →' : 'Beginnen →'}
            </button>
            {newPin === '' && (
              <button onClick={() => handleSetPin(true)} disabled={loading}
                className="w-full py-2 text-stone-400 text-sm">
                Overslaan (geen PIN)
              </button>
            )}
          </div>
        )}

        {/* ── FORGOT CODE ── */}
        {mode === 'forgot-code' && (
          <div className="space-y-4">
            <button onClick={() => { setMode('join'); setError('') }} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div>
              <p className="font-bold text-stone-900 mb-1">Koppelcode vergeten?</p>
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">Voer het e-mailadres in dat bij het aanmaken is opgegeven. Dan sturen we je de code toe.</p>
              <label className="block text-sm font-medium text-stone-700 mb-1">E-mailadres</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleForgotCode()}
                placeholder="jouw@email.nl" className={inputCls} autoFocus />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleForgotCode} disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50">
              {loading ? 'Bezig...' : 'Code opsturen →'}
            </button>
          </div>
        )}

        {mode === 'forgot-code-sent' && (
          <div className="text-center space-y-4">
            <div className="text-4xl">📬</div>
            <p className="font-bold text-stone-900">E-mail verstuurd</p>
            <p className="text-sm text-stone-500 leading-relaxed">
              Als er een account gekoppeld is aan <strong>{email}</strong>, ontvang je de koppelcode binnen een paar minuten.
            </p>
            <button onClick={() => { setMode('join'); setError(''); setEmail('') }}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base">
              Terug naar inloggen
            </button>
          </div>
        )}

        {/* ── FORGOT PIN ── */}
        {mode === 'forgot-pin' && (
          <div className="space-y-4">
            <button onClick={() => { setMode('join-pin'); setError('') }} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div>
              <p className="font-bold text-stone-900 mb-1">PIN vergeten?</p>
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">
                We sturen een resetcode naar het e-mailadres dat bij de koppelcode hoort.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Koppelcode</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Bijv. TROUW-4821" className={`${inputCls} tracking-widest`} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Jouw naam</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleForgotPin()}
                placeholder="Bijv. Sarah" className={inputCls} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleForgotPin} disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50">
              {loading ? 'Bezig...' : 'Resetcode opsturen →'}
            </button>
          </div>
        )}

        {/* ── RESET PIN ── */}
        {mode === 'reset-pin' && (
          <div className="space-y-4">
            <div>
              <p className="font-bold text-stone-900 mb-1">Nieuwe PIN instellen</p>
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">
                We hebben een 6-cijferige code gestuurd naar <strong>{maskedEmail}</strong>. Voer hem hieronder in.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Code uit e-mail</label>
              <input type="text" inputMode="numeric" maxLength={6} value={resetToken}
                onChange={e => setResetToken(e.target.value.replace(/\D/g, ''))}
                placeholder="123456" className={`${inputCls} tracking-widest text-center`} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Nieuwe PIN</label>
              <PinInput value={newPin} onChange={setNewPin} />
            </div>
            {newPin.length >= 4 && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Herhaal PIN</label>
                <PinInput value={confirmPin} onChange={setConfirmPin} />
              </div>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleResetPin} disabled={loading || !resetToken || !newPin}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50">
              {loading ? 'Bezig...' : 'PIN instellen & inloggen →'}
            </button>
            <button onClick={() => { setMode('forgot-pin'); setError('') }}
              className="w-full text-center text-xs text-stone-400 py-1">
              Nieuwe code aanvragen
            </button>
          </div>
        )}

        {/* ── REGISTER BEGELEIDER ── */}
        {mode === 'register-begeleider' && (
          <div className="space-y-4">
            <button onClick={back} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div className="bg-stone-100 rounded-2xl p-4">
              <p className="text-sm text-stone-600 leading-relaxed">Registreer je als begeleider zodat stellen jou kunnen vinden en koppelen.</p>
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
            <button onClick={() => {
              if (navigator.share) navigator.share({ text: shareMsg }).catch(() => {})
              else navigator.clipboard.writeText(shareMsg).then(() => alert('Gekopieerd!')).catch(() => {})
            }} className="w-full py-3 bg-stone-900 text-white rounded-2xl font-semibold text-sm active:scale-95 transition-transform">
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
