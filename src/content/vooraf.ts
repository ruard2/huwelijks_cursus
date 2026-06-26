import { Deel } from './types'

export const vooraf: Deel = {
  id: 'vooraf',
  title: 'Vooraf',
  subtitle: 'Vooraf — Hoe gebruik je dit werkboek?',
  intro: 'Voor je begint: een korte uitleg over hoe dit werkboek werkt en wat je ervan kunt verwachten.',
  color: '#6366f1',
  chapters: [
    {
      id: 'vooraf',
      number: '—',
      title: 'Hoe gebruik je dit werkboek?',
      deelId: 'vooraf',
      intro: `Dit werkboek helpt jullie om niet alleen over trouwen te praten, maar samen te ontdekken wat God bedoelt met liefde, eenheid, trouw, lichaam, schaamte, familie, geschiedenis en moeilijke tijden.

Het is geen toets. Het doel is niet dat jullie overal meteen het perfecte antwoord op hebben. Het doel is dat jullie eerlijk leren spreken, aandachtig leren luisteren en woorden vinden voor wat anders vaag blijft.

Sommige vragen kunnen direct beantwoord worden. Andere vragen openen iets waar jullie later op terugkomen. Dat is goed. Niet alles hoeft vanavond af.

Werkafspraak: Voel je vrij om vragen over te slaan die nu te groot zijn. Noteer ze wel, zodat jullie er later op terug kunnen komen.`,
      sections: [
        {
          id: 'vragen',
          title: 'Openingsvragen',
          type: 'personal',
          questions: [
            {
              id: 'q1',
              text: 'Welke vraag hoop jij dat dit werkboek bij jullie openlegt?',
            },
            {
              id: 'q2',
              text: 'Waar zie je naar uit, en waar zie je tegenop?',
            },
          ],
        },
      ],
    },
  ],
}
