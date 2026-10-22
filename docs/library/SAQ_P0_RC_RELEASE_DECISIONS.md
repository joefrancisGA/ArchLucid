> **Scope:** P0 SAQ release-decision appendix for V1 RC. Engineering-owned; not buyer-facing.

# P0 SAQ release decisions (RC appendix)

**Last reviewed:** 2026-06-14  
**RC gate:** Open P0 SAQs require explicit disposition before strict RC signoff ([`SONNET_ARCHITECTURE_DESIGN_QUESTIONS.md`](SONNET_ARCHITECTURE_DESIGN_QUESTIONS.md)).

## Summary table

| SAQ | RC disposition | Evidence required before RC | HOLD threshold | Owner / next action |
| --- | --- | --- | --- | --- |
| **SAQ-007** | **Hold for evidence** (controlled pilot OK) | ≥1 reference real-mode run via `Invoke-RealLlmEvidenceGate.ps1`; sponsor handoff HOLD without real-mode proof | Sponsor packet claims real AI without `realModeEvidenceStatus=PASS` | **Founder** signs Stage 0→1; engineering attaches CI/AOAI evidence |
| **SAQ-008** | **Act now** (thresholds locked) | `simulator-live-divergence-summary.json` in RC bundle | Schema-valid divergence >15% on golden cohort OR >2 consecutive real runs with faithfulness HOLD | Engineering — narrow claims or block RC strict mode |
| **SAQ-010** | **Act now** (selective enforcement) | `architecture-invariant-rc-summary.json` with P0 invariants enforced or explicitly waived | Any P0 invariant convention-only without documented waiver | Engineering — `report_architecture_invariant_enforcement.py` |
| **SAQ-011** | **Act now** (audit complete) | [`CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit`](../go-to-market/CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit) checklist green (`SPONSOR_CLAIM_LABEL_AUDIT.md` alias) | Any sponsor export missing execution mode or evidence-basis labels | Engineering — formatter/UI copy fix |

## SAQ-007 — Minimum real-mode evidence

**Current assumption:** Controlled V1 pilots may proceed with labeled simulator demos. Evidence-backed selling requires real-mode proof density.

**Reference AOAI source (existing secrets — do not create new deployments):**

- `ARCHLUCID_CI_REAL_AOAI_ENDPOINT` / `ARCHLUCID_CI_REAL_AOAI_KEY`
- `ARCHLUCID_CI_REAL_AOAI_DEPLOYMENT` (default `gpt-4o`)
- Local equivalent: `ARCHLUCID_REAL_AOAI_TEST_*`

**Stage gates:**

| Stage | Real-mode requirement |
| --- | --- |
| Controlled pilot RC | Simulator allowed if labeled; ≥1 reference real-mode run recommended |
| Evidence-backed selling (Stage 1) | **≥3** distinct real-mode committed runs; **founder signoff** required |
| Broad GTM (Stage 2) | G1–G6 PASS + owner-deferred public reference |

**Classification:** Design + evidence gap (not market uncertainty).

## SAQ-008 — Simulator/live divergence

**Current assumption:** ADR 0050 feasibility trail applies; divergence is measured, not ignored.

**RC HOLD thresholds (schema-valid outputs only):**

| Signal | WARN | HOLD (strict RC / sponsor handoff) |
| --- | --- | --- |
| Golden cohort schema-valid divergence rate | 5–15% | >15% |
| Consecutive real runs with faithfulness HOLD | 1 run | ≥2 runs |
| Buyer-facing full-real claim with partial agent paths | — | Any path missing in `real-llm-evidence-gate.json` |

**Owner decision on mitigation:** Narrow claims first; retry policy documented in [`AGENT_OUTPUT_EVALUATION.md`](AGENT_OUTPUT_EVALUATION.md). Block release when HOLD thresholds fire in strict RC mode.

**Classification:** Engineering risk with owner claim boundary.

## SAQ-010 — Architecture invariant enforcement

**Current assumption:** P0 invariants must be enforced or explicitly waived before GA; P1 may remain convention-only with documented residual risk.

**RC requirement:**

- Run `python scripts/ci/report_architecture_invariant_enforcement.py` and attach summary to RC bundle.
- P0 items failing enforcement → **HOLD** unless waived in release notes with owner acceptance.

**Classification:** Engineering (not market uncertainty).

## SAQ-011 — Claim-surface consistency

**Current assumption:** No sponsor surface may imply production-grade AI or availability without execution mode + evidence basis labels.

**Audit reference:** [`CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit`](../go-to-market/CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit) (`SPONSOR_CLAIM_LABEL_AUDIT.md` alias)

**RC requirement:** G1 **PASS**; spot-check one committed run after formatter changes.

**Classification:** Claims/doc fix (architecture fix only when DTO fields missing).

## Pending owner questions

| Item | Status | Notes |
| --- | --- | --- |
| Stage 0 → Stage 1 commercial signoff | **Owner: founder** | Technical green ≠ claim advancement |
| CPA SOC 2 / third-party pen test | **Deferred V1.1** | TB-135 / TB-136 — not V1 RC blockers |
| Public reference customer | **Deferred (B)** | Not penalized in (A) headline score |

## Related

- [`V1_RELEASE_CHECKLIST.md`](V1_RELEASE_CHECKLIST.md) § P0 SAQ
- [`CLAIM_READINESS_STATUS.md`](../go-to-market/CLAIM_READINESS_STATUS.md)
- [`V1_RC_DRILL.md`](V1_RC_DRILL.md)
