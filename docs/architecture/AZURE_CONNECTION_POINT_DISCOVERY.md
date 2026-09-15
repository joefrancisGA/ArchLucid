> **Scope:** Architecture feasibility — whether Azure permissions and config surfaces can support automatic discovery of connection points between resources. **Contributor-reference** — internal engineering only. **Not implementation.**
> **Created:** 2026-09-15
> **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) · **Collector:** [`../library/AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) · **Relationship-first spine:** [`INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md) · **Hold:** [`../library/INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md`](../library/INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md)

# Azure connection-point discovery — feasibility

## Executive summary

**Yes, in part.** With sufficient Azure **read** permissions, ArchLucid can discover **many** connection points between resources — but **not** by treating Azure as a filesystem of “config files,” and **not** as a complete application dependency graph.

| Layer | Feasible with Reader? | Notes |
|-------|----------------------|-------|
| **Network topology** (VM→NIC→subnet, PE→target, peering, L7 backends, App Service VNet integration) | **Largely yes** | Already collected via ARM / Resource Graph → `network-associations.json` |
| **Platform wiring** (diagnostics destinations, Event Grid targets, identity attachments, failover groups) | **Mostly yes** | ARM properties and list APIs; often ARM IDs |
| **Application dependencies** (Web App→SQL, Function→Storage, ADF linked services) | **Partially** | Needs config **list** APIs, Service Connector, or hostname heuristics — not `Reader` alone |
| **Complete “who talks to whom”** | **No** | Code, managed identity defaults, Key Vault indirection, cross-subscription, and on-prem/SaaS endpoints leave permanent gaps |

The authoritative configuration for most Azure PaaS resources is **ARM JSON and platform list APIs**, not downloadable files on disk. File harvest (Kudu `appsettings.json`, VM disks, AKS ConfigMaps) is a **last resort**: noisy, secret-heavy, and operationally expensive.

---

## 1. Problem statement

**Question:** If a tenant grants ArchLucid enough Azure permissions, can we ingest “config files” from various resources and infer **connection points** (edges) between them?

**Answer framing:**

1. **Network attachment** — “How is this NIC on this subnet?” “Which private endpoint targets this SQL server?” — **high confidence** from ARM relationship IDs; this is the **IE-RF** program.
2. **Application/data flow** — “Which App Service uses which database?” — **medium confidence** only when Azure exposes an explicit link (Service Connector, private endpoint, diagnostic destination, managed identity on a known resource). Hostname-only connection strings require **heuristic inference** with explicit provenance.
3. **Runtime truth** — “What actually called what last Tuesday?” — **different plane** (App Insights application map, flow logs, Network Watcher). Observed traffic ≠ intended architecture; do not promote to primary topology ([`INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md`](../library/INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md)).

---

## 2. What ArchLucid already collects (baseline)

### 2.1 Collector contract

One Azure collector family only:

- **Tier 1:** customer-run `scripts/azure/Get-ArchLucidAzurePackage.ps1`
- **Tier 2:** hosted `HostedAzureExtractorClient` (GET-only ARM + Resource Graph)

