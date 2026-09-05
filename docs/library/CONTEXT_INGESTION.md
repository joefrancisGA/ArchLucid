> **Scope:** Contributor-reference — Context ingestion pipeline - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Context ingestion pipeline

`ArchLucid.ContextIngestion` turns heterogeneous inputs (description, inline requirements, pasted documents, policy references, topology/security hints, **structured infrastructure declarations**) into **`CanonicalObject`** instances, **enriches** topology/security metadata, **deduplicates** them, and stores a **`ContextSnapshot`** used by the knowledge graph and downstream authority chain.

---

## Request model

HTTP clients send **`ArchitectureRequest`** (see `ArchLucid.Contracts.Requests`). The coordinator maps it to **`ContextIngestionRequest`** via **`ContextIngestionRequestMapper.FromArchitectureRequest`**:

| ArchitectureRequest field | ContextIngestionRequest field | Notes |
|---------------------------|-------------------------------|--------|
| `SystemName` | `ProjectId` | Same logical key used for “latest snapshot” lookups. |
| `Description` | `Description` | Primary free-text description. |
| `InlineRequirements` | `InlineRequirements` | Each line becomes a `Requirement` canonical object. |
| `Documents` | `Documents` | Inline documents (`name`, `contentType`, `content`) — not multipart upload. **HTTP API:** `name` and `contentType` must be non-empty and not whitespace-only; `contentType` must be in **`SupportedContextDocumentContentTypes.All`**; `content` must not be null (`ContextDocumentRequestValidator`). See **`docs/API_CONTRACTS.md`**. |
| `PolicyReferences` | `PolicyReferences` | Short strings → `PolicyControl` objects (`reference` + `status=referenced`). |
| `TopologyHints` | `TopologyHints` | → `TopologyResource` objects. |
| `SecurityBaselineHints` | `SecurityBaselineHints` | → `SecurityBaseline` objects. |
| `InfrastructureDeclarations` | `InfrastructureDeclarations` | Structured IaC snippets (`json`, `simple-terraform`, `terraform-show-json`, `bicep`, `arm-json`, `kubernetes-json`, `kubernetes-yaml`) → **`InfrastructureDeclarationConnector`**. |

`RunId` is assigned by **`AuthorityRunOrchestrator`** immediately before **`IContextIngestionService.IngestAsync`**.

---

## File-backed connectors and SMB (port 445)

**Enterprise default:** Do not expose **SMB (TCP 445)** to the public internet. File-backed ingestion should use **private endpoints** (VPN, ExpressRoute, private VNet integration, or managed file shares reachable only from the workload network). Align Terraform/network design with deny-by-default NSGs and private DNS.

When documenting connector deployments, treat **on-prem file shares** as **data-plane** dependencies with the same classification as database connection strings.

## Connector pipeline (fixed order)

Connectors implement **`IContextConnector`**. **Code source of truth:** **`ContextConnectorPipeline.CreateOrderedContextConnectorPipeline`** in `ArchLucid.ContextIngestion.Infrastructure` — the API host registers **`IEnumerable<IContextConnector>`** only from that factory, so execution order is never dependent on implicit multi-registration ordering. **Order affects** how **`ContextSnapshot.DeltaSummary`** is built (segments are concatenated in connector order for operator-facing narrative). **`RegisterContextIngestionAndKnowledgeGraph`** (`ArchLucid.Api` startup) wires DI to that factory; concrete connector types are listed below in pipeline order:

1. **`StaticRequestContextConnector`** — primary description → one `Requirement` (“Primary Request”) with `SourceType=StaticRequest`.
2. **`InlineRequirementsConnector`** — each inline string → `Requirement` (`SourceType=InlineRequirement`).
3. **`DocumentConnector`** — parses each **`ContextDocumentReference`** with a matching **`IContextDocumentParser`**. Parser precedence is fixed in **`ContextDocumentParserPipeline.CreateOrderedContextDocumentParsers`** (first parser in that list where **`CanParse`** is true wins).
4. **`PolicyReferenceConnector`**
5. **`TopologyHintsConnector`**
6. **`SecurityBaselineHintsConnector`**
7. **`InfrastructureDeclarationConnector`** — **`InfrastructureDeclarationReference`** items parsed by **`IInfrastructureDeclarationParser`** implementations (`json`, `simple-terraform`, `terraform-show-json`, `bicep`, `arm-json`, `kubernetes-json`, `kubernetes-yaml`).

