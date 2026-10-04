# DIC-02 — Save “this box is that resource”

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DIC-03 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Diagram import comparison (**DIC**). **Depends on:** DIC-01 on `master`.

## Goal

An architect can point a diagram node at an inventory resource. The next compare reuses that choice. The row says **Confirmed**.

## Why

`DiagramInfrastructureLabelParser` lowercases the label, reads a resource group from parentheses, and recognizes seven type tokens (`sql`, `storage`, `vnet`, `vm`, `keyvault`, `publicip`, `appservice`). A box labeled “Member Portal — Prod” does not match `stprodmemberportal01`. Week 3 needs that human mapping saved, not retyped every compare.

## Read first

- `ArchLucid.Application/InfraEvidence/DiagramReconciliation/DiagramInfrastructureMatcher.cs`
- `ArchLucid.Application/InfraEvidence/DiagramReconciliation/DiagramInfrastructureLabelParser.cs`
- `ArchLucid.Contracts/Architecture/DiagramInfrastructureMatchKinds.cs`
- `ArchLucid.Contracts/Architecture/DiagramInfrastructureCorrespondenceRow.cs`
- The DIC-01 advisory comparison store and `DiagramReconcileWorkbenchClient.tsx`
- `docs/library/INFRA_EVIDENCE_PLANE.md` — AI cannot mint Exact

## What to build

1. Branch `cursor/dic-02-confirmed-mapping` from current `master`.
2. Persist a tenant-scoped mapping: normalized diagram label, optional diagram node id, cloud resource id, azure resource id, and who saved it. The next unused migration prefix. A mapping is not an ObservedFact and is not a sealed review record.
3. Add match kind `Confirmed` beside the existing kinds. Explain text: “An architect confirmed this diagram node is this inventory resource.”
4. In `DiagramInfrastructureMatcher.Match`, apply a saved mapping before label candidates. A mapped node does not also stay DiagramOnly. The mapped inventory resource is not also InfrastructureOnly. Heuristic Exact, Probable, and Possible still run for nodes with no mapping.
5. The matcher must not write `Confirmed` by itself. Only a stored human mapping produces that kind.
6. On a correspondence row, a control labeled **This box is** lets the operator pick an inventory resource from the selected capture and save. Saving stores the mapping and refreshes the comparison. Sentence case. Disable the save until a resource is chosen.
7. Tests: a label that parses to DiagramOnly becomes Confirmed when a mapping exists; a second `Match` call with the same mapping still returns Confirmed; a node with no mapping still uses the label parser; the matcher does not emit Confirmed when the mapping list is empty.

## Acceptance criteria

- The saved pair survives a new compare of the same drawing and capture.
- Confirmed is distinct from Exact. Exact remains name, resource group, and type.
- Possible and Unknown still do not become Exact because a model guessed.

## Constraints

- Before editing any tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not call vision. Do not read `diagram.Edges` (DIC-03). Do not group InfrastructureOnly rows (DIC-04).
- Do not remove the sealed guard from the run-linked route.
- Stage only the mapping store, matcher precedence, workbench control, and tests. **No `git add -A`.**
- **Do not commit.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

Scoped `dotnet test` for `DiagramInfrastructureMatcher` and the new mapping tests. One compile check on the projects you touch, plus one retry if it exits 1. Heartbeat every 8s.

## How to check

Restart the API and the UI. Hard-refresh **Diagram reconciliation**. Use the same drawing as DIC-01.

1. Compare once. **Member Portal — Prod** is Diagram only.
2. On that row, set **This box is** to `stprodmemberportal01` (or another real resource in the capture) and save.
3. That row now says Confirmed and names the resource. The resource is no longer an Infrastructure only row.
4. Run Compare again without changing the picker. The row is still Confirmed.
5. A different unmatched label with no saved mapping stays Diagram only.
6. The page still says advisory documentation accuracy.

Wait for that look before any commit.
