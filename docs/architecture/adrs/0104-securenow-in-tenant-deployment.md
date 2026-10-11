> **Scope:** ADR 0104 — SecureNow in-tenant deployment beside the ArchLucid PaaS.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0104: SecureNow in-tenant deployment

- **Status:** Proposed
- **Date:** 2026-10-11

## Context

SecureNow and ArchLucid serve different deployment expectations:

- ArchLucid is a multi-tenant PaaS operated by ArchLucid and reachable from
  anywhere.
- SecureNow customers, especially the UHG edition, may require the application,
  evidence, database, identities, and network boundary to remain in their Azure
  tenant.

SN-COL-01 established a customer-owned Azure Automation collector and Blob
handoff. SN-COL-02 established manifest-first, hash-verified ingest. This ADR
decides how the SecureNow application itself is hosted without creating a
second domain implementation or weakening the existing tenant isolation model.

## Decision

SecureNow V1 supports two explicit hosting modes from one product build:

```text
SecureNow:Hosting = ArchLucidHosted | InTenant
```

The default remains `ArchLucidHosted`. `InTenant` is selected by deployment
configuration, never by a cookie, request header, or user-controlled setting.
The UHG deployment uses `InTenant` and the UHG edition. Generic SecureNow may
use either mode.

The application uses one signed image set and one shared API/UI contract. The
deployment root, Azure resource bindings, hosting-mode configuration, and
customer identity boundary differ; domain logic, evidence schemas, API
contracts, authorization rules, and tenant/workspace/project scope handling do
not.

## Inputs, outputs, and boundary

### In-tenant components

The customer-owned Azure subscription contains:

- SecureNow UI and API workloads.
- One SecureNow product SQL database for the customer tenant.
- Customer-owned Blob Storage for evidence, handoff, exports, and retention.
- Key Vault for customer-managed configuration and optional customer
  connections.
- Azure OpenAI, when enabled by customer policy.
- Customer Entra ID application registrations and managed identities.
- Private endpoints, private DNS, and customer-controlled diagnostics.
- The SN-COL-01 Azure Automation account, runbook, schedule, and collection
  container.

The SecureNow API reads the collection handoff container and imports the
existing extractor ZIP. It does not receive broad Reader or Contributor access
to the customer subscription. `Run now` uses only the narrowly scoped
Automation job-start permission defined by SN-COL-01.

### Boundary outputs

The in-tenant instance emits only what the customer explicitly enables:

- No outbound telemetry by default for UHG.
- Optional, opt-in operational telemetry for generic SecureNow, with a
  documented event/data allowlist.
- Optional outbound support bundle or update-check traffic.
- Customer-approved exports and integrations.

Control-plane tokens, secrets, raw customer resources, private network details,
and customer-managed keys remain inside the customer tenant unless the
customer explicitly enables a feature that transfers them. The in-tenant
instance does not depend on ArchLucid runtime availability for collection,
scheduled operation, or local review.

## Build shape and product separation

### Recommended: one signed image set

The release pipeline builds one UI/API/worker image set. Runtime configuration
selects:

- Product line: Architecture or Security.
- SecureNow edition: generic or UHG.
- Hosting mode: `ArchLucidHosted` or `InTenant`.

This is preferred because the highest-risk shared behavior—tenant scope,
evidence import, authorization, audit, and schema evolution—has one compiled
implementation. It avoids a second SecureNow-only image fork that can drift
from the evidence and security fixes delivered to ArchLucid.

The UHG separation argument comes from customer boundary, branding, identity,
network, and deployment ownership—not from duplicating domain code. UHG
customer-facing scripts, resource names, logs, and operator errors remain
SecureNow-only as SN-COL-01 requires. Generic SecureNow may retain ArchLucid
references where the generic edition permits them.

### Rejected alternative: separate SecureNow images

Separate images could make packaging and attribution feel more isolated, but
they duplicate release signing, CVE remediation, migration testing, API
compatibility, and evidence-schema validation. They also increase the chance
that UHG and generic SecureNow answer security questions differently. Separate
images remain a future option only if a later threat model proves a hard
process or supply-chain boundary is required.

