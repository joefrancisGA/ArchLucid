> **Scope:** Architecture feasibility — whether Azure permissions and inventory surfaces can support automatic discovery of connection points between resources. **Contributor-reference** — internal engineering only. **Not implementation.**
> **Created:** 2026-09-15 · **Revised:** 2026-09-15 (enterprise MI/RBAC priority; Service Connector de-emphasized)
> **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) · **Collector:** [`../library/AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) · **Relationship-first spine:** [`INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md) · **Hold:** [`../library/INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md`](../library/INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md)

# Azure connection-point discovery — feasibility

## Executive summary

**Yes, in part.** With sufficient Azure **read** permissions, ArchLucid can discover **many** connection points — but **not** by treating Azure as a filesystem of “config files,” and **not** as a complete runtime dependency graph.

**Recommended product framing (if pursued):**

> **Application dependency discovery** based on **managed identities, private endpoints, Azure RBAC, and ARM relationships** — not Service Connector centrism or config-file harvest.

For large enterprises, application teams typically wire dependencies with **managed identity**, **Key Vault**, **environment variables / app settings**, and **Terraform/Bicep** — not [Azure Service Connector](https://learn.microsoft.com/azure/service-connector/overview). Service Connector is useful when present but should be **opportunistic**, not the roadmap anchor.

| Layer | Feasible with Reader? | Priority | Notes |
|-------|----------------------|----------|-------|
| **Network topology** (VM→NIC→subnet, PE→target, peering, L7 backends, App Service VNet integration) | **Largely yes** | **P0** (extend IE-RF) | Already collected → `network-associations.json` |
| **ARM platform wiring** (Event Grid destinations, diagnostic settings, ADF linked services, Logic App connections) | **Mostly yes** | **P0** | High-confidence ARM IDs; extend existing collector |
| **Private endpoint app→data paths** | **Yes** | **P0** | `privateEndpointTarget` — explicit Azure record, no guessing |
| **Managed identity + RBAC authorization** | **Yes** | **P1** | App → MI → role assignment → data resource; **probable** coupling, not proven traffic |
| **App settings hostname / KV refs** (values redacted) | **Partially** | **P2** | First **extra-permission** ask (`config/list`); map FQDN → resource heuristically |
| **Service Connector linkers** | **Yes when deployed** | **P3** | High signal where it exists; uncommon in legacy enterprise estates |
| **Complete “who talks to whom” at runtime** | **No** | — | Code, default credentials, KV indirection, cross-sub, on-prem/SaaS |

The authoritative configuration for most Azure PaaS resources is **ARM JSON and platform list APIs**, not downloadable files on disk.

**What to avoid for now:** Kudu scraping, VM disk crawling, `appsettings.json` file harvest, reading secrets, source-code parsing. They create security reviews, support burden, scaling problems, and false positives without closing the graph.

---

## 1. Problem statement

**Question:** If a tenant grants ArchLucid enough Azure permissions, can we ingest configuration from various resources and infer **connection points** (edges) between them?

**Answer:** Yes for **structural** and **authorization** relationships; only partially for **application runtime** dependencies.

### 1.1 Three distinct graphs (do not collapse)

| Graph | Question it answers | Primary sources |
|-------|---------------------|-----------------|
| **Topology** | How is this NIC attached? Which PE targets this SQL server? | ARM / ARG → IE-RF `network-associations.json` |
| **Authorization** | What is this application **allowed** to access? | Managed identity + RBAC role assignments + PE network path |
| **Runtime / observed** | What **actually** called what? | App Insights map, flow logs, Network Watcher (different plane; fail-soft) |

Collapsing authorization into “confirmed dependency” creates false confidence. The product should expose **relationship confidence** and let customers decide how much trust to place in each edge (see §5).

### 1.2 What “application-to-data” means in practice

1. **Proven structural link** — Private endpoint, ARM resource ID in diagnostic destination, Event Grid subscription target.
2. **Probable architectural coupling** — Web App MI has `SQL DB Contributor` on a specific database; Function App MI has `Storage Blob Data Contributor` on a storage account. You cannot prove traffic exists, but you can say: **this application is authorized to access this service.**
3. **Inferred coupling** — Hostname `prodsql.database.windows.net` in a redacted app setting, matched heuristically to a SQL server resource in inventory.
4. **Unknown** — `DefaultAzureCredential` in code with no config entry; secret value only inside Key Vault; off-Azure endpoint.

---

## 2. Enterprise wiring reality

In regulated and large estates (financial services, government, mature Azure landing zones), teams more often use:

| Pattern | ArchLucid signal |
|---------|------------------|
| **System-assigned or user-assigned managed identity** | `identity` block on App Service, Function, Container App, VM |
| **Key Vault references** | `@Microsoft.KeyVault(SecretUri=...)` in app settings — app → vault + secret **name** (not value) |
| **Environment variables / connection string settings** | Hostname or KV ref after redacted `config/list` |
| **Terraform / Bicep / ARM templates** | Declared intent via context ingestion — separate from live inventory |
| **Private Link** | PE → PaaS target — highest-confidence app→data **network** path |

**Service Connector** (`Microsoft.ServiceLinker`) is a convenience for greenfield or portal-driven wiring. Collect it when present; **do not** design the discovery roadmap around it.

---

## 3. What ArchLucid already collects (baseline)

### 3.1 Collector contract

One Azure collector family only:

- **Tier 1:** customer-run `scripts/azure/Get-ArchLucidAzurePackage.ps1`
- **Tier 2:** hosted `HostedAzureExtractorClient` (GET-only ARM + Resource Graph)

Hosted Tier 2 ships with **`Reader`** + **`Cost Management Reader`** only ([`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md)). Never collected:

> Key Vault secret values, connection strings (plaintext), certificates/private keys, arbitrary user PII beyond resource tags.

### 3.2 Network association catalog (shipped)

`network-associations.json` rows use versioned `associationType` values from `AzureInventoryRelationshipAssociationTypes` (IE-RF-01), including:

| `associationType` | Example meaning |
|-------------------|-----------------|
| `vmToNic` | Virtual machine → network interface |
| `nicToSubnet` | NIC → subnet |
| `privateEndpointTarget` | Private endpoint → backend resource (**app→data gold**) |
| `vnetPeering` | VNet ↔ VNet peering |
| `agwToBackend` / `lbToBackend` | L7/L4 backend pool members |
| `appServiceToSubnet` | App Service VNet integration |
| `privateDnsVnetLink` | Private DNS zone → VNet link |

Collection uses **Resource Graph typed projections** (Tier 1) and **type-scoped ARM list GETs** (hosted path). See [`INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md).

### 3.3 Role assignments (partial / adjacent)

`AzureInventorySnapshot` can materialize `AzureInventoryRoleAssignments` from inventory packages (see `SqlAzureInventorySnapshotRepository`, SecureNow architect path engines). **Privilege and capability-to-flow engines already consume MI + RBAC rows.** Extending the **main** ArchLucid extractor to emit `role-assignments.json` on every Tier 1/2 ZIP is IE backlog (see [`INFRA_EVIDENCE_COMPOSER_PROMPTS_IE01_IE08.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS_IE01_IE08.md)).

### 3.4 What baseline does *not* yet answer

- Full **application → MI → RBAC → data resource** chain in architecture diagrams for every review.
- Which Web App “depends on” SQL when the only signal is a **hostname** in app settings (not yet collected on standard Tier 1).
- Whether runtime traffic actually flows (authorization ≠ usage).

---

## 4. Recommended discovery priorities

**Not authorized by this document.** Ordered for **enterprise** estates and **Reader-first** posture.

### 4.1 P0 — Mine ARM relationships harder (extend IE-RF)

Stay within `Reader`. Add typed associations from ARM/ARG for surfaces already named in IE backlog:

| Surface | Edge example | Confidence |
|---------|--------------|------------|
| **Private endpoints** | App / PE → SQL, Storage, Key Vault | **Proven** |
| **Event Grid** | Topic → destination resource ID | **Proven** |
| **Diagnostic settings** | Resource → Log Analytics / Storage account | **Proven** |
| **ADF linked services** | Factory → linked datastore (resource id or typed host) | **Proven** / **Probable** |
| **Logic Apps connections** | Workflow → `Microsoft.Web/connections` API resource | **Probable** |
| **Managed identity on compute** | App / Function / VM → UAMI resource ID | **Proven** (identity attachment only) |

No new scary permissions. Fits one collector family.

### 4.2 P1 — Managed identity + RBAC intelligence (highest differentiated value)

Join three inventory facts:

```text
WebApp1  →  (system-assigned MI principalId)
              →  role assignment (SQL DB Contributor @ database scope)
              →  SQL Database

FunctionApp  →  (user-assigned MI)
              →  role assignment (Storage Blob Data Contributor)
              →  Storage Account
```

**Product language:** **probable dependency** or **authorized access** — not “confirmed dependency.”

| Benefit | Limitation |
|---------|------------|
| Answers “what can this app access?” | Does not prove traffic |
| Aligns with SecureNow privilege / blast-radius engines | Broad subscription-scoped roles inflate blast radius — surface scope explicitly |
| `Reader` can list role assignments at subscription/RG scope | PrincipalId → resource mapping requires resolving MI objects in inventory |

Map to existing types: `ProvenanceKind.DerivedFact` or `DeterministicInference` for the composed hop; `PathConfidenceBand.Probable` (see §5).

### 4.3 P2 — Parse app settings without secrets (first extra-permission tier)

When product accepts a **new trust-center row**, allow optional `Microsoft.Web/sites/config/list` (and equivalents) with **strict redaction**:

| Collect | Never persist |
|---------|---------------|
| Setting **name** | Password, shared access key, client secret |
| Parsed **hostname** from `Server=tcp:prodsql.database.windows.net` | Full connection string value |
| Key Vault URI **host** + secret name from `@Microsoft.KeyVault(...)` | Secret value |

Then **heuristically** map `prodsql.database.windows.net` → SQL server resource in the same subscription inventory. Mark as **Inferred** / `PathConfidenceBand.Possible` unless ARM ID is present.

Redaction regressions are buyer incidents (see `AL_BUG_HUNT_LEDGER` — `siteConfig.connectionString` nested leak). This path needs hard ingest tests before any pilot.

### 4.4 P3 — Service Connector (opportunistic)

When `Microsoft.ServiceLinker/linkers` exist, emit app → target ARM ID edges as **Proven**. Do not require customers to adopt Service Connector. Do not block other priorities on linker presence.

### 4.5 Deferred — explicitly out of scope for near-term roadmap

| Approach | Why defer |
|----------|-----------|
| Kudu / SCM file scrape | Security review, scaling, stale slots |
| VM disk / AKS ConfigMap crawl | Same |
| Reading Key Vault secret values | Secret exfiltration |
| Source code parsing | Out of inventory plane |
| App Insights application map as primary topology | Runtime ≠ declared; different `ProvenanceKind` |

---

## 5. Relationship confidence model

Customers should filter edges by trust. Align product UX with existing infra-evidence enums where possible.

### 5.1 Customer-facing bands

| Band | Typical signals | Indicative confidence | Maps to |
|------|-----------------|----------------------|---------|
| **Proven** | Private endpoint target, ARM resource ID in platform wiring, Service Connector linker | 95–100% structural | `ProvenanceKind.ObservedFact` + `PathConfidenceBand.Confirmed` |
| **Probable** | MI + RBAC role on specific resource scope; Key Vault reference (app → vault, not secret contents); ADF/Logic typed link | 70–90% authorization / coupling | `ProvenanceKind.DerivedFact` + `PathConfidenceBand.Probable` or `HighlyLikely` |
| **Inferred** | Hostname match; naming conventions; DNS alias; NSG allow-rule heuristics | 50–70% | `ProvenanceKind.DeterministicInference` + `PathConfidenceBand.Possible` |
| **Observed (runtime)** | Flow logs, App Insights dependencies | Traffic fact — not intent | Separate stream; never merge silently with Proven |

**Rule:** Never label hostname-only or RBAC-only edges as **confirmed runtime dependency**. Authorization answers a different architect question — often the more important one:

> **“What can this application access?”** is frequently more valuable than **“what string was found in a config file?”**

### 5.2 Edge types vs graph kind

| Edge label in UI | Graph |
|------------------|-------|
| “Connected to (network)” | Topology |
| “Authorized to access” | Authorization |
| “Observed call” | Runtime (optional, fail-soft) |

---

## 6. Evidence sources — taxonomy

| Source | Examples | Permissions | Typical band |
|--------|----------|-------------|--------------|
| **ARM / Resource Graph** | PE, NIC, diagnostics, Event Grid, identity blocks | `Reader` | Proven |
| **RBAC role assignments** | Principal → role → scope | `Reader` (list at scope) | Probable (when joined to app MI) |
| **Platform config list APIs** | App settings, connection string **names** + redacted hostnames | Beyond `Reader` | Probable / Inferred |
| **Service Connector** | Linker resources | `Reader` | Proven (when present) |
| **Azure App Configuration** | Key names, endpoint refs | App Configuration Data Reader | Probable |
| **Container Apps env** | Env var names, `secretRef` on ARM GET | `Reader` | Probable |
| **Files (Kudu, disk, ConfigMap)** | `appsettings.json` on disk | Elevated / network path | **Avoid** |
| **Runtime telemetry** | App Insights, flow logs | Monitor / NW roles | Observed (separate plane) |

App Service settings are **not files** — they live behind `Microsoft.Web/sites/config/list/action`, which subscription `Reader` does **not** include.

---

## 7. Architectural constraints (plane invariants)

From [`INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) and [`INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md`](../library/INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md):

| Constraint | Implication |
|------------|-------------|
| **One collector family** | Extend `Get-ArchLucidAzurePackage.ps1` + hosted client only |
| **No customer write roles** | Never require Owner / Contributor |
| **Never persist secret values** | Hostnames, KV URI hosts, ARM IDs, principal IDs only |
| **No ARM `dependsOn` as architecture** | Deploy DAG ≠ topology or data-flow intent |
| **No Azure HTTP at diagram render** | Snapshot inputs only |
| **Provenance on every edge** | Map to §5 bands; never upgrade Inferred → Proven silently |

### 7.1 Wrong primary sources (hold)

- ARM template `dependsOn` arrows
- Network Watcher topology as primary graph (IE-RF-10 optional supplement only)
- NSG flow logs / VM Insights as architecture edges
- Kudu file tree as canonical config

---

## 8. Non-functional considerations

### 8.1 Security

- `config/list` is a **trust-boundary change** — new RBAC template + trust-center language.
- RBAC listing is read-only and usually acceptable; still document scope (subscription vs MG).
- Key Vault: metadata and secret **names** only — never values.

### 8.2 Scalability

- ARG projections and type-scoped lists scale; per-app `config/list` is O(apps).
- Fail soft per resource type; completeness warnings in `manifest.json`.

### 8.3 Reliability

- Broad MI role assignments (subscription scope) produce **valid but coarse** edges — UX must show scope.
- ADF/Logic connection payloads vary; some links stay hostname-only → Probable at best.
- Cross-subscription PE or MI may not resolve in a single-subscription ZIP.

### 8.4 Cost

- API charges are minor; **InfoSec review** and **ingest storage** dominate.

---

## 9. Suggested association extensions (illustrative)

Future `associationType` values follow IE-RF-01 catalog rules:

| Proposed type | From → to | Confidence band |
|---------------|-----------|-----------------|
| `diagnosticToDestination` | Resource → Log Analytics / Storage | Proven |
| `eventGridToDestination` | Topic → handler resource | Proven |
| `adfLinkedService` | Data factory → linked store | Proven / Probable |
| `logicAppConnection` | Workflow → API connection | Probable |
| `identityToRoleAssignment` | MI principal → role @ scope | Probable (hop) |
| `appAuthorizedAccess` | Compute → data resource (derived MI+RBAC chain) | Probable |
| `appToKeyVaultRef` | App → Key Vault (from KV URI in setting name) | Probable |
| `hostnameInferredTarget` | App → ? (FQDN match) | Inferred |
| `serviceConnectorLink` | App → target (when linker exists) | Proven |

---

## 10. Decision record

| Decision | Status |
|----------|--------|
| Network topology via ARG + type-scoped ARM lists | **In progress / partially shipped** (IE-RF-01–11) |
| **Roadmap anchor:** MI + RBAC + PE + ARM (not Service Connector) | **Recommended** — this document |
| Extend ARM platform wiring (diagnostics, Event Grid, ADF, Logic) | **Recommended P0** |
| MI + RBAC authorization graph in architecture evidence | **Recommended P1** — extends SecureNow-adjacent materialization |
| App settings hostname parse (redacted `config/list`) | **Feasible P2** — requires RBAC + trust-center update |
| Service Connector edges | **Opportunistic P3** when linkers exist |
| Config file / Kudu / secret harvest | **Not planned** near-term |
| Complete runtime dependency graph from inventory | **Infeasible** |

---

## 11. Related documentation

| Document | Relevance |
|----------|-----------|
| [`INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) | Plane invariants, one collector |
| [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) | Tier 1/2 roles, never-collected categories |
| [`AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`](../library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md) | IE-RF backlog |
| [`INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md) | P0 ARM relationship collection |
| [`SECURENOW_ARCHITECT_PLANE.md`](../library/SECURENOW_ARCHITECT_PLANE.md) | Privilege / path engines consuming RBAC rows |
| [`../library/CLOUD_CONNECTIONS.md`](../library/customer-facing/CLOUD_CONNECTIONS.md) | Customer-facing Tier 1 vs Tier 2 |
