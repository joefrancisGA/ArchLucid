> **Scope:** Copy-paste Composer/Cursor prompts that continue [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md) after **DX-01–DX-57**. Internal engineering only — not buyer-facing copy.
> **Predecessor:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) (**DX-01–DX-16** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (**DX-17–DX-28** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md) (**DX-29–DX-35** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md) (**DX-36–DX-41** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md) (**DX-42–DX-46** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md) (**DX-47–DX-50** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md) (**DX-51–DX-56** — do not re-run).
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Gate:** [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md) · **Hold:** [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)

# Insight density — excellence Composer prompt set (DX-58–DX-62)

**Created:** 2026-09-08 · **Status:** **DX-58–DX-62 shipped on `master` (2026-09-08).** Do **not** re-run. **DX-63–DX-72 shipped.** Next set: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md) (**DX-73–DX-76**).

DX-01–DX-50 closed engine, ingest, and citation holes. DX-51–DX-56 added fusion, the held-check ledger, portfolio shared-topology, the idle frontier harness, prose extraction, and verification priors. **DX-57** (`#2242`) turned `PreferHighNoveltyEngines` and `PreferHighVerificationEngines` on in Real mode with tenant opt-out, and gave `EnableInsightGenerator` the same opt-out the judge already had. Latest golden case is **`case-63`**. Harness registers **41** engines; catalog has **52**; **11** absent-with-reason.

This set does **not** add `EngineType`. It makes dismiss measurable, converts the DX-52 diagnosis into a second-pass numerator, packages DX-55's discarded assumptions, and bounds judge spend against remaining tenant budget. The only owner-gated prompt is **DX-59** (raise `DemotionThreshold` from 50 to 65).

**Run one prompt per chat.** Feature branch per prompt. Suggested Cloud Agent branch: `cursor/dx-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push to `master`.**

## Do not re-run

| Item | Why |
|------|-----|
| ID-01–ID-10, PP-01 map | Shipped |
| **DX-01–DX-50** | Gate, path/contradiction engines, InsightGenerator, ingest slices, goldens through `case-63`, citation tightening |
| **DX-51–DX-56** | Fusion, held-check ledger, portfolio shared-topology, frontier harness, prose extraction, verification priors |
| **DX-57** | Real-mode ranking-prior defaults (`#2242`) — not a prompt file; do not flip the host JSON defaults back to on |
| Coverage-only engines | Still forbidden. This set adds **zero** `EngineType`. |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Density effect |
|--------|-------|-----------|------------|----------------|
| **DX-58** | Gate penalty telemetry on the distribution report | First | DX-50 shipped | Precision (measurement prerequisite) |
| **DX-59** | Raise `DemotionThreshold` to 65 | After DX-58; **owner-gated** | DX-58 | Precision (dismiss actually fires) |
| **DX-60** | Held-check second pass after inventory upload | Yes with DX-58 | DX-52 shipped | **Generative** (second-pass numerator) |
| **DX-61** | Prose assumption register | Yes with DX-58 | DX-55 shipped | Packaging (Workstream 3) |
| **DX-62** | Judge remaining-budget cap shrink | Yes with DX-58 | DX-02, DX-57 | Cost (does not raise the numerator) |

**Start DX-58, DX-60, DX-61, and DX-62 now** (independent except DX-59). **Do not start DX-59** until DX-58's regenerated `docs/quality/insight-density-engine-distribution.md` shows a non-zero `WouldDemoteAt65Count` on the median-60 coverage engines and a zero (or near-zero) count on path/contradiction/inventory engines, **and** the owner has unparked it.

**Do not start from this document:** live extractor-as-default (product/GTM), fake named-model frontier transcripts, Graph-RAG buyer claims (ADR 0057 / **TB-883**), raising `MaxJudgedFindingsPerSnapshot` above 40 by default, `EnableProseAssumptionExtraction` default-on, `portfolio-shared-topology` default-on, SOC 2 CPA (**G-REAL-05**), third-party pen test (**G-ASSURANCE-02**), GTM cohorts **M-90 / M-44 / M-91 / M-92**, a 5th `AgentType` enum value, coverage engines parked on **G-REAL-06**. Do not re-copy DX-47's `CollectFromNodeIds` onto `topology-coverage` / `requirement-expectation` / `security-coverage` — those engines already call it; empty `EvidenceRefs` on golden graphs is why they score 60.

---

