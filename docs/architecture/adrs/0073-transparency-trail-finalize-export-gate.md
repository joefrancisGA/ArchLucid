> **Scope:** ADR 0073 — Transparency trail is a finalize and export gate (livelihood-kernel LK-08).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0073: Transparency trail is a finalize and export gate

- **Status:** Accepted
- **Date:** 2026-09-05
- **Implemented:** 2026-09-05 (LK-08 / LK-09)

## Context

ADR 0050 (Accepted) defines the **transparency trail** shape (`Asserted[]`, `Inferred[]`, `Skipped[]`) and states it is mandatory on feasibility verdicts. The same ADR noted “pipeline wiring is downstream.” In practice, finalize and career exports could still omit the trail — sponsors screenshot certainty without seeing asserted vs inferred vs skipped.

R4 liability (“if ArchLucid is wrong, the user got it wrong”) is only fair when those sections are visible on the stamp and export artifacts. Honesty copy on a collapsible panel is evaluator polish, not a career gate.

**Related:** ADR 0050 (trail shape — body not rewritten), ADR 0039 (sealed bytes not rewritten), `AuthorityCommitSkippedMustGate` (skipped MUST when trail **exists**), FD-05 (trail display at stamp).

## Decision

1. **Working finalize (API):** return structured block when `IntakeTransparencyTrail` on the architecture request is **null**. Empty trail object with empty `asserted` / `inferred` / `skipped` arrays is **legal**.
2. **Career exports (stamp, print, sponsor PDF/JSON, decision receipt):** refuse to render as a sealed career artifact when the trail is null or any of the three sections is not an array. Historical sealed records without trail: **honesty banner** on re-export, no byte rewrite (ADR 0039).
3. **Client finalize scorecard:** block finalize CTA when trail is incomplete; name the missing bucket in copy (TB-2005).
4. **Not in scope:** raising insight density; adding engines; filtering findings. Hard infeasible citation rules (R5) unchanged.

## Trade-offs

**Gains:** Stamp and exports cannot silently omit intake provenance; architects see blockers before seal; aligns product with ADR 0050 intent.

**Sacrifices:** Runs without persisted intake trail cannot finalize until trail is populated (may require backfill on legacy requests); export code paths must call shared completeness helper; slightly more finalize friction under time pressure.

**Rejected:** Rewriting ADR 0050 in place; backfilling fake trail entries on old seals; making trail optional on “happy path” finalize.

## Constraints

- Do not rewrite ADR 0050 or ADR 0039 bodies.
- Do not change `DeterministicInsightDensityGate` (IS-05).
- `FeasibilityVerdictValidator` R5 hard-infeasible citation rules unchanged.
- One validator class per file on the C# side.

## Expected impact

**System:** `AuthorityCommitTransparencyTrailCompletenessGate` on finalize orchestrator; `transparency-trail-completeness.ts` on UI scorecard and export formatters.

**Security:** Fail-closed on missing provenance reduces false-confidence exports; no new data exposure.

**Operations:** Vitest + Application tests for null trail block and empty-array pass. Scoped compile on touched projects.

**Teams:** Reviewers quote 0073 to refuse sealed exports without trail sections.

## Consequences

- **Positive:** R4 trail earns the stamp; career defense on sponsor PDFs.
- **Negative:** Legacy requests with null `IntakeTransparencyTrail` need trail hydration before first finalize after upgrade.
- **Follow-ups:** Ensure draft-to-request projection always copies `DraftRequestDocument.TransparencyTrail` (existing projector tests).
