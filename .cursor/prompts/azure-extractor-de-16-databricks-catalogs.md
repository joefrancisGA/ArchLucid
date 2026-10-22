# AX-DE-16 — Databricks (when present) and diagram catalogs

**Wave:** AX-DE. **Depends on:** AX-DE-01. Consume SN-DF-02 stage catalog — do not re-implement Data Flow compile.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

When `Microsoft.Databricks/workspaces` exists in inventory, collect enough properties for Transform-stage diagrams (managed RG, VNet/subnet, storage) and add the ARM type to Executive / peel / friendly-name / SN-DF stage catalogs. **Do not mint** Databricks (or Fabric/Power BI) when the type is absent.

## Why

Owner gold picture is ADF → ADLS → Databricks → Fabric → Power BI. SN-DF-02 already maps `Microsoft.Databricks/` → Transform **if the type string matches**. Collection and ExecutiveAlwaysShowTiers still omit it.

## Context

- `ExecutiveAlwaysShowTiers` (integration or a new analytics tier — prefer extending Integration or adding **Analytics** only if UI `INFRA_DIAGRAMS_EXECUTIVE_TIERS` is updated in the same PR)
- `DiagramPeelCatalogDefaultSeed` Backbone
- `DiagramArmTypeFriendlyName`
- `AzureInventoryDataFlowStageResolver` if SN-DF-02 has landed; otherwise add a test that the type is not Compute-only

## What to build

1. Type-scoped GET for Databricks workspaces so `parameters` / `properties` include managed resource group id and custom VNet/subnet ids when present. Map workspace→subnet ObservedFact if subnet id exists.
2. Catalog: friendly name **Databricks workspace**; peel backbone; Executive show (document UI key).
3. Fabric / Power BI: **only** if those ARM types appear (`Microsoft.PowerBIDedicated/capacities`, Fabric capacities). Add stage Consumer mapping. Do **not** call Power BI REST tenant admin APIs in this prompt.
4. Tests: workspace with subnet; snapshot without Databricks does not invent a node; friendly name; peel rank backbone.

## Acceptance criteria

- Empty Transform remains correct when no Databricks ARM row exists.
- No workspace tokens / PAT.

## Constraints

- Compile ArtifactSynthesis.Tests + KnowledgeGraph.Tests stage resolver if present.
- UI tier key change requires workbench allowlist — keep in this prompt if you touch ExecutiveAlwaysShowTiers.

## Done when

A ZIP that includes a Databricks workspace shows it on Executive and Data Flow Transform; a ZIP without one still has an empty Transform stage.
