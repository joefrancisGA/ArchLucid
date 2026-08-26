> **Scope:** Contributor-reference — Operators and integrators looking up recognized configuration keys and host roles — not secret material, deployment order, or full environment architecture.

# Configuration reference

This document lists operator-facing configuration **keys** (colon paths or environment names) recognized by `archlucid config check` and by `GET /v1/admin/config-summary` / `GET /v1/admin/configuration/summary` (presence plus optional redacted scalars; never raw secrets). **`GET /v1/admin/config-lint`** returns structured blocking/advisory lint rows (`OperatorConfigurationLintEvaluator` parity with `archlucid config lint`, optional advisor warnings). The **canonical registry** is `ConfigurationKeyCatalog` in `ArchLucid.Core`.

## Host configuration precedence (API)

Layered `IConfiguration` for the API host (`ArchLucid.Api/Program.cs`). Later sources override earlier ones for the same key. Claim map: [`CONFIGURATION_ARCHITECTURE_PRECEDENCE_VALIDATION_DRIFT_CLAIM_MAP.md`](CONFIGURATION_ARCHITECTURE_PRECEDENCE_VALIDATION_DRIFT_CLAIM_MAP.md) (**TB-1561**).

| Order | Layer |
| --- | --- |
| 1 | `WebApplication.CreateBuilder` defaults (base `appsettings.json` → environment-specific JSON → user secrets → environment variables → command-line args) |
| 2 | Optional `appsettings.Pilot.json` — pilot connection strings and scale-honest defaults (`HotPathCache:Provider=Memory`, Cosmos/Service Bus off, no read-replica strings) |
| 3 | Optional `appsettings.Advanced.json` / `appsettings.SaaS.json` overlays — feature-grouped tuning (QuickScan, FallbackLlm DR, retrieval, workers, DOCX profiles) |
| 4 | Explicit `AddEnvironmentVariables()` — **environment variables beat Pilot/Advanced/SaaS overlays** |
| 5 | In-memory bridges (`AzureOpenAiEnvironmentConfigurationBridge`, `ArchitectureRunCreationConfigurationBridge`) when nested keys are unset |
| 6 | Platform Container Apps Key Vault references — appear as env/settings before the process starts |

## Pilot profile overlay (`appsettings.Pilot.json`)

Use the optional **`appsettings.Pilot.json`** overlay (loaded in `ArchLucid.Api/Program.cs` after base JSON, before Advanced/SaaS) when standing up a single-replica pilot. It keeps the operator view minimal:

| Key / area | Pilot value |
| --- | --- |
| `ConnectionStrings:ArchLucid` | Injected at deploy (empty in repo template) |
| `ArchLucid:StorageProvider` | `Sql` |
| `HotPathCache:Provider` | `Memory` |
| `HotPathCache:ExpectedApiReplicaCount` | `1` |
| `CosmosDb:*` enabled flags | `false` / empty connection |
| `IntegrationEvents:ServiceBusConnectionString` | empty |
| `SqlServer:ReadReplica:*` | null / unset |

Scale switches (Redis cache, read replicas, Cosmos polyglot, Service Bus) belong in **`appsettings.Advanced.json`** or environment variables — not the pilot overlay. Full key encyclopedia remains in the table below; deprecated binding paths are tagged **Deprecated** with a canonical replacement.

Per-key **When required** / host-role hints in the table below do **not** replace this ladder. Terraform injects Container Apps env and secret references — it does **not** apply appsettings as deployment SoT. Drift detection is fragmented (static TF preflight, SQL MigrateVerify) — **no** live cross-env config parity SoT (**TB-1561**).

## Testing (non-production)

| Key | Default | Purpose |
|-----|---------|---------|
| `ArchLucid:Testing:SimulateLlmBudgetExhausted` | `false` | When `true` and the host is **not** Production, monthly LLM dollar budget enforcement treats the tenant as hard-capped before real usage is evaluated — use to demo budget-exhaustion UX without SQL manipulation. Ignored in Production. See [`LLM_COST_ESTIMATION.md`](../runbooks/LLM_COST_ESTIMATION.md). |

## Insight-density gate (TB-382)

Premium-tier judge calls are metered and capped. Each judged finding is one Reasoning deployment completion.

| Key | Default | Purpose |
|-----|---------|---------|
| `ArchLucid:Findings:InsightDensityGate:DemotionThreshold` | `50` | Scores below this demote agent architecture findings lacking anchors/evidence. Typed engine findings remain protected (`typed-engine-protected`). |
| `ArchLucid:Findings:InsightDensityGate:EnableLlmJudge` | `false` | Enables Premium judge for **agent architecture** findings (Critic path). |
| `ArchLucid:Findings:InsightDensityGate:EnableLlmJudgeForEngineFindings` | `false` | When `true` with `EnableLlmJudge`, also judges deterministic engine findings after snapshot build (authority pipeline). |
| `ArchLucid:Findings:InsightDensityGate:MaxJudgedFindingsPerSnapshot` | `12` | Hard per-snapshot ceiling on judge completions — cost guard for large finding sets. |

## Open-commitment finding engine (ID-05)

Surfaces overdue deferrals, unanswered evidence requests, and waiver expiry from the disposition trail on every review when enabled. **Default on** — disable per tenant when trail fan-out or finding volume is undesirable.

| Key | Default | Purpose |
|-----|---------|---------|
| `ArchLucid:Findings:OpenCommitment:Enabled` | `true` | When `false`, `OpenCommitmentFindingEngine` returns empty with **zero** trail repository calls. |
| `ArchLucid:Findings:OpenCommitment:Lookback` | *(trail basis window)* | How far back to scan disposition trail events (defaults to `FindingDispositionTrailWindow.BasisBreakdownLookback`). |
| `ArchLucid:Findings:OpenCommitment:WaiverExpiryWarningDays` | `30` | Emit expiring-waiver signals when waiver end is within this many days. |
| `ArchLucid:Findings:OpenCommitment:MaxFindings` | `25` | Maximum open-commitment findings emitted per review (ordered by signal priority). |

## Portfolio recurrence finding engine (ID-06)

Cross-run portfolio scan on every review when enabled. **Default off** so tenants do not incur `IRunDetailQueryService` / `IFindingsSnapshotRepository` fan-out until operators opt in and measure cost.

| Key | Default | Purpose |
|-----|---------|---------|
| `ArchLucid:Findings:PortfolioRecurrence:Enabled` | `false` | When `false`, `PortfolioRecurrenceFindingEngine` returns empty with **zero** repository calls. |
| `ArchLucid:Findings:PortfolioRecurrence:MinSystemCountToReport` | `3` | Minimum distinct systems sharing a finding identity before emitting a portfolio recurrence finding. |
| `ArchLucid:Findings:PortfolioRecurrence:MaxSystemsScanned` | `50` | Cap on distinct systems whose latest committed runs are scanned per review. |
| `ArchLucid:Findings:PortfolioRecurrence:MaxFindings` | `10` | Maximum recurrence findings emitted per review (ordered by descending system count). |

## Tenant data residency (administrator)

Buyer-facing residency messaging lives in **[Data handling](/help/data-handling)** and the Procurement FAQ — not here. Platform operators configure regional allowlists and blob service URIs at provision time:

| Key | Default | Purpose |
|-----|---------|---------|
| `TenantProvisioning:SupportedDataRegions` | *(code defaults when unset)* | Lowercase Azure region identifiers accepted on tenant provision requests. |
| `ArtifactLargePayload:AzureBlobServiceUri` | *(empty)* | Default Azure Blob service URI used when the tenant `DataRegion` is `default` (or when no regional map entry applies). |
| `ArtifactLargePayload:AzureBlobServiceUriByRegion` | *(empty map)* | Optional map of lowercase region key → Blob service URI for non-default `DataRegion` values. |

Tenant row storage of the negotiated region uses the `DataRegion` column on `dbo.Tenants` (set during provisioning; not a procurement FAQ concern). Checklist step: [`HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md`](HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md) § Tenant provisioning.

## Public marketing site (`archlucid-ui`, build-time)

These keys are **not** in `ConfigurationKeyCatalog` (Next.js `NEXT_PUBLIC_*` only). They apply to the **`(marketing)`** subtree and signup funnel — see **TB-019** / **TB-020** and [`PUBLIC_MARKETING_SITE_TOPOLOGY.md`](PUBLIC_MARKETING_SITE_TOPOLOGY.md).

| Key | Default | Purpose |
|-----|---------|---------|
| `NEXT_PUBLIC_ARCHLUCID_CLARITY_PROJECT_ID` | *(empty)* | Microsoft Clarity project id. Empty disables the Clarity loader even when the user grants consent. |
| `NEXT_PUBLIC_ARCHLUCID_MARKETING_ANALYTICS_DISABLED` | *(unset)* | When `true`, kill-switch: no Clarity script, no analytics consent offer (TB-020 server-side mirror for ops drills). |

Signup first-touch uses a first-party cookie (`marketing-first-touch.ts`) propagated as **`x-archlucid-first-touch`** on provisioning — not an env var.

## ITSM integration posture (TB-387)

| Key | Default | Purpose |
|-----|---------|---------|
| `Integrations:Itsm:NativeEnabled` | `true` | When `true` (V1 GA default), `POST /v1/integrations/itsm/outbound/issues` is available once deployment credentials are configured; `GET /v1/integrations/itsm/health` exposes `nativeEnabled` for UI gating. Set `false` to disable one-click Jira/ServiceNow create (returns **404** from outbound create) while **copy-as-work-item**, correlation register (`GET`/`POST` `/v1/integrations/itsm/correlations`), and ITSM export columns remain enabled. |

Outbound vendor credentials are configured through deployment-level ITSM outbound and inbound connector settings (unchanged).

## ITSM inbound webhooks (`Integrations:ItsmInbound`, TB-396)

Jira and ServiceNow inbound status webhooks authenticate with shared secrets (or per-tenant connector secrets when `AllowDeploymentWideWebhookSecrets` is `false`). When a correlated external ticket changes state, ArchLucid updates **`FindingRecords.HumanReviewStatus`** on the scoped snapshot row. Optional disposition maps (**TB-396**) also append a **`FindingDisposition`** event via the disposition trail when the external status maps to a known disposition value.

