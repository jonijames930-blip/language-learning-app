import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const isNative = Capacitor.isNativePlatform();

const LANG_CODES = {
  ar: 'ar-SA',
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
  ru: 'ru-RU',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  tr: 'tr-TR',
  hi: 'hi-IN',
  nl: 'nl-NL',
  sv: 'sv-SE',
};

export function getLangCode(lang) {
  return LANG_CODES[lang] || lang;
}

export async function speak(text, lang, rate = 1, onEnd = null) {
  if (isNative) {
    try {
      await TextToSpeech.speak({
        text,
        lang: getLangCode(lang),
        rate,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
      });
      if (onEnd) onEnd();
    } catch {
      if (onEnd) onEnd();
    }
  } else {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLangCode(lang);
    utterance.rate = rate;
    if (onEnd) {
      utterance.onend = onEnd;
    }
    window.speechSynthesis.speak(utterance);
    return utterance;
  }
}

export function speakLoop(text, lang, rate = 1, count = 3) {
  let current = 0;
  const speakNext = () => {
    if (current < count) {
      current++;
      speak(text, lang, rate, speakNext);
    }
  };
  speakNext();
}

export async function stopSpeaking() {
  if (isNative) {
    try {
      await TextToSpeech.stop();
    } catch {
      // ignore
    }
  } else {
    window.speechSynthesis.cancel();
  }
}

export function detectLanguage(text) {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  const frenchSpecial = /[àâçéèêëïîôùûüÿœæ]/i;
  const cjkRegex = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/;
  const cyrillicRegex = /[\u0400-\u04FF]/;
  const koreanRegex = /[\uAC00-\uD7AF]/;
  const devanagariRegex = /[\u0900-\u097F]/;

  if (arabicRegex.test(text)) return 'ar';
  if (cjkRegex.test(text)) return 'zh';
  if (cyrillicRegex.test(text)) return 'ru';
  if (koreanRegex.test(text)) return 'ko';
  if (devanagariRegex.test(text)) return 'hi';

  const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'est', 'sont', 'dans', 'pour', 'avec', 'sur', 'que', 'qui', 'ce', 'cette', 'nous', 'vous', 'ils', 'elles', 'je', 'tu', 'il', 'elle', 'mon', 'ton', 'son', 'mes', 'tes', 'ses', 'notre', 'votre', 'leur'];
  const spanishWords = ['el', 'la', 'los', 'las', 'de', 'del', 'en', 'es', 'son', 'un', 'una', 'que', 'por', 'con', 'para', 'como', 'pero', 'más', 'este', 'esta', 'estos', 'yo', 'tú', 'él', 'ella', 'nosotros'];
  const germanWords = ['der', 'die', 'das', 'ein', 'eine', 'ist', 'sind', 'und', 'oder', 'aber', 'mit', 'für', 'auf', 'von', 'den', 'dem', 'des', 'nicht', 'ich', 'du', 'er', 'sie', 'wir'];
  const italianWords = ['il', 'lo', 'la', 'le', 'gli', 'un', 'una', 'di', 'del', 'della', 'che', 'è', 'sono', 'per', 'con', 'come', 'ma', 'non', 'io', 'tu', 'lui', 'lei', 'noi'];
  const turkishWords = ['bir', 've', 'bu', 'için', 'ile', 'olan', 'var', 'çok', 'gibi', 'daha', 'sonra', 'ben', 'sen', 'biz', 'siz', 'onlar'];

  const words = text.toLowerCase().split(/\s+/);
  const countMatches = (wordList) => words.filter(w => wordList.includes(w)).length;

  if (frenchSpecial.test(text)) return 'fr';

  const scores = {
    fr: countMatches(frenchWords),
    es: countMatches(spanishWords),
    de: countMatches(germanWords),
    it: countMatches(italianWords),
    tr: countMatches(turkishWords),
  };

  const maxLang = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b));
  if (maxLang[1] > 0) return maxLang[0];

  return 'en';
}

export function parseSentences(text) {
  return text
    .split(/[.!?。！？\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export function parseWords(sentence) {
  return sentence
    .split(/[\s,;:]+/)
    .map(w => w.replace(/^["""''«»()[\]{}]+|["""''«»()[\]{}]+$/g, '').trim())
    .filter(w => w.length > 0);
}
