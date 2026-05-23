> **Scope:** Canonical AI leverage catalogue for product and engineering leads; prioritised opportunities to exploit AI across the platform—not the reliability/usability backlog in `LATEST.md` or a procurement deliverable.

# ArchLucid AI Leverage Roadmap

**Authored:** 2026-05-20  
**Audience:** product, engineering leads, and the assessment owner  
**Purpose:** Canonical 25-item prioritised catalogue of opportunities to exploit AI more aggressively across the ArchLucid platform. Complements the existing improvement backlog in `docs/assessments/LATEST.md` which focuses on reliability, usability, and commercial packaging. This file focuses exclusively on AI depth.

**Scope boundaries:**
- V1 items reuse existing agent runtime, LLM client, and transport — no new infra contracts, feature-flaggable.
- V1.1 items coordinate with already-pinned V1.1 scope in `V1_DEFERRED.md` (MCP §6d, multi-cloud §6n, ITSM §6/6a). Cross-run executive ROI is **V1** ([V1_SCOPE.md](V1_SCOPE.md) §2.8).
- V2 items require new substrate, fine-tuning MLOps, or cross-tenant analytics (explicitly out of V1 per `V1_DEFERRED.md` §1).

---

## Assessment category note

The current `AI/Agent Readiness` weight-8 quality category implicitly measures **agent pipeline quality** (circuit breakers, quality gates, prompt redaction, cost estimation). It under-weights two things the V1 product can now ship:

1. **AI-augmented operator productivity** — AI shortening *day-to-day* operator tasks (request authoring, finding triage, IaC drafting, drift explanation), not just the 30-second run loop.
2. **AI knowledge compounding** — the system getting smarter from its own use (faithfulness telemetry, calibrated confidence, prompt regression detection).

**Recommended action (Option A — minimal):** Keep the category as-is but explicitly broaden its scoring definition to span both pipeline quality *and* operator-facing AI productivity. No reweighting required; just ensure the scoring rationale calls out both axes separately so future assessments don't under-score operator-facing AI gaps as a side effect.

**Alternative (Option B — split):** Replace `AI/Agent Readiness` (weight 8) with `Agent Pipeline Quality` (weight 5) + `AI-Augmented Operator Productivity` (weight 3). Total weight unchanged. Deferred until a few operator-facing items below have shipped — splitting is overhead before there is something concrete to score.

---

## V1 — 15 items (pre-GA, feature-flaggable, reuses existing runtime)

### 1. Findings-to-IaC stub generator
**Why it matters:** Closes the "what do I do now?" gap after a run. Operators get a Bicep/Terraform snippet that directly addresses each finding. Directly improves Time-to-Value, Adoption Friction, and Proof-of-ROI in one change.

**Why V1:** Agents already emit `ProposedChanges` (`ManifestDeltaProposal`). This re-emits those proposals as IaC text with a `groundedInClaim` reference. No new contracts; one new LLM post-processing pass after commit.

**Affected qualities:** Time-to-Value (+5), Adoption Friction (+4), AI/Agent Readiness (+3).

**Cursor prompt:**
```text
Create a new service IFindingIacStubGenerator in ArchLucid.Application/Agents/IaC/. For each ArchitectureFinding with a non-null evidenceRefs list, call IAgentCompletionClient with a constrained prompt: "Given this architecture finding: {finding.Message}. Generate the minimal Azure Bicep snippet that resolves it. Return ONLY the bicep code, no prose." Append the result as a new string property IacStub (nullable) on ArchitectureFinding. Call this service from AuthorityRunOrchestrator after commit, guarded by a new config key AgentRuntime:GenerateIacStubs (default false). Surface IacStub in the run detail API response and in a collapsible "Bicep Stub" panel in the archlucid-ui findings list.
```

---

### 2. AI-assisted Architecture Request authoring
**Why it matters:** Eliminates the blank-page tax that stalls first-tenant runs. Operators paste a brief; AI suggests constraints, requiredCapabilities, assumptions, topologyHints, securityBaselineHints.

**Why V1:** Single new endpoint `POST /v1/architecture/request/draft`. Reuses existing LLM client. Operator confirms every field — pure assistive, no changes to the run contract.

**Affected qualities:** Time-to-Value (+4), Adoption Friction (+5), Usability (+3).

