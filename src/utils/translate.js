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

function getDictionaryTemplates(word) {
  return [
    { category: 'meaning', fr: `Que signifie le mot "${word}" ?`, en: `What does the word "${word}" mean?`, ar: `ماذا تعني كلمة "${word}"؟` },
    { category: 'meaning', fr: `Je ne comprends pas le mot "${word}".`, en: `I don't understand the word "${word}".`, ar: `لا أفهم كلمة "${word}".` },
    { category: 'memory', fr: `J'essaie de retenir le mot "${word}".`, en: `I am trying to remember the word "${word}".`, ar: `أحاول حفظ كلمة "${word}".` },
    { category: 'memory', fr: `Je dois répéter le mot "${word}" pour ne pas l'oublier.`, en: `I need to repeat the word "${word}" so I don't forget it.`, ar: `يجب أن أكرر كلمة "${word}" لكي لا أنساها.` },
    { category: 'memory', fr: `Je mémorise le mot "${word}".`, en: `I am memorizing the word "${word}".`, ar: `أنا أحفظ كلمة "${word}".` },
    { category: 'usage', fr: `Comment utiliser le mot "${word}" dans une phrase ?`, en: `How do I use the word "${word}" in a sentence?`, ar: `كيف أستخدم كلمة "${word}" في جملة؟` },
    { category: 'usage', fr: `Peux-tu donner un exemple avec "${word}" ?`, en: `Can you give an example with "${word}"?`, ar: `هل يمكنك إعطاء مثال على "${word}"؟` },
    { category: 'usage', fr: `J'utilise le mot "${word}" dans une phrase.`, en: `I use the word "${word}" in a sentence.`, ar: `أستخدم كلمة "${word}" في جملة.` },
    { category: 'form', fr: `Comment se prononce "${word}" ?`, en: `How is "${word}" pronounced?`, ar: `كيف تُنطق "${word}"؟` },
    { category: 'form', fr: `Est-ce difficile d'écrire "${word}" ?`, en: `Is it difficult to write "${word}"?`, ar: `هل من الصعب كتابة "${word}"؟` },
    { category: 'deep', fr: `Est-ce que "${word}" est un mot courant ?`, en: `Is "${word}" a common word?`, ar: `هل "${word}" كلمة شائعة؟` },
    { category: 'deep', fr: `Dans quel contexte utilise-t-on "${word}" ?`, en: `In what context is "${word}" used?`, ar: `في أي سياق تُستعمل "${word}"؟` },
    { category: 'revision', fr: `Je révise le mot "${word}".`, en: `I am reviewing the word "${word}".`, ar: `أراجع كلمة "${word}".` },
    { category: 'revision', fr: `Je n'oublie pas le mot "${word}".`, en: `I don't forget the word "${word}".`, ar: `لا أنسى كلمة "${word}".` },
    { category: 'explain', fr: `Pouvez-vous expliquer le mot "${word}"`, en: `Can you explain the word "${word}"`, ar: `هل يمكنك شرح كلمة "${word}"` },
  ];
}

export function getCommonPhrases(word, wordLang) {
  const templates = getDictionaryTemplates(word);
  const phrases = templates.map(t => ({
    text: t[wordLang] || t.fr,
    lang: wordLang,
    arabicTranslation: wordLang === 'ar' ? '' : t.ar,
    category: t.category,
  }));
  return phrases;
}

export function getGoogleClipArtUrl(word) {
  return `https://www.google.com/search?q=${encodeURIComponent(word + ' clipart')}&tbm=isch`;
}

function getContextTargetLangs(sentenceLang) {
  if (sentenceLang === 'fr') return ['ar', 'en'];
  if (sentenceLang === 'ar') return ['fr', 'en'];
  if (sentenceLang === 'en') return ['ar', 'fr'];
  return ['ar', 'fr', 'en'].filter(l => l !== sentenceLang);
}

export async function explainContext(sentence, sentenceLang) {
  try {
    const targetLangs = getContextTargetLangs(sentenceLang);
    const results = await Promise.all(
      targetLangs.map(async (targetLang) => {
        const result = await translateText(sentence, sentenceLang, targetLang);
        return { lang: targetLang, text: result.translation || '' };
      })
    );
    return results;
  } catch {
    return [];
  }
}
