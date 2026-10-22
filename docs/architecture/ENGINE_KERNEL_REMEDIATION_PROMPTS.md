> **Scope:** Copy-paste agent prompts that close the architecture-synthesis / review-evaluation kernel gaps in [`architecture_handbook/75-architecture-and-review-engines.md`](architecture_handbook/75-architecture-and-review-engines.md). Internal engineering only.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **ADRs:** 0030, 0037, 0039, 0042, 0045, 0063, 0065, 0067.

# Engine-kernel remediation prompts

Run **one prompt per chat**, in order. Name a git branch in any commit/push request. Do not implement EK-10 until EK-09 records an owner decision. Do not add a third kernel named “policy engine,” “quality engine,” or an LLM `IReviewEngine`.

**Spec IDs** referenced below (`F1`–`F7`, `B7`–`B16`) are defined in handbook chapter 75 §11 and §14.

**Global constraints (every prompt):**

- Tenant isolation remains database-per-tenant catalogs (ADR 0037). Do not introduce SQL RLS as the paying-client boundary.
- Deterministic authority must stay independent of LLM catalog choice (ADR 0065 D10). Do not put engine identity into `ManifestHash` (D5′).
- Create architecture and Review stay co-equal *entry points* (ADR 0067). Prompt EK-10 is about *kernels*, not about re-ranking CTAs.
- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. Blank line before `if`/`foreach` unless first line of method. Check nulls. No `ConfigureAwait(false)` in tests.
- Stage only files this prompt changes. No `git add -A`.
- Before editing tracked files, run `.\scripts\agent\check-working-tree-path.ps1` on those paths.

---

## EK-01 — Delete the `IReviewEngine` alias

**Closes:** F1, B11  
**Depends on:** none  
**Branch suggestion:** `docs/engine-kernel-ek01-drop-ireviewengine`

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: delete the misnamed type alias ArchLucid.Contracts.Abstractions.Agents.IReviewEngine (empty interface extending IAgentExecutor) and replace every use with IAgentExecutor.

Why: Handbook chapter 75 treats IReviewEngine as a category error. It is not the review evaluation kernel (authority pipeline). Planning docs have already mistaken it for an LLM/review gateway. Reclaim the word “review engine” for the authority sequence only.

Do not:
- Change IAgentExecutor, DeterministicAgentSimulator behaviour, or authority pipeline stages.
- Introduce a new IReviewEvaluationKernel in this prompt (that is later work).
- Rename DeterministicReviewEngine yet; keep the class name if callers are widespread, but make it implement IAgentExecutor only. If a rename is one-line and tests already use the class name, you may rename to DeterministicAgentExecutor only if it does not churn product copy.
- Put engine identity into ManifestHash.

Work:
1. Find all references to IReviewEngine (code, tests, XML docs, markdown).
2. Replace the interface with IAgentExecutor.
3. Delete IReviewEngine.cs.
4. Update docs that call IReviewEngine “the review engine” (especially docs/architecture/ai_model_chooser_plan_review_2026_07_18.md and handbook chapter 75 / 04 if they still say the alias exists — change them to past tense / “removed”).
5. Add an architecture test that fails if IReviewEngine is reintroduced under ArchLucid.Contracts.Abstractions.Agents.

Tests: existing DeterministicReviewEngineTests and any compile of AgentSimulator / Application. Add the architecture test in ArchLucid.Architecture.Tests.

Done when: `IReviewEngine` type is gone; solution compiles on the contracts/agent/architecture-test projects; grep for IReviewEngine returns only historical ADR/spec mentions that say it was removed.
```

---

## EK-02 — Plugin skip set = registered EngineType set

**Closes:** B8, F1 (catalog honesty)  
**Depends on:** none (can run parallel with EK-01)

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: make FindingEnginePluginDiscovery.BuiltInEngineTypeIds a complete, generated-or-tested set of every IFindingEngine.EngineType registered in ServiceCollectionExtensions.Decisioning.cs (including ArchLucid.Application inventory engines and ArchLucid.Capabilities.Cost engines).

Why: Chapter 75 boundary B8 — the skip set is a proper subset of registered engines. A third-party plugin can load EngineType values such as security-gap or cost-breach beside the product engine.

Do not:
- Change AnalyzeAsync signatures (that is EK-05).
- Include ITechnologyConsistencyFindingEngine in the IFindingEngine skip set; it is a different interface.
- Load ArchLucid.* assemblies from the plugin directory (keep that skip).

Work:
1. Collect EngineType from every services.AddScoped<IFindingEngine, …> registration.
2. Prefer a source-generated or test-enforced set over a hand-maintained HashSet. Minimum bar: an architecture or Decisioning test that reflects over the composition root (or a shared catalog type) and asserts BuiltInEngineTypeIds equals the registered EngineType set (ordinal, case-insensitive).
3. Update docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md last-reviewed date and tables to match registration. Cite chapter 75 §3.3.2.

Tests: new test that fails if a registered engine id is missing from the skip set or a skip id is not registered.

Done when: skip set == registered IFindingEngine EngineType values; FINDING_ENGINE_OUTPUT_REFERENCE.md lists Decisioning, Cost, and Application engines separately and notes effectful engines.
```

