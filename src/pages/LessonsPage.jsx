import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { getLessons, deleteLesson, deleteSentenceFromLesson, updateLesson } from '../utils/storage';
import { detectLanguage, speak, stopSpeaking } from '../utils/speech';
import PhraseCard from '../components/PhraseCard';
import ConfirmDialog from '../components/ConfirmDialog';

export default function LessonsPage() {
  const { t } = useLanguage();
  const [lessons, setLessons] = useState(() => getLessons());
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [notification, setNotification] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editLessonName, setEditLessonName] = useState('');
  const [spellingWord, setSpellingWord] = useState(null);

  const spellOutWord = async (wordKey, actualWord, lang) => {
    stopSpeaking();
    if (spellingWord === wordKey) { setSpellingWord(null); return; }
    setSpellingWord(wordKey);
    const clean = actualWord.replace(/[.,!?;:'"()[\]{}]/g, '');
    const letters = clean.split('');
    for (let i = 0; i < letters.length; i++) {
      if (letters[i].trim() === '') continue;
      await new Promise(resolve => {
        speak(letters[i], lang, 0.8, resolve);
      });
      await new Promise(r => setTimeout(r, 400));
    }
    setSpellingWord(null);
  };

  const allTags = [...new Set(lessons.map(l => l.tag).filter(Boolean))];

  const filteredLessons = filterTag
    ? lessons.filter(l => l.tag === filterTag)
    : lessons;

  const handleDeleteLesson = (lessonId) => {
    setConfirmAction({
      message: t('confirmDeleteLesson'),
      action: () => {
        const updated = deleteLesson(lessonId);
        setLessons(updated);
        if (selectedLesson?.id === lessonId) {
          setSelectedLesson(null);
        }
        setNotification(t('lessonDeleted'));
        setTimeout(() => setNotification(''), 3000);
        setConfirmAction(null);
      },
    });
  };

  const handleEditLessonName = (lesson) => {
    setEditingLessonId(lesson.id);
    setEditLessonName(lesson.name);
  };

  const handleSaveLessonName = () => {
    if (!editLessonName.trim() || !editingLessonId) return;
    const updated = updateLesson(editingLessonId, { name: editLessonName.trim() });
    setLessons(updated);
    setEditingLessonId(null);
    setEditLessonName('');
    setNotification(t('updateSuccess'));
    setTimeout(() => setNotification(''), 3000);
  };

  const handleDeleteSentence = (lessonId, sentenceIndex) => {
    setConfirmAction({
      message: t('confirmDeleteSentence'),
      action: () => {
        const updated = deleteSentenceFromLesson(lessonId, sentenceIndex);
        setLessons(updated);
        const updatedLesson = updated.find(l => l.id === lessonId);
        setSelectedLesson(updatedLesson || null);
        setNotification(t('sentenceDeleted'));
        setTimeout(() => setNotification(''), 3000);
        setConfirmAction(null);
      },
    });
  };

  if (selectedLesson) {
    return (
      <div className="page lessons-page">
        <div className="lesson-detail-header">
          <button className="btn btn-secondary" onClick={() => setSelectedLesson(null)}>
            ← {t('back')}
          </button>
          <h2>{selectedLesson.name}</h2>
          <span className="lesson-lang">{selectedLesson.lang?.toUpperCase()}</span>
        </div>

        {notification && <div className="notification success">{notification}</div>}

        <div className="phrases-section">
          {selectedLesson.sentences.map((sentence, index) => {
            const lang = selectedLesson.phraseLangs?.[index] || detectLanguage(sentence);
            const words = sentence.split(/\s+/).filter(w => w.length > 0);
            return (
              <div key={`${sentence}-${index}`}>
                <PhraseCard
                  sentence={sentence}
                  lang={lang}
                  showDelete={true}
                  onDelete={() => handleDeleteSentence(selectedLesson.id, index)}
                />
                <div className="word-spell-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '4px 8px', marginBottom: '8px' }}>
                  {words.map((word, wi) => {
                    const wordKey = `${word}-${index}-${wi}`;
                    return (
                      <button
                        key={wi}
                        className={`spell-btn ${spellingWord === wordKey ? 'spelling-active' : ''}`}
                        onClick={() => spellOutWord(wordKey, word, lang)}
                      >
                        🔤 {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {confirmAction && (
          <ConfirmDialog
            message={confirmAction.message}
            onConfirm={confirmAction.action}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="page lessons-page">
      <h2>{t('lessonsTab')}</h2>

      {notification && <div className="notification success">{notification}</div>}

      {allTags.length > 0 && (
        <div className="filter-tags">
          <button
            className={`tag-btn ${filterTag === '' ? 'active-tag' : ''}`}
            onClick={() => setFilterTag('')}
          >
            {t('all') || 'All'}
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`tag-btn ${filterTag === tag ? 'active-tag' : ''}`}
              onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filteredLessons.length === 0 ? (
        <div className="empty-state">
          <p>{t('noLessons')}</p>
        </div>
      ) : (
        <div className="lessons-list">
          {filteredLessons.map(lesson => (
            <div key={lesson.id} className="lesson-card">
              <div className="lesson-info" onClick={() => setSelectedLesson(lesson)}>
                {editingLessonId === lesson.id ? (
                  <div className="edit-name-row" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editLessonName}
                      onChange={(e) => setEditLessonName(e.target.value)}
                      className="input-edit-name"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLessonName(); }}
                    />
                    <button className="btn btn-primary btn-small" onClick={handleSaveLessonName}>{t('save')}</button>
                    <button className="btn btn-secondary btn-small" onClick={() => setEditingLessonId(null)}>{t('cancel')}</button>
                  </div>
                ) : (
                  <>
                    <h3>
                      {lesson.name}
                      {lesson.tag && <span className="lesson-tag">{lesson.tag}</span>}
                    </h3>
                    <span className="lesson-meta">
                      {lesson.sentences.length} {t('phrases')} • {lesson.lang?.toUpperCase()}
                    </span>
                  </>
                )}
              </div>
              <div className="lesson-actions">
                <button
                  className="btn-icon btn-icon-sm"
                  onClick={(e) => { e.stopPropagation(); handleEditLessonName(lesson); }}
                  title={t('editName')}
                >
                  ✏️
                </button>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleDeleteLesson(lesson.id)}
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.message}
          onConfirm={confirmAction.action}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