**Cursor prompt:**
```text
Create a new endpoint POST /v1/architecture/request/draft in ArchLucid.Api/Controllers/Planning/ArchitectureRequestController.cs. Accept a DraftArchitectureRequestInput containing a free-text description (string, required, MinLength 20). Call IAgentCompletionClient with the system prompt: "You are an enterprise architecture intake assistant. Given this system description, produce a JSON object with keys: suggestedConstraints (string[]), suggestedCapabilities (string[]), suggestedAssumptions (string[]), topologyHints (string[]), securityBaselineHints (string[]). Be specific and concise. Return ONLY valid JSON." Return the parsed result as DraftArchitectureRequestResponse. In archlucid-ui, add a "✨ Suggest fields" button to the New Request form that calls this endpoint and pre-fills the constraint and capability fields, with each pre-filled value visually marked as AI-suggested until the operator edits or accepts it.
```

---

### 3. Per-finding conversational explainer
**Why it matters:** "Why is this a finding? What evidence backs it? What is the smallest fix?" Directly reduces operator cognitive load without requiring a full Ask conversation thread.

**Why V1:** Reuses `IAskService` constrained to a single finding's evidence package. New `FindingAskRequest` variant of `AskRequest` with tighter system prompt and pre-loaded `findingId` context. No new transport.

**Affected qualities:** Usability (+5), Adoption Friction (+3), AI/Agent Readiness (+2).

**Cursor prompt:**
```text
Add a new method AskAboutFindingAsync(FindingAskRequest, ScopeContext, CancellationToken) to AskService.cs. FindingAskRequest contains FindingId (Guid), Question (string), and optional ThreadId. The method should: 1) load the ArchitectureFinding and its parent AgentResult from persistence; 2) build a structured JSON context containing only that finding's message, severity, category, claims, and evidenceRefs; 3) use a tighter system prompt: "You are an enterprise architect. The operator has a question about one specific architecture finding. Explain it clearly: why it matters, what evidence supports it, and what the smallest concrete fix is. Use only the supplied finding data." Wire this as POST /v1/architecture/finding/{findingId}/ask. In archlucid-ui, add a chat icon next to each finding row that opens an inline Ask panel pre-seeded with this endpoint.
```

---

### 4. Streaming Ask (SSE)
**Why it matters:** Token-by-token streaming eliminates the blank wait for operator questions. Directly improves perceived AI responsiveness.

**Why V1:** SSE is a minimal controller change over HTTP/1.1. No WebSocket infrastructure, no signalling, no state. The LLM client already yields tokens; the controller just needs to flush them.

**Affected qualities:** Usability (+5), AI/Agent Readiness (+3).

**Cursor prompt:**
```text
Add a new endpoint POST /v1/ask/stream to AskController.cs that returns a chunked SSE response (Content-Type: text/event-stream). In AskService.cs, add a new method AskStreamAsync(AskRequest, ScopeContext, CancellationToken) that yields IAsyncEnumerable<string> tokens by configuring IAgentCompletionClient to stream (pass stream: true in the AOAI request). Write each token as a SSE data: line directly to HttpResponse.Body. In archlucid-ui, add a useAskStream() hook that consumes the SSE stream using the Fetch API (ReadableStream) and appends tokens to state so they render incrementally in the Ask panel using the existing react-markdown component.
```

---

### 5. Multi-model tiered orchestration
**Why it matters:** Routes complex agents (Critic, Topology) to a reasoning-grade model and simple tasks (parsing, formatting) to a fast/cheap model. Targets 30–50% run cost reduction.

**Why V1:** `DefaultAgentExecutorResolver` and `IAgentCompletionClient` are the correct seams. Additive — existing configuration and single-model deployments continue to work unchanged.

**Affected qualities:** Cost-Effectiveness (+5), AI/Agent Readiness (+3), Performance (+3).

**Cursor prompt:**
```text
Add a ModelTier enum (Reasoning, Fast) to ArchLucid.Contracts/Common/. Add a property ModelTier ModelTier to AgentTask (default Reasoning). In AgentTaskFactory, assign ModelTier.Fast to formatting, parsing, and schema-remediation tasks; ModelTier.Reasoning to Topology, Compliance, Cost, and Critic agent tasks. Update IAgentCompletionClient and its Azure OpenAI implementation to accept an optional ModelTier parameter and resolve the deployment name from a new config block AgentRuntime:ModelTiers:Reasoning (default: existing deployment) and AgentRuntime:ModelTiers:Fast (default: same as Reasoning so existing config is backward compatible). Log the resolved deployment name in the AgentExecutionTrace.
```

