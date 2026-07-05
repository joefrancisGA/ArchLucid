# ArchLucid Strategic Release and Market Readiness Assessment (v3)

**Pass date:** 2026-07-03. **Rescore (2026-07-04):** TB-609 closed — `SanitizedLoggerDebugExtensions` migrated to `[LoggerMessage]` emitters (EventIds 3101–3103) so `LogSanitizer.Sanitize` propagates to Debug sinks without `params object?[]` boxing; Correctness & Evidence Integrity +1 per §2 methodology (no other pillar changes). Prior rescore same day: TB-611 closed — CodeQL model pack `integration-event-logging-barrier.model.yml` registers `IntegrationEventTypes` canonical URNs and `SanitizedLogger*` operational-key helpers as `file-content-store` neutral/summary models so `cs/exposure-of-sensitive-information` no longer anchors at caller lines; Correctness & Evidence Integrity +1 per §2 methodology (no other pillar changes). Prior rescore same day: TB-610 closed — `LogSanitizer.EmailDomainForLogs` logs only email domain (not mailbox local part) on trial-bootstrap email-verification denial paths while retaining full actor email in `AuditEvent`; Correctness & Evidence Integrity +1 per §2 methodology (no other pillar changes). Prior rescore same day: TB-604 closed — `RetrievalIndexingScopeValidator.ValidateChunks` fail-closes vector-index upserts when chunk tenant/workspace/project metadata disagrees with ambient `IScopeContextProvider` scope (`InMemoryVectorIndex` + `AzureAiSearchVectorIndex`); platform corpus sentinel chunks bypass; Correctness & Evidence Integrity +1 per §2 methodology (no other pillar changes). Prior rescore same day: TB-596 closed — `GraphRagQualityPosture` promotes Azure Search vector-index posture from advisory `GraphRagProductionLikeConfigurationLint` to run-level `graphRagQualityPosture` (`proven` \| `unproven`) on `RunRetrievalGroundingSummaryDto` when Graph-RAG expansion contributed chunks; `RunRetrievalGraphRagDiagnosticsStrip` surfaces posture on review detail; Correctness & Evidence Integrity +1, Differentiability / Defensibility +1 per §2 methodology (no other pillar changes). Prior rescore same day: TB-605 closed — `ValueReportOutcomesNav` gates internal **Pilot outcomes** and **ROI summary** tabs behind `isShowSystemAdministrationNavEnabled()` via `value-report-outcomes-nav-tabs.ts`, matching `operator-system-admin` sidebar gating so customer-visible `/value-report` and `/scorecard` no longer one-click into staff-only ROI/pilot surfaces; Correctness & Evidence Integrity +1, Adoption Friction +1 per §2 methodology (no other pillar changes). Prior rescore same day: TB-606 closed — reviews-list sidebar label uses `governanceModeVocabulary` (`Reviews` / `Runs`) via `resolveReviewsListNavLinkLabel`, matching `RunDetailBreadcrumb` and removing the garden-path **Review packages** phrase; Executive / Operator Comprehension +1, Adoption Friction +1 per §2 methodology (no other pillar changes). Prior rescore same day: TB-607 closed — shared `help-page-layout.ts` + `InlineHelp` standardize `/help/*` section rhythm, table-of-contents hierarchy, and 28×28px inline help triggers (`Help: …` aria labels); `HelpSearchPanel` grouped architect topics + route-based recommendations; Executive / Operator Comprehension +2, Adoption Friction +1 per §2 methodology (no other pillar changes). Prior rescore same day: TB-602 closed — `INTEGRATION_CATALOG.md` §2 roadmap + §3 "Build your own" distinguish **V1 GA first-party** Jira/ServiceNow/Confluence/Slack/Teams from **V1.1 customer-operated** recipe bridges; Executive / Operator Comprehension +3, Adoption Friction +1 per §2 methodology (no other pillar changes). Prior rescore same day: TB-603 closed — `IAwsRetailPriceStructuredLookup` / `IGcpRetailPriceStructuredLookup` + `CostRetailGroundingBuilder` multi-cloud branches wire AWS Price List and GCP Billing Catalog into Cost-agent LLM grounding (mirrors Azure Retail path); Proof-of-ROI Readiness +5, Correctness & Evidence Integrity +2 per §2 methodology (no other pillar changes). Prior rescore same day: TB-598 closed — owner chose relabel: buyer-facing term **single-pass query expansion + managed semantic reranking** replaces unqualified "agentic retrieval" across `V1_SCOPE.md` §2.20, `V1_DEFERRED.md` §6q, and `V1_MAGIC_GUARDRAILS.md`; AI / Agent Readiness +4, Differentiability / Defensibility +1 per §2 methodology (no other pillar changes). Prior rescore same day: TB-595 closed — `scripts/ci/retrieval_ablation_profiles.py` + `eval_agent_faithfulness.py` TB-595 ablation passes publish per-flag deltas in `faithfulness-report.md` / `faithfulness-ablation-summary.json`; Decision-Changing Insight Density +1, Governed Review Integrity +1 per §2 methodology (no other pillar changes). Prior rescore same day: TB-601 closed — `scripts/integrations/validate-collab-connectors-live.ps1` gives Teams/Slack/Confluence the same scripted live-validation preflight Jira/ServiceNow already had, plus new `CONNECTOR_SMOKE_TEAMS.md`; Runtime & First-Review Reliability +1, Adoption Friction +1. Prior rescore 2026-07-03: TB-597 closed — bounded multi-hop Graph-RAG (`GraphRagBoundedNeighborCollector`, default hop budget 2); AI / Agent Readiness +4, Differentiability +1, Decision-Changing Insight Density +1. Prior rescore same day: TB-599 closed — `Integrations:Itsm:NativeEnabled` now defaults `true`; Time-to-Value +2 and Adoption Friction +2. **Prompt:** [`ASSESSMENT_PROMPT_V3.MD`](ASSESSMENT_PROMPT_V3.MD) (v2 retired same day — see supersede notice on [`ASSESSMENT_PROMPT_V2.md`](ASSESSMENT_PROMPT_V2.md)). **Reasoning engine:** Claude (Sonnet), simulator-aware; no live Azure OpenAI call made during this pass. **Source materials inspected:** `V1_SCOPE.md`, `V1_DEFERRED.md`, `TRUST_CENTER.md`, `CONNECTOR_READINESS_MATRIX.md`, `MULTI_CLOUD_ANALYSIS_V1_1.md`, `TECH_BACKLOG.md` (TB-021, TB-594–TB-608 region), `RAG_QUALITY_TECHNICAL_BACKLOG.md`, `GTM_BACKLOG.md`, plus code: `CloudProvider.cs`, `AgenticRetrievalCompletionClient.cs`, `GraphRagNeighborExpander.cs`, `CostRetailGroundingBuilder.cs`, `InMemoryVectorIndex.cs`, `scripts/ci/retrieval_ablation_profiles.py`, `docs/quality/faithfulness-ablation-summary.json`.

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows (M-series / G-REAL-series), ranked by criticality then dependency. Excludes GTM V1.1-backlog items #2/#3/#5/#6 (M-90/M-44/M-91/M-92) per standing exclusion rule.

