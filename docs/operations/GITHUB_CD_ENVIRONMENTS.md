# GitHub CD environments (dev / staging / production)

Operators configure **three GitHub Environments** on this repository. They may point at the **same Azure subscription and Container Apps** initially; split subscriptions and hostnames later without changing workflow shape.

Canonical workflow: [`.github/workflows/cd.yml`](../../.github/workflows/cd.yml) · Pipeline reference: [`docs/library/DEPLOYMENT_CD_PIPELINE.md`](../library/DEPLOYMENT_CD_PIPELINE.md)

## Environment names

| GitHub Environment | CD `target` input | Intended use |
|--------------------|-------------------|--------------|
| **dev** | `dev` | On-demand `workflow_dispatch` only (optional 22:00 ET maintenance window) |
| **staging** | `staging` | On-demand CD only (no maintenance window enforcement) |
| **production** | `production` | On-demand CD only; optional required reviewers |

Create each under **Settings → Environments** in GitHub.

## Required secrets (per environment)

Copy the **same values** into all three environments until infra diverges.

| Secret | Purpose |
|--------|---------|
| `AZURE_CLIENT_ID` | Entra app registration for GitHub OIDC |
| `AZURE_TENANT_ID` | Entra tenant |
| `AZURE_SUBSCRIPTION_ID` | Deployment subscription |
| `ACR_LOGIN_SERVER` | e.g. `acrarchluciddev.azurecr.io` |
| `AZURE_RESOURCE_GROUP` | e.g. `rg-ArchLucid-dev` |
| `CONTAINER_APP_API_NAME` | e.g. `archlucid-api` |
| `CONTAINER_APP_WORKER_NAME` | e.g. `archlucid-worker` (optional) |
| `CONTAINER_APP_UI_NAME` | e.g. `archlucid-ui` (optional) |
| `SMOKE_TEST_BASE_URL` | Public API base URL (no trailing slash) |
| `ARCHLUCID_API_KEY` | Admin API key (`X-Api-Key`) for OpenAPI post-deploy probe |
| `TF_WORKING_DIRECTORY` | e.g. `infra/terraform-container-apps` (optional) |

### dev-only secrets

| Secret | Purpose |
|--------|---------|
| `DEV_TFVARS` | Multiline HCL body for `dev.tfvars` when planning/applying container-apps Terraform |
| `DEV_JWT_PRIVATE_KEY_PEM` | RSA private key PEM (email OTP JWT minting + CD smoke Bearer token) |
| `DEV_JWT_PUBLIC_KEY_PEM` | Matching RSA public key PEM (`ArchLucidAuth:JwtSigningPublicKeyPem` via `secretref:al-jwt-pub`) |
| `DEV_EMAIL_OTP_HASH_PEPPER` | Pepper for OTP code hashes (`Auth:EmailOtp:HashPepper` via `secretref:al-otp-pepper`) |

### Dev private-beta auth (optional)

When **`DEV_PRIVATE_BETA_AUTH_ENABLED=true`** (repo variable), CD on `target=dev` switches the API from ApiKey to **JwtBearer + email OTP**, bakes **`NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=jwt`** into the UI image, and mints a **Bearer JWT** for post-deploy smoke (instead of `ARCHLUCID_API_KEY`).

| Name | Where | Example / notes |
|------|-------|-----------------|
| `DEV_PRIVATE_BETA_AUTH_ENABLED` | Repo variable | `true` to enable |
| `DEV_OPERATOR_UI_BASE_URL` | Repo variable | `https://www.archlucid.net` — CORS, `Email:OperatorBaseUrl`, OIDC redirect base |
| `DEV_JWT_LOCAL_ISSUER` | Repo variable | `https://www.archlucid.net` |
| `DEV_JWT_LOCAL_AUDIENCE` | Repo variable | `api://archlucid-dev` |
| `DEV_ACS_EMAIL_ENDPOINT` | Repo variable | From Terraform output `communication_email_endpoint` after `enable_communication_email_account` apply |
| `DEV_EMAIL_FROM_ADDRESS` | Repo variable | `noreply@archlucid.net` (apex domain; requires ACS domain verification) |
| `NEXT_PUBLIC_OIDC_AUTHORITY` | Repo variable (optional) | Entra v2.0 issuer for work/school sign-in button |
| `NEXT_PUBLIC_OIDC_CLIENT_ID` | Repo variable (optional) | SPA client id |
| `NEXT_PUBLIC_OIDC_SCOPES` | Repo variable (optional) | `openid profile offline_access api://…/access_as_user` |
| `NEXT_PUBLIC_OIDC_REDIRECT_URI` | Repo variable (optional) | `{DEV_OPERATOR_UI_BASE_URL}/auth/callback` |
| `NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI` | Repo variable (optional) | `{DEV_OPERATOR_UI_BASE_URL}/` |

