> **Scope:** ADR 0103 — SecureNow in-tenant collection agent and blob handoff.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0103: SecureNow in-tenant collection agent and blob handoff

- **Status:** Accepted
- **Date:** 2026-10-11
- **Owner decision:** Accepted 2026-10-11 without amendment. SN-COL-02 run records and blob ingest are already on `master`. SN-COL-03 and SN-DEP-01 may proceed. SN-DEP-01 was accepted as ADR 0104 on 2026-10-12, so SN-DEP-02 and SN-DEP-03 may proceed when those prompts are run.

## Context

SecureNow needs a customer-operated collection path that can run on a schedule or on demand without requiring a person to keep a browser session open. The current alternatives are:

| Path | Current behavior | Limitation for the target workflow |
|---|---|---|
| Hosted pull | `HostedAzureExtractorClient` reads Azure through the existing workload-identity federation pattern. | The hosted service must reach customer control planes directly and the customer does not own the collection runtime. |
| Scheduled push | `Invoke-ArchLucidScheduledAzureExtractor.ps1` collects a ZIP and posts it to `/v1/azure-extractor/upload`. | It is operationally viable, but the API upload is not a customer-owned durable handoff and does not give SecureNow a manifest-first discovery surface. |
| Manual upload | `Run-SecureNowAzureExtractor.ps1` creates a ZIP for the Extract and upload page. | It is the fallback, not the primary operating model. |

The existing collector family already reads Azure Resource Manager, Resource Graph projections, policy and Defender summaries, network associations, diagnostics, role assignments, selected Entra evidence, and optional cost data. The infrastructure-evidence plane defines the resulting schema-versioned ZIP as shared evidence; this ADR must not create a second ARC-AMPE or SecureNow harvest.

The decision must work in two hosting modes:

1. **SecureNow in the customer tenant:** the agent, handoff storage, and SecureNow reader run inside the same tenant and can use private endpoints.
2. **Generic SecureNow hosted by ArchLucid:** the agent and handoff storage remain customer-owned, while the hosted service reads only the customer handoff container through the existing federation pattern.

## Decision

SecureNow V1 will use a **customer-owned Azure Automation PowerShell 7 runbook** as the collection agent. The runbook reuses the existing `Get-ArchLucidAzurePackage.ps1` collector and writes two objects to a customer-owned Blob Storage container:

```text
securenow-collection/
  runs/{runId}/run-manifest.json
  runs/{runId}/azure-extractor-package.zip
```

The ZIP remains the existing schema-versioned extractor package. The small run manifest is the discovery and integrity record. SecureNow reads the manifest first and downloads the ZIP only when the manifest is `Succeeded`, its schema version is supported, and its SHA-256 has not already been ingested.

The primary trigger is a schedule configured on the Automation account. `Run now` uses the narrow built-in **Automation Job Operator** role, scoped to the specific Automation account, to start the named runbook with a generated run id and requested subscription scope. SecureNow does not receive `Reader`, `Contributor`, `Storage Blob Data Contributor`, or other resource-management write permission. A queue-trigger variant remains an evolution option if tenant policy or job-start latency makes direct start unsuitable.

The agent identity receives only:

- `Reader` at each approved subscription or management-group scope.
- `Cost Management Reader` at each scope where cost collection is enabled.
- `Storage Blob Data Contributor` on the handoff container only.
- Any additional Graph permission required by the selected evidence catalog, granted explicitly and recorded as an inaccessible-evidence condition when absent.

SecureNow receives only `Storage Blob Data Reader` on the handoff container. In customer-hosted mode, both identities use the customer tenant and private connectivity. In generic hosted mode, the existing workload-identity federation pattern is extended so the ArchLucid hosted identity can obtain a token for the customer tenant; the customer grants that identity reader access only to this container. No shared key, account key, SAS token, or customer control-plane credential is stored in SecureNow configuration.

The agent writes a manifest only after collection and ZIP hashing complete. A failed run writes a failed manifest without publishing a package as succeeded. SecureNow treats duplicate events, repeated manifests, stale runs, unsupported schemas, and hash mismatches as idempotent or actionable states rather than silently ingesting data.

