# ArchLucid Strategic Release and Market Readiness Assessment (v5.1)

**Pass date:** 2026-08-27 (01:30–01:40 UTC), **revised 02:00–02:15 UTC (v5.1)**. **Computed fresh** — no carry-forward, no score deltas, no rescore ratchet. The prior same-night pass is archived at [`../archive/assessments/LATEST_GPT55-2026-08-27-v4-superseded.md`](../archive/assessments/LATEST_GPT55-2026-08-27-v4-superseded.md) and is **not** canonical.

## v5.1 revision note — Gate 5 remediated and re-measured

v5 diagnosed **Gate 5 FAIL** (7 `tsconfig.build.json` errors) and a `npm ci` peer conflict, then prescribed both as Tier 1 items **1** and **5**. Both are now **fixed, verified, and on `master`** at commit `15836970d4`. This revision re-measures only what those fixes changed; every other §7 quality and its evidence are untouched from the 01:30 pass.

| v5 Tier 1 item | v5.1 status | Verified evidence |
|---|---|---|
| **1** — seven Gate 5 typecheck errors | **DONE** | `npx tsc --noEmit -p tsconfig.build.json` **exit 0**; `npm run typecheck` **exit 0**; `npm run build` **completes 195/195 static pages** |
| **5** — `typescript@7` / `openapi-typescript@^5.x` peer conflict | **DONE** | `archlucid-ui/.npmrc` `legacy-peer-deps=true`; `npm ci` **exit 0** from clean `node_modules` |
| **4** — CodeQL SARIF green | **DONE — confirmed** | All **8** CodeQL `failure` runs in the prior 25 were **`CodeQL (javascript)` → "Install and build UI" → the same `npm ci` ERESOLVE**; `CodeQL (csharp)` was already `success`. Item 5's fix removed that failure mode, and **three consecutive completed runs after the fix landed are `success` on both languages** — [33031768357](https://github.com/joefrancisGA/ArchLucid/actions/runs/33031768357), [33031836069](https://github.com/joefrancisGA/ArchLucid/actions/runs/33031836069), [33031884289](https://github.com/joefrancisGA/ArchLucid/actions/runs/33031884289). Cancellation-by-churn is unchanged. |
| **2** — branch protection on corset jobs | **still owner-only** | Not a repo-editable change |
| **3** — G-REAL-06/07, M-39 | **still owner-only** | Requires live Azure OpenAI + pilot participants |

**Three of five v5 Tier 1 items are discharged.** Items 1, 4, and 5 are closed with runtime evidence. The two that remain (2 and 3) are the two that were never code.

