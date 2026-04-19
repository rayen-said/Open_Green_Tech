import Link from "next/link";
import { Leaf, LineChart, Shield, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <main style={{ minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.2rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          background: "rgba(255,255,255,0.9)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Leaf size={22} color="var(--green-500)" />
          <strong>Open Green Tech</strong>
        </div>
        <nav style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link className="secondary-link" href="/login">
            Log in
          </Link>
          <Link href="/signup" className="secondary" style={{ textDecoration: "none" }}>
            Sign up
          </Link>
        </nav>
      </header>

      <section
        style={{
          padding: "3.5rem 1.5rem 2rem",
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
        <p style={{ color: "var(--text-muted)", letterSpacing: "0.04em", fontSize: "0.85rem" }}>
          AI-Powered Crop Advisor
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", margin: "0.4rem 0 1rem" }}>
          Telemetry, anomalies, and agronomy guidance in one workspace.
        </h1>
        <p style={{ color: "var(--text-muted)", maxWidth: 640, lineHeight: 1.6 }}>
          Open Green Tech connects field sensors to a NestJS API, structured OpenAI recommendations,
          and responsive dashboards. Mobile teams get offline-first sync, grower onboarding, and
          gamified field habits—while the web experience stays focused on operational insight.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.6rem", flexWrap: "wrap" }}>
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <button type="button" style={{ border: "none", borderRadius: 12, padding: "0.75rem 1.1rem" }}>
              Start free
            </button>
          </Link>
          <Link className="secondary-link" href="/login/nest">
            Team login (Nest)
          </Link>
        </div>
      </section>

      <section
        style={{
          padding: "2rem 1.5rem",
          maxWidth: 980,
          margin: "0 auto",
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        <article className="card">
          <LineChart size={20} color="var(--green-500)" />
          <h3 style={{ margin: "0.6rem 0 0.3rem" }}>Live telemetry</h3>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.92rem" }}>
            Temperature, humidity, and light with websocket updates on the dashboard.
          </p>
        </article>
        <article className="card">
          <Sparkles size={20} color="var(--earth-500)" />
          <h3 style={{ margin: "0.6rem 0 0.3rem" }}>Structured AI</h3>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.92rem" }}>
            JSON-validated agronomy responses merged with deterministic safety rules.
          </p>
        </article>
        <article className="card">
          <Shield size={20} color="var(--green-600)" />
          <h3 style={{ margin: "0.6rem 0 0.3rem" }}>Enterprise-ready</h3>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.92rem" }}>
            JWT auth, Supabase bridge for the web, and Prisma-backed persistence.
          </p>
        </article>
      </section>

      <section style={{ padding: "2rem 1.5rem 3rem", maxWidth: 720, margin: "0 auto" }}>
        <h2>Documentation</h2>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
          Run the Nest API on port 3000, the Next.js app on 3001, and the Flutter client against{" "}
          <code>http://10.0.2.2:3000/api</code> on Android emulators. Configure{" "}
          <code>OPENAI_API_KEY</code>, <code>SUPABASE_JWT_SECRET</code> (matching your Supabase JWT secret),
          and database <code>DATABASE_URL</code> before calling AI or Supabase exchange routes.
        </p>
      </section>
    </main>
  );
}
