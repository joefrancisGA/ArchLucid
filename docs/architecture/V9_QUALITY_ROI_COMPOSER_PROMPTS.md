> **Scope:** Copy-paste Composer/Cursor prompts that raise **v9 assessment** weighted qualities at the best credit ROI. Internal engineering only — not buyer-facing copy.
> **Scores:** [`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) (v9, 2026-09-09) §2 / §8 / §17 · **Index:** [`.cursor/prompts/v9-quality-roi-00-index.md`](../../.cursor/prompts/v9-quality-roi-00-index.md)
> **Predecessor:** [`V8_QUALITY_ROI_COMPOSER_PROMPTS.md`](V8_QUALITY_ROI_COMPOSER_PROMPTS.md) (QR-01–QR-04 shipped; QR-05 still `#2641`)
> **Do not re-run:** QR-01–QR-04 · DX-01–DX-76 · WK-01–WK-22 · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md)

# v9 quality-ROI Composer prompts (QR-06–QR-15)

**Created:** 2026-09-09 · **Status:** ready to run (one prompt per chat). **DX-77 is not authorized.**

v9 scored **(A) 77.26%**. QR-01–QR-04 closed the v8 compile / guard / OpenAPI trio. The cheapest remaining score movement is **Correctness (73, deficiency 324)** on a new Suite=Core red, then **Insight Density honesty (70, deficiency 390)** without another engine pack.

**Run one prompt per chat.** Feature branch per prompt. Suggested Cloud Agent branch: `cursor/qr-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push to `master`.**

## Why this set, not DX-77

| Quality | v9 score | Deficiency | What credits buy here |
|---------|---------:|----------:|-----------------------|
| Correctness & Evidence Integrity | 73 | **324** | QR-06 restore orchestrator Decision-grade emission + Kind B `#L` fixture |
| Runtime & First-Review Reliability | 72 | 196 | Same QR-06 green + QR-13 full-matrix triage |
| Decision-Changing Insight Density | 70 | **390** | QR-07 re-record through case-70; QR-08/QR-09 honest citations — **not** a new engine |
| Time-to-Value | 73 | 270 | QR-10 Azure extractor **soft** first-review prompt |
| Differentiability | 83 | 221 | QR-11 pack-toggle artifact + QR-12 next ga-starter slice |
| Proof-of-ROI / AI / GRI | 76 / 76 / 88 | — | **Owner:** Gate 1 then G-REAL-06. No Composer prompt. |

Expected headline from QR-06 alone: Correctness ~73 → ~80 and Runtime ~72 → ~75 (**~+1.0% (A)**) once Suite=Core is green. QR-07–QR-09 buy density *honesty*, not generation. DX-01–DX-76 already bought four density points over a full program.

## Do not re-run / do not start from this document

| Item | Why |
|------|-----|
| QR-01–QR-04 | Shipped on `master` (`#2619`, `#2638`). |
| QR-05 | Draft `#2641` — land via **QR-08**, do not re-author from scratch. |
| DX-01–DX-76 | Shipped. Do not add `EngineType`. Do not start DX-77. |
| WK-01–WK-22 | Historical. Trunk defects below are **new**. |
| AS-024 / AS-034 | Shipped (`#2633`, `#2640`). Case-70 exists; the table is stale. |
| G-REAL-06 / G-REAL-07 / M-39 / Gate 1 | Owner + staging. Composer cannot fake a real-mode run. |
| Prefix-family `IsThemeEnabled` | PP-01 **rejected**. Exact-id only. |
| TB-883 Graph-RAG ablation | Budget cap TBD. |
| GTM **M-90 / M-44 / M-91 / M-92** | V1.1 human cohorts. |
| SOC 2 CPA (**G-REAL-05**) / third-party pen test (**G-ASSURANCE-02**) | Owner assurance; not `(A)`. |
| `DemotionThreshold` / `InsightDensityDemotionPredicate` | Stay at 65 / DX-01. |
| Desktop review **More** menu | Rejected. |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Qualities |
|--------|-------|-----------|------------|-----------|
| **QR-06** | Restore orchestrator emission + Kind B `#L` fixture | **First. Nothing else until green.** | none | Correctness, Runtime |
| **QR-07** | Re-record distribution through case-70 | After QR-06 | QR-06 | Density honesty, Correctness |
| **QR-08** | Land QR-05 + remaining 65-band engines | After QR-07 (or rebase `#2641` then record) | QR-06; prefer QR-07 | Density honesty |
| **QR-09** | `diagram:` citations on path engines (case-70) | After QR-07 | QR-07 | Density |
| **QR-10** | Azure extractor first-review **soft** default | After owner accepts soft (default here) | none for code | TTV, Density |
| **QR-11** | Pack-toggle compare as quality artifact | Parallel with QR-09 | none | Differentiability |
| **QR-12** | Next `ga-starter` framework slice (HIPAA or ISO) | After QR-06 | none | Differentiability |
| **QR-13** | Triage full `ci.yml` matrix on one trunk SHA | After QR-06; **do not batch** with emission changes | QR-06 | Runtime |
| **QR-14** | Working default: load prior sealed graph (AS-053) | After QR-06 | DX-64 shipped | Density, Runtime |
| **QR-15** | Bind TF/ARM graph nodes to diagram labels (AS-043) | After QR-06 | AS-018 matchers | Density |