## Inputs, outputs, and boundary

The agent reads, subject to the configured collection scope:

- Azure Resource Manager resources and selected resource properties.
- Azure Resource Graph projections used by the existing relationship-first extractor.
- Entra identity and group evidence only where the selected catalog and granted permissions require it.
- Azure Policy assignments, definitions, and compliance summaries.
- Defender for Cloud summaries and other existing read-only security evidence.
- Optional Cost Management data and optional retail-price data.

The agent writes:

- The existing extractor ZIP with its existing schema version, collection timestamp, scope descriptor, collector version, warnings, and raw evidence files.
- A small `run-manifest.json` containing run state, scope, timing, package path, size, hash, and error information.

Control-plane access tokens, client secrets, API keys, Key Vault secrets, private network details not represented in the selected schema, and unrelated customer resources never leave the customer tenant. The selected architecture evidence does leave the tenant when the customer chooses generic hosted SecureNow; it is transferred only through the customer-owned handoff container and is subject to the customer retention policy. Customer-hosted SecureNow keeps that transfer inside the tenant.

## Agent host

Azure Automation is the V1 recommendation because it matches the existing PowerShell 7 runbook shape, supports managed identity and schedules, and avoids introducing a new always-on service. Azure Functions timer triggers and Container Apps Jobs remain viable alternatives, but they create different packaging, runtime, and operational seams before the collection contract is proven.

| Choice | Gains | Sacrifices and uncertainty |
|---|---|---|
| Azure Automation PowerShell 7 runbook | Reuses the current scripts, schedule and job-start model, managed identity, and customer operations experience. Idle cost is near zero. | Runbook runtime, module startup, output limits, and concurrent-job behavior must be verified against the selected Azure Automation region and plan. Large or unusually slow subscriptions may require fan-out. |
| Functions timer | Good code-level observability and flexible fan-out. | Requires a Functions host, deployment pipeline, timer coordination, and explicit PowerShell worker compatibility. It adds a second runtime before the first customer signal. |
| Container Apps Job | Strong container reproducibility and explicit job execution. | Requires image supply chain, registry, job identity, schedule, and customer networking. It is a better later host if collection becomes a containerized worker, not the smallest V1 seam. |

Cold start is acceptable because the workflow is scheduled evidence collection, not an interactive request. The runbook must record startup and collection duration and fail with a clear status when the verified runtime limit or package-size limit is exceeded. The implementation must verify current PowerShell 7 support, maximum job duration, module versions, and concurrency limits for the chosen Automation environment rather than baking unverified service limits into product behavior.

## Handoff and discovery

Blob handoff is preferred over scheduled push and hosted pull:

- It gives the customer ownership of the durable evidence boundary and retention.
- It separates collection availability from SecureNow API availability.
- It permits manifest-first polling and hash-based idempotency.
- It works in both customer-hosted and generic hosted modes.
- It allows Event Grid or polling to be changed without changing the ZIP contract.

Scheduled push remains supported as a compatibility path while customers migrate. Hosted pull remains available for customers who explicitly choose federation, but it is not the default SecureNow path.

V1 uses **polling** from SecureNow on a bounded cadence. Polling avoids requiring an Event Grid subscription and cross-tenant event delivery on the first implementation. SecureNow reads the latest manifest for the configured scope, compares `runId` and SHA-256 with ingested records, and downloads only a new successful package. A missing manifest, storage authorization failure, or stale `Running` manifest becomes a visible collection status rather than an empty success.

Event Grid blob-created notifications are a later optimization. If adopted, the event handler must still read and validate the manifest; an event is only a hint, not evidence that the ZIP is complete. Duplicate and out-of-order events are expected.

## Run manifest

The manifest is JSON and has a separately versioned contract:

