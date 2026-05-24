const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single';

export async function translateText(text, fromLang, toLang) {
  try {
    const response = await fetch(
      `${GOOGLE_TRANSLATE_API}?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&dt=at&q=${encodeURIComponent(text)}`
    );
    const data = await response.json();

    const mainTranslation = data[0]
      ? data[0].map(item => item[0]).filter(Boolean).join('')
      : text;

    const alternatives = [];
    if (data[5] && data[5][0] && data[5][0][2]) {
      for (const alt of data[5][0][2]) {
        if (alt[0] && alt[0] !== mainTranslation && alternatives.length < 5) {
          alternatives.push(alt[0]);
        }
      }
    }

    return {
      translation: mainTranslation,
      alternatives,
    };
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