| Key | Default | Purpose |
|-----|---------|---------|
| `Integrations:ItsmInbound:JiraWebhookSecret` | *(empty)* | Shared secret for `X-Jira-Token` on `POST /v1/integrations/webhooks/jira`. Empty disables the deployment-wide Jira inbound route. |
| `Integrations:ItsmInbound:ServiceNowWebhookSecret` | *(empty)* | Shared secret for `X-ServiceNow-Token` on ServiceNow inbound webhooks. Empty disables the deployment-wide ServiceNow inbound route. |
| `Integrations:ItsmInbound:AllowDeploymentWideWebhookSecrets` | `true` | When `false` (hosted multi-tenant SaaS), inbound webhooks must use tenant-scoped routes with per-connector secrets. |
| `Integrations:ItsmInbound:JiraStatusHumanReviewMap` | *(empty)* | Optional map: Jira workflow status **name** → `FindingHumanReviewStatus` enum name (e.g. `"In Review": "Pending"`). Keys match case-insensitively; built-in defaults apply for unmapped statuses. |
| `Integrations:ItsmInbound:ServiceNowStateHumanReviewMap` | *(empty)* | Optional map: ServiceNow `state` / `incident_state` raw value → `FindingHumanReviewStatus` enum name. Keys match case-insensitively. |
| `Integrations:ItsmInbound:JiraStatusDispositionMap` | *(empty)* | Optional map (**TB-396**): Jira workflow status **name** → `FindingDisposition` enum name (e.g. `"Done": "Remediated"`, `"Won't Do": "RejectedAsNotApplicable"`). When absent or unmapped, inbound webhooks update human review only. |
| `Integrations:ItsmInbound:ServiceNowStateDispositionMap` | *(empty)* | Optional map (**TB-396**): ServiceNow state raw value → `FindingDisposition` enum name. Unmapped values do not change disposition. |
| `Integrations:ItsmInbound:RequireBodyHmacSignature` | `false` | When `true`, require HMAC-SHA256 over the raw UTF-8 body (`X-ArchLucid-Webhook-Signature` or legacy `X-ArchLucid-Signature`) in addition to the vendor token header. |
| `Integrations:ItsmInbound:WebhookTimestampSkewSeconds` | `300` | Maximum acceptable \|now − payload\| skew when `X-ArchLucid-Timestamp` (Unix seconds) is present (**TB-968**). |

**Disposition map values** must parse to [`FindingDisposition`](../../ArchLucid.Contracts/Findings/FindingDisposition.cs): `Accepted`, `Deferred`, `NeedsEvidence`, `Remediated`, `RejectedAsNotApplicable`. **`ItsmInboundDispositionSync`** skips recording when the latest disposition trail event already matches the mapped value (loop guard). **`HumanReviewStatus`** and disposition trail updates are independent — see [`FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`](FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md).

Example (`appsettings.Production.json` fragment):

```json
"Integrations": {
  "ItsmInbound": {
    "JiraWebhookSecret": "***",
    "JiraStatusHumanReviewMap": {
      "In Review": "Pending",
      "Approved": "Approved"
    },
    "JiraStatusDispositionMap": {
      "Done": "Remediated",
      "Won't Fix": "RejectedAsNotApplicable"
    }
  }
}
```

Contract row: [`API_CONTRACTS.md`](API_CONTRACTS.md) ITSM inbound. Smoke: [`../integrations/smoke/CONNECTOR_SMOKE_JIRA.md`](../integrations/smoke/CONNECTOR_SMOKE_JIRA.md), [`../integrations/smoke/CONNECTOR_SMOKE_SERVICENOW.md`](../integrations/smoke/CONNECTOR_SMOKE_SERVICENOW.md).

## Tooling

- Validate locally: `archlucid config check` (add `--no-api` to skip the API snapshot; use global `--json` for machine-readable output; exit `0` when all *required* keys for the current mode are set, exit `4` when not).
- Auth / production-like traps (`ArchLucidAuth:Mode`, bypass flags): `archlucid config lint` (runs from the CLI working directory merged with `appsettings.json` / `archlucid.json` + environment). Default checks are intentionally narrow; optionally add **`--simulate-production`** to fold in an `ASPNETCORE_ENVIRONMENT=Production` overlay, and **`--hosting-advisor`** to mirror the hosted `ProductionLikeHostingMisconfigurationAdvisor` warnings locally.
- Server snapshot: `GET /v1/admin/config-summary` or `GET /v1/admin/configuration/summary` (admin API key; same key paths as the catalog; sensitive values return `***`, never connection strings or API key material). Structured traps/warnings: `GET /v1/admin/config-lint` (`includeAdvisory` defaults true).

## Hosting roles

- **Api** — HTTP API process (`Hosting:Role=Api`).
- **Worker** — background / job host (`Hosting:Role=Worker`).
- **Combined** — single process running both (`Hosting:Role=Combined`).
- **CLI** — `archlucid` on a developer or automation machine (not a host process).

The **Host roles** column is a hint for where a key is most often relevant; most keys apply to every host unless noted.

## Keys

The **When required** column reflects `ConfigurationKeyRequirement` in code (e.g. SQL connection string when storage is SQL; Azure OpenAI when `AgentExecution:Mode=Real` and the completion client is not `Echo`).

## Quick start by mode

Use **`archlucid config check`** and the full table below to validate your host. This section is a **minimum set** per pilot profile only; all other keys remain optional unless their **When required** column applies.

| Mode | Minimum keys (set these first) | Notes |
| --- | --- | --- |
| **Simulator (offline, no LLM)** | `ConnectionStrings:ArchLucid`, `ArchLucidAuth:Mode`, `AgentExecution:Mode` = `Simulator`, `Hosting:Role` | `AgentExecution:CompletionClient` = `Echo` when you want an explicit non-network completion client; see AgentExecution validation rules. |
| **Real LLM (Azure OpenAI)** | Simulator row **plus** `AzureOpenAI:Endpoint`, `AzureOpenAI:DeploymentName`, and **either** `AzureOpenAI:ApiKey` **or** `AzureOpenAI:AuthenticationMode=ManagedIdentity` on hosted Azure | Required when `AgentExecution:Mode=Real` and the completion client is not `Echo`. Prefer managed identity on production-like hosts (TB-080). |
| **OIDC / JWT bearer (Entra or generic issuer)** | Real LLM row **plus** `ArchLucidAuth:Authority`, `ArchLucidAuth:Audience` | When **`JwtBearer`** mode is enabled; issuer may be Entra or another OIDC IdP — **[V1_SCOPE.md](V1_SCOPE.md) §2.12**; generic issuer checklist **[GENERIC_OIDC_SETUP.md](../runbooks/GENERIC_OIDC_SETUP.md)**. |
| **SAML 2.0 SP (workforce SSO)** | Row for your primary API mode **plus** `ArchLucidAuth:Saml2:Enabled=true`, `ArchLucidAuth:Saml2:Issuer`, `ArchLucidAuth:Saml2:IdPMetadata`, optional signing cert + claim mapping keys | SP is **additive**: API defaults stay on **`ArchLucidAuth:Mode`**; browser sign-in/sign-out use the SAML cookie scheme. See **[SECURITY.md](contributor-reference/SECURITY.md)**. |
| **Production billing (Stripe + Marketplace posture)** | Entra-oriented row **plus** `Billing:Stripe:SecretKey`, `Billing:Stripe:WebhookSigningSecret`, `Billing:AzureMarketplace:LandingPageUrl`, `Billing:AzureMarketplace:MarketplaceOfferId` | Applies when billing is live in production per `BillingProductionSafetyRules` and marketplace alignment docs; staging/test may omit or use test keys. |

All other keys are optional unless **When required** in the detailed table says otherwise.

## Pilot configuration profiles

These profiles are operator shortcuts, not new configuration modes. Use them to decide which existing keys and checks must be present before a handoff. **Before deploy:** [`PILOT_PREREQUISITES.md`](../runbooks/PILOT_PREREQUISITES.md) (resource checklist, cost table, Azure AI Search blocking callout) and `.\scripts\Test-ArchLucidPrerequisites.ps1`.

| Profile | Boundary | Required first checks | Optional but common | Common failure mode |
| --- | --- | --- | --- | --- |
| **First-pilot minimum** | Hosted or local pilot using SQL and simulator/real agents as agreed | `ConnectionStrings:ArchLucid`, `ArchLucidAuth:Mode`, `Hosting:Role`, `AgentExecution:Mode`, `archlucid config lint` | `ArchLucid:AgentOutput:QualityGate:Mode=PilotStrict` for sponsor-facing pilots, Blob Storage for artifacts | SQL reachable but auth mode/bypass posture is unclear |
| **Staging with real LLM** | Production-like hosted staging that calls Azure OpenAI | First-pilot minimum plus `AzureOpenAI:Endpoint`, `AzureOpenAI:DeploymentName`, secret-backed credential, `ArchLucid:AgentOutput:QualityGate:PilotStrictMinAgentResultFaithfulnessSupportRatio` | Content Safety, Application Insights/OTLP, LLM budgets, prompt redaction | Real mode configured but quality gate or budget posture is still warn-only |
| **Production-like enterprise pilot** | Buyer/security-reviewable hosted pilot | Staging with real LLM plus OIDC/SAML keys as used, Key Vault references, telemetry export, billing safety posture, data-consistency readiness, **Azure AI Search** (`Retrieval:VectorIndex=AzureSearch` + `Retrieval:AzureSearch:Endpoint` — owner 2026-05-29; required for **all** production-like profiles, not optional) | Private endpoints, Front Door/WAF, read replica routing, procurement `--deal-ready` output | Secrets or auth bypass values accidentally survive into production-like config; **InMemory** vector index or missing Search endpoint on a production-like host |

Validation commands:

```powershell
archlucid config check
archlucid config lint --simulate-production --hosting-advisor
archlucid config lint --profile production-like-hosted-pilot --json-out config-lint-production-like-hosted-pilot.json --markdown-out config-lint-production-like-hosted-pilot.md
```

**Production-like hosted pilot profile** (`--profile production-like-hosted-pilot`) implies `--simulate-production`, `--strict-staging`, and `--hosting-advisor`. It emits structured JSON/Markdown with **PASS/HOLD** disposition, a profile check map (SQL via companion preflight, auth posture, telemetry export, LLM redaction, quality-gate and billing rows via first-pilot proof), and stable blocking vs advisory findings. **Blocking rules** include **`azure_ai_search_vector_index_required_production_like`** and **`azure_ai_search_endpoint_required_production_like`** when `Retrieval:VectorIndex` is not `AzureSearch` or `Retrieval:AzureSearch:Endpoint` is missing (owner 2026-05-29), and **`quality_gate_warn_only_in_real_production_like`** when `AgentExecution:Mode=Real` with `ArchLucid:AgentOutput:QualityGate:Mode=WarnOnly` (TB-213).

**Release-candidate gates (mandatory):** `scripts/ci/Invoke-ConfigLintProofStep.ps1` is invoked by **`scripts/run-readiness-check.ps1`** (Phase 2), **`scripts/release-smoke.ps1`** (Step 2), **`scripts/Emit-ReleaseReadinessEvidence.ps1`**, and **`scripts/production-readiness-drill.ps1`**. RC workflows evaluate **`fixtures/release-candidate/appsettings.json`** as the baseline compliant shape and write artifacts to **`artifacts/release-readiness/`**. Blocking findings fail the gate; advisory findings are visible but non-blocking. Validate **deployed** config with the same profile before hosted handoff. `scripts/collect-first-pilot-proof.ps1 -ProductionLikeHostedPilot` or `-SponsorHandoff` also runs this profile and **BLOCK**s sponsor handoff on HOLD.

For hosted Azure pilots, pair this with [`MINIMAL_AZURE_PILOT_DEPLOYMENT.md`](../runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md). Never paste raw connection strings, API keys, SAML secrets, or Key Vault secret values into evidence bundles.

