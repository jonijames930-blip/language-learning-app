import { useState, useEffect } from 'react';
import { useLanguage } from './context/useLanguage';
import InputPage from './pages/InputPage';
import LessonsPage from './pages/LessonsPage';
import StudyPage from './pages/StudyPage';
import TranslatePage from './pages/TranslatePage';
import SettingsPage from './pages/SettingsPage';
import { showBanner, hideBanner, prepareInterstitial, prepareRewarded } from './utils/admob';
import './App.css';

const LESSON_TABS = ['lessons', 'study'];

function App() {
  const [activeTab, setActiveTab] = useState('input');
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    prepareInterstitial();
    prepareRewarded();
  }, []);

  useEffect(() => {
    if (LESSON_TABS.includes(activeTab)) {
      showBanner();
    } else {
      hideBanner();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'input', label: t('inputTab'), icon: '✏️' },
    { id: 'lessons', label: t('lessonsTab'), icon: '📚' },
    { id: 'study', label: t('studyTab'), icon: '🎧' },
    { id: 'translate', label: t('translateTab'), icon: '🌐' },
    { id: 'settings', label: t('settingsTab'), icon: '⚙️' },
  ];

  const renderPage = () => {
    switch (activeTab) {
      case 'input': return <InputPage />;
      case 'lessons': return <LessonsPage />;
      case 'study': return <StudyPage />;
      case 'translate': return <TranslatePage />;
      case 'settings': return <SettingsPage />;
      default: return <InputPage />;
    }
  };

  return (
    <div className={`app ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="app-header">
        <h1>{t('appTitle')}</h1>
      </header>

      <nav className="app-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
