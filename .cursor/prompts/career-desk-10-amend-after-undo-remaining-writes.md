# CD-10 — Remaining amendable writes keep Record correction after 300s

**Do not fork WA-11** for finding disposition (`FindingDispositionRecordCorrectionControl`). This file is **other registry ids**: `governance_quick_approve`, workflow approve/reject/promote/activate are `reversible_with_audit` + `amendable: true`. Policy-pack publish is `permanent`. Grep for `ReversibleMutationSuccessCallout` / `onRecordCorrection` — mounts may still be findings-only.

## Goal

Every `amendable: true` registry mutation that shows a success callout in Working still offers Record correction after the undo window (or immediately when there is no undo window). `permanent` writes show an honest sealed reason (“cannot unpublish — record a correction / new version”) — never a blank toolbar. Do not lengthen 300s. Do not use `window.confirm` as the only amend.

## Why

All-day users fat-finger approvals and promotions, not only finding dispositions. Confirm-then-forever on governance is a consumer pattern.

## Context

- `archlucid-ui/src/lib/mutation-reversibility-registry.ts`
- `archlucid-ui/src/lib/mutation-reversibility-mounted-controls.ts`
- `POST /v1/governance/mutation-corrections`
- `ReversibleMutationSuccessCallout.tsx`
- Quick-approve / workflow action components
- Policy pack publish UI

## What to build

1. Inventory `MUTATION_REVERSIBILITY_REGISTRY` vs call sites that pass `onRecordCorrection`. Close gaps for amendable ids.
2. Permanent publish: disabled correction with the existing confirmation lead as the reason — do not fake undo.
3. Vitest: fake timers past 300s on an amendable non-finding write still exposes Record correction; publish remains permanent with a reason. Scoped compile if C# changes.

## Acceptance criteria

- Working user who quick-approved ten minutes ago can start Record correction from that surface (or the audit trail link already wired).
- Publish stays immutable with an honest sentence.
- Findings WA-11 control unchanged.

## Constraints

- Do not extend the undo window.
- Do not weaken sealed-manifest immutability.
- Do not collapse review tabs.
