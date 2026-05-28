> **Scope:** Engineering-owned technical backlog items deferred from current sessions; audience is contributors and the AI assistant; not a buyer or operator document. Not a substitute for ADRs or the pending-questions owner decisions file.

# Tech backlog

Items here are **greenlit in principle** — the decision has been made and context is captured — but deferred for a future session rather than the current one. Pick any item up by searching the codebase for the files listed and applying the recorded approach.

**Priority order:** Items are listed highest → lowest priority. When picking up work, start at the top. Re-sort when new items are added: items that affect customer-visible correctness rank above ops/observability improvements, which rank above developer-experience polish.

**Recently shipped (IDs kept for grep, ADRs, and code comments — spec text removed below):** **TB-001** (informational async audit best-effort + counter), **TB-002** (`archlucid_startup_config_warnings_total`), **TB-003** (named-query p95 allowlist + `archlucid_query_p95_ms`), **TB-006** (`ComparisonRecords` run id GUID + FK migration), **TB-022** (long-safe run token aggregation), **TB-024** (reasoning-token test coverage), **TB-026** (`LlmCostEstimationOptions` negative-rate validation + runtime guard).

**TB-022 – TB-026** were added 2026-05-24 from an audit-grade correctness review of `LlmCostEstimator` (see `ArchLucid.AgentRuntime/LlmCostEstimator.cs` and `ArchLucid.Application/Agents/AgentExecutionTraceRunLlmCostAggregator.cs`). They form a single thematic cluster: TB-022 + TB-026 are correctness fixes; TB-024 is test coverage; TB-023 + TB-025 are documentation/annotation.

**TB-027 – TB-032** were added 2026-05-26 from a full dependency-graph audit across all 59 `.csproj` files (239 edges). They address violations against the intended `Contracts → Core → Application → Host/Adapters` layering and close gaps in `ArchLucid.Architecture.Tests` / `DependencyConstraintTests`.

**TB-033 – TB-038** were added 2026-05-26 from a replay / provenance completeness audit (`ArchLucid.Provenance` decision lineage vs `AgentRuntime` `AgentExecutionTrace` forensics). They close gaps where a single agent task cannot be fully reconstructed from durable storage. Retrieval grounding enrichment is also tracked as **RAG-V1-006** in [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](RAG_QUALITY_TECHNICAL_BACKLOG.md).

**TB-039 – TB-044** were added 2026-05-26 from an AgentRuntime determinism and idempotency audit (retry, fan-out, partial-failure, and authority-pipeline replay paths). They close gaps where LLM calls, token metering, or graph snapshots can be applied more than once without supersession. **TB-039** and **TB-043** are FinOps / economics fixes; **TB-041** + **TB-042** are authority-pipeline replay guards; **TB-040** and **TB-044** are metering honesty and trace deduplication. Cross-ref **TB-012** (**INV-009** idempotency) and **TB-035** (remediation attempt forensics — complementary, not duplicate).

**TB-045 – TB-049** were added 2026-05-26 from a retrieval correctness & drift audit (`ArchLucid.Retrieval` — embedding model drift, index staleness, chunking invalidation, tenancy bleed, IR eval harness). Authoritative sub-IDs **RAG-V1-007** through **RAG-V1-011** in [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](RAG_QUALITY_TECHNICAL_BACKLOG.md). **TB-048** (tenancy) is security-critical; **TB-049** (IR eval) blocks silent retrieval regressions.

**TB-050 – TB-056** were added 2026-05-27 from a Decisioning explainability and uncertainty audit (`ArchLucid.Decisioning` — authority `RuleBasedDecisionEngine` / `RuleAuditTracePayload` vs coordinator `DecisionEngineV2` / `DecisionNode`). They close gaps where operators cannot trace manifest decisions to inputs, rules/prompts, and honest confidence. Cross-ref **TB-036** (provenance ↔ agent trace correlation), **TB-037** (provenance snapshot materialization). Canvas audit: `canvases/decisioning-explainability-audit.canvas.tsx` (IDE-only).

**TB-057 – TB-063** were added 2026-05-27 from a commercial stickiness review. They do **not** create a parallel GRC product. They consolidate existing signed review package primitives — findings, monitored risks, manifest decisions, governance approvals, digests, ROI, compare/drift, audit, and integration correlations — into a recurring operating workflow. **TB-063** is explicitly **V1.1** because first-party ITSM productization is release-windowed there per [`V1_SCOPE.md`](V1_SCOPE.md) §2.13 and [`V1_DEFERRED.md`](V1_DEFERRED.md) §6.

**TB-064 – TB-070** were added 2026-05-27 from a DDL hygiene and migration-safety audit (`ArchLucid.Persistence` DbUp + `Scripts/ArchLucid.sql` + `Persistence.MigrateVerify`). They close gaps against the repo **one DDL file per DB** rule, journal-only verification, IaC/generated-schema drift, and rolling-deploy risk from non-additive migrations. **TB-065** and **TB-068** are deploy-safety critical; **TB-064** closes the system-catalog DDL gap; **TB-066**–**TB-067** are CI/docs parity; **TB-069**–**TB-070** are maintainability hygiene. Canvas audit: `canvases/ddl-hygiene-audit.canvas.tsx` (IDE-only).

**TB-071 – TB-078** were added 2026-05-27 from a multi-tenancy and blast-radius audit (API ingress → Application → Persistence → Retrieval / knowledge graph → operator UI). They close gaps where `tenantId` is derived but not enforced at the query layer, and where cross-tenant data could leak via ID-only snapshot reads, unbound auth schemes, client-controlled scope headers, or retrieval index writes. **TB-071** and **TB-072** are security-critical (P0); **TB-073**–**TB-075** are high (P1); **TB-076**–**TB-078** are defense-in-depth (P2). Cross-ref **TB-048** / **RAG-V1-010** (retrieval query filter — partial; production Azure client still missing), **TB-010** (**INV-001** tenant boundary), **TB-005** (owner pen-test). Canvas audit: `canvases/multitenant-blast-radius-audit.canvas.tsx` (IDE-only).

**TB-079 – TB-084** were added 2026-05-27 from a secrets, identity, and tool-sandboxing audit (`Integrations.AzureDevOps`, `Integrations.AzureExtractor`, agent tool surfaces, prompt-injection paths). No WIQL/LLM→ADO API injection path exists; the integration is event-driven with config-fixed targets. Identified gaps: unescaped markdown from compare data echoed into ADO PR bodies (**TB-079**, Low–Med); Azure OpenAI still using symmetric `ApiKey` instead of Entra/MI (**TB-080**, Info); Service Bus raw connection string permitted in production with no safety rule (**TB-081**, Info); `AgentTask.AllowedTools` advisory-only with no runtime enforcer at handler dispatch (**TB-082**, Med); `ArchLucidApiKey` header secret has no production Key Vault reference requirement (**TB-083**, Info); `SubscriptionId` not validated as GUID before ARM URL construction (**TB-084**, Low). Cross-ref **TB-005** (pen-test), **TB-072** (scope-to-identity binding).

**TB-091 --- TB-102** were added 2026-05-27 from an IaC parity audit across all `infra/terraform-*` roots (read against live appsettings, NuGet packages, and CD workflow references). They close two distinct gap categories: (A) runtime Azure services that are **entirely absent from Terraform** --- Azure OpenAI, Redis, Cosmos DB, AI Search, ACR, and Azure Monitor Workspace; and (B) **configuration gaps inside existing roots** --- Key Vault private endpoint, Key Vault workload RBAC grants, per-service diagnostic settings, Logic Apps storage-key access, and sampling/replication hygiene. **TB-091** and **TB-092** are security-critical (Key Vault reachability and workload RBAC); **TB-093**---**TB-099** are IaC coverage gaps that create ops/compliance risk; **TB-100**---**TB-102** are hygiene. Canvas audit: `canvases/iac-parity-audit.canvas.tsx` (IDE-only).
**TB-103 – TB-105** were added 2026-05-27 from a cross-layer domain-term audit (executive dashboard, orphan candidates, governance). They close gaps where business logic defined once in the backend has been reconstituted independently in the UI layer, causing KPI values to diverge silently from server-computed truth. **TB-103** is the highest-priority item: orphan-candidate count and savings are computed by two separate pipelines (different inputs, different algorithms) with no shared API contract. **TB-104** closes the 14-day expiring-waiver window living only in the client. **TB-105** pushes business-impact category bucketing to the server so `BusinessImpactSummaryWidget` becomes a pure display component. Cross-ref **TB-062** (executive dashboard live KPI replacement — these items are scoped sub-tasks of that broader effort).

**TB-106 – TB-113** were added 2026-05-27 from a `RunDetailPageView` operator fidelity audit (does the run detail page surface everything needed to approve, reject, or remediate a run?). Root cause is a split API contract: the operator loader calls `GET /v1/authority/runs/{runId}` but the UI reads `agentExecutionLlmCostEstimate`, `trustEvidenceCard`, and `results[]` that exist only on the architecture endpoint — those fields are null on every live run. Additional gaps: retrieval hits and tool calls have no dedicated UI surface anywhere; `findingCoverageSummary.hasCommitBlockingFailures` and `dispositionCoverage` are computed in `GetRunDetailAsync` but dropped before render; `hasGovernanceWarnings` and `lastFailureReason` from `RunRecord` are never shown. **TB-106**–**TB-108** are correctness/operator-visibility P0s; **TB-109**–**TB-111** are P1 operator-visibility additions; **TB-112** is P2 workflow; **TB-113** is P2 schema hygiene. Canvas audit: `canvases/run-detail-operator-fidelity.canvas.tsx` (IDE-only).

**TB-085 – TB-090** were added 2026-05-27 from a Backfill.Cli and Jobs.Cli operational review (idempotency on rerun, bounded memory, checkpointing, poison-message handling, observability). **TB-089** is operator-visible (duplicate digest emails on ACA retry); **TB-087** closes a concurrent-rerun duplicate-`FindingRecords` window; **TB-088** prevents whole-job failure on one bad tenant/schedule; **TB-085** + **TB-086** harden large-catalog backfill runs; **TB-090** enables CI/pipeline assertions. Neither CLI writes cost rows; provenance child inserts are count-guarded (**TB-087** adds DB-level defense). Cross-ref **TB-012** (**INV-009** idempotency), **TB-067** (migration/backfill docs), **TB-061** (digest recurrence), [`SqlRelationalBackfill.md`](SqlRelationalBackfill.md), [`CONTAINER_APPS_JOBS.md`](../runbooks/CONTAINER_APPS_JOBS.md).

