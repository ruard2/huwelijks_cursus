import { Deel } from './types'

export const deelB: Deel = {
  id: 'b',
  letter: 'B',
  title: 'Gods goede begin',
  subtitle: 'Deel B — Gods goede begin',
  intro: 'Dit blok gaat terug naar Genesis 1. Voordat schaamte, strijd en gebrokenheid binnenkomen, noemt God Zijn schepping goed. Man en vrouw dragen samen Zijn beeld. Lichaam, liefde, seksualiteit en vreugde horen bij Gods goede wereld.',
  color: '#16a34a',
  chapters: [
    {
      id: '3',
      number: 3,
      title: 'Geschapen naar Gods beeld',
      deelId: 'b',
      verse: { ref: 'Genesis 1:27', text: 'God schiep de mens naar Zijn beeld; mannelijk en vrouwelijk schiep Hij hen.', pretext: 'Lees Genesis 1:26-31' },
      intro: `Man en vrouw zijn beiden geschapen naar Gods beeld. Dat betekent: beiden even waardevol, even bijzonder, even uniek, even geroepen om iets van God zichtbaar te maken.

Gelijkwaardigheid betekent niet dat man en vrouw hetzelfde zijn. Het betekent wel dat de één nooit minder mens, minder stem, minder waardigheid of minder roeping heeft dan de ander.`,
      sections: [
        {
          id: 'personal',
          title: 'Persoonlijke reflectie',
          type: 'personal',
          questions: [
            { id: 'p1', text: 'Wat raakt jou in deze gedachte: dat jij naar Gods beeld geschapen bent?' },
            { id: 'p2', text: 'Wat raakt jou in de gedachte dat je partner naar Gods beeld geschapen is?' },
          ],
        },
        {
          id: 'samen',
          title: 'Samen bespreken',
          type: 'samen',
          questions: [
            { id: 's1', text: 'Ervaren jullie deze gelijkwaardigheid in jullie relatie? Waar wel? Waar misschien nog niet?' },
            { id: 's2', text: 'Wanneer voel jij je door de ander gezien als volwaardig mens?' },
            { id: 's3', text: 'Wanneer voel jij je kleiner, minder gehoord of minder serieus genomen?' },
            { id: 's4', text: 'Wat kan de ander concreet doen waardoor jij je meer geëerd voelt als beeld van God?' },
          ],
        },
      ],
    },
    {
      id: '4',
      number: 4,
      title: 'Het was zeer goed',
      deelId: 'b',
      verse: { ref: 'Genesis 1:31', text: 'En God zag al wat Hij gemaakt had, en zie, het was zeer goed.' },
      intro: `Na de schepping van man en vrouw klinkt: het is zeer goed. Gods schepping is compleet, rijk, mooi en vol bedoeling. Liefde, lichamelijkheid, eenheid, vruchtbaarheid, verbondenheid en vreugde horen bij Gods goede wereld.

Voor jullie voorgenomen huwelijk betekent dat: jullie liefde is niet maar een privéproject. Als jullie elkaar in trouw, vreugde en liefde ontvangen, is dat iets waar God met goedheid naar kijkt.`,
      sections: [
        {
          id: 'personal',
          title: 'Persoonlijke reflectie',
          type: 'personal',
          questions: [
            { id: 'p1', text: 'Hoe denk jij dat God naar jullie voorgenomen huwelijk kijkt?' },
            { id: 'p2', text: 'Kun je je voorstellen dat God tevreden glimlacht wanneer jullie straks als man en vrouw liefde, vreugde, veiligheid en lichamelijke nabijheid delen? Waarom wel of niet?' },
            { id: 'p3', text: 'Wat zou er in jullie huwelijk zichtbaar mogen worden van Gods goedheid?' },
          ],
        },
      ],
    },
    {
      id: '5',
      number: 5,
      title: 'Seksualiteit als deel van Gods goede schepping',
      deelId: 'b',
      verse: { ref: 'Genesis 1:28', text: 'God zegende hen en zei tegen hen: Wees vruchtbaar en word talrijk.' },
      intro: `God zegent man en vrouw in hun lichamelijkheid, vruchtbaarheid en seksuele eenheid. Seksualiteit komt niet uit de schaduw, maar uit Gods goede schepping.

Seks is niet vies, niet minder geestelijk, niet alleen gevaarlijk. Seksualiteit hoort bij Gods goede bedoeling met man en vrouw. Het is iets moois, iets goeds, iets om te ontvangen, te vieren en van te genieten.

Later in de Bijbel klinkt dat ook door in het Hooglied: liefde, verlangen, schoonheid en vreugde worden niet beschaamd weggeduwd, maar poëtisch bezongen.`,
      sections: [
        {
          id: 'personal',
          title: 'Persoonlijke reflectie',
          type: 'personal',
          questions: [
            {
              id: 'p1',
              text: 'Welke woorden komen als eerste bij jou op als je denkt aan seks?',
              type: 'checkbox',
              options: ['vreugde', 'spanning', 'schaamte', 'verlangen', 'angst', 'schoonheid', 'ongemak', 'intimiteit', 'verplichting', 'nieuwsgierigheid', 'pijn', 'cadeau', 'gevaar', 'vertrouwen'],
              other: true,
            },
          ],
        },
        {
          id: 'samen',
          title: 'Samen bespreken',
          type: 'samen',
          questions: [
            { id: 's1', text: 'Wat is jouw beeld van seks? Waar komt dat beeld vandaan?', hint: 'Denk aan thuis, kerk, vrienden, eerdere relaties, internet, cultuur, onderwijs, ervaringen, zwijgen of juist openheid.' },
            { id: 's2', text: 'Wat vind je mooi aan seksualiteit zoals God het bedoeld heeft?' },
            { id: 's3', text: 'Wat vind je spannend, kwetsbaar of ingewikkeld?' },
            { id: 's4', text: 'Kunnen jullie samen geloven dat God niet beschaamd wegkijkt van liefdevolle lichamelijke eenheid, maar dat Hij het goede ervan Zelf heeft bedacht?' },
          ],
        },
      ],
    },
  ],
}
