# ArchLucid Strategic Release and Market Readiness Assessment (v3)

**Pass date:** 2026-07-03. **Prompt:** [`ASSESSMENT_PROMPT_V3.MD`](ASSESSMENT_PROMPT_V3.MD) (v2 retired same day — see supersede notice on [`ASSESSMENT_PROMPT_V2.md`](ASSESSMENT_PROMPT_V2.md)). **Reasoning engine:** Claude (Sonnet), simulator-aware; no live Azure OpenAI call made during this pass. **Source materials inspected:** `V1_SCOPE.md`, `V1_DEFERRED.md`, `TRUST_CENTER.md`, `CONNECTOR_READINESS_MATRIX.md`, `MULTI_CLOUD_ANALYSIS_V1_1.md`, `TECH_BACKLOG.md` (TB-021, TB-594–TB-608 region), `RAG_QUALITY_TECHNICAL_BACKLOG.md`, `GTM_BACKLOG.md`, plus code: `CloudProvider.cs`, `AgenticRetrievalCompletionClient.cs`, `GraphRagNeighborExpander.cs`, `CostRetailGroundingBuilder.cs`, `InMemoryVectorIndex.cs`.

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

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|------------------|---------------------|---------------------|
| 1 | **M-07** — Capture 6–8 polished screenshots across the operator workflow | Feeds M-09 (landing page) and M-16 (demo video); both workspace smokes green — no blocking smoke sign-off remains | No — requires a human-operated browser session for polish/framing | N/A — human only |
| 2 | **M-08** — Align `POSITIONING.md` "audit chain / signed manifest" language with the one-minute pitch and demo script | Copy consistency gate before any outreach; independent of #1 | Yes — drafting/aligning copy across documents is a good agent task | **Sonnet** — copy alignment across a few known docs; reduced pricing makes it the best cost/effectiveness choice over Opus for this scope |
| 3 | **M-09** — Finish landing page (owner sign-off, deploy) | Blocks all outreach (M-17/M-18); remaining work is owner sign-off + deploy, not new copy | Partial — an agent can pre-stage the deploy checklist and flag any open TODOs in the page content | **Composer** — mechanical checklist/deploy-readiness pass, no deep reasoning required |
| 4 | **M-16** — Record short demo video (Workspace A self-demo flow) | Workspace A smoke signed off; depends on #1 (screenshots in hand); feeds M-18 outreach | No — requires a human-narrated recording | N/A — human only |
| 5 | **M-17** — Build outreach list of 20 architects/CTOs/security leaders | Independent prep work; can run in parallel with #1–#4 | Partial — an agent can help structure/dedupe a candidate list the human supplies, not source real contacts | **Composer** — low-stakes list formatting/dedup |
| 6 | **M-18** — Send 20 outreach messages offering a 10-minute demo | Depends on #3 (landing page live) and #4 (demo video) | Partial — an agent can draft the outreach message template | **Sonnet** — persuasive, buyer-facing copy benefits from more careful phrasing than Composer-tier drafting |
| 7 | **M-19** — Run 5–10 live demos against Workspace A/B | Depends on #6 (outreach must land replies first) | No — live human-led demo calls | N/A — human only |
| 8 | **M-20** — Track objections from demos; refine positioning and demo script | Depends on #7 producing real objections to synthesize | Partial — an agent can synthesize raw notes into a structured objection log and suggest copy edits | **Opus** — synthesizing qualitative buyer feedback into strategic copy changes benefits from deeper reasoning than routine drafting |
| 9 | **M-39** — Apply `PROOF_PACKET_RUN_LOG_OPERATING_CHECKLIST.md` on every real pilot; reach ≥3 qualifying G4 rows | Depends on G-REAL-06 pilots existing; checklist itself already shipped | No — requires live pilot execution | N/A — human only |
| 10 | **G-REAL-06** — Execute three committed real-mode pilot runs | Stage 1 exit gate; both workspace smokes signed off 2026-07-03; ideally #7 (a demoed prospect willing to pilot) | No — real customer-facing pilot execution | N/A — human only |
| 11 | **G-REAL-07** — Collect proof packets per pilot run (`collect-first-pilot-proof.ps1`) | Directly depends on #10; script already exists | Partial — an agent can pre-validate the script's flags/output shape before the human runs it live | **Composer** — mechanical script-invocation verification |

---

## 1. Title & Headline