| Section | Key | Source(s) | Default | When required | Host roles | Description |
| --- | --- | --- | --- | --- | --- | --- |
| Hosting | `Hosting:LogStartupConfigurationSummary` | appsettings, env | true | Optional (not mode-gated) | All (Api, Worker, Combined) | Log effective configuration on startup (host). |
| Hosting | `Hosting:Role` | appsettings, env | Combined | Optional (not mode-gated) | All (per process) | Api, Worker, or Combined host process. |
| ProductionValidation | `ProductionValidation:RequireTelemetryExport` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | When true on production-profile hosts, require OTLP, Application Insights, or Prometheus export. |
| Metering | `Metering:Enabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | Feature metering toggle. |
| ArchLucid | `ArchLucid:Secrets:Provider` | appsettings, env, KeyVault ref | EnvironmentVariable | **Required `KeyVault` on production-like hosts** (Production/Staging or `ARCHLUCID_ENVIRONMENT=Production\|Staging`); optional in Development | All (Api, Worker, Combined) | How secrets (connection strings, API keys) are loaded. **`EnvironmentVariable`** is local-dev only; hosted pilots must use Key Vault + managed identity ([ADR 0038](../architecture/adrs/0038-run-durability-multi-store-outbox-production-secrets.md)). |
| ArchLucid | `ArchLucid:Secrets:KeyVaultUri` | appsettings, env, KeyVault | empty | **Required when `Provider=KeyVault`** (enforced on production-like hosts) | All (Api, Worker, Combined) | Azure Key Vault base URI when the secrets provider needs it. |
| ArchLucid | `ArchLucid:Secrets:KeyVaultCacheSeconds` | appsettings, env | 300 | Optional (not mode-gated) | All (Api, Worker, Combined) | Secret cache duration for Key Vault access. |
| ArchLucid | `ArchLucid:StorageProvider` | appsettings, env | Sql | Optional (not mode-gated) | All (Api, Worker, Combined) | InMemory (tests) or Sql; unset defaults to Sql in product rules. |
| ConnectionStrings | `ConnectionStrings:ArchLucid` | appsettings, env, KeyVault, user secrets | see default dev | Required — When SQL is active | All (Api, Worker, Combined) | Primary SQL connection string (required when using Sql storage). In Production with geo-DR, use the **failover group read/write listener** hostname — see `SqlServer:FailoverGroupListenerFqdn` and [DATABASE_FAILOVER.md](../runbooks/DATABASE_FAILOVER.md). |
| SqlServer | `SqlServer:FailoverGroupListenerFqdn` | appsettings, env, KeyVault | empty | Optional (Production geo-DR) | All (Api, Worker, Combined) | When set in Production, startup validation requires `ConnectionStrings:ArchLucid` to contain this FQDN (e.g. `archlucid-prod-sqlfg.database.windows.net`). Unset = skip check (staging/dev without failover group). |
| ArchLucid | `ArchLucid:Persistence:AllowRlsBypass` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | Dev-only: bypass SQL row-level security in tests. |
| ArchLucid | `ArchLucid:Persistence:ReadOnlyConnectionStringTemplate` | appsettings, env | empty (`""` in `appsettings.json`) | Optional (not mode-gated) | All (Api, Worker, Combined) | Read-scale-out template for analytical queries (`Application Intent=ReadOnly`). Ships empty until ops injects env/Key Vault; empty = primary fallback. See [READ_REPLICA_ROUTING.md](READ_REPLICA_ROUTING.md). |
| ArchLucid | `ArchLucid:PublicSite:BaseUrl` | appsettings, env | https://archlucid.net | Optional (not mode-gated) | All (Api, Worker, Combined) | Public marketing / operator link base for emails and exports. |
| ArchLucid | `ArchLucid:KnowledgeGraph:ProjectionCache:Backend` | appsettings, env | Memory | Optional (not mode-gated) | All (Api, Worker, Combined) | Memory (per-process IMemoryCache) vs Distributed (IDistributedCache / Redis via host composition). |
| ArchLucid | `ArchLucid:KnowledgeGraph:ProjectionCache:RedisConnectionString` | appsettings, env | empty | Optional (Distributed Backend) | All (Api, Worker, Combined) | Optional Redis connection for projection cache; falls back to LLM / hot-path Redis when unset. |
| ArchLucid | `ArchLucid:KnowledgeGraph:ProjectionCache:AbsoluteExpirationSeconds` | appsettings, env | 300 | Optional (Enabled projection cache) | All (Api, Worker, Combined) | TTL (seconds) for cached graph snapshot projections. |
| ArchLucid | `ArchLucid:Retention:FunnelEventsDays` | appsettings, env | 0 | Optional (not mode-gated) | All (Api, Worker, Combined) | Max age (days) for FirstTenantFunnel SQL rows before archival/purge; 0 falls through to `ArchLucid:FirstTenantFunnelRetentionDays` when set, else Telemetry:FirstTenantFunnel:ArchivalRetentionDays, else 90. |
| ArchLucid | `ArchLucid:FirstTenantFunnelRetentionDays` | appsettings, env | (omit) | Optional (not mode-gated) | All (Api, Worker, Combined) | When > 0, max age (days) for dbo.FirstTenantFunnelEvents SQL purge/archive rows (overrides Retention:FunnelEventsDays chain). |
| ArchLucid | `ArchLucid:Retention:FunnelEventsHardDeleteWithoutBlobArchive` | appsettings, env | true | Optional (not mode-gated) | All (Api, Worker, Combined) | When true and blob storage is absent, aged funnel rows delete from SQL only (no cold archive). |
| ArchLucid | `ArchLucid:Notifications:TrialLifecycle:Owner` | appsettings, env | Hosted | Optional (not mode-gated) | All (Api, Worker, Combined) | Who runs trial notification emails for this tenant class. |
| ArchLucid | `ArchLucid:InternalCrossTenantAnalytics:RollupJobEnabled` | appsettings, env | true | Optional (not mode-gated) | Worker, Combined | Leader-elected worker that writes dbo.InternalCrossTenantRollupDaily. |
| ArchLucid | `ArchLucid:InternalCrossTenantAnalytics:RollupIntervalHours` | appsettings, env | 24 | Optional (not mode-gated) | Worker, Combined | Hours between rollup passes (UTC calendar day). |
| ArchLucid | `ArchLucid:InternalCrossTenantAnalytics:PseudonymizationSalt` | appsettings, env, KeyVault | empty | Optional (When SQL rollups run) | Worker, Combined | HMAC key material for AnalyticsTenantKey (never store raw tenant ids in rollup tables). |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:Enabled` | appsettings, env | true | Optional (not mode-gated) | All (Api, Worker, Combined) | Enables quality gate for agent output. |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:Mode` | appsettings, env | WarnOnly | Optional (not mode-gated) | All (Api, Worker, Combined) | WarnOnly (default) vs PilotStrict for citations, scores, and pilot sponsor gates. |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:StructuralWarnBelow` | appsettings, env | 0.3 | Optional (not mode-gated) | All (Api, Worker, Combined) | Quality gate warn threshold (structural). |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:SemanticWarnBelow` | appsettings, env | 0.2 | Optional (not mode-gated) | All (Api, Worker, Combined) | Quality gate warn threshold (semantic). |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:StructuralRejectBelow` | appsettings, env | 0 | Optional (not mode-gated) | All (Api, Worker, Combined) | Quality gate reject (structural); `0` = warn-only for non-negative scores. |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:SemanticRejectBelow` | appsettings, env | 0 | Optional (not mode-gated) | All (Api, Worker, Combined) | Quality gate reject (semantic); `0` = warn-only unless `EnforceOnReject` + positive floors. |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:EnforceOnReject` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | When true, AgentOutputEvaluationRecorder throws on gate reject after metrics/logs. |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:BlockRunOnReject` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | When true with EnforceOnReject, execute marks ExecutionCompletedQualityRejected and returns HTTP 409. |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:PilotStrictMinStructuralCompleteness` | appsettings, env | 0.45 | Optional (not mode-gated) | All (Api, Worker, Combined) | PilotStrict: reject traces strictly below this structural completeness ratio. |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:PilotStrictMinSemanticScore` | appsettings, env | 0.25 | Optional (not mode-gated) | All (Api, Worker, Combined) | PilotStrict: reject traces strictly below this semantic score. |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:PilotStrictMinEvidenceRefCount` | appsettings, env | 0 | Optional (not mode-gated) | All (Api, Worker, Combined) | PilotStrict: require at least this many top-level evidenceRefs when value > 0. |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:PilotStrictMinFaithfulnessSupportRatio` | appsettings, env | (unset) | Optional (not mode-gated) | All (Api, Worker, Combined) | Optional PilotStrict minimum aggregate explanation faithfulness ratio. |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:PilotStrictMinAgentResultFaithfulnessSupportRatio` | appsettings, env | (unset) | Required when `Mode=PilotStrict` | All (Api, Worker, Combined) | Minimum deterministic AgentResult-to-evidence grounding ratio when an evidence package exists; Staging/Production ship **0.7**. Host startup fails if PilotStrict and this is unset (`IValidateOptions`). |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:HeuristicEvaluatorTightenedThresholds` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | Use stricter heuristic semantic thresholds (production-like). |
| ArchLucid | `ArchLucid:AgentOutput:QualityGate:PerAgentTypeFloors` | appsettings, env | (empty) | Optional (not mode-gated) | All (Api, Worker, Combined) | Optional per-`AgentType` structural/semantic warn and reject floors (`AgentTypeQualityFloors`). |
| ArchLucid | `ArchLucid:Agents:LlmJudge:Enabled` | appsettings, env | false | Optional | All (Api, Worker, Combined) | Opt-in LLM rubric judge (**Topology, Critic, Cost, Compliance** when enabled). Legacy section **`ArchLucid:AgentOutput:LlmSemanticJudge`** still binds for older configs. |
| ArchLucid | `ArchLucid:AgentOutput:LlmSemanticJudge` | appsettings, env | (legacy) | Deprecated | All | **Deprecated** binding path for judge options; use **`ArchLucid:Agents:LlmJudge`**. Canonical Agents keys override when both are present. |
| ArchLucid | `ArchLucid:AgentExecution:QualityGate:Judge` | appsettings, env | (legacy) | Deprecated | All | **Deprecated** judge budget path; use **`ArchLucid:Agents:LlmJudge:Budget`**. |
| ArchLucid | `ArchLucid:FallbackLlm:Enabled` | appsettings, env, KeyVault | false | Optional (When DR fallback on) | All | Enables secondary Azure OpenAI deployments on primary 429/5xx. Pilot profile keeps **disabled**. |
| ArchLucid | `ArchLucid:FallbackLlm:Endpoints` | appsettings, env, KeyVault | [] | Optional (When DR fallback on) | All | Ordered fallback Endpoint/ApiKey/DeploymentName rows (canonical). |
| ArchLucid | `ArchLucid:FallbackLlm:Endpoint` | appsettings, env, KeyVault | empty | Deprecated | All | **Deprecated** flat fallback endpoint; use **`ArchLucid:FallbackLlm:Endpoints[n]:Endpoint`**. |
| ArchLucid | `ArchLucid:FallbackLlm:ApiKey` | env, KeyVault | empty | Deprecated | All | **Deprecated** flat fallback API key; use **`ArchLucid:FallbackLlm:Endpoints[n]:ApiKey`**. |
| ArchLucid | `ArchLucid:FallbackLlm:DeploymentName` | appsettings, env | empty | Deprecated | All | **Deprecated** flat fallback deployment; use **`ArchLucid:FallbackLlm:Endpoints[n]:DeploymentName`**. |
| ArchLucid | `ArchLucid:Agents:LlmJudge:Budget:Enabled` | appsettings, env | true | Optional | All | Isolated UTC-day judge token sub-cap (**not** `LlmDailyTenantBudget`). Legacy alias **`ArchLucid:AgentExecution:QualityGate:Judge:*`** binds first; canonical **`Agents:LlmJudge:Budget`** wins. |
| ArchLucid | `ArchLucid:Agents:LlmJudge:Budget:HardCutoffTokensPerUtcDay` | appsettings, env | 200000 | Optional tuning | All | Hard stop for judge + faithfulness completions per tenant per UTC day (`dbo.LlmJudgeDailyTenantTokenWindowState`). |
| ArchLucid | `ArchLucid:Agents:LlmJudge:Budget:AssumedMaxTotalTokensPerRequest` | appsettings, env | 8192 | Optional tuning | All | Pre-call reserve assumption for judge completions. |
| ArchLucid | `ArchLucid:Agents:LlmJudge:DeploymentName` | appsettings, env | empty | Optional | All | Judge chat deployment; empty uses **`AzureOpenAI:DeploymentName`**. |
| ArchLucid | `ArchLucid:Agents:Faithfulness:EmbeddingEnabled` | appsettings, env | false | Optional | All (Api, Worker, Combined) | When true, compute embedding cosine alignment vs evidence for `AgentOutputSemanticScore` + OTEL (`archlucid_agent_output_embedding_faithfulness_mean_cosine`). |
| ArchLucid | `ArchLucid:Agents:Faithfulness:EmbeddingMaxChunkUtf16Length` | appsettings, env | 512 | Optional tuning | All | Chunk size for embedding faithfulness (host clamps 128–8192). |
| ArchLucid | `ArchLucid:Agents:Faithfulness:EmbeddingChunkOverlapUtf16` | appsettings, env | 64 | Optional tuning | All | Chunk overlap for embedding faithfulness (host clamps vs chunk length). |
| ArchLucid | `ArchLucid:Agents:LlmFaithfulness:Enabled` | appsettings, env | false | Optional | All (Api, Worker, Combined) | When true with quality gate enabled, runs LLM faithfulness judge post-execute on real-mode paths (skipped in Simulator when `SkipWhenSimulator=true`). |
| ArchLucid | `ArchLucid:Agents:LlmFaithfulness:EnforcePhaseB` | appsettings, env | false | Optional | All | **TB-021 Phase B promotion:** when true with `Enabled`, per-trace warn/reject uses `LlmFaithfulnessScore` floors; other traces on the run continue. Staging/Production ship **true** after golden-cohort soak. |
| ArchLucid | `ArchLucid:Agents:LlmFaithfulness:MinScoreRejectBelow` | appsettings, env | 0.65 | Optional | All | Per-trace reject floor when `EnforcePhaseB=true` (aligns with nightly p50 floor; ratchet target 0.70). |
| ArchLucid | `ArchLucid:Agents:LlmFaithfulness:MinScoreWarnBelow` | appsettings, env | 0.70 | Optional | All | Warn when score is in [<MinScoreRejectBelow>, MinScoreWarnBelow) and gate would otherwise accept. |
| ArchLucid | `ArchLucid:Agents:LlmFaithfulness:SkipWhenSimulator` | appsettings, env | true | Optional | All | Skip LLM judge when `AgentExecution:Mode=Simulator`. |
| ArchLucid | `ArchLucid:Explanation:Aggregate:FaithfulnessFallbackEnabled` | appsettings, env | true | Optional (not mode-gated) | All (Api, Worker, Combined) | Allow fallback when faithfulness is low. |
| ArchLucid | `ArchLucid:Explanation:Aggregate:MinSupportRatioToTrustLlmNarrative` | appsettings, env | 0.2 | Optional (not mode-gated) | All (Api, Worker, Combined) | Minimum support ratio to trust the LLM narrative block. |
| ArchLucid | `ArchLucid:MermaidCli:Enabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | Optionally render Mermaid with external CLI. |
| CosmosDb | `CosmosDb:ConnectionString` | appsettings, env, KeyVault | empty | Optional (When using Cosmos) | All (Api, Worker, Combined) | Optional Cosmos connection when the deployment uses it. |
| CosmosDb | `CosmosDb:DatabaseName` | appsettings, env | ArchLucid | Optional (not mode-gated) | All (Api, Worker, Combined) | Cosmos database name when enabled. |
| CosmosDb | `CosmosDb:GraphSnapshotsEnabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | When true on SQL storage, graph snapshots are **SQL-authoritative** with **`dbo.CosmosGraphSnapshotOutbox`** + worker upsert to Cosmos ([ADR 0038](../architecture/adrs/0038-run-durability-multi-store-outbox-production-secrets.md)). |
| FeatureManagement | `FeatureManagement:FeatureFlags:AsyncAuthorityPipeline` | appsettings, env | **unset → enabled on SQL**; explicit `false` in Advanced profile | Optional | All (Api, Worker, Combined) | Queue authority pipeline stages after run create. **InMemory** never queues. Production sets **`true`** explicitly in `appsettings.Production.json`. |
| CosmosDb | `CosmosDb:AgentTracesEnabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | Store agent traces in Cosmos when enabled. |
| CosmosDb | `CosmosDb:AuditEventsEnabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | Stream audit to Cosmos if configured. |
| HotPathCache | `HotPathCache:Enabled` | appsettings, env | true | Optional (not mode-gated) | All (Api, Worker, Combined) | Hot path cache on/off. |
| HotPathCache | `HotPathCache:Provider` | appsettings, env | Auto | Optional (not mode-gated) | All (Api, Worker, Combined) | Cache backend selection (e.g. Redis, memory, auto). |
| HotPathCache | `HotPathCache:ExpectedApiReplicaCount` | appsettings, env | 1 | Optional (not mode-gated) | Api, Combined | Expected number of API replicas (cache coherency hint). |
| HotPathCache | `HotPathCache:AbsoluteExpirationSeconds` | appsettings, env | 60 | Optional (not mode-gated) | All (Api, Worker, Combined) | Absolute cache TTL in seconds for hot path entries. |
| HotPathCache | `HotPathCache:RedisConnectionString` | appsettings, env, KeyVault | empty | Optional (When using Redis for cache) | All (Api, Worker, Combined) | Redis when Provider selects Redis/Auto+Redis discoverable. |
| Retrieval | `Retrieval:EmbeddingModel:ModelId` | appsettings, env | `fake-local` (dev) / Azure deployment name (prod) | Optional | All | Active embedding deployment id stamped on indexed chunks and checked at startup (TB-045). Host post-configures from `AzureOpenAI:EmbeddingDeploymentName` when Azure embeddings are enabled. |
| Retrieval | `Retrieval:EmbeddingModel:ExpectedDimension` | appsettings, env | 32 (fake) / 1536 (Azure default) | Optional | All | Expected dense vector length for index + query paths. Mismatched stored chunks are excluded at query time (`archlucid_retrieval_embedding_dimension_mismatch_total`). Startup fails closed when in-memory index metadata disagrees with config — clear index or re-index after deployment change. |
| Retrieval | `Retrieval:ManifestChunkSummarization:Enabled` | appsettings, env | true | Optional (not mode-gated) | All (Api, Worker, Combined) | When true, summarize lowest-score manifest corpus hits when estimated tokens exceed `SafeTokenLimit`. Runbook: [`docs/runbooks/MANIFEST_CHUNK_SUMMARIZATION.md`](../runbooks/MANIFEST_CHUNK_SUMMARIZATION.md). |
| Retrieval | `Retrieval:ManifestChunkSummarization:SafeTokenLimit` | appsettings, env | 12000 | Optional (not mode-gated) | All (Api, Worker, Combined) | Estimated input-token budget across retrieval hits before manifest chunk summarization runs. |
| Retrieval | `Retrieval:VectorIndex` | appsettings, env | `InMemory` | **Required `AzureSearch` on all production-like profiles** (owner 2026-05-29); optional in Development | All | `InMemory` (dev/tests) or `AzureSearch` (hosted production-like). Selects `IVectorIndex` implementation in host composition. |
| Retrieval | `Retrieval:AzureSearch:Endpoint` | appsettings, env, KeyVault | empty | **Required when `VectorIndex=AzureSearch`** | All | Azure AI Search service URL. When set, registers `AzureSearchSdkClient`; when empty, `NotConfiguredAzureSearchClient` throws on use. |
| Retrieval | `Retrieval:AzureSearch:IndexName` | appsettings, env | (product default) | **Required when `VectorIndex=AzureSearch`** | All | Target search index name. |
| Retrieval | `Retrieval:AzureSearch:ApiKey` | appsettings, env, KeyVault | empty | **Required when not using Entra/MI auth** | All | API key for Search; prefer managed identity where TB-080 patterns apply. **TB-071:** `AzureSearchSdkClient` applies tenant/workspace/project OData filters on every search and scoped delete; unscoped queries fail fast when scope GUIDs are empty. |
| Retrieval | `Retrieval:Reranking:Provider` | appsettings, env | `AzureAiSearchSemantic` | Optional | All | Reranker provider when `Retrieval:Reranking:Enabled=true`. **TB-684:** enabled in Staging/Production hosted JSON; Development sets `Enabled=false` (RC6 dev runbook). |
| Retrieval | `Retrieval:Ask:SkipExpensiveStages` | appsettings, env | `false` (Production default); `true` in Staging | Optional | Api (Ask) | When true, Ask sets per-query `SkipQueryExpansion` / `SkipReranking` so Staging avoids rewrite, HyDE, and rerank cost on the Ask path while leaving global `Retrieval:Advanced` / `Retrieval:Reranking` unchanged for other callers. |
| Retrieval | `Retrieval:Advanced:Enabled` | appsettings, env | true | Optional | All | Master switch for Graph-RAG (RAG-V2-001) and single-pass query expansion (RAG-V2-002). |
| Retrieval | `Retrieval:Advanced:EnableQueryRewrite` | appsettings, env | true | Optional | All | When true, one LLM completion rewrites the query before embedding (not iterative). |
| Retrieval | `Retrieval:Advanced:EnableHyde` | appsettings, env | true | Optional | All | When true, one LLM completion generates a hypothetical document for embedding (HyDE). |
| Retrieval | `Retrieval:Advanced:EnableGraphRag` | appsettings, env | true | Optional | All | When true, expands graph hits with bounded multi-hop neighbor traversal (**TB-597**). |
| Retrieval | `Retrieval:Advanced:MaxGraphTraversalHops` | appsettings, env | 2 | Optional | All | Graph-RAG hop budget (1–4, cycle-safe BFS). |
| Retrieval | `Retrieval:Advanced:ExpansionTimeoutSeconds` | appsettings, env | 5 | Optional | All | Per-transform LLM timeout for query rewrite / HyDE before heuristic fallback. |
| Retrieval | `Retrieval:Advanced:EnableIterativeRetrieveCritiqueRetry` | appsettings, env | false | Optional | All | When true, runs bounded retrieve-critique-retry after single-pass expansion (**TB-878**). Default off; flag off preserves single-pass behavior. |
| Retrieval | `Retrieval:Advanced:MaxIterativeRetrievalRounds` | appsettings, env | 2 | Optional | All | Maximum retrieval rounds including the initial pass when iterative retry is enabled (1–4, hard-clamped). |
| AgentExecution | `AgentExecution:Mode` | appsettings, env | Simulator | Optional (not mode-gated) | All (Api, Worker, Combined) | Simulator (offline) or Real (calls Azure OpenAI) — see validation rules. Run-level traces tag `archlucid.execution_mode` (`simulator` / `real`). |
| AgentExecution | `AgentExecution:CompletionClient` | appsettings, env | omit or Azure | Optional (not mode-gated) | All (Api, Worker, Combined) | Echo to skip real LLM; see AgentExecution rules. |
| AgentExecution | `AgentExecution:LlmCostEstimation:Enabled` | appsettings, env | true | Optional (not mode-gated) | All (Api, Worker, Combined) | Token cost heuristics for telemetry. |
| AgentExecution | `AgentExecution:LlmCostEstimation:InputUsdPerMillionTokens` | appsettings, env | 0.5 | Optional (not mode-gated) | All (Api, Worker, Combined) | Cost model input (USD per 1M tokens). |
| AgentExecution | `AgentExecution:LlmCostEstimation:OutputUsdPerMillionTokens` | appsettings, env | 1.5 | Optional (not mode-gated) | All (Api, Worker, Combined) | Cost model output (USD per 1M tokens). |
| AgentExecution | *(prompt assembly — TB-681)* | — | — | — | All (Real LLM) | Agent and Ask user prompts place static guidance before per-run evidence/retrieval so Azure OpenAI automatic prompt caching can reuse the stable prefix. OTel counter `archlucid_llm_cached_prompt_tokens_total` records provider cached input tokens when returned. |
| AgentExecution | `AgentExecution:TraceStorage:BlobPersistenceTimeoutSeconds` | appsettings, env | 30 | Optional (not mode-gated) | All (Api, Worker, Combined) | Timeout for writing trace chunks to durable storage. |
| AgentExecution | `AgentExecution:ReferenceEvaluation:Enabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | Reference case evaluation off by default in template. |
| AgentExecution | `AgentExecution:ReferenceEvaluation:ReferenceCasesPath` | appsettings, env | empty | Optional (When reference eval on) | All (Api, Worker, Combined) | Path to reference case fixtures. |
| AgentExecution | `AgentExecution:Resilience:MaxConcurrentHandlers` | appsettings, env | 8 | Optional (not mode-gated) | All (Api, Worker, Combined) | Parallel agent/LLM handler limit. |
| AgentExecution | `AgentExecution:Resilience:PerHandlerTimeoutSeconds` | appsettings, env | 900 | Optional (not mode-gated) | All (Api, Worker, Combined) | Per job timeout. |
| AgentExecution | `AgentExecution:Resilience:LlmCallMaxRetryAttempts` | appsettings, env | 3 | Optional (not mode-gated) | All (Api, Worker, Combined) | LLM call retries. |
| AgentExecution | `AgentExecution:Resilience:LlmCallBaseDelayMilliseconds` | appsettings, env | 500 | Optional (not mode-gated) | All (Api, Worker, Combined) | Exponential backoff base (LLM). |
| AgentExecution | `AgentExecution:Resilience:LlmCallMaxDelaySeconds` | appsettings, env | 10 | Optional (not mode-gated) | All (Api, Worker, Combined) | Maximum delay between LLM retries. |
| AgentExecution | `AgentExecution:SchemaValidation:EnforceOnParse` | appsettings, env | true | Optional (not mode-gated) | All (Api, Worker, Combined) | When true, **`AgentResultParser`** rejects invalid AgentResult JSON before domain checks; Staging/Production templates set **true** explicitly. |
| ArchLucid | `ArchLucid:ContentSafety:Enabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | On non-production-like hosts, toggles real guard vs null guard; Production/Staging always use Azure Content Safety. |
| ArchLucid | `ArchLucid:ContentSafety:Endpoint` | appsettings, env, KeyVault | empty | Required — Production or Staging (or `ARCHLUCID_ENVIRONMENT` Production\|Staging) | All (Api, Worker, Combined) | Azure AI Content Safety resource URL; see `ContentSafetyRules` startup validation. **IaC:** `deploy/hosted-prod-terraform` outputs `content_safety_endpoint` / `azure_content_safety_container_app_env` (**TB-212**). |
| ArchLucid | `ArchLucid:ContentSafety:ApiKey` | appsettings, env, KeyVault | empty | Required — Production or Staging (or `ARCHLUCID_ENVIRONMENT` Production\|Staging) | All (Api, Worker, Combined) | Content Safety credential (never log). |
| ArchLucid | `ArchLucid:ContentSafety:BlockSeverityThreshold` | appsettings, env | 4 | Optional (not mode-gated) | All (Api, Worker, Combined) | Minimum text severity (0/2/4/6) that blocks; **4** = block high and highest. |
| ArchLucid | `ArchLucid:ContentSafety:FailClosedOnSdkError` | appsettings, env | true | Optional (not mode-gated) | All (Api, Worker, Combined) | When true, SDK/network errors block; Staging/Production ship **true**; host post-configure still forces fail-closed if a later JSON file sets false—startup logs an advisory. |
| ArchLucid | `ArchLucid:ContentSafety:AllowNullGuardInDevelopment` | appsettings, env | true | Optional (not mode-gated) | Non-production-like hosts | When **Enabled** is false, allows pass-through guard in development unless set false (fail-fast misconfiguration). |
| ArchLucid | `ArchLucid:ContentSafety:EvaluateCompletionPromptAndResponse` | appsettings, env | true | Optional (not mode-gated) | All (Api, Worker, Combined) | When true, enforces Content Safety on LLM prompt and completion paths. |
| AzureOpenAI | `AzureOpenAI:Endpoint` | appsettings, env, KeyVault, AZURE_OPENAI__Endpoint | empty | Required — When Real and not Echo | All (Api, Worker, Combined) | Azure OpenAI resource endpoint (HTTPS). |
| AzureOpenAI | `AzureOpenAI:ApiKey` | env, KeyVault, AZURE_OPENAI__ApiKey | empty | Required when Real, not Echo, and `AuthenticationMode` is `ApiKey` (default) | All (Api, Worker, Combined) | Client credential for the Azure OpenAI resource (never log). Omit when using `AuthenticationMode=ManagedIdentity`. |
| AzureOpenAI | `AzureOpenAI:AuthenticationMode` | appsettings, env | ApiKey | Optional (not mode-gated) | All (Api, Worker, Combined) | `ApiKey` (default) or `ManagedIdentity` for hosted Azure deployments using `DefaultAzureCredential`. |
| AzureOpenAI | `AzureOpenAI:DeploymentName` | env, AZURE_OPENAI__DeploymentName | empty | Required — When Real and not Echo | All (Api, Worker, Combined) | Chat/Completion deployment name in Azure OpenAI. |
| AzureOpenAI | `AzureOpenAI:MaxCompletionTokens` | appsettings, env | 0 (4096 default) | Optional (not mode-gated) | All (Api, Worker, Combined) | Upper bound; 0 uses product default (see agents pipeline). |
| AzureOpenAI | `AzureOpenAI:UseJsonSchemaResponseFormat` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | When true, agent **`AzureOpenAiCompletionClient`** requests **`json_schema`** structured output using **`SchemaValidation:AgentResultSchemaPath`**; on HTTP **400** from the provider, falls back to **`json_object`** mode. |
| LlmDailyTenantBudget | `LlmDailyTenantBudget:Enabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | Enforce durable daily LLM token cap per tenant (`dbo.LlmDailyTenantTokenWindowState`; `LlmDailyTenantTokenWindowOptions`). |
| LlmDailyTenantBudget | `LlmDailyTenantBudget:HardCutoffTokensPerUtcDay` | appsettings, env | 2000000 | Optional (When cap on) | All (Api, Worker, Combined) | Hard token budget per calendar UTC day (`LlmDailyTenantTokenWindowOptions`). |
| LlmDailyTenantBudget | `LlmDailyTenantBudget:WarnFraction` | appsettings, env | 0.8 | Optional (When cap on) | All (Api, Worker, Combined) | Warn when consumption crosses this fraction of cap. |
| LlmDailyTenantBudget | `LlmDailyTenantBudget:AssumedMaxTotalTokensPerRequest` | appsettings, env | 65536 | Optional (When cap on) | All (Api, Worker, Combined) | Heuristic for reservation math. |
| LlmMonthlyTenantDollarBudget | `LlmMonthlyTenantDollarBudget:Enabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | Enforce UTC-month estimated USD cap per tenant (requires `AgentExecution:LlmCostEstimation` + positive USD/M rates). |
| LlmMonthlyTenantDollarBudget | `LlmMonthlyTenantDollarBudget:IncludedUsdPerUtcMonth` | appsettings, env | 50 | Optional (When cap on) | All (Api, Worker, Combined) | Warn threshold = this × `WarnFraction`. |
| LlmMonthlyTenantDollarBudget | `LlmMonthlyTenantDollarBudget:HardCutoffUsdPerUtcMonth` | appsettings, env | 75 | Optional (When cap on) | All (Api, Worker, Combined) | Hard stop for real-mode completions when cumulative estimated USD would exceed this. |
| LlmMonthlyTenantDollarBudget | `LlmMonthlyTenantDollarBudget:WarnFraction` | appsettings, env | 0.75 | Optional (When cap on) | All (Api, Worker, Combined) | Emit `LlmTenantMonthlyDollarBudgetApproaching` once per tenant per UTC month. |
| LlmMonthlyTenantDollarBudget | `LlmMonthlyTenantDollarBudget:AssumedMaxPromptTokensPerRequest` | appsettings, env | 32768 | Optional (When cap on) | All (Api, Worker, Combined) | Pre-call USD reservation (input). |
| LlmMonthlyTenantDollarBudget | `LlmMonthlyTenantDollarBudget:AssumedMaxCompletionTokensPerRequest` | appsettings, env | 8192 | Optional (When cap on) | All (Api, Worker, Combined) | Pre-call USD reservation (output). |
| AgentPrompts | `AgentPrompts:Versions:topology` | appsettings, env | v2026-04 | Optional (not mode-gated) | All (Api, Worker, Combined) | Prompt set version: topology pack. |
| AgentPrompts | `AgentPrompts:Versions:cost` | appsettings, env | v2026-04 | Optional (not mode-gated) | All (Api, Worker, Combined) | Prompt set version: cost pack. |
| AgentPrompts | `AgentPrompts:Versions:compliance` | appsettings, env | v2026-04 | Optional (not mode-gated) | All (Api, Worker, Combined) | Prompt set: compliance pack. |
| AgentPrompts | `AgentPrompts:Versions:critic` | appsettings, env | v2026-04 | Optional (not mode-gated) | All (Api, Worker, Combined) | Prompt set: critic pack. |
| ArchLucid | `ArchLucid:Agents:StagedCriticEnabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | When true, RealAgentExecutor runs non-Critic agents first, then Critic, injecting a bounded summary evidence note (Real execution path only). |
| ArchLucid | `ArchLucid:Agents:StagedCriticOverlapEnabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | When true with staged Critic, runs Critic concurrently with phase-1 agents when quality posture allows (blocked under PilotStrict enforce/block). |
| ArchLucid | `ArchLucid:Agents:Phase1MaxConcurrentHandlers` | appsettings, env | 0 | Optional (not mode-gated) | All (Api, Worker, Combined) | Optional phase-1 admission cap during staged overlap (0 = reserve one bulkhead slot for Critic). |
| ArchLucid | `ArchLucid:Llm:RedactReasoningTrace` | appsettings, env | false (true in Api Production/Staging templates) | Optional (not mode-gated) | Api, Combined (Real executor) | When true, merged `AgentResult.ReasoningTrace` is passed through `IPromptRedactor.RedactAlways` before the handler result is returned (independent of `LlmPromptRedaction:Enabled`). |
| ArchLucid | `ArchLucid:Agents:SummaryMaxTotalChars` | appsettings, env | 12000 | Optional (not mode-gated) | All (Api, Worker, Combined) | Upper bound on staged prior-agents summary body (clamped after bind). |
| ArchLucid | `ArchLucid:Agents:SummaryPerAgentMaxChars` | appsettings, env | 4000 | Optional (not mode-gated) | All (Api, Worker, Combined) | Upper bound per agent section inside the staged summary. |
| ArchLucid | `ArchLucid:Agents:MaxClaimsPerAgentIncluded` | appsettings, env | 8 | Optional (not mode-gated) | All (Api, Worker, Combined) | Max claim lines excerpted per prior agent in the staged summary. |
| ArchLucid | `ArchLucid:Agents:MaxClaimLineChars` | appsettings, env | 240 | Optional (not mode-gated) | All (Api, Worker, Combined) | Max characters per claim excerpt after redaction. |
| ArchLucid | `ArchLucid:Agents:MaxFindingTitlesPerAgent` | appsettings, env | 5 | Optional (not mode-gated) | All (Api, Worker, Combined) | Max finding titles listed per prior agent in the staged summary. |
| ArchLucid | `ArchLucid:Agents:MaxFindingTitleChars` | appsettings, env | 100 | Optional (not mode-gated) | All (Api, Worker, Combined) | Max characters per finding title excerpt. |
| SchemaValidation | `SchemaValidation:AgentResultSchemaPath` | appsettings, content | schemas/... | Optional (not mode-gated) | All (Api, Worker, Combined) | On-disk path to the agent result JSON schema. |
| SchemaValidation | `SchemaValidation:GoldenManifestSchemaPath` | appsettings, content | schemas/... | Optional (not mode-gated) | All (Api, Worker, Combined) | Golden manifest JSON schema file. |
| SchemaValidation | `SchemaValidation:EnableDetailedErrors` | appsettings, env | true | Optional (not mode-gated) | All (Api, Worker, Combined) | Verbose schema errors in early validation (dev). |
| ArchLucidAuth | `ArchLucidAuth:Mode` | appsettings, env | ApiKey | Optional (not mode-gated) | All (Api, Worker, Combined) | `ApiKey` (shipped base JSON, keys disabled = **fail closed**), `DevelopmentBypass` (`appsettings.Development.json`), or `JwtBearer` (production OIDC). See **[API_AUTH_BEHAVIOR_CONTRACT.md](API_AUTH_BEHAVIOR_CONTRACT.md)**. |
| ArchLucidAuth | `ArchLucidAuth:Authority` | appsettings, env | empty | Optional (When OIDC in use) | All (Api, Worker, Combined) | Identity provider authority (OIDC) when that mode is enabled — generic issuer checklist [GENERIC_OIDC_SETUP.md](../runbooks/GENERIC_OIDC_SETUP.md). |
| ArchLucidAuth | `ArchLucidAuth:JwtSigningPublicKeyPemPath` | appsettings, env | empty | Optional (Non-production JWT PEM path) | All (Api, Worker, Combined) | Local JWT validation PEM path — disallowed on ASP.NET Core Production / `ARCHLUCID_ENVIRONMENT=Production`. |
| ArchLucidAuth | `ArchLucidAuth:Audience` | appsettings, env | empty | Optional (When OIDC in use) | All (Api, Worker, Combined) | Token audience (OIDC). |
| ArchLucidAuth | `ArchLucidAuth:DevUserId` | appsettings, env | dev-user | Optional (not mode-gated) | All (Api, Worker, Combined) | Principal id for the development loop. |
| ArchLucidAuth | `ArchLucidAuth:DevUserName` | appsettings, env | Developer | Optional (not mode-gated) | All (Api, Worker, Combined) | Display name in dev default principal. |
| ArchLucidAuth | `ArchLucidAuth:DevRole` | appsettings, env | Admin | Optional (not mode-gated) | All (Api, Worker, Combined) | Default role in dev (see security docs). |
| ArchLucidAuth | `ArchLucidAuth:Saml2:Enabled` | appsettings, env | false | Optional (SAML SP) | Api, Combined | When true, registers ITfoxtec SAML 2.0 SP **in addition to** the primary mode in `ArchLucidAuth:Mode` (see **[SECURITY.md](contributor-reference/SECURITY.md)**). |
| ArchLucidAuth | `ArchLucidAuth:Saml2:Issuer` | appsettings, env | empty | Required — When SAML on | Api, Combined | SP entity ID / issuer URI (maps to SAML `Issuer`). |
| ArchLucidAuth | `ArchLucidAuth:Saml2:IdPMetadata` | appsettings, env | empty | Required — When SAML on | Api, Combined | HTTPS URL of the IdP federation metadata document. |
| ArchLucidAuth | `ArchLucidAuth:Saml2:SigningCertificateFile` | appsettings, env, file | empty | Optional (When IdP requires SP signing) | Api, Combined | PFX path (absolute or app-relative) for signing outbound AuthnRequests. |
| ArchLucidAuth | `ArchLucidAuth:Saml2:SigningCertificatePassword` | env, KeyVault, user secrets | null | Optional (If signing PFX encrypted) | Api, Combined | Password for `SigningCertificateFile` (secret). |
| ArchLucidAuth | `ArchLucidAuth:Saml2:RoleClaimSources` | appsettings, env | `[]` | Optional (SAML) | Api, Combined | SAML attribute **claim types** (URI or short name) promoted to `roles` / `ClaimTypes.Role` for `ArchLucidRoleClaimsTransformation`. |
| ArchLucidAuth | `ArchLucidAuth:Saml2:TenantIdClaimType` | appsettings, env | null | Optional (SAML) | Api, Combined | SAML attribute mapped to `tenant_id` (GUID string). |
| ArchLucidAuth | `ArchLucidAuth:Saml2:WorkspaceIdClaimType` | appsettings, env | null | Optional (SAML) | Api, Combined | SAML attribute mapped to `workspace_id` (GUID). |
| ArchLucidAuth | `ArchLucidAuth:Saml2:ProjectIdClaimType` | appsettings, env | null | Optional (SAML) | Api, Combined | SAML attribute mapped to `project_id` (GUID). |
| ArchLucidAuth | `ArchLucidAuth:Saml2:DirectoryObjectIdClaimType` | appsettings, env | null | Optional (SAML) | Api, Combined | SAML attribute mapped to `oid` for directory role sync. |
| Persistence | `Persistence:SqlOpenResilience:MaxRetryAttempts` | appsettings, env | 3 | Optional (Sql hosts) | All (Api, Worker, Combined) | SQL connection **open** retries for transient errors (`SqlTransientDetector`) via `ResilientSqlConnectionFactory`; `0` disables retries. |
| Persistence | `Persistence:SqlOpenResilience:BaseDelayMilliseconds` | appsettings, env | 200 | Optional (Sql hosts) | All (Api, Worker, Combined) | Base delay for exponential backoff with jitter between SQL open retries. |
| Trial | `Trial:Lifecycle:IntervalMinutes` | appsettings, env | 360 | Optional (not mode-gated) | All (Api, Worker, Combined) | Trial state machine / email tick interval. |
| Trial | `Trial:Lifecycle:ReadOnlyAfterExpireDays` | appsettings, env | 7 | Optional (not mode-gated) | All (Api, Worker, Combined) | Days after expiry before read-only state. |
| Trial | `Trial:Lifecycle:ExportOnlyAfterReadOnlyDays` | appsettings, env | 30 | Optional (not mode-gated) | All (Api, Worker, Combined) | Transition to export-only after read-only for this many days. |
| Trial | `Trial:Lifecycle:PurgeAfterExportOnlyDays` | appsettings, env | 60 | Optional (not mode-gated) | All (Api, Worker, Combined) | Hard delete delay after export-only (policy). |
| Trial | `Trial:Lifecycle:HardPurgeMaxRowsPerStatement` | appsettings, env | 5000 | Optional (not mode-gated) | All (Api, Worker, Combined) | Purge batch size (data retention job). |
| Auth | `Auth:Trial:ExternalIdTenantId` | appsettings, env | empty | Optional (When trial IdP) | All (Api, Worker, Combined) | B2C / external tenant id mapping for self-service sign-up. |
| Auth | `Auth:Trial:LocalIdentity:JwtPrivateKeyPemPath` | appsettings, env | empty | Optional (When local IdP) | All (Api, Worker, Combined) | PEM for HS/RS local JWT signing (path). |
| Auth | `Auth:Trial:LocalIdentity:JwtIssuer` | appsettings, env | empty | Optional (When local IdP) | All (Api, Worker, Combined) | Local JWT issuer string. |
| Auth | `Auth:Trial:LocalIdentity:JwtAudience` | appsettings, env | empty | Optional (When local IdP) | All (Api, Worker, Combined) | Local JWT audience. |
| Auth | `Auth:Trial:LocalIdentity:AccessTokenLifetimeMinutes` | appsettings, env | 60 | Optional (not mode-gated) | All (Api, Worker, Combined) | Access token TTL for local auth. |
| Auth | `Auth:PublicSignup:Mode` | appsettings, env | `InviteOnly` | Required — public signup posture | Api, Combined | `InviteOnly` (base/production default) returns 404 on `POST /v1/register` and blocks self-service workspace create without invitation; `PublicSelfService` enables open signup. **`appsettings.Development.json`** sets `PublicSelfService` for local + live E2E trial DX. UI mirror: `NEXT_PUBLIC_PUBLIC_SIGNUP_MODE`. |
| Auth | `Auth:SelfServiceAbuse:Enabled` | appsettings, env | true | Optional (When public signup) | Api, Combined | Enables anti-farm evaluation on registration and post-auth workspace create. |
| Auth | `Auth:SelfServiceAbuse:MaxTrialsPerEmailLifetime` | appsettings, env | 1 | Optional (When public signup) | Api, Combined | Maximum self-service trial claims per normalized email (invitation bypasses). |
| Auth | `Auth:SelfServiceAbuse:MaxTrialsPerDomainPerWindow` | appsettings, env | 5 | Optional (When public signup) | Api, Combined | Maximum distinct trials per email domain per rolling window. |
| Auth | `Auth:SelfServiceAbuse:DomainVelocityWindowHours` | appsettings, env | 24 | Optional (When public signup) | Api, Combined | Rolling window for domain velocity limits. |
| Auth | `Auth:EmailOtp:Enabled` | appsettings, env | true | Optional (passwordless sign-in) | Api, Combined | Enables email OTP challenge endpoints. |
| Auth | `Auth:EmailOtp:RequireBotChallenge` | appsettings, env | false | Required before public signup | Api, Combined | When true, OTP challenge requests require a verified bot-challenge token. |
| Auth | `Auth:EmailOtp:BotChallenge:Provider` | appsettings, env | `None` | When `RequireBotChallenge` | Api, Combined | `None`, `Turnstile`, or `HCaptcha`. |
| Auth | `Auth:EmailOtp:BotChallenge:SecretKey` | env, Key Vault | empty | Required in prod-like when challenge on | Api, Combined | Server secret for Turnstile/hCaptcha siteverify (never commit). |
| Auth | `Auth:EmailOtp:HashPepper` | env, Key Vault | empty | Required in prod-like when OTP enabled | Api, Combined | Mixed into OTP code hashes; minimum 32 characters in Production/Staging (`ValidateOnStart`). Changing pepper invalidates in-flight challenges. |
| Auth | `Auth:EmailOtp:CodeLifetimeMinutes` | appsettings, env | 10 | Optional (not mode-gated) | All (Api, Worker, Combined) | OTP code expiration in minutes. |
| Auth | `Auth:EmailOtp:MaxVerificationAttemptsPerChallenge` | appsettings, env | 5 | Optional (not mode-gated) | All (Api, Worker, Combined) | Failed verification attempts before challenge invalidation. |
| Auth | `Auth:EmailOtp:MaxCodeRequestsPerEmailPerHour` | appsettings, env | 5 | Optional (not mode-gated) | All (Api, Worker, Combined) | OTP challenge requests allowed per email per hour. |
| Auth | `Auth:EmailOtp:MaxCodeRequestsPerIpPerHour` | appsettings, env | 20 | Optional (not mode-gated) | All (Api, Worker, Combined) | OTP challenge requests allowed per client IP per hour. |
| Auth | `Auth:EmailOtp:ResendCooldownSeconds` | appsettings, env | 45 | Optional (not mode-gated) | All (Api, Worker, Combined) | Minimum seconds between OTP sends for the same email. |
| UI | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | env | empty | When bot challenge enabled | UI | Cloudflare Turnstile site key on email OTP challenge/resend steps. Absent = widget hidden. |
| Cors | `Cors:AllowedOrigins:0` | appsettings, env, Cors__* | http://localhost:3000 | Optional (not mode-gated) | Api, Combined | First allowed origin; additional indices use 1,2,… in JSON. |
| RateLimiting | `RateLimiting:Registration:PermitLimit` | appsettings, env | 5 | Optional (not mode-gated) | Api, Combined | Throttling: registration path. |
| RateLimiting | `RateLimiting:Registration:WindowMinutes` | appsettings, env | 60 | Optional (not mode-gated) | Api, Combined | Registration throttling window. |
| RateLimiting | `RateLimiting:EmailOtp:PermitLimit` | appsettings, env | 10 | Optional (not mode-gated) | Api, Combined | HTTP rate limit for email OTP endpoints per IP. |
| RateLimiting | `RateLimiting:EmailOtp:WindowMinutes` | appsettings, env | 15 | Optional (not mode-gated) | Api, Combined | HTTP rate limit window for email OTP endpoints. |
| RateLimiting | `RateLimiting:AuthRouting:PermitLimit` | appsettings, env | 10 | Optional (not mode-gated) | Api, Combined | HTTP rate limit for anonymous invitation validate (`auth-routing` policy) per IP. |
| RateLimiting | `RateLimiting:AuthRouting:WindowMinutes` | appsettings, env | 15 | Optional (not mode-gated) | Api, Combined | HTTP rate limit window for invitation validate. |
| RateLimiting | `RateLimiting:AuthRouting:QueueLimit` | appsettings, env | 0 | Optional (not mode-gated) | Api, Combined | Queued validate requests after permit exhaustion (usually 0). |
| RateLimiting | `RateLimiting:FixedWindow:PermitLimit` | appsettings, env | 60 | Optional (not mode-gated) | Api, Combined | Default fixed window permit cap. |
| RateLimiting | `RateLimiting:FixedWindow:WindowMinutes` | appsettings, env | 1 | Optional (not mode-gated) | Api, Combined | Fixed window length in minutes. |
| RateLimiting | `RateLimiting:EvidenceBulkUpload:PermitLimit` | appsettings, env | 20 | Optional (not mode-gated) | Api, Combined | `POST …/evidence/bulk` per-tenant/per-window cap (policy `evidenceBulkUpload`; role multipliers apply). |
| RateLimiting | `RateLimiting:EvidenceBulkUpload:WindowMinutes` | appsettings, env | 1 | Optional (not mode-gated) | Api, Combined | Window for bulk evidence upload throttling. |
| RateLimiting | `RateLimiting:EvidenceBulkUpload:QueueLimit` | appsettings, env | 0 | Optional (not mode-gated) | Api, Combined | Queued uploads after permit exhaustion (usually 0). |
| RateLimiting | `RateLimiting:EvidenceBulkUpload:Anomaly:Enabled` | appsettings, env | true | Optional (not mode-gated) | Api, Combined | Z-score spike detection for bulk evidence uploads. |
| RateLimiting | `RateLimiting:EvidenceBulkUpload:Anomaly:ZScoreThreshold` | appsettings, env | 3 | Optional (not mode-gated) | Api, Combined | Observation-window sum must exceed mean×n + Z×σ×√n to flag an anomaly. |
| RateLimiting | `RateLimiting:EvidenceBulkUpload:Anomaly:StricterPermitLimitMultiplier` | appsettings, env | 0.25 | Optional (not mode-gated) | Api, Combined | Permit cap multiplier while a partition is throttled after a spike. |
| RateLimiting | `RateLimiting:EvidenceBulkUpload:Anomaly:ThrottleDurationMinutes` | appsettings, env | 15 | Optional (not mode-gated) | Api, Combined | Minutes of stricter rate limiting after anomaly detection. |
| RateLimiting | `RateLimiting:Replay:Light:PermitLimit` | appsettings, env | 60 | Optional (not mode-gated) | Api, Combined | Light replay throttling (see policies). |
| RateLimiting | `RateLimiting:Replay:Light:WindowMinutes` | appsettings, env | 1 | Optional (not mode-gated) | Api, Combined | Window for light replay throttling. |
| RateLimiting | `RateLimiting:Replay:Heavy:PermitLimit` | appsettings, env | 15 | Optional (not mode-gated) | Api, Combined | Heavy replay throttling (expensive paths). |
| RateLimiting | `RateLimiting:Replay:Heavy:WindowMinutes` | appsettings, env | 1 | Optional (not mode-gated) | Api, Combined | Window for heavy replay throttling. |
| Authentication | `Authentication:ApiKey:Enabled` | appsettings, env | false | Optional (not mode-gated) | Api, Combined | Static X-Api-Key authentication — when `false`, requests **fail closed** unless `DevelopmentBypassAll` applies in non-Production. |
| Authentication | `Authentication:ApiKey:DevelopmentBypassAll` | appsettings, env | false | Optional (not mode-gated) | Api, Combined | DANGER: only for dev — bypass key checks. Must be off in production. |
| Authentication | `Authentication:ApiKey:AdminKey` | env, KeyVault, user secrets | null in template | Optional (If enabled (see custom rule: at least one of Admin/Read keys)) | Api, Combined | High-privilege API key value when `Enabled` (never print in CLI; presence only). |
| Authentication | `Authentication:ApiKey:ReadOnlyKey` | env, KeyVault, user secrets | null in template | Optional (If enabled (see at least one key rule)) | Api, Combined | Read-tier API key when `Enabled` (secret). |
| Billing | `Billing:Provider` | appsettings, env | Stripe | Optional (not mode-gated) | All (Api, Worker, Combined) | Billing integrator: Stripe, marketplace, etc. |
| Billing | `Billing:Stripe:SecretKey` | env, KeyVault | empty | Required — Production billing | All (Api, Worker, Combined) | Stripe live/test secret; required for paid flows in production. |
| Billing | `Billing:Stripe:CheckoutSecretKey` | env, KeyVault | empty | Required — When Stripe checkout enabled | All (Api, Worker, Combined) | Stripe Checkout session secret (or falls back to `Billing:Stripe:SecretKey`). |
| Billing | `Billing:Stripe:WebhookSigningSecret` | env, KeyVault | empty | Required — Production | All (Api, Worker, Combined) | Validates `Stripe-Signature` on the wallet webhook path. |
| Billing | `Billing:Stripe:SubscriptionWebhookSigningSecret` | env, KeyVault | empty | Required — When subscription billing on | All (Api, Worker, Combined) | Validates `Stripe-Signature` on subscription webhooks. |
| Billing | `Billing:Stripe:WalletWebhookSigningSecret` | env, KeyVault | empty | Required — When wallet webhooks on | All (Api, Worker, Combined) | Validates `Stripe-Signature` on wallet webhooks. |
| Billing | `Billing:Stripe:PublishableKey` | appsettings, env, KeyVault | empty | Optional (When checkout UI in app) | All (Api, Worker, Combined) | Publishable key (non-secret but still not echoed by CLI in raw form here). |
| Billing | `Billing:Stripe:PriceIdTeam` | appsettings, env | empty | Optional (When using Stripe) | All (Api, Worker, Combined) | Default price for Team SKU. |
| Billing | `Billing:Stripe:PriceIdArchitect` | appsettings, env | empty | Optional (When using Stripe) | All (Api, Worker, Combined) | Default price for Architect SKU. |
| Billing | `Billing:Stripe:PriceIdPro` | appsettings, env | empty | Optional (When using Stripe) | All (Api, Worker, Combined) | Default price for Pro SKU. |
| Billing | `Billing:Stripe:PriceIdEnterprise` | appsettings, env | empty | Optional (When using Stripe) | All (Api, Worker, Combined) | Default price for Enterprise SKU. |
| Billing | `Billing:AzureMarketplace:LandingPageUrl` | appsettings, env | empty | Required — When marketplace GA in prod | All (Api, Worker, Combined) | Azure marketplace landing (production checks when GA). |
| Billing | `Billing:AzureMarketplace:MarketplaceOfferId` | appsettings, env | empty | Required — When marketplace GA in prod | All (Api, Worker, Combined) | Commercial marketplace offer id. |
| LlmPromptRedaction | `LlmPromptRedaction:Enabled` | appsettings, env | true | Optional (not mode-gated) | All (Api, Worker, Combined) | Redact prompts in logging/traces. |
| LlmPromptRedaction | `LlmPromptRedaction:ReplacementToken` | appsettings, env | [REDACTED] | Optional (not mode-gated) | All (Api, Worker, Combined) | Replacement for redacted span. |
| RetrievalTelemetry | `RetrievalTelemetry:RecordPerTenantTags` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | When true, RAG duration/chunk metrics also emit with `tenant_id` label (raises Prometheus cardinality — bounded tenants only). |
| RetrievalTelemetry | `RetrievalTelemetry:EstimatedTenantCount` | appsettings, env | 0 | Optional (When per-tenant RAG tags on) | All (Api, Worker, Combined) | Operator estimate for startup cardinality advisory when `RecordPerTenantTags` exceeds `MaxRecommendedTenantCountForPerTenantTags` on production-like hosts. |
| RetrievalTelemetry | `RetrievalTelemetry:MaxRecommendedTenantCountForPerTenantTags` | appsettings, env | 100 | Optional (When per-tenant RAG tags on) | All (Api, Worker, Combined) | Threshold paired with `EstimatedTenantCount` for `RetrievalTelemetryProductionWarningPostConfigure`. |
| Demo | `Demo:Enabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | In-product demo / synthetic paths. |
| Demo | `Demo:SeedOnStartup` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | Seeds the Contoso path when demo is on (see ops guide). |
| DeveloperExperience | `DeveloperExperience:EnableApiExplorer` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | Exposes extra OpenAPI/Scalar in non-prod (see security note). |
| DataConsistency | `DataConsistency:OrphanProbeEnabled` | appsettings, env | true | Optional (not mode-gated) | All (Api, Worker, Combined) | Background data consistency scan. |
| DataConsistency | `DataConsistency:OrphanProbeIntervalMinutes` | appsettings, env | 60 | Optional (not mode-gated) | All (Api, Worker, Combined) | Orphan scan cadence. |
| RequiredAuditTrail | `RequiredAuditTrail:OrphanProbeEnabled` | appsettings, env | true | Optional (not mode-gated) | All (Api, Worker, Combined) | TB-955 Required audit trail domain↔audit orphan probe. |
| RequiredAuditTrail | `RequiredAuditTrail:OrphanProbeIntervalMinutes` | appsettings, env | 60 | Optional (not mode-gated) | All (Api, Worker, Combined) | Required audit trail orphan probe cadence. |
| RequiredAuditTrail | `RequiredAuditTrail:OrphanProbeGraceMinutes` | appsettings, env | 15 | Optional (not mode-gated) | All (Api, Worker, Combined) | Dual-write lag grace before orphan count. |
| RequiredAuditTrail | `RequiredAuditTrail:OrphanProbeLookbackDays` | appsettings, env | 7 | Optional (not mode-gated) | All (Api, Worker, Combined) | Bound Required audit trail orphan scan window. |
| DataConsistency | `DataConsistency:Enforcement:Mode` | appsettings, env | Warn | Optional (not mode-gated) | All (Api, Worker, Combined) | Type default **Warn**; **`ArchLucid.Api/appsettings.Production.json`** and **`appsettings.Staging.json`** ship **Alert** for orphan paging signals (see **`DataConsistencyEnforcementMode`**). |
| DataConsistency | `DataConsistency:Enforcement:MaxRowsPerBatch` | appsettings, env | 500 | Optional (When enforced) | All (Api, Worker, Combined) | Safer cap per remediation batch. |
| DataConsistency | `DataConsistency:Enforcement:AlertThreshold` | appsettings, env | 1 | Optional (not mode-gated) | All (Api, Worker, Combined) | Orphan count threshold to page operators. |
| DataConsistency | `DataConsistency:Enforcement:AutoQuarantine` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | If true, auto quarantine (must be off until approved). |
| DataArchival | `DataArchival:PurgeArchivedAgentExecutionTracesAfterDays` | appsettings, env | 0 | Optional (not mode-gated) | Worker, Combined | Hard-delete SQL `AgentExecutionTraces` rows soft-archived longer than N days; 0 disables (Cosmos uses TTL). Runs during **`DataArchivalCoordinator`**. |
| DataArchival | `DataArchival:PurgeArchivedAgentExecutionTracesBatchSize` | appsettings, env | 500 | Optional (When trace purge on) | Worker, Combined | `DELETE TOP` batch size per loop iteration (validated 1–10000 when purge enabled). |
| DataArchival | `DataArchival:PurgeUncommittedRunsAfterDays` | appsettings, env | 0 | Optional (not mode-gated) | Worker, Combined | Hard-delete non-Committed `dbo.Runs` older than N days; 0 disables. Excludes demo/showcase runs. Part of **`DataArchivalCoordinator`**. |
| DataArchival | `DataArchival:PurgeUncommittedRunsBatchSize` | appsettings, env | 500 | Optional (When uncommitted run purge on) | Worker, Combined | Batch size for `Archival_PurgeStaleUncommittedRunsBatch` (validated 1–10000). |
| AzureExtractor | `AzureExtractor:AutoPull:Enabled` | appsettings, env | false | Optional (not mode-gated) | Worker, Combined | Leader-only Tier-2 Azure extractor background pull (scaffold until ARM/cost ingest ships). |
| AzureExtractor | `AzureExtractor:AutoPull:IntervalMinutes` | appsettings, env | 360 | Optional (not mode-gated) | Worker, Combined | Cadence between pull attempts when enabled; clamped 15–10080 in hosted service. |
| AzureDevOps | `AzureDevOps:Enabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | Enables work-item / PR status integration. |
| AzureDevOps | `AzureDevOps:Organization` | appsettings, env, KeyVault ref | empty | Optional (If ADO on) | All (Api, Worker, Combined) | DevOps org name (non-secret, still presence-checked). |
| AzureDevOps | `AzureDevOps:Project` | appsettings, env | empty | Optional (If ADO on) | All (Api, Worker, Combined) | Project in Azure DevOps. |
| AzureDevOps | `AzureDevOps:PersonalAccessToken` | env, KeyVault | empty | Optional (If ADO on) | All (Api, Worker, Combined) | PAT for the integration (secret). |
| Serilog | `Serilog:MinimumLevel:Default` | appsettings, env | Information | Optional (not mode-gated) | All (Api, Worker, Combined) | Serilog default minimum (host logging). |
| Logging | `Logging:LogLevel:Default` | appsettings, env | Information | Optional (not mode-gated) | All (Api, Worker, Combined) | Microsoft logger default (framework). |
| Observability | `Observability:Otlp:Enabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | Export OpenTelemetry to OTLP collector (host). |
| Observability | `Observability:Otlp:Endpoint` | env, KeyVault | empty | Required — If OTLP enabled | All (Api, Worker, Combined) | OTLP base URL; required when `Observability:Otlp:Enabled` is true. |
| Observability | `Observability:AzureMonitor:ApplicationInsightsConnectionString` | env, KeyVault | empty | Optional (When App Insights export) | All (Api, Worker, Combined) | Application Insights connection string under `Observability:AzureMonitor` (host OTel wiring). |
| Observability | `Observability:Prometheus:Enabled` | appsettings, env | false | Optional (not mode-gated) | All (Api, Worker, Combined) | Expose Prometheus scrape endpoint on `/metrics` (trusted network only). |
| ApplicationInsights | `ApplicationInsights:ConnectionString` | env, KeyVault | empty | Optional (When telemetry export) | All (Api, Worker, Combined) | Application Insights connection string (appsettings or Key Vault reference). |
| Environment | `APPLICATIONINSIGHTS_CONNECTION_STRING` | env | empty | Optional (When telemetry export) | All (Api, Worker, Combined) | Azure Application Insights connection string env var (preferred on Azure App Service). |
| Email | `Email:Provider` | appsettings, env | Noop | Optional (not mode-gated) | All (Api, Worker, Combined) | Noop, Smtp, or Azure Communication Services (see `Email` namespace). |
| Email | `Email:SupportInbox` | appsettings, env | support@archlucid.net | Optional (not mode-gated) | All (Api, Worker, Combined) | Support intake mailbox for problem reports and auto-ack copy. |
| Email | `Email:AzureCommunicationServicesEndpoint` | env, KeyVault | empty | Required — If ACS for email in prod | All (Api, Worker, Combined) | Azure Communication Services **Email** resource endpoint (HTTPS) when that provider is selected (see validation). |
| Environment | `ASPNETCORE_ENVIRONMENT` | env, launchSettings, Service | (unset) | Optional (not mode-gated) | All | ASPNETCORE_ / DOTNET_ENVIRONMENT — cluster role for startup validation. Checked via environment variable, not appsettings path. |
| CLI | `ARCHLUCID_API_URL` | env, archlucid.json | http://localhost:5128 (default) | Optional (When using the CLI) | CLI | Resolves the API base URL; not consumed by the API process. |
| CLI | `ARCHLUCID_API_KEY` | env, archlucid.json (optional) | empty | Optional (If calling protected admin routes from CLI) | CLI | Maps to `X-Api-Key` for admin routes; `config check` never prints the value. |

