import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/useLanguage';
import { translateText } from '../utils/translate';
import { speakLoop, stopSpeaking } from '../utils/speech';
import { playCorrectSound, playWrongSound } from '../utils/sounds';

const GRID_SIZE = 12;

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

function getStars(moves, pairCount) {
  const optimal = pairCount;
  if (moves <= optimal + 2) return 3;
  if (moves <= optimal + 5) return 2;
  return 1;
}

export default function MemoryMatchGame({ phrases, targetLang, onClose }) {
  const { t } = useLanguage();
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [comboFlash, setComboFlash] = useState(false);
  const pausedRef = useRef(false);
  const lockRef = useRef(false);
  const pairCountRef = useRef(0);

  useEffect(() => {
    const buildCards = async () => {
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

      const pairCount = Math.min(Math.floor(GRID_SIZE / 2), words.length);
      pairCountRef.current = pairCount;
      const selectedWords = shuffle(words).slice(0, pairCount);

      const cardPairs = [];
      for (const w of selectedWords) {
        try {
          const tgtLang = targetLang || (w.lang === 'ar' ? 'fr' : w.lang === 'fr' ? 'en' : 'ar');
          const result = await translateText(w.text, w.lang, tgtLang);
          if (result.translation && result.translation !== w.text) {
            cardPairs.push(
              { id: `src-${w.text}`, pairId: w.text, text: w.text, lang: w.lang, type: 'source' },
              { id: `tgt-${w.text}`, pairId: w.text, text: result.translation, lang: tgtLang, type: 'target' }
            );
          }
        } catch { /* skip */ }
      }

      setCards(shuffle(cardPairs));
      setLoading(false);
    };
    buildCards();
  }, [phrases, targetLang]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handlePause = () => {
    if (paused) {
      pausedRef.current = false;
      setPaused(false);
    } else {
      pausedRef.current = true;
      setPaused(true);
      stopSpeaking();
    }
  };

  const handleCardClick = (card) => {
    if (paused || gameOver || gameWon || lockRef.current) return;
    if (flipped.includes(card.id) || matched.includes(card.pairId)) return;

    stopSpeaking();
    speakLoop(card.text, card.lang, 0.85);

    const newFlipped = [...flipped, card.id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      setMoves(m => m + 1);

      const first = cards.find(c => c.id === newFlipped[0]);
      const second = cards.find(c => c.id === newFlipped[1]);

      if (first.pairId === second.pairId) {
        const newMatched = [...matched, first.pairId];
        setMatched(newMatched);
        const newCombo = combo + 1;
        setCombo(newCombo);
        const points = newCombo >= 2 ? 20 : 10;
        setScore(s => s + points);
        playCorrectSound();

        if (newCombo >= 2) {
          setComboFlash(true);
          setTimeout(() => setComboFlash(false), 800);
        }

        if (newMatched.length === pairCountRef.current) {
          setGameWon(true);
          stopSpeaking();
        }

        setTimeout(() => {
          setFlipped([]);
          lockRef.current = false;
        }, 600);
      } else {
        setCombo(0);
        playWrongSound();
        setTimeout(() => {
          setFlipped([]);
          lockRef.current = false;
        }, 800);
      }
    }
  };

  const handleRestart = () => {
    setCards(shuffle(cards));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setScore(0);
    setCombo(0);
    setGameOver(false);
    setGameWon(false);
    setPaused(false);
    pausedRef.current = false;
    lockRef.current = false;
  };

  const stars = getStars(moves, pairCountRef.current);

  if (loading) {
    return (
      <div className="memory-match-game">
        <div className="game-over-screen">
          <p>⏳ {t('loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (cards.length < 4) {
    return (
      <div className="memory-match-game">
        <div className="game-over-screen">
          <p>{t('notEnoughWords') || 'Not enough words for this game'}</p>
          <button className="btn btn-secondary" onClick={onClose}>
            ← {t('back')}
          </button>
        </div>
      </div>
    );
  }

  if (gameOver || gameWon) {
    return (
      <div className="memory-match-game">
        <div className="game-over-screen">
          <h2>🎉 {t('testComplete') || 'Complete!'}</h2>
          {gameWon && (
            <div className="star-rating">
              {[1, 2, 3].map(s => (
                <span key={s} className={`star ${s <= stars ? 'star-gold' : 'star-gray'}`}>⭐</span>
              ))}
            </div>
          )}
          <div className="final-score">
            <span className="score-number">{score}</span>
            <span className="score-total"> {t('points') || 'Points'}</span>
          </div>
          <p className="moves-count">{moves} {t('moves') || 'moves'}</p>
          <div className="game-over-actions">
            <button className="btn btn-primary" onClick={handleRestart}>
              🔄 {t('tryAgain') || 'Try Again'}
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              ✕ {t('close') || 'Fermer'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-match-game">
      <div className="game-header">
        <button className="btn btn-secondary btn-small" onClick={() => { stopSpeaking(); onClose(); }}>
          ✕ {t('close') || 'Fermer'}
        </button>
        <button className="btn btn-accent btn-small" onClick={handlePause}>
          {paused ? '▶️' : '⏸️'} {paused ? (t('resume') || 'Reprendre') : (t('pause') || 'Pause')}
        </button>
        <div className="game-info">
          <span className="game-score">⭐ {score}</span>
          <span className="game-round">{moves} {t('moves') || 'moves'}</span>
        </div>
      </div>

      {comboFlash && (
        <div className="combo-flash">🔥 COMBO x{combo}!</div>
      )}

      <div className="memory-grid">
        {cards.map(card => {
          const isFlipped = flipped.includes(card.id);
          const isMatched = matched.includes(card.pairId);

          return (
            <button
              key={card.id}
              className={`memory-card ${isFlipped ? 'memory-card-flipped' : ''} ${isMatched ? 'memory-card-matched' : ''}`}
              onClick={() => handleCardClick(card)}
              disabled={isMatched || paused}
            >
              <div className="memory-card-inner">
                <div className="memory-card-front">?</div>
                <div className="memory-card-back">{card.text}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