SN-07 and SN-ED-02 leak guards therefore remain mandatory in the shared build:

- UHG names and customer-facing copy are resolved from edition configuration,
  not scattered conditional strings.
- SecureNow route and navigation assignments remain explicit.
- Architecture-only surfaces remain blocked in the Security product line.
- Generic attribution is never rendered in UHG mode.

## Hosting-mode behavior

`SecureNow:Hosting` is a deployment-time setting resolved on the server and
passed to the UI as trusted configuration. It changes:

| Concern | `ArchLucidHosted` | `InTenant` |
|---|---|---|
| Billing and trial | ArchLucid commercial/trial services | Customer contract or disabled local billing; no hosted trial assumptions |
| Vendor Internal navigation | Available only under existing authority and internal configuration | Disabled by default; customer administrators see customer operations only |
| Telemetry export | Existing ArchLucid policy and opt-out/allowlist | Disabled by default; explicit opt-in for generic SecureNow |
| Support access | Existing ArchLucid support controls | Customer-controlled support bundle and break-glass process |
| Update checks | ArchLucid release/update service | Optional signed-release check; no required outbound call |
| Collection | Customer handoff read through configured federation or customer-hosted binding | Local/private read from customer handoff container |
| Identity | ArchLucid tenant identity and hosting boundary | Customer Entra tenant and customer-managed application identities |

The setting must not change authorization semantics, tenant scope keys,
evidence validation, audit requirements, or API response meaning.

## Single-tenant instance in the multi-tenant codebase

An in-tenant installation is operationally single-customer, not
scope-free. It still has one local `dbo.Tenants` row and uses the same
`TenantId`, `WorkspaceId`, and `ProjectId` fields and checks as hosted mode.

The application continues to:

- Resolve scope from trusted Entra claims or an ambient job scope.
- Require tenant/workspace/project scope in repositories.
- Use database-per-tenant catalog routing where configured.
- Keep tenant-prefixed blob paths.
- Return not-found for foreign or out-of-scope objects.
- Preserve audit actor and scope fields.

No SQL RLS is introduced. This follows ADR 0037 and the existing database
topology: the product database boundary is primary in production, while
application scope checks remain defense in depth and protect exports, tests,
misconfiguration, and future shared services.

## Platform services

The smallest production-oriented Azure footprint is:

- Azure Container Apps for API, UI, and worker workloads when the customer
  accepts the Container Apps operational model.
- Azure SQL Database for the customer product catalog.
- Blob Storage with private endpoint, encryption, lifecycle, and a dedicated
  collection handoff container.
- Key Vault with RBAC, not access policies, for secrets and customer
  connection material.
- Microsoft Entra ID for user sign-in, service principals, and managed
  identities.
- Azure OpenAI in the customer's subscription when AI features are enabled.
- Private endpoints and private DNS for SQL, Storage, Key Vault, and Azure
  OpenAI where supported by the customer's network.
- Log Analytics and Azure Monitor only for customer-approved diagnostics.

App Service is a viable alternative for customers with an established App
Service standard; it should be a Terraform variable or a later deployment
root, not a second application architecture. Public ingress is disabled by
default. A documented exception may expose only the required edge endpoint
behind the customer's approved network controls.

## Identity and permissions

Every service-to-service call uses a managed identity or customer-approved
Entra workload identity:

- API identity: read/write only to its product database and required customer
  storage containers.
- Worker identity: only the queues, storage, and database operations needed by
  registered jobs.
- UI identity: no direct data-plane credential; it calls the API.
- Collection agent identity: the SN-COL-01 subscription Reader,
  optional Cost Management Reader, and container-scoped Blob Data Contributor.
- SecureNow reader identity: container-scoped Blob Data Reader.
- Run-now caller: Automation Job Operator at the specific Automation account
  scope, not subscription Contributor.

No shared account keys, SAS tokens, client secrets in app settings, Owner,
Contributor, User Access Administrator, or Entra Global Administrator
permissions are deployment inputs.

## Updates and migrations

