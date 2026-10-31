#!/usr/bin/env python3
"""Opt-in, read-only Prometheus capacity observation collector. No tenant series exported."""
import argparse
import datetime as dt
import json
import os
import urllib.parse
import urllib.request

METRICS = {
    "archlucid_llm_prompt_tokens_total": "tokens",
    "archlucid_llm_completion_tokens_total": "tokens",
    "archlucid_llm_embedding_input_tokens_total": "tokens",
    "archlucid_container_job_runs_total": "runs",
}

def interval_delta(payload, metric, start, end, step=60):
    if payload.get("status") != "success":
        raise ValueError("Prometheus query failed")
    data = payload.get("data", {})
    if data.get("resultType") != "matrix" or len(data.get("result", [])) != 1:
        raise ValueError("Expected exactly one aggregate time series")
    series = data["result"][0]
    if series.get("metric", {}) != {}:
        raise ValueError("Unexpected metric labels in aggregate")
    points = series.get("values", [])
    if len(points) < 2 or len(points) > 10000:
        raise ValueError("Insufficient or excessive counter samples")
    samples = [(float(t), float(v)) for t, v in points]
    if any(not __import__("math").isfinite(v) or v < 0 for _, v in samples):
        raise ValueError("Invalid counter value")
    if samples[0][0] < start - 1 or samples[-1][0] > end + 1 or samples[0][0] > start + step or samples[-1][0] < end - step:
        raise ValueError("Samples outside requested time window")
    if any(t2 <= t1 or v2 < v1 for (t1, v1), (t2, v2) in zip(samples, samples[1:])):
        raise ValueError("Non-monotonic samples or counter reset; cannot infer exact delta")
    return samples[-1][1] - samples[0][1]

def collect(base_url, token, metric, start, end, step):
    parsed = urllib.parse.urlsplit(base_url)
    if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError("HTTPS Prometheus endpoint without embedded credentials required")
    if metric not in METRICS:
        raise ValueError("Metric not allowlisted")
    if not (0 < end - start <= 86400 and 15 <= step <= 3600):
        raise ValueError("Invalid bounded time window or sampling interval")
    query = "sum(" + metric + ")"
    params = urllib.parse.urlencode({"query": query, "start": str(start), "end": str(end), "step": str(step)})
    url = base_url.rstrip("/") + "/api/v1/query_range?" + params
    req = urllib.request.Request(url, headers={"Accept": "application/json", **({"Authorization": "Bearer " + token} if token else {})})
    with urllib.request.urlopen(req, timeout=30) as response:
        if response.status != 200:
            raise ValueError("Metrics endpoint returned non-200")
        body = response.read(2_000_001)
    if len(body) > 2_000_000:
        raise ValueError("Oversized metrics response")
    return interval_delta(json.loads(body), metric, start, end, step)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--base-url", required=True)
    p.add_argument("--metric", required=True, choices=sorted(METRICS))
    p.add_argument("--revision", required=True)
    p.add_argument("--workload", required=True)
    p.add_argument("--forecast", type=float, required=True)
    p.add_argument("--start", type=int, required=True, help="UTC Unix timestamp")
    p.add_argument("--end", type=int, required=True, help="UTC Unix timestamp")
    p.add_argument("--step", type=int, default=60)
    p.add_argument("--output", required=True)
    a = p.parse_args()
    if not a.revision.strip() or not a.workload.strip() or not __import__("math").isfinite(a.forecast) or a.forecast < 0:
        p.error("Nonnegative forecast and nonempty revision/workload required")
    value = collect(a.base_url, os.environ.get("ARCHLUCID_METRICS_BEARER", ""), a.metric, a.start, a.end, a.step)
    record = [{"SchemaVersion": 1, "Revision": a.revision, "Workload": a.workload,
               "Metric": a.metric, "Unit": METRICS[a.metric], "Forecast": a.forecast,
               "Actual": value, "RecordedAtUtc": dt.datetime.fromtimestamp(a.end, dt.timezone.utc).isoformat().replace("+00:00", "Z")}]
    from pathlib import Path
    output = Path(a.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    print("Exported one aggregate interval observation; no labels or credentials written.")

if __name__ == "__main__":
    main()
