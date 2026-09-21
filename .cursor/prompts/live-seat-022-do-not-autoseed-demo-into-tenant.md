# LS-022 — Explicit skip: do not auto-seed demo into tenants

**Wave:** live-seat (**LS**). **Cluster:** out-of-wave. **Depends on:** LS-008.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Customer tenant create / invite-accept does **not** auto-set `IncludeDemoSeed=true`. Sample data stays on Training / explicit sample visit / eval demo builds. Contoso startup seed stays a host demo concern.

## Why

“Live data immediately” is empty-but-yours, not seeded Contoso inside the customer catalog.

## Context

- `IncludeDemoSeed` default false in `CreateWorkspaceForm`
- `DemoSeedStartupHostedService` (host, not customer create)
- TB-507 static demo governance must not seed live non-demo workspaces

## What to build

1. Ratchet: create-workspace request default `includeDemoSeed` false in API model bind + UI form.
2. Invite-accept path has no demo-seed side effect.
3. Skip note in ADR 0102: host demo seed ≠ customer default workspace.
4. No new seed pipeline.

## Acceptance criteria

A new live workspace has no sample architecture reviews unless the user opted into seed or Training’s sample visit (which is a different scope).

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).
- **Do not** rename stored tokens `"career"` / `"rehearsal"`. **Do not** use **Working**, **Production**, **Real**, **Live**, **Standard**, or **Normal** as a Record/Practice door label. **Live tenant workspace** is scope language, not a review-type chip.
- **Do not** merge Training with Practice. **Do not** delete Guided. **Do not** hide **NOT LIVE DATA** honesty on a sample/demo workspace.
- **Do not** rewrite ADR 0086, 0091, 0094, or 0097 bodies. This wave adds first-login scope + training choice; Record/Practice honesty stays.
- Leftover owner: TB-507. **Do not re-implement that file.** Implement only *What to build*.
