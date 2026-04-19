"use client";

import { AuthCard } from "@/components/auth-card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/i18n/provider";
import { api, setApiToken } from "@/lib/api";
import type { AdminOverview, Alert, Device, Recommendation, TelemetryPoint, User } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { useToastStore } from "@/store/toast-store";
import { Activity, BellRing, Brain, Cpu, Leaf, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

type Tab = "dashboard" | "devices" | "recommendations" | "alerts" | "admin";

const statusOptions = ["ONLINE", "OFFLINE", "MAINTENANCE"];

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();
  const { token, refreshToken, user, hydrated, hydrate, logout } = useAuthStore();
  const pushToast = useToastStore((state) => state.pushToast);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [devices, setDevices] = useState<Device[]>([]);
  const [telemetryFeed, setTelemetryFeed] = useState<TelemetryPoint[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);

  const [deviceForm, setDeviceForm] = useState({
    name: "",
    location: "",
    soilType: "",
    cropType: "",
    status: "ONLINE",
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setApiToken(token);
  }, [token]);

  const loadAppData = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const [devicesRes, latestRes, alertsRes] = await Promise.all([
        api.get<Device[]>("/devices"),
        api.get<Array<{ id: string; name: string; latest: TelemetryPoint | null }>>("/telemetry/latest"),
        api.get<Alert[]>("/alerts"),
      ]);

      setDevices(devicesRes.data);
      setAlerts(alertsRes.data);

      const flattened = latestRes.data
        .filter((item) => item.latest)
        .map((item) => ({
          ...item.latest,
          deviceId: item.id,
        })) as TelemetryPoint[];
      setTelemetryFeed(flattened);

      if (!selectedDeviceId && devicesRes.data.length > 0) {
        setSelectedDeviceId(devicesRes.data[0].id);
      }

      if (user?.role === "ADMIN") {
        const [usersRes, adminRes, demoRes] = await Promise.all([
          api.get<User[]>("/users"),
          api.get<AdminOverview>("/admin/overview"),
          api.get<{ running: boolean }>("/demo/status"),
        ]);
        setUsers(usersRes.data);
        setAdminOverview(adminRes.data);
        setDemoRunning(demoRes.data.running);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !hydrated) {
      return;
    }
    void loadAppData();
  }, [token, hydrated]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket: Socket = io(process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000", {
      transports: ["websocket"],
    });

    socket.on("telemetry:update", (payload: TelemetryPoint) => {
      setTelemetryFeed((prev) => [payload, ...prev].slice(0, 20));
    });

    socket.on("alerts:new", (payload: Alert) => {
      setAlerts((prev) => [payload, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!selectedDeviceId || !token) {
      return;
    }

    void api
      .get<TelemetryPoint[]>(`/telemetry/${selectedDeviceId}`)
      .then((res) => setTelemetryFeed(res.data.slice(0, 20).reverse()));
  }, [selectedDeviceId, token]);

  const chartData = useMemo(
    () =>
      telemetryFeed.map((entry) => ({
        time: new Date(entry.timestamp).toLocaleTimeString(),
        temperature: entry.temperature,
        humidity: entry.humidity,
        light: entry.light,
      })),
    [telemetryFeed],
  );

  const generateRecommendations = async () => {
    if (!selectedDeviceId) {
      return;
    }
    const response = await api.post<Recommendation[]>("/recommendations/generate", {
      deviceId: selectedDeviceId,
    });
    setRecommendations(response.data);
    setTab("recommendations");
  };

  const loadRecommendations = async () => {
    if (!selectedDeviceId) {
      return;
    }
    const response = await api.get<Recommendation[]>(`/recommendations/${selectedDeviceId}`);
    setRecommendations(response.data);
  };

  const addDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/devices", deviceForm);
    setDeviceForm({
      name: "",
      location: "",
      soilType: "",
      cropType: "",
      status: "ONLINE",
    });
    await loadAppData();
  };

  const removeDevice = async (id: string) => {
    await api.delete(`/devices/${id}`);
    await loadAppData();
  };

  const acknowledgeAlert = async (id: string) => {
    await api.patch(`/alerts/${id}/ack`);
    await loadAppData();
  };

  const startDemoMode = async () => {
    try {
      await api.post("/demo/start", { resetData: false, intervalMs: 2000 });
      setDemoRunning(true);
      pushToast({ variant: "success", message: t("demo.streaming") });
      await loadAppData();
    } catch {
      pushToast({ variant: "error", message: t("demo.startError") });
    }
  };

  const resetAndStartDemoMode = async () => {
    const confirmed = window.confirm(t("demo.confirmReset"));
    if (!confirmed) {
      pushToast({ variant: "warn", message: t("demo.cancelled") });
      return;
    }

    try {
      await api.post("/demo/start", { resetData: true, intervalMs: 2000 });
      setDemoRunning(true);
      pushToast({ variant: "success", message: t("demo.resetStreaming") });
      await loadAppData();
    } catch {
      pushToast({ variant: "error", message: t("demo.startError") });
    }
  };

  const stopDemoMode = async () => {
    try {
      await api.post("/demo/stop");
      setDemoRunning(false);
      pushToast({ variant: "warn", message: t("demo.stopped") });
    } catch {
      pushToast({ variant: "error", message: t("demo.stopError") });
    }
  };

  const logoutSession = async () => {
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken }).catch(() => undefined);
    }
    logout();
    setApiToken(null);
  };

  const issueLabel = (issue: string) => issue.replaceAll("_", " ");

  if (!hydrated) {
    return <main className="app-shell loading-view">{t("common.loading")}</main>;
  }

  if (!token || !user) {
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
        <AuthCard />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Leaf size={20} />
          <div>
            <h1>{t("appName")}</h1>
            <p>{t("tagline")}</p>
          </div>
        </div>

        <nav>
          <button onClick={() => setTab("dashboard")} className={tab === "dashboard" ? "active" : ""}>
            <Activity size={16} /> {t("nav.dashboard")}
          </button>
          <button onClick={() => setTab("devices")} className={tab === "devices" ? "active" : ""}>
            <Cpu size={16} /> {t("nav.devices")}
          </button>
          <button
            onClick={async () => {
              await loadRecommendations();
              setTab("recommendations");
            }}
            className={tab === "recommendations" ? "active" : ""}
          >
            <Brain size={16} /> {t("nav.recommendations")}
          </button>
          <button onClick={() => setTab("alerts")} className={tab === "alerts" ? "active" : ""}>
            <BellRing size={16} /> {t("nav.alerts")}
          </button>
          {user.role === "ADMIN" ? (
            <button onClick={() => setTab("admin")} className={tab === "admin" ? "active" : ""}>
              <ShieldCheck size={16} /> {t("nav.admin")}
            </button>
          ) : null}
        </nav>

        <div className="sidebar-footer">
          <LanguageSwitcher />
          <button
            onClick={() => void logoutSession()}
            className="danger"
          >
            <LogOut size={15} /> {t("auth.logout")}
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div>
            <h2>{t(`nav.${tab}`)}</h2>
            <p>{t("dashboard.subtitle")}</p>
          </div>
          <div className="workspace-actions">
            <select
              value={selectedDeviceId ?? ""}
              onChange={(e) => setSelectedDeviceId(e.target.value || null)}
            >
              <option value="">--</option>
              {devices.map((device) => (
                <option value={device.id} key={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
            {user.role === "ADMIN" ? (
              <>
                <button className="secondary" onClick={demoRunning ? stopDemoMode : startDemoMode}>
                  {demoRunning ? t("demo.stop") : t("demo.start")}
                </button>
                <button className="secondary secondary-warning" onClick={() => void resetAndStartDemoMode()}>
                  {t("demo.resetStart")}
                </button>
              </>
            ) : null}
            <button className="secondary" onClick={() => router.push("/live-monitoring")}>{t("nav.live")}</button>
          </div>
        </header>

        {loading ? (
          <div className="skeleton-grid">
            <div className="skeleton-block" />
            <div className="skeleton-block" />
            <div className="skeleton-block" />
            <div className="skeleton-block" />
          </div>
        ) : null}

        {tab === "dashboard" ? (
          <>
            <div className="metrics-grid">
              <article>
                <span>{t("dashboard.temperature")}</span>
                <h3>{telemetryFeed[0]?.temperature?.toFixed(1) ?? "--"} C</h3>
              </article>
              <article>
                <span>{t("dashboard.humidity")}</span>
                <h3>{telemetryFeed[0]?.humidity?.toFixed(1) ?? "--"} %</h3>
              </article>
              <article>
                <span>{t("dashboard.light")}</span>
                <h3>{telemetryFeed[0]?.light?.toFixed(0) ?? "--"}</h3>
              </article>
              <article>
                <span>{t("dashboard.anomaly")}</span>
                <h3>{telemetryFeed[0]?.anomaly ? t("dashboard.risk") : t("dashboard.healthy")}</h3>
              </article>
            </div>

            <section className="card chart-card">
              <div className="chart-header">
                <h3>{t("dashboard.title")}</h3>
                <button onClick={generateRecommendations}>{t("recommendations.generate")}</button>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="time" hide={chartData.length < 4} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="temperature" stroke="#2c8f58" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="humidity" stroke="#4f46e5" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="light" stroke="#a16207" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        ) : null}

        {tab === "devices" ? (
          <section className="card device-layout">
            <div>
              <h3>{t("devices.title")}</h3>
              <ul className="device-list">
                {devices.length === 0 ? <li>{t("common.noData")}</li> : null}
                {devices.map((device) => (
                  <li key={device.id}>
                    <div>
                      <strong>{device.name}</strong>
                      <p>{device.location} · {device.soilType} · {device.cropType}</p>
                      {user.role === "ADMIN" && device.owner ? (
                        <small>{t("common.owner")}: {device.owner.fullName}</small>
                      ) : null}
                    </div>
                    <button onClick={() => removeDevice(device.id)}>{t("devices.delete")}</button>
                  </li>
                ))}
              </ul>
            </div>

            <form className="device-form" onSubmit={addDevice}>
              <h4>{t("devices.add")}</h4>
              <input
                value={deviceForm.name}
                onChange={(e) => setDeviceForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t("devices.name")}
                required
              />
              <input
                value={deviceForm.location}
                onChange={(e) => setDeviceForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder={t("devices.location")}
                required
              />
              <input
                value={deviceForm.soilType}
                onChange={(e) => setDeviceForm((prev) => ({ ...prev, soilType: e.target.value }))}
                placeholder={t("devices.soilType")}
                required
              />
              <input
                value={deviceForm.cropType}
                onChange={(e) => setDeviceForm((prev) => ({ ...prev, cropType: e.target.value }))}
                placeholder={t("devices.cropType")}
                required
              />
              <select
                value={deviceForm.status}
                onChange={(e) => setDeviceForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button type="submit">{t("devices.save")}</button>
            </form>
          </section>
        ) : null}

        {tab === "recommendations" ? (
          <section className="card recommendation-list">
            <h3>{t("recommendations.title")}</h3>
            {recommendations.length === 0 ? <p>{t("common.noData")}</p> : null}
            {recommendations.map((item) => (
              <article key={item.id}>
                <h4>{item.title}</h4>
                <p>{item.explanation}</p>
                <div className="recommendation-metadata">
                  <small>
                    {item.type} · {t("recommendations.confidence")}: {item.confidence}%
                  </small>
                  <small>
                    {t("recommendations.issues")}: {item.detectedIssues.length > 0 ? item.detectedIssues.map(issueLabel).join(", ") : "none"}
                  </small>
                  <small>
                    {t("recommendations.why")} {item.reason}
                  </small>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {tab === "alerts" ? (
          <section className="card recommendation-list">
            <h3>{t("alerts.title")}</h3>
            {alerts.length === 0 ? <p>{t("common.noData")}</p> : null}
            {alerts.map((alert) => (
              <article key={alert.id}>
                <h4>{alert.title}</h4>
                <p>{alert.message}</p>
                <small>{alert.severity} · {new Date(alert.createdAt).toLocaleString()}</small>
                {!alert.acknowledged ? (
                  <button onClick={() => acknowledgeAlert(alert.id)}>{t("alerts.ack")}</button>
                ) : null}
              </article>
            ))}
          </section>
        ) : null}

        {tab === "admin" && user.role === "ADMIN" ? (
          <section className="card admin-grid">
            <article>
              <h3>{t("admin.users")}</h3>
              <ul>
                {users.map((account) => (
                  <li key={account.id}>
                    <strong>{account.fullName}</strong>
                    <span>{account.email}</span>
                    <em>{account.role}</em>
                  </li>
                ))}

                <div className="chart-wrap compact">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adminOverview?.kpiSeries ?? []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2f7f4d" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ul>
            </article>

            <article>
              <h3>{t("admin.devices")}</h3>
              <div className="admin-stats">
                <div>
                  <strong>{adminOverview?.totalUsers ?? users.length}</strong>
                  <span>{t("admin.users")}</span>
                </div>
                <div>
                  <strong>{adminOverview?.totalDevices ?? devices.length}</strong>
                  <span>{t("admin.devices")}</span>
                </div>
                <div>
                  <strong>{adminOverview?.anomaliesDetected ?? 0}</strong>
                  <span>{t("dashboard.anomaly")}</span>
                </div>
                <div>
                  <strong>{adminOverview?.liveTelemetry24h ?? 0}</strong>
                  <span>24h live</span>
                </div>
              </div>

              <div className="activity-feed">
                <h4>{t("admin.topProblemDevices")}</h4>
                {(adminOverview?.topProblemDevices ?? []).slice(0, 4).map((item) => (
                  <div key={item.deviceId}>
                    <span>{item.deviceName}</span>
                    <small>{item.location} · {item.anomalies} anomalies</small>
                  </div>
                ))}
              </div>

              <div className="activity-feed">
                <h4>{t("admin.recentStream")}</h4>
                {(adminOverview?.recentActivity ?? []).slice(0, 5).map((item) => (
                  <div key={item.id}>
                    <span>{item.device.name}</span>
                    <small>
                      {item.temperature} C · {item.humidity}% · {new Date(item.timestamp).toLocaleTimeString()}
                    </small>
                  </div>
                ))}
              </div>
            </article>
          </section>
        ) : null}
      </section>

      <aside className="floating-live-badge">{demoRunning ? t("demo.streaming") : t("live.normal")}</aside>
    </main>
  );
}
