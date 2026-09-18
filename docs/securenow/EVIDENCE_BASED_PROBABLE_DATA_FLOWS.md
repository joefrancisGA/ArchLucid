> **Scope:** Product design for SecureNow **evidence-based probable data flows** on Diagram 3 (Data flow). **Contributor-reference** — internal engineering only. **Not implementation.**
> **Created:** 2026-09-18
> **Spine:** [`../library/SECURENOW_ARCHITECT_PLANE.md`](../library/SECURENOW_ARCHITECT_PLANE.md) · **Observation plane:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) · **First-slice DFD:** [`DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md`](DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md) · **Collection (closed):** [`../architecture/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md`](../architecture/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md) (**AX-DE-01–18**) · **Executive/Identity/Data consumption:** [`../architecture/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_COMPOSER_PROMPTS.md`](../architecture/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_COMPOSER_PROMPTS.md) (**AX-DC**) · **Feasibility:** [`../architecture/AZURE_CONNECTION_POINT_DISCOVERY.md`](../architecture/AZURE_CONNECTION_POINT_DISCOVERY.md)
> **Hold:** [`../library/SECURENOW_PROBABLE_EVIDENCE_HOLD.md`](../library/SECURENOW_PROBABLE_EVIDENCE_HOLD.md). Do not claim observed traffic. Do not store numeric confidence percents. Do not compose private-endpoint hops without a DNS-zone join.

# Evidence-based probable data flows

The generator must not ask Azure to **prove** runtime data flows. It must ask:

> What **evidence** exists that data **could** or **does** flow between these resources?

That is how architects already read inventory, and it is already how ArchLucid stamps `ProvenanceKind` and `PathConfidenceBand`. This wave puts those evidence families on **SecureNow Data flow** (Diagram 3). It does **not** re-collect AX-DE companions and it does **not** re-run AX-DC Executive consumption.

## 1. Locked objective

| Ask this | Not this |
|----------|----------|
| Evidence-based **probable** flows, with an ordinal band | “True” / observed packet flows from ARM |
| Source, target, evidence class, band | `"confidence": 80` on the edge |
| Several **families** on one canvas (declared, authorized, network-path, inferred) | One hairball labeled “data flow” |
| DFD compile as a **product** (families + stages + direction + honesty) | “Then the DFD is just a rendering problem” |

Numeric percents are false precision (see SA-21 / `PathConfidenceBand`). Indicative ranges in the discovery doc stay **documentation**, never a stored property.

## 2. Three graphs (do not collapse)

Same snapshot, three questions. Data Flow may **show** more than one family; it must **not** merge them into one arrow type.

| Graph | Question | Typical evidence | DFD family |
|-------|----------|------------------|------------|
| **Declared movement** | What wiring did the platform record? | ADF/Synapse activity I/O, Event Grid ARM destination, Event Hub capture | `DeclaredMovement` |
| **Authorization** | What may this identity access? | MI + RBAC `appAuthorizedAccess`, Key Vault references | `AuthorizedAccess` |
| **Structural network path** | What private path exists? | Composed PE hop **after** DNS join | `StructuralNetworkPath` |
| **Inferred** | What hostname suggests a target? | Redacted app-setting FQDN match | `InferredHostname` |
| **Runtime (out of scope)** | What actually called what? | Flow logs, App Insights | Never merge silently |

Capability-to-flow path engines stay on the SecureNow architect plane. This wave is the **Data Flow canvas**, not a new finding engine.

## 3. What is already built (do not re-collect)

| Surface | Where | DFD status today |
|---------|-------|------------------|
| ADF `adfReadsFrom` / `adfWritesTo` | SN-DF-03 filter | **Spine** of Diagram 3 |
| External ADF sources | SN-DF-01 | Left column |
| `appAuthorizedAccess` (**May access**) | AX-DE-03 | Graph + Executive (AX-DC); **dropped** by `DiagramDataFlowEdgeFilter` |
| `eventGridToDestination` | AX-DE-11 | Collected; **not** on Data Flow |
| `eventHubCapture` + messaging children | AX-DE-13 | Collected; **not** on Data Flow |
| `appToKeyVaultRef` / `hostnameInferredTarget` | AX-DE-18 / catalog | Collected; **not** on Data Flow |
| `privateEndpointTarget`, `appServiceToSubnet`, `privateDnsVnetLink`, `peDnsZoneGroup` | IE-RF + AX-DE-15 | Collected; **not joined** into compute→store |
| Service Bus / Event Hub **producer/consumer** as ARM destinations | — | **Do not invent.** Namespaces do not record senders. Edges come from RBAC (Sender/Receiver) or capture. |

## 4. Evidence tiers (corrected)

Owner commentary that started this wave listed Private Endpoints, Event Grid, Service Bus, and Event Hub together as “nearly guaranteed.” Keep Event Grid and Event Hub **capture** in declared movement. **Do not** treat Service Bus queues/topics or Event Hub names as ARM destination edges.

| Tier | Evidence | Band | Notes |
|------|----------|------|-------|
| **1 — declared / structural** | ADF/Synapse I/O, Event Grid ARM destination, Event Hub capture, PE→target (network, Diagram 1) | `ObservedFact` + `Confirmed` for cited ARM ids; ADF I/O stays `DerivedFact` | Service Bus / Event Hub **namespaces** are nodes, not edges |
| **2 — authorization** | MI + RBAC `appAuthorizedAccess`; KV refs | `DerivedFact` + `Probable` | Permission ≠ usage. Label **May access** / **May read** / **May write** — never **Reads from** (ADF) |
| **2b — composed PE path** | App VNet integration + PE target + **DNS zone group + VNet link to the app’s VNet** | `DerivedFact` + `Probable` (ceiling `HighlyLikely`) | **Not** 95% Observed. Naive “any integrated app → any PE in the subscription” is a hub-spoke false-positive factory |
| **3 — inferred** | Hostname in redacted settings | `DeterministicInference` + `Possible` | Already AX-DE-18; Data Flow may show it dashed |
| **Out** | Kudu, VM disk, AKS ConfigMaps, source parse, flow logs as architecture | — | AX-DE-HOLD / this hold |

