# FD-06 — Guided intake no longer tells users to Edit draft anyway

**Do not fork RS-04** for spawn lock, localStorage ack removal, or clone-from-snapshot (WA-10). The gate already returns `false` for `isArchitectureDraftHandoffAcknowledged` and clears legacy acks. This file is leftover **copy**: `guided-intake-copy.ts` still says choose “Edit draft anyway” above.

## Goal

No buyer-visible string tells the operator to unlock a spawned draft via “Edit draft anyway.” Primary path remains the linked review. Secondary remains **Start a new draft from this snapshot** (new id). Deprecated constants may stay for telemetry labels only if they are not rendered.

## Why

RS-04 closed the anyway path. Copy that still names it trains the architect to look for a divergence switch that no longer exists — or, if a stale bundle still shows a button, it is a career bug. Livelihood data loss is editing the wrong copy.

## Context

- `archlucid-ui/src/lib/guided-intake-copy.ts` — sentence containing `Edit draft anyway`
- `archlucid-ui/src/lib/architecture/architecture-draft-handoff-gate.ts` — `@deprecated` acknowledge helpers
- `ArchitectureDraftHandoffBanner.tsx`
- `ARCHITECTURE_DRAFT_CLONE_SNAPSHOT_LABEL`
- Grep `Edit draft anyway` under `archlucid-ui/`

## What to build

1. Grep and rewrite every rendered string that names the anyway path. Point at Continue in review + clone-from-snapshot.
2. Vitest: no rendered Guided/Working fixture contains `Edit draft anyway`. Deprecated constants, if kept, are not imported by UI copy modules.
3. Do not re-enable localStorage ack.

## Acceptance criteria

- Spawned-draft UI cannot screenshot “Edit draft anyway.”
- Clone-from-snapshot still creates a **new** architecture id.
- Saving a draft still never starts a review.

## Constraints

- Do not weaken sealed-manifest immutability.
- Do not resurrect the anyway path.
- Do not collapse review tabs.
