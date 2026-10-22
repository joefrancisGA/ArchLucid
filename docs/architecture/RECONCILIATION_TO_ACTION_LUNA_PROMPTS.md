> **Scope:** Paste-ready GPT-5.6 Luna prompts. After a diagram has been compared to an inventory capture, keep the existing finding link and record what an operator decided about the remaining gaps. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/reconciliation-to-action-00-index.md`](../../.cursor/prompts/reconciliation-to-action-00-index.md), [RTA-01](../../.cursor/prompts/reconciliation-to-action-01-restore-finding-link.md) through [RTA-04](../../.cursor/prompts/reconciliation-to-action-04-next-capture-check.md), [RTA-HOLD](../../.cursor/prompts/reconciliation-to-action-05-hold.md), [RTA-05](../../.cursor/prompts/reconciliation-to-action-06-diagram-fingerprint.md), [RTA-06](../../.cursor/prompts/reconciliation-to-action-07-absent-subject-list.md), [RTA-07](../../.cursor/prompts/reconciliation-to-action-08-sealed-decisions.md).

# Reconciliation to action — Luna prompts

**Created:** 2026-10-11 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

DIC-01 through DIC-05 are on `master`. **RTA-01** through **RTA-07** are on `master` (#4511, #4525, #4530, #4539, #4549): finding reload, security-only finding gate, documentation decisions, later-capture checks, diagram fingerprint scoping, absent-subject list, and sealed-path decisions. **Do not greenfield.**

The latest decision lookup is tenant plus subject only. An inventory subject is a cloud resource id, so a second drawing can inherit a decision for a shared resource. A removed box is never requested, so its decision leaves the screen. Sealed reconcile does not create an advisory comparison row, so it cannot save a decision. A new diagram-document table is not the next step. The parsed nodes and edges already identify the drawing.

| ID | Prompt | Intent |
|----|--------|--------|
| **RTA-01** | [reconciliation-to-action-01-restore-finding-link.md](../../.cursor/prompts/reconciliation-to-action-01-restore-finding-link.md) | Reload finding ids by the existing `diagram-reconcile:{runId}:{snapshotId}:{correspondenceId}` key. |
| **RTA-02** | [reconciliation-to-action-02-security-finding-gate.md](../../.cursor/prompts/reconciliation-to-action-02-security-finding-gate.md) | Create a finding only for a security discrepancy or a multi-candidate conflict. |
| **RTA-03** | [reconciliation-to-action-03-documentation-decision.md](../../.cursor/prompts/reconciliation-to-action-03-documentation-decision.md) | Save Update the drawing, Accept as undocumented, or Check the inventory. Not a finding. |
| **RTA-04** | [reconciliation-to-action-04-next-capture-check.md](../../.cursor/prompts/reconciliation-to-action-04-next-capture-check.md) | On a later compare, say still open, no longer in this capture, or evidence changed. |
| **RTA-05** | [reconciliation-to-action-06-diagram-fingerprint.md](../../.cursor/prompts/reconciliation-to-action-06-diagram-fingerprint.md) | Hash parsed nodes and edges onto the comparison and the decision. Latest lookup matches that fingerprint. |
| **RTA-06** | [reconciliation-to-action-07-absent-subject-list.md](../../.cursor/prompts/reconciliation-to-action-07-absent-subject-list.md) | List decisions for this fingerprint whose subject is absent, as no longer in this capture. |
| **RTA-07** | [reconciliation-to-action-08-sealed-decisions.md](../../.cursor/prompts/reconciliation-to-action-08-sealed-decisions.md) | Save and reload the same three decisions on the sealed path. Keep the sealed-manifest guard. |
| **RTA-HOLD** | [reconciliation-to-action-05-hold.md](../../.cursor/prompts/reconciliation-to-action-05-hold.md) | No diagram-document table, no tenant-wide decision list, no sealed save through the advisory route, no Azure apply. |

## Run order

**RTA-01** and **RTA-02** are on `master`. Land **RTA-03** and **RTA-04** from `cursor/rta-luna-prompts-f8f4` before **RTA-05**. Then **05 → owner look → 06 → 07.** Do not run two of these in one session. **RTA-04** does not list a subject the current result no longer contains. That list is **RTA-06**.

## How to check

Restart the API and the UI after each session. Open SecureNow **Diagram reconciliation** at `/infrastructure/diagram-reconcile` and hard-refresh.

| After | What you should see |
|-------|---------------------|
| **RTA-01** | Create a finding on the sealed path, refresh, and the row still says Finding recorded. Open finding opens the same finding. The page does not load the tenant finding list. |
| **RTA-02** | Exact, diagram-only, and inventory-only rows have no Create operational finding. A security discrepancy or a multi-candidate conflict still does. Advisory compare does not show the button. |
| **RTA-03** | A diagram-only row can save Update the drawing and show it after refresh. The scorecard does not count that row as Matched. A conflict row has no documentation decision. |
| **RTA-04** | The same gap on a later compare says Still open. A removed gap says No longer in this capture. A gap that now matches says Evidence changed. The operational finding stays open. |
| **RTA-05** | Re-uploading the same drawing still shows the saved decision. A different drawing does not inherit it for a shared resource. |
| **RTA-06** | A removed box from the same drawing leaves a line that says no longer in this capture. A decision from another drawing is not in that list. |
| **RTA-07** | The sealed page can save Update the drawing and show it after refresh. An unsealed review still cannot reconcile. |

Each prompt ends before commit. Look at the page, then say whether to commit.

## Not in this set

- A diagram-document table. The parsed node and edge hash is the drawing boundary.
- A new disposition model that replaces operational findings
- Automatic resolution of a security finding
- Terraform apply or an Azure write
- Vision or OCR
- Removing the sealed-manifest guard from `POST /v1/architecture/runs/{runId}/diagrams/reconcile`
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
