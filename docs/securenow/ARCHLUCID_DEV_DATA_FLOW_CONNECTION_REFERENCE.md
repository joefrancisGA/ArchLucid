> **Scope:** Expected **Data flow** diagram connections for the ArchLucid DEV Azure subscription, derived from Terraform, CD, and threat-model docs — not from observed traffic. **Contributor-reference** — internal engineering only.
> **Created:** 2026-09-18
> **Snapshot:** ArchLucid DEV (`8aa56f3b-18bc-43ca-ad45-bad9e811d33b`), captured 2026-09-18 15:48 UTC (43 resources; 19 shown in Data flow mode, 0 relationships)
> **Spine:** [`DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md`](DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md) · [`EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md`](EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md) · [`../library/REFERENCE_SAAS_STACK_ORDER.md`](../library/REFERENCE_SAAS_STACK_ORDER.md)

# ArchLucid DEV — expected Data flow diagram connections

This note answers: **given the 19 isolated nodes on the ArchLucid DEV subscription Data flow diagram, what connections should exist?** It is grounded in repo config and deployment artifacts (`infra/terraform-*`, `.github/workflows/cd.yml`, `docs/security/SYSTEM_THREAT_MODEL.md`), not in live Azure traffic.

## What you are looking at

Snapshot **ArchLucid DEV** in **Data flow** mode. The workbench reported **19 resources in 19 connected components. 0 visible relationships** — which is honest for this snapshot if the compiler found no paintable evidence edges.

The 19 nodes, grouped by ARM family:

| Kind | Nodes on the canvas |
|------|---------------------|
| Container Apps | `archlucid-api`, `archlucid-worker`, `archlucid-ui`, `archlucid-ui-marketing` |
| ACA platform | `cae-archlucid`, two `mc-cae-archlucid-www-archa…` managed-cluster leftovers |
| SQL databases | `archlucid`, `archlucid-dev`, `archlucidtenantedev`, `master` |
| Product Key Vault | `kvrgarchluciddev8aa56f` |
| Product storage | `starchlucidevarts` |
| Terraform state | `starchlucidtfdev001` |
| Personal / leftover | Cloud Shell `cs2100120050e1d7e42`, `jftestvault1`, `kv-jafrancis…`, `stjafrancis…`, `joefrancisbackup` |

SQL **servers** are in the snapshot (Ask list shows `Microsoft.Sql/servers` + databases under `rg-ArchLucid-dev`). The canvas shows **databases**, which is the correct data-flow grain.

---

## Connections that should exist (product data plane)

From Terraform, CD, and the threat-model path — **authorized / declared wiring**, not packet capture.

### 1. Request path (the spine a CISO would expect)

```text
Browser
  → archlucid-ui                 (operator UI, ARCHLUCID_UI_ROLE=operator)
  → archlucid-api                (CD heals ARCHLUCID_API_BASE_URL to the API ingress FQDN)

Browser
  → archlucid-ui-marketing       (same UI image, ARCHLUCID_UI_ROLE=marketing)
  → archlucid-api                (same FQDN heal; marketing should not touch SQL)
```

`cae-archlucid` **hosts** those four apps. That is infrastructure attachment, not data movement. Do not put CAE or the `mc-cae-*` clusters on a data-flow spine.

Dev is cost-aware: Front Door is optional and `infra/environments/dev.example.tfvars` leaves it off, so there is usually **no** Front Door → origin hop in this subscription. Even if FD existed, Data flow mode **explicitly drops** `frontDoorToOrigin`.

### 2. API / Worker → SQL (the real store)

CD does **not** put connection strings in Terraform (`lifecycle ignore_changes` on env/secrets in `infra/terraform-container-apps/main.tf`). Completeness checks require:

- `ConnectionStrings__ArchLucid`
- `ConnectionStrings__ArchLucidSystem`
- `ArchLucid__SqlTopology__TenantCatalogConnectionStringTemplate`
- `ArchLucid__Secrets__Provider=KeyVault` + `ArchLucid__Secrets__KeyVaultUri`

Worker SQL is a **copy of the API env** (`scripts/ci/cd_heal_worker_sql_config.py`).

Edges that should exist:

| From | To | Why | Honest label |
|------|----|-----|----------------|
| `archlucid-api` | `archlucid` | Default app catalog (`sql_database_name` default `ArchLucid`) | May access / likely connected (Entra MI + connection string) |
| `archlucid-api` | `archlucid-dev` | Named catalog on this server | Same |
| `archlucid-api` | `archlucidtenantedev` | Tenant-catalog topology (`TenantCatalogConnectionStringTemplate`) | Same |
| `archlucid-worker` | those three DBs | Mirrored connection strings | Same |

Auth is **Entra managed identity inside the database** (`CREATE USER … FROM EXTERNAL PROVIDER`, `[ArchLucidApp]`), not Azure `SQL DB Contributor` on the ARM resource. That is why RBAC→data-flow often **misses SQL** even when the apps are live.

Do **not** draw API/Worker → `master`. That is the SQL platform database.

### 3. API / Worker → Key Vault

Product vault on this canvas is `kvrgarchluciddev8aa56f` (name encodes `rg-ArchLucid-dev` + subscription prefix `8aa56f`).

Terraform grants **Key Vault Secrets User** to API and Worker identities (`infra/terraform-keyvault/workload_rbac.tf`). CD requires `ArchLucid__Secrets__KeyVaultUri`.

