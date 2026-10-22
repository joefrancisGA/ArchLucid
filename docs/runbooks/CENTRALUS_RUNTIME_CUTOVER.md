> **Scope:** Operator runbook — co-locate DEV Container Apps with SQL in **Central US (`centralus`)**.

# Central US runtime cutover

**Status:** Compute moved (2026-08-02). Finish cert bind + CD heal + budget.

## Live state after Terraform apply

| Item | Value |
|---|---|
| Compute RG | `rg-ArchLucid-dev-cus` (**centralus**) |
| CAE | `cae-archlucid` in that RG |
| Apps | `archlucid-api`, `archlucid-worker`, `archlucid-ui`, `archlucid-ui-marketing` — **Central US** |
| API FQDN | `archlucid-api.purplebush-a4794286.centralus.azurecontainerapps.io` |
| UI FQDN | `archlucid-ui.purplebush-a4794286.centralus.azurecontainerapps.io` |
| Legacy RG | `rg-ArchLucid-dev` — SQL / ACR / artifact storage (SQL already centralus) |
| Eastus2 CAE/apps | Destroyed by Terraform replace |

GitHub `dev` secrets already set:

- `DEV_TFVARS` → new RG + `location = "centralus"`
- `AZURE_RESOURCE_GROUP` → `rg-ArchLucid-dev-cus`
- `SMOKE_TEST_BASE_URL` → new API FQDN (confirm)

## Remaining operator steps

1. **DNS:** Point `www.archlucid.net` CNAME at  
   `archlucid-ui.purplebush-a4794286.centralus.azurecontainerapps.io`  
   (and `asuid.www` TXT = UI custom domain verification id if required). — **done**
2. **Cert bind** (retry until managed cert Succeeded): — **done** (`SniEnabled`)

   ```powershell
   az containerapp hostname bind -g rg-ArchLucid-dev-cus -n archlucid-ui `
     --hostname www.archlucid.net --environment cae-archlucid --validation-method CNAME
   ```

3. **ApiKey scope + UI proxy auth** (TB-304 / Staging): API must have
   `Authentication__ApiKey__TenantId` **and** `WorkspaceId` **and** `ProjectId` (ScopeIds defaults).
   UI must have `ARCHLUCID_API_BASE_URL` + `ARCHLUCID_API_KEY` (secret `al-ui-apikey`).
   CD heals these on `target=dev` when `DEV_PRIVATE_BETA_AUTH_ENABLED` is false — **applied live 2026-08-03**.

4. **Budget** (apply failed once: start date before current month). In `DEV_TFVARS` / local `dev.tfvars`:

   ```hcl
   container_apps_consumption_budget_time_period_start = "2026-08-01T00:00:00Z"
   ```

   Then:

   ```powershell
   terraform -chdir=infra/terraform-container-apps apply -input=false "-var-file=dev.tfvars" -auto-approve
   ```

5. **CD heal** (secrets / image digest onto new apps; no Terraform):

   ```powershell
   gh variable set CD_MAINTENANCE_WINDOW_OVERRIDE --body 'true'
   gh workflow run cd.yml -f action=deploy -f target=dev -f run_terraform_apply=false
   ```

6. Smoke API `/health` + UI proxy `/api/proxy/api/auth/me` (200) + Reviews list; one SQL-backed call.
7. Clear `CD_MAINTENANCE_WINDOW_OVERRIDE` when done.

## Code fixes (local, not yet committed)

- `main.tf` — prefer explicit `var.location` over RG metadata location  
- `communication_email.tf` — azapi 2.x `body` as HCL object  
- `checks.tf` / `variables.tf` / `dev.tfvars.example` — centralus cutover alignment  

Commit/push on a named branch when ready.
