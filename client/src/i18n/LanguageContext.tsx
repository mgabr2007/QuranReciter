import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from './translations';
import { apiRequest } from '@/lib/queryClient';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load language from backend preferences on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const preferences = await fetch('/api/preferences').then(res => res.json());
        const lang = preferences.language as Language;
        if (lang && (lang === 'en' || lang === 'ar')) {
          setLanguageState(lang);
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = lang;
        }
      } catch (error) {
        // Fallback to localStorage if backend fails
        const savedLanguage = localStorage.getItem('language') as Language;
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
          setLanguageState(savedLanguage);
          document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = savedLanguage;
        }
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    // Set document direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // Sync to backend
    try {
      await apiRequest('PUT', '/api/preferences', { language: lang });
    } catch (error) {
      console.error('Failed to sync language to backend:', error);
    }
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || translations.en[key] || key;
    
    // Replace parameters in translation string
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), String(params[param]));
      });
    }
    
    return translation;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