**Stop after QR-06 until the push corset is green.** Do not commission DX-77.

---

## Global constraints (paste into every prompt if context drops)

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. One blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests**.
- Tenant isolation stays database-per-tenant catalogs (ADR 0037).
- **No new finding engine.** Do not add a 5th `AgentType`. Do not add a coverage engine.
- **No new NuGet packages** unless already in `Directory.Packages.props`.
- Do **not** regenerate OpenAPI unless a DTO actually changed.
- SQL: this set should not need SQL except QR-14 if a prior-graph pointer is missing. If it does, numbered migration **and** the same DDL in `ArchLucid.Persistence/Scripts/ArchLucid.sql`.
- Stage only files this prompt changed. **No `git add -A`.** **Do not push `master`.**
- One scoped compile per prompt; one retry on exit code 1: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '…'`.
- Do not change `InsightDensityDemotionPredicate`. `DemotionThreshold` stays **65**.
- Do not restore `typed-engine-protected` as a Promote short-circuit (ADR 0070).
- Do not collapse desktop review workspace tabs behind **More**.
- Do not enable prefix-family theme matching on `DeclarationSignalPolicyKeyMap.IsThemeEnabled`.

---

# QR-06 — Restore Decisioning.Tests orchestrator emission + Kind B line fixture

**Closes:** v9 §8 weakness 1–2 / §17 items 1–2. Push corset [34392453288](https://github.com/joefrancisGA/ArchLucid/actions/runs/34392453288): `ArchLucid.Decisioning.Tests` **10 failed / 394 passed**. `FindingsOrchestratorTests` snapshots with empty `Findings` (`effectful-1`, `good-payload`, promote-anchored, payload-conflict, withheld-band, partial-failure, dedupe). `HasKindBProvenance_allows_resolvable_doc_ref` still uses `doc:manifest.json#services`. Provenance-hold test expected `provenance-hold:` notes but saw `evidence:doc:manifest.json#services`.
**Depends on:** none — **run first**
**Branch suggestion:** `cursor/qr-06-orchestrator-emission-kind-b`

### Design intent

DX-70 made `HasConcreteEvidenceCitation` require `doc:…#L` + a digit. `FindingChecklistCoverageRouter` then moves demoted rows out of `Findings` into `ChecklistCoverage`. Orchestrator mocks still use Kind A (`RelatedNodeIds` + `RulesApplied`) without `EvidenceRefs`, so the **density gate** demotes them and tests that assert `snapshot.Findings` fail. Kind B unit fixture uses a heading fragment.

Fix the **fixtures** so tests that expect Decision-grade rows cite `doc:…#L12` (or a product-shaped ARM). Keep the hold path honest: missing Kind A still becomes checklist with `provenance-hold:`. **Do not** weaken DX-70. **Do not** restore `typed-engine-protected`. After tests are green, grep production engines: if engines that already emit `RelatedNodeIds` + `RulesApplied` **and** product-shaped `EvidenceRefs` still vanish from `Findings`, that is a product bug — fix emission, not the gate.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make ArchLucid.Decisioning.Tests Suite=Core green. Restore FindingsOrchestratorTests Decision-grade emission for mocks that are supposed to stay in snapshot.Findings, and align Kind B fixtures with DX-70 line-anchored doc: refs. Do not weaken HasConcreteEvidenceCitation. Do not change DemotionThreshold (65). Do not add EngineType. Do not restore typed-engine-protected.

Why: v9 Correctness is 73 because the newest completed push corset failed 10 Decisioning.Tests. FindingsSnapshotMigrator → FindingChecklistCoverageRouter moves Classification=ChecklistCoverage / Treatment=DemoteToChecklist out of Findings. Mocks that only set RelatedNodeIds + RulesApplied pass Kind A (DecisionGradeFindingProvenanceValidator.HasTypedEngineProvenance) but DeterministicInsightDensityGate still demotes for no-concrete-evidence. AgentArchitectureFindingProvenanceValidator.HasKindBProvenance delegates to HasConcreteEvidenceCitation, so doc:manifest.json#services is correctly false.

