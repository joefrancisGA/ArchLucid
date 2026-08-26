# ArchLucid Strategic Release and Market Readiness Assessment (v4)

**Pass date:** 2026-08-26 (night). **Computed fresh** — no carry-forward, no score deltas, no rescore ratchet. The prior same-day v3 pass is archived at [`../archive/assessments/LATEST_GPT55-2026-08-26-v3-superseded.md`](../archive/assessments/LATEST_GPT55-2026-08-26-v3-superseded.md) and is **not** canonical.

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Claude Opus 5, simulator-aware; **no live Azure OpenAI call was made during this pass**, so all agent-path judgments are about mechanism and default configuration, not observed real-mode output.

**Source materials inspected this pass:** `ASSESSMENT_PROMPT_SERIES.md`, `GTM_BACKLOG.md` (§0 sourcing, G-REAL / M-series / G-COMMERCE rows), `CODEQL_TRIAGE.md`, `WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md` (WK contract), plus direct code and configuration reads of `BuiltInFindingEngineTypeCatalog`, `GoldenCorpusHarness.CreateEngines()`, `DeterministicInsightDensityGate`, `InsightDensityGateOptions`, `InsightDensityEngineDistributionCalculator` / `…Markdown`, bundled `DefaultPolicyPacks/**` `advisoryDefaults`, `DeclarationIdentityActorMaterializer`, `RequestActorMaterializer`, `DeclarationPremiseConflictClassifier`, `continue-last-list-guard.ts`, `ArchLucid.Api/appsettings.json`, `.gitleaks.toml`, `Directory.Packages.props`, and the `ci.yml` / `codeql.yml` / `ui-typecheck-on-push.yml` triggers and job graphs.

**Executed this pass (runtime evidence, not doc claims):**

