# Terraform: Azure Container Apps (ArchLucid API + Worker + Operator UI)

Optional root that deploys:

- **Log Analytics** workspace (required by Container Apps Environment)
- **Container Apps Environment** (consumption; optional **VNet integration** + internal load balancer)
- **`azurerm_container_app`** for **ArchLucid.Api** (port **8080**, **`Hosting__Role=Api`**, liveness `/health/live`, readiness `/health/live` — deep `/health/ready` is the CD gate; see [`HEALTH_LIVE_READY_DEPENDENCY_MATRIX.md`](../../docs/operations/HEALTH_LIVE_READY_DEPENDENCY_MATRIX.md), `ASPNETCORE_URLS`)
- **`azurerm_container_app`** for **ArchLucid.Worker** (same image by default, **`command` = `dotnet ArchLucid.Worker.dll`**, **`Hosting__Role=Worker`**, configurable **min/max replicas**, liveness `/health/live` + readiness `/health/ready` on **8080**; optional **`azure-queue`** scale rule when **`worker_enable_queue_depth_scaling`** and a **queue connection string** secret are set; optional **`prometheus`** scale rule when **`worker_enable_authority_outbox_prom_scale`** — see **Background services**)
- **`azurerm_container_app`** for **archlucid-ui** (port **3000**, probes on `/api/health`)

HTTP **KEDA-style** scale rules scale each app between **min/max replicas** using **concurrent request** targets. The **UI** app defaults to **`ui_max_replicas = 6`** and **`ui_scale_concurrent_requests = 10`** so traffic bursts on the shared Container App scale out before requests queue heavily on a single replica.

## API max-replicas sizing vs bulkhead and AOAI TPM (**TB-947**)

Container Apps can add API replicas when **HTTP concurrency** rises (**TB-915** will add CPU/memory rules with OR semantics). **Replica count does not increase Azure OpenAI TPM** — more replicas with the same deployment quota means more parallel handlers competing for the same tokens-per-minute ceiling.

**Sizing checklist (run before raising `api_max_replicas` or running scale drills **TB-946** / launch load **TB-905**):**

| Step | Question | Where to read |
|------|----------|---------------|
| 1 | What is the handler bulkhead per replica? | `AgentExecution:Resilience:MaxConcurrentHandlers` — default **8** ([`CONFIGURATION_REFERENCE.md`](../../docs/library/CONFIGURATION_REFERENCE.md)) |
| 2 | What is the Terraform ceiling? | `api_max_replicas`, `api_min_replicas`, `api_scale_concurrent_requests` in this module |
| 3 | What is the AOAI deployment TPM/RPM? | Azure portal / capacity plan; future **TB-916** Terraform assertions |
| 4 | What is peak **concurrent Real executes** (not HTTP reads)? | Load model, staging pilot, or **TB-946** drill A observations |
| 5 | Upper-bound parallel handlers if every replica is hot | `api_max_replicas × MaxConcurrentHandlers` |
| 6 | Sustainable parallel LLM calls from TPM | `floor(deployment_tpm × headroom ÷ avg_tpm_per_active_handler)` — use **0.7** headroom until measured |
| 7 | Cap replicas | `api_max_replicas ≤ max(1, ceil(sustainable_parallel_llm ÷ MaxConcurrentHandlers))` unless HTTP-only burst is the sole gate |

**Worked staging example** (illustrative — replace TPM and execute rates with your deployment):

| Input | Example value |
|-------|----------------|
| `api_scale_concurrent_requests` | **15** (`staging.tfvars.example`) |
| `api_max_replicas` (candidate) | **6** |
| `MaxConcurrentHandlers` | **8** (appsettings default) |
| AOAI deployment TPM | **240K** TPM |
| Avg TPM per active Real handler | **8K** TPM (measure in App Insights / cost telemetry) |
| Headroom | **0.7** (30% for retries, Ask, Search) |
| Sustainable parallel handlers | `240000 × 0.7 ÷ 8000 ≈ **21**` |
| Bulkhead-capped replica ceiling | `ceil(21 ÷ 8) = **3**` |

