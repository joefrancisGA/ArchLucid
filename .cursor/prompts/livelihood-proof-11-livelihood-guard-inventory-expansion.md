# LP-11 — Expand livelihood document-guard inventory (shrink-only deferred)

Do not fork draft workspace primitives. Empty `LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES` is not proof of coverage.

## Goal

Audit dirty operator editors (compare notes, governance exception comments, policy-pack remaining forms, finding mute reason, remaining admin editors). Each either:

1. Wires `useLivelihoodDocumentGuards` + idle snapshot (WS-18), or
2. Lands on `LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES` with a one-line reason.

Add a shrink-only Vitest: deferred list cannot grow without a documented exception comment; new dirty forms in operator architecture/review paths cannot omit both inventory arrays.

## Why

All-day work is not only the architecture draft. Navigation away still loses livelihood writes on unguarded forms.

## Context

- `archlucid-ui/src/lib/livelihood-document-guard-inventory.ts`
- `use-livelihood-document-guards.tsx`
- RS-07 / WS-18 owners — leftovers only

## What to build

1. Grep dirty `useState` save forms vs inventory; mount guards on the highest-traffic gaps (findings mute, remaining disposition notes if not already covered, compare input that is not URL-only).
2. Populate deferred list honestly if a surface is out of this prompt’s size.
3. Vitest inventory guard similar to production-desk eval grandfather.

## Acceptance criteria

- Architecture/review dirty editors are guarded or explicitly deferred.
- Deferred array is not silently empty while known dirty forms exist.

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
