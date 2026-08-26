# ArchLucid Strategic Release and Market Readiness Assessment (v3)

**Pass date:** 2026-08-26 (evening). **Computed fresh** — no carry-forward, no score deltas, no rescore ratchet. The prior same-day pass (compile-blocker snapshot) is archived at [`../archive/assessments/LATEST_GPT55-2026-08-26-compile-blocker-superseded.md`](../archive/assessments/LATEST_GPT55-2026-08-26-compile-blocker-superseded.md) and is **not** canonical.

**Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#strategic-release-and-market-readiness-v3). **Reasoning engine:** Cursor Grok 4.6, simulator-aware; **no live Azure OpenAI call was made during this pass**, so all agent-path judgments are about mechanism and default configuration, not observed real-mode output.

**Source materials inspected this pass:** `V1_SCOPE.md`, `V1_DEFERRED.md`, `ASSESSMENT_INPUTS.md`, `.cursor/rules/Assessment-Scope-V1_1.mdc`, `CONFIGURATION_REFERENCE.md` (orient), `DEFAULT_POLICY_PACKS_V1.md`, `TECH_BACKLOG_OPEN.md`, `GTM_BACKLOG.md`, `ASSESSMENT_PROMPT_SERIES.md` v3, plus direct code reads of `DeterministicInsightDensityGate`, `InsightDensityGateOptions`, `BuiltInFindingEngineTypeCatalog`, `GoldenCorpusHarness`, `PolicyFilteredGoldenCorpusTests`, `DeclarationSecurityBaselineClassifier`, `BicepInfrastructureDeclarationParser` / `BicepResourceBodyParser`, `KubernetesManifestCanonicalObjectMapper`, `TrustBoundaryFindingEngine`, `RequestActorMaterializer`, `InMemoryStorageProviderRegistrar`, `ShipGateEvidenceRunner`, `ci.yml` trigger rules, and the committed insight-density quality artifacts.

**Executed this pass (runtime evidence, not doc claims):**

