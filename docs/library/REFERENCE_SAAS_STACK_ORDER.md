> **Scope:** Buyer — Reference Azure SaaS stack order (Terraform) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Reference Azure SaaS stack order (Terraform)

**Objective:** Give platform engineers a **default apply order** for ArchLucid Terraform roots under `infra/`, aligned with private networking and least-privilege identity.

**Last reviewed:** 2026-08-16

**Note:** Greenfield IaC uses **`archlucid`** resource labels and example names. Run `rg "archiforge" infra --glob "*.tf"` before merging Terraform changes (expect zero matches). First deploy: [FIRST_AZURE_DEPLOYMENT.md](FIRST_AZURE_DEPLOYMENT.md).

**Default primary region (2026-04-21):** **`centralus`** for new production Terraform applies (`infra/terraform-container-apps` and related roots) unless data-residency or latency requirements dictate otherwise. Document exceptions in the environment README.

**Subscription mapping:** see [`AZURE_SUBSCRIPTIONS.md`](AZURE_SUBSCRIPTIONS.md) for the canonical **`dev`** (optional engineer CD) / `staging` / `production` / greenfield-CI subscription IDs and the GitHub Environment secret each one maps to. Do **not** hard-code subscription IDs in `infra/**/*.tf` or example tfvars — `azure/login@v2` exports `ARM_SUBSCRIPTION_ID` for every Terraform step in the CD pipeline.

---

## Hosted path: three operator waves (`-MultiRoot`)

**Canonical Azure apply** for hosted SaaS is **[`infra/apply-saas.ps1`](../../infra/apply-saas.ps1) `-MultiRoot`**. Landing-zone scripts (`scripts/provision-landing-zone.ps1` / `.sh`) wrap that entry and always pass `-MultiRoot`.

1. **Validate** metadata composition roots (`infra/terraform-foundation`, `infra/terraform-platform`, `infra/terraform-app`). These declare wave membership only (`azure_apply = false`). They do **not** create Azure resources and must **not** be Azure-applied.
2. **Azure-apply leaf roots** in three waves (each leaf keeps its own backend and resource addresses):
   - **Foundation:** `terraform-private`, `terraform-keyvault`
   - **Platform:** `terraform-sql-failover`, `terraform-storage`, `terraform-redis`, `terraform-cosmos`, `terraform-servicebus`, `terraform-logicapps`, `terraform-openai`, `terraform-acr`
   - **App:** `terraform-entra`, `terraform-container-apps`, `terraform-edge`, `infra/terraform` (Consumption APIM), `terraform-monitoring`

Search and Content Safety stay in `terraform-container-apps`. Nested `module` wrapping of leaves is **out of scope** (would change addresses and collide with per-leaf `backend` blocks). Optional `terraform state mv` into merged backends is **post-V1** — see [`docs/runbooks/TERRAFORM_COMPOSITION_STATE_MV.md`](../runbooks/TERRAFORM_COMPOSITION_STATE_MV.md) and [`V1_DEFERRED.md`](V1_DEFERRED.md) §3.

**Script default without `-MultiRoot`:** [`infra/apply-saas.ps1`](../../infra/apply-saas.ps1) still runs **only** `infra/terraform-pilot` (profile validation). Pass **`-LegacyLeafRoots`** only when you also need `infra/terraform-orchestrator`.

**Canonical production profile (multi-tenant SaaS):** [AZURE_PRODUCTION_PROFILE.md](AZURE_PRODUCTION_PROFILE.md)

---

## Default path: `infra/terraform-pilot` (canonical profile)

Use **[`infra/terraform-pilot/`](../../infra/terraform-pilot/README.md)** as the **single default Terraform entry** for FinOps / sampling profile validation:

- **Opinionated FinOps knobs** (`pilot_monthly_budget_usd`, `app_insights_sampling_percent`, ...) live in that root's variables.
- **`nested_infrastructure_roots`** (Terraform **output**) lists the **same leaf order** as the advanced table below — use `terraform output` from `terraform-pilot` when you need machine-readable sequencing without reading docs.
- **`composition_roots`** lists the three metadata waves (`root_path`). This root **does not create Azure resources**.

