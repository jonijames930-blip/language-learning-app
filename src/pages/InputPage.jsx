import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { parseSentences, detectLanguage } from '../utils/speech';
import { saveLesson } from '../utils/storage';
import PhraseCard from '../components/PhraseCard';
import ListeningTest from '../components/ListeningTest';

export default function InputPage() {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [sentences, setSentences] = useState([]);
  const [detectedLang, setDetectedLang] = useState('');
  const [selectedLang, setSelectedLang] = useState('auto');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [lessonName, setLessonName] = useState('');
  const [notification, setNotification] = useState('');
  const [testMode, setTestMode] = useState(null);

  const handleParse = () => {
    if (!text.trim()) return;
    const parsed = parseSentences(text);
    setSentences(parsed);
    const lang = selectedLang === 'auto' ? detectLanguage(text) : selectedLang;
    setDetectedLang(lang);
  };

  const handleSave = () => {
    if (!lessonName.trim() || sentences.length === 0) return;
    saveLesson({
      name: lessonName,
      sentences,
      lang: detectedLang,
    });
    setShowSaveModal(false);
    setLessonName('');
    setNotification(t('savedSuccessfully'));
    setTimeout(() => setNotification(''), 3000);
  };

  const langOptions = [
    { value: 'auto', label: t('auto') },
    { value: 'ar', label: t('arabic') },
    { value: 'fr', label: t('french') },
    { value: 'en', label: t('english') },
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

  const isArabic = detectedLang === 'ar';

  if (testMode && sentences.length > 0) {
    if (isArabic) {
      return (
        <div className="page input-page">
          <div className="test-notice">
            <p>{t('listeningTest')} - {t('arabic')}</p>
            <p style={{ marginTop: '10px', opacity: 0.7 }}>
              اختبار الاستماع متاح فقط للغات الأجنبية
            </p>
            <button className="btn btn-secondary" onClick={() => setTestMode(null)}>
              {t('back')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="page input-page">
        <ListeningTest
          sentences={sentences}
          lang={detectedLang}
          testType={testMode}
          onClose={() => setTestMode(null)}
        />
      </div>
    );
  }

  return (
    <div className="page input-page">
      <div className="input-section">
        <div className="lang-selector">
          <label>{t('textLanguage')}:</label>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
          >
            {langOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('enterText')}
          rows={6}
          className="text-input"
        />
        <div className="input-actions">
          <button className="btn btn-primary" onClick={handleParse}>
            {t('parseText')}
          </button>
          {sentences.length > 0 && (
            <button className="btn btn-success" onClick={() => setShowSaveModal(true)}>
              {t('saveLesson')}
            </button>
          )}
        </div>
      </div>

      {detectedLang && sentences.length > 0 && (
        <div className="detected-lang">
          {t('detectLanguage')}: <strong>{detectedLang.toUpperCase()}</strong>
        </div>
      )}

      {notification && <div className="notification success">{notification}</div>}

      {sentences.length > 0 && !isArabic && (
        <div className="test-buttons">
          <button
            className="btn btn-accent"
            onClick={() => setTestMode('sentences')}
          >
            🎧 {t('sentenceListeningTest')}
          </button>
          <button
            className="btn btn-accent"
            onClick={() => setTestMode('words')}
          >
            🎧 {t('wordListeningTest')}
          </button>
        </div>
      )}

      <div className="phrases-section">
        {sentences.map((sentence, index) => (
          <PhraseCard
            key={`${sentence}-${index}`}
            sentence={sentence}
            lang={detectedLang}
            showDelete={false}
          />
        ))}
      </div>

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('saveLesson')}</h3>
            <input
              type="text"
              value={lessonName}
              onChange={(e) => setLessonName(e.target.value)}
              placeholder={t('enterLessonName')}
              className="input-lesson-name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSave}>
                {t('save')}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowSaveModal(false)}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
