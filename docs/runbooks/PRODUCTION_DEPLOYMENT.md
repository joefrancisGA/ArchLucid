> **Scope:** Hosted SaaS production deployment (Terraform + Container Apps + edge) for internal operators — numbered checklist with verification, minimum Azure RBAC, owner-only vs automatable steps; does not replace root `README.md` files under `infra/terraform-*/` or org change control.

# Production deployment runbook (hosted SaaS stack)

**Audience:** Platform / release operators deploying ArchLucid into a **clean Azure subscription** (greenfield) or promoting a validated release to production.

**Canonical references (do not duplicate their logic here):**

- Apply order and pilot vs multi-root: [`docs/library/REFERENCE_SAAS_STACK_ORDER.md`](../library/REFERENCE_SAAS_STACK_ORDER.md), [`docs/library/FIRST_AZURE_DEPLOYMENT.md`](../library/FIRST_AZURE_DEPLOYMENT.md), [`infra/README.md`](../../infra/README.md).
- Orchestration script: [`infra/apply-saas.ps1`](../../infra/apply-saas.ps1) (`-MultiRoot` = per-root state in dependency order; default without `-MultiRoot` is **`infra/terraform-pilot`** only — profile validation, **no** Azure resources).
- Container workloads module: [`infra/terraform-container-apps/`](../../infra/terraform-container-apps/).
- CD automation (patterns): [`.github/workflows/cd-staging-on-merge.yml`](../../.github/workflows/cd-staging-on-merge.yml) (optional auto-staging), [`.github/workflows/cd-saas-greenfield.yml`](../../.github/workflows/cd-saas-greenfield.yml) (**DRAFT** / `workflow_dispatch` — quarterly empty-subscription proof), [`.github/workflows/cd.yml`](../../.github/workflows/cd.yml) + [`docs/library/DEPLOYMENT_CD_PIPELINE.md`](../library/DEPLOYMENT_CD_PIPELINE.md) (manual CD).
- DbUp / rollback posture: [`docs/runbooks/MIGRATION_ROLLBACK.md`](./MIGRATION_ROLLBACK.md); migrations run from API startup via [`ArchLucid.Host.Core/Startup/ArchLucidPersistenceStartup.cs`](../../ArchLucid.Host.Core/Startup/ArchLucidPersistenceStartup.cs) (`DatabaseMigrator`).
- Production config gates: `ArchLucidConfigurationRules` → `ProductionSafetyRules` + **`BillingProductionSafetyRules`** ([`ArchLucid.Host.Core/Startup/Validation/`](../../ArchLucid.Host.Core/Startup/Validation/)) — **Production** startup fails on unsafe billing/Marketplace/CORS settings.

**Naming:** This document intentionally avoids real subscription IDs, vault names, hostnames, and secret values. Substitute your environment’s values.

---

## 1. Pre-flight checks

Complete in order; each line lists **verification**, **minimum Azure RBAC** (lowest common built-in roles — tighten with custom roles where your org requires), and **automation**.

