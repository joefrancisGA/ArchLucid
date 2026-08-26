# ArchLucid Strategic Release and Market Readiness Assessment (v3)

**Pass date:** 2026-08-26. **Computed fresh** — no carry-forward, no score deltas, no rescore ratchet. The prior pass (2026-07-05, with ~7 weeks of appended rescore deltas) is archived at [`../archive/assessments/LATEST_GPT55-2026-07-05-superseded.md`](../archive/assessments/LATEST_GPT55-2026-07-05-superseded.md) and is **not** canonical.

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Claude Opus, simulator-aware; **no live Azure OpenAI call was made during this pass**, so all agent-path judgments are about mechanism and default configuration, not observed real-mode output.

**Source materials inspected this pass:** `V1_SCOPE.md`, `V1_DEFERRED.md`, `ASSESSMENT_QUALITY_MODEL.md`, `ASSESSMENT_INPUTS.md`, `.cursor/rules/Assessment-Scope-V1_1.mdc`, `CONFIGURATION_REFERENCE.md`, `DEFAULT_POLICY_PACKS_V1.md`, `TECH_BACKLOG_OPEN.md`, `GTM_BACKLOG.md`, plus direct code reads of `DeterministicInsightDensityGate`, `PolicyFilteredComplianceRulePackProvider`, `ComplianceRulePackGovernanceFilter`, `BuiltInFindingEngineTypeCatalog`, `ServiceCollectionExtensions.Decisioning`, `GoldenCorpusHarness`, `AgentArchitectureFindingEmissionGate`, `ShipGateEvidenceRunner`, `PremiumInsightDensityLlmJudge`, `PortfolioRecurrenceFindingEngine`, the `ContextIngestion` parser family, and the committed insight-density quality artifacts.

**Executed this pass (runtime evidence, not doc claims):**

- `dotnet test` — `ArchLucid.Decisioning.Tests` **808 passed / 0 failed**; `ArchLucid.Core.Tests` **1242 passed / 4 failed**; `ArchLucid.Application.Tests` **3831 passed / 8 failed** (3 skipped). **12 failing backend tests on trunk**, up from 11 at the start of this pass after rebasing onto commits that landed during it — the count is drifting upward, not holding.
- `npx vitest run` (`archlucid-ui`, 1137s) — **744 failed / 13365 passed** across **375 failed / 3021 passed test files**. The repo's own historical baseline (`.wave2-vitest-run.txt`) recorded **71** failures, so UI test failures have grown roughly **tenfold**.
- `npx tsc --noEmit -p tsconfig.build.json` — **147 TypeScript errors in production source** (not test-only roots). `next.config.ts` sets `typescript.tsconfigPath` but does **not** set `ignoreBuildErrors`, so **`next build` fails on `master`**. `@/components/OperatorShellMessage` is imported by `src/app/error.tsx` and four other modules and **does not exist**.

Verified counts by direct inspection: **39** registered finding engines, **45** bundled policy-pack content files, **791** rules in `ga-starter-compliance.rules.json`, **6** engines in the golden-corpus harness, **398** audit event-type constants.

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows. Excludes GTM V1.1 items **#2/#3/#5/#6** (**M-90**/**M-44**/**M-91**/**M-92**) per standing exclusion rule, and excludes owner assurance programs **G-REAL-05** / **G-ASSURANCE-02** from `(A)` scoring (they appear here only because they are human-executed).

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|-----------------|--------------------|--------------------|
| 1 | **Unblock trunk: restore the UI build, then green the tests** (no GTM ID — engineering, but needs owner priority call) | The UI does not compile (147 build errors) and 12 backend + 744 UI tests fail. No demo, screenshot, pilot, or proof packet is possible from here. Everything below depends on it. | Yes — fully | **Opus** for the 147 build errors (null-safety and generics variance across 60+ files; a weak fix silences rather than resolves), then **Sonnet** for test triage |
| 2 | **G-REAL-06** — three real-mode pilot runs | Dominant deficiency driver. Every insight-density, ROI, and purchase-probability number in this report is offline-derived and stays low-confidence until this runs. | Partial — agent can prepare scenarios, run scripts, capture packets; owner must supply real architecture + judgment | **Opus** — pilot design and finding-quality interpretation materially change the conclusion |
| 3 | **G-REAL-07** — proof packets + `PROOF_PACKET_RUN_LOG` | Depends on #2 output. Converts pilot runs into reusable buyer evidence. | Partial | **Sonnet** |
| 4 | **M-39** — apply proof-packet checklist, ≥3 G4 rows | Depends on #3. Stage 1 selling gate. | Partial | **Sonnet** |
| 5 | **M-07** — polished operator screenshots | Blocks **M-16** and **M-09**; cheapest asset that unblocks commercial motion. | Partial — agent can drive capture harness; owner picks final frames | **Composer** — high-volume mechanical capture |
| 6 | **M-09** — landing owner sign-off + deploy | In progress; gated on #5. No inbound motion without it. | Partial | **Sonnet** |
| 7 | **M-16** — demo video | Depends on #5. | Partial | **Sonnet** |
| 8 | **G-COMMERCE-01 / M-94** — invoice + SOW readiness (tax, entity, payment methods) | Revenue-blocking for the sales-led V1 motion; owner-only financial/legal setup. | No — human only | N/A — human only |
| 9 | **G-COMMERCE-02 / M-95** — first paid engagement on invoice/SOW path | Depends on #8 and on pilot proof from #2–#4. | No — human only | N/A — human only |
| 10 | **M-190 / M-191** — minimum pilot trust packet without CPA/3P assurance | Unblocks security review without waiting on SOC 2 CPA; pairs with #2. | Yes — drafting | **Opus** — procurement-facing framing |
| 11 | **M-196 / M-197** — honest SOC 2 / pen-test procurement talk-track | Prevents overclaim during first buyer security reviews. | Yes — drafting | **Opus** |
| 12 | **M-110** — Quick Scan AI go/no-go | Blocked on **TB-902** release gate; assessment posture is currently "SAFE TO EXPOSE: NO". Do not action before that gate. | Partial | **Sonnet** |
| 13 | **G-REAL-05** (SOC 2 CPA) and **G-ASSURANCE-02** (third-party pen test) | Owner assurance programs. Not `(A)` gates; listed for sequencing only. | No — human only | N/A — human only |

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 70.14%**

**Capped by two ship-gate failures.** Gate 4 (export generation) and Gate 5 (architect workspace) are both **FAIL** — see §4. Per the rubric, any FAIL caps headline readiness regardless of the weighted score. The decisive finding is that **the UI production build does not compile**: 147 TypeScript errors against `tsconfig.build.json` with no `ignoreBuildErrors` escape hatch, including a component (`OperatorShellMessage`) that is imported by the global error boundary and does not exist in the tree.

