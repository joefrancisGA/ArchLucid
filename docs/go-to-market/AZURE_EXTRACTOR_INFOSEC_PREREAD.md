> **Reviewed:** 2026-07-25

> **Scope:** Buyer-facing security pre-read for InfoSec / cloud platform reviewers evaluating the Tier 1 Azure extractor script before a pilot. Not legal attestation.

# Azure extractor — InfoSec pre-read

**Audience:** Customer security, cloud platform, and procurement reviewers who must approve running `Get-ArchLucidAzurePackage.ps1` or uploading its ZIP output to ArchLucid.

**Status:** V1 GA — aligns with [V1_SCOPE.md](../library/V1_SCOPE.md) §2.16 and [trust-center.md](trust-center.md) Azure connectivity posture.

**Related:** [AZURE_EXTRACTOR.md](../library/AZURE_EXTRACTOR.md) · [AZURE_EXTRACTOR_INGEST.md](../runbooks/AZURE_EXTRACTOR_INGEST.md) · [FIRST_PILOT_OPERATOR_PATH.md](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) Phase B · [EXECUTIVE_SPONSOR_BRIEF.md](EXECUTIVE_SPONSOR_BRIEF.md)

---

## Decision summary (30 seconds)

| Question | Answer |
| --- | --- |
| Does ArchLucid need credentials in our Azure tenant for Tier 1? | **No.** The script runs **in your environment** under **your** operator identity. |
| What Azure permissions does the script need? | **Read-only** ARM access to list resources in the scoped subscription or resource group; optional **Cost Management Reader** when `-IncludeCost` is used. |
| What leaves our tenant? | A **schema-versioned ZIP** the operator chooses to upload — not live API keys or Key Vault secrets. |
| What if we cannot approve the script? | Use an **evidence-only** architecture review (`CloudProvider.None`) — upload briefs, diagrams, and documents without extractor output. |

---

## Tier 1 — customer-run collector (default V1 path)

### Execution model

1. Your team downloads and reviews **`scripts/azure/Get-ArchLucidAzurePackage.ps1`** from the ArchLucid distribution you received (or repository tag aligned to your pilot build).
2. An authorized operator runs the script **inside your Azure context** (Azure PowerShell / Cloud Shell / approved automation runner).
3. The architect inspects the ZIP locally, then uploads it to ArchLucid via **`POST /v1/azure-extractor/upload`** (architect workspace or API) associated with an architecture **review**.

ArchLucid does **not** execute the script in your tenant and does **not** receive your Azure login session or refresh tokens from Tier 1.

### What the script collects

| Payload (when switches enabled) | Purpose |
| --- | --- |
| `manifest.json` | Schema version, script version, collection timestamp (UTC), subscription id, scope, switches used |
| `resources.json` | ARM resource inventory for scoped subscription or resource group |
| `cost-actual.json` / `cost-amortized.json` | Cost Management exports (only with `-IncludeCost`) |
| `advisor-cost.json` | Advisor cost recommendations (only with `-IncludeCost`) |
| `orphan-candidates.json` | Orphan / unattached resource candidates (only with `-IncludeCost`) |
| `retail-prices.json` | Public Azure Retail Prices API rows for SKUs seen in inventory (no customer secret) |
| `README.txt` | Human-readable collection summary |

### What the script never collects

- Key Vault contents, certificates, or private keys
- Connection strings, storage account keys, or SAS tokens
- Entra ID directory secrets or user passwords
- Any credential material from application configuration

Treat the uploaded ZIP as **tenant confidential configuration metadata** — scope retention to your deployment backup and data-lifecycle policy once ingested.

### Minimum Azure RBAC for the operator running the script

| Role | When required |
| --- | --- |
| **`Reader`** on subscription or resource group | Always (ARM inventory) |
| **`Cost Management Reader`** on subscription or resource group | When `-IncludeCost` is used |

Scope the run to the **smallest** subscription or resource group that represents the architecture under review.

### Roles ArchLucid will never request

Per [trust-center.md](trust-center.md) and [V1_SCOPE.md](../library/V1_SCOPE.md) §2.16:

