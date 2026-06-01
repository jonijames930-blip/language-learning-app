import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/useLanguage';
import { translateText } from '../utils/translate';
import { playCorrectSound, playWrongSound } from '../utils/sounds';

const MATCH_COUNT = 4;
const TIME_LIMIT = 15;

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

export default function FastMatchGame({ phrases, onClose }) {
  const { t } = useLanguage();
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [leftColumn, setLeftColumn] = useState([]);
  const [rightColumn, setRightColumn] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const wordsPool = useRef([]);
  const timerRef = useRef(null);

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
      for (const w of words.slice(0, 16)) {
        try {
          const result = await translateText(w.text, w.lang, 'ar');
          if (result.translation && result.translation !== w.text) {
            translatedWords.push({ ...w, arabic: result.translation });
          }
        } catch { /* skip */ }
      }

      wordsPool.current = translatedWords;
      const rounds = Math.floor(translatedWords.length / MATCH_COUNT);
      setTotalRounds(Math.min(rounds, 5));
      setLoading(false);
    };
    buildPool();
  }, [phrases]);

  const startRound = (roundIdx) => {
    setSelectedLeft(null);
    setMatched([]);
    setWrongPair(null);
    setTimeLeft(TIME_LIMIT);

    const pool = wordsPool.current;
    const start = roundIdx * MATCH_COUNT;
    const roundWords = pool.slice(start, start + MATCH_COUNT);
    if (roundWords.length < 2) {
      setGameOver(true);
      return;
    }

    setLeftColumn(shuffle(roundWords.map(w => ({ id: w.text, text: w.text, lang: w.lang }))));
    setRightColumn(shuffle(roundWords.map(w => ({ id: w.text, text: w.arabic, matchId: w.text }))));

    if (timerRef.current) clearInterval(timerRef.current);
    let remaining = TIME_LIMIT;
    timerRef.current = setInterval(() => {
      remaining -= 0.1;
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft(0);
        nextRound(roundIdx);
      } else {
        setTimeLeft(remaining);
      }
    }, 100);
  };

  const nextRound = (currentRound) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const next = currentRound + 1;
    if (next >= totalRounds) {
      setGameOver(true);
    } else {
      setRound(next);
      startRound(next);
    }
  };

  useEffect(() => {
    if (!loading && totalRounds > 0) {
      startRound(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, totalRounds]);

  const handleLeftClick = (item) => {
    if (matched.includes(item.id)) return;
    setSelectedLeft(item);
    setWrongPair(null);
  };

  const handleRightClick = (item) => {
    if (!selectedLeft || matched.includes(item.matchId)) return;

    if (selectedLeft.id === item.matchId) {
      setMatched(prev => {
        const newMatched = [...prev, item.matchId];
        playCorrectSound();
        setScore(s => s + 1);
        if (newMatched.length === leftColumn.length) {
          setTimeout(() => nextRound(round), 800);
        }
        return newMatched;
      });
      setSelectedLeft(null);
    } else {
      setWrongPair({ left: selectedLeft.id, right: item.matchId });
      playWrongSound();
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
      }, 800);
    }
  };

  const handleRestart = () => {
    wordsPool.current = shuffle(wordsPool.current);
    setScore(0);
    setRound(0);
    setGameOver(false);
    setMatched([]);
    setSelectedLeft(null);
    startRound(0);
  };

  const timerPercent = (timeLeft / TIME_LIMIT) * 100;

  if (loading) {
    return (
      <div className="fast-match-game">
        <div className="game-over-screen">
          <p>⏳ {t('loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (wordsPool.current.length < 2) {
    return (
      <div className="fast-match-game">
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
      <div className="fast-match-game">
        <div className="game-over-screen">
          <h2>🎉 {t('testComplete')}</h2>
          <div className="final-score">
            <span className="score-number">{score}</span>
            <span className="score-total"> {t('points') || 'Points'}</span>
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
    <div className="fast-match-game">
      <div className="game-header">
        <button className="btn btn-secondary btn-small" onClick={() => { if (timerRef.current) clearInterval(timerRef.current); onClose(); }}>
          ← {t('back')}
        </button>
        <div className="game-info">
          <span className="game-score">⭐ {score}</span>
          <span className="game-round">{round + 1}/{totalRounds}</span>
        </div>
      </div>

      <div className="timer-bar">
        <div
          className={`timer-fill ${timeLeft < 3 ? 'timer-danger' : ''}`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      <p className="match-hint">{t('matchHint') || 'Match each word with its translation'}</p>

      <div className="match-columns">
        <div className="match-column match-left">
          {leftColumn.map(item => (
            <button
              key={item.id}
              className={`match-card ${matched.includes(item.id) ? 'match-done' : ''} ${selectedLeft?.id === item.id ? 'match-selected' : ''} ${wrongPair?.left === item.id ? 'match-wrong' : ''}`}
              onClick={() => handleLeftClick(item)}
              disabled={matched.includes(item.id)}
            >
              {item.text}
            </button>
          ))}
        </div>
        <div className="match-column match-right">
          {rightColumn.map(item => (
            <button
              key={item.matchId}
              className={`match-card match-card-ar ${matched.includes(item.matchId) ? 'match-done' : ''} ${wrongPair?.right === item.matchId ? 'match-wrong' : ''}`}
              onClick={() => handleRightClick(item)}
              disabled={matched.includes(item.matchId)}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
