# FD-11 — Finalize / seal success still offers Record correction

**Do not fork WA-11** for finding disposition correction. **Do not fork CD-10** for governance_quick_approve / workflow amend mounts. This file is the leftover **stamp**: Finalize success is confirm-then-forever. The sealed record is immutable; the livelihood need is an append-only correction on the audit trail, not unsealing.

## Goal

After a Working Finalize success, the stamp/receipt strip (or success callout) offers **Record correction** that posts to the existing `POST /v1/governance/mutation-corrections` (or the documented seal-correction path if one already exists). It does **not** unseal. It does not lengthen 300s undo. Permanent seal copy stays honest.

## Why

All-day users stamp the wrong package in a meeting. Five-minute finding undo does not cover “the sponsor packet already went out.” Confirm-then-forever on the career write is a consumer pattern. The trail must show the correction.

## Context

- `archlucid-ui/src/lib/mutation-reversibility-registry.ts` — add a seal/finalize id only if the API already supports it; otherwise reuse `amendable` + existing correction DTO with a `targetKind` the server already allows
- `POST /v1/governance/mutation-corrections`
- `RunDetailReviewPackageDecisionReceiptStrip.tsx`
- `GovernanceRecordCorrectionDialog.tsx`
- Sealed-manifest immutability — do not weaken

## What to build

1. Inventory whether finalize/seal is in the mutation registry. If not, add an `amendable: true` / `permanent` hybrid only if the API can record a correction without mutating the sealed bytes. If the API cannot, mount a correction that writes the audit trail + links from the stamp — do not fake undo.
2. Working stamp success: Record correction control visible after success (and after 300s). Guided may keep a shorter hint.
3. Vitest: Working finalize success fixture exposes the control; sealed package bytes unchanged in the test double. Scoped compile if C# changes.

## Acceptance criteria

- Working user who finalized ten minutes ago can start Record correction from the stamp.
- Seal remains immutable; correction is append-only.
- Findings WA-11 control unchanged.

## Constraints

- Do not extend the undo window.
- Do not unseal from the UI.
- Do not collapse review tabs.