```text
archlucid-api     ── May access (secrets) ──► kvrgarchluciddev8aa56f
archlucid-worker  ── May access (secrets) ──► kvrgarchluciddev8aa56f
```

The UIs should **not** get a vault edge unless they actually have a KV URI (they do not in Terraform).

### 4. API / Worker → artifact storage

`starchlucidevarts` is the artifact account (golden manifests, artifact bundles, extractor chunk upload, agent traces — `infra/terraform-storage`).

```text
archlucid-api     ── Storage Blob Data Contributor ──► starchlucidevarts
archlucid-worker  ── Storage Blob Data Contributor ──► starchlucidevarts
```

If Durable background jobs are on:

```text
archlucid-api     ── Queue Data Message Sender     ──► queues on starchlucidevarts
archlucid-worker  ── Queue Data Message Processor  ──► same
```

Blob Contributor **is** in the data-flow RBAC allowlist (`AzureInventoryRbacDataPlaneRoleMap`). Queue roles are **not**, so queue edges would still be missing even with a complete `role-assignments.json`.

### 5. Optional SaaS hops that belong on the picture **if present**

CD’s pre-deploy check also requires **Content Safety** endpoint/key. Terraform can wire **Azure OpenAI** (Cognitive Services OpenAI User) and **Azure AI Search**. Those accounts are **not on this 19-node canvas**, so either they live in another RG/subscription, or they were dropped because `Microsoft.CognitiveServices/*` has **no data-flow stage** (`AzureInventoryDataFlowStageResolver`).

If they exist in the snapshot, they should be:

```text
archlucid-api / archlucid-worker  ── May access ──► OpenAI account
archlucid-api / archlucid-worker  ── May access ──► Content Safety
archlucid-api / archlucid-worker  ── May access ──► Search (when Retrieval__VectorIndex=AzureSearch)
```

ACR (`acrarchluciddev`) is **image pull**, not a data store. Keep it off Data flow.

---

## Expected picture (product only)

```text
                    [Browser]
                   /          \
                  v            v
         archlucid-ui     archlucid-ui-marketing
                  \          /
                   v        v
                 archlucid-api
                    |  |  |
        +-----------+  |  +------------------+
        |              |                     |
        v              v                     v
   SQL catalogs    Key Vault           starchlucidevarts
   archlucid       kvrgarchluciddev*   blobs (+ queues if Durable)
   archlucid-dev
   archlucidtenantedev
        ^
        |
  archlucid-worker ── (same three stores)
```

Honesty on every arrow: **may access / declared wiring**, not “data flowed.”

---

## What should stay isolated (no product edges)

These are real subscription clutter. Isolates are the correct answer:

- Cloud Shell `cs2100120050e1d7e42`
- Terraform state `starchlucidtfdev001`
- Personal `kv-jafrancis…` / `stjafrancis…` / `joefrancisbackup`
- `jftestvault1` unless an app setting actually names it
- `master`
- `cae-archlucid` and the two `mc-cae-*` nodes (ACA fabric)

---

## Why the diagram is empty

Data flow only paints a **narrow evidence catalog** (`AzureInventoryDataFlowEvidenceCatalog`): ADF/Synapse reads/writes, Event Grid, Logic App connections, `appAuthorizedAccess`, Key Vault refs, hostname inference, Service Connector, PE-reachable. It **drops** contains, Front Door, diagnostics, and raw private-endpoint attachment.

For **this** subscription that means:

1. There is **no Data Factory**. The ADF-first caption is expected.
2. SQL is **Entra-in-database**, so it will not show up as `appAuthorizedAccess` unless someone also granted `SQL DB Contributor` on the database ARM id.
3. OpenAI User / AcrPull / Queue Data / Search Index / Communication roles are **outside** `AzureInventoryRbacDataPlaneRoleMap` (only Blob, KV Secrets User, a few bus/hub roles, plus coarse Reader/Contributor/Owner).
4. The strongest SQL/UI signals are **connection strings and `ARCHLUCID_API_BASE_URL`**, which need the extra-permission app-settings companion (`config/list`), not Reader-only ARM.
5. Cognitive accounts have **no stage**, so OpenAI/Content Safety would not even be nodes if they were in the ZIP.

So the missing picture is not “Azure forgot the NICs.” It is: **ArchLucid DEV’s real data plane is MI + RBAC + connection strings**, and Data flow still behaves like an **ADF diagram** unless `role-assignments.json` plus app-setting hosts actually landed in this snapshot.

---

## Related code and docs

| Area | Pointer |
|------|---------|
| Data flow compile / filter | `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs`, `DiagramDataFlowCompileSupport.cs` |
| RBAC → `appAuthorizedAccess` | `ArchLucid.Application/InfraEvidence/AzureInventoryAppAuthorizedAccessEdgeMapper.cs` |
| RBAC allowlist | `ArchLucid.Core/InfraEvidence/AzureInventoryRbacDataPlaneRoleMap.cs` |
| App-setting hostname / KV ref edges | `ArchLucid.Application/InfraEvidence/AzureInventoryAppSettingHostEdgeMapper.cs` |
| Container Apps wiring | `infra/terraform-container-apps/main.tf` |
| CD env completeness | `.github/workflows/cd.yml` |
| SQL MI pattern | `docs/security/MANAGED_IDENTITY_SQL_BLOB.md` |
| Connection-point discovery | `docs/architecture/AZURE_CONNECTION_POINT_DISCOVERY.md` |
