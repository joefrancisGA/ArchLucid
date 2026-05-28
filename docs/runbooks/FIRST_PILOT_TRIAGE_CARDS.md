> **Scope:** First-pilot symptom triage cards linked from go/no-go proof collection and sponsor evidence quality gates.

# First-pilot symptom → evidence triage cards

**Last reviewed:** 2026-05-28 · Full spine: [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md)

`scripts/collect-first-pilot-proof.ps1` writes these IDs into `go-no-go-summary.md` when a preflight, evidence collection, or sponsor-evidence quality gate step can be mapped to a known failure mode. For committed reviews, unresolved or failed PilotStrict sponsor evidence is a `BLOCK`; simulator-only/demo evidence remains allowed only when it is visibly labeled.

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
| FP-T016 | ROI basis labels missing | Sponsor report lacks ROI evidence sections or baseline label | `first-value-report.md`, `pilot-run-deltas.json` | Regenerate first-value report after baseline capture |
| FP-T017 | Pricing quote aging breach | Open quote requests exceeded SLA warn/breach thresholds | `GET /v1/admin/marketing/pricing-quote-aging` | `/admin/pricing-quote-aging` |

**Never paste secrets** into tickets. Attach buyer-safe bundles via [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md).
