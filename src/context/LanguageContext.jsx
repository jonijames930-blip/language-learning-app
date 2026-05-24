import { useState, useCallback } from 'react';
import translations from '../i18n/translations';
import { LanguageContext } from './languageContextValue';

export function LanguageProvider({ children }) {
  const [appLanguage, setAppLanguage] = useState(() => {
    return localStorage.getItem('appLanguage') || 'ar';
  });

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

  const isRTL = appLanguage === 'ar';

  return (
    <LanguageContext.Provider value={{ appLanguage, changeLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}