`ArchLucid Assessment – (A) Headline Readiness: 68.28%`. Readiness excludes deferred (V1.1/V2) items per the governing scope docs. Computed fresh this pass from the Weighted Quality Model in §2 — no score carried forward from any prior assessment file.

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|-----------------------:|----------------------------:|
| 1 | Decision-Changing Insight Density | 62 | 13 | 8.06 | 494 |
| 2 | Differentiability / Defensibility vs Frontier AI | 68 | 13 | 8.84 | 416 |
| 3 | Governed Review Integrity | 78 | 13 | 10.14 | 286 |
| 4 | Correctness & Evidence Integrity | 75 | 12 | 9.00 | 300 |
| 5 | AI / Agent Readiness | 58 | 10 | 5.80 | 420 |
| 6 | Time-to-Value | 65 | 10 | 6.50 | 350 |
| 7 | Proof-of-ROI Readiness | 62 | 9 | 5.58 | 342 |
| 8 | Executive / Operator Comprehension | 72 | 8 | 5.76 | 224 |
| 9 | Runtime & First-Review Reliability | 80 | 7 | 5.60 | 140 |
| 10 | Adoption Friction | 60 | 5 | 3.00 | 200 |
| | **(A) Headline readiness** | | **100** | **68.28** | |

## 3. Diagnostic Scores (non-headline)

* **Decision Advantage Score:** 60/100 — policy-pack-mapped findings and audit traceability give ArchLucid a real edge over "Claude + pasted standards," but the edge is more about *repeatability and auditability* than about finding things a skilled architect+frontier-AI session would miss outright.
* **Frontier-AI Survival Probability (12-month):** 55–70%, moderate confidence. Reference class: vertical AI-wrapper tools without proprietary data/workflow moats have a poor 12-month survival rate against frontier-model feature absorption; ArchLucid's governance/audit/policy-pack layer is the kind of enterprise-workflow surface area that historically survives longer than generic-analysis wrappers, which is why the range sits above a coin flip rather than below it.
* **30-Day Voluntary Usage Probability:** 35–50%, low-moderate confidence — no live pilot cohort exists yet (G-REAL-06 not started), so this is extrapolated from product shape, not measured usage.
* **Executive Purchase Probability:** 25–40%, low confidence — same caveat; sales-led motion with TEST-mode trial exists but zero completed real-mode pilots to cite as proof.
* **Reconciliation with headline:** the 68.28% headline reflects built infrastructure quality, not market validation — the wide, low-confidence ranges on usage/purchase are expected and should not be read as contradicting the headline; they are a different axis (market proof vs. engineering readiness).

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

**(A) Overall headline readiness — 68.28%.** ArchLucid ships a materially non-commodity governed-review core: versioned policy packs actually drive findings and the pre-commit gate; every finding traces evidence → policy → recommendation → decision → audit record; and the golden-manifest/authority-chain model gives a defensible run-of-record. First-party connectors for Jira, ServiceNow, Confluence, Slack, and Microsoft Teams shipped and were promoted from V1.1 to V1 GA this cycle (owner scope 2026-07-03) after code review confirmed all five already ship with automated conformance tests. Multi-cloud target analysis (Azure/AWS/GCP) is likewise V1 GA at full parity across extraction, ingestion, and cost-estimate paths. The gap between this and a higher score is concentrated in three places: (1) the "RAG-V2" capabilities pulled into V1 scope — Graph-RAG and agentic retrieval — ship at meaningfully shallower depth (single 1-hop neighbor expansion, single-shot query rewrite) than the "production-grade" language in some docs implies, and online fine-tuning has only a manifest-level foundation; (2) AWS/GCP cost findings currently get no structured retail-price citation, only illustrative framing, even though the underlying pricing clients exist elsewhere in the codebase; (3) the newly-promoted connectors carry real but bounded tightening debt (OAuth still basic-auth/API-token, ITSM native-create defaults off, live-validation scripts missing for three of five connectors).

**(B) Procurement / market realism (weight 0).** SOC 2 posture is self-assessment + roadmap, which is the correct V1 posture (CPA attestation is V1.1-backlog TB-135, external pen-test is V2 TB-136) — buyers doing security review will ask for the roadmap, not be blocked by its absence at this stage. Trust Center and connector docs are now internally consistent after this session's sweep; before this pass, three buyer-facing docs still said "V1.1" for connectors the scope docs called V1 GA, which is exactly the kind of inconsistency a procurement reviewer would flag.

**Commercial picture:** the V1 motion is sales-led (pricing page, order form, TEST-mode trial) and that infrastructure is compelling; what is unproven is real-world usage — zero real-mode pilots have completed as of this pass (G-REAL-06 not started).

**Enterprise picture:** trust posture is honest rather than overstated, which is itself a credibility asset, but the product has not yet been through a live buyer's security review.

