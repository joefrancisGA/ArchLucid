# ArchLucid Strategic Release and Market Readiness Assessment (v6)

**Pass date:** 2026-08-27, **14:35–15:05 UTC (v6)**. **Computed fresh** — no carry-forward, no score deltas, no rescore ratchet. The v5.1 pass (02:00–02:15 UTC) is superseded by this document and is **not** canonical. v5.1's own predecessor is archived at [`../archive/assessments/LATEST_GPT55-2026-08-27-v4-superseded.md`](../archive/assessments/LATEST_GPT55-2026-08-27-v4-superseded.md).

## v6 pass note — branch protection landed; trunk is red anyway

The owner applied branch protection (v5.1 Tier 1 item **1**, the standing weakness **#1**). **It works, and it is not enough.** This pass verifies exactly what it changed, then measures trunk and finds it has been **red for six hours** — through the protection going live.

### What the owner actually shipped

GitHub ruleset **`Golden cohort real-LLM gate`** (id `21654724`), created **13:42:08 UTC**, `enforcement: active`, targeting `refs/heads/master` and `refs/heads/main`, `current_user_can_bypass: "never"`. Alongside the pre-existing **`Code Review`** ruleset (`deletion`, `non_fast_forward`, `copilot_code_review` with `review_on_push: true`).

Its `required_status_checks` list contains **exactly one entry: `cohort-real-llm-gate`.**

### What that achieved — verified, and genuinely significant

**Direct pushes to `master` are now impossible.** `golden-cohort-nightly.yml` triggers only on `pull_request`, `schedule`, and `workflow_dispatch` — **never on `push`** — so on a bare push the required check can never report, and the ref update is refused. This assessment hit it twice while trying to land a fix:

```
remote: - Required status check "cohort-real-llm-gate" is expected.
! [remote rejected] master -> master (push declined due to repository rule violations)
```

**Measured delivery-path change.** The last **nine consecutive** `master` ref updates (13:56 → 14:34) are all two-parent merge commits, each attributable to a pull request — #554, #558, #561, #557, #556, #559, #560, #562, #564. In the equivalent window **before** 13:42, seven ref updates carry **no PR attribution at all** (`2971d19c70`, `7d57e8ba4c`, `abde22cb51`, `029657324d`, `5ed68f0d17`, `d9a4f89515`, `450ca598bc`) — bare direct pushes to trunk.

**Weakness #1 as previously written is closed.** "Direct pushes outrun review" is no longer true. That is a real structural win and it should not be understated.

### Why trunk is red anyway — the gate is pointed at the wrong signal

`cohort-real-llm-gate` is **not** a no-op. Verified from the job log, `vars.ARCHLUCID_GOLDEN_COHORT_REAL_LLM` expands to `"true"`, the eligibility step sets `enabled=true`, and the budget probe runs. But **what it measures is LLM spend month-to-date and golden-fixture presence** — not build, not tests, not typecheck, not contract, not IaC, not docs.

The three push-corset jobs — `Security: gitleaks (secret scan)`, `.NET: push corset (build + fast core Core/Decisioning)`, `Operator UI: typecheck (blocking)` — **are not required.** Consequence, measured on this assessment's own PR:

**PR [#556](https://github.com/joefrancisGA/ArchLucid/pull/556) merged into `master` with 27 failing checks**, including two whose names literally say blocking:

| Failing check merged anyway | Note |
|---|---|
| `Operator UI: typecheck (blocking)` | named blocking, not required |
| `Docs: link integrity + scope-header ratchet (blocking)` | named blocking, not required |
| `.NET: OpenAPI v1 contract snapshot (fail-fast)` | named fail-fast, not required |
| `CI: guards pre-corset (text)` | — |
| `CodeQL (javascript)` | v5.1 declared this discharged |
| `Terraform: validate …` × **16 lanes** | whole IaC surface red |
| `Stryker PR — Api / Application / ApplicationGovernance / ApplicationCommitCriticalPaths` | — |
| `cohort-simulator-drift` | — |

Only `cohort-real-llm-gate` gated the merge, and it passed.

### Trunk state: 37 consecutive red corset runs

| Measurement | Value |
|---|---|
| Consecutive `failure` runs of the push corset on `master` | **37** (08:27:48 → 14:16:43) |
| Last `success` | **08:26:45** (`0a0b0fadf3`) |
| Tally over last 100 corset runs on `master` | **57 failure · 20 success · 20 cancelled · 3 running** — 74% failure among completed |

v5.1's headline evidence was "first fully green push corset on trunk" (run 33031842736, ~02:00 UTC). **It held for roughly six and a half hours.**

### Root cause: one Dependabot batch, ~20 PRs, ~75 seconds

Between **08:26:45** (last green) and **08:27:48** (first red), roughly twenty Dependabot pull requests merged. Three independent breaks landed together:

1. **`Asp.Versioning.Mvc` / `.ApiExplorer` 8.0.0 → 10.2.1** — a **two-major-version** jump. The new package ships analyzers `AV0029`/`AV0030`; `Directory.Build.props:6` sets `TreatWarningsAsErrors=true`; result is **3 Release build errors** in `ArchLucid.Api`. Reproduced locally this pass — `dotnet build ArchLucid.Api/ArchLucid.Api.csproj -c Release` → `3 Error(s)` at `MvcExtensions.cs(87,9)` (AV0029, ×2 including the generated `OpenApiXmlCommentSupport.generated.cs`) and `PipelineExtensions.cs(98,13)` (AV0030).
2. **`@tanstack/react-query` → 5.102.2** (PR #508) while `@tanstack/react-query-persist-client` and `@tanstack/query-sync-storage-persister` remain **exact-pinned at 5.101.4**. npm nests a second copy: `package-lock.json` now contains **both** `node_modules/@tanstack/query-core` (line 5554) and `node_modules/@tanstack/react-query/node_modules/@tanstack/query-core` (line 5624). Two nominally distinct `QueryClient` types → `operator-query-persist-client.ts(23,5)` `TS2322`.
3. **azurerm ceiling raised** to `>= 3.100.0, < 5.2.1` (PRs #500/#501/#502), admitting provider **5.2.0** — a major bump. Correlates exactly with the 16 red `Terraform: validate` lanes; the precise validate error was not captured this pass, so this one is **correlation, not proven cause**.

### Gate 5 has regressed PASS → FAIL

| Command | v5.1 | v6 |
|---|---|---|
| `npx tsc --noEmit -p tsconfig.build.json` | exit 0 | **exit 1** |
| `npm run typecheck` | exit 0 | **exit 1** |

The local error is `ArchitectureDraftListClient.tsx(387,25)` `TS2322` — `"review-linked"` is not a member of `"archived" \| "draft" \| "ready-for-review" \| undefined`. CI reports **two** errors; the second is the duplicate-`query-core` conflict above.

**The headline consequence: the v5.1 uncapping is void.** Gate 5 is FAIL again, for the third assessment cycle running (v4: 4 errors, v5: 7 errors, v5.1: fixed, v6: 1 local + 1 CI-only).

### Two verification blind spots that let all of this through

These matter more than the individual defects, because they explain why local verification kept reporting green while trunk was red.

1. **Debug passes, Release fails.** Every local verification in the v5.1 and post-v5.1 work built **Debug**; the corset builds **Release**. `AV0029`/`AV0030` are invisible in Debug. A fix can be verified locally, land, and break trunk immediately.
2. **Stale `node_modules` passes, clean `npm ci` fails.** The duplicate `query-core` does **not** exist in this VM's `node_modules` (installed before the lock change) and therefore does not reproduce locally at all — but it is in the committed lockfile and reproduces on every clean install. **This entire failure class is unreachable by the standard local loop.**

### The `ci.yml` matrix is not merely unmeasured — it is skipped

v5.1 named the full matrix "the largest unmeasured correctness surface." v6 confirms it is worse than unmeasured: path-lane gating marks it **`skipping`** on every recent PR — `Operator UI: lint, typecheck, production build`, `Operator UI: unit (Vitest)`, `Operator UI: Vitest axe`, `Operator UI: Playwright mock functional`, `Lighthouse CI`, `Security: OWASP ZAP baseline`, `Security: Schemathesis light fuzz`, `SaaS: Terraform roots validate`.

### Correction to v5.1

v5.1 asserted: *"The top four deficiencies are now entirely non-toolchain… the cheap remediation surface is exhausted."* **That was wrong.** Toolchain deficiency did not stay exhausted; it regenerated within six hours because nothing gated it. Correctness & Evidence Integrity moves 84 → **68**, and its weighted deficiency goes 192 → **384**, making it the **#2** deficiency overall. The lesson is not that the remediation surface is small — it is that **an ungated remediation surface refills at the rate of dependency churn.**

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Claude Opus 5, simulator-aware; **no live Azure OpenAI call was made during this pass**, so all agent-path judgments are about mechanism and default configuration, not observed real-mode output.

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Claude Opus 5, simulator-aware; **no live Azure OpenAI call was made during this pass**, so all agent-path judgments are about mechanism and default configuration, not observed real-mode output.

**What is different about this pass.** v5.1 shipped and verified the toolchain fixes it prescribed, then asserted the cheap remediation surface was exhausted. v6 tests that assertion against trunk after the owner applied branch protection. **Result: the delivery-path defect is fixed and the correctness defect is worse than before.** This pass is therefore not a re-measurement of the same qualities — it is a measurement of what protection does and does not buy when the required-check list does not include the checks that detect breakage.

**Source materials inspected this pass:** GitHub rulesets API (`/rules/branches/master`, `/rulesets/21654724`, `/rulesets/15216586`), `ui-typecheck-on-push.yml`, `golden-cohort-nightly.yml`, `ci.yml`, `Directory.Build.props`, `Directory.Packages.props`, `archlucid-ui/package.json`, `archlucid-ui/package-lock.json`, `archlucid-ui/.npmrc`, `infra/terraform/versions.tf`, `ArchLucid.Api/Startup/MvcExtensions.cs`, `ArchLucid.Api/Startup/PipelineExtensions.cs`, `ArchitectureDraftListClient.tsx`, `operator-query-persist-client.ts`, plus `gh run list` / `gh run view --log-failed` / `gh pr checks` output and `git log --first-parent` topology.

## Executed this pass (runtime evidence, not doc claims)

| # | Command / observation | Result |
|---|---|---|
| 1 | `gh api repos/…/rules/branches/master` | **Protection ACTIVE** — `required_status_checks` = **one** entry, `cohort-real-llm-gate`; plus `deletion`, `non_fast_forward`, `copilot_code_review`; `current_user_can_bypass: never` |
| 2 | `git push origin master:master` (×2, 13:55 and 14:07) | **REJECTED** both times — `GH013 … Required status check "cohort-real-llm-gate" is expected` → **direct push to trunk is closed** |
| 3 | `git log --first-parent origin/master` + `/commits/{sha}/pulls` | **9 of 9** ref updates after 13:42 are PR-attributed merges; **7** of the 13 before it had **no PR** at all |
| 4 | `npx tsc --noEmit -p tsconfig.build.json` (Gate 5) | **FAIL — exit 1** — `ArchitectureDraftListClient.tsx(387,25)` `TS2322` (`"review-linked"` outside the union). **Regression from v5.1 PASS** |
| 5 | `npm run typecheck` (`tsconfig.json`) | **FAIL — exit 1**, same error |
| 6 | `dotnet build ArchLucid.Api/ArchLucid.Api.csproj -c Release` | **FAIL — 3 Error(s)** — `AV0029` ×2 (`MvcExtensions.cs:87` + generated file), `AV0030` ×1 (`PipelineExtensions.cs:98`) |
| 7 | Same project, **Debug** | **PASS** — the Release-only failure class local verification cannot see |
| 8 | `ui-typecheck-on-push.yml` on `master` — last 100 runs | **57 failure · 20 success · 20 cancelled · 3 running**; **37 consecutive failures** 08:27:48 → 14:16:43; last success **08:26:45** |
| 9 | `gh run view --log-failed` on the corset | UI typecheck: **2** `TS2322` errors (local one + duplicate `query-core`); .NET: the 3 `AV0029`/`AV0030` errors |
| 10 | `grep 'query-core' archlucid-ui/package-lock.json` | **Two** resolutions committed — top-level (line 5554) **and** nested under `react-query` (line 5624) |
| 11 | `ls node_modules/@tanstack/react-query/node_modules/@tanstack/query-core` | **absent locally** — confirms the second CI error is **clean-install-only** and unreachable from this VM |
| 12 | `git diff 0a0b0fadf3 0d9b656317 -- Directory.Packages.props` | `Asp.Versioning.Mvc` + `.ApiExplorer` **8.0.0 → 10.2.1**, plus FsCheck, Google.Apis.Auth, AWSSDK, ServiceBus, Handlebars, ITfoxtec |
| 13 | `gh pr checks 556` | **27 fail / 13+ pass**; merged anyway — only `cohort-real-llm-gate` was required |
| 14 | `gh pr checks` on #559/#560/#564 | Heavy `ci.yml` lanes report **`skipping`** (Vitest, Playwright, axe, Lighthouse, ZAP, Schemathesis, Terraform script suite) |
| 15 | `gh run view --job` on `cohort-real-llm-gate` | **Not a no-op** — `vars.ARCHLUCID_GOLDEN_COHORT_REAL_LLM` = `"true"`, `enabled=true`, budget probe executes |

**Verified counts carried forward by inspection (unchanged this pass):** **39** engines in `BuiltInFindingEngineTypeCatalog`; **14** engines in `GoldenCorpusHarness.CreateEngines()` (extended from 8 at commit `6e43a095e4`); `typed-engine-protected` bypass unchanged at `DeterministicInsightDensityGate.cs:85`.

**Landed on `master` between v5.1 and this pass** (scores assume them): Gate 5 typecheck fixes and `.npmrc` (`15836970d4`); workflow per-SHA concurrency, golden corpus 8→14 engines, trunk matrix probe (`6e43a095e4`); policy-pack explain DI registration, waiver scope parity, Api regression-test fixes (`386d0b4390`, PR #556); `FsCheck.Xunit` 3.3.2 → 3.4.0 to clear `NU1608` (`f14c1e7bd7`); **and the ~20-PR Dependabot batch at 08:26–08:27 that broke Release build, UI typecheck, and Terraform validate simultaneously.**

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows. Excludes GTM V1.1 items **#2/#3/#5/#6** (**M-90**/**M-44**/**M-91**/**M-92**) per standing exclusion rule. Owner assurance programs **G-REAL-05** / **G-ASSURANCE-02** appear here only because they are human-executed; they do **not** reduce `(A)`.

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|-----------------|--------------------|--------------------|
| 1 | **Add the three corset job names to the existing ruleset's `required_status_checks`** | **New #1, and it is a two-minute edit to a ruleset that already exists.** Protection is active and unbypassable, but requires **1 of ~40** checks, and that one measures LLM budget rather than correctness. The measured consequence: **37 consecutive red corset runs** on trunk, five PRs merged into that red state *after* protection went live, and PR #556 merged with **27** failing checks including two named "(blocking)". Add exactly: `Security: gitleaks (secret scan)`, `.NET: push corset (build + fast core Core/Decisioning)`, `Operator UI: typecheck (blocking)`. **Do not add them until Tier 1 items 1–3 in §17 are fixed, or trunk deadlocks** — see the sequencing note there. | No — policy | **Owner** |
| 2 | **Constrain Dependabot: group updates, and require review for major bumps** | The single mechanism that caused today's outage. ~20 PRs merged in ~75 seconds, including a **two-major** framework bump (`Asp.Versioning` 8→10) and a **provider major** (azurerm 4→5). No batching, no staging, and — because of #1 — no corset requirement on any of them. | Partial — config is agent-editable, policy is owner | **Owner + Composer** |
| 3 | **G-REAL-06** — three real-mode pilot runs | Largest commercial uncertainty driver. **Re-blocked in v6:** production build fails at typecheck again, so the demo surface is not currently buildable. Unblocks once §17 Tier 1 item 2 lands. Script at `scripts/Run-GReal06ProofRuns.ps1`. | Partial | **Opus** |
| 4 | **G-REAL-07** — proof packets + `PROOF_PACKET_RUN_LOG` | Depends on #3. | Partial | **Sonnet** |
| 5 | **M-39** — apply proof-packet checklist, ≥3 G4 rows | Depends on #4. | Partial | **Sonnet** |
| 6 | **M-07** — polished operator screenshots | **Re-blocked in v6** — Gate 5 FAIL, production build fails. | Partial | **Composer** |
| 7 | **M-09** — landing owner sign-off + deploy | Gated on #6. | Partial | **Sonnet** |
| 8 | **M-16** — demo video | Depends on #6; run **G-REAL-09** before recording. | Partial | **Sonnet** |

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 73.97% (v6)**

**Down 4.23 points from v5.1's 78.20%, and the drop is entirely trunk-health regression.** No product capability was lost. Gate 5 is **FAIL** again (`npx tsc --noEmit -p tsconfig.build.json` exit 1), so the ship-gate override also reapplies — but the cap is **not binding this pass**, because the weighted average (73.97%) already sits below v5's 75.26% cap. The honest headline is the weighted average with a ship-blocker attached, not a capped number.

**What genuinely improved.** Governed Review Integrity rises **86 → 88**, the only upward move. Direct pushes to `master` are structurally impossible now, and `copilot_code_review` runs on push. That is the owner's #1 landing, and it is real.

**What regressed, and why the regression is the story.** Four qualities fall: Correctness & Evidence Integrity **84 → 68**, Time-to-Value **75 → 68**, Runtime & First-Review Reliability **79 → 66**, Adoption Friction **88 → 72**. Every point of that comes from the same six-hour window in which trunk went red and stayed red — 37 consecutive failed corset runs, a Release build that does not compile, a UI typecheck that fails on a clean install, and 16 red Terraform lanes. A fresh clone today cannot typecheck and cannot build the API in Release.

**The structural finding.** v4's errors were in policy-packs and risk-exceptions. v5's were in the finding-inspect stickiness split and the SAML SP refactor. v5.1 fixed those and concluded the toolchain surface was exhausted. **v6's errors came from a dependency batch nobody reviewed**, and they are worse than either previous set because two of the three are **invisible to local verification** — one is Release-only, one is clean-install-only. The pattern has not been broken; it has changed shape. Protection closed the door that direct pushes came through, and the breakage walked in through Dependabot instead.

**Insight Density stays at 66** and remains the single largest weighted deficiency (**442**) — but for the first time since v4 it is no longer more than double the next item, because Correctness has climbed to **384**.

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`: SOC 2 CPA attestation, third-party pen-test publication, signed design partner, owner-output GTM assets/cohorts, public extension SDK, MCP absence in V1, third-party plugin marketplace, assistive-technology participant testing, and sales-engineer-led LLM onboarding.

---

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 66 | 13 | 8.58 | **442** |
| 2 | Differentiability / Defensibility vs Frontier AI | 81 | 13 | 10.53 | 247 |
| 3 | Governed Review Integrity | 88 | 13 | 11.44 | 156 |
| 4 | Correctness & Evidence Integrity | 68 | 12 | 8.16 | **384** |
| 5 | AI / Agent Readiness | 74 | 10 | 7.40 | 260 |
| 6 | Time-to-Value | 68 | 10 | 6.80 | **320** |
| 7 | Proof-of-ROI Readiness | 76 | 9 | 6.84 | 216 |
| 8 | Sponsor / Operator Comprehension | 75 | 8 | 6.00 | 200 |
| 9 | Runtime & First-Review Reliability | 66 | 7 | 4.62 | **238** |
| 10 | Adoption Friction | 72 | 5 | 3.60 | 140 |
| | **(A) Headline readiness** | | **100** | **73.97%** | |

**Ranked by weighted deficiency:** Insight Density (442) · **Correctness (384)** · **Time-to-Value (320)** · AI/Agent Readiness (260) · Differentiability (247) · **Runtime (238)** · Proof-of-ROI (216) · Comprehension (200) · Governed Review Integrity (156) · Adoption Friction (140).

**Total remaining deficiency signal: 2,603, up from 2,180 in v5.1 — a 423-point increase, all of it toolchain and trunk health.** Three of the four largest movers (Correctness +192, Time-to-Value +70, Runtime +91) are the same six-hour trunk outage counted three ways. This directly falsifies v5.1's claim that "the cheap remediation surface is exhausted": **the toolchain deficiency surface is not exhaustible while nothing gates it — it refills at the rate of dependency churn.**

**Scoring rationale for every change.**

| Quality | v5.1 | v6 | Why exactly this much |
|---|---:|---:|---|
| Governed Review Integrity | 86 | **88** | **Only upward move.** Direct pushes to `master` are structurally impossible (verified twice by rejected push); 9/9 recent ref updates are PR-attributed; `copilot_code_review` runs on push. Held to +2 because review is now *mandatory* but *unqualified* — a PR with 27 red checks merged, so the gate proves process, not correctness |
| Correctness & Evidence Integrity | 84 | **68** | **Largest fall (−16).** Release build does not compile (3 errors, reproduced locally); `.NET: OpenAPI v1 contract snapshot (fail-fast)` red; 16 Terraform validate lanes red; 4 Stryker lanes red; `CodeQL (javascript)` red again after v5.1 declared it discharged; heavy `ci.yml` lanes `skipping` on every PR. Not lower than 68 because the fast-core suites themselves are healthy where they run — Core 818/0 and Decisioning 319/0 held across this session's local runs, and the Api/AgentRuntime/Application/Host.Composition failures found earlier today were fixed and verified |
| Time-to-Value | 75 | **68** | `npm run build` fails at the typecheck step, so the demo surface is unbuildable again — the exact condition v5.1 scored +3 for clearing. Gate 1 still **UNKNOWN**, which independently caps this |
| Runtime & First-Review Reliability | 79 | **66** | **37 consecutive** red corset runs on trunk; 57 failure / 20 success over the last 100. v5.1 scored 79 largely on "first all-green corset completion," which held ~6.5 hours. Not lower than 66 because the cancellation-by-churn mechanism v5.1 flagged **was** fixed — per-SHA concurrency groups landed at `6e43a095e4`, and runs now complete instead of being evicted. The failures are honest signal, not lost signal |
| Adoption Friction | 88 | **72** | A fresh clone fails the first two commands a contributor runs: `npm run typecheck` exits 1, and `dotnet build -c Release` fails. v5.1's +4 was awarded precisely for those being clean. Worse than the v5 baseline of 84 because the duplicate `query-core` is **committed in the lockfile**, so it reproduces on every clean install rather than depending on local state |
| Sponsor / Operator Comprehension | 77 | **75** | `ArchitectureDraftListClient` — a sponsor-visible draft-status surface — has an unhandled `"review-linked"` status in its type union, which is both the Gate 5 error and a real modelling gap. Narrative *content* unchanged, hence only −2 |

**Unchanged and deliberately so:** Insight Density (66), Differentiability (81), AI/Agent Readiness (74), Proof-of-ROI (76). No mechanism, corpus, engine, or pilot evidence moved this pass.

---

## 3. Diagnostic Scores (non-headline)

**Decision Advantage Score: 65/100.** **Unchanged in v5.1** — and this is the point worth dwelling on. The v5.1 fixes were entirely build-and-toolchain; none of them changed what a finding *tells an architect*. Declaration and governance SoD/prod-promotion property tests execute green, so the policy→finding chain has passing regression evidence for its clearest non-compliance instances. Still discounted because engine depth is checklist-shaped and `typed-engine-protected` discards density scores.

**Frontier-AI Survival Probability (12 months): 55–70%, moderate confidence.** Unchanged mechanism story from v4.

**30-Day Voluntary Usage Probability: 36–51%, low-moderate confidence.** Up ~3 points from v5's 33–48%: a developer cloning the repo can now install, typecheck, and build the operator surface without hitting a wall in the first ten minutes. Still capped by Gate 1 UNKNOWN — nobody has watched a review complete.

**Sponsor Purchase Probability: 28–43%, low confidence.** Up ~2 points: the demo surface builds, which removes a disqualifying failure from any live walkthrough. **Zero G-REAL-06 pilots still dominates** — a buildable demo is not a proof packet, and no sponsor has seen real-mode output.

**Reconciliation with §2.** Headline (**73.97%**) sits above Decision Advantage (65) and far above the purchase band (28–43%). The gap **narrowed** in v6, from 13 points to **9** — and unlike v5.1's widening, this narrowing is not good news. Decision Advantage did not rise; the headline fell to meet it, because the headline's toolchain component regressed while analytical depth stayed flat. Do not read 73.97% as being 73.97% of the way to a sale. The **9-point** spread is the current honest size of the "well-engineered container, unproven analysis" gap, and the right way to close it is to raise Decision Advantage rather than to let the container decay toward it.

---

## 4. V1 Ship Gate

| # | Gate | Verdict | Evidence | Fastest resolution |
|---|------|---------|----------|--------------------|
| 1 | First review completes create → execute → commit → manifest + ≥1 artifact | **UNKNOWN** | Not executed here. | Staging `ship-gate-evidence` with SQL API. |
| 2 | No hallucinated or uncited policy/evidence citations | **PASS (mechanism)** | Emission gate + citation integrity evaluator unchanged. | Upgrade after gate 1 live. |
| 3 | Sponsor summary / ROI coherent and not misleading | **PASS (mechanism)** | TB-603 Done; disposition-aware headline. | As above. |
| 4 | Export / package generation works | **PASS (mechanism)** | Suite=Core coverage exists; live ZIP not run here. | Optional staging probe. |
| 5 | Architect workspace does not break during first-review / demo path | **FAIL** (v6; was PASS in v5.1, FAIL in v5) | `npx tsc --noEmit -p tsconfig.build.json` **exit 1** — `ArchitectureDraftListClient.tsx(387,25)` `TS2322`, `"review-linked"` outside `"archived" \| "draft" \| "ready-for-review" \| undefined`. `npm run typecheck` **exit 1**. CI reports a **second** error, `operator-query-persist-client.ts(23,5)` `TS2322`, from the duplicate `@tanstack/query-core` committed in `package-lock.json` — **clean-install-only, does not reproduce locally**. CI `Operator UI: typecheck (blocking)` red on **37 consecutive** trunk runs. | Two fixes, both small: widen the `ArchitectureDraftCustomerStatus` handling at the call site, and dedupe `query-core` by aligning the `@tanstack/*` family to one constraint style. |
| 6 | Auth + tenant isolation on pilot path | **PASS (mechanism)** | ADR 0037, scope guard, ship-gate negative probes. | As gate 1. |

**Gate 5 is FAIL, so the headline carries a ship-blocker.** The cap is not arithmetically binding — 73.97% is already below v5's 75.26% cap — but no V1 ship claim is defensible while the operator UI does not typecheck and the API does not build in Release. Gate 1 remains **UNKNOWN** and still needs a live staging run, not a code change.

**The lesson v5.1 wrote and v6 proved.** v5.1 said: *"Gate 5 PASS is a measurement, not a guarantee… the honest statement is that Gate 5 can be green and was green — not that it stays green."* That was correct, and it took **six and a half hours** to be vindicated. The follow-on correction is that v5.1 attributed the fragility to *direct pushes*. Direct pushes are now impossible and **Gate 5 failed anyway** — because the required-check list does not include the check that measures Gate 5.

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

### 7.2 Correctness & Evidence Integrity — 68 · weight 12 · contribution 8.16 · deficiency 384 *(v5.1: 84)*

**Up from 78 (v5.1); 72 in v4.** Push corset: Core **818/0**, Decisioning **319/0** on `DOTNET_FAST_CORE_TEST_FILTER` — **re-run after the v5.1 UI type changes with no regression**. Declaration tests use `cost-opt-001` outside declaration prefix family; governance tests embed manifest via `CreateRunDetailWithManifest`. Gitleaks clean.

**New in v5.1:** Gate 5 exit 0 on both tsconfigs; production build completes 195/195; `npm ci` resolves from clean; and **CodeQL now completes `success` on both `javascript` and `csharp`** across three consecutive runs. The last item is the most consequential: the `npm ci` ERESOLVE had been deterministically aborting the `javascript` analysis job, so for that window JavaScript/TypeScript security analysis produced **no results at all** — an empty `js/*` alert list meant "the analyzer never started," not "no findings."

**Still deduct:** the full `ci.yml` matrix remains **PR-only**, so Api/Application/Integration suites outside the corset slice were **not measured in v4, v5, or v5.1**. With Gate 5, the build, and CodeQL all green, this is now unambiguously the largest unmeasured correctness surface, and the risk is that a green corset gets read as "trunk is green." Golden corpus still 8/39. CodeQL cancellation rate (12/25) means most pushes still receive no analysis even though the analysis now works.

**Classification:** V1. **Affects outcomes 1, 2, 4.**

### 7.3 Time-to-Value — 68 · weight 10 · contribution 6.80 · deficiency 320 *(v5.1: 75)*

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

### 7.6 Runtime & First-Review Reliability — 66 · weight 7 · contribution 4.62 · deficiency 238 *(v5.1: 79)*

**Up from 71 (v5.1); 66 in v4 — the largest single move in this revision.** Push corset shipped with dotnet + typecheck jobs and now has its **first all-green completion on trunk** ([33031842736](https://github.com/joefrancisGA/ArchLucid/actions/runs/33031842736), all three jobs `success`). Gitleaks green. **CodeQL converged**: three consecutive completed runs `success` on both languages, against three consecutive `failure` runs immediately before the fix.

**The v5 `npm ci` finding was far larger than v5 credited it, and this is the most useful thing either pass learned.** v5 recorded it as "one workflow failure" ([33030009906](https://github.com/joefrancisGA/ArchLucid/actions/runs/33030009906)) — a dependabot annoyance. v5.1 traced **all 8 CodeQL `failure` conclusions** in the prior 25 runs to the identical ERESOLVE in the `CodeQL (javascript)` "Install and build UI" step, with `CodeQL (csharp)` succeeding throughout. The peer conflict was **deterministically disabling JavaScript/TypeScript security analysis on every run that was not cancelled first** — a security control silently off, presenting as a clean alert list. Fixed via a three-line `archlucid-ui/.npmrc`. The generalizable lesson is recorded in `CODEQL_TRIAGE.md`: **verify the job completed before concluding the code is clean.**

**Still deduct, and the deduction is entirely about scheduling now:** cancellation-by-churn is **completely untouched** — 12 of the last 25 CodeQL runs cancelled, and the runs for the fix commit `15836970d4` itself were cancelled before a later commit's runs went green. So the analysis works but most pushes never get it. Branch protection remains unapplied, so **none of these now-green checks block anything**. A working gate that is not required is a monitoring tool, not a gate.

**Classification:** V1. **Affects outcomes 2, 3.**

### 7.7 Proof-of-ROI Readiness — 76 · weight 9 · contribution 6.84 · deficiency 216

Unchanged. Mechanism complete; zero real pilot deltas.

**Classification:** V1 residual + validation. **Affects outcomes 3, 4.**

### 7.8 Governed Review Integrity — 88 · weight 13 · contribution 11.44 · deficiency 156 *(v5.1: 86)*

**Up from 84.** Governance workflow segregation/promotion property tests and dry-run submission tests pass with embedded manifests. Golden harness still 8/39 without `IEffectiveGovernanceLoader` injection.

**Classification:** V1. **Affects outcomes 2, 4, 5.**

### 7.9 Sponsor / Operator Comprehension — 75 · weight 8 · contribution 6.00 · deficiency 200 *(v5.1: 77)*

**Up from 75 (v5.1); 74 in v4.** v4 help-resolver repair holds. The v5 regressions in the finding-inspect stickiness split — the **sponsor-facing finding disposition surface**, including `SponsorStorySynopsisFromCounts` and the disabled-CTA explanation chain — are fixed, so the surface compiles and ships rather than blocking the build.

**Only +2, deliberately.** This fix restored a surface that *already existed*; it added no sponsor comprehension. The underlying deductions are untouched: sponsor narrative quality still rests on synthetic corpus output, and no sponsor has read a real-mode ROI summary (**G-REAL-06**). The `WhyDisabledCtaHint` chain being type-correct means operators see *a* reason, not that the reason is well-chosen.

**Classification:** V1. **Affects outcomes 2, 4.**

### 7.10 Adoption Friction — 72 · weight 5 · contribution 3.60 · deficiency 140 *(v5.1: 88)*

**Up from 84 (v5.1).** The two commands a new contributor runs first — `npm ci` and `npm run typecheck` — now both succeed from a clean clone. In v5 the first failed with ERESOLVE and the second reported 7 errors, which is a first-hour experience that reads as an abandoned repo.

**Still deduct:** `legacy-peer-deps=true` is a **documented workaround, not a resolution** — it accepts a knowingly-inconsistent tree until `openapi-typescript` ships TypeScript 7 peer support. The `.npmrc` comment says so explicitly. Onboarding docs still assume PowerShell-first flows.

**Classification:** V1 residual. **Affects outcomes 2, 3.**

---

## 8. Top 10 Weaknesses

**v6 re-ranked, and the top of the list is new.** The standing #1 — "trunk churn outruns fix-and-verify" — is **resolved as written** and removed: direct pushes to `master` are structurally impossible, verified by two rejected pushes and 9-of-9 PR-attributed ref updates. It is replaced by a sharper defect that the fix exposed rather than created. Two entirely new entries entered at **#3** and **#5**. **Note the shape change: v5.1's list had one process defect and one toolchain item; v6 has four process/toolchain entries in the top five.** That is a regression in kind, not just in score.

1. **The enforced gate is decoupled from the signal that detects breakage.** **New #1.** Branch protection is `active` and unbypassable, but its `required_status_checks` list has **one** entry — `cohort-real-llm-gate` — which measures LLM budget month-to-date and golden-fixture presence. It does not build, test, typecheck, or validate anything. The corset jobs that *do* are not required. Measured consequence: **37 consecutive** red corset runs on trunk (08:27:48 → 14:16:43), five PRs merged into that red state after protection went live, and PR #556 merged with **27** failing checks including `Operator UI: typecheck (blocking)`, `Docs: link integrity + scope-header ratchet (blocking)`, and `.NET: OpenAPI v1 contract snapshot (fail-fast)`. **A gate that admits every red check is a review requirement, not a quality gate.** Process uncertainty — and the cheapest fix on this entire document.
2. **Insight density still subtractive.** Unchanged architectural ceiling — `typed-engine-protected` still discards the computed density score at `DeterministicInsightDensityGate.cs:85`. **Still the largest weighted deficiency at 442**, though no longer double the next item now that Correctness has risen to 384. Design uncertainty.
3. **Unbatched Dependabot auto-merge lands major-version bumps without a passing build.** **New in v6, and it is the proximate cause of the current outage.** Roughly twenty PRs merged between 08:26:45 and 08:27:48 — including `Asp.Versioning.Mvc` **8.0.0 → 10.2.1** (two majors) and azurerm's ceiling raised to admit **5.2.0** (one major). Three independent breaks landed simultaneously: Release build (`AV0029`/`AV0030` under `TreatWarningsAsErrors`), UI typecheck (duplicate `@tanstack/query-core`), and 16 Terraform validate lanes. No grouping, no major-version review, and — because of #1 — no build requirement on any of them. Process uncertainty.
4. **Zero completed real-mode pilots (G-REAL-06).** Unchanged in substance, but **re-blocked** in v6: the production build fails at typecheck, so the demo surface pilots need is not currently buildable. Market uncertainty.
5. **Two failure classes are invisible to local verification.** **New in v6, and the reason this outage lasted six hours.** (a) **Release-only:** `AV0029`/`AV0030` do not appear in Debug builds; every local verification in this session and the v5.1 work built Debug, and the corset builds Release. (b) **Clean-install-only:** the duplicate `query-core` is committed in `package-lock.json` but absent from an already-populated `node_modules`, so it cannot be reproduced locally at all — this assessment confirmed its absence on this VM while CI reports it. **A verification loop that cannot see two of three break classes will keep certifying broken trunk as green.** Process uncertainty.
6. **Gate 1 remains UNKNOWN — no observed end-to-end first review.** Unchanged; needs a live staging run. Validation uncertainty.
7. **Heavy `ci.yml` lanes are `skipping` on nearly every PR.** v5.1 called this "unmeasured"; v6 confirms it is *actively skipped* by path-lane gating — `Operator UI: lint, typecheck, production build`, `Operator UI: unit (Vitest)`, `Vitest axe`, `Playwright mock functional`, `Lighthouse CI`, `OWASP ZAP baseline`, `Schemathesis light fuzz`, `SaaS: Terraform roots validate`. Largest remaining unmeasured correctness surface. Process uncertainty.
8. **Declaration policy gate recognizes only `cis-az-*` and `sec-base-028`, so every other buyer-facing pack fail-opens.** **Partially remediated since v5.1** — `DeclarationSignalPolicyKeyMap` was expanded on `master`, so re-derive the current vocabulary list before quoting this. The structural point stands and is a direct hit on Differentiability: a buyer toggling SOC 2 versus CIS Azure should see declaration rows move, and historically did not. Remediation spec is **PP-01** in `docs/architecture/POLICY_PACK_MOAT_COMPOSER_PROMPTS.md`. Design uncertainty.
9. **`legacy-peer-deps=true` masks resolution conflicts instead of resolving them — and it is now implicated in an outage.** **Promoted from #10.** v5.1 introduced it to clear an `npm ci` ERESOLVE and rated it "lowest severity on this list." v6 shows the cost: with peer-dep enforcement disabled, `@tanstack/react-query: ^5.102.2` alongside exact-pinned `@tanstack/react-query-persist-client: 5.101.4` and `@tanstack/query-sync-storage-persister: 5.101.4` produces a **silently nested second `query-core`** rather than a loud install error. **The workaround converted a build-time failure into a type error discovered six hours later.** A targeted `overrides` entry for `openapi-typescript`'s `typescript` peer would fix the original problem without disabling enforcement globally. Design uncertainty.
10. **Remaining engine-depth debt.** Bundled packs still lack expectation extras by default; golden corpus covers **14 of 39** engines after the `6e43a095e4` extension (up from 8, still no governance loader injection); actor-dependent engines stay silent on IaC-only reviews and the dual finding model persists. Grouped because none moved this pass and each is individually smaller than #1–#9. Design uncertainty.

**Removed from the v5.1 list because genuinely fixed:** "trunk churn outruns fix-and-verify" (direct pushes now impossible — the owner's #1) and the CodeQL cancellation-by-churn residual (per-SHA concurrency groups landed at `6e43a095e4`; runs now complete rather than being evicted from the pending slot).

**A caution on CodeQL specifically.** v5.1 declared it "fully discharged" on the strength of three consecutive green post-fix runs. `CodeQL (javascript)` is **red again** on PR #556. Three green runs is not a durability claim, and this pass treats it as such: CodeQL's status now rides on weakness **#1** like everything else, because it is not a required check either.

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

**The owner did the thing this document asked for, and it did not work — because the gate was wired to the wrong check. A required-check list is only as good as its worst omission.**

v5.1 ended by arguing that the marginal value of another remediation pass was near zero and the marginal value of one repository setting was high. **The setting was applied at 13:42 UTC. It worked exactly as designed and trunk got worse anyway.** Direct pushes to `master` are now impossible — verified twice by rejected pushes, and by nine consecutive PR-attributed ref updates where seven of the previous thirteen had no PR at all. That is a genuine structural improvement, and it deserves to be said plainly before the rest.

And yet: at the moment of this pass the operator UI does not typecheck, `ArchLucid.Api` does not compile in Release, sixteen Terraform lanes are red, and the push corset has failed **37 consecutive times** over six hours. Five pull requests merged into that state *after* protection went live. One of them — this assessment's own — merged with **27** failing checks, two of which have the word "blocking" in their names.

**The mechanism is a one-line omission.** The ruleset requires a single context, `cohort-real-llm-gate`, which measures LLM spend and fixture presence. The three checks that would have caught every defect above are not in the list. Protection converted "anyone can push anything" into "anyone can merge anything," which is better — reviewable, attributable, revertible — but it is not a quality gate.

**The deeper lesson is about where breakage now enters.** v4's regressions came from hand-written UI churn. v5's did too. v6's came from **twenty Dependabot pull requests that merged in seventy-five seconds**, including a two-major framework bump and a provider major. Closing the direct-push door did not reduce the rate at which trunk breaks; it changed which door the breakage uses. Any control that gates humans but not bots gates the smaller half of the problem.

**And two of the three defects were unfindable locally.** `AV0029`/`AV0030` appear only in Release; every local verification in this session built Debug and passed. The duplicate `query-core` is committed in the lockfile but absent from an already-populated `node_modules`, so it cannot be reproduced on this machine at all — this pass confirmed its absence while CI reported it. **A verification loop blind to two of three break classes will keep certifying red trunk as green, and no amount of diligence inside that loop fixes it.**

So the honest conclusion is narrower and more actionable than v5.1's. It is not "one setting fixes this" — that was tried. It is: **green the three broken jobs, then require them, then gate the bots, then make the local loop able to see Release and clean-install failures.** Items 1–6 in §17, in that order. Every one is small. The sequencing is the whole point: requiring the corset today would deadlock the repo, because the corset is red.

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

> **Sequencing warning — read before doing anything here.** Items **1, 2, and 3** must land **before** item **4**. Trunk is currently red on all three corset jobs; requiring them first would block every merge, including the merges that fix them. Order: green the corset (1–3), confirm one all-green trunk run, then require it (4). Items 1–3 are all agent-closable and independent of each other.

**1. Fix the Release build — `AV0029` / `AV0030` in `ArchLucid.Api`.**
Tier 1 · **New in v6, blocking, and it needs an API-design decision rather than a mechanical fix.** · **Evidence:** `dotnet build ArchLucid.Api/ArchLucid.Api.csproj -c Release` → `3 Error(s)`; Debug builds clean. `Asp.Versioning.Mvc` 8.0.0 → 10.2.1 added analyzers that `Directory.Build.props:6` (`TreatWarningsAsErrors=true`) promotes to errors. · **The decision:** `AV0029` wants `AddApiVersioning().AddOpenApi()` instead of a standalone `services.AddOpenApi(...)` at `MvcExtensions.cs:87`, and `AV0030` wants `MapOpenApi().WithDocumentPerVersion()` at `PipelineExtensions.cs:98`. **Adopting both changes the OpenAPI document layout to one document per API version**, which will invalidate `openapi-v1.contract.snapshot.json`, the APIM import, and client codegen. · **Two defensible paths:** (a) adopt the versioned-document model and regenerate every downstream contract — correct long-term, wide blast radius; (b) suppress `AV0029`/`AV0030` in `.editorconfig` with a comment recording that ArchLucid intentionally serves a single `/openapi/v1.json` — restores trunk in minutes, defers the design question. **Recommend (b) now, (a) as a tracked follow-up**, because trunk being red is currently costing more than the design debt. · **Classification: V1.**

**2. Fix Gate 5 — two UI typecheck errors, one of which is clean-install-only.**
Tier 1 · **New in v6, blocking.** · (a) `ArchitectureDraftListClient.tsx(387,25)`: `ArchitectureDraftCustomerStatus` includes `"review-linked"`, which the consuming prop union does not accept. Widen the consumer or map the status explicitly — this is a real modelling gap in a sponsor-visible surface, not just a cast. · (b) `operator-query-persist-client.ts(23,5)`: two `QueryClient` types from a **duplicate `@tanstack/query-core`**, committed in `package-lock.json` (top-level line 5554 **and** nested under `react-query` line 5624). Align the `@tanstack/*` family to one constraint style — bump `@tanstack/react-query-persist-client` and `@tanstack/query-sync-storage-persister` off exact `5.101.4`, or add an `overrides` entry pinning a single `query-core`. **Verify with a scratch `npm ci`, not the existing `node_modules`** — this error does not reproduce against a populated tree. · **Classification: V1.**

**3. Fix the 16 red `Terraform: validate` lanes.**
Tier 1 · **New in v6.** `infra/terraform/versions.tf` now permits `azurerm >= 3.100.0, < 5.2.1`, admitting provider **5.2.0** — a major bump merged by Dependabot PRs #500/#501/#502. Correlation with the lane failures is exact; **the specific validate error was not captured this pass, so confirm it before choosing a fix.** Likely either pin below 5.0 pending a deliberate migration, or fix the resource schemas 5.x renamed. · **Classification: V1.**

**4. Add the three corset jobs to the existing ruleset's `required_status_checks` — after 1–3 are green.**
Tier 1 · **This is the single highest-leverage change in this document and it is a two-minute ruleset edit.** · **Evidence it is needed:** protection is `active` with **one** required check, `cohort-real-llm-gate`, which measures LLM budget rather than correctness; trunk has been red for **37 consecutive** corset runs; PR #556 merged with **27** failing checks including two named "(blocking)". · **Add exactly these contexts:** `Security: gitleaks (secret scan)`, `.NET: push corset (build + fast core Core/Decisioning)`, `Operator UI: typecheck (blocking)`. · **Consider also** `CodeQL (csharp)` and `CodeQL (javascript)` — but note `CodeQL (javascript)` is red on PR #556, so treat it as a second wave. · **Owner-only — GitHub ruleset settings.** · **Classification: V1 (process).**

**5. Constrain Dependabot — group updates and gate major bumps.**
Tier 1 · **New in v6.** ~20 PRs merged in ~75 seconds caused three simultaneous breaks. · **Concrete config:** in `.github/dependabot.yml` add `groups` per ecosystem so NuGet/npm/Terraform land as one reviewable PR each, and `ignore` with `update-types: ["version-update:semver-major"]` so majors require a deliberate human PR. · **Pairs with item 4** — grouping without a required build check just makes the batches bigger. · **Classification: V1 (process).**

**6. Close the two verification blind spots.**
Tier 1 · **New in v6, and it is what prevents the next six-hour outage rather than fixing this one.** · **(a) Release:** `scripts/ci/run_push_corset_dotnet.sh` already builds `-c Release`, but nothing makes a local pre-push loop do so; agents and contributors verify Debug and get a false green. Add a documented pre-push invocation and state in `AGENTS.md` that **Debug success is not evidence**. · **(b) Clean install:** add a CI-or-script assertion that fails on duplicate resolutions — e.g. `npm ls @tanstack/query-core` returning more than one version — so lockfile duplication is caught at the PR that introduces it rather than by a type error hours later. · **Classification: V1.**

**7. Execute Gate 1 — one observed end-to-end first review.**
Tier 1 · Unchanged from v5.1. · **Desired evidence:** a single staging run recording create → execute → commit → sealed manifest + ≥1 artifact, with run id and manifest hash captured. · Requires a live stack. · **Classification: validation.**

**8. Execute G-REAL-06 / G-REAL-07 / M-39.**
Tier 1 · validation · **Re-blocked in v6** — production build fails at typecheck, so the demo surface does not currently exist. Unblocks on item 2. Orchestrator: `scripts/Run-GReal06ProofRuns.ps1`. · **Classification: validation.**

**9. Measure the full `ci.yml` matrix once on a trunk commit.**
Tier 1 · Carried from v5.1, **with the finding sharpened**: the heavy lanes are not merely unmeasured, they report `skipping` on essentially every PR because path-lane gating excludes them. · **Desired outcome:** one `workflow_dispatch` full-matrix run on `master` with results recorded, plus a decision on whether path gating should be relaxed for trunk. · **Cheapest item on this list** — one dispatch. · **Classification: V1.**

### Tier 2 — High Leverage

**10.** Triage pre-existing help Vitest failures (baseline from v4). **11.** Policy-toggle demo artifact. **12.** Seed overlay `advisoryDefaults`. **13.** Extend golden harness past **14** engines + inject governance loader (8→14 landed at `6e43a095e4`). **14.** Replace `legacy-peer-deps=true` with a targeted `overrides` entry for `openapi-typescript`. **15.** M-07 screenshots after items 1–2.

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