| # | Check | Verify | Min. Azure RBAC (typical) | Owner-only (O) vs Automatable (A) |
|---|--------|--------|---------------------------|-------------------------------------|
| 1.1 | **Subscription & tenant** — correct Entra tenant and deployment subscription selected (`az account show`). | Identity matches change ticket; no accidental cross-env apply. | *Reader* at scope you plan against (subscription or MG). | O: subscription selection; A: scripted `az account set`. |
| 1.2 | **Git / artifact** — image tags or build artifacts referenced by `terraform-container-apps` tfvars exist in ACR (or approved registry). | `az acr repository show-tags` (or pipeline artifact) shows the tag; digests immutable for production. | *AcrPull* or *Reader* on ACR + network path to registry. | A: CI build-push; O: approving non-standard tags. |
| 1.3 | **Key Vault & secrets** — connection strings, OIDC client secrets (if any), Stripe/Marketplace **configuration** (no literals in repo), webhook HMAC, **`Cors:AllowedOrigins`** sources aligned with UI origins. | Portal or `az keyvault secret list` shows required names populated; API identity can resolve references at runtime. | *Key Vault Secrets User* (get) for deploy SP/MI; *Secrets Officer* only for rotators. | **O:** live payment keys, Partner Center–bound values; **A:** templated secret provisioning pipelines. |
| 1.4 | **DNS** — public zones/delegation for customer and API hostnames; private DNS links if using private endpoints. | `nslookup` / resolver shows expected NS/delegation; private zone linked to VNet per `terraform-private` README. | *DNS Zone Contributor* on public zones; *Private DNS Zone Contributor* where applicable. | **O:** registrar/delegation; **A:** Terraform records once zones exist. |
| 1.5 | **Terraform remote state** — backend storage account/container exists; **unique state key per root**; backend auth configured for human or CI. | `terraform init` succeeds in each `infra/terraform-*` root you will apply (no accidental state merge). | *Storage Blob Data Contributor* on tfstate container (OIDC/user); RG deploy rights for bootstrap RG if creating backend in-band. | **O:** first-time bootstrap & break-glass; **A:** routine `init/plan/apply`. |
| 1.6 | **Billing production safety** — before pointing **Production** traffic at a build, configuration must satisfy **`BillingProductionSafetyRules`** (e.g. live Stripe prefix requires webhook signing secret; Marketplace landing URL non-loopback; `GaEnabled` semantics per [`docs/library/BILLING.md`](../library/BILLING.md)). | Staging slot or config lint passes; production Key Vault/ACA env matches rules **before** cutover (otherwise API exits on startup — see step 4). | Same as secrets/config writers for ACA/Key Vault. | **O:** business decision to enable live commerce rails; **A:** mechanical secret injection. |
| 1.7 | **GitHub Environments** (if using Actions CD) — `production` environment protection rules, OIDC federated credentials for the deploy identity, secrets (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, ACR, Container App names, `SMOKE_TEST_BASE_URL`, etc.). | Dry-run workflow or [`cd-saas-greenfield.yml`](../../.github/workflows/cd-saas-greenfield.yml) validation job pattern succeeds where applicable. | Azure side: trust GitHub OIDC app + *Federated Identity Credential* on app registration; GitHub: admin on repo env. | **O:** org admin / app owner; **A:** routine deploy after setup. |

---

## 2. Terraform plan review (WhatIf equivalent)

**What:** From repo root, run **`infra/apply-saas.ps1`** **without** `-Apply` (default = **plan**). For full stack: **`-MultiRoot`**. That runs `terraform plan -input=false` per root in the sequence embedded in the script (aligned with [`REFERENCE_SAAS_STACK_ORDER.md`](../library/REFERENCE_SAAS_STACK_ORDER.md)).

**Verify:** Each root’s plan is **reviewed** (no unexpected destroys; module upgrades noted); save plan artifacts per org policy.

**RBAC:** Same as §1.1 plus per-resource **plan** needs read/metadata on existing resources — typically *Contributor* on target RGs or custom “deployer” role combining required resource types.

**Owner-only vs automatable:** **O:** approves plan for production; **A:** generates plan in CI (artifact) or locally.

---

## 3. Terraform apply sequence

**Conceptual layers** (map to the **numbered multi-root order** in [`REFERENCE_SAAS_STACK_ORDER.md`](../library/REFERENCE_SAAS_STACK_ORDER.md) — this is what [`infra/apply-saas.ps1 -MultiRoot -Apply`](../../infra/apply-saas.ps1) follows):

1. **Networking / data-plane envelope** — `infra/terraform-private` (VNet, private endpoints, DNS).
2. **Secrets plane** — `infra/terraform-keyvault`.
3. **SQL** — `infra/terraform-sql-failover` (and any prerequisite servers/databases your tfvars assume).
4. **Platform adjacent** — `infra/terraform-storage`, `infra/terraform-servicebus`, `infra/terraform-logicapps`, `infra/terraform-openai` as enabled.
5. **Identity (Entra app objects)** — `infra/terraform-entra`.
6. **Compute** — `infra/terraform-container-apps` (API, worker, UI; managed identities; env referencing Key Vault).
7. **Edge** — `infra/terraform-edge` (Front Door / WAF).
8. **Optional APIM** — `infra/terraform` (consumption pattern per README — not a substitute for all Premium topologies).
9. **Monitoring** — `infra/terraform-monitoring`.
10. **Orchestrator** — `infra/terraform-orchestrator` if your fork uses it.

**Execute:** `.\infra\apply-saas.ps1 -MultiRoot -Apply` (PowerShell) **after** separate plan review, or apply saved plans per [`FIRST_AZURE_DEPLOYMENT.md`](../library/FIRST_AZURE_DEPLOYMENT.md) (`terraform apply tfplan`) if your process requires frozen plans.

