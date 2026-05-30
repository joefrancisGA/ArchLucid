> **Scope:** First-pilot support and audit triage — one-page investigation order for runId / correlationId.

# First-pilot support and audit triage

Use this page when a pilot stalls, proof collection fails, or sponsor handoff is **HOLD**.

## Inputs you need

- `runId` (architecture review tracking id)
- `X-Correlation-ID` from a failed API/UI call (if any)
- Proof working directory from `collect-first-pilot-proof.ps1` or `archlucid pilot proof-packet <runId>`

## Triage order

1. **Health and version** — `GET /health/ready`, `GET /version`, or `archlucid doctor`. Confirm SQL and worker/API roles.
2. **Run detail** — operator review detail or `GET /v1/authority/runs/{runId}`. Check execution mode, governance warnings, commit-blocking finding coverage, LLM cost estimate, trust evidence card.
3. **Pipeline timeline** — `GET /v1/authority/runs/{runId}/pipeline-timeline` or review detail timeline. Note failed audit event types.
4. **Retrieval grounding** — `GET /v1/authority/runs/{runId}/retrieval-grounding` when faithfulness warnings appear.
5. **Audit search** — operator Audit UI or `GET /v1/audit/search` filtered by run id / correlation id. Export CSV only for internal review.
6. **Support bundle** — `archlucid support-bundle --zip` (redaction manifest + triage index). **Buyer-safe:** README + manifest only unless redaction reviewed.
7. **Proof artifacts** — `first-pilot-command-center.md`, `go-no-go-summary.json`, `data-consistency-readiness/`, `config-lint-production-like-hosted-pilot.md`.
8. **Escalation packet** — attach correlation id, run id, manifest id, proof **PASS/WARN/HOLD**, and `limitations.md` caveats. Do not attach raw secrets or unredacted support bundles externally.

## Seeded triage drills

Rehearse common failure modes using the synthetic drill catalog emitted by `SupportBundleTriageDrillCatalog` (`auth-loop`, `sql-not-ready`, `aoai-missing`, `proof-packet-hold`, `missing-artifact-after-commit`). Each drill lists likely cause, evidence path, correlation fields, and the next command — no live customer data required.

## Buyer-safe vs internal-only

| Artifact | External sponsor email |
| --- | --- |
| `proof-summary.md`, first-value report PDF, `limitations.md` | Yes, when **PASS** and redaction reviewed |
| `go-no-go-summary.json`, config lint, audit CSV | Internal / procurement under NDA |
| Support bundle full zip | Internal unless redaction manifest reviewed |
| Real LLM evidence gate | Internal; cite only buyer-safe rollup rows |

## Related

- [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)
- [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md)
- [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`../library/AUDIT_COVERAGE_MATRIX.md`](../library/AUDIT_COVERAGE_MATRIX.md)
