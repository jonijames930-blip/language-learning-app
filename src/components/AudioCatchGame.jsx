import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/useLanguage';
import { speakLoop, stopSpeaking } from '../utils/speech';
import { playCorrectSound, playWrongSound } from '../utils/sounds';

const BUBBLE_COUNT = 4;
const ROUND_TIME = 5;
const FALL_DURATION = 6;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function AudioCatchGame({ phrases, onClose }) {
  const { t } = useLanguage();
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [bubbles, setBubbles] = useState([]);
  const [correctWord, setCorrectWord] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [totalRounds, setTotalRounds] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const timerRef = useRef(null);
  const roundRef = useRef(0);

  const allWords = useRef([]);

  useEffect(() => {
    const words = [];
    phrases.forEach(p => {
      p.text.split(/\s+/).filter(w => w.length > 1).forEach(w => {
        words.push({ text: w, lang: p.lang });
      });
    });
    allWords.current = words.length > 0 ? words : phrases.map(p => ({ text: p.text, lang: p.lang }));
    setTotalRounds(Math.min(allWords.current.length, 10));
  }, [phrases]);

  const startRound = useCallback((roundIdx) => {
    stopSpeaking();
    setAnswered(false);
    setFeedback(null);
    setTimeLeft(ROUND_TIME);

    const words = allWords.current;
    if (words.length === 0) return;

    const correct = words[roundIdx % words.length];
    setCorrectWord(correct);

    const others = shuffle(words.filter(w => w.text !== correct.text)).slice(0, BUBBLE_COUNT - 1);
    const options = shuffle([correct, ...others].slice(0, BUBBLE_COUNT));

    const bubblesData = options.map((w, i) => ({
      id: i,
      text: w.text,
      left: 10 + Math.random() * 60,
      delay: Math.random() * 1.5,
      isCorrect: w.text === correct.text,
      popped: false,
    }));
    setBubbles(bubblesData);

    setTimeout(() => {
      speakLoop(correct.text, correct.lang, 0.8);
    }, 300);

    if (timerRef.current) clearInterval(timerRef.current);
    let t = ROUND_TIME;
    timerRef.current = setInterval(() => {
      t -= 0.1;
      if (t <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft(0);
        setAnswered(true);
        setFeedback('timeout');
        stopSpeaking();
        playWrongSound();
        setTimeout(() => nextRound(roundIdx), 2000);
      } else {
        setTimeLeft(t);
      }
    }, 100);
  }, []);

  const nextRound = useCallback((currentRound) => {
    const next = currentRound + 1;
    const maxRounds = Math.min(allWords.current.length, 10);
    if (next >= maxRounds) {
      setGameOver(true);
      stopSpeaking();
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      roundRef.current = next;
      setRound(next);
      startRound(next);
    }
  }, [startRound]);

  useEffect(() => {
    if (allWords.current.length > 0 && !gameOver) {
      startRound(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopSpeaking();
    };
  }, [totalRounds]);

  const handleBubbleTap = (bubble) => {
    if (answered || gameOver) return;
    setAnswered(true);
    stopSpeaking();
    if (timerRef.current) clearInterval(timerRef.current);

    if (bubble.isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
      playCorrectSound();
      setBubbles(prev => prev.map(b => b.id === bubble.id ? { ...b, popped: true } : b));
    } else {
      setFeedback('wrong');
      playWrongSound();
    }

    setTimeout(() => nextRound(roundRef.current), 1500);
  };

  const handleRestart = () => {
    setScore(0);
    setRound(0);
    roundRef.current = 0;
    setGameOver(false);
    setAnswered(false);
    setFeedback(null);
    startRound(0);
  };

  const maxRounds = Math.min(allWords.current.length, 10);
  const timerPercent = (timeLeft / ROUND_TIME) * 100;

  if (gameOver) {
    return (
      <div className="audio-catch-game">
        <div className="game-over-screen">
          <h2>🎉 {t('testComplete')}</h2>
          <div className="final-score">
            <span className="score-number">{score}</span>
            <span className="score-total">/ {maxRounds}</span>
          </div>
          <p className="score-label">{t('points') || 'Points'}</p>
          <div className="game-over-actions">
            <button className="btn btn-primary" onClick={handleRestart}>
              🔄 {t('tryAgain')}
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              ← {t('back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-catch-game">
      <div className="game-header">
        <button className="btn btn-secondary btn-small" onClick={() => { stopSpeaking(); if (timerRef.current) clearInterval(timerRef.current); onClose(); }}>
          ← {t('back')}
        </button>
        <div className="game-info">
          <span className="game-score">⭐ {score}</span>
          <span className="game-round">{round + 1}/{maxRounds}</span>
        </div>
      </div>

      <div className="timer-bar">
        <div
          className={`timer-fill ${timeLeft < 2 ? 'timer-danger' : ''}`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {feedback === 'correct' && <div className="game-feedback correct-feedback">✓</div>}
      {feedback === 'wrong' && <div className="game-feedback wrong-feedback">✗</div>}
      {feedback === 'timeout' && <div className="game-feedback timeout-feedback">{t('timeUp') || "Time's up!"}</div>}

      <div className="bubble-area">
        {bubbles.map(bubble => (
          <button
            key={bubble.id}
            className={`bubble ${bubble.popped ? 'bubble-popped' : ''} ${answered && bubble.isCorrect ? 'bubble-correct' : ''} ${answered && !bubble.isCorrect ? 'bubble-faded' : ''}`}
            style={{
              left: `${bubble.left}%`,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${FALL_DURATION}s`,
            }}
            onClick={() => handleBubbleTap(bubble)}
            disabled={answered}
          >
            {bubble.text}
          </button>
        ))}
      </div>

      <div className="game-hint">
        <p>🎧 {t('audioCatchHint') || 'Listen and tap the correct bubble!'}</p>
      </div>
    </div>
  );
}
