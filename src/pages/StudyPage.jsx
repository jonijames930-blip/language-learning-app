import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { getLessons, updateLesson } from '../utils/storage';
import { detectLanguage } from '../utils/speech';
import PhraseCard from '../components/PhraseCard';
import ListeningTest from '../components/ListeningTest';
import WordScrambleTest from '../components/WordScrambleTest';
import AudioCatchGame from '../components/AudioCatchGame';

function buildPhrases(lesson, langOverride) {
  return lesson.sentences.map((s, i) => {
    if (langOverride && langOverride !== 'auto') {
      return { text: s, lang: langOverride };
    }
    return {
      text: s,
      lang: lesson.phraseLangs?.[i] || detectLanguage(s),
    };
  });
}

const langOptions = [
  { value: 'auto', label: 'Auto' },
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

export default function StudyPage() {
  const { t } = useLanguage();
  const [lessons, setLessons] = useState(() => getLessons());
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [testMode, setTestMode] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [notification, setNotification] = useState('');
  const [langOverride, setLangOverride] = useState('auto');

  const handleSelectLesson = (lesson) => {
    setSelectedLesson(lesson);
    setLangOverride(lesson.langOverride || 'auto');
  };

  const handleSaveName = () => {
    if (!editName.trim() || !selectedLesson) return;
    const updated = updateLesson(selectedLesson.id, { name: editName.trim() });
    setLessons(updated);
    setSelectedLesson({ ...selectedLesson, name: editName.trim() });
    setEditingName(false);
    setNotification(t('updateSuccess'));
    setTimeout(() => setNotification(''), 3000);
  };

  const handleChangeLang = (newLang) => {
    if (!selectedLesson) return;
    setLangOverride(newLang);
    if (newLang === 'auto') {
      const phraseLangs = selectedLesson.sentences.map(s => detectLanguage(s));
      const updated = updateLesson(selectedLesson.id, { phraseLangs, lang: phraseLangs[0] || 'en', langOverride: 'auto' });
      setLessons(updated);
      setSelectedLesson(updated.find(l => l.id === selectedLesson.id));
    } else {
      const phraseLangs = selectedLesson.sentences.map(() => newLang);
      const updated = updateLesson(selectedLesson.id, { phraseLangs, lang: newLang, langOverride: newLang });
      setLessons(updated);
      setSelectedLesson(updated.find(l => l.id === selectedLesson.id));
    }
    setNotification(t('updateSuccess'));
    setTimeout(() => setNotification(''), 3000);
  };

  if (testMode && selectedLesson) {
    const phrases = buildPhrases(selectedLesson, langOverride);
    const nonArabic = phrases.filter(p => p.lang !== 'ar');

    if (nonArabic.length === 0) {
      return (
        <div className="page study-page">
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

    if (testMode === 'scramble') {
      return (
        <div className="page study-page">
          <WordScrambleTest
            phrases={nonArabic}
            onClose={() => setTestMode(null)}
          />
        </div>
      );
    }

    if (testMode === 'audiocatch') {
      return (
        <div className="page study-page">
          <AudioCatchGame
            phrases={nonArabic}
            onClose={() => setTestMode(null)}
          />
        </div>
      );
    }

    return (
      <div className="page study-page">
        <ListeningTest
          phrases={nonArabic}
          testType={testMode}
          onClose={() => setTestMode(null)}
        />
      </div>
    );
  }

  if (selectedLesson) {
    const phrases = buildPhrases(selectedLesson, langOverride);
    const hasNonArabic = phrases.some(p => p.lang !== 'ar');

    return (
      <div className="page study-page">
        <div className="study-header">
          <button className="btn btn-secondary" onClick={() => { setSelectedLesson(null); setEditingName(false); }}>
            ← {t('back')}
          </button>
          {editingName ? (
            <div className="edit-name-row">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input-edit-name"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
              />
              <button className="btn btn-primary btn-small" onClick={handleSaveName}>{t('save')}</button>
              <button className="btn btn-secondary btn-small" onClick={() => setEditingName(false)}>{t('cancel')}</button>
            </div>
          ) : (
            <div className="lesson-title-row">
              <h2>{selectedLesson.name}</h2>
              <button
                className="btn-icon btn-icon-sm"
                onClick={() => { setEditName(selectedLesson.name); setEditingName(true); }}
                title={t('editName')}
              >
                ✏️
              </button>
            </div>
          )}
        </div>

        <div className="study-lang-selector">
          <label>{t('textLanguage')}:</label>
          <select
            value={langOverride}
            onChange={(e) => handleChangeLang(e.target.value)}
          >
            {langOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {notification && <div className="notification success">{notification}</div>}

        {hasNonArabic && (
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
            <button
              className="btn btn-accent"
              onClick={() => setTestMode('scramble')}
            >
              🧩 {t('wordScramble')}
            </button>
            <button
              className="btn btn-accent"
              onClick={() => setTestMode('audiocatch')}
            >
              🎯 {t('audioCatch') || 'Audio Catch'}
            </button>
          </div>
        )}

        <div className="phrases-section">
          {phrases.map((phrase, index) => (
            <PhraseCard
              key={`${phrase.text}-${index}-${phrase.lang}`}
              sentence={phrase.text}
              lang={phrase.lang}
              showDelete={false}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page study-page">
      <h2>{t('studyTab')}</h2>

      {lessons.length === 0 ? (
        <div className="empty-state">
          <p>{t('noLessons')}</p>
        </div>
      ) : (
        <div className="lessons-list">
          <p className="select-hint">{t('selectLesson')}</p>
          {lessons.map(lesson => (
            <div
              key={lesson.id}
              className="lesson-card clickable"
              onClick={() => handleSelectLesson(lesson)}
            >
              <div className="lesson-info">
                <h3>{lesson.name}</h3>
                <span className="lesson-meta">
                  {lesson.sentences.length} {t('phrases')}
                </span>
              </div>
              <div className="lesson-actions">
                <button className="btn btn-primary btn-small">
                  {t('study')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
