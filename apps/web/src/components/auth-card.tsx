"use client";

import { useI18n } from "@/i18n/provider";
import { api } from "@/lib/api";
import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";

type AuthMode = "login" | "signup";

export function AuthCard() {
  const { t } = useI18n();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";
      const payload =
        mode === "login"
          ? { email, password }
          : { fullName, email, password };

      const response = await api.post(endpoint, payload);
      setAuth(response.data.accessToken, response.data.refreshToken, response.data.user);
    } catch {
      setError("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card">
      <h1>{t("auth.welcome")}</h1>
      <p>{t("auth.subtitle")}</p>
      <form onSubmit={submit}>
        {mode === "signup" ? (
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t("auth.fullName")}
            required
          />
        ) : null}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder={t("auth.email")}
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder={t("auth.password")}
          required
          minLength={6}
        />
        {error ? <div className="auth-error">{error}</div> : null}
        <button type="submit" disabled={loading}>
          {loading
            ? t("common.loading")
            : mode === "login"
              ? t("auth.login")
              : t("auth.signup")}
        </button>
      </form>
      <button
        type="button"
        className="auth-switch"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? t("auth.switchToSignup") : t("auth.switchToLogin")}
      </button>
    </section>
  );
}
