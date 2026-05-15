import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { type Language, t as translate, type TranslationKey } from "@/i18n/translations";

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  toggleLanguage: () => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);
const LANG_KEY = "tilawah_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((val) => {
      if (val === "ar" || val === "en") setLanguage(val);
    });
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next: Language = prev === "en" ? "ar" : "en";
      AsyncStorage.setItem(LANG_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate(language, key, vars),
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{ language, isRTL: language === "ar", toggleLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