---

## EK-03 — Recommendation ids are a function of inputs

**Closes:** F7, B10  
**Depends on:** none

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: make ArchitectureRecommendationEngine.BuildRecommendations a deterministic function: identical (model, findings, declaredPriorities) must yield identical RecommendationId values.

Why: Chapter 75 F7 — RecommendationId = Guid.NewGuid() makes the synthesis recommendand a random process, so golden-cohort and replay cannot treat recommendation identity as stable.

Do not:
- Change recommendation prose builders except as needed to keep hashing stable.
- Hash wall-clock or random salts into the id.
- Touch ManifestHashService.

Work:
1. Replace Guid.NewGuid() in ArchitectureRecommendationEngine.CreateRecommendation with a stable id: SHA-256 (or existing repo hash helper) over a canonical tuple (finding identity, proposed-change string, dimension). Format as hex or “N” guid-shaped digest, documented in a one-line comment.
2. If two findings would collide, include FindingId (or title+engine+dimension) so the map stays injective on the input list order-independently. Sort inputs before hashing if the output list order is allowed to be sorted; if output order must match input order, hash per finding without sorting the list.
3. Unit tests: two calls with cloned inputs produce the same RecommendationId sequence; changing proposed change or finding identity changes the id.

Done when: ArchitectureRecommendationEngineTests (create if missing) prove functionality; no Guid.NewGuid in that class.
```

---

## EK-04 — Finding merge is a confluence-friendly join

**Closes:** F4, B7  
**Depends on:** EK-02 recommended (catalog known)  
**Risk:** behaviour change on colliding type|title pairs

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: replace FindingsOrchestrator’s parallel First-wins GroupBy(FindingType|Title) merge with a deterministic join keyed by ADR 0063 correlation identity, with explicit conflict records when payloads differ.

Why: Chapter 75 F4 — μ is not commutative/confluent. ADR 0063 uses {policyRuleId}:{normalizedFindingFingerprint} (fallback fuzzy fingerprint). Orchestration currently uses a third equality. Three keys do not commute.

Do not:
- Silently drop a colliding finding.
- Use task completion order.
- Auto-apply governance disposition across runs (ADR 0063 point 4).
- Change IFindingEngine.AnalyzeAsync in this prompt (EK-05).

Work:
1. Read ADR 0063 and any existing fingerprint helper (TB-2042 if present). Reuse; do not invent a fourth key.
2. After validation, partition findings by the ADR 0063 key (within the snapshot).
3. If all members of a partition are payload-equal under an explicit comparer, keep one (lowest EngineType ordinal for stability).
4. If they differ, keep a primary finding (document the tie-break) AND append a FindingEngineFailure or a dedicated conflict finding type that lists EngineType ids and FindingIds in the partition. Product must be able to see the conflict.
5. Sort engine invocation results by EngineType before merge so the fold is independent of Task.WhenAll order even before grouping.
6. Tests: two engines emitting the same type|title but different payloads no longer depend on scheduling; snapshot contains a conflict signal; disjoint keys still union; total engine failure still AggregateException; partial failure still returns snapshot.

Done when: FindingsOrchestratorTests cover confluence (run the two-engine collision test twice and assert identical surviving FindingId and conflict signal); docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md describes the join key.
```

---

## EK-05 — Honest finding-engine arity

**Closes:** F6, B13  
**Depends on:** EK-02  
**Risk:** plugin contract change — keep IFindingEngine as the graph-pure interface

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: stop lying about IFindingEngine’s domain. Keep IFindingEngine as GraphSnapshot → Finding[] for graph-pure Decisioning engines. Move or wrap Application inventory/cost engines that close over extractors, freshness options, or SQL onto an explicit effectful port.