## Global constraints (paste into every prompt if context drops)

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. One blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests**.
- Tenant isolation stays database-per-tenant catalogs (ADR 0037). Effectful engines use `IScopeContextProvider`.
- **New finding engine checklist** — **this set must not add engines**. If a prompt forces you to, stop and ask.
- Payload DTOs live in `ArchLucid.Contracts/Findings/Payloads/` (prefer Contracts + `FindingPayloadRegistry`). There is **no** `ArchLucid.Decisioning.Findings.Payloads` namespace.
- **No new NuGet packages** unless already in `Directory.Packages.props`.
- Do **not** regenerate OpenAPI unless the prompt says the wire schema changes. If it does, follow [`../library/OPENAPI_CONTRACT_DRIFT.md`](../library/OPENAPI_CONTRACT_DRIFT.md).
- SQL: numbered migration **and** the same DDL in `ArchLucid.Persistence/Scripts/ArchLucid.sql` plus rollback under `Migrations/Rollback/` when a peer exists.
- Stage only files this prompt changed. **No `git add -A`.** **Do not push `master`.**
- One scoped compile per prompt; one retry on exit code 1: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '…'`.
- R5: missing properties / missing inventory → no finding (or explicit `NotVerifiable`), never invent a resource.
- Do not add engines that only emit “node type X is missing from GraphSnapshot.”
- Do not change `DeterministicInsightDensityGate` demotion **predicate** (DX-01 already shipped). **DX-59** is the only prompt allowed to change `DemotionThreshold`.
- Do not auto-Promote from `DidNotThinkOfThat`. Do not write novelty rates into buyer-polished copy or the golden distribution markdown.
- Golden cases: start after **`case-63`**. Read `GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber` at the start of any golden prompt.
- Do not turn `EnableProseAssumptionExtraction` **on by default**. DX-57 already made ranking priors and the insight generator effective-on in Real mode — do not undo that and do not extend it to prose extraction.

---

# DX-58 — Gate penalty telemetry on the distribution report

**Closes:** Strategy Workstream 2 remainder after DX-50 — “dismiss bite” cannot be tuned because the scorer's reasons are thrown away. `DeterministicInsightDensityGate.Score` already fills `InsightDensityGateResult.PenaltyReasons` (`generic-advice`, `no-concrete-evidence`, `no-architecture-anchor`, `high-duplication`, `moderate-duplication`, `falsifiability-signal`, `severity-calibration`, `typed-engine-scored`). `InsightDensityEngineDistributionCalculator` re-scores every finding, keeps only the integer, and writes min/median/max. `docs/quality/insight-density-engine-distribution.md` on the current `case-63` slice reports **`WouldDemoteIfUnprotectedCount` = 0** on every row and **min = median = max** on 24 of 39 engines. `DemotionThreshold` is **50**; the lowest median is **60** (`100 − 25` no-evidence `− 15` no-anchor). That is why dismiss never fires. Without per-penalty counts, raising the threshold (DX-59) is guesswork.
**Depends on:** DX-50 shipped (`HasConcreteEvidenceCitation` already product-shaped)
**Branch suggestion:** `cursor/dx-58-gate-penalty-telemetry`

### Design intent

Measurement only. No new engine. No OpenAPI. Do **not** copy `PenaltyReasons` onto `Finding` (that regenerates the contract snapshot for an operator-internal signal). Keep the reasons on the calculator row and the markdown. Add an advisory `WouldDemoteAt65Count` column that applies the **existing** demotion predicate with threshold **65** and does **not** change production `DemotionThreshold` (still 50). Fix the stale XML comment on `WouldDemoteIfUnprotectedCount` that still says typed-engine-protected findings are never demoted — ADR 0070 / DX-01 already demote them.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: persist DeterministicInsightDensityGate penalty reasons into the golden engine-distribution calculator and markdown, plus an advisory WouldDemoteAt65Count column. Do not change DemotionThreshold. Do not change the demotion predicate. Do not add EngineType. Do not put PenaltyReasons on Finding (no OpenAPI).

Why: The current distribution table cannot explain why every median is 60 or 85. Score 60 is 100 − 25 (no-concrete-evidence) − 15 (no-architecture-anchor). Score 85 rows are the inventory/path engines that already have product-shaped EvidenceRefs. WouldDemoteIfUnprotectedCount is 0 everywhere because threshold 50 never bites a 60. DX-59 will propose raising the threshold to 65; it must not ship until this report shows coverage engines would demote at 65 and path/contradiction/inventory engines would not.

Read first:
- ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs (penaltyReasons.Add strings — treat those literals as the closed vocabulary)
- ArchLucid.Core/Findings/InsightDensityGateResult.cs
- ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionCalculator.cs (throws PenaltyReasons away today)
- ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionRow.cs
- ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionMarkdown.cs
- ArchLucid.Decisioning.Tests/Findings/InsightDensityEngineDistributionCalculatorTests.cs
- ArchLucid.Decisioning.Tests/Findings/InsightDensityEngineDistributionMarkdownTests.cs (header snapshot strings — you will update them)
- ArchLucid.Decisioning.Tests/GoldenCorpus/InsightDensityEngineDistributionReportTests.cs (record mode writes docs/quality/insight-density-engine-distribution.md)
- ArchLucid.Core/Findings/FindingInsightDensityGateApplicator.cs (do not add PenaltyReasons onto Finding here)
- docs/quality/insight-density-engine-distribution.md
- docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md (catalog count still says 51 in one sentence — catalog is 52; fix that sentence if you touch the file)

Work:

1. Extend InsightDensityEngineDistributionRow (own properties, concrete ints, default 0):
   - GenericAdviceCount
   - NoConcreteEvidenceCount
   - NoArchitectureAnchorCount
   - DuplicationCount (high-duplication + moderate-duplication combined — one column is enough)
   - WouldDemoteAt65Count
   Keep WouldDemoteIfUnprotectedCount. Rewrite its XML comment: it is the production predicate at the live DemotionThreshold, including typed-engine findings (ADR 0070). Delete the sentence that says typed-engine-protected findings are never demoted.

2. Calculator: when Score returns, increment the matching count if PenaltyReasons contains that token (Ordinal). WouldDemoteAt65Count: evaluate the SAME predicate as DeterministicInsightDensityGate (score < 65 || genericWithoutEvidence || falsifiableWithoutEvidence) && !hasConcreteEvidence. Do not fork a second gate class — extract a static helper next to the gate (own file InsightDensityDemotionPredicate.cs) that both the gate and the calculator call, so DX-59 cannot drift. The helper takes (score, threshold, isGenericAdvice, hasFalsifiabilitySignal, hasConcreteEvidence) and returns bool. Then DeterministicInsightDensityGate.Score uses it. This is a refactor of one boolean, not a predicate change — existing gate tests must still pass without expectation edits.

3. Markdown: add columns after Would demote if unprotected:
   | Generic advice | No evidence | No anchor | Duplication | Would demote at 65 |
   claimBoundary sentence: WouldDemoteAt65Count is advisory measurement for a possible threshold change; production DemotionThreshold remains 50 until DX-59. Do not mention named models, SOC 2, or novelty rates.

4. Record the distribution markdown (follow the existing record-mode test / script — do not hand-edit numbers). Header tests in InsightDensityEngineDistributionMarkdownTests will need their verbatim expected strings updated in the same PR.

5. Tests (concrete types, null checks, no ConfigureAwait(false)):
   - A finding with empty EvidenceRefs and a non-generic architecture-anchored title → NoConcreteEvidenceCount 1, WouldDemoteAt65Count 1, WouldDemoteIfUnprotectedCount 0 at threshold 50
   - A finding with a product-shaped ARM EvidenceRef → NoConcreteEvidenceCount 0, WouldDemoteAt65Count 0
   - Generic-advice + no evidence → GenericAdviceCount 1 and both would-demote counts 1 (predicate already demotes generic-without-evidence regardless of threshold)
   - Gate tests: existing DeterministicInsightDensityGateTests still pass after the helper extract
   - Markdown tests: new columns present; claimBoundary substring asserted

6. Docs: INSIGHT_DENSITY_MISS_CLAUSE.md catalog arithmetic 51 → 52 (11 absent + 41 registered) if you touch that file. CONFIGURATION_REFERENCE.md DemotionThreshold row stays 50.

Do not: change DemotionThreshold; change the predicate shape; add PenaltyReasons to Finding / ArchitectureFinding / OpenAPI; write novelty rates into the markdown; add EngineType; push master; invent ARM ids so coverage engines stop counting as no-evidence.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityEngineDistribution|FullyQualifiedName~DeterministicInsightDensityGate"
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~DeterministicInsightDensityGate"

Done when: the regenerated distribution markdown has per-penalty counts; WouldDemoteAt65Count is > 0 on median-60 coverage engines and 0 on inventory/path engines that already have product-shaped EvidenceRefs; production threshold is still 50; OpenAPI snapshot is untouched.
```