**Engineering picture:** robust on the core review/governance/audit path (ship gate all-PASS); the newer RAG-V2 and multi-cloud-cost surfaces are functional but shallower than their labels suggest.

**Frontier-AI picture:** ArchLucid becomes more valuable as base models improve — better underlying model reasoning directly improves finding quality and Graph-RAG/agentic-retrieval depth at near-zero ArchLucid engineering cost — but the generic-analysis layer alone is not the moat; the moat is the policy-pack/evidence/audit workflow wrapped around that analysis, which a frontier-AI session alone does not reproduce.

## 6. Deferred Scope Uncertainty

* **V1.1 (correctly deferred, no `(A)` penalty):** CloudEvents outbound webhooks and customer-operated recipe bridges (`V1_SCOPE.md` §2.8/§3); MCP read-only agent-tool membrane; multi-region active/active; commerce un-hold (Stripe live keys/DNS cutover). First-party Jira/ServiceNow/Confluence/Slack/Teams are **not** in this list — they are V1 GA as of 2026-07-03.
* **V2:** third-party pen-test program (TB-136); SOC 2 CPA (TB-135); automated tenant-erasure pipeline; Redis-as-default; DTF/Container Apps Jobs.
* Seam already in place for the still-deferred CloudEvents/recipe path: customers who need it today can use the documented Logic Apps/Power Automate bridge (`docs/integrations/recipes/README.md`) against the same webhook contract V1.1 will formalize.

## 7. Weighted Quality Assessment (detail, ordered by weighted deficiency signal)

**AI / Agent Readiness — score 58, weight 10, deficiency 420.** Real-Azure-OpenAI vs simulator separation is clean and orchestration correctly lives in `ArchLucid.Application`. The deduction is specific: `GraphRagNeighborExpander` does single 1-hop expansion only (not multi-hop or community summarization), and `AgenticRetrievalCompletionClient` does single-shot query rewrite + HyDE + managed semantic rerank (not an iterative retrieve-critique-retry loop). Neither is broken — both are real, tested capabilities — but "agentic retrieval" and "Graph-RAG" as unqualified terms overstate the shipped depth. **Recommendation:** TB-597/TB-598 owner decisions (extend depth vs. narrow the doc language) should resolve before the next assessment cycle. Affects: decision-changing insight, differentiability.

**Decision-Changing Insight Density — score 62, weight 13, deficiency 494.** Policy-pack-mapped findings with evidence citations are genuinely harder to reproduce via ad-hoc prompting than generic critique, but the retrieval-quality ablation work needed to prove *how much* Graph-RAG/agentic retrieval specifically contributes (vs. baseline) hasn't run yet (TB-595) — so the insight-density claim currently rests on infrastructure existing, not on a measured quality delta. Affects: decision advantage, differentiability.

**Proof-of-ROI Readiness — score 62, weight 9, deficiency 342.** `GET /v1/roi/executive-summary` and the board-pack export are real and disposition-aware, which is the harder, more credible design. The specific gap: AWS/GCP cost findings get `groundingMissing: true` / illustrative framing only — no structured retail-price citation — even though `AwsPublicPricingClient`/`GcpCloudBillingCatalogClient` already exist and are wired into the deterministic cost-estimate path, just not into the Cost agent's LLM narrative grounding (TB-603). This matters more now that multi-cloud is V1 GA — a buyer running an AWS-heavy portfolio gets a visibly weaker citation experience than an Azure-heavy one. Affects: proof-of-ROI, correctness.

**Time-to-Value — score 65, weight 10, deficiency 350.** First-review path is reliable (ship gate all-PASS) and onboarding copy has had multiple cleanup passes. `Integrations:Itsm:NativeEnabled` defaulting `false` means the one-click ITSM create a buyer might expect from a "V1 GA connector" claim actually 404s until an operator flips a flag and configures credentials (TB-599) — a real, if small, first-hour friction point on a capability now marketed as GA. Affects: time-to-value, adoption friction.

**Adoption Friction — score 60, weight 5, deficiency 200.** Same TB-599 issue, plus the newly-promoted connectors' auth model (basic auth / API token, not OAuth) will be a blocker for enterprise buyers whose vendor security policy mandates OAuth (TB-600) — a bounded, known, already-ticketed gap rather than an open unknown.

**Differentiability / Defensibility — score 68, weight 13, deficiency 416.** High on the Governed-Review-Integrity axis (policy packs demonstrably change findings/gate outcomes/audit trail); medium-pulled-down on the RAG-V2 axis specifically because "Graph-RAG" and "agentic retrieval" read as more defensible/harder-to-reproduce than their current 1-hop/single-shot implementations actually are. Affects: differentiability, decision advantage, frontier-AI survival.

