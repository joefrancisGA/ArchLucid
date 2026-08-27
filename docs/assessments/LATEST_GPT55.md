# ArchLucid Strategic Release and Market Readiness Assessment (v4)

**Pass date:** 2026-08-27 (00:00–00:30 UTC). **Computed fresh** — no carry-forward, no score deltas, no rescore ratchet. The prior same-night pass is archived at [`../archive/assessments/LATEST_GPT55-2026-08-26-v3-superseded.md`](../archive/assessments/LATEST_GPT55-2026-08-26-v3-superseded.md) and is **not** canonical.

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Claude Opus 5, simulator-aware; **no live Azure OpenAI call was made during this pass**, so all agent-path judgments are about mechanism and default configuration, not observed real-mode output.

**What is different about this pass.** The v3 pass reported a *compile* blocker and largely dark automation. This pass repaired the trunk automation and then measured what the restored gates actually report. The result is uncomfortable in a useful way: **more defects are visible than in v3, because for the first time in this sequence the gates run to completion.** Several v3 scores were generous precisely because nothing could observe the code.

**Source materials inspected this pass:** direct code reads of `DeterministicInsightDensityGate`, `BuiltInFindingEngineTypeCatalog`, `GoldenCorpusHarness.CreateEngines()`, `DeclarationSecurityBaselineFindingEngine`, `DeclarationSignalPolicyGate`, `DeclarationSignalPolicyKeyMap`, `resolve-continue-last-alert-rule.ts`, `help-topic-view-resolver.tsx` / `-operate` / `-integrations` / `-admin`, `help-topic-catch-all-fallthrough.ts`, `help-topic-page-dispatch-inventory.ts`, `SqlConnectionString*`, `RunProvenanceQueryService`, `ClosedLoopArchitectureReasoningOrchestrator.LiveReview`, `.gitleaks.toml`, `ci.yml` / `codeql.yml` / `ui-typecheck-on-push.yml`, `CODEQL_TRIAGE.md`, `assert_codeql_sarif_clean.py`, `check_assessment_score_consistency.py`.

## Executed this pass (runtime evidence, not doc claims)