Hosted Tier 2 ships with **`Reader`** + **`Cost Management Reader`** only ([`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md)). The script header states what is **never** collected:

> Key Vault secret values, connection strings, certificates/private keys, arbitrary user PII beyond resource tags.

### 2.2 Network association catalog (shipped)

`network-associations.json` rows use versioned `associationType` values from `AzureInventoryRelationshipAssociationTypes` (IE-RF-01), including:

| `associationType` | Example meaning |
|-------------------|-----------------|
| `vmToNic` | Virtual machine → network interface |
| `nicToSubnet` | NIC → subnet |
| `privateEndpointTarget` | Private endpoint → backend resource |
| `vnetPeering` | VNet ↔ VNet peering |
| `agwToBackend` / `lbToBackend` | L7/L4 backend pool members |
| `appServiceToSubnet` | App Service VNet integration |
| `privateDnsVnetLink` | Private DNS zone → VNet link |

Collection uses **Resource Graph typed projections** (Tier 1) and **type-scoped ARM list GETs** (hosted path when ARG truncates or properties are empty). See [`INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md).

### 2.3 What baseline does *not* answer

- Which Function App’s **application code** opens which SQL database when only `DefaultAzureCredential` + DNS are used.
- Which Web App “depends on” Storage when the link exists only as a **connection string value** (not an ARM ID).
- Cross-subscription or external SaaS endpoints referenced only by hostname in app settings.

---

## 3. Evidence sources — “config files” vs Azure reality

### 3.1 Source taxonomy

| Source | Examples | Typical permissions | Graph quality |
|--------|----------|-------------------|---------------|
| **ARM / Resource Graph properties** | NIC `subnet.id`, PE `privateLinkServiceConnections`, diagnostic `workspaceId`, SQL failover group IDs | `Reader` | **High** — typed ARM resource IDs |
| **Platform config list APIs** (not files) | App Service / Functions `config/list` (app settings, connection strings); ADF `linkedServices`; Logic App `Microsoft.Web/connections`; Container Apps env vars | **Beyond Reader** — data/list actions per resource provider | **Medium** — hostnames, Key Vault refs, mixed secrets |
| **Azure Service Connector** (`Microsoft.ServiceLinker`) | First-party “this site is linked to this SQL/Storage/Redis” resources | Usually `Reader` on linker resources | **High** for app-layer edges Azure models explicitly |
| **Azure App Configuration** | Centralized key/value config | App Configuration Data Reader | **Medium** — often endpoints; values often secrets |
| **Actual files** | Kudu SCM `appsettings.json`, files on VM disks, AKS ConfigMaps, blobs | Website Contributor, VM extensions, AKS cluster user, Storage Blob Data Reader | **Low** — stale, duplicated, secret-heavy |
| **Runtime observation** | Application Insights dependency map, NSG flow logs, Network Watcher topology | Monitor / Insights / Network Watcher roles | **ObservedFact** — not intended topology |

Most PaaS resources **do not** expose architecture as a downloadable config file. App Service settings live behind actions such as `Microsoft.Web/sites/config/list/action`, which are **not** included in subscription `Reader`.

Container Apps are a partial exception: environment variable **names** and `secretRef` targets often appear on a normal ARM GET without a separate list call — useful for naming dependencies without reading secret values.

### 3.2 What extra permissions would unlock (application layer)

If product direction later expands the collector contract (new trust-center claim + RBAC template), these surfaces are the highest-signal **application** edges:

| Surface | What it reveals | Secret risk |
|---------|-----------------|-------------|
| **Service Connector** linkers | Source app → target resource ARM IDs | Low — structured IDs |
| **App Service / Functions `config/list`** | Connection string **names**, `@Microsoft.KeyVault(...)` refs, hostnames in values | **High** — values must be redacted; never persist plaintext |
| **Data Factory linked services** | `type`, host, linked resource id | Medium — connection strings may be present |
| **Logic Apps connections** | `properties.api.id`, display names | Low–medium |
| **Event Grid / Service Bus / Front Door** | Destination resource IDs in ARM | Low |
| **Managed identities on apps** | `identity` blocks → UAMI / system-assigned | Medium — implies *capability* to call Azure APIs, not which resource |

**Still incomplete even with Owner:**

- SDK default credential chains with no config entry.
- Connection strings that reference DNS/CNAME/failover listener names instead of ARM IDs.
- Secrets resolved only inside Key Vault (app stores URI reference only).
- Guest OS / deployment package configs (slots, `WEBSITE_RUN_FROM_PACKAGE`, stale Kudu files).
- Off-Azure endpoints (on-prem SQL, third-party APIs).

---

## 4. Architectural constraints (plane invariants)

These constraints from [`INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) and [`INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md`](../library/INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md) apply to any future connection-point work:

| Constraint | Implication for connection discovery |
|------------|----------------------------------------|
| **One collector family** | Extend `Get-ArchLucidAzurePackage.ps1` + hosted client — no parallel harvest ZIP |
| **No customer write roles** | Never require Owner / Contributor for collection |
| **Never collect KV secret values or connection string plaintext** | Parse **names**, Key Vault URI hosts, ARM IDs; redact values (see ingest redaction incidents in `AL_BUG_HUNT_LEDGER` for `siteConfig.connectionString`) |
| **Do not use ARM `dependsOn` as architecture** | Deploy DAG ≠ VM∈VNet or data-flow intent |
| **Do not use live ARM export as intent** | `Export-AzResourceGroup` is deployed state, not IaC source of truth |
| **Do not call Azure at diagram render time** | Associations are snapshot inputs, append-only |
| **Provenance on every edge** | `Observed` when payload contains ARM ID; `DeterministicInference` for hostname/heuristic matches |

### 4.1 Wrong primary sources (explicit hold)

Do **not** treat these as the main architecture graph:

- ARM template `dependsOn` arrows
- Network Watcher topology API (optional fail-soft supplement only — IE-RF-10)
- NSG flow logs / VM Insights (observed traffic)
- Application Insights application map (runtime, may differ from declared config)
- Kudu file tree as canonical app config

---

## 5. Non-functional considerations

### 5.1 Security

- Listing App Service connection strings is **secret exfiltration** from the customer’s perspective. Any expansion beyond `Reader` requires a **new procurement / trust-center row**, customer-approved RBAC, and ingest redaction guarantees.
- Hosted path is **GET-only** by design ([`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md)). Config `list` POST actions are a trust-boundary change.
- Key Vault: collect **metadata** (name, location, access policies, secret *names* and timestamps for lifecycle engines) — never secret **values**.