---

# DX-59 — Raise `DemotionThreshold` to 65 (owner-gated)

**Closes:** Strategy Workstream 2 “redesign category protection / make dismiss bite” after DX-01 + DX-50 + DX-58. Production demotion is `(score < DemotionThreshold || genericWithoutEvidence || falsifiableWithoutEvidence) && !hasConcreteEvidence`. Threshold **50** never meets `score < 50` on the current corpus (lowest median **60**). Raising to **65** demotes the coverage mass (`topology-coverage`, `requirement-expectation`, `security-baseline-*`, `security-coverage`, `compliance`, `cost-constraint` — score 60, no concrete evidence) and leaves path/contradiction/inventory rows (75–85, product-shaped ARM/ARN) as Decision-grade. That is the precision change the pillar requires: do not credit articulate-but-generic coverage rows.
**Depends on:** DX-58 shipped (penalty telemetry + `WouldDemoteAt65Count` column must already exist on `master`)
**Branch suggestion:** `cursor/dx-59-demotion-threshold-65`

### Design intent

One integer. Same predicate. Same `InsightDensityDemotionPredicate` helper DX-58 extracted. Update `InsightDensityGateOptions.DemotionThreshold` default from 50 to 65, `CONFIGURATION_REFERENCE.md`, XML comments, and golden expected classifications that flip from `DecisionGradeFinding` to `ChecklistCoverage`. Do **not** retune phrase lists. Do **not** add category vetoes (DX-01 removed them). Rows stay on the package.

### Owner unpark (required)

Paste this and **wait**. Do not implement until the owner answers `ok` / `yes` or “unpark DX-59”.