| # | Command / observation | Result |
|---|---|---|
| 1 | `dotnet build ArchLucid.Active.slnf` | **PASS** — 0 errors, 0 warnings |
| 2 | `npx tsc --noEmit -p tsconfig.build.json` (Gate 5) | **FAIL** — **7** errors in **4** files, none of them the v3 blocker |
| 3 | `npm run build` (Next 16.3 production) | **PASS** after the help-resolver repair; **195** static pages; `/help/preferences` emits `help-preferences-guide` |
| 4 | `dotnet test` fast-core filter, 4 projects | **4145 passed / 16 failed** |
| 5 | `gitleaks 8.30.1 detect --source .` with repo config | **PASS** (exit 0) after two allowlist repairs; was **5** findings |
| 6 | `ui-typecheck-on-push.yml` on `master` | gitleaks **success** → blocking typecheck **runs** (run [33026206365](https://github.com/joefrancisGA/ArchLucid/actions/runs/33026206365)); was gitleaks **failure** → typecheck **skipped** |
| 7 | `codeql.yml` on `master` | now reaches a **conclusion** (run [33024730786](https://github.com/joefrancisGA/ArchLucid/actions/runs/33024730786)); three prior runs were killed mid-analysis. **Partial fix:** *pending* runs for intermediate commits are still superseded |
| 8 | CodeQL C# SARIF gate | **FAIL** — **4** unresolved findings; suppressions were anchored on the wrong lines |

**Verified counts by direct inspection this pass:** **39** engines in `BuiltInFindingEngineTypeCatalog`; **8** engines in `GoldenCorpusHarness.CreateEngines()` (was 6 — declaration security-baseline and premise-conflict were added); `typed-engine-protected` bypass present and unchanged at `DeterministicInsightDensityGate.cs:85`.

**Fixed and pushed to `master` during this pass** (so the scores below already assume them): help resolver chain (`f1348dd873`), CodeQL concurrency starvation (`a688837fa2`), gitleaks false positives (`855652db04`), CodeQL suppression anchoring (`1b23787e22`).

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows. Excludes GTM V1.1 items **#2/#3/#5/#6** (**M-90**/**M-44**/**M-91**/**M-92**) per standing exclusion rule. Owner assurance programs **G-REAL-05** / **G-ASSURANCE-02** appear here only because they are human-executed; they do **not** reduce `(A)`.

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|-----------------|--------------------|--------------------|
| 1 | **G-REAL-06** — three real-mode pilot runs | Now the single largest deficiency driver. Insight-density, 30-day usage, and purchase-probability numbers stay low-confidence until this runs. The UI production build finally completes, so there is no longer a technical excuse. | Partial — agent can prepare scenarios and capture packets; owner must supply real architecture and judgment | **Opus** — pilot design and finding-quality interpretation change the conclusion |
| 2 | **G-REAL-07** — proof packets + `PROOF_PACKET_RUN_LOG` | Depends on #1. Converts pilot runs into reusable buyer evidence. | Partial | **Sonnet** |
| 3 | **M-39** — apply proof-packet checklist, ≥3 G4 rows | Depends on #2. Stage 1 selling gate. | Partial | **Sonnet** |
| 4 | **M-07** — polished operator screenshots | Blocks **M-16** and remaining **M-09**. **No longer blocked by a build crash** — the production build completes; it is blocked only by the 7 remaining typecheck errors. | Partial — agent can drive the capture harness | **Composer** — high-volume mechanical capture |
| 5 | **M-09** — landing owner sign-off + deploy | Gated on #4. No inbound motion without it. | Partial | **Sonnet** |
| 6 | **M-16** — demo video | Depends on #4. **G-REAL-09** should run before recording. | Partial | **Sonnet** |
| 7 | **Owner decision on trunk policy** | New this pass. `master` takes direct pushes from many concurrent agents and `ci.yml` is `pull_request`-only, so nothing blocks a regression. This is a process decision, not a coding task. | No — policy choice | **Owner** |

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 74.36% (capped by Gate 5 FAIL)**

**Capped.** Gate 5 **FAIL**: `tsconfig.build.json` production typecheck reports 7 errors. The weighted average below is computed independently; a ship-gate FAIL overrides it as a V1 ship decision. Gates 2–4 and 6 pass on mechanism. Gate 1 remains **UNKNOWN** (no SQL-backed live first review in this environment).

**The cap has a different character than in v3.** In v3 a single truncated file made the workspace uncompilable and the production build impossible. That is repaired and verified: the Next production build completes and emits 195 static pages. The current 7 errors are **fresh regressions from concurrent trunk work**, landed in the ~40 minutes this pass was running. Gate 5 is no longer failing because of one bad edit; it is failing because **the trunk has no blocking pre-merge gate and regressions arrive faster than they are repaired**. That is a materially worse structural finding than a single syntax error, even though it is a smaller code fix.

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`: SOC 2 CPA attestation, third-party pen-test publication, signed design partner, owner-output GTM assets/cohorts, public extension SDK, MCP absence in V1, third-party plugin marketplace, assistive-technology participant testing, and sales-engineer-led LLM onboarding.

---

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 66 | 13 | 8.58 | **442** |
| 2 | Differentiability / Defensibility vs Frontier AI | 78 | 13 | 10.14 | 286 |
| 3 | Governed Review Integrity | 84 | 13 | 10.92 | 208 |
| 4 | Correctness & Evidence Integrity | 72 | 12 | 8.64 | **336** |
| 5 | AI / Agent Readiness | 74 | 10 | 7.40 | 260 |
| 6 | Time-to-Value | 71 | 10 | 7.10 | **290** |
| 7 | Proof-of-ROI Readiness | 76 | 9 | 6.84 | 216 |
| 8 | Sponsor / Operator Comprehension | 74 | 8 | 5.92 | 208 |
| 9 | Runtime & First-Review Reliability | 66 | 7 | 4.62 | 238 |
| 10 | Adoption Friction | 84 | 5 | 4.20 | 80 |
| | **(A) Headline readiness** | | **100** | **74.36%** | |

**Ranked by weighted deficiency:** Insight Density (442) · Correctness (336) · Time-to-Value (290) · Differentiability (286) · AI/Agent Readiness (260) · Runtime (238) · Proof-of-ROI (216) · Governed Review Integrity (208) = Comprehension (208) · Adoption Friction (80).

**Note on the shape of this scorecard.** Insight Density remains the only top deficiency that is **architectural**, and it is unchanged: `typed-engine-protected` still discards every engine-finding density score, the frontier corpus is still synthetic, and no deep judgment engine exists. **Correctness has moved into second place, and that movement is information rather than decay.** Four .NET test projects that could not compile now compile, the shipping solution builds clean, and three trunk gates went from dark to reporting — and what they report is 7 typecheck errors, 16 fast-core test failures, and 4 unresolved CodeQL findings. v3 scored Correctness at 76 while the test projects were uncompilable; that number could not have been earned. Comprehension and Runtime rose on verified repairs (8 admin help pages restored from a hard build crash, alert-rules crash guarded, push gate live). Differentiability fell because the moat's **own** unit tests are red.

---

## 3. Diagnostic Scores (non-headline)

These do **not** feed the headline.

**Decision Advantage Score: 63/100.** Likelihood ArchLucid changes a decision frontier AI alone would not. Credit for policy-filtered compliance evaluation, declaration-security / premise-conflict gating on mapped keys and prefix families, graph-stamped coverage extras when `advisoryDefaults` are set, cost require-cap / breach-severity overrides, open-commitment findings from governance history, and Bicep/Kubernetes declaration properties feeding the same classifiers as Terraform. Discounted one point below v3 because the declaration engines — the clearest non-compliance instance of policy actually changing output — currently have **four failing unit tests**, so the mechanism's own evidence does not execute green. Engine depth is still predominantly graph-shape and checklist coverage rather than architectural judgment; dedicated engines for resilience posture, segmentation semantics, IAM depth, and observability still do not exist.

**Frontier-AI Survival Probability (12 months): 55–70%, moderate confidence.** Reference class: vertical governance/workflow wrappers around a commoditizing model layer. Base rate ~50–60%. Adjusted **upward** because the policy-pack→filter/stamp→finding→decision→audit chain is persistent tenant state across more than one engine family. Adjusted **downward** because generic-critique value is already commodity, default bundled packs still look like rule catalogs plus `priorityFloor`, and the deterministic floor is still checklist-height outside compliance, declaration, and optional coverage extras. Unchanged from v3: nothing in this pass altered the mechanism, only its verification.

**30-Day Voluntary Usage Probability: 32–47%, low-moderate confidence.** Reference class: enterprise architecture tooling adopted voluntarily by senior ICs — base rate 20–30%. Adjusted up slightly from v3 because the workspace now actually builds and eight administration help pages that previously crashed the build render correctly, so a curious architect who wanders off the first-review path is no longer guaranteed to hit a wall. Adjusted down because default host mode is Simulator, the LLM judge defaults off, and no live-pilot retention signal exists.

**Sponsor Purchase Probability: 25–40%, low confidence.** Reference class: net-new governance tooling purchased on a pilot, no reference customer, sales-led motion — base rate 20–35%. Held down by zero completed real-mode pilots (**G-REAL-06** not started) and by a present Gate 5 FAIL. Confidence is low specifically because owner pilot work has not run. Unchanged from v3.

**Reconciliation with §2.** The headline (74.36%) sits above Decision Advantage (63) and the purchase band (25–40%). That tension is the product: the governance container is real, policy changes more of the review than a compliance-only reading implied, and the front door is intermittently red. A respectable weighted average with a mediocre decision-advantage score and a ship-gate FAIL is the profile of a product whose mechanism is ahead of both its verification discipline and its market evidence.

---

## 4. V1 Ship Gate

`ShipGateEvidenceRunner` maps 1:1 to these six gates. It requires a live API and a committed `runId`. This environment has no SQL-backed API, so live-execution gates are **UNKNOWN** rather than assumed PASS.

| # | Gate | Verdict | Evidence | Fastest resolution |
|---|------|---------|----------|--------------------|
| 1 | First review completes create → execute → commit → manifest + ≥1 artifact | **UNKNOWN** | Mechanism and tests exist. Not executed here. | Run `archlucid pilot ship-gate-evidence` against a SQL-backed staging API with a committed run. |
| 2 | No hallucinated or uncited policy/evidence citations | **PASS (mechanism)** | `AgentArchitectureFindingEmissionGate` strips decision-grade agent findings lacking both `PolicyRuleId` and `EvidenceRefs`; `CitationIntegrityEvaluator` scores a committed run. **Honest limit:** semantic hallucination audit remains manual. | Keep as PASS on mechanism; upgrade after gate 1 runs live. |
| 3 | Sponsor summary / ROI coherent and not misleading | **PASS (mechanism)** | Disposition-aware headline, `headlineSavingsScopeCode` labeling, board-pack delegates to the same service. **TB-603** is **Done**. | As above. |
| 4 | Export / package generation works (Markdown / DOCX / ZIP) | **PASS (mechanism)** | Export formatters and Suite=Core coverage exist. Live ZIP/DOCX against a committed run not executed here. | Optional: `ShipGateExportMatrixProbe` on staging. |
| 5 | Architect workspace does not break during first-review / demo path | **FAIL** | `tsc --noEmit -p tsconfig.build.json` reports **7** errors: `HelpRoiSummaryGuideView.tsx` imports a non-existent `ROI_SUMMARY_HELP_CLAIM_HEADING_ID`; `ArchitectureDiagramInsufficientState.tsx` ×2 passes a widened `string` to the `Button` variant union; `RiskExceptionsTable.tsx` ×3 references `RiskExceptionRecord` with no import; `use-risk-exceptions-client.ts` assigns `WhyDisabledCtaReason \| null` to a non-nullable. **The v3 blocker is repaired** — the production build completes and emits 195 pages. | Four small, independent fixes. Then keep them fixed: see §17 item 2 (trunk gate policy). |
| 6 | Auth + tenant isolation behave correctly on the pilot path | **PASS (mechanism)** | Database-per-tenant topology (ADR 0037), `ScopeResolutionGuardMiddleware`, tenant-isolation negative probes in the ship-gate runner. | As gate 1. |

**Gate 5 FAIL caps the headline.** The CodeQL SARIF failure is a **security-merge** problem on a workflow that now actually runs to completion on `master` push; it is not a numbered ship-gate FAIL.

---

## 5. Sponsor Summary

**(A) Overall headline readiness — 74.36%, capped by Gate 5 FAIL.**

ArchLucid is a governed architecture-review system whose **policy mechanism is broader than a single compliance engine**, whose **production build now completes end to end**, and whose **trunk accepts regressions faster than it repairs them**. An architect submits a structured request or uses guided intake; the system ingests documents and infrastructure declarations into a canonical graph; 39 deterministic finding engines run over that graph; the tenant's *own enabled* compliance rules evaluate against it; optional `advisoryDefaults` extras can be stamped onto the context snapshot so coverage and cost engines union pack expectations with heuristics; a sealed manifest with an authority chain is produced; exports, sponsor ROI rollups, and ITSM tickets package the result against an append-only audit trail with database-per-tenant isolation.

Governance is not decoration. `ComplianceRulePackGovernanceFilter` intersects the rule universe with the tenant's enabled keys and a priority floor; `TenantCuratedComplianceRulePackMerger` folds in tenant-authored rules; `PolicyFilteredGoldenCorpusTests` asserts two postures emit different compliance findings; `PolicyFilteredDeclarationGoldenCorpusTests` asserts SOC 2 vs CIS Azure change declaration-security findings; `PolicyExpectationCoverageGoldenCorpusTests` asserts a stamped `identity` extra changes topology-coverage missing categories. Approval workflow enforces separation of duties; the pre-finalize gate can block on severity; a dry-run surface shows what a policy change would do. Forty-five curated policy packs ship bundled. The merge-blocking golden harness now registers **8** engines rather than 6.

**The honest new problem is verification discipline, not mechanism.** Three separate trunk gates were silently non-functional before this pass, each for a mundane reason: one gitleaks false positive on a 40-hex git tree SHA in `docs/CHANGELOG.md` failed the secret scan on every `master` push, which caused the **blocking** UI typecheck job to report `skipped` rather than run; every CodeQL run on `master` was cancelled the instant the next push arrived, so the security scan never reached a verdict; and four .NET test projects did not compile, so the merge-blocking golden corpus, the citation-provenance suites, and the API contract tests asserted nothing. All three are repaired and pushed. What they now report is the real state: 7 typecheck errors, 16 fast-core test failures, and 4 unresolved CodeQL findings.

**The product weakness remains contents, not container** — with three caveats now. First, bundled pack JSON still does **not** set `expectation.topologyCategories.add` / `cost.requireBudgetCap`; assigning CIS Azure or SOC 2 as-shipped changes compliance and declaration gating, not coverage extras, unless a tenant overlay writes those keys. Second, the declaration engines that best demonstrate policy-driven behavior have **four red unit tests**: `DeclarationSecurityBaselineFindingEngineTests` builds its subject with a pack it calls "unmapped" containing `soc2-001`, but the PP-01 prefix-family expansion made `soc2-001` a *declaration-vocabulary* key, so the gate now narrows to mapped themes and emits nothing. The mechanism is behaving as redesigned; the test was left behind when the family expanded. Third, `DeclarationSignalPolicyGate.ShouldEmitTheme` returns `false` when the active rule set is **empty**, while the engine's own XML documentation promises fail-open — so a tenant with no compliance rules assigned gets **zero** declaration-security findings, silently.

Deterministic engines remain predominantly coverage and structure checks. There are no dedicated engines for resilience/DR, IAM depth, secrets/key lifecycle, network segmentation semantics beyond edge presence, observability, or capacity. `TrustBoundaryFindingEngine` and `PrivilegedAccessFindingEngine` need `Actor` nodes; those materialize from **request/intake** and knowledge-model stakeholders, **not** from IaC documents. Insight-density scoring still computes a number for every engine finding and then **promotes unconditionally** via `typed-engine-protected`.

**(B) Procurement / market realism (weight 0 in `(A)`).** Trust posture is honest: SOC 2 self-assessment plus roadmap, CAIQ/SIG/DPA templates, subprocessor register, owner-conducted penetration exercise, published Azure roles ArchLucid will never request, Tier 1 ingestion with no vendor access to a customer cloud. A CPA-issued SOC 2 report and a third-party pen-test summary do not exist — correctly out of `(A)`, still friction for hard-gate buyers. Honest talk-tracks (**M-196**/**M-197**) and the minimum pilot trust packet (**M-190**/**M-191**) are **Done** as content. Live buyer security review has not happened.

**Commercial picture.** Sales-led V1: pricing page, order-form template, TEST-mode trial. Live commerce un-hold is V1.1 owner-only. Compelling today: audit-ready packaging and repeatability a chat transcript cannot produce. Unproven: voluntary return and paid conversion. **G-COMMERCE-01** is not done, so a willing first buyer still has no clean invoice path.

**Enterprise picture.** Tenancy, RBAC, SCIM, SAML and OIDC, private endpoints, and audit coverage are at a credible enterprise bar. ITSM native-create defaults **on**; Jira/ServiceNow/Confluence OAuth is **Done** (**TB-600**). Hesitation will come from assurance paperwork, from the depth question in the first 20 minutes, and from a trunk whose typecheck is red at any given moment.

**Engineering picture.** The shipping solution builds with **0 errors and 0 warnings**, and the Next production build completes. Against that: `ci.yml` still runs only on `pull_request` and `workflow_dispatch`, while `master` receives direct pushes from many concurrent agents; the only push-time gate is the thin UI typecheck corset, which was skipped on every run until this pass; CodeQL's C# SARIF gate has 4 unresolved findings whose suppressions were anchored on enclosing methods instead of the reported alert lines; and 16 fast-core tests fail, including 5 governance workflow property tests and 4 declaration-engine tests.

**Frontier-AI picture.** ArchLucid gets *more* valuable as base models improve, because better models produce better findings that flow into the same policy mappings and audit structures at zero engineering cost — but only if the deterministic floor is deep enough that the product is not merely a wrapper around whichever model is current, and only if the trunk stays green long enough to demo.

---

## 6. Deferred Scope Uncertainty

**V1.1:** CloudEvents outbound webhooks and customer-operated recipe bridges; MCP read-only membrane; multi-region active/active; commerce un-hold. Deferral is safe for V1 — the V1 automation contract (REST, CLI, workspace, SCIM, CI decoration, first-party Jira/ServiceNow/Confluence/Slack/Teams) covers pilot needs.

**V2:** third-party pen-test program; SOC 2 CPA; automated tenant-erasure quarantine; Redis-as-default substrate; DTF / Container Apps Jobs. Safe for V1. Erasure has operator purge paths as the interim seam.

**Genuine uncertainty:** Graph-RAG community summarization stays deferred per ADR 0057 pending pilot signal. Do not build it before **G-REAL-06** says retrieval depth is the limiter.

---

## 7. Weighted Quality Assessment (detail)

Ordered by weighted deficiency signal.

### 7.1 Decision-Changing Insight Density — 66 · weight 13 · contribution 8.58 · deficiency 442

**Justification.** Unchanged from v3, and unchanged for a reason: nothing in this pass touched the mechanism. `docs/architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS.md` still states the pillar clause **"miss"** is not covered. Existing mechanisms penalize generic phrasing, prune weak Critic prose, and optionally LLM-judge — all **subtractive**. A filter raises precision, never density.

Verified this pass:

1. **The density gate still does not gate engine findings.** `DeterministicInsightDensityGate.Score` adds `typed-engine-protected` and returns `Promote` / `DecisionGradeFinding` whenever `IsAgentArchitectureFinding` is false (`DeterministicInsightDensityGate.cs:85`). The score is computed and discarded. All **39** engines take this path.
2. **Frontier baselines are still not frontier baselines.** `tests/eval-corpus/insight-density-frontier-delta/README.md` states they are **not** captured frontier-model transcripts.
3. **Golden harness coverage improved from 6 to 8 engines** — declaration security-baseline and premise-conflict are now registered. That is real but marginal against 39, and both engines currently have failing unit tests.
4. **Policy extras can add a missing-identity coverage finding** when stamped. That is still a coverage-shaped finding, not a judgment a skilled architect would miss.

Engine depth still compounds the pillar. Graph-pure engines are dominated by coverage/gap/traceability over graph shape. Absent: dedicated RPO/RTO, IAM depth, secrets/key lifecycle, segmentation *semantics*, observability, capacity. Actor-dependent engines fire from **intake**, not from IaC-only uploads.

**Credit.** Policy-filtered compliance; declaration gating; open-commitment; premise-conflict; optional coverage extras.

**Tradeoffs.** Typed-engine protection prevents a heuristic from suppressing deterministic output. It also means density is unmeasured where most findings originate.

**Recommendations.** Do not add more coverage-shaped engines. Repair the 4 declaration tests so the existing depth claim is at least green. Capture real frontier transcripts after a real architecture exists. Owner-decide whether engine findings should ever demote. One deep judgment engine only after **G-REAL-06** names the category.

**Classification:** V1 residual (measurement honesty) + market validation. **Affects outcomes 1, 3, 5.**

### 7.2 Correctness & Evidence Integrity — 72 · weight 12 · contribution 8.64 · deficiency 336

**Justification.** This score moved down from 76 while the underlying engineering moved **up**, because v3's 76 was assigned while four test projects could not compile. A number cannot be earned by suites that do not run.

Genuine improvements verified this pass:

- **The shipping solution builds clean** — `dotnet build ArchLucid.Active.slnf`, 0 errors, 0 warnings.
- **Four test projects compile again.** 46 compile errors are gone: FluentAssertions 8.10 renamed `BeGreaterOrEqualTo`/`BeLessOrEqualTo` (and the collection-count variants), and the governance workflow property tests were passing a `CancellationToken` into the new `reviewedByMailbox` parameter added to `ApproveAsync`/`RejectAsync`. Until this was fixed, the merge-blocking golden corpus, the citation-provenance suites, and the API contract tests asserted nothing.
- **The secret scan is honest.** `gitleaks 8.30.1 detect --source .` now exits 0 over full history, was 5 findings — a `k8s.privileged` property key, a 40-hex repository tree SHA in `docs/CHANGELOG.md` matching `sourcegraph-access-token`, and assessment prose matching `generic-api-key` on type names such as `FileComplianceRulePackProvider`.
- **CodeQL suppressions are anchored correctly and the rule is documented.** The prior pass annotated enclosing methods; a suppression only binds on the alert's own line or the line above, so the gate still reported all four findings. `CODEQL_TRIAGE.md` now records the placement rule.

Deductions, all newly *visible* rather than newly *introduced*:

- **7 typecheck errors** on `tsconfig.build.json` (Gate 5, §4).
- **16 fast-core test failures** across 4 projects (4145 passed): `ArchLucid.Core.Tests` 818/0; `ArchLucid.Application.Tests` 1962/1; `ArchLucid.Api.Tests` 1056/5 (`RateLimitResponseHeadersTests` ×2, `GovernanceStickinessControllerTests` invalid-cron, two digest-preferences controllers); `ArchLucid.Decisioning.Tests` 309/10 (5 governance workflow property tests, 4 declaration-engine tests, 1 promotion mismatch).
- **CodeQL C# SARIF gate FAIL** — 4 unresolved findings on the last completed run.
- **31 pre-existing Vitest failures** in the help test area, established as a baseline against a clean `origin/master` worktree rather than assumed.
- Citation probes still prove a citation *exists*, not that it supports the claim.

**Classification:** V1. **Affects outcomes 1, 2, 4.**

### 7.3 Time-to-Value — 71 · weight 10 · contribution 7.10 · deficiency 290

**Justification.** The designed pilot path is short: configure, start, create review, execute, finalize, review package. Guided intake, reference-architecture exemplars, sample/demo runs, and `stack doctor` reduce first-run friction.

Up one point from v3 on verified evidence: the **production build completes** (195 static pages) where v3 could not build at all, and eight administration help pages that previously aborted the build now render their real guide views. Remaining deductions: Gate 5 is red again from fresh regressions, so a deployed first screen is still not reliably defined; first-review live E2E was not run here (gate 1 UNKNOWN); extractor-based cost/inventory still needs customer credentials for Tier 2; Simulator default means the first "wow" may be canned.

**Classification:** V1 residual + validation. **Affects outcomes 1, 3.**

### 7.4 Differentiability / Defensibility vs Frontier AI — 78 · weight 13 · contribution 10.14 · deficiency 286

**Justification — rubric level: High on compliance; High-but-currently-unproven on declaration; High-but-opt-in on coverage/cost.**

Changing a policy pack changes which of 791+ rules evaluate (`PolicyFilteredGoldenCorpusTests`). Declaration-security and premise-conflict honor mapped keys and prefix families. Coverage resolvers UNION stamped extras. Cost engines honor require-cap and breach-severity stamps. Prompting cannot hold that chain.

**Down 4 points from v3, for two evidence reasons rather than a mechanism reason.**

First, the declaration engines are the cleanest demonstration that policy state changes engine output, and **four of their unit tests fail**. The cause is precise: `DeclarationSecurityBaselineFindingEngineTests` constructs the engine with `CreateUnmappedPack()` containing rule id `soc2-001` and expects a fail-open finding, but the PP-01 prefix-family expansion made `soc2-001` a declaration-vocabulary key — `TenantUsesDeclarationVocabulary` now returns true, so `ShouldEmitTheme` narrows to mapped themes and the `tf.public_network_access` signal is filtered out. The redesign is arguably correct; the test was not updated with it. Either way, PP-01 landed with red sibling tests, so the moat's own regression evidence does not execute.

Second, `DeclarationSignalPolicyGate.ShouldEmitTheme` returns `false` when `activeRuleIds.Count == 0`, while `DeclarationSecurityBaselineFindingEngine`'s XML documentation says signals are emitted "otherwise (fail-open)". A tenant with no compliance rules assigned therefore receives **no** declaration-security findings at all. Documented-versus-actual mismatches on a gating path are worse than either behavior chosen deliberately.

**The remaining deduction is otherwise default content, not missing mechanism.** Bundled pack JSON still sets `priorityFloor` only. Assigning SOC 2 or CIS Azure as-shipped gates compliance + declaration; it does **not** automatically stamp `identity` or `cost.requireBudgetCap` unless a tenant overlay writes those `advisoryDefaults` keys. Open-commitment, portfolio-recurrence, and `*-cross-run-diff` stay pack-independent by design. Inventory/orphaned engines stay pack-inert.

That is **not** "one engine of 39." It is also **not** "all 39 engines are policy-aware." Count of engines that *can* consume pack state when keys/stamps are present: compliance, two declaration engines, the coverage-family consumers of the three resolvers, and two cost engines — a minority of 39, concentrated where buyers argue about standards, gaps, and budget.

**Recommendations.** Repair the 4 declaration tests and decide the empty-rule-set behavior explicitly. Then the one-screen policy-toggle demo. Optionally seed FinOps / CIS overlays with documented `advisoryDefaults` examples.

**Classification:** V1 mechanism complete for three influence kinds; test-debt and content residual. **Affects outcomes 1, 2, 5.**

### 7.5 AI / Agent Readiness — 74 · weight 10 · contribution 7.40 · deficiency 260

**Justification.** Operationally mature and untouched this pass: real/simulator separation, Application-layer orchestration, `AgentResult` schema validation, `WarnOnly` / `PilotStrict` quality-gate modes, LLM budget reservation and monthly caps, prompt-cache prefix, per-snapshot judge ceilings, tenant overrides for judge and portfolio-recurrence.

Deductions: default host mode is Simulator; `EnableLlmJudge` and `EnableLlmJudgeForEngineFindings` **default false**; Graph-RAG bounded multi-hop with community summarization deferred; eval corpus is synthetic; nightly real-mode loop is not a live tripwire executed this pass.

**Recommendations.** Nothing new to build before pilots. The gap is evidence, not mechanism.

**Classification:** V1 mechanism complete; validation required. **Affects outcomes 1, 5.**

### 7.6 Runtime & First-Review Reliability — 66 · weight 7 · contribution 4.62 · deficiency 238

**Justification.** Health endpoints, correlation IDs, outbox/DLQ, idempotency, run-execute leases, budget cutoffs, Redis auto-selection, and `ShipGateEvidenceRunner` exist.

Up 4 points from v3 on verified repairs: the production build completes; the master-push gate actually executes rather than reporting `skipped`; CodeQL reaches a conclusion rather than being killed mid-analysis; and the alert-rules client crash is genuinely fixed — `resolveContinueLastAlertRule(rules: unknown)` now routes through `asNonemptyReadonlyArray<AlertRule>` and returns `null` for non-array input, so the v3 unguarded `.slice` is gone.

**The CodeQL fix is partial and worth stating precisely, because the residue points back at trunk velocity.** `cancel-in-progress: false` protects the *in-progress* run, so a scan now completes. It does not give per-commit coverage: GitHub cancels any *pending* run in the concurrency group when a newer one queues. Runs [33026790482](https://github.com/joefrancisGA/ArchLucid/actions/runs/33026790482) and [33026802032](https://github.com/joefrancisGA/ArchLucid/actions/runs/33026802032) each hold **zero jobs** and were cancelled at the exact second the next run was created (00:25:44 against a 00:25:43 creation; 00:28:38 against 00:28:36), confirming they never started. Effective behavior on this trunk is therefore *one scan at a time, latest-wins*, with intermediate commits unscanned. That is acceptable for a security scanner; it is not the same as scanning every commit, and no configuration change fixes it while pushes arrive every few minutes.

Remaining deductions: Gate 5 red from fresh regressions; CodeQL last-completed run **failure** on both language jobs; `ci.yml` full matrix is **not** a `master` push check; gate 1 live first-review UNKNOWN; 5 `RateLimit`/controller tests failing in `ArchLucid.Api.Tests`.

**Classification:** V1. **Affects outcomes 2, 3.**

### 7.7 Proof-of-ROI Readiness — 76 · weight 9 · contribution 6.84 · deficiency 216

**Justification.** Layered, honestly labeled ROI: latest-committed-run-per-system, `FindingId` dedup, tenant-rate/EA-discount math, disposition-aware headline, `headlineSavingsScopeCode`, 30-day value-report kept separate, board-pack identical by construction. **TB-603 is Done** — AWS/GCP structured retail-price lookups exist with heuristic fallback.

Deduction: zero real pilot deltas, so every savings figure is model- or fixture-derived. Unchanged from v3.

**Classification:** V1 residual + validation required. **Affects outcomes 3, 4.**

### 7.8 Governed Review Integrity — 84 · weight 13 · contribution 10.92 · deficiency 208

**Justification.** Policy→evidence→finding→decision→audit is materially complete and has **three** pack-influence kinds. Sealed golden manifests; authority replay; 398 typed audit event constants; SoD approvals; pre-finalize gate; policy dry-run; disposition trail feeding ROI and open-commitment; ITSM `FindingId` correlation. Orchestrator fail-open on governance loader exceptions is documented. The golden harness now registers **8** engines rather than 6.

Down one point from v3 despite the harness improvement, because governance correctness is now measurable and imperfect: **5 governance workflow property tests fail** in `ArchLucid.Decisioning.Tests` (activation deactivation, dry-run submission shape, and three prod-promotion approval-mismatch cases), plus a governance recurrence-schedule controller test in `ArchLucid.Api.Tests`. These are the suites that assert separation of duties and prod approval chains actually hold. They compile now; they do not pass.

Further deductions: `GoldenCorpusHarness.CreateEngines()` still constructs `FileComplianceRulePackProvider` and does not inject `IEffectiveGovernanceLoader`, so the merge-blocking harness path does not stamp extras. Dual finding model: sealed `FindingsSnapshot` vs `AgentResult.Findings` often leading buyer-facing exports.

**Classification:** V1. **Affects outcomes 2, 4, 5.**

### 7.9 Sponsor / Operator Comprehension — 74 · weight 8 · contribution 5.92 · deficiency 208

**Justification.** Design-system work is real: Carbon-derived tokens, `StatusTag`/`SeverityTag`, enterprise tables, in-app `/help/{topic}`, insight-density curation banner, buyer-label vocabulary.

Up 4 points from v3 on the largest verified user-visible repair of this pass. `tryResolveOperateHelpTopicView` — a `ReactElement | null` "try" resolver in a three-stage chain — owned a terminal catch-all that returned a bare markdown view and called the TB-1601 fail-closed assert. That made `tryResolveIntegrationsHelpTopicView` and `tryResolveAdminHelpTopicView` **unreachable**, so every administration help slug threw and the Next production build aborted at `/help/preferences`. The operate resolver now returns `null` for unhandled slugs and only `resolveHelpTopicView` owns the terminal assert. All eight administration help pages prerender, and `/help/preferences` renders `help-preferences-guide` rather than a fallback.

Two guard tests were also wrong and are corrected. The TB-1601 source guard asserted the *broken* shape — that the operate module must contain the assert followed by `markdown={loaded.markdown}` — so it would have blocked the fix. The TB-2238 slug-ladder guard read only `help-topic-view-resolver.tsx`, which has contained no slug branches since the #163 module split, so it matched nothing and could not have caught this; it now scans all three modules through a shared `HELP_TOPIC_VIEW_RESOLVER_MODULE_FILENAMES` constant.

Remaining deductions: **31 Vitest failures** in the help area on `master`, measured against a clean baseline worktree; dual finding counts (sealed snapshot vs agent stream) can still confuse a sponsor.

**Classification:** V1. **Affects outcomes 2, 4.**

### 7.10 Adoption Friction — 84 · weight 5 · contribution 4.20 · deficiency 80

**Justification.** Broad configuration surface: OIDC, SAML SP, API keys, SCIM, four RBAC roles, database-per-tenant, docker compose, Terraform including Entra/Key Vault, private endpoints/WAF, `Integrations:Itsm:NativeEnabled` default **true** (**TB-599** Done), Jira/ServiceNow/Confluence OAuth (**TB-600** Done), CLI `doctor` / `support-bundle`.

Held at 84 rather than raised: the production build now completes, which removes the v3 concern that local first-run was outright blocked, but 7 typecheck errors mean a developer running `npm run typecheck` on a fresh clone still sees a red tree. Tier 2 extractor still needs customer-provisioned credentials.

**Classification:** V1 residual. **Affects outcomes 2, 3.**

---

## 8. Top 10 Weaknesses

1. **The trunk has no blocking pre-merge gate.** `ci.yml` runs only on `pull_request` and `workflow_dispatch`, while `master` receives direct pushes from many concurrent agents — 65 commits arrived on `master` during this pass alone. The only push-time gate is a thin UI typecheck corset that was reporting `skipped` on every run. This is the **root cause** of weaknesses 2 and 5 rather than a peer of them: the v3 pass found one broken file, this pass found a different set, and the mechanism that lets both happen is unchanged. Process uncertainty. Fastest path: an owner policy decision — either require PRs on `master`, or promote a minimal build+typecheck+fast-core job to a `push` trigger.
2. **UI production typecheck FAIL (Gate 5).** 7 errors in 4 files, all landed by concurrent trunk work: a missing `ROI_SUMMARY_HELP_CLAIM_HEADING_ID` export, a widened `Button` variant, a missing `RiskExceptionRecord` import, a nullable `WhyDisabledCtaReason`. Design/process uncertainty. **This is a V1 ship-gate FAIL**, but a shallow one — four small independent fixes.
3. **Insight density is still subtractive.** The gate, pruner, and optional LLM judge discard generic output; nothing generates a finding a skilled architect would miss. `typed-engine-protected` still discards every engine score. Design uncertainty. **Not a V1 contract blocker**; it is the binding constraint on outcomes 1 and 5. Fastest path: stop adding coverage engines; run **G-REAL-06**; then one deep engine in the category the pilot actually argued about.
4. **Zero completed real-mode pilots (G-REAL-06).** Pure market uncertainty. Not a V1 engineering blocker; it is the blocker on every commercial diagnostic in §3. Fastest path: owner-executed three-run protocol.
5. **16 fast-core tests fail, concentrated where it matters most.** 5 governance workflow property tests assert separation of duties and prod approval chains; 4 declaration-engine tests assert the clearest instance of policy changing engine output. These compile for the first time in this sequence and do not pass. Design/process uncertainty. Fastest path: update the declaration tests for the PP-01 prefix-family semantics (their "unmapped" pack now uses a mapped key), then triage the governance properties.
6. **`ShouldEmitTheme` fail-closed on an empty rule set contradicts its own documentation.** A tenant with no compliance rules assigned receives zero declaration-security findings, while the engine's XML doc promises fail-open. Design uncertainty. Fastest path: an explicit owner decision, then make code and doc agree.
7. **CodeQL C# SARIF gate is red, and its trunk coverage is latest-wins.** 4 unresolved findings — 2 × `cs/insecure-sql-connection` on `SqlConnectionStringBuilder` construction, 2 × `cs/user-controlled-bypass` on a pagination guard and a publish-request flag. All four are defensible false positives; the suppressions were simply anchored on enclosing methods instead of the reported lines. Re-anchored this pass, pending CI confirmation. Separately, scans now complete but *pending* runs for intermediate commits are still superseded (§7.6), so a given commit may never be scanned. Process uncertainty.
8. **Bundled packs do not encode expectation extras.** Mechanism exists; default content still `priorityFloor` only. Design uncertainty. Fastest path: one overlay example plus the policy-toggle demo.
9. **Golden corpus covers 8 of 39 engines.** Better than v3's 6, still a small minority, and the merge-blocking path does not inject `IEffectiveGovernanceLoader`. Design uncertainty. Fastest path: continue adding engines incrementally; do not expand rule count.
10. **Actor-dependent engines stay silent on IaC-only reviews, and the dual finding model persists.** `RequestActorMaterializer` covers guided intake; Bicep/Helm dumps do not create `Actor` nodes. Simulator default plus judge-off means the impressive stream is canned. Design uncertainty. Fastest path: document the intake requirement in first-review UX; founder decision on the stream of record.

---

## 9. Frontier-AI Analysis

### Commodity vs Durable

| Capability | 12-month outlook | Reason / evidence |
|---|---|---|
| Generic architecture critique prose | **Commodity now** | Any frontier model produces comparable output from a good prompt |
| Graph coverage / structure checks | **Commodity within 12 months** | Shape checks, not judgment — even when a pack adds an extra expected category |
| Declaration property extraction | **Commodity** | Models parse Terraform/ARM/Bicep well; ArchLucid's parsers feed classifiers (packaging) |
| **Tenant-specific enabled rule set** | **Durable** | Persistent, versioned, per-scope state |
| **Declaration signal gating from that rule set** | **Durable-ish, currently unproven** | Same persistent state consumed by two more engines — whose unit tests are red |
| **Expectation extras in `advisoryDefaults`** | **Durable if used** | Mechanism is product state; unused keys are decoration |
| **Sealed manifest + authority chain + replay** | **Durable** | Infrastructure, not inference |
| **Append-only typed audit reconstruction** | **Durable, more valuable over time** | Compounds with history |
| **Cross-run / portfolio state** | **Durable** | Open-commitment, portfolio recurrence, cross-run diff — pack-independent on purpose |
| **Approval workflow with SoD** | **Durable, currently unproven** | Organizational process — with 5 failing property tests |
| ROI disposition-aware basis | **Durable-ish** | Math is simple; disposition state is product state |
| Retrieval depth (Graph-RAG) | **Commodity within 12 months** | Long-context erodes bounded multi-hop |

### What resists prompting

Persistent policy state, evidence→finding→policy→decision→audit traceability, repeatability across architects, sponsor/operator role separation, disposition lifecycle, ITSM correlation. **Does not resist prompting:** analytical content of most current findings.

### Leverage / upside — the first-class bet

Every base-model improvement flows through unchanged plumbing: better agent findings → same policy packs → same sealed manifests → same audit trail → same ROI partitioning, at ~zero ArchLucid engineering cost. The bet only pays if the deterministic floor is high enough that customers do not conclude the wrapper is all there is.

### Displacement timeline

One model release away: generic critique, retrieval depth, declaration parsing, structural coverage. Multiple releases / never from model progress alone: policy state, audit reconstruction, approval workflow, disposition lifecycle, portfolio history.

Survival probability is in §3.

### Final verdict

**Not yet faster than frontier AI.** The container is the bet, and this pass proved the container can now be built and served — the production build completes and the help surfaces render. What it also proved is that the two suites which most directly substantiate the container's differentiating claims, governance approvals and declaration gating, do not currently pass. Invest in the *deterministic* floor and **real pilots**, and in a trunk gate that keeps both green — not in more prompting or more coverage engines.

---

## 10. Policy-Aware Governance Test

1. **Do policy packs drive behavior?** **Yes, for three kinds.** Rule-set selection (`compliance`). Signal gating (`declaration-security-baseline`, `declaration-premise-conflict`). Expectation parameterization / cost thresholds **when** `advisoryDefaults` extras are present and stamped. Bundled defaults today drive the first two, not the third. For open-commitment, portfolio-recurrence, and cross-run diffs, packs are inert by design. **New caveat:** with an *empty* active rule set the declaration engines emit nothing at all, which is fail-closed and contradicts their documentation.
2. **Can each major finding trace the chain?** Engine/compliance: yes when `EvidenceRefs` / `PolicyRuleId` / disposition / audit are populated. Agent: only those surviving the emission gate.
3. **Would a skilled architect reproduce this without ArchLucid?** No for the governed package, repeatability, and audit reconstruction. Largely yes for analytical content.
4. **AI-generated vs governed infrastructure?** AI: agent findings, cost narratives, comparison explanations. Governed: policy filtering, graph stamp, sealed manifests, replay, audit, approvals, disposition, ITSM correlation.
5. **What would prove the moat?** Two tenants, identical architecture, different packs **including an overlay extra**, materially different findings/severities/gate/sponsor totals — captured as an artifact. Mechanism exists; buyer-facing artifact does not; and the sibling unit tests are red.
6. **Fastest validation?** In **G-REAL-06**, run one architecture twice under two governance postures (and once with an expectation overlay).
7. **Demo that makes the moat obvious?** Toggle one pack; show findings, severity, pre-finalize verdict, and audit entry change on one screen. Optionally show an overlay that adds Identity to missing categories.

---

## 11. Principal Architect Dismissal Test

**"I need this":** sealed, replayable review record; disposition lifecycle; overdue-commitment and expiring-waiver findings; Jira/ServiceNow correlation; a pack change that actually changes the review.

**Voluntary return:** portfolio-level state — recurrence across systems, waivers expiring this quarter. Cross-run memory is the retention mechanism, not critique quality.

**Immediate dismissal:** recognizing every finding as already-known (still the most likely trigger, **45–60%** on a first IaC-only review). Second trigger: Simulator-labeled canned output presented as Real. Third: being told "policy packs drive the review" and then assigning SOC 2 without seeing coverage extras. Fourth — **reduced this pass** — wandering into an administration help page; those eight pages now render rather than 500-ing, and the alert-rules hub no longer throws on a non-array payload.

**Would they believe ArchLucid is materially better than "Claude + a good prompt + my company standards pasted in"?** **For a single review: still no.** **For the tenth review across the fifth system with a governance board asking for the audit trail: yes.** Position *organizational repeatability*, not per-review insight. The sponsor is the buyer; the architect is the gatekeeper.

---

## 12. Founder Delusion Check

**Strongest assumption with weakest evidence:** that decision-changing insight density is a measurement and curation problem. Everything built for it measures or subtracts. The "miss" clause is unaddressed.

**Looks differentiated, already commodity:** generic critique, structural coverage, declaration parsing, retrieval depth.

**Looks ordinary, may be the strongest moat:** the disposition trail. Unglamorous bookkeeping that makes open-commitment, honest ROI, and the tenth review possible.

**Could burn months without improving the five outcomes:** more curated policy-pack *rules* without encoding expectation extras; more UI route polish across 200+ open rows; Graph-RAG community summarization; more synthetic eval corpus.

**If features froze for six months:** put a blocking gate on `master`; get the 16 failing tests and 7 typecheck errors to zero and keep them there; run three real pilots; rewrite positioning around organizational repeatability.

**Most dangerous attractive distraction:** going from 39 to 60 coverage-style engines, or treating unused `advisoryDefaults` keys as if every bundled pack already parameterized coverage.

**Most boring real moat:** audit catalog + disposition trail.

**This pass's correction — and it is a sharp one.** The v3 pass treated the compile break as an incident: one truncated file, one fix, move on. That framing was wrong, and this pass is the proof. The file was repaired and within the same session a *different* set of 7 typecheck errors landed on `master` from concurrent work. The real defect is not any individual broken file; it is that **`ci.yml` does not run on `push` and `master` is pushed to directly**, so the trunk's quality is whatever the last agent happened to leave. Worse, this pass found three separate *guard* mechanisms that were themselves broken — a gitleaks false positive skipping a blocking job, CodeQL cancelled before it could conclude, a TB-1601 source guard asserting the broken shape, and a TB-2238 slug guard matching nothing since a module split. **The guards were decorative.** Building more verification on top of unverified verification is the delusion to name this pass.

---

## 13. Competitive Reality Check & Moat Assessment

**What a skilled architect with frontier AI already does:** reads IaC, spots misconfigurations, critiques topology, produces a review document, cites standards from memory or paste.

**What ArchLucid does substantially faster/more consistently:** same *shaped* package every time; evaluates the organization's enabled rule set; can gate declaration findings and (with overlays) add coverage/cost expectations; preserves decisions/exceptions across reviews; reconstructs who decided what; correlates findings to tickets.

**Commodity within 12 months:** analytical content, retrieval depth, parsing.

**More valuable as AI improves:** every governance surface.

**Requires enterprise workflow:** SoD approvals, pre-finalize gating, audit reconstruction, disposition lifecycle, sponsor/operator separation.

**Requires customer-specific policy state:** enabled rule subset, priority floors, scope assignments, curated tenant rules, optional expectation extras.

**Current moat:** governed repeatability plus audit reconstruction, with a real (not decorative) policy filter on compliance and declaration. **Potential future moat:** portfolio-level architectural memory plus expectation extras actually shipped in bundled FinOps/CIS content. **Weakest moat assumption:** that unused advisory keys differentiate review *by default*. **New weakest link:** the moat's regression evidence is red — 4 declaration and 5 governance-approval tests fail. **Most durable:** audit reconstruction and disposition history cannot be prompted. **Probably illusory:** insight-density superiority over frontier models. **Boring but durable:** the audit catalog. **Buyer-obvious moat:** §10.7 policy-toggle demo.

---

## 14. Adoption & Monetization

**30-Day Voluntary Usage (10 principal architects).** Strongest positive: portfolio and commitment findings that accumulate. Strongest negative: first review still checklist-shaped. Improved this pass: the workspace builds and serves, and the two known crash surfaces (administration help, alert-rules continue-last) are fixed and verified. Most likely return reason: an expiring-waiver or recurrence finding that mattered. Most likely stop reason: recognizing every finding as already-known.

**Sponsor Purchase.** Strongest driver: audit-ready packaging that survives architecture, security, compliance, and board review. Strongest blocker: no completed pilot, no reference, and a trunk that is red at any given moment. Minimum proof: a blocking `master` gate → Gate 5 green and *staying* green → **G-REAL-06** → **G-REAL-07** → **M-39**. Likely objection: "our architects already use Claude."

**Why buy ArchLucid instead of more frontier-AI licenses?** Licenses give analysis; ArchLucid gives a *record*. More licenses do not give: which standards were evaluated on which system when; consistency across architects; exception/waiver lifecycle; audit reconstruction; ticket correlation; portfolio recurrence. The argument that ArchLucid finds things Claude cannot is **still not honest** as a blanket claim.

**Top 6 monetization blockers.** (1) No blocking trunk gate, so Gate 5 does not stay green — process. (2) No pilot proof — **G-REAL-06**; validation. (3) No case study/reference — **M-32**; validation. (4) Invoice/SOW incomplete — **G-COMMERCE-01**; owner. (5) Landing/demo assets not live — **M-07**/**M-09**/**M-16**; now unblocked by a working build. (6) Depth objection from the technical evaluator — engine depth + honest repositioning.

**Top 6 enterprise adoption blockers.** (1) Trunk quality variance — trust; pilot. (2) No pilot case study — trust; scale. (3) Connector/extractor credential setup — workflow fit; pilot. (4) Checklist-depth findings — buyer value; pilot. (5) Architects preferring their own tools — process; scale. (6) Procurement timing/assurance paperwork — trust; scale (`(B)`).

---

## 15. Most Important Truth

**The verification layer was decorative, and repairing it revealed that the mechanism ArchLucid sells is not currently backed by green evidence.**

Three trunk gates were dark — a gitleaks false positive on a git tree SHA skipped the blocking typecheck job, CodeQL was killed mid-analysis by every subsequent push, and four test projects did not compile. Two guard tests were worse than dark: the TB-1601 source guard asserted the broken shape and the TB-2238 slug guard had matched nothing since a module split. With all of that repaired, the honest state of `master` is 7 typecheck errors, 16 fast-core test failures, and 4 unresolved CodeQL findings — and the failures cluster precisely on the differentiating claims: 5 governance separation-of-duties and prod-approval property tests, and 4 declaration-gating tests.

What is current: 39 engines still mostly coverage-shaped; density scoring still discarded for every typed engine; golden corpus 8/39; bundled packs still `priorityFloor`-only for extras; **G-REAL-06** still unstarted; Gate 5 FAIL from fresh regressions rather than one old file. The honest position remains *organizational repeatability*, not superior insight — and the prerequisite for claiming even that is a trunk gate that keeps the evidence green.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

## 16. Stop Doing List

**Top 3 not worth doing before V1:** more curated policy-pack *rules* without encoding expectation extras; Graph-RAG community summarization (ADR 0057: wait for pilot signal); more synthetic eval-corpus scenarios.

**Top 3 diminishing-returns areas:** UI route polish across 200+ open backlog rows; additional coverage-shaped finding engines; expanding compliance rule count past 791.

**Top 3 founder behaviors that delay validation:** treating assessment scores as the progress metric instead of pilot outcomes; claiming all 39 engines are policy-aware; **adding new guard tests without checking that the existing ones can fail** — this pass found two that could not.

**Top 3 features that feel enterprise-important but may not improve V1 adoption:** MCP membrane; CloudEvents webhooks; multi-region active/active.

## 17. Top Improvement Opportunities

Gate 5 **FAIL** leads, but its *cause* leads before its symptom. Engineering items below are in-contract and verified-broken this pass.

**Shipped this pass — do not re-open:** help resolver chain repair and its two corrected guard tests; gitleaks allowlists for the `k8s.privileged` key, the `docs/CHANGELOG.md` tree SHA, and assessment narrative; CodeQL `cancel-in-progress: false` on `master`; CodeQL suppression re-anchoring plus the placement rule in `CODEQL_TRIAGE.md`; FluentAssertions 8 renames and the governance `reviewedByMailbox` call-site repair across 4 test projects.

**Shipped earlier — do not re-open:** declaration prefix-family gating (PP-01); expectation facet parser/stamp/resolver UNION and cost require-cap / breach-severity (PP-02–PP-05); Bicep body → `tf.*` bag; Kubernetes security spec projection; the three policy-filtered golden siblings; **TB-599**; **TB-600**; **TB-603**; **TB-882**; alert-rules array guard (WK-17); GTM **M-190**/**M-191**/**M-196**/**M-197**. Do **not** re-run ID-08–ID-10.

### Tier 1 — Must Fix / Must Validate

**1. Fix the 7 `tsconfig.build.json` errors.**
Tier 1 · **Why it matters:** Gate 5 FAIL. · **Expected impact:** Gate 5 returns to PASS on compile. · **Affected qualities:** Correctness (72), Time-to-Value (71), Adoption Friction (84). · **Evidence:** `npx tsc --noEmit -p tsconfig.build.json` this pass. · **Actionability:** high; four independent small fixes. · **Design uncertainty reduced: 8** · **Market uncertainty reduced: 1** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** `npx tsc --noEmit -p tsconfig.build.json` in `archlucid-ui` reports 7 errors: (a) `src/app/(operator)/help/_sections/HelpRoiSummaryGuideView.tsx` imports `ROI_SUMMARY_HELP_CLAIM_HEADING_ID` from `@/lib/roi-summary-help-guide-content`, which does not export it (`ROI_SUMMARY_HELP_GUIDE_HEADINGS` exists); (b) `src/components/architecture/ArchitectureDiagramInsufficientState.tsx` lines 32 and 39 pass a `string` to the `Button` `variant` union; (c) `src/components/governance/RiskExceptionsTable.tsx` lines 28/38/41 reference `RiskExceptionRecord` with no import; (d) `src/components/governance/use-risk-exceptions-client.ts` line 248 assigns `WhyDisabledCtaReason | null` to a non-nullable field. **Desired behavior:** typecheck exit 0. Prefer narrowing the type at the source (export the heading id if it is genuinely needed, type `clarifyArchitectureVariant` as the `Button` variant union, import `RiskExceptionRecord` from its declaring module, and make the target field nullable or guard the assignment) over `any`/`as` casts. **Scope boundaries:** do not redesign the risk-exceptions client or the diagram panel. **Acceptance criteria:** `npx tsc --noEmit -p tsconfig.build.json` exit 0; `npm run build` still completes. **Non-goals:** the 31 pre-existing help Vitest failures.

**2. Put a blocking build + typecheck + fast-core gate on `master` push.**
Tier 1 · **Why it matters:** the highest-leverage item in this assessment. `ci.yml` is `pull_request` + `workflow_dispatch` only; `master` takes direct pushes (65 arrived during this pass). Item 1 will be undone within hours without this. · **Expected impact:** Gate 5 stops regressing; §8 weaknesses 2 and 5 stop recurring. · **Affected qualities:** Correctness (72), Runtime (66), Time-to-Value (71). · **Evidence:** `ci.yml` `on:` block; `ui-typecheck-on-push.yml` was the only push gate and reported `skipped` on every run until this pass. · **Actionability:** high for the workflow; the branch-protection half is an owner decision. · **Design uncertainty reduced: 9** · **Market uncertainty reduced: 1** · **Classification: V1 (process).**

> **Cursor prompt.** **Current problem:** `.github/workflows/ci.yml` triggers on `pull_request` and `workflow_dispatch` only, so direct pushes to `master` get no build or test signal; `ui-typecheck-on-push.yml` is the only `push` workflow. **Desired behavior:** extend `ui-typecheck-on-push.yml` (or add one narrow workflow) so a `master` push runs, in this order: `dotnet build ArchLucid.Active.slnf`, the `DOTNET_FAST_CORE_TEST_FILTER` suite for `ArchLucid.Core.Tests` and `ArchLucid.Decisioning.Tests`, and `npx tsc --noEmit -p tsconfig.build.json`. Keep total wall time under ~15 minutes; keep `cancel-in-progress: true` for this gate since only the latest trunk state matters. **Scope boundaries:** do not move the full 59-job `ci.yml` matrix onto `push`. Do not change branch protection from a workflow — record in the PR body that the owner must add the new check names under required status checks for it to block. **Acceptance criteria:** a `master` push produces a run that fails when any of the three steps fails, and the job names are stable enough to reference in branch protection. **Non-goals:** Stryker, E2E, CodeQL retriggering.

**3. Repair the 16 fast-core test failures, declaration engines first.**
Tier 1 · **Why it matters:** these suites substantiate the differentiability and governed-integrity claims, and they compile for the first time in this sequence. · **Expected impact:** the moat's regression evidence executes green. · **Affected qualities:** Differentiability (78), Governed Review Integrity (84), Correctness (72). · **Evidence:** counts and names in §7.2. · **Actionability:** high for the declaration tests (cause identified); medium for the governance properties. · **Design uncertainty reduced: 8** · **Market uncertainty reduced: 2** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** `ArchLucid.Decisioning.Tests.Services.DeclarationSecurityBaselineFindingEngineTests` and `DeclarationPremiseConflictFindingEngineTests` (4 tests) fail with empty finding collections. Root cause: they construct the engine via `FixedComplianceRulePackProvider(CreateUnmappedPack())` whose only rule id is `soc2-001`, but the PP-01 `DeclarationSignalPolicyPrefixFamily` expansion made `soc2-001` a declaration-vocabulary key, so `DeclarationSignalPolicyKeyMap.TenantUsesDeclarationVocabulary` returns true and `DeclarationSignalPolicyGate.ShouldEmitTheme` narrows to mapped themes, filtering the `tf.public_network_access` signal. **Desired behavior:** decide per test whether the intent is fail-open (then use a rule id genuinely outside the declaration prefix family, and rename the helper so it is not called "unmapped" while using a mapped key) or gated (then assert the gated outcome and add a sibling that asserts the mapped-key case emits). **Scope boundaries:** do not weaken `ShouldEmitTheme`; do not change the prefix family. **Acceptance criteria:** all 4 tests pass and at least one asserts each side of the gate. **Separately:** report, do not fix, the fact that `ShouldEmitTheme` returns `false` for an empty `activeRuleIds` while `DeclarationSecurityBaselineFindingEngine`'s XML doc claims fail-open — that is an owner decision (§20). **Non-goals:** the 5 governance workflow property failures; handle them in a second pass.

**4. Execute three real-mode pilot runs (G-REAL-06) and collect packets (G-REAL-07 / M-39).**
Tier 1 · **Why it matters:** every commercial diagnostic in §3 is offline-derived. The build now completes, so the technical precondition is met. · **Expected impact:** replaces opinion with observed insight density, dismissal triggers, and ROI credibility. · **Affected qualities:** Insight Density (66), Time-to-Value (71), Proof-of-ROI (76), Decision Advantage (63). · **Evidence:** GTM rows Not started. · **Actionability:** owner-executed; agent-assistable for scripts. · **Design uncertainty reduced: 2** · **Market uncertainty reduced: 9** · **Classification: validation first.**

**5. Confirm the CodeQL SARIF gate is green after re-anchoring.**
Tier 1 · **Why it matters:** it is the only automated security signal that now reaches a verdict on `master` push. Four suppressions were re-anchored this pass but not yet confirmed by a completed run. · **Expected impact:** C# SARIF gate exit 0. · **Affected qualities:** Runtime (66), Correctness (72). · **Evidence:** run [33024730786](https://github.com/joefrancisGA/ArchLucid/actions/runs/33024730786) listed 4 unresolved findings; commit `1b23787e22` moved each comment onto the reported line. · **Actionability:** verification only, unless it is still red. · **Design uncertainty reduced: 6** · **Market uncertainty reduced: 1** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** after commit `1b23787e22` the four `// codeql[...]` suppressions sit on the lines the SARIF gate named, but no completed CodeQL run has confirmed it. **Desired behavior:** confirm `scripts/ci/assert_codeql_sarif_clean.py csharp-sarif` exits 0 on a completed `master` run. If any finding is still unresolved, read the new line number from the gate output — not from the enclosing method — and move that comment. **Scope boundaries:** prefer structural fixes; do not disable the gate; do not add blanket suppressions. Note that the JavaScript job fails at `Install and build UI`, which is item 1, not a CodeQL problem. **Acceptance criteria:** C# SARIF gate green on a completed run; `docs/library/CODEQL_TRIAGE.md` matches the final anchors. **Non-goals:** reopening TB-135/TB-136.

### Tier 2 — High Leverage

**6. Triage the 31 pre-existing help Vitest failures.**
Tier 2 · **Why it matters:** the help area is the surface a wandering architect hits, and a third of its suite is red. Baseline established against a clean `origin/master` worktree, so these are not new. · **Affected qualities:** Comprehension (74), Correctness (72). · **Design uncertainty reduced: 5** · **Market uncertainty reduced: 2** · **Classification: V1.1.**

**7. One-screen policy-toggle demo artifact (include overlay extras).**
Tier 2 · **Why it matters:** the moat exists in code and is invisible to buyers. Do this after item 3, so the demo rests on green tests. · **Affected qualities:** Differentiability (78), Comprehension (74). · **Design uncertainty reduced: 3** · **Market uncertainty reduced: 7** · **Classification: V1.1 / validation.**

**8. Seed one bundled or sample overlay with expectation `advisoryDefaults`.**
Tier 2 · **Why it matters:** mechanism without default content is a demo lie. Prefer FinOps `cost.requireBudgetCap=true` and/or a documented CIS overlay `expectation.topologyCategories.add=identity`. Do not add OpenAPI fields. · **Affected qualities:** Differentiability (78), Governed Review Integrity (84). · **Evidence:** bundled JSON this pass has `priorityFloor` only. · **Design uncertainty reduced: 6** · **Market uncertainty reduced: 3** · **Classification: V1.1.**

**9. Extend the golden-corpus harness past eight engines and inject `IEffectiveGovernanceLoader`.**
Tier 2 · **Why it matters:** the harness improved from 6 to 8 engines, but still constructs `FileComplianceRulePackProvider` directly, so the merge-blocking path does not stamp expectation extras. · **Affected qualities:** Correctness (72), Governed Review Integrity (84). · **Evidence:** `GoldenCorpusHarness.CreateEngines()` this pass. · **Design uncertainty reduced: 7** · **Market uncertainty reduced: 2** · **Classification: V1.1.**

**10. Capture 6–8 operator screenshots (M-07).**
Tier 2 · **Why it matters:** unblocks **M-09**/**M-16**. No longer blocked by a build crash; blocked only by item 1. · **Classification: validation / owner-output.** · **Market uncertainty reduced: 5.**

### Tier 3 — Hold For Reassessment

**11. One deep engine in resilience or segmentation semantics.** Hold until **G-REAL-06** indicates which category buyers argue about. **Classification: validation first.**

**12. Real frontier transcripts for the insight-density corpus.** Harness exists; corpus is synthetic. **Classification: validation first.**

**13. Owner decision: should density scoring apply to engine findings?** `typed-engine-protected` may be correct. Keep the distribution report explicitly advisory. **Classification: blocked on user input.**

## 18. Prompt Batching Guidance

**First batch — safe-for-Sonnet.** Item 1 (7 typecheck errors). Small, independent, mechanical.

**Second batch — owner decision then Sonnet.** Item 2 (trunk push gate). The workflow is Sonnet-safe; the branch-protection half needs the owner.

**Third batch — Sonnet with review.** Item 3 (declaration tests first, then governance properties) and item 5 (CodeQL confirmation). Do not batch the declaration-test repair with a change to `ShouldEmitTheme` — the first is test debt, the second is an owner decision.

**Fourth batch — owner + Opus.** Item 4 (**G-REAL-06**). Not a coding-agent substitute for live architecture judgment.

**Fifth batch — Sonnet with review.** Items 6, 8, 9; item 7 once a staging tenant exists.

Do **not** batch "expand declaration maps," "re-implement expectation stamp," "restore the operate help catch-all," or "add an alert-rules array guard" — those are already in tree.

## 19. Model Usage Guidance

**Composer-safe:** screenshot capture (**M-07**), snapshot regeneration, copy cleanup, the FluentAssertions-style mechanical renames.

**Sonnet-safe (default):** the 7 typecheck fixes, the push-gate workflow, declaration-test fixture repair, CodeQL anchor verification, golden-corpus fixture authoring, overlay `advisoryDefaults` seeding, GTM drafting.

**Strong-model-recommended:** any change to policy filtering, authority pipeline, scope resolution, or evidence-graph semantics; the governance workflow property failures, since they assert separation of duties; the `ShouldEmitTheme` empty-set decision; CodeQL `user-controlled-bypass` sites if they touch authorization.

**Opus-or-Gemini-assessment-recommended:** this class of assessment; **G-REAL-06** finding-quality interpretation; the trunk-policy decision in §20.

## 20. Pending Questions For Later

**Blocks V1:** Item 1 (typecheck) and item 3 (failing tests) as *execution*. Item 2 (trunk gate) needs an owner *decision* on whether `master` requires PRs. Remaining V1 execution after that: **G-REAL-06**, **G-COMMERCE-01**, CodeQL SARIF confirmation.

**Blocks V1.1:** Should bundled packs ship expectation extras by default, or only tenant overlays?

**Requires customer validation:** Which analytical category do buyers actually argue about? Does policy-aware review change a real decision (§10.6)?

**Requires founder decision:** (a) Lead with *organizational repeatability* rather than *superior insight*? (b) Keep `typed-engine-protected` as a hard bypass? (c) Which finding stream is the product of record — sealed `FindingsSnapshot` or `AgentResult.Findings`? (d) Seed FinOps/CIS overlays with expectation keys, or keep the mechanism test-only? (e) **New:** should `DeclarationSignalPolicyGate.ShouldEmitTheme` fail open or closed on an empty active rule set? It currently fails closed while the engine documents fail-open, so a tenant with no assigned compliance rules silently receives no declaration-security findings. (f) **New:** does `master` require pull requests?

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

The repository still demonstrates serious principal-architect judgment in unglamorous places: disposition-aware ROI that *documents* non-summation of per-system rows; `claimBoundary` on insight-density artifacts refusing to claim victory over named frontier models; an emission gate that refuses prose-only decision-grade findings; a ship-gate runner that returns FAIL when it cannot load a run; additive-floor expectation extras that cannot drop heuristic pillars; a published list of Azure roles the product will never request; enforced absence of `terraform apply`. The three-module help resolver split with a documented `null`-returning contract per module is also good structure — it simply lost its terminal-ownership invariant in a repair.

The taste failure has shifted, and the new one is more serious than the old one. v3 named proportion: 39 engines and 6 in the harness, 45 packs whose JSON ignores the new expectation keys, 791 rules and a thin corpus, density instrumentation that gates nothing. All of that still holds (the harness is now 8). But this pass found something worse: **the guards themselves were not verified.** A blocking typecheck job that reported `skipped` on every run because of a false positive on a git SHA. A security scan killed mid-analysis by the next push, every time, so it never once concluded. Four test projects that had not compiled through an entire assessment cycle, while an assessment scored Correctness at 76. A TB-1601 source guard whose assertion encoded the broken shape it was meant to prevent, and a TB-2238 slug guard that had matched zero slugs since a module split.

The pattern is writing the guard and then trusting it because it exists. The remedy is unglamorous and belongs in the same category as the disposition trail: make every gate fail once, on purpose, before believing it.
