> **Scope:** ADR 0104 — SecureNow in-tenant deployment beside ArchLucid PaaS.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0104: SecureNow in-tenant deployment

- **Status:** Accepted
- **Date:** 2026-10-12
- **Owner decision:** Accepted 2026-10-12 without amendment. SN-DEP-01. SN-DEP-02 and SN-DEP-03 may proceed when those prompts are run. This ADR does not build them.

## Context

SecureNow customers are expected to run the product inside their own Azure tenant. ArchLucid stays multi-tenant PaaS, reachable as a hosted service. Both product lines already share one Next.js app and one API host, selected by `NEXT_PUBLIC_ARCHLUCID_PRODUCT`. SN-ED-01 adds `SecureNow:Edition` (`Generic` or `Uhg`, default `Generic`). The Terraform roots under `infra/` describe the ArchLucid-hosted platform. They are not a customer-tenant install.

[ADR 0103](0103-securenow-in-tenant-collection-agent.md) already decided the collection agent: a customer-owned Azure Automation PowerShell 7 runbook, a customer-owned blob handoff, and a hosted reader that never receives shared keys or SAS. That ADR names two hosting modes and leaves the deployment boundary, image shape, and Terraform root to this decision.

The SN-DEP-01 prompt asked for a Proposed ADR. The owner accepted the decision before the file existed, so this record is born **Accepted**. It writes no product code and no Terraform.

`docs/library/PER_TENANT_COST_MODEL.md` estimates LLM token cost. It is not a platform invoice. `infra/terraform-analysis-sandbox/` is a disposable diagram footprint, not a production SecureNow install.

## Decision

Ship **one image set**. Product line, edition, and a new hosting mode are configuration. ArchLucid-hosted and in-tenant SecureNow do not get separate images, separate domain logic, separate API contracts, or a separate schema.

The hosting mode is `SecureNow:Hosting`:

| Value | Meaning |
|---|---|
| `ArchLucidHosted` | The existing multi-tenant PaaS. Default for current ArchLucid hosts and for generic SecureNow that ArchLucid hosts. |
| `InTenant` | One SecureNow instance in the customer subscription. Set by the in-tenant Terraform root. |

`InTenant` is single-tenant **inside** the multi-tenant codebase. It keeps the scoping and isolation checks. It does not remove them, and it does not add SQL row-level security.

## Inputs, outputs, and boundary

**Inputs.** An in-tenant install takes the customer subscription, the customer Entra tenant, a name prefix, `SecureNow:Edition`, the pinned image digests, and the collection scope already named in ADR 0103. It does not take storage account keys, SAS tokens, or client secrets.

**What runs in the customer tenant when `SecureNow:Hosting=InTenant`.**

- The API, background worker, and operator UI.
- One Azure SQL product catalog for the single tenant row.
- App storage and the ADR 0103 handoff container.
- Key Vault and Azure OpenAI in the customer subscription.
- The Entra app registration in the customer tenant.
- The customer-owned collection agent and its managed identity.

**What talks to ArchLucid.** An `InTenant` install does not call ArchLucid PaaS for product data, billing, trial state, or standing support access. UHG sends no outbound telemetry. Generic `InTenant` may send support telemetry only after an explicit opt-in, and that payload is not inventory evidence.

`ArchLucidHosted` SecureNow keeps the ADR 0103 split: the agent and handoff container stay customer-owned, and the hosted service reads only that container.

**What never leaves the tenant in `InTenant` mode.** Extractor ZIPs, run manifests, findings, the SQL catalog, Key Vault secrets, and control-plane tokens stay in the customer tenant. Inventory evidence does not leave, including when generic support telemetry is opted in.

## Same build

One image set, configured by:

- `NEXT_PUBLIC_ARCHLUCID_PRODUCT` (`security` for SecureNow, the existing Architecture value otherwise).
- `SecureNow:Edition` (`Generic` or `Uhg`).
- `SecureNow:Hosting` (`ArchLucidHosted` or `InTenant`).

Separate SecureNow images were rejected. A second build would fork the SN-07 and SN-ED-02 leak guards, the schema migrations, and the API contracts, then drift from the Architecture image under a different release clock. UHG separation stays where SN-ED-01 put it: an edition folder plus the runtime guard. The UHG edition never renders `ArchLucid`. The generic edition may. The hosting mode does not relax that guard. A UHG `InTenant` install and a UHG `ArchLucidHosted` install use the same image and the same leak rule.

