import { Deel } from './types'

export const deelH: Deel = {
  id: 'h',
  letter: 'H',
  title: 'Tussenstand en belofte',
  subtitle: 'Deel H — Tussenstand en belofte',
  intro: 'Dit laatste blok is geen officiële trouwbelofte en vervangt de belofte op de trouwdag niet. Het helpt jullie wel om woorden te geven aan wat jullie ontdekt hebben: over God, jezelf, de ander, lichaam, seksualiteit, roeping, schaamte, trouw en hulp zoeken.',
  color: '#7c3aed',
  chapters: [
    {
      id: '22',
      number: 22,
      title: 'Tussenstand: onze samenvatting en belofte',
      deelId: 'h',
      intro: `Een werkboek is pas vruchtbaar als het uitloopt op woorden die jullie zelf kunnen dragen. Niet alles hoeft al af te zijn. Maar het is goed om samen te benoemen wat jullie gezien hebben, wat jullie willen oefenen en waar jullie Gods hulp bij nodig hebben.`,
      sections: [
        {
          id: 'personal',
          title: 'Persoonlijke samenvatting',
          type: 'personal',
          questions: [
            { id: 'p1', text: 'Eén zin of tekst uit dit werkboek die mij raakt:', placeholder: 'Schrijf hier...' },
            { id: 'p2', text: 'Eén ontdekking over mezelf:', placeholder: 'Schrijf hier...' },
            { id: 'p3', text: 'Eén ontdekking over jou:', placeholder: 'Schrijf hier...' },
            { id: 'p4', text: 'Eén punt waarop ik mij wil bekeren of wil groeien:', placeholder: 'Schrijf hier...' },
            { id: 'p5', text: 'Eén onderwerp waar we later verder over moeten praten:', placeholder: 'Schrijf hier...' },
          ],
        },
        {
          id: 'samen-terugkijken',
          title: 'Samen terugkijken',
          type: 'samen',
          questions: [
            { id: 's1', text: 'Wat hebben wij ontdekt over God als fundament onder ons huwelijk?' },
            { id: 's2', text: 'Wat hebben wij ontdekt over hoe wij elkaar soms te groot maken of juist te klein behandelen?' },
            { id: 's3', text: 'Wat hebben wij ontdekt over ons lichaam, seksualiteit, schaamte en verlangen?' },
            { id: 's4', text: 'Wat hebben wij ontdekt over onze roeping als man en vrouw voor Christus?' },
            { id: 's5', text: 'Wat hebben wij ontdekt over moeilijke tijden, hulp zoeken en de weg terug?' },
          ],
        },
        {
          id: 'werkbelofte',
          title: 'Onze werkbelofte',
          type: 'samen',
          intro: 'Schrijf hieronder geen perfecte trouwbelofte, maar een eerlijke samenvatting van wat jullie nu samen willen oefenen.',
          questions: [
            { id: 'b1', text: 'Voor God willen wij ons huwelijk bouwen op...', placeholder: 'Schrijf hier...' },
            { id: 'b2', text: 'Wij willen elkaar ontvangen als...', placeholder: 'Schrijf hier...' },
            { id: 'b3', text: 'Wij willen elkaar niet belasten met...', placeholder: 'Schrijf hier...' },
            { id: 'b4', text: 'Als het moeilijk wordt, willen wij...', placeholder: 'Schrijf hier...' },
            { id: 'b5', text: 'Rond lichaam, verlangen en seksualiteit willen wij...', placeholder: 'Schrijf hier...' },
            { id: 'b6', text: 'In onze roeping als man en vrouw willen wij...', placeholder: 'Schrijf hier...' },
            { id: 'b7', text: 'Wij geven toestemming aan deze mensen om met liefde en waarheid mee te kijken:', placeholder: 'Namen...' },
            { id: 'b8', text: 'Schrijf nu samen één korte belofte of samenvatting in eigen woorden.', placeholder: 'Onze belofte...' },
          ],
        },
        {
          id: 'gebed',
          title: 'Gebed',
          type: 'samen',
          questions: [
            { id: 'g1', text: 'Mijn gebed:', placeholder: 'Schrijf jouw gebed hier...' },
            { id: 'g2', text: 'Gebed van mijn partner:', placeholder: 'Schrijf het gebed van je partner hier...' },
            {
              id: 'g3',
              text: 'Samen bidden wij:',
              type: 'readonly',
              value: 'Heer, leer ons elkaar ontvangen zoals U ons aan elkaar geeft. Leer ons liefhebben zonder hoogmoed, spreken zonder angst, luisteren zonder verdediging, trouw zijn zonder hardheid, en kwetsbaar zijn zonder schaamte. Breng ons dichter bij U, en daardoor ook dichter bij elkaar. Amen.',
            },
          ],
        },
      ],
    },
  ],
}