Each connector’s **`DeltaAsync`** returns a short base summary; **`IContextDeltaSummaryBuilder`** (default: **`DefaultContextDeltaSummaryBuilder`**) enriches it with normalized object counts, a per-type breakdown (e.g. `Requirement×2`), and a one-time baseline clause against the **latest persisted `ContextSnapshot` for `ProjectId`** (if any). The enriched segments are joined into **`ContextSnapshot.DeltaSummary`**.

### Optional properties for knowledge-graph targeting

Connectors or parsers may set comma-separated graph **`NodeId`** values on **`CanonicalObject.Properties`** using keys from **`ArchLucid.KnowledgeGraph.CanonicalGraphPropertyKeys`** (`applicableTopologyNodeIds` on **`PolicyControl`**, `relatedTopologyNodeIds` on **`Requirement`**) so **`DefaultGraphEdgeInferer`** emits narrow **`APPLIES_TO`** / **`RELATES_TO`** edges instead of broad heuristics. See **`docs/KNOWLEDGE_GRAPH.md`**.

---

## Supported document content types (single source of truth)

The canonical MIME list for inline documents is **`ArchLucid.ContextIngestion.SupportedContextDocumentContentTypes.All`**. The API FluentValidation rule (**`ContextDocumentRequestValidator`**) and **`PlainTextContextDocumentParser.CanParse`** both use **`SupportedContextDocumentContentTypes.IsSupported`**. When adding a new parser for another type, extend **`All`**, implement **`IContextDocumentParser`**, register the concrete parser in DI, and append it to **`ContextDocumentParserPipeline.CreateOrderedContextDocumentParsers`** in the desired order.

---

## Document parsers

### `PlainTextContextDocumentParser`

Supports the MIME types listed in **`SupportedContextDocumentContentTypes`**. Non-empty lines may start with:

| Prefix | Canonical `ObjectType` | `Properties` |
|--------|-------------------------|--------------|
| `REQ:` | `Requirement` | `text` |
| `POL:` | `PolicyControl` | `text` |
| `TOP:` | `TopologyResource` | `text` |
| `SEC:` | `SecurityBaseline` | `text`, `status=declared` |

Prefix matching is case-insensitive. Lines without a recognized prefix are ignored.

### Unsupported content types

- **API:** `ArchitectureRequest` documents are validated with **`ContextDocumentRequestValidator`** (supported types only → **400** if invalid).
- **Ingestion:** If a document reaches **`DocumentConnector`** with no matching parser, a **warning** is appended to **`NormalizedContextBatch.Warnings`** and surfaced on **`ContextSnapshot.Warnings`** (skipped document).

---

## Infrastructure declarations (IaC seam)

DTO: **`InfrastructureDeclarationReference`** (`Name`, **`Format`**, `Content`). Supported v1 **`Format`** values: **`json`**, **`simple-terraform`**, **`terraform-show-json`** (output of `terraform show -json`), **`bicep`**, **`arm-json`**, **`kubernetes-json`**, **`kubernetes-yaml`**.

### `json`

Body deserializes to **`ResourceDeclarationDocument`** with a **`resources`** array of **`ResourceDeclarationItem`** (`type`, `name`, optional `subtype`, `region`, `properties` as string dictionary). Declared **`type`** maps to canonical **`ObjectType`** (e.g. `vnet`/`subnet`/`storage`/`appservice` → **`TopologyResource`**; `keyvault`/`firewall`/`nsg` → **`SecurityBaseline`**; `policy` → **`PolicyControl`**). Each object uses **`SourceType=InfrastructureDeclaration`** and **`SourceId=DeclarationId`**.

### `simple-terraform`