## Hosting mode

`SecureNow:Hosting` switches only the host behavior below. It does not switch domain logic.

| Switch | `ArchLucidHosted` | `InTenant` |
|---|---|---|
| Billing | Current ArchLucid billing | Off. The customer pays the Azure subscription. No ArchLucid billing calls. |
| Trial | Current trial behavior | Off. No ArchLucid trial banner or trial provisioning. |
| Vendor Internal navigation | Current vendor Internal pages for platform operators | Hidden. No cross-customer provisioning or platform-operator tools. |
| Telemetry export | Current hosted export | UHG default off. Generic default off, with an explicit opt-in for support telemetry only. |
| Support access | Current hosted support model | No standing ArchLucid support identity. A later customer-created guest is outside this ADR. |
| Update checks | Hosted CD rolls images outside Terraform | No phone-home update check. The customer pins image digests. |

SN-DEP-03 is the Administration variant that renders this table. This ADR does not build those pages.

## Single-tenant inside the multi-tenant codebase

An `InTenant` production install has one tenant row and one product catalog. It still uses `SystemWithPerTenantCatalogs` from [ADR 0037](0037-tenant-isolation-without-rls-defense-in-depth.md). `SingleCatalog` stays limited to Development and CI. Startup still fail-closes when scope derivation is incomplete ([ADR 0041](0041-fail-closed-scope-derivation.md)).

Repository `TenantId` predicates, route scope guards, and per-tenant catalog resolution stay in the image. A deployment that happens to contain one tenant is not a reason to delete those checks. Adding SQL RLS is out of scope; ADR 0037 still forbids that proposal unless a later ADR supersedes it.

The same checks protect `ArchLucidHosted`, where many tenants share the codebase and do not share a catalog.

## Platform services

Compute is **Azure Container Apps**, consistent with [ADR 0018](0018-background-workloads-container-apps-jobs.md) and with `infra/terraform-container-apps/`. Azure Functions is not the app host. App Service is not the app host. A second compute family would fork the image and the scale model the hosted platform already runs.

Data and identity services, all in the customer subscription except Entra, which is in the customer tenant:

| Service | Role in `InTenant` |
|---|---|
| Azure SQL | One product catalog. Failover groups are optional later, not part of the small install. |
| Storage | App payloads and the ADR 0103 handoff container. |
| Key Vault | Secrets the app reads with a managed identity. No secret values in Terraform inputs. |
| Azure OpenAI | Model calls for that install. Token spend is separate from the platform estimate below. |
| Entra ID | Customer-tenant app registration for interactive sign-in. |
| Private endpoints | SQL, Blob, Key Vault, and Azure OpenAI. Public network access disabled on each. |
| Container Apps ingress | No public ingress by default. |

`infra/terraform-private/` already creates private endpoints for SQL, Blob, and optional Key Vault, and it can disable public network access on those three. It does not yet create an Azure OpenAI private endpoint. SN-DEP-02 adds that endpoint behind a new variable whose default leaves current `terraform-private` plans unchanged.

No public ingress is the default. SN-DEP-02 exposes `enable_private_ingress` (default **false**). When true, the root requires a subnet delegated to `Microsoft.App/environments` and sets the existing `container_apps_internal_load_balancer` behavior, with `api_ingress_external` and `ui_ingress_external` false. When false, external ingress stays false, so the UI is not reachable until the customer opts into the private path. The existing Container Apps root keeps its current defaults (`container_apps_internal_load_balancer = false`, external ingress true) so hosted plans do not change.

## Identity

Interactive users sign in through a customer Entra app registration. Service-to-service calls use **user-assigned managed identities** for the API, the worker, and the collection agent. No storage account keys, SAS tokens, or client secrets are Terraform inputs or app settings.

Role assignments stay inside the set ADR 0103 already named, at the narrowest scope:

- Collection agent: `Reader` at each approved subscription or management group; `Cost Management Reader` only where cost collection is enabled; `Storage Blob Data Contributor` on the handoff container only; Graph permissions only when the selected evidence catalog requires them.
- SecureNow reader: `Storage Blob Data Reader` on the handoff container only.
- Run now: `Automation Job Operator` on that Automation account only.
- API and worker: the data-plane roles the hosted roots already use for their own storage and Key Vault, scoped to those resources, plus Azure SQL authentication as the app identity.

