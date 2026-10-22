> **Scope:** Copy-paste Composer/Cursor prompts that raise **v11 assessment** weighted qualities at the best credit ROI per token. Internal engineering only — not buyer-facing copy.
> **Scores:** [`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) (v11, 2026-09-09) §2 / §8 / §17 · **Index:** [`.cursor/prompts/v11-quality-roi-00-index.md`](../../.cursor/prompts/v11-quality-roi-00-index.md)
> **Predecessor:** [`V10_QUALITY_ROI_COMPOSER_PROMPTS.md`](V10_QUALITY_ROI_COMPOSER_PROMPTS.md) (**QR-16–QR-25 implemented** on `#2689`, not all on `master` yet)
> **Do not re-run:** QR-01–QR-25 · DX-01–DX-76 · WK-01–WK-22 · AS-019 / AS-035 / AS-045–AS-051 / AS-056–AS-057

# v11 quality-ROI Composer prompts (QR-26–QR-35)

**Created:** 2026-09-09 · **Status:** ready to run (one prompt per chat). **DX-77 is not authorized.**

v11 scored **(A) 81.64%**. QR-16–QR-25 closed OpenAPI (already green), ObservedFact leftover rebind, ISO P1, freshness, bind IDOR, and 65-band ARM goldens — **on `#2689`**. AS-050 / AS-051 / AS-056 / AS-057 are on `master`. The cheapest remaining score movement is **Insight Density leftover citations (76, deficiency 312)** on four engines that skip `EvidenceRefs`, then **putting the unused AS-057 scorer on the finding wire (AS-059)** — **not** another engine pack.

**Land `#2689` first** (rebase onto `origin/master` if GitHub asks). Do not re-implement QR-16–QR-25.

**Run one prompt per chat.** Feature branch per prompt. Suggested Cloud Agent branch: `cursor/qr-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push to `master`.**

## Why this set, not DX-77

| Quality | v11 score | Deficiency | What credits buy here |
|---------|---------:|----------:|-----------------------|
| Decision-Changing Insight Density | 76 | **312** | QR-26 / QR-27 leftover `EvidenceRefs` on 67-band engines — collectors already exist |
| AI / Agent Readiness | 78 | 220 | QR-28 generated clients see the support band; TB-883 remains owner |
| Correctness & Evidence Integrity | 82 | **216** | QR-26/27 citations; QR-30 collector-fork ratchet |
| Proof-of-ROI | 76 | 216 | **Owner:** Gate 1 then G-REAL-06. No Composer prompt. |
| Time-to-Value | 81 | 190 | Already moved by AS-050/051/052. Residual is Gate 1. |
| Differentiability | 87 | 169 | QR-31 PCI P1 exact-id slice (ISO already QR-20) |
| Runtime | 77 | 161 | QR-35 full `ci.yml` triage after golden churn |
| GRI / Comprehension | 89 / 82 | 143 / 144 | QR-28 wire + QR-29 desk band |

QR-26/27 are token-cheap (same ARM stamp + `CollectWithProductShapedGraphNodeFallback` as QR-18). QR-28 is the only remaining **generation** lever that is not a new `EngineType`: the scorer already exists. DX-01–DX-76 already bought the engine program.

## Do not re-run / do not start from this document

| Item | Why |
|------|-----|
| QR-01–QR-25 | Shipped on `master` or implemented on `#2689`. Merge `#2689`; do not re-author. |
| AS-049 / AS-050 / AS-051 | Shipped. Attach, merge, estate gap. |
| AS-056 / AS-057 | ADR 0085 + heuristic scorer shipped. This pack **wires** them (AS-059/061), does not rewrite the scorer. |
| AS-019 / AS-035 / AS-045 | Unlabeled NotVerifiable + vsdx case-71 + R5 tests shipped. |
| DX-01–DX-76 | Shipped. Do not add `EngineType`. Do not start DX-77. |
| G-REAL-06 / G-REAL-07 / M-39 / Gate 1 | Owner + staging. Composer cannot fake a real-mode run. |
| Prefix-family `IsThemeEnabled` | PP-01 **rejected**. Exact-id only. |
| TB-883 Graph-RAG ablation | Budget cap TBD. |
| GTM **M-90 / M-44 / M-91 / M-92** | V1.1 human cohorts. |
| SOC 2 CPA (**G-REAL-05**) / third-party pen test (**G-ASSURANCE-02**) | Owner assurance; not `(A)`. |
| `DemotionThreshold` / `InsightDensityDemotionPredicate` | Stay at 65 / DX-01. |
| Desktop review **More** menu | Rejected. |
| OpenAPI regen with **no** DTO change | Fail-fast is green. QR-28 **does** change a DTO — regen only then. |
| AS-076+ Career/Rehearsal / AS-086+ shares | Not this pack. |
| ISO 27001 P1 | QR-20 on `#2689`. Next slice is **PCI**, not ISO redo. |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Qualities |
|--------|-------|-----------|------------|-----------|
| **QR-26** | 67-band leftover: `dr-rpo-topology` + `requirement-sku-tier` citations | After `#2689` on branch or master | QR-18 collectors shipped | Density honesty |
| **QR-27** | `dangling-declaration-reference` + `declaration-premise-conflict` `EvidenceRefs` | After QR-26 (or parallel if goldens isolated) | QR-26 optional | Density, Correctness |
| **QR-28** | Support band enum on the finding wire (AS-059) + OpenAPI | After `#2689`; parallel with 26 | AS-057 scorer shipped | GRI, AI, Comprehension |
| **QR-29** | Working desk shows support band (AS-061) | After QR-28 | QR-28 | Comprehension, GRI |
| **QR-30** | AS-054 CI ratchet — no second Azure collector | Anytime | AS-046 shipped | Correctness |
| **QR-31** | `ga-starter` PCI DSS P1 exact-id slice | Parallel with 26 | QR-12/QR-20 pattern | Differentiability |
| **QR-32** | AS-066: support band must not fuse into density gate | After QR-28 | QR-28 | Density honesty |
| **QR-33** | AS-058 consume Lane B support-ratio when present | After QR-28 | AS-056 | AI, GRI |
| **QR-34** | Re-record distribution after 26–27 | After QR-26 (prefer QR-27 too) | QR-26 | Density honesty |
| **QR-35** | Triage full `ci.yml` matrix on one trunk SHA | After 26–34 golden/OpenAPI churn | `#2689` merged | Runtime |

**Stop and merge `#2689` before treating trunk distribution as current.** Do not commission DX-77.

---

## Global constraints (paste into every prompt if context drops)

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. One blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests**.
- Tenant isolation stays database-per-tenant catalogs (ADR 0037).
- **No new finding engine.** Do not add a 5th `AgentType`. Do not add a coverage engine.
- **No new NuGet packages** unless already in `Directory.Packages.props`.
- Do **not** regenerate OpenAPI unless a DTO actually changed — **except QR-28**, whose job is the finding-wire field.
- SQL: this set should not need SQL. If it does, numbered migration **and** the same DDL in `ArchLucid.Persistence/Scripts/ArchLucid.sql`.
- Stage only files this prompt changed. **No `git add -A`.** **Do not push `master`.**
- One scoped compile per prompt; one retry on exit code 1: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '…'`.
- Do not change `InsightDensityDemotionPredicate`. `DemotionThreshold` stays **65**.
- Do not restore `typed-engine-protected` as a Promote short-circuit (ADR 0070).
- Do not collapse desktop review workspace tabs behind **More**.
- Do not enable prefix-family theme matching on `DeclarationSignalPolicyKeyMap.IsThemeEnabled`.
- Do not fork a second Azure collector. Consume IE snapshot types.
- Do not run `ARCHLUCID_RECORD_DECISIONING_GOLDEN=1` on `Record_all_cases_when_env_flag_set` (factory overwrite). Re-record `expected-decisions.json` only via `Record_all_existing_cases_from_input_when_env_flag_set`.
- Do not hand-edit `docs/quality/insight-density-engine-distribution.md` cells.

---

# QR-26 — 67-band leftover: `dr-rpo-topology` + `requirement-sku-tier` citations

**Closes:** v11 §8 weakness 3 / §17 item 4. On `#2689` distribution: `dr-rpo-topology` 2 findings median 67 `No evidence = 2`; `requirement-sku-tier` 1 finding median 67 `No evidence = 1`.
**Depends on:** `#2689` goldens (or equivalent ARM stamps) on this branch
**Branch suggestion:** `cursor/qr-26-67-band-rpo-sku-citations`

### Design intent

QR-18 taught 65-band engines to use `FindingGraphEvidenceRefs.CollectWithProductShapedGraphNodeFallback` and stamped product-shaped ARM/ARN/`resourceId` on golden graphs so `HasConcreteEvidenceCitation` can pass. `dr-rpo-topology` still calls `CollectFromNodeIds` (no product-shaped `graph-node:` fallback). `requirement-sku-tier` sets `RelatedNodeIds` and `Trace.Notes` (`evidence:graph-node:…`) and **never sets `EvidenceRefs`**. Collectors and the citation gate already exist. Do not add `EngineType`. Last ARM path segment must match the node label and set `resourceId` to the same ARM so `dangling-declaration-reference` does not fire.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make golden-corpus findings from dr-rpo-topology and requirement-sku-tier carry EvidenceRefs that HasConcreteEvidenceCitation accepts (product-shaped ARM/ARN/projects/ or diagram:). Do not add EngineType. Do not change DemotionThreshold (65). Do not weaken HasConcreteEvidenceCitation. Do not restore typed-engine-protected.

Why: v11 Insight Density is 76 (deficiency 312). 65-band engines were fixed on PR #2689. These two leftover engines still record No evidence at 67 because they skip the product-shaped fallback or never set EvidenceRefs (notes are not citations).

Read first:
- ArchLucid.Decisioning/Services/DrRpoTopologyFindingEngine.cs (CollectFromNodeIds)
- ArchLucid.Decisioning/Services/RequirementSkuTierFindingEngine.cs (no EvidenceRefs; Trace.Notes only)
- ArchLucid.Decisioning/Findings/FindingGraphEvidenceRefs.cs
- ArchLucid.Core/Findings/GenericArchitectureAdvicePatterns.cs HasConcreteEvidenceCitation
- ArchLucid.Decisioning/Analysis/DrRpoTopologyAnalyzer.cs
- ArchLucid.Decisioning/Analysis/RequirementSkuTierAnalyzer.cs
- GoldenCorpusPathEngineGraphFactory / GoldenCorpusDxEngineGraphFactory CreateDrRpoTopologyGraph / CreateRequirementSkuTierGraph (and Second)
- docs/quality/insight-density-engine-distribution.md (do not hand-edit)
- tests/golden-corpus/decisioning/ cases that emit these engines

Work:

1. Confirm #2689 (QR-18 ARM stamps) is on this branch or master. If security-baseline still has No evidence = 10 on the recorded table, stop and say rebase #2689 first.

2. DrRpoTopologyFindingEngine.BuildFinding: switch CollectFromNodeIds to CollectWithProductShapedGraphNodeFallback. Keep RelatedNodeIds. Pass graphSnapshot.

3. RequirementSkuTierFindingEngine: change BuildFinding to take GraphSnapshot. Set EvidenceRefs = CollectWithProductShapedGraphNodeFallback(graphSnapshot, relatedNodeIds). Keep Kind A (RelatedNodeIds + RulesApplied). Trace.Notes may stay but are not a substitute.

4. Golden graphs for those cases: stamp product-shaped ARM (Azure), ARN (AWS), or projects/ (GCP) on the datastore TopologyResource the analyzer actually walks. Infer type from category/label/terraformType — do not default Microsoft.Sql onto vpc/subnet. Last path segment = exact node label. Also set resourceId to the same ARM so DanglingDeclarationReferenceAnalyzer identity keys match. Use rg-golden not rg-pay. Do not stamp Azure ARM onto AWS/GCP Actor nodes.

5. If expected-decisions.json changes because RequirementExpectationFindingEngine now sees ARM evidence, re-record ONLY via Record_all_existing_cases_from_input_when_env_flag_set. Never ARCHLUCID_RECORD_DECISIONING_GOLDEN=1 on Record_all_cases_when_env_flag_set.

6. Tests: existing DrRpoTopologyFindingEngineTests / RequirementSkuTierFindingEngineTests plus a citation assertion that EvidenceRefs pass HasConcreteEvidenceCitation. Add GoldenCorpusProductCitationTests siblings if that pattern exists for QR-18 engines.

7. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
   Then: dotnet test ArchLucid.Decisioning.Tests --filter "FullyQualifiedName~DrRpoTopology|FullyQualifiedName~RequirementSkuTier|FullyQualifiedName~GoldenCorpusProductCitation"

Do not: add EngineType; weaken DX-50; hand-edit distribution markdown; push master; regenerate OpenAPI; start DX-77.

Done when: those two engines emit at least one EvidenceRef HasConcreteEvidenceCitation accepts on the golden graphs; dangling extras from ARM identity mismatch are zero on those cases.
```

**Done when:** both engines cite product-shaped inventory on the recorded goldens. Distribution re-record is **QR-34**, not this prompt.

---

# QR-27 — `dangling-declaration-reference` + `declaration-premise-conflict` EvidenceRefs

**Closes:** v11 §8 weakness 3 remainder / §17 item 5. `#2689` table: dangling 1 @ 67 `No evidence = 1`; premise-conflict 1 @ 82 `No evidence = 1`.
**Depends on:** QR-26 preferred (ARM identity keys already set)
**Branch suggestion:** `cursor/qr-27-dangling-premise-evidence-refs`

### Design intent

`DanglingDeclarationReferenceFindingEngine.BuildFinding` never sets `EvidenceRefs`. It writes `Trace.Notes` `evidence:graph-node:{source}`. `DeclarationPremiseConflictFindingEngine.Emit` sets `RelatedNodeIds` and no `EvidenceRefs`. Same honesty as QR-18: copy product-shaped refs from the source/topology node. **Do not** invent ARM that creates new dangling extras. If a golden fires dangling because QR-18 stamped ARM without a matching identity key, fix the stamp (last segment = label + `resourceId`) rather than deleting the engine.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: DanglingDeclarationReferenceFindingEngine and DeclarationPremiseConflictFindingEngine must set EvidenceRefs via FindingGraphEvidenceRefs.CollectWithProductShapedGraphNodeFallback so HasConcreteEvidenceCitation can pass when the source node is product-shaped. Do not add EngineType. Do not change DemotionThreshold. Do not weaken dangling detection.

Why: v11 leftover No evidence rows. Notes are not citations. DX-50 already defined product-shaped graph-node:.

Read first:
- ArchLucid.Decisioning/Services/DanglingDeclarationReferenceFindingEngine.cs
- ArchLucid.Decisioning/Services/DeclarationPremiseConflictFindingEngine.Emit.cs
- ArchLucid.Decisioning/Analysis/DanglingDeclarationReferenceAnalyzer.cs (identity keys)
- ArchLucid.Decisioning/Findings/FindingGraphEvidenceRefs.cs
- ArchLucid.Core/Findings/GenericArchitectureAdvicePatterns.cs HasConcreteEvidenceCitation
- Golden corpus case that emits each engine (grep EngineType in expected-decisions / distribution)

Work:

1. Dangling BuildFinding: pass GraphSnapshot. EvidenceRefs = CollectWithProductShapedGraphNodeFallback(graphSnapshot, [reference.SourceNodeId]). Keep RelatedNodeIds. Do not cite the missing token as if it existed.

2. Premise-conflict Emit: EvidenceRefs = CollectWithProductShapedGraphNodeFallback(graphSnapshot, [topologyNode.NodeId, signal.IntentNodeId]). Keep PolicyRuleId / Kind A.

3. If a golden dangling finding is a false positive from ARM stamps (resourceId identity key vs label), fix the golden stamp the QR-18 way (last segment = exact label AND resourceId = ARM). Do not disable the analyzer.

4. Re-record expected-decisions only via Record_all_existing_cases_from_input_when_env_flag_set if extras change.

5. Tests: engine tests asserting EvidenceRefs non-empty and HasConcreteEvidenceCitation true on the product-shaped fixture; a sibling where label-only graph-node: still fails the citation helper (honesty).

6. Compile + scoped Decisioning.Tests for those engines and GoldenCorpusProductCitationTests if present.

Do not: add EngineType; hand-edit distribution markdown (QR-34); push master; OpenAPI; prefix-family IsThemeEnabled.

Done when: both engines set EvidenceRefs; recorded No evidence for them drops after QR-34; dangling still fires on a genuinely missing reference.
```

**Done when:** both engines populate `EvidenceRefs`. Re-record is QR-34.

---

# QR-28 — Support band enum on the finding wire (AS-059) + OpenAPI

**Closes:** v11 §8 weakness 2 / §17 item 6. `FindingSemanticSupportBand` + `FindingSemanticSupportBandScorer` exist on master (`#2687`). Finding DTO / OpenAPI / TS clients do **not** carry the field.
**Depends on:** AS-057 shipped
**Branch suggestion:** `cursor/qr-28-support-band-finding-wire`

### Design intent

ADR 0085: semantic support is a Working career band, **not** a sync commit gate. Closed enum: Supported, Unchecked, Unsupported, NotScored. Default Unchecked for decision-grade until scored. Checklist / advisory → NotScored. Call the existing scorer when citation excerpts exist; do not add an LLM judge. Do not fuse into `DeterministicInsightDensityGate` (QR-32). This prompt **does** change a DTO — regenerate OpenAPI.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: put FindingSemanticSupportBand on the finding wire (Contracts Finding + OpenAPI + generated TS). Score with the existing FindingSemanticSupportBandScorer. Do not make it a commit gate. Do not add an LLM judge. Do not fuse into DeterministicInsightDensityGate. Do not add EngineType.

Why: v11 GRI 89 / Comprehension 82 / AI 78. AS-057 shipped a scorer nobody can see. AS-059 leftover from architecture-spine.

Read first:
- ArchLucid.Decisioning/Findings/FindingSemanticSupportBand.cs
- ArchLucid.Decisioning/Findings/FindingSemanticSupportBandScorer.cs
- ArchLucid.Contracts/Findings/Finding.cs
- docs/architecture/adrs/0085-semantic-support-band-working-career-not-commit-gate.md
- .cursor/prompts/architecture-spine-059-support-band-enum.md
- docs/library/OPENAPI_CONTRACT_DRIFT.md / docs/library/API_CONTRACTS.md
- docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md (ARCHLUCID_REGENERATE_UI_API_TYPES regen)

Work:

1. Add a property on Finding (and any buyer-facing finding DTO the desk already reads) named SemanticSupportBand with the four enum values. ChecklistCoverage / demoted rows → NotScored. Decision-grade with no excerpts → Unchecked (NotScored only when there is nothing to score per scorer rules). Do not change FindingsSchema version unless existing versioning tests require it — follow neighboring optional fields.

2. After FindingsMergeAndGateStage (or the single emission point that already has message + EvidenceRefs excerpts), stamp the band from FindingSemanticSupportBandScorer.Score. Each class in its own file if you add an applicator.

3. Default: Simulator unlabeled rehearsal may be NotScored — if execution mode is not available at that layer, leave Unchecked and let QR-33/AS-068 honesty copy catch Simulator later. Do not flip AgentExecution:Mode.

4. OpenAPI: DTO changed — run ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh from repo root. Do not hand-edit generated TS.

5. Tests: C# that decision-grade + exact quote overlap → Supported; citation present quote mismatch → Unsupported; empty excerpts → NotScored or Unchecked per scorer; checklist → NotScored. Architecture test that DeterministicInsightDensityGate.cs still has no reference to SemanticSupportBand (QR-32 will expand this).

6. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning/ArchLucid.Decisioning.csproj'
   Regen OpenAPI. UI typecheck if generated types changed.

Do not: commit-block on Unsupported; enable LLM semantic judge; fuse into density; AS-076 Career chrome; push master.

Done when: OpenAPI fail-fast would accept the new field; scorer is called on emit; desk can wait for QR-29.
```

**Done when:** wire has the field; OpenAPI snapshot updated; still not a commit gate.

---

# QR-29 — Working desk shows support band (AS-061)

**Closes:** v11 §17 item 7. Depends on QR-28 field.
**Depends on:** QR-28
**Branch suggestion:** `cursor/qr-29-working-desk-support-band`

### Design intent

Decision-grade rows on Working show Supported / Unchecked / Unsupported / NotScored beside existing provenance. Sentence case. TB-645 vocabulary. Visible-boundary `Button` only if you add a control (prefer a status chip/text, not a new ghost link). Do not collapse desktop tabs behind **More**. Do not start AS-062 stamp counts unless the same component already lists counts — stay on the finding row.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: Working findings desk shows SemanticSupportBand beside provenance for decision-grade rows. Checklist shows NotScored or omits with honesty. Do not make finalize a hard block. Do not add EngineType. Do not collapse desktop review tabs behind More.

Why: v11 Comprehension 82. ADR 0085 is invisible until the desk shows the word.

Read first:
- .cursor/prompts/architecture-spine-061-working-desk-band-with-provenance.md
- QR-28 field name on the finding DTO / generated TS
- Existing provenance chip/row on the Working findings desk (grep data-testid findings provenance)
- archlucid-ui AGENTS.md (TB-645, TB-2005, visible-boundary Button)

Work:

1. Confirm QR-28 field exists in generated api-types. If missing, stop.

2. Show the band on the decision-grade finding row next to provenance. data-testid=working-finding-semantic-support-band. Sentence case labels.

3. Unsupported must be visible (not only in inspect). Unchecked labeled as not yet scored, not as pass.

4. Vitest: decision-grade Supported/Unchecked/Unsupported render; checklist NotScored. No More-menu tab collapse.

5. Do not change finalize to block. Warn copy can wait for AS-064.

6. npm test scoped Vitest from archlucid-ui for the new tests.

Do not: AS-076 Career doors; fuse band into density; OpenAPI unless you must fix a type; push master.

Done when: Vitest proves the four bands render on Working finding rows.
```

**Done when:** desk shows the band. Stamp/finalize counts are **not** this prompt.

---

# QR-30 — AS-054 CI ratchet: no second Azure collector

**Closes:** v11 §17 item 8. Spine leftover after AS-046–AS-051.
**Depends on:** none (AS-046 shipped)
**Branch suggestion:** `cursor/qr-30-as-054-no-second-collector`

### Design intent

Tiny architecture test or script listing forbidden type names so a later PR cannot add a parallel ARM harvest client. Consume IE snapshot types. Comment already exists in `ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md`.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: CI ratchet that fails if this repo adds a second Azure inventory collector type (AS-054). Do not implement a collector. Do not add EngineType.

Why: v11 Correctness leftover. Naive implementers will harvest ARM inside the review API.

Read first:
- .cursor/prompts/architecture-spine-054-consume-ie-types-no-fork.md
- docs/library/ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md
- docs/library/INFRA_EVIDENCE_PLANE.md
- ArchLucid.Architecture.Tests patterns (ArchitectureReviewRobustnessArchitectureTests / AS-057 architecture tests)

Work:

1. Architecture test (own file) that greps or compiles against a forbidden-name list: new Get-ArchLucidAzurePackage clones, duplicate ArmClient harvest services under ArchLucid.Application/Decisioning for inventory bind. Expand names listed in the AS-054 prompt + contract.

2. Keep the human-readable forbid in ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md (already there) — add the test assembly path as the lock.

3. Compile Architecture.Tests. Do not run full solution.

Do not: fork a collector to prove the test; IE-01–IE-22 bodies; push master.

Done when: the architecture test fails CI if a forbidden collector type name is added.
```

**Done when:** fork collector would fail CI.

---

# QR-31 — `ga-starter` PCI DSS P1 exact-id slice

**Closes:** v11 §8 weakness 8 / §17 item 9. `pci-dss-architecture.json` advertises `pci-001`..`pci-010`. Mapped encryption/transit ids `pci-007` and `pci-009` are still **catalog stubs**. `pci-002`/`pci-003` already have real appliesToCategory.
**Depends on:** QR-12 HIPAA / QR-20 ISO pattern
**Branch suggestion:** `cursor/qr-31-pci-p1-ga-starter`

### Design intent

Option B, one framework. Exact-id only. Follow HIPAA (QR-12) and ISO (QR-20) slices: upgrade stub rows to production `appliesToCategory` / `requiredNodeType` / `requiredEdgeType` / P1, and keep `DeclarationSignalPolicyKeyMap` exact ids. Do not enable prefix-family matching. Do not author ~144 Option A rules. Do not redo `iso27001-010`–`025`.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: Option B PCI DSS P1 slice in ga-starter-compliance.rules.json so mapped ids pci-007 and pci-009 (and any other mapped PCI ids that are still stubs) can enable declaration themes at P1. Exact-id only. Do not prefix-family IsThemeEnabled. Do not add EngineType. Do not redo HIPAA or ISO slices.

Why: v11 Differentiability 87. HIPAA P1 and ISO P1 shipped. PCI pack still lists keys that cannot fire.

Read first:
- docs/quality/pp01-ga-starter-catalog-extension-scoping.md
- ArchLucid.Decisioning/Governance/PolicyPacks/DeclarationSignalPolicyKeyMap.cs (pci-002, pci-003, pci-007, pci-009)
- ArchLucid.Decisioning/Compliance/RulePacks/ga-starter-compliance.rules.json (pci-007 / pci-009 stubs vs pci-002 real rows; iso27001-010 P1 as the template)
- ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/pci-dss-architecture.json
- BundledPolicyPackDeclarationThemeTests / PolicyFilteredDeclarationGoldenCorpusTests
- docs/samples/policy-packs/pci-dss-architecture-rules-v1.json narrative (faithful controls only)

Work:

1. Upgrade stub PCI rows that are already mapped in DeclarationSignalPolicyKeyMap (pci-007 PAN encryption at rest, pci-009 TLS for PAN in transit). Match QR-20 ISO: real controlName, appliesToCategory, requiredNodeType/Edge, severity, priority P1, description that names the slice. Never map a control the classifier does not detect.

2. If pci-dss-architecture.json keys already include them, do not add prefix families. If a mapped id is missing from complianceRuleKeys, add the exact id only.

3. Extend BundledPolicyPackDeclarationThemeTests / PolicyFilteredDeclarationGoldenCorpusTests the same way QR-12/QR-20 did. Suite=Core.

4. Update pp01 scoping one-liner: PCI P1 slice shipped; ZTA remainder still open. Do not start Option A.

5. Compile + Decisioning.Tests filter for BundledPolicyPackDeclarationThemeTests and PolicyFilteredDeclaration.

Do not: IsThemeEnabled prefix; pack.curatedRules.v1 embed; ISO redo; ZTA in this prompt; push master.

Done when: mapped PCI encryption/transit ids are non-stub catalog rows and declaration theme tests prove they can enable at P1.
```

**Done when:** PCI mapped P1 ids are real catalog rows. ZTA is **not** this prompt.

---

# QR-32 — AS-066: support band must not fuse into the density gate

**Closes:** v11 §17 item 10. Protects Density from a bad merge after QR-28.
**Depends on:** QR-28
**Branch suggestion:** `cursor/qr-32-support-band-not-density-term`

### Design intent

`DeterministicInsightDensityGate` must not read `SemanticSupportBand`. Unsupported is a career honesty band, not a −25 evidence penalty. Architecture test lock.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: ratchet that DeterministicInsightDensityGate and InsightDensityDemotionPredicate do not consume SemanticSupportBand / FindingSemanticSupportBand. Do not change DemotionThreshold. Do not add EngineType.

Why: ADR 0085 / AS-066. Fusing the band would relabel density without new information.

Read first:
- .cursor/prompts/architecture-spine-066-do-not-fuse-insight-density.md
- ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs
- ArchLucid.Decisioning/Findings/FindingSemanticSupportBand.cs
- QR-28 property name

Work:

1. Architecture test (own file) asserting those gate files do not contain SemanticSupportBand / FindingSemanticSupportBand / support-band penalty reasons.

2. If QR-28 accidentally passed the band into the gate, remove that coupling — band stays overlay.

3. Compile Architecture.Tests.

Do not: lower DemotionThreshold; restore typed-engine-protected; push master.

Done when: CI fails if the gate starts scoring the support band.
```

**Done when:** fuse would fail CI.

---

# QR-33 — AS-058 consume Lane B support-ratio when present

**Closes:** v11 §17 item 11. Optional enqueue already exists (RAG-V1-005 / TB-1228 Lane B). Working should display it when the row is there.
**Depends on:** QR-28 (band on the wire)
**Branch suggestion:** `cursor/qr-33-lane-b-support-ratio-honesty`

### Design intent

If a support-ratio / faithfulness async row already exists, map it into the band when present. Missing async row → Unchecked, not Supported. Do not make the job blocking on execute. Honesty copy: “async, may lag.” No new worker type.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: when a Lane B support-ratio / faithfulness row already exists for a finding, consume it into SemanticSupportBand. Missing row stays Unchecked. Do not block execute. Do not start a second eval stack. Do not add EngineType. Do not flip AgentExecution:Mode.

Why: v11 AI 78. Lane B already exists. AS-058 leftover.

Read first:
- .cursor/prompts/architecture-spine-058-async-support-ratio-job.md
- docs/library/FAITHFULNESS_SUPPORT_RATIO_SCORING_LANE_POSITIONING_CONTRACT.md
- TB-1228 / RAG-V1-005 existing enqueue + storage types (grep support-ratio, faithfulness)
- QR-28 stamp point

Work:

1. Find the existing Lane B result type. If none is persisted per finding, document that in a short contract comment and add tests that missing row → Unchecked. Do not invent a new jobs CLI.

2. If a row exists, map into Supported/Unsupported/Unchecked per existing Lane B semantics. Heuristic scorer remains the sync default when Lane B is absent.

3. Honesty: desk or payload flag that async may lag (QR-29 chip subtitle is enough if QR-29 already merged; otherwise a DTO field comment + test).

4. Tests: missing async row → not Supported; present Lane B mismatch → Unsupported. Execute path does not await a new job.

5. Compile scoped Decisioning + any UI Vitest if you touch the chip.

Do not: new worker; LLM judge default-on; G-REAL-06; push master.

Done when: execute latency unchanged; missing Lane B cannot become Supported.
```

**Done when:** missing async row is Unchecked; execute does not wait on a new job.

---

# QR-34 — Re-record `insight-density-engine-distribution.md` after QR-26/27

**Closes:** v11 §17 item 12. Honesty only.
**Depends on:** QR-26 (prefer QR-27 too)
**Branch suggestion:** `cursor/qr-34-distribution-after-67-band`

### Design intent

Do not hand-edit cells. Pass `PriorGraphFixture`. Do not add `EngineType`. Do not invent EvidenceRefs here — if No evidence remains, the table should say so.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: re-record docs/quality/insight-density-engine-distribution.md from the current golden corpus through LatestGoldenCorpusCaseNumber. Pass PriorGraphFixture. Do not add EngineType. Do not hand-edit score numbers.

Why: v11 density leftover citations (QR-26/27) will not change the assessment table until this record runs.

Read first:
- ArchLucid.Decisioning/Findings/GoldenCorpusHarnessEngineRegistration.cs
- InsightDensityEngineDistributionMarkdown / Record_distribution_markdown_when_env_flag_set
- docs/quality/insight-density-engine-distribution.md
- docs/architecture/INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md PriorGraphFixture reminder

Work:

1. Confirm QR-26 is on this branch (dr-rpo / sku-tier EvidenceRefs). Prefer QR-27 too. If not, stop.

2. ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION=1
   dotnet test ArchLucid.Decisioning.Tests --filter FullyQualifiedName~Record_distribution_markdown_when_env_flag_set
   Pass PriorGraphFixture the same way DX-73 / QR-24 did.

3. Do not type cells. Commit only the generated markdown (and test snapshot if any).

Do not: ARCHLUCID_RECORD_DECISIONING_GOLDEN on the factory materializer; add EngineType; push master.

Done when: the markdown header matches LatestGoldenCorpusCaseNumber and leftover engine No evidence columns reflect QR-26/27.
```

**Done when:** markdown regenerated, not typed.

---

# QR-35 — Triage full `ci.yml` matrix on one trunk SHA

**Closes:** v11 §8 weakness 9 / §17 item 13. Last full `workflow_dispatch` **2026-08-28** `33193938737` failed. Newest PR-lane reds (not OpenAPI): docs link integrity, pre-corset guards, Azure extractor Pester.
**Depends on:** `#2689` merged; prefer after QR-28 OpenAPI regen
**Branch suggestion:** `cursor/qr-35-ci-yml-matrix-triage`

### Design intent

Owner-dispatch the workflow. Composer triages **existing** reds into the smallest honest fixes or a written “hold, not this SHA” note. Do not batch with golden emission. Do not pretend a green typecheck is a green full matrix.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: dispatch or inspect the latest full ci.yml matrix on current master (after #2689 merge) and fix only cheap, in-contract reds that are still red on that SHA. Do not start DX-77. Do not fake Gate 1. Do not enable merge queue (owner).

Why: v11 Runtime 77. OpenAPI fail-fast is already green. Full matrix is a month stale. PR-lane failures on AS-057/#2689 included Docs: link integrity, CI: guards pre-corset (text), Azure extractor Pester — triage those first if they reproduce on master.

Read first:
- .github/workflows/ci.yml
- docs/architecture/V9_QUALITY_ROI_COMPOSER_PROMPTS.md QR-13 (do not re-do emission work)
- gh run list --workflow ci.yml --branch master --limit 8
- Failed job logs for docs markdown link integrity, guards pre-corset, Get-ArchLucidAzurePackage Pester

Work:

1. If a full matrix has not been dispatched on current master after #2689, say so and dispatch only if the environment allows workflow_dispatch. Do not watch indefinitely.

2. Classify each red: (a) cheap docs/guard/script fix in this PR, (b) known flake, (c) blocked on owner/infra. Fix only (a).

3. Do not disable required checks. Do not skip Suite=Core to go green.

4. Record the run URL and SHA in the PR body.

Do not: merge_queue apply; G-REAL-06; push master as the agent; batch golden re-records into this PR.

Done when: either the inspected matrix is green on that SHA, or the PR lists remaining reds with owners and does not hide them.
```

**Done when:** one trunk SHA has an honest matrix readout; cheap reds fixed or explicitly held.

---