- `npx tsc --noEmit -p tsconfig.build.json` — **exit 0**. The v3 Gate 5 FAIL (truncated `help-topic-view-resolver-operate.tsx`) is **closed**. `npm run typecheck` also exit 0.
- `dotnet build` per test project on `master`: **`ArchLucid.Decisioning.Tests` 24 errors, `ArchLucid.Api.Tests` 14, `ArchLucid.Persistence.Tests` 4, `ArchLucid.Core.Tests` 4** — **46 compile errors, four projects.** `ArchLucid.Application.Tests` and `ArchLucid.KnowledgeGraph.Tests` build clean. Cause: FluentAssertions **8.10.0** renames (`BeGreaterOrEqualTo` / `BeLessOrEqualTo` / `HaveCountGreaterOrEqualTo` → `…ThanOrEqualTo`, 26 sites) plus 20 `CS1503` `CancellationToken`→`string?` argument mismatches in `Governance*PropertyTests`.
- `dotnet build` of shipping projects (`ArchLucid.Persistence`, `ArchLucid.Application`, `ArchLucid.Api`) — **0 errors, 0 warnings**. The break is test-only.
- GitHub Actions, all three workflows that gate `master`:
  - **`ci.yml` (PR gate): failing on every recent PR.** Run [33021196359](https://github.com/joefrancisGA/ArchLucid/actions/runs/33021196359): 2 of 59 jobs failed — `Security: gitleaks (secret scan)` reports `leaks found: 1`, and `.NET: fast core (corset)` then fails with `dotnet-fast-core-build:skipped`. Same failure on the 4 preceding PR runs.
  - **`ui-typecheck-on-push.yml` (the WK-11 `master` corset): failing on every push, and the typecheck itself never runs.** Run [33021229748](https://github.com/joefrancisGA/ArchLucid/actions/runs/33021229748): `gacts/gitleaks@v2` → `##[error]Unable to resolve action … unable to find version v2`; the dependent `Operator UI: typecheck (blocking)` job is **`skipped`**. Five consecutive `failure` conclusions.
  - **`codeql.yml` (`master` push): every recent run `cancelled`** by `cancel-in-progress` concurrency under rapid pushes. No completed C#/JS SARIF verdict exists for current `master`.
- The single gitleaks finding is a **false positive**: `generic-api-key` on `ArchLucid.Decisioning/Analysis/DeclarationPremiseConflictClassifier.cs:243`, where the matched literal is `propertyKey = "k8s.privileged";` — a Kubernetes declaration property-key name, not a credential. `.gitleaks.toml` already carries eight `[[allowlists]]` path blocks for exactly this false-positive class; this file is not among them.

Verified counts by direct inspection: **39** registered finding engines; **46** bundled policy-pack content files; **791** `ruleId` entries in `ga-starter-compliance.rules.json`; **8** engines in `GoldenCorpusHarness.CreateEngines()` (six coverage/compliance/cost plus `DeclarationSecurityBaselineFindingEngine` and `DeclarationPremiseConflictFindingEngine`); **398** `public const string` audit event-type constants. Bundled `advisoryDefaults` now contain **45 × `priorityFloor`, 1 × `expectation.topologyCategories.add`, 1 × `cost.requireBudgetCap`**. `Integrations:Itsm:NativeEnabled` = `true`; `AgentExecution:Mode` = `Simulator`; `EnableLlmJudgeForEngineFindings` default `false`.

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows. Excludes GTM V1.1 items **#2/#3/#5/#6** (**M-90**/**M-44**/**M-91**/**M-92**) per standing exclusion rule. Owner assurance programs **G-REAL-05** / **G-ASSURANCE-02** appear only because they are human-executed; they do **not** reduce `(A)`.

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|-----------------|--------------------|--------------------|
| 1 | **G-REAL-06** — three real-mode pilot runs | Now the single dominant deficiency driver. Gate 5 is repaired, so nothing engineering-side blocks this. Insight-density, 30-day usage, and purchase-probability numbers stay low-confidence until it runs. | Partial — agent prepares scenarios/scripts/packets; owner supplies real architecture and judgment | **Opus** — pilot design and finding-quality interpretation materially change the conclusion |
| 2 | **G-REAL-07** — proof packets + `PROOF_PACKET_RUN_LOG` | Depends on #1. Converts pilot runs into reusable buyer evidence. | Partial | **Sonnet** |
| 3 | **M-39** — apply proof-packet checklist, ≥3 G4 rows | Depends on #2. Stage 1 selling gate. | Partial | **Sonnet** |
| 4 | **M-07** — polished operator screenshots | **Unblocked this pass** — the v3 blocker (Gate 5 compile FAIL) is closed. Now the gating item for **M-16** and remaining **M-09**. | Partial — agent can drive the capture harness | **Composer** — high-volume mechanical capture |
| 5 | **M-09** — landing owner sign-off + deploy | In progress; gated on #4. No inbound motion without it. | Partial | **Sonnet** |
| 6 | **M-16** — demo video | Depends on #4. **G-REAL-09** (live DOCX visual check, 10–15 m) should run before recording. | Partial | **Sonnet** |
| 7 | **G-COMMERCE-01 / M-94** — invoice + SOW readiness (tax, entity, payment methods) | Revenue-blocking for the sales-led V1 motion; owner-only financial/legal setup. | No — human only | N/A — human only |
| 8 | **G-COMMERCE-02 / M-95** — first paid engagement on invoice/SOW path | Depends on #7 and pilot proof from #1–#3. | No — human only | N/A — human only |
| 9 | **M-110** — Quick Scan AI go/no-go | Owner must record GREEN/YELLOW/RED before enabling `AnonymousExecutionEnabled` in production. | Partial | **Sonnet** |
| 10 | **G-REAL-05** (SOC 2 CPA) and **G-ASSURANCE-02** (third-party pen test) | Owner assurance programs. Not `(A)` gates; listed for sequencing only. | No — human only | N/A — human only |

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 73.70%**

**Not capped.** No ship gate returns FAIL this pass. The v3 Gate 5 FAIL is closed by runtime evidence (`tsconfig.build.json` exit 0). Gates 2–4 and 6 pass on mechanism, with a new honesty caveat: the test projects that *assert* those mechanisms do not currently compile, so "PASS (mechanism)" is a code-reading judgment this pass rather than an executed one. Gate 1 remains **UNKNOWN** (no SQL-backed live first review in this environment).

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`: SOC 2 CPA attestation, third-party pen-test publication, signed design partner, owner-output GTM assets/cohorts, public extension SDK, MCP absence in V1, third-party plugin marketplace, assistive-technology participant testing, and sales-engineer-led LLM onboarding.

---

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 67 | 13 | 8.71 | **429** |
| 2 | Differentiability / Defensibility vs Frontier AI | 84 | 13 | 10.92 | 208 |
| 3 | Governed Review Integrity | 78 | 13 | 10.14 | **286** |
| 4 | Correctness & Evidence Integrity | 58 | 12 | 6.96 | **504** |
| 5 | AI / Agent Readiness | 74 | 10 | 7.40 | 260 |
| 6 | Time-to-Value | 76 | 10 | 7.60 | 240 |
| 7 | Proof-of-ROI Readiness | 76 | 9 | 6.84 | 216 |
| 8 | Sponsor / Operator Comprehension | 79 | 8 | 6.32 | 168 |
| 9 | Runtime & First-Review Reliability | 63 | 7 | 4.41 | 259 |
| 10 | Adoption Friction | 88 | 5 | 4.40 | 60 |
| | **(A) Headline readiness** | | **100** | **73.70%** | |

**Ranked by weighted deficiency:** Correctness (504) · Insight Density (429) · Governed Review Integrity (286) · AI/Agent Readiness (260) · Runtime (259) · Time-to-Value (240) · Proof-of-ROI (216) · Differentiability (208) · Comprehension (168) · Adoption Friction (60).

**Note on the shape of this scorecard.** The deficiency profile inverted this pass. v3's top deficiency was Insight Density with a compile break inflating Runtime and Time-to-Value. The compile break is fixed and those pillars recovered — but **Correctness is now the worst pillar in the model**, and for a reason no prior pass recorded: four test projects do not compile and all three CI workflows that gate `master` are non-functional, each for an independent reason. ArchLucid's *product* code is healthier than it was twelve hours ago and its *verification apparatus* is entirely dark. Insight Density remains the only top deficiency that is genuinely architectural.

---

## 3. Diagnostic Scores (non-headline)

These do **not** feed the headline.

**Decision Advantage Score: 66/100.** Likelihood ArchLucid changes a decision frontier AI alone would not. Credit for policy-filtered compliance evaluation (a tenant's enabled rule set determines which of 791+ rules fire), declaration-security / premise-conflict gating on mapped keys and prefix families, graph-stamped coverage extras — **now present in bundled content, not only tenant overlays** — cost require-cap / breach-severity overrides, open-commitment findings from governance history, and Bicep/Kubernetes declaration properties feeding the same classifiers as Terraform. Two points above v3 for one specific reason: `DeclarationIdentityActorMaterializer` now derives `Actor` nodes from IAM / service-account IaC declarations, so `TrustBoundaryFindingEngine` and `PrivilegedAccessFindingEngine` fire on IaC-only reviews instead of staying silent. That is additive density, not a filter. Still discounted because engine depth remains predominantly graph-shape and checklist coverage rather than architectural judgment, and because dedicated engines for resilience posture, segmentation semantics, IAM depth, and observability still do not exist.

**Frontier-AI Survival Probability (12 months): 55–70%, moderate confidence.** Reference class: vertical governance/workflow wrappers around a commoditizing model layer; base rate ~50–60%. Adjusted **upward** because the policy-pack→filter/stamp→finding→decision→audit chain is persistent tenant state across more than one engine family, and because bundled packs now ship at least one expectation extra rather than mechanism-only. Adjusted **downward** because generic-critique value is already commodity and the deterministic floor is still checklist-height outside compliance, declaration, and coverage extras.

**30-Day Voluntary Usage Probability: 32–47%, low-moderate confidence.** Reference class: enterprise architecture tooling adopted voluntarily by senior ICs — base rate 20–30%. Adjusted up because the workspace now compiles (so a local first run is defined), Bicep/Kubernetes are no longer silently empty, and Actor-dependent security engines now fire on IaC-only uploads. Adjusted down because default host mode is Simulator, the LLM judge defaults off, and no live-pilot retention signal exists.

**Sponsor Purchase Probability: 25–40%, low confidence.** Reference class: net-new governance tooling purchased on a pilot, no reference customer, sales-led motion — base rate 20–35%. Unchanged from v3 despite the compile repair, because the binding constraint was never the compile: it is zero completed real-mode pilots (**G-REAL-06** not started) and no reference. Confidence is low specifically because owner pilot work has not run.

**Reconciliation with §2.** The headline (73.70%) sits above Decision Advantage (66) and well above the purchase band (25–40%). Same structural tension as prior passes, with one new wrinkle: the headline is *no longer* suppressed by a visible product defect, so it now reads as a fair weighted average of a real governance container with mediocre analytical depth. The uncomfortable part is that Correctness at 58 is carrying a verification blackout rather than a product bug — a reader who only sees the headline will not know that no automated gate has actually passed on current `master`.

---

## 4. V1 Ship Gate

`ShipGateEvidenceRunner` maps 1:1 to these six gates. It requires a live API and a committed `runId`. This environment has no SQL-backed API, so live-execution gates are **UNKNOWN** rather than assumed PASS.

| # | Gate | Verdict | Evidence | Fastest resolution |
|---|------|---------|----------|--------------------|
| 1 | First review completes create → execute → commit → manifest + ≥1 artifact | **UNKNOWN** | Mechanism and tests exist. Not executed here. | Run `archlucid pilot ship-gate-evidence` against a SQL-backed staging API with a committed run. |
| 2 | No hallucinated or uncited policy/evidence citations | **PASS (mechanism, unverified this pass)** | `AgentArchitectureFindingEmissionGate` strips decision-grade agent findings lacking both `PolicyRuleId` and `EvidenceRefs`; `DecisionGradeFindingProvenanceValidator` enforces typed-engine vs agent provenance. **Honest limit:** the assertions live in `ArchLucid.Decisioning.Tests` / `ArchLucid.Api.Tests`, which do not compile, so no test executed this pass. Semantic hallucination audit remains manual. | Repair the 46 test compile errors, then re-run. |
| 3 | Sponsor summary / ROI coherent and not misleading | **PASS (mechanism)** | Disposition-aware headline, `headlineSavingsScopeCode` labeling, board-pack delegates to the same service. **TB-603** Done. | As gate 1. |
| 4 | Export / package generation works (Markdown / DOCX / ZIP) | **PASS (mechanism, unverified this pass)** | Export formatters and Suite=Core coverage exist; `ArchLucid.Application.Tests` builds clean. Live ZIP/DOCX against a committed run not executed. | Optional: `ShipGateExportMatrixProbe` on staging; **G-REAL-09** for the DOCX visual check. |
| 5 | Architect workspace does not break during first-review / demo path | **PASS** | `npx tsc --noEmit -p tsconfig.build.json` **exit 0** on current `master`; `npm run typecheck` exit 0. The v3 truncated-JSX FAIL in `help-topic-view-resolver-operate.tsx` is closed, and `help-topic-catch-all-fallthrough.test.ts` now reads the operate module (6 tests pass). Live click-through unverified — that is gate 1. | Keep the push corset honest (see §8 #1). |
| 6 | Auth + tenant isolation behave correctly on the pilot path | **PASS (mechanism)** | Database-per-tenant topology (ADR 0037), `ScopeResolutionGuardMiddleware`, tenant-isolation negative probes in the ship-gate runner. | As gate 1. |

**No gate FAILs, so the headline is uncapped.** The CI blackout is a **process and security-merge** problem, not a numbered ship-gate FAIL — but it is the reason gates 2 and 4 carry an "unverified this pass" qualifier rather than a clean mechanism PASS.

---

## 5. Sponsor Summary

**(A) Overall headline readiness — 73.70%, uncapped.**

ArchLucid is a governed architecture-review system whose **policy mechanism is broader than a single compliance engine**, whose **architect workspace now compiles**, and whose **automated verification is currently switched off in three independent ways**. An architect submits a structured request or uses guided intake; the system ingests documents and infrastructure declarations into a canonical graph; 39 deterministic finding engines run over that graph; the tenant's *own enabled* compliance rules evaluate against it; `advisoryDefaults` extras — now present in bundled pack content, not only tenant overlays — are stamped onto the context snapshot so coverage and cost engines union pack expectations with heuristics; a sealed manifest with an authority chain is produced; exports, sponsor ROI rollups, and ITSM tickets package the result against an append-only audit trail with database-per-tenant isolation.

Governance is not decoration. `ComplianceRulePackGovernanceFilter` intersects the rule universe with the tenant's enabled keys and a priority floor; `TenantCuratedComplianceRulePackMerger` folds in tenant-authored rules; golden sibling suites assert that two postures emit different compliance findings, that SOC 2 vs CIS Azure change declaration-security findings, and that a stamped `identity` extra changes topology-coverage missing categories. Approval workflow enforces separation of duties; the pre-finalize gate can block on severity; a dry-run surface shows what a policy change would do. Forty-six bundled pack content files ship, and the merge-blocking golden harness now registers eight engines including both declaration engines.

Two things changed materially since the last pass, and one thing got worse. Better: the Operate help catch-all compiles, so Gate 5 is green and the **M-07** screenshot / demo motion is unblocked; `Actor` nodes now materialize from IAM and service-account IaC declarations, so trust-boundary and privileged-access engines no longer sit silent on an IaC-only first review; bundled packs now encode at least one `expectation.topologyCategories.add` and one `cost.requireBudgetCap`, closing the "mechanism without default content" honesty gap that v3 flagged. Worse: **nothing on `master` is being automatically verified.** The PR gate (`ci.yml`) fails on every pull request because gitleaks flags a false positive — `propertyKey = "k8s.privileged"` in a Kubernetes declaration classifier — and that failure cascades to skip the entire .NET fast-core build. The `master`-push typecheck corset added last pass references `gacts/gitleaks@v2`, a tag that does not exist, so its gitleaks job errors at setup and the actual typecheck job is **skipped** — the gate built specifically to catch Gate 5 regressions has never once typechecked anything. CodeQL runs on `master` are all cancelled by concurrency. And four test projects carry 46 compile errors from a FluentAssertions 8.10.0 upgrade whose call sites were only partially migrated, which means the merge-blocking golden corpus — the thing that proves policy packs change findings — cannot currently execute at all.

The remaining product weakness is still **contents, not container**. Deterministic engines remain predominantly coverage and structure checks. There are no dedicated engines for resilience/DR, IAM depth, secrets/key lifecycle, network segmentation semantics beyond edge presence, observability, or capacity. Insight-density scoring still computes a number for every engine finding and then **promotes unconditionally** via `typed-engine-protected`.

**(B) Procurement / market realism (weight 0 in `(A)`).** Trust posture is honest: SOC 2 self-assessment plus roadmap, CAIQ/SIG/DPA templates, subprocessor register, owner-conducted penetration exercise, published Azure roles ArchLucid will never request, Tier 1 ingestion with no vendor access to a customer cloud. A CPA-issued SOC 2 report and a third-party pen-test summary do not exist — correctly out of `(A)`, still friction for hard-gate buyers. Honest talk-tracks (**M-196**/**M-197**) and the minimum pilot trust packet (**M-190**/**M-191**) are Done as content. Live buyer security review has not happened. One new `(B)` risk worth naming: a technical buyer who asks to see a green CI badge on `master` cannot be shown one today.

**Commercial picture.** Sales-led V1: pricing page, order-form template, TEST-mode trial. Live commerce un-hold is V1.1 owner-only. Compelling today: audit-ready packaging and repeatability a chat transcript cannot produce, now demonstrable because the workspace builds. Unproven: voluntary return and paid conversion. **G-COMMERCE-01** is not done, so a willing first buyer still has no clean invoice path.

**Enterprise picture.** Tenancy, RBAC, SCIM, SAML and OIDC, private endpoints, and audit coverage are at a credible enterprise bar. ITSM native-create defaults **on**; Jira/ServiceNow/Confluence OAuth is Done. Hesitation will come from assurance paperwork and from the depth question in the first 20 minutes — no longer from a trunk that does not typecheck.

**Engineering picture.** Shipping code is healthy: `ArchLucid.Persistence`, `ArchLucid.Application`, and `ArchLucid.Api` all build with **0 warnings, 0 errors**, and the UI typechecks. Test and CI infrastructure is not: 46 test compile errors across four projects, a PR gate red on a false-positive secret, a push corset whose real job never runs, and CodeQL perpetually cancelled. This is a repair job measured in hours, not a design problem — but until it is done, every quality claim in this document rests on code reading rather than execution.

**Frontier-AI picture.** ArchLucid gets *more* valuable as base models improve, because better models produce better findings that flow into the same policy mappings and audit structures at zero engineering cost — but only if the deterministic floor is deep enough that the product is not merely a wrapper around whichever model is current.

---

## 6. Deferred Scope Uncertainty

**V1.1:** CloudEvents outbound webhooks and customer-operated recipe bridges; MCP read-only membrane; multi-region active/active; commerce un-hold. Deferral is safe for V1 — the V1 automation contract (REST, CLI, workspace, SCIM, CI decoration, first-party Jira/ServiceNow/Confluence/Slack/Teams) covers pilot needs.

**V2:** third-party pen-test program; SOC 2 CPA; automated tenant-erasure quarantine; Redis-as-default substrate; DTF / Container Apps Jobs. Safe for V1. Erasure has operator purge paths as the interim seam.

**Genuine uncertainty:** Graph-RAG community summarization stays deferred per ADR 0057 pending pilot signal. Do not build it before **G-REAL-06** says retrieval depth is the limiter.

---

## 7. Weighted Quality Assessment (detail)

Ordered by weighted deficiency signal.

### 7.1 Correctness & Evidence Integrity — 58 · weight 12 · contribution 6.96 · deficiency 504

**Justification.** The citation and payload machinery itself is strong and unchanged: `AgentArchitectureFindingEmissionGate`, `DecisionGradeFindingProvenanceValidator`, typed payloads, the extractor `collectionTimestamp` citation contract. The UI now typechecks cleanly, and the continue-last array-guard family (`continue-last-list-guard.ts` with `asNonemptyReadonlyArray` / `asReadonlyArray`) removed a real class of client crash across the Operate hubs.

The deduction is almost entirely **verification blackout**, and it is severe enough to make this the worst pillar in the model:

1. **Four test projects do not compile.** `ArchLucid.Decisioning.Tests` (24), `ArchLucid.Api.Tests` (14), `ArchLucid.Persistence.Tests` (4), `ArchLucid.Core.Tests` (4). Twenty-six errors are FluentAssertions 8.10.0 renames (`BeGreaterOrEqualTo` → `BeGreaterThanOrEqualTo`, `BeLessOrEqualTo` → `BeLessThanOrEqualTo`, `HaveCountGreaterOrEqualTo` → `HaveCountGreaterThanOrEqualTo`); twenty are `CS1503` `CancellationToken`→`string?` mismatches in `GovernanceWorkflow*PropertyTests`. A package bump landed with a partial call-site migration.
2. **The PR gate is red on every PR.** gitleaks reports one leak; it is a false positive on `propertyKey = "k8s.privileged"`. Its failure cascades: `.NET: fast core (corset)` reports `dotnet-fast-core-build:skipped` and fails.
3. **No completed CodeQL verdict exists for `master`.** All recent runs cancelled by concurrency.

Citation probes also still prove a citation *exists*, not that it supports the claim — unchanged and honest.

**Tradeoffs.** None of these are design compromises; they are unmerged maintenance. The FluentAssertions migration is mechanical. The gitleaks fix is one `[[allowlists]]` path entry in a file that already has eight of them.

**Recommendations.** Repair in this order: gitleaks allowlist (unblocks the PR gate for everything else), then the 46 test compile errors, then the `@v2` action pin. Do not add new tests until existing ones can run.

**Classification:** V1. **Affects outcomes 1, 2, 4.**

### 7.2 Decision-Changing Insight Density — 67 · weight 13 · contribution 8.71 · deficiency 429

**Justification.** `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md` now states plainly what prior passes had to infer: the pillar clause **"miss"** is uncovered because every shipped mechanism is **subtractive** — the density gate penalizes generic phrasing, the pruner drops weak Critic prose, the optional LLM judge filters. A filter raises precision, never density.

Verified this pass:

1. **The density gate still does not gate engine findings.** `DeterministicInsightDensityGate` computes a score, then at `if (!candidate.IsAgentArchitectureFinding)` adds penalty reason `typed-engine-protected` and returns `Promote` / `DecisionGradeFinding`. The score is computed and discarded. All **39** engines take this path.
2. **Actor-dependent engines are no longer silent on IaC-only reviews.** `DeclarationIdentityActorMaterializer` sits alongside `RequestActorMaterializer` in the materialization pipeline, deriving `Actor` nodes from IAM / service-account declarations. This is the one genuinely *additive* density change in tree, and it is why this score moved off v3's 66 rather than staying flat.
3. **Bundled packs now stamp expectation extras.** One pack sets `expectation.topologyCategories.add`, one sets `cost.requireBudgetCap`. Assigning that pack as-shipped now adds a coverage expectation. It remains a coverage-shaped finding, not a judgment a skilled architect would miss.
4. **Frontier baselines are still not frontier baselines.** The insight-density corpus is synthetic, and `HOLD_NO_COVERAGE_ENGINES.md` correctly holds new coverage-shaped engines pending pilot signal.

**A fresh doc/code discrepancy.** `docs/quality/insight-density-engine-distribution.md` and its generators (`InsightDensityEngineDistributionCalculator`, `InsightDensityEngineDistributionMarkdown`) hardcode "**six** golden-corpus engines; **33** built-in engines are absent." The harness now registers **eight**. The published distribution table understates its own coverage.

**Tradeoffs.** Typed-engine protection prevents a heuristic from suppressing deterministic output — defensible. It also means density is unmeasured where most findings originate.

**Recommendations.** Do not add coverage-shaped engines (the hold memo is correct). Fix the six/eight drift in the generator so the advisory table is honest. Capture real frontier transcripts only after a real architecture exists. One deep judgment engine only after **G-REAL-06** names the category.

**Classification:** V1 residual (measurement honesty) + market validation. **Affects outcomes 1, 3, 5.**

### 7.3 Governed Review Integrity — 78 · weight 13 · contribution 10.14 · deficiency 286

**Justification.** Policy→evidence→finding→decision→audit is materially complete with three pack-influence kinds, and two of them now have bundled default content rather than mechanism-only. Sealed golden manifests; authority replay; 398 typed audit event constants; SoD approvals; pre-finalize gate; policy dry-run; disposition trail feeding ROI and open-commitment; ITSM `FindingId` correlation. The merge-blocking harness grew from six engines to **eight**, adding `DeclarationSecurityBaselineFindingEngine` and `DeclarationPremiseConflictFindingEngine` — closing the largest coverage complaint of the prior pass.

The deduction is that **the harness cannot run.** `ArchLucid.Decisioning.Tests` has 24 compile errors, so the eight-engine golden corpus asserts nothing on current `master`. A merge-blocking gate that does not compile is not a gate. `GoldenCorpusHarness.CreateEngines()` also still constructs `FileComplianceRulePackProvider` directly rather than injecting `IEffectiveGovernanceLoader`, so the harness path does not stamp production governance extras. The dual finding model (sealed `FindingsSnapshot` vs `AgentResult.Findings`) persists, though `FINDING_STREAM_PRODUCT_OF_RECORD.md` now documents which stream is authoritative and buyer exports carry dual-finding section headings.

**Tradeoffs.** Keeping the harness on a file-based compliance provider keeps snapshots stable and fast; the cost is that it proves less than the production path.

**Recommendations.** Restore compilation before anything else in this pillar. Then consider injecting `IEffectiveGovernanceLoader` behind a test-only flag.

**Classification:** V1. **Affects outcomes 2, 4, 5.**

### 7.4 AI / Agent Readiness — 74 · weight 10 · contribution 7.40 · deficiency 260

**Justification.** Operationally mature and unchanged: real/simulator separation, Application-layer orchestration, `AgentResult` schema validation, `WarnOnly` / `PilotStrict` quality-gate modes, LLM budget reservation and monthly caps, prompt-cache prefix, per-snapshot judge ceilings, tenant overrides for judge and portfolio-recurrence via `TenantFindingEngineControlsService`.

Deductions: default `AgentExecution:Mode` is `Simulator`; `EnableLlmJudge` and `EnableLlmJudgeForEngineFindings` **default false** (the latter documented as "engine path is opt-in separately"); Graph-RAG community summarization deferred; eval corpus is synthetic; the nightly real-mode loop was not executed as a live tripwire this pass.

**Tradeoffs.** Simulator-by-default is the right posture for CI determinism and cost control, and it is honestly labeled in the UI (the simulator notice now appears on findings and export paths). It also means the impressive stream a buyer sees first is canned.

**Recommendations.** Nothing new to build before pilots. The gap is evidence, not mechanism.

**Classification:** V1 mechanism complete; validation required. **Affects outcomes 1, 5.**

### 7.5 Runtime & First-Review Reliability — 63 · weight 7 · contribution 4.41 · deficiency 259

**Justification.** Two v3 deductions are closed: the production typecheck is green, and the Alert-rules `rules.slice` crash is fixed by a shared runtime array guard applied across the continue-last helper family. Health endpoints, correlation IDs, outbox/DLQ, idempotency, run-execute leases, budget cutoffs, Redis auto-selection, and `ShipGateEvidenceRunner` all exist.

The score barely moves because the *product* reliability gain is offset by an *assurance* collapse that is new this pass. All three workflows gating `master` are non-functional: `ci.yml` fails on every PR (gitleaks false positive → skipped .NET build); `ui-typecheck-on-push.yml` fails at setup on an unresolvable `gacts/gitleaks@v2` and **skips its own typecheck job**; `codeql.yml` runs are all cancelled. Gate 1 live first-review remains UNKNOWN.

The `@v2` pin deserves specific note: `ci.yml` pins the same action at `@v1.3.2` and resolves fine. The push corset copied the pattern and bumped the major tag to one that does not exist — so the gate created to prevent Gate 5 regressions has produced five consecutive `failure` conclusions without ever executing a typecheck.

**Tradeoffs.** `cancel-in-progress` concurrency is correct for cost on a busy trunk; combined with rapid merges it means CodeQL effectively never completes. Consider exempting CodeQL from cancellation on `master`.

**Recommendations.** §8 items 1–3, in that order.

**Classification:** V1. **Affects outcomes 2, 3.**

### 7.6 Time-to-Value — 76 · weight 10 · contribution 7.60 · deficiency 240

**Justification.** The designed pilot path is short: configure, start, create review, execute, finalize, review package. Guided intake, reference-architecture exemplars, sample/demo runs, and `stack doctor` reduce first-run friction. v3's compile deduction is gone — a deployed first screen is now defined.

Two first-review honesty improvements landed: guided intake now states the actor/intake requirement explicitly, and the findings workspace shows `ActorDependentFindingsQuietEnginesHint` when the graph has no `Actor` nodes, so a thin IaC-only review explains itself instead of reading as "ArchLucid found nothing." With `DeclarationIdentityActorMaterializer` in the pipeline, that empty state should now fire less often.

Remaining: first-review live E2E was not run here (gate 1 UNKNOWN); extractor-based cost/inventory still needs customer credentials for Tier 2; Simulator default means the first "wow" may be canned.

**Classification:** V1 residual + validation. **Affects outcomes 1, 3.**

### 7.7 Proof-of-ROI Readiness — 76 · weight 9 · contribution 6.84 · deficiency 216

**Justification.** Layered, honestly labeled ROI: latest-committed-run-per-system, `FindingId` dedup, tenant-rate/EA-discount math, disposition-aware headline, `headlineSavingsScopeCode`, 30-day value-report kept separate, board-pack identical by construction. **TB-603** is Done — AWS/GCP structured retail-price lookups exist with heuristic fallback.

Deduction unchanged: zero real pilot deltas, so every savings figure is model- or fixture-derived. This pillar cannot improve without **G-REAL-06**.

**Classification:** V1 residual + validation required. **Affects outcomes 3, 4.**

### 7.8 Differentiability / Defensibility vs Frontier AI — 84 · weight 13 · contribution 10.92 · deficiency 208

**Justification — rubric level: High, approaching Excellent on compliance and declaration; High on coverage/cost now that default content exists.**

Changing a policy pack changes which of 791+ rules evaluate. Declaration-security and premise-conflict honor mapped keys and prefix families. Coverage resolvers UNION stamped extras. Cost engines honor require-cap and breach-severity stamps. Prompting cannot hold that chain.

**v3's headline deduction is partially closed.** Bundled `advisoryDefaults` are no longer `priorityFloor`-only: one pack sets `expectation.topologyCategories.add`, one sets `cost.requireBudgetCap`. Assigning that content as-shipped now parameterizes coverage. The honest framing is **2 of 46 packs**, not all of them — so "assign SOC 2 and watch coverage extras appear" is still not true in general, and the buyer-facing claim must stay specific about which pack does it.

Count of engines that *can* consume pack state when keys/stamps are present: compliance, two declaration engines, the coverage-family consumers of the three resolvers, and two cost engines — a minority of 39, concentrated where buyers argue about standards, gaps, and budget. Open-commitment, portfolio-recurrence, and `*-cross-run-diff` stay pack-independent by design; inventory/orphaned engines stay pack-inert.

**Recommendations.** The policy-toggle demo script exists (`POLICY_PACK_DELTA_DEMO_SCRIPT.md`) with a policy-toggle finding-set section. What does not exist is a **captured artifact** — screenshots or a recording of one architecture under two postures. That is now a capture task, not a build task, and it rides **M-07**.

**Classification:** V1 mechanism complete for three influence kinds; demo-capture residual. **Affects outcomes 1, 2, 5.**

### 7.9 Sponsor / Operator Comprehension — 79 · weight 8 · contribution 6.32 · deficiency 168

**Justification.** Design-system work is real: Carbon-derived tokens, `StatusTag`/`SeverityTag`, enterprise tables, in-app `/help/{topic}`, insight-density curation banner, buyer-label vocabulary. Three v3 deductions closed this pass: the Operate help catch-all compiles and is now covered by a source-shape regression test that reads the *operate* module (not just the parent resolver); the Alert-rules non-array crash is guarded; and the dual finding model is no longer silent — `FINDING_STREAM_PRODUCT_OF_RECORD.md` names the product of record, buyer one-pager exports carry dual-finding section headings, and `SimulatorModeAiOperationNotice` appears on the findings workspace and export toolbars so a sponsor cannot mistake canned output for Real mode.

Remaining: dual finding counts can still confuse a sponsor comparing a sealed snapshot total against an agent-stream total, even when both are labeled; and the insight-density distribution doc publishes a stale "six engines" coverage claim.

**Classification:** V1. **Affects outcomes 2, 4.**

### 7.10 Adoption Friction — 88 · weight 5 · contribution 4.40 · deficiency 60

**Justification.** Broad configuration surface: OIDC, SAML SP, API keys, SCIM, four RBAC roles, database-per-tenant, docker compose, Terraform including Entra/Key Vault, private endpoints/WAF, `Integrations:Itsm:NativeEnabled` default **true**, Jira/ServiceNow/Confluence OAuth, CLI `doctor` / `support-bundle`. v3's deduction — a UI that would not typecheck, blocking local first run — is closed.

Deduction: Tier 2 extractor still needs customer-provisioned credentials. A contributor cloning `master` today will also find four test projects that do not build, which is friction of a different kind.

**Classification:** V1 residual. **Affects outcomes 2, 3.**

---

## 8. Top 10 Weaknesses

1. **No automated gate passes on `master`, for three independent reasons.** `ci.yml` fails on every PR (gitleaks false positive → `.NET: fast core (corset)` reports `dotnet-fast-core-build:skipped`); `ui-typecheck-on-push.yml` fails at setup on `gacts/gitleaks@v2` and **skips its own typecheck job**; `codeql.yml` runs are all cancelled by concurrency. Process uncertainty. **Not a numbered ship-gate FAIL**, but it is the reason two gates carry "unverified this pass." Fastest path: add `DeclarationPremiseConflictClassifier.cs` to the existing `.gitleaks.toml` `[[allowlists]]`; repin the corset to `@v1.3.2`; exempt CodeQL on `master` from `cancel-in-progress`.
2. **Four test projects do not compile — 46 errors.** FluentAssertions 8.10.0 renames (26 sites) plus 20 `CS1503` `CancellationToken`→`string?` mismatches in `GovernanceWorkflow*PropertyTests`. Design/process uncertainty. **This is the highest-leverage V1 repair**: it is mechanical, and until it is done the merge-blocking golden corpus, the citation-provenance suites, and the API contract tests all assert nothing.
3. **Insight density is still subtractive.** The gate, pruner, and optional LLM judge discard generic output; nothing generates a finding a skilled architect would miss. `typed-engine-protected` bypasses scoring for all 39 engines. Design uncertainty. **Not a V1 contract blocker**; it is the binding constraint on outcomes 1 and 5. Fastest path: hold new coverage engines (already memo'd), run **G-REAL-06**, then one deep engine in the category the pilot actually argued about.
4. **Zero completed real-mode pilots (G-REAL-06).** Pure market uncertainty. Now the only remaining blocker on every commercial diagnostic in §3, and no longer gated by any engineering defect. Fastest path: owner-executed three-run protocol (4–6 h active per the GTM estimate).
5. **The golden corpus proves policy influence and cannot run.** Harness grew to eight engines including both declaration engines — a real improvement — inside a project with 24 compile errors. Design uncertainty. Fastest path: item 2.
6. **Published insight-density coverage is stale.** `insight-density-engine-distribution.md` and both generator classes hardcode "six golden-corpus engines; 33 built-in engines absent"; the harness registers eight. Design uncertainty, low effort, and it is an honesty artifact — the doc understates its own coverage while claiming a `claimBoundary`.
7. **Expectation extras ship in 2 of 46 bundled packs.** Mechanism plus default content now both exist, which closes the prior "demo lie" framing — but a buyer told "policy packs parameterize coverage" who then assigns one of the other 44 packs sees no extras. Design/positioning uncertainty. Fastest path: name the specific pack in demo copy, or seed one more overlay.
8. **The policy-toggle moat has no captured artifact.** The demo script exists with a policy-toggle finding-set section; no screenshots or recording of one architecture under two postures exist. Market uncertainty. Fastest path: capture it as part of **M-07**.
9. **Dual finding model remains a sponsor-comprehension risk.** Sealed `FindingsSnapshot` vs `AgentResult.Findings`. Now documented with a product-of-record note and dual-finding export headings, which is the honest mitigation — but two different totals on two surfaces still invites the question. Design uncertainty; founder decision on whether to surface only one total.
10. **Simulator default plus judge-off means the first impression is canned.** `AgentExecution:Mode = Simulator`; `EnableLlmJudge` and `EnableLlmJudgeForEngineFindings` default false. Correctly labeled now via `SimulatorModeAiOperationNotice` on findings and export paths. Design uncertainty — the labeling is right; the consequence for a first demo remains.

---

## 9. Frontier-AI Analysis

### Commodity vs Durable

| Capability | 12-month outlook | Reason / evidence |
|---|---|---|
| Generic architecture critique prose | **Commodity now** | Any frontier model produces comparable output from a good prompt |
| Graph coverage / structure checks | **Commodity within 12 months** | Shape checks, not judgment — even when a pack adds an expected category |
| Declaration property extraction | **Commodity** | Models parse Terraform/ARM/Bicep well; ArchLucid's parsers feed classifiers (packaging) |
| Actor derivation from IAM declarations | **Commodity-ish, but load-bearing** | A model can name identities; `DeclarationIdentityActorMaterializer` puts them in a graph two engines already query |
| **Tenant-specific enabled rule set** | **Durable** | Persistent, versioned, per-scope state |
| **Declaration signal gating from that rule set** | **Durable-ish** | Same persistent state, consumed by two more engines |
| **Expectation extras in `advisoryDefaults`** | **Durable, now partly default** | Mechanism plus bundled content in 2 of 46 packs; unused keys elsewhere are still decoration |
| **Sealed manifest + authority chain + replay** | **Durable** | Infrastructure, not inference |
| **Append-only typed audit reconstruction** | **Durable, more valuable over time** | Compounds with history; 398 typed event constants |
| **Cross-run / portfolio state** | **Durable** | Open-commitment, portfolio recurrence, cross-run diff — pack-independent on purpose |
| **Approval workflow with SoD** | **Durable** | Organizational process |
| ROI disposition-aware basis | **Durable-ish** | Math is simple; disposition state is product state |
| Retrieval depth (Graph-RAG) | **Commodity within 12 months** | Long-context erodes bounded multi-hop |

### What resists prompting

Persistent policy state, evidence→finding→policy→decision→audit traceability, repeatability across architects, sponsor/operator role separation, disposition lifecycle, ITSM correlation. **Does not resist prompting:** the analytical content of most current findings.

### Leverage / upside — the first-class bet

Every base-model improvement flows through unchanged plumbing: better agent findings → same policy packs → same sealed manifests → same audit trail → same ROI partitioning, at ~zero ArchLucid engineering cost. The bet only pays if the deterministic floor is high enough that customers do not conclude the wrapper is all there is.

### Displacement timeline

One model release away: generic critique, retrieval depth, declaration parsing, structural coverage. Multiple releases / never from model progress alone: policy state, audit reconstruction, approval workflow, disposition lifecycle, portfolio history.

Survival probability is in §3.

### Final verdict

**Not yet faster than frontier AI, but the gap narrowed on mechanism this pass and widened on proof.** The container is the bet, and the container now compiles, materializes actors from IaC, and ships default content that parameterizes coverage. What it does not have is a single executed automated gate on trunk or one completed real pilot. Invest in restoring the verification apparatus (hours), then in **real pilots** — not in more prompting and not in more coverage engines.

---

## 10. Policy-Aware Governance Test

1. **Do policy packs drive behavior?** **Yes, for three kinds, and now with some default content.** Rule-set selection (`compliance`). Signal gating (`declaration-security-baseline`, `declaration-premise-conflict`). Expectation parameterization / cost thresholds where `advisoryDefaults` extras are stamped — present in bundled content for 2 of 46 packs plus any tenant overlay. For open-commitment, portfolio-recurrence, and cross-run diffs, packs are inert by design.
2. **Can each major finding trace the chain?** Engine/compliance: yes when `EvidenceRefs` / `PolicyRuleId` / disposition / audit are populated. Agent: only those surviving the emission gate. **Caveat this pass:** the suites that assert this do not compile.
3. **Would a skilled architect reproduce this without ArchLucid?** No for the governed package, repeatability, and audit reconstruction. Largely yes for analytical content.
4. **AI-generated vs governed infrastructure?** AI: agent findings, cost narratives, comparison explanations. Governed: policy filtering, graph stamp, sealed manifests, replay, audit, approvals, disposition, ITSM correlation.
5. **What would prove the moat?** Two tenants, identical architecture, different packs **including the pack that carries an expectation extra**, materially different findings/severities/gate/sponsor totals — captured as an artifact. Mechanism and script exist; the artifact does not.
6. **Fastest validation?** In **G-REAL-06**, run one architecture twice under two governance postures, and once with the expectation-extra pack assigned.
7. **Demo that makes the moat obvious?** Toggle one pack; show findings, severity, pre-finalize verdict, and audit entry change on one screen — then show the expectation-extra pack adding Identity to missing categories. Ride **M-07** for the capture.

---

## 11. Principal Architect Dismissal Test

**"I need this":** sealed, replayable review record; disposition lifecycle; overdue-commitment and expiring-waiver findings; Jira/ServiceNow correlation; a pack change that actually changes the review.

**Voluntary return:** portfolio-level state — recurrence across systems, waivers expiring this quarter. Cross-run memory is the retention mechanism, not critique quality.

**Immediate dismissal:** recognizing every finding as already-known — still the most likely trigger, though now **40–55%** on a first IaC-only review rather than v3's 45–60%, because trust-boundary and privileged-access engines fire on IaC-only uploads instead of staying silent, and the empty state explains itself when they cannot. Second trigger: Simulator-labeled canned output presented as Real. Third — and new this pass — a technically curious evaluator who looks at the repository's CI status and finds no green run on `master`. Fourth: being told "policy packs parameterize coverage," assigning one of the 44 packs without expectation keys, and seeing no extras.

**Would they believe ArchLucid is materially better than "Claude + a good prompt + my company standards pasted in"?** **For a single review: still no.** **For the tenth review across the fifth system with a governance board asking for the audit trail: yes.** Position *organizational repeatability*, not per-review insight. The sponsor is the buyer; the architect is the gatekeeper.

---

## 12. Founder Delusion Check

**Strongest assumption with weakest evidence:** that decision-changing insight density is a measurement and curation problem. Everything built for it measures or subtracts. The "miss" clause is now honestly documented as uncovered — which is progress in candor, not in density.

**Looks differentiated, already commodity:** generic critique, structural coverage, declaration parsing, retrieval depth.

**Looks ordinary, may be the strongest moat:** the disposition trail. Unglamorous bookkeeping that makes open-commitment, honest ROI, and the tenth review possible.

**Could burn months without improving the five outcomes:** more curated policy-pack *rules*; more UI route polish across 200+ open rows; Graph-RAG community summarization; more synthetic eval corpus.

**If features froze for six months:** repair the four test projects and three CI workflows (hours), run three real pilots, rewrite positioning around organizational repeatability.

**Most dangerous attractive distraction:** going from 39 to 60 coverage-style engines. Second most dangerous, and specific to this pass: **treating a shipped gate as a working gate.** The `master` push corset was built last pass to prevent exactly the Gate 5 regression that motivated it, was never verified end to end, pinned a nonexistent action tag, and has skipped its own typecheck job on five consecutive pushes. A gate that reports `failure` without executing is worse than no gate, because the red is attributed to the wrong cause.

**Most boring real moat:** audit catalog + disposition trail.

**This pass's correction:** v3's central claim — "the front door is currently uncompilable" — is **stale**; Gate 5 passes. The new trap is the mirror image: assuming that because the compile is fixed and the WK backlog is largely burned down, the tree is verified. It is not. Nothing on `master` has been automatically checked.

---

## 13. Competitive Reality Check & Moat Assessment

**What a skilled architect with frontier AI already does:** reads IaC, spots misconfigurations, critiques topology, produces a review document, cites standards from memory or paste.

**What ArchLucid does substantially faster/more consistently:** the same *shaped* package every time; evaluates the organization's enabled rule set; gates declaration findings and (for the packs that carry the keys) adds coverage/cost expectations; materializes actors from IaC so security engines fire without manual intake; preserves decisions/exceptions across reviews; reconstructs who decided what; correlates findings to tickets.

**Commodity within 12 months:** analytical content, retrieval depth, parsing.

**More valuable as AI improves:** every governance surface.

**Requires enterprise workflow:** SoD approvals, pre-finalize gating, audit reconstruction, disposition lifecycle, sponsor/operator separation.

**Requires customer-specific policy state:** enabled rule subset, priority floors, scope assignments, curated tenant rules, expectation extras.

**Current moat:** governed repeatability plus audit reconstruction, with a real (not decorative) policy filter on compliance and declaration, and default content that parameterizes coverage in a named pack. **Potential future moat:** portfolio-level architectural memory (partially built) plus expectation extras across the bundled FinOps/CIS set. **Weakest moat assumption:** that a buyer will generalize from the one pack that carries expectation keys to all 46. **Most durable:** audit reconstruction and disposition history cannot be prompted. **Probably illusory:** insight-density superiority over frontier models. **Boring but durable:** the audit catalog. **Buyer-obvious moat:** the §10.7 policy-toggle demo, captured.

---

## 14. Adoption & Monetization

**30-Day Voluntary Usage (10 principal architects).** Strongest positive: portfolio and commitment findings that accumulate. Strongest negative: the first review is still checklist-shaped. Most likely return reason: an expiring-waiver or recurrence finding that mattered. Most likely stop reason: recognizing every finding as already-known.

**Sponsor Purchase.** Strongest driver: audit-ready packaging that survives architecture, security, compliance, and board review. Strongest blocker: no completed pilot and no reference. Minimum proof: **G-REAL-06** → **G-REAL-07** → **M-39**. Likely objection: "our architects already use Claude."

**Why buy ArchLucid instead of more frontier-AI licenses?** Licenses give analysis; ArchLucid gives a *record*. More licenses do not give: which standards were evaluated on which system when; consistency across architects; exception/waiver lifecycle; audit reconstruction; ticket correlation; portfolio recurrence. The claim that ArchLucid finds things Claude cannot is **still not honest** as a blanket statement.

**Top 6 monetization blockers.** (1) No pilot proof — **G-REAL-06**; validation. (2) No case study/reference — **M-32**; validation. (3) Invoice/SOW incomplete — **G-COMMERCE-01**; owner. (4) Landing/demo assets not live — **M-07**/**M-09**/**M-16**; now unblocked, mechanical. (5) Depth objection from the technical evaluator — engine depth plus honest repositioning. (6) No green CI on `master` for a buyer who looks — implementation, hours.

**Top 6 enterprise adoption blockers.** (1) No pilot case study — trust; scale. (2) Connector/extractor credential setup — workflow fit; pilot. (3) Checklist-depth findings — buyer value; pilot. (4) Architects preferring their own tools — process; scale. (5) Procurement timing/assurance paperwork — trust; scale (`(B)`). (6) A contributor or evaluator cloning `master` and finding four test projects that do not build — trust; pilot.

---

## 15. Most Important Truth

**The compile break that dominated the last assessment is fixed, the policy mechanism now ships with default content that actually parameterizes coverage, and none of it is verified — because four test projects do not compile and all three CI workflows gating `master` are broken, each for a different and individually trivial reason.**

What is current: Gate 5 **PASS**; 39 engines still mostly coverage-shaped; density scoring still discarded for every typed engine via `typed-engine-protected`; golden corpus grown to 8 of 39 but sitting in a project with 24 compile errors; bundled packs now carrying expectation extras in 2 of 46; **G-REAL-06** still unstarted; `ci.yml` red on every PR from a `k8s.privileged` false positive; the WK-11 push corset skipping its own typecheck on an action tag that does not exist; CodeQL never completing. The honest position remains *organizational repeatability*, not superior insight. The most urgent work is not a design decision — it is a few hours of maintenance that would let the product's own claims be tested again.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

## 16. Stop Doing List

**Top 3 not worth doing before V1:** more curated policy-pack *rules*; Graph-RAG community summarization (ADR 0057: wait for pilot signal); more synthetic eval-corpus scenarios.

**Top 3 diminishing-returns areas:** UI route polish across 200+ open backlog rows; additional coverage-shaped finding engines (correctly held by `HOLD_NO_COVERAGE_ENGINES.md`); expanding compliance rule count past 791.

**Top 3 founder behaviors that delay validation:** treating assessment scores as the progress metric instead of pilot outcomes; **shipping a CI gate without watching one run of it go green end to end**; adding engines because they are tractable.

**Top 3 features that feel enterprise-important but may not improve V1 adoption:** MCP membrane; CloudEvents webhooks; multi-region active/active.

## 17. Top Improvement Opportunities

Gate 5 is **PASS**, so this section leads with the verification blackout (which is what makes every other claim untestable), then market validation. Engineering items below are in-contract and verified-broken this pass by execution, not by doc reading.

**Shipped this cycle — do not re-open:** Operate help catch-all restore + operate-module source-shape test; continue-last array-guard family (`continue-last-list-guard.ts`); `DeclarationIdentityActorMaterializer` + `declaration-identity-actors` pipeline stage; golden harness declaration engines (6→8); bundled `expectation.topologyCategories.add` and `cost.requireBudgetCap` seeds; `SimulatorModeAiOperationNotice` on findings/export paths; dual-finding export headings + `FINDING_STREAM_PRODUCT_OF_RECORD.md`; `ActorDependentFindingsQuietEnginesHint`; `HOLD_NO_COVERAGE_ENGINES.md`; `INSIGHT_DENSITY_MISS_CLAUSE.md`; `POLICY_PACK_DELTA_DEMO_SCRIPT.md` policy-toggle section; CodeQL C#/JS structural fixes + `CODEQL_TRIAGE.md` suppression table.

### Tier 1 — Must Fix / Must Validate

**1. Unblock the PR gate: allowlist the gitleaks false positive.**
Tier 1 · **Why it matters:** one false-positive finding fails `Security: gitleaks (secret scan)` on **every** PR, which cascades into `.NET: fast core (corset)` reporting `dotnet-fast-core-build:skipped`. The whole PR quality signal is dark because of one string literal. · **Expected impact:** restores 59-job PR CI. · **Affected qualities:** Correctness (58), Runtime (63). · **Evidence:** run [33021196359](https://github.com/joefrancisGA/ArchLucid/actions/runs/33021196359) — `RuleID: generic-api-key`, `File: ArchLucid.Decisioning/Analysis/DeclarationPremiseConflictClassifier.cs`, `Line: 242`; source line 243 is `propertyKey = "k8s.privileged";`. · **Actionability:** high. · **Design uncertainty reduced: 8** · **Market uncertainty reduced: 1** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** `gitleaks` reports `leaks found: 1` on every PR — `generic-api-key` at `ArchLucid.Decisioning/Analysis/DeclarationPremiseConflictClassifier.cs:243`, where the matched literal is `propertyKey = "k8s.privileged";` (a Kubernetes declaration property-key name, not a credential). The gitleaks job failure cascades to `.NET: fast core (corset)` (`dotnet-fast-core-build:skipped`). **Desired behavior:** `gitleaks detect` exits clean; PR CI runs the .NET fast-core shards. **Scope boundaries:** add a new `[[allowlists]]` block to `.gitleaks.toml` following the existing eight path-only blocks (same `description` style naming the false-positive class: declaration property-key names, never credential values). Do **not** broaden an existing allowlist to cover unrelated paths, do **not** add a global regex allowlist, and do **not** rename the source symbol just to dodge the scanner. **Acceptance criteria:** `gitleaks --config .gitleaks.toml --redact --source . detect` exits 0 locally; PR CI gitleaks job green. **Tests:** none required; if a config-lint test enumerates allowlist blocks, update it. **Non-goals:** rewriting git history; changing the classifier logic.

**2. Repair the 46 test compile errors across four projects.**
Tier 1 · **Why it matters:** `ArchLucid.Decisioning.Tests` (24), `ArchLucid.Api.Tests` (14), `ArchLucid.Persistence.Tests` (4), `ArchLucid.Core.Tests` (4) do not build. The merge-blocking golden corpus (now 8 engines), the citation/provenance suites, and the API contract tests therefore assert nothing on `master`. · **Expected impact:** ship gates 2 and 4 can return to executed PASS rather than "mechanism, unverified." · **Affected qualities:** Correctness (58), Governed Review Integrity (78), Runtime (63). · **Evidence:** per-project `dotnet build` this pass; `Directory.Packages.props` pins FluentAssertions `8.10.0`. · **Actionability:** high, mechanical. · **Design uncertainty reduced: 9** · **Market uncertainty reduced: 1** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** four test projects fail to compile on `master`. Two distinct causes: (a) **26 × CS1061** from FluentAssertions 8.10.0 renames — `BeGreaterOrEqualTo` → `BeGreaterThanOrEqualTo`, `BeLessOrEqualTo` → `BeLessThanOrEqualTo`, `HaveCountGreaterOrEqualTo` → `HaveCountGreaterThanOrEqualTo`; (b) **20 × CS1503** in `ArchLucid.Decisioning.Tests/Governance/GovernanceWorkflow*PropertyTests.cs` — argument 5 passes `CancellationToken` where the current signature expects `string?`. **Desired behavior:** `dotnet build` exits 0 for `ArchLucid.Decisioning.Tests`, `ArchLucid.Api.Tests`, `ArchLucid.Persistence.Tests`, `ArchLucid.Core.Tests`, and `dotnet test` runs. **Scope boundaries:** rename assertion methods to the v8 API only — do **not** downgrade the FluentAssertions package, and do **not** weaken any assertion (an `AtLeast`/`AtMost` bound must keep the same bound and direction). For the CS1503 sites, read the current production signature and pass the correct positional argument; if a caller genuinely needs to pass a cancellation token, use the correct overload rather than reordering production parameters. Per repo convention: **no `ConfigureAwait(false)` in tests**. **Acceptance criteria:** all four projects build with 0 errors; `dotnet test ArchLucid.Decisioning.Tests --filter "FullyQualifiedName~GoldenCorpus"` runs and passes; no test is skipped or deleted to achieve the build. **Tests:** existing tests must pass unmodified in intent. **Non-goals:** adding new test coverage; changing production signatures to suit callers; touching `ArchLucid.Application.Tests` or `ArchLucid.KnowledgeGraph.Tests` (both already build clean).

**3. Make the `master` push corset actually run, and let CodeQL finish.**
Tier 1 · **Why it matters:** `ui-typecheck-on-push.yml` (added last pass to catch exactly the Gate 5 regression that motivated it) pins `gacts/gitleaks@v2`, which does not resolve; its gitleaks job errors at "Set up job" and the dependent `Operator UI: typecheck (blocking)` job is **`skipped`**. Five consecutive `failure` conclusions, zero typechecks executed. Separately, every `codeql.yml` run on `master` is `cancelled` by `cancel-in-progress`, so no SARIF verdict exists. · **Expected impact:** the corset does its job; CodeQL produces a completed verdict for the C#/JS fixes that just landed. · **Affected qualities:** Runtime (63), Correctness (58). · **Evidence:** run [33021229748](https://github.com/joefrancisGA/ArchLucid/actions/runs/33021229748) — `Unable to resolve action gacts/gitleaks@v2`, typecheck job `skipped`; `ci.yml:89` pins the same action at `@v1.3.2` and resolves. · **Actionability:** high. · **Design uncertainty reduced: 8** · **Market uncertainty reduced: 1** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** `.github/workflows/ui-typecheck-on-push.yml` line 23 uses `gacts/gitleaks@v2` (nonexistent tag) → gitleaks job fails at setup → `ui-typecheck` job (`needs: gitleaks`) is skipped, so the blocking typecheck never runs. `.github/workflows/codeql.yml` on `master` push is always cancelled by `cancel-in-progress` concurrency. **Desired behavior:** on a `master` push, the UI typecheck job actually executes and its result is the workflow's verdict; CodeQL completes at least on `master`. **Scope boundaries:** repin the corset's gitleaks step to `@v1.3.2` to match `ci.yml`. Reconsider whether the corset needs a gitleaks job at all given `ci.yml` already runs one — if it stays, it must not be able to skip the typecheck for an infrastructure reason (prefer removing the `needs:` coupling or making gitleaks non-blocking there). For CodeQL, scope `cancel-in-progress` so pushes to `master` are not cancelled (e.g. make the concurrency group ref-and-event aware, or set `cancel-in-progress: ${{ github.ref != 'refs/heads/master' }}`). Do **not** delete the SARIF gate, weaken `assert_codeql_sarif_clean.py`, or disable the typecheck. **Acceptance criteria:** one push to `master` produces a run where `Operator UI: typecheck (blocking)` has conclusion `success` (not `skipped`); one CodeQL run on `master` reaches `completed` with a real conclusion. **Tests:** n/a (workflow change) — verify by observing one real run. **Non-goals:** moving the full `ci.yml` matrix onto push; changing branch protection.

**4. Execute three real-mode pilot runs (G-REAL-06) and collect packets (G-REAL-07 / M-39).**
Tier 1 · **Why it matters:** every commercial diagnostic in §3 is offline-derived. With Gate 5 green, **no engineering defect blocks this any more** — items 1–3 are about trusting the tree, not about running a pilot. · **Expected impact:** replaces opinion with observed insight density, dismissal triggers, and ROI credibility. · **Affected qualities:** Insight Density (67), Time-to-Value (76), Proof-of-ROI (76), Decision Advantage (66). · **Evidence:** GTM rows Not started; no `PROOF_PACKET_RUN_LOG` G4 rows. GTM estimate 4–6 h active, wall 1–2 days. · **Actionability:** owner-executed; agent-assistable for scripts and packet assembly. · **Design uncertainty reduced: 2** · **Market uncertainty reduced: 9** · **Classification: validation first.**

*Validation plan, not a Cursor prompt.* Run one architecture three times: (a) baseline posture; (b) second governance posture with a different pack; (c) with the pack that carries `expectation.topologyCategories.add`. Record per run: findings by engine family, which findings the architect had already identified, which changed a decision, and wall-clock to a committed package. That single design answers §10.6 (does policy-aware review change decisions), gives §7.1 a real density number, and produces the §8-item-8 moat artifact as a by-product.

### Tier 2 — High Leverage

**5. Fix the stale insight-density coverage claim (six → eight engines).**
Tier 2 · **Why it matters:** `docs/quality/insight-density-engine-distribution.md` plus `InsightDensityEngineDistributionCalculator` and `InsightDensityEngineDistributionMarkdown` hardcode "six golden-corpus engines; 33 built-in engines are absent." The harness registers eight. A document that publishes a `claimBoundary` should not understate its own coverage. · **Affected qualities:** Insight Density (67), Comprehension (79). · **Evidence:** `CreateEngines()` returns 8; generator string literals say six/33. · **Design uncertainty reduced: 5** · **Market uncertainty reduced: 1** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** the golden harness registers 8 engines (`RequirementFindingEngine`, `TopologyCoverageFindingEngine`, `SecurityBaselineFindingEngine`, `SecurityCoverageFindingEngine`, `ComplianceFindingEngine`, `CostConstraintFindingEngine`, `DeclarationSecurityBaselineFindingEngine`, `DeclarationPremiseConflictFindingEngine`), but `InsightDensityEngineDistributionMarkdown` emits "This corpus exercises **six** golden-corpus engines; **33** built-in engines are absent" and the `<remarks>` on `InsightDensityEngineDistributionCalculator` says the same. **Desired behavior:** the counts are derived, not hardcoded — the markdown states the actual number of engines present in the distribution and the actual number of registered engines absent (from `BuiltInFindingEngineTypeCatalog`, currently 39). **Scope boundaries:** do **not** change `typed-engine-protected` behavior, demotion thresholds, or the advisory-only `claimBoundary` framing. Regenerate `docs/quality/insight-density-engine-distribution.md` from the updated generator rather than hand-editing the number. **Acceptance criteria:** a unit test asserts the emitted count matches the engine count actually present in the distribution rows, so adding a ninth harness engine cannot leave the doc stale. **Tests:** extend `InsightDensityEngineDistributionCalculatorTests` (note: this project currently does not compile — depends on Tier 1 item 2). **Non-goals:** expanding the harness further; changing the gate.

**6. Name the expectation-extra pack explicitly in demo and GTM copy.**
Tier 2 · **Why it matters:** bundled `advisoryDefaults` now carry expectation extras in **2 of 46** packs. "Policy packs parameterize coverage" is true for those two and false for the other 44. A buyer who assigns the wrong pack and sees no extras concludes the mechanism is decoration. · **Affected qualities:** Differentiability (84), Comprehension (79). · **Evidence:** 45 × `priorityFloor`, 1 × `expectation.topologyCategories.add`, 1 × `cost.requireBudgetCap`. · **Design uncertainty reduced: 4** · **Market uncertainty reduced: 5** · **Classification: V1.1.**

**7. Consider injecting `IEffectiveGovernanceLoader` into the golden harness.**
Tier 2 · **Why it matters:** `GoldenCorpusHarness.CreateEngines()` still constructs `FileComplianceRulePackProvider` directly, so the merge-blocking path does not stamp production governance extras — the harness proves less than the production pipeline. · **Affected qualities:** Governed Review Integrity (78), Correctness (58). · **Evidence:** `CreateEngines()` this pass. · **Design uncertainty reduced: 6** · **Market uncertainty reduced: 2** · **Classification: V1.1.** Depends on Tier 1 item 2.

**8. Capture the policy-toggle artifact and the 6–8 operator screenshots (M-07).**
Tier 2 · **Why it matters:** unblocked now that Gate 5 passes; gates **M-09** and **M-16**. Fold the §10.7 policy-toggle screens into the same capture session so the moat gets a buyer-facing artifact for free. · **Classification: validation / owner-output.** · **Market uncertainty reduced: 6.**

### Tier 3 — Hold For Reassessment

**9. One deep engine in resilience or segmentation semantics.** Hold until **G-REAL-06** indicates which category buyers argue about. `HOLD_NO_COVERAGE_ENGINES.md` already records this decision. **Classification: validation first.**

**10. Real frontier transcripts for the insight-density corpus.** Harness exists; corpus is synthetic. Requires a real architecture. **Classification: validation first.**

**11. Owner decision: should density scoring apply to engine findings?** `typed-engine-protected` may be correct. Keep the distribution report explicitly advisory. **Classification: blocked on user input.**

**12. Owner decision: should the UI show one finding total or two?** The dual stream is now documented and labeled, which is the honest mitigation. Whether a sponsor surface should show only the product-of-record total is a positioning call. **Classification: blocked on user input.**

## 18. Prompt Batching Guidance

**First batch — safe-for-Sonnet, do these before anything else.** Tier 1 item 1 (gitleaks allowlist), then item 3 (workflow repins). Both are small, and together they turn the CI signal back on so item 2's fix can be verified by CI rather than by local build.

**Second batch — safe-for-Sonnet with review.** Tier 1 item 2 (46 test compile errors). Mechanical but assertion-sensitive: a careless rename can silently invert a bound, so review the diff for direction-preserving changes.

**Third batch — safe-for-Composer.** Tier 2 item 5 (derive the six/eight counts) after batch 2 restores the test project. Then Tier 2 item 8 (screenshot + policy-toggle capture).

**Fourth batch — owner + Opus.** Tier 1 item 4 (**G-REAL-06**). Not a coding-agent substitute for live architecture judgment.

Do **not** batch "restore the help catch-all," "add continue-last array guards," "materialize actors from IaC," "seed expectation `advisoryDefaults`," or "add declaration engines to the golden harness" — all are already in tree as of this pass.

## 19. Model Usage Guidance

**Composer-safe:** screenshot capture (**M-07**), snapshot regeneration, the six/eight count derivation, copy cleanup.

**Sonnet-safe (default):** gitleaks allowlist entry, workflow repins and concurrency scoping, FluentAssertions rename sweep, GTM drafting.

**Strong-model-recommended:** the 20 `CS1503` `GovernanceWorkflow*PropertyTests` signature fixes (they touch governance workflow semantics, and the right fix may be an overload choice rather than an argument swap); any change to policy filtering, authority pipeline, scope resolution, or evidence-graph semantics.

**Opus-or-Gemini-assessment-recommended:** this class of assessment; **G-REAL-06** finding-quality interpretation; the positioning decision in §20.

## 20. Pending Questions For Later

**Blocks V1:** nothing that is an owner *decision*. Remaining V1 execution: the CI/test repair (Tier 1 items 1–3), **G-REAL-06**, **G-COMMERCE-01**.

**Blocks V1.1:** Should the remaining 44 bundled packs ship expectation extras, or stay `priorityFloor`-only with extras as a tenant-overlay concern?

**Requires customer validation:** Which analytical category do buyers actually argue about? Does policy-aware review change a real decision (§10.6)?

**Requires founder decision:** (a) Lead with *organizational repeatability* rather than *superior insight*? (b) Keep `typed-engine-protected` as a hard bypass? (c) Should sponsor surfaces show one finding total or two, now that both streams are labeled? (d) Should the `master` push corset grow beyond typecheck (e.g. a build of the four test projects) once it demonstrably runs?

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

The repository continues to demonstrate serious principal-architect judgment in unglamorous places, and this pass added several: an explicit `INSIGHT_DENSITY_MISS_CLAUSE.md` that writes down the pillar weakness the product has not solved rather than burying it; a `HOLD_NO_COVERAGE_ENGINES.md` memo that refuses the tractable-but-useless work of adding more coverage engines; a `FINDING_STREAM_PRODUCT_OF_RECORD.md` note that resolves the dual-finding ambiguity by naming an authority instead of hiding one stream; a findings empty-state that explains *why* security engines were quiet instead of letting silence read as a clean bill of health; a `CODEQL_TRIAGE.md` suppression table with per-row justification and dates. The additive-floor expectation extras still cannot drop heuristic pillars, the fail-open governance stamp still does not fail the review, and the `claimBoundary` markers still refuse victory claims over named frontier models.

The taste failure has moved. It is no longer proportion in the product — 8 of 39 engines in the harness and 2 of 46 packs with expectation keys are both real, honest increments. It is **proportion in verification**. This pass found a gate created specifically to prevent a regression, shipped without one observed green run, pinned to an action tag that does not exist, silently skipping the only job that mattered across five pushes; a PR gate dark for weeks on a `k8s.privileged` string literal; and a dependency upgrade merged with two-thirds of its call sites migrated. The instinct to write down what the product cannot do is excellent and rare. The discipline of watching your own gate go green once before trusting it is missing, and it is the cheapest thing on this list to fix.
