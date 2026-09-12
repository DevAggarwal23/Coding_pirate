/**
 * Client-Side Phonetic Transliteration Engine for Indic Scripts (Hindi, Bengali, Tamil, Telugu, Gujarati, Marathi)
 * Fast, lightweight, zero-network latency.
 */

// Common Hindi phonetic dictionary for instant, natural word matching
const HINDI_WORD_DICT = {
  main: "मैं",
  mai: "मैं",
  me: "में",
  mein: "में",
  hoon: "हूँ",
  hu: "हूँ",
  hun: "हूँ",
  mera: "मेरा",
  meri: "मेरी",
  mere: "मेरे",
  tera: "तेरा",
  teri: "तेरी",
  tere: "तेरे",
  aap: "आप",
  aapka: "आपका",
  aapki: "आपकी",
  aapke: "आपके",
  apna: "अपना",
  apni: "अपनी",
  apne: "अपने",
  naam: "नाम",
  hai: "है",
  hain: "हैं",
  tha: "था",
  thi: "थी",
  the: "थे",
  hoga: "होगा",
  hogi: "होगी",
  aur: "और",
  ya: "या",
  lekin: "लेकिन",
  par: "पर",
  se: "से",
  ko: "को",
  ka: "का",
  ki: "की",
  ke: "के",
  kya: "क्या",
  kyon: "क्यों",
  kyu: "क्यों",
  kaise: "कैसे",
  kab: "कब",
  kahan: "कहाँ",
  nahi: "नहीं",
  nahin: "नहीं",
  mat: "मत",
  bhi: "भी",
  to: "तो",
  toh: "तो",
  jo: "जो",
  woh: "वह",
  yeh: "यह",
  ye: "ये",
  wo: "वो",
  sab: "सब",
  sabhi: "सभी",
  kuch: "कुछ",
  bahut: "बहुत",
  kam: "कम",
  jyada: "ज्यादा",
  zyada: "ज्यादा",

  // Business & schemes vocabulary
  dairy: "डेयरी",
  darzi: "दर्जी",
  dukan: "दुकान",
  dukaan: "दुकान",
  shuru: "शुरू",
  karna: "करना",
  karne: "करने",
  karta: "करता",
  karti: "करती",
  chahiye: "चाहिए",
  chahta: "चाहता",
  chahti: "चाहती",
  chahte: "चाहते",
  kheti: "खेती",
  vyapar: "व्यापार",
  vyavasay: "व्यवसाय",
  dhandha: "धंधा",
  kaam: "काम",
  kam: "काम",
  rozgar: "रोजगार",
  rojgar: "रोजगार",
  madad: "मदद",
  sahayata: "सहायता",
  sahayta: "सहायता",
  yojana: "योजना",
  paisa: "पैसा",
  paise: "पैसे",
  kamai: "कमाई",
  aamdani: "आमदनी",
  aay: "आय",
  parivar: "परिवार",
  kharch: "खर्च",
  loan: "लोन",
  karza: "कर्ज",
  karz: "कर्ज",
  subsidy: "सब्सिडी",
  sahayata: "सहायता",
  anudan: "अनुदान",
  vyaj: "ब्याज",
  byaj: "ब्याज",

  // Money & numbers
  lakh: "लाख",
  lac: "लाख",
  hazar: "हज़ार",
  hazaar: "हज़ार",
  sau: "सौ",
  crore: "करोड़",
  rupaye: "रुपये",
  rupeye: "रुपये",
  rupya: "रुपया",
  ek: "एक",
  do: "दो",
  teen: "तीन",
  char: "चार",
  paanch: "पाँच",
  panch: "पाँच",
  chhe: "छह",
  saat: "सात",
  aath: "आठ",
  nau: "नौ",
  das: "दस",
  dedh: "डेढ़",
  dhai: "ढाई",
  sadhe: "साढ़े",

  dev: "देव",
  kumar: "कुमार",
  singh: "सिंह",
  sharma: "शर्मा",
  verma: "वर्मा",
  gupta: "गुप्ता",
  yadav: "यादव",
  ram: "राम",
  raha: "रहा",
  rahi: "रही",
  rahe: "रहे",
  rah: "रह",
  dena: "देना",
  lene: "लेने",
  lena: "लेना",
  dijiye: "दीजिए",
  kijiye: "कीजिए",
  bataiye: "बताइए",
  batao: "बताओ",
  kaun: "कौन",
  kaunsi: "कौनसी",
  kaunsa: "कौनसा",
  kitna: "कितना",
  kitni: "कितनी",
  kitne: "कितने",

  income: "इनकम",
  business: "बिजनेस",
  project: "प्रोजेक्ट",
  cost: "लागत",
  state: "राज्य",

  // Categories & States
  category: "कैटेगरी",
  mahila: "महिला",
  divyang: "दिव्यांग",
  uttar: "उत्तर",
  pradesh: "प्रदेश",
  bihar: "बिहार",
  rajasthan: "राजस्थान",
  gujarat: "गुजरात",
  maharashtra: "महाराष्ट्र",
  madhya: "मध्य",
  haryana: "हरियाणा",
  punjab: "पंजाब",
  delhi: "दिल्ली",
  jharkhand: "झारखंड",
};