---

## Advanced (opt-in): multi-root separate state

Apply each directory below **in order** with **its own backend key** when you need **separate state files** per stack (blast-radius isolation, team ownership). Hosted `-MultiRoot` uses orders **1-15**; order **16** is **legacy-only** (`-LegacyLeafRoots`).

| Order | Root | Purpose |
|------:|------|---------|
| 1 | `infra/terraform-private` | VNet, private endpoints, DNS — **foundation** for data planes. |
| 2 | `infra/terraform-keyvault` | Secrets vault (references from later roots). |
| 3 | `infra/terraform-sql-failover` | Azure SQL + optional **failover group** / consumption budget. |
| 4 | `infra/terraform-storage` | Blob/queue accounts for artifacts and jobs. |
| 5 | `infra/terraform-redis` | Optional **Azure Cache for Redis** for `HotPathCache` (TB-094); wire `hot_path_cache_redis_connection_string` into container-apps. |
| 6 | `infra/terraform-cosmos` | Optional **Cosmos DB** polyglot path (TB-095); dormant unless feature flags enabled. |
| 7 | `infra/terraform-servicebus` | Optional durable messaging for integration consumers; optional **Logic App-scoped** topic subscriptions (governance, trial email, ChatOps, prod promotion, **Marketplace fulfillment** via `enable_logic_app_marketplace_fulfillment_subscription`) for filtered triggers. |
| 8 | `infra/terraform-logicapps` | Optional **Logic App (Standard)** hosts (ADR 0019): **edge**, optional dedicated sites for **governance**, **Marketplace fulfillment**, **trial lifecycle email**, **incident ChatOps**, **promotion customer notify**; apply after messaging + private DNS exist. |
| 9 | `infra/terraform-openai` | Optional **budget** hooks for Azure OpenAI (resource creation may be out-of-band). |
| 10 | `infra/terraform-acr` | Optional **Azure Container Registry** (TB-097); apply **before** Entra / Container Apps so image pull identities can reference it. |
| 11 | `infra/terraform-entra` | App registrations / consent text for API + UI. |
| 12 | `infra/terraform-container-apps` | **API + Worker + UI** workloads, managed identity wiring. |
| 13 | `infra/terraform-edge` | Front Door / WAF / routing to Container Apps. |
| 14 | `infra/terraform` | Optional **Consumption APIM** in front of public HTTPS backend — not a substitute for Premium VNet-injected APIM in all topologies. |
| 15 | `infra/terraform-monitoring` | Log Analytics, Grafana/Prometheus, alert rules, dashboards. |
| 16 | `infra/terraform-orchestrator` | Optional orchestration / automation root (legacy-only; omitted from hosted `-MultiRoot`). |

CI validates **`terraform validate`** + **Trivy config** across these roots (see `.github/workflows/ci.yml`) **and** `infra/terraform-pilot` plus the three composition roots.

### TB-656 — User-assigned Key Vault workload identities (no second pass)

When **`enable_user_assigned_keyvault_workload_identities = true`** (default) in `infra/terraform-keyvault`, API and Worker **user-assigned** identities are created in the **same** keyvault apply that creates the vault. **`Key Vault Secrets User`** is granted immediately — **no TB-092 second pass**.

Wire Container Apps with outputs from `terraform-keyvault`:

- `api_keyvault_user_assigned_identity_id` / `api_keyvault_user_assigned_identity_client_id`
- `worker_keyvault_user_assigned_identity_id` / `worker_keyvault_user_assigned_identity_client_id`

**`infra/apply-saas.ps1 -MultiRoot -Apply`** passes these vars to `terraform-container-apps` automatically and skips the legacy TB-092 re-apply when user-assigned identities are enabled.

### TB-092 — Key Vault workload RBAC (legacy second pass)

Only required when **`enable_user_assigned_keyvault_workload_identities = false`**. `terraform-keyvault` runs **before** `terraform-container-apps`, so API/Worker **system-assigned** `principal_id` values are not known on the first Key Vault apply. After Container Apps exist, grant **`Key Vault Secrets User`** by either:

