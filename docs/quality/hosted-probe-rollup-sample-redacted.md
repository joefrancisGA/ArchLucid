> **Scope:** Sample redacted hosted probe rollup — staging methodology, not production contractual SLA.

# Hosted probe rollup — sample (redacted)

**Generated for:** Buyer-safe methodology illustration  
**Window:** 2026-05-01 through 2026-05-30 (UTC)  
**Environment:** **Staging only** (heuristic from base URL pattern)

---

## Summary

| Metric | Value |
| --- | --- |
| Probe attempts | 28 |
| Both `/health/live` and `/health/ready` OK | 26 |
| Skipped (no base URL configured) | 2 |
| Achieved probe uptime (staging) | 92.9% of attempted probes |
| Published API availability **target** | See [`API_SLOS.md`](../library/API_SLOS.md) — **target, not contract** |

---

## Constraints (read before sharing)

- **Not** production SLA evidence — staging scheduled curl probes only.
- **Not** multi-region or active/active guarantee.
- **Not** user-traffic SLO — health endpoints only.
- Pair buyer questions with [`TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md) and [`HOSTED_AVAILABILITY_ROLLUP.md`](../runbooks/HOSTED_AVAILABILITY_ROLLUP.md).

---

## How this sample was produced

```powershell
python scripts/ops/summarize_hosted_probe_artifacts.py `
  --format markdown `
  -o docs/quality/hosted-probe-rollup-sample-redacted.md `
  scripts/fixtures/hosted_probe_rollup
```

Regenerate after updating fixtures under `scripts/fixtures/hosted_probe_rollup/`.

---

## Internal vs buyer-safe fields

| Field | Buyer-safe? |
| --- | --- |
| Methodology (scheduled probe, staging URL) | Yes, with caveats above |
| Raw staging uptime percentage | Only if labeled staging + non-contractual |
| Production telemetry | Requires separate org approval — not in this sample |
