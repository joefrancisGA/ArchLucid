> **Scope:** Keep Structurizr C4 (`docs/c4/workspace.dsl`) and Mermaid zoom-ins (`architecture_diagrams/`) from drifting apart.
> **Spine doc:** [`../START_HERE.md`](../START_HERE.md) · **C4 DSL:** [`../c4/workspace.dsl`](../c4/workspace.dsl) · **Diagrams:** [`architecture_diagrams/README.md`](architecture_diagrams/README.md)

# C4 ↔ Mermaid sync

## Intent

- **`docs/c4/workspace.dsl`** — Structurizr Lite / IDE C4 model (system context + containers).
- **`docs/architecture/architecture_diagrams/*.mmd`** — Mermaid sources for handbook, DOCX, and static site gallery.
- Both describe the **same** product boxes: UI, Api, Worker, Azure SQL (**per-tenant catalogs**), Blob, Service Bus, Entra, Azure OpenAI.

They are **not** auto-generated from each other. Sync is a documentation discipline + CI drift checks on Mermaid render artifacts.

## Mapping

| C4 element (`workspace.dsl`) | Mermaid primary |
|------------------------------|-----------------|
| Person Operator / Automation | `archlucid-system-overview`, happy path |
| Container `archlucid-ui` | overview, `archlucid-operator-ui-shell` |
| Container `ArchLucid.Api` | overview, authority / outbox sequences |
| Container `ArchLucid.Worker` | overview, async outbox, retrieval |
| Container SQL Server | overview, tenant isolation, failover — **SystemWithPerTenantCatalogs** |
| Blob / Service Bus | overview, azure topology |
| Azure OpenAI / Entra | overview, security model |

## When to edit both

- Renaming a deployable container or changing SQL topology language (especially **no RLS** / per-tenant catalogs).
- Adding a new first-class Azure dependency that appears in system context.
- Changing authority pipeline stage names that appear in both flows docs and Mermaid.

## Checklist

1. Update `workspace.dsl` (keep the sync comment at top of file).
2. Update matching `.mmd` files and handbook chapters that embed them.
3. Refresh [`DIAGRAM_ADR_OVERLAY.md`](DIAGRAM_ADR_OVERLAY.md) if ADR links change.
4. Parent/agent renders SVG/PNG; CI `check_architecture_diagrams_drift.py` verifies companions exist.
