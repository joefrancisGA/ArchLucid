> **Scope:** Buyer-facing — why ArchLucid vs generic architecture review / diagram / copilot tools, with evidence anchors (Improvement #9).

# Differentiator evidence matrix

Use this matrix in sales conversations and sponsor briefings. Each row ties a buyer heuristic to **authoritative repo artifacts** — not marketing adjectives alone.

| Buyer question | ArchLucid differentiator | Evidence anchor | What we do **not** claim |
| --- | --- | --- | --- |
| "Is this just another diagram + LLM chat?" | **Committed review package** with golden manifest, findings engines, and durable audit trail | `GET /v1/runs/{runId}/manifest`, `docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md`, `docs/library/AUDIT_COVERAGE_MATRIX.md` | Autonomous production remediation or unsupervised agent autonomy |
| "Can we prove governance before deploy?" | **Governance disposition + recurrence** wired to runs and audit | `GovernanceStickinessController`, `docs/library/V1_SCOPE.md` §4, pilot proof packet `governance-outcome-summary.json` | SOC 2 CPA report or third-party pen-test publication (V1.1 backlog) |
| "Will procurement catch over-claims?" | **Claim gates + honest trust center** | `scripts/ci/check_buyer_claim_drift.py`, `docs/library/trust-center.md`, `docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md` | Zero buyer friction on strict enterprise legal review |
| "How is AI bounded?" | **Deterministic + PilotStrict paths** with quality gates and budget enforcement | `docs/runbooks/LLM_COST_ESTIMATION.md`, `docs/library/AGENT_OUTPUT_EVALUATION.md`, operator LLM budget shell UX | Frontier-model showcase or unconstrained tool use |
| "Can executives see ROI without reading logs?" | **First-value report + sponsor packet** from committed runs | `archlucid pilot proof-packet <runId>`, `sponsor-proof-packet-index.md`, `docs/go-to-market/PILOT_BUYER_SAFE_EVIDENCE_TEMPLATE.md` | Guaranteed dollar ROI without customer baseline inputs |
| "Does UI match backend truth?" | **Live UI ↔ SQL parity** release profile | `scripts/release-smoke-rc.ps1`, CI `ui-e2e-live`, `docs/library/RELEASE_SMOKE.md#release-smoke-ui-sql-parity` | Mock Playwright alone proves SQL-backed UI |
| "Why not status-quo architecture review?" | **Explainability trace + typed findings** across security, cost, compliance pillars | `docs/library/EXPLAINABILITY_TRACE_COVERAGE.md`, ten finding engines in `docs/go-to-market/POSITIONING.md` | Replacement for human architecture judgment |

## How to use in a deal cycle

1. Pick **two rows** that match the buyer's stated pain (governance vs AI risk vs ROI proof).
2. Attach the cited artifact from a **committed pilot run** (`pilot proof-packet`) or staging evidence bundle.
3. Pair with **`limitations.md`** from the proof packet so sponsors see honest non-claims.

## Related

- Positioning spine: [`POSITIONING.md`](POSITIONING.md)
- Procurement objections: [`PROCUREMENT_OBJECTION_PLAYBOOK.md`](PROCUREMENT_OBJECTION_PLAYBOOK.md)
- Service-led offers: [`SERVICE_LED_OFFERS.md`](SERVICE_LED_OFFERS.md)
