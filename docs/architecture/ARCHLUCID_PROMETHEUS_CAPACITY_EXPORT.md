# Read-only Prometheus capacity export

Run `scripts/ops/export_archlucid_capacity_prometheus.py` **only against an authorized HTTPS Prometheus-compatible endpoint**. The caller supplies a workload class, software revision, expected forecast, and UTC start/end timestamps for a window no longer than 24h. Optionally provide a scoped bearer token in the `ARCHLUCID_METRICS_BEARER` environment variable; do not use credentials in URLs. Sample interval must be 15–3600 seconds.

Example:
```sh
python3 scripts/ops/export_archlucid_capacity_prometheus.py \
  --base-url https://YOUR-PROMETHEUS \
  --metric archlucid_llm_prompt_tokens_total --revision RELEASE_SHA \
  --workload AiInference --forecast 1000 --start 1793203200 --end 1793206800 \
  --output artifacts/capacity/observations.json
```

The collector makes a **single read-only** Prometheus `query_range` request for `sum(allowlisted_counter)`, discards labels, rejects malformed/multiple series, negative or resetting values, missing samples and oversized payloads, and writes versioned observations for `WorkloadForecastHistory.Import`. It does not query tenant-specific time series. The endpoint must enforce read-only access, strong TLS, and network restrictions.

**Important limits:** Differences between first/last scrape samples are not exact full-window deltas if scrapes do not align. Aggregation across multiple counter instances may conceal resets, replica churn, and counter label changes. This is a best-effort descriptive token/job demand observation, NOT isolated CPU, memory, worker utilization, or per-tenant calibration, and should not be interpreted as billing. Configure approval, retention, cadence and an approved artifact store before automated scheduling. No production deployment, subscription permissions or autoscaling policy are changed.