### Staged Critic (`ArchLucid:Agents:StagedCriticEnabled`)

**Scope:** `RealAgentExecutor` when `AgentExecution:Mode=Real` (deterministic simulator is unchanged).

**Trade-off:** Turning this on adds batch wall-clock time because the Critic handler starts only after the other agents in the same `ExecuteAsync` batch complete. The benefit is a richer Critic prompt: a capped, redacted digest of those agents' structured `AgentResult` fields is appended under `EvidenceNoteTypes.StagedPriorAgentsSummary` and surfaced in the Critic user prompt. This is **execution sequencing and evidence-note injection** only; it does not add autonomous planning beyond the commitments in `docs/library/V1_SCOPE.md`.

### Generic OIDC Setup (Okta / Auth0)

When configuring a generic OIDC issuer (such as Okta or Auth0), use `JwtBearer` mode and specify the authority.

**JSON snippet (`appsettings.json`):**

```json
{
  "ArchLucidAuth": {
    "Mode": "JwtBearer",
    "Authority": "https://your-tenant.us.auth0.com/",
    "Audience": "https://api.archlucid.yourdomain.com",
    "RoleClaimSources": ["groups", "ArchLucidRoles"]
  }
}
```

**YAML snippet:**

```yaml
ArchLucidAuth:
  Mode: JwtBearer
  Authority: https://your-tenant.us.auth0.com/
  Audience: https://api.archlucid.yourdomain.com
  RoleClaimSources: 
    - groups
    - ArchLucidRoles
```