Generate keys locally: `.\scripts\dev\enable-local-private-beta-auth.ps1` (writes `.local/dev-auth/`). Copy the PEM files and pepper into the GitHub secrets above.

**Transactional email:** provision ACS with `infra/terraform-container-apps` (`enable_communication_email_account = true`), verify **`archlucid.net`** DNS, then set **`DEV_ACS_EMAIL_ENDPOINT`** and **`DEV_EMAIL_FROM_ADDRESS=noreply@archlucid.net`**. CD heals `Email:Provider=AzureCommunicationServices` on the API Container App.

**OIDC note:** the UI can show a work/school button when `NEXT_PUBLIC_OIDC_*` are set, but the API validates **local PEM JWTs** in this profile. Entra access tokens are not accepted until dual-issuer validation ships or you switch the API to Entra `Authority` mode.

## Repository variables (recommended)

Set under **Settings → Secrets and variables → Actions → Variables** (or per-environment where noted).

| Variable | Suggested value (dev) | Purpose |
|----------|----------------------|---------|
| `CD_ROLLBACK_ON_SMOKE_FAILURE` | `true` | Restore last-known-good API/worker/UI (BUILD_ID/digest) after smoke failure |
| `CD_POST_DEPLOY_MAX_ATTEMPTS` | `6` | Retry deployment-evidence probes during cold start |
| `CD_POST_DEPLOY_RETRY_WAIT_SECONDS` | `10` | Wait between probe attempts |
| `CD_CANARY_ENABLED` | `true` | Split API ingress to the new revision before smoke (requires `api_revision_mode = Multiple`) |
| `CD_CANARY_INITIAL_PERCENT` | `10` | Weight on the new API revision during bake (1–99) |
| `CD_CANARY_BAKE_MINUTES` | `3` | Minutes to wait after split before smoke runs |
| `SMOKE_SYNTHETIC_PATH` | `/api/auth/me` | Extra authenticated GET after `/version` during deployment-evidence (ReadAuthority, no mutation) |
| `CD_MAINTENANCE_WINDOW_OVERRIDE` | unset (`false`) | Set `true` for break-glass dev deploy outside 22:00 ET |

**Cold-start checklist (no Azure SKU change):** After bootstrap or any manual CD setup, confirm `CD_POST_DEPLOY_MAX_ATTEMPTS=6` and `CD_POST_DEPLOY_RETRY_WAIT_SECONDS=10` under **Settings → Secrets and variables → Actions → Variables**. These retries run only in GitHub Actions and do not raise Container Apps `min_replicas` or CPU/memory. Audit locally:

```powershell
.\scripts\ci\verify-cd-post-deploy-retry-vars.ps1
```

Use `-Apply` to set recommended values when vars are missing or too low. `bootstrap-github-cd-environments.ps1` sets both and re-runs this check.

**Canary checklist (staging/production):** Apply Terraform with `api_revision_mode = "Multiple"` on the API Container App (`staging.tfvars.example` / `production.tfvars.example`), then confirm `CD_CANARY_ENABLED=true`, `CD_CANARY_INITIAL_PERCENT=10`, and `CD_CANARY_BAKE_MINUTES=3`. Brief dual-revision overlap during deploy is normal; smoke still gates promotion to 100%. When smoke fails (including mid-bake), `CD_ROLLBACK_ON_SMOKE_FAILURE=true` restores last-known-good revisions via the same schema-gated plan as non-canary deploys. Audit:

```powershell
.\scripts\ci\verify-cd-canary-vars.ps1
```

