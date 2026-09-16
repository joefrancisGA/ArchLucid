> **Scope:** Product design for SecureNow / inventory **data architecture** and **data flow** diagrams. **Contributor-reference** — internal engineering only. **Not implementation.**
> **Created:** 2026-09-16
> **Spine:** [`../library/SECURENOW_ARCHITECT_PLANE.md`](../library/SECURENOW_ARCHITECT_PLANE.md) · **Observation plane:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) · **Collector:** [`../library/AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) · **Connection points:** [`../architecture/AZURE_CONNECTION_POINT_DISCOVERY.md`](../architecture/AZURE_CONNECTION_POINT_DISCOVERY.md) · **Data-mode leftovers:** [`../architecture/INFRA_EVIDENCE_DATA_DIAGRAM_COMPOSER_PROMPTS.md`](../architecture/INFRA_EVIDENCE_DATA_DIAGRAM_COMPOSER_PROMPTS.md)
> **Hold:** Do not claim observed traffic, exfiltration, or data classification from ARM inventory. Capability-to-flow copy stays “may access / declared wiring.” See [`../library/SECURENOW_ARCHITECT_HOLD.md`](../library/SECURENOW_ARCHITECT_HOLD.md).

# Data architecture and data flow diagrams

Most Azure “data diagrams” are **infrastructure diagrams with database icons**. They answer how NICs, subnets, and private endpoints are attached. They do **not** answer:

- Where does data originate?
- Where does it go?
- Who transforms it?
- Where is it stored?
- Who consumes it?

SecureNow should generate **three diagrams from the same Azure inventory snapshot**. Do not overload Inventory **Data** mode (a category filter on the ARM forest) to carry all three jobs.

## 1. Three diagrams (locked framing)

| Diagram | Question | What belongs | What does not |
|---------|----------|--------------|---------------|
| **1. Infrastructure** | How is it attached? | VM, NIC, subnet, VNet, private endpoint, load balancer | Pipeline stages, SAP, Power BI as “the data story” |
| **2. Data architecture** | Which repositories and platforms exist? | Applications that produce data, storage accounts / ADLS, SQL / Cosmos, data lake, Fabric, Power BI | NIC, VNet, PE, LB as first-class boxes |
| **3. Data flow** | How does data move? | Source → process → storage → consumer. Arrows are movement | Resource-group swimlanes, network hops as the spine |

**Diagram 1 is already shipped** (`DiagramMode.Network`, Executive, FullSubscription).

**Diagram 2** is only a partial ARM catalog today. SQL and Cosmos are often **missing from Data mode** because topology category uses `Contains("/sql")`, which does not match `Microsoft.Sql/servers` (**IE-DD-01**). Executive mode still lists database ARM types via `ExecutiveAlwaysShowTiers`.

**Diagram 3 is the product customers are missing.** Favorite pipeline:

```text
Source systems
        →
Ingestion
        →
Raw storage
        →
Transformation
        →
Curated storage
        →
Analytics
        →
Consumers
```

Layout is **stage-ordered**, left-to-right (or top-to-bottom). Infrastructure detail is minimized. Data repositories are obvious.

## 2. Provenance (non-negotiable)

Inventory can discover **declared** and **authorized** relationships. It cannot prove runtime “data flowed.”

| Edge class | Product wording | Provenance |
|-----------|-----------------|------------|
| ADF `adfReadsFrom` / `adfWritesTo` | Declared pipeline wiring (activity inputs/outputs) | `DerivedFact` |
| ADF `adfLinkedService` | Factory connected to this ARM target | `ObservedFact` |
| ADF `adfLinkedServiceInferred` | Likely connected (unique hostname match) | `DeterministicInference` |
| Private endpoint → store | Network path to the store, not ETL | `ObservedFact` |
| App MI + RBAC (future) | Application **may access** this store | Derived / inferred — not traffic |
| TLS 1.3 / encryption on the canvas | Do not stamp unless collected | Azure SQL TLS is **assumed**, not observed |
| Classification (Confidential) | Do not invent | Needs a separate data-class source or HumanAssertion |

Collapsing authorization or ADF wiring into “this is how data actually moves in production” is how Azure diagrams become terrible in a **different** way.

**Do not** generate classic Level-1 process DFDs (`Order Processing` rectangles) from ARM. Inventory has **resources and pipelines**, not business processes.

## 3. Target pictures (owner commentary)

These are the buyer-visible pictures. They are the acceptance bar for Diagram 2 / 3 — not for Network mode.

### 3.1 Example 1 — Executive data architecture

CIO / CISO / architect: sources, transformations, storage, consumers.

```text
                         +----------------+
                         | ERP System     |
                         | SAP            |
                         +-------+--------+
                                 |
                                 v
                    +--------------------------+
                    | Azure Data Factory       |
                    | Ingestion                |
                    +------------+-------------+
                                 |
               +-----------------+-----------------+
               |                                   |
               v                                   v
      +------------------+              +------------------+
      | ADLS Gen2        |              | SQL Managed      |
      | Raw Landing Zone |              | Instance         |
      +--------+---------+              +---------+--------+
               |                                  |
               v                                  v
      +------------------+              +------------------+
      | Databricks       |              | Reporting DB     |
      | Transformations  |              +---------+--------+
      +--------+---------+                        |
               +-------------+--------------------+
                             |
                             v
                    +------------------+
                    | Power BI         |
                    | Executive Dash   |
                    +------------------+
```

### 3.2 Example 2 — Gold-standard enterprise data flow

Security architect: arrows are movement; infrastructure is minimized; repositories are obvious.

```text
Customer
    | HTTPS
    v
App Gateway
    v
Web App
    +----------------------+
    |                      |
    v                      v
Azure SQL           Service Bus
    |                      |
    +-----------+----------+
                v
         Databricks
                v
         Fabric Lakehouse
                v
            Power BI
```

### 3.3 Example 3 — Security-focused data diagram

Most useful SecureNow overlay: identity and (later) classification on edges — **architecture plus security**.

```text
                 CUSTOMER DATA

Customer
    v
Web App
    | Managed Identity
    v
Azure SQL
(Classification: Confidential)
    | ETL
    v
Data Lake
(Classification: Confidential)
    | Analytics
    v
Power BI
```

Desired edge annotations (v2, not the first slice):

- Protocol
- Identity
- Encryption
- Classification

Example:

```text
Web App
  | TLS 1.3
  | Managed Identity
  v
Azure SQL
```

### 3.4 Example 4 — Azure-native data platform

What many organizations actually build:

```text
SAP / CRM / Oracle / Files
           v
+----------------------+
| Data Factory         |
+----------+-----------+
           v
+----------------------+
| ADLS Gen2            |
| Raw Zone             |
+----------+-----------+
           v
+----------------------+
| Databricks           |
| Curated Zone         |
+----------+-----------+
           v
+----------------------+
| Microsoft Fabric     |
| Lakehouse            |
+----------+-----------+
           v
+----------------------+
| Power BI             |
+----------------------+
```

This is the **first diagram ArchLucid can approximate** from ADF linked services + pipeline flows + storage/SQL, if **unresolved linked services become source nodes**.

### 3.5 Example 5 — Classic Level-1 DFD

Rectangles = processes; cylinders/stores = databases; arrows = movement. **Out of scope** for automatic generation from the Azure extractor. Needs named processes (application, pipeline as process, or human model).

## 4. What inventory can discover vs what the pictures need

Same snapshot, one collector family (Tier 1 PowerShell + Tier 2 hosted GET-only). No second ZIP, no secret harvest, no Kudu.

### 4.1 Already collectable (Diagram 3 first slice)

After a **fresh** extractor run that includes ADF companions (`adf-linked-services.json`, `adf-datasets.json`, `adf-pipeline-flows.json`):

```text
[Linked service target]  →  Azure Data Factory  →  [ADLS / SQL / Cosmos when resolved]
```

- **Ingestion:** `Microsoft.DataFactory/factories` (Synapse workspace is a cousin, not Databricks).
- **Stores:** Storage / ADLS, SQL server / database / MI, Cosmos, PostgreSQL / MySQL — **if** topology category stamps them `data` (IE-DD-01).
- **Declared movement:** pipeline activity `inputs` → `adfReadsFrom`, `outputs` → `adfWritesTo`. Neutral `adfLinkedService` is omitted for the same factory→target pair when a directional edge exists.
- **Network path (annotation, not spine):** private endpoint → PaaS store.

### 4.2 Missing for the gold-standard examples

| Gap | Why it matters | Path |
|-----|----------------|------|
| External sources (SAP, CRM, Oracle, files) | Linked services often have **no in-subscription ARM id**; today they emit no node | Orphan source nodes from `linkedServiceType` + sanitized host — Reader-only |
| Databricks / Fabric / Power BI as stages | Not in `ExecutiveAlwaysShowTiers` (SQL, storage, ADF, Synapse only) | Collect ARM types when present; add stage map |
| ADLS “Raw” vs “Curated” | No ARM zone property | Heuristic from container/path/name — label as inference |
| App → SQL as data movement | Example 2 / 3 spine | P1 in connection-point doc: MI + RBAC (`appAuthorizedAccess`) — **authorized**, not ETL |
| Customer → App Gateway → Web App | Entry path | Diagram 1 (network) or a later app-flow overlay — do not pretend it is ADF |
| Classification (Confidential) | Example 3 badges | Not in extractor; HumanAssertion or a separate class source |
| Observed HTTPS / TLS version | Edge protocol | Not collected; do not stamp TLS 1.3 as ObservedFact |
| Classic process DFD | Example 5 | Different modeling problem |

### 4.3 Current Data mode bug (hygiene, not the product)

`AzureInventoryTopologyCategory.Resolve` treats `Contains("/sql")` as data. `Microsoft.Sql/servers` does **not** contain `/sql` (slash is after `Sql`). Same class as the old network slash-bug. Result: **Data mode is storage + ADF/Synapse**, not SQL/Cosmos.

IE-DD-01–04: [`../architecture/INFRA_EVIDENCE_DATA_DIAGRAM_COMPOSER_PROMPTS.md`](../architecture/INFRA_EVIDENCE_DATA_DIAGRAM_COMPOSER_PROMPTS.md).

Fixing that makes SQL **eligible** for Diagram 2 / 3. It does **not** produce the SAP → ADF → ADLS → Databricks → Power BI picture by itself.

## 5. First slice (recommended)

**Goal:** one readable **Data Flow** diagram a CISO can read as origin → ingest → store, without a VNet.

1. **New compile (or a dedicated `data-flow` mode)** — stages: Source | Ingestion | Storage | Transform | Consumer. Hide network ARM types. Do not use RG swimlanes as the spine.
2. **External sources as nodes** — if a linked service does not resolve to an inventoried ARM id, still emit a node from connector type + host (`SapTable`, `Oracle`, `Https`, files). Without this, every owner example is missing the left column.
3. **ADF Prompt 7 arrows as the spine** — factory in Ingestion; SQL/ADLS in Storage; labels **Reads from** / **Writes to**. Requires re-collect + re-ingest; old ZIPs will not have pipeline-flow companions.
4. **IE-DD-01** so SQL/Cosmos stamp `data` and can sit in Storage.
5. **Empty stages stay empty** — no fake Power BI / Fabric / Confidential badges.

**Minimum viable Diagram 3:**

```text
[External: SAP / Oracle / files / host]  →  Azure Data Factory  →  [ADLS or SQL]
```

If the factory both reads and writes, two arrows — not one undirected “Connected to.”

**Honesty line (on-canvas or legend):**

> Declared ADF (and later app-authorization) wiring, not observed traffic. External systems appear when a linked service names them, even if they are not in the subscription.

## 6. Later slices (aligned, not tomorrow)

| Slice | Diagram | Notes |
|-------|---------|--------|
| App → MI → SQL / storage | 3 (second flow family) + security overlay | Connection-point **P1**; copy = may access |
| Databricks / Fabric / Power BI | 2 and 3 Transform / Analytics / Consumer | Only when the resource is in the snapshot |
| Zone labels Raw / Curated | 3 | Inference; say so |
| Security overlay | Example 3 | Identity on the edge first (MI); classification only with a real source |
| Completeness warnings in UI | Operator trust | `adf-pipeline-flows-missing`, unresolved targets |

## 7. Explicitly out of scope for this design

- Second Azure collector or apply/mutation engine ([`SECURENOW_ARCHITECT_HOLD.md`](../library/SECURENOW_ARCHITECT_HOLD.md)).
- Treating IE-DD-01 as the definition of “better database diagrams.”
- Table / schema / FK ER diagrams from SQL DMVs (new collector surface).
- Service Connector as the roadmap anchor ([`AZURE_CONNECTION_POINT_DISCOVERY.md`](../architecture/AZURE_CONNECTION_POINT_DISCOVERY.md)).
- Classic Level-1 business-process DFDs from inventory alone.
- Stamping ObservedFact onto TLS version, encryption, or Confidential classification.

## 8. Related code and docs

| Area | Pointer |
|------|---------|
| Diagram modes | `ArchLucid.ArtifactSynthesis/Models/DiagramMode.cs` |
| Category stamp | `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryTopologyCategory.cs` |
| Executive database / integration tiers | `ArchLucid.ArtifactSynthesis/Compilers/ExecutiveAlwaysShowTiers.cs` |
| ADF linked service + pipeline flow edges | `AzureInventoryAdfLinkedServiceEdgeMapper`, `AzureInventoryAdfPipelineFlowEdgeMapper` |
| Edge labels | `DiagramEdgeLabelHumanizer` — Connected to / Likely connected to / Reads from / Writes to |
| ZIP companions | `adf-linked-services.json`, `adf-datasets.json`, `adf-pipeline-flows.json` in [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) |
| Data-mode prompts (SQL in Data mode) | IE-DD-01–04 — **do not re-run from SN-DF chats** |
| Data flow / architecture **implementation prompts** | [`../architecture/SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md`](../architecture/SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md) (**SN-DF-01–08**) |
| App/MI/RBAC feasibility | [`AZURE_CONNECTION_POINT_DISCOVERY.md`](../architecture/AZURE_CONNECTION_POINT_DISCOVERY.md) |

## 9. Success criteria

**Winning:** a CISO can answer origin, ingest, and store from Azure evidence in one glance, without a VNet.

**Acceptable leftovers on the first slice:** no Confidential stamp, no Power BI consumer, no Databricks transform, no Customer→App Gateway path on this canvas (that remains Diagram 1 or a later overlay).