```text
DX-59 raises DemotionThreshold from 50 to 65. Coverage-shaped golden rows that today ship as Decision-grade will become ChecklistCoverage. Path, contradiction, and inventory rows with product-shaped EvidenceRefs stay Decision-grade. Reply yes / ok to unpark DX-59 for this request only.
```

### Prompt (copy below) — run only after unpark + DX-58 on master

```text
OWNER-GATED — stop if the owner has not unparked DX-59, or if DX-58 has not merged (docs/quality/insight-density-engine-distribution.md must already contain the Would demote at 65 column). You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: change InsightDensityGateOptions.DemotionThreshold default from 50 to 65. Do not change the demotion predicate. Do not add EngineType. Do not retune GenericArchitectureAdvicePatterns.

Why: WouldDemoteIfUnprotectedCount is 0 on the current slice because score 60 is not < 50. The DX-58 advisory column already computed the 65 split. This prompt makes that split production.

Read first:
- ArchLucid.Core/Findings/InsightDensityGateOptions.cs (DemotionThreshold = 50)
- ArchLucid.Core/Findings/InsightDensityDemotionPredicate.cs (DX-58 helper — call it; do not inline a new boolean)
- ArchLucid.Core.Tests/Findings/DeterministicInsightDensityGateTests.cs
- ArchLucid.Application.Tests/Tenancy/TenantFindingEngineControlsServiceTests.cs (asserts effective.DemotionThreshold.Should().Be(50) — update)
- ArchLucid.Application.Tests/Configuration/InsightDensityGateOptionsTests.cs if it asserts 50
- docs/library/CONFIGURATION_REFERENCE.md DemotionThreshold row
- docs/architecture/adrs/0070-insight-density-controls-typed-engines.md (mention the default is now 65; do not rewrite the predicate)
- Golden expected findings JSON under tests/golden-corpus (or wherever Decisioning goldens live — follow InsightDensityEngineDistributionReportTests / GoldenCorpusRepoPaths). Only update Classification on rows that the gate now demotes. Do not rewrite scores by hand; re-record.

Work:

1. DemotionThreshold default = 65. XML comment: 65 sits between coverage-shaped golden medians (60) and path/contradiction medians (75–85) measured on case-01..case-63 after DX-50. Host JSON override still wins.

2. CONFIGURATION_REFERENCE.md: change the default cell to 65. One sentence: coverage-shaped rows without resolvable package evidence classify as ChecklistCoverage; path/contradiction/inventory rows with product-shaped ARM/ARN/doc:/policy-rule: citations stay Decision-grade. claimBoundary: this is classification, not deletion; not a named-model beat; not SOC 2 Type II.

3. Re-record golden expected files and docs/quality/insight-density-engine-distribution.md. WouldDemoteIfUnprotectedCount must now be > 0 on topology-coverage / requirement-expectation / security-coverage (and peers at median 60). Inventory reconciliation / secrets-lifecycle / identity-blast-radius must stay 0 (they have concrete evidence, so the predicate's && !hasConcreteEvidence clause still protects them even when score < 65 — verify that in a unit test, do not assume).

4. Tests:
   - Default options.DemotionThreshold is 65
   - Empty EvidenceRefs + architecture-anchored non-generic title + score 60 → ChecklistCoverage at 65, DecisionGradeFinding if a test constructs options at 50
   - Product-shaped ARM EvidenceRef → DecisionGradeFinding at 65
   - TenantFindingEngineControlsServiceTests effective.DemotionThreshold assertion
   - Golden corpus: do not add cases; re-record classifications only

5. Do not change InsightDensityAgentCategoryRules. Do not add a category veto. Do not raise MaxJudgedFindingsPerSnapshot. Do not default EnableProseAssumptionExtraction on.

Do not: change the predicate helper's boolean; delete findings; invent evidence so coverage rows keep Decision-grade; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~DeterministicInsightDensityGate|FullyQualifiedName~InsightDensityGateOptions"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityEngineDistribution|FullyQualifiedName~GoldenCorpus"
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~TenantFindingEngineControls|FullyQualifiedName~InsightDensityGateOptions"

Done when: default threshold is 65; coverage-shaped goldens classify as ChecklistCoverage; inventory/path goldens with product-shaped refs stay Decision-grade; CONFIGURATION_REFERENCE.md matches; predicate helper is unchanged.
```

---

# DX-60 — Held-check second pass after inventory upload

**Closes:** Strategy Workstream 3 “Finalize stamp / measurement floor” remainder after DX-52. The held-check ledger ranks which missing input unblocks the most silent engines (“Uploading Azure inventory would unblock 7 engines”). Uploading that ZIP today stores the package (`AzureExtractorUploadController` / `CloudInventoryExtractorUploadController` → `IAzureExtractorPackageRepository` / `ICloudInventoryExtractorPackageRepository`) and does **not** regenerate findings. The diagnosis never becomes a numerator.
**Depends on:** DX-52 shipped
**Branch suggestion:** `cursor/dx-60-held-check-second-pass`