```json
{
  "manifestVersion": "1.0",
  "runId": "uuid",
  "agentVersion": "1.0.0",
  "edition": "generic",
  "startedUtc": "2026-10-11T00:00:00Z",
  "finishedUtc": "2026-10-11T00:14:00Z",
  "status": "Succeeded",
  "tenantId": "customer-tenant-id",
  "subscriptions": ["subscription-id"],
  "managementGroupId": null,
  "scopeDescriptor": "/subscriptions/subscription-id",
  "packageBlobPath": "runs/uuid/azure-extractor-package.zip",
  "packageSizeBytes": 123456,
  "packageSha256": "lowercase-hex-sha256",
  "schemaVersion": "1",
  "warnings": [],
  "errorSummary": null,
  "collectorVersion": "collector-version"
}
```

`status` is one of `Queued`, `Running`, `Succeeded`, `Partial`, or `Failed`. `Partial` is successful enough to preserve evidence but must carry warnings and completeness details. `Succeeded` requires a readable ZIP and a computed hash. SecureNow rejects a package when the manifest hash does not match the downloaded bytes, the package schema is unsupported, the manifest scope conflicts with the configured tenant, or the package is already recorded by hash.

## On-demand run

`Run now` calls the SecureNow backend, which validates tenant, workspace, scope, and operator permissions, generates a run id, and starts the named Automation runbook. The call passes only non-secret parameters: run id, subscription or management-group scope, output container path, edition, and collection switches.

The caller's customer-tenant identity is granted **Automation Job Operator** at the specific Automation account scope, not at the subscription or resource-group scope. The role is used only to start and inspect the collection job. The runbook's managed identity is separate and owns the read permissions and its own-container blob write permission. If a target tenant cannot use the built-in role, SN-DEP-02 must deploy a custom least-privilege role containing only the verified Automation job start/read actions at that Automation account scope; it must not broaden to subscription write.

Run-start failure is returned as an actionable status and does not create a successful run record. The agent remains independently schedulable, so scheduled collection does not depend on SecureNow being available.

## Security

The design is deny-by-default:

- The agent has no `Owner`, `Contributor`, `User Access Administrator`, or Entra `Global Reader` role.
- SecureNow has no customer resource write permission and no access to the agent's input scopes.
- The blob container has public access disabled, encryption at rest enabled, and a retention/lifecycle policy owned by the customer.
- Storage, Automation, and SecureNow endpoints use private endpoints where the customer-hosted topology supports them; public network access is disabled unless a documented exception is approved.
- Managed identity and workload federation replace shared keys and SAS configuration.
- Blob paths are tenant- and run-scoped; manifest tenant and scope values are checked before ingest.
- Run ids, package hashes, scope descriptors, and collector versions are logged; tokens and secrets are not.
- The ZIP is immutable to the SecureNow reader. Correction requires a new run and a new hash, not replacement of an ingested package.

The storage account and Automation account are customer-owned. Generic hosted SecureNow's federated reader is granted only `Storage Blob Data Reader` on the handoff container, with access review and removal procedures owned by the customer.

## Reliability

The runbook writes `Running` before collection and updates it to `Succeeded`, `Partial`, or `Failed` with an atomic or overwrite-safe manifest pattern. It writes the ZIP to a temporary run-scoped path and publishes the final manifest only after the ZIP is complete and hashed. A timeout or crash leaves a stale `Running` record; SecureNow marks it stale after a configured threshold and does not ingest it.

Transient ARM, Resource Graph, and Blob failures retry with bounded exponential backoff. A subscription failure does not erase successful subscriptions; it produces `Partial` with per-subscription warnings. A run with no usable package is `Failed`.

Duplicate schedules, manual retries, and duplicate notifications are safe because `(tenant, scope, runId)` and package SHA-256 are idempotency keys. SecureNow never overwrites a committed package by path. Unsupported ZIP schema versions remain in storage as `Unsupported` evidence and raise an operator action; they are not silently coerced.

## Scalability

The first implementation accepts a list of subscriptions and a management-group scope but must fan out work by subscription inside the agent with a bounded concurrency setting. A tenant with many subscriptions should use one manifest per run and record each subscription's status, rather than creating unbounded Automation jobs.

Large ZIPs are written directly to Blob Storage and downloaded by SecureNow as a stream where the ingest path supports it. If the existing chunked upload assembly is reused for compatibility, the chunk session must remain scoped to the same tenant and run and must verify the final SHA-256 before ingest. The blob handoff itself is preferred because it avoids routing a large package through the API.

