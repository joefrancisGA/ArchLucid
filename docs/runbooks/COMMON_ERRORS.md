> **Scope:** Top 10 operator-visible failure modes (`56R`-style quick fixes) anchored to shipped configuration—not exhaustive root-cause analysis.

# Common operator errors — top 10

**Audience:** pilots + on-call responders. Prefer **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** first-pass flow; this doc expands repeatable failures.

---

## 1. API exits at startup — **SQL connection string missing / unreachable**

**Symptom:** Log shows DbUp/connectivity failure; **`ConnectionStrings:ArchLucid`** error.

**Cause:** **`ArchLucid:StorageProvider`** is **`Sql`** but the connection string cannot open SQL (`localhost` firewall, credential, typo).

**Resolution:** Align **`ConnectionStrings:ArchLucid`** with your SQL reachable host; Docker compose users: ensure MSSQL healthy first. **`dotnet user-secrets`** or Key Vault-backed settings in staging/prod (**[CONFIGURATION_KEY_VAULT.md](../library/CONFIGURATION_KEY_VAULT.md)**).

**Prevention:** Put secrets only in vault / secret stores—avoid committing rotated passwords.

---

## 2. **`DevelopmentBypass` refused in staging/prod-shaped hosts**

**Symptom:** `InvalidOperationException` referencing **`DevelopmentBypass`** not allowed (`AuthSafetyGuard`).

**Cause:** **`ArchLucidAuth:Mode=DevelopmentBypass`** configured while **`ASPNETCORE_ENVIRONMENT`** implies non-Development (**Staging**/**Production**/etc.).

**Resolution:** Flip to **`ApiKey`** or **`JwtBearer`** with working identity material; unset bypass flags.

**Prevention:** Keep compose **dev stacks** labelled Development; staging/prod manifests should never carry bypass switches.

See **[SECURITY.md](../library/contributor-reference/SECURITY.md)** § DevelopmentBypass production guard.

---

## 3. **401 Unauthorized** everywhere

**Symptom:** Swagger/CLI/UI receive **401** with **WWW-Authenticate** challenges.

**Cause:** **`Authentication:ApiKey:Enabled=false`** (fail-closed) or missing keys / wrong header.

**Resolution:** Populate **`Authentication:ApiKey:AdminKey`/`ReadOnlyKey`** (environment variables) and set **`Enabled=true`**; or supply valid Bearer token per **[API_CONTRACTS.md](../library/API_CONTRACTS.md)**.

**Prevention:** Document API key rollout in sprint handoff wiki.

---

## 4. **DbUp / migration failures** on boot

**Symptom:** Stack trace under **DbUp** / migration number; readiness failure.

**Cause:** Older schema objects, conflicting manual DDL, insufficient DB privileges, paused Azure SQL tier.

**Resolution:** Inspect **first failing script** lines; restore DB snapshot if needed; run against disposable DB to reproduce; escalate with **`DatabaseMigration`** log correlation id.

**Prevention:** Never hand-edit **`ArchLucid.sql`** outside approved migration sequencing rules.

See **[SQL_SCRIPTS.md](../library/SQL_SCRIPTS.md)**.

---

## 5. **Real-mode agent** timeouts / breaker open — **missing Azure OpenAI**

**Symptom:** Alerts citing **`AzureOpenAI`**, breaker **Open**, or agent execution timeouts.

**Cause:** **`AgentExecution:Mode=Real`** requires endpoint + key/model deployment reachable.

**Resolution:** Prefer **Simulator** for dry runs; configure **`AzureOpenAI`** section (`Endpoint`, **`ApiKey`**/managed identity) or fix network egress / private endpoints. Production outage: [`AI_PROVIDER_OFFLINE.md`](AI_PROVIDER_OFFLINE.md) (retry → circuit → optional same-family FallbackLlm; never Simulator-fail-over for buyer Real runs).

**Prevention:** Maintain **[RESILIENCE_CONFIGURATION.md](../library/RESILIENCE_CONFIGURATION.md)** non-default tuned profile per environment.

---

## 6. **ContentSafety** enforced but **misconfigured SDK**

**Symptom:** Startup validation errors for **`ArchLucid:ContentSafety:Endpoint`/`ApiKey`** (production-like hosts).

**Cause:** Turning on **`ArchLucid:ContentSafety:Enabled`** without pairing Azure AI Content Safety resources.

