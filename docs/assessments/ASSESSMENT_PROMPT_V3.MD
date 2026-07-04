> **Scope:** Evaluator — canonical strategic release and market readiness assessment prompt (v3). Use this prompt for clean-slate weighted readiness passes. Supersedes [`ASSESSMENT_PROMPT_V2.md`](ASSESSMENT_PROMPT_V2.md) (2026-07-03) after a v2 pass reproduced ~150 already-shipped `TECH_BACKLOG.md` entries as open §17 "Top Improvement Opportunities" and drifted the headline to a self-contradictory 100.00% via an invented cumulative "Rescore impact" ratchet. Product-state grounding aligns with `docs/library/V1_SCOPE.md` and `docs/library/V1_DEFERRED.md` as of 2026-07-03.

# ArchLucid Strategic Release and Market Readiness Assessment (v3)

Perform an independent, first-principles assessment of ArchLucid.

This assessment optimizes for five outcomes (ranked; earlier = more important):

1. **Decision-changing insight** — non-obvious, correct findings that change a decision a skilled architect using frontier AI alone would not have changed.
2. **Governed repeatability across an organization** — the same policy-aware, evidence-backed, auditable review package produced consistently by different operators, not heroics.
3. **30-Day Voluntary Usage Probability.**
4. **Executive Purchase Probability.**
5. **Long-Term Differentiation / Survivability Against Frontier AI.**

Do not optimize for feature completeness, engineering elegance, documentation volume, governance breadth, or platform maturity unless they materially improve the five outcomes above.

---

# Critical Perspective

The primary competitive threat is **not** another enterprise architecture platform. It is **frontier AI** (Claude, GPT, Gemini, and future systems) used directly by highly competent principal architects.

Evaluate ArchLucid against **both**:

1. Enterprise architecture / governance tools.
2. A skilled architect using frontier AI **without** ArchLucid.

Do not ask only: *"Can frontier AI produce a similar critique?"* Ask:

> Can a skilled architect using frontier AI alone reliably reproduce the same governed, policy-aware, evidence-backed, repeatable, auditable review package — with comparable consistency and organizational adoption?

---

# Core Differentiation Thesis

Assess ArchLucid as a **governed enterprise architecture review system**, not a generic AI architecture chatbot. Central hypothesis:

> ArchLucid uses frontier AI as an analysis engine, but makes that analysis enterprise-specific by grounding it in customer policy packs, internal standards, approved/prohibited patterns, evidence requirements, governance workflow, decision records, exception handling, and audit trail.

Generic AI architecture analysis is increasingly commoditized. Credit durable differentiation **only** where ArchLucid demonstrates: customer-specific policy awareness; findings mapped to standards/policy packs; evidence→finding→policy traceability; repeatable intake→package workflow; executive/operator role separation; decision and exception auditability; remediation/external-ticketing seams; governance-ready packaging that survives architecture, security, compliance, and executive review.

A finding is more valuable when it answers: What evidence produced it? Which standard/policy does it implicate? What decision should change? Who must act? What is the audit record? How is it tracked/remediated?

---

# Product State Grounding (verify, do not rediscover)

The following are **already implemented**. Assess whether they *materially change output and decisions* — do not score them low for being "absent," and do not propose improvements that recreate them.

**Governance / policy (the intended moat):** the bundled `PlatformDefault` policy packs (current count per `docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md`; versioned rule sets, scope assignments, effective governance resolution; manifest `bundled-policy-packs-v1.manifest.json`); pre-commit governance gate (`ArchLucid:Governance:PreCommitGateEnabled`) that blocks commit on severity thresholds; approval workflow with segregation of duties, SLA tracking, escalation; governance dashboard.

**Evidence / audit / traceability:** the typed append-only audit catalog with CSV export (current coverage per `docs/library/AUDIT_COVERAGE_MATRIX.md` and `docs/library/AUDIT_EVENT_MODEL.md`); citation contract (cost/savings lines from an uploaded cloud extractor ZIP must cite `manifest.json` `collectionTimestamp` + schema version); golden manifest + authority chain as the run-of-record.

**Executive packaging / ROI:** `GET /v1/roi/executive-summary` (latest committed run per system, finding dedup by stable `FindingId`, **disposition-aware** portfolio basis), dashboard panel, and a board-pack export delegating to the same service. Note: per-system rows intentionally do **not** sum to the disposition-aware headline.

