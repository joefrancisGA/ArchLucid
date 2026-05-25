> **Scope:** Engineering assessment for internal leads and reviewers tracking V1 GA readiness; not a public-facing status report or compliance attestation.

# ArchLucid Assessment – (A) Headline Readiness: 90.49%

*This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, explicitly excluding deferred V1.1/V2 items such as SOC 2 CPA attestation, third-party pen tests, MCP, the commerce un-hold, multi-cloud (AWS/GCP) analysis, multi-region active/active, automated tenant erasure, Graph-RAG / agentic retrieval, hosted Tier 2 continuous polling, **non-SCIM bulk-CSV user onboarding (V2)**, **self-hosted Enterprise commercial deals (V2)**, and related sub-milestones (capacity guide, private-endpoint reference architecture).*

**Score change 2026-05-24 (afternoon):** Rescored upward from 87.74% to 89.93% after removing latent V1.1/V2 penalties. **2026-05-24 (later):** 89.93% → **90.07%** (bulk-CSV → V2, [`V1_DEFERRED.md` §6r](../library/V1_DEFERRED.md)). **90.07% → 90.21%** (capacity guide → V2; later absorbed into §6t). **90.21% → 90.35%** (full **self-hosted Enterprise deals** motion → V2, [`V1_DEFERRED.md` §6t](../library/V1_DEFERRED.md); **V1 GA Enterprise = ArchLucid-hosted SaaS only**). Custom policy pack authoring SKU decided — see Improvement #6. Cross-tenant ROI deduplication tests shipped — see Improvement #3. **90.35% → 90.49%** (Batch 4 partial: vector-store health check #10, Ask RAG SQL fallback #13, executive ROI cache warmup #16, SAML SP startup validation #18).

## Executive Summary

**`(A)` Overall Headline Readiness**
ArchLucid is well past the pilot-credible bar for V1 GA at 90.49%. The core architecture, observability, audit, governance, and trial-funnel plumbing are production-ready. The remaining `(A)` deficit is concentrated in **V1-actionable** AI-quality investments (policy-pack indexing, LLM faithfulness evaluation, prior-manifest chunks) and a smaller set of operator-side gaps (agent-trace blob lifecycle, RAG observability dashboards). None of these block V1 GA; they raise the ceiling on agent output trustworthiness and operator confidence.

**`(B)` Procurement / Market-Motion Realism (Informational — zero weight on `(A)`)**
Enterprise procurement teams will still ask for CPA-issued SOC 2 Type II, an external pen-test summary, automated GDPR erasure, multi-region active/active, AWS/GCP target analysis, and **self-hosted / on-premises deployment**. Every one of these items is **explicitly out of `(A)` scope** per `V1_DEFERRED.md` §6c, §6l, §6m, §6n, **§6t**, and the scope rule. The right posture is honest trust-center narrative — **V1 GA is hosted SaaS**; self-hosted Enterprise is **V2** — not score deductions.

