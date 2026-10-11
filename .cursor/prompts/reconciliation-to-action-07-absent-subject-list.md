# RTA-06 — List a decision whose subject is gone

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement RTA-07 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Reconciliation to action (**RTA**). **Depends on:** RTA-05. That fingerprint is not on `master`.

## Goal

When a saved documentation decision belongs to this drawing but its box, resource, or connector is absent from the current result, the page lists it as **No longer in this capture**.

## Why

RTA-04 classifies a decision only after the page asks for a subject that is still in the result. A removed node is never requested, so its decision disappears from the screen even though the row remains stored. RTA-05 supplies the drawing fingerprint that makes it safe to list the rest.

## Read first

- The RTA-05 fingerprint on the comparison and decision
- `InfrastructureDiagramComparisonsController`
- `DiagramReconcileWorkbenchClient.tsx`
- `docs/library/INFRA_EVIDENCE_PLANE.md` section 8

## What to build

1. Branch `cursor/rta-06-absent-subject-list` from the RTA-05 tip (`cursor/rta-05-diagram-fingerprint` once that branch exists). Do not branch from `master`.
2. Add a read that lists documentation decisions for the current comparison’s fingerprint and tenant. Keep the existing single-subject `GET /v1/infrastructure/diagram-comparisons/{comparisonId}/documentation-decisions` as it is: `subjectKind` and `subjectKey` stay required. Add a sibling for the absent list, suggested `GET /v1/infrastructure/diagram-comparisons/{comparisonId}/documentation-decisions/absent`. Return subject kind, subject key, decision, snapshot id, and carry-forward state. Do not return another tenant’s rows.
3. A subject that is absent from the current rows and edge gaps is **No longer in this capture**. A subject that is present keeps the RTA-04 state from the existing single-subject read.
4. Under the correspondence table, show those absent decisions in sentence case. Name the subject key and the saved decision. Do not delete the stored row.
5. The scorecard does not gain or lose a Matched count because a decision is listed here. Operational finding status does not change.
6. Tests: a diagram-only decision whose node is absent is returned in the list; a decision with another fingerprint is not; a present subject is not duplicated in the absent list.

## Acceptance criteria

- Removing a previously decided box leaves a visible line that says no longer in this capture.
- A decision from another drawing is not in that list.
- The stored decision and any operational finding remain.

## Constraints

- Before editing any tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not add the sealed-path control. That is RTA-07.
- Do not auto-close a finding or call Azure.
- Working-tree safety. Stage only the list, its tests, and the workbench section. **No `git add -A`.**
- **Do not commit.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

From `archlucid-ui`, run the `DiagramReconcileWorkbenchClient` Vitest file and the scorecard Vitest file. Add the new API test to the diagram-infrastructure filter. One `scripts/ci/agent-compile-check.ps1` on the API project you touch, plus one retry if it exits 1. Heartbeat every 8s.

## How to check

Restart the API and the UI. Hard-refresh **Diagram reconciliation**.

1. Compare a drawing that contains Member Portal — Prod. Save **Update the drawing**.
2. Compare the same drawing with that box removed.
3. A line under the table names that decision and says no longer in this capture.
4. Compare an unrelated drawing. That line is absent.

Wait for that look before any commit.
