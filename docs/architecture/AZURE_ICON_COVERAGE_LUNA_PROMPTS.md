> **Scope:** Paste-ready GPT-5.6 Luna prompts so inventory and data-flow diagrams draw a Microsoft Architecture Center icon for every resource type that pack publishes. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/azure-icon-00-index.md`](../../.cursor/prompts/azure-icon-00-index.md) through [`.cursor/prompts/azure-icon-04-platform-services.md`](../../.cursor/prompts/azure-icon-04-platform-services.md)

# Azure icon coverage — Luna prompts

**Created:** 2026-09-23 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

The official zip is already in the tree at `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/Source/Azure_Public_Service_Icons.zip` (July 2026 Architecture Center SVG pack). Ten services are embedded. Everything else on the diagram still draws an ArchLucid category pictogram.

| ID | Prompt | Intent |
|----|--------|--------|
| **AZI-01** | [azure-icon-01-kind-match.md](../../.cursor/prompts/azure-icon-01-kind-match.md) | A kind on the resource no longer blocks the default icon. `functionapp` still wins over App Service, including `functionapp,linux`. |
| **AZI-02** | [azure-icon-02-named-services.md](../../.cursor/prompts/azure-icon-02-named-services.md) | Map the named product types in `DiagramArmTypeFriendlyName` that already have a file in the zip. |
| **AZI-03** | [azure-icon-03-network-attachments.md](../../.cursor/prompts/azure-icon-03-network-attachments.md) | Map the network types a resource-group diagram shows beside the virtual network. |
| **AZI-04** | [azure-icon-04-platform-services.md](../../.cursor/prompts/azure-icon-04-platform-services.md) | Map the remaining platform types that have a file in this zip. |

## Run order

**01 → owner look → 02 → owner look → 03 → owner look → 04.** Each later prompt starts from the accepted branch of the previous one. Do not run two of these in parallel. They edit the same manifest.

## Stays a pictogram

Microsoft does not publish an Architecture Center icon in this zip for private DNS zones, Container Apps, Fabric capacities, Power BI Dedicated capacities, NSG security rules, route entries, VM extensions, role assignments, or locks. Do not borrow a parent icon for those types. Do not download the Fabric pack, the Power Platform pack, or any other set.

## Do not pull into these sessions

- A second icon download, a GitHub mirror, or the 18×18 PNG pack from `#3585` / `#3586`
- Embedding the whole zip (portal and hub art are not diagram nodes)
- Subscription-frame, data-flow layout, edge ink, or outline changes
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
