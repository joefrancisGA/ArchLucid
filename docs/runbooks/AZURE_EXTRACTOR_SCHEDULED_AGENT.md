> **Scope:** Operator runbook — customer-owned scheduled Azure extractor (Automation runbook or Function timer); not buyer legal text.

> **Spine doc:** [`../START_HERE.md`](../START_HERE.md).

# Azure extractor — scheduled agent (recommended production path)

## 1. Objective

Collect read-only Azure inventory **on a timer in the customer tenant** and upload the ZIP to ArchLucid. Operators do **not** pull data from a command line or UI after the agent is applied.

This is the preferred **customer-owned** production path. It reuses `Get-ArchLucidAzurePackage.ps1` (one collector family). ArchLucid-hosted WIF polling remains optional when the customer wants ArchLucid to pull.

## 2. Why an agent instead of CLI or UI

Enterprise InfoSec and platform teams are often uncomfortable with a human running a collector at a workstation or clicking **Re-poll** in a vendor UI. A scheduled Automation runbook or Function:

- Uses a **managed identity** the customer owns
- Pins a **reviewed script ZIP** in customer storage
- Uploads through the same `POST /v1/azure-extractor/upload` contract as a one-time ZIP
- Leaves an Automation / Function **job history** for audit

## 3. Apply the Terraform agent

Templates: [`deploy/customer-templates/scheduled-agent/`](../../deploy/customer-templates/scheduled-agent/).

| Item | Requirement |
|------|-------------|
| Azure RBAC | `Reader` + `Cost Management Reader` on the inventoried subscription (assigned to the Automation identity) |
| ArchLucid | `ExecuteAuthority` API key stored in Key Vault |
| Schedule | Weekly Monday 06:00 UTC by default |

See the folder README for `terraform apply`, secret set, and first-run verification.

## 4. Function timer (same orchestrator)

`deploy/customer-templates/scheduled-agent/function/` hosts `Invoke-ArchLucidScheduledAzureExtractor.ps1` on a timer. Use it when the estate already standardizes on Azure Functions. Terraform in that folder remains the Automation runbook representation.

## 5. One-time local collection (pilot)

Keep `Run-ArchLucidAzureExtractor.ps1` and Extract & upload for first pilots. Do not treat workstation pulls as the production cadence.

## 6. Security posture

- ArchLucid never receives `Owner`, `Contributor`, `User Access Administrator`, or Entra **Global Reader**.
- The API key never belongs in runbook source; Key Vault only.
- Hosted GET-only limits still apply to **ArchLucid-hosted** pull; this agent runs the full-fidelity customer collector, including optional cost.

## Related

| Doc | Use |
|-----|-----|
| [`../library/AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) | Tier 1 ZIP, hosted WIF, auto-pull |
| [`AZURE_EXTRACTOR_INGEST.md`](AZURE_EXTRACTOR_INGEST.md) | Upload API |
| [`AZURE_EXTRACTOR_TIER2_CONTINUOUS.md`](AZURE_EXTRACTOR_TIER2_CONTINUOUS.md) | CI-owned alternative |
| [`../library/customer-facing/CLOUD_CONNECTIONS.md`](../library/customer-facing/CLOUD_CONNECTIONS.md) | In-app help source |
| [`../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md) | InfoSec pre-read |
