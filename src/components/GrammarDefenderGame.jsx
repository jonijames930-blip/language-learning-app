import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/useLanguage';
import { speakLoop, stopSpeaking } from '../utils/speech';
import { playCorrectSound, playWrongSound } from '../utils/sounds';

const FALL_DURATION = 6;
const ROUND_COUNT = 10;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CATEGORIES = [
  { id: 'noun', label: 'Nouns', labelAr: 'أسماء' },
  { id: 'verb', label: 'Verbs', labelAr: 'أفعال' },
  { id: 'pronoun', label: 'Pronouns', labelAr: 'ضمائر' },
  { id: 'article', label: 'Articles', labelAr: 'أدوات' },
  { id: 'adjective', label: 'Adjectives', labelAr: 'صفات' },
  { id: 'adverb', label: 'Adverbs', labelAr: 'ظروف' },
];

const FR_PRONOUNS = ['je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'me', 'te', 'se', 'lui', 'leur', 'moi', 'toi'];
const FR_ARTICLES = ['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux', 'à', 'en', 'dans', 'sur', 'sous', 'avec', 'pour', 'par', 'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses'];
const FR_ADVERBS = ['très', 'bien', 'mal', 'vite', 'lentement', 'toujours', 'jamais', 'souvent', 'aussi', 'encore', 'déjà', 'ici', 'là', 'maintenant', 'aujourd\'hui', 'hier', 'demain', 'beaucoup', 'peu', 'trop'];
const EN_PRONOUNS = ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those'];
const EN_ARTICLES = ['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'of', 'about', 'between', 'through', 'after', 'before'];
const EN_ADVERBS = ['very', 'well', 'badly', 'quickly', 'slowly', 'always', 'never', 'often', 'also', 'still', 'already', 'here', 'there', 'now', 'today', 'yesterday', 'tomorrow', 'much', 'too', 'really'];

function classifyWord(word, lang) {
  const lower = word.toLowerCase().trim();

  if (lang === 'fr') {
    if (FR_PRONOUNS.includes(lower)) return 'pronoun';
    if (FR_ARTICLES.includes(lower)) return 'article';
    if (FR_ADVERBS.includes(lower)) return 'adverb';
    if (lower.endsWith('er') || lower.endsWith('ir') || lower.endsWith('re') ||
        lower.endsWith('ons') || lower.endsWith('ez') || lower.endsWith('ent') ||
        lower.endsWith('ais') || lower.endsWith('ait') || lower.endsWith('é')) return 'verb';
    if (lower.endsWith('eux') || lower.endsWith('euse') || lower.endsWith('if') ||
        lower.endsWith('ive') || lower.endsWith('al') || lower.endsWith('el') ||
        lower.endsWith('ique')) return 'adjective';
    return 'noun';
  }

  if (lang === 'en') {
    if (EN_PRONOUNS.includes(lower)) return 'pronoun';
    if (EN_ARTICLES.includes(lower)) return 'article';
    if (EN_ADVERBS.includes(lower)) return 'adverb';
    if (lower.endsWith('ing') || lower.endsWith('ed') || lower.endsWith('ize') ||
        lower.endsWith('ate') || lower.endsWith('ify')) return 'verb';
    if (lower.endsWith('ful') || lower.endsWith('less') || lower.endsWith('ous') ||
        lower.endsWith('ive') || lower.endsWith('able') || lower.endsWith('ible') ||
        lower.endsWith('al') || lower.endsWith('ish')) return 'adjective';
    if (lower.endsWith('ly')) return 'adverb';
    return 'noun';
  }

  return 'noun';
}

export default function GrammarDefenderGame({ phrases, onClose }) {
  const { t } = useLanguage();
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  const [wordCategory, setWordCategory] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [fallProgress, setFallProgress] = useState(0);
  const [activeCategories, setActiveCategories] = useState([]);
  const wordsPool = useRef([]);
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
          const cat = classifyWord(clean, p.lang);
          words.push({ text: clean, category: cat, lang: p.lang });
        }
      });
    });

    wordsPool.current = shuffle(words);
    const cats = [...new Set(words.map(w => w.category))];
    setActiveCategories(cats.length > 1 ? cats : CATEGORIES.map(c => c.id));
  }, [phrases]);

  const startRound = useCallback((roundIdx) => {
    setAnswered(false);
    setFeedback(null);
    setFallProgress(0);

    const pool = wordsPool.current;
    if (pool.length === 0) return;
    const word = pool[roundIdx % pool.length];
    setCurrentWord(word);
    setWordCategory(word.category);

    stopSpeaking();
    setTimeout(() => speakLoop(word.text, word.lang, 0.85), 300);

    const startTime = Date.now();
    const duration = FALL_DURATION * 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setFallProgress(progress);

      if (progress >= 1) {
        setAnswered(true);
        setFeedback('timeout');
        stopSpeaking();
        playWrongSound();
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
      stopSpeaking();
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
      stopSpeaking();
    };
  }, []);

  const handleBasketClick = (basketId) => {
    if (answered || gameOver || !currentWord) return;
    setAnswered(true);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    stopSpeaking();

    if (basketId === wordCategory) {
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

  const displayCategories = CATEGORIES.filter(c => activeCategories.includes(c.id));

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
        <button className="btn btn-secondary btn-small" onClick={() => { if (animRef.current) cancelAnimationFrame(animRef.current); stopSpeaking(); onClose(); }}>
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

      <div className="grammar-baskets grammar-baskets-grid">
        {displayCategories.map(cat => (
          <button
            key={cat.id}
            className={`grammar-basket basket-${cat.id}`}
            onClick={() => handleBasketClick(cat.id)}
            disabled={answered}
          >
            <span className="basket-label">{cat.label}</span>
            <span className="basket-label-ar">{cat.labelAr}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
