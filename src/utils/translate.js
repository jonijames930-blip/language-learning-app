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

function getTargetLangs(sourceLang) {
  if (sourceLang === 'ar') return ['en', 'fr'];
  if (sourceLang === 'en') return ['fr', 'ar'];
  if (sourceLang === 'fr') return ['en', 'ar'];
  return ['ar', 'fr', 'en'].filter(l => l !== sourceLang);
}

export async function getWordDetails(word, sourceLang) {
  const targetLangs = getTargetLangs(sourceLang);
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

  return results;
}

export async function getCommonPhrases(word, wordLang) {
  try {
    const response = await fetch(
      `${GOOGLE_TRANSLATE_API}?client=gtx&sl=${wordLang}&tl=ar&dt=t&dt=ex&dt=ss&q=${encodeURIComponent(word)}`
    );
    const data = await response.json();

    const phrases = [];

    if (data[13]) {
      for (const group of data[13]) {
        if (group[2]) {
          for (const example of group[2]) {
            if (example[0] && phrases.length < 6) {
              const original = example[0].replace(/<\/?b>/g, '');
              phrases.push({ text: original, lang: wordLang });
            }
          }
        }
      }
    }

    if (data[11]) {
      for (const synGroup of data[11]) {
        if (synGroup[1]) {
          for (const synSet of synGroup[1]) {
            if (synSet[3] && phrases.length < 6) {
              const example = synSet[3].replace(/<\/?b>/g, '');
              phrases.push({ text: example, lang: wordLang });
            }
          }
        }
      }
    }

    if (phrases.length === 0) {
      const templates = wordLang === 'fr'
        ? [
            `Pouvez-vous expliquer le mot "${word}"`,
            `Je cherche des exemples pour "${word}"`,
            `J'essaye de retenir le mot "${word}"`,
          ]
        : [
            `Can you explain the word "${word}"`,
            `I am looking for examples of "${word}"`,
            `I am trying to remember the word "${word}"`,
          ];
      for (const tmpl of templates) {
        phrases.push({ text: tmpl, lang: wordLang });
      }
    }

    const withTranslation = await Promise.all(
      phrases.map(async (p) => {
        try {
          const tr = await translateText(p.text, p.lang, 'ar');
          return { ...p, arabicTranslation: tr.translation };
        } catch {
          return { ...p, arabicTranslation: '' };
        }
      })
    );

    return withTranslation;
  } catch {
    return [];
  }
}

export function getGoogleClipArtUrl(word) {
  return `https://www.google.com/search?q=${encodeURIComponent(word + ' clipart')}&tbm=isch`;
}

export async function explainContext(sentence, sentenceLang) {
  try {
    const prompt = sentenceLang === 'fr'
      ? `Expliquez cette phrase en arabe de manière simple pour un étudiant: "${sentence}" - expliquez la grammaire, pourquoi chaque mot est utilisé, et les règles grammaticales.`
      : sentenceLang === 'en'
      ? `Explain this sentence in Arabic simply for a student: "${sentence}" - explain the grammar, why each word is used, and the grammatical rules.`
      : `اشرح هذه الجملة بشكل مبسط: "${sentence}" - اشرح القواعد والتركيب.`;

    const result = await translateText(prompt, sentenceLang === 'ar' ? 'ar' : sentenceLang, 'ar');
    if (result.translation && result.translation !== prompt) {
      return result.translation;
    }

    const directPrompt = sentenceLang === 'fr'
      ? `Grammaire de "${sentence}": `
      : `Grammar of "${sentence}": `;
    const directResult = await translateText(directPrompt, sentenceLang, 'ar');
    return directResult.translation || '';
  } catch {
    return '';
  }
}
