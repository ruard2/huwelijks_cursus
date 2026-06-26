import { Deel } from './types'

export const deelC: Deel = {
  id: 'c',
  letter: 'C',
  title: 'De ander ontvangen',
  subtitle: 'Deel C — De ander ontvangen',
  intro: 'Hier verschuift de aandacht van mens-zijn in het algemeen naar deze concrete ander. Wie is de mens die God jou geeft? Waarin herken je de ander, waarin vult hij of zij jou aan, en kun je de andersheid van de ander ontvangen als gave?',
  color: '#0891b2',
  chapters: [
    {
      id: '6',
      number: 6,
      title: 'Niet goed dat de mens alleen is',
      deelId: 'c',
      verse: { ref: 'Genesis 2:18', text: 'Het is niet goed dat de mens alleen is.', pretext: 'Lees Genesis 2:18-25' },
      intro: `Voor het eerst in de Bijbel klinkt: "niet goed." Niet omdat de mens mislukt is, maar omdat de mens niet bedoeld is als geïsoleerd wezen. De mens is gemaakt voor relatie, ontmoeting, liefde, hulp, gemeenschap en verbondenheid.

God laat de man in Genesis 2 als het ware zelf ontdekken dat hij alleen is. De dieren komen voorbij, maar er is geen gelijke tegenover hem.`,
      sections: [
        {
          id: 'personal',
          title: 'Persoonlijke reflectie',
          type: 'personal',
          questions: [
            { id: 'p1', text: 'Wanneer heb jij ontdekt: ik ben niet bedoeld om alleen door het leven te gaan?' },
            { id: 'p2', text: 'Hoe heeft God jullie laten ontdekken dat jullie bij elkaar passen?' },
          ],
        },
        {
          id: 'samen',
          title: 'Samen bespreken',
          type: 'samen',
          questions: [
            { id: 's1', text: 'Waarin zijn jullie nu rijker dan voorheen?', hint: 'Niet omdat een ongehuwd mens half is, maar omdat jullie in deze relatie iets ontvangen wat jullie alleen niet op dezelfde manier zouden ontvangen.' },
            { id: 's2', text: 'Wat brengt de ander in jouw leven naar boven dat je zonder hem/haar minder zou leren?', hint: 'Denk aan: rust, moed, vreugde, eerlijkheid, geduld, geloof, zachtheid, volwassenheid, relativering, verantwoordelijkheid.' },
            { id: 's3', text: 'Waarin maakt de ander jou mooier?' },
          ],
        },
      ],
    },
    {
      id: '7',
      number: 7,
      title: 'De verrukking van herkenning',
      deelId: 'c',
      verse: { ref: 'Genesis 2:23', text: 'Eindelijk een gelijk aan mij, mijn eigen gebeente, mijn eigen vlees, een die zal heten: vrouw, een uit een man gebouwd.' },
      intro: `De eerste reactie van de man is verrukking. Eindelijk iemand tegenover hem die bij hem past. Iemand in wie hij herkenning vindt. Geen kopie van hemzelf, maar een echte ander die toch bij hem hoort.

Diep in de relatie tussen man en vrouw ligt deze herkenning: jij bent anders dan ik, maar toch pas je bij mij. Jij bent niet zomaar iemand. Jij bent mij gegeven.`,
      sections: [
        {
          id: 'personal',
          title: 'Persoonlijke reflectie',
          type: 'personal',
          questions: [
            { id: 'p1', text: 'Wat herkende jij in de ander toen jullie relatie groeide?' },
            { id: 'p2', text: 'Wanneer dacht je: ja, jij past bij mij?' },
          ],
        },
        {
          id: 'samen',
          title: 'Samen bespreken',
          type: 'samen',
          questions: [
            { id: 's1', text: 'Waarom past de ander bij jou?' },
            { id: 's2', text: 'Welke verschillen tussen jullie zijn mooi?' },
            { id: 's3', text: 'Welke verschillen tussen jullie kunnen later ook spanning geven?' },
            { id: 's4', text: 'Hoe kunnen jullie leren om verschil niet meteen als bedreiging te zien, maar als iets waardoor je elkaar aanvult en vormt?' },
          ],
        },
      ],
    },
    {
      id: '8',
      number: 8,
      title: 'Helper: aan elkaar gegeven',
      deelId: 'c',
      verse: { ref: 'Genesis 2:18', text: 'Ik zal een hulp voor hem maken, iemand die bij hem past.' },
      intro: `Het woord "helper" betekent niet: assistent, ondergeschikte of hulpje. In de Bijbel wordt God Zelf ook Helper genoemd. Helper zijn is iets sterks, eervols en dieps.

De andersheid van de ander is vaak eerst aantrekkelijk, maar later ook irritant. Zijn rust wordt traagheid. Haar gevoeligheid wordt ingewikkeld. Zijn duidelijkheid wordt hardheid. Juist daar wordt liefde concreet: kun je de ander blijven ontvangen als gave van God, ook waar de ander niet precies past in jouw voorkeur?`,
      sections: [
        {
          id: 'personal',
          title: 'Persoonlijke reflectie',
          type: 'personal',
          questions: [
            { id: 'p1', text: 'Waar heb jij hulp nodig van je partner?' },
            { id: 'p2', text: 'Waarin vult je partner jou aan juist doordat hij/zij anders is dan jij?' },
            { id: 'p3', text: 'Welke andersheid van je partner vond je eerst mooi of aantrekkelijk?' },
            { id: 'p4', text: 'Welke andersheid van je partner vind je soms moeilijk, irritant of spannend?' },
            { id: 'p5', text: 'Waar vind jij het moeilijk om hulp te ontvangen?' },
            { id: 'p6', text: 'Waar vind jij het moeilijk dat de ander niet denkt, voelt of reageert zoals jij?' },
          ],
        },
        {
          id: 'samen',
          title: 'Samen bespreken',
          type: 'samen',
          questions: [
            {
              id: 's1',
              text: 'Kunnen jullie concreet benoemen hoe jullie elkaars helper zijn?',
              type: 'parts',
              parts: [
                { id: 'ik', label: 'Ik help jou door:', placeholder: 'Schrijf hier...' },
                { id: 'jij', label: 'Jij helpt mij door:', placeholder: 'Schrijf hier...' },
              ],
            },
            { id: 's2', text: 'Waarin is de andersheid van de ander een gave voor jou?' },
            { id: 's3', text: 'Waarin voelt de andersheid van de ander soms als bedreiging, ongemak of correctie?' },
            { id: 's4', text: 'Mag de ander echt anders zijn dan jij, of probeer je hem/haar soms toch naar jouw beeld te vormen?' },
            { id: 's5', text: 'Waarin hoop je dat de ander jou de komende jaren helpt groeien?' },
            { id: 's6', text: 'Waarin moet jouw partner jou misschien ook durven tegenspreken?' },
            {
              id: 's7',
              text: 'Hoe reageren jullie meestal als de ander je tegenspreekt of corrigeert?',
              type: 'checkbox',
              options: ['ik luister echt', 'ik verdedig mezelf', 'ik word stil', 'ik word boos', 'ik voel me afgewezen', 'ik ga uitleggen waarom ik toch gelijk heb', 'ik trek me terug', 'ik ga pleasen', 'ik word onzeker'],
              other: true,
            },
            { id: 's8', text: 'Wat zou helpen om correctie van de ander niet meteen als aanval te ervaren, maar soms als hulp van God?' },
          ],
        },
      ],
    },
  ],
}