`Owner`, `Contributor`, and `User Access Administrator` are not granted. In `ArchLucidHosted` mode the hosted reader still uses the existing workload-identity federation pattern from ADR 0103, not a shared secret.

## Updates

The customer pulls images from a registry the customer trusts and **pins digests** in the in-tenant Terraform variables. ArchLucid does not push a revision into the tenant.

Hosted CD is the opposite pattern. `infra/terraform-container-apps/container_app_image_ownership.tf` records that routine CD rolls images with `az containerapp update` and that Terraform ignores image changes so apply does not revert a rollout. The in-tenant root must not copy that `lifecycle.ignore_changes` behavior. The pin is the source of truth.

This repository does not ship an image-signing pipeline today. Digest pinning is the requirement this ADR can enforce in Terraform. Rejecting unsigned images is a customer registry policy, not a new ArchLucid service. State that gap in the SN-DEP-02 README rather than inventing a signing workflow.

The customer runs database migrations by deploying the image digest whose embedded migration scripts match that release. ArchLucid does not connect to the customer SQL server to migrate it. The migration scripts themselves stay the shared schema; hosting mode does not fork them.

## Telemetry and support

UHG `InTenant` defaults to **no outbound telemetry**. Generic `InTenant` also defaults to off. Generic may opt in to support telemetry. That opt-in does not include extractor packages, manifests, findings, or other inventory evidence.

`InTenant` does not grant ArchLucid a standing support identity, a vendor Internal navigation entry, or a remote support channel. `ArchLucidHosted` keeps the current hosted telemetry and support model.

## Security, scalability, reliability, and cost

**Security.** Private endpoints and disabled public network access keep SQL, storage, Key Vault, and Azure OpenAI off the public data plane. Ingress is not public unless a later ADR reverses this one. Managed identities replace shared secrets. ADR 0037 and ADR 0041 checks stay compiled into the same image. UHG cannot emit the `ArchLucid` name, and UHG `InTenant` does not open an outbound telemetry path. The residual risks are a bad digest pin, an over-broad role assignment, and a private-ingress subnet that is larger than the app needs. SN-DEP-02 checks fail the plan when public network access is enabled or a role assignment is broader than the resource group.

**Scalability.** An `InTenant` install scales inside one subscription: Container Apps replica limits, the Azure SQL SKU, and the ADR 0103 collection fan-out. It does not scale by placing a second customer on the same catalog. A larger estate raises those three knobs. It does not join the ArchLucid elastic pool.

**Reliability.** Collection stays available when the API is down because the agent writes the handoff blob first (ADR 0103). The small install is single-region. `infra/terraform-sql-failover/` remains an optional later root, not a default. The customer controls the upgrade by moving the pinned digest, so a bad image does not roll in from ArchLucid CD. Backup and restore are the customer Azure SQL backup policy. There is no ArchLucid control plane to fail over to.

**Cost.** The figure below is an **order-of-magnitude estimate** for a small, always-reachable, single-region install. It is not an invoice, not a quote, and not taken from `PER_TENANT_COST_MODEL.md`. Confirm the current public price sheet before telling a customer a number. Assumed rates, used only to size the band:

- Container Apps consumption, three apps (API, worker, UI), minimum one replica each, 0.5 vCPU and 1 GiB, about $0.000024 per vCPU-second and $0.000003 per GiB-second, 730 hours: on the order of **$120 per month**.
- Azure SQL General Purpose serverless, 0.5 vCore minimum so the app stays reachable, about $0.50 per vCore-hour, plus modest storage: on the order of **$180–$250 per month**.
- Four private endpoints at about $0.01 per endpoint-hour: on the order of **$30 per month**, plus a small data-processing charge.
- Storage, Key Vault, a few gigabytes of logs, an idle Automation account, and light pay-as-you-go Azure OpenAI: on the order of **$50–$150 per month**. Heavy model use, provisioned throughput, and long blob retention are extra and are not in this band.

**Total for that shape: a few hundred dollars per month, roughly $400–$700.** If the region or policy forces a dedicated Container Apps workload profile instead of consumption, add the profile's always-on cost, itself a few hundred dollars per month, and the total can approach about **$1,000 per month**. That profile is not the default. The analysis sandbox is a different, disposable footprint and is not this estimate.

## Terraform for SN-DEP-02

SN-DEP-02 creates one root, `infra/terraform-securenow-in-tenant/`. It composes existing modules. It does not copy a module or a root into that folder. It does not run `terraform apply`.

