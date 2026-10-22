<!-- Data flow diagram — Luna prompts. Paste one numbered file per session.
     Origin: 2026-09-30. SecureNow Diagrams, type "Data flow — what may connect",
     snapshot Hmd_HI_HAP_Non_Prod. The canvas counts relationships and then
     draws none. DFV-01 routed edges that reach the painter; the fan-out
     filter still removes inferred linked-service edges before that.
     The wiring disclosure repeats compiler comments. External linked
     services draw the blue compute pictogram. DFV-03 mapped those icons,
     then diagram repair dropped the connector type before the forest
     canvas painted. DFV-05 puts that type back. DFV-06 through DFV-10
     make the painted cards readable: who uses a store, what a card is,
     which factory an ADF link belongs to, where a MySQL host lives,
     and what a network hop is for. A later look still shows generic
     source cards, few connectors, a tall top-to-bottom canvas, and
     long runs of the same card. DFV-11 through DFV-17 save the link
     identity, collapse a shared host, wrap the columns, scroll a
     canvas that is wider than the frame, roll up repeated cards, fix
     the PNG browser fallback, read app settings and uploaded config,
     summarize the stages, and filter edges by evidence.
     DFV-24 makes the existing rollup member list obvious. The list
     already opens on click. The card, the reading sentence, and the
     open heading do not say so.
     DFV-25 draws Routes through when firewallToSubnet already exists.
     The SecureNow ZIP never collected that row. DFV-26 collects it
     from the firewall private IP and the route-table next hop, and
     attaches a private-endpoint target and a Function App VNet
     integration to that subnet.
     Every workflow on Hmd_HI_HAP_Non_Prod is a stand-alone question.
     logic-app-connections.json is empty, and adf-dataflows.json lists
     data flows with empty source and sink arrays. DFV-27 collects
     those linked services and the workflow peers.
     Do not implement from this index. -->

# Data flow diagram — Luna prompt set (DFV-01–DFV-27)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/data-flow-diagram-*.md` file per GPT-5.6 Luna session.

Canonical wave doc: [`docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`](../../docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md).

