# SN-COL-01 — ADR: in-tenant collection agent and blob handoff

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** nothing. **Design only. Do not write product code in this session.**

## Goal

One proposed ADR that decides how SecureNow's collection agent runs in the customer's tenant, where it puts its output, how SecureNow reads that output, and how a person triggers an on-demand run. The owner accepts or amends it before SN-COL-02 starts.

## Why

The owner expects most customers to want a scheduled or on-demand agent in their own tenant, not a person in a UI, with SecureNow reading the result from blob storage. Three paths exist today:

| Path | What exists |
|------|-------------|
| Hosted pull | `HostedAzureExtractorClient` reads ARM cross-tenant through workload identity federation set up by `infra/terraform-customer-onboarding` |
| Scheduled push | `Invoke-ArchLucidScheduledAzureExtractor.ps1` runs in Azure Automation or a Function timer and posts the ZIP to `POST /v1/azure-extractor/upload` |
| Manual upload | `Run-SecureNowAzureExtractor.ps1` plus the Extract & upload page and chunked upload sessions |

None of them writes to customer-owned blob storage for SecureNow to read.

## Read first

- `scripts/azure/Invoke-ArchLucidScheduledAzureExtractor.ps1`, `Send-ArchLucidAzureExtractorPackage.ps1`, `ArchLucid.ScheduledExtractor.helpers.ps1`
- `scripts/azure/Run-SecureNowAzureExtractor.ps1`, `Get-SecureNowAzurePackage.ps1`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureExtractorClient.cs`, `WorkloadIdentityHostedAzureExtractorCredentialFactory.cs`
- `ArchLucid.Api/Controllers/Authority/CloudInventoryExtractorUploadController.cs` and its `ChunkedUpload` partials
- `ArchLucid.Persistence/AzureExtractorChunkUpload/AzureBlobAzureExtractorChunkSessionStore.cs`
- `infra/terraform-customer-onboarding/main.tf`, `infra/bicep-customer-onboarding/main.bicep`
- `docs/architecture/adrs/template.md`, `README.md`, and `0037-tenant-isolation-without-rls-defense-in-depth.md`
- `docs/library/INFRA_EVIDENCE_PLANE.md`

## What to write

`docs/architecture/adrs/<next number>-securenow-in-tenant-collection-agent.md`, status **Proposed**, using the repo template. Take the next free four-digit number (0103 at the time this prompt was written). Add it to the ADR index the same way other ADRs are listed.

The ADR must cover, with trade-offs, constraints, and expected impact for each choice:

1. **Inputs, outputs, boundary.** What the agent reads (ARM, Resource Graph, Entra, cost, policy), what it writes (the existing schema-versioned ZIP plus a small run manifest), and what never leaves the tenant.
2. **Agent host.** Azure Automation runbook, Azure Functions timer, or Container Apps job. Recommend one for version 1. Cover cold start, run-length limits, PowerShell 7 support, identity, and cost at one run per hour and one per day.
3. **Handoff.** Compare scheduled push (exists), blob handoff (agent writes to a customer storage account, SecureNow reads), and hosted pull (exists). Recommend blob handoff or justify not doing it. Cover both hosting modes: SecureNow in the customer's tenant (same-tenant managed identity, private endpoint) and generic SecureNow hosted by ArchLucid (cross-tenant read through the existing federation pattern).
4. **Run manifest.** Fields such as run id, agent version, started and finished times, subscriptions covered, status, error summary, and ZIP blob path and SHA-256. SecureNow reads the manifest first and the ZIP only when the hash is new.
5. **Discovery.** Event Grid blob-created event, polling, or both. Recommend one, with failure behavior.
6. **On-demand run.** How `Run now` reaches the agent without SecureNow holding write permission on customer resources beyond starting that one job. Options: a storage queue message the agent listens for, or a narrowly scoped role to start the Automation job or Container Apps job. State the exact role and scope.
7. **Security.** Least privilege for the agent (Reader, Cost Management Reader, Storage Blob Data Contributor on its own container only) and for SecureNow (Storage Blob Data Reader on that container only). Deny-by-default network, private endpoints, no shared keys, no SAS in configuration, encryption at rest, and retention.
8. **Reliability.** Retries, partial runs, a run that never finishes, duplicate events, and a ZIP whose schema version SecureNow does not support.
9. **Scalability.** Many subscriptions per tenant, large ZIPs (reuse the chunked path where useful), and run fan-out by subscription.
10. **Cost.** Order-of-magnitude monthly cost for the recommended host and storage at small and large tenant sizes, with the assumptions stated.
11. **Naming.** A UHG-edition customer must not see `ArchLucid` in the agent's script names, resource names, or logs. State how the agent is packaged and named per edition, reusing the existing SecureNow script wrappers.
12. **Terraform.** The modules SN-DEP-02 will need for the agent side. Infrastructure must be representable in Terraform.
13. **Evolution.** What changes for AWS and GCP in version 2, without designing them.

State any uncertainty plainly rather than asserting a service limit you have not verified.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Docs only. No C#, TypeScript, PowerShell, SQL, or Terraform changes.
- Do not commit.

## Done when

A Proposed ADR exists that a reviewer can accept or amend, and it answers host, handoff, manifest, discovery, on-demand trigger, permissions, failure handling, cost, naming, and Terraform scope.