**Verify:** `terraform output` in each applied root matches expectations; Container Apps show **Running** revisions; no failed deployments in Activity Log for the change window.

**RBAC (typical composite for “Terraform deployer” SP):** *Contributor* (or resource-provider–scoped custom) on subscription/RGs holding deployed resources; *User Access Administrator* **only** if modules assign RBAC (often **owner-only**); Key Vault / DNS / SQL / ACR permissions as required by modules.

**Owner-only vs automatable:** **O:** first Entra consent, breaking IAM changes, production firewall exceptions; **A:** scripted multi-root apply after approval.

---

## 4. Post-Terraform validation (health, version, billing gate)

| Step | Action | Verify |
|------|--------|--------|
| 4.1 | Probe Container Apps ingress or internal LB URL for API. | `GET /health/live` **200**. |
| 4.2 | Readiness | `GET /health/ready` **200** and JSON **Healthy** (matches CD semantics in [`DEPLOYMENT_CD_PIPELINE.md`](../library/DEPLOYMENT_CD_PIPELINE.md)). |
| 4.3 | Build identity | `GET /version` **200** (or your synthetic path). |
| 4.4 | **`BillingProductionSafetyRules` / `ProductionSafetyRules`** | API process **starts** and stays running with `ASPNETCORE_ENVIRONMENT=Production` (misconfiguration exits at startup — see [`docs/engineering/DEPLOYMENT.md`](../engineering/DEPLOYMENT.md)); Application Insights / container logs show **no** configuration validation fatals after deploy. |

**RBAC:** Data-plane HTTP checks need **no** Azure RBAC if anonymous; diagnosing ACA needs *Azure Container Apps Contributor* or *Reader* + operational roles.

**Owner-only vs automatable:** **A:** `scripts/ci/cd-post-deploy-verify.sh`, `archlucid doctor`, `archlucid deployment-evidence` (same family as CD smoke).

---

## 5. Database migration verification (DbUp)

**Behavior:** On API startup, [`DatabaseMigrator`](../../ArchLucid.Persistence/Data/Infrastructure/DatabaseMigrator.cs) applies embedded scripts (topology-dependent: system catalog vs tenant — see `ArchLucidPersistenceStartup`).

| Step | Verify |
|------|--------|
| 5.1 | After first healthy `/health/ready`, connect with **migration-auditor** tooling or DBA session: **`SchemaVersions`** (DbUp journal) present and latest script id matches shipped build (see [`MIGRATION_ROLLBACK.md`](./MIGRATION_ROLLBACK.md)). |
| 5.2 | `dotnet run --project ArchLucid.Cli -- doctor --api <base>` reports **no** “SchemaVersions missing” / “no migration scripts applied” class defects for that catalog (see [`DoctorQuickStartReadiness`](../../ArchLucid.Cli/Diagnostics/DoctorQuickStartReadiness.cs) messages). |
| 5.3 | **System / tenant topology:** if `ArchLucid:SqlTopology:Mode=SystemWithPerTenantCatalogs`, repeat journal checks for **system** and a **pilot tenant** catalog per runbook norms. |

**RBAC:** SQL: least-privilege login for operators (e.g. *SQL DB Contributor* / `db_datareader`+`db_ddladmin` as per org standard — align with DBAs).

**Owner-only vs automatable:** **O:** approving post-migration PITR point; **A:** scripted SQL checks.

---

## 6. Smoke test (production base URL)

**Important:** [`release-smoke.ps1`](../../scripts/release-smoke.ps1) **starts a local `ArchLucid.Api` process** for its default E2E ladder (see [`docs/library/RELEASE_SMOKE.md`](../library/RELEASE_SMOKE.md)). It does **not** replace hosted probes against a **remote** production URL.

| Step | Action | Verify |
|------|--------|--------|
| 6.1 | **Hosted production (preferred):** `bash scripts/ci/cd-post-deploy-verify.sh https://<api-host>` | Script exits **0**; `/health/ready` Healthy. |
| 6.2 | **CLI parity with CD:** `dotnet run --project ArchLucid.Cli -- doctor --api https://<api-host>` | Exit **0**; no failing readiness narrative. |
| 6.3 | **Evidence bundle:** `dotnet run --project ArchLucid.Cli -- deployment-evidence --environment production --api-base-url https://<api-host> --repo <repo-path> …` | Exit **0**; Markdown artifact matches policy (same job pattern as [`DEPLOYMENT_CD_PIPELINE.md`](../library/DEPLOYMENT_CD_PIPELINE.md)). |
| 6.4 | **Optional:** `.\scripts\release-smoke.ps1 -SkipE2E` **before** promotion | Confirms **local** build + core tests only — **not** production URL; use 6.1–6.3 for prod. |