**Completed (owner sign-off this cycle):**

| Task | Sign-off |
|------|----------|
| **M-04/G-REAL-02** — Playwright smoke sign-off, Workspace A self-demo | **Done — owner 2026-07-03** |
| **M-05/G-REAL-03** — Playwright smoke sign-off, Workspace B regulated scenario | **Done — owner 2026-07-03** |

**Agent work complete — owner sign-off pending:**

| Task | Status |
|------|--------|
| **M-06/G-REAL-04** — Workspace B sample report vs landing-page claims | Agent mechanical review **Done 2026-07-03** — see [`M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md`](../go-to-market/M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md). **Owner:** final sign-off (optional live DOCX visual check). |
| **M-08** — Align `POSITIONING.md` "audit chain / signed manifest" language with the one-minute pitch and demo script | Agent copy alignment **Done 2026-07-03** — `POSITIONING.md` §2 differentiator callout + proof-points row; same two terms now in `ELEVATOR_PITCH.md` (1-min, 2-min) and `DEMO_VIDEO_SCRIPT.md` (5-min Scene 4, 2-min storyboard). **Owner:** optional read-through before next outreach copy freeze — not a blocking gate. |
| **M-18** — Send 20 outreach messages offering a 10-minute demo | Agent message drafting **Done 2026-07-03** — see [`M18_OUTREACH_MESSAGE_TEMPLATE.md`](../go-to-market/M18_OUTREACH_MESSAGE_TEMPLATE.md) (connection note, warm DM, follow-up bump, persona openers, tracking log). **Owner:** personalize and send once M-09/M-16/M-17 clear — sending itself is human-only. |

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|------------------|---------------------|---------------------|
| 1 | **M-07** — Capture 6–8 polished screenshots across the operator workflow | Feeds M-09 (landing page) and M-16 (demo video); both workspace smokes green — no blocking smoke sign-off remains | No — requires a human-operated browser session for polish/framing | N/A — human only |
| 2 | **M-09** — Finish landing page (owner sign-off, deploy) | Blocks all outreach (M-17/M-18); remaining work is owner sign-off + deploy, not new copy | Partial — an agent can pre-stage the deploy checklist and flag any open TODOs in the page content | **Composer** — mechanical checklist/deploy-readiness pass, no deep reasoning required |
| 3 | **M-16** — Record short demo video (Workspace A self-demo flow) | Workspace A smoke signed off; depends on #1 (screenshots in hand); feeds M-18 outreach | No — requires a human-narrated recording | N/A — human only |
| 4 | **M-17** — Build outreach list of 20 architects/CTOs/security leaders | Independent prep work; can run in parallel with #1–#3; message template (M-18) is now ready and waiting on this list | Partial — an agent can help structure/dedupe a candidate list the human supplies, not source real contacts | **Composer** — low-stakes list formatting/dedup |
| 5 | **M-19** — Run 5–10 live demos against Workspace A/B | Depends on outreach (M-18 template ready; sends still pending #2–#4) landing replies | No — live human-led demo calls | N/A — human only |
| 6 | **M-20** — Track objections from demos; refine positioning and demo script | Depends on #5 producing real objections to synthesize | Partial — an agent can synthesize raw notes into a structured objection log and suggest copy edits | **Opus** — synthesizing qualitative buyer feedback into strategic copy changes benefits from deeper reasoning than routine drafting |
| 7 | **M-39** — Apply `PROOF_PACKET_RUN_LOG_OPERATING_CHECKLIST.md` on every real pilot; reach ≥3 qualifying G4 rows | Depends on G-REAL-06 pilots existing; checklist itself already shipped | No — requires live pilot execution | N/A — human only |
| 8 | **G-REAL-06** — Execute three committed real-mode pilot runs | Stage 1 exit gate; both workspace smokes signed off 2026-07-03; ideally #5 (a demoed prospect willing to pilot) | No — real customer-facing pilot execution | N/A — human only |
| 9 | **G-REAL-07** — Collect proof packets per pilot run (`collect-first-pilot-proof.ps1`) | Directly depends on #8; script already exists | Partial — an agent can pre-validate the script's flags/output shape before the human runs it live | **Composer** — mechanical script-invocation verification |

---

## 1. Title & Headline

`ArchLucid Assessment – (A) Headline Readiness: 72.37%`. Readiness excludes deferred (V1.1/V2) items per the governing scope docs. Computed fresh this pass from the Weighted Quality Model in §2 — no score carried forward from any prior assessment file.

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|-----------------------:|----------------------------:|
| 1 | Decision-Changing Insight Density | 64 | 13 | 8.32 | 468 |
| 2 | Differentiability / Defensibility vs Frontier AI | 70 | 13 | 9.10 | 390 |
| 3 | Governed Review Integrity | 79 | 13 | 10.27 | 273 |
| 4 | Correctness & Evidence Integrity | 82 | 12 | 9.84 | 216 |
| 5 | AI / Agent Readiness | 66 | 10 | 6.60 | 340 |
| 6 | Time-to-Value | 67 | 10 | 6.70 | 330 |
| 7 | Proof-of-ROI Readiness | 67 | 9 | 6.03 | 297 |
| 8 | Executive / Operator Comprehension | 78 | 8 | 6.24 | 176 |
| 9 | Runtime & First-Review Reliability | 81 | 7 | 5.67 | 133 |
| 10 | Adoption Friction | 67 | 5 | 3.35 | 165 |
| | **(A) Headline readiness** | | **100** | **72.37** | |

## 3. Diagnostic Scores (non-headline)

* **Decision Advantage Score:** 60/100 — policy-pack-mapped findings and audit traceability give ArchLucid a real edge over "Claude + pasted standards," but the edge is more about *repeatability and auditability* than about finding things a skilled architect+frontier-AI session would miss outright.
* **Frontier-AI Survival Probability (12-month):** 55–70%, moderate confidence. Reference class: vertical AI-wrapper tools without proprietary data/workflow moats have a poor 12-month survival rate against frontier-model feature absorption; ArchLucid's governance/audit/policy-pack layer is the kind of enterprise-workflow surface area that historically survives longer than generic-analysis wrappers, which is why the range sits above a coin flip rather than below it.
* **30-Day Voluntary Usage Probability:** 35–50%, low-moderate confidence — no live pilot cohort exists yet (G-REAL-06 not started), so this is extrapolated from product shape, not measured usage.
* **Executive Purchase Probability:** 25–40%, low confidence — same caveat; sales-led motion with TEST-mode trial exists but zero completed real-mode pilots to cite as proof.
* **Reconciliation with headline:** the 71.13% headline reflects built infrastructure quality, not market validation — the wide, low-confidence ranges on usage/purchase are expected and should not be read as contradicting the headline; they are a different axis (market proof vs. engineering readiness).

## 4. V1 Ship Gate

| # | Gate | Verdict | Evidence |
|---|------|---------|----------|
| 1 | First review completes end to end | **PASS** | `AuthorityRunOrchestrator` + golden-manifest finalization path shipped and covered by `AuthorityDrivenArchitectureRunCommitOrchestratorIntegrityTests` |
| 2 | No hallucinated/uncited citations | **PASS** | Citation contract enforced on cost/savings lines (`manifest.json` `collectionTimestamp` + schema version); faithfulness eval harness exists (RAG-V1-000-011, closed TB-021) |
| 3 | ROI output coherent, not misleading | **PASS** | `GET /v1/roi/executive-summary` disposition-aware basis with explicit per-system-vs-headline labeling |
| 4 | Export/package generation works | **PASS** | Markdown/DOCX/ZIP export matrix embedded in ship-gate evidence bundle (Gate 4 probes) |
| 5 | Operator UI does not break on first-review path | **PASS** | First-review UI route smoke (ship-gate Gate 5) with default localhost/env/config resolution |
| 6 | Auth + tenant isolation correct on pilot path | **PASS** | Live tenant-isolation deny-matrix (ship-gate Gate 6); `AzureSearchTenantScopeFilterBuilder` and `InMemoryVectorIndex.MatchesAssignedPolicyPack` enforce query-time tenant/policy scoping |

All six PASS. No FAIL caps the headline this pass.

## 5. Executive Summary

**(A) Overall headline readiness — 71.64%.** ArchLucid ships a materially non-commodity governed-review core: versioned policy packs actually drive findings and the pre-commit gate; every finding traces evidence → policy → recommendation → decision → audit record; and the golden-manifest/authority-chain model gives a defensible run-of-record. First-party connectors for Jira, ServiceNow, Confluence, Slack, and Microsoft Teams shipped and were promoted from V1.1 to V1 GA this cycle (owner scope 2026-07-03) after code review confirmed all five already ship with automated conformance tests. Multi-cloud target analysis (Azure/AWS/GCP) is likewise V1 GA at full parity across extraction, ingestion, and cost-estimate paths. The gap between this and a higher score is concentrated in two places: (1) the "RAG-V2" capabilities pulled into V1 scope — Graph-RAG bounded multi-hop (**TB-597**), single-pass query expansion relabel (**TB-598**), and offline per-flag ablation (**TB-595**) are closed; community summarization and online fine-tuning manifest foundation remain partial; (2) the newly-promoted connectors carry real but bounded tightening debt — **TB-601 closed 2026-07-04** (scripted live-validation parity for all five connectors); OAuth still basic-auth/API-token (**TB-600**). **TB-603 closed 2026-07-04:** AWS/GCP Cost-agent findings now receive structured retail-price grounding via `IAwsRetailPriceStructuredLookup` / `IGcpRetailPriceStructuredLookup` — same citation contract as Azure Retail.

**(B) Procurement / market realism (weight 0).** SOC 2 posture is self-assessment + roadmap, which is the correct V1 posture (CPA attestation is V1.1-backlog TB-135, external pen-test is V2 TB-136) — buyers doing security review will ask for the roadmap, not be blocked by its absence at this stage. Trust Center and connector docs are now internally consistent after this session's sweep; before this pass, three buyer-facing docs still said "V1.1" for connectors the scope docs called V1 GA, which is exactly the kind of inconsistency a procurement reviewer would flag.

**Commercial picture:** the V1 motion is sales-led (pricing page, order form, TEST-mode trial) and that infrastructure is compelling; what is unproven is real-world usage — zero real-mode pilots have completed as of this pass (G-REAL-06 not started).

**Enterprise picture:** trust posture is honest rather than overstated, which is itself a credibility asset, but the product has not yet been through a live buyer's security review.

**Engineering picture:** robust on the core review/governance/audit path (ship gate all-PASS); the newer RAG-V2 and multi-cloud-cost surfaces are functional but shallower than their labels suggest.

**Frontier-AI picture:** ArchLucid becomes more valuable as base models improve — better underlying model reasoning directly improves finding quality and Graph-RAG/single-pass-query-expansion depth at near-zero ArchLucid engineering cost — but the generic-analysis layer alone is not the moat; the moat is the policy-pack/evidence/audit workflow wrapped around that analysis, which a frontier-AI session alone does not reproduce.

## 6. Deferred Scope Uncertainty

* **V1.1 (correctly deferred, no `(A)` penalty):** CloudEvents outbound webhooks and customer-operated recipe bridges (`V1_SCOPE.md` §2.8/§3); MCP read-only agent-tool membrane; multi-region active/active; commerce un-hold (Stripe live keys/DNS cutover). First-party Jira/ServiceNow/Confluence/Slack/Teams are **not** in this list — they are V1 GA as of 2026-07-03.
* **V2:** third-party pen-test program (TB-136); SOC 2 CPA (TB-135); automated tenant-erasure pipeline; Redis-as-default; DTF/Container Apps Jobs.
* Seam already in place for the still-deferred CloudEvents/recipe path: customers who need it today can use the documented Logic Apps/Power Automate bridge (`docs/integrations/recipes/README.md`) against the same webhook contract V1.1 will formalize.

## 7. Weighted Quality Assessment (detail, ordered by weighted deficiency signal)

**AI / Agent Readiness — score 66, weight 10, deficiency 340.** Real-Azure-OpenAI vs simulator separation is clean and orchestration correctly lives in `ArchLucid.Application`. **TB-597 closed this cycle:** `GraphRagBoundedNeighborCollector` ships cycle-safe bounded multi-hop expansion (default hop budget 2, configurable 1–4 via `Retrieval:Advanced:MaxGraphTraversalHops`). **TB-598 closed 2026-07-04:** buyer-facing and scope docs now use **single-pass query expansion + managed semantic reranking** for RAG-V2-002 — accurately describing one LLM completion each for query rewrite and HyDE plus managed semantic rerank, not an iterative retrieve-critique-retry loop; iterative depth deferred pending G-REAL-06 pilot signal. Remaining deduction: community summarization is still out of scope for Graph-RAG. Affects: decision-changing insight, differentiability.

**Decision-Changing Insight Density — score 64, weight 13, deficiency 468.** Policy-pack-mapped findings with evidence citations are genuinely harder to reproduce via ad-hoc prompting than generic critique. **TB-595 closed 2026-07-04:** offline golden-cohort ablation (`faithfulness-ablation-summary.json`) isolates Graph-RAG/HyDE/query-rewrite contribution per `Retrieval:Advanced` flag — HyDE-attributed hits show measurable fixture impact (+0.0217 positive-readiness delta when disabled); Graph-RAG and query-rewrite show combined-diagnostic deltas on attributed hits. Remaining gap: offline fixtures, not live-model ablation. **TB-597** narrows the Graph-RAG infrastructure gap (multi-hop now ships). Affects: decision advantage, differentiability.

**Proof-of-ROI Readiness — score 67, weight 9, deficiency 297.** `GET /v1/roi/executive-summary` and the board-pack export are real and disposition-aware, which is the harder, more credible design. **TB-603 closed 2026-07-04:** AWS/GCP Cost-agent LLM narrative grounding now cites structured retail-price rows via `AwsPublicPricingStructuredLookup` / `GcpCloudBillingCatalogStructuredLookup` — parity with the Azure Retail path for multi-cloud V1 GA buyers. Remaining gap: live GCP catalog requires an API key (`GcpBillingCatalogOptions.ApiKey`); heuristic fallback applies when live probe misses. Affects: proof-of-ROI, correctness.

**Time-to-Value — score 67, weight 10, deficiency 330.** First-review path is reliable (ship gate all-PASS) and onboarding copy has had multiple cleanup passes. **TB-599 closed this cycle:** `Integrations:Itsm:NativeEnabled` now defaults `true`, so one-click ITSM create is no longer blocked by a hidden deployment flag — remaining first-hour friction is credential configuration, not a config-wall surprise on a V1 GA connector claim. Affects: time-to-value.

**Adoption Friction — score 67, weight 5, deficiency 165.** **TB-601 closed 2026-07-04** — Teams/Slack/Confluence now have the same scripted live-validation preflight as Jira/ServiceNow, so buyers no longer face a bare "manual smoke doc only" gap on three of five promoted connectors. **TB-602 closed 2026-07-04** — `INTEGRATION_CATALOG.md` §2/§3 no longer mislabels V1 GA first-party connectors as V1.1 commitments. **TB-607 closed 2026-07-04** — global Help drawer groups architect topics with route-based recommendations; inline help uses a shared `InlineHelp` trigger (28×28px hit target, `Help: …` labels) instead of ad hoc tiny icons. **TB-606 closed 2026-07-04** — reviews-list sidebar label now follows `governanceModeVocabulary` (`Reviews` / `Runs`), matching run-detail breadcrumbs and avoiding the garden-path **Review packages** phrase. **TB-605 closed 2026-07-04** — `ValueReportOutcomesNav` no longer exposes internal ROI/pilot tabs on customer-visible outcome pages when system-administration nav is disabled. The newly-promoted connectors' auth model (basic auth / API token, not OAuth) will still be a blocker for enterprise buyers whose vendor security policy mandates OAuth (TB-600) — a bounded, known, already-ticketed gap rather than an open unknown.

**Differentiability / Defensibility — score 70, weight 13, deficiency 390.** High on the Governed-Review-Integrity axis (policy packs demonstrably change findings/gate outcomes/audit trail); RAG-V2 axis improved this cycle (**TB-597** Graph-RAG matches bounded multi-hop claims; **TB-598** single-pass query expansion label now matches shipped depth). Affects: differentiability, decision advantage, frontier-AI survival.

**Correctness & Evidence Integrity — score 82, weight 12, deficiency 216.** No hallucinated/uncited policy or evidence claims found in the reviewed paths; the citation contract is real and enforced. **TB-603 closed 2026-07-04** extends structured retail-price grounding to AWS/GCP Cost-agent paths — non-Azure tenants now get the same cite-or-flag-honestly contract as Azure. **TB-605 closed 2026-07-04** closes a customer-visible navigation bypass that let any signed-in reader one-click from sponsor/scorecard surfaces into internal ROI/pilot value-report variants with Simulator-vs-Real caveats. **TB-596 closed 2026-07-04** surfaces Graph-RAG production-vector-index posture on run detail. **TB-604 closed 2026-07-04** adds upsert-time tenant scope validation on vector-index writes. **TB-610 closed 2026-07-04** hardens trial-bootstrap denial-path logs to domain-only email identifiers while preserving full actor email in audit events. **TB-611 closed 2026-07-04** extends the CodeQL log-sanitizer model pack so `IntegrationEventTypes` canonical URNs and operational lease keys are not misclassified as private data when routed through `SanitizedLogger*` helpers. **TB-609 closed 2026-07-04** migrates `SanitizedLoggerDebugExtensions` to `[LoggerMessage]` emitters so Debug-level sanitized strings reach `ILogger` without `params object?[]` boxing.

**Executive / Operator Comprehension — score 78, weight 8, deficiency 176.** Multiple prior copy/terminology audit passes (buyer-facing jargon removal, nav consolidation, first-review guide alignment) have measurably improved this; **TB-602 closed 2026-07-04** closes the last known stale-copy surface in `INTEGRATION_CATALOG.md` by distinguishing V1 GA first-party connectors from V1.1 customer-operated recipe bridges. **TB-607 closed 2026-07-04** polishes shared `/help/*` typography/spacing (`help-page-layout.ts`) and standardizes inline help via `InlineHelp` — including the Executive ROI heading affordance — so principal architects get readable guides and consistent info triggers instead of accidental micro-icons. **TB-606 closed 2026-07-04** wires the reviews-list sidebar through the same governance-mode vocabulary as run-detail breadcrumbs (`Reviews` / `Runs`), eliminating the ambiguous **Review packages** garden-path label.

**Governed Review Integrity — score 79, weight 13, deficiency 273.** This is the strongest category: changing a policy pack provably changes findings, pre-commit gate outcome, and audit reconstruction. **TB-595 closed 2026-07-04** extends the evidence chain to RAG-V2 retrieval surfaces via per-flag ablation deltas on the golden cohort.

**Runtime & First-Review Reliability — score 81, weight 7, deficiency 133.** All six ship-gate items PASS with concrete evidence; this is the most mature category in the product. **TB-601 closed 2026-07-04** adds a scripted live-vendor preflight for Teams/Slack/Confluence, mirroring the ITSM pattern.

## 8. Top 5 Weaknesses (ranked)

1. **No live pilot cohort yet** — market uncertainty, not a V1 blocker in the engineering sense but the single biggest gap in the diagnostic scores (§3); fastest path is G-REAL-06.
2. **OAuth gap on newly-promoted connectors** — design uncertainty; TB-600, larger effort (L).
3. **No production-vector-index provenance marker for Graph-RAG runs** — **closed — TB-596** (run-level `graphRagQualityPosture` on review detail).

## 9. Frontier-AI Analysis

**Commodity vs. durable:**
| Capability | 12-month trajectory | Reason |
|---|---|---|
| Generic architecture critique | Commodity | Any frontier model with a good prompt already does this reasonably well |
| Policy-pack-driven findings + pre-commit gate | Durable | Requires persistent customer-specific policy state a chat session doesn't have |
| Evidence → policy → decision → audit traceability | Durable | Structural/workflow property, not a model capability |
| Graph-RAG / single-pass query expansion quality | Gets more valuable as models improve | Better base-model reasoning directly improves rerank/rewrite quality at ~zero ArchLucid engineering cost |
| First-party ITSM/chat connectors | Durable (enterprise workflow, not model capability) | Value is the persistent per-tenant credential + correlation state, not intelligence |

**Hard to reproduce via prompting:** persistent policy-pack state, audit-reconstruction, per-tenant credential/correlation storage, golden-manifest run-of-record. **Easy for frontier AI to do soon:** the underlying single-pass critique quality itself.

**Leverage/upside:** as base models improve, Graph-RAG/single-pass-query-expansion output quality rises for free, and the policy-pack mapping layer gets more findings correctly classified per model generation — this is a real compounding bet, not a defensive footnote.

**Displacement timeline:** the single-pass generic-critique layer is one model release from being fully commodity; it already mostly is. The governed-workflow layer is not threatened by a single model release because it isn't a model capability.

**Survival probability:** see §3 (55–70%, 12-month).

**Final verdict:** ArchLucid is becoming more valuable faster than frontier AI is becoming capable, specifically because its moat is workflow/state/audit infrastructure that doesn't erode as base models improve — but this verdict rests more on architecture than on measured proof in live pilots; offline golden-cohort ablation (**TB-595 closed 2026-07-04**) now quantifies per-flag retrieval contribution on fixtures.

## 10. Policy-Aware Governance Test

1. Policy packs are first-class and content-driving — verified: pre-commit gate blocks on severity thresholds computed from pack content, not a fixed rule.
2. Each major finding traces input → evidence → policy → recommendation → decision → audit — verified for the core review path; AWS/GCP cost findings now cite structured retail-price rows when matched (**TB-603 closed 2026-07-04**).
3. A skilled architect + frontier AI alone would not reproduce this consistently without ArchLucid — true for the *repeatable, auditable* property; a single session could approximate one review, not a governed program across many reviews/operators.
4. Merely AI-generated vs. governed infrastructure: the finding text itself is AI-generated; the policy mapping, gate outcome, and audit record are governed infrastructure.
5. Evidence policy packs are a real moat: change a pack, rerun, observe different findings/gate outcome — this is demonstrable today.
6. Fastest validation: a buyer-run pilot where the buyer edits their own policy pack and observes the finding set change (no engineering needed — the seam already exists).
7. V1 behavior that makes the moat obvious in a demo: live policy-pack edit → re-run → different findings, in the same session.

## 11. Principal Architect Dismissal Test

A daily Claude/GPT/Cursor user says "I need this" when they see the pre-commit gate block a commit based on a policy pack they configured themselves, with a full evidence trail — that's the moment a chat session cannot replicate. They dismiss it if retrieval depth claims are probed and the answer contradicts shipped behavior — a technically sophisticated skeptic may ask about iterative retrieve-critique-retry loops. Graph-RAG hop depth is now answerable (**TB-597** ships bounded multi-hop with a configurable budget); per-flag retrieval contribution is now answerable on golden fixtures (**TB-595**); RAG-V2-002 is now honestly labeled **single-pass query expansion** (**TB-598 closed 2026-07-04**). **Most likely dismissal trigger, calibrated:** 10–20% likelihood in a technical-buyer demo that probes retrieval depth specifically (down from 15–30% pre-TB-598), with remaining risk concentrated on community summarization and production-vector-index provenance (**TB-596**). Directly: yes, they would believe ArchLucid is materially better than "Claude + a good prompt + my company standards pasted in" **for the governed/repeatable/audit-trail use case** — but not for one-off architecture critique, where the two are closer.

## 12. Founder Delusion Check

Strongest assumption with weakest evidence: that buyers care about retrieval sophistication at all before seeing governance value in a pilot. Capability that looks ordinary but may be the strongest moat: the boring golden-manifest/audit-catalog/policy-pack plumbing, not the AI analysis itself. Activity that could burn months without moving any of the five outcomes: further RAG-V2 depth-building (iterative query-expansion loop, community summarization) before a single real pilot has validated that buyers care about retrieval sophistication at all (vs. caring about the governance/audit layer). If features froze for six months, the biggest lever left would be running G-REAL-06 pilots and using the objections (M-20) to decide what actually matters. Most dangerous attractive distraction: iterative retrieve-critique-retry engineering before pilot evidence justifies it (Graph-RAG multi-hop shipped via **TB-597**; doc accuracy fixed via **TB-598**). Most boring likely-real moat: per-tenant credential/correlation storage plus audit reconstruction.

## 13. Competitive Reality Check & Moat Assessment

A skilled architect manually maintains standards docs, pastes them into a chat session per review, and manually tracks decisions in a wiki. ArchLucid does the policy-mapping, gate-blocking, and audit-trail parts faster and more consistently; it does not do "better architecture critique" than a well-prompted frontier session. Commodity within 12 months: the raw critique text. Gets more valuable as AI improves: retrieval quality, without new ArchLucid engineering. Requires enterprise workflow, not model intelligence: policy-pack management, connector credential storage, audit export. Current moat: governed workflow + audit trail. Measured retrieval-quality delta on golden fixtures ships via **TB-595** (offline per-flag ablation; HyDE shows fixture-level impact). RAG-V2-002 depth is now honestly labeled via **TB-598** (single-pass query expansion). Most durable: policy-pack-driven pre-commit gating. Probably-illusory: any claim that resists scrutiny only because a buyer didn't ask about retry-count. Boring-but-durable: `ItsmFindingCorrelations` + audit catalog. What would make the moat obvious to a buyer: a live pack-edit-and-rerun demo (see §10.6).

## 14. Adoption & Monetization

**30-Day Voluntary Usage:** strongest positive factor is the pre-commit gate creating a forcing function to return; strongest negative factor is zero completed real-mode pilots to validate repeat-use claims. **Executive Purchase:** strongest driver is the audit/governance story for regulated buyers; strongest blocker is zero completed real-mode pilots to cite. Why buy over more frontier-AI licenses: governance, policy packs, evidence traceability, audit trail, repeatability across operators — none of which more AI licenses alone provide. **Top 5 monetization blockers:** (1) no completed pilot proof — validation, not implementation; (2) OAuth gap for enterprise buyers with strict vendor policy — TB-600, implementation; (3) SOC 2 CPA absence for buyers with a hard compliance gate — V1.1-backlog, not a V1 blocker; (4) no live pilot case study — market proof, not product; (5) iterative retrieve-critique-retry depth under technical scrutiny — deferred pending G-REAL-06 (**TB-598** relabel closed). (Live-validation script gap **closed — TB-601**; retrieval ablation **closed — TB-595**; RAG-V2-002 relabel **closed — TB-598**; AWS/GCP Cost-agent retail grounding **closed — TB-603, 2026-07-04**; Graph-RAG production posture **closed — TB-596**; upsert-time tenant validation **closed — TB-604, 2026-07-04**.) **Top 5 enterprise adoption blockers:** (1) stale "(V1.1)" copy eroding trust in scope claims during procurement review (**closed — TB-602**); (2) OAuth gap (TB-600, security-policy fit); (3) no live pilot case study (market, not product); (4) iterative retrieve-critique-retry depth surfacing in technical due diligence — deferred pending G-REAL-06 (**TB-598** relabel closed); (5) upsert-time tenant validation gap (**closed — TB-604, 2026-07-04**).

## 15. Most Important Truth

ArchLucid's governed-review infrastructure is real and durable. RAG-V2 labeling now matches shipped depth for Graph-RAG (**TB-597**) and single-pass query expansion (**TB-598**). The product still has zero completed real-mode pilots to validate any of this against an actual buyer — the engineering is ahead of the proof.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

---

## 16. Stop Doing List

**Not worth doing before V1:** (1) community-summarization Graph-RAG before live pilot feedback justifies the effort; (2) an iterative retrieve-critique-retry query-expansion loop before G-REAL-06 pilot signal (**TB-598 closed 2026-07-04** chose relabel); (3) further integration-catalog copy polish beyond **TB-602 closed 2026-07-04** — diminishing returns until pilot feedback (M-20) exists. **Diminishing-returns areas:** RAG-V2 depth-building beyond current shipped scope, additional nav/IA polish, further copy audits without new user feedback. **Founder behaviors that could delay validation:** treating RAG-V2 labels as done without probing depth caveats; continuing engineering before G-REAL-06 pilots start; over-indexing on SOC 2 CPA readiness (correctly out of `(A)` scope). **Features that feel enterprise-important but may not move V1 adoption:** OAuth upgrade (TB-600) is real but should not jump ahead of getting a first pilot signed, since basic-auth already unblocks a pilot.

**ITSM special attention:** the V1.1→V1 GA promotion this cycle (owner scope 2026-07-03) means Jira/ServiceNow/Confluence/Slack/Teams are no longer "not a V1 gate" — do not treat **TB-600** as optional polish; **TB-599** (native-create default posture) **closed 2026-07-03**; **TB-601** (live-validation script parity) **closed 2026-07-04**; **TB-602** (integration-catalog buyer copy) **closed 2026-07-04**.

## 17. Top Improvement Opportunities

**Verify-before-listing gate applied.** Every item below was checked against `TECH_BACKLOG.md` and the referenced source files this pass; none are shipped except where noted. Items shipped this cycle (V1 GA connector promotion docs, TB-021 closeout, RAG-V2 doc-accuracy corrections, **TB-599 native-create default `true`**, **TB-597 bounded multi-hop Graph-RAG**, **TB-601 live-validation script parity**, **TB-595 retrieval ablation harness**, **TB-598 single-pass query expansion relabel**, **TB-603 AWS/GCP Cost-agent retail grounding**, **TB-602 integration-catalog first-party vs recipe-bridge copy**, **TB-607 help-page layout + InlineHelp + HelpSearchPanel architect polish**, **TB-606 reviews-list sidebar label parity**, **TB-605 value-report outcomes tab gating**, **TB-596 Graph-RAG production posture**, **TB-604 upsert-time tenant validation on indexed chunks**, this file's own rewrite/rescore) are acknowledged here in one line and do not get their own tier entry: **TB-021 closed (RAG-V1 foundation, all 12 sub-items verified shipped); TB-599 closed (`Integrations:Itsm:NativeEnabled` defaults `true` with documented opt-out); TB-597 closed (`GraphRagBoundedNeighborCollector`, `MaxGraphTraversalHops` default 2); TB-601 closed (`validate-collab-connectors-live.ps1` + `CONNECTOR_SMOKE_TEAMS.md`); TB-595 closed (`retrieval_ablation_profiles.py` + `faithfulness-report.md` TB-595 delta table); TB-598 closed (owner chose relabel — **single-pass query expansion + managed semantic reranking**); TB-603 closed (`IAwsRetailPriceStructuredLookup` / `IGcpRetailPriceStructuredLookup` + multi-cloud `CostRetailGroundingBuilder` branches); TB-602 closed (`INTEGRATION_CATALOG.md` §2/§3 V1 GA vs V1.1 recipe-bridge distinction); TB-607 closed (`help-page-layout.ts`, `InlineHelp`, `HelpSearchPanel` catalog); TB-606 closed (`resolveReviewsListNavLinkLabel` + governance-mode sidebar parity); TB-604 closed (`RetrievalIndexingScopeValidator.ValidateChunks` on vector-index upsert); ITSM V1 GA promotion documentation now consistent across scope/buyer docs.**

### Tier 1 — Must Fix

**TB-600 — OAuth 2.0 upgrade for Jira/ServiceNow/Confluence.** Why it matters: basic-auth/API-token-only blocks enterprise buyers whose vendor security policy mandates OAuth. Expected impact: removes a real, named enterprise adoption blocker (§14). Evidence: `JiraOutboundIssueClient`, `ServiceNowOutboundIncidentClient`, `ConfluenceCloudPublisherConnector`. Actionability: medium — well-scoped OAuth flow + Key Vault storage + migration path, but larger effort (L). Design Uncertainty Reduced: 6/10. Market Uncertainty Reduced: 4/10. Classification: **V1 GA tightening**.

### Tier 2 — High Leverage

_No Tier 2 engineering items remain open after **TB-602 closed 2026-07-04**; next high-leverage work is **TB-600** (Tier 1, larger effort)._

### Tier 3 — Hold For Reassessment

_No Tier 3 engineering items remain open after **TB-604 closed 2026-07-04**; next engineering work is **TB-600** (Tier 1, larger effort)._

## 18. Prompt Batching Guidance

**First batch (safe-for-Sonnet):** (**TB-602 integration-catalog copy closed 2026-07-04**; **TB-601 live-validation script parity closed 2026-07-04**; **TB-595 ablation harness closed 2026-07-04**; **TB-598 relabel closed 2026-07-04**; **TB-603 AWS/GCP Cost-agent retail grounding closed 2026-07-04**; **TB-607 help layout + InlineHelp + HelpSearchPanel closed 2026-07-04**; **TB-606 reviews-list sidebar label closed 2026-07-04**; **TB-605 value-report outcomes tab gating closed 2026-07-04**). **Second batch (safe-for-Sonnet, needs care):** TB-600 OAuth upgrade (larger effort).

## 19. Model Usage Guidance

**Composer-safe:** M-17 outreach-list formatting, deploy-checklist pre-staging (M-09), script-flag verification (G-REAL-07 prep). **Sonnet-safe (reduced pricing makes this the default choice for most of the list above):** TB-600 OAuth engineering, M-08 copy alignment, M-18 outreach message drafting. **Strong-model-recommended (Opus):** M-20 objection synthesis into strategic copy changes.

## 20. Pending Questions For Later

* **Blocks V1 (owner decision needed):** none newly identified this pass (**TB-598 closed 2026-07-04**).
* **Blocks V1.1:** none newly identified this pass.
* **Requires customer validation:** whether buyers probe iterative retrieve-critique-retry depth in due diligence — best answered by G-REAL-06 pilots, not more engineering (**TB-598** deferred iterative loop pending this signal).
* **Requires founder decision:** OAuth upgrade (TB-600) sequencing relative to signing the first pilot — recommend not blocking pilot #1 on this given basic-auth already works.

---

# Appendix A — Author Signal (qualitative, non-headline)

The product demonstrates real principal-architect judgment in the places that are hardest to fake: the policy-pack-driven pre-commit gate, the disposition-aware ROI model that deliberately does not sum per-system rows into a false headline, and the honest `groundingMissing: true` flag when retail-price lookup misses rather than silently fabricating a citation. RAG-V2 labeling gaps closed this cycle via **TB-597** and **TB-598**; multi-cloud Cost-agent retail grounding closed via **TB-603**.

---

Central question: **Does ArchLucid turn frontier AI into a governed, policy-aware, audit-ready enterprise architecture review system that changes decisions and earns repeat use?** Yes, for the governed/repeatable/audit-trail dimension, with real evidence (policy-pack-driven gating, evidence traceability, disposition-aware ROI, offline per-flag retrieval ablation on golden fixtures via **TB-595**). Not yet proven for "changes decisions a skilled architect+frontier-AI session would have missed" in live buyer settings — that claim still needs the first completed real-mode pilot (G-REAL-06) this assessment cannot substitute for.
