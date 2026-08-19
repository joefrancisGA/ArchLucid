> **Reviewed:** 2026-07-22
> **Scope:** Canonical assessment execution prompts (live). v3 = strategic weighted readiness; v4 = broader exposure R/Y/G gates. Outputs: `LATEST_GPT55.md` and `LATEST_EXPOSURE.md`.

# Assessment prompt series

Two complementary clean-slate prompts — do not conflate their questions or output files.

---

## Strategic release and market readiness (v3)
Perform an independent, first-principles assessment of ArchLucid.

This assessment optimizes for five outcomes (ranked; earlier = more important):

1. **Decision-changing insight** — non-obvious, correct findings that change a decision a skilled architect using frontier AI alone would not have changed.
2. **Governed repeatability across an organization** — the same policy-aware, evidence-backed, auditable architecture package produced consistently by different architects, not heroics.
3. **30-Day Voluntary Usage Probability.**
4. **Sponsor Purchase Probability.**
5. **Long-Term Differentiation / Survivability Against Frontier AI.**

Do not optimize for feature completeness, engineering elegance, documentation volume, governance breadth, or platform maturity unless they materially improve the five outcomes above.

---

# Critical Perspective

The primary competitive threat is **not** another enterprise architecture platform. It is **frontier AI** (Claude, GPT, Gemini, and future systems) used directly by highly competent principal architects.

Evaluate ArchLucid against **both**:

1. Enterprise architecture / governance tools.
2. A skilled architect using frontier AI **without** ArchLucid.

Do not ask only: *"Can frontier AI produce a similar critique?"* Ask:

> Can a skilled architect using frontier AI alone reliably reproduce the same governed, policy-aware, evidence-backed, repeatable, auditable architecture package — with comparable consistency and organizational adoption?

---

# Core Differentiation Thesis

Assess ArchLucid as a **governed enterprise architecture review system**, not a generic AI architecture chatbot. Central hypothesis:

> ArchLucid uses frontier AI as an analysis engine, but makes that analysis enterprise-specific by grounding it in customer policy packs, internal standards, approved/prohibited patterns, evidence requirements, governance workflow, decision records, exception handling, and audit trail.

Generic AI architecture analysis is increasingly commoditized. Credit durable differentiation **only** where ArchLucid demonstrates: customer-specific policy awareness; findings mapped to standards/policy packs; evidence→finding→policy traceability; repeatable intake→package workflow; sponsor/operator role separation; decision and exception auditability; remediation/external-ticketing seams; governance-ready packaging that survives architecture, security, compliance, and sponsor review.

A finding is more valuable when it answers: What evidence produced it? Which standard/policy does it implicate? What decision should change? Who must act? What is the audit record? How is it tracked/remediated?

---

# Product State Grounding (verify, do not rediscover)

The following are **already implemented**. Assess whether they *materially change output and decisions* — do not score them low for being "absent," and do not propose improvements that recreate them.

**Governance / policy (the intended moat):** the bundled `PlatformDefault` policy packs (current count per `docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md`; versioned rule sets, scope assignments, effective governance resolution; manifest `bundled-policy-packs-v1.manifest.json`); pre-commit governance gate (`ArchLucid:Governance:PreCommitGateEnabled`) that blocks commit on severity thresholds; approval workflow with segregation of duties, SLA tracking, escalation; governance dashboard.

**Evidence / audit / traceability:** the typed append-only audit catalog with CSV export (current coverage per `docs/library/AUDIT_COVERAGE_MATRIX.md` and `docs/library/AUDIT_EVENT_MODEL.md`); citation contract (cost/savings lines from an uploaded cloud extractor ZIP must cite `manifest.json` `collectionTimestamp` + schema version); golden manifest + authority chain as the run-of-record.

**Sponsor packaging / ROI:** `GET /v1/roi/sponsor-summary` (latest committed run per system, finding dedup by stable `FindingId`, **disposition-aware** portfolio basis), dashboard panel, and a board-pack export delegating to the same service. Note: per-system rows intentionally do **not** sum to the disposition-aware headline.

**First-party connectors (V1 GA as of 2026-07-03):** `POST /v1/integrations/itsm/outbound/issues` (Jira + ServiceNow) → ticket from persisted Authority-shaped finding; persists `dbo.ItsmFindingCorrelations` (stable `FindingId`); per-tenant settings; durable audit events (`Integration.JiraIssueCreate*`, `Integration.ServiceNowIncidentCreate*`); Confluence Cloud page-publish; Slack and Microsoft Teams incoming-webhook notifications. All five ship **Shipped** / **Shipped + manual vendor** per `docs/library/CONNECTOR_READINESS_MATRIX.md` — see `V1_SCOPE.md` §2.13–§2.15 and `V1_DEFERRED.md` §6/§6a for the promotion record and **TB-599–TB-602** for remaining tightening work (native-create default posture, OAuth upgrade, live-validation parity, buyer-copy sweep).

**Multi-cloud target analysis (V1 GA as of 2026-07-03):** Azure, AWS, and GCP extractor/polling paths all ship at parity per `docs/library/MULTI_CLOUD_ANALYSIS_V1_1.md` (all four phases shipped on master). Do not describe AWS/GCP as a pending V1.1 commitment; residual gap is Cost-agent structured retail-price grounding for AWS/GCP (**TB-603**), not extraction/ingestion.

**RAG-V2 items (pulled forward to V1 scope, per `V1_DEFERRED.md` §6q):** Graph-RAG neighbor expansion (`GraphRagNeighborExpander` + `GraphRagBoundedNeighborCollector`, **bounded multi-hop** with cycle-safe BFS and configurable hop budget — **TB-597 closed 2026-07-03**; community summarization still deferred), single-pass query expansion (`AgenticRetrievalCompletionClient`, one LLM completion each for query rewrite + HyDE + managed semantic rerank — **TB-598 closed 2026-07-04**; not iterative retrieve-critique-retry), and online fine-tuning (manifest foundation shipped **TB-594**; full loop is a further build-out). Do not describe these as unqualified "production-grade" without noting the depth caveats; see **TB-595**/**TB-596** for the ablation-harness and posture-audit gaps.

**AI substrate:** real mode uses **platform-provisioned Azure OpenAI** (hosted SaaS); **simulator mode** gives deterministic execution/CI; orchestration (`AuthorityRunOrchestrator`) lives in `ArchLucid.Application` (the prior "orchestrator-in-Persistence" issue is **remediated** — do not re-flag); retrieval ships (`ArchLucid.Retrieval`, `AskService`, ADR 0004 outbox); RAG-V1 quality foundation is **closed** (**TB-021**, closeout audit 2026-07-03, all 12 `RAG-V1-000`–`RAG-V1-011` sub-items verified shipped) — residual items are **TB-603**/**TB-604**, not a missing surface.