| ID | Title | Priority driver | Size |
|----|-------|----------------|------|
| TB-009 | Architecture invariant program — doc + ADR 0035 finalize | Engineering governance — single catalog IDs `INV-*`, proposed ADR acceptance, links from index / Cursor rule | Done (doc land 2026-05-09) |
| TB-010 | Architecture invariant enforcement — Wave A (INV-001, INV-005, INV-006) | Done (Improvement **#21**, 2026-05-25) — INV-001 Roslyn analyzer; INV-005 catalog/fail-fast parity; INV-006 composition-root scan | S |
| TB-011 | Architecture invariant enforcement — Wave B (INV-002, INV-004, INV-012, INV-013) | Partial (Batch H, 2026-05-26) — **INV-002** persisted mode + trust card + operator UI badge; INV-004/012/013 remain | L |
| TB-033 | Agent execution trace — persist LLM sampling params + reasoning token count | Forensic replay completeness — temperature / maxTokens / top_p and reasoning tokens are not on `AgentExecutionTrace` | XS |
| TB-071 | Azure Search production client — wire tenant OData filter on every search/delete | Security (P0) — `AzureSearchTenantScopeFilterBuilder` exists but only `NotConfiguredAzureSearchClient` is registered; cross-tenant retrieval unverifiable in production | S–M |
| TB-072 | Scope-to-identity binding at API ingress (ApiKey, DevBypass, header/claim reconciliation) | Security (P0) — ApiKey and DevBypass carry zero tenant claims; `x-tenant-id` alone resolves scope | M |
| TB-073 | Scoped snapshot repository reads (findings / graph / context + relational child loads) | Security (P1) — `GetByIdAsync(Guid)` and child queries filter by snapshot/record ID only; IDOR in SingleCatalog mode | M |
| TB-074 | Retrieval indexing write-path tenant validation | Security (P1) — `RetrievalIndexingService` copies `TenantId` from document metadata without validating against ambient `ScopeContext` | S |
| TB-075 | Operator UI server-side scope (proxy strips client headers; SSR from session) | Security (P1) — browser `localStorage` and forwarded `x-tenant-id` choose tenant; SSR hardcodes dev GUIDs | S–M |
| TB-082 | Agent `AllowedTools` — runtime enforcement at handler dispatch | Security (P2) — advisory/prompt-only allowlist; empty = unrestricted; no enforcer at `RealAgentExecutor` dispatch | S |
| TB-079 | ADO PR markdown — sanitize `SummaryHighlights` + deep-link fields before writing PR comment body | Security (P2) — unescaped compare data echoed verbatim into ADO PR bodies; markdown/HTML injection risk | XS |
| TB-083 | Service Bus — production safety rule: require namespace FQDN, disallow raw connection string | Security hardening — `IntegrationEvents:ServiceBusConnectionString` permitted in production with no Key Vault enforcement | XS |
| TB-081 | `ArchLucidApiKey` — production safety rule: require Key Vault reference | Security hardening — long-lived API key in config with no enforcement rule analogous to ADO PAT guard | XS |
| TB-080 | Azure OpenAI — migrate from `ApiKey` config key to `DefaultAzureCredential` (Entra auth) | Security hardening — symmetric key in config; Entra/MI reduces credential-rotation burden; aligns with blob/KV/ACS posture | S |
| TB-084 | AzureExtractor — validate `SubscriptionId` as GUID before ARM URL construction | Defense-in-depth — whitespace rejected but malformed IDs pass through to ARM without format guard | XS |
| TB-091 | Key Vault private endpoint + private DNS zone (`privatelink.vaultcore.azure.net`) | Security --- KV has `public_network_access_enabled=false` but no private endpoint or DNS zone in `terraform-private`; portal-only configuration, unmanageable by TF | XS-S |
| TB-092 | Key Vault Secrets User RBAC for API + Worker managed identities | Security --- container apps read KV secrets at runtime via managed identity; role assignment absent from all TF roots; portal-created, subject to drift | XS |
| TB-093 | Create `terraform-openai` root --- provision Azure OpenAI account + model deployments | IaC coverage (HIGH) --- code comment says "out-of-band"; model deployments, content filters, CMK, and private endpoint are all unmanaged; aligns with TB-080 | M |
| TB-094 | Create `terraform-redis` root --- Azure Cache for Redis hot-path cache | IaC coverage --- `HotPathCache.RedisConnectionString` present in `appsettings.Production.json`; no `azurerm_redis_cache`; SKU, eviction, private endpoint unmanaged | S |
| TB-095 | Assess + codify Cosmos DB --- create `terraform-cosmos` if active in production | IaC coverage --- `CosmosDb.ConnectionString` in `appsettings.json`; `Microsoft.Azure.Cosmos` NuGet in `ArchLucid.Persistence`; consistency/throughput/backup unmanaged if live | S-M |
| TB-096 | Create `terraform-search` root --- Azure AI Search service | IaC coverage --- private endpoint variable wired in `terraform-private` but service never created; cross-ref TB-071 (production search client gap) | S |
| TB-097 | Create `terraform-acr` root --- Azure Container Registry | IaC coverage --- read via `data` source in `terraform-container-apps`; geo-replication, retention, and network rules are portal-only | S |
| TB-098 | Add `azurerm_monitor_workspace` to `terraform-monitoring` | IaC coverage --- `var.azure_monitor_workspace_id` referenced by P0+SLO Prometheus rule groups but resource never created; apply fails if workspace drifts | XS |
| TB-099 | Add diagnostic settings for Container Apps, Service Bus namespace, and artifact storage account | Ops / observability --- consistent with pattern already in `terraform-logicapps/diagnostics.tf`; three resources, one Log Analytics workspace target | S |
| TB-100 | Migrate Logic App Standard storage from access-key to managed identity | IaC hygiene --- all 7 Logic Apps pass `primary_access_key` verbatim; key rotation in portal breaks apps until TF re-apply | M |
| TB-101 | Resolve legacy App Service VNet integration in `terraform-private/app_service.tf` | IaC hygiene --- `azurerm_app_service_virtual_network_swift_connection` references `var.linux_web_app_id`; system runs on Container Apps; verify state, decommission or document | XS |
| TB-102 | Parameterize `application_insights_sampling_percentage` in `terraform-monitoring` | IaC hygiene --- hardcoded to 100 (no sampling); expose as variable so operators can tune without editing .tf source | XS |
| TB-090 | Backfill.Cli — `--output-json` report + per-stage timing | Ops observability — console-only output; no machine-readable report for CI/pipelines | XS |
| TB-069 | Simplify `GreenfieldBaselineMigrationRunner` sparse-stamp path | Maintainability — complex drift-repair runner with no post-stamp schema verification | M |
| TB-070 | `PersistenceContractSupplement.sql` stale refs + test catalog parity | Test hygiene — supplement references retired `ArchiForge.sql`; can drift from latest migrations | XS |
| TB-106 | RunDetailPageView — enrich authority `RunDetailDto` with cost estimate, trust evidence card, and `results[]` | Operator visibility (P0) — `agentExecutionLlmCostEstimate`, `trustEvidenceCard`, and `results[]` are null on every live run; operator reviews cost as "unavailable" | M |
| TB-107 | RunDetailPageView — surface `lastFailureReason` + `hasGovernanceWarnings` from `RunRecord` | Operator visibility (P0) — operator approves runs with suppressed governance warnings and hidden failure reasons; both fields fetched but never rendered | S |
| TB-108 | RunDetailPageView — render `findingCoverageSummary.dispositionCoverage` + `hasCommitBlockingFailures` | Operator visibility (P0) — commit-blocking failures silently hidden before `CommitRunButton`; `dispositionCoverage` computed in `GetRunDetailAsync` but dropped at render | S |
| TB-103 | Orphan candidate count + savings — expose backend-computed values via API; remove heuristic parser from UI | Customer-visible correctness — `OrphanedResourceClassifier` and `run-potential-savings-parser.ts` use different inputs; KPI can silently diverge | M |
| TB-104 | 14-day expiring waiver KPI — server-compute the window; remove client-side date rule | Customer-visible correctness — `countExpiringWaivers` filter in `ExecutiveRoiDashboardLiveKpiCards.tsx` uses a frontend-defined 14-day cutoff; not returned by any backend metric | S |
| TB-105 | Business-impact category buckets — add pre-bucketed counts to `ExecutiveRoiSummaryResponse`; remove substring matcher | Customer-visible correctness — `BusinessImpactSummaryWidget.sumIssueCounts` uses `category` substring matching; brittle and not validated against backend classification | S |
| TB-109 | RunDetailPageView — add retrieval-hit / RAG grounding panel | Operator visibility (P1) — no UI surface anywhere shows which chunks were retrieved, their scores, or whether any retrieval step was degraded; critical when `faithfulnessWarning` is true | M |
| TB-110 | RunDetailPageView — add tool-call / function-invocation log panel | Operator visibility (P1) — no dedicated tool-call panel; agent forensics shows trace rows but not function-call lists; full prompt/response in blob storage is not rendered | M |
| TB-111 | RunDetailPageView — inline provenance summary card (collapse from sibling route) | Operator visibility (P1) — provenance requires full-page navigation to a sibling route using a different API; operator loses run context while reviewing | S |
| TB-112 | RunDetailPageView — add run-level approve / reject / request-remediation actions | Operator workflow (P2) — `CommitRunButton` (finalize manifest) is the only run-level action; all finding disposition lives on per-finding sub-routes with no run-level governance action | M |
| TB-113 | Fix OpenAPI schema drift on `RunDetailDto` — expose `degradedFindingCoverage` + `findingCoverageSummary` in generated TypeScript types | Schema hygiene (P2) — C# `RunDetailDto` has both fields; generated `api-types.generated.ts` may omit them; silent type-level omission makes it impossible to add UI without bypassing type safety | XS |
| TB-019 | Signup marketing attribution + server-side conversion (UTM survive funnel → provision success → telemetry/SQL) | Paid + organic honesty — **`SEO_AND_PAID_ACQUISITION.md`** data flow requires measurable **`TenantProvisioningService`** outcomes; avoids raw-UTM metric cardinality explosions | M |
| TB-020 | Public marketing SEO — `SoftwareApplication` + trust `FAQPage` JSON-LD; consent-gated Clarity (`NEXT_PUBLIC_ARCHLUCID_CLARITY_PROJECT_ID`); CSP (`clarity.ms`, `c.bing.com`); privacy §2.4 — DPIA / server kill-switch mirror optional | SERP + honest analytics posture | S–M |

---

## TB-009 — Architecture invariant catalog + ADR 0035

**Status:** **Documentation landed** (2026-05-09) — [`docs/library/ARCHITECTURE_INVARIANTS.md`](ARCHITECTURE_INVARIANTS.md) (IDs `INV-001`–`INV-015`), authoring skeleton [`docs/architecture/adrs/adr-template-full.md`](../architecture/adrs/adr-template-full.md), governance ADR **`docs/architecture/adrs/0035-architecture-invariant-catalog.md`** (**Status: Proposed** — flip to Accepted when owner reviews).

**What remains:**

1. Owner moves **ADR 0035** → **Accepted** after skimming invariant list + confirming no conflict with **TB-001** audit posture (especially **INV-003**).
2. Pick up **TB-010** → **TB-012** in order unless a security incident reprioritizes **INV-015**.

**Refs:** Cursor rule `.cursor/rules/Architecture-Invariants.mdc` (points agents at the catalog).

---

## TB-010 — Invariant Wave A — tenant boundary + fail-closed boot + composition root

**Status (2026-05-25):** **Done** (Improvement **#21**) — INV-001 (tenant identity boundary Roslyn analyzer ARCH001) shipped 2026-05-09; INV-005 startup-validator catalog parity (`ConfigurationCatalogProductionProfileGuardParityTests` + catalog guard metadata); INV-006 composition-root architecture test (`SingleCompositionRootServiceCollectionExtensionsTests`).

**Covers:** **INV-001**, **INV-005**, **INV-006**.

**Objective:** Eliminate ambiguous tenant derivation below the HTTP boundary and fail fast when production-like hosts violate auth/secret/disposition rules; constrain DI extensions to **`ArchLucid.Host.Composition`** (allow-listed exceptions only).

**Enforcement sketches:** Roslyn analyzer / architecture tests (`NetArchTest` or equivalent patterns already in-repo), **`StartupValidatorTests`** extensions, documented allow-list path for **`IServiceCollection`** extensions used by tests.

**Out of scope for this wave:** execution-mode persistence (**TB-011**), webhook middleware (**INV-015** → **TB-012**).

---

## TB-011 — Invariant Wave B — execution mode, budgets, single quality-gate outcome, replay isolation

**Covers:** **INV-002**, **INV-004**, **INV-012**, **INV-013**.

**Objective:** Persist honest execution labelling across API + DB + traces; reconcile LLM budgets across replicas; persist one quality-gate verdict per persisted run revision for downstream consumers; ensure replay artefacts do not mutate original evidence namespaces.

**Enforcement sketches:** DbUp → master DDL as per repo SQL rules; OpenAPI snapshot + codegen per **[`docs/library/API_CONTRACTS.md`](API_CONTRACTS.md)** if DTO shape changes.

**Depends on:** product agreement on **`Mixed`** UX copy (INV-002) before UI ships.

---

## TB-012 — Invariant Wave C — hygiene pack (clock, cancellation, idempotency, HTTP, repos, webhook order)

**Covers:** **INV-007**–**INV-011**, **INV-014**, **INV-015** plus **INV-003** transactional vs informational markings.

**Objective:** Analyzer-first gates with low behavioural risk; ordered inbound webhook pipeline before handler bodies; forbid mutable static state in **`Application`** / **`AgentRuntime`**.

**Note:** **INV-003** must respect **TB-001** informational-audit semantics unless a superseding backlog item merges.

---

## TB-004 — Wire OTel exporters + verify agent-output metrics; add Azure alerts

**Status (2026-05-25):** **Closed for production-like hosts with managed Prometheus.** **`infra/terraform-monitoring/prometheus_agent_output_rules.tf`** deploys Azure Monitor Prometheus rules mirroring **`infra/prometheus/archlucid-alerts.yml`** group **`archlucid-agent-output-quality`** (quality-gate rejects, semantic **p10/p50**, LLM faithfulness **p50**, parse failures, trace blob upload failures) to **`azurerm_monitor_action_group.ops`**. Requires **`enable_prometheus_slo_rule_group`** + non-empty **`azure_monitor_workspace_id`**. Eval baseline CI failure remains a **GitHub Actions** alert path (not Terraform). See **`docs/library/OBSERVABILITY.md`**, **`docs/library/AGENT_OUTPUT_EVALUATION.md`** §9, and dashboard import runbook **`docs/runbooks/OBSERVABILITY_DASHBOARD_BINDING.md`** (Improvement **#9**, Batch J).

**Decision / context (2026-05-01):** Product stance for agent quality favors a **conservative** release bar; **`archlucid_agent_output_*`** histograms and **`archlucid_agent_output_quality_gate_total`** must reach a backend before **trend charts** or **email alerts** are possible. Code already emits metrics after successful execute; **`ObservabilityExtensions`** exports when App Insights connection string, OTLP endpoint, or Prometheus scrape is configured (`docs/library/OBSERVABILITY.md` § *Export path configuration*).

**What to do (checklist):**

0. **Offline verification (no Azure CLI):** `python scripts/report_observability_export_readiness.py --environment Production --out artifacts/observability-export-readiness.md` — see `docs/library/OBSERVABILITY.md` (values from process env are detected but never printed; use `--no-process-environment` for committed JSON only).

1. **Per environment (staging → production):** Set **at least one** of:
   - **`APPLICATIONINSIGHTS_CONNECTION_STRING`** (preferred on Azure), or **`ApplicationInsights:ConnectionString`**, or **`Observability:AzureMonitor:ApplicationInsightsConnectionString`** on the **API** host; or
   - Non-empty **`Observability:Otlp:Endpoint`** (+ **`Protocol`** / **`Headers`** as needed); or
   - **`Observability:Prometheus:Enabled`** with scrape auth credentials and a scraper pointing at **`/metrics`** (trusted network only).

2. **`ArchLucid.Worker`:** If running Worker in the same subscription, apply the **same** exporter settings so worker-originated telemetry is not orphaned.

3. **Smoke verification:** After deploy, run **one full execute**; in **Application Insights → Metrics** (or OTLP sink), confirm **`archlucid_agent_output_semantic_score`**, **`archlucid_agent_output_structural_completeness_ratio`**, and **`archlucid_agent_output_quality_gate_total`** appear (Azure may normalize names — search by meter / namespace).

4. **Alerts:** **Shipped (Improvement #22, 2026-05-25)** — Terraform **`prometheus_agent_output_rules.tf`** + committed Prometheus YAML. Staging: **`terraform apply`**, one execute smoke, Azure Portal **Test** on a rule. Eval baseline CI remains warn-soak until merge-blocking flip (Improvement **#1** exit criterion).

5. **Optional:** Deploy **`infra/terraform-otel-collector`** for tail sampling; lower **`Observability:Tracing:SamplingRatio`** affects **traces**, not the agent-output **metric** path — document any sampling choice for on-call.

**Reference docs:** `docs/library/AGENT_OUTPUT_EVALUATION.md` §9; `docs/quality/MANUAL_QA_CHECKLIST.md` §8.4.

**Size estimate:** ~1–2 h of ops / Terraform / portal work (no mandatory code change unless exporter wiring gaps are found).

---

## TB-005 — AI-assisted owner pen-test support (Cursor agent)

**Context (2026-05-01):** External third-party penetration testing is **V2**; **V1** relies on an **owner-conducted** exercise documented in [`docs/security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md`](../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md), aligned with [`docs/security/PENTEST_EXTERNAL_UI_CHECKLIST.md`](../security/PENTEST_EXTERNAL_UI_CHECKLIST.md) and [`docs/security/SYSTEM_THREAT_MODEL.md`](../security/SYSTEM_THREAT_MODEL.md). Target window **~2026-06-15**, after repeatable builds, UI stability, and reliable Azure deploy — see also [`QUALITY_ASSESSMENT_2026_05_01_INDEPENDENT_68_20.md`](../archive/assessments/QUALITY_ASSESSMENT_2026_05_01_INDEPENDENT_68_20.md) § *Pending Questions*.

**Owner bar (recorded for assessments):** Remediate **material** findings before calling the engagement complete; **do not** refresh public posture until **Critical** and **High** are cleared; **track** all security issues in-repo (findings table + PR links).

**What the coding agent can do (pick up in chat):**

1. **Runbooks & coverage** — Expand checklist-driven sessions from the docs above so testing is repeatable (auth, RBAC, RLS, injection classes, IDOR, session / CSRF-relevant UI flows).
2. **Negative cases from code** — Given a route, controller, or policy class, propose **edge cases** (headers, roles, tenant scope, stale tokens) consistent with implementation.
3. **CI artefacts** — Help interpret **OWASP ZAP** and **Schemathesis** output; separate false positives vs likely issues; suggest tracker wording at **high level** (no public exploit recipes unless you explicitly want them in a non-public artefact).
4. **Tracker hygiene** — Structure findings rows (severity, summary, owner, PR, retest) for [`2026-Q2-OWNER-CONDUCTED.md`](../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md).
5. **Posture text** — When retests are green, draft **stub → final** narrative that matches what was run and fixed and stays consistent with [`docs/go-to-market/TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md).

**Explicit limits:** The agent does **not** autonomously attack **archlucid.net** or Azure; **you** run tools in your environments and supply redacted logs or behaviour descriptions. This backlog item is **not** a substitute for a **V2** third-party report.

**Size estimate:** Ongoing — budget **30–60 min sessions** per surface or CI failure cluster; close the item when the 2026-Q2 owner tracker is complete and posture text is updated.

---

## TB-007 — LLM correctness boundary: three remaining gaps after 2026-05-01 session

**Context:** The quality assessment sessions identified the LLM correctness boundary as the highest engineering risk. Three gaps were documented and partially addressed. The items below require either owner decisions or operational prerequisites before they can be closed.

### Gap A — Promote cohort-real-llm-gate to a required PR status check

**Status:** Blocked on owner task. The Azure OpenAI deployment (archlucid-golden-cohort in eastus) must be provisioned and the GitHub protected-Environment secret (ARCHLUCID_GOLDEN_COHORT_AZURE_OPENAI_KEY or federated identity) injected before the gate can be promoted. See docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md § 2 and § 6 for the one-line promotion change and the stop-and-ask boundary.

**Prerequisite checklist (Improvement #20, Batch J):** Run **`.\scripts\ci\verify_real_mode_prereqs.ps1 -Profile GoldenCohortGate`** locally (names only). With GitHub CLI: **`-UseGitHubCli`**. Documented in **`docs/engineering/BUILD.md`** § *Real-mode LLM CI and golden cohort*.

**What to do (once deployment exists):**
1. Inject secret into the protected Environment per PENDING_QUESTIONS.md Q15.
2. Add cohort-real-llm-gate to the required status checks in the main branch protection rule.
3. Open a separate PR (not the same as the deployment PR) for the promotion.

### Gap B — Enable EnforceOnReject after product decision

**Status (2026-05-08):** **Closed for production-like hosts.** **`ArchLucid.Api/appsettings.Staging.json`** and **`appsettings.Production.json`** set **`ArchLucid:AgentOutput:QualityGate`** to **`Mode: PilotStrict`**, **`EnforceOnReject: true`**, **`BlockRunOnReject: true`**. **`AgentOutputEvaluationRecorder`** throws **`AgentOutputQualityGateRejectedException`** on reject; **`ArchitectureRunExecuteOrchestrator`** catches it when both flags are true, marks **`LegacyRunStatus`** **`ExecutionCompletedQualityRejected`**, emits baseline audit **`RunQualityGateRejected`**, and rethrows (**HTTP 409** from API problem-details handling). **`appsettings.Development.json`** keeps **`EnforceOnReject` / `BlockRunOnReject`** **`false`** for local usability. Coverage: **`ArchitectureRunExecuteOrchestratorQualityGateBlockingTests`**, **`AgentOutputQualityGateStagingAppsettingsTests`** (effective options from committed Staging JSON).

**Follow-up (optional):** If a **`appsettings.SaaS.json`** (or tenant-specific) profile needs a different posture, duplicate or slice the Staging block explicitly rather than relying on base **`appsettings.json`** (which omits the section and uses CLR defaults).

### Gap C — Eval corpus has no real-mode scenarios

**Status:** All three scenarios in `tests/eval-corpus/` have "mode": "simulator" in their qualityEvidence block. The eval_agent_corpus.py CI script runs against simulator agent result fixtures. There are no CI-run checks that assert on real-model finding quality against expected keyword patterns.

**Prerequisite checklist (Improvement #20, Batch J):** Same Azure OpenAI + cohort secrets as Gap A; Tier 2d live AOAI path documented in **`docs/engineering/BUILD.md`**. Verify names with **`.\scripts\ci\verify_real_mode_prereqs.ps1 -Profile All`**.

**What to do:**
1. Add at least one eval-corpus scenario with "mode": "real" and expectedFindings keyword checks meaningful for real model output.
2. Wire a nightly or post-deploy job that runs eval_agent_corpus.py against the real-mode API (similar to the golden cohort gate).
3. Gate this on the same ARCHLUCID_GOLDEN_COHORT_REAL_LLM variable and budget probe as the cohort gate.

**Affected areas:** `tests/eval-corpus/`, `scripts/ci/eval_agent_corpus.py`, `.github/workflows/golden-cohort-nightly.yml`.

**Size estimate:** Gap A ~1 h (operational, no code). Gap B — closed (see Gap B status above). Gap C ~4 h (scenario authoring + workflow wiring).

---

## TB-008 — Context ingestion connectors: Phases 3–4 after typed stages + orchestrator

**Status:** Phase 1 **shipped** (2026-05-04). Phase 2 **shipped** (2026-05-05): `IConnectorDescriptor` + `ConnectorDescriptor`; `IConnectorPipelineOrchestrator` implemented by `DefaultConnectorPipelineOrchestrator` (parallel fetch+normalize via `Task.WhenAll`, sequential `DeltaAsync` + `DeltaSummary` segments in `PipelineOrder`); `ContextConnectorPipeline.CreateOrderedConnectorDescriptors` is canonical; `CreateOrderedContextConnectorPipeline` projects connectors only; `ContextIngestionService` delegates stages to the orchestrator. DI registers `IReadOnlyList<IConnectorDescriptor>` and `IConnectorPipelineOrchestrator` in `RegisterContextIngestionAndKnowledgeGraph`.

**Deferred work (pick up in order):**

1. **Phase 3 — Meaningful delta + typed enrichers** — Introduce `IConnectorDeltaComputer` (shared default + optional per-connector overrides). Replace literal-string deltas where useful (e.g. set-diff on `SourceId`). Split `CanonicalInfrastructureEnricher` into per-`ObjectType` enrichers behind a composite.

2. **Phase 4 — Cross-connector coupling** — Resolve `PolicyReferenceConnector` / topology stable-ID duplication via a shared resolver service consumed by policy + topology stages so overlap logic is not replicated.

Optional later: per-connector fault isolation during parallel fetch+normalize (warnings vs abort entire ingest).

**References:** `docs/library/SYSTEM_MAP.md` (ingestion host path); `ArchLucid.ContextIngestion/Infrastructure/ContextConnectorPipeline.cs`; `ArchLucid.ContextIngestion/Services/DefaultConnectorPipelineOrchestrator.cs`; `ArchLucid.ContextIngestion/Services/ContextIngestionService.cs`.

**Size estimate:** Phase 3 ~4–8 h (delta semantics + enricher split + regression). Phase 4 ~2–4 h (extract shared topology resolution + tests).

---

## TB-013 — Documentation library audience reorganisation (remaining phases)

**Status:** **Phase 1 shipped** — subtrees **`docs/library/customer-facing/`** and **`docs/library/contributor-reference/`** plus README indexes; persona recipes canonical at [`customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md`](customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md); bookmark stub [`WORKFLOW_RECIPES_BY_PERSONA.md`](WORKFLOW_RECIPES_BY_PERSONA.md) under **`docs/library/`**.

**Objective**

Separate buyer-visible cookbook markdown from contributor-heavy internals **without** orphaning bookmarks (stub plus redirect pattern), **`dist/procurement-pack`**, **`archlucid-ui`** doc paths, or CI link assertions.

**Assumptions**

- Canonical URLs cited in **`API_CONTRACTS`**, Stripe, and procurement tooling must stay stable **or** be batch-updated atomically.

**Constraints**

- Doc scope headers on **every new** Markdown under **`docs/`** (CI **`scripts/ci/check_doc_scope_header.py`**).
- Navigator link assertions (**`scripts/ci/assert_start_here_links_valid.py`**) stay green after each batch move.

---

### Phase 2 (planned)

Batch-move lightly cross-linked evaluator docs (**`CONCEPTS_IN_5_MINUTES`**, **`FAQ`**, pilot-adjacent scaffolds) using **temporary stubs** matching Phase 1.

**Prepare:** script-assisted link rewrite; optional **`grep`** gate in CI forbidding new **`library/`** root drops without audience tagging.

---

### Phase 3 (planned — guarded)

Migrate widely linked references (**`GOVERNANCE`**, **`SECURITY`** operator sections, **`API_CONTRACTS`** only if coordinated with codegen, procurement manifest, and contextual-help URLs):

1. Freeze window for OpenAPI or client-rule changes affecting doc URLs.
2. Regenerate **`doc-index.json`** and procurement paths.
3. Repository-wide hyperlink smoke.

---

### Security model

**`customer-facing/`** prose stays SMB and credential-light (no raw secrets; no infra break-glass that belongs only under **`runbooks/`**).

### Operational considerations

Default new **`library/`** root files to **`contributor-reference/`** unless the author marks buyer scope in the doc header; link from **`customer-facing/README.md`** when appropriate.

**Related:** [`DOCUMENTATION_BY_AUDIENCE.md`](DOCUMENTATION_BY_AUDIENCE.md).

**Size estimate:** Phase 2 ~2–6 h (script plus stubs plus CI green). Phase 3 ~1–2 days (freeze, batch rewire, smoke).

---

## TB-014 — LLM token wallet (non-expiring auto-replenish)

**Progress (2026-05-10):** Operator path shipped — persistent bump column **`PurchasedCapBumpUsd`** on **`dbo.LlmMonthlyTenantBudgetState`** (migration **`155_LlmMonthlyTenantBudgetPurchasedCapBump.sql`**) + effective cap in **`LlmMonthlyTenantDollarBudgetTracker`**; runbook **[`LLM_BUDGET_TOP_UP.md`](LLM_BUDGET_TOP_UP.md)**; test hook **`InMemoryLlmTenantBudgetRepository.ApplyMonthlyPurchasedCapBumpAsync`**.

**Progress (2026-05-26):** **Shipped (Batch F)** — `221_LlmTenantWallet.sql`, `LlmTenantWalletService`, `StripeWalletGateway`, wallet webhook handling on existing Stripe route, `GET/PUT /v1/billing/wallet`, operator billing wallet panel, metrics, unit tests. Operator **`PurchasedCapBumpUsd`** path unchanged.

**Remaining follow-ons:** Stripe Elements card collection in UI (TEST uses manual `cus_`/`pm_` ids today); optional live-key flip per [`V1_DEFERRED.md`](V1_DEFERRED.md) §6b.

**Decision (operator, 2026-05-11):** **Greenlit in principle.** There is **no** target cost-per-run budget — runs are bounded by **`LlmMonthlyTenantDollarBudget`** + **`LlmTokenQuota`**, not by a per-run prompt-design ceiling. Tenants who legitimately exhaust their **`HardCutoffUsdPerUtcMonth`** before the UTC month rolls should be able to **buy more LLM headroom** self-serve, rather than waiting or contacting sales.

**Decision (operator, 2026-05-25):** **Wallet model (replaces month-scoped prepaid SKU).**

| Parameter | Value |
|-----------|-------|
| Refill increment | **$50** |
| Refill trigger | Balance **< $10** |
| Default at signup | **Overage off** (`MonthlyCapUsd = 0`) |
| Max auto-replenish cap | **$500 / UTC month** |
| Balance expiry | **Never** — carries forward indefinitely |
| Settlement | **Real-time** Stripe PaymentIntent per refill (no UTC month-end billing) |
| Cancellation | Balance is **non-refundable credit** |

**Objective**

Allow a paying tenant who has hit the effective monthly cap to continue real-mode LLM usage via a **prepaid wallet** without operator intervention. Default behaviour is unchanged for tenants that do not opt in.

**Assumptions**

- Tenant monthly budget still governs **included** envelope — see [`ArchLucid.Core/Configuration/LlmMonthlyTenantDollarBudgetOptions.cs`](../../ArchLucid.Core/Configuration/LlmMonthlyTenantDollarBudgetOptions.cs) and `LlmCompletionAccountingClient` enforcement.
- Wallet covers **overage only** — after effective cap would be exceeded, debit wallet; do not inflate **`PurchasedCapBumpUsd`** for self-serve purchases.
- Stripe **TEST** keys on staging (confirmed 2026-05-25); live keys flip per [`docs/library/V1_DEFERRED.md`](V1_DEFERRED.md) §6b.
- **Azure Marketplace plan-add-on** for wallet refills is **deferred** — ship Stripe-only self-serve for V1; Marketplace alignment when commerce un-holds.
- Audit + quota plumbing reuse existing **`LlmTenantMonthlyDollarBudgetApproaching`** / **`LlmTokenQuotaExceeded`** paths for hard stops when wallet is empty.
- Operator **`PurchasedCapBumpUsd`** SQL bump remains for sales-assisted grants (does not roll over month-to-month).

**Constraints**

- **Monthly budget row stays authoritative for included spend.** `dbo.LlmMonthlyTenantBudgetState` is still the single source of truth for warn/hard-cutoff within the UTC month (**INV-004**). The wallet is a **prepaid overage credit store**, not a second monthly spend ledger.
- **Idempotent Stripe webhook.** `payment_intent.succeeded` / `payment_intent.payment_failed` must be replay-safe via **`dbo.StripeWebhookIdempotency`** (or equivalent).
- **Real-time settlement.** Charge the card **at refill time** (when balance drops below **$10**), not at UTC month end — bounds unbilled exposure to one refill increment (~**$50**) per tenant.
- **No balance expiry.** Wallet balance **never** expires; rejects the earlier “use it or lose it within UTC month” draft.
- **Non-refundable on cancellation.** Document in **`PRICING_PHILOSOPHY`** and **`LLM_BUDGET_TOP_UP.md`** before shipping.
- **Audit.** `LlmWalletRefillSucceeded`, `LlmWalletRefillFailed` (or **`AuditEventTypes.Llm*`** family); metrics **`archlucid_llm_wallet_refill_usd_total`**, **`archlucid_llm_wallet_refill_failures_total`**, gauge **`archlucid_llm_wallet_balance_usd`**.
- **Surface.** `/settings/billing` wallet page + budget banner shows balance and cap; trial tenants disabled until conversion (per **`PRICING_PHILOSOPHY`** free-trial row).

**Architecture overview**

```mermaid
flowchart LR
  Acct[LlmCompletionAccountingClient] --> Cap{Within monthly<br/>effective cap?}
  Cap -->|yes| Allow[Allow LLM call]
  Cap -->|no| Wallet{Wallet balance<br/>≥ estimated cost?}
  Wallet -->|yes| Allow
  Allow --> Consume[Debit wallet post-call]
  Consume --> Low{Balance < $10?}
  Low -->|yes + auto-replenish| Stripe[Stripe PaymentIntent $50]
  Stripe -->|success| Credit[Credit wallet + ledger]
  Wallet -->|no| Block[LlmTokenQuotaExceeded / 402]
  UI[/settings/billing] --> Config[MonthlyCapUsd + card]
  Config --> Stripe
```

**Component breakdown**

- **`dbo.LlmTenantWalletState`** — balance, auto-replenish flag, refill increment/trigger defaults, monthly cap, UTC-month refill counter, Stripe customer/payment-method refs.
- **`dbo.LlmTenantWalletLedger`** — append-only **`Refill` | `Consume` | `OperatorAdjustment`** with **`BalanceAfterUsd`**, optional **`StripePaymentIntentId`**.
- **`LlmTenantWalletService`** — `GetBalanceAsync`, `ConsumeAsync`, `TryAutoRefillAsync` (cap + threshold checks).
- **`IStripeWalletGateway`** — Stripe.net PaymentIntent; config **`Billing:Stripe:SecretKey`**.
- **`LlmCompletionAccountingClient`** — after monthly cap check fails, consult wallet; queue consume + optional refill via background task.
- **`WalletController`** — `GET/PUT /v1/billing/wallet`, `POST /v1/billing/stripe/webhook`.
- **UI** — balance, cap slider (**$0–$500**, step **$50**), auto-replenish toggle, Stripe Elements.

**Out of scope for this item**

- Azure Marketplace wallet SKU (follow-on at commerce un-hold).
- Replacing per-tier **`LlmMonthlyTenantDollarBudget`** defaults — wallet is **additive overage**, not a tier change.
- Per-run dollar ceilings (explicitly rejected).
- Refunding wallet balance on tenant cancellation.

**Security model**

Wallet config requires **`Admin`** (same as billing today). Webhook validates Stripe signature and tenant binding. Payment method stored as Stripe **`PaymentMethodId`** only — no raw PAN in ArchLucid SQL.

**Operational considerations**

- Reconciliation: Stripe PaymentIntents ↔ **`LlmTenantWalletLedger`** **`Refill`** rows; nightly script once volume justifies it.
- Support: operator **`OperatorAdjustment`** ledger entries for goodwill credits; no automatic refund path in V1.

**Refs:**
- [`ArchLucid.Core/Configuration/LlmMonthlyTenantDollarBudgetOptions.cs`](../../ArchLucid.Core/Configuration/LlmMonthlyTenantDollarBudgetOptions.cs)
- [`docs/library/LLM_BUDGET_TOP_UP.md`](LLM_BUDGET_TOP_UP.md)
- [`docs/go-to-market/PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md)
- [`docs/go-to-market/STRIPE_CHECKOUT.md`](../go-to-market/STRIPE_CHECKOUT.md)
- [`docs/library/ARCHITECTURE_INVARIANTS.md`](ARCHITECTURE_INVARIANTS.md) (**INV-004** budget coherence)
- [`docs/library/V1_DEFERRED.md`](V1_DEFERRED.md) §6b (commerce un-hold sequencing)
- [`docs/OPERATIONS_LLM_QUOTA.md`](../OPERATIONS_LLM_QUOTA.md)
- [`docs/assessments/LATEST.md`](../assessments/LATEST.md) — Improvement **#27** (implementation prompt)

**Size estimate:** **M** — ~1–2 days end-to-end (wallet tables + service + Stripe gateway + webhook + UI + metrics + tests + doc sync). Gating piece is **`LlmCompletionAccountingClient`** wallet fallback path.

---

## TB-015 — Per-agent/per-invoke-kind LLM token dimensions + CI export

**Decision (operator, 2026-05-11):** There is **no** credible empirical answer for average prompt/completion tokens **per AgentType** (Topology / Cost / Compliance / Critic) in real mode **until telemetry captures it.** Today:

- **`LlmCompletionAccountingClient`** aggregates **`ArchLucidInstrumentation.LlmPromptTokensTotal`** / **`LlmCompletionTokensTotal`** (**`MeterName`** = **`ArchLucid`**) — optional tags are **`tenant_id`**, **`llm_provider`**, **`llm_deployment`** via **`RecordLlmTokenUsage`** only — **`not`** `agent_type` or invoke role.
- **`LlmTelemetryLabelOptions.ProviderId`** is **globally** set to **`azure-openai`** in composition (`ConfigureLlmTelemetryLabels`), **not** per handler.
- OTel **`Activity`** **does** tag the agent handler (**`AgentHandler`**): **`archlucid.agent.type_enum`** (**`RealAgentExecutor`** line ~362), and **`AzureOpenAiCompletionClient`** tags **`AgentLlmCompletion`** spans with **`gen_ai.usage.*`** — downstream Azure Monitor / Application Insights traces can correlate **when** exporters are wired, but Prometheus counters are **flat** unless we add dimensions.

Until **TB-015** ships, “averages without a live deployment” mean **estimated** bounds (**`AgentExecutionCostPreviewController`** + **`PER_TENANT_COST_MODEL.md`**), **not measured** envelopes.

---

### Phase A — Bounded dimensions on token counters/histogram

**Objective:** Extend `RecordLlmTokenUsage` (or add **replacement** sibling instruments beside the existing totals so legacy dashboards unchanged) so every AOAI invoke records low-cardinality labels:

| Label | Intended values |
|-------|----------------|
| **`archlucid.llm.consume_role`** (`consumer` for short in code) | `Topology`, `Cost`, `Compliance`, `Critic` for **primary** agent JSON completions. |
| **`archlucid.llm.invoke_kind`** | `Primary` (**main** structured output), `SemanticJudge` (`AgentOutputLlmSemanticJudge`; Topology+Critic paths), `Explanation` / **`Ask`** (non-agent surfaces), **`Unknown`** fallback. |

**Propagation strategy (recommended):**

1. **`AsyncLocal<LlmAccountingInvocationScope>`** (new small struct): `{ AgentType? AgentKind; InvokeKind Invoke }` scoped with `using` in **`RealAgentExecutor`** around handler body (mirrors **`Activity`** tag).
2. **`AgentOutputLlmSemanticJudge`** sets scope to **`SemanticJudge`** (parent **`AgentType`** still Topology or Critic) **before** `CompleteJsonAsync`.
3. **`ExplanationService`** / Ask paths set **`InvokeKind`** to `Explanation`/`Ask` and **`Unknown`** **`AgentKind`** unless a stable mapping exists later.
4. **`LlmCompletionAccountingClient`** **`finally`** block reads **`AsyncLocal`**, clamps labels to enums, feeds **`RecordLlmTokenUsage`**.

**Histogram vs counter:** Prefer **adding** **`Histogram<long>`** (`archlucid.llm.completion_tokens`) with the same bounded tags plus **distribution** queries (percentiles); keep **additive counters** so existing golden-cohort Grafana tiles keep working → **dual emit** counters + histogram for Phase A if cost is negligible (one AOAI invoke = one histogram point).

---

### Phase B — Unit + integration tests without Azure

**Unit:** `MeterListener` on **`ArchLucid`** `Meter`; fake completion client emits usage; assert tags per handler path (**echo**/`FakeAgentCompletionClient` pipeline suffices).

**Integration (optional smoke):** `WebApplicationFactory` + echo mode proves tags survive the full **`IAgentCompletionClient`** decorator chain (accounting → cache → cost guardrail).

---

### Phase C — Capture in CI (`golden-cohort` + optional nightly)

**When real AOAI is available:**

1. After **`golden-cohort drift --strict-real`** (**`.github/workflows/golden-cohort-nightly.yml`** → **`cohort-real-llm-live`**) scrape **`GET /metrics`** **if** the API host exposes Prometheus (**`Observability:Prometheus:Enabled`** for that environment), **or** export OTLP traces to a temp sink and sum **`gen_ai.usage.*`** by correlated **`archlucid.agent.type_enum`** (**more fragile — prefer Prometheus parse**).
2. Check in **`scripts/ci/aggregate_llm_token_metrics.py`** (new): parse text exposition format; aggregate **per-consumer / per-invoke_kind** deltas for the workflow window; emit **`golden-cohort-llm-token-report.md`** GH Actions artifact (+ optional **`tests/golden-cohort/telemetry-snapshots/last-real-run-tokens.sample.json`** for doc examples — **never** commit secrets).

**Frequency:** Weekly live job is sufficient for trend; rerun when **`MaxCompletionTokens`**, prompts, or model SKU changes.

---

### Phase D — Product doc + estimator alignment

Roll forward measured **p50 / p95** ranges into **`docs/library/PER_TENANT_COST_MODEL.md`** (“measured cohort 2026-…”) distinct from **`GET /v1/agent-execution/cost-preview`** hypothetical bounds — until then, **`cost-preview`** remains explicitly **estimated**.

**Refs:**
- [`ArchLucid.AgentRuntime/LlmCompletionAccountingClient.cs`](../../ArchLucid.AgentRuntime/LlmCompletionAccountingClient.cs)
- [`ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs`](../../ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs)
- [`ArchLucid.AgentRuntime/RealAgentExecutor.cs`](../../ArchLucid.AgentRuntime/RealAgentExecutor.cs) (**`AgentHandler`** span tagging)
- [`ArchLucid.AgentRuntime/AzureOpenAiCompletionClient.cs`](../../ArchLucid.AgentRuntime/AzureOpenAiCompletionClient.cs)
- [`ArchLucid.Api/Controllers/AgentExecution/AgentExecutionCostPreviewController.cs`](../../ArchLucid.Api/Controllers/AgentExecution/AgentExecutionCostPreviewController.cs)
- [`docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md)

**Security / cardinality**

- Labels are **literal enums** bounded to **Architecture agent types × invoke kinds**, not free text or tenant-derived strings (tenant stays on **`RecordPerTenantTokens`** paths only).

**Size estimate:** **M** — ~2–4 eng days (**Phase A+B** dominating C); **Phase C** is ops + scripting once metrics exist.

---

## TB-016 — ITSM + Slack vendor sandbox accounts (provision + secrets + inbound URLs)

**Status (operator question, resolved for scope 2026-05-11):** The repo **does not** ship tenant credentials or long-lived sandbox URLs — **those are operator-owned**. Free / trial programs exist for **Jira Cloud**, **ServiceNow Developer instances**, **Confluence Cloud**, and **Slack developer workspaces**. Use **separate pilot projects / spaces / channels** away from production knowledge bases — never reuse brittle automation credentials against prod SOX systems.

Cross-check posture with **`docs/go-to-market/INTEGRATION_CATALOG.md`** and **`CONNECTOR_READINESS_MATRIX.md`** after first successful smoke; pair procedural steps with **`docs/integrations/smoke/CONNECTOR_SMOKE_*.md`**. **Scaffold:** [`docs/runbooks/ITSM_LIVE_SMOKE_SCAFFOLD.md`](../runbooks/ITSM_LIVE_SMOKE_SCAFFOLD.md) (workflow + secret naming convention).
Recurrence aligns with **`ArchLucid_Assessment_Weighted_Readiness_2026_05_10`** — Improvement 8 (**scheduled + `workflow_dispatch`**, not one-off).

---

### A. Jira Cloud (outbound + optional inbound webhook)

**Provision**

1. Create or claim an **[Atlassian Cloud](https://www.atlassian.com/try/cloud)** site (trial suffices).
2. Enable **Jira**; create a **pilot project** — note **`project key`**.

**Outbound auth ArchLucid expects (MVP)** — **`ArchLucid.Core/Configuration/IntegrationsItsmOutboundOptions.cs`** (**`Integrations:ItsmOutbound:Jira`**):

| Binding | Contents |
|---------|----------|
| `CloudBaseUrl` | **`https://{site}.atlassian.net`** (no trailing slash) |
| `ServiceAccountEmail` | Atlassian-account email |
| `ApiToken` | **Profile → Security → API tokens** (Key Vault / deploy secret — **never git**) |
| `DefaultProjectKey` | Fallback when tenant SQL override empty |

**Inbound**

- **`Integrations:ItsmInbound:JiraWebhookSecret`**; vendor POST validates shared header — **`ItsmInboundWebhooksController`**, **`docs/integrations/smoke/CONNECTOR_SMOKE_JIRA.md`**.
- Jira **Automation** → **`POST`** your API **`…/integrations/webhooks/jira`** (staging hostname or authenticated tunnel).

---

### B. ServiceNow (personal developer instance → Table API)

**Provision**

1. **[ServiceNow Developer Program](https://developer.servicenow.com/)** portal → **Request / open Personal Developer Instance** → record **`InstanceBaseUrl`** (instances may sleep unless kept warm).
2. Integration user + **`incident`** Table API create (+ CMDB reads if testing **`cmdb_ci`** paths).

**Outbound** — **`Integrations:ItsmOutbound:ServiceNow`**: **`InstanceBaseUrl`**, **`Username`**, **`Password`** (basic auth MVP).

**Inbound** — **`Integrations:ItsmInbound:ServiceNowWebhookSecret`** + **`CONNECTOR_SMOKE_SERVICENOW.md`** business-rule HTTP.

Developer instances reset / sleep — cron smoke should **`continue-on-error`** with clear stderr when unreachable.

---

### C. Confluence Cloud (typically same Atlassian site as Jira)

**Publishing** — **`ArchLucid.Core/Configuration/ConfluencePublishingOptions.cs`** (**`Integrations:ConfluencePublishing`**): **`Enabled`**, **`CloudBaseUrl`**, **`SpaceKey`**, **`ServiceAccountEmail`**, **`ApiToken`** (Basic + Cloud token until OAuth ships per catalog).

**OAuth follow-on:** **`INTEGRATION_CATALOG.md`** — MVP is Basic.

Smoke: **`docs/integrations/smoke/CONNECTOR_SMOKE_CONFLUENCE.md`** (caller needs **AdminAuthority**).

---

### D. Slack (incoming webhook workspace)

**Provision**

1. **[Slack workspace](https://slack.com/get-started#create)** dedicated to integrations smoke (recommended) or sanctioned corp sandbox.
2. **Incoming Webhooks** Slack app installation → **`#integrations-smoke`**.

**Auth model** — store webhook URL as **opaque secret** (GitHub Action secret `SLACK_INCOMING_WEBHOOK_URL`); bind to **`SlackWebhook`** **`AlertRoutingSubscription`** / digest route per **`CONNECTOR_SMOKE_SLACK.md`** (SQL **`destination`** is sensitive — tighten operator RBAC).

Probe **`POST /v1/integrations/webhooks/{routingSubscriptionId}/test`**.

---

### E. Operational checklist

**Suggested secret inventory (names only — values never committed)**

- `ATLASSIAN_SITE_EMAIL`, `ATLASSIAN_JIRA_API_TOKEN`, `JIRA_CLOUD_BASE_URL`, `JIRA_PILOT_PROJECT_KEY`
- `SERVICENOW_INSTANCE_URL`, `SERVICENOW_USERNAME`, `SERVICENOW_PASSWORD`
- `ATLASSIAN_CONFLUENCE_API_TOKEN` (may reuse Jira token), `CONFLUENCE_CLOUD_BASE_URL`, `CONFLUENCE_SPACE_KEY`
- `SLACK_INCOMING_WEBHOOK_URL`, `ITSM_JIRA_WEBHOOK_SHARED_SECRET`, `ITSM_SERVICENOW_WEBHOOK_SHARED_SECRET`

Map into host **`Azure Key Vault`** / GitHub Actions **staging environment** (`Integrations:ItsmOutbound`, `Integrations:ItsmInbound`, `Integrations:ConfluencePublishing`) — authoritative key list **`docs/library/CONFIGURATION_REFERENCE.md`**.

After each smoke wave, update **`docs/library/CONNECTOR_READINESS_MATRIX.md`** (**Validated yyyy-mm-dd**).

**Size estimate:** **S** first provision + manual smoke (**~0.5 day** vendor-admin time); **M** if attaching to **fully automated** recurring CI with secret rotation SOP (**split TB if needed**).

---

## TB-017 — Trial orphaned-catalog teardown deferral + SOP

**Decision (operator, 2026-05-11):** Aggressive **unattended** Azure SQL/catalog teardown **is not urgent** while signup volume stays modest — **idle dormant trials incur negligible AOAI**. Platform admins delete **`TenantDatabaseBindings`** / catalogs **manually** with low friction ([`TENANT_DATABASE_TOPOLOGY.md`](TENANT_DATABASE_TOPOLOGY.md)). Product lifecycle (**[`docs/runbooks/TRIAL_LIFECYCLE.md`](../runbooks/TRIAL_LIFECYCLE.md)**) may advance statuses while infra follows an admin cadence. **Resolved (operator, 2026-05-12):** Prospect **trial** volume does **not** warrant a gated **Azure subscription cost commitment** milestone — escalate pool SKU **only** when **traffic**/cardinality (not dormant headcount guesses) dictates.

**What to ship before scale**

1. Typed **manual teardown runbook** (Azure Portal / Terraform teardown order, Key Vault detach, **`dbo.Tenants`** / binding cleanup order) referencing **`TrialLifecycleSchedulerHostedService`** behaviour so ops does not orphan metadata.
2. Metric / ops query: dormant trials by phase + **`TenantDatabaseBindings`** state — alert when elasticity pool SKU pressure climbs.
3. Revisit unattended **`SqlTenantHardPurgeService`** throughput + **`PurgeAfterExportOnlyDays`** tightening when cardinality threshold hits (candidate: **>** N dormant catalogs per pool per FinOps spreadsheet).

**Refs:** [`docs/go-to-market/TRIAL_AND_SIGNUP.md`](../go-to-market/TRIAL_AND_SIGNUP.md) §4, [`docs/runbooks/TRIAL_LIFECYCLE.md`](../runbooks/TRIAL_LIFECYCLE.md).

---

## TB-018 — Warm tenant catalogs in elastic pool (signup latency)

**Context:** Hosted **`SystemWithPerTenantCatalogs`** signup currently runs **`SqlTenantSqlCatalogProvisioner.ProvisionTenantCatalogAsync`** which **always executes** **`DatabaseMigrator.RunTenant`** before mirroring **`dbo.Tenants`**. Migrating hundreds of migrations on-demand adds seconds to tens of seconds under load — acceptable at low signup rate, poor for bursts.

**Target behavior**

1. **Terraform/IaC** — configure **warm pool depth** (**N**) of empty product catalogs attached to an **elastic pool** (reuse existing pool per environment or dedicated small pool — FinOps spreadsheet).
2. **Replenish worker** (or provisioning job subsystem) keeps **TenantDatabaseProvisioningJobs / binding records** pointing at sentinel warm logical names OR a side table keyed by **`archlucid_warm_*`** until claimed.
3. **Claim:** On signup, dequeue warm DB → **`UpsertPending` / MarkActive fast path**: **skip RunTenant when schema stamp matches deployed version** → **`MirrorTenantRowFromSystemAsync`** → **`MarkActive`**; optional **`ALTER DATABASE … MODIFY NAME`** to canonical **`TenantDatabaseNaming`** form.
4. **Post-claim** — enqueue replenish to restore **N**.

**Safety / correctness**

- No resolver cache until **`MarkActive`**; invalidate after claim (**`InvalidateCachedTenantConnectionString`** already exists).
- Orphan warm DB teardown if tenant insert fails mid-claim → align with **`TB-017`** teardown SOP.
- Pool capacity alert when **warm depth &lt; threshold** — avoid empty pool at peak signup.

**Refs:** [`docs/library/TENANT_DATABASE_TOPOLOGY.md`](TENANT_DATABASE_TOPOLOGY.md) Operational notes (**Signup latency: warm catalogs in elastic pools**); [`ArchLucid.Persistence/Tenancy/SqlTenantSqlCatalogProvisioner.cs`](../../ArchLucid.Persistence/Tenancy/SqlTenantSqlCatalogProvisioner.cs).

---

## TB-019 — Signup marketing attribution + server-side conversion

**Context:** Paid and disciplined organic spend need **trial-created** truth, not impressions. [`docs/go-to-market/SEO_AND_PAID_ACQUISITION.md`](../go-to-market/SEO_AND_PAID_ACQUISITION.md) section 6 requires UTM-stable funnel + server confirmation. Today signup may drop query params between **`/signup`** and **`TenantProvisioningService`** without persisted first-touch.

**What to ship**

1. **Capture** normalized first-touch attribution on marketing entry (**`utm_source`**, **`utm_medium`**, **`utm_campaign`**, **`utm_content`**, optional **`utm_term`**) — **`httpOnly`**, **`Secure`**, **`SameSite=Lax`** cookie or equivalent first-party KV with short TTL (**≤ 90 days**) and sanitization (**max lengths**, strip PII-ish junk).
2. **Propagate** into the signup API boundary (authenticated provisioning unchanged; anonymous trial signup is the MVP scope). If the signup flow spans **`archlucid-ui` → `/v1/...`** only, threading may be **`x-archlucid-first-touch`** header derived from cookie server-side — choose one transport, document in **`PUBLIC_MARKETING_SITE_TOPOLOGY.md`** or API notes alongside OpenAPI-touching edits per **`docs/library/API_CONTRACTS.md`** if request DTO grows.
3. **Persist durability** optional but recommended: **`dbo.TenantMarketingAttribution`** (or widen **`AuditEvents`** with typed payload) keyed by **`TenantId`** + **`CapturedUtc`** with **immutable insert** — supports SQL cohort reports without exploding OTel label cardinality.
4. **Telemetry** — increment **low-cardinality** counters/histogram **after provision succeeds end-to-end** (tenant row **and** tenant catalog **`Active`** if per-tenant mode). Example coarse buckets: **`attribution.medium`** ∈ **`{organic, paid_direct, referral, unknown}`**, **`attribution.platform`** ∈ **`{linkedin, google, bing, internal, unknown}`** (map from raw **`utm_*`** in fixed code tables). **Never** attach raw **`utm_campaign`** strings to Prometheus-style metrics — keep raw values in SQL/Audit only.

**Safety / correctness**

- **Privacy / consent** — first-party technical attribution should stay documented in **`PRIVACY_POLICY.md`** companion change when semantics ship (legal owns final wording — especially EU traffic).
- **Idempotency** — first-touch wins; ignore naive rewrite spikes except telemetry alerts.
- **Tests** — unit map raw UTM tuples → coarse buckets + integration asserting provision path emits conversion once only.

**Refs:** [`TenantProvisioningService`](../../ArchLucid.Application/Tenancy/TenantProvisioningService.cs); [`SEO_AND_PAID_ACQUISITION.md`](../go-to-market/SEO_AND_PAID_ACQUISITION.md); [`PUBLIC_MARKETING_SITE_TOPOLOGY.md`](PUBLIC_MARKETING_SITE_TOPOLOGY.md).

---

## TB-020 — Public marketing structured data + consent-gated third-party analytics

**Context:** Honest **`JSON-LD`** lifts SERP/discernment without fabricated review stars; third-party replay widens CSP and may demand consent banners for EU-heavy traffic.

**Status (2026-05-10):** **`JSON-LD`** — `SoftwareApplication` on `(marketing)` + **`FAQPage`** on **`/trust`** (`TrustCenterFaqJsonLd`). **Microsoft Clarity** — consent banner + loader; CSP allows `https://www.clarity.ms` + Bing pixel host; **`PRIVACY_POLICY.md`** updated (§2.4). **Config:** `NEXT_PUBLIC_ARCHLUCID_CLARITY_PROJECT_ID` in **`archlucid-ui/.env.example`**. **Remaining:** DPIA text for EU-heavy traffic if legal requests; optional CONFIGURATION_REFERENCE row if ops wants server-side kill-switch mirror.

**What to ship**

1. **`JSON-LD`** — inject **`@type: SoftwareApplication`** (and minimal **`publisher`**) from **`(marketing)`** shells with narrative aligned **`POSITIONING.md`** — **never** mint **`aggregateRating`** / **`reviewCount`** unless tied to audited real survey data. *(Done for marketing shell.)*
2. **FAQ blocks only where copy supports them** — e.g. discrete Q/A on **`/compliance-journey`** or **`/trust`** excerpts; reject spam-tier FAQ schema stuffing. *(Partial: factual **`FAQPage`** on **`/trust`**.)*
3. **Analytics gated** — optional **Microsoft Clarity** (or chosen vendor) activates only when (**a**) optional server kill-switch (exact subtree TBD **`docs/library/CONFIGURATION_REFERENCE.md`**) and (**b**) client consent UX exists where jurisdictions require opt-in (**`(marketing)`** subtree only until a separate DPIA says otherwise for logged-in shells). *(Partial: consent + `NEXT_PUBLIC_ARCHLUCID_CLARITY_PROJECT_ID`.)*
4. **CSP** — extend **`archlucid-ui/next.config.ts`** **`script-src`** / **`connect-src`** minimally per vendor subdomain allowlist + changelog entry in **`PRIVACY_POLICY.md`** noting active vendors. *(Done for Clarity + Bing image host used by Clarity.)*

**Size estimate:** **S** JSON-LD alone (**~half day eng + positioning copy QA**); **M** packaged with consent UX + DPIA-aligned Clarity.

**Refs:** [`archlucid-ui/next.config.ts`](../../archlucid-ui/next.config.ts); [`archlucid-ui/src/app/(marketing)/layout.tsx`](../../archlucid-ui/src/app/(marketing)/layout.tsx); [`SEO_AND_PAID_ACQUISITION.md`](../go-to-market/SEO_AND_PAID_ACQUISITION.md).

---

## TB-021 — RAG quality program — V1 foundation

**Decision (engineering, 2026-05-23):** **Greenlit in principle** — RAG infrastructure already ships (`ArchLucid.Retrieval`, `AskService` retrieval, ADR 0004 outbox, ADR 0005 LLM pipeline). V1 work **extends** that stack to raise agent **faithfulness** and **citation density** without new vector stores or agentic multi-hop retrieval.

**Authoritative task breakdown:** [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](RAG_QUALITY_TECHNICAL_BACKLOG.md) — stable sub-IDs **RAG-V1-000** through **RAG-V1-011**.

**First implementation slice (approved design):** [`RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md`](RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md) — implement **RAG-V1-000 partial** + **RAG-V1-001** as one PR (~3–5 eng days). Remaining **RAG-V1-000** items (`RetrievalGroundingTrace`, citation formatter, architecture test) follow in a second PR.

**Why assessments should schedule this:** Directly targets **AI/Agent Readiness**, compliance finding honesty, cost citation contract ([`V1_SCOPE.md`](V1_SCOPE.md) §2.16), and Ask grounded answers — not net-new product surfaces.

**Recommended pick-up order**

| Sub-ID | Title | Size | Design |
|--------|-------|------|--------|
| **RAG-V1-000** (partial) + **RAG-V1-001** | `CorpusKind` seam + policy-pack indexer + compliance retrieval | S–M | [`RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md`](RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md) |
| **RAG-V1-005** | Faithfulness eval harness + citation coverage CI | M | Backlog only — output-side; IR metrics → **RAG-V1-011** |
| **RAG-V1-006** | `RetrievalGroundingTrace` forensic enrichment — **TB-038** | S–M | [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](RAG_QUALITY_TECHNICAL_BACKLOG.md) §RAG-V1-006 |
| **RAG-V1-010** | Tenancy isolation hardening — **TB-048** | S | Retrieval audit 2026-05-26 — P0 security |
| **RAG-V1-007** | Embedding model drift guard — **TB-045** | S–M | Retrieval audit 2026-05-26 |
| **RAG-V1-011** | Retrieval IR eval (recall@k, MRR) — **TB-049** | Done (Batch E, 2026-05-26) | Retrieval audit 2026-05-26 — P0 correctness |
| **RAG-V1-008** | Index freshness + ContentHash skip — **TB-046** | S–M | Retrieval audit 2026-05-26 |
| **RAG-V1-009** | Chunking strategy fingerprint — **TB-047** | S | Retrieval audit 2026-05-26 |

**Hard constraints (summary)**

- Deterministic rules still fire in code — RAG enriches narrative only.
- Retrieved chunks are **prompt context** — excluded from manifest canonical fingerprint unless a future ADR adds snapshotting.
- Tenant-bound corpora: mandatory scope filters on index and query.
- Cross-tenant text RAG is **out of scope** — see ADR 0031 for k-anon aggregates only.

**V1.1 / V2 follow-ons:** **RAG-V1.1-*** and **RAG-V2-*** live in [`V1_DEFERRED.md`](V1_DEFERRED.md) §6q — not `(A)` V1 GA obligations.

**Refs:** [ADR 0004](../architecture/adrs/0004-transactional-outbox-retrieval-indexing.md); [ADR 0005](../architecture/adrs/0005-llm-completion-pipeline.md); [`RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md`](RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md); [`AI_LEVERAGE_ROADMAP.md`](AI_LEVERAGE_ROADMAP.md) (#3, #11); [`authoring-prompts/PACK_CONTEXTS.md`](authoring-prompts/PACK_CONTEXTS.md) AI-05.

**Size estimate:** **M–L** phased — ~2–3 weeks eng if executed sequentially; **first slice** (`RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md`) is ~3–5 eng days.

---

## TB-022 — `LlmCostEstimator` — `int` overflow in aggregator token-count fields — **Done (Improvement #19, 2026-05-25)**

**Shipped:** `AgentExecutionTraceRunLlmCostAggregator` and `AgentExecutionTraceRunLlmCostSummary` use `long` token totals; `RunLlmTokenCountsResponse` uses `long`; overflow regression test in `AgentExecutionTraceRunLlmCostAggregatorTests`.

<details>
<summary>Original spec (archived)</summary>

**Source:** Cost estimator audit-grade correctness review (2026-05-24).

**Problem:** `AgentExecutionTraceRunLlmCostAggregator.Compute` accumulates token totals into `int` locals and returns them via `AgentExecutionTraceRunLlmCostSummary` record fields also typed `int`:

```csharp
// AgentExecutionTraceRunLlmCostAggregator.cs
int promptSum = 0;
int completionSum = 0;
// ...
promptSum += inTok;   // overflows at int.MaxValue ≈ 2.1 B tokens
completionSum += outTok;

// AgentExecutionTraceRunLlmCostSummary record
public sealed record AgentExecutionTraceRunLlmCostSummary(
    decimal? EstimatedCostUsd,
    int PromptTokens,    // silently wraps on overflow
    int CompletionTokens,
    string ModelLabel);
```

`int.MaxValue` is 2,147,483,647 (~2.1 B). A run with 500 traces averaging 5 M input tokens each reaches 2.5 B tokens and overflows silently, corrupting the token counts returned to the API response and OTel instrumentation. The `decimal costAccum` is unaffected and produces a correct cost estimate. Only the displayed totals corrupt.

**What to do:**

1. Change `promptSum` and `completionSum` locals to `long` in `AgentExecutionTraceRunLlmCostAggregator.Compute`.
2. Change `PromptTokens` and `CompletionTokens` on `AgentExecutionTraceRunLlmCostSummary` to `long`.
3. Update `RunLlmTokenCountsResponse` fields (`Prompt`, `Completion`) and any callers that downcast to `int` — check `RunAgentExecutionLlmCostEstimateAppender` and any frontend DTO mapping.
4. Update `AgentExecutionTraceRunLlmCostAggregatorTests` with assertions that would have caught the overflow (e.g. token counts > `int.MaxValue` across multiple traces — or at minimum add a comment warning for future large-scale tests).

**Affected files:**
- [`ArchLucid.Application/Agents/AgentExecutionTraceRunLlmCostAggregator.cs`](../../ArchLucid.Application/Agents/AgentExecutionTraceRunLlmCostAggregator.cs)
- [`ArchLucid.Api/Support/RunAgentExecutionLlmCostEstimateAppender.cs`](../../ArchLucid.Api/Support/RunAgentExecutionLlmCostEstimateAppender.cs)
- [`ArchLucid.Api/Models/RunAgentLlmCostEstimateResponse.cs`](../../ArchLucid.Api/Models/RunAgentLlmCostEstimateResponse.cs) (if `Prompt`/`Completion` fields are `int`)
- [`ArchLucid.Application.Tests/Agents/AgentExecutionTraceRunLlmCostAggregatorTests.cs`](../../ArchLucid.Application.Tests/Agents/AgentExecutionTraceRunLlmCostAggregatorTests.cs)

**Size estimate:** **XS** — ~30 min mechanical change + test annotation.

</details>

---

## TB-026 — `LlmCostEstimator` — negative-rate guard on `LlmDeploymentUsdRates` — **Done (Improvement #19, 2026-05-25)**

**Shipped:** `LlmCostEstimationOptionsValidator` + `ValidateOnStart`; `LlmCostEstimationEffectiveRates.TryResolve` returns false for negative effective rates (including SQL override path); tests in Core + AgentRuntime.

<details>
<summary>Original spec (archived)</summary>

**Source:** Cost estimator audit-grade correctness review (2026-05-24).

**Problem:** `LlmCostEstimator.EstimateUsd` uses `> 0m` to decide whether a configured deployment rate overrides the global rate:

```csharp
if (dep.InputUsdPerMillionTokens > 0m)
    inputRate = dep.InputUsdPerMillionTokens;
```

This silently applies a negative rate (e.g. from a typo in `appsettings.json`) because negative values pass the `> 0m` test and replace the previously correct positive rate. The result is a negative cost slice that corrupts the `AgentExecutionTraceRunLlmCostSummary.EstimatedCostUsd` aggregate for that run.

The `LlmCostTuningRequestValidator` correctly rejects negative values on the admin API path, but static `appsettings.json` / environment variable configuration has no equivalent guard.

**What to do:**

1. Add `[Range(0.0, (double)LlmCostTuningRequestValidator.MaxUsdPerMillionTokens)]` (or equivalent `decimal`-compatible annotation) to `LlmDeploymentUsdRates.InputUsdPerMillionTokens`, `OutputUsdPerMillionTokens`, and `ReasoningUsdPerMillionTokens`.
2. If `DataAnnotations` range validation is already wired for `LlmCostEstimationOptions` at startup (via `ValidateDataAnnotations()`), confirm the `Deployments` dictionary values are also validated — dictionary-value validation is not automatic in `Microsoft.Extensions.Options` and may require a custom `IValidateOptions<LlmCostEstimationOptions>`.
3. Add a startup advisory warning (reuse `ArchLucidInstrumentation.RecordStartupConfigWarning`) if any configured rate is negative, as a belt-and-suspenders fallback even before the `Options` validation path catches it.
4. Add a unit test asserting that a negative deployment rate either throws at options-validation time or is ignored in favor of the global rate (pick one and document the choice).

**Affected files:**
- [`ArchLucid.Core/Configuration/LlmDeploymentUsdRates.cs`](../../ArchLucid.Core/Configuration/LlmDeploymentUsdRates.cs)
- [`ArchLucid.Core/Configuration/LlmCostEstimationOptions.cs`](../../ArchLucid.Core/Configuration/LlmCostEstimationOptions.cs) (IValidateOptions wiring if not present)
- [`ArchLucid.AgentRuntime.Tests/LlmCostEstimatorTests.cs`](../../ArchLucid.AgentRuntime.Tests/LlmCostEstimatorTests.cs)

**Size estimate:** **XS** — ~1 h including annotation, IValidateOptions check, and test.

</details>

---

## TB-024 — `LlmCostEstimator` — reasoning-token test coverage

**Status:** **Done** (Improvement **#20**, 2026-05-25) — explicit reasoning rate, output-rate fallback, per-deployment reasoning override, persisted override + reasoning fallback, and OTel `archlucid_llm_cost_usd_total` alignment covered in **`LlmCostEstimatorTests`**.

**Source:** Cost estimator audit-grade correctness review (2026-05-24).

**Problem:** All existing `LlmCostEstimatorTests` passed `reasoningTokens = 0` (implicitly, via the default parameter). The following paths were untested:

- Reasoning tokens billed at the explicit `ReasoningUsdPerMillionTokens` rate.
- Reasoning tokens falling back to `outputRate` when `ReasoningUsdPerMillionTokens == 0`.
- Per-deployment `ReasoningUsdPerMillionTokens` override.
- Global rate override (`ILlmCostEstimationUsdRateOverride`) combined with reasoning fallback — the fallback uses the *overridden* output rate, not the config output rate; this is correct but currently invisible in tests.

**What to do:**

Add at least three tests to `LlmCostEstimatorTests`:

```csharp
// 1. Explicit reasoning rate
EstimateUsd_applies_explicit_reasoning_rate_when_configured()
// options: Input=3, Output=15, Reasoning=20
// call: EstimateUsd(1_000_000, 0, 1_000_000)
// expected: 3m + 20m = 23m

// 2. Reasoning falls back to output rate when reasoning rate is zero
EstimateUsd_reasoning_falls_back_to_output_rate_when_zero()
// options: Input=3, Output=15, Reasoning=0
// call: EstimateUsd(0, 0, 1_000_000)
// expected: 15m (output rate used)

// 3. Per-deployment reasoning override
EstimateUsd_per_deployment_reasoning_overrides_global()
// global: Reasoning=5, dep-o: ReasoningUsdPerMillionTokens=25
// call: EstimateUsd(0, 0, 1_000_000, "dep-o")
// expected: 25m
```

**Affected files:**
- [`ArchLucid.AgentRuntime.Tests/LlmCostEstimatorTests.cs`](../../ArchLucid.AgentRuntime.Tests/LlmCostEstimatorTests.cs)

**Size estimate:** **XS** — ~30 min.

---

## TB-023 — `LlmCostEstimator` — document replay-rate semantics (live rate vs. stored-per-trace divergence) — **Done (Improvement #18, Batch J, 2026-05-26)**

**Source:** Cost estimator audit-grade correctness review (2026-05-24).

**Shipped:** XML remarks on **`ILlmCostEstimator`**, **`LlmCostEstimator`**, and **`AgentExecutionTraceRunLlmCostAggregator.Compute`**; operator table in **`docs/library/PER_TENANT_COST_MODEL.md`** § *Rate changes and replay*; TB-023 class summary on **`LlmCostEstimatorTests`**.

**Problem (historical):** `ILlmCostEstimationUsdRateOverride.TryGetUsdPerMillionRates` is resolved at call time, not at trace-recording time. Replaying historical traces through `AgentExecutionTraceRunLlmCostAggregator.Compute` after an admin rate update produces a different aggregate cost than what was originally recorded; per-trace `AgentExecutionTrace.EstimatedCostUsd` can disagree with the recomputed aggregate on the same run.

**Original ask (closed):**

1. ~~Add remarks to `ILlmCostEstimator.EstimateUsd`~~ — done.
2. ~~Add remarks to `AgentExecutionTraceRunLlmCostAggregator.Compute`~~ — done.
3. ~~Add operator note in `PER_TENANT_COST_MODEL.md`~~ — done.

**Affected files:**
- [`ArchLucid.Core/Configuration/ILlmCostEstimator.cs`](../../ArchLucid.Core/Configuration/ILlmCostEstimator.cs)
- [`ArchLucid.AgentRuntime/LlmCostEstimator.cs`](../../ArchLucid.AgentRuntime/LlmCostEstimator.cs)
- [`ArchLucid.Application/Agents/AgentExecutionTraceRunLlmCostAggregator.cs`](../../ArchLucid.Application/Agents/AgentExecutionTraceRunLlmCostAggregator.cs)
- [`docs/library/PER_TENANT_COST_MODEL.md`](PER_TENANT_COST_MODEL.md)

**Size estimate:** **XS** — ~30 min (comments + one paragraph in ops doc).

---

## TB-025 — `LlmCostEstimator` — annotate OTel `double` cast and pretax nature

**Source:** Cost estimator audit-grade correctness review (2026-05-24).

**Problem:** Two undocumented correctness caveats exist in the metrics emission path:

1. **`decimal → double` precision loss.** `ArchLucidInstrumentation.RecordLlmCostUsd` casts the `decimal` estimate to `double` before adding to the `Counter<double>` OTel instrument (`archlucid_llm_cost_usd_total`). Values like `$0.000003` are not exactly representable in IEEE 754 `double`, introducing rounding error that accumulates in the Prometheus counter. The in-process `decimal` and any SQL-persisted values are unaffected.

2. **Pretax only, not labeled as such.** The counter description ("Estimated LLM USD from token counts × rates") does not state that the value is pretax. Operators reconciling the counter against an Azure invoice (which includes VAT/GST depending on jurisdiction) will see unexplained discrepancies.

**What to do:**

1. Update the `LlmCostUsdTotal` counter description to read: *"Pre-tax estimated LLM spend in USD from token counts × configured per-million rates (label tenant). Monitoring-grade only — not invoice-reconciliation-grade; the decimal-to-double cast introduces sub-microdollar IEEE 754 rounding. Does not include VAT/GST."*
2. Add an inline comment on the `(double)estimatedCostUsd` cast in `RecordLlmCostUsd` explaining the precision loss and why it is acceptable for monitoring purposes.
3. Update the `ILlmCostEstimator.EstimateUsd` XML doc (or `LlmCostEstimationOptions` section header) to state "returns pre-tax estimated cost."

**Affected files:**
- [`ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs`](../../ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs) — `LlmCostUsdTotal` counter definition and `RecordLlmCostUsd` method
- [`ArchLucid.Core/Configuration/ILlmCostEstimator.cs`](../../ArchLucid.Core/Configuration/ILlmCostEstimator.cs)

**Size estimate:** **XS** — ~20 min (comments + description string updates).

---

## TB-027 — Introduce `IAgentExecutor` port — eliminate AgentSimulator coupling from production assemblies

**Source:** Dependency graph audit (2026-05-26). Three production assemblies — `ArchLucid.AgentRuntime`, `ArchLucid.Capabilities.Cost`, and `ArchLucid.Host.Core` — directly reference `ArchLucid.AgentSimulator`. Because `Application` depends on `Capabilities.Cost`, the simulator is a transitive runtime dependency of every production code path through Application. The existing `AgentRuntime_references_AgentSimulator_by_design` test documents the coupling without resolving it.

**Problem:**

`AgentSimulator` contains test-only simulation logic. Shipping it in the production assembly closure means:
- Test code is present at runtime in production, increasing attack surface and binary size.
- Any future change to the simulator (e.g. adding test helpers) is a production build change.
- The coupling is invisible to callers who depend on `Application` — it emerges transitively via `Capabilities.Cost`.

**What to do:**

1. Define `IAgentExecutor` (or reuse an existing equivalent interface) in `ArchLucid.Core` or `ArchLucid.Contracts`. The interface must capture the execution contract currently fulfilled by `AgentSimulator` without naming it.
2. Update `ArchLucid.AgentRuntime` to depend on `IAgentExecutor` where it currently uses the concrete simulator type. Remove the `<ProjectReference>` to `ArchLucid.AgentSimulator`.
3. Update `ArchLucid.Capabilities.Cost` — audit which simulator types are used directly and replace with the port. Remove the `<ProjectReference>` to `ArchLucid.AgentSimulator`.
4. Update `ArchLucid.Host.Core` — move any simulator registration or conditional wiring to `ArchLucid.Host.Composition`. Remove the `<ProjectReference>` to `ArchLucid.AgentSimulator` from `Host.Core.csproj`.
5. In `ArchLucid.Host.Composition`, bind `AgentSimulator`'s concrete type to `IAgentExecutor` for non-production environments (the composition root is the correct place for this — it already references `AgentSimulator`).
6. Delete the `AgentRuntime_references_AgentSimulator_by_design` test from `DependencyConstraintTests` and replace with: `AgentRuntime_must_not_reference_AgentSimulator_assembly` (hard fail) and `AgentSimulator_may_only_be_referenced_by_allowlisted_assemblies` (positive-list guard: `{Host.Composition, *.Tests}`).

**Correctness / safety:**

- No behavioural change to simulation paths — `AgentSimulator` is still wired by Host.Composition in non-production; callers just see the port.
- All existing `AgentRuntime.Tests` and `Application.Tests` that use the simulator directly through project references are unaffected — test projects may still reference `AgentSimulator` directly.
- Run the full Architecture.Tests suite and compile-check all affected projects before closing.

**Affected files / projects:**

- `ArchLucid.Core` or `ArchLucid.Contracts` — new `IAgentExecutor.cs`
- `ArchLucid.AgentRuntime/ArchLucid.AgentRuntime.csproj` — remove `AgentSimulator` reference
- `ArchLucid.Capabilities.Cost/ArchLucid.Capabilities.Cost.csproj` — remove `AgentSimulator` reference
- `ArchLucid.Host.Core/ArchLucid.Host.Core.csproj` — remove `AgentSimulator` reference; move wiring to `Host.Composition`
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.*.cs` — bind `IAgentExecutor`
- `ArchLucid.Architecture.Tests/DependencyConstraintTests.cs` — delete `_by_design` tests; add hard-fail + positive-list guards

**Size estimate:** **M** — ~1–2 eng days (interface definition + reference removal + host composition wiring + Architecture.Tests updates + test regression).

---

## TB-028 — Move `Integrations.AzureExtractor` wiring out of `Api.csproj` into Host.Composition

**Source:** Dependency graph audit (2026-05-26). `ArchLucid.Api.csproj` carries a direct `<ProjectReference>` to `ArchLucid.Integrations.AzureExtractor`. This violates the single-composition-root rule enforced by `SingleCompositionRootServiceCollectionExtensionsTests` — adapter wiring belongs exclusively in `Host.Composition`.

**Problem:**

The Api entry point is an HTTP host, not a composition root. Naming a specific infrastructure adapter in its project file means:
- The adapter's assembly is loaded unconditionally regardless of configuration.
- Adding or swapping adapters requires changes to the Api project rather than to Host.Composition.
- The boundary between "entry point" and "composition root" is eroded, making future adapter splits harder.

**What to do:**

1. Audit `ArchLucid.Api` source files for all usages of types from `ArchLucid.Integrations.AzureExtractor`. Identify which, if any, are referenced from controller code (unlikely — should only be DI registration).
2. Move any registration calls (`services.AddAzureExtractor(...)` or similar) from Api's `Program.cs` / startup extensions into `ArchLucid.Host.Composition`'s `ServiceCollectionExtensions.ApplicationPipeline.cs` (already the canonical composition root).
3. Delete the `<ProjectReference Include="..\ArchLucid.Integrations.AzureExtractor\..." />` line from `ArchLucid.Api.csproj`.
4. Verify that `ArchLucid.Host.Composition` already references `ArchLucid.Integrations.AzureExtractor` — it does; no new reference is needed there.
5. Add the assertion `Api_must_not_reference_Integrations_AzureExtractor_assembly` to `DependencyConstraintTests` (both NetArchTest namespace check and csproj `ReadProjectReferenceAssemblyNames` check, matching the existing `Api_csproj_must_not_declare_Decisioning_project_reference` pattern).

**Correctness / safety:**

- `Api → Host.Composition → Integrations.AzureExtractor` is already the transitive path; removing the direct reference does not change what is registered at runtime.
- Compile-check `ArchLucid.Api` after removing the reference to confirm no direct type usages remain.

**Affected files / projects:**

- `ArchLucid.Api/ArchLucid.Api.csproj` — delete `AzureExtractor` project reference
- `ArchLucid.Api/Program.cs` or startup code — move any direct registration calls
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.ApplicationPipeline.cs` — receive the registration (likely already there)
- `ArchLucid.Architecture.Tests/DependencyConstraintTests.cs` — add hard-fail assertion

**Size estimate:** **XS** — ~30 min (delete one csproj line, possibly move one registration call, add one test).

---

## TB-029 — Replace `Decisioning → Notifications` with domain events

**Status:** **Shipped 2026-05-27.** `ArchLucid.Decisioning` removed the `ArchLucid.Notifications` project reference; webhook/chat-ops delivery channels remain in `ArchLucid.Notifications` and register from `ArchLucid.Host.Composition` only. Architecture tests: `Decisioning_must_not_reference_Notifications_assembly`, `DecisioningNotificationsBoundaryArchitectureTests`.

**Source:** Dependency graph audit (2026-05-26). `ArchLucid.Decisioning` carries a direct `<ProjectReference>` to `ArchLucid.Notifications`. Decisioning is a domain analysis service (L2); Notifications is an infrastructure concern (L1/L4 depending on the implementation). The current `Decisioning_csproj_references_Notifications_by_design` test acknowledges the coupling without a resolution path.

**Problem:**

A domain analysis service should not know about notification mechanisms. The current coupling means:
- Adding a new notification channel (Teams, Slack, etc.) can force changes in Decisioning.
- The notification send path is directly reachable from within decision logic, making it harder to test Decisioning in isolation.
- If Notifications ever needs to consume Decisioning (e.g. to enrich alert text), a cycle forms.

**What to do:**

1. Identify all Decisioning call sites that invoke Notifications types (search for `using ArchLucid.Notifications` in Decisioning source).
2. Define a domain event (e.g. `DecisionReachedDomainEvent`, `DecisionAlertRaisedDomainEvent`) in `ArchLucid.Core` or `ArchLucid.Contracts`. The event carries only value-typed data; no Notifications types.
3. Publish the domain event via an `IDomainEventPublisher` interface (define in `ArchLucid.Core` if not already present). Decisioning takes a constructor dependency on `IDomainEventPublisher`.
4. In `ArchLucid.Host.Composition`, register an event handler that reads the domain event and dispatches to the Notifications channel. The handler lives in `ArchLucid.Notifications` or a thin adapter.
5. Remove the `<ProjectReference>` to `ArchLucid.Notifications` from `ArchLucid.Decisioning.csproj`.
6. Delete `Decisioning_csproj_references_Notifications_by_design` from `DependencyConstraintTests` and add `Decisioning_must_not_reference_Notifications_assembly` (hard fail).

**Correctness / safety:**

- All existing notification behaviour must be preserved — verify end-to-end in `Decisioning.Tests` (use a fake `IDomainEventPublisher`) and in integration smoke.
- `IDomainEventPublisher` must be non-blocking (fire-and-forget or outbox-backed) to avoid coupling Decisioning's execution time to notification delivery latency.
- If an outbox is used, align with ADR 0004 (transactional outbox) to avoid double-delivery risk.

**Affected files / projects:**

- `ArchLucid.Core` — new `IDomainEventPublisher.cs` (if not already present), domain event records
- `ArchLucid.Decisioning/ArchLucid.Decisioning.csproj` — remove `Notifications` reference
- `ArchLucid.Decisioning` source — replace direct notification calls with `IDomainEventPublisher.Publish`
- `ArchLucid.Notifications` or adapter — new domain event handler
- `ArchLucid.Host.Composition` — register handler
- `ArchLucid.Decisioning.Tests` — update to use fake publisher; remove Notifications test doubles
- `ArchLucid.Architecture.Tests/DependencyConstraintTests.cs` — replace `_by_design` test with hard-fail assertion

**Size estimate:** **M–L** — ~1–3 eng days depending on how widely Notifications types are used within Decisioning and whether a domain event bus is already in place.

---

## TB-030 — Architecture.Tests gap closure — add Mcp, AzureExtractor, AgentSimulator, Jobs.Cli coverage + 10 missing `[Fact]`s

**Source:** Dependency graph audit (2026-05-26). Four production assemblies are not referenced in `ArchLucid.Architecture.Tests.csproj` and therefore have zero layer-boundary assertions. Additionally, 10 `[Fact]` methods are absent from `DependencyConstraintTests` for violations that are currently unguarded.

**Problem:**

Without project references in Architecture.Tests, NetArchTest cannot load the assemblies and any `HaveDependencyOn` check silently passes against an empty type set. The four unguarded assemblies are:

| Assembly | Risk |
|---|---|
| `ArchLucid.Mcp` | No guard against `Mcp → Application` or `Mcp → Persistence` — can silently gain prohibited dependencies |
| `ArchLucid.Integrations.AzureExtractor` | No guard against `AzureExtractor → Application` |
| `ArchLucid.AgentSimulator` | No positive-list guard on which assemblies may reference it |
| `ArchLucid.Jobs.Cli` | No layer-bound assertions at all |

**What to do:**

1. Add four `<ProjectReference>` entries to `ArchLucid.Architecture.Tests.csproj`:
   - `ArchLucid.Mcp`
   - `ArchLucid.Integrations.AzureExtractor`
   - `ArchLucid.AgentSimulator`
   - `ArchLucid.Jobs.Cli`

2. Add the following `[Fact]` methods to `DependencyConstraintTests.cs` (use existing patterns — `ReadProjectReferenceAssemblyNames` + `Types.InAssembly(...).ShouldNot().HaveDependencyOn(...)`):

   | Fact name | What it asserts |
   |---|---|
   | `Mcp_must_not_depend_on_Application_layer_namespaces` | `ArchLucid.Mcp` has no dependency on `ArchLucid.Application` namespace |
   | `Mcp_must_not_depend_on_Persistence` | `ArchLucid.Mcp` has no dependency on `ArchLucid.Persistence` namespace |
   | `Mcp_csproj_must_not_reference_Application_or_Persistence` | csproj check for both |
   | `Integrations_must_not_depend_on_Application` | Both AzureExtractor and AzureDevOps assemblies checked |
   | `Integrations_csproj_must_not_reference_Application` | csproj check for both integrations |
   | `Api_must_not_reference_Integrations_AzureExtractor_assembly` | csproj check (pair with TB-028) |
   | `AgentSimulator_may_only_be_referenced_by_allowlisted_assemblies` | Positive-list: only `{ArchLucid.Host.Composition}` + `*.Tests` assemblies may reference AgentSimulator via csproj |
   | `Capabilities_Cost_references_AgentSimulator_by_design` | Temporary `_by_design` acknowledgement until TB-027 ships; flip to hard-fail after TB-027 |
   | `Host_Core_must_not_reference_AgentSimulator_assembly` | csproj check; paired with TB-027 |
   | `Jobs_Cli_must_not_depend_on_Application_directly` | `Jobs.Cli` must reach Application only via `Host.Composition` |
   | `Notifications_Email_RazorLight_must_not_depend_on_Application_or_above` | Infrastructure adapter stays at L4 |

3. Run `ArchLucid.Architecture.Tests` and fix any newly-discovered violations before committing.

**Correctness / safety:**

- Some facts (e.g. `Capabilities_Cost_references_AgentSimulator_by_design`) should start as `_by_design` acknowledgements until the corresponding TB (TB-027) ships; flip to hard-fail in the same PR that closes TB-027.
- Do not add `AgentSimulator` or `Jobs.Cli` to `SingleCompositionRootArchitectureTestConstants.CompositionRootScannedProductAssemblyNames` — they are not product assemblies subject to the composition-root scan.

**Affected files / projects:**

- `ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj` — four new `<ProjectReference>` entries
- `ArchLucid.Architecture.Tests/DependencyConstraintTests.cs` — 10+ new `[Fact]` methods

**Size estimate:** **S** — ~2–4 h (mostly mechanical: reference adds + test method authoring + one test run to catch any pre-existing violations).

---

## TB-031 — Disambiguate ArtifactSynthesis / Decisioning layer position

**Status:** **Done (Batch G, 2026-05-27).** Option A shipped: `Decisioning_must_not_depend_on_ArtifactSynthesis`, `ArtifactSynthesis_csproj_references_Decisioning_by_design`, layer table in `docs/library/SYSTEM_MAP.md`.

**Source:** Dependency graph audit (2026-05-26). `ArchLucid.ArtifactSynthesis` depends directly on `ArchLucid.Decisioning` (`ArtifactSynthesis → Decisioning`). Both are positioned at the same nominal layer (analysis / domain services, below Application), yet the dependency is unidirectional. Neither assembly has an Architecture.Tests assertion stating which is "above" the other, making future bidirectional coupling a silent regression.

**Problem:**

Without an explicit layer ordering, it is valid to ask: can Decisioning depend on ArtifactSynthesis? The current graph says no (there is no such edge), but there is no test enforcing that. Over time, a developer could add `Decisioning → ArtifactSynthesis` and create a cycle.

**Decision required (owner / engineering lead):** Choose one:

- **Option A (preferred):** ArtifactSynthesis is strictly *above* Decisioning. Decisioning may not depend on ArtifactSynthesis. Enforce with `Decisioning_must_not_depend_on_ArtifactSynthesis` in Architecture.Tests.
- **Option B:** Extract the types that ArtifactSynthesis needs from Decisioning into `ArchLucid.Contracts` or a new `ArchLucid.DecisioningContracts` assembly, eliminating the dependency entirely. Both assemblies are then at the same layer with no edge between them.

**What to do (once option is chosen):**

- **Option A:** Add `Decisioning_must_not_depend_on_ArtifactSynthesis` to `DependencyConstraintTests`. Add a corresponding `ArtifactSynthesis_depends_on_Decisioning_by_design` acknowledgement that documents the layering decision. Update layer documentation in `docs/library/SYSTEM_MAP.md` or a new architecture note.
- **Option B:** Identify which Decisioning types ArtifactSynthesis uses. Move them to `ArchLucid.Contracts`. Update both csproj files. Add mutual `must_not_depend_on` assertions in Architecture.Tests.

**Affected files / projects (Option A — minimal):**

- `ArchLucid.Architecture.Tests/DependencyConstraintTests.cs` — two new facts
- `docs/library/SYSTEM_MAP.md` — layer clarification

**Affected files / projects (Option B — full):**

- `ArchLucid.Contracts` — new type(s) moved from Decisioning
- `ArchLucid.Decisioning/ArchLucid.Decisioning.csproj` — no change (already references Contracts)
- `ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj` — remove Decisioning reference
- `ArchLucid.Architecture.Tests/DependencyConstraintTests.cs` — two new hard-fail assertions

**Size estimate:** **XS–S** — Option A ~30 min; Option B ~2–4 h depending on how many types need to move.

---

## TB-032 — Replace `Mcp → Retrieval` direct coupling with a query port

**Source:** Dependency graph audit (2026-05-26). `ArchLucid.Mcp` (a protocol adapter — infrastructure layer, L4) depends directly on `ArchLucid.Retrieval` (application orchestration layer, L3). `Retrieval` itself depends on `Decisioning`, `Provenance`, and `ArtifactSynthesis`, giving the Mcp adapter a wide transitive footprint into the application layer. This violates the principle that infrastructure adapters depend on port *interfaces*, not on application layer *implementations*.

**Problem:**

- A change to `Retrieval`'s internals can break the Mcp build even when the MCP surface is unchanged.
- The MCP adapter cannot be tested in isolation without pulling in the full application layer.
- Adding a second retrieval implementation (e.g. a cached or tenant-sharded variant) requires updating Mcp rather than just rebinding at the composition root.

**What to do:**

1. Define an `IMcpRetrievalPort` (or extend an existing query port if one already exists in Application/Contracts) that exposes only the operations Mcp requires. Place the interface in `ArchLucid.Application` or `ArchLucid.Contracts`.
2. Implement the port in `ArchLucid.Retrieval` (a thin adapter implementing `IMcpRetrievalPort` by delegating to existing Retrieval services).
3. Update `ArchLucid.Mcp` to depend on `IMcpRetrievalPort` instead of Retrieval types directly. Replace the `<ProjectReference>` to `ArchLucid.Retrieval` with one to the assembly that defines the port (Contracts or Application).
4. In `ArchLucid.Host.Composition`, bind `IMcpRetrievalPort` → the Retrieval implementation.
5. Add Architecture.Tests assertions: `Mcp_must_not_depend_on_Application_layer_namespaces` and `Mcp_csproj_must_not_reference_Retrieval` (pair with TB-030).

**Correctness / safety:**

- No behavioural change — the Retrieval implementation is still wired at runtime; the port is a compile-time boundary only.
- Unit-test `ArchLucid.Mcp` against a fake `IMcpRetrievalPort` after the change. This should reveal any implicit assumptions Mcp has about Retrieval's concrete type.
- Coordinate with TB-030 (Architecture.Tests gap closure) — the `Mcp_must_not_depend_on_*` assertions added in TB-030 should turn green when this item ships.

**Affected files / projects:**

- `ArchLucid.Contracts` or `ArchLucid.Application` — new `IMcpRetrievalPort.cs`
- `ArchLucid.Retrieval` — new `McpRetrievalPortAdapter.cs` (implements the port)
- `ArchLucid.Mcp/ArchLucid.Mcp.csproj` — swap `Retrieval` reference for port-defining assembly
- `ArchLucid.Mcp` source — replace concrete Retrieval usages with port calls
- `ArchLucid.Host.Composition` — bind `IMcpRetrievalPort`
- `ArchLucid.Architecture.Tests/DependencyConstraintTests.cs` — assertions (pair with TB-030)

**Size estimate:** **M** — ~1–2 eng days (port definition + Retrieval adapter + Mcp refactor + composition binding + tests).

---

## TB-033 — Agent execution trace — persist LLM sampling params + reasoning token count

**Source:** Replay / provenance completeness audit (2026-05-26). Operators and support need to reconstruct the exact LLM call configuration for a single agent task.

**Problem:**

`AgentExecutionTrace` persists `ModelDeploymentName`, `ModelVersion`, and prompt-template identity (`PromptTemplateId`, `PromptTemplateVersion`, `SystemPromptContentSha256`, `PromptReleaseLabel`) but **not** the completion request parameters actually sent to Azure OpenAI:

- `temperature` (handler default **0.1** today — not stored)
- `maxTokens` / `max_completion_tokens`
- `top_p`, presence/frequency penalties (if ever enabled)

`ReasoningTokenCount` (or equivalent) is consumed when estimating cost in `LlmCompletionAccountingClient` / `LlmCostEstimator` but is **not** written to the trace row — only input/output token totals are stored.

**What to do:**

1. Extend `AgentExecutionTrace` contract + `dbo.AgentExecutionTraces` / `TraceJson` schema (DbUp + consolidated `Scripts/ArchLucid.sql`) with nullable fields for sampling params actually passed to the completion client (capture at record time, not defaults from config unless that is what was sent).
2. Add `ReasoningTokenCount` (or provider-specific reasoning field) to the trace row when the completion response reports it.
3. Populate fields in `AgentExecutionTraceRecorder.RecordAsync` from `AgentCompletionModelMetadata` / completion result DTO — single source at record time.
4. Update OpenAPI/codegen if trace detail DTOs are customer-visible; extend `docs/library/AGENT_TRACE_FORENSICS.md` §Model metadata.
5. Unit tests: recorder persists non-default sampling when handler overrides; reasoning tokens round-trip when provider returns them.

**Out of scope:** LLM tool-call loops (architecture is single-shot JSON completion today — no tool persistence layer).

**Depends on:** none (orthogonal to **TB-011** replay *scope* isolation — **INV-013**).

**Affected files / projects:**

- `ArchLucid.Contracts/Agents/AgentExecutionTrace.cs`
- `ArchLucid.AgentRuntime/AgentExecutionTraceRecorder.cs`, `Traces/AgentExecutionTraceMapper.cs`
- `ArchLucid.AgentRuntime/LlmAgentSchemaCompletion.cs`, `AzureOpenAiCompletionClient.cs` (pass-through metadata)
- Persistence migration + `AgentExecutionTraceRecorderTests` (or equivalent)

**Size estimate:** **XS** — ~2–4 h.

---

## TB-034 — Degraded-handler minimal `AgentExecutionTrace` rows

**Source:** Replay / provenance completeness audit (2026-05-26). `RealAgentExecutor` resilience path uses `AgentHandlerDegradedResultFactory` when handlers time out, circuits open, or resilience fails.

**Problem:**

Degraded paths emit **`archlucid_agent_handler_degradations_total`** and activity event **`agent.handler.degraded`** (confirmed prompt-free in `AgentHandlerDegradationTelemetryTests`) and return a **zero-confidence placeholder** `AgentResult`, but **`IAgentExecutionTraceRecorder.RecordAsync` is not called**. Investigators cannot recover what prompt would have been sent, which model was selected, or whether an LLM call was attempted.

**What to do:**

1. On degradation (before returning placeholder), record a **minimal** trace row: `FailureReasonCode` / `degradation_reason`, `AgentType`, `RunId`, `TaskId`, optional **truncated** system/user prompt hashes or template metadata (no full blob requirement if degradation happened pre-LLM — document which fields are best-effort).
2. Set `ParseSucceeded=false`, `EstimatedCostUsd=0` (or null), sentinel model metadata if no completion occurred.
3. Audit event optional: `AgentHandlerDegradedTraceRecorded` for operator search (or reuse existing degradation audit with `traceId`).
4. Document in `docs/library/AGENT_TRACE_FORENSICS.md` and `docs/library/OBSERVABILITY.md` that degraded traces are **partial** by design.
5. Extend `AgentHandlerDegradationTelemetryTests` to assert trace row exists (or explicit skip reason when degradation is pre-prompt).

**Correctness / safety:**

- Do **not** block degradation return on trace insert failure — same best-effort contract as blob persistence (**TB-001** informational posture for secondary writes).
- Redaction (**`LlmPromptRedaction`**) applies if prompts are included.

**Affected files / projects:**

- `ArchLucid.AgentRuntime/RealAgentExecutorHandlerResiliencePipeline.cs`, `AgentHandlerDegradedResultFactory.cs`
- `ArchLucid.AgentRuntime/AgentExecutionTraceRecorder.cs`
- `ArchLucid.AgentRuntime.Tests/AgentHandlerDegradationTelemetryTests.cs`

**Size estimate:** **S** — ~4–8 h.

---

## TB-035 — Persist intermediate LLM attempts on schema-remediation retries

**Source:** Replay / provenance completeness audit (2026-05-26). `LlmAgentSchemaCompletion` retries JSON parse / schema validation failures before surfacing error to the handler.

**Problem:**

Only the **final** attempt is passed to `IAgentExecutionTraceRecorder.RecordAsync`. Intermediate prompts and raw responses are discarded; `RecordAgentSchemaRemediationRetry` is a **metric counter only**. Support cannot answer “what did the model return on attempt 1 vs 3?” for schema drift incidents.

**What to do:**

1. **Option A (preferred):** Child trace rows per attempt — same `RunId`/`TaskId`, distinct `TraceId`, `AttemptIndex` column (migration), `ParentTraceId` nullable for final consolidated row OR final row references `AttemptCount`.
2. **Option B:** Append `RemediationAttempts[]` JSON array on a single trace row (bounded size; truncate with audit if exceeded).
3. Record each attempt’s `RawResponse`, parse error, and token/cost slice when a completion occurred.
4. Cap max attempts in config; document retention alignment with **`DataArchival:PurgeArchivedAgentExecutionTracesAfterDays`**.
5. Tests: two-failure-then-success path produces three durable attempt records (or array length 3).

**Out of scope:** Changing remediation policy or max retry count (product decision).

**Affected files / projects:**

- `ArchLucid.AgentRuntime/LlmAgentSchemaCompletion.cs`
- `ArchLucid.Contracts/Agents/AgentExecutionTrace.cs`
- `ArchLucid.AgentRuntime/AgentExecutionTraceRecorder.cs`
- Persistence migration

**Size estimate:** **M** — ~1–2 eng days.

---

## TB-036 — Correlate `DecisionProvenanceGraph` with `AgentExecutionTrace`

**Status:** Done (Batch F, 2026-05-26).

**Source:** Replay / provenance completeness audit (2026-05-26). `ArchLucid.Provenance` builds decision lineage; `AgentRuntime` stores LLM forensics — no link between them.

**Problem:**

`ProvenanceBuilder` / `GET …/provenance` answer “which findings and decisions contributed to this run?” but not “which agent trace produced this decision narrative?” `AgentExecutionTrace` rows have `RunId` + `TaskId` + `AgentType` but no provenance node IDs. Cross-navigation requires manual correlation by timestamp and agent type.

**What to do:**

1. Product/engineering agree correlation grain: **per agent task** (`TaskId` + `AgentType`) vs **per decision key** vs **per finding id**.
2. Add stable correlation fields — e.g. `ProvenanceCorrelationId` on trace row; optional `AgentExecutionTraceId` on `ProvenanceNode.Metadata` for `Decision` / `Finding` nodes when builder can infer mapping.
3. Populate during handler execute + `ProvenanceBuilder` build (or post-run linker service in Application).
4. Expose in provenance API + trace detail API for operator UI deep links (pair with **`NEXT_PUBLIC_TRACE_VIEWER_URL_TEMPLATE`** in UI backlog if needed).
5. Architecture test: Provenance assembly must not reference AgentRuntime (correlation via Contracts IDs only).

**Depends on:** clarity on UX (run detail vs graph node click-through).

**Refs:** [`docs/library/KNOWLEDGE_GRAPH.md`](KNOWLEDGE_GRAPH.md); [`docs/library/AGENT_TRACE_FORENSICS.md`](AGENT_TRACE_FORENSICS.md).

**Size estimate:** **M** — ~2–3 eng days.

---

## TB-037 — Production write path for `DecisionProvenanceSnapshot`

**Source:** Replay / provenance completeness audit (2026-05-26). `DecisionProvenanceSnapshot` table and `IProvenanceSnapshotRepository.SaveAsync` exist; production code rebuilds the graph on read.

**Problem:**

`AuthorityQueryController` / provenance query paths invoke `ProvenanceBuilder` on demand. **`SaveAsync` has no production callers** — snapshots are never materialized. Every provenance read recomputes from findings, manifest, and decision trace artefacts (higher latency, harder point-in-time audit).

**What to do:**

1. After successful authority commit (or run terminal state), build graph once and **`SaveAsync`** with idempotent upsert on `RunId` (respect tenant RLS).
2. Read path: load snapshot when present and fresh (hash manifest / findings revision); fall back to rebuild when stale or missing.
3. Wire invalidation when run artefacts are superseded (align with replay scope rules — **INV-013** / **TB-011**).
4. Metrics: `archlucid_provenance_snapshot_writes_total`, rebuild fallback counter.
5. Tests: commit → snapshot exists; second read does not call builder when snapshot valid.

**Out of scope:** Changing graph semantics or node types.

**Affected files / projects:**

- `ArchLucid.Application` (or worker) — post-commit hook
- `ArchLucid.Provenance/ProvenanceBuilder.cs`
- `IProvenanceSnapshotRepository` implementation in Persistence
- `AuthorityQueryController` / `ProvenanceQueryController`

**Size estimate:** **S** — ~4–8 h.

---

## TB-038 — `RetrievalGroundingTrace` forensic enrichment (+ non-Compliance agents)

**Source:** Replay / provenance completeness audit (2026-05-26). **RAG-V1-000** shipped `dbo.RetrievalGroundingTrace` with chunk IDs for **Compliance** only.

**Problem:**

Durable grounding rows store `RetrievedChunkIds`, token counts, and `CitationCoverage` but **not** the retrieval **query text**, **TopK**, **similarity scores**, or **document IDs**. Retrieved text is only recoverable indirectly via the user-prompt blob on the agent trace. Topology, Cost, and Critic agents do not write grounding traces even when they use retrieval-like evidence paths.

**What to do:**

See **RAG-V1-006** in [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](RAG_QUALITY_TECHNICAL_BACKLOG.md) for phased deliverables. Summary:

1. Extend `RetrievalGroundingTraceInsert` + migration: `QueryText` (truncated), `TopK`, `CorpusKind`, optional `ScoresJson` / `DocumentIdsJson` (bounded).
2. Write from all handlers that call `IRetrievalQueryService` (not only Compliance).
3. Link grounding row to `AgentExecutionTrace.TraceId` when both exist.
4. Document replay note: retrieval hits remain prompt-context unless chunk content hashes are snapshotted (**RAG-V1-000** replay note).

**Schedule under:** **TB-021** / assessment **CPB-T21** when faithfulness work is active.

**Size estimate:** **S–M** — ~1–2 eng days (schema + writers + tests).

---

## TB-039 — Agent execute retry — per-`(RunId, TaskId)` skip before handler dispatch

**Source:** AgentRuntime determinism and idempotency audit (2026-05-26). `ArchitectureRunExecuteOrchestrator.TryReturnExistingExecuteResultsAsync` skips idempotent early return when stored results are incomplete vs scheduled tasks.

**Problem:**

When execute is retried after a partial batch (some handlers succeeded, run still `TasksGenerated`), the orchestrator calls `agentExecutor.ExecuteAsync` with the **full** task list. There is no per-task “already executed” gate. `AgentResultRepository.CreateManyAsync` delete-then-insert prevents duplicate SQL rows, but every handler is re-invoked and **LLM tokens are charged again** via `LlmCompletionAccountingClient` (accounting in `finally` on each successful `CompleteJsonAsync`). The completion cache (`CachingLlmCompletionClient`) deduplicates identical prompts only — not `(RunId, TaskId)` identity.

**What to do:**

1. Before `ExecuteSingleAsync` in `RealAgentExecutor`, load existing `AgentResults` for the run (or accept a preloaded map from the orchestrator).
2. For each `(RunId, TaskId)` with a persisted successful result (define: non-degraded, parse succeeded, or explicit product rule), return the stored `AgentResult` without calling the handler or LLM.
3. Optionally restrict skip to results from the same run revision / evidence package hash if product requires re-run on evidence change.
4. Log metric `archlucid_agent_execute_task_skipped_idempotent_total` with labels `agent_type`, `reason`.
5. Tests: partial batch persisted → retry executes only missing tasks; full batch idempotent early return unchanged; degraded placeholder does not skip unless product says so.

**Out of scope:** Changing execute idempotency terminal statuses or create-run idempotency keys.

**Depends on:** none (complements **TB-012** / **INV-009**; orthogonal to **TB-035** remediation forensics).

**Affected files / projects:**

- `ArchLucid.Application/Runs/Orchestration/ArchitectureRunExecuteOrchestrator.cs`
- `ArchLucid.AgentRuntime/RealAgentExecutor.cs`
- `ArchLucid.Persistence/Data/Repositories/AgentResultRepository.cs`
- `ArchLucid.AgentRuntime.Tests/RealAgentExecutorTests.cs` (or orchestrator integration tests)

**Size estimate:** **M** — ~1–2 eng days.

---

## TB-040 — `LlmCompletionAccountingClient` — await metering with `CancellationToken.None`

**Source:** AgentRuntime determinism and idempotency audit (2026-05-26). Parallel fan-out uses linked cancellation; completed handlers may cancel peers after budget or fault.

**Problem:**

In `LlmCompletionAccountingClient.CompleteJsonAsync`, `TryRecordLlmUsageMeteringAsync` is invoked as fire-and-forget (`_ = …`) with the **original** `cancellationToken`. When linked cancellation fires immediately after a successful LLM response, metering can be silently skipped while `_dailyTenantBudgetTracker` / `_monthlyDollarBudgetTracker` still record usage (they use `CancellationToken.None`). Retry then bills LLM again — budget ledgers and `IUsageMeteringService` event logs diverge.

**What to do:**

1. Await `TryRecordLlmUsageMeteringAsync` in the `finally` block (same pattern as budget trackers), passing **`CancellationToken.None`**.
2. Keep best-effort semantics: catch and log metering failures without failing the completion (existing `catch` in `TryRecordLlmUsageMeteringAsync`).
3. Apply the same fix to `StreamJsonAsync` path.
4. Tests: simulate cancelled token after inner completion returns — assert metering `RecordAsync` still called once; budget and metering counts align.

**Out of scope:** Idempotent dedupe of metering events by correlation id (separate if needed).

**Depends on:** none.

**Affected files / projects:**

- `ArchLucid.AgentRuntime/LlmCompletionAccountingClient.cs`
- `ArchLucid.AgentRuntime.Tests/` (accounting / cancellation tests)

**Size estimate:** **XS** — ~2–4 h.

---

## TB-041 — Authority pipeline — per-stage completion checkpoint on retry

**Status:** Done (Batch F, 2026-05-26).

**Source:** AgentRuntime determinism and idempotency audit (2026-05-26). `AuthorityPipelineStagesExecutor.ExecuteStageAsync` has no “stage already completed” guard.

**Problem:**

If the authority pipeline throws mid-run (e.g. after context ingestion and graph save, before findings completes), a retry restarts from **stage 1** (`context_ingestion`). Each stage’s `SaveAsync` is insert-oriented; cross-stage work is not atomically rolled back. Retries can produce duplicate context snapshots, duplicate findings snapshots, and duplicate connector fetches — even when earlier stage outputs are already durable on `RunRecord` (`ContextSnapshotId`, `GraphSnapshotId`, etc.).

**What to do:**

1. Define stage completion predicates from persisted run header + snapshot FKs (e.g. `ContextSnapshotId` set ⇒ skip `context_ingestion`; `GraphSnapshotId` set ⇒ skip `graph` unless fingerprint changed).
2. At start of each `ExecuteStageAsync`, short-circuit `stageWork` when checkpoint indicates stage output already committed for this run revision.
3. Document interaction with **TB-042** (graph supersession) and `GraphSnapshotReuseEvaluator` clone vs fresh paths.
4. Metrics: `archlucid_authority_pipeline_stage_skipped_checkpoint_total` by `stage`.
5. Integration tests: fail after graph stage → retry skips ingestion + graph, continues at findings.

**Out of scope:** Full Durable Task Framework checkpoint/replay (**V1_DEFERRED**); changing stage ordering.

**Depends on:** **TB-042** recommended for graph stage skip semantics when `GraphSnapshotId` already set.

**Affected files / projects:**

- `ArchLucid.Persistence/Orchestration/Pipeline/AuthorityPipelineStagesExecutor.cs`
- `ArchLucid.Persistence/Orchestration/AuthorityRunOrchestrator.cs`
- Persistence tests / authority pipeline integration tests

**Size estimate:** **M** — ~1–2 eng days.

---

## TB-042 — Graph snapshot supersession — skip rebuild when `RunRecord.GraphSnapshotId` set

**Status:** Done (Batch F, 2026-05-26).

**Source:** AgentRuntime determinism and idempotency audit (2026-05-26). `KnowledgeGraphService.BuildSnapshotAsync` always assigns new `GraphSnapshotId`; `SaveGraphAsync` has no supersession check.

**Problem:**

If `SaveAsync` succeeds but `UpdateRunAsync` fails (transient SQL), retry builds and saves a **second** graph snapshot. When Cosmos graph storage is enabled, graph save runs **outside** the SQL authority transaction — orphaned snapshots are not rolled back. Run header eventually points at the latest id; earlier snapshots remain as orphans (storage + lineage noise).

**What to do:**

1. At graph stage entry: if `run.GraphSnapshotId` is non-null and load-by-id succeeds, reuse that snapshot (set `ctx.GraphSnapshot`, resolution mode `reused_from_run_header`) — skip `GraphSnapshotReuseEvaluator` rebuild/save.
2. When save + header update must be atomic, consider single UoW ordering: persist run FK in same transaction as SQL graph save where supported.
3. For Cosmos path: write run header pointer only after successful blob/document save, or implement compensating delete of orphan on header update failure (product choice — document).
4. Align with **TB-041** checkpoint rules.
5. Tests: simulate failure after `SaveAsync` before `UpdateRunAsync` → retry does not create second snapshot id.

**Out of scope:** Deleting historical orphaned snapshots (ops cleanup backlog if needed).

**Depends on:** **TB-041** (stage skip uses same header fields).

**Affected files / projects:**

- `ArchLucid.Persistence/Orchestration/Pipeline/AuthorityPipelineStagesExecutor.cs`
- `ArchLucid.Core/Persistence/Graph/GraphSnapshotReuseEvaluator.cs`
- `ArchLucid.KnowledgeGraph/Services/KnowledgeGraphService.cs`
- Graph snapshot repository implementations

**Size estimate:** **S** — ~4–8 h.

---

## TB-043 — Schema remediation — non-retried completion client (decouple from Polly stack)

**Source:** AgentRuntime determinism and idempotency audit (2026-05-26). `LlmAgentSchemaCompletion.CompleteAsync` calls `activeClient.CompleteJsonAsync`, which is typically `CircuitBreakingAgentCompletionClient` with an inner Polly retry pipeline.

**Problem:**

Maximum billed LLM calls per handler task scales as **`MaxCompletionAttempts × (1 + LlmCallMaxRetryAttempts)`** (e.g. 3 × 4 = 12). Each Polly retry that reaches Azure and returns usage is charged in `LlmCompletionAccountingClient`. Remediation attempts use **different user prompts** (remediation text appended), so completion cache does not dedupe across attempts. This is intentional retry behaviour for reliability but unbounded for FinOps unless capped.

**What to do:**

1. Register a dedicated **`IAgentCompletionClient`** for remediation attempts (same Azure endpoint, **no** Polly retry wrapper — or max 1 attempt) and pass as `remediationCompletionClient` into `LlmAgentSchemaCompletion.CompleteAsync` (parameter already exists).
2. Keep Polly retries on the **first** attempt only (transient 429/5xx on initial completion).
3. Document max billed calls formula in `docs/library/LLM_RETRY_AND_CIRCUIT_BREAKER.md` and `RESILIENCE_CONFIGURATION.md`.
4. Tests: schema violation triggers remediation → assert Polly retry count applies only to first attempt; token accounting call count bounded.
5. Coordinate with **TB-035** if persisting intermediate attempts (forensics) — billing and trace rows should align per attempt.

**Out of scope:** Reducing `MaxCompletionAttempts` (product decision); changing Polly policy for non-remediation calls.

**Depends on:** none (complements **TB-035**).

**Affected files / projects:**

- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs` (DI registration)
- `ArchLucid.AgentRuntime/LlmAgentSchemaCompletion.cs`
- Handler call sites (Topology, Compliance, Critic)
- `ArchLucid.AgentRuntime.Tests/LlmAgentSchemaCompletionTests.cs` (or equivalent)

**Size estimate:** **XS–S** — ~4–8 h.

---

## TB-044 — `AgentExecutionTraces` — unique index on `(RunId, TaskId, AgentType)` + upsert semantics

**Source:** AgentRuntime determinism and idempotency audit (2026-05-26). `AgentExecutionTraceRepository.CreateAsync` is plain INSERT; each execute retry generates new `TraceId`.

**Problem:**

Full execute retry (see **TB-039**) appends additional trace rows for the same logical agent task. Forensics queries (`GetByTaskIdAsync`) return multiple rows ordered by `CreatedUtc` — ambiguous “canonical” trace for support. Not a direct double-charge risk, but violates one-trace-per-task-per-run expectation and complicates cost aggregation.

**What to do:**

1. DbUp migration + consolidated `Scripts/ArchLucid.sql`: unique index on `(RunId, TaskId, AgentType)` (confirm cardinality — one row per agent type per task per run).
2. Change `CreateAsync` to **MERGE** or delete-then-insert for that key (mirror `AgentResultRepository` pattern), or skip insert when row exists unless **TB-035** multi-attempt model requires child rows (if so, use `(RunId, TaskId, AgentType, AttemptIndex)` unique key instead — coordinate with **TB-035**).
3. Backfill / dedupe strategy for existing duplicates (keep latest `CreatedUtc` per key).
4. Tests: retry execute → single trace row per task (or explicit attempt index set if **TB-035** shipped first).

**Out of scope:** Trace blob re-upload idempotency (existing blob keys are content-addressed per trace id).

**Depends on:** Prefer locking schema with **TB-035** attempt-index design before migration if both ship in same release.

**Affected files / projects:**

- `ArchLucid.Persistence/Data/Repositories/AgentExecutionTraceRepository.cs`
- `ArchLucid.AgentRuntime/AgentExecutionTraceRecorder.cs`
- DbUp migration scripts

**Size estimate:** **XS** — ~2–4 h.

---

## TB-045 — Embedding model identity and drift guard

**Status:** Done (Batch G, 2026-05-26).

**Source:** Retrieval correctness & drift audit (2026-05-26). `RetrievalChunk` stores embeddings without model id or dimension; deployment name is config-only; dimension mismatch yields silent zero cosine scores.

**Problem:** Swapping embedding deployment (or mixing `FakeEmbeddingService` with Azure) leaves incompatible vectors in the same index. Queries degrade with no operator signal.

**What to do:** See **RAG-V1-007** in [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](RAG_QUALITY_TECHNICAL_BACKLOG.md). Summary:

1. Add `EmbeddingModelId` + `EmbeddingDimension` to `RetrievalChunk`.
2. Query-time filter/metric on dimension mismatch.
3. Startup compare config vs index metadata → full re-embed on change.

**Schedule under:** **TB-021** / assessment **CPB-T21** when retrieval correctness work is active.

**Affected files:** `ArchLucid.Retrieval/Models/RetrievalChunk.cs`, `Indexing/InMemoryVectorIndex.cs`, `Indexing/RetrievalIndexingService.cs`, `Embedding/AzureOpenAiEmbeddingClient.cs`.

**Size estimate:** **S–M** — ~1–2 eng days.

---

## TB-046 — Index freshness, ContentHash skip, and indexer observability

**Source:** Retrieval correctness & drift audit (2026-05-26). `ContentHash` on documents is never read at index time; startup indexers fail-open; no freshness metric.

**What to do:** See **RAG-V1-008**. Priority within item: **ContentHash skip (P0)** → last-indexed-at + health signal → optional scheduled re-index.

**Schedule under:** **TB-021**. Coordinate with **RAG-V1-009** (chunking fingerprint) for skip logic.

**Affected files:** `RetrievalIndexingService.cs`, `*CorpusStartupIndexerHostedService.cs`, `RetrievalDocument.cs`.

**Size estimate:** **S–M** — ~1–2 eng days.

---

## TB-047 — Chunking strategy fingerprint and invalidation

**Source:** Retrieval correctness & drift audit (2026-05-26). Chunk parameters are hardcoded method defaults; changing them produces mixed-generation indexes with no invalidation.

**What to do:** See **RAG-V1-009**. Store chunking fingerprint on chunks; move defaults to `IOptions`; invalidate stale chunk IDs on fingerprint change.

**Schedule under:** **TB-021**. Depends on **TB-046** ContentHash/fingerprint coordination for skip vs invalidate semantics.

**Affected files:** `ArchLucid.Retrieval/Chunking/*.cs`, `RetrievalIndexingService.cs`.

**Size estimate:** **S** — ~1 eng day.

---

## TB-048 — Tenancy isolation hardening (retrieval)

**Status:** Done (Batch G, 2026-05-26). **Remaining gap:** production Azure Search client + delete path — see **TB-071** / **RAG-V1-010** P1.

**Source:** Retrieval correctness & drift audit (2026-05-26). `InMemoryVectorIndex` treats `AllowedPolicyPackRulePackIds == null` as allow-all for policy packs. Azure Search filter path not auditable in-repo.

**What to do:** See **RAG-V1-010**. **P0:** safe default on null assignment list + integration test. **P1:** Azure Search tenant `$filter` when client ships — tracked as **TB-071**.

**Schedule under:** **TB-021** — treat as **security** item; pick up before broad MCP retrieval exposure (**TB-032**).

**Affected files:** `InMemoryVectorIndex.cs`, `RetrievalQueryService.cs`, future `AzureAiSearchVectorIndex` client.

**Size estimate:** **S** — ~1 eng day.

---

## TB-049 — Retrieval IR eval harness (recall@k, MRR)

**Source:** Retrieval correctness & drift audit (2026-05-26). No recall@k, precision@k, MRR, or NDCG. Existing **RAG-V1-005** / `RetrievalFaithfulnessEvaluator` measures output citation coverage only.

**What to do:** See **RAG-V1-011**. Golden dataset + `scripts/ci/eval_retrieval_ir.py` + CI floor on recall@5 and MRR.

**Schedule under:** **TB-021** alongside **RAG-V1-005** — complementary gates (retrieval quality vs output faithfulness).

**Affected files:** `tests/eval-datasets/retrieval-golden/`, `scripts/ci/eval_retrieval_ir.py`, `ArchLucid.Retrieval.Tests/`.

**Size estimate:** **M** — ~2–3 eng days.

---

## TB-050 — Manifest `ResolvedArchitectureDecision` — confidence + `ConfidenceSource`

**Source:** Decisioning explainability and uncertainty audit (2026-05-27). Operator-facing manifest decisions are built in `DefaultGoldenManifestBuilder` from accepted findings; the persisted type has no confidence field.

**Problem:**

`ResolvedArchitectureDecision` (`ArchLucid.Core/Manifest/ResolvedArchitectureDecision.cs`) exposes category, title, selected option, rationale, and supporting finding IDs — but **no numeric confidence** and no indication of whether confidence was measured, defaulted, or absent. Finding-level `ConfidenceScore` / `EvaluationConfidenceScore` may exist on upstream findings yet are **not projected** onto the decision row an operator reads in the manifest or governance UI. This is the highest-impact explainability gap for the authority production path.

**What to do:**

1. Add nullable `double? Confidence` and `DecisionConfidenceSource` (or string enum) to `ResolvedArchitectureDecision` and contract DTOs — values such as `RuleEngine`, `FindingAggregate`, `LlmAgent`, `Calibrated`, `Unknown`, `NotComputed`.
2. Populate in `DefaultGoldenManifestBuilder` from the winning finding’s `EvaluationConfidenceScore` (preferred) or `ConfidenceScore`, with explicit `Unknown` when both are null — **never** silently substitute a constant.
3. OpenAPI snapshot + codegen per [`API_CONTRACTS.md`](API_CONTRACTS.md); UI types if manifest decision surfaces expose the field.
4. Tests: accepted finding with score → decision carries score + source; null scores → `Unknown` not `0`.

**Out of scope:** Changing rule-engine acceptance semantics; V2 `DecisionNode` scoring (see **TB-051**, **TB-054**).

**Depends on:** none (orthogonal to **TB-053** finding-level calculator fixes).

**Affected files / projects:**

- `ArchLucid.Core/Manifest/ResolvedArchitectureDecision.cs`
- `ArchLucid.Decisioning/Manifest/Builders/DefaultGoldenManifestBuilder.cs`
- `ArchLucid.Contracts` persistence/manifest DTOs
- `ArchLucid.Decisioning.Tests/`, API contract tests

**Size estimate:** **S** — ~1 eng day.

---

## TB-051 — Decisioning V2 merge — consume `CalibratedConfidence`

**Source:** Decisioning explainability and uncertainty audit (2026-05-27). `AgentConfidenceCalibrationService` writes `CalibratedConfidence` on `AgentResult`; V2 strategies and `DecisionNode.Confidence` use raw `Confidence` and hardcoded `BaseConfidence` priors (`TopologyAcceptanceDecisionStrategy`, `SecurityControlsDecisionStrategy`, `ComplexityDecisionStrategy`).

**Problem:**

Operators and replay tooling cannot distinguish calibrated uncertainty from raw model self-report or strategy literals. Calibrated values are **dead data** in the decisioning path — a silent loss of uncertainty signal after calibration runs.

**What to do:**

1. In each `IDecisionStrategy` implementation, prefer `AgentResult.CalibratedConfidence` when present; fall back to `Confidence` only when calibration is null; document fallback in strategy remarks.
2. Persist which source was used on `DecisionOption` metadata or `RunEventTrace` metadata (`confidenceSource: calibrated | raw | strategyPrior`).
3. Replace or gate hardcoded `BaseConfidence` literals — either derive from evaluation evidence or mark `strategyPrior` explicitly in trace metadata so operators know the score is not measured.
4. Tests: calibrated present → merge uses it; absent → raw; neither → `Unknown` / explicit prior with source label.

**Out of scope:** Re-tuning calibration algorithm (AgentRuntime); authority `RuleBasedDecisionEngine` path (**TB-050**, **TB-052**).

**Depends on:** none.

**Affected files / projects:**

- `ArchLucid.Decisioning/Merge/DecisionEngineV2.cs`
- `ArchLucid.Decisioning/Merge/*DecisionStrategy.cs`
- `ArchLucid.Decisioning/Merge/DecisionMergeTraceRecorder.cs`
- `ArchLucid.AgentRuntime` (read-only — calibration already exists)
- `ArchLucid.Decisioning.Tests/`

**Size estimate:** **S** — ~1 eng day.

---

## TB-052 — `RuleAuditTracePayload` — snapshot IDs + prompt refs

**Source:** Decisioning explainability and uncertainty audit (2026-05-27). Authority pipeline persists `RuleAuditTracePayload` with rule set identity and applied/rejected finding IDs; manifest carries snapshot IDs separately.

**Problem:**

An operator with only the rule audit trace cannot join it to the **exact** context/graph/findings input state evaluated, nor to **prompt template id/version** that produced LLM-backed findings. Criteria values that matched each rule are not recorded (only notes for unmatched findings). Cross-navigation requires correlating manifest snapshot IDs manually.

**What to do:**

1. Extend `RuleAuditTracePayload` (Contracts + DbUp + consolidated SQL per repo DDL rules) with `ContextSnapshotId`, `GraphSnapshotId`, `FindingsSnapshotId` (copy from manifest at trace write time).
2. Add bounded `PromptRefs` collection (template id + version + optional agent type) aggregated from accepted findings’ `PromptTemplateId` / `PromptTemplateVersion`.
3. Populate in `RuleBasedDecisionEngine` / trace persistence before commit.
4. Expose new fields on decision-trace API; update `ProvenanceBuilder` if it consumes audit payload (**TB-036** correlation remains complementary).
5. Tests: authority run → trace contains snapshot IDs; LLM finding with prompt refs → refs appear on trace.

**Out of scope:** Full criteria-value snapshot per rule (optional follow-up); replay merge path `RunEventTrace` (**TB-054**).

**Depends on:** none.

**Affected files / projects:**

- `ArchLucid.Contracts/Persistence/DecisionTraces/RuleAuditTracePayload.cs`
- `ArchLucid.Decisioning/Services/RuleBasedDecisionEngine.cs`
- `ArchLucid.Persistence` decision-trace repository + migration
- `ArchLucid.Api` trace detail endpoints

**Size estimate:** **S** — ~1 eng day.

---

## TB-053 — `FindingConfidenceCalculator` — typed unknown/failed (no bare catch)

**Source:** Decisioning explainability and uncertainty audit (2026-05-27). Finding-level confidence feeds manifest and operator trust surfaces.

**Problem:**

- `FindingConfidenceCalculator.cs` (~line 47): null `traceCompletenessRatio` is treated as **`0.0`**, not “unknown” — depresses scores as if the trace were empty.
- `FindingConfidenceCalculator.cs` (~lines 66–68): bare `catch { return null; }` swallows arithmetic failures; callers cannot distinguish **not computed** vs **failed**.
- `FindingFactory.CreateFromAgentArchitectureFinding` (~line 178): `ConfidenceScore ?? agentResult.Confidence` coerces null to agent aggregate — drops explicit unknown.

**What to do:**

1. Introduce `FindingConfidenceResult` (or similar) with `Score`, `Status` (`Computed`, `Unknown`, `Failed`), optional `FailureReason` (internal log detail only if PII-sensitive).
2. Replace bare catch with typed catch + log + `Failed` status.
3. Map null completeness ratio → `Unknown`, not `0.0`; document contract on `IFindingConfidenceCalculator`.
4. Update `FindingFactory` to set `ConfidenceScore` only when status is `Computed`; leave null + `ConfidenceLevel` / metadata when unknown.
5. Unit tests for all three paths; regression on `ExplainabilityTraceCompletenessAnalyzer` interaction.

**Out of scope:** `NullFindingsSnapshotEvaluationConfidenceEnricher` host registration policy (**TB-056**); manifest projection (**TB-050**).

**Depends on:** **TB-050** should consume the new semantics when both ship together.

**Affected files / projects:**

- `ArchLucid.Decisioning/Findings/FindingConfidenceCalculator.cs`
- `ArchLucid.Decisioning/Findings/FindingFactory.cs`
- `ArchLucid.Decisioning/Findings/ExplainabilityTraceCompletenessAnalyzer.cs`
- `ArchLucid.Decisioning.Tests/`

**Size estimate:** **XS–S** — ~4–8 h.

---

## TB-054 — Unified run decision explainability API (authority audit + V2 nodes)

**Source:** Decisioning explainability and uncertainty audit (2026-05-27). Production authority runs persist `RuleAuditTracePayload`; `DecisionNode` rows are materialized **post-commit** via `EnsureDecisionEngineV2NodesMaterializedAsync` and are not the same record as rule audit.

**Problem:**

Operators hitting `GET …/decisions` or trace endpoints see **either** rule-audit semantics **or** V2 weighted nodes — not a single explainability view per `RunId`. `DecisionTraceManifestAttachment` wires run-event trace IDs (merge/replay path) only. Provenance (**TB-036**) links graph nodes to agent traces but does not unify the two decision pipelines.

**What to do:**

1. Define `RunDecisionExplainabilityDto` (or extend existing run detail) with sections: `AuthorityRuleAudit`, `CoordinatorDecisionNodes`, shared `SnapshotIds`, `PromptRefs`, per-decision confidence + source.
2. Application query joins `RuleAuditTrace`, manifest `Decisions`, persisted `DecisionNode`s, and optional provenance correlation IDs (**TB-036**).
3. Label each row with `pipeline: authority | coordinator_v2` so operators know provenance.
4. OpenAPI + UI contract; pair with trace viewer deep links when `AgentExecutionTraceId` present.
5. Integration test: authority run → single response contains audit + materialized V2 nodes when applicable.

**Out of scope:** Merging the two pipelines into one engine (architectural); **TB-029** notifications decoupling.

**Depends on:** **TB-050**–**TB-052** for field completeness; **TB-036** for trace deep links.

**Affected files / projects:**

- `ArchLucid.Application` run/decision query services
- `ArchLucid.Api` controllers + response models
- `ArchLucid.Application/Runs/…/AuthorityDrivenArchitectureRunCommitOrchestrator.cs` (materialization timing docs)
- `archlucid-ui` run detail / governance surfaces (follow-on UI slice)

**Size estimate:** **M** — ~2–3 eng days.

---

## TB-055 — Propagate `AgentResult.ReasoningTrace` into `Finding` explainability

**Source:** Decisioning explainability and uncertainty audit (2026-05-27). LLM agent forensics exist on `AgentResult` but are not copied into durable findings.

**Problem:**

`FindingFactory.CreateFromAgentArchitectureFinding` builds a minimal `ExplainabilityTrace` (evidence notes only). `AgentResult.ReasoningTrace` is **not** persisted on `Finding` or `ExplainabilityTrace`, so manifest decisions and rule audit cannot be traced to model reasoning text without a separate agent-trace lookup.

**What to do:**

1. Add optional `ReasoningTrace` (bounded length) to `ExplainabilityTrace` or `Finding` contract — truncate with hash reference to blob if over limit.
2. Copy from `AgentResult` in `FindingFactory` when creating agent-backed findings.
3. Include in provenance / explainability API payloads (**TB-054**).
4. Tests: agent finding → trace contains reasoning substring; over-limit → truncated + stable hash id.

**Out of scope:** Storing full prompt/response blobs (already on `AgentExecutionTrace` — **TB-033**, **TB-034**).

**Depends on:** none (complements **TB-036**, **TB-054**).

**Affected files / projects:**

- `ArchLucid.Contracts/Findings/ExplainabilityTrace.cs`
- `ArchLucid.Decisioning/Findings/FindingFactory.cs`
- DbUp migration if new column on findings table
- `ArchLucid.Decisioning.Tests/`

**Size estimate:** **S** — ~1 eng day.

---

## TB-056 — Decisioning partial-failure surfacing + sentinel trace inflation guard

**Source:** Decisioning explainability and uncertainty audit (2026-05-27). Multiple paths degrade uncertainty without operator-visible signals.

**Problem:**

| Location | Behaviour |
|----------|-----------|
| `FindingsOrchestrator.cs` (~88–105) | Per-engine `catch` → log + `FindingEngineFailure` + **continue**; partial snapshot saved with no manifest-level summary |
| `FindingsSnapshotEvaluationConfidenceEnricher.cs` (~107–115) | Enrichment failure → warning only; snapshot lacks `EvaluationConfidenceScore` |
| `NullFindingsSnapshotEvaluationConfidenceEnricher` | No-op registered via `TryAdd` in lightweight hosts — indistinguishable from “not run” |
| `ExplainabilityTraceMarkers` sentinel | `AlternativePathsConsidered` filled with deterministic placeholder; completeness analyzer treats as populated |
| `DefaultGoldenManifestBuilder` | `payload is null` → `continue` — finding omitted from manifest section silently |

**What to do:**

1. Add manifest- or run-level `FindingEngineFailures` summary (engine id, error class, timestamp) when orchestrator continues after partial failure; surface on run detail API (**TB-054**).
2. Metric `archlucid_findings_engine_partial_failure_total`; optional warning on manifest `Notes` when any engine failed.
3. Register explicit “enricher skipped” flag on findings snapshot metadata when `NullFindingsSnapshotEvaluationConfidenceEnricher` is active (host profile), not silent no-op.
4. Exclude sentinel `AlternativePathsConsidered` from `ExplainabilityTraceCompletenessAnalyzer` ratio (or remove sentinel — prefer real empty + `Unknown` in **TB-053**).
5. When `DefaultGoldenManifestBuilder` skips null payload, append manifest warning referencing finding id/title.

**Out of scope:** Failing the entire run on single engine failure (product decision); **TB-034** degraded agent traces.

**Depends on:** **TB-053** for completeness semantics; **TB-054** for API surfacing.

**Affected files / projects:**

- `ArchLucid.Decisioning/Services/FindingsOrchestrator.cs`
- `ArchLucid.Decisioning/Findings/ExplainabilityTraceCompletenessAnalyzer.cs`
- `ArchLucid.Decisioning/Findings/ExplainabilityTraceMarkers.cs`
- `ArchLucid.Decisioning/Manifest/Builders/DefaultGoldenManifestBuilder.cs`
- `ArchLucid.AgentRuntime/Evaluation/FindingsSnapshotEvaluationConfidenceEnricher.cs`
- `ArchLucid.Host.Composition/…/ServiceCollectionExtensions.CorePersistencePortCompatibility.cs`

**Size estimate:** **S–M** — ~1–2 eng days.

---

## TB-057 — Architecture risk register framing over governance findings

**Source:** Commercial stickiness review (2026-05-27). ArchLucid already has cross-review findings, monitored risks, signed manifests, governance decisions, and audit. The gap is not a missing risk engine; it is that operators do not see one durable, owned risk register over time.

**Problem:**

`/governance/findings` already aggregates findings and decisions, but it reads like a findings queue rather than a customer-owned architecture risk register. Without owner, disposition, due date, review cadence, waiver expiry, aging, and correlation columns, ArchLucid can still feel like a point-in-time assessment tool.

**What to do:**

1. Reframe `/governance/findings` as the **Architecture Risk Register** in operator copy, nav labels, and empty states where appropriate. Avoid introducing a separate `RiskRegister` aggregate unless existing findings/manifest semantics cannot represent the workflow.
2. Add risk-register columns and filters backed by existing or newly added finding-review metadata: owner, disposition, due date, review cadence, last reviewed UTC, aging, waiver expiry, severity, status, and linked review / manifest.
3. Treat manifest **monitored risks** and warning-severity findings as register entries when they cross review boundaries.
4. Add stale-risk logic: a risk is stale when it has no review event after the configured cadence, or when its waiver expires.
5. Keep export shape buyer-friendly: system, risk, impact, owner, decision needed, current disposition, evidence link, last reviewed, next review.

**Acceptance criteria:**

- An operator can answer "what risks do we own right now?" from `/governance/findings` without opening individual reviews.
- Findings, monitored risks, and manifest decisions are linked, not duplicated into a second subsystem.
- Stale risks and expiring waivers are visible in list filters.
- Export uses buyer-facing language and cites review / manifest evidence.

**Affected files / projects:**

- `archlucid-ui/src/app/(operator)/governance/findings/`
- `ArchLucid.Api/Controllers/Governance/*`
- `ArchLucid.Application/Governance/*`
- `ArchLucid.Persistence/Governance/*`
- `ArchLucid.Contracts/Findings/*`
- `docs/library/GOVERNANCE_WORKFLOW_UI.md`

**Size estimate:** **S–M** — mostly UI/query projection if **TB-058** supplies disposition metadata.

---

## TB-058 — Finding disposition workflow API + UI

**Source:** Commercial stickiness review (2026-05-27). `dbo.FindingReviewEvents` / review-trail plumbing exists and appears to feed ROI rollups, but operators need a visible workflow for accepting, deferring, requesting evidence, and marking remediation.

**Problem:**

Finding feedback and advisory recommendation statuses exist, but there is no obvious public operator loop for durable finding disposition. That weakens trust and stickiness because ArchLucid remembers analysis, but not enough of the human decision trail.

**What to do:**

1. Add a small API over `FindingReviewEvents` for dispositions: `Accepted`, `Deferred`, `NeedsEvidence`, `Remediated`, and `RejectedAsNotApplicable`.
2. Require rationale for `Accepted`, `Deferred`, and `RejectedAsNotApplicable`; require revisit date for `Deferred`; require evidence request text for `NeedsEvidence`.
3. Add list and detail UI actions on finding inspect and governance findings queue.
4. Surface latest disposition, actor, timestamp, and rationale on finding detail.
5. Emit durable audit events for each disposition change.
6. Feed disposition changes into existing ROI/value rollups only when the status represents real work completed or risk accepted; do not count mere clicks as value.

**Acceptance criteria:**

- A finding can be dispositioned without leaving ArchLucid.
- Latest disposition and full history are visible.
- Audit trail includes actor, timestamp, finding id, run id, disposition, and rationale metadata.
- Deferred findings appear in a revisit-needed filter when their revisit date arrives.

**Affected files / projects:**

- `ArchLucid.Persistence/Scripts/ArchLucid.sql`
- `ArchLucid.Persistence/*FindingReview*`
- `ArchLucid.Api/Controllers/*`
- `ArchLucid.Application/*FindingReview*`
- `archlucid-ui/src/app/(operator)/reviews/[runId]/findings/[findingId]/`
- `archlucid-ui/src/app/(operator)/governance/findings/`
- `ArchLucid.Api.Client/Generated/ArchLucidApiClient.g.cs` after OpenAPI regeneration

**Size estimate:** **M** — API, persistence, UI, audit, and tests.

---

## TB-059 — First-class waiver / exception records

**Source:** Commercial stickiness review (2026-05-27). Waivers are the highest-leverage missing governance object because enterprise buyers need controlled risk acceptance, expiry, and evidence.

**Problem:**

ArchLucid has governance approvals, policy packs, findings, audit, and copy around accepted risks, but no first-class waiver / exception workflow with rationale, owner, expiration, linked evidence, and renewal/expiry behavior. A simple "accepted" status is not enough for enterprise governance.

**What to do:**

1. Add a `Waiver` / `RiskException` model linked to finding id, run id, manifest id, policy rule id when available, tenant, owner, expiration UTC, rationale, and evidence links.
2. Store DDL in the single consolidated SQL file plus DbUp migration per repo SQL discipline.
3. Require expiration and rationale; no indefinite waiver without an explicit owner decision.
4. Wire waiver create/renew/expire/revoke flows through the same governance approval and audit posture used elsewhere.
5. Surface expiring and expired waivers in `/governance/findings`, governance dashboard, and digest inputs.
6. Make waiver effects explicit: waived risk is not "fixed"; it remains monitored until remediated or expired.

**Acceptance criteria:**

- Waiver creation requires rationale, owner, evidence, and expiration.
- Expired waivers re-open decision-needed state.
- Audit export can prove who accepted risk and why.
- Digests and risk-register filters highlight expiring waivers.

**Affected files / projects:**

- `ArchLucid.Contracts/Governance/*`
- `ArchLucid.Persistence/Scripts/ArchLucid.sql`
- `ArchLucid.Persistence/Governance/*`
- `ArchLucid.Application/Governance/*`
- `ArchLucid.Api/Controllers/Governance/*`
- `archlucid-ui/src/app/(operator)/governance/*`
- `docs/library/STATE_MACHINES.md`
- `docs/library/AUDIT_COVERAGE_MATRIX.md`

**Size estimate:** **M** — new governed object, but can reuse approval/audit patterns.

---

## TB-060 — Review-package decision register consolidation

**Source:** Commercial stickiness review (2026-05-27). `ResolvedArchitectureDecision`, signed manifests, approval lineage, rationale endpoints, and audit already form a decision record system, but the product should expose that fact directly.

**Problem:**

Manifest decisions are valuable, but users may experience them as run artifacts instead of a durable decision register. Creating a separate ADR-like store would duplicate the source of truth and create reconciliation problems.

**What to do:**

1. Add a **Decision Register** view over existing signed manifest decisions, governance approval lineage, and audit events.
2. Link each decision to review, manifest, supporting findings, rationale, approval request, and current environment activation when available.
3. Add filters for decision category, status, environment, date, owner/approver, and confidence source after **TB-050** ships.
4. Use executive language: decision made, evidence, risk if ignored, business impact, owner, and next review.
5. Do not add a new decision table unless a required field cannot be derived from manifest + approval + audit history.

**Acceptance criteria:**

- Operators can browse durable decisions across reviews without opening each manifest manually.
- Each decision can be traced to supporting findings and approval lineage.
- The view labels uncertainty / confidence source when available.
- There is no second, conflicting decision lifecycle.

**Affected files / projects:**

- `ArchLucid.Core/Manifest/ResolvedArchitectureDecision.cs`
- `ArchLucid.Api/Controllers/Governance/*`
- `ArchLucid.Application/Governance/*`
- `archlucid-ui/src/app/(operator)/governance/*`
- `archlucid-ui/src/app/(operator)/manifests/[manifestId]/`

**Size estimate:** **S** — mostly query/view consolidation if existing lineage endpoints are sufficient.

---

## TB-061 — Decision-needed governance digest

**Source:** Commercial stickiness review (2026-05-27). Existing digests and executive email plumbing can drive recurring management rhythm if they focus on decisions, stale risk, and value delivered.

**Problem:**

Generic summaries do not create durable operating habits. A sticky digest must tell leaders what changed, what decision is needed, which risks are stale, which waivers are expiring, and what value was delivered.

**What to do:**

1. Extend digest generation with a **decision-needed** section: approvals pending, stale risks, deferred items due, expiring waivers, high-severity unowned findings, and evidence requests.
2. Add "what changed since last digest" using compare / recent delta / compliance drift sources.
3. Add "value delivered" using live ROI and completed disposition events, with assumptions visible and no fake precision.
4. Support role-aware variants: executive, architect, compliance, and engineering.
5. Keep scheduling and delivery on existing digest subscription / exec digest paths.

**Acceptance criteria:**

- A weekly digest can drive a governance meeting without manual assembly.
- Digest separates FYI from "decision needed".
- Each item links to finding, decision, waiver, approval, or evidence.
- No mock values are included in customer-facing digest output.

**Affected files / projects:**

- `ArchLucid.Api/Controllers/Advisory/*`
- `ArchLucid.Application/Advisory/*Digest*`
- `ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs`
- `ArchLucid.Persistence/Governance/*`
- `archlucid-ui/src/app/(operator)/digests/`
- `docs/library/PRODUCT_PACKAGING.md`

**Size estimate:** **S–M** — projection and template work over existing data.

---

## TB-062 — Executive dashboard live KPI replacement

**Source:** Commercial stickiness review (2026-05-27). Executive Value Visibility and Proof-of-ROI Readiness improve more from fewer live, defensible numbers than from broader illustrative dashboards.

**Problem:**

Any executive card that mixes live ROI with mock or illustrative KPIs weakens trust. Buyers will treat the whole dashboard as less reliable if they cannot tell what is measured versus sample/demo content.

**What to do:**

1. Inventory executive dashboard cards and identify which are live, mock, illustrative, or simulator-backed.
2. Replace mock KPI cards with `ExecutiveRoiSummary`, compliance drift trend, finding disposition counts, waiver expiry counts, and completed-review counts where live data exists.
3. Clearly label simulator/demo values if they remain in demo-only routes; do not show them in production executive surfaces.
4. Prefer fewer cards with inspectable assumptions over a comprehensive dashboard with weak provenance.
5. Add regression tests or fixture assertions that production executive pages do not import mock KPI modules.

**Acceptance criteria:**

- Production executive dashboard uses live APIs or explicit empty states.
- No mock-looking KPI appears without a demo/simulator label.
- ROI assumptions are inspectable.
- Executive page can answer top risks, decisions needed, and value delivered.

**Affected files / projects:**

- `archlucid-ui/src/app/(operator)/dashboard/`
- `archlucid-ui/src/app/(operator)/executive/`
- `archlucid-ui/src/lib/*executive*mock*`
- `ArchLucid.Api/Controllers/Analytics/RoiAnalyticsController.cs`
- `ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs`

**Size estimate:** **S** — UI cleanup plus data-source alignment.

---

## TB-063 — ITSM one-click issue creation from findings — **V1.1**

**Source:** Commercial stickiness review (2026-05-27) plus owner scope: first-party Jira / ServiceNow productization is **V1.1**, not V1 GA. See [`V1_SCOPE.md`](V1_SCOPE.md) §2.13 and [`V1_DEFERRED.md`](V1_DEFERRED.md) §6.

**Problem:**

ArchLucid has backend ITSM primitives (`POST /v1/integrations/itsm/outbound/issues`, `ItsmFindingCorrelations`, inbound webhook sync), but the UI appears closer to copy-as-work-item than one-click operational embedding. That leaves workflow stickiness on the table. However, first-party ITSM is explicitly V1.1 scope, so this must not be treated as a V1 GA blocker.

**What to do in V1.1:**

1. Add a one-click **Create Jira issue** / **Create ServiceNow incident** action from finding detail and risk-register rows when tenant ITSM settings are configured.
2. Reuse `POST /v1/integrations/itsm/outbound/issues`; do not create target-specific finding projection schemas.
3. Show existing external issue link when `ItsmFindingCorrelations` already has a row; prevent duplicate creation or require explicit override.
4. Preserve evidence links, recommended action, severity, owner, due date, waiver/disposition state, and expected outcome in created work items.
5. Surface sync status and last inbound update on the finding/risk row.
6. Keep credentials in Key Vault / configuration references; no secrets in source or SQL rows beyond approved secret-name references.

**Acceptance criteria for V1.1:**

- From a finding, an operator can create a Jira / ServiceNow item without copying Markdown manually.
- Duplicate creation is blocked or clearly warned.
- ArchLucid stores and displays the external issue URL/id.
- Inbound status sync updates the finding state according to configured mapping.
- Audit events capture create success, skip, failure, and inbound status update.

**Affected files / projects:**

- `ArchLucid.Api/Controllers/Integrations/ItsmOutboundIssuesController.cs`
- `ArchLucid.Api/Controllers/Integrations/ItsmInboundWebhooksController.cs`
- `ArchLucid.Application/Integrations/Itsm/*`
- `ArchLucid.Persistence/Scripts/ArchLucid.sql`
- `archlucid-ui/src/app/(operator)/reviews/[runId]/findings/[findingId]/`
- `archlucid-ui/src/app/(operator)/governance/findings/`
- `docs/go-to-market/INTEGRATION_CATALOG.md`
- `docs/library/V1_SCOPE.md` §2.13 if scope changes

**Size estimate:** **M** — UI productization over existing backend, plus sync-state display and tests.

---

## TB-064 — System catalog consolidated DDL (`ArchLucid.System.sql`)

**Source:** DDL hygiene and migration-safety audit (2026-05-27). Tenant catalog has a proper consolidated file (`ArchLucid.Persistence/Scripts/ArchLucid.sql`); system catalog does not.

**Problem:**

`ArchLucid.System.sql` is a nine-line pointer stub. System-plane objects (`Tenants` directory shape, `TenantDatabaseBindings`, `TenantDatabaseProvisioningJobs`, warm-catalog standby) exist only as three discrete files under `Migrations/System/`. That violates the repo **one DDL file per DB** rule and makes greenfield system-catalog provisioning harder to review than tenant DDL.

**What to do:**

1. Author a full idempotent consolidated `ArchLucid.Persistence/Scripts/ArchLucid.System.sql` mirroring the tenant pattern (`IF OBJECT_ID … IS NULL` + inline indexes).
2. Keep `Migrations/System/001–003` as the authoritative DbUp upgrade path for brownfield; update consolidated DDL whenever those migrations change.
3. Wire `SqlSchemaBootstrapper` (or a dedicated system bootstrapper) into the system-catalog startup path after `DatabaseMigrator.RunSystem`, matching tenant **DbUp-first → bootstrap** order documented in [`SQL_SCRIPTS.md`](SQL_SCRIPTS.md) §1.
4. Update [`SQL_SCRIPTS.md`](SQL_SCRIPTS.md) §2 inventory and the schema-change checklist in §5.
5. Extend `DatabaseMigrationScriptTests` or a small architecture test asserting system consolidated DDL exists and lists expected tables.

**Acceptance criteria:**

- One readable consolidated DDL file describes the entire system catalog.
- Greenfield system catalog provisioning does not require reading three migration files.
- Forward system migrations and consolidated DDL stay in parity (same rule as tenant `ArchLucid.sql`).

**Affected files / projects:**

- `ArchLucid.Persistence/Scripts/ArchLucid.System.sql`
- `ArchLucid.Persistence/Migrations/System/*.sql`
- `ArchLucid.Persistence/Sql/SqlSchemaBootstrapper.cs`
- `ArchLucid.Host.Core/Startup/ArchLucidPersistenceStartup.cs`
- `docs/library/SQL_SCRIPTS.md`

**Size estimate:** **S** — ~4–8 h.

---

## TB-065 — MigrateVerify — deployed schema vs DDL drift detection

**Source:** DDL hygiene and migration-safety audit (2026-05-27). `Persistence.MigrateVerify` applies DbUp only; it does not compare live schema to DDL.

**Problem:**

`ArchLucid.Persistence.MigrateVerify` runs `DatabaseMigrator.Run` against an empty catalog and asserts `dbo.SchemaVersions` has rows. `DbUpMigrationStatusEvaluator` compares **embedded script names** to journal rows only. Neither detects:

- Column-level drift (missing columns, wrong nullability or types)
- Divergence between DbUp migrations and `ArchLucid.sql` bootstrap output
- Manual DDL edits on a live database
- Rewritten migration script content (journal name unchanged)

**What to do:**

1. After DbUp (and optional bootstrap), query `INFORMATION_SCHEMA.COLUMNS`, `sys.indexes`, and `sys.foreign_keys` for a curated sentinel set of tables/columns/indexes derived from `ArchLucid.sql` (or a compiled manifest checked into the repo).
2. Fail CI when live catalog shape differs from expected manifest.
3. Optionally: provision two empty catalogs — DbUp-only vs DbUp+bootstrap — and assert zero structural drift between them (closes the two-pathway gap in [`SQL_SCRIPTS.md`](SQL_SCRIPTS.md) §1).
4. Extend Tier 1.5 GitHub Actions job (or add a sibling job) to run the drift check after existing MigrateVerify.
5. Document operator interpretation in [`SQL_SCRIPTS.md`](SQL_SCRIPTS.md) §6 troubleshooting.

**Acceptance criteria:**

- CI fails when a forward migration ships without matching `ArchLucid.sql` column/index parity (beyond the existing PR diff gate on file touch).
- CI fails when a catalog is missing a sentinel column or index after MigrateVerify.
- Drift report names table, object, expected vs actual (actionable for DBAs).

**Affected files / projects:**

- `ArchLucid.Persistence.MigrateVerify/Program.cs`
- `ArchLucid.Persistence/Data/Infrastructure/DbUpMigrationStatusEvaluator.cs` (or new evaluator)
- `ArchLucid.Persistence.Tests/` (fixture + contract tests)
- `scripts/ci/` (new or extended check)
- `.github/workflows/` (Tier 1.5 job)
- `docs/library/SQL_SCRIPTS.md`

**Size estimate:** **M** — ~1–2 eng days.

---

## TB-066 — CI gate — `ArchLucid_Unified_Schema.sql` matches generator output

**Source:** DDL hygiene and migration-safety audit (2026-05-27). `ArchLucid_Unified_Schema.sql` is generated by `scripts/ci/build_archlucid_unified_schema_sql.py` for IaC alignment but is not validated in CI.

**Problem:**

The checked-in unified schema file can drift from `ArchLucid.sql` when developers update migrations and consolidated DDL but forget to regenerate. There is no merge-blocking check analogous to OpenAPI contract snapshots.

**What to do:**

1. Add `scripts/ci/check_archlucid_unified_schema_snapshot.ps1` / `.sh` (or extend an existing script) that runs the generator and diffs output against `ArchLucid.Persistence/Scripts/ArchLucid_Unified_Schema.sql`.
2. Wire the check into PR CI (same posture as `check_openapi_contract_snapshot`).
3. Document regenerate command in [`SQL_SCRIPTS.md`](SQL_SCRIPTS.md) §2 and schema-change checklist §5.
4. Optionally pair with `update_archlucid_unified_schema_snapshot` helper scripts mirroring OpenAPI update scripts.

**Acceptance criteria:**

- PR fails when unified schema snapshot is stale.
- Contributor docs state when to run the update script (any `ArchLucid.sql` change).

**Affected files / projects:**

- `scripts/ci/build_archlucid_unified_schema_sql.py`
- `scripts/ci/check_archlucid_unified_schema_snapshot.*`
- `ArchLucid.Persistence/Scripts/ArchLucid_Unified_Schema.sql`
- `docs/library/SQL_SCRIPTS.md`

**Size estimate:** **XS** — ~2–4 h.

---

## TB-067 — `SQL_SCRIPTS.md` migration catalog — backfill 051–227 + automation

**Source:** DDL hygiene and migration-safety audit (2026-05-27). §4.2 catalog stops around migration ~050 plus a handful of later entries; migrations **051–227** are largely undocumented.

**Problem:**

Operators and contributors cannot rely on [`SQL_SCRIPTS.md`](SQL_SCRIPTS.md) §4.2 for deploy history or intent. The schema-change checklist requires updating §4.2 for every migration, but enforcement has lapsed (~170 migrations missing).

**What to do:**

1. Backfill §4.2 with one-line summaries for migrations **051–227** (parse migration file headers where present; otherwise derive from filename and first comment block).
2. Add a CI script that fails when the highest `Migrations/NNN_*.sql` number exceeds the highest documented entry in §4.2 (or when a new forward migration lands without a catalog line).
3. Prefer generating the catalog table from migration metadata to avoid manual drift (optional follow-up within this item).
4. Cross-link rolling-deploy notes for known risky migrations (**215**, **223**, **214**, **116**, **216**) to **TB-068** runbook.

**Acceptance criteria:**

- §4.2 documents every forward migration through the current highest number.
- New forward migration PRs cannot merge without a catalog entry (CI or review bot).

**Affected files / projects:**

- `docs/library/SQL_SCRIPTS.md`
- `scripts/ci/` (catalog freshness check)
- `ArchLucid.Persistence/Migrations/*.sql`

**Size estimate:** **S** — ~4–8 h for backfill + gate.

---

## TB-068 — DbUp migration rolling-deploy guardrails (CI lint + runbook)

**Source:** DDL hygiene and migration-safety audit (2026-05-27). Several shipped migrations are not zero-downtime safe for rolling deploy.

**Problem:**

Forward migrations can break old application pods when schema changes are not purely additive:

| Migration | Risk |
|-----------|------|
| **215** `ScopeColumnsNotNull` | `ALTER NOT NULL` after backfill — old app writing NULL fails |
| **223** `AgentExecutionTraces_RunTaskAgentType_Unique` | Deletes duplicates then `CREATE UNIQUE INDEX` — old app can recreate duplicates |
| **214** / **116** | `CHECK` constraints reject legacy values |
| **216** | Drops old unique index before adding filtered replacement — uniqueness gap |

There is no CI lint forbidding these patterns in new migrations and no operator runbook for coordinated deploy order.

**What to do:**

1. Author `docs/runbooks/ROLLING_DEPLOY_MIGRATIONS.md` with required patterns: nullable add → backfill → NOT NULL; `WITH NOCHECK` for CHECK/FK; add-new-index-before-drop-old; deploy app before enforcing UNIQUE.
2. Add CI static analysis over new/changed `Migrations/NNN_*.sql` files flagging: bare `ALTER COLUMN … NOT NULL` without prior nullable-add migration in same PR; `DELETE` before `CREATE UNIQUE`; `DROP INDEX` before replacement `CREATE UNIQUE` in same script.
3. Annotate known historical migrations in §4.2 (via **TB-067**) with **rolling-deploy: coordinated** tags.
4. For future breaking changes, require paired application change + feature flag note in migration header comment block.

**Acceptance criteria:**

- New migrations matching anti-patterns fail CI unless explicitly allow-listed with justification comment.
- Runbook linked from [`SQL_SCRIPTS.md`](SQL_SCRIPTS.md) §5 checklist and [`MIGRATION_ROLLBACK.md`](../runbooks/MIGRATION_ROLLBACK.md).
- On-call can determine deploy order (migrate vs app first) from migration catalog tags.

**Affected files / projects:**

- `docs/runbooks/ROLLING_DEPLOY_MIGRATIONS.md` (new)
- `scripts/ci/` (migration pattern linter)
- `docs/library/SQL_SCRIPTS.md`
- `ArchLucid.Persistence/Migrations/*.sql` (header annotations only for historical items)

**Size estimate:** **S–M** — ~1–2 eng days.

---

## TB-069 — Simplify `GreenfieldBaselineMigrationRunner` sparse-stamp path

**Source:** DDL hygiene and migration-safety audit (2026-05-27). Baseline runner stamps migrations **001–050** into `SchemaVersions` without always executing them, with complex drift-repair branches.

**Problem:**

`GreenfieldBaselineMigrationRunner` handles partial CI catalog drift (tenant tables present but journal incomplete) via multiple catch-and-stamp code paths. This is hard to reason about, untested against edge cases (RLS, columnstore, mixed schema names), and performs no post-stamp schema verification (**TB-065** would close verification separately).

**What to do:**

1. Document current runner behavior and all drift branches in [`SQL_SCRIPTS.md`](SQL_SCRIPTS.md) §4.0 with a sequence diagram.
2. Evaluate replacing multi-branch stamp logic with a single idempotent migration that records **001–050** as applied when sentinel tenant tables exist and journal is empty/inconsistent — without re-executing DDL that would duplicate objects.
3. Add integration tests for: empty catalog, partial journal, tenant tables in non-`dbo` schema, duplicate-table catch path.
4. Do not remove baseline until **TB-065** drift detection covers stamped catalogs.

**Acceptance criteria:**

- Runner behavior is documented and covered by at least three integration scenarios.
- Code paths reduced or explicitly justified; no silent stamp without sentinel table checks.
- CI shared-catalog parallel tests remain stable (mutex + stamp semantics unchanged or improved).

**Affected files / projects:**

- `ArchLucid.Persistence/Data/Infrastructure/GreenfieldBaselineMigrationRunner.cs`
- `ArchLucid.Persistence/Data/Infrastructure/DatabaseMigrator.cs`
- `ArchLucid.Persistence.Tests/`
- `docs/library/SQL_SCRIPTS.md`

**Size estimate:** **M** — ~2–3 eng days (refactor + test matrix).

**Depends on:** **TB-065** recommended before simplifying stamp paths.

---

## TB-070 — `PersistenceContractSupplement.sql` stale refs + test catalog parity

**Source:** DDL hygiene and migration-safety audit (2026-05-27). Test supplement modified in working tree; comments reference retired product name.

**Problem:**

`ArchLucid.Persistence.Tests/Scripts/PersistenceContractSupplement.sql` comments refer to **`ArchiForge.sql`** instead of **`ArchLucid.sql`**. The supplement is applied instead of full bootstrap in contract tests and can drift from latest migrations (e.g. **226** `SourceRevisionHash` was added to supplement separately). Misleading comments cause contributors to update the wrong file.

**What to do:**

1. Replace all `ArchiForge.sql` references with `ArchLucid.sql` in the supplement and any sibling test SQL comments.
2. Add a short header comment listing which production tables/columns the supplement intentionally diverges from (FK-relaxed shapes, nullable JSON for guard tests).
3. When **TB-065** ships, optionally assert supplement sentinel columns are a subset of migration+DDL manifest (or document explicit exceptions).
4. Grep repo for other stale `ArchiForge` SQL doc references and fix in the same PR.

**Acceptance criteria:**

- No `ArchiForge.sql` references in Persistence test SQL or related docs.
- Supplement header documents intentional divergences from production DDL.

**Affected files / projects:**

- `ArchLucid.Persistence.Tests/Scripts/PersistenceContractSupplement.sql`
- `ArchLucid.Persistence.Tests/` (fixture comments)
- `docs/library/SQL_SCRIPTS.md` (test pathway note)

**Size estimate:** **XS** — ~1–2 h.

---

## TB-071 — Azure Search production client — wire tenant OData filter on every search/delete

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). **TB-048** / **RAG-V1-010** shipped the in-memory query filter and `AzureSearchTenantScopeFilterBuilder`, but production registration still uses `NotConfiguredAzureSearchClient`.

**Problem:**

`AzureSearchTenantScopeFilterBuilder.BuildScopeFilter` produces correct OData clauses (`tenantId`, `workspaceId`, `projectId`), yet no in-repo `IAzureSearchClient` implementation calls it during `SearchAsync`. Tenant isolation for Azure AI Search cannot be verified from the codebase. Additionally, `AzureAiSearchVectorIndex.RemoveChunksForDocumentAsync` is a no-op — deleted tenant data persists in the index indefinitely.

**What to do:**

1. Implement a production `IAzureSearchClient` (or complete `AzureAiSearchVectorIndex`) that attaches `BuildScopeFilter(query)` to **every** search request.
2. Implement `RemoveChunksForDocumentAsync` with the same document-id filter used on upsert (or tenant-scoped delete when document metadata includes scope).
3. Add integration test asserting the OData filter clause is present on search (mock or recorded HTTP).
4. Update **RAG-V1-010** status and operator runbook for Azure Search deployment checklist.

**Out of scope:** Per-tenant index partitioning (query-time filter is the chosen model).

**Depends on:** none (closes remaining **TB-048** / **RAG-V1-010** P1 gap).

**Affected files / projects:**

- `ArchLucid.Retrieval/Indexing/AzureAiSearchVectorIndex.cs`
- `ArchLucid.Retrieval/Indexing/AzureSearchTenantScopeFilterBuilder.cs`
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`
- `ArchLucid.Retrieval.Tests/` (Azure filter integration test)

**Size estimate:** **S–M** — ~1–2 eng days.

---

## TB-072 — Scope-to-identity binding at API ingress

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). `HttpScopeContextProvider` resolves tenant from JWT claims → `x-*` headers → dev defaults, but **no middleware validates that the authenticated principal may use the resolved tenant**.

**Problem:**

- **`ApiKeyAuthenticationHandler`** — roles/permissions only; zero scope claims. Valid key + arbitrary `x-tenant-id` ⇒ any tenant's data (especially in SingleCatalog mode).
- **`DevelopmentBypassAuthenticationHandler`** — no `tenant_id` / `workspace_id` / `project_id` claims; headers fully control scope.
- **SCIM bearer** — `tenant_id` only; workspace/project fall through to headers/defaults.
- **`TenantOrProjectCapabilityAuthorizationHandler`** — augments project capabilities but does not prove caller ∈ `scope.TenantId` for tenant-wide JWT roles.

Production safety currently depends on per-tenant catalog routing (`ScopedRoutingSqlConnectionFactory`) plus repository SQL filters — not on identity binding.

**What to do:**

1. **Production auth schemes:** Require `tenant_id` (and ideally `workspace_id` / `project_id`) claims on all non-anonymous schemes; reject requests where scope headers disagree with claims (extend existing claim-over-header precedence to **fail** rather than silently prefer claims only when present).
2. **ApiKey:** Embed scope in key record or issue per-tenant keys; derive scope server-side from key metadata — never trust client headers alone.
3. **DevBypass:** Document as break-glass only; add startup guard preventing DevBypass in production-like profiles (align with **INV-005** / **TB-010**).
4. Optional middleware after auth: `scope.TenantId != Guid.Empty` for tenant APIs; SCIM user ∈ tenant for non-platform roles.
5. Extend `TenantIsolationSmokeTests` to cover ApiKey/header mismatch rejection.

**Out of scope:** Replacing database-per-tenant topology (**TB-018**); operator cross-tenant analytics (intentional, admin-gated).

**Depends on:** none. Complements **TB-010** (**INV-001**).

**Affected files / projects:**

- `ArchLucid.Host.Core/Auth/Services/HttpScopeContextProvider.cs`
- `ArchLucid.Api/Authentication/ApiKeyAuthenticationHandler.cs`
- `ArchLucid.Api/Auth/Services/DevelopmentBypassAuthenticationHandler.cs`
- `ArchLucid.Host.Core/Authorization/TenantOrProjectCapabilityAuthorizationHandler.cs`
- `ArchLucid.Api/Middleware/` (optional scope-validation middleware)
- `ArchLucid.Api.Tests/` (`HttpScopeContextProviderTests`, integration isolation tests)

**Size estimate:** **M** — ~2–3 eng days.

---

## TB-073 — Scoped snapshot repository reads (findings / graph / context)

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). Findings inspect and mute paths enforce full scope via `Runs` joins; snapshot repositories use GUID-only reads.

**Problem:**

These methods query by snapshot/record ID **without** `TenantId` / `WorkspaceId` / `ProjectId` in SQL:

| Repository | Method | Risk |
|------------|--------|------|
| `SqlFindingsSnapshotRepository` | `GetByIdAsync`, `ListFindingRecordsKeysetAsync`, `UpdatePriorityRanksAsync` | Leaked `FindingsSnapshotId` → read/mutate another tenant's findings |
| `FindingsSnapshotRelationalRead` | Child loads by `FindingsSnapshotId` / `FindingRecordId` | Full finding payload without tenant gate |
| `SqlGraphSnapshotRepository` | `GetByIdAsync` | Leaked `GraphSnapshotId` → entire knowledge graph |
| `SqlContextSnapshotRepository` | `GetByIdAsync` | Leaked `ContextSnapshotId` → context snapshot |
| `InMemoryFindingsSnapshotRepository` | `GetByIdAsync` | Global `Dictionary<Guid, string>` — no tenant key |

Safe in **per-tenant catalog** mode only. Vulnerable in **SingleCatalog** / dev / test when a GUID is known. `DapperAuthorityQueryService` loads snapshots by bare GUID after a scoped run gate — indirect risk if run row is corrupt or repository called elsewhere.

**What to do:**

1. Add `ScopeContext` parameter to `IFindingsSnapshotRepository.GetByIdAsync`, `ListFindingRecordsKeysetAsync`, `UpdatePriorityRanksAsync` — mirror `SqlGoldenManifestRepository` (`WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId`).
2. Same pattern for `IGraphSnapshotRepository`, `IContextSnapshotRepository`, and their relational read helpers.
3. In `FindingsSnapshotRelationalRead`, join `FindingsSnapshots` / `Runs` or filter `FindingRecords.TenantId` when scope is available.
4. Key `InMemoryFindingsSnapshotRepository` by `(TenantId, SnapshotId)` or validate snapshot's `RunId` against scoped run before return.
5. Update all callers (including `DapperAuthorityQueryService`, `GraphSnapshotCommittedReuseResolver`) to pass scope.
6. Integration tests: tenant A's snapshot GUID rejected under tenant B's scope in SingleCatalog mode.

**Out of scope:** Intentional admin paths (`GetByRunIdAdminAsync`, worker dequeue).

**Depends on:** none.

**Affected files / projects:**

- `ArchLucid.Persistence/Repositories/SqlFindingsSnapshotRepository.cs`
- `ArchLucid.Persistence/Findings/FindingsSnapshotRelationalRead.cs`
- `ArchLucid.Persistence/Repositories/SqlGraphSnapshotRepository.cs`
- `ArchLucid.Persistence/Repositories/SqlContextSnapshotRepository.cs`
- `ArchLucid.Decisioning/Repositories/InMemoryFindingsSnapshotRepository.cs`
- `ArchLucid.Persistence/Queries/DapperAuthorityQueryService.cs`
- `ArchLucid.Persistence.Tests/`

**Size estimate:** **M** — ~2–3 eng days.

---

## TB-074 — Retrieval indexing write-path tenant validation

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). Retrieval uses a shared global vector index with query-time metadata filtering.

**Problem:**

`RetrievalIndexingService` copies `TenantId` / `WorkspaceId` / `ProjectId` from each `RetrievalDocument` into chunks without validating against the caller's ambient `ScopeContext`. A miswired or malicious caller can index data into another tenant's retrieval namespace (data poisoning). `InMemoryVectorIndex.UpsertChunksAsync` and `RemoveChunksForDocumentAsync` perform no tenant validation on write/delete.

**What to do:**

1. In `RetrievalIndexingService`, reject documents whose scope fields disagree with `IScopeContextProvider.GetCurrentScope()` (or explicit `ScopeContext` parameter).
2. In `InMemoryVectorIndex.UpsertChunksAsync`, optionally assert chunk scope matches query scope on upsert (defense in depth).
3. Scope `RemoveChunksForDocumentAsync` by tenant metadata when deleting (mitigate document-id collision).
4. Tests: document with mismatched `TenantId` → rejected; matching scope → indexed.

**Out of scope:** Per-tenant index partitioning; platform corpora indexing (`PlatformSentinelTenantId` — by design).

**Depends on:** none. Complements **TB-071** (query-side filter).

**Affected files / projects:**

- `ArchLucid.Retrieval/Indexing/RetrievalIndexingService.cs`
- `ArchLucid.Retrieval/Indexing/InMemoryVectorIndex.cs`
- `ArchLucid.Retrieval/Indexing/RetrievalRunCompletionIndexer.cs`
- `ArchLucid.Retrieval.Tests/`

**Size estimate:** **S** — ~1 eng day.

---

## TB-075 — Operator UI server-side scope (proxy + SSR)

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). The operator UI declares the API as the authoritative security boundary but forwards client-controlled scope headers.

**Problem:**

- **`proxy/[...path]/route.ts`** — forwards browser `x-tenant-id` / `x-workspace-id` / `x-project-id` when present; `localStorage` (`archlucid_operator_scope_v1`) is the authoritative tenant source in the browser.
- **`scope.ts` `getScopeHeaders()`** — hardcoded `DEV_SCOPE_*` GUIDs for all SSR requests.
- **`middleware.ts`** — no auth or tenant gate (demo alias redirects only).
- **`downloadValueReportDocx`** — `tenantId` in URL path can disagree with scope headers.

For Entra JWT with embedded `tenant_id`, the API ignores hostile headers. For DevBypass / API key / missing claims, the UI + proxy effectively choose the tenant.

**What to do:**

1. In the proxy route handler, **strip** incoming `x-tenant-id` / `x-workspace-id` / `x-project-id` from browser requests and set them server-side from authenticated session (`/api/auth/me` claims or secure cookie).
2. Replace SSR `getScopeHeaders()` dev GUIDs with server-derived scope (cookie or server-side `/me` call).
3. Remove client-chosen `tenantId` from value-report URL path; use scope-only or server-side generation.
4. Document that scope switcher changes workspace/project only; tenant comes from identity.

**Out of scope:** Backend enforcement (**TB-072**); UI post-load ownership checks (**TB-077**).

**Depends on:** **TB-072** recommended for full end-to-end binding.

**Affected files / projects:**

- `archlucid-ui/src/app/api/proxy/[...path]/route.ts`
- `archlucid-ui/src/lib/scope.ts`
- `archlucid-ui/src/lib/operator-scope-storage.ts`
- `archlucid-ui/src/lib/api/http.ts`
- `archlucid-ui/src/lib/api/downloads-api.ts`
- `archlucid-ui/src/components/GenerateSponsorValueReportButton.tsx`

**Size estimate:** **S–M** — ~1–2 eng days.

---

## TB-076 — Run-child SQL scope predicates + in-memory repository tenant keys

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). After a scoped run load, child data is often loaded by `RunId` only.

**Problem:**

| Repository | Pattern | Safe when |
|------------|---------|-----------|
| `AgentTaskRepository` | `WHERE RunId = @RunId` | Per-tenant catalog routing guaranteed |
| `AgentExecutionTraceRepository` | `WHERE RunId = @RunId` | Same |
| `EvidenceBundleRepository` | `WHERE EvidenceBundleId = @EvidenceBundleId` | Same |
| `RunDetailQueryService` | Calls above after scoped run gate | Catalog routing + run gate |

Residual risk in **SingleCatalog** / dev if run gate is skipped or connection targets wrong catalog. `TenantErasureQuarantineMiddleware` skips `/v1/admin` entirely — quarantined tenants with Admin credentials still reach admin routes.

**What to do:**

1. Add `TenantId` (or full `ScopeContext`) to run-child `GetByRunIdAsync` methods, or document and test that catalog routing is mandatory with an architecture test guard.
2. Extend `TenantErasureQuarantineMiddleware` to cover `/v1/admin` (or document admin-while-quarantined as acceptable with platform-only credentials).
3. Audit callers of `GetByRunIdAdminAsync` (`FindingPriorityReranker`, archival jobs) — ensure system/background context only.

**Out of scope:** Snapshot repository scoping (**TB-073**); intentional admin cross-tenant analytics.

**Depends on:** **TB-073** (related persistence hardening).

**Affected files / projects:**

- `ArchLucid.Persistence/Repositories/AgentTaskRepository.cs`
- `ArchLucid.Persistence/Repositories/AgentExecutionTraceRepository.cs`
- `ArchLucid.Persistence/Repositories/EvidenceBundleRepository.cs`
- `ArchLucid.Application/RunDetailQueryService.cs`
- `ArchLucid.Api/Middleware/TenantErasureQuarantineMiddleware.cs`
- `ArchLucid.Persistence/Repositories/SqlRunRepository.cs`

**Size estimate:** **S–M** — ~1–2 eng days.

---

## TB-077 — Operator UI resource ownership checks + governance mutation hardening

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). Dynamic operator routes use resource IDs only; no post-load tenant ownership validation.

**Problem:**

- Routes `[runId]`, `[manifestId]`, `[findingId]` call APIs with ID alone — URL manipulation is IDOR if API returns cross-scope data.
- `recordFindingDisposition(findingId, …)` — `findingId` in URL; `runId` optional in body.
- `getArchitectureDecisionRegister()` — no `projectId` from active scope.
- `compareRuns(leftRunId, rightRunId)` — two run IDs, no scope validation in UI.
- SSR `/reviews?projectId=…` can mismatch hardcoded `x-project-id` on server renders.

**What to do:**

1. After loading run/manifest/finding detail, compare resource `projectId` (and `tenantId` if API returns it) to effective scope; call `notFound()` on mismatch (defense in depth — API remains authoritative).
2. Require `runId` in URL path for `recordFindingDisposition`; reject finding-only mutations.
3. Pass active `projectId` from scope into `getArchitectureDecisionRegister(projectId)`.
4. Align SSR list `projectId` query param with server-derived scope headers.

**Out of scope:** Server-side scope binding (**TB-075**); backend IDOR fixes (**TB-072**, **TB-073**).

**Depends on:** **TB-075** for consistent scope source.

**Affected files / projects:**

- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/load-run-detail-page-model.ts`
- `archlucid-ui/src/lib/api/governance-stickiness-api.ts`
- `archlucid-ui/src/app/(operator)/governance/decision-register/DecisionRegisterClient.tsx`
- `archlucid-ui/src/lib/load-finding-inspect-for-route.ts`
- `archlucid-ui/src/lib/api/architecture-runs.ts`
- `archlucid-ui/src/app/(operator)/reviews/_sections/load-runs-page-model.ts`

**Size estimate:** **S** — ~1 eng day.

---

## TB-078 — Cross-tenant isolation integration test matrix

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). `TenantIsolationSmokeTests` cover API + SQL under header-scoped isolation but not several audit-identified gaps.

**Problem:**

No tests assert:

- `SqlFindingsSnapshotRepository.GetByIdAsync` rejects a GUID belonging to another tenant (SingleCatalog mode).
- `RetrievalIndexingService` rejects documents whose `TenantId` disagrees with caller scope.
- Azure Search client applies OData tenant filter on every `SearchAsync` (when **TB-071** ships).
- In-memory snapshot/vector stores reject cross-tenant reads by leaked GUID.
- ApiKey / DevBypass + mismatched scope headers are rejected (**TB-072**).

**What to do:**

1. Add `ArchLucid.Persistence.Tests` integration tests for snapshot IDOR under SingleCatalog (two tenants, one catalog).
2. Add `ArchLucid.Retrieval.Tests` for indexing tenant mismatch rejection.
3. Add API integration test for scope-header vs claim mismatch (when **TB-072** ships).
4. Wire tests into CI Tier 1.5 or dedicated security job.
5. Reference test matrix in owner pen-test runbook (**TB-005**).

**Out of scope:** Implementing the fixes (each TB item owns its tests).

**Depends on:** Ships alongside **TB-071**–**TB-077** (tests added per item; this item tracks the consolidated matrix and CI wiring).

**Affected files / projects:**

- `ArchLucid.Persistence.Tests/` (tenant isolation / SingleCatalog fixtures)
- `ArchLucid.Retrieval.Tests/`
- `ArchLucid.Api.Tests/` (`TenantIsolationSmokeTests.cs`)
- `docs/security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md` (coverage note)

**Size estimate:** **S** — ~1 eng day (incremental; spread across sibling items).

---

## TB-071 — Azure Search production client — wire tenant OData filter on every search/delete

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). **TB-048** / **RAG-V1-010** shipped the in-memory query filter and `AzureSearchTenantScopeFilterBuilder`, but production registration still uses `NotConfiguredAzureSearchClient`.

**Problem:**

`AzureSearchTenantScopeFilterBuilder.BuildScopeFilter` produces correct OData clauses (`tenantId`, `workspaceId`, `projectId`), yet no in-repo `IAzureSearchClient` implementation calls it during `SearchAsync`. Tenant isolation for Azure AI Search cannot be verified from the codebase. Additionally, `AzureAiSearchVectorIndex.RemoveChunksForDocumentAsync` is a no-op — deleted tenant data persists in the index indefinitely.

**What to do:**

1. Implement a production `IAzureSearchClient` (or complete `AzureAiSearchVectorIndex`) that attaches `BuildScopeFilter(query)` to **every** search request.
2. Implement `RemoveChunksForDocumentAsync` with the same document-id filter used on upsert (or tenant-scoped delete when document metadata includes scope).
3. Add integration test asserting the OData filter clause is present on search (mock or recorded HTTP).
4. Update **RAG-V1-010** status and operator runbook for Azure Search deployment checklist.

**Out of scope:** Per-tenant index partitioning (query-time filter is the chosen model).

**Depends on:** none (closes remaining **TB-048** / **RAG-V1-010** P1 gap).

**Affected files / projects:**

- `ArchLucid.Retrieval/Indexing/AzureAiSearchVectorIndex.cs`
- `ArchLucid.Retrieval/Indexing/AzureSearchTenantScopeFilterBuilder.cs`
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`
- `ArchLucid.Retrieval.Tests/` (Azure filter integration test)

**Size estimate:** **S–M** — ~1–2 eng days.

---

## TB-072 — Scope-to-identity binding at API ingress

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). `HttpScopeContextProvider` resolves tenant from JWT claims → `x-*` headers → dev defaults, but **no middleware validates that the authenticated principal may use the resolved tenant**.

**Problem:**

- **`ApiKeyAuthenticationHandler`** — roles/permissions only; zero scope claims. Valid key + arbitrary `x-tenant-id` ⇒ any tenant's data (especially in SingleCatalog mode).
- **`DevelopmentBypassAuthenticationHandler`** — no `tenant_id` / `workspace_id` / `project_id` claims; headers fully control scope.
- **SCIM bearer** — `tenant_id` only; workspace/project fall through to headers/defaults.
- **`TenantOrProjectCapabilityAuthorizationHandler`** — augments project capabilities but does not prove caller ∈ `scope.TenantId` for tenant-wide JWT roles.

Production safety currently depends on per-tenant catalog routing (`ScopedRoutingSqlConnectionFactory`) plus repository SQL filters — not on identity binding.

**What to do:**

1. **Production auth schemes:** Require `tenant_id` (and ideally `workspace_id` / `project_id`) claims on all non-anonymous schemes; reject requests where scope headers disagree with claims (extend existing claim-over-header precedence to **fail** rather than silently prefer claims only when present).
2. **ApiKey:** Embed scope in key record or issue per-tenant keys; derive scope server-side from key metadata — never trust client headers alone.
3. **DevBypass:** Document as break-glass only; add startup guard preventing DevBypass in production-like profiles (align with **INV-005** / **TB-010**).
4. Optional middleware after auth: `scope.TenantId != Guid.Empty` for tenant APIs; SCIM user ∈ tenant for non-platform roles.
5. Extend `TenantIsolationSmokeTests` to cover ApiKey/header mismatch rejection.

**Out of scope:** Replacing database-per-tenant topology (**TB-018**); operator cross-tenant analytics (intentional, admin-gated).

**Depends on:** none. Complements **TB-010** (**INV-001**).

**Affected files / projects:**

- `ArchLucid.Host.Core/Auth/Services/HttpScopeContextProvider.cs`
- `ArchLucid.Api/Authentication/ApiKeyAuthenticationHandler.cs`
- `ArchLucid.Api/Auth/Services/DevelopmentBypassAuthenticationHandler.cs`
- `ArchLucid.Host.Core/Authorization/TenantOrProjectCapabilityAuthorizationHandler.cs`
- `ArchLucid.Api/Middleware/` (optional scope-validation middleware)
- `ArchLucid.Api.Tests/` (`HttpScopeContextProviderTests`, integration isolation tests)

**Size estimate:** **M** — ~2–3 eng days.

---

## TB-073 — Scoped snapshot repository reads (findings / graph / context)

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). Findings inspect and mute paths enforce full scope via `Runs` joins; snapshot repositories use GUID-only reads.

**Problem:**

These methods query by snapshot/record ID **without** `TenantId` / `WorkspaceId` / `ProjectId` in SQL:

| Repository | Method | Risk |
|------------|--------|------|
| `SqlFindingsSnapshotRepository` | `GetByIdAsync`, `ListFindingRecordsKeysetAsync`, `UpdatePriorityRanksAsync` | Leaked `FindingsSnapshotId` → read/mutate another tenant's findings |
| `FindingsSnapshotRelationalRead` | Child loads by `FindingsSnapshotId` / `FindingRecordId` | Full finding payload without tenant gate |
| `SqlGraphSnapshotRepository` | `GetByIdAsync` | Leaked `GraphSnapshotId` → entire knowledge graph |
| `SqlContextSnapshotRepository` | `GetByIdAsync` | Leaked `ContextSnapshotId` → context snapshot |
| `InMemoryFindingsSnapshotRepository` | `GetByIdAsync` | Global `Dictionary<Guid, string>` — no tenant key |

Safe in **per-tenant catalog** mode only. Vulnerable in **SingleCatalog** / dev / test when a GUID is known. `DapperAuthorityQueryService` loads snapshots by bare GUID after a scoped run gate — indirect risk if run row is corrupt or repository called elsewhere.

**What to do:**

1. Add `ScopeContext` parameter to `IFindingsSnapshotRepository.GetByIdAsync`, `ListFindingRecordsKeysetAsync`, `UpdatePriorityRanksAsync` — mirror `SqlGoldenManifestRepository` (`WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId`).
2. Same pattern for `IGraphSnapshotRepository`, `IContextSnapshotRepository`, and their relational read helpers.
3. In `FindingsSnapshotRelationalRead`, join `FindingsSnapshots` / `Runs` or filter `FindingRecords.TenantId` when scope is available.
4. Key `InMemoryFindingsSnapshotRepository` by `(TenantId, SnapshotId)` or validate snapshot's `RunId` against scoped run before return.
5. Update all callers (including `DapperAuthorityQueryService`, `GraphSnapshotCommittedReuseResolver`) to pass scope.
6. Integration tests: tenant A's snapshot GUID rejected under tenant B's scope in SingleCatalog mode.

**Out of scope:** Intentional admin paths (`GetByRunIdAdminAsync`, worker dequeue).

**Depends on:** none.

**Affected files / projects:**

- `ArchLucid.Persistence/Repositories/SqlFindingsSnapshotRepository.cs`
- `ArchLucid.Persistence/Findings/FindingsSnapshotRelationalRead.cs`
- `ArchLucid.Persistence/Repositories/SqlGraphSnapshotRepository.cs`
- `ArchLucid.Persistence/Repositories/SqlContextSnapshotRepository.cs`
- `ArchLucid.Decisioning/Repositories/InMemoryFindingsSnapshotRepository.cs`
- `ArchLucid.Persistence/Queries/DapperAuthorityQueryService.cs`
- `ArchLucid.Persistence.Tests/`

**Size estimate:** **M** — ~2–3 eng days.

---

## TB-074 — Retrieval indexing write-path tenant validation

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). Retrieval uses a shared global vector index with query-time metadata filtering.

**Problem:**

`RetrievalIndexingService` copies `TenantId` / `WorkspaceId` / `ProjectId` from each `RetrievalDocument` into chunks without validating against the caller's ambient `ScopeContext`. A miswired or malicious caller can index data into another tenant's retrieval namespace (data poisoning). `InMemoryVectorIndex.UpsertChunksAsync` and `RemoveChunksForDocumentAsync` perform no tenant validation on write/delete.

**What to do:**

1. In `RetrievalIndexingService`, reject documents whose scope fields disagree with `IScopeContextProvider.GetCurrentScope()` (or explicit `ScopeContext` parameter).
2. In `InMemoryVectorIndex.UpsertChunksAsync`, optionally assert chunk scope matches query scope on upsert (defense in depth).
3. Scope `RemoveChunksForDocumentAsync` by tenant metadata when deleting (mitigate document-id collision).
4. Tests: document with mismatched `TenantId` → rejected; matching scope → indexed.

**Out of scope:** Per-tenant index partitioning; platform corpora indexing (`PlatformSentinelTenantId` — by design).

**Depends on:** none. Complements **TB-071** (query-side filter).

**Affected files / projects:**

- `ArchLucid.Retrieval/Indexing/RetrievalIndexingService.cs`
- `ArchLucid.Retrieval/Indexing/InMemoryVectorIndex.cs`
- `ArchLucid.Retrieval/Indexing/RetrievalRunCompletionIndexer.cs`
- `ArchLucid.Retrieval.Tests/`

**Size estimate:** **S** — ~1 eng day.

---

## TB-075 — Operator UI server-side scope (proxy + SSR)

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). The operator UI declares the API as the authoritative security boundary but forwards client-controlled scope headers.

**Problem:**

- **`proxy/[...path]/route.ts`** — forwards browser `x-tenant-id` / `x-workspace-id` / `x-project-id` when present; `localStorage` (`archlucid_operator_scope_v1`) is the authoritative tenant source in the browser.
- **`scope.ts` `getScopeHeaders()`** — hardcoded `DEV_SCOPE_*` GUIDs for all SSR requests.
- **`middleware.ts`** — no auth or tenant gate (demo alias redirects only).
- **`downloadValueReportDocx`** — `tenantId` in URL path can disagree with scope headers.

For Entra JWT with embedded `tenant_id`, the API ignores hostile headers. For DevBypass / API key / missing claims, the UI + proxy effectively choose the tenant.

**What to do:**

1. In the proxy route handler, **strip** incoming `x-tenant-id` / `x-workspace-id` / `x-project-id` from browser requests and set them server-side from authenticated session (`/api/auth/me` claims or secure cookie).
2. Replace SSR `getScopeHeaders()` dev GUIDs with server-derived scope (cookie or server-side `/me` call).
3. Remove client-chosen `tenantId` from value-report URL path; use scope-only or server-side generation.
4. Document that scope switcher changes workspace/project only; tenant comes from identity.

**Out of scope:** Backend enforcement (**TB-072**); UI post-load ownership checks (**TB-077**).

**Depends on:** **TB-072** recommended for full end-to-end binding.

**Affected files / projects:**

- `archlucid-ui/src/app/api/proxy/[...path]/route.ts`
- `archlucid-ui/src/lib/scope.ts`
- `archlucid-ui/src/lib/operator-scope-storage.ts`
- `archlucid-ui/src/lib/api/http.ts`
- `archlucid-ui/src/lib/api/downloads-api.ts`
- `archlucid-ui/src/components/GenerateSponsorValueReportButton.tsx`

**Size estimate:** **S–M** — ~1–2 eng days.

---

## TB-076 — Run-child SQL scope predicates + in-memory repository tenant keys

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). After a scoped run load, child data is often loaded by `RunId` only.

**Problem:**

| Repository | Pattern | Safe when |
|------------|---------|-----------|
| `AgentTaskRepository` | `WHERE RunId = @RunId` | Per-tenant catalog routing guaranteed |
| `AgentExecutionTraceRepository` | `WHERE RunId = @RunId` | Same |
| `EvidenceBundleRepository` | `WHERE EvidenceBundleId = @EvidenceBundleId` | Same |
| `RunDetailQueryService` | Calls above after scoped run gate | Catalog routing + run gate |

Residual risk in **SingleCatalog** / dev if run gate is skipped or connection targets wrong catalog. `TenantErasureQuarantineMiddleware` skips `/v1/admin` entirely — quarantined tenants with Admin credentials still reach admin routes.

**What to do:**

1. Add `TenantId` (or full `ScopeContext`) to run-child `GetByRunIdAsync` methods, or document and test that catalog routing is mandatory with an architecture test guard.
2. Extend `TenantErasureQuarantineMiddleware` to cover `/v1/admin` (or document admin-while-quarantined as acceptable with platform-only credentials).
3. Audit callers of `GetByRunIdAdminAsync` (`FindingPriorityReranker`, archival jobs) — ensure system/background context only.

**Out of scope:** Snapshot repository scoping (**TB-073**); intentional admin cross-tenant analytics.

**Depends on:** **TB-073** (related persistence hardening).

**Affected files / projects:**

- `ArchLucid.Persistence/Repositories/AgentTaskRepository.cs`
- `ArchLucid.Persistence/Repositories/AgentExecutionTraceRepository.cs`
- `ArchLucid.Persistence/Repositories/EvidenceBundleRepository.cs`
- `ArchLucid.Application/RunDetailQueryService.cs`
- `ArchLucid.Api/Middleware/TenantErasureQuarantineMiddleware.cs`
- `ArchLucid.Persistence/Repositories/SqlRunRepository.cs`

**Size estimate:** **S–M** — ~1–2 eng days.

---

## TB-077 — Operator UI resource ownership checks + governance mutation hardening

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). Dynamic operator routes use resource IDs only; no post-load tenant ownership validation.

**Problem:**

- Routes `[runId]`, `[manifestId]`, `[findingId]` call APIs with ID alone — URL manipulation is IDOR if API returns cross-scope data.
- `recordFindingDisposition(findingId, …)` — `findingId` in URL; `runId` optional in body.
- `getArchitectureDecisionRegister()` — no `projectId` from active scope.
- `compareRuns(leftRunId, rightRunId)` — two run IDs, no scope validation in UI.
- SSR `/reviews?projectId=…` can mismatch hardcoded `x-project-id` on server renders.

**What to do:**

1. After loading run/manifest/finding detail, compare resource `projectId` (and `tenantId` if API returns it) to effective scope; call `notFound()` on mismatch (defense in depth — API remains authoritative).
2. Require `runId` in URL path for `recordFindingDisposition`; reject finding-only mutations.
3. Pass active `projectId` from scope into `getArchitectureDecisionRegister(projectId)`.
4. Align SSR list `projectId` query param with server-derived scope headers.

**Out of scope:** Server-side scope binding (**TB-075**); backend IDOR fixes (**TB-072**, **TB-073**).

**Depends on:** **TB-075** for consistent scope source.

**Affected files / projects:**

- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/load-run-detail-page-model.ts`
- `archlucid-ui/src/lib/api/governance-stickiness-api.ts`
- `archlucid-ui/src/app/(operator)/governance/decision-register/DecisionRegisterClient.tsx`
- `archlucid-ui/src/lib/load-finding-inspect-for-route.ts`
- `archlucid-ui/src/lib/api/architecture-runs.ts`
- `archlucid-ui/src/app/(operator)/reviews/_sections/load-runs-page-model.ts`

**Size estimate:** **S** — ~1 eng day.

---

## TB-078 — Cross-tenant isolation integration test matrix

**Source:** Multi-tenancy and blast-radius audit (2026-05-27). `TenantIsolationSmokeTests` cover API + SQL under header-scoped isolation but not several audit-identified gaps.

**Problem:**

No tests assert:

- `SqlFindingsSnapshotRepository.GetByIdAsync` rejects a GUID belonging to another tenant (SingleCatalog mode).
- `RetrievalIndexingService` rejects documents whose `TenantId` disagrees with caller scope.
- Azure Search client applies OData tenant filter on every `SearchAsync` (when **TB-071** ships).
- In-memory snapshot/vector stores reject cross-tenant reads by leaked GUID.
- ApiKey / DevBypass + mismatched scope headers are rejected (**TB-072**).

**What to do:**

1. Add `ArchLucid.Persistence.Tests` integration tests for snapshot IDOR under SingleCatalog (two tenants, one catalog).
2. Add `ArchLucid.Retrieval.Tests` for indexing tenant mismatch rejection.
3. Add API integration test for scope-header vs claim mismatch (when **TB-072** ships).
4. Wire tests into CI Tier 1.5 or dedicated security job.
5. Reference test matrix in owner pen-test runbook (**TB-005**).

**Out of scope:** Implementing the fixes (each TB item owns its tests).

**Depends on:** Ships alongside **TB-071**–**TB-077** (tests added per item; this item tracks the consolidated matrix and CI wiring).

**Affected files / projects:**

- `ArchLucid.Persistence.Tests/` (tenant isolation / SingleCatalog fixtures)
- `ArchLucid.Retrieval.Tests/`
- `ArchLucid.Api.Tests/` (`TenantIsolationSmokeTests.cs`)
- `docs/security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md` (coverage note)

**Size estimate:** **S** — ~1 eng day (incremental; spread across sibling items).

---



## TB-079 — ADO PR markdown — sanitize `SummaryHighlights` and deep-link fields

**Source:** Secrets, identity, and tool-sandboxing audit (2026-05-27).

**Problem:**

`GoldenManifestCompareMarkdownFormatter.cs` (L34–36) echoes `SummaryHighlights` from the compare response verbatim into the Azure DevOps PR comment body. `AzureDevOpsRunSummaryMarkdown` similarly embeds `operatorRunDeepLink` into a Markdown link without format validation. If compare metadata or run configuration is poisoned (e.g. via a malicious architecture run, a compromised evidence package, or a supply-chain attack on the compare endpoint), arbitrary Markdown — including HTML rendered in ADO's PR UI — can appear in PR comment threads visible to all reviewers.

This is not a WIQL or API-injection path (no ADO query APIs are used in C#), but it is a reflected-content injection into a developer-facing surface with potential for phishing links or hidden instructions embedded in PR threads.

**What to do:**

1. In `GoldenManifestCompareMarkdownFormatter`, strip or escape `SummaryHighlights` through a static `SanitizeMarkdownLine(string)` helper that removes bare HTML tags, trims to a maximum safe length (e.g. 500 chars), and rejects strings containing `<script`, `javascript:`, or `data:` prefixes.
2. In `AzureDevOpsRunSummaryMarkdown`, validate `operatorRunDeepLink` / `StatusTargetUrl` against an allowlist of URL schemes (`https://` only) and hostname suffix (your own domain) before embedding in `[...](url)` syntax.
3. Add unit tests in `ArchLucid.Integrations.AzureDevOps.Tests` covering both helpers with malicious inputs.
4. Consider a separate `AzureDevOpsMarkdownSanitizer` class so the policy is applied in one place and is testable independently.

**Affected files:**

- `ArchLucid.Integrations.AzureDevOps/GoldenManifestCompareMarkdownFormatter.cs`
- `ArchLucid.Integrations.AzureDevOps/AzureDevOpsRunSummaryMarkdown.cs`
- `ArchLucid.Integrations.AzureDevOps/AzureDevOpsPullRequestWireFormat.cs` (review `UnsafeRelaxedJsonEscaping` scope)
- `ArchLucid.Integrations.AzureDevOps.Tests/` (new sanitizer tests)

**Size estimate:** **XS** -- ~2-4 h.

---

## TB-080 — Azure OpenAI — migrate from `ApiKey` config key to `DefaultAzureCredential`

**Source:** Secrets, identity, and tool-sandboxing audit (2026-05-27).

**Problem:**

`ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs` registers the Azure OpenAI client using `AzureOpenAI:ApiKey` from configuration (symmetric key). All other Azure SDK clients in the production path use `DefaultAzureCredential` (blob, Key Vault, ACS email, marketplace billing, cross-tenant ARM via WIF). The OpenAI key is a long-lived symmetric secret requiring manual rotation and Key Vault reference discipline, and it cannot benefit from short-lived federated tokens or conditional access policies.

Azure OpenAI supports Entra ID (AAD) token-based authentication via `DefaultAzureCredential` on dedicated deployments (`https://{resource}.openai.azure.com`). Content Safety supports the same pattern.

**What to do:**

1. In `ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`, when `AzureOpenAI:Endpoint` is set and `AzureOpenAI:ApiKey` is absent or empty, instantiate `AzureOpenAIClient` with `new DefaultAzureCredential()` instead of `new ApiKeyCredential(...)`.
2. Allow `ApiKey` as a fallback for local development (consistent with how `BlobProvider=Local` vs `BlobProvider=AzureBlob` works elsewhere).
3. Add a production safety rule in `ProductionSafetyRules.cs`: if `AgentExecution:Mode` is not `Simulator`, warn (not fail) when `AzureOpenAI:ApiKey` is non-empty and does not start with `@Microsoft.KeyVault(`.
4. Update `appsettings.KeyVault.sample.json` to show the Key Vault reference pattern for `AzureOpenAI:ApiKey` alongside the managed-identity alternative.
5. Apply the same pattern to `AzureContentSafety:ApiKey` if it is wired similarly.

**Affected files:**

- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`
- `ArchLucid.Host.Core/Startup/Validation/Rules/ProductionSafetyRules.cs`
- `ArchLucid.Api/appsettings.KeyVault.sample.json`

**Size estimate:** **S** -- ~half day.

---

## TB-081 — `ArchLucidApiKey` — production safety rule: require Key Vault reference

**Source:** Secrets, identity, and tool-sandboxing audit (2026-05-27).

**Problem:**

`AzureDevOpsPullRequestDecorator.cs` (L118-120) attaches an `ArchLucidApiKey` header to the `GET /v1/compare` call that the ADO worker makes back to the ArchLucid API. This key is read from `AzureDevOps:ArchLucidApiKey` in configuration. Unlike the ADO PAT (which has a production guard in `ProductionSafetyRules.cs` requiring a Key Vault reference), no analogous rule exists for this key. A developer could accidentally commit a production key in `appsettings.json` with no enforcement feedback.

**What to do:**

1. In `ProductionSafetyRules.cs`, add a rule alongside `CollectAzureDevOpsPersonalAccessTokenKeyVaultReference`: if `AzureDevOps:Enabled` is true and `AzureDevOps:ArchLucidApiKey` is non-empty and does not start with `@Microsoft.KeyVault(`, emit a `ProductionSafetyViolation`.
2. Add a matching entry to `appsettings.KeyVault.sample.json`.
3. Add a unit test in `ArchLucid.Host.Core.Tests` covering the new rule.

**Affected files:**

- `ArchLucid.Host.Core/Startup/Validation/Rules/ProductionSafetyRules.cs`
- `ArchLucid.Api/appsettings.KeyVault.sample.json`
- `ArchLucid.Host.Core.Tests/` (production safety rule tests)

**Size estimate:** **XS** -- ~1-2 h.

---

## TB-082 — Agent `AllowedTools` — runtime enforcement at handler dispatch

**Source:** Secrets, identity, and tool-sandboxing audit (2026-05-27).

**Problem:**

`AgentTask.AllowedTools` (L88-93) is documented as "empty = unrestricted" and is used only as a hint inside prompt text (`AgentUserPromptBuilder.cs` L132-135). No code in `RealAgentExecutor` or the handler pipeline checks `AllowedTools` before dispatching to an `IAgentHandler`. This means a crafted agent task (or a prompt that manipulates which handler is chosen) cannot be blocked at the execution boundary by the allowlist.

While integrations (`AzureDevOps`, `AzureExtractor`) are not currently exposed as agent-callable tools -- so there is no immediate LLM->integration dispatch path -- the advisory-only posture leaves the architecture open to future accidental exposure if a handler is registered without an allowlist guard.

**What to do:**

1. In `RealAgentExecutor`, after resolving the handler by `AgentTypeKey`, check that `task.AllowedTools` is empty (unrestricted) **or** contains the resolved `AgentTypeKey`. Throw `AgentToolNotAllowedException` (new typed exception) if the check fails.
2. Treat `null` and empty collections as unrestricted (preserving current behaviour for existing callers).
3. Add unit tests covering: allowlist present and matching, allowlist present and not matching, null/empty allowlist.
4. Document the enforcement semantics in a comment on `AgentTask.AllowedTools`.

**Affected files:**

- `ArchLucid.AgentRuntime/RealAgentExecutor.cs`
- `ArchLucid.Core/Agents/AgentTask.cs` (comment update)
- `ArchLucid.AgentRuntime.Tests/` (new enforcement tests)

**Depends on:** No hard dependencies; pure behavioural guard.

**Size estimate:** **S** -- ~half day including tests.

---

## TB-083 — Service Bus — production safety rule: require namespace FQDN, disallow raw connection string

**Source:** Secrets, identity, and tool-sandboxing audit (2026-05-27).

**Problem:**

`ServiceCollectionExtensions.SchedulingAndAlerts.cs` (L368-378) supports two Service Bus registration paths: FQDN namespace + `DefaultAzureCredential`, or raw `IntegrationEvents:ServiceBusConnectionString`. The validator only requires that one of the two is set; there is no production rule forbidding the raw connection string analogous to the ADO PAT guard. A raw connection string contains a shared access key, bypasses Entra, and cannot be scoped to least-privilege roles via RBAC.

**What to do:**

1. In `ProductionSafetyRules.cs`, add a rule: if `IntegrationEvents:ServiceBusConnectionString` is non-empty and does not start with `@Microsoft.KeyVault(`, emit a `ProductionSafetyViolation`.
2. This still allows Key Vault-referenced connection strings in environments where FQDN + MI is not yet available (e.g. staging with SAS). Operators must actively opt out via Key Vault reference.
3. Add a matching entry to `appsettings.KeyVault.sample.json` showing both the Key Vault reference and the preferred FQDN pattern.
4. Add a unit test covering the new rule.

**Affected files:**

- `ArchLucid.Host.Core/Startup/Validation/Rules/ProductionSafetyRules.cs`
- `ArchLucid.Api/appsettings.KeyVault.sample.json`
- `ArchLucid.Host.Core.Tests/`

**Size estimate:** **XS** -- ~1-2 h.

---

## TB-084 — AzureExtractor — validate `SubscriptionId` as GUID before ARM URL construction

**Source:** Secrets, identity, and tool-sandboxing audit (2026-05-27).

**Problem:**

`GetOnlyHostedAzureArmReadClient.ListSubscriptionResourcesAsync` (L32-33) embeds `subscriptionId` directly into the ARM URL (`https://management.azure.com/subscriptions/{subscriptionId}/resources`). The current guard in `HostedAzureExtractorClient` only rejects whitespace. A malformed or path-traversal-style subscription ID (e.g. `../../tenants`) would be forwarded to ARM, which would return a 400/404 rather than being blocked locally. While ARM itself safely rejects invalid subscription IDs, a local format guard is cheap and closes the surface completely.

**What to do:**

1. In `HostedAzureExtractorClient` (or the request record validator), assert `Guid.TryParse(request.SubscriptionId, out _)` and throw `ArgumentException` with a clear message if the parse fails.
2. Apply the same guard to `CustomerTenantId` and `CustomerAppId` (both should be GUIDs per the WIF flow).
3. Add unit tests covering valid GUIDs, empty strings, whitespace, and path-segment strings.

**Affected files:**

- `ArchLucid.Integrations.AzureExtractor/HostedAzureExtractorClient.cs`
- `ArchLucid.Integrations.AzureExtractor.Tests/` (new validation tests)

**Size estimate:** **XS** -- ~1 h.

---

## TB-085 — SqlRelationalBackfill — paged entity scans + durable checkpoint table

**Source:** Backfill.Cli and Jobs.Cli operational review (2026-05-27).

**Problem:**

`SqlRelationalBackfillService` loads every header key for each stage into a `List<Guid>` (or tuple list for golden manifests) before processing one entity at a time. Memory use grows with table size; there is no resume cursor if the process is killed mid-run. Re-runs are safe at the slice level (count-before-insert guards) but restart from row 1 and repeat redundant SQL.

**What to do:**

1. Add `--batch-size N` (default 500) to `ArchLucid.Backfill.Cli` and thread through `SqlRelationalBackfillOptions`.
2. Replace full-table ID loads with paged queries (`ORDER BY CreatedUtc OFFSET @Skip FETCH NEXT @Take ROWS ONLY`) or Dapper `QueryUnbufferedAsync` with a manual page cursor.
3. Add `dbo.BackfillCheckpoints` (`Stage`, `LastProcessedKey`, `UpdatedUtc`) via DbUp + consolidated `ArchLucid.sql`; on start, read checkpoint and page from `LastProcessedKey` forward.
4. Update checkpoint after each successful page (or each successful entity within a page).
5. Document operator flow in [`SqlRelationalBackfill.md`](SqlRelationalBackfill.md) (resume, reset checkpoint, batch-size tuning).

**Acceptance criteria:**

- Backfill of a large catalog stays within bounded memory regardless of header count.
- Interrupt + re-run resumes from last checkpoint without reprocessing completed pages.
- `--readiness` mode unchanged.

**Affected files / projects:**

- `ArchLucid.Backfill.Cli/Program.cs`
- `ArchLucid.Persistence/Coordination/Backfill/SqlRelationalBackfillService.cs`
- `ArchLucid.Persistence/Coordination/Backfill/SqlRelationalBackfillOptions.cs`
- `ArchLucid.Persistence/Migrations/` + `ArchLucid.Persistence/Scripts/ArchLucid.sql`
- `docs/library/SqlRelationalBackfill.md`

**Cross-ref:** **TB-090** (machine-readable report for pipeline verification).

**Size estimate:** **M** — ~1–2 days.

---

## TB-086 — SqlRelationalBackfill — poison-row quarantine (`BackfillFailures` + `--max-retries`)

**Source:** Backfill.Cli and Jobs.Cli operational review (2026-05-27).

**Problem:**

A row that repeatedly fails (corrupt JSON, missing blob payload, schema mismatch) is caught, logged, and added to `SqlRelationalBackfillReport.Failures`, but the next run attempts the same entity again. There is no quarantine, dead-letter list, or skip-after-N-failures mechanism. An operator or CI loop chasing exit code 0 can spin forever on one bad row.

**What to do:**

1. Add `dbo.BackfillFailures` (`Stage`, `EntityKey`, `FailureCount`, `LastError`, `LastAttemptUtc`, `SkippedAfterMaxRetries`) via DbUp + consolidated DDL.
2. On failure, upsert failure row; on success, delete failure row for that `(Stage, EntityKey)`.
3. Add `--max-retries N` (default 3) to Backfill.Cli; skip entities where `FailureCount >= N` unless `--force-retry` is passed.
4. Include skipped/quarantined entities in console summary and (when **TB-090** lands) JSON report output.
5. Document quarantine reset procedure in [`SqlRelationalBackfill.md`](SqlRelationalBackfill.md).

**Acceptance criteria:**

- Third consecutive failure on the same entity is skipped on the next run (default).
- Operator can inspect quarantined rows in SQL and force retry when source data is repaired.

**Affected files / projects:**

- `ArchLucid.Backfill.Cli/Program.cs`
- `ArchLucid.Persistence/Coordination/Backfill/SqlRelationalBackfillService.cs`
- `ArchLucid.Persistence/Coordination/Backfill/SqlRelationalBackfillReport.cs`
- `ArchLucid.Persistence/Migrations/` + `ArchLucid.Persistence/Scripts/ArchLucid.sql`

**Size estimate:** **S** — ~4–8 h.

---

## TB-087 — Findings backfill slice — DB-level idempotency (remove double COUNT race)

**Source:** Backfill.Cli and Jobs.Cli operational review (2026-05-27).

**Problem:**

`BackfillFindingsSnapshotsAsync` checks `COUNT(1)` on `FindingRecords` in the service, then calls `SqlFindingsSnapshotRepository.BackfillRelationalSlicesAsync`, which performs the same check. The service-level check uses a separate connection without sharing the insert transaction, so two concurrent backfill processes can both observe `COUNT = 0` and insert duplicate finding rows. Safety today relies on manual serialization, not database enforcement. Golden-manifest provenance slices use per-table count guards inside one transaction and are lower risk; this item closes the findings-specific gap.

**What to do:**

1. Remove the redundant service-level count gate in `SqlRelationalBackfillService.BackfillFindingsSnapshotsAsync`; rely on repository logic inside the entity transaction only.
2. Add a DbUp migration + consolidated DDL constraint preventing duplicate slice materialization — prefer `UNIQUE` on the natural child key or `MERGE`/upsert semantics in `InsertFindingRecordsRelationalAsync`.
3. Add integration test: two concurrent backfill attempts for the same `FindingsSnapshotId` yield exactly one set of child rows.
4. Note in [`SqlRelationalBackfill.md`](SqlRelationalBackfill.md) that re-runs do not duplicate provenance or cost rows (backfill touches no cost tables).

**Acceptance criteria:**

- Concurrent reruns cannot double-insert `FindingRecords` for the same snapshot.
- Idempotent rerun after partial success remains safe.

**Affected files / projects:**

- `ArchLucid.Persistence/Coordination/Backfill/SqlRelationalBackfillService.cs`
- `ArchLucid.Persistence/Repositories/SqlFindingsSnapshotRepository.cs`
- `ArchLucid.Persistence/Migrations/` + `ArchLucid.Persistence/Scripts/ArchLucid.sql`
- `ArchLucid.Persistence.Tests/` (concurrency or duplicate-guard test)

**Cross-ref:** **TB-012** (**INV-009** idempotency).

**Size estimate:** **XS–S** — ~2–4 h.

---

## TB-088 — Container App jobs — per-entity error isolation in multi-tenant loops

**Source:** Backfill.Cli and Jobs.Cli operational review (2026-05-27).

**Problem:**

`TrialLifecycleArchLucidJob` and `AdvisoryScanArchLucidJob` catch a single top-level `Exception` and return `JobFailure` for the entire run. One bad tenant or schedule causes Azure Container Apps to retry the whole job, re-processing healthy entities. `ServiceBusIntegrationEventsArchLucidJob` and `AuditEventChangeFeedArchLucidJob` already bound work and delegate poison handling to the broker or Cosmos SDK; multi-entity jobs do not.

**What to do:**

1. In `TrialLifecycleArchLucidJob`, wrap each `TryAdvanceTenantAsync` call in try/catch; log tenant id + error; continue loop; return `JobFailure` only if any entity failed (aggregate failure count in log/metric).
2. Apply the same pattern in `AdvisoryScanArchLucidJob` / `AdvisoryDueScheduleProcessor` if failures currently bubble out of per-schedule processing.
3. Add structured log fields: `TenantId` or `ScheduleId`, `FailureCount`, `SuccessCount`.
4. Optional: emit OTel counter `archlucid_container_job_entity_failures_total` tagged by `job_name`.
5. Document ACA retry semantics in [`CONTAINER_APPS_JOBS.md`](../runbooks/CONTAINER_APPS_JOBS.md).

**Acceptance criteria:**

- One failing trial tenant does not prevent other tenants from advancing in the same invocation.
- Job still exits non-zero when any entity failed so ACA can alert, without re-running successful entities on every retry (downstream idempotency required).

**Affected files / projects:**

- `ArchLucid.Host.Core/Jobs/TrialLifecycleArchLucidJob.cs`
- `ArchLucid.Host.Core/Jobs/AdvisoryScanArchLucidJob.cs`
- `ArchLucid.Application/` (if `AdvisoryDueScheduleProcessor` needs per-schedule catch)
- `docs/runbooks/CONTAINER_APPS_JOBS.md`

**Size estimate:** **S** — ~4–8 h.

---

## TB-089 — Digest delivery scanners — record delivery before send (ACA retry idempotency)

**Source:** Backfill.Cli and Jobs.Cli operational review (2026-05-27).

**Problem:**

`ExecDigestWeeklyArchLucidJob`, `WeeklyExecutiveSummaryJob`, and related delivery scanners delegate to Application-layer scanners. If delivery is recorded **after** send and Azure Container Apps retries the job on non-zero exit, operators may receive duplicate digest emails. Jobs.Cli does not write cost or provenance rows; the risk here is customer-visible duplicate notifications, not FinOps double-counting.

**What to do:**

1. Audit `ExecDigestWeeklyDeliveryScanner`, `WeeklyExecutiveSummaryDeliveryScanner`, and `WeeklyArchitectureDigestJobRunner` for send vs persist order.
2. Ensure idempotency key (tenant + digest period + channel) is written **before** outbound send, or use outbox pattern with at-least-once safe consumers.
3. Add unit/integration tests: simulated retry after send does not enqueue a second delivery for the same period.
4. Document idempotency contract in scanner XML comments and [`CONTAINER_APPS_JOBS.md`](../runbooks/CONTAINER_APPS_JOBS.md).

**Acceptance criteria:**

- ACA job retry for the same schedule window does not send a second email when the first send succeeded.
- Failed send before record leaves room for legitimate retry.

**Affected files / projects:**

- `ArchLucid.Application/` (digest scanner implementations — locate via `ExecDigestWeeklyDeliveryScanner`, `WeeklyExecutiveSummaryDeliveryScanner`)
- `ArchLucid.Host.Core/Jobs/ExecDigestWeeklyArchLucidJob.cs`
- `ArchLucid.Host.Core/Jobs/WeeklyExecutiveSummaryJob.cs`
- `ArchLucid.Host.Core/Jobs/WeeklyArchitectureDigestArchLucidJob.cs`
- Application tests for scanner idempotency

**Cross-ref:** **TB-061** (decision-needed governance digest recurrence).

**Size estimate:** **S** — ~4–8 h.

---

## TB-090 — Backfill.Cli — `--output-json` report + per-stage timing

**Source:** Backfill.Cli and Jobs.Cli operational review (2026-05-27).

**Problem:**

Backfill.Cli emits console logging only (no OpenTelemetry). Exit codes `0/1/2/3` are machine-readable, but failure details and per-stage duration are not available to CI pipelines or audit logs without log scraping. Jobs.Cli already has Serilog + OTel via `JobRunTelemetry`; Backfill is the gap.

**What to do:**

1. Add `--output-json <path>` to Backfill.Cli; serialize `SqlRelationalBackfillReport` (and readiness report when `--readiness`) including stage timings, processed/success/failure counts, and failure list.
2. Record elapsed milliseconds per stage in `SqlRelationalBackfillReport`.
3. Optional: single OTel counter `archlucid_backfill_entities_processed_total` tagged by `stage` and `outcome` when run under an OTel-enabled host (lower priority than JSON file).
4. Document flag in `Program.cs` help text and [`SqlRelationalBackfill.md`](SqlRelationalBackfill.md).

**Acceptance criteria:**

- CI can assert backfill success/failure from JSON without parsing unstructured console output.
- Readiness mode writes equivalent JSON shape for slice coverage.

**Affected files / projects:**

- `ArchLucid.Backfill.Cli/Program.cs`
- `ArchLucid.Persistence/Coordination/Backfill/SqlRelationalBackfillReport.cs`
- `ArchLucid.Persistence/Coordination/Backfill/CutoverReadinessReport.cs` (if extended)
- `docs/library/SqlRelationalBackfill.md`

**Cross-ref:** **TB-085**, **TB-086** (quarantine/skipped rows in JSON output).

**Size estimate:** **XS** — ~2–4 h.

---
## TB-091 --- Key Vault private endpoint + private DNS zone (`privatelink.vaultcore.azure.net`)

**Source:** IaC parity audit (2026-05-27). Canvas: `canvases/iac-parity-audit.canvas.tsx`.

**Problem:**

`terraform-keyvault` sets `public_network_access_enabled = false` on the Key Vault, making it reachable only via private endpoint. However, `terraform-private/network.tf` only creates private DNS zones and endpoints for SQL (`privatelink.database.windows.net`), Blob (`privatelink.blob.core.windows.net`), and optionally AI Search (`privatelink.search.windows.net`). There is no `azurerm_private_dns_zone` for `privatelink.vaultcore.azure.net` and no `azurerm_private_endpoint` targeting the vault. If a private endpoint and DNS zone were created in the portal to make the vault reachable, Terraform has no knowledge of them and cannot manage lifecycle, rotation, or deletion.

**What to do:**

1. Add `azurerm_private_dns_zone` for `privatelink.vaultcore.azure.net` in `terraform-private/network.tf` (conditional on `local.pe_enabled`).
2. Add `azurerm_private_dns_zone_virtual_network_link` linking the vault DNS zone to the VNet.
3. Add `azurerm_private_endpoint` for the Key Vault, accepting `var.key_vault_id` as an input variable (same pattern as `var.storage_account_id` for Blob endpoint).
4. Wire the DNS zone group into the private endpoint block.
5. Export the private endpoint ID as an output for downstream diagnostic visibility.

**Acceptance criteria:**

- `terraform plan` on `terraform-private` creates the vault private DNS zone, VNet link, and private endpoint when `enable_private_data_plane = true` and `key_vault_id` is provided.
- `terraform validate` passes; no new breaking variable is required (key_vault_id should default to `""`).

**Affected files / projects:**

- `infra/terraform-private/network.tf`
- `infra/terraform-private/variables.tf`
- `infra/terraform-private/outputs.tf`

**Cross-ref:** **TB-092** (workload RBAC to read from same vault), **TB-080** (Azure OpenAI credential migration to managed identity).

**Size estimate:** **XS--S** --- ~2--4 h.

---

## TB-092 --- Key Vault Secrets User RBAC for API + Worker managed identities

**Source:** IaC parity audit (2026-05-27). Canvas: `canvases/iac-parity-audit.canvas.tsx`.

**Problem:**

`terraform-keyvault` grants `Key Vault Secrets Officer` only to `var.admin_object_ids` (human administrators). The Container Apps API and Worker both carry `SystemAssigned` managed identities and read secrets at runtime via `@Microsoft.KeyVault(...)` references (`appsettings.KeyVault.sample.json`). The `Key Vault Secrets User` role assignments for these identities are absent from every Terraform root. They must be created in the portal after deployment and are subject to drift whenever Container Apps are recreated.

**What to do:**

1. Add `var.api_managed_identity_principal_id` and `var.worker_managed_identity_principal_id` to `terraform-keyvault/variables.tf` (default `""`).
2. Add two `azurerm_role_assignment` resources (`Key Vault Secrets User` on vault scope) conditional on non-empty principal IDs.
3. Document in `terraform-keyvault/variables.tf` that these IDs come from the `principal_id` output of `azurerm_container_app.api[0].identity[0]` and `.worker[0]`.
4. Update `apply-saas.ps1` (or greenfield apply docs) to pass these outputs across roots.

**Acceptance criteria:**

- After `terraform apply` on `terraform-keyvault` and `terraform-container-apps`, the API and Worker managed identities have `Key Vault Secrets User` on the vault without any manual portal step.
- No `Key Vault Secrets Officer` is granted to workload identities (least privilege).

**Affected files / projects:**

- `infra/terraform-keyvault/main.tf`
- `infra/terraform-keyvault/variables.tf`

**Cross-ref:** **TB-091** (vault private endpoint so the vault is reachable), **TB-080** (migrate OpenAI from ApiKey to managed identity).

**Size estimate:** **XS** --- ~1--2 h.

---

## TB-093 --- Create `terraform-openai` root --- provision Azure OpenAI account + model deployments

**Source:** IaC parity audit (2026-05-27). Canvas: `canvases/iac-parity-audit.canvas.tsx`.

**Problem:**

`terraform-openai/main.tf` explicitly states the Azure OpenAI resource "may be out-of-band" and only manages a consumption budget. The Cognitive Services account itself (`Microsoft.CognitiveServices/accounts`), model deployments (completion, embedding), content filter policies, CMK configuration, private endpoint, and diagnostic settings are all managed outside Terraform. `ArchLucid.AgentRuntime` and `ArchLucid.Retrieval` both depend on this service at runtime (`Azure.AI.OpenAI` NuGet, `AzureOpenAI` config section). Any quota change, model version bump, or capacity reconfiguration done in the portal cannot be reviewed as code or reproduced automatically. Cross-ref **TB-080** (migrate from API key to `DefaultAzureCredential` --- the Terraform root must emit the endpoint so the app can be switched to managed identity auth).

**What to do:**

1. Rename or extend `terraform-openai` to own the `azurerm_cognitive_account` resource (kind `OpenAI`, sku `S0`).
2. Add `azurerm_cognitive_deployment` blocks for the completion and embedding model deployments, accepting model name and capacity as variables.
3. Add optional `azurerm_private_endpoint` and `azurerm_private_dns_zone` for `privatelink.openai.azure.com`.
4. Add `azurerm_monitor_diagnostic_setting` forwarding to Log Analytics.
5. Expose `cognitive_account_endpoint` and `cognitive_account_id` as outputs so downstream roots can use managed identity instead of API key.
6. Update `infra/terraform-pilot/main.tf` `nested_infrastructure_roots` to mark `openai` as `pilot_essential = true`.

**Acceptance criteria:**

- `terraform apply` on `terraform-openai` creates the Cognitive Services account and at least one model deployment.
- Endpoint output can be consumed by `terraform-container-apps` as an env var, replacing hard-coded API key config.
- Existing consumption budget resource is preserved.

**Affected files / projects:**

- `infra/terraform-openai/main.tf`, `variables.tf`, `outputs.tf`
- `infra/terraform-pilot/main.tf` (pilot_essential flag)

**Cross-ref:** **TB-080** (Entra auth migration), **TB-091** (private endpoint pattern), **TB-092** (managed identity chain).

**Size estimate:** **M** --- ~8--16 h (model deployment API is still evolving; validate azurerm provider version support).

---

## TB-094 --- Create `terraform-redis` root --- Azure Cache for Redis hot-path cache

**Source:** IaC parity audit (2026-05-27). Canvas: `canvases/iac-parity-audit.canvas.tsx`.

**Problem:**

`appsettings.Production.json` has `HotPathCache.Provider = "Auto"` and `HotPathCache.RedisConnectionString = ""` (filled at runtime from Key Vault). `Azure.Cache for Redis` is not referenced by any Terraform root --- SKU, capacity, geo-replication, eviction policy, TLS version, and private endpoint are entirely portal-managed. No `azurerm_redis_cache` resource exists anywhere.

**What to do:**

1. Create `infra/terraform-redis/` with `main.tf`, `variables.tf`, `outputs.tf`, `providers.tf`, `versions.tf`, `backend.tf`, `checks.tf`.
2. Provision `azurerm_redis_cache` (minimum C1 Standard for staging, C3/P1 for production; accept SKU as variable).
3. Set `minimum_tls_version = "TLS1_2"`, `enable_non_ssl_port = false`.
4. Add optional `azurerm_private_endpoint` + `azurerm_private_dns_zone` for `privatelink.redis.cache.windows.net`.
5. Add `azurerm_monitor_diagnostic_setting` forwarding to Log Analytics.
6. Export connection string as a Key Vault secret or output for consumption by `terraform-container-apps`.
7. Add root to `infra/terraform-pilot/main.tf` `nested_infrastructure_roots`.

**Acceptance criteria:**

- `terraform apply` creates an accessible Redis Cache instance.
- `HotPathCache.RedisConnectionString` is sourced from Terraform output (not a manual portal step).
- `terraform validate` passes with no speculative variables.

**Affected files / projects:**

- `infra/terraform-redis/` (new root)
- `infra/terraform-pilot/main.tf`

**Cross-ref:** **TB-091** (private endpoint pattern), `appsettings.Production.json`.

**Size estimate:** **S** --- ~4--8 h.

---

## TB-095 --- Assess + codify Cosmos DB --- create `terraform-cosmos` root if active in production

**Source:** IaC parity audit (2026-05-27). Canvas: `canvases/iac-parity-audit.canvas.tsx`.

**Problem:**

`appsettings.json` has a `CosmosDb.ConnectionString` key and `Microsoft.Azure.Cosmos` (v3.46.0) is a NuGet reference in `ArchLucid.Persistence`. No `azurerm_cosmosdb_account`, database, or container exists in any Terraform root. It is unclear whether Cosmos DB is active in the current hosted production environment or is a dormant/future dependency. If active, consistency level, throughput, geo-redundancy, backup policy, private endpoint, and RBAC are entirely portal-managed.

**What to do:**

1. **Assessment first:** Determine whether a Cosmos DB account is provisioned in the production subscription by querying Terraform state or Azure. Document the result as a comment in this item.
2. If active: Create `infra/terraform-cosmos/` owning `azurerm_cosmosdb_account`, `azurerm_cosmosdb_sql_database`, and `azurerm_cosmosdb_sql_container` with appropriate partition key, throughput, and indexing policy.
3. Configure `consistency_policy` (minimum `Session`), `backup` (continuous or periodic), geo-redundancy as variables.
4. Add optional private endpoint for `privatelink.documents.azure.com`.
5. Add `azurerm_monitor_diagnostic_setting`.
6. If not active: Add a `// CosmosDb is dormant --- not provisioned` comment to `appsettings.json` and remove the `Microsoft.Azure.Cosmos` NuGet from projects that do not use it.

**Acceptance criteria:**

- Either: `terraform apply` on `terraform-cosmos` creates the account; connection string is Key Vault-sourced.
- Or: `CosmosDb.ConnectionString` is documented as dormant and the NuGet reference is scoped only to the consuming project.

**Affected files / projects:**

- `infra/terraform-cosmos/` (new root, if active)
- `ArchLucid.Persistence/` (NuGet ref scoping if dormant)
- `ArchLucid.Api/appsettings.json` (comment if dormant)

**Cross-ref:** **TB-091** (private endpoint pattern).

**Size estimate:** **S--M** --- ~4--12 h depending on assessment outcome.

---

## TB-096 --- Create `terraform-search` root --- Azure AI Search service

**Source:** IaC parity audit (2026-05-27). Canvas: `canvases/iac-parity-audit.canvas.tsx`.

**Problem:**

`ArchLucid.Retrieval` references `Azure.Search.Documents` (v11.6.0) and `appsettings.Advanced.json` sets `Retrieval.Reranking.Provider = "AzureAiSearchSemantic"`. `terraform-private/network.tf` already accepts `var.search_service_id` and will create a private endpoint and DNS zone for `privatelink.search.windows.net` if provided --- but the Azure AI Search service itself is never created by any Terraform root. SKU, replica count, semantic ranking configuration, and network rules are entirely portal-managed. Cross-ref **TB-071** (production search client registration gap).

**What to do:**

1. Create `infra/terraform-search/` with `main.tf`, `variables.tf`, `outputs.tf`, `providers.tf`, `versions.tf`, `backend.tf`, `checks.tf`.
2. Provision `azurerm_search_service` with SKU as variable (minimum `basic` for staging, `standard` for production), replica and partition count, semantic search tier.
3. Set `public_network_access_enabled = false` if VNet integration is enabled.
4. Export `search_service_id` and `primary_key` (or use managed identity) for consumption by `terraform-private` and `terraform-container-apps`.
5. Add `azurerm_monitor_diagnostic_setting`.
6. Add root to `terraform-pilot/main.tf` as non-pilot-essential.

**Acceptance criteria:**

- `terraform apply` creates an AI Search service.
- `var.search_service_id` output can be fed directly into `terraform-private` to create the private endpoint.
- Semantic ranking is enabled for production SKU.

**Affected files / projects:**

- `infra/terraform-search/` (new root)
- `infra/terraform-private/network.tf`, `variables.tf`
- `infra/terraform-pilot/main.tf`

**Cross-ref:** **TB-071** (production search client registration), **TB-091** (private endpoint pattern).

**Size estimate:** **S** --- ~4--8 h.

---

## TB-097 --- Create `terraform-acr` root --- Azure Container Registry

**Source:** IaC parity audit (2026-05-27). Canvas: `canvases/iac-parity-audit.canvas.tsx`.

**Problem:**

`terraform-container-apps` reads the ACR via `data "azurerm_container_registry"` but no `azurerm_container_registry` resource exists in any Terraform root. Geo-replication, retention policies (image tag retention, untagged manifest purge), network rules, diagnostic settings, and the admin account toggle are all portal-managed. The CD workflow pushes images to ACR via OIDC but the registry itself has no IaC lifecycle.

**What to do:**

1. Create `infra/terraform-acr/` with `main.tf`, `variables.tf`, `outputs.tf`, `providers.tf`, `versions.tf`, `backend.tf`.
2. Provision `azurerm_container_registry` with SKU `Premium` (required for geo-replication and private endpoint), `admin_enabled = false`, `public_network_access_enabled` as variable.
3. Add optional `azurerm_container_registry_geo_replication` for the secondary region.
4. Add `azurerm_private_endpoint` + DNS zone for `privatelink.azurecr.io` when private networking is enabled.
5. Add `azurerm_monitor_diagnostic_setting`.
6. Export `login_server`, `id`, and `resource_group_name` so `terraform-container-apps` can replace its `data` block with a direct reference (or continue using `data` if cross-state references are not desirable).
7. Add to `terraform-pilot/main.tf` as pilot-essential.

**Acceptance criteria:**

- `terraform apply` creates the registry with the correct SKU and admin account disabled.
- Existing `terraform-container-apps` continues to function (either consuming output or data block unchanged).
- CD workflow `AZURE_*` secrets align with new registry.

**Affected files / projects:**

- `infra/terraform-acr/` (new root)
- `infra/terraform-pilot/main.tf`
- `.github/workflows/cd.yml` (verify ACR references)

**Cross-ref:** **TB-091** (private endpoint pattern), `infra/terraform-container-apps/main.tf`.

**Size estimate:** **S** --- ~4--8 h.

---

## TB-098 --- Add `azurerm_monitor_workspace` to `terraform-monitoring`

**Source:** IaC parity audit (2026-05-27). Canvas: `canvases/iac-parity-audit.canvas.tsx`.

**Problem:**

Both Prometheus rule group resources in `terraform-monitoring` (`azurerm_monitor_alert_prometheus_rule_group.archlucid_p0` and `azurerm_monitor_alert_prometheus_rule_group.archlucid_slo`) accept `var.azure_monitor_workspace_id` as their `scopes` value. The Azure Monitor Workspace (`Microsoft.Monitor/accounts`) that backs managed Prometheus is never created by any Terraform root. If the workspace is recreated, renamed, or drifts in the portal, `terraform apply` will fail with a scope resolution error.

**What to do:**

1. Add `resource "azurerm_monitor_workspace" "prometheus"` to `terraform-monitoring/main.tf` (conditional on `var.enable_monitoring_stack && var.enable_prometheus_slo_rule_group`).
2. Expose the workspace ID as an output so operators can also register it with Azure Monitor for Prometheus scrape config.
3. Remove `var.azure_monitor_workspace_id` as a raw input variable; derive it from the resource (or keep as override for bring-your-own workspace scenarios).

**Acceptance criteria:**

- `terraform apply` on `terraform-monitoring` creates the Azure Monitor Workspace when Prometheus rules are enabled.
- P0 and SLO rule group `scopes` point to a Terraform-managed resource ID.

**Affected files / projects:**

- `infra/terraform-monitoring/main.tf`
- `infra/terraform-monitoring/variables.tf`
- `infra/terraform-monitoring/outputs.tf`

**Cross-ref:** `infra/terraform-monitoring/prometheus_p0_rules.tf`, `prometheus_slo_rules.tf`.

**Size estimate:** **XS** --- ~1--2 h.

---

## TB-099 --- Add diagnostic settings for Container Apps, Service Bus namespace, and artifact storage account

**Source:** IaC parity audit (2026-05-27). Canvas: `canvases/iac-parity-audit.canvas.tsx`.

**Problem:**

`terraform-logicapps/diagnostics.tf` already establishes the pattern: for each Logic App Standard site, an `azurerm_monitor_diagnostic_setting` forwards `allLogs + AllMetrics` to a Log Analytics workspace. Three resource classes have no equivalent:

1. **Container Apps** (API, Worker, UI, OTEL) --- console logs and system logs categories not codified.
2. **Service Bus namespace** --- `OperationalLogs` and `DiagnosticErrorLogs` not codified.
3. **Artifact storage account** --- `StorageRead`, `StorageWrite`, `StorageDelete`, `Transaction` metrics not codified.

If these were configured in the portal post-deploy, Terraform cannot manage or reproduce them.

**What to do:**

1. **Container Apps:** Add `for_each` `azurerm_monitor_diagnostic_setting` in `terraform-container-apps/main.tf` (or a new `diagnostics.tf`) over a map of `{ api = ..., worker = ..., ui = ..., otel = ... }` resource IDs, forwarding `ContainerAppConsoleLogs` and `ContainerAppSystemLogs` to `azurerm_log_analytics_workspace.container_apps[0].id`. Make conditional on `var.enable_container_app_diagnostics` (default `false` to avoid breaking existing deployments).
2. **Service Bus:** Add `azurerm_monitor_diagnostic_setting` in `terraform-servicebus/` (new `diagnostics.tf`) accepting `var.log_analytics_workspace_id` as optional input.
3. **Storage:** Add `azurerm_monitor_diagnostic_setting` in `terraform-storage/` (new `diagnostics.tf`) for blob service logs (`StorageRead`, `StorageWrite`, `StorageDelete`) conditional on a `var.log_analytics_workspace_id` input.

**Acceptance criteria:**

- `terraform plan` with diagnostics enabled shows the three diagnostic setting resources without errors.
- Pattern is consistent with `terraform-logicapps/diagnostics.tf` (conditional, Log Analytics target, `allLogs` or category-scoped).

**Affected files / projects:**

- `infra/terraform-container-apps/diagnostics.tf` (new)
- `infra/terraform-servicebus/diagnostics.tf` (new)
- `infra/terraform-storage/diagnostics.tf` (new)

**Cross-ref:** `infra/terraform-logicapps/diagnostics.tf` (reference pattern).

**Size estimate:** **S** --- ~3--6 h.

---

## TB-100 --- Migrate Logic App Standard storage from access-key to managed identity

**Source:** IaC parity audit (2026-05-27). Canvas: `canvases/iac-parity-audit.canvas.tsx`.

**Problem:**

All 7 Logic App Standard resources in `terraform-logicapps/main.tf` pass `storage_account_access_key = azurerm_storage_account.logic[0].primary_access_key` (and equivalents for governance, marketplace, trial, etc.). The access key is stored in Terraform state and in the Logic App configuration. Key rotation done in the Azure portal or via `az storage account keys renew` will break the Logic App until Terraform is re-applied. No RBAC assignment to the Logic App managed identity exists for the storage accounts.

**What to do:**

1. Remove `storage_account_access_key` from all `azurerm_logic_app_standard` blocks (supported in Logic Apps runtime 4.x with `WEBSITE_CONTENTAZUREFILECONNECTIONSTRING` replaced by managed identity).
2. Add `azurerm_role_assignment` resources granting the Logic App `SystemAssigned` identity `Storage Blob Data Owner` and `Storage File Data Privileged Contributor` on each Logic App's storage account.
3. Set `app_settings` `WEBSITE_RUN_FROM_PACKAGE = "1"` and remove connection string app settings that reference the access key.
4. Verify Logic App runtime version is `~4` (already set) and test in staging before production rollout.

**Acceptance criteria:**

- `terraform apply` creates all Logic App RBAC assignments without passing `storage_account_access_key`.
- Portal-side key rotation does not break Logic Apps.
- `terraform state show` on Logic App resources contains no `storage_account_access_key` attribute.

**Affected files / projects:**

- `infra/terraform-logicapps/main.tf`

**Cross-ref:** **TB-092** (managed identity RBAC pattern for Key Vault).

**Size estimate:** **M** --- ~6--12 h (includes staging validation).

---

## TB-101 --- Resolve legacy App Service VNet integration in `terraform-private/app_service.tf`

**Source:** IaC parity audit (2026-05-27). Canvas: `canvases/iac-parity-audit.canvas.tsx`.

**Problem:**

`terraform-private/app_service.tf` declares `azurerm_app_service_virtual_network_swift_connection` referencing `var.linux_web_app_id` and `var.web_app_vnet_integration_subnet_id`. The system's application layer runs on Azure Container Apps, not App Service. This file implies either (a) a legacy Linux Web App still exists in Azure and the resource may be in Terraform state, or (b) the file is forward-compatibility scaffolding with no live resource. In case (a) the web app is unmanaged by any active Terraform root.

**What to do:**

1. Inspect Terraform state for `terraform-private`: `terraform state list | grep swift` to determine if the resource has ever been applied.
2. If resource exists in state with a live Azure resource ID: determine whether the App Service is still in use. If not, run `terraform destroy -target=azurerm_app_service_virtual_network_swift_connection.web_app` and decommission the App Service.
3. If resource has never been applied (variable was always empty): add a comment to `app_service.tf` stating it is reserved for a potential future App Service integration and no live resource exists.
4. Update `variables.tf` to document the optional nature of `var.linux_web_app_id`.

**Acceptance criteria:**

- After this item: the status of the web app VNet integration resource is documented with certainty.
- No orphaned Azure resource exists outside Terraform management.

**Affected files / projects:**

- `infra/terraform-private/app_service.tf`
- `infra/terraform-private/variables.tf`

**Cross-ref:** `infra/terraform-container-apps/` (Container Apps is the active compute layer).

**Size estimate:** **XS** --- ~1--2 h.

---

## TB-102 --- Parameterize `application_insights_sampling_percentage` in `terraform-monitoring`

**Source:** IaC parity audit (2026-05-27). Canvas: `canvases/iac-parity-audit.canvas.tsx`.

**Problem:**

`terraform-monitoring/application_insights.tf` sets `sampling_percentage = 100` as a hardcoded literal. At production scale this means every trace is ingested, which can produce very high Log Analytics ingestion costs. Pilot profile documentation (`docs/library/PILOT_PROFILE.md`) already mentions aligning `app_insights_sampling_percent` but there is no corresponding variable. Operators cannot adjust sampling without editing the `.tf` source file and committing a change.

**What to do:**

1. Add `variable "application_insights_sampling_percentage"` to `terraform-monitoring/variables.tf` with `type = number`, `default = 100`, validation `>= 0 && <= 100`, and a description noting that lowering to 10--20 is appropriate for high-volume production environments.
2. Replace the hardcoded `sampling_percentage = 100` literal in `application_insights.tf` with `var.application_insights_sampling_percentage`.
3. Document the variable in the pilot profile (`PILOT_PROFILE.md`) and monitoring runbook.

**Acceptance criteria:**

- Operators can set `application_insights_sampling_percentage = 20` in `production.tfvars` without editing `.tf` files.
- Existing deployments using default value are unaffected (value remains 100 unless overridden).

**Affected files / projects:**

- `infra/terraform-monitoring/application_insights.tf`
- `infra/terraform-monitoring/variables.tf`

**Cross-ref:** `docs/library/PILOT_PROFILE.md`.

**Size estimate:** **XS** --- ~30 min.

---

## TB-103 — Orphan candidate count + savings — expose via backend API; remove UI heuristic parser

**Source:** Cross-layer domain-term audit (2026-05-27).

**Problem:**

"Orphan candidate" count and annualised savings are computed by two independent pipelines that share neither inputs nor algorithm:

| Layer | File | Input | Algorithm |
|-------|------|-------|-----------|
| Backend | `ArchLucid.ArtifactSynthesis/Classifiers/OrphanedResourceClassifier.cs` | `resources.json` (ARM dump) | Deterministic ARM rules (unattached disks, NICs without VM, public IPs without `ipConfiguration`) |
| Backend | `ArchLucid.Application/Findings/OrphanedAzureResourceFindingEngine.cs` | Above classifier | Emits typed `OrphanedAzureResource` findings |
| **Frontend** | `archlucid-ui/src/lib/run-potential-savings-parser.ts` | `orphan-candidates.json` (extractor artifact) | Regex heuristic: coerces `candidates`/`resources`/`items`/`orphans` arrays; sums cost fields by keyword match |
| **Frontend** | `archlucid-ui/src/app/(operator)/dashboard/_sections/ExecutiveOrphanCandidatesCard.tsx` | Above parser | `count = array.length`, `savings = heuristic USD sum` |

The UI card never reads backend orphan findings. Count and dollar figures can diverge from server-side classification without either side producing an error. The heuristic string matching in `run-potential-savings-parser.ts` (`\borgan\b`, cost-field keyword scan) is a maintenance liability as extractor output shapes evolve.

**What to do:**

1. Add a new read model / query in `ArchLucid.Application` (or extend `ExecutiveRoiSummaryService`) that exposes `OrphanCandidateSummary { Count: int, AnnualSavingsUsd: decimal, EvidenceRunId: Guid }` derived from committed `OrphanedAzureResource` findings for the tenant's latest analysed run.
2. Expose the new field on `GET /v1/roi/executive-summary` response (`ExecutiveRoiSummaryResponse`) — or as a dedicated `GET /v1/roi/orphan-candidate-summary` endpoint if the data source is a separate analysis pipeline.
3. Replace `ExecutiveOrphanCandidatesCard.tsx` to call the API field instead of fetching and parsing `orphan-candidates.json`.
4. Delete `heuristicAnnualUsdOpportunityFromOrphanCandidatesJson`, `coerceOrphanList`, and `sumOrphanCandidateRowUsdAnnual` from `run-potential-savings-parser.ts` once no remaining callers exist. Retain `run-savings-summary-model.ts` only if it is still needed for a different artifact type.
5. Update `RunSavingsSummary.tsx` JSDoc comment which references `orphan-candidates.json` directly.
6. Add a unit test asserting the new API field matches the count produced by `OrphanedResourceClassifier` given a known `resources.json` fixture.

**Acceptance criteria:**

- `ExecutiveOrphanCandidatesCard` displays count and savings sourced from the backend without fetching any raw artifact JSON.
- `run-potential-savings-parser.ts` contains no heuristic orphan logic (or the file is deleted if no other caller remains).
- Count and savings figures are consistent with `OrphanedAzureResource` findings visible in the findings panel for the same run.
- No regression to the finding-level orphan detail pages.

**Affected files / projects:**

- `ArchLucid.Application/Findings/OrphanedAzureResourceFindingEngine.cs` (or `ExecutiveRoiSummaryService.cs`)
- `ArchLucid.Api/Controllers/Roi/RoiController.cs`
- `ArchLucid.Contracts/Roi/ExecutiveRoiSummaryResponse.cs` (or new contract)
- `archlucid-ui/src/app/(operator)/dashboard/_sections/ExecutiveOrphanCandidatesCard.tsx`
- `archlucid-ui/src/lib/run-potential-savings-parser.ts`
- `archlucid-ui/src/lib/run-savings-summary-model.ts`
- `archlucid-ui/src/components/RunSavingsSummary.tsx`

**Cross-ref:** **TB-062** (executive dashboard live KPI replacement — this item is a scoped sub-task).

**Size estimate:** **M** — ~1–2 days (backend query + contract + API surface + UI replacement + tests).

---

## TB-104 — 14-day expiring waiver KPI — server-compute the window; remove client-side date rule

**Source:** Cross-layer domain-term audit (2026-05-27). Cross-ref: code comment references TB-062 gap.

**Problem:**

`ExecutiveRoiDashboardLiveKpiCards.tsx` computes the "expiring waivers" dashboard tile client-side:

```typescript
// archlucid-ui/src/app/(operator)/dashboard/_sections/ExecutiveRoiDashboardLiveKpiCards.tsx
const countExpiringWaivers = (entries: RiskExceptionRecord[]) =>
  entries.filter(e => {
    const expiresMs = new Date(e.expiresAtUtc).getTime();
    return expiresMs > Date.now() && expiresMs <= Date.now() + 14 * 24 * 60 * 60 * 1000;
  }).length;
```

The 14-day window is a business rule that exists only in the browser. `ExecutiveReviewPacketBuilder.cs` has an `ExpiringWaiversCount14Days` field in the review packet model but populates it from `ActiveWaiversCount` (a known placeholder). Consequences:

- The rule can change on the server (e.g., moved to 30 days) without the dashboard tile updating.
- The dashboard tile is evaluated in the user's local time zone (`Date.now()`), not UTC.
- Server-generated PDF/export packets and the live dashboard tile can show different numbers for the same data.

**What to do:**

1. In `ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs` (or `RiskExceptionService`), compute `ExpiringWaiversCount14Days` correctly: count active waivers where `ExpiresAtUtc` is within the next 14 calendar days from UTC now.
2. Add `ExpiringWaiversCount14Days: int` to `ExecutiveRoiSummaryResponse` (it may already exist as a stub — verify and populate it).
3. Fix `ExecutiveReviewPacketBuilder.cs` to read the same field rather than `ActiveWaiversCount`.
4. Replace the `countExpiringWaivers` client-side filter in `ExecutiveRoiDashboardLiveKpiCards.tsx` with the API-provided field.
5. Add a unit test for the 14-day boundary calculation (including day-boundary edge case at UTC midnight).

**Acceptance criteria:**

- Dashboard tile and PDF export packet show the same count for the same data.
- The 14-day boundary is evaluated in UTC on the server in both paths.
- `countExpiringWaivers` function is deleted from the UI (or reduced to a trivial field accessor).
- Unit test covers: 0 expiring, 1 expiring on day 14, 1 expired yesterday (excluded), 1 expiring on day 15 (excluded).

**Affected files / projects:**

- `ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs`
- `ArchLucid.Application/Exports/ExecutiveReviewPacketBuilder.cs`
- `ArchLucid.Contracts/Roi/ExecutiveRoiSummaryResponse.cs`
- `ArchLucid.Api/Controllers/Roi/RoiController.cs`
- `archlucid-ui/src/app/(operator)/dashboard/_sections/ExecutiveRoiDashboardLiveKpiCards.tsx`

**Cross-ref:** **TB-062** (executive dashboard live KPI replacement); **TB-057** (governance stickiness review packet).

**Size estimate:** **S** — ~4–6 h (backend field population + UI simplification + tests).

---

## TB-105 — Business-impact category buckets — add pre-bucketed counts to `ExecutiveRoiSummaryResponse`; remove substring matcher

**Source:** Cross-layer domain-term audit (2026-05-27).

**Problem:**

`BusinessImpactSummaryWidget.tsx` derives its "security / reliability / compliance / cost / governance" issue counts by substring-matching the `category` field of `topSystemicIssues[]` items returned by `GET /v1/roi/executive-summary`:

```typescript
// archlucid-ui/src/components/BusinessImpactSummaryWidget.tsx
function sumIssueCounts(issues: SystemicIssue[], ...buckets: string[]) {
  return issues
    .filter(i => buckets.some(b => i.category.toLowerCase().includes(b)))
    .reduce((acc, i) => acc + i.count, 0);
}
// e.g. sumIssueCounts(issues, "security", "threat")
//      sumIssueCounts(issues, "reliability", "availability", "resilience")
```

Problems with this approach:

- The bucket definitions (which `category` substrings map to which pillar) live only in the UI. They cannot be unit-tested against real category values from the backend.
- A backend category rename (e.g., `"resiliency"` → `"resilience"`) silently zeroes the reliability bucket without a compilation error.
- The backend `ExecutiveRoiSummaryService` already has full category information when building the response; it can produce authoritative counts with zero ambiguity.

**What to do:**

1. In `ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs`, aggregate `topSystemicIssues` into named pillar buckets (`Security`, `Reliability`, `Compliance`, `Cost`, `Governance`, `Other`) using the same category taxonomy the backend uses for findings classification. Add a `BusinessImpactBuckets` property to `ExecutiveRoiSummaryResponse`.
2. Define the bucket-to-category mapping as a named constant or enum in `ArchLucid.Core` or `ArchLucid.Contracts` so it is reusable and testable.
3. Replace the `sumIssueCounts` calls in `BusinessImpactSummaryWidget.tsx` with the pre-bucketed counts from the API response.
4. Delete `sumIssueCounts` (or mark it internal-test-only) once no production callers remain.
5. Add unit tests for the bucket aggregation in `ArchLucid.Application.Tests` covering at least: a category that maps to exactly one bucket, a category that maps to `Other`, an empty issue list.

**Acceptance criteria:**

- `BusinessImpactSummaryWidget` reads bucket counts from `ExecutiveRoiSummaryResponse.BusinessImpactBuckets`; no substring matching occurs in production UI code.
- A backend category rename causes a compilation error or failing unit test, not a silent KPI zero.
- Bucket counts in the widget match what `ExecutiveRoiSummaryService` computed for the same response payload.

**Affected files / projects:**

- `ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs`
- `ArchLucid.Contracts/Roi/ExecutiveRoiSummaryResponse.cs` (new `BusinessImpactBuckets` shape)
- `ArchLucid.Core` or `ArchLucid.Contracts` (category → pillar mapping constant)
- `archlucid-ui/src/components/BusinessImpactSummaryWidget.tsx`
- `ArchLucid.Application.Tests/Roi/` (new unit tests)

**Cross-ref:** **TB-062** (executive dashboard live KPI replacement); **TB-103** (orphan savings — same root cause pattern).

**Size estimate:** **S** — ~4–8 h (backend aggregation + contract change + UI simplification + tests).

---

## TB-106 — RunDetailPageView — enrich authority `RunDetailDto` with cost estimate, trust evidence card, and `results[]`

**Source:** `RunDetailPageView` operator fidelity audit (2026-05-27). Canvas: `canvases/run-detail-operator-fidelity.canvas.tsx`.

**Problem:**

The operator run detail loader calls `GET /v1/authority/runs/{runId}` (`AuthorityQueryController.GetRunDetail`), which returns `RunDetailDto`. The UI components `RunEstimatedLlmCostCard`, `RunTrustEvidenceCardSection`, and `QuickDecisionSummary` (via `quick-decision-summary-derive.ts`) read `resolvedDetail.agentExecutionLlmCostEstimate`, `resolvedDetail.trustEvidenceCard`, and `resolvedDetail.results[]` respectively. Those three fields exist only on `RunDetailsResponse` returned by `GET /v1/architecture/run/{runId}` (`RunQueryController.GetRun`). On every live run using the authority path, all three are `null` or `undefined`. The TypeScript `RunDetail` type declares them as optional, masking the API gap. The only path where they appear is the static demo data injection in `operator-static-demo.ts`.

Consequence: on every live operator run review, the operator sees "Cost estimate unavailable", an empty trust evidence section, and no quick-decision confidence summary — three of the six critical operator signals identified in the fidelity audit.

**What to do (preferred — enrich authority endpoint):**

1. In `AuthorityQueryController.GetRunDetail`, after loading `RunDetailDto`, call `RunQueryController`'s underlying service (or a shared `IRunCostService` / `IRunTrustService`) to attach `agentExecutionLlmCostEstimate` and `trustEvidenceCard` to the authority response.
2. Add `AgentExecutionLlmCostEstimate? AgentExecutionLlmCostEstimate` and `TrustEvidenceCard? TrustEvidenceCard` to `RunDetailDto` (or its API response projection).
3. For `results[]`: assess whether the authority endpoint should include per-finding results (currently architecture-only). If yes, project from `FindingsSnapshot`; if no, document the explicit gap and update `quick-decision-summary-derive.ts` to fall back gracefully to `findingTraceConfidences` with a visible "using fallback" label instead of silently showing empty.
4. Update `api-types.generated.ts` (or the OpenAPI spec) to reflect the enriched authority response shape.
5. Remove the static demo data injection paths in `load-run-detail-page-model.ts` that paper over the gap.

**Alternative (parallel fetch):**

If enriching the authority endpoint is blocked by service ownership, add a parallel `GET /v1/architecture/run/{runId}` call in `loadRunDetailPageModel` and merge the `agentExecutionLlmCostEstimate` / `trustEvidenceCard` fields into the resolved model. This is lower risk to authority endpoint stability but adds a second HTTP call on every page load.

**Acceptance criteria:**

- On a live non-demo run, `RunEstimatedLlmCostCard` shows a USD value, model name, and token counts (not "unavailable").
- `RunTrustEvidenceCardSection` renders trust evidence when the run completed.
- `QuickDecisionSummary` shows per-finding confidence (or labels the fallback path explicitly).
- Static demo injection is no longer needed to see these sections.
- No existing authority-path tests regress.

**Affected files / projects:**

- `ArchLucid.Api/Controllers/Authority/AuthorityQueryController.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/Queries/RunDetailDto.cs`
- `ArchLucid.Application/` (cost / trust service interfaces — determine shared extraction point)
- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/load-run-detail-page-model.ts`
- `archlucid-ui/src/lib/api-types.generated.ts`
- `archlucid-ui/src/lib/api/architecture-runs.ts`
- `archlucid-ui/src/lib/quick-decision-summary-derive.ts`

**Cross-ref:** **TB-107**, **TB-108** (same root-cause audit cluster); **TB-011** (INV-002 trust card + operator UI badge — partially done).

**Size estimate:** **M** — ~1–2 days (authority endpoint enrichment + TS type update + loader simplification; parallel-fetch alternative is ~S).

---

## TB-107 — RunDetailPageView — surface `lastFailureReason` + `hasGovernanceWarnings` from `RunRecord`

**Source:** `RunDetailPageView` operator fidelity audit (2026-05-27). Canvas: `canvases/run-detail-operator-fidelity.canvas.tsx`.

**Problem:**

`RunRecord` carries two fields that are loaded by `GetRunDetailAsync` and included in `RunDetailDto.Run` but are never accessed in any render path:

- `LastFailureReason (string?)` — free-text reason written when a run fails or falls back.
- `HasGovernanceWarnings (bool)` — flag set when at least one governance warning is present on the run.

An operator reviewing and committing a run sees neither. `HasGovernanceWarnings = true` means the operator is approving a run with known governance issues without any indication on the page. `LastFailureReason` being hidden means a run that retried (see also `RetryCount` in **TB-108** notes) gives no explanation for why earlier attempts failed.

**What to do:**

1. In `RunDetailRunMetadataSection.tsx`, add a row for `run.lastFailureReason` when non-null, labelled "Last failure reason".
2. Add a `HasGovernanceWarnings` indicator in `RunDetailManifestSummaryAlerts.tsx` or `RunDetailPageHeader` — either a warning pill on the header or a `Callout` that fires when `run.hasGovernanceWarnings === true`. The wording should be "This run has governance warnings — review all findings before committing."
3. Optionally surface `run.retryCount` (> 0) as a secondary metadata row indicating the run was unstable.
4. Verify these fields are present on the TypeScript `RunRecord` type in `authority.ts`; add them if missing.

**Acceptance criteria:**

- A run with `HasGovernanceWarnings = true` shows a visible warning on `RunDetailPageView` before the operator can commit.
- A run with a non-null `LastFailureReason` shows the reason in the metadata section.
- `RunDetailRunMetadataSection` unit test (if exists) covers the new rows.

**Affected files / projects:**

- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailRunMetadataSection.tsx`
- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailManifestSummaryAlerts.tsx`
- `archlucid-ui/src/types/authority.ts` (verify `RunRecord` type has `lastFailureReason`, `hasGovernanceWarnings`, `retryCount`)
- `ArchLucid.Core/Persistence/ApplicationPorts/Models/RunRecord.cs` (read-only — verify field names)

**Cross-ref:** **TB-106** (same audit cluster — split API contract); **TB-108** (`hasCommitBlockingFailures` — complementary operator signal).

**Size estimate:** **S** — ~3–5 h (UI changes + type verification).

---

## TB-108 — RunDetailPageView — render `findingCoverageSummary.dispositionCoverage` + `hasCommitBlockingFailures`

**Source:** `RunDetailPageView` operator fidelity audit (2026-05-27). Canvas: `canvases/run-detail-operator-fidelity.canvas.tsx`.

**Problem:**

`DapperAuthorityQueryService.GetRunDetailAsync` computes `RunFindingCoverageSummary` and attaches it to `RunDetailDto`. The structure includes:

- `HasCommitBlockingFailures (bool)` — true when at least one finding engine failure prevents a reliable commit.
- `DispositionCoverage (RunFindingDispositionCoverage)` — breakdown of how many findings have been dispositioned (accepted, remediated, deferred, rejected, needs-evidence, open).
- `FailedEngineLabels (string[])` — the only field currently rendered (as a degraded banner).

`HasCommitBlockingFailures` is particularly dangerous to hide: the operator can press `CommitRunButton` without knowing the run has commit-blocking failures. `DispositionCoverage` is the operator's primary tool for understanding whether all findings have been reviewed before committing.

**What to do:**

1. In `RunDetailManifestSummaryAlerts.tsx` (or `RunDetailRunActionsSection.tsx`), add a `Callout` with `tone="danger"` when `findingCoverageSummary.hasCommitBlockingFailures === true`. The message should read "One or more finding engines failed in a way that blocks commit. Resolve the coverage gaps before finalizing."
2. Disable or visually warn `CommitRunButton` when `hasCommitBlockingFailures === true` (coordinate with `RunDetailPageHeader.tsx`).
3. In `RunDetailManifestSummarySection.tsx` or a new `RunDetailFindingDispositionSection`, render a disposition coverage summary: counts for open, accepted, remediated, deferred, needs-evidence findings from `dispositionCoverage`. This gives the operator a one-glance view of review completeness.
4. Verify the TypeScript `RunDetail` type in `authority.ts` exposes the full `findingCoverageSummary` shape beyond `failedEngineLabels`.

**Acceptance criteria:**

- A run with `HasCommitBlockingFailures = true` shows a blocking callout and a disabled or warned `CommitRunButton`.
- Disposition coverage counts are visible on the run detail page before commit.
- The existing degraded-engine banner for `failedEngineLabels` continues to render (no regression).

**Affected files / projects:**

- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailManifestSummaryAlerts.tsx`
- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailRunActionsSection.tsx`
- `archlucid-ui/src/components/RunDetailPageHeader.tsx` (`CommitRunButton` guard)
- `archlucid-ui/src/types/authority.ts` (full `findingCoverageSummary` shape)
- `ArchLucid.Contracts/Findings/RunFindingCoverageSummary.cs` (read-only — verify field names)

**Cross-ref:** **TB-106**, **TB-107** (same audit cluster); **TB-113** (OpenAPI drift may hide these fields in generated types).

**Size estimate:** **S** — ~4–6 h (callout + commit guard + disposition summary panel + type verification).

---

## TB-109 — RunDetailPageView — add retrieval-hit / RAG grounding panel

**Source:** `RunDetailPageView` operator fidelity audit (2026-05-27). Canvas: `canvases/run-detail-operator-fidelity.canvas.tsx`.

**Problem:**

There is no UI surface anywhere on the run detail page (or any sub-route) that shows what documents were retrieved during RAG execution, their similarity scores, or whether any retrieval step was skipped or degraded. The retrieval infrastructure exists (`ArchLucid.Retrieval`, `IRetrievalQueryService`) and finding trust labels reference weak retrieval, but the operator has no way to judge whether the model had good grounding without examining raw trace blobs. This gap is most consequential when `RunExplanationSummary.faithfulnessWarning = true` — the operator sees a faithfulness warning but cannot inspect the underlying retrieval to understand it.

**What to do:**

1. Define an API endpoint `GET /v1/authority/runs/{runId}/retrieval-hits` (or extend the existing `GET /v1/architecture/runs/{runId}/traces`) that returns, per agent task: retrieved document IDs / titles, similarity scores, whether the hit was used or filtered below threshold, and the retrieval model/index version used.
2. Create `RunDetailRetrievalGroundingSection.tsx` under `_sections/` that renders:
   - A per-task collapsed list of retrieval hits (document title, score, used/filtered status).
   - A summary line: "N documents retrieved, M used" per task.
   - A warning pill when any task had zero usable hits.
3. Register the section in `RunDetailPageView.tsx` between `RunDetailRunExplanationCollapsible` and `RunDetailRunMetadataSection`, collapsed by default.
4. Link the section from the `faithfulnessWarning` banner in `RunExplanationSection` ("View retrieval hits →").

**Acceptance criteria:**

- When `faithfulnessWarning = true`, the operator can click through to see which chunks were (and were not) retrieved.
- The section renders collapsed by default; operators who do not need it are not distracted.
- Empty state (retrieval not applicable, e.g., non-RAG run) is not rendered (section omitted entirely).

**Affected files / projects:**

- `ArchLucid.Api/Controllers/Authority/AuthorityQueryController.cs` (new endpoint or extended traces endpoint)
- `ArchLucid.Application/` (retrieval hit query — interface in `IRetrievalQueryService` or new port)
- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailRetrievalGroundingSection.tsx` (new)
- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailPageView.tsx`
- `archlucid-ui/src/components/RunExplanationSection.tsx` (link from faithfulness warning)
- `archlucid-ui/src/lib/api/architecture-runs.ts` (new API client function)

**Cross-ref:** **TB-045**–**TB-049** (retrieval correctness/drift audit); **RAG-V1-007**–**RAG-V1-011** (`RAG_QUALITY_TECHNICAL_BACKLOG.md`); **TB-033** (persist LLM sampling params — complementary forensic completeness).

**Size estimate:** **M** — ~1.5–2 days (API endpoint + retrieval query projection + UI section).

---

## TB-110 — RunDetailPageView — add tool-call / function-invocation log panel

**Source:** `RunDetailPageView` operator fidelity audit (2026-05-27). Canvas: `canvases/run-detail-operator-fidelity.canvas.tsx`.

**Problem:**

`RunDetailPageView` has no section showing which external tools or functions were invoked during a run, with what arguments, or what they returned. `RunAgentForensicsSection` shows agent trace rows (agent type, parse result, blob upload status, heuristic/LLM rubric scores) but this is not a tool-call list. Full prompt/response content may be in blob storage, but `blobUploadFailed` is only surfaced as a warning — the content is never rendered. An operator cannot verify whether an external API call produced correct input or whether a tool invocation was retried.

The OTEL trace ID (`run.otelTraceId`) is already stored on `RunRecord` and shown in the metadata section as a link, but operators are expected to navigate to an external trace viewer rather than see structured tool calls inline.

**What to do:**

1. Extend `GET /v1/architecture/run/{runId}/traces` (or create `GET /v1/authority/runs/{runId}/tool-calls`) to return a structured tool-call log per agent task: tool name, invocation arguments (redacted / truncated as needed), response summary, duration, success/failure.
2. In `RunAgentForensicsSection.tsx` (or a new `RunDetailToolCallsSection.tsx`), add a collapsed sub-section per agent task listing its tool invocations as a table: tool, args preview, outcome, duration.
3. Surface the `blobUploadFailed` warning as a named issue in the same section ("Full trace unavailable — blob upload failed") so the operator understands completeness limits.
4. If full prompt/response blob is available, add a "View raw" expansion per invocation (guarded behind operator role check if applicable).

**Acceptance criteria:**

- An operator reviewing a run can see which tools were invoked, in what order, with what argument summary, and whether each succeeded.
- `blobUploadFailed` is surfaced as a named completeness warning, not a silent badge.
- The section is collapsed by default and omitted entirely if the run has no tool invocations.

**Affected files / projects:**

- `ArchLucid.Api/Controllers/` (traces endpoint extension or new tool-calls endpoint)
- `ArchLucid.Application/Agents/` (agent execution trace projection — add tool-call sub-records)
- `archlucid-ui/src/components/RunAgentForensicsSection.tsx`
- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailPageView.tsx`
- `archlucid-ui/src/lib/api/architecture-runs.ts`

**Cross-ref:** **TB-033** (persist LLM sampling params + reasoning token count — forensic completeness); **TB-082** (`AllowedTools` runtime enforcement — security); **TB-035** (remediation attempt forensics).

**Size estimate:** **M** — ~1.5–2 days (trace endpoint extension + UI section + blob-failure surfacing).

---

## TB-111 — RunDetailPageView — inline provenance summary card (collapse from sibling route)

**Source:** `RunDetailPageView` operator fidelity audit (2026-05-27). Canvas: `canvases/run-detail-operator-fidelity.canvas.tsx`.

**Problem:**

Provenance (which context snapshot was used, what inputs were fed to the architecture request, and what the coordinator graph source was) is accessible only by navigating to `reviews/[runId]/provenance` — a full-page sibling route that uses `GET /v1/architecture/runs/{runId}/provenance`. This route is linked from `RunDetailOutcomeCards` but only as an external link. An operator reviewing the run must navigate away, losing their scroll position and the run-detail context they were building.

Additionally, the sibling provenance page uses the **architecture** provenance endpoint, while the authority API also has a `GET /v1/authority/runs/{runId}/provenance` endpoint that is never called by any UI page.

**What to do:**

1. Add a collapsed `RunDetailProvenanceSummaryCard` section to `RunDetailPageView.tsx`, placed after `RunDetailAuthorityChainSection` (which already shows snapshot IDs).
2. The card should show a compact summary sourced from the authority provenance endpoint: context snapshot ID + description, architecture request ID, graph snapshot ID, and "View full provenance →" link to the sibling route.
3. Call `GET /v1/authority/runs/{runId}/provenance` (if it returns useful summary data) or derive the same information from fields already on `RunDetailDto` (`run.contextSnapshotId`, `run.graphSnapshotId`, `run.architectureRequestId`) without a second fetch.
4. If the authority provenance endpoint returns a richer payload than the DTO fields, use it; otherwise use the DTO fields and skip the second call.
5. Remove the "View provenance" link from `RunDetailOutcomeCards` (or keep it as a supplement) once the inline card provides the summary.

**Acceptance criteria:**

- Operator can see provenance context (snapshot IDs, source description, architecture request) on the run detail page without navigating away.
- "View full provenance" link remains available for deeper inspection.
- No additional HTTP calls are made if the DTO already has sufficient fields.

**Affected files / projects:**

- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailPageView.tsx`
- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailAuthorityChainSection.tsx` (may absorb the summary)
- `archlucid-ui/src/components/RunDetailOutcomeCards.tsx`
- `archlucid-ui/src/lib/api/architecture-runs.ts` (authority provenance call, if needed)

**Cross-ref:** **TB-033**–**TB-038** (provenance completeness audit — backend side); **TB-036** (provenance ↔ agent trace correlation).

**Size estimate:** **S** — ~3–5 h (inline card + authority provenance call if needed + link update).

---

## TB-112 — RunDetailPageView — add run-level approve / reject / request-remediation actions

**Source:** `RunDetailPageView` operator fidelity audit (2026-05-27). Canvas: `canvases/run-detail-operator-fidelity.canvas.tsx`.

**Problem:**

The only run-level action on `RunDetailPageView` is `CommitRunButton` (finalize the golden manifest). Governance actions — accept, reject, waive, defer, request remediation — all live on individual `reviews/[runId]/findings/[findingId]` sub-routes and are backed by `GovernanceStickinessController`. There is no run-level approve or reject.

`findingCoverageSummary.dispositionCoverage` (see **TB-108**) provides a run-level view of how many findings are open vs dispositioned, but there is no corresponding action. An operator who has reviewed all findings and wants to formally approve or reject the run as a whole has no mechanism to do so from the run detail page.

**What to do:**

1. Define a run-level governance disposition API: `POST /v1/authority/runs/{runId}/disposition` accepting `{ decision: "Approved" | "Rejected" | "RequestRemediation", rationale?: string }`. The backend should record the decision against the run record (or `DecisionTrace`) and update `RunRecord.LegacyRunStatus` or a new `GovernanceDecision` field accordingly.
2. In `RunDetailRunActionsSection.tsx`, add three action buttons (or a decision panel): Approve, Reject, Request Remediation. Guard all three on `findingCoverageSummary.hasCommitBlockingFailures === false` for Approve; Reject and Request Remediation are always available.
3. Show a confirmation dialog with rationale input before each action.
4. Reflect the decision on the run detail page header (governance pill / badge update).
5. Scope the actions to the `operator` role — buyer users should not see them.

**Note:** This is explicitly V1 scope — check [`V1_SCOPE.md`](V1_SCOPE.md) §2 before implementation to confirm run-level governance disposition is within the current release window. If it is release-windowed to V1.1, downgrade to V1.1 and note it here.

**Acceptance criteria:**

- Operator can approve, reject, or request remediation of a run from the run detail page.
- Approved/rejected status is visible on subsequent page loads.
- Approve action is blocked when `hasCommitBlockingFailures = true`.
- Buyer users do not see the action buttons.

**Affected files / projects:**

- `ArchLucid.Api/Controllers/Authority/AuthorityQueryController.cs` (new disposition endpoint)
- `ArchLucid.Application/` (run disposition command + handler)
- `ArchLucid.Core/Persistence/ApplicationPorts/` (run disposition port)
- `ArchLucid.Persistence/` (run disposition persistence)
- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailRunActionsSection.tsx`
- `archlucid-ui/src/components/RunDetailPageHeader.tsx` (governance status reflection)

**Cross-ref:** **TB-057**–**TB-063** (commercial stickiness / governance review workflow); **TB-108** (`hasCommitBlockingFailures` gate for Approve action).

**Size estimate:** **M** — ~1.5–2 days (API + command/handler + UI action panel + dialog).

---

## TB-113 — Fix OpenAPI schema drift on `RunDetailDto` — expose `degradedFindingCoverage` + `findingCoverageSummary` in generated TypeScript types

**Source:** `RunDetailPageView` operator fidelity audit (2026-05-27). Canvas: `canvases/run-detail-operator-fidelity.canvas.tsx`.

**Problem:**

`ArchLucid.Core/Persistence/ApplicationPorts/Queries/RunDetailDto.cs` defines `DegradedFindingCoverage` and `FindingCoverageSummary` (type `RunFindingCoverageSummary`). The generated TypeScript `api-types.generated.ts` may omit or under-type these fields if the OpenAPI spec was generated before they were added or if the Swashbuckle configuration excludes them. As a result, UI code accessing `resolvedDetail.findingCoverageSummary.hasCommitBlockingFailures` requires a type assertion or `any` cast, which bypasses compile-time correctness and makes it impossible to confidently add the operator-visible panels from **TB-108**.

**What to do:**

1. Regenerate `api-types.generated.ts` from the current OpenAPI spec (or run the existing generation script in `scripts/`).
2. Verify the generated output includes `RunFindingCoverageSummary` with all fields from `RunFindingCoverageSummary.cs`: `EnginesAttempted`, `EnginesSucceeded`, `EnginesFailed`, `FailedEngineLabels`, `HasCommitBlockingFailures`, `DispositionCoverage` (with its sub-fields).
3. If any field is missing from the OpenAPI spec, check `AuthorityQueryController` for `[JsonIgnore]` or missing `[ProducesResponseType]` annotations and fix.
4. Update any UI code that currently uses `any` casts or optional chaining workarounds on `findingCoverageSummary` to use the typed fields directly.
5. Add the regeneration step to the CI pipeline (or verify it is already there) so spec drift is caught automatically.

**Acceptance criteria:**

- `api-types.generated.ts` has a typed `RunFindingCoverageSummary` interface with `hasCommitBlockingFailures: boolean` and `dispositionCoverage`.
- No `any` cast is needed to access coverage fields in `RunDetailPageView` and related sections.
- CI fails if the generated types fall behind the API contract.

**Affected files / projects:**

- `archlucid-ui/src/lib/api-types.generated.ts`
- `ArchLucid.Api/Controllers/Authority/AuthorityQueryController.cs` (OpenAPI annotations if needed)
- `ArchLucid.Contracts/Findings/RunFindingCoverageSummary.cs` (read — verify public surface)
- `scripts/` (OpenAPI generation script — verify CI integration)

**Cross-ref:** **TB-108** (rendered coverage fields depend on correct types); **TB-106** (same schema drift risk for `agentExecutionLlmCostEstimate` / `trustEvidenceCard`).

**Size estimate:** **XS** — ~1–2 h (regeneration + annotation fix + cast cleanup).

---