ArchLucid publishes signed, digest-addressed images to a registry the customer
trusts. The customer pins an image digest or approved release version in
Terraform and controls promotion into its environment. Automatic latest-tag
deployment is not supported for production.

DbUp migrations run through the customer-controlled deployment job using the
same ordered migration set. The job must:

1. Back up or verify the customer's recovery point.
2. Apply forward migrations before starting the new application version.
3. Keep rollback scripts for operational recovery, while treating destructive
   rollback as a customer-approved action.
4. Record the deployed image digest, migration version, and actor.

Backward-compatible API and schema overlap is required during rolling
deployments. A migration that cannot overlap requires an explicit maintenance
window and release gate.

## Telemetry and support

UHG `InTenant` defaults to no outbound telemetry, update checks, or support
callbacks. Customer logs and metrics stay in the customer-selected Azure
Monitor destination. The customer may export a redacted support bundle
explicitly.

Generic SecureNow `InTenant` may opt in to bounded operational telemetry:
deployment version, coarse health, migration version, and anonymized failure
counts. It must not include customer resource identifiers, raw evidence,
tokens, prompts containing customer data, or secret values. The opt-in state,
destination, retention, and disable procedure are customer-visible.

Support access is customer-controlled. There is no silent vendor access to
the in-tenant SQL database, Blob Storage, Key Vault, or Entra directory.

## Security, scalability, reliability, and cost

### Security

The customer tenant is the trust boundary. Private connectivity, managed
identity, least-privilege RBAC, signed image pinning, customer-controlled
retention, and no default public ingress reduce exposure. The shared
application scope and audit rules remain enabled rather than being bypassed
because there is one customer.

Remaining risks are customer RBAC drift, private DNS misconfiguration, update
delay, and customer-operated break-glass access. Terraform validation,
deployment diagnostics, and a documented recovery runbook must make each
failure visible.

### Scalability

The first in-tenant footprint targets one customer tenant and bounded worker
concurrency. Container Apps can scale API replicas and worker jobs, while SQL
and Blob scale independently. Collection fan-out remains bounded inside the
SN-COL-01 agent. Multi-region active/active is not a V1 requirement; a later
deployment module can add geo-replication without changing domain contracts.

### Reliability

The customer owns availability of its network, private endpoints, Entra,
SQL, Storage, and Automation account. Health checks must distinguish app
failure from dependency or identity failure. SQL backups, Blob soft delete,
container retention, image rollback, migration prechecks, and a tested restore
runbook are required for production acceptance.

### Cost

Planning estimate for a small single-tenant installation, not a quote:

| Assumption | Approximate monthly range |
|---|---:|
| 1–3 Container Apps workloads, low traffic, one region | $30–$150 |
| Basic Azure SQL tier with backup storage | $15–$100 |
| Blob, Key Vault, Log Analytics, and low-volume diagnostics | $10–$75 |
| Private endpoints and private DNS | $30–$150 |
| **Indicative total** | **$85–$475/month** |

The largest uncertainty is private networking and Log Analytics retention.
Azure OpenAI, high availability, large evidence retention, frequent
collection, and premium SQL are excluded and can dominate the total.

## Terraform scope for SN-DEP-02

SN-DEP-02 should add a dedicated customer deployment root, reusing existing
modules where their assumptions fit:

1. Resource group, location, naming, tags, and environment metadata.
2. Container Apps environment, API, UI, and worker modules.
3. Customer SQL server/database and firewall/private endpoint choices.
4. Storage account, handoff/evidence containers, lifecycle, soft delete, and
   private endpoint.
5. Key Vault, RBAC assignments, and non-secret configuration outputs.
6. Entra application/service identities and managed identities.
7. Azure OpenAI as an opt-in module.
8. Private DNS zones and links.
9. Log Analytics and customer-selected diagnostics.
10. SecureNow:Hosting, edition, image digest, and update policy variables.
11. SN-COL-01 Automation account, runbook, schedule, identities, and
    container-scoped role assignments.

