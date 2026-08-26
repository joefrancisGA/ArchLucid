# ArchLucid Strategic Release and Market Readiness Assessment (v3)

**Pass date:** 2026-08-26 (late evening). **Computed fresh** — no carry-forward, no score deltas, no rescore ratchet. The prior same-day evening pass is archived at [`../archive/assessments/LATEST_GPT55-2026-08-26-evening-superseded.md`](../archive/assessments/LATEST_GPT55-2026-08-26-evening-superseded.md) and is **not** canonical.

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Cursor Grok 4.6, simulator-aware; **no live Azure OpenAI call was made during this pass**, so all agent-path judgments are about mechanism and default configuration, not observed real-mode output.

**Source materials inspected this pass:** `ASSESSMENT_INPUTS.md`, `V1_SCOPE.md` (orient), `V1_DEFERRED.md` (orient), `Assessment-Scope-V1_1.mdc`, `DEFAULT_POLICY_PACKS_V1.md`, `POLICY_PACK_EXPECTATION_FACET.md`, `GTM_BACKLOG.md`, `TECH_BACKLOG.md` (TB-599/600/603/882), `trust-center.md` (SOC/pen-test honesty), `insight-density-engine-distribution.md`, `tests/eval-corpus/insight-density-frontier-delta/README.md`, plus direct code reads of `BuiltInFindingEngineTypeCatalog`, `GoldenCorpusHarness.CreateEngines()`, `DeterministicInsightDensityGate`, `InsightDensityGateOptions`, `DeclarationSignalPolicyKeyMap` / `PolicyPackExpectationFacetParser` / `PolicyExpectationGraphStamp` / `FindingsOrchestrator`, coverage resolvers, cost engines, `RequestActorMaterializer`, `resolve-continue-last-alert-rule.ts`, `help-topic-view-resolver-operate.tsx`, `IntegrationsItsmOptions`, `ci.yml` / `codeql.yml` triggers, and bundled pack `advisoryDefaults` samples.

**Executed this pass (runtime evidence, not doc claims):**

