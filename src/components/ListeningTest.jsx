import { useState, useCallback } from 'react';
import { useLanguage } from '../context/useLanguage';
import { speakLoop, stopSpeaking, parseWords } from '../utils/speech';
import { playCorrectSound, playWrongSound } from '../utils/sounds';

export default function ListeningTest({ sentences, lang, onClose, testType }) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState([]);
  const [testComplete, setTestComplete] = useState(false);
  const [activeSpeed, setActiveSpeed] = useState(null);

  const items =
    testType === 'words'
      ? sentences.flatMap(s => parseWords(s))
      : sentences;

  const currentItem = items[currentIndex];

  const togglePlay = useCallback(
    (rate = 1) => {
      const speed = rate < 1 ? 'slow' : 'normal';
      if (activeSpeed === speed) {
        stopSpeaking();
        setActiveSpeed(null);
        return;
      }
      stopSpeaking();
      setActiveSpeed(speed);
      speakLoop(currentItem, lang, rate);
    },
    [currentItem, lang, activeSpeed]
  );

  const checkAnswer = () => {
    const isCorrect =
      userAnswer.trim().toLowerCase() === currentItem.toLowerCase();
    const newResults = [
      ...results,
      { item: currentItem, answer: userAnswer, correct: isCorrect },
    ];
    setResults(newResults);
    setShowAnswer(true);
    stopSpeaking();
    setActiveSpeed(null);

    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  const nextItem = () => {
    if (currentIndex + 1 >= items.length) {
      setTestComplete(true);
      stopSpeaking();
      setActiveSpeed(null);
    } else {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setShowAnswer(false);
      setActiveSpeed(null);
    }
  };

  const skipItem = () => {
    const newResults = [
      ...results,
      { item: currentItem, answer: '', correct: false },
    ];
    setResults(newResults);
    stopSpeaking();
    setActiveSpeed(null);
    playWrongSound();
    nextItem();
  };

  const restartTest = () => {
    setCurrentIndex(0);
    setUserAnswer('');
    setShowAnswer(false);
    setResults([]);
    setTestComplete(false);
    setActiveSpeed(null);
  };

  const handleClose = () => {
    stopSpeaking();
    setActiveSpeed(null);
    onClose();
  };

  const correctCount = results.filter(r => r.correct).length;

  if (testComplete) {
    return (
      <div className="listening-test">
        <h2>{t('testComplete')}</h2>
        <div className="test-score">
          <p>
            {t('score')}: {correctCount} / {results.length}
          </p>
          <div className="score-bar">
            <div
              className="score-fill"
              style={{
                width: `${(correctCount / results.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="test-results">
          {results.map((r, i) => (
            <div
              key={i}
              className={`result-item ${r.correct ? 'correct' : 'wrong'}`}
            >
              <span className="result-icon">{r.correct ? '✓' : '✗'}</span>
              <span className="result-answer">{r.item}</span>
              {!r.correct && r.answer && (
                <span className="result-user-answer">({r.answer})</span>
              )}
            </div>
          ))}
        </div>
        <div className="test-actions">
          <button className="btn btn-primary" onClick={restartTest}>
            {t('tryAgain')}
          </button>
          <button className="btn btn-secondary" onClick={handleClose}>
            {t('close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="listening-test">
      <div className="test-header">
        <h2>{testType === 'words' ? t('wordListeningTest') : t('sentenceListeningTest')}</h2>
        <span className="test-progress">
          {currentIndex + 1} / {items.length}
        </span>
      </div>

      <div className="test-controls">
        <button
          className={`btn btn-speak-slow ${activeSpeed === 'slow' ? 'active-loop' : ''}`}
          onClick={() => togglePlay(0.6)}
        >
          {activeSpeed === 'slow' ? '⏹️' : '🐢'} {activeSpeed === 'slow' ? (t('stop') || 'Stop') : t('slowSpeed')}
        </button>
        <button
          className={`btn btn-speak-normal ${activeSpeed === 'normal' ? 'active-loop' : ''}`}
          onClick={() => togglePlay(1)}
        >
          {activeSpeed === 'normal' ? '⏹️' : '🔊'} {activeSpeed === 'normal' ? (t('stop') || 'Stop') : t('normalSpeed')}
        </button>
      </div>

      <div className="test-input">
        <p className="test-instruction">{t('writeWhatYouHear')}</p>
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !showAnswer) checkAnswer();
          }}
          placeholder={t('typeYourAnswer')}
          className="input-answer"
          disabled={showAnswer}
          autoFocus
        />
      </div>

      {showAnswer && (
        <div className={`answer-reveal ${results[results.length - 1]?.correct ? 'correct' : 'wrong'}`}>
          <p>
            {results[results.length - 1]?.correct ? `✓ ${t('correct')}` : `✗ ${t('wrong')}`}
          </p>
          <p className="correct-answer">{currentItem}</p>
        </div>
      )}

      <div className="test-actions">
        {!showAnswer ? (
          <>
            <button className="btn btn-primary" onClick={checkAnswer} disabled={!userAnswer.trim()}>
              {t('check')}
            </button>
            <button className="btn btn-secondary" onClick={skipItem}>
              {t('skip')}
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={nextItem}>
            {currentIndex + 1 >= items.length ? t('results') : t('nextWord')}
          </button>
        )}
        <button className="btn btn-secondary" onClick={handleClose}>
          {t('close')}
        </button>
      </div>
    </div>
  );
}