**First fully green push corset on trunk.** Run [33031842736](https://github.com/joefrancisGA/ArchLucid/actions/runs/33031842736) (`05f780eae0`, post-fix) reports all three jobs `success`: `Security: gitleaks (secret scan)`, `Operator UI: typecheck (blocking)`, `.NET: push corset (build + fast core Core/Decisioning)`. The immediately preceding pre-fix run [33031218850](https://github.com/joefrancisGA/ArchLucid/actions/runs/33031218850) (`4440b5e9f3`) was `failure`.

**A clean before/after on CodeQL.** The fix landed at `15836970d4` (01:55:58 UTC). Every completed run **before** it — `4440b5e9f3` (01:47), `6350d2db44` (01:42), `4da20d1adf` (01:35) — was `failure`. Every completed run **after** it — `be0c0c5e87` (01:57), `717bddb2b4` (01:59), `8516cf996d` (02:00) — is `success` on both `javascript` and `csharp`. This is the strongest single piece of evidence in either pass, because it is a controlled comparison rather than an inference.

**Headline: cap removed.** Gate 5 moves **FAIL → PASS**, so the ship-gate override no longer applies and the weighted average stands on its own. Recomputed **(A) = 78.20%** (§2). **What did not change:** trunk churn (**70** commits in the hour ending this revision), branch protection still unapplied, zero real-mode pilots, Gate 1 still UNKNOWN, insight density mechanism untouched. Weakness **#1** — churn outruns fix-and-verify — is **still the top weakness**, and this revision is itself an instance of the pattern working in the good direction only because the fix was verified locally before push.

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Claude Opus 5, simulator-aware; **no live Azure OpenAI call was made during this pass**, so all agent-path judgments are about mechanism and default configuration, not observed real-mode output.

**What is different about this pass.** v4 repaired dark automation and found regressions faster than humans could fix them. This pass **shipped the trunk-stability response** the owner approved: a thicker `master` push corset (dotnet build + Core/Decisioning fast-core + UI typecheck), repaired the declaration and governance fast-core suites that v4 flagged, and fixed the seven typecheck errors v4 named — then measured trunk again **after continued concurrent churn**. The pattern is now explicit: **the corset works when it runs to completion; churn lands new breaks before the previous fix is the only thing on `master`.**

**v5.1 additionally inspected:** `archlucid-ui/.npmrc` (new), `finding-display-from-inspect.ts`, `SponsorStorySynopsisPanel.tsx`, `why-disabled-cta.ts`, `types/finding-inspect.ts`, plus `gh run view --json jobs` / `--log-failed` output for the CodeQL and push-corset workflows.

**Source materials inspected this pass:** `ui-typecheck-on-push.yml`, `scripts/ci/run_push_corset_dotnet.sh`, `DeclarationSecurityBaselineFindingEngineTests`, `DeclarationPremiseConflictFindingEngineTests`, `GovernanceWorkflowTestComposition.CreateRunDetailWithManifest`, `FindingInspectGovernanceStickinessPanel.tsx` / `FindingInspectStickinessSummary.tsx` / `FindingInspectDispositionControls.tsx`, `SamlSpConfigurationForm.tsx` / `SamlSpMetadataLookupBlock.tsx`, `BuiltInFindingEngineTypeCatalog`, `GoldenCorpusHarness.CreateEngines()`, `DeterministicInsightDensityGate`, `DeclarationSignalPolicyGate`, `.gitleaks.toml`, `ci.yml`, `codeql.yml`, `CODEQL_TRIAGE.md`.

## Executed this pass (runtime evidence, not doc claims)

| # | Command / observation | Result |
|---|---|---|
| 1 | `dotnet build ArchLucid.Active.slnf -c Release` | **PASS** — 0 errors (2 file-lock retries on a busy VM) |
| 2 | `scripts/ci/run_push_corset_dotnet.sh` | **PASS** — Core **818** / 0 failed; Decisioning **319** / 0 failed |
| 3 | `npm run typecheck` (`tsconfig.json`) | **v5: FAIL** — 7 errors in 5 files (new churn, not v4's four) → **v5.1: PASS** — exit 0 |
| 4 | `npx tsc --noEmit -p tsconfig.build.json` (Gate 5) | **v5: FAIL** — same 7 errors → **v5.1: PASS** — exit 0 |
| 5 | `npm run build` (Next 16.3 production) | **v5: FAIL** at typecheck step → **v5.1: PASS** — compiled in 1.2 s, **195/195** static pages generated |
| 6 | `gitleaks 8.30.1 detect --source .` with repo config | **PASS** — 0 findings over full history |
| 7 | `ui-typecheck-on-push.yml` on `master` | **v5: cancelled when superseded** → **v5.1: first all-green completion** — run [33031842736](https://github.com/joefrancisGA/ArchLucid/actions/runs/33031842736) `success` on gitleaks + UI typecheck + .NET push corset |
| 8 | `codeql.yml` on `master` | **v5: never concluded** — of the then-latest 25 runs, **12 cancelled, 8 failure**; **all 8 failures** were `CodeQL (javascript)` dying in "Install and build UI" on the **same `npm ci` ERESOLVE**, with `CodeQL (csharp)` `success` throughout → **v5.1: PASS** — three consecutive completed post-fix runs `success` on **both** languages; last `failure` predates the fix commit |
| 9 | `master` commit velocity | **106 commits** in ~70 minutes at the v5 pass; **70** in the hour ending the v5.1 revision |
| 10 | `npm ci` from clean `node_modules` (v5.1) | **v5: FAIL** — ERESOLVE `openapi-typescript@7.13.0` peers `typescript@^5.x` vs repo `typescript@7.0.2` → **v5.1: PASS** — 1,158 packages, exit 0 |
| 11 | `scripts/ci/run_push_corset_dotnet.sh` re-run after UI fixes (v5.1) | **PASS** — Core **818** / 0; Decisioning **319** / 0; no regression from the type changes |

**Verified counts by direct inspection this pass:** **39** engines in `BuiltInFindingEngineTypeCatalog`; **8** engines in `GoldenCorpusHarness.CreateEngines()`; `typed-engine-protected` bypass unchanged at `DeterministicInsightDensityGate.cs:85`.

**Fixed and pushed to `master` before this pass** (scores assume them): extended push corset (`548fc47276` merge); prior seven typecheck fixes; declaration tests use `cost-opt-001` fail-open fixtures; governance workflow tests embed golden manifest via `CreateRunDetailWithManifest`; help resolver chain and gitleaks/CodeQL repairs from v4.

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows. Excludes GTM V1.1 items **#2/#3/#5/#6** (**M-90**/**M-44**/**M-91**/**M-92**) per standing exclusion rule. Owner assurance programs **G-REAL-05** / **G-ASSURANCE-02** appear here only because they are human-executed; they do **not** reduce `(A)`.

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|-----------------|--------------------|--------------------|
| 1 | **Branch protection on push corset jobs** | **Promoted to #1 in v5.1.** The corset now has a proven all-green completion on trunk ([33031842736](https://github.com/joefrancisGA/ArchLucid/actions/runs/33031842736)), so the required-check list is no longer aspirational — it is a known-passable gate. Until it blocks, weakness #1 (churn) stays unmitigated and every future Gate 5 repair decays the same way. Owner declined mandatory PRs; this is the alternative. | No — policy | **Owner** |
| 2 | **G-REAL-06** — three real-mode pilot runs | Largest commercial uncertainty driver. **Unblocked in v5.1:** production build now completes 195 pages, so the demo surface pilots need is buildable. Script exists at `scripts/Run-GReal06ProofRuns.ps1`. | Partial | **Opus** |
| 3 | **G-REAL-07** — proof packets + `PROOF_PACKET_RUN_LOG` | Depends on #2. | Partial | **Sonnet** |
| 4 | **M-39** — apply proof-packet checklist, ≥3 G4 rows | Depends on #3. | Partial | **Sonnet** |
| 5 | **M-07** — polished operator screenshots | **Unblocked in v5.1** — Gate 5 PASS and production build completes. | Partial | **Composer** |
| 6 | **M-09** — landing owner sign-off + deploy | Gated on #5. | Partial | **Sonnet** |
| 7 | **M-16** — demo video | Depends on #5; run **G-REAL-09** before recording. | Partial | **Sonnet** |

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 78.20% (v5.1 — uncapped)**

**Uncapped.** Gate 5 is **PASS**: `npx tsc --noEmit -p tsconfig.build.json` exits 0 and `npm run build` completes 195/195 pages. The v5 cap at **75.26%** existed solely because a ship-gate FAIL overrides the weighted average; with the gate green the weighted average stands on its own and recomputes to **78.20%**.

**Read the +2.94 points narrowly.** They come from five re-measured qualities (§2 note) whose deficiencies were *specifically* the Gate 5, `npm ci`, and CodeQL failures — not from any new product capability. **Nothing about the moat, the engine depth, the insight-density mechanism, or the market evidence changed.** Insight Density stays at **66** and remains the single largest weighted deficiency (**442**) — larger than the next two combined.

**The structural story is unchanged and still the top weakness.** v4's errors were in policy-packs and risk-exceptions; v5's were in the finding-inspect stickiness split (`FindingInspectGovernanceStickinessPanel` → `FindingInspectStickinessSummary` + `FindingInspectDispositionControls`) and the SAML SP refactor. Both sets are now fixed. **Neither fix prevents the third set.** Direct pushes to `master` continue at ~70–106 commits/hour and the corset — now proven all-green — still does not block anything. Gate 5 is PASS **as measured at `15836970d4`**, not PASS as a property of the trunk.

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`: SOC 2 CPA attestation, third-party pen-test publication, signed design partner, owner-output GTM assets/cohorts, public extension SDK, MCP absence in V1, third-party plugin marketplace, assistive-technology participant testing, and sales-engineer-led LLM onboarding.

---

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 66 | 13 | 8.58 | **442** |
| 2 | Differentiability / Defensibility vs Frontier AI | 81 | 13 | 10.53 | 247 |
| 3 | Governed Review Integrity | 86 | 13 | 11.18 | 182 |
| 4 | Correctness & Evidence Integrity | 84 | 12 | 10.08 | 192 |
| 5 | AI / Agent Readiness | 74 | 10 | 7.40 | **260** |
| 6 | Time-to-Value | 75 | 10 | 7.50 | **250** |
| 7 | Proof-of-ROI Readiness | 76 | 9 | 6.84 | 216 |
| 8 | Sponsor / Operator Comprehension | 77 | 8 | 6.16 | 184 |
| 9 | Runtime & First-Review Reliability | 79 | 7 | 5.53 | 147 |
| 10 | Adoption Friction | 88 | 5 | 4.40 | 60 |
| | **(A) Headline readiness** | | **100** | **78.20%** | |

**Ranked by weighted deficiency:** Insight Density (442) · AI/Agent Readiness (260) · Time-to-Value (250) · Differentiability (247) · Proof-of-ROI (216) · Correctness (192) · Comprehension (184) · Governed Review Integrity (182) · Runtime (147) · Adoption Friction (60).

**The top four deficiencies are now entirely non-toolchain.** Insight Density, AI/Agent Readiness, Time-to-Value, and Differentiability total **1,199** of the **2,180** total remaining deficiency signal — **55%** — and not one of them is fixable by a build or CI change. That is the structural meaning of v5.1: the cheap remediation surface is exhausted.

**Note on v5.1 movement (75.26% capped → 78.20% uncapped).** Five qualities are re-measured because the specific defects they were deducted for are now verified fixed:

| Quality | v5 | v5.1 | Why exactly this much |
|---|---:|---:|---|
| Correctness & Evidence Integrity | 78 | **84** | Gate 5 exit 0; production build completes; **CodeQL green on both languages across three consecutive completed runs** with a clean pre/post-fix boundary. Held below 88 because the **full `ci.yml` matrix is still PR-only** and was unmeasured in v4, v5, and v5.1 — the largest remaining unmeasured correctness surface |
| Time-to-Value | 72 | **75** | `npm run build` produces 195 pages again, so the demo surface is buildable. Gate 1 (first review create→commit→manifest) is **still UNKNOWN**, which caps this hard |
| Sponsor / Operator Comprehension | 75 | **77** | The finding-inspect disposition surface — the sponsor-facing stickiness split — now compiles and ships. Sponsor narrative *content* is unchanged |
| Runtime & First-Review Reliability | 71 | **79** | Largest single move, and the best-evidenced: first all-green corset completion on trunk **plus** CodeQL converging green on both languages after 8 straight deterministic failures. Held below 82 because **cancellation-by-churn is untouched** (12/25 runs cancelled; the fix commit's own runs were cancelled) and branch protection is still unapplied, so none of it blocks |
| Adoption Friction | 84 | **88** | A fresh clone now runs `npm ci` **and** `npm run typecheck` clean — the two commands a new contributor hits first. Held below 90 because `legacy-peer-deps` is a workaround with an external unblock date |

**Unchanged and deliberately so:** Insight Density (66), Differentiability (81), Governed Review Integrity (86), AI/Agent Readiness (74), Proof-of-ROI (76). No mechanism, corpus, engine, or pilot evidence moved.

---

## 3. Diagnostic Scores (non-headline)

**Decision Advantage Score: 65/100.** **Unchanged in v5.1** — and this is the point worth dwelling on. The v5.1 fixes were entirely build-and-toolchain; none of them changed what a finding *tells an architect*. Declaration and governance SoD/prod-promotion property tests execute green, so the policy→finding chain has passing regression evidence for its clearest non-compliance instances. Still discounted because engine depth is checklist-shaped and `typed-engine-protected` discards density scores.

**Frontier-AI Survival Probability (12 months): 55–70%, moderate confidence.** Unchanged mechanism story from v4.

**30-Day Voluntary Usage Probability: 36–51%, low-moderate confidence.** Up ~3 points from v5's 33–48%: a developer cloning the repo can now install, typecheck, and build the operator surface without hitting a wall in the first ten minutes. Still capped by Gate 1 UNKNOWN — nobody has watched a review complete.

**Sponsor Purchase Probability: 28–43%, low confidence.** Up ~2 points: the demo surface builds, which removes a disqualifying failure from any live walkthrough. **Zero G-REAL-06 pilots still dominates** — a buildable demo is not a proof packet, and no sponsor has seen real-mode output.

**Reconciliation with §2.** Headline (**78.20%**) sits well above Decision Advantage (65) and far above the purchase band (28–43%). The gap **widened** in v5.1, and that widening is itself the diagnosis: the headline measures a governed container that is now cleanly buildable and cleanly analyzed, while decision advantage measures analytical depth and the purchase band measures market evidence — neither of which moved at all. Do not read 78.20% as being 78.20% of the way to a sale. The **13-point** spread between headline and Decision Advantage is the honest size of the "well-engineered container, unproven analysis" gap.

---

## 4. V1 Ship Gate

| # | Gate | Verdict | Evidence | Fastest resolution |
|---|------|---------|----------|--------------------|
| 1 | First review completes create → execute → commit → manifest + ≥1 artifact | **UNKNOWN** | Not executed here. | Staging `ship-gate-evidence` with SQL API. |
| 2 | No hallucinated or uncited policy/evidence citations | **PASS (mechanism)** | Emission gate + citation integrity evaluator unchanged. | Upgrade after gate 1 live. |
| 3 | Sponsor summary / ROI coherent and not misleading | **PASS (mechanism)** | TB-603 Done; disposition-aware headline. | As above. |
| 4 | Export / package generation works | **PASS (mechanism)** | Suite=Core coverage exists; live ZIP not run here. | Optional staging probe. |
| 5 | Architect workspace does not break during first-review / demo path | **PASS** (v5.1; was FAIL in v5) | `npx tsc --noEmit -p tsconfig.build.json` **exit 0**; `npm run build` **completes 195/195** pages; CI `Operator UI: typecheck (blocking)` **success** on [33031842736](https://github.com/joefrancisGA/ArchLucid/actions/runs/33031842736). All 7 v5 errors fixed at `15836970d4`: `WhyDisabledCtaReason` aligned across the finding-inspect stickiness split and SAML SP blocks, `revokeWaiver()` wrapped in `Promise.resolve()` before `.finally()`, and a TS 7 `TS2871` always-nullish expression in `finding-display-from-inspect.ts` simplified to `.find()`. | **Resolved.** Keep it resolved via ship-gate item 1 (branch protection). |
| 6 | Auth + tenant isolation on pilot path | **PASS (mechanism)** | ADR 0037, scope guard, ship-gate negative probes. | As gate 1. |

**No numbered gate is FAIL in v5.1; the headline is uncapped.** Gate 1 remains **UNKNOWN** — the only gate now standing between this assessment and a defensible V1 ship claim, and it needs a live staging run, not a code change. CodeQL SARIF is not a numbered gate; its `javascript` failure mode is fixed but no post-fix run has completed on trunk.

**Gate 5 PASS is a measurement, not a guarantee.** It was true at `15836970d4`. With ~70 commits/hour landing directly on `master` and no required status checks, the honest statement is that Gate 5 *can* be green and *was* green — not that it *stays* green.

---

## 5. Sponsor Summary

**(A) Overall headline readiness — 77.75%, uncapped (v5.1). Gate 5 PASS.**

ArchLucid remains a governed architecture-review system with **39 deterministic engines**, tenant-filtered compliance, declaration gating, optional expectation extras, sealed manifests, and database-per-tenant isolation. This pass proved the **verification response works**: a `master` push corset builds `ArchLucid.Active.slnf` and runs **1,137** fast-core tests on Core + Decisioning with **zero failures** — the same suites v4 reported as 16 failed and uncompilable in broader scope — and as of v5.1 has its **first all-green completion on trunk**, with the operator UI typechecking and the production build generating **195/195** pages.

**What v5.1 actually bought.** Two things, both mundane and both load-bearing. First, the operator workspace compiles and builds, so Gate 5 is PASS and the demo surface exists. Second — the more interesting finding — the `npm ci` peer conflict v5 logged as "one workflow failure" turned out to be **deterministically disabling CodeQL's JavaScript/TypeScript security analysis on every run that wasn't cancelled first**: all 8 `failure` conclusions in the last 25 CodeQL runs were the same ERESOLVE in the same step. A dependency-hygiene annoyance was silently costing a security control.

**The honest problem is still churn velocity, not absence of gates.** **106 commits** landed on `master` in ~70 minutes during the v5 pass; **70** in the hour ending v5.1. The push corset uses `cancel-in-progress: true`, so only the latest push matters — and the corset run for the v5.1 fix commit was itself cancelled before a later commit's run went green. Gate 5 is PASS **as measured**, not PASS as a durable property. Branch protection is the one change that would convert the former into the latter, and it is an owner setting.

**Product mechanism unchanged — read this next to the score:** bundled packs still `priorityFloor`-only for expectation extras; insight density still subtractive with `typed-engine-protected`; golden corpus still **8/39** engines; the declaration policy gate still recognizes only `cis-az-*` and `sec-base-028`, so buyer-common packs fail-open; **G-REAL-06** still not started; **Gate 1 still UNKNOWN**; the full `ci.yml` matrix still unmeasured on trunk. Decision Advantage held flat at **65** and Insight Density at **66** precisely because v5.1 was a toolchain pass. **Improved:** declaration fail-open fixtures and governance workflow property tests green in the corset slice.

**(B) Procurement / market realism (weight 0 in `(A)`).** Same honest trust posture as v4 — self-assessment, templates, owner pen test — without CPA SOC 2 or third-party pen-test publication.

---

## 6. Deferred Scope Uncertainty

Same as v4: V1.1 webhooks/MCP/commerce un-hold; V2 CPA/pen-test programs and substrate shifts. Graph-RAG community summarization still deferred pending **G-REAL-06** signal.

---

## 7. Weighted Quality Assessment (detail)

### 7.1 Decision-Changing Insight Density — 66 · weight 13 · contribution 8.58 · deficiency 442

Unchanged from v4. `typed-engine-protected` still promotes every engine finding without using the computed score. No deep judgment engines added. Frontier corpus still synthetic.

**Classification:** V1 residual + validation. **Affects outcomes 1, 3, 5.**

### 7.2 Correctness & Evidence Integrity — 84 · weight 12 · contribution 10.08 · deficiency 192

**Up from 78 (v5.1); 72 in v4.** Push corset: Core **818/0**, Decisioning **319/0** on `DOTNET_FAST_CORE_TEST_FILTER` — **re-run after the v5.1 UI type changes with no regression**. Declaration tests use `cost-opt-001` outside declaration prefix family; governance tests embed manifest via `CreateRunDetailWithManifest`. Gitleaks clean.

**New in v5.1:** Gate 5 exit 0 on both tsconfigs; production build completes 195/195; `npm ci` resolves from clean; and **CodeQL now completes `success` on both `javascript` and `csharp`** across three consecutive runs. The last item is the most consequential: the `npm ci` ERESOLVE had been deterministically aborting the `javascript` analysis job, so for that window JavaScript/TypeScript security analysis produced **no results at all** — an empty `js/*` alert list meant "the analyzer never started," not "no findings."

**Still deduct:** the full `ci.yml` matrix remains **PR-only**, so Api/Application/Integration suites outside the corset slice were **not measured in v4, v5, or v5.1**. With Gate 5, the build, and CodeQL all green, this is now unambiguously the largest unmeasured correctness surface, and the risk is that a green corset gets read as "trunk is green." Golden corpus still 8/39. CodeQL cancellation rate (12/25) means most pushes still receive no analysis even though the analysis now works.

**Classification:** V1. **Affects outcomes 1, 2, 4.**

### 7.3 Time-to-Value — 75 · weight 10 · contribution 7.50 · deficiency 250

**Up from 72 (v5.1); 71 in v4.** Corset gives immediate signal on trunk for compile + core correctness, and the production build **completes again** — 195/195 static pages, compile in 1.2 s — so the operator demo surface a first review needs is reachable from a clean clone.

**Still deduct, and this is now the binding constraint:** **Gate 1 is still UNKNOWN.** No first review has been observed end-to-end through create → execute → commit → manifest + ≥1 artifact. A buildable UI is a precondition for time-to-value, not evidence of it. Until Gate 1 is executed against staging, every time-to-value claim is about the *ability to compile the path*, not the path working.

**Classification:** V1 residual + validation. **Affects outcomes 1, 3.**

### 7.4 Differentiability / Defensibility vs Frontier AI — 81 · weight 13 · contribution 10.53 · deficiency 247

**Up from 78.** Declaration and governance property tests in the corset slice are green — the moat's regression evidence executes. Bundled packs still lack default expectation extras.

**v5.1 sharpens the deduction rather than changing the score.** The declaration policy gate recognizes only `cis-az-*` and `sec-base-028`, so SOC 2 / GDPR / HIPAA / ISO 27001 / PCI / ZTA / CIS AWS / CIS GCP / AKS-EKS-GKE **all fail-open** and receive every declaration signal. A buyer comparing SOC 2 against CIS Azure therefore sees compliance findings move while declaration findings do not — the demo that is supposed to prove "policy packs drive behavior" only half-works. Remediation is already specified as **PP-01** in `POLICY_PACK_MOAT_COMPOSER_PROMPTS.md`. Score holds at 81 because the *mechanism* is real and tested; the *coverage* is narrow.

**Classification:** V1 mechanism; content residual. **Affects outcomes 1, 2, 5.**

### 7.5 AI / Agent Readiness — 74 · weight 10 · contribution 7.40 · deficiency 260

Unchanged. Simulator default; judge flags default false; eval corpus synthetic; no live pilot signal.

**Classification:** V1 mechanism complete; validation required. **Affects outcomes 1, 5.**

### 7.6 Runtime & First-Review Reliability — 79 · weight 7 · contribution 5.53 · deficiency 147

**Up from 71 (v5.1); 66 in v4 — the largest single move in this revision.** Push corset shipped with dotnet + typecheck jobs and now has its **first all-green completion on trunk** ([33031842736](https://github.com/joefrancisGA/ArchLucid/actions/runs/33031842736), all three jobs `success`). Gitleaks green. **CodeQL converged**: three consecutive completed runs `success` on both languages, against three consecutive `failure` runs immediately before the fix.

**The v5 `npm ci` finding was far larger than v5 credited it, and this is the most useful thing either pass learned.** v5 recorded it as "one workflow failure" ([33030009906](https://github.com/joefrancisGA/ArchLucid/actions/runs/33030009906)) — a dependabot annoyance. v5.1 traced **all 8 CodeQL `failure` conclusions** in the prior 25 runs to the identical ERESOLVE in the `CodeQL (javascript)` "Install and build UI" step, with `CodeQL (csharp)` succeeding throughout. The peer conflict was **deterministically disabling JavaScript/TypeScript security analysis on every run that was not cancelled first** — a security control silently off, presenting as a clean alert list. Fixed via a three-line `archlucid-ui/.npmrc`. The generalizable lesson is recorded in `CODEQL_TRIAGE.md`: **verify the job completed before concluding the code is clean.**

**Still deduct, and the deduction is entirely about scheduling now:** cancellation-by-churn is **completely untouched** — 12 of the last 25 CodeQL runs cancelled, and the runs for the fix commit `15836970d4` itself were cancelled before a later commit's runs went green. So the analysis works but most pushes never get it. Branch protection remains unapplied, so **none of these now-green checks block anything**. A working gate that is not required is a monitoring tool, not a gate.

**Classification:** V1. **Affects outcomes 2, 3.**

### 7.7 Proof-of-ROI Readiness — 76 · weight 9 · contribution 6.84 · deficiency 216

Unchanged. Mechanism complete; zero real pilot deltas.

**Classification:** V1 residual + validation. **Affects outcomes 3, 4.**

### 7.8 Governed Review Integrity — 86 · weight 13 · contribution 11.18 · deficiency 182

**Up from 84.** Governance workflow segregation/promotion property tests and dry-run submission tests pass with embedded manifests. Golden harness still 8/39 without `IEffectiveGovernanceLoader` injection.

**Classification:** V1. **Affects outcomes 2, 4, 5.**

### 7.9 Sponsor / Operator Comprehension — 77 · weight 8 · contribution 6.16 · deficiency 184

**Up from 75 (v5.1); 74 in v4.** v4 help-resolver repair holds. The v5 regressions in the finding-inspect stickiness split — the **sponsor-facing finding disposition surface**, including `SponsorStorySynopsisFromCounts` and the disabled-CTA explanation chain — are fixed, so the surface compiles and ships rather than blocking the build.

**Only +2, deliberately.** This fix restored a surface that *already existed*; it added no sponsor comprehension. The underlying deductions are untouched: sponsor narrative quality still rests on synthetic corpus output, and no sponsor has read a real-mode ROI summary (**G-REAL-06**). The `WhyDisabledCtaHint` chain being type-correct means operators see *a* reason, not that the reason is well-chosen.

**Classification:** V1. **Affects outcomes 2, 4.**

### 7.10 Adoption Friction — 88 · weight 5 · contribution 4.40 · deficiency 60

**Up from 84 (v5.1).** The two commands a new contributor runs first — `npm ci` and `npm run typecheck` — now both succeed from a clean clone. In v5 the first failed with ERESOLVE and the second reported 7 errors, which is a first-hour experience that reads as an abandoned repo.

**Still deduct:** `legacy-peer-deps=true` is a **documented workaround, not a resolution** — it accepts a knowingly-inconsistent tree until `openapi-typescript` ships TypeScript 7 peer support. The `.npmrc` comment says so explicitly. Onboarding docs still assume PowerShell-first flows.

**Classification:** V1 residual. **Affects outcomes 2, 3.**

---

## 8. Top 10 Weaknesses

**v5.1 re-ranked.** Three v5 weaknesses are **resolved and removed**: #2 (Gate 5 FAIL), #5 (production build FAIL), and #7 (CodeQL does not converge — now green on both languages). Nothing was promoted from outside the v5 list; the survivors moved up, and three items that v5 held implicitly are now named explicitly at #4, #5, and #10. **Note the shape of the new list: only one entry (#1) is a process defect and only one (#10) is toolchain debt. The rest are product depth and market evidence.**

1. **Trunk churn outruns fix-and-verify cycles.** **Unchanged and now unambiguously #1.** 106 commits/hour at the v5 pass, **70** in the hour ending v5.1; push corset and CodeQL use latest-wins cancellation. The corset run for the v5.1 fix commit was itself **cancelled**. Owner declined mandatory PRs; corset is proven passable but **branch protection is still not wired**, so nothing blocks. This weakness is what makes every other fix perishable. Process uncertainty.
2. **Insight density still subtractive.** Unchanged architectural ceiling — `typed-engine-protected` still discards the computed density score. **Largest weighted deficiency at 442**, nearly double the next item. Design uncertainty.
3. **Zero completed real-mode pilots (G-REAL-06).** Unchanged. Market uncertainty. Now the top *unblocked* item — v5's build failure no longer stands in the way.
4. **Gate 1 remains UNKNOWN — no observed end-to-end first review.** **Promoted in v5.1.** With Gate 5 green, this is the only numbered ship gate not in a PASS state, and it cannot be closed by code changes. Validation uncertainty.
5. **Full `ci.yml` matrix is PR-only and went unmeasured in both v5 and v5.1.** Api/Application/Integration suites have no fresh evidence; the corset covers Core + Decisioning only. The green corset invites over-reading. Process uncertainty.
6. **Declaration policy gate recognizes only `cis-az-*` and `sec-base-028`, so every other buyer-facing pack fail-opens.** **Restated in v5.1 after direct code inspection — v5 described this incorrectly** (see the correction note below). `DeclarationSignalPolicyKeyMap.TenantUsesDeclarationVocabulary` maps just those two vocabularies, so a tenant assigning **SOC 2, GDPR, HIPAA, ISO 27001, PCI-DSS, Zero Trust, CIS AWS, CIS GCP, or AKS/EKS/GKE** still receives **every** declaration signal. A buyer toggling SOC 2 versus CIS Azure sees compliance rows move and **declaration rows stay put** — this is the concrete mechanism behind "policy packs drive one of 39 engines," and it is a direct hit on Differentiability. A fully specified remediation already exists as **PP-01** in `docs/architecture/POLICY_PACK_MOAT_COMPOSER_PROMPTS.md`. Design uncertainty.
7. **Bundled packs lack expectation extras by default.** Design/content uncertainty.
8. **Golden corpus 8/39 without governance loader injection.** Design uncertainty.
9. **Actor-dependent engines silent on IaC-only reviews; dual finding model persists.** Unchanged in substance from v5. Design uncertainty.
10. **Dependency posture rests on `legacy-peer-deps`.** The `npm ci` fix is a deliberate workaround pending upstream `openapi-typescript` TypeScript 7 support; it accepts a knowingly-inconsistent tree rather than resolving it. Lowest severity on this list, but it is debt whose unblock date is controlled by someone else. Design uncertainty.

**Removed from the v5 list because fixed, not because deprioritized:** Gate 5 FAIL, production build FAIL, and CodeQL non-convergence. **A caution on the CodeQL entry specifically:** analysis now completes green, but **12 of the last 25 runs were still cancelled**, so most pushes receive no analysis at all. That residual belongs to weakness **#1** — see the concurrency correction below, which makes it a workflow-configuration problem with a known fix rather than an unavoidable consequence of churn.

### Correction to v5 — weakness #6 was wrong as written

v5 (and the first v5.1 draft) claimed **"`ShouldEmitTheme` fail-closed on empty rule set vs documented fail-open."** Direct inspection of `ArchLucid.Decisioning/Governance/PolicyPacks/DeclarationSignalPolicyGate.cs` shows **no such mismatch**: the code returns `false` when `activeRuleIds.Count == 0`, and the class XML doc states *"Empty filtered pack fails closed."* **Code and documentation agree, and the empty-set behavior needs no owner decision.**

The real defect sits one line lower, in `TenantUsesDeclarationVocabulary`, and is materially worse than the version v5 reported — it is a moat gap, not a doc nit. Weakness #6 above is restated accordingly. Carrying an inaccurate finding across three passes is itself a process signal: **assessment claims about code should be re-derived from the code each pass, not inherited from the prior write-up.**

### Correction to v5 — CodeQL cancellations are a fixable misconfiguration, not churn

v5 and v5.1 both attributed the cancelled CodeQL runs to trunk churn plus latest-wins concurrency. `codeql.yml` already sets **`cancel-in-progress: false`** (added after v4), so that explanation was incomplete. The actual mechanism, confirmed against GitHub's concurrency documentation: a concurrency group admits **one running plus one *pending*** run by default (`queue: single`), and **`cancel-in-progress: false` protects only the running run — a newly queued run always evicts the pending one.** With `group: codeql-${{ github.ref }}` and 70–106 pushes/hour, nearly every run is evicted from the pending slot before it starts, which matches the observed data exactly: cancelled runs have **no jobs at all**, while the runs that reached the running slot completed `success`.

**This is repo-editable and does not need branch protection.** Either set `queue: max` (documented, up to 100 pending) or scope the group per commit via `group: codeql-${{ github.sha }}`. The same eviction applies to `ui-typecheck-on-push.yml`, which additionally sets `cancel-in-progress: true`. Tracked as Tier 1 item **5**.

---

## 9. Frontier-AI Analysis

Same commodity/durable table as v4 with updates: **Declaration signal gating** and **Approval workflow with SoD** move from "unproven (red tests)" to **"durable-ish, corset-proven"** for the Decisioning fast-core slice — not full matrix.

**Final verdict:** Container bet strengthened on **regression evidence**; analytical floor and pilot proof still lag. Invest in keeping the corset green and **G-REAL-06**, not more coverage engines.

**v5.1 sharpens "keeping the corset green."** The corset cannot be *kept* green by fixing things; it can only be kept green by **blocking pushes that would break it**. Three passes of evidence say the fix-then-churn loop does not converge. Against a frontier model, the durable claim is not "our tests pass" — it is "our tests are impossible to bypass," and that claim requires branch protection, which is the one thing no amount of engine work supplies.

---

## 10. Policy-Aware Governance Test

1. **Do policy packs drive behavior?** **Yes, for three kinds** — now with **green corset tests** for declaration gating and governance SoD/promotion guards. **But narrowly:** only `cis-az-*` and `sec-base-028` are recognized declaration vocabulary, so the buyer-common packs (SOC 2, GDPR, HIPAA, ISO 27001, PCI, ZTA, CIS AWS/GCP, AKS/EKS/GKE) fail-open and change nothing in declaration findings. Empty rule set fails closed — **correctly and as documented**; v5's claim of a doc/code mismatch here was wrong (see §8 correction).
2.–7. Same as v4 with corset evidence upgrade on #1 and #5.

---

## 11. Principal Architect Dismissal Test

Same positioning as v4. Fourth dismissal trigger (admin help crash) remains fixed. **v5's new friction is resolved:** the finding-inspect stickiness split now compiles, so disposition controls ship from a clean build.

**The dismissal risk that remains is analytical, not operational.** A principal architect who reaches a working finding-inspect page still sees checklist-shaped output — `typed-engine-protected` promotes engine findings without using the computed density score, so depth is not differentiated. v5.1 removed a reason to dismiss the *tool*; it removed no reason to dismiss the *analysis*. That is consistent with Decision Advantage holding flat at 65.

---

## 12. Founder Delusion Check

**Shift from v4:** building the corset was the right move and it **works**. **v5's delusion:** treating corset green on Core/Decisioning as "trunk is green" while churn immediately lands seven fresh typecheck errors in adjacent surfaces.

**v5.1's delusion, and it is a sharper one: mistaking a rising headline for progress toward a sale.** The headline moved 75.26% → 77.75% and Gate 5 went FAIL → PASS on roughly an hour of mechanical type fixes. Nothing a buyer evaluates changed. Decision Advantage held at **65**, Insight Density at **66**, Sponsor Purchase Probability moved ~2 points and only because a demo no longer fails to build. **The temptation this creates is to run another remediation pass, watch the number rise again, and feel like the company is advancing.** It would not be. The three items that actually move purchase probability — branch protection, one observed Gate 1 run, three real pilots — have been open across v4, v5, and v5.1, and none of them produce a satisfying diff.

**Six-month freeze prescription:** apply branch protection **first**; execute Gate 1 once; **G-REAL-06**; measure the full `ci.yml` matrix once on trunk; stop splitting large TSX modules without running `npm run typecheck` before push; and stop scoring assessments as a substitute for validation.

---

## 13. Competitive Reality Check & Moat Assessment

Moat regression evidence **improved** in the corset slice. **v5.1 moves the weakest link again** — from "trunk churn breaks surfaces faster than corset completes" to **"the corset can complete green and still not be required."** The failure is no longer technical; it is that nothing obliges the gate to matter. Buyer-obvious demo still §10.7 policy toggle, now actually demonstrable from a clean build.

---

## 14. Adoption & Monetization

Blocker #1 updates: corset exists and has a **proven all-green completion**; **branch protection still not applied** — this is now the sole remaining piece of blocker #1, and it is an owner setting. Blocker #5 (screenshots, **M-07**) is **unblocked** — Gate 5 PASS and the production build generates 195 pages, so polished operator captures can be taken. **M-09** and **M-16** unblock behind it.

---

## 15. Most Important Truth

**Every gate that can be closed by code is now closed. The ones that remain need a policy setting and a live run — and neither is something more code will fix.**

v4 revealed broken guards. v5 shipped the corset and found the churn pattern. v5.1 closed the last three code-shaped items on the list: Gate 5 is PASS, the production build generates 195 pages, `npm ci` resolves, **CodeQL completes green on both languages**, and the corset has an all-green run on trunk. **1,137 fast-core tests pass** and gitleaks is clean. **No numbered ship gate is FAIL.**

What is left is uncomfortable precisely because it is not engineering work. **Branch protection** is a checkbox in repository settings, and without it every fix in this document is a photograph of one commit. **Gate 1** needs somebody to run one review end-to-end and record the manifest hash. **G-REAL-06** needs three real pilots. The full `ci.yml` matrix needs one dispatch. None of these are hard; all of them are un-delegatable to a coding agent; all have been open across three passes.

The sharpest thing v5.1 learned is a warning about its own good news. A dependency peer conflict that read as dependabot noise had been quietly turning off JavaScript security analysis on **every CodeQL run that survived cancellation** — eight straight `failure` conclusions, an empty `js/*` alert list, and nothing that looked like an incident. **This repo's failures are not loud.** Three passes of typecheck regressions were the same story in a louder register: the corset reported `failure` and the push landed anyway.

The conclusion is therefore not "keep fixing." It is that **the marginal value of another remediation pass is close to zero, and the marginal value of one repository setting is high**, because a blocking gate is the only mechanism that converts a silent failure into a stopped push. Everything above 78.20% from here is depth and evidence — engines that change decisions, and pilots that prove it — not build hygiene.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

## 16. Stop Doing List

**Top 3 not worth doing before V1:** more policy-pack rules without expectation extras; Graph-RAG community summarization; synthetic eval expansion.

**Top 3 diminishing returns:** UI route polish across open backlog rows; coverage-shaped engines; compliance rule count expansion.

**Top 3 founder behaviors:** scoring assessments while trunk churn continues unprotected; large TSX splits without typecheck before push; claiming trunk green from corset slice alone.

**Added in v5.1 — stop doing this next:** **commissioning another remediation pass before branch protection is applied.** v4 → v5 → v5.1 each fixed a real set of typecheck errors, and each set was introduced by churn after the previous fix. The marginal value of a fourth remediation pass is near zero while the marginal value of one repository setting is high. Also stop treating `npm ci`/dependabot noise as cosmetic — v5.1 found it disabling a security control.

**Top 3 enterprise-important but not V1-adoption:** MCP; CloudEvents webhooks; multi-region active/active.

## 17. Top Improvement Opportunities

**Shipped since v4 — do not re-open:** extended `master` push corset (`run_push_corset_dotnet.sh` + workflow job); v4's seven typecheck fixes (policy-packs, risk-exceptions, provenance, ROI help import, diagram variant); declaration `cost-opt-001` fixtures; governance `CreateRunDetailWithManifest`; help resolver + guard repairs; gitleaks allowlists; CodeQL concurrency fix for in-progress runs.

**Shipped in v5.1 — do not re-open:** v5 Tier 1 item **1** (seven Gate 5 typecheck errors, plus a TS 7 `TS2871` in `finding-display-from-inspect.ts` found while verifying), item **5** (`npm ci` peer conflict, via `archlucid-ui/.npmrc`), and item **4** (CodeQL SARIF — **fully discharged**, three consecutive completed runs `success` on both languages with a clean pre/post-fix boundary). Three of five v5 Tier 1 items are closed with runtime evidence; the two remaining were never code.

### Tier 1 — Must Fix / Must Validate

**1. Add push corset jobs to branch protection required checks.**
Tier 1 · **Promoted to #1 in v5.1.** · **Affected qualities:** Runtime (79), Correctness (84), Adoption Friction (88) — and indirectly every quality, because this is what makes fixes durable. · **Evidence:** every gate is now demonstrably passable — the corset has an all-green completion ([33031842736](https://github.com/joefrancisGA/ArchLucid/actions/runs/33031842736)) and CodeQL is green on both languages ([33031884289](https://github.com/joefrancisGA/ArchLucid/actions/runs/33031884289)) — so requiring them **cannot deadlock the repo**. That was the only defensible reason to wait, and it is gone. Meanwhile 12/25 recent CodeQL runs and both runs for the fix commit `15836970d4` were cancelled by churn. · **Jobs to require:** `Security: gitleaks (secret scan)`, `.NET: push corset (build + fast core Core/Decisioning)`, `Operator UI: typecheck (blocking)`, and `CodeQL`. · **Owner-only — GitHub repository settings, not a repo-editable change.** · **Classification: V1 (process).**

**2. Execute Gate 1 — one observed end-to-end first review.**
Tier 1 · **Promoted in v5.1** — now the only numbered ship gate not PASS. · **Desired evidence:** a single staging run recording create → execute → commit → sealed manifest + ≥1 artifact, with run id and manifest hash captured. · Requires a live stack; not closable by code changes alone. · **Classification: validation.**

**3. Execute G-REAL-06 / G-REAL-07 / M-39.**
Tier 1 · validation first · **Unblocked in v5.1** — production build completes, so the demo surface exists. Orchestrator: `scripts/Run-GReal06ProofRuns.ps1`. · **Classification: validation.**

**4. Re-measure the full `ci.yml` matrix at least once on a trunk commit.**
Tier 1 · **New in v5.1** — it replaces the discharged CodeQL item and is now the largest unmeasured correctness surface. Api/Application/Integration suites are PR-only and were unmeasured in v4, v5, **and** v5.1; the green corset covers Core + Decisioning only and invites over-reading as "trunk is green." · **Desired outcome:** one `workflow_dispatch` (or scheduled) full-matrix run on `master` with results recorded, so the gap is quantified rather than assumed. · **Cheapest item on this list** — one dispatch. · **Classification: V1.**

**5. Fix the concurrency configuration that evicts queued trunk runs.**
Tier 1 · **New in v5.1, and the only Tier 1 item a coding agent can fully close.** CodeQL now *works* but **12 of the last 25 runs were cancelled before starting a single job**, so most pushes get no security analysis. · **Root cause (verified, not inferred):** a concurrency group holds **one running + one pending** run (`queue: single` default). `codeql.yml` already sets `cancel-in-progress: false`, which protects the *running* run only — **every newly queued run evicts the pending one.** With `group: codeql-${{ github.ref }}` on a trunk taking 70–106 pushes/hour, almost nothing survives the pending slot. Cancelled runs having **zero jobs** is the fingerprint. · **Fix, preferring the lower-risk option:** set `group: codeql-${{ github.sha }}` so each commit gets its own group and nothing coalesces; alternatively `queue: max` (documented, up to 100 pending) — note `queue: max` **cannot** be combined with `cancel-in-progress: true`, which matters for `ui-typecheck-on-push.yml`. · **Trade-off:** more Actions minutes, in exchange for every commit actually being analyzed. · **Independent of item 1** — worth doing even if branch protection is deferred, though item 1 also reduces push rate by construction. · **Classification: V1.**

### Tier 2 — High Leverage

**6.** Triage pre-existing help Vitest failures (baseline from v4). **7.** Policy-toggle demo artifact. **8.** Seed overlay `advisoryDefaults`. **9.** Extend golden harness past 8 engines + inject loader. **10.** M-07 screenshots after item 1.

### Tier 3 — Hold

**11–13.** Same holds as v4 (deep engine category, frontier transcripts, density-on-engines owner decision).

## 18. Prompt Batching Guidance

**v5.1 has no coding first batch — that is the notable change.** Of the five Tier 1 items, one is a repository setting, two need a live stack, one is a single workflow dispatch, and one is a small workflow edit. **No item requires a code-generation engine.**

**First — owner, no engine:** item 1 (branch protection on gitleaks + .NET push corset + UI typecheck + CodeQL). Every other item decays without it, and all four checks are now proven passable so it cannot deadlock the repo.

**Second — Sonnet, ~15 minutes:** item 4 (dispatch full `ci.yml` on a trunk commit, record results) and item 5 option (b) (drop `cancel-in-progress` for `master` only). Both are cheap, and item 4 quantifies the single largest unmeasured surface. Do these while waiting on owner action for item 1.

**Third — owner + Opus:** items 2 and 3 (Gate 1 observed run, then G-REAL-06/07 and M-39). Gate 1 first: one run, and it closes the last non-PASS numbered gate.

**Tier 2 only after the above:** help Vitest triage, policy-toggle demo artifact, `advisoryDefaults` seeding, golden harness past 8 engines, M-07 screenshots (now unblocked by Gate 5 PASS).

**Do not commission another typecheck remediation batch.** v4, v5, and v5.1 each cleared one; each set was introduced by churn after the previous fix. The loop does not converge without item 1.

## 19. Model Usage Guidance

Same as v4. **v5.1 note:** the stickiness/SAML type alignment was Sonnet-safe as predicted, but verification turned up a TS 7-specific `TS2871` (always-nullish expression) that mechanical prop-type alignment would have missed — so **always run `npm run typecheck` after a type-alignment batch rather than trusting the named error list**, since TypeScript 7 reports diagnostics the error list did not contain. Route the declaration-vocabulary work (**PP-01**) to **Opus** on a feature branch; it changes finding emission and needs its own golden-delta test, so do not batch it with toolchain fixes.

## 20. Pending Questions For Later

**Blocks V1:** item 1 (branch protection), item 2 (Gate 1 observed run), item 5 (full matrix measurement); **G-REAL-06**; **G-COMMERCE-01**. **No longer blocking:** v5 items 1 and 5 (Gate 5, npm peer) — shipped at `15836970d4`.

**Requires founder decision:** (a) organizational repeatability positioning; (b) `typed-engine-protected`; (c) finding stream of record; (d) overlay seeding; (e) **withdrawn** — `ShouldEmitTheme` empty-set behavior needs no decision; code and docs already agree (§8 correction). Replaced by: whether to run **PP-01** and widen declaration vocabulary to the buyer-common pack prefixes; (f) **resolved:** mandatory PRs declined — branch protection on push corset is the chosen path, **still unapplied as of v5.1**; (g) **new:** whether to hold `legacy-peer-deps` until `openapi-typescript` ships TypeScript 7 peers, or alias `typescript` to `@typescript/typescript6` per the TypeScript 7.0 side-by-side guidance; (h) **new:** accept higher Actions spend to stop evicting queued trunk runs (Tier 1 item 5).

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

v5 is the pass where the repo **answered** v4's process prescription instead of only documenting it. A push corset that runs a thousand tests is unglamorous engineering — exactly the sort of thing that should have existed before the assessment cycle that discovered 16 red fast-core tests. The corset passing is not a victory lap; it is a **baseline**. What v5 also shows is that a baseline without branch protection is only a photograph of the latest push, and at **106 commits per hour** the photograph is always out of date.

The taste failure this pass names is **refactor without typecheck**. Splitting `FindingInspectGovernanceStickinessPanel` and `SamlSpConfigurationForm` without running `npm run typecheck` before push is the same class of error as v4's missing `Input` import — but now it happens *after* the team agreed trunk stability matters. The remedy is unchanged: make the corset block, and treat a red typecheck on `master` as an incident, not weather.

**v5.1 addendum.** The fixes in this revision took under an hour and were entirely mechanical — four prop-type alignments, one `Promise.resolve()` wrap, one `.find()`, one three-line `.npmrc`. That ratio is the signal. A ship gate was FAIL, a headline was capped, and a security control was silently off, and the total cost of clearing all of it was a single focused hour. The reason it sat broken is not difficulty; it is that **nothing in the system was obligated to notice**. The corset noticed and reported `failure`, and the push landed anyway.

So the honest read of v5.1 is not "the repo got better." It is: **the repo is one repository setting away from making passes like this unnecessary.** Three consecutive assessments have now prescribed branch protection, and three consecutive assessments have opened with a fresh set of typecheck errors introduced after the last set was fixed. Writing that sentence a fourth time would be a failure of the assessment process, not of the code. The most useful thing an engine can do now is stop fixing and say plainly: the remaining V1 gap is a checkbox, one staging run, and three pilots.

---