- `npx tsc --noEmit -p tsconfig.build.json` — **FAIL** (exit 1). Truncated JSX in `archlucid-ui/src/lib/help/help-topic-view-resolver-operate.tsx` (catch-all `HelpTopicMarkdownView` return is unclosed; stray `return null`). Present on current `master` HEAD. `next.config` does **not** set `ignoreBuildErrors`.
- `dotnet test` scoped this session: `ArchLucid.Decisioning.Tests` policy-expectation / orchestrator-stamp / topology-resolver filters **9 + 25 passed**; `ArchLucid.Capabilities.Cost.Tests` **19 passed / 0 failed**. Full Suite=Core matrix was **not** re-run this pass.
- GitHub Actions: last **completed** CodeQL on `master` ([33012502793](https://github.com/joefrancisGA/ArchLucid/actions/runs/33012502793)) **failed** — C# SARIF gate unresolved; JavaScript job failed at **Install and build UI**. Subsequent CodeQL runs on `master` are cancelled or still in progress (concurrency). Full `ci.yml` is **pull_request + workflow_dispatch** only (not `push` to `master`).

Verified counts by direct inspection: **39** registered finding engines, **45** bundled policy-pack content files (+ manifest), **791** `ruleId` entries in `ga-starter-compliance.rules.json`, **6** engines in `GoldenCorpusHarness.CreateEngines()`, **398** `public const string` audit event-type constants across `AuditEventTypes*.cs`. Bundled pack JSON `advisoryDefaults` inspected this pass contain **`priorityFloor` only** — not `expectation.*` or `cost.requireBudgetCap` keys.

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows. Excludes GTM V1.1 items **#2/#3/#5/#6** (**M-90**/**M-44**/**M-91**/**M-92**) per standing exclusion rule. Owner assurance programs **G-REAL-05** / **G-ASSURANCE-02** appear here only because they are human-executed; they do **not** reduce `(A)`. **M-190**/**M-191**/**M-196**/**M-197** are **Done** — not listed.

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|-----------------|--------------------|--------------------|
| 1 | **G-REAL-06** — three real-mode pilot runs | Dominant remaining deficiency driver once the UI typecheck FAIL is repaired. Insight-density, 30-day usage, and purchase-probability numbers stay low-confidence until this runs. | Partial — agent can prepare scenarios, run scripts, capture packets; owner must supply real architecture + judgment | **Opus** — pilot design and finding-quality interpretation materially change the conclusion |
| 2 | **G-REAL-07** — proof packets + `PROOF_PACKET_RUN_LOG` | Depends on #1 output. Converts pilot runs into reusable buyer evidence. | Partial | **Sonnet** |
| 3 | **M-39** — apply proof-packet checklist, ≥3 G4 rows | Depends on #2. Stage 1 selling gate. | Partial | **Sonnet** |
| 4 | **M-07** — polished operator screenshots | Blocks **M-16** and remaining **M-09** deploy. **Blocked this pass by Gate 5 FAIL** (UI production typecheck). | Partial — agent can drive capture harness after compile recovers | **Composer** — high-volume mechanical capture |
| 5 | **M-09** — landing owner sign-off + deploy | In progress; gated on #4. No inbound motion without it. | Partial | **Sonnet** |
| 6 | **M-16** — demo video | Depends on #4. **G-REAL-09** (live DOCX visual check) should run before recording. | Partial | **Sonnet** |
| 7 | **G-COMMERCE-01 / M-94** — invoice + SOW readiness (tax, entity, payment methods) | Revenue-blocking for the sales-led V1 motion; owner-only financial/legal setup. | No — human only | N/A — human only |
| 8 | **G-COMMERCE-02 / M-95** — first paid engagement on invoice/SOW path | Depends on #7 and on pilot proof from #1–#3. | No — human only | N/A — human only |
| 9 | **M-110** — Quick Scan AI go/no-go | **TB-902** is Done **YELLOW** (sample-only public release). Owner still must record GREEN/YELLOW/RED before enabling `AnonymousExecutionEnabled` in production. | Partial | **Sonnet** |
| 10 | **G-REAL-05** (SOC 2 CPA) and **G-ASSURANCE-02** (third-party pen test) | Owner assurance programs. Not `(A)` gates; listed for sequencing only. | No — human only | N/A — human only |

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 74.79% (capped by Gate 5 FAIL)**

**Capped.** Gate 5 **FAIL**: `tsconfig.build.json` production typecheck does not compile. The weighted average below is computed independently; a ship-gate FAIL overrides it as a V1 ship decision. Gates 2–4 and 6 pass on mechanism. Gate 1 remains **UNKNOWN** (no SQL-backed live first review in this environment).

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`: SOC 2 CPA attestation, third-party pen-test publication, signed design partner, owner-output GTM assets/cohorts, public extension SDK, MCP absence in V1, third-party plugin marketplace, assistive-technology participant testing, and sales-engineer-led LLM onboarding.

---

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 66 | 13 | 8.58 | **442** |
| 2 | Differentiability / Defensibility vs Frontier AI | 82 | 13 | 10.66 | 234 |
| 3 | Governed Review Integrity | 85 | 13 | 11.05 | 195 |
| 4 | Correctness & Evidence Integrity | 76 | 12 | 9.12 | **288** |
| 5 | AI / Agent Readiness | 74 | 10 | 7.40 | 260 |
| 6 | Time-to-Value | 70 | 10 | 7.00 | **300** |
| 7 | Proof-of-ROI Readiness | 76 | 9 | 6.84 | 216 |
| 8 | Sponsor / Operator Comprehension | 70 | 8 | 5.60 | 240 |
| 9 | Runtime & First-Review Reliability | 62 | 7 | 4.34 | 266 |
| 10 | Adoption Friction | 84 | 5 | 4.20 | 80 |
| | **(A) Headline readiness** | | **100** | **74.79%** | |

**Ranked by weighted deficiency:** Insight Density (442) · Time-to-Value (300) · Correctness (288) · Runtime (266) · AI/Agent Readiness (260) · Comprehension (240) · Differentiability (234) · Proof-of-ROI (216) · Governed Review Integrity (195) · Adoption Friction (80).

**Note on the shape of this scorecard.** Insight Density is still the only top deficiency that is **architectural**. Time-to-Value, Correctness, and Runtime are inflated this pass by a **trunk compile break** in the Operate help resolver — not by a missing engine. Differentiability is no longer the second-worst pillar: policy packs now have three working influence kinds (rule-set, declaration signal gating, coverage/cost expectation parameterization). The remaining honesty gap is that **bundled pack JSON does not populate the new expectation keys**, so assigning SOC 2 / CIS as-shipped still does not automatically add topology extras.

---

## 3. Diagnostic Scores (non-headline)

These do **not** feed the headline.

**Decision Advantage Score: 64/100.** Likelihood ArchLucid changes a decision frontier AI alone would not. Credit for policy-filtered compliance evaluation (a tenant's own enabled rule set determines which of 791+ rules fire), declaration-security / premise-conflict gating on mapped keys and prefix families, graph-stamped coverage extras when `advisoryDefaults` are set, cost require-cap / breach-severity overrides, open-commitment (overdue deferrals and expiring waivers from governance history), and Bicep/Kubernetes declaration properties feeding the same classifiers as Terraform. Discount because engine depth is still predominantly graph-shape and checklist coverage rather than architectural judgment; because bundled packs do not encode expectation extras; and because dedicated engines for resilience posture, segmentation semantics, IAM depth, and observability still do not exist.

**Frontier-AI Survival Probability (12 months): 55–70%, moderate confidence.** Reference class: vertical governance/workflow wrappers around a commoditizing model layer. Base rate ~50–60%. Adjusted **upward** because the policy-pack→filter/stamp→finding→decision→audit chain is persistent tenant state across more than one engine family. Adjusted **downward** because generic-critique value is already commodity, default bundled packs still look like rule catalogs plus `priorityFloor`, and the deterministic floor is still checklist-height outside compliance, declaration, and optional coverage extras.

**30-Day Voluntary Usage Probability: 30–45%, low-moderate confidence.** Reference class: enterprise architecture tooling adopted voluntarily by senior ICs — base rate 20–30%. Adjusted up for sealed-package / audit-trail output and for Bicep/Kubernetes no longer silently empty. Adjusted down because default host mode is Simulator, LLM judge defaults off, UI production typecheck is currently red, and no live-pilot retention signal exists.

**Sponsor Purchase Probability: 25–40%, low confidence.** Reference class: net-new governance tooling purchased on a pilot, no reference customer, sales-led motion — base rate 20–35%. Held down by zero completed real-mode pilots (**G-REAL-06** not started) and by a present Gate 5 FAIL. Confidence is low specifically because owner pilot work has not run.

**Reconciliation with §2.** The headline (74.79%) sits above Decision Advantage (64) and the purchase band (25–40%). That tension is the product: **the governance container is real**, **policy can change more of the review than a compliance-only reading implied**, and **the front door is currently uncompilable**. A respectable weighted average with a mediocre decision-advantage score and a ship-gate FAIL is the profile of a product that built the right mechanism and then broke the UI catch-all on trunk.

---

## 4. V1 Ship Gate

`ShipGateEvidenceRunner` maps 1:1 to these six gates. It requires a live API and a committed `runId`. This environment has no SQL-backed API, so live-execution gates are **UNKNOWN** rather than assumed PASS.

| # | Gate | Verdict | Evidence | Fastest resolution |
|---|------|---------|----------|--------------------|
| 1 | First review completes create → execute → commit → manifest + ≥1 artifact | **UNKNOWN** | Mechanism and tests exist. Not executed here. | Run `archlucid pilot ship-gate-evidence` against a SQL-backed staging API with a committed run. |
| 2 | No hallucinated or uncited policy/evidence citations | **PASS (mechanism)** | `AgentArchitectureFindingEmissionGate` strips decision-grade agent findings lacking both `PolicyRuleId` and `EvidenceRefs`; `CitationIntegrityEvaluator` scores a committed run. **Honest limit:** semantic hallucination audit remains manual. | Keep as PASS on mechanism; upgrade after gate 1 runs live. |
| 3 | Sponsor summary / ROI coherent and not misleading | **PASS (mechanism)** | Disposition-aware headline, `headlineSavingsScopeCode` labeling, board-pack delegates to the same service. **TB-603** (AWS/GCP structured retail-price grounding) is **Done**. | As above. |
| 4 | Export / package generation works (Markdown / DOCX / ZIP) | **PASS (mechanism)** | Export formatters and Suite=Core coverage exist. Live ZIP/DOCX against a committed run not executed here. Full Application Suite=Core not re-run this pass. | Optional: `ShipGateExportMatrixProbe` on staging. |
| 5 | Architect workspace does not break during first-review / demo path | **FAIL** | `tsc --noEmit -p tsconfig.build.json` fails on `help-topic-view-resolver-operate.tsx`: unclosed `HelpTopicMarkdownView` JSX, then a stray `return null`. File is on `master` HEAD. Help catch-all is on the operator help path; production typecheck is a demo compile gate. | Restore the truncated return (close `entry={loaded.entry}` and the component); re-run `tsconfig.build.json`. |
| 6 | Auth + tenant isolation behave correctly on the pilot path | **PASS (mechanism)** | Database-per-tenant topology (ADR 0037), `ScopeResolutionGuardMiddleware`, tenant-isolation negative probes in the ship-gate runner. | As gate 1. |

**Gate 5 FAIL caps the headline.** CodeQL SARIF failure is a **security-merge** problem on the workflow that actually runs on `master` push; it is not a numbered ship-gate FAIL.

---

## 5. Sponsor Summary

**(A) Overall headline readiness — 74.79%, capped by Gate 5 FAIL.**

ArchLucid is a governed architecture-review system whose **policy mechanism is broader than a single compliance engine** and whose **UI production typecheck is currently broken**. An architect submits a structured request or uses guided intake; the system ingests documents and infrastructure declarations into a canonical graph; 39 deterministic finding engines run over that graph; the tenant's *own enabled* compliance rules evaluate against it; optional `advisoryDefaults` extras can be stamped onto the context snapshot so coverage and cost engines union pack expectations with heuristics; a sealed manifest with an authority chain is produced; exports, sponsor ROI rollups, and ITSM tickets package the result against an append-only audit trail with database-per-tenant isolation.

Governance is not decoration. `ComplianceRulePackGovernanceFilter` intersects the rule universe with the tenant's enabled keys and a priority floor; `TenantCuratedComplianceRulePackMerger` folds in tenant-authored rules; `PolicyFilteredGoldenCorpusTests` asserts two postures emit different compliance findings; `PolicyFilteredDeclarationGoldenCorpusTests` asserts SOC 2 vs CIS Azure change declaration-security findings; `PolicyExpectationCoverageGoldenCorpusTests` asserts a stamped `identity` extra changes topology-coverage missing categories. Approval workflow enforces separation of duties; the pre-finalize gate can block on severity; a dry-run surface shows what a policy change would do. Forty-five curated policy packs ship bundled.

The remaining product weakness is still **contents, not container** — with two important caveats. First, bundled pack JSON does **not** yet set `expectation.topologyCategories.add` / `cost.requireBudgetCap`; assigning CIS Azure or SOC 2 as-shipped changes compliance and declaration gating, not coverage extras, unless a tenant overlay writes those keys. Second, the Operate help catch-all file on `master` does not compile, so demo/screenshot motion is blocked until that syntax error is closed.

Deterministic engines remain predominantly coverage and structure checks. There are no dedicated engines for resilience/DR, IAM depth, secrets/key lifecycle, network segmentation semantics beyond edge presence, observability, or capacity. `TrustBoundaryFindingEngine` and `PrivilegedAccessFindingEngine` need `Actor` nodes; those materialize from **request/intake** (`RequestActorMaterializer`) and knowledge-model stakeholders, **not** from IaC documents. Insight-density scoring still computes a number for every engine finding and then **promotes unconditionally** via `typed-engine-protected`.

**(B) Procurement / market realism (weight 0 in `(A)`).** Trust posture is honest: SOC 2 self-assessment plus roadmap, CAIQ/SIG/DPA templates, subprocessor register, owner-conducted penetration exercise, published Azure roles ArchLucid will never request, Tier 1 ingestion with no vendor access to a customer cloud. A CPA-issued SOC 2 report and a third-party pen-test summary do not exist — correctly out of `(A)`, still friction for hard-gate buyers. Honest talk-tracks (**M-196**/**M-197**) and the minimum pilot trust packet (**M-190**/**M-191**) are **Done** as content. Live buyer security review has not happened.

**Commercial picture.** Sales-led V1: pricing page, order-form template, TEST-mode trial. Live commerce un-hold is V1.1 owner-only. Compelling today: audit-ready packaging and repeatability a chat transcript cannot produce. Unproven: voluntary return and paid conversion. **G-COMMERCE-01** is not done, so a willing first buyer still has no clean invoice path.

**Enterprise picture.** Tenancy, RBAC, SCIM, SAML and OIDC, private endpoints, and audit coverage are at a credible enterprise bar. ITSM native-create defaults **on** (`Integrations:Itsm:NativeEnabled = true`); Jira/ServiceNow/Confluence OAuth is **Done** (**TB-600**). Hesitation will come from assurance paperwork, from the depth question in the first 20 minutes, and — this week — from a trunk that does not typecheck.

**Engineering picture.** Policy-expectation stamp, declaration prefix-family gating, and coverage-resolver UNION are in tree with unit and golden-sibling tests. Against that: UI `tsconfig.build.json` is red on `master`; CodeQL C# SARIF gate failed on the last completed `master` run and JS analysis did not start because UI install/build failed; full `ci.yml` does not run on `master` push; Alert rules continue-last still calls `.slice` without an array guard; golden corpus still exercises 6 of 39 engines and still constructs `FileComplianceRulePackProvider` directly.

**Frontier-AI picture.** ArchLucid gets *more* valuable as base models improve, because better models produce better findings that flow into the same policy mappings and audit structures at zero engineering cost — but only if the deterministic floor is deep enough that the product is not merely a wrapper around whichever model is current, and only if the workspace actually builds.

---

## 6. Deferred Scope Uncertainty

**V1.1:** CloudEvents outbound webhooks and customer-operated recipe bridges; MCP read-only membrane; multi-region active/active; commerce un-hold. Deferral is safe for V1 — the V1 automation contract (REST, CLI, workspace, SCIM, CI decoration, first-party Jira/ServiceNow/Confluence/Slack/Teams) covers pilot needs.

**V2:** third-party pen-test program; SOC 2 CPA; automated tenant-erasure quarantine; Redis-as-default substrate; DTF / Container Apps Jobs. Safe for V1. Erasure has operator purge paths as the interim seam.

**Genuine uncertainty:** Graph-RAG community summarization stays deferred per ADR 0057 pending pilot signal. Do not build it before **G-REAL-06** says retrieval depth is the limiter.

---

## 7. Weighted Quality Assessment (detail)

Ordered by weighted deficiency signal.

### 7.1 Decision-Changing Insight Density — 66 · weight 13 · contribution 8.58 · deficiency 442

**Justification.** `docs/architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS.md` still states the pillar clause **"miss"** is not covered: existing mechanisms penalize generic phrasing, prune weak Critic prose, and optionally LLM-judge — all **subtractive**. A filter raises precision, never density.

Verified this pass:

1. **The density gate still does not gate engine findings.** `DeterministicInsightDensityGate.Score` returns `Promote` / `DecisionGradeFinding` whenever `IsAgentArchitectureFinding` is false, after adding `typed-engine-protected`. The score is computed and discarded. All **39** engines take this path. `docs/quality/insight-density-engine-distribution.md` labels itself advisory-only.
2. **Frontier baselines are still not frontier baselines.** `tests/eval-corpus/insight-density-frontier-delta/README.md` states they are **not** captured frontier-model transcripts.
3. **Bicep/Kubernetes silent-empty is no longer true.** `BicepResourceBodyParser` exists; Kubernetes security spec projection exists; declaration classifiers consume those keys.
4. **Policy extras can add a missing-identity coverage finding** when stamped. That is still a coverage-shaped finding, not a judgment a skilled architect would miss.

Engine depth still compounds the pillar. Graph-pure engines are dominated by coverage/gap/traceability over graph shape. Absent: dedicated RPO/RTO, IAM depth, secrets/key lifecycle, segmentation *semantics*, observability, capacity. Actor-dependent engines fire from **intake**, not from IaC-only uploads.

**Credit.** Policy-filtered compliance; declaration gating; open-commitment; premise-conflict; optional coverage extras.

**Tradeoffs.** Typed-engine protection prevents a heuristic from suppressing deterministic output. It also means density is unmeasured where most findings originate.

**Recommendations.** Repair the UI compile first. Do not add more coverage-shaped engines. Capture real frontier transcripts after a real architecture exists. Owner-decide whether engine findings should ever demote. One deep judgment engine only after **G-REAL-06** names the category.

**Classification:** V1 residual (measurement honesty) + market validation. **Affects outcomes 1, 3, 5.**

### 7.2 Time-to-Value — 70 · weight 10 · contribution 7.00 · deficiency 300

**Justification.** The designed pilot path is short: configure, start, create review, execute, finalize, review package. Guided intake, reference-architecture exemplars, sample/demo runs, and `stack doctor` reduce first-run friction.

This pass's deduction is the **compile FAIL**: a deployed first screen is undefined until `tsconfig.build.json` is green. Remaining: first-review live E2E was not run here (gate 1 UNKNOWN); extractor-based cost/inventory still needs customer credentials for Tier 2; Simulator default means the first "wow" may be canned.

**Classification:** V1 residual + validation. **Affects outcomes 1, 3.**

### 7.3 Correctness & Evidence Integrity — 76 · weight 12 · contribution 9.12 · deficiency 288

**Justification.** Citation and payload machinery is strong: emission gate, citation evaluator, typed payloads, extractor `collectionTimestamp` citation contract. Policy-expectation parser/stamp/resolver tests passed this session; cost-engine tests passed.

Deductions: production UI typecheck FAIL; citation probes prove a citation *exists*, not that it supports the claim; Alert rules continue-last still assumes an array; last completed CodeQL C# SARIF gate failed; JS CodeQL did not analyze because UI build failed.

**Classification:** V1. **Affects outcomes 1, 2, 4.**

### 7.4 Runtime & First-Review Reliability — 62 · weight 7 · contribution 4.34 · deficiency 266

**Justification.** Health endpoints, correlation IDs, outbox/DLQ, idempotency, run-execute leases, budget cutoffs, Redis auto-selection, `ShipGateEvidenceRunner` exist. `InMemoryArchitectureIdentityRepository` is registered on the InMemory composition path. **TB-882** nav-authority guard is **Done**.

Deductions dominate this pass: Gate 5 FAIL on production typecheck; CodeQL on `master` last-completed **failure**; `ci.yml` full matrix is **not** a `master` push check; gate 1 live first-review UNKNOWN; Alert rules client crash is a real Operate-route defect.

**Classification:** V1. **Affects outcomes 2, 3.**

### 7.5 AI / Agent Readiness — 74 · weight 10 · contribution 7.40 · deficiency 260

**Justification.** Operationally mature: real/simulator separation, Application-layer orchestration, `AgentResult` schema validation, `WarnOnly` / `PilotStrict` quality-gate modes, LLM budget reservation and monthly caps, prompt-cache prefix, per-snapshot judge ceilings, tenant overrides for judge and portfolio-recurrence.

Deductions: default host mode is Simulator (`ArchLucid.Api/appsettings.json`); `EnableLlmJudge` and `EnableLlmJudgeForEngineFindings` **default false**; Graph-RAG bounded multi-hop with community summarization deferred; eval corpus is synthetic; nightly real-mode loop is not a live tripwire executed this pass.

**Recommendations.** Nothing new to build before pilots except restoring the UI compile. The gap is evidence, not mechanism.

**Classification:** V1 mechanism complete; validation required. **Affects outcomes 1, 5.**

### 7.6 Sponsor / Operator Comprehension — 70 · weight 8 · contribution 5.60 · deficiency 240

**Justification.** Design-system work is real: Carbon-derived tokens, `StatusTag`/`SeverityTag`, enterprise tables, in-app `/help/{topic}`, insight-density curation banner, buyer-label vocabulary.

This pass: Operate help catch-all does not compile, so help dispatch is a live break. Alert rules continue-last still throws if `rules` is not an array. Dual finding counts (sealed snapshot vs agent stream) can confuse a sponsor.

**Classification:** V1. **Affects outcomes 2, 4.**

### 7.7 Differentiability / Defensibility vs Frontier AI — 82 · weight 13 · contribution 10.66 · deficiency 234

**Justification — rubric level: High, approaching Excellent on compliance and declaration; High-but-opt-in on coverage/cost.**

Changing a policy pack changes which of 791+ rules evaluate (`PolicyFilteredGoldenCorpusTests`). Declaration-security and premise-conflict honor mapped keys and prefix families (`PolicyFilteredDeclarationGoldenCorpusTests`). Coverage resolvers UNION stamped extras (`PolicyExpectationCoverageGoldenCorpusTests`). Cost engines honor require-cap and breach-severity stamps. Prompting cannot hold that chain.

**The remaining deduction is default content, not missing mechanism.** Bundled pack JSON this pass sets `priorityFloor` only. Assigning SOC 2 or CIS Azure as-shipped gates compliance + declaration; it does **not** automatically stamp `identity` or `cost.requireBudgetCap` unless a tenant overlay writes those `advisoryDefaults` keys. Open-commitment, portfolio-recurrence, and `*-cross-run-diff` stay pack-independent by design. Inventory/orphaned engines stay pack-inert.

That is **not** “one engine of 39.” It is also **not** “all 39 engines are policy-aware.” Count of engines that *can* consume pack state when keys/stamps are present: compliance, two declaration engines, the coverage-family consumers of the three resolvers, and two cost engines — a minority of 39, concentrated where buyers argue about standards, gaps, and budget.

**Recommendations.** One-screen policy-toggle demo (compliance + declaration + optional overlay extras). Optionally seed FinOps / CIS overlays with documented `advisoryDefaults` examples — do not invent OpenAPI fields.

**Classification:** V1 mechanism complete for three influence kinds; content/demo residual. **Affects outcomes 1, 2, 5.**

### 7.8 Proof-of-ROI Readiness — 76 · weight 9 · contribution 6.84 · deficiency 216

**Justification.** Layered, honestly labeled ROI: latest-committed-run-per-system, `FindingId` dedup, tenant-rate/EA-discount math, disposition-aware headline, `headlineSavingsScopeCode`, 30-day value-report kept separate, board-pack identical by construction. **TB-603 is Done** — AWS/GCP structured retail-price lookups exist with heuristic fallback.

Deduction: zero real pilot deltas, so every savings figure is model- or fixture-derived.

**Classification:** V1 residual + validation required. **Affects outcomes 3, 4.**

### 7.9 Governed Review Integrity — 85 · weight 13 · contribution 11.05 · deficiency 195

**Justification.** Policy→evidence→finding→decision→audit is materially complete and now has **three** pack-influence kinds. Sealed golden manifests; authority replay; 398 typed audit event constants; SoD approvals; pre-finalize gate; policy dry-run; disposition trail feeding ROI and open-commitment; ITSM `FindingId` correlation. Orchestrator fail-open on governance loader exceptions is documented.

Deductions: `GoldenCorpusHarness.CreateEngines()` still constructs `FileComplianceRulePackProvider` and does not inject `IEffectiveGovernanceLoader`, so the six-engine merge-blocking harness path does not stamp extras. Dual finding model: sealed `FindingsSnapshot` vs `AgentResult.Findings` often leading buyer-facing exports.

**Classification:** V1. **Affects outcomes 2, 4, 5.**

### 7.10 Adoption Friction — 84 · weight 5 · contribution 4.20 · deficiency 80

**Justification.** Broad configuration surface: OIDC, SAML SP, API keys, SCIM, four RBAC roles, database-per-tenant, docker compose, Terraform including Entra/Key Vault, private endpoints/WAF, `Integrations:Itsm:NativeEnabled` default **true** (**TB-599** Done), Jira/ServiceNow/Confluence OAuth (**TB-600** Done), CLI `doctor` / `support-bundle`.

Deductions: UI currently does not typecheck, so local first-run of the architect workspace is blocked until Gate 5 is repaired; Tier 2 extractor still needs customer-provisioned credentials.

**Classification:** V1 residual. **Affects outcomes 2, 3.**

---

## 8. Top 10 Weaknesses

1. **Insight density is still subtractive.** The gate, pruner, and optional LLM judge discard generic output; nothing generates a finding a skilled architect would miss. Design uncertainty. **Not a V1 contract blocker**; it is the binding constraint on outcomes 1 and 5. Fastest path: stop adding coverage engines; run **G-REAL-06**; then one deep engine in the category the pilot actually argued about.
2. **UI production typecheck FAIL (Gate 5).** Truncated JSX in `help-topic-view-resolver-operate.tsx` on `master`. Design/process uncertainty. **This is a V1 ship-gate FAIL.** Fastest path: restore the catch-all `HelpTopicMarkdownView` return; `tsc -p tsconfig.build.json` exit 0.
3. **Zero completed real-mode pilots (G-REAL-06).** Pure market uncertainty. Not a V1 engineering blocker once Gate 5 is green; it is the blocker on every commercial diagnostic in §3. Fastest path: owner-executed three-run protocol.
4. **Bundled packs do not encode expectation extras.** Mechanism exists; default content still `priorityFloor` only. Design uncertainty. Fastest path: one overlay example (FinOps `cost.requireBudgetCap` and/or CIS `expectation.topologyCategories.add=identity`) plus the policy-toggle demo.
5. **CodeQL on `master` is red or un-run.** Last completed run failed C# SARIF; JS job failed UI build. Subsequent pushes cancelled the analysis. Process/security uncertainty. Fastest path: fix UI compile so JS analysis can start; then structural SARIF fixes or suppressions that populate `suppressions`.
6. **Golden corpus still covers 6 of 39 engines.** Merge-blocking harness path does not include declaration, open-commitment, or production governance stamp. Design uncertainty. Fastest path: add declaration engines to the harness incrementally; do not expand rule count.
7. **Alert rules client crash.** `resolveContinueLastAlertRule` calls `.slice` with no array guard. Design uncertainty. Not first-review blocking. Fastest path: null/shape-guard the helper.
8. **Full CI does not run on `master` push.** `ci.yml` is PR + `workflow_dispatch`. Typecheck can regress on direct pushes until the next PR — this pass is the exhibit. Process uncertainty.
9. **Actor-dependent engines stay silent on IaC-only reviews.** `RequestActorMaterializer` covers guided intake; Bicep/Helm dumps do not create `Actor` nodes. Design uncertainty. Fastest path: document the intake requirement in first-review UX.
10. **Dual finding model + Simulator default.** Sealed engine snapshot vs agent stream that buyer exports often lead with. Simulator default plus judge-off means the impressive stream is canned. Design uncertainty. Fastest path: founder decision which stream is the product of record.

---

## 9. Frontier-AI Analysis

### Commodity vs Durable

| Capability | 12-month outlook | Reason / evidence |
|---|---|---|
| Generic architecture critique prose | **Commodity now** | Any frontier model produces comparable output from a good prompt |
| Graph coverage / structure checks | **Commodity within 12 months** | Shape checks, not judgment — even when a pack adds an extra expected category |
| Declaration property extraction | **Commodity** | Models parse Terraform/ARM/Bicep well; ArchLucid's parsers feed classifiers (packaging) |
| **Tenant-specific enabled rule set** | **Durable** | Persistent, versioned, per-scope state |
| **Declaration signal gating from that rule set** | **Durable-ish** | Same persistent state, now consumed by two more engines |
| **Expectation extras in `advisoryDefaults`** | **Durable if used** | Mechanism is product state; unused keys are decoration |
| **Sealed manifest + authority chain + replay** | **Durable** | Infrastructure, not inference |
| **Append-only typed audit reconstruction** | **Durable, more valuable over time** | Compounds with history |
| **Cross-run / portfolio state** | **Durable** | Open-commitment, portfolio recurrence, cross-run diff — pack-independent on purpose |
| **Approval workflow with SoD** | **Durable** | Organizational process |
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

**Not yet faster than frontier AI.** The container is the bet; the UI currently does not compile, so the bet cannot even be demoed. Invest in restoring the build, then in the *deterministic* floor and **real pilots**, not in more prompting or more coverage engines.

---

## 10. Policy-Aware Governance Test

1. **Do policy packs drive behavior?** **Yes, for three kinds.** Rule-set selection (`compliance`). Signal gating (`declaration-security-baseline`, `declaration-premise-conflict`). Expectation parameterization / cost thresholds **when** `advisoryDefaults` extras are present and stamped. Bundled defaults today drive the first two (via `complianceRuleKeys` + `priorityFloor`), not the third. For open-commitment, portfolio-recurrence, and cross-run diffs, packs are inert by design.
2. **Can each major finding trace the chain?** Engine/compliance: yes when `EvidenceRefs` / `PolicyRuleId` / disposition / audit are populated. Agent: only those surviving the emission gate.
3. **Would a skilled architect reproduce this without ArchLucid?** No for the governed package, repeatability, and audit reconstruction. Largely yes for analytical content.
4. **AI-generated vs governed infrastructure?** AI: agent findings, cost narratives, comparison explanations. Governed: policy filtering, graph stamp, sealed manifests, replay, audit, approvals, disposition, ITSM correlation.
5. **What would prove the moat?** Two tenants, identical architecture, different packs **including an overlay extra**, materially different findings/severities/gate/sponsor totals — captured as an artifact. Mechanism exists; buyer-facing artifact does not.
6. **Fastest validation?** In **G-REAL-06**, run one architecture twice under two governance postures (and once with an expectation overlay).
7. **Demo that makes the moat obvious?** Toggle one pack; show findings, severity, pre-finalize verdict, and audit entry change on one screen. Optionally show an overlay that adds Identity to missing categories.

---

## 11. Principal Architect Dismissal Test

**"I need this":** sealed, replayable review record; disposition lifecycle; overdue-commitment and expiring-waiver findings; Jira/ServiceNow correlation; a pack change that actually changes the review.

**Voluntary return:** portfolio-level state — recurrence across systems, waivers expiring this quarter. Cross-run memory is the retention mechanism, not critique quality.

**Immediate dismissal:** recognizing every finding as already-known (still the most likely trigger, **45–60%** on a first IaC-only review). Second trigger: Simulator-labeled canned output presented as Real. Third: a help page or typecheck failure if they wander off first-review. Fourth: being told "policy packs drive the review" and then assigning SOC 2 without seeing coverage extras (because bundled JSON has no expectation keys).

**Would they believe ArchLucid is materially better than "Claude + a good prompt + my company standards pasted in"?** **For a single review: still no.** **For the tenth review across the fifth system with a governance board asking for the audit trail: yes.** Position *organizational repeatability*, not per-review insight. The sponsor is the buyer; the architect is the gatekeeper.

---

## 12. Founder Delusion Check

**Strongest assumption with weakest evidence:** that decision-changing insight density is a measurement and curation problem. Everything built for it measures or subtracts. The "miss" clause is unaddressed.

**Looks differentiated, already commodity:** generic critique, structural coverage, declaration parsing, retrieval depth.

**Looks ordinary, may be the strongest moat:** the disposition trail. Unglamorous bookkeeping that makes open-commitment, honest ROI, and the tenth review possible.

**Could burn months without improving the five outcomes:** more curated policy-pack *rules* without encoding expectation extras; more UI route polish across 200+ open rows; Graph-RAG community summarization; more synthetic eval corpus.

**If features froze for six months:** fix the UI compile; run three real pilots; rewrite positioning around organizational repeatability.

**Most dangerous attractive distraction:** going from 39 to 60 coverage-style engines, or treating unused `advisoryDefaults` keys as if every bundled pack already parameterized coverage.

**Most boring real moat:** audit catalog + disposition trail.

**This pass's correction:** the assumption that "policy packs drive one engine of 39" is **stale**. Compliance + declaration gating + optional coverage/cost extras are in tree. The new trap is claiming all 39 engines are policy-aware, or claiming bundled SOC 2 assignment stamps topology extras. It does not.

---

## 13. Competitive Reality Check & Moat Assessment

**What a skilled architect with frontier AI already does:** reads IaC, spots misconfigurations, critiques topology, produces a review document, cites standards from memory or paste.

**What ArchLucid does substantially faster/more consistently:** same *shaped* package every time; evaluates the organization's enabled rule set; can gate declaration findings and (with overlays) add coverage/cost expectations; preserves decisions/exceptions across reviews; reconstructs who decided what; correlates findings to tickets.

**Commodity within 12 months:** analytical content, retrieval depth, parsing.

**More valuable as AI improves:** every governance surface.

**Requires enterprise workflow:** SoD approvals, pre-finalize gating, audit reconstruction, disposition lifecycle, sponsor/operator separation.

**Requires customer-specific policy state:** enabled rule subset, priority floors, scope assignments, curated tenant rules, optional expectation extras.

**Current moat:** governed repeatability plus audit reconstruction, with a real (not decorative) policy filter on compliance and declaration. **Potential future moat:** portfolio-level architectural memory (partially built) plus expectation extras actually shipped in bundled FinOps/CIS content. **Weakest moat assumption:** that unused advisory keys differentiate review *by default*. **Most durable:** audit reconstruction and disposition history cannot be prompted. **Probably illusory:** insight-density superiority over frontier models. **Boring but durable:** the audit catalog. **Buyer-obvious moat:** §10.7 policy-toggle demo.

---

## 14. Adoption & Monetization

**30-Day Voluntary Usage (10 principal architects).** Strongest positive: portfolio and commitment findings that accumulate. Strongest negative: first review still checklist-shaped; this week, a workspace that may not build. Most likely return reason: an expiring-waiver or recurrence finding that mattered. Most likely stop reason: recognizing every finding as already-known.

**Sponsor Purchase.** Strongest driver: audit-ready packaging that survives architecture, security, compliance, and board review. Strongest blocker: no completed pilot, no reference, and a present compile FAIL. Minimum proof: Gate 5 green → **G-REAL-06** → **G-REAL-07** → **M-39**. Likely objection: "our architects already use Claude."

**Why buy ArchLucid instead of more frontier-AI licenses?** Licenses give analysis; ArchLucid gives a *record*. More licenses do not give: which standards were evaluated on which system when; consistency across architects; exception/waiver lifecycle; audit reconstruction; ticket correlation; portfolio recurrence. The argument that ArchLucid finds things Claude cannot is **still not honest** as a blanket claim.

**Top 6 monetization blockers.** (1) UI typecheck FAIL — Gate 5; implementation. (2) No pilot proof — **G-REAL-06**; validation. (3) No case study/reference — **M-32**; validation. (4) Invoice/SOW incomplete — **G-COMMERCE-01**; owner. (5) Landing/demo assets not live — **M-07**/**M-09**/**M-16**; mixed, blocked on #1. (6) Depth objection from the technical evaluator — engine depth + honest repositioning.

**Top 6 enterprise adoption blockers.** (1) Workspace compile break — trust; pilot. (2) No pilot case study — trust; scale. (3) Connector/extractor credential setup — workflow fit; pilot. (4) Checklist-depth findings — buyer value; pilot. (5) Architects preferring their own tools — process; scale. (6) Procurement timing/assurance paperwork — trust; scale (`(B)`).

---

## 15. Most Important Truth

**Policy packs now change more of the review than a compliance-only story allowed — and none of that matters this week because the architect workspace does not typecheck, and no real-mode pilot has proven the container changes a decision.**

What is current: 39 engines still mostly coverage-shaped; density scoring still discarded for every typed engine; golden corpus still 6/39; bundled packs still `priorityFloor`-only for extras; **G-REAL-06** still unstarted; Gate 5 FAIL on a truncated help resolver; CodeQL last-completed failure on `master`. The honest position remains *organizational repeatability*, not superior insight. Selling the latter will still fail a serious technical evaluation. Selling “every engine is policy-aware” will also fail: count the kinds, then look at bundled JSON.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

## 16. Stop Doing List

**Top 3 not worth doing before V1:** more curated policy-pack *rules* without encoding expectation extras; Graph-RAG community summarization (ADR 0057: wait for pilot signal); more synthetic eval-corpus scenarios.

**Top 3 diminishing-returns areas:** UI route polish across 200+ open backlog rows (except the compile FAIL); additional coverage-shaped finding engines; expanding compliance rule count past 791.

**Top 3 founder behaviors that delay validation:** treating assessment scores as the progress metric instead of pilot outcomes; claiming all 39 engines are policy-aware; adding engines because they are tractable.

**Top 3 features that feel enterprise-important but may not improve V1 adoption:** MCP membrane; CloudEvents webhooks; multi-region active/active.

## 17. Top Improvement Opportunities

Gate 5 **FAIL** leads. Validation-first work follows once the workspace compiles. Engineering items below are in-contract, verified-absent-or-broken this pass.

**Shipped — do not re-open:** declaration prefix-family gating (PP-01); expectation facet parser/stamp/resolver UNION and cost require-cap / breach-severity (PP-02–PP-05); Bicep body → `tf.*` bag; Kubernetes security spec projection; `PolicyFilteredGoldenCorpusTests` / declaration / expectation coverage siblings; **TB-599** native ITSM default on; **TB-600** connector OAuth; **TB-603** AWS/GCP retail grounding; **TB-882** nav-authority guard; GTM **M-190**/**M-191**/**M-196**/**M-197**. Do **not** re-run ID-08–ID-10 declaration/parser/filter prompts.

### Tier 1 — Must Fix / Must Validate

**1. Restore UI production typecheck (`help-topic-view-resolver-operate.tsx`).**
Tier 1 · **Why it matters:** Gate 5 FAIL. `tsconfig.build.json` does not compile. Demo, **M-07**, and CodeQL JS analysis are blocked. · **Expected impact:** Gate 5 can return to PASS (compile); unblocks screenshot/demo motion. · **Affected qualities:** Runtime (62), Time-to-Value (70), Comprehension (70), Correctness (76). · **Evidence:** `tsc --noEmit -p tsconfig.build.json` this pass; file on `master` HEAD ends with unclosed JSX then `return null`. · **Actionability:** high. · **Design uncertainty reduced: 9** · **Market uncertainty reduced: 1** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** `archlucid-ui/src/lib/help/help-topic-view-resolver-operate.tsx` catch-all return is truncated: `<HelpTopicMarkdownView entry={loaded.entry` is not closed; a stray `return null` follows. `npx tsc --noEmit -p tsconfig.build.json` fails with TS1005/TS1003. **Desired behavior:** catch-all returns `HelpTopicMarkdownView` with `entry={loaded.entry}` and `markdown={loaded.markdown}` (match sibling resolvers); no stray `return null`; typecheck exit 0. **Scope boundaries:** do not redesign help dispatch; do not silently swallow unknown slugs if `assertHelpTopicCatchAllFallthroughAllowed` is the contract. **Acceptance criteria:** `npx tsc --noEmit -p tsconfig.build.json` exit 0. **Tests:** existing help-topic dispatch inventory tests stay green. **Non-goals:** full Vitest matrix; rewriting help content.

**2. Execute three real-mode pilot runs (G-REAL-06) and collect packets (G-REAL-07 / M-39).**
Tier 1 · **Why it matters:** every commercial diagnostic in §3 is offline-derived. Depends on item 1 for a buildable workspace. · **Expected impact:** replaces opinion with observed insight density, dismissal triggers, and ROI credibility. · **Affected qualities:** Insight Density (66), Time-to-Value (70), Proof-of-ROI (76), Decision Advantage (64). · **Evidence:** GTM rows Not started; no `PROOF_PACKET_RUN_LOG` G4 rows required this pass. · **Actionability:** owner-executed; agent-assistable for scripts. · **Design uncertainty reduced: 2** · **Market uncertainty reduced: 9** · **Classification: validation first.**

**3. Clear the CodeQL SARIF gate on `master`.**
Tier 1 · **Why it matters:** it is the workflow that actually runs on `master` push. Last completed run [33012502793](https://github.com/joefrancisGA/ArchLucid/actions/runs/33012502793) failed C# SARIF; JS job failed installing/building UI. · **Expected impact:** restores the only automated security merge signal on direct `master` pushes. · **Affected qualities:** Runtime (62), Correctness (76). · **Evidence:** Actions run above; later runs cancelled by concurrency. · **Actionability:** high after item 1. · **Design uncertainty reduced: 8** · **Market uncertainty reduced: 1** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** CodeQL on `master` fails `scripts/ci/assert_codeql_sarif_clean.py` (C#) and/or never produces JS SARIF because UI install/build fails. **Desired behavior:** SARIF gate exit 0 with zero unresolved findings on both language jobs. **Scope boundaries:** prefer structural fixes. If a suppression is unavoidable, use a form that **populates SARIF `suppressions`**. Document remaining suppressions in `docs/library/CODEQL_TRIAGE.md`. **Acceptance criteria:** a CodeQL run on the fixed SHA is green, or local `assert_codeql_sarif_clean.py` on produced SARIF is green. **Non-goals:** disabling the SARIF gate; reopening TB-135/TB-136.

**4. Fix Alert rules continue-last crash (`rules.slice`).**
Tier 1 · **Why it matters:** `resolveContinueLastAlertRule` still calls `.slice` with no runtime array guard. · **Expected impact:** Alert rules page does not throw when `rules` is missing or not an array. · **Affected qualities:** Comprehension (70), Runtime (62). · **Evidence:** `archlucid-ui/src/lib/resolve-continue-last-alert-rule.ts` lines 46–61 this pass. · **Actionability:** high. · **Design uncertainty reduced: 7** · **Market uncertainty reduced: 1** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** `resolveContinueLastAlertRule` in `archlucid-ui/src/lib/resolve-continue-last-alert-rule.ts` (and the composite sibling) calls `rules.slice()`; a non-array `rules` throws. **Desired behavior:** helper returns `null` when `rules` is missing, not an array, or empty. **Scope boundaries:** do not redesign the alert-rules hub; add a type/runtime guard and a unit test for non-array input. **Acceptance criteria:** unit test covers non-array; page render does not throw. **Non-goals:** the full Vitest matrix.

### Tier 2 — High Leverage

**5. One-screen policy-toggle demo artifact (include overlay extras).**
Tier 2 · **Why it matters:** the moat exists in code (three golden siblings) and is invisible to buyers. Bundled packs will not show coverage extras without an overlay. · **Affected qualities:** Differentiability (82), Comprehension (70). · **Design uncertainty reduced: 3** · **Market uncertainty reduced: 7** · **Classification: V1.1 / validation.**

**6. Seed one bundled or sample overlay with expectation `advisoryDefaults`.**
Tier 2 · **Why it matters:** mechanism without default content is a demo lie. Prefer FinOps `cost.requireBudgetCap=true` and/or a documented CIS overlay `expectation.topologyCategories.add=identity`. Do not add OpenAPI fields. · **Affected qualities:** Differentiability (82), Governed Review Integrity (85). · **Evidence:** bundled JSON this pass has `priorityFloor` only. · **Design uncertainty reduced: 6** · **Market uncertainty reduced: 3** · **Classification: V1.1.**

> **Cursor prompt.** **Current problem:** `PolicyPackExpectationFacetParser` keys exist but bundled `ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/*.json` `advisoryDefaults` only set `priorityFloor`. Assigning SOC 2 / CIS as-shipped does not stamp coverage extras. **Desired behavior:** add documented example keys to **one** FinOps or sample overlay content file (not all 45 packs); keep unknown-key ignore behavior; add a test that parsing that file yields a non-empty facet. **Scope boundaries:** no new `PolicyPackContentDocument` properties; no `*-rules-v1.json` rule explosion. **Acceptance criteria:** parser test on the seeded file; existing packs without the keys still parse empty extras. **Non-goals:** making all 39 engines pack-aware.

**7. Extend golden-corpus harness past six engines.**
Tier 2 · **Why it matters:** declaration and expectation-coverage have sibling tests; the merge-blocking harness still registers six engines and `FileComplianceRulePackProvider`. · **Affected qualities:** Correctness (76), Governed Review Integrity (85). · **Evidence:** `GoldenCorpusHarness.CreateEngines()` this pass. · **Design uncertainty reduced: 7** · **Market uncertainty reduced: 2** · **Classification: V1.1.**

> **Cursor prompt.** **Current problem:** `GoldenCorpusHarness.CreateEngines()` registers only requirement, topology-coverage, security-baseline, security-coverage, compliance (`FileComplianceRulePackProvider`), and cost-constraint. **Desired behavior:** add `DeclarationSecurityBaselineFindingEngine` and `DeclarationPremiseConflictFindingEngine` to the harness with committed fixtures that assert at least one finding each; keep the existing six-engine snapshots stable. **Scope boundaries:** do not switch the default compliance provider to the full production filter in this change. Do not add all remaining engines. **Acceptance criteria:** new cases fail if those two engines are removed from `CreateEngines()`. **Non-goals:** portfolio-recurrence I/O in the in-process harness.

**8. Capture 6–8 operator screenshots (M-07) once typecheck is green.**
Tier 2 · **Why it matters:** unblocks **M-09**/**M-16** commercial motion. · **Classification: validation / owner-output** (not a V1 engineering defect). · **Market uncertainty reduced: 5.**

### Tier 3 — Hold For Reassessment

**9. One deep engine in resilience or segmentation semantics.** Hold until **G-REAL-06** indicates which category buyers argue about. **Classification: validation first.**

**10. Real frontier transcripts for the insight-density corpus.** Harness exists; corpus is synthetic. **Classification: validation first.**

**11. Owner decision: should density scoring apply to engine findings?** `typed-engine-protected` may be correct. Keep the distribution report explicitly advisory. **Classification: blocked on user input.**

## 18. Prompt Batching Guidance

**First batch — safe-for-Sonnet.** Item 1 (help resolver syntax) then item 4 (Alert rules guard). Removes the remaining *known broken* UI surfaces.

**Second batch — safe-for-Sonnet with review.** Item 3 (CodeQL) after item 1 so JS analysis can run.

**Third batch — owner + Opus.** Item 2 (**G-REAL-06**). Not a coding-agent substitute for live architecture judgment.

**Fourth batch — safe-for-Sonnet with review.** Items 6–7 (seed one overlay; golden-corpus declaration engines); item 5 (policy-toggle demo) once a staging tenant exists.

Do **not** batch “expand declaration maps,” “re-implement expectation stamp,” or “register InMemory architecture identity” — those are already in tree.

## 19. Model Usage Guidance

**Composer-safe:** screenshot capture (**M-07**) after compile recovers, snapshot regeneration, copy cleanup, the help-resolver syntax close.

**Sonnet-safe (default):** Alert-rules null-guard, CodeQL structural sanitizers, golden-corpus fixture authoring, overlay `advisoryDefaults` seeding, GTM drafting.

**Strong-model-recommended:** any change to policy filtering, authority pipeline, scope resolution, or evidence-graph semantics; CodeQL `user-controlled-bypass` sites if they touch authorization.

**Opus-or-Gemini-assessment-recommended:** this class of assessment; **G-REAL-06** finding-quality interpretation; the positioning decision in §20.

## 20. Pending Questions For Later

**Blocks V1:** Gate 5 FAIL (help resolver) as *execution*, not an owner *decision*. Remaining V1 execution after that: **G-REAL-06**, **G-COMMERCE-01**, CodeQL SARIF, Alert-rules crash.

**Blocks V1.1:** Should bundled packs ship expectation extras by default, or only tenant overlays?

**Requires customer validation:** Which analytical category do buyers actually argue about? Does policy-aware review change a real decision (§10.6)?

**Requires founder decision:** (a) Lead with *organizational repeatability* rather than *superior insight*? (b) Keep `typed-engine-protected` as a hard bypass? (c) Which finding stream is the product of record — sealed `FindingsSnapshot` or `AgentResult.Findings`? (d) Seed FinOps/CIS overlays with expectation keys, or keep mechanism test-only?

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

The repository still demonstrates serious principal-architect judgment in unglamorous places: disposition-aware ROI that *documents* non-summation of per-system rows; `claimBoundary` on insight-density artifacts refusing to claim victory over named frontier models; an emission gate that refuses prose-only decision-grade findings; a ship-gate runner that returns FAIL when it cannot load a run; additive-floor expectation extras that cannot drop heuristic pillars; fail-open governance stamp that does not fail the review; a published list of Azure roles the product will never request; enforced absence of `terraform apply`.

The taste failure remains proportion: 39 engines and 6 in the harness; 45 packs whose bundled JSON still does not use the new expectation keys; 791 rules and a thin corpus; density instrumentation that gates nothing; a help catch-all truncated on `master`. The remaining author-signal risk is talking about policy-aware review as if default pack assignment already parameterized coverage — it does not — and elaborating measurement faster than repairing the compile and running three real reviews.
