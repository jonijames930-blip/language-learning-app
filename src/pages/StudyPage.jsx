import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { getLessons } from '../utils/storage';
import PhraseCard from '../components/PhraseCard';
import ListeningTest from '../components/ListeningTest';

export default function StudyPage() {
  const { t } = useLanguage();
  const [lessons] = useState(() => getLessons());
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [testMode, setTestMode] = useState(null);

  if (testMode && selectedLesson) {
    const isArabic = selectedLesson.lang === 'ar';
    if (isArabic) {
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

    return (
      <div className="page study-page">
        <ListeningTest
          sentences={selectedLesson.sentences}
          lang={selectedLesson.lang}
          testType={testMode}
          onClose={() => setTestMode(null)}
        />
      </div>
    );
  }

  if (selectedLesson) {
    const isArabic = selectedLesson.lang === 'ar';

    return (
      <div className="page study-page">
        <div className="study-header">
          <button className="btn btn-secondary" onClick={() => setSelectedLesson(null)}>
            ← {t('back')}
          </button>
          <h2>{selectedLesson.name}</h2>
          <span className="lesson-lang">{selectedLesson.lang?.toUpperCase()}</span>
        </div>

        {!isArabic && (
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
          {selectedLesson.sentences.map((sentence, index) => (
            <PhraseCard
              key={`${sentence}-${index}`}
              sentence={sentence}
              lang={selectedLesson.lang}
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
              onClick={() => setSelectedLesson(lesson)}
            >
              <div className="lesson-info">
                <h3>{lesson.name}</h3>
                <span className="lesson-meta">
                  {lesson.sentences.length} {t('phrases')} • {lesson.lang?.toUpperCase()}
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