Lightweight line-based parser over **`resource "azurerm_virtual_network" "core"`** blocks (not a full HCL compiler). **`terraformType`** is stored on the canonical object; top-level scalar assignments and one shallow nested block per resource are copied to **`tf.*`** keys with the same truncation, redaction, and per-resource caps as **`terraform-show-json`**. **`ResolveObjectType`** maps vault / firewall / NSG → **`SecurityBaseline`**, `policy` → **`PolicyControl`**, else **`TopologyResource`**.

### `bicep`

Line-based match for **`resource symbolicName 'Microsoft.Provider/types@api-version'`** declarations (not a Bicep compiler). Stores **`resourceType`**, **`bicepSymbolicName`**, optional **`apiVersion`**, and a bounded set of resource-body scalars from **`properties:`** / **`siteConfig:`** blocks under **`tf.*`** keys (with ARM camelCase aliases for security fields). **`CanonicalInfrastructurePropertyBag`** compacts camelCase keys (e.g. **`publicNetworkAccess`** → **`tf.publicnetworkaccess`**); **`declaration-security-baseline`** and **`declaration-premise-conflict`** resolve aliases via **`DeclarationSecurityPropertyKeyResolver`**.

### `arm-json`

Parses an ARM template JSON **`resources`** array. Skips **`Microsoft.Resources/deployments`** nested templates. Copies a bounded set of scalar **`properties`** fields onto **`tf.*`** keys and dual-writes ARM camelCase aliases for known security fields.

### `kubernetes-json` / `kubernetes-yaml`

Parses **`kubectl get -o json`** output or multi-document YAML manifests into **`TopologyResource`** / **`SecurityBaseline`** rows with **`k8s.*`** metadata plus security-relevant spec fields (**`k8s.privileged`**, **`k8s.hostNetwork`**, **`k8s.servicetype`**, etc.) for **`declaration-security-baseline`**. Secret **`data`** / **`stringData`** payloads are not ingested.

### `terraform-show-json`

Parses the **`values`** subtree of **`terraform show -json`** state JSON (including **`child_modules`**). Each managed resource becomes a **`TopologyResource`** or **`SecurityBaseline`** / **`PolicyControl`** using the same mapping heuristics as other Terraform-derived inputs; key attributes from the resource **`values`** object are copied under **`tf.*`** property keys (truncated for very large payloads).

### Enrichment

After all connectors run, **`ICanonicalEnricher`** (**`CanonicalInfrastructureEnricher`**) runs before deduplication: **`TopologyResource`** objects get inferred **`category`** (`network`, `storage`, `compute`, `data`, `identity`, `general`) from **`resourceType`** or **`terraformType`**. **`SecurityBaseline`** objects get **`status=declared`** when missing.

---

## Deduplication

**`CanonicalDeduplicator`** collapses duplicates before the snapshot is saved. Grouping key:

`ObjectType | Name | fingerprint`

**Fingerprint** precedence:

1. `Properties["text"]` if non-empty  
2. else `Properties["reference"]` if non-empty  
3. else `Properties["terraformType"]` if non-empty (Terraform-derived infra)  
4. else `Properties["resourceType"]` if non-empty (JSON-derived infra)  
5. else empty string  

So policy objects that only set **`reference`** still dedupe correctly when the same reference appears from multiple connectors; infrastructure objects can dedupe on provider/resource kind when text is absent.

---

## Downstream: knowledge graph

After **`ContextSnapshot`** is saved, **`ArchLucid.KnowledgeGraph`** builds a typed **`GraphSnapshot`** (nodes, inferred edges, validation). Canonical **`ObjectType`** values (e.g. `Requirement`, `TopologyResource`, `PolicyControl`, `SecurityBaseline`) become **`GraphNode.NodeType`**; enrichment such as **`category`** on topology objects feeds node **`Category`** and edge inference.

See **`docs/KNOWLEDGE_GRAPH.md`** for pipeline, **`EdgeType`** semantics, DI registration, persistence JSON aliases, and manifest integration.

### Declaration security signals

Ingested **`tf.*`** / ARM scalar properties on topology resources feed two graph-pure security engines:

