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

export default function SupabaseLoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        setError("Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        return;
      }
      const { data, error: sbErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (sbErr || !data.session?.access_token) {
        setError(sbErr?.message ?? "Supabase sign-in failed.");
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
        setError(apiMessage ?? err.message ?? "Login failed while exchanging Supabase token.");
      } else {
        setError("Login failed while exchanging Supabase token.");
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
          <p>Supabase authentication</p>
        </div>
        <LanguageSwitcher />
      </header>
      <section className="auth-card">
        <h1>Sign in</h1>
        <p>Use your Supabase project user. The API exchanges the session for Nest tokens.</p>
        <form onSubmit={submit}>
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
          <button type="submit" disabled={loading}>
            {loading ? t("common.loading") : "Continue"}
          </button>
        </form>
        <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          <Link className="secondary-link" href="/signup">
            Create account
          </Link>
          {" · "}
          <Link className="secondary-link" href="/login/nest">
            Nest email / password
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
