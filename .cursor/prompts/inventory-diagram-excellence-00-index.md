<!-- Inventory-diagram excellence — Composer prompts.
     Origin: 2026-09-21 owner Full subscription forest after Visio-style
     resource-group frames + hop-lift / maximize-edges. Owner asked for
     further improvement (capture, algorithms, packing, honesty) and then
     for a prompt set covering every diagram type. Do not implement from
     this index. -->

# Inventory-diagram excellence — Composer prompt set (IDX-01–IDX-13 + hold)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams are an all-day SecureNow tool. Visio-style **resource-group frames** and **hidden NIC/PE hop lift** made the Full subscription canvas readable. It is still not excellent: capture drops nested ARM ids, same-RG collocation invents all-to-all chords, verbs collapse to `connects`, nested Azure boxes never draw, singleton-RG tails dominate, private endpoints have no workbench opt-in, and neighborhood / selected / data-flow canvases do not share the same honesty rules.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-excellence-NN-*.md` file per Composer / Cloud Agent session.

Canonical wave doc (diagnosis + copy-below): [`docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_EXCELLENCE_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_EXCELLENCE_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

**Do not re-run IDL, IDS, IDT, IDH, IDG, IDR, IDA, IDF, IDP, IE-ND, IE-ID, IE-DD, IE-RF, AX-DE, AX-DC, SN-DF, SN-PE, SN-RT** as greenfield inside an IDX session. Extend the existing collector family, `DiagramAstFromGraphCompiler`, inventory-forest, Export Mermaid, and Graphviz PNG. Nested VNet/subnet and subscription frames are **authorized here** as **IDX-05 / IDX-06**. They stay forbidden from **IDA / IDF** chats.

## Locked diagnosis (do not re-diagnose)

Owner snapshot `Hmd_HL_HAP_Non_Prod` (captured 2026-09-19): **424** inventory resources, Full subscription canvas **~247** visible nodes. Live engine: **inventory-forest**. After RG-first packing and hop lift, humans can read groups, but:

1. **Capture still drops the ids that would draw edges.** NIC `ipConfigurations[].subnet.id`, PE subnet/target, Standard Logic App `$connections.value`, App Service `kind`, ADF linked-service ARM ids, and diagnostic workspace ids are often empty on hosted `/resources` list rows. Algorithms cannot invent those hops.
2. **Compose happens too late and too narrowly.** `DiagramCollapsedAttachmentEdgeLifter` runs after mode filters. DataFlow / DataArchitecture skip it. Graph-build still stores VM→NIC and PE→NIC instead of a shared visible projection used by every `DiagramMode`.
3. **Same-RG collocation and single-VNet placement create all-to-all.** A Logic App with five `Microsoft.Web/connections` in the same group becomes a clique. Cross-RG isolates stay isolates unless a cited hop exists. That is honest only as a last resort, and the label must stay `likely · in`.
4. **Verbs are flattened.** `CONTAINS`, `PEERS_WITH`, `APPLIES_TO`, `CAN_READ` often render as `connects` or `likely · in`. Humans cannot tell peering from placement from identity.
5. **Nested Azure boxes were IDA-HOLD / IDF-HOLD.** Network mode already wanted subnet subgraphs (**IE-ND-04**). Identity/Data canvases still need the same packer when those node types survive the mode filter — skip empty nest, do not invent VNets.
6. **Layout leftovers.** Role-blind grids inside an RG; a long tail of singleton-RG frames; duplicate Office365 connection cards; no PE toggle even though `IncludePrivateEndpointNodes` exists; completeness is a generic banner; neighborhood still feels like a cropped subscription.

**Signature (fail this wave if still true after IDX-01–13):** Full subscription walkthrough still reports near-1:1 nodes-to-components with a handful of edges while NIC/PE/Logic App files exist; any mode draws a complete graph inside an RG without cited hops; PE cards appear without the opt-in; Identity/DataFlow ignore the shared hop composer; nested VNet/subnet frames exist only in Network mermaid.

## All `DiagramMode` contract (every prompt)

Every IDX prompt applies to **all** values of `ArchLucid.ArtifactSynthesis.Models.DiagramMode`. If a change is graph-build or collection, it automatically feeds every mode. If a change is layout/UI, compile **each** mode (or a fixture per mode) and skip only when the mode’s node filter leaves nothing to draw.

| `DiagramMode` | Workbench key | Node filter today | Shared rule for this wave |
|---------------|---------------|-------------------|---------------------------|
| `Executive` | `executive` | Always-show peel + VNets; NICs hidden; PE hidden unless opt-in | Subscription outer + RG frames; nest VNets that remain; verbs on peering; completeness on peeled-away classes |
| `Architecture` | add parser key `architecture` if missing | Compute + network + storage | Same hop composer / verbs / nested frames for surviving nodes |
| `Network` | `network` | `Microsoft.Network/*` + attached VMs | Hero for nested VNet→subnet; PE still hidden default; do not show NIC cards |
| `Security` | add parser key `security` if missing | Security nodes; NICs hidden | `applies` / `protects`; **no** Full-subscription-scale RBAC clique |
| `Identity` | `identity` | Identity category | Shared composer; skip VNet nest when no network nodes; federated/member verbs |
| `Data` | `data` | Data + storage | PE hops still place accounts `in` VNets; no stage swimlanes |
| `DataFlow` | `dataFlow` | Movement stages (ADF / apps) | **Keep stage subgraphs.** Also apply cited hops, verbs, PE opt-in, completeness. Do **not** replace stages with RG-first packing. Nest VNet only when a stage node is ARM-located in one |
| `DataArchitecture` | `dataArchitecture` | Repository type groups | Keep type-group subgraphs. Same hop/verb/completeness rules. No RG-first replacement |
| `FullSubscription` | `full` | Almost all topology; NeverShow NIC/PE | Hero for singleton-RG collapse, completeness strip, Visio RG frames already in play |
| `ResourceGroup` | `resourceGroup:{name}` | One RG | Nested VNet/subnet inside that RG; **no** subscription outer; **no** collapse of *other* RGs |
| `SelectedResources` | add parser key if missing | Explicit node ids | Cited hops among the selection + attachments needed to explain them; no whole-sub packing |
| `DependencyNeighborhood` | `dependencyNeighborhood` | BFS from seed, default depth 2 | Hop-focus: include hidden NIC/PE *analysis* but not cards; do not paint the rest of the subscription |

**Surfaces in scope for every mode:** live **inventory-forest** SVG, **Export Mermaid**, **Graphviz PNG**. When DataFlow/DataArchitecture use different subgraph planners, still keep label verbs, PE toggle, completeness, and hop compose.

**Parse gaps:** `InfraEvidenceMermaidModeParser` today documents `executive, network, identity, data, dataFlow, dataArchitecture, full, resourceGroup, dependencyNeighborhood`. IDX-10 / IDX-12 may add `architecture`, `security`, and `selectedResources` keys so those enum values are reachable from the workbench. Do not drop existing keys.

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Capture** | Empty nested ARM ids on hosted list rows | Persist NIC/PE/subnet/Logic App/app-settings/ADF/diagnostics relationship properties | IDX-01 |
| **Compose** | Mode-local lift after filters | Snapshot visible-projection compose + `(from,to,role)` dedupe before every mode | IDX-02 |
| **Honesty** | Same-RG all-to-all / single-VNet fan-out | Cited hop or explicit `likely · in` last resort; no cross-RG without a hop | IDX-03 |
| **Verbs** | Generic `connects` | `in` / `contains` / `peering` / `uses` / `reads` / `applies` / `may access` | IDX-04 |
| **Nest** | RG frames only | VNet → subnet frames when those nodes exist | IDX-05 |
| **Subscription** | No outer box | Subscription frame on subscription-scoped modes | IDX-06 |
| **Pack** | Role-blind grid inside RG | Role columns + hub placement | IDX-07 |
| **Tail** | One frame per singleton RG | Collapsed “other resource groups” with expand | IDX-08 |
| **Dupes** | One card per `Microsoft.Web/connections` | Collapse same-API connections; keep cited hops | IDX-09 |
| **PE UI** | Compile flag, no control | Opt-in toggle on every inventory diagram workbench, default off | IDX-10 |
| **Completeness** | Generic banner | Mode-aware strip: collected vs missing relationship classes | IDX-11 |
| **Focus** | Neighborhood feels like a crop | Hop-focus compile for neighborhood / selected / RG | IDX-12 |
| **Ratchet** | Full-sub-only tests | All 12 modes × forest / Mermaid / PNG | IDX-13 |

## What this set does *not* change

Keep: inventory-forest as the live canvas. Visio RG-first packing (including singleton named frames) if already on trunk. `IncludePrivateEndpointNodes` default **false**. IDA palette/cards/elbows/legend. IDP declared dash `4 3`. IDF 2 px solid RG stroke. Export Mermaid topology. One Azure collector family.

Do **not** draw a complete graph to “maximize edges.” Do **not** show NIC or PE cards unless the PE toggle is on (NICs stay hidden even then unless a later owner prompt says otherwise). Do **not** ship Microsoft Azure product icons. Do **not** dump RBAC `HAS_ROLE` / `MAY_ACCESS` onto Full subscription. Do **not** retune Mermaid `nodeSpacing`. Do **not** default Graphviz `dot`. Do **not** merge disconnected components solely so one RG is a single island.

## Run order

**01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13.**

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IDX-01** Recapture relationship properties | **Shipped** on trunk — do not greenfield | Existing extractor family (do not re-run AX-DE as greenfield) |
| **IDX-02** Graph-build hop compose + dedupe | **Shipped** on trunk — do not greenfield | Shared visible projection |
| **IDX-03** Cited hops, no all-to-all | **Shipped** on trunk — do not greenfield | Composer exists so collocation can be demoted |
| **IDX-04** Honest verbs | **Shipped** on trunk — do not greenfield | Closed verb catalog + humanizer |
| **IDX-05** Nested VNet → subnet frames | **Shipped** on trunk — extend only | VNet/subnet forest frames + membership fallback |
| **IDX-05b** Nested subnet excellence ratchet | **Shipped** on trunk — extend only | Network/peeled-subnet compile tests outside excellence filter |
| **IDX-06** Subscription outer frame | **Shipped** on trunk — do not greenfield | `sub-frame` on subscription-scoped modes |
| **IDX-07** Role-aware packing + hubs | **Shipped** on trunk — extend only | Role columns + hub-spoke in forest packer |
| **IDX-07b** Data Flow in-stage hub | **Shipped** on trunk — extend only | Hub inside a Data Flow stage; stages stay left-to-right |
| **IDX-07c** Rollup must not erase that hub | **Shipped** on trunk — extend only | Same-type sinks in a hub component stay separate cards |
| **IDX-07d** Route edges into that hub | **Shipped** on trunk — extend only | Cross-stage edge into a hub must not throw or cross spokes |
| **IDX-07e** Subcolumn keeps hub component whole | **Shipped** on trunk — extend only | `Take(12)` splits hub stars across subcolumns |
| **IDX-07f** Data Flow hub pipeline ratchet | **Shipped** on trunk — extend only | Forest hub pipeline under `InventoryDiagramExcellence` filter |
| **IDX-08** Singleton-RG collapse | **Shipped** on trunk — do not greenfield | Tail rollup when ≥8 isolated singleton RGs |
| **IDX-08b** Singleton-RG tail excellence ratchet | **Shipped** on trunk — extend only | IDX-08 planner not under `InventoryDiagramExcellence` filter |
| **IDX-08c** Collapsed singleton tail label excellence ratchet | **Shipped** on trunk — extend only | Tail label helpers not under `InventoryDiagramExcellence` filter |
| **IDX-09** Duplicate connection collapse | **Shipped** on trunk — do not greenfield | `DiagramInventoryConnectionRollupApplier` |
| **IDX-09b** Duplicate connection excellence ratchet | **Shipped** on trunk — extend only | Connection rollup not under `InventoryDiagramExcellence` filter |
| **IDX-10** PE opt-in toggle | **Shipped** on trunk — extend only | Workbench toggle; default off all modes incl. `ResourceGroup` |
| **IDX-10b** PE opt-in excellence ratchet | **Shipped** on trunk — extend only | Data canvases + Mermaid export PE gaps outside dedicated excellence tests |
| **IDX-11** Completeness strip | **Shipped** on trunk — extend only | Mode-aware `CompletenessSummary` + banner |
| **IDX-11b** Completeness excellence ratchet | **Shipped** on trunk — extend only | Completeness builder not under `InventoryDiagramExcellence` filter |
| **IDX-12** Hop-focus neighborhood / selected / RG | **Shipped** on trunk — extend only | Cited-hop BFS + hidden transit bridge |
| **IDX-12b** Hop-focus excellence ratchet | **Shipped** on trunk — extend only | IDX-12 compile tests outside `InventoryDiagramExcellence` filter |
| **IDX-13** Cross-mode parity ratchet | **Shipped** on trunk — extend only | `FullyQualifiedName~InventoryDiagramExcellence` |
| **IDX-13b** Fat-graph forest / DOT parity | **Shipped** on trunk — extend only | `BuildFatGraph()` + `AssertForestAndDotNestedFrameParity` |
| **IDX-13c** Data Flow hub Mermaid ratchet | **Shipped** on trunk — extend only | Mermaid export on hub fixture under excellence filter |
| **IDX-13d** Data Flow hub DOT ratchet | **Shipped** on trunk — extend only | Graphviz DOT on hub fixture; stage clusters for Data Flow |
| **IDX-13e** Data Flow hub graph-compile ratchet | **Shipped** on trunk — extend only | `Compile(snapshot, DataFlow)` on hub graph fixture under excellence filter |
| **IDX-13f** Data Flow hub service Mermaid ratchet | **Shipped** on trunk — extend only | `TryGetMermaidAsync` dataFlow on hub graph fixture |
| **IDX-13g** Data Flow hub compile forest routing | **Shipped** on trunk — extend only | Compile ratchet missing cross-stage route vs spoke cards |
| **IDX-13h** Data Flow hub service forest layout | **Shipped** on trunk — extend only | Service Mermaid ratchet does not guard inventory-forest `LayoutSvg` hub marker |
| **IDX-13i** Data Flow hub service forest routing | **Shipped** on trunk — extend only | Service `LayoutSvg` missing cross-stage route vs spoke cards |
| **IDX-13j** Data Flow hub service PNG DOT ratchet | **Shipped** on trunk — extend only | `TryExportPngAsync` Graphviz DOT on hub graph unguarded |
| **IDX-13k** Data Flow hub hand Ingestion label | **Shipped** on trunk — extend only | Hand AST second stage still labeled `Transform` vs compile `Ingestion` |
| **IDX-13l** Data Flow hub Mermaid stage labels | **Shipped** on trunk — extend only | Hub Mermaid ratchets skip `Source` / `Ingestion` swimlane copy |
| **IDX-13m** Data Flow hub forest stage labels | **Shipped** on trunk — extend only | Forest `LayoutSvg` missing `data-flow-stage-label` headers on hub pipeline |
| **IDX-13n** Data Flow hub compile stage labels | **Shipped** on trunk — extend only | Graph-compile ratchet skips Mermaid/forest stage copy |
| **IDX-13o** Data Flow hub PNG layout stage labels | **Shipped** on trunk — extend only | PNG export ratchet skips forest stage headers on `LayoutSvg` |
| **IDX-13p** Data Flow hub PNG Mermaid stage labels | **Shipped** on trunk — extend only | PNG export ratchet skips Mermaid stage copy on paired render |
| **IDX-13q** Data Flow hub export stage label bundle | **Shipped** on trunk — extend only | Hub ratchets call Mermaid/forest stage helpers separately |
| **IDX-13r** Data Flow hub stage label dedupe | **Shipped** on trunk — extend only | Hand Mermaid/forest ratchets duplicate 13q paired stage asserts |
| **IDX-13s** Data Flow hub service test factory | **Shipped** on trunk — extend only | Application hub Mermaid/PNG tests duplicate service wiring |
| **IDX-13t** Data Flow hub pipeline trait guard | **Shipped** on trunk — extend only | Hub ratchets lack unified `DataFlowHubPipeline` filter across test projects |
| **IDX-13u** Data Flow hub pipeline wave manifest | **Shipped** on trunk — extend only | Hub sub-wave ratchet classes can be deleted without CI failure |
| **IDX-13v** Cross-mode excellence wave manifest | **Shipped** on trunk — extend only | Cross-mode ratchet classes (08b–13, completeness) can be deleted without CI failure |
| **IDX-13w** Cross-mode trait isolation guard | **Shipped** on trunk — extend only | Cross-mode ratchets tagged `DataFlowHubPipeline` shrink the hub slice filter |
| **IDX-13x** Workbench excellence ratchet (Vitest) | **Shipped** on trunk — extend only | PE default + completeness `missingClasses` not under backend excellence filter |
| **IDX-13y** Fat-graph forest / DOT parity ratchet | **Shipped** on trunk — extend only | IDX-13b hero modes lack named `BuildFatGraph()` forest/DOT parity class |
| **IDX-13z** Cross-mode UI wave manifest (Vitest) | **Shipped** on trunk — extend only | Workbench excellence ratchet tests deletable without CI failure |
| **IDX-14a** Cross-mode excellence wave closeout | **Shipped** on trunk — extend only | Index lacks cross-mode (08b–13z) complete subsection + Vitest guard |
| **IDX-14b** Subnet nested-frame deepening closeout | **Shipped** on trunk — extend only | Index lacks IDX-05b complete subsection + Vitest guard |
| **IDX-14c** Singleton-RG tail deepening closeout | **Shipped** on trunk — extend only | Index lacks IDX-08b–08c complete subsection + Vitest guard |
| **IDX-14d** Duplicate connection deepening closeout | **Shipped** on trunk — extend only | Index lacks IDX-09b complete subsection + Vitest guard |
| **IDX-14e** Private endpoint opt-in deepening closeout | **Shipped** on trunk — extend only | Index lacks IDX-10b complete subsection + Vitest guard |
| **IDX-14f** Completeness summary deepening closeout | **Shipped** on trunk — extend only | Index lacks IDX-11b complete subsection + Vitest guard |
| **IDX-14g** Hop-focus deepening closeout | **Shipped** on trunk — extend only | Index lacks IDX-12b complete subsection + Vitest guard |
| **IDX-14h** Deepening excellence wave closeout | **Shipped** on trunk — extend only | Index lacks IDX-05b–12b umbrella subsection + Vitest guard |
| **IDX-14i** Excellence index closeout wave closeout | **Shipped** on trunk — extend only | Index lacks IDX-14a–14h capstone subsection + Vitest guard |
| **IDX-14j** Closeout wave UI manifest (Vitest) | **Shipped** on trunk — extend only | Closeout Vitest files deletable without CI failure |
| **IDX-14k** Closeout capstone index sync (Vitest) | **Shipped** on trunk — extend only | Capstone heading/Vitest still stop at 14h after 14j |
| **IDX-14l** Closeout capstone 14k heading sync (Vitest) | **Shipped** on trunk — extend only | Capstone heading still titles 14a–14j after 14k ships |
| **IDX-14m** Closeout capstone 14l heading sync (Vitest) | **Shipped** on trunk — extend only | Capstone heading still titles 14a–14k after 14l ships |
| **IDX-14n** Closeout capstone 14m heading sync (Vitest) | **Shipped** on trunk — extend only | Capstone heading still titles 14a–14l after 14m ships |
| **IDX-14o** Closeout capstone 14n heading sync (Vitest) | **Shipped** on trunk — extend only | Capstone heading still titles 14a–14m after 14n ships |
| **IDX-14p** Closeout capstone 14o heading sync (Vitest) | **Shipped** on trunk — extend only | Capstone heading still titles 14a–14n after 14o ships |
| **IDX-14q** Closeout capstone 14p heading sync (Vitest) | **Shipped** on trunk — extend only | Capstone heading still titles 14a–14o after 14p ships |
| **IDX-14r** Closeout capstone 14q heading sync (Vitest) | **Shipped** on trunk — extend only | Capstone heading still titles 14a–14p after 14q ships |
| **IDX-14s** Closeout capstone 14r heading sync (Vitest) | **Shipped** on trunk — extend only | Capstone heading still titles 14a–14q after 14r ships |
| **IDX-14t** Closeout capstone 14s heading sync (Vitest) | **Shipped** on trunk — extend only | Capstone heading still titles 14a–14r after 14s ships |
| **IDX-HOLD** | Not implementation | — |

### Data Flow hub pipeline wave (IDX-07f–13u) — complete

Forest, Mermaid, DOT, graph compile, snapshot Mermaid service, PNG export, stage labels, trait filter, and manifest guards are covered. Run the hub slice:

`dotnet test ArchLucid.ArtifactSynthesis.Tests --filter InventoryDiagramExcellence=DataFlowHubPipeline`

`dotnet test ArchLucid.Application.Tests --filter InventoryDiagramExcellence=DataFlowHubPipeline`

Next hub work is **extend-only** (regression fixes).

### Subnet nested-frame deepening (IDX-05b) — complete

Network dual-subnet compile (`subnet-frame` layers, VM→subnet placement, forest↔DOT parity) and peeled-subnet Full subscription VNet placement are excellence-ratcheted. Run the subnet slice:

`dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramExcellenceNestedSubnetNetworkCompileRatchet`

`dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramExcellencePeeledSubnetVnetFrameRatchet`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-subnet-wave-closeout`

Next **IDX-05** work is **extend-only** (regression fixes when a mode keeps subnet nodes visible).

### Singleton-RG tail deepening (IDX-08b–08c) — complete

Forest tail collapse, hop-focus skip rules, cited cross-RG singleton visibility, neighborhood tile summary copy, and collapsed-tail label parsing are excellence-ratcheted. Run the singleton-tail slice:

`dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramExcellenceSingletonTail`

`dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramExcellenceCollapsedSingletonTailLabelsRatchet`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-singleton-tail-wave-closeout`

Next **IDX-08** work is **extend-only** (regression fixes on subscription-scoped tail rollup).

### Duplicate connection deepening (IDX-09b) — complete

Logic App connector rollup, distinct API label retention, and forest render of merged Office 365 cards are excellence-ratcheted. Run the duplicate-connection slice:

`dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramExcellenceDuplicateConnection`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-duplicate-connection-wave-closeout`

Next **IDX-09** work is **extend-only** (regression fixes on connection rollup).

### Private endpoint opt-in deepening (IDX-10b) — complete

DataFlow/DataArchitecture default-off PE compile, Full subscription Mermaid export without PE arm types, and Network opt-in PE nodes are excellence-ratcheted. Run the private-endpoint slice:

`dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramExcellencePrivateEndpoint`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-private-endpoint-wave-closeout`

Next **IDX-10** work is **extend-only** (regression fixes on workbench PE toggle and compile flag).

### Completeness summary deepening (IDX-11b) — complete

Mode-aware completeness summaries (network vs identity missing classes, hidden hops, Data Flow logicAppConnections) are excellence-ratcheted in Application tests. Run the completeness slice:

`dotnet test ArchLucid.Application.Tests --filter FullyQualifiedName~InventoryDiagramExcellenceCompleteness`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-completeness-wave-closeout`

Next **IDX-11** work is **extend-only** (regression fixes on walkthrough counts and banner copy).

### Hop-focus deepening (IDX-12b) — complete

Neighborhood, selected-resource, and resource-group hop-focus compile (cited VNet visibility, unrelated VM omission, transit bridge rules) are excellence-ratcheted. Run the hop-focus slice:

`dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramExcellenceHopFocus`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-hop-focus-wave-closeout`

Next **IDX-12** work is **extend-only** (regression fixes on neighborhood / selected / RG focus modes).

### Deepening excellence wave (IDX-05b–12b) — complete

Subnet, singleton tail, duplicate connection, private endpoint opt-in, completeness, and hop-focus deepening slices are index-closeout guarded. Run the deepening closeout bundle:

`cd archlucid-ui && npm test -- inventory-diagram-excellence-subnet-wave-closeout`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-singleton-tail-wave-closeout`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-duplicate-connection-wave-closeout`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-private-endpoint-wave-closeout`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-completeness-wave-closeout`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-hop-focus-wave-closeout`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-deepening-wave-closeout`

Next deepening work is **extend-only** (regression fixes on per-slice ratchets).

### Cross-mode excellence wave (IDX-08b–13z) — complete

Singleton-tail, connection rollup, PE opt-in, completeness, hop-focus, cross-mode parity, fat-graph forest/DOT parity, backend manifest + trait guards, workbench Vitest ratchet, and UI manifest guards are covered. Run the cross-mode slice:

`dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~CrossModeWaveManifest`

`dotnet test ArchLucid.Application.Tests --filter FullyQualifiedName~CrossModeWaveManifest`

`dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~CrossModeTraitGuard`

`dotnet test ArchLucid.Application.Tests --filter FullyQualifiedName~CrossModeTraitGuard`

`dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~FatGraphForestDotParityRatchet`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-workbench.ratchet`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-cross-mode-ui-wave-manifest`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-cross-mode-wave-closeout`

Next cross-mode work is **extend-only** (regression fixes). Pick **IDX-05** when a mode keeps subnet nodes visible, **IDX-08** / **IDX-13** base deepening, or **IDX-HOLD** for new scope.

### Excellence index closeout wave (IDX-14a–14s) — complete

Cross-mode and deepening index closeout umbrellas are documented and Vitest-ratcheted. Run the closeout capstone bundle:

`cd archlucid-ui && npm test -- inventory-diagram-excellence-cross-mode-wave-closeout`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-deepening-wave-closeout`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-closeout-wave-closeout`

`cd archlucid-ui && npm test -- inventory-diagram-excellence-closeout-wave-ui-manifest`

Next **IDX-14** work is **extend-only** (regression fixes on per-slice or umbrella closeouts).

**Regression guard:** `dotnet test ArchLucid.ArtifactSynthesis.Tests --filter FullyQualifiedName~InventoryDiagramExcellence` plus `ArchLucid.Application.Tests --filter FullyQualifiedName~InfraEvidenceMermaidCompleteness` and `FullyQualifiedName~InventoryDiagramExcellenceCompleteness`. Data Flow hub pipeline slice (both projects): `dotnet test ArchLucid.ArtifactSynthesis.Tests --filter InventoryDiagramExcellence=DataFlowHubPipeline` and `dotnet test ArchLucid.Application.Tests --filter InventoryDiagramExcellence=DataFlowHubPipeline`. **IDX-05** subnet layer can still deepen when a mode keeps subnet nodes visible.

**IDX-HOLD** is not implementation. Paste `inventory-diagram-excellence-14-hold.md` only if a session starts a complete graph, default NIC/PE cards, Microsoft icons, Full-subscription RBAC, ARM `dependsOn`, a second collector, or nested frames from an **IDA / IDF** chat.

Suggested Cloud Agent branch per prompt: `cursor/inventory-diagram-excellence-<short-name>-idx1`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR lives on `cursor/inventory-diagram-excellence-prompts-2f4b`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-excellence-01-recapture.md` | Nested ARM relationship properties never land in the snapshot |
| 02 | `inventory-diagram-excellence-02-graph-build-compose.md` | Hop lift is compile-local and skips DataFlow / some modes |
| 03 | `inventory-diagram-excellence-03-cited-hops.md` | Same-RG / single-VNet all-to-all and cross-RG guesses |
| 04 | `inventory-diagram-excellence-04-honest-verbs.md` | Every remaining edge reads as `connects` |
| 05 | `inventory-diagram-excellence-05-nested-vnet-subnet-frames.md` | No VNet/subnet boxes; IDA-HOLD/IDF-HOLD blocked this |
| 05b | `inventory-diagram-excellence-05b-nested-subnet-excellence-ratchet.md` | Network/peeled-subnet compile not under excellence filter |
| 06 | `inventory-diagram-excellence-06-subscription-outer-frame.md` | No subscription container on subscription-scoped views |
| 07 | `inventory-diagram-excellence-07-role-aware-packing.md` | Role-blind grids; hubs lost in columns |
| 07b | `inventory-diagram-excellence-07b-dataflow-in-stage-hub.md` | Data Flow stage stacks a high-degree ADF instead of hub-and-spoke |
| 07c | `inventory-diagram-excellence-07c-rollup-preserves-hub.md` | Data Flow rollup collapses four same-type sinks before hub layout |
| 07d | `inventory-diagram-excellence-07d-hub-edge-route.md` | Cross-stage edge into an in-stage hub fails the forest render |
| 07e | `inventory-diagram-excellence-07e-subcolumn-keeps-hub.md` | Twelve-card subcolumn wrap splits hub-and-spoke components |
| 07f | `inventory-diagram-excellence-07f-dataflow-hub-ratchet.md` | 07b–07e regressions skip the excellence test filter |
| 08 | `inventory-diagram-excellence-08-singleton-rg-collapse.md` | Long tail of one-node RG frames |
| 08b | `inventory-diagram-excellence-08b-singleton-tail-excellence-ratchet.md` | Singleton tail not in excellence filter |
| 08c | `inventory-diagram-excellence-08c-collapsed-singleton-tail-label-excellence-ratchet.md` | Collapsed tail label helpers not excellence-ratcheted |
| 09 | `inventory-diagram-excellence-09-duplicate-connection-collapse.md` | Duplicate Logic App connector cards |
| 09b | `inventory-diagram-excellence-09b-duplicate-connection-excellence-ratchet.md` | Connection rollup not in excellence filter |
| 10 | `inventory-diagram-excellence-10-pe-opt-in-toggle.md` | PE cards have no workbench opt-in; hops already used |
| 10b | `inventory-diagram-excellence-10b-private-endpoint-excellence-ratchet.md` | DataFlow/DataArchitecture + Mermaid PE opt-in not excellence-ratcheted |
| 11 | `inventory-diagram-excellence-11-completeness-strip.md` | Generic banner; walkthrough counts unexplained |
| 11b | `inventory-diagram-excellence-11b-completeness-excellence-ratchet.md` | Completeness summary not in excellence filter |
| 12 | `inventory-diagram-excellence-12-hop-focus-modes.md` | Neighborhood / selected / RG still feel like a crop of Full |
| 12b | `inventory-diagram-excellence-12b-hop-focus-excellence-ratchet.md` | Hop-focus compile not in excellence filter |
| 13 | `inventory-diagram-excellence-13-cross-mode-ratchet.md` | Next agent Full-sub-only tests the rest of the enum |
| 13b | `inventory-diagram-excellence-13b-fat-graph-dot-parity.md` | Fat graph forest frames and DOT clusters can diverge |
| 13c | `inventory-diagram-excellence-13c-dataflow-hub-mermaid-ratchet.md` | Hub pipeline forest ratchet does not guard Mermaid export |
| 13d | `inventory-diagram-excellence-13d-dataflow-hub-dot-ratchet.md` | Hub pipeline has no Graphviz DOT excellence ratchet |
| 13e | `inventory-diagram-excellence-13e-dataflow-hub-compile-ratchet.md` | Hub pipeline only tested via hand-built AST, not graph compile |
| 13f | `inventory-diagram-excellence-13f-dataflow-hub-service-mermaid.md` | Hub graph compile ratchet does not guard the snapshot Mermaid service |
| 13g | `inventory-diagram-excellence-13g-dataflow-hub-compile-routing.md` | Graph compile hub ratchet skips cross-stage forest routing |
| 13h | `inventory-diagram-excellence-13h-dataflow-hub-service-forest.md` | Service path does not ratchet inventory-forest hub layout |
| 13i | `inventory-diagram-excellence-13i-dataflow-hub-service-forest-routing.md` | Service forest layout ratchet skips cross-stage routing |
| 13j | `inventory-diagram-excellence-13j-dataflow-hub-service-png-dot.md` | Service PNG export DOT on hub graph unguarded |
| 13k | `inventory-diagram-excellence-13k-dataflow-hub-hand-ingestion-label.md` | Hand hub fixture `Transform` label diverges from compile `Ingestion` |
| 13l | `inventory-diagram-excellence-13l-dataflow-hub-mermaid-stage-labels.md` | Hub Mermaid export omits Source/Ingestion stage labels |
| 13m | `inventory-diagram-excellence-13m-dataflow-hub-forest-stage-labels.md` | Hub forest SVG omits Source/Ingestion stage headers |
| 13n | `inventory-diagram-excellence-13n-dataflow-hub-compile-stage-labels.md` | Compile hub ratchet omits stage labels on Mermaid/forest |
| 13o | `inventory-diagram-excellence-13o-dataflow-hub-png-layout-stage-labels.md` | PNG export ratchet omits forest stage headers |
| 13p | `inventory-diagram-excellence-13p-dataflow-hub-png-mermaid-stage-labels.md` | PNG export ratchet omits Mermaid stage labels |
| 13q | `inventory-diagram-excellence-13q-dataflow-hub-export-stage-label-bundle.md` | Hub ratchets do not bundle Mermaid + forest stage labels |
| 13r | `inventory-diagram-excellence-13r-dataflow-hub-stage-label-dedupe.md` | Hand hub ratchets duplicate paired stage-label coverage |
| 13s | `inventory-diagram-excellence-13s-dataflow-hub-service-test-factory.md` | Hub service/PNG Application tests duplicate wiring |
| 13t | `inventory-diagram-excellence-13t-dataflow-hub-pipeline-trait-guard.md` | Hub ratchets missing cross-project trait filter |
| 13u | `inventory-diagram-excellence-13u-dataflow-hub-wave-manifest.md` | Hub ratchet classes not manifest-guarded |
| 13v | `inventory-diagram-excellence-13v-cross-mode-wave-manifest.md` | Cross-mode ratchet classes not manifest-guarded |
| 13w | `inventory-diagram-excellence-13w-cross-mode-trait-guard.md` | Cross-mode ratchets carry hub `DataFlowHubPipeline` trait |
| 13x | `inventory-diagram-excellence-13x-workbench-excellence-ratchet.md` | Workbench PE default + completeness strip not excellence-ratcheted |
| 13y | `inventory-diagram-excellence-13y-fat-graph-forest-dot-parity-ratchet.md` | Fat graph forest/DOT parity not in dedicated excellence class |
| 13z | `inventory-diagram-excellence-13z-cross-mode-ui-wave-manifest.md` | Workbench excellence ratchet not UI manifest-guarded |
| 14a | `inventory-diagram-excellence-14a-cross-mode-wave-closeout.md` | Cross-mode slice not documented complete in index |
| 14b | `inventory-diagram-excellence-14b-subnet-wave-closeout.md` | IDX-05b subnet slice not documented complete in index |
| 14c | `inventory-diagram-excellence-14c-singleton-tail-wave-closeout.md` | IDX-08b–08c singleton tail slice not documented complete in index |
| 14d | `inventory-diagram-excellence-14d-duplicate-connection-wave-closeout.md` | IDX-09b duplicate connection slice not documented complete in index |
| 14e | `inventory-diagram-excellence-14e-private-endpoint-wave-closeout.md` | IDX-10b PE opt-in slice not documented complete in index |
| 14f | `inventory-diagram-excellence-14f-completeness-wave-closeout.md` | IDX-11b completeness slice not documented complete in index |
| 14g | `inventory-diagram-excellence-14g-hop-focus-wave-closeout.md` | IDX-12b hop-focus slice not documented complete in index |
| 14h | `inventory-diagram-excellence-14h-deepening-wave-closeout.md` | IDX-05b–12b deepening bundle not documented complete in index |
| 14i | `inventory-diagram-excellence-14i-closeout-wave-closeout.md` | IDX-14a–14h capstone closeout not documented complete in index |
| 14j | `inventory-diagram-excellence-14j-closeout-wave-ui-manifest.md` | Closeout Vitest files not manifest-guarded |
| 14k | `inventory-diagram-excellence-14k-closeout-capstone-index-sync.md` | Capstone index not aligned with 14j manifest |
| 14l | `inventory-diagram-excellence-14l-closeout-capstone-14k-heading.md` | Capstone heading still titles 14a–14j after 14k |
| 14m | `inventory-diagram-excellence-14m-closeout-capstone-14l-heading.md` | Capstone heading still titles 14a–14k after 14l |
| 14n | `inventory-diagram-excellence-14n-closeout-capstone-14m-heading.md` | Capstone heading still titles 14a–14l after 14m |
| 14o | `inventory-diagram-excellence-14o-closeout-capstone-14n-heading.md` | Capstone heading still titles 14a–14m after 14n |
| 14p | `inventory-diagram-excellence-14p-closeout-capstone-14o-heading.md` | Capstone heading still titles 14a–14n after 14o |
| 14q | `inventory-diagram-excellence-14q-closeout-capstone-14p-heading.md` | Capstone heading still titles 14a–14o after 14p |
| 14r | `inventory-diagram-excellence-14r-closeout-capstone-14q-heading.md` | Capstone heading still titles 14a–14p after 14q |
| 14s | `inventory-diagram-excellence-14s-closeout-capstone-14r-heading.md` | Capstone heading still titles 14a–14q after 14r |
| 14t | `inventory-diagram-excellence-14t-closeout-capstone-14s-heading.md` | Capstone heading still titles 14a–14r after 14s |
| HOLD | `inventory-diagram-excellence-14-hold.md` | Complete-graph / default PE / icons / RBAC dump |

## Prerequisites (do not re-implement)

If trunk is missing Visio-style RG-first packing (`DiagramResourceGroupPacker` named singleton frames, RG-first canvas) or hop-lift hydrators (`DiagramCollapsedAttachmentEdgeLifter`, parent-child, subnet ancestor mapping, Logic App / property ARM-id hydrators), **stop** and say so. Cherry-pick or wait. IDX chats do not rebuild those features.

## After each prompt

Summarize: files changed, tests run, **which of the 12 `DiagramMode` values were compiled**, whether PE cards remained hidden by default, residual risk (hosted recapture needs a new snapshot; PNG vs forest).

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report. Cloud Agent VMs: if `pwsh` is missing, install per `AGENTS.md` **or** skip the script on a clean branch and say so.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- Verification: focused `dotnet test --filter` or focused Vitest / Playwright named in the prompt. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build, no dev server unless the file says so.
- Implement only *What to build*.
- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No Azure HTTP at diagram compile time.
