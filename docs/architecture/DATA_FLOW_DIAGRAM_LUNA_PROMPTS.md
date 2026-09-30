> **Scope:** Paste-ready GPT-5.6 Luna prompts. Draw the data-flow relationships the page already counts, stop hiding inferred linked-service edges behind the cross-group filter, stop showing compiler comments in Declared pipeline wiring, and replace the blue compute pictogram on external linked services with the official icon. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/data-flow-diagram-00-index.md`](../../.cursor/prompts/data-flow-diagram-00-index.md) through [`.cursor/prompts/data-flow-diagram-04-paint-inferred-links.md`](../../.cursor/prompts/data-flow-diagram-04-paint-inferred-links.md)

# Data flow diagram — Luna prompts

**Created:** 2026-09-30 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

Observed on SecureNow **Diagrams**, diagram type **Data flow — what may connect**, snapshot `Hmd_HI_HAP_Non_Prod` · 2026-09-29 13:33 UTC. The page reported **127 resources in 88 connected components. 39 visible relationships.** The canvas showed the cards and no connectors. **Declared pipeline wiring** repeated `al-provenance=ObservedFact al-inference=inventory-adf-linked-service-inferred` and then listed every node's `al-type` / `al-seed` comment. External linked services (`azureblob`, `azuremysql1`, `sftp_ahcccs`, `nucc_http`) used the blue compute pictogram.

| ID | Prompt | Intent |
|----|--------|--------|
| **DFV-01** | [data-flow-diagram-01-draw-relationships.md](../../.cursor/prompts/data-flow-diagram-01-draw-relationships.md) | Draw every counted relationship that reaches the router. Shipped in PR 4114. The sky-lane vertical used to run through wider cards, `TryRoute` returned null, and the SVG dropped the edge. |
| **DFV-02** | [data-flow-diagram-02-hide-compiler-comments.md](../../.cursor/prompts/data-flow-diagram-02-hide-compiler-comments.md) | Keep the honesty sentences. Stop joining provenance comments into the summary and stop listing seed ids on the page. |
| **DFV-03** | [data-flow-diagram-03-linked-service-icons.md](../../.cursor/prompts/data-flow-diagram-03-linked-service-icons.md) | Map `arm.externalLinkedServiceType` to the official icon. Non-Azure connectors use Resource Linked. Access connectors stay pictograms. |
| **DFV-04** | [data-flow-diagram-04-paint-inferred-links.md](../../.cursor/prompts/data-flow-diagram-04-paint-inferred-links.md) | Paint `likely ·` linked-service edges on Data flow with the checkbox off. Hide `likely ·` and `applies` on other diagrams only when the resource groups differ. |

## Run order

**01 is on `master` (PR 4114).** The canvas stayed empty because the fan-out filter removes inferred edges before routing. Next: **04 → owner look**. **02** and **03** do not depend on 04. Do not run two of these in one session.

## After PR 4114

A second look at the same snapshot still showed no connectors. `DiagramCrossGroupFanOutCanvasExclusion.ShouldExclude` drops every `likely ·` or `applies` edge once both ends have a resource group. It does not compare the groups. External linked-service ids (`adf-external:{factoryArmId}|{name}`) parse to the factory's resource group, so those same-group edges are dropped too. DFV-04 is that fix. Do not reopen the router.

## Already true — do not redo

AZI-01 through AZI-04 are on `master`. Data Factory, Logic Apps, MySQL, storage accounts, firewalls, NAT gateways, and Event Hubs already resolve to official SVGs. Diagnostic settings are already excluded by `AzureInventoryDataFlowEvidenceCatalog` (`diagnosticToDestination`). These prompts must not put them back on the diagram.

## Stays a pictogram

The July 2026 zip has no icon for `Microsoft.Databricks/accessConnectors`, `Microsoft.Fabric/capacities`, or the ADF connector `AzureTableStorage`. Do not borrow the Databricks workspace icon or the storage-account icon for those.

## Do not pull into these sessions

- A second icon download, a GitHub mirror, or the 18×18 PNG pack
- Hiding unconnected resources, or collapsing workspace tabs
- Evidence-catalog changes, stage renames, or observed-traffic edges
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
