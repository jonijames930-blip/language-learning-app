import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { speakLoop, stopSpeaking, parseWordsWithLang } from '../utils/speech';
import { explainContext } from '../utils/translate';
import WordCard from './WordCard';
import DrawingCanvas from './DrawingCanvas';

const LANG_NAMES = { ar: 'العربية', fr: 'Français', en: 'English' };

function ContextSpeakBtn({ text, lang }) {
  const [active, setActive] = useState(null);

  const toggle = (rate) => {
    const speed = rate < 1 ? 'slow' : 'normal';
    if (active === speed) {
      stopSpeaking();
      setActive(null);
      return;
    }
    stopSpeaking();
    setActive(speed);
    speakLoop(text, lang, rate);
  };

  return (
    <div className="context-item">
      <span className="context-lang-label">{LANG_NAMES[lang] || lang}</span>
      <p className="context-text">{text}</p>
      <div className="context-speak-btns">
        <button
          className={`btn-icon btn-icon-sm ${active === 'slow' ? 'active-loop' : ''}`}
          onClick={() => toggle(0.6)}
        >
          {active === 'slow' ? '⏹️' : '🐢'}
        </button>
        <button
          className={`btn-icon btn-icon-sm ${active === 'normal' ? 'active-loop' : ''}`}
          onClick={() => toggle(1)}
        >
          {active === 'normal' ? '⏹️' : '🔊'}
        </button>
      </div>
    </div>
  );
}

export default function PhraseCard({ sentence, lang, onDelete, showDelete, showWords = true }) {
  const { t } = useLanguage();
  const [activeSpeed, setActiveSpeed] = useState(null);
  const [showDrawing, setShowDrawing] = useState(false);
  const [contextResults, setContextResults] = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);

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

  const handleContext = async () => {
    if (showContext) {
      setShowContext(false);
      stopSpeaking();
      return;
    }
    if (contextResults) {
      setShowContext(true);
      return;
    }
    setExplainLoading(true);
    try {
      const results = await explainContext(sentence, lang);
      setContextResults(results);
      setShowContext(true);
    } catch {
      setContextResults([]);
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
            className={`btn-icon btn-explain ${showContext ? 'active-loop' : ''}`}
            onClick={handleContext}
            disabled={explainLoading}
            title={t('context') || 'Context'}
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

      {showContext && contextResults && contextResults.length > 0 && (
        <div className="context-explanation">
          <div className="explanation-header">
            <span>🧠 {t('context') || 'Context'}</span>
            <button className="btn-icon btn-icon-sm" onClick={() => { setShowContext(false); stopSpeaking(); }}>✕</button>
          </div>
          {contextResults.map((item) => (
            <ContextSpeakBtn key={item.lang} text={item.text} lang={item.lang} />
          ))}
        </div>
      )}

      {showWords && (
        <div className="words-container">
          {wordsWithLang.map((w, index) => (
            <WordCard key={`${w.text}-${index}`} word={w.text} lang={w.lang} onStopPhrase={handleStop} />
          ))}
        </div>
      )}

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