## Cost

These are order-of-magnitude planning estimates, not Azure price quotes. They assume one run per day for the small case, one run per hour for the large case, 10 minutes of run time per subscription, 100 MiB per package, hot blob storage, and no premium SIEM ingestion:

| Tenant size | Workload assumption | Expected incremental monthly range |
|---|---|---|
| Small | 1–5 subscriptions, daily run, under 300 run minutes/month, under 10 GiB retained | Approximately **$1–$10/month**, dominated by Automation execution and blob storage/transactions. |
| Large | 50–200 subscriptions, hourly run, bounded fan-out, 100–500 GiB retained | Approximately **$50–$500/month**, dominated by collection execution, storage retention, and any diagnostic/SIEM ingestion. |

The largest cost uncertainty is not the runbook itself; it is optional Cost Management queries, log retention, private networking, and downstream Sentinel ingestion. SN-DEP-02 must expose retention and schedule as Terraform variables so the customer can make the cost trade-off explicit.

## Naming and editions

The generic edition may retain `ArchLucid` in script and resource names. The UHG edition must not expose `ArchLucid` in scripts, resource names, logs, or operator-facing errors. Packaging therefore has an edition-neutral collection contract with edition-specific wrappers:

- Generic: existing `Invoke-ArchLucidScheduledAzureExtractor.ps1` and related internal names remain valid.
- UHG: customer-facing wrappers use `Invoke-SecureNowScheduledAzureExtractor.ps1`, resources use `securenow-collection-*`, and log messages use `SecureNow`.
- The UHG wrapper delegates to the same collector behavior and schema; it does not fork the evidence format or create an ARC-AMPE-specific collector.

The edition value is recorded in the run manifest for routing and branding, not as a security boundary. Tenant and scope authorization remain authoritative.

## Terraform scope for SN-DEP-02

SN-DEP-02 should provide modules for:

1. Customer resource group, Automation account, PowerShell 7 runbook, schedule, and runbook variables.
2. User-assigned or system-assigned managed identity for the runbook.
3. Reader and Cost Management Reader assignments at explicitly supplied subscription or management-group scopes.
4. Storage account, private endpoint, private DNS links, handoff container, lifecycle/retention policy, and the agent's container-scoped `Storage Blob Data Contributor`.
5. SecureNow reader identity assignment as either same-tenant managed identity or the existing generic hosted federation principal with container-scoped `Storage Blob Data Reader`.
6. Automation Job Operator assignment at the Automation account scope for the customer-hosted SecureNow trigger identity.
7. Diagnostic settings for Automation and Storage, with customer-selected destination and retention.
8. Edition-specific names and wrapper package selection without changing the shared manifest or ZIP schema.

Secrets, shared keys, and SAS values must not be Terraform inputs. Terraform should output resource IDs, container names, identity object IDs, and the non-secret configuration needed by the agent and SecureNow.

## Evolution to AWS and GCP

Version 2 may add customer-owned AWS and GCP collectors that emit the same high-level run manifest and provider-specific schema sections. AWS would likely use an IAM role and S3 handoff; GCP would likely use a service account and Cloud Storage handoff. Their exact services, permissions, eventing, and Terraform modules are intentionally not designed here. The stable V1 boundary is the manifest-first, hash-verified, customer-owned object handoff, not an Azure-specific permission model.

## Trade-offs

The decision gains customer control over collection data, a durable and auditable handoff, least-privilege separation between collection and ingestion, and a direct path to scheduled or on-demand operation. It also reuses the current PowerShell collector instead of creating a second evidence producer. The design sacrifices the simplicity of a single hosted pull: customers must deploy and operate an Automation account, storage, identity assignments, networking, and retention. Polling adds freshness latency compared with a well-operated event subscription, and cross-tenant hosted mode still requires a carefully governed federation and customer RBAC grant.

Azure Automation is cheaper and faster to adopt than a new container host, but gives up some packaging reproducibility and may impose runtime or module constraints that must be verified. Blob handoff improves isolation and retryability, but duplicates a small run-manifest contract and creates storage lifecycle responsibility for the customer. Direct Automation job start gives lower on-demand latency than queue polling, but requires a narrowly scoped trigger role and a cross-tenant grant in the generic hosted mode.