Existing `infra/terraform-container-apps`, `terraform-private`,
`terraform-entra`, `terraform-openai`, `terraform-sql-app`, and
`terraform-storage` modules should be parameterized where their current
ArchLucid-hosted assumptions prevent reuse. SN-DEP-02 must add variables or
composition wrappers before forking resource logic. The analysis sandbox is
disposable evidence, not the production root.

## Divergence budget

### May differ

- Terraform root and customer resource topology.
- `SecureNow:Hosting` behavior for billing, telemetry, support, and updates.
- Customer-hosted Administration pages for identity, diagnostics, retention,
  and deployment status.
- Image registry, release cadence, and customer maintenance windows.
- Private networking and customer-approved integration endpoints.
- Generic versus UHG branding and customer-facing resource names.

### Must not differ

- Collection manifest and extractor ZIP contracts.
- Evidence validation, hash idempotency, and snapshot materialization.
- Tenant/workspace/project scope enforcement.
- Authentication, authorization, audit, and not-found behavior.
- API resource meanings and error semantics.
- Policy-pack evaluation and finding/remediation domain logic.
- No-SQL-RLS production posture from ADR 0037.

The budget is intentionally small: deployment and operational concerns may
diverge; security and domain truth may not.

## Evolution to AWS and GCP

If collection later adds AWS or GCP, the hosting-mode boundary remains
provider-neutral. Each customer-owned collector can use its native identity,
storage handoff, and Terraform module while emitting the shared high-level
run manifest and a provider-specific evidence section. This ADR does not
select AWS/GCP services or permissions; that work requires a separate
provider-specific design and threat model.

## Trade-offs

One signed build preserves domain consistency and lowers patch and migration
drift, but requires disciplined hosting-mode and edition leak guards. A
customer-owned footprint improves data residency, private connectivity, and
customer control, but transfers operational responsibility for upgrades,
backups, networking, and identity. Container Apps keeps the first root close
to existing Azure-native modules; App Service may be simpler for some
customers but would add another deployment composition.

The design deliberately keeps ArchLucid PaaS and SecureNow InTenant as
deployment modes instead of pretending they have identical cost, support, or
telemetry behavior. It also avoids a premature second API host or SQL schema
fork; those remain option-preserving future work governed by the existing
architecture backlog.

## Constraints

- The customer must provide an Entra tenant, subscription, approved network
  topology, and RBAC approval for the Terraform deployment.
- Azure service availability, private endpoint support, quotas, and regional
  pricing must be verified for the target region.
- Azure Automation runtime and job limits from SN-COL-01 remain deployment
  verification items.
- Customer-owned support and telemetry procedures must be documented before
  production use.
- This ADR does not implement Terraform, image signing, migration runners,
  or an additional API host.

## Expected impact

**System:** SecureNow can run beside the ArchLucid PaaS without cloning the
domain implementation, while hosting mode becomes a stable deployment
boundary.

**Security:** Customer control-plane data, identities, storage, and support
access remain customer-governed. Shared scope and audit controls remain active.

**Operations:** Customers gain pinned releases, private networking, local
diagnostics, and explicit maintenance ownership. ArchLucid must maintain
deployment modules and recovery documentation.

**Cost:** Small installations add an estimated low-hundreds monthly Azure
footprint, with private networking and observability as the major variables.

**Product separation:** UHG can be SecureNow-only in customer-facing
surfaces and telemetry while generic SecureNow retains the optional ArchLucid
relationship in its own hosted mode.

## Links

- [`0103-securenow-in-tenant-collection-agent.md`](0103-securenow-in-tenant-collection-agent.md)
- [`0037-tenant-isolation-without-rls-defense-in-depth.md`](0037-tenant-isolation-without-rls-defense-in-depth.md)
- [`DEPLOYMENT_TERRAFORM.md`](../../library/DEPLOYMENT_TERRAFORM.md)
- [`TENANT_DATABASE_TOPOLOGY.md`](../../library/TENANT_DATABASE_TOPOLOGY.md)
- [`infra/terraform-analysis-sandbox/README.md`](../../../infra/terraform-analysis-sandbox/README.md)