**First-party connectors (V1 GA as of 2026-07-03):** `POST /v1/integrations/itsm/outbound/issues` (Jira + ServiceNow) → ticket from persisted Authority-shaped finding; persists `dbo.ItsmFindingCorrelations` (stable `FindingId`); per-tenant settings; durable audit events (`Integration.JiraIssueCreate*`, `Integration.ServiceNowIncidentCreate*`); Confluence Cloud page-publish; Slack and Microsoft Teams incoming-webhook notifications. All five ship **Shipped** / **Shipped + manual vendor** per `docs/library/CONNECTOR_READINESS_MATRIX.md` — see `V1_SCOPE.md` §2.13–§2.15 and `V1_DEFERRED.md` §6/§6a for the promotion record and **TB-599–TB-602** for remaining tightening work (native-create default posture, OAuth upgrade, live-validation parity, buyer-copy sweep).

**Multi-cloud target analysis (V1 GA as of 2026-07-03):** Azure, AWS, and GCP extractor/polling paths all ship at parity per `docs/library/MULTI_CLOUD_ANALYSIS_V1_1.md` (all four phases shipped on master). Do not describe AWS/GCP as a pending V1.1 commitment; residual gap is Cost-agent structured retail-price grounding for AWS/GCP (**TB-603**), not extraction/ingestion.

**RAG-V2 items (pulled forward to V1 scope, per `V1_DEFERRED.md` §6q):** Graph-RAG neighbor expansion (`GraphRagNeighborExpander` + `GraphRagBoundedNeighborCollector`, **bounded multi-hop** with cycle-safe BFS and configurable hop budget — **TB-597 closed 2026-07-03**; community summarization still deferred), single-pass query expansion (`AgenticRetrievalCompletionClient`, one LLM completion each for query rewrite + HyDE + managed semantic rerank — **TB-598 closed 2026-07-04**; not iterative retrieve-critique-retry), and online fine-tuning (manifest foundation shipped **TB-594**; full loop is a further build-out). Do not describe these as unqualified "production-grade" without noting the depth caveats; see **TB-595**/**TB-596** for the ablation-harness and posture-audit gaps.

**AI substrate:** real mode uses **platform-provisioned Azure OpenAI** (hosted SaaS); **simulator mode** gives deterministic execution/CI; orchestration (`AuthorityRunOrchestrator`) lives in `ArchLucid.Application` (the prior "orchestrator-in-Persistence" issue is **remediated** — do not re-flag); retrieval ships (`ArchLucid.Retrieval`, `AskService`, ADR 0004 outbox); RAG-V1 quality foundation is **closed** (**TB-021**, closeout audit 2026-07-03, all 12 `RAG-V1-000`–`RAG-V1-011` sub-items verified shipped) — residual items are **TB-603**/**TB-604**, not a missing surface.