**RBAC:** None for HTTPS checks; GitHub/Azure identity for pipeline-hosted smoke.

**Owner-only vs automatable:** **A:** post-deploy smoke job; **O:** interpreting failures that need product/config decisions.

---

## 7. DNS cutover and Front Door verification

| Step | Action | Verify |
|------|--------|--------|
| 7.1 | Confirm `infra/terraform-edge` (and any CNAME/alias records) published per module outputs. | Customer-facing hostname resolves to **Front Door** (or designated edge); TLS certificate **valid** (no browser warnings in pilot browser). |
| 7.2 | **Gradual cutover** — lower TTL before change; shift traffic per runbook/canvas. | Synthetic checks from outside your corp VPN: `GET /health/live` via **public** hostname **200**. |
| 7.3 | **WAF / rules** — ensure allowed routes and rate limits match [`infra/terraform-edge`](../../infra/terraform-edge/) config. | Intentional negative probe blocked as expected; legitimate `POST` to API succeeds. |

**RBAC:** *CDN Profile Contributor* / *Front Door Contributor* (or equivalent) on edge RG; DNS as §1.4.

**Owner-only vs automatable:** **O:** production DNS change window approval; **A:** Terraform-driven record updates.

---

## 8. Post-deployment monitoring (first ~30 minutes)

| Timebox | Check |
|---------|--------|
| T+0–5m | Alert rules fire **only** expected autosaves; ACA **Replica** count stable; no surge in **5xx** on edge metrics. |
| T+5–15m | DB DTU/vCore / connection count normal; **DbUp**-related errors **absent** in API logs; queue depths (if Service Bus) flat. |
| T+15–30m | **Trial / billing** canary (if enabled) in **safe** mode per commercial policy; [`docs/runbooks/INFRASTRUCTURE_OPS.md`](./INFRASTRUCTURE_OPS.md) escalation path if anomaly. |

**RBAC:** *Monitoring Reader* + *Log Analytics Reader*; responder roles per on-call.

**Owner-only vs automatable:** **A:** dashboards; **O:** customer comms if user-visible.

---

## 9. Rollback procedure

**Application (Container Apps) — fastest:**

1. Record **current** and **previous** revision names (`az containerapp revision list`).
2. **Drain traffic** to prior revision: `az containerapp ingress traffic set` (pattern in [`.github/workflows/cd-staging-on-merge.yml`](../../.github/workflows/cd-staging-on-merge.yml)) or **deactivate** the bad revision (`az containerapp revision deactivate`).
3. **Verify** `/health/ready` Healthy on public hostname; run §6.1 again.

**Terraform / state:**

- **Do not** “revert state” without a matching **infrastructure** plan — state files live **per root** (`*.tfstate` keys); undo by applying a known-good **plan** or `terraform apply` with rolled-back **tfvars**, in **reverse dependency order** only for destroys (see [`FIRST_AZURE_DEPLOYMENT.md`](../library/FIRST_AZURE_DEPLOYMENT.md) destroy guidance).
- **Production** data plane (SQL, storage): prefer **PITR** or geo-failover per [`docs/runbooks/MIGRATION_ROLLBACK.md`](./MIGRATION_ROLLBACK.md) and [`docs/runbooks/DATABASE_FAILOVER.md`](./DATABASE_FAILOVER.md) — schema rollback is **not** automated by DbUp.

**RBAC:** *Azure Container Apps Contributor* for revision operations; Terraform service same as §3; SQL **owner-only** for restore.

**Owner-only vs automatable:** **O:** PITR / failover decision; **A:** scripted revision rollback (mirror CD rollback job).

---

## Related

- Umbrella: [`docs/engineering/DEPLOYMENT.md`](../engineering/DEPLOYMENT.md)  
- Ops context: [`docs/runbooks/INFRASTRUCTURE_OPS.md`](./INFRASTRUCTURE_OPS.md)  
- Staging validation checklist: [`docs/runbooks/STAGING_DEPLOYMENT_VALIDATION.md`](./STAGING_DEPLOYMENT_VALIDATION.md)
