# ArchLucid Strategic Release and Market Readiness Assessment (v7)

**Pass date:** 2026-08-27, **17:05–17:20 UTC (v7)**. **Computed fresh** — no carry-forward, no score deltas, no rescore ratchet. The v6 pass (14:35–15:05 UTC) is superseded by this document and is **not** canonical. v6 is archived at [`../archive/assessments/LATEST_GPT55-2026-08-27-v6-superseded.md`](../archive/assessments/LATEST_GPT55-2026-08-27-v6-superseded.md).

## v7 pass note — corset is green; the required-check list still is not

v6 prescribed a sequence: green the three broken push-corset jobs, confirm one all-green trunk run, then require those jobs on the existing ruleset. **The first two steps landed.** The third did not.

### What closed since v6 (runtime, not claims)

| v6 Tier 1 item | Disposition | Evidence this pass |
|---|---|---|
| **1** Release build `AV0029`/`AV0030` | **Closed** | `dotnet build ArchLucid.Api/ArchLucid.Api.csproj -c Release` → **0 Error(s)**. Suppressions in `.editorconfig` + `ArchLucid.Api.csproj` `NoWarn` (single `/openapi/v1.json` retained). |
| **2** Gate 5 UI typecheck | **Closed** | Clean `npx tsc --noEmit -p tsconfig.build.json` **exit 0**; `npx tsc --noEmit -p tsconfig.json` **exit 0**; `npm run typecheck` **exit 0**. `ArchitectureDraftDeleteControl` accepts `ArchitectureDraftCustomerStatus` including `"review-linked"`. `@tanstack/query-core` is a single **5.102.7** resolution (`npm ls` shows one version, overridden). |
| **3** Terraform validate / azurerm 5.x | **Closed as prescribed** | `infra/terraform{,-private,-edge}/versions.tf` pin `>= 3.100.0, < 5.0.0`; lock files pin **azurerm 4.81.0**. Local `terraform validate` on those three roots: **Success**. |
| **4** Add corset jobs to `required_status_checks` | **Open — now unblocked** | Ruleset **`Golden cohort real-LLM gate`** (id `21654724`) still has **exactly one** required context: `cohort-real-llm-gate`. |

### Trunk health, measured