Compose these modules:

- `infra/modules/azure-sql-serverless-app` for the product database.
- `infra/modules/azure-openai` for the account and deployments. That module does not set public network access today. Add a variable whose default preserves current caller behavior. The in-tenant root sets public network access to disabled.

These capabilities still live in roots, not in `infra/modules/`:

| Existing root | What SN-DEP-02 reuses | What must not happen |
|---|---|---|
| `terraform-container-apps/` | Internal load balancer and ingress variables already exist. The new root sets private ingress and non-`archlucid` names. | Do not copy the root. Do not copy `lifecycle.ignore_changes` on the image. Hosted defaults stay public-ingress and `archlucid-*` names. |
| `terraform-private/` | SQL, Blob, and optional Key Vault private endpoints. | Add an Azure OpenAI private endpoint variable, default empty, so current plans do not change. |
| `terraform-storage/` | Storage account and private containers. | Do not fork. The handoff container is the ADR 0103 path `securenow-collection/runs/{runId}/`. |
| `terraform-keyvault/` | Vault and workload identity access. | No secret values in tfvars. |
| `terraform-entra/` | App registration and app roles. | Created in the customer tenant. No client secret output used as configuration. |
| `terraform-sql-failover/` | Not in the small install. | Optional later. |
| `terraform-analysis-sandbox/` | Nothing. | Disposable only. |

Where a behavior exists only inside a root, SN-DEP-02 may extract a module under `infra/modules/` and leave the existing root as a caller **with the same defaults**. That extraction is allowed. A pasted second copy is not. New collection-agent resources (Automation account, PowerShell 7 runbook, schedule, and the ADR 0103 role assignments) do not exist as a module yet; they are new in this root or in a new module that only this root calls.

The UHG name prefix must not contain `archlucid`. Existing hosted defaults such as `cae-archlucid` and `archlucid-api` stay on the hosted roots. App configuration from this root sets `NEXT_PUBLIC_ARCHLUCID_PRODUCT=security`, `SecureNow:Edition`, and `SecureNow:Hosting=InTenant`.

## Divergence budget

**May differ** between `ArchLucidHosted` and `InTenant`:

- Configuration: hosting mode, edition, product line, ingress, telemetry opt-in, and image digest pins.
- Terraform: the hosted multi-root apply versus `infra/terraform-securenow-in-tenant/`.
- Administration pages: the six switches in the hosting-mode table (SN-DEP-03).
- Resource names: UHG in-tenant names omit `archlucid`.

**Must not differ:**

- Domain logic.
- API contracts.
- Schema, including the extractor ZIP, the ADR 0103 run manifest, and the shared SQL migrations.
- Tenant isolation and fail-closed scope checks (ADR 0037, ADR 0041).
- The collection permission boundary (ADR 0103).

A change that needs a different API or a different table is a product change for both hosting modes, not an in-tenant fork.

## Evolution

A later AWS or GCP collector would sit beside the Azure extractor family and would emit the same high-level run manifest ADR 0103 already described. It would not fork the API, the schema, the hosting-mode setting, or this Terraform root's compute and data services. This ADR does not design those collectors, their identity systems, or their object stores.

## Trade-offs

One image set gains a single release, a single leak guard, and a single schema. It sacrifices the ability to ship a SecureNow-only binary that cannot even contain Architecture code paths. Those paths stay dark by configuration. A mistake in hosting-mode or edition configuration is then a runtime defect, which is why startup must keep validating `SecureNow:Edition` and `SecureNow:Hosting` instead of trusting a separate build pipeline to have stripped the other product.

`InTenant` gains customer control of data, network, identity, and upgrades. It sacrifices ArchLucid-operated patching, centralized support access, and the low per-tenant price of a shared PaaS pool. The customer pays a few hundred dollars per month before they have a heavy review workload, mostly for always-on SQL and private endpoints. Hosted SecureNow keeps the shared pool and accepts that inventory evidence crosses into ArchLucid only through the customer-owned handoff container.

Keeping ADR 0037 checks in a one-tenant install costs a catalog resolver and scope guards that a from-scratch single-tenant app would skip. It gains one codebase that cannot silently drop isolation when a second tenant appears, and it avoids a second security model for reviewers to audit.

Reusing modules, and extracting a module only when defaults preserve current callers, costs SN-DEP-02 design time. Copying `terraform-container-apps/` into the new root would be faster and would fork ingress defaults, image rollout, and names. That fork is the divergence this ADR refuses.

