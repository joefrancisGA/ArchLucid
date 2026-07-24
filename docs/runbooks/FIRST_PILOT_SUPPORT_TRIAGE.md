> **Scope:** First-pilot support and audit triage — investigation order for runId / manifestId / correlationId. Buyer-safe exports omit raw audit payloads.

# First-pilot support and audit triage

Use this page when a pilot stalls, proof collection fails, or sponsor handoff is **HOLD**.

## Inputs you need

| Handle | Where to start |
| --- | --- |
| `runId` | Operator review detail, `GET /v1/authority/runs/{runId}`, or architecture review tracking id |
| `manifestId` | Run detail provenance card or API `GET /v1/runs/{runId}/manifest` |
| `correlationId` | API problem details (`X-Correlation-ID`), support bundle, or Application Insights trace |
| Proof working directory | `collect-first-pilot-proof.ps1` or `archlucid pilot proof-packet <runId>` |

## Triage order (live API / architect workspace)

1. **Health and version** — `GET /health/ready`, `GET /version`, or `archlucid doctor`. Confirm SQL and worker/API roles.
2. **Run detail** — operator review detail or `GET /v1/authority/runs/{runId}`. Check execution mode, governance warnings, commit-blocking finding coverage, LLM cost estimate, trust evidence card.
3. **Pipeline timeline** — `GET /v1/authority/runs/{runId}/pipeline-timeline` or review detail timeline. Note failed audit event types.
4. **Retrieval grounding** — `GET /v1/authority/runs/{runId}/retrieval-grounding` when faithfulness warnings appear.
5. **Audit search** — operator Audit UI or `GET /v1/audit/search` filtered by run id / correlation id. Export CSV only for internal review.
6. **Support bundle** — `archlucid support-bundle --zip` (redaction manifest + triage index). **Buyer-safe:** README + manifest only unless redaction reviewed.
7. **Proof artifacts** — `first-pilot-command-center.md`, `go-no-go-summary.json`, `data-consistency-readiness/`, `config-lint-production-like-hosted-pilot.md`.
8. **Escalation packet** — attach correlation id, run id, manifest id, proof **PASS/WARN/HOLD**, and `limitations.md` caveats. Do not attach raw secrets or unredacted support bundles externally.

## Artifact open order

When proof has already been collected, open artifacts in this order:

1. **First-pilot proof folder** (if collected): `go-no-go-summary.json`, `governance-outcome-summary.json`, `audit-evidence-summary.json`
2. **Committed-run evidence bundle** (when `-RunId` was supplied): `first-pilot-evidence/*/pilot-run-deltas.json`, `first-value-report.md`
3. **Pilot proof-packet** (CLI): `pilot-proof-packet/governance-outcome-summary.json`, `limitations.md`
4. **Support bundle** (redacted): generate via operator support flow — **internal-only** raw payloads may appear here
5. **Audit slice**: category counts from `audit-evidence-summary.json` — do **not** paste raw `DataJson` into sponsor email
6. **Trace / provenance**: `committed-review-trace-chain-summary.md` when present in proof folder
7. **Command center**: `first-pilot-command-center.md` maps findings to remediation docs

## Seeded triage drills

Rehearse common failure modes using the synthetic drill catalog emitted by `SupportBundleTriageDrillCatalog` (`auth-loop`, `sql-not-ready`, `aoai-missing`, `proof-packet-hold`, `missing-artifact-after-commit`). Each drill lists likely cause, evidence path, correlation fields, and the next command — no live customer data required.

## Buyer-safe vs internal-only

| Artifact | Sponsor-safe / external email |
| --- | --- |
| `governance-outcome-summary.md` | Yes (caveats included) |
| `audit-evidence-summary.md` | Yes (counts + event types only) |
| `policy-pack-freshness.md` | Yes |
| `route-tier-policy-nav-parity.md` | Yes |
| `proof-summary.md`, first-value report PDF, `limitations.md` | Yes, when **PASS** and redaction reviewed |
| `go-no-go-summary.json`, config lint, audit CSV | Internal / procurement under NDA |
| Support bundle SQL/raw audit exports | **No** — operator/support only |
| Support bundle full zip | Internal unless redaction manifest reviewed |
| `preflight-output.txt` with secrets | **No** |
| Real LLM evidence gate | Internal; cite only buyer-safe rollup rows |

## Related

- [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)
- [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md)
- [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`FIRST_PILOT_TRIAGE_CARDS.md`](FIRST_PILOT_TRIAGE_CARDS.md)
- [`../library/AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md)