---

### 6. Critic adversarial second-pass with disagreement findings
**Why it matters:** The current Critic prompt is review-oriented but consensus-leaning (rule 8: "prefer conservative, review-oriented findings"). Strengthening it to materially challenge the other agents is the cheapest single-prompt change to raise overall output quality and trust.

**Why V1:** `CriticSystemPromptTemplate.cs` is the only file that needs to change, plus a test update. No new contracts; no new infrastructure.

**Affected qualities:** AI/Agent Readiness (+6), Reliability (+2).

**Cursor prompt:**
```text
Update CriticSystemPromptTemplate.cs. Replace rule 8 ("Prefer conservative, review-oriented findings") with: "8. You MUST challenge the other agents' implied decisions. For each claim or proposed component you disagree with or find under-justified, emit a finding with category: 'Critic', severity: 'High' or 'Medium', and a message that states explicitly what you dispute and why. Do not emit a finding if you agree — silence is endorsement." Add a new rule: "9. If any Topology, Cost, or Compliance proposal conflicts with the request's explicit constraints, emit a 'Critical' severity finding citing both the constraint and the conflicting proposal." Update CriticAgentHandlerTests.cs to add a test case verifying that a scenario with an explicit constraint violation produces at least one High or Critical Critic finding.
```

---

### 7. Inline governance-block explainer ("why is this blocked?")
**Why it matters:** When a policy pack rejects a manifest commit, operators currently get a rule ID. Adding an AI explanation of *which* architectural change triggered it and the *minimum edit* to unblock removes one of the worst pilot blockers.

**Why V1:** `EffectiveGovernanceResolver` already returns the blocking rule. This wraps its output in a single LLM pass — no new persistence, no new API version.

**Affected qualities:** Adoption Friction (+4), Usability (+4), Decision Velocity (+3).

**Cursor prompt:**
```text
In EffectiveGovernanceResolver.cs (or its caller in the commit path), when a governance rule blocks the commit, call IAgentCompletionClient with the prompt: "Policy rule '{rule.RuleId}' ({rule.Description}) blocked an architecture manifest commit. The manifest change that triggered it was: {serialised delta}. In two sentences: (1) explain why this rule exists, (2) describe the minimum manifest change that would satisfy it." Return this explanation as a new string property BlockExplanation (nullable) on GovernanceBlockResult. Surface it in the commit API error response (HTTP 409) and display it prominently in the archlucid-ui commit rejection toast.
```

---

### 8. Findings priority re-ranker by business impact
**Why it matters:** Operators receive up to 30 "High" findings per run with no signal on which to address first. A single re-ranking call that weighs business impact (industry vertical, tenant policy weights) versus just severity converts an overwhelming list into an actionable queue.

**Why V1:** `IndustryVertical` comes from the tenant profile (or the `ArchitectureRequest`). Re-ranker is a post-commit LLM call; findings are already in the DB. Feature-flagged.

**Affected qualities:** Usability (+4), Adoption Friction (+3), Proof-of-ROI Readiness (+3).

**Cursor prompt:**
```text
Create IFindingPriorityReranker in ArchLucid.Application/Findings/. After an architecture run commits, collect all ArchitectureFindings for the run. Group them by severity. For each severity tier, call IAgentCompletionClient with: "You are an enterprise risk advisor. Rank these {n} architecture findings from most to least urgent business impact for a {industryVertical} organisation. Return ONLY a JSON array of findingId strings in priority order." Persist the rank as a new int column PriorityRank on dbo.Findings via a DbUp migration. Add an ?orderBy=priority query param to GET /v1/architecture/run/{runId} findings response. Guard with config key AgentRuntime:RerankFindings (default false).
```

---

### 9. Run summary one-pager auto-generator
**Why it matters:** Produces a CFO-ready DOCX/MD in one click: severity counts, USD impact, top-3 findings, and a 90-second brief. Directly strengthens Executive Value Visibility — the most common missing artefact in pilot presentations.

**Why V1:** The export pipeline already emits MD/DOCX. This is one additional LLM-populated template alongside the existing ones.