Private ingress default-off gains a plan that cannot accidentally publish the UI. It sacrifices a working URL on the first apply until the customer sets `enable_private_ingress` and a delegated subnet. That is the intended friction.

## Constraints

- ArchLucid PaaS remains multi-tenant. This ADR does not move ArchLucid into customer tenants.
- ADR 0103 is the collection contract. This ADR does not change the runbook host, the blob paths, or the role list.
- ADR 0037 and ADR 0041 stay in force. No SQL RLS. No `SingleCatalog` production install. No deleted `TenantId` checks.
- UHG runtime output must not contain `ArchLucid`. SN-07 and SN-ED-02 still apply. Generic may say ArchLucid.
- No public ingress by default. Public network access on SQL, storage, Key Vault, and Azure OpenAI is disabled in the in-tenant root.
- No shared keys, SAS tokens, or client secrets in configuration or example tfvars.
- UHG resource names must not contain `archlucid`.
- The in-tenant root does not adopt hosted CD image ignore rules.
- Image signing is not implemented in this repository. Digest pinning is required; signature verification stays a customer registry policy until a later decision.
- `PER_TENANT_COST_MODEL.md` must not be cited as the platform monthly cost.
- `infra/terraform-analysis-sandbox/` must not be cited as the production footprint.
- This ADR adds no product code, no Terraform, and no Azure resources. SN-DEP-02 and SN-DEP-03 are later prompts.
- No legal statement about intellectual property is made here.

## Expected impact

**System.** SecureNow gains a named hosting mode and a single image that can run as ArchLucid PaaS or as one customer-tenant instance. SN-DEP-02 has a root name, a module reuse rule, and a private-ingress variable to implement. API routes and tables do not split.

**Security posture.** Customer data in `InTenant` mode stays in the customer subscription, on private endpoints, with managed identities and the existing isolation checks still active. Hosted mode is unchanged: the only customer data ArchLucid reads is the handoff container from ADR 0103. A regression is observable if an in-tenant plan shows public network access, a public ingress, a shared key, or a role wider than the resource group.

**Operations.** The customer pins digests and runs migrations. ArchLucid does not push into the tenant. The UI stays unreachable until private ingress is enabled. Collection status still comes from the ADR 0103 manifest when the API is down.

**Cost.** A small always-reachable install is estimated at roughly **$400–$700 per month** under the assumptions in the cost section, or up to about **$1,000 per month** if a dedicated Container Apps workload profile is required. The estimate is falsifiable by comparing those assumed rates to the current Azure price sheet. It will be wrong if SQL auto-pauses, if replicas scale past the minimum, or if Azure OpenAI is provisioned throughput.

**Teams.** Security architects get a deployment story that matches "SecureNow runs in our tenant." Cloud engineers get a Terraform root to apply later, not a portal checklist. GRC analysts see no change in findings or evidence schema. ArchLucid operators stop being the people who patch an `InTenant` install.

## Consequences

- **Positive:** One build, a clear tenant boundary, least-privilege identity, and a divergence budget that later prompts can implement without forking the product.
- **Negative:** Customers operate more Azure resources and pay a platform floor of a few hundred dollars per month. First apply does not expose a public URL. Image signing is a customer control, not a repository control.
- **Follow-ups:** SN-DEP-02 builds `infra/terraform-securenow-in-tenant/` inside this decision. SN-DEP-03 builds the Administration variant for the hosting-mode switches. Neither prompt is started here.

## Links

- [ADR 0103 — SecureNow in-tenant collection agent](0103-securenow-in-tenant-collection-agent.md)
- [ADR 0037 — Tenant isolation without SQL RLS](0037-tenant-isolation-without-rls-defense-in-depth.md)
- [ADR 0041 — Fail-closed scope derivation](0041-fail-closed-scope-derivation.md)
- [ADR 0018 — Background workloads on Container Apps](0018-background-workloads-container-apps-jobs.md)
- [`infra/README.md`](../../../infra/README.md)
- [`infra/terraform-container-apps/`](../../../infra/terraform-container-apps/)
- [`infra/terraform-private/`](../../../infra/terraform-private/)
- [`docs/library/PER_TENANT_COST_MODEL.md`](../../library/PER_TENANT_COST_MODEL.md)
- [`docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`](../SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md)
