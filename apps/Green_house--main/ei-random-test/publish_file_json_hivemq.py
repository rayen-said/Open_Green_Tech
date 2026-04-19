import csv
import json
import os
import ssl
import sys
import threading
import time

import paho.mqtt.client as mqtt


def get_env(name: str, required: bool = True, default: str = "") -> str:
    value = os.getenv(name, default)
    if required and not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def to_bit(value: str) -> int:
    try:
        numeric = int(float(value))
        return 1 if numeric > 0 else 0
    except Exception:
        return 0


def normalize_csv_row(row: dict) -> dict:
    # Keep values close to a realistic greenhouse operating range.
    temp = clamp(float(row.get("tempC", 22.0)), 15.0, 30.0)
    hum = clamp(float(row.get("humPct", 60.0)), 45.0, 80.0)
    moist = clamp(float(row.get("moistPct", 50.0)), 35.0, 75.0)
    lux = clamp(float(row.get("lux", 0.0)), 0.0, 1200.0)

    return {
        "timestamp": row.get("timestamp", ""),
        "tempC": round(temp, 2),
        "humPct": round(hum, 2),
        "moistPct": round(moist, 2),
        "lux": round(lux, 2),
        "heater_fan_on": to_bit(row.get("heater_fan_on", "0")),
        "fan_on": to_bit(row.get("fan_on", "0")),
        "water_pump_on": to_bit(row.get("water_pump_on", "0")),
        "humidifiers_on": to_bit(row.get("humidifiers_on", "0")),
        "grow_lights_on": to_bit(row.get("grow_lights_on", "0")),
    }


def load_rows(input_path: str) -> list:
    lower = input_path.lower()

    if lower.endswith(".csv"):
        rows = []
        with open(input_path, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(normalize_csv_row(row))
        return rows

    with open(input_path, "r", encoding="utf-8-sig") as f:
        payload_rows = json.load(f)
    if not isinstance(payload_rows, list):
        raise ValueError("JSON root must be an array of rows")
    return payload_rows


def wait_for_connection(connected_event: threading.Event, timeout_seconds: float) -> bool:
    return connected_event.wait(timeout=timeout_seconds)


def mqtt_rc_message(rc: int) -> str:
    messages = {
        0: "Connection accepted",
        1: "Connection refused: unacceptable protocol version",
        2: "Connection refused: identifier rejected",
        3: "Connection refused: server unavailable",
        4: "Connection refused: bad username or password",
        5: "Connection refused: not authorized (check username, password, and permissions)",
    }
    return messages.get(rc, f"Connection refused with rc={rc}")


def reason_code_to_int(reason_code) -> int:
    if isinstance(reason_code, (int, float)):
        return int(reason_code)

    value = getattr(reason_code, "value", None)
    if value is not None:
        try:
            return int(value)
        except Exception:
            pass

    try:
        return int(str(reason_code))
    except Exception:
        return -1


def main() -> int:
    try:
        input_path_arg = sys.argv[1] if len(sys.argv) > 1 else "file.json"
        script_dir = os.path.dirname(os.path.abspath(__file__))

        input_path = input_path_arg
        if not os.path.isabs(input_path):
            if not os.path.exists(input_path):
                fallback_path = os.path.join(script_dir, input_path)
                if os.path.exists(fallback_path):
                    input_path = fallback_path

        if not os.path.exists(input_path):
            raise FileNotFoundError(
                f"Input file not found: '{input_path_arg}'. Try an absolute path or place the file next to the script."
            )

        host = get_env(
            "HIVEMQ_HOST",
            required=False,
            default="da5e9c9f3af6499b92bdd5819d675d8c.s1.eu.hivemq.cloud",
        )
        port = int(get_env("HIVEMQ_PORT", required=False, default="8883"))
        username = get_env("HIVEMQ_USERNAME", required=False, default="")
        password = get_env("HIVEMQ_PASSWORD", required=False, default="")
        device_id = get_env("GREENHOUSE_DEVICE_ID", required=False, default="esp32-gh-01")
        topic = get_env(
            "HIVEMQ_TOPIC",
            required=False,
            default=f"greenhouse/{device_id}/telemetry",
        )
        delay_seconds = float(get_env("HIVEMQ_DELAY_SECONDS", required=False, default="2"))
        connect_timeout_seconds = float(get_env("HIVEMQ_CONNECT_TIMEOUT_SECONDS", required=False, default="15"))
        reconnect_retries = int(get_env("HIVEMQ_RECONNECT_RETRIES", required=False, default="3"))

        print(f"Using input file: {input_path}")
        payload_rows = load_rows(input_path)

        if port == 8883 and (not username or not password):
            raise ValueError(
                "HIVEMQ_USERNAME/HIVEMQ_PASSWORD are required for HiveMQ Cloud (port 8883)."
            )

        client_id = f"ei-random-test-{int(time.time())}"
        client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id=client_id,
            protocol=mqtt.MQTTv311,
        )
        connected_event = threading.Event()
        last_connect_reason = {"text": "No CONNACK received yet"}

        def on_connect(_client, _userdata, _flags, reason_code, _properties):
            rc = reason_code_to_int(reason_code)
            last_connect_reason["text"] = mqtt_rc_message(rc)
            if rc == 0:
                connected_event.set()
            else:
                connected_event.clear()
                print(last_connect_reason["text"])

        def on_disconnect(_client, _userdata, _flags, reason_code, _properties):
            rc = reason_code_to_int(reason_code)
            connected_event.clear()
            if rc != 0:
                print(f"Disconnected unexpectedly ({mqtt_rc_message(rc)})")

        client.on_connect = on_connect
        client.on_disconnect = on_disconnect

        if username:
            client.username_pw_set(username=username, password=password)

        # HiveMQ Cloud typically uses TLS on 8883.
        if port == 8883:
            client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS_CLIENT)

        print(f"Connecting to {host}:{port}...")
        client.connect(host, port, keepalive=60)
        client.loop_start()

        if not wait_for_connection(connected_event, connect_timeout_seconds):
            raise RuntimeError(f"Timed out waiting for MQTT connection. Last reason: {last_connect_reason['text']}")

        published = 0
        for row in payload_rows:
            if not connected_event.is_set():
                reconnected = False
                for attempt in range(1, reconnect_retries + 1):
                    try:
                        print(f"Reconnecting... attempt {attempt}/{reconnect_retries}")
                        client.reconnect()
                    except Exception as reconnect_exc:
                        print(f"Reconnect call failed: {reconnect_exc}")

                    if wait_for_connection(connected_event, connect_timeout_seconds):
                        reconnected = True
                        break

                if not reconnected:
                    raise RuntimeError("Message publish failed: The client is not currently connected.")

            payload = json.dumps(row, separators=(",", ":"))
            info = client.publish(topic, payload=payload, qos=1, retain=False)
            info.wait_for_publish(timeout=5.0)
            if info.rc != mqtt.MQTT_ERR_SUCCESS:
                if info.rc == mqtt.MQTT_ERR_NO_CONN:
                    raise RuntimeError("Message publish failed: The client is not currently connected.")
                raise RuntimeError(f"Publish failed with rc={info.rc} at row index {published}")
            published += 1
            if published < len(payload_rows) and delay_seconds > 0:
                time.sleep(delay_seconds)

        client.loop_stop()
        client.disconnect()

        print(f"Published {published} messages to topic '{topic}'.")
        return 0

    except Exception as exc:
        print(f"ERROR: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