Read first:
- ArchLucid.Decisioning.Tests/FindingsOrchestratorTests.cs (CreateFinding / ApplyKindAProvenance; tests that assert snapshot.Findings.Should().ContainSingle; GenerateFindingsSnapshotAsync_holds_typed_finding_without_kind_a_in_checklist_band; GenerateFindingsSnapshotAsync_promotes_evidence_anchored_findings)
- ArchLucid.Decisioning.Tests/Findings/AgentArchitectureFindingProvenanceValidatorTests.cs (HasKindBProvenance_allows_resolvable_doc_ref)
- ArchLucid.Core/Findings/FindingEvidenceRefs.cs HasLineAnchoredDocRef
- ArchLucid.Core/Findings/GenericArchitectureAdvicePatterns.cs HasConcreteEvidenceCitation
- ArchLucid.Core/Findings/FindingChecklistCoverageRouter.cs
- ArchLucid.Decisioning/Findings/FindingProvenanceEmissionApplicator.cs
- ArchLucid.Decisioning/Findings/DecisionGradeFindingProvenanceValidator.cs
- ArchLucid.Decisioning/Findings/AgentArchitectureFindingProvenanceValidator.cs
- ArchLucid.Decisioning/Services/Findings/FindingsMergeAndGateStage.cs
- CI log for run 34392453288 (empty Findings + Kind B + provenance-hold notes)

Work:

1. Local repro first:
   dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~FindingsOrchestratorTests|FullyQualifiedName~AgentArchitectureFindingProvenanceValidatorTests"

2. Tests that expect Decision-grade snapshot.Findings (effectful-1, good-payload, promote-anchored, payload-conflict, withheld-band, partial-failure, dedupe, and any sibling that failed the same way):
   - Keep Kind A (RelatedNodeIds + RulesApplied).
   - Add EvidenceRefs with a line-anchored citation, e.g. doc:fixture.md#L12 (or a product-shaped ARM already accepted by FindingEvidenceRefs.TryFormatInventoryResourceId).
   - Promote-anchored: Trace.Notes "evidence:doc:manifest.json#services" is NOT an EvidenceRef. Put the line-anchored ref on EvidenceRefs. Heading fragments must not count.
   - Helper: extend ApplyKindAProvenance or add ApplyConcreteEvidenceCitation once; do not copy-paste ten times.

3. GenerateFindingsSnapshotAsync_holds_typed_finding_without_kind_a_in_checklist_band:
   - This finding MUST remain without Kind A (no RelatedNodeIds/RulesApplied) so FindingProvenanceEmissionApplicator.Apply still writes provenance-hold:.
   - Do not give it EvidenceRefs that would accidentally pass the density gate while skipping Kind A — the point is the hold path.
   - Assert still: Findings empty, ChecklistCoverage contains the id, notes start with provenance-hold:.
   - If density-gate demotion currently wins and never writes provenance-hold:, fix applicator order or the test's setup so missing Kind A still records provenance-hold: then routes to checklist. Do not drop the hold note.