**Notes on mapping IdP claims:**
Ensure your Identity Provider is configured to include the roles or groups in the token claims. You can map these IdP claims to `ArchLucidRoles` by adding the claim names to `ArchLucidAuth:RoleClaimSources`. The API will map these sources to `ClaimTypes.Role` for authorization.

Full cross-vendor checklist: **[GENERIC_OIDC_SETUP.md](../runbooks/GENERIC_OIDC_SETUP.md)** (includes Entra OIDC app-role guidance).

### SAML 2.0 SP claim mapping examples

When **`ArchLucidAuth:Saml2:Enabled=true`**, map IdP assertion attributes to ArchLucid scope and roles using the `ArchLucidAuth:Saml2:*ClaimType` keys above. **Validate attribute names with your IdP administrator** — URIs differ by vendor.

**Generic SAML IdP (illustrative attribute URIs)**

```json
"ArchLucidAuth": {
  "Saml2": {
    "Enabled": true,
    "Issuer": "https://api.example.com/saml2/sp",
    "IdPMetadata": "https://idp.example.com/FederationMetadata/2007-06/FederationMetadata.xml",
    "RoleClaimSources": [
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    ],
    "TenantIdClaimType": "tenant_id",
    "WorkspaceIdClaimType": "workspace_id",
    "ProjectIdClaimType": "project_id"
  }
}
```

**Okta / Auth0-style SAML (group → role promotion)**

- Map a **`groups`** or **`memberOf`** attribute into **`RoleClaimSources`**, then ensure released values match **`Admin`**, **`Operator`**, **`Reader`**, or **`Auditor`**.
- Scope claims (`tenant_id`, `workspace_id`, `project_id`) are optional; when absent, the host uses the default registration scope.

**Common misconfigurations**

- IdP sends **`Role`** with display names that do not match **`ArchLucidRoles`** → **403** after successful SSO.
- **`IdPMetadata`** URL blocked from the API egress network → SAML login fails at metadata load.
- SP signing certificate expired → see **`GET /v1/admin/auth/saml-operational-health`** and **[SAML SP certificate rotation runbook](../runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md)** (`archlucid saml test-config` for offline validation).

Architect workspace: **Settings → Identity providers** surfaces OIDC discovery and SAML operational health (Admin session).

