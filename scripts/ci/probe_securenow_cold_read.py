#!/usr/bin/env python3
"""SecureNow first authenticated read cold/warm probe. No network calls without --base-url."""
import argparse
import json
import statistics
import time
import urllib.error
import urllib.request
from pathlib import Path

PATH = "/v1/operational-security/paths?page=1&pageSize=1"

def summarize(samples):
    if not samples or any(s["status"] != 200 or s["milliseconds"] < 0 for s in samples):
        return {"schemaVersion": 1, "status": "INCONCLUSIVE", "samples": samples}
    warm = [s["milliseconds"] for s in samples[1:]]
    return {"schemaVersion": 1, "status": "MEASURED",
            "measurement": "external HTTP client wall-clock, not server-only latency",
            "endpoint": PATH, "firstRequestMs": samples[0]["milliseconds"],
            "warmMedianMs": statistics.median(warm) if warm else None,
            "warmSamples": len(warm), "samples": samples,
            "limitations": "Run once per new revision after readiness; not an isolated JIT or startup measurement."}

def collect(url, api_key, count):
    if count < 2 or count > 30:
        raise ValueError("count must be between 2 and 30")
    if not url.startswith("https://"):
        raise ValueError("HTTPS base URL required")
    if not api_key.strip():
        raise ValueError("API key required")
    samples = []
    for _ in range(count):
        request = urllib.request.Request(url.rstrip("/") + PATH,
                                         headers={"X-Api-Key": api_key, "Accept": "application/json"})
        start = time.perf_counter()
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                status = response.status
                response.read()
        except urllib.error.HTTPError as exc:
            status = exc.code
        samples.append({"status": status, "milliseconds": round((time.perf_counter()-start)*1000, 3)})
        if status != 200:
            break
    return summarize(samples)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--api-key", required=True)
    parser.add_argument("--samples", type=int, default=5)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = collect(args.base_url, args.api_key, args.samples)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k:v for k,v in report.items() if k != "samples"}, indent=2))
    return 0 if report["status"] == "MEASURED" else 1

if __name__ == "__main__":
    raise SystemExit(main())