**Correctness & Evidence Integrity — score 75, weight 12, deficiency 300.** No hallucinated/uncited policy or evidence claims found in the reviewed paths; the citation contract is real and enforced. Score is not higher only because the AWS/GCP cost-grounding gap (TB-603) means a subset of ROI claims currently rely on illustrative rather than cited pricing — not a hallucination, but a confidence gap the product itself flags honestly via `groundingMissing`.

**Executive / Operator Comprehension — score 72, weight 8, deficiency 224.** Multiple prior copy/terminology audit passes (buyer-facing jargon removal, nav consolidation) have measurably improved this; residual friction is the stale "(V1.1)" labels this session found and corrected in four buyer-facing docs/UI surfaces — a signal that doc-sync discipline, not comprehension design, is the remaining risk (TB-602 remainder: `INTEGRATION_CATALOG.md` "Build your own" recipe table still needs a fuller pass distinguishing the first-party V1-GA connector from the still-V1.1 customer-operated recipe bridge).

**Governed Review Integrity — score 78, weight 13, deficiency 286.** This is the strongest category: changing a policy pack provably changes findings, pre-commit gate outcome, and audit reconstruction. Not scored higher only pending the RAG-V2 ablation evidence (TB-595) that would let this claim extend cleanly into the newer retrieval surfaces.

**Runtime & First-Review Reliability — score 80, weight 7, deficiency 140.** All six ship-gate items PASS with concrete evidence; this is the most mature category in the product.

## 8. Top 10 Weaknesses (ranked)

1. **RAG-V2 depth vs. label mismatch (Graph-RAG, agentic retrieval)** — design uncertainty, not a V1 blocker; fastest fix is the TB-597/TB-598 owner decisions plus TB-595 ablation evidence.
2. **No live pilot cohort yet** — market uncertainty, not a V1 blocker in the engineering sense but the single biggest gap in the diagnostic scores (§3); fastest path is G-REAL-06.
3. **AWS/GCP Cost-agent grounding gap** — design uncertainty; TB-603 is scoped and ready to pick up.
4. **ITSM native-create default posture ambiguity** — design uncertainty (an owner decision, not an engineering unknown); TB-599.
5. **OAuth gap on newly-promoted connectors** — design uncertainty; TB-600, larger effort (L).
6. **Live-validation script parity gap (Teams/Slack/Confluence)** — design uncertainty; TB-601.
7. **Stale "(V1.1)" copy on connector docs** — design uncertainty, now mostly corrected this session; TB-602 remainder is the "Build your own" recipe table distinction.
8. **Retrieval-quality ablation harness absent** — design uncertainty; TB-595 blocks a confident answer to weakness #1.
9. **No production-vector-index provenance marker for Graph-RAG runs** — design uncertainty; TB-596 (currently advisory-lint only).
10. **Upsert-time tenant validation on indexed chunks** — design uncertainty, lowest severity of the ten (query-time filtering already enforced); TB-604.

## 9. Frontier-AI Analysis

**Commodity vs. durable:**
| Capability | 12-month trajectory | Reason |
|---|---|---|
| Generic architecture critique | Commodity | Any frontier model with a good prompt already does this reasonably well |
| Policy-pack-driven findings + pre-commit gate | Durable | Requires persistent customer-specific policy state a chat session doesn't have |
| Evidence → policy → decision → audit traceability | Durable | Structural/workflow property, not a model capability |
| Graph-RAG / agentic retrieval quality | Gets more valuable as models improve | Better base-model reasoning directly improves rerank/rewrite quality at ~zero ArchLucid engineering cost |
| First-party ITSM/chat connectors | Durable (enterprise workflow, not model capability) | Value is the persistent per-tenant credential + correlation state, not intelligence |

**Hard to reproduce via prompting:** persistent policy-pack state, audit-reconstruction, per-tenant credential/correlation storage, golden-manifest run-of-record. **Easy for frontier AI to do soon:** the underlying single-pass critique quality itself.

**Leverage/upside:** as base models improve, Graph-RAG/agentic-retrieval output quality rises for free, and the policy-pack mapping layer gets more findings correctly classified per model generation — this is a real compounding bet, not a defensive footnote.

**Displacement timeline:** the single-pass generic-critique layer is one model release from being fully commodity; it already mostly is. The governed-workflow layer is not threatened by a single model release because it isn't a model capability.

**Survival probability:** see §3 (55–70%, 12-month).

