"use client";

import { useI18n } from "@/i18n/provider";
import { setApiToken } from "@/lib/api";
import type { TelemetryPoint } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function LiveMonitoringPage() {
  const { t } = useI18n();
  const { token, user } = useAuthStore();
  const [feed, setFeed] = useState<TelemetryPoint[]>([]);

  useEffect(() => {
    setApiToken(token);
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket: Socket = io(process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000", {
      transports: ["websocket"],
    });

    socket.on("telemetry:update", (payload: TelemetryPoint) => {
      setFeed((prev) => [payload, ...prev].slice(0, 40));
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const status = useMemo(() => {
    const latest = feed[0];
    if (!latest) {
      return { label: t("live.normal"), className: "status-normal" };
    }
    if (latest.temperature > 42 || latest.anomaly) {
      return { label: t("live.critical"), className: "status-critical" };
    }
    if (latest.temperature > 35 || latest.humidity < 30) {
      return { label: t("live.warning"), className: "status-warning" };
    }
    return { label: t("live.normal"), className: "status-normal" };
  }, [feed, t]);

  if (!token || !user) {
    return (
      <main className="live-monitoring-shell">
        <div className="card">
          <h2>{t("auth.login")}</h2>
          <p>{t("auth.subtitle")}</p>
          <Link href="/" className="secondary-link">Back</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="live-monitoring-shell">
      <header className="live-header card">
        <h1>{t("live.title")}</h1>
        <div className={`live-status ${status.className}`}>● {status.label}</div>
        <Link href="/" className="secondary-link">Dashboard</Link>
      </header>

      <section className="card live-grid">
        {feed.length === 0 ? <p>{t("common.loading")}</p> : null}
        {feed.map((item) => (
          <article key={item.id} className="live-item">
            <strong>{new Date(item.timestamp).toLocaleTimeString()}</strong>
            <p>{t("dashboard.temperature")}: {item.temperature.toFixed(1)} C</p>
            <p>{t("dashboard.humidity")}: {item.humidity.toFixed(1)}%</p>
            <p>{t("dashboard.light")}: {item.light.toFixed(0)}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