1. **`infra/apply-saas.ps1 -MultiRoot -Apply`** — runs an extra apply on `terraform-keyvault` (and `terraform-private` when `key_vault_workload_principal_ids` / `key_vault_id` are configured) using Container Apps `terraform output` principal IDs; or
2. Manual re-apply of `terraform-keyvault` with `api_managed_identity_principal_id` / `worker_managed_identity_principal_id` from `api_system_assigned_principal_id` / `worker_system_assigned_principal_id` outputs.

See [`CONFIGURATION_KEY_VAULT.md`](CONFIGURATION_KEY_VAULT.md) and [`TERRAFORM_CROSS_ROOT_DEPENDENCY_SAFETY.md`](TERRAFORM_CROSS_ROOT_DEPENDENCY_SAFETY.md).

---

## SaaS-shaped API profile (optional)

| Artifact | Purpose |
|----------|---------|
| [`ArchLucid.Api/appsettings.SaaS.json`](../../ArchLucid.Api/appsettings.SaaS.json) | Optional settings file chained from `Program.cs` after base `appsettings*.json` — **no secrets** in repo; API keys remain **off** until you wire keys + flip `Authentication:ApiKey:Enabled`. |

---

## GitHub Actions repository variables (hosted probes)

| Variable | Used by | Purpose |
|----------|---------|---------|
| **`ARCHLUCID_STAGING_BASE_URL`** | [`.github/workflows/hosted-saas-probe.yml`](../../.github/workflows/hosted-saas-probe.yml) | Public HTTPS origin for scheduled `curl` checks against `/health/live` and `/health/ready` (example: `https://staging.archlucid.net`). When unset, the workflow **skips** probes so forks do not fail. |
| **`ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED`** | [`.github/workflows/golden-cohort-nightly.yml`](../../.github/workflows/golden-cohort-nightly.yml) | When `true`, runs simulator drift after the JSON contract job. |
| **`ARCHLUCID_GOLDEN_COHORT_REAL_LLM`** | `golden-cohort-nightly.yml` | When `true`, runs the Azure Cost Management budget probe + optional real-LLM gate tests (requires secrets + owner budget approval). |

---

## Post-deploy verification

After image rollout, run **`archlucid deployment-evidence`** (preferred; same gates as `scripts/ci/cd-post-deploy-verify.sh`) or the bash script against the public or private base URL ([DEPLOYMENT_CD_PIPELINE.md](DEPLOYMENT_CD_PIPELINE.md)): `/health/live`, `/health/ready` (**Healthy**), `/openapi/v1.json` (contract sanity unless break-glass), `/version`.

---

## Buyer CI integrations (GitHub + Azure DevOps)

Manifest delta surfaces (`GET /v1/compare`) ship as **GitHub composite actions** and **Azure Pipelines templates** in-repo — see the navigator in **[`integrations/GITHUB_ACTION_MANIFEST_DELTA.md`](../integrations/GITHUB_ACTION_MANIFEST_DELTA.md)** (links to GitHub + Azure DevOps + optional server-side Worker path).

## Related

- [AZURE_PRODUCTION_PROFILE.md](AZURE_PRODUCTION_PROFILE.md) — canonical multi-tenant SaaS Terraform posture (summary).
- [TERRAFORM_CROSS_ROOT_DEPENDENCY_SAFETY.md](TERRAFORM_CROSS_ROOT_DEPENDENCY_SAFETY.md) — blast-radius matrix, safe-apply checklist, variable hand-offs (separate Terraform state roots).
- [DEPLOYMENT_TERRAFORM.md](DEPLOYMENT_TERRAFORM.md) — full root map and constraints.
- [RTO_RPO_TARGETS.md](RTO_RPO_TARGETS.md) — recovery targets by tier.
- [CUSTOMER_TRUST_AND_ACCESS.md](CUSTOMER_TRUST_AND_ACCESS.md) — private data plane narrative.
- [AZURE_SUBSCRIPTIONS.md](AZURE_SUBSCRIPTIONS.md) — canonical subscription IDs, regions, and CD secret mapping.
