import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { translateText } from '../utils/translate';
import { speakLoop, stopSpeaking } from '../utils/speech';
import { saveLesson } from '../utils/storage';
import ConfirmDialog from '../components/ConfirmDialog';

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

function splitSentences(text) {
  return text
    .split(/(?<=[.!?؟。！？])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export default function TranslatePage() {
  const { t } = useLanguage();
  const [sourceText, setSourceText] = useState('');
  const [sourceLang, setSourceLang] = useState('fr');
  const [targetLang, setTargetLang] = useState('ar');
  const [loading, setLoading] = useState(false);
  const [sentences, setSentences] = useState([]);
  const [activeLoop, setActiveLoop] = useState(null);
  const [lessonName, setLessonName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [notification, setNotification] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setLoading(true);
    const parts = splitSentences(sourceText.trim());
    const results = [];
    for (const part of parts) {
      try {
        const result = await translateText(part, sourceLang, targetLang);
        results.push({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          source: part,
          translation: result.translation,
          sourceLang,
          targetLang,
        });
      } catch {
        results.push({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          source: part,
          translation: '',
          sourceLang,
          targetLang,
        });
      }
    }
    setSentences(results);
    if (!lessonName) {
      const preview = sourceText.trim().slice(0, 30);
      setLessonName(preview + (sourceText.trim().length > 30 ? '...' : ''));
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

  const handleSwapLangs = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSentences([]);
  };

  const handleDeleteSentence = (id) => {
    setConfirmAction({ type: 'single', id });
  };

  const handleDeleteAll = () => {
    setConfirmAction({ type: 'all' });
  };

  const confirmDelete = () => {
    if (confirmAction.type === 'all') {
      setSentences([]);
      setSourceText('');
      setLessonName('');
    } else if (confirmAction.type === 'single') {
      setSentences(prev => prev.filter(s => s.id !== confirmAction.id));
    }
    setConfirmAction(null);
  };

  const handleExportToStudy = () => {
    if (sentences.length === 0) return;
    const name = lessonName.trim() || `${t('translateTab')} ${new Date().toLocaleDateString()}`;
    const allSentences = [];
    const phraseLangs = [];

    for (const s of sentences) {
      allSentences.push(s.source);
      phraseLangs.push(s.sourceLang);
      if (s.translation) {
        allSentences.push(s.translation);
        phraseLangs.push(s.targetLang);
      }
    }

    saveLesson({
      name,
      sentences: allSentences,
      phraseLangs,
      lang: sourceLang,
      langOverride: 'auto',
    });

    setNotification(t('savedSuccessfully'));
    setTimeout(() => setNotification(''), 3000);
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
            rows={5}
            className="translate-textarea"
          />
          {sourceText && (
            <button
              className="btn-icon clear-btn-translate"
              onClick={() => { setSourceText(''); setSentences([]); setLessonName(''); }}
              title={t('clearText')}
            >
              ✕
            </button>
          )}
        </div>

        <button
          className="btn btn-primary translate-btn"
          onClick={handleTranslate}
          disabled={loading || !sourceText.trim()}
        >
          {loading ? '⏳' : '🌐'} {t('translate')}
        </button>
      </div>

      {notification && <div className="notification success">{notification}</div>}

      {sentences.length > 0 && (
        <div className="translated-sentences">
          <div className="translated-header">
            {editingName ? (
              <div className="edit-name-row">
                <input
                  type="text"
                  value={lessonName}
                  onChange={(e) => setLessonName(e.target.value)}
                  className="input-edit-name"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingName(false); }}
                />
                <button className="btn btn-primary btn-small" onClick={() => setEditingName(false)}>{t('save')}</button>
              </div>
            ) : (
              <div className="lesson-title-row">
                <h3>{lessonName || t('translateTab')}</h3>
                <button
                  className="btn-icon btn-icon-sm"
                  onClick={() => setEditingName(true)}
                  title={t('editName')}
                >
                  ✏️
                </button>
              </div>
            )}

            <div className="translated-actions">
              <button className="btn btn-success btn-small" onClick={handleExportToStudy}>
                📤 {t('exportToStudy')}
              </button>
              <button className="btn btn-danger btn-small" onClick={handleDeleteAll}>
                🗑️ {t('deleteAll')}
              </button>
            </div>
          </div>

          <div className="sentences-list">
            {sentences.map((s, idx) => (
              <div key={s.id} className="sentence-pair">
                <div className="sentence-source">
                  <span className="sentence-num">{idx + 1}</span>
                  <button
                    className={`btn-icon btn-icon-sm ${activeLoop === `src-${s.id}` ? 'active-loop' : ''}`}
                    onClick={() => handleSpeak(s.source, s.sourceLang, `src-${s.id}`)}
                  >
                    {activeLoop === `src-${s.id}` ? '⏹️' : '🔊'}
                  </button>
                  <span className="sentence-text">{s.source}</span>
                </div>
                {s.translation && (
                  <div className="sentence-target">
                    <span className="sentence-num-placeholder" />
                    <button
                      className={`btn-icon btn-icon-sm ${activeLoop === `tgt-${s.id}` ? 'active-loop' : ''}`}
                      onClick={() => handleSpeak(s.translation, s.targetLang, `tgt-${s.id}`)}
                    >
                      {activeLoop === `tgt-${s.id}` ? '⏹️' : '🔊'}
                    </button>
                    <span className="sentence-text sentence-text-target">{s.translation}</span>
                  </div>
                )}
                <button
                  className="btn-icon btn-icon-sm btn-delete-sentence"
                  onClick={() => handleDeleteSentence(s.id)}
                  title={t('deleteSentence')}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.type === 'all' ? t('confirmDeleteAll') : t('confirmDeleteSentence')}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