VNet integration alone is **context** (Diagram 1), not a Data Flow edge.

## 5. Direction is first-class

A Data Flow diagram without honest arrowheads is a coupling diagram.

| Evidence | Direction on Diagram 3 |
|----------|------------------------|
| ADF/Synapse `Reads from` / `Writes to` | Declared, keep existing polarity |
| Event Grid ARM destination | Topic/domain → handler |
| Event Hub capture | Hub → storage |
| `Storage Blob Data Contributor`, `SQL DB Contributor` | **May access** (no declared movement arrow) |
| `Azure Service Bus Data Sender` / `Data Receiver` (and Event Hubs equivalents) | **May write** / **May read** when the role map knows them |
| Private-endpoint composed hop | Undirected **Private network path** (reachability, not ETL) |
| Hostname match | **Likely connected to** |

Do not reuse ADF **Reads from** for RBAC.

## 6. Stages (Diagram 3)

SN-DF-02 stages stay. This wave **adds** Application + messaging/event types so authorized and Event Grid families have somewhere to sit. Network ARM types stay **omitted**.

| Stage order | Who |
|-------------|-----|
| Source | External ADF linked services (SN-DF-01) |
| **Application** | App Service / Function / Container App **when** they participate in a DFD evidence family |
| Ingestion | Data Factory; Event Grid topic/domain; Logic App when present |
| Storage | SQL, Cosmos, DBfor*, Storage, Service Bus queue/topic, Event Hub (the hub, not the namespace box alone if children exist) |
| Transform | Synapse, Databricks when present |
| Consumer | Power BI / Fabric **only if** those ARM types are in the snapshot |

Do **not** mint `Customer` or Power BI boxes. Empty stages stay empty (SN-DF-08).

**Diagnostics** (`diagnosticToDestination`) are telemetry, not business data movement. Keep them off Diagram 3 (Executive/Data may still show **Sends diagnostics to** via AX-DC).

## 7. Private-endpoint composition (required join)

Azure proves two facts separately: `privateEndpointTarget` (PE → store) and `appServiceToSubnet` (app → subnet). Composing them into **Web App → SQL** is a **join**, not an observation.

Emit `peReachableTarget` (compute → store) **only when all** hold:

1. Compute maps to a subnet (`appServiceToSubnet`, or VM → NIC → subnet).
2. A private endpoint targets the store (`privateEndpointTarget`).
3. That PE has a DNS zone group (`peDnsZoneGroup`).
4. That zone is linked to **the compute’s VNet** (`privateDnsVnetLink`).

Hub-spoke is allowed: PE subnet may differ from the app subnet **if** the DNS link is to the app’s VNet.

**Do not** emit because “the app is VNet-integrated and SQL has a PE somewhere.” That lights up every spoke app onto every shared PE.

**Do not** traverse VNet peering in this wave (leave `InsufficientEvidence` / no edge).

Provenance: `DerivedFact`. Band: `Probable`; `HighlyLikely` only when PE subnet and app subnet share the same VNet **and** the DNS join hits. Never `ObservedFact`. Never a percent.

On Data Flow: show compute → store, hide PE/NIC/VNet boxes (those remain Diagram 1).

## 8. First slice (this prompt set)

1. Lock evidence **families** + ordinal bands + direction policy in code (no new Azure calls).
2. Expand the stage catalog so Application / Event Grid / messaging can appear.
3. Open `DiagramDataFlowEdgeFilter` to the allow-listed families (not diagnostics, not raw PE).
4. Include Application endpoints when a family edge exists (same idea as AX-DC-02, **Data Flow only**).
5. Derive `peReachableTarget` with the DNS join and a hub-spoke **negative** test.
6. Map Service Bus / Event Hub Sender/Receiver roles so messaging is not a dead namespace box.
7. Honesty legend: declared vs authorized vs network path vs inferred; **no percents**.
8. Golden mermaid/AST contract.

## 9. Explicitly out of scope

- Re-running **AX-DE-01–18** or **AX-DC-01–08** as greenfield.
- Re-running **SN-DF-01–08** as greenfield (consume them).
- Numeric `confidence` fields, “95% Web App → SQL,” or multiplying bands along a path.
- Kudu / VM disk / AKS ConfigMap / source parsing / secret values.
- Flow logs / App Insights as Diagram 3 arrows.
- Classic Level-1 process DFDs (`Order Processing`).
- Stamping TLS 1.3 or Confidential.
- Treating Service Bus / Event Hub as Event Grid–style ARM destinations.

## 10. Success criteria

**Winning:** a CISO can see **SAP → ADF → SQL** (declared) and **Web App — May access → SQL** (authorized) on the same Data Flow canvas, with different labels, without a VNet, and without being told the RBAC edge is traffic.

**Winning (PE):** Web App → SQL **Private network path** appears only when the DNS zone of that PE is linked to the app’s VNet; a second VNet-integrated app without that link does **not** get the edge.

**Acceptable leftovers:** no Customer node, no Power BI unless collected, no peering-based PE paths, no runtime observation.