**Affected qualities:** Executive Value Visibility (+5), Proof-of-ROI Readiness (+3), Adoption Friction (+2).

**Cursor prompt:**
```text
Add a new export variant RunSummaryOnePager to ArchitectureReviewBoardExportDocumentFactory.cs. It should: 1) count findings by severity (Critical/High/Medium/Low); 2) call IAgentCompletionClient with the top-5 High/Critical findings and produce a 3-sentence executive summary; 3) populate a new Markdown template templates/exports/run-summary-one-pager.md.hbs with severity counts, the AI summary, and top-3 finding titles. Expose it as GET /v1/architecture/run/{runId}/export/summary in ArchitectureExportController.cs and add a "Download Executive Summary" button in the archlucid-ui run detail page next to the existing export options.
```

---

### 10. AI policy-pack drafting assistant
**Why it matters:** Operators write free-text governance intent ("encrypt PHI at rest, audit every override") and get a draft Policy Pack rule JSON conforming to the existing schema. Removes the blank-page tax for enterprise policy customisation — one of the primary reasons pilots stall.

**Why V1:** The 23 bundled policy packs in `bundled-policy-packs-v1.manifest.json` are exemplars for few-shot prompting. Operator reviews and saves — no automatic writes.

**Affected qualities:** Adoption Friction (+5), Decision Velocity (+4), AI/Agent Readiness (+2).

**Cursor prompt:**
```text
Create a new endpoint POST /v1/governance/policy-pack/draft in GovernanceController.cs. Accept a DraftPolicyPackInput with FreeTextIntent (string, MinLength 20). Load 3–4 existing bundled policy pack rule examples from the manifest as few-shot context. Call IAgentCompletionClient with the prompt: "You are a cloud governance expert. Based on the following intent, draft a valid ArchLucid policy pack rule JSON object conforming to this schema: {PolicyPackRule schema}. Use these existing rules as examples: {fewShotExamples}." Return the draft as DraftPolicyPackRuleResponse (with a prominent disclaimer that it requires human review before activation). In archlucid-ui, add a "✨ Draft a rule from plain English" button to the Policy Pack editor that opens a text input and shows the draft in side-by-side view with the schema.
```

---

### 11. Conversational compare-two-runs explainer
**Why it matters:** "What changed between run A and run B, and why does it matter?" Surfaces the delta as a narrative, not just a diff table. Directly improves Stickiness and Proof-of-ROI by making every re-run feel like a progress report.

**Why V1:** `IComparisonService` already produces structured deltas. This is a thin LLM narration layer over data that already exists.

**Affected qualities:** Stickiness (+4), Proof-of-ROI Readiness (+3), Executive Value Visibility (+3).

**Cursor prompt:**
```text
In AskService.cs, when the AskRequest includes both BaseRunId and TargetRunId, after loading the comparison delta from IComparisonService, pre-pend the narrative generation step: call IAgentCompletionClient with the system prompt "You are an enterprise architect. Given the delta between two architecture runs, write a 3–5 sentence narrative: (1) the most significant improvement, (2) any new risk introduced, (3) whether the architecture is net-better or net-worse." Attach this narrative as a top-level string field ComparisonNarrative in AskResponse. Render it as a highlighted banner in the archlucid-ui comparison view before the delta table.
```

---

### 12. Calibrated agent confidence
**Why it matters:** Agent self-reported `Confidence` is a raw model output — uncalibrated and therefore unreliable as a quality gate input. Calibrating it against historical `AgentOutputEvaluator` scores makes the quality gate genuinely predictive rather than cosmetic.

**Why V1:** `AgentOutputEvaluator` and `AgentOutputSemanticEvaluator` already produce ground-truth scores. The calibration layer is purely additive; the raw confidence stays unchanged.

**Affected qualities:** AI/Agent Readiness (+5), Reliability (+2).

**Cursor prompt:**
```text
Create a new service IAgentConfidenceCalibrator in ArchLucid.Application/Agents/. It should load the last N (configurable, default 200) (rawConfidence, semanticScore) pairs from dbo.AgentOutputEvaluations per AgentType. Fit a monotonic isotonic regression (or Platt scaling — use a simple piecewise linear approximation; no ML library required). Expose a CalibrateAsync(AgentType, double rawConfidence) -> double method. Call it in the post-execution path after AgentOutputEvaluator runs, writing the calibrated confidence to a new column CalibratedConfidence on dbo.AgentResults via a DbUp migration. Surface CalibratedConfidence in the AgentResult API response and use it (when not null) in place of raw confidence in AgentOutputQualityGate threshold comparisons.
```