- `npm run typecheck` — **pass**. `npx tsc --noEmit -p tsconfig.build.json` — **pass** (exit 0). `next.config.ts` does **not** set `ignoreBuildErrors`. `OperatorShellMessage` exists at `archlucid-ui/src/components/OperatorShellMessage.tsx`.
- `dotnet test` **Suite=Core**, Release: `ArchLucid.Decisioning.Tests` **324 passed / 0 failed**; `ArchLucid.Core.Tests` **818 passed / 0 failed**; `ArchLucid.Application.Tests` **1965 passed / 0 failed**.
- `npx vitest run` `operator-client-pages-render-gate.test.tsx` — **2 failed / 19 passed**. Failures: Alert rules content (`rules.slice is not a function` in `resolve-continue-last-alert-rule.ts`); Advisory hub Scans tab heading. **PolicyPacksPage, PlanningPage, and SearchPage now pass.** Full Vitest matrix was not re-run this pass (~19 min historical); do not treat the prior 744-failure count as current.
- GitHub Actions on `master`: CodeQL run [33005058646](https://github.com/joefrancisGA/ArchLucid/actions/runs/33005058646) **failed** on SARIF gates (**7 C#** + **2 JS** unresolved). OpenAPI snapshot refresh and synthetic probes **succeeded**. Full `ci.yml` does **not** run on `master` push (PR / `workflow_dispatch` only).

Verified counts by direct inspection: **39** registered finding engines, **45** bundled policy-pack content files, **791** rules in `ga-starter-compliance.rules.json`, **6** engines in the golden-corpus harness, **398** audit event-type constants.

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows. Excludes GTM V1.1 items **#2/#3/#5/#6** (**M-90**/**M-44**/**M-91**/**M-92**) per standing exclusion rule. Owner assurance programs **G-REAL-05** / **G-ASSURANCE-02** appear here only because they are human-executed; they do **not** reduce `(A)`. **M-190**/**M-191**/**M-196**/**M-197** are **Done** — not listed.

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|-----------------|--------------------|--------------------|
| 1 | **G-REAL-06** — three real-mode pilot runs | Dominant remaining deficiency driver. Insight-density, 30-day usage, and purchase-probability numbers stay low-confidence until this runs. Trunk compile/Suite=Core no longer blocks it. | Partial — agent can prepare scenarios, run scripts, capture packets; owner must supply real architecture + judgment | **Opus** — pilot design and finding-quality interpretation materially change the conclusion |
| 2 | **G-REAL-07** — proof packets + `PROOF_PACKET_RUN_LOG` | Depends on #1 output. Converts pilot runs into reusable buyer evidence. | Partial | **Sonnet** |
| 3 | **M-39** — apply proof-packet checklist, ≥3 G4 rows | Depends on #2. Stage 1 selling gate. | Partial | **Sonnet** |
| 4 | **M-07** — polished operator screenshots | Blocks **M-16** and remaining **M-09** deploy; cheapest asset that unblocks commercial motion. UI now typechecks/builds, so capture is unblocked. | Partial — agent can drive capture harness; owner picks final frames | **Composer** — high-volume mechanical capture |
| 5 | **M-09** — landing owner sign-off + deploy | In progress; gated on #4. No inbound motion without it. | Partial | **Sonnet** |
| 6 | **M-16** — demo video | Depends on #4. | Partial | **Sonnet** |
| 7 | **G-COMMERCE-01 / M-94** — invoice + SOW readiness (tax, entity, payment methods) | Revenue-blocking for the sales-led V1 motion; owner-only financial/legal setup. | No — human only | N/A — human only |
| 8 | **G-COMMERCE-02 / M-95** — first paid engagement on invoice/SOW path | Depends on #7 and on pilot proof from #1–#3. | No — human only | N/A — human only |
| 9 | **M-110** — Quick Scan AI go/no-go | **TB-902** is Done **YELLOW** (sample-only public release). Owner still must record GREEN/YELLOW/RED before enabling `AnonymousExecutionEnabled` in production. | Partial | **Sonnet** |
| 10 | **G-REAL-05** (SOC 2 CPA) and **G-ASSURANCE-02** (third-party pen test) | Owner assurance programs. Not `(A)` gates; listed for sequencing only. | No — human only | N/A — human only |

---

## 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 75.65%**

**Not capped by a ship-gate FAIL.** Gates 2–4 and 6 pass on mechanism plus Suite=Core evidence. Gate 5 **passes compile** (`tsc` + `tsconfig.build.json` clean; `OperatorShellMessage` present). Gate 1 remains **UNKNOWN** (no SQL-backed live first review in this environment). Residual UI render-gate failures exist on Alert rules and Advisory Scans — they do **not** fail the first-review / demo compile path.

Readiness excludes deferred items per `V1_DEFERRED.md` and `Assessment-Scope-V1_1.mdc`: SOC 2 CPA attestation, third-party pen-test publication, signed design partner, owner-output GTM assets/cohorts, public extension SDK, MCP absence in V1, third-party plugin marketplace, assistive-technology participant testing, and sales-engineer-led LLM onboarding.

---

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 65 | 13 | 8.45 | **455** |
| 2 | Differentiability / Defensibility vs Frontier AI | 78 | 13 | 10.14 | **286** |
| 3 | Governed Review Integrity | 83 | 13 | 10.79 | 221 |
| 4 | Correctness & Evidence Integrity | 80 | 12 | 9.60 | 240 |
| 5 | AI / Agent Readiness | 74 | 10 | 7.40 | 260 |
| 6 | Time-to-Value | 72 | 10 | 7.20 | 280 |
| 7 | Proof-of-ROI Readiness | 76 | 9 | 6.84 | 216 |
| 8 | Sponsor / Operator Comprehension | 74 | 8 | 5.92 | 208 |
| 9 | Runtime & First-Review Reliability | 73 | 7 | 5.11 | 189 |
| 10 | Adoption Friction | 84 | 5 | 4.20 | 80 |
| | **(A) Headline readiness** | | **100** | **75.65%** | |

**Ranked by weighted deficiency:** Insight Density (455) · Differentiability (286) · Time-to-Value (280) · AI/Agent Readiness (260) · Correctness (240) · Governed Review Integrity (221) · Proof-of-ROI (216) · Comprehension (208) · Runtime (189) · Adoption Friction (80).

**Note on the shape of this scorecard.** Insight Density is the only top deficiency that is **architectural**. Differentiability is next because policy awareness is real but narrow (one engine of 39). Time-to-Value and the commercial diagnostics remain limited by **unrun real-mode pilots**, not by a compile failure. Runtime recovered because the UI typechecks and Suite=Core is green; it is still discounted for unresolved CodeQL SARIF findings and for full CI not auto-running on `master` push.

---

## 3. Diagnostic Scores (non-headline)

These do **not** feed the headline.

**Decision Advantage Score: 62/100.** Likelihood ArchLucid changes a decision frontier AI alone would not. Credit for policy-filtered compliance evaluation (a tenant's own enabled rule set determines which of 791+ rules fire — a frontier chat session has no equivalent persistent state), for the open-commitment engine (overdue deferrals and expiring waivers derived from governance history), for cross-declaration premise conflict, and for declaration-security findings now reachable from **Bicep bodies** and **Kubernetes security spec fields**. Discount because engine depth is still predominantly graph-shape and checklist coverage rather than architectural judgment, and because dedicated engines for resilience posture, segmentation semantics, IAM depth, and observability still do not exist.

**Frontier-AI Survival Probability (12 months): 55–70%, moderate confidence.** Reference class: vertical governance/workflow wrappers around a commoditizing model layer. Base rate ~50–60%. Adjusted **upward** because the policy-pack→rule-filter→finding→decision→audit chain is persistent tenant state. Adjusted **downward** because generic-critique value is already commodity and the deterministic floor is still checklist-height outside compliance and a few effectful engines.

**30-Day Voluntary Usage Probability: 35–50%, low-moderate confidence.** Reference class: enterprise architecture tooling adopted voluntarily by senior ICs — base rate 20–30%. Adjusted up for sealed-package / audit-trail output and for Bicep/Kubernetes no longer silently empty. Adjusted down because default host mode is Simulator, LLM judge defaults off, and no live-pilot retention signal exists.

**Sponsor Purchase Probability: 25–40%, low confidence.** Reference class: net-new governance tooling purchased on a pilot, no reference customer, sales-led motion — base rate 20–35%. Adjusted marginally up for genuine audit and ROI packaging; held down by zero completed real-mode pilots (**G-REAL-06** not started). Confidence is low specifically because that owner work has not run.

**Reconciliation with §2.** The headline (75.65%) sits above Decision Advantage (62) and the purchase band (25–40%). That is the product's central tension: **engineering delivery against the V1 contract is now compilable and Suite=Core-green**, while **whether any of it changes a buying decision is unproven**. A respectable headline with a mediocre decision-advantage score is the profile of a product that has built the container; the contents are deeper than a compile-broken trunk suggested, but still shallower than a principal architect's review.

---

## 4. V1 Ship Gate

`ShipGateEvidenceRunner` maps 1:1 to these six gates. It requires a live API and a committed `runId`. This environment has no SQL-backed API, so live-execution gates are **UNKNOWN** rather than assumed PASS.

| # | Gate | Verdict | Evidence | Fastest resolution |
|---|------|---------|----------|--------------------|
| 1 | First review completes create → execute → commit → manifest + ≥1 artifact | **UNKNOWN** | Mechanism and tests exist (`BuildGate1Async`). Not executed here. | Run `archlucid pilot ship-gate-evidence` against a SQL-backed staging API with a committed run. |
| 2 | No hallucinated or uncited policy/evidence citations | **PASS (mechanism)** | `AgentArchitectureFindingEmissionGate` strips decision-grade agent findings lacking both `PolicyRuleId` and `EvidenceRefs`; `CitationIntegrityEvaluator` scores a committed run. **Honest limit:** semantic hallucination audit remains manual. | Keep as PASS on mechanism; upgrade after gate 1 runs live. |
| 3 | Sponsor summary / ROI coherent and not misleading | **PASS (mechanism)** | Disposition-aware headline, `headlineSavingsScopeCode` labeling, board-pack delegates to the same service. **TB-603** (AWS/GCP structured retail-price grounding) is **Done**. | As above. |
| 4 | Export / package generation works (Markdown / DOCX / ZIP) | **PASS (mechanism + Suite=Core)** | `ArchLucid.Application.Tests` Suite=Core **1965 passed / 0 failed**, including the comparison-export formatter cases that previously failed. Live ZIP/DOCX against a committed run not executed here. | Optional: `ShipGateExportMatrixProbe` on staging. |
| 5 | Architect workspace does not break during first-review / demo path | **PASS (compile)** | Production typecheck clean; `tsconfig.build.json` clean; `OperatorShellMessage` present. Render-gate: PolicyPacks / Planning / Search **pass**. Residual: Alert rules `rules.slice` crash and Advisory Scans heading fail — Operate-layer, not first-review compile. | Fix Alert rules continue-last helper; then optional live demo walk. |
| 6 | Auth + tenant isolation behave correctly on the pilot path | **PASS (mechanism)** | Database-per-tenant topology (ADR 0037), `ScopeResolutionGuardMiddleware`, tenant-isolation negative probes in the ship-gate runner. | As gate 1. |

**No FAIL caps the headline.** Gate 1 UNKNOWN is the honest remaining execution hole. CodeQL SARIF failures are a **security-merge** problem, not a numbered ship-gate FAIL.

---

## 5. Sponsor Summary

**(A) Overall headline readiness — 75.65%, not ship-gate-capped.**

ArchLucid is a working governed architecture-review system whose **front door compiles**. An architect submits a structured request or uses guided intake; the system ingests documents and infrastructure declarations into a canonical graph; 39 deterministic finding engines run over that graph; the tenant's *own enabled* compliance rules evaluate against it; a sealed manifest with an authority chain is produced; exports, sponsor ROI rollups, and ITSM tickets package the result against an append-only audit trail with database-per-tenant isolation.

Governance is not decoration: `ComplianceRulePackGovernanceFilter` intersects the rule universe with the tenant's enabled keys and a priority floor; `TenantCuratedComplianceRulePackMerger` folds in tenant-authored rules; `PolicyFilteredGoldenCorpusTests` now asserts two postures emit different compliance findings. Approval workflow enforces separation of duties; the pre-finalize gate can block on severity; a dry-run surface shows what a policy change would do. Forty-five curated policy packs ship bundled.

The remaining weakness is **contents, not container, and not compile**. Deterministic engines are still predominantly coverage and structure checks. There are no dedicated engines for resilience/DR, IAM depth, secrets/key lifecycle, network segmentation semantics beyond edge presence, observability, or capacity. `TrustBoundaryFindingEngine` and `PrivilegedAccessFindingEngine` need `Actor` nodes; those materialize from **request/intake** (`RequestActorMaterializer`) and knowledge-model stakeholders, **not** from IaC documents — a pure Bicep/Helm dump still under-triggers those two engines. Insight-density scoring still computes a number for every engine finding and then **promotes unconditionally** via `typed-engine-protected`.

**(B) Procurement / market realism (weight 0 in `(A)`).** Trust posture is honest: SOC 2 self-assessment plus roadmap, CAIQ/SIG/DPA templates, subprocessor register, owner-conducted penetration exercise, published Azure roles ArchLucid will never request, Tier 1 ingestion with no vendor access to a customer cloud. A CPA-issued SOC 2 report and a third-party pen-test summary do not exist — correctly out of `(A)`, still friction for hard-gate buyers. Honest talk-tracks (**M-196**/**M-197**) and the minimum pilot trust packet (**M-190**/**M-191**) are **Done** as content. Live buyer security review has not happened.

**Commercial picture.** Sales-led V1: pricing page, order-form template, TEST-mode trial. Live commerce un-hold is V1.1 owner-only. Compelling today: audit-ready packaging and repeatability a chat transcript cannot produce. Unproven: voluntary return and paid conversion. **G-COMMERCE-01** is not done, so a willing first buyer still has no clean invoice path.

**Enterprise picture.** Tenancy, RBAC, SCIM, SAML and OIDC, private endpoints, and audit coverage are at a credible enterprise bar. Hesitation will come from assurance paperwork and from the depth question in the first 20 minutes: "what did this find that I wouldn't have?"

**Engineering picture.** Stronger in execution than this morning's compile-broken trunk. Suite=Core is green on the three product test assemblies run this pass; UI typecheck and `tsconfig.build.json` are clean; OpenAPI snapshot refresh succeeded on recent `master` pushes. Against that: CodeQL SARIF gate is red on `master` (9 unresolved findings); full `ci.yml` does not run on `master` push; Alert rules render-gate still crashes; golden corpus still exercises 6 of 39 engines and bypasses the production `PolicyFilteredComplianceRulePackProvider` wiring even though a dedicated filter test now exists.

**Frontier-AI picture.** ArchLucid gets *more* valuable as base models improve, because better models produce better findings that flow into the same policy mappings and audit structures at zero engineering cost — but only if the deterministic floor is deep enough that the product is not merely a wrapper around whichever model is current.

---

## 6. Deferred Scope Uncertainty

**V1.1:** CloudEvents outbound webhooks and customer-operated recipe bridges; MCP read-only membrane; multi-region active/active; commerce un-hold. Deferral is safe for V1 — the V1 automation contract (REST, CLI, workspace, SCIM, CI decoration, first-party Jira/ServiceNow/Confluence/Slack/Teams) covers pilot needs.

**V2:** third-party pen-test program; SOC 2 CPA; automated tenant-erasure quarantine; Redis-as-default substrate; DTF / Container Apps Jobs. Safe for V1. Erasure has operator purge paths as the interim seam.

**Genuine uncertainty:** Graph-RAG community summarization stays deferred per ADR 0057 pending pilot signal. Do not build it before **G-REAL-06** says retrieval depth is the limiter.

---

## 7. Weighted Quality Assessment (detail)

Ordered by weighted deficiency signal.

### 7.1 Decision-Changing Insight Density — 65 · weight 13 · contribution 8.45 · deficiency 455

**Justification.** `docs/architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS.md` still states the pillar clause **"miss"** is not covered: existing mechanisms penalize generic phrasing, prune weak Critic prose, and optionally LLM-judge — all **subtractive**. A filter raises precision, never density.

Verified this pass:

1. **The density gate still does not gate engine findings.** `DeterministicInsightDensityGate.Score` returns `Promote` / `DecisionGradeFinding` whenever `IsAgentArchitectureFinding` is false, after adding `typed-engine-protected`. The score is computed and discarded. All **39** engines take this path. `docs/quality/insight-density-engine-distribution.md` labels itself advisory-only.
2. **Frontier baselines are still not frontier baselines.** `tests/eval-corpus/insight-density-frontier-delta/README.md` states they are **not** captured frontier-model transcripts. Three fixtures; the 100% novelty scenario is an empty baseline by construction.
3. **The Bicep/Kubernetes silent-empty chain is no longer true.** `BicepResourceBodyParser` flattens resource bodies into the same `tf.*` property bag Terraform uses. `KubernetesManifestCanonicalObjectMapper.ProjectSecuritySpecFields` projects `privileged`, `hostNetwork`, `allowPrivilegeEscalation`, NetworkPolicy presence, and Service `type`. `DeclarationSecurityBaselineClassifier` consumes those keys. This is a real substance recovery versus a compile-era reading of the parsers.

Engine depth still compounds the pillar. Graph-pure engines are dominated by coverage/gap/traceability over graph shape. Absent: dedicated RPO/RTO, IAM depth, secrets/key lifecycle, segmentation *semantics*, observability, capacity. Actor-dependent engines fire from **intake**, not from IaC-only uploads.

**Credit.** Policy-filtered compliance (791+ rules, tenant-enabled subset); `OpenCommitmentFindingEngine`; `DeclarationPremiseConflictFindingEngine`; `PortfolioRecurrenceFindingEngine` (effectful; default-off in some host configs).

**Tradeoffs.** Typed-engine protection prevents a heuristic from suppressing deterministic output. It also means density is unmeasured where most findings originate.

**Recommendations.** Do not add more coverage-shaped engines. Capture real frontier transcripts after a real architecture exists. Owner-decide whether engine findings should ever demote. One deep judgment engine only after **G-REAL-06** names the category.

**Classification:** V1 residual (measurement honesty) + market validation. **Affects outcomes 1, 3, 5.**

### 7.2 Differentiability / Defensibility vs Frontier AI — 78 · weight 13 · contribution 10.14 · deficiency 286

**Justification — rubric level: High, approaching Excellent on the compliance path.**

Changing a policy pack changes which of 791+ rules evaluate, which changes findings, severity, pre-finalize gate, sponsor ROI basis, and the audit record. `PolicyFilteredGoldenCorpusTests` now fails if two postures emit the same compliance findings. That is the rubric's "Excellent" definition for **compliance**, and prompting cannot hold it.

**The deduction is still narrowness.** Exactly one of 39 engines is policy-filtered. The other 38 run identically regardless of tenant policy posture. The moat is a *compliance rule-set* moat, not a *review* moat.

**Recommendations.** The one-screen policy-toggle demo (findings + severity + gate + audit) is the highest-leverage *visibility* fix. Extending policy vocabulary to security-baseline and declaration engines is V1.1 design work, not a flag.

**Classification:** V1 mechanism complete for compliance; V1.1 to widen. **Affects outcomes 1, 2, 5.**

### 7.3 Time-to-Value — 72 · weight 10 · contribution 7.20 · deficiency 280

**Justification.** The designed pilot path is short: configure, start, create review, execute, finalize, review package. Guided intake, reference-architecture exemplars, sample/demo runs, and `stack doctor` reduce first-run friction. The UI **typechecks and can be built**, so a deployed first screen is no longer undefined.

Remaining deductions: first-review live E2E was not run here (gate 1 UNKNOWN); extractor-based cost/inventory still needs customer credentials for Tier 2; large UI polish backlog with owner screenshot scores often 40–55/100; Simulator default means the first "wow" may be canned.

**Classification:** V1 residual + validation. **Affects outcomes 1, 3.**

### 7.4 AI / Agent Readiness — 74 · weight 10 · contribution 7.40 · deficiency 260

**Justification.** Operationally mature: real/simulator separation, Application-layer orchestration, `AgentResult` schema validation, `WarnOnly` / `PilotStrict` quality-gate modes, LLM budget reservation and monthly caps, prompt-cache prefix, per-snapshot judge ceilings, tenant overrides for judge and portfolio-recurrence.

Deductions: default host mode is Simulator; `EnableLlmJudge` and `EnableLlmJudgeForEngineFindings` **default false** (`InsightDensityGateOptions`); Graph-RAG bounded multi-hop with community summarization deferred; eval corpus is synthetic; nightly real-mode loop is not a live tripwire executed this pass.

**Recommendations.** Nothing new to build before pilots. The gap is evidence, not mechanism.

**Classification:** V1 mechanism complete; validation required. **Affects outcomes 1, 5.**

### 7.5 Correctness & Evidence Integrity — 80 · weight 12 · contribution 9.60 · deficiency 240

**Justification.** Citation and payload machinery is strong: emission gate, citation evaluator, typed payloads, extractor `collectionTimestamp` citation contract. Suite=Core is **green** on Decisioning / Core / Application this pass.

Deductions: citation probes prove a citation *exists*, not that it supports the claim. Full Vitest matrix not re-run. Render-gate still has two failures, including a `TypeError` on Alert rules. CodeQL SARIF lists unresolved `cs/user-controlled-bypass`, `cs/log-forging`, `cs/insecure-sql-connection`, `js/clear-text-storage-of-sensitive-data` — these may be false positives or real; they are unresolved in CI.

**Classification:** V1. **Affects outcomes 1, 2, 4.**

### 7.6 Governed Review Integrity — 83 · weight 13 · contribution 10.79 · deficiency 221

**Justification.** Policy→evidence→finding→decision→audit is materially complete. Sealed golden manifests; authority replay; 398 typed audit event constants (scope doc still says 78 — the catalog grew); SoD approvals; pre-finalize gate; policy dry-run; disposition trail feeding ROI and open-commitment; ITSM `FindingId` correlation.

Deductions: `GoldenCorpusHarness.CreateEngines()` still constructs `FileComplianceRulePackProvider` directly — the dedicated filter test covers the moat, the six-engine harness path does not. Dual finding model: sealed `FindingsSnapshot` vs `AgentResult.Findings` often leading buyer-facing exports.

**Classification:** V1. **Affects outcomes 2, 4, 5.**

### 7.7 Proof-of-ROI Readiness — 76 · weight 9 · contribution 6.84 · deficiency 216

**Justification.** Layered, honestly labeled ROI: latest-committed-run-per-system, `FindingId` dedup, tenant-rate/EA-discount math, disposition-aware headline, `headlineSavingsScopeCode`, 30-day value-report kept separate, board-pack identical by construction. **TB-603 is Done** — AWS/GCP structured retail-price lookups exist with heuristic fallback.

Deduction: zero real pilot deltas, so every savings figure is model- or fixture-derived.

**Classification:** V1 residual + validation required. **Affects outcomes 3, 4.**

### 7.8 Sponsor / Operator Comprehension — 74 · weight 8 · contribution 5.92 · deficiency 208

**Justification.** Design-system work is real: Carbon-derived tokens, `StatusTag`/`SeverityTag`, enterprise tables, in-app `/help/{topic}`, insight-density curation banner, buyer-label vocabulary.

This pass's render-gate shows PolicyPacks / Planning / Search **recover**. Remaining: Alert rules crash (`rules` not an array); Advisory Scans heading fail; large route backlog scored 40–55/100; dual finding counts can confuse a sponsor; **TB-882** UI/authority drift guard still held.

**Classification:** V1. **Affects outcomes 2, 4.**

### 7.9 Runtime & First-Review Reliability — 73 · weight 7 · contribution 5.11 · deficiency 189

**Justification.** Health endpoints, correlation IDs, outbox/DLQ, idempotency, run-execute leases, budget cutoffs, Redis auto-selection, `ShipGateEvidenceRunner`. UI compile recovered. `InMemoryArchitectureIdentityRepository` is registered on the InMemory composition path.

Deductions: CodeQL SARIF gate **fails** on current `master` SHAs; `ci.yml` full matrix is **not** a `master` push check; gate 1 live first-review UNKNOWN here; Alert rules client crash is a real runtime defect on that Operate route.

**Classification:** V1. **Affects outcomes 2, 3.**

### 7.10 Adoption Friction — 84 · weight 5 · contribution 4.20 · deficiency 80

**Justification.** Broad configuration surface: OIDC, SAML SP, API keys, SCIM, four RBAC roles, database-per-tenant, docker compose, Terraform including Entra/Key Vault, private endpoints/WAF, `Integrations:Itsm:NativeEnabled` default true, CLI `doctor` / `support-bundle`. UI is now a buildable artifact.

Deductions: connector auth still basic-auth/API-token MVP (**TB-600** OAuth tightening); Tier 2 extractor needs customer-provisioned credentials.

**Classification:** V1 residual. **Affects outcomes 2, 3.**

---

## 8. Top 10 Weaknesses

1. **Insight density is still subtractive.** The gate, pruner, and optional LLM judge discard generic output; nothing generates a finding a skilled architect would miss. Design uncertainty. **Not a V1 contract blocker**; it is the binding constraint on outcomes 1 and 5. Fastest path: stop adding coverage engines; run **G-REAL-06**; then one deep engine in the category the pilot actually argued about.
2. **Zero completed real-mode pilots (G-REAL-06).** Pure market uncertainty. Not a V1 engineering blocker; it is the blocker on every commercial diagnostic in §3. Fastest path: owner-executed three-run protocol.
3. **Policy-aware moat covers one engine of 39.** Differentiation is a compliance rule-set moat, not a review moat. Design uncertainty. Fastest path: one-screen policy-toggle demo now; vocabulary for security/declaration engines later.
4. **Golden corpus still covers 6 of 39 engines.** Merge-blocking harness path does not include declaration, open-commitment, portfolio-recurrence, or the production policy-filtered *provider* (a separate unit/e2e filter test now exists). Design uncertainty. Fastest path: add those engines to the harness incrementally; do not expand rule count.
5. **CodeQL SARIF gate is red on `master`.** 7 C# + 2 JS unresolved findings (`cs/insecure-sql-connection`, `cs/user-controlled-bypass`, `cs/log-forging`, `js/clear-text-storage-of-sensitive-data`, `js/incomplete-sanitization`). Design/security uncertainty. Not a numbered ship-gate FAIL, but it is the live `master` workflow that actually runs on push. Fastest path: structural fixes or verified suppressions that populate SARIF `suppressions`, not trailing comments alone.
6. **Full CI does not run on `master` push.** `ci.yml` is PR + `workflow_dispatch`. Typecheck/Suite=Core can regress on direct pushes until the next PR. Process uncertainty. Fastest path: required checks on PRs (already partially present: `ui-typecheck`) and either workflow_dispatch after merge or a thin `master` corset.
7. **Alert rules client crash.** `resolveContinueLastAlertRule` calls `.slice` on a non-array; render-gate fails TB-1584. Design uncertainty. Not first-review blocking. Fastest path: null/shape-guard the continue-last helper.
8. **Actor-dependent engines stay silent on IaC-only reviews.** `RequestActorMaterializer` covers guided intake; Bicep/Helm dumps do not create `Actor` nodes. Design uncertainty. Fastest path: document the intake requirement in first-review UX; optionally derive actors from IAM/service-account declarations later.
9. **Dual finding model.** Sealed engine snapshot vs agent stream that buyer exports often lead with. Simulator default plus judge-off means the impressive stream is canned. Design uncertainty. Fastest path: founder decision which stream is the product of record.
10. **Insight-density "evidence" is synthetic.** Frontier-delta fixtures are self-declared non-transcripts. Treating those numbers as novelty proof is a claim-honesty risk. Mixed design/market. Fastest path: capture real transcripts after **G-REAL-06**.

---

## 9. Frontier-AI Analysis

### Commodity vs Durable

| Capability | 12-month outlook | Reason / evidence |
|---|---|---|
| Generic architecture critique prose | **Commodity now** | Any frontier model produces comparable output from a good prompt |
| Graph coverage / structure checks | **Commodity within 12 months** | Shape checks, not judgment |
| Declaration property extraction | **Commodity** | Models parse Terraform/ARM/Bicep well; ArchLucid's parsers now feed classifiers, which is **packaging**, not unique parsing |
| **Tenant-specific enabled rule set** | **Durable** | Persistent, versioned, per-scope state |
| **Sealed manifest + authority chain + replay** | **Durable** | Infrastructure, not inference |
| **Append-only typed audit reconstruction** | **Durable, more valuable over time** | Compounds with history |
| **Cross-run / portfolio state** | **Durable** | Open-commitment, portfolio recurrence, cross-run diff |
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

**Not yet faster than frontier AI, but the container is now shippable enough to test the bet.** Invest in the *deterministic* floor and in **real pilots**, not in more prompting or more coverage engines.

---

## 10. Policy-Aware Governance Test

1. **Do policy packs drive behavior?** **Yes, for compliance.** Filter + merger + golden two-posture test. For the other 38 engines, packs are effectively inert.
2. **Can each major finding trace the chain?** Engine/compliance: yes when `EvidenceRefs` / `PolicyRuleId` / disposition / audit are populated. Agent: only those surviving the emission gate.
3. **Would a skilled architect reproduce this without ArchLucid?** No for the governed package, repeatability, and audit reconstruction. Largely yes for analytical content.
4. **AI-generated vs governed infrastructure?** AI: agent findings, cost narratives, comparison explanations. Governed: policy filtering, sealed manifests, replay, audit, approvals, disposition, ITSM correlation.
5. **What would prove the moat?** Two tenants, identical architecture, different packs, materially different findings/severities/gate/sponsor totals — captured as an artifact. Mechanism exists; buyer-facing artifact does not.
6. **Fastest validation?** In **G-REAL-06**, run one architecture twice under two governance postures.
7. **Demo that makes the moat obvious?** Toggle one pack; show findings, severity, pre-finalize verdict, and audit entry change on one screen.

---

## 11. Principal Architect Dismissal Test

**"I need this":** sealed, replayable review record; disposition lifecycle; overdue-commitment and expiring-waiver findings; Jira/ServiceNow correlation.

**Voluntary return:** portfolio-level state — recurrence across systems, waivers expiring this quarter. Cross-run memory is the retention mechanism, not critique quality.

**Immediate dismissal:** recognizing every finding as already-known (still the most likely trigger, **45–60%** on a first IaC-only review — down from a Bicep/K8s-silent-empty world). Second trigger: Simulator-labeled canned output presented as Real. Third: Alert-rules or other Operate-layer crash if they wander off the first-review path.

**Would they believe ArchLucid is materially better than "Claude + a good prompt + my company standards pasted in"?** **For a single review: still no.** **For the tenth review across the fifth system with a governance board asking for the audit trail: yes.** Position *organizational repeatability*, not per-review insight. The sponsor is the buyer; the architect is the gatekeeper.

---

## 12. Founder Delusion Check

**Strongest assumption with weakest evidence:** that decision-changing insight density is a measurement and curation problem. Everything built for it measures or subtracts. The "miss" clause is unaddressed.

**Looks differentiated, already commodity:** generic critique, structural coverage, declaration parsing, retrieval depth.

**Looks ordinary, may be the strongest moat:** the disposition trail. Unglamorous bookkeeping that makes open-commitment, honest ROI, and the tenth review possible.

**Could burn months without improving the five outcomes:** more curated policy-pack content (45 packs, 791 rules — constraint is one consuming engine); more UI route polish across 200+ open rows; Graph-RAG community summarization; more synthetic eval corpus.

**If features froze for six months:** run three real pilots and rewrite positioning around organizational repeatability.

**Most dangerous attractive distraction:** going from 39 to 60 coverage-style engines.

**Most boring real moat:** audit catalog + disposition trail.

**This pass's correction:** the assumption that trunk is unshippable because the UI does not compile is **stale**. Continuing to treat compile failure as the #1 weakness would misallocate the next week. The #1 remaining weakness is **unproven insight + unrun pilots**, with CodeQL SARIF as the live engineering merge tax.

---

## 13. Competitive Reality Check & Moat Assessment

**What a skilled architect with frontier AI already does:** reads IaC, spots misconfigurations, critiques topology, produces a review document, cites standards from memory or paste.

**What ArchLucid does substantially faster/more consistently:** same *shaped* package every time; evaluates the organization's enabled rule set; preserves decisions/exceptions across reviews; reconstructs who decided what; correlates findings to tickets.

**Commodity within 12 months:** analytical content, retrieval depth, parsing.

**More valuable as AI improves:** every governance surface.

**Requires enterprise workflow:** SoD approvals, pre-finalize gating, audit reconstruction, disposition lifecycle, sponsor/operator separation.

**Requires customer-specific policy state:** enabled rule subset, priority floors, scope assignments, curated tenant rules.

**Current moat:** governed repeatability plus audit reconstruction. **Potential future moat:** portfolio-level architectural memory (partially built). **Weakest moat assumption:** that policy-pack awareness differentiates review *broadly*. **Most durable:** audit reconstruction and disposition history cannot be prompted. **Probably illusory:** insight-density superiority over frontier models. **Boring but durable:** the audit catalog. **Buyer-obvious moat:** §10.7 policy-toggle demo.

---

## 14. Adoption & Monetization

**30-Day Voluntary Usage (10 principal architects).** Strongest positive: portfolio and commitment findings that accumulate. Strongest negative: first review still checklist-shaped. Most likely return reason: an expiring-waiver or recurrence finding that mattered. Most likely stop reason: recognizing every finding as already-known.

**Sponsor Purchase.** Strongest driver: audit-ready packaging that survives architecture, security, compliance, and board review. Strongest blocker: no completed pilot, no reference. Minimum proof: **G-REAL-06** → **G-REAL-07** → **M-39**. Likely objection: "our architects already use Claude."

**Why buy ArchLucid instead of more frontier-AI licenses?** Licenses give analysis; ArchLucid gives a *record*. More licenses do not give: which standards were evaluated on which system when; consistency across architects; exception/waiver lifecycle; audit reconstruction; ticket correlation; portfolio recurrence. The argument that ArchLucid finds things Claude cannot is **still not honest** as a blanket claim.

**Top 6 monetization blockers.** (1) No pilot proof — **G-REAL-06**; validation. (2) No case study/reference — **M-32**; validation. (3) Invoice/SOW incomplete — **G-COMMERCE-01**; owner. (4) Landing/demo assets not live — **M-07**/**M-09**/**M-16**; mixed. (5) Depth objection from the technical evaluator — engine depth + honest repositioning. (6) SOC 2 CPA for hard-gate buyers — `(B)` only; talk-track Done (**M-196**).

**Top 6 enterprise adoption blockers.** (1) No pilot case study — trust; scale. (2) Connector/extractor credential setup — workflow fit; pilot. (3) Checklist-depth findings — buyer value; pilot. (4) Retrieval/eval due diligence — auditability; scale. (5) Architects preferring their own tools — process; scale. (6) Procurement timing/assurance paperwork — trust; scale.

---

## 15. Most Important Truth

**ArchLucid now compiles and its Core test corset is green — the remaining problem is that the governance container is stronger than the insight that flows through it, and no real-mode pilot has proven the container changes a decision.**

The compile-era diagnosis (147 TypeScript errors, missing `OperatorShellMessage`, 12 failing backend tests, silent Bicep/Kubernetes security findings) is **not** the current trunk. Treating it as current would send the next week into already-closed work.

What is current: 39 engines still mostly coverage-shaped; density scoring still discarded for every typed engine; golden corpus still 6/39; policy packs still drive **one** engine; **G-REAL-06** still unstarted; CodeQL SARIF still failing the workflow that actually runs on `master` push. The honest position remains *organizational repeatability*, not superior insight. Selling the latter will still fail a serious technical evaluation.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

## 16. Stop Doing List

**Top 3 not worth doing before V1:** more curated policy-pack content (only one engine consumes it); Graph-RAG community summarization (ADR 0057: wait for pilot signal); more synthetic eval-corpus scenarios.

**Top 3 diminishing-returns areas:** UI route polish across 200+ open backlog rows; additional coverage-shaped finding engines; expanding compliance rule count past 791.

**Top 3 founder behaviors that delay validation:** treating assessment scores as the progress metric instead of pilot outcomes; re-fixing the compile-era UI as if it were still broken; adding engines because they are tractable.

**Top 3 features that feel enterprise-important but may not improve V1 adoption:** MCP membrane; CloudEvents webhooks; multi-region active/active.

## 17. Top Improvement Opportunities

No numbered ship-gate FAIL. Gate 1 is UNKNOWN, so this section does **not** pretend live first-review is proven. Validation-first work leads because it moves outcomes 1/3/4 more than another coverage engine. Engineering items below are in-contract, verified-absent-or-broken this pass.

**Shipped — do not re-open:** UI production typecheck/`tsconfig.build.json`; `OperatorShellMessage`; Suite=Core green on Decisioning/Core/Application; Bicep body → `tf.*` bag; Kubernetes security spec projection; `PolicyFilteredGoldenCorpusTests`; InMemory `IArchitectureIdentityRepository`; **TB-603**; GTM **M-190**/**M-191**/**M-196**/**M-197**.

### Tier 1 — Must Fix / Must Validate

**1. Execute three real-mode pilot runs (G-REAL-06) and collect packets (G-REAL-07 / M-39).**
Tier 1 · **Why it matters:** every commercial diagnostic in §3 is offline-derived. Compile no longer blocks this. · **Expected impact:** replaces opinion with observed insight density, dismissal triggers, and ROI credibility. · **Affected qualities:** Insight Density (65), Time-to-Value (72), Proof-of-ROI (76), Decision Advantage (62). · **Evidence:** GTM rows Not started; no `PROOF_PACKET_RUN_LOG` G4 rows required this pass. · **Actionability:** owner-executed; agent-assistable for scripts. · **Design uncertainty reduced: 2** · **Market uncertainty reduced: 9** · **Classification: validation first.**

**2. Clear the CodeQL SARIF gate on `master`.**
Tier 1 · **Why it matters:** it is the workflow that actually runs on `master` push and it is red (7 C# + 2 JS). Trailing `// codeql[...]` comments have already failed to populate SARIF `suppressions`. · **Expected impact:** restores the only automated security merge signal on direct `master` pushes. · **Affected qualities:** Runtime (73), Correctness (80), Adoption (84). · **Evidence:** Actions run 33005058646; findings listed in §4 notes / §8.5. · **Actionability:** high. · **Design uncertainty reduced: 8** · **Market uncertainty reduced: 1** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** CodeQL on `master` fails `scripts/ci/assert_codeql_sarif_clean.py`. Unresolved: `cs/user-controlled-bypass` at `RunProvenanceQueryService.cs:125` and `ClosedLoopArchitectureReasoningOrchestrator.LiveReview.cs:277`; `cs/log-forging` at `ArchitectureRunAsyncCreateAdmitter.cs:158–159`; `cs/insecure-sql-connection` at `SqlConnectionStringCommandTimeout.cs:15` and `SqlConnectionStringMasterCatalog.cs:14,26`; `js/clear-text-storage-of-sensitive-data` at `archlucid-ui/src/lib/resolve-continue-last-api-key-credential.ts:43`; `js/incomplete-sanitization` at `archlucid-ui/e2e/run-architecture-lifecycle-batch.ts:129`. **Desired behavior:** SARIF gate exit 0 with zero unresolved findings. **Scope boundaries:** prefer structural fixes (do not log unsanitized user strings; do not store API keys in clear-text web storage; connection strings that are local/dev-only should not look like production SQL auth to CodeQL). If a suppression is unavoidable, use a form that **populates SARIF `suppressions`** — do not rely on a trailing comment that the gate ignores. Document remaining suppressions in `docs/library/CODEQL_TRIAGE.md`. **Acceptance criteria:** a CodeQL run on the fixed SHA is green, or local `assert_codeql_sarif_clean.py` on produced SARIF is green. **Tests:** existing unit tests for sanitizers/connection builders must stay green. **Non-goals:** disabling the SARIF gate; reopening TB-135/TB-136.

**3. Fix Alert rules continue-last crash (`rules.slice`).**
Tier 1 · **Why it matters:** render-gate proves `AlertRulesContent` throws when `rules` is not an array — a real Operate-layer break, even if first-review compile passes. · **Expected impact:** render-gate green for TB-1584; Advisory Scans heading may be a related query-shape issue — fix if the same root. · **Affected qualities:** Comprehension (74), Runtime (73). · **Evidence:** vitest 2 failed / 19 passed this pass. · **Actionability:** high. · **Design uncertainty reduced: 7** · **Market uncertainty reduced: 1** · **Classification: V1.**

> **Cursor prompt.** **Current problem:** `resolveContinueLastAlertRule` in `archlucid-ui/src/lib/resolve-continue-last-alert-rule.ts` calls `rules.slice()`; Vitest `operator-client-pages-render-gate.test.tsx` throws `TypeError: rules.slice is not a function` while rendering `AlertRulesContent`. Advisory hub Scans tab heading assertion also fails in the same file. **Desired behavior:** helper returns `null` when `rules` is missing, not an array, or empty; Alert rules page renders its primary heading without throwing; Scans tab test passes. **Scope boundaries:** do not redesign the alert-rules hub; add a type/runtime guard and a unit test for non-array input. **Acceptance criteria:** `npx vitest run src/app/(operator)/operator-client-pages-render-gate.test.tsx` — 0 failed. **Non-goals:** the full 3000-file Vitest matrix.

### Tier 2 — High Leverage

**4. One-screen policy-toggle demo artifact.**
Tier 2 · **Why it matters:** the moat exists in code (`PolicyFilteredGoldenCorpusTests`) and is invisible to buyers. · **Affected qualities:** Differentiability (78), Comprehension (74). · **Design uncertainty reduced: 3** · **Market uncertainty reduced: 7** · **Classification: V1.1 / validation.**

**5. Extend golden-corpus harness past six engines.**
Tier 2 · **Why it matters:** declaration, open-commitment, and premise-conflict have unit tests only on the merge-blocking harness path. · **Affected qualities:** Correctness (80), Governed Review Integrity (83). · **Evidence:** `GoldenCorpusHarness.CreateEngines()` still six engines. · **Design uncertainty reduced: 7** · **Market uncertainty reduced: 2** · **Classification: V1.1.**

> **Cursor prompt.** **Current problem:** `GoldenCorpusHarness.CreateEngines()` registers only requirement, topology-coverage, security-baseline, security-coverage, compliance (`FileComplianceRulePackProvider`), and cost-constraint. Production registers 39 engines. **Desired behavior:** add `DeclarationSecurityBaselineFindingEngine` and `DeclarationPremiseConflictFindingEngine` to the harness with committed fixtures that assert at least one finding each; keep the existing six-engine snapshots stable (new cases, not silent snapshot rewrites). **Scope boundaries:** do not switch the default compliance provider to the full production filter in this change (already covered by `PolicyFilteredGoldenCorpusTests`). Do not add all 33 remaining engines. **Acceptance criteria:** new cases fail if those two engines are removed from `CreateEngines()`. **Non-goals:** portfolio-recurrence I/O in the in-process harness.

**6. Capture 6–8 operator screenshots (M-07) now that the UI builds.**
Tier 2 · **Why it matters:** unblocks **M-09**/**M-16** commercial motion. · **Classification: validation / owner-output** (not a V1 engineering defect; listed because compile no longer blocks it). · **Market uncertainty reduced: 5.**

### Tier 3 — Hold For Reassessment

**7. One deep engine in resilience or segmentation semantics.** Hold until **G-REAL-06** indicates which category buyers argue about. **Classification: validation first.**

**8. Real frontier transcripts for the insight-density corpus.** Harness exists; corpus is synthetic. **Classification: validation first.**

**9. Owner decision: should density scoring apply to engine findings?** `typed-engine-protected` may be correct. Then keep the distribution report explicitly advisory (already labeled). **Classification: blocked on user input.**

**10. Automate UI/authority drift guard (TB-882).** Held; reassess after Alert-rules crash and CodeQL are green. **Classification: V1.1.**

## 18. Prompt Batching Guidance

**First batch — safe-for-Sonnet.** Item 3 (Alert rules `rules.slice` guard) then item 2 (CodeQL SARIF). Removes the remaining *known broken* engineering surfaces.

**Second batch — owner + Opus.** Item 1 (**G-REAL-06** design and finding-quality interpretation). Not a coding-agent substitute for live architecture judgment.

**Third batch — safe-for-Sonnet with review.** Item 5 (golden-corpus declaration engines); item 4 (policy-toggle demo artifact) once a staging tenant exists.

Do **not** batch "restore UI build," "fix Bicep/Kubernetes parsers," or "register InMemory architecture identity" — those are already in tree.

## 19. Model Usage Guidance

**Composer-safe:** screenshot capture (**M-07**), snapshot regeneration, copy cleanup.

**Sonnet-safe (default):** Alert-rules null-guard, CodeQL structural sanitizers, golden-corpus fixture authoring, GTM drafting.

**Strong-model-recommended:** any change to policy filtering, authority pipeline, scope resolution, or evidence-graph semantics; CodeQL `user-controlled-bypass` sites if they touch authorization.

**Opus-or-Gemini-assessment-recommended:** this class of assessment; **G-REAL-06** finding-quality interpretation; the positioning decision in §20.

## 20. Pending Questions For Later

**Blocks V1:** none as an owner *decision*. Remaining V1 *execution*: **G-REAL-06**, **G-COMMERCE-01**, CodeQL SARIF, Alert-rules crash.

**Blocks V1.1:** Should policy awareness extend beyond the compliance engine, and with what vocabulary for structural engines?

**Requires customer validation:** Which analytical category do buyers actually argue about? Does policy-aware review change a real decision (§10.6)?

**Requires founder decision:** (a) Lead with *organizational repeatability* rather than *superior insight*? (b) Keep `typed-engine-protected` as a hard bypass? (c) Which finding stream is the product of record — sealed `FindingsSnapshot` or `AgentResult.Findings`?

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

The repository still demonstrates serious principal-architect judgment in unglamorous places: disposition-aware ROI that *documents* non-summation of per-system rows; `claimBoundary` on insight-density artifacts refusing to claim victory over named frontier models; an emission gate that refuses prose-only decision-grade findings; a ship-gate runner that returns FAIL when it cannot load a run; a published list of Azure roles the product will never request; enforced absence of `terraform apply`.

The taste failure remains proportion: 39 engines and 6 in the harness; 45 packs and 1 engine that consumes them; 791 rules and a thin corpus; density instrumentation that gates nothing. What changed this pass is execution honesty: the front door compiles, Suite=Core is green, Bicep/Kubernetes feed declaration security, and the policy-filter moat has an end-to-end test. The remaining author-signal risk is continuing to elaborate measurement and route polish faster than running three real reviews.
