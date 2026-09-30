> **Scope:** Paste-ready GPT-5.6 Luna prompts. Draw the data-flow relationships the page already counts, stop showing compiler comments in Declared pipeline wiring, and replace the blue compute pictogram on external linked services with the official icon. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/data-flow-diagram-00-index.md`](../../.cursor/prompts/data-flow-diagram-00-index.md) through [`.cursor/prompts/data-flow-diagram-03-linked-service-icons.md`](../../.cursor/prompts/data-flow-diagram-03-linked-service-icons.md)

# Data flow diagram — Luna prompts

**Created:** 2026-09-30 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

Observed on SecureNow **Diagrams**, diagram type **Data flow — what may connect**, snapshot `Hmd_HI_HAP_Non_Prod` · 2026-09-29 13:33 UTC. The page reported **127 resources in 88 connected components. 39 visible relationships.** The canvas showed the cards and no connectors. **Declared pipeline wiring** repeated `al-provenance=ObservedFact al-inference=inventory-adf-linked-service-inferred` and then listed every node's `al-type` / `al-seed` comment. External linked services (`azureblob`, `azuremysql1`, `sftp_ahcccs`, `nucc_http`) used the blue compute pictogram.

| ID | Prompt | Intent |
|----|--------|--------|
| **DFV-01** | [data-flow-diagram-01-draw-relationships.md](../../.cursor/prompts/data-flow-diagram-01-draw-relationships.md) | Draw every counted relationship. The sky-lane vertical currently runs through wider cards, `TryRoute` returns null, and the SVG drops the edge. |
| **DFV-02** | [data-flow-diagram-02-hide-compiler-comments.md](../../.cursor/prompts/data-flow-diagram-02-hide-compiler-comments.md) | Keep the honesty sentences. Stop joining provenance comments into the summary and stop listing seed ids on the page. |
| **DFV-03** | [data-flow-diagram-03-linked-service-icons.md](../../.cursor/prompts/data-flow-diagram-03-linked-service-icons.md) | Map `arm.externalLinkedServiceType` to the official icon. Non-Azure connectors use Resource Linked. Access connectors stay pictograms. |

## Run order

**01 → owner look → 02 → owner look → 03.** Each later prompt starts from the accepted branch of the previous one only when that branch changed files the next prompt reads. DFV-02 does not depend on DFV-01. Do not run two of these in one session.

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
