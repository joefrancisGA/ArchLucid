# RC2 Container Apps Deployment Runbook

**Audience:** On-call engineer diagnosing or recovering a broken RC2 Azure deployment.  
**Environment:** `dev` — `rg-ArchLucid-dev`, Azure Container Apps, Azure SQL.  
**Last updated:** 2026-06-28

---

## Quick reference

| Resource | Value |
|---|---|
| API Container App | `archlucid-api` |
| UI Container App | `archlucid-ui` |
| Resource Group | `rg-ArchLucid-dev` |
| API FQDN | `archlucid-api.orangewave-b0bbb43e.eastus2.azurecontainerapps.io` |
| UI custom domain | `https://www.archlucid.net` |
| SQL server | `archlucid-dev.database.windows.net` |
| System database | `ArchLucid` |
| Tenant database | `ArchLucidTenantDev` |
| SQL server RG | `rg-longevity-dev-01` |
| SQL topology mode | `SystemWithPerTenantCatalogs` |

---

## 1. Run the diagnostic script first

Before doing anything else, run the read-only diagnostic:

```powershell
# From repo root — no Azure SDK module required, uses az CLI.
.\scripts\deploy\Diagnose-RC2Deployment.ps1

# If you know what SHA should be running, pass it:
.\scripts\deploy\Diagnose-RC2Deployment.ps1 -ExpectedSha 6600bd4ce17ee62446ee7ec1c12f8baa65b36ec6
```

The script reports:
- Active revision, image, `runningState`, traffic weight
- Env var presence (no secret values)
- `/health/live`, `/health/ready`, `/version` results
- Whether the running image matches the expected SHA
- Last 300 API log lines

---

## 2. System catalog vs tenant catalog — why this matters

ArchLucid runs in `SystemWithPerTenantCatalogs` mode. This means:

| Database | Role | Contains |
|---|---|---|
| `ArchLucid` | **System catalog** | `dbo.Tenants`, `dbo.TenantDatabaseBindings`, billing, provisioning |
| `ArchLucidTenantDev` | **Tenant catalog** | Governance, commits, proof runs, analysis — for one tenant only |

**`dbo.Tenants` belongs in `ArchLucid`, not in `ArchLucidTenantDev`.**

The SQL bootstrap script (`ArchLucid.sql`) creates `dbo.Tenants` as part of the unified schema but guards every foreign key that references it with:

```sql
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_..._Tenants')
    ALTER TABLE dbo.XXX ADD CONSTRAINT FK_..._Tenants ...
```

So if `dbo.Tenants` is absent (correct for a tenant catalog), no FK is created, and no failure occurs. If you see an error like `FK_CommitRunIdempotency_Tenants references invalid table 'dbo.Tenants'`, the script ran against a tenant catalog that does not have `dbo.Tenants`.

**What to verify:**

```powershell
# System catalog — dbo.Tenants must exist:
# Run Verify-SystemCatalog.sql against ArchLucid

# Tenant catalog — dbo.Tenants is not required, FKs must not reference it:
# Run Verify-TenantCatalog.sql against ArchLucidTenantDev
```

---

## 3. Why Container Apps must deploy immutable SHA tags, not `latest-dev`

A mutable tag like `latest-dev` does not change its name when the underlying image changes. This causes:

- Container Apps may pull the same cached manifest even after a push (ACA caches image pulls).
- When CD logs show a SHA, the active revision may still show `latest-dev` — the CD summary lies.
- Rollback becomes ambiguous: deactivating the new revision and activating the prior one may still be running the same stale `latest-dev` image.

**The rule:** Every deployment must use either a git-SHA tag (`{sha}`) or the ACR `sha256:` digest. The CD workflow enforces this and verifies it post-deploy.

**How to check what image is running:**

```bash
az containerapp revision list \
  -g rg-ArchLucid-dev -n archlucid-api \
  --query "[].{revision:name, image:properties.template.containers[0].image, state:properties.runningState, weight:properties.trafficWeight}" \
  -o table
```

**How to force the correct image manually:**

