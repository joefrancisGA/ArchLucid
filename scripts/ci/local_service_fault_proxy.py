#!/usr/bin/env python3
"""Local-only HTTP fault proxy for disposable ArchLucid API recovery drills.

Only accepts 127.0.0.1 upstream and binds 127.0.0.1. Injected 503 responses
are proxy-local; the application and its dependencies remain untouched.
"""
from __future__ import annotations

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import threading
import time
import urllib.error
import urllib.request


def run(upstream_port: int, outage_seconds: float, deadline_seconds: float,
        probe_interval: float) -> dict:
    if not (1 <= upstream_port <= 65535 and .05 <= outage_seconds <= 5
            and .1 <= deadline_seconds <= 10 and .01 <= probe_interval <= 1):
        raise ValueError("Invalid bounded local-only recovery profile")
    upstream = f"http://127.0.0.1:{upstream_port}/health/live"
    def status(url: str) -> int:
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                return response.status
        except urllib.error.HTTPError as exc:
            return exc.code
        except (OSError, TimeoutError):
            return 0

    if status(upstream) != 200:
        raise RuntimeError("Disposable local upstream /health/live must be healthy before fault injection")
    fault = threading.Event()

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path != "/health/live":
                self.send_error(404)
                return
            if fault.is_set():
                code = 503
            else:
                code = status(upstream)
                if code == 0:
                    code = 502
            self.send_response(code)
            self.end_headers()
            self.wfile.write(str(code).encode())

        def log_message(self, *_args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    server.daemon_threads = True
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    proxy = f"http://127.0.0.1:{server.server_port}/health/live"
    try:
        if status(proxy) != 200:
            raise RuntimeError("Baseline proxy health failed")
        fault.set()
        started = time.monotonic()
        failed = status(proxy) == 503
        time.sleep(outage_seconds)
        fault.clear()
        restored = time.monotonic()
        recovered = None
        probes = 0
        while time.monotonic() - restored <= deadline_seconds:
            probes += 1
            if status(proxy) == 200:
                recovered = time.monotonic()
                break
            time.sleep(probe_interval)
        return {
            "schemaVersion": 1, "profile": "disposable-local-api-proxy-fault",
            "status": "pass" if failed and recovered is not None else "fail",
            "upstream": "127.0.0.1:local-api", "proxy": "127.0.0.1:ephemeral",
            "baselineHttp200": True, "observedInjectedHttp503": failed,
            "outageSecondsObserved": round(restored - started, 4),
            "recoverySecondsObserved": round(recovered - restored, 4) if recovered else None,
            "recoveryDeadlineSeconds": deadline_seconds,
            "probeIntervalSeconds": probe_interval, "recoveryProbes": probes,
            "limitations": "Proxy-only HTTP fault; does not simulate SQL failure or prove application state recovery.",
        }
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--upstream-port", type=int, default=5000)
    parser.add_argument("--outage-seconds", type=float, default=.2)
    parser.add_argument("--recovery-deadline", type=float, default=2)
    parser.add_argument("--probe-interval", type=float, default=.05)
    parser.add_argument("--approval", required=True)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.approval != "I_APPROVE_LOCAL_DISPOSABLE_FAULT_TEST":
        parser.error("Explicit local disposable test approval required")
    result = run(args.upstream_port, args.outage_seconds,
                 args.recovery_deadline, args.probe_interval)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(f"Local service proxy recovery: {result['status']}")
    return 0 if result["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
