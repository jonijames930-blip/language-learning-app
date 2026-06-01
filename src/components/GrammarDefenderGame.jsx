import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/useLanguage';
import { playCorrectSound, playWrongSound } from '../utils/sounds';

const FALL_DURATION = 5;
const ROUND_COUNT = 10;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MASCULINE_ARTICLES = ['le', 'un', 'du', 'au', 'mon', 'ton', 'son', 'ce', 'cet'];
const FEMININE_ARTICLES = ['la', 'une', 'de la', 'à la', 'ma', 'ta', 'sa', 'cette'];

function classifyWord(word) {
  const lower = word.toLowerCase().trim();
  if (MASCULINE_ARTICLES.includes(lower)) return 'masculin';
  if (FEMININE_ARTICLES.includes(lower)) return 'féminin';
  if (lower.endsWith('tion') || lower.endsWith('sion') || lower.endsWith('ette') ||
      lower.endsWith('elle') || lower.endsWith('ance') || lower.endsWith('ence') ||
      lower.endsWith('ure') || lower.endsWith('ée')) return 'féminin';
  if (lower.endsWith('ment') || lower.endsWith('age') || lower.endsWith('isme') ||
      lower.endsWith('eur')) return 'masculin';
  return Math.random() > 0.5 ? 'masculin' : 'féminin';
}

export default function GrammarDefenderGame({ phrases, onClose }) {
  const { t } = useLanguage();
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  const [wordCategory, setWordCategory] = useState(null);
  const [falling, setFalling] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [fallProgress, setFallProgress] = useState(0);
  const wordsPool = useRef([]);
  const timerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const words = [];
    const seen = new Set();
    phrases.forEach(p => {
      const parts = p.text.split(/\s+/).filter(w => w.length > 1);
      parts.forEach(w => {
        const clean = w.replace(/[.,!?;:'"()[\]{}]/g, '').trim();
        if (clean.length > 1 && !seen.has(clean.toLowerCase())) {
          seen.add(clean.toLowerCase());
          const cat = classifyWord(clean);
          words.push({ text: clean, category: cat, lang: p.lang });
        }
      });
    });

    const allArticles = [...MASCULINE_ARTICLES.map(a => ({ text: a, category: 'masculin', lang: 'fr' })),
                         ...FEMININE_ARTICLES.map(a => ({ text: a, category: 'féminin', lang: 'fr' }))];
    const combined = [...words, ...allArticles];
    wordsPool.current = shuffle(combined);
  }, [phrases]);

  const startRound = useCallback((roundIdx) => {
    setAnswered(false);
    setFeedback(null);
    setFallProgress(0);
    setFalling(true);

    const pool = wordsPool.current;
    if (pool.length === 0) return;
    const word = pool[roundIdx % pool.length];
    setCurrentWord(word);
    setWordCategory(word.category);

    const startTime = Date.now();
    const duration = FALL_DURATION * 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setFallProgress(progress);

      if (progress >= 1) {
        setAnswered(true);
        setFeedback('timeout');
        playWrongSound();
        setFalling(false);
        setTimeout(() => nextRound(roundIdx), 1500);
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, []);

  const nextRound = useCallback((currentRound) => {
    const next = currentRound + 1;
    if (next >= ROUND_COUNT) {
      setGameOver(true);
    } else {
      setRound(next);
      startRound(next);
    }
  }, [startRound]);

  useEffect(() => {
    if (wordsPool.current.length > 0) {
      startRound(0);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleBasketClick = (basket) => {
    if (answered || gameOver || !currentWord) return;
    setAnswered(true);
    setFalling(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);

    if (basket === wordCategory) {
      setScore(s => s + 1);
      setFeedback('correct');
      playCorrectSound();
    } else {
      setFeedback('wrong');
      playWrongSound();
    }

    setTimeout(() => nextRound(round), 1200);
  };

  const handleRestart = () => {
    wordsPool.current = shuffle(wordsPool.current);
    setScore(0);
    setRound(0);
    setGameOver(false);
    setAnswered(false);
    setFeedback(null);
    setFallProgress(0);
    startRound(0);
  };

  if (wordsPool.current.length < 2) {
    return (
      <div className="grammar-defender-game">
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
      <div className="grammar-defender-game">
        <div className="game-over-screen">
          <h2>🎉 {t('testComplete')}</h2>
          <div className="final-score">
            <span className="score-number">{score}</span>
            <span className="score-total">/ {ROUND_COUNT}</span>
          </div>
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
    <div className="grammar-defender-game">
      <div className="game-header">
        <button className="btn btn-secondary btn-small" onClick={() => { if (animRef.current) cancelAnimationFrame(animRef.current); onClose(); }}>
          ← {t('back')}
        </button>
        <div className="game-info">
          <span className="game-score">⭐ {score}</span>
          <span className="game-round">{round + 1}/{ROUND_COUNT}</span>
        </div>
      </div>

      <div className="grammar-fall-area">
        {currentWord && (
          <div
            className={`grammar-word ${answered ? (feedback === 'correct' ? 'grammar-word-correct' : 'grammar-word-wrong') : ''}`}
            style={{ top: `${fallProgress * 80}%` }}
          >
            {currentWord.text}
          </div>
        )}
      </div>

      {feedback === 'correct' && <div className="game-feedback correct-feedback">✓</div>}
      {feedback === 'wrong' && <div className="game-feedback wrong-feedback">✗ {wordCategory}</div>}

      <div className="grammar-baskets">
        <button
          className="grammar-basket basket-masculine"
          onClick={() => handleBasketClick('masculin')}
          disabled={answered}
        >
          <span className="basket-icon">🧺</span>
          <span className="basket-label">Masculin</span>
          <span className="basket-examples">le, un, du</span>
        </button>
        <button
          className="grammar-basket basket-feminine"
          onClick={() => handleBasketClick('féminin')}
          disabled={answered}
        >
          <span className="basket-icon">🧺</span>
          <span className="basket-label">Féminin</span>
          <span className="basket-examples">la, une, de la</span>
        </button>
      </div>
    </div>
  );
}