**Interpretation:** `api_max_replicas = 6` can be correct for **HTTP/read** bursts, but **Real execute** saturation may need a lower cap (example above → **3**) so autoscale does not add replicas that only increase 429 pressure. HTTP concurrency scale-out during an AOAI 429 storm is a **misleading success signal** — expect Polly retry → optional fallback → shared breaker → partial/failed runs ([`LLM_RETRY_AND_CIRCUIT_BREAKER.md`](../../docs/library/LLM_RETRY_AND_CIRCUIT_BREAKER.md)); drills should **fail closed on quota**, not chase infinite scale-out.

**Cross-refs:** scale-rule mix **TB-915**; micro-drills **TB-946** ([`LAUNCH_LOAD_DRILL.md`](../../docs/architecture/LAUNCH_LOAD_DRILL.md)); noisy-neighbor fairness **TB-1577** (`SHARED_AOAI_TPM_NOISY_NEIGHBOR_FAIRNESS_CLAIM_MAP.md`); future TPM assertions **TB-916** (V2).

## Scale-rule mix: HTTP + CPU (**TB-915**)

Container Apps evaluates **all** scale rules with **OR** semantics — scaling starts when **any** rule’s threshold is met ([Microsoft scale-app](https://learn.microsoft.com/en-us/azure/container-apps/scale-app)). ArchLucid targets:

| App | Rules (Terraform) | Notes |
|-----|-------------------|-------|
| **API** | `http_scale_rule` + optional KEDA **`cpu`** (default **on**, 70% utilization) + optional **`memory`** (default **off**) | CPU catches graph merge / findings / export prep when HTTP concurrency stays low during LLM-wait |
| **Operator UI** | `http_scale_rule` + optional KEDA **`cpu`** (default **off**) | SSR bursts; less critical than API |
| **Worker** | `azure-queue` and/or `prometheus` custom rules only — **not** HTTP | Do not add HTTP scale rules to the worker |

**Variables (primary region + secondary stack):**

| Variable | Default | Purpose |
|----------|---------|---------|
| `api_enable_cpu_scale_rule` | `true` | TB-915 API CPU utilization rule |
| `api_cpu_scale_utilization_percent` | `70` | Average CPU % target |
| `api_enable_memory_scale_rule` | `false` | Enable only with RSS evidence |
| `api_memory_scale_utilization_percent` | `75` | Memory % target when enabled |
| `ui_enable_cpu_scale_rule` | `false` | Optional operator UI CPU rule |
| `ui_cpu_scale_utilization_percent` | `75` | UI CPU % target when enabled |

**AOAI ceiling:** HTTP or CPU scale-out does **not** raise TPM. Cap `api_max_replicas` with the [**TB-947** checklist](#api-max-replicas-sizing-vs-bulkhead-and-aoai-tpm-tb-947) before drills (**TB-946** / **TB-905**).

## When to use this stack

Use this root when you want **per-app replica scaling** and a **container-native** Azure host instead of App Service. It complements:

- **`terraform-private/`** — private endpoints and optional VNet subnet for the Container Apps environment
- **`terraform/`** — APIM in front of the API FQDN
- **`terraform-edge/`** — Front Door + WAF in front of public hostnames

## Azure AI Content Safety

Production-like API hosts (`ASPNETCORE_ENVIRONMENT=Staging` / `Production`) require **`ArchLucid__ContentSafety__Endpoint`** and **`ArchLucid__ContentSafety__ApiKey`**.

- Set **`enable_content_safety_account = true`** to create (or import) a **Content Safety** Cognitive Services account in this resource group. See **`dev.tfvars.example`** for ArchLucid DEV names.
- **Do not** point DEV at accounts in other product RGs (e.g. historical `longevity-safety`).
- Container App secret/env wiring on DEV is **CD-owned**: GitHub Environment secrets **`ARCHLUCID_CONTENT_SAFETY_ENDPOINT`** and **`ARCHLUCID_CONTENT_SAFETY_API_KEY`**. Secret name on the app is **`al-cs-key`** (≤20 characters — Azure CLI limit).
  - Brownfield import:

  ```bash
  terraform import 'azurerm_cognitive_account.content_safety[0]' \
    /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<name>
  ```

## Azure Communication Services Email (transactional)

Private-beta **email OTP**, invites, and trial lifecycle mail use **`Email:Provider=AzureCommunicationServices`** with **managed identity** (no connection string).

- Set **`enable_communication_email_account = true`** to create the Email Communication Service, custom domain (**`archlucid.net`**), **`noreply@archlucid.net`** sender username, linked Communication Service, and **Contributor** RBAC for API + Worker system-assigned identities.
- **DNS:** after first apply, read **`communication_email_domain_verification_records`** and publish TXT/CNAME at your DNS host (apex **`archlucid.net`**, not `www`). Then set **`communication_email_initiate_domain_verification = true`** and re-apply.
- **CD wiring:** set GitHub repo vars **`DEV_ACS_EMAIL_ENDPOINT`** (from output **`communication_email_endpoint`**) and **`DEV_EMAIL_FROM_ADDRESS=noreply@archlucid.net`**. CD heals `Email__*` on the API Container App when **`DEV_PRIVATE_BETA_AUTH_ENABLED=true`**.
- Container App **`template.env`** is **CD-owned** (`lifecycle.ignore_changes`); Terraform does not inject `Email:*` env vars directly.

## Defaults

- **`enable_container_apps = false`** — no resources; safe for `terraform validate` in CI.
- When **`true`**, you must set **`api_container_image`** and **`ui_container_image`** (full ACR or registry references).
- For **private** Azure Container Registry images, set **`acr_resource_id`** (full ARM ID of the registry). Terraform then creates a user-assigned identity, grants **AcrPull**, and registers the registry on each Container App. Leave **`acr_resource_id`** empty only when pulling from a **public** registry.
- When **`true`**, you must set **`artifact_blob_service_uri`** and **`artifact_storage_account_id`** (from **`infra/terraform-storage`** outputs) so the **API** and **Worker** enable **`ArtifactLargePayload`** with **Azure Blob**; each app’s **system-assigned managed identity** receives **Storage Blob Data Contributor** on that account.

## Large artifact blob offload (staging / production)

The API **`ArchLucid.Api`** uses **`DefaultAzureCredential`** against the blob service URI. Container Apps wiring sets:

- **`ArtifactLargePayload__Enabled`** = `true`
- **`ArtifactLargePayload__BlobProvider`** = `AzureBlob`
- **`ArtifactLargePayload__AzureBlobServiceUri`** = your storage account blob endpoint

**`appsettings.Production.json`** / **`appsettings.Staging.json`** default the same shape with an empty URI so **environment variables** (or Key Vault references) must supply the real endpoint in Azure. **`terraform-container-apps`** injects those env vars from **`artifact_blob_service_uri`**.

Ensure **`infra/terraform-storage`** has created containers **`golden-manifests`**, **`artifact-bundles`**, and **`artifact-contents`** (private). Do not expose **SMB (port 445)** publicly; use private endpoints per workspace policy when hardening networking.

## Operator UI → API

The UI calls the backend via same-origin **`/api/proxy`** in dev. In Container Apps, set the server-side base URL for the UI container (e.g. **`ARCHLUCID_API_BASE_URL`** or your Next.js env naming) to the **API HTTPS URL** from Terraform output **`api_https_url`**, or place **APIM** / **Front Door** in front and point at that hostname instead.

## ApiKey scope claims (TB-304)

On **Production**-like API hosts (`ASPNETCORE_ENVIRONMENT` unset defaults to Production in container images), every authenticated request must resolve **tenant + workspace + project** from **identity claims** (or ambient job override)—not from `x-*-id` headers or ScopeIds defaults. ApiKey auth emits those claims only when configured:

| Setting | Env var |
|---------|---------|
| `Authentication:ApiKey:TenantId` | `Authentication__ApiKey__TenantId` |
| `Authentication:ApiKey:WorkspaceId` | `Authentication__ApiKey__WorkspaceId` |
| `Authentication:ApiKey:ProjectId` | `Authentication__ApiKey__ProjectId` |

Terraform variables (all three required together, or all empty):

- **`api_key_tenant_id`** / **`api_key_workspace_id`** / **`api_key_project_id`**

Pilot ScopeIds defaults (match UI `getScopeHeaders()`):

```hcl
api_key_tenant_id    = "11111111-1111-1111-1111-111111111111"
api_key_workspace_id = "22222222-2222-2222-2222-222222222222"
api_key_project_id   = "33333333-3333-3333-3333-333333333333"
```

**Existing Container Apps:** this module’s API resource **`lifecycle.ignore_changes`** includes **`template[0].container[0].env`**, so a later `terraform apply` will **not** overwrite live env. For brownfield, set claims with:

```powershell
.\scripts\deploy\Set-ApiKeyScopeClaims.ps1 -ResourceGroup rg-ArchLucid-dev -ContainerApp archlucid-api
```

(or the same three `--set-env-vars` via `az containerapp update`). Put the GUIDs in **`DEV_TFVARS` / `DEV_TFVARS_EXTRA`** for greenfield applies and documentation.

Without all three claims, UI Overview calls fail with **403** and body text about scope resolved from identity claims.

## Marketing vs operator UI (same image, no Front Door) — TB-2016

Preferred production topology (owner 2026-07-31): **two UI Container Apps**, one ACR image, **no Azure Front Door**.

| App | Variable | Default name | Intended hostname |
|-----|----------|--------------|-------------------|
| Operator UI | `ui_container_app_name` | `archlucid-ui` | `app.archlucid.net` (`ui_custom_domain_name`) |
| Marketing UI | `marketing_ui_container_app_name` | `archlucid-ui-marketing` | apex / `www` (`marketing_ui_custom_domain_name`) |

- Toggle: **`enable_marketing_ui_container_app`** (default **true**).
- Both apps use **`ui_container_image`**. CD updates both when GitHub secrets **`CONTAINER_APP_UI_NAME`** and **`CONTAINER_APP_MARKETING_UI_NAME`** are set.
- Per-app runtime env (set via `az containerapp update --set-env-vars`, ignored by Terraform lifecycle):
  - Marketing: `ARCHLUCID_PUBLIC_SITE_URL`, `ARCHLUCID_APP_SITE_URL`, `ARCHLUCID_API_BASE_URL`, `ARCHLUCID_UI_ROLE=marketing`
  - Operator: same site URL pair + `ARCHLUCID_API_BASE_URL`, `ARCHLUCID_UI_ROLE=operator`
- API CORS must list both origins (`Cors__AllowedOrigins__0`…), e.g. `https://www.archlucid.net` + `https://app.archlucid.net` (+ apex if used).

Docs: [`PUBLIC_MARKETING_SITE_TOPOLOGY.md`](../../docs/library/PUBLIC_MARKETING_SITE_TOPOLOGY.md), [`MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md`](../../docs/library/MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md).

**Ops cutover (DNS / env / CORS / hostname bind / GitHub secret):** dry-run-first script [`scripts/ops/Invoke-MarketingOperatorHostCutover.ps1`](../../scripts/ops/Invoke-MarketingOperatorHostCutover.ps1) and runbook [`docs/runbooks/MARKETING_OPERATOR_HOST_CUTOVER.md`](../../docs/runbooks/MARKETING_OPERATOR_HOST_CUTOVER.md).

## Custom domain without Front Door (`ui_custom_domain_name` / `marketing_ui_custom_domain_name` / `api_custom_domain_name`)

Azure Container Apps supports binding a custom hostname directly to an app with an Azure-managed certificate — no edge tier required. This is the cost-aware option for environments where **`infra/terraform-edge`**'s WAF/CDN base fee ($35–330/month) is not warranted (see [`PILOT_PROFILE.md`](../../docs/deployment/PILOT_PROFILE.md)); the default `*.azurecontainerapps.io` FQDN (**`ui_https_url`** / **`marketing_ui_https_url`** / **`api_https_url`**) remains available either way.

**Apply order matters — Azure verifies domain ownership before a hostname can be bound:**

1. Leave hostname vars empty and run `terraform apply` once (or read existing state) to get **`container_app_environment_custom_domain_verification_id`** (aliases: `ui_custom_domain_verification_id`, `marketing_ui_custom_domain_verification_id`, `api_custom_domain_verification_id`).
2. At your DNS host, create a **TXT** record `asuid.<hostname>` with that value, and a **CNAME** for `<hostname>` pointing at the matching app FQDN (`marketing_ui_container_app_fqdn` for apex/www, `ui_container_app_fqdn` for `app.`, `api_container_app_fqdn` for API).
3. Wait for DNS propagation, set the hostname vars in tfvars (documentation / outputs), and bind the managed certificate with Azure CLI:

```bash
az containerapp hostname bind --hostname <hostname> -g <rg> -n <app-name> --environment <env-name> --validation-method CNAME
```

**Provider note:** azurerm managed-certificate resources have been unreliable (domain can stay HTTP-only — see [hashicorp/terraform-provider-azurerm#27362](https://github.com/hashicorp/terraform-provider-azurerm/issues/27362)). ArchLucid uses the CLI bind path above; Terraform records intended hostnames via variables/outputs only.

## Background services and replicas

**Terraform** provisions a dedicated **`archlucid-worker`** container app (**`worker_min_replicas` / `worker_max_replicas`**, default **1 / 20**) that runs **advisory scan polling**, **data archival**, **retrieval indexing outbox** processing, and (when durable) **background export jobs** from Azure Storage Queue. The **API** app uses **`Hosting__Role=Api`**, so it does **not** run those loops.

**Export async jobs** (`IBackgroundJobQueue`): default **`background_jobs_mode = "InMemory"`** keeps the **in-process** queue on the API (or Combined host). Set **`background_jobs_mode = "Durable"`** to use **SQL** (`dbo.BackgroundJobs`), **Azure Storage Queue** (Terraform creates **`azurerm_storage_queue`** when the blob URI parses a storage account name), and **worker-side processing** (`BackgroundJobQueueProcessorHostedService`). The module then sets **`BackgroundJobs__Mode`**, **`BackgroundJobs__QueueName`**, **`BackgroundJobs__ResultsContainerName`**, grants the API **Storage Queue Data Message Sender** and the worker **Storage Queue Data Message Processor** (blob contributor was already required). **Durable** requires **`ArchLucid:StorageProvider=Sql`**, **Azure Blob** artifacts, and matching app configuration (validated at startup).

**Default `api_min_replicas` is 2** for **staging and production** API availability. For **local or pilot** stacks, set **`api_min_replicas = 1`** in `terraform.tfvars` if you prefer a single API instance.

**Durable export jobs** use **SQL row locks** (`UPDLOCK` + transactional claim) and **batch dequeue** (`BackgroundJobs:ProcessorReceiveBatchSize`, default **16**) so multiple workers do not execute the same job twice; duplicate queue notifications while a job is **Running** are deleted idempotently.

**Singleton hosted loops** (advisory scan, archival, outbox drains, stuck-job watchdog, reconciliation probes, and related background workers) are **leader-elected** when **`HostLeaderElection:Enabled`** is true and storage is **SQL** (**TB-2167**, 2026-08-10). Only the replica holding each SQL lease in **`dbo.HostLeaderLeases`** runs that loop; operators can inspect holders via **`GET /v1/admin/diagnostics/leases`**. Per-replica metrics warmups and startup probes are intentionally **not** leader-gated.

**Queue-depth scaling (KEDA in Container Apps):** set **`worker_enable_queue_depth_scaling = true`**, **`worker_queue_scale_connection_string`** (sensitive; same storage account as the jobs queue), and optionally **`worker_queue_depth_target_messages_per_revision`**. Terraform adds a **`custom_scale_rule`** of type **`azure-queue`** on the worker. **Managed identity** is used for runtime queue access; the connection string is **only** for the scaler secret as required by the platform.

**Authority SQL outbox depth scaling (KEDA Prometheus):** Grafana / Prometheus **`archlucid_authority_pipeline_work_pending`** reflects **SQL** rows in **`AuthorityPipelineWorkOutbox`**. Set **`worker_enable_authority_outbox_prom_scale = true`**, **`worker_authority_outbox_prom_server_address`** (Prometheus HTTPS API base URL, e.g. Azure Monitor workspace query endpoint), and tune **`worker_authority_outbox_prom_pending_scale_threshold`** (default **50**, consistent with **`docs/library/OBSERVABILITY.md`** — Authority pipeline remediation runbook). Optional **`worker_authority_outbox_prom_bearer_token`** enables **bearer** authentication to the metrics API. **`worker_authority_outbox_prom_query`** defaults to **`scalar(sum(archlucid_authority_pipeline_work_pending))`**; override when your scrape labels require a different aggregation. This rule is **additive**: it does **not** remove **`azure-queue`** when that scaler is enabled — Container Apps considers multiple **custom** triggers together with **min/max** replica bounds.

**Authority pipeline backlog vs Azure queue metrics:** The **`azure-queue`** scaler still tracks **`background_jobs_queue_name`** depth (durable **export** dequeue), not SQL row count. **`prometheus`** backlog scaling addresses authority outbox pressure when metrics are available in your Prometheus-compatible API.

## Hot-path cache (SQL mode)

When **`ArchLucid:StorageProvider`** is **Sql**, the API can cache hot reads (manifests, runs, policy packs) via **`HotPathCache`** in `appsettings` / environment variables.

- With **default `api_min_replicas = 2`**, you typically run **multiple API instances**. Set **`HotPathCache__ExpectedApiReplicaCount`** to **2** (or your **`max_replicas`**) **and** **`HotPathCache__RedisConnectionString`** (e.g. Azure Cache for Redis) in **non-Development** environments when **`HotPathCache__Provider`** is **`Auto`**. Startup validation **requires** Redis when `ExpectedApiReplicaCount` &gt; 1 outside Development; without Redis, either keep **`ExpectedApiReplicaCount` at 1** (per-replica memory cache only, possible cross-replica staleness) or set **`HotPathCache__Provider`** to **`Memory`** explicitly.
- **Development** profile disables hot-path cache in `appsettings.Development.json` by default.

## Private images (ACR)

If images are in **Azure Container Registry**, attach a **managed identity** to each `azurerm_container_app` and grant **AcrPull**, then add a **`registry`** block — not included in this minimal root; extend `main.tf` or use a registry module.

## Terraform state and brownfield imports (TB-912)

This root's remote state (key **`container-apps.tfstate`**) is the single owner for every resource declared in **`main.tf`**. Do not split Container Apps, Log Analytics, or managed identities across multiple state files.

**`backend.tf` is gitignored, so CI has to be given it.** With no backend block present, `terraform init` silently selects the **implicit local backend** and starts from empty state — the plan then proposes creating every resource, including the resource group, against infrastructure that already exists. Set the GitHub **environment-scoped** secret **`TF_BACKEND_TF`** to the full contents of `backend.tf` (a `terraform {}` block with this environment's `azurerm` backend); `cd.yml` writes it before `init` in both the plan and apply jobs, and **`scripts/ci/cd_assert_terraform_remote_state.py`** warns on plan-only runs and **fails** the apply when state is still local. Because the secret is per environment, `dev` / `staging` / `production` each keep their own state key under one secret name.

Locally, create `backend.tf` yourself (it will not be committed) or run `terraform init -backend-config=<your>.hcl`.

**Brownfield adoption:** when Azure resources already exist but are missing from state, add temporary Terraform **`import`** blocks on a **short-lived branch** (or only on your machine)—**never merge** import-only files to **`main`**. After the first successful **`terraform apply`** that imports and converges configuration, **delete** the import file and re-run **`terraform plan`** to confirm an empty diff before merging the convergence fixes.

The dev brownfield import file was removed after the dev backend absorbed those resources (**TB-912**, 2026-07-21). For API env-only brownfield fixes without a full import, use **`Set-ApiKeyScopeClaims.ps1`** under **ApiKey scope claims** above.

## Commands

```bash
cd infra/terraform-container-apps
terraform init
cp terraform.tfvars.example terraform.tfvars   # edit
terraform plan
terraform apply
```

## CI

This directory is included in **`.github/workflows/ci.yml`** (`terraform init -backend=false`, `validate`, `fmt -check`).

## CD (image rollouts)

After `terraform apply` created the Container Apps, routine releases usually **push** new image tags to ACR and run **`az containerapp update --image`** for the API, worker (same `archlucid-api:<tag>` image as the API app), and UI. Configure GitHub Environments and secrets per **`docs/DEPLOYMENT_CD_PIPELINE.md`** (workflow **`.github/workflows/cd.yml`**).