4. AgentArchitectureFindingProvenanceValidatorTests.HasKindBProvenance_allows_resolvable_doc_ref:
   - Change EvidenceRefs from doc:manifest.json#services to doc:manifest.json#L12 (or #L12-18).
   - Add a sibling test that heading fragments (#services) remain false. That is DX-70 honesty.

5. Production check (required, not optional): after orchestrator tests are green, pick one real engine that already collects EvidenceRefs (DeclarationSecurityBaselineFindingEngine or a golden case with ARM) and confirm AnalyzeAsync + GenerateFindingsSnapshotAsync still places that finding in snapshot.Findings, not only ChecklistCoverage. If production Decision-grade rows with product-shaped refs also vanish, fix emission — do not loosen the gate.

6. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
   Then: dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter Suite=Core

Do not: weaken HasLineAnchoredDocRef; raise DemotionThreshold; restore typed-engine-protected; invent ARM ids on label-only nodes; add EngineType; push master; regenerate OpenAPI.

Done when: Suite=Core Decisioning.Tests green locally; Kind B heading fragment still rejected; provenance-hold path still writes provenance-hold:; production engines with product-shaped refs still appear in Findings.
```

**Done when:** Suite=Core green. DX-70 still rejects `#services`. Production Decision-grade rows with real citations still emit.

---

# QR-07 — Re-record `insight-density-engine-distribution.md` through case-70

**Closes:** v9 §17 item 3. `LatestGoldenCorpusCaseNumber = 70` (AS-034 `#2640`). Distribution markdown header still says **case-01..case-69**.
**Depends on:** QR-06 (harness / Decisioning.Tests must be green)
**Branch suggestion:** `cursor/qr-07-distribution-case-70`

### Design intent

Honesty only. Pass `PriorGraphFixture` so case-64 `topology-security-drift` is not dropped. Do not hand-edit cells. Do not add `EngineType`.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: re-record docs/quality/insight-density-engine-distribution.md from the current golden corpus through LatestGoldenCorpusCaseNumber (70). Pass PriorGraphFixture so case-64 is included. Do not add EngineType. Do not invent EvidenceRefs. Do not change DemotionThreshold. Do not hand-edit score numbers.

Why: v9 density table is stale vs the harness. Case-70 is a mermaid trust-boundary golden (AS-034). Insight density cannot move, even as honesty, while the table stops at 69.

Read first:
- ArchLucid.Decisioning/Findings/GoldenCorpusHarnessEngineRegistration.cs (LatestGoldenCorpusCaseNumber)
- ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionMarkdown.cs
- InsightDensityEngineDistributionReportTests Record_distribution_markdown_when_env_flag_set
- docs/quality/insight-density-engine-distribution.md header
- docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md (PriorGraphFixture reminder)
- tests/golden-corpus/decisioning/case-70/README.md

Work:

1. Confirm QR-06 is on this branch or already on master (Decisioning.Tests Suite=Core green). If orchestrator is still red, stop and say so.

2. Record:
   ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION=1
   dotnet test ArchLucid.Decisioning.Tests --filter FullyQualifiedName~Record_distribution_markdown_when_env_flag_set
   Pass PriorGraphFixture the same way DX-73 does. Do not type cells by hand.

3. Update InsightDensityEngineDistributionMarkdownTests / miss-clause header interpolations only if the generator changed them. Header must say case-01..case-70 (or whatever LatestGoldenCorpusCaseNumber is).

4. One-sentence note in the markdown header: whether case-70 added engines/rows or only extended the case range.

5. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'

Do not: add EngineType; change gate predicate; fake frontier transcripts; push master.

Done when: markdown is generated; header matches LatestGoldenCorpusCaseNumber; tests that parse the header still pass.
```

**Done when:** Table is generated through case-70. Numbers are not typed by hand.

---

# QR-08 — Land QR-05 and remaining 65-band evidence refs

**Closes:** v9 §17 item 6. `security-baseline` 10/47 at median **65**, `No evidence = 10`. Same band: `declaration-security-baseline`, `topology-security-drift`. QR-05 draft `#2641` is not on `master`.
**Depends on:** QR-06. Prefer QR-07 first so the re-record includes the citation change. May rebase/merge `#2641` instead of rewriting `SecurityBaselineFindingEngine`.
**Branch suggestion:** `cursor/qr-08-65-band-evidence-refs`

### Design intent

Reuse `FindingGraphEvidenceRefs.CollectFromNodeIds` / QR-05 / `DeclarationSecurityBaselineFindingEngine`. Fail closed. No invented ARM. `graph-node:` counts only when product-shaped (DX-50).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: 65-band engines emit resolvable EvidenceRefs when the graph already has product-shaped citations, otherwise leave refs empty so the gate may demote. Land or rebase PR #2641 (QR-05 SecurityBaselineFindingEngine) rather than rewriting it. Then do the same pattern for declaration-security-baseline (if not already collecting) and topology-security-drift. Re-record docs/quality/insight-density-engine-distribution.md. Do not add EngineType. Do not change DemotionThreshold (65). Do not invent resource ids.

Why: v9 insight density is still the largest deficiency. The cheap lever is honesty on the 65-band slice, not DX-77.

Read first:
- GitHub PR #2641 / branch cursor/qr-05-security-baseline-evidence-refs-97a4 (rebase onto current master after QR-06)
- ArchLucid.Decisioning/Services/SecurityBaselineFindingEngine.cs
- ArchLucid.Decisioning/Services/DeclarationSecurityBaselineFindingEngine.cs
- TopologySecurityDriftFindingEngine (DX-64 already mentioned FindingGraphEvidenceRefs.CollectFromNodeIds — verify it actually runs and refs are product-shaped)
- ArchLucid.Decisioning/Findings/FindingGraphEvidenceRefs.cs
- docs/quality/insight-density-engine-distribution.md rows security-baseline, declaration-security-baseline, topology-security-drift
- DX-50: graph-node: is concrete only when FindingEvidenceRefs.TryFormatInventoryResourceId accepts the remainder

Work:

1. If #2641 is still open, rebase it onto master (after QR-06). Do not duplicate CollectEvidenceRefs if it already landed.

2. For each 65-band engine: populate EvidenceRefs from node property bags / PROTECTS targets / current-graph cited nodes. Empty refs when the bag has only a label. No invented ARM/ARN/GCP paths.

3. Tests: product-shaped property → refs non-empty; label-only → refs empty. No ConfigureAwait(false).

4. Re-record distribution (QR-07 procedure, PriorGraphFixture). Either No evidence drops or WouldDemoteAt65Count becomes non-zero. Both are valid.

5. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'

Do not: add EngineType; raise threshold; restore typed-engine-protected; fake citations; push master.

Done when: 65-band rows are evidenced or honestly demoting; table generated not typed; #2641 either merged into this PR or superseded with credit in the commit message.
```

**Done when:** 65-band engines are evidenced **or** demoting. Table regenerated.

---

# QR-09 — `diagram:` citations from case-70 onto path engines

**Closes:** v9 §17 item 7. `identity-blast-radius`, `data-flow-trust-boundary`, `segmentation-semantics` all median **72** with `No evidence` on every row. Case-70 is a mermaid trust-boundary golden. `FindingDiagramEvidenceRefs` / AS-023 already resolve `diagram:` from diagram-origin nodes.
**Depends on:** QR-07 (so the table includes case-70). QR-06 green.
**Branch suggestion:** `cursor/qr-09-path-engine-diagram-citations`

### Design intent

Path engines already walk graph nodes. Enrich `EvidenceRefs` with `FindingDiagramEvidenceRefs.TryAppendFromNode` / `FindingProvenanceEmissionApplicator.EnrichDiagramEvidenceRefs` when the related node is diagram-origin or bound (`BoundDiagramNodeId`). Do not invent shape ids. Dangling `diagram:` refs are not concrete (`DiagramPackageCitationIndex`).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: path engines identity-blast-radius, data-flow-trust-boundary, and segmentation-semantics copy resolvable diagram: EvidenceRefs when RelatedNodeIds point at case-70 mermaid / structured-diagram nodes. Reuse FindingDiagramEvidenceRefs and EnrichDiagramEvidenceRefs. Do not add EngineType. Do not invent shape ids. Do not change DemotionThreshold.

Why: v9 path-engine rows sit at 72 with No evidence = all findings. AS-034 put mermaid on the harness; AS-023 already knows how to cite diagram shapes. The miss is wiring, not a new engine.

Read first:
- ArchLucid.Decisioning/Findings/FindingDiagramEvidenceRefs.cs
- ArchLucid.Decisioning/Findings/FindingProvenanceEmissionApplicator.cs EnrichDiagramEvidenceRefs
- ArchLucid.Decisioning.Tests/Findings/FindingDiagramEvidenceRefsTests.cs
- ArchLucid.Core.Tests/Findings/DiagramEvidenceCitationRefsTests.cs (dangling diagram: is not concrete)
- Path engines: IdentityBlastRadiusFindingEngine, DataFlowTrustBoundaryFindingEngine, SegmentationSemanticsFindingEngine
- tests/golden-corpus/decisioning/case-70/
- docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md (diagram: claimBoundary)

Work:

1. Confirm EnrichDiagramEvidenceRefs already runs in FindingsMergeAndGateStage. If path engines still have empty EvidenceRefs on case-70, the nodes are not diagram-origin / BoundDiagramNodeId is unset — bind using existing StructuredDiagramGraphPropertyKeys, do not synthesize labels.

2. If engines collect graph-node: labels that DX-50 rejects, prefer diagram: when TryResolveDiagramCitation succeeds.

3. Tests:
   - mermaid/diagram node with SourceEvidenceItemId + shape id → EvidenceRefs contain diagram:… and HasConcreteEvidenceCitation is true when package index includes that shape
   - dangling shape id → not concrete
   - IaC-only node with no diagram properties → no invented diagram: ref
   No ConfigureAwait(false).

4. Re-record distribution (same env flag + PriorGraphFixture). Path-engine No evidence should drop on case-70 rows if citations resolve; if case-70 nodes still have no diagram properties, say so and stop — that is QR-15 bind work, not fake refs.

5. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'

Do not: add EngineType; OCR; second mermaid parser; push master; collapse review tabs.

Done when: case-70 path findings cite diagram: when shapes exist; dangling ids remain non-concrete; table regenerated if scores moved.
```

**Done when:** Path engines cite real diagram shapes or the prompt reports the bind gap for QR-15.

---

# QR-10 — Azure extractor first-review **soft** default

**Closes:** v9 §0 item 4 / §17 item 8. Owner said **Yes — Azure first** (2026-09-09) without intake shape (soft vs hard vs wizard). Largest remaining first-review density lever that Composer can ship without a staging tenant.
**Depends on:** none for code. Treat **soft prompt + skip** as the default unless the owner already picked hard/wizard in this chat.
**Branch suggestion:** `cursor/qr-10-azure-extractor-soft-default`

### Design intent

Adoption, not a new engine. Engines already record `HeldCheckInputCode.AzureInventoryZip`. Surface that as a skippable first-review prompt (checklist / do-this-next / measurement floor). **Not** a hard gate. **Not** a new wizard unless one already exists and only needs a step. AWS/GCP stay deferred.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make Azure inventory ZIP (or hosted extractor upload already in the product) a skippable first-review prompt. Soft default: show the ask, allow skip, do not block finalize. Do not add EngineType. Do not make AWS/GCP default-on. Do not invent a second Azure collector. Do not flip AgentExecution:Mode.

Why: Owner authorized Azure-first extractors for first review but did not pick hard gate vs wizard. v9 Time-to-Value and density both stall on IaC-only first reviews. HeldCheckInputCode.AzureInventoryZip, OrphanedAzureResourceFindingEngine, DeclarationInventoryContradictionFindingEngine, and POST /v1/azure-extractor/upload already exist.

Read first:
- docs/runbooks/AZURE_EXTRACTOR_INGEST.md
- ArchLucid.Core/Findings/HeldCheckInputCodeLabels.cs
- ArchLucid.Core/Findings/ProseAssumptionHeldCheckAskMapper.cs
- archlucid-ui do-this-next / ReviewPackageDoThisNextStrip / CorePilotChecklist / measurement-floor presenter
- docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md owner decision "Yes — Azure first"
- docs/assessments/LATEST_GPT55.md §0 item 4 (soft vs hard vs wizard still open — implement SOFT)

Work:

1. First-review / core-pilot checklist (or the existing do-this-next strip if that is the canonical next-action): add one skippable item "Upload Azure inventory ZIP" (TB-645 sentence case) that links to the existing extractor upload route. Skip persists for the architecture/review, not a hidden cookie that re-prompts every paint. Do not block Finalized.

2. When HeldCheckLedger already has AzureInventoryZip, prefer that existing ask over a duplicate checklist row.

3. Copy: do not claim live Azure subscription pull unless hosted extractor is configured. Upload ZIP is the V1 path (runbook).

4. Tests: Vitest — item visible on first-review checklist; skip hides it; finalize still enabled. C# — do not change engine skip/fail-closed when ZIP is absent (R5). No ConfigureAwait(false).

5. Docs: one paragraph in AZURE_EXTRACTOR_INGEST.md that first-review prompts Azure ZIP and skip is allowed. claimBoundary: not a hard gate, not SOC 2, not AWS/GCP.

6. UI compile/lint for touched files only. C# compile only if you touched C#.

Do not: hard-block commit; new wizard; default-on hosted ARM crawl; AWS/GCP; collapse tabs; push master; regenerate OpenAPI unless a DTO changed (it should not).

Done when: first-review shows a skippable Azure inventory ask wired to the existing upload path; skip does not emit fake inventory findings.
```

**Done when:** Soft prompt ships. Skip is real. No hard gate.

---

# QR-11 — Record pack-toggle compare as a checked-in quality artifact

**Closes:** v9 §17 item 9. `PolicyFilteredDeclarationGoldenCorpusTests` already asserts CIS-Azure vs SOC 2 declaration rows differ on one graph. Differentiability is 83 because that proof is a unit test, not a buyer-facing checked-in artifact.
**Depends on:** none
**Branch suggestion:** `cursor/qr-11-pack-toggle-quality-artifact`

### Design intent

Do **not** reimplement gating. Generate or check in a markdown/JSON delta next to `docs/quality/policy-filter-golden-delta.md` that the existing test already proves, and add a CI/test guard that the artifact matches. Keep `GoldenCorpusHarness` on `FileComplianceRulePackProvider` (WK-22).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: turn the already-passing PolicyFilteredDeclarationGoldenCorpusTests (and PolicyPackP1ToggleGoldenCorpusTests if cheap) into a checked-in quality artifact under docs/quality/ that CI will fail if the two-pack delta drifts. Do not reimplement ComplianceRulePackGovernanceFilter. Do not inject IEffectiveGovernanceLoader into GoldenCorpusHarness. Do not enable prefix-family IsThemeEnabled.

Why: v9 Differentiability is 83. The moat is real in tests and invisible in the quality folder except a hand-maintained policy-filter-golden-delta.md. A generated-or-asserted artifact is the ROI.

Read first:
- ArchLucid.Decisioning.Tests/GoldenCorpus/PolicyFilteredDeclarationGoldenCorpusTests.cs
- ArchLucid.Decisioning.Tests/GoldenCorpus/PolicyPackP1ToggleGoldenCorpusTests.cs
- docs/quality/policy-filter-golden-delta.md
- docs/go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md
- docs/library/DECISIONING_GOLDEN_CORPUS.md (WK-22 harness warning)

Work:

1. Add a small recorder (env flag, same pattern as insight-density distribution) OR a test that writes/compares a committed markdown table: SOC 2 vs CIS Azure declaration finding titles / PolicyRuleId on the fixed graph.

2. If you generate, do not hand-edit cells after the first record. If you assert against the existing policy-filter-golden-delta.md tables, tighten the test so a silent declaration-row change fails CI.

3. claimBoundary in the artifact header: not evidence that all engines are pack-aware; coverage/cost/inventory remain pack-inert.

4. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'

Do not: GoldenCorpusHarness IEffectiveGovernanceLoader; prefix-family themes; pack.curatedRules.v1 embed; push master.

Done when: docs/quality has a pack-toggle artifact that Suite=Core will fail on drift; existing unit assertions still pass.
```

**Done when:** Pack-toggle delta is a CI-guarded artifact. Gating code unchanged.

---

# QR-12 — Next `ga-starter` framework slice (HIPAA or ISO)

**Closes:** v9 §17 item 10. PP-01 Option B. `hipaa-architecture` / `iso27001-architecture` stay declaration-silent at any floor until catalog rows exist (`docs/quality/pp01-ga-starter-catalog-extension-scoping.md`).
**Depends on:** QR-06 (Suite=Core must be runnable). Owner pick: **HIPAA if unspecified** (clinical boundary controls are the documented Option B example). ISO 27001 is the alternate.
**Branch suggestion:** `cursor/qr-12-ga-starter-hipaa-slice`

### Design intent

Author ~15–25 real `ga-starter-compliance.rules.json` rows with production-grade `appliesToCategory` / node/edge requirements. Map only ids that `DeclarationSignalPolicyKeyMap` already knows **or** add map entries that are id-specific. Golden fixtures per id. **No** prefix-family enablement.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: PP-01 Option B — extend ga-starter-compliance.rules.json with one buyer-facing framework slice (HIPAA unless the user named ISO 27001). Real appliesToCategory / requiredNodeType / requiredEdgeType. Golden tests. Do not enable prefix-family IsThemeEnabled. Do not embed pack.curatedRules.v1. Do not switch GoldenCorpusHarness to IEffectiveGovernanceLoader. Do not add EngineType.

Why: v9 Differentiability cannot rise while HIPAA/ISO packs advertise keys that never fire. Option A (~144 rules) is too large. Option B is the recommended pilot.

Read first:
- docs/quality/pp01-ga-starter-catalog-extension-scoping.md
- docs/quality/policy-filter-golden-delta.md remaining gaps
- ArchLucid.Decisioning/Findings/DeclarationSignalPolicyKeyMap.cs (exact-id IsThemeEnabled)
- ga-starter-compliance.rules.json + default-compliance.rules.json
- BundledPolicyPackDeclarationThemeTests
- PolicyFilteredDeclarationGoldenCorpusTests
- hipaa-architecture / iso27001-architecture bundled pack JSON (complianceRuleKeys)

Work:

1. Pick HIPAA (default) or ISO if the user named it. List the 15–25 mapped ids you will back. Skip ids that would attach a false PolicyRuleId to storage-HTTPS findings (see scoping doc "Deliberately not fixed").

2. Author rules in ga-starter-compliance.rules.json only (single extension file). Priorities must survive the bundled pack's priorityFloor or the test will still show silent.

3. If DeclarationSignalPolicyKeyMap needs new exact ids, add them id-by-id. No prefix matching.

4. Tests: BundledPolicyPackDeclarationThemeTests (or sibling) shows the chosen pack emits at least one declaration theme at a documented floor; PolicyFilteredDeclarationGoldenCorpusTests-style graph if a new key is filter-sensitive. No ConfigureAwait(false).

5. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
   Then Suite=Core filter for the bundled-pack tests.

Do not: Option A 144-rule dump; stub rules without appliesToCategory; prefix-family; push master.

Done when: the chosen pack is no longer fully silent at the documented floor; golden guards fail if those ids are removed.
```

**Done when:** One framework slice fires real declaration rows. Exact-id mapping only.

---

# QR-13 — Triage full `ci.yml` matrix on one trunk commit

**Closes:** v9 §17 item 11. Last eight `ci.yml` runs on `master` are failure/cancelled (last full dispatch 2026-08-28). Runtime score cannot rise while the full matrix is unmeasured-green.
**Depends on:** QR-06 (do not mix with emission-semantic changes)
**Branch suggestion:** `cursor/qr-13-ci-yml-matrix-triage`

### Design intent

Triage, then fix / demote / delete **per job**. Do not require extra checks beyond `golden-cohort-gate-required-check.json`. Do not apply GitHub rulesets.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: explain and then fix or explicitly demote every failing job on the newest completed ci.yml run for master (or this branch after QR-06). Produce a short docs note of pass/fail per job. Do not add required checks. Do not apply rulesets. Do not cancel-in-progress merge_group.

Why: v9 Runtime is 72. Push corset is a subset. Full ci.yml has been red/cancelled since late August. Technical buyers who clone still cannot trust the matrix.

Read first:
- .github/workflows/ci.yml
- .github/rulesets/golden-cohort-gate-required-check.json
- .github/BRANCH_PROTECTION.md
- gh run list --workflow ci.yml --branch master --limit 8
- Newest completed run's failed jobs (gh run view --log-failed)

Work:

1. Pick one SHA. List every job: success / failure / cancelled / skipped, with the reason in one line.

2. For each failure: fix product/test, skip with a documented if: that is not a silent success on a required name, or delete a truly dead job. Do not path-skip required check names to green.

3. Do not expand required contexts. merge_group behavior from QR-04 stays.

4. Add a dated paragraph to docs/quality/ or BRANCH_PROTECTION.md: which jobs are still known-red and why.

5. Compile only the projects you touch.

Do not: gh api ruleset apply; require OpenAPI/CodeQL if they are not already required; push master; batch this with QR-08 engine citation changes.

Done when: the matrix is either green on that SHA or every remaining red job is named with an owner-visible reason and is not a required context lying via path-skip.
```

**Done when:** Full matrix is honest. Required names still mean a real build.

---

# QR-14 — Working default: load prior sealed graph (AS-053 leftover)

**Closes:** v9 §17 item 12. DX-64 `topology-security-drift` exists. Without a Working-execute prior-graph load, review two never fires it. Spine leftover: `.cursor/prompts/architecture-spine-053-dx64-prior-graph-working-default.md`.
**Depends on:** QR-06. **Do not** re-run DX-64 engine code.
**Branch suggestion:** `cursor/qr-14-prior-graph-working-default`

### Design intent

Wire the existing prior-graph load that `TopologyCrossRunDiffFindingEngine` / DX-64 already use into Working execute when `dbo.Architectures` has a prior sealed review. First review must not invent drift (R5 / `HeldCheckInputCode.PriorRunSnapshot`).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: Working execute loads the prior sealed graph for the same architecture and runs topology-security-drift when that prior exists. Do not re-run DX-64 engine internals. Do not add EngineType. Do not unseal sealed records (ADR 0039). First review with no prior → held-check / empty, never invented drift (R5).

Why: v9 density still misses run-over-run security deltas on the product path. Golden case-64 proves the engine; Working default does not load prior.

Read first:
- .cursor/prompts/architecture-spine-053-dx64-prior-graph-working-default.md
- TopologySecurityDriftFindingEngine
- TopologyCrossRunDiffFindingEngine TryLoadPriorGraphAsync + CrossRunDiffFindingPriorGuard
- tests/golden-corpus/decisioning/case-64/README.md
- ADR 0074 architecture identity
- FindingAnalysisContext prior graph fields

Work:

1. On Working execute, when the architecture has a prior sealed review with a graph snapshot, pass that snapshot into FindingAnalysisContext the same way case-64's PriorGraphFixture does. Do not merge DraftRequests and Runs.

2. Tests: second review sees prior and can emit topology-security-drift for a closed kind already implemented (replica removal / inbound widen). First review: no drift finding from missing prior; PriorRunSnapshot held-check recorded. No ConfigureAwait(false).

3. Guided/demo: keep sample-safe behavior if a demo seed has no prior.

4. SQL only if a pointer is actually missing — numbered migration + ArchLucid.sql. Prefer existing columns.

5. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath for the projects you touch.

Do not: new EngineType; invent edges; unseal; flip Simulator→Real; push master.

Done when: Working second review can emit topology-security-drift without a hidden flag; first review stays empty/held.
```

**Done when:** Review two can fire DX-64. Review one does not invent drift.

---

# QR-15 — Bind existing Terraform/ARM graph nodes to diagram labels (AS-043 leftover)

**Closes:** v9 §17 item 13. Duplicate SQL boxes vs `.tf`. Spine leftover: `.cursor/prompts/architecture-spine-043-bind-tf-arm-to-diagram-nodes.md`. Reuse AS-018 matchers. **No second TF parser.**
**Depends on:** QR-06. AS-018 matchers must exist — consume them, do not fork.
**Branch suggestion:** `cursor/qr-15-bind-tf-arm-diagram`

### Design intent

After IaC graph seed + diagram compile, call the same binder AS-018 uses (exact id, then case-insensitive unique name; never fuzzy LLM). Unmatched labels stay diagram-only. Ambiguous duplicate names → no bind.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: bind existing Terraform/ARM ingest nodes to diagram nodes using AS-018 matchers after IaC graph seed + diagram compile. No new IaC parser. No fuzzy LLM match. Do not add EngineType.

Why: v9 path/diagram citations (QR-09) stall when mermaid labels do not carry BoundDiagramNodeId onto the IaC node. Duplicate SQL boxes fork findings.

Read first:
- .cursor/prompts/architecture-spine-043-bind-tf-arm-to-diagram-nodes.md
- .cursor/prompts/architecture-spine-018-bind-diagram-labels-to-canonical.md
- StructuredDiagramGraphMerger / AS-017 DefaultGraphBuilder
- StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId
- Existing TF/ARM ingest (DX-27/30/31/37/42) — consume, do not fork

Work:

1. Find the AS-018 binder. Call it once after IaC seed + diagram compile (not a second parser pass).

2. Matchers: exact ARM / CloudResourceId / Terraform address, then case-insensitive unique CanonicalObject name. Two inventory nodes with the same display name → no auto-bind.

3. Tests: tf resource address in a mermaid label binds; ARM id in label binds; ambiguous names do not bind. No ConfigureAwait(false).

4. If QR-09 already shipped and path engines still lack diagram: refs, this bind should unblock them — add one golden or unit that a bound node yields BoundDiagramNodeId.

5. Compile scoped to KnowledgeGraph / Decisioning tests you touch.

Do not: second TF parser; OCR; vision default-on; push master; collapse tabs.

Done when: mermaid label with a tf address binds to the ingest node; no silent wrong bind on duplicate names.
```

**Done when:** IaC nodes snap to diagram labels via existing matchers. No second parser.

---

## After this set

| Next | Who | Why not a Composer prompt |
|------|-----|---------------------------|
| Enable merge queue on `master` | Owner (GitHub UI / ruleset apply) | YAML + draft JSON already shipped QR-04 |
| Gate 1 staging first review | Owner | Only UNKNOWN ship gate |
| G-REAL-06 two-pack compare (CIS-Azure vs SOC 2, same input) | Owner | Moves density *and* Proof-of-ROI |
| TB-883 monthly AOAI cap | Owner budget | Ablation blocked |
| G-COMMERCE-01 | Human | Invoice/SOW |
| Merge `#2641` if QR-08 did not absorb it | Owner | Duplicate work otherwise |

**Do not commission DX-77 or another density-generation batch until QR-06 is green on `master` and the push corset is green.**
