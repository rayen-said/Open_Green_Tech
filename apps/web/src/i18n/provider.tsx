"use client";

import ar from "./locales/ar.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "fr" | "ar";

type DictionaryValue = string | { [key: string]: DictionaryValue };
type Dictionary = Record<string, DictionaryValue>;

const dictionaries: Record<Lang, Dictionary> = { en, fr, ar };

function getNestedValue(dictionary: Dictionary, path: string): string {
  return path.split(".").reduce<string | Dictionary>((acc, key) => {
    if (typeof acc === "string") {
      return acc;
    }
    return acc[key] ?? path;
  }, dictionary) as string;
}

type I18nContextType = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  t: (path: string) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");

  useEffect(() => {
    const stored = window.localStorage.getItem("crop-advisor-lang") as Lang | null;
    if (stored && ["en", "fr", "ar"].includes(stored)) {
      setLang(stored);
      return;
    }

    const browserLanguage = (window.navigator.language || "fr").toLowerCase();
    if (browserLanguage.startsWith("ar")) {
      setLang("ar");
      return;
    }
    if (browserLanguage.startsWith("en")) {
      setLang("en");
      return;
    }
    setLang("fr");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("crop-advisor-lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const value = useMemo<I18nContextType>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      t: (path: string) => getNestedValue(dictionaries[lang], path),
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