### Design intent

Adoption, not a new engine. After a successful inventory-package ingest that is bound to a `runId`, enqueue (or synchronously invoke, if the existing authority pipeline already has a “regenerate findings for this run” port) a findings snapshot rebuild on that run. The rebuild is the normal `FindingsOrchestrator` path — engines that previously `return []` + `HeldCheckLedger.TryRecord` will now analyze. Compare the previous sealed snapshot to the new one and surface a compact delta: held engines that produced ≥1 finding, count of new Decision-grade findings from those engines, InputCode that triggered the pass. Do **not** emit “inventory missing” findings. Do **not** restrict the rebuild to a subset of engines unless an existing allow-list port already exists — full snapshot rebuild is simpler and stays consistent with merge/gate/fusion stages. Fail closed when `runId` is absent (package stored, no second pass). Simulator: ingest still stores the ZIP; skip any Premium stages the orchestrator already skips.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: after a successful Azure or AWS/GCP inventory ZIP ingest that includes a runId, regenerate that run's findings snapshot and present a delta of engines that DX-52 had marked held for that cloud's HeldCheckInputCode. Do not add EngineType. Do not emit findings for missing inputs. Do not change DeterministicInsightDensityGate.

Why: DX-52 converted silence into “upload X to unblock N engines.” The upload endpoints already persist the ZIP against the run. Nothing re-enters FindingsOrchestrator, so the second-pass numerator never appears.

Read first:
- ArchLucid.Api/Controllers/Authority/AzureExtractorUploadController.cs (and Upload.cs partial)
- ArchLucid.Api/Controllers/Authority/CloudInventoryExtractorUploadController.cs
- ArchLucid.Application/CloudInventoryExtractor/CloudInventoryExtractorIngestService.cs (IngestZipAsync runId)
- ArchLucid.Application/AzureExtractor/ (the ingest service the Azure controller calls — find the successful-commit path)
- ArchLucid.Core/Findings/HeldCheckLedger.cs / HeldCheckInputCode
- ArchLucid.Decisioning/Services/FindingsOrchestrator.cs
- How a run already rebuilds findings today (search GenerateFindingsSnapshotAsync callers in Application / Host — reuse that port; do not add a second orchestrator)
- FindingsSnapshot merge/seal path so a second snapshot does not unseal the first illegally (ADR on sealed records — fail closed / append a new snapshot rather than mutate a sealed one; read the existing “new snapshot for same run” pattern if any)
- archlucid-ui measurement-floor strip and RunDetailReviewPackageDoThisNextResolved.tsx (DX-52 already shows the unblock clause)
- docs/library/OPENAPI_CONTRACT_DRIFT.md (only if you add a DTO)

Work:

1. Trigger: on ingest success with a non-empty runId, call an Application service IHeldCheckSecondPassService.TryRunAsync(scope, runId, inputCode, ct). Map Azure ingest → AzureInventoryZip, AWS → AwsInventoryZip, GCP → GcpInventoryZip. If runId is null, return a no-op result (package stored, no rebuild) — do not throw.

2. Rebuild: reuse the existing findings-generation port for that run (same graph snapshot + analysis context the run already used). Do not re-ingest IaC. Do not start a new review. If the run is sealed in a way that forbids a new findings snapshot, fail closed with a structured result (SecondPassStatus = NotEligible) rather than unsealing. XML-comment the seal rule you found.

3. Delta (own types in Contracts, each class its own file):
   HeldCheckSecondPassResult: InputCode, PreviousSnapshotId, NewSnapshotId, UnblockedEngineTypes (engines that recorded this InputCode on the previous pass and emitted ≥1 finding on the new pass), NewDecisionGradeCount, Status (Completed | NotEligible | NoPriorLedger | NoNewFindings)
   Compute UnblockedEngineTypes from the previous snapshot's held-check rollup (InsightDensityCurationSummary.HeldCheckLedgerEntries already ships on the snapshot) intersected with EngineTypes that have findings on the new snapshot. Do not parse logs.

4. Operator surface: extend the existing measurement-floor / “do this next” strip with one sentence when Status == Completed and NewDecisionGradeCount ≥ 1: “Re-ran after Azure inventory ZIP: {n} previously held engines produced findings.” Reuse HeldCheckInputCodeLabels. Advisory only. Keep the insight-density advisory markers that check_insight_density_advisory_surfaces.py asserts.

5. If the delta DTO is returned on an existing run-detail endpoint, regenerate OpenAPI per OPENAPI_CONTRACT_DRIFT.md. If you can hang it only on the ingest response without a new route, prefer that and still update the snapshot if the ingest contract gains a field.

