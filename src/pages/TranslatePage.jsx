import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { translateText } from '../utils/translate';
import { speakLoop, stopSpeaking } from '../utils/speech';

const langOptions = [
  { value: 'ar', label: 'العربية' },
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
];

const SAVED_KEY = 'saved_translations';

function getSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveTrans(item) {
  const list = getSaved();
  list.unshift({ ...item, id: Date.now().toString() });
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  return list;
}

function deleteTrans(id) {
  const list = getSaved().filter(t => t.id !== id);
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  return list;
}

export default function TranslatePage() {
  const { t } = useLanguage();
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('fr');
  const [targetLang, setTargetLang] = useState('ar');
  const [loading, setLoading] = useState(false);
  const [activeLoop, setActiveLoop] = useState(null);
  const [saved, setSaved] = useState(() => getSaved());
  const [showSaved, setShowSaved] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setLoading(true);
    try {
      const result = await translateText(sourceText.trim(), sourceLang, targetLang);
      setTranslatedText(result.translation);
    } catch {
      setTranslatedText('');
    }
    setLoading(false);
  };

  const handleSpeak = (text, lang, key) => {
    if (activeLoop === key) {
      stopSpeaking();
      setActiveLoop(null);
      return;
    }
    stopSpeaking();
    setActiveLoop(key);
    speakLoop(text, lang, 1);
  };

  const handleSave = () => {
    if (!sourceText.trim() || !translatedText) return;
    const updated = saveTrans({
      source: sourceText.trim(),
      translation: translatedText,
      sourceLang,
      targetLang,
    });
    setSaved(updated);
  };

  const handleDelete = (id) => {
    const updated = deleteTrans(id);
    setSaved(updated);
  };

  const handleSwapLangs = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText('');
  };

  const handleSavedSpeak = (text, lang, id, type) => {
    const key = `saved-${id}-${type}`;
    if (activeLoop === key) {
      stopSpeaking();
      setActiveLoop(null);
      return;
    }
    stopSpeaking();
    setActiveLoop(key);
    speakLoop(text, lang, 1);
  };

  return (
    <div className="page translate-page">
      <h2>{t('translateTab')}</h2>

      <div className="translate-controls">
        <div className="translate-lang-row">
          <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
            {langOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button className="btn-icon" onClick={handleSwapLangs} title="Swap">⇄</button>
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            {langOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="translate-input-area">
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder={t('enterText')}
            rows={4}
            className="translate-textarea"
          />
          {sourceText && (
            <div className="translate-source-actions">
              <button
                className={`btn-icon ${activeLoop === 'source' ? 'active-loop' : ''}`}
                onClick={() => handleSpeak(sourceText, sourceLang, 'source')}
                title={activeLoop === 'source' ? t('stop') : t('normalSpeed')}
              >
                {activeLoop === 'source' ? '⏹️' : '🔊'}
              </button>
              <button className="btn-icon" onClick={() => { setSourceText(''); setTranslatedText(''); }} title={t('clearText')}>✕</button>
            </div>
          )}
        </div>

        <button
          className="btn btn-primary translate-btn"
          onClick={handleTranslate}
          disabled={loading || !sourceText.trim()}
        >
          {loading ? '⏳' : '🌐'} {t('translate')}
        </button>

        {translatedText && (
          <div className="translate-result">
            <div className="translate-result-header">
              <button
                className={`btn-icon ${activeLoop === 'target' ? 'active-loop' : ''}`}
                onClick={() => handleSpeak(translatedText, targetLang, 'target')}
                title={activeLoop === 'target' ? t('stop') : t('normalSpeed')}
              >
                {activeLoop === 'target' ? '⏹️' : '🔊'}
              </button>
              <button className="btn-icon" onClick={handleSave} title={t('save')}>💾</button>
            </div>
            <p className="translate-result-text">{translatedText}</p>
          </div>
        )}
      </div>

      <div className="saved-section">
        <button
          className="btn btn-secondary saved-toggle"
          onClick={() => setShowSaved(!showSaved)}
        >
          📋 {t('savedTranslations')} ({saved.length}) {showSaved ? '▲' : '▼'}
        </button>

        {showSaved && saved.length > 0 && (
          <div className="saved-list">
            {saved.map(item => (
              <div key={item.id} className="saved-item">
                <div className="saved-item-source">
                  <button
                    className={`btn-icon btn-icon-sm ${activeLoop === `saved-${item.id}-source` ? 'active-loop' : ''}`}
                    onClick={() => handleSavedSpeak(item.source, item.sourceLang, item.id, 'source')}
                  >
                    {activeLoop === `saved-${item.id}-source` ? '⏹️' : '🔊'}
                  </button>
                  <span>{item.source}</span>
                </div>
                <div className="saved-item-target">
                  <button
                    className={`btn-icon btn-icon-sm ${activeLoop === `saved-${item.id}-target` ? 'active-loop' : ''}`}
                    onClick={() => handleSavedSpeak(item.translation, item.targetLang, item.id, 'target')}
                  >
                    {activeLoop === `saved-${item.id}-target` ? '⏹️' : '🔊'}
                  </button>
                  <span>{item.translation}</span>
                </div>
                <button className="btn-icon btn-icon-sm btn-delete-saved" onClick={() => handleDelete(item.id)}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
