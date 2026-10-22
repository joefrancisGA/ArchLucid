# LW-008 — ADR 0090: work-lease without live presence

**Wave:** lost-write (**LW**). **Cluster:** kernel-adr. **Depends on:** LW-001 (can parallel).

Do not implement from the wave index. Implement only *What to build*.

## Goal

Author `docs/architecture/adrs/0090-architecture-work-lease-without-presence.md` (Status: Proposed). Decision: a Working desk may take a **soft exclusive lease** on a draft (acquire / heartbeat / release / steal-with-confirm). Lease is **not** live occupancy, avatars, or finding-comment chat. CAS (0088) remains mandatory even with a lease. Do not implement SQL in this prompt.

## Why

Architecture-spine named concurrent desk as wave 23 and forbade live presence. Two architects still last-write-wins at replay time. A lease makes collision visible before 409; it does not replace CAS.

## Context

- docs/architecture/ARCHITECTURE_SPINE_COMPOSER_PROMPTS.md (problem 5)
- `archlucid-ui/src/components/CollabRecentActorPresenceStrip.tsx`
- docs/architecture/adrs/0087-architecture-scoped-sharing-restrict-to-shares.md (do not rewrite)

## What to build

1. Write ADR 0090: lease scope (draft, not whole tenant), TTL, steal audit, honesty copy (“not live presence”).
2. README row. Proposed OK.
3. Guard: ADR forbids presence avatars and finding chat; requires CAS still; no SQL RLS.
4. Do **not** add tables yet (LW-089).

## Acceptance criteria

- Collab strip stays history-only. Lease is a separate banner.

Do not reuse ADR 0087–0089 numbers.

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

