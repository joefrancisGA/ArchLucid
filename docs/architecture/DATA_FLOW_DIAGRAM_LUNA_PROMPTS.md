> **Scope:** Paste-ready GPT-5.6 Luna prompts. Draw the data-flow relationships the page already counts, keep linked-service icons through diagram repair, and make each card say what it is, who uses a data store, which factory an ADF link belongs to, where a MySQL host lives, and what a network hop is for. DFV-11 through DFV-19 then save that link identity, draw one card per external host, wrap tall stages left to right, scroll a canvas wider than the frame, roll up repeated cards, fix the PNG browser fallback, read app settings and uploaded config, summarize the stages, and filter edges by evidence. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/data-flow-diagram-00-index.md`](../../.cursor/prompts/data-flow-diagram-00-index.md) through [`.cursor/prompts/data-flow-diagram-19-png-fallback-namespace.md`](../../.cursor/prompts/data-flow-diagram-19-png-fallback-namespace.md)

# Data flow diagram — Luna prompts

**Created:** 2026-09-30 · **Revised:** 2026-10-04 (DFV-19) · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

Observed on SecureNow **Diagrams**, diagram type **Data flow — what may connect**, snapshot `Hmd_HI_HAP_Non_Prod` · 2026-09-29 13:33 UTC. The page reported **127 resources in 88 connected components. 39 visible relationships.** The canvas showed the cards and no connectors. **Declared pipeline wiring** repeated `al-provenance=ObservedFact al-inference=inventory-adf-linked-service-inferred` and then listed every node's `al-type` / `al-seed` comment. External linked services (`azureblob`, `azuremysql1`, `sftp_ahcccs`, `nucc_http`) used the blue compute pictogram.

| ID | Prompt | Intent |
|----|--------|--------|
| **DFV-01** | [data-flow-diagram-01-draw-relationships.md](../../.cursor/prompts/data-flow-diagram-01-draw-relationships.md) | Draw every counted relationship that reaches the router. Shipped in PR 4114. The sky-lane vertical used to run through wider cards, `TryRoute` returned null, and the SVG dropped the edge. |
| **DFV-02** | [data-flow-diagram-02-hide-compiler-comments.md](../../.cursor/prompts/data-flow-diagram-02-hide-compiler-comments.md) | Keep the honesty sentences. Stop joining provenance comments into the summary and stop listing seed ids on the page. |
| **DFV-03** | [data-flow-diagram-03-linked-service-icons.md](../../.cursor/prompts/data-flow-diagram-03-linked-service-icons.md) | Map `arm.externalLinkedServiceType` to the official icon. Non-Azure connectors use Resource Linked. Access connectors stay pictograms. Shipped in PR 4128. The live canvas still drops the type during repair. |
| **DFV-04** | [data-flow-diagram-04-paint-inferred-links.md](../../.cursor/prompts/data-flow-diagram-04-paint-inferred-links.md) | Paint `likely ·` linked-service edges on Data flow with the checkbox off. Hide `likely ·` and `applies` on other diagrams only when the resource groups differ. |
| **DFV-05** | [data-flow-diagram-05-keep-icon-fields.md](../../.cursor/prompts/data-flow-diagram-05-keep-icon-fields.md) | Copy `ExternalLinkedServiceType`, `ArmResourceKind`, and the other painter fields through `MermaidDiagramDeterministicRepairer` so forest layout still draws the DFV-03 icon. On `master`. |
| **DFV-06** | [data-flow-diagram-06-consumer-status.md](../../.cursor/prompts/data-flow-diagram-06-consumer-status.md) | Paint `Used by N` or `No consumer found` on storage and database cards. Do not paint Unknown. |
| **DFV-07** | [data-flow-diagram-07-type-captions.md](../../.cursor/prompts/data-flow-diagram-07-type-captions.md) | Paint a type line under every data-flow name, including Not staged cards. Function Apps are not App Services. |
| **DFV-08** | [data-flow-diagram-08-adf-card-identity.md](../../.cursor/prompts/data-flow-diagram-08-adf-card-identity.md) | Keep the linked-service name and add connector, factory, host, runtime, or `Host in Key Vault`. |
| **DFV-09** | [data-flow-diagram-09-mysql-host.md](../../.cursor/prompts/data-flow-diagram-09-mysql-host.md) | Read the MySQL host from `Server=` inside a connection string. Discard the rest. A Key Vault reference is not a guessed server. |
| **DFV-10** | [data-flow-diagram-10-network-hop-caption.md](../../.cursor/prompts/data-flow-diagram-10-network-hop-caption.md) | Paint the cited path on a firewall, NAT gateway, application gateway, or private endpoint, or `No cited path`. Leave VNets off Data flow. |
| **DFV-11** | [data-flow-diagram-11-persist-linked-service-identity.md](../../.cursor/prompts/data-flow-diagram-11-persist-linked-service-identity.md) | Store linked-service type, host, factory, runtime, and the Key Vault flag. Put them back on the graph node. Do not add inventory resources. |
| **DFV-12** | [data-flow-diagram-12-same-host-cards.md](../../.cursor/prompts/data-flow-diagram-12-same-host-cards.md) | One card per external host, with an edge from each factory. A host that matches a snapshot resource connects to that resource. |
| **DFV-13** | [data-flow-diagram-13-left-to-right-columns.md](../../.cursor/prompts/data-flow-diagram-13-left-to-right-columns.md) | Wrap a stage after 12 cards. Connected cards sit above `Not connected`. Edges still run left to right. |
| **DFV-18** | [data-flow-diagram-18-scroll-wide-canvas.md](../../.cursor/prompts/data-flow-diagram-18-scroll-wide-canvas.md) | Scroll a canvas that is wider than the frame. Fit in view still fits the whole picture. Zoom and Fit stay on the frame. |
| **DFV-14** | [data-flow-diagram-14-rollup-repeated-cards.md](../../.cursor/prompts/data-flow-diagram-14-rollup-repeated-cards.md) | More than three same-type, same-neighbor cards become one card. Click lists the members. PNG export lists them under the legend. |
| **DFV-19** | [data-flow-diagram-19-png-fallback-namespace.md](../../.cursor/prompts/data-flow-diagram-19-png-fallback-namespace.md) | Define the SVG namespace in the browser PNG fallback so Export PNG no longer throws `SVG_NS is not defined`. |
| **DFV-15** | [data-flow-diagram-15-app-and-config-evidence.md](../../.cursor/prompts/data-flow-diagram-15-app-and-config-evidence.md) | Collect Function App and App Service hosts. Label a file confirmation `From config`. Say `No evidence checked` when the snapshot never looked. |
| **DFV-16** | [data-flow-diagram-16-stage-summary.md](../../.cursor/prompts/data-flow-diagram-16-stage-summary.md) | One line above the columns counts each stage, including used and unused storage. |
| **DFV-17** | [data-flow-diagram-17-evidence-filters.md](../../.cursor/prompts/data-flow-diagram-17-evidence-filters.md) | Four checkboxes, on by default, hide Observed, App settings, From config, or Inferred edges. Cards stay. |

## Run order

**01–07 are on `master`.** Next: **11**, then **08**. **09** can run any time after 07. Then **12**, **13**, **18**, **14**, **19**, **15**, **10**, **16**, **17**. **18** is the viewer scroll after **13**. Look at that scrollbar before pasting **14**. **19** fixes the PNG fallback after **14**. Look at a downloaded PNG before pasting **15**. **10** can run any time after 07. Do not run two of these in one session.

## After PR 4128

A later look at the same snapshot still shows the blue compute pictogram on `azureblob`, `azuremysql1`, and the SFTP cards. `DiagramInventoryAzureIconResolver` reads `ExternalLinkedServiceType`, and the compiler sets it. `MermaidDiagramDeterministicRepairer` then builds a new node without that field or `ArmResourceKind`. Forest layout paints the repaired AST. The icon test renders the compiled node and never calls `Repair`, so it stays green. DFV-05 is that fix. Do not add icon files, and do not reopen the icon map. Access connectors, Fabric capacities, and Logic App API connections stay pictograms.

## After PR 4114

A second look at the same snapshot still showed no connectors. `DiagramCrossGroupFanOutCanvasExclusion.ShouldExclude` drops every `likely ·` or `applies` edge once both ends have a resource group. It does not compare the groups. External linked-service ids (`adf-external:{factoryArmId}|{name}`) parse to the factory's resource group, so those same-group edges are dropped too. DFV-04 is that fix. Do not reopen the router.

## Already true — do not redo

AZI-01 through AZI-04 are on `master`. Data Factory, Logic Apps, MySQL, storage accounts, firewalls, NAT gateways, and Event Hubs already resolve to official SVGs. Diagnostic settings are already excluded by `AzureInventoryDataFlowEvidenceCatalog` (`diagnosticToDestination`). These prompts must not put them back on the diagram.

## Stays a pictogram

The July 2026 zip has no icon for `Microsoft.Databricks/accessConnectors`, `Microsoft.Fabric/capacities`, or the ADF connector `AzureTableStorage`. Do not borrow the Databricks workspace icon or the storage-account icon for those.

## Not in DFV-06 through DFV-10

- A click-through resource panel. NR-12 already states Unknown questions in the outline. DFV-14 later lists rollup members in the existing card focus.
- A second zoom mode that hides cards. The column canvas stays. DFV-13 wraps a tall stage. DFV-18 scrolls that wider canvas. DFV-14 rolls up repeated cards.
- Pipeline and dataset cards. DFV-08 names the linked service and its factory. It does not add those nodes.
- Drawing VNets, subnets, NICs, or NSGs on Data flow. DFV-10 captions the hop that is already on the canvas.
- A new config-file collector inside DFV-09. DFV-09 parses a host the extractor already receives. DFV-15 reads Function App and App Service settings and labels an already-confirmed upload `From config`.

## Not in DFV-11 through DFV-17

- A second icon download, or an Azure product icon on an access connector or Fabric capacity.
- Hiding unconnected cards, or collapsing workspace tabs.
- Putting diagnostic, NIC, VNet, subnet, or NSG attachment edges on Data flow.
- Storing a connection string, password, account key, or secret name.
- Pipeline and dataset cards. ADF pipeline direction is already mapped.

## Do not pull into these sessions

- A second icon download, a GitHub mirror, or the 18×18 PNG pack
- Hiding unconnected resources, or collapsing workspace tabs
- Evidence-catalog exclusions, stage renames, or observed-traffic edges. DFV-15 may add the `From config` label. DFV-17 filters edges for one request and does not delete a catalog row.
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
