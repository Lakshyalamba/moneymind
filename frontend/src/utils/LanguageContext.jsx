import { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';

const LanguageContext = createContext(null);

const locales = { en, hi };

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('moneymind_lang') || 'en';
  });

  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('moneymind_currency') || 'INR';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('moneymind_lang', lang);
  };

  const setCurrency = (curr) => {
    setCurrencyState(curr);
    localStorage.setItem('moneymind_currency', curr);
  };

  /**
   * Translates a locale key with nested support (e.g., 'dashboard.title').
   */
  const t = (keyPath, variables = {}) => {
    const keys = keyPath.split('.');
    
    // Resolve value from the active language
    let value = locales[language];
    for (const key of keys) {
      if (value && value[key] !== undefined) {
        value = value[key];
      } else {
        value = null;
        break;
      }
    }

    // Fallback to English if value is missing in the current language
    if (value === null && language !== 'en') {
      value = locales.en;
      for (const key of keys) {
        if (value && value[key] !== undefined) {
          value = value[key];
        } else {
          value = null;
          break;
        }
      }
    }

    // If key not found anywhere, return the path
    if (value === null || typeof value !== 'string') {
      return keyPath;
    }

    // Replace variables (e.g. {name})
    let result = value;
    for (const [varName, varVal] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{${varName}}`, 'g'), varVal);
    }

    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currency, setCurrency, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
