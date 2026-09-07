> **Scope:** ADR 0078 — Career artifact honesty contract (false-confidence FC wave).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0078: Career artifact honesty contract

- **Status:** Proposed
- **Date:** 2026-09-07

## Context

Career artifacts — finalize stamp, sponsor PDF, print, ADR export, decision receipt JSON, audit CSV, CLI/API export bundles — are what architects email to ARBs, sponsors, and auditors. When an artifact looks more certain than the governed review allows, livelihood defense fails even if the Working desk showed caveats in a collapsible panel.

Honesty rules today are scattered across ADR 0050 (trail shape), ADR 0063 (trust labels), ADR 0070 (classification demotion), ADR 0073 (trail finalize/export gate), DR-01 (measurement floor fail-closed), DR-05 (quality gate), and a dozen FC/WA/CD/LK prompts. Reviewers cannot answer one question in PR review: **does this export violate the career contract?**

This ADR **supersedes execution gaps only** — it does not rewrite Accepted ADR bodies. ADR 0073 remains authoritative for trail null vs empty-array finalize semantics; 0078 binds **all career surfaces** to one fail-closed contract and names shared validators (FC-02 TypeScript, FC-03 C#).

**Related:** ADR 0050, 0063, 0070, 0073, `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`, `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`.

## Decision

1. **Transparency trail (R4):** On **finalize**, `IntakeTransparencyTrail` must not be null (ADR 0073). On **career exports**, `asserted`, `inferred`, and `skipped` must each be a **complete array**; null trail or a missing section **blocks** the artifact with a named missing bucket. Empty arrays inside a valid trail object remain legal on finalize; exports still require the three array sections to exist.
2. **Skipped MUST:** When the trail exists, any skipped MUST-tier intake question **blocks finalize** and must appear in export honesty headers (AuthorityCommitSkippedMustGate alignment).
3. **Classification honesty (ADR 0070):** Decision-grade vs checklist coverage counts are **separate** on exports. Copy must not imply typed engines were density-demoted when the gate retained them as decision-grade (`typed-engine-protected` telemetry ≠ analytical demotion).
4. **Measurement floor (DR-01):** Working career export requires a **known** measured engine count ≥ harness floor; `enginesSucceeded == null` is **not career-complete** (fail-closed, not fail-open).
5. **Execution mode:** External sponsor artifacts must show Real / Simulator / Mixed posture. HOLD, PilotStrict gaps, and WarnOnly real-mode quality gate block **external** sponsor PDF unless explicit demo/sample waiver copy is shown.
6. **Trust labels (ADR 0063):** Wire `trustLabel` / `trustLabelReason` on exports; heuristic findings cannot present as evidence-backed without the label.
7. **Feasibility (R5):** Hard infeasible requires citation; soft infeasible shows envelope — never "failed review" alone.
8. **Demo / sample:** Career artifacts from demo, static, or sample data carry **demo/sample** labeling and cannot be emailed as production proof without explicit waiver copy.
9. **Shared validators:** Every career export and finalize path calls **`evaluateCareerArtifactHonesty()`** (UI) or **`CareerArtifactCompletenessValidator`** (server) before rendering; CI inventories (FC-04–08) enforce the call graph.
10. **Legacy sealed records (ADR 0039):** Re-export of bytes sealed without trail shows an **honesty banner** (warning); bytes are not rewritten.

## Trade-offs

**Gains:** One contract for PR review and ARB defense; sponsor PDF cannot be cleaner than the desk; curl/CLI exports fail-closed with named block reasons; TS/C# parity tests prevent drift.

**Sacrifices:** More finalize and export friction under time pressure; legacy requests need trail hydration; every new export surface must register in the career-export inventory or cite an ADR 0078 §Constraint exemption; reviewers must learn 0078 in addition to 0073 for export-specific array rules.

**Rejected:** Client-only gates (insufficient for API/CLI); rewriting ADR 0050/0073 bodies; backfilling fake trail rows; making trail optional on "happy path" finalize; unsealing records to add honesty headers.

## Constraints

- Do **not** change the `DeterministicInsightDensityGate` demotion predicate (ADR 0070 / IS-05).
- Do **not** rewrite sealed bytes (ADR 0039) — honesty on re-export only.
- Do **not** add a 40th coverage engine (`HOLD_NO_COVERAGE_ENGINES.md`).
- Do **not** collapse desktop review workspace tabs into a **More** menu.
- One validator class per file on the C# side; one module entry point on the TypeScript side.
- No GTM cohort scope (TB-135/TB-136 remain owner-tracked only).
- Terraform for any new infra — this ADR should not require net-new infrastructure.

## Expected impact

**System:** ADR 0078 cited in PR review for finalize/export changes; FC-02/03 validators become the only supported entry points; `SponsorFirstValuePdfGate` and finalize orchestrator delegate to C# validator; stamp band and sponsor banner delegate to TS module.

**Security:** Fail-closed career artifacts reduce false-confidence exports; no new data exposure; block reasons are user-safe sentences suitable for ProblemDetails.

**Operations:** Vitest + Decisioning/Application parity tests for shared fixtures; scoped compile on touched projects; grandfather list ratchet (FC-07) for legacy export paths.

**Cost:** Engineering time to migrate ~80 FC surfaces; negligible runtime (validator is synchronous over in-memory inputs).

**Teams:** Reviewers quote 0078 in export PRs; support can map block reasons to desk strips without reading scattered ADRs.

## Consequences

- **Positive:** Architects can email sponsor PDF + stamp screenshot without hidden inference; one honesty vocabulary (TB-645) across surfaces.
- **Negative:** Incomplete legacy packages block until trail/measurement backfill; parallel FC prompts must not fork validators.
- **Follow-ups:** FC-04–08 CI inventories; FC-09+ per-surface hardening; parity test corpus FC-80; OpenAPI `blockReason` fields (FC-08).
