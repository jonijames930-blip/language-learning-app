import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { getLessons, updateLesson } from '../utils/storage';
import { detectLanguage, stopSpeaking } from '../utils/speech';
import PhraseCard from '../components/PhraseCard';
import ListeningTest from '../components/ListeningTest';
import WordScrambleTest from '../components/WordScrambleTest';
import AudioCatchGame from '../components/AudioCatchGame';
import GrammarDefenderGame from '../components/GrammarDefenderGame';
import FastMatchGame from '../components/FastMatchGame';

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
  const [editingSentenceIdx, setEditingSentenceIdx] = useState(null);
  const [editSentenceText, setEditSentenceText] = useState('');
  const [preGameMode, setPreGameMode] = useState(null);
  const [gameSourceLang, setGameSourceLang] = useState('');
  const [gameTargetLang, setGameTargetLang] = useState('');

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

  const handleEditSentence = (index) => {
    setEditingSentenceIdx(index);
    setEditSentenceText(selectedLesson.sentences[index]);
  };

  const handleSaveSentence = () => {
    if (editingSentenceIdx === null || !selectedLesson) return;
    const newSentences = [...selectedLesson.sentences];
    newSentences[editingSentenceIdx] = editSentenceText.trim();
    const newPhraseLangs = newSentences.map(s => detectLanguage(s));
    const updated = updateLesson(selectedLesson.id, { sentences: newSentences, phraseLangs: newPhraseLangs });
    setLessons(updated);
    setSelectedLesson(updated.find(l => l.id === selectedLesson.id));
    setEditingSentenceIdx(null);
    setEditSentenceText('');
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

  if (preGameMode && !testMode && selectedLesson) {
    const defaultSrc = langOverride !== 'auto' ? langOverride : (selectedLesson.phraseLangs?.[0] || detectLanguage(selectedLesson.sentences[0] || '') || 'fr');
    const srcLang = gameSourceLang || defaultSrc;
    const tgtOpts = langOptions.filter(o => o.value !== 'auto' && o.value !== srcLang);
    const tgtLang = gameTargetLang || (srcLang === 'fr' ? 'en' : srcLang === 'en' ? 'fr' : 'en');

    return (
      <div className="page study-page">
        <div className="pre-game-settings">
          <h2>⚙️ {t('gameSettings') || 'Game Settings'}</h2>
          <div className="pre-game-field">
            <label>{t('textLanguage') || 'Langue du texte'}:</label>
            <select value={srcLang} onChange={(e) => {
              setGameSourceLang(e.target.value);
              if (e.target.value === gameTargetLang) setGameTargetLang('');
            }}>
              {langOptions.filter(o => o.value !== 'auto').map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="pre-game-field">
            <label>{t('targetLanguage') || 'Langue cible'}:</label>
            <select value={tgtLang} onChange={(e) => setGameTargetLang(e.target.value)}>
              {tgtOpts.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="pre-game-actions">
            <button className="btn btn-primary" onClick={() => {
              setGameSourceLang(srcLang);
              setGameTargetLang(tgtLang);
              setTestMode(preGameMode);
            }}>▶️ {t('start') || 'Start'}</button>
            <button className="btn btn-secondary" onClick={() => setPreGameMode(null)}>← {t('back')}</button>
          </div>
        </div>
      </div>
    );
  }

  if (testMode && selectedLesson) {
    const srcLangFinal = gameSourceLang || langOverride;
    const tgtLangFinal = gameTargetLang || 'en';
    const phrases = buildPhrases(selectedLesson, srcLangFinal !== 'auto' ? srcLangFinal : langOverride);
    const nonArabic = phrases;

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
            onClose={() => { setTestMode(null); setPreGameMode(null); }}
          />
        </div>
      );
    }

    if (testMode === 'audiocatch') {
      return (
        <div className="page study-page">
          <AudioCatchGame
            phrases={nonArabic}
            onClose={() => { setTestMode(null); setPreGameMode(null); }}
          />
        </div>
      );
    }

    if (testMode === 'grammardefender') {
      return (
        <div className="page study-page">
          <GrammarDefenderGame
            phrases={nonArabic}
            targetLang={tgtLangFinal}
            onClose={() => { setTestMode(null); setPreGameMode(null); }}
          />
        </div>
      );
    }

    if (testMode === 'fastmatch') {
      return (
        <div className="page study-page">
          <FastMatchGame
            phrases={nonArabic}
            targetLang={tgtLangFinal}
            onClose={() => { setTestMode(null); setPreGameMode(null); }}
          />
        </div>
      );
    }

    return (
      <div className="page study-page">
        <ListeningTest
          phrases={nonArabic}
          testType={testMode}
          onClose={() => { setTestMode(null); setPreGameMode(null); }}
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
              onClick={() => { setPreGameMode('sentences'); const dl = langOverride !== 'auto' ? langOverride : (selectedLesson.phraseLangs?.[0] || 'fr'); setGameSourceLang(dl); setGameTargetLang(dl === 'fr' ? 'en' : 'fr'); }}
            >
              🎧 {t('sentenceListeningTest')}
            </button>
            <button
              className="btn btn-accent"
              onClick={() => { setPreGameMode('words'); const dl = langOverride !== 'auto' ? langOverride : (selectedLesson.phraseLangs?.[0] || 'fr'); setGameSourceLang(dl); setGameTargetLang(dl === 'fr' ? 'en' : 'fr'); }}
            >
              🎧 {t('wordListeningTest')}
            </button>
            <button
              className="btn btn-accent"
              onClick={() => { setPreGameMode('scramble'); const dl = langOverride !== 'auto' ? langOverride : (selectedLesson.phraseLangs?.[0] || 'fr'); setGameSourceLang(dl); setGameTargetLang(dl === 'fr' ? 'en' : 'fr'); }}
            >
              🧩 {t('wordScramble')}
            </button>
            <button
              className="btn btn-accent"
              onClick={() => { setPreGameMode('audiocatch'); const dl = langOverride !== 'auto' ? langOverride : (selectedLesson.phraseLangs?.[0] || 'fr'); setGameSourceLang(dl); setGameTargetLang(dl === 'fr' ? 'en' : 'fr'); }}
            >
              🎯 {t('audioCatch') || 'Audio Catch'}
            </button>
            <button
              className="btn btn-accent"
              onClick={() => { setPreGameMode('grammardefender'); const dl = langOverride !== 'auto' ? langOverride : (selectedLesson.phraseLangs?.[0] || 'fr'); setGameSourceLang(dl); setGameTargetLang(dl === 'fr' ? 'en' : 'fr'); }}
            >
              📚 {t('grammarDefender') || 'Meanings'}
            </button>
            <button
              className="btn btn-accent"
              onClick={() => { setPreGameMode('fastmatch'); const dl = langOverride !== 'auto' ? langOverride : (selectedLesson.phraseLangs?.[0] || 'fr'); setGameSourceLang(dl); setGameTargetLang(dl === 'fr' ? 'en' : 'fr'); }}
            >
              ⚡ {t('fastMatch') || 'Fast Match'}
            </button>
            <button
              className="btn btn-danger btn-small stop-sound-btn"
              onClick={() => stopSpeaking()}
            >
              🔇 {t('stopSound') || 'Stop Sound'}
            </button>
          </div>
        )}

        <div className="phrases-section">
          {phrases.map((phrase, index) => (
            <div key={`${phrase.text}-${index}-${phrase.lang}`} className="phrase-edit-wrapper">
              {editingSentenceIdx === index ? (
                <div className="edit-sentence-row">
                  <textarea
                    value={editSentenceText}
                    onChange={(e) => setEditSentenceText(e.target.value)}
                    className="input-edit-sentence"
                    autoFocus
                    rows={2}
                  />
                  <div className="edit-sentence-actions">
                    <button className="btn btn-primary btn-small" onClick={handleSaveSentence}>{t('save')}</button>
                    <button className="btn btn-secondary btn-small" onClick={() => setEditingSentenceIdx(null)}>{t('cancel')}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="phrase-edit-btn">
                    <button
                      className="btn-icon btn-icon-sm"
                      onClick={() => handleEditSentence(index)}
                      title={t('editName') || 'Edit'}
                    >
                      ✏️
                    </button>
                  </div>
                  <PhraseCard
                    sentence={phrase.text}
                    lang={phrase.lang}
                    showDelete={false}
                    showWords={false}
                  />
                </>
              )}
            </div>
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
