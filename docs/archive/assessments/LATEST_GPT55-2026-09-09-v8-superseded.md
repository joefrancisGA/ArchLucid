# ArchLucid Strategic Release and Market Readiness Assessment (v8)

**Pass date:** 2026-09-09, **16:25–16:45 UTC (v8)**. **Computed fresh** — no carry-forward, no score deltas, no rescore ratchet. The v7 pass (2026-08-27) is superseded by this document and is **not** canonical. v7 is archived at [`../archive/assessments/LATEST_GPT55-2026-08-27-v7-superseded.md`](../archive/assessments/LATEST_GPT55-2026-08-27-v7-superseded.md).

## v8 pass note — the analysis finally moved; the trunk that proves it does not compile

This pass was requested after the **DX-01–DX-76** insight-density program landed (last batch `#2530`, 2026-09-09). The question was whether Decision-Changing Insight Density is still the weakest quality. **It is — by weighted deficiency — but for a different reason than v7.** v7's ceiling was architectural (`typed-engine-protected` discarded the computed score). That ceiling is gone: ADR 0070 makes typed-engine findings **scored** (`typed-engine-scored`, `DeterministicInsightDensityGate.cs:137`) and demotable under the same DX-01 predicate as agent findings. The golden harness registers **42 of 53** catalog engines (v7: 14 of 39) across **69** corpus cases, and declaration-fed path engines (`identity-blast-radius`, `data-flow-trust-boundary`, `segmentation-semantics`) now produce findings on IaC-only input for Azure, AWS, and GCP.