```bash
# Replace with the actual ACR login server and SHA.
ACR="<acr-name>.azurecr.io"
SHA="6600bd4ce17ee62446ee7ec1c12f8baa65b36ec6"

az containerapp update \
  -g rg-ArchLucid-dev -n archlucid-api \
  --image "${ACR}/archlucid-api:${SHA}"

az containerapp update \
  -g rg-ArchLucid-dev -n archlucid-ui \
  --image "${ACR}/archlucid-ui:${SHA}"
```

---

## 4. How to restart the API safely

**Preferred — new revision (safe, zero-downtime):**

```bash
# Triggers a new revision with a fresh pull of the same image.
az containerapp update \
  -g rg-ArchLucid-dev -n archlucid-api \
  --revision-suffix "restart-$(date +%s)"
```

**Force 100% traffic to the latest revision:**

```bash
REV=$(az containerapp show -g rg-ArchLucid-dev -n archlucid-api \
  --query "properties.latestRevisionName" -o tsv)
az containerapp ingress traffic set \
  -g rg-ArchLucid-dev -n archlucid-api \
  --revision-weight "${REV}=100"
```

**Do not:**
- Scale to 0 and back — this interrupts cold-start SLA and may cause race conditions.
- Use `az containerapp revision restart` — this is an alias for deactivate + activate, which removes traffic from the current revision before the replacement is up.

---

## 5. How to read logs

**Last N lines (quick):**

```bash
az containerapp logs show \
  -g rg-ArchLucid-dev -n archlucid-api \
  --tail 300
```

**Follow live (tail -f equivalent):**

```bash
az containerapp logs show \
  -g rg-ArchLucid-dev -n archlucid-api \
  --follow
```

**From a specific revision (useful when active revision is Failed):**

```bash
REV="archlucid-api--r12345678a1"  # get from revision list
az containerapp logs show \
  -g rg-ArchLucid-dev -n archlucid-api \
  --revision "$REV" \
  --tail 500
```

**Key log patterns to search for:**

| Pattern | Meaning |
|---|---|
| `BuildCommitSha=(not stamped)` | Image built without `SourceRevisionId` — wrong image or old pipeline |
| `SqlTopology.Mode=SystemWithPerTenantCatalogs` | Correct topology loaded |
| `Invalid object name 'dbo.GovernanceApprovalRequests'` | SQL bootstrap missed governance tables |
| `Foreign key 'FK_..._Tenants' references invalid table 'dbo.Tenants'` | FK guard missing — run patched bootstrap |
| `Connection refused` or `Login failed` | SQL credentials wrong or firewall blocking |
| `KeyVault: SecretNotFound` | Secret name mismatch in Key Vault |
| `ContentSafety: Unauthorized` | `ArchLucid__ContentSafety__ApiKey` is wrong or missing |

---

## 6. How to interpret a Failed revision state

A revision in `Failed` state means the container exited non-zero at startup — usually within the first 30 seconds.

**Step-by-step:**

1. Get the failed revision name:

   ```bash
   az containerapp revision list \
     -g rg-ArchLucid-dev -n archlucid-api \
     --query "[?properties.runningState=='Failed'].name" -o tsv
   ```

2. Read its logs:

   ```bash
   az containerapp logs show \
     -g rg-ArchLucid-dev -n archlucid-api \
     --revision "<failed-revision-name>" \
     --tail 500
   ```

3. Common causes and fixes:

   | Log evidence | Fix |
   |---|---|
   | `Invalid object name 'dbo.XXX'` | SQL bootstrap incomplete — re-run `ArchLucid.sql` against the correct database |
   | `Cannot open database "ArchLucid"` | `ConnectionStrings__ArchLucidSystem` is wrong |
   | `KeyVault: Access denied` | Managed identity missing Key Vault role — check RBAC in portal |
   | `ArchLucidAuth__Mode` missing / wrong | Update env var via portal or `az containerapp update --set-env-vars` |
   | `BuildCommitSha=(not stamped)` in startup | Image was built without `BUILD_SHA` build-arg — redeploy with current CD pipeline |
   | Exit code 137 (OOM) | Scale up memory; check for memory leak in recent change |

4. After fixing the root cause, create a new revision:

   ```bash
   az containerapp update \
     -g rg-ArchLucid-dev -n archlucid-api \
     --revision-suffix "fix-$(date +%s)"
   ```