- **`Global Reader`** (Entra directory role)
- **`Owner`**, **`Contributor`**, **`User Access Administrator`**
- Any **write**, **deploy**, or **destructive** role on workloads
- Any role that would let ArchLucid **apply** or **destroy** infrastructure on your behalf

ArchLucid Terraform emit is **advisory-only** — the product never runs **`terraform apply`** or **`terraform destroy`** for customers.

---

## Upload and audit trail (ArchLucid side)

After upload:

- Package stored in tenant-scoped SQL/blob per deployment ([trust-center.md](trust-center.md) data residency table).
- Durable audit events include **`AzureExtractorPackage.Uploaded`**, **`AzureExtractorPackage.IngestSucceeded`**, and rejection events when schema validation fails — see [AUDIT_COVERAGE_MATRIX.md](../library/AUDIT_COVERAGE_MATRIX.md).
- Unsupported **`schemaVersion`** values are **rejected** (no silent parsing).

**API:** `POST /v1/azure-extractor/upload` — requires **ExecuteAuthority**; optional `runId` associates the package with an existing architecture review.

---

## Tier 2 — optional hosted collection (separate approval)

Tier 2 is **opt-in** and **not required** for V1 pilots. If enabled later:

- Customer provisions a **dedicated read-only service principal** with **`Reader`** + **`Cost Management Reader`** only.
- **Federated workload identity** is preferred over long-lived client secrets.
- ArchLucid stores only `{ customerTenantId, customerAppId, subscriptionId, includeCost }` — **never** customer client secrets.

Detail: [AZURE_EXTRACTOR.md](../library/AZURE_EXTRACTOR.md) Tier 2 section. Approve Tier 2 only if Tier 1 upload is insufficient and your team accepts standing read access.

---

## Alternative when the script is blocked

If InfoSec will not approve script execution in production (or sandbox provisioning is delayed):

1. Run an **evidence-only** review — structured request with briefs, diagrams, IaC, or policy documents (`CloudProvider.None`).
2. Use **demo evidence** for internal evaluator dry-runs only (label outputs **demo-derived**; do not quote externally).
3. Revisit Tier 1 after sandbox approval or use a **narrow resource-group scope** on a non-production subscription.

First-pilot path: [FIRST_PILOT_OPERATOR_PATH.md](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) Phase B step B2 (demo alternative).

---

## Reviewer checklist

| # | Check | Pass criteria |
| --- | --- | --- |
| 1 | Script source reviewed | Team inspected `Get-ArchLucidAzurePackage.ps1` for the pilot build tag |
| 2 | Scope minimized | Subscription or RG scope matches the architecture under review only |
| 3 | RBAC least privilege | Only **Reader** (+ **Cost Management Reader** if cost enabled) |
| 4 | Output inspected pre-upload | Operator opened ZIP; no unexpected files |
| 5 | Upload path authorized | `POST /v1/azure-extractor/upload` allowed to ArchLucid tenant URL only |
| 6 | Fallback documented | Evidence-only path documented if production script denied |

---

## FAQ (security reviewers)

**Can ArchLucid call back into our tenant after upload?**  
Tier 1: **No standing access** from upload alone. Tier 2: only if you separately configure hosted extractor (opt-in).

**Is the ZIP encrypted in transit?**  
Upload uses HTTPS to the ArchLucid API endpoint in your deployment region.

**Does ArchLucid train models on our ZIP?**  
Hosted Azure OpenAI inference does not use customer content for foundation-model training per Microsoft DPA posture documented in [trust-center.md](trust-center.md). Treat ZIP as confidential tenant data regardless.

**What if PowerShell execution policy blocks the script?**  
See [EXTRACTOR_EXECUTION_POLICY_BYPASS.md](../runbooks/EXTRACTOR_EXECUTION_POLICY_BYPASS.md) — customer-controlled remediation, not ArchLucid remote execution.

---

## Change control

When extractor schema, RBAC posture, or trust-center rows change, update this pre-read and [trust-center.md](trust-center.md) § Azure connectivity in the same change.
