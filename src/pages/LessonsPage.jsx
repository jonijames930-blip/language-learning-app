import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { getLessons, deleteLesson, deleteSentenceFromLesson } from '../utils/storage';
import { detectLanguage } from '../utils/speech';
import PhraseCard from '../components/PhraseCard';
import ConfirmDialog from '../components/ConfirmDialog';

export default function LessonsPage() {
  const { t } = useLanguage();
  const [lessons, setLessons] = useState(() => getLessons());
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [notification, setNotification] = useState('');

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
          {selectedLesson.sentences.map((sentence, index) => (
            <PhraseCard
              key={`${sentence}-${index}`}
              sentence={sentence}
              lang={selectedLesson.phraseLangs?.[index] || detectLanguage(sentence)}
              showDelete={true}
              onDelete={() => handleDeleteSentence(selectedLesson.id, index)}
            />
          ))}
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

      {lessons.length === 0 ? (
        <div className="empty-state">
          <p>{t('noLessons')}</p>
        </div>
      ) : (
        <div className="lessons-list">
          {lessons.map(lesson => (
            <div key={lesson.id} className="lesson-card">
              <div className="lesson-info" onClick={() => setSelectedLesson(lesson)}>
                <h3>{lesson.name}</h3>
                <span className="lesson-meta">
                  {lesson.sentences.length} {t('phrases')} • {lesson.lang?.toUpperCase()}
                </span>
              </div>
              <div className="lesson-actions">
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
