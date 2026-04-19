# Green House MQTT Integration

This folder now follows the project MQTT contract:

- `greenhouse/{deviceId}/telemetry`
- `greenhouse/{deviceId}/alerts`
- `greenhouse/{deviceId}/commands`

## ESP32 Firmware (`CODE.ino`)

1. Set `DEVICE_ID` in `CODE.ino` to match the device id stored in the backend database.
2. Set Wi-Fi and HiveMQ credentials.
3. Flash and run.

The firmware publishes telemetry every 5 seconds, publishes alert events when anomalies are detected, and subscribes to command messages.

## Python Publisher (`ei-random-test/publish_file_json_hivemq.py`)

You can bootstrap variables from `hivemq.env.example`:

```bash
cp hivemq.env.example .env.hivemq
set -a
source .env.hivemq
set +a
```

Required environment variables:

- `HIVEMQ_HOST`
- `HIVEMQ_PORT`
- `HIVEMQ_USERNAME`
- `HIVEMQ_PASSWORD`

Optional:

- `GREENHOUSE_DEVICE_ID` (default: `esp32-gh-01`)
- `HIVEMQ_TOPIC` (default: `greenhouse/{GREENHOUSE_DEVICE_ID}/telemetry`)
- `HIVEMQ_DELAY_SECONDS`

Example:

```bash
export HIVEMQ_HOST=your-broker.s1.eu.hivemq.cloud
export HIVEMQ_PORT=8883
export HIVEMQ_USERNAME=your-username
export HIVEMQ_PASSWORD=your-password
export GREENHOUSE_DEVICE_ID=esp32-gh-01
python3 publish_file_json_hivemq.py file.json
```
