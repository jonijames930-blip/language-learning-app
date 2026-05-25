import { useState, useCallback, useEffect } from 'react';
import translations from '../i18n/translations';
import { LanguageContext } from './languageContextValue';

export function LanguageProvider({ children }) {
  const [appLanguage, setAppLanguage] = useState(() => {
    return localStorage.getItem('appLanguage') || 'ar';
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const t = useCallback(
    (key) => {
      return translations[appLanguage]?.[key] || translations.en[key] || key;
    },
    [appLanguage]
  );

  const changeLanguage = useCallback((lang) => {
    setAppLanguage(lang);
    localStorage.setItem('appLanguage', lang);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      return next;
    });
  }, []);

  const isRTL = appLanguage === 'ar';

  return (
    <LanguageContext.Provider value={{ appLanguage, changeLanguage, t, isRTL, darkMode, toggleDarkMode }}>
      {children}
    </LanguageContext.Provider>
  );
}
