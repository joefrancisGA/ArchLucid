> **Scope:** Contributor-reference — Operator and customer onboarding for Azure extractor Tier 1 (local ZIP) and Tier 2 (hosted WIF pull).

# Azure extractor

ArchLucid ingests read-only Azure inventory from a schema-versioned ZIP produced either by the customer-run PowerShell collector (**Tier 1**) or by ArchLucid's hosted collector (**Tier 2**, opt-in). **Production customer-owned cadence:** schedule the same Tier 1 collector as an Azure Automation runbook or Function timer so operators do not pull from a command line or UI — see [`docs/runbooks/AZURE_EXTRACTOR_SCHEDULED_AGENT.md`](../runbooks/AZURE_EXTRACTOR_SCHEDULED_AGENT.md).

## Tier 1 — customer-run PowerShell

- Script: [`scripts/azure/Get-ArchLucidAzurePackage.ps1`](../../scripts/azure/Get-ArchLucidAzurePackage.ps1)
- Upload: `POST /v1/azure-extractor/upload` (multipart `file`, optional `runId`)
- No ArchLucid credentials run in the customer tenant.
- **Scheduled agent (recommended for production):** [`deploy/customer-templates/scheduled-agent/`](../../deploy/customer-templates/scheduled-agent/) — Automation runbook (Terraform) or Function timer wrapping `Invoke-ArchLucidScheduledAzureExtractor.ps1`.

## Tier 2 — cloud-hosted extractor (Workload Identity Federation)

Customers who cannot run local scripts provision a **read-only service principal** in their tenant and trust ArchLucid's user-assigned managed identity via **federated credentials**. ArchLucid stores only `customerTenantId` + `customerAppId` + `subscriptionId` — **never client secrets**.

### Customer onboarding (run once in customer tenant)

| Artifact | Path |
|----------|------|
| Terraform | [`deploy/customer-templates/terraform/`](../../deploy/customer-templates/terraform/) |
| Bicep | [`deploy/customer-templates/bicep/main.bicep`](../../deploy/customer-templates/bicep/main.bicep) |

Parameters (published by ArchLucid):

- `archLucidTenantId`
- `archLucidManagedIdentityObjectId`

Creates:

- Service principal `archlucid-readonly-extractor`
- Federated identity credential (issuer = ArchLucid tenant, subject = ArchLucid MI object id)
- Role assignments: **`Reader`** and **`Cost Management Reader`** on the subscription only

Outputs: `customer_app_id`, `customer_tenant_id` — paste into ArchLucid.

