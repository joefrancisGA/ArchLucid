# AX-DC-HOLD — no new collection, no promote Probable/Inferred

**This prompt is not implementation.** Paste only if a session starts new ARM harvest, re-runs AX-DE-01–18, promotes inventory edges to ObservedFact, or claims runtime traffic from RBAC/hostname wiring.

Follow [`.cursor/prompts/azure-extractor-diagram-consumption-00-index.md`](azure-extractor-diagram-consumption-00-index.md) global constraints.

Library copy: [`docs/library/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_HOLD.md`](../../docs/library/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_HOLD.md).

## Goal

Keep diagram consumption inside the shipped snapshot → graph → `DiagramAst` → workbench spine.

## Do not implement (ever from AX-DC sessions)

| Temptation | Hold |
|-----------|------|
| Re-run AX-DE-01–18 or new ZIP companions | Collection closed |
| Hosted `config/list` / Cost POST | AX-DE-18 Tier 1 only |
| Azure HTTP at render | Snapshots only |
| Promote RBAC/hostname to ObservedFact | Probable / Inferred bands |
| “Confirmed dependency” / traffic labels | Authorization ≠ runtime |
| Hide completeness warnings | AX-DC-04 / 08 |
| Stock IDP-04 solid DerivedFact | AX-DC-03 |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |
| Desktop tabs behind **More** | workspace rule |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **AX-DC-01–08**, **AX-DE-HOLD**, and the plane.

## Done when

The hold is written. No code from this file.