Source of truth: `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, `docs/go-to-market/TRUST_CENTER.md`, `.cursor/rules/Assessment-Scope-V1_1.mdc`.

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
* **File-size discipline.** The rolling pass file should read as a current-state assessment, not an accumulated changelog. If §17 or the executive summary starts enumerating dozens of historical ticket IDs, that is a signal the verify-before-listing gate was skipped — stop and re-apply it.

---

# Source Materials (read list — orient here first)

Read in this order (per `docs/library/ASSESSMENT_INPUTS.md`) before grepping broadly:

1. `docs/library/REPO_DIGEST.md` — surface skim
2. `docs/library/V1_SCOPE.md` — in-contract V1 / V1.1 boundaries
3. `docs/library/V1_DEFERRED.md` — explicit deferrals
4. `docs/go-to-market/TRUST_CENTER.md` — trust / buyer commitments
5. `docs/security/SOC2_SELF_ASSESSMENT_2026.md` + `docs/go-to-market/SOC2_ROADMAP.md` — SOC posture (CPA gap is `(B)` only)
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
| 8 | Executive / Operator Comprehension (cognitive load) | 8 |
| 9 | Runtime & First-Review Reliability | 7 |
| 10 | Adoption Friction | 5 |

For each quality provide: Score · Weight · Weighted contribution · Weighted deficiency signal · Justification · Tradeoffs · Recommendations · Classification (V1 / V1.1 / V2 / blocked on user input / market validation required). For each, note which outcome(s) it affects.

## Category interpretation

* **Decision-Changing Insight Density** — non-obvious, correct findings a skilled architect using frontier AI would miss, dismiss, fail to operationalize, or fail to package into governance. Do not credit articulate-but-generic output.
* **Differentiability / Defensibility** — use the rubric below. Credit only governed, policy-aware, evidence-backed, repeatable review infrastructure, not critique eloquence. This category **is** the Defensibility score; do not produce a separate orphan defensibility number.
* **Governed Review Integrity** — does *changing a policy pack* change findings, priorities, recommendations, decisions, executive reporting, and the pre-commit gate outcome, with full traceability and audit reconstruction?
* **Correctness & Evidence Integrity** — coherent states; preserved review/session/workspace identity; **no hallucinated or uncited policy/evidence claims**; no false confidence.
* **AI / Agent Readiness** — grounded, inspectable, repeatable, policy-aware, safe; account for real-Azure-OpenAI vs simulator separation, Application-layer orchestration, and RAG-V2 depth caveats (Graph-RAG bounded multi-hop per **TB-597**; single-pass query expansion per **TB-598** — not iterative agentic retrieval). "Uses AI" ≠ "AI-ready."
* **Time-to-Value** — speed to a credible review package or "I did not think of that" moment.
* **Proof-of-ROI Readiness** — credibility (not mere presence) of the ROI story: `GET /v1/roi/executive-summary` + board-pack export, cost evidence, savings basis labels, disposition-aware totals, and (for AWS/GCP) whether cost findings carry structured retail-price grounding or only illustrative framing (**TB-603**).
* **Executive / Operator Comprehension** — understandable to architects, operators, executives, and governance stakeholders without excessive explanation.
* **Runtime & First-Review Reliability** — does first review generation, commit, manifest, and export work reliably end to end? (UI breakage is also a **ship gate** below.)
* **Adoption Friction** — effort to configure identity, ingest evidence, run the pilot path, validate security, and fit existing operations; account for `Integrations:Itsm:NativeEnabled` defaulting `false` out of the box (**TB-599**).

## Differentiability Rubric

* **Low:** generic advice frontier AI could produce from a good prompt.
* **Medium:** structured findings/packages, but policy awareness, evidence traceability, and governance workflow are limited/unclear.
* **High:** findings mapped to policy packs, standards, evidence, recommendations, decisions, and review workflow a generic AI session would not consistently reproduce.
* **Excellent:** changing policy packs/standards demonstrably changes findings, priorities, executive reporting, review decisions, and audit trail — traceably and defensibly.

## Probability calibration (mandatory for every probability)

For each probability (ship gate confidence, 30-day usage, executive purchase, dismissal, frontier-AI survival): state the **reference class / base rate**, then adjust for ArchLucid-specific evidence, then give a **range** (not a point estimate) and your confidence. Unanchored "vibes" probabilities are not acceptable.

---

# V1 Ship Gate (binary; overrides the score)

Before any narrative, answer each **PASS / FAIL / UNKNOWN** with one-line evidence. Any FAIL caps headline readiness regardless of the weighted score; any UNKNOWN names the fastest test to resolve it.

1. First review completes end to end: create → execute → commit → golden manifest + ≥1 artifact.
2. Representative review contains **no hallucinated or uncited** policy/evidence citations.
3. Executive summary / ROI output is coherent and not misleading (incl. the per-system-vs-headline ROI labeling).
4. Export/package generation works (Markdown / DOCX / ZIP).
5. Operator UI does not break during the first-review / demo path.
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
| Recommended engine | Name one of **Composer**, **Sonnet**, **Opus**, or **Fable** (or "N/A — human only") with a one-line cost/effectiveness rationale. Default to **Sonnet** for most drafting/scripting work given its current reduced price makes it the best cost/effectiveness tradeoff; reserve **Opus** for high-stakes strategic framing (e.g. procurement objection rehearsal scripts, executive-facing narrative) where reasoning depth materially changes outcome; reserve **Composer** for fast, low-stakes, high-volume mechanical drafts; reserve **Fable** only if the task is narrative/creative-writing-shaped (e.g. a case-study story) rather than technical or analytical. |

## 1. Title & Headline
`ArchLucid Assessment – (A) Headline Readiness: XX.XX%`. State: readiness excludes deferred items; reasoning engine used (real Azure OpenAI vs simulator if relevant); timestamp; source materials inspected.

## 2. Scorecard
Single table of all 10 weighted qualities (score, weight, weighted contribution, weighted deficiency signal) + the computed `(A)` headline %. No prose scores elsewhere.

## 3. Diagnostic Scores (non-headline — must be reconciled with §2)
Report and explicitly state these do **not** feed the headline, then reconcile any tension with it:
* Decision Advantage Score (1–100) — likelihood ArchLucid changes a decision frontier AI alone would not.
* Frontier-AI Survival Probability (12-month) — with calibration.
* 30-Day Voluntary Usage Probability and Executive Purchase Probability — with calibration.
If any diagnostic score sharply contradicts the headline (e.g. low defensibility vs high headline), say so and explain.

## 4. V1 Ship Gate
The six PASS/FAIL/UNKNOWN items above, each with evidence and (for FAIL/UNKNOWN) the fastest resolution path.

## 5. Executive Summary
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
* **Final verdict:** Is ArchLucid becoming more valuable faster than frontier AI is becoming capable? Defend, explicitly addressing: generic-analysis commoditization, customer-specific policy packs, internal-standards awareness, evidence traceability, audit-ready packages, executive/operator workflow, decision advantage, voluntary reuse.

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
* **Executive Purchase**: strongest driver/blocker; minimum proof for a paid pilot; likely objection. Answer directly — **why buy ArchLucid instead of more frontier-AI licenses?** — addressing governance, policy packs, evidence traceability, audit trail, repeatability, decision workflow, executive reporting.
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

**Validation-first ordering (mandatory).** When all six V1 ship gates PASS and no in-contract V1/V1.1 engineering gate is open, this section MUST **lead with market-validation work** — pilot design, buyer-interview scripts, proof-packet cohort (TB-141/142), and the cheapest experiment that would move 30-Day Voluntary Usage or Executive Purchase probability — before any engineering item. Any **new** engineering proposal in this state must justify itself explicitly against the five ranked outcomes (and name which one it moves); "completeness," "polish," or "elegance" are not acceptable justifications. Prefer recommending **zero** new engineering items over manufacturing low-confidence ones.

Group into **Tier 1 – Must Fix**, **Tier 2 – High Leverage**, **Tier 3 – Hold For Reassessment**. For each: Title · Tier · Why it matters · Expected impact · Affected qualities · Evidence · Actionability · Design Uncertainty Reduced (1–10) · Market Uncertainty Reduced (1–10) · Classification (V1 / V1.1 / V2 / validation first / blocked on user input). Items whose dominant lever is **Market Uncertainty Reduced** must be expressed as validation plans, not Cursor prompts.
For actionable V1/V1.1 **engineering** items, generate complete **Cursor prompts** including: current problem, desired behavior, scope boundaries, acceptance criteria, tests to add/update, non-goals.

## 18. Prompt Batching Guidance
First / Second / Third batch. Prioritize: (1) reliability of first review generation; (2) clarity of guided intake; (3) evidence/policy traceability; (4) review-package credibility; (5) demo reliability; (6) executive/operator comprehension. Mark each batch safe-for-Composer / safe-for-Sonnet / strong-model-recommended.

## 19. Model Usage Guidance
Composer-safe / Sonnet-safe / strong-model-recommended / Opus-or-Gemini-assessment-recommended. Strong models for: strategic assessment, policy-aware moat evaluation, refactors affecting review generation, security/auth/workspace routing, evidence-graph semantics, cross-document guidance. Cheaper models for: copy cleanup, UI polish, snapshot updates, minor component refactors, straightforward routing fixes. Note Sonnet 5's current reduced price when recommending it over Opus for tasks where reasoning depth is not the limiting factor.

## 20. Pending Questions For Later (only truly blocking)
Separate: blocks V1 / blocks V1.1 / requires customer validation / requires founder decision.

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

Separately from the weighted score, assess whether the product demonstrates serious principal-architect judgment, product taste, enterprise realism, governance awareness, and practical credibility. **This is explicitly excluded from `(A)` headline readiness** (it measures author signal, not market readiness, and weighting it would reward impressive complexity against the stated optimization targets). Report it as a short qualitative paragraph only. Do not overvalue feature quantity.

---

# Final Instruction

Optimize for the five outcomes in priority order. For survivability, credit primarily customer-specific policy awareness, governed workflow, evidence traceability, review packaging, decision auditability, repeatable organizational adoption, executive/operator separation, and remediation seams — **not** generic critique quality unless tied to policy packs, standards, evidence, governance, or decision workflow. If these conflict with feature completeness, governance breadth, documentation volume, elegance, or polish, prioritize the five outcomes.

Central question — answer it directly:

> Does ArchLucid turn frontier AI into a governed, policy-aware, audit-ready enterprise architecture review system that changes decisions and earns repeat use?