## Constraints

- The existing extractor ZIP and shared infrastructure-evidence schema are the only collection evidence contract; no second ARC-AMPE harvest is permitted.
- Production access is read-only at Azure resource scopes; no customer `Owner`, `Contributor`, `User Access Administrator`, or Entra `Global Reader` permission is allowed.
- Generic hosted mode must use the existing workload-identity federation pattern rather than shared keys or SAS.
- Customer-hosted mode must support private endpoints and deny-by-default network posture where the tenant's networking policy permits it.
- Azure Automation PowerShell 7 runtime support, job duration, module availability, concurrency, and package limits must be verified before deployment.
- Terraform must represent the customer-side resources and assignments; manual portal-only setup is not the target operating model.
- The UHG edition must keep ArchLucid out of customer-facing names and logs while retaining one shared evidence schema.
- This ADR does not itself add collection APIs, run records, blob-ingest code, UI, or scheduled/on-demand implementation. The owner accepted it on 2026-10-11, so later prompts may build those surfaces inside this decision.

## Expected impact

**System:** SecureNow gains one provider-specific collection boundary that can support schedules, on-demand jobs, customer-hosted deployments, and generic hosted reads without changing the existing ZIP producer. SN-COL-02 will have a clear run-manifest and hash/idempotency contract.

**Security:** Customer control-plane data is read by a customer-owned identity, SecureNow reads only a dedicated blob container, and trigger permission is separated from collection permission. The remaining high-risk surfaces are federation configuration, container scope, stale manifests, and customer retention; each becomes an explicit deployment or runtime check.

**Operations:** Operators can diagnose a run from its manifest without opening a UI session. Partial subscriptions and stale jobs become visible states. The first implementation carries Automation module/runtime verification and a polling loop; later event-driven discovery can reduce freshness latency without changing package semantics.

**Cost:** Small tenants should incur low single-digit to low double-digit monthly infrastructure cost under daily collection. Hourly, multi-subscription collection and long retention can grow materially, so Terraform exposes schedule, fan-out, storage retention, and optional cost/log collection rather than hiding those decisions.

**Teams:** Security architects get a repeatable scheduled/on-demand evidence path; cloud security engineers own the customer-side identity, network, and retention configuration; GRC analysts consume versioned manifests and hashes instead of handling raw collection scripts. UHG customers receive SecureNow-only naming.

## Consequences

- **Positive:** Customer-owned collection, least-privilege handoff, replay-safe ingestion, and a clear path for both deployment modes.
- **Negative:** Customers must operate more Azure resources; polling and cross-tenant federation add operational seams; Automation limits remain a deployment verification item.
- **Follow-ups:** Accepted 2026-10-11 without amendment. SN-COL-02 is already on `master`. SN-COL-03 may add the collection-agent page. SN-DEP-01 was accepted as ADR 0104 on 2026-10-12 and uses this ADR as an input. SN-DEP-02 may encode the module boundaries listed above when that prompt is run.

## Links

- [`docs/library/INFRA_EVIDENCE_PLANE.md`](../../library/INFRA_EVIDENCE_PLANE.md)
- [`scripts/azure/Invoke-ArchLucidScheduledAzureExtractor.ps1`](../../../scripts/azure/Invoke-ArchLucidScheduledAzureExtractor.ps1)
- [`scripts/azure/Run-SecureNowAzureExtractor.ps1`](../../../scripts/azure/Run-SecureNowAzureExtractor.ps1)
- [`ArchLucid.Integrations.AzureExtractor/HostedAzureExtractorClient.cs`](../../../ArchLucid.Integrations.AzureExtractor/HostedAzureExtractorClient.cs)
- [`infra/terraform-customer-onboarding/main.tf`](../../../infra/terraform-customer-onboarding/main.tf)
- [ADR 0037 — Tenant isolation without SQL RLS](0037-tenant-isolation-without-rls-defense-in-depth.md)
- [ADR 0104 — SecureNow in-tenant deployment](0104-securenow-in-tenant-deployment.md)
