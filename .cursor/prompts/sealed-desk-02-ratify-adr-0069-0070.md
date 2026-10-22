# SD-02 — Ratify ADR 0069 and ADR 0070

**Do not fork IS-01 or IS-04** (those wrote the ADRs). **Do not rewrite ADR 0067 or 0068.** This file is **status honesty**: both ADRs are still **Proposed** while Working one-object chrome and the density gate exist in tree.

## Goal

When the matching implementation is on the branch (or already on `master`), set **Status: Accepted** on ADR 0069 and ADR 0070, add a short implementation-evidence list (paths + tests), and leave the Decision / Trade-offs / Constraints / Expected impact bodies unchanged except for a one-line “Implemented” pointer. If a bet is not actually landed, leave it Proposed and list the blocking IS file — do not rubber-stamp.

## Why

Livelihoods depend on the sealed record matching a published contract. A Proposed ADR after the gate moved is the same class of lie as stale density docs: reviewers and future agents will treat density as advisory because the ADR still says the change has not been decided.

## Context

- `docs/architecture/adrs/0069-working-desk-one-work-object.md`
- `docs/architecture/adrs/0070-insight-density-controls-typed-engines.md`
- `docs/architecture/adrs/template.md` — do not strip Trade-offs / Constraints / Expected impact
- Evidence for 0070: `DeterministicInsightDensityGate.cs` `typed-engine-scored`; Core gate tests
- Evidence for 0069: `resolveWorkingStartHref` / `working-start-route.ts`; Working Home single primary tests
- `INSIGHT_DENSITY_MISS_CLAUSE.md` — already cites 0070; do not duplicate SD-01’s library sweep

## What to build

1. Verify 0070 behavior in code (no early Promote solely for `!IsAgentArchitectureFinding`). If missing, stop and say IS-05 is the owner — do not re-implement the gate here.
2. Verify 0069 Working chrome (one primary on Working Home; Guided keeps two doors). If missing, stop and name IS-02 — do not re-implement Home.
3. For each ADR that is actually landed: Status → Accepted; add “Implementation” bullets with file paths; date the acceptance (2026-09-05 or the merge date you have).
4. Do not expand Decision scope. Do not merge kernels. Do not collapse tabs.

## Acceptance criteria

- An Accepted ADR 0070 exists only if the gate tests assert typed-engine demotion.
- An Accepted ADR 0069 exists only if Working Home tests forbid two peer filled start CTAs.
- ADR 0067 body is untouched. Guided two-door tests still pass.
- Template headings Trade-offs / Constraints / Expected impact remain.

## Constraints

- Do not implement GTM **M-90**.
- Do not reopen TB-135 / TB-136.
- Do not rewrite miss-clause forbid-list into “never demote typed engines.”
