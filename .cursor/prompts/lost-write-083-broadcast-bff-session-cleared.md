# LW-083 — BroadcastChannel (or storage) when BFF session is cleared

**Wave:** lost-write (**LW**). **Cluster:** cross-tab. **Depends on:** LW-007.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When `clearOidcSession` / DELETE bff-session runs, notify sibling tabs. Reuse `BroadcastChannel("archlucid.session.idle")` **or** a dedicated `archlucid.session.auth` channel — do not invent a third if one can carry an `auth-cleared` message type.

## Why

Idle activity already syncs. Auth clear does not. Sibling tabs keep mutating until the next 401.

## Context

- `archlucid-ui/src/lib/auth/session-idle-timeout.ts`
- clearOidcSession / bff-session-sync.ts

## What to build

1. On clear, postMessage auth-cleared.
2. Do **not** put access tokens in BroadcastChannel (BFF HttpOnly stays).
3. Vitest with mocked BroadcastChannel.

## Acceptance criteria

- No tokens on the channel. Only a signal.

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