**Final verdict:** ArchLucid is becoming more valuable faster than frontier AI is becoming capable, specifically because its moat is workflow/state/audit infrastructure that doesn't erode as base models improve — but this verdict rests more on architecture than on measured proof, since no ablation study yet isolates how much of the "insight density" is the governed layer vs. the underlying model.

## 10. Policy-Aware Governance Test

1. Policy packs are first-class and content-driving — verified: pre-commit gate blocks on severity thresholds computed from pack content, not a fixed rule.
2. Each major finding traces input → evidence → policy → recommendation → decision → audit — verified for the core review path; AWS/GCP cost findings are the one traced-but-uncited exception (TB-603).
3. A skilled architect + frontier AI alone would not reproduce this consistently without ArchLucid — true for the *repeatable, auditable* property; a single session could approximate one review, not a governed program across many reviews/operators.
4. Merely AI-generated vs. governed infrastructure: the finding text itself is AI-generated; the policy mapping, gate outcome, and audit record are governed infrastructure.
5. Evidence policy packs are a real moat: change a pack, rerun, observe different findings/gate outcome — this is demonstrable today.
6. Fastest validation: a buyer-run pilot where the buyer edits their own policy pack and observes the finding set change (no engineering needed — the seam already exists).
7. V1 behavior that makes the moat obvious in a demo: live policy-pack edit → re-run → different findings, in the same session.

## 11. Principal Architect Dismissal Test

A daily Claude/GPT/Cursor user says "I need this" when they see the pre-commit gate block a commit based on a policy pack they configured themselves, with a full evidence trail — that's the moment a chat session cannot replicate. They dismiss it if the RAG-V2 claims ("Graph-RAG," "agentic retrieval") get probed and turn out to be single-hop/single-shot — a technically sophisticated skeptic will ask "how many hops?" and "how many retries?" within the first five minutes, and an unqualified "production-grade" answer would trigger immediate credibility loss. **Most likely dismissal trigger, calibrated:** 30–45% likelihood in a technical-buyer demo that probes retrieval depth specifically, given the gap identified in §7. Directly: yes, they would believe ArchLucid is materially better than "Claude + a good prompt + my company standards pasted in" **for the governed/repeatable/audit-trail use case** — but not for one-off architecture critique, where the two are closer.

## 12. Founder Delusion Check

Strongest assumption with weakest evidence: that "Graph-RAG" and "agentic retrieval" read as fully mature to a technical buyer — they don't, once probed. Capability that looks ordinary but may be the strongest moat: the boring golden-manifest/audit-catalog/policy-pack plumbing, not the AI analysis itself. Activity that could burn months without moving any of the five outcomes: further RAG-V2 depth-building before a single real pilot has validated that buyers care about retrieval sophistication at all (vs. caring about the governance/audit layer). If features froze for six months, the biggest lever left would be running G-REAL-06 pilots and using the objections (M-20) to decide what actually matters. Most dangerous attractive distraction: multi-hop Graph-RAG engineering before pilot evidence justifies it. Most boring likely-real moat: per-tenant credential/correlation storage plus audit reconstruction.

## 13. Competitive Reality Check & Moat Assessment

A skilled architect manually maintains standards docs, pastes them into a chat session per review, and manually tracks decisions in a wiki. ArchLucid does the policy-mapping, gate-blocking, and audit-trail parts faster and more consistently; it does not do "better architecture critique" than a well-prompted frontier session. Commodity within 12 months: the raw critique text. Gets more valuable as AI improves: retrieval quality, without new ArchLucid engineering. Requires enterprise workflow, not model intelligence: policy-pack management, connector credential storage, audit export. Current moat: governed workflow + audit trail. Potential future moat: measured retrieval-quality delta once TB-595 lands. Weakest moat assumption: that "Graph-RAG"/"agentic retrieval" labels alone convey defensibility. Most durable: policy-pack-driven pre-commit gating. Probably-illusory: any claim that resists scrutiny only because a buyer didn't ask about hop-count or retry-count. Boring-but-durable: `ItsmFindingCorrelations` + audit catalog. What would make the moat obvious to a buyer: a live pack-edit-and-rerun demo (see §10.6).

## 14. Adoption & Monetization