Why: Chapter 75 F6/B13 — several Application engines implement AnalyzeAsync(GraphSnapshot) but read repositories the signature does not declare. Plugin authors copy the lie.

Do not:
- Cram policy packs into IFindingEngine in this prompt (no policy calculus yet).
- Break FindingsOrchestrator’s IEnumerable<IFindingEngine> fold without an adapter. An adapter from effectful → IFindingEngine that captures dependencies in the class constructor is acceptable only if the interface XML-doc states “graph-pure; implementations must not query I/O beyond GraphSnapshot.” Effectful engines must not implement IFindingEngine after this change unless the orchestrator has a second collection IEffectfulFindingEngine.

Work:
1. Inventory every IFindingEngine in ServiceCollectionExtensions.Decisioning.cs. Classify graph-pure vs effectful by reading the class (does it use IOptions freshness, extractor packages, SQL?).
2. Introduce IEffectfulFindingEngine (own file) with AnalyzeAsync that includes GraphSnapshot plus CancellationToken and whose implementing classes keep constructor-injected IO. Orchestrator invokes both families, still parallel, still same merge (EK-04 if already shipped).
3. XML-doc IFindingEngine as graph-pure. Add an architecture test: Decisioning.* IFindingEngine types must not reference ArchLucid.Persistence or extractor package repositories.
4. Update HOWTO_FINDING_ENGINE_PLUGINS.md: plugins remain graph-pure IFindingEngine.

Tests: orchestrator still returns a snapshot when only effectful engines emit findings; architecture test forbids Persistence usings in Decisioning finding engines.

Done when: Application inventory engines do not implement IFindingEngine; plugin docs match; chapter 75 B13 note can be marked remediated in a one-line changelog in 98-changelog.md.
```

---

## EK-06 — Doc and architecture-test guard for the word “review engine”

**Closes:** F1 (documentation recurrence)  
**Depends on:** EK-01

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: prevent reintroduction of the IReviewEngine alias and prevent new docs from calling the agent-task executor “the review engine.”

Why: Chapter 75 naming collisions. EK-01 deletes the type; without a guard, the next plan will recreate it.

Work:
1. Architecture test: Contracts assembly must not contain a type named IReviewEngine.
2. Optional markdown drift test only if the repo already has doc-guard tests; do not create a brittle corpus-wide ban on the phrase “review engine.” Instead add a short note to docs/architecture/architecture_handbook/04-authority-vs-coordinator.md and 75 that IReviewEngine was removed (EK-01) and the review evaluation kernel is AuthorityPipelineStagesExecutor.
3. Update docs/architecture/ai_model_chooser_plan_review_2026_07_18.md if it still says IReviewEngine is the boundary.

Done when: architecture test exists; chapter 04/75 wording matches shipped types after EK-01.
```

---

## EK-07 — Stop overloading ArchitectureRunStatus for both kernels

**Closes:** F3, B15  
**Depends on:** none  
**Risk:** API/status serialization — prefer additive fields over enum rewrite

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: make completeness of the review evaluation kernel (authority stages) and completeness of the agent-task loop two explicit predicates, instead of overloading ArchitectureRunStatus for both.

Why: Chapter 75 F3 — same enum, two completeness predicates. Mixed-path incidents (execute/result on authority-complete runs) are runtime checks on a type that cannot express the distinction.

Do not:
- Require Durable Task Framework.
- Break existing ArchitectureRunStatus numeric values (property tests pin them). Additive is required.
- Treat this as a UI copy change (ADR 0067).

Work:
1. Document the two predicates in code XML and in handbook chapter 75 §5.1:
   - Agent-task commit-ready: status ReadyForCommit AND HasCommitReadyAgentResults({Topology,Cost,Compliance,Critic}).
   - Authority-complete: all PipelineStageSequence stages succeeded (RunStageOutcomes) AND golden manifest pointer present as defined by existing GET /v1/architecture/review/{runId} rules.