**Resolution:** Provision Content Safety endpoint + key **or** run under dev profile with guard disabled per **[SECURITY.md](../library/contributor-reference/SECURITY.md)** matrix.

---

## 7. **403 / empty scopes** despite good auth — tenant / RLS mismatch

**Symptom:** Reads return empty sets or **`403 Forbidden`**. UI Overview may show **Request failed (403 Forbidden)** on Recent reviews.

**Cause (JWT / RLS):** JWT claims omit tenant/workspace/project; **`SESSION_CONTEXT`** not propagated; stray scope headers.

**Cause (ApiKey on Production-like hosts — TB-304):** Host admin key has **`Authentication:ApiKey:TenantId`** only (or none). Workspace/project resolve from defaults/headers and **`ScopeResolutionGuard`** rejects with: *Tenant, workspace, and project scope must be resolved from identity claims…*

**Resolution:**

- Align **scope headers**/claims with seeded tenant GUIDs; inspect **`IScopeContextProvider`** debug logs (**Debug** posture only).
- For **ApiKey** Container Apps: set **all three** of `Authentication__ApiKey__TenantId`, `Authentication__ApiKey__WorkspaceId`, `Authentication__ApiKey__ProjectId` (Terraform **`api_key_*_id`** or `.\scripts\deploy\Set-ApiKeyScopeClaims.ps1`). See **[infra/terraform-container-apps/README.md](../../infra/terraform-container-apps/README.md)** § ApiKey scope claims.

**Prevention:** Follow **[CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md)** onboarding scripts; never deploy ApiKey with only TenantId on Production-like images.

See **[MULTI_TENANT_RLS.md](../security/MULTI_TENANT_RLS.md)**.

---

## 7b. **Database Query Failed** — invalid column on `dbo.Tenants` (system catalog)

**Symptom:** UI toast **Server error** / **Database Query Failed: The database rejected the query due to a programming error.** Correlation ID on routes gated by **`[RequiresCommercialTenantTier]`** (e.g. **`GET /v1/alerts`**).

**Cause:** Control-plane SQL (`ArchLucid` / system catalog) is behind app DbUp — `DapperTenantRepository` selects columns such as **`OffboardedUtc`**, **`DataRegion`**, legal-hold / preseed fields that are missing (**SQL 207**).

**Resolution:** Apply **system-plane DbUp** (or the matching `ALTER TABLE dbo.Tenants ADD …` blocks from **`ArchLucid_Unified_Schema.sql`** / migrations **172**, **196**, **222**, trial preseed columns). Confirm `SELECT` used by `QueryTenantByIdAsync` succeeds. For owner/dev tenants, ensure **`Tier`** is **`Free`/`Standard`/`Enterprise`** (not ad-hoc values like **`Dev`**) and that an **Active** trial is not blocking Standard commercial gates (`CommercialTenantEligibility`).

**Prevention:** Do not skip system migrations when promoting API images; verify with **`ArchLucid.Persistence.MigrateVerify`** / sentinel manifests (**[SQL_SCRIPTS.md](../library/SQL_SCRIPTS.md)**).

---

## 7c. **Database Query Failed** — ServiceNow / ITSM / Azure Boards settings + health (wrong SQL catalog)

**Symptom:** Opening **ServiceNow**, **Jira**, or **Azure Boards** under Integrations shows a server / **Database Query Failed** toast. Live probes: **`GET /v1/integrations/itsm/settings`**, **`GET /v1/integrations/itsm/health`**, or **`GET /v1/integrations/azure-boards/settings`** return **500**; connection endpoints may still return **200**.

**Cause:** Tenant outbound settings repositories queried the **primary/system** catalog via `IBackgroundWorkerSqlConnectionFactory` while tables such as `dbo.TenantItsmOutboundSettings` and `dbo.TenantAzureBoardsOutboundSettings` live in the **tenant** catalog under `SystemWithPerTenantCatalogs` (**SQL 208** invalid object). Connections correctly use scoped `ISqlConnectionFactory`.

**Resolution:** Use tenant-scoped `ISqlConnectionFactory` in those repositories (**TB-867** / **PD-002** for ITSM; **TB-1151** for Azure Boards). Redeploy API after the fix. Confirm settings/health return **200** (empty overrides are fine).

**Prevention:** Tenant-scoped tables must not inject `IBackgroundWorkerSqlConnectionFactory` (reserved for primary-catalog / no-session workers such as inbound webhook correlation). Regression: `SqlTenantItsmOutboundSettingsRepositoryConnectionFactoryContractTests`, `SqlTenantAzureBoardsOutboundSettingsRepositoryConnectionFactoryContractTests`.

