import { Deel } from './types'

export const deelD: Deel = {
  id: 'd',
  letter: 'D',
  title: 'Verlaten, hechten, één worden',
  subtitle: 'Deel D — Verlaten, hechten, één worden',
  intro: 'Genesis 2 beschrijft drie bewegingen: losmaken, hechten en één vlees worden. Dit blok helpt jullie ontdekken wat je meeneemt uit je geschiedenis, wat het betekent om een nieuw wij te worden, en hoe kwetsbaarheid en schaamte onder Gods genade aan het licht mogen komen.',
  color: '#9333ea',
  chapters: [
    {
      id: '9',
      number: 9,
      title: 'Losmaken',
      deelId: 'd',
      verse: { ref: 'Genesis 2:24', text: 'Daarom zal een man zijn vader en zijn moeder verlaten en zich aan zijn vrouw hechten; en zij zullen tot één vlees zijn.' },
      intro: `Je komt niet zonder geschiedenis het huwelijk binnen. Je neemt je gezin van herkomst mee: gewoontes, pijn, warmte, patronen, verwachtingen, manieren van praten, omgaan met geld, conflict, geloof en emoties.

Trouwen vraagt dat je vader en moeder eert, maar niet door hen geregeerd wordt. Je laat niet je geschiedenis verdwijnen, maar je leert wel: mijn partner wordt mijn nieuwe eerste menselijke verbondenheid.`,
      sections: [
        {
          id: 'personal',
          title: 'Persoonlijke reflectie',
          type: 'personal',
          questions: [
            { id: 'p1', text: 'Welke goede dingen neem jij mee uit je gezin van herkomst?' },
            { id: 'p2', text: 'Welke moeilijke dingen neem jij mee uit je gezin van herkomst?' },
            {
              id: 'p3',
              text: 'Welke ongeschreven familiewetten neem jij mee?',
              hint: 'Voorbeelden: "Wij praten niet over gevoelens." / "Je moet sterk zijn." / "Geld moet altijd veilig zijn." / "Conflict is gevaarlijk." / "Je mag niemand teleurstellen." / "Liefde moet vanzelf gaan." / "Je vraagt geen hulp."',
              placeholder: 'Mijn familiewetten...',
            },
          ],
        },
        {
          id: 'samen',
          title: 'Samen bespreken',
          type: 'samen',
          questions: [
            { id: 's1', text: 'Waar merken jullie dat jullie gezinnen van herkomst nog invloed hebben op jullie relatie?' },
            { id: 's2', text: 'Waar zie jij bij mij nog oude loyaliteit aan mijn ouders of familie?' },
            { id: 's3', text: 'Waar vind jij het moeilijk om mij echt op de eerste plaats te zetten?' },
            { id: 's4', text: 'Hoe kunnen jullie je ouders eren zonder door hen bepaald te worden?' },
          ],
        },
      ],
    },
    {
      id: '10',
      number: 10,
      title: 'Hechten: de grootsheid van de trouwbelofte',
      deelId: 'd',
      intro: `Hechten is meer dan verliefd zijn. Het is leren zeggen: jij bent mijn nieuwe eerste menselijke verbondenheid. Wij worden een nieuw "wij".

Hechten betekent: ik houd jou niet op afstand zolang ik nog twijfel. Ik verbind mij aan jou. Niet tijdelijk, niet zolang het gevoel sterk is, maar als een verbond.

Dat maakt het huwelijk groot. Je belooft niet alleen liefde op een mooie dag, maar trouw voor alle dagen die komen. Je zegt eigenlijk: ik wil niet alleen jouw vreugde delen, maar ook jouw kwetsbaarheid dragen.`,
      sections: [
        {
          id: 'personal',
          title: 'Persoonlijke reflectie',
          type: 'personal',
          questions: [
            { id: 'p1', text: 'Wat betekent voor jou: "Ik kies jou"?' },
            { id: 'p2', text: 'Wat vind jij mooi aan de gedachte dat het huwelijk bedoeld is voor altijd?' },
            { id: 'p3', text: 'Wat vind jij spannend aan de gedachte dat het huwelijk bedoeld is voor altijd?' },
            { id: 'p4', text: 'Wat roept het woord "verbond" bij jou op?' },
          ],
        },
        {
          id: 'samen',
          title: 'Samen bespreken',
          type: 'samen',
          questions: [
            { id: 's1', text: 'Zijn jullie toe aan deze geestelijke commitment? Hoe merk je dat?' },
            { id: 's2', text: 'Wat maakt deze belofte voor jullie mooi en groot?' },
            { id: 's3', text: 'Wat maakt deze belofte voor jullie spannend of kwetsbaar?' },
            { id: 's4', text: 'Hoe durven jullie deze belofte eigenlijk aan?', hint: 'Denk aan: vertrouwen op God, karakter van de ander, bereidheid om te leren, gemeenschap om jullie heen, vergeving, gebed, trouw en hulp zoeken.' },
            { id: 's5', text: 'Welke belofte geef je eigenlijk als je trouwt? Probeer die in eigen woorden te formuleren.', placeholder: 'Ik beloof jou...' },
          ],
        },
      ],
    },
    {
      id: '11',
      number: 11,
      title: 'Eén vlees en naakt zonder schaamte',
      deelId: 'd',
      verse: { ref: 'Genesis 2:24-25', text: '...en zij zullen tot één vlees zijn. En zij waren beiden naakt, de mens en zijn vrouw, maar zij schaamden zich niet.' },
      intro: `Man en vrouw worden één — over het geheel van het huwelijk: leven, lichaam, ziel, toekomst, naam, huis, tijd, geld, vreugde, pijn, geloof en seksualiteit.

Naakt zonder schaamte is het ideaal: lichamelijk en geestelijk gekend zijn zonder angst. Niets hoeven verbergen. Niet bang zijn dat de ander je gebruikt, veracht, uitlacht, verlaat of veroordeelt.

Naakt zonder schaamte gaat niet alleen over lichamen. Het gaat ook over ziel, geschiedenis, zwakte, verlangen, zonde, pijn en kwetsbaarheid.

Dit hoofdstuk opent het thema kwetsbaarheid. De diepere uitwerking van seksualiteit, lichaam en verlangen komt in Deel E terug.`,
      sections: [
        {
          id: 'personal',
          title: 'Persoonlijke reflectie',
          type: 'personal',
          questions: [
            { id: 'p1', text: 'Wat raakt jou in de gedachte dat man en vrouw niet alleen samenleven, maar werkelijk één worden?' },
            { id: 'p2', text: 'Waar verlang jij naar als je denkt aan "naakt zonder schaamte": lichamelijk, geestelijk of emotioneel?' },
            { id: 'p3', text: 'Waar schaam jij je snel voor of waar ben je bang niet volledig gekend te kunnen worden?' },
          ],
        },
        {
          id: 'samen',
          title: 'Samen bespreken',
          type: 'samen',
          questions: [
            { id: 's1', text: 'Wat hebben jullie nodig om een veilige plaats voor elkaar te worden?' },
            { id: 's2', text: 'Wat helpt jou om eerlijk te durven zijn zonder meteen veroordeeld, gerepareerd of ondervraagd te worden?' },
            { id: 's3', text: 'Hoe kunnen jullie elkaar helpen om schaamte niet te laten regeren, maar samen in het licht te komen?' },
          ],
        },
      ],
    },
  ],
}