Source of truth: `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, `docs/go-to-market/trust-center.md`, `.cursor/rules/Assessment-Scope-V1_1.mdc`.

**Already-shipped ledger (do not re-propose) — verify-before-listing gate (mandatory).** Before proposing **any** §17 improvement or listing any item as open, you MUST:
1. Grep `docs/library/TECH_BACKLOG.md` for the specific capability/component name and check whether a matching item is already marked **Done** / **Shipped** / **closed**.
2. Grep the actual source files referenced (not just docs) to confirm the capability is genuinely absent or incomplete in code — a doc claiming something ships is not sufficient; a doc claiming something is missing when code shows otherwise is also not sufficient. Resolve the discrepancy before listing.
3. If the item is already shipped, do **not** list it in §17 under any tier, and do not fabricate a "Rescore impact" or cumulative score delta for it. Shipped work gets, at most, a single flat one-line pointer in a "Shipped this cycle" acknowledgment — never its own Tier 1–3 entry.
4. **Never treat a historical `TECH_BACKLOG.md` changelog as a source of new improvement opportunities.** §17 opportunities must come from a fresh gap found *this pass* (code/doc discrepancy, missing test, unresolved owner decision), not a replay of past "Done" entries.
5. **Score deltas are prohibited.** Do not report "(A) headline readiness moves from X% to Y%" as a running ratchet across items. Each pass computes `(A)` **fresh** from the Weighted Quality Model in this same document — there is no cumulative score state carried between items or between passes.

**GTM V1.1 backlog — do not list in §17.** Assessment improvements **#2**, **#3**, **#5**, and **#6** are routed to `docs/go-to-market/GTM_BACKLOG.md` (**M-90**, **M-44**, **M-91**, **M-92**). They are market-execution / cohort work, not V1 engineering or assessment prescription. **Do not** surface them as Tier 1–3 improvement opportunities, Cursor prompts, or "still open" assessment gaps in future passes. See **`.cursor/rules/GTM-V1_1-assessment-exclusions.mdc`**.

---

# Operating Rules

* Clean-slate assessment. Do not reference previous assessments, prior scores, or earlier conclusions; override historical comparison behavior.
* Do not use subagents or distributed analysis.
* Orient using the **Source Materials** read list before broad repo scans.
* Treat explicitly deferred V1.1/V2 items as out of scope (see **Out of `(A)` Headline — Do Not Penalize**); do not penalize readiness for them.
* Distinguish **design uncertainty** (reducible by building/testing/docs) from **market uncertainty** (reducible only by pilots, buyer interviews, production usage). If uncertainty is primarily market, prefer validation over implementation.
* Avoid proposing improvements that already appear implemented (see **Product State Grounding** and the **verify-before-listing gate**).
* Prefer smaller high-confidence backlogs over larger speculative ones.
* Persist by **overwriting the rolling pass file under `docs/assessments/`** (currently `docs/assessments/LATEST_GPT55.md`) in place. Do **not** create new dated multi-thousand-line files; archive any prior snapshot under `docs/archive/assessments/`.
* **File-size discipline.** The rolling pass file should read as a current-state assessment, not an accumulated changelog. If §17 or the sponsor summary starts enumerating dozens of historical ticket IDs, that is a signal the verify-before-listing gate was skipped — stop and re-apply it.

---

# Source Materials (read list — orient here first)

Read in this order (per `docs/library/ASSESSMENT_INPUTS.md`) before grepping broadly:

1. `docs/library/REPO_DIGEST.md` — surface skim
2. `docs/library/V1_SCOPE.md` — in-contract V1 / V1.1 boundaries
3. `docs/library/V1_DEFERRED.md` — explicit deferrals
4. `docs/go-to-market/trust-center.md` — trust / buyer commitments
5. `docs/security/SOC2_SELF_ASSESSMENT_2026.md` + `docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap` — SOC posture (CPA gap is `(B)` only)
6. `docs/library/ARCHITECTURE_COMPONENTS.md`, `docs/library/SYSTEM_MAP.md`
7. `docs/library/API_CONTRACTS.md` — HTTP/OpenAPI contract of record
8. `docs/library/CONFIGURATION_REFERENCE.md`
9. `docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md`, `docs/library/AUDIT_COVERAGE_MATRIX.md`
10. `docs/go-to-market/GTM_BACKLOG.md` — human-owner execution backlog (source for §0)
11. `.cursor/rules/Assessment-Scope-V1_1.mdc` — `(A)` vs `(B)` boundary

State which of these (and any code regions) you actually inspected.

---

# Out of `(A)` Headline — Do Not Penalize

Per `V1_SCOPE.md §3`, `V1_DEFERRED.md §6*`, `Assessment-Scope-V1_1.mdc`. Discuss honestly under `(B)` / roadmap; do **not** deduct `(A)`:

* SOC 2 Type I/II CPA attestation, ISO 27001 (V1 ships self-assessment + roadmap + trust-center honesty; CPA is V1.1 backlog TB-135).
* Third-party / external pen test publication (V1 is owner-conducted; external is V2 TB-136).
* Signed/active design partner (V1.1 commercial).
* Owner-output GTM assets/cohorts — proof-packet cohort (TB-141), demo assets (TB-142).
* Public extension/plugin SDK; third-party plugin marketplace / agent store.
* MCP membrane absence in V1 (MCP is V1.1; `/v1/mcp/retrieval/*` is non-GA).
* Assistive-technology participant user testing as a headline gate.
* Sales-engineer-led LLM onboarding on hosted SaaS (platform-provisioned Azure OpenAI is the V1 posture).
* CloudEvents outbound webhooks and customer-operated recipe bridges (V1.1) — **not** first-party Jira/ServiceNow/Confluence/Slack/Teams, which are V1 GA as of 2026-07-03.
* Multi-region active/active (V1.1). AWS/GCP target analysis is **V1 GA** — do not list it here.
* Live commerce un-hold — Stripe live keys, Marketplace `Published`, DNS cutover (V1.1, owner-only; all wiring + TEST-mode trial already ship in V1).
* V2 platform items — Redis-as-default substrate, DTF / Container Apps Jobs, automated tenant-erasure pipeline.
* GTM V1.1 backlog items **#2/#3/#5/#6** (M-90/M-44/M-91/M-92) — see exclusion rule above.

Deduct `(A)` only for in-contract V1 / named V1.1 engineering gates.

---

# Scoring Method

Score each weighted quality from **1–100** using the weighted quality model defined below. This model is **self-contained** and authoritative for this assessment.

* Weighted contribution = `score × weight / 100`
* Weighted deficiency signal = `(100 − score) × weight`
* **(A) Headline Readiness** = `sum(score × weight) / 100` (weights total **100**)
* Rank urgent qualities by **weighted deficiency signal**, not raw score.
* **Compute fresh every pass.** Do not carry forward, ratchet, or accumulate a delta from any prior assessment. A resting state of exactly 100.00% across all ten categories is presumptively wrong — investigate before publishing it.

Provide two labeled scores:

* **`(A)` V1 headline readiness** — only in-contract V1 / named V1.1 engineering gates.
* **`(B)` Procurement / market-motion realism** — informational, **weight 0** in `(A)`. Buyer friction (SOC 2 CPA, RFP rigidity, procurement timing); GTM pipeline only if asked.

## Weighted Quality Model (total = 100)

| # | Quality | Weight |
|---|---------|-------:|
| 1 | Decision-Changing Insight Density | 13 |
| 2 | Differentiability / Defensibility vs Frontier AI | 13 |
| 3 | Governed Review Integrity (policy→evidence→finding→decision→audit traceability) | 13 |
| 4 | Correctness & Evidence Integrity | 12 |
| 5 | AI / Agent Readiness | 10 |
| 6 | Time-to-Value | 10 |
| 7 | Proof-of-ROI Readiness | 9 |
| 8 | Sponsor / Operator Comprehension (cognitive load) | 8 |
| 9 | Runtime & First-Review Reliability | 7 |
| 10 | Adoption Friction | 5 |

For each quality provide: Score · Weight · Weighted contribution · Weighted deficiency signal · Justification · Tradeoffs · Recommendations · Classification (V1 / V1.1 / V2 / blocked on user input / market validation required). For each, note which outcome(s) it affects.

## Category interpretation

* **Decision-Changing Insight Density** — non-obvious, correct findings a skilled architect using frontier AI would miss, dismiss, fail to operationalize, or fail to package into governance. Do not credit articulate-but-generic output.
* **Differentiability / Defensibility** — use the rubric below. Credit only governed, policy-aware, evidence-backed, repeatable review infrastructure, not critique eloquence. This category **is** the Defensibility score; do not produce a separate orphan defensibility number.
* **Governed Review Integrity** — does *changing a policy pack* change findings, priorities, recommendations, decisions, sponsor reporting, and the pre-commit gate outcome, with full traceability and audit reconstruction?
* **Correctness & Evidence Integrity** — coherent states; preserved review/session/workspace identity; **no hallucinated or uncited policy/evidence claims**; no false confidence.
* **AI / Agent Readiness** — grounded, inspectable, repeatable, policy-aware, safe; account for real-Azure-OpenAI vs simulator separation, Application-layer orchestration, and RAG-V2 depth caveats (Graph-RAG bounded multi-hop per **TB-597**; single-pass query expansion per **TB-598** — not iterative agentic retrieval). "Uses AI" ≠ "AI-ready."
* **Time-to-Value** — speed to a credible architecture package or "I did not think of that" moment.
* **Proof-of-ROI Readiness** — credibility (not mere presence) of the ROI story: `GET /v1/roi/sponsor-summary` + board-pack export, cost evidence, savings basis labels, disposition-aware totals, and (for AWS/GCP) whether cost findings carry structured retail-price grounding or only illustrative framing (**TB-603**).
* **Sponsor / Architect Comprehension** — understandable to architects, executives, and governance stakeholders without excessive explanation.
* **Runtime & First-Review Reliability** — does first review generation, commit, manifest, and export work reliably end to end? (UI breakage is also a **ship gate** below.)
* **Adoption Friction** — effort to configure identity, ingest evidence, run the pilot path, validate security, and fit existing operations; account for `Integrations:Itsm:NativeEnabled` defaulting `false` out of the box (**TB-599**).

## Differentiability Rubric

* **Low:** generic advice frontier AI could produce from a good prompt.
* **Medium:** structured findings/packages, but policy awareness, evidence traceability, and governance workflow are limited/unclear.
* **High:** findings mapped to policy packs, standards, evidence, recommendations, decisions, and review workflow a generic AI session would not consistently reproduce.
* **Excellent:** changing policy packs/standards demonstrably changes findings, priorities, sponsor reporting, review decisions, and audit trail — traceably and defensibly.

## Probability calibration (mandatory for every probability)

For each probability (ship gate confidence, 30-day usage, sponsor purchase, dismissal, frontier-AI survival): state the **reference class / base rate**, then adjust for ArchLucid-specific evidence, then give a **range** (not a point estimate) and your confidence. Unanchored "vibes" probabilities are not acceptable.

---

# V1 Ship Gate (binary; overrides the score)

Before any narrative, answer each **PASS / FAIL / UNKNOWN** with one-line evidence. Any FAIL caps headline readiness regardless of the weighted score; any UNKNOWN names the fastest test to resolve it.

1. First review completes end to end: create → execute → commit → golden manifest + ≥1 artifact.
2. Representative review contains **no hallucinated or uncited** policy/evidence citations.
3. Sponsor summary / ROI output is coherent and not misleading (incl. the per-system-vs-headline ROI labeling).
4. Export/package generation works (Markdown / DOCX / ZIP).
5. Architect workspace does not break during the first-review / demo path.
6. Auth + tenant isolation behave correctly on the pilot path.

---

# Report Structure (flat numbering)

Produce sections in this exact order. Put **all scores up front**, narrative below, and a hard divider between **diagnosis** and **prescription**.

## 0. Tasks For Human (mandatory, always first)

Purpose: give the founder one ranked, sequenced worklist of everything in this assessment cycle that **requires a human** (owner decision, live-vendor credential, buyer/pilot interaction, procurement motion, budget/leadership commitment) — as distinct from engineering work a coding agent can pick up directly.

**Sourcing rule:** pull candidate items from `docs/go-to-market/GTM_BACKLOG.md` (open M-series rows) plus any owner-decision items surfaced elsewhere in this pass (e.g. a `TECH_BACKLOG.md` item whose acceptance criteria is "owner decision needed"). Do **not** invent tasks not traceable to one of those sources. Exclude GTM V1.1-backlog-excluded items (#2/#3/#5/#6 — M-90/M-44/M-91/M-92) unless the user has explicitly directed picking them up this cycle.

**Ranking rule:** order by criticality — rollout-gate / revenue-blocking items first, then trust/procurement-blocking, then polish/optimization. Within a criticality tier, order by dependency (an item that unblocks a later item comes first) so the list reads as a valid execution sequence, not just a priority sort.

**Sequencing rule:** if item B depends on item A's output (e.g. a cohort needs a script that doesn't exist yet), A must appear before B, and B's entry must name the dependency explicitly.

**Per-item fields (mandatory, in a table):**
| Field | Content |
|---|---|
| # | Sequence position (1, 2, 3…) |
| Task | Short imperative title, with the GTM backlog ID (e.g. `M-xxx`) |
| Why ranked here | One line: criticality + dependency reasoning |
| Engine-assistable? | Yes / Partial / No — can a coding agent do any part of this (e.g. drafting a script, a survey, an email template, a rehearsal doc) even though the human must execute the live/social/financial part? |
| Recommended engine | Name one of **Composer**, **Sonnet**, **Opus**, or **Fable** (or "N/A — human only") with a one-line cost/effectiveness rationale. Default to **Sonnet** for most drafting/scripting work given its current reduced price makes it the best cost/effectiveness tradeoff; reserve **Opus** for high-stakes strategic framing (e.g. procurement objection rehearsal scripts, sponsor-facing narrative) where reasoning depth materially changes outcome; reserve **Composer** for fast, low-stakes, high-volume mechanical drafts; reserve **Fable** only if the task is narrative/creative-writing-shaped (e.g. a case-study story) rather than technical or analytical. |

## 1. Title & Headline
`ArchLucid Assessment – (A) Headline Readiness: XX.XX%`. State: readiness excludes deferred items; reasoning engine used (real Azure OpenAI vs simulator if relevant); timestamp; source materials inspected.

## 2. Scorecard
Single table of all 10 weighted qualities (score, weight, weighted contribution, weighted deficiency signal) + the computed `(A)` headline %. No prose scores elsewhere.

## 3. Diagnostic Scores (non-headline — must be reconciled with §2)
Report and explicitly state these do **not** feed the headline, then reconcile any tension with it:
* Decision Advantage Score (1–100) — likelihood ArchLucid changes a decision frontier AI alone would not.
* Frontier-AI Survival Probability (12-month) — with calibration.
* 30-Day Voluntary Usage Probability and Sponsor Purchase Probability — with calibration.
If any diagnostic score sharply contradicts the headline (e.g. low defensibility vs high headline), say so and explain.

## 4. V1 Ship Gate
The six PASS/FAIL/UNKNOWN items above, each with evidence and (for FAIL/UNKNOWN) the fastest resolution path.

## 5. Sponsor Summary
* **(A) Overall headline readiness** (excludes deferred items). Write this as **prose describing current-state capability**, not an enumeration of ticket IDs — a reader should be able to understand the state of the product without cross-referencing `TECH_BACKLOG.md`.
* **(B) Procurement / market realism** (weight 0): procurement friction, trust posture, SOC posture (self-assessment + roadmap; CPA gap `(B)` only), buyer risk, supportability, security-review expectations. Do not penalize `(A)`.
* **Commercial picture** (compelling today vs unproven). The V1 motion is **sales-led** (pricing page + order form + TEST-mode trial); live commerce un-hold is V1.1 owner-only — not a V1 blocker.
* **Enterprise picture** (trust vs hesitation).
* **Engineering picture** (robust vs fragile).
* **Frontier-AI picture** (becoming more or less valuable as frontier AI improves — one sentence verdict).

## 6. Deferred Scope Uncertainty (only if needed)
For deferred items that create uncertainty but must not penalize `(A)`: why deferred; whether deferral is safe for V1; what V1 seam/placeholder is needed. Current taxonomy:
* **V1.1:** CloudEvents webhooks + customer-operated recipes; MCP membrane; multi-region; commerce un-hold. (Jira/ServiceNow/Confluence/Slack/Teams first-party connectors are **V1 GA**, not V1.1 — do not list them here.)
* **V2:** third-party pen-test program; SOC 2 CPA; automated tenant-erasure; Redis-as-default; DTF / Container Apps Jobs.

## 7. Weighted Quality Assessment (detail)
Per the 10 categories, ordered by **weighted deficiency signal**. Use the per-category format from **Scoring Method**.

## 8. Top 10 Weaknesses (ranked, most serious first)
For each: why it matters; design vs market uncertainty; whether it is a V1 blocker; fastest credible fix or validation path. Cover release readiness, trust, buyer value, adoption, correctness, operational risk, policy-aware differentiation, evidence traceability, review-package credibility.

## 9. Frontier-AI Analysis (single consolidated section)
Replace all prior duplicated frontier sections with one:
* **Commodity vs Durable table** — for each major capability: does it become commodity within 12 months, stay durable, or get *more* valuable as frontier AI improves; with the reason and the evidence.
* **Hard-to-reproduce-via-prompting** — what specifically resists prompting (policy state, evidence traceability, audit, repeatability, governed workflow) vs what frontier AI could soon do easily.
* **Leverage / upside (mandatory):** how does ArchLucid get *more* valuable *because* base models improve (better model → better findings → more policy mappings → more audit value at ~zero ArchLucid eng cost)? Treat this as a first-class bet, not a defensive footnote.
* **Displacement timeline** — what is one model release away from commoditization.
* Survival probability is reported in §3 (do not duplicate the number here; reference it).
* **Final verdict:** Is ArchLucid becoming more valuable faster than frontier AI is becoming capable? Defend, explicitly addressing: generic-analysis commoditization, customer-specific policy packs, internal-standards awareness, evidence traceability, audit-ready packages, sponsor/operator workflow, decision advantage, voluntary reuse.

## 10. Policy-Aware Governance Test
The surfaces exist (see grounding) — judge whether they change behavior:
1. Are policy packs first-class objects whose **content** drives behavior, or effectively inert?
2. Can each major finding trace to input → evidence → policy/standard → recommendation → decision/disposition → audit record?
3. Would a skilled architect using frontier AI alone reproduce this consistently without ArchLucid?
4. What is merely AI-generated analysis vs governed enterprise infrastructure?
5. What evidence would prove policy packs are a real moat, not decoration?
6. Fastest validation path that policy-aware review changes customer decisions?
7. What V1 behavior would make this moat obvious in a demo?

## 11. Principal Architect Dismissal Test
Persona: principal architect; daily Claude/GPT/Gemini/Cursor user; deep cloud expertise; low patience for process; skeptical of governance theater; prefers direct tools over platforms. Answer: what makes them say "I need this" / "I did not think of that"; what makes them voluntarily return, recommend, spend their own budget; what causes immediate dismissal; the single most likely dismissal trigger and its likelihood today (calibrated). Answer directly: **would they believe ArchLucid is materially better than "Claude + a good prompt + my company standards pasted in"?**

## 12. Founder Delusion Check (be direct)
Strongest assumptions with weakest evidence; capabilities that look differentiated but are already frontier-AI commodity; capabilities that look ordinary but may be the strongest moat; activities that could burn months without improving any of the five outcomes; if features froze for six months, what most improves the five outcomes; the most dangerous attractive distraction; the most boring thing that may be the real moat.

## 13. Competitive Reality Check & Moat Assessment
Vs a skilled architect using frontier AI: what they already do manually; what ArchLucid does substantially faster / more consistently; what resists prompting; what is commodity within 12 months; what gets more valuable as AI improves; what requires enterprise workflow vs model intelligence; what requires customer-specific policy state vs one-off prompting. Then: current moat; potential future moat; weakest moat assumption; most durable moat assumption; probably-illusory moat; boring-but-durable moat; what would make the moat obvious to a buyer.

## 14. Adoption & Monetization
* **30-Day Voluntary Usage** (10 principal architects): strongest positive/negative factor; most likely reason to return/stop. (Probability in §3.)
* **Sponsor Purchase**: strongest driver/blocker; minimum proof for a paid pilot; likely objection. Answer directly — **why buy ArchLucid instead of more frontier-AI licenses?** — addressing governance, policy packs, evidence traceability, audit trail, repeatability, decision workflow, sponsor reporting.
* **Top 6 monetization blockers** (the V1 motion is sales-led; do not treat absent live commerce as a blocker): why each blocks payment; who objects; what evidence overcomes it; implementation vs validation.
* **Top 6 enterprise adoption blockers** (operators, architects, governance, security, compliance, procurement, implementation): pilot vs scale blocker; whether it affects trust, usability, workflow fit, policy alignment, auditability, or process integration.

## 15. Most Important Truth
One blunt sentence + short explanation. Do not soften.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

---

## 16. Stop Doing List (be direct)
Top 3 improvements not worth doing before V1; top 3 diminishing-returns areas; top 3 founder behaviors that could delay validation; top 3 features that feel enterprise-important but may not improve V1 adoption.

## 17. Top Improvement Opportunities (5–15; stop when confidence drops)

**Verify-before-listing gate applies here (see Product State Grounding above) — this is the section most prone to drift.** Every item MUST pass the four-step verification before it appears below. Shipped work never gets its own Tier entry — at most a one-line "Shipped this cycle" pointer with no fabricated score-delta.

**Validation-first ordering (mandatory).** When all six V1 ship gates PASS and no in-contract V1/V1.1 engineering gate is open, this section MUST **lead with market-validation work** — pilot design, buyer-interview scripts, proof-packet cohort (TB-141/142), and the cheapest experiment that would move 30-Day Voluntary Usage or Sponsor Purchase probability — before any engineering item. Any **new** engineering proposal in this state must justify itself explicitly against the five ranked outcomes (and name which one it moves); "completeness," "polish," or "elegance" are not acceptable justifications. Prefer recommending **zero** new engineering items over manufacturing low-confidence ones.

Group into **Tier 1 – Must Fix**, **Tier 2 – High Leverage**, **Tier 3 – Hold For Reassessment**. For each: Title · Tier · Why it matters · Expected impact · Affected qualities · Evidence · Actionability · Design Uncertainty Reduced (1–10) · Market Uncertainty Reduced (1–10) · Classification (V1 / V1.1 / V2 / validation first / blocked on user input). Items whose dominant lever is **Market Uncertainty Reduced** must be expressed as validation plans, not Cursor prompts.
For actionable V1/V1.1 **engineering** items, generate complete **Cursor prompts** including: current problem, desired behavior, scope boundaries, acceptance criteria, tests to add/update, non-goals.

## 18. Prompt Batching Guidance
First / Second / Third batch. Prioritize: (1) reliability of first review generation; (2) clarity of guided intake; (3) evidence/policy traceability; (4) review-package credibility; (5) demo reliability; (6) sponsor/operator comprehension. Mark each batch safe-for-Composer / safe-for-Sonnet / strong-model-recommended.

## 19. Model Usage Guidance
Composer-safe / Sonnet-safe / strong-model-recommended / Opus-or-Gemini-assessment-recommended. Strong models for: strategic assessment, policy-aware moat evaluation, refactors affecting review generation, security/auth/workspace routing, evidence-graph semantics, cross-document guidance. Cheaper models for: copy cleanup, UI polish, snapshot updates, minor component refactors, straightforward routing fixes. Note Sonnet 5's current reduced price when recommending it over Opus for tasks where reasoning depth is not the limiting factor.

## 20. Pending Questions For Later (only truly blocking)
Separate: blocks V1 / blocks V1.1 / requires customer validation / requires founder decision.

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

Separately from the weighted score, assess whether the product demonstrates serious principal-architect judgment, product taste, enterprise realism, governance awareness, and practical credibility. **This is explicitly excluded from `(A)` headline readiness** (it measures author signal, not market readiness, and weighting it would reward impressive complexity against the stated optimization targets). Report it as a short qualitative paragraph only. Do not overvalue feature quantity.

---

# Final Instruction

Optimize for the five outcomes in priority order. For survivability, credit primarily customer-specific policy awareness, governed workflow, evidence traceability, review packaging, decision auditability, repeatable organizational adoption, sponsor/operator separation, and remediation seams — **not** generic critique quality unless tied to policy packs, standards, evidence, governance, or decision workflow. If these conflict with feature completeness, governance breadth, documentation volume, elegance, or polish, prioritize the five outcomes.

Central question — answer it directly:

> Does ArchLucid turn frontier AI into a governed, policy-aware, audit-ready enterprise architecture review system that changes decisions and earns repeat use?
---

## Broader exposure readiness (v4)
You are assessing ArchLucid as an adversarial product strategist, principal enterprise architect, SaaS reliability reviewer, regulated-enterprise buyer, UI quality reviewer, and skeptical go-to-market advisor.

This is a clean-slate assessment. Do not assume prior scores are correct. Do not optimize for making the founder feel good. Optimize for whether ArchLucid should be exposed to broader audiences and under what constraints.

The central question:

Does ArchLucid currently deserve broader exposure, and if so, what kind?

Evaluate three exposure levels separately:

1. Controlled beta
2. Public self-service
3. Public mention / founder-led LinkedIn awareness

Near the top of the report, before any long narrative, provide a Red / Yellow / Green assessment for each exposure level.

Use this meaning:

- GREEN = safe to proceed now with normal caution.
- YELLOW = proceed only with explicit constraints, limited audience, or specific preconditions.
- RED = do not proceed; material trust, reliability, cost, security, positioning, pricing, or product-readiness risk exists.

For each of the three exposure levels, provide:
- RYG status
- one-sentence verdict
- top 3 rationale points
- top 3 conditions required to move to the next safer status
- recommended audience size / scope
- recommended guardrails
- what would make this fail publicly

The assessment must be adversarial. Treat buyer trust, UI polish, pricing coherence, demo safety, AI cost control, and public first impression as first-class release risks.

---

# Core Product Context

ArchLucid is an architecture intelligence platform intended to create, review, govern, evidence-check, and package architecture decisions. It should be assessed as a governed enterprise architecture review system, not as a generic AI chatbot.

The primary competitive threat is not another enterprise architecture platform. It is a skilled principal architect using frontier AI directly.

Evaluate ArchLucid against:

1. Enterprise architecture / governance tools.
2. A skilled architect using Claude, GPT, Gemini, Cursor, or similar frontier AI without ArchLucid.

Do not ask only:
"Can frontier AI produce a similar critique?"

Ask:
Can a skilled architect using frontier AI alone reliably reproduce the same governed, policy-aware, evidence-backed, repeatable, auditable architecture package — with comparable consistency, role separation, sponsor packaging, policy traceability, and organizational adoption?

---

# Exposure-Level Definitions

## Controlled beta

A controlled beta means founder-selected users, limited tenants, active observation, handholding available, known contact information, and the ability to intervene manually.

Controlled beta may tolerate:
- some rough UI edges
- some missing automation
- some manual onboarding
- some sample/demo limitations
- incomplete self-service commerce
- some private explanations from the founder

Controlled beta may NOT tolerate:
- trust-breaking buyer-facing pages
- contradictory pricing models
- uncontrolled AI cost exposure
- major first-review failures
- raw internal implementation language on core paths
- tenant isolation uncertainty
- visibly broken demo flow
- platform advocacy that alienates non-Azure buyers

## Public self-service

Public self-service means unknown users can visit, try, sign up, evaluate, and possibly pay without founder intervention.

Public self-service requires:
- coherent pricing and billing
- AI budget controls
- demo reliability
- safe trial guardrails
- polished auth/error states
- no visible internal artifacts
- meaningful system health or hidden system health
- core workflows that do not require explanation
- strong empty states
- buyer-safe help/docs
- public demo load/cost protection
- clear support/access path

Public self-service should be treated as much riskier than controlled beta.

## Public mention / LinkedIn awareness

Public mention means the founder begins talking about ArchLucid publicly, possibly showing screenshots, short videos, or inviting people to request access.

Public mention does not necessarily require open signup.

Public mention requires:
- credible public-facing positioning
- a safe path for interested users
- no embarrassing landing/pricing/demo contradictions
- clear request-access flow
- stable enough demo screenshots/video
- no claims that outrun the product
- a controlled funnel for inbound interest

Public mention may be GREEN before public self-service is GREEN, if the call to action is controlled.

---

# Mandatory Top-Level RYG Summary

Begin the report with this exact table:

| Exposure path | RYG | Verdict | Why | Conditions to proceed |
|---|---|---|---|---|
| Controlled beta | RED/YELLOW/GREEN | ... | ... | ... |
| Public self-service | RED/YELLOW/GREEN | ... | ... | ... |
| LinkedIn / public mention | RED/YELLOW/GREEN | ... | ... | ... |

Immediately after the table, provide:

## Exposure Recommendation

State one of:

- "Do not expose beyond internal testing."
- "Proceed with controlled beta only."
- "Proceed with controlled beta and controlled public mention, but not self-service."
- "Proceed with public self-service."
- "Proceed with public self-service only after listed launch gates are closed."

Then explain the rationale in plain English.

---

# Assessment Outcomes

Optimize for these outcomes in priority order:

1. Decision-changing insight — non-obvious, correct findings that change a decision a skilled architect using frontier AI alone would not have changed.
2. Governed repeatability across an organization — same policy-aware, evidence-backed, auditable architecture package produced consistently by different architects.
3. Trustworthy buyer first impression.
4. 30-day voluntary usage probability.
5. Sponsor purchase probability.
6. Long-term differentiation / survivability against frontier AI.
7. Reliable and cost-controlled demo/trial exposure.

Do not optimize for feature quantity, documentation volume, enterprise-sounding complexity, or architecture elegance unless they materially improve these outcomes.

---

# Product State Grounding

Verify actual product state. Do not assume every surface is polished just because functionality exists.

Treat these as distinct:

- functional existence
- buyer-safe presentation
- demo-safe behavior
- operational reliability
- self-service readiness
- enterprise procurement readiness

A feature that works technically but exposes raw IDs, API paths, database language, internal terms, inconsistent pricing, or platform bias may still be a release risk.

---

# Special Attention From Recent Review Findings

Pay special attention to these observed risk patterns:

1. Buyer-facing pages exposing internal implementation language:
   - raw IDs
   - API routes
   - database language
   - Stripe IDs
   - JSON/debug links
   - "sample shell"
   - V1/version labels
   - run IDs / manifest IDs / class names

2. Inconsistent product language:
   - "Create architecture" used where the user chose Reviews
   - architecture packages versus architecture creation
   - alerts versus approvals
   - governance versus approval workflow
   - sample workspace versus completed sample versus sample package

3. Pricing and billing incoherence:
   - public pricing and in-app billing must use one canonical model
   - one-license / Architect plan must exist or be clearly supported
   - workspace plus seat pricing may confuse buyers
   - public enterprise pricing may scare prospects away prematurely
   - introductory/V1/order-form language may reduce trust

4. Trustworthiness defects:
   - System health page should not say it is not part of the sample shell
   - policy pack detail should not show a raw numeric route instead of a policy pack
   - auth/access failure should support request access without exposing private email
   - public demo should not hit dead ends
   - support and security pages should build confidence

5. UI polish problems:
   - buttons used where tabs should exist
   - duplicated page descriptions / hero cards
   - sparse empty states
   - misleading or weak CTAs
   - top arrows that feel disconcerting
   - misplaced links such as "All"
   - inconsistent button styling
   - text-heavy pages that should be guided workflows

6. Cloud neutrality risk:
   - Azure must not appear favored over AWS/GCP
   - cloud connectors should have provider parity
   - users should be able to hide irrelevant platforms
   - evidence-only review should be first-class
   - cloud-provider details should not all be crammed into one page

7. AI cost and reliability risk:
   - public demo must not allow uncontrolled AI spend
   - trial workspaces need visible budgets and hard stops
   - long-running jobs should be queued
   - demo traffic should be isolated from paid/trial tenants
   - load testing should happen before broad public access

8. Help/onboarding risk:
   - getting started pages should not read like internal engineering docs
   - contextual help should replace repeated "About this page" blocks
   - first-review flow must be obvious within seconds

---

# New Required Diagnostic Categories

Add these categories in addition to the existing weighted model.

## Trustworthiness Score

Score 1–100.

Assess whether a skeptical buyer would trust ArchLucid after 10–20 minutes of clicking around.

Evaluate:
- absence of raw internal implementation details
- consistent pricing/billing
- coherent product language
- credible security/trust posture
- safe system health behavior
- polished support/access states
- honest demo limitations
- tenant isolation confidence
- AI budget transparency
- cloud neutrality
- no overclaiming
- no "prototype smell"

Classify trustworthiness risks as:
- trust-breaking
- confidence-reducing
- acceptable beta rough edge
- harmless

Explicitly name the top 10 trust breakers or trust reducers.

## UI Polish Score

Score 1–100.

Assess whether the UI feels like a buyer-ready SaaS product rather than a prototype or internal admin console.

Evaluate:
- visual hierarchy
- empty states
- CTA clarity
- tabs versus buttons
- spacing/typography
- page duplication
- page density
- navigation coherence
- consistency of button/link styling
- readiness of public/demo paths
- first-click clarity
- whether a buyer can understand each page without the founder explaining it

Classify UI issues as:
- launch blocker
- controlled-beta acceptable
- polish backlog
- cosmetic only

Explicitly name the top 10 UI polish problems most likely to hurt conversion.

---

# Existing Weighted Quality Model

Score each weighted quality from 1–100.

Weighted contribution = score × weight / 100  
Weighted deficiency signal = (100 − score) × weight  
(A) Headline Readiness = sum(score × weight) / 100

Weights total 100.

| # | Quality | Weight |
|---|---------|-------:|
| 1 | Decision-Changing Insight Density | 13 |
| 2 | Differentiability / Defensibility vs Frontier AI | 13 |
| 3 | Governed Review Integrity | 13 |
| 4 | Correctness and Evidence Integrity | 12 |
| 5 | AI / Agent Readiness | 10 |
| 6 | Time-to-Value | 10 |
| 7 | Proof-of-ROI Readiness | 9 |
| 8 | Sponsor / Operator Comprehension | 8 |
| 9 | Runtime and First-Review Reliability | 7 |
| 10 | Adoption Friction | 5 |

For each quality provide:
- Score
- Weight
- Weighted contribution
- Weighted deficiency signal
- Justification
- Tradeoffs
- Recommendations
- Classification: V1 / V1.1 / V2 / blocked on user input / market validation required
- Which outcome(s) it affects

---

# Additional Exposure-Readiness Categories

These do not necessarily feed the original (A) headline readiness unless you explicitly recommend adding an exposure-readiness score. They must be scored and used in the RYG assessment.

Score each 1–100:

1. Trustworthiness
2. UI Polish
3. Demo Safety
4. Public Pricing Coherence
5. In-App Billing Coherence
6. AI Cost-Control Readiness
7. Public Demo Reliability
8. Load / Traffic Readiness
9. Cloud Neutrality
10. Self-Service Trial Readiness
11. Request-Access / Auth Flow Readiness
12. Supportability
13. Security and Trust-Center Buyer Readiness
14. Help / Onboarding Clarity
15. Founder-Independent Comprehension
16. LinkedIn Screenshot / Video Readiness

For each:
- Score
- RYG
- Why it matters
- Top defects
- Minimum fix for controlled beta
- Minimum fix for public self-service
- Minimum fix for public mention

---

# Exposure Gate Model

Create a separate exposure gate scorecard.

## Controlled Beta Gate

PASS / FAIL / UNKNOWN for:

1. First review completes end to end.
2. Demo workspace can be explored safely.
3. No trust-breaking internal language on core beta paths.
4. Pricing does not need to be final, but buyer conversations are not contradicted by the UI.
5. AI spend is bounded by operator control, even if manually.
6. Founder can support users directly.
7. System health is either useful, hidden, or polished restricted-access.
8. Auth/access flow does not dead-end users.
9. Core architecture package flow is understandable.
10. No tenant isolation uncertainty on beta path.
11. Cloud connector page does not alienate non-Azure users.
12. Product can survive a guided 30-minute walkthrough.

Then rate controlled beta RED/YELLOW/GREEN.

## Public Self-Service Gate

PASS / FAIL / UNKNOWN for:

1. Public pricing and in-app billing use a single canonical model.
2. Single-user Architect plan or equivalent exists.
3. Trial signup and access request flow are clear.
4. AI budget limits are visible and enforced.
5. Public demo cannot create uncontrolled AI cost.
6. Public demo traffic is rate-limited and isolated.
7. Load test plan exists and has passed expected launch traffic.
8. System health is buyer-safe or hidden.
9. Billing page hides Stripe/internal details from normal users.
10. No raw IDs/API/debug language on buyer-accessible pages.
11. Core empty states are useful and not sparse/dead.
12. Help/onboarding is buyer-safe and task-oriented.
13. Cloud connectors are platform-neutral.
14. Support path is clear.
15. Product can be used without founder explanation.

Then rate public self-service RED/YELLOW/GREEN.

## LinkedIn / Public Mention Gate

PASS / FAIL / UNKNOWN for:

1. Landing/pricing page is not embarrassing or contradictory.
2. Public story is clear in one sentence.
3. Founder can show screenshots/video without exposing rough internal UI.
4. Request-access flow works.
5. Public claims do not outrun the product.
6. Demo path is controlled or clearly gated.
7. Pricing does not create IBM/Oracle-style friction.
8. One-license buyer path is at least conceptually clear.
9. System health/policy/billing/trust pages will not undermine credibility if clicked.
10. Founder has a clear CTA: request access, guided trial, or join beta.

Then rate LinkedIn/public mention RED/YELLOW/GREEN.

---

# V1 Ship Gate

Before long narrative, answer each PASS / FAIL / UNKNOWN with one-line evidence and fastest resolution path.

1. First review completes end to end: create → execute → commit → golden manifest + at least one artifact.
2. Representative review contains no hallucinated or uncited policy/evidence citations.
3. Sponsor summary / ROI output is coherent and not misleading.
4. Export/package generation works.
5. Architect workspace does not break during first-review / demo path.
6. Auth and tenant isolation behave correctly on the pilot path.

Any FAIL caps broad exposure readiness regardless of weighted score. UNKNOWN must name the fastest test to resolve.

---

# Probability Calibration

For every probability, state:
- reference class / base rate
- ArchLucid-specific positive adjustments
- ArchLucid-specific negative adjustments
- probability range, not point estimate
- confidence level

Required probabilities:
1. Controlled beta user completes first meaningful review.
2. 30-day voluntary reuse by a principal architect.
3. Sponsor sponsor agrees to paid pilot.
4. Buyer dismisses ArchLucid as "just a wrapper around frontier AI."
5. Buyer dismisses ArchLucid due to UI/prototype smell.
6. Buyer dismisses ArchLucid due to pricing complexity.
7. Buyer dismisses ArchLucid due to trust/security concerns.
8. Public self-service visitor converts to trial.
9. Public demo creates operational or cost incident.
10. ArchLucid remains differentiated against frontier AI over 12 months.

---

# Required Report Structure

Produce sections in this exact order.

## 0. Broader Exposure RYG Summary

Include the mandatory top-level table:

| Exposure path | RYG | Verdict | Why | Conditions to proceed |
|---|---|---|---|---|
| Controlled beta | ... | ... | ... | ... |
| Public self-service | ... | ... | ... | ... |
| LinkedIn / public mention | ... | ... | ... | ... |

Then provide:
- overall exposure recommendation
- safest next exposure move
- riskiest premature move
- one-sentence blunt verdict

## 1. Title and Scope

Title:
"ArchLucid Broader Exposure Assessment — Controlled Beta: X / Public Self-Service: Y / Public Mention: Z"

Include:
- timestamp
- engine used
- source materials inspected
- code or UI regions inspected
- limitations of assessment

## 2. All Scores Up Front

Include:
- (A) V1 headline readiness
- (B) procurement / market realism
- Trustworthiness score
- UI Polish score
- Demo Safety score
- Public Self-Service Readiness score
- LinkedIn/Public Mention Readiness score
- Controlled Beta Readiness score

## 3. Exposure Gate Scorecards

Three subsections:
- Controlled Beta Gate
- Public Self-Service Gate
- LinkedIn / Public Mention Gate

Each item PASS / FAIL / UNKNOWN with one-line evidence.

## 4. V1 Ship Gate

Use the six mandatory V1 ship gate items.

## 5. Weighted Quality Scorecard

Use the 10-category weighted model and compute headline readiness fresh.

## 6. Diagnostic Scores

Report:
- Decision Advantage Score
- Frontier-AI Survival Probability
- 30-Day Voluntary Usage Probability
- Sponsor Purchase Probability
- Dismissal probabilities

Reconcile any contradiction between diagnostic scores and headline readiness.

## 7. Trustworthiness Assessment

Score and explain.

Include:
- top 10 trust breakers / trust reducers
- which are controlled-beta acceptable
- which block public self-service
- fastest fixes
- whether trust posture supports regulated-enterprise evaluation

## 8. UI Polish Assessment

Score and explain.

Include:
- top 10 UI polish problems
- top 10 highest-leverage UI fixes
- pages/screens most likely to embarrass the product
- pages/screens that are acceptable now
- whether the UI feels founder-dependent

## 9. Pricing and Billing Coherence

Assess:
- public pricing
- in-app billing
- one-license Architect path
- Team / Professional / Enterprise packaging
- AI credits / usage model
- whether workspace plus seat pricing is confusing
- whether enterprise public pricing should be hidden
- whether pricing feels like M365/GitHub simplicity or IBM/Oracle friction

Give:
- pricing coherence score
- monetization risk
- recommended near-term pricing model
- what must be canonicalized before self-service

## 10. Demo, Trial, and AI Cost-Control Readiness

Assess:
- public demo exposure
- sample workspace safety
- AI budget visibility
- AI hard stops
- caching
- rate limits
- trial credits
- customer-owned AI provider option
- public demo abuse risk

Give:
- RYG
- top risks
- required guardrails before public traffic

## 11. Reliability and Load Exposure

Assess:
- expected traffic
- several thousand visitors/day scenario
- burst risk from LinkedIn
- demo isolation
- queue isolation
- background jobs
- observability
- load test readiness
- graceful degradation

Give:
- load readiness score
- minimum load test plan
- launch-blocking reliability gaps

## 12. Cloud Neutrality and Platform Advocacy

Assess whether ArchLucid appears Azure-first.

Evaluate:
- visual parity
- feature parity
- setup parity
- security checklist parity
- provider-specific detail pages
- ability to hide irrelevant platforms
- evidence-only first-class path

Give:
- platform-neutrality score
- most likely AWS/GCP buyer objection
- required fixes before broad exposure

## 13. Core Product Comprehension

Assess whether a principal architect understands:
- what ArchLucid is
- why it is not just AI chat
- how to start
- what an architecture package is
- what evidence produces
- how governance works
- what they get after 30 minutes

Give:
- founder-independent comprehension score
- top confusion points
- minimum copy/navigation fixes

## 14. Frontier-AI Competitive Analysis

Include:
- commodity versus durable table
- what frontier AI can already do
- what ArchLucid does that prompting cannot reliably reproduce
- what becomes commodity in 12 months
- what becomes more valuable as models improve
- whether ArchLucid is becoming more valuable faster than frontier AI is becoming capable

Answer directly:
Would a skilled principal architect believe ArchLucid is materially better than Claude/GPT/Gemini plus a good prompt and pasted company standards?

## 15. Principal Architect Dismissal Test

Persona:
45-year-old principal architect, daily frontier-AI user, cloud expert, skeptical, low patience for process, allergic to IBM/Oracle pricing complexity.

Answer:
- what makes them say "I need this"
- what makes them say "I can do this with Claude"
- what makes them click away
- whether pricing helps or hurts
- whether UI polish helps or hurts
- whether trust posture helps or hurts
- single most likely dismissal trigger

## 16. Founder Delusion Check

Be blunt.

Include:
- strongest assumptions with weakest evidence
- where founder taste is helping
- where founder caution is justified
- where founder caution could become avoidance
- most dangerous attractive distraction
- boring thing that is probably the real moat
- what should ship to controlled beta even if imperfect
- what must not ship publicly yet

## 17. Top Weaknesses Ranked

Rank top 10 weaknesses across:
- trust
- UI polish
- pricing
- billing
- demo safety
- AI cost
- reliability
- platform neutrality
- help/onboarding
- frontier-AI differentiation
- governance/evidence credibility

For each:
- why it matters
- RYG impact
- controlled beta impact
- public self-service impact
- public mention impact
- fastest credible fix
- classification: engineering / design / copy / pricing / reliability / market validation / founder decision

## 18. Exposure Plan

Recommend one of these plans:

A. Internal only
B. Controlled beta only
C. Controlled beta + private LinkedIn DM outreach
D. Controlled beta + public LinkedIn mention with request-access
E. Public demo read-only + controlled trial
F. Public self-service trial
G. Public self-service paid checkout

For the recommended plan:
- audience
- CTA
- guardrails
- pages that must be hidden/fixed
- AI budget rules
- support model
- metrics to watch
- kill criteria
- success criteria

## 19. Stop Doing List

Top 3:
- improvements not worth doing before controlled beta
- improvements not worth doing before public mention
- improvements not worth doing before self-service
- founder behaviors that could delay validation
- features that sound enterprise-important but will not move near-term adoption

## 20. Top Improvement Opportunities

5–15 items only. Stop when confidence drops.

Group:
- Tier 1 — Must Fix Before Controlled Beta
- Tier 2 — Must Fix Before Public Mention
- Tier 3 — Must Fix Before Public Self-Service
- Tier 4 — Defer

For each:
- title
- tier
- exposure level blocked
- why it matters
- affected scores
- evidence
- fastest fix
- owner: founder / Cursor / design / pricing / reliability / market validation
- recommended engine: Composer / Sonnet / Opus / Fable
- Cursor prompt if engineering/design-actionable
- Fable prompt if strategic/product-market-actionable

## 21. Prompt Batching Guidance

Provide:
- first batch
- second batch
- third batch

Prioritize:
1. trust-breaking UI defects
2. pricing/billing canonicalization
3. demo and AI cost controls
4. first-review reliability
5. cloud neutrality
6. onboarding/help clarity
7. review-package credibility
8. UI polish cleanup

Mark each:
- safe for Composer
- safe for Sonnet
- strong-model recommended
- Fable recommended

## 22. Final Verdict

Answer directly:

1. Should ArchLucid enter controlled beta?
2. Should ArchLucid allow public self-service?
3. Should the founder start mentioning ArchLucid on LinkedIn?
4. What is the single highest-leverage thing to fix next?
5. What is the single most dangerous premature exposure move?

End with one blunt sentence.

---

# Scoring Discipline

Do not inflate scores because the product is ambitious.

Do not penalize appropriately deferred enterprise items unless they affect the exposure path.

Do penalize:
- contradictory pricing
- internal artifacts in buyer UI
- broken or dead-end pages
- UI that needs founder explanation
- demo pages that make the product look unfinished
- uncontrolled AI cost exposure
- platform advocacy perception
- poor empty states on core pages
- auth/request-access friction
- system health or policy pages that undermine trust

A product can be functionally strong and still not public-self-service ready.

A product can be not self-service ready and still be controlled-beta ready.

A product can be controlled-beta ready and still not ready for a LinkedIn blast.

Be adversarial.