5. Deactivate the failed revision to prevent it from receiving any residual traffic:

   ```bash
   az containerapp revision deactivate \
     -g rg-ArchLucid-dev -n archlucid-api \
     --revision "<failed-revision-name>"
   ```

---

## 7. How to check health endpoints

**Quick curl (from any shell with internet access):**

```bash
BASE="https://archlucid-api.orangewave-b0bbb43e.eastus2.azurecontainerapps.io"

# Liveness — should return HTTP 200 immediately.
curl -sS -w "\nHTTP %{http_code}\n" "${BASE}/health/live"

# Readiness — should return HTTP 200 with {"status":"Healthy"}.
curl -sS -w "\nHTTP %{http_code}\n" "${BASE}/health/ready" | jq .

# Version — shows commitSha; must NOT be "(not stamped)".
curl -sS "${BASE}/version" | jq .

# UI public URL — should return HTTP 200.
curl -sS -o /dev/null -w "HTTP %{http_code}\n" -L "https://www.archlucid.net"
```

**What each endpoint means:**

| Endpoint | Healthy | Unhealthy |
|---|---|---|
| `/health/live` | `200` — process is alive | `503` — container is crashing; check logs |
| `/health/ready` | `200`, `{"status":"Healthy"}` | `200`, `{"status":"Degraded/Unhealthy"}` — a dependency (SQL, blob, Key Vault) is down |
| `/version` | `commitSha` matches deployed SHA | `commitSha=(not stamped)` — stale build; `404` — wrong container |

**Interpreting Degraded readiness:**

```bash
# Inspect which check is failing:
curl -sS "${BASE}/health/ready" | jq '.entries | to_entries[] | {check: .key, status: .value.status, description: .value.description}'
```

Common failing checks and their causes:

| Check name | If Unhealthy | Fix |
|---|---|---|
| `sql-system` | `ConnectionStrings__ArchLucidSystem` wrong or firewall blocking | Check env var; add Container App outbound IP to SQL firewall |
| `sql-tenant-dev` | `TenantCatalogConnectionStringTemplate` wrong or tenant DB missing | Verify DB exists; re-run `Verify-TenantCatalog.sql` |
| `blob` | Storage account unreachable | Check managed identity and storage RBAC |
| `keyvault` | KV URI wrong or RBAC missing | Verify `ArchLucid__Secrets__KeyVaultUri`; check managed identity role |

---

## 8. Patch the database or fix the build?

Use this decision tree:

```
Is the error in the API logs a SQL schema error?
├── YES: Is dbo.GovernanceApprovalRequests / CommitRunIdempotency / a governance table missing?
│   ├── YES: The bootstrap script (ArchLucid.sql) was incomplete.
│   │         → Re-run ArchLucid.sql against the correct database (tenant or system).
│   │         → Do NOT manually create tables — use the script to keep schema in sync.
│   └── NO: Is a foreign key failing with "references invalid table 'dbo.Tenants'"?
│       ├── YES: You are running ArchLucid.sql against a tenant catalog that lacks dbo.Tenants.
│       │         → The patched bootstrap script guards this FK. Re-deploy with current RC2 code.
│       └── NO: Connection issue, not schema. Check env vars and SQL firewall.
└── NO: Is the error a config / missing env var error?
    ├── YES: Update the Container App env var in portal or via az cli. No DB change needed.
    └── NO: Is the active revision image using a mutable tag (latest-dev)?
        ├── YES: Re-deploy using a SHA-pinned image (see section 3).
        └── NO: Pull the logs from the failed revision and trace from there.
```

**When to run SQL verification scripts:**

- After any SQL-related error in API startup logs.
- After a new deployment when `/health/ready` shows a SQL check as Unhealthy.
- Before re-running the bootstrap script, to understand current state.

```powershell
# Open SSMS or Azure Data Studio and run:
# Against ArchLucid (system catalog):
#   docs\runbooks\scripts\Verify-SystemCatalog.sql

# Against ArchLucidTenantDev (tenant catalog):
#   docs\runbooks\scripts\Verify-TenantCatalog.sql
```

---

## 9. Recovering from a stale mutable-tag deployment (the RC2 incident pattern)

This is the exact failure that occurred: Container App was pinned to `latest-dev` instead of the SHA.

