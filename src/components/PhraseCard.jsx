import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { speakLoop, stopSpeaking, parseWordsWithLang } from '../utils/speech';
import { explainContext } from '../utils/translate';
import WordCard from './WordCard';
import DrawingCanvas from './DrawingCanvas';

export default function PhraseCard({ sentence, lang, onDelete, showDelete }) {
  const { t } = useLanguage();
  const [activeSpeed, setActiveSpeed] = useState(null);
  const [showDrawing, setShowDrawing] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const wordsWithLang = parseWordsWithLang(sentence, lang);

  const handleSpeak = (rate) => {
    const speed = rate < 1 ? 'slow' : 'normal';
    if (activeSpeed === speed) {
      stopSpeaking();
      setActiveSpeed(null);
      return;
    }
    stopSpeaking();
    setActiveSpeed(speed);
    speakLoop(sentence, lang, rate);
  };

  const handleStop = () => {
    stopSpeaking();
    setActiveSpeed(null);
  };

  const handleExplain = async () => {
    if (showExplanation) {
      setShowExplanation(false);
      return;
    }
    if (explanation) {
      setShowExplanation(true);
      return;
    }
    setExplainLoading(true);
    try {
      const result = await explainContext(sentence, lang);
      setExplanation(result);
      setShowExplanation(true);
    } catch {
      setExplanation('');
    }
    setExplainLoading(false);
  };

  return (
    <div className="phrase-card">
      <div className="phrase-header">
        <p className="phrase-text">{sentence}</p>
        <div className="phrase-actions">
          <button
            className="btn-icon btn-draw"
            onClick={() => setShowDrawing(true)}
            title={t('draw') || 'Draw'}
          >
            🖊️
          </button>
          <button
            className={`btn-icon btn-explain ${showExplanation ? 'active-loop' : ''}`}
            onClick={handleExplain}
            disabled={explainLoading}
            title={t('explainContext') || 'Explain'}
          >
            {explainLoading ? '⏳' : '🧠'}
          </button>
          <button
            className={`btn-icon btn-speak-slow ${activeSpeed === 'slow' ? 'active-loop' : ''}`}
            onClick={() => handleSpeak(0.6)}
            title={activeSpeed === 'slow' ? t('stop') || 'Stop' : t('slowSpeed')}
          >
            {activeSpeed === 'slow' ? '⏹️' : '🐢'}
          </button>
          <button
            className={`btn-icon btn-speak-normal ${activeSpeed === 'normal' ? 'active-loop' : ''}`}
            onClick={() => handleSpeak(1)}
            title={activeSpeed === 'normal' ? t('stop') || 'Stop' : t('normalSpeed')}
          >
            {activeSpeed === 'normal' ? '⏹️' : '🔊'}
          </button>
          {showDelete && (
            <button
              className="btn-icon btn-delete"
              onClick={onDelete}
              title={t('deleteSentence')}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {showExplanation && explanation && (
        <div className="context-explanation">
          <div className="explanation-header">
            <span>🧠 {t('explainContext') || 'Grammar / Context'}</span>
            <button className="btn-icon btn-icon-sm" onClick={() => setShowExplanation(false)}>✕</button>
          </div>
          <p className="explanation-text">{explanation}</p>
        </div>
      )}

      <div className="words-container">
        {wordsWithLang.map((w, index) => (
          <WordCard key={`${w.text}-${index}`} word={w.text} lang={w.lang} onStopPhrase={handleStop} />
        ))}
      </div>

      {showDrawing && (
        <DrawingCanvas
          phrase={sentence}
          storageKey={`phrase_${sentence.slice(0, 50)}`}
          onClose={() => setShowDrawing(false)}
        />
      )}
    </div>
  );
}
