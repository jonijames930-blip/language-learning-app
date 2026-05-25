import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { speakLoop, stopSpeaking } from '../utils/speech';
import { getWordDetails, getCommonPhrases, getGoogleClipArtUrl } from '../utils/translate';
import DrawingCanvas from './DrawingCanvas';

export default function WordCard({ word, lang, onStopPhrase }) {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSpeed, setActiveSpeed] = useState(null);
  const [showPhrases, setShowPhrases] = useState(false);
  const [phrases, setPhrases] = useState(null);
  const [phrasesLoading, setPhrasesLoading] = useState(false);
  const [phraseLoopId, setPhraseLoopId] = useState(null);
  const [transLoopId, setTransLoopId] = useState(null);
  const [showDrawing, setShowDrawing] = useState(false);

  const stopAll = () => {
    stopSpeaking();
    setActiveSpeed(null);
    setPhraseLoopId(null);
    setTransLoopId(null);
  };

  const handleTranslate = async () => {
    if (showDetails) {
      setShowDetails(false);
      stopAll();
      return;
    }
    setLoading(true);
    try {
      const result = await getWordDetails(word, lang);
      setDetails(result);
      setShowDetails(true);
    } catch {
      setDetails(null);
    }
    setLoading(false);
  };

  const handleSpeak = (rate) => {
    const speed = rate < 1 ? 'slow' : 'normal';
    if (activeSpeed === speed) {
      stopAll();
      return;
    }
    if (onStopPhrase) onStopPhrase();
    stopAll();
    setActiveSpeed(speed);
    speakLoop(word, lang, rate);
  };

  const handleTransSpeak = (text, transLang, key) => {
    if (transLoopId === key) {
      stopAll();
      return;
    }
    stopAll();
    setTransLoopId(key);
    speakLoop(text, transLang, 1);
  };

  const handlePhrases = async () => {
    if (showPhrases) {
      setShowPhrases(false);
      stopAll();
      return;
    }
    if (lang === 'ar') return;
    setPhrasesLoading(true);
    try {
      const result = await getCommonPhrases(word, lang);
      setPhrases(result);
      setShowPhrases(true);
    } catch {
      setPhrases(null);
    }
    setPhrasesLoading(false);
  };

  const handlePhraseSpeak = (phraseText, phraseLang, index) => {
    if (phraseLoopId === index) {
      stopAll();
      return;
    }
    stopAll();
    setPhraseLoopId(index);
    speakLoop(phraseText, phraseLang, 1);
  };

  const langLabels = { ar: t('inArabic'), fr: t('inFrench'), en: t('inEnglish') };

  const targetLangs = lang === 'ar' ? ['en', 'fr']
    : lang === 'en' ? ['fr', 'ar']
    : lang === 'fr' ? ['en', 'ar']
    : ['ar', 'fr', 'en'].filter(l => l !== lang);

  return (
    <span className="word-card">
      <span className="word-text">{word}</span>
      <span className="word-actions">
        <button
          className={`btn-icon btn-speak-slow ${activeSpeed === 'slow' ? 'active-loop' : ''}`}
          onClick={() => handleSpeak(0.6)}
          title={activeSpeed === 'slow' ? t('stop') || 'Stop' : t('slowSpeed')}
        >
          {activeSpeed === 'slow' ? '⏹️' : '🐢'}
        </button>
        <button
          className={`btn-icon btn-speak-normal ${activeSpeed === 'normal' ? 'active-loop' : ''}`}
          onClick={() => handleSpeak(1)}
          title={activeSpeed === 'normal' ? t('stop') || 'Stop' : t('normalSpeed')}
        >
          {activeSpeed === 'normal' ? '⏹️' : '🔊'}
        </button>
        <button
          className="btn-icon btn-image"
          onClick={() => window.open(getGoogleClipArtUrl(word), '_blank')}
          title={t('searchImages')}
        >
          🖼️
        </button>
        <button
          className="btn-icon btn-translate"
          onClick={handleTranslate}
          disabled={loading}
          title={t('translate')}
        >
          {loading ? '⏳' : '🌐'}
        </button>
        {lang !== 'ar' && (
          <button
            className="btn-icon btn-phrases"
            onClick={handlePhrases}
            disabled={phrasesLoading}
            title={t('commonPhrases')}
          >
            {phrasesLoading ? '⏳' : '💬'}
          </button>
        )}
        <button
          className="btn-icon btn-draw"
          onClick={() => setShowDrawing(true)}
          title={t('draw') || 'Draw'}
        >
          🖊️
        </button>
      </span>

      {showDetails && details && (
        <div className="word-details">
          {targetLangs.map(targetLang => (
            details[targetLang] && (
              <div key={targetLang} className="translation-block">
                <div className="translation-header">
                  <h4>{langLabels[targetLang]}</h4>
                  <button
                    className={`btn-icon btn-icon-sm ${transLoopId === targetLang ? 'active-loop' : ''}`}
                    onClick={() => handleTransSpeak(details[targetLang].translation, targetLang, targetLang)}
                    title={transLoopId === targetLang ? t('stop') || 'Stop' : t('normalSpeed')}
                  >
                    {transLoopId === targetLang ? '⏹️' : '🔊'}
                  </button>
                </div>
                <p className="main-translation">{details[targetLang].translation}</p>
                {details[targetLang].meanings && details[targetLang].meanings.length > 1 && (
                  <div className="meanings">
                    <span className="label">{t('commonMeanings')}:</span>
                    <ul>
                      {details[targetLang].meanings.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          ))}
          <button className="btn-close-details" onClick={() => { setShowDetails(false); stopAll(); }}>
            {t('close')}
          </button>
        </div>
      )}

      {showPhrases && phrases && phrases.length > 0 && (
        <div className="word-details phrases-list">
          <h4>💬 {t('commonPhrases')}</h4>
          {phrases.map((p, i) => (
            <div key={i} className="phrase-example">
              <div className="phrase-example-row">
                <button
                  className={`btn-icon ${phraseLoopId === i ? 'active-loop' : ''}`}
                  onClick={() => handlePhraseSpeak(p.text, p.lang, i)}
                  title={phraseLoopId === i ? t('stop') || 'Stop' : t('normalSpeed')}
                >
                  {phraseLoopId === i ? '⏹️' : '🔊'}
                </button>
                <span className="phrase-example-text">{p.text}</span>
              </div>
              {p.arabicTranslation && (
                <p className="phrase-example-arabic">{p.arabicTranslation}</p>
              )}
            </div>
          ))}
          <button className="btn-close-details" onClick={() => { setShowPhrases(false); stopAll(); }}>
            {t('close')}
          </button>
        </div>
      )}
      {showDrawing && (
        <DrawingCanvas
          phrase={word}
          storageKey={`word_${word}`}
          onClose={() => setShowDrawing(false)}
        />
      )}
    </span>
  );
}