```bash
# 1. Find the SHA you actually want to run.
#    Check the CD workflow run summary or git log:
git log --oneline -5

# 2. List current Container App images to confirm the problem:
az containerapp revision list \
  -g rg-ArchLucid-dev -n archlucid-api \
  --query "[?properties.trafficWeight > \`0\`].{rev:name,img:properties.template.containers[0].image,wt:properties.trafficWeight}" \
  -o table

# 3. Update to the SHA-pinned image:
ACR="<your-acr>.azurecr.io"
SHA="<the-expected-sha>"
az containerapp update -g rg-ArchLucid-dev -n archlucid-api --image "${ACR}/archlucid-api:${SHA}"
az containerapp update -g rg-ArchLucid-dev -n archlucid-ui  --image "${ACR}/archlucid-ui:${SHA}"

# 4. Verify the new revisions are Running with 100% traffic:
az containerapp revision list \
  -g rg-ArchLucid-dev -n archlucid-api \
  --query "[].{rev:name,img:properties.template.containers[0].image,state:properties.runningState,wt:properties.trafficWeight}" \
  -o table

# 5. Re-run the diagnostic to confirm all health checks pass:
.\scripts\deploy\Diagnose-RC2Deployment.ps1 -ExpectedSha "$SHA"
```

---

## 10. Env var reference for RC2 dev

Required env vars for the API Container App in dev. Values are in Key Vault; only keys are listed here.

| Env var | Required value / format | Set as |
|---|---|---|
| `ArchLucid__SqlTopology__Mode` | `SystemWithPerTenantCatalogs` | Literal |
| `ConnectionStrings__ArchLucidSystem` | SQL connection string | Secret ref |
| `ArchLucid__SqlTopology__TenantCatalogConnectionStringTemplate` | Connection string template with `{tenantDb}` | Secret ref |
| `ArchLucidAuth__Mode` | `ApiKey` | Literal |
| `Authentication__ApiKey__Enabled` | `true` | Literal |
| `Authentication__ApiKey__AdminKey` | Non-empty secret | Secret ref |
| `Authentication__ApiKey__TenantId` | Valid GUID | Literal or secret ref |
| `Demo__Enabled` | `false` | Literal |
| `Cors__AllowedOrigins__0` | `https://www.archlucid.net` | Literal |
| `Billing__Provider` | `None` | Literal |
| `ArchLucid__Secrets__Provider` | `KeyVault` | Literal |
| `ArchLucid__Secrets__KeyVaultUri` | `https://<vault>.vault.azure.net/` | Literal or secret ref |
| `ArchLucid__ContentSafety__Endpoint` | `https://<resource>.cognitiveservices.azure.com/` | Literal or secret ref |
| `ArchLucid__ContentSafety__ApiKey` | Non-empty secret | Secret ref |

**To inspect (no values printed):**

```bash
az containerapp show -g rg-ArchLucid-dev -n archlucid-api \
  --query "properties.template.containers[0].env[].{name:name, hasValue:value!=null, secretRef:secretRef}" \
  -o table
```

---

## 11. Useful az CLI one-liners

```bash
RG="rg-ArchLucid-dev"
API="archlucid-api"
UI="archlucid-ui"

# Active revision + image for API
az containerapp show -g $RG -n $API \
  --query "{rev:properties.latestRevisionName, img:properties.template.containers[0].image}" -o json

# List all revisions with state + image
az containerapp revision list -g $RG -n $API \
  --query "[].{name:name,state:properties.runningState,wt:properties.trafficWeight,img:properties.template.containers[0].image}" \
  -o table

# Set 100% traffic to latest revision
REV=$(az containerapp show -g $RG -n $API --query "properties.latestRevisionName" -o tsv)
az containerapp ingress traffic set -g $RG -n $API --revision-weight "${REV}=100"

# Deactivate a specific revision
az containerapp revision deactivate -g $RG -n $API --revision "<revision-name>"

# Follow logs
az containerapp logs show -g $RG -n $API --follow

# Show ingress traffic split
az containerapp ingress traffic show -g $RG -n $API -o table

# Show env vars (name + secretRef only, no values)
az containerapp show -g $RG -n $API \
  --query "properties.template.containers[0].env[].{name:name,secretRef:secretRef}" -o table
```
