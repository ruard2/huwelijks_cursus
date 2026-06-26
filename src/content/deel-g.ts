import { Deel } from './types'

export const deelG: Deel = {
  id: 'g',
  letter: 'G',
  title: 'Als het moeilijk wordt',
  subtitle: 'Deel G — Als het moeilijk wordt',
  intro: 'Nu komt het realisme van Genesis 3 en Matteüs 19. Gods goede begin, seksualiteit en Efeze 5 zijn geen ideaalplaatje voor perfecte mensen. Dit blok helpt om schaamte, verbergen, verwijten, lijden, trouw en de weg terug onder ogen te zien.',
  color: '#64748b',
  chapters: [
    {
      id: '20',
      number: 20,
      title: 'Als schaamte binnenkomt: verbergen, beschermen, verwijten',
      deelId: 'g',
      verse: { ref: 'Genesis 3:7-13', text: 'Lees Genesis 3:7-13', pretext: '' },
      intro: `Genesis 1 en 2 laten Gods goede begin zien. Maar wij leven niet meer vanzelf in dat begin. Waar schaamte binnenkomt, gaan mensen zich bedekken. Waar angst binnenkomt, gaan mensen zich verbergen. Waar schuld binnenkomt, gaan mensen elkaar en God aanwijzen.

Dat gebeurt ook in relaties. Je wordt geraakt en je beschermt jezelf. Je voelt schaamte en je trekt je terug. Je voelt pijn en je valt aan. Zo kan nabijheid ingewikkeld worden, zelfs wanneer er liefde is.

Dit hoofdstuk is niet bedoeld om elkaar te beschuldigen, maar om jullie eigen patronen te leren herkennen.`,
      sections: [
        {
          id: 'personal',
          title: 'Persoonlijke reflectie',
          type: 'personal',
          questions: [
            { id: 'p1', text: 'Wanneer ben jij geneigd je te verbergen?', hint: 'Als je faalt, als je schaamte voelt, als je boos bent, als je bang bent de ander teleur te stellen, of op een ander moment?' },
            { id: 'p2', text: 'Wat doe jij meestal bij spanning?', hint: 'Aanvallen, terugtrekken, pleasen, verklaren, dichtklappen, grapjes maken, bidden, oplossen, iets anders?' },
            { id: 'p3', text: 'Welke zin zou jij in moeilijke momenten eigenlijk willen kunnen zeggen, maar vind je spannend?' },
          ],
        },
        {
          id: 'samen',
          title: 'Samen bespreken',
          type: 'samen',
          questions: [
            { id: 's1', text: 'Hoe herkennen jullie bij elkaar dat schaamte, angst of verdediging actief wordt?' },
            { id: 's2', text: 'Welke reactie van de ander helpt jou om weer bereikbaar te worden?' },
            { id: 's3', text: 'Welke reactie van de ander maakt het juist moeilijker?' },
            { id: 's4', text: 'Hoe kunnen jullie elkaar helpen om sneller uit verbergen, verdedigen of verwijten terug te komen?' },
          ],
        },
      ],
    },
    {
      id: '21',
      number: 21,
      title: 'Wat God één maakt: trouw, kruisdragen en de weg terug',
      deelId: 'g',
      verse: { ref: 'Matteüs 19:6', text: 'Dus, wat God samengevoegd heeft, laat de mens dat niet scheiden.' },
      intro: `Jezus verwijst terug naar Genesis 2 als Hij spreekt over het huwelijk. Wat God één gemaakt heeft, mag een mens niet scheiden.

Maar juist dan komt de echte vraag: hoe leef je die trouw als het moeilijk wordt? Wat als de liefde niet meer vanzelf voelt? Wat als je elkaar pijn doet? Wat als je moe wordt van elkaar?

Belangrijk: Trouw betekent niet dat zonde, geweld, vernedering, manipulatie of onveiligheid moeten worden goedgepraat. Soms is hulp van buiten nodig.`,
      sections: [],
      subsections: [
        {
          id: '21-1',
          number: '21.1',
          title: 'Jezelf verloochenen, je kruis opnemen en Christus volgen',
          intro: `Christus belooft nooit een gemakkelijk leven. In het huwelijk betekent dit: de ander is niet alleen gegeven om jou gelukkig te maken, maar ook om jou te vormen. Je partner zal je vreugde geven, maar ook je ego raken. Je zult leren geven, wachten, luisteren, vergeven, verdragen, eerlijk zijn en opnieuw beginnen.`,
          sections: [
            {
              id: 'reflection',
              title: 'Reflectie',
              type: 'reflection',
              questions: [
                { id: 'r1', text: 'Waarin vind jij jezelf verloochenen moeilijk?' },
                { id: 'r2', text: 'Welke scherpe rand in jou zal je partner waarschijnlijk tegenkomen?' },
                { id: 'r3', text: 'Waarin zal je partner jou moeten leren verdragen?' },
                { id: 'r4', text: 'Waarin hoop je door je partner meer op Christus te gaan lijken?' },
              ],
            },
          ],
        },
        {
          id: '21-2',
          number: '21.2',
          title: 'Alles ten goede',
          intro: `God belooft niet dat alles goed voelt. Maar Hij kan alles gebruiken tot Zijn eer en tot heling en vorming van wie Hem liefhebben. Ook moeite in het huwelijk kan een plaats worden waar God werkt: aan nederigheid, waarheid, vergeving, volharding, zachtheid en volwassen liefde.`,
          sections: [
            {
              id: 'reflection',
              title: 'Reflectie',
              type: 'reflection',
              questions: [
                { id: 'r1', text: 'Hoe ga jij nu om met tegenslagen?' },
                {
                  id: 'r2',
                  text: 'Wat gebeurt er met jou als iets niet gaat zoals je hoopte?',
                  type: 'checkbox',
                  options: ['ik trek me terug', 'ik word boos', 'ik ga harder werken', 'ik word stil', 'ik zoek afleiding', 'ik geef de ander de schuld', 'ik geef mezelf de schuld', 'ik bid', 'ik praat erover', 'ik sluit af'],
                  other: true,
                },
                { id: 'r3', text: 'Kun je geloven dat God zelfs moeite en lijden kan gebruiken, zonder dat het lijden zelf goed genoemd hoeft te worden?' },
              ],
            },
          ],
        },
        {
          id: '21-3',
          number: '21.3',
          title: 'Wie zijn leven verliest, zal het vinden',
          intro: `Wie Christus volgt, leert ook iets van dat patroon: sterven aan jezelf en opstaan in nieuw leven. In het huwelijk betekent dat niet: jezelf kwijtraken als persoon. Maar: het oude ik dat altijd gelijk wil krijgen, zichzelf wil beschermen, wil winnen of wil vluchten, moet leren sterven.`,
          sections: [
            {
              id: 'reflection',
              title: 'Reflectie',
              type: 'reflection',
              questions: [
                { id: 'r1', text: 'Wat moet in jou misschien sterven om lief te kunnen hebben?' },
                {
                  id: 'r2',
                  text: 'Waar wil jij vaak aan vasthouden?',
                  type: 'checkbox',
                  options: ['gelijk krijgen', 'controle', 'onafhankelijkheid', 'trots', 'gemak', 'erkenning', 'boosheid', 'slachtofferschap', 'zwijgen', 'oude pijn'],
                  other: true,
                },
                { id: 'r3', text: 'Wat zou er kunnen opstaan als je dat leert loslaten?' },
              ],
            },
          ],
        },
        {
          id: '21-4',
          number: '21.4',
          title: 'De weg terug via God',
          intro: `Hoe dichter jullie bij God komen, hoe dichter jullie ook bij elkaar leren komen. Niet omdat elk probleem dan automatisch verdwijnt, maar omdat je samen onder Zijn waarheid, genade en liefde komt te staan.

Je komt niet dichter bij elkaar door elkaar krampachtig vast te grijpen. Je komt dichter bij elkaar door samen dichter bij God te komen. Dan wordt de vraag niet alleen: "Wie heeft gelijk?" maar ook: "Waar zijn we God, onszelf en elkaar kwijtgeraakt?"`,
          sections: [
            {
              id: 'personal',
              title: 'Persoonlijke reflectie',
              type: 'personal',
              questions: [
                { id: 'p1', text: 'Waar verwacht jij misschien iets van je partner wat uiteindelijk alleen God kan geven?' },
                { id: 'p2', text: 'Wanneer maak jij de ander verantwoordelijk voor jouw geluk, rust, waarde of identiteit?' },
              ],
            },
            {
              id: 'samen',
              title: 'Samen bespreken',
              type: 'samen',
              questions: [
                { id: 's1', text: 'Wat als er geen liefde meer gevoeld wordt? Wat betekent trouw dan?' },
                { id: 's2', text: 'Wat als één van jullie steeds moet offeren? Hoe voorkom je dat offeren bitter, scheef of ongezond wordt?' },
                { id: 's3', text: 'Wanneer is volhouden heilig, en wanneer wordt volhouden ongezond?' },
                { id: 's4', text: 'Hebben jullie al meegemaakt dat dichter bij God komen ook dichter bij elkaar bracht? Wat gebeurde er toen?' },
                { id: 's5', text: 'Hoe groeien jullie concreet naar God toe?', hint: 'Bidden jullie samen? Lezen jullie samen uit de Bijbel? Praten jullie over geloof? Gaan jullie samen naar de kerk?' },
                { id: 's6', text: 'Wat zijn voor jullie signalen dat je hulp van buiten nodig hebt?' },
                { id: 's7', text: 'Aan wie zouden jullie toestemming willen geven om eerlijk met jullie mee te kijken als jullie vastlopen?' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