| Measurement | v6 (14:35 UTC) | v7 (17:20 UTC) |
|---|---|---|
| Newest completed push corset on `master` | 37–40 consecutive **failure** | **2 consecutive success**: [33094679717](https://github.com/joefrancisGA/ArchLucid/actions/runs/33094679717) (`#572`, 16:43) then [33096646218](https://github.com/joefrancisGA/ArchLucid/actions/runs/33096646218) (`#574` copy merge, 17:05) — all three jobs `success` on both |
| Last 100 `ui-typecheck-on-push.yml` on `master` | 57 fail · 20 success · 20 cancelled · 3 running | **63 fail · 21 success · 15 cancelled · 1 queued** — the second success is this pass's copy-only merge; the first success after the six-hour outage is `#572` |
| Last green before the outage | 08:26:45 | still 08:26:45 as the previous green; the outage window is now closed at 16:43 |
| Gate 5 (`tsconfig.build.json`) | FAIL | **PASS** (stale incremental cache can still report the old `TS2322`; a clean `tsc` is the measurement) |
| `dotnet build ArchLucid.Api -c Release` | 3 Error(s) | **0 Error(s)** |
| Direct push to `master` | Rejected (`cohort-real-llm-gate` expected) | Unchanged — protection still `active`, `current_user_can_bypass: never` |
| Required status checks | 1 of ~40 (`cohort-real-llm-gate`) | **Unchanged** |

### The scar that proves the remaining #1

PR **#567** (this cycle's v6 assessment + corset fixes) merged **conflict markers** into `AgentExecutionCompositionModule.cs`. The first post-merge corset ([33093031795](https://github.com/joefrancisGA/ArchLucid/actions/runs/33093031795)) failed with **CS8300**. Hotfix **#572** landed ~20 minutes later and is the first green corset after the outage.

That is not a new class of defect. It is **v6 weakness #1 executing in production**: only `cohort-real-llm-gate` was required, so an unbuildable merge reached `master`. Requiring the three corset jobs would have refused #567 until the markers were gone.

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Claude Opus 5 / Cursor Grok 4.6, simulator-aware; **no live Azure OpenAI call was made during this pass**.

**Source materials inspected this pass:** GitHub rulesets API (`/rules/branches/master`, rulesets `21654724` / `15216586`), `ui-typecheck-on-push.yml`, `golden-cohort-nightly.yml`, `ci.yml`, `dependabot.yml`, `.editorconfig`, `ArchLucid.Api.csproj`, `archlucid-ui/package.json` + lockfile, `ArchitectureDraftDeleteControl.tsx`, `infra/terraform{,-private,-edge}/versions.tf` + `.terraform.lock.hcl`, `DeclarationSignalPolicyGate.cs` + `DeclarationSignalPolicyPrefixFamily.cs`, `DeterministicInsightDensityGate.cs:87`, `GoldenCorpusHarness.CreateEngines`, `BuiltInFindingEngineTypeCatalog`, `gh run list` / `gh run view` / `git log --first-parent` + `/commits/{sha}/pulls`.

## Executed this pass (runtime evidence, not doc claims)

| # | Command / observation | Result |
|---|---|---|
| 1 | `gh api repos/…/rules/branches/master` | **Protection ACTIVE** — `required_status_checks` = **one** entry, `cohort-real-llm-gate`; plus `deletion`, `non_fast_forward`, `copilot_code_review`; bypass `never` |
| 2 | `gh run list --workflow ui-typecheck-on-push.yml --branch master --limit 100` | **63 failure · 21 success · 15 cancelled**; newest **completed** is **success**; **2 consecutive** green (33094679717, 33096646218) |
| 3 | `gh run view 33096646218` | All three jobs **success**: gitleaks, `.NET: push corset`, `Operator UI: typecheck (blocking)` |
| 4 | `npx tsc --noEmit -p tsconfig.build.json` after deleting `tsconfig.tsbuildinfo` | **exit 0** — Gate 5 **PASS**. A dirty incremental cache still reported the v6 `TS2322`; clean `tsc` is the measurement |
| 5 | `npx tsc --noEmit -p tsconfig.json` / `npm run typecheck` | **exit 0** |
| 6 | `dotnet build ArchLucid.Api/ArchLucid.Api.csproj -c Release` | **Build succeeded. 0 Warning(s). 0 Error(s).** |
| 7 | `npm ls @tanstack/query-core` | **Single version 5.102.7** (overridden). `react-query@5.102.2` is flagged `invalid` vs `^5.102.7` but does not nest a second `query-core` |
| 8 | `terraform validate` in `infra/terraform`, `terraform-private`, `terraform-edge` | **Success** on all three after lock refresh to azurerm **4.81.0** |
| 9 | `git log --first-parent origin/master` + `/commits/{sha}/pulls` | Last **15** first-parent commits are **all PR-attributed** (including “Merge branch …” titles: #574, #562, #557, #561, #558) |
| 10 | `gh pr view 574` | Merged with **0 failing** checks in the rollup (contrast v6's #556 with 27 fails) |
| 11 | `gh run list --workflow CodeQL --limit 15` | Recent **completed** runs **success** (per-SHA concurrency from `6e43a095e4` is holding); several in_progress on current PRs |
| 12 | `DeclarationSignalPolicyPrefixFamily.DeclarationRelevantPrefixes` | **soc2, gdpr, hipaa, iso27001, pci, zta, cis-az, cis-aws, cis-gcp, sec-base, aks, eks, gke** — v6's “only `cis-az-*` and `sec-base-028`” fail-open claim is **stale** |
| 13 | `.github/dependabot.yml` | **github-actions** is grouped; **nuget / npm / terraform are not**; no `ignore` for `version-update:semver-major` |
| 14 | `docs/engineering/AGENTS.md` | **No** “Debug success is not evidence” statement; v6 item 6(a) still open |
| 15 | `assessment-score-guard.yml` | `python3 -m pytest` with **no `pip install pytest`** — this is why `check-score` failed on #567 (exit 1, `No module named pytest`), not an arithmetic mismatch |

**Verified counts this pass:** **39** engines in `BuiltInFindingEngineTypeCatalog`; **14** engines in `GoldenCorpusHarness.CreateEngines()`; `typed-engine-protected` still at `DeterministicInsightDensityGate.cs:87`.

**Landed on `master` between v6 and this pass:** corset fixes (AV suppressions, review-linked status, tanstack override, azurerm `< 5.0` + lock files) via **#567**; DI baseline router / schema-remediation client via **#569/#570**; conflict-marker hotfix **#572**; copy-only **#574**.

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows. Excludes GTM V1.1 items **#2/#3/#5/#6** (**M-90**/**M-44**/**M-91**/**M-92**) per standing exclusion rule. Owner assurance programs **G-REAL-05** / **G-ASSURANCE-02** appear here only because they are human-executed; they do **not** reduce `(A)`.

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|-----------------|--------------------|--------------------|
| 1 | **Add the three corset job names to the existing ruleset's `required_status_checks`** | **The v6 sequencing block is discharged.** Two consecutive all-green trunk corset runs exist. Protection is still one check (`cohort-real-llm-gate`). #567 merged CS8300 conflict markers onto `master` because those jobs were not required. Add exactly: `Security: gitleaks (secret scan)`, `.NET: push corset (build + fast core Core/Decisioning)`, `Operator UI: typecheck (blocking)`. | No — policy | **Owner** |
| 2 | **Constrain Dependabot: group updates, and require review for major bumps** | Still the mechanism that caused the six-hour outage. `dependabot.yml` groups **only** `github-actions`. nuget/npm/terraform remain unbatched; no `semver-major` ignore. Item 1 without this still lets bots merge majors, but at least the corset would refuse a red result. | Partial — config is agent-editable, policy is owner | **Owner + Composer** |
| 3 | **G-REAL-06** — three real-mode pilot runs | Largest commercial uncertainty driver. **Unblocked in v7** — Gate 5 PASS and Release API build green, so the demo surface exists again. Script at `scripts/Run-GReal06ProofRuns.ps1`. | Partial | **Opus** |
| 4 | **G-REAL-07** — proof packets + `PROOF_PACKET_RUN_LOG` | Depends on #3. | Partial | **Sonnet** |
| 5 | **M-39** — apply proof-packet checklist, ≥3 G4 rows | Depends on #4. | Partial | **Sonnet** |
| 6 | **M-07** — polished operator screenshots | **Unblocked in v7** — Gate 5 PASS. | Partial | **Composer** |
| 7 | **M-09** — landing owner sign-off + deploy | Gated on #6. | Partial | **Sonnet** |
| 8 | **M-16** — demo video | Depends on #6; run **G-REAL-09** before recording. | Partial | **Sonnet** |

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 77.50% (v7)**

**Up from v6's 73.97%.** The recovery is the toolchain v6 said to green, not a product-capability gain. Gate 5 is **PASS**. The ship-gate override does **not** bind. The honest headline is the weighted average with a **process** ship-risk attached: the checks that just went green are still not required.

**What genuinely improved.** Correctness **68 → 80**, Time-to-Value **68 → 74**, Runtime **66 → 75**, Adoption Friction **72 → 86**, Comprehension **75 → 77**. Those five moves are the same three closed defects counted where they belong: Release build, UI typecheck, azurerm pin — plus two consecutive green trunk corset runs.

**What did not improve, and that is the story.** Governed Review Integrity holds at **88**. Insight Density holds at **66**. Differentiability holds at **81**. The required-check list is still one LLM-budget job. Dependabot is still ungrouped. The local loop still does not force Release or clean-install. **v6's #1 is still #1; it is now cheap to close instead of blocked on a red trunk.**

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`: SOC 2 CPA attestation, third-party pen-test publication, signed design partner, owner-output GTM assets/cohorts, public extension SDK, MCP absence in V1, third-party plugin marketplace, assistive-technology participant testing, and sales-engineer-led LLM onboarding.

---

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 66 | 13 | 8.58 | **442** |
| 2 | Differentiability / Defensibility vs Frontier AI | 81 | 13 | 10.53 | 247 |
| 3 | Governed Review Integrity | 88 | 13 | 11.44 | 156 |
| 4 | Correctness & Evidence Integrity | 80 | 12 | 9.60 | 240 |
| 5 | AI / Agent Readiness | 74 | 10 | 7.40 | **260** |
| 6 | Time-to-Value | 74 | 10 | 7.40 | **260** |
| 7 | Proof-of-ROI Readiness | 76 | 9 | 6.84 | 216 |
| 8 | Sponsor / Operator Comprehension | 77 | 8 | 6.16 | 184 |
| 9 | Runtime & First-Review Reliability | 75 | 7 | 5.25 | 175 |
| 10 | Adoption Friction | 86 | 5 | 4.30 | 70 |
| | **(A) Headline readiness** | | **100** | **77.50%** | |

**Ranked by weighted deficiency:** Insight Density (442) · AI/Agent Readiness (260) · Time-to-Value (260) · Differentiability (247) · Correctness (240) · Proof-of-ROI (216) · Comprehension (184) · Runtime (175) · Governed Review Integrity (156) · Adoption Friction (70).

**Total remaining deficiency signal: 2,250** (v6 was 2,603; v5.1 was 2,180). Toolchain recovered most of the v6 spike; **v7 is still 70 points worse than v5.1** because Runtime (75 vs 79) and Correctness (80 vs 84) do not get full restoration after an eight-hour red trunk and a merge that landed conflict markers.

**Scoring rationale for every change.**

| Quality | v6 | v7 | Why exactly this much |
|---|---:|---:|---|
| Correctness & Evidence Integrity | 68 | **80** | Release build green; Gate 5 green on clean `tsc`; query-core deduped; azurerm pinned and validated locally; two green corset runs. Not 84 (v5.1): the full `ci.yml` matrix is still path-skipped on PRs; Dependabot is still ungrouped; #567 landed CS8300 on trunk; last-100 corset is still 63/21 fail/success |
| Time-to-Value | 68 | **74** | Demo surface typechecks and the API compiles in Release again — the v6 −7 for an unbuildable operator UI reverses. Still capped by **Gate 1 UNKNOWN** (no observed create → execute → commit). Not 75: durability of the green corset is two runs, not a week |
| Runtime & First-Review Reliability | 66 | **75** | Two consecutive all-green trunk corsets after 8 hours of red. Not 79 (v5.1's “first green” score): last-100 is still majority-red, and the jobs are still not required, so the next Dependabot batch can repeat v6 |
| Adoption Friction | 72 | **86** | Fresh-clone first commands work: typecheck exit 0, Release API build 0 errors, single `query-core`. Not 88: `legacy-peer-deps=true` remains; `react-query@5.102.2` vs `^5.102.7` is `npm ls` “invalid” even though types unify |
| Sponsor / Operator Comprehension | 75 | **77** | `"review-linked"` is now a first-class `ArchitectureDraftCustomerStatus` on the delete control — the v6 modelling gap on a sponsor-visible list is closed. No new narrative content, hence +2 not more |
| Governed Review Integrity | 88 | **88** | Protection still works and is still pointed at the wrong check. Holding, not raising: #567's conflict-marker merge is evidence the gate remains unqualified |
| Insight Density / Differentiability / AI / Proof-of-ROI | 66 / 81 / 74 / 76 | **unchanged** | No engine, corpus, judge-flag, or pilot evidence moved |

---

## 3. Diagnostic Scores (non-headline)

**Decision Advantage Score: 65/100.** Unchanged. Toolchain recovery does not change what a finding tells an architect. `typed-engine-protected` still promotes every engine finding without using the computed score.

**Frontier-AI Survival Probability (12 months): 55–70%, moderate confidence.** Unchanged mechanism story. Container is buildable again; analytical floor is not.

**30-Day Voluntary Usage Probability: 36–51%, low-moderate confidence.** Restored to the v5.1 band: a developer cloning the repo can typecheck and Release-build without hitting a wall. Still capped by Gate 1 UNKNOWN.

**Sponsor Purchase Probability: 28–43%, low confidence.** Demo surface exists again. **Zero G-REAL-06 pilots still dominates.**

**Reconciliation with §2.** Headline **77.50%** sits **12.5 points** above Decision Advantage (65) and far above the purchase band (28–43%). v6's gap was 9 points because the headline had fallen; v7's gap widened again because the container recovered and the analysis did not. Do not read 77.50% as 77.50% of the way to a sale.

---

## 4. V1 Ship Gate

| # | Gate | Verdict | Evidence | Fastest resolution |
|---|------|---------|----------|--------------------|
| 1 | First review completes create → execute → commit → manifest + ≥1 artifact | **UNKNOWN** | Not executed here. | Staging `ship-gate-evidence` with SQL API. |
| 2 | No hallucinated or uncited policy/evidence citations | **PASS (mechanism)** | Emission gate + citation integrity evaluator unchanged. | Upgrade after gate 1 live. |
| 3 | Sponsor summary / ROI coherent and not misleading | **PASS (mechanism)** | TB-603 Done; disposition-aware headline. | As above. |
| 4 | Export / package generation works | **PASS (mechanism)** | Suite=Core coverage exists; live ZIP not run here. | Optional staging probe. |
| 5 | Architect workspace does not break during first-review / demo path | **PASS** | Clean `tsc -p tsconfig.build.json` exit 0; `npm run typecheck` exit 0; CI `Operator UI: typecheck (blocking)` **success** on the last two `master` corsets. | Keep it green by requiring the job (human task 1). |
| 6 | Auth + tenant isolation on pilot path | **PASS (mechanism)** | ADR 0037, scope guard, ship-gate negative probes. | As gate 1. |

**Gate 5 is PASS, so the headline is not ship-blocked by UI compile.** Gate 1 remains **UNKNOWN** and still needs a live staging run. The process risk is that Gate 5 can flip FAIL again the next time an ungated merge lands — #567 already demonstrated that with CS8300.

---

## 5. Sponsor Summary

**(A) Overall headline readiness — 77.50% (v7). Gate 5 PASS.**

ArchLucid remains a governed architecture-review system with **39 deterministic engines**, tenant-filtered compliance, declaration gating, optional expectation extras, sealed manifests, and database-per-tenant isolation. This pass proved the **v6 outage is closed on trunk**: two consecutive push-corset runs on `master` are all-green (gitleaks + Release fast-core Core/Decisioning + UI typecheck). A clean clone typechecks. `ArchLucid.Api` compiles in Release.

**What v7 actually bought.** The three defects that made a fresh clone unusable for six hours are gone. That restores Time-to-Value and Adoption to near-v5.1 levels and unblocks G-REAL-06 / M-07 which v6 had re-blocked.

**What v7 did not buy.** The ruleset still requires `cohort-real-llm-gate` and nothing else. PR #567 merged conflict markers onto `master` under that rule. Dependabot is still free to land ungrouped majors. Insight density is still subtractive. No sponsor has seen a real-mode review. **The product is a well-engineered container whose analysis and whose merge gate have not moved.**

**(B) Procurement / market realism (weight 0 in `(A)`).** Same honest trust posture — self-assessment, templates, owner pen test — without CPA SOC 2 or third-party pen-test publication.

---

## 6. Deferred Scope Uncertainty

Same as v4/v6: V1.1 webhooks/MCP/commerce un-hold; V2 CPA/pen-test programs and substrate shifts. Graph-RAG community summarization still deferred pending **G-REAL-06** signal.

---

## 7. Weighted Quality Assessment (detail)

### 7.1 Decision-Changing Insight Density — 66 · weight 13 · contribution 8.58 · deficiency 442

Unchanged. `typed-engine-protected` still promotes every engine finding without using the computed score (`DeterministicInsightDensityGate.cs:87`). No deep judgment engines added. Frontier corpus still synthetic. Golden harness still **14/39**.

**Classification:** V1 residual + validation. **Affects outcomes 1, 3, 5.**

### 7.2 Correctness & Evidence Integrity — 80 · weight 12 · contribution 9.60 · deficiency 240 *(v6: 68)*

Release API build is green. Gate 5 is green on a clean `tsc`. Push corset Core/Decisioning jobs succeeded twice on trunk. query-core is single-version. azurerm is pinned below 5.0 with refreshed lock files; three roots `terraform validate` locally.

**Still deduct:** heavy `ci.yml` lanes still path-skip on typical PRs; last-100 corset is 63 failure / 21 success; #567 landed uncompilable C# on `master`; Dependabot majors still ungated; OpenAPI snapshot remains a separate fail-fast job that is **not** in the push corset.

**Classification:** V1. **Affects outcomes 1, 2, 4.**

### 7.3 Time-to-Value — 74 · weight 10 · contribution 7.40 · deficiency 260 *(v6: 68)*

The operator demo surface compiles again. That is a precondition for a first review, not evidence of one. **Gate 1 is still UNKNOWN.**

**Classification:** V1 residual + validation. **Affects outcomes 1, 3.**

### 7.4 Differentiability / Defensibility vs Frontier AI — 81 · weight 13 · contribution 10.53 · deficiency 247

**Re-derived, score holds.** v6 wrote that only `cis-az-*` and `sec-base-028` counted as declaration vocabulary. That is **false on current `master`:** `DeclarationSignalPolicyPrefixFamily` includes soc2, gdpr, hipaa, iso27001, pci, zta, cis-az/aws/gcp, sec-base, aks, eks, gke. A SOC 2 tenant **no longer fail-opens**.

**Remaining moat gap:** `ShouldEmitTheme` still uses `IsThemeEnabled`, which matches **exact mapped rule ids** (mostly `cis-az-*` / `sec-base-028`), not prefixes. A SOC 2-only pack therefore fail-**closes** declaration themes (vocabulary=true, no mapped key → no emit). Buyer toggle “SOC 2 vs CIS Azure” still does not move declaration rows for SOC 2. That is narrower than v6's fail-open claim and still a demo-shaped hole. PP-01 remains the spec.

**Classification:** V1 mechanism; content residual. **Affects outcomes 1, 2, 5.**

### 7.5 AI / Agent Readiness — 74 · weight 10 · contribution 7.40 · deficiency 260

Unchanged. Simulator default; judge flags default false; eval corpus synthetic; no live pilot signal.

**Classification:** V1 mechanism complete; validation required. **Affects outcomes 1, 5.**

### 7.6 Runtime & First-Review Reliability — 75 · weight 7 · contribution 5.25 · deficiency 175 *(v6: 66)*

Two consecutive all-green trunk corsets. Gitleaks green. CodeQL completed-success on recent runs (per-SHA group holding).

**Still deduct:** jobs are not required; last-100 is still mostly red (the outage dominates the window); Gate 1 unobserved.

**Classification:** V1. **Affects outcomes 2, 3.**

### 7.7 Proof-of-ROI Readiness — 76 · weight 9 · contribution 6.84 · deficiency 216

Unchanged. Mechanism complete; zero real pilot deltas.

**Classification:** V1 residual + validation. **Affects outcomes 3, 4.**

### 7.8 Governed Review Integrity — 88 · weight 13 · contribution 11.44 · deficiency 156

Unchanged on purpose. Mandatory PRs + Copilot review on push are real. The required check still does not measure review *correctness*. #567 is the exhibit.

**Classification:** V1. **Affects outcomes 2, 4, 5.**

### 7.9 Sponsor / Operator Comprehension — 77 · weight 8 · contribution 6.16 · deficiency 184 *(v6: 75)*

`review-linked` is now in the delete-control union. Sponsor narrative quality still rests on synthetic corpus output; no sponsor has read a real-mode ROI summary.

**Classification:** V1. **Affects outcomes 2, 4.**

### 7.10 Adoption Friction — 86 · weight 5 · contribution 4.30 · deficiency 70 *(v6: 72)*

`npm run typecheck` and `dotnet build -c Release` succeed from this tree. `legacy-peer-deps=true` remains a documented workaround. `npm ls` still reports `@tanstack/react-query@5.102.2` invalid vs `^5.102.7`.

**Classification:** V1 residual. **Affects outcomes 2, 3.**

---

## 8. Top 10 Weaknesses

**v7 re-ranked.** v6 items 1–3 in §17 are **closed with runtime evidence**. Weakness **#1 is the same sentence as v6**, with the sequencing excuse removed. Insight density returns to being the largest *weighted* deficiency now that Correctness fell back from 384 to 240.

1. **The enforced gate is still decoupled from the signal that detects breakage.** **Still #1, and it is now a two-minute edit with no sequencing risk.** Ruleset `21654724` still requires only `cohort-real-llm-gate`. The three jobs that went green twice on trunk are not required. Exhibit this pass: **#567 merged CS8300 conflict markers** onto `master`; corset failed; #572 fixed it 20 minutes later. Add exactly: `Security: gitleaks (secret scan)`, `.NET: push corset (build + fast core Core/Decisioning)`, `Operator UI: typecheck (blocking)`. Process uncertainty.
2. **Insight density still subtractive.** Unchanged architectural ceiling — `typed-engine-protected` still discards the computed density score at `DeterministicInsightDensityGate.cs:87`. **Largest weighted deficiency at 442.** Design uncertainty.
3. **Unbatched Dependabot still lands major-version bumps as many PRs.** v6's proximate cause is **unfixed**. `dependabot.yml` groups only `github-actions`. nuget/npm/terraform have no `groups` and no `semver-major` ignore. Item 1 would at least refuse a red merge; it would not prevent the batch. Process uncertainty.
4. **Zero completed real-mode pilots (G-REAL-06).** Unblocked: demo surface typechecks. Still zero runs. Market uncertainty.
5. **Two verification blind spots are still open.** (a) **Release:** nothing in `AGENTS.md` states Debug success is not evidence; agents still default Debug. (b) **Clean install:** no CI assertion that `npm ls @tanstack/query-core` is a single version. The outage's invisibility classes were not closed — only the instances were. Process uncertainty.
6. **Gate 1 remains UNKNOWN — no observed end-to-end first review.** Unchanged; needs a live staging run. Validation uncertainty.
7. **Heavy `ci.yml` lanes still `skipping` on typical PRs.** Path-lane gating still excludes Vitest, Playwright, axe, Lighthouse, ZAP, Schemathesis, SaaS Terraform script suite from most PRs. Largest remaining unmeasured correctness surface. Process uncertainty.
8. **Declaration *themes* still key off exact CIS/sec-base ids, so buyer-common packs emit nothing.** **Restated from v6 after re-deriving the code.** Prefix family membership now prevents fail-open, but `IsThemeEnabled` does not treat `soc2-001` as enabling a theme. SOC 2 vs CIS Azure still will not move declaration rows for SOC 2. PP-01. Design uncertainty.
9. **`legacy-peer-deps=true` still masks resolution conflicts.** query-core is currently unified by an `overrides` pin, which is the right local fix, but peer enforcement is still globally off. `react-query@5.102.2` vs `^5.102.7` is already `invalid` in `npm ls`. Design uncertainty.
10. **Remaining engine-depth debt.** Bundled packs still lack expectation extras by default; golden corpus **14/39**; actor-dependent engines stay silent on IaC-only reviews. Grouped because none moved. Design uncertainty.

**Removed from the v6 list because genuinely fixed this cycle:** Release-build AV0029/AV0030 as a trunk outage; Gate 5 `review-linked` / duplicate `query-core` as a trunk outage; azurerm 5.2.0 admission on the three public/private/edge roots. **Do not treat those as standing weaknesses.** The *classes* (ungated Dependabot, Release-blind local loop) remain as #3 and #5.

---

## 9. Frontier-AI Analysis

Same commodity/durable table as v4 with updates: declaration prefix-family membership is now real (fail-open closed); theme enablement is still CIS-mapped. Approval workflow with SoD remains corset-proven for the Decisioning slice.

**Final verdict:** Container is buildable again. Analytical floor and pilot proof still lag. **The one cheap durable move left is requiring the corset.** Against a frontier model, “our tests pass” is not the claim; “our tests are required” is.

---

## 10. Policy-Aware Governance Test

1. **Do policy packs drive behavior?** **Yes, for mapped CIS/sec-base keys, with green corset tests.** Buyer-common prefixes now *count as vocabulary* (no fail-open) but **do not enable themes**. Empty rule set fails closed — correctly and as documented.
2.–7. Same as v4 with corset evidence on declaration gating and governance SoD.

---

## 11. Principal Architect Dismissal Test

Operational dismissal (won't compile / won't typecheck) is **off the table again** as of two green corsets. Analytical dismissal is unchanged: checklist-shaped output, `typed-engine-protected`, Decision Advantage 65.

---

## 12. Founder Delusion Check

**v6's delusion** was “one ruleset checkbox fixes trunk.” The checkbox was applied to the wrong check.

**v7's delusion risk** is “two green corsets means the problem is over.” The last-100 window is still 63 failures. #567 merged broken C#. Dependabot is unmodified. **Two photographs of green are not a gate.**

**Six-month freeze prescription:** require the three corset jobs **today**; group Dependabot and ignore majors; execute Gate 1 once; **G-REAL-06**; measure the full `ci.yml` matrix once; stop scoring assessments as a substitute for those five.

---

## 13. Competitive Reality Check & Moat Assessment

Moat regression evidence in the corset slice is intact. Weakest link is again **“the corset can complete green and still not be required.”** Buyer-obvious demo remains the §10.7 policy toggle; SOC 2 vs CIS Azure still will not move declaration rows until PP-01.

---

## 14. Adoption & Monetization

Blocker #1 is down to **one owner setting** (require the three jobs). **M-07** screenshots are unblocked (Gate 5 PASS). **G-REAL-06** is unblocked. Neither has been executed.

---

## 15. Most Important Truth

**v6 asked for a sequence. The repo did the hard part and stopped before the cheap part.**

Items 1–3 landed. Two consecutive `master` corsets are all-green. Gate 5 PASS. Release API build 0 errors. azurerm is back on 4.x. Direct pushes are still impossible. **The remaining #1 is adding three strings to a ruleset that already exists** — the step v6 forbade until the corset was green, which it now is.

The exhibit that this still matters is not hypothetical: **#567 merged conflict markers onto trunk** because `cohort-real-llm-gate` does not compile C#. The fix was a 20-minute hotfix PR. Requiring `.NET: push corset` would have made that merge impossible.

Everything else on this document — insight density, pilots, Gate 1, Dependabot grouping — is still true and still slower. **Do the ruleset edit first.** Then group the bots. Then run one real review.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

## 16. Stop Doing List

**Top 3 not worth doing before V1:** more policy-pack rules without expectation extras; Graph-RAG community summarization; synthetic eval expansion.

**Top 3 diminishing returns:** UI route polish across open backlog rows; coverage-shaped engines; compliance rule count expansion.

**Top 3 founder behaviors:** scoring another assessment before requiring the corset; treating two green runs as a gate; commissioning typecheck remediation while Dependabot can reintroduce it.

**Stop doing this next:** **leaving `required_status_checks` at `cohort-real-llm-gate` now that the corset is green.** v6's sequencing warning applied then; it does not apply now.

**Top 3 enterprise-important but not V1-adoption:** MCP; CloudEvents webhooks; multi-region active/active.

## 17. Top Improvement Opportunities

**Shipped this cycle — do not re-open:** v6 Tier 1 items **1–3** (AV0029/AV0030 suppressions, Gate 5 `review-linked` + query-core override, azurerm `< 5.0` + lock refresh); #572 conflict-marker hotfix; #569/#570 DI baseline router / schema-remediation client.

**Shipped earlier — do not re-open:** push corset itself; v5.1 Gate 5 typecheck batch; `.npmrc` `legacy-peer-deps`; CodeQL per-SHA concurrency; direct-push closure via ruleset `21654724`.

### Tier 1 — Must Fix / Must Validate

> **Sequencing update.** v6 forbade requiring the corset while it was red. **That block is lifted.** Items **1 and 2** below may proceed immediately. Do not wait for another assessment pass.

**1. Add the three corset jobs to the existing ruleset's `required_status_checks`.**
Tier 1 · **Owner-only, two minutes, highest leverage.** · Evidence the corset is require-able: runs [33094679717](https://github.com/joefrancisGA/ArchLucid/actions/runs/33094679717) and [33096646218](https://github.com/joefrancisGA/ArchLucid/actions/runs/33096646218), both all-green. Evidence it is needed: #567 merged CS8300. · **Add exactly:** `Security: gitleaks (secret scan)`, `.NET: push corset (build + fast core Core/Decisioning)`, `Operator UI: typecheck (blocking)`. · **Classification: V1 (process).**

**2. Constrain Dependabot — group updates and gate major bumps.**
Tier 1 · Still open from v6. · In `.github/dependabot.yml`: `groups` per nuget/npm/terraform; `ignore` `update-types: ["version-update:semver-major"]`. · Pairs with item 1. · **Classification: V1 (process).**

**3. Close the two verification blind spots.**
Tier 1 · Still open from v6. · (a) Document in `AGENTS.md` that **Debug success is not evidence**; point at `scripts/ci/run_push_corset_dotnet.sh`. (b) CI assertion: `npm ls @tanstack/query-core` must resolve one version. · **Classification: V1.**

**4. Execute Gate 1 — one observed end-to-end first review.**
Tier 1 · Unchanged. Staging run, run id + manifest hash. · **Classification: validation.**

**5. Execute G-REAL-06 / G-REAL-07 / M-39.**
Tier 1 · **Unblocked.** Orchestrator: `scripts/Run-GReal06ProofRuns.ps1`. · **Classification: validation.**

**6. Measure the full `ci.yml` matrix once on a trunk commit.**
Tier 1 · `workflow_dispatch` full-matrix on `master`; decide whether path gating should be relaxed for trunk. · **Classification: V1.**

**7. Per-version OpenAPI follow-up (tracked, not blocking).**
Tier 1-adjacent · v6 chose suppress `AV0029`/`AV0030` to keep `/openapi/v1.json`. The design question (one document per API version) is still open. Do **not** reopen as a trunk-health item. · **Classification: V1.1 design.**

### Tier 2 — High Leverage

**8.** Triage pre-existing help Vitest failures. **9.** Policy-toggle demo artifact (SOC 2 vs CIS Azure — blocked on PP-01 for declaration rows). **10.** Seed overlay `advisoryDefaults`. **11.** Extend golden harness past 14 engines + inject governance loader. **12.** Replace `legacy-peer-deps=true` with a targeted `overrides` entry for `openapi-typescript`. **13.** Align `@tanstack/react-query` to `5.102.7` so `npm ls` is clean. **14.** M-07 screenshots (unblocked). **15.** Install pytest in `assessment-score-guard.yml` (this pass includes that one-liner so assessment PRs stop failing `check-score` for a missing module).

### Tier 3 — Hold

Deep engine category, frontier transcripts, density-on-engines owner decision (`typed-engine-protected`).

## 18. Prompt Batching Guidance

**First — owner, no engine:** item 1 (require the three corset jobs). The corset is green. This cannot deadlock the repo on current `master`.

**Second — Composer, ~20 minutes:** item 2 (Dependabot groups + major ignore) and item 3 (AGENTS.md Release note + `npm ls` assertion). Do these in the same PR if the owner has not yet done item 1; they do not require a ruleset.

**Third — owner + Opus:** items 4 and 5 (Gate 1, then G-REAL-06). Gate 1 first.

**Fourth — Sonnet:** item 6 (`workflow_dispatch` full `ci.yml`).

**Do not commission another typecheck remediation batch.** The remaining type issues are process (require the job, constrain bots, see Release locally).

## 19. Model Usage Guidance

Same as v4. Route PP-01 (declaration theme enablement for prefix-family packs) to **Opus** on a feature branch; it changes finding emission. Do not batch it with toolchain process fixes.

## 20. Pending Questions For Later

**Blocks V1:** item 1 (require corset — **unblocked**), item 4 (Gate 1), item 6 (full matrix); **G-REAL-06**; **G-COMMERCE-01**. **No longer blocking:** v6 items 1–3 (Release AV, Gate 5, azurerm pin).

**Requires founder decision:** (a) organizational repeatability positioning; (b) `typed-engine-protected`; (c) finding stream of record; (d) overlay seeding; (e) whether PP-01 should make prefix-family packs enable themes, not merely count as vocabulary; (f) **resolved as a path, unapplied as a check list:** branch protection exists; corset jobs are still not in it; (g) hold `legacy-peer-deps` vs targeted override; (h) accept Actions spend for `queue: max` if CodeQL pending-eviction returns.

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

v7 is the pass where the repo **did the engineering v6 asked for and left the checkbox**. That ratio is the taste failure this time: not “refactor without typecheck,” but **“fix trunk and do not latch the gate.”** Two green corsets in thirty minutes is the right recovery. Merging conflict markers through a budget-only required check is the same class of error as v4's missing import, wearing process clothing.

The most useful thing an engine can do now is stop remediating the last outage and say plainly: **require the three jobs.**