---

### 13. LLM-assisted Azure extractor result cleanup
**Why it matters:** When the extractor returns partial data (missing optional RBAC roles, half-populated resource graph), a cleanup pass infers missing fields from naming conventions and resource group structure, with explicit `inferred: true` provenance. Directly fixes the extractor fragility weakness.

**Why V1:** The extractor already emits a structured ZIP artifact. The cleanup is a post-ingest pass before run execution; no changes to the extractor script.

**Affected qualities:** Adoption Friction (+5), Time-to-Value (+3), Reliability (+2).

**Cursor prompt:**
```text
Create a new service IAzureExtractorResultEnricher in ArchLucid.Application/Infrastructure/. After the Azure extractor ZIP is ingested and parsed, iterate over InfrastructureDeclarationRequest items where any required field (ResourceType, Location, Tier) is null or empty. For each such item, call IAgentCompletionClient with: "Given this Azure resource name '{name}' in resource group '{rg}', infer the most likely ResourceType, Location, and SKU/Tier. Return ONLY JSON: {resourceType, location, tier, inferred: true}." Merge the response back into the declaration, setting Inferred = true on each populated field. Surface Inferred: true fields with a visual indicator in the archlucid-ui request review page so operators can confirm before execution.
```

---

### 14. Agent-curated evidence pack proposals
**Why it matters:** When an agent encounters strong evidence not in the catalog, it proposes a new evidence item. Operators review and promote into `PolicyEvidence` / `PatternEvidence`. The catalog gets smarter with every run — this is the foundation of a compounding knowledge advantage.

**Why V1:** `EvidencePackage` types are already first-class contracts. Adding an operator-review queue is a CRUD page backed by a new `dbo.EvidenceProposals` table. No changes to the run pipeline.

**Affected qualities:** AI/Agent Readiness (+5), Stickiness (+3).

**Cursor prompt:**
```text
Add a new column ProposedEvidenceJson (nvarchar(max), nullable) to dbo.AgentResults via a DbUp migration. In each AgentHandler, after the primary LLM call, make a second short LLM call: "Based on your findings, is there any architectural pattern, policy rule, or service catalog entry that is missing from ArchLucid's evidence catalog and would help future analyses? If yes, return a JSON object: {type: 'Policy'|'Pattern'|'Service', title: string, description: string, rationale: string}. If no, return null." Persist the response in ProposedEvidenceJson. Create a new EvidenceProposalsController endpoint GET /v1/admin/evidence/proposals and a POST /v1/admin/evidence/proposals/{id}/promote that creates the appropriate PolicyEvidence or PatternEvidence row. Add an "Evidence Proposals" review screen to the archlucid-ui admin area.
```

---

### 15. Templates-pack drift detection (close the harness loop)
**Why it matters:** Converts today's inform-only harness into a real regression sentinel. Any committed run against a template scenario that drops below the recall floor triggers an alert. This is the closed-loop quality flywheel.

**Why V1:** Builds directly on the harness shipped earlier today. Needs one nightly CI job that runs the scorer against fresh recordings plus a Loki alert rule — mirrors the policy-pack alerting pattern already in the repo.

**Affected qualities:** AI/Agent Readiness (+4), Reliability (+3).

**Cursor prompt:**
```text
Update .github/workflows/template-eval-harness.yml to add a scheduled trigger (cron: '0 3 * * *') that runs python scripts/ci/eval_template_harness.py --mode score --report artifacts/eval-harness-nightly.md. Add a step that reads the report and emits a GitHub Actions warning annotation (::warning::) for each scenario that fails recall or trips an unexpected hit, so drift is visible in the Actions summary without blocking the build. Update scripts/ci/eval_template_harness.py to emit a machine-readable JSON summary (eval-harness-summary.json) alongside the markdown report, containing per-scenario pass/fail, recall percentage, and unexpected hit count, so a future monitoring integration can consume it.
```

---

## V1.1 — 7 items (new contract, vector store, or coordinates with V1.1-pinned scope)

