'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setSession } from '@/lib/session'

function VerifyInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { setError('Geen token gevonden in de link.'); setLoading(false); return }

    fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setSession({
          memberId: data.memberId,
          memberName: data.memberName,
          coupleId: data.coupleId,
          coupleCode: data.coupleCode,
          isSingle: false,
          begeleiderName: data.begeleiderName ?? 'Ruard Stolper',
          isBegeleider: false,
        })
        router.replace('/home')
      })
      .catch(() => { setError('Er ging iets mis. Probeer het opnieuw.'); setLoading(false) })
  }, [router, searchParams])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <p className="text-4xl mb-4">✉️</p>
        <p className="text-stone-600 font-medium text-lg">Bezig met inloggen...</p>
        <p className="text-stone-400 text-sm mt-2">Even geduld</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-4">😕</p>
        <p className="font-bold text-stone-900 text-xl mb-2">Link ongeldig</p>
        <p className="text-stone-500 text-sm mb-6 leading-relaxed">{error}</p>
        <button
          onClick={() => router.replace('/')}
          className="px-6 py-3 bg-stone-900 text-white rounded-2xl font-semibold"
        >
          Terug naar begin
        </button>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-400">Laden...</p>
      </div>
    }>
      <VerifyInner />
    </Suspense>
  )
}
