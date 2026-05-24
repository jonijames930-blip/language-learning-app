import { useLanguage } from '../context/useLanguage';

export default function SettingsPage() {
  const { t, appLanguage, changeLanguage } = useLanguage();

  const languages = [
    { code: 'ar', name: t('arabic'), native: 'العربية' },
    { code: 'fr', name: t('french'), native: 'Français' },
    { code: 'en', name: t('english'), native: 'English' },
  ];

  return (
    <div className="page settings-page">
      <h2>{t('settingsTab')}</h2>

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
    </div>
  );
}
