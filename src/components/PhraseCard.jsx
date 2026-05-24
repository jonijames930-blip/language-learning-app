import { useLanguage } from '../context/useLanguage';
import { speakLoop, stopSpeaking } from '../utils/speech';
import { parseWords } from '../utils/speech';
import WordCard from './WordCard';

export default function PhraseCard({ sentence, lang, onDelete, showDelete }) {
  const { t } = useLanguage();

  const words = parseWords(sentence);

  const handleSpeak = (rate) => {
    stopSpeaking();
    speakLoop(sentence, lang, rate, 3);
  };

  return (
    <div className="phrase-card">
      <div className="phrase-header">
        <p className="phrase-text">{sentence}</p>
        <div className="phrase-actions">
          <button
            className="btn-icon btn-speak-slow"
            onClick={() => handleSpeak(0.6)}
            title={t('slowSpeed')}
          >
            🐢
          </button>
          <button
            className="btn-icon btn-speak-normal"
            onClick={() => handleSpeak(1)}
            title={t('normalSpeed')}
          >
            🔊
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
          <WordCard key={`${word}-${index}`} word={word} lang={lang} />
        ))}
      </div>
    </div>
  );
}
