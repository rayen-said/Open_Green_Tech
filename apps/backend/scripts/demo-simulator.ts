type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    role: string;
  };
};

type Device = {
  id: string;
  name: string;
};

const apiUrl = process.env.DEMO_API_URL ?? 'http://localhost:3000/api';
const email = process.env.DEMO_EMAIL ?? 'admin@agri.com';
const password = process.env.DEMO_PASSWORD ?? 'Admin@12345';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function login(): Promise<LoginResponse> {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  return response.json() as Promise<LoginResponse>;
}

async function getDevices(accessToken: string): Promise<Device[]> {
  const response = await fetch(`${apiUrl}/devices`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Device fetch failed: ${response.status}`);
  }

  return response.json() as Promise<Device[]>;
}

function buildPayload(step: number) {
  const anomaly = step % 6 === 0;
  return {
    temperature: anomaly ? 45 + (step % 3) : 24 + (step % 5),
    humidity: anomaly ? 18 + (step % 4) : 42 + (step % 18),
    light: 260 + step * 7,
    anomaly,
  };
}

async function sendTelemetry(accessToken: string, deviceId: string, step: number) {
  const response = await fetch(`${apiUrl}/telemetry/${deviceId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildPayload(step)),
  });

  if (!response.ok) {
    throw new Error(`Telemetry post failed: ${response.status}`);
  }
}

async function main() {
  const auth = await login();
  const devices = await getDevices(auth.accessToken);

  if (devices.length === 0) {
    throw new Error('No devices available for simulation.');
  }

  const target = devices[0];
  console.log(`Simulator started on device: ${target.name}`);

  let step = 0;
  while (true) {
    await sendTelemetry(auth.accessToken, target.id, step);
    console.log(`Sent telemetry tick ${step + 1}`);
    step += 1;
    await sleep(2000);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