---

## 7d. **Database Query Failed** — draft create FK to missing DefaultTenant (tenant catalog)

**Symptom:** UI toast **Database Query Failed: The database rejected the query due to a programming error** on **Start review** / create architecture draft. Correlation ID on **`POST /v1/architecture/draft`**. App Insights: SQL **547** `FK_DraftRequests_Tenants` in the tenant catalog (e.g. **`ArchLucidTenantDev`**).

**Cause:** ApiKey (or client) is bound to well-known **`ScopeIds.DefaultTenant`** (`11111111-…`), but that row was never inserted into the **tenant-plane** `dbo.Tenants`. `DevelopmentDefaultScopeTenantBootstrap` historically ran only when `ASPNETCORE_ENVIRONMENT=Development`, while hosted Container Apps often run as Production with `Authentication:ApiKey:TenantId` still set to DefaultTenant.

**Resolution:** Redeploy API that seeds DefaultTenant whenever ApiKey TenantId is DefaultTenant (or run the same INSERT as `DevelopmentDefaultScopeTenantBootstrap.TryEnsure` against the tenant catalog). Confirm `SELECT Id FROM dbo.Tenants WHERE Id = '11111111-1111-1111-1111-111111111111'` succeeds in the tenant DB, then retry draft create.

**Prevention:** Keep ApiKey demo-scope seeding tied to the ApiKey tenant claim, not only `IsDevelopment()`.

---

## 7e. **Database Query Failed** — `dbo.TenantSettings` on wrong SQL catalog

**Symptom:** SQL **208** `Invalid object name 'dbo.TenantSettings'` in App Insights while product traffic hits tenant catalogs.

**Cause:** `SqlTenantSettingsRepository` queried the primary/system catalog via `IBackgroundWorkerSqlConnectionFactory` while migration **173** creates `dbo.TenantSettings` on the **tenant** plane.

**Resolution:** Use scoped `ISqlConnectionFactory` (same pattern as **TB-867** / §7c). Redeploy API. Contract: `SqlTenantSettingsRepositoryConnectionFactoryContractTests`.

---

## 8. **429 Too Many Requests**

**Symptom:** HTTP **429**, rate-limit problem details extensions.

**Cause:** Burst traffic crosses **`RateLimiting:FixedWindow`** / **`Expensive`** budget for partition (role/IP).

**Resolution:** Respect **`Retry-After`**, backoff automations; increase budgets **temporarily only** in staging for load tests—not prod without capacity review (**[LOAD_TEST_BASELINE.md](../library/LOAD_TEST_BASELINE.md)**).

---

## 9. **`409 Conflict` on manifest commit**

**Symptom:** Commit endpoint returns concurrency / state conflict (**`ROWVERSION`**, stale ETag equivalents).

**Cause:** Concurrent writers or outdated client view of **`Run`** state.

**Resolution:** Reload latest run aggregate; reconcile tasks; escalate if repeatable under single writer (capture **`correlationId`**).

**Prevention:** UI clients adopt optimistic concurrency headers per **[API_CONTRACTS.md](../library/API_CONTRACTS.md)** mutate guidance.

---

## 10. **`/health/ready`** unhealthy despite `/health/live` OK

**Symptom:** Liveness succeeds; readiness surfaces failing dependency (**SQL** / **Redis** / **rule pack** / **disk**).

**Cause:** Mapped readiness checks include each critical dependency—which may be degraded independently.

**Resolution:** Inspect JSON **`entries[]`** ordering = priority; remedy each failing **`description`** (**SQL** reachable? **Redis** TLS? Blob permissions? disk space?).

**Prevention:** Synthetic monitors and the scheduled **`hosted-saas-probe`** workflow (`.github/workflows/hosted-saas-probe.yml`) for production SaaS (**[SLA_SUMMARY.md#hosted-saas-availability-target](../go-to-market/SLA_SUMMARY.md#hosted-saas-availability-target)**; `SLA_TARGETS.md` alias).


---

### Tools

```powershell
dotnet run --project .\ArchLucid.Cli -- doctor --url https://localhost:5001
dotnet run --project .\ArchLucid.Cli -- support-bundle --out .\diag.zip --url https://localhost:5001
```

Record **`GET /version`** output with support tickets (**[CLI_USAGE.md](../library/CLI_USAGE.md)**).
