> **Scope:** Customer-facing — optional cloud evidence connections for architecture reviews.

# Cloud connections

Cloud connections are **optional**. You can start and finalize review packages from briefs, diagrams, documents, and uploaded evidence without connecting a cloud provider.

When you connect Azure, ArchLucid uses **read-only** inventory and cost signals to enrich findings — it does not store long-lived client secrets in your tenant configuration.

---

## Overview {#connect-azure-securely}

ArchLucid can use Azure metadata and cost evidence when you connect selected subscriptions. The Azure connection is optional; reviews can also use briefs, diagrams, documents, and uploaded evidence.

**Evidence tier:** cloud-connected (optional hosted pull from authorized subscriptions).

### Security model

- **Workload identity federation** — ArchLucid authenticates at runtime without storing client secrets.
- **No long-lived client secrets** — federated credentials trust ArchLucid's published managed identity.
- **Read-only Azure roles** — **Reader** and **Cost Management Reader** only.
- **Subscription or management-group scope** — not tenant-wide directory read.
- **Customer-controlled access** — you provision the service principal and can revoke federation at any time.

### Setup steps

1. Complete the in-product **security review** checklist from the [**Azure cloud connection**](/integrations/cloud-connections) page.
2. Create a read-only Azure identity (Azure CLI script, Terraform, or Bicep templates).
3. Enter tenant ID, application (client) ID, and subscription IDs.
4. Save the connection, then run **Run validation pull** to confirm federated credentials and read access.

### Required roles

| Azure role | Purpose | Write access |
|------------|---------|--------------|
| **Reader** | Subscription inventory for architecture evidence | No |
| **Cost Management Reader** | Read-only cost posture for value and risk context | No |

Do **not** assign Owner, Contributor, User Access Administrator, or broad directory roles for the Azure connection.

### What ArchLucid stores

- Tenant ID
- Application (client) ID
- Subscription or management-group scope
- Connection status and validation timestamp

### What ArchLucid does not store

- Client secrets
- Owner or Contributor privileges
- Tenant-wide Global Reader permissions

---

## Workload identity federation {#workload-identity-federation}

ArchLucid-hosted cloud-connected ingestion uses **Azure AD workload identity federation**:

- Your tenant creates a federated credential on the read-only service principal.
- The credential trusts ArchLucid's user-assigned managed identity issuer and subject.
- ArchLucid exchanges a federated token at runtime — no shared secrets are persisted.

If federation is misconfigured, validation fails fast with an API error — fix the federated credential trust chain before retrying.

---

## Azure permissions reference {#azure-permissions}

| Azure role | Purpose | Write access |
|------------|---------|--------------|
| **Reader** | Subscription inventory for architecture evidence | No |
| **Cost Management Reader** | Read-only cost posture for value and risk context | No |

Do **not** assign Owner, Contributor, User Access Administrator, or broad directory roles for the Azure connection.

---

## Related topics {#related-topics}

- **[Security and trust](/help/security-trust)** — assurance ladder, data handling, and diligence materials.
- **[Hosted SaaS enterprise onboarding checklist](/help/enterprise-onboarding)** — enterprise tenant configuration for administrators (SSO, governance, procurement).
- **[Procurement FAQ](/help/procurement)** — buyer-safe answers for InfoSec and resilience questionnaires.