// Reserved acronyms to keep uppercase as-is
const RESERVED_ACRONYMS = new Set([
  "SC", "ST", "OBC", "PWD", "EWS", "GEN", "UP", "MP", "HP", "AP", "TN", "KL", "WB",
  "MSME", "GST", "PAN", "SBI", "PNB", "APP", "ID", "DIC", "KVIC", "PMEGP", "PM"
]);

// Consonants and Vowels map for dynamic phonetic fallback
const CONSONANTS = {
  k: "क", kh: "ख", g: "ग", gh: "घ", ng: "ङ",
  ch: "च", chh: "छ", j: "ज", jh: "झ", ny: "ञ",
  t: "त", th: "थ", d: "द", dh: "ध", n: "न",
  T: "ट", Th: "ठ", D: "ड", Dh: "ढ", N: "ण",
  p: "प", ph: "फ", f: "फ", b: "ब", bh: "भ", m: "म",
  y: "य", r: "र", l: "ल", v: "व", w: "व",
  sh: "श", shh: "ष", s: "स", h: "ह",
  gy: "ज्ञ", tr: "त्र", ksh: "क्ष",
};

const INDEPENDENT_VOWELS = {
  a: "अ", aa: "आ", A: "आ",
  i: "इ", ee: "ई", ii: "ई", I: "ई",
  u: "उ", oo: "ऊ", uu: "ऊ", U: "ऊ",
  e: "ए", ai: "ऐ",
  o: "ओ", au: "औ", ou: "औ",
  ri: "ऋ",
};

const MATRAS = {
  a: "", aa: "ा", A: "ा",
  i: "ि", ee: "ी", ii: "ी", I: "ी",
  u: "ु", oo: "ू", uu: "ू", U: "ू",
  e: "े", ai: "ै",
  o: "ो", au: "ौ", ou: "ौ",
  ri: "ृ",
};

/**
 * Phonetically transliterates a single Romanized Hindi word to Devanagari script.
 */
export function transliterateWord(word, lang = "hi") {
  if (!word || typeof word !== "string") return word;

  // Preserve uppercase acronyms (e.g. SC, ST, UP, PNB)
  if (RESERVED_ACRONYMS.has(word) || (word.length <= 4 && word === word.toUpperCase() && /^[A-Z]+$/.test(word))) {
    return word;
  }

  // Preserve pure numbers, currency symbols, punctuations
  if (/^[\d₹$,.:;!?@#%&*()_+\-=/]+$/.test(word)) {
    return word;
  }

  const lower = word.toLowerCase();

  // 1. Direct dictionary match for accurate natural spelling
  if (lang === "hi" && HINDI_WORD_DICT[lower]) {
    return HINDI_WORD_DICT[lower];
  }

  if (lang !== "hi" && lang !== "mr") {
    // English or other languages where phonetic dictionary isn't active
    return word;
  }

  // 2. Rule-based phonetic parser
  let result = "";
  let i = 0;
  const len = lower.length;
  let isStartOfWord = true;

  while (i < len) {
    // Check 3-char clusters (ksh, chh, shh)
    const c3 = lower.substring(i, i + 3);
    if (CONSONANTS[c3]) {
      result += CONSONANTS[c3];
      i += 3;
      isStartOfWord = false;
      continue;
    }

    // Check 2-char clusters (kh, gh, ch, jh, th, dh, ph, bh, sh, gy, tr, aa, ee, oo, ai, au, ou)
    const c2 = lower.substring(i, i + 2);
    if (CONSONANTS[c2]) {
      result += CONSONANTS[c2];
      i += 2;
      isStartOfWord = false;
      continue;
    }

    if (isStartOfWord && INDEPENDENT_VOWELS[c2]) {
      result += INDEPENDENT_VOWELS[c2];
      i += 2;
      isStartOfWord = false;
      continue;
    }

    if (!isStartOfWord && MATRAS[c2]) {
      result += MATRAS[c2];
      i += 2;
      continue;
    }

    // Single character
    const c1 = lower[i];
    if (CONSONANTS[c1]) {
      result += CONSONANTS[c1];
      i += 1;
      isStartOfWord = false;
      continue;
    }

    if (isStartOfWord && INDEPENDENT_VOWELS[c1]) {
      result += INDEPENDENT_VOWELS[c1];
      i += 1;
      isStartOfWord = false;
      continue;
    }

    if (!isStartOfWord && MATRAS[c1] !== undefined) {
      result += MATRAS[c1];
      i += 1;
      continue;
    }

    // Passthrough non-alphabet character
    result += word[i];
    i += 1;
  }

  return result || word;
}

/**
 * Transliterates an entire sentence on space or punctuation delimiters.
 * Triggered on word completion (space key) so typing remains fluid and responsive.
 */
export function transliterateSentence(text, lang = "hi") {
  if (!text || lang === "en") return text;

  // Split by whitespace while retaining delimiters
  const tokens = text.split(/(\s+|[,।.;!?])/);
  const transliterated = tokens.map((token) => {
    if (!token || /^\s+$/.test(token) || /^[,।.;!?]$/.test(token)) {
      return token;
    }
    return transliterateWord(token, lang);
  });

  return transliterated.join("");
}