What has **not** moved is proof. Zero real-mode pilot runs (**G4 HOLD**, 0 of 3). The frontier-delta harness is an offline regression instrument over hand-authored fixtures (`tests/eval-corpus/insight-density-frontier-capture/synthetic-highly-novel.json`; the summary file says so in its own footer). And **as of the newest completed push corset on `master` (run [34376757704](https://github.com/joefrancisGA/ArchLucid/actions/runs/34376757704), 16:26 UTC), `ArchLucid.Decisioning.Tests` does not compile** — `GoldenCorpusIngestDeclarationGraphFactory.cs(491)` calls the two-argument `DefaultGraphBuilder` constructor that **AS-017 `#2563`** replaced with a three-argument one. The golden corpus that is the only checked-in evidence of the density gains cannot currently be executed from trunk.

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Claude (Fable 5.1) as a Cursor cloud agent, code-grounded desk review; **no live Azure OpenAI call was made during this pass**; no subagents were used for the assessment itself.

**Source materials inspected this pass:** GitHub rulesets API (`/rules/branches/master`), `gh run list` / `gh run view --log-failed` on `ui-typecheck-on-push.yml` and `ci.yml`, `gh pr view 2597`, `.github/workflows/ui-typecheck-on-push.yml`, `.github/workflows/ci.yml` (fast-core lanes), `.github/dependabot.yml`, `.github/rulesets/*.json`, `.github/BRANCH_PROTECTION.md`, `DeterministicInsightDensityGate.cs`, `InsightDensityGateEffectiveOptionsMerger.cs`, `DeclarationSignalPolicyKeyMap.cs` + `DeclarationSignalPolicyGate.cs` + `DeclarationSignalPolicyPrefixFamily.cs`, `BuiltInFindingEngineTypeCatalog.cs`, `GoldenCorpusHarness.cs` + `GoldenCorpusHarnessEngineInventory.cs`, `GoldenCorpusIngestDeclarationGraphFactory.cs` (on `origin/master`), `ArchLucid.KnowledgeGraph/Builders/DefaultGraphBuilder.cs` (on `origin/master`), `tests/golden-corpus/decisioning/`, `docs/quality/insight-density-engine-distribution.md`, `docs/quality/insight-density-frontier-delta.md`, `docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`, `docs/go-to-market/GTM_BACKLOG.md`, `docs/go-to-market/CLAIM_READINESS_STATUS.md`, `docs/library/TECH_BACKLOG.md` (open-count header), `scripts/ci/check_insight_density_advisory_surfaces.py`, `scripts/ci/check_assessment_score_consistency.py`.

## Executed this pass (runtime evidence, not doc claims)

| # | Command / observation | Result |
|---|---|---|
| 1 | `gh api repos/…/rules/branches/master` → `required_status_checks[].context` | **Five** required contexts: `cohort-real-llm-gate`, `Security: gitleaks (secret scan)`, `.NET: fast core (corset)`, `Operator UI: typecheck (blocking)`, `CI: beta-readiness wiring guards`. Rule types: `required_status_checks`, `non_fast_forward`, `copilot_code_review`. **No `merge_queue` rule.** |
| 2 | `gh run list --workflow ui-typecheck-on-push.yml --branch master --limit 30` | **27 cancelled · 2 failure · 1 in progress → completed failure.** Newest completed run [34376757704](https://github.com/joefrancisGA/ArchLucid/actions/runs/34376757704) (16:26 UTC): gitleaks ✓, UI typecheck ✓, UI jwt-bearer build ✓, **`.NET: push corset` ✗, `.NET: OpenAPI v1 contract snapshot` ✗, `CI: beta-readiness wiring guards` ✗**. Same three failures on [34361964714](https://github.com/joefrancisGA/ArchLucid/actions/runs/34361964714) (14:11 UTC) and [34361361678](https://github.com/joefrancisGA/ArchLucid/actions/runs/34361361678) (14:05 UTC). Every run between is concurrency-cancelled. |
| 3 | `gh run view 34361964714 --log-failed` (push corset) | `ArchLucid.Core.Tests` **4557 passed**; then `error CS7036: … required parameter 'structuredDiagramGraphMerger' of 'DefaultGraphBuilder.DefaultGraphBuilder(IGraphNodeFactory, IGraphEdgeInferer, StructuredDiagramGraphMerger)'` at `ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusIngestDeclarationGraphFactory.cs(491,39)`. |
| 4 | `git show origin/master:…/GoldenCorpusIngestDeclarationGraphFactory.cs` line 491 · `git log origin/master -- ArchLucid.KnowledgeGraph/Builders/DefaultGraphBuilder.cs` | Factory still calls `new(NodeFactory, new DefaultGraphEdgeInferer())`. Constructor gained `StructuredDiagramGraphMerger` in **`4e6ab618db` AS-017 (#2563, 2026-09-08)**. Each PR was green alone; the combination is red — a semantic merge conflict that PR-branch required checks cannot see. |
| 5 | `gh run view … --log-failed` (beta-readiness guards) | `docs/quality/insight-density-engine-distribution.md: missing marker 'typed-engine-protected'` — the guard `scripts/ci/check_insight_density_advisory_surfaces.py` still demands the pre-ADR-0070 marker; the DX-73 re-record (`#2530`) correctly changed the doc to `typed-engine-scored`. Guard/doc drift shipped by the density program itself. |
| 6 | `gh run view … --log-failed` (OpenAPI snapshot) | `OpenApiContractSnapshotTests.OpenApi_v1_json_is_backward_compatible_with_committed_snapshot` **FAIL** on both completed master runs today. |
| 7 | `gh run list --workflow ci.yml --branch master --limit 8` | **8 of 8 latest runs `failure`/`cancelled`** (2026-08-23 → 2026-08-28). Latest (33193938737) failing jobs include Docker build smoke, axe, Playwright mock, Lighthouse, `Operator UI: lint, typecheck, production build`, `Docs: markdown link integrity`, `.NET: fast core (corset)`, OpenAPI snapshot. The full matrix has not been green on trunk in the window inspected. |
| 8 | `gh pr view 2597 --json statusCheckRollup` (the newest merged PR) | 18 success · 16 skipped · **1 failure (`CI: guards pre-corset (text)`)** · plus `Docs: markdown link integrity` fail on the same run. Neither is required, so the PR merged. |
| 9 | `.github/workflows/ci.yml` lines 2412–2440 | `dotnet-fast-core-build` **path-skips** when `ci-path-lanes.outputs.run_dotnet != 'true'` and still reports success — the required `.NET: fast core (corset)` context is satisfiable by a PR that never compiles .NET. |
| 10 | `DeterministicInsightDensityGate.cs` | Penalties: generic −35, no-evidence −25, no-anchor −15 / weak-anchor −8 (DX-72), duplication −15/−30; bonuses: inventory +10, line-anchored doc +5, falsifiability +10, severity ≥ Error +5, cross-engine corroboration +10, impact witness +5/+10. **Line 137:** `typed-engine-scored` for non-agent findings; **no promote bypass**. Demotion via `InsightDensityDemotionPredicate.ShouldDemote(score, threshold, generic, falsifiable, evidence)`. |
| 11 | `InsightDensityGateEffectiveOptionsMerger.ApplyExecutionModePolicy` | In **Real** mode: `EnableLlmJudge`, `EnableLlmJudgeForEngineFindings`, `EnableInsightGenerator`, `PreferHighNoveltyEngines`, `PreferHighVerificationEngines` are **on unless the tenant opts out** (DX-02 / DX-57). Simulator/offline: always off. `EnableProseAssumptionExtraction` Real-mode default-on is on open PR **#2594**, **not** on `master`. |
| 12 | `BuiltInFindingEngineTypeCatalog.cs` · `GoldenCorpusHarnessEngineInventory.cs` · `tests/golden-corpus/decisioning/` | **53** catalog engines · **42** registered in the harness · **11** absent-with-reason · **69** cases (`case-01`…`case-69`). |
| 13 | `docs/quality/insight-density-engine-distribution.md` | **23** engines emit ≥1 finding on the corpus; **47** findings; score bands **65 / 67 / 72 / 82 / 100**; `WouldDemoteAt65Count` = **0** for every engine. `security-baseline` contributes **10 of 47** findings, all at exactly **65** with `No evidence = 10`, `No anchor = 10` — they clear the `< 65` demotion threshold only because of the +5 severity bonus. |
| 14 | `DeclarationSignalPolicyKeyMap.cs` | `ThemeToRuleIds` now maps **18** non-`cis-az` rule ids (`cis-aws-*`, `cis-gcp-*`, soc2/gdpr/hipaa/iso27001/pci family); `IsThemeEnabled` is still exact-id, but the map is no longer CIS-Azure-only. v7's "SOC 2-only pack fail-closes declaration themes" is **stale** (PP-01 shipped). |
| 15 | `docs/quality/insight-density-frontier-delta.md` · `tests/eval-corpus/insight-density-frontier-capture/` | Rollup PASS on three fixtures (`empty-baseline`, `highly-novel`, `mostly-duplicate`) — files are `synthetic-highly-novel.json` and `pilot-pending-idle.json`. Footer: "Offline eval-corpus fixtures only … not evidence that ArchLucid beats any named frontier model." |
| 16 | `CLAIM_READINESS_STATUS.md` gate table | **G4 HOLD — 0 of 3** qualifying real runs (G-REAL-06 / G-REAL-07 / M-39 all **Not started**). |
| 17 | `.github/dependabot.yml` | nuget / npm / terraform now have `groups` and `ignore: version-update:semver-major` — v7 weakness #3 **closed**. |
| 18 | `TECH_BACKLOG.md` header · `GTM_BACKLOG.md` | **25** unique open TB rows (P0 0 · P1 2 · P2 15 · P3 8); **44** GTM rows marked *Not started*. |

**Verified counts this pass:** **53** catalog engines; **42** harness engines; **69** golden cases; **5** required status contexts; **0** real-mode pilot runs; **0** merge-queue rules.

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows plus owner-decision items surfaced in the DX program closeout. Excludes GTM V1.1 items **#2/#3/#5/#6** (**M-90**/**M-44**/**M-91**/**M-92**) per standing exclusion rule. **G-REAL-05** / **G-ASSURANCE-02** are omitted here because they do not gate anything in this pass and do not reduce `(A)`.

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|-----------------|--------------------|--------------------|
| 1 | **Decide the trunk gate model** — enable GitHub **merge queue** on `master` (or a required post-merge trunk corset that blocks the *next* merge) | Today's break (AS-017 × DX-73 golden factory) passed every required check because required checks run on the PR branch, not the merge result. This is the second cycle in a row where an unbuildable state reached `master` under an active ruleset. Owner-only ruleset change. | Partial — an agent can draft the ruleset JSON and `BRANCH_PROTECTION.md` update | **Composer** — mechanical config once the owner decides |
| 2 | **Gate 1** — one observed end-to-end first review on staging (`archlucid pilot ship-gate-evidence --run-id <guid>`) | Still the only **UNKNOWN** numbered ship gate. Nothing in the density program substitutes for one observed create → execute → commit → manifest. | Partial — Opus can triage failures | **Owner + Opus** |
| 3 | **G-REAL-06** — three real-mode pilot runs (`scripts/Run-GReal06ProofRuns.ps1`) | Largest commercial uncertainty and the **only** way the density pillar moves from mechanism to proof. Depends on #2 for confidence, not for execution. | Partial | **Opus** |
| 4 | **Owner decision: Azure inventory extractors as first-review default** (soft prompt vs hard gate vs wizard step; pilot-tenant scope) | Owner said **Y** on 2026-09-09 but did not specify the intake shape. Live inventory is the single largest remaining first-review density lever per `INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`; it is blocked on this decision, not engineering. | Yes — once shaped, the intake batch is agent work | **Sonnet** for the intake batch |
| 5 | **G-REAL-07** — proof packets + run-log rows | Depends on #3. | Partial | **Sonnet** |
| 6 | **M-39** — apply proof-packet checklist, ≥3 G4 rows | Depends on #5. | Partial | **Sonnet** |
| 7 | **Owner decision: TB-883 Graph-RAG ablation budget cap + tenant cohort** | Approved 2026-09-09 with budget **TBD**; cannot start without a monthly AOAI cap. | Yes — ablation plan is agent-draftable | **Sonnet** |
| 8 | **M-07** — polished operator screenshots | Unblocked (UI typecheck + jwt-bearer build green on trunk). | Partial | **Composer** |
| 9 | **M-16** — demo video (run **G-REAL-09** first) | Depends on #8. | Partial | **Sonnet** |
| 10 | **G-COMMERCE-01 / M-94** — invoice/SOW commercial readiness | Blocks first invoice; independent of the above. | No — human only | N/A — human only |

**Shipped since v7 (do not re-open):** ruleset now requires five contexts; Dependabot grouping + major ignore; AGENTS.md Release note + `assert_single_npm_dependency_version.py`; `legacy-peer-deps` removal; DX-51–DX-76 (ADR 0070 typed-engine scoring, 42-engine harness, AWS/GCP IAM path edges, parse-through data-flow / segmentation goldens, distribution re-record through `case-69`); PP-01 core (declaration theme map extended beyond CIS-Azure).

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 76.95%**

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`: SOC 2 CPA attestation, third-party pen-test publication, signed design partner, owner-output GTM assets/cohorts, public extension SDK, MCP absence in V1, third-party plugin marketplace, assistive-technology participant testing, and sales-engineer-led LLM onboarding.

**The headline is not ship-blocked by a numbered gate.** Gate 5 is **PASS** (UI typecheck and jwt-bearer production build green on the newest master run). The risk attached to the headline is **process**, not product: the .NET test corset on `master` is red, the full `ci.yml` matrix has not been green in the inspected window, and the guard that is *required* (`CI: beta-readiness wiring guards`) is one of the three failing jobs.

**What genuinely improved.** The insight-density stack stopped being purely subtractive at the classification layer: typed-engine findings are scored and demotable (ADR 0070), harness coverage tripled (14 → 42 engines), and declaration-only reviews now light up the path engines that were silent in v7. Real-mode defaults turn the LLM judge and insight generator on without a tenant flag. PP-01 closed the "SOC 2 pack emits nothing" demo hole. Dependabot and the ruleset closed v7's process items.

**What did not improve.** No real-mode run, no observed first review, no frontier comparison that is not hand-authored. And the trunk that carries all of the above cannot build its own Decisioning test project today.

---

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 70 | 13 | 9.10 | **390** |
| 2 | Differentiability / Defensibility vs Frontier AI | 83 | 13 | 10.79 | 221 |
| 3 | Governed Review Integrity | 88 | 13 | 11.44 | 156 |
| 4 | Correctness & Evidence Integrity | 72 | 12 | 8.64 | **336** |
| 5 | AI / Agent Readiness | 76 | 10 | 7.60 | 240 |
| 6 | Time-to-Value | 73 | 10 | 7.30 | **270** |
| 7 | Proof-of-ROI Readiness | 76 | 9 | 6.84 | 216 |
| 8 | Sponsor / Operator Comprehension | 78 | 8 | 6.24 | 176 |
| 9 | Runtime & First-Review Reliability | 70 | 7 | 4.90 | 210 |
| 10 | Adoption Friction | 82 | 5 | 4.10 | 90 |
| | **(A) Headline readiness** | | **100** | **76.95%** | |

Sum(score × weight) = 910 + 1079 + 1144 + 864 + 760 + 730 + 684 + 624 + 490 + 410 = **7695** → **(A) = 76.95%**.

**Ranked by weighted deficiency:** Insight Density (390) · Correctness (336) · Time-to-Value (270) · AI/Agent Readiness (240) · Differentiability (221) · Proof-of-ROI (216) · Runtime (210) · Comprehension (176) · Governed Review Integrity (156) · Adoption Friction (90).

**Total remaining deficiency signal: 2,305.** Insight density is still the largest single deficiency, but the gap to second place narrowed from **182** (v7: 442 vs 260) to **54** (390 vs 336) — because density rose and correctness fell on fresh evidence, not because either was re-weighted.

**Scoring rationale.**

| Quality | Score | Why exactly this much |
|---|---:|---|
| Decision-Changing Insight Density | **70** | Mechanism moved for real: typed-engine scoring (ADR 0070), 42/53 engines in harness, 69 cases, path engines fed by Azure/AWS/GCP IAM and NSG/SG declarations, Real-mode judge/generator on by default. Not higher: **zero real-mode runs**; frontier delta is synthetic by its own footer; the largest corpus slice (`security-baseline`, 10/47) sits at exactly the threshold with no evidence and no anchor; the harness that produced the table **does not compile on trunk**. Decision-changing quality is still unmeasured against a human or a frontier model. |
| Differentiability / Defensibility | **83** | PP-01 landed: theme map carries 18 non-CIS-Azure ids; a SOC 2 or CIS-AWS tenant now moves declaration rows. Governed workflow, sealed manifests, and declaration gating remain the moat. Not higher: `IsThemeEnabled` is still exact-id (prefix family is vocabulary, not enablement), and the buyer-obvious "toggle a pack, watch findings change" artifact still does not exist as a recorded demo. |
| Governed Review Integrity | **88** | Product-side rubric (policy → evidence → finding → decision → audit) is unchanged and strong. The repo's own gate is now pointed at the right contexts. Holding rather than raising because the required `.NET: fast core (corset)` context path-skips to success on non-.NET PR lanes and no merge queue exists — the governance gate for the codebase is still weaker than the governance gate for a review. |
| Correctness & Evidence Integrity | **72** | Trunk is red on the .NET corset (CS7036 in `Decisioning.Tests`), the OpenAPI backward-compat snapshot, and a required guard (`typed-engine-protected` marker drift). The full `ci.yml` matrix is 8/8 red in the window. The newest merged PR carried two failing non-required jobs. Evidence-integrity **mechanisms** (citation gate, sealed manifest, evidence refs) are intact — this is about the codebase's ability to prove itself, and today it cannot run its golden corpus. |
| AI / Agent Readiness | **76** | Real-mode defaults now on for judge, engine-finding judge, insight generator, novelty/verification preference — with spend caps and tenant opt-out. Simulator separation is clean. Not higher: eval corpus synthetic; no live pilot signal; prose-assumption default sits on an unmerged PR. |
| Time-to-Value | **73** | Operator surface builds and typechecks on trunk; declaration-only reviews now produce path findings without extractors. **Gate 1 still UNKNOWN** — no observed create → execute → commit. The Azure-extractor first-review default is owner-blocked. |
| Proof-of-ROI Readiness | **76** | Mechanism complete; **0 of 3** G4 rows; no sponsor has seen a real-mode ROI summary. Unchanged in substance. |
| Sponsor / Operator Comprehension | **78** | Buyer-polish batches (readingBody headers, Sources strips, easier-to-use home/palette) landed across help and operator routes this week. Narrative still rests on synthetic output. |
| Runtime & First-Review Reliability | **70** | Two consecutive completed push corsets on `master` red on the same three jobs; 27 of the last 30 cancelled by concurrency so the red state persisted invisibly for at least two hours; `ci.yml` full matrix red since at least 2026-08-23; Gate 1 unobserved. |
| Adoption Friction | **82** | `legacy-peer-deps` gone, `@tanstack/*` aligned, clean `npm ci` path asserted in CI. Not higher: a fresh contributor clone cannot `dotnet build` the full solution today (Decisioning.Tests), and the extractor-default decision keeps first-review inventory opt-in. |

---

## 3. Diagnostic Scores (non-headline)

**Decision Advantage Score: 68/100.** Up from the v7 band because the classification layer no longer discards computed scores and because declaration-only input now produces identity/data-flow/segmentation findings that a checklist would not. Capped because none of it has been shown to change a decision a real architect made.

**Frontier-AI Survival Probability (12 months): 58–72%, moderate confidence.** Reference class: governed-workflow tools whose analysis layer is model-agnostic survive model upgrades; prompt-shaped analysis does not. ArchLucid's moat (policy state, sealed evidence, audit, declaration gating) is the former. Adjustment upward: findings now derive from graph structure the model does not author. Adjustment downward: no evidence yet that the graph-derived findings beat "Claude + pasted standards" on a real estate.

**30-Day Voluntary Usage Probability: 36–51%, low-moderate confidence.** Unchanged band. A developer can clone, typecheck, and Release-build the API; a principal architect still has no reason to return until a first review shows them something they did not know.

**Sponsor Purchase Probability: 28–43%, low confidence.** **Zero G-REAL-06 pilots still dominates.**

**Reconciliation with §2.** Headline **76.95%** sits ~9 points above Decision Advantage (68) and far above the purchase band. The gap is smaller than v7 (12.5) because the analysis layer moved. Do not read 76.95% as 76.95% of the way to a sale; read it as "the mechanism is mostly built and the proof is entirely absent."

---

## 4. V1 Ship Gate

| # | Gate | Verdict | Evidence | Fastest resolution |
|---|------|---------|----------|--------------------|
| 1 | First review completes create → execute → commit → manifest + ≥1 artifact | **UNKNOWN** | Not executed here; no staging run recorded since v7. | Staging `ship-gate-evidence` run (human task #2). |
| 2 | No hallucinated or uncited policy/evidence citations | **PASS (mechanism)** | Emission gate + citation integrity evaluator + evidence-ref vetoes (DX-45/47/50/70) unchanged. | Upgrade after gate 1 live. |
| 3 | Sponsor summary / ROI coherent and not misleading | **PASS (mechanism)** | Disposition-aware headline; execution-mode labels. | As above. |
| 4 | Export / package generation works | **PASS (mechanism)** | Suite=Core coverage; live ZIP not run here. | Optional staging probe. |
| 5 | Architect workspace does not break during first-review / demo path | **PASS** | `Operator UI: typecheck (blocking)` and `Operator UI: jwt-bearer production build (blocking)` **success** on the newest master run (34376757704). | Keep green; the corset around it is red. |
| 6 | Auth + tenant isolation on pilot path | **PASS (mechanism)** | ADR 0037, scope guard, ship-gate negative probes unchanged. | As gate 1. |

**No numbered gate FAILs, so the headline is the weighted score.** The attached process risk: the **.NET corset is red on `master`**, which means the numbered gates' *mechanism* evidence (Suite=Core tests) cannot currently be re-run from trunk for `Decisioning.Tests`. That is not a product FAIL; it is an inability to re-prove.

---

## 5. Sponsor Summary

**(A) Overall headline readiness — 76.95% (v8). Gate 5 PASS; Gate 1 UNKNOWN.**

ArchLucid is a governed architecture-review system with **53 deterministic finding engines**, tenant-filtered compliance packs whose declaration vocabulary now spans SOC 2, GDPR, HIPAA, ISO 27001, PCI, ZTA and CIS for Azure, AWS and GCP, declaration gating, sealed manifests, database-per-tenant isolation, and a first-party connector set (Jira, ServiceNow, Confluence, Slack, Teams). Since the last pass the analysis layer changed shape: typed-engine findings are scored and can be demoted to checklist like agent findings; identity, data-flow and segmentation path engines fire on IaC-only input across three clouds; in Real mode the LLM judge and insight generator run by default under spend caps. A buyer uploading Terraform for an AWS estate with a CIS-AWS pack now gets blast-radius and trust-boundary findings that in v7 required a live extractor.

**What v8 did not buy.** No architect outside the repository has run a real-mode review. The frontier comparison is a hand-authored regression fixture. And the trunk carrying these gains has a red .NET test corset, a red OpenAPI snapshot, a red required guard, and a full CI matrix that has not been green in the inspected window. **The product's analysis moved; the product's ability to prove that it moved did not.**

**(B) Procurement / market realism (weight 0 in `(A)`).** Same honest trust posture — self-assessment, templates, owner pen test — without CPA SOC 2 or third-party pen-test publication. Sales-led motion; live commerce is V1.1 owner-only.

**Commercial picture.** Compelling as a demo of governed, policy-driven, evidence-linked findings; unproven as a decision-changer because no G4 row exists.

**Enterprise picture.** Trust mechanisms (isolation, audit, sealed manifests, claim-honesty guards) are ahead of the proof. Hesitation will come from "show me one real run," not from architecture.

**Engineering picture.** Robust in product invariants; **fragile in trunk process** — a two-PR semantic conflict reached `master` under an active five-context ruleset, and stayed red for hours behind concurrency cancellations.

**Frontier-AI picture.** Becoming more valuable: the new findings derive from graph structure and policy state that a better model improves rather than replaces — **if** a real run ever shows them.

---

## 6. Deferred Scope Uncertainty

Same as v7: V1.1 webhooks/MCP/commerce un-hold; V2 CPA/pen-test programs and substrate shifts. Graph-RAG community summarization is shipped behind `EnableCommunitySummarization=false`; the **TB-883** ablation is owner-approved but budget-blocked.

---

## 7. Weighted Quality Assessment (detail)

### 7.1 Decision-Changing Insight Density — 70 · weight 13 · contribution 9.10 · deficiency 390

**What is true now.** `DeterministicInsightDensityGate` scores every finding, tags engine findings `typed-engine-scored`, and demotes on `(score < 65 || genericWithoutEvidence || falsifiableWithoutEvidence) && !hasConcreteEvidence`. Bonuses reward inventory-shaped evidence, line-anchored docs, falsifiability, cross-engine corroboration and impact-witness hops. The harness registers 42 engines and 23 emit on the 69-case corpus. Declaration-fed path edges make `identity-blast-radius` (5 findings, 72), `data-flow-trust-boundary` (3, 72) and `segmentation-semantics` (3, 72) fire without extractors.

**What is not.** Proof. `WouldDemoteAt65Count = 0` across the corpus — the gate demotes **nothing** on its own golden set, and 10 of 47 findings (`security-baseline`) sit at exactly 65 with no evidence and no anchor. Either the corpus is too easy or the threshold is tuned to pass it; neither is decision-changing evidence. The frontier-delta rollup passes three fixtures whose names contain `synthetic`. And the harness cannot be compiled from `master` today.

**Classification:** V1 mechanism largely complete; **validation required**. **Affects outcomes 1, 3, 5.**

### 7.2 Correctness & Evidence Integrity — 72 · weight 12 · contribution 8.64 · deficiency 336

Trunk state (16:26 UTC): `.NET: push corset` red (`CS7036`, `GoldenCorpusIngestDeclarationGraphFactory.cs:491`), OpenAPI v1 backward-compat snapshot red, `CI: beta-readiness wiring guards` red (`typed-engine-protected` marker). All three were already red at 14:05 UTC; everything between is cancelled. `ci.yml` full matrix: 8/8 red. The newest merged PR had two failing non-required jobs.

**Still intact:** citation contract, evidence-ref vetoes, sealed-manifest hash guard (`#2565` Api.Tests alignment landed today), tenant scoping. The deduction is for the codebase's inability to prove its own correctness on trunk, not for product hallucination risk.

**Classification:** V1. **Affects outcomes 1, 2, 4.**

### 7.3 Time-to-Value — 73 · weight 10 · contribution 7.30 · deficiency 270

Declaration-only reviews now yield path findings on first upload. Operator UI compiles. **Gate 1 UNKNOWN.** The single largest first-review lever (live Azure inventory as default) is blocked on an owner shape decision, not code.

**Classification:** V1 residual + validation. **Affects outcomes 1, 3.**

### 7.4 AI / Agent Readiness — 76 · weight 10 · contribution 7.60 · deficiency 240

Real-mode effective defaults: judge, engine-finding judge, insight generator, novelty/verification preference — on, capped, tenant-opt-out. Prose assumption extraction default-on is on **#2594** (open). Eval corpus synthetic; no live pilot.

**Classification:** V1 mechanism complete; validation required. **Affects outcomes 1, 5.**

### 7.5 Differentiability / Defensibility vs Frontier AI — 83 · weight 13 · contribution 10.79 · deficiency 221

PP-01 core shipped: `ThemeToRuleIds` maps 18 rule ids beyond `cis-az-*`; a SOC 2 / CIS-AWS / CIS-GCP tenant enables declaration themes. Prefix family still governs vocabulary only. The buyer-visible artifact ("toggle SOC 2 vs CIS Azure, watch rows move") is now **possible** and still **unrecorded**.

**Classification:** V1 mechanism; demo residual. **Affects outcomes 1, 2, 5.**

### 7.6 Proof-of-ROI Readiness — 76 · weight 9 · contribution 6.84 · deficiency 216

Mechanism complete; G4 HOLD 0/3. **Affects outcomes 3, 4.**

### 7.7 Runtime & First-Review Reliability — 70 · weight 7 · contribution 4.90 · deficiency 210

Red corset on trunk for ≥2 hours behind 27 concurrency cancellations; full matrix red for the window; Gate 1 unobserved. **Affects outcomes 2, 3.**

### 7.8 Sponsor / Operator Comprehension — 78 · weight 8 · contribution 6.24 · deficiency 176

Help/operator buyer-polish batches landed this week (reading-body headers, Sources strips, home draft CTA, palette). No sponsor has read a real-mode summary. **Affects outcomes 2, 4.**

### 7.9 Governed Review Integrity — 88 · weight 13 · contribution 11.44 · deficiency 156

Product rubric unchanged and strong. Repo gate now names the right contexts but tolerates path-skip success and lacks a merge queue. **Affects outcomes 2, 4, 5.**

### 7.10 Adoption Friction — 82 · weight 5 · contribution 4.10 · deficiency 90

Clean `npm ci` asserted; peer deps fixed. Full-solution `dotnet build` fails on trunk for contributors. **Affects outcomes 2, 3.**

---

## 8. Top 10 Weaknesses

1. **Trunk is red and the required checks did not stop it.** AS-017 (`#2563`) changed the `DefaultGraphBuilder` constructor; the DX golden factory still calls the old one; both PRs were green alone. Required checks evaluate PR branches, `.NET: fast core (corset)` path-skips to success, and there is no merge queue. Result: `Decisioning.Tests` does not compile on `master` and stayed that way for hours behind cancelled runs. **Process uncertainty; V1 blocker for re-proving anything.**
2. **Insight density is mechanism-rich and proof-free.** Zero real-mode runs; synthetic frontier fixtures; `WouldDemoteAt65Count = 0` on the golden set; 10/47 findings at threshold with no evidence. **Largest weighted deficiency (390). Validation uncertainty.**
3. **A required guard is failing on trunk because the density program changed the doc it guards.** `check_insight_density_advisory_surfaces.py` wants `typed-engine-protected`; the distribution markdown correctly says `typed-engine-scored`. Ten-minute fix; it is required and red. **Process.**
4. **OpenAPI v1 backward-compat snapshot is red on `master`.** Not triaged in this pass (assertion text not surfaced by `--log-failed`). Either an unintentional breaking change or a stale snapshot; both are correctness defects. **Design/process.**
5. **Full `ci.yml` matrix has not been green in the inspected window (8/8).** v7 asked for one measurement; the measurement is "everything after the corset is red." Unmeasured correctness surface is now a measured-red one. **Process.**
6. **Gate 1 remains UNKNOWN.** Unchanged for four passes. **Validation.**
7. **Zero G-REAL-06 pilots.** Unchanged. **Market.**
8. **Live inventory is opt-in and the owner decision that would change it is unshaped.** Extractor default-on was approved in principle; soft/hard/wizard and pilot scope are unspecified. **Blocked on user input.**
9. **`security-baseline` produces the largest corpus slice with no evidence refs.** 10 findings at exactly 65 survive on the +5 severity bonus. Either give the engine resource anchors or let it demote. **Design.**
10. **Prose-assumption default and TB-883 ablation are parked on open PR / missing budget.** `#2594` unmerged; TB-883 has approval but no cap. **Owner.**

**Removed from v7's list because genuinely fixed:** ruleset required contexts (5 now); Dependabot grouping; verification blind spots (AGENTS.md + `npm ls` assert); `legacy-peer-deps`; `typed-engine-protected` promote bypass (ADR 0070); declaration themes CIS-Azure-only (PP-01). **Do not treat those as standing weaknesses.**

---

## 9. Frontier-AI Analysis

| Capability | 12-month trajectory | Reason |
|---|---|---|
| Generic architecture critique | **Commodity now** | Any frontier model with pasted standards. |
| Declaration-derived path findings (IAM blast radius, trust boundary, segmentation) from IaC | **Durable → more valuable** | Derived from a graph the model does not author; a better model improves the prose and the judge, not the edge set. |
| Policy-pack-driven theme enablement (PP-01) | **Durable** | Customer policy state is not in the model's context unless the customer pastes it every time. |
| Sealed manifest + audit + evidence refs | **Durable** | Organizational, not analytical. |
| LLM judge / insight generator (Real mode) | **More valuable** | Every model upgrade raises judge quality at zero ArchLucid engineering cost — **if** the flags stay on. |
| Golden corpus as proof | **Neutral** | Proves regression safety, not advantage. |

**Hard-to-reproduce-via-prompting:** policy state, tenant-filtered vocabulary, sealed evidence, declaration gating, cross-run recurrence, governance SoD. **Easy soon:** any single finding's prose.

**Leverage bet:** the density stack is now shaped so that a better model *increases* the numerator (judge, generator, prose extraction) while the deterministic engines guarantee the floor. That is the right shape. It is unproven.

**Displacement timeline:** one model release commoditizes the prose of every finding; none commoditizes the customer's policy state or the audit record.

**Final verdict:** ArchLucid is becoming more valuable faster than frontier AI is becoming capable **in mechanism**, and not at all **in evidence**. Survival probability is in §3.

---

## 10. Policy-Aware Governance Test

1. **Do policy packs drive behavior?** **Yes, more than in v7.** Theme enablement now keys off 18 non-CIS-Azure ids; SOC 2, CIS-AWS and CIS-GCP tenants move declaration rows. Empty rule set fails closed.
2. **Trace input → evidence → policy → recommendation → decision → audit?** Yes for typed-engine and declaration findings; evidence-ref vetoes (DX-45/47/50/70) prevent phantom refs.
3. **Would frontier-AI-alone reproduce it consistently?** Not the traceability or the tenant-filtered vocabulary.
4. **AI-generated vs governed infrastructure?** Prose is AI; edges, policy keys, manifests, audit are infrastructure.
5. **Proof the moat is real:** one recorded demo where switching packs changes emitted declaration rows on the same input — **now possible, still unrecorded**.
6. **Fastest validation:** G-REAL-06 run 1 with two pack configurations.
7. **Demo behavior that makes it obvious:** side-by-side compare of the same review under CIS-Azure vs SOC 2.

---

## 11. Principal Architect Dismissal Test

"I need this" trigger, today: uploading an AWS Terraform root and getting a blast-radius finding that names the role, the hop count, and the CIS-AWS rule — without connecting an account. That exists now. "I did not think of that" is still unmeasured: no architect has been shown one.

Most likely dismissal trigger: **"Show me a real run."** Likelihood today: **high (0.6–0.75)** — there is no G4 row to answer with. Second trigger: **"Your own trunk doesn't build."** A skeptical principal who clones and runs `dotnet build` hits CS7036 in the test project.

Would they believe it beats "Claude + a good prompt + my standards pasted in"? **On mechanism, plausibly yes; on evidence, not yet.**

---

## 12. Founder Delusion Check

**Strongest assumption with weakest evidence:** that 42 harness engines and a re-recorded distribution table constitute density gains. They constitute *coverage* gains; the corpus demotes nothing and the frontier fixtures are synthetic.

**Looks differentiated, is commodity:** finding prose.

**Looks ordinary, may be the moat:** `DeclarationSignalPolicyKeyMap` — a boring dictionary that decides what a customer's pack is allowed to say.

**Months-burning distraction:** another DX prompt pack. The strategy doc already says so.

**Six-month freeze prescription:** fix trunk today; enable merge queue; run Gate 1; run G-REAL-06 with two pack configurations; record the compare; stop re-scoring.

**Most dangerous attractive distraction:** DX-77.

**Most boring real moat:** the sealed manifest plus the audit row that says which pack version produced which finding.

---

## 13. Competitive Reality Check & Moat Assessment

Current moat: policy-state-driven declaration gating, sealed evidence, governed workflow. Potential moat: graph-derived path findings that improve with model quality. Weakest moat assumption: that buyers will believe the mechanism without a run. Illusory moat: engine count. Boring-but-durable: audit + manifest. What makes it obvious to a buyer: the recorded pack-toggle compare (§10.7).

---

## 14. Adoption & Monetization

**30-day usage:** strongest positive — declaration-only path findings; strongest negative — nothing has been shown to a real architect. **Sponsor purchase:** blocker is G4 HOLD. **Why buy instead of more frontier licenses:** because the license does not know your policy pack, cannot seal evidence, and cannot tell you what changed since last quarter.

**Top monetization blockers:** (1) no real-mode proof row; (2) Gate 1 unobserved; (3) no recorded pack-toggle demo; (4) trunk credibility for technical buyers who clone; (5) commercial readiness (G-COMMERCE-01); (6) no sponsor has read a real ROI summary.

**Top enterprise adoption blockers:** (1) live inventory opt-in; (2) extractor permission story per cloud; (3) procurement trust posture `(B)`; (4) no pilot references; (5) operator onboarding without founder; (6) ITSM native-create default posture (TB-599).

---

## 15. Most Important Truth

**The insight-density program did what it said — and the trunk it landed on cannot prove it.**

Typed-engine scoring, 42 engines, three-cloud path edges, Real-mode judge defaults: real. Zero real runs, synthetic frontier fixtures, a golden corpus that demotes nothing, and a `Decisioning.Tests` project that does not compile on `master`: also real. **Fix the build, enable the merge queue, then run one real review with two packs.** Nothing else in this document moves the weakest quality.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

---

## 16. Stop Doing List

**Not worth doing before V1:** DX-77; more compliance rule count; Graph-RAG community summarization default flip before TB-883 has a budget.

**Diminishing returns:** engine coverage expansion past 42 without evidence refs; UI polish batches on routes no pilot has seen; more claim-honesty guards while a required guard is red.

**Founder behaviors that delay validation:** re-scoring before fixing trunk; approving levers (extractor default, TB-883) without shaping them; treating a green PR check as a green trunk.

**Enterprise-important but not V1-adoption:** MCP; CloudEvents webhooks; multi-region.

**Stop doing this next:** **merging while the push corset is red.** Every merge today re-triggers and cancels the run that would have shown the break.

## 17. Top Improvement Opportunities

**Shipped this cycle — do not re-open:** DX-51–DX-76; ADR 0070; PP-01 core; ruleset five contexts; Dependabot groups; AGENTS.md Release note; `legacy-peer-deps` removal; `#2565` Api.Tests DI alignment.

### Tier 1 — Must Fix / Must Validate

**1. Fix `ArchLucid.Decisioning.Tests` compile on `master`.**
Tier 1 · Why: the golden corpus — the only checked-in density evidence — cannot run from trunk; push corset red. · Affected: Correctness, Runtime, Insight Density (proof). · Evidence: CS7036 at `GoldenCorpusIngestDeclarationGraphFactory.cs(491,39)` on runs 34361964714 and 34376757704; `DefaultGraphBuilder` ctor changed in `4e6ab618db`. · Design 3 / Market 0 · **V1.**

> **Cursor prompt.** *Problem:* `ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusIngestDeclarationGraphFactory.cs` line ~491 constructs `DefaultGraphBuilder` with two arguments; `ArchLucid.KnowledgeGraph/Builders/DefaultGraphBuilder.cs` now requires `(IGraphNodeFactory, IGraphEdgeInferer, StructuredDiagramGraphMerger)`. *Desired:* the factory compiles and produces identical graphs for all 69 cases. *Scope:* this file and any sibling golden factory with the same two-arg call (grep `new(NodeFactory, new DefaultGraphEdgeInferer())` and `new DefaultGraphBuilder(`); reuse however `ArchLucid.KnowledgeGraph.Tests/DefaultGraphBuilderTests.cs` constructs the merger. *Acceptance:* `dotnet build ArchLucid.Decisioning.Tests -c Release` 0 errors; `scripts/ci/run_push_corset_dotnet.sh` passes locally; `GoldenCorpusMaterializerTests` and `InsightDensityEngineDistributionReportTests` green; distribution markdown unchanged. *Tests:* existing; add none unless a graph diff appears. *Non-goals:* changing `DefaultGraphBuilder`; re-recording the distribution.

**2. Align `check_insight_density_advisory_surfaces.py` with ADR 0070.**
Tier 1 · Why: a **required** context (`CI: beta-readiness wiring guards`) is red on trunk because the guard wants `typed-engine-protected` and the doc says `typed-engine-scored`. · Affected: Correctness. · Evidence: run log "missing marker 'typed-engine-protected'". · Design 2 / Market 0 · **V1.**

> **Cursor prompt.** *Problem:* `scripts/ci/check_insight_density_advisory_surfaces.py` asserts the marker `typed-engine-protected` in `docs/quality/insight-density-engine-distribution.md`; post-ADR-0070 the canonical marker is `typed-engine-scored` (see `InsightDensityEngineDistributionMarkdown.cs`). *Desired:* the guard asserts `typed-engine-scored` and **fails** if `typed-engine-protected` reappears in production-claim surfaces. *Scope:* the script and its unit test under `scripts/ci/tests/`. *Acceptance:* guard passes on current `master` docs; a fixture containing the old marker fails. *Non-goals:* editing the distribution markdown.

**3. Triage the OpenAPI v1 backward-compat snapshot failure.**
Tier 1 · Why: red on both completed master runs; either a breaking API change merged or the snapshot is stale — both are correctness defects. · Evidence: `OpenApiContractSnapshotTests.OpenApi_v1_json_is_backward_compatible_with_committed_snapshot` FAIL. · Design 4 / Market 0 · **V1.**

> **Cursor prompt.** *Problem:* the OpenAPI v1 snapshot test fails on `master`. *Desired:* determine whether the diff is additive (re-snapshot per `docs/library/API_CONTRACTS.md` procedure) or breaking (restore compatibility or version it). *Scope:* `scripts/ci/check_openapi_contract_snapshot.sh`, the committed canonical snapshot, and the controller(s) in the diff. *Acceptance:* snapshot job green on trunk; `API_CONTRACTS.md` changelog row if the contract changed. *Non-goals:* per-version document split (tracked separately as V1.1 design).

**4. Close the merge-result gap: enable merge queue (owner) or add a required post-merge trunk gate.**
Tier 1 · Why: items 1–3 all reached `master` through green PR checks. Required checks on PR branches cannot catch two-PR semantic conflicts; `.NET: fast core (corset)` path-skips to success. · Evidence: `/rules/branches/master` has no `merge_queue` rule; `ci.yml` 2431–2433. · Design 6 / Market 0 · **V1 (process); owner-only for the ruleset.**

> **Cursor prompt (agent half).** *Problem:* PR-branch checks pass while the merge result breaks. *Desired:* (a) draft ruleset JSON in `.github/rulesets/` adding a `merge_queue` rule with the same five required contexts and document it in `BRANCH_PROTECTION.md`; (b) make `dotnet-fast-core-build` in `ci.yml` **not** report success when path-skipped on `merge_group` events (always build on merge-queue runs). *Acceptance:* `ci.yml` has a `merge_group:` trigger; the fast-core build runs unconditionally under it; docs updated. *Non-goals:* applying the ruleset (owner).

**5. Execute Gate 1, then G-REAL-06 with two pack configurations.**
Tier 1 · **Validation.** Run 1 under CIS-Azure, Run 2 the same input under SOC 2, Run 3 per runbook. Record the compare as the §10.7 artifact. · Market 9 / Design 2 · **Validation first.**

**6. Triage the full `ci.yml` matrix on one trunk commit.**
Tier 1 · v7 asked for a measurement; the measurement is 8/8 red. Decide per job: fix, demote to warn-only, or delete. · Design 5 / Market 0 · **V1 (process).**

### Tier 2 — High Leverage

**7. Give `security-baseline` engine findings resource-anchored evidence refs or let them demote.**
Tier 2 · Why: 10 of 47 corpus findings sit at exactly 65 with `no-concrete-evidence` and `no-architecture-anchor`, surviving on the +5 severity bonus; that is the single largest slice of the density table and the least defensible. · Evidence: `insight-density-engine-distribution.md` row `security-baseline`. · Design 6 / Market 1 · **V1.**

> **Cursor prompt.** *Problem:* `SecurityBaselineFindingEngine` emits findings without `EvidenceRefs` resolvable to graph nodes or documents, so `DeterministicInsightDensityGate` applies −25/−15. *Desired:* each finding carries a `graph-node:` or `doc:` evidence ref for the resource that violates the baseline (reuse `FindingEvidenceRefs` helpers as DX-45/47 did for other engines). *Acceptance:* re-record distribution; `security-baseline` median ≥ 82 with `No evidence = 0`, or the row shows honest demotion; `InsightDensityEngineDistributionReportTests` updated. *Non-goals:* changing the threshold.

**8. Shape and ship the Azure-extractor first-review default once the owner picks soft / hard / wizard.** Tier 2 · blocked on user input; the intake batch is agent work after the decision.

**9. Merge or close #2594 (prose-assumption Real-mode default).** Tier 2 · owner review; already tested (11/11).

**10. Record the pack-toggle compare demo** (CIS-Azure vs SOC 2 on one input) once item 5 run 1–2 exist. Tier 2 · demo reliability.

### Tier 3 — Hold

TB-883 ablation (budget-blocked); frontier capture with real transcripts (after G-REAL-06); per-version OpenAPI document; DX-77.

## 18. Prompt Batching Guidance

**First — Composer, one PR, ~30 minutes:** items 1 + 2 (compile fix + guard marker). Merge nothing else until the push corset is green. **Safe-for-Composer.**

**Second — Sonnet:** item 3 (OpenAPI triage) and item 4 agent half (`merge_group` trigger + ruleset draft). **Sonnet-safe.**

**Third — owner:** apply merge queue; then item 5 (Gate 1 → G-REAL-06 ×2 packs).

**Fourth — Sonnet:** item 6 (matrix triage), item 7 (`security-baseline` evidence refs). Item 7 changes finding emission — **strong-model-recommended** if the engine's anchor derivation is non-trivial.

## 19. Model Usage Guidance

Composer for items 1–2 and ruleset JSON drafting. Sonnet for OpenAPI triage, CI matrix triage, intake batch. Strong model (Opus) for item 7 if evidence-ref derivation touches emission semantics, and for G-REAL-06 failure triage. No assessment re-run until items 1–4 are closed.

## 20. Pending Questions For Later

**Blocks V1:** items 1–4 (trunk); Gate 1; G-REAL-06; G-COMMERCE-01.

**Requires founder decision:** (a) merge queue vs post-merge gate; (b) Azure-extractor first-review default shape + pilot scope; (c) TB-883 monthly cap + cohort; (d) #2594 merge; (e) whether `security-baseline` should demote honestly or gain anchors; (f) whether `IsThemeEnabled` should accept prefix-family membership (PP-01 option B/C).

**Requires customer validation:** everything in §7.1's "what is not."

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

v8 is the pass where the analysis layer finally shows principal-architect judgment: scoring typed engines honestly instead of protecting them, deriving path findings from declared IAM and network rules instead of waiting for live inventory, and turning the paid judge on by default only where it is paid for. That is product taste. The taste failure is the same shape as v4 and v7 wearing new clothes: **the program that improved the findings also shipped the guard drift that reddened a required check, and landed next to a constructor change nobody re-compiled against.** Two green PRs, one red trunk, hours of cancelled runs. The most useful thing an engine can do now is fix the build and say plainly: **put a merge queue in front of `master`, then run one real review.**