### 16. Semantic search over historical findings and manifests
**Why it matters:** "Have we seen this PHI-exposure pattern before?" Embed all committed findings and manifest deltas; operator queries with natural language. Step-change in operator productivity once a tenant has >50 runs.

**Why V1.1:** Requires a vector store decision (Postgres `pgvector` vs Azure AI Search) and an embedding pipeline not present in V1. Aligns with V1.1 infrastructure window.

**Note:** This is the enabling infrastructure for items 17, 19, and 22.

---

### 17. LLM-driven request similarity at authoring time
**Why it matters:** "Your brief is 80% similar to NorthwindRetailWeb — these are the findings they fixed and you should expect." Dramatically improves Time-to-Value for the second and subsequent requests.

**Why V1.1:** Depends on #16 (semantic search). Sits on top of cross-system within-tenant analytics, which V1 permits.

---

### 18. Continuous prompt-regression detection from real runs
**Why it matters:** Detects model drift, prompt drift, or evidence-pack drift in hours, not weeks. Beyond the templates-pack harness (10 synthetic scenarios), this feeds every committed real-mode run through the faithfulness + semantic-quality pipeline.

**Why V1.1:** Needs the V1 harness baselined first (#15). Adds a real-time quality stream that the V1 batch harness deliberately avoids. Requires a telemetry pipeline aligned with the V1.1 quality dashboard (#22).

---

### 19. Portfolio chat over the knowledge graph
**Why it matters:** "Which of my systems still expose public SQL endpoints?" Operator asks free-form questions across the whole tenant graph, not just one run.

**Why V1.1:** Requires graph-to-LLM structured tool calls. Aligns naturally with the MCP inbound membrane pinned for V1.1 in `V1_DEFERRED.md` §6d — seven read-only tools including `GetProvenanceGraph` and `GetGovernanceStatus` are the natural backing.

---

### 20. Auto-tagged drift narratives between runs
**Why it matters:** "You added a public IP to your web tier; this regressed a finding you fixed in Run 47." The product starts remembering and narrating your architectural history. Directly proves stickiness through product memory.

**Why V1.1:** Needs cross-run state tracking and a narrative LLM pass. Complements the V1 cross-run executive ROI summary ([V1_SCOPE.md](V1_SCOPE.md) §2.8) but does not depend on it.

---

### 21. Findings-to-verification-checklist generator
**Why it matters:** For each finding, generates a list of code/IaC checks (Pester, PSRule, Checkov, OPA) the operator should run to confirm the fix. Closes the gap between "fix recommended" and "fix verified."

**Why V1.1:** The mapping from finding → check requires a curated checker library that doesn't exist in V1. The content investment is new scope, not a reuse of existing patterns.

---

### 22. AI quality dashboard (faithfulness trends, refusal rate, cost per run)
**Why it matters:** Makes AI quality a first-class operator concern: faithfulness trend, refusal rate, prompt cost per run, model error rate, calibrated confidence drift, prompt regression alerts. Operationalises AI as infrastructure, not magic.

**Why V1.1:** Needs telemetry plumbing beyond what V1's correlation IDs and execution traces cover today. Pairs naturally with the V1.1 compliance drift trend (improvement #23 in LATEST.md).

---

## V2 — 3 items (new substrate, cross-tenant data, or fine-tuning MLOps)

### 23. Cross-tenant pattern learning (opt-in, anonymised)
**Why it matters:** "85% of healthcare tenants that hit your finding-cluster applied this mitigation." Massive competitive differentiation — but only credible at scale.

**Why V2:** Cross-tenant analytics is **explicitly out of V1** per `V1_DEFERRED.md` §1. Requires consent flow, k-anonymity guarantees, and legal review. Earliest sensible timeline is after V1.1 provides sufficient per-tenant telemetry volume to base the model on.

---

### 24. Fine-tuned ArchLucid SLM for the Critic role
**Why it matters:** A small specialist model trained on accumulated ArchLucid runs replaces generic GPT-4o for the Critic. 5–10× cheaper, faster, and arguably better-grounded for architecture critique than a general model.

**Why V2:** Needs data volume (~50k labelled runs), a fine-tuning MLOps pipeline, eval harness maturity (#15, #18 must ship first), and an AOAI fine-tuning or Azure ML serving substrate. None exists in V1 or V1.1; only worth starting after V1.1 telemetry confirms stable training labels.

---

### 25. Outbound MCP client — ArchLucid calls external tool servers for live evidence
**Why it matters:** Agents call Azure Resource Graph MCP, GitHub MCP, ServiceNow MCP for live evidence during a run. Step-change in evidence freshness — architecture analysis is grounded in live infrastructure state, not a snapshot from the extractor.

**Why V2:** Already pinned to V2 (out of V1.1) per `V1_DEFERRED.md` §6d. Requires allowlist + approval-class mapping that doesn't exist in the V1.1 inbound MCP membrane scope. Must not widen without a separate owner decision in `PENDING_QUESTIONS.md`.

---

## Recommended sequencing for V1

### Batch A — AI foundations (2–3 weeks)
**Items 4, 5, 6** (Streaming Ask, Multi-model orchestration, Critic adversarial second-pass)

These three share a single feature flag (`AgentRuntime:AiBatchA:Enabled`), require no new persistence, and directly address the most visible "AI feels thin" perception. Ship together; they are independent of each other but compound in impact.

### Batch B — AI as operator workflow assistant (4–6 weeks)
**Items 1, 2, 3, 7** (IaC stubs, Request authoring, Per-finding explainer, Governance-block explainer)

Four operator-facing surfaces that convert "AI runs in the background" into "AI works alongside me every day." Ship after Batch A is stable. Items 2 and 3 can be parallelised.

### Batch C — AI as judgment and narrative layer (4–6 weeks, partial parallel with Batch B)
**Items 8, 9, 10, 11** (Re-ranker, One-pager, Policy-pack drafter, Compare-runs explainer)

These produce artefacts operators show to stakeholders. Start after item 7 is in review (they share the same prompt-construction patterns). Items 9 and 11 can be shipped earlier if the executive narrative gap is urgent.

### Batch D — AI quality and self-improvement (3–4 weeks)
**Items 12, 13, 14, 15** (Calibrated confidence, Extractor cleanup, Evidence proposals, Drift detection)

These are infrastructure investments. They make every future AI feature safer and more accurate. Start after Batch B ships so calibrated confidence and evidence proposals have real data to work with.

---

## Relationship to existing LATEST.md improvements

The 25 items in this roadmap are additive to the 25 items in `docs/assessments/LATEST.md`. They overlap in intent with the following existing items (but go deeper):

| This roadmap | LATEST.md item |
|---|---|
| #4 Streaming Ask | #2 Add Streaming Support for Ask Endpoint |
| #5 Multi-model tiered orchestration | #3 Implement Multi-Model Orchestration |
| #11 Compare-runs explainer | Partially covered by LATEST.md #5 (cross-run executive ROI — V1 §2.8) |

LATEST.md items #2 and #3 carry the Cursor prompts needed for V1 delivery; this document provides the deeper rationale and sequencing context for all 25. For V1 items not yet in LATEST.md (#1, #3, #6–#15), Cursor prompts are included here and summarised in LATEST.md.

---

## RAG quality program (engineering backlog — 2026-05-23)

This roadmap focuses on **operator-facing LLM features** and **agent prompt depth**. A complementary track improves **retrieval-grounded faithfulness** using the existing `ArchLucid.Retrieval` stack:

| Track | Document | Horizon |
|-------|----------|---------|
| V1 first slice (**TB-021**) | [`RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md`](RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md) — `CorpusKind` + `PolicyPackCorpusIndexer` | V1-now — approved 2026-05-23 |
| V1 corpus + eval (**TB-021**) | [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](RAG_QUALITY_TECHNICAL_BACKLOG.md) **RAG-V1-000**–**005** | V1-now — schedulable from assessments |
| V1.1 expansion | Same doc **RAG-V1.1-*** | [`V1_DEFERRED.md`](V1_DEFERRED.md) §6q |
| V2 advanced | Same doc **RAG-V2-*** | V2 backlog |

**Synergy:** Roadmap **#3** (per-finding Ask) and **#11** (compare narrative) benefit directly from **RAG-V1-002** (prior manifest) and **RAG-V1-004** (platform docs). Roadmap **#6** (Critic second-pass) pairs with **RAG-V1-001** (policy-pack corpus) for citation-backed dispute findings.

**Planning spine:** [`CONSOLIDATED_PLANNING_BACKLOG.md`](../CONSOLIDATED_PLANNING_BACKLOG.md) **CPB-T21**, **CPB-AI-RAG***.
