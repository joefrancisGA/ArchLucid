# RS-11 — Concurrent edit is a desk event, not last-write-wins silence

**Unique — no PT/WD/LI fork.** Draft 409 conflict UI already exists. Finding merge-conflict resolve already exists. This file is the leftover: **two architects (or two tabs) on the same review/draft can still silently clobber work**.

## Goal

When a second writer loses an optimistic concurrency check on a livelihood document (architecture draft, finding disposition, alert rule, digest schedule), the desk shows **what failed / what’s intact / next step** (TB-2155) and a refresh-to-server control. Do not toast-only. Do not pretend the local form won. Presence avatars are **out of scope**.

## Why

Livelihoods depend on the record that survives. Draft workspace already has `architecture-draft-conflict` + refresh. Other mutations may last-write-wins or fail with a generic error. A professional tool treats 409 as a first-class desk state. Do not build a collaborative cursor product; build **honest conflict**.

## Context

- `archlucid-ui/src/components/architecture/ArchitectureDraftWorkspaceIntakeStack.tsx` — `architecture-draft-conflict` (exemplar)
- `archlucid-ui/src/components/findings/FindingMergeConflictResolvePanel.tsx`
- `ArchLucid.Persistence/Repositories/RunConcurrencyConflictException.cs`
- `OperatorErrorRecoveryContract` / `OperatorMutationInlineError`
- TB-2155 error recovery contract

## What to build

1. Grep operator mutation error handling for 409 / concurrency / `RunConcurrencyConflictException` equivalents on draft save, finding disposition, alert rules, digest schedule.
2. Map those to the draft-conflict pattern: inline recovery, refresh from server, do not keep a lying “saved” state.
3. Finding merge conflicts: if the panel only mounts on an inspect deep-link, surface a Working findings-list cue when the queue API already returns conflict — do not hide it in inspect-only.
4. Vitest: 409 on draft still shows conflict (do not regress); at least one additional mutation path (disposition or alert rule) renders recovery contract copy, not toast-only. Scoped compile if C# error contracts change.

## Acceptance criteria

- A lost write is visible on the form the architect is looking at.
- Refresh reloads server truth; local dirty state does not report saved.
- No presence product. No new collaboration backend.
- Tenant isolation unchanged.

## Constraints

- Do not use `window.confirm` as the conflict UI.
- Do not collapse review tabs.
- Do not weaken sealed-manifest immutability (conflict on sealed writes should fail closed).
- One class per file; SQL DDL in the single database file if a column is required (prefer existing rowversion).
