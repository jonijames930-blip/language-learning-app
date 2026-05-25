import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { speakLoop, stopSpeaking, parseWordsWithLang } from '../utils/speech';
import WordCard from './WordCard';
import DrawingCanvas from './DrawingCanvas';

export default function PhraseCard({ sentence, lang, onDelete, showDelete }) {
  const { t } = useLanguage();
  const [activeSpeed, setActiveSpeed] = useState(null);
  const [showDrawing, setShowDrawing] = useState(false);

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
