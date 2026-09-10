# FC-01 — ADR 0078 Career artifact honesty contract

**Wave:** false-confidence-career (**FC**). **Prefer first** — other FC prompts cite this ADR. **Do not fork** LK-08/09, DR-01, or ADR 0073 bodies; supersede execution gaps only.

## Goal

Author **`docs/architecture/adrs/0078-career-artifact-honesty-contract.md`** (**Status: Proposed**). One ADR that binds every **career artifact** (finalize stamp, sponsor PDF, print, ADR export, decision receipt JSON, audit CSV, CLI/API export bundles) to the same fail-closed rules:

1. **Transparency trail (R4):** `asserted`, `inferred`, and `skipped` must be **complete arrays** on finalize and exports, or the artifact is **blocked** with a named missing bucket (extends ADR 0073 — do not rewrite 0073).
2. **Classification honesty (ADR 0070):** `typed-engine-protected` findings are never labeled as density-demoted; decision-grade vs checklist coverage counts are **separate** on exports.
3. **Measurement floor:** career export requires **known** measured engine count ≥ harness floor (null = **not complete** — DR-01).
4. **Execution mode:** external sponsor artifacts must show Real/Simulator/Mixed and **block** on HOLD / PilotStrict gaps.
5. **Trust labels (ADR 0063):** wire `trustLabel` / `trustLabelReason` travel on exports; heuristic findings cannot present as evidence-backed without label.
6. **Feasibility (R5):** hard infeasible requires citation; soft infeasible shows envelope — never "failed review" alone.
7. **Demo/sample:** career artifacts from demo/static/sample data must carry **demo/sample** labeling and cannot be emailed as production proof without explicit waiver copy.

## Why

Honesty rules today live in ADR 0050, 0070, 0073, DR-01, miss clause, and a dozen FC/WA/CD/LK prompts. Reviewers cannot tell which surface is gated. Livelihood defense needs **one contract** engineers quote in PR review: "Does this export violate 0078?"

## Context

- ADR template: `docs/architecture/adrs/template.md` (Trade-offs, Constraints, Expected impact required)
- ADR 0050, 0063, 0070, 0073 — **Related only; do not rewrite bodies**
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`
- `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`
- Prior waves: LK-08/09, DR-01–05, CD-05–07, CR-12, FD-13

## What to build

1. Write ADR 0078 with Context, numbered Decision, Trade-offs, Constraints, Expected impact, Consequences.
2. Add row to `docs/architecture/adrs/README.md` and `completed_adrs.md` when Accepted (Proposed in this PR is OK).
3. Add `career-artifact-honesty-contract-guard.test.ts` that fails if ADR file missing or status not Proposed/Accepted.
4. Do **not** implement product code in this prompt — only the ADR + doc links + guard.

## Acceptance criteria

- ADR 0078 is pasteable into PR review as the single career-artifact contract.
- Trade-offs name fail-closed friction under time pressure vs career defense.
- Constraints explicitly forbid changing `DeterministicInsightDensityGate` predicate and forbid unsealing.

## Constraints

- Immutability: do not edit Accepted ADR bodies — supersede only.
- No GTM cohort or TB-135/TB-136 scope.
