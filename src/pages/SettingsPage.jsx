import { useRef, useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { exportLessons, importLessons } from '../utils/storage';
import ConfirmDialog from '../components/ConfirmDialog';

export default function SettingsPage() {
  const { t, appLanguage, changeLanguage, darkMode, toggleDarkMode } = useLanguage();
  const fileInputRef = useRef(null);
  const [notification, setNotification] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const languages = [
    { code: 'ar', name: t('arabic'), native: 'العربية' },
    { code: 'fr', name: t('french'), native: 'Français' },
    { code: 'en', name: t('english'), native: 'English' },
  ];

  const handleExport = async () => {
    try {
      await exportLessons();
      setNotification(t('exportSuccess'));
    } catch {
      setNotification(t('exportError') || 'Export failed');
    }
    setTimeout(() => setNotification(''), 3000);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const added = await importLessons(file);
      setNotification(`${t('importSuccess')} (${added})`);
    } catch {
      setNotification(t('importError'));
    }
    setTimeout(() => setNotification(''), 3000);
    e.target.value = '';
  };

  const handleClearAllData = () => {
    localStorage.removeItem('language_lessons');
    localStorage.removeItem('input_text');
    localStorage.removeItem('input_sentences');
    localStorage.removeItem('input_lang');
    localStorage.removeItem('saved_translations');
    localStorage.removeItem('saved_drawings');
    setNotification(t('dataCleared'));
    setShowClearConfirm(false);
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="page settings-page">
      <h2>{t('settingsTab')}</h2>

      {notification && <div className="notification success">{notification}</div>}

      <div className="settings-section">
        <h3>{t('appLanguage')}</h3>
        <div className="language-options">
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`lang-option ${appLanguage === lang.code ? 'active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span className="lang-native">{lang.native}</span>
              <span className="lang-name">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>{t('darkMode')}</h3>
        <div className="dark-mode-toggle">
          <span>{darkMode ? '🌙' : '☀️'} {t('darkMode')}</span>
          <label className="toggle-switch">
            <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>{t('backupRestore')}</h3>
        <div className="backup-actions">
          <button className="btn btn-primary" onClick={handleExport}>
            📥 {t('exportLessons')}
          </button>
          <button className="btn btn-success" onClick={() => fileInputRef.current?.click()}>
            📤 {t('importLessons')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>{t('clearAllData')}</h3>
        <div className="backup-actions">
          <button className="btn btn-danger" onClick={() => setShowClearConfirm(true)}>
            🗑️ {t('clearAllData')}
          </button>
        </div>
      </div>

      {showClearConfirm && (
        <ConfirmDialog
          message={t('confirmClearData')}
          onConfirm={handleClearAllData}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
}