6. Tests:
   - Ingest without runId → package saved, TryRunAsync not called (or called and no-ops)
   - Ingest with runId, previous ledger recorded AzureInventoryZip for secrets-lifecycle and orphaned-azure-resource, new snapshot has a secrets-lifecycle finding → UnblockedEngineTypes contains secrets-lifecycle, NewDecisionGradeCount ≥ 1 when that finding is Decision-grade
   - Previous ledger empty → Status NoPriorLedger, no exception
   - Sealed-ineligible run → Status NotEligible, previous snapshot unchanged
   - AWS/GCP ingest maps to AwsInventoryZip / GcpInventoryZip (one test each or a Theory over the enum)
   - Golden corpus unchanged (no ingest in harness)

7. claimBoundary: second pass is not live cloud polling; it re-reads the ZIP the customer just uploaded. Not a named-model beat. Not SOC 2 Type II.

Do not: add EngineType; emit “inventory missing” findings; default EnableProseAssumptionExtraction on; unseal records; push master; call paid Premium paths from Simulator ingest.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Test:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~HeldCheckSecondPass|FullyQualifiedName~AzureExtractor|FullyQualifiedName~CloudInventoryExtractorIngest"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityMeasurementFloor|FullyQualifiedName~HeldCheck"

Done when: a successful inventory upload bound to a run regenerates findings and the operator strip names how many previously held engines fired; missing runId stays a quiet store; sealed runs fail closed.
```

---

# DX-61 — Prose assumption register

**Closes:** Strategy Workstream 1B remainder after DX-55. `PremiumProseAssumptionFindingGenerator` extracts grounded `ProseAssumptionCandidate` rows, then `ProseAssumptionContradictionService` emits `declaration-premise-conflict` findings only when inventory/graph contradicts a mapped logical property. Unmapped prose and mapped-but-consistent assumptions are discarded. A reviewer cannot see “the design doc said X; we could not contradict it.” That register is packaging (Workstream 3), not a coverage engine.
**Depends on:** DX-55 shipped. Also: `FindingsOrchestrator` on `master` at the time of DX-55/`#2232` registered `IFindingsProseAssumptionStage` in DI but did **not** call it. If that wiring is still missing when this prompt runs, include it (see work item 0).
**Branch suggestion:** `cursor/dx-61-prose-assumption-register`

### Design intent

No new `EngineType`. No 5th `AgentType`. Persist grounded candidates that did not become contradiction findings, with a closed status: `Contradicted` (already a finding on the snapshot — include FindingId), `Consistent` (mapped logical property, inventory/graph agrees), `NotVerifiable` (unmapped, or mapped but inventory/property absent — R5). Attach `doc:path#L` evidence refs. Cap the register at `MaxProseAssumptionCandidatesPerSnapshot`. Flag stays **off** by default. Simulator still short-circuits. Do not Promote unmapped prose.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: keep grounded DX-55 prose assumption candidates that did not become contradiction findings, and surface them as a cited register (contradicted / consistent / not verifiable). Default EnableProseAssumptionExtraction stays false. No new EngineType. No 5th AgentType. Do not change DeterministicInsightDensityGate.

Why: Extraction already spends the Premium tokens (when the flag is on). Throwing away unmapped or consistent assumptions wastes the only information source a chat session cannot see — the in-batch design doc — without a Decision-grade claim the gate should not honor.

