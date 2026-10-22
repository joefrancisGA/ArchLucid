# AD-02 — In-flight Cancel requires a confirmation dialog

**Do not fork LI-08 or TB-2225 copy.** The shell already polls operations, shows named stages + elapsed time, and explains wait / leave / stop (`cancel-abandon-in-flight-clarity.ts`). This file is the leftover: **Cancel** in `ShellInFlightOperationsAffordance` calls `cancelOperation()` on the first click.

## Goal

Stopping a non-terminal in-flight operation requires `ConfirmationDialog` (or the same AlertDialog primitive) with what stops, what stays intact, and that cancel is cooperative. Confirm then calls `cancelOperation`. Escape / dialog Cancel leaves the pipeline running. Do not toast-only. Reuse `MutationReversibilityNotice` if a reversibility id already exists; do not invent a fake undo-after-cancel if the API cannot restart the same operation.

## Why

Livelihoods can depend on a multi-minute review pipeline. Casual dashboards treat Cancel like closing a toast. A professional desk treats stop as a destructive action: one mis-click in the header popover must not kill analysis.

## Context

- `archlucid-ui/src/components/shell/ShellInFlightOperationsAffordance.tsx` — `handleCancel`
- `archlucid-ui/src/components/shell/ShellInFlightOperationsAffordance.test.tsx` — currently expects immediate `cancelOperation`
- `archlucid-ui/src/components/ConfirmationDialog.tsx`
- `archlucid-ui/src/lib/operations/cancel-abandon-in-flight-clarity.ts`
- `archlucid-ui/src/components/shell/ShellInFlightCancelAbandonClarity.tsx` — informational; not a confirm gate

## What to build

1. Clicking **Cancel** opens a confirm dialog naming the operation title. Confirm runs the existing `handleCancel` path. Dismiss does not call the API.
2. While the dialog is open, do not start a second cancel. Keep the existing `cancellingIds` / `CancelRequested` disable logic after confirm.
3. Failure still uses inline or existing `showError` for **system** failure (TB-2005); the confirm itself is not a toast.
4. Vitest: first Cancel click does not call `cancelOperation`; confirming does; dismissing does not. Existing CancelRequested disable still holds.

## Acceptance criteria

- A Working architect cannot stop an in-flight review with a single click.
- Leave / Open still navigate without cancelling.
- No fake percent complete. No new progress endpoint.

## Constraints

- Do not change cooperative cancel semantics on the API.
- Do not add a second in-flight store.
- Do not collapse review tabs.
- Destructive `Button` variant only on the dialog confirm if the design-system matrix allows; keep the popover trigger outline until confirmed.
