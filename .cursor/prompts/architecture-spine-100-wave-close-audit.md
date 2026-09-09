# AS-100 — Wave close audit — architecture spine is decide-input, not inspect-only

**Wave:** architecture-spine (**AS**). **Cluster:** close. **Depends on:** AS-001–AS-099 as landed; evidence-only.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Write `docs/architecture/ARCHITECTURE_SPINE_ACCEPTANCE_2026-09-09.md`. Table per prompt: shipped?, evidence, residual. Mark shipped only if: (1) ADR 0084 exists; (2) PNG not silently dropped; (3) at least one structured parser (mermaid or vsdx) compiles into the review graph; (4) pixel-only is NotVerifiable; (5) support band enum + Working chip + mismatch test; (6) Career/Rehearsal chooser and Simulator cannot unlabeled-Ready; (7) RestrictToShares opt-in + IDOR; (8) no host Mode flip; (9) no second collector. Residuals **out of wave**: work-lease/concurrent desk without presence (wave 23); intake wizard dirty-guard leftover if still deferred; stop-analysis confirm; bulk list DTO row versions; 300s undo length; G-REAL-06; IE collector implementation; vision default-on.

## Why

Without a close audit the next intake PR will drop PNG again and call ESI “good enough.”

## Context

- FINDING_POINTER_CAS_ACCEPTANCE_2026-09-08.md template
- architecture-spine-00-index.md
- docs/architecture/README.md pointer

## What to build

1. Acceptance markdown + README status line update (ready → shipped on this branch).
2. Vitest: AS-00 index + AS-001–AS-100 files exist (this repo already has architecture-spine-prompt-inventory.test.ts — keep it green).
3. Do not claim IE plane shipped or G-REAL-06 done.

## Acceptance criteria

- Owner can paste one file to audit the wave.
- Residuals named, including concurrent-desk wave 23.

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

