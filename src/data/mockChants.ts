import { Chant } from '../types';

export const mockChants: Chant[] = [
  {
    id: "1",
    title: "Resurrectional Apolytikion",
    titleGreek: "Ἀπολυτίκιον Ἀναστάσιμον",
    tone: "Tone 1",
    feast: "Sunday",
    service: "Matins",
    part: "Apolytikion",
    language: "Greek",
    pdfPath: "/chants/apolytikion-tone1.pdf"
  },
  {
    id: "2",
    title: "Cherubic Hymn",
    titleGreek: "Χερουβικὸν",
    tone: "Tone 5",
    feast: "Divine Liturgy",
    service: "Divine Liturgy",
    part: "Cherubikon",
    language: "Greek",
    pdfPath: "/chants/cherubikon.pdf"
  },
  {
    id: "3",
    title: "Paschal Troparion",
    titleGreek: "Χριστὸς ἀνέστη",
    tone: "Tone 5",
    feast: "Pascha",
    service: "Paschal Services",
    part: "Troparion",
    language: "Greek",
    pdfPath: "/chants/pascha-troparion.pdf"
  },
  {
    id: "4",
    title: "Theotokion",
    titleGreek: "Θεοτοκίον",
    tone: "Tone 2",
    feast: "Theotokos",
    service: "Vespers",
    part: "Theotokion",
    language: "Greek",
    pdfPath: "/chants/theotokion-tone2.pdf"
  },
  {
    id: "5",
    title: "Great Doxology",
    titleGreek: "Δοξολογία Μεγάλη",
    tone: "Tone 1",
    feast: "General",
    service: "Matins",
    part: "Doxology",
    language: "Greek",
    pdfPath: "/chants/great-doxology.pdf"
  },
  {
    id: "6",
    title: "Kontakion of the Nativity",
    titleGreek: "Κοντάκιον τῆς Χριστοῦ Γεννήσεως",
    tone: "Tone 3",
    feast: "Nativity of Christ",
    service: "Matins",
    part: "Kontakion",
    language: "Greek",
    pdfPath: "/chants/nativity-kontakion.pdf"
  },
  {
    id: "7",
    title: "Vespers Stichera",
    titleGreek: "Στιχηρὰ Ἑσπερινοῦ",
    tone: "Tone 4",
    feast: "Sunday",
    service: "Vespers",
    part: "Stichera",
    language: "Greek",
    pdfPath: "/chants/vespers-stichera.pdf"
  },
  {
    id: "8",
    title: "Axion Estin",
    titleGreek: "Ἄξιον ἐστίν",
    tone: "Tone 8",
    feast: "Theotokos",
    service: "Divine Liturgy",
    part: "Megalynarion",
    language: "Greek",
    pdfPath: "/chants/axion-estin.pdf"
  }
];

export const phoneticsChants: Chant[] = [
  {
    id: "p1",
    title: "Al-Masih Qam",
    titleGreek: "المسيح قام",
    tone: "Tone 5",
    feast: "Pascha",
    service: "Paschal Services",
    part: "Troparion",
    language: "Arabic",
    pdfPath: "/chants/arabic/al-masih-qam.pdf",
    hasPhonetics: true,
    phoneticsText: "Al-ma-SEEH QAM min BAY-nal AM-WAT, wa-WA-ti-al MAW-ta bil-MAWT, wal-la-DHEE-na fil-qu-BOOR, a-TA-hum al-ha-YAT."
  },
  {
    id: "p2",
    title: "Ya Rabb Al-Quwat",
    titleGreek: "يا رب القوات",
    tone: "Tone 2",
    feast: "General",
    service: "Divine Liturgy",
    part: "Cherubikon",
    language: "Arabic",
    pdfPath: "/chants/arabic/ya-rabb-al-quwat.pdf",
    hasPhonetics: true,
    phoneticsText: "Ya RAB-bal qu-WAT, KUN ma-A-na, fa-in-NA-hu LAY-sa LA-na fi al-SHA-da-id, mu-EEN si-WAK."
  },
  {
    id: "p3",
    title: "Qaddisuka Ya Allah",
    titleGreek: "قديسك يا الله",
    tone: "Tone 1",
    feast: "General",
    service: "Divine Liturgy",
    part: "Trisagion",
    language: "Arabic",
    pdfPath: "/chants/arabic/qaddisuka.pdf",
    hasPhonetics: true,
    phoneticsText: "Qad-dee-SU-ka ya Al-LAH, qad-dee-SU-ka ya qa-WEE, qad-dee-SU-ka ya man LA ya-MOOT, ir-HAM-na."
  },
  {
    id: "p4",
    title: "Innahum Yahtafoon",
    titleGreek: "إنهم يهتفون",
    tone: "Tone 8",
    feast: "Theotokos",
    service: "Matins",
    part: "Megalynarion",
    language: "Arabic",
    pdfPath: "/chants/arabic/innahum-yahtafoon.pdf",
    hasPhonetics: true,
    phoneticsText: "In-na-HUM yah-ta-FOON bi-ki ya WAL-i-dat al-I-LAH, in-na-HUM yu-maj-ji-DOO-nak."
  }
];

