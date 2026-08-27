# ArchLucid Strategic Release and Market Readiness Assessment (v5)

**Pass date:** 2026-08-27 (01:30–01:40 UTC). **Computed fresh** — no carry-forward, no score deltas, no rescore ratchet. The prior same-night pass is archived at [`../archive/assessments/LATEST_GPT55-2026-08-27-v4-superseded.md`](../archive/assessments/LATEST_GPT55-2026-08-27-v4-superseded.md) and is **not** canonical.

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Claude Opus 5, simulator-aware; **no live Azure OpenAI call was made during this pass**, so all agent-path judgments are about mechanism and default configuration, not observed real-mode output.

**What is different about this pass.** v4 repaired dark automation and found regressions faster than humans could fix them. This pass **shipped the trunk-stability response** the owner approved: a thicker `master` push corset (dotnet build + Core/Decisioning fast-core + UI typecheck), repaired the declaration and governance fast-core suites that v4 flagged, and fixed the seven typecheck errors v4 named — then measured trunk again **after continued concurrent churn**. The pattern is now explicit: **the corset works when it runs to completion; churn lands new breaks before the previous fix is the only thing on `master`.**

**Source materials inspected this pass:** `ui-typecheck-on-push.yml`, `scripts/ci/run_push_corset_dotnet.sh`, `DeclarationSecurityBaselineFindingEngineTests`, `DeclarationPremiseConflictFindingEngineTests`, `GovernanceWorkflowTestComposition.CreateRunDetailWithManifest`, `FindingInspectGovernanceStickinessPanel.tsx` / `FindingInspectStickinessSummary.tsx` / `FindingInspectDispositionControls.tsx`, `SamlSpConfigurationForm.tsx` / `SamlSpMetadataLookupBlock.tsx`, `BuiltInFindingEngineTypeCatalog`, `GoldenCorpusHarness.CreateEngines()`, `DeterministicInsightDensityGate`, `DeclarationSignalPolicyGate`, `.gitleaks.toml`, `ci.yml`, `codeql.yml`, `CODEQL_TRIAGE.md`.

## Executed this pass (runtime evidence, not doc claims)