**The Commercial Picture**
Pricing is locked and defensible (`PRICING_PHILOSOPHY.md` §5). The trial funnel is deeply instrumented with audit + Prometheus + Grafana. Executive ROI summary endpoint with cross-run deduplication is **shipped for V1 GA** per §2.8 / §6o. Stripe live keys + Marketplace `Published` are deliberately held to V1.1 (§6b) — a sales-led motion is the V1 contract, not a defect. The custom policy pack authoring SKU is now defined (Improvement #6) and ready to publish.

**The Enterprise Picture**
**V1 GA Enterprise is ArchLucid-hosted SaaS** — SCIM, SAML SP, OIDC, RLS, governance, and policy packs on the operated platform. Realistic V1 friction: **SAML claim-mapping ergonomics** (no interactive pre-flight wizard; metadata CLI and startup validation shipped — Improvements #4 and #18). **Self-hosted Enterprise deals** (customer-operated deployments, private-endpoint reference architecture, consolidated capacity guide, deployment playbook) are **V2** per [`V1_DEFERRED.md` §6t](../library/V1_DEFERRED.md) — `(B)` procurement realism only, zero `(A)` penalty. Container / Terraform assets remain for engineering and evaluation, not as a V1 contracted buyer path.

**The Engineering Picture**
The foundation is genuinely strong: warnings-as-errors, strict CI, merged-line coverage gate, vulnerability scanning, SBOM publication, OpenTelemetry depth, circuit breakers, outbox + data-consistency probes, vector-store readiness probing, Ask RAG SQL fallback, and a deliberate single-replica baseline with documented Redis upgrade path (§6e). The honest engineering risk surface is concentrated in **RAG quality** (TB-021 / RAG-V1-*) and **storage lifecycle** (orphaned agent-trace blobs) — both V1-actionable.

---

## Weighted Quality Assessment

Qualities are ranked from most urgent to least urgent based on their **weighted deficiency** (Weight × (100 - Score)).

### 1. Cutting-Edge AI Technology
- **Score:** 87
- **Weight:** 8
- **Weighted Deficiency:** 104
- **Justification:** ArchLucid runs Azure OpenAI with structured-output JSON contracts, content-safety enforcement, prompt redaction with auditable bypass counters, circuit breakers, caching, embedding-faithfulness optional scorer, and a working retrieval seam (`ArchLucid.Retrieval`). The genuine V1-actionable gap is shallow corpora — TB-021 / RAG-V1-* items (policy-pack indexing, prior-manifest chunks, LLM faithfulness eval) are explicitly **in-scope quality work** that `(A)` may score against per §6q. Graph-RAG, agentic retrieval (HyDE / rerank / query rewrite), and online fine-tuning are **V2** per §6q and not penalized here.
- **Tradeoffs:** Adding LLM-based faithfulness evaluation costs extra tokens per agent run and adds eval latency, but is the right answer to silent hallucinations.
- **Recommendations:** Schedule TB-021: `PolicyPackChunker`, tenant `PriorManifestChunker`, and LLM faithfulness evaluator on the agent-output evaluation hook.
- **Status:** Fixable in V1 (engineering backlog already scoped).

### 2. AI/Agent Readiness
- **Score:** 90
- **Weight:** 8
- **Weighted Deficiency:** 80
- **Justification:** The agent runtime is solid — circuit breakers, content safety, prompt-redaction telemetry, trace blob storage with SQL inline fallback, four agent types (Topology, Cost, Compliance, Critic), and a quality-gate scaffold. Ask RAG SQL fallback (#13, 2026-05-24) keeps Ask partially functional when the vector store is down. The V1-actionable gap: the `AgentOutputQualityGate` ships with warn-only floors (reject thresholds at 0), and semantic scoring is heuristic-first with optional LLM rubric rather than a uniform LLM-as-judge pass.
- **Tradeoffs:** Aggressive reject thresholds may cause spurious agent retries on borderline outputs; introduce gradually with warned→rejected migration per agent type, watching `archlucid_agent_output_quality_gate_total{outcome="rejected"}`.
- **Recommendations:** Wire explicit reject thresholds, add LLM faithfulness evaluator across all four agent types.
- **Status:** Fixable in V1.

### 3. Adoption Friction
- **Score:** 92
- **Weight:** 6
- **Weighted Deficiency:** 48
- **Justification:** Entra ID, generic OIDC, native SAML SP, SCIM, API-key automation, and `archlucid doctor` all land in V1 GA on **ArchLucid-hosted SaaS**. Tier 1 Azure Extractor is the V1 path by design. Hosted Tier 2 continuous polling is **V1.x per §6p** and not penalized. **Non-SCIM bulk-CSV** is **V2** per [`V1_DEFERRED.md` §6r](../library/V1_DEFERRED.md). **Self-hosted Enterprise deals** are **V2** per [`V1_DEFERRED.md` §6t](../library/V1_DEFERRED.md) — container / Terraform assets are engineering-only, not a V1 contracted buyer path. SAML metadata CLI (#4) and SAML SP startup validation (#18, 2026-05-24) ship; remaining V1 friction: no interactive claim-mapping wizard.
- **Tradeoffs:** Adding more configuration validation slows initial setup but prevents post-go-live outages and reduces SE time per onboarding.
- **Recommendations:** Publish custom policy pack authoring SKUs on pricing pages (Improvement #6); add interactive SAML claim-mapping wizard (future).
- **Status:** Fixable in V1 (hosted SaaS enterprise ergonomics); bulk CSV import and self-hosted Enterprise deals are V2.

### 4. Time-to-Value
- **Score:** 92
- **Weight:** 7
- **Weighted Deficiency:** 56
- **Justification:** Trial funnel is automated end-to-end with audit + Prometheus instrumentation; Tier 1 extractor ZIP is the customer-friendly default; Core Pilot four-step happy path is published; ROI surfaces (per-run and executive cross-run) are live; sample-seeded trial tenant works. AWS/GCP target analysis is **V1.1 per §6n** and not penalized. Remaining V1 friction: no Team→Professional in-product CTA based on seat / workspace headroom (usage-based trial upgrade nudge shipped in Improvement #14, 2026-05-24).
- **Tradeoffs:** In-product upgrade nudges feel pushy if not carefully tuned; pace them against documented seat-usage thresholds.
- **Recommendations:** Add usage-based in-product upgrade nudge (new Improvement #14) — **completed 2026-05-24**.
- **Status:** Fixable in V1.

### 5. Proof-of-ROI Readiness
- **Score:** 92
- **Weight:** 5
- **Weighted Deficiency:** 40
- **Justification:** Pilot Scorecard API and Executive ROI Summary are implemented with cross-run deduplication, systemic-issue aggregation, history endpoint, CSV export response shape (`ExecutiveRoiExportResponse`), and CSV export CLI (#9, 2026-05-24). The aggregation rules in `ExecutiveRoiSummaryService` are documented (§2.8) and implement stable-`FindingId` dedup as committed. **`ExecutiveRoiSummaryServiceTests` / `ExecutiveRoiSummaryServiceExtendedTests`** now cover cross-tenant dedup, null/empty `FindingId` edge cases, snapshot savings aggregation, muted findings, and export rows (Improvement #3, 2026-05-24).
- **Tradeoffs:** Cross-tenant dedup logic is non-trivial; regression risk is reduced but new finding categories still warrant test updates when aggregation rules change.
- **Recommendations:** Ship board-pack one-page ROI export (Improvement #24).
- **Status:** Fixable in V1.

### 6. Executive Value Visibility
- **Score:** 93
- **Weight:** 4
- **Weighted Deficiency:** 28
- **Justification:** Executive ROI Summary endpoint, operator-shell `ExecutiveRoiSummarySection`, CSV export CLI (#9, 2026-05-24), and leader-elected cache warmup hosted service (#16, 2026-05-24) are live. Remaining V1 deficit: no Grafana panel for tenant-level estimated savings and no board-pack one-page ROI artifact format.
- **Tradeoffs:** Pre-warming the cache costs background CPU but eliminates the cold-first-impression problem for the very people the dashboard is for.
- **Recommendations:** Add Grafana ROI panel (Improvement #12) and board-pack one-page export (Improvement #24).
- **Status:** Fixable in V1.

### 7. Reliability
- **Score:** 94
- **Weight:** 2
- **Weighted Deficiency:** 12
- **Justification:** Outbox + data-consistency probes (`DataConsistencyOrphanProbeHostedService`), circuit breakers with health-check exposure, SQL transactions, RLS with `SESSION_CONTEXT`, quarantine paths, `VectorStoreHealthCheck` on `/health/ready` (#10, 2026-05-24), and Ask RAG SQL fallback (#13, 2026-05-24) form a strong V1 baseline. Single-region active/passive is the **V1 contract per §6l** and not a `(A)` defect. Residual V1 risk: relational integrity — several child tables store `RunId` as `NVARCHAR(64)` instead of `UNIQUEIDENTIFIER`, preventing trusted FK constraints back to `dbo.Runs`; the archive cascade uses `TRY_CAST` as a workaround, which is not SARGable and scans every row. Three FK constraints on `dbo.FindingsSnapshots` were created `WITH NOCHECK` (not trusted), so the query optimizer cannot use them.
- **Tradeoffs:** A vector-store health check that fails `/health/ready` could keep an otherwise-healthy API node out of rotation; `Retrieval:VectorStoreHealthCheck:FailReadinessWhenUnavailable` defaults permissive (degraded, not failing). The `NVARCHAR` → `UNIQUEIDENTIFIER` migration requires a multi-step brownfield migration and must be coordinated with the DbUp sequence.
- **Recommendations:** Migrate `NVARCHAR(64)` run-ID columns to `UNIQUEIDENTIFIER` (Improvement #27). Re-trust `FindingsSnapshots` FK constraints with `WITH CHECK CHECK CONSTRAINT` (Improvement #26). Add agent-trace blob cleanup hosted service (Improvement #8).
- **Status:** Fixable in V1.

### 8. Maintainability
- **Score:** 94
- **Weight:** 2
- **Weighted Deficiency:** 12
- **Justification:** Central Package Management, warnings-as-errors, `EnforceCodeStyleInBuild`, strict CI, dependency vulnerability scanning, SBOM publication, gitleaks, merged coverage gates, and a clear bounded-context layout make this codebase exceptionally maintainable. SQL persistence layer has two notable maintainability debts: (1) the archive cascade logic — eight `IF COL_LENGTH` / `UPDATE … SET ArchivedUtc` blocks — is duplicated verbatim in both `ArchiveRunsCreatedBeforeAsync` and `ArchiveRunsByIdsAsync`; (2) `ArchiveRunsByIdsAsync` makes two sequential SQL round trips (SELECT state, then UPDATE cascade) where one is sufficient. Architecture test coverage has 13 identified gaps: two hexagonal guard omissions (`Provenance` and `Capabilities.Cost` are not protected from `Persistence`), two `Api` boundary tests that enforce only at the type level rather than the stricter assembly-metadata level, and nine unguarded lateral domain couplings spanning `Decisioning→Notifications`, `Provenance→{ArtifactSynthesis,Decisioning,KnowledgeGraph}`, `Retrieval→{Decisioning,ArtifactSynthesis,Provenance}`, and `AgentRuntime→{Decisioning,Provenance}` (see Improvement #53).
- **Tradeoffs:** Strict CI gates raise contributor friction; offset by good `*.slnf` filters and the dev container.
- **Recommendations:** Add an `AgentResultBlobCleanupHostedService` to prevent unbounded `IArtifactBlobStore` growth from accumulated agent trace blobs. Add filtered covering indexes for `HasWarnings` and `HasGovernanceWarnings` correlated EXISTS subqueries (Improvement #26). Extract the duplicated archive cascade SQL to a TVP stored procedure and collapse `ArchiveRunsByIdsAsync` to a single batch round trip (Improvement #28).
- **Status:** Fixable in V1.

### 9. Supportability
- **Score:** 96
- **Weight:** 1
- **Weighted Deficiency:** 4
- **Justification:** OpenTelemetry depth (custom `ArchLucid` meter with ~50 instruments), persisted W3C trace IDs on runs, Serilog + correlation IDs, `archlucid doctor`, CLI `support-bundle`, multiple committed Grafana dashboards, Prometheus alert rules, detailed `/health` with circuit-breaker introspection and vector-store readiness probing (#10, 2026-05-24), and post-deploy smoke for agent-output metrics. The V1 gap: no RAG-retrieval telemetry instrument, no LLM-redaction Grafana panel, no integration-outbox dashboard.
- **Tradeoffs:** More telemetry costs ingest dollars in Azure Monitor / Prometheus; per-tenant cardinality is already gated behind `LlmTelemetry:RecordPerTenantTokens`.
- **Recommendations:** Add the three missing dashboards and the RAG retrieval instruments.
- **Status:** Fixable in V1.

---

## Top 11 Most Important Weaknesses

All V1.1 / V2 items removed per `Assessment-Scope-V1_1.mdc`. These are V1-actionable weaknesses only.

1. **Shallow RAG corpora:** Policy packs and tenant prior manifests are not yet chunked/indexed (TB-021 / RAG-V1-* backlog), capping the contextual depth agents can ground recommendations against.
2. **Heuristic-first semantic scoring:** LLM-as-judge faithfulness evaluation is not uniformly applied across all four agent types (Topology, Cost, Compliance, Critic); reject thresholds ship at zero (warn-only).
3. **SAML SP claim-mapping has no interactive pre-flight wizard:** Metadata CLI (#4) and startup validation (#18, 2026-05-24) catch misconfigurations at deploy time; operators still lack a guided claim-mapping UI.
4. **No automated cleanup for orphaned agent-trace blobs:** `IArtifactBlobStore` accumulates `agent-traces/{runId}/...` blobs even after run deletion; no lifecycle job.
5. **RAG retrieval latency and chunk-count telemetry not instrumented:** Blind spot in AI performance monitoring; only LLM-side metrics exist today.
6. **Quality gate reject thresholds ship at zero (warn-only):** Borderline agent outputs are logged but not rejected; hallucinations may slip through until explicit thresholds land (Improvement #22).
7. **No Grafana dashboard for integration event outbox metrics:** Dead-letter retry CLI (#5) ships, but operators lack a committed outbox depth / delivery-rate dashboard (Improvement #19).
8. **Custom policy pack authoring SKU decided but not yet published:** SKU matrix approved (Improvement #6) but pricing pages, SoW template, and order-form line items have not landed.
9. **No in-product expansion CTA when tenants approach tier limits:** Existing Team tenants nearing seat or workspace caps see no in-app prompt to upgrade or request a quote.
10. **Marketing pricing quote-request follow-up has no measured SLA:** Rows are written and email goes out, but no committed response-time SLA, aging dashboard, or escalation rule.
11. **No board-pack one-page ROI artifact format:** Executive ROI exists as JSON/CSV; economic buyers lack a committed Markdown/PDF one-pager for steering committees (Improvement #24).

---

## Top 6 Monetization Blockers

V1.1-deferred commercial items (Stripe live-key flip, Marketplace publication, signed design partner, named reference customer, AWS/GCP analysis pricing) are removed per scope rule. The list below is V1-realistic friction that can be addressed inside the current contract.

1. **Executive ROI summary has no board-pack one-page export:** CSV CLI (#9) ships; economic buyers still lack a Markdown/PDF one-pager for steering committees (Improvement #24).
2. **No in-product upgrade nudge from trial to paid:** Usage-based trial upgrade nudge shipped (#14, 2026-05-24); remaining gap is Team→Professional expansion CTA.
3. **No in-product expansion CTA for Team → Professional or seat / workspace adds:** Existing tenants nearing tier ceilings see no expansion prompt; expansion revenue depends entirely on the CSM motion.
4. **Marketing pricing quote-request follow-up has no measured SLA:** `dbo.MarketingPricingQuoteRequests` rows are written and an email goes out, but no committed response-time SLA, no aging dashboard, no escalation rule.
5. **Custom policy pack authoring SKU is decided but not yet published:** Per Improvement #6 — the SKU matrix is approved (Starter / Standard / Program with shared-IP discount) but pricing pages, SoW template, and order-form line items have not landed.
6. **No board-pack one-page ROI artifact format:** Executive ROI exists as JSON; there is no committed Markdown/PDF "one-pager" that economic buyers can paste into a steering committee deck.

---

## Top 6 Enterprise Adoption Blockers

CPA SOC 2 Type II, third-party pen-test publication, automated GDPR tenant erasure, multi-region active/active, and AWS/GCP target analysis are all explicitly out of `(A)` scope per `Assessment-Scope-V1_1.mdc` and `V1_DEFERRED.md` §6c / §6l / §6m / §6n. Procurement realism for those items belongs under `(B)` (informational, zero weight). The list below is V1-realistic enterprise friction.

1. **SAML SP claim-mapping has no interactive pre-flight wizard:** Metadata CLI (#4) and startup validation (#18, 2026-05-24) reduce runtime surprises; implementation engineers still lack a guided claim-mapping UI.
2. **Tier 2 Azure Extractor service-principal provisioning is customer-side manual:** The Tier 1 path is excellent; the Tier 2 opt-in still requires customers to author and review a service-principal setup script, which security reviewers will scrutinize line-by-line.
3. **No Grafana dashboard for integration event outbox metrics:** Dead-letter retry CLI (#5) ships; enterprise ops teams still lack outbox depth / delivery-rate visibility (Improvement #19).
4. **No operator-shipped board-pack ROI export:** Executive ROI JSON/CSV exists; economic buyers lack a one-page Markdown/PDF artifact for steering committees without manual formatting (Improvement #24).
5. **Custom policy pack authoring SKU not yet published on pricing pages:** SKU matrix approved (Improvement #6) but GTM publication incomplete.
6. **No in-product expansion CTA for Team → Professional or seat / workspace adds:** Existing tenants nearing tier ceilings see no expansion prompt; expansion revenue depends entirely on the CSM motion.

---

## Top 10 Engineering Risks

1. **RAG retrieval failures could degrade agent output quality silently:** Without strict faithfulness evaluation, hallucinations may slip through.
2. **Cross-tenant ROI aggregation could leak data:** If RLS or scoping context fails during background aggregation.
3. **AgentResult blob storage could grow unbounded:** Without lifecycle policies or cleanup jobs.
4. **Integration event outbox could fill up:** If downstream customer webhooks fail continuously and dead-lettering is not monitored.
5. **Circuit breakers might trip too aggressively:** During Azure OpenAI latency spikes, causing pipeline timeouts.
6. **The `DataConsistencyOrphanProbe` might miss edge cases:** As new tables are added and not registered with the probe.
7. **`NVARCHAR(64)` run-ID columns block FK integrity and make archive cascade non-SARGable:** `dbo.AgentTasks`, `dbo.AgentExecutionTraces`, `dbo.DecisionTraces`, and related tables store `RunId` as a string instead of `UNIQUEIDENTIFIER`. The archive cascade is forced to `TRY_CAST` every row — a non-SARGable predicate that cannot use an index seek. This grows more expensive as these tables accumulate rows (see Improvement #27).
8. **Missing `RunId`-based index on `dbo.AlertRecords` causes a per-row scan on every run list query:** The `HasGovernanceWarnings` EXISTS subquery fires once per run row and has no `RunId` index path on `dbo.AlertRecords`. For tenants with many active alert records this degrades linearly with table size (see Improvement #26).
9. **Unguarded lateral domain couplings allow hidden transitive dependency creep:** `Decisioning→Notifications`, `Provenance→{ArtifactSynthesis,Decisioning,KnowledgeGraph}`, `Retrieval→{Decisioning,ArtifactSynthesis,Provenance}`, and `AgentRuntime→{Decisioning,Provenance}` are live `ProjectReference` edges with no prohibiting architecture test. Any of these chains can silently deepen — a new `using` statement is the only trigger — and no CI gate will catch it until the architectural boundary has already been crossed (see Improvements #53, #55).
10. **Dead `ProjectReference` entries in `Api.csproj` create latent coupling risk:** `Api.csproj` carries live references to `ArchLucid.Decisioning` and `ArchLucid.KnowledgeGraph` even though no types from those assemblies are consumed by the API. The current `Api_must_not_depend_on_Decisioning` and `Api_must_not_depend_on_KnowledgeGraph` tests pass only at the NetArchTest type-level (IL reference scan); they do not catch that the assemblies are already on the compilation closure. Any future developer can introduce a `using` statement without a build or test failure (see Improvements #53, #54).

---

## Most Important Truth

ArchLucid is ready to ship V1 GA. The remaining `(A)` deficit is concentrated in AI-output trustworthiness — policy-pack indexing, prior-manifest context, and LLM-based faithfulness evaluation are the highest-leverage investments because they raise the ceiling on what every other feature can credibly claim. Everything else on the V1 punch list is operator ergonomics and procurement-friction polish, not GA-blocking work.

---

## Top Improvement Opportunities

### 1. Implement Policy-Pack Indexing for RAG
- **Why it matters:** Agents need deep context of organizational policies to make accurate recommendations.
- **Expected impact:** Directly improves Cutting-Edge AI Technology (+5 pts) and AI/Agent Readiness (+3 pts). Weighted readiness impact: +0.15%.
- **Affected qualities:** Cutting-Edge AI Technology, AI/Agent Readiness.
- **Actionable now:** Yes.
```cursor
Implement policy-pack indexing for the RAG retrieval system as defined in TB-021.
1. Modify `ArchLucid.Retrieval.Index` to ingest active policy packs assigned to the tenant.
2. Create a new `PolicyPackChunker` that splits policy rules into semantic chunks.
3. Store these chunks in the vector store with metadata tagging the policy pack ID and rule ID.
4. Update the `AskService` to include policy-pack chunks in the retrieval context when relevant keywords are detected.
5. Do not modify the existing `TopologyChunker`.
Acceptance Criteria: Policy pack rules are successfully indexed and retrieved during architecture queries.
```

### 2. Implement LLM-Based Faithfulness Evaluation
- **Why it matters:** Heuristic scoring is insufficient for detecting subtle hallucinations in agent outputs.
- **Expected impact:** Directly improves AI/Agent Readiness (+4 pts) and Reliability (+2 pts). Weighted readiness impact: +0.08%.
- **Affected qualities:** AI/Agent Readiness, Reliability.
- **Actionable now:** Yes.
```cursor
Implement an LLM-based faithfulness evaluator for agent outputs.
1. Create `AgentOutputFaithfulnessEvaluator` in `ArchLucid.AgentRuntime.Evaluation`.
2. Use the `IAgentCompletionClient` to prompt the LLM to compare the `ParsedResultJson` against the provided evidence chunks.
3. Emit a new metric `archlucid_agent_output_llm_faithfulness_score` (Histogram).
4. Wire this evaluator into the `AgentOutputTraceQualityEvaluator` pipeline.
5. Ensure it respects the `ArchLucid:AgentOutput:QualityGate:Enabled` configuration.
Acceptance Criteria: Agent outputs are scored for faithfulness using the LLM, and metrics are emitted.
```

### 3. Add Automated Tests for Cross-Tenant ROI Deduplication (completed 2026-05-24)
- **Why it matters:** Inaccurate executive reporting destroys trust with economic buyers.
- **Expected impact:** Directly improves Proof-of-ROI Readiness (+3 pts) and Reliability (+2 pts). Weighted readiness impact: +0.04%.
- **Affected qualities:** Proof-of-ROI Readiness, Reliability.
- **Actionable now:** No (completed).
- **Completed:** 2026-05-24 — `ExecutiveRoiSummaryServiceTests` and `ExecutiveRoiSummaryServiceExtendedTests` cover `GetCrossTenantPortfolioSummaryAsync` dedup, null/empty `FindingId` edge cases, per-system snapshot savings, muted findings, and export rows without stable ids (commit `9758949b1`).
```cursor
Add comprehensive unit and integration tests for `ExecutiveRoiSummaryService` cross-tenant deduplication.
1. In `ArchLucid.Application.Tests`, create `ExecutiveRoiSummaryServiceTests`.
2. Mock `IRunDetailQueryService` to return overlapping findings with the same `FindingId` across multiple runs.
3. Assert that `GetCrossTenantPortfolioSummaryAsync` correctly deduplicates these findings and does not double-count `EstimatedUsdSavings`.
4. Test edge cases where `FindingId` is null or empty (should not deduplicate).
Acceptance Criteria: High test coverage for ROI deduplication logic.
```

### 4. Implement SAML SP Metadata Validation CLI Command (completed 2026-05-24)
- **Why it matters:** Reduces onboarding friction by catching SAML misconfigurations before runtime.
- **Expected impact:** Directly improves Adoption Friction (+4 pts) and Supportability (+2 pts). Weighted readiness impact: +0.06%.
- **Affected qualities:** Adoption Friction, Supportability.
- **Actionable now:** No (completed).
- **Completed:** 2026-05-24 — `archlucid auth validate-saml --metadata <file.xml> --claim-mapping <file.json>` with `SamlIdpMetadataFileDiagnostics` and `IdentityClaimRoleMappingValidator` in Core.
```cursor
Implement a CLI command to validate SAML SP metadata and claim mappings.
1. In the CLI project, add a new command `archlucid auth validate-saml`.
2. Accept a path to an XML metadata file and a JSON claim mapping file.
3. Parse the XML using `System.Security.Cryptography.Xml` or equivalent to verify the signature and endpoints.
4. Validate that the claim mapping JSON matches the expected `ArchLucidRoles` schema.
5. Output a detailed report of warnings and errors.
Acceptance Criteria: CLI successfully parses and validates SAML metadata without requiring a running API host.
```

### 5. Implement Integration Event Outbox Dead-Letter Retry CLI (completed 2026-05-24)
- **Why it matters:** Operators need a way to recover from prolonged downstream webhook failures.
- **Expected impact:** Directly improves Maintainability (+3 pts) and Supportability (+3 pts). Weighted readiness impact: +0.02%.
- **Affected qualities:** Maintainability, Supportability.
- **Actionable now:** No (completed).
- **Completed:** 2026-05-24 — `archlucid integration retry-dead-letter` calls `POST /v1/admin/integrations/outbox/retry-dead-letter`; bulk retry with audit `Integration.OutboxDeadLetterRetried`.
```cursor
Implement a CLI command to retry dead-lettered integration events.
1. In the CLI project, add `archlucid integration retry-dead-letter`.
2. Accept optional arguments `--tenant-id` and `--event-type`.
3. Call a new API endpoint `POST /v1/admin/integrations/outbox/retry-dead-letter` (create this endpoint).
4. The API should move matching rows from `IntegrationEventOutboxDeadLetterRow` back to the active outbox.
5. Emit an audit event `Integration.OutboxDeadLetterRetried`.
Acceptance Criteria: Operators can seamlessly requeue dead-lettered events via the CLI.
```

### 6. Define and Publish Custom Policy Pack Authoring SKUs (resolved 2026-05-24)
- **Why it matters:** Custom policy pack authoring is the highest-margin professional services lever ArchLucid has. Today the offer exists only as a single line in `PRICING_PHILOSOPHY.md` § 8 ("Adds priced separately at Enterprise") — no SKU sizes, no IP terms, no SoW template. Sales cannot quote this without an internal escalation. Publishing fixed-fee tiers with a shared-IP discount also creates a **platform data flywheel**: shared customer packs feed `PlatformDefault` growth (§6j currently has 23 bundles) without proportional engineering investment.
- **Expected impact:** Directly improves Adoption Friction (+3 pts), Proof-of-ROI Readiness (+2 pts), and Executive Value Visibility (+2 pts). Weighted readiness impact: +0.16%. Also unblocks Monetization Blocker #4 from the Top 6 list.
- **Affected qualities:** Adoption Friction, Proof-of-ROI Readiness, Executive Value Visibility, Time-to-Value.
- **Actionable now:** Yes.
- **Owner inputs received (2026-05-24):** Delivery capacity = **owner-confirmed yes**; channel = **owner-delivered only** (no SI partner uplift); IP model = **two-tier with shared-IP discount** (customer-exclusive at full price, ArchLucid-owned/shared at ~37% discount).
```cursor
Define and publish the Custom Policy Pack Authoring professional services SKUs as a productized fixed-fee offer with a two-tier IP model.

Scope of work:

1. Update `docs/go-to-market/PRICING_PHILOSOPHY.md`:
   - Add a new section `### 4.2 Custom Policy Pack Authoring (professional services)` directly after § 4.1 (Reference-customer discount).
   - Document the SKU matrix below. Place the dollar figures inside the same single-source-of-truth zone enforced by `scripts/ci/check_pricing_single_source.py`.
   - Cross-link to `docs/library/V1_DEFERRED.md` §6j (default bundled policy packs) and to the new SoW template (see step 3).
   - Add a one-sentence note under § 8 ("What is NOT included") clarifying that custom policy pack authoring is now a productized PS SKU, not a bespoke quote.

2. SKU matrix to publish (verbatim):

   | SKU | Customer-exclusive | ArchLucid-owned (shared) | Scope | Delivery window | Post-delivery support |
   |-----|-------------------|--------------------------|-------|------------------|----------------------|
   | Custom Pack — Starter | [see Pricing §5](../go-to-market/PRICING_PHILOSOPHY.md#5) | $9,500 | 1 pack, up to 20 rules | 4 weeks | 30 days |
   | Custom Pack — Standard | $40,000 | $25,000 | Up to 3 packs OR 1 pack with 50+ rules | 8 weeks | 90 days |
   | Custom Pack — Program | $100,000+ | $65,000+ | Multi-pack engagement, dedicated PS lead, quarterly refresh | Negotiated | Annual |

   - Annual maintenance: **20% of original authoring fee**, OR bundled into Enterprise contracts at or above $150,000 ARR.
   - Engagements are **owner-delivered only** (no SI / partner channel for V1).
   - Discounts on these SKUs do **not** stack with the §4.1 reference-customer 15% discount.

3. Create `docs/go-to-market/CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md`:
   - Cover: scope phases (Discovery, Authoring, Validation, Acceptance), deliverables (rule keys, severity, advisory text, validation report), in-scope/out-of-scope language.
   - **IP-rights table** with exactly two rows (customer-exclusive vs ArchLucid-owned):
     - Customer unlimited internal use: BOTH
     - ArchLucid uses generalized patterns in other engagements: exclusive=No, shared=Yes
     - ArchLucid incorporates patterns into `PlatformDefault`: exclusive=No, shared=Yes (at ArchLucid discretion)
     - ArchLucid sells the same pack verbatim to a direct competitor of the customer: BOTH=No (only generalized patterns flow under shared)
     - Customer receives bug-fix updates from generalized improvements: exclusive=No, shared=Yes
   - Acceptance criteria: validation run produces ≤ agreed false-positive rate against customer's most recent committed manifest.
   - Maintenance addendum section.
   - Termination / IP-revert language.

4. Update `docs/go-to-market/ORDER_FORM_TEMPLATE.md`:
   - Add a new line-item block "Custom Policy Pack Authoring (Professional Services)" with the three SKU rows above and an IP-tier selector field.
   - Make sure the totals math example still parses through any existing CI checks.

5. Update CI:
   - Extend `scripts/ci/check_pricing_single_source.py` (or add to its allowlist) so the new SKU figures are recognized as canonical.
   - If a `scripts/ci/assert_marketplace_pricing_alignment.py` check exists for SaaS tiers, leave it untouched — these SKUs are PS, not Marketplace tiers.

6. Add a short paragraph to `docs/go-to-market/CUSTOMER_ONBOARDING_PLAYBOOK.md` describing when to position custom pack authoring (after the first committed manifest reveals consistent custom-policy gaps in the customer's evidence chain).

Constraints:
- Do **not** modify `docs/library/V1_DEFERRED.md` §6j default bundle count (still 23 packs) — custom authoring is a separate offer, not a default-pack expansion.
- Do **not** add custom-pack authoring as a per-tenant feature flag in `ArchLucid:Governance` configuration — this is a service motion, not a product surface.
- Do **not** introduce a sales-credit-on-conversion mechanic (unlike the $15K guided pilot — this is delivered value, not pilot-acceleration economics).
- Keep all dollar figures inside the canonical pricing single-source-of-truth files only.

Acceptance criteria:
- `PRICING_PHILOSOPHY.md` § 4.2 published with the SKU matrix and IP model.
- SoW template committed at `docs/go-to-market/CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md`.
- `ORDER_FORM_TEMPLATE.md` includes the new line-item block.
- All existing pricing single-source CI checks pass.
- Owner onboarding playbook references the new SKU with a positioning paragraph.

Track this KPI for re-rate at the §5.3 cadence: **share-rate** (% of engagements electing ArchLucid-owned). Target window 40%–60% over the first 12 months; outside that window triggers a discount re-tune.
```

### 7. Add Telemetry for RAG Retrieval Latency and Chunk Counts
- **Why it matters:** Essential for monitoring the performance and cost of the retrieval pipeline.
- **Expected impact:** Directly improves Supportability (+4 pts) and Maintainability (+2 pts). Weighted readiness impact: +0.02%.
- **Affected qualities:** Supportability, Maintainability.
- **Actionable now:** Yes.
```cursor
Add OpenTelemetry metrics for RAG retrieval operations.
1. In `ArchLucidInstrumentation.cs`, add `archlucid_rag_retrieval_duration_ms` (Histogram) and `archlucid_rag_chunks_retrieved_total` (Histogram).
2. Instrument the `AskService` and any vector store clients to record the duration of the search query.
3. Record the number of chunks returned by the vector store.
4. Add tags for `corpus_kind` and `tenant_id` (if cardinality allows).
Acceptance Criteria: RAG latency and chunk counts are visible in Prometheus/Grafana.
```

### 8. Implement Automated Cleanup for Orphaned AgentResult Blobs
- **Why it matters:** Prevents unbounded growth of Azure Blob Storage costs.
- **Expected impact:** Directly improves Maintainability (+4 pts) and Reliability (+2 pts). Weighted readiness impact: +0.03%.
- **Affected qualities:** Maintainability, Reliability.
- **Actionable now:** Yes.
```cursor
Implement a background hosted service to clean up orphaned AgentResult blobs.
1. Create `AgentResultBlobCleanupHostedService` that runs daily.
2. Query `IArtifactBlobStore` for blobs older than 30 days.
3. Check if the corresponding `runId` exists in `dbo.Runs`.
4. If the run does not exist (e.g., deleted or orphaned), delete the blobs.
5. Emit a metric `archlucid_data_archival_blobs_deleted_total`.
6. Ensure this respects a configuration toggle `DataArchival:BlobCleanup:Enabled`.
Acceptance Criteria: Orphaned blobs are automatically deleted, reducing storage costs.
```

### 9. Implement Executive ROI Summary CSV Export CLI (completed 2026-05-24)
- **Why it matters:** Executives need portable reports for board packs.
- **Expected impact:** Directly improves Executive Value Visibility (+5 pts) and Proof-of-ROI Readiness (+2 pts). Weighted readiness impact: +0.07%.
- **Affected qualities:** Executive Value Visibility, Proof-of-ROI Readiness.
- **Actionable now:** No (completed).
- **Completed:** 2026-05-24 — `archlucid roi export [--out <file.csv>]` calls `GET /v1/roi/executive-summary/export` and writes timestamped CSV.
```cursor
Implement a CLI command to export the Executive ROI summary as a CSV.
1. In the CLI project, add `archlucid roi export`.
2. Call the existing `GET /v1/roi/executive-summary/export` endpoint (ensure this endpoint exists and returns the `ExecutiveRoiExportResponse`).
3. Format the `Rows` array into a CSV file.
4. Save the file to the local disk with a timestamped filename.
Acceptance Criteria: Operators can generate a CSV report of ROI savings directly from the CLI.
```

### 10. Add Health Check for Vector Store / Search Service (completed 2026-05-24)
- **Why it matters:** Prevents silent failures in the RAG pipeline.
- **Expected impact:** Directly improves Reliability (+3 pts) and Supportability (+3 pts). Weighted readiness impact: +0.02%.
- **Affected qualities:** Reliability, Supportability.
- **Actionable now:** No (completed).
- **Completed:** 2026-05-24 — `VectorStoreHealthCheck` registered as `vector_store` on `/health/ready`; InMemory healthy; Azure Search misconfiguration reports degraded unless `Retrieval:VectorStoreHealthCheck:FailReadinessWhenUnavailable=true`.
```cursor
Add a health check for the RAG vector store.
1. Create `VectorStoreHealthCheck` implementing `IHealthCheck`.
2. Perform a lightweight ping or status query against the configured vector store (e.g., Azure AI Search).
3. Register this check in `Startup/ServiceCollectionExtensions.HealthChecks.cs`.
4. Tag it appropriately so it appears in `/health/ready` but not necessarily `/health/live`.
Acceptance Criteria: API readiness fails if the vector store is unreachable.
```

### 11. Document and Enforce Sales Response SLA for Pricing Quote Requests
- **Why it matters:** `dbo.MarketingPricingQuoteRequests` rows are persisted today and an inbox email is sent, but no committed response-time SLA, aging dashboard, or escalation path exists. Sales-led is the V1 contract — execution quality of the sales-led path is the missing piece.
- **Expected impact:** Directly improves Adoption Friction (+2 pts) and Time-to-Value (+2 pts). Weighted readiness impact: +0.06%.
- **Affected qualities:** Adoption Friction, Time-to-Value.
- **Actionable now:** Yes.
```cursor
Document and enforce a sales response-time SLA for marketing pricing quote requests.
1. Add to `docs/runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md` (or create if necessary) a committed "Sales acknowledgement SLA" section: target first human response within 1 business day (24 hours weekdays UTC), full quote within 3 business days.
2. Add a SQL view `dbo.MarketingPricingQuoteRequestsAging` exposing rows with `CreatedUtc`, age in hours, and a derived `BreachStatus` ("ok" / "warn at 18h" / "breach at 24h").
3. Add an operator admin endpoint `GET /v1/admin/marketing/pricing-quote-aging` returning the aging view.
4. Add a Prometheus instrument `archlucid_pricing_quote_request_age_hours` (Histogram) populated by a background hosted service that snapshots the aging view every 5 minutes.
5. Add a Prometheus alert `ArchLucidPricingQuoteAcknowledgementBreach` that fires when any row exceeds 24 hours unanswered.
Constraints: do not auto-respond to the buyer; this is sales-team operational hygiene, not a buyer-facing change. Do not modify existing columns on `MarketingPricingQuoteRequests`.
Acceptance Criteria: aging view + endpoint + metric + alert all wired and documented; alert fires correctly against a synthetic stale row.
```

### 12. Add Grafana Panel for Executive ROI Summary Metrics
- **Why it matters:** Provides operators with real-time visibility into the value being delivered to tenants.
- **Expected impact:** Directly improves Supportability (+2 pts) and Executive Value Visibility (+2 pts). Weighted readiness impact: +0.01%.
- **Affected qualities:** Supportability, Executive Value Visibility.
- **Actionable now:** Yes.
```cursor
Add a Grafana panel for Executive ROI metrics.
1. Edit `infra/grafana/dashboard-archlucid-authority.json`.
2. Add a new row for "Business Value".
3. Add panels displaying the sum of `archlucid_findings_produced_total` weighted by severity.
4. Note: Actual USD savings are calculated at runtime, so proxy this in Grafana using finding counts, or emit a new gauge `archlucid_tenant_estimated_savings_usd` from a background job.
Acceptance Criteria: Dashboard shows directional business value metrics.
```

### 13. Implement Fallback Mechanism for RAG Search Service (completed 2026-05-24)
- **Why it matters:** Ensures the application remains partially functional even if the vector store is down.
- **Expected impact:** Directly improves Reliability (+4 pts) and AI/Agent Readiness (+2 pts). Weighted readiness impact: +0.05%.
- **Affected qualities:** Reliability, AI/Agent Readiness.
- **Actionable now:** No (completed).
- **Completed:** 2026-05-24 — `AskRetrievalSqlFallback` keyword overlap over findings/decisions; `AskService` catches vector failures, emits `archlucid_rag_retrieval_fallback_total`, and appends degraded-context warning to the prompt.
```cursor
Implement a fallback mechanism for the RAG `AskService`.
1. Modify `AskService` to catch exceptions from the vector store client.
2. If the vector store fails, fall back to querying the SQL database for recent `FindingsSnapshots` and `Manifests` using standard text search or exact matches.
3. Emit a metric `archlucid_rag_retrieval_fallback_total`.
4. Append a warning to the LLM prompt indicating that context may be incomplete due to search degradation.
Acceptance Criteria: The Ask feature degrades gracefully instead of throwing 500 errors when the vector store is offline.
```

### 14. Implement Usage-Based In-Product Upgrade Nudge for Trial Tenants (completed 2026-05-24)
- **Why it matters:** Trial tenants approaching their run / seat caps get no in-app conversion prompt today. Sales-led is the V1 contract for *closing*, but in-product nudges that surface the right moment to engage sales are still V1-additive and do not depend on Stripe live-key flip.
- **Expected impact:** Directly improves Time-to-Value (+3 pts) and Adoption Friction (+2 pts). Weighted readiness impact: +0.07%.
- **Affected qualities:** Time-to-Value, Adoption Friction.
- **Actionable now:** No (completed).
- **Completed:** 2026-05-24 — `TrialUsageUpgradeNudge` in operator shell; `/pricing?source=trial-nudge` quote-first Team CTA; Prometheus counters and audit events for shown/clicked.
```cursor
Implement an in-product upgrade nudge for trial tenants approaching their limits.
1. In `archlucid-ui`, add a new component `TrialUsageUpgradeNudge` that displays in the operator shell when:
   - Trial run usage ≥ 70% of allotted runs, OR
   - Active seats ≥ 80% of trial seat cap, OR
   - Trial expiry < 7 days.
2. CTA links to `/pricing` with a query parameter `?source=trial-nudge&trigger={runs|seats|expiry}`.
3. On the marketing `/pricing` page, when `source=trial-nudge` query param is present, pre-select the "Request quote" CTA over "Subscribe (Stripe test)" — sales-led is the V1 contract.
4. Emit a Prometheus counter `archlucid_trial_upgrade_nudge_shown_total{trigger}` and a click counter `archlucid_trial_upgrade_nudge_clicked_total{trigger}`.
5. Audit `TrialUpgradeNudgeShown` and `TrialUpgradeNudgeClicked` for funnel analysis.
Constraints: do not show the nudge more than once per session per trigger; respect dismissal for 24 hours; do not modify pricing logic; do not enable live Stripe checkout (commerce un-hold is V1.1 per §6b).
Acceptance Criteria: nudge appears at the right thresholds, click flow lands on `/pricing` with quote request preselected, telemetry emits.
```

### 15. Add CLI Command to Simulate Webhook Payloads (completed 2026-05-24)
- **Why it matters:** Crucial for testing and debugging customer integration bridges.
- **Expected impact:** Directly improves Supportability (+4 pts) and Maintainability (+2 pts). Weighted readiness impact: +0.02%.
- **Affected qualities:** Supportability, Maintainability.
- **Actionable now:** No (completed).
- **Completed:** 2026-05-24 — `archlucid integration simulate-webhook --event-type <alias> --target-url <url>` with `IntegrationWebhookPayloadSamples` synthetic payloads.
```cursor
Implement a CLI command to simulate outbound webhook payloads.
1. In the CLI project, add `archlucid integration simulate-webhook`.
2. Accept `--event-type` (e.g., `RunCommitted`) and `--target-url`.
3. Generate a synthetic payload matching the Authority-shaped event schema.
4. Send the POST request to the target URL and print the HTTP response code and body.
Acceptance Criteria: Operators can test webhook endpoints without triggering actual architecture runs.
```

### 16. Implement Background Job to Warm Up Executive ROI Cache (completed 2026-05-24)
- **Why it matters:** Prevents slow initial page loads for executives viewing the dashboard.
- **Expected impact:** Directly improves Executive Value Visibility (+3 pts) and Reliability (+1 pts). Weighted readiness impact: +0.03%.
- **Affected qualities:** Executive Value Visibility, Reliability.
- **Actionable now:** No (completed).
- **Completed:** 2026-05-24 — `CachingExecutiveRoiSummaryService` + leader-elected `ExecutiveRoiCacheWarmupHostedService` with `ExecutiveRoi:CacheWarmup` options; tenant-scoped warmup via `AmbientScopeContext`.
```cursor
Implement a background job to pre-warm the Executive ROI summary cache.
1. Create `ExecutiveRoiCacheWarmupHostedService`.
2. Run daily or after significant run commits.
3. Call `ExecutiveRoiSummaryService.BuildAsync` for active tenants and store the result in `IHotPathReadCache`.
4. Ensure cache invalidation logic is updated when new runs are committed.
Acceptance Criteria: Executive ROI dashboard loads instantly from cache.
```

### 17. Publish Hosted Enterprise Onboarding Checklist (ArchLucid-hosted SaaS) (completed 2026-05-24)
- **Why it matters:** V1 GA Enterprise is **hosted SaaS only** — self-hosted Enterprise deals are **V2** per [`V1_DEFERRED.md` §6t](../library/V1_DEFERRED.md). Implementation teams still need one checklist that wires SCIM, SAML/OIDC, default policy packs, governance enablement, and audit export for **hosted** Enterprise tenants — today these live in separate docs.
- **Expected impact:** Directly improves Adoption Friction (+2 pts) and Time-to-Value (+2 pts). Weighted readiness impact: +0.05%.
- **Affected qualities:** Adoption Friction, Time-to-Value.
- **Actionable now:** No (completed).
- **Completed:** 2026-05-24 — [`HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md`](../library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md) with cross-links from onboarding playbook and procurement FAQ.
```cursor
Publish a hosted Enterprise onboarding checklist for ArchLucid-operated SaaS (not self-hosted).
1. Create `docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md`.
2. Cover in order: tenant provisioning, SCIM bearer + group→role mapping, SAML SP or OIDC workforce SSO choice, default policy pack assignments (cite DEFAULT_POLICY_PACKS_V1.md), governance approvals + pre-commit gate enablement, audit export path, and pilot success criteria link (PILOT_SUCCESS_SCORECARD.md).
3. Explicitly state this checklist is for **ArchLucid-hosted SaaS Enterprise** — self-hosted Enterprise deals are V2 per V1_DEFERRED.md §6t; do not include customer-VNet Terraform steps.
4. Cross-link from CUSTOMER_ONBOARDING_PLAYBOOK.md and PROCUREMENT_FAQ.md.
Constraints: documentation only; do not promise self-hosted deployment steps; do not modify V1_SCOPE.md §3 in this prompt unless a single cross-link sentence is required.
Acceptance Criteria: an implementation engineer can onboard a hosted Enterprise tenant from this checklist without hunting five separate integration docs.
```

### 18. Implement Configuration Validation Rule for SAML SP Settings (completed 2026-05-24)
- **Why it matters:** Prevents the application from starting with invalid or insecure SAML configurations.
- **Expected impact:** Directly improves Reliability (+3 pts) and Adoption Friction (+2 pts). Weighted readiness impact: +0.04%.
- **Affected qualities:** Reliability, Adoption Friction.
- **Actionable now:** No (completed).
- **Completed:** 2026-05-24 — `CollectSamlSpWhenEnabled` in `AuthenticationRules`; wired via `ArchLucidConfigurationRules` when `ArchLucidAuth:Mode` is `SamlSp`.
```cursor
Implement startup validation for SAML SP configuration.
1. Create `SamlSpConfigurationRules` implementing `IStartupValidationRule`.
2. If `ArchLucidAuth:Mode` is `SamlSp`, verify that `AssertionConsumerServiceUrl`, `EntityId`, and `IdpMetadataUrl` are populated.
3. Verify that the configured certificate path exists and is readable.
4. Emit a `[HostingMisconfiguration]` warning or throw if critical settings are missing.
Acceptance Criteria: Application fails fast or warns clearly if SAML SP is misconfigured.
```

### 19. Add Grafana Dashboard for Integration Event Outbox Metrics
- **Why it matters:** Provides visibility into integration health and webhook delivery success rates.
- **Expected impact:** Directly improves Supportability (+4 pts) and Reliability (+2 pts). Weighted readiness impact: +0.02%.
- **Affected qualities:** Supportability, Reliability.
- **Actionable now:** Yes.
```cursor
Add a Grafana dashboard for the integration outbox.
1. Create `infra/grafana/dashboard-archlucid-integrations.json`.
2. Add panels for `archlucid_integration_event_outbox_depth` (Gauge).
3. Add panels for `archlucid_integration_event_delivery_success_total` and `_failed_total` (Counters).
4. Add a panel for `archlucid_integration_event_outbox_dead_letter` (Gauge).
Acceptance Criteria: Operators have a dedicated dashboard for monitoring webhook and integration health.
```

### 20. Document Audit Retention Extension Contract for Enterprise Auditors (completed 2026-05-24)
- **Why it matters:** Auditors routinely ask for retention beyond the per-tier defaults (Team 90 days, Professional 1 year, Enterprise custom). Today there is no single published contract describing how to extend retention, what storage implications apply, and what audit export guarantees exist — creating procurement friction on every Enterprise deal.
- **Expected impact:** Directly improves Adoption Friction (+2 pts) and Executive Value Visibility (+1 pt). Weighted readiness impact: +0.05%.
- **Affected qualities:** Adoption Friction, Executive Value Visibility.
- **Actionable now:** No (completed).
- **Completed:** 2026-05-24 — [`AUDIT_RETENTION_EXTENSION.md`](../library/AUDIT_RETENTION_EXTENSION.md) with cross-links from procurement FAQ, trust center, and order form template.
```cursor
Document the audit retention extension contract for Enterprise auditors.
1. Create `docs/library/AUDIT_RETENTION_EXTENSION.md` describing:
   - Per-tier default retention (cite `PRICING_PHILOSOPHY.md` feature gates).
   - Extension options for Enterprise: custom retention window, CSV export cadence, cold-storage posture (Azure Blob lifecycle tiers).
   - Operator steps: which configuration keys or support requests enable extended retention.
   - Cost and storage implications (directional; mark estimates explicitly).
2. Add a cross-link from `docs/go-to-market/PROCUREMENT_FAQ.md` and `docs/go-to-market/TRUST_CENTER.md`.
3. Add a short paragraph to `docs/go-to-market/ORDER_FORM_TEMPLATE.md` Enterprise addendum referencing extended audit retention as an optional line item.
Constraints: do not implement new retention enforcement code in this prompt — documentation only unless a minimal config key already exists and is undocumented. Do not promise 7-year retention as a default; frame as Enterprise-negotiated extension.
Acceptance Criteria: a security reviewer can answer "how do we get 7-year audit retention?" from this single doc without opening a support ticket.
```

### 21. Implement CLI Command to Generate Compliance Drift Report (completed 2026-05-24)
- **Why it matters:** Auditors need point-in-time snapshots of compliance posture.
- **Expected impact:** Directly improves Executive Value Visibility (+3 pts) and Maintainability (+2 pts). Weighted readiness impact: +0.04%.
- **Affected qualities:** Executive Value Visibility, Maintainability.
- **Actionable now:** No (completed).
- **Completed:** 2026-05-24 — `archlucid compliance export-drift --start-date <utc> --end-date <utc>` queries `GET /v1/governance/compliance-drift-trend` and writes CSV or Markdown.
```cursor
Implement a CLI command to generate a compliance drift report.
1. In the CLI project, add `archlucid compliance export-drift`.
2. Accept `--start-date` and `--end-date`.
3. Query the API for compliance drift metrics (ensure an endpoint exists or create one that aggregates audit events related to policy changes).
4. Output a formatted Markdown or CSV report showing policy violations over time.
Acceptance Criteria: Operators can easily generate compliance drift reports for auditors.
```

### 22. Add Explicit Reject Thresholds to AgentOutputQualityGate
- **Why it matters:** Warn-only gates do not prevent bad data from entering the system; explicit thresholds enforce quality.
- **Expected impact:** Directly improves AI/Agent Readiness (+4 pts) and Reliability (+3 pts). Weighted readiness impact: +0.09%.
- **Affected qualities:** AI/Agent Readiness, Reliability.
- **Actionable now:** Yes.
```cursor
Add explicit reject thresholds to `AgentOutputQualityGate`.
1. Update `AgentOutputQualityGateOptions` to include `RejectThresholdSemanticScore` (e.g., 0.4).
2. Modify `AgentOutputQualityGate.EvaluateAsync` to return a `Rejected` outcome if the score falls below the threshold.
3. Ensure the orchestrator handles the `Rejected` outcome by retrying the agent or failing the run gracefully.
4. Update the default `appsettings.json` to keep these thresholds at 0 (warn-only) for backward compatibility, but document how to enable them.
Acceptance Criteria: The quality gate can actively reject and retry poor agent outputs.
```

### 23. Implement Tenant Prior-Manifest Chunks for RAG
- **Why it matters:** Agents need historical context of the architecture to understand evolution and intent.
- **Expected impact:** Directly improves Cutting-Edge AI Technology (+4 pts) and AI/Agent Readiness (+3 pts). Weighted readiness impact: +0.13%.
- **Affected qualities:** Cutting-Edge AI Technology, AI/Agent Readiness.
- **Actionable now:** Yes.
```cursor
Implement prior-manifest chunking for the RAG retrieval system.
1. Create `PriorManifestChunker` that extracts key decisions and topology changes from previous `GoldenManifests` for the same system.
2. Index these chunks into the vector store with a `corpus_kind` of `PriorManifest`.
3. Update the `AskService` to boost the relevance of prior-manifest chunks when the user asks about historical decisions.
Acceptance Criteria: Agents can accurately answer questions about why an architecture changed over time.
```

### 24. Implement Board-Pack ROI One-Pager Export
- **Why it matters:** The Executive ROI summary endpoint returns rich JSON, but economic buyers do not paste JSON into steering committee decks. A committed Markdown/PDF one-pager with the top systemic issues, total estimated USD savings, and the latest-run-per-system table is the artifact that moves expansion deals forward.
- **Expected impact:** Directly improves Executive Value Visibility (+4 pts) and Proof-of-ROI Readiness (+2 pts). Weighted readiness impact: +0.06%.
- **Affected qualities:** Executive Value Visibility, Proof-of-ROI Readiness.
- **Actionable now:** Yes.
```cursor
Implement a board-pack one-pager export for Executive ROI.
1. Add API endpoint `GET /v1/roi/executive-summary/board-pack?format={md|pdf}` (default md).
2. The endpoint composes a single-page report from `ExecutiveRoiSummaryService.BuildAsync()`:
   - Header: tenant display name, generated UTC timestamp, system count.
   - Hero number: `TotalEstimatedUsdSavings` formatted as $X,XXX.
   - Top 5 systemic issues (Category × Severity × Count).
   - Per-system table: latest committed run, committed UTC, estimated savings.
   - Footer: trace ID for support attribution.
3. For Markdown, return inline.
4. For PDF, render via a deterministic Markdown→PDF library (verify availability; if uncertain, ship Markdown only and document PDF as a follow-on).
5. Add CLI `archlucid roi board-pack --format md|pdf --out <path>`.
6. Audit `ExecutiveRoiBoardPackExported`.
Constraints: do not introduce any new LLM call on this path — the data already exists; this is formatting only. Do not bypass tenant scoping. Do not include muted findings.
Acceptance Criteria: operator can produce a board-ready Markdown export in under 2 seconds; PDF if shipped is deterministic byte-for-byte for the same inputs.
```

### 25. Add Telemetry for LLM Prompt Redactions
- **Why it matters:** Operators need visibility into how often content safety rules are modifying prompts.
- **Expected impact:** Directly improves Supportability (+3 pts) and AI/Agent Readiness (+2 pts). Weighted readiness impact: +0.04%.
- **Affected qualities:** Supportability, AI/Agent Readiness.
- **Actionable now:** Yes.
```cursor
Ensure comprehensive telemetry for LLM prompt redactions.
1. Verify that `archlucid_llm_prompt_redactions_total` is being emitted correctly in `ContentSafetyEnforcingAgentCompletionClient`.
2. Add a Grafana panel in `dashboard-archlucid-llm-usage.json` to track redaction rates by category.
3. Add a Prometheus alert `ArchLucidHighPromptRedactionRate` if redactions exceed a certain threshold, indicating a potential prompt injection attack or overly aggressive safety rules.
Acceptance Criteria: Redaction events are fully observable and alertable.
```

### 26. Add Filtered Covering Indexes for Hot-Path Run List Correlated Subqueries
- **Why it matters:** Every run list query — `ListByProjectAsync`, `ListRecentInScopeAsync`, and all keyset variants — evaluates two per-row EXISTS subqueries (`HasWarnings`, `HasGovernanceWarnings`). `dbo.FindingsSnapshots` has only a plain `(RunId)` index that cannot cover the `ArchivedUtc IS NULL AND HasWarnings = 1` filter without a key lookup. `dbo.AlertRecords` has **no `RunId` index at all** — the subquery either scans or uses the scope+status composite index at the wrong leading column. For a list returning 50 runs this fires up to 100 extra seeks/scans per request. Additionally, the covering index `IX_Runs_Scope_CreatedUtc` is missing `IsPinned`, `IsSample`, `RetryCount`, and `LastFailureReason` from its INCLUDE list, forcing key lookups on every covered list query. Three FK constraints on `dbo.FindingsSnapshots` were added `WITH NOCHECK` and are therefore not trusted — the query optimizer cannot eliminate joins using them.
- **Expected impact:** Directly improves Reliability (+1 pt) and Maintainability (+1 pt) via reduced hot-path latency. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability, Maintainability.
- **Actionable now:** Yes.
```cursor
Add filtered covering indexes and fix the IX_Runs_Scope_CreatedUtc INCLUDE list to eliminate hot-path key lookups on run list queries.

Changes required in ArchLucid.Persistence/Scripts/ArchLucid.sql (master greenfield DDL) and a new forward migration:

1. Create migration NNN_HotPathListIndexes.sql:

   -- Filtered index: resolves HasWarnings EXISTS in a single seek
   IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_FindingsSnapshots_HasWarnings_RunId'
                    AND object_id = OBJECT_ID(N'dbo.FindingsSnapshots'))
       CREATE NONCLUSTERED INDEX IX_FindingsSnapshots_HasWarnings_RunId
           ON dbo.FindingsSnapshots (RunId)
           WHERE ArchivedUtc IS NULL AND HasWarnings = 1;

   -- Filtered index: resolves HasGovernanceWarnings EXISTS in a single seek
   IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AlertRecords_RunId_Open'
                    AND object_id = OBJECT_ID(N'dbo.AlertRecords'))
       CREATE NONCLUSTERED INDEX IX_AlertRecords_RunId_Open
           ON dbo.AlertRecords (RunId)
           WHERE Status = N'Open';

2. Add the four missing columns to IX_Runs_Scope_CreatedUtc INCLUDE in the same migration:
   DROP INDEX IF EXISTS IX_Runs_Scope_CreatedUtc ON dbo.Runs;
   CREATE NONCLUSTERED INDEX IX_Runs_Scope_CreatedUtc
       ON dbo.Runs (TenantId, WorkspaceId, ScopeProjectId, CreatedUtc DESC)
       INCLUDE (
           RunId, ProjectId, Description,
           ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
           GoldenManifestId, DecisionTraceId, ArtifactBundleId,
           ArchitectureRequestId, LegacyRunStatus, CompletedUtc, CurrentManifestVersion,
           OtelTraceId, IsDemoWelcomeRun, IsPublicShowcase, IsPinned, IsSample,
           RealModeFellBackToSimulator, PilotAoaiDeploymentSnapshot,
           StructuralExecutionMode, RetryCount, LastFailureReason)
       WHERE ArchivedUtc IS NULL;

3. Re-trust the three FindingsSnapshots FK constraints (run only after verifying no orphaned rows exist):
   ALTER TABLE dbo.FindingsSnapshots WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_Runs_RunId;
   ALTER TABLE dbo.FindingsSnapshots WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId;
   ALTER TABLE dbo.FindingsSnapshots WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_GraphSnapshots_GraphSnapshotId;

4. Sync all three changes into ArchLucid.Persistence/Scripts/ArchLucid.sql (master DDL) in the same PR.

5. Add rollback migration R-NNN_HotPathListIndexes.sql that drops the two new filtered indexes and restores the prior IX_Runs_Scope_CreatedUtc definition.

Constraints:
- Do not change any C# repository code — only schema.
- Do not create the indexes as UNIQUE.
- Do not change RLS or grant/deny scripts.

Acceptance Criteria: SQL plan for ListByProjectAsync shows index seeks (not scans) on FindingsSnapshots and AlertRecords for the EXISTS predicates; IX_Runs_Scope_CreatedUtc covers all columns returned by HotPathRelationalQueryShapes without a key lookup; all three FindingsSnapshots FKs are marked is_not_trusted = 0 in sys.foreign_keys.
```

### 27. Migrate NVARCHAR(64) Run-ID Columns to UNIQUEIDENTIFIER for FK Integrity
- **Why it matters:** Eight tables store run IDs as `NVARCHAR(64)` despite `dbo.Runs.RunId` being `UNIQUEIDENTIFIER`: `dbo.AgentTasks`, `dbo.AgentResults`, `dbo.AgentExecutionTraces`, `dbo.DecisionTraces`, `dbo.AgentEvidencePackages`, `dbo.ArchitectureRunIdempotency`, `dbo.CommitRunIdempotency`, and `dbo.ProductLearningPilotSignals` (`ArchitectureRunId`). This prevents direct FK constraints, forces `TRY_CAST(RunId AS UNIQUEIDENTIFIER)` in the archive cascade (a non-SARGable predicate that scans every row), and blocks cascade-delete semantics. `CommitRunIdempotency.RunId` is embedded in the PK — its existing `CK_CommitRunIdempotency_RunIdLen CHECK (LEN(RunId) > 0)` constraint is a visible workaround for the missing type safety.
- **Expected impact:** Directly improves Reliability (+2 pts) and Maintainability (+1 pt). Eliminates the `TRY_CAST` full-table scans in the archive path. Weighted readiness impact: +0.02%.
- **Affected qualities:** Reliability, Maintainability.
- **Actionable now:** Yes.
```cursor
Migrate NVARCHAR(64) RunId columns in eight tables to UNIQUEIDENTIFIER and establish FK constraints back to dbo.Runs.

Affected tables:
  dbo.AgentTasks              — RunId column
  dbo.AgentResults            — RunId column
  dbo.AgentExecutionTraces    — RunId column
  dbo.DecisionTraces          — RunId column
  dbo.AgentEvidencePackages   — RunId column
  dbo.ArchitectureRunIdempotency — RunId column (NOT in PK; straightforward rename)
  dbo.CommitRunIdempotency    — RunId column (IN composite PK: requires PK drop + recreate)
  dbo.ProductLearningPilotSignals — ArchitectureRunId column (NULLABLE; simpler migration)

For dbo.AgentTasks, dbo.AgentResults, dbo.AgentExecutionTraces, dbo.DecisionTraces,
dbo.AgentEvidencePackages, and dbo.ArchitectureRunIdempotency follow the standard pattern:

Step 1 — Add the new typed column (nullable during backfill):
    ALTER TABLE dbo.<TableName> ADD RunIdGuid UNIQUEIDENTIFIER NULL;

Step 2 — Backfill:
    UPDATE dbo.<TableName>
    SET RunIdGuid = TRY_CAST(RunId AS UNIQUEIDENTIFIER)
    WHERE RunIdGuid IS NULL;

Step 3 — Verify no nulls remain (abort migration if any):
    IF EXISTS (SELECT 1 FROM dbo.<TableName> WHERE RunIdGuid IS NULL AND RunId IS NOT NULL)
        THROW 50000, 'Backfill incomplete — orphaned RunId strings found.', 1;

Step 4 — Apply NOT NULL constraint:
    ALTER TABLE dbo.<TableName> ALTER COLUMN RunIdGuid UNIQUEIDENTIFIER NOT NULL;

Step 5 — Drop old column and rename:
    DROP INDEX IF EXISTS IX_<TableName>_RunId ON dbo.<TableName>;
    ALTER TABLE dbo.<TableName> DROP COLUMN RunId;
    EXEC sp_rename N'dbo.<TableName>.RunIdGuid', N'RunId', N'COLUMN';
    CREATE NONCLUSTERED INDEX IX_<TableName>_RunId ON dbo.<TableName> (RunId);

Step 6 — Add FK:
    ALTER TABLE dbo.<TableName> WITH NOCHECK
        ADD CONSTRAINT FK_<TableName>_Runs_RunId FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);

For dbo.CommitRunIdempotency (RunId is in the composite PK):
  - Add RunIdGuid UNIQUEIDENTIFIER NULL; backfill; verify; apply NOT NULL.
  - DROP CONSTRAINT PK_CommitRunIdempotency.
  - DROP COLUMN RunId; sp_rename RunIdGuid → RunId.
  - DROP CONSTRAINT CK_CommitRunIdempotency_RunIdLen (now superseded by type safety).
  - RECREATE PK_CommitRunIdempotency on (TenantId, WorkspaceId, ProjectId, RunId, IdempotencyKeyHash).
  - Add FK to dbo.Runs.

For dbo.ProductLearningPilotSignals.ArchitectureRunId (NULLABLE):
  - ADD ArchitectureRunIdGuid UNIQUEIDENTIFIER NULL.
  - UPDATE SET ArchitectureRunIdGuid = TRY_CAST(ArchitectureRunId AS UNIQUEIDENTIFIER).
  - DROP COLUMN ArchitectureRunId; sp_rename ArchitectureRunIdGuid → ArchitectureRunId.
  - No FK (the column is intentionally nullable and may reference legacy non-GUID run IDs).

Step 7 — Update archive cascade SQL in SqlRunRepository.cs (for the five agent tables):
    -- Before: TRY_CAST(RunId AS UNIQUEIDENTIFIER) IN (SELECT RunId FROM @Archived)
    -- After:  RunId IN (SELECT RunId FROM @Archived)

Step 8 — Sync all changes into ArchLucid.Persistence/Scripts/ArchLucid.sql.

Constraints:
- One table per migration file for rollback safety.
- Do not change AgentTasks.TaskId or AgentResults.ResultId PK type (RunId column only).
- Provide a rollback migration for each forward migration.

Acceptance Criteria: All eight tables have RunId/ArchitectureRunId as UNIQUEIDENTIFIER; FK constraints exist for the six non-nullable RunId tables; archive cascade SQL uses direct IN comparison without TRY_CAST; all CI migration tests pass.
```

### 28. Consolidate Archive Cascade to TVP Stored Procedure and Reduce Round Trips
- **Why it matters:** The eight-table archive cascade logic (`GoldenManifests`, `FindingsSnapshots`, `ContextSnapshots`, `GraphSnapshots`, `DecisioningTraces`, `ArtifactBundles`, `AgentExecutionTraces`, `ComparisonRecords`) is duplicated verbatim in both `ArchiveRunsCreatedBeforeAsync` and `ArchiveRunsByIdsAsync` in `SqlRunRepository`. Any schema change to the cascade must be applied in two places. Additionally, `ArchiveRunsByIdsAsync` makes two sequential SQL round trips — one SELECT to classify state, then one UPDATE cascade — where a single batch with two result sets suffices.
- **Expected impact:** Directly improves Maintainability (+2 pts) and Reliability (+1 pt). Eliminates duplication risk and halves network latency for the by-IDs archive path. Weighted readiness impact: +0.02%.
- **Affected qualities:** Maintainability, Reliability.
- **Actionable now:** Yes.
```cursor
Extract the archive cascade SQL to a reusable stored procedure and collapse ArchiveRunsByIdsAsync to a single batch round trip.

1. Create migration NNN_Archival_CascadeFromArchivedRuns_Proc.sql:

   a. Create a user-defined table type:
      CREATE TYPE dbo.ArchivedRunIdList AS TABLE (RunId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY);

   b. Create stored procedure dbo.Archival_CascadeFromArchivedRuns:
      - Accepts @Archived dbo.ArchivedRunIdList READONLY
      - Performs the eight IF COL_LENGTH / UPDATE … SET ArchivedUtc = SYSUTCDATETIME() blocks
        against the rows in @Archived
      - Returns a single result set: SELECT @cntGolden AS GoldenManifests, … (same shape as current)

2. In SqlRunRepository.ArchiveRunsCreatedBeforeAsync:
   - After the UPDATE dbo.Runs / OUTPUT INTO @Archived block, replace the eight inline cascade blocks
     with a EXEC dbo.Archival_CascadeFromArchivedRuns @Archived = @Archived call
   - Keep the two-result-set QueryMultipleAsync pattern (runs + child counts)

3. In SqlRunRepository.ArchiveRunsByIdsAsync:
   - Replace the two-trip pattern (SELECT state → UPDATE cascade) with a single QueryMultipleAsync:
       -- Result set 1: newly archived rows (from UPDATE … OUTPUT … WHERE RunId IN @RunIds AND ArchivedUtc IS NULL)
       -- Result set 2: already-archived rows (SELECT RunId FROM dbo.Runs WHERE RunId IN @RunIds AND ArchivedUtc IS NOT NULL)
   - Classify not-found / already-archived / just-archived from these two result sets in C#
   - Call EXEC dbo.Archival_CascadeFromArchivedRuns after the UPDATE as part of the same batch
   - Result set 3: child cascade counts from the procedure

4. Add rollback migration that drops the procedure and the UDT.

5. Update ArchLucid.Persistence/Scripts/ArchLucid.sql to include the new UDT and procedure definition.

Constraints:
- Do not change the public C# interface of IRunRepository.
- Do not change transaction semantics — the cascade must still commit atomically with the parent UPDATE.
- Preserve the existing RunArchiveBatchResult / RunArchiveByIdsResult return shapes.

Acceptance Criteria: Archive cascade logic exists in exactly one SQL object; ArchiveRunsByIdsAsync issues one QueryMultipleAsync call; all existing archive integration tests pass unchanged.
```

### 29. Trust the 14 WITH NOCHECK FK Constraints on the Core Execution Chain
- **Why it matters:** Every FK between the core run-pipeline tables — `ContextSnapshots → Runs`, `GraphSnapshots → ContextSnapshots/Runs`, `FindingsSnapshots → Runs/ContextSnapshots/GraphSnapshots`, `DecisioningTraces → Runs`, `GoldenManifests → Runs/ContextSnapshots/GraphSnapshots/FindingsSnapshots/DecisioningTraces`, `ArtifactBundles → Runs/GoldenManifests` — was added `WITH NOCHECK` to tolerate brownfield orphans at migration time. That means `is_not_trusted = 1` for all 14 constraints in `sys.foreign_keys`, permanently. SQL Server cannot use untrusted FKs for join elimination, cardinality estimation, or lookup reduction. Every query that joins two or more of these tables pays this tax on every execution. Validating the constraints requires only a data scan — it is not a schema change.
- **Expected impact:** Directly improves Reliability (+1 pt) and Maintainability (+1 pt) via improved query plan quality across the entire read path. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability, Maintainability.
- **Actionable now:** Yes.
```cursor
Validate and trust the 14 WITH NOCHECK FK constraints on the core execution chain.

Prerequisites: confirm DataConsistencyOrphanProbeHostedService reports no orphaned rows for these tables. If any orphans are found, fix them first (delete or re-parent) before running this migration.

Create migration NNN_TrustCoreChainForeignKeys.sql:

ALTER TABLE dbo.ContextSnapshots       WITH CHECK CHECK CONSTRAINT FK_ContextSnapshots_Runs_RunId;
ALTER TABLE dbo.GraphSnapshots         WITH CHECK CHECK CONSTRAINT FK_GraphSnapshots_Runs_RunId;
ALTER TABLE dbo.GraphSnapshots         WITH CHECK CHECK CONSTRAINT FK_GraphSnapshots_ContextSnapshots_ContextSnapshotId;
ALTER TABLE dbo.FindingsSnapshots      WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_Runs_RunId;
ALTER TABLE dbo.FindingsSnapshots      WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId;
ALTER TABLE dbo.FindingsSnapshots      WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_GraphSnapshots_GraphSnapshotId;
ALTER TABLE dbo.DecisioningTraces      WITH CHECK CHECK CONSTRAINT FK_DecisioningTraces_Runs_RunId;
ALTER TABLE dbo.GoldenManifests        WITH CHECK CHECK CONSTRAINT FK_GoldenManifests_Runs_RunId;
ALTER TABLE dbo.GoldenManifests        WITH CHECK CHECK CONSTRAINT FK_GoldenManifests_ContextSnapshots_ContextSnapshotId;
ALTER TABLE dbo.GoldenManifests        WITH CHECK CHECK CONSTRAINT FK_GoldenManifests_GraphSnapshots_GraphSnapshotId;
ALTER TABLE dbo.GoldenManifests        WITH CHECK CHECK CONSTRAINT FK_GoldenManifests_FindingsSnapshots_FindingsSnapshotId;
ALTER TABLE dbo.GoldenManifests        WITH CHECK CHECK CONSTRAINT FK_GoldenManifests_DecisioningTraces_DecisionTraceId;
ALTER TABLE dbo.ArtifactBundles        WITH CHECK CHECK CONSTRAINT FK_ArtifactBundles_Runs_RunId;
ALTER TABLE dbo.ArtifactBundles        WITH CHECK CHECK CONSTRAINT FK_ArtifactBundles_GoldenManifests_ManifestId;

Also include the three FindingsSnapshots FKs already called out in Improvement #26 (consolidate into one migration if running both):
ALTER TABLE dbo.FindingsSnapshots      WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_Runs_RunId;
ALTER TABLE dbo.FindingsSnapshots      WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_ContextSnapshots_ContextSnapshotId;
ALTER TABLE dbo.FindingsSnapshots      WITH CHECK CHECK CONSTRAINT FK_FindingsSnapshots_GraphSnapshots_GraphSnapshotId;

Rollback: there is no schema rollback — untrusted FKs cannot be "un-trusted" by a script. Document this in the migration header.

Sync: update ArchLucid.Persistence/Scripts/ArchLucid.sql to replace the WITH NOCHECK clauses with WITH CHECK on these constraints so new greenfield deployments create them trusted from the start.

Constraints:
- Run the DataConsistencyOrphanProbeHostedService integration test suite before executing this migration.
- Do not add new FK constraints in this migration — only validate existing ones.
- Do not set a transaction timeout shorter than 5 minutes; the WITH CHECK scan can be long on large tables.

Acceptance Criteria: SELECT name, is_not_trusted FROM sys.foreign_keys WHERE name IN (...all 14 above...) returns is_not_trusted = 0 for every row; no data was modified; CI migration tests pass.
```

### 30. Add Missing FK Constraints on Alerting, Advisory, and Governance Tables
- **Why it matters:** Fourteen parent-child column relationships have no FK constraint — orphaned rows accumulate silently on every parent delete. The highest-risk gaps are the PolicyPack family (`PolicyPackVersions`, `PolicyPackAssignments`, `PolicyPackChangeLog` all reference `PolicyPacks` with no FK), the alert delivery chain (`AlertDeliveryAttempts → AlertRecords`, `AlertDeliveryAttempts → AlertRoutingSubscriptions`), the advisory chain (`AdvisoryScanExecutions → AdvisoryScanSchedules`, `DigestDeliveryAttempts → ArchitectureDigests/DigestSubscriptions`), and three large content tables where `RunId NOT NULL` has no FK to `dbo.Runs` (`RecommendationRecords`, `ProvenanceSnapshots`, `AuthorityPipelineWorkOutbox`).
- **Expected impact:** Directly improves Reliability (+2 pts). Prevents orphaned data from silently accumulating in governance, advisory, and alerting subsystems. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability, Maintainability.
- **Actionable now:** Yes.
```cursor
Add missing FK constraints across alerting, advisory, and governance tables.

Create migration NNN_MissingForeignKeys.sql with the following additions. Use WITH NOCHECK on all, then validate with WITH CHECK once data is confirmed clean (same pattern as #29):

-- PolicyPack family
ALTER TABLE dbo.PolicyPackVersions    WITH NOCHECK ADD CONSTRAINT FK_PolicyPackVersions_PolicyPacks
    FOREIGN KEY (PolicyPackId) REFERENCES dbo.PolicyPacks (PolicyPackId);

ALTER TABLE dbo.PolicyPackAssignments WITH NOCHECK ADD CONSTRAINT FK_PolicyPackAssignments_PolicyPacks
    FOREIGN KEY (PolicyPackId) REFERENCES dbo.PolicyPacks (PolicyPackId);

ALTER TABLE dbo.PolicyPackChangeLog   WITH NOCHECK ADD CONSTRAINT FK_PolicyPackChangeLog_PolicyPacks
    FOREIGN KEY (PolicyPackId) REFERENCES dbo.PolicyPacks (PolicyPackId);

-- Alert chain
ALTER TABLE dbo.AlertRecords          WITH NOCHECK ADD CONSTRAINT FK_AlertRecords_AlertRules
    FOREIGN KEY (RuleId) REFERENCES dbo.AlertRules (RuleId);

ALTER TABLE dbo.AlertDeliveryAttempts WITH NOCHECK ADD CONSTRAINT FK_AlertDeliveryAttempts_AlertRecords
    FOREIGN KEY (AlertId) REFERENCES dbo.AlertRecords (AlertId);

ALTER TABLE dbo.AlertDeliveryAttempts WITH NOCHECK ADD CONSTRAINT FK_AlertDeliveryAttempts_RoutingSubscriptions
    FOREIGN KEY (RoutingSubscriptionId) REFERENCES dbo.AlertRoutingSubscriptions (RoutingSubscriptionId);

ALTER TABLE dbo.CompositeAlertRuleConditions WITH NOCHECK ADD CONSTRAINT FK_CompositeAlertRuleConditions_CompositeAlertRules
    FOREIGN KEY (CompositeRuleId) REFERENCES dbo.CompositeAlertRules (CompositeRuleId);

-- Advisory chain
ALTER TABLE dbo.AdvisoryScanExecutions WITH NOCHECK ADD CONSTRAINT FK_AdvisoryScanExecutions_Schedules
    FOREIGN KEY (ScheduleId) REFERENCES dbo.AdvisoryScanSchedules (ScheduleId);

ALTER TABLE dbo.DigestDeliveryAttempts WITH NOCHECK ADD CONSTRAINT FK_DigestDeliveryAttempts_Digests
    FOREIGN KEY (DigestId) REFERENCES dbo.ArchitectureDigests (DigestId);

ALTER TABLE dbo.DigestDeliveryAttempts WITH NOCHECK ADD CONSTRAINT FK_DigestDeliveryAttempts_Subscriptions
    FOREIGN KEY (SubscriptionId) REFERENCES dbo.DigestSubscriptions (SubscriptionId);

-- ConversationMessages → ConversationThreads (ThreadId is NOT NULL)
ALTER TABLE dbo.ConversationMessages  WITH NOCHECK ADD CONSTRAINT FK_ConversationMessages_ConversationThreads
    FOREIGN KEY (ThreadId) REFERENCES dbo.ConversationThreads (ThreadId);

-- Large content tables with RunId NOT NULL but no FK
ALTER TABLE dbo.RecommendationRecords        WITH NOCHECK ADD CONSTRAINT FK_RecommendationRecords_Runs
    FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);

ALTER TABLE dbo.ProvenanceSnapshots          WITH NOCHECK ADD CONSTRAINT FK_ProvenanceSnapshots_Runs
    FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);

ALTER TABLE dbo.AuthorityPipelineWorkOutbox  WITH NOCHECK ADD CONSTRAINT FK_AuthorityPipelineWorkOutbox_Runs
    FOREIGN KEY (RunId) REFERENCES dbo.Runs (RunId);

After each constraint is added, schedule a follow-up migration to WITH CHECK validate it (same pattern as #29).

Sync all additions into ArchLucid.Persistence/Scripts/ArchLucid.sql.

Constraints:
- Do not add ON DELETE CASCADE to any of these (application-layer soft delete is the V1 contract).
- Do not add FK constraints on nullable RunId/ComparedToRunId columns in this pass (AlertRecords.RunId, ArchitectureDigests.RunId, etc.) — those are optional cross-references and would require SET NULL or RESTRICT semantics decision first.

Acceptance Criteria: All 14 constraints exist in sys.foreign_keys; running the full DbUp migration sequence against a fresh database succeeds; orphan-probe integration tests continue to pass.
```

### 31. Add CHECK Constraints to 13 Enumeration Columns
- **Why it matters:** Thirteen `NVARCHAR` status/type/severity columns have no CHECK constraint. Invalid values can be stored silently by any direct SQL write (migration, seed, support tooling, test setup). The omission is asymmetric: `LegacyRunStatus`, `StructuralExecutionMode`, `GoldenManifests.LifecycleStatus`, and `FindingsSnapshots.GenerationStatus` all have CHECK constraints, but the alerting, governance, and advisory equivalents do not. This means a status transition bug in C# (e.g., writing `"open"` instead of `"Open"`) is invisible to the database.
- **Expected impact:** Directly improves Reliability (+1 pt) and Maintainability (+1 pt). Prevents silent invalid-state storage in 13 columns. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability, Maintainability.
- **Actionable now:** Yes.
```cursor
Add CHECK constraints to the 13 enumeration columns that currently have none.

Create migration NNN_EnumerationCheckConstraints.sql. Use the standard brownfield guard (IF NOT EXISTS) for each:

-- AlertRecords
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertRecords_Status')
    ALTER TABLE dbo.AlertRecords ADD CONSTRAINT CK_AlertRecords_Status
        CHECK (Status IN (N'Open', N'Acknowledged', N'Resolved', N'Dismissed', N'Archived'));

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertRecords_Severity')
    ALTER TABLE dbo.AlertRecords ADD CONSTRAINT CK_AlertRecords_Severity
        CHECK (Severity IN (N'Critical', N'High', N'Medium', N'Low', N'Informational'));

-- RecommendationRecords
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_RecommendationRecords_Status')
    ALTER TABLE dbo.RecommendationRecords ADD CONSTRAINT CK_RecommendationRecords_Status
        CHECK (Status IN (N'Open', N'Accepted', N'Resolved', N'Dismissed', N'Superseded'));

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_RecommendationRecords_Urgency')
    ALTER TABLE dbo.RecommendationRecords ADD CONSTRAINT CK_RecommendationRecords_Urgency
        CHECK (Urgency IN (N'Critical', N'High', N'Medium', N'Low'));

-- DigestDeliveryAttempts
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_DigestDeliveryAttempts_Status')
    ALTER TABLE dbo.DigestDeliveryAttempts ADD CONSTRAINT CK_DigestDeliveryAttempts_Status
        CHECK (Status IN (N'Sent', N'Failed', N'Skipped'));

-- AlertDeliveryAttempts
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AlertDeliveryAttempts_Status')
    ALTER TABLE dbo.AlertDeliveryAttempts ADD CONSTRAINT CK_AlertDeliveryAttempts_Status
        CHECK (Status IN (N'Sent', N'Failed', N'Retrying'));

-- AdvisoryScanExecutions
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_AdvisoryScanExecutions_Status')
    ALTER TABLE dbo.AdvisoryScanExecutions ADD CONSTRAINT CK_AdvisoryScanExecutions_Status
        CHECK (Status IN (N'Running', N'Succeeded', N'Failed', N'Cancelled'));

-- PolicyPacks
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPacks_Status')
    ALTER TABLE dbo.PolicyPacks ADD CONSTRAINT CK_PolicyPacks_Status
        CHECK (Status IN (N'Draft', N'Active', N'Deprecated', N'Archived'));

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPacks_PackType')
    ALTER TABLE dbo.PolicyPacks ADD CONSTRAINT CK_PolicyPacks_PackType
        CHECK (PackType IN (N'PlatformDefault', N'Custom'));

-- PolicyPackAssignments
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_PolicyPackAssignments_ScopeLevel')
    ALTER TABLE dbo.PolicyPackAssignments ADD CONSTRAINT CK_PolicyPackAssignments_ScopeLevel
        CHECK (ScopeLevel IN (N'Tenant', N'Workspace', N'Project'));

-- FindingRecords
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_FindingRecords_Severity')
    ALTER TABLE dbo.FindingRecords ADD CONSTRAINT CK_FindingRecords_Severity
        CHECK (Severity IN (N'Critical', N'High', N'Medium', N'Low', N'Informational'));

-- ConversationMessages
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ConversationMessages_Role')
    ALTER TABLE dbo.ConversationMessages ADD CONSTRAINT CK_ConversationMessages_Role
        CHECK (Role IN (N'user', N'assistant', N'system'));

-- ImportedArchitectureRequests (has format CHECK but not status)
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ImportedArchitectureRequests_Status')
    ALTER TABLE dbo.ImportedArchitectureRequests ADD CONSTRAINT CK_ImportedArchitectureRequests_Status
        CHECK (Status IN (N'Draft', N'Processing', N'Completed', N'Failed'));

Constraints:
- Verify the exact allowed values by searching the C# enum or constant definitions in the codebase before committing — treat the values above as defaults, not as authoritative.
- Each constraint must use the brownfield IF NOT EXISTS guard so the migration is idempotent on re-run.
- If any existing rows violate a constraint, fix the data first; document the fix in the migration header.
- Sync all constraints into ArchLucid.Persistence/Scripts/ArchLucid.sql.

Acceptance Criteria: 13 new CHECK constraints exist in sys.check_constraints; an INSERT with an out-of-range value for each column is rejected by SQL Server; CI migration tests pass.
```

### 32. Enforce NOT NULL on Nullable Scope Denormalization Columns
- **Why it matters:** When RLS scope columns (`TenantId`, `WorkspaceId`, `ScopeProjectId`/`ProjectId`) were added to ~15 child tables via brownfield migrations (DbUp 046 parity), they were declared `NULL` to allow deployment without failing on existing rows. That nullability was then copied into the greenfield `CREATE TABLE` definitions for subsequent child tables. The result: any direct SQL insert that omits a scope column creates a row that participates in RLS predicates with a NULL — which evaluates to UNKNOWN, not FALSE, under standard SQL null semantics. The C# repository layer enforces scope via `ScopedRepositoryScopeValidation`, but the database has no matching enforcement. Tables affected include: `dbo.ContextSnapshots`, `dbo.ContextSnapshotCanonicalObjects`, `dbo.ContextSnapshotCanonicalObjectProperties`, `dbo.ContextSnapshotWarnings`, `dbo.ContextSnapshotErrors`, `dbo.ContextSnapshotSourceHashes`, `dbo.GraphSnapshots`, `dbo.GraphSnapshotEdges`, `dbo.GraphSnapshotNodes`, `dbo.GraphSnapshotNodeProperties`, `dbo.GraphSnapshotEdgeProperties`, `dbo.GraphSnapshotWarnings`, `dbo.FindingRecords`, and all `GoldenManifest*` child tables.
- **Expected impact:** Directly improves Reliability (+2 pts). Closes a database-level RLS bypass vector; ensures security predicates behave deterministically. Weighted readiness impact: +0.02%.
- **Affected qualities:** Reliability.
- **Actionable now:** Yes.
```cursor
Enforce NOT NULL on nullable scope denormalization columns across child tables.

Create migration NNN_ScopeColumnsNotNull.sql. For each affected table:

Step 1 — Verify no nulls exist (abort if any):
    IF EXISTS (SELECT 1 FROM dbo.<TableName> WHERE TenantId IS NULL)
        THROW 50000, 'Cannot enforce NOT NULL — NULLs found in <TableName>.TenantId', 1;
    -- repeat for WorkspaceId and ScopeProjectId/ProjectId

Step 2 — Alter each column:
    ALTER TABLE dbo.<TableName> ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.<TableName> ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.<TableName> ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NOT NULL;
    -- (use ProjectId instead of ScopeProjectId where that is the column name, e.g. FindingRecords)

Apply this to all tables listed in the improvement description.

After applying, update the greenfield CREATE TABLE definitions in ArchLucid.Persistence/Scripts/ArchLucid.sql to reflect NOT NULL.

Constraints:
- Run the pre-check for every table; fail the migration if any NULL exists rather than silently skipping.
- Batch multiple tables into a single migration file, but preserve the per-table pre-check structure.
- Do not alter columns that are legitimately nullable (e.g. scope columns on tables where a row may genuinely span scopes — check the application intent first).
- Do not modify RLS policies or SECURITY POLICY objects in this migration.

Acceptance Criteria: sys.columns shows is_nullable = 0 for TenantId, WorkspaceId, and ScopeProjectId/ProjectId on all affected tables; a direct INSERT omitting these columns is rejected by SQL Server; CI migration tests pass.
```

### 33. Fix Unfiltered Unique Index on GoldenManifests and Resolve Deferred Unique Constraints
- **Why it matters:** `UX_GoldenManifests_RunId` is an unfiltered unique index — no `WHERE ArchivedUtc IS NULL`. Once any manifest row exists for a run (even soft-archived), the index blocks all future inserts for the same RunId, including after archival, retry scenarios, or test teardown/reseed. The semantically correct invariant is "one *active* manifest per run." Two further UNIQUE constraints are called out as TODO comments in the schema — `UX_GraphSnapshots_ContextSnapshotId` and `UX_ArtifactBundles_ManifestId` — deferred because the repository uses `TOP 1 ORDER BY CreatedUtc` patterns that imply multiple rows per parent may be created. These `TOP 1` patterns are a sign of a missing invariant: if multiple rows per parent are genuinely allowed, document why; if they are not, add the constraints and the `TOP 1` becomes a safe defensive fallback.
- **Expected impact:** Directly improves Reliability (+1 pt). Unblocks archive-then-recreate scenarios for GoldenManifests; resolves ambiguity in GraphSnapshot and ArtifactBundle cardinality. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability, Maintainability.
- **Actionable now:** Yes.
```cursor
Fix the unfiltered unique index on GoldenManifests and resolve the deferred unique constraint decisions.

Part 1 — Replace UX_GoldenManifests_RunId with a filtered version:

Create migration NNN_GoldenManifests_UniqueIndex_Filtered.sql:

    -- Drop the unfiltered index
    DROP INDEX IF EXISTS UX_GoldenManifests_RunId ON dbo.GoldenManifests;

    -- Re-create filtered to active rows only
    CREATE UNIQUE INDEX UX_GoldenManifests_RunId_Active
        ON dbo.GoldenManifests (RunId)
        WHERE ArchivedUtc IS NULL;

Update ArchLucid.Persistence/Scripts/ArchLucid.sql accordingly.
Provide rollback R-NNN that drops the filtered index and recreates the unfiltered one.

Part 2 — Resolve the two deferred TODO unique constraints:

For dbo.GraphSnapshots (one per ContextSnapshotId):
  - Search the codebase for SqlGraphSnapshotRepository.GetLatestByContextSnapshotIdAsync.
  - If the query uses TOP 1 only as a defensive fallback and the business rule is one graph per context:
      CREATE UNIQUE INDEX UX_GraphSnapshots_ContextSnapshotId
          ON dbo.GraphSnapshots (ContextSnapshotId)
          WHERE ArchivedUtc IS NULL;
  - If multiple graph snapshots per context are legitimately needed (e.g. retry creates a replacement):
      Remove the TODO comment and add a code comment explaining why the index is not added.

For dbo.ArtifactBundles (one per ManifestId):
  - Search the codebase for SqlArtifactBundleRepository.GetByManifestIdAsync.
  - Apply the same analysis: if the TOP 1 is a defensive fallback, add the filtered unique index;
    if multiple bundles per manifest are valid, document the reason and remove the TODO.

Constraints:
- Do not add the GraphSnapshot or ArtifactBundle unique indexes without first verifying the business rule — do not guess.
- The filtered GoldenManifests index must be created before running Improvement #29 (FK trust) since trusted FKs interact with uniqueness checks.
- Sync all decisions into ArchLucid.Persistence/Scripts/ArchLucid.sql.

Acceptance Criteria: UX_GoldenManifests_RunId_Active (filtered) replaces UX_GoldenManifests_RunId (unfiltered); two archived manifests for the same RunId can coexist; a second active manifest for the same RunId is still rejected; the GraphSnapshot and ArtifactBundle TODO comments are either replaced by constraints or by documented rationale.
```

### 34. Route Analytics and Metrics Readers Through IReadOnlyDbConnectionFactory
- **Why it matters:** Four metrics readers inject `ISqlConnectionFactory` and therefore execute against the primary writer: `DapperValueReportMetricsReader`, `DapperPilotReportCardMetricsReader`, `DapperPilotScorecardMetricsReader`, and `DapperWeeklyArchitectureCriticalFindingSummaryRepository`. At report time these issue 4–8 sequential `COUNT`/`AVG`/`SUM` scans over large tables (`dbo.Runs`, `dbo.FindingRecords`, `dbo.GoldenManifests`, `dbo.AuditEvents`). On the primary, those scans compete for shared locks with the concurrent agent write path. `DapperComplianceDriftFindingsTrendReader` already uses `IReadOnlyDbConnectionFactory` as the correct pattern; the four above do not. Routing to a read replica eliminates the blocking entirely without `WITH (NOLOCK)` and without any dirty-read risk.
- **Expected impact:** Directly improves Reliability (+1 pt) and Scalability (+1 pt). Removes analytics scans from the write-path lock surface. Weighted readiness impact: +0.02%.
- **Affected qualities:** Reliability, Scalability.
- **Actionable now:** Yes.
```cursor
Route the four analytics/metrics Dapper readers from ISqlConnectionFactory to IReadOnlyDbConnectionFactory.

Use DapperComplianceDriftFindingsTrendReader as the reference implementation (it already uses IReadOnlyDbConnectionFactory correctly).

Affected classes:
  ArchLucid.Persistence/Value/DapperValueReportMetricsReader.cs
  ArchLucid.Persistence/Pilots/DapperPilotReportCardMetricsReader.cs
  ArchLucid.Persistence/Pilots/DapperPilotScorecardMetricsReader.cs
  ArchLucid.Persistence/WeeklyDigest/DapperWeeklyArchitectureCriticalFindingSummaryRepository.cs

For each class:

Step 1 — Change the constructor parameter type:
    // Before
    public sealed class DapperValueReportMetricsReader(ISqlConnectionFactory connectionFactory)
    // After
    public sealed class DapperValueReportMetricsReader(IReadOnlyDbConnectionFactory connectionFactory)

Step 2 — Update the backing field type and null-guard:
    private readonly IReadOnlyDbConnectionFactory _connectionFactory = ...

Step 3 — All existing calls to connectionFactory.CreateOpenConnectionAsync(...) are unchanged
    (IReadOnlyDbConnectionFactory exposes the same method signature as the read path of ISqlConnectionFactory).

Step 4 — Update DI registration in the relevant ServiceCollectionExtensions file:
    // Verify IReadOnlyDbConnectionFactory is already registered (it is, via ReadReplicaRoutedConnectionFactory).
    // Change the registration for each of the four readers from ISqlConnectionFactory to IReadOnlyDbConnectionFactory.
    // Do not re-register IReadOnlyDbConnectionFactory itself — it is shared.

Step 5 — Update unit tests for each reader if they inject ISqlConnectionFactory mock — switch to IReadOnlyDbConnectionFactory mock.

Constraints:
- Do not change DapperComplianceDriftFindingsTrendReader (already correct).
- Do not apply this change to write-capable repositories or to repositories that issue INSERT/UPDATE.
- IReadOnlyDbConnectionFactory must remain registered as a singleton (it already is); do not add a scoped or transient registration.

Acceptance Criteria: All four readers compile against IReadOnlyDbConnectionFactory; DI graph validation tests pass; integration tests confirm reader results are unchanged; no calls to the primary ISqlConnectionFactory remain in these four files.
```

### 35. Add WITH (NOLOCK) to Remaining Display-Layer and Analytics Reads
- **Why it matters:** After #34 routes the metrics readers off the primary, a second category of display-only reads remains on the primary without `WITH (NOLOCK)`: the audit timeline queries in `DapperAuditRepository`, the advisory list reads (`DapperRecommendationRepository.ListAsync`, `DapperArchitectureDigestRepository.ListAsync`), the governance policy catalog reads (`DapperPolicyPackCatalogRepository`, `DapperPolicyPackVersionRepository`, `DapperPolicyPackAssignmentRepository` list queries), and the analytics queries that remain in the metrics readers even after #34 routes them to a replica. `dbo.AuditEvents` is append-only (rows are never updated post-INSERT), making NOLOCK risk-free there. The advisory and catalog reads serve UI display; a transiently stale row is acceptable. These queries are already scoped-and-filtered — adding NOLOCK will not broaden their data surface. The `HotPathRelationalQueryShapes` queries already demonstrate the accepted NOLOCK pattern for this codebase.
- **Expected impact:** Directly improves Reliability (+1 pt) and Scalability (+1 pt). Reduces shared-lock contention on the remaining high-volume read paths. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability, Scalability.
- **Actionable now:** Yes — but run after #34 so the metrics readers are already on the read replica before adding the hints there.
```cursor
Add WITH (NOLOCK) hints to display-layer and analytics reads that do not yet have them.

Follow the pattern established in HotPathRelationalQueryShapes (e.g. RunsListByProjectNoLock):
  FROM dbo.<TableName> WITH (NOLOCK)
and for every JOIN'd table in the same query:
  JOIN dbo.<OtherTable> WITH (NOLOCK) ON ...

Affected files and queries:

1. ArchLucid.Persistence/Audit/DapperAuditRepository.cs
   - AuditEventsGetByScope constant (in HotPathRelationalQueryShapes) — add WITH (NOLOCK) to FROM dbo.AuditEvents.
   - AuditEventsFilteredSelectFromWhereScope constant — add WITH (NOLOCK) to FROM dbo.AuditEvents.
   - AuditEventsFilteredCountFromWhereScope constant — add WITH (NOLOCK) to FROM dbo.AuditEvents.
   Rationale: dbo.AuditEvents is append-only; dirty reads are impossible (rolled-back inserts are the only risk,
   and audit insert rollbacks are a fatal failure scenario, not normal operation).

2. ArchLucid.Persistence/Advisory/DapperRecommendationRepository.cs — ListAsync SQL
   - Add WITH (NOLOCK) to FROM dbo.RecommendationRecords.

3. ArchLucid.Persistence/Advisory/DapperArchitectureDigestRepository.cs — ListAsync SQL
   - Add WITH (NOLOCK) to FROM dbo.ArchitectureDigests and any JOIN'd tables in the list query.

4. ArchLucid.Persistence/Governance/DapperPolicyPackCatalogRepository.cs — list/search queries
   - Add WITH (NOLOCK) to FROM dbo.PolicyPacks and all JOIN'd tables.

5. ArchLucid.Persistence/Governance/DapperPolicyPackVersionRepository.cs — ListByPackIdAsync SQL
   - Add WITH (NOLOCK) to FROM dbo.PolicyPackVersions.

6. ArchLucid.Persistence/Governance/DapperPolicyPackAssignmentRepository.cs — list queries
   - Add WITH (NOLOCK) to FROM dbo.PolicyPackAssignments.

7. After #34 lands: add WITH (NOLOCK) to all SELECT queries inside:
   DapperValueReportMetricsReader, DapperPilotReportCardMetricsReader,
   DapperPilotScorecardMetricsReader, DapperWeeklyArchitectureCriticalFindingSummaryRepository.
   On a read replica, NOLOCK is belt-and-suspenders for replica-local lock contention during high-concurrency bursts.

Do NOT add WITH (NOLOCK) to:
- DapperIntegrationEventOutboxRepository (work claiming — correctness-critical)
- DapperAuthorityPipelineWorkRepository (pipeline work claiming)
- DapperScimTenantTokenRepository (authentication)
- Any idempotency repository (ArchitectureRunIdempotency, CommitRunIdempotency)
- DapperTenantDatabaseBindingRepository (connection routing)
- Any query that drives a conditional INSERT or UPDATE on the same row in the same request
- Any query executed inside a DapperArchLucidUnitOfWork transaction block

Constraints:
- Every table appearing in a FROM or JOIN in a modified query must get its own WITH (NOLOCK) hint.
  A query with NOLOCK on the main table but not on a JOIN'd table is incorrect.
- Do not add NOLOCK to queries that use UPDLOCK or ROWLOCK hints (incompatible).
- Do not change INSERT, UPDATE, DELETE, or MERGE statements.
- Update the constant names in HotPathRelationalQueryShapes to include "NoLock" suffix if not already present,
  for consistency with the existing naming convention.

Acceptance Criteria: All modified SELECT queries include WITH (NOLOCK) on every table reference; no INSERT/UPDATE/DELETE/MERGE statement was modified; the prohibited list above was not touched; existing unit and integration tests pass unchanged.
```

### 36. Add Non-Clustered Columnstore Indexes on Analytics-Heavy Tables
- **Why it matters:** Three tables are full-scanned repeatedly by analytics readers: `dbo.AuditEvents` (compliance drift trend bucketing, value report governance counts, pilot report export counts), `dbo.FindingRecords` (pilot report card severity aggregation, value report feedback), and `dbo.GoldenManifests` (value report manifest counts, review-cycle AVG). These tables have row-store non-clustered indexes tuned for OLTP point-lookups but no columnstore coverage. When analytics aggregations (`COUNT_BIG`, `AVG(CAST(...))`, `GROUP BY` on computed expressions) exhaust their memory grant, SQL Server spills sort and hash aggregate intermediates to tempdb. On Azure SQL Managed Instance, tempdb spills from concurrent analytics requests combine with concurrent agent-write sort pressure. A non-clustered columnstore index (NCCI) on each table allows batch-mode execution, eliminates tempdb spills for these queries, and does not block the existing row-store OLTP paths since both index types coexist.
- **Expected impact:** Directly improves Reliability (+1 pt) and Scalability (+1 pt). Eliminates tempdb spill pressure from the three heaviest analytics scan paths. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability, Scalability.
- **Actionable now:** Yes.
```cursor
Add non-clustered columnstore indexes on the three analytics-heavy tables.

Create migration NNN_ColumnstoreAnalyticsIndexes.sql:

-- AuditEvents: scanned for event-type bucketing and date-range COUNT aggregations.
-- Include all columns referenced by analytics GROUP BY / WHERE / SELECT shapes.
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_AuditEvents_Analytics
    ON dbo.AuditEvents (TenantId, WorkspaceId, ProjectId, OccurredUtc, EventType, RunId)
    WITH (ONLINE = ON);

-- FindingRecords: scanned for severity GROUP BY and count aggregations.
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_FindingRecords_Analytics
    ON dbo.FindingRecords (TenantId, WorkspaceId, ProjectId, FindingsSnapshotId, Severity, CreatedUtc)
    WITH (ONLINE = ON);

-- GoldenManifests: scanned for manifest count and review-cycle AVG(DATEDIFF) aggregations.
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_GoldenManifests_Analytics
    ON dbo.GoldenManifests (TenantId, WorkspaceId, ProjectId, RunId, CreatedUtc, ArchivedUtc,
                            FindingsSnapshotId)
    WITH (ONLINE = ON);

Notes:
- NCCI does not replace the existing row-store indexes — both coexist. OLTP point-lookups
  continue to use the row-store indexes; the optimizer selects the NCCI for aggregate scans
  automatically (no query changes required).
- ONLINE = ON means no downtime during index build on Azure SQL MI.
- AuditEvents is append-only so delta-store overhead is negligible. FindingRecords and GoldenManifests
  receive archive UPDATEs; the background tuple mover compresses delta stores automatically.
- Do not add a NCCI to dbo.Runs — its analytics usage is covered by the filtered indexes
  from Improvement #26, and the run list queries rely on row-store seek patterns.

Sync all three CREATE statements into ArchLucid.Persistence/Scripts/ArchLucid.sql.

Acceptance Criteria: All three NCCIs exist in sys.indexes with type_desc = 'NONCLUSTERED COLUMNSTORE';
query plans for DapperValueReportMetricsReader and DapperPilotReportCardMetricsReader show
'Columnstore Index Scan' operators in the execution plan; no existing OLTP integration test fails;
CI migration tests pass.
```

### 37. Codify tempdb File Configuration in Terraform and Consolidate Duplicate Purge Procedures
- **Why it matters:** Two gaps compound each other. First, Azure SQL Managed Instance tempdb file count is set to `min(vCore count, 8)` by the platform and cannot be changed via T-SQL, but the current Terraform has no comment or assertion documenting the expected vCore threshold. A scale-down below 4 vCores (e.g., cost-cutting in a dev environment) silently reduces tempdb to 2–3 files, reintroducing `PAGELATCH_UP` contention on PFS/GAM/SGAM allocation pages under concurrent purge sessions. Second, `SampleRunPurgeBatch` and `Archival_PurgeStaleUncommittedRunsBatch` are structurally identical — same `#PurgeRuns` creation, same 20-table cascade, same `@Removed TABLE` OUTPUT — differing only in the eligibility `WHERE` clause on `dbo.Runs`. Under concurrent purge cycles, both sessions independently allocate `#PurgeRuns` in tempdb, doubling the concurrent allocation-page latch surface for no benefit.
- **Expected impact:** Directly improves Reliability (+1 pt) and Maintainability (+1 pt). Closes the IaC tempdb documentation gap; halves concurrent purge tempdb allocation contention. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability, Maintainability.
- **Actionable now:** Yes — run after #28 (archive TVP) so the `RunIdTableType` TVP type is available for the consolidated purge core procedure.
```cursor
Part 1 — Document tempdb expectations in Terraform.

In the Azure SQL Managed Instance Terraform resource (infra/terraform/ or equivalent path):

Add a comment block to the MI resource definition:
  # Azure SQL MI sets tempdb data file count to min(vCores, 8) automatically.
  # Minimum safe vCore count for concurrent purge workers: 4 (= 4 tempdb files).
  # Do not reduce below 4 vCores without disabling or serialising concurrent purge batch workers.

If the module exposes a vCore variable, add a Terraform validation block:
  validation {
    condition     = var.sql_mi_vcores >= 4
    error_message = "SQL MI must have >= 4 vCores to support concurrent purge workers without tempdb contention."
  }

Part 2 — Consolidate the shared cascade body into one internal procedure.

Create migration NNN_PurgeCascadeCore.sql:

  CREATE OR ALTER PROCEDURE dbo.PurgeCascade_Core
      @RunIds dbo.RunIdTableType READONLY   -- reuse TVP type established by Improvement #28
  AS
  BEGIN
      SET NOCOUNT ON;
      SET XACT_ABORT ON;
      -- All 20-table cascade DELETEs driven by @RunIds.
      -- Does NOT own the transaction — callers wrap it with BEGIN/COMMIT TRANSACTION.
      -- Mirror the exact table order from the existing procedures (AlertDeliveryAttempts first,
      -- dbo.Runs last) so FK constraints are respected during the delete chain.
      DELETE ada FROM dbo.AlertDeliveryAttempts AS ada
          WHERE EXISTS (SELECT 1 FROM @RunIds r
                        JOIN dbo.AlertRecords ar ON ar.AlertId = ada.AlertId
                        WHERE ar.RunId = r.RunId OR ar.ComparedToRunId = r.RunId);
      -- ... remaining 19 tables in dependency order ...
  END;
  GO
  GRANT EXECUTE ON dbo.PurgeCascade_Core TO [ArchLucidApp];

Refactor SampleRunPurgeBatch:
- Keep the eligibility SELECT TOP (@BatchSize) ... INSERT INTO #PurgeRuns (with PRIMARY KEY).
- Replace the 20-table cascade body with:
    DECLARE @Ids dbo.RunIdTableType;
    INSERT INTO @Ids SELECT RunId FROM #PurgeRuns;
    BEGIN TRANSACTION;
    EXEC dbo.PurgeCascade_Core @RunIds = @Ids;
    DELETE r FROM dbo.Runs AS r ... (final Runs delete + OUTPUT INTO @Removed)
    COMMIT TRANSACTION;

Refactor Archival_PurgeStaleUncommittedRunsBatch identically.

Constraints:
- PurgeCascade_Core must NOT create a #temp table internally — it operates on the TVP parameter.
  This avoids nested temp table allocation inside the outer session's #PurgeRuns scope.
- The outer #PurgeRuns temp table keeps its PRIMARY KEY in each calling procedure.
- Sync all changes into ArchLucid.Persistence/Scripts/ArchLucid.sql.

Acceptance Criteria: Both purge procedures call PurgeCascade_Core; the 20-table cascade body
exists in exactly one SQL object; Terraform plan shows no destructive MI resource changes;
the validation block rejects vCore counts < 4; all purge integration tests pass.
```

### 38. Provision Azure SQL Database vCore General Purpose Serverless as the Target Database Tier
- **Why it matters:** Every T-SQL construct in the codebase — `SESSION_CONTEXT`, `SECURITY POLICY`, TVPs, stored procedures, `MERGE`, `OUTPUT INTO`, `APPLY` — is fully supported on Azure SQL Database. There are no features that require SQL Managed Instance (no SQL Agent, no CLR, no Service Broker, no linked servers). Azure SQL Database vCore General Purpose Serverless auto-pauses at a configurable idle threshold and bills only for active vCore-seconds, which aligns with the bursty agent-run workload: compute scales up during runs and releases between them. At launch scale, total monthly cost including a named read replica is ~$100–250/month. The DTU-based tiers (Standard, Premium) are not suitable: Standard lacks columnstore index support (blocking Improvement #36) and has no read replica path; Premium's cost is comparable to vCore with less scaling flexibility and a harder upgrade path to Hyperscale.
- **Expected impact:** Directly optimises Cost. Enables all planned improvements (#26–#37): columnstore, read replica via named replica, Terraform-managed vCore scaling without data movement. Weighted readiness impact: not a readiness gate but the foundational infrastructure decision.
- **Affected qualities:** Scalability, Reliability, Maintainability.
- **Actionable now:** Yes — this is a first-time provisioning decision, not a migration.
```cursor
Provision Azure SQL Database vCore General Purpose Serverless as the application database.

Part 1 — Core Terraform resources.

  resource "azurerm_mssql_server" "primary" {
    name                         = var.sql_server_name
    resource_group_name          = var.resource_group_name
    location                     = var.location
    version                      = "12.0"
    administrator_login          = var.sql_admin_login
    administrator_login_password = var.sql_admin_password

    azuread_administrator {
      login_username = var.entra_admin_login
      object_id      = var.entra_admin_object_id
    }
  }

  variable "sql_sku" {
    type    = string
    default = "GP_S_Gen5_2"
    validation {
      condition     = contains(["GP_S_Gen5_2","GP_S_Gen5_4","GP_S_Gen5_8","GP_S_Gen5_16"], var.sql_sku)
      error_message = "SQL DB SKU must be a Serverless General Purpose tier (GP_S_Gen5_N). Do not use DTU tiers."
    }
  }

  resource "azurerm_mssql_database" "app" {
    name         = var.sql_database_name
    server_id    = azurerm_mssql_server.primary.id
    collation    = "SQL_Latin1_General_CP1_CI_AS"
    license_type = "LicenseIncluded"
    sku_name     = var.sql_sku             # start with GP_S_Gen5_2

    auto_pause_delay_in_minutes = 60       # pause after 60 min idle; set -1 for always-on
    min_capacity                = 0.5      # minimum vCores billed when active

    storage_account_type = "Local"         # change to "Geo" if geo-redundant backups are required
    max_size_gb          = 32              # increase when approaching 80% utilisation
  }

Scaling path (single variable change, no data movement):
  GP_S_Gen5_2 → GP_S_Gen5_4 → GP_S_Gen5_8 → GP_S_Gen5_16
  Beyond 16 vCores or at >500 tenants: migrate online to Hyperscale (azurerm_mssql_database
  with sku_name = "HS_Gen5_*"). Hyperscale migration is online with no application changes.

Part 2 — Private Endpoint (preferred over public endpoint).

  resource "azurerm_private_endpoint" "sql" {
    name                = "pe-sql-app"
    resource_group_name = var.resource_group_name
    location            = var.location
    subnet_id           = azurerm_subnet.app.id

    private_service_connection {
      name                           = "psc-sql-app"
      private_connection_resource_id = azurerm_mssql_server.primary.id
      subresource_names              = ["sqlServer"]
      is_manual_connection           = false
    }
  }

  # Block all public access
  resource "azurerm_mssql_firewall_rule" "deny_all" {
    name             = "deny-all"
    server_id        = azurerm_mssql_server.primary.id
    start_ip_address = "0.0.0.0"
    end_ip_address   = "0.0.0.0"
  }

Part 3 — Named read replica for analytics and hot-path read routes.

  resource "azurerm_mssql_database" "read_replica" {
    name               = "${var.sql_database_name}-replica"
    server_id          = azurerm_mssql_server.primary.id
    create_mode        = "Secondary"
    source_database_id = azurerm_mssql_database.app.id
    sku_name           = "GP_S_Gen5_2"     # size independently; start small
    auto_pause_delay_in_minutes = 60
    min_capacity                = 0.5
  }

Set SqlServer:ReadReplica:FailoverGroupReadOnlyListenerConnectionString in Key Vault to:
  Server=tcp:<server>.database.windows.net,1433;Database=<db-name>-replica;...
The ReadReplicaRoutedConnectionFactory falls back to primary when this is null/empty —
provision the replica first, let it catch up, then set the connection string.

Part 4 — Connection string format.

Azure SQL DB connection string format (store in Key Vault, never in appsettings):
  Server=tcp:<server-name>.database.windows.net,1433;
  Database=<db-name>;
  Authentication=Active Directory Default;
  Encrypt=True;
  TrustServerCertificate=False;
  Connection Timeout=30;

Use Managed Identity (Authentication=Active Directory Default) rather than SQL login for
the application identity. Grant the app's managed identity the db_datareader / db_datawriter
roles via a post-provisioning SQL script or azurerm_mssql_firewall_rule equivalent.

Part 5 — DbUp bootstrap.

The DbUp migration runner applies all migrations to a fresh empty database on first startup.
No pre-seeding or schema import is required. Confirm by running the integration test suite
against the freshly provisioned database before any traffic is directed to it.

Constraints:
- Never use DTU-based SKUs. Standard DTU lacks columnstore index support (blocks #36).
  Premium DTU has no online path to Hyperscale.
- Do not set auto_pause_delay_in_minutes = -1 (always-on) without first measuring active hours
  in production; the 60-minute default aligns well with bursty agent-run workloads.
- The named replica must be in the same Azure region as the primary to avoid cross-region
  replication lag on the hot read paths.
- The Improvement #37 Terraform validation block documents Azure SQL DB Serverless tempdb
  behaviour (auto-scales with active vCores); no fixed file-count assertion is needed.

Acceptance Criteria: azurerm_mssql_database.app provisions successfully; all DbUp migrations
apply cleanly on the empty database; ReadReplicaRoutedConnectionFactory routes analytics reads
to the named replica; all integration and smoke tests pass; public endpoint is blocked;
private endpoint resolves from the application subnet.
```

### 39. Add OpenTelemetry SQL Client Instrumentation
- **Why it matters:** Every HTTP request trace currently has a gap where database calls happen with no spans. There is no `AddSqlClientInstrumentation()` in the OTel tracer builder. This means slow queries are invisible in Jaeger/Tempo/Application Insights — you cannot identify which SQL statement caused a slow request, which tenant is the P95 latency driver, or whether a spike is network, query-plan, or lock-wait. The fix is one NuGet package and one line in the tracer builder.
- **Expected impact:** Directly improves Reliability (+1 pt) and Maintainability (+1 pt). Correlates every HTTP span with its database calls; enables slow-query identification without DMV access. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability, Maintainability.
- **Actionable now:** Yes.
```cursor
Add OpenTelemetry SQL client instrumentation to the tracer builder.

Step 1 — Add the NuGet package to the host project (ArchLucid.Api or whichever project configures OTel):
  dotnet add package OpenTelemetry.Instrumentation.SqlClient

Step 2 — Find the existing OpenTelemetry tracer builder registration (search for WithTracing or
  AddSource in Program.cs / ServiceCollectionExtensions) and add:
    .AddSqlClientInstrumentation(options =>
    {
        // Capture the SQL statement text in the span so slow queries are identifiable.
        // Do not enable in environments where query text could contain sensitive literal values;
        // parameterised queries (all Dapper queries here) are safe to capture.
        options.SetDbStatementForText = true;
        options.SetDbStatementForStoredProcedure = true;
        options.RecordException = true;
    })

Step 3 — Confirm the OTel exporter (OTLP / Prometheus) is already configured. No additional
  exporter configuration is needed — SQL spans flow through the same pipeline as HTTP spans.

Step 4 — Add an integration smoke test that:
  - Executes one Dapper query via SqlRunRepository.GetByIdAsync
  - Asserts that the resulting Activity has db.system = "mssql" and db.statement is non-empty

Constraints:
- SetDbStatementForText = true is safe here because all queries use @parameter syntax (no string
  concatenation). Verify this assumption by searching for string interpolation in SQL strings
  before enabling in production.
- Do not enable SetDbStatementForText in a shared staging environment where tenant data could
  appear in literal query text.
- Do not add the package to ArchLucid.Persistence — instrumentation is infrastructure wiring,
  not persistence logic.

Acceptance Criteria: A traced HTTP request to GET /api/runs produces child spans with
db.system = "mssql"; slow queries appear in the trace waterfall; RecordException = true means
SQL errors appear as span events; existing OTel/Prometheus integration tests pass.
```

### 40. Publish Connection Pool Metrics to Prometheus
- **Why it matters:** `Microsoft.Data.SqlClient` exposes pool metrics via its internal `EventSource` — active connections, idle connections, stasis connections, pool wait time, and hard/soft connect/disconnect rates. None of these are currently subscribed to or published to Prometheus. Connection pool exhaustion is the most common production SQL reliability event in .NET — it produces no observable signal until requests begin failing with `Timeout expired. The timeout period elapsed prior to obtaining a connection from the pool`. By the time that error appears, the pool has been saturated for seconds. Publishing pool metrics as Prometheus gauges allows alerting on pool utilisation approaching the limit before exhaustion occurs.
- **Expected impact:** Directly improves Reliability (+2 pts). Closes the most critical operational blind spot in the SQL connection layer. Weighted readiness impact: +0.02%.
- **Affected qualities:** Reliability.
- **Actionable now:** Yes.
```cursor
Publish Microsoft.Data.SqlClient connection pool metrics to the existing Prometheus/OTel pipeline.

Create ArchLucid.Host.Core/Diagnostics/SqlConnectionPoolMetricsListener.cs:

    /// <summary>
    /// Subscribes to the Microsoft.Data.SqlClient EventSource and publishes
    /// connection pool metrics as OTel observable gauges for Prometheus scrape.
    /// </summary>
    public sealed class SqlConnectionPoolMetricsListener : IHostedService, IDisposable
    {
        // Microsoft.Data.SqlClient publishes pool counters via System.Diagnostics.Metrics
        // (IMeterFactory) in v5.2+. For earlier versions use EventSource / EventListener.
        // Check the installed version before choosing the approach:
        //   v5.2+: use IMeterFactory with meter name "Microsoft.Data.SqlClient"
        //   v5.1 and below: use EventListener targeting "Microsoft.Data.SqlClient.EventSource"

        private readonly IMeterFactory _meterFactory;
        private Meter? _meter;
        private readonly List<IDisposable> _subscriptions = [];

        public SqlConnectionPoolMetricsListener(IMeterFactory meterFactory)
        {
            _meterFactory = meterFactory;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _meter = _meterFactory.Create("ArchLucid.SqlPool");

            // For Microsoft.Data.SqlClient v5.2+ the driver emits these meters natively.
            // Register observable gauges that re-expose the driver counters under the
            // archlucid_ namespace so Grafana dashboards have a stable metric name.

            // Active connections currently in use (not idle in pool)
            _meter.CreateObservableGauge(
                "archlucid_sql_pool_active_connections",
                () => SqlClientMetrics.GetActiveConnections(),
                description: "Number of active SQL connections in use (not pooled).");

            // Idle connections available in pool
            _meter.CreateObservableGauge(
                "archlucid_sql_pool_idle_connections",
                () => SqlClientMetrics.GetIdleConnections(),
                description: "Number of idle SQL connections available in pool.");

            // Pool wait time (p99 proxy: if this grows, pool is near exhaustion)
            _meter.CreateObservableGauge(
                "archlucid_sql_pool_wait_time_ms",
                () => SqlClientMetrics.GetPoolWaitTimeMs(),
                description: "Time in ms waiting for a connection from the pool.");

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _meter?.Dispose();
            return Task.CompletedTask;
        }

        public void Dispose() => _meter?.Dispose();
    }

    // SqlClientMetrics.cs — thin wrapper isolating the driver-version-specific API from the gauge callbacks.
    internal static class SqlClientMetrics
    {
        // Implement using the approach appropriate for the installed SqlClient version.
        // v5.2+: read from the SqlClientMetrics static counters exposed via IMeter.
        // v5.1: subscribe to Microsoft.Data.SqlClient.EventSource via EventListener pattern.
        // The exact counter names are: active-hard-connections, active-soft-connections,
        // free-soft-connections, stasis-connections, connection-pool-hits, connection-pool-misses.
        // Reference: https://learn.microsoft.com/en-us/sql/connect/ado-net/enable-eventsource-tracing
    }

Register the hosted service in DI:
    services.AddHostedService<SqlConnectionPoolMetricsListener>();

Add a Prometheus alerting rule (in infra/prometheus/archlucid-alerts.yml):
    - alert: SqlPoolNearExhaustion
      expr: archlucid_sql_pool_active_connections / (archlucid_sql_pool_active_connections + archlucid_sql_pool_idle_connections) > 0.80
      for: 2m
      labels:
        severity: warning
      annotations:
        summary: "SQL connection pool above 80% utilisation for 2 minutes"

Constraints:
- Verify the Microsoft.Data.SqlClient package version in ArchLucid.Api.csproj before choosing
  the EventSource vs IMeterFactory approach.
- Do not set SqlConnectionPool MaxPoolSize below 100 without profiling; the default of 100
  is usually appropriate and the alert fires at 80 active connections.
- The hosted service must handle StartAsync failures gracefully (log and degrade, not throw)
  so a missing EventSource does not prevent startup.

Acceptance Criteria: archlucid_sql_pool_active_connections and archlucid_sql_pool_idle_connections
appear in the Prometheus /metrics scrape endpoint; the SqlPoolNearExhaustion alert rule passes
promtool lint; unit tests cover the SqlClientMetrics wrapper for both EventSource and IMeter paths.
```

### 41. Enhance SqlConnectionHealthCheck with Latency Measurement
- **Why it matters:** `SqlConnectionHealthCheck` currently opens a connection and returns Healthy if no exception is thrown. A database under severe load that is still reachable — returning queries in 8 seconds — looks identical to a healthy database. This is a brownout blind spot: the health check stays green while users experience timeouts. Adding a `SELECT 1` with a stopwatch measurement and a Degraded threshold at 500ms surfaces latency degradation before it becomes an outage. The existing Degraded/Unhealthy distinction already handles transient vs fatal correctly; this adds the missing performance dimension.
- **Expected impact:** Directly improves Reliability (+1 pt). Enables alerting on database brownouts before they breach SLA. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability.
- **Actionable now:** Yes.
```cursor
Enhance SqlConnectionHealthCheck to measure query execution latency.

In ArchLucid.Host.Core/Health/SqlConnectionHealthCheck.cs, replace the current body with:

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(archLucidOptions.Value.StorageProvider))
            return HealthCheckResult.Healthy("Database readiness skipped: storage is InMemory.");

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using DbConnection connection =
                (DbConnection)await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

            await using DbCommand cmd = connection.CreateCommand();
            cmd.CommandText = "SELECT 1;";
            _ = await cmd.ExecuteScalarAsync(cancellationToken);

            sw.Stop();

            return sw.ElapsedMilliseconds > DegradedThresholdMs
                ? HealthCheckResult.Degraded(
                    $"Database responded in {sw.ElapsedMilliseconds}ms (threshold: {DegradedThresholdMs}ms).")
                : HealthCheckResult.Healthy(
                    $"Database connection successful ({sw.ElapsedMilliseconds}ms).");
        }
        catch (SqlException ex) when (SqlTransientDetector.IsTransient(ex))
        {
            return HealthCheckResult.Degraded("Database connection hit a transient error.", ex);
        }
        catch (TimeoutException ex)
        {
            return HealthCheckResult.Degraded("Database connection timed out.", ex);
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database connection failed.", ex);
        }
    }

    private const int DegradedThresholdMs = 500;

Add the Stopwatch using directive: using System.Diagnostics;

Update SqlConnectionHealthCheckTests.cs to:
- Assert Healthy when the mock connection resolves within threshold.
- Assert Degraded when elapsed time exceeds DegradedThresholdMs (inject a fake time source or
  mock the stopwatch if needed — prefer a simple integration-style test with a real in-memory stub).

Constraints:
- Do not change the Unhealthy path — SqlException + non-transient errors must remain Unhealthy.
- The threshold (500ms) should be configurable via IOptions<SqlConnectionHealthCheckOptions>
  rather than a constant so it can be tuned per environment without redeployment.
- Do not add this latency check to AzureSqlReadReplicaHealthCheck — the replica check's
  purpose is routing verification, not latency measurement.

Acceptance Criteria: SqlConnectionHealthCheck returns Degraded when SELECT 1 exceeds the
configured threshold; returns Healthy with elapsed ms in the description when below threshold;
existing Unhealthy path for fatal SqlException is unchanged; all health check unit tests pass.
```

### 42. Enable Azure SQL Intelligent Insights and Wire Alerts into Prometheus
- **Why it matters:** Azure SQL Database provides Query Performance Insight, Intelligent Insights (ML-based anomaly detection for blocking, plan regression, slow queries, memory pressure), and automatic tuning recommendations at no additional cost. None of these are enabled or surfaced in Terraform today. Without them, diagnosing a production slowdown requires DMV access (`sys.dm_exec_query_stats`, `sys.dm_exec_requests`) which is a manual operation. Enabling diagnostic settings and creating Azure Monitor metric alert rules for CPU, connection failures, and deadlocks converts these into automatic alerts routed to the same channel as other Prometheus alerts.
- **Expected impact:** Directly improves Reliability (+1 pt). Surfaces platform-level SQL anomalies without application code changes; automatic tuning can propose index additions as the data grows. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability, Maintainability.
- **Actionable now:** Yes — pure Terraform change, no code changes.
```cursor
Enable Azure SQL Intelligent Insights, diagnostic settings, and metric alerts in Terraform.

Part 1 — Enable diagnostic settings on the SQL database resource.

  resource "azurerm_monitor_diagnostic_setting" "sql_db" {
    name               = "sql-diagnostics"
    target_resource_id = azurerm_mssql_database.app.id
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

    enabled_log {
      category = "SQLInsights"          # Query Performance Insight data
    }
    enabled_log {
      category = "AutomaticTuning"      # Index recommendations
    }
    enabled_log {
      category = "QueryStoreRuntimeStatistics"
    }
    enabled_log {
      category = "Errors"
    }
    enabled_log {
      category = "Deadlocks"
    }

    metric {
      category = "Basic"
      enabled  = true
    }
    metric {
      category = "InstanceAndAppAdvanced"
      enabled  = true
    }
  }

Part 2 — Enable automatic tuning (index recommendations only; do not enable auto-apply
  for CREATE INDEX without reviewing recommendations first):

  resource "azurerm_mssql_database" "app" {
    # ... existing config ...

    threat_detection_policy {
      state = "Enabled"
    }
  }

  resource "azurerm_mssql_server_microsoft_support_auditing_policy" "main" {
    server_id = azurerm_mssql_server.primary.id
  }

Part 3 — Azure Monitor metric alert rules.

  # Alert: CPU above 80% for 5 minutes
  resource "azurerm_monitor_metric_alert" "sql_cpu" {
    name                = "sql-cpu-high"
    resource_group_name = var.resource_group_name
    scopes              = [azurerm_mssql_database.app.id]
    severity            = 2

    criteria {
      metric_namespace = "Microsoft.Sql/servers/databases"
      metric_name      = "cpu_percent"
      aggregation      = "Average"
      operator         = "GreaterThan"
      threshold        = 80
    }

    frequency   = "PT1M"
    window_size = "PT5M"

    action {
      action_group_id = azurerm_monitor_action_group.alerts.id
    }
  }

  # Alert: Connection failures above 5 per minute
  resource "azurerm_monitor_metric_alert" "sql_connections" {
    name                = "sql-connection-failures"
    resource_group_name = var.resource_group_name
    scopes              = [azurerm_mssql_database.app.id]
    severity            = 1

    criteria {
      metric_namespace = "Microsoft.Sql/servers/databases"
      metric_name      = "connection_failed"
      aggregation      = "Total"
      operator         = "GreaterThan"
      threshold        = 5
    }

    frequency   = "PT1M"
    window_size = "PT1M"

    action {
      action_group_id = azurerm_monitor_action_group.alerts.id
    }
  }

  # Alert: Deadlocks detected
  resource "azurerm_monitor_metric_alert" "sql_deadlocks" {
    name                = "sql-deadlocks"
    resource_group_name = var.resource_group_name
    scopes              = [azurerm_mssql_database.app.id]
    severity            = 2

    criteria {
      metric_namespace = "Microsoft.Sql/servers/databases"
      metric_name      = "deadlock"
      aggregation      = "Total"
      operator         = "GreaterThan"
      threshold        = 0
    }

    frequency   = "PT1M"
    window_size = "PT5M"

    action {
      action_group_id = azurerm_monitor_action_group.alerts.id
    }
  }

Part 4 — Add outbox depth alerting rules to infra/prometheus/archlucid-alerts.yml
  (these use the existing Prometheus metrics emitted by OutboxOperationalMetricsHostedService):

    - alert: AuthorityOutboxStalled
      expr: archlucid_authority_pipeline_work_oldest_pending_age_seconds > 300
      for: 2m
      labels:
        severity: critical
      annotations:
        summary: "Authority pipeline outbox has items older than 5 minutes"

    - alert: IntegrationOutboxDeadLetterGrowing
      expr: archlucid_integration_event_outbox_dead_letter_count > 0
      for: 0m
      labels:
        severity: warning
      annotations:
        summary: "Integration event outbox has dead-lettered items"

Constraints:
- Do not enable AutomaticTuning auto_apply for CREATE INDEX without a manual review process —
  automatic index creation can degrade write performance on insert-heavy tables.
- The azurerm_monitor_action_group.alerts resource must already exist; reference the existing
  one rather than creating a new action group.
- Diagnostic settings for Azure SQL DB Serverless incur Log Analytics ingestion costs (~$2.30/GB).
  Enable only the categories listed above; do not enable all_logs.

Acceptance Criteria: terraform plan shows diagnostic settings, 3 metric alert rules, and outbox
alert rules with no errors; terraform apply completes without manual steps; CPU/connection/deadlock
alerts appear in the Azure Portal under the SQL database resource; the two Prometheus alert rules
pass promtool lint; existing Terraform CI plan checks pass.
```

### 43. Harden SQL Backup: PITR 35 Days, Geo-Redundant Backup Storage, and Long-Term Retention Policy
- **Why it matters:** Three independent backup gaps exist today. (1) Azure SQL Database short-term retention defaults to **7 days** — no PITR override is set anywhere in Terraform. If a data corruption event is discovered after day 7, there is no recovery path. Production should use the platform maximum of 35 days. (2) `backup_storage_redundancy` is never set — the default for General Purpose Serverless is zone-redundant backup storage, which means backups stay in a single Azure region. A regional loss destroys both the primary database and its backups simultaneously. Setting it to `Geo` replicates backups to a paired region, achieving true cross-region RPO coverage. (3) No Long-Term Retention (LTR) policy exists — enterprise customers and SOC 2 auditors routinely ask "can you restore data from 90 days ago?" The 35-day PITR window cannot answer that; LTR weekly/monthly snapshots can. All three are pure Terraform additions to the `azurerm_mssql_database` resource from Improvement #38.
- **Expected impact:** Directly improves Reliability (+2 pts). Closes the most impactful single-point-of-failure in the data recovery stack. Without geo-redundant backup storage, the published RPO target of <5 minutes is unachievable after a full regional loss — backups and live data fail together. Weighted readiness impact: +0.02%.
- **Affected qualities:** Reliability.
- **Actionable now:** Yes — pure Terraform, no application code changes.
```cursor
Extend the azurerm_mssql_database.app resource (from Improvement #38) with backup hardening.

Part 1 — Short-term retention (PITR) and backup storage redundancy.
Add these properties to the azurerm_mssql_database.app resource block:

    # Retain point-in-time backups for 35 days (platform maximum for General Purpose Serverless).
    # Default is 7 days — insufficient to catch slowly-degrading data corruption.
    short_term_retention_policy {
      retention_days           = 35
      backup_interval_in_hours = 12  # 12-hour differential backup interval (default)
    }

    # Geo-redundant backup storage: backups replicate to Azure paired region.
    # Default for GP Serverless is ZRS (zone-redundant, same region only).
    # Without Geo, a full regional outage destroys both the live database AND all backups.
    backup_storage_redundancy = "Geo"

Part 2 — Long-Term Retention (LTR) policy.
Add a separate resource for LTR (this is a separate Terraform resource, not a block inside the database):

    resource "azurerm_mssql_database_long_term_retention_policy" "app" {
      database_id = azurerm_mssql_database.app.id

      # Keep one weekly backup for 1 month (covers SOC 2 quarterly review window)
      weekly_retention = "P1M"

      # Keep one monthly backup for 12 months (covers annual audit look-back window)
      monthly_retention = "P12M"

      # Keep one yearly backup for 7 years (covers GDPR / data processing agreement retention)
      # Note: yearly_retention requires week_of_year. Week 1 = first full week of the year.
      yearly_retention = "P7Y"
      week_of_year     = 1
    }

Part 3 — Add LTR variables to variables.tf:

    variable "sql_ltr_weekly_retention" {
      type        = string
      description = "ISO 8601 retention period for weekly LTR backups (e.g. P1M = 1 month, P3M = 3 months). Set to PT0S to disable."
      default     = "P1M"
    }

    variable "sql_ltr_monthly_retention" {
      type        = string
      description = "ISO 8601 retention period for monthly LTR backups (e.g. P12M = 12 months, P2Y = 2 years). Set to PT0S to disable."
      default     = "P12M"
    }

    variable "sql_ltr_yearly_retention" {
      type        = string
      description = "ISO 8601 retention period for yearly LTR backups (e.g. P7Y = 7 years). Set to PT0S to disable."
      default     = "P7Y"
    }

    variable "sql_ltr_week_of_year" {
      type        = number
      description = "ISO week number (1-52) for the yearly LTR snapshot."
      default     = 1
    }

Part 4 — Update production.tfvars.example to document the LTR variables.

Constraints:
- backup_storage_redundancy = "Geo" is not changeable after database creation without recreation.
  Set this correctly during the initial provision (Improvement #38). If changing an existing database,
  plan for a maintenance window and a blue/green swap.
- LTR backups incur Azure Blob Storage costs at GRS rates. At typical database sizes (<100 GB)
  the monthly LTR cost is negligible (<$5/month). Yearly retention for 7 years is the larger item —
  estimate and communicate to FinOps before enabling in production.
- The azurerm_mssql_database_long_term_retention_policy resource requires the database resource to
  exist first. Provision in order: database → LTR policy.
- Do NOT set yearly_retention without also setting week_of_year; the provider will error.

Acceptance Criteria: terraform plan shows backup_storage_redundancy = "Geo",
short_term_retention_policy.retention_days = 35, and azurerm_mssql_database_long_term_retention_policy
with weekly/monthly/yearly retention; terraform apply completes without errors; Azure Portal
shows "Geo-redundant backup storage" on the database properties blade; LTR policy appears in
the Azure Portal under the database → Manage backups → Long-term retention tab.
```

### 44. Enforce Failover Group Is Enabled for Production and Wire the Primary Connection String to the Listener FQDN
- **Why it matters:** Two independent gaps reduce the effective value of the geo-DR infrastructure that already exists. (1) `enable_sql_failover_group = false` is the default in `terraform-sql-failover/terraform.tfvars.example` — any production deployment that omits `production.tfvars.example` silently deploys with zero cross-region DR. The `RTO_RPO_TARGETS.md` target of RPO <5 min is contingent on the failover group being active; without it, RPO is "time since last backup" (hours, not minutes). (2) `DATABASE_FAILOVER.md` warns that using an individual server FQDN instead of the failover group listener FQDN requires manual configuration updates after failover. Examining `SqlServerOptions.cs`: the `FailoverGroupReadOnlyListenerConnectionString` wires the read-only path correctly, but there is no corresponding startup validation that the **write-path** `ConnectionStrings:ArchLucid` uses the listener FQDN (`{failover-group-name}.database.windows.net`) rather than a raw server name. During automatic failover, connections using the raw server FQDN continue hitting a non-writable ex-primary; only the listener FQDN transparently routes to the new primary.
- **Expected impact:** Directly improves Reliability (+2 pts). Closes the gap between documented RPO target and actual achievable RPO. Weighted readiness impact: +0.02%.
- **Affected qualities:** Reliability.
- **Actionable now:** Yes.
```cursor
Part 1 — Add a Terraform precondition asserting that production has the failover group enabled.

In terraform-sql-failover/variables.tf, add a validation variable:

    variable "environment_tier" {
      type        = string
      description = "Environment tier (development, staging, production). When production, enable_sql_failover_group must be true."
      default     = "development"

      validation {
        condition     = contains(["development", "staging", "production"], var.environment_tier)
        error_message = "environment_tier must be development, staging, or production."
      }
    }

In terraform-sql-failover/main.tf, add a lifecycle precondition on the failover group resource:

    resource "azurerm_mssql_failover_group" "this" {
      # ... existing config ...

      lifecycle {
        precondition {
          condition     = var.environment_tier != "production" || var.enable_sql_failover_group
          error_message = "enable_sql_failover_group must be true when environment_tier is production. The RTO/RPO target of RPO < 5 minutes cannot be met without an active failover group."
        }
      }
    }

Update production.tfvars.example to include:
    environment_tier = "production"

Part 2 — Add a startup validation rule in ArchLucidConfigurationRules.cs that asserts the
primary connection string contains the failover group listener hostname pattern when the
storage provider is Sql and the environment is Production.

In ArchLucid.Host.Core/Configuration/ArchLucidConfigurationRules.cs (or the existing validation
class), add:

    /// <summary>
    /// In production, the primary SQL connection string must use the failover group listener
    /// FQDN (e.g. {failover-group-name}.database.windows.net) so automatic geo-failover
    /// routes the write path to the new primary without manual intervention.
    /// An individual server FQDN (e.g. {server-name}.database.windows.net) stays pinned
    /// to the ex-primary after failover and causes write failures until reconfigured manually.
    /// </summary>
    private static ValidationResult ValidateSqlFailoverListenerFqdn(
        ArchLucidOptions options,
        IHostEnvironment environment)
    {
        if (!environment.IsProduction())
            return ValidationResult.Success!;

        if (options.StorageProvider != StorageProvider.Sql)
            return ValidationResult.Success!;

        string? cs = options.ConnectionString; // or however the primary connection string is accessed
        if (string.IsNullOrEmpty(cs))
            return new ValidationResult("ConnectionStrings:ArchLucid is required in Production.");

        // Azure SQL failover group listener FQDN pattern: does NOT contain ".sql.azuresynapse.net"
        // and the server segment should not be a plain logical server name ending in nothing but
        // the standard database.windows.net suffix with no failover group prefix.
        // The safest check: warn if the hostname matches the raw server pattern
        // {server-name}.database.windows.net rather than {fg-name}.database.windows.net.
        // Since the failover group name is configurable, check that the connection string
        // hostname is present in SqlServer:FailoverGroupListenerFqdn (new config key, optional).

        string? listenerFqdn = options.SqlServer?.FailoverGroupListenerFqdn?.Trim();

        if (string.IsNullOrEmpty(listenerFqdn))
        {
            // If not configured, emit a warning log but don't block startup.
            // Operators must explicitly opt out by leaving SqlServer:FailoverGroupListenerFqdn empty.
            return ValidationResult.Success!;
        }

        return cs.Contains(listenerFqdn, StringComparison.OrdinalIgnoreCase)
            ? ValidationResult.Success!
            : new ValidationResult(
                $"ConnectionStrings:ArchLucid does not contain the failover group listener FQDN " +
                $"'{listenerFqdn}'. In Production, the primary connection string must use the " +
                $"failover group listener so automatic geo-failover is transparent to the application. " +
                $"Update the connection string or set SqlServer:FailoverGroupListenerFqdn correctly.");
    }

Add SqlServer:FailoverGroupListenerFqdn to SqlServerOptions.cs:

    /// <summary>
    /// Optional. If set and the host is Production, the startup validation rule asserts that
    /// the primary connection string contains this FQDN segment, confirming the app uses the
    /// failover group read/write listener rather than a raw server hostname.
    /// Example: "archlucid-prod-sqlfg.database.windows.net"
    /// </summary>
    public string? FailoverGroupListenerFqdn { get; init; }

Add the key to appsettings.json documentation and CONFIGURATION_REFERENCE.md.

Constraints:
- The precondition in Terraform does not retroactively fix already-deployed environments;
  run terraform plan -var-file=production.tfvars.example in the next maintenance window.
- The startup validation is a warning, not a fatal error, when FailoverGroupListenerFqdn is not
  configured — this avoids breaking environments that deliberately run without a failover group
  (staging, developer). Only explicitly set it in production Key Vault / app configuration.
- Do not hardcode the failover group name in application code — it must remain a configuration value.

Acceptance Criteria: terraform plan with environment_tier = "production" and
enable_sql_failover_group = false fails with a clear precondition error message; starting the
app in Production with a raw server FQDN in the primary connection string and a correctly set
SqlServer:FailoverGroupListenerFqdn emits a validation warning in the startup logs; the existing
startup validation test suite covers the new rule; CONNECTION_REFERENCE.md documents the new key.
```

### 45. Enforce GRS for Production Artifact Storage and Create a Backup Restore Drill Runbook
- **Why it matters:** Two gaps around non-SQL durability and operational readiness. (1) Artifact blobs (golden manifests, evidence packages, agent trace blobs, AzureExtractor packages) are stored in a storage account provisioned by `terraform-storage`. The current dev `terraform.tfvars` hard-codes `account_replication_type = "LRS"`. Production is parameterised but has no validation enforcing `GRS` or `RAGRS`. LRS provides three copies within a single datacenter — a single datacenter failure destroys all copies. Agent run artifacts are the primary evidence record for tenant architecture reviews; losing them without recovery is a critical data durability event. Production should use `GRS` (cross-region read access is not required; `GRS` is sufficient and cheaper than `RAGRS`). (2) `RTO_RPO_TARGETS.md` states "Run at least annual geo-failover exercises for production; record actual RTO/RPO achieved." No runbook for this exercise exists. The RTO claim of <1 hour has never been validated with a timed drill. Without a documented and tested procedure, the first production failover is also the first rehearsal — exactly the wrong time to discover that connection strings were pointing at individual server FQDNs.
- **Expected impact:** Directly improves Reliability (+1 pt). Closes the non-SQL durability gap and validates that the documented RTO/RPO targets are achievable. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability.
- **Actionable now:** Yes.
```cursor
Part 1 — Enforce GRS for production artifact storage.

In infra/terraform-storage/variables.tf, add a validation to account_replication_type:

    variable "account_replication_type" {
      type        = string
      description = "Storage replication type. Use LRS for dev/test. Production must use GRS or RAGRS for cross-region artifact durability (blob artifacts are primary evidence records)."

      validation {
        condition     = contains(["LRS", "ZRS", "GRS", "RAGRS", "GZRS", "RAGZRS"], var.account_replication_type)
        error_message = "account_replication_type must be a valid Azure storage redundancy value."
      }
    }

Add a production.tfvars.example to terraform-storage:

    enable_storage_account        = true
    create_resource_group         = false
    resource_group_name           = "rg-archlucid-prod"
    location                      = "eastus2"
    storage_account_name          = "starchlucidprodarts"
    account_replication_type      = "GRS"     # Cross-region: protects artifacts against regional loss
    public_network_access_enabled = false      # Production: private endpoint only
    tags = {
      workload    = "archlucid"
      tier        = "production"
      environment = "prod"
    }

Note: do not add a Terraform precondition that blocks LRS (staging and lower environments
legitimately use LRS for cost). The production.tfvars.example is the enforcement mechanism;
the runbook (Part 2) documents the pre-deploy check.

Part 2 — Create docs/runbooks/BACKUP_RESTORE_DRILL.md:

    # Runbook: Backup Restore and Geo-Failover Drill

    **Frequency:** At minimum annually; also run after any Terraform SQL infrastructure change.

    ## Objectives
    - Validate that PITR restores succeed within the documented RTO window.
    - Validate that geo-failover completes and the application passes health checks.
    - Record actual RTO/RPO achieved for RTO_RPO_TARGETS.md review.

    ## Pre-drill checklist
    - [ ] Confirm terraform-sql-failover is applied with enable_sql_failover_group = true.
    - [ ] Confirm ConnectionStrings:ArchLucid uses the failover group listener FQDN.
    - [ ] Confirm backup_storage_redundancy = "Geo" on the database resource.
    - [ ] Confirm LTR policy is active (Azure Portal → DB → Manage backups → Long-term retention).
    - [ ] Notify on-call and relevant stakeholders of drill window.
    - [ ] Confirm you have Key Vault write access for connection string rotation if required.

    ## PITR restore test (non-destructive — restores to a NEW database)
    1. In Azure Portal or az CLI, initiate a point-in-time restore to a target time 1 hour ago:
       az sql db restore --resource-group <rg> --server <server> --name ArchLucid \
         --dest-name ArchLucid-PitrTest --time "<ISO-8601 target time>"
    2. Confirm the restore database reaches Online status. Record elapsed time.
    3. Smoke: connect to the restored database (read-only) and verify row counts on dbo.Runs.
    4. Delete ArchLucid-PitrTest after validation.

    ## Geo-failover drill (destructive to region; coordinate with SRE)
    1. Confirm secondary region database is in sync (Azure Portal → DB → Replicas → Replication lag < 5s).
    2. Initiate forced failover:
       az sql failover-group set-primary --name archlucid-prod-sqlfg \
         --resource-group <rg> --server <primary-server>
    3. Record time-to-failover-complete (listener FQDN DNS update).
    4. Run smoke tests via docs/library/LIVE_E2E_HAPPY_PATH.md against production endpoint.
    5. Confirm API /health/ready is Healthy within target RTO (60 minutes from drill start).
    6. Record actual RTO and RPO (replication lag at time of failover) in RTO_RPO_TARGETS.md.
    7. Fail back to original primary when confirmed healthy.

    ## LTR restore test (verify a monthly snapshot exists and is restorable)
    1. In Azure Portal → DB → Manage backups → Long-term retention, confirm at least one monthly
       backup exists and is not older than 35 days (first monthly will appear after week_of_year).
    2. Initiate a test restore to a new database from the most recent LTR backup.
    3. Confirm restore completes successfully. Record elapsed time.
    4. Delete the test database.

    ## Post-drill: update RTO_RPO_TARGETS.md
    - Record actual RTO achieved (vs target < 1 hour).
    - Record replication lag at failover time (vs target RPO < 5 minutes).
    - Update "Last reviewed" date in RTO_RPO_TARGETS.md.

Add a reference to this runbook in DATABASE_FAILOVER.md under "## Related".

Constraints:
- The geo-failover drill is disruptive to the secondary region's read-only workloads for
  several minutes during DNS propagation. Schedule during low-traffic hours.
- Do not run PITR or LTR restore tests against the primary database server — always restore
  to a new database name to avoid interfering with production.
- Failback after a drill may take additional time; plan for 2-3 hours total for the full drill.
- GRS replication for storage accounts incurs approximately 2x the LRS cost for the
  replicated data (egress charges from primary to secondary region). At typical artifact
  storage volumes (<100 GB), this is negligible.

Acceptance Criteria: terraform-storage plan with account_replication_type = "LRS" emits a
clear variable description warning; production.tfvars.example exists in terraform-storage with
account_replication_type = "GRS"; BACKUP_RESTORE_DRILL.md is committed to docs/runbooks/;
DATABASE_FAILOVER.md references the new runbook; RTO_RPO_TARGETS.md "Last reviewed" date
is updated after the first drill is completed.
```

### 46. Wire Two-Tier Alert Routing with SMS, Voice, and PagerDuty Free for Escalating Wakeup
- **Why it matters:** All production alerts currently route to a single Azure Monitor action group with one email receiver. The `severity: critical` and `severity: page` labels in the Prometheus rules are decorative — they do not change where the alert goes. Email will not wake you up. At 2am when the authority pipeline is dead and customers are losing run results, or the SQL circuit breaker is open and no new runs can start, email is invisible. Three specific gaps exist: (1) No SMS receiver — trivial to add, Azure Monitor supports it natively. (2) No voice receiver — Azure Monitor can call a phone number directly; if the call is not answered it retries once. (3) No escalation policy — if you sleep through a call, nothing else happens. PagerDuty Free (1 responder, free forever) adds a proper on-call escalation: push notification → SMS → phone call every 30 minutes until acknowledged, with a mobile app for one-tap acknowledgement. The whole integration is one webhook URL. Total incremental infrastructure cost: ~$0.10/call and $0/month for PagerDuty Free.
- **Expected impact:** Directly improves Reliability (+2 pts). This is the highest-leverage operational change for a solo founder — transforms silent 3am failures into actionable alerts. Weighted readiness impact: +0.02%.
- **Affected qualities:** Reliability.
- **Actionable now:** Yes — pure Terraform + PagerDuty free account signup (~20 minutes total).
```cursor
Part 1 — Sign up for PagerDuty Free and get a service integration key.

1. Go to https://www.pagerduty.com/sign-up/ — select "Free" plan (1 user, unlimited incidents, voice escalation).
2. Create a Service named "ArchLucid Production".
3. Add an Integration of type "Events API v2". Copy the Integration Key.
4. In your mobile app (PagerDuty iOS or Android), configure your on-call schedule and notification rules:
   - Notification rule 1 (0 min delay): push notification
   - Notification rule 2 (5 min delay): SMS to your mobile number
   - Notification rule 3 (15 min delay): phone call to your mobile number
   - Set the escalation policy: if not acknowledged within 30 minutes, repeat.
5. Your webhook URL will be: https://events.pagerduty.com/integration/{integration-key}/enqueue

Part 2 — Add a dedicated P0-critical action group to terraform-monitoring/main.tf.

Add alongside the existing azurerm_monitor_action_group.ops:

    # P0-critical action group: SMS + voice (Azure-native, instant) + PagerDuty (escalating, wakes you up).
    # Use this action group only for P0 alerts that threaten revenue or customer data.
    resource "azurerm_monitor_action_group" "critical" {
      count = local.enabled && var.enable_critical_action_group ? 1 : 0

      name                = "${var.name_prefix}-critical-ag"
      resource_group_name = var.resource_group_name
      short_name          = substr(replace("${var.name_prefix}p0", "-", ""), 0, 12)

      # Email: belt-and-suspenders alongside voice/SMS
      email_receiver {
        name                    = "primary"
        email_address           = var.alert_email_address
        use_common_alert_schema = true
      }

      # SMS: Azure-native, ~$0.02 per message. Instant.
      dynamic "sms_receiver" {
        for_each = length(trimspace(var.alert_sms_country_code)) > 0 && length(trimspace(var.alert_sms_phone_number)) > 0 ? [1] : []
        content {
          name         = "sms-primary"
          country_code = var.alert_sms_country_code
          phone_number = var.alert_sms_phone_number
        }
      }

      # Voice call: Azure-native, ~$0.10 per call. Fires once; PagerDuty handles escalation.
      dynamic "voice_receiver" {
        for_each = length(trimspace(var.alert_voice_country_code)) > 0 && length(trimspace(var.alert_voice_phone_number)) > 0 ? [1] : []
        content {
          name         = "voice-primary"
          country_code = var.alert_voice_country_code
          phone_number = var.alert_voice_phone_number
        }
      }

      # PagerDuty: escalating wakeup via Events API v2 webhook.
      # Calls your phone every 30 minutes until acknowledged via the mobile app.
      dynamic "webhook_receiver" {
        for_each = length(trimspace(var.alert_pagerduty_webhook_uri)) > 0 ? [1] : []
        content {
          name                    = "pagerduty"
          service_uri             = var.alert_pagerduty_webhook_uri
          use_common_alert_schema = true
        }
      }

      tags = var.tags
    }

Part 3 — Add variables to terraform-monitoring/variables.tf:

    variable "enable_critical_action_group" {
      type        = bool
      description = "When true, create the P0-critical action group with SMS, voice, and PagerDuty receivers."
      default     = false
    }

    variable "alert_sms_country_code" {
      type        = string
      description = "Country code for SMS alerts (digits only, no +, e.g. 1 for US/Canada)."
      default     = ""
      sensitive   = true
    }

    variable "alert_sms_phone_number" {
      type        = string
      description = "Phone number for SMS alerts (digits only, no dashes, e.g. 2025550100)."
      default     = ""
      sensitive   = true
    }

    variable "alert_voice_country_code" {
      type        = string
      description = "Country code for voice call alerts (digits only, e.g. 1 for US/Canada). Same number as SMS is fine."
      default     = ""
      sensitive   = true
    }

    variable "alert_voice_phone_number" {
      type        = string
      description = "Phone number for voice call alerts (digits only, no dashes)."
      default     = ""
      sensitive   = true
    }

    variable "alert_pagerduty_webhook_uri" {
      type        = string
      description = "PagerDuty Events API v2 URL: https://events.pagerduty.com/integration/{key}/enqueue. Get from PagerDuty service Integrations tab."
      default     = ""
      sensitive   = true
    }

Part 4 — Update infra/prometheus/archlucid-alerts.yml to define the P0 alert tier.

Re-label the following existing alerts from severity: warning to severity: critical:
  - ArchLucidAuthorityPipelineWorkDeadLetters  (already critical — confirm it routes to ag-critical)
  - ArchLucidCircuitBreakerOpen (circuit breaker open = no LLM calls can complete = full service degradation)
  - ArchLucidTrialSignupFailuresHigh (already severity: page — change to critical and route correctly)

Add these new P0 alert rules (customer-facing revenue events):

    # P0: API completely unavailable (all revisions unhealthy)
    - alert: ArchLucidApiUnavailable
      expr: |
        absent(up{job="archlucid-api"}) or sum(up{job="archlucid-api"}) == 0
      for: 2m
      labels:
        severity: critical
        tier: p0
      annotations:
        summary: "ArchLucid API is unreachable — no healthy instances"
        description: >-
          All API instances are down or the scrape target is missing. Customers cannot submit
          requests. Check Container Apps health, recent deployments, and SQL connectivity.

    # P0: SQL connection failures sustained (database unreachable)
    - alert: ArchLucidSqlConnectionFailuresSustained
      expr: |
        archlucid_sql_connection_failures_total > 0
      for: 3m
      labels:
        severity: critical
        tier: p0
      annotations:
        summary: "SQL connection failures — database may be unreachable"
        description: >-
          archlucid_sql_connection_failures_total is non-zero for 3 minutes. Runs, governance
          resolution, and outbox processing are all failing. Check database health and
          failover group status. See docs/runbooks/DATABASE_FAILOVER.md.

    # P0: Health endpoint reporting Unhealthy (not Degraded — full outage)
    - alert: ArchLucidHealthCheckUnhealthy
      expr: |
        archlucid_health_check_status{status="Unhealthy"} > 0
      for: 2m
      labels:
        severity: critical
        tier: p0
      annotations:
        summary: "ArchLucid /health/ready reporting Unhealthy"
        description: >-
          At least one health check is in Unhealthy state (not Degraded) for 2 minutes.
          This means the readiness probe is failing and Container Apps may be restarting.

Part 5 — Wire the P0 alerts to the critical action group in terraform-monitoring/main.tf.
For each of the P0-labelled Prometheus rules, add a corresponding azurerm_monitor_metric_alert
or azurerm_monitor_scheduled_query_rules_alert_v2 resource pointing at
azurerm_monitor_action_group.critical[0].id rather than azurerm_monitor_action_group.ops[0].id.

Alternatively (simpler): if using Grafana Alerting as the Prometheus frontend, create a second
Grafana contact point pointing to the PagerDuty Events API v2, and configure the alert routing
tree so alerts with labels {tier="p0"} route to that contact point.

Part 6 — Store sensitive values in Azure Key Vault, not tfvars.
Add the following to Key Vault (or use terraform-keyvault if it is already managing secrets):

    az keyvault secret set --vault-name <kv-name> --name "alert-sms-phone-number" --value "<your-number>"
    az keyvault secret set --vault-name <kv-name> --name "alert-voice-phone-number" --value "<your-number>"
    az keyvault secret set --vault-name <kv-name> --name "alert-pagerduty-webhook-uri" --value "<your-pd-url>"

Reference them in your production.tfvars (or pipeline) as data sources, not literal values,
so they never appear in state files in plain text.

Constraints:
- Azure Monitor voice_receiver and sms_receiver fire once when the alert fires — they do NOT
  retry on their own. PagerDuty provides the retry/escalation loop; both should be present.
- The PagerDuty free plan allows 1 responder account. If you ever add a co-founder or SRE,
  upgrade to Stakeholder ($19/month) for multi-user escalation policies.
- Do not route ALL alerts to the critical action group — alert fatigue will cause you to ignore
  the phone at 3am. Only P0 (existential) events earn a phone call.
- Country codes and phone numbers must be digits only (no + prefix, no dashes).
  US example: country_code = "1", phone_number = "2025550100".
- Azure Monitor voice calls are synthetic TTS audio: "Azure Monitor alert: {alert name}".
  Ensure the alert name is human-readable and unambiguous (e.g. "ArchLucidSqlConnectionFailuresSustained").

Acceptance Criteria: terraform plan shows azurerm_monitor_action_group.critical with email,
sms_receiver, voice_receiver, and webhook_receiver blocks; terraform apply completes; a test
alert fired from Azure Portal routes to both Azure Monitor SMS/voice AND triggers a PagerDuty
incident with push notification, SMS, and escalating phone call after acknowledgement timeout;
ArchLucidCircuitBreakerOpen, ArchLucidAuthorityPipelineWorkDeadLetters, and
ArchLucidTrialSignupFailuresHigh route to the critical action group; all other alerts continue
routing to the ops (email-only) action group.
```

### 47. Enable Microsoft Defender for SQL and SQL Server Auditing in Terraform
- **Why it matters:** Three critical security observability gaps exist today. (1) **No SQL Server Auditing** — Azure SQL's platform-level audit log captures every login, every query, every schema change, and every permission grant to Log Analytics or Blob storage. Without it, there is no forensics trail if a credential is stolen or a query causes unexpected data access. There is no way to answer "did anyone read tenant X's data on Thursday?" after the fact. (2) **No Microsoft Defender for SQL** — Defender for SQL provides Advanced Threat Protection (detects SQL injection patterns, unusual query volumes, access from unusual locations, brute-force login attempts) and automated Vulnerability Assessment (scans the server for misconfigurations, overly permissive accounts, missing baseline security settings). Neither is configured in any Terraform module today. (3) **No Defender alerts routed to the existing action group** — even if Defender for SQL were enabled manually in the portal, its alerts would not reach the existing `ag-ops` email or the new `ag-critical` PagerDuty webhook. All three are pure Terraform additions to the SQL infrastructure module.
- **Expected impact:** Directly improves Reliability (+1 pt) and closes the most significant audit/forensics gap in the security posture. Without SQL auditing, SOC 2 Type II auditors will require platform-level logging evidence that does not exist. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability, Security.
- **Actionable now:** Yes — pure Terraform, no application code changes.
```cursor
Add to the SQL infrastructure Terraform (extend the resources from Improvement #38 or an
equivalent SQL server module).

Part 1 — SQL Server Auditing (platform-level query and login audit trail).

    resource "azurerm_mssql_server_extended_auditing_policy" "primary" {
      server_id = azurerm_mssql_server.primary.id

      # Route audit logs to Log Analytics (same workspace as Container Apps for unified querying).
      log_monitoring_enabled = true

      # Retain 90 days in the auditing system (Log Analytics retention governs the actual window;
      # set Log Analytics workspace retention to at least 90 days).
      retention_in_days = 90

      # Do not enable storage_endpoint auditing (Log Analytics is sufficient and cheaper).
      # Avoid setting storage_account_access_key — use MI or no-storage path.
    }

    # Optionally add database-level auditing if you need per-database isolation.
    # Server-level policy is inherited by all databases, so this is usually unnecessary.

Part 2 — Microsoft Defender for SQL (threat detection + vulnerability assessment).

    # Threat protection (Advanced Threat Protection).
    # Detects: SQL injection, unusual data access volume, access from unusual IPs, brute force.
    resource "azurerm_mssql_server_security_alert_policy" "primary" {
      resource_group_name = var.resource_group_name
      server_name         = azurerm_mssql_server.primary.name
      state               = "Enabled"
      email_account_admins = true
      email_addresses     = [var.alert_email_address]

      # Alert on all threat categories.
      # To narrow the scope later: disabled_alerts = ["Sql_Injection_Vulnerability"]
      disabled_alerts = []

      # Retention for threat detection events (days).
      retention_days = 90
    }

    # Vulnerability Assessment: periodic automated scan for security misconfigurations.
    # Results appear in Microsoft Defender for Cloud recommendations.
    resource "azurerm_mssql_server_vulnerability_assessment" "primary" {
      server_security_alert_policy_id = azurerm_mssql_server_security_alert_policy.primary.id
      storage_container_path          = "${azurerm_storage_account.vuln_scan.primary_blob_endpoint}${azurerm_storage_container.vuln_scan.name}/"
      storage_account_access_key      = azurerm_storage_account.vuln_scan.primary_access_key

      recurring_scans {
        enabled                   = true
        interval_trigger_type     = "Weekly"
        email_subscription_admins = true
        emails                    = [var.alert_email_address]
      }
    }

    # Small storage account for vulnerability scan results (not artifact storage).
    resource "azurerm_storage_account" "vuln_scan" {
      name                     = "${replace(var.name_prefix, "-", "")}vulnscan"
      resource_group_name      = var.resource_group_name
      location                 = var.location
      account_tier             = "Standard"
      account_replication_type = "LRS"   # scan results only; no cross-region requirement
    }

    resource "azurerm_storage_container" "vuln_scan" {
      name                  = "vulnerability-assessment"
      storage_account_name  = azurerm_storage_account.vuln_scan.name
      container_access_type = "private"
    }

Part 3 — Add Defender threat detection alerts to the existing Azure Monitor action group.
In the azurerm_monitor_action_group.ops or critical resource, confirm that email_account_admins
in the security_alert_policy above matches alert_email_address. Defender threat alerts route
through the server-level security alert policy independently of Azure Monitor metric alerts,
but the same email address appears in both channels.

Part 4 — Add variables to the SQL infrastructure module:

    variable "sql_audit_retention_days" {
      type        = number
      description = "Days to retain SQL audit logs in the extended auditing policy. Log Analytics workspace retention governs the effective window."
      default     = 90
    }

    variable "enable_sql_defender" {
      type        = bool
      description = "When true, enable Microsoft Defender for SQL (threat detection + vulnerability assessment)."
      default     = false
    }

Constraints:
- Microsoft Defender for SQL is billed per server at ~$15/server/month. For a single-server
  production deployment this is ~$180/year. Justify against the forensic and compliance value
  (SOC 2 Type II auditors typically require it).
- Log Analytics ingestion charges apply for audit logs. At typical ArchLucid query volumes
  (<10k statements/hour), expect <1 GB/day → ~$2.30/day at standard rates. Configure a
  Log Analytics daily cap of 5 GB to guard against runaway ingestion during load tests.
- The vulnerability_assessment resource requires a storage account; use a separate minimal
  LRS account (not the artifact storage account) to avoid mixing compliance scan artifacts
  with production data.
- Do NOT set retention_in_days in the extended_auditing_policy lower than 90 days; SOC 2
  typically requires 12 months of log retention — set the Log Analytics workspace retention
  to 365 days rather than the default 30.
- The vulnerability assessment runs weekly; the first scan may take 20–30 minutes to complete.
  Results appear in Microsoft Defender for Cloud and are emailed to the configured addresses.
- Set a Log Analytics daily ingestion cap to guard against runaway ingestion during load tests.
  Add to the Log Analytics workspace resource (in terraform-container-apps/main.tf where the
  azurerm_log_analytics_workspace is defined, or as a separate resource here):

      resource "azurerm_log_analytics_workspace" "main" {
        # ... existing config ...

        # Cap daily ingestion at 5 GB. At typical ArchLucid query volumes (~2 GB/day with SQL
        # auditing enabled), this prevents a load test from generating an unexpectedly large bill.
        # Azure sends an email alert when the cap is hit; ingestion stops for the remainder of
        # the UTC day. Adjust upward if legitimate operational needs exceed 5 GB/day.
        daily_quota_gb = 5
      }

Acceptance Criteria: terraform plan shows azurerm_mssql_server_extended_auditing_policy,
azurerm_mssql_server_security_alert_policy, and azurerm_mssql_server_vulnerability_assessment;
terraform apply completes; Azure Portal → SQL server → Auditing shows "Log Analytics: On";
Azure Portal → Microsoft Defender for Cloud shows the SQL server in the protected resources
list; a simulated SQL injection probe (e.g. ' OR 1=1 in a connection attempt) generates a
Defender threat alert email.
```

### 48. Enforce Managed Identity Authentication and Block TrustServerCertificate in Production
- **Why it matters:** Two connection string security gaps exist that `SqlConnectionStringSecurity` does not currently close. (1) **`TrustServerCertificate=True` passthrough** — `EnsureSqlClientEncryptMandatory` sets `Encrypt=Mandatory` but explicitly preserves any existing `TrustServerCertificate=True` value in the connection string. A developer who adds `TrustServerCertificate=True` for local dev and accidentally pushes that config to production opens a TLS MITM vulnerability — the client will accept any server certificate including a forged one. In production this must be `False`. The fix is two lines in `SqlConnectionStringSecurity` and one startup validation rule. (2) **No code-level barrier to SQL password credentials in production** — `SqlConnectionFactory` accepts any connection string. The `MANAGED_IDENTITY_SQL_BLOB.md` documents managed identity as the right pattern, but there is no startup validation that rejects `Password=` or `User ID=` in the connection string when the host environment is Production. A misconfigured Key Vault reference or a developer who accidentally leaves a test password in appsettings.Production.json will connect successfully without warning.
- **Expected impact:** Directly improves Reliability (+1 pt) and closes two distinct credential-hygiene gaps. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability, Security.
- **Actionable now:** Yes — changes to `SqlConnectionStringSecurity`, one startup validation rule, unit tests.
```cursor
Part 1 — Block TrustServerCertificate in production environments.

In ArchLucid.Persistence/Data/Infrastructure/SqlConnectionStringSecurity.cs, extend
EnsureSqlClientEncryptMandatory to accept an optional parameter:

    /// <param name="enforceServerCertificateTrust">
    ///     When true, also forces TrustServerCertificate=False.
    ///     Set true in Production; false in Development where self-signed certs are common.
    /// </param>
    public static string EnsureSqlClientEncryptMandatory(
        string connectionString,
        bool enforceServerCertificateTrust = false)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("Connection string is required.", nameof(connectionString));

        SqlConnectionStringBuilder builder = new(connectionString.Trim())
        {
            Encrypt = SqlConnectionEncryptOption.Mandatory
        };

        if (enforceServerCertificateTrust)
        {
            // Force TrustServerCertificate=False regardless of the input string.
            // Prevents MITM attacks where a forged certificate is accepted.
            builder.TrustServerCertificate = false;
        }

        return builder.ConnectionString;
    }

In each connection factory constructor that calls EnsureSqlClientEncryptMandatory, inject
IHostEnvironment (or a bool isProduction) and pass enforceServerCertificateTrust = true when
the environment is Production. Example for SqlConnectionFactory:

    public SqlConnectionFactory(string connectionString, bool enforceServerCertificateTrust = false)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        string secureString = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(
            connectionString, enforceServerCertificateTrust);
        SqlConnectionStringBuilder builder = new(secureString)
        {
            CommandTimeout = 30
        };
        _connectionString = builder.ConnectionString;
    }

Part 2 — Add startup validation: reject SQL password credentials in Production.

In the existing ArchLucidConfigurationRules validation class (where
ApplySessionContext=true is already enforced), add:

    /// <summary>
    /// In Production, the SQL connection string must not contain an explicit username/password.
    /// All SQL authentication must use Managed Identity (Active Directory Default or Managed Identity).
    /// A connection string with Password= in Production indicates a misconfigured secret or a
    /// developer credential that bypassed Key Vault.
    /// </summary>
    private static ValidationResult ValidateSqlConnectionStringIsPasswordFree(
        ArchLucidOptions options,
        IHostEnvironment environment)
    {
        if (!environment.IsProduction())
            return ValidationResult.Success!;

        if (options.StorageProvider != StorageProvider.Sql)
            return ValidationResult.Success!;

        string? cs = options.PrimaryConnectionString;

        if (string.IsNullOrWhiteSpace(cs))
            return ValidationResult.Success!;

        SqlConnectionStringBuilder builder = new(cs);

        if (!string.IsNullOrEmpty(builder.Password))
            return new ValidationResult(
                "ConnectionStrings:ArchLucid contains a Password in Production. " +
                "Use Managed Identity (Authentication=Active Directory Default) instead. " +
                "Remove Password from the connection string and configure Managed Identity per " +
                "docs/security/MANAGED_IDENTITY_SQL_BLOB.md.");

        if (!string.IsNullOrEmpty(builder.UserID) && !cs.Contains("Authentication=", StringComparison.OrdinalIgnoreCase))
            return new ValidationResult(
                "ConnectionStrings:ArchLucid contains a User ID without Authentication= in Production. " +
                "Use Managed Identity (Authentication=Active Directory Default) instead. " +
                "See docs/security/MANAGED_IDENTITY_SQL_BLOB.md.");

        return ValidationResult.Success!;
    }

Part 3 — Update SqlConnectionStringSecurity unit tests.

In the existing SqlConnectionStringSecurityTests (or create them if missing):
- Test: enforceServerCertificateTrust=true + TrustServerCertificate=True input → output has
  TrustServerCertificate=False.
- Test: enforceServerCertificateTrust=false + TrustServerCertificate=True input → output
  preserves TrustServerCertificate=True (dev behaviour unchanged).
- Test: Production startup validator rejects connection string containing Password=.
- Test: Production startup validator rejects connection string with UserID= and no Authentication=.
- Test: Non-production startup validator does not reject SQL auth connection strings.

Constraints:
- The enforceServerCertificateTrust=false default preserves backward compatibility for all
  non-production environments and integration tests that use local SQL Server with self-signed
  certificates. Only pass true in Production.
- The startup validation must be a WARNING log, not a fatal error, in Staging — staging may
  legitimately use SQL auth connection strings during early environment setup. Make it fatal
  only in Production.
- Do not use this validation to enforce the Authentication= keyword value — connection strings
  using Active Directory Default, Active Directory Managed Identity, or (in dev) Integrated
  Security=true are all acceptable. Only block explicit Password= credentials.

Acceptance Criteria: SqlConnectionFactory constructed with TrustServerCertificate=True and
enforceServerCertificateTrust=true produces a connection string with TrustServerCertificate=False;
ArchLucidConfigurationRules throws a validation error at startup in Production when the
connection string contains Password=; all unit tests pass; no change to dev or integration
test behavior.
```

### 49. Add TDE with Customer-Managed Key in Terraform and Fix al_rls_bypass Session Context Read-Only Flag
- **Why it matters:** Two independent hardening items with different risk profiles. (1) **TDE with CMK not in Terraform** — Azure SQL Database ships with service-managed Transparent Data Encryption enabled by default (data at rest is encrypted). However, service-managed TDE means Microsoft holds the encryption key. Enterprise buyers and SOC 2 Type II auditors increasingly require customer-managed keys (CMK) where the tenant controls the Key Vault key and can revoke access. `CMK_ENCRYPTION.md` acknowledges this is a "platform infrastructure" concern but no Terraform resource manages it. For a new product provisioning from scratch (Improvement #38), this is the right time to wire it correctly. (2) **`al_rls_bypass` set with `@read_only = 0`** — In `InternalCrossTenantSqlMetricsQueries.cs`, the cross-tenant analytics bypass is set via `EXEC sys.sp_set_session_context @key = N'al_rls_bypass', @value = @Bypass, @read_only = 0;`. The `@read_only = 0` flag means the bypass value can be changed again later in the same connection session. If a bug, query concatenation error, or future code change accidentally sets `al_rls_bypass = 1` on a regular tenant connection, all RLS predicates bypass until the connection closes. Setting `@read_only = 1` makes the bypass immutable for the session lifetime — it cannot be escalated by later code. This is a one-line SQL fix.
- **Expected impact:** Directly improves Reliability (+1 pt). CMK-backed TDE closes the enterprise compliance gap; the `al_rls_bypass` fix closes a subtle session escalation path. Weighted readiness impact: +0.01%.
- **Affected qualities:** Reliability, Security.
- **Actionable now:** Yes.
```cursor
Part 1 — TDE with Customer-Managed Key in Terraform.

Add to the SQL infrastructure module (alongside azurerm_mssql_server.primary from Improvement #38):

    # Key Vault key for TDE (must exist before database provisioning).
    # Reference an existing Key Vault managed by terraform-keyvault.
    data "azurerm_key_vault" "sql_tde" {
      count               = var.enable_sql_tde_cmk ? 1 : 0
      name                = var.key_vault_name
      resource_group_name = var.key_vault_resource_group_name
    }

    resource "azurerm_key_vault_key" "sql_tde" {
      count        = var.enable_sql_tde_cmk ? 1 : 0
      name         = "sql-tde-key"
      key_vault_id = data.azurerm_key_vault.sql_tde[0].id
      key_type     = "RSA"
      key_size     = 2048
      key_opts     = ["decrypt", "encrypt", "sign", "unwrapKey", "verify", "wrapKey"]
    }

    # Grant the SQL server managed identity access to the TDE key.
    resource "azurerm_key_vault_access_policy" "sql_tde" {
      count        = var.enable_sql_tde_cmk ? 1 : 0
      key_vault_id = data.azurerm_key_vault.sql_tde[0].id
      tenant_id    = data.azurerm_client_config.current.tenant_id
      object_id    = azurerm_mssql_server.primary.identity[0].principal_id

      key_permissions = ["Get", "WrapKey", "UnwrapKey"]
    }

    # Wire the CMK to the SQL server (server-level TDE protector).
    resource "azurerm_mssql_server_transparent_data_encryption" "primary" {
      count           = var.enable_sql_tde_cmk ? 1 : 0
      server_id       = azurerm_mssql_server.primary.id
      key_vault_key_id = azurerm_key_vault_key.sql_tde[0].id
    }

Add variables:

    variable "enable_sql_tde_cmk" {
      type        = bool
      description = "When true, configure TDE with a customer-managed key from Key Vault. When false, Azure uses service-managed TDE (default, still encrypted)."
      default     = false
    }

    variable "key_vault_name" {
      type        = string
      description = "Name of the existing Key Vault used for the TDE key (from terraform-keyvault output)."
      default     = ""
    }

    variable "key_vault_resource_group_name" {
      type        = string
      description = "Resource group containing the Key Vault."
      default     = ""
    }

The SQL server resource must have a system-assigned identity for Key Vault access:
    resource "azurerm_mssql_server" "primary" {
      # ... existing config ...
      identity {
        type = "SystemAssigned"
      }
    }

Part 2 — Fix al_rls_bypass to use @read_only = 1.

In ArchLucid.Persistence/Analytics/InternalCrossTenantSqlMetricsQueries.cs, find the line:
    EXEC sys.sp_set_session_context @key = N'al_rls_bypass', @value = @Bypass, @read_only = 0;

Change to:
    -- @read_only = 1 makes the bypass value immutable for the session lifetime.
    -- This prevents a bug or late-session code from re-escalating a regular tenant connection
    -- to bypass RLS. The connection must be discarded to clear the flag.
    EXEC sys.sp_set_session_context @key = N'al_rls_bypass', @value = @Bypass, @read_only = 1;

Verify there are no other code paths that attempt to change al_rls_bypass after this call
on the same connection. Search for al_rls_bypass in the codebase and confirm this is the
only write site. If any test reuses a connection and later tries to reset the bypass,
it must open a new connection instead.

Part 3 — Add unit tests.

For the @read_only = 1 change:
- Add a test that verifies a second attempt to set al_rls_bypass on the same connection
  raises an error (SQL error 15665: "Cannot set read-only session context key").
  This confirms the immutability guarantee is enforced at the SQL layer.

For the CMK Terraform change:
- Add a terraform validate check in CI.
- Add a post-apply check (terraform output or az CLI) verifying the server's TDE protector
  is "CustomerManaged", not "ServiceManaged".

Constraints:
- CMK-backed TDE introduces a Key Vault dependency on every database startup. If the Key Vault
  is unreachable (VNet misconfiguration, Key Vault throttling), the database becomes inaccessible.
  Test Key Vault connectivity as part of the pre-provision checklist and monitor Key Vault
  availability alongside SQL health checks.
- Key rotation: create a new key version in Key Vault, update key_vault_key_id in Terraform.
  Azure automatically re-encrypts the TDE protector on the next connection. Add key rotation
  to the SECRET_AND_CERT_ROTATION.md runbook.
- Do not enable enable_sql_tde_cmk until the SQL server has a SystemAssigned identity.
  The Terraform plan will error if the identity block is absent.
- The @read_only = 1 change is only safe if cross-tenant analytics always opens a fresh
  connection for bypass mode. Confirm that SqlInternalCrossTenantAnalyticsService does not
  reuse connections across bypass/non-bypass calls on the same connection object.

Acceptance Criteria: terraform plan with enable_sql_tde_cmk = true shows
azurerm_mssql_server_transparent_data_encryption and azurerm_key_vault_key; Azure Portal
shows TDE protector as "Customer Managed Key" after apply; changing al_rls_bypass to
@read_only = 1 produces no change in existing analytics queries; a unit test verifying
that a second sp_set_session_context on the same connection for al_rls_bypass raises error
15665 is green.
```

---

---

## Improvement #50 — Clarify SQL-as-Queue vs. Service Bus Boundaries; Add RetrievalIndexingOutbox Dead-Letter and Scale Guard

**Assessment date:** 2026-05-24
**Status:** Partially correct; one low-risk gap to close at scale

### Finding

Three SQL-backed outboxes exist. Only one of them routes through Azure Service Bus; the other two use SQL Server as the work queue itself.

| Table | Role | Service Bus involved? | Verdict |
|---|---|---|---|
| `IntegrationEventOutbox` | Transactional Outbox → drains to ASB | Yes — ASB is the final broker | Correct (Transactional Outbox Pattern) |
| `AuthorityPipelineWorkOutbox` | Work queue for agent pipeline execution | No — SQL is both store and broker | Intentional; tenant-fair dequeue justifies SQL |
| `RetrievalIndexingOutbox` | Work queue for retrieval indexing jobs | No — SQL is both store and broker | Defensible V1 but missing dead-letter and lease |

**`IntegrationEventOutbox` is architecturally correct.** It writes events atomically with business data inside the same SQL transaction, then `IntegrationEventOutboxProcessor` drains to Azure Service Bus in a background loop. SQL is only the durability staging buffer; ASB is the broker. This prevents dual-write inconsistency and is the standard Transactional Outbox Pattern.

**`AuthorityPipelineWorkOutbox` using SQL is justified** because:
1. Work must be enqueued atomically with the run record (same DB transaction).
2. The tenant-fair dequeue (`ROW_NUMBER() OVER (PARTITION BY TenantId)`) with global round-robin ordering cannot be replicated natively on Service Bus. ASB Sessions partition per-session but do not guarantee cross-session fairness; a custom fair-round-robin would require application-side session cycling, losing simplicity.
3. The `READPAST, UPDLOCK, ROWLOCK` pattern is battle-tested for SQL-based queues and avoids message duplication.

**The risk is polling pressure at scale.** Every agent runner pod polls `AuthorityPipelineWorkOutbox` on a timer. At 3 pods × 5-second poll = 36 queries/minute on the primary SQL database. At 20 pods that is 240 queries/minute, all requiring write locks. This is the primary scale-out constraint.

**`RetrievalIndexingOutbox` has two gaps relative to `AuthorityPipelineWorkOutbox`:**
1. No lease (`LockedUntilUtc`) — two concurrent processors can dequeue the same row and index the same run twice.
2. No dead-letter column — a permanently failing run is retried forever with no visibility.

### Recommended Actions

**V1 — Low risk, add now:**

**Part 1 — Add `LockedUntilUtc` and `DeadLetteredUtc` to `RetrievalIndexingOutbox`.**

The table lacks the `READPAST, UPDLOCK, ROWLOCK` dequeue pattern that `AuthorityPipelineWorkOutbox` uses. Add a new migration:

```sql
-- Migration NNN_RetrievalIndexingOutbox_LeasingAndDeadLetter.sql
ALTER TABLE dbo.RetrievalIndexingOutbox
    ADD LockedUntilUtc  DATETIME2(7) NULL,
        AttemptCount    INT          NOT NULL CONSTRAINT DF_RetrievalIndexingOutbox_AttemptCount DEFAULT 0,
        DeadLetteredUtc DATETIME2(7) NULL;
GO

-- Replace the simple SELECT TOP with a leased dequeue identical to AuthorityPipelineWorkOutbox.
-- See DapperRetrievalIndexingOutboxRepository.DequeuePendingAsync for the target shape.
```

Update `DapperRetrievalIndexingOutboxRepository.DequeuePendingAsync` to use the same `READPAST, UPDLOCK, ROWLOCK` + `UPDATE ... OUTPUT` pattern as `DapperAuthorityPipelineWorkRepository.DequeuePendingAsync`. The processor must call `MarkProcessedAsync` on success and a new `RecordDeadLetterAsync` after N failures. Expose `CountDeadLetteredAsync` and wire it to a Prometheus gauge so dead-lettered retrieval jobs page.

**Part 2 — Add a KEDA SQL scaler for `AuthorityPipelineWorkOutbox` so Container Apps scales on queue depth, not a fixed replica count.**

```yaml
# In the Container Apps Job manifest for the agent runner:
triggers:
  - type: mssql
    metadata:
      connectionStringFromEnv: SQL_CONNECTION_STRING
      query: >
        SELECT COUNT_BIG(1)
        FROM dbo.AuthorityPipelineWorkOutbox
        WHERE ProcessedUtc IS NULL
          AND DeadLetteredUtc IS NULL
          AND (NextAttemptUtc IS NULL OR NextAttemptUtc <= SYSUTCDATETIME())
          AND (LockedUntilUtc IS NULL OR LockedUntilUtc <= SYSUTCDATETIME())
      targetValue: "5"   # scale one replica per 5 pending items
      activationQueryValue: "1"
```

This replaces fixed-timer polling with event-driven scaling. The queue-depth query itself runs against the read replica (route via `ReadReplicaConnectionString` if KEDA supports it, or keep on primary given the lightweight nature of a COUNT query).

**V1.1 / Scale Gate — Evaluate when agent runner pod count exceeds 10:**

If the number of concurrent agent runner replicas exceeds 10 and `AuthorityPipelineWorkOutbox` polling latency exceeds 3 seconds at P99, evaluate migrating to Service Bus Premium with Sessions (sessionId = TenantId). The tenant-fair guarantee weakens to per-tenant FIFO (not cross-tenant fairness), which is acceptable at scale because large tenants naturally consume more capacity. At that point, keep `AuthorityPipelineWorkOutbox` as a transactional staging buffer and drain it into ASB sessions using the same Transactional Outbox processor pattern already used by `IntegrationEventOutbox`. This keeps the transactional write guarantee without SQL-as-broker at steady state.

```
Cursor prompt:
Add LockedUntilUtc, AttemptCount, and DeadLetteredUtc columns to
dbo.RetrievalIndexingOutbox via a new DbUp migration. Update
DapperRetrievalIndexingOutboxRepository to use the READPAST/UPDLOCK/ROWLOCK
leased dequeue pattern matching DapperAuthorityPipelineWorkRepository.
Add RecordDeadLetterAsync and CountDeadLetteredAsync methods.
Update IRetrievalIndexingOutboxRepository with the new signatures.
Update InMemoryRetrievalIndexingOutboxRepository to match.
Add a unit test verifying that concurrent dequeue calls for the same row
do not both return the entry (the second must see empty or a different row).
Wire CountDeadLetteredAsync to a Prometheus gauge named
archlucid_retrieval_indexing_outbox_dead_lettered_total.
```

Constraints:
- The lease duration for retrieval indexing should be generous (at least 300 seconds) because indexing a run can be slow if the artifact blob is large.
- Do not add the KEDA SQL scaler in the same PR as the schema migration; let the schema migration deploy and stabilise first.
- The `IntegrationEventOutbox`, `AuthorityPipelineWorkOutbox`, and `RetrievalIndexingOutbox` tables must never be read with `WITH (NOLOCK)` — they are write-ahead transactional queues and NOLOCK would surface uncommitted rows, duplicating work.

Acceptance Criteria: `DequeuePendingAsync` on `RetrievalIndexingOutbox` uses `READPAST, UPDLOCK, ROWLOCK`; two concurrent calls for a batch of 1 return disjoint result sets; `CountDeadLetteredAsync` returns a non-zero value after `RecordDeadLetterAsync` is called; the Prometheus gauge is visible in a local Prometheus scrape.

---

## Improvement #51 — Terraform Advisory C# Inline Documentation

**Assessment date:** 2026-05-24
**Status:** Gap identified; no blocking risk but hurts maintainability for non-Terraform contributors

### Finding

The Terraform advisory emit system spans 12 C# files across three projects (`ArchLucid.Application`, `ArchLucid.ArtifactSynthesis`, `ArchLucid.Cli`). Class-level XML doc comments exist on most files, but method-level documentation is thin or absent on the logic that most needs it. A contributor without Terraform experience cannot answer basic questions from the code alone:

| File | Gap |
|------|-----|
| `RegexTerraformValidator.cs` | Four private validation methods have no doc comments explaining *why* each check matters or what Terraform syntax rule it guards against. |
| `CliTerraformValidator.cs` | The temp-directory write-validate-delete pattern is not explained; the reason `init -backend=false` is needed before `validate` is not documented. |
| `CompositeTerraformValidator.cs` | No explanation of *why* the regex validator runs first or what happens when the CLI is absent. |
| `TerraformAdvisoryHclSanitizer.cs` | `BuildValidationWarningStub` has no doc comment explaining that the returned string is itself valid advisory HCL (a comment block) not an error throw. |
| `TerraformAdvisoryDecommissionSnippetBuilder.cs` | `TryResolveResourceAddressHint` has no doc comment; the dot-containing `SelectedOption` heuristic is opaque without explanation. |
| `TerraformAdvisoryDecommissionIntentDetector.cs` | The 7-keyword `Markers` array has no comment explaining why these exact words trigger comment-only advisory mode. |
| `TerraformHclFormatHelper.cs` | The stub-file-write-then-read-back pattern (write `stub.tf`, run `terraform fmt stub.tf`, re-read) is not explained; timeout choice is undocumented. |
| `AzureTerraformExportCommand.cs` | `aztfexport` is invoked with `--non-interactive` but callers will not know why, or what `-o` and `--overwrite` mean; argument parser logic has no doc. |
| `TerraformGitHubPrService.cs` | `GetBaseShaAsync`, `CreateBranchAsync`, `CommitFileAsync`, and `ExtractFilesFromZip` have no method-level doc. The Base64 encoding of file content for the GitHub Contents API is unexplained. |
| `TerraformGitHubPrOptions.cs` | The `PersonalAccessToken` property has a malformed XML doc comment (the `<summary>` open tag appears *after* a dangling `</summary>` closing tag — an authoring error that will produce a compiler warning when XML doc is enabled). |

**No security or correctness bugs are introduced by the missing documentation**, but the `TerraformGitHubPrOptions.cs` malformed XML is a latent warning and should be fixed.

### Recommended Actions

Add method-level XML doc comments to each of the 12 files listed above. Documentation should:
- Explain Terraform vocabulary inline (HCL, `terraform validate`, `terraform fmt`, `aztfexport`, advisory-only constraint) so a reader can understand without switching context.
- Explain the *why* behind each design decision (e.g., why regex runs before CLI; why braces are balanced globally but quotes are checked per-line; why the temp directory is used for `terraform fmt`).
- Fix the malformed XML doc in `TerraformGitHubPrOptions.cs`.
- Do **not** add narration comments ("// increment counter"); only explain non-obvious intent.

```
Cursor prompt:
Add truly excellent inline documentation to the 12 Terraform advisory C# files.
Target audience: a developer with 2 years of C# experience who has never used Terraform.

Files to document:
  ArchLucid.Application/TerraformAdvisory/TerraformAdvisorySnippetTemplates.cs
  ArchLucid.ArtifactSynthesis/Generators/TerraformAdvisoryArtifactGenerator.cs
  ArchLucid.ArtifactSynthesis/Validation/TerraformAdvisoryHclSanitizer.cs
  ArchLucid.ArtifactSynthesis/Validation/RegexTerraformValidator.cs
  ArchLucid.ArtifactSynthesis/Validation/CliTerraformValidator.cs
  ArchLucid.ArtifactSynthesis/Validation/CompositeTerraformValidator.cs
  ArchLucid.ArtifactSynthesis/Services/TerraformAdvisoryDecommissionSnippetBuilder.cs
  ArchLucid.ArtifactSynthesis/Services/TerraformAdvisoryDecommissionIntentDetector.cs
  ArchLucid.ArtifactSynthesis/Packaging/TerraformHclFormatHelper.cs
  ArchLucid.ArtifactSynthesis/Packaging/TerraformAdvisoryExportCopy.cs
  ArchLucid.Cli/Commands/AzureTerraformExportCommand.cs
  ArchLucid.Application/Analysis/TerraformGitHubPrService.cs
  ArchLucid.Application/Analysis/TerraformGitHubPrOptions.cs

For each method and non-trivial private field, add an XML doc comment or inline comment
that explains:
  - What Terraform concept or constraint the code implements (define HCL, advisory-only,
    terraform validate, terraform fmt, aztfexport, the advisory-never-apply rule).
  - Why the implementation is shaped the way it is (e.g., why regex runs before CLI,
    why quotes are checked per-line not globally, why a temp directory is created for
    fmt/validate, why init -backend=false is required before validate, why the GitHub
    Contents API requires Base64-encoded content).
  - Any non-obvious constraint or side-effect.

Also fix the malformed XML doc on TerraformGitHubPrOptions.PersonalAccessToken
(summary open tag appears after the closing tag — swap the order).

Do not add narration comments. Do not change any logic.
```

Acceptance Criteria: Every non-trivial private method and public member in the 12 files has a doc comment; the malformed XML doc in `TerraformGitHubPrOptions.cs` is fixed; `dotnet build` produces zero XML doc warnings; no logic is changed; existing tests remain green.

---

## Improvement #52 — Inline Documentation Pass on Existing `infra/` Terraform Roots

**Assessment date:** 2026-05-24
**Status:** Gap — files exist and are syntactically correct; inline explanation for a non-Terraform-expert is thin

### Finding

The `infra/` directory contains a full multi-root IaC setup (10+ Terraform modules: `terraform-entra`, `terraform-container-apps`, `terraform-edge`, `terraform-sql-failover`, `terraform-monitoring`, `terraform-private`, `terraform-storage`, `terraform-openai`, `terraform-logicapps`, `modules/alerts`, `modules/azure-sql-tenant-pool`, `modules/first-tenant-funnel-dashboard`, `modules/golden-cohort-cost-dashboard`, plus Grafana/Prometheus config). The files are syntactically correct and CI-validated.

The documentation gap is at the **inline explanation level**. A developer with no Terraform experience cannot answer basic questions from the files alone:

| Pattern | Where it appears | Gap |
|---------|-----------------|-----|
| `count = local.enabled ? 1 : 0` | Every root's main.tf | No comment explaining this is Terraform's conditional resource creation idiom — 0 means "don't create"; 1 means "create one". |
| `dynamic` blocks | `terraform-entra/main.tf` (optional_claims) | No comment explaining that `dynamic` emits a nested block only when the `for_each` collection is non-empty. |
| `locals { }` | Every root | Complex expressions (ACR resource ID regex parse, KEDA scale flag composition) have no plain-English explanation. |
| KEDA scaler variables | `terraform-container-apps/variables.tf` | `worker_enable_authority_outbox_prom_scale`, `worker_authority_outbox_prom_server_address` have descriptions but no comment connecting them to the KEDA Prometheus scaler concept or to `archlucid_authority_pipeline_work_pending`. |
| `validation { }` blocks | `terraform-entra/variables.tf` (sign_in_audience) | No comment explaining that this runs at `terraform plan` time to catch bad input before any Azure API call. |
| `data` sources vs `resource` blocks | All roots | No comment explaining the difference: `data` reads existing infrastructure; `resource` declares infrastructure Terraform owns. |
| `terraform.tfvars.example` files | Most roots | No header comment guiding an operator through which values are mandatory vs optional for a first local `plan`. |

The per-variable `description` fields are present and helpful, but description fields are not visible during code review of `.tf` files — only surfaced by `terraform console` or the registry. Inline `#` comments are what a reader sees when reviewing a file.

### Recommended Actions

Add inline `#` comments to the most-read files in each root. Priority order:

1. `infra/terraform-entra/main.tf` — explain every resource block, the `count` idiom, `random_uuid` purpose, `dynamic` block, and the app-role model.
2. `infra/terraform-container-apps/main.tf` — explain `locals` composition, `count`, KEDA scale rules, and the ACR pull identity pattern.
3. `infra/terraform-container-apps/variables.tf` — annotate the KEDA, FinOps, and subnet variables with one-line plain-English comments above each `variable` block.
4. `infra/terraform-edge/main.tf` — explain Front Door profile vs endpoint vs route split.
5. `infra/modules/alerts/checks.tf` and `startup_config_warnings.tf` — explain `check` blocks (introduced in Terraform 1.5 as non-fatal assertions that don't block apply).
6. All `versions.tf` files — add a comment explaining `required_providers`, `source`, and `version` constraints.
7. All `terraform.tfvars.example` files — add a header comment listing which variables are mandatory for a minimal `terraform plan` against a real subscription.

Do **not** add narration comments. Only explain non-obvious Terraform idioms and design decisions.

```
Cursor prompt:
Add truly excellent inline documentation to the existing infra/ Terraform roots.
Target audience: a developer with 2 years of C# experience who has never used Terraform.

Read docs/assessments/LATEST.md Improvement #52 for the full gap list and priority order.

For each file in the priority list, add inline # comments that explain:
  - Terraform idioms: count = 0/1 for conditional creation, dynamic blocks, data vs resource,
    locals composition, for_each, validation blocks, required_providers source/version constraints.
  - Design intent: why each resource exists, what Azure object it creates, what the caller
    must configure before running terraform plan.
  - KEDA scaler wiring: how worker_enable_authority_outbox_prom_scale connects to the
    archlucid_authority_pipeline_work_pending Prometheus metric and what Container Apps
    does with the scale rule.
  - Security defaults: why public_network_access_enabled = false, minimum_tls_version = "1.2",
    managed identity over connection strings.
  - Mark any value that must come from Key Vault or a pipeline secret with:
    # MUST be supplied from Key Vault or pipeline secret — never hardcode in tfvars.

Do not change any HCL logic. Do not add narration comments.
`terraform fmt -check` must still pass after your edits.
```

Acceptance Criteria: Every non-obvious Terraform idiom in the priority-list files has an inline `#` comment; `terraform fmt -check` exits 0 on all modified files; no HCL logic is changed; existing CI validation (`scripts/ci/assert_terraform_roots_valid.py`) remains green.

---

## Improvement #53 — Close 13 Missing Assertions in `ArchLucid.Architecture.Tests.DependencyConstraintTests`

**Assessment date:** 2026-05-24
**Status:** Gap — 13 boundary rules exist in the intended layer model but are not asserted in CI

### Finding

A full walk of the 56-project `ProjectReference` graph against the documented `Contracts → Core → Domain → Application → Host/Adapters` layering identified 13 assertions that `DependencyConstraintTests.cs` does not currently make. The existing test suite is comprehensive in many areas, but these specific gaps allow violations to be introduced silently.

| ID | Missing assertion | Category |
|----|-------------------|----------|
| M1 | `Provenance_must_not_depend_on_Persistence` | Hexagonal guard — matches the pattern already applied to Decisioning, Notifications, KnowledgeGraph, ContextIngestion, ArtifactSynthesis, Cli, Retrieval |
| M2 | `Api_must_not_reference_Decisioning_assembly` (assembly metadata) | Promote from NetArchTest type-level to `GetReferencedAssemblies()` — same upgrade already applied to Retrieval |
| M3 | `Api_must_not_reference_KnowledgeGraph_assembly` (assembly metadata) | Same promotion as M2 |
| M4 | `Application_must_not_reference_SqlClient_or_Dapper` | `Application.csproj` declares `Dapper` and `Microsoft.Data.SqlClient` as direct `PackageReference` entries; check `application.GetReferencedAssemblies()` |
| M5 | `Application_must_not_reference_Notifications_assembly` | Preventive guard — Application does not currently reference Notifications but the edge is unguarded |
| M6 | `AgentRuntime_must_not_depend_on_Decisioning` | Adapter boundary — parallel to the existing `AgentRuntime_must_not_reference_Persistence_assembly` |
| M7 | `AgentRuntime_must_not_depend_on_Provenance` | Adapter boundary — same reasoning as M6 |
| M8 | `Decisioning_must_not_depend_on_Notifications` | Lateral domain coupling — or document as intentional with a pinning test and rationale |
| M9 | `Provenance_must_not_depend_on_ArtifactSynthesis` | Lateral domain coupling |
| M10 | `Provenance_must_not_depend_on_Decisioning` | Lateral domain coupling |
| M11 | `Provenance_must_not_depend_on_KnowledgeGraph` | Lateral domain coupling |
| M12 | `Capabilities_Cost_must_not_depend_on_Persistence` | Hexagonal guard — `Capabilities.Cost` is in the domain tier but absent from the Tier 3 guard list |
| M13 | `Backfill_Cli_must_not_reference_Persistence_assembly` | Either prohibit or document as intentional migration-tool exception with a pinning test |

M8–M11 and M13 require a team decision before the prohibiting test can be written. If the coupling is intentional, add a pinning test with a rationale comment modelled on the existing `AgentRuntime_references_AgentSimulator_by_design` fact.

### Recommended Actions

1. Add M1, M2, M3, M4, M5, M6, M7, M12 to `DependencyConstraintTests.cs` as new `[Fact]` methods — each is a straightforward `GetReferencedAssemblies()` or `HaveDependencyOn` call with a clear `because:` explanation.
2. For M8 (`Decisioning→Notifications`): decide whether alerts should be dispatched through an Application mediator. If yes, add a prohibiting fact and move the dependency inversion to Improvement #55. If no, add a pinning fact.
3. For M9–M11 (`Provenance→{ArtifactSynthesis,Decisioning,KnowledgeGraph}`): decide whether Provenance should receive projections via ports. If yes, add prohibiting facts and move the refactoring to Improvement #55. If no, add pinning facts.
4. For M13 (`Backfill.Cli→Persistence`): if this is a deliberate migration tool, add a pinning fact; if not, add a prohibiting fact (enforcement will follow in Improvement #54).

```
Cursor prompt:
Add 13 missing assertions to ArchLucid.Architecture.Tests/DependencyConstraintTests.cs.

Read docs/assessments/LATEST.md Improvement #53 for the full list (M1–M13) and the
rationale for each. Follow the exact style of the existing facts in that file:
  - [Fact] [Trait("Suite","Core")] [Trait("Category","Unit")]
  - Assembly-metadata checks (GetReferencedAssemblies) for M2, M3, M4, M5, M6, M7, M12, M13
  - NetArchTest HaveDependencyOn for M1, M8, M9, M10, M11
  - Every because: string must name the INV or boundary rule it enforces

For M8 (Decisioning→Notifications), M9–M11 (Provenance laterals), and M13 (Backfill.Cli→Persistence):
add a pinning test with a rationale comment if the coupling is confirmed intentional,
or a prohibiting test if it is not.

Do not change any production code. Do not change any csproj files.
All existing tests must remain green.
```

Acceptance Criteria: All 13 new facts exist in `DependencyConstraintTests.cs`; `dotnet test ArchLucid.Architecture.Tests` exits 0; no existing test is renamed, removed, or weakened.

---

## Improvement #54 — Prune Dead `ProjectReference` Entries from `Api.csproj`

**Assessment date:** 2026-05-24
**Status:** Gap — two assembly references in `Api.csproj` have no type-level consumers and undermine existing boundary tests

### Finding

`ArchLucid.Api/ArchLucid.Api.csproj` declares `ProjectReference` entries for both `ArchLucid.Decisioning` and `ArchLucid.KnowledgeGraph`. The existing `Api_must_not_depend_on_Decisioning` and `Api_must_not_depend_on_KnowledgeGraph` facts in `DependencyConstraintTests.cs` pass at the NetArchTest type-level (no IL reference exists), but the `ProjectReference` entries remain and:

- copy both assemblies into the Api output directory on every build
- include both assemblies in the `ArchLucid.Api` compilation closure, meaning any developer can add a `using ArchLucid.Decisioning;` statement without a compile error
- are not caught by the assembly-metadata-level check that already exists for `ArchLucid.Retrieval` (which uses `GetReferencedAssemblies()` instead of `HaveDependencyOn`)

If Improvement #53 lands first and M2/M3 are added as `GetReferencedAssemblies()` checks, those new facts will fail immediately — this improvement unblocks them.

### Recommended Actions

1. Remove the `<ProjectReference Include="..\ArchLucid.Decisioning\ArchLucid.Decisioning.csproj" />` line from `Api.csproj`.
2. Remove the `<ProjectReference Include="..\ArchLucid.KnowledgeGraph\ArchLucid.KnowledgeGraph.csproj" />` line from `Api.csproj`.
3. Run `dotnet build ArchLucid.Api` and `dotnet test ArchLucid.Api.Tests` to confirm nothing broke.
4. Confirm `ArchLucid.Architecture.Tests` still passes (the existing type-level tests should continue to pass; the new M2/M3 assembly-metadata tests from Improvement #53 will now also pass).

```
Cursor prompt:
Remove two dead ProjectReference entries from ArchLucid.Api/ArchLucid.Api.csproj.

1. Delete the line:
   <ProjectReference Include="..\ArchLucid.Decisioning\ArchLucid.Decisioning.csproj" />

2. Delete the line:
   <ProjectReference Include="..\ArchLucid.KnowledgeGraph\ArchLucid.KnowledgeGraph.csproj" />

3. Run dotnet build on ArchLucid.Api and confirm zero errors.
4. Run dotnet test on ArchLucid.Api.Tests and ArchLucid.Architecture.Tests and confirm
   all tests remain green.

Do not change any C# source files. Do not add any new ProjectReference entries.
```

Acceptance Criteria: `Api.csproj` no longer references `Decisioning` or `KnowledgeGraph`; `dotnet build ArchLucid.Api` exits 0; `dotnet test ArchLucid.Api.Tests` exits 0; `dotnet test ArchLucid.Architecture.Tests` exits 0.

---

## Improvement #55 — Resolve Lateral Domain Coupling Policy across Provenance, Retrieval, AgentRuntime, and Decisioning

**Assessment date:** 2026-05-24
**Status:** Decision required — six live `ProjectReference` edges cross domain-module boundaries without a recorded architectural intent

### Finding

The following `ProjectReference` edges exist in the production graph and create lateral coupling between domain-tier modules. None is prohibited by the current architecture tests; none is documented with a rationale comment comparable to `AgentRuntime_references_AgentSimulator_by_design`.

| Source | → Target | Concern |
|--------|-----------|---------|
| `Decisioning` | `Notifications` | Decisioning should produce decisions/alerts; Application or a mediator should dispatch to Notifications. Direct reference tight-couples alert evaluation to webhook delivery. |
| `Provenance` | `ArtifactSynthesis` | Provenance records system output; it should receive projections pushed via Contracts ports, not pull from the artifact generation assembly. |
| `Provenance` | `Decisioning` | Same: Provenance should be driven by events, not by direct reference to the decisioning engine. |
| `Provenance` | `KnowledgeGraph` | Same: graph data should be projected to Provenance via domain events, not via a direct assembly dependency. |
| `Retrieval` | `Decisioning` | Retrieval is an adapter; intelligence logic should be consumed through Application ports. |
| `Retrieval` | `ArtifactSynthesis` | Same: artifact types needed by retrieval should be modelled in Contracts, not referenced from the synthesis assembly. |
| `AgentRuntime` | `Decisioning` | AgentRuntime already has a carefully guarded boundary with Application (only `AgentRuntime.Explanation` may touch Application). The same care should apply to Decisioning — the runtime should consume decisioning results through orchestration ports, not by directly referencing the Decisioning assembly. |
| `AgentRuntime` | `Provenance` | Same boundary concern. Provenance writes should flow through Application ports. |

Each coupling also pulls its transitive closure: `Provenance→Decisioning` means any Provenance consumer transitively depends on KnowledgeGraph and Notifications. `Retrieval→Provenance` transitively pulls in ArtifactSynthesis, Decisioning, KnowledgeGraph, and Notifications.

### Decision Required

For each edge above, the team must choose one of:

**Option A — Prohibit:** Invert the dependency to a port interface in `ArchLucid.Contracts`. Add the prohibiting test from Improvement #53. Schedule the refactoring.

**Option B — Pin as intentional:** Add a `*_by_design` fact in `DependencyConstraintTests.cs` with a rationale comment, acknowledging the coupling as a deliberate trade-off. No refactoring required.

### Recommended Actions (if Option A is chosen for any edge)

1. **`Decisioning→Notifications`:** Define an `IAlertNotificationDispatcher` port in `Contracts`. Implement it in `Notifications`. Register in `Host.Composition`. Remove the `Notifications` `ProjectReference` from `Decisioning.csproj`. Wire through `Application` if the dispatch is orchestrated, or inject directly into `Decisioning` via the port interface.
2. **`Provenance` laterals (ArtifactSynthesis, Decisioning, KnowledgeGraph):** Define `IProvenanceProjection` port types in `Contracts`. Each domain module pushes projections. Remove three `ProjectReference` entries from `Provenance.csproj`.
3. **`Retrieval` laterals (Decisioning, ArtifactSynthesis):** Move shared types to `Contracts`. Remove two `ProjectReference` entries from `Retrieval.csproj`. The `Provenance` reference in `Retrieval.csproj` becomes removable once `Provenance` itself is decoupled.
4. **`AgentRuntime` laterals (Decisioning, Provenance):** Ensure AgentRuntime consumes both through `Application` orchestration ports. The `Decisioning` reference may be absorbed into the existing `AgentRuntime.Explanation` port boundary if applicable; otherwise define a new port.

```
Cursor prompt:
Resolve the lateral domain coupling policy for the six ProjectReference edges documented
in docs/assessments/LATEST.md Improvement #55.

For each edge:
1. Read the current source and target assemblies to understand what types are actually
   consumed across the boundary.
2. Propose either Option A (invert to port) or Option B (pin as intentional) for each,
   with a one-sentence rationale.
3. If Option A: sketch the port interface name, which Contracts namespace it belongs in,
   and which csproj changes are required.
4. If Option B: write the pinning [Fact] for DependencyConstraintTests.cs.

Do not make any code changes yet — output the decision table and draft tests/port sketches
for team review first.
```

Acceptance Criteria: Each of the six edges has a recorded decision (Option A or B). All Option-B edges have a pinning `[Fact]` in `DependencyConstraintTests.cs`. All Option-A edges have a tracked backlog item with the port interface name, target namespace, and csproj delta.

---

## Improvement #56 — Fix DI Lifetime Mismatches in `ArchLucid.Host.Composition` (audit 2026-05-24)

**Quality dimension:** Maintainability / Reliability
**Source:** Engineering audit — composition root DI lifetime review, 2026-05-24.

### Findings

Three issues were identified. Two require code changes; one is a design-level constraint.

**Finding 1 (High) — Singleton capturing Transient typed HttpClient**

`AuthorityRunCompletedAzureDevOpsIntegrationEventHandler` is registered as `AddSingleton<IIntegrationEventHandler, ...>()` but its constructor takes `IAzureDevOpsPullRequestDecorator`, which is registered as Transient by `AddHttpClient<IAzureDevOpsPullRequestDecorator, AzureDevOpsPullRequestDecorator>()`. The Transient typed-client instance is captured at construction time and lives for the process lifetime, bypassing `IHttpClientFactory`'s handler-rotation policy (DNS refresh, socket reuse). ASP.NET Core's `ValidateScopes` does not flag Singleton→Transient, so this silently passes the scope check. Location: `ServiceCollectionExtensions.SchedulingAndAlerts.cs`, `RegisterIntegrationEventConsumer`, Worker role only.

*Fix:* inject `IHttpClientFactory` into the handler and call `CreateClient(nameof(AzureDevOpsPullRequestDecorator))` per `HandleAsync` invocation, or register the handler as Transient/Scoped and resolve it from a scope per consumed message.

**Finding 2 (Medium) — `SqlScopedResolutionDbConnectionFactory`: `SqlConnection` outlives its `AsyncServiceScope`**

`IDbConnectionFactory` is `SqlScopedResolutionDbConnectionFactory` (Singleton). Its `CreateOpenConnectionAsync` method creates an `AsyncServiceScope`, resolves `ISqlConnectionFactory` (→ `ResilientSqlConnectionFactory` → `ScopedRoutingSqlConnectionFactory`), opens a `SqlConnection`, disposes the scope via `await using`, and returns the live connection. The connection is detached from any DI-managed unit-of-work before the caller has run a single query. The class XML doc acknowledges this explicitly.

Consequences: no ambient transaction guaranteed, no scope-level rollback, no connection-string re-routing possible mid-connection, and connection leak risk if a future caller omits `using`. Current callers (`SqlPromptVariantRegistry`, health checks) all use `using IDbConnection connection = ...`, so no active leak today.

*Fix:* Enforce the `using` contract via a Roslyn analyzer or code review rule. Consider adding an `IDisposable` wrapper that ties connection disposal to a scoped unit-of-work token for callers that need multi-statement atomicity. Do not move `IDbConnectionFactory` to Scoped — health checks resolve it from the root provider and cannot participate in a request scope.

**Finding 3 (Clean) — `IServiceProvider` direct resolution**

No class in `ArchLucid.Host.Composition` captures `IServiceProvider` as a constructor dependency. All `IServiceProvider` references appear as factory lambda parameters resolved once at startup and not stored. The correct `IServiceScopeFactory` pattern is used consistently across all singletons that need per-invocation scoped resolution (`RetrievalIndexingOutboxProcessor`, `IntegrationEventOutboxProcessor`, `AuthorityPipelineWorkProcessor`, `AgentOutputLlmSemanticJudge`, `TrialLifecycleEmailIntegrationEventHandler`, `CircuitBreakingContentSafetyGuard`).

### Acceptance Criteria

- [ ] `AuthorityRunCompletedAzureDevOpsIntegrationEventHandler` no longer captures `IAzureDevOpsPullRequestDecorator` in its constructor; `HttpClient` is obtained per-message via `IHttpClientFactory` or the handler's registration lifetime matches the typed-client lifetime.
- [ ] `SqlScopedResolutionDbConnectionFactory.CreateOpenConnectionAsync` XML doc updated to require `using` at all call sites; a code-review checklist entry or analyzer rule enforces this.
- [ ] `ValidateScopes = true` (already the default in Development) passes after the handler fix; no new Singleton→Scoped captures introduced.

---

## Prompt Batching Guidance

All improvements are V1-actionable (or resolved). Batches optimized for context-window reuse:

**Batch 1 — RAG & AI quality (highest leverage)**
Run prompts **1** (Policy-Pack Indexing), **2** (LLM Faithfulness Evaluator), and **23** (Prior-Manifest Chunks) together. Shared namespaces: `ArchLucid.Retrieval`, `ArchLucid.AgentRuntime.Evaluation`. Same TB-021 / RAG-V1-* engineering charter.

**Batch 2 — Observability & telemetry**
Run **7** (RAG Telemetry), **12** (Grafana ROI Panel), **19** (Grafana Outbox Panel), and **25** (Redaction Telemetry) together. Shared files: `ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs`, `infra/grafana/*.json`, `infra/prometheus/archlucid-alerts.yml`.

**Batch 3 — CLI surfaces & operator export tools**
Run **4** (SAML Metadata CLI), **5** (Dead-Letter Retry CLI), **9** (ROI CSV CLI), **15** (Webhook Simulator CLI), **21** (Compliance Drift CLI), and **24** (Board-Pack ROI Export) together. All in the CLI project, all share `System.CommandLine` patterns and the `ArchLucid.Api.Client` generated types.

**Batch 4 — Reliability, hosted services, startup validation**
Run **8** (Blob Cleanup Job), **10** (Vector Store Health Check), **13** (RAG Fallback), **16** (ROI Cache Warmup), **18** (SAML SP Startup Validation), and **22** (Quality Gate Reject Thresholds) together. Shared infrastructure: `IHostedService`, `IHealthCheck`, `IStartupValidationRule`. **Partial completion 2026-05-24:** #10, #13, #16, #18 shipped; #8 (blob cleanup) and #22 (reject thresholds) remain.

**Batch 5 — Test coverage & focused logic**
Run **3** (ROI Dedup Tests) on its own or with Batch 4 if context permits. `ExecutiveRoiSummaryService` deserves focused attention.

**Batch 6 — Commercial publication (single-PR cohesion)**
Run **6** (Custom Pack SKU) and **11** (Pricing Quote SLA) together. Both edit `docs/go-to-market/*` and `docs/runbooks/*` GTM documents; co-changing them means one CI run for the pricing single-source-of-truth checks.

**Batch 7 — Enterprise / trust documentation (hosted SaaS)**
Run **17** (Hosted Enterprise Onboarding Checklist) and **20** (Audit Retention Extension Contract) together — both are GTM/trust documentation for **ArchLucid-hosted** Enterprise; self-hosted Enterprise deal package is **V2** per [`V1_DEFERRED.md` §6t](../library/V1_DEFERRED.md).

**Batch 8 — SQL Server persistence quality**
Run **26** (hot-path filtered indexes + INCLUDE fix + FK re-trust), **27** (NVARCHAR→UNIQUEIDENTIFIER RunId migration), and **28** (archive cascade TVP procedure + round-trip consolidation) together. All are pure SQL/migration changes in `ArchLucid.Persistence`; they share the `ArchLucid.sql` master DDL file, the DbUp migration sequence, and `SqlRunRepository.cs`. Run #27 before #28 so the cascade procedure can use direct `UNIQUEIDENTIFIER` comparisons from the start.

**Batch 9 — Relational integrity hardening**
Run **29** (trust 14 WITH NOCHECK FK constraints), **30** (add missing FK constraints on alerting/advisory/governance tables), **31** (CHECK constraints on 13 enum columns), **32** (NOT NULL on scope denormalization columns), and **33** (filtered unique index on GoldenManifests + deferred constraint resolution) in a single PR. All are pure DDL migrations with no C# logic changes. Sequencing: run #33 before #29 (filtered index before FK trust); run #30 before #31 (FKs in place before enum validation). #27 (from Batch 8) must be merged before #30 to avoid schema conflicts on `RecommendationRecords.RunId`.

**Batch 10 — Read-path concurrency hardening**
Run **34** (route metrics readers to `IReadOnlyDbConnectionFactory`) first, then **35** (`WITH (NOLOCK)` on display and analytics reads) in a follow-up PR or the same PR if the diff stays reviewable. Both touch only `ArchLucid.Persistence` read-path files with no schema changes. #34 must merge before the metrics-reader portion of #35 is applied so the NOLOCK hints land on a connection that is already off the primary writer. DI graph validation tests (`StorageProviderDiGraphValidationTests`) must pass after #34 before #35 is started.

**Batch 11 — tempdb hardening**
Run **36** (non-clustered columnstore on analytics tables) and **37** (Terraform tempdb documentation + purge procedure consolidation) together. #36 is a pure DDL migration with no C# changes; #37 is split between Terraform and SQL. Both can land in the same PR. #28 (archive cascade TVP, from Batch 8) should be merged before #37 so the consolidated purge procedure can share the TVP type established there. #38 (Azure SQL DB provisioning, Batch 12) should be completed first so #37's Terraform block targets the correct resource type.

**Batch 12 — Infrastructure: Azure SQL Database provisioning**
Run **#38** as a standalone infrastructure PR. It has no dependencies on the SQL schema improvements (those apply cleanly to the freshly provisioned database via DbUp on first startup) but everything in Batches 8–11 assumes the database exists. Provision order: create `azurerm_mssql_server` + `azurerm_mssql_database` → confirm DbUp runs cleanly → provision named read replica → wire `ReadReplica` connection string. The Terraform change is isolated to the SQL infrastructure module; no application code PRs are required.

**Batch 13 — SQL observability**
Apply **#39** (OTel SQL client), **#40** (connection pool metrics), **#41** (health check latency), and **#42** (Intelligent Insights + Prometheus alerts) as a single observability PR. Run #39 and #40 together (both are pure DI wiring in `Program.cs` or `ServiceCollectionExtensions`, no schema changes); run #41 immediately after (touches only `SqlConnectionHealthCheck.cs`); run #42 last (pure Terraform, no application code changes — can be a separate infra PR if the team separates app and infra PRs). All four items are additive; none break existing tests. Sequencing constraint: #42 depends on the `azurerm_mssql_database.app` resource from Batch 12 existing so the diagnostic settings have a target resource. No dependency on Batches 8–11.

**Batch 14 — Backup, DR, and RTO/RPO hardening**
Apply **#43** (PITR 35 days + geo-redundant backup storage + LTR policy), **#44** (failover group enforced for production + connection string listener validation), and **#45** (GRS storage + backup restore drill runbook) together as a single DR hardening sprint. Sequencing: run #43 and #44's Terraform changes together (both extend the SQL infrastructure Terraform from Batch 12; `backup_storage_redundancy` must be set at initial database creation, so ensure this is done before the first production provision); run #44's application code changes in a separate PR (adds `SqlServer:FailoverGroupListenerFqdn` to `SqlServerOptions` and the startup validation rule); run #45 last (creates the drill runbook and storage `production.tfvars.example`, then schedule and execute the first drill to validate the targets in `RTO_RPO_TARGETS.md`). Dependency: Batch 14 must follow Batch 12 (the database resource must exist for PITR/LTR/backup_storage_redundancy to apply); it is independent of Batches 8–11 and 13.

**Batch 15 — On-call alerting (wake-up routing)**
Apply **#46** as a single, focused infrastructure + ops PR. It is completely additive — no application code changes, no schema changes, no test changes. Work order: (1) sign up for PagerDuty Free and configure your on-call notification rules in the mobile app (20 minutes); (2) apply the Terraform changes to add the `ag-critical` action group with SMS, voice, and PagerDuty receivers; (3) update the six P0 Prometheus alert labels to `severity: critical, tier: p0` and update their routing to `ag-critical`; (4) fire a test alert from the Azure Portal to verify end-to-end: email + SMS + voice + PagerDuty push → SMS → phone escalation. The PagerDuty webhook URI and phone numbers must be stored in Key Vault — never in tfvars. No dependency on any other batch.

**Batch 16 — SQL security hardening**
Apply **#47** (Defender for SQL + auditing), **#48** (MI enforcement + TrustServerCertificate block), and **#49** (TDE CMK + `al_rls_bypass` fix) as a focused security sprint. Run in this order: (1) **#48** first — pure application code, no infrastructure dependencies, green tests immediately verifiable; (2) **#47** second — Terraform only, requires the SQL server from Batch 12 and the alert email address from Batch 15 variables; (3) **#49** last — the `al_rls_bypass` SQL fix is a one-line change with a unit test; the CMK Terraform requires the Key Vault from `terraform-keyvault` to exist first and the SQL server to have `identity { type = "SystemAssigned" }` added (from #47's server resource edit). All three items are additive and non-breaking. No dependency on Batches 8–15 except Batch 12 (SQL server must exist for #47 and #49 Terraform).

**Batch 17 — SQL-as-queue hardening**
Apply **#50** (RetrievalIndexingOutbox leasing + dead-letter + Prometheus gauge) as a single, self-contained PR. Schema migration first, then the C# changes to `DapperRetrievalIndexingOutboxRepository` and `IRetrievalIndexingOutboxRepository`, then `InMemoryRetrievalIndexingOutboxRepository`, then the unit test. The KEDA SQL scaler is a separate follow-up PR after the schema change has deployed to production and queue depths are stable. No dependency on any other batch; the schema migration is additive (new nullable columns with defaults) and will not break any existing query. The `AuthorityPipelineWorkOutbox` is already well-guarded and does not need schema changes in this batch.

**Batch 18 — Terraform documentation**
Apply **#51** (Terraform advisory C# inline documentation) and **#52** (inline documentation pass on existing `infra/` Terraform roots) together in a single documentation PR. #51 is pure XML doc-comment changes on C# files with no logic edits; #52 is pure `#` comment additions to existing `.tf` files with no HCL logic changes. Run #51 first, then #52 in the same branch. Neither touches application code, schema migrations, or tests. No dependency on any other batch; both are safe to land at any time.

**Batch 19 — Architecture boundary hardening**
Run **#53** (13 missing `DependencyConstraintTests` assertions), **#54** (prune dead `Api.csproj` `ProjectReference` entries), and **#55** (lateral domain coupling policy decision) in this order. Start with #55's decision table: it determines whether M8–M11 in #53 become prohibiting tests or pinning tests. Once decisions are recorded, write all 13 facts in #53 (a single `DependencyConstraintTests.cs` edit). Finally apply #54 to remove the two dead `ProjectReference` entries from `Api.csproj`; the newly added M2/M3 assembly-metadata facts will then pass. All three items touch only `ArchLucid.Architecture.Tests` (for #53) and `ArchLucid.Api/ArchLucid.Api.csproj` (for #54) — no production logic changes and no schema migrations. No dependency on any other batch.

---

## Deferred Scope (V2 — not penalized in `(A)`)

Canonical detail: [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6r and §6t.

| Item | V1 posture | V2 commitment |
|------|------------|---------------|
| **Non-SCIM bulk-CSV user onboarding** | **Out of V1.** SCIM 2.0 is the committed V1 Enterprise identity path on **hosted SaaS** (`V1_SCOPE.md` §2.12). | **V2** — [`V1_DEFERRED.md` §6r](../library/V1_DEFERRED.md). |
| **Self-hosted Enterprise commercial deals** (deployment playbook, private-endpoint reference architecture, consolidated capacity guide, order-form / support posture for customer-operated installs) | **Out of V1.** **V1 GA Enterprise = ArchLucid-hosted SaaS.** Container / compose / Terraform remain engineering assets only. | **V2** — [`V1_DEFERRED.md` §6t](../library/V1_DEFERRED.md). |

---

## Pending Questions for Later

No open `(A)`-blocking questions. All previously open items either resolved (Custom Policy Pack Authoring, 2026-05-24) or completed (Cross-Tenant ROI Deduplication Tests, 2026-05-24) or removed because they pertained to V1.1 / V2 scope per `Assessment-Scope-V1_1.mdc` and therefore must not penalize `(A)` or appear as `(A)` pending questions:

- ~~Slack App Directory Listing Strategy~~ — V1.1 chat-ops follow-on per `V1_DEFERRED.md` §6a.
- ~~AWS/GCP Multi-Cloud Analysis Pricing~~ — V1.1 per §6n.
- ~~MCP Tool Allowlist Expansion~~ — V1.1 surface per §6d.
- ~~Third-Party Pen-Test Remediation SLAs~~ — V2 per §6c.
- ~~Support Tier SLAs for V1.1~~ — V1.1 commercial scope.
- ~~Non-SCIM bulk-CSV user onboarding~~ — **V2** per [`V1_DEFERRED.md` §6r](../library/V1_DEFERRED.md).
- ~~Self-hosted Enterprise commercial deals~~ — **V2** per [`V1_DEFERRED.md` §6t](../library/V1_DEFERRED.md) (includes capacity guide, private-endpoint reference architecture, deployment playbook).

These items will reappear naturally when a future assessment is scoped against V1.1 / V2 contracts. They do not belong in a V1 headline-readiness review.
