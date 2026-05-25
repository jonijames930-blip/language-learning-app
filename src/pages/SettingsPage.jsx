import { useRef, useState } from 'react';
import { useLanguage } from '../context/useLanguage';
import { exportLessons, importLessons } from '../utils/storage';

export default function SettingsPage() {
  const { t, appLanguage, changeLanguage } = useLanguage();
  const fileInputRef = useRef(null);
  const [notification, setNotification] = useState('');

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
    </div>
  );
}
