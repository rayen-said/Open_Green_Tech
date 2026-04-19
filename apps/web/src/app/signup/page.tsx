"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/i18n/provider";
import { setApiToken } from "@/lib/api";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

export default function SupabaseSignupPage() {
  const { t } = useI18n();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        setError("Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        return;
      }
      const { data, error: sbErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (sbErr) {
        setError(sbErr.message);
        return;
      }
      if (!data.session?.access_token) {
        setInfo("Check your email to confirm the account, then sign in.");
        return;
      }
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
      const res = await axios.post<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; fullName: string; role: string };
      }>(`${base.replace(/\/$/, "")}/auth/supabase`, {
        accessToken: data.session.access_token,
      });
      setAuth(res.data.accessToken, res.data.refreshToken, res.data.user as User);
      setApiToken(res.data.accessToken);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const apiMessage =
          (err.response?.data as { message?: string } | undefined)?.message;
        setError(apiMessage ?? err.message ?? "Signup failed while exchanging Supabase token.");
      } else {
        setError("Signup failed while exchanging Supabase token.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-bg-glow" />
      <header className="auth-topbar">
        <div>
          <h2>{t("appName")}</h2>
          <p>Create a Supabase-backed account</p>
        </div>
        <LanguageSwitcher />
      </header>
      <section className="auth-card">
        <h1>Sign up</h1>
        <p>We create a matching API user on first login so devices and telemetry stay in NestJS.</p>
        <form onSubmit={submit}>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            required
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            required
            minLength={6}
          />
          {error ? <div className="auth-error">{error}</div> : null}
          {info ? <div className="auth-error" style={{ color: "var(--text)" }}>{info}</div> : null}
          <button type="submit" disabled={loading}>
            {loading ? t("common.loading") : "Create account"}
          </button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          <Link className="secondary-link" href="/login">
            Already have an account?
          </Link>
          {" · "}
          <Link className="secondary-link" href="/">
            Home
          </Link>
        </p>
      </section>
    </main>
  );
}
