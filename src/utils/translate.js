const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

export async function translateText(text, fromLang, toLang) {
  try {
    const langMap = { ar: 'ar', fr: 'fr', en: 'en', es: 'es', de: 'de', it: 'it', pt: 'pt', ru: 'ru', zh: 'zh-CN', ja: 'ja', ko: 'ko', tr: 'tr', hi: 'hi', nl: 'nl', sv: 'sv' };
    const from = langMap[fromLang] || fromLang;
    const to = langMap[toLang] || toLang;

    const response = await fetch(
      `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
    );
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData) {
      const mainTranslation = data.responseData.translatedText;
      const alternatives = data.matches
        ? data.matches
            .filter(m => m.translation !== mainTranslation)
            .map(m => m.translation)
            .filter((v, i, a) => a.indexOf(v) === i)
            .slice(0, 5)
        : [];

      return {
        translation: mainTranslation,
        alternatives,
      };
    }
    return { translation: text, alternatives: [] };
  } catch {
    return { translation: text, alternatives: [] };
  }
}

export async function getWordDetails(word, sourceLang) {
  const targetLangs = ['ar', 'fr', 'en'].filter(l => l !== sourceLang);

  const results = {};

  const translations = await Promise.all(
    targetLangs.map(async (targetLang) => {
      const result = await translateText(word, sourceLang, targetLang);
      return { lang: targetLang, ...result };
    })
  );

  for (const t of translations) {
    results[t.lang] = {
      translation: t.translation,
      meanings: [t.translation, ...t.alternatives].slice(0, 5),
    };
  }

  if (sourceLang !== 'ar' && !results.ar) {
    results.ar = { translation: word, meanings: [word] };
  }
  if (sourceLang !== 'fr' && !results.fr) {
    results.fr = { translation: word, meanings: [word] };
  }
  if (sourceLang !== 'en' && !results.en) {
    results.en = { translation: word, meanings: [word] };
  }

  return results;
}

export function getGoogleClipArtUrl(word) {
  return `https://www.google.com/search?q=${encodeURIComponent(word + ' clipart')}&tbm=isch`;
}
