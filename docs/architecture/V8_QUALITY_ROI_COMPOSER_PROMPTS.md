> **Scope:** Copy-paste Composer/Cursor prompts that raise **v8 assessment** weighted qualities at the best credit ROI. Internal engineering only — not buyer-facing copy.
> **Scores:** [`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) (v8, 2026-09-09) §2 / §8 / §17 · **Index:** [`.cursor/prompts/v8-quality-roi-00-index.md`](../../.cursor/prompts/v8-quality-roi-00-index.md)
> **Do not re-run:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md) (DX-73–DX-76 shipped `#2530`) · [`WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md`](WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md) (WK-01–WK-22 historical)

# v8 quality-ROI Composer prompts (QR-01–QR-05)

**Created:** 2026-09-09 · **Status:** ready to run (one prompt per chat). **DX-77 is not authorized.**

v8 scored **(A) 76.95%**. Insight density rose 66 → 70 after DX-01–DX-76 and is still the largest weighted deficiency — but the remaining lever is **proof** (G-REAL-06), not another engine pack. The cheapest score movement is **Correctness (72, deficiency 336)** plus the **Runtime (70)** that rides the same trunk fixes.

**Run one prompt per chat.** Feature branch per prompt (QR-01 + QR-02 may share one PR). Suggested Cloud Agent branch: `cursor/qr-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push to `master`.**

## Why this set, not DX-77

| Quality | v8 score | Deficiency | What credits buy here |
|---------|---------:|----------:|-----------------------|
| Correctness & Evidence Integrity | 72 | **336** | QR-01 compile, QR-02 required guard, QR-03 OpenAPI snapshot |
| Runtime & First-Review Reliability | 70 | 210 | Same three jobs green + QR-04 merge-queue wiring |
| Insight Density | 70 | 390 | QR-05 honest evidence refs on the largest corpus slice — **not** a new engine |
| Time-to-Value / Proof-of-ROI / AI | 73 / 76 / 76 | — | **Owner:** Gate 1 then G-REAL-06. No Composer prompt. |

Expected headline from QR-01–QR-03 alone: Correctness ~72 → ~80 and Runtime ~70 → ~75 (**~+1.3% (A)**) for one Composer afternoon. DX-01–DX-76 bought four density points over a full program.

## Do not re-run / do not start from this document

| Item | Why |
|------|-----|
| DX-01–DX-76 | Shipped. Do not add `EngineType`. Do not start DX-77. |
| WK-01–WK-22 | Historical (Gate 5, Dependabot, ruleset five contexts). Trunk defects below are **new**. |
| G-REAL-06 / G-REAL-07 / M-39 / Gate 1 | Owner + staging. Composer cannot fake a real-mode run. |
| Azure extractor first-review default | Owner must pick soft / hard / wizard + pilot scope first. |
| TB-883 Graph-RAG ablation | Budget cap TBD. |
| GTM **M-90 / M-44 / M-91 / M-92** | V1.1 human cohorts. |
| SOC 2 CPA (**G-REAL-05**) / third-party pen test (**G-ASSURANCE-02**) | Owner assurance; not `(A)`. |
| `DemotionThreshold` / `InsightDensityDemotionPredicate` | Stay at 65 / DX-01. |
| Desktop review **More** menu | Rejected. |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Qualities |
|--------|-------|-----------|------------|-----------|
| **QR-01** | Compile `Decisioning.Tests` (`DefaultGraphBuilder` 3-arg) | First | none | Correctness, Runtime, Density *proof* |
| **QR-02** | Align advisory-surface guard to `typed-engine-scored` | Same PR as QR-01 preferred | none | Correctness (required check) |
| **QR-03** | Triage OpenAPI v1 backward-compat snapshot | After QR-01 is green locally | QR-01 (full solution must compile) | Correctness |
| **QR-04** | `merge_group` trigger + ruleset draft | After QR-01+QR-02, or parallel with QR-03 | none for YAML | Runtime (process) |
| **QR-05** | `security-baseline` evidence refs | After push corset is green on `master` | QR-01 | Insight Density (honest scores) |

**Stop after QR-04 until the owner enables merge queue and runs Gate 1 / G-REAL-06.** Do not commission another density prompt pack.

---

## Global constraints (paste into every prompt if context drops)

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. One blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests**.
- Tenant isolation stays database-per-tenant catalogs (ADR 0037).
- **No new finding engine.** Do not add a 5th `AgentType`. Do not add a coverage engine.
- **No new NuGet packages** unless already in `Directory.Packages.props`.
- Do **not** regenerate OpenAPI unless the prompt is **QR-03** and the drift procedure says to.
- SQL: this set should not need SQL. If it does, numbered migration **and** the same DDL in `ArchLucid.Persistence/Scripts/ArchLucid.sql`.
- Stage only files this prompt changed. **No `git add -A`.** **Do not push `master`.**
- One scoped compile per prompt; one retry on exit code 1: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '…'`.
- Do not change `InsightDensityDemotionPredicate`. `DemotionThreshold` stays **65**.
- Do not restore `typed-engine-protected` as a Promote short-circuit (ADR 0070).
- Do not collapse desktop review workspace tabs behind **More**.

---

# QR-01 — Compile `ArchLucid.Decisioning.Tests` on trunk

**Closes:** v8 §8 weakness 1 / §17 item 1. Push corset red on `master` (runs 34361964714, 34376757704): `error CS7036` at `GoldenCorpusIngestDeclarationGraphFactory.cs(491,39)` — two-arg `DefaultGraphBuilder` vs AS-017 `#2563` three-arg ctor `(IGraphNodeFactory, IGraphEdgeInferer, StructuredDiagramGraphMerger)`.
**Depends on:** none
**Branch suggestion:** `cursor/qr-01-decisioning-tests-graph-builder-ctor`

### Design intent

Mechanical compile fix. **Zero product behavior change** if the merger is the same no-op path KnowledgeGraph tests already use. Do not “fix” by deleting golden cases or stubbing `BuildAsync`.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make ArchLucid.Decisioning.Tests compile against the current DefaultGraphBuilder constructor. Do not add EngineType. Do not change DefaultGraphBuilder. Do not re-record the insight-density distribution. Do not regenerate OpenAPI.

Why: AS-017 (#2563, 4e6ab618db) added StructuredDiagramGraphMerger to DefaultGraphBuilder. GoldenCorpusIngestDeclarationGraphFactory.cs:491 still calls new(NodeFactory, new DefaultGraphEdgeInferer()). Each PR was green alone; master cannot build Decisioning.Tests. The golden corpus (the only checked-in density evidence) cannot run from trunk. v8 Correctness 72 and Runtime 70.

Read first:
- ArchLucid.KnowledgeGraph/Builders/DefaultGraphBuilder.cs (three-arg primary ctor)
- ArchLucid.KnowledgeGraph.Tests/GraphMaterializationTestHelpers.cs (CreateStructuredDiagramGraphMerger + CreateDefaultGraphBuilder — copy the construction shape, do not take an InternalsVisibleTo dependency on the test assembly)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusIngestDeclarationGraphFactory.cs around line 491
- Grep the Decisioning.Tests project (and any other test project that fails the same CS7036) for: new DefaultGraphBuilder(  AND  new(NodeFactory, new DefaultGraphEdgeInferer())

Work:

1. Replace every two-arg DefaultGraphBuilder construction in ArchLucid.Decisioning.Tests with the three-arg form:
   new DefaultGraphBuilder(nodeFactory, edgeInferer, new StructuredDiagramGraphMerger(new ArchitectureDiagramToGraphCompiler()))
   Add the usings KnowledgeGraph.Tests already uses (ArchLucid.KnowledgeGraph.Diagram, Mapping, Materialization as needed). Prefer a private local helper in the factory file over duplicating `new StructuredDiagramGraphMerger(...)` if there is more than one call site in that file.

2. Do not change GraphMaterializationStages, ArchitectureDiagramToGraphCompiler, or production DefaultGraphBuilder.

3. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
   One retry on exit 1, same scope.

4. Test (do not set ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION):
   dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~GoldenCorpusMaterializerTests|FullyQualifiedName~InsightDensityEngineDistributionReportTests|FullyQualifiedName~GoldenCorpusIngest"

5. If the helper is reused, keep it in the factory file or a new file in GoldenCorpus/ — each class in its own file. No ConfigureAwait(false) in tests.

Do not: add EngineType; invent EvidenceRefs; raise DemotionThreshold; delete golden cases; push master; regenerate OpenAPI; hand-edit docs/quality/insight-density-engine-distribution.md.

Done when: Decisioning.Tests Release compile 0 errors; the three filters above green; distribution markdown unchanged.
```

**Done when:** `dotnet build ArchLucid.Decisioning.Tests -c Release` is 0 errors. Golden ingest / materializer tests green. Distribution markdown not rewritten.

---

# QR-02 — Align `check_insight_density_advisory_surfaces.py` with ADR 0070

**Closes:** v8 §8 weakness 3 / §17 item 2. Required context `CI: beta-readiness wiring guards` is red: `docs/quality/insight-density-engine-distribution.md: missing marker 'typed-engine-protected'`. DX-73 correctly re-recorded `typed-engine-scored`. The guard still demands the pre-ADR-0070 marker on seven surfaces.
**Depends on:** none (same PR as QR-01 preferred)
**Branch suggestion:** `cursor/qr-02-typed-engine-scored-guard` (or the QR-01 branch)

### Design intent

The guard must assert **current** gate telemetry (`typed-engine-scored`) and still keep advisory / claimBoundary honesty. Historical “superseded `typed-engine-protected`” sentences are allowed. Current-tense “always Promote because typed-engine-protected” is not.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make scripts/ci/check_insight_density_advisory_surfaces.py pass on current master docs after ADR 0070. Canonical production marker is typed-engine-scored. Do not restore the Promote short-circuit. Do not edit docs/quality/insight-density-engine-distribution.md table numbers. Do not regenerate OpenAPI.

Why: CI: beta-readiness wiring guards is a required status check and is red on master. The distribution markdown (InsightDensityEngineDistributionMarkdown.cs) correctly says typed-engine-scored. The Python guard still requires typed-engine-protected in _REQUIRED_MARKERS. v8 Correctness.

Read first:
- scripts/ci/check_insight_density_advisory_surfaces.py (_REQUIRED_MARKERS — seven paths)
- scripts/ci/tests/test_check_insight_density_advisory_surfaces.py
- ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionMarkdown.cs (ClaimBoundaryMarker / typed-engine-scored)
- docs/architecture/adrs/0070-insight-density-controls-typed-engines.md
- Each path in _REQUIRED_MARKERS: grep typed-engine-protected and typed-engine-scored

Work:

1. Change _REQUIRED_MARKERS so every listed surface must contain typed-engine-scored (keep complementary markers: claimBoundary:, advisory, filter cannot raise density, DemotionThreshold, measurement floor — do not drop those).

2. Update the listed surfaces that do not yet contain typed-engine-scored so the new guard passes. Allowed edit: one honest sentence that ADR 0070 scores typed-engine findings (telemetry typed-engine-scored) and the old Promote bypass is superseded. Do not claim G-REAL-06 proof. Do not delete historical “superseded typed-engine-protected” clauses.

   Surfaces known stale in current-tense protected-only copy (verify; do not blindly rewrite all seven):
   - docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md
   - docs/library/AGENT_EVAL_CORPUS.md
   - docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md (the “typed-engine-protected rows demoted…” sentence)
   - archlucid-ui/src/lib/quality/insight-density-measurement-floor.ts
   - docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md
   CONFIGURATION_REFERENCE.md and the distribution markdown already mention scored — leave table/numbers alone.

3. Negative check in the Python guard: if a listed production-claim surface contains a current-tense always-Promote / “never demote typed-engine” claim keyed on typed-engine-protected (not a “superseded” / “legacy” / “until ADR 0070” sentence), fail. Keep this regex tight so ADR 0070 and v8 assessment history still grep.

4. Extend scripts/ci/tests/test_check_insight_density_advisory_surfaces.py: keep test_guard_passes_on_repo. Add a test that a temp copy of the script’s marker list fails when typed-engine-scored is stripped from a fixture (or unittest.mock a missing marker). No ConfigureAwait(false).

5. Run:
   python3 scripts/ci/check_insight_density_advisory_surfaces.py
   python3 -m unittest discover -s scripts/ci/tests -p "test_check_insight_density_advisory_surfaces.py"

Do not: restore Promote bypass in DeterministicInsightDensityGate; change DemotionThreshold; add EngineType; push master; regenerate OpenAPI; rewrite LATEST_GPT55.md.

Done when: the Python guard exits 0 on the tree; unittest green; required-check job would pass this step.
```

**Done when:** `python3 scripts/ci/check_insight_density_advisory_surfaces.py` exits 0. Unit test green. Distribution table cells unchanged.

---

# QR-03 — Triage OpenAPI v1 backward-compat snapshot

**Closes:** v8 §8 weakness 4 / §17 item 3. `OpenApiContractSnapshotTests.OpenApi_v1_json_is_backward_compatible_with_committed_snapshot` FAIL on both completed `master` push-corset runs on 2026-09-09.
**Depends on:** QR-01 (solution must compile)
**Branch suggestion:** `cursor/qr-03-openapi-v1-snapshot`

### Design intent

Either an **unintentional breaking change** (fix the API) or an **intentional additive change** (re-snapshot per `OPENAPI_CONTRACT_DRIFT.md`). Regenerating the baseline without a deliberate API change is a process failure.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make OpenApiContractSnapshotTests.OpenApi_v1_json_is_backward_compatible_with_committed_snapshot pass for an honest reason. Follow docs/library/OPENAPI_CONTRACT_DRIFT.md. Do not invent a per-version OpenAPI document split (V1.1 design, out of scope).

Why: The push corset job ".NET: OpenAPI v1 contract snapshot (fail-fast)" is red on master (same SHA window as the Decisioning.Tests CS7036). v8 Correctness. Either a breaking wire change merged or the committed snapshot is stale.

Read first:
- docs/library/OPENAPI_CONTRACT_DRIFT.md (full procedure)
- scripts/ci/check_openapi_contract_snapshot.sh
- ArchLucid.Api.Tests tests matching OpenApiContractSnapshotTests / OpenApiBuyerContractSnapshotTests
- ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json (do not hand-edit JSON)
- docs/library/API_CONTRACTS.md changelog convention

Work:

1. Reproduce:
   bash scripts/ci/check_openapi_contract_snapshot.sh
   or: dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj --filter FullyQualifiedName~OpenApiContractSnapshotTests
   Capture the assertion/diff (CI uploads openapi-v1-generated-canonical — use that if local host generation is painful).

2. Classify every delta: additive (new path/schema/optional property) vs breaking (removed/renamed/required-field/type change).

3. Breaking: restore compatibility in ArchLucid.Api / contracts. Do not snapshot a break. Add or update a regression test that would have caught the break.

4. Additive only: regenerate with .\scripts\ci\update_openapi_contract_snapshot.ps1 (or the documented equivalent). Then:
   - dotnet test ArchLucid.Api.Tests --filter FullyQualifiedName~OpenApiContract
   - If the script/docs require it: dotnet build ArchLucid.Api.Client ; cd archlucid-ui && npm run generate:api-types
   - Add a one-line API_CONTRACTS.md changelog row for the intentional change
   - Commit snapshot + generated clients + doc row together

5. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'

Do not: split /openapi/v1.json into per-version docs; push master; change insight-density gate; silent snapshot refresh with an unexplained diff.

Done when: OpenAPI snapshot tests green; if the contract changed, API_CONTRACTS.md has a row and generated clients match.
```

**Done when:** OpenAPI snapshot job would be green. Breaking diffs are code-fixed, not snapshotted away.

---

# QR-04 — Merge-result gap: `merge_group` + ruleset draft

**Closes:** v8 §8 weakness 1 remainder / §17 item 4. Required checks run on the PR branch. `.NET: fast core (corset)` path-skips to success when `ci-path-lanes.outputs.run_dotnet != 'true'`. No `merge_queue` rule on `master`. AS-017 × DX golden factory is the exhibit.
**Depends on:** owner still must **apply** the ruleset in GitHub after this lands
**Branch suggestion:** `cursor/qr-04-merge-group-corset`

### Design intent

Agent half only: workflow + JSON + docs. Do not call the GitHub ruleset API. Do not require extra checks (OpenAPI, CodeQL, private-beta) beyond what `golden-cohort-gate-required-check.json` already lists.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: (a) run CI on merge_group so a merge-queue / merge-result SHA actually compiles .NET; (b) draft ruleset JSON + BRANCH_PROTECTION.md for the owner to enable merge queue. Do not apply the ruleset. Do not add required checks beyond the existing five in golden-cohort-gate-required-check.json.

Why: QR-01's CS7036 reached master because each PR compiled and the combination did not. ci.yml path-skips dotnet-fast-core-build when run_dotnet != true and still reports success — the required ".NET: fast core (corset)" context is satisfiable by a docs-only PR. Live /rules/branches/master has no merge_queue type. v8 Runtime.

Read first:
- .github/workflows/ci.yml `on:` block and dotnet-fast-core-build (around the Path-skip fast-core build step)
- .github/rulesets/golden-cohort-gate-required-check.json
- .github/BRANCH_PROTECTION.md (Live ruleset section)
- docs/assessments/LATEST_GPT55.md §17 item 4

Work:

1. Add merge_group: to ci.yml `on:` (branches main/master). Keep pull_request and workflow_dispatch.

2. For merge_group events, do not path-skip the .NET fast-core build/test: treat run_dotnet as true (or ignore ci-path-lanes skip). The required check name must remain exactly `.NET: fast core (corset)`.

3. Do not change ui-typecheck-on-push.yml job names. Push corset stays the push-only sibling.

4. Draft merge-queue guidance in .github/BRANCH_PROTECTION.md: owner enables GitHub merge queue on master/main with the same five required contexts as golden-cohort-gate-required-check.json. State clearly that JSON in-repo does not apply itself. Optional: add a commented or companion JSON snippet under .github/rulesets/ documenting merge_queue parameters GitHub expects — do not invent check names.

5. If ci-path-lanes is used on merge_group, document in a short comment why merge_group always builds .NET (semantic conflicts).

Do not: apply rulesets via gh api; require OpenAPI or CodeQL; cancel-in-progress in a way that drops merge_group runs; push master; change product code.

Done when: ci.yml triggers on merge_group; fast-core build runs unconditionally on that event; BRANCH_PROTECTION.md tells the owner the two-minute UI/ruleset apply; existing five check names unchanged.
```

**Done when:** `ci.yml` has `merge_group`. Fast-core does not path-skip on that event. Owner apply is documented, not executed.

---

# QR-05 — `security-baseline` evidence refs (or honest demotion)

**Closes:** v8 §8 weakness 9 / §17 item 7. Largest golden-corpus slice: 10 of 47 findings, all median **65**, `No evidence = 10`, `No anchor = 10`, surviving `WouldDemoteAt65Count = 0` only via the +5 severity bonus. Engine emits `RelatedNodeIds` and never `EvidenceRefs`.
**Depends on:** QR-01 (harness must compile). Run **after** the push corset is green so a re-record is meaningful.
**Branch suggestion:** `cursor/qr-05-security-baseline-evidence-refs`

### Design intent

Reuse `FindingEvidenceRefs` the way `DeclarationSecurityBaselineFindingEngine` already does (`TryCollectFromNodeProperties`, `graph-node:` from `RelatedNodeIds` if a helper exists). Do **not** invent ARM/ARNs. If a node has no resolvable citation, leave refs empty and let the gate demote — that is a valid outcome. Do not raise `DemotionThreshold`. Do not add `EngineType`.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: SecurityBaselineFindingEngine findings carry resolvable EvidenceRefs when the graph node (or PROTECTS targets) can cite a product-shaped graph-node / inventory / policy-rule / doc ref. If they cannot, leave EvidenceRefs empty so DeterministicInsightDensityGate may demote. Then re-record docs/quality/insight-density-engine-distribution.md. Do not add EngineType. Do not change DemotionThreshold (65). Do not invent resource ids.

Why: v8 insight density is still the largest deficiency. The remaining cheap lever inside the corpus is honesty: security-baseline is 10/47 findings at exactly 65 with no evidence and no anchor. RelatedNodeIds are set; EvidenceRefs are not. DeclarationSecurityBaselineFindingEngine already collects refs — copy that pattern.

Read first:
- ArchLucid.Decisioning/Services/SecurityBaselineFindingEngine.cs
- ArchLucid.Decisioning/Services/DeclarationSecurityBaselineFindingEngine.cs (TryCollectFromNodeProperties + TryAppendPolicyRuleId)
- ArchLucid.Decisioning/Services/SecurityBaselineCompletenessFindingEngine.cs (how a sibling sets EvidenceRefs)
- FindingEvidenceRefs helpers (TryCollectFromNodeProperties, TryAppendInventoryResourceId, graph-node helpers — grep ArchLucid.Core / Contracts)
- ArchLucid.Decisioning.Tests/SecurityBaselineFindingEngineTests.cs
- docs/quality/insight-density-engine-distribution.md row security-baseline
- InsightDensityEngineDistributionReportTests Record_distribution_markdown_when_env_flag_set (pass PriorGraphFixture)

Work:

1. On each emitted Finding, populate EvidenceRefs:
   - FindingEvidenceRefs.TryCollectFromNodeProperties on the SecurityBaseline node
   - Append a graph-node: ref for node.NodeId when the helper accepts it
   - For each PROTECTS target, collect from that node's properties the same way — do not invent ids
   - Do not add generic-advice titles. Keep existing Title/Rationale unless a test requires a one-line evidence mention.

2. Tests: existing SecurityBaselineFindingEngineTests plus cases:
   - node with product-shaped property → EvidenceRefs non-empty, gate would not apply no-concrete-evidence
   - node with only a label and no citAble property → EvidenceRefs empty (fail closed / demote), no invented ARM
   No ConfigureAwait(false).

3. Re-record distribution (after tests pass):
   ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION=1
   dotnet test ArchLucid.Decisioning.Tests --filter FullyQualifiedName~Record_distribution_markdown_when_env_flag_set
   Pass PriorGraphFixture as DX-73 does. Do not hand-edit cells. Update InsightDensityEngineDistributionMarkdownTests headers only if the generator changed them.

4. In the markdown header or a one-sentence strategy note: whether security-baseline median rose (evidence worked) or WouldDemoteAt65Count became non-zero (honest demotion). Either is a valid QR-05 outcome.

5. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'

Do not: add EngineType; raise threshold; restore typed-engine-protected; fake frontier transcripts; push master; regenerate OpenAPI unless a DTO actually changed (it should not).

Done when: engine tests green; distribution markdown regenerated; security-baseline row is either evidenced (No evidence = 0) or honestly demoting; numbers not typed by hand.
```

**Done when:** `security-baseline` row is evidenced **or** shows demotion. Table is generated, not typed.

---

## After this set

| Next | Who | Why not a Composer prompt |
|------|-----|---------------------------|
| Enable merge queue on `master` | Owner (two minutes in GitHub) | Ruleset apply |
| Gate 1 staging first review | Owner | Only UNKNOWN ship gate |
| G-REAL-06 two-pack compare (CIS-Azure vs SOC 2, same input) | Owner | Moves density *and* Proof-of-ROI |
| Azure extractor first-review default | Owner shape, then a later intake batch | Soft vs hard vs wizard unspecified |
| DX-77 | Nobody | Diminishing returns vs QR-01–QR-03 |

**Do not commission another typecheck or density-generation batch until QR-01–QR-03 are on `master` and the push corset is green.**
