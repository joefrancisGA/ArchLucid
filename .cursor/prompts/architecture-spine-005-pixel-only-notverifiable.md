# AS-005 — Pixel-only attachments are NotVerifiable diagram sources

**Wave:** architecture-spine (**AS**). **Cluster:** diagram-honesty. **Depends on:** AS-004.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When a stored image has no structured extract, surface it as a **NotVerifiable** diagram source on the review (held-check / assumption register pattern — reuse DX-61/DX-66 types if present). Do not invent resources from the pixels (R5).

## Why

Livelihood: the architect must see that the drawing was received but not used as topology fact.

## Context

- DX-61 prose assumption register / DX-66 NotVerifiable asks — consume, do not rewrite engines
- ADR 0050 R5
- Finding stream product of record — do not synthesize explanation-trace findings (LP-05)

## What to build

1. Add a review-level honesty strip or held-check row: “Diagram file stored; topology not extracted.”
2. Tests: pixel-only fixture does not create CanonicalObject nodes from the image.
3. Copy uses TB-645; not “we analyzed your screenshot.”

## Acceptance criteria

- Stamp/export can show the gap.
- No fake graph nodes.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** re-run ESI, IE-01–IE-22, LP, FP, WS, SY, AO, DX-01–DX-68 bodies except as a named leftover. Implement only *What to build*. Consume IE types; do not fork a second Azure collector.
- **Do not** add a 40th coverage engine or a “node type missing from diagram” engine. **Do not** invent live presence avatars or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06. Career vs Rehearsal is product chrome (AS-076+), not a host-config flip.
- **Do not** make vision/OCR extract default-on. Working opt-in only (AS-040).
- Architecture-scoped sharing (AS-086+) is **inside** the tenant. **Do not** replace ADR 0037 catalog isolation. **Do not** add SQL RLS.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).

