import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/useLanguage';
import { speakLoop, stopSpeaking } from '../utils/speech';
import { translateText } from '../utils/translate';
import { playCorrectSound, playWrongSound } from '../utils/sounds';

const FALL_DURATION = 7;
const ROUND_COUNT = 10;

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

function getTargetLangs(sourceLang) {
  if (sourceLang === 'fr') return ['en', 'ar'];
  if (sourceLang === 'en') return ['fr', 'ar'];
  if (sourceLang === 'ar') return ['fr', 'en'];
  return ['en', 'ar'];
}

export default function GrammarDefenderGame({ phrases, onClose }) {
  const { t } = useLanguage();
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  const [baskets, setBaskets] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [fallProgress, setFallProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const wordsPool = useRef([]);
  const animRef = useRef(null);
  const pausedRef = useRef(false);
  const startTimeRef = useRef(0);
  const pausedElapsedRef = useRef(0);

  useEffect(() => {
    const buildPool = async () => {
      const words = [];
      const seen = new Set();
      const sourceLang = phrases[0]?.lang || 'fr';
      const [targetLang1, targetLang2] = getTargetLangs(sourceLang);

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
          const r1 = await translateText(w.text, w.lang, targetLang1);
          const r2 = await translateText(w.text, w.lang, targetLang2);
          if (r1.translation && r2.translation) {
            translatedWords.push({
              ...w,
              trans1: r1.translation,
              trans1Lang: targetLang1,
              trans2: r2.translation,
              trans2Lang: targetLang2,
            });
          }
        } catch { /* skip */ }
      }

      wordsPool.current = shuffle(translatedWords);
      setLoading(false);
    };
    buildPool();
  }, [phrases]);

  const generateBaskets = useCallback((correctWord, allWords) => {
    const correctBasket = {
      id: 'correct',
      text1: correctWord.trans1,
      lang1: correctWord.trans1Lang,
      text2: correctWord.trans2,
      lang2: correctWord.trans2Lang,
      isCorrect: true,
    };

    const others = allWords.filter(w => w.text !== correctWord.text);
    const wrongWords = shuffle(others).slice(0, 2);
    const wrongBaskets = wrongWords.map((w, i) => ({
      id: `wrong-${i}`,
      text1: w.trans1,
      lang1: w.trans1Lang,
      text2: w.trans2,
      lang2: w.trans2Lang,
      isCorrect: false,
    }));

    return shuffle([correctBasket, ...wrongBaskets]);
  }, []);

  const startRound = useCallback((roundIdx) => {
    setAnswered(false);
    setFeedback(null);
    setFallProgress(0);
    pausedRef.current = false;
    setPaused(false);

    const pool = wordsPool.current;
    if (pool.length < 3) return;
    const word = pool[roundIdx % pool.length];
    setCurrentWord(word);
    setBaskets(generateBaskets(word, pool));

    stopSpeaking();
    setTimeout(() => speakLoop(word.text, word.lang, 0.85), 300);

    startTimeRef.current = Date.now();
    pausedElapsedRef.current = 0;
    const duration = FALL_DURATION * 1000;

    const animate = () => {
      if (pausedRef.current) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      const elapsed = (Date.now() - startTimeRef.current) - pausedElapsedRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setFallProgress(progress);

      if (progress >= 1) {
        setAnswered(true);
        setFeedback('timeout');
        stopSpeaking();
        playWrongSound();
        setTimeout(() => nextRound(roundIdx), 1800);
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, [generateBaskets]);

  const nextRound = useCallback((currentRound) => {
    const next = currentRound + 1;
    if (next >= ROUND_COUNT || next >= wordsPool.current.length) {
      setGameOver(true);
      stopSpeaking();
    } else {
      setRound(next);
      startRound(next);
    }
  }, [startRound]);

  useEffect(() => {
    if (!loading && wordsPool.current.length >= 3) {
      startRound(0);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      stopSpeaking();
    };
  }, [loading]);

  const handlePause = () => {
    if (paused) {
      pausedRef.current = false;
      setPaused(false);
      startTimeRef.current = Date.now() - pausedElapsedRef.current;
    } else {
      pausedRef.current = true;
      setPaused(true);
      pausedElapsedRef.current = Date.now() - startTimeRef.current;
      stopSpeaking();
    }
  };

  const handleBasketClick = (basket) => {
    if (answered || gameOver || !currentWord || paused) return;
    setAnswered(true);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    stopSpeaking();

    if (basket.isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
      playCorrectSound();
    } else {
      setFeedback('wrong');
      playWrongSound();
    }

    setTimeout(() => nextRound(round), 1400);
  };

  const handleRestart = () => {
    wordsPool.current = shuffle(wordsPool.current);
    setScore(0);
    setRound(0);
    setGameOver(false);
    setAnswered(false);
    setFeedback(null);
    setFallProgress(0);
    setPaused(false);
    pausedRef.current = false;
    startRound(0);
  };

  if (loading) {
    return (
      <div className="grammar-defender-game">
        <div className="game-over-screen">
          <p>⏳ {t('loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (wordsPool.current.length < 3) {
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
            <span className="score-total">/ {Math.min(ROUND_COUNT, wordsPool.current.length)}</span>
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
        <button className="btn btn-secondary btn-small" onClick={() => { if (animRef.current) cancelAnimationFrame(animRef.current); stopSpeaking(); onClose(); }}>
          ← {t('back')}
        </button>
        <button className="btn btn-danger btn-small" onClick={handlePause}>
          {paused ? '▶️' : '⏸️'} {paused ? (t('resume') || 'Resume') : (t('stopSound') || 'Stop')}
        </button>
        <div className="game-info">
          <span className="game-score">⭐ {score}</span>
          <span className="game-round">{round + 1}/{Math.min(ROUND_COUNT, wordsPool.current.length)}</span>
        </div>
      </div>

      <div className="grammar-fall-area">
        {currentWord && (
          <div
            className={`grammar-word ${answered ? (feedback === 'correct' ? 'grammar-word-correct' : 'grammar-word-wrong') : ''}`}
            style={{ top: `${fallProgress * 75}%` }}
          >
            {currentWord.text}
          </div>
        )}
      </div>

      {feedback === 'correct' && <div className="game-feedback correct-feedback">✓</div>}
      {feedback === 'wrong' && (
        <div className="game-feedback wrong-feedback">
          ✗ {currentWord?.trans1} / {currentWord?.trans2}
        </div>
      )}

      <div className="grammar-baskets grammar-baskets-meanings">
        {baskets.map(basket => (
          <button
            key={basket.id}
            className={`grammar-basket basket-meaning ${answered && basket.isCorrect ? 'basket-correct-highlight' : ''}`}
            onClick={() => handleBasketClick(basket)}
            disabled={answered || paused}
          >
            <span className="basket-trans1">{basket.text1}</span>
            <span className="basket-trans2">{basket.text2}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