**70.14% is the uncapped weighted figure. The shippable state today is "not shippable" — the front end cannot be built for deployment.** This is not a subtle quality judgment; it is a compile failure. Everything else in this assessment is secondary to it.

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`: SOC 2 CPA attestation, third-party pen-test publication, signed design partner, owner-output GTM assets/cohorts, public extension SDK, MCP absence in V1, third-party plugin marketplace, assistive-technology participant testing, and sales-engineer-led LLM onboarding.

---

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 62 | 13 | 8.06 | **494** |
| 2 | Differentiability / Defensibility vs Frontier AI | 76 | 13 | 9.88 | 312 |
| 3 | Governed Review Integrity | 80 | 13 | 10.40 | 260 |
| 4 | Correctness & Evidence Integrity | 68 | 12 | 8.16 | 384 |
| 5 | AI / Agent Readiness | 73 | 10 | 7.30 | 270 |
| 6 | Time-to-Value | 62 | 10 | 6.20 | 380 |
| 7 | Proof-of-ROI Readiness | 72 | 9 | 6.48 | 252 |
| 8 | Sponsor / Operator Comprehension | 70 | 8 | 5.60 | 240 |
| 9 | Runtime & First-Review Reliability | 58 | 7 | 4.06 | 294 |
| 10 | Adoption Friction | 80 | 5 | 4.00 | 100 |
| | **(A) Headline readiness** | | **100** | **70.14%** | |

**Ranked by weighted deficiency:** Insight Density (494) · Correctness (384) · Time-to-Value (380) · Differentiability (312) · Runtime (294) · AI/Agent Readiness (270) · Governed Review Integrity (260) · Proof-of-ROI (252) · Comprehension (240) · Adoption Friction (100).

**Note on the shape of this scorecard.** Insight Density remains the top deficiency on a *structural* basis, but four pillars — Correctness, Time-to-Value, Runtime, and Comprehension — are all depressed by a single cause: the front end does not compile and its test suite has degraded tenfold. Those four are cheap to recover and should not be read as deep product problems. Insight Density is the only top-ranked deficiency that is genuinely architectural.

---

## 3. Diagnostic Scores (non-headline)

These do **not** feed the headline.

**Decision Advantage Score: 58/100.** Likelihood ArchLucid changes a decision frontier AI alone would not. Credit for policy-filtered compliance evaluation (a tenant's own enabled rule set determines which of 791+ rules fire — a frontier chat session has no equivalent persistent state), for the open-commitment engine (overdue deferrals and expiring waivers derived from governance history no single session can see), and for cross-declaration premise conflict. Discount because engine depth is predominantly graph-shape and checklist coverage rather than architectural judgment, and because the categories a principal architect actually argues about — resilience posture, segmentation semantics, IAM depth, observability — have no dedicated engines.

**Frontier-AI Survival Probability (12 months): 55–70%, moderate confidence.** Reference class: vertical governance/workflow wrappers around a commoditizing model layer. Base rate for such products retaining differentiation over 12 months is roughly 50–60% — most die because the wrapper's value was prompt engineering. Adjusted **upward** because the policy-pack→rule-filter→finding→decision→audit chain is persistent tenant state, which prompting cannot replicate, and because better base models make ArchLucid's findings better at zero engineering cost. Adjusted **downward** because the generic-critique portion of the value proposition is already commodity and the deterministic portion is shallow.

**30-Day Voluntary Usage Probability: 30–45%, low-moderate confidence.** Reference class: enterprise architecture tooling adopted voluntarily by senior individual contributors — base rate low (20–30%) because principal architects default to their own tools. Adjusted up for the sealed-package and audit-trail output that a chat session cannot produce; adjusted down because a Bicep- or Kubernetes-first architect currently gets thin findings on first use (§7.1), and because the default host mode is Simulator.

**Sponsor Purchase Probability: 25–40%, low confidence.** Reference class: net-new governance tooling purchased on the strength of a pilot, no reference customer, sales-led motion — base rate 20–35%. Adjusted marginally up for genuine audit and ROI packaging; held down by zero completed real-mode pilots. Confidence is low specifically because **G-REAL-06** has not run.

**Reconciliation with §2.** The headline (70.14%) sits above the Decision Advantage Score (58) and the purchase probability band (25–40%). That is not a contradiction — it is the central tension in this product. The headline measures *engineering delivery against the V1 contract*, and the backend half of that delivery is genuinely strong: governance, audit, tenancy, connector, and packaging surfaces are built and tested (Decisioning is green at 808 tests). The diagnostics measure *whether any of it changes a buying decision*, which is unproven and constrained by analytical depth. **A respectable headline with a mediocre decision-advantage score is the profile of a product that has built the container but not the contents — and right now the container's front door does not compile.**

---

## 4. V1 Ship Gate

The repo has a genuine automated ship-gate probe — `ShipGateEvidenceRunner` in `ArchLucid.Cli` maps 1:1 to these six gates and is exercised by `ShipGateEvidenceRunnerTests`, `ShipGateRoiCoherenceProbeTests`, `ShipGateExportMatrixProbeTests`, and `ShipGateFirstValueClaimLintProbeTests`. It requires a live API and a committed `runId`, neither of which is available in this environment (no SQL host), so gates that depend on live execution are honestly **UNKNOWN** rather than assumed PASS.

| # | Gate | Verdict | Evidence | Fastest resolution |
|---|------|---------|----------|--------------------|
| 1 | First review completes create → execute → commit → manifest + ≥1 artifact | **UNKNOWN** | `BuildGate1Async` probes run detail for committed status, manifest version, task/result counts; mechanism and tests exist. Not executed here — no SQL-backed API in this environment. | Run `archlucid pilot ship-gate-evidence` against a SQL-backed staging API with a committed run. |
| 2 | No hallucinated or uncited policy/evidence citations | **PASS (mechanism)** | Two real guards: `AgentArchitectureFindingEmissionGate` strips decision-grade agent findings lacking both `PolicyRuleId` and `EvidenceRefs`; `CitationIntegrityEvaluator` + bundled `citation_integrity_rules.v1.json` scores a committed run. Unit tests green. **Honest limit:** the probe's own text states "semantic hallucination audit remains manual." | Keep as PASS on mechanism; upgrade to evidence-backed after gate 1 runs live. |
| 3 | Sponsor summary / ROI coherent and not misleading | **PASS (mechanism)** | `ShipGateRoiCoherenceProbe` asserts `headlineSavingsScopeCode` labeling; `DispositionAwareRoiBasisCalculator` partitions waived/accepted/deferred/realized/rejected so the headline is not a naive sum; per-system-vs-headline divergence is documented as intentional. Tests green. | As above. |
| 4 | Export / package generation works (Markdown / DOCX / ZIP) | **FAIL** | Three export formatter tests fail on `master` right now: `EndToEndReplayComparisonExportServiceTests.GenerateMarkdown_default_profile_includes_separator_run_metadata_and_top_level_lists`, and the `..._executive_profile_emits_key_counts_not_full_run_metadata_section` variants in both `...ExecutiveAndRelationshipDiffTests` and `...SponsorAndRelationshipDiffTests`. Introduced by commit `3ebf8a7c78` ("Deduplicate interpretation notes in E2E comparison exports"), which removed formatter output lines without updating assertions. | Reconcile the formatter change with the three assertions — either the dedupe dropped required sections, or the tests encode superseded expectations. One focused fix. |
| — | *(trunk hygiene, not a numbered gate)* | **Attention** | Total trunk failures rose 11 → 12 during this pass. There is no required merge check on `ArchLucid.Core.Tests` / `ArchLucid.Application.Tests` / `ArchLucid.Decisioning.Tests`. | Make the three suites required checks after the 12 are fixed. |
| 5 | Architect workspace does not break during first-review / demo path | **FAIL** | **The UI does not compile.** `npx tsc --noEmit -p tsconfig.build.json` reports **147 errors in production source**; `next.config.ts` sets only `typescript.tsconfigPath`, not `ignoreBuildErrors`, so `next build` fails. `@/components/OperatorShellMessage` is imported by `src/app/error.tsx`, `SettingsRolesMatrixSection.tsx`, `ReplayFormView.tsx`, `ReplaySuspenseFallback.tsx`, and `Tier1InventoryZipValidationCallout.tsx` and **does not exist**. Vitest: **744 failed / 13365 passed** (375 failed files), against a historical baseline of 71 failures. Render-gate tests fail for `PolicyPacksPage`, `PlanningPage`, and `SearchPage`; `ReferenceError` on `PolicyPacksBuyerChrome` and `CompareComparisonDimensionsPreview`; `TypeError: Cannot read properties of null (reading 'runId')` in multiple places. | Restore `OperatorShellMessage` (or remove its imports), then clear the 147 build errors. Add `typecheck` and Vitest as required CI checks — the tenfold failure growth shows neither is currently gating. |
| 6 | Auth + tenant isolation behave correctly on the pilot path | **PASS (mechanism)** | `BuildGate6Async` runs `TenantIsolationNegativeTestOptions` cross-scope negative probes; database-per-tenant topology (ADR 0037) with app-layer scope predicates and `ScopeResolutionGuardMiddleware` fail-closed derivation on production-like hosts. | As above. |

**Two FAILs (gates 4 and 5) cap the headline.** Neither is an architectural defect — both are accumulated unguarded regression — but gate 5 is severe: the deployable front end does not build. Gates 1 and 6 could not be executed here, so the true state may be worse; nothing suggests it is better.

**Root cause across both failures is the same: no enforcing merge gate.** Backend failures drifted 11 → 12 during a single assessment pass. UI failures grew from 71 to 744. TypeScript errors reached 147 in production source. None of that happens with a required check.

---

## 5. Sponsor Summary

**(A) Overall headline readiness — 70.14%, capped by two ship-gate failures and a front end that does not compile.**

ArchLucid today is a working governed architecture-review system. An architect submits a structured request or uses guided intake, the system ingests documents and infrastructure declarations into a canonical graph, runs 39 deterministic finding engines over that graph, evaluates the tenant's *own enabled* compliance rules against it, produces a sealed manifest with an authority chain, and packages the result into exports, sponsor ROI rollups, and ITSM tickets — all against an append-only audit trail with database-per-tenant isolation. Governance is not decoration: the compliance rule set a review evaluates is filtered to what the tenant's policy packs actually enable, and tenants can author their own rules into that set. Approval workflow enforces separation of duties, the pre-finalize gate can block finalize on severity thresholds, and a dry-run surface shows what a policy change would do before it is published. Forty-five curated policy packs ship bundled.

The weakness is not the container — it is the contents. The deterministic engines are predominantly *coverage and structure* checks: does a node of this type exist, is there a PROTECTS edge, does the graph satisfy a rule-pack predicate. That is genuinely useful and genuinely repeatable, but it is not the analysis a principal architect spends a review on. There are no dedicated engines for resilience and disaster recovery, IAM depth, secrets and key lifecycle, network segmentation semantics, observability, or capacity. Two very common input formats — Bicep and Kubernetes manifests — parse into topology nodes but do not populate the properties the declaration-security engines read, so an Azure-native or Kubernetes-first team gets a materially thinner first review than a Terraform team. And the insight-density instrumentation built to measure differentiated output computes a score for every engine finding and then discards it: all 39 engines take the `typed-engine-protected` path and promote unconditionally.

Trunk is currently broken rather than merely imperfect. The UI production build fails with 147 TypeScript errors and a missing component imported by the global error boundary; 744 UI tests fail against a recorded baseline of 71; 12 backend tests fail, including three export formatter assertions and an audit dual-write pairing guard. Decisioning alone is fully green at 808 tests. None of this is deep — it is a few days of focused repair — but it means the product cannot be deployed or demonstrated today, and the absence of an enforcing merge gate is why it accumulated unnoticed.

**(B) Procurement / market realism (weight 0 in `(A)`).** Trust posture is honest: SOC 2 self-assessment plus roadmap, CAIQ/SIG/DPA templates, subprocessor register, an owner-conducted penetration exercise, an explicit published list of Azure roles ArchLucid will never request, and Tier 1 ingestion that requires no vendor access to a customer cloud. A CPA-issued SOC 2 report and a third-party pen-test summary do not exist and are correctly out of `(A)` — they will still create friction with hard-gate buyers, and the honest talk-track for that friction (**M-196**/**M-197**) is not yet written. The product has not been through a live buyer security review.

**Commercial picture.** The V1 motion is sales-led: a pricing page with real numbers, an order-form template, and a TEST-mode trial funnel. Live commerce un-hold (Stripe live keys, Marketplace `Published`, DNS cutover) is V1.1 owner-only and is not a V1 blocker. What *is* compelling today: audit-ready packaging and repeatability that a chat transcript cannot produce. What is unproven: that any architect voluntarily returns, and that any sponsor pays. Invoice/SOW readiness (**G-COMMERCE-01**) is not done, so even a willing first buyer has no clean path to pay.

**Enterprise picture.** Tenancy, RBAC, SCIM, SAML and OIDC, private endpoints, and audit coverage are at a credible enterprise bar. Hesitation will come from assurance paperwork and from the depth question a technical evaluator will ask in the first 20 minutes: "what did this find that I wouldn't have?"

**Engineering picture.** Strong in structure, **broken in execution right now.** The contract discipline is real and unusual for a product this young — OpenAPI snapshot gating, architecture invariant tests, configuration key catalogs, DDL discipline, a ship-gate evidence runner that returns FAIL rather than assuming success. Against that: the UI production build does not compile (147 errors), 744 UI tests and 12 backend tests fail, the golden corpus exercises 6 of 39 engines and 4 of 791 compliance rules, and the InMemory composition root cannot boot for OpenAPI and worker host tests because `IArchitectureIdentityRepository` is unregistered on that path.

The pattern is consistent and worth naming plainly: **elaborate guard infrastructure exists but is not wired as an enforcing gate.** The repo has drift guards, render gates, contract snapshots, a bundle-size baseline, and axe checks — and every one of those categories currently has failing members. Guards that do not block a merge are documentation, not enforcement. That single fix would have prevented the state this assessment found.

**Frontier-AI picture.** ArchLucid gets *more* valuable as base models improve, because better models produce better findings that flow into the same policy mappings and audit structures at zero engineering cost — but only if the deterministic layer is deep enough that the product is not merely a wrapper around whichever model is current.

---

## 6. Deferred Scope Uncertainty

**V1.1:** CloudEvents outbound webhooks and customer-operated recipe bridges; MCP read-only membrane; multi-region active/active; commerce un-hold. Deferral is safe for V1 — the V1 automation contract (REST, CLI, workspace, SCIM, CI decoration, first-party Jira/ServiceNow/Confluence/Slack/Teams) covers pilot needs. Seam needed: none new; the integration-event catalog already exists behind configuration.

**V2:** third-party pen-test program; SOC 2 CPA; automated tenant-erasure quarantine; Redis-as-default substrate; DTF / Container Apps Jobs. Safe for V1. Erasure has operator purge paths as the interim seam.

**Genuine uncertainty worth naming:** Graph-RAG community summarization stays deferred per ADR 0057 pending pilot signal, and Graph-RAG quality is self-flagged "unproven without a production vector index." This is a *market* uncertainty masquerading as an engineering one — do not build it before **G-REAL-06** says retrieval depth is the limiter.

---

## 7. Weighted Quality Assessment (detail)

Ordered by weighted deficiency signal.

### 7.1 Decision-Changing Insight Density — 62 · weight 13 · contribution 8.06 · deficiency 494

**Justification.** The product's own instrumentation is honest that this pillar is unaddressed. `docs/architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS.md` states the pillar clause "miss" is not covered: existing mechanisms penalize generic phrasing, prune weak Critic prose, and optionally LLM-judge — all **subtractive**. Nothing generates a non-obvious finding.

Three specific structural limits, each verified in code this pass:

1. **The density gate does not gate engine findings.** In `DeterministicInsightDensityGate.Score`, any candidate where `IsAgentArchitectureFinding` is false adds `typed-engine-protected` and returns `Promote` with `DecisionGradeFinding` unconditionally. The score is computed and discarded. All 39 engines take this path, so `docs/quality/insight-density-engine-distribution.md` (six engines, medians 60–100) is advisory only.
2. **Frontier baselines are not frontier baselines.** `tests/eval-corpus/insight-density-frontier-delta/README.md` states "these are **not** captured frontier-model transcripts," and the committed JSON carries a `claimBoundary` disclaiming that it is "evidence that ArchLucid beats any named frontier model." Three fixtures; the 100% novelty scenario is an empty baseline by construction.
3. **The ingestion→finding chain breaks for two major formats.** `BicepInfrastructureDeclarationParser` extracts only `resourceType`, `bicepSymbolicName`, `apiVersion` — no property body. Kubernetes mappers store `k8s.*` metadata only. `DeclarationSecurityBaselineClassifier` reads `tf.*` and ARM scalars exclusively. Net effect: Bicep and Kubernetes inputs yield topology nodes and near-zero declaration-security findings, silently (parse gaps log a warning and return an empty list).

Engine depth compounds this. The 25 graph-pure engines are dominated by coverage/gap/traceability checks over graph shape. Absent entirely: resilience and DR (no RPO/RTO engine), IAM depth, secrets and key lifecycle, network segmentation semantics beyond edge presence, observability, capacity. `TrustBoundaryFindingEngine` and `PrivilegedAccessFindingEngine` require `Actor` nodes that no ingestion path materializes from documents.

**Credit where due.** Three genuinely non-obvious sources exist: policy-filtered compliance (the tenant's enabled subset of 791+ rules), `OpenCommitmentFindingEngine` (overdue deferrals, unanswered evidence requests, expiring waivers from the governance trail — invisible to any single chat session), and `DeclarationPremiseConflictFindingEngine` (stated intent contradicting declared infrastructure). These are the seeds of real decision advantage.

**Tradeoffs.** Typed-engine protection was a reasonable choice — it prevents a heuristic from suppressing deterministic output. But it means density is unmeasured where most findings originate.

**Recommendations.** Make Bicep and Kubernetes populate the properties the declaration engines consume; build one genuinely generative engine in a category architects argue about (resilience or segmentation semantics); stop treating the frontier-delta harness as evidence until it runs against real transcripts.

**Classification:** V1 engineering (ingestion chain, one deep engine) + market validation (novelty measurement). **Affects outcomes 1, 3, 5.**

### 7.2 Correctness & Evidence Integrity — 68 · weight 12 · contribution 8.16 · deficiency 384

**Justification.** The evidence-integrity mechanisms are among the strongest things in the repo: `AgentArchitectureFindingEmissionGate` refuses decision-grade agent findings with neither a `PolicyRuleId` nor an `EvidenceRefs` entry; `CitationIntegrityEvaluator` scores a committed run against bundled rules; `FindingPayloadValidator` enforces typed payload shape; the citation contract requires cost lines to cite the extractor `manifest.json` `collectionTimestamp` and schema version. `ArchLucid.Decisioning.Tests` is fully green at 808 tests.

The deduction is empirical and fresh: **12 tests fail on `master` right now**, and the count rose from 11 to 12 during this pass as new commits landed — trunk is not merely red, it is drifting. In `ArchLucid.Core.Tests` (4): a ServiceBus app-property/operator-documentation guard, and three `CorePackageCoverageBatchRc27Tests` failures around legacy vendor alias resolution and a governance-promotion webhook schema sample. In `ArchLucid.Application.Tests` (8): three E2E comparison export formatter assertions, `CommitPathRedundantLoadContractTests` (commit orchestrator preloaded-governance contract), `BaselineMutationAuditDualWritePairingTests` (audit dual-write pairing guard), `TechnologyLedgerTopologyProposalSeederTests`, `KnowledgeModelClarificationAnswerApplicatorTests`, and `ReviewResultCacheSingleFlightTests` (leader-abort retry inside an aggregate exception). Three of these — the audit pairing guard, the commit-path contract, and the single-flight cache retry — are precisely the class of guard whose failure matters for evidence integrity and correctness under concurrency.

On the front end the picture is worse: **147 TypeScript errors in production source** and **744 failing Vitest tests** against a historical baseline of 71. Sixteen of those type errors are `TS18048`/`TS18047` null-safety violations ("possibly undefined" / "possibly null") in operator pages — a direct contradiction of the repo's own standing convention to always check nulls. Ten are `TS2304` (name not found), meaning code references identifiers that do not resolve at all.

The upward drift is a more important signal than any absolute number. Multiple agents are merging to trunk without an enforcing gate, so the failure set is a moving target and any proof packet captured today is captured against an unknown baseline.

Second deduction: the citation probe's own text concedes that **semantic** hallucination audit remains manual. The guards prove a citation *exists*, not that it supports the claim.

**Tradeoffs.** Presence-based citation checking is cheap, deterministic, and CI-safe; semantic verification would require a judge pass and cost.

**Recommendations.** Restore a compiling, green trunk before any pilot or demo, and make `dotnet test`, `npm run typecheck`, and Vitest required checks. Then decide whether semantic citation verification is worth a Premium judge pass on a sampled basis.

**Classification:** V1. **Affects outcomes 1, 2, 4.**

### 7.3 Differentiability / Defensibility vs Frontier AI — 76 · weight 13 · contribution 9.88 · deficiency 312

**Justification — rubric level: High, approaching Excellent on the compliance path.** This is where a surface reading of the codebase undersells the product, and it deserves precision.

`PolicyFilteredComplianceRulePackProvider` loads the full file-backed rule universe, resolves the *effective governance document* for the ambient tenant/workspace/project scope, merges tenant-authored curated rules via `TenantCuratedComplianceRulePackMerger`, then applies `ComplianceRulePackGovernanceFilter` so **only rules the tenant's policy packs reference and enable survive**, subject to a priority floor. Both the merger and the filter have unit tests. Concretely: changing a policy pack changes which of 791+ rules evaluate, which changes findings, which changes severity counts, which changes the pre-finalize gate outcome, sponsor ROI basis, and the audit record. That is the rubric's "Excellent" definition, and it is not reproducible by prompting — it requires persistent, versioned, per-scope tenant state.

Around it: 45 bundled packs, versioned rule sets with scope assignments, a dry-run delta surface showing what a policy change would do before publishing, approval workflow with separation of duties and SLA escalation, disposition-aware ROI partitioning, stable `FindingId` correlation into Jira/ServiceNow, and an append-only typed audit catalog.

**The deduction is narrowness, not absence.** Exactly one of 39 engines is policy-filtered. The other 38 — including everything structural, declaration-based, and cross-run — run identically regardless of the tenant's policy posture. So the moat is real but thin: it is a *compliance rule-set* moat, not a *review* moat. A buyer probing "does my standard change what this finds" gets an impressive answer for compliance and a much weaker one everywhere else.

**Tradeoffs.** Filtering compliance rules by governance is cheap and semantically clean because rules are already declarative. Extending policy awareness to structural engines needs a policy vocabulary those engines can consume — real design work, not a config flag.

**Recommendations.** Extend policy awareness to at least the security-baseline and declaration engines so the moat covers the findings buyers care about most. Build the demo moment where toggling one pack visibly changes findings, severity, gate outcome, and audit trail in one screen.

**Classification:** V1.1 engineering. **Affects outcomes 1, 2, 5.**

### 7.4 Time-to-Value — 62 · weight 10 · contribution 6.20 · deficiency 380

**Justification.** The designed pilot path is genuinely short and documented: configure, start, create review (wizard or CLI), execute, finalize, review package — six steps, nothing beyond step 6 required to call a pilot successful. Guided intake, ten indexed reference-architecture exemplars, sample/demo runs, and a `stack doctor` readiness router all reduce first-run friction.

The dominant deduction is that **the path cannot currently be walked in a deployed environment, because the UI does not build** (§4 gate 5). Time-to-value for a pilot that cannot be stood up is undefined. Behind that: the Bicep/Kubernetes ingestion gap (§7.1) means a large share of Azure-native evaluators reach a *credible-looking but thin* first review, which is worse than an obvious failure because it is not visibly wrong; extractor-based evidence requires credential setup before cost and inventory findings appear; and the open UI backlog is large, with owner screenshot scores in the 40–55/100 range on many affected routes.

**Recommendations.** Restore the build, then close the Bicep/Kubernetes property gap — that is the highest-leverage durable time-to-value fix because it changes what a new evaluator sees in the first ten minutes.

**Classification:** V1. **Affects outcomes 1, 3.**

### 7.5 AI / Agent Readiness — 73 · weight 10 · contribution 7.30 · deficiency 270

**Justification.** Operationally mature: clean real/simulator separation, `AuthorityRunOrchestrator` in the Application layer, `AgentResult` JSON schema validation with parse-time enforcement, quality-gate modes (`WarnOnly` / `PilotStrict`) with tenant override, tier escalation on retry, LLM budget reservation and monthly caps, prompt-cache prefix alignment, OTel counters on judge completions and cap skips, per-snapshot judge ceilings, and — as of this cycle — tenant-administrator control over judge and portfolio-recurrence engines with host-default fallback and audit events.

Deductions: default host mode is Simulator with canned agent output; `EnableLlmJudge` and `EnableLlmJudgeForEngineFindings` default false, so `WhyThisIsNotGeneric`, `PrincipalArchitectValue`, and `DecisionConsequence` are null on engine findings out of the box; Graph-RAG is bounded multi-hop with community summarization deferred and quality self-flagged unproven without a production vector index; iterative retrieve-critique-retry ships default off; the eval corpus is explicitly synthetic (49 scenarios, 44 hand-authored expected finding lists, 28 agent-result exemplars) and the nightly real-mode loop is offline exemplar scoring, not a live model tripwire.

**Recommendations.** Nothing new to build here before pilots. The gap is evidence, not mechanism.

**Classification:** V1 mechanism complete; validation required. **Affects outcomes 1, 5.**

### 7.6 Governed Review Integrity — 80 · weight 13 · contribution 10.40 · deficiency 260

**Justification.** The policy→evidence→finding→decision→audit chain is materially complete. Sealed golden manifests with an authority chain as the run of record; authority replay re-validating that chain with drift flags; append-only typed audit events (398 event-type constants in `AuditEventTypes.*`, well beyond the 78 the scope doc still claims) with CSV export; approval workflow with self-approval blocked, SLA tracking, and webhook escalation; pre-finalize gate blocking on severity thresholds; policy dry-run with redacted proposed-threshold audit payloads; disposition trail feeding both ROI basis and the open-commitment engine; ITSM correlation rows preserving stable `FindingId` across ticket lifecycle.

Deductions: the golden corpus constructs `FileComplianceRulePackProvider` directly, **bypassing the policy filter that is the core of the governance claim** — so the most differentiating behavior in the product has unit tests but no system-level regression coverage. The dual finding model also splits the chain: the sealed `FindingsSnapshot` carries engine findings while `AgentResult.Findings` carries the agent stream that buyer-facing exports often lead with, and only the former is inside the sealed record.

**Recommendations.** Add a golden-corpus case that exercises the policy-filtered provider with two different governance documents and asserts different findings. That single test converts the moat from "believed" to "guarded."

**Classification:** V1. **Affects outcomes 2, 4, 5.**

### 7.7 Proof-of-ROI Readiness — 72 · weight 9 · contribution 6.48 · deficiency 252

**Justification.** The layered model is well designed and honestly labeled: latest-committed-run-per-system selection, dedup by stable `FindingId`, tenant-rate and EA-discount adjusted per-finding savings, a disposition-aware portfolio headline that partitions waived/accepted/deferred/realized/rejected, explicit `headlineSavingsScopeCode` so multi-tenant and single-tenant totals cannot be conflated, a 30-day value-report window kept deliberately separate, and a board-pack export that delegates to the same service so it is identical by construction. The documented, intentional non-summation of per-system rows to the headline is the kind of honesty that survives a CFO reading it.

Deductions: AWS and GCP cost findings lack structured retail-price grounding (**TB-603**) and fall back to illustrative framing; GCP live catalog requires an API key with heuristic fallback when absent; and there are zero real pilot deltas, so every savings figure is model- or fixture-derived.

**Classification:** V1 residual + validation required. **Affects outcomes 3, 4.**

### 7.8 Runtime & First-Review Reliability — 58 · weight 7 · contribution 4.06 · deficiency 294

**Justification.** The designed runtime posture is solid: live/ready/health endpoints, `/version` attribution, correlation IDs, outbox with DLQ, idempotency records, run-execute ownership leases with reconciliation, stale in-flight run and missing-request remediators, budget cutoffs, hot-path cache with Redis auto-selection above one replica, Core Web Vitals field telemetry, First Load JS regression gating, and the `ShipGateEvidenceRunner` as an operational readiness instrument.

This score is nonetheless the second-largest drop in this pass, for three compounding reasons. First, **the front end cannot be built**, so first-review reliability in a deployed environment is not merely unverified — it is unreachable. Second, the **InMemory composition root cannot boot**: `OpenApiContractSnapshotTests` fails DI validation because `IArchitectureIdentityRepository` is registered only on the SQL path, and `WorkerHostStartupTests` carries explicit skips citing the same cause; a composition root that cannot start under its own test host is a latent reliability gap and it currently blocks OpenAPI contract regeneration. Third, the `first-load-js-baseline` guard is failing, so the bundle-budget regression gate is also red.

The honest reading is that reliability *mechanism* is strong and reliability *state* is poor. These are recoverable in days of focused work, not quarters — but they are not recoverable by planning.

**Recommendations.** Restore the UI build; register an InMemory `IArchitectureIdentityRepository` so the InMemory host boots and the OpenAPI snapshot gate is usable; then make the three backend suites, `typecheck`, and Vitest required checks.

**Classification:** V1. **Affects outcomes 2, 3.**

### 7.9 Sponsor / Operator Comprehension — 70 · weight 8 · contribution 5.60 · deficiency 240

**Justification.** Disciplined design system work: Carbon-derived tokens, neutral operator surfaces, `StatusTag`/`SeverityTag` with canonical vocabulary, enterprise tables, compact spacing scale, an operator typography scale, technical detail behind disclosure, in-app `/help/{topic}` routing rather than GitHub blobs, insight-density curation banner explaining suppression versus retention, and buyer-label vocabulary separating strict from warn-only quality modes.

Deductions this pass are heavier than design intent would suggest, because comprehension is measured on what renders. The `operator-client-pages-render-gate` suite — which exists precisely to assert that operator pages render their primary heading — fails for `PolicyPacksPage`, `PlanningPage`, and `SearchPage`. Buyer-polished shell tests fail with `ReferenceError` on `PolicyPacksBuyerChrome` and `CompareComparisonDimensionsPreview`. Axe accessibility checks fail on the same pages as a consequence. A `"ghost"` button variant is still referenced in `SettingsRolesMatrixSection.tsx` despite the design system having removed it, which is exactly the drift class the standard was written to prevent. Beyond the current breakage: the open UI backlog is large with many routes owner-scored 40–55/100, the dual finding model risks a sponsor seeing two differently-derived finding counts, and the "UI says one thing, enforced authority says another" defect class has been closed manually 17 times with the automated guard (**TB-882**) still held.

**Classification:** V1. **Affects outcomes 2, 4.**

### 7.10 Adoption Friction — 80 · weight 5 · contribution 4.00 · deficiency 100

**Justification.** Broad configuration surface with sane defaults: development bypass, JWT bearer against any OIDC issuer, native SAML 2.0 SP, API keys, SCIM 2.0 inbound with group→role mapping, RBAC across four roles, database-per-tenant provisioning, docker compose profiles, Terraform modules including Entra and Key Vault with same-apply RBAC, private endpoints and WAF, no SMB/445 exposure, `Integrations:Itsm:NativeEnabled` defaulting true, and CLI `doctor` / `support-bundle` for diagnostics.

Deductions: a customer cannot currently deploy the UI at all (§4 gate 5), which is the ultimate adoption friction; Tier 2 extractor paths need customer-provisioned credentials before inventory and cost value appears; connector authentication is still basic-auth/API-token MVP with OAuth as tightening backlog (**TB-600**). This pillar stays the highest-scoring because the *configuration surface* — the thing the pillar actually measures — remains genuinely broad and well-defaulted.

**Classification:** V1 residual. **Affects outcomes 2, 3.**

---

## 8. Top 10 Weaknesses

1. **The UI production build does not compile.** 147 TypeScript errors against `tsconfig.build.json`, no `ignoreBuildErrors` escape hatch, and a component imported by the global error boundary that does not exist in the tree. Design uncertainty, fully reducible. **Hard V1 blocker** and ship-gate FAIL — the product cannot be deployed. Fastest path: restore or remove `OperatorShellMessage`, then clear the remaining errors.
2. **No enforcing merge gate anywhere.** Backend failures drifted 11 → 12 inside one assessment pass; UI test failures grew from a recorded baseline of 71 to 744; production type errors reached 147. Each individual failure is small; the absence of a gate is the actual defect, and it will re-accumulate the moment this cleanup finishes. **V1 blocker.** Fastest path: make `dotnet test` on the three suites, `npm run typecheck`, and Vitest required checks.
3. **Deterministic substance is checklist-depth while the promise is judgment-depth.** The categories a principal architect argues about have no engines. Design uncertainty, reducible by building. **Not a V1 blocker** for the contract as written, but it is the binding constraint on outcomes 1 and 5 and the only top-ranked deficiency that is genuinely architectural. Fastest path: one deep engine in resilience or segmentation semantics, chosen after pilot signal.
4. **Bicep and Kubernetes inputs produce near-zero declaration-security findings.** Parsers do not populate what the classifiers read, and the failure is silent. Design uncertainty. **V1 blocker in practice** for Azure-native evaluators. Fastest path: extend property extraction to Bicep resource bodies and K8s spec fields.
5. **Insight-density measurement is pointed at synthetic data and gates nothing.** Typed-engine protection discards the score for all 39 engines; frontier baselines are self-declared non-transcripts. Mixed design/market uncertainty. Not a V1 blocker. Fastest path: capture real frontier transcripts for the corpus before treating novelty numbers as evidence.
6. **Zero completed real-mode pilots (G-REAL-06).** Purely market uncertainty — no amount of building reduces it. Not a V1 blocker; it is the blocker on every commercial diagnostic in §3.
7. **Golden corpus covers 6 of 39 engines and 4 of 791 compliance rules, and bypasses the policy filter.** The gate protects roughly a sixth of the engine surface and none of the differentiating governance path. Design uncertainty. Fastest path: one policy-filtered corpus case plus coverage for the declaration and cross-run engines.
8. **The policy-aware moat covers one engine of 39.** Differentiation is a compliance rule-set moat, not a review moat. Design uncertainty. Fastest path: policy vocabulary for security-baseline and declaration engines.
9. **Dual finding model splits substance between sealed and unsealed streams.** The auditable stream is the shallow one; the impressive stream is LLM-dependent and defaults to Simulator. Design uncertainty. Fastest path: decide which stream is the product of record and make exports lead with it.
10. **InMemory composition root cannot boot**, blocking OpenAPI contract regeneration and worker host tests. Design uncertainty, small fix. Fastest path: register an InMemory `IArchitectureIdentityRepository`.
11. **UI/authority drift is a defect class without a guard.** 17 manual closures, **TB-882** held — and the `"ghost"` variant still present in `SettingsRolesMatrixSection.tsx` is a live instance. Design uncertainty. It will recur until automated.

---

## 9. Frontier-AI Analysis

### Commodity vs Durable

| Capability | 12-month outlook | Reason / evidence |
|---|---|---|
| Generic architecture critique prose | **Commodity now** | Any frontier model produces comparable output from a good prompt; `GenericArchitectureAdvicePatterns` exists precisely to detect and penalize it |
| Graph coverage / structure checks | **Commodity within 12 months** | A model with a file-tree tool can enumerate missing pillars; the check is shape, not judgment |
| Declaration property extraction | **Commodity** | Models parse Terraform and ARM well already |
| **Tenant-specific enabled rule set driving evaluation** | **Durable** | `PolicyFilteredComplianceRulePackProvider` requires persistent, versioned, per-scope state; prompting cannot hold it across sessions or architects |
| **Sealed manifest + authority chain + replay validation** | **Durable** | Cryptographic run-of-record with drift detection is infrastructure, not inference |
| **Append-only typed audit reconstruction** | **Durable, more valuable over time** | Value compounds with history; a chat session has no audit surface |
| **Cross-run and portfolio state** (open-commitment, portfolio recurrence, cross-run diff) | **Durable** | Requires tenant history no session can see |
| **Approval workflow with separation of duties** | **Durable** | Organizational process, not model capability |
| ROI disposition-aware basis | **Durable-ish** | The math is simple; the *disposition state* it partitions on is persistent product state |
| Retrieval depth (Graph-RAG) | **Commodity within 12 months** | Long-context and native retrieval erode bounded multi-hop advantage |

### What resists prompting

Persistent policy state, evidence→finding→policy→decision→audit traceability, repeatability across different architects, role separation between sponsor and operator, disposition lifecycle, and remediation correlation into ITSM. None of these are model capabilities. What does **not** resist prompting: the analytical content of most current findings.

### Leverage / upside — the first-class bet

This is the strongest strategic argument available and it is currently under-exploited. Every base-model improvement flows through unchanged plumbing: a better model produces better agent findings, which map onto the same policy packs, land in the same sealed manifests, accrue the same audit trail, and feed the same ROI partitioning — at zero ArchLucid engineering cost. ArchLucid is structurally *long* frontier AI. The bet only pays if the deterministic floor is high enough that customers do not conclude the wrapper is all there is. Today the floor is checklist-height, which converts a leveraged bet into a dependency.

### Displacement timeline

One model release away from commoditization: generic critique quality, retrieval depth, declaration parsing, and structural coverage. Multiple releases away, or never, purely from model progress: policy state, audit reconstruction, approval workflow, disposition lifecycle, portfolio history.

Survival probability is in §3.

### Final verdict

**Not yet, but the trajectory is winnable.** ArchLucid is becoming more valuable roughly in step with frontier AI, not faster, because the durable half of the product — governance infrastructure — is largely built and improving slowly, while the commodity half — analytical content — is where the remaining effort is going and where models improve fastest. The way to get ahead of the curve is counterintuitive: invest in the *deterministic* floor (deeper engines, wider policy awareness, real ingestion fidelity) rather than in better prompting, because the deterministic floor is the part frontier AI does not erode.

---

## 10. Policy-Aware Governance Test

1. **Are policy packs first-class objects whose content drives behavior, or effectively inert?** **They drive behavior, for compliance.** `ComplianceRulePackGovernanceFilter` intersects the rule universe with the tenant's enabled rule IDs/keys and applies a priority floor; `TenantCuratedComplianceRulePackMerger` folds in tenant-authored rules. Verified in code and unit tests. For the other 38 engines, packs are effectively inert.
2. **Can each major finding trace input → evidence → policy → recommendation → decision → audit?** For compliance and engine findings: yes — `EvidenceRefs`, `PolicyRuleId`, typed payload, disposition trail, audit events. For agent findings: only those surviving `AgentArchitectureFindingEmissionGate`, which is the point of the gate.
3. **Would a skilled architect using frontier AI reproduce this consistently without ArchLucid?** No for the governed package, repeatability, and audit reconstruction. Largely yes for the analytical content of most findings.
4. **What is merely AI-generated analysis vs governed infrastructure?** AI-generated: agent architecture findings, cost narratives, comparison explanations. Governed infrastructure: policy filtering, sealed manifests, authority replay, audit catalog, approval workflow, disposition lifecycle, ITSM correlation.
5. **What evidence would prove the moat is real?** A single demonstration where two tenants with identical architecture and different policy packs receive materially different findings, severities, gate outcomes, and sponsor totals — captured as an artifact. The mechanism exists; the artifact does not.
6. **Fastest validation path that policy-aware review changes customer decisions?** In **G-REAL-06**, run one pilot architecture twice under two governance postures and ask the architect which output they would act on.
7. **What V1 behavior would make the moat obvious in a demo?** Toggle one policy pack and show findings, severity counts, pre-finalize gate verdict, and audit entry all change on one screen. This is buildable now and is the single highest-leverage demo asset.

---

## 11. Principal Architect Dismissal Test

**What makes them say "I need this":** the sealed, replayable review record with an audit trail they can hand to a governance board; the disposition lifecycle that survives across reviews; overdue-commitment and expiring-waiver findings that no chat session can produce; ticket correlation that closes the loop into Jira.

**What makes them voluntarily return:** portfolio-level state — "the same finding recurs across seven systems," "these three waivers expire this quarter." Cross-run memory is the retention mechanism, not critique quality.

**What causes immediate dismissal:** pasting their Bicep or Helm charts and getting topology nodes with no security findings. This is the most likely dismissal trigger and I would put it at **55–70%** for an Azure-native or Kubernetes-first architect today, calibrated against the verified gap between what the parsers extract and what the classifiers read. Second trigger: reading a findings list and recognizing every item as something they already knew — likelier than not given engine depth.

**Would they believe ArchLucid is materially better than "Claude + a good prompt + my company standards pasted in"?** **For a single review: no.** Pasting standards into a long-context model produces comparable or better analytical output today. **For the tenth review across the fifth system with a governance board asking for the audit trail: yes, clearly** — the pasted-standards approach has no persistence, no repeatability across architects, no disposition lifecycle, and no audit reconstruction. The honest positioning is therefore *organizational repeatability*, not per-review insight — and that is a harder sell to an individual architect, which is exactly why the sponsor is the buyer and the architect is the gatekeeper.

---

## 12. Founder Delusion Check

**Strongest assumption with weakest evidence:** that decision-changing insight density is a measurement and curation problem. Everything built for it — the deterministic gate, the LLM judge, the frontier-delta harness, the per-engine distribution report — measures or subtracts. The pillar's own prompt doc concedes the "miss" clause is unaddressed. If findings are not non-obvious, better measurement of their obviousness does not help.

**Looks differentiated, already commodity:** generic critique quality, structural coverage checks, declaration parsing, retrieval depth.

**Looks ordinary, may be the strongest moat:** the disposition trail. It is unglamorous bookkeeping, and it is the thing that makes the open-commitment engine possible, makes ROI honest, and makes the tenth review more valuable than the first. Frontier AI cannot have it.

**Could burn months without improving any of the five outcomes:** more curated policy-pack content (45 packs, 791 rules already — the constraint is that only one engine consumes them); more UI route polish across the 200+ open backlog rows; Graph-RAG community summarization; more synthetic eval corpus expansion.

**If features froze for six months, what most improves the five outcomes:** running three real pilots and rewriting the positioning around organizational repeatability instead of per-review insight.

**Most dangerous attractive distraction:** building more finding engines of the same shape. Going from 39 to 60 coverage-style engines moves no outcome and will feel like progress.

**Most boring thing that may be the real moat:** the audit event catalog and the disposition trail.

**Uncomfortable addition from this pass:** the assumption that parallel agent throughput on trunk is net-positive is unevidenced and currently looks false. In the window this assessment covers, trunk accumulated 147 production type errors, a deleted-but-imported component, and a tenfold growth in UI test failures — while the previous assessment file simultaneously grew a header of rescore deltas claiming steady improvement. Velocity was being measured; correctness was not. A required merge gate is the cheapest possible correction and it should precede any further feature work.

---

## 13. Competitive Reality Check & Moat Assessment

**What a skilled architect with frontier AI already does manually:** reads IaC and spots misconfigurations; critiques topology; produces a review document; cites standards from memory or paste.

**What ArchLucid does substantially faster or more consistently:** produces the same *shaped* package every time regardless of which architect ran it; evaluates the organization's enabled rule set rather than whatever the architect remembered; preserves decisions and exceptions across reviews; reconstructs who decided what and when; correlates findings to tickets.

**Commodity within 12 months:** analytical content, retrieval depth, parsing.

**More valuable as AI improves:** every governance surface, because better findings flow through unchanged plumbing.

**Requires enterprise workflow, not model intelligence:** approval separation of duties, pre-finalize gating, audit reconstruction, disposition lifecycle, sponsor/operator separation.

**Requires customer-specific policy state, not prompting:** the enabled rule subset, priority floors, scope assignments, curated tenant rules.

**Current moat:** governed repeatability plus audit reconstruction. Real, narrow, defensible. **Potential future moat:** portfolio-level architectural memory — cross-system recurrence, commitment tracking, drift over time. Partially built (`portfolio-recurrence` ships default off; `open-commitment` ships on). **Weakest moat assumption:** that policy-pack awareness differentiates review *broadly* — it currently differentiates compliance only. **Most durable moat assumption:** that audit reconstruction and disposition history cannot be prompted. **Probably illusory:** insight-density superiority over frontier models. **Boring but durable:** the audit catalog. **What would make the moat obvious to a buyer:** the one-screen policy-toggle demo in §10.7.

---

## 14. Adoption & Monetization

**30-Day Voluntary Usage (10 principal architects).** Strongest positive factor: portfolio and commitment findings that accumulate value with use. Strongest negative: a thin first review from Bicep/Kubernetes input. Most likely reason to return: an expiring-waiver or recurrence finding that mattered. Most likely reason to stop: recognizing every finding as already-known.

**Sponsor Purchase.** Strongest driver: audit-ready governance packaging that survives architecture, security, compliance, and board review — a defensible answer to "how do you know your architecture reviews happened and were consistent." Strongest blocker: no completed pilot, no reference. Minimum proof for a paid pilot: three real-mode runs with proof packets (**G-REAL-06** → **G-REAL-07** → **M-39**). Likely objection: "our architects already use Claude."

**Why buy ArchLucid instead of more frontier-AI licenses?** Because licenses give you analysis and ArchLucid gives you a *record*. More licenses do not give you: a governance board answer for which standards were evaluated on which system when; consistency across architects of different seniority; exception and waiver lifecycle with expiry; audit reconstruction of who approved what; ticket correlation closing findings to remediation; portfolio-level recurrence. That argument is honest today. The argument that ArchLucid finds things Claude cannot is **not** honest today, and using it will fail a technical evaluation.

**Top 6 monetization blockers.** (1) No pilot proof — sponsors cannot justify spend on a demo; overcome by **G-REAL-06**; validation. (2) No case study or reference; overcome by **M-32**; validation. (3) Invoice/SOW readiness incomplete (**G-COMMERCE-01**) — a willing buyer has no clean payment path; owner implementation. (4) Landing page and demo assets not live (**M-07**/**M-09**/**M-16**) — no top of funnel; mixed. (5) Depth objection from the technical evaluator who gatekeeps the sponsor; overcome by engine depth plus honest repositioning; implementation. (6) SOC 2 CPA absence for hard-gate buyers; `(B)` friction, overcome by **M-190**/**M-196** talk-track short of the report.

**Top 6 enterprise adoption blockers.** (1) No pilot case study — trust; scale blocker. (2) Connector and extractor credential setup — workflow fit; pilot blocker. (3) Thin findings on Bidep/Kubernetes-native estates — buyer value; pilot blocker. (4) Retrieval-depth and eval-realism due diligence from a sophisticated security or AI review — auditability; scale blocker. (5) Change management: architects must accept a governed workflow over their own tools — process integration; scale blocker. (6) Procurement timing and assurance paperwork — trust; scale blocker.

---

## 15. Most Important Truth

**ArchLucid has built a genuinely defensible governance container around an analytical core shallower than the frontier AI it means to surpass — and today it cannot ship at all, because the front end does not compile and nothing was gating that.**

Two truths, in order of urgency. The immediate one: 147 production type errors, a component imported by the global error boundary that does not exist, 744 failing UI tests against a baseline of 71, and a backend failure count that rose during this very assessment. That is not a quality opinion; it is a build failure, and it happened because a repo full of guard tests has none of them wired as required checks.

The deeper one: the governance infrastructure — policy-filtered rule evaluation, sealed manifests, authority replay, append-only audit, disposition lifecycle, approval separation of duties — is real, tested, and genuinely not reproducible by prompting. It is the moat and it is undersold. But the findings flowing through it are predominantly coverage and structure checks; two of the most common IaC formats produce almost no security findings; and the insight-density apparatus computes a score for every engine finding and discards it. The product's honest position today is *organizational repeatability*, not superior insight. Selling the latter will fail the first serious technical evaluation.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

## 16. Stop Doing List

**Top 3 improvements not worth doing before V1:** more curated policy-pack content (only one engine consumes it); Graph-RAG community summarization (ADR 0057 already says wait for pilot signal); more synthetic eval-corpus scenarios (realism is the constraint, not count).

**Top 3 diminishing-returns areas:** UI route polish across the 200+ open backlog rows; additional coverage-shaped finding engines; expanding the compliance rule count past 791.

**Top 3 founder behaviors that could delay validation:** treating assessment scores as the progress metric instead of pilot outcomes; adding engines because they are tractable rather than because they change decisions; letting trunk stay red while planning new work.

**Top 3 features that feel enterprise-important but may not improve V1 adoption:** MCP membrane; CloudEvents webhooks; multi-region active/active.

## 17. Top Improvement Opportunities

Ship gates 4 and 5 are FAIL, so validation-first ordering does not apply — trunk repair precedes everything.

### Tier 1 — Must Fix

**0. Restore the UI production build.**
Tier 1 · **Why it matters:** the deployable front end does not compile. Nothing downstream — pilot, demo, proof packet, screenshot, buyer conversation — is possible until it does. This is the single highest-priority item in this assessment. · **Expected impact:** unblocks ship gate 5 and every human task in §0. · **Affected qualities:** Runtime (58), Time-to-Value (62), Comprehension (70), Correctness (68). · **Evidence:** `npx tsc --noEmit -p tsconfig.build.json` → 147 errors in production source; `next.config.ts` sets `typescript.tsconfigPath` without `ignoreBuildErrors`; `@/components/OperatorShellMessage` imported by `src/app/error.tsx` and four other modules, absent from the tree. · **Actionability:** high. · **Design uncertainty reduced: 10** · **Market uncertainty reduced: 1** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** `archlucid-ui` does not compile. `npx tsc --noEmit -p tsconfig.build.json` reports 147 errors in production source (not test-only roots), so `next build` fails — `next.config.ts` sets `typescript.tsconfigPath: "tsconfig.build.json"` but does not set `ignoreBuildErrors`. The largest single cause is that `@/components/OperatorShellMessage` does not exist yet is imported by `src/app/error.tsx`, `src/app/(operator)/administration/users/_sections/SettingsRolesMatrixSection.tsx`, `src/app/(operator)/internal/validate-route/_sections/ReplayFormView.tsx`, `ReplaySuspenseFallback.tsx`, and `src/components/wizard/Tier1InventoryZipValidationCallout.tsx`. Error mix: 35 `TS2339` (property does not exist), 24 `TS2322` (type not assignable), 23 `TS2345` (argument type), 16 `TS18048` / 14 `TS18047` (possibly undefined / possibly null), 10 `TS2304` (name not found). **Desired behavior:** `npx tsc --noEmit -p tsconfig.build.json` reports zero errors and `next build` succeeds. **Scope boundaries:** determine whether `OperatorShellMessage` was deleted in error (restore it from history) or intentionally replaced (update all five import sites) — check `git log` before choosing, and state which in the commit message. Do **not** set `ignoreBuildErrors` or add `@ts-expect-error` to silence errors; fix the types. For the 30 null-safety errors, add real null checks rather than non-null assertions — the repo convention is to always check nulls. Replace the `"ghost"` button variant in `SettingsRolesMatrixSection.tsx` with `outline` per the visible-boundary button contract. **Acceptance criteria:** `npm run typecheck` clean; `npm run build` succeeds; no new `@ts-expect-error`, `any`, or non-null assertion introduced to reach it. **Tests:** none new required; existing Vitest suites must not regress further. **Non-goals:** fixing the 744 failing Vitest tests in this change (separate item); UI redesign; unrelated refactoring.

**1. Restore green trunk (12 backend tests, 744 UI tests) and add enforcing merge gates.**
Tier 1 · **Why it matters:** a ship-gate FAIL caps headline readiness and no proof packet or demo is credible from a red trunk. Backend failures rose 11 → 12 during this pass and UI failures have grown from a recorded 71 to 744, so fixes without gates will not hold. · **Expected impact:** unblocks gate 4; removes the cap; stops the drift permanently. · **Affected qualities:** Correctness (68), Runtime (58), Comprehension (70). · **Evidence:** `dotnet test` this pass — `ArchLucid.Core.Tests` 4 failed, `ArchLucid.Application.Tests` 8 failed; three export failures trace to commit `3ebf8a7c78`. Vitest 744 failed / 375 files. · **Actionability:** high. · **Design uncertainty reduced: 9** · **Market uncertainty reduced: 1** · **Classification: V1.**

> **Cursor prompt.** Trunk is red on `master` and the failure count is rising. Fix these 12 failing tests and add a merge gate. **Current problem:** (a) `ArchLucid.Application.Tests.Analysis.EndToEndReplayComparisonExportServiceTests.GenerateMarkdown_default_profile_includes_separator_run_metadata_and_top_level_lists` plus the `..._executive_profile_emits_key_counts_not_full_run_metadata_section` cases in `EndToEndReplayComparisonExportServiceExecutiveAndRelationshipDiffTests` and `EndToEndReplayComparisonExportServiceSponsorAndRelationshipDiffTests` — commit `3ebf8a7c78` removed interpretation-note lines from the markdown/HTML/DOCX/PDF formatters without updating these assertions; determine whether the dedupe dropped required sections (fix the formatter) or the assertions encode superseded expectations (fix the tests) and state which. (b) `ArchLucid.Core.Tests.Integration.PublisherIntegrationPayloadAndRecipeDocumentationGuardTests.ServiceBus_app_property_resolver_reads_alert_payload_keys_documented_for_operators`. (c) Three `ArchLucid.Core.Tests.CorePackageCoverageBatchRc27Tests` cases on legacy vendor alias resolution and the `GovernancePromotionActivated` webhook sample schema. (d) `ArchLucid.Application.Tests` — `Runs.Finalization.CommitPathRedundantLoadContractTests`, `Audit.BaselineMutationAuditDualWritePairingTests`, `Orchestration.TechnologyLedgerTopologyProposalSeederTests`, `ArchitectureIntelligence.KnowledgeModelClarificationAnswerApplicatorTests`, and `ArchitectureIntelligence.ReviewResultCacheSingleFlightTests.CoalesceAsync_retries_when_leader_abort_is_wrapped_in_aggregate_exception`. Then the UI suite: **744 failing Vitest tests across 375 files**, against a historical baseline of 71 in `.wave2-vitest-run.txt`. Triage by cause, not by file — the dominant clusters are (i) unresolved imports cascading from the missing `OperatorShellMessage` (fixed by item 0), (ii) `ReferenceError` on `PolicyPacksBuyerChrome` and `CompareComparisonDimensionsPreview`, (iii) 283 `TestingLibraryElementError` cases where expected elements no longer render, (iv) `TypeError: Cannot read properties of null (reading 'runId')` in operator pages, and (v) drift guards asserting CLI wiring that no longer exists (`archlucid-stack-doctor-drift-guard`, `archlucid-stack-drift-guard` both expect `case "stack"` in `ArchLucid.Cli/Program.cs`, which is absent — decide whether the CLI regressed or the guards are stale). **Desired behavior:** all three backend suites green, UI suite green or with an explicitly committed and justified known-failure allowlist, and CI jobs that fail the build when any regress. **Scope boundaries:** do not weaken or delete a guard test to make it pass — the audit dual-write pairing, commit-path contract, and single-flight retry tests exist to catch real regressions; if an assertion is genuinely obsolete, say so explicitly in the commit message. **Acceptance criteria:** `dotnet test` green on the three suites; `npm run typecheck` clean; Vitest green or allowlisted; all three wired as required checks. **Tests:** no new product tests required; update only where an expectation is provably superseded. **Non-goals:** unrelated refactoring; touching the insight-density or finding-engine code.

**2. Make Bicep and Kubernetes declarations feed the declaration-security engines.**
Tier 1 · **Why it matters:** the highest-leverage substance fix. Azure-native and Kubernetes-first evaluators — a large share of the target market — currently get topology nodes and near-zero declaration-security findings, and the gap is silent. This is simultaneously the top time-to-value fix and the top dismissal-risk fix. · **Expected impact:** materially more findings on the most common enterprise IaC inputs. · **Affected qualities:** Insight Density (62), Time-to-Value (70). · **Evidence:** `BicepInfrastructureDeclarationParser` extracts only `resourceType`/`bicepSymbolicName`/`apiVersion`; `KubernetesManifestCanonicalObjectMapper` stores `k8s.*` metadata only; `DeclarationSecurityBaselineClassifier` reads `tf.*` and ARM scalars exclusively. · **Actionability:** high. · **Design uncertainty reduced: 8** · **Market uncertainty reduced: 4** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** `DeclarationSecurityBaselineClassifier` and `DeclarationPremiseConflictClassifier` read canonical `tf.*` property keys and ARM scalars. The Bicep parser (`BicepInfrastructureDeclarationParser`) extracts only the declaration line, and the Kubernetes mappers (`KubernetesManifestCanonicalObjectMapper`) store only `k8s.*` metadata. Consequently Bicep and Kubernetes inputs produce topology nodes but almost no declaration-security findings, and parse gaps are silent (warning + empty list). **Desired behavior:** (1) Bicep parser extracts resource *body* properties into `CanonicalInfrastructurePropertyBag` under the same normalized key space the Terraform/ARM paths use, respecting the existing 24-key and 512-char caps and sensitive-key redaction. (2) Kubernetes mappers project security-relevant spec fields — `hostNetwork`, `privileged`, `runAsNonRoot`, `readOnlyRootFilesystem`, `allowPrivilegeEscalation`, NetworkPolicy ingress/egress presence, Service `type=LoadBalancer` — into the same key space. (3) Extend the declaration classifiers to recognize the added keys, including new signal families for K8s workload security and public LoadBalancer exposure. **Scope boundaries:** no new finding engine; reuse `DeclarationSecurityBaselineFindingEngine` and `DeclarationPremiseConflictFindingEngine`. Do not add a Bicep compiler dependency — stay line/body-scanning. Do not ingest Kubernetes `Secret.data`. **Acceptance criteria:** a Bicep fixture with a public-network-access property yields a declaration-security finding; a K8s fixture with `privileged: true` and no NetworkPolicy yields findings; existing Terraform/ARM behavior unchanged. **Tests:** new parser cases in `ArchLucid.ContextIngestion.Tests` for Bicep bodies and K8s security fields; new classifier cases in `ArchLucid.Decisioning.Tests`; at least one golden-corpus ingestion case. **Non-goals:** Helm templating, Kustomize overlays, Pulumi, CDK.

### Tier 2 — High Leverage

**3. Guard the policy-aware moat with a golden-corpus case.**
Tier 2 · **Why it matters:** the single most differentiating behavior in the product — policy-pack content changing which rules evaluate — has unit tests but no system-level regression, because `GoldenCorpusHarness` constructs `FileComplianceRulePackProvider` directly and bypasses `PolicyFilteredComplianceRulePackProvider`. A refactor could silently make the moat inert. · **Expected impact:** converts the moat from believed to guarded; also produces the artifact needed for the §10.7 demo. · **Affected qualities:** Governed Review Integrity (80), Differentiability (76). · **Evidence:** `GoldenCorpusHarness.CreateEngines()`; `PolicyFilteredComplianceRulePackProvider`. · **Design uncertainty reduced: 7** · **Market uncertainty reduced: 3** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** the golden corpus exercises `ComplianceFindingEngine` through `FileComplianceRulePackProvider`, so `PolicyFilteredComplianceRulePackProvider` — which merges tenant curated rules and filters the pack to the tenant's enabled rule set with a priority floor — has unit coverage but no end-to-end regression. **Desired behavior:** a golden-corpus case that runs one fixed architecture graph twice against two different `PolicyPackContentDocument` values and asserts the resulting `FindingsSnapshot` differs in a specified, committed way (different compliance findings, different severity counts). **Scope boundaries:** do not change production filtering behavior; add coverage only. Keep the existing six-engine harness path intact and add the policy-filtered path alongside it. **Acceptance criteria:** the new case fails if `ComplianceRulePackGovernanceFilter.Filter` is stubbed to return its input unchanged. Committed summary artifact under `docs/quality/` showing the two-posture delta. **Tests:** new case in `ArchLucid.Decisioning.Tests/GoldenCorpus`. **Non-goals:** expanding golden coverage to the other 33 engines in this change.

**4. Extend golden-corpus coverage past six engines.**
Tier 2 · **Why it matters:** the merge-blocking gate protects 6 of 39 engines, 4 of 791 rules, and zero effectful engines. Everything shipped recently — declaration premise conflict, portfolio recurrence, open commitment — has unit tests only. · **Affected qualities:** Correctness (74), Insight Density (62). · **Evidence:** verified engine count 39 vs 6 in `GoldenCorpusHarness`; production DI merges 795 rules vs 4 in tests. · **Design uncertainty reduced: 7** · **Market uncertainty reduced: 2** · **Classification: V1.1.**

**5. Register an InMemory `IArchitectureIdentityRepository` so the InMemory host boots.**
Tier 2 · **Why it matters:** `OpenApiContractSnapshotTests` cannot run (DI validation failure) and `WorkerHostStartupTests` carries explicit skips for the same cause, so the OpenAPI contract gate is currently unusable and snapshot updates must be hand-maintained. · **Affected qualities:** Runtime (76), Correctness (74). · **Evidence:** DI validation error naming `IArchitectureIdentityRepository` while activating `ArchitectureIdentityService`; `ArchitectureIdentityRepository` registered only on the SQL path in `ArchLucidReferenceDataHotPathRegistrar`. · **Design uncertainty reduced: 6** · **Market uncertainty reduced: 1** · **Classification: V1.**

**6. Build the one-screen policy-toggle demo artifact.**
Tier 2 · **Why it matters:** the moat exists in code and is invisible to buyers. The fastest way to make it obvious is a captured demonstration where toggling one pack changes findings, severity, pre-finalize gate verdict, and audit entry together. Depends on item 3's fixture. · **Affected qualities:** Differentiability (76), Comprehension (80). · **Design uncertainty reduced: 3** · **Market uncertainty reduced: 7** · **Classification: V1.1.**

### Tier 3 — Hold For Reassessment

**7. One deep engine in resilience or segmentation semantics.** Hold until **G-REAL-06** indicates which category buyers actually argue about. Building the wrong deep engine is expensive; the pilot answers it cheaply. **Market uncertainty reduced: 8.** **Classification: validation first.**

**8. Capture real frontier transcripts for the insight-density corpus.** Hold until there is a real pilot architecture worth baselining. The harness (`scripts/ci/insight_density_frontier_delta.py`) is built and passing; only the corpus is synthetic. **Classification: validation first.**

**9. Decide whether density scoring should apply to engine findings.** The `typed-engine-protected` bypass may be correct — deterministic findings arguably should not be suppressed by a heuristic. But then the per-engine distribution report should be labeled advisory-only in its own header rather than reading as a control. Owner decision. **Classification: blocked on user input.**

**10. Automate the UI/authority drift guard (TB-882).** Held pending pilot signal in prior cycles; the defect class has been closed manually 17 times and will recur. Reassess after trunk is green. **Classification: V1.1.**

## 18. Prompt Batching Guidance

**First batch — strong-model-recommended for item 0, then safe-for-Sonnet.** Item 0 (restore the UI build) comes before everything; 147 type errors spanning null-safety, generics variance, and missing modules will produce wrong fixes under a weaker model, and silencing errors would be worse than leaving them. Then item 1 (green trunk) and item 5 (InMemory host registration), both mechanical. This batch removes both ship-gate caps and is a hard prerequisite for every §0 human task.

**Second batch — strong-model-recommended.** Item 2 (Bicep/Kubernetes property extraction into the declaration classifiers). Touches ingestion normalization and classifier semantics across several parsers; a shallow fix here produces wrong findings rather than no findings.

**Third batch — safe-for-Sonnet with review.** Items 3 and 4 (policy-filtered golden case, then broader corpus coverage), followed by item 6 (demo artifact) once item 3's fixture exists.

Ordering rationale against the stated priorities: reliability of first review generation (batch 1), evidence/policy traceability (batch 3), review-package credibility (batch 1 item 1), demo reliability (batch 3 item 6), guided-intake clarity and comprehension (deferred — the 200+ UI backlog rows are diminishing returns per §16).

## 19. Model Usage Guidance

**Composer-safe:** screenshot capture runs, snapshot regeneration, copy cleanup, mechanical test-name updates.

**Sonnet-safe (default choice given current pricing):** item 1 trunk repair, item 5 DI registration, items 3–4 test authoring, GTM drafting tasks in §0. Reasoning depth is not the limiting factor for any of these.

**Strong-model-recommended:** item 2 ingestion/classifier work; any change to policy filtering, authority pipeline, scope resolution, or evidence-graph semantics.

**Opus-or-Gemini-assessment-recommended:** this assessment; pilot design and finding-quality interpretation for **G-REAL-06**; procurement objection framing (**M-196**/**M-197**); the repositioning decision in §20.

## 20. Pending Questions For Later

**Blocks V1:** none — the only V1 blocker is item 1, which is engineering, not a decision.

**Blocks V1.1:** Should policy awareness extend beyond the compliance engine, and with what policy vocabulary for structural engines? This determines whether the moat stays narrow (§7.3).

**Requires customer validation:** Which analytical category do buyers actually argue about — resilience, segmentation, IAM, or cost? Determines item 7. Also: does policy-aware review change a real decision (§10.6)?

**Requires founder decision:** (a) Should the product's positioning lead with *organizational repeatability* rather than *superior insight*? §11 argues the insight claim fails a technical evaluation today. (b) Should `typed-engine-protected` remain a hard bypass (§17 item 9)? (c) Which finding stream is the product of record — the sealed `FindingsSnapshot` or `AgentResult.Findings` — given exports currently lead with the latter (§8 item 8)?

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

The repository demonstrates serious principal-architect judgment, and the evidence is in the unglamorous places. Someone built `DispositionAwareRoiBasisCalculator` and then *documented* that per-system rows deliberately do not sum to the portfolio headline, with a scope code on the wire so the two cannot be conflated — that is a person who has been challenged by a CFO. Someone wrote `claimBoundary` into the insight-density artifact stating it is not evidence of beating any frontier model, and a fixture README saying "these are not captured frontier-model transcripts" — that is unusual intellectual honesty in a file nobody would have audited. The `AgentArchitectureFindingEmissionGate` that refuses prose-only decision-grade findings, the ship-gate evidence runner that returns FAIL when it cannot load a run rather than assuming success, the published list of Azure roles the product will never request, and the enforced absence of `terraform apply` code paths all point the same direction: enterprise realism over demo appeal.

The taste failure is proportion. There are 39 finding engines and 6 in the merge gate; 45 policy packs and 1 engine that consumes them; 791 compliance rules and 4 in the corpus; an elaborate density-measurement apparatus that gates nothing. The instinct to build the *system* is strong and correct; the instinct to make each layer earn its keep before adding the next one is weaker. The prior assessment file — 450 lines with a header of accumulated rescore deltas ratcheting a score upward item by item, in direct violation of its own prompt's no-carry-forward rule — is the clearest symptom: measurement machinery elaborating faster than the thing being measured.
