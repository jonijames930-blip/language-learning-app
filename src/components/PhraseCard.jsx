import { useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { speakLoop, stopSpeaking, isLooping } from '../utils/speech';
import { parseWords } from '../utils/speech';
import WordCard from './WordCard';

export default function PhraseCard({ sentence, lang, onDelete, showDelete }) {
  const { t } = useLanguage();
  const [playing, setPlaying] = useState(false);

  const words = parseWords(sentence);

  const handleSpeak = (rate) => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    stopSpeaking();
    setPlaying(true);
    speakLoop(sentence, lang, rate);
  };

  const handleStop = () => {
    stopSpeaking();
    setPlaying(false);
  };

  return (
    <div className="phrase-card">
      <div className="phrase-header">
        <p className="phrase-text">{sentence}</p>
        <div className="phrase-actions">
          <button
            className={`btn-icon btn-speak-slow ${playing ? 'active-loop' : ''}`}
            onClick={() => handleSpeak(0.6)}
            title={playing ? t('stop') || 'Stop' : t('slowSpeed')}
          >
            {playing ? '⏹️' : '🐢'}
          </button>
          <button
            className={`btn-icon btn-speak-normal ${playing ? 'active-loop' : ''}`}
            onClick={() => handleSpeak(1)}
            title={playing ? t('stop') || 'Stop' : t('normalSpeed')}
          >
            {playing ? '⏹️' : '🔊'}
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
        {words.map((word, index) => (
          <WordCard key={`${word}-${index}`} word={word} lang={lang} onStopPhrase={handleStop} />
        ))}
      </div>
    </div>
  );
}
