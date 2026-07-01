'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { setSession, getSession, setGuestMode } from '@/lib/session'

type Mode =
  | 'choose'
  | 'login' | 'register' | 'register-sent'
  | 'forgot-code' | 'forgot-code-sent'
  | 'begeleider-choose' | 'register-begeleider' | 'begeleider-verify'
  | 'begeleider-login' | 'begeleider-forgot-pin' | 'begeleider-reset-pin'

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
  const [partnerCode, setPartnerCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState('')

  useEffect(() => {
    if (getSession()) router.replace('/home')
  }, [router])

  function back() { setMode('choose'); setError('') }
  function backToBegeleider() { setMode('begeleider-choose'); setError(''); setPin(''); setNewPin(''); setConfirmPin(''); setResetToken('') }
  const inputCls = 'w-full px-4 py-3 border border-stone-200 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-stone-400'

  // ── LOGIN ────────────────────────────────────────────────────────────────
  async function handleLogin() {
    if (!code.trim() || !name.trim()) return setError('Vul koppelcode en naam in')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSession({
        memberId: data.memberId,
        memberName: data.memberName,
        coupleId: data.coupleId,
        coupleCode: data.coupleCode,
        isSingle: false,
        begeleiderName: data.begeleiderName ?? 'Ruard Stolper',
        isBegeleider: false,
      })
      router.push('/home')
    } catch { setError('Er ging iets mis. Probeer het opnieuw.') }
    finally { setLoading(false) }
  }

  // ── REGISTER ─────────────────────────────────────────────────────────────
  async function handleRegister() {
    if (!name.trim()) return setError('Vul je naam in')
    if (!email.trim()) return setError('Vul je e-mailadres in')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          partnerCode: partnerCode.trim() || undefined,
          begeleiderName: begeleiderName.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setRegisteredEmail(email.trim())
      setMode('register-sent')
    } catch { setError('Er ging iets mis. Probeer het opnieuw.') }
    finally { setLoading(false) }
  }

  // ── FORGOT CODE ───────────────────────────────────────────────────────────
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

  // ── BEGELEIDER REGISTER ───────────────────────────────────────────────────
  async function handleBegeleiderRegister() {
    if (!name.trim()) return setError('Vul je naam in')
    if (!email.trim()) return setError('Vul je e-mailadres in')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/begeleiders/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setResetToken(''); setNewPin(''); setConfirmPin('')
      setMode('begeleider-verify')
    } catch { setError('Er ging iets mis. Probeer het opnieuw.') }
    finally { setLoading(false) }
  }

  // ── BEGELEIDER VERIFY ─────────────────────────────────────────────────────
  async function handleBegeleiderVerify() {
    if (!resetToken.trim()) return setError('Voer de 6-cijferige code in')
    if (!newPin || newPin.length < 4) return setError('PIN moet minimaal 4 cijfers zijn')
    if (newPin !== confirmPin) return setError('PINs komen niet overeen')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/begeleiders/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), token: resetToken.trim(), newPin }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSession({ memberId: data.memberId, memberName: data.memberName, coupleId: data.coupleId, coupleCode: data.coupleCode, isSingle: false, isBegeleider: true })
      router.push('/home')
    } catch { setError('Er ging iets mis.') }
    finally { setLoading(false) }
  }

  // ── BEGELEIDER LOGIN ──────────────────────────────────────────────────────
  async function handleBegeleiderLogin() {
    if (!name.trim() || !pin.trim()) return setError('Vul naam en PIN in')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/begeleiders/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), pin }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSession({ memberId: data.memberId, memberName: data.memberName, coupleId: data.coupleId, coupleCode: data.coupleCode, isSingle: false, isBegeleider: true })
      router.push('/home')
    } catch { setError('Er ging iets mis.') }
    finally { setLoading(false) }
  }

  // ── BEGELEIDER FORGOT PIN ─────────────────────────────────────────────────
  async function handleBegeleiderForgotPin() {
    if (!email.trim()) return setError('Vul je e-mailadres in')
    setLoading(true); setError('')
    try {
      await fetch('/api/begeleiders/forgot-pin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      setResetToken(''); setNewPin(''); setConfirmPin('')
      setMode('begeleider-reset-pin')
    } catch { setError('Er ging iets mis.') }
    finally { setLoading(false) }
  }

  // ── BEGELEIDER RESET PIN ──────────────────────────────────────────────────
  async function handleBegeleiderResetPin() {
    if (!resetToken.trim()) return setError('Voer de 6-cijferige code in')
    if (!newPin || newPin.length < 4) return setError('PIN moet minimaal 4 cijfers zijn')
    if (newPin !== confirmPin) return setError('PINs komen niet overeen')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/begeleiders/reset-pin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), token: resetToken.trim(), newPin }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSession({ memberId: data.memberId, memberName: data.memberName, coupleId: data.coupleId, coupleCode: data.coupleCode, isSingle: false, isBegeleider: true })
      router.push('/home')
    } catch { setError('Er ging iets mis.') }
    finally { setLoading(false) }
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
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
            <button onClick={() => { setMode('login'); setCode(''); setName(''); setError('') }}
              className="w-full text-left bg-stone-900 text-white rounded-2xl p-5 active:scale-95 transition-transform">
              <p className="font-bold text-base">Inloggen</p>
              <p className="text-stone-300 text-sm mt-1 leading-snug">Voer je koppelcode en naam in.</p>
            </button>
            <button onClick={() => { setMode('register'); setName(''); setEmail(''); setPartnerCode(''); setBegeleiderName(''); setError('') }}
              className="w-full text-left bg-white border border-stone-200 rounded-2xl p-5 active:scale-95 transition-transform">
              <p className="font-bold text-stone-900 text-base">Registreren</p>
              <p className="text-stone-500 text-sm mt-1 leading-snug">Maak een account aan met je e-mailadres.</p>
            </button>
            <button onClick={() => { setMode('begeleider-choose'); setName(''); setEmail(''); setPin(''); setError('') }}
              className="w-full text-left bg-white border border-dashed border-stone-300 rounded-2xl p-4 active:scale-95 transition-transform">
              <p className="font-semibold text-stone-600 text-sm">Ben je begeleider?</p>
              <p className="text-stone-400 text-xs mt-0.5">Registreer of log in als begeleider.</p>
            </button>
            <div className="pt-1 space-y-1">
              <button onClick={() => { setMode('forgot-code'); setEmail(''); setError('') }}
                className="w-full text-center text-xs text-stone-400 py-1 hover:text-stone-600 transition-colors">
                Koppelcode vergeten?
              </button>
              <button onClick={() => { setGuestMode(); router.push('/home') }}
                className="w-full text-center text-xs text-stone-400 py-1 hover:text-stone-600 transition-colors">
                Bekijk de cursus zonder account →
              </button>
            </div>
          </div>
        )}

        {/* ── LOGIN ── */}
        {mode === 'login' && (
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
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Bijv. Sarah" className={inputCls} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleLogin} disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform">
              {loading ? 'Bezig...' : 'Inloggen →'}
            </button>
            <button onClick={() => { setMode('forgot-code'); setEmail(''); setError('') }}
              className="w-full text-center text-xs text-stone-400 py-1">
              Koppelcode vergeten?
            </button>
          </div>
        )}

        {/* ── REGISTER ── */}
        {mode === 'register' && (
          <div className="space-y-4">
            <button onClick={back} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Jouw naam</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Bijv. Sarah" className={inputCls} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">E-mailadres</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="jouw@email.nl" className={inputCls} />
              <p className="text-xs text-stone-400 mt-1">We sturen je een bevestigingslink.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Koppelcode partner <span className="text-stone-400 font-normal">(optioneel)</span>
              </label>
              <input type="text" value={partnerCode} onChange={e => setPartnerCode(e.target.value.toUpperCase())}
                placeholder="Bijv. TROUW-4821 — laat leeg als je zelf start"
                className={`${inputCls} tracking-widest`} />
              <p className="text-xs text-stone-400 mt-1">Heeft je partner al een code? Vul die hier in.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Begeleider <span className="text-stone-400 font-normal">(optioneel)</span>
              </label>
              <BegeleiderSearch value={begeleiderName} onChange={setBegeleiderName} />
              <p className="text-xs text-stone-400 mt-1">Laat leeg voor Ruard Stolper</p>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleRegister} disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform">
              {loading ? 'Bezig...' : 'Bevestigingslink versturen →'}
            </button>
          </div>
        )}

        {/* ── REGISTER SENT ── */}
        {mode === 'register-sent' && (
          <div className="text-center space-y-5">
            <div className="text-5xl">📬</div>
            <div>
              <p className="font-bold text-stone-900 text-xl">Check je e-mail</p>
              <p className="text-stone-500 text-sm mt-2 leading-relaxed">
                We hebben een bevestigingslink gestuurd naar<br />
                <strong className="text-stone-700">{registeredEmail}</strong>
              </p>
            </div>
            <div className="bg-stone-100 rounded-2xl p-4 text-left">
              <p className="text-sm text-stone-600 leading-relaxed">
                Klik op de link in de e-mail om direct in te loggen. De link is 24 uur geldig.
              </p>
            </div>
            <button onClick={back}
              className="w-full py-3 text-stone-500 text-sm border border-stone-200 rounded-2xl bg-white">
              Terug naar begin
            </button>
            <button onClick={() => { setMode('register'); setError('') }}
              className="w-full text-center text-xs text-stone-400 py-1">
              Geen e-mail ontvangen? Opnieuw versturen
            </button>
          </div>
        )}

        {/* ── FORGOT CODE ── */}
        {mode === 'forgot-code' && (
          <div className="space-y-4">
            <button onClick={back} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div>
              <p className="font-bold text-stone-900 mb-1">Koppelcode vergeten?</p>
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">
                Voer het e-mailadres in dat je bij registratie hebt gebruikt. We sturen je de code toe.
              </p>
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

        {/* ── FORGOT CODE SENT ── */}
        {mode === 'forgot-code-sent' && (
          <div className="text-center space-y-4">
            <div className="text-4xl">📬</div>
            <p className="font-bold text-stone-900">E-mail verstuurd</p>
            <p className="text-sm text-stone-500 leading-relaxed">
              Als <strong>{email}</strong> bij een account hoort, ontvang je de koppelcode binnen een paar minuten.
            </p>
            <button onClick={() => { setMode('login'); setCode(''); setName(''); setError('') }}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base">
              Inloggen met koppelcode
            </button>
          </div>
        )}

        {/* ── BEGELEIDER CHOOSE ── */}
        {mode === 'begeleider-choose' && (
          <div className="space-y-3">
            <button onClick={back} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div className="bg-stone-50 rounded-2xl p-4 mb-2">
              <p className="text-sm text-stone-600 leading-relaxed">Als begeleider kun je de cursus bekijken en stellen begeleiden. Je logt in met naam en PIN.</p>
            </div>
            <button onClick={() => { setMode('register-begeleider'); setName(''); setEmail(''); setError('') }}
              className="w-full text-left bg-stone-900 text-white rounded-2xl p-5 active:scale-95 transition-transform">
              <p className="font-bold text-base">Nieuw account aanmaken</p>
              <p className="text-stone-300 text-sm mt-1">Registreer met naam en e-mail.</p>
            </button>
            <button onClick={() => { setMode('begeleider-login'); setName(''); setPin(''); setError('') }}
              className="w-full text-left bg-white border border-stone-200 rounded-2xl p-5 active:scale-95 transition-transform">
              <p className="font-bold text-stone-900 text-base">Inloggen</p>
              <p className="text-stone-500 text-sm mt-1">Je hebt al een begeleider-account.</p>
            </button>
          </div>
        )}

        {/* ── REGISTER BEGELEIDER ── */}
        {mode === 'register-begeleider' && (
          <div className="space-y-4">
            <button onClick={backToBegeleider} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Naam (zoals stellen je kennen)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Bijv. Jan Koeman" className={inputCls} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">E-mailadres</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleBegeleiderRegister()}
                placeholder="jouw@email.nl" className={inputCls} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleBegeleiderRegister} disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform">
              {loading ? 'Bezig...' : 'Verificatiecode opsturen →'}
            </button>
          </div>
        )}

        {/* ── BEGELEIDER VERIFY ── */}
        {mode === 'begeleider-verify' && (
          <div className="space-y-4">
            <div className="text-center pt-2">
              <p className="text-2xl mb-2">📬</p>
              <p className="font-bold text-stone-900">Controleer je e-mail</p>
              <p className="text-sm text-stone-500 mt-1">We hebben een 6-cijferige code gestuurd naar <strong>{email}</strong>.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Code uit e-mail</label>
              <input type="text" inputMode="numeric" maxLength={6} value={resetToken}
                onChange={e => setResetToken(e.target.value.replace(/\D/g, ''))}
                placeholder="123456" className={`${inputCls} tracking-widest text-center`} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">PIN instellen <span className="text-stone-400 font-normal text-xs">(min. 4 cijfers)</span></label>
              <PinInput value={newPin} onChange={setNewPin} />
            </div>
            {newPin.length >= 4 && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Herhaal PIN</label>
                <PinInput value={confirmPin} onChange={setConfirmPin} />
              </div>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleBegeleiderVerify} disabled={loading || !resetToken || !newPin}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform">
              {loading ? 'Bezig...' : 'Bevestigen & inloggen →'}
            </button>
            <button onClick={() => { setMode('register-begeleider'); setError('') }}
              className="w-full text-center text-xs text-stone-400 py-1">
              Opnieuw versturen
            </button>
          </div>
        )}

        {/* ── BEGELEIDER LOGIN ── */}
        {mode === 'begeleider-login' && (
          <div className="space-y-4">
            <button onClick={backToBegeleider} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Jouw naam</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Bijv. Jan Koeman" className={inputCls} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">PIN</label>
              <PinInput value={pin} onChange={setPin} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleBegeleiderLogin} disabled={loading || !name || !pin}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-95 transition-transform">
              {loading ? 'Bezig...' : 'Inloggen →'}
            </button>
            <button onClick={() => { setMode('begeleider-forgot-pin'); setEmail(''); setError('') }}
              className="w-full text-center text-xs text-stone-400 py-1">
              PIN vergeten?
            </button>
          </div>
        )}

        {/* ── BEGELEIDER FORGOT PIN ── */}
        {mode === 'begeleider-forgot-pin' && (
          <div className="space-y-4">
            <button onClick={() => { setMode('begeleider-login'); setError('') }} className="text-stone-400 text-sm flex items-center gap-1">← Terug</button>
            <div>
              <p className="font-bold text-stone-900 mb-1">PIN vergeten?</p>
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">Voer het e-mailadres in dat je bij registratie hebt opgegeven.</p>
              <label className="block text-sm font-medium text-stone-700 mb-1">E-mailadres</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleBegeleiderForgotPin()}
                placeholder="jouw@email.nl" className={inputCls} autoFocus />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleBegeleiderForgotPin} disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50">
              {loading ? 'Bezig...' : 'Resetcode opsturen →'}
            </button>
          </div>
        )}

        {/* ── BEGELEIDER RESET PIN ── */}
        {mode === 'begeleider-reset-pin' && (
          <div className="space-y-4">
            <div>
              <p className="font-bold text-stone-900 mb-1">Nieuwe PIN instellen</p>
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">
                We hebben een code gestuurd naar <strong>{email}</strong> (als het adres bekend is).
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
            <button onClick={handleBegeleiderResetPin} disabled={loading || !resetToken || !newPin}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base disabled:opacity-50">
              {loading ? 'Bezig...' : 'PIN instellen & inloggen →'}
            </button>
            <button onClick={() => { setMode('begeleider-forgot-pin'); setError('') }}
              className="w-full text-center text-xs text-stone-400 py-1">
              Nieuwe code aanvragen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
