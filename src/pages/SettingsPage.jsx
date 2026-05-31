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
    localStorage.removeItem('syrian_lessons_v2');
    localStorage.removeItem('syrian_input_text_v2');
    localStorage.removeItem('syrian_input_sentences_v2');
    localStorage.removeItem('syrian_input_lang_v2');
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

      <div className="settings-section contact-section">
        <h3>{t('contactUs') || 'Contact Us'}</h3>
        <div className="contact-grid">
          <a
            href="https://wa.me/33775813643"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-item whatsapp"
          >
            <svg viewBox="0 0 24 24" className="contact-icon"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <div className="contact-info">
              <span className="contact-label">{t('contactWhatsApp') || 'WhatsApp'}</span>
              <span className="contact-value">+33 7 75 81 36 43</span>
            </div>
          </a>

          <a
            href="mailto:syrian020@gmail.com"
            className="contact-item email"
          >
            <svg viewBox="0 0 24 24" className="contact-icon"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            <div className="contact-info">
              <span className="contact-label">{t('contactEmail') || 'Email'}</span>
              <span className="contact-value">syrian020@gmail.com</span>
            </div>
          </a>

          <a
            href="https://www.tiktok.com/@encorefr7?_r=1&_t=ZN-96pIpFRw6Tu"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-item tiktok"
          >
            <svg viewBox="0 0 24 24" className="contact-icon"><path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.16a8.18 8.18 0 004.76 1.51v-3.4a4.85 4.85 0 01-1-.58z"/></svg>
            <div className="contact-info">
              <span className="contact-label">{t('contactTikTok') || 'TikTok'}</span>
              <span className="contact-value">@encorefr7</span>
            </div>
          </a>

          <a
            href="https://www.instagram.com/encore.fr?igsh=ejVlaGk2NTl0ajQ2"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-item instagram"
          >
            <svg viewBox="0 0 24 24" className="contact-icon"><path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            <div className="contact-info">
              <span className="contact-label">{t('contactInstagram') || 'Instagram'}</span>
              <span className="contact-value">@encore.fr</span>
            </div>
          </a>

          <a
            href="https://www.facebook.com/share/17g9nj49BT/"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-item facebook"
          >
            <svg viewBox="0 0 24 24" className="contact-icon"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <div className="contact-info">
              <span className="contact-label">{t('contactFacebook') || 'Facebook'}</span>
              <span className="contact-value">Encore FR</span>
            </div>
          </a>

          <a
            href="https://www.snapchat.com/add/encorefr?share_id=fnZdDI1QfBE&locale=en-US"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-item snapchat"
          >
            <svg viewBox="0 0 24 24" className="contact-icon"><path fill="currentColor" d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.214.14-.05.34-.12.553-.12.21 0 .36.06.51.18.21.18.24.39.24.57 0 .39-.18.72-.48.93-.63.42-1.38.66-1.86.84-.18.06-.35.12-.42.15-.18.12-.24.27-.3.42-.06.18-.06.36 0 .54.21.72.48 1.41.81 2.04.6 1.14 1.38 2.01 2.31 2.58.3.18.54.3.78.42.12.06.24.12.39.21.12.06.24.15.3.27.06.12.09.27.06.42-.15.6-1.05.87-1.26.93-.09.03-.33.09-.6.09-.36 0-.87-.09-1.5-.36-.45-.18-.78-.3-1.14-.3-.21 0-.42.03-.63.12-.39.15-.69.42-.99.72-.48.45-1.05.96-2.25 1.02h-.12c-1.2-.06-1.77-.57-2.25-1.02-.3-.3-.6-.57-.99-.72-.21-.09-.42-.12-.63-.12-.39 0-.72.12-1.14.3-.63.27-1.14.36-1.5.36-.27 0-.51-.06-.6-.09-.21-.06-1.11-.33-1.26-.93-.03-.15 0-.3.06-.42.06-.12.18-.21.3-.27.15-.09.27-.15.39-.21.24-.12.48-.24.78-.42.93-.57 1.71-1.44 2.31-2.58.33-.63.6-1.32.81-2.04.06-.18.06-.36 0-.54-.06-.15-.12-.3-.3-.42-.06-.03-.24-.09-.42-.15-.48-.18-1.23-.42-1.86-.84-.3-.21-.48-.54-.48-.93 0-.18.03-.39.24-.57.15-.12.3-.18.51-.18.21 0 .42.06.55.12.26.09.62.2.92.21.2 0 .33-.04.4-.09a7.804 7.804 0 01-.03-.51l-.003-.06c-.104-1.628-.23-3.654.3-4.847C7.86 1.069 11.216.793 12.206.793z"/></svg>
            <div className="contact-info">
              <span className="contact-label">{t('contactSnapchat') || 'Snapchat'}</span>
              <span className="contact-value">@encorefr</span>
            </div>
          </a>

          <a
            href="https://youtube.com/@encore.fr7?si=l5kRixzt436tAqio"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-item youtube"
          >
            <svg viewBox="0 0 24 24" className="contact-icon"><path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            <div className="contact-info">
              <span className="contact-label">{t('contactYouTube') || 'YouTube'}</span>
              <span className="contact-value">@encore.fr7</span>
            </div>
          </a>

          <a
            href="https://whatsapp.com/channel/0029VbCsfgI8kyyTTVfrFn1D"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-item whatsapp-channel"
          >
            <svg viewBox="0 0 24 24" className="contact-icon"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <div className="contact-info">
              <span className="contact-label">{t('contactWhatsAppChannel') || 'WhatsApp Channel'}</span>
              <span className="contact-value">Encore Fr</span>
            </div>
          </a>
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
