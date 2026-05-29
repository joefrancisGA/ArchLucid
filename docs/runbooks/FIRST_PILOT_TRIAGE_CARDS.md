> **Scope:** First-pilot symptom triage cards linked from go/no-go proof collection and sponsor evidence quality gates.

# First-pilot symptom → evidence triage cards

**Last reviewed:** 2026-05-28 · Full spine: [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md)

`scripts/collect-first-pilot-proof.ps1` writes these IDs into `go-no-go-summary.md` when a preflight, evidence collection, or sponsor-evidence quality gate step can be mapped to a known failure mode. For committed reviews, unresolved or failed PilotStrict sponsor evidence is a `BLOCK`; simulator-only/demo evidence remains allowed only when it is visibly labeled.

Every **BLOCK** or **WARN** finding in `go-no-go-summary.md` includes a **`supportNextStep`** column (concrete command or doc link). Open **`first-pilot-command-center.md`** for the single phased **NEXT ACTION** when proof collection finishes.

| HOLD category | Next action |
| --- | --- |
| Data consistency | Run `./scripts/collect-data-consistency-readiness.ps1` — [`DATA_CONSISTENCY_READINESS.md`](DATA_CONSISTENCY_READINESS.md) |
| ROI / sponsor basis | Capture baselines — [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md#minimum-viable-roi-baseline-before-sponsor-readout) |
| AI / PilotStrict | Resolve quality gate — [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md) |
| Production-like config | `archlucid config lint --profile production-like-hosted-pilot` |
| Procurement | `python scripts/build_procurement_pack.py --strict --deal-ready` |

| ID | Symptom | Likely cause | Collect | Command / route |
| --- | --- | --- | --- | --- |
| FP-T001 | Auth failure / 401 loop | Wrong `ArchLucidAuth:Mode`, missing API key/JWT | Correlation id from failed request | `archlucid auth diagnostics` · `/auth/signin` |
| FP-T002 | SQL / migration failure | Connection string, DbUp error | API startup log excerpt | `/health/ready` · [`SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md) |
| FP-T003 | Health not ready | SQL down, worker not running | `/health/diagnostics` JSON | `archlucid doctor` |
| FP-T004 | No LLM output | Simulator vs Real misconfig | `AgentExecution:Mode`, Azure OpenAI keys | [`AGENT_QUALITY_STRICT_MODE_PILOT.md`](AGENT_QUALITY_STRICT_MODE_PILOT.md) |
| FP-T005 | Quality gate warning/reject | PilotStrict floor | Agent trace + grounding panel | Review detail → retrieval grounding |
| FP-T006 | Missing artifact | Commit not completed | Run id, manifest id | `GET /v1/architecture/run/{runId}` |
| FP-T007 | Stale run list | Cache / wrong scope headers | Tenant/workspace/project headers | Operator scope triplet |
| FP-T008 | Azure extractor upload failure | ZIP schema / auth | Extractor manifest timestamp | [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) |
| FP-T009 | Audit search empty | Wrong scope or no events yet | Scope headers | `GET /v1/audit?take=25` |
| FP-T010 | Quota / budget stop | LLM budget exceeded | Budget metrics | [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) LLM budget keys |
| FP-T011 | OpenAPI contract missing | Host not exposing canonical `GET /openapi/v1.json` | HTTP status and response body | `GET /openapi/v1.json` · [`API_CONTRACTS.md`](../library/API_CONTRACTS.md) |
| FP-T012 | Network unreachable / timeout | Wrong base URL, firewall, port, or API down | CLI preflight output | `archlucid --json pilot preflight --api-base-url <url>` |
| FP-T013 | Telemetry export missing | Hosted handoff has no durable Application Insights, OTLP, or Prometheus path | `observability-export-readiness.md` | `python scripts/report_observability_export_readiness.py --strict-exit-code` |
| FP-T014 | Route/tier/policy/nav drift | Controller registry, matrix appendix, or nav href parity failed | `route-tier-policy-nav-parity.md` | `python scripts/ci/assert_route_tier_policy_nav.py --sync` |
| FP-T015 | Procurement deal-ready failure | Stale, placeholder, or buyer-unsafe procurement artifact | `procurement-deal-ready-check.txt` | `python scripts/build_procurement_pack.py --dry-run --deal-ready` |
| FP-T022 | Production-like config lint failure | Auth bypass, telemetry, LLM redaction, or hosting-advisor blocking findings under production-like profile | `config-lint-production-like-hosted-pilot.md` | `archlucid config lint --profile production-like-hosted-pilot --markdown-out <path>` |
| FP-T023 | Demo workspace / preview HOLD | Demo run anchors, preview essentials, or demo-derived ROI labels failed validation | `demo-workspace-validation.txt` | `./scripts/verify-demo-workspace.ps1 -BaseUrl <url>` |
| FP-T016 | ROI basis labels missing | Sponsor report lacks ROI evidence sections or baseline label | `first-value-report.md`, `pilot-run-deltas.json` | Regenerate first-value report after baseline capture |
| FP-T017 | Pricing quote aging breach | Open quote requests exceeded SLA warn/breach thresholds | `GET /v1/admin/marketing/pricing-quote-aging` | `/admin/pricing-quote-aging` |
| FP-T018 | ROI basis hold | Projected dollar claims rely on defaulted, demo-derived, missing, stale, or not-collected ROI basis without caveat | `first-value-report.md`, `pilot-run-deltas.json`, `go-no-go-summary.json` | Capture buyer baselines or add explicit ROI caveat before sponsor send |
| FP-T019 | Data consistency hold/warn | Readiness or orphan probes failed or were skipped | `data-consistency-summary.json`, `/health/diagnostics` | [`DATA_CONSISTENCY_READINESS.md`](DATA_CONSISTENCY_READINESS.md) |
| FP-T020 | Mutating route idempotency drift | New POST route lacks idempotency posture classification | `mutating-route-idempotency-posture.md` | [`MUTATING_ROUTE_IDEMPOTENCY_POSTURE.md`](../library/MUTATING_ROUTE_IDEMPOTENCY_POSTURE.md) · `python scripts/ci/detect_mutating_route_idempotency_drift.py` |
| FP-T021 | Pilot preflight exit failure | CLI preflight exited non-zero with blocking config/health/OpenAPI rows | `preflight.json`, `preflight-output.txt` | `archlucid --json pilot preflight --api-base-url <url>` |

**Never paste secrets** into tickets. Attach buyer-safe bundles via [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md).
