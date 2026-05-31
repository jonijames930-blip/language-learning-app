import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/useLanguage';
import { speakLoop, stopSpeaking } from '../utils/speech';
import { translateText } from '../utils/translate';
import { playCorrectSound, playWrongSound } from '../utils/sounds';

const BUBBLE_COUNT = 3;
const ROUND_TIME = 7;
const RISE_DURATION = 8;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cleanWord(text) {
  return text.replace(/[.,!?;:'"()[\]{}]/g, '').trim();
}

export default function BubblePopGame({ phrases, onClose }) {
  const { t } = useLanguage();
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [bubbles, setBubbles] = useState([]);
  const [arabicPrompt, setArabicPrompt] = useState('');
  const [correctWord, setCorrectWord] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [totalRounds, setTotalRounds] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
  const roundRef = useRef(0);
  const wordsPool = useRef([]);

  useEffect(() => {
    const buildPool = async () => {
      const words = [];
      const seen = new Set();
      phrases.forEach(p => {
        const parts = p.text.split(/\s+/).filter(w => w.length > 1);
        parts.forEach(w => {
          const clean = cleanWord(w);
          if (clean.length > 1 && !seen.has(clean.toLowerCase())) {
            seen.add(clean.toLowerCase());
            words.push({ text: clean, lang: p.lang });
          }
        });
      });

      const translatedWords = [];
      for (const w of words.slice(0, 20)) {
        try {
          const result = await translateText(w.text, w.lang, 'ar');
          if (result.translation && result.translation !== w.text) {
            translatedWords.push({ ...w, arabic: result.translation });
          }
        } catch {
          /* skip word */
        }
      }

      wordsPool.current = translatedWords.length >= BUBBLE_COUNT
        ? shuffle(translatedWords) : translatedWords;
      const rounds = Math.min(wordsPool.current.length, 10);
      setTotalRounds(rounds);
      setLoading(false);
    };
    buildPool();
  }, [phrases]);

  const startRound = useCallback((roundIdx) => {
    stopSpeaking();
    setAnswered(false);
    setFeedback(null);
    setShowCorrectAnswer(null);
    setTimeLeft(ROUND_TIME);

    const words = wordsPool.current;
    if (words.length < 2) return;

    const correctIdx = roundIdx % words.length;
    const correct = words[correctIdx];
    setCorrectWord(correct);
    setArabicPrompt(correct.arabic);

    const otherWords = words.filter((_, i) => i !== correctIdx);
    const others = shuffle(otherWords).slice(0, BUBBLE_COUNT - 1);
    const options = shuffle([correct, ...others]);

    const bubblesData = options.map((w, i) => ({
      id: i,
      text: w.text,
      lang: w.lang,
      arabic: w.arabic,
      left: 8 + (i * (75 / options.length)) + Math.random() * 10,
      delay: Math.random() * 1.2,
      isCorrect: w.text === correct.text,
      popped: false,
    }));
    setBubbles(bubblesData);

    setTimeout(() => {
      speakLoop(correct.arabic, 'ar', 0.85);
    }, 500);

    if (timerRef.current) clearInterval(timerRef.current);
    let remaining = ROUND_TIME;
    timerRef.current = setInterval(() => {
      remaining -= 0.1;
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft(0);
        setAnswered(true);
        setFeedback('timeout');
        setShowCorrectAnswer(correct.text);
        stopSpeaking();
        playWrongSound();
        setTimeout(() => nextRound(roundIdx), 2500);
      } else {
        setTimeLeft(remaining);
      }
    }, 100);
  }, []);

  const nextRound = useCallback((currentRound) => {
    const next = currentRound + 1;
    const maxRounds = Math.min(wordsPool.current.length, 10);
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
    if (wordsPool.current.length >= 2 && totalRounds > 0 && !gameOver && !loading) {
      startRound(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopSpeaking();
    };
  }, [totalRounds, loading]);

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
      setShowCorrectAnswer(correctWord?.text);
      playWrongSound();
    }

    setTimeout(() => nextRound(roundRef.current), 1800);
  };

  const handleReplay = () => {
    if (correctWord) {
      stopSpeaking();
      speakLoop(correctWord.arabic, 'ar', 0.85);
    }
  };

  const handleReplaySlow = () => {
    if (correctWord) {
      stopSpeaking();
      speakLoop(correctWord.arabic, 'ar', 0.5);
    }
  };

  const handleRestart = () => {
    wordsPool.current = shuffle(wordsPool.current);
    setScore(0);
    setRound(0);
    roundRef.current = 0;
    setGameOver(false);
    setAnswered(false);
    setFeedback(null);
    setShowCorrectAnswer(null);
    startRound(0);
  };

  const maxRounds = Math.min(wordsPool.current.length, 10);
  const timerPercent = (timeLeft / ROUND_TIME) * 100;

  if (loading) {
    return (
      <div className="bubble-pop-game">
        <div className="game-over-screen">
          <p>⏳ {t('loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (wordsPool.current.length < 2) {
    return (
      <div className="bubble-pop-game">
        <div className="game-over-screen">
          <p>{t('notEnoughWords') || 'Not enough words for this game'}</p>
          <button className="btn btn-secondary" onClick={onClose}>
            ← {t('back')}
          </button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="bubble-pop-game">
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
    <div className="bubble-pop-game">
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

      <div className="bubble-pop-prompt">
        <p className="prompt-label">{t('findTheWord') || 'Find the word:'}</p>
        <p className="prompt-arabic">{arabicPrompt}</p>
        <div className="game-controls">
          <button className="btn btn-accent btn-small" onClick={handleReplaySlow} disabled={answered}>
            🐢 {t('slowSpeed') || 'Slow'}
          </button>
          <button className="btn btn-accent btn-small" onClick={handleReplay} disabled={answered}>
            🔊 {t('replay') || 'Replay'}
          </button>
        </div>
      </div>

      {feedback === 'correct' && <div className="game-feedback correct-feedback">✓</div>}
      {feedback === 'wrong' && <div className="game-feedback wrong-feedback">✗</div>}
      {feedback === 'timeout' && <div className="game-feedback timeout-feedback">{t('timeUp') || "Time's up!"}</div>}
      {showCorrectAnswer && (
        <div className="correct-answer-reveal">
          ✓ {showCorrectAnswer}
        </div>
      )}

      <div className="bubble-area bubble-area-rise">
        {bubbles.map(bubble => (
          <button
            key={bubble.id}
            className={`bubble bubble-rise ${bubble.popped ? 'bubble-popped' : ''} ${answered && bubble.isCorrect ? 'bubble-correct' : ''} ${answered && !bubble.isCorrect ? 'bubble-faded' : ''}`}
            style={{
              left: `${bubble.left}%`,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${RISE_DURATION}s`,
            }}
            onClick={() => handleBubbleTap(bubble)}
            disabled={answered}
          >
            {bubble.text}
          </button>
        ))}
      </div>

      <div className="game-hint">
        <p>🫧 {t('bubblePopHint') || 'Pop the bubble with the correct translation!'}</p>
      </div>
    </div>
  );
}