### 5.2 Scalability

- Per-resource `config/list` and Kudu walks are **O(resources)** ARM/SCM calls with throttling risk. Resource Graph projections and type-scoped lists scale better.
- ARG `properties` **truncates** on large objects; hosted list GETs are the fill path (IE-RF-03).
- Fail soft per resource type; completeness metadata in `manifest.json` (IE-01 pattern).

### 5.3 Reliability

- Custom RBAC roles may omit `list` actions → 403 gaps, not hard failures.
- Private endpoints block Kudu/SCM from ArchLucid-hosted collectors unless customer network paths exist.
- Cross-subscription links appear as hostnames only unless Service Connector or PE spans are visible in-scope.

### 5.4 Cost

- Marginal Azure API charges are small; **InfoSec review time** and **ZIP size / ingest storage** dominate customer cost of broader collection.

---

## 6. Recommended evolution (if product picks this up)

**Not authorized by this document.** If engineering later extends connection discovery, prefer this order:

```text
1. Service Connector + existing ARM relationship IDs     (highest signal, lowest secret risk)
2. Container Apps env / secretRef names                  (often on ARM GET)
3. Diagnostic settings, Event Grid, identity attachments (already partially collected)
4. App Service config/list — hostnames + KV refs only    (new RBAC + redaction contract)
5. Hostname → resource heuristic matcher                 (DeterministicInference, never Observed)
6. File / Kudu harvest                                 (avoid unless explicitly customer-run Tier 1 opt-in)
```

### 6.1 Suggested association extensions (illustrative)

Future `associationType` values should follow IE-RF-01 catalog rules:

| Proposed type | From → to | Provenance when |
|---------------|-----------|-----------------|
| `appServiceConnector` | Web app / function → SQL, Storage, Redis, etc. | Service Connector ARM resource |
| `appToKeyVaultRef` | App → Key Vault | App setting `@Microsoft.KeyVault(SecretUri=...)` **host only** |
| `diagnosticToDestination` | Resource → Log Analytics / Storage | Diagnostic settings ARM ID |
| `hostnameInferredTarget` | App → ? | Hostname match only — **DeterministicInference** |

Never mark hostname-only edges as `Observed`.

---

## 7. Decision record

| Decision | Status |
|----------|--------|
| Network connection points via ARG + type-scoped ARM lists | **In progress / partially shipped** (IE-RF-01–11) |
| Application connection points via config file harvest | **Not planned** — wrong abstraction for Azure PaaS |
| Application connection points via Service Connector + config list (redacted) | **Feasible future extension** — requires RBAC + trust-center update |
| Complete dependency graph from Azure inventory alone | **Infeasible** — permanent gaps from code, MI, and external endpoints |

---

## 8. Related documentation

| Document | Relevance |
|----------|-----------|
| [`INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) | Plane invariants, one collector, no write roles |
| [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) | Tier 1/2 roles, trust boundary, never-collected categories |
| [`AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`](../library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md) | IE-RF relationship-first backlog item |
| [`INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md) | Authorized collection patterns |
| [`SECURENOW_ARCHITECT_PLANE.md`](../library/SECURENOW_ARCHITECT_PLANE.md) | Consumer of network associations for path engines |
| [`../library/CLOUD_CONNECTIONS.md`](../library/customer-facing/CLOUD_CONNECTIONS.md) | Customer-facing Tier 1 vs Tier 2 posture |
