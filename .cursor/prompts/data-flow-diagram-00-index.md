<!-- Data flow diagram — Luna prompts. Paste one numbered file per session.
     Origin: 2026-09-30. SecureNow Diagrams, type "Data flow — what may connect",
     snapshot Hmd_HI_HAP_Non_Prod. The canvas counts relationships and then
     draws none. DFV-01 routed edges that reach the painter; the fan-out
     filter still removes inferred linked-service edges before that.
     The wiring disclosure repeats compiler comments. External linked
     services draw the blue compute pictogram.
     Do not implement from this index. -->

# Data flow diagram — Luna prompt set (DFV-01–DFV-04)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/data-flow-diagram-0N-*.md` file per GPT-5.6 Luna session.

Canonical wave doc: [`docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`](../../docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md).

**Base:** current `master` after Azure icon coverage (**AZI-01–AZI-04**). Data Factory, Logic Apps, MySQL, storage accounts, firewalls, NAT gateways, and Event Hubs already draw official marks. Do not redo that mapping.

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Relationships** | Outline says 39 visible relationships. Forest SVG drops an edge when `DiagramForestDataFlowEdgeRouter.TryRoute` returns null. Source → Ingestion skips the Application column, the sky-lane vertical runs through wider cards, and the connector is omitted. | Every placed data-flow relationship draws a gutter or sky-lane path that does not enter a third card. Shipped in PR 4114. | **DFV-01** |
| **Inferred links** | After PR 4114 the canvas is still empty. `likely ·` linked-service edges are removed by `DiagramCrossGroupFanOutCanvasExclusion` before routing. The filter never compares resource groups, and external cards inherit the factory's group from `adf-external:…/resourceGroups/{name}/…`. | Data flow draws those inferred links with **Show cross-group links** off. Other diagram types hide `likely ·` and `applies` only when the resource groups differ. | **DFV-04** |
| **Compiler comments** | `%% al-provenance=` / `%% al-inference=` lines are treated as honesty copy and joined into the always-visible "Declared pipeline wiring" summary. Expanding the section lists every `al-type` / `al-rg` / `al-seed` comment. | The page shows the short honesty sentences only. Mermaid export still carries the comments. | **DFV-02** |
| **Linked-service icons** | Unresolved ADF linked services are `TopologyResource` nodes. They draw the blue compute pictogram, including Azure Blob, Azure SQL, and Azure MySQL connectors. | A linked-service type that names an Azure product in the July 2026 zip draws that product icon. SFTP, HTTP, SAP, Oracle, Snowflake, and other non-Azure connectors draw the Resource Linked mark. Types with no file stay pictograms. | **DFV-03** |

## What this set does not change

Keep the evidence catalog. Do not put diagnostic settings, NIC, VNet, or private-endpoint attachment edges on Data Flow. Do not remove unconnected resources. Do not redo AZI-01–AZI-04. Do not borrow a Databricks workspace icon for access connectors, or a storage-account icon for Azure Table Storage. Do not download another icon pack.

## Run order

**01 is on `master` (PR 4114).** Next: **04 → owner look**. **02** and **03** do not depend on 04. Do not run two of these in one session.

Each implementation prompt ends **before commit**. The owner looks, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 01 | `data-flow-diagram-01-draw-relationships.md` | `dfv/01-draw-relationships` |
| 02 | `data-flow-diagram-02-hide-compiler-comments.md` | `dfv/02-hide-compiler-comments` |
| 03 | `data-flow-diagram-03-linked-service-icons.md` | `dfv/03-linked-service-icons` |
| 04 | `data-flow-diagram-04-paint-inferred-links.md` | `dfv/04-paint-inferred-links` |
