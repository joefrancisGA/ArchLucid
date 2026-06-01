> **Scope:** Operator-only investigation order from `runId`, `manifestId`, or `correlationId`. Buyer-safe exports omit raw audit payloads.

# Support and audit triage (one page)

## Inputs

| Handle | Where to start |
| --- | --- |
| `runId` | Operator shell run detail → committed manifest |
| `manifestId` | Run detail provenance card or API `GET /v1/runs/{runId}/manifest` |
| `correlationId` | API problem details, support bundle, or Application Insights trace |

## Open artifacts in this order

1. **First-pilot proof folder** (if collected): `go-no-go-summary.json`, `governance-outcome-summary.json`, `audit-evidence-summary.json`
2. **Committed-run evidence bundle** (when `-RunId` was supplied): `first-pilot-evidence/*/pilot-run-deltas.json`, `first-value-report.md`
3. **Pilot proof-packet** (CLI): `pilot-proof-packet/governance-outcome-summary.json`, `limitations.md`
4. **Support bundle** (redacted): generate via operator support flow — **internal-only** raw payloads may appear here
5. **Audit slice**: category counts from `audit-evidence-summary.json` — do **not** paste raw `DataJson` into sponsor email
6. **Trace / provenance**: `committed-review-trace-chain-summary.md` when present in proof folder
7. **Command center**: `first-pilot-command-center.md` maps findings to remediation docs

## Buyer-safe vs internal-only

| Artifact | Sponsor-safe |
| --- | --- |
| `governance-outcome-summary.md` | Yes (caveats included) |
| `audit-evidence-summary.md` | Yes (counts + event types only) |
| `policy-pack-freshness.md` | Yes |
| `route-tier-policy-nav-parity.md` | Yes |
| Support bundle SQL/raw audit exports | **No** — operator/support only |
| `preflight-output.txt` with secrets | **No** |

## Related runbooks

- [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`FIRST_PILOT_TRIAGE_CARDS.md`](FIRST_PILOT_TRIAGE_CARDS.md)
- [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)
- Audit catalog: [`../library/AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md)