- **`declaration-security-baseline`** — reports unsafe declaration values in isolation (e.g. public network access enabled).
- **`declaration-premise-conflict`** — reports contradictions when the same declaration property conflicts with a linked **`SecurityBaseline`** or **`PolicyControl`** requirement on the graph (e.g. private-only baseline vs public-access declaration).

Both engines read the same ingested properties; premise-conflict findings require intent nodes linked by **`PROTECTS`** / **`APPLIES_TO`** (or graph-wide fallback) and use conflict phrasing in titles.

---

## Structured diagram ingest (IE-18)

Structured architecture diagrams (Mermaid, draw.io XML, ArchLucid diagram JSON, SVG metadata) are ingested into a persisted **`ArchitectureDiagramModel`** per run — not browser **`localStorage`**. Vision-based ingest (PNG/PDF) is **IE-20** and is out of scope here.

| Format (`DiagramSourceReference.Format`) | Parser | Notes |
|---|---|---|
| `mermaid` | `MermaidDiagramSourceParser` | Node labels in `id["label"]` form; edges `a --> b` or `a -->|"label"| b` |
| `drawio-xml` | `DrawIoXmlDiagramSourceParser` | `mxCell` vertices and edges |
| `archlucid-diagram-json` | `ArchLucidDiagramJsonParser` | Direct `ArchitectureDiagramModelRecord` JSON |
| `svg` | `SvgDiagramSourceParser` | Fail-soft: records a warning; does not throw |

**API:** `POST /v1/architecture/runs/{runId}/diagrams/ingest` (body: `StructuredDiagramIngestRequest` with one or more sources). **GET** `/v1/architecture/runs/{runId}/diagrams/model` returns the merged model. **`ExtractionMethod`** is always **`StructuredParse`**.

Parsers are **fail-soft**: invalid or unrecognized input yields warnings and an empty or partial model; ingest does not throw. Label-only service-type inference uses **`ArchitectureDiagramServiceTypeInferencer`** at confidence **0.7** (`DeterministicInference`).

Structured diagram ingest does **not** create a second **`CanonicalObject`** family and does **not** write Azure **`ObservedFact`** rows. Persisted rows live in **`dbo.ArchitectureDiagramModels`** (migration 362).

### Diagram ↔ inventory reconciliation (IE-19)

Deterministic correspondence between ingested diagram nodes and **`AzureInventorySnapshot`** resources for a run:

| `MatchKind` | Meaning |
|---|---|
| `Exact` | Name, resource group, and compatible type |
| `Probable` | Name plus RG or type |
| `Possible` | Name-only partial match |
| `DiagramOnly` | Diagram node with no inventory match |
| `InfrastructureOnly` | Inventory resource with no diagram node |
| `Conflict` | Multiple candidates or security discrepancy |
| `Unknown` | Unclassifiable diagram node |

**Confidence bands:** `Confirmed`, `Likely`, `Possible`, `InsufficientEvidence`. AI rationale (when added) cannot promote `InsufficientEvidence` to `Confirmed`. Public IP / public network access vs diagram labels implying private exposure yields at least **`Likely`** with `SecurityDiscrepancy=true`.

**API:** `POST /v1/architecture/runs/{runId}/diagrams/reconcile` (body: `snapshotId`). **GET** `.../diagrams/reconciliation?snapshotId=` returns persisted rows. Results stored in **`dbo.ArchitectureDiagramReconciliations`** (migration 363).

---

## Further reading

- **Typed knowledge graph:** `docs/KNOWLEDGE_GRAPH.md`.
- **API body and validation:** `docs/API_CONTRACTS.md` (create run / `ArchitectureRequest`).
- **Persisted snapshots:** `docs/DATA_MODEL.md` (`ContextSnapshots`).
- **Architecture overview:** `docs/ARCHITECTURE_CONTEXT.md`.
- **Ingestion fit-gap Composer prompts (archive):** [`../architecture/INGESTION_FIT_GAP_COMPOSER_PROMPTS.md`](../architecture/INGESTION_FIT_GAP_COMPOSER_PROMPTS.md) (FIT-01–05 shipped; do not re-run).
