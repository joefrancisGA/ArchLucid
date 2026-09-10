# LP-05 — Dual finding streams: never synthesize findings from explanation traces

Do not delete the agent stream. Do not make buyer-summary the product of record.

## Goal

`quick-decision-finding-merge-and-sort.ts` must **not** derive finding rows from aggregate explanation traces when `results[].findings` is empty. The findings desk shows:

1. **Sealed / typed snapshot** as the primary band (finalize product of record).
2. **Agent findings** as a named advisory band when present, labeled per WK-10 / WK-19.

Buyer-summary hydration that **omits** agent findings stays legal only if the omitted stream is **named** (“advisory agent findings not in this summary”) — never a silent shorter list that looks complete.

## Why

Trace-synthesized rows are untraceable advice with finding-shaped chrome. Silent omission is the opposite lie: the package looks smaller than the desk.

## Context

- `archlucid-ui/src/lib/quick-decision-finding-merge-and-sort.ts`
- `run-detail-findings-hydration.ts` (TB-283 / TB-930)
- `docs/library/FINDING_STREAM_PRODUCT_OF_RECORD.md`
- `FindingTrustChip` / proof-confidence taxonomy — reuse

## What to build

1. Remove or gate trace-synthesis; Vitest that empty agent findings + non-empty explanation ≠ extra finding cards.
2. Dual-count copy on review findings workspace (sealed vs advisory).
3. Buyer-summary: explicit omission sentence when agent stream exists but is excluded.
4. Do not merge streams into one unsorted “what ArchLucid found” list.

## Acceptance criteria

- No quick-decision row with `derivedFromExplanationTraces === true` on Working.
- Architect can see both counts without treating advisory as sealed.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067–0081 bodies except Related pointers. This wave **adds ADR 0082** and **ADR 0083**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No G-REAL-06.
- **Do not** re-run WS-01–24, SY, FC, DR, DX, PC, LK except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.
