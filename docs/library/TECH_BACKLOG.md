> **Scope:** Engineering-owned technical backlog items deferred from current sessions; audience is contributors and the AI assistant; not a buyer or operator document. Not a substitute for ADRs or the pending-questions owner decisions file.

# Tech backlog

Items here are **greenlit in principle** — the decision has been made and context is captured — but deferred for a future session rather than the current one. Pick any item up by searching the codebase for the files listed and applying the recorded approach.

**Priority order:** Items are listed highest → lowest priority. When picking up work, start at the top. Re-sort when new items are added: items that affect customer-visible correctness rank above ops/observability improvements, which rank above developer-experience polish.

**TB-114 – TB-120** were added 2026-05-30 from the owner-ratified UI design standard (decision date 2026-05-27). They close the gap between the current Tailwind/shadcn default aesthetics and the **IBM Carbon–inspired enterprise visual language** mandated for V1 GA. Canonical standard: [`docs/library/UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md). **TB-114** (design tokens) and **TB-115** (surface/card pass) are foundational and should be done first; **TB-116** (status tags) and **TB-117** (data tables) unlock governance credibility; **TB-118** (spacing) and **TB-119** (typography) are polish; **TB-120** (agent rule) ensures future AI-written code stays conformant.

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

**TB-170 – TB-176** (formerly duplicated IDs TB-114–120 in this file) were added 2026-05-29 from a Template and Accelerator Richness review. The conclusion was **not** to add template volume for its own sake. The V1 opportunity is to make existing starter proof packs easier to choose, validate, trust, and dry-run. **TB-170** is the highest leverage because it maps buyer jobs to existing accelerators; **TB-171** prevents stale/unsafe pack metadata; **TB-172** and **TB-173** add deterministic validation and proof dry-run coverage; **TB-174** creates one golden walkthrough that sales/operators can use without multiplying templates.

**TB-119 – TB-134** were added 2026-05-29 from a Policy/Governance, Auditability, and Commercial Packaging review. The theme is proof discipline: make governance packs, audit trails, and sales-led packaging harder to misread, drift, or overclaim. **TB-119 – TB-123** cover policy/governance alignment; **TB-124 – TB-128** cover auditability; **TB-129 – TB-134** cover commercial packaging readiness. Owner-gated items such as live commerce and named customer references remain deferred outside this cluster.

**TB-135 – TB-142** were added 2026-05-29 per owner decision. **TB-135 – TB-136** (SOC 2 CPA and third-party pen test) remain V1.1 assurance backlog organizational / vendor programs per workspace rule. **TB-137 – TB-140** capture follow-on real-LLM engineering after assessment improvement **#1** local evidence shipped. **TB-141 – TB-142** were later promoted on 2026-06-01 to near-term GTM backlog priorities for real pilot proof packets and market-facing demo assets. See **`.cursor/rules/V1_1-assurance-backlog.mdc`**, `.cursor/rules/Assessment-Scope-V1_1.mdc`, and [`V1_DEFERRED.md`](V1_DEFERRED.md) §6c.

**TB-143 – TB-148** were added 2026-05-30 from owner-ratified product documentation presentation guidance (decision date 2026-05-27). Customer-facing help must not dump buyers or operators into raw GitHub repository browsing. **TB-143** (in-app markdown renderer + `/help/{topic}` routes) and **TB-144** (documentation registry) are foundational; **TB-145** migrates existing GitHub blob links; **TB-146** bans redirect stubs; **TB-147** adds CI drift guard; **TB-148** adds role-gated optional source links. Canonical standard: [`PRODUCT_DOCUMENTATION_PRESENTATION.md`](PRODUCT_DOCUMENTATION_PRESENTATION.md).

**TB-149 – TB-155** were added 2026-05-31 from a cross-layer **data consistency** audit (executive KPIs, governance decisions-needed summary, waiver/disposition state, recurrence trigger idempotency). They extend **TB-103–105** and partially close **TB-104** (canonical 14-day waiver window). **TB-149** unifies two non-equivalent server implementations of the expiring-waiver window. **TB-150** fixes `TotalDecisionItems` double-counting overlapping finding categories. **TB-151** and **TB-152** correct inverted or aliased fields on `ExecutiveSummaryResult`. **TB-153** prevents duplicate recurring review runs on ACA restart. **TB-154** enforces waiver ↔ disposition invariants. **TB-155** stops cached ROI waiver counts from diverging from live decisions-needed. Cross-ref **TB-062**, **TB-012** (**INV-009**), **TB-089** (digest retry — different surface).

**TB-156 – TB-157** were added 2026-05-31 from local-dev triage: operators running `start-local-api-and-ui.ps1` (or UI-only) saw repeated Sonner warnings **“Review assistant unavailable / AI assistant service is not reachable”** while the root cause was **ArchLucid.Api not running** or **UI proxy → API misconfiguration** (502), not Azure OpenAI / Ask. **Both are P0 — pick up in the next available engineering thread** before other backlog polish. **TB-156** fail-closes the startup script on a full browser → UI → `/api/proxy` → API chain. **TB-157** reframes connectivity toasts so proxy/API outages say **API unreachable**, reserving assistant wording for Ask/SSE-only failures. Cross-ref [`docs/runbooks/TROUBLESHOOTING.md`](../runbooks/TROUBLESHOOTING.md), [`docs/library/customer-facing/OPERATOR_QUICKSTART.md`](customer-facing/OPERATOR_QUICKSTART.md), `scripts/env-readiness.ps1`, `scripts/demo-start-local.ps1`.

**TB-158 – TB-167** were added 2026-06-01 from `docs/assessments/LATEST_GPT55.md` human-input score-limiter triage and rescore. They avoid duplicating existing engineering tasks by extending **TB-131 – TB-134**, promoting existing **TB-141 – TB-142** to near-term GTM priority, and adding only missing owner-reviewable GTM/procurement/support/release-claim/sponsor-evidence work. Formal SOC 2 CPA and third-party pen-test programs remain parked in **TB-135 – TB-136** per the V1.1 assurance backlog rule; do not reclassify them from normal assessment passes.

**TB-168** was added 2026-06-01 from the GPT-5.5 assessment correctness follow-up. It does not duplicate **TB-103 – TB-105** or **TB-149 – TB-155**; those fix known KPI/waiver/recurrence defects. **TB-168** adds a regression guard so future changes cannot silently reintroduce UI KPI heuristics, stale cache fallbacks, or duplicate business semantics.

**TB-169** was added 2026-06-01 from the GPT-5.5 adoption-friction follow-up. It does not duplicate **TB-156 – TB-157** (API/proxy diagnostics) or **TB-143 – TB-148** (in-app docs). It targets first-run branching and progressive disclosure: Pilot-first onboarding should keep Operate surfaces out of the primary path until a committed review exists.

**TB-170** was added 2026-06-01 from the **Docs: markdown link integrity** CI advisory output. It does not duplicate **TB-147** (GitHub blob URLs in product UI) or **TB-143 – TB-148** (in-app customer docs). It targets broken relative markdown link targets left after `docs/library/` consolidation and navigational moves; **Done (2026-06-01 batch 5F)** — `check_doc_links.py` exits 0 and CI is merge-blocking.

**TB-177 – TB-190** were added 2026-06-01 from an independent first-principles AI/Agent Readiness quality assessment (`docs/assessments/AI_AGENT_READINESS_06012026.MD`). They target the agent pipeline gaps identified in that assessment in priority order: adversarial Critic posture (**TB-177**, P0), streaming Ask (**TB-178**, P0), multi-model tiered orchestration (**TB-179**, P1), calibrated confidence (**TB-180**, P1), nightly eval harness cron (**TB-181**, P1), automated AI readiness posture script (**TB-182**, P1), findings re-ranker (**TB-183**, P2), governance-block explainer (**TB-184**, P2), per-finding conversational explainer (**TB-185**, P2), run summary one-pager (**TB-186**, P2), AI-assisted request authoring (**TB-187**, P2), IaC stub generator (**TB-188**, P3), policy-pack drafting assistant (**TB-189**, P3), and LLM-as-judge coverage extension (**TB-190**, P2 pending owner budget approval). These do not duplicate items already tracked: **TB-011/TB-012** (invariant wave B/C), **TB-034–038** (provenance forensics), **TB-137/TB-139/TB-140** (real-mode eval — owner-credentialed), or any AI Leverage Roadmap items previously promoted to backlog. The real-mode CI gate flip is **not added here** — it requires owner action (see **PQ-AI-01** in the assessment).

**TB-191 – TB-195** were added 2026-06-02 from an independent first-principles **Cutting-Edge AI Technology** quality assessment (`docs/assessments/CuttingEdgeAITechnology_06022026.MD`). They extend the TB-177–190 cluster without duplicating it: prompt template content-hash forensics (**TB-191**, P2), dynamic evidence summarization before context overflow (**TB-192**, P1 — counts against tenant run-execution quota per PQ-CEAT-02 resolved 2026-06-02), LLM provider abstraction factory scaffold (**TB-193**, P2 — scaffold only, no non-Azure providers per PQ-CEAT-01 resolved 2026-06-02), RAG corpus operator monitoring panel (**TB-194**, P2), and multi-turn Ask context compression (**TB-195**, P2). All three PQ-CEAT pending questions were resolved by judgment on 2026-06-02. These items are distinct from **TB-178** (streaming Ask), **TB-180** (calibrated confidence), and **TB-181** (nightly cron) which remain the highest-priority AI readiness work.

**TB-196 – TB-206** were added 2026-06-02 from an independent first-principles **Correctness** quality assessment (`docs/assessments/Correctness_06022026.MD`). They target correctness defects identified in priority order: reasoning token cost underreporting bug (**TB-196**, P0 — silent monetary error in all runs with reasoning models), governance PromoteAsync non-atomic state transition (**TB-197**, P1 — irrecoverable data inconsistency), `CostConstraintFindingEngine` zero coverage (**TB-198**, P1), `TenantOrProjectCapabilityAuthorizationHandler` zero coverage (**TB-199**, P1 — security-critical), `HttpScopeContextProvider` zero coverage (**TB-200**, P1 — security boundary), DB-level `UNIQUE (RunId, TaskId)` constraint on `AgentResults` (**TB-201**, P1 — multi-replica race), notification unit tests (**TB-202**, P2), `ConversationService` unit tests (**TB-203**, P2), decision rule action differentiation in audit trace (**TB-204**, P2), `BuildHistoryAsync` infinite loop guard (**TB-205**, P2), and `ResolveEnvironmentLabel` null guard (**TB-206**, P3). These do not duplicate **TB-087** (findings backfill unique index), **TB-149–155** (waiver/KPI correctness), **TB-103–105** (orphan/waiver/bucket correctness), **TB-033** (reasoning token persist — TB-196 fixes the aggregator that was never updated to use that column), or **TB-039–044** (idempotency — TB-201 targets the `AgentResults` submit path specifically). Owner input needed for TB-011 Wave B (`Mixed` UX copy — PQ-COR-01) and confirmation on `AgentResults` uniqueness constraint (PQ-COR-02).

**TB-085 – TB-090** were added 2026-05-27 from a Backfill.Cli and Jobs.Cli operational review (idempotency on rerun, bounded memory, checkpointing, poison-message handling, observability). **TB-089** is operator-visible (duplicate digest emails on ACA retry); **TB-087** closes a concurrent-rerun duplicate-`FindingRecords` window; **TB-088** prevents whole-job failure on one bad tenant/schedule; **TB-085** + **TB-086** harden large-catalog backfill runs; **TB-090** enables CI/pipeline assertions. Neither CLI writes cost rows; provenance child inserts are count-guarded (**TB-087** adds DB-level defense). Cross-ref **TB-012** (**INV-009** idempotency), **TB-067** (migration/backfill docs), **TB-061** (digest recurrence), [`SqlRelationalBackfill.md`](SqlRelationalBackfill.md), [`CONTAINER_APPS_JOBS.md`](../runbooks/CONTAINER_APPS_JOBS.md).

| ID | Title | Priority driver | Size |
|----|-------|----------------|------|
|| TB-196 | Reasoning token cost underreporting fix — update `AgentExecutionTraceRunLlmCostAggregator.Compute()` to pass `trace.ReasoningTokenCount ?? 0` (not literal `0`) to `costEstimator.EstimateUsd`; add test covering reasoning-token cost path | **Done (2026-06-02 batch 5J)** — aggregator forwards reasoning tokens; unit tests in `AgentExecutionTraceRunLlmCostAggregatorTests` | XS |
| TB-197 | `GovernanceWorkflowService.PromoteAsync` — wrap `approvalRepo.UpdateAsync` + `promotionRepo.CreateAsync` in single `IArchLucidUnitOfWork`; add atomicity test | **Done (2026-06-02 batch 5J)** — single UoW commit/rollback; `IGovernanceApprovalRequestRepository.UpdateAsync` accepts external connection/transaction | S |
| TB-198 | `CostConstraintFindingEngine` unit tests — add 7 scenarios covering severity, budget parsing, null properties, empty graph, multi-node | **Done (2026-06-02 batch 5K)** — `CostConstraintFindingEngineTests` (7 scenarios) | S |
| TB-199 | `TenantOrProjectCapabilityAuthorizationHandler` unit tests — 6 authorization scenarios (succeed/fail/no-identity/tenant-miss/project-scope) | **Done (2026-06-02 batch 5K)** — `TenantOrProjectCapabilityAuthorizationHandlerTests` | M |
| TB-200 | `HttpScopeContextProvider` unit tests — 5 scenarios (valid claims, missing tenant, missing workspace, unauthenticated, malformed GUIDs) | **Done (2026-06-02 batch 5K)** — `HttpScopeContextProviderTests` in Host.Core.Tests + Api.Tests | S |
| TB-201 | DB-level `UNIQUE (RunId, TaskId)` constraint on `dbo.AgentResults` + exception handling in `SubmitAgentResultAsync` for constraint violation → 409 | Correctness P1 — in-memory duplicate guard is bypassed in multi-replica deployments; needs owner confirmation whether constraint already exists (PQ-COR-02) | S |
| TB-202 | `ArchLucid.Notifications` unit tests — `SlackInteractivityVerifier` HMAC, `ChatOpsWebhookDeliveryService` HTTP delivery (success/4xx/5xx), `AuthorityRunCommittedChatOpsHook` event handler | Correctness P2 — 2.90% assembly coverage; ChatOps delivery paths entirely unguarded | M |
| TB-203 | `ConversationService` unit tests — new conversation, append message, empty message, max-turn limit, session not found | Correctness P2 — 0% coverage on 54-line Ask conversation service | M |
| TB-204 | Decision rule action differentiation in `RuleAuditTracePayload` — add `RequiredFindingIds` / `AllowedFindingIds` / `PreferredFindingIds` sets alongside existing `AcceptedFindingIds` union; update mapper + DTO | Correctness P2 — `require`, `allow`, `prefer` currently indistinguishable in audit trace; reduces operator explainability | S |
| TB-205 | `BuildHistoryAsync` / `BuildExportAsync` / `CollectCommittedRunsForTrendsAsync` pagination safety — add `maxPages = 500` guard + warning log to all three `while(true)` pagination loops in `ExecutiveRoiSummaryService` | **Done (2026-06-02 batch 5J)** — `maxPages = 2_000` + warning log on all three pagination loops | XS |
| TB-206 | `ResolveEnvironmentLabel` null guard — null-coalesce `service.Tags ?? []`; add unit tests for null tags, empty tags, valid env tag | **Done (2026-06-02 batch 5J)** — null-safe tag iteration in `ResolveEnvironmentLabel` | XS |

| TB-178 | Streaming Ask SSE — `POST /v1/ask/stream` + `AskStreamAsync` + `useAskStream()` UI hook | AI/Agent Readiness P0 — eliminates blank-screen latency on every Ask query; reuses existing LLM client | M |
| TB-179 | Multi-model tiered orchestration — `ModelTier` enum (`Fast`=gpt-4o-mini, `Reasoning`=GPT-4o) + `AgentTaskFactory` tier assignment + config keys `Llm:Deployments:Fast` / `Llm:Deployments:Reasoning`; Topology initial draft + Cost extraction → Fast; Compliance + Critic → Reasoning | AI/Agent Readiness P1 — targets 30–50% run cost reduction; model selection resolved 2026-06-01 (PQ-AI-04) | M |
| TB-180 | Calibrated agent confidence — `IAgentConfidenceCalibrator` piecewise-linear calibration + `CalibratedConfidence` column on `dbo.AgentResults` | AI/Agent Readiness P1 — quality gate confidence thresholds are currently ungrounded; fail-open when < 20 data points | M |
| TB-181 | Template eval harness nightly cron — add `cron: '0 3 * * *'` trigger + JSON summary output to `template-eval-harness.yml`; V1: notification-only on failure (PQ-CEAT-03 resolved 2026-06-02); V1.1: promote to floor-ratchet blocking gate (`assert_coverage_floor_ratchet.py` pattern) once baseline is stable for two consecutive weeks | AI/Agent Readiness P1 — regression window is currently days; nightly sentinel closes the detection gap | XS |
| TB-182 | `Write-AiReadinessPosture.ps1` — automate production of `ai-readiness-posture.json` from evidence artifacts | AI/Agent Readiness P1 — every pilot delivery currently requires manual JSON fill; schema stable | Done (2026-06-01) |
| TB-183 | Findings priority re-ranker — `IFindingPriorityReranker` + `PriorityRank` column + `?orderBy=priority` param, feature-flagged | AI/Agent Readiness P2 — operators receive undifferentiated High findings list; business-impact ordering per `IndustryVertical` | M |
| TB-184 | Governance-block explainer — AI explanation on 409 `GovernanceBlockResult` via `IAgentCompletionClient`, feature-flagged | AI/Agent Readiness P2 — governance blocks are currently opaque rule IDs with no minimum-edit guidance | S |
| TB-185 | Per-finding conversational explainer — `AskAboutFindingAsync` + `POST /v1/architecture/finding/{findingId}/ask` + inline UI chat icon | AI/Agent Readiness P2 — operators cannot ask "why?" inline without copying finding context manually | M |
| TB-186 | Run summary one-pager auto-generator — `RunSummaryOnePager` export variant + `GET /v1/architecture/run/{runId}/export/summary`, feature-flagged | AI/Agent Readiness P2 — no CFO-ready artifact in one click; every sponsor packet requires manual export + edit | M |
| TB-187 | AI-assisted architecture request authoring — `POST /v1/architecture/request/draft` + pre-fill UI button | AI/Agent Readiness P2 — blank-page tax on first run; pure assistive, no changes to run contract | M |
| TB-190 | LLM-as-judge coverage extension — extend judge to Cost and Compliance agents; add `LlmJudgeBudget` sub-cap (~200k tokens/day, isolated from run-execution quota) as prerequisite | AI/Agent Readiness P2 — sub-cap design resolved 2026-06-01 (PQ-AI-02); implement sub-cap first, then extend judge coverage | M |
| TB-188 | Findings-to-IaC stub generator — `IFindingIacStubGenerator` + `IacStub` nullable property on `ArchitectureFinding`, feature-flagged | AI/Agent Readiness P3 — closes "what do I do now?" gap; finding → Bicep snippet with disclaimer | M |
| TB-189 | AI policy-pack drafting assistant — `POST /v1/governance/policy-pack/draft` with few-shot bundled-pack examples + UI draft panel | AI/Agent Readiness P3 — blank-page tax on enterprise policy authoring; removes primary pilot-stall pattern | M |
| TB-191 | Prompt template content-hash pinning on runs — add `SystemPromptContentHash` (first 16 hex of SHA-256) to `dbo.AgentExecutionTraces` + `AgentExecutionTraceDto`; compute in `AgentExecutionTraceRecorder` | Cutting-Edge AI Technology P2 — enables forensic prompt identity verification between runs; closes A/B accountability gap | S |
| TB-192 | Dynamic evidence summarization before context overflow — `IEvidenceSummarizationService` using `ModelTier.Fast`; counts against tenant run-execution quota (not a separate sub-cap — PQ-CEAT-02 resolved 2026-06-02); invoked by `ContextLengthGuardAgentCompletionClient` before hard truncation; `AgentExecution:EvidenceSummarization:Enabled=false` (opt-in); fail-open | Cutting-Edge AI Technology P1 — prevents bisection of evidence structure on large packages; currently only static truncation with audit event | M |
| TB-193 | LLM provider abstraction factory scaffold — `ILlmProviderFactory` + `LlmProviderDescriptor.ProviderType` enum (`AzureOpenAi`, `Anthropic`, `GoogleGemini`, `LocalOllama`); `DefaultLlmProviderFactory` wraps existing Azure OpenAI client; architecture test for interface isolation; **no concrete non-Azure provider implementations** (V2 per PQ-CEAT-01 resolved 2026-06-02 — Azure-native mandate ADR 0020) | Cutting-Edge AI Technology P2 — scaffold decouples interface from Azure OpenAI implementation; concrete providers require separate owner ADR | M |
| TB-194 | RAG corpus operator monitoring panel — `GET /v1/admin/rag-health` returning per-`CorpusKind` chunk counts, last-indexed-at, embedding dim, stale flag; UI panel under `/admin/rag-health`; Playwright smoke test | Cutting-Edge AI Technology P2 — operators have no in-app visibility into RAG index health; `RetrievalCorpusFreshnessSummary` exists but is health-probe only | S–M |
| TB-195 | Multi-turn Ask conversation context compression — `IConversationContextCompressor` using `ModelTier.Fast`; keep last N turns verbatim, compress older turns; `Ask:ConversationContext:CompressionEnabled=false` (opt-in); fail-open | Cutting-Edge AI Technology P2 — long pilot analyst sessions can exhaust context budget before current question is appended | M |
| TB-009 | Architecture invariant program — doc + ADR 0035 finalize | Engineering governance — single catalog IDs `INV-*`, proposed ADR acceptance, links from index / Cursor rule | Done (doc land 2026-05-09) |
| TB-010 | Architecture invariant enforcement — Wave A (INV-001, INV-005, INV-006) | Done (Improvement **#21**, 2026-05-25) — INV-001 Roslyn analyzer; INV-005 catalog/fail-fast parity; INV-006 composition-root scan | S |
| TB-011 | Architecture invariant enforcement — Wave B (INV-002, INV-004, INV-012, INV-013) | **Done (2026-06-01 batches 5D+5G)** — persisted read-path + dual-replica harness guards; Wave B architecture tests + CI drift guards | L |
| TB-033 | Agent execution trace — persist LLM sampling params + reasoning token count | **Done (2026-05-31)** — `AgentExecutionTraceRecorder` persists sampling params + `ReasoningTokenCount`; `AgentExecutionTraceRecorderSamplingParamsTests` | XS |
| TB-071 | Azure Search production client — wire tenant OData filter on every search/delete | **Done (2026-05-31)** — `AzureSearchSdkClient` + scoped delete; `AzureSearchTenantScopeFilterBuilderTests` | S–M |
| TB-072 | Scope-to-identity binding at API ingress (ApiKey, DevBypass, header/claim reconciliation) | **Done (2026-05-31)** — `ScopeIdentityBindingMiddleware` + ApiKey scope claims; `ScopeIdentityBindingIntegrationTests` | M |
| TB-073 | Scoped snapshot repository reads (findings / graph / context + relational child loads) | **Done (2026-05-31)** — scoped `GetByIdAsync(ScopeContext)` + `SqlFindingsSnapshotRepositoryScopeIsolationSqlIntegrationTests` | M |
| TB-074 | Retrieval indexing write-path tenant validation | **Done (2026-05-31)** — `RetrievalIndexingScopeValidator` on index writes; scoped in-memory delete; tests | S |
| TB-075 | Operator UI server-side scope (proxy strips client headers; SSR from session) | **Done (2026-05-31)** — `resolveProxyUpstreamScopeHeaders` + production-like proxy posture; value-report tenant from `/api/auth/me` | S–M |
| TB-082 | Agent `AllowedTools` — runtime enforcement at handler dispatch | **Done (2026-05-31)** — `AgentTaskAllowedToolsDispatchGuard` at dispatch; `AgentTaskAllowedToolsDispatchGuardTests` | S |
| TB-079 | ADO PR markdown — sanitize `SummaryHighlights` + deep-link fields before writing PR comment body | **Done (2026-05-31)** — `AdoPullRequestMarkdownEscaper` + safe links in compare + run-summary Markdown | XS |
| TB-083 | Service Bus — production safety rule: require namespace FQDN, disallow raw connection string | **Done (2026-05-31)** — `CollectIntegrationEventsServiceBusConnectionStringKeyVaultReference`; `ProductionSecretSourceRulesTests` | XS |
| TB-081 | `ArchLucidApiKey` — production safety rule: require Key Vault reference | **Done (2026-05-31)** — `CollectAzureDevOpsArchLucidApiKeyKeyVaultReference`; `ProductionSecretSourceRulesTests` | XS |
| TB-080 | Azure OpenAI — migrate from `ApiKey` config key to `DefaultAzureCredential` (Entra auth) | **Done (2026-05-31)** — `AuthenticationMode=ManagedIdentity` for completion, embeddings, judge; `AzureOpenAiConfigurationProbe`; KV sample + startup lint | S |
| TB-084 | AzureExtractor — validate `SubscriptionId` as GUID before ARM URL construction | **Done (2026-05-31)** — `HostedAzureExtractorGuidValidator` on client + ARM reader; unit tests | XS |
| TB-091 | Key Vault private endpoint + private DNS zone (`privatelink.vaultcore.azure.net`) | **Done (2026-06-01)** — `terraform-private` KV DNS zone + PE when `key_vault_id` set; `key_vault_private_endpoint_id` output; `terraform validate` | XS-S |
| TB-092 | Key Vault Secrets User RBAC for API + Worker managed identities | **Done (2026-06-01)** — `terraform-keyvault/workload_rbac.tf` + principal ID vars; `terraform-private/keyvault_rbac.tf`; `apply-saas.ps1` TB-092 second pass; `terraform.tfvars.example` | XS |
| TB-093 | Compose Azure OpenAI existing-resource consumption into hosted Terraform stack | **Done (2026-06-01)** — `openai_compose_mode=existing` (eastus); hosted-prod + container-apps env/RBAC; `terraform-openai` consumed contract; pilot_essential | M |
| TB-094 | Create `terraform-redis` root --- Azure Cache for Redis hot-path cache | **Done (2026-06-01)** — `infra/terraform-redis` + container-apps `hot_path_cache_redis_connection_string`; PE/DNS optional; `terraform validate` | S |
| TB-095 | Assess + codify Cosmos DB — `terraform-cosmos` (dormant assessment + optional root) | IaC coverage — **Done** 2026-06-01; see `COSMOS_DB_IAC_ASSESSMENT.md` | S-M |
| TB-096 | Compose Azure AI Search existing-resource consumption into hosted Terraform stack | IaC coverage — **Done** 2026-06-01; `deploy/hosted-prod-terraform` + `terraform-container-apps` `azure_search_*`; see `AZURE_AI_SEARCH_CONSUMED.md` | S |
| TB-097 | Create `terraform-acr` root — Azure Container Registry | IaC coverage — **Done** 2026-06-01; `infra/terraform-acr/` (optional `enable_acr`) | S |
| TB-098 | Add `azurerm_monitor_workspace` to `terraform-monitoring` | IaC coverage — **Done** 2026-06-01; managed workspace + `azure_monitor_workspace_id_effective` | XS |
| TB-099 | Add diagnostic settings for Container Apps, Service Bus namespace, and artifact storage account | Ops / observability — **Done** 2026-06-01; optional flags in container-apps, servicebus, storage (+ hosted platform diagnostics) | S |
| TB-100 | Migrate Logic App Standard storage from access-key to managed identity | IaC hygiene — **Done** 2026-06-01 (RBAC on hosting storage; access key still required by platform for file share mount) | M |
| TB-101 | Resolve legacy App Service VNet integration in `terraform-private/app_service.tf` | IaC hygiene — **Done** 2026-06-01 (documented legacy optional path; Container Apps is active compute) | XS |
| TB-102 | Parameterize `application_insights_sampling_percentage` in `terraform-monitoring` | IaC hygiene — **Done** 2026-06-01; `application_insights_sampling_percentage` variable (0–100, default 100) | XS |
| TB-085 | SqlRelationalBackfill — paged scans + checkpoint table | **Done (2026-06-01)** — `--batch-size`, `dbo.BackfillCheckpoints`, keyset paging | M |
| TB-086 | Backfill poison-row quarantine | **Done (2026-06-01)** — `dbo.BackfillFailures`, `--max-retries`, `--force-retry`, JSON `skippedQuarantinedCount` | S |
| TB-087 | Findings backfill DB idempotency | **Done (2026-06-01)** — migration **229** unique index; repository-only slice guard | XS–S |
| TB-088 | Container jobs per-entity isolation | **Done (2026-06-01)** — `TrialLifecycleArchLucidJob`, `AdvisoryDueScheduleProcessResult` | S |
| TB-089 | Digest ledger-before-send | **Done (2026-06-01)** — verified + `DigestEmailDispatcherIdempotencyTests` | S |
| TB-090 | Backfill.Cli — `--output-json` report + per-stage timing | **Done (2026-05-31)** — extended with quarantine fields in JSON (2026-06-01) | XS |
| TB-069 | Simplify `GreenfieldBaselineMigrationRunner` sparse-stamp path | Maintainability — complex drift-repair runner with no post-stamp schema verification | M |
| TB-070 | `PersistenceContractSupplement.sql` stale refs + test catalog parity | Test hygiene — supplement references retired `ArchiForge.sql`; can drift from latest migrations | XS |
| TB-156 | `start-local-api-and-ui.ps1` — strict preflight + `/api/proxy/health/live` E2E gate; no browser on failure | **Done (2026-05-31)** — `scripts/start-local-api-and-ui.ps1` E2E proxy gate | S |
| TB-157 | API connectivity toasts — distinguish ArchLucid API unreachable vs Ask/assistant stream failures | **Done (2026-05-31)** — `api-error-toast-policy.ts` + tests | XS |
| TB-106 | RunDetailPageView — enrich authority `RunDetailDto` with cost estimate, trust evidence card, and `results[]` | **Done (2026-05-31)** — `AuthorityRunDetailOperatorEnricher` on `GetRunDetail`; explanation-trace fallback label when `results[]` empty | M |
| TB-107 | RunDetailPageView — surface `lastFailureReason` + `hasGovernanceWarnings` from `RunRecord` | **Done (2026-05-31)** — `RunDetailGovernanceAlerts` + metadata `retryCount` when &gt; 0 | S |
| TB-108 | RunDetailPageView — render `findingCoverageSummary.dispositionCoverage` + `hasCommitBlockingFailures` | **Done (2026-05-31)** — `FindingCoverageDispositionPanel` + `commitBlockedReason` on `CommitRunButton` | S |
| TB-103 | Orphan candidate count + savings — expose backend-computed values via API; remove heuristic parser from UI | Customer-visible correctness — **Done** 2026-05-31; reaffirmed 2026-06-01 | M |
| TB-104 | 14-day expiring waiver KPI — server-compute the window; remove client-side date rule | Customer-visible correctness — **Done**; dashboard uses `waiversExpiringWithin14Days` only (**TB-155**, **TB-168**) | S |
| TB-105 | Business-impact category buckets — add pre-bucketed counts to `ExecutiveRoiSummaryResponse`; remove substring matcher | Customer-visible correctness — **Done** 2026-05-31 | S |
| TB-149 | Canonical 14-day expiring-waiver window — single server implementation; delete `CountExpiringWaivers` duplicate | **Done (2026-05-31)** — `GovernanceWaiverExpiryWindow.CountExpiringWithinDays` | S |
| TB-150 | Decisions-needed `TotalDecisionItems` — union cardinality across buckets, not sum | **Done (2026-05-31)** — `GovernanceDecisionsNeededSummaryCalculator` | S |
| TB-151 | `ExecutiveSummaryResult.TotalRiskReductionScore` — rename or map to pending-decision count | **Done (2026-05-31)** — `ResolvedFindingsCount30Days` + `PendingGovernanceDecisionCount` | XS |
| TB-152 | `ExecutiveSummaryResult.CostWasteUsd` — stop aliasing `TotalEstimatedUsdSavings` | **Done (2026-05-31)** — `CostWasteUsd: null` in live mapper | XS |
| TB-153 | Recurring architecture review trigger — idempotency before `ExecuteRunAsync` | **Done (2026-05-31)** — checkpoint before `ExecuteRunAsync` | M |
| TB-154 | Waiver ↔ disposition state machine — bidirectional invariants | **Done (2026-05-31)** — waiver/disposition guards | M |
| TB-155 | ROI cache TTL vs live decisions-needed — canonical expiring-waiver source | **Done (2026-05-31)** — cache refresh + dashboard single source | S |
| TB-109 | RunDetailPageView — add retrieval-hit / RAG grounding panel | **Done (2026-05-31)** — `RunDetailRetrievalGroundingSection` + faithfulness anchor | M |
| TB-110 | RunDetailPageView — add tool-call / function-invocation log panel | **Done (2026-06-01)** — structured `AgentToolInvocationRecords` ledger + forensics API; execute-gated inline raw preview on run detail | M |
| TB-111 | RunDetailPageView — inline provenance summary card (collapse from sibling route) | **Done (2026-06-01)** — `RunDetailProvenanceSummaryCard` on run detail | S |
| TB-112 | RunDetailPageView — add run-level approve / reject / request-remediation actions | **Done (2026-06-01)** — `POST …/disposition` + `RunDetailRunGovernanceDispositionActions` | M |
| TB-113 | Fix OpenAPI schema drift on `RunDetailDto` — expose `degradedFindingCoverage` + `findingCoverageSummary` in generated TypeScript types | **Done (2026-06-01)** — OpenAPI + `api-types.generated.ts`; `RunDetailDtoOpenApiContractTests` | XS |
| TB-170 | Accelerator chooser — map buyer job → starter proof pack → expected proof output | **Done (2026-06-01)** — `ACCELERATOR_CHOOSER.md`, UI `AcceleratorChooserCard`, `/help/accelerator-chooser` | S |
| TB-171 | Starter proof pack metadata contract | **Done (2026-06-01)** — `starter-pack.json` on all packs; `STARTER_PROOF_PACK_METADATA_CONTRACT.md` | S |
| TB-172 | Starter proof pack static validation gate | **Done (2026-06-01)** — `check_starter_proof_packs.py` + CI + unit tests | S |
| TB-173 | Template-to-proof dry-run harness | **Done (2026-06-01)** — `dry_run_starter_proof_packs.py` + `StarterProofPack*` dotnet tests | M |
| TB-174 | Golden accelerator walkthrough (one pack only) | **Done (2026-06-01)** — `walkthroughs/GOLDEN_ACCELERATOR_WALKTHROUGH.md` (regulated SaaS) | S |
| TB-175 | Policy pack metadata and buyer-safe caveat validation | **Done (2026-06-01)** — `packManifest` on vertical packs; `check_policy_pack_manifests.py` + contract doc | S |
| TB-176 | Policy pack dry-run index | **Done (2026-06-01)** — `POLICY_PACK_DRY_RUN_INDEX.md` generated from manifests; CI `--check` | S |
| TB-121 | Route/tier/policy/nav parity release gate hardening | **Done (2026-06-01)** — sponsor/production BLOCK on drift; parity in first-pilot proof | S |
| TB-122 | Governance outcome summary in sponsor proof | **Done (2026-06-01)** — `governance-outcome-summary` artifacts in proof | S |
| TB-123 | Policy-pack freshness report in proof/procurement artifacts | **Done (2026-06-01)** — `policy-pack-freshness` v2 from `packManifest` | S |
| TB-124 | Audit coverage drift gate for critical workflows | **Done (2026-06-01)** — `mutating-route-audit-matrix` + drift in proof/CI | M |
| TB-125 | Buyer-safe audit evidence summary in proof bundles | **Done (2026-06-01)** — `audit-evidence-summary` + triage one-pager | S |
| TB-126 | Audit event catalog metadata | **Done (2026-06-01)** — `audit_event_catalog.v1.json` + CI check | M |
| TB-127 | Audit tests for sponsor/procurement proof actions | **Done (2026-06-01)** — `test_commercial_audit_proof_batch.py` | M |
| TB-128 | Support/audit triage one-pager | **Done (2026-06-01)** — `SUPPORT_AUDIT_TRIAGE_ONE_PAGER.md` | XS-S |
| TB-129 | Quote-to-proof readiness checklist | **Done (2026-06-01)** — `report_quote_to_proof_readiness.py` + proof artifacts | S |
| TB-130 | Quote aging export and follow-up SLA report | **Done (2026-06-01)** — `quote-aging-sla.json/md` from AdminAuthority API in proof | M |
| TB-131 | Commercial closeout artifact hardening | **Done (2026-06-01)** — `validate_commercial_closeout_consistency.py` + Pester tests | S |
| TB-132 | Tier fit validation matrix | **Done (2026-06-01)** — `tier_fit_validation_matrix.v1.json` + `check_tier_fit_matrix.py` | S |
| TB-133 | AI & Cloud Architecture Readiness Review offer pack aligned to pricing | **Done (2026-06-01)** — `AI_CLOUD_ARCHITECTURE_READINESS_REVIEW_OFFER_PACK.md` | S |
| TB-134 | Commercial copy overclaim guard + public claim-boundary guide | **Done (2026-06-01)** — `check_commercial_overclaim_guard.py` + `PUBLIC_CLAIM_BOUNDARY_GUIDE.md` | S |
| TB-158 | Pilot success thresholds and acceptance criteria | Customer-success / ROI proof — model-assisted owner-reviewable PASS/HOLD thresholds for proof quality, ROI confidence, false positives, and time-to-first-value | S |
| TB-141 | Near-term GTM backlog: real pilot proof packet cohort | GTM proof — owner-selected scenarios, approved data boundaries, and buyer-safe proof packets for Azure cost / orphan / governance review and adjacent starter cohorts | Owner/program |
| TB-142 | Near-term GTM backlog: market-facing demo asset production | GTM proof — approved screenshots/video/copy and evidence-labeling rules for channel-specific demo assets | Owner/GTM |
| TB-159 | Buyer security/procurement packet | Procurement readiness — approved security questionnaire answers, trust-center caveats, support/SLA posture, data-retention answers, and not-yet-certified language | S-M |
| TB-160 | Legal/procurement terms packet | Procurement readiness — MSA/DPA posture, support/SLA language, data-retention commitments, liability boundaries, and redline approval path | M |
| TB-161 | Design partner / pilot recruiting pipeline | GTM execution — target accounts, qualification criteria, founder-led outreach, pilot acceptance terms, and proof-capture permission path | S-M |
| TB-162 | Support and pilot operating model | Operations — support hours, escalation path, response targets, incident communications, owner availability, and white-glove vs self-serve pilot posture | S |
| TB-163 | Transactable procurement path | Commercial conversion — invoice/services SOW/private offer/Stripe/Marketplace decision tree, payment terms, legal/tax readiness, and claim boundaries | M |
| TB-164 | V1.1 backlog: first named public reference customer | GTM proof — customer permission, logo/case-study approval, reference-call terms, and claim update process | Owner/GTM |
| TB-165 | Assessment score consistency guard | Documentation quality — keep weighted tables, per-quality sections, and headline score synchronized after rescores | XS-S |
| TB-166 | Release claim gate for full real-mode AI evidence | Release safety — **Done** (2026-06-01): `check_release_real_mode_claim.py` + `Invoke-ReleaseRealModeClaimGate.ps1` | S |
| TB-167 | Sponsor AI readiness posture artifact | Sponsor proof — one simple release/proof artifact showing execution mode, quality gate, retrieval grounding, and budget/cost posture for every sponsor packet | S-M |
| TB-168 | Executive KPI semantic contract and UI heuristic regression guard | Customer-visible correctness — **Done** (2026-06-01): `EXECUTIVE_KPI_SEMANTIC_CONTRACT.json`, UI + Application.Tests guards | S |
| TB-169 | Pilot-first onboarding and Operate-surface progressive disclosure | Adoption friction — **Done** (2026-06-01): committed-review nav gate + first-run workflow panel | M |
| TB-170 | Remediate stale relative markdown links (docs/nav consolidation drift) | **Done (2026-06-01 batch 5F)** — `repair_doc_links_batch5f.py` + stubs; `check_doc_links.py` exit 0; CI merge-blocking | L |
| TB-143 | In-app markdown documentation renderer + `/help/{topic}` routes | **Done (2026-06-01)** — registry-backed `/help/{topic}` renderer | M |
| TB-144 | Customer-facing documentation registry | **Done (2026-06-01)** — `product-documentation-registry.ts` | S |
| TB-145 | Migrate operator/product help links from GitHub blob to in-app routes | **Done (2026-06-01)** — primary surfaces use `resolveInAppDocHref` | M |
| TB-146 | Redirect-stub ban + canonical target resolution in registry | **Done (2026-06-01)** — registry + stub rejection test | XS |
| TB-147 | CI drift guard — no customer-facing GitHub blob links in product UI | **Done (2026-06-01)** — `customer-facing-github-blob-guard.test.ts` | S |
| TB-148 | Role-gated optional “View source on GitHub” footer | **Done (2026-06-01)** — `HelpTopicSourceFooter` | XS |
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

**Status (2026-06-01, batches 5D+5G):** **Done** — **INV-002** (Batch H); **INV-004** budget tracker + dual-replica SQL concurrency harness drift guards; **INV-012** persisted evaluation read path + API/Application injection guards; **INV-013** replay-guid commit guard + integration test.

**Covers:** **INV-002**, **INV-004**, **INV-012**, **INV-013**.

**Objective:** Persist honest execution labelling across API + DB + traces; reconcile LLM budgets across replicas; persist one quality-gate verdict per persisted run revision for downstream consumers; ensure replay artefacts do not mutate original evidence namespaces.

**Enforcement sketches:** DbUp → master DDL as per repo SQL rules; OpenAPI snapshot + codegen per **[`docs/library/API_CONTRACTS.md`](API_CONTRACTS.md)** if DTO shape changes.

**Depends on:** product agreement on **`Mixed`** UX copy (INV-002) before UI ships.

---

## TB-012 — Invariant Wave C — hygiene pack (clock, cancellation, idempotency, HTTP, repos, webhook order)

**Status (2026-06-01, batch 5I):** **Done** — Wave C architecture guards complete: **INV-003/011/015** (earlier), **INV-010/014** (batch **5H**), **INV-007/008/009** (batch **5I** — `InjectedTimeArchitectureTests`, `CancellationForwardingArchitectureTests`, `MutatingHttpIdempotencyArchitectureTests`) + extended `test_invariant_wave_c_batch.py`. Follow-up Roslyn analyzers for **INV-007/008** remain optional hardening, not backlog blockers.

**Covers:** **INV-007**–**INV-011**, **INV-014**, **INV-015** plus **INV-003** transactional vs informational markings.

**Objective:** Analyzer-first gates with low behavioural risk; ordered inbound webhook pipeline before handler bodies; forbid mutable static state in **`Application`** / **`AgentRuntime`**.

**Note:** **INV-003** must respect **TB-001** informational-audit semantics unless a superseding backlog item merges.

---

## TB-170 — Accelerator chooser — buyer job → starter proof pack → expected proof output

**Status:** **Done (2026-06-01)** — [`ACCELERATOR_CHOOSER.md`](ACCELERATOR_CHOOSER.md), [`templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md`](../../templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md), `AcceleratorChooserCard`, registry slug `accelerator-chooser`.

**Objective:** Give evaluators one obvious way to pick the right existing accelerator without browsing the whole `templates/` tree.

**Scope:**

- Add a chooser artifact that maps buyer jobs to existing starter proof packs, for example:
  - AI governance / LLM risk review → `templates/starter-proof-packs/ai-llm-workload/`
  - Regulated SaaS procurement → `templates/starter-proof-packs/regulated-saas-soc-procurement/`
  - Azure cost governance → `templates/starter-proof-packs/azure-cost-governance/`
  - Healthcare workflow review → `templates/starter-proof-packs/healthcare-data-workflow/`
- Include expected inputs, expected proof outputs, target persona, time-to-first-value, and when not to use the pack.
- Link from `templates/README.md`, `docs/onboarding/EVALUATOR_WORKBOOK.md`, and the first-pilot command-center docs if the chooser becomes part of the operator path.

**Acceptance criteria:**

- A first-time evaluator can select one pack from a buyer job without reading every template README.
- The chooser points only to existing, V1-safe packs unless a row is explicitly marked deferred.
- No new starter pack is added as part of this item.

**Refs:** `templates/starter-proof-packs/`, `templates/README.md`, `docs/onboarding/EVALUATOR_WORKBOOK.md`.

**Size estimate:** S.

---

## TB-171 — Starter proof pack metadata contract

**Status:** **Done (2026-06-01)** — all four packs ship `starter-pack.json`; contract documented in [`STARTER_PROOF_PACK_METADATA_CONTRACT.md`](STARTER_PROOF_PACK_METADATA_CONTRACT.md).

**Objective:** Make every starter proof pack self-describing and reviewable as a V1 artifact, not a loose folder of examples.

**Scope:**

- Define a small metadata contract, likely `starter-pack.json`, for each `templates/starter-proof-packs/*` folder.
- Required fields: `id`, `title`, `targetBuyer`, `buyerJob`, `owner`, `lastReviewedUtc`, `requiredInputs`, `expectedOutputs`, `scopeLabel`, `doNotUseWhen`, and `deferredScopeNotes`.
- Keep scope labels explicit: `V1-ready`, `V1.1-deferred`, `V2-deferred`, or `owner-input-required`.

**Acceptance criteria:**

- Every starter proof pack has metadata with non-empty required fields.
- Metadata says when the pack is inappropriate, not only when it is useful.
- Deferred capabilities such as first-party ITSM/chat/doc connectors, live commerce, SOC 2 CPA, and public references are not implied by a V1-ready pack.

**Refs:** `templates/starter-proof-packs/*`, `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`.

**Size estimate:** S.

---

## TB-172 — Starter proof pack static validation gate

**Status:** **Done (2026-06-01)** — `scripts/ci/check_starter_proof_packs.py` in CI; `scripts/ci/tests/test_check_starter_proof_packs.py`.

**Objective:** Prevent starter packs from drifting, breaking, or shipping buyer-unsafe placeholders.

**Scope:**

- Add a CI script under `scripts/ci/` that scans every `templates/starter-proof-packs/*` folder.
- Validate required files exist, JSON files parse, metadata contract is complete, Markdown links are local/valid where practical, placeholders are absent from V1-ready files, and no obvious secret-shaped values are present.
- Reuse existing placeholder/secret patterns where possible; do not create a second inconsistent scanner if an existing helper can be shared.

**Acceptance criteria:**

- CI fails on missing metadata, malformed JSON, buyer-unsafe placeholders in V1-ready pack files, or missing required pack artifacts.
- Tests cover at least one valid fixture and one invalid fixture.
- The gate does not require live cloud credentials or network calls.

**Refs:** `scripts/ci/`, `templates/starter-proof-packs/`, existing procurement/template validation helpers.

**Size estimate:** S.

---

## TB-173 — Template-to-proof dry-run harness

**Status:** **Done (2026-06-01)** — `scripts/ci/dry_run_starter_proof_packs.py` (Python gate; optional `--with-dotnet-tests`); `StarterProofPackArchitectureRequestDryRunTests`, `StarterProofPackPolicyContextTests`.

**Objective:** Prove each starter pack can flow through the minimal ArchLucid request/policy/context path without live cloud dependencies.

**Scope:**

- Add a deterministic dry-run harness that loads each starter pack's `architecture-request.json`, policy/context files, and expected second-run inputs where present.
- Validate that the pack can produce the minimum proof-shape expected by V1: request accepted by local schema/contract validation, policy context parseable, expected output labels present, and scope/deferred labels preserved.
- Prefer fast local validation over full API execution unless a pre-existing simulator path can be reused cheaply.

**Acceptance criteria:**

- One command validates all starter packs offline.
- Failure output names the pack, file, field, and remediation.
- The harness distinguishes "template invalid" from "live cloud dependency not exercised."

**Refs:** `templates/starter-proof-packs/*`, `scripts/ci/eval_template_harness.py`, `ArchLucid.Contracts`.

**Size estimate:** M.

---

## TB-174 — Golden accelerator walkthrough (one pack only)

**Status:** **Done (2026-06-01)** — [`walkthroughs/GOLDEN_ACCELERATOR_WALKTHROUGH.md`](walkthroughs/GOLDEN_ACCELERATOR_WALKTHROUGH.md) for `regulated-saas-soc-procurement`.

**Objective:** Create one canonical accelerator walkthrough that demonstrates the end-to-end evaluator experience without expanding template count.

**Recommended pack:** `templates/starter-proof-packs/regulated-saas-soc-procurement/` unless current GTM focus favors `ai-llm-workload`.

**Scope:**

- Add a concise walkthrough showing: choose pack, inspect required inputs, run or dry-run the pack, collect proof, interpret expected artifacts, and identify sponsor-safe caveats.
- Include expected artifact names and screenshots only if they can be generated from stable local/demo assets.
- Keep the walkthrough explicit that it is example proof, not SOC 2 CPA, third-party assurance, live commerce, or public customer reference evidence.

**Acceptance criteria:**

- The walkthrough can be followed by an evaluator without reading the full repo.
- Expected artifacts line up with actual starter pack files and first-pilot proof docs.
- No second or third walkthrough is created until this one proves useful in demos or pilots.

**Refs:** `templates/starter-proof-packs/regulated-saas-soc-procurement/`, `docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`, `docs/onboarding/EVALUATOR_WORKBOOK.md`.

**Size estimate:** S.

---

## TB-175 — Policy pack metadata and buyer-safe caveat validation

**Status:** **Done (2026-06-01)** — `packManifest` on all `templates/policy-packs/*`; [`POLICY_PACK_METADATA_CONTRACT.md`](POLICY_PACK_METADATA_CONTRACT.md); `scripts/ci/check_policy_pack_manifests.py`.

**Objective:** Ensure every V1 policy pack is reviewable, scoped, and impossible to mistake for a compliance certification.

**Scope:**

- Add or standardize metadata for each policy pack: owner, last reviewed date, target buyer/job, applicable scope, required inputs, sample finding, and buyer-safe caveat.
- Validate that default policy packs include explicit "not certification / not legal advice / architecture-review input" wording.
- Prefer reusing any metadata created for starter proof packs instead of inventing a second schema.

**Acceptance criteria:**

- Every policy pack included in V1 proof or procurement surfaces has required metadata.
- Missing caveats or stale `lastReviewedUtc` values fail validation or produce a proof warning.
- No default policy pack claims SOC 2, HIPAA, PCI, ISO, or regulator certification.

**Refs:** `templates/policy-packs/`, `docs/library/POLICY_PACK_CONTENT_BACKLOG.md`, `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`.

**Size estimate:** S.

---

## TB-176 — Policy pack dry-run index

**Status:** **Done (2026-06-01)** — [`POLICY_PACK_DRY_RUN_INDEX.md`](POLICY_PACK_DRY_RUN_INDEX.md); `scripts/ci/generate_policy_pack_dry_run_index.py`; linked from [`ACCELERATOR_CHOOSER.md`](ACCELERATOR_CHOOSER.md).

**Objective:** Give operators and evaluators a compact map of available policy packs, what each one proves, and what inputs it expects.

**Scope:**

- Generate or maintain an index listing policy pack ID, buyer job, target persona, required inputs, expected findings, caveats, and V1/V1.1/deferred scope.
- Link from accelerator chooser work (**TB-170**) and first-pilot/procurement proof docs where relevant.
- Include "do not use when" guidance so packs are not selected as generic compliance rubber stamps.

**Acceptance criteria:**

- A policy pack can be selected from the index without opening every pack README.
- Deferred or future connector assumptions are clearly labeled.
- Index is generated or validated in CI from pack metadata.

**Refs:** `templates/policy-packs/`, `templates/starter-proof-packs/`, `docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`.

**Size estimate:** S.

---

## TB-121 — Route/tier/policy/nav parity release gate hardening

**Status:** **Done (2026-06-01)** — `Add-RouteTierPolicyNavFinding` BLOCK on sponsor/production/drift; [`ROUTE_TIER_POLICY_NAV_DRIFT_GATE.md`](ROUTE_TIER_POLICY_NAV_DRIFT_GATE.md).

**Objective:** Prevent UI, packaging, authorization, and policy surfaces from drifting apart after route or tier changes.

**Scope:**

- Harden the existing route/tier/policy/nav parity scripts so changed route/nav/tier/policy files require regenerated parity proof.
- Ensure proof output is copied into first-pilot sponsor proof and release evidence.
- Keep failures actionable: name changed files, missing registry rows, and remediation command.

**Acceptance criteria:**

- CI or release proof fails when route/tier/policy/nav surfaces drift after a relevant file change.
- Sponsor proof includes parity output or a clear skipped/not-applicable reason.
- The gate does not hide routes or tier definitions; it points maintainers to fix registries.

**Refs:** `scripts/ci/assert_route_tier_policy_nav.py`, `scripts/ci/data/route_tier_policy_nav_registry.json`, `scripts/collect-first-pilot-proof.ps1`.

**Size estimate:** S.

---

## TB-122 — Governance outcome summary in sponsor proof

**Status:** **Done (2026-06-01)** — `governance-outcome-summary.md/json` in first-pilot proof via `report_first_pilot_governance_outcome.py`.

**Objective:** Make governance status visible to sponsors without forcing them through internal governance screens.

**Scope:**

- Add a concise governance summary to first-pilot proof and sponsor artifacts.
- Fields should include policies applied, approval posture, unresolved waivers, governance warnings, whether evidence is buyer-safe, and whether any item blocks sponsor handoff.
- Reuse existing governance/proof state; do not recompute business logic in a separate script.

**Acceptance criteria:**

- Sponsor proof includes a governance PASS/WARN/HOLD-style summary.
- Deferred/non-certification caveats remain explicit.
- Missing governance evidence cannot be silently absent when policy packs are part of the buyer claim.

**Refs:** `scripts/collect-first-pilot-proof.ps1`, `docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`, governance workflow DTOs.

**Size estimate:** S.

---

## TB-123 — Policy-pack freshness report in proof/procurement artifacts

**Status:** **Done (2026-06-01)** — `policy-pack-freshness.md/json` from `packManifest.lastReviewedUtc` (v2 schema).

**Objective:** Surface stale policy packs before they appear in buyer proof.

**Scope:**

- Produce a policy-pack freshness report with pack ID, version, owner, last reviewed date, and stale/warn threshold.
- Include the report in procurement pack or first-pilot proof when policy packs are used.
- Align thresholds with procurement freshness checks where possible.

**Acceptance criteria:**

- Stale policy packs are visible as WARN/HOLD depending on sponsor/procurement mode.
- Freshness report is machine-readable and Markdown-readable.
- No external service or legal review is required to run the check.

**Refs:** `templates/policy-packs/`, `scripts/build_procurement_pack.py`, `scripts/collect-first-pilot-proof.ps1`.

**Size estimate:** S.

---

## TB-124 — Audit coverage drift gate for critical workflows

**Status:** **Done (2026-06-01)** — `Add-MutatingRouteAuditMatrixFinding` + `check_audit_matrix.py` in CI/proof.

**Objective:** Keep audit coverage aligned with mutating routes, governance actions, and proof/commercial handoff operations.

**Scope:**

- Extend or add a drift gate that maps critical routes/actions to expected `AuditEventTypes`.
- Include governance approvals, waiver actions, proof collection/handoff markers, quote/commercial follow-up changes, and support bundle generation where applicable.
- Allow explicit informational-only exceptions with rationale.

**Acceptance criteria:**

- New/changed critical route or workflow without an audit mapping fails CI or release proof.
- Exceptions are named, reviewed, and buyer-safe.
- Output names the missing action/event pair and remediation doc.

**Refs:** `ArchLucid.Core/Audit/AuditEventTypes.cs`, `docs/library/AUDIT_COVERAGE_MATRIX.md`, `scripts/ci/`.

**Size estimate:** M.

---

## TB-125 — Buyer-safe audit evidence summary in proof bundles

**Status:** **Done (2026-06-01)** — `audit-evidence-summary.md/json`; links [`SUPPORT_AUDIT_TRIAGE_ONE_PAGER.md`](../runbooks/SUPPORT_AUDIT_TRIAGE_ONE_PAGER.md).

**Objective:** Let sponsors and support teams understand audit evidence without exposing raw audit payloads.

**Scope:**

- Add a proof artifact summarizing recent audit event categories, correlation IDs, run/manifest linkage, and omitted sensitive fields.
- Keep it category/count/identifier based; do not include raw payloads or PII.
- Link to support/audit triage guidance (**TB-128**).

**Acceptance criteria:**

- First-pilot proof folder includes Markdown and JSON audit evidence summary when a `RunId` is supplied.
- Summary includes enough correlation handles for support follow-up.
- Sensitive audit payloads remain omitted by design.

**Refs:** `scripts/collect-first-pilot-evidence.ps1`, `scripts/collect-first-pilot-proof.ps1`, audit repositories/controllers.

**Size estimate:** S.

---

## TB-126 — Audit event catalog metadata

**Status:** **Done (2026-06-01)** — [`scripts/ci/data/audit_event_catalog.v1.json`](../../scripts/ci/data/audit_event_catalog.v1.json) + `check_audit_event_catalog.py`.

**Objective:** Make audit event types self-describing for support, compliance review, and drift checks.

**Scope:**

- Add catalog metadata for each event type: owner/function, purpose, expected actor, expected tenant/workspace/project scope fields, sensitivity, retention/export posture, and buyer-safe summary.
- Use the catalog in docs or drift gates rather than duplicating explanations in multiple places.

**Acceptance criteria:**

- Every `AuditEventTypes` member has catalog metadata or an explicit exclusion.
- Catalog can generate or validate `AUDIT_COVERAGE_MATRIX.md`.
- Tests fail when a new event type lacks metadata.

**Refs:** `ArchLucid.Core/Audit/AuditEventTypes.cs`, `docs/library/AUDIT_COVERAGE_MATRIX.md`.

**Size estimate:** M.

---

## TB-127 — Audit tests for sponsor/procurement proof actions

**Status:** **Done (2026-06-01)** — `test_commercial_audit_proof_batch.py` + extended `test_collect_first_pilot_proof_contract.py`.

**Objective:** Prove commercially sensitive proof actions are auditable or explicitly informational-only.

**Scope:**

- Add targeted tests around sponsor proof generation, procurement pack/deal-ready checks, quote follow-up mutations, and commercial closeout state transitions.
- Where an action intentionally does not write audit rows, document why and ensure support artifacts still have traceability.

**Acceptance criteria:**

- Critical sponsor/procurement actions either emit audit events or have explicit informational-only rationale.
- Tests cover at least one success and one blocked/HOLD path.
- No test requires live buyer data or external services.

**Refs:** proof scripts, marketing quote admin controllers/repositories, audit integration tests.

**Size estimate:** M.

---

## TB-128 — Support/audit triage one-pager

**Status:** **Done (2026-06-01)** — [`docs/runbooks/SUPPORT_AUDIT_TRIAGE_ONE_PAGER.md`](../runbooks/SUPPORT_AUDIT_TRIAGE_ONE_PAGER.md).

**Objective:** Give operators a short, deterministic investigation path from `runId` or `correlationId`.

**Scope:**

- Add a one-page runbook: given `runId`, `manifestId`, or `correlationId`, open these artifacts/endpoints in order.
- Include support bundle, audit slice, committed-run evidence, first-pilot command center, and trace/provenance links.
- Keep raw SQL optional and clearly marked internal-only.

**Acceptance criteria:**

- Operators can follow one page without reading the whole troubleshooting tree.
- Buyer-safe vs internal-only artifacts are labeled.
- Linked from support bundle README or `references.json` if appropriate.

**Refs:** `docs/runbooks/TROUBLESHOOTING.md`, `docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`, support bundle docs.

**Size estimate:** XS-S.

---

## TB-129 — Quote-to-proof readiness checklist

**Status:** **Done (2026-06-01)** — `scripts/ci/report_quote_to_proof_readiness.py`; proof emits `quote-to-proof-readiness.json/md`.

**Objective:** Tie sales-led quote requests to actual proof readiness before asking for annual conversion.

**Scope:**

- Add a checklist covering quote request, target tier, proof status, ROI basis, AI evidence posture, data consistency, deferred buyer asks, and next commercial action.
- Reuse proof JSON fields and quote/admin data; do not create a parallel truth source.

**Acceptance criteria:**

- Checklist can distinguish `SEND`, `HOLD`, and `DEFERRED_SCOPE`.
- Unsupported/defaulted/demo-derived ROI blocks or caveats the commercial ask.
- Output is available as Markdown and JSON for sales/admin use.

**Refs:** `scripts/FirstPilotCommercialCloseout.ps1`, `scripts/collect-first-pilot-proof.ps1`, marketing quote admin APIs.

**Size estimate:** S.

---

## TB-130 — Quote aging export and follow-up SLA report

**Status:** **Done (2026-06-01)** — `Add-PricingQuoteAgingFinding` writes `quote-aging-sla.json/md` when admin API reachable.

**Objective:** Make sales-led commercial packaging operational instead of passive.

**Scope:**

- Add AdminAuthority-only CSV/JSON export for open quote requests with age bucket, tier interest, source, and follow-up status.
- Add SLA summary: open count, warning count, breach count, and oldest unacknowledged request.
- Avoid external CRM integration unless already present.

**Acceptance criteria:**

- Admin users can inspect/export quote aging rows without exposing PII outside admin routes.
- Tests cover authorization and age-bucket logic.
- Docs state recommended follow-up SLA.

**Refs:** `MarketingPricingQuoteAgingAdminController`, quote aging repositories, `docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md`.

**Size estimate:** M.

---

## TB-131 — Commercial closeout artifact hardening

**Status:** **Done (2026-06-01)** — `validate_commercial_closeout_consistency.py`; `FirstPilotCommercialCloseout.Tests.ps1`.

**Objective:** Make the generated commercial closeout artifact authoritative and consistent with proof state.

**Scope:**

- Verify `commercial-closeout.md/json` agree with `go-no-go-summary.json`, command center disposition, ROI basis, procurement posture, and deferred scope.
- Add tests or fixture assertions for PASS, HOLD, and DEFERRED_SCOPE.
- Include owner, next ask, caveats, and linked proof artifacts.

**Acceptance criteria:**

- Markdown and JSON dispositions cannot diverge silently.
- HOLD due to AI/ROI/data/procurement appears as commercial HOLD.
- Deferred buyer requirements are labeled `DEFERRED_SCOPE`, not missing product evidence.

**Refs:** `scripts/FirstPilotCommercialCloseout.ps1`, `scripts/ci/tests/FirstPilotCommercialCloseout.Tests.ps1`, first-pilot proof fixtures.

**Size estimate:** S.

---

## TB-132 — Tier fit validation matrix

**Status:** **Done (2026-06-01)** — [`scripts/ci/data/tier_fit_validation_matrix.v1.json`](../../../../../scripts/ci/data/tier_fit_validation_matrix.v1.json); CI `check_tier_fit_matrix.py`.

**Objective:** Keep pricing tiers aligned with buyer jobs, evidence outputs, and explicit exclusions.

**Scope:**

- Add a matrix mapping each tier to buyer job, included proof outputs, support/assurance posture, excluded/deferred capabilities, and upgrade path.
- Validate tier names and exclusions against pricing philosophy and commercial/procurement copy.

**Acceptance criteria:**

- Tier matrix is machine-readable or CI-checkable.
- Copy cannot imply V1 includes live Marketplace transactability, SOC 2 CPA, public references, or V1.1 connectors.
- Matrix links to quote-to-proof and service-led offer materials.

**Refs:** `docs/go-to-market/PRICING_PHILOSOPHY.md`, `docs/library/PRODUCT_PACKAGING.md`, route/tier/policy/nav registry.

**Size estimate:** S.

---

## TB-133 — AI & Cloud Architecture Readiness Review offer pack aligned to pricing

**Status:** **Done (2026-06-01)** — [`AI_CLOUD_ARCHITECTURE_READINESS_REVIEW_OFFER_PACK.md`](../go-to-market/AI_CLOUD_ARCHITECTURE_READINESS_REVIEW_OFFER_PACK.md).

**Objective:** Turn the selected first sales motion, **AI & Cloud Architecture Readiness Review**, into a reusable sales-led package that can be drafted by a frontier model and owner-reviewed before publication.

**Scope:**

- Produce a concise offer pack: one-page offer, pilot scope, owner-reviewable pricing bands, expected proof artifacts, buyer prerequisites, exclusions, order-form path, and next step after proof.
- Add "what the buyer gets in week 1 / week 2" language so the service is easy to understand before a platform sale.
- Align with named SKUs in service-led GTM docs and pricing philosophy.
- Include exact deliverables and acceptance criteria, but keep final wording and pricing as owner-reviewable draft output until explicitly approved.
- Keep owner/customer/legal inputs out of committed placeholders unless explicitly approved.

**Acceptance criteria:**

- Offer pack can be sent internally to prepare a sales-led engagement.
- AI & Cloud Architecture Readiness Review packaging names buyer outcomes, timeline, deliverables, exclusions, prerequisites, and acceptance criteria.
- It does not claim live commerce, public references, or external attestations.
- It links to proof readiness checklist and commercial closeout artifacts.

**Refs:** `docs/go-to-market/PRICING_PHILOSOPHY.md`, `docs/go-to-market/ORDER_FORM_TEMPLATE.md`, `docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md`, `docs/go-to-market/SERVICE_LED_OFFERS.md` if present.

**Size estimate:** S.

---

## TB-134 — Commercial copy overclaim guard + public claim-boundary guide

**Status:** **Done (2026-06-01)** — `check_commercial_overclaim_guard.py`; [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md).

**Objective:** Prevent buyer-facing commercial copy from implying unavailable capabilities, unsupported ROI, or unlabeled prototype/simulator/local-owner-dev evidence.

**Scope:**

- Add CI checks for phrases implying live commerce, Azure Marketplace transactability, SOC 2 CPA, third-party pen-test completion, public customer references, or unsupported ROI/cost claims.
- Add an owner-reviewable public claim-boundary guide covering what ArchLucid is, what it is not yet, which claims require proof, and what must be labeled simulator, local-owner-dev, prototype, V1.1, or V2.
- Add a model-assisted drafting prompt or fixture that regenerates public positioning and claim boundaries from current GTM docs without inventing unsupported claims.
- Reuse procurement claim-coherence scanners where possible.
- Cover committed docs and selected UI marketing/operator copy that buyers may see.

**Acceptance criteria:**

- A fixture with a false SOC 2/live-commerce/public-reference/unsupported-ROI claim fails.
- A fixture with unlabeled simulator/local-owner-dev/prototype evidence fails or receives a required caveat.
- Approved deferred-scope language passes.
- Public claim boundaries are explicit enough for a model to draft buyer-facing copy without implying unsupported maturity, certifications, procurement paths, customer references, or production evidence.
- The check reports file path, matched phrase, and suggested caveat.

**Refs:** `scripts/procurement_pack_validation.py`, `docs/go-to-market/`, `archlucid-ui/src/app/(marketing)/`, `archlucid-ui/src/app/(operator)/why-archlucid/`.

**Size estimate:** S.

---

## TB-135 — V1.1 backlog: SOC 2 CPA attestation program kickoff (assessment #23)

**Window:** **V1.1 backlog** — owner / organizational program, not V1 engineering. **Do not** re-prompt from assessment batches; see **`.cursor/rules/V1_1-assurance-backlog.mdc`**.

**Context:** V1 ships honest self-assessment, CAIQ/SIG/DPA templates, and roadmap (`docs/security/SOC2_SELF_ASSESSMENT_2026.md`, `docs/go-to-market/SOC2_ROADMAP.md`, `docs/go-to-market/TRUST_CENTER.md`). CPA Type I/II engagement is gated on ARR or binding procurement requirement per [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *Resolved 2026-05-05 (SOC 2 ARR trigger)*.

**Pick up when owner directs:**

1. Confirm scope (Trust Services Criteria), budget ceiling, and auditor/readiness consultant shortlist.
2. Align observation window and target report type with [`SOC2_ROADMAP.md`](../go-to-market/SOC2_ROADMAP.md).
3. Update Trust Center rows only when posture changes — no implied “SOC 2 issued” language before CPA delivery.

**Explicit limits:** Not a coding-agent default task; **`(A)` assessments must not** treat absent CPA SOC 2 as a V1 defect.

**Refs:** [`V1_DEFERRED.md`](V1_DEFERRED.md) §6c, assessment improvement **#23**.

**Size estimate:** Organizational — multi-week / multi-month; no repo SLA.

---

## TB-136 — V1.1 backlog: third-party pen-test program (assessment #25)

**Window:** **V1.1 backlog** — funded vendor engagement, not V1 engineering. **Do not** re-prompt from assessment batches; see **`.cursor/rules/V1_1-assurance-backlog.mdc`**. V1 relies on **owner-conducted** testing (**TB-005**).

**Pick up when owner directs:**

1. Select vendor, award SoW (`docs/security/pen-test-summaries/2026-Q2-SOW.md` template).
2. Execute engagement, remediate material findings, decide public vs NDA-only summary policy.
3. Populate redacted summary working copy (`2026-Q2-REDACTED-SUMMARY.md`) and refresh Trust Center when published.

**Explicit limits:** Not a substitute for **TB-005** owner-conducted V1 exercise; not autonomous external attack from the coding agent.

**Refs:** [`V1_DEFERRED.md`](V1_DEFERRED.md) §6c, assessment improvement **#25**, **TB-005**.

**Size estimate:** Organizational — vendor-led; calendar not pinned here.

---

## TB-137 — Real-LLM evidence: full quad-agent live pipeline gate

**Status:** Shipped (2026-05-30). Merge-time schema validation now uses `AgentResultMergeSchemaSerializer` + `AgentResultMergeNormalizer` (wire subset, tolerant enum/finding coercion, proposal id backfill). Live test asserts `DecisionTraces` instead of empty coordinator `DecisionNodes`. Re-run `Invoke-RealLlmEvidenceGate.ps1` locally for PASS/HOLD confirmation.

**Owner decision (2026-06-01):** Canonical release-candidate real-mode evidence source is **local owner dev**. The gate is **release-candidate required**, but **not branch-protection required** for the next release. If the evidence gate is not attached and passing, the release must narrow its claim to simulator-only.

**Pick up when:** live gate still HOLD after owner re-run — capture `merge.Errors` from test output and extend normalizer/converters. Also update release checklist/proof docs if the RC evidence attachment rules drift from the owner decision above.

**Refs:** `ArchLucid.Decisioning/Validation/AgentResultMergeSchemaSerializer.cs`, `ArchitectureFindingJsonConverter`, `RealAzureOpenAIEndToEndTests`, `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`, `docs/quality/REAL_LLM_SESSION_2026-05-29.md`.

**Size estimate:** M (~4–8 h) — **closed**.

---

## TB-138 — Real-LLM evidence: GitHub golden-cohort secrets + required PR check (TB-007 Gap A remainder)

**Status:** **Shipped (2026-05-30)** — `ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true` repo variable, `cohort-real-llm-gate` runs on **pull_request** (fork-safe no-op), **`environment: dev`** for Azure federated login + Cost Management probe, CI AOAI secret fallbacks in `real-llm-golden-cohort.yml` / `Invoke-RealLlmGoldenCohort.ps1`, and **`cohort-real-llm-gate`** added to branch ruleset required checks. Owner confirms one green **`golden-cohort-nightly`** run on **`master`** after merge.

**Remaining owner-only (not code):** optional live invoke secrets (`ARCHLUCID_GOLDEN_COHORT_API_HOST`, `ARCHLUCID_GOLDEN_COHORT_LIVE_SCHEDULE_ENABLED`) for unattended **`cohort-real-llm-live`**.

**Verify:** `.\scripts\ci\verify_real_mode_prereqs.ps1 -Profile GoldenCohortGate -UseGitHubCli -Strict`

**Refs:** **TB-007** Gap A, `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md` § 2, `.github/workflows/golden-cohort-nightly.yml`.

---

## TB-139 — Real-LLM evidence: capture token usage and cost in gate metrics

**Status:** Partial (2026-05-30). `TryWriteRealLlmRunMetricsJson` now computes `estimatedCostUsd` when token totals are &gt; 0 (env-rate override or GPT-4o defaults). **`inputTokensTotal` / `outputTokensTotal`** still depend on Azure `Usage` reaching `LiveAoaiTraceSpy` and on fixing production double-consume in `LlmCompletionAccountingClient`.

**Pick up when:**

1. Trace token counts from `AzureOpenAiCompletionClient` into `IAgentExecutionTraceRecorder` for live runs.
2. Optionally surface `estimatedCostUsd` via existing `AgentExecution:LlmCostEstimation` options in gate metrics JSON.
3. Gate row **Token/cost estimate** should flip from **Not captured** to **Passed** on live runs.

**Refs:** `RealAzureOpenAIEndToEndTests.TryWriteRealLlmRunMetricsJson`, `scripts/Invoke-RealLlmEvidenceGate.ps1`.

**Size estimate:** S (~2–4 h).

---

## TB-140 — Real-LLM eval corpus: real-mode scenarios + nightly scoring (TB-007 Gap C)

**Status:** Open. All `tests/eval-corpus/` scenarios remain `"mode": "simulator"`. No CI job asserts real-model finding quality against keyword expectations.

**Pick up when:**

1. Add at least one eval-corpus scenario with `"mode": "real"` and meaningful `expectedFindings` keyword checks.
2. Wire nightly or post-deploy job running `scripts/ci/eval_agent_corpus.py` against real-mode API (same secrets/budget probe as golden cohort gate).
3. Gate on `ARCHLUCID_GOLDEN_COHORT_REAL_LLM` variable documented in **TB-007** Gap C.

**Refs:** **TB-007** Gap C, `.github/workflows/golden-cohort-nightly.yml`, `tests/eval-corpus/`.

**Size estimate:** M (~4 h).

---

## TB-141 — Near-term GTM backlog: real pilot proof packet cohort

**Window:** **Near-term GTM backlog priority** — owner-selected scenarios/environments required. Data policy resolved 2026-05-30: customer data, sanitized internal data, and demo-only data are all allowed input classes when the relevant authorization, redaction, source labeling, and buyer-safe caveats are satisfied. Owner triage on 2026-06-01 promoted this from V1.1 to near-term GTM work.

**Context:** V1 can improve proof-packet mechanics, source labeling, release rollups, skip semantics, and first-screen proof status. The first proof-density cohort scenarios were selected on 2026-05-30: AI / LLM workload governance, regulated SaaS procurement / SOC-style diligence, and Azure cost / orphan / governance review. Owner triage on 2026-06-01 selected **Azure cost / orphan / governance review** as the canonical golden walkthrough starter pack once metadata and validation land. A named cohort of real pilot proof packets still requires owner decisions on environments and credentials, so it is not a V1 scored defect. The threshold for moving from controlled pilots to broader claims is already defined in `docs/go-to-market/GTM_BACKLOG.md` § *Proof-gated rollout criteria*.

**Pick up now for near-term GTM planning:**

1. Define environment boundaries for the selected first cohort scenarios:
   - AI / LLM workload governance (`templates/starter-proof-packs/ai-llm-workload/`)
   - Regulated SaaS procurement / SOC-style diligence (`templates/starter-proof-packs/regulated-saas-soc-procurement/`)
   - Azure cost / orphan / governance review (`templates/starter-proof-packs/azure-cost-governance/`)
2. Confirm approved data boundaries, redaction rules, and source labels before running each packet.
3. Apply the `GTM_BACKLOG.md` proof-gated rollout criteria when deciding whether the cohort unlocks broader sales claims.
4. Run the cohort, archive buyer-safe packets, and update GTM materials only with claims supported by those packets.

**Explicit limits:** Do not treat absence of this cohort as a current `(A)` headline readiness penalty. V1 assessment work should focus on the reusable evidence harnesses and proof semantics that make the cohort credible.

**Refs:** `docs/assessments/LATEST_GPT55.md` §9, `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`, `docs/go-to-market/QUOTE_TO_PROOF_READINESS_CHECKLIST.md`.

**Size estimate:** Owner/program work — depends on selected scenarios and environment access.

---

## TB-142 — Near-term GTM backlog: market-facing demo asset production

**Window:** **Near-term GTM backlog priority** — brand, audience, and publication approval required. Channel resolved 2026-05-30: optimize **Upwork** first; website, sales email, LinkedIn, and live demo can reuse/adapt later. Evidence policy resolved 2026-05-30: real-mode output may be shown in public assets when authorized, redacted, source-labeled, and caveated; synthetic/demo-labeled assets remain allowed. Owner triage on 2026-06-01 promoted this from V1.1 to near-term GTM work.

**Context:** V1 can harden proof artifacts, claim-language lint, starter proof packs, and operator first-value paths. Final market-facing screenshots, video, sales copy, and channel-specific demo assets are owner-approved GTM outputs and are not a V1 scored defect.

**Pick up now for near-term GTM planning:**

1. Select the primary Upwork audience and proposal/profile format.
2. Choose the evidence source for each asset: authorized real-mode output when publishable, or synthetic/demo-labeled output when safer.
3. Define channel-specific evidence-labeling rules before asset creation.
4. Produce screenshots/video/copy and run promise-language checks before publication.

**Explicit limits:** Do not claim public customer proof, live production SLA, SOC 2 CPA, third-party validation, or broad real-LLM validation unless separate evidence exists.

**Refs:** `docs/go-to-market/WHAT_NOT_TO_PROMISE.md`, `docs/go-to-market/COMMERCIAL_DECISION_PACKET.md`, `templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md`.

**Size estimate:** Owner/GTM production work — depends on channel and approval path.

---

## TB-158 — Pilot success thresholds and acceptance criteria

**Status (2026-06-01):** **Done** — [`docs/go-to-market/PILOT_ACCEPTANCE_THRESHOLDS.md`](../go-to-market/PILOT_ACCEPTANCE_THRESHOLDS.md); linked from [`PILOT_SUCCESS_SCORECARD.md`](../go-to-market/PILOT_SUCCESS_SCORECARD.md); proof automation via `report_pilot_acceptance_thresholds.py`, `pilot-acceptance-thresholds.json/md` in `collect-first-pilot-proof.ps1`, CI `test_pilot_acceptance_batch.py`.

**Objective:** Define measurable PASS/HOLD criteria for founder-led pilots before results are interpreted or renegotiated after the fact.

**Scope:**

- Draft owner-reviewable thresholds for minimum proof packet quality, ROI/savings confidence, time-to-first-value, false-positive tolerance, and sponsor acceptance.
- Align thresholds with `PILOT_SUCCESS_SCORECARD.md`, quote-to-proof closeout, first-pilot proof artifacts, and commercial SEND/HOLD/DEFERRED_SCOPE states.
- Keep the first pass model-assisted and evidence-backed; final thresholds require owner review before use in customer-facing commitments.

**Acceptance criteria:**

- A pilot can be judged PASS/HOLD using documented thresholds without relying on ad hoc founder interpretation.
- Unsafe ROI basis, weak proof quality, missing real-mode evidence, or excessive false positives produce HOLD or explicit caveats.
- Thresholds are linked from the service-led offer pack and commercial closeout artifacts.

**Refs:** `docs/go-to-market/PILOT_SUCCESS_SCORECARD.md`, `docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md`, `docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`, **TB-131**, **TB-133**.

**Size estimate:** S.

---

## TB-159 — Buyer security/procurement packet

**Status (2026-06-01):** **Done** — [`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md).

**Objective:** Create a buyer-safe security/procurement packet that supports controlled pilots without implying formal external certification.

**Scope:**

- Draft approved security questionnaire answers using current Trust Center, SOC self-assessment, DPA, CAIQ/SIG, subprocessors, support posture, and data-retention materials.
- Include explicit "not yet certified" language for SOC 2 CPA, third-party pen test, ISO, and any other unavailable external assurance.
- Add a review checklist that catches stale dates, missing owners, unsupported assurance claims, and unanswered buyer-risk questions.
- Reuse procurement pack validation helpers where practical.

**Acceptance criteria:**

- Packet clearly distinguishes shipped controls, self-assessment evidence, roadmap items, V1.1/V2 external programs, and buyer-specific answers.
- No sentence implies SOC 2 CPA, third-party pen-test completion, public references, or live marketplace transactability unless separately evidenced.
- The packet can be attached to a controlled-pilot procurement conversation with owner review.

**Refs:** `docs/go-to-market/TRUST_CENTER.md`, `docs/security/SOC2_SELF_ASSESSMENT_2026.md`, `docs/go-to-market/SOC2_ROADMAP.md`, `docs/go-to-market/PROCUREMENT_EVIDENCE_PACKET.md`, **TB-134**, **TB-135**, **TB-136**.

**Size estimate:** S-M.

---

## TB-160 — Legal/procurement terms packet

**Status (2026-06-01):** **Done** — [`docs/go-to-market/LEGAL_PROCUREMENT_TERMS_PACKET.md`](../go-to-market/LEGAL_PROCUREMENT_TERMS_PACKET.md).

**Objective:** Make the first legal/procurement conversation concrete enough for paid pilots without inventing legal commitments in product copy.

**Scope:**

- Draft a packet covering MSA/DPA posture, support/SLA language, data-retention commitments, liability boundaries, redline owner, and approval path.
- Link each claim to the current source document or mark it owner/legal-review required.
- Add an internal checklist for terms that must not be committed by the product or agent without owner approval.

**Acceptance criteria:**

- Founder/operator can answer common procurement questions from one packet.
- Legal terms, data-retention promises, support/SLA claims, and liability boundaries are clearly marked as draft/approved/not available.
- The packet does not override formal contract language or create hidden product commitments.

**Refs:** `docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md`, `docs/go-to-market/ORDER_FORM_TEMPLATE.md`, `docs/go-to-market/TRUST_CENTER.md`, `docs/legal/` if present.

**Size estimate:** M.

---

## TB-161 — Design partner / pilot recruiting pipeline

**Status (2026-06-01):** **Done** — [`docs/go-to-market/PILOT_RECRUITING_PIPELINE.md`](../go-to-market/PILOT_RECRUITING_PIPELINE.md).

**Objective:** Turn founder-led pilot recruiting into a repeatable, evidence-aware pipeline instead of ad hoc outreach.

**Scope:**

- Define target account profile, buyer persona, qualification criteria, disqualifiers, and pilot acceptance terms.
- Add outreach and intake artifacts that map prospects to the selected service-led offer and starter proof packs.
- Require proof-capture permission, data boundary agreement, and public/private reference expectations to be settled before proof claims are reused.

**Acceptance criteria:**

- A prospect can be classified as qualified, nurture, or no-fit with documented reasons.
- Pilot acceptance captures data/proof permissions and expected buyer outcomes.
- Recruiting artifacts route public-reference asks to the V1.1 public-reference backlog, not the current release score.

**Refs:** `docs/go-to-market/SERVICE_LED_OFFERS.md`, `docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`, `docs/go-to-market/PILOT_SUCCESS_SCORECARD.md`, **TB-141**, **TB-164**.

**Size estimate:** S-M.

---

## TB-162 — Support and pilot operating model

**Status (2026-06-01):** **Done** — [`docs/go-to-market/SUPPORT_AND_PILOT_OPERATING_MODEL.md`](../go-to-market/SUPPORT_AND_PILOT_OPERATING_MODEL.md).

**Objective:** Define the operating posture for controlled pilots so buyers know how support, escalation, and incident communication work.

**Scope:**

- Document support hours, escalation path, response targets, incident communications, owner availability, and white-glove vs self-serve pilot posture.
- Align with support bundle, audit triage, troubleshooting, and first-pilot operator path.
- State which support/SLA promises are pilot-only, generally available, draft, or not offered.

**Acceptance criteria:**

- Pilot buyer materials and operator docs agree on support expectations.
- Incident and escalation language is specific enough for procurement review but does not overstate production SLA maturity.
- Support model links to support/audit triage and proof-bundle artifacts.

**Refs:** `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`, `docs/runbooks/TROUBLESHOOTING.md`, `docs/go-to-market/TRUST_CENTER.md`, **TB-128**, **TB-159**, **TB-160**.

**Size estimate:** S.

---

## TB-163 — Transactable procurement path

**Status (2026-06-01):** **Done** — [`docs/go-to-market/TRANSACTABLE_PROCUREMENT_PATH.md`](../go-to-market/TRANSACTABLE_PROCUREMENT_PATH.md).

**Objective:** Define how a buyer can actually purchase a pilot or service-led engagement without implying unavailable checkout channels.

**Scope:**

- Create a decision tree for invoice, services SOW, private offer, Stripe, Azure Marketplace, or "not available yet."
- Define payment terms, legal/tax readiness dependencies, approval owners, and claim boundaries for each path.
- Add copy-guard coverage so buyer-facing materials cannot imply live Stripe or Marketplace transactability before configuration and approval exist.

**Acceptance criteria:**

- Commercial closeout can name the correct purchase path or HOLD reason.
- Materials distinguish current invoice/SOW/private-offer readiness from future Stripe/Marketplace channels.
- Unsupported transactability claims are caught by the overclaim guard.

**Refs:** `docs/go-to-market/PRICING_PHILOSOPHY.md`, `docs/go-to-market/ORDER_FORM_TEMPLATE.md`, `docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md`, **TB-131**, **TB-134**.

**Size estimate:** M.

---

## TB-164 — V1.1 backlog: first named public reference customer

**Status (2026-06-01):** **Done (template)** — [`docs/go-to-market/NAMED_REFERENCE_CUSTOMER_CAPTURE.md`](../go-to-market/NAMED_REFERENCE_CUSTOMER_CAPTURE.md) (owner execution remains V1.1).

**Objective:** Capture the owner-output work required before ArchLucid can use a named customer logo, public case study, or reference call as market proof.

**Window:** **V1.1 GTM backlog** — not current release work and not a current `(A)` headline-readiness blocker.

**Scope:**

- Define permission requirements for logo use, public case-study language, anonymized proof, reference calls, and revocation.
- Create a reference-readiness checklist tied to proof packet quality, buyer approval, legal approval, and claim-boundary review.
- Link public-reference claims to the commercial copy overclaim guard.

**Acceptance criteria:**

- No public-reference claim can be added without an approved reference record or explicit anonymized-case-study caveat.
- The checklist names who approved the claim, what can be said, where it can be used, and when it must be revalidated.
- Current release materials can say "no named public reference yet" without treating that as a product defect.

**Refs:** `docs/go-to-market/WHAT_NOT_TO_PROMISE.md`, `docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md`, **TB-134**, **TB-141**, **TB-142**.

**Size estimate:** Owner/GTM.

---

## TB-165 — Assessment score consistency guard

**Status (2026-06-01):** **Done** — `scripts/ci/check_assessment_score_consistency.py` (arithmetic headline check); `scripts/Assert-AssessmentScoreConsistency.ps1` (table-vs-detail text consistency check).

**Objective:** Prevent assessment rescoring from updating the headline/table while leaving detailed quality sections stale.

**Scope:**

- Add a lightweight script or documented checklist that parses `docs/assessments/LATEST_GPT55.md` for headline score, weighted table rows, and per-quality `Score:` lines.
- Report mismatches in score, weight, weighted impact, or weighted deficiency signal.
- Keep the guard docs-only or local-script friendly; do not require external services.

**Acceptance criteria:**

- Running the check reports any table/detail mismatch with quality name and expected values.
- The check can be used after manual rescoring before committing an assessment update.
- It does not alter assessment judgment; it only catches arithmetic/text drift.

**Refs:** `docs/assessments/LATEST_GPT55.md`, `docs/library/ASSESSMENT_QUALITY_MODEL.md`.

**Size estimate:** XS-S.

---

## TB-166 — Release claim gate for full real-mode AI evidence

**Status (2026-06-01):** **Done** — `scripts/ci/check_release_real_mode_claim.py`, `scripts/Invoke-ReleaseRealModeClaimGate.ps1`, wired into `Invoke-ReleaseRealLlmEvidenceRequirement.ps1`; unit tests in `scripts/ci/tests/test_check_release_real_mode_claim.py`; override procedure and downstream connections documented in [`docs/quality/RELEASE_CLAIM_GATE.md`](../quality/RELEASE_CLAIM_GATE.md).

**Objective:** Make release packaging fail safe when full Topology/Cost/Compliance/Critic real-mode evidence is missing, partial, stale, or HOLD.

**Why this is not a duplicate:** **TB-137 – TB-140** generate and improve real-mode evidence. This item controls release claims and release-candidate packaging: if the evidence is not attached and passing, product/proof/release materials must narrow themselves to simulator-only or partial-real-mode language.

**Scope:**

- Add a release-candidate evidence manifest check that requires a current `real-llm-evidence-gate.json` / Markdown artifact for all four agent paths: Topology, Cost, Compliance, and Critic.
- Validate artifact freshness, execution mode, agent coverage, structural validity, semantic/faithfulness status when available, and PASS/WARN/HOLD outcome.
- Feed the result into release notes, first-pilot proof, commercial closeout, and public claim-boundary checks so missing or partial evidence produces simulator-only / partial-real-mode wording.
- Add a documented manual override only for explicitly simulator-only releases; the override must name who approved the narrower claim and why.
- Keep live Azure OpenAI calls out of normal PR CI. This is a release-candidate packaging guard, not a branch-protection gate.

**Acceptance criteria:**

- Release packaging cannot claim full real-mode AI confidence unless all four agent paths have current passing evidence attached.
- Topology-only or partial live evidence is labeled as partial, not PASS.
- Missing, stale, or HOLD evidence causes generated release/proof/commercial artifacts to use simulator-only or partial-real-mode claims.
- Tests/fixtures cover full PASS, topology-only, partial-agent, stale artifact, missing artifact, and explicit simulator-only release.

**Refs:** **TB-137**, **TB-138**, **TB-139**, **TB-140**, **TB-131**, **TB-134**, `scripts/Invoke-RealLlmEvidenceGate.ps1`, `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`, `docs/quality/REAL_LLM_SESSION_2026-05-29.md`, `docs/library/V1_RELEASE_CHECKLIST.md`.

**Size estimate:** S.

---

## TB-167 — Sponsor AI readiness posture artifact

**Status (2026-06-01):** **Done** — `scripts/collect-first-pilot-proof.ps1` emits `ai-readiness-gate.json` / `.md` (consolidated posture); TB-166 adds `real-mode-claim-gate` for release copy; sponsor artifact schema and writing rules documented in [`docs/go-to-market/AI_READINESS_POSTURE.md`](../go-to-market/AI_READINESS_POSTURE.md).

**Objective:** Promote production-like retrieval, real-mode evidence, quality-gate results, and budget posture into one sponsor-safe artifact that every proof packet can include.

**Why this is not a duplicate:** Existing items cover the component evidence: **TB-109** surfaces retrieval, **TB-137 – TB-140** cover real-mode evidence and cost metrics, **TB-166** controls release claims, and **TB-122 / TB-125 / TB-131** add proof/commercial summaries. This item composes those signals into one concise sponsor artifact instead of making buyers infer AI readiness from separate files.

**Scope:**

- Add an `ai-readiness-posture.json` and `ai-readiness-posture.md` artifact to first-pilot proof and release evidence collection.
- Include execution mode per agent path: simulator, local-owner-dev real mode, partial real mode, mixed, or not run.
- Include quality-gate posture: structural validity, semantic score, faithfulness/support ratio when available, PASS/WARN/HOLD outcome, and caveats.
- Include retrieval posture: vector index type, Azure AI Search vs in-memory, tenant filtering status, grounding availability, degraded/missing retrieval state, and link/reference to retrieval-hit evidence when present.
- Include budget posture: configured LLM budget, observed/estimated token usage and cost when available, missing-cost caveat when token usage is not captured, and kill-switch/budget guard status.
- Include a sponsor-safe summary paragraph and internal diagnostic references; omit raw prompts, secrets, unredacted customer evidence, and raw retrieved text unless already approved elsewhere.
- Link or embed the artifact from sponsor packet, release evidence, commercial closeout, and procurement/security packet outputs.

**Acceptance criteria:**

- Every generated sponsor proof packet has a single AI readiness posture artifact or an explicit "not applicable / simulator-only" reason.
- The artifact makes it obvious whether claims are based on simulator, topology-only real evidence, full quad-agent real evidence, or mixed evidence.
- Missing retrieval, missing cost data, failed quality gates, or HOLD real-mode evidence cannot appear as a green/pass summary.
- Tests/fixtures cover full real-mode PASS, simulator-only, partial real-mode, missing retrieval, missing token/cost metrics, and HOLD quality gate.
- The artifact reuses existing evidence outputs; it does not create a second quality-gate or ROI truth source.

**Refs:** **TB-109**, **TB-122**, **TB-125**, **TB-131**, **TB-137**, **TB-139**, **TB-140**, **TB-166**, `scripts/collect-first-pilot-proof.ps1`, `scripts/Invoke-RealLlmEvidenceGate.ps1`, `docs/library/AGENT_OUTPUT_EVALUATION.md`, `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`.

**Size estimate:** S-M.

---

## TB-168 — Executive KPI semantic contract and UI heuristic regression guard

**Status (2026-06-01):** **Done** — `docs/library/EXECUTIVE_KPI_SEMANTIC_CONTRACT.json`; UI guard tests (`executive-kpi-semantic-contract.test.ts`, live KPI cards ban `expiringWaiversCount14Days ??`); `CachingExecutiveRoiSummaryServiceTests` proves live governance refresh over stale cache; dashboard expiring-waiver tile uses `waiversExpiringWithin14Days` only (**TB-155**).

**Objective:** Prevent customer-visible executive KPI, ROI, waiver, and decision-count semantics from drifting back into duplicated UI/backend/cache implementations after the known fixes land.

**Why this is not a duplicate:** **TB-103 – TB-105** and **TB-149 – TB-155** fix specific known defects: orphan savings, expiring-waiver windows, business-impact buckets, decision-count union semantics, confusing DTO fields, waiver/disposition invariants, cache freshness, and recurring-run idempotency. This item adds a durable contract and regression guard so the same class of issue is caught before future UI or cache changes ship.

**Scope:**

- Create a machine-readable KPI semantic contract for executive ROI/governance fields: source of truth, meaning, units, freshness semantics, allowed fallback behavior, and owning service/DTO.
- Add a UI guard that fails on reintroduced substring matching, client-side date-window rules, local KPI summing, or fallback chains for fields that the contract marks server-authoritative.
- Add contract fixtures covering orphan candidate count/savings, expiring-waiver count, decisions-needed total, business-impact buckets, cost waste, recoverable savings, and risk-reduction/pending-decision naming.
- Add cache freshness contract checks so cached executive ROI values either match canonical live values or carry explicit stale/freshness labels.
- Link the contract from API docs and dashboard component tests so generated clients and UI contributors know which values are display-only.

**Acceptance criteria:**

- A new UI-side heuristic for a server-authoritative KPI fails a focused test or lint guard.
- Contract fixtures prove table/API/UI labels agree on meaning, units, and freshness for the highest-risk KPI fields.
- Cache fallback behavior is explicit and tested; stale cached values cannot silently override fresher governance/decision values.
- The guard is narrow enough not to ban harmless formatting, rounding, or display-only transformations.

**Refs:** **TB-103**, **TB-104**, **TB-105**, **TB-149**, **TB-150**, **TB-151**, **TB-152**, **TB-153**, **TB-154**, **TB-155**, `ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs`, `ArchLucid.Application/Roi/CachingExecutiveRoiSummaryService.cs`, `archlucid-ui/src/lib/run-potential-savings-parser.ts`, `docs/library/PILOT_SCORECARD_API.md`.

**Size estimate:** S.

---

## TB-169 — Pilot-first onboarding and Operate-surface progressive disclosure

**Status (2026-06-01):** **Done (V1)** — `filterNavLinksByCommittedArchitectureReviewGate` + `nav-committed-architecture-review-gate.test.ts` (pilot path before commit; `operate-governance` empty until committed); `OperatorFirstRunWorkflowPanel` + `useNavProgressiveDisclosure` for extended/advanced tiers.

**Objective:** Reduce first-run branching by making the primary operator path a single guided Pilot flow, while keeping recurring/Operate surfaces out of the main navigation until there is a committed review or proof artifact to operate.

**Why this is not a duplicate:** **TB-156 – TB-157** fix confusing API/proxy diagnostics. **TB-143 – TB-148** move customer-facing documentation into in-app help. This item changes first-run product flow and navigation disclosure so new evaluators are not asked to understand Pilot, Operate, governance, recurring reviews, audit, proof, and procurement all at once.

**Scope:**

- Add or refine a first-run state detector: no committed review, no sponsor proof, no selected starter pack, or first-pilot setup incomplete.
- In first-run state, make the primary CTA path: choose starter proof pack, confirm evidence/source labels, create/execute review, commit review, collect proof.
- Hide or de-emphasize recurring review, long-running Operate dashboards, advanced governance queues, and broad audit/procurement surfaces until the first committed review/proof exists.
- Keep advanced surfaces reachable through an explicit "Advanced / Operate mode" affordance for admins, not as the default first-run path.
- Add empty states that explain what unlocks after first commit, using in-app help routes from **TB-143 – TB-145**.
- Add tests for zero-review, draft-run, executed-not-committed, committed-review, and admin-advanced states.

**Acceptance criteria:**

- A first-time evaluator sees one obvious Pilot next step instead of multiple equivalent routes into Operate workflows.
- Operate surfaces are not presented as required setup before a first committed review/proof artifact exists.
- Admins can still reach advanced surfaces intentionally.
- Empty states and help links explain the unlock condition without sending users to raw GitHub docs.
- Tests lock the visibility rules for first-run vs committed-review states.

**Refs:** **TB-114**, **TB-143**, **TB-144**, **TB-145**, **TB-156**, **TB-157**, `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`, `docs/runbooks/FIRST_VALUE_20_MINUTES.md`, `archlucid-ui/src/app/(operator)/`, `archlucid-ui/src/components/OperatorNextActionsCard.tsx`, `archlucid-ui/src/components/CorePilotNextStepsCard.tsx`.

**Size estimate:** M.

---

## TB-170 — Remediate stale relative markdown links (docs/nav consolidation drift)

**Status:** **Done (2026-06-01 batch 5F).** Repaired **200** stale relative targets (`scripts/ci/repair_doc_links_batch5f.py`, redirect stubs, depth fixes); `python scripts/ci/check_doc_links.py` exits **0** on a clean checkout; CI **Check relative markdown links** is merge-blocking (`continue-on-error` removed); drift guard `scripts/ci/tests/test_doc_links_batch.py`.

**Objective:** Restore repo-wide relative markdown link integrity so documentation cross-refs resolve after `docs/library/` consolidation and navigational moves.

**Why this is not a duplicate:** **TB-147** blocks GitHub blob URLs in operator/marketing UI code. **TB-143 – TB-148** move customer help in-app. **TB-170** fixes broken relative markdown link targets inside `docs/`, `archlucid-ui/docs/`, and root `README.md` surfaced by the CI advisory scanner.

**Scope:**

- Run `python scripts/ci/check_doc_links.py` (alias `scripts/ci/check_md_links.py`) and batch-fix broken targets.
- Common drift patterns: wrong depth after `docs/library/` hub (`library/`, `runbooks/` missing `../`); ADR paths (`adr/` → `adrs/`, `../runbooks/` depth); code paths missing `../../../`; gitignored `docs/assessments/LATEST.md` → tracked `LATEST_GPT55.md` or dated archives; moved canonical files (`UI_DESIGN_SYSTEM.md`, runbooks under `docs/runbooks/`).
- Extend [`ARCHITECTURE_INDEX.md`](../ARCHITECTURE_INDEX.md) where hub gaps remain.
- After zero broken links (or a documented allowlist for intentional non-file targets), remove `continue-on-error: true` from the **Check relative markdown links** step in `.github/workflows/ci.yml` (`doc-markdown-links` job).

**Acceptance criteria:**

- `python scripts/ci/check_doc_links.py` exits 0 on a clean checkout.
- CI **Check relative markdown links** is merge-blocking (no `continue-on-error`).
- New broken relative links fail CI without a fix or documented allowlist entry.

**Refs:** **TB-147**, `scripts/ci/check_doc_links.py`, `scripts/ci/check_md_links.py`, `.github/workflows/ci.yml` (`doc-markdown-links`), [`ARCHITECTURE_INDEX.md`](../ARCHITECTURE_INDEX.md).

**Size estimate:** L (~2–4 days across many files).

---

## TB-143 — In-app markdown documentation renderer + `/help/{topic}` routes

**Status:** **Done (2026-06-01)** — `archlucid-ui/src/app/(operator)/help/[topic]/`, `HelpTopicMarkdownView`, API route `api/help/[slug]`; registry-backed markdown load.

**Objective:** Render customer-facing Markdown inside the ArchLucid operator (and selected marketing) shell at stable routes such as `/help/pilot-guide`.

**Scope:**

- Add dynamic route(s) under `archlucid-ui/src/app/(operator)/help/[topic]/` (or equivalent) that load registry-defined source markdown at build time or via a controlled server read path.
- Render with product typography/spacing per [`PRODUCT_DOCUMENTATION_PRESENTATION.md`](PRODUCT_DOCUMENTATION_PRESENTATION.md) and [`UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md).
- Include in-page navigation (topic list, headings TOC) and reuse existing help search where practical.
- No GitHub chrome, branch selector, file tree, or raw/edit/blame affordances.

**Acceptance criteria:**

- `/help/pilot-guide` renders buyer-safe pilot content without leaving ArchLucid.
- Help panel and contextual help can target in-app slugs instead of external URLs.
- Page title + summary appear above body content; markdown links to other registered topics stay in-app.

**Refs:** **TB-144**, `HelpProductGuide.tsx`, `HelpDocsClient.tsx`, `getDocHref()`, `toDocsBlobUrl()`.

**Size estimate:** M (~1–2 days).

---

## TB-144 — Customer-facing documentation registry

**Status:** **Done (2026-06-01)** — `product-documentation-registry.ts` + unit/load tests.

**Objective:** Single registry mapping product documentation topics to canonical in-app routes and repo source markdown paths.

**Scope:**

- Add `archlucid-ui/src/lib/product-documentation-registry.ts` (or generated manifest from repo metadata) with entries for at minimum: pilot guide, getting started, evidence intake, review packages, executive summary, evidence trail, governance approval, audit trail, troubleshooting.
- Each entry: `id`, `slug`, `title`, `summary`, `sourcePaths[]`, `audience`, optional `redirectFrom[]` stub paths.
- Export helpers: `getInAppDocHref(slug)`, `resolveDocSourcePaths(slug)`, `allCustomerFacingTopics()`.
- Document registry authoring rules in [`PRODUCT_DOCUMENTATION_PRESENTATION.md`](PRODUCT_DOCUMENTATION_PRESENTATION.md).

**Acceptance criteria:**

- Registry is the only authoritative map from product topic id → `/help/{slug}` → markdown source.
- Unit tests cover slug lookup and stub-path resolution (**TB-146**).

**Refs:** **TB-143**, **TB-145**, **TB-146**, `help-topics.ts`, `doc-index.json`.

**Size estimate:** S (~2–4 h).

---

## TB-145 — Migrate operator/product help links from GitHub blob to in-app routes

**Status:** **Done (2026-06-01)** — `resolveInAppDocHref` / `getDocHref` / `toDocsBlobUrl`; marketing and operator primary surfaces migrated off GitHub blob defaults.

**Objective:** Replace customer-facing GitHub blob links with in-app documentation routes across operator and buyer-visible surfaces.

**Scope:**

- `HelpPanel.tsx` — topic links and core pilot guide CTA use registry in-app hrefs.
- `contextual-help-content.ts` / `ContextualHelp` — `learnMoreUrl` resolves to `/help/{slug}` not `toDocsBlobUrl()`.
- `help-topics.ts` — add optional `inAppSlug` (or derive from registry); stop defaulting `getDocHref()` to GitHub for operator audiences.
- `archlucid-ui/public/doc-index.json` generation — emit in-app URLs for customer-facing entries.
- Audit and migrate hard-coded GitHub links in buyer-polished operator components and marketing modules where the audience is not developer/contributor (integrations page may keep GitHub for admin-only deep links if gated).

**Acceptance criteria:**

- Default deployed operator UI (without `NEXT_PUBLIC_DOCS_BASE_URL`) opens in-app help, not github.com.
- No product “Learn more” link targets `docs/library/PILOT_GUIDE.md` stub on GitHub.

**Refs:** **TB-143**, **TB-144**, **TB-146**, `WizardStepPreset.tsx`, `security-trust-content.ts`, `PilotStartHereStrip.tsx`.

**Size estimate:** M (~4–8 h).

---

## TB-146 — Redirect-stub ban + canonical target resolution in registry

**Status:** **Done (2026-06-01)** — registry uses `customer-facing/PILOT_GUIDE.md` not stub; `product-documentation-registry.test.ts` rejects redirect-only primary sources.

**Objective:** Ensure product UI never links compatibility redirect stubs; resolve final canonical markdown internally.

**Scope:**

- Registry entries must not use stub-only files as rendered source (e.g. `docs/library/PILOT_GUIDE.md` → [`docs/library/customer-facing/PILOT_GUIDE.md`](customer-facing/PILOT_GUIDE.md) and/or merged `CORE_PILOT.md` sections).
- Add validation script or unit test that fails when a customer-facing registry entry points at a file whose H1/title matches “Moved —” or “redirect” without a resolved `canonicalSourcePath`.
- Update any remaining UI/doc-index references that still point at stub paths.

**Acceptance criteria:**

- Clicking pilot guide help from product UI never shows a four-line “Moved — pilot guide” page (in-app or external).
- Validation fails CI if a new stub is registered for operator/buyer audience.

**Refs:** **TB-144**, **TB-145**, `docs/library/PILOT_GUIDE.md`.

**Size estimate:** XS (~1–2 h).

---

## TB-147 — CI drift guard — no customer-facing GitHub blob links in product UI

**Status:** **Done (2026-06-01)** — `customer-facing-github-blob-guard.test.ts` scans operator/marketing surfaces with explicit allowlist.

**Objective:** Prevent regression of GitHub blob URLs into operator and marketing UI code paths.

**Scope:**

- Add lint script (Python or Node) scanning `archlucid-ui/src/app/(operator)/`, `archlucid-ui/src/app/(marketing)/`, `archlucid-ui/src/components/`, and selected `archlucid-ui/src/lib/` files for `github.com/.+/blob/` patterns.
- Allowlist: explicit developer/diagnostics modules, tests, comments marked `docs-source-only`, env examples.
- Wire into existing UI lint or docs CI gate (reuse pattern from **TB-134** / procurement validators where practical).

**Acceptance criteria:**

- Introducing a new unallowlisted GitHub blob href in operator/marketing UI fails CI with file path and matched URL.
- Existing known violations either fixed (**TB-145**) or temporarily allowlisted with TB reference and expiry note.

**Refs:** **TB-145**, **TB-134**, `scripts/procurement_pack_validation.py`.

**Size estimate:** S (~2–4 h).

---

## TB-148 — Role-gated optional “View source on GitHub” footer

**Status:** **Done (2026-06-01)** — `HelpTopicSourceFooter` on help topics (hidden in buyer-polished shell except developer audience).

**Objective:** Provide optional source transparency for admins/developers without making GitHub the primary documentation experience.

**Scope:**

- On in-app doc pages (**TB-143**), render a collapsed footer link “View source documentation” only when user is in admin/developer/diagnostics mode (reuse existing admin/diagnostics env or role signals — do not expose to buyer-polished shell).
- Footer link may point at registry `sourcePaths[0]` on GitHub for contributors; hidden entirely in buyer-polished operator shell.

**Acceptance criteria:**

- Buyer-polished deployments: no visible GitHub source link on help pages.
- Admin/configuration contexts: optional footer link present and correct.

**Refs:** **TB-143**, **TB-144**, `isBuyerPolishedOperatorShellEnv()`, `PRODUCT_DOCUMENTATION_PRESENTATION.md`.

**Size estimate:** XS (~1–2 h).

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

**Explicit limits:** The agent does **not** autonomously attack **archlucid.net** or Azure; **you** run tools in your environments and supply redacted logs or behaviour descriptions. Third-party vendor engagement is **V1.1 backlog** (**TB-136**), not a substitute for this owner-conducted V1 exercise.

**Size estimate:** Ongoing — budget **30–60 min sessions** per surface or CI failure cluster; close the item when the 2026-Q2 owner tracker is complete and posture text is updated.

---

## TB-007 — LLM correctness boundary: three remaining gaps after 2026-05-01 session

**Context:** The quality assessment sessions identified the LLM correctness boundary as the highest engineering risk. Three gaps were documented and partially addressed. The items below require either owner decisions or operational prerequisites before they can be closed.

### Gap A — Promote cohort-real-llm-gate to a required PR status check

**Status (2026-05-29):** **Local path shipped** for assessment improvement **#1** — `secrets/local-real-aoai.env` (gitignored), `scripts/Import-LocalRealAoaiEnv.ps1` (Foundry URL → classic host), `scripts/Invoke-RealLlmEvidenceGate.ps1` (topology-only profile), tolerant parsers (`AgentTypeJsonConverter`, `EvalCorpusFindingSeverityJsonConverter`), and `AzureOpenAiEndpointNormalizer` in `AzureOpenAiCompletionClient`. **CI promotion** remains blocked on owner task: Azure OpenAI golden-cohort deployment secrets / federated identity in the protected GitHub Environment. See **TB-138** and `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md` § 2 and § 6.

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
- [`docs/OPERATIONS_LLM_QUOTA.md`](OPERATIONS_LLM_QUOTA.md)
- [`docs/assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) — Improvement **#27** (implementation prompt)

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

**Status (2026-05-31):** **Done** — `IAgentExecutor` in Core; `AgentRuntime`/`Capabilities.Cost`/`Host.Core` do not reference `AgentSimulator`; composition-root binding + `DependencyConstraintTests` positive-list (`Host.Composition`, `*.Tests` only).

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

**Status (2026-05-31):** **Done** — `ArchLucid.Api.csproj` has no direct `Integrations.AzureExtractor` reference; wiring remains in `Host.Composition`; `Api_csproj_must_not_reference_Integrations_AzureExtractor_assembly` in `DependencyConstraintTests`.

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

**Status (2026-06-01):** **Done** — four project references in `ArchLucid.Architecture.Tests.csproj`; Tier-9 `DependencyConstraintTests` facts for Mcp, Integrations, Jobs.Cli, AgentSimulator allow-list, Api/AzureExtractor csproj guard; CI drift guard `test_invariant_wave_b_batch.py`.

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

**Status (2026-06-01):** **Done** — finding inspect + architecture risk register quick actions (`ItsmOutboundQuickActions`), correlation query API, duplicate outbound guard, browse URLs, risk-register `humanReviewStatus` + `itsmLinkedTicketsSummary` on `GET /v1/governance/architecture-risk-register`, and inbound sync label on finding inspect ITSM panel.

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

**Status (2026-05-31):** **Done** — `AzureSearchSdkClient` applies `AzureSearchTenantScopeFilterBuilder` on search/delete; registered when `Retrieval:AzureSearch:Endpoint` is set; `AzureSearchTenantScopeFilterBuilderTests`.

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

**Status (2026-05-31):** **Done** — `ScopeIdentityBindingMiddleware` + `ScopeIdentityBindingValidator`; ApiKey scope claims; `ScopeIdentityBindingIntegrationTests` / `ScopeIdentityBindingValidatorTests`.

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

**Status (2026-05-31):** **Done** — scoped repository reads + relational filters; `SqlFindingsSnapshotRepositoryScopeIsolationSqlIntegrationTests`; `ScopedSnapshotReadIdorIntegrationTests`.

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

**Status (2026-05-31):** **Done** — `RetrievalIndexingScopeValidator.ValidateDocuments` in `RetrievalIndexingService`; `InMemoryVectorIndex.RemoveChunksForDocumentAsync` scopes delete by tenant/workspace/project; `RetrievalIndexingScopeValidatorTests`.

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

**Status (2026-05-31):** **Done (V1 posture)** — `resolveProxyUpstreamScopeHeaders` strips client scope in production-like mode; env `ARCHLUCID_PROXY_*` trusted scope; `proxy-scope-resolution.test.ts`; sponsor value report resolves tenant from `/api/auth/me`. Full Entra cookie-bound SSR scope remains paired with **TB-072**.

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

**Status (2026-06-01):** **Done** — `ScopeContext` first parameter on `IAgentTaskRepository` / `IAgentResultRepository` / `IAgentExecutionTraceRepository` run-child reads; `RunChildRunScopeSql` joins `dbo.Runs`; callers + Cosmos stub updated; `RunChildRunScopeSqlTests`.

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

**Status (2026-06-01):** **Done** — `operator-resource-scope.ts`; run-detail project mismatch → not-found; required `runId` on disposition POST; decision register scoped by effective project; CI drift guard `test_tenancy_defense_batch.py`.

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

**Status (2026-06-01, Batch 5E):** **Done** — V1 matrix tests (persistence snapshot IDOR, API scope/IDOR, retrieval indexing + Azure Search filter); CI drift guard `test_cross_tenant_isolation_matrix_batch.py`; pen-test runbook cross-ref in [`2026-Q2-OWNER-CONDUCTED.md`](../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md).

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

**Status (2026-05-31):** **Done** — `AdoPullRequestMarkdownEscaper` (bullet escape, dangerous-content rejection, length cap, https/http link targets) used by compare + run-summary formatters; `AdoPullRequestMarkdownEscaperTests` / `AzureDevOpsRunSummaryMarkdownTests`.

**Source:** Secrets, identity, and tool-sandboxing audit (2026-05-27).

**Problem:**

`GoldenManifestCompareMarkdownFormatter.cs` (L34–36) echoes `SummaryHighlights` from the compare response verbatim into the Azure DevOps PR comment body. `AzureDevOpsRunSummaryMarkdown` similarly embeds `operatorRunDeepLink` into a Markdown link without format validation. If compare metadata or run configuration is poisoned (e.g. via a malicious architecture run, a compromised evidence package, or a supply-chain attack on the compare endpoint), arbitrary Markdown — including HTML rendered in ADO's PR UI — can appear in PR comment threads visible to all reviewers.

This is not a WIQL or API-injection path (no ADO query APIs are used in C#), but it is a reflected-content injection into a developer-facing surface with potential for phishing links or hidden instructions embedded in PR threads.

**What to do:**

1. In `GoldenManifestCompareMarkdownFormatter`, strip or escape `SummaryHighlights` through a static `SanitizeMarkdownLine(string)` helper that removes bare HTML tags, trims to a maximum safe length (e.g. 500 chars), and rejects strings containing `<script`, `javascript:`, or `data:` prefixes.
2. In `AzureDevOpsRunSummaryMarkdown`, validate `operatorRunDeepLink` / `StatusTargetUrl` against an allowlist of URL schemes (`https://` only) and hostname suffix (your own domain) before embedding run deep links in markdown summary output.
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

**Status (2026-05-31):** **Done** — `AzureOpenAI:AuthenticationMode=ManagedIdentity` registers completion, embedding, and semantic-judge clients via `DefaultAzureCredential`; `AzureOpenAiConfigurationProbe` + `CriticalConfigurationValidator` skip ApiKey when MI is set; `ProductionLikeSecretTransportConfigurationLint` advises on plaintext keys; `appsettings.KeyVault.sample.json` documents MI-first posture. Content Safety remains ApiKey/KV until a managed-identity guard ships.

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

**Status (2026-05-31):** **Done** — `ProductionSafetyRules.CollectAzureDevOpsArchLucidApiKeyKeyVaultReference`; `ProductionSecretSourceRulesTests`.

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

**Status (2026-05-31):** **Done** — `AgentTaskAllowedToolsDispatchGuard` in `RealAgentExecutorSingleHandlerExecution`; `AgentToolNotAllowedException`; `AgentTaskAllowedToolsDispatchGuardTests`.

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

**Status (2026-05-31):** **Done** — `ProductionSafetyRules.CollectIntegrationEventsServiceBusConnectionStringKeyVaultReference`; `ProductionSecretSourceRulesTests`.

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

**Status (2026-05-31):** **Done** — `HostedAzureExtractorGuidValidator` on collection request + ARM list path; `HostedAzureExtractorGuidValidatorTests`.

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

**Status (2026-06-01):** **Done** — `--batch-size`, `dbo.BackfillCheckpoints`, keyset paging via `SqlRelationalBackfillPagedEntityLoader` / `SqlRelationalBackfillStageProcessor`; documented in [`SqlRelationalBackfill.md`](SqlRelationalBackfill.md).

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

**Status (2026-06-01):** **Done** — `dbo.BackfillFailures`, `--max-retries`, `--force-retry`, `SkippedQuarantinedCount` on report + JSON; integration test in `SqlRelationalBackfillServiceSqlIntegrationTests`.

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

**Status (2026-06-01):** **Done** — migration **229** `UQ_FindingRecords_Snapshot_FindingId`; service relies on `SqlFindingsSnapshotRepository.BackfillRelationalSlicesAsync` inside one transaction (no separate service-level COUNT).

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

**Status (2026-06-01):** **Done** — per-tenant try/catch in `TrialLifecycleArchLucidJob`; `AdvisoryDueScheduleProcessResult` + non-zero exit when any schedule failed; documented in [`CONTAINER_APPS_JOBS.md`](../runbooks/CONTAINER_APPS_JOBS.md).

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

**Status (2026-06-01):** **Done** — `TryRecordSentAsync` precedes `SendAsync` in exec + weekly executive dispatchers; `DigestEmailDispatcherIdempotencyTests`; runbook note in [`CONTAINER_APPS_JOBS.md`](../runbooks/CONTAINER_APPS_JOBS.md).

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

**Status (2026-05-31):** **Done** — `SqlRelationalBackfillStageRunner` records per-stage `ElapsedMilliseconds` and delta counts; `--output-json [path]` writes `archlucid.backfill.cli.report.v1` to stdout or file; documented in `SqlRelationalBackfill.md`; `BackfillCliJsonReportSerializerTests`, `SqlRelationalBackfillStageRunnerTests`.

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

**Status (2026-06-01):** **Done** — `azurerm_private_dns_zone` + VNet link + `azurerm_private_endpoint` for `privatelink.vaultcore.azure.net` when `enable_private_data_plane` and `key_vault_id` are set; `key_vault_private_endpoint_id` output; ARM ID check in `checks.tf`; documented in `terraform.tfvars.example` and `README.md`.

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

**Status (2026-06-01):** **Done** — `azurerm_role_assignment` **Key Vault Secrets User** in `infra/terraform-keyvault/workload_rbac.tf` when `enable_key_vault` and principal ID vars are set; `infra/terraform-private/keyvault_rbac.tf` for `key_vault_workload_principal_ids` on `var.key_vault_id`; `infra/apply-saas.ps1` second pass after Container Apps; `infra/terraform-keyvault/terraform.tfvars.example`; docs in `CONFIGURATION_KEY_VAULT.md`, `REFERENCE_SAAS_STACK_ORDER.md`, `IAC_RUNTIME_PARITY.md`.

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

## TB-093 --- Compose Azure OpenAI into hosted Terraform stack

**Status (2026-06-01):** **Done** — Default `openai_compose_mode = existing` in `deploy/hosted-prod-terraform` with consumed account/deployment variables, `eastus` region check, `azure_openai_container_app_env` output, workload **Cognitive Services OpenAI User** RBAC; `infra/terraform-container-apps/azure_openai.tf` wires `AzureOpenAI__*` env + API/Worker role assignments; `infra/terraform-openai` consumed contract outputs; `terraform-pilot` marks OpenAI `pilot_essential` for real-mode pilots. Platform subscription owns deployments, filters, quota, CMK, and private endpoint outside these roots.

**Source:** IaC parity audit (2026-05-27). Canvas: `canvases/iac-parity-audit.canvas.tsx`.

**Problem:**

`terraform-openai/main.tf` explicitly states the Azure OpenAI resource "may be out-of-band" and only manages a consumption budget. The Cognitive Services account itself (`Microsoft.CognitiveServices/accounts`), model deployments (completion, embedding), content filter policies, CMK configuration, private endpoint, and diagnostic settings are all managed outside Terraform. `ArchLucid.AgentRuntime` and `ArchLucid.Retrieval` both depend on this service at runtime (`Azure.AI.OpenAI` NuGet, `AzureOpenAI` config section). Any quota change, model version bump, or capacity reconfiguration done in the portal cannot be reviewed as code or reproduced automatically. Cross-ref **TB-080** (migrate from API key to `DefaultAzureCredential` --- the hosted stack must emit the endpoint so the app can be switched to managed identity auth).

**Owner decision (2026-06-01):** Production-like hosted Terraform should **consume pre-existing Azure OpenAI resource/deployment IDs**, not create Azure OpenAI in the hosted root. The first production-like pilot region is **US East**. A separate `terraform-openai` root can remain as a validation or module-staging surface, but it should not be required by the default production-like operator path.

**What to do:**

1. Add hosted-stack variables for pre-existing Azure OpenAI account ID, endpoint, completion deployment name, embedding deployment name, and expected region.
2. Validate/document the **US East** default pilot region and fail or warn when the supplied account region does not match the selected production-like pilot region.
3. Wire endpoint/deployment variables into API/worker app settings for managed identity auth.
4. Add or document required RBAC assignments for API and Worker managed identities against the pre-existing account.
5. Document how the platform subscription owns model deployment lifecycle, content filters, quota, CMK, and private endpoint when those are managed outside the hosted root.
6. Update `infra/terraform-pilot/main.tf` `nested_infrastructure_roots` or equivalent pilot docs to mark Azure OpenAI as a required consumed dependency for real-mode pilots.

**Acceptance criteria:**

- Hosted-stack `terraform validate` accepts the consumed Azure OpenAI resource/deployment variables and exposes them to app configuration.
- Endpoint output is consumed by the API/worker app settings, replacing hard-coded API key config where managed identity is selected.
- Docs distinguish consumed-resource responsibilities from anything still managed in `terraform-openai`.
- No Terraform root creates a second production-like Azure OpenAI account by accident.

**Affected files / projects:**

- `infra/terraform-openai/main.tf`, `variables.tf`, `outputs.tf` (module/validation staging as needed)
- `infra/terraform/prod`
- `infra/terraform-pilot/main.tf` (pilot_essential flag)

**Cross-ref:** **TB-080** (Entra auth migration), **TB-091** (private endpoint pattern), **TB-092** (managed identity chain).

**Size estimate:** **M** --- ~8--16 h.

---

## TB-094 --- Create `terraform-redis` root --- Azure Cache for Redis hot-path cache

**Status (2026-06-01):** **Done** — New root `infra/terraform-redis` (`azurerm_redis_cache`, TLS 1.2, `non_ssl_port_enabled = false`, optional PE/DNS/diagnostics/Key Vault secret); outputs `redis_primary_connection_string` and `hot_path_cache_container_app_secret_env`; `infra/terraform-container-apps` wires `HotPathCache__RedisConnectionString` via secret; pilot + `apply-saas.ps1` order updated.

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

**Status:** **Done** (2026-06-01). Assessment: Cosmos is **dormant** on production-like pilots; `infra/terraform-cosmos/` codifies optional SQL API account + containers (including `audit-events-leases`) + PE/diagnostics/KV secret. NuGet remains scoped to `ArchLucid.Persistence` only.

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

## TB-096 --- Compose Azure AI Search existing-resource consumption into hosted Terraform stack

**Status:** **Done** (2026-06-01). `search_compose_mode = existing` default; `search_consumed.tf` / outputs / `azure_search_*` in container-apps; `docs/library/AZURE_AI_SEARCH_CONSUMED.md`.

**Source:** IaC parity audit (2026-05-27). Canvas: `canvases/iac-parity-audit.canvas.tsx`.

**Problem:**

`ArchLucid.Retrieval` references `Azure.Search.Documents` (v11.6.0) and `appsettings.Advanced.json` sets `Retrieval.Reranking.Provider = "AzureAiSearchSemantic"`. `terraform-private/network.tf` already accepts `var.search_service_id` and will create a private endpoint and DNS zone for `privatelink.search.windows.net` if provided --- but the Azure AI Search service itself is never created by any Terraform root. SKU, replica count, semantic ranking configuration, and network rules are entirely portal-managed. Cross-ref **TB-071** (production search client registration gap).

**Owner decision (2026-06-01):** Production-like hosted Terraform should **consume a pre-existing Azure AI Search resource ID**, not create Azure AI Search in the hosted root. The first production-like pilot region is **US East**.

**What to do:**

1. Add hosted-stack variables for pre-existing Azure AI Search service ID, endpoint, index name, semantic configuration name, and expected region.
2. Validate/document the **US East** default pilot region and fail or warn when the supplied Search service region does not match the selected production-like pilot region.
3. Feed `search_service_id` directly into `terraform-private` private endpoint wiring when private networking is enabled.
4. Wire endpoint/index variables into API/worker app settings and startup readiness checks.
5. Add or document required RBAC/API-key posture and diagnostic-setting ownership for the pre-existing service.
6. Update pilot docs to make Azure AI Search a required consumed dependency when production-like retrieval is enabled.

**Acceptance criteria:**

- Hosted-stack `terraform validate` accepts the consumed Azure AI Search resource variables and feeds `var.search_service_id` into `terraform-private`.
- Production-like app configuration has endpoint/index/semantic settings without manual portal-only copy steps.
- Docs state what the platform-owned Search resource must already provide: SKU, semantic ranking, networking, diagnostics, and access policy.
- No Terraform root creates a second production-like Azure AI Search service by accident.

**Affected files / projects:**

- `infra/terraform/prod`
- `infra/terraform-search/` (optional module/validation staging surface)
- `infra/terraform-private/network.tf`, `variables.tf`
- `infra/terraform-pilot/main.tf`

**Cross-ref:** **TB-071** (production search client registration), **TB-091** (private endpoint pattern).

**Size estimate:** **S** --- ~4--8 h.

---

## TB-097 --- Create `terraform-acr` root --- Azure Container Registry

**Status:** **Done** (2026-06-01). `infra/terraform-acr/` with optional PE/diagnostics; pilot-essential ordering before container-apps.

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

**Status:** **Done** (2026-06-01). `azurerm_monitor_workspace.prometheus` + `azure_monitor_workspace_id_effective` for Prometheus rule scopes.

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

**Status:** **Done** (2026-06-01). `diagnostics.tf` in container-apps, servicebus, storage (opt-in flags); hosted `platform_diagnostics.tf` for cross-root handoff.

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

**Status:** **Done** (2026-06-01, platform-constrained). `logic_app_storage_rbac.tf` grants **Storage Blob Data Owner** + **Storage File Data SMB Share Contributor** per Logic App on its hosting storage (`logic_app_storage_use_managed_identity` default true). `storage_account_access_key` remains on `azurerm_logic_app_standard` because Azure still requires `WEBSITE_CONTENTAZUREFILECONNECTIONSTRING` on standard plans — see `infra/terraform-logicapps/README.md`.

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

**Status:** **Done** (2026-06-01). Variable `application_insights_sampling_percentage` (default 100) replaces hardcoded literal in `application_insights.tf`.

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

**Status (2026-05-31):** **Done** — `ExecutiveOrphanCandidateKpiCalculator` + `orphanCandidates` on `ExecutiveRoiSummaryResponse`; `ExecutiveOrphanCandidatesCard` reads API only; orphan heuristics removed from `run-potential-savings-parser.ts` (run detail uses cost artifact only).

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

**Status (2026-05-31):** **Done** — `GovernanceWaiverExpiryWindow` + `ExpiringWaiversCount14Days` on ROI; dashboard uses `waiversExpiringWithin14Days`; `ExecutiveReviewPacketPortfolioSignalsFactory` maps ROI expiring count (not `ActiveWaiversCount`).

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

**Cross-ref:** **TB-062** (executive dashboard live KPI replacement); **TB-057** (governance stickiness review packet); **TB-149** (canonical window — supersedes duplicate `CountExpiringWaivers` logic); **TB-155** (cached ROI vs live decisions-needed).

**Size estimate:** **S** — ~4–6 h (backend field population + UI simplification + tests).

---

## TB-105 — Business-impact category buckets — add pre-bucketed counts to `ExecutiveRoiSummaryResponse`; remove substring matcher

**Status (2026-05-31):** **Done** — six pillars (`Security`, `Compliance`, `Reliability`, `Cost`, `Governance`, `Other`) via `ExecutiveBusinessImpactPillarMatchers` + classifier; widget + `StaleArchitectureRiskCount` on ROI aligned with decisions-needed and review packet.

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

## TB-149 — Canonical 14-day expiring-waiver window — single server implementation

**Status (2026-05-31):** **Done** — `GovernanceWaiverExpiryWindow.CountExpiringWithinDays` (`[now, now+14d]` UTC inclusive); `ExecutiveRoiSummaryService.CountExpiringWaivers` removed; composer + ROI share helper; unit tests in `GovernanceWaiverExpiryWindowTests`.

**Source:** Cross-layer data consistency audit (2026-05-31). Extends **TB-104**.

**Problem:**

Two server paths compute “waivers expiring within 14 days” with **different predicates**:

- `ExecutiveRoiSummaryService.CountExpiringWaivers` — `ExpiresAtUtc <= now.AddDays(14)` with **no lower bound** (includes already-expired rows that missed `MarkExpiredAsync`).
- `GovernanceDigestDecisionNeededComposer.BuildSummaryAsync` — `ExpiresAtUtc >= now && ExpiresAtUtc <= now.AddDays(14)` (correct inclusive window).

The dashboard prefers `summary.expiringWaiversCount14Days` from the ROI endpoint when present (`??` only falls back when null), so the tile routinely shows the ROI count, not the decisions-needed count.

**What to do:**

1. Extract one shared helper (e.g. `GovernanceWaiverExpiryWindow.CountWithinDays(activeWaivers, nowUtc, days: 14)`) with documented UTC inclusive bounds `[now, now+14d]`.
2. Delete `ExecutiveRoiSummaryService.CountExpiringWaivers`; populate `ExpiringWaiversCount14Days` from the shared helper (or delegate to `IGovernanceDigestDecisionNeededComposer` / shared service).
3. Update `ExecutiveRoiDashboardLiveKpiCards.tsx` to read **only** `decisionsNeeded.waiversExpiringWithin14Days` or a single ROI field sourced from the same helper — remove dual-source `??` when both are populated.
4. Unit tests: expired yesterday excluded; expires exactly at `now+14d` included; expires at `now+14d+1s` excluded.

**Acceptance criteria:**

- ROI summary, decisions-needed summary, digest markdown buckets, and dashboard tile agree for the same tenant snapshot.
- No production code path uses `ExpiresAtUtc <= cutoff` without `>= now`.

**Affected files:**

- `ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs`
- `ArchLucid.Application/Governance/GovernanceDigestDecisionNeededComposer.cs`
- `archlucid-ui/src/app/(operator)/dashboard/_sections/ExecutiveRoiDashboardLiveKpiCards.tsx`
- `ArchLucid.Application.Tests/Governance/` or `ArchLucid.Application.Tests/Roi/`

**Cross-ref:** **TB-104**, **TB-155**, **TB-062**.

**Size estimate:** **S** (~4–6 h).

---

## TB-150 — Decisions-needed `TotalDecisionItems` — union cardinality, not sum

**Status (2026-05-31):** **Done** — `GovernanceDecisionsNeededSummaryCalculator.ComputeTotalDecisionItems` (distinct finding union + pending approvals); contract XML on `TotalDecisionItems`; unit tests.

**Source:** Cross-layer data consistency audit (2026-05-31).

**Problem:**

`GovernanceDigestDecisionNeededComposer.BuildSummaryAsync` sets:

```csharp
int total = pending.Count + staleCount + unownedHighCount + needsEvidenceCount + deferredDueCount + waiversExpiringCount;
```

A single `FindingId` can satisfy multiple buckets (e.g. stale risk register entry + `NeedsEvidence` disposition + expiring waiver). The **Decisions needed** dashboard KPI (`totalDecisionItems`) therefore **overcounts** distinct work items.

**What to do:**

1. Build a `HashSet<string>` (or `HashSet<Guid>` if finding IDs are normalized) of finding-linked identifiers per bucket; approvals pending may remain a separate non-finding count.
2. Set `TotalDecisionItems = approvalPendingCount + distinctFindingUnion.Count` (document whether approvals without a finding id are always additive).
3. Optionally expose per-bucket counts unchanged for drill-down; only fix the total.
4. Add unit tests: one finding in two buckets → total increments by 1, not 2.

**Acceptance criteria:**

- `GET /v1/governance/decisions-needed-summary` total matches manual union count for fixture data.
- Digest markdown section headings unchanged; only aggregate total semantics fixed.

**Affected files:**

- `ArchLucid.Application/Governance/GovernanceDigestDecisionNeededComposer.cs`
- `ArchLucid.Contracts/Governance/GovernanceDecisionsNeededSummaryResponse.cs` (XML doc on `TotalDecisionItems`)
- `ArchLucid.Application.Tests/Governance/`

**Cross-ref:** **TB-062**, **TB-060** (decision register).

**Size estimate:** **S** (~4–6 h).

---

## TB-151 — `ExecutiveSummaryResult.TotalRiskReductionScore` — semantic fix

**Status (2026-05-31):** **Done** — `TotalRiskReductionScore` maps to `ResolvedFindingsCount30Days`; added `PendingGovernanceDecisionCount` on `ExecutiveSummaryResult`; `ExecutiveReportsSummaryServiceTests`.

**Source:** Cross-layer data consistency audit (2026-05-31).

**Problem:**

`ExecutiveReportsSummaryService` maps `TotalRiskReductionScore = decisions.TotalDecisionItems`. Higher pending governance load **increases** a field named as if risk were **reduced**. PDF/export or partner integrations that consume `ExecutiveSummaryResult` may mis-rank tenants.

**What to do (pick one, document in OpenAPI):**

1. **Rename** to `PendingGovernanceDecisionCount` (breaking — coordinate OpenAPI snapshot + consumers), or
2. **Repurpose** `TotalRiskReductionScore` to a metric that increases with risk reduced (e.g. `ResolvedFindingsCount30Days` from ROI), and add `PendingGovernanceDecisionCount` for the burden metric.

**Acceptance criteria:**

- No field name implies “reduction” while monotonically increasing with outstanding decisions.
- `ExecutiveSummaryController` response documented in contract snapshot.

**Affected files:**

- `ArchLucid.Application/Reports/ExecutiveReportsSummaryService.cs`
- `ArchLucid.Contracts` / reports DTOs
- OpenAPI snapshot + `archlucid-ui` types if exposed

**Cross-ref:** **TB-062**.

**Size estimate:** **XS** (~2–3 h).

---

## TB-152 — `ExecutiveSummaryResult.CostWasteUsd` — stop aliasing savings

**Status (2026-05-31):** **Done** — `ExecutiveReportsSummaryService` sets `CostWasteUsd: null`; `ExecutiveReportsSummaryServiceTests` asserts separation from `TotalEstimatedUsdSavings`.

**Source:** Cross-layer data consistency audit (2026-05-31).

**Problem:**

`ExecutiveReportsSummaryService` sets `CostWasteUsd = roi.TotalEstimatedUsdSavings`. Current monthly waste and estimated recoverable savings are related but not identical; a future ROI field split would silently desync exports.

**What to do:**

1. If no authoritative waste metric exists, **omit** `CostWasteUsd` from the live mapper (null) and document in contract, or remove the property from v1 export surface.
2. When Azure cost extractor exposes monthly run-rate waste, map that field explicitly; keep `TotalEstimatedUsdSavings` separate.

**Acceptance criteria:**

- No two differently named properties return the same value without an explicit comment in the contract that they are intentionally equal for V1.

**Affected files:**

- `ArchLucid.Application/Reports/ExecutiveReportsSummaryService.cs`
- Executive summary contract types

**Cross-ref:** **TB-062**, FinOps ROI contracts.

**Size estimate:** **XS** (~1–2 h).

---

## TB-153 — Recurring architecture review trigger — idempotency before execute

**Status (2026-05-31):** **Done** — `RecurringArchitectureReviewTriggerService` persists `LastTriggeredRunId` + advanced `NextRunUtc` immediately after `CreateRunAsync`, before `ExecuteRunAsync`; failure before checkpoint still advances `NextRunUtc` in catch. Unit test asserts `create` → `update` → `execute` order.

**Source:** Cross-layer data consistency audit (2026-05-31). Cross-ref **TB-062**, **TB-012** (**INV-009**).

**Problem:**

`RecurringArchitectureReviewTriggerService.TriggerScheduleAsync` order: `CreateRunAsync` → `ExecuteRunAsync` → `scheduleRepository.UpdateAsync` (advance `NextRunUtc`). If the host process dies after create but before update, the next poll treats the schedule as still due and creates a **second run** for the same period. Explicit exceptions advance `NextRunUtc` in the catch block; **OOM / ACA eviction** does not.

**What to do:**

1. **Preferred:** Persist `LastTriggeredUtc`, `LastTriggeredRunId`, and advanced `NextRunUtc` in one transaction **immediately after** `CreateRunAsync` (status `Queued`), then call `ExecuteRunAsync` asynchronously or in-process.
2. **Defense in depth:** At schedule entry, skip if `LastTriggeredUtc` is within the current cron window and `LastTriggeredRunId` is non-null.
3. **Optional DDL:** Unique constraint on `(ScheduleId, TargetWindowUtc)` or provenance column on `RunRecord` for recurrence clone source + window.

**Acceptance criteria:**

- Simulated crash after create, before execute: second poll does not create another run for the same window.
- Audit `ArchitectureReviewRecurrenceTriggered` still emitted once per successful window.

**Affected files:**

- `ArchLucid.Application/Governance/RecurringArchitectureReviewTriggerService.cs`
- `ArchLucid.Persistence/Governance/DapperArchitectureReviewRecurrenceScheduleRepository.cs`
- `ArchLucid.Host.Core/Hosted/ArchitectureReviewRecurrenceDueScheduleProcessor.cs`
- Migration + `ArchLucid.Persistence/Scripts/ArchLucid.sql` if unique constraint added

**Size estimate:** **M** (~1–2 days).

---

## TB-154 — Waiver ↔ disposition state machine — bidirectional invariants

**Status (2026-05-31):** **Done (V1 strict create/renew)** — `RiskExceptionDispositionGuard` blocks waivers when latest disposition is `Remediated`; `ArchitectureRiskRegisterStaleEvaluator` in Core suppresses stale signal under active waiver; register reader uses shared evaluator. Expiry disposition events remain V1.1 optional.

**Source:** Cross-layer data consistency audit (2026-05-31).

**Problem:**

`RiskExceptions` and `FindingReviewEvents` are independent tables. Observed gaps:

- **A:** Active waiver on a finding with latest disposition `Remediated`.
- **B:** Waiver expires via `MarkExpiredAsync` without a disposition event reopening governance narrative.
- **C:** Risk register `IsStale` ignores active waiver — same finding contributes to stale-risk and expiring-waiver buckets (**TB-150** makes this worse).

**What to do:**

1. On waiver create/renew: reject or warn if latest disposition is `Remediated` (configurable strictness).
2. On waiver expiry audit: optionally append informational `FindingReviewEvent` or register flag (product decision).
3. In risk register staleness and decisions-needed stale bucket: exclude findings with non-expired active waiver.
4. Integration tests for scenarios A–C.

**Acceptance criteria:**

- No finding appears as both “stale risk” and “covered by active waiver” in `BuildSummaryAsync` for the same snapshot.
- Documented operator behavior when renewing waiver on remediated finding.

**Affected files:**

- `ArchLucid.Application/Governance/RiskExceptionService.cs`
- `ArchLucid.Application/Governance/GovernanceDigestDecisionNeededComposer.cs`
- Architecture risk register builder/service
- `ArchLucid.Application.Tests/Governance/`

**Cross-ref:** **TB-059**, **TB-150**, **TB-058**.

**Size estimate:** **M** (~1–2 days).

---

## TB-155 — ROI cache vs live decisions-needed — canonical expiring-waiver source

**Status (2026-05-31):** **Done** — `CachingExecutiveRoiSummaryService` refreshes `ExpiringWaiversCount14Days` on every read; dashboard tile uses `waiversExpiringWithin14Days` only (no ROI `??` fallback).

**Source:** Cross-layer data consistency audit (2026-05-31). Extends **TB-104**, **TB-149**.

**Problem:**

`CachingExecutiveRoiSummaryService` can serve `ExpiringWaiversCount14Days` up to the configured TTL (hours). `getGovernanceDecisionsNeededSummary()` is uncached. The dashboard parallel-fetch uses ROI value when non-null, so expiring-waiver tile can lag decisions-needed by TTL after waiver create/renew/revoke.

**What to do:**

1. After **TB-149**, stop populating `ExpiringWaiversCount14Days` on cached ROI responses (always compute at read time in decorator, or remove field from cached payload).
2. Alternatively: invalidate ROI cache keys on `RiskExceptionCreated|Renewed|Revoked|Expired` audit events.
3. Dashboard: single source — `waiversExpiringWithin14Days` only.

**Acceptance criteria:**

- Create waiver → refresh dashboard within one request cycle: expiring count matches decisions-needed without waiting for ROI TTL.

**Affected files:**

- `ArchLucid.Application/Roi/CachingExecutiveRoiSummaryService.cs` (if present)
- `ExecutiveRoiDashboardLiveKpiCards.tsx`
- Cache invalidation hook in governance mutating endpoints

**Cross-ref:** **TB-149**, **TB-104**, **TB-062**.

**Size estimate:** **S** (~4–6 h).

---

## TB-156 — `start-local-api-and-ui.ps1` — strict preflight + UI proxy E2E gate

**Status (2026-05-31):** **Done** — preflight (toolchain, node_modules, port/env alignment), `/health/live` + `/health/ready`, UI root, blocking `GET /api/proxy/health/live` before browser; `-SkipPreflight`, `-EnsureSql`.

**Priority:** **P0** — pick up in the next available thread (local dev blocker; misleads every contributor who starts UI without a healthy API chain).

**Source:** Local dev triage (2026-05-31). Symptom: operator UI loads but repeated Sonner warnings; root cause was API not listening on configured port while script had already opened the browser.

**Problem:**

`scripts/start-local-api-and-ui.ps1` waits for `GET /health/ready` on ArchLucid.Api and for the UI root (`GET /`) to return 200. Neither proves **browser → Next.js → `/api/proxy/*` → API**. The homepage can load while every proxied API call returns **502 Upstream API unreachable**. The script exits success and opens the browser anyway.

Additional gaps: no preflight for toolchain, `node_modules`, port conflicts, or **`archlucid-ui/.env.local`** `ARCHLUCID_API_BASE_URL` port alignment with `-ApiPort` (5128 native vs 5000 Docker demo).

**What to do:**

1. **Preflight (fail fast):** `dotnet` + `node` present; `archlucid-ui/node_modules` exists (hint `npm ci`); optional `-SkipPreflight` for warm repeats; ports `$ApiPort` / `$UiPort` free or already serving expected health URLs.
2. **Config validation:** read `.env.local` (or `.env.example` fallback warning); assert `ARCHLUCID_API_BASE_URL` host/port matches `-ApiPort` (default 5128); do **not** auto-edit — print expected vs actual and exit non-zero.
3. **API ready (keep + extend):** `GET /health/live` then `/health/ready`; on ready failure, optionally surface first unhealthy check name from JSON for IT audience.
4. **UI ready (keep):** UI root responds.
5. **End-to-end gate (new, blocking):** `GET http://127.0.0.1:$UiPort/api/proxy/health/live` must return **200** before opening browser. On failure, exit **non-zero** with structured output:
   - direct API probe result
   - proxy probe result + HTTP status
   - resolved `ARCHLUCID_API_BASE_URL`
   - next steps + doc links: [`TROUBLESHOOTING.md`](../runbooks/TROUBLESHOOTING.md), [`OPERATOR_QUICKSTART.md`](customer-facing/OPERATOR_QUICKSTART.md)
   - optional hint: `dotnet run --project ArchLucid.Cli -- doctor`
6. **Optional switches:** `-EnsureSql` → `dev up --sql-only` (default off); `-NoBrowser` unchanged.
7. Reuse patterns from `scripts/env-readiness.ps1`, `scripts/demo-start-local.ps1`, `scripts/v1-rc-drill.ps1` where practical — avoid duplicating probe logic.

**Acceptance criteria:**

- With API stopped: script exits non-zero; browser not opened; stderr names failed stage (`proxy-chain` or equivalent).
- With API on 5128 and matching `.env.local`: script exits 0; proxy health check passes; browser opens (unless `-NoBrowser`).
- With `.env.local` pointing at 5000 while `-ApiPort 5128`: script fails at config phase with clear port mismatch message.
- Header comment documents native (5128) vs Docker demo (5000) port table.

**Affected files:**

- `scripts/start-local-api-and-ui.ps1`
- Optional cross-link in `docs/library/customer-facing/OPERATOR_QUICKSTART.md` or `docs/runbooks/TROUBLESHOOTING.md` (one line only — no new doc file required)

**Cross-ref:** **TB-157** (in-app toast copy); `archlucid-ui/src/app/api/proxy/[...path]/route.ts`; `archlucid-ui/.env.example`.

**Size estimate:** **S** (~4–8 h).

---

## TB-157 — API connectivity toasts — accurate API-down vs assistant-stream messaging

**Status (2026-05-31):** **Done** — `classifyApiConnectivityFailure` routes 502/upstream to **ArchLucid API unreachable**, 503 misconfig, UseStream to assistant; tests in `api-error-toast-policy.test.ts`.

**Priority:** **P0** — pick up in the next available thread (same local-dev incident cluster as **TB-156**; can ship independently but pair for best UX).

**Source:** Local dev triage (2026-05-31). `resolveApiRequestErrorToastPlan` treats any connectivity-shaped 5xx as “Review assistant unavailable / AI assistant service is not reachable”, including proxy **502 Upstream API unreachable** when ArchLucid.Api is down.

**Problem:**

`archlucid-ui/src/lib/api-error-toast-policy.ts` — `isConnectivityOrAssistantFailure` buckets UseStream, fetch failed, upstream unreachable, etc. into one assistant-focused toast. IT-savvy local operators misdiagnose API/proxy/config failures as Azure OpenAI / Ask outages. Local dev defaults to **Simulator**; conflating API down with LLM down is incorrect.

**What to do:**

1. Replace `isConnectivityOrAssistantFailure` with a classifier (e.g. `classifyApiConnectivityFailure(message, httpStatus, problem?)`) that returns distinct toast plans:
   - **“Upstream API unreachable”** / proxy 502 → title **ArchLucid API unreachable**; detail: proxy could not reach backend; verify API process and `ARCHLUCID_API_BASE_URL`; link or cite `docs/runbooks/TROUBLESHOOTING.md`.
   - **503 + invalid upstream config** → **API URL not configured**; set `ARCHLUCID_API_BASE_URL` in `.env.local`; restart `npm run dev`.
   - **UseStream** / Ask SSE path only → keep **Review assistant unavailable** (stream endpoint failed; core navigation may still work).
   - Generic fetch/network → **Cannot reach ArchLucid API** (include correlation id when present).
2. Prefer `problem.supportHint` from proxy Problem Details when present (`route.ts` already emits hints).
3. Severity: **warning** for 502/API down (degraded shell); **error** for 503 misconfiguration (optional — document choice in tests).
4. **Buyer-polished / demo shell:** keep suppressing connectivity toasts (`buyerPolishedShell` path unchanged).
5. Update `api-error-toast-policy.test.ts`; grep for stale “AI assistant service is not reachable” expectations.

**Acceptance criteria:**

- Simulated `ApiRequestError` with message `Upstream API unreachable: fetch failed` and status 502 → toast title mentions **API**, not assistant.
- UseStream-only failure → assistant wording retained.
- Buyer-polished shell still suppresses connectivity failures.
- No change to non-connectivity 5xx (“Server error” + detail) behavior.

**Affected files:**

- `archlucid-ui/src/lib/api-error-toast-policy.ts`
- `archlucid-ui/src/lib/api-error-toast-policy.test.ts`
- Optional: `archlucid-ui/src/lib/api-load-failure.ts` (align transient messaging if duplicated)

**Cross-ref:** **TB-156**; `archlucid-ui/src/lib/api/http.ts` (`throwApiRequestError`); proxy `supportHint` in `archlucid-ui/src/app/api/proxy/[...path]/route.ts`.

**Size estimate:** **XS** (~2–4 h).

---

## TB-106 — RunDetailPageView — enrich authority `RunDetailDto` with cost estimate, trust evidence card, and `results[]`

**Status (2026-05-31):** **Done** — `IAuthorityRunDetailOperatorEnricher` / `AuthorityRunDetailOperatorEnricher` invoked from `AuthorityQueryController.GetRunDetail`; `AuthorityRunDetailOperatorEnricherTests`; quick-decision shows explicit explanation-trace fallback when `results[]` empty.

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

**Status (2026-05-31):** **Done** — `RunDetailGovernanceAlerts` (warnings + last failure); `RunDetailRunMetadataSection` shows `retryCount` when &gt; 0; `RunDetailGovernanceAlerts.test.tsx` + metadata section tests.

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

**Status (2026-05-31):** **Done** — `FindingCoverageDispositionPanel` in `RunDetailOutcomeCards`; `commitBlockedReason` blocks commit UX; `RunDetailOutcomeCards.test.tsx`.

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

**Status (2026-05-31):** **Done** — `GET /v1/authority/runs/{runId}/retrieval-grounding` + `RunDetailRetrievalGroundingSection` (collapsed) after explanation; faithfulness banner links `#run-retrieval-grounding`; forensics duplicate panel removed.

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

**Status (2026-06-01):** **Done** — structured `AgentToolInvocationRecords` ledger at trace write; `GET …/tool-invocation-forensics` prefers ledger rows; run-detail panel with execute-gated **View raw** inline preview from persisted trace rows (redacted, truncated). Blob-only full text remains in durable storage when inline persistence failed.

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

**Status (2026-06-01):** **Done** — `RunDetailProvenanceSummaryCard` on run detail (snapshot + architecture request IDs, link to full provenance route); no extra fetch.

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

**Status (2026-06-01):** **Done** — `POST /v1/authority/runs/{runId}/disposition`, `RunOperatorGovernanceDispositionService`, run columns on `dbo.Runs`, audit event, operator-only `RunDetailRunGovernanceDispositionActions` with approve gated on `hasCommitBlockingFailures`.

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

**Status (2026-06-01):** **Done** — OpenAPI snapshot includes ITSM correlations GET, tool-invocation-forensics, and `RunFindingCoverageSummary`; `api-types.generated.ts` regen; `authority.ts` uses schema types.

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

## TB-114 — Establish enterprise design-token layer (Carbon-aligned neutral palette and accent scale)

**Status (2026-05-31):** **Done** — `design-tokens.ts`, `--al-*` in `globals.css`, Tailwind `al-*` colors, `UI_DESIGN_SYSTEM.md` §Tokens. Operator surface migration completed in **TB-115**.

**Source:** Owner-ratified UI design standard, 2026-05-27. Canonical doc: [`docs/library/UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md).

**Problem:**

The current UI inherits Tailwind's default palette and shadcn component defaults. The result is `teal-500` borders, `neutral-100` card backgrounds, and accent colors with a startup-dashboard feel rather than a Carbon-grade enterprise visual language. There is no single place that defines the ArchLucid surface palette — changes to brand-significant tokens scatter across dozens of component files.

**What to do:**

1. Create `archlucid-ui/src/lib/design-tokens.ts` (or a CSS custom-properties file) that declares the authoritative token set:
   - **Neutral surface scale:** `--al-surface-base`, `--al-surface-raised`, `--al-surface-overlay` — mapped to Carbon's `$layer-01` / `$layer-02` semantics (cool gray range: `gray-50` → `gray-100` for light mode).
   - **Accent:** a single restrained teal (`teal-700` / `teal-800`) with clearly named roles (`--al-accent-interactive`, `--al-accent-border-focus`). Eliminate free-form teal use elsewhere.
   - **Status semantic tokens:** `--al-status-ready`, `--al-status-warn`, `--al-status-blocked`, `--al-status-approved`, `--al-status-approved-monitoring` — each with a background, foreground, and border variant.
   - **Text hierarchy:** `--al-text-primary`, `--al-text-secondary`, `--al-text-placeholder`, `--al-text-disabled`.
2. Update `tailwind.config.ts` to extend Tailwind's theme with these tokens, so component files use semantic names (`text-al-text-secondary`) rather than raw palette positions (`text-neutral-500`).
3. Document the token map in `docs/library/UI_DESIGN_SYSTEM.md` §Tokens.

**Acceptance criteria:**

- Design token file exists and is the single source of truth for surface, accent, status, and text colors.
- `tailwind.config.ts` exposes the tokens as Tailwind utilities.
- No component file hardcodes a raw palette value that contradicts the token set.
- Light and dark mode both have token-mapped values.

**Affected files / projects:**

- `archlucid-ui/src/lib/design-tokens.ts` (new)
- `archlucid-ui/tailwind.config.ts`
- `archlucid-ui/src/app/globals.css`
- `docs/library/UI_DESIGN_SYSTEM.md` (token table section)

**Cross-ref:** **TB-115** (surface/card pass depends on tokens being defined first); **TB-116** (status tags use status tokens).

**Size estimate:** **S** — ~4–6 h (token definition + Tailwind wiring + docs; excludes component migration which is TB-115/116/117).

---

## TB-115 — Surface and card audit: remove pastel cards; apply Carbon-style neutral surfaces

**Status (2026-05-31):** **Done** — `operatorSemanticSurface` / `operatorSemanticBadge` / `operatorConfidenceSurface` in `design-tokens.ts`; shared proof/confidence cards migrated; `WelcomeBanner` compact enterprise banner; bulk pass via `archlucid-ui/scripts/migrate-tb115-operator-surfaces.ps1` (~95 files across operator, executive, marketing, `lib`, `global-error`). **Verified 2026-05-31:** `design-tokens.test.ts`, `PolicyPackDiffView.test.tsx`, demo-explain and `/why` snapshots green; decorative `bg-*-50` grep clear in app TS/TSX (remaining hits: primary CTAs `bg-teal-700`, chart/meter fills `bg-*-500`, 6px status dots). **TB-117–TB-120** design-system wave complete (tables, spacing, typography, Cursor rule).

**Source:** Owner-ratified UI design standard, 2026-05-27. Canonical doc: [`docs/library/UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md).

**Problem:**

Operator surfaces contain large pastel cards with colored backgrounds (`bg-teal-50`, `bg-amber-50`, `bg-blue-50`, `bg-green-50`) used decoratively rather than to communicate actionable status. These read as consumer SaaS, not enterprise governance. Carbon's aesthetic uses flat neutral surfaces (`$layer-01`) with structured borders and restrained elevation — color appears only on status indicators and interactive elements.

**What to do:**

1. Audit all `archlucid-ui/src/app/(operator)/` and `archlucid-ui/src/components/` files for cards using colored `bg-*-50` or `bg-*-100` backgrounds. Produce an enumerated list.
2. For each card: determine whether the color communicates actionable status.
   - If **yes** (e.g. an error callout, a governance block): replace with the canonical status token from **TB-114** (`--al-status-warn`, etc.).
   - If **no** (decorative): replace with the neutral surface token (`--al-surface-raised`), a `border border-neutral-200` border, and no background color fill.
3. Apply the same audit to teal border overuse: remove `border-teal-*` from non-interactive, non-focused elements. Teal borders should only appear on focus rings and interactive affordances.
4. Large marketing-card layouts inside operator views (giant hero cards, oversized onboarding banners) should be reduced to compact enterprise card size following Carbon's `16px` internal padding convention.

**Acceptance criteria:**

- No operator surface uses a decorative pastel background.
- Every colored card surface has a documented status reason.
- Teal border usage is limited to focus rings and interactive affordances.
- Cards in operator views use compact enterprise sizing, not marketing card sizing.

**Affected files / projects:**

- `archlucid-ui/src/app/(operator)/` — all page views and section components
- `archlucid-ui/src/components/` — shared cards (e.g. `CorePilotNextStepsCard.tsx`, `OperatorNextActionsCard.tsx`, `WelcomeBanner.tsx`, `SampleFirstReviewPackageCard.tsx`)

**Cross-ref:** **TB-114** (tokens must exist before this pass); **TB-116** (status cards get canonical tags, not ad-hoc coloring).

**Size estimate:** **M** — ~1.5 days (audit + systematic replacement across ~40–60 component files).

---

## TB-116 — Implement canonical status tag component and replace ad-hoc status badges

**Status (2026-05-31):** **Wave 1 landed** — `StatusTag`, `SeverityTag`, `RunStatusBadge` monitoring chip. Follow-up: replace remaining `StatusPill` ad-hoc pipeline colors (**TB-115**).

**Source:** Owner-ratified UI design standard, 2026-05-27. Canonical doc: [`docs/library/UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md).

**Problem:**

Run status, governance approval state, and finding severity are communicated through a mix of ad-hoc colored `span` elements, `Badge` variants, and inline `cn()` conditionals scattered across the codebase. There is no single canonical set of status tokens. The result is visual inconsistency and copy inconsistency — the same state appears as "READY", "Ready", "ready", or "✓" depending on where the user looks.

**What to do:**

1. Create `archlucid-ui/src/components/ui/StatusTag.tsx` — a single component accepting a `status` prop with the canonical value set:
   - `ready` · `needs-attention` · `blocked` · `approved` · `approved-with-monitoring` · `in-progress` · `draft`
   - Each renders a compact tag using the status tokens from **TB-114** (background, foreground, optional border).
   - Copy must match exactly: `Ready`, `Needs attention`, `Blocked`, `Approved`, `Approved with monitoring`, `In progress`, `Draft`.
2. Replace all ad-hoc status rendering in operator views with `<StatusTag status="..." />`.
3. Finding severity (`Critical`, `High`, `Medium`, `Low`, `Info`) should use a separate `SeverityTag` component with the same token discipline.
4. Export both from `archlucid-ui/src/components/ui/index.ts`.

**Acceptance criteria:**

- `StatusTag` and `SeverityTag` exist and cover all production statuses.
- No operator view renders status as an ad-hoc colored `span` or inline badge.
- Copy is consistent across all surfaces for the same state value.
- Tags are compact (Carbon-style: `12px` text, `4px 8px` padding, `2px` border-radius).

**Affected files / projects:**

- `archlucid-ui/src/components/ui/StatusTag.tsx` (new)
- `archlucid-ui/src/components/ui/SeverityTag.tsx` (new)
- `archlucid-ui/src/app/(operator)/reviews/` (run status rendering)
- `archlucid-ui/src/app/(operator)/governance/` (governance approval state)
- `archlucid-ui/src/components/` — any component rendering status/severity badges

**Cross-ref:** **TB-114** (status tokens); **TB-115** (card status colors → tags).

**Size estimate:** **S** — ~4–6 h (component creation + replacement pass).

---

## TB-117 — Operator data tables: Carbon-style structured tables for runs, findings, and audit

**Status (2026-05-31):** **Done** — `EnterpriseTable` on reviews list, governance findings desktop queue (`GovernanceFindingsQueueDesktopTable`), operator audit log (`AuditEventsOperatorTable`). Buyer-polished audit keeps milestone timeline cards; operator mode uses structured table + row payload disclosure.

**Source:** Owner-ratified UI design standard, 2026-05-27. Canonical doc: [`docs/library/UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md).

**Problem:**

The reviews list, findings list, and audit timeline use a mix of card-stacked rows, custom `div`-based grids, and minimal `table` elements. None conform to Carbon's structured data table pattern: column headers with sort indicators, row hover states using a single `$layer-hover` tint, compact row height (~40px), and clear primary/secondary column hierarchy. Procurement and CIO reviewers evaluate enterprise products on how their data tables look — a mature table communicates governance credibility; a card stack does not.

**What to do:**

1. Create `archlucid-ui/src/components/ui/EnterpriseTable.tsx` — a typed generic table component:
   - `<EnterpriseTable columns={...} rows={...} />` with column definition supporting `label`, `key`, `sortable`, `width`, and a `renderCell` slot.
   - Row hover: `$layer-hover` neutral tint (no teal).
   - Selected row: left border accent (`--al-accent-interactive`), no full row background.
   - Compact row height; sticky headers for long tables.
   - Accessible: `role="grid"`, `aria-sort`, `scope="col"`.
2. Migrate the runs list (`RunsListClient.tsx`), findings table, and audit results table (`AuditResultsSection.tsx`) to `EnterpriseTable`.
3. Remove card-stacked row patterns from these surfaces.

**Acceptance criteria:**

- `EnterpriseTable` exists, is typed, and is accessible.
- Runs list, findings list, and audit timeline use `EnterpriseTable`.
- Tables have sortable column headers where the underlying data supports sorting.
- No data list in operator views uses a card-stack layout when a table is more appropriate.

**Affected files / projects:**

- `archlucid-ui/src/components/ui/EnterpriseTable.tsx` (new)
- `archlucid-ui/src/app/(operator)/reviews/RunsListClient.tsx`
- `archlucid-ui/src/app/(operator)/audit/_sections/AuditResultsSection.tsx`
- `archlucid-ui/src/app/(operator)/governance/findings/` (findings table)

**Cross-ref:** **TB-114** (tokens); **TB-116** (status tags used inside table cells).

**Size estimate:** **M** — ~1.5 days (component + three migration targets).

---

## TB-118 — Spacing audit: replace marketing-scale spacing with enterprise-compact spacing in operator views

**Status (2026-05-31):** **Done (acceptance scope)** — operator home, run detail, executive dashboard (`py-4`), governance findings + decision register, finding detail/inspect, audit page (`space-y-4`). Admin/settings wizards may still use `space-y-6` where forms need breathing room; avoid new `space-y-8` / `py-8` on `(operator)/` routes.

**Source:** Owner-ratified UI design standard, 2026-05-27. Canonical doc: [`docs/library/UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md).

**Problem:**

Operator page sections use `space-y-6`, `py-8`, `gap-6`, and similar spacing that is appropriate for marketing pages but makes enterprise governance surfaces feel open and under-dense. Carbon's operator surfaces use a `16px` base spacing unit with `8px` micro-spacing for inline elements. Many current operator views apply the same spacing as the marketing site.

**What to do:**

1. Define a spacing convention in `docs/library/UI_DESIGN_SYSTEM.md`:
   - **Operator page section gap:** `space-y-4` (16px) — not `space-y-6` or `space-y-8`.
   - **Card internal padding:** `p-4` (16px).
   - **Inline element gap:** `gap-2` (8px).
   - **Section header to content:** `mb-3` (12px).
2. Audit all `archlucid-ui/src/app/(operator)/` page views for spacing that exceeds the convention without a documented reason.
3. Apply the convention systematically — prioritize pages that procurement/CIO reviewers land on first: operator home, review detail, executive dashboard, and findings.

**Acceptance criteria:**

- Spacing convention is documented in `UI_DESIGN_SYSTEM.md`.
- Operator home, review detail, executive dashboard, and findings pages conform.
- No operator page section uses `space-y-8` or `py-8` purely for decoration.

**Affected files / projects:**

- `docs/library/UI_DESIGN_SYSTEM.md` (spacing convention section)
- `archlucid-ui/src/app/(operator)/_sections/OperatorHomePageView.tsx`
- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailPageView.tsx`
- `archlucid-ui/src/app/(operator)/dashboard/_sections/`
- `archlucid-ui/src/app/(operator)/governance/findings/`

**Cross-ref:** **TB-115** (card sizing part of same enterprise compactness goal).

**Size estimate:** **S** — ~3–4 h (convention doc + four-page audit and fix).

---

## TB-119 — Typography audit: enforce accessible enterprise type hierarchy across operator surfaces

**Status (2026-05-31):** **Done** — `OPERATOR_TYPOGRAPHY` + `DESIGN_TOKENS.typography`; `cardTitle` token; migration script `archlucid-ui/scripts/migrate-tb119-operator-typography.ps1` (~106 files). Operator `h1` capped at `text-xl`; KPI tiles use `kpiValue` (`text-4xl` mono); run-detail section labels use `sectionTitle`. Acceptance surfaces (home banner, run detail, executive dashboard, findings, audit) pass grep for `text-2xl`/`text-3xl` page titles.

**Source:** Owner-ratified UI design standard, 2026-05-27. Canonical doc: [`docs/library/UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md).

**Problem:**

Current type scale mixes marketing-scale headings (`text-2xl`, `text-3xl`) with operator content without a clear enterprise hierarchy. Carbon's type scale is disciplined: body (`14px`/`0.875rem`), label (`12px`/`0.75rem`), section heading (`16px`/`1rem` semibold), page heading (`20px`/`1.25rem` semibold). No decorative font choices. Text hierarchy is communicated by size and weight, not color alone (color alone is an accessibility failure).

**What to do:**

1. Document the ArchLucid type scale in `docs/library/UI_DESIGN_SYSTEM.md`:
   - `body`: `text-sm` (14px), `text-neutral-800`.
   - `label/caption`: `text-xs` (12px), `text-neutral-600`.
   - `section-heading`: `text-sm font-semibold uppercase tracking-wide`, `text-neutral-700`.
   - `page-heading`: `text-xl font-semibold`, `text-neutral-900`.
   - `data-value`: `text-sm font-medium`, `text-neutral-900`.
2. Audit operator pages for headings that exceed `text-xl` without a documented reason.
3. Verify that all text distinguishing meaning uses at least two signals (size + weight, not color alone) — accessibility requirement.
4. Remove any decorative font weight or italic use that is not semantically motivated.

**Acceptance criteria:**

- Type scale is documented.
- No operator page heading exceeds `text-xl` without a documented exception.
- Text hierarchy uses size + weight as dual signals; no meaning conveyed by color alone.
- Audit of operator home, review detail, and executive dashboard passes the convention.

**Affected files / projects:**

- `docs/library/UI_DESIGN_SYSTEM.md` (type scale section)
- `archlucid-ui/src/app/(operator)/` — page heading and section heading elements

**Cross-ref:** `.cursor/rules/UI-Accessibility-Baseline.mdc`; **TB-115** (cards); **TB-118** (spacing).

**Size estimate:** **S** — ~3–4 h (convention doc + targeted fixes).

---

## TB-120 — Add Carbon-standard Cursor rule so AI-generated UI code stays conformant

**Status (2026-05-31):** **Done** — `.cursor/rules/UI-Enterprise-Design-Standard.mdc` (globs `archlucid-ui/src/**`), wave completion table, migration script anchor; `archlucid-ui/AGENTS.md` + `UI_DESIGN_SYSTEM.md` cross-refs.

**Source:** Owner-ratified UI design standard, 2026-05-27. Canonical doc: [`docs/library/UI_DESIGN_SYSTEM.md`](UI_DESIGN_SYSTEM.md).

**Problem:**

There is no Cursor rule that instructs the AI assistant to follow the Carbon-inspired enterprise visual standard when writing or modifying UI code. Without a rule, every new component risks defaulting to Tailwind/shadcn aesthetic defaults — pastel cards, teal borders, marketing spacing — which directly contradicts the V1 GA requirement.

**What to do:**

1. Create `.cursor/rules/UI-Enterprise-Design-Standard.mdc` with the following content (adapt format to match existing rules in `.cursor/rules/`):
   - Reference `docs/library/UI_DESIGN_SYSTEM.md` as the canonical standard.
   - Include the full ratified agent instruction block verbatim (§ "Ratified instruction for AI coding agents" in `UI_DESIGN_SYSTEM.md`).
   - Specify auto-attachment glob: `archlucid-ui/src/**/*.tsx`, `archlucid-ui/src/**/*.ts`.
   - Add explicit "do not" list: no pastel cards for decoration, no `blob/main` doc links (use `blob/master`), no marketing-scale spacing in operator views, no raw status strings instead of `StatusTag`.
2. Cross-reference the rule from `archlucid-ui/AGENTS.md` under the Cursor rules table.

**Acceptance criteria:**

- `.cursor/rules/UI-Enterprise-Design-Standard.mdc` exists with the full instruction block and correct glob auto-attachment.
- `archlucid-ui/AGENTS.md` lists the rule.
- A new component written by the AI assistant after this rule is applied does not use pastel card backgrounds, oversized spacing, or ad-hoc status coloring.

**Affected files / projects:**

- `.cursor/rules/UI-Enterprise-Design-Standard.mdc` (new)
- `archlucid-ui/AGENTS.md`

**Cross-ref:** **TB-114**–**TB-119** (the design system items this rule enforces).

**Size estimate:** **XS** — ~1 h (rule file + AGENTS.md update).

---