**30-Day Voluntary Usage:** strongest positive factor is the pre-commit gate creating a forcing function to return; strongest negative factor is that `Integrations:Itsm:NativeEnabled` defaults off, so a first-week user who expects one-click Jira/ServiceNow create hits a config wall (TB-599). **Executive Purchase:** strongest driver is the audit/governance story for regulated buyers; strongest blocker is zero completed real-mode pilots to cite. Why buy over more frontier-AI licenses: governance, policy packs, evidence traceability, audit trail, repeatability across operators — none of which more AI licenses alone provide. **Top 6 monetization blockers:** (1) no completed pilot proof — validation, not implementation; (2) OAuth gap for enterprise buyers with strict vendor policy — TB-600, implementation; (3) ITSM native-create default friction — TB-599, owner decision; (4) unproven retrieval-quality claims under technical scrutiny — TB-595, validation; (5) AWS/GCP cost-citation gap for multi-cloud-heavy buyers — TB-603, implementation; (6) SOC 2 CPA absence for buyers with a hard compliance gate — V1.1-backlog, not a V1 blocker. **Top 6 enterprise adoption blockers:** (1) live-validation script gap for 3 of 5 promoted connectors (TB-601, testability); (2) stale "(V1.1)" copy eroding trust in scope claims during procurement review (TB-602 remainder, trust); (3) OAuth gap (TB-600, security-policy fit); (4) no live pilot case study (market, not product); (5) RAG-V2 depth-vs-label gap surfacing in technical due diligence (TB-597/598, trust); (6) upsert-time tenant validation gap, low severity but a security-review question mark (TB-604).

## 15. Most Important Truth

ArchLucid's governed-review infrastructure is real and durable, but every headline capability that uses an impressive-sounding AI label ("Graph-RAG," "agentic retrieval") currently ships at meaningfully shallower depth than the label implies, and the product has zero completed real-mode pilots to validate any of this against an actual buyer — the engineering is ahead of the proof.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

---

## 16. Stop Doing List

**Not worth doing before V1:** (1) multi-hop Graph-RAG expansion before TB-595 ablation evidence justifies the effort; (2) an iterative agentic-retrieval loop before the same evidence exists; (3) further UI copy polish beyond the TB-602 remainder — diminishing returns until pilot feedback (M-20) exists. **Diminishing-returns areas:** RAG-V2 depth-building, additional nav/IA polish, further copy audits without new user feedback. **Founder behaviors that could delay validation:** treating "Graph-RAG"/"agentic retrieval" labels as done rather than probing their own depth caveats; continuing engineering before G-REAL-06 pilots start; over-indexing on SOC 2 CPA readiness (correctly out of `(A)` scope). **Features that feel enterprise-important but may not move V1 adoption:** OAuth upgrade (TB-600) is real but should not jump ahead of getting a first pilot signed, since basic-auth already unblocks a pilot.

**ITSM special attention:** the V1.1→V1 GA promotion this cycle (owner scope 2026-07-03) means Jira/ServiceNow/Confluence/Slack/Teams are no longer "not a V1 gate" — do not treat TB-599–TB-602 as optional polish; TB-599 in particular (native-create default posture) is a live buyer-facing gap on a capability now marketed as GA.

## 17. Top Improvement Opportunities