### ArchLucid operator API (Admin / ExecuteAuthority)

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /v1/admin/azure-extractor/hosted/configure` | Admin | Persist `{ CustomerTenantId, CustomerAppId, SubscriptionId, IncludeCost }` in `dbo.TenantHostedExtractorConfigurations` |
| `GET /v1/admin/azure-extractor/hosted/configuration?subscriptionId=` | Admin | Read back tenant row |
| `POST /v1/admin/azure-extractor/hosted/run` | ExecuteAuthority | Collect via WIF + ingest through existing upload pipeline |

Configuration gate: `HostedAzureExtractor:Enabled` (default `false`).

Audit: `Integration.HostedAzureExtractorConfigured` on configure.

### Trust boundary

- Hosted ARM collection uses **GET-only** calls to `management.azure.com` (Resource Manager list resources).
- Cost Management and Policy Insights surfaces that require POST are **not** collected on the hosted path; Tier 1 PowerShell remains the full-fidelity collector.
- No write or destructive ARM operations.

### Azure Data Factory linked services (optional companion)

Both Tier 1 and Tier 2 collectors may emit **`adf-linked-services.json`**: sanitized metadata from the read-only ARM endpoint `GET …/Microsoft.DataFactory/factories/{factory}/linkedservices?api-version=2018-06-01`.

| Collected | Never collected |
|-----------|-----------------|
| Factory and linked-service ARM ids | Connection strings, passwords, keys, tokens |
| Connector type (`AzureBlobStorage`, `AzureSqlDatabase`, …) | Raw `typeProperties` blobs |
| Target ARM resource id when explicit | `SecureString` / `encryptedCredential` values |
| Sanitized hostname (`*.blob.core.windows.net`, …) | Runtime traffic claims |

Materialized snapshot relationships use association types **`adfLinkedService`** (observed ARM target) and **`adfLinkedServiceInferred`** (unique hostname match). Diagram labels: **Connected to** / **Likely connected to**.

When **`adf-datasets.json`** and **`adf-pipeline-flows.json`** companions are present, declared pipeline activity inputs/outputs are joined through dataset → linked service → target to emit directional edges **`adfReadsFrom`** / **`adfWritesTo`** (DerivedFact). Diagram labels: **Reads from** / **Writes to**. Neutral **`adfLinkedService`** edges are omitted for the same factory→target pair when a directional edge exists.

| Companion | ARM source |
|-----------|------------|
| `adf-datasets.json` | `GET …/factories/{factory}/datasets?api-version=2018-06-01` |
| `adf-pipeline-flows.json` | Derived from `GET …/factories/{factory}/pipelines?api-version=2018-06-01` activity `inputs` / `outputs` (static references only; nested `ExecutePipeline` up to depth 3) |

Optional Tier 1 switch **`-IncludeAppSettingsHosts`** may emit **`app-settings-hosts.json`** via POST `config/appsettings/list` and `config/connectionstrings/list` (requires `microsoft.web/sites/config/list/action` or equivalent per site). We persist setting names, parsed hostnames, and Key Vault URI host/secret name only — never values. Hosted Tier 2 emits manifest warning `app-settings-not-collected-hosted-get-only` and does not call those APIs.

| Companion | ARM source |
|-----------|------------|
| `service-connector-links.json` | `GET …/providers/Microsoft.ServiceLinker/linkers?api-version=2022-11-01-preview` on Web sites and Container Apps |
| `app-settings-hosts.json` | Tier 1 only: POST `config/appsettings/list` + `config/connectionstrings/list` when `-IncludeAppSettingsHosts` |

See [`docs/architecture/AZURE_CONNECTION_POINT_DISCOVERY.md`](../architecture/AZURE_CONNECTION_POINT_DISCOVERY.md) and [`AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md`](../architecture/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md) for the shipped AX-DE collection set.

### Automated continuous pull (V1.x — ArchLucid-hosted)

**V1 GA** ships Tier 1 upload, **on-demand** hosted collection (`POST /v1/admin/azure-extractor/hosted/run`), and **leader-elected background polling** (`AzureExtractorAutoPullHostedService` → `AzureExtractorAutoPullOrchestrator` → `HostedAzureExtractorRunService` → ingest pipeline). Polling is **off by default** (`AzureExtractor:AutoPull:Enabled=false`); hosted collection also requires `HostedAzureExtractor:Enabled=true`. See [V1_DEFERRED.md §6p](V1_DEFERRED.md) for V1.x hardening notes.

**Approved architecture pattern (resolved 2026-05-23):**

| Layer | Decision |
|-------|----------|
| Customer identity | Customer-provisioned **read-only service principal** with **`Reader`** + **`Cost Management Reader`** on subscription or management group scope. |
| Trust | **Federated workload identity** — customer federated credential trusts ArchLucid's **user-assigned managed identity** (preferred over long-lived client secrets). |
| ArchLucid storage | Persist only `{ customerTenantId, customerAppId, subscriptionId, includeCost }` in `dbo.TenantHostedExtractorConfigurations` — **never** customer client secrets. |
| Token exchange | Worker uses **`ClientAssertionCredential`** with ArchLucid MI assertion → customer SP token (`WorkloadIdentityHostedAzureExtractorCredentialFactory`; scope default `api://AzureADTokenExchange/.default`). |
| Ingest path | Collected ZIP flows through **`HostedAzureExtractorClient`** into the existing upload/audit pipeline (same events as manual upload). |
| Operations | Leader-elected loop gated by `AzureExtractor:AutoPull:Enabled` (default `false`) and `AzureExtractor:AutoPull:IntervalMinutes` (15–10080). |

**Customer-owned alternative (available today):** schedule `Get-ArchLucidAzurePackage.ps1` via the **scheduled agent** (Automation runbook / Function) or customer CI and POST the ZIP — no ArchLucid standing credentials. See [`docs/runbooks/AZURE_EXTRACTOR_SCHEDULED_AGENT.md`](../runbooks/AZURE_EXTRACTOR_SCHEDULED_AGENT.md) and [`docs/runbooks/AZURE_EXTRACTOR_TIER2_CONTINUOUS.md`](../runbooks/AZURE_EXTRACTOR_TIER2_CONTINUOUS.md).

See also: [`docs/runbooks/AZURE_EXTRACTOR_INGEST.md`](../runbooks/AZURE_EXTRACTOR_INGEST.md), [`docs/library/V1_SCOPE.md`](V1_SCOPE.md) §2.16.