2. Introduce a dedicated read model or flags on run detail (e.g. AuthorityPipelineComplete, AgentTaskLoopComplete) computed from existing tables — do not invent a second status enum unless you can migrate without breaking OpenAPI snapshot. Prefer computed DTO fields + tests.
3. Tighten execute/result/finalize guards to consult AuthorityPipelineComplete rather than only origin/manifest heuristics. Reuse AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md (TB-1007).
4. Tests: authority-finalized run cannot execute; agent-task ReadyForCommit without authority stages is still described as agent-task complete not authority-complete on the DTO.

Done when: run detail (API) exposes both flags; contract snapshot updated if the DTO changed; mixed-path tests fail closed.
```

---

## EK-08 — One decision morphism with an optional agent appendix

**Closes:** F5, B12  
**Depends on:** EK-07 helpful  
**Owner:** do not delete IDecisionEngineV2 until merge into M is specified and tested

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: specify and then implement a single decisioning entry used by the authority path whose domain is (context, graph, findings) with an optional agent-result appendix, so IDecisionEngineV2 is not a peer kernel.

Why: Chapter 75 F5 — Δ and Δ2 have disjoint domains and an implicit third merge into the manifest.

Do not:
- Change ManifestHash canonical fields except if a new structural section is deliberately added (then follow hasher baseline / TB-1157). Prefer not to change the hash projection in this prompt.
- Let LLM catalog choice alter Δ (ADR 0065 D10).

Work:
1. Write a short ADR or handbook subsection (prefer a new ADR only if behaviour changes) stating: authority DecideAsync is the only producer of ManifestDocument + DecisionTrace; IDecisionEngineV2.ResolveAsync may run as a pre-step that materializes DecisionNode[] which DecideAsync consumes when present; it must not write golden manifests itself.
2. Trace current merge (IDecisionEngineService.MergeResults, IDecisionEngineV2NodeMaterializer). If V2 nodes never reach authority DecideAsync, either wire them explicitly or stop calling V2 on the authority path.
3. Tests: authority pipeline tests still produce a manifest with V2 disabled; when agent results exist, nodes appear in the trace or a documented unused-appendix warning — pick one behaviour and test it. No silent drop.

Done when: there is one documented producer of M; V2 is a subroutine or is not invoked on authority Seq.
```

---

## EK-09 — Owner decision: two kernels or one pipeline with two labels

**Closes:** F2 (decision, not code)  
**Depends on:** none  
**Produces:** a written owner decision in docs/architecture/adrs/ (next number) — no product code unless the ADR says so

### Prompt (copy below)

```text
You are working in the ArchLucid repo in docs-only mode unless the owner already chose an option in this chat.

Problem (chapter 75 F2): ADR 0067 made Create architecture and Review co-equal jobs. Architecture generation is still implemented as the four-agent execute loop (IAgentExecutor) with PackageOrigin=Created. Either the ADR overclaims (one kernel, two labels) or the code under-implements (two kernels).

Write ADR 00xx (next free number per docs/architecture/adrs/README.md) that records exactly one owner choice:

Option L (labels): There is one evaluation/generation pipeline. Origin is a field on Run. Stop talking about a distinct synthesis kernel in code. Keep ADR 0067 for UI entry-point parity only.

Option K (kernels): Synthesis must not be IAgentExecutor execute. Introduce IArchitectureSynthesisKernel (draft + generate) whose generate path does not require Topology/Cost/Compliance/Critic AgentResult as the definition of an architecture. Review remains AuthorityPipelineStagesExecutor.

Constraints:
- Do not rewrite ADR 0067; this ADR amends implementation standing only.
- Unequal artifacts remain: draft is not a sealed record (A2).
- If Option K, EK-10 is unblocked. If Option L, EK-10 is cancelled and chapter 75 §4.3 is rewritten to say the entanglement is accepted.

Output: ADR file + one paragraph in handbook 75 §14.4 stating which option was chosen. No code in this prompt.
```

---

## EK-10 — Synthesis kernel is not review execute (only if EK-09 chose Option K)

**Closes:** F2, B16  
**Depends on:** EK-09 Option K  
**Cancel if:** EK-09 Option L

### Prompt (copy below)

