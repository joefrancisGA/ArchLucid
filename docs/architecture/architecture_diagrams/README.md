> **Scope:** Saved architecture diagrams (Mermaid sources + rendered SVG/PNG) for ArchLucid.
> **Spine doc:** [`../../START_HERE.md`](../../START_HERE.md) · **Poster:** [`../../ARCHITECTURE_ON_ONE_PAGE.md`](../../ARCHITECTURE_ON_ONE_PAGE.md) · **Handbook:** [`../architecture_handbook/README.md`](../architecture_handbook/README.md)

# Architecture diagrams

| # | Diagram | Markdown | Source | SVG |
|---|---------|----------|--------|-----|
| — | System overview | [`archlucid-system-overview.md`](archlucid-system-overview.md) | [`.mmd`](archlucid-system-overview.mmd) | [`.svg`](archlucid-system-overview.svg) |
| — | Review happy path | (in overview md) | [`.mmd`](archlucid-review-happy-path.mmd) | [`.svg`](archlucid-review-happy-path.svg) |
| 1 | Authority pipeline | [`archlucid-authority-pipeline.md`](archlucid-authority-pipeline.md) | [`.mmd`](archlucid-authority-pipeline.mmd) | [`.svg`](archlucid-authority-pipeline.svg) |
| 2 | Authority vs coordinator | [`archlucid-authority-vs-coordinator.md`](archlucid-authority-vs-coordinator.md) | [`.mmd`](archlucid-authority-vs-coordinator.mmd) | [`.svg`](archlucid-authority-vs-coordinator.svg) |
| 3 | Async / outbox | [`archlucid-async-outbox-path.md`](archlucid-async-outbox-path.md) | [`.mmd`](archlucid-async-outbox-path.mmd) | [`.svg`](archlucid-async-outbox-path.svg) |
| 4 | Export / replay | [`archlucid-export-replay.md`](archlucid-export-replay.md) | [`.mmd`](archlucid-export-replay.mmd) | [`.svg`](archlucid-export-replay.svg) |
| 5 | Comparison / drift | [`archlucid-comparison-drift.md`](archlucid-comparison-drift.md) | [`.mmd`](archlucid-comparison-drift.mmd) | [`.svg`](archlucid-comparison-drift.svg) |
| 6 | .NET project graph | [`archlucid-dotnet-project-graph.md`](archlucid-dotnet-project-graph.md) | [`.mmd`](archlucid-dotnet-project-graph.mmd) | [`.svg`](archlucid-dotnet-project-graph.svg) |
| 7 | Governance / policy packs | [`archlucid-governance-policy-packs.md`](archlucid-governance-policy-packs.md) | [`.mmd`](archlucid-governance-policy-packs.mmd) | [`.svg`](archlucid-governance-policy-packs.svg) |
| 8 | Retrieval / RAG | [`archlucid-retrieval-rag.md`](archlucid-retrieval-rag.md) | [`.mmd`](archlucid-retrieval-rag.mmd) | [`.svg`](archlucid-retrieval-rag.svg) |
| 9 | Artifact synthesis | [`archlucid-artifact-synthesis.md`](archlucid-artifact-synthesis.md) | [`.mmd`](archlucid-artifact-synthesis.mmd) | [`.svg`](archlucid-artifact-synthesis.svg) |
| 10 | Security model | [`archlucid-security-model.md`](archlucid-security-model.md) | [`.mmd`](archlucid-security-model.mmd) | [`.svg`](archlucid-security-model.svg) |
| 11 | Tenant isolation | [`archlucid-tenant-isolation.md`](archlucid-tenant-isolation.md) | [`.mmd`](archlucid-tenant-isolation.mmd) | [`.svg`](archlucid-tenant-isolation.svg) |
| 12 | Azure topology | [`archlucid-azure-topology.md`](archlucid-azure-topology.md) | [`.mmd`](archlucid-azure-topology.mmd) | [`.svg`](archlucid-azure-topology.svg) |
| 13 | Operator UI shell | [`archlucid-operator-ui-shell.md`](archlucid-operator-ui-shell.md) | [`.mmd`](archlucid-operator-ui-shell.mmd) | [`.svg`](archlucid-operator-ui-shell.svg) |
| 14 | First-run pilot | [`archlucid-first-run-pilot.md`](archlucid-first-run-pilot.md) | [`.mmd`](archlucid-first-run-pilot.mmd) | [`.svg`](archlucid-first-run-pilot.svg) |
| 15 | Integrations / ITSM | [`archlucid-integrations-itsm.md`](archlucid-integrations-itsm.md) | [`.mmd`](archlucid-integrations-itsm.mmd) | [`.svg`](archlucid-integrations-itsm.svg) |
| — | Stage: context ingestion | — | [`.mmd`](archlucid-stage-context-ingestion.mmd) | [`.svg`](archlucid-stage-context-ingestion.svg) |
| — | Stage: knowledge graph | — | [`.mmd`](archlucid-stage-knowledge-graph.mmd) | [`.svg`](archlucid-stage-knowledge-graph.svg) |
| — | Stage: findings | — | [`.mmd`](archlucid-stage-findings.mmd) | [`.svg`](archlucid-stage-findings.svg) |
| — | Stage: decisioning | — | [`.mmd`](archlucid-stage-decisioning.mmd) | [`.svg`](archlucid-stage-decisioning.svg) |
| — | Stage: artifacts + finalize | — | [`.mmd`](archlucid-stage-artifacts-finalize.mmd) | [`.svg`](archlucid-stage-artifacts-finalize.svg) |
| — | Failure resilience | — | [`.mmd`](archlucid-failure-resilience.mmd) | [`.svg`](archlucid-failure-resilience.svg) |
| — | Failover continuity | — | [`.mmd`](archlucid-failover-continuity.mmd) | [`.svg`](archlucid-failover-continuity.svg) |
| — | Threat: Ask / RAG | — | [`.mmd`](archlucid-threat-ask-rag.mmd) | [`.svg`](archlucid-threat-ask-rag.svg) |
| — | Threat: webhooks | — | [`.mmd`](archlucid-threat-webhooks.mmd) | [`.svg`](archlucid-threat-webhooks.svg) |

**Handbook (Markdown + regenerable DOCX):** [`../architecture_handbook/README.md`](../architecture_handbook/README.md)  
**Gallery:** [`../architecture_handbook/site/index.html`](../architecture_handbook/site/index.html)  
**Capabilities note:** [`../PLATFORM_HANDBOOK_VS_PRODUCT_CAPABILITIES.md`](../PLATFORM_HANDBOOK_VS_PRODUCT_CAPABILITIES.md)  
**ADR overlay:** [`../DIAGRAM_ADR_OVERLAY.md`](../DIAGRAM_ADR_OVERLAY.md) · **C4 sync:** [`../C4_MERMAID_SYNC.md`](../C4_MERMAID_SYNC.md)

## Re-render SVG / PNG from `.mmd`

```powershell
$diagrams = 'docs/architecture/architecture_diagrams'
Get-ChildItem $diagrams -Filter '*.mmd' | ForEach-Object {
  npx --yes @mermaid-js/mermaid-cli@11 -i $_.FullName -o ($_.FullName -replace '\.mmd$','.svg')
  npx --yes @mermaid-js/mermaid-cli@11 -i $_.FullName -o ($_.FullName -replace '\.mmd$','.png') -b white
}
.\scripts\docs\generate-architecture-handbook-docx.ps1 -SkipPngRender
```
