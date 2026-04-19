"use client";

import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/i18n/provider";

export default function NestLoginPage() {
  const { t } = useI18n();

  return (
    <main className="auth-shell">
      <div className="auth-bg-glow" />
      <header className="auth-topbar">
        <div>
          <h2>{t("appName")}</h2>
          <p>{t("tagline")}</p>
        </div>
        <LanguageSwitcher />
      </header>
      <div style={{ zIndex: 1, width: "min(460px, 100%)" }}>
        <AuthCard />
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link className="secondary-link" href="/login">
            Back to Supabase login
          </Link>
          {" · "}
          <Link className="secondary-link" href="/">
            Home
          </Link>
        </p>
      </div>
    </main>
  );
}
