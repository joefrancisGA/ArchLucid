> **Scope:** Customer-facing — optional cloud evidence connections for architecture reviews.

# Cloud connections

Cloud connections are **optional**. You can start and finalize architecture packages from briefs, diagrams, documents, and uploaded evidence without connecting a cloud provider.

When you connect a cloud provider, ArchLucid uses **read-only** inventory and cost signals to enrich findings — it does not store long-lived client secrets or access keys in your tenant configuration on the primary federated path.

## Choose your cloud platform {#choose-your-cloud-platform}

**Tier 1 (default, no ArchLucid credentials in your cloud account):** run `Get-ArchLucidAzurePackage.ps1`, `Get-ArchLucidAwsPackage.ps1`, or `Get-ArchLucidGcpPackage.ps1` from your ArchLucid clone, then upload the resulting ZIP from the **New architecture review** wizard. Tier 1 is the default posture when you do not want long-lived vendor access in your cloud account.

**Tier 2 (optional):** cloud-connected hosted pull through federated read-only roles in Azure, AWS, or GCP. Use this when you want ArchLucid to poll inventory on a schedule without storing access keys in tenant configuration.

ArchLucid supports optional Tier 2 hosted polling for three cloud platforms:

| Platform | Identity model | Read-only role / scope | Scope unit | Setup guide |
|----------|----------------|------------------------|------------|-------------|
| Azure | Workload identity federation | Reader + Cost Management Reader | Subscription | [Connect Azure securely](/help/cloud-connections/azure) |
| AWS | OIDC web identity federation | Read-only IAM role (Resource Explorer) | AWS account | [Connect AWS securely](/help/cloud-connections/aws) |
| GCP | Workload Identity Federation | Cloud Asset Viewer | GCP project | [Connect GCP securely](/help/cloud-connections/gcp) |

You can also run **evidence-only** reviews from uploaded inventory ZIPs without enabling Tier 2.

<details>
<summary>Administrator details — automation upload paths</summary>

Platform and integration teams can also upload a Tier 1 inventory ZIP through the documented extractor HTTP APIs (`/v1/extractor/azure|aws|gcp/upload`). Prefer the wizard for first-time and pilot use.

</details>

## Connect Azure securely {#connect-azure-securely}

The in-app guide at `/help/cloud-connections/azure` is the canonical setup reference for federated authentication, read-only Azure roles, setup steps, and data classification.

**[Open Connect Azure securely](/help/cloud-connections/azure)**

For role requirements, scopes, CLI templates, and verification, see **[Azure permissions for cloud connections](/help/azure-permissions)**.

## Connect AWS securely {#connect-aws-securely}

The in-app guide at `/help/cloud-connections/aws` is the canonical setup reference for OIDC-federated authentication, read-only IAM permissions, setup steps, and data classification.

**[Open Connect AWS securely](/help/cloud-connections/aws)**

## Connect GCP securely {#connect-gcp-securely}

ArchLucid can use GCP resource inventory when you connect a GCP project. The GCP connection is optional — reviews can also use briefs, diagrams, documents, and uploaded inventory packages.

**Two ways to bring GCP inventory:**

- **Upload a package:** export a read-only inventory ZIP from your GCP project with your own operator credentials (`Get-ArchLucidGcpPackage.ps1`), then upload from the **New architecture review** wizard. ArchLucid never receives your service-account JSON keys.
- **Connect for scheduled collection:** configure Workload Identity Federation so ArchLucid can collect read-only Cloud Asset Inventory on a schedule — without storing JSON keys in your workspace.

### Security model

- **Workload Identity Federation** — ArchLucid authenticates through a pool provider bound to ArchLucid's federated identity. Impersonation uses federated tokens at runtime — no downloadable service-account JSON keys.
- **Read-only inventory** — ArchLucid requests only Cloud Asset Inventory read APIs needed to collect architecture evidence.
- **Project-scoped access** — you provision the pool provider and service account in your GCP project and can revoke bindings at any time.
- **Customer-controlled access** — your GCP administrator controls the Workload Identity Pool, service account, and IAM bindings.

<details>
<summary>ArchLucid federated identity — values for pool provider binding</summary>

GCP Workload Identity Federation must trust ArchLucid's hosted **Azure user-assigned managed identity**:

| Field | Value |
|-------|-------|
| **Issuer (Entra ID)** | `https://login.microsoftonline.com/{ArchLucid tenant ID}/v2.0` |
| **Subject** | ArchLucid managed identity **object ID** (not the client ID) |
| **Audience** | `api://AzureADTokenExchange` for Azure federated credentials; follow your provider's OIDC audience rules for GCP pool providers |

Obtain the current tenant ID and managed identity object ID from Assurance status or the in-product security review when values are environment-specific.

</details>

### Setup steps

1. Open [**GCP cloud connection**](/integrations/cloud-connections/gcp) and complete the in-product security review checklist.
2. Create a Workload Identity Pool provider that trusts ArchLucid's federated identity (values above) and bind a read-only service account.
3. Enter GCP project ID, Workload Identity Pool provider resource name, and service account email.
4. Save the connection, then run **Re-poll now** to confirm federation and inventory access.

### Required roles

| GCP role | Requirement | Purpose | Recommended scope | Write access |
|----------|-------------|---------|-------------------|--------------|
| **Cloud Asset Viewer** (`roles/cloudasset.viewer`) | Required | Project asset inventory for architecture evidence | Connected project | No |

Do **not** assign Owner, Editor, `roles/iam.serviceAccountKeyAdmin`, or any role that can modify your GCP infrastructure on your behalf.

### What verification confirms

- Workload Identity Federation token exchange
- Service account impersonation binding
- Cloud Asset Viewer access to list project assets
- Inventory import into the workspace

**Not confirmed by connection verification:** folder- or organization-wide inventory outside the connected project; billing or cost export permissions.

### Troubleshoot

- Pool provider trust fails — confirm issuer, subject (managed identity object ID), and audience match Assurance status values.
- Attribute mapping errors — align GCP attribute mapping with the subject claim ArchLucid presents.
- Impersonation binding fails — grant the federated principal permission to impersonate the read-only service account.
- Inventory empty or denied — enable the Cloud Asset Inventory API (`cloudasset.googleapis.com`) on the project and confirm Cloud Asset Viewer on the service account.

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

If federation is misconfigured, validation fails fast with a clear error in the product — fix the federated credential trust chain before retrying.

## Azure permissions reference {#azure-permissions}

Use the dedicated in-app guide for role requirements, scopes, setup, and verification:

**[Azure permissions for cloud connections](/help/azure-permissions)**

That guide is driven by the same permission contract as hosted Tier 2 validation and customer onboarding templates. Do **not** assign Owner, Contributor, User Access Administrator, or broad directory roles for the Azure connection.

## Related topics {#related-topics}

- **[Security and trust](/help/security-trust)** — assurance ladder, data handling, and diligence materials.
- **[Hosted SaaS enterprise onboarding checklist](/help/enterprise-onboarding)** — enterprise tenant configuration for administrators (SSO, governance, procurement).
- **[Procurement FAQ](/help/procurement)** — buyer-safe answers for InfoSec and resilience questionnaires.
