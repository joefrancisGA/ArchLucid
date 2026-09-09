# ArchLucid Strategic Release and Market Readiness Assessment (v9)

**Pass date:** 2026-09-09, **19:20–19:45 UTC (v9)**. **Computed fresh** — no carry-forward, no score deltas, no rescore ratchet. The v8 pass is superseded by this document and is **not** canonical. v8 is archived at [`../archive/assessments/LATEST_GPT55-2026-09-09-v8-superseded.md`](../archive/assessments/LATEST_GPT55-2026-09-09-v8-superseded.md).

## v9 pass note — the v8 trunk defects closed; a new emission-gate break replaced them

This pass was requested after the **QR-01–QR-04** quality-ROI pack and **AS-024 / AS-034** diagram spine work landed on `master`. The v8 three-job red (Decisioning.Tests CS7036, `typed-engine-protected` guard, OpenAPI snapshot) is **closed on trunk**. `ci.yml` now has a `merge_group:` trigger and a draft merge-queue ruleset JSON. `LatestGoldenCorpusCaseNumber` is **70** (mermaid trust-boundary case `#2640`).

What replaced the old red: the newest **completed** push corset ([34392453288](https://github.com/joefrancisGA/ArchLucid/actions/runs/34392453288), 19:00 UTC) **Failed 10 / Passed 394** in `ArchLucid.Decisioning.Tests` — `FindingsOrchestratorTests` snapshots with **empty `Findings`**, plus `HasKindBProvenance_allows_resolvable_doc_ref` expecting `doc:manifest.json#services` to count as Kind B after DX-70 line-anchor tightening. The QR-04 merge run ([34393999344](https://github.com/joefrancisGA/ArchLucid/actions/runs/34393999344)) was still in progress at inspection; gitleaks, UI typecheck, and **beta-readiness guards were already green**.

**QR-05** (`security-baseline` `EvidenceRefs`) is **not on `master`** (draft `#2641`). The distribution table is still a **case-69** record. Gate 1 is still **UNKNOWN**. **G4 HOLD — 0 of 3**.

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Grok 4.6 as a Cursor cloud agent, code-grounded desk review; **no live Azure OpenAI call was made during this pass**; no subagents were used for the assessment itself.

**Source materials inspected this pass:** `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, `docs/go-to-market/trust-center.md` (boundary), `docs/go-to-market/GTM_BACKLOG.md`, `docs/go-to-market/CLAIM_READINESS_STATUS.md`, `docs/library/TECH_BACKLOG.md` (open-count header + P1 block + TB-883/885/599/603), `.cursor/rules/Assessment-Scope-V1_1.mdc`, `docs/quality/insight-density-engine-distribution.md`, `docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`, `docs/quality/pp01-ga-starter-catalog-extension-scoping.md`, `DeterministicInsightDensityGate.cs`, `DeclarationSignalPolicyKeyMap.cs`, `AgentArchitectureFindingProvenanceValidator.cs`, `FindingProvenanceEmissionApplicator.cs`, `AgentArchitectureFindingEmissionGate.cs`, `GoldenCorpusHarnessEngineRegistration.cs` (`LatestGoldenCorpusCaseNumber = 70` on `origin/master`), `.github/workflows/ci.yml` (`merge_group`), `.github/rulesets/golden-cohort-gate-merge-queue.json`, `.github/BRANCH_PROTECTION.md`, `gh run list` / `gh run view` on `ui-typecheck-on-push.yml` and `ci.yml`, `git log origin/master`.

## Executed this pass (runtime evidence, not doc claims)

| # | Command / observation | Result |
|---|---|---|
| 1 | `git log origin/master -15 --oneline` | QR-04 + OpenAPI **#2638** (`bfef871c17`); AS-034 case-70 **#2640**; AS-024 **#2633**; QR-02 **#2619**. QR-05 **not** in this log. |
| 2 | `git show origin/master:.github/workflows/ci.yml` \| merge_group | Present: `merge_group:` trigger; `cancel-in-progress` false on merge_group; fast-core never path-skips on that event. |
| 3 | `git show origin/master:…/GoldenCorpusHarnessEngineRegistration.cs` | `LatestGoldenCorpusCaseNumber = 70`. Distribution markdown header still says **case-01..case-69**. |
| 4 | `gh run list --workflow ui-typecheck-on-push.yml --branch master --limit 8` | Newest completed **failure** [34392453288](https://github.com/joefrancisGA/ArchLucid/actions/runs/34392453288). QR-04 push [34393999344](https://github.com/joefrancisGA/ArchLucid/actions/runs/34393999344) **in progress** (gitleaks ✓, UI typecheck ✓, beta-readiness guards ✓; push corset / OpenAPI / jwt-bearer still running). |
| 5 | `gh run view 34392453288 --log-failed` | Decisioning.Tests **10 failed / 394 passed**. Pattern: `snapshot.Findings` empty (`effectful-1`, `good-payload`, promote-anchored, payload-conflict, withheld-band, partial-failure, dedupe). Provenance hold test expected `provenance-hold:` but notes were `evidence:doc:manifest.json#services`. Kind B test: `HasKindBProvenance` false for `doc:manifest.json#services`. |
| 6 | `gh run list --workflow ci.yml --branch master --limit 8` | Still **8/8 failure/cancelled** (last full dispatch 2026-08-28). No new full-matrix measurement this pass. |
| 7 | `docs/quality/insight-density-engine-distribution.md` | **23** engines, **47** findings, bands 65/67/72/82/100, `WouldDemoteAt65Count = 0`. `security-baseline` 10/47 at 65 with `No evidence = 10`. Path engines at 72 with `No evidence` on every row. Header not yet case-70. |
| 8 | `CLAIM_READINESS_STATUS.md` | **G4 HOLD — 0 of 3**. G1/G2/G5/G6 PASS (mechanism). |
| 9 | `DeclarationSignalPolicyKeyMap.IsThemeEnabled` | Still **exact-id**. Prefix family is vocabulary only (PP-01 Option B catalog slice shipped 2026-08-28; prefix enablement **rejected**). |
| 10 | `InsightDensityGateEffectiveOptionsMerger` | Real-mode: judge, engine-finding judge, insight generator, novelty/verification preference, **prose-assumption extraction** effective-on unless tenant opts out. |
| 11 | `.github/rulesets/golden-cohort-gate-merge-queue.json` | Draft only (`enforcement: evaluate`). **Live ruleset still has no `merge_queue` rule** (owner apply). |
| 12 | `TECH_BACKLOG.md` header | **25** unique open TB rows (P0 0 · P1 2 · P2 15 · P3 8). **TB-885 Done**. **TB-883** still budget-blocked. |

**Verified counts this pass:** **53** catalog engines; **42** harness engines; **70** golden cases on trunk (distribution table still recorded through **69**); **0** real-mode pilot runs; **0** live merge-queue rule.

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows plus owner-decision items. Excludes GTM V1.1 items **#2/#3/#5/#6** (**M-90**/**M-44**/**M-91**/**M-92**). **G-REAL-05** / **G-ASSURANCE-02** omitted from `(A)` (they do not reduce the headline).

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|-----------------|--------------------|--------------------|
| 1 | **Enable GitHub merge queue** on `master` using `.github/rulesets/golden-cohort-gate-merge-queue.json` (or UI equivalent) | YAML + draft JSON shipped (`#2638`). Live ruleset still evaluates PR-branch SHAs. Today's empty-Findings break is the same class of two-PR semantic conflict. | Partial — JSON already drafted | **N/A — owner apply** |
| 2 | **Gate 1** — one observed end-to-end first review on staging (`archlucid pilot ship-gate-evidence --run-id <guid>`) | Only **UNKNOWN** numbered ship gate. | Partial | **Owner + Opus** |
| 3 | **G-REAL-06** — three real-mode pilot runs, **two pack configurations on the same input** (CIS-Azure vs SOC 2) | Largest commercial uncertainty; the only way density moves from mechanism to proof. | Partial | **Opus** |
| 4 | **Owner shape: Azure inventory as first-review default** (soft prompt vs hard gate vs wizard step; pilot-tenant scope) | Owner said **Yes — Azure first** (2026-09-09) without intake shape. Largest remaining first-review density lever. | Yes — once shaped | **Composer** for the soft-prompt slice (QR-10) |
| 5 | **G-REAL-07** — proof packets + run-log rows | Depends on #3. | Partial | **Composer** |
| 6 | **M-39** — apply proof-packet checklist, ≥3 G4 rows | Depends on #5. | Partial | **Composer** |
| 7 | **TB-883 monthly AOAI cap + tenant cohort** | Approved with budget **TBD**. | Yes — plan is agent-draftable | **Composer** |
| 8 | **M-07** — polished operator screenshots | Unblocked on UI typecheck. | Partial | **Composer** |
| 9 | **M-16** — demo video (run **G-REAL-09** first) | Depends on #8. | Partial | **Composer** |
| 10 | **G-COMMERCE-01 / M-94** — invoice/SOW commercial readiness | Independent of analysis. | No | N/A — human only |

**Shipped this cycle — do not re-open:** QR-01 (`DefaultGraphBuilder` 3-arg); QR-02 (`typed-engine-scored` guard); QR-03 (OpenAPI Wave 68 snapshot + RoiController 403 schema); QR-04 (`merge_group` + ruleset *draft*); AS-024 inspect→diagram highlight; AS-034 case-70 mermaid; DX-51–DX-76; ADR 0070; PP-01 Option B catalog slice; prose-assumption Real-mode default-on.

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 77.26%**

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`: SOC 2 CPA attestation, third-party pen-test publication, signed design partner, owner-output GTM assets/cohorts, public extension SDK, MCP absence in V1, third-party plugin marketplace, assistive-technology participant testing, and sales-engineer-led LLM onboarding.

**The headline is not ship-blocked by a numbered gate.** Gate 5 remains **PASS** (UI typecheck green on the in-progress QR-04 run). The attached process risk is a **new** Decisioning.Tests failure cluster on the findings orchestrator / Kind B citation contract — not the v8 compile/OpenAPI/guard trio.

**What genuinely improved.** Trunk compiles `Decisioning.Tests`. The required advisory-surface guard matches ADR 0070. OpenAPI Wave 68 metadata is snapshotted. Merge-queue *wiring* exists. Case-70 puts a mermaid trust-boundary on the golden harness. Real-mode prose-assumption extraction is effective-on.

**What did not improve.** No observed first review. No G4 row. Distribution table not re-recorded through case-70. `security-baseline` still emits ten uncited findings at the demotion threshold. Path engines still score 72 with `No evidence` on every row. Full `ci.yml` matrix still unmeasured-green.

---

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 70 | 13 | 9.10 | **390** |
| 2 | Differentiability / Defensibility vs Frontier AI | 83 | 13 | 10.79 | 221 |
| 3 | Governed Review Integrity | 88 | 13 | 11.44 | 156 |
| 4 | Correctness & Evidence Integrity | 73 | 12 | 8.76 | **324** |
| 5 | AI / Agent Readiness | 76 | 10 | 7.60 | 240 |
| 6 | Time-to-Value | 73 | 10 | 7.30 | **270** |
| 7 | Proof-of-ROI Readiness | 76 | 9 | 6.84 | 216 |
| 8 | Sponsor / Operator Comprehension | 78 | 8 | 6.24 | 176 |
| 9 | Runtime & First-Review Reliability | 72 | 7 | 5.04 | 196 |
| 10 | Adoption Friction | 83 | 5 | 4.15 | 85 |
| | **(A) Headline readiness** | | **100** | **77.26%** | |

Sum(score × weight) = 910 + 1079 + 1144 + 876 + 760 + 730 + 684 + 624 + 504 + 415 = **7726** → **(A) = 77.26%**.

**Ranked by weighted deficiency:** Insight Density (390) · Correctness (324) · Time-to-Value (270) · AI/Agent Readiness (240) · Differentiability (221) · Proof-of-ROI (216) · Runtime (196) · Comprehension (176) · Governed Review Integrity (156) · Adoption Friction (85).

**Total remaining deficiency signal: 2,274.**

**Scoring rationale.**

| Quality | Score | Why exactly this much |
|---|---:|---|
| Decision-Changing Insight Density | **70** | Mechanism unchanged and still the largest deficiency: 42/53 engines, ADR 0070 scoring, path engines on IaC-only input, Real-mode judge/generator on. Not higher: **zero real-mode runs**; frontier delta still synthetic; `security-baseline` 10/47 at 65 with no evidence; path engines at 72 with no evidence; distribution **not** re-recorded through case-70; QR-05 unmerged. |
| Differentiability / Defensibility | **83** | Policy-pack declaration gating is real (`PolicyFilteredDeclarationGoldenCorpusTests` already asserts CIS-Azure vs SOC 2 rows differ on one graph). Not higher: that compare is a unit test, not a recorded buyer artifact; `IsThemeEnabled` remains exact-id (prefix enablement correctly rejected). |
| Governed Review Integrity | **88** | Product rubric (policy → evidence → finding → decision → audit) is strong. Repo gate has `merge_group` YAML. Holding: live merge queue not applied; required corset still red on a new cluster. |
| Correctness & Evidence Integrity | **73** | v8's compile / OpenAPI / guard defects are closed. New: 10 Suite=Core orchestrator tests empty `Findings`; Kind B heading-fragment citation no longer matches DX-70. Citation contract and sealed-manifest guards remain intact. One point above the prior band because the golden corpus can compile; not 80 because trunk still cannot re-prove Decisioning.Tests. |
| AI / Agent Readiness | **76** | Real-mode defaults include prose-assumption extraction. Eval corpus still synthetic; TB-883 budget-blocked. |
| Time-to-Value | **73** | Declaration-only path findings exist; mermaid can enter the graph (case-70). **Gate 1 UNKNOWN.** Azure-extractor default still unshaped. |
| Proof-of-ROI Readiness | **76** | Mechanism complete (disposition-aware sponsor summary, Simulator-forbid). **0 of 3** G4 rows. |
| Sponsor / Operator Comprehension | **78** | Buyer-polish batches continued (Jira/Azure/GCP Sources strips). Narrative still rests on synthetic output. |
| Runtime & First-Review Reliability | **72** | merge_group wired; guards green on the in-progress QR-04 run; completed corset still red; full `ci.yml` matrix 8/8 red in the last-dispatch window; Gate 1 unobserved. |
| Adoption Friction | **83** | Full-solution `dotnet build` of Decisioning.Tests compiles. Extractor-default still opt-in. |

---

## 3. Diagnostic Scores (non-headline)

**Decision Advantage Score: 68/100.** Same band: graph-derived path findings exist; none has changed a decision a real architect made.

**Frontier-AI Survival Probability (12 months): 58–72%, moderate confidence.** Reference class: governed-workflow tools whose analysis layer is model-agnostic. Upward: mermaid/diagram now compiles into the graph (AS-034) so the kernel is slightly less “document-only.” Downward: still no live bake-off.

**30-Day Voluntary Usage Probability: 36–51%, low-moderate confidence.** Unchanged. A principal architect still has no reason to return until a first review shows them something they did not know.

**Sponsor Purchase Probability: 28–43%, low confidence.** **Zero G-REAL-06 pilots still dominates.**

**Reconciliation with §2.** Headline **77.26%** sits ~9 points above Decision Advantage (68). Read it as “the mechanism is mostly built, the proof is absent, and trunk just swapped one test-corset break for another.”

---

## 4. V1 Ship Gate

| # | Gate | Verdict | Evidence | Fastest resolution |
|---|------|---------|----------|--------------------|
| 1 | First review completes create → execute → commit → manifest + ≥1 artifact | **UNKNOWN** | Not executed here. | Staging `ship-gate-evidence` (human task #2). |
| 2 | No hallucinated or uncited policy/evidence citations | **PASS (mechanism)** | Emission gate + DX-70 line-anchor tightening. The Kind B *test* is now stricter than its fixture — that is a test/contract bug, not a hallucination hole. | Upgrade after Gate 1 live. |
| 3 | Sponsor summary / ROI coherent and not misleading | **PASS (mechanism)** | Disposition-aware headline; Simulator-forbid. | As above. |
| 4 | Export / package generation works | **PASS (mechanism)** | Suite=Core coverage; live ZIP not run here. | Optional staging probe. |
| 5 | Architect workspace does not break during first-review / demo path | **PASS** | `Operator UI: typecheck (blocking)` success on 34393999344. | Keep green. |
| 6 | Auth + tenant isolation on pilot path | **PASS (mechanism)** | ADR 0037, scope guard unchanged. | As Gate 1. |

**No numbered gate FAILs.** Attached process risk: **Decisioning.Tests Suite=Core is red** on the newest completed trunk run.

---

## 5. Sponsor Summary

**(A) Overall headline readiness — 77.26% (v9). Gate 5 PASS; Gate 1 UNKNOWN.**

ArchLucid is a governed architecture-review system with **53** deterministic finding engines, tenant-filtered compliance packs spanning CIS (Azure/AWS/GCP), SOC 2, GDPR, HIPAA, ISO 27001, PCI and ZTA, sealed manifests, database-per-tenant isolation, and first-party Jira / ServiceNow / Confluence / Slack / Teams connectors. Diagrams are no longer a dead upload: mermaid compiles into the golden harness (case-70) and finding inspect can jump to a cited shape (AS-024). Typed-engine findings are scored and demotable (ADR 0070). In Real mode the LLM judge, insight generator, and prose-assumption extractor run by default under spend caps.

**What v9 did not buy.** No architect outside the repository has run a real-mode review. The density table still describes a case-69 world. Ten of forty-seven corpus findings sit at the demotion threshold with no evidence. And the findings orchestrator tests on trunk currently return **empty `Findings` collections** — the product's proof harness for emission just broke in a new place.

**(B) Procurement / market realism (weight 0 in `(A)`).** Honest trust posture: self-assessment, templates, owner pen test; no CPA SOC 2 and no published third-party pen test. Sales-led motion; live commerce is V1.1 owner-only.

**Commercial picture.** Compelling as a demo of governed, policy-driven, evidence-linked findings; unproven as a decision-changer because no G4 row exists.

**Enterprise picture.** Trust mechanisms ahead of proof. Hesitation will be “show me one real run,” not architecture.

**Engineering picture.** Product invariants are robust. Trunk process improved (merge_group YAML, compile fixed) and immediately found the next semantic conflict (AS-024 × DX-70 Kind B / orchestrator hold).

**Frontier-AI picture.** Becoming more valuable **in mechanism** as diagrams join the graph the model does not author — **if** a real run ever shows it.

---

## 6. Deferred Scope Uncertainty

V1.1: CloudEvents webhooks, MCP membrane, multi-region, commerce un-hold. V2: CPA SOC 2 / third-party pen-test *publication*, automated tenant-erasure, Redis-as-default, DTF / Container Apps Jobs. Graph-RAG community summarization remains behind `EnableCommunitySummarization=false`; **TB-883** ablation is owner-approved and budget-blocked.

---

## 7. Weighted Quality Assessment (detail)

### 7.1 Decision-Changing Insight Density — 70 · weight 13 · contribution 9.10 · deficiency 390

**What is true.** ADR 0070 scores typed engines. 42 harness engines; 23 emit on the recorded corpus. Path engines fire on Azure/AWS/GCP IaC. Case-70 exists on trunk (mermaid trust-boundary) but is **absent from the recorded table**.

**What is not.** Proof. `WouldDemoteAt65Count = 0`. Ten `security-baseline` findings survive on a +5 severity bonus with no evidence. Path engines at 72 have `No evidence` on every finding. QR-05 (honest `EvidenceRefs`) is still a draft PR.

**Classification:** V1 mechanism largely complete; **validation required**. **Affects outcomes 1, 3, 5.**

### 7.2 Correctness & Evidence Integrity — 73 · weight 12 · contribution 8.76 · deficiency 324

v8's three trunk defects closed. New Suite=Core red: orchestrator tests see empty `Findings` (likely provenance-hold moving uncited mocks into checklist / emission gate dropping Kind B heading fragments). `HasKindBProvenance` now correctly rejects `doc:…#services` under DX-70; the unit test was not updated.

**Classification:** V1. **Affects outcomes 1, 2, 4.**

### 7.3 Time-to-Value — 73 · weight 10 · contribution 7.30 · deficiency 270

Declaration-only reviews yield path findings. Mermaid can enter the graph. Gate 1 UNKNOWN. Azure extractor default still unshaped after an owner “Yes — Azure first.”

**Classification:** V1 residual + validation. **Affects outcomes 1, 3.**

### 7.4 AI / Agent Readiness — 76 · weight 10 · contribution 7.60 · deficiency 240

Real-mode effective-on for judge, generator, ranking priors, prose-assumption extraction. Synthetic eval; TB-883 blocked.

**Classification:** V1 mechanism complete; validation required. **Affects outcomes 1, 5.**

### 7.5 Differentiability / Defensibility vs Frontier AI — 83 · weight 13 · contribution 10.79 · deficiency 221

Pack-filtered declaration findings already differ on a fixed graph in Suite=Core. Buyer-visible recorded compare still missing.

**Classification:** V1 mechanism; demo residual. **Affects outcomes 1, 2, 5.**

### 7.6 Proof-of-ROI Readiness — 76 · weight 9 · contribution 6.84 · deficiency 216

Mechanism complete; G4 HOLD 0/3. **Affects outcomes 3, 4.**

### 7.7 Runtime & First-Review Reliability — 72 · weight 7 · contribution 5.04 · deficiency 196

merge_group exists; live queue does not. Newest completed corset red on 10 tests. Full matrix stale-red. **Affects outcomes 2, 3.**

### 7.8 Sponsor / Operator Comprehension — 78 · weight 8 · contribution 6.24 · deficiency 176

Help/operator polish continued. No sponsor has read a real-mode summary. **Affects outcomes 2, 4.**

### 7.9 Governed Review Integrity — 88 · weight 13 · contribution 11.44 · deficiency 156

Product rubric strong. Repo gate still weaker than the review gate until merge queue is applied. **Affects outcomes 2, 4, 5.**

### 7.10 Adoption Friction — 83 · weight 5 · contribution 4.15 · deficiency 85

Decisioning.Tests compiles. Extractor still opt-in. **Affects outcomes 2, 3.**

---

## 8. Top 10 Weaknesses

1. **`FindingsOrchestratorTests` on trunk return empty `Findings`.** Newest completed push corset: 10 Suite=Core failures after AS-024. Either provenance-hold moved uncited mocks into checklist (tests stale) or emission now drops typed findings that should remain. **Process + correctness; V1 blocker for re-proving Decisioning.**
2. **Kind B provenance test disagrees with DX-70.** `doc:manifest.json#services` is a heading fragment; `HasConcreteEvidenceCitation` requires `#L` + a digit. The validator is honest; the test is not. **Design/process.**
3. **Insight density is still mechanism-rich and proof-free.** Zero real-mode runs; synthetic frontier fixtures; `WouldDemoteAt65Count = 0`; 10/47 findings at threshold with no evidence. **Largest weighted deficiency (390). Validation.**
4. **Distribution markdown is stale relative to case-70.** Harness constant is 70; table header still case-69. Measurement honesty gap. **Process.**
5. **Live merge queue is not applied.** `merge_group` YAML + draft JSON shipped; GitHub still evaluates PR-branch SHAs. **Owner.**
6. **Gate 1 remains UNKNOWN.** Unchanged. **Validation.**
7. **Zero G-REAL-06 pilots.** Unchanged. **Market.**
8. **Live Azure inventory is still opt-in** after an unshaped owner “Yes.” **Blocked on user input** (soft-prompt slice is executable).
9. **Path engines score 72 with `No evidence` on every row** (`identity-blast-radius`, `data-flow-trust-boundary`, `segmentation-semantics`). They collect property-bag refs; corpus nodes still lack ARM/ARN/diagram citations. Case-70 mermaid is the cheapest place to attach `diagram:` refs. **Design.**
10. **Full `ci.yml` matrix has not been green in the inspected window (8/8).** Unchanged measurement. **Process.**

**Removed because genuinely fixed this cycle:** Decisioning.Tests CS7036; `typed-engine-protected` guard drift; OpenAPI Wave 68 snapshot red; missing `merge_group` trigger (YAML only).

---

## 9. Frontier-AI Analysis

| Capability | 12-month trajectory | Reason |
|---|---|---|
| Generic architecture critique | **Commodity now** | Any frontier model with pasted standards. |
| Declaration-derived path findings from IaC | **Durable → more valuable** | Graph the model does not author. |
| Diagram-compiled topology (mermaid / structured diagram) | **More valuable** | New this cycle: engines can cite shapes; a better model improves prose on a kernel it still cannot invent. |
| Policy-pack-driven theme enablement | **Durable** | Customer policy state is not in the model's context unless pasted every time. |
| Sealed manifest + audit | **Durable** | Organizational, not analytical. |
| Golden corpus as proof | **Neutral** | Regression safety, not advantage. |

**Hard-to-reproduce-via-prompting:** policy state, tenant-filtered vocabulary, sealed evidence, declaration gating, diagram→graph compile, audit. **Easy soon:** any single finding's prose.

**Leverage bet:** better models raise judge/generator/prose-assumption quality at ~zero ArchLucid engineering cost while deterministic engines and compiled diagrams guarantee the floor. Unproven.

**Displacement timeline:** one model release commoditizes finding prose; none commoditizes the customer's pack version or the sealed record.

**Final verdict:** ArchLucid is becoming more valuable faster than frontier AI is becoming capable **in mechanism**, and not at all **in evidence**. Survival probability is in §3.

---

## 10. Policy-Aware Governance Test

1. **Do policy packs drive behavior?** **Yes.** `PolicyFilteredDeclarationGoldenCorpusTests` already shows SOC 2 vs CIS-Azure emitting different declaration rows on one graph.
2. **Trace input → evidence → policy → recommendation → decision → audit?** Yes for typed-engine and declaration findings when citations resolve. Heading-fragment `doc:` refs no longer count (DX-70) — correct.
3. **Would frontier-AI-alone reproduce it consistently?** Not the traceability, tenant-filtered vocabulary, or sealed manifest.
4. **AI-generated vs governed infrastructure?** Prose is AI; edges, policy keys, manifests, audit, diagram compile are infrastructure.
5. **Proof the moat is real:** record the already-passing pack-toggle test as a buyer-visible artifact. **Now possible, still unrecorded.**
6. **Fastest validation:** G-REAL-06 run 1–2 with two packs.
7. **Demo behavior that makes it obvious:** side-by-side CIS-Azure vs SOC 2 on the same upload.

---

## 11. Principal Architect Dismissal Test

"I need this" trigger: upload AWS Terraform and get a named blast-radius + CIS-AWS rule without connecting an account — exists. "I did not think of that" is still unmeasured.

Most likely dismissal trigger: **"Show me a real run."** Likelihood **0.6–0.75**. Second trigger: **"Your own tests don't keep findings."** A clone that runs Decisioning.Tests hits 10 empty-snapshot failures on the last completed trunk corset.

Would they believe it beats "Claude + a good prompt + my standards pasted in"? **On mechanism, plausibly yes; on evidence, not yet.**

---

## 12. Founder Delusion Check

**Strongest assumption with weakest evidence:** that 42 harness engines and a case-69 table constitute density gains. They constitute *coverage*. Case-70 exists and is not in the table.

**Looks differentiated, is commodity:** finding prose.

**Looks ordinary, may be the moat:** `DeclarationSignalPolicyKeyMap` + mermaid→graph compile.

**Months-burning distraction:** DX-77; another 40-engine coverage pack; AS-076+ Career/Rehearsal chrome before Gate 1.

**Six-month freeze prescription:** fix orchestrator/Kind B today; apply merge queue; re-record distribution through case-70; run Gate 1; run G-REAL-06 with two packs; stop re-scoring.

**Most dangerous attractive distraction:** starting AS-076–AS-100 (Career vs Rehearsal / sharing) while Suite=Core is red.

**Most boring real moat:** sealed manifest + pack version on the audit row.

---

## 13. Competitive Reality Check & Moat Assessment

Current moat: policy-state-driven declaration gating, sealed evidence, governed workflow, diagram compile into the graph. Potential moat: path findings + diagram citations that improve with model quality. Weakest moat assumption: buyers will believe the mechanism without a run. Illusory moat: engine count. Boring-but-durable: audit + manifest. What makes it obvious: recorded pack-toggle compare.

---

## 14. Adoption & Monetization

**30-day usage:** strongest positive — declaration-only path findings plus mermaid ingest; strongest negative — nothing shown to a real architect. **Sponsor purchase:** blocker is G4 HOLD. **Why buy instead of more frontier licenses:** the license does not know the pack version, cannot seal evidence, and cannot tell you what changed since last quarter.

**Top monetization blockers:** (1) no real-mode proof row; (2) Gate 1 unobserved; (3) no recorded pack-toggle demo; (4) trunk Suite=Core red for technical buyers who clone; (5) G-COMMERCE-01; (6) no sponsor has read a real ROI summary.

**Top enterprise adoption blockers:** (1) live inventory opt-in; (2) extractor permission story per cloud; (3) procurement trust posture `(B)`; (4) no pilot references; (5) operator onboarding without founder; (6) merge-queue not live (internal credibility).

---

## 15. Most Important Truth

**The v8 trunk defects were real and they are gone — and trunk is still red, because the diagram spine tightened citations faster than the orchestrator tests.**

Compile, OpenAPI, and the ADR 0070 guard shipped. What the corset now proves is that `doc:#services` is not evidence and that mock findings vanish from `Findings`. **Fix emission vs hold vs DX-70 in one PR, apply the merge queue, then run one real review with two packs.** Nothing else in this document moves the weakest quality.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

---

## 16. Stop Doing List

**Not worth doing before V1:** DX-77; AS-076–AS-100 Career/Rehearsal chrome; Graph-RAG community default flip before TB-883 has a budget; prefix-family `IsThemeEnabled` (PP-01 already rejected it).

**Diminishing returns:** more engines without evidence refs; UI polish on routes no pilot has seen; more claim-honesty guards while Suite=Core is red.

**Founder behaviors that delay validation:** re-scoring before the orchestrator is green; approving Azure-extractor-default without picking soft/hard/wizard; treating a green PR check as a green trunk until merge queue is live.

**Enterprise-important but not V1-adoption:** MCP; CloudEvents webhooks; multi-region.

---

## 17. Top Improvement Opportunities

**Shipped this cycle — do not re-open:** QR-01–QR-04; AS-024; AS-034 case-70 (harness bump only); DX-51–DX-76; PP-01 Option B slice; prose-assumption Real-mode default.

### Tier 1 — Must Fix / Must Validate

**1. Restore Decisioning.Tests orchestrator emission (empty `Findings`).**
Tier 1 · Why: Suite=Core red on trunk; technical buyers who clone cannot re-prove findings. · Affected: Correctness, Runtime. · Evidence: run 34392453288, 10 failures, empty `Findings`. · Design 4 / Market 0 · **V1.** Cursor prompt: **QR-06**.

**2. Align Kind B unit fixture with DX-70 line-anchored `doc:` refs.**
Tier 1 · Why: same corset job; heading fragment `#services` is not concrete. · Affected: Correctness. · Evidence: `HasKindBProvenance_allows_resolvable_doc_ref`. · Design 2 / Market 0 · **V1.** Same PR as item 1 (**QR-06**).

**3. Re-record insight-density distribution through case-70.**
Tier 1 · Why: harness is 70; table still case-69. · Affected: Insight Density (honesty), Correctness. · Evidence: `LatestGoldenCorpusCaseNumber = 70` vs markdown header. · Design 2 / Market 0 · **V1.** **QR-07**. After item 1 is green.

**4. Enable merge queue (owner) — YAML already shipped.**
Tier 1 · **Owner.** Draft JSON in `.github/rulesets/golden-cohort-gate-merge-queue.json`. · Design 6 / Market 0.

**5. Execute Gate 1, then G-REAL-06 with two pack configurations.**
Tier 1 · **Validation.** Market 9 / Design 2.

### Tier 2 — High Leverage (Composer prompts QR-08–QR-15)

**6. Land QR-05 and extend evidence-ref honesty to the other 65-band engines** (`declaration-security-baseline`, `topology-security-drift`). **QR-08.**

**7. Attach `diagram:` citations from case-70 mermaid onto path engines** so 72-band rows can clear `no-concrete-evidence` when a shape exists. **QR-09.**

**8. Azure extractor first-review *soft* default** (prompt + skip, not hard gate) — executable portion of the unshaped owner “Yes.” **QR-10.**

**9. Record the pack-toggle compare as a checked-in quality artifact** (the unit test already passes). **QR-11.**

**10. Next ga-starter framework slice** (HIPAA or ISO remainder — PP-01 Option B). **QR-12.**

**11. Triage the full `ci.yml` matrix on one trunk commit.** **QR-13.**

**12. Working default: load prior sealed graph so topology-security-drift can fire on review two** (AS-053 leftover). **QR-14.**

**13. Bind existing Terraform/ARM graph nodes to diagram labels** (AS-043 leftover). **QR-15.**

Cursor prompts for items 1–3 and 6–13: [`../architecture/V9_QUALITY_ROI_COMPOSER_PROMPTS.md`](../architecture/V9_QUALITY_ROI_COMPOSER_PROMPTS.md) (**QR-06–QR-15**).

### Tier 3 — Hold

TB-883 ablation (budget-blocked); frontier capture with real transcripts (after G-REAL-06); per-version OpenAPI document; DX-77; AS-076+ Career/Rehearsal; prefix-family theme enablement.

---

## 18. Prompt Batching Guidance

**First — Composer, one PR:** QR-06 (orchestrator + Kind B). Merge nothing else until the push corset is green. **Composer-safe** if findings merely moved to `ChecklistCoverage`; **strong-model** if production engines also vanish.

**Second — Composer:** QR-07 (re-record case-70) then QR-08 (QR-05 + remaining 65-band engines).

**Third — Composer:** QR-09 (diagram citations on path engines) in parallel with QR-11 (pack-toggle artifact).

**Fourth — owner + Composer:** apply merge queue; Gate 1; then QR-10 (Azure soft default) once the owner confirms soft vs hard vs wizard — default the prompt to **soft**.

**Fifth:** QR-12 / QR-13 / QR-14 / QR-15 after the corset is green. Do not batch QR-13 (full matrix) with emission-semantic changes.

---

## 19. Model Usage Guidance

Composer for QR-06 (if hold-vs-test), QR-07, QR-08, QR-11, QR-13 docs/triage, QR-14/QR-15 mechanical bind. Stronger reasoning if QR-06 reveals production engines dropping Decision-grade rows. Owner for merge queue, Gate 1, G-REAL-06. No assessment re-run until QR-06 is green on trunk.

---

## 20. Pending Questions For Later

**Blocks V1:** QR-06; merge-queue apply; Gate 1; G-REAL-06; G-COMMERCE-01.

**Requires founder decision:** (a) apply merge queue now; (b) Azure-extractor default shape if not accepting the soft-prompt default in QR-10; (c) TB-883 monthly cap; (d) merge `#2641` (QR-05) vs wait for QR-08; (e) HIPAA vs ISO for the next ga-starter slice.

**Requires customer validation:** everything in §7.1's "what is not."

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

v9 is the pass where the repo finally compiled the golden corpus and then immediately demonstrated why merge queue exists: AS-024 tightened citations; DX-70 already required line anchors; orchestrator tests still believed heading fragments were Kind B; `Findings` went empty. That is principal-architect taste on the citation contract and a process failure on the test contract. The useful next move is small: **make Suite=Core mean “findings still emit,” then run one real review.**
