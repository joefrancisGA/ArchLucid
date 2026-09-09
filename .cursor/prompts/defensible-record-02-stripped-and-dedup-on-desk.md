# DR-02 — Stripped LLM findings and merge-dedup conflicts are desk items

**Do not fork PC-08** wait chrome. **Do not fork** emission-gate internals except to **surface** what they already drop. **Do not** put stripped prose back onto Decision-grade.

## Goal

When the emission gate strips prose-only agent findings, or the snapshot merger keeps one engine finding and drops a conflicting payload, Working review-detail shows those events as a **first-class band** (Needs attention / withheld), not only `engineFailures` JSON or traces.

Each withheld row: origin engine or agent, reason (prose-only / empty EvidenceRefs / merge conflict), and a deep link to the trace or conflict record. Count the band in the stamp honesty strip (consume PC-01 helper; do not fork).

## Why

Silent removal is how an architect signs a package that is thinner than the run they watched. Livelihood-critical review requires seeing what the kernel refused to persist.

## Context

- `AgentArchitectureFindingEmissionGate.cs` / `AgentArchitectureFindingEmissionEnricher.cs` (TB-2222)
- `FindingSnapshotConfluentMerger.cs` / `FindingsMergeAndGateStage.cs`
- `DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md`
- Review findings workspace bands (IS-07 / PC-11)

## What to build

1. Persist withheld/conflict summaries on the run snapshot (or reuse existing failure rows) with a stable id.
2. Working findings tab: withheld band above or beside checklist; keyboard Alt+J/K can reach it.
3. Vitest + Decisioning tests: strip one prose-only finding → band count 1; merge conflict → one withheld + one kept.
4. Guided may collapse the band behind a disclosure; Working shows it by default when count > 0.

## Acceptance criteria

- A skeptical architect can answer “what did we drop?” from the desk without opening diagnostics.
- Stripped items never re-enter Decision-grade.

## Constraints

- Do not unseal. Do not invent finding-comment chat. Tenant isolation ADR 0037.
