import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { speakLoop, stopSpeaking } from '../utils/speech';
import { getWordDetails, getGoogleClipArtUrl } from '../utils/translate';

export default function WordCard({ word, lang, onStopPhrase }) {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSpeed, setActiveSpeed] = useState(null);

  const handleTranslate = async () => {
    if (showDetails) {
      setShowDetails(false);
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
      stopSpeaking();
      setActiveSpeed(null);
      return;
    }
    if (onStopPhrase) onStopPhrase();
    stopSpeaking();
    setActiveSpeed(speed);
    speakLoop(word, lang, rate);
  };

  const langLabels = { ar: t('inArabic'), fr: t('inFrench'), en: t('inEnglish') };

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
      </span>

      {showDetails && details && (
        <div className="word-details">
          {['ar', 'fr', 'en'].map(targetLang => (
            details[targetLang] && (
              <div key={targetLang} className="translation-block">
                <h4>{langLabels[targetLang]}</h4>
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
          <button className="btn-close-details" onClick={() => setShowDetails(false)}>
            {t('close')}
          </button>
        </div>
      )}
    </span>
  );
}
