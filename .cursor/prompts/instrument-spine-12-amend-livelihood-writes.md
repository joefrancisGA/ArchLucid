# IS-12 — Livelihood writes stay amendable after the five-minute undo

**Do not fork CD-10 or FD-11** for Record correction mounts. Those added append-only correction after 300s. This file changes the **bet**: approve / reject / promote / finding disposition remain **reversible_with_audit** for a working day, not confirm-then-forever. Finalize stays **permanent** (cannot unseal). Do not lengthen silent `MUTATION_UNDO_WINDOW_SECONDS` (keep 300s Undo).

## Goal

After the 300s Undo toast expires, Working still offers **Reverse with audit** (or reuse Record correction that *reverses state* plus rationale) for finding dispositions and governance approve/reject/promote, for at least `FINDING_DISPOSITION_REVISIT_WINDOW_HOURS` (already 24h on findings). Promote/activate pack same window. Finalize remains seal + correction rationale only. Mounted-controls tests that failed on `GovernanceWorkflowMutationHost` (FD assessment leftover) get mutation ids.

## Why

A professional who fat-fingers a disposition at 16:00 must not need a support ticket to face an ARB at 09:00. Five minutes of Undo is a casual SPA. Append-only “I was wrong” without reversing the live state leaves the package lying.

## Context

- `archlucid-ui/src/lib/mutation-reversibility-registry.ts`
- `ReversibleMutationSuccessCallout.tsx`
- `FindingDispositionRecordCorrectionControl.tsx`
- `GovernanceRecordCorrectionDialog.tsx`
- `GovernanceWorkflowMutationHost.tsx` — FD note: missing mutation id strings
- `ArchLucid.Application` governance correction services (FD-11 C# tests)
- `mutation-reversibility-mounted-controls.test.ts`

## What to build

1. Registry: finding disposition + workflow approve/reject stay `reversible_with_audit` with a revisit window (24h unless a smaller existing SLA exists). Finalize stays `permanent` + amendable rationale.
2. Reverse-with-audit must restore prior disposition/approval **and** write the audit event (who, when, why). Do not silent-delete history.
3. Working UI: after Undo expires, the same success region or the row action still shows Reverse / Record correction until the window ends.
4. Guided may keep shorter teaching copy; do not hide reverse on Working.
5. Vitest + C# tests for reverse-after-undo-window. Fix mounted-controls markers for approve/reject.

## Acceptance criteria

- A Working finding accepted by mistake can be returned to open/needs-evidence after 10 minutes with an audit row.
- A sealed record still cannot be unsealed.
- 300s Undo toast still exists for immediate undo.

## Constraints

- Do not implement SoD bypass (self-approval still blocked).
- Do not reopen TB-135/136.
