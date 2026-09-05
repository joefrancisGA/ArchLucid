# WA-11 — Record correction remains the path after the undo window

**Do not fork LD-05 or LI-05** for mounting Record correction on registry writes. This file is the leftover **after 300s**: livelihood mutations must not look one-way. The desk still offers Record correction (or the existing amend API) with TB-2155 copy — not “too late, live with it.”

## Goal

When `MUTATION_UNDO_WINDOW_SECONDS` (300) has elapsed, Working UI for finding disposition / approve / reject / promote / archive replaces Undo with **Record correction** (existing `POST /v1/governance/mutation-corrections`) where that API already applies. Do not extend the undo window. Do not use `window.confirm` as the only amend.

## Why

Casual tools are confirm-then-forever. Livelihoods need an audit-grade correction after the short undo. The API exists; chrome still disappears when the timer hits zero and leaves a dead end.

## Context

- `archlucid-ui/src/lib/mutation-reversibility-registry.ts` — keep 300s
- Record correction API + any existing `RecordCorrection` UI from LI-05/LD-05
- Finding inspect / governance queue disposition controls
- Audit trail — correction must remain visible as a correction, not a silent rewrite

## What to build

1. Inventory registry mutations that show Undo then nothing. After expiry, show Record correction when the endpoint supports that write; otherwise a disabled reason (“This write is sealed — open a new review”) — never a blank toolbar.
2. Do not silently re-enable Undo after 300s.
3. Vitest: fake timers past 300s; disposition toolbar still has a correction affordance or an honest sealed reason.

## Acceptance criteria

- Working user who disposed a finding 10 minutes ago can still start Record correction from that finding.
- Sealed-manifest fields that must not mutate stay fail-closed with a reason.
- Guided same amend rules (career defense is not density).

## Constraints

- Do not lengthen undo to “forever.”
- Do not weaken sealed immutability.
- Do not collapse review tabs.
