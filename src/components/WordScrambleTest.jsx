import { useState, useCallback } from 'react';
import { useLanguage } from '../context/useLanguage';
import { speakLoop, stopSpeaking } from '../utils/speech';
import { playCorrectSound, playWrongSound } from '../utils/sounds';

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function WordScrambleTest({ phrases, onClose }) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [shuffledWords, setShuffledWords] = useState(() => {
    const words = phrases[0].text.split(/\s+/).filter(Boolean);
    return shuffleArray(words.map((w, i) => ({ text: w, id: i })));
  });
  const [result, setResult] = useState(null);
  const [results, setResults] = useState([]);
  const [testComplete, setTestComplete] = useState(false);
  const [activeSpeed, setActiveSpeed] = useState(null);

  const currentPhrase = phrases[currentIndex];

  const initPhrase = useCallback((index) => {
    const words = phrases[index].text.split(/\s+/).filter(Boolean);
    setShuffledWords(shuffleArray(words.map((w, i) => ({ text: w, id: i }))));
    setPlaced([]);
    setResult(null);
    setActiveSpeed(null);
  }, [phrases]);

  const togglePlay = useCallback((rate = 1) => {
    const speed = rate < 1 ? 'slow' : 'normal';
    if (activeSpeed === speed) {
      stopSpeaking();
      setActiveSpeed(null);
      return;
    }
    stopSpeaking();
    setActiveSpeed(speed);
    speakLoop(currentPhrase.text, currentPhrase.lang, rate);
  }, [currentPhrase, activeSpeed]);

  const handlePlaceWord = (word) => {
    if (result) return;
    setPlaced(prev => [...prev, word]);
  };

  const handleRemoveWord = (index) => {
    if (result) return;
    setPlaced(prev => prev.filter((_, i) => i !== index));
  };

  const checkAnswer = () => {
    const userSentence = placed.map(w => w.text).join(' ');
    const isCorrect = userSentence === currentPhrase.text;
    setResult(isCorrect ? 'correct' : 'wrong');
    setResults(prev => [...prev, {
      sentence: currentPhrase.text,
      answer: userSentence,
      correct: isCorrect,
    }]);
    stopSpeaking();
    setActiveSpeed(null);
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  const nextPhrase = () => {
    if (currentIndex + 1 >= phrases.length) {
      setTestComplete(true);
      stopSpeaking();
      setActiveSpeed(null);
    } else {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      initPhrase(next);
    }
  };

  const restartTest = () => {
    setCurrentIndex(0);
    setResults([]);
    setTestComplete(false);
    initPhrase(0);
  };

  const handleClose = () => {
    stopSpeaking();
    setActiveSpeed(null);
    onClose();
  };

  const correctCount = results.filter(r => r.correct).length;
  const placedIds = new Set(placed.map(w => w.id));

  if (testComplete) {
    return (
      <div className="listening-test">
        <h2>{t('testComplete')}</h2>
        <div className="test-score">
          <p>{t('score')}: {correctCount} / {results.length}</p>
          <div className="score-bar">
            <div className="score-fill" style={{ width: `${(correctCount / results.length) * 100}%` }} />
          </div>
        </div>
        <div className="test-results">
          {results.map((r, i) => (
            <div key={i} className={`result-item ${r.correct ? 'correct' : 'wrong'}`}>
              <span className="result-icon">{r.correct ? '✓' : '✗'}</span>
              <span className="result-answer">{r.sentence}</span>
              {!r.correct && <span className="result-user-answer">({r.answer})</span>}
            </div>
          ))}
        </div>
        <div className="test-actions">
          <button className="btn btn-primary" onClick={restartTest}>{t('tryAgain')}</button>
          <button className="btn btn-secondary" onClick={handleClose}>{t('close')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="listening-test scramble-test">
      <div className="test-header">
        <h2>{t('wordScramble')}</h2>
        <span className="test-progress">{currentIndex + 1} / {phrases.length}</span>
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

      <p className="scramble-hint">{t('scrambleHint')}</p>

      <div className={`scramble-dropzone ${result === 'correct' ? 'correct-zone' : result === 'wrong' ? 'wrong-zone' : ''}`}>
        {placed.length === 0 && <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>...</span>}
        {placed.map((word, i) => (
          <span key={`placed-${i}`} className="scramble-placed-word" onClick={() => handleRemoveWord(i)}>
            {word.text}
          </span>
        ))}
      </div>

      <div className="scramble-word-pool">
        {shuffledWords.map((word) => (
          <button
            key={word.id}
            className={`scramble-word ${placedIds.has(word.id) ? 'placed' : ''}`}
            onClick={() => handlePlaceWord(word)}
            disabled={placedIds.has(word.id)}
          >
            {word.text}
          </button>
        ))}
      </div>

      {result && (
        <div className={`answer-reveal ${result}`}>
          <p>{result === 'correct' ? `✓ ${t('correct')}` : `✗ ${t('wrong')}`}</p>
          {result === 'wrong' && <p className="correct-answer">{currentPhrase.text}</p>}
        </div>
      )}

      <div className="test-actions">
        {!result ? (
          <>
            <button
              className="btn btn-primary"
              onClick={checkAnswer}
              disabled={placed.length !== shuffledWords.length}
            >
              {t('check')}
            </button>
            <button className="btn btn-secondary" onClick={() => { setPlaced([]); }}>
              {t('clearText')}
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={nextPhrase}>
            {currentIndex + 1 >= phrases.length ? t('results') : t('nextWord')}
          </button>
        )}
        <button className="btn btn-secondary" onClick={handleClose}>{t('close')}</button>
      </div>
    </div>
  );
}
