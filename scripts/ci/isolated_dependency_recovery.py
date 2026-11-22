#!/usr/bin/env python3
"""Isolated dependency-outage/recovery timing harness; localhost only.

This tests the measurement apparatus against a deterministic local HTTP service.
It does NOT inject failures into ArchLucid, SecureNow, SQL, or production.
"""
from __future__ import annotations

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import threading
import time


class State:
    def __init__(self):
        self.healthy = True
        self.lock = threading.Lock()

    def set(self, healthy: bool):
        with self.lock:
            self.healthy = healthy

    def get(self) -> bool:
        with self.lock:
            return self.healthy


def run_experiment(outage_seconds: float, interval_seconds: float, max_recovery_seconds: float) -> dict:
    if not (0.05 <= outage_seconds <= 5 and 0.01 <= interval_seconds <= 1
            and 0.1 <= max_recovery_seconds <= 10):
        raise ValueError("Isolated profile limits exceeded")
    state = State()

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path != "/health/ready":
                self.send_error(404)
                return
            code = 200 if state.get() else 503
            self.send_response(code)
            self.end_headers()
            self.wfile.write(b"ready" if code == 200 else b"dependency unavailable")

        def log_message(self, *_args):
            pass

    # Port 0 asks the OS to select an ephemeral local-only port.
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    server.daemon_threads = True
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    import urllib.error
    import urllib.request
    url = f"http://127.0.0.1:{server.server_port}/health/ready"

    def probe() -> int:
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                return response.status
        except urllib.error.HTTPError as exc:
            return exc.code

    try:
        baseline = probe()
        if baseline != 200:
            raise RuntimeError("Baseline readiness check failed")
        state.set(False)
        outage_started = time.monotonic()
        observed_failure = probe() == 503
        time.sleep(outage_seconds)
        state.set(True)
        restored_at = time.monotonic()
        deadline = restored_at + max_recovery_seconds
        recovered_at = None
        samples = 0
        while time.monotonic() < deadline:
            samples += 1
            if probe() == 200:
                recovered_at = time.monotonic()
                break
            time.sleep(interval_seconds)
        passed = observed_failure and recovered_at is not None
        return {
            "schemaVersion": 1,
            "profile": "local-synthetic-dependency-recovery",
            "status": "pass" if passed else "fail",
            "outageSecondsRequested": outage_seconds,
            "outageSecondsObserved": round(restored_at - outage_started, 4),
            "recoverySecondsObserved": round(recovered_at - restored_at, 4) if recovered_at else None,
            "recoveryDeadlineSeconds": max_recovery_seconds,
            "probeIntervalSeconds": interval_seconds,
            "recoveryProbes": samples,
            "observedHttp503DuringOutage": observed_failure,
            "baselineHttp200": baseline == 200,
            "target": "127.0.0.1:ephemeral",
            "limitations": "Measures only deterministic local harness recovery, not product or SQL recovery.",
        }
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--outage-seconds", type=float, default=0.2)
    parser.add_argument("--probe-interval", type=float, default=0.05)
    parser.add_argument("--recovery-deadline", type=float, default=2)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = run_experiment(args.outage_seconds, args.probe_interval, args.recovery_deadline)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"Isolated recovery harness: {result['status']}")
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
