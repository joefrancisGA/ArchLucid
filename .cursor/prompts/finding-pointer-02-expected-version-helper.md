# FP-02 — Shared helper to resolve the expected current-pointer token

Do not wire inspect/bulk call sites (FP-03–11 and FP-17 do). Do not change the API contract.

## Goal

Add `archlucid-ui/src/lib/findings/finding-expected-current-disposition-row-version.ts`:

```ts
resolveExpectedCurrentDispositionRowVersion(input: {
  inspectPayloadRowVersionBase64?: string | null;
  latestHistoryEvent?: { currentDispositionRowVersionBase64?: string | null } | null;
  conflict?: { currentDispositionRowVersionBase64?: string | null } | null;
}): string | undefined
```

Precedence: **conflict winner** (if present) → **latest history event** → **inspect payload seed**. Trim; empty string → `undefined`. `undefined` means “no pointer yet” (first disposition).

Vitest the three precedence cases plus empty/whitespace.

## Why

Inspect, keyboard, restore, and bulk must not each invent extraction. Keyboard already reads `history[0]?.currentDispositionRowVersionBase64`.

## Context

- `FindingDispositionEvent.currentDispositionRowVersionBase64` (`governance-stickiness-disposition-types.ts`)
- `FindingInspectResponse.latestDispositionRowVersionBase64`
- `FindingDispositionConflictDetail.currentDispositionRowVersionBase64` (`finding-disposition-conflict.ts`)
- Keyboard: `FindingKeyboardTriageHost.tsx` ~L160–164

## What to build

1. Helper + Vitest.
2. Optionally switch keyboard apply to call the helper **without** changing when it sends the token (still sends when history has a version). If that diff is noisy, leave keyboard for FP-10.

## Acceptance criteria

- Helper is the single UI resolver. No second copy of precedence rules.
- `undefined` on empty history and empty inspect payload (first write).

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0076 body except Related pointers. Do **not** add a new ADR. FP-22 may correct the stale PA table in `docs/library/FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`.
- **Do not** implement LP-19 (401 resume / idempotency replay) or LP-20. This wave only attaches the CAS token and 409 recovery.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No G-REAL-06.
- **Do not** re-run WS-01–24, SY, FC, DR, DX, PC, LK, LP except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- Prefer **no schema change** — `RowVersionStamp` already exists on `dbo.FindingCurrentDispositions`. SQL stays in the single DDL file per database plus a numbered migration only if a schema change is unavoidable.