Read first:
- ArchLucid.AgentRuntime/PremiumProseAssumptionFindingGenerator.cs (groundedCandidates → EmitContradictionsAsync; nothing kept)
- ArchLucid.Core/Findings/ProseAssumptionCandidate.cs
- ArchLucid.Application/Findings/ProseAssumption/ProseAssumptionContradictionService.cs
- ArchLucid.Application/Findings/ProseAssumption/ProseAssumptionContradictionPass.cs
- ArchLucid.Decisioning/Services/FindingsOrchestrator.cs — if IFindingsProseAssumptionStage is not a constructor parameter, that is a DX-55 wiring hole: add it after IFindingsInsightGeneratorStage and before IFindingsMergeAndGateStage, thread it through FindingsOrchestratorComposer (optional generator, default NoOpProseAssumptionFindingGenerator.Instance), and add FindingsOrchestratorProseAssumptionStageTests that fail if the stage is dropped. Do this before the register.
- ArchLucid.Contracts/Findings/InsightDensityCurationSummary.cs (held-check rollup already hangs here — same place for the register, or a sibling on FindingsSnapshot if that is how held-check shipped)
- GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation (doc:…#L already counts)
- docs/library/OPENAPI_CONTRACT_DRIFT.md if the snapshot DTO gains a collection

Work:

0. Orchestrator wiring (only if still missing): see Read first. Tests: generator invoked once; a stub finding reaches snapshot.Findings and has InsightDensityScore > 0 (stage ran before the gate).

1. Closed status enum ProseAssumptionDisposition in ArchLucid.Contracts/Findings/ (own file): Contradicted, Consistent, NotVerifiable. Exhaustive switch in any mapper. No Unknown.

2. Register row DTO ProseAssumptionRegisterEntry (own file): Statement, DocumentPath, LineNumber, EvidenceRef, LogicalPropertyName (nullable), Disposition, FindingId (nullable, required when Contradicted). Cap = MaxProseAssumptionCandidatesPerSnapshot.

3. Contradiction service: return findings AND the register (own result type ProseAssumptionContradictionOutcome). Mapped + contradicting inventory → finding + Contradicted row. Mapped + matching inventory → Consistent, no finding. Mapped + missing inventory/property → NotVerifiable, no finding (R5). Unmapped grounded candidate → NotVerifiable, no finding. Ungrounded candidates never enter the register (faithfulness already dropped them).

4. Hang the register on the snapshot the same way HeldCheckLedgerEntries hang on InsightDensityCurationSummary (or FindingsSnapshot). Prefer that existing bag over a new top-level OpenAPI resource. If the snapshot schema changes, regenerate OpenAPI.

5. UI: compact advisory list on the existing measurement-floor / review-package strip — statement truncated, disposition noun, link to doc: citation if the desk already knows how to open EvidenceRefs. Do not style Contradicted rows as a second findings table (those already appear as declaration-premise-conflict). Keep advisory markers for check_insight_density_advisory_surfaces.py.

6. Tests:
   - Simulator + flag true → empty findings AND empty register
   - Flag false in Real → empty
   - “must not be public” + inventory public → one finding AND one Contradicted register row with that FindingId
   - “must not be public” + inventory already Disabled → zero findings, one Consistent row, doc: EvidenceRef present
   - Unmapped sentence with a grounded span → zero findings, one NotVerifiable row
   - Faithfulness reject → neither finding nor register row
   - Orchestrator wiring tests if you had to add them in step 0

7. claimBoundary: opt-in Real-mode; register is not Decision-grade; not a named-model beat; not SOC 2 Type II.

Do not: default the flag on; emit unmapped prose as Decision-grade; skip faithfulness; add AgentType; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~ProseAssumption"
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~ProseAssumption"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~ProseAssumption|FullyQualifiedName~FindingsOrchestratorProseAssumption"

Done when: grounded non-contradicted assumptions appear on the snapshot register with a closed disposition; contradicted ones still emit via declaration-premise-conflict; default off; Simulator silent; orchestrator actually calls the stage.
```

---

# DX-62 — Judge remaining-budget cap shrink

**Closes:** Strategy “raise `MaxJudgedFindingsPerSnapshot` beyond 12 under tenant LLM budget.” That number is already **40** (`InsightDensityGateOptions` / `CONFIGURATION_REFERENCE.md`). Raising the default further is the wrong move: skip-by-cap telemetry exists (`ArchLucidInstrumentation.InsightDensityJudgeSkippedByCapTotal`, measurement-floor `JudgeSkippedByCap`), and `AiBudgetPreCallGuard` is the hard USD cap inside the completion chain. What is missing is **pre-flight shrinking** of the 40 so a tenant near the monthly ceiling does not start 40 Premium judge completions and then fail mid-loop. This is cost/reliability, not numerator growth.
**Depends on:** DX-02 (judge), DX-57 (Real-mode ranking priors — do not undo)
**Branch suggestion:** `cursor/dx-62-judge-remaining-budget-cap`

### Design intent

No new engine. Do **not** change the host default of 40. Do **not** auto-raise the cap. In `PremiumInsightDensityLlmJudge`, before selecting candidates, read remaining UTC-month USD via the same `ITenantAiBudgetPolicyResolver` that `ArchitectureIntelligenceReviewTierBudgetGuard` uses. Estimate one Premium judge completion with `ILlmCostEstimator` (or a small dedicated estimator if the judge path already has token accounting — reuse, do not add a NuGet). Effective cap = min(configured MaxJudgedFindingsPerSnapshot, max(0, floor(remainingUsd / estimatedCostPerJudgment))). When budget services are unavailable, keep the configured cap (same fail-open as the reasoning-tier guard — XML-comment why). Simulator never judges. Record the shrunk cap in skip-by-cap / measurement-floor notes (“judge cap reduced from 40 to 6 because $Y remains this month”) so operators are not surprised.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: shrink MaxJudgedFindingsPerSnapshot at judge time from remaining tenant UTC-month AI budget so the Premium loop does not start more completions than remaining USD can pay for. Do not raise the default 40. Do not add EngineType. Do not change DeterministicInsightDensityGate.

Why: Strategy text still says “raise the cap beyond 12”; production is already 40. The remaining hole is overspend at the end of a month, not headroom.

Read first:
- ArchLucid.Core/Findings/InsightDensityGateOptions.cs (MaxJudgedFindingsPerSnapshot = 40)
- ArchLucid.AgentRuntime/PremiumInsightDensityLlmJudge.cs
- ArchLucid.AgentRuntime/InsightDensityJudgeCandidateSelector.cs
- ArchLucid.Application/ArchitectureIntelligence/ArchitectureIntelligenceReviewTierBudgetGuard.cs (fail-open when budget services are null; remaining USD)
- ArchLucid.Application/Budgeting/LlmMonthlyTenantDollarBudgetStatusService.cs
- ITenantAiBudgetPolicyResolver / ILlmCostEstimator (reuse)
- ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.Runs.cs (InsightDensityJudgeSkippedByCapTotal)
- ArchLucid.Decisioning/Findings/InsightDensityMeasurementFloorPresenter.cs (JudgeSkippedByCap sentence)
- docs/library/CONFIGURATION_REFERENCE.md MaxJudgedFindingsPerSnapshot row
- AiBudgetPreCallGuard (do not duplicate enforcement — this is pre-flight sizing only)

Work:

1. Own class InsightDensityJudgeBudgetCap.Resolve(configuredCap, remainingUsd, estimatedCostPerJudgmentUsd) → int. Null remaining or null/≤0 estimate → configuredCap. Otherwise Clamp(configuredCap down to floor(remaining/estimate), minimum 0). Never return > configuredCap. Unit-test this helper in isolation (no HTTP).

2. PremiumInsightDensityLlmJudge: resolve remaining USD with the existing tenant budget port (scope from IScopeContextProvider). Estimate per-judgment cost from the Premium deployment the judge already uses. Pass the shrunk cap into InsightDensityJudgeCandidateSelector. If 0, skip the judge loop entirely and set JudgeSkippedByCap to the full candidate count (or a dedicated “skipped by budget” reason if you can do it without OpenAPI — prefer reusing skipped-by-cap to avoid a contract change).

3. Measurement floor: when the effective cap is < configured cap, append one clause: “Premium judge cap reduced from {configured} to {effective} from remaining AI budget.” Omit when they are equal so existing copy tests stay stable.

4. CONFIGURATION_REFERENCE.md: keep default 40. Add one sentence that Real-mode judging may use fewer than 40 completions when remaining monthly USD would not cover them, and that this is not a buyer “we judged every finding” claim.

5. Tests:
   - remaining $0 → effective cap 0, no completion router calls
   - remaining covers 3 judgments, configured 40, 10 candidates → 3 judged, 7 skipped-by-cap
   - budget resolver null → 40 (or configured), fail-open
   - Simulator path still does not judge
   - configured 40 never becomes 41
   - existing PremiumInsightDensityLlmJudgeTests still pass when remaining is null

6. claimBoundary: internal spend control; not a density claim; not SOC 2 Type II; not a named-model beat.

Do not: raise the default; auto-increase the cap when budget is large; default EnableProseAssumptionExtraction on; push master; call the budget API from the golden harness.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj'
Test:
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~PremiumInsightDensityLlmJudge|FullyQualifiedName~JudgeCandidate|FullyQualifiedName~JudgeBudgetCap"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityMeasurementFloor"

Done when: a tenant with $0 remaining judges nothing; a tenant with room for 3 judgments judges 3 of 10; a host without budget services still uses 40; the default stays 40.
```

---

## Held (do not duplicate)

**DX-57** already flipped Real-mode ranking priors — do not re-open host JSON defaults. Live frontier **pilot-pending** captures need owner **G-REAL-06** runs. Graph-RAG buyer claims need ADR 0057 owner override + **TB-883** ablation.

Workstream 2 remainder after this set: category-protection redesign beyond the 65 threshold (not needed if DX-59 lands), and **`EnableProseAssumptionExtraction` default-on** (still owner-gated; cost scales per in-batch document). `portfolio-shared-topology` stays default-off (cross-system I/O).

GTM cohorts **M-90 / M-44 / M-91 / M-92**, SOC 2 CPA (**G-REAL-05**), and third-party pen test (**G-ASSURANCE-02**) stay off the engineering batch list.

Coverage-shaped engines (observability completeness, capacity planning, IAM depth as node-exists) remain held until **G-REAL-06**.

Do not add a “citation pass” prompt for `topology-coverage` / `requirement-expectation` / `security-coverage`: those engines already call `FindingGraphEvidenceRefs.CollectFromNodeIds`. Empty refs on golden graphs are why they score 60; DX-58/DX-59 make that honest instead of stuffing synthetic `graph-node:` labels (forbidden by DX-50).

Do not add a temporal-fusion engine: `open-commitment` already joins the governance trail to the current run (DX-05). Jaccard duplication is already a penalty. A “Decision-grade for N consecutive runs” finding would duplicate `open-commitment` and `portfolio-recurrence`.

---

## Related

- Strategy: [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md)
- DX-01–DX-16: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md)
- DX-17–DX-28: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md)
- DX-29–DX-35: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md)
- DX-36–DX-41: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md)
- DX-42–DX-46: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md)
- DX-47–DX-50: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md)
- DX-51–DX-56: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md)
- DX-63–DX-68: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md)
- DX-69–DX-72: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX69.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX69.md)
- DX-73–DX-76: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md)
- Cursor index: [`.cursor/prompts/insight-density-excellence-00-index.md`](../../.cursor/prompts/insight-density-excellence-00-index.md)
- Hold exception: [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)
- Miss clause: [`../quality/INSIGHT_DENSITY_MISS_CLAUSE.md`](../quality/INSIGHT_DENSITY_MISS_CLAUSE.md)