**Base:** current `master` after Azure icon coverage (**AZI-01–AZI-04**). Data Factory, Logic Apps, MySQL, storage accounts, firewalls, NAT gateways, and Event Hubs already draw official marks. Do not redo that mapping.

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Relationships** | Outline says 39 visible relationships. Forest SVG drops an edge when `DiagramForestDataFlowEdgeRouter.TryRoute` returns null. Source → Ingestion skips the Application column, the sky-lane vertical runs through wider cards, and the connector is omitted. | Every placed data-flow relationship draws a gutter or sky-lane path that does not enter a third card. Shipped in PR 4114. | **DFV-01** |
| **Inferred links** | After PR 4114 the canvas is still empty. `likely ·` linked-service edges are removed by `DiagramCrossGroupFanOutCanvasExclusion` before routing. The filter never compares resource groups, and external cards inherit the factory's group from `adf-external:…/resourceGroups/{name}/…`. | Data flow draws those inferred links with **Show cross-group links** off. Other diagram types hide `likely ·` and `applies` only when the resource groups differ. | **DFV-04** |
| **Compiler comments** | `%% al-provenance=` / `%% al-inference=` lines are treated as honesty copy and joined into the always-visible "Declared pipeline wiring" summary. Expanding the section lists every `al-type` / `al-rg` / `al-seed` comment. | The page shows the short honesty sentences only. Mermaid export still carries the comments. | **DFV-02** |
| **Linked-service icons** | Unresolved ADF linked services are `TopologyResource` nodes. They draw the blue compute pictogram, including Azure Blob, Azure SQL, and Azure MySQL connectors. | A linked-service type that names an Azure product in the July 2026 zip draws that product icon. SFTP, HTTP, SAP, Oracle, Snowflake, and other non-Azure connectors draw the Resource Linked mark. Types with no file stay pictograms. Shipped in PR 4128. The live canvas still drops the type during repair. | **DFV-03** |
| **Repair keeps the icon** | `MermaidDiagramDeterministicRepairer` rebuilds each node without `ExternalLinkedServiceType` or `ArmResourceKind`. Forest layout paints that repaired AST, so Blob, MySQL, and SFTP cards stay the blue compute pictogram, and a Function App resolves as App Services. | The repaired node still carries the connector type, the resource kind, and the other fields the painter already reads. On `master`. | **DFV-05** |
| **Consumer status** | Storage and database cards with no connector look the same as cards nobody checked. `ConnectionState` falls through to Unknown and the forest card paints only the name. | A data store says `Used by N` or `No consumer found`. The word Unknown stays off the card. | **DFV-06** |
| **Type captions** | Friendly types exist and are not painted. Logic App connections, access connectors, Fabric capacity, and Function Apps are names only. | Data flow paints a type line under every name. Not staged cards keep that line. | **DFV-07** |
| **ADF identity** | The external-node hydrator labels a linked service with its name and drops type, host, and factory. | The card keeps the name and adds the connector, factory, host, or `Host in Key Vault`. | **DFV-08** |
| **MySQL host** | `AzureMySql` reads `server` only. A host inside `connectionString`, or a Key Vault reference, never resolves. | The parser takes the host from `Server=` and discards the rest. A Key Vault reference is labeled, not guessed. | **DFV-09** |
| **Network hop caption** | Firewalls, NAT gateways, and application gateways sit in Application with the subnet edges filtered off. | The hop card shows the cited path it already has, or `No cited path`. VNets and subnets stay off Data flow. | **DFV-10** |
| **Link identity saved** | The linked-service type and host exist only while the capture is materialized. The graph rebuilds each external card with a null type and a null host, so it stays a generic topology card. | A new capture stores type, host, factory, runtime, and the Key Vault flag, and the graph node gets them back. Resource count stays the same. | **DFV-11** |
| **One card per host** | The same SFTP or HTTP host is one card per factory. A saved host that names a snapshot resource still sits on an external card. | One card per external host, with an edge from each factory. A matching host connects to the storage account or database and the extra card is gone. | **DFV-12** |
| **Left to right** | Each stage is one tall stack, so the canvas reads top to bottom. | A stage wider than 12 cards wraps into sub-columns. Connected cards sit above a `Not connected` group. Edges still leave on the right and enter on the left. | **DFV-13** |
| **Wide canvas** | After the wrap, the picture is wider than the frame. The camera scrolls vertically. The ink clip cuts off the right-hand stages, so there is no horizontal scrollbar. | The same camera scrolls left and right when the picture is wider than the frame. Fit in view still fits the whole picture. Zoom and Fit stay on the frame. | **DFV-18** |
| **Repeated cards** | Dozens of storage accounts with the same connections are dozens of cards. | More than three same-type, same-neighbor cards become one card. Click lists the members. PNG export lists them under the legend. | **DFV-14** |
| **PNG fallback** | After the rollup, Export PNG reports `SVG_NS is not defined` when the server rasterizer is unavailable. | The browser fallback defines the SVG namespace, downloads the PNG, and still lists rollup members. | **DFV-19** |
| **App and config evidence** | App-setting collection reads Container Apps only. A confirmed upload is labelled `Confirmed connection`. Every lonely store says `No consumer found`. | Function Apps and App Services contribute host edges. A file confirmation says `From config`. A snapshot with no such evidence says `No evidence checked`. | **DFV-15** |
| **Stage summary** | The reviewer counts the columns by eye. | One line above the stages gives the counts, including how many storage cards are used. | **DFV-16** |
| **Evidence filters** | Declared, guessed, and confirmed edges are one picture. | Four checkboxes, on by default, hide Observed, App settings, From config, or Inferred edges. Cards stay. | **DFV-17** |
| **Reading a card** | The words on a card do not say which line is the name, the type, or a status. | Composer only. One sentence under the data-flow caption explains those lines. The SVG is unchanged. | **DFV-20** |
| **Source type rollup** | After one card per host, Source can still be a stack of one connector type with different neighbors. | Hold until DFV-12 is on `master` and Source is still hard to read. Source rolls up more than three cards of one type even when neighbors differ. Other stages keep DFV-14. | **DFV-21** |
| **Collect direction** | A static dataset name with parameters is dropped, so the package has linked services and no Reads from or Writes to. | Keep that dataset name. Also read source, sink, and dataset slots on `typeProperties`. Re-collect after this ships. | **DFV-22** |
| **Paint direction** | The canvas says direction was not in the package whenever directional edges are missing. | **Reads from** and **Writes to** when those edges exist. Keep the re-collect sentence only when they do not. | **DFV-23** |
| **Rollup list invitation** | A count card such as `6 storage accounts` opens the member list, and the only mark is a 10px `[1]`. **Reading a card** never says that. The open heading says `Showing connections for`. | Composer only. The card says `Click to list the 6`. **Reading a card** says a count opens the list and a second click closes it. The open heading is the count. Members stay. | **DFV-24** |
| **Firewall downstream** | `fw_hi_nprd_wwd` sits in Application with no line. `firewallToSubnet` is excluded, so the subnet hop never paints. | One **Routes through** line from the firewall to each Application or Ingestion card on that subnet. The subnet stays off the canvas. Shipped in PR 4319. The current ZIP still has no `firewallToSubnet` row. | **DFV-25** |
| **Firewall routed subnets** | DFV-25 is on `master` and the firewall card still has no line. The package has `publicIpToNic` for `fw_hi_nprd_wvd` and `subnetToRouteTable` for `rt_hi_nprd_wvd`, and no firewall private IP or route next hop. Factory cards are private-endpoint targets. Function Apps have no `appServiceToSubnet` row. | The package emits `firewallToSubnet` for each subnet whose user route sends `VirtualAppliance` traffic to that firewall. A private-endpoint target and a Function App on that subnet become the **Routes through** ends. The subnet stays off the canvas. | **DFV-26** |
| **Data-flow sources and workflow peers** | Every workflow is a stand-alone question. `logic-app-connections.json` is empty. `adf-dataflows.json` lists the data flows with `Succeeded` and empty source and sink arrays. | The package records each data flow's linked services, expands `ExecuteDataFlow` into `Read` and `Write`, and records a Logic App row when the workflow names an API connection or an allowed Azure resource. | **DFV-27** |

