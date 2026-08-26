> **Scope:** Copy-paste Composer prompts that make tenant policy packs parameterize **coverage and cost engines** — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Shipped (do not re-run):** declaration signal gating on `master` (`DeclarationSignalPolicyKeyMap` + prefix family, commit `0a5a4e31fd`) · **Predecessor:** [`INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md) ID-09 / ID-10

# Policy-pack expectation parameterization — Composer prompts (PP-02–PP-05)

**Created:** 2026-08-26 · **Status:** ready to run on feature branches.

**PP-01 is shipped on `master`.** Do **not** re-run declaration-theme mapping. Compliance + declaration-security + declaration-premise-conflict already honor tenant `complianceRuleKeys` (CIS Azure/AWS/GCP, SOC 2, GDPR, HIPAA, ISO, PCI, ZTA, AKS/EKS/GKE). Fail-open remains for FinOps / AI-gov / DORA / OTel / sustainability prefixes.

These prompts close the *next* mechanism: **expectation parameterization**. Coverage engines today derive "what should exist" from graph heuristics (`TopologyExpectedCategoryResolver`, `WorkloadConditionedSecurityControlFamilyResolver`, `WorkloadConditionedRequirementExpectationResolver`). A tenant standard cannot add required categories, control families, or budget rules.

## Why this is not "make all 39 engines policy-aware"

Policy configures **expectations**. It must not mute the **record of commitments**.

| Kind | Engines | These prompts? |
|------|---------|----------------|
| Rule-set selection | `compliance` | Already shipped |
| Signal gating | `declaration-security-baseline`, `declaration-premise-conflict` | Already shipped (PP-01) |
| Expectation parameterization | topology / security / requirement coverage family | **PP-02–PP-04** |
| Threshold / severity | `cost-breach`, `cost-constraint` | **PP-05** |
| Commitment / history (stay pack-independent) | `open-commitment`, `portfolio-recurrence`, `*-cross-run-diff` | **Never** — a pack must not hide overdue waivers or review diffs |

Do **not** create a pack-per-engine. Facets live on the packs buyers already assign (SOC 2, CIS Azure). One pack, many consuming engines.

## Sequencing

| Prompt | Title | Parallel? | Depends on |
|--------|-------|-----------|------------|
| **PP-02** | Design note (additive floor, facet keys, engine list, non-goals) | First | none |
| **PP-03** | Parse `advisoryDefaults` keys, stamp onto graph, union in resolvers | No | PP-02 merged (or same branch if you just wrote the note) |
| **PP-04** | Prove coverage engines change findings; golden sibling | No | PP-03 |
| **PP-05** | Cost engines: require cap + optional severity | Yes with PP-04 if PP-03 landed | PP-03 |

**Run one prompt per chat.** Feature branch per prompt. Suggested Cloud Agent shape: `cursor/<short-name>-9750`. Name the branch in any commit/push request.

## Global constraints

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. Blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests.**
- Tenant isolation stays database-per-tenant (ADR 0037).
- Before editing tracked files, run `.\scripts\agent\check-working-tree-path.ps1` on those paths.
- Stage only files this prompt changes. **No `git add -A`.** Do **not** push to `master` unless the user named `master` in the same request.
- **No new `PolicyPackContentDocument` properties** in this set (no OpenAPI). Reuse `advisoryDefaults` string keys, same pattern as `priorityFloor`.
- **No new finding engine.** No pack-per-engine JSON. Do not edit `*-rules-v1.json` except optional `advisoryDefaults` examples in bundled pack *content* JSON if those files already have `advisoryDefaults` — prefer tests that inject a `PolicyPackContentDocument` in memory.
- Do **not** inject `IEffectiveGovernanceLoader` into individual coverage engines. Stamp once on the graph so `IFindingEngine.AnalyzeAsync` stays graph-in.
- **Additive floor:** a pack may **add** required categories / families / themes. It must **not** remove the heuristic baseline. Missing or blank keys = today's resolver behavior.
- Do not gate `open-commitment`, `portfolio-recurrence`, or `*-cross-run-diff`.
- Do not start **G-REAL-06**, SOC 2 CPA, or third-party pen test.
- One scoped compile per prompt; one retry on exit code 1.

---

# PP-02 — Design note for expectation facets

**Closes:** the next policy-pack step has no written contract, so a Composer chat will invent OpenAPI fields or suppress findings.
**Depends on:** none
**Branch suggestion:** `cursor/policy-expectation-facet-note-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: write a short engineering design note that defines how tenant policy packs parameterize coverage and cost engines without muting commitment/history engines. Docs only. No product-code behavior change except the new markdown file and an architecture-index bullet.

Why: PP-01 shipped declaration signal gating (cis-az / soc2 / hipaa / …). Coverage engines still compute "what should exist" from TopologyExpectedCategoryResolver and sibling workload-conditioned resolvers. CostBreachFindingEngine reads maxMonthlyCost only from CostConstraint nodes. The owner wants packs to drive those engines, but NOT via a pack-per-engine and NOT by filtering open-commitment or cross-run diffs.

Write docs/library/POLICY_PACK_EXPECTATION_FACET.md covering:

1. Five policy-awareness kinds (rule-set, signal gating, expectation parameterization, threshold/severity, commitment/history). Name which engines sit in each. Explicit non-goals: open-commitment, portfolio-recurrence, requirement-cross-run-diff, topology-cross-run-diff.

2. Additive floor: pack extras UNION heuristic baseline. A pack cannot drop Network/Compute/Storage/Data below TopologyExpectedCategoryResolver's result. Tests must prove a pack that lists only "identity" still keeps the heuristic pillars.

3. Facet encoding (V1, no OpenAPI): reserved advisoryDefaults keys (pipe-separated, ordinal ignore-case), matching priorityFloor:
   - expectation.topologyCategories.add
   - expectation.securityControlFamilies.add
   - expectation.requirementThemes.add
   - cost.requireBudgetCap (true/false)
   - cost.breachSeverity (Info|Warning|Error|Critical) — only when a breach finding would already emit

   Unknown keys ignored. Blank/missing = no change. Do not add PolicyPackContentDocument properties in V1. First-class JSON facet is a later contract change if these keys prove useful.

4. Graph stamp: FindingsOrchestrator (or a helper it calls once) loads IEffectiveGovernanceLoader for ambient scope, writes pipe-separated extras onto the ContextSnapshot node using new ContextGraphPropertyKeys. Coverage engines keep AnalyzeAsync(GraphSnapshot) with no extra DI.

5. Claim boundary for GTM: assigning SOC 2 / CIS can add required families; it does not mean all 39 engines are policy-aware.

6. Point DEFAULT_POLICY_PACKS_V1.md and docs/architecture/README.md at the note. Do not rewrite buyer "brain of the governance engine" into a lie — add one paragraph under Declaration-security coupling.

Do not:
- Change resolvers, orchestrator, or engines in this prompt.
- Regenerate OpenAPI.
- Touch archlucid-ui or SQL DDL.
- Create new bundled rule JSON.

Compile: none required (docs). If you touch no C#, skip agent-compile-check.

Done when: the note exists, is indexed, states additive floor and non-goals, and a reviewer can implement PP-03 from it without inventing an API field.
```

---

# PP-03 — Stamp pack extras onto the graph and union in resolvers

**Closes:** coverage resolvers ignore tenant packs, so topology/security/requirement "expected" sets are heuristic-only.
**Depends on:** PP-02 note on the branch (or recreate the key names above if the note is not merged yet — do not invent different key names)
**Branch suggestion:** `cursor/policy-expectation-resolver-9750`

### Design intent (read before prompting)

Keep engines graph-pure. Load governance once. Stamp. Resolvers UNION.

`advisoryDefaults` already merges across packs in `EffectiveGovernanceFacetMerger.ResolveDictionary`. Reuse that merged document.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: parse reserved PolicyPackContentDocument.advisoryDefaults keys, stamp extras onto the ContextSnapshot graph node, and have topology / security-family / requirement-theme resolvers UNION those extras with the existing heuristic baseline. Additive floor. No OpenAPI. No new finding engine. Coverage engines should not gain IEffectiveGovernanceLoader.

Why: TopologyCoverageFindingEngine, SecurityCoverageFindingEngine, SecurityGapFindingEngine, SecurityBaselineCompletenessFindingEngine, RequirementExpectationFindingEngine, RequirementCoverageFindingEngine, RequirementGapFindingEngine, and RequiredCapabilityCoverageFindingEngine all read expected sets from graph-derived resolvers. A tenant assigning CIS Azure or SOC 2 cannot require Identity or DataProtection families beyond the heuristic. That is the remaining "packs don't drive the review" gap for coverage.

Read first:
- docs/library/POLICY_PACK_EXPECTATION_FACET.md (if present; else use the key names in this prompt)
- ArchLucid.Contracts/Governance/PolicyPackContentDocument.cs (AdvisoryDefaults only)
- ArchLucid.Core/Governance/PolicyPacks/PolicyPackRulePriority.cs (priorityFloor key precedent)
- ArchLucid.Decisioning/Governance/Resolution/EffectiveGovernanceFacetMerger.cs
- ArchLucid.Core.Persistence.Ports.IEffectiveGovernanceLoader (or Decisioning wrapper)
- ArchLucid.Decisioning/Services/FindingsOrchestrator.cs
- ArchLucid.KnowledgeGraph/ContextGraphPropertyKeys.cs
- ArchLucid.Decisioning/Analysis/TopologyExpectedCategoryResolver.cs
- ArchLucid.Decisioning/Analysis/WorkloadConditionedSecurityControlFamilyResolver.cs
- ArchLucid.Decisioning/Analysis/WorkloadConditionedRequirementExpectationResolver.cs
- ArchLucid.KnowledgeGraph/GraphTopologyCategories.cs
- SecurityControlFamilies (find the canonical constants)

Work:

1. ArchLucid.Core/Governance/PolicyPacks/PolicyPackExpectationAdvisoryKeys.cs — public const strings:
   - TopologyCategoriesAdd = "expectation.topologyCategories.add"
   - SecurityControlFamiliesAdd = "expectation.securityControlFamilies.add"
   - RequirementThemesAdd = "expectation.requirementThemes.add"
   - CostRequireBudgetCap = "cost.requireBudgetCap"
   - CostBreachSeverity = "cost.breachSeverity"
   XML-comment: pipe-separated values; unknown tokens ignored; blank = absent.

2. ArchLucid.Core/Governance/PolicyPacks/PolicyPackExpectationFacetParser.cs — public static class, own file.
   Parse(PolicyPackContentDocument? effective) → a small immutable record PolicyPackExpectationFacet (own file) with IReadOnlyList<string> extra topology categories, extra security families, extra requirement themes, bool? requireBudgetCap, string? breachSeverity.
   Split on '|', trim, drop empty, ordinal ignore-case distinct.
   Validate topology tokens against GraphTopologyCategories (skip unknown; do not throw).
   Validate security family tokens against SecurityControlFamilies (skip unknown).
   Requirement themes are free strings already used by WorkloadConditionedRequirementExpectationResolver (traceability, availability, data-protection, identity-access, network-isolation, compliance) — accept those plus unknown extras (unknown extras still UNION; engines that don't map a theme simply won't match).
   requireBudgetCap: true/false/1/0/yes/no; invalid → null.
   breachSeverity: parse FindingSeverity names; invalid → null.
   Null effective or empty AdvisoryDefaults → empty facet (all lists empty, nulls).

3. ArchLucid.KnowledgeGraph/ContextGraphPropertyKeys.cs — add:
   - PolicyExpectedTopologyCategories
   - PolicyExpectedSecurityControlFamilies
   - PolicyExpectedRequirementThemes
   Pipe-separated, same style as PriorTopologyCategories.

4. ArchLucid.Decisioning/Governance/PolicyPacks/PolicyExpectationGraphStamp.cs — public static class.
   Stamp(GraphSnapshot graph, PolicyPackExpectationFacet facet): find ContextSnapshot node; if missing, create nothing and return (resolvers already handle missing context). Write only non-empty lists. Do not delete existing heuristic properties (requiredCapabilities / topologyHints / constraints). Do not clone the whole graph unless tests require immutability — document whether you mutate the node Properties dictionary in place (orchestrator owns the snapshot for the run; mutating is OK if tests don't share snapshots across postures without cloning).

5. FindingsOrchestrator.GenerateFindingsSnapshotAsync: before invoking engines, resolve ambient scope via IScopeContextProvider if already available in this class's DI graph; load IEffectiveGovernanceLoader; parse; stamp. If IScopeContextProvider / IEffectiveGovernanceLoader are not currently constructor-injected on FindingsOrchestrator, add them. Fail-open on loader exceptions: log and continue with unstamped graph (do not fail the review). Empty facet = no stamp.

   Composition: update ServiceCollectionExtensions.Decisioning registration if the orchestrator constructor grows. Do not register a second orchestrator.

6. Resolver UNION (heuristic first, then extras):
   TopologyExpectedCategoryResolver.ResolveExpectedCategories: after computing `expected` HashSet as today, if the context node has PolicyExpectedTopologyCategories, add each token that is a known GraphTopologyCategories value. Same order-by as today.
   WorkloadConditionedSecurityControlFamilyResolver: UNION PolicyExpectedSecurityControlFamilies.
   WorkloadConditionedRequirementExpectationResolver: UNION PolicyExpectedRequirementThemes.

   CRITICAL: do not let extras REPLACE the heuristic set. A test with extras=["identity"] on a default graph must still include network/compute/storage/data (or whatever the heuristic produced).

7. Tests (no ConfigureAwait(false), concrete types, null checks):
   - Parser: missing keys; pipe split; unknown topology token skipped; requireBudgetCap true/false; bad severity → null.
   - Resolver unit tests: stamp identity extra → Identity present AND default pillars still present.
   - Security family extra DataProtection on a graph that wouldn't add it → present plus defaults.
   - Orchestrator: mock loader returning a document with topology extra; after GenerateFindingsSnapshotAsync, context node has the property. Mock loader throwing → snapshot still generated (fail-open).
   - Existing TopologyExpectedCategoryResolverTests / WorkloadConditioned* tests still pass (no stamp → identical results).

Do not:
- Add PolicyPackContentDocument properties or regenerate OpenAPI.
- Change ComplianceRulePackGovernanceFilter or DeclarationSignalPolicyKeyMap.
- Filter open-commitment or cross-run engines.
- Touch archlucid-ui, SQL DDL, or bundled *-rules-v1.json.
- Push to master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~PolicyPackExpectation|FullyQualifiedName~TopologyExpectedCategory|FullyQualifiedName~WorkloadConditioned|FullyQualifiedName~PolicyExpectationGraphStamp|FullyQualifiedName~FindingsOrchestrator"

Done when: a PolicyPackContentDocument with advisoryDefaults expectation.topologyCategories.add=identity stamps the graph and TopologyExpectedCategoryResolver returns the heuristic set PLUS identity; blank advisoryDefaults leaves resolver output unchanged; OpenAPI snapshot unchanged.
```

---

# PP-04 — Coverage-engine golden sibling

**Closes:** resolver UNION can exist while topology-coverage findings stay the same if tests only hit resolvers.
**Depends on:** PP-03
**Branch suggestion:** `cursor/policy-expectation-coverage-golden-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add a Suite=Core golden-style test that runs TopologyCoverageFindingEngine (and SecurityCoverageFindingEngine) twice on one fixed graph with two stamped expectation postures and asserts findings differ. Do not change GoldenCorpusHarness.CreateEngines(). No OpenAPI. No new engine.

Why: PP-03 unions extras in resolvers. Buyers and CI need proof that assigning a pack extra actually changes coverage findings, the same way PolicyFilteredDeclarationGoldenCorpusTests proved declaration gating.

Read first:
- ArchLucid.Decisioning.Tests/GoldenCorpus/PolicyFilteredDeclarationGoldenCorpusTests.cs (shape to copy)
- ArchLucid.Decisioning/Services/TopologyCoverageFindingEngine.cs
- ArchLucid.Decisioning/Services/SecurityCoverageFindingEngine.cs
- ArchLucid.Decisioning/Analysis/TopologyExpectedCategoryResolver.cs
- ArchLucid.KnowledgeGraph/ContextGraphPropertyKeys.cs
- docs/quality/policy-filter-golden-delta.md
- docs/library/DECISIONING_GOLDEN_CORPUS.md

Work:

1. Helper: clone or build a graph with TopologyResource nodes in network+compute only (no storage, no data, no identity), plus a ContextSnapshot node. Heuristic with empty hints should still expect storage/data (DefaultExpected includes all four pillars) — so baseline already warns missing storage/data. Then posture B stamps PolicyExpectedTopologyCategories=identity so the engine also reports missing identity.

   If DefaultExpected already includes four pillars, posture A (no stamp) missing categories = storage+data (and maybe others). Posture B missing includes identity as well. Assert identity appears in B's payload/MissingCategories and not in A's.

2. ArchLucid.Decisioning.Tests/GoldenCorpus/PolicyExpectationCoverageGoldenCorpusTests.cs
   - Suite=Core
   - Run TopologyCoverageFindingEngine (inject IGraphCoverageAnalyzer as production does — GraphCoverageAnalyzer).
   - Posture A: unstamped graph.
   - Posture B: same graph cloned, stamp identity extra via PolicyExpectationGraphStamp.
   - Assert B's topology-coverage finding MissingCategories contains identity; A's does not.
   - Poison: if resolver ignored the stamp, B would match A — this test fails.

3. Optional second fact: SecurityCoverageFindingEngine with extra family DataProtection on a graph without data/storage heuristic extras.

4. docs/quality/policy-filter-golden-delta.md (or docs/quality/policy-expectation-coverage-delta.md) — table of postures. claimBoundary: coverage extras are additive; open-commitment still pack-inert; not all 39 engines.

5. One sentence in docs/library/DECISIONING_GOLDEN_CORPUS.md pointing at this sibling.

Do not:
- Expand CreateEngines() to all 39 engines.
- Change production filter/declaration maps.
- Push to master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~PolicyExpectationCoverageGoldenCorpus|FullyQualifiedName~TopologyCoverage"

Done when: two postures of one graph produce different topology-coverage missing-category sets, and the six-engine harness snapshots are untouched.
```

---

# PP-05 — Cost engines honor pack threshold / required cap

**Closes:** CostBreachFindingEngine only compares spend to the architect's own CostConstraint cap; a tenant standard cannot require a cap or raise breach severity.
**Depends on:** PP-03 (stamp/parser already knows cost.requireBudgetCap and cost.breachSeverity)
**Branch suggestion:** `cursor/policy-expectation-cost-9750`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make CostConstraintFindingEngine and CostBreachFindingEngine honor stamped pack extras: (1) if cost.requireBudgetCap is true and the graph has topology/workload nodes but no CostConstraint with maxMonthlyCost, emit a finding that a budget cap is required; (2) if cost.breachSeverity is set and a breach would already emit, use that severity instead of the hard-coded Error. Additive: missing keys = today's behavior. No OpenAPI. No new engine type id unless you must — prefer reusing cost-constraint / cost-breach EngineType values.

Why: CostBreachFindingEngine.TryCreateBreachFinding returns null when maxMonthlyCost is absent, and severity is always Error when it fires. A FinOps pack (cost-opt-*) or a tenant overlay cannot require a declared cap or treat a 20% overrun as Critical. That is expectation/threshold policy, not signal gating.

Read first:
- ArchLucid.Capabilities.Cost/CostBreachFindingEngine.cs
- CostConstraintFindingEngine (find in ArchLucid.Capabilities.Cost or Decisioning)
- PolicyPackExpectationFacet / PolicyPackExpectationAdvisoryKeys from PP-03
- ContextGraphPropertyKeys (add PolicyCostRequireBudgetCap and PolicyCostBreachSeverity if not stamped yet — PP-03 parser already has the fields; PP-03 stamp may only have written category lists. If stamp does not yet write cost keys, extend PolicyExpectationGraphStamp in this prompt.)
- BuiltInFindingEngineTypeCatalog
- Existing cost engine tests

Work:

1. Extend PolicyExpectationGraphStamp to write:
   - PolicyCostRequireBudgetCap = "true" when facet.requireBudgetCap == true (omit when null/false so today's path stays)
   - PolicyCostBreachSeverity = enum name when set

2. CostConstraintFindingEngine (or a small helper it calls): if requireBudgetCap stamped true, and no CostConstraint node has a parseable maxMonthlyCost, emit one Warning (or Error if you can justify) finding Type CostConstraintFinding / EngineType cost-constraint with a stable title like "Policy requires a monthly budget cap". RelatedNodeIds = topology nodes or context node. Do not emit this when requireBudgetCap is absent.

3. CostBreachFindingEngine: when creating a breach finding, if PolicyCostBreachSeverity is a parseable FindingSeverity, use it; else keep Error. Do not invent breaches that today's logic would not emit. Do not let a pack lower severity below Warning if you can avoid it — document the choice: allow Info only if FindingSeverity.Info already exists and tests cover it; otherwise clamp to Warning minimum so packs cannot hide breaches as Info. PREFERRED: clamp minimum to Warning. Packs may raise Error → Critical.

4. Tests:
   - No stamp → identical to today's cost tests.
   - requireBudgetCap true, no cap node, has topology → one new finding.
   - requireBudgetCap true, cap present → no "required cap" finding.
   - breach with stamp Critical → severity Critical.
   - breach with stamp Info → still Warning (clamp).
   - cost-opt-001 as a compliance rule id must NOT be required; this path is advisoryDefaults, not DeclarationSignalPolicyPrefixFamily.

5. Docs: DEFAULT_POLICY_PACKS_V1.md one paragraph that FinOps packs can set cost.requireBudgetCap / cost.breachSeverity in advisoryDefaults. FINDING_ENGINE_OUTPUT_REFERENCE.md cost rows. claimBoundary: still not all 39 engines.

Do not:
- Filter open-commitment.
- Add OpenAPI fields.
- Change declaration maps.
- Push to master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Also compile/test the cost test project if CostBreachFindingEngine tests live outside Decisioning.Tests — find them with a search and run that csproj too (one compile check for the primary project; extra test run is OK).

Done when: a stamped requireBudgetCap graph without a cap emits a cost-constraint finding; a breach can be raised to Critical; unstamped graphs match prior tests; OpenAPI unchanged.
```

---

## Out of scope (do not write prompts for these)

- Pack-per-engine catalogs (`topology-coverage-pack.json`). Facets on SOC 2 / CIS / FinOps packs instead.
- Gating `OpenCommitmentFindingEngine`, `PortfolioRecurrenceFindingEngine`, `RequirementCrossRunDiffFindingEngine`, `TopologyCrossRunDiffFindingEngine`.
- Making inventory reconciliation engines (`orphaned-*-resource`, `*-inventory-reconciliation`) policy-aware in this batch — they are effectful extractor comparisons; treat as a later design if needed.
- `SecurityBaselineFindingEngine` Info-row suppression (old PP-02 in the declaration file). Low buyer signal.
- First-class `PolicyPackContentDocument` JSON facet (OpenAPI + client regen). Revisit after PP-03–PP-05 prove the `advisoryDefaults` keys.
