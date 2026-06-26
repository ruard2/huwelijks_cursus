'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/session'

export default function IntroPage() {
  const router = useRouter()
  const [session, setSessionData] = useState<ReturnType<typeof getSession>>(null)

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/'); return }
    setSessionData(s)
  }, [router])

  if (!session) return null

  if (session.isSingle) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-10">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">📖</div>
            <h1 className="text-xl font-bold text-stone-900">Welkom, {session.memberName}!</h1>
            <p className="text-sm text-stone-500 mt-2">Persoonlijke verkenning</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-4 mb-6">
            <h2 className="font-bold text-stone-900">Hoe werkt dit?</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              Dit werkboek helpt je ontdekken wat jij meebrengt in een relatie — je achtergrond, je verwachtingen, je overtuigingen en je verlangens.
            </p>
            <p className="text-stone-600 text-sm leading-relaxed">
              Je doet dit in eigen tempo, helemaal alleen. De persoonlijke reflectievragen zijn voor jou — gezamenlijke gespreksonderwerpen sla je over.
            </p>

            <div className="border-t border-stone-100 pt-4 space-y-3">
              <div className="flex gap-3">
                <span className="text-lg shrink-0">👤</span>
                <div>
                  <p className="text-sm font-medium text-stone-800">Persoonlijke reflectie</p>
                  <p className="text-xs text-stone-500">Vragen om eerlijk bij jezelf naar binnen te kijken.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-lg shrink-0">🔒</span>
                <div>
                  <p className="text-sm font-medium text-stone-800">Privé antwoorden</p>
                  <p className="text-xs text-stone-500">Klik het oogje om een antwoord privé te maken — de beheerder kan het dan niet lezen.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-lg shrink-0">✅</span>
                <div>
                  <p className="text-sm font-medium text-stone-800">Eigen volgorde</p>
                  <p className="text-xs text-stone-500">We raden de volgorde aan, maar je kiest zelf wat nu past.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/home')}
            className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base active:scale-95 transition-transform"
          >
            Begin →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📖</div>
          <h1 className="text-xl font-bold text-stone-900">Welkom, {session.memberName}!</h1>
          <div className="mt-3 inline-block bg-stone-100 rounded-xl px-4 py-2">
            <span className="text-xs text-stone-500">Koppelcode: </span>
            <span className="font-mono font-bold text-stone-900 tracking-wider">{session.coupleCode}</span>
          </div>
          <p className="text-xs text-stone-400 mt-2">Deel deze code met je partner zodat jullie samen kunnen werken</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-4 mb-6">
          <h2 className="font-bold text-stone-900">Hoe werkt dit werkboek?</h2>
          <p className="text-stone-600 text-sm leading-relaxed">
            Dit werkboek helpt jullie om niet alleen over trouwen te praten, maar samen te ontdekken wat God bedoelt met liefde, eenheid, trouw, lichaam, schaamte, familie, geschiedenis en moeilijke tijden.
          </p>
          <p className="text-stone-600 text-sm leading-relaxed">
            Het is geen toets. Het doel is dat jullie eerlijk leren spreken, aandachtig leren luisteren en woorden vinden voor wat anders vaag blijft.
          </p>

          <div className="border-t border-stone-100 pt-4 space-y-3">
            <div className="flex gap-3">
              <span className="text-lg shrink-0">👤</span>
              <div>
                <p className="text-sm font-medium text-stone-800">Persoonlijke reflectie</p>
                <p className="text-xs text-stone-500">Vul dit eerst zelf in, alleen. Je partner ziet jouw antwoorden ook.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg shrink-0">💬</span>
              <div>
                <p className="text-sm font-medium text-stone-800">Samen bespreken</p>
                <p className="text-xs text-stone-500">Bespreek deze vragen samen — tijdens een gesprek of videobel.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg shrink-0">🔒</span>
              <div>
                <p className="text-sm font-medium text-stone-800">Privé antwoorden</p>
                <p className="text-xs text-stone-500">Klik het oogje bij een antwoord om het privé te maken. Alleen jullie samen kunnen privé-antwoorden lezen — de app-beheerder niet.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg shrink-0">✅</span>
              <div>
                <p className="text-sm font-medium text-stone-800">Eigen volgorde</p>
                <p className="text-xs text-stone-500">We raden aan de blokken in volgorde te doen, maar je kunt altijd kiezen wat nu past.</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/home')}
          className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold text-base active:scale-95 transition-transform"
        >
          Naar de inhoud →
        </button>
      </div>
    </div>
  )
}
