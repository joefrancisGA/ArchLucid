# LW-005 — Inventory browser keys that hold in-flight livelihood work

**Wave:** lost-write (**LW**). **Cluster:** inventory. **Depends on:** LW-001 (can parallel).

Do not implement from the wave index. Implement only *What to build*.

## Goal

Classify `localStorage` / `sessionStorage` keys that hold **in-flight work** (pending mutation, offline queue, idle snapshots, wizard drafts, disposition restore) vs cosmetic prefs. This wave only moves work-loss keys; favorites/recents stay out of wave.

## Why

401 pending mutations are sessionStorage (tab-scoped). Offline queue is localStorage but without CAS. Mixing those facts is how reconnect + re-auth loses or overwrites work.

## Context

- archlucid-ui/src/lib/auth/livelihood-mutation-401-resume.ts (`LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY`)
- `archlucid-ui/src/lib/architecture/architecture-draft-offline-queue.ts`
- `archlucid-ui/src/lib/auth/livelihood-idle-form-snapshot.ts`
- `archlucid-ui/src/lib/wizard-session-persistence.ts`

## What to build

1. Document the key, storage kind, whether it survives tab close, whether it is cross-device, and the owning LW prompt.
2. Do **not** migrate favorites, recents, or nav pins in this wave.
3. Vitest or markdown + test: pending mutation is sessionStorage today; offline queue is localStorage v1 without expectedUpdatedUtc.

## Acceptance criteria

- Inventory does not claim server-side user preferences for these keys.

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

