> **Scope:** Contributor-reference — written hold for Azure extractor diagram **consumption** (**AX-DC-HOLD**). Internal engineering only.
> **Spine:** [`INFRA_EVIDENCE_PLANE.md`](INFRA_EVIDENCE_PLANE.md) · **Prompts:** [`../architecture/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_COMPOSER_PROMPTS.md`](../architecture/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_COMPOSER_PROMPTS.md) · **Collection (closed):** [`../architecture/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md`](../architecture/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md) · **Feasibility:** [`../architecture/AZURE_CONNECTION_POINT_DISCOVERY.md`](../architecture/AZURE_CONNECTION_POINT_DISCOVERY.md)

# Azure extractor diagram consumption hold (AX-DC-HOLD)

**Status:** Active written hold — **not implementation**. Paste [`.cursor/prompts/azure-extractor-dc-09-hold.md`](../../.cursor/prompts/azure-extractor-dc-09-hold.md) only when a session starts new ARM collection, promotes Probable/Inferred to ObservedFact, or claims runtime traffic from inventory edges.

## Authorized spine

```text
AX-DE collection (shipped) → snapshot relationships + CompletenessWarnings
    → graph compile (mode filters + endpoint includers)
    → DiagramAst (confidence strokes + labels)
    → workbench banner + outline inspector
```

Consumption only. **Do not** extend the ZIP in AX-DC sessions. **Data Flow families** (May access + Event Grid + DNS-joined PE on Diagram 3) are **SN-PE**, not AX-DC.

## Do not implement (ever from AX-DC sessions)

| Temptation | Hold |
|-----------|------|
| Re-run AX-DE-01–18 or new association collection | Collection closed — use AX-DC |
| Second ZIP / hosted POST for `config/list` | AX-DE-18 is Tier 1 only; hosted stays GET-only |
| Azure HTTP at Mermaid / `DiagramAst` compile | Snapshots only |
| Promote `appAuthorizedAccess` / `hostnameInferredTarget` to ObservedFact | Probable / Inferred bands in discovery doc |
| Label RBAC or hostname edges “confirmed dependency” or “observed traffic” | Authorization ≠ runtime |
| Hide `rbac-scope-too-broad` or hosted app-settings warnings | AX-DC-04 / AX-DC-08 honesty |
| Stock **IDP-04** without AX-DC-03 band mapping | DerivedFact ≠ solid Observed for MI edges |
| `terraform apply` / ARM writes | Plane §2 |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |
| Desktop review tabs behind **More** | workspace rule |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **AX-DC-01–08** and the plane. For collection gaps, cite **AX-DE-HOLD** — do not expand scope into a new harvest wave.