## What this set does not change

Keep the evidence catalog's exclusions. Do not put diagnostic settings, NIC, VNet, or private-endpoint attachment edges on Data Flow. Do not remove unconnected resources. Do not redo AZI-01–AZI-04 or DFV-05. Do not borrow a Databricks workspace icon for access connectors, or a storage-account icon for Azure Table Storage. Do not download another icon pack. Do not add a click-through detail panel or a second diagram mode in DFV-06 through DFV-10. DFV-14 lists members in the existing card focus and in the PNG. DFV-17 adds checkboxes on the data-flow toolbar. Neither one hides a workspace tab. NR-12 already explains Unknown in the outline.

## Run order

**01–07, 13, 14, 18, 19, and 25 are on `master`.** DFV-25 draws the line only when `firewallToSubnet` is already in the package. The current ZIP has no such row, so the firewall card stays unconnected until the owner re-collects after **26**. Next, one session: **27**. Collect data-flow linked services and Logic App peers. Every workflow is stand-alone, `logic-app-connections.json` is empty, and `adf-dataflows.json` lists data flows with empty source and sink arrays. **26** stays a separate session for the firewall line. NAT gateways and the load balancer wait. **23** still paints **Reads from** and **Writes to** when those factory edges need labels. **21** stays unpasted until **12** has shipped and Source is still hard to read. Do not run two of these in one session.

Each implementation prompt ends **before commit**. The owner looks, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 01 | `data-flow-diagram-01-draw-relationships.md` | `dfv/01-draw-relationships` |
| 02 | `data-flow-diagram-02-hide-compiler-comments.md` | `dfv/02-hide-compiler-comments` |
| 03 | `data-flow-diagram-03-linked-service-icons.md` | `dfv/03-linked-service-icons` |
| 04 | `data-flow-diagram-04-paint-inferred-links.md` | `dfv/04-paint-inferred-links` |
| 05 | `data-flow-diagram-05-keep-icon-fields.md` | `dfv/05-keep-icon-fields` |
| 06 | `data-flow-diagram-06-consumer-status.md` | `dfv/06-consumer-status` |
| 07 | `data-flow-diagram-07-type-captions.md` | `dfv/07-type-captions` |
| 08 | `data-flow-diagram-08-adf-card-identity.md` | `dfv/08-adf-card-identity` |
| 09 | `data-flow-diagram-09-mysql-host.md` | `dfv/09-mysql-host` |
| 10 | `data-flow-diagram-10-network-hop-caption.md` | `dfv/10-network-hop-caption` |
| 11 | `data-flow-diagram-11-persist-linked-service-identity.md` | `dfv/11-persist-linked-service-identity` |
| 12 | `data-flow-diagram-12-same-host-cards.md` | `dfv/12-same-host-cards` |
| 13 | `data-flow-diagram-13-left-to-right-columns.md` | `dfv/13-left-to-right-columns` |
| 18 | `data-flow-diagram-18-scroll-wide-canvas.md` | `dfv/18-scroll-wide-canvas` |
| 14 | `data-flow-diagram-14-rollup-repeated-cards.md` | `dfv/14-rollup-repeated-cards` |
| 19 | `data-flow-diagram-19-png-fallback-namespace.md` | `dfv/19-png-fallback-namespace` |
| 15 | `data-flow-diagram-15-app-and-config-evidence.md` | `dfv/15-app-and-config-evidence` |
| 16 | `data-flow-diagram-16-stage-summary.md` | `dfv/16-stage-summary` |
| 17 | `data-flow-diagram-17-evidence-filters.md` | `dfv/17-evidence-filters` |
| 20 | `data-flow-diagram-20-reading-the-cards.md` | `dfv/20-reading-the-cards` |
| 21 | `data-flow-diagram-21-source-type-rollup.md` | `dfv/21-source-type-rollup` |
| 22 | `data-flow-diagram-22-collect-pipeline-direction.md` | `dfv/22-collect-pipeline-direction` |
| 23 | `data-flow-diagram-23-paint-pipeline-direction.md` | `dfv/23-paint-pipeline-direction` |
| 24 | `data-flow-diagram-24-rollup-list-invitation.md` | `dfv/24-rollup-list-invitation` |
| 25 | `data-flow-diagram-25-firewall-downstream.md` | `dfv/25-firewall-downstream` |
| 26 | `data-flow-diagram-26-firewall-routed-subnets.md` | `dfv/26-firewall-routed-subnets` |
| 27 | `data-flow-diagram-27-adf-workflow-collection.md` | `dfv/27-adf-workflow-collection` |