**Verify-before-listing gate applied.** Every item below was checked against `TECH_BACKLOG.md` and the referenced source files this pass; none are shipped. Items shipped this cycle (V1 GA connector promotion docs, TB-021 closeout, RAG-V2 doc-accuracy corrections, this file's own rewrite) are acknowledged here in one line and do not get their own tier entry: **TB-021 closed (RAG-V1 foundation, all 12 sub-items verified shipped); ITSM V1 GA promotion documentation now consistent across `V1_SCOPE.md`/`V1_DEFERRED.md`/`CONNECTOR_READINESS_MATRIX.md`/`INTEGRATION_CATALOG.md`/`CONNECTOR_SMOKE_INDEX.md`/the CTO-demo route registry.**

### Tier 1 — Must Fix

**TB-599 — ITSM native-create default posture decision.** Why it matters: `Integrations:Itsm:NativeEnabled` defaults `false`, so `POST /v1/integrations/itsm/outbound/issues` 404s out of the box on a capability now marketed as V1 GA. Expected impact: removes first-week friction (§7 Time-to-Value, Adoption Friction). Evidence: `IntegrationsItsmOptions`, `CONFIGURATION_REFERENCE.md`. Actionability: high — this is an owner decision (flip default vs. keep as deliberate onboarding gate and fix the copy), not an engineering unknown. Design Uncertainty Reduced: 8/10. Market Uncertainty Reduced: 2/10. Classification: **blocked on owner decision**.

> **Cursor prompt (once the owner decides "flip default to true"):** Current problem: `Integrations:Itsm:NativeEnabled` defaults `false` in `appsettings.json`/`appsettings.Production.json`, causing native ITSM create to 404 without explicit tenant opt-in. Desired behavior: default `true` for new tenants, with a documented per-tenant opt-out in `CONFIGURATION_REFERENCE.md` and `INTEGRATION_CATALOG.md`. Scope boundaries: config default + docs only; do not change the outbound create logic itself. Acceptance criteria: new tenant fixture defaults to enabled; existing tenant behavior unchanged unless explicitly reset; docs no longer say the flag exists "to restore V1.1 connector posture." Tests to add/update: `IntegrationsItsmOptionsTests` default-value assertion. Non-goals: OAuth changes (TB-600), live-validation scripts (TB-601).

**TB-597 / TB-598 — Graph-RAG and agentic-retrieval depth decisions.** Why it matters: current 1-hop / single-shot implementations are real but shallower than "Graph-RAG"/"agentic retrieval" imply; a technical buyer probing depth is a credible dismissal trigger (§11). Expected impact: resolves the §7 AI/Agent Readiness and Differentiability deductions either by shipping deeper implementations or by correcting doc language to match shipped depth. Evidence: `GraphRagNeighborExpander.CollectOneHopNeighbors`, `AgenticRetrievalCompletionClient`. Actionability: high — owner decision on which path (extend vs. relabel). Design Uncertainty Reduced: 7/10. Market Uncertainty Reduced: 3/10. Classification: **blocked on owner decision**; depends on TB-595 ablation results to justify engineering effort if "extend" is chosen.

### Tier 2 — High Leverage

**TB-595 — Retrieval-quality ablation harness.** Why it matters: no current evidence isolates Graph-RAG/HyDE/query-rewrite's specific quality contribution from baseline retrieval — needed to make an evidence-based TB-597/598 decision and to substantiate insight-density claims. Expected impact: unblocks Tier 1 items above with real numbers instead of judgment calls. Evidence: `docs/quality/faithfulness-report.md` blends results without per-flag isolation. Actionability: medium — requires running the existing golden-cohort pipeline with flags toggled off, not new pipeline construction. Design Uncertainty Reduced: 9/10. Market Uncertainty Reduced: 1/10. Classification: **V1 engineering**.

> **Cursor prompt:** Current problem: the golden-cohort/faithfulness eval pipeline reports blended results with `EnableGraphRag`/`EnableHyde`/`EnableQueryRewrite` all on; there is no baseline-off comparison run. Desired behavior: add a baseline pass with each flag toggled off individually (and one all-off pass), publishing delta-attributed metrics per flag alongside the existing blended report. Scope boundaries: reuse the existing eval harness and golden cohort; do not add new test data. Acceptance criteria: `faithfulness-report.md` gains a per-flag delta table; CI can regenerate it deterministically. Tests to add/update: a new report-generation test asserting the delta table's presence and shape. Non-goals: changing the underlying retrieval implementations.

**TB-600 — OAuth 2.0 upgrade for Jira/ServiceNow/Confluence.** Why it matters: basic-auth/API-token-only blocks enterprise buyers whose vendor security policy mandates OAuth. Expected impact: removes a real, named enterprise adoption blocker (§14). Evidence: `JiraOutboundIssueClient`, `ServiceNowOutboundIncidentClient`, `ConfluenceCloudPublisherConnector`. Actionability: medium — well-scoped OAuth flow + Key Vault storage + migration path, but larger effort (L). Design Uncertainty Reduced: 6/10. Market Uncertainty Reduced: 4/10. Classification: **V1 GA tightening**.

**TB-601 — Live-vendor validation script parity (Teams/Slack/Confluence).** Why it matters: Jira/ServiceNow have `validate-itsm-live.ps1`; the other three promoted connectors only have manual smoke docs. Expected impact: closes a testability gap on connectors now marketed as GA. Evidence: `CONNECTOR_SMOKE_SLACK.md`, `CONNECTOR_SMOKE_CONFLUENCE.md`, no dedicated Teams smoke doc. Actionability: high — mirrors an existing pattern. Design Uncertainty Reduced: 8/10. Market Uncertainty Reduced: 1/10. Classification: **V1 GA tightening**.

**TB-603 — AWS/GCP structured retail-price grounding for the Cost agent.** Why it matters: AWS/GCP cost findings get zero structured price citation even though multi-cloud is V1 GA and the pricing clients already exist elsewhere in the codebase. Expected impact: closes the §7 Proof-of-ROI deduction for non-Azure tenants. Evidence: `CostRetailGroundingBuilder.IsAzureProvider` guard; `AwsPublicPricingClient`/`GcpCloudBillingCatalogClient` wired only into the deterministic cost-estimate path. Actionability: high — pattern to mirror already exists (`IAzureRetailPriceStructuredLookup`). Design Uncertainty Reduced: 8/10. Market Uncertainty Reduced: 2/10. Classification: **V1 GA tightening**.

**TB-602 (remainder) — `INTEGRATION_CATALOG.md` "Build your own" recipe table.** Why it matters: the table still needs to clearly distinguish the (now V1 GA) first-party connector from the (still V1.1) customer-operated recipe bridge for the same vendors, to avoid re-confusing buyers this session just un-confused elsewhere in the same document. Expected impact: closes the last known stale-copy surface from the 2026-07-03 promotion. Evidence: lines ~111–156 of `INTEGRATION_CATALOG.md` prior to this pass's §1/§2 fixes (§1 fixed this session; §2 "Planned connectors" recipe framing also fixed this session — confirm no further stray "(V1.1)" labels remain via a full-repo grep). Actionability: high, low effort. Classification: **buyer-copy tightening**.

### Tier 3 — Hold For Reassessment

**TB-596 — Graph-RAG production posture provenance marker.** Why it matters: currently only an advisory lint (`GraphRagProductionLikeConfigurationLint`), not a run-level provenance flag distinguishing proven vs. unproven Graph-RAG runs. Hold rationale: lower urgency than TB-595/597 which address the same underlying depth-vs-label issue more directly; revisit after TB-597 owner decision. Classification: **hold**.

**TB-604 — Upsert-time tenant validation on indexed chunks.** Why it matters: query-time tenant filtering is already enforced (P0/P1 shipped); this is the P2 write-time check. Hold rationale: lowest severity of the open items — no known exploit path, just defense-in-depth. Classification: **hold**.

## 18. Prompt Batching Guidance

**First batch (safe-for-Sonnet):** TB-599 config-default change + docs (once owner decides), TB-601 live-validation script parity (mirrors existing pattern), TB-603 AWS/GCP retail-price lookup (mirrors existing `IAzureRetailPriceStructuredLookup` pattern). **Second batch (safe-for-Sonnet, needs care):** TB-595 ablation harness (touches the eval pipeline — moderate blast radius), TB-602 remainder copy fix. **Third batch (strong-model-recommended):** TB-597/TB-598 depth-extension work, if the owner decision lands on "extend" rather than "relabel" — this touches retrieval-quality-sensitive code and benefits from Opus-level review given the stakes of getting retrieval regressions wrong.

## 19. Model Usage Guidance

**Composer-safe:** M-17 outreach-list formatting, deploy-checklist pre-staging (M-09), script-flag verification (G-REAL-07 prep). **Sonnet-safe (reduced pricing makes this the default choice for most of the list above):** TB-599/TB-601/TB-603 engineering, M-08 copy alignment, M-18 outreach message drafting, TB-595 ablation harness. **Strong-model-recommended (Opus):** M-20 objection synthesis into strategic copy changes; TB-597/TB-598 if "extend" is chosen, given retrieval-regression stakes; any refactor touching tenant-isolation logic (TB-604) given the security sensitivity even though the task itself is small.

## 20. Pending Questions For Later

* **Blocks V1 (owner decision needed):** TB-599 native-create default posture; TB-597/TB-598 RAG-V2 depth-vs-relabel.
* **Blocks V1.1:** none newly identified this pass.
* **Requires customer validation:** whether buyers actually probe Graph-RAG/agentic-retrieval depth in due diligence (informs how urgent TB-597/598 really are) — best answered by G-REAL-06 pilots, not more engineering.
* **Requires founder decision:** OAuth upgrade (TB-600) sequencing relative to signing the first pilot — recommend not blocking pilot #1 on this given basic-auth already works.

---

# Appendix A — Author Signal (qualitative, non-headline)

The product demonstrates real principal-architect judgment in the places that are hardest to fake: the policy-pack-driven pre-commit gate, the disposition-aware ROI model that deliberately does not sum per-system rows into a false headline, and the honest `groundingMissing: true` flag on AWS/GCP cost findings rather than silently fabricating a citation. The RAG-V2 labeling gap (§7, §11) is the clearest instance of enthusiasm outrunning shipped depth — worth fixing before it reaches a skeptical technical buyer, but it reads as an accuracy lapse in documentation, not a pattern of overclaiming in the product's actual behavior (which consistently flags its own uncertainty where it exists).

---

Central question: **Does ArchLucid turn frontier AI into a governed, policy-aware, audit-ready enterprise architecture review system that changes decisions and earns repeat use?** Yes, for the governed/repeatable/audit-trail dimension, with real evidence (policy-pack-driven gating, evidence traceability, disposition-aware ROI). Not yet proven for "changes decisions a skilled architect+frontier-AI session would have missed" — that claim needs the TB-595 ablation evidence and, more importantly, the first completed real-mode pilot (G-REAL-06) this assessment cannot substitute for.
