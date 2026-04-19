export type Role = "USER" | "ADMIN";

export type DeviceStatus = "ONLINE" | "OFFLINE" | "MAINTENANCE";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
};

export type Device = {
  id: string;
  name: string;
  location: string;
  soilType: string;
  cropType: string;
  status: DeviceStatus;
  ownerId: string;
  owner?: {
    id: string;
    fullName: string;
    email: string;
  };
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type TelemetryPoint = {
  id: string;
  temperature: number;
  humidity: number;
  light: number;
  anomaly: boolean;
  timestamp: string;
  deviceId: string;
};

export type Recommendation = {
  id: string;
  type: "CROP_HEALTH" | "IRRIGATION" | "FERTILIZER" | "BEST_CROP";
  title: string;
  explanation: string;
  reason: string;
  detectedIssues: string[];
  confidence: number;
  createdAt: string;
};

export type Alert = {
  id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  acknowledged: boolean;
  createdAt: string;
  device?: {
    id: string;
    name: string;
    location: string;
  };
};

export type AdminOverview = {
  totalUsers: number;
  totalDevices: number;
  anomaliesDetected: number;
  liveTelemetry24h: number;
  alertsOpen: number;
  kpiSeries: Array<{ label: string; value: number }>;
  topProblemDevices: Array<{
    deviceId: string;
    deviceName: string;
    location: string;
    anomalies: number;
  }>;
  recentActivity: Array<TelemetryPoint & {
    device: {
      id: string;
      name: string;
      location: string;
    };
  }>;
};