| # | Command / observation | Result |
|---|---|---|
| 1 | `dotnet build ArchLucid.Active.slnf -c Release` | **PASS** — 0 errors (2 file-lock retries on a busy VM) |
| 2 | `scripts/ci/run_push_corset_dotnet.sh` | **PASS** — Core **818** / 0 failed; Decisioning **319** / 0 failed |
| 3 | `npm run typecheck` (`tsconfig.json`) | **FAIL** — **7** errors in **5** files (new churn, not v4's four) |
| 4 | `npx tsc --noEmit -p tsconfig.build.json` (Gate 5) | **FAIL** — same **7** errors |
| 5 | `npm run build` (Next 16.3 production) | **FAIL** at typecheck step — build does not complete with red typecheck |
| 6 | `gitleaks 8.30.1 detect --source .` with repo config | **PASS** — 0 findings over full history |
| 7 | `ui-typecheck-on-push.yml` on `master` | **Live** — extended workflow includes **`.NET: push corset`** + typecheck; runs **cancelled** when superseded by the next push (e.g. runs [33030217428](https://github.com/joefrancisGA/ArchLucid/actions/runs/33030217428), [33030298707](https://github.com/joefrancisGA/ArchLucid/actions/runs/33030298707) queued/cancelled) |
| 8 | `codeql.yml` on `master` | **Still latest-wins** — of 6 recent runs, **5 cancelled**, **1 pending**; no confirming completed run this pass |
| 9 | `master` commit velocity | **106 commits** in ~70 minutes ending this pass (vs v4's 51 in one hour) |

**Verified counts by direct inspection this pass:** **39** engines in `BuiltInFindingEngineTypeCatalog`; **8** engines in `GoldenCorpusHarness.CreateEngines()`; `typed-engine-protected` bypass unchanged at `DeterministicInsightDensityGate.cs:85`.

**Fixed and pushed to `master` before this pass** (scores assume them): extended push corset (`548fc47276` merge); prior seven typecheck fixes; declaration tests use `cost-opt-001` fail-open fixtures; governance workflow tests embed golden manifest via `CreateRunDetailWithManifest`; help resolver chain and gitleaks/CodeQL repairs from v4.

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows. Excludes GTM V1.1 items **#2/#3/#5/#6** (**M-90**/**M-44**/**M-91**/**M-92**) per standing exclusion rule. Owner assurance programs **G-REAL-05** / **G-ASSURANCE-02** appear here only because they are human-executed; they do **not** reduce `(A)`.

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|-----------------|--------------------|--------------------|
| 1 | **G-REAL-06** — three real-mode pilot runs | Still the largest commercial uncertainty driver. Corset is green for Core/Decisioning; production build is red again — pilots need a stable demo surface. | Partial | **Opus** |
| 2 | **G-REAL-07** — proof packets + `PROOF_PACKET_RUN_LOG` | Depends on #1. | Partial | **Sonnet** |
| 3 | **M-39** — apply proof-packet checklist, ≥3 G4 rows | Depends on #2. | Partial | **Sonnet** |
| 4 | **M-07** — polished operator screenshots | Blocked by Gate 5 FAIL (7 typecheck errors) and production build FAIL. | Partial | **Composer** |
| 5 | **M-09** — landing owner sign-off + deploy | Gated on #4. | Partial | **Sonnet** |
| 6 | **M-16** — demo video | Depends on #4; run **G-REAL-09** before recording. | Partial | **Sonnet** |
| 7 | **Branch protection on push corset jobs** | Corset exists but does not block pushes until required status checks include gitleaks + dotnet push corset + UI typecheck. Owner declined mandatory PRs; this is the alternative. | No — policy | **Owner** |

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 75.26% (capped by Gate 5 FAIL)**

**Capped.** Gate 5 **FAIL**: `tsconfig.build.json` reports **7** errors. Weighted average below is computed independently; a ship-gate FAIL overrides it as a V1 ship decision.

**The cap's character shifted again.** v4 failed on refactor-campaign churn in policy-packs and risk-exceptions. Those are **fixed and verified green** in the push corset slice. The current seven errors come from **new** concurrent splits: finding-inspect stickiness (`FindingInspectGovernanceStickinessPanel` → `FindingInspectStickinessSummary` + `FindingInspectDispositionControls`) and SAML SP configuration (`SamlSpConfigurationForm` refactor). Same structural story as v4 — **no blocking pre-merge gate on the full matrix, direct pushes continue** — but the corset now catches a meaningful subset when it completes.

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`: SOC 2 CPA attestation, third-party pen-test publication, signed design partner, owner-output GTM assets/cohorts, public extension SDK, MCP absence in V1, third-party plugin marketplace, assistive-technology participant testing, and sales-engineer-led LLM onboarding.

---

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 66 | 13 | 8.58 | **442** |
| 2 | Differentiability / Defensibility vs Frontier AI | 81 | 13 | 10.53 | 247 |
| 3 | Governed Review Integrity | 86 | 13 | 11.18 | 182 |
| 4 | Correctness & Evidence Integrity | 78 | 12 | 9.36 | 264 |
| 5 | AI / Agent Readiness | 74 | 10 | 7.40 | 260 |
| 6 | Time-to-Value | 72 | 10 | 7.20 | **280** |
| 7 | Proof-of-ROI Readiness | 76 | 9 | 6.84 | 216 |
| 8 | Sponsor / Operator Comprehension | 75 | 8 | 6.00 | 200 |
| 9 | Runtime & First-Review Reliability | 71 | 7 | 4.97 | 203 |
| 10 | Adoption Friction | 84 | 5 | 4.20 | 80 |
| | **(A) Headline readiness** | | **100** | **75.26%** | |

**Ranked by weighted deficiency:** Insight Density (442) · Time-to-Value (280) · Correctness (264) · AI/Agent Readiness (260) · Differentiability (247) · Runtime (203) · Proof-of-ROI (216) · Comprehension (200) · Governed Review Integrity (182) · Adoption Friction (80).

**Note on movement from v4 (74.36%).** Correctness (+6), Differentiability (+3), Governed Review Integrity (+2), Runtime (+5), Comprehension (+1), Time-to-Value (+1) reflect **verified green push-corset tests** and the **shipped** trunk gate. Gate 5 remains FAIL and production build fails at typecheck, so Time-to-Value and Comprehension do not rise further. Insight Density unchanged — mechanism untouched.

---

## 3. Diagnostic Scores (non-headline)

**Decision Advantage Score: 65/100.** Up two points: declaration and governance SoD/prod-promotion property tests in the push corset now execute green, so the policy→finding chain has passing regression evidence for its clearest non-compliance instances. Still discounted because engine depth is checklist-shaped and `typed-engine-protected` discards density scores.

**Frontier-AI Survival Probability (12 months): 55–70%, moderate confidence.** Unchanged mechanism story from v4.

**30-Day Voluntary Usage Probability: 33–48%, low-moderate confidence.** Slight uptick: push corset proves Core/Decisioning correctness on trunk; production build no longer completes when typecheck is red.

**Sponsor Purchase Probability: 26–41%, low confidence.** Gate 5 FAIL and zero **G-REAL-06** pilots still dominate.

**Reconciliation with §2.** Headline (75.26%) above Decision Advantage (65) and purchase band (26–41%) — governed container ahead of verification discipline and market evidence.

---

## 4. V1 Ship Gate

| # | Gate | Verdict | Evidence | Fastest resolution |
|---|------|---------|----------|--------------------|
| 1 | First review completes create → execute → commit → manifest + ≥1 artifact | **UNKNOWN** | Not executed here. | Staging `ship-gate-evidence` with SQL API. |
| 2 | No hallucinated or uncited policy/evidence citations | **PASS (mechanism)** | Emission gate + citation integrity evaluator unchanged. | Upgrade after gate 1 live. |
| 3 | Sponsor summary / ROI coherent and not misleading | **PASS (mechanism)** | TB-603 Done; disposition-aware headline. | As above. |
| 4 | Export / package generation works | **PASS (mechanism)** | Suite=Core coverage exists; live ZIP not run here. | Optional staging probe. |
| 5 | Architect workspace does not break during first-review / demo path | **FAIL** | **7** `tsconfig.build.json` errors: `WhyDisabledCtaReason` ↔ `string` mismatch across finding-inspect stickiness split (`FindingInspectGovernanceStickinessPanel`, `FindingInspectStickinessSummary`) and SAML SP blocks (`SamlSpConfigurationForm`, `SamlSpMetadataLookupBlock`); `FindingInspectDispositionControls.tsx:547` calls `.finally()` on `void | Promise<void>`. `npm run build` fails at typecheck. **v4's four-file errors are fixed.** | Mechanical type alignment in the five files; keep corset green after fix. |
| 6 | Auth + tenant isolation on pilot path | **PASS (mechanism)** | ADR 0037, scope guard, ship-gate negative probes. | As gate 1. |

**Gate 5 FAIL caps the headline.** CodeQL SARIF remains unresolved on trunk; not a numbered ship-gate FAIL.

---

## 5. Sponsor Summary

**(A) Overall headline readiness — 75.26%, capped by Gate 5 FAIL.**

ArchLucid remains a governed architecture-review system with **39 deterministic engines**, tenant-filtered compliance, declaration gating, optional expectation extras, sealed manifests, and database-per-tenant isolation. This pass proved the **verification response works in part**: a `master` push corset now builds `ArchLucid.Active.slnf` and runs **1,137** fast-core tests on Core + Decisioning with **zero failures** — the same suites v4 reported as 16 failed and uncompilable in broader scope.

**The honest problem is churn velocity, not absence of gates.** **106 commits** landed on `master` in ~70 minutes during this pass. The push corset uses `cancel-in-progress: true`, so only the latest push matters — but fixes are superseded before branch protection can treat them as stable. v4's seven typecheck errors were repaired; **seven new ones** arrived from finding-inspect and SAML SP refactors before this pass finished measuring.

**Product mechanism unchanged:** bundled packs still `priorityFloor`-only for expectation extras; insight density still subtractive with `typed-engine-protected`; golden corpus still **8/39** engines; **G-REAL-06** still not started. **Improved:** declaration fail-open fixtures and governance workflow property tests are green in the corset slice; `ShouldEmitTheme` empty-rule-set documentation mismatch remains.

**(B) Procurement / market realism (weight 0 in `(A)`).** Same honest trust posture as v4 — self-assessment, templates, owner pen test — without CPA SOC 2 or third-party pen-test publication.

---

## 6. Deferred Scope Uncertainty

Same as v4: V1.1 webhooks/MCP/commerce un-hold; V2 CPA/pen-test programs and substrate shifts. Graph-RAG community summarization still deferred pending **G-REAL-06** signal.

---

## 7. Weighted Quality Assessment (detail)

### 7.1 Decision-Changing Insight Density — 66 · weight 13 · contribution 8.58 · deficiency 442

Unchanged from v4. `typed-engine-protected` still promotes every engine finding without using the computed score. No deep judgment engines added. Frontier corpus still synthetic.

**Classification:** V1 residual + validation. **Affects outcomes 1, 3, 5.**

### 7.2 Correctness & Evidence Integrity — 78 · weight 12 · contribution 9.36 · deficiency 264

**Up from 72.** Push corset: Core **818/0**, Decisioning **319/0** on `DOTNET_FAST_CORE_TEST_FILTER`. Declaration tests use `cost-opt-001` outside declaration prefix family; governance tests embed manifest via `CreateRunDetailWithManifest`. Gitleaks clean.

**Still deduct:** Gate 5 **7** typecheck errors (new files); production build FAIL; CodeQL runs cancelled/pending on trunk; full `ci.yml` matrix still PR-only so Api/Application failures outside corset are not re-measured this pass.

**Classification:** V1. **Affects outcomes 1, 2, 4.**

### 7.3 Time-to-Value — 72 · weight 10 · contribution 7.20 · deficiency 280

**Up one point.** Corset gives immediate signal on trunk for compile + core correctness. Production build no longer completes when typecheck is red (regression from v4's passing build). Gate 1 still UNKNOWN.

**Classification:** V1 residual + validation. **Affects outcomes 1, 3.**

### 7.4 Differentiability / Defensibility vs Frontier AI — 81 · weight 13 · contribution 10.53 · deficiency 247

**Up from 78.** Declaration and governance property tests in the corset slice are green — the moat's regression evidence executes. `ShouldEmitTheme` empty-set fail-closed vs documented fail-open remains. Bundled packs still lack default expectation extras.

**Classification:** V1 mechanism; content residual. **Affects outcomes 1, 2, 5.**

### 7.5 AI / Agent Readiness — 74 · weight 10 · contribution 7.40 · deficiency 260

Unchanged. Simulator default; judge flags default false; eval corpus synthetic; no live pilot signal.

**Classification:** V1 mechanism complete; validation required. **Affects outcomes 1, 5.**

### 7.6 Runtime & First-Review Reliability — 71 · weight 7 · contribution 4.97 · deficiency 203

**Up from 66.** Push corset shipped with dotnet + typecheck jobs. Gitleaks green. **Still:** CodeQL latest-wins (5/6 recent runs cancelled); corset runs themselves cancelled when superseded; one workflow failure from dependabot `typescript@7` vs `openapi-typescript@^5.x` peer conflict on `npm ci` ([33030009906](https://github.com/joefrancisGA/ArchLucid/actions/runs/33030009906)).

**Classification:** V1. **Affects outcomes 2, 3.**

### 7.7 Proof-of-ROI Readiness — 76 · weight 9 · contribution 6.84 · deficiency 216

Unchanged. Mechanism complete; zero real pilot deltas.

**Classification:** V1 residual + validation. **Affects outcomes 3, 4.**

### 7.8 Governed Review Integrity — 86 · weight 13 · contribution 11.18 · deficiency 182

**Up from 84.** Governance workflow segregation/promotion property tests and dry-run submission tests pass with embedded manifests. Golden harness still 8/39 without `IEffectiveGovernanceLoader` injection.

**Classification:** V1. **Affects outcomes 2, 4, 5.**

### 7.9 Sponsor / Operator Comprehension — 75 · weight 8 · contribution 6.00 · deficiency 200

**Up one point.** v4 help-resolver repair holds. New regressions concentrate in finding-inspect stickiness UX split — sponsor-facing finding disposition surface — not administration help.

**Classification:** V1. **Affects outcomes 2, 4.**

### 7.10 Adoption Friction — 84 · weight 5 · contribution 4.20 · deficiency 80

Held. Corset helps developers on trunk; `npm run typecheck` still red on fresh clone until Gate 5 fixed.

**Classification:** V1 residual. **Affects outcomes 2, 3.**

---

## 8. Top 10 Weaknesses

1. **Trunk churn outruns fix-and-verify cycles.** **106 commits** in ~70 minutes; push corset and CodeQL use latest-wins cancellation. Owner declined mandatory PRs; corset shipped but branch protection not yet wired. Process uncertainty.
2. **Gate 5 FAIL — new seven errors after fixing the old seven.** Finding-inspect stickiness split and SAML SP refactor landed `WhyDisabledCtaReason` ↔ `string` mismatches and a `.finally()` on `void | Promise<void>`. Design/process uncertainty. **V1 ship-gate FAIL.**
3. **Insight density still subtractive.** Unchanged architectural ceiling. Design uncertainty.
4. **Zero completed real-mode pilots (G-REAL-06).** Market uncertainty.
5. **Production build fails when typecheck fails.** v4 could build 195 pages; this pass `npm run build` stops at typecheck. Process uncertainty.
6. **`ShouldEmitTheme` fail-closed on empty rule set vs documented fail-open.** Design uncertainty — owner decision.
7. **CodeQL still does not converge on trunk.** 5/6 recent runs cancelled; suppressions from v4 unconfirmed this pass. Process uncertainty.
8. **Bundled packs lack expectation extras by default.** Design/content uncertainty.
9. **Golden corpus 8/39 without governance loader injection.** Design uncertainty.
10. **Actor-dependent engines silent on IaC-only reviews; dual finding model persists.** Design uncertainty.

---

## 9. Frontier-AI Analysis

Same commodity/durable table as v4 with updates: **Declaration signal gating** and **Approval workflow with SoD** move from "unproven (red tests)" to **"durable-ish, corset-proven"** for the Decisioning fast-core slice — not full matrix.

**Final verdict:** Container bet strengthened on **regression evidence**; analytical floor and pilot proof still lag. Invest in keeping the corset green and **G-REAL-06**, not more coverage engines.

---

## 10. Policy-Aware Governance Test

1. **Do policy packs drive behavior?** **Yes, for three kinds** — now with **green corset tests** for declaration gating and governance SoD/promotion guards. Empty rule set still fail-closed silently for declaration engines.
2.–7. Same as v4 with corset evidence upgrade on #1 and #5.

---

## 11. Principal Architect Dismissal Test

Same positioning as v4. Fourth dismissal trigger (admin help crash) remains fixed. **New friction:** finding-inspect stickiness split is type-red on trunk — if deployed from a broken build, disposition controls may not ship.

---

## 12. Founder Delusion Check

**Shift from v4:** building the corset was the right move and it **works**. **New delusion to name:** treating corset green on Core/Decisioning as "trunk is green" while churn immediately lands seven fresh typecheck errors in adjacent surfaces. **Six-month freeze prescription:** keep corset + branch protection; fix Gate 5; **G-REAL-06**; stop splitting large TSX modules without running `npm run typecheck` before push.

---

## 13. Competitive Reality Check & Moat Assessment

Moat regression evidence **improved** in the corset slice. Weakest link moves from "tests red" to "trunk churn breaks surfaces faster than corset completes." Buyer-obvious demo still §10.7 policy toggle.

---

## 14. Adoption & Monetization

Blocker #1 updates: corset exists; **branch protection not yet applied**; Gate 5 red again. Blocker #5 (screenshots) still blocked by Gate 5.

---

## 15. Most Important Truth

**The corset is real and green for Core/Decisioning; the trunk is still not a stable demo surface.**

v4 revealed broken guards. This pass shipped a response: **1,137 fast-core tests pass** on the push path, declaration and governance suites substantiate the differentiating claims, and gitleaks is clean. In the same window, **churn replaced every Gate 5 error v4 named with seven new ones**, production build stopped completing, and CodeQL still did not conclude. The product story is organizational repeatability — but repeatability requires a trunk that stays green **after** the corset runs, not only **during** it.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

## 16. Stop Doing List

**Top 3 not worth doing before V1:** more policy-pack rules without expectation extras; Graph-RAG community summarization; synthetic eval expansion.

**Top 3 diminishing returns:** UI route polish across open backlog rows; coverage-shaped engines; compliance rule count expansion.

**Top 3 founder behaviors:** scoring assessments while trunk churn continues unprotected; large TSX splits without typecheck before push; claiming trunk green from corset slice alone.

**Top 3 enterprise-important but not V1-adoption:** MCP; CloudEvents webhooks; multi-region active/active.

## 17. Top Improvement Opportunities

**Shipped since v4 — do not re-open:** extended `master` push corset (`run_push_corset_dotnet.sh` + workflow job); v4's seven typecheck fixes (policy-packs, risk-exceptions, provenance, ROI help import, diagram variant); declaration `cost-opt-001` fixtures; governance `CreateRunDetailWithManifest`; help resolver + guard repairs; gitleaks allowlists; CodeQL concurrency fix for in-progress runs.

### Tier 1 — Must Fix / Must Validate

**1. Fix the seven `tsconfig.build.json` errors (Gate 5).**
Tier 1 · **Affected qualities:** Correctness (78), Time-to-Value (72), Comprehension (75). · **Evidence:** this pass `tsc` output. · **Classification: V1.**

> **Cursor prompt.** **Current problem:** seven errors in finding-inspect stickiness split (`WhyDisabledCtaReason` vs `string` props between `FindingInspectGovernanceStickinessPanel`, `FindingInspectStickinessSummary`, `FindingInspectDispositionControls`) and SAML SP refactor (`SamlSpConfigurationForm`, `SamlSpMetadataLookupBlock`); `.finally()` on `void | Promise<void>` at `FindingInspectDispositionControls.tsx:547`. **Desired behavior:** `npx tsc --noEmit -p tsconfig.build.json` exit 0; `npm run build` completes. **Scope:** align prop types with `WhyDisabledCtaReason` at boundaries; wrap async handler before `.finally()`. **Non-goals:** redesign stickiness UX.

**2. Add push corset jobs to branch protection required checks.**
Tier 1 · Owner declined mandatory PRs; this is the blocking alternative. · **Jobs:** `Security: gitleaks (secret scan)`, `.NET: push corset (build + fast core Core/Decisioning)`, `Operator UI: typecheck (blocking)`. · **Classification: V1 (process).**

**3. Execute G-REAL-06 / G-REAL-07 / M-39.**
Tier 1 · validation first · **Classification: validation.**

**4. Confirm CodeQL SARIF green after v4 suppression anchors.**
Tier 1 · verification only unless still red. · **Classification: V1.**

**5. Resolve dependabot `typescript@7` / `openapi-typescript@^5` peer conflict on clean `npm ci`.**
Tier 1 · blocks push typecheck job on some merges. · **Evidence:** run [33030009906](https://github.com/joefrancisGA/ArchLucid/actions/runs/33030009906). · **Classification: V1.**

### Tier 2 — High Leverage

**6.** Triage pre-existing help Vitest failures (baseline from v4). **7.** Policy-toggle demo artifact. **8.** Seed overlay `advisoryDefaults`. **9.** Extend golden harness past 8 engines + inject loader. **10.** M-07 screenshots after item 1.

### Tier 3 — Hold

**11–13.** Same holds as v4 (deep engine category, frontier transcripts, density-on-engines owner decision).

## 18. Prompt Batching Guidance

**First batch — Sonnet:** item 1 (seven typecheck errors) + item 5 (npm peer conflict if needed).

**Second batch — owner then Sonnet:** item 2 (branch protection).

**Third batch — owner + Opus:** item 3 (G-REAL-06).

**Fourth batch — verification:** item 4 (CodeQL).

## 19. Model Usage Guidance

Same as v4 with emphasis: stickiness/SAML type fixes are Sonnet-safe; do not batch with `ShouldEmitTheme` behavior change.

## 20. Pending Questions For Later

**Blocks V1:** items 1, 2 (branch protection), 4, 5; **G-REAL-06**; **G-COMMERCE-01**.

**Requires founder decision:** (a) organizational repeatability positioning; (b) `typed-engine-protected`; (c) finding stream of record; (d) overlay seeding; (e) `ShouldEmitTheme` empty-set behavior; (f) **resolved:** mandatory PRs declined — branch protection on push corset is the chosen path.

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

v5 is the pass where the repo **answered** v4's process prescription instead of only documenting it. A push corset that runs a thousand tests is unglamorous engineering — exactly the sort of thing that should have existed before the assessment cycle that discovered 16 red fast-core tests. The corset passing is not a victory lap; it is a **baseline**. What v5 also shows is that a baseline without branch protection is only a photograph of the latest push, and at **106 commits per hour** the photograph is always out of date.

The taste failure this pass names is **refactor without typecheck**. Splitting `FindingInspectGovernanceStickinessPanel` and `SamlSpConfigurationForm` without running `npm run typecheck` before push is the same class of error as v4's missing `Input` import — but now it happens *after* the team agreed trunk stability matters. The remedy is unchanged: make the corset block, and treat a red typecheck on `master` as an incident, not weather.

---
