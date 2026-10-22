<!-- Reconciliation to action — Luna prompts.
     Origin: 2026-10-11. After DIC-01–DIC-05.
     The comparison already creates an operational finding and can open the factory.
     The page forgets the finding after refresh. Do not implement from this index. -->

# Reconciliation to action — Luna prompt set (RTA-01–RTA-07)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/reconciliation-to-action-0N-*.md` file per GPT-5.6 Luna session.

Canonical wave doc: [`docs/architecture/RECONCILIATION_TO_ACTION_LUNA_PROMPTS.md`](../../docs/architecture/RECONCILIATION_TO_ACTION_LUNA_PROMPTS.md).

**Base:** current `master`. DIC-01 through DIC-05 are already merged. This set does not replace the matcher, the scorecard, or the overlay.

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Remember the finding** | Create operational finding stores a row, then the page keeps the finding id in memory. Refresh offers Create again. | The sealed reconciliation reloads finding ids from the existing natural key and shows Finding recorded. | **RTA-01** |
| **Security rows only** | Every correspondence row can create an operational finding, including an exact match and a diagram-only label. | Create operational finding appears only for a security discrepancy or a multi-candidate conflict. | **RTA-02** |
| **Documentation decision** | Diagram-only, inventory-only, and connector-gap rows have no saved operator decision. | The operator can save Update the drawing, Accept as undocumented, or Check the inventory. It is not a security finding. | **RTA-03** |
| **Later capture** | A new compare forgets whether a documentation gap was already decided. | The same subject on a later compare says still open, no longer in this capture, or evidence changed. Findings are not auto-closed. | **RTA-04** |
| **Same drawing** | The latest decision is remembered by subject alone. The same resource can inherit a decision from a different drawing. | History is limited to one parsed drawing. A new document table is not added. | **RTA-05** |
| **Removed subject** | A decision whose box or resource is gone from the current result is not listed. | The page lists that decision as no longer in this capture. | **RTA-06** |
| **Sealed decisions** | Documentation decisions save only on an advisory comparison. | The sealed path can save and reload the same three decisions. | **RTA-07** |

## Run order

**RTA-01** through **RTA-07** are on `master` (#4511, #4525, #4530, #4539, #4549). Do not greenfield. **RTA-HOLD** is not a build step.

Do not run two of these in one session. Each implementation prompt ends **before commit**. The owner checks the page, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 01 | `reconciliation-to-action-01-restore-finding-link.md` | `cursor/rta-01-restore-finding-link` |
| 02 | `reconciliation-to-action-02-security-finding-gate.md` | `cursor/rta-02-security-finding-gate` |
| 03 | `reconciliation-to-action-03-documentation-decision.md` | `cursor/rta-03-documentation-decision` |
| 04 | `reconciliation-to-action-04-next-capture-check.md` | `cursor/rta-04-next-capture-check` |
| 05 | `reconciliation-to-action-06-diagram-fingerprint.md` | `cursor/rta-05-diagram-fingerprint` |
| 06 | `reconciliation-to-action-07-absent-subject-list.md` | `cursor/rta-06-absent-subject-list` |
| 07 | `reconciliation-to-action-08-sealed-decisions.md` | `cursor/rta-07-sealed-decisions` |
| — | `reconciliation-to-action-05-hold.md` | Hold. Not a branch. |

## How the owner checks

After each session, restart the API and the UI, hard-refresh **Diagram reconciliation** (`/infrastructure/diagram-reconcile`), and follow that prompt’s **How to check** section.
