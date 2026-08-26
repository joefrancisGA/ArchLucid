> **Scope:** Copy-paste Composer prompts that raise **Decision-Changing Insight Density** (assessment pillar 1, weight 13). Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Pillar definition:** [`../assessments/ASSESSMENT_PROMPT_SERIES.md`](../assessments/ASSESSMENT_PROMPT_SERIES.md) (Category interpretation) · **V1 boundary:** [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §3
> **Next batch:** [`INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md) (ID-08–11) · then [`WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md`](WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md) (WK-15 wraps ID-11; no new coverage engines)

# Insight density — Composer prompt set

**Created:** 2026-08-26 · **Status:** ID-01 through ID-07 **SHIPPED on `master`.** Do **not** re-run the prompts below. Follow-on work is [`INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md).

## Findings this set closed (do not re-implement)

| ID | Finding (pre-ship) | Landed as |
|----|--------------------|-----------|
| **ID-01** | Pillar was a desk-review judgment with no instrument | `InsightDensityFrontierDeltaCalculator` + `scripts/ci/insight_density_frontier_delta.py` |
| **ID-02** | Typed-engine density scores computed then discarded | `InsightDensityEngineDistributionCalculator` + `docs/quality/insight-density-engine-distribution.md` (advisory only) |
| **ID-03** | Generic-advice patterns Azure-skewed | Multi-cloud fragments in `GenericArchitectureAdvicePatterns` |
| **ID-04** | Judge no-op on engine findings; unbounded calls | `ApplyToFindingsAsync` + per-snapshot cap + tenant admin controls |
| **ID-05** | Governance trail never became findings | `OpenCommitmentFindingEngine` |
| **ID-06** | No portfolio-level recurrence | `PortfolioRecurrenceFindingEngine` (default off) |
| **ID-07** | Declaration unsafe-value findings without premise conflict | `DeclarationPremiseConflictFindingEngine` |

Remaining density work (Bicep/K8s properties, policy-filter golden case, declaration policy vocabulary, advisory labeling) lives in the ID-08 file. Do **not** add another engine that only re-reads `GraphSnapshot`.

## The problem these prompts solve

The pillar is defined as *"non-obvious, correct findings a skilled architect using frontier AI would **miss**, **dismiss**, fail to **operationalize**, or fail to **package** into governance. Do not credit articulate-but-generic output."*

Everything ArchLucid has today is **subtractive**:

| Mechanism | What it does | Pillar clause covered |
|-----------|--------------|----------------------|
| `DeterministicInsightDensityGate` | Penalizes generic phrasing (−35), no evidence (−25), no anchor (−15), duplication (−15/−30) | dismiss |
| `CriticFindingObviousnessPruner` | Downgrades obvious Critic advice to `Advisory` | dismiss |
| `PremiumInsightDensityLlmJudge` | Adversarial "So What" quality control — its own system prompt says *"not to generate new findings"* | dismiss, operationalize |

A filter raises **precision**, never **density**. If the generator emits 18 generic and 2 non-obvious findings, perfect filtering yields 2. Nothing in the codebase addresses **miss**.

**These prompts split into three groups:**

| Group | Prompts | Effect |
|-------|---------|--------|
| **Measure** | ID-01, ID-02 | Make the pillar an instrument instead of a desk-review opinion |
| **Tune what exists** | ID-03, ID-04 | Close known holes in the existing gate and judge |
| **Generate** | ID-05, ID-06, ID-07 | Add findings from information a frontier model structurally cannot have |

---

## Findings this set does **not** close (leave them)

- **TB-885** (policy-pack compounding-evidence ledger) and **TB-2033**–**TB-2037** (finding verification loop, [ADR 0062](adrs/0062-finding-verification-loop.md)) are the strongest moat items but are **"Hold for reassessment … not Cursor-shippable while held"** pending owner promotion. Do **not** start them from this document. See [`../library/TECH_BACKLOG.md`](../library/TECH_BACKLOG.md).
- **TB-883** (Graph-RAG live ablation signal) is also on assessment hold.
- Live-pilot validation (**G-REAL-06**) is owner execution, not an engineering batch.
- Do **not** add finding engines that read the same `GraphSnapshot` the existing 35 engines already read without adding a **new information source**. That grows the denominator and lowers density.

---

## Sequencing

| Prompt | Title | Parallel? | Depends on |
|--------|-------|-----------|------------|
| **ID-01** | Frontier-baseline delta harness | Yes with ID-02/03/07 | none |
| **ID-02** | Per-engine insight-density distribution report | Yes with ID-01/03/07 | none |
| **ID-03** | Multi-cloud generic-advice patterns | Yes with ID-01/02/07 | none |
| **ID-04** | Judge coverage for engine findings + per-snapshot cap | No | ID-03 merged |
| **ID-05** | Open-commitment finding engine | No | ID-01 merged (want the delta number first) |
| **ID-06** | Portfolio recurrence finding engine | No | ID-05 merged (shares effectful scope plumbing) |
| **ID-07** | Declaration premise-conflict engine | Yes with ID-01/02/03 | none |

**Do not run these prompts again.** They have landed. Next runnable set: [`INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md) (Bicep/K8s property extraction, policy-filter golden case, declaration policy vocabulary, advisory labeling). Name a git branch in any commit or push request (repo rule: `Git-Commit-Requires-Branch`); land follow-on work on feature branches, not `master`, while trunk hygiene proceeds.

---

## Global constraints (paste into every prompt if Composer drops context)

- **Repo conventions:** each class in its own file; prefer LINQ over `foreach` unless it degrades performance; prefer concrete types over `var`; one blank line before `if` / `foreach` unless it is the first line of a method; always check nulls; comment anything a developer with two years' experience would not follow; **no `ConfigureAwait(false)` in tests**.
- **Tenant isolation** stays database-per-tenant catalogs (ADR 0037). Do not introduce SQL RLS as the paying-client boundary. Any new repository read must flow through the existing scope provider.
- **New finding engine checklist** (all four or the guard test fails):
  1. Implement `ArchLucid.Decisioning.Interfaces.IFindingEngine` (graph-pure) **or** `IEffectfulFindingEngine` (may do I/O).
  2. Add a row to `ArchLucid.Decisioning/Plugins/BuiltInFindingEngineTypeCatalog.cs` → `ImplementationTypeNameToEngineType`.
  3. Add the matching `services.AddScoped<Di.IFindingEngine, …>()` (or `Di.IEffectfulFindingEngine`) line in `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.Decisioning.cs`.
  4. `ArchLucid.Decisioning.Tests/Plugins/BuiltInFindingEngineTypeCatalogTests.cs` regex-parses that composition file and asserts catalog ≡ registration ≡ `EngineType`.
- **Payload DTOs** live in `ArchLucid.Contracts/Findings/Payloads/`. There is **no** `ArchLucid.Decisioning.Findings.Payloads` namespace — do not create one.
- **No new NuGet packages** unless already in `Directory.Packages.props`.
- **Do not regenerate the OpenAPI snapshot** when the HTTP wire schema is unchanged. If it does change, follow [`../library/OPENAPI_CONTRACT_DRIFT.md`](../library/OPENAPI_CONTRACT_DRIFT.md).
- **Do not add persisted columns or `FindingsSnapshot` contract fields** unless the prompt explicitly says to. Snapshot schema changes drag migrations, `FindingsSnapshotMigrator`, and OpenAPI with them.
- Stage only the files the prompt changed. **No `git add -A`.**
- One scoped compile per prompt; one retry on exit code 1.

---

# Group 1 — Measure

## ID-01 — Frontier-baseline delta harness

**Closes:** the pillar is currently a desk-review judgment (score 64) with no instrument. Every other change here is unfalsifiable until this exists.
**Depends on:** none
**Branch suggestion:** `insight-density/frontier-delta-harness`

### Design intent (read before prompting)

A live frontier-model call cannot run in CI — nondeterministic and metered. Instead **commit the baseline once per corpus case** and compute the delta offline, exactly mirroring the shipped `*.real.json` exemplar pattern and the TB-884 `PolicyPackAttributionSignalCalculator` + `scripts/ci/policy_pack_attribution_signal.py` pair.

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: build a deterministic, offline "frontier-baseline delta" signal that measures how many ArchLucid findings a strong frontier model given the same evidence did NOT produce. This is the instrument for the Decision-Changing Insight Density pillar.

Why: the pillar rewards findings a skilled architect using frontier AI would miss. Today nothing measures that. DeterministicInsightDensityGate only penalizes generic phrasing; it cannot tell us whether a finding is novel relative to a competent baseline.

Mirror the shipped TB-884 precedent exactly:
- C# static calculator in the product assembly.
- Python CI script duplicating the scoring logic offline over committed JSON fixtures.
- Committed summary JSON + Markdown under docs/quality/, verified with --check.
- unittest drift test under scripts/ci/tests/.

Read first:
- ArchLucid.Decisioning/Findings/PolicyPackAttributionSignalCalculator.cs (the pattern to imitate)
- scripts/ci/policy_pack_attribution_signal.py (the CLI pattern: --corpus, --json-out, --markdown-out, --enforce, --check)
- scripts/ci/tests/test_policy_pack_attribution_signal.py (REPO_ROOT = Path(__file__).resolve().parents[3]; importlib.util.spec_from_file_location to load the script)
- ArchLucid.Core/Findings/InsightDensityTextSimilarity.cs (Jaccard token-set similarity; currently `internal static`)
- ArchLucid.Contracts/Findings/FindingsSnapshot.cs and Finding.cs
- tests/eval-corpus/policy-pack-attribution/*.json (fixture shape precedent)

Work:

1. Promote the similarity helper so Decisioning can use it. ArchLucid.Core.csproj has InternalsVisibleTo for ArchLucid.Decisioning.Tests but NOT ArchLucid.Decisioning. Make InsightDensityTextSimilarity a public static class with public JaccardSimilarity(string, string) and keep MaxPeerSimilarity internal if it is only used inside Core. Do NOT widen InternalsVisibleTo — prefer a narrow public surface over friend assemblies.

2. Create ArchLucid.Decisioning/Findings/InsightDensityFrontierDeltaCalculator.cs — public static class:

   public static FrontierDeltaSignal Calculate(
       FindingsSnapshot snapshot,
       IReadOnlyList<FrontierBaselineFinding> baseline,
       double matchSimilarityThreshold)

   Matching rule (a snapshot finding is "covered" by the baseline when ANY hold):
   - Same normalized Category AND Jaccard(Title, baselineTitle) >= matchSimilarityThreshold, OR
   - finding.PolicyRuleId equals a baseline ruleId (case-insensitive) when both are present.

   Emit, each in its own file under ArchLucid.Decisioning/Findings/:
   - FrontierBaselineFinding (category, title, optional ruleId)
   - FrontierDeltaSignal (TotalFindingCount, CoveredByBaselineCount, NovelFindingCount, NoveltyPercentage, ByEngine)
   - FrontierDeltaEngineRow (EngineType, FindingCount, NovelFindingCount, NoveltyPercentage)

   Default threshold constant: 0.60. Justify it in an XML comment as "title-level topical overlap, deliberately looser than the 0.70/0.85 duplication thresholds because cross-model phrasing differs more than intra-snapshot phrasing."

   Only count findings whose Classification is DecisionGradeFinding. ChecklistCoverage rows are already demoted and must not inflate novelty.

3. Create the fixture corpus at tests/eval-corpus/insight-density-frontier-delta/ with schema id "archlucid.insight-density-frontier-delta-scenario.v1". Each scenario file:
   { "schemaVersion": 1, "id": "...", "inputSummary": "...",
     "archlucidFindings": [ { "findingId", "engineType", "category", "title", "policyRuleId", "classification" } ],
     "frontierBaseline": { "model": "<label only, no vendor claim>", "capturedUtc": "...", "promptRef": "docs/quality/...", "findings": [ { "category", "title", "ruleId" } ] },
     "expectedNoveltyPercentage": 0.0 }

   Author exactly 3 scenarios by hand: one where ArchLucid is highly novel, one where it mostly duplicates the baseline, one empty-baseline edge case. Do NOT fabricate a real frontier-model transcript — set "model" to a neutral label like "baseline-a" and add a README.md in that folder stating these are hand-authored regression fixtures, not captured model output.

4. Create scripts/ci/insight_density_frontier_delta.py mirroring policy_pack_attribution_signal.py:
   - functions: jaccard_similarity(a, b), is_covered_by_baseline(finding, baseline, threshold), build_summary(corpus_dir)
   - schema id "archlucid.insight-density-frontier-delta-summary.v1"
   - CLI: --corpus (default tests/eval-corpus/insight-density-frontier-delta), --json-out (default docs/quality/insight-density-frontier-delta.json), --markdown-out (default docs/quality/insight-density-frontier-delta.md), --enforce, --check
   - --enforce fails when any scenario's computed novelty deviates from expectedNoveltyPercentage by more than 0.001
   - --check fails when the committed summary files differ from freshly computed output

5. Create scripts/ci/tests/test_insight_density_frontier_delta.py (unittest) asserting: jaccard parity with the C# helper on 3 shared string pairs, coverage matching on rule-id and title paths, and that build_summary matches the committed docs/quality/ JSON.

6. Create ArchLucid.Decisioning.Tests/Findings/InsightDensityFrontierDeltaCalculatorTests.cs covering: all-novel, all-covered, rule-id match beats title mismatch, empty baseline = 100% novel, ChecklistCoverage rows excluded, per-engine rollup.

7. Run the committed summary generation so docs/quality/insight-density-frontier-delta.json and .md exist and --check passes.

8. Add a "Frontier-baseline delta" section to docs/library/AGENT_EVAL_CORPUS.md describing the fixture folder, the script, and the honest limitation: hand-authored baselines are a regression instrument, NOT evidence that ArchLucid beats any named model. Do not add a buyer-facing claim anywhere.

Do not:
- Call any live model, add an API client, or add a NuGet package.
- Wire this into the PR-blocking CI lane. Add the invocation to the informational lane only, or leave it script-only and say so in the summary.
- Touch FindingsSnapshot, persistence, migrations, or OpenAPI.
- Name a real competitor model in committed fixtures or docs.

Compile check: dotnet build ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj
Test: dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityFrontierDelta"
Python: python -m unittest discover -s scripts/ci/tests -p "test_insight_density_frontier_delta.py"

Done when: three fixtures score deterministically, --check passes on committed summaries, C# and Python agree on the shared cases, and AGENT_EVAL_CORPUS.md documents the limitation honestly.
```

---

## ID-02 — Per-engine insight-density distribution report

**Status:** Shipped on `master`. Scores remain **advisory** — `typed-engine-protected` bypass is unchanged.

**Closes:** a real hole. In `DeterministicInsightDensityGate.Score`, when `!candidate.IsAgentArchitectureFinding` the method returns `Promote` / `DecisionGradeFinding` unconditionally with penalty reason `typed-engine-protected` — the computed score is discarded as a decision input. All 35 deterministic engines bypass density control entirely, so checklist-shaped engine output inflates finding count with nothing to catch it.
**Depends on:** none
**Branch suggestion:** `insight-density/per-engine-distribution`

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: make the insight-density score of DETERMINISTIC engine findings visible per EngineType, without changing any demotion behavior.

Why: DeterministicInsightDensityGate.Score short-circuits for non-agent findings — it returns Promote/DecisionGradeFinding regardless of the computed score, tagged "typed-engine-protected". The score is already calculated and then thrown away. We do not know which of the 35 built-in engines emit checklist-shaped content. Measuring first is safe; demoting typed findings could silently drop compliance-relevant rows.

Explicitly DO NOT change demotion behavior. typed-engine-protected stays. This prompt is measurement only.

Read first:
- ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs
- ArchLucid.Core/Findings/InsightDensityGateCandidate.cs (FromFinding factory)
- ArchLucid.Core/Findings/InsightDensityGateResult.cs
- ArchLucid.Core/Findings/InsightDensityFindingSourceClassifier.cs
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarness.cs and GoldenCorpusRegressionTests.cs
- ArchLucid.Decisioning/Findings/PolicyPackAttributionSignalCalculator.cs (calculator shape)

Work:

1. Create ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionCalculator.cs — public static class:

   public static InsightDensityEngineDistribution Calculate(
       FindingsSnapshot snapshot,
       IInsightDensityGate gate)

   For every finding in snapshot.Findings, build an InsightDensityGateCandidate via the existing factory, score it against its snapshot peers, and group by EngineType. Report per engine: FindingCount, MinScore, MedianScore, MaxScore, and the count of findings whose score is below InsightDensityGateOptions.DemotionThreshold ("WouldDemoteIfUnprotectedCount"). Name that property so nobody mistakes it for actual demotion.

   Rows in their own files: InsightDensityEngineDistribution, InsightDensityEngineDistributionRow.

2. Create a repo-root-relative reporting path in the golden-corpus test project (NOT in the product runtime): a new test ArchLucid.Decisioning.Tests/GoldenCorpus/InsightDensityEngineDistributionReportTests.cs that runs the existing GoldenCorpusHarness over all committed cases, aggregates the distribution across cases, and writes docs/quality/insight-density-engine-distribution.md when ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION=1 is set. Follow the existing record-mode convention used by GoldenCorpusMaterializerTests (env-gated, trait-excluded from the CI fast core).

   When the env var is NOT set, the test must still assert the calculator runs over every case without throwing and that every EngineType present in the snapshot appears in the distribution. That gives CI value without file writes.

3. Generate and commit docs/quality/insight-density-engine-distribution.md. Add a short header explaining: scores are advisory for typed engines, typed-engine-protected means no demotion occurs, and a low median is a signal to improve that engine's output — not a bug in the gate.

4. Add ArchLucid.Decisioning.Tests/Findings/InsightDensityEngineDistributionCalculatorTests.cs covering: single engine, multiple engines, median with even and odd counts, empty snapshot, and that WouldDemoteIfUnprotectedCount counts scores strictly below the configured threshold.

Do not:
- Change DeterministicInsightDensityGate scoring or the typed-engine short-circuit.
- Demote, filter, or reorder any finding.
- Add fields to FindingsSnapshot, InsightDensityCurationSummary, persistence, or OpenAPI.
- Emit the report from product runtime code — this is a test/reporting-time artifact.

Compile check: dotnet build ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj
Test: dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityEngineDistribution"

Done when: the committed markdown ranks all engines by median insight-density score, and no production behavior changed.
```

---

# Group 2 — Tune what exists

## ID-03 — Multi-cloud generic-advice patterns

**Closes:** `GenericArchitectureAdvicePatterns.ObviousPhraseFragments` is a hardcoded 37-entry array that is visibly Azure-biased (`"use azure monitor"`, `"azure key vault"`, `"enable defender"`). After the FIT ingest work opened AWS/GCP/Kubernetes paths, generic advice on those platforms is silently under-penalized.
**Depends on:** none
**Branch suggestion:** `insight-density/multi-cloud-generic-patterns`

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: extend generic-advice detection to AWS, GCP, and Kubernetes phrasing so the insight-density gate penalizes obvious advice on every supported target cloud, not just Azure.

Why: GenericArchitectureAdvicePatterns.ObviousPhraseFragments is Azure-skewed ("use azure monitor", "azure key vault", "enable defender", "well-architected framework"). ArchLucid now ingests bicep, arm-json, kubernetes-json, kubernetes-yaml, and AWS/GCP Terraform, and AWS/GCP policy packs auto-enable on targeted reviews. Generic AWS/GCP/K8s checklist advice currently scores as if it were architecture-specific.

Read first:
- ArchLucid.Core/Findings/GenericArchitectureAdvicePatterns.cs (all four GeneratedRegex members and the fragment array)
- ArchLucid.Core.Tests/Findings/DeterministicInsightDensityGateTests.cs
- docs/library/customer-facing/CLOUD_COVERAGE_MATRIX.md (which clouds have peer packs)

Work:

1. Reorganize ObviousPhraseFragments into clearly commented groups: provider-neutral, Azure, AWS, GCP, Kubernetes. Keep it a single static readonly string[] — do NOT move it to a JSON/config file (it is compile-time detection logic, and externalizing it would let a tenant weaken the gate).

2. Add fragments covering the equivalent obvious advice per provider. Cover at minimum:
   - AWS: cloudtrail, guardduty, security hub, kms, iam roles/policies, security groups, s3 public access block, vpc flow logs, secrets manager, waf
   - GCP: cloud audit logs, security command center, cloud kms, vpc service controls, iam conditions, secret manager, cloud armor
   - Kubernetes: network policies, pod security standards/admission, rbac, resource limits/requests, secrets encryption, read-only root filesystem, non-root user, image scanning, service mesh mTLS
   Phrase them the way an LLM writes checklist advice (lowercase, imperative fragments), matching the existing style.

3. Extend the ImperativeGenericAdvice GeneratedRegex noun alternation to include the new subjects (network polic, pod security, resource limits, guardduty, cloudtrail, security hub, secrets manager, secret manager, cloud armor, kms, waf, image scanning, etc.). Keep the existing verb list.

4. Keep every existing test passing. IsObviousGenericAdvice must stay false for architecture-anchored messages: verify that a message naming a concrete element (backticked identifier, ARM id, PascalCase service name) still passes HasArchitectureSpecificAnchor and therefore is not demoted even if it contains a generic fragment — that interaction is the whole point of the two-signal design.

5. Add ArchLucid.Core.Tests/Findings/GenericArchitectureAdvicePatternsMultiCloudTests.cs with a theory per provider group: generic phrasing is flagged, and the same advice bound to a named element from the evidence package is not demoted.

Do not:
- Change scoring weights, DemotionThreshold, or the duplication thresholds in InsightDensityGateOptions.
- Move the fragment list to configuration or a data file.
- Add a NuGet package or a new detection mechanism (embeddings, LLM) — this is a lexical pass.

Compile check: dotnet build ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj
Test: dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~GenericArchitectureAdvice|FullyQualifiedName~DeterministicInsightDensityGate"

Done when: obvious AWS/GCP/Kubernetes advice is penalized the same as the Azure equivalents, and no previously non-generic message became generic.
```

---

## ID-04 — Judge coverage for engine findings + per-snapshot cap

**Closes:** two things. First, `PremiumInsightDensityLlmJudge.ApplyToFindingsAsync(IReadOnlyList<Finding>, …)` is `Task.CompletedTask` — the "So What" loop never runs on the 35 deterministic engines, so `WhyThisIsNotGeneric`, `PrincipalArchitectValue`, and `DecisionConsequence` are null for every engine finding. Those three fields *are* the "fail to operationalize / fail to package" half of the pillar. Second, the judge is one Premium-tier call **per promoted finding** with no per-snapshot ceiling.
**Depends on:** ID-03 merged
**Branch suggestion:** `insight-density/judge-engine-coverage`

### Cost, reliability, and security notes (state these in the PR)

- **Cost:** Premium tier per finding. A 40-finding snapshot is 40 reasoning calls. The cap below is mandatory, not optional. Existing controls that already apply: `LlmTokenQuotaOptions`, `LlmDailyTenantTokenWindowOptions`, `LlmMonthlyTenantDollarBudgetOptions`, and the judge-specific `LlmJudgeDailyTokenBudgetOptions` at `ArchLucid:Agents:LlmJudge:Budget`.
- **Reliability:** judging must never fail a review. Any judge error leaves the finding at its Phase-1 treatment.
- **Security:** the judge may not invent evidence refs. `InsightDensityLlmJudgmentFaithfulnessValidator` already enforces this for architecture findings and must be applied on the engine path too.

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: run the insight-density "So What" judge over deterministic engine findings (currently a no-op), and add a hard per-snapshot ceiling on judge calls.

Why: IInsightDensityLlmJudge.ApplyToFindingsAsync(IReadOnlyList<Finding>, ct) is implemented as Task.CompletedTask in PremiumInsightDensityLlmJudge because engine findings have no AgentEvidencePackage. Consequence: WhyThisIsNotGeneric, PrincipalArchitectValue, and DecisionConsequence are null for all 35 built-in engines. Those fields are exactly what turns a correct finding into a decision — the "operationalize" and "package" clauses of the insight-density pillar. Separately, the judge currently issues one Premium-tier completion PER promoted finding with no snapshot ceiling, which is an unbounded cost per review.

Read first:
- ArchLucid.Core/Findings/IInsightDensityLlmJudge.cs
- ArchLucid.AgentRuntime/PremiumInsightDensityLlmJudge.cs (IsLlmJudgeOperational, the per-finding loop, faithfulness validation)
- ArchLucid.AgentRuntime/InsightDensityJudgeEvidenceSummary.cs
- ArchLucid.AgentRuntime/InsightDensityLlmJudgmentFaithfulnessValidator.cs
- ArchLucid.AgentRuntime/Prompts/InsightDensityJudgeSystemPromptTemplate.cs
- ArchLucid.Core/Findings/FindingInsightDensityLlmJudgmentApplicator.cs
- ArchLucid.Core/Findings/InsightDensityGateOptions.cs
- ArchLucid.Contracts/Findings/Finding.cs (Trace.GraphNodeIdsExamined, RelatedNodeIds, Trace.RulesApplied)
- ArchLucid.Host.Composition/Startup/Modules/Agents/AgentExecutionCompositionModule.cs (where PremiumInsightDensityLlmJudge replaces the NoOp)

Work:

1. Add to InsightDensityGateOptions:
   - int MaxJudgedFindingsPerSnapshot = 12; — XML comment must state this is a cost ceiling on Premium-tier calls per findings snapshot.
   - bool EnableLlmJudgeForEngineFindings = false; — separate from EnableLlmJudge so the engine path can be enabled independently and stays off by default.

2. Implement ApplyToFindingsAsync in PremiumInsightDensityLlmJudge:
   - Return immediately unless IsLlmJudgeOperational() AND EnableLlmJudgeForEngineFindings.
   - Select candidates: Treatment == Promote AND Classification == DecisionGradeFinding.
   - Order candidates by Severity descending, then InsightDensityScore ascending (judge the borderline high-severity rows first — those are where an added decision consequence changes the most), then FindingId ordinal for determinism.
   - Take at most MaxJudgedFindingsPerSnapshot.
   - Build the evidence summary from what an engine finding actually carries: Trace.GraphNodeIdsExamined, RelatedNodeIds, Trace.RulesApplied, PolicyRuleId, and the payload type name. Put this in a new file ArchLucid.AgentRuntime/InsightDensityEngineFindingEvidenceSummary.cs — do not overload the existing agent evidence summary type.
   - Reuse the existing system prompt template and InsightDensityLlmJudgmentParser.
   - Apply InsightDensityLlmJudgmentFaithfulnessValidator with the finding's allowed refs derived from the summary above. On failure, leave the finding's Phase-1 treatment untouched and log at Warning — do NOT demote engine findings on judge failure (engine findings are typed-engine-protected by design; a judge failure must not become a silent demotion path).
   - On success, apply only the enrichment fields via a new FindingInsightDensityLlmJudgmentApplicator.ApplyToFinding overload: WhyThisIsNotGeneric, PrincipalArchitectValue, DecisionConsequence, and InsightDensityScore. Do NOT let the judge change Treatment or Classification on the engine path.
   - Wrap each per-finding call so one failure cannot fail the snapshot. Honor the CancellationToken.

3. Emit an OTel counter for judged findings and skipped-by-cap findings, following the existing ArchLucidInstrumentation conventions in this repo. Name them consistently with existing insight-density/judge metrics; check what already exists before inventing names.

4. Find where the findings snapshot pipeline could invoke this and DO NOT wire it into FindingsOrchestrator — the orchestrator is graph-pure and must not gain an LLM dependency. Instead identify the Application-layer or agent-execution seam where an evidence-bearing pass already runs after the snapshot exists, and wire it there behind the new flag. If no such seam exists, STOP and report that finding rather than inventing one; leave the interface implementation in place and default-off.

5. Tests in ArchLucid.AgentRuntime.Tests:
   - not operational => no calls, no mutation
   - flag off => no calls
   - cap respected: 30 candidates with MaxJudgedFindingsPerSnapshot = 12 issues exactly 12 completions
   - ordering: highest severity / lowest score judged first, deterministic tie-break
   - faithfulness failure => Treatment and Classification unchanged, warning logged
   - success => the three enrichment fields populated
   - one thrown completion does not fail the batch
   Do not use ConfigureAwait(false) in these tests.

6. Document the new options in docs/library/CONFIGURATION_REFERENCE.md under the existing insight-density gate section, including the explicit cost warning.

Do not:
- Add an LLM dependency to ArchLucid.Decisioning or FindingsOrchestrator.
- Change EnableLlmJudge's default or the Critic architecture-finding path behavior.
- Let the judge invent evidence refs or alter engine finding Treatment/Classification.
- Persist new columns or change OpenAPI.

Compile check: dotnet build ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj
Test: dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~InsightDensity"

Done when: engine findings can receive So What enrichment behind two default-off flags, the per-snapshot ceiling is enforced and tested, and no judge failure can demote or fail anything.
```

---

# Group 3 — Generate

These are the prompts that actually raise density, because they read information a chat session cannot have.

## ID-05 — Open-commitment finding engine

**Closes:** the highest-value "frontier AI cannot do this" class. A chat model reviewing your design has no idea that review 3 deferred a risk with a revisit date that has passed, or that a waiver protecting this exact finding expires in 11 days. The durable records already exist; nothing reads them as findings.
**Depends on:** ID-01 merged
**Branch suggestion:** `insight-density/open-commitment-engine`

### Why this must be effectful (do not fight it)

The existing cross-run engines (`RequirementCrossRunDiffFindingEngine`, `TopologyCrossRunDiffFindingEngine`) are graph-pure only because ingestion pre-stamps pipe-separated summaries onto the `ContextSnapshot` node (`ContextGraphPropertyKeys.PriorRequirementNames`, `PriorTopologyCategories`). Disposition, waiver, and remediation data are **not** on the graph and must not be smuggled there. Use `IEffectfulFindingEngine` — there are already 12 of them, and `GraphAzureInventoryReconciliationFindingEngine` is the precedent for scope-aware repository reads inside an engine.

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: add an effectful finding engine that surfaces OPEN GOVERNANCE COMMITMENTS which the current review depends on — overdue deferrals, unanswered evidence requests, expiring waivers, and overdue remediations.

Why: this is the clearest class of insight a frontier model reviewing a single pasted architecture structurally cannot produce, because it requires this tenant's durable review history. It also compounds per tenant, which is the retention argument. The records already exist and nothing reads them as findings.

Read first (engine shape and precedent):
- ArchLucid.Decisioning/Interfaces/IEffectfulFindingEngine.cs
- ArchLucid.Application/Findings/GraphAzureInventoryReconciliationFindingEngine.cs (scope-aware effectful engine using IScopeContextProvider + a repository)
- ArchLucid.Decisioning/Plugins/BuiltInFindingEngineTypeCatalog.cs
- ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.Decisioning.cs (effectful registration block)
- ArchLucid.Decisioning.Tests/Plugins/BuiltInFindingEngineTypeCatalogTests.cs (the guard)

Read first (the data):
- ArchLucid.Contracts/Findings/FindingDisposition.cs (Accepted, Deferred, NeedsEvidence, Remediated, RejectedAsNotApplicable)
- ArchLucid.Contracts/Findings/FindingReviewEventRecord.cs (FindingId, Disposition?, RevisitDueUtc, EvidenceRequestText, RunId, OccurredAtUtc)
- ArchLucid.Core/Persistence/ApplicationPorts/Data/Repositories/IFindingReviewTrailRepository.cs (ListSinceUtcAsync, ListForFindingIdsSinceUtcAsync)
- ArchLucid.Contracts/Governance/RiskExceptionRecord.cs (FindingId, ExpiresAtUtc, Status) and ArchLucid.Application/Governance/IRiskExceptionService.cs (ListActiveAsync)
- ArchLucid.Application/Roi/DispositionAwareRoiBasisCalculator.cs (how to build a latest-disposition map from trail events — reuse this logic, do not reimplement it differently)
- ArchLucid.Application/Governance/FindingDispositionTrailWindow.cs (internal static readonly TimeSpan BasisBreakdownLookback = TimeSpan.FromDays(730) — internal, but your engine is in the same assembly so reference it directly instead of hardcoding a second number)
- ArchLucid.Core/Scoping/IScopeContextProvider.cs
- ArchLucid.Contracts/Findings/Finding.cs (RemediationDueUtc, AssignedToUserId)

Work:

1. Create ArchLucid.Application/Findings/OpenCommitmentFindingEngine.cs implementing IEffectfulFindingEngine.
   EngineType = "open-commitment". Category = "Governance".
   Constructor injects: IScopeContextProvider, IFindingReviewTrailRepository, IRiskExceptionService, TimeProvider, and IOptions<OpenCommitmentFindingOptions>.

2. Create ArchLucid.Application/Findings/OpenCommitmentFindingOptions.cs:
   - SectionPath = "ArchLucid:Findings:OpenCommitment"
   - bool Enabled = true
   - TimeSpan Lookback defaulting to FindingDispositionTrailWindow.BasisBreakdownLookback (do not hardcode 730 a second time)
   - int WaiverExpiryWarningDays = 30
   - int MaxFindings = 25 (cost/noise ceiling)

3. Create ArchLucid.Application/Findings/OpenCommitmentClassifier.cs — a PURE static classifier taking already-loaded records plus "now" and returning signals. Keep all I/O in the engine and all logic in the classifier so it is unit-testable without mocks. Signal kinds:
   - OverdueDeferral: latest disposition is Deferred and RevisitDueUtc < now
   - UnansweredEvidenceRequest: latest disposition is NeedsEvidence with no later event for that finding
   - ExpiringWaiver: active RiskExceptionRecord with ExpiresAtUtc within WaiverExpiryWarningDays
   - ExpiredWaiver: active record with ExpiresAtUtc < now
   - OverdueRemediation: finding with RemediationDueUtc < now and latest disposition not Remediated
   Each signal carries the finding id, the due/expiry date, and a short reason token.

4. In the engine: return empty when disabled. Resolve tenant scope from IScopeContextProvider exactly the way the Azure reconciliation engine does. Load the trail once for the lookback window, load active waivers once, classify, then order by (ExpiredWaiver, OverdueRemediation, OverdueDeferral, UnansweredEvidenceRequest, ExpiringWaiver) and take MaxFindings.

5. Finding construction — this engine's whole value is decision consequence, so populate it:
   - FindingType = "OpenCommitmentFinding"
   - Severity: Error for expired waiver and overdue remediation; Warning for overdue deferral and unanswered evidence; Info for expiring waiver
   - Title names the commitment and the date, not generic advice
   - Rationale states what was committed, when, and what is now true
   - DecisionConsequence populated directly by the engine (approve / redesign / defer / accept risk) — do NOT rely on the LLM judge for this engine
   - Trace.RulesApplied includes the signal kind token
   - Add a payload DTO OpenCommitmentFindingPayload in ArchLucid.Contracts/Findings/Payloads/ carrying signal kind, source finding id, due/expiry UTC, and days overdue

6. Register: catalog row (OpenCommitmentFindingEngine -> "open-commitment") + AddScoped<Di.IEffectfulFindingEngine, ArchLucid.Application.Findings.OpenCommitmentFindingEngine>() in ServiceCollectionExtensions.Decisioning.cs. Configure the options section. Run the catalog guard test.

7. Tests:
   - ArchLucid.Application.Tests: OpenCommitmentClassifierTests covering every signal kind, boundary dates (exactly now, exactly at the warning threshold), latest-disposition-wins when a finding has multiple events, and Remediated suppressing OverdueRemediation.
   - ArchLucid.Application.Tests: engine tests with mocked repositories for disabled, empty trail, MaxFindings cap, and ordering.
   - No ConfigureAwait(false) in tests.

8. Add the engine row to docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md (Application effectful table) and document the options in docs/library/CONFIGURATION_REFERENCE.md.

Do not:
- Make this graph-pure or stamp disposition/waiver data onto GraphSnapshot or the ContextSnapshot node.
- Add an LLM call.
- Query across tenants. Everything is single-tenant scoped via IScopeContextProvider (ADR 0037).
- Mutate dispositions, waivers, or remediation assignments — this engine is read-only.
- Add SQL DDL. If you believe a new column or index is required, STOP and report it instead; repo policy keeps all DDL in the single per-database SQL file.

Compile check: dotnet build ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj
Test: dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~OpenCommitment"
Guard: dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~BuiltInFindingEngineTypeCatalog"

Done when: a tenant with an expired waiver and an overdue deferral gets Error/Warning findings naming the commitment and the date, with a populated decision consequence, and the catalog guard passes.
```

---

## ID-06 — Portfolio recurrence finding engine

**Closes:** cross-system insight. A frontier model reviews one design at a time by construction. "This anti-pattern is present in 7 of your 12 reviewed systems" is a portfolio observation no chat session can make.
**Depends on:** ID-05 merged (reuses the effectful scope pattern)
**Branch suggestion:** `insight-density/portfolio-recurrence-engine`

### Scope discipline

This is the riskiest prompt in the set because it reads across runs on every review. **Recurrence only.** Do *not* attempt "contradictory assumptions between systems sharing a dependency" in this prompt — that needs a dependency identity model that does not exist yet.

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: add an effectful finding engine that reports when the CURRENT review's findings recur across other systems in the same tenant's portfolio — turning a per-system finding into a portfolio-level observation.

Why: frontier AI reviews one architecture at a time. "This same policy violation is open in 7 of your 12 systems" is a systemic insight that changes a different decision (platform guardrail vs one-off fix). ArchLucid already walks runs across a tenant for sponsor ROI, so the read pattern exists.

STRICT SCOPE: recurrence counting only. Do NOT implement cross-system contradictory-assumption detection — there is no shared dependency identity model in the repo and inventing one is out of scope for this prompt.

Read first:
- ArchLucid.Application/Roi/SponsorRoiRunCollector.cs — especially CollectLatestCommittedRunPerSystemAsync: keyset paging via IRunDetailQueryService.ListRunSummariesKeysetAsync(cursor, take: 100, ct), the IsCommittedSummary filter, group-by-normalized-SystemName, newest CreatedUtc per system, and the page safety cap
- ArchLucid.Application/Roi/SponsorRoiFindingDeduplicator.cs
- ArchLucid.Application/IRunDetailQueryService.cs
- ArchLucid.Core/Persistence/Ports/IFindingsSnapshotRepository.cs (GetByIdAsync(scope, snapshotId))
- ArchLucid.Application/Findings/OpenCommitmentFindingEngine.cs (the effectful engine you just added — match its shape)
- ArchLucid.Decisioning/Findings/FindingSnapshotMergeKey.cs and ADR 0063 (the stable identity used for finding join keys)

Work:

1. Create ArchLucid.Application/Findings/PortfolioRecurrenceFindingEngine.cs implementing IEffectfulFindingEngine.
   EngineType = "portfolio-recurrence". Category = "Topology".
   Inject: IScopeContextProvider, IRunDetailQueryService, IFindingsSnapshotRepository, IOptions<PortfolioRecurrenceFindingOptions>, and a logger.

2. PortfolioRecurrenceFindingOptions (own file), SectionPath "ArchLucid:Findings:PortfolioRecurrence":
   - bool Enabled = false  <-- DEFAULT OFF. This engine does cross-run I/O on every review; it must be opt-in until measured.
   - int MinSystemCountToReport = 3
   - int MaxSystemsScanned = 50
   - int MaxFindings = 10

3. Identity for "the same finding across systems": reuse the ADR 0063 merge-key normalization (PolicyRuleId when present, else the normalized category|title fingerprint). Do NOT invent a second identity scheme — if the existing helper is not reachable from Application, report that rather than duplicating the hashing logic.

4. Algorithm:
   - Return empty when disabled.
   - Collect the latest committed run per system, capped at MaxSystemsScanned, using the SponsorRoiRunCollector pattern. Extract the shared paging/collection logic into a reusable component if that can be done without changing ROI behavior; otherwise duplicate minimally and add a comment pointing at the original.
   - Load each system's findings snapshot, dedupe per system by stable identity, and build identity -> distinct system count.
   - For each finding in the CURRENT graph's snapshot scope whose identity appears in >= MinSystemCountToReport systems, emit one recurrence finding.
   - Cap at MaxFindings, ordered by descending system count.

5. Finding construction:
   - FindingType = "PortfolioRecurrenceFinding"
   - Severity: Warning when the recurrence count is at or above MinSystemCountToReport, Error at or above 2x that threshold
   - Title states the count: e.g. "Recurs across N reviewed systems"
   - Rationale names the systems (respect any existing name-redaction convention; check how sponsor exports render system names before echoing them)
   - DecisionConsequence populated by the engine: recurrence at portfolio scale argues for a platform guardrail or policy pack rule rather than a per-system fix
   - Payload DTO PortfolioRecurrenceFindingPayload in ArchLucid.Contracts/Findings/Payloads/ with the identity token, system count, and scanned-system count

6. Register in the catalog and the effectful block; configure options; run the catalog guard test.

7. Tests in ArchLucid.Application.Tests with mocked IRunDetailQueryService / IFindingsSnapshotRepository:
   - disabled => empty, and assert NO repository calls were made (this is the cost guarantee)
   - below MinSystemCountToReport => empty
   - at and above threshold => finding with correct count
   - MaxSystemsScanned honored
   - MaxFindings honored and ordering correct
   - per-system dedupe prevents one system counting twice
   - No ConfigureAwait(false) in tests.

8. Add the engine to docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md and options to docs/library/CONFIGURATION_REFERENCE.md. State the default-off posture and why (cross-run I/O per review).

Do not:
- Read across tenants. Single-tenant scope only (ADR 0037).
- Default Enabled to true.
- Implement contradictory-assumption or shared-dependency analysis.
- Add SQL DDL, migrations, or OpenAPI changes.
- Change SponsorRoiRunCollector behavior or any ROI number.

Compile check: dotnet build ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj
Test: dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~PortfolioRecurrence"
Guard: dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~BuiltInFindingEngineTypeCatalog"

Done when: with the flag on and 5 systems sharing a violation, the current review reports portfolio recurrence with a platform-guardrail decision consequence; with the flag off, zero repository calls occur.
```

---

## ID-07 — Declaration premise-conflict engine

**Closes:** the "premise invalidation" class, graph-pure and cheap. Today `declaration-security-baseline` says *"public network access is enabled."* The higher-value finding is *"this review's stated premise is false — your declaration enables public access while a `SecurityBaseline` node on the same graph requires private-only."* Same data, no I/O, much larger decision impact, because it invalidates an assumption rather than adding a task.
**Depends on:** none
**Branch suggestion:** `insight-density/declaration-premise-conflict`

### Prompt (copy below)

```text
You are working in the ArchLucid repo. Goal: add a graph-pure finding engine that detects CONTRADICTIONS between ingested infrastructure declarations and the stated security/policy intent on the same graph.

Why: the existing declaration-security-baseline engine reports unsafe properties in isolation ("public network access enabled"). A far higher-density finding is a premise conflict: the operator's stated baseline or policy control requires X, and their own declaration says not-X. That invalidates a review assumption instead of adding a checklist item, and DeterministicInsightDensityGate already rewards conflict phrasing via HasFalsifiabilitySignal (the ConflictFindingPattern regex matches "conflicts with" / "contradicts" / "violates constraint").

Read first:
- ArchLucid.Decisioning/Services/DeclarationSecurityBaselineFindingEngine.cs (the sibling engine — match its structure)
- ArchLucid.Decisioning/Analysis/DeclarationSecurityBaselineClassifier.cs (which tf.*/ARM keys are already understood: tf.public_network_access, publicNetworkAccess, tf.allow_blob_public_access, allowBlobPublicAccess, tf.https_only, httpsOnly, tf.minimum_tls_version, tf.ssl_enforcement_enabled, tf.ingress, tf.network_rules)
- ArchLucid.KnowledgeGraph/WellKnownGraph.cs (GraphNodeTypes: TopologyResource, SecurityBaseline, PolicyControl; GraphEdgeTypes: PROTECTS, APPLIES_TO, CONTAINS)
- ArchLucid.KnowledgeGraph/Models/GraphSnapshotExtensions.cs (GetNodesByType, GetOutgoingTargets, GetIncomingSources)
- ArchLucid.Core/Findings/GenericArchitectureAdvicePatterns.cs (ConflictFindingPattern and HasFalsifiabilitySignal — phrase titles so they match)
- ArchLucid.Decisioning/Services/RequirementFindingEngine.cs (parameterless graph-pure engine exemplar)

Work:

1. Create ArchLucid.Decisioning/Analysis/DeclarationPremiseConflictClassifier.cs — pure static:

   public static IReadOnlyList<DeclarationPremiseConflictSignal> Classify(
       GraphNode topologyNode,
       IReadOnlyList<GraphNode> applicableIntentNodes)

   An "intent node" is a SecurityBaseline or PolicyControl node linked to the topology node by PROTECTS / APPLIES_TO, or (fallback) a graph-wide intent node when no narrow edge exists — mirror how the sibling engine and DefaultGraphEdgeInferer treat narrow vs broad applicability, and mark the signal's confidence accordingly (narrow edge = higher confidence).

   Detect at minimum these conflicts, matching declaration properties against intent text/properties:
   - Intent requires private-only or private endpoints while the declaration enables public network access or blob public access
   - Intent requires encryption in transit or HTTPS-only while the declaration disables https_only or sets a weak minimum TLS version
   - Intent requires restricted administrative ingress while the declaration exposes 0.0.0.0/0 on 22 or 3389
   Keep intent matching lexical and conservative — reuse the vocabulary already present in DeclarationSecurityBaselineClassifier rather than inventing a new intent grammar. Prefer a false negative over a false positive: a wrong premise-conflict claim is worse than a missed one, because it accuses the operator of contradicting themselves.

   Each signal carries: conflict kind token, the declaration property key and value, the intent node id and its quoted requirement text, and a confidence marker.

2. Create ArchLucid.Decisioning/Services/DeclarationPremiseConflictFindingEngine.cs implementing IFindingEngine (parameterless constructor so the catalog guard can activate it).
   EngineType = "declaration-premise-conflict". Category = "Security".
   Walk TopologyResource nodes, resolve applicable intent nodes, classify, emit findings.

3. Finding construction:
   - FindingType = "DeclarationPremiseConflictFinding"
   - Severity Error for a narrow-edge conflict, Warning for a graph-wide fallback conflict
   - Title MUST use conflict phrasing that ConflictFindingPattern matches (e.g. "<resource> declaration conflicts with <baseline> requirement") so the falsifiability bonus applies honestly
   - Rationale quotes BOTH sides: the declaration property key/value and the intent requirement text
   - RelatedNodeIds includes the topology node and the intent node
   - DecisionConsequence populated by the engine: the review premise is invalid until the operator corrects the declaration or amends the baseline
   - Trace.RulesApplied includes the conflict kind; Trace.GraphNodeIdsExamined includes both nodes
   - Payload DTO DeclarationPremiseConflictFindingPayload in ArchLucid.Contracts/Findings/Payloads/

4. Do NOT duplicate declaration-security-baseline output. When this engine reports a conflict for a property, it must be distinguishable from the sibling engine's standalone finding: different FindingType, different title shape. Note in an XML comment that ADR 0063 merge will keep both if their identities differ, and that this is intentional (one states the unsafe value, the other states the contradiction).

5. Register: catalog row + AddScoped<Di.IFindingEngine, Ds.DeclarationPremiseConflictFindingEngine>() in ServiceCollectionExtensions.Decisioning.cs. Run the catalog guard test.

6. Tests in ArchLucid.Decisioning.Tests:
   - classifier: each conflict kind, narrow vs broad applicability confidence, no intent node => no signal, intent satisfied => no signal, missing/blank properties => no signal
   - engine: emits Error on narrow edge, Warning on fallback, empty graph => empty, and the title matches GenericArchitectureAdvicePatterns.HasFalsifiabilitySignal
   - a case asserting the sibling declaration-security-baseline engine's output is unchanged

7. Add the engine to docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md (Decisioning graph-pure table) and add a short subsection to docs/library/CONTEXT_INGESTION.md explaining that tf.* properties now feed both a standalone security signal and a premise-conflict signal.

Do not:
- Perform any I/O. This engine is graph-pure — GraphSnapshot only.
- Add an LLM call or a NuGet package.
- Modify DeclarationSecurityBaselineClassifier's existing signals or the sibling engine's behavior.
- Raise KnowledgeGraphLimitsOptions or graph node caps.
- Claim a conflict on weak lexical evidence — bias toward false negatives.

Compile check: dotnet build ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj
Test: dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~DeclarationPremiseConflict|FullyQualifiedName~DeclarationSecurityBaseline"
Guard: dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~BuiltInFindingEngineTypeCatalog"

Done when: a graph with a private-only SecurityBaseline and a declaration enabling public access yields an Error premise-conflict finding quoting both sides, and no existing engine output changed.
```

---

## After running these

ID-01–07 have shipped. Re-run **ID-01**'s harness only as a regression check on a feature branch after ID-08/ID-10 — not as a reason to add another `GraphSnapshot`-only engine. Follow-on prompts: [`INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md).

## Related

- [`INGESTION_FIT_GAP_COMPOSER_PROMPTS.md`](INGESTION_FIT_GAP_COMPOSER_PROMPTS.md) — shipped predecessor set (ingestion breadth)
- [`../library/FINDING_ENGINE_OUTPUT_REFERENCE.md`](../library/FINDING_ENGINE_OUTPUT_REFERENCE.md) — engine catalog and registration contract
- [`../library/AGENT_EVAL_CORPUS.md`](../library/AGENT_EVAL_CORPUS.md) — eval corpus and quality gates
- [`../library/DECISIONING_GOLDEN_CORPUS.md`](../library/DECISIONING_GOLDEN_CORPUS.md) — golden corpus record/replay
- [`adrs/0062-finding-verification-loop.md`](adrs/0062-finding-verification-loop.md) — proof-of-prediction (held)
