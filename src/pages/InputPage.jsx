import { useState, useEffect } from 'react';
import { useLanguage } from '../context/useLanguage';
import { parseSentencesWithLang } from '../utils/speech';
import { saveLesson } from '../utils/storage';
import PhraseCard from '../components/PhraseCard';

const INPUT_TEXT_KEY = 'syrian_input_text_v2';
const INPUT_LANG_KEY = 'syrian_input_lang_v2';
const INPUT_SENTENCES_KEY = 'syrian_input_sentences_v2';

export default function InputPage() {
  const { t } = useLanguage();
  const [text, setText] = useState(() => localStorage.getItem(INPUT_TEXT_KEY) || '');
  const [phrases, setPhrases] = useState(() => {
    try {
      const saved = localStorage.getItem(INPUT_SENTENCES_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof parsed[0] === 'string') {
          return parsed.map(s => ({ text: s, lang: 'en' }));
        }
        return parsed;
      }
      return [];
    } catch { return []; }
  });
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem(INPUT_LANG_KEY) || 'auto');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [lessonName, setLessonName] = useState('');
  const [lessonTag, setLessonTag] = useState('');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    localStorage.setItem(INPUT_TEXT_KEY, text);
  }, [text]);

  useEffect(() => {
    localStorage.setItem(INPUT_LANG_KEY, selectedLang);
    if (text.trim() && phrases.length > 0) {
      const overrideLang = selectedLang === 'auto' ? null : selectedLang;
      const parsed = parseSentencesWithLang(text, overrideLang);
      setPhrases(parsed);
    }
  }, [selectedLang]);

  useEffect(() => {
    localStorage.setItem(INPUT_SENTENCES_KEY, JSON.stringify(phrases));
  }, [phrases]);

  const handleParse = () => {
    if (!text.trim()) return;
    const overrideLang = selectedLang === 'auto' ? null : selectedLang;
    const parsed = parseSentencesWithLang(text, overrideLang);
    setPhrases(parsed);
  };

  const handleClearText = () => {
    setText('');
    setPhrases([]);
  };

  const defaultTags = [
    t('beginner') || 'Beginner',
    t('dailyLife') || 'Daily Life',
    t('travel') || 'Travel',
    t('work') || 'Work',
    t('grammar') || 'Grammar',
  ];

  const handleSave = () => {
    if (!lessonName.trim() || phrases.length === 0) return;
    saveLesson({
      name: lessonName,
      sentences: phrases.map(p => p.text),
      phraseLangs: phrases.map(p => p.lang),
      lang: phrases[0]?.lang || 'en',
      tag: lessonTag || '',
    });
    setShowSaveModal(false);
    setLessonName('');
    setLessonTag('');
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
        <div className="textarea-wrapper">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('enterText')}
            rows={6}
            className="text-input"
          />
          {text && (
            <button
              className="btn-clear-text"
              onClick={handleClearText}
              title={t('clearText')}
            >
              ✕
            </button>
          )}
        </div>
        <div className="input-actions">
          <button className="btn btn-primary" onClick={handleParse}>
            {t('parseText')}
          </button>
          {phrases.length > 0 && (
            <button className="btn btn-success" onClick={() => setShowSaveModal(true)}>
              {t('saveLesson')}
            </button>
          )}
        </div>
      </div>

      {notification && <div className="notification success">{notification}</div>}

      <div className="phrases-section">
        {phrases.map((phrase, index) => (
          <PhraseCard
            key={`${phrase.text}-${index}`}
            sentence={phrase.text}
            lang={phrase.lang}
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
            <div className="tag-selector">
              {defaultTags.map(tag => (
                <button
                  key={tag}
                  className={`tag-btn ${lessonTag === tag ? 'active-tag' : ''}`}
                  onClick={() => setLessonTag(lessonTag === tag ? '' : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="tag-input-row">
              <input
                type="text"
                value={lessonTag}
                onChange={(e) => setLessonTag(e.target.value)}
                placeholder={t('customTag') || 'Custom tag...'}
              />
            </div>
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
