import { Deel } from './types'

export const deelA: Deel = {
  id: 'a',
  letter: 'A',
  title: 'God, jij en jullie',
  subtitle: 'Deel A — God, jij en jullie',
  intro: 'Voordat jullie over taken, rollen of praktische afspraken spreken, begint het werkboek bij de vraag: wie is God, wie ben jij, en wat verwacht je van de ander? Dit blok helpt om de ander als gave te ontvangen zonder hem of haar tot afgod te maken, en om te leren luisteren voor Gods aangezicht.',
  color: '#dc2626',
  chapters: [
    {
      id: '1',
      number: 1,
      title: 'Geen andere goden: je partner is gave, geen god',
      deelId: 'a',
      verse: { ref: 'Exodus 20:3', text: 'U zult geen andere goden voor Mijn aangezicht hebben.' },
      intro: `Een huwelijk begint met een eenvoudige maar diepe grens: alleen God mag God zijn.

Je partner is een gave van God. Iemand om te ontvangen, lief te hebben, te leren kennen en trouw te blijven. Maar juist een goede gave kan te groot worden. Dan verwacht je van de ander wat alleen God kan geven: diepe zekerheid, volmaakte liefde, blijvende rust, bevestiging, betekenis en geluk. Dat kan geen mens dragen.

Tim Keller wijst erop dat moderne romantische liefde vaak bijna een reddingsverhaal wordt. De ander moet mij compleet maken, mijn leegte vullen en mij laten voelen dat mijn leven klopt. Maar als de ander dat niet geeft, wordt liefde zwaar: je wordt teleurgesteld, boos, eisend of wanhopig.

God zegt niet: heb de ander minder lief. Hij zegt: maak van de ander geen god. Als je partner gave mag zijn, ontstaat er ruimte voor dankbaarheid, vrijheid en echte liefde.`,
      sections: [
        {
          id: 'personal',
          title: 'Persoonlijke reflectie',
          type: 'personal',
          questions: [
            {
              id: 'p1',
              text: 'Waar verwacht jij van je partner wat uiteindelijk alleen God kan geven?',
              hint: 'Denk aan: geluk, rust, bevestiging, veiligheid, waarde, richting, troost, erkenning of het gevoel dat je leven klopt.',
            },
            {
              id: 'p2',
              text: 'Wat gebeurt er in jou als de ander jou daarin teleurstelt?',
              hint: 'Denk aan: boos worden, eisen, controleren, vergelijken, dichtklappen, claimen, verwijten, verdriet wegstoppen of je terugtrekken.',
            },
            {
              id: 'p3',
              text: 'Waar zoek jij controle wanneer je eigenlijk vertrouwen en dankbaarheid zou moeten oefenen?',
            },
            {
              id: 'p4',
              text: 'Welke goede gave van de ander dreigt voor jou soms te groot te worden?',
              hint: 'Denk aan: aandacht, nabijheid, seks, begrip, succes, praktische hulp, emotionele steun, trouw, rust of bevestiging.',
            },
          ],
        },
        {
          id: 'samen',
          title: 'Samen bespreken',
          type: 'samen',
          questions: [
            {
              id: 's1',
              text: 'Herkennen jullie dat romantische verwachtingen soms zwaarder worden dan een mens kan dragen?',
            },
            {
              id: 's2',
              text: 'Waar maken jullie elkaar misschien onbedoeld verantwoordelijk voor geluk, rust, waarde of identiteit?',
            },
            {
              id: 's3',
              text: 'Waar lopen jullie het meeste risico dat de ander een soort afgod wordt?',
              hint: 'Denk aan: als de ander jou gelukkig moet maken, jou veilig moet laten voelen, jou altijd moet bevestigen, jouw leegte moet vullen, jouw pijn moet oplossen, of nooit mag tegenvallen.',
            },
            {
              id: 's4',
              text: 'Wat zou er veranderen als jullie elkaar meer ontvangen als gave van God, en minder belasten als bron van alles?',
            },
            {
              id: 's5',
              text: 'Wat helpt jullie om bij teleurstelling niet meteen te claimen, verwijten of terug te trekken, maar eerst terug te keren naar God?',
            },
          ],
        },
      ],
    },
    {
      id: '2',
      number: 2,
      title: 'Ontzag voor God: leren luisteren naar Hem en naar elkaar',
      deelId: 'a',
      verse: { ref: 'Spreuken 1:7', text: 'De vreze van de HEERE is het begin van de kennis.' },
      intro: `Goed luisteren begint niet met een goede techniek. Goed luisteren begint met ontzag voor God.

Ontzag voor God betekent: ik erken dat God God is, en ik niet. Hij mag spreken, onderbreken en corrigeren. Echte wijsheid begint waar een mens leert buigen.

Juist hier raakt ontzag voor God direct aan het huwelijk. Als ik niet leer luisteren naar God wanneer Hij anders spreekt, zal ik ook moeite hebben om naar mijn partner te luisteren wanneer die anders denkt of reageert.

Zonder ontzag ga je snel invullen: "Je bedoelt zeker..." / "Dat zeg je alleen omdat..." / "Maar ik bedoelde..." Dan hoor je niet meer wat de ander zegt. Maar wie voor God stil leert worden, kan ook bij de ander leren wachten: eerst ontvangen, eerst horen.`,
      sections: [
        {
          id: 'personal',
          title: 'Persoonlijke reflectie',
          type: 'personal',
          questions: [
            {
              id: 'p1',
              text: 'Waar vind jij het moeilijk om echt naar God te luisteren wanneer Hij anders spreekt dan jij verwacht?',
              hint: 'Denk aan: geboden die je liever relativeert, verlangens die sterker voelen dan gehoorzaamheid, of Bijbelse woorden die je wel kent maar niet echt wilt laten spreken.',
            },
            {
              id: 'p2',
              text: 'Wat gebeurt er in jou als Gods Woord botst met jouw gevoel, verlangen of gelijk?',
              hint: 'Denk aan: verzet, verdediging, controle willen houden, boosheid, schaamte, verdriet, of juist afsluiten.',
            },
            {
              id: 'p3',
              text: 'Waar merk jij dat je God soms vooral wilt laten bevestigen wat jij toch al vond?',
              hint: 'Denk aan: keuzes rond geld, tijd, seksualiteit, familie, carrière, kerk, vrijheid, comfort, of je eigen gelijk in conflicten.',
            },
            {
              id: 'p4',
              text: 'Wat gebeurt er in jou als je partner anders denkt, voelt of reageert dan jij verwacht?',
            },
            {
              id: 'p5',
              text: 'Waar merk jij dat je soms niet luistert om te begrijpen, maar om te reageren, te winnen of jezelf te verdedigen?',
            },
          ],
        },
        {
          id: 'samen',
          title: 'Samen bespreken',
          type: 'samen',
          questions: [
            {
              id: 's1',
              text: 'Herkennen jullie dit: dat luisteren moeilijker wordt wanneer God of de ander iets zegt wat schuurt?',
            },
            {
              id: 's2',
              text: 'Wat betekent ontzag voor God concreet voor jullie relatie?',
              hint: 'Waar mag God jullie echt tegenspreken? Waar mag Zijn Woord boven jullie gevoel, angst, verlangen of gelijk staan?',
            },
            {
              id: 's3',
              text: 'Hoe zou jullie relatie veranderen als jullie allebei dieper leren zeggen: God is God, en ik ben het niet?',
            },
            {
              id: 's4',
              text: 'Voel jij in jullie gesprekken dat de ander respect heeft voor jouw woorden, tempo en binnenwereld? Waar merk je dat wel of niet aan?',
            },
            {
              id: 's5',
              text: 'Welke zinnen gebruiken jullie soms waardoor de ander zich niet gehoord voelt?',
            },
            {
              id: 's6',
              text: 'Wat heb jij nodig om te voelen: mijn woorden worden ontvangen, niet meteen beoordeeld?',
            },
            {
              id: 's7',
              text: 'Maak samen deze zin af: Als wij leren luisteren naar God, ook wanneer Hij anders is dan wij verwachten, dan helpt dat ons om naar elkaar te luisteren doordat...',
              placeholder: 'Schrijf jullie antwoord hier...',
            },
          ],
        },
      ],
    },
  ],
}
