"use client";

import { useI18n, type Lang } from "@/i18n/provider";

const options: Array<{ value: Lang; label: string }> = [
  { value: "fr", label: "Francais" },
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
];

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <label className="language-switcher">
      <span>{t("common.language")}</span>
      <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