See [`PRODUCTION_DEPLOYMENT.md`](../runbooks/PRODUCTION_DEPLOYMENT.md#part-c--canary-promotion-container-apps).

**Synthetic warm-path checklist (staging/production):** Set `SMOKE_SYNTHETIC_PATH=/api/auth/me` so CD runs one extra authenticated GET after `/version` (warms auth + tenant scope; must not mutate data). Requires `ARCHLUCID_API_KEY` on the deployment-evidence step. Audit:

```powershell
.\scripts\ci\verify-cd-synthetic-path-vars.ps1
```

Use `-Apply` when the var is unset or still `/version`. `bootstrap-github-cd-environments.ps1` sets the recommended value and re-runs this check.

## Optional per-environment expected-target variables (recommended for production)

CD runs **Azure deployment-target preflight** after OIDC login. Prefer setting these as **Environment variables** so expected targets are explicit and distinct from the login client id:

| Variable | Compared against |
|----------|------------------|
| `EXPECTED_AZURE_TENANT_ID` | Live `az account show.tenantId` (fallback: secret `AZURE_TENANT_ID`) |
| `EXPECTED_AZURE_SUBSCRIPTION_ID` | Live subscription id (fallback: secret `AZURE_SUBSCRIPTION_ID`) |
| `EXPECTED_AZURE_RESOURCE_GROUP` | Live resource group (fallback: secret `AZURE_RESOURCE_GROUP`) |
| `EXPECTED_AZURE_LOCATION` | Optional RG location |
| `EXPECTED_ACR_LOGIN_SERVER` | Live ACR login server (fallback: secret `ACR_LOGIN_SERVER`) |
| `EXPECTED_CONTAINER_APP_API_NAME` | API Container App (fallback: secret) |
| `EXPECTED_CONTAINER_APP_WORKER_NAME` | Optional worker app |
| `EXPECTED_CONTAINER_APP_UI_NAME` | Optional UI app |
| `EXPECTED_CONTAINER_APP_ENVIRONMENT_NAME` | Optional managed environment name from API app |

Mismatch **fails the job before** ACR push / Terraform apply / `az containerapp update`.

## Dev maintenance window (22:00–23:00 America/New_York)

CD has **no cron schedule** — only `workflow_dispatch`. When you do dispatch `target=dev`:

- **Window:** Allowed only during hour **22** ET unless `CD_MAINTENANCE_WINDOW_OVERRIDE=true`.
- **Confirmation deadline:** Post-deploy validation must pass before **23:00** ET; otherwise the workflow fails and rollback runs when `CD_ROLLBACK_ON_SMOKE_FAILURE=true`.

Staging and production are **not** window-gated.

## Bootstrap script

From repo root (requires `gh` CLI and repo admin):

```powershell
.\scripts\ci\bootstrap-github-cd-environments.ps1 `
  -AdminApiKey '<same value as Container App Authentication__ApiKey__AdminKey>' `
  -AzureClientId '<oidc-app-client-id>' `
  -AzureTenantId '<tenant-id>' `
  -AzureSubscriptionId '<subscription-id>' `
  -AcrLoginServer 'acrarchluciddev.azurecr.io' `
  -AzureResourceGroup 'rg-ArchLucid-dev' `
  -SmokeTestBaseUrl 'https://<api-fqdn>' `
  -AlertSmsPhone '<digits-only-us-cell>' `
  -AlertVoicePhone '<digits-only-us-cell>'
```

This sets environment secrets/variables for **dev**, **staging**, and **production** (same Azure targets for now). Phone numbers are stored only in GitHub Secrets / Terraform apply inputs, not in git.

## P0 alerting (SMS + voice)

Apply `infra/terraform-monitoring` with `enable_critical_action_group=true` and phone numbers from Key Vault or `TF_VAR_alert_sms_phone_number` / `TF_VAR_alert_voice_phone_number`. See [`infra/terraform-monitoring/dev.tfvars.example`](../../infra/terraform-monitoring/dev.tfvars.example).

P0 Prometheus rules route to the **critical** action group; dev CPU/SLO alerts stay on the email-only **ops** group unless you wire Prometheus workspace IDs.