```text
You are working in the ArchLucid repo. EK-09 must already record Option K (two kernels). Goal: introduce IArchitectureSynthesisKernel (own file) implemented by draft persistence + a generate path that does not define success as the four AgentType results.

Why: Chapter 75 §4.1 — A is a coproduct with no type. §4.3 — generate reuses the review-shaped agent batch.

Do not:
- Make a draft a golden manifest (A2, ADR 0067 point 5).
- Rank Create below Review in UI (ADR 0067).
- Put this kernel behind IReviewEngine (deleted in EK-01).
- Require DTF.

Work:
1. Interface: DraftAsync and GenerateAsync with explicit inputs (ArchitectureRequest / draft id) and outputs (DraftId and/or RunId with PackageOrigin Created). GenerateAsync may still call LLMs via IAgentCompletionClient for topology proposals, but commit-readiness for a *created architecture* must not be HasCommitReadyAgentResults of the four review agents.
2. Wire create-architecture intent on POST /v1/architecture/request to this kernel. Start-review intent stays on authority coordination.
3. Keep the four-agent loop available for the review/agent-task path only (TB-1007).
4. Tests: create-architecture does not require Critic AgentResult to persist a draft or Created-origin run; start-review still runs Seq. Architecture test: IArchitectureRunExecuteOrchestrator is not referenced from the synthesis implementation.

Done when: a Created-origin happy path test does not call EnsureCommitReadyAgentResults; review path tests unchanged.
```

---

## EK-11 — One customer noun for Run; draft stays DraftRequests

**Closes:** object-model noun collision (chapter 75 §2.3–2.4)  
**Depends on:** EK-09 (copy must match Option L or K)  
**Scope:** copy + guards, not a new Architecture table

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: customer-facing copy uses one noun for dbo.Runs (prefer “review” when origin is Reviewed and “architecture” only for DraftRequests and Created-origin generate output that is not sealed). Do not add an Architecture table.

Why: Chapter 75 — there is no ArchitectureId. Package/review/architecture nouns still collide on the same Run (see docs/architecture/architecture_review_object_model_assessment.md). Simplification 10 in chapter 75 §14.4.

Do not:
- Violate ADR 0067 co-equal CTAs.
- Call a draft a sealed or governed record.
- Mass-rename OpenAPI types in this prompt (ArchitectureRun stays the wire type unless a dedicated contract ADR exists).

Work:
1. Inventory operator-visible strings for package/review/architecture on /architecture/reviews and /architecture/architectures (i18n, hub copy, breadcrumbs). Propose a minimal table of changes in the PR description; implement only the hub/list/detail eyebrow inconsistencies that call the same object four names on one page.
2. Keep PackageOrigin as a field, not a second object.
3. Add or update a Vitest guard for the worst colliding strings on the reviews list H1 vs nav vs tab title if guards already exist (do not fight TB-738 if that test still pins “Architecture packages” — if it does, stop and record a conflict with this prompt in the PR; do not delete that guard without owner override).

Done when: either the colliding H1/nav/tab set is unified, or the PR documents the TB-738 conflict and does not ship a half-rename.
```

---

## EK-12 — Provenance must carry producer because the hash does not

**Closes:** §7.4 / §7.6 (hash vs replay) — not a hash change  
**Depends on:** none

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: run detail and replay comparison always surface catalog engine identity and NotEvaluated state from Runs.EngineProvenanceJson / AgentExecutionTrace, because ManifestHash excludes producer (ADR 0065 D5′).

Why: Chapter 75 — hash equality does not imply engine equality. Replay must not lead with “manifest hash match” as “same review.”

Do not:
- Add engine identity to ManifestHashService’s canonical projection.
- Silent cross-engine failover (ADR 0065 D12).

Work:
1. Verify EndToEndReplayComparisonService diffs engine identity (ADR 0065 D5′). If missing, add the field and tests.
2. Verify run detail API/UI shows catalog alias + NotEvaluated when that is the recorded state.
3. Tests: two runs with identical structural manifest sections and different engines report engine change as the leading interpretation.

Done when: replay tests exist; UI or API contract includes engine identity on comparison; hasher tests still exclude engine fields.
```

---

## Suggested execution order

| Wave | Prompts | Parallel? |
|------|---------|-----------|
| 0 | EK-09 (owner ADR) | No — blocks EK-10 and informs EK-11 |
| 1 | EK-01, EK-02, EK-03, EK-12 | Yes |
| 2 | EK-06 (after EK-01), EK-04, EK-05 (after EK-02) | EK-04/05 after EK-02 |
| 3 | EK-07, EK-08 | After wave 1 |
| 4 | EK-10 only if Option K; EK-11 after EK-09 | No |

Wave 1 is local and does not change the product contract surface except docs. Wave 4 is the actual architecture simplification.
