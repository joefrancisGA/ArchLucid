> **Scope:** Customer-facing — optional cloud evidence connections for architecture reviews.

# Cloud connections

Cloud connections are **optional**. You can start and finalize review packages from briefs, diagrams, documents, and uploaded evidence without connecting a cloud provider.

When you connect a cloud provider, ArchLucid uses **read-only** inventory and cost signals to enrich findings — it does not store long-lived client secrets or access keys in your tenant configuration on the primary federated path.

## Choose your cloud platform {#choose-your-cloud-platform}

ArchLucid supports optional Tier 2 hosted polling for three cloud platforms. Pick the guide that matches your environment:

- **[Connect Azure securely](/help/cloud-connections/azure)** — workload identity federation, Reader + Cost Management Reader, subscription scope.
- **[Connect AWS securely](/help/cloud-connections/aws)** — OIDC-federated read-only IAM role, Resource Explorer inventory.
- **[Connect GCP securely](/help/cloud-connections/gcp)** — Workload Identity Federation, Cloud Asset Viewer, project scope.

You can also run **evidence-only** reviews from uploaded inventory ZIPs without enabling Tier 2.

## Connect Azure securely {#connect-azure-securely}

The in-app guide at `/help/cloud-connections/azure` is the canonical setup reference for federated authentication, read-only Azure roles, setup steps, and data classification.

**[Open Connect Azure securely](/help/cloud-connections/azure)**

For role requirements, scopes, CLI templates, and verification, see **[Azure permissions for cloud connections](/help/azure-permissions)**.

## Connect AWS securely {#connect-aws-securely}

ArchLucid can use AWS resource inventory when you connect an AWS account. The AWS connection is optional; reviews can also use briefs, diagrams, documents, and uploaded inventory ZIPs.

**Evidence tier:** cloud-connected (optional hosted pull from an authorized IAM role).

### Security model

- **OIDC web identity federation** — ArchLucid's hosted poller assumes your read-only IAM role at runtime without storing access keys.
- **No long-lived access keys** — trust is established through an IAM role that federates to ArchLucid's published Azure managed identity.
- **Read-only inventory** — ArchLucid polls **AWS Resource Explorer** for architecture evidence only.
- **Account-scoped role** — you provision the IAM role and can revoke the trust policy at any time.

### Setup steps

1. Complete the in-product **security review** checklist from the [**AWS cloud connection**](/integrations/cloud-connections/aws) page.
2. Create a read-only IAM role in your AWS account with a trust policy for ArchLucid's federated identity.
3. Enter your 12-digit AWS account ID, primary region, and read-only role ARN.
4. Save the connection, then run **Re-poll now** to confirm federated assume-role and inventory access.

### Required permissions

Grant **read-only** inventory access through your IAM role. ArchLucid requests Resource Explorer data only — **no** write, mutate, or infrastructure-apply permissions.

| Permission area | Purpose | Write access |
|-----------------|---------|--------------|
| **Resource Explorer** | Account inventory for architecture evidence | No |

Do **not** assign **AdministratorAccess**, **PowerUserAccess**, **IAMFullAccess**, or any role that can modify your AWS infrastructure on your behalf.

### What ArchLucid stores

- AWS account ID
- Primary region
- Read-only IAM role ARN
- Connection status and last-polled timestamp

### What ArchLucid does not store

- Access key ID / secret access key pairs
- Administrator or PowerUser privileges

## Connect GCP securely {#connect-gcp-securely}

ArchLucid can use GCP resource inventory when you connect a GCP project. The GCP connection is optional; reviews can also use briefs, diagrams, documents, and uploaded inventory ZIPs.

**Evidence tier:** cloud-connected (optional hosted pull from an authorized service account).

### Security model

- **Workload Identity Federation** — ArchLucid authenticates through a pool provider bound to ArchLucid's published Azure managed identity.
- **No service-account JSON keys** — impersonation uses federated tokens at runtime on the primary path.
- **Read-only inventory** — ArchLucid polls **Cloud Asset Inventory** for architecture evidence only.
- **Project-scoped access** — you provision the pool provider and service account and can revoke bindings at any time.

### Setup steps

1. Complete the in-product **security review** checklist from the [**GCP cloud connection**](/integrations/cloud-connections/gcp) page.
2. Create a Workload Identity Pool provider that trusts ArchLucid's federated identity and bind a read-only service account.
3. Enter GCP project ID, Workload Identity Pool provider resource name, and service account email.
4. Save the connection, then run **Re-poll now** to confirm federation and inventory access.

### Required roles

Grant **read-only** inventory access to the service account ArchLucid impersonates.

| GCP role | Purpose | Write access |
|----------|---------|--------------|
| **Cloud Asset Viewer** (or equivalent read-only asset inventory role) | Project/folder asset inventory for architecture evidence | No |

Do **not** assign **Owner**, **Editor**, **roles/iam.serviceAccountKeyAdmin**, or any role that can modify your GCP infrastructure on your behalf.

### What ArchLucid stores

- GCP project ID
- Workload Identity Pool provider resource name
- Service account email
- Connection status and last-polled timestamp

### What ArchLucid does not store

- Service account JSON key files
- Owner or Editor privileges

## Workload identity federation {#workload-identity-federation}

ArchLucid-hosted Azure cloud-connected ingestion uses **Microsoft Entra ID workload identity federation**:

- Your tenant creates a federated credential on the read-only service principal.
- The credential trusts ArchLucid's user-assigned managed identity issuer and subject.
- ArchLucid exchanges a federated token at runtime — no shared secrets are persisted.

If federation is misconfigured, validation fails fast with an API error — fix the federated credential trust chain before retrying.

## Azure permissions reference {#azure-permissions}

Use the dedicated in-app guide for role requirements, scopes, setup, and verification:

**[Azure permissions for cloud connections](/help/azure-permissions)**

That guide is driven by the same permission contract as hosted Tier 2 validation and customer onboarding templates. Do **not** assign Owner, Contributor, User Access Administrator, or broad directory roles for the Azure connection.

## Related topics {#related-topics}

- **[Security and trust](/help/security-trust)** — assurance ladder, data handling, and diligence materials.
- **[Hosted SaaS enterprise onboarding checklist](/help/enterprise-onboarding)** — enterprise tenant configuration for administrators (SSO, governance, procurement).
- **[Procurement FAQ](/help/procurement)** — buyer-safe answers for InfoSec and resilience questionnaires.
