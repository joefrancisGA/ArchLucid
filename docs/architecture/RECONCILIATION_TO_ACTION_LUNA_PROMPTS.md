> **Scope:** Paste-ready GPT-5.6 Luna prompts. After a diagram has been compared to an inventory capture, keep the existing finding link and record what an operator decided about the remaining gaps. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/reconciliation-to-action-00-index.md`](../../.cursor/prompts/reconciliation-to-action-00-index.md) through [`.cursor/prompts/reconciliation-to-action-05-hold.md`](../../.cursor/prompts/reconciliation-to-action-05-hold.md)

# Reconciliation to action — Luna prompts

**Created:** 2026-10-11 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

DIC-01 through DIC-05 are on `master`. The sealed workbench can already create an operational finding and open a conflict in the remediation factory. The finding id lives in page state, so a refresh forgets it. Diagram-only and inventory-only rows are documentation gaps, not security findings.

| ID | Prompt | Intent |
|----|--------|--------|
| **RTA-01** | [reconciliation-to-action-01-restore-finding-link.md](../../.cursor/prompts/reconciliation-to-action-01-restore-finding-link.md) | Reload finding ids by the existing `diagram-reconcile:{runId}:{snapshotId}:{correspondenceId}` key. |
| **RTA-02** | [reconciliation-to-action-02-security-finding-gate.md](../../.cursor/prompts/reconciliation-to-action-02-security-finding-gate.md) | Create a finding only for a security discrepancy or a multi-candidate conflict. |
| **RTA-03** | [reconciliation-to-action-03-documentation-decision.md](../../.cursor/prompts/reconciliation-to-action-03-documentation-decision.md) | Save Update the drawing, Accept as undocumented, or Check the inventory. Not a finding. |
| **RTA-04** | [reconciliation-to-action-04-next-capture-check.md](../../.cursor/prompts/reconciliation-to-action-04-next-capture-check.md) | On a later compare, say still open, no longer in this capture, or evidence changed. |
| **RTA-HOLD** | [reconciliation-to-action-05-hold.md](../../.cursor/prompts/reconciliation-to-action-05-hold.md) | No tenant-wide finding scan, no finding for a documentation gap, no auto-close, no Azure apply. |

## Run order

**01 → owner look → 02 → 03 → 04.** Do not run two of these in one session.

## How to check

Restart the API and the UI after each session. Open SecureNow **Diagram reconciliation** at `/infrastructure/diagram-reconcile` and hard-refresh.

| After | What you should see |
|-------|---------------------|
| **RTA-01** | Create a finding on the sealed path, refresh, and the row still says Finding recorded. Open finding opens the same finding. The page does not load the tenant finding list. |
| **RTA-02** | Exact, diagram-only, and inventory-only rows have no Create operational finding. A security discrepancy or a multi-candidate conflict still does. Advisory compare does not show the button. |
| **RTA-03** | A diagram-only row can save Update the drawing and show it after refresh. The scorecard does not count that row as Matched. A conflict row has no documentation decision. |
| **RTA-04** | The same gap on a later compare says Still open. A removed gap says No longer in this capture. A gap that now matches says Evidence changed. The operational finding stays open. |

Each prompt ends before commit. Look at the page, then say whether to commit.

## Not in this set

- A new disposition model that replaces operational findings
- Automatic resolution of a security finding
- Terraform apply or an Azure write
- Vision or OCR
- Removing the sealed-manifest guard from `POST /v1/architecture/runs/{runId}/diagrams/reconcile`
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
