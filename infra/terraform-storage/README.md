# terraform-storage — large artifact blob storage

Creates an Azure Storage account (blob only usage) and private containers aligned with API **`ArtifactLargePayload`**:

| Container | Used for |
|-----------|----------|
| `golden-manifests` | Consolidated golden manifest JSON envelope |
| `artifact-bundles` | Combined artifacts + trace JSON per bundle |
| `artifact-contents` | Per-artifact body when row content is offloaded |
| `azure-extractor-chunk-upload` | Temporary staging for chunked extractor ZIP uploads (`AzureExtractorChunkUpload` pipeline) |
| `agent-traces` | Full LLM prompt/response forensics (`AgentExecutionTraceRecorder`; paths `{runId}/{traceId}/*.txt`) |

## Wiring

Do **not** commit **`tfplan`** / **`*.tfplan`** into this directory — Trivy IaC scans treat them as **`terraformplan-snapshot`** inputs; a stale plan can resurrect cleared misconfigurations in CI. Plans belong in CI artifacts or a local path ignored by git (see **`.gitignore`**).

1. Apply with `enable_storage_account = true` and a unique `storage_account_name`.
2. Set API **`ArtifactLargePayload:AzureBlobServiceUri`** to **`primary_blob_endpoint`** (include trailing slash optional; the client normalizes the service URI).
3. Grant the API **managed identity** **Storage Blob Data Contributor** on this storage account (or subscription scope if your policy allows).
4. For private access only: set **`public_network_access_enabled = false`**, deploy **`terraform-private`** blob private endpoint using **`storage_account_id`**, and ensure compute (e.g. Container Apps) has VNet integration to resolve `privatelink.blob.core.windows.net`.

## Agent trace blob lifecycle (Improvement #13)

When **`agent_trace_blob_lifecycle_enabled`** is **true** (default), **`azurerm_storage_management_policy`** applies to **`agent-traces/`** block blobs:

| Variable | Default | Purpose |
|----------|---------|---------|
| `agent_trace_blob_cool_tier_after_days` | **30** | Tier to **Cool** after N days since last modification (cost control). |
| `agent_trace_blob_delete_after_days` | **365** | Delete after M days since last modification (compliance cap). |

**Environment examples:** **`production.tfvars.example`** (30 / 365) and **`staging.tfvars.example`** (7 / 90). Staging uses shorter retention by design.

### Interaction with `AgentResultBlobCleanupHostedService`

| Mechanism | Scope | Trigger |
|-----------|-------|---------|
| **App orphan cleanup** (`DataArchival:BlobCleanup:Enabled`, default Production) | Deletes blobs under **`agent-traces`** whose **run id** no longer exists in **`dbo.Runs`**, only when blob age ≥ **`MinAgeDays`** (default **30**). | Leader-elected daily loop; metric **`archlucid_data_archival_blobs_deleted_total`**. |
| **Storage lifecycle (this module)** | Tier/delete **all** matching **`agent-traces/`** blobs by **last-modified age**, regardless of SQL run existence. | Azure Storage management policy (async). |

Both may delete the same blob safely: app **`DeleteBlobIfExists`** and lifecycle delete are idempotent. There is **no double-delete race** — the second operation is a no-op. Set **`agent_trace_blob_delete_after_days`** ≥ your forensic retention policy and ≥ **`DataArchival:BlobCleanup:MinAgeDays`** so active investigations are not cut off prematurely.

Operator runbooks: **`docs/runbooks/DATA_ARCHIVAL_HEALTH.md`**, **`docs/runbooks/BACKUP_RESTORE_DRILL.md`**.

## Security

- Containers are **private**; no anonymous blob access.
- **Network default is Deny** via **`azurerm_storage_account_network_rules`** (`default_action = "Deny"`); trusted Azure services can bypass per `bypass = ["AzureServices"]`. Add **`network_rule_subnet_ids`** (service endpoints) and/or **`network_rule_ip_allowlist`** only where you intentionally need public-path access. (Do not add a second `network_rules` block on the storage account — AzureRM allows only one style.)
- **Soft delete** and **versioning** reduce accidental loss.
- Do not expose SMB (port 445); this stack is **HTTPS blob** only.