export const compositionsChants: Chant[] = [
  {
    id: "c1",
    title: "Polyeleos",
    titleGreek: "Πολυέλεος",
    tone: "Tone 1",
    feast: "General",
    service: "Matins",
    part: "Polyeleos",
    language: "Greek",
    pdfPath: "/chants/compositions/polyeleos.pdf",
    composer: "Petros Lampadarios",
    category: "Matins"
  },
  {
    id: "c2",
    title: "Kekragaria",
    titleGreek: "Κεκραγάρια",
    tone: "Tone 4",
    feast: "General",
    service: "Vespers",
    part: "Kekragaria",
    language: "Greek",
    pdfPath: "/chants/compositions/kekragaria.pdf",
    composer: "Traditional",
    category: "Vespers"
  },
  {
    id: "c3",
    title: "Communion Hymn",
    titleGreek: "Κοινωνικόν",
    tone: "Tone 2",
    feast: "Sunday",
    service: "Divine Liturgy",
    part: "Koinonikon",
    language: "Greek",
    pdfPath: "/chants/compositions/koinonikon.pdf",
    composer: "Gregorios Protopsaltis",
    category: "Divine Liturgy"
  },
  {
    id: "c4",
    title: "Alleluia",
    titleGreek: "Ἀλληλούια",
    tone: "Tone 2",
    feast: "General",
    service: "Divine Liturgy",
    part: "Alleluia",
    language: "Greek",
    pdfPath: "/chants/compositions/alleluia.pdf",
    composer: "Traditional",
    category: "Divine Liturgy"
  },
  {
    id: "c5",
    title: "Anixantaria",
    titleGreek: "Ἀνοιξαντάρια",
    tone: "Tone 5",
    feast: "General",
    service: "Vespers",
    part: "Anixantaria",
    language: "Greek",
    pdfPath: "/chants/compositions/anixantaria.pdf",
    composer: "Ioannis Protopsaltis",
    category: "Vespers"
  }
];

// Filter options for the sidebar
export const filterOptions = {
  feasts: [
    "All Feasts",
    "Pascha",
    "Nativity of Christ",
    "Theophany",
    "Transfiguration",
    "Annunciation",
    "Palm Sunday",
    "Ascension",
    "Pentecost",
    "Dormition",
    "Elevation of the Cross",
    "Theotokos",
    "Sunday",
    "General"
  ],
  services: [
    "All Services",
    "Vespers",
    "Matins",
    "Divine Liturgy",
    "Hours",
    "Compline",
    "Paschal Services"
  ],
  parts: [
    "All Parts",
    "Apolytikion",
    "Kontakion",
    "Troparion",
    "Stichera",
    "Theotokion",
    "Cherubikon",
    "Doxology",
    "Megalynarion",
    "Koinonikon",
    "Polyeleos",
    "Kekragaria",
    "Anixantaria",
    "Alleluia",
    "Trisagion"
  ],
  tones: [
    "All Tones",
    "Tone 1",
    "Tone 2",
    "Tone 3",
    "Tone 4",
    "Tone 5",
    "Tone 6",
    "Tone 7",
    "Tone 8"
  ],
  languages: [
    "All Languages",
    "Greek",
    "Arabic",
    "English",
    "Church Slavonic"
  ]
};
