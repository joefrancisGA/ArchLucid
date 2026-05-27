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

| ID | Title | Priority driver | Size |
|----|-------|----------------|------|
| TB-009 | Architecture invariant program — doc + ADR 0035 finalize | Engineering governance — single catalog IDs `INV-*`, proposed ADR acceptance, links from index / Cursor rule | Done (doc land 2026-05-09) |
| TB-010 | Architecture invariant enforcement — Wave A (INV-001, INV-005, INV-006) | Done (Improvement **#21**, 2026-05-25) — INV-001 Roslyn analyzer; INV-005 catalog/fail-fast parity; INV-006 composition-root scan | S |
| TB-011 | Architecture invariant enforcement — Wave B (INV-002, INV-004, INV-012, INV-013) | Honesty + economics — persisted execution mode, durable budget coherence, single quality-gate truth, replay scope isolation | L |
| TB-033 | Agent execution trace — persist LLM sampling params + reasoning token count | Forensic replay completeness — temperature / maxTokens / top_p and reasoning tokens are not on `AgentExecutionTrace` | XS |
| TB-048 | Tenancy isolation hardening — retrieval index + query | Done (Batch G, 2026-05-26) — null policy-pack assignment safe default, Azure filter builder, tests | S |
| TB-045 | Embedding model identity and drift guard | Done (Batch G, 2026-05-26) — chunk metadata, mismatch metric, startup drift validator | S–M |
| TB-049 | Retrieval IR eval harness — recall@k, MRR, golden dataset | Done (Batch E, 2026-05-26) — `eval_retrieval_ir.py` + `tests/eval-datasets/retrieval-golden/cases.json`; see **RAG-V1-011** | M |
| TB-046 | Index freshness + ContentHash skip + indexer observability | Reliability — stale index undetected; `ContentHash` unused; startup indexer fail-open; see **RAG-V1-008** | S–M |
| TB-047 | Chunking strategy fingerprint and invalidation | Correctness — mixed-generation chunks when chunker defaults change; see **RAG-V1-009** | S |
| TB-034 | Degraded-handler minimal `AgentExecutionTrace` rows | Support / honesty — resilience fallbacks (`AgentHandlerDegradedResultFactory`) write no trace; prompts and model calls are unrecoverable | S |
| TB-035 | Persist intermediate LLM attempts on schema-remediation retries | Forensic replay — `LlmAgentSchemaCompletion` records only the final attempt; earlier prompts/responses are metric-only | M |
| TB-036 | Correlate `DecisionProvenanceGraph` with `AgentExecutionTrace` | Done (Batch F, 2026-05-26) — `ProvenanceCorrelationId`, finding node trace id, API field | M |
| TB-037 | Production write path for `DecisionProvenanceSnapshot` | Performance + durability — `IProvenanceSnapshotRepository.SaveAsync` has no callers; graph rebuilt on every API read | S |
| TB-038 | `RetrievalGroundingTrace` forensic enrichment (+ non-Compliance agents) | Forensic replay — only chunk IDs persisted for Compliance; query, top-K, scores, document IDs missing; see **RAG-V1-006** | S–M |
| TB-039 | Agent execute retry — per-`(RunId, TaskId)` skip before handler dispatch | Done (Batch E, 2026-05-26) — `RealAgentExecutor` skips persisted non-degraded results; metric `archlucid_agent_execute_task_skipped_idempotent_total` | M |
| TB-043 | Schema remediation — non-retried completion client (decouple from Polly stack) | Done (Batch E, 2026-05-26) — `ISchemaRemediationAgentCompletionClient` without Polly retry wrapper | XS–S |
| TB-041 | Authority pipeline — per-stage completion checkpoint on retry | Done (Batch F, 2026-05-26) — FK checkpoint skip, hydrator, metric, tests | M |
| TB-042 | Graph snapshot supersession — skip rebuild when `RunRecord.GraphSnapshotId` set | Done (Batch F, 2026-05-26) — header/orphan reuse resolver, aligned with TB-041 | S |
| TB-040 | `LlmCompletionAccountingClient` — await metering with `CancellationToken.None` | FinOps honesty — fire-and-forget metering skipped under linked cancellation; budget trackers vs `IUsageMeteringService` diverge | XS |
| TB-044 | `AgentExecutionTraces` — unique index on `(RunId, TaskId, AgentType)` + upsert semantics | Done (Batch E, 2026-05-26) — DbUp 223 + delete-then-insert upsert | XS |
| TB-012 | Architecture invariant enforcement — Wave C (INV-007–INV-011, INV-014–INV-015) | Contributor hygiene — time/cancellation/idempotency/HTTP/analyzer pack + webhook ordering + INV-003 path markers | L |
| TB-027 | Introduce `IAgentExecutor` port — eliminate AgentSimulator coupling from production assemblies | Architecture correctness — production assemblies (AgentRuntime, Capabilities.Cost, Host.Core) depend on a test simulator; port inversion removes 3 violations in one move | M |
| TB-028 | Move `Integrations.AzureExtractor` wiring out of `Api.csproj` into Host.Composition | Composition-root discipline — Api entry point directly names an infrastructure adapter; violates single-composition-root rule | XS |
| TB-029 | Replace `Decisioning → Notifications` with domain events | Domain/infrastructure decoupling — domain analysis service hard-coupled to notification infrastructure; correct pattern is domain events + host-layer subscriber | M–L |
| TB-030 | Architecture.Tests gap closure — add Mcp, AzureExtractor, AgentSimulator, Jobs.Cli coverage + 10 missing `[Fact]`s | Engineering governance — four product assemblies have zero architecture test coverage; 10 layer-boundary assertions are missing from `DependencyConstraintTests` | S |
| TB-031 | Disambiguate ArtifactSynthesis / Decisioning layer position | Architecture maintainability — both are nominally at the same layer but ArtifactSynthesis depends on Decisioning; needs explicit layer decision or type extraction | XS–S |
| TB-032 | Replace `Mcp → Retrieval` direct coupling with a query port | Infrastructure/application boundary — MCP adapter bypasses port abstraction and directly couples to Retrieval's concrete implementation and its transitive application-layer deps | M |
| TB-022 | `LlmCostEstimator` — `int` overflow in aggregator token-count fields | Done (Improvement **#19**, 2026-05-25) | XS |
| TB-026 | `LlmCostEstimator` — negative-rate guard on `LlmDeploymentUsdRates` | Done (Improvement **#19**, 2026-05-25) | XS |
| TB-004 | Wire OTel exporters + verify agent-output metrics; add Azure alerts | **Done (Improvement #22, 2026-05-25)** — `prometheus_agent_output_rules.tf` + `archlucid-alerts.yml` faithfulness p50 | ~1–2 h |
| TB-005 | AI-assisted owner pen-test support (Cursor agent) | Security / V1 assurance — structured help for 2026-Q2 owner exercise | Ongoing (time-boxed sessions) |
| TB-007 | LLM correctness boundary — cohort gate promotion + eval real-mode scenarios | Correctness posture — gated real-model CI blocked on prereqs (Gap A+C open) | A: ~1 h ops; C: ~4 h eng |
| TB-021 | RAG quality program — V1 foundation (corpus seam, policy pack, prior manifest, Retail lookup, platform docs, faithfulness eval) | Agent faithfulness + citation density — extends existing `ArchLucid.Retrieval` + `AskService`; schedule from assessments | M–L (phased) |
| TB-008 | Context ingestion connectors — Phases 3–4 (meaningful delta + enrichers, policy/topology coupling) | Architecture maintainability — Phases 1–2 shipped | L |
| TB-013 | Documentation library audience split — Phases 2–3 (customer-facing vs contributor-reference) | Developer experience — lower onboarding cognitive load without breaking bookmarks or procurement/UI doc paths | M |
| TB-014 | LLM token wallet — non-expiring auto-replenish | Done (Batch F, 2026-05-26) — wallet tables, Stripe gateway, webhook idempotency, API, UI panel, metrics | M |
| TB-015 | Per-agent/per-invoke-kind LLM token dimensions + CI export of real-mode averages | FinOps honesty — truthful Topology/Cost/Compliance/Critic token envelopes for `cost-preview` + cohort budgeting (no guesses) | M |
| TB-024 | `LlmCostEstimator` — reasoning-token test coverage | Done (Improvement **#20**, 2026-05-25) | XS |
| TB-023 | `LlmCostEstimator` — document replay-rate semantics (live rate vs stored-per-trace divergence) | Developer clarity / FinOps honesty — recomputed aggregate uses live rates, not historical rates; diverges from stored `EstimatedCostUsd` after admin rate changes; must be documented on `ILlmCostEstimator` and the aggregator | XS |
| TB-025 | `LlmCostEstimator` — annotate OTel `double` cast and pretax nature | Informational / monitoring honesty — `(double)estimatedCostUsd` in `RecordLlmCostUsd` introduces IEEE 754 error; `archlucid_llm_cost_usd_total` is pretax and monitoring-grade only; neither is documented | XS |
| TB-016 | ITSM + chat vendor sandbox accounts — provision, secrets, inbound webhooks — for recurring live smoke | Trust / interoperability — mocks are not proofs; gated CI + CONNECTOR_READINESS_MATRIX need operator-owned URLs + tokens | S–M |
| TB-017 | Trial orphaned-catalog teardown SOP + only then tighten unattended `Trial:Lifecycle` purge | Hosted COGS — idle dormant trials burn negligible AOAI; manual Azure SQL/catalog drop suffices at low cardinality (`TRIAL_AND_SIGNUP` §4, `TRIAL_LIFECYCLE`) | S |
| TB-018 | Warm tenant catalogs in elastic pool — replenish + fast claim (`RunTenant`-skip path) | Signup SLA — elastic pool amortizes DDL; standby empties shorten hot path (`TENANT_DATABASE_TOPOLOGY` Operational notes warm catalogs) | M |
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

**Status (2026-05-25):** **Closed for production-like hosts with managed Prometheus.** **`infra/terraform-monitoring/prometheus_agent_output_rules.tf`** deploys Azure Monitor Prometheus rules mirroring **`infra/prometheus/archlucid-alerts.yml`** group **`archlucid-agent-output-quality`** (quality-gate rejects, semantic **p10/p50**, LLM faithfulness **p50**, parse failures, trace blob upload failures) to **`azurerm_monitor_action_group.ops`**. Requires **`enable_prometheus_slo_rule_group`** + non-empty **`azure_monitor_workspace_id`**. Eval baseline CI failure remains a **GitHub Actions** alert path (not Terraform). See **`docs/library/OBSERVABILITY.md`** and **`docs/library/AGENT_OUTPUT_EVALUATION.md`** §9.

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

**What to do (once deployment exists):**
1. Inject secret into the protected Environment per PENDING_QUESTIONS.md Q15.
2. Add cohort-real-llm-gate to the required status checks in the main branch protection rule.
3. Open a separate PR (not the same as the deployment PR) for the promotion.

### Gap B — Enable EnforceOnReject after product decision

**Status (2026-05-08):** **Closed for production-like hosts.** **`ArchLucid.Api/appsettings.Staging.json`** and **`appsettings.Production.json`** set **`ArchLucid:AgentOutput:QualityGate`** to **`Mode: PilotStrict`**, **`EnforceOnReject: true`**, **`BlockRunOnReject: true`**. **`AgentOutputEvaluationRecorder`** throws **`AgentOutputQualityGateRejectedException`** on reject; **`ArchitectureRunExecuteOrchestrator`** catches it when both flags are true, marks **`LegacyRunStatus`** **`ExecutionCompletedQualityRejected`**, emits baseline audit **`RunQualityGateRejected`**, and rethrows (**HTTP 409** from API problem-details handling). **`appsettings.Development.json`** keeps **`EnforceOnReject` / `BlockRunOnReject`** **`false`** for local usability. Coverage: **`ArchitectureRunExecuteOrchestratorQualityGateBlockingTests`**, **`AgentOutputQualityGateStagingAppsettingsTests`** (effective options from committed Staging JSON).

**Follow-up (optional):** If a **`appsettings.SaaS.json`** (or tenant-specific) profile needs a different posture, duplicate or slice the Staging block explicitly rather than relying on base **`appsettings.json`** (which omits the section and uses CLR defaults).

### Gap C — Eval corpus has no real-mode scenarios

**Status:** All three scenarios in `tests/eval-corpus/` have "mode": "simulator" in their qualityEvidence block. The eval_agent_corpus.py CI script runs against simulator agent result fixtures. There are no CI-run checks that assert on real-model finding quality against expected keyword patterns.

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

## TB-023 — `LlmCostEstimator` — document replay-rate semantics (live rate vs. stored-per-trace divergence)

**Source:** Cost estimator audit-grade correctness review (2026-05-24).

**Problem:** `ILlmCostEstimationUsdRateOverride.TryGetUsdPerMillionRates` is resolved at call time, not at trace-recording time. This means:

1. Replaying historical traces through `AgentExecutionTraceRunLlmCostAggregator.Compute` after an admin rate update produces a different aggregate cost than what was originally recorded.
2. The per-trace `AgentExecutionTrace.EstimatedCostUsd` field (populated at trace-recording time with the rates live then) diverges from the recomputed aggregate — they can disagree on the same run.

Neither the interface XML doc nor the aggregator XML doc currently states this behavior. Operators who treat the "estimated cost" on a run detail page as a stable audit number will be surprised when it changes after an admin tunes rates.

**What to do:**

1. Add a `<remarks>` block to `ILlmCostEstimator.EstimateUsd` stating: "Estimates reflect the **currently configured** rates (including any live admin override via `ILlmCostEstimationUsdRateOverride`). Replaying historical token counts after a rate change produces a different result — this is intentional and is not a stable audit-grade record."
2. Add a corresponding `<remarks>` to `AgentExecutionTraceRunLlmCostAggregator.Compute` stating: "Re-estimates each trace using current live rates. The returned `EstimatedCostUsd` may differ from the per-trace `AgentExecutionTrace.EstimatedCostUsd` values populated at trace-recording time if rates were changed between recording and this call."
3. Add a brief note to `docs/library/PER_TENANT_COST_MODEL.md` (or `OPERATIONS_LLM_QUOTA.md`) in the rate-tuning section explaining the recomputation behavior for operator awareness.

**Affected files:**
- [`ArchLucid.Core/Configuration/ILlmCostEstimator.cs`](../../ArchLucid.Core/Configuration/ILlmCostEstimator.cs)
- [`ArchLucid.Application/Agents/AgentExecutionTraceRunLlmCostAggregator.cs`](../../ArchLucid.Application/Agents/AgentExecutionTraceRunLlmCostAggregator.cs)
- `docs/library/PER_TENANT_COST_MODEL.md` or `docs/OPERATIONS_LLM_QUOTA.md` (whichever covers rate-tuning guidance)

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

**Status:** Done (Batch G, 2026-05-26).

**Source:** Retrieval correctness & drift audit (2026-05-26). `InMemoryVectorIndex` treats `AllowedPolicyPackRulePackIds == null` as allow-all for policy packs. Azure Search filter path not auditable in-repo.

**What to do:** See **RAG-V1-010**. **P0:** safe default on null assignment list + integration test. **P1:** Azure Search tenant `$filter` when client ships.

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

