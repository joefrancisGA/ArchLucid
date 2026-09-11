# LW-099 — Vitest: LW-00 index + LW-001–LW-100 files exist

**Wave:** lost-write (**LW**). **Cluster:** close. **Depends on:** prompt-set PR may already include this test — confirm.

Do not implement from the wave index. Implement only *What to build*.

## Goal

If `archlucid-ui/src/lib/lost-write-prompt-inventory.test.ts` already landed with the prompt-set PR, confirm it still asserts 100 numbered files and the index. Do not duplicate. If missing, add it (same pattern as `architecture-spine-prompt-inventory.test.ts`).

## Why

Without a file ratchet, the next agent will paste from the index tables instead of the numbered files.

## Context

- `archlucid-ui/src/lib/architecture-spine-prompt-inventory.test.ts`
- `.cursor/prompts/lost-write-00-index.md`

## What to build

1. Expect `lost-write-00-index.md` and 100 files matching `lost-write-\d{3}-`.
2. Run `npm run test -- --run src/lib/lost-write-prompt-inventory.test.ts` from archlucid-ui.

## Acceptance criteria

- Test is the only acceptance for this prompt unless the file was already in the set PR.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** re-run AS / FP / LP / WS / LK / V12-01 bodies except as a named leftover. Implement only *What to build*.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).

