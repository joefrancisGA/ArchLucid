> **Scope:** Paste-ready GPT-5.6 Luna prompts. Draw the data-flow relationships the page already counts, stop hiding inferred linked-service edges behind the cross-group filter, stop showing compiler comments in Declared pipeline wiring, replace the blue compute pictogram on external linked services with the official icon, and keep that icon through diagram repair. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/data-flow-diagram-00-index.md`](../../.cursor/prompts/data-flow-diagram-00-index.md) through [`.cursor/prompts/data-flow-diagram-05-keep-icon-fields.md`](../../.cursor/prompts/data-flow-diagram-05-keep-icon-fields.md)

# Data flow diagram — Luna prompts

**Created:** 2026-09-30 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

Observed on SecureNow **Diagrams**, diagram type **Data flow — what may connect**, snapshot `Hmd_HI_HAP_Non_Prod` · 2026-09-29 13:33 UTC. The page reported **127 resources in 88 connected components. 39 visible relationships.** The canvas showed the cards and no connectors. **Declared pipeline wiring** repeated `al-provenance=ObservedFact al-inference=inventory-adf-linked-service-inferred` and then listed every node's `al-type` / `al-seed` comment. External linked services (`azureblob`, `azuremysql1`, `sftp_ahcccs`, `nucc_http`) used the blue compute pictogram.

| ID | Prompt | Intent |
|----|--------|--------|
| **DFV-01** | [data-flow-diagram-01-draw-relationships.md](../../.cursor/prompts/data-flow-diagram-01-draw-relationships.md) | Draw every counted relationship that reaches the router. Shipped in PR 4114. The sky-lane vertical used to run through wider cards, `TryRoute` returned null, and the SVG dropped the edge. |
| **DFV-02** | [data-flow-diagram-02-hide-compiler-comments.md](../../.cursor/prompts/data-flow-diagram-02-hide-compiler-comments.md) | Keep the honesty sentences. Stop joining provenance comments into the summary and stop listing seed ids on the page. |
| **DFV-03** | [data-flow-diagram-03-linked-service-icons.md](../../.cursor/prompts/data-flow-diagram-03-linked-service-icons.md) | Map `arm.externalLinkedServiceType` to the official icon. Non-Azure connectors use Resource Linked. Access connectors stay pictograms. Shipped in PR 4128. The live canvas still drops the type during repair. |
| **DFV-04** | [data-flow-diagram-04-paint-inferred-links.md](../../.cursor/prompts/data-flow-diagram-04-paint-inferred-links.md) | Paint `likely ·` linked-service edges on Data flow with the checkbox off. Hide `likely ·` and `applies` on other diagrams only when the resource groups differ. |
| **DFV-05** | [data-flow-diagram-05-keep-icon-fields.md](../../.cursor/prompts/data-flow-diagram-05-keep-icon-fields.md) | Copy `ExternalLinkedServiceType`, `ArmResourceKind`, and the other painter fields through `MermaidDiagramDeterministicRepairer` so forest layout still draws the DFV-03 icon. |

## Run order

**01–04 are on `master`.** Next: **05 → owner look**. Do not run two of these in one session. Do not redo the DFV-03 icon map inside 05.

## After PR 4128

A later look at the same snapshot still shows the blue compute pictogram on `azureblob`, `azuremysql1`, and the SFTP cards. `DiagramInventoryAzureIconResolver` reads `ExternalLinkedServiceType`, and the compiler sets it. `MermaidDiagramDeterministicRepairer` then builds a new node without that field or `ArmResourceKind`. Forest layout paints the repaired AST. The icon test renders the compiled node and never calls `Repair`, so it stays green. DFV-05 is that fix. Do not add icon files, and do not reopen the icon map. Access connectors, Fabric capacities, and Logic App API connections stay pictograms.

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
