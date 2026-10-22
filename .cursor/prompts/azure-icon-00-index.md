<!-- Azure icon coverage — Luna prompts. Paste one numbered file per session.
     Origin: 2026-09-23. The July 2026 Architecture Center SVG zip is already
     in the tree. Ten services are embedded. Live ARM kinds and unmapped types
     still draw category pictograms.
     Do not implement from this index. -->

# Azure icon coverage — Luna prompt set (AZI-01–AZI-04)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/azure-icon-0N-*.md` file per GPT-5.6 Luna session.

Canonical wave doc: [`docs/architecture/AZURE_ICON_COVERAGE_LUNA_PROMPTS.md`](../../docs/architecture/AZURE_ICON_COVERAGE_LUNA_PROMPTS.md).

**Base:** the branch that already contains `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/azure-icon-manifest.json` and the ten SVGs under `Assets/AzureIcons/Svg/`. Do **not** branch from `revert/diagram-icon-layout-3585-3592`.

**Zip already present:** `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/Source/Azure_Public_Service_Icons.zip`. Do not download another pack.

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Kind match** | A blank kind on the catalog row matches only a resource with a blank kind. `functionapp,linux` matches nothing. | A specialized kind wins when it equals the resource kind or is the resource kind's first comma-separated token. Otherwise the blank-kind row for that ARM type is the default. | **AZI-01** |
| **Named products** | Disk, Kubernetes, App Service plan, SQL server, SQL managed instance, PostgreSQL, MySQL, Redis, Data Factory, Synapse, and Databricks use pictograms. | Those ARM types draw the official SVG named in AZI-02. | **AZI-02** |
| **Network attachments** | NIC, public IP, load balancer, private endpoint, and the other network types in AZI-03 use the teal network pictogram. | Those ARM types draw the official SVG named in AZI-03. | **AZI-03** |
| **Platform services** | Log Analytics, Application Insights, managed identity, and the other platform types in AZI-04 use pictograms. | Those ARM types draw the official SVG named in AZI-04. | **AZI-04** |

## What this set does not change

Keep the subscription frame. Keep category pictograms for ARM types with no file in this zip. Keep product names on the card, next to the mark. Do not crop, flip, rotate, or recolor an icon. Do not use an Azure icon to represent ArchLucid.

Do **not** map private DNS zones, Container Apps, Fabric capacities, Power BI Dedicated capacities, NSG rules, route entries, VM extensions, role assignments, or locks. Do **not** embed the rest of the zip after AZI-04.

## Run order

**01 → owner look → 02 → owner look → 03 → owner look → 04.**

Each implementation prompt ends **before commit**. The owner looks, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 01 | `azure-icon-01-kind-match.md` | `azi/01-kind-match` |
| 02 | `azure-icon-02-named-services.md` | `azi/02-named-services` |
| 03 | `azure-icon-03-network-attachments.md` | `azi/03-network-attachments` |
| 04 | `azure-icon-04-platform-services.md` | `azi/04-platform-services` |
