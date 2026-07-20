> **Scope:** Internal GTM execution backlog for V1 marketing activities — task owners, priorities, milestones, and technical dependencies; not a buyer-facing document. For weighted readiness **workflow**, see **[`docs/library/ASSESSMENT_INPUTS.md`](../library/ASSESSMENT_INPUTS.md)** (rolling summary under **`docs/assessments/`**). This file is **not** a scorecard.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# ArchLucid GTM Backlog

**Audience:** Founder and any marketing/GTM collaborators. Engineering reads this to understand which marketing tasks create or depend on technical work.

**How this file relates to engineering work:**
- **Technical tasks** (engineering, product) live in the issue tracker, **[`docs/PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)**, **[`docs/library/NEXT_REFACTORINGS.md`](../library/NEXT_REFACTORINGS.md)**, and related runbooks — and may be summarized in the rolling assessment under **`docs/assessments/`** per **`ASSESSMENT_INPUTS.md`**.
- **Marketing tasks** (content, copy, outreach, business) live **here**. They do not **replace** **`(A)` / `(B)`** scoring rules in **`.cursor/rules/Assessment-Scope-V1_1.mdc`**.
- The **"Depends on"** column links marketing tasks to **legacy engineering batch labels** (historical sprint numbering) where a marketing activity cannot start or complete until engineering delivers.

**Priority definitions:**
- **P0** — Blocks GA launch or must complete in days 1–15 (demo and messaging foundation)
- **P1** — Complete in days 16–30 (public credibility layer)
- **P2** — Complete in days 31–60 (early conversations)
- **P3** — Complete in days 61–90 (monetization)
- **V1.1 / V2** — Explicitly deferred; do not pull forward

**Status values:** `Not started` · `In progress` · `Blocked` · `Done`

---

## Effort summary chart (owner-calibrated)

**Estimator profile (2026-07-19):** PhD computer scientist, ~35 years hands-on engineering, expert developer, Azure expert, very fast technical writer. Estimates are **your active hands-on time** (not calendar span). External waits (buyer replies, auditor/vendor slots, CPA fieldwork, pilot scheduling) are called out separately and **not** folded into the hour figures.

**Conventions:** `h` = hours · `m` = minutes · aliases (same work as another row) are marked and **excluded from rollup totals** · Done rows omitted · `Done (draft)` LinkedIn pieces count **publish-only** remaining effort.

### Rollup (open + in progress, unique work only)

| Band | Open rows (unique) | Est. hands-on |
|------|--------------------:|---------------|
| **P0** | 14 | **~23–39 h** (includes Quick Scan safety GTM **M-109**/**M-110**/**G-QA-05**; **G-REAL-04**/**M-06** Done 2026-07-19) |
| **P1** | 58 | **~98–148 h** (≈ half is LinkedIn long-form draft+publish) |
| **P2** | 13 | **~18–30 h** (+ demo/outreach calendar; incl. **M-111** demo-honesty footnote) |
| **P3** | 4 | **~6–10 h** (+ paid-engagement calendar) |
| **V1.1 / V2** | 18 | **~40–70 h** kickoff/execution slices (+ multi-week/month external calendars) |
| **Total unique open** | ~104 | **~183–291 h** active; calendar for cohorts/assurance/commerce dominates wall-clock |

---

### Engineering-adjacent (G-*)

| ID | Title | Priority | Est. (hands-on) |
|----|-------|----------|-----------------|
| G-REAL-06 | Three committed real-mode pilot runs (Run 1–3) | P0 | **4–6 h** active (wall ~1–2 days with LLM/pipeline wait) |
| G-REAL-07 | Collect proof packets + append `PROOF_PACKET_RUN_LOG` | P0 | **2–3 h** |
| G-COMMERCE-01 | Invoice/SOW commercial readiness (tax, entity, payment methods) | P0 | **2–4 h** (+ jurisdiction registration calendar if new) |
| G-COMMERCE-02 | Close first paid engagement on invoice/SOW path | P0 | **2–4 h** prep/send (+ buyer close calendar) |
| G-REAL-08 | Attach gate JSON to next RC evidence bundle | P1 | **30–45 m** (on RC cut) |
| G-FAITH-01 | Flip `ARCHLUCID_FAITHFULNESS_NIGHTLY_ENFORCE=true` | P1 | **15 m** (after ≥5 green nightlies exist) |
| G-QA-01 | Pick `ACCEPTANCE_BASE_URL` + auth method | P1 | **30–45 m** |
| G-QA-02 | Controlled-beta acceptance checklist per cut | P1 | **1–1.5 h** / cut |
| G-QA-03 | 15–30 min unscripted buyer-like session | P1 | **20–30 m** / session |
| G-QA-04 | Add `/showcase/claims-intake-modernization` to controlled-beta acceptance checklist | P1 | **30–45 m** (after **TB-887**/**TB-888**) |
| G-QA-05 | Quick Scan public-safety gate on controlled-beta checklist (**TB-902**) | P0 | **30–45 m** (after **TB-902** report) |
| G-REAL-05 | CPA SOC 2 program kickoff | V1.1 | **8–16 h** kickoff/RFP; **months** auditor calendar |
| G-ASSURANCE-02 | Third-party pen-test program (vendor SoW + redacted summary) | V1.1 | **4–8 h** vendor select/SoW; **weeks** test calendar |
| G-CONTENT-01 | Enrich remaining 20 bundled policy packs (+5 rules each) | V1.1 | **20–30 h** (≈1–1.5 h/pack for this profile) |

---

### V1 marketing — demo, credibility, conversations, monetization

| ID | Title | Priority | Est. (hands-on) |
|----|-------|----------|-----------------|
| M-07 | Capture 6–8 polished operator-workflow screenshots | P0 | **1.5–2.5 h** |
| M-39 | Apply proof-packet operating checklist; ≥3 G4 rows | P0 | **1 h** process (overlaps **G-REAL-06/07**) |
| M-94 | Invoice/SOW commercial readiness | P0 | **2–4 h** (alias **G-COMMERCE-01**) |
| M-95 | Close first paid engagement on invoice/SOW path | P0 | **2–4 h** (alias **G-COMMERCE-02**) |
| M-09 | Landing page — owner sign-off + C8 use-case-card routing fix + screenshots + deploy | P1 | **1–2 h** remaining |
| M-93 | ArchLucid-on-ArchLucid dogfood pilot + citable live sample | P1 | **4–8 h** (run + redact + publish) |
| M-10 | LinkedIn post: diagrams are not evidence | P1 | **20–30 m** |
| M-11 | LinkedIn post: decisions need provenance | P1 | **20–30 m** |
| M-12 | LinkedIn post: AI review needs human signoff | P1 | **20–30 m** |
| M-13 | LinkedIn post: evidence graph as next artifact | P1 | **20–30 m** |
| M-14 | LinkedIn post: regulated reviewable records | P1 | **20–30 m** |
| M-16 | Short demo video (Workspace A screen recording) | P1 | **2–3 h** (record + light edit; after **M-07**) |
| M-38 | 3-session first-session dismissal cohort + synthesis | P1 | **6–8 h** sessions/synth (+ recruit calendar) |
| M-40 | Maintain frontier-AI bakeoff scoreboard (monthly cadence) | P1 | **45–60 m** / month |
| M-41 | 6-week second-review habit-loop cohort (3 accounts) | P1 | **2–3 h** / week × 6 (+ account calendar) |
| M-42 | 3-session model-seats counter-positioning message test | P1 | **4–6 h** (+ recruit) |
| M-35 | Author ARC-AMPE policy pack #24 (CMS ACA / Medicaid) | P1 | **4–6 h** |
| M-111 | Demo-script footnote: Workspace B = seed-backed storyline (C4 honesty) | P2 | **20–30 m** |
| M-17 | Build outreach list (20 architects / CTOs / security leaders) | P2 | **1–1.5 h** |
| M-18 | Personalize + send 20 outreach messages | P2 | **2–3 h** (template Done) |
| M-19 | Run 5–10 live demos (Workspace A/B) | P2 | **5–10 h** |
| M-20 | Track objections; refine positioning + demo script | P2 | **1 h** |
| M-21 | Identify strongest buyer segment from demo feedback | P2 | **30 m** |
| M-34 | Align SOWs / order form / talk track to named SKUs | P2 | **1–1.5 h** |
| M-24 | Upwork listing: AI Architecture Governance Review | P2 | **45–90 m** |
| M-25 | Upwork listing: Azure Architecture Readiness Review | P2 | **45–90 m** |
| M-26 | Upwork listing: Architecture Decision Record Cleanup | P2 | **45–90 m** |
| M-27 | Run ≥1 Upwork engagement (ArchLucid as internal tool) | P2 | **4–8 h** delivery slice (+ marketplace calendar) |
| M-22 | Draft paid pilot offer Option A (review package) | P3 | **1.5–2 h** |
| M-23 | Draft paid pilot offer Option B (30–60 day pilot) | P3 | **1.5–2 h** |
| M-36 | Run ≥1 paid pilot | P3 | **8–16 h** delivery slice (+ pilot calendar) |
| M-28 | Request testimonial from early user / pilot | P3 | **20–30 m** (+ wait) |

---

### LinkedIn long-form articles (P1)

**Draft+publish (Not started):** ~**1.5–2.5 h** draft + **15–25 m** publish each — this profile.  
**Publish only (`Done (draft)`):** ~**15–25 m** each.

| ID | Title | Priority | Est. (hands-on) |
|----|-------|----------|-----------------|
| M-51 | CI Watchers | P1 | **1.75–2.75 h** |
| M-52 | Codex vs. Gemini vs. GPT | P1 | **1.75–2.75 h** |
| M-53 | Composer vs. Sonnet vs. Opus | P1 | **1.75–2.75 h** |
| M-54 | Wiring up GitHub | P1 | **1.75–2.75 h** |
| M-55 | My Funny Icon Story | P1 | **1.75–2.75 h** |
| M-56 | Cleaning Up after Cursor | P1 | **1.75–2.75 h** |
| M-57 | Fighting Threads | P1 | **1.75–2.75 h** |
| M-58 | I am Tired of Committing a Pushing | P1 | **1.75–2.75 h** |
| M-59 | Death by a Thousand Cuts | P1 | **1.75–2.75 h** |
| M-60 | Calling Out the Guard | P1 | **1.75–2.75 h** |
| M-61 | Overengineering | P1 | **1.75–2.75 h** |
| M-62 | Engine Battle | P1 | **1.75–2.75 h** |
| M-63 | Not Code? Don't User Cursor | P1 | **1.75–2.75 h** |
| M-64 | Some Engines are Better Architects than Others | P1 | **1.75–2.75 h** |
| M-65 | Weighting You Own Inference | P1 | **1.75–2.75 h** |
| M-66 | Go Ask Sonnet | P1 | **1.75–2.75 h** |
| M-67 | Product Management and Engines | P1 | **1.75–2.75 h** |
| M-68 | Markdown Files as Silver Bullets | P1 | **1.75–2.75 h** |
| M-69 | Watch Out for ORMs | P1 | **1.75–2.75 h** |
| M-70 | 200 or Nothing | P1 | **1.75–2.75 h** |
| M-71 | Composer is Just a Composer | P1 | **1.75–2.75 h** |
| M-72 | Best Debugger Ever | P1 | **1.75–2.75 h** |
| M-73 | Some Things are Better with Opus | P1 | **1.75–2.75 h** |
| M-74 | Abstractions: Architecture vs. Reviews | P1 | **1.75–2.75 h** |
| M-75 | Dependabot | P1 | **1.75–2.75 h** |
| M-76 | k6 | P1 | **1.75–2.75 h** |
| M-77 | Capturing Screenshots | P1 | **15–25 m** (publish; draft Done) |
| M-78 | Text System Complexity | P1 | **15–25 m** (publish; draft Done) |
| M-79 | Convex Optimization? | P1 | **15–25 m** (publish; draft Done) |
| M-80 | I Miss Fable | P1 | **15–25 m** (publish; draft Done) |
| M-81 | One Thing at a Time | P1 | **15–25 m** (publish; draft Done) |
| M-82 | UI Development | P1 | **15–25 m** (publish; draft Done) |
| M-83 | Dirty Secrets | P1 | **15–25 m** (publish; draft Done) |
| M-84 | Adventures in Space! | P1 | **15–25 m** (publish; draft Done) |
| M-85 | Can't Good Good Help | P1 | **15–25 m** (publish; draft Done) |
| M-86 | Big Words Hurt My Head | P1 | **15–25 m** (publish; draft Done) |
| M-87 | Architecture Decision Records | P1 | **15–25 m** (publish; draft Done) |
| M-88 | Checking in Broken Code | P1 | **15–25 m** (publish; draft Done) |
| M-89 | Gemini Takes the Initiative, but not in a Good Way | P1 | **1.75–2.75 h** |

**LinkedIn batch subtotal (unique):** ~**50–75 h** draft+publish for Not started · ~**3–5 h** publish-only for `Done (draft)`.

---

### Founder UI quality acceptance (M-96–M-106)

| ID | Title | Priority | Est. (hands-on) |
|----|-------|----------|-----------------|
| M-96 | Target-site harness (`ACCEPTANCE_BASE_URL` + auth) | P1 | **2–3 h** |
| M-97 | Tag founder suite (~20–40 specs) | P1 | **3–5 h** |
| M-98 | npm scripts for founder runs | P1 | **1–1.5 h** |
| M-99 | Remote Lighthouse against chosen site | P1 | **2–3 h** |
| M-100 | Gradual manual→automated absorption process | P1 | **30 m** / absorbed check (ongoing) |
| M-101 | Controlled-beta acceptance checklist + defect log | P1 | **1–1.5 h** |
| M-102 | Unscripted exploratory cadence (institutionalize) | P1 | **30–45 m** to document; then **G-QA-03** cadence |
| M-104 | Console + failed-network automation on founder routes | P1 | **2–3 h** |
| M-105 | axe a11y on founder routes against chosen URL | P1 | **1.5–2 h** |
| M-106 | First full dry-run + baseline metrics | P1 | **2–3 h** |
| M-107 | Owner IA decision — canonical public proof funnel (showcase vs `/see-it` vs `/demo/preview`) | P1 | **45–90 m** decision + doc update |
| M-108 | Capture showcase screenshots for **M-07** / **M-16** / paid (after **TB-887**/**TB-888**) | P1 | **30–45 m** (subset of **M-07** gallery) |
| M-109 | Quick Scan sample-result content + capacity-state copy review | P0 | **1–2 h** (pairs **TB-900**) |
| M-110 | Owner decision — enable anonymous Quick Scan AI publicly (after **TB-902**) | P0 | **30–60 m** decision |
| M-103 | Optional scheduled / pre-release founder CI job | P2 | **2–3 h** |

---

### V1.1 / V2 (deferred — do not pull forward)

| ID | Title | Priority | Est. (hands-on) |
|----|-------|----------|-----------------|
| M-29 | LinkedIn post: ServiceNow integration | V1.1 | **30–45 m** (when connector ships) |
| M-30 | CAF / Azure LZ use-case claim with pack disclaimer | V1 GA | **45–90 m** copy polish |
| M-32 | Reference customer / design-partner case study | V1.1 | **4–8 h** write (+ clearance calendar) |
| M-37 | Real decision-delta cohort (10 paid pilots) + proof packets | V1.1 | **2–4 h** / pilot packet discipline; **months** cohort calendar |
| M-43 | Real principal-architect frontier-AI bakeoff sessions | V1.1 | **3–4 h** / session (+ recruit) |
| M-44 | Real 3-session first-session dismissal cohort + interviews | V1.1 | **10–16 h** sessions/logs/synth (+ recruit) |
| M-45 | Real decision-delta interviews within 7 days of handoffs | V1.1 | **1–1.5 h** / handoff |
| M-46 | Apply Product Decision Gate to real M-44 cohort | V1.1 | **2–3 h** |
| M-47 | Sponsor export discovery test (real first-timers) | V1.1 | **3–5 h** (+ participants) |
| M-48 | Founder-narration dependency ledger during M-44 | V1.1 | **1–2 h** overlay on M-44 sessions |
| M-49 | Populate real-mode faithfulness rollup (≥3 runs) | V1.1 | **2–3 h** (after **G-REAL-06**) |
| M-50 | Blind decision-delta cohort (≥3–5 sessions) | V1.1 | **12–20 h** (+ recruit/blind protocol) |
| M-90 | 90-minute first-review dry-run cohort (≥3 operators) | V1.1 | **6–9 h** (+ schedule) |
| M-91 | Red-team procurement objection rehearsal | V1.1 | **3–5 h** (+ reviewer calendar) |
| M-92 | ITSM pilot-readiness test (first two pilots) | V1.1 | **2–4 h** / pilot |
| M-31 | Solo-architect self-serve SaaS pricing page + public checkout CTA | V2 | **6–12 h** when un-gated |
| M-33 | Cross-tenant portfolio ROI analytics marketing claim | V2 | **1–2 h** copy (after product ships) |

**Suggested near-term focus (highest leverage / hour for this profile):** **G-REAL-06 → G-REAL-07** (unlocks Stage 1) · **G-COMMERCE-01 → M-34 → G-COMMERCE-02** (first invoice path) · **M-07 → M-16 → M-09** (credibility assets) · **G-QA-01 → M-96–M-98** (founder acceptance loop).

---

## Service-led GTM baseline (planning)

**Captured 2026-05-17** — complements in-repo technical scope (**[`V1_SCOPE.md`](../library/V1_SCOPE.md)**, **`V1_DEFERRED.md`**, engineering backlog).

- **Wedge:** Sell a **buyable architecture review outcome** (evidence-backed report), not “complete platform” breadth on first touch. V1 product scope stays **`V1_SCOPE.md`**; GTM copy and SOWs lead with **pain → outcome → report**.
- **Named SKUs:** Canonical menu and indicative bands live in **[`SERVICE_LED_OFFERS.md`](SERVICE_LED_OFFERS.md)**. Upwork listings (M-24–M-26) and pilot drafts (M-22–M-23) should use those **names** and deliverables.
- **ICP (first revenue):** Mid-market CTO, fractional CTO, cloud consultant, regulated startup — faster cycle than Fortune 50 unless a sponsor already exists.
- **Commerce un-hold:** **Stripe live-key flip** remains owner-gated per **`V1_DEFERRED.md` §6b** (calendar alone does not force it — validate **repeatable purchasing motion** first). **Azure Marketplace** listing is **deferred to V2** (owner 2026-07-12), not a V1.1 obligation.
- **V2 roadmap:** Platform items in **`V1_DEFERRED.md`** (e.g. cross-tenant analytics, Redis baselines) stay **candidates** until paid engagements show which buyers actually pay for them.

---

## Proof-gated rollout criteria

**Captured 2026-05-29.** This section defines **when ArchLucid is safe to sell harder and broaden**, expanding on the service-led baseline's "demand signal before broader motion" stance and the **Most Important Truth** in **[`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md)**: *the product is pilot-ready, not oversell-ready.*

### What "oversell-ready" means (and what it does not)

- **It is not calendar- or headcount-gated.** Broadening does **not** trigger because *N* weeks passed or *N* clients signed.
- **It is proof-gated.** The trigger is **proof density**: each real run reliably produces **buyer-verifiable, mode-labeled, source-cited evidence**, and the open isolation/security gaps that would make a claim false are closed.
- **The risk being managed** is a **credibility failure** — a buyer or their security reviewer catching a claim (real AI, guaranteed savings, full isolation, SOC posture) that the handed-over artifacts do **not** support. In enterprise selling the first such miss is often fatal.

| Common (wrong) framing | Proof-gated framing |
|---|---|
| Roll out gradually; expand when "stable" | Pilot aggressively now; expand **claims + scale** once runs reliably produce verifiable proof |
| Trigger = clients or time elapsed | Trigger = proof density (real-mode runs + ROI sourcing + isolation closure) |
| Risk = system cannot handle load | Risk = a buyer catches a claim the artifacts cannot support |

### Rollout stages and gates

Each stage **unlocks** broader claims/motion only when its **exit gate** is met. Do not skip stages.

| Stage | Motion allowed | Exit gate (all must hold) |
|---|---|---|
| **0 — Controlled pilots (now)** | Founder-led pilots; demos clearly labeled (simulator allowed if labeled); no quantified public claims | Pilot path runs end-to-end; `pilot proof-packet` generates for a committed run; **`WHAT_NOT_TO_PROMISE.md`** in active use |

**Market validation protocols (2026-06-17):** [`../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md`](../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md) (five-step bakeoff runbook) · [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) · [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md) · [`FRONTIER_AI_BAKEOFF_EVIDENCE_PACK.md`](FRONTIER_AI_BAKEOFF_EVIDENCE_PACK.md) · [`DECISION_DELTA_INTERVIEW.md`](DECISION_DELTA_INTERVIEW.md) · [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md) (3-session dismissal cohort — **Done 2026-06-17**) · real-mode cohort [`../runbooks/REAL_MODE_EVIDENCE_COHORT.md`](../runbooks/REAL_MODE_EVIDENCE_COHORT.md)
| **1 — Evidence-backed selling** | Quote-to-cash on **real-mode** reviews; share ROI with source labels; reference run evidence in sales | **G1–G4** below all green for **≥3 distinct real pilot runs** |
| **2 — Broad GTM / scale claims** | Public quantified claims (with permission), heavier outbound, multi-tenant scale messaging | **G1–G6** all green; ≥1 published/permissioned reference (deferred — owner) |

### Gate signals (G1–G6)

Treat each as **PASS / HOLD**. A single HOLD on G1–G4 blocks Stage 1; a HOLD on G5–G6 blocks Stage 2.

- **G1 — Execution-mode honesty.** Every sponsor-facing artifact (UI run detail, first-value report, PDF/DOCX, proof-packet) labels `Real / Simulator / Fallback / Mixed`, and a PilotStrict HOLD prevents sponsor-safe forwarding. *Depends on engineering: run-detail fidelity (TB-106–108), proof-packet PilotStrict HOLD (assessment Imp. 21).*
- **G2 — ROI source integrity.** No dollar/time claim leaves the building without a `RoiMetricSourceKind` (`CustomerProvided` vs `BenchmarkAssumption` vs `NotEstimated`). *Depends on: ROI table in proof-packet (assessment Imp. 8).*
- **G3 — Tenant isolation provable.** **Azure AI Search is required on all production-like profiles** (owner 2026-05-29): `Retrieval:VectorIndex=AzureSearch` + configured `Retrieval:AzureSearch:*`, with tenant OData filter on every search/delete and scope bound to identity (not headers). *Depends on: TB-071, TB-072, TB-073; [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) pilot profiles.*
- **G4 — Repeatable proof packet.** ≥3 real committed runs each produced a clean, redacted, buyer-safe proof packet without manual artifact surgery.
- **G5 — Live AI evidence.** A credentialed real-LLM golden-cohort run exists and is linked from **`AI_EVIDENCE_APPENDIX.md`**; faithfulness floor holds. *Depends on: owner credentials (assessment Imp. 23, DEFERRED) + workflow (Imp. 9).*
- **G6 — Procurement posture honest and sufficient for target tier.** Trust pack current; deferred items (CPA SOC 2, third-party pen test, live commerce) stated as deferred, not implied as present. *Note: absence of CPA SOC 2 is `(B)` only — it gates **broad enterprise** claims, not Stage 1.*

### How to use this

1. Before each new motion expansion, score **G1–G6** as PASS/HOLD using [`CLAIM_READINESS_CHECKLIST.md`](CLAIM_READINESS_CHECKLIST.md) or pilot review notes.
2. Convert HOLDs into the corresponding engineering improvement (assessment **`LATEST.md` §9**) or owner action.
3. Use early pilots **deliberately** to manufacture G1–G4 evidence — the pilots are the proof factory, not just revenue.
4. Do **not** advance claims ahead of the gate; pace marketing copy to the highest fully-passed stage.
5. Maintain operational trackers: **[`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md)** (G1–G6 PASS/HOLD) and **[`PROOF_PACKET_RUN_LOG.md`](PROOF_PACKET_RUN_LOG.md)** (per-run G4 evidence).

**Cross-refs:** **[`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md)** (claim guardrails), **[`COMMERCIAL_DECISION_PACKET.md`](COMMERCIAL_DECISION_PACKET.md)** (pilot deliverables), **[`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md)** (improvement IDs + impact), **`V1_DEFERRED.md` §6b–§6c** (deferred commerce/assurance).

---

## Engineering-adjacent items requiring owner / human execution

These cannot be completed by coding agents alone. Track here instead of `TECH_BACKLOG.md`.

| ID | Task | Owner | Priority | Status | Notes |
|----|------|-------|----------|--------|-------|
| G-REAL-01 | Execute credentialed real-LLM evidence gate (`scripts/Invoke-RealLlmEvidenceGate.ps1`, 5–10 min unattended) | Owner | P0 | **Done** | Gate PASS 2026-06-24; artifacts committed `6f61fc47f`; `overallOutcome=PASS`, 4/4 agent paths, `executionMode=real` — unblocks **G5** for RC attach |
| G-REAL-06 | Execute three committed real-mode pilot runs (Run 1–3) per [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md) | Owner | P0 | Not started | Stage 1 exit gate **G4**; assessment Tier 1 **#2** remainder (market-execution half); pilot stack must be PilotStrict **Real** — not a coding-agent task. Canonical owner home for historical tech-backlog **TB-141** (run half; **TB-141** removed from `TECH_BACKLOG.md` 2026-07-19) |
| G-REAL-07 | Collect proof packets per run (`collect-first-pilot-proof.ps1 -SponsorHandoff -FailOnHold`); append [`PROOF_PACKET_RUN_LOG.md`](PROOF_PACKET_RUN_LOG.md) | Owner | P0 | Not started | **G4**; use `-CompareBaseRunId` for Run 3; founder signoff required for Stage 0 → 1 per [`REAL_MODE_EVIDENCE_COHORT.md`](../runbooks/REAL_MODE_EVIDENCE_COHORT.md). Canonical owner home for historical tech-backlog **TB-141** (packet/archive half) |
| G-REAL-08 | Attach committed gate JSON to next RC release evidence bundle per [`RELEASE_CLAIM_GATE.md`](../quality/RELEASE_CLAIM_GATE.md) | Owner | P1 | Not started | Gate source committed; run `Emit-ReleaseReadinessEvidence.ps1` on RC cut |
| G-REAL-05 | CPA SOC 2 CPA program kickoff (historical **TB-135**) — organizational, not engineering | Owner | V1.1 | Not started | Owner-execution home; tech **TB-135** Done (tracking closed in `TECH_BACKLOG.md`); zero `(A)` weight per `V1_1-assurance-backlog.mdc` |
| G-ASSURANCE-02 | Third-party pen-test program (historical **TB-136**) — vendor SoW + redacted summary | Owner | V1.1 | Not started | Owner-execution home; tech **TB-136** Done (tracking closed in `TECH_BACKLOG.md`); V1 remains owner-conducted (**TB-005**) until this GTM row completes |
| G-FAITH-01 | Set repo variable `ARCHLUCID_FAITHFULNESS_NIGHTLY_ENFORCE=true` after ≥5 green nightly baselines | Owner | P1 | Not started | Assessment **Imp-3** — enables `--enforce` on `golden-cohort-nightly.yml` deterministic faithfulness job |
| G-CONTENT-01 | Enrich remaining **20** bundled policy packs (+5 curated rules each) | Owner / content | V1.1 | Not started | Assessment **Imp-4** partial — flagship packs **azure-waf**, **ai-governance**, **security-baseline** shipped 2026-06-18 |
| G-REAL-02 | Playwright smoke sign-off — Workspace A self-demo (**M-04**) | QA / owner | P0 | **Done** | Owner sign-off **2026-07-03** — Workspace A Playwright smoke verified; human verification after engineering **#30** |
| G-REAL-03 | Playwright smoke sign-off — Workspace B regulated scenario (**M-05**) | QA / owner | P0 | **Done** | Owner sign-off **2026-07-03** — Workspace B Playwright smoke verified; human verification after engineering **#30** |
| G-REAL-04 | Review sample architecture report from Workspace B (**M-06**) | Owner | P0 | **Done** | Owner sign-off **2026-07-19** on [`M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md`](M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md) (7 match / 4 partial / 1 routing mismatch); optional live DOCX visual check waived. **C8** WAF/CAF routing fix folded into **M-09** remainder; **C4** demo-honesty footnote tracked as **M-111** |
| G-COMMERCE-01 | Complete invoice/SOW commercial readiness before first invoice — tax registration (esp. non-US), legal entity name on invoices, accepted payment methods (ACH/wire/check), multi-currency posture | Owner | P0 | Not started | Split from historical **TB-163** (doc Done). Source: [`TRANSACTABLE_PROCUREMENT_PATH.md`](TRANSACTABLE_PROCUREMENT_PATH.md) §3. Azure Marketplace / MACC remain **V2** |
| G-COMMERCE-02 | Close first paid engagement on the available invoice/SOW (or order-form + invoice) path — owner-review SOW/order form before send; record SEND/HOLD/DEFERRED_SCOPE per [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md); no Marketplace/MACC promises | Owner | P0 | Not started | Split from historical **TB-163**. Templates: [`SERVICE_LED_SOW_QUOTE_TEMPLATE.md`](SERVICE_LED_SOW_QUOTE_TEMPLATE.md), [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md). Align SKUs via **M-34** |
| G-QA-01 | Pick the default founder acceptance target URL + auth method for Playwright/Lighthouse (`ACCEPTANCE_BASE_URL`, staging preferred; document secrets / storage-state path outside git) | Owner | P1 | Not started | Unblocks **M-96–M-99**; guidance: [`../architecture/FOUNDER_UI_ACCEPTANCE_ROUTINE.md`](../architecture/FOUNDER_UI_ACCEPTANCE_ROUTINE.md) |
| G-QA-02 | Run the controlled-beta acceptance checklist against the chosen site before each controlled cut (founder suite + LH + defect log) | Owner | P1 | Not started | Depends on **M-101**; execute after **M-96–M-99** land; log accepted defects explicitly |
| G-QA-03 | Run the 15–30 minute unscripted buyer-like session after lane-2 tools pass; promote any defect caught twice into **M-100** tagged tests | Owner | P1 | Not started | Lane 3 in founder acceptance routine; pairs with **M-102** / **M-100** |
| G-QA-04 | Add `/showcase/claims-intake-modernization` to the controlled-beta acceptance checklist — HTTP 200, executive summary + marketing body present, no `DemoPreviewNotAvailable` shell, disclosure copy is **illustrative sample** not **live preview** | Owner | P1 | Not started | Depends on **TB-887**/**TB-888**; engineering smoke **TB-889**; assessment [`showcase_claims_intake_modernization_assessment_2026_07_19.md`](../architecture/showcase_claims_intake_modernization_assessment_2026_07_19.md); pairs with **M-101** / **M-106** |
| G-QA-05 | Before any controlled cut that markets anonymous Quick Scan AI, confirm `.local/owner/quick_scan_public_release_gate.md` is **GREEN** or intentionally **YELLOW** (sample-only); refuse **RED** | Owner | P0 | Not started | Depends on engineering **TB-902**; assessment [`quick_scan_budget_safety_assessment.md`](../architecture/quick_scan_budget_safety_assessment.md); prompts [`quick_scan_public_safety_prompts.md`](../architecture/quick_scan_public_safety_prompts.md); pairs **M-110** |

---

## V1 Marketing Backlog

### Phase 1 — Demo and messaging foundation (Days 1–15)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-01 | Finalize one-sentence positioning tagline and update `POSITIONING.md` | Copy | P0 | Done | None — `POSITIONING.md` exists as basis |
| M-02 | Write one-minute verbal pitch (elevator script) | Copy | P0 | Done | `ELEVATOR_PITCH.md` written 2026-05-21 — 30-sec, 1-min, 2-min, and consulting-line variants — `EXECUTIVE_SPONSOR_BRIEF.md` as basis |
| M-03 | Write five-minute demo script aligned to marketing vocabulary (Capture → Evidence → Review → Findings → Decisions → Report) | Copy | P0 | Done | Five-minute live-call script added to `DEMO_VIDEO_SCRIPT.md` 2026-05-21; includes Q&A prompts |
| M-04 | Verify self-demo workspace (Workspace A — ArchLucid reviews ArchLucid) passes Playwright smoke | QA sign-off | P0 | **Done** | Owner sign-off **2026-07-03** — Workspace A Playwright smoke verified; **Improvement #30 — COMPLETED (2026-05-17)** |
| M-05 | Verify synthetic regulated scenario workspace (Workspace B — AI governance + cloud posture) passes Playwright smoke | QA sign-off | P0 | **Done** | Owner sign-off **2026-07-03** — Workspace B Playwright smoke verified; **Improvement #30 — COMPLETED (2026-05-17)** |
| M-06 | Download and review generated sample architecture review report from Workspace B; confirm section coverage matches landing-page narrative | Content review | P0 | **Done** | Owner sign-off **2026-07-19** — agent review [`M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md`](M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md) (7 match / 4 partial / 1 routing mismatch) accepted; live DOCX visual check waived (optional). Follow-ups: **C8** routing fix → **M-09** remainder; **C4** demo-script footnote → **M-111**; **Improvement #28 — COMPLETED (2026-05-17)** |
| M-07 | Capture 6–8 polished screenshots across the full operator workflow (Capture, Evidence, Review, Findings, Decisions, Report, whitelabeled export) | Production | P0 | Not started | **Improvement #30 — COMPLETED (2026-05-17)**. Canonical owner home for historical tech-backlog **TB-142** (screenshots half; **TB-142** removed from `TECH_BACKLOG.md` 2026-07-19) |
| M-08 | Review and align `POSITIONING.md` "audit chain / signed manifest" differentiator language; ensure it appears in the one-minute pitch and demo script | Copy | P0 | **Done** | Agent copy alignment **Done 2026-07-03** — `POSITIONING.md` §2 adds a grounded "audit chain / signed manifest" differentiator callout (`ExplainabilityTrace` + append-only `AuditEvents` = audit chain; `ManifestHash`/`IManifestHashService` = signed manifest) plus a proof-points row and a tightened Do/Don't row; same two terms now appear in `ELEVATOR_PITCH.md` one-minute and two-minute pitches and in `DEMO_VIDEO_SCRIPT.md` five-minute Scene 4 and the two-minute storyboard. **Finding-confidence UX** in review UI (**engineering backlog**) — aligns differentiability copy |
| M-111 | Add demo-script footnote (`DEMO_VIDEO_SCRIPT.md`): Workspace B findings are a **seed-backed curated storyline** (`AiGovernanceSeed` / `SecurityBaselineSeed` engines); show live multi-agent traces on Workspace A or a real pilot run — protects the C4 demo-honesty narration | Copy | P2 | Not started | M-03 (demo script Done); source: [`M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md`](M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md) §4; durable fix is **M-93** live sample |

### Phase 2 — Public credibility (Days 16–30)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-09 | Landing page full content — hero copy, problem/solution sections, core workflow narrative, use cases (include Azure WAF + CAF/LZ bundled packs with disclaimer), proof section | Copy + UI | P1 | In progress | **Improvements #31 + #32 — COMPLETED (2026-05-17)**; homepage copy/sections landed 2026-05-21 (`WelcomeMarketingPage` + modular sections). **Remaining:** owner sign-off; **C8 routing fix** (M-06 audit) — link the AI-governance + security-baseline use-case card to the Workspace B canonical URL (`/reviews/61c60d76-…`) and keep WAF/CAF cards pointed at bundled policy-pack docs / Workspace A, not Workspace B; M-07 screenshots; deploy. M-06 sign-off **Done 2026-07-19**. |
| M-107 | Owner IA decision — canonical public proof funnel: align healthcare/get-started/SEO/paid links on whether `/showcase/claims-intake-modernization`, `/see-it`, or `/demo/preview` (Contoso) is the primary anonymous proof path; document co-primary vs single canonical funnel | Decision + Copy | P1 | Not started | Assessment [`showcase_claims_intake_modernization_assessment_2026_07_19.md`](../architecture/showcase_claims_intake_modernization_assessment_2026_07_19.md) §21 **SC-04**; engineering **TB-887**/**TB-888** for static-first + honest copy; unblocks honest **M-09** proof section and **SEO_AND_PAID_ACQUISITION.md** landing targets |
| M-108 | Capture polished screenshots of `/showcase/claims-intake-modernization` (executive summary + findings strip) for **M-07** gallery, **M-16** demo video B-roll, and paid/SEO creatives — only after static-first + disclosure copy ship | Production | P1 | Not started | Blocked on **TB-887**/**TB-888** (page must not show empty shell or misleading **live preview** banner); feeds **M-07**, **M-16**, **M-09** deploy |
| M-109 | Author/review Quick Scan **sample** architecture analysis + visitor-facing capacity-state copy (busy / demo capacity / sample-only / verification required) — must not claim the sample analyzes the visitor’s submission; align CTAs to sign-in / request-demo | Content + UX | P0 | Not started | Engineering **TB-900**; prompts Prompt 10; keep AI disabled publicly until **M-110** / **TB-902** |
| M-110 | Owner go/no-go for anonymous Quick Scan **AI** on the public marketing site after reading `.local/owner/quick_scan_public_release_gate.md` — record GREEN (controlled AI) / YELLOW (sample-only) / RED (keep AI off) | Decision | P0 | Not started | Blocked on **TB-902**; checklist **G-QA-05**; do not enable `AnonymousExecutionEnabled` in production without this decision |
| M-93 | Run a real ArchLucid-on-ArchLucid dogfood pilot (`DOGFOOD_PILOT_KIT.md`) against a real internal subsystem and publish the resulting live run as a citable sample-report alongside Workspace A/B — closes the M-06 audit's "seed-backed, not live" gap (assessment claim **C4**) by giving evaluators a finding with a real `EngineType` and real per-finding evidence citations, not `RegulatedScenarioWorkspaceSeed`-authored ones | Content + Engineering | P1 | Not started | `DOGFOOD_PILOT_KIT.md` (internal pilot mechanics already ship); owner redaction review required before external publication (real, not synthetic, content). Owner direction 2026-07-05: can start any time, not V1.1-gated. |
| M-10 | LinkedIn post 1: "Architecture review is broken — diagrams are not evidence" | Content | P1 | Not started | None |
| M-11 | LinkedIn post 2: "Architecture decisions need provenance — not just Confluence pages" | Content | P1 | Not started | None |
| M-12 | LinkedIn post 3: "Why AI-assisted architecture review needs human signoff" | Content | P1 | Not started | None |
| M-13 | LinkedIn post 4: "The next architecture artifact is the evidence graph" | Content | P1 | Not started | None |
| M-14 | LinkedIn post 5: "Why regulated teams need reviewable architecture records" | Content | P1 | Not started | None |
| M-15 | Publish long-form article: "Architecture Review Is Broken: Why Diagrams Are Not Evidence" | Content | P1 | Done | Full article draft in `LINKEDIN_CONTENT_V1.md` 2026-05-21 (~1,800 words + link-post); owner to publish. Was: None — draft from `POSITIONING.md` + `COMPETITIVE_LANDSCAPE.md` |
| M-51 | Publish long-form LinkedIn article: "CI Watchers" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-52 | Publish long-form LinkedIn article: "Codex vs. Gemini vs. GPT" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-53 | Publish long-form LinkedIn article: "Composer vs. Sonnet vs. Opus" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-54 | Publish long-form LinkedIn article: "Wiring up GitHub" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-55 | Publish long-form LinkedIn article: "My Funny Icon Story" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-56 | Publish long-form LinkedIn article: "Cleaning Up after Cursor" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-57 | Publish long-form LinkedIn article: "Fighting Threads" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-58 | Publish long-form LinkedIn article: "I am Tired of Committing a Pushing" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-59 | Publish long-form LinkedIn article: "Death by a Thousand Cuts" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-60 | Publish long-form LinkedIn article: "Calling Out the Guard" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-61 | Publish long-form LinkedIn article: "Overengineering" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-62 | Publish long-form LinkedIn article: "Engine Battle" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-63 | Publish long-form LinkedIn article: "Not Code?  Don't User Cursor" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-64 | Publish long-form LinkedIn article: "Some Engines are Better Architects than Others" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-65 | Publish long-form LinkedIn article: "Weighting You Own Inference" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-66 | Publish long-form LinkedIn article: "Go Ask Sonnet" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-67 | Publish long-form LinkedIn article: "Product Management and Engines" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-68 | Publish long-form LinkedIn article: "Markdown Files as Silver Bullets" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-69 | Publish long-form LinkedIn article: "Watch Out for ORMs" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-70 | Publish long-form LinkedIn article: "200 or Nothing" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-71 | Publish long-form LinkedIn article: "Composer is Just a Composer" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-72 | Publish long-form LinkedIn article: "Best Debugger Ever" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-73 | Publish long-form LinkedIn article: "Some Things are Better with Opus" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-74 | Publish long-form LinkedIn article: "Abstractions: Architecture vs. Reviews" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-75 | Publish long-form LinkedIn article: "Dependabot" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-76 | Publish long-form LinkedIn article: "k6" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-77 | Publish long-form LinkedIn article: "Capturing Screenshots" | Content | P1 | Done (draft) | Full article draft in [`LINKEDIN_CONTENT_V2.md`](LINKEDIN_CONTENT_V2.md) 2026-06-20 (~1,400 words + link-post); owner to publish. Capture brief: [`SCREENSHOT_GALLERY.md`](SCREENSHOT_GALLERY.md). |
| M-78 | Publish long-form LinkedIn article: "Text System Complexity" | Content | P1 | Done (draft) | Full article draft in [`LINKEDIN_CONTENT_V2.md`](LINKEDIN_CONTENT_V2.md) 2026-06-20 (~1,450 words + link-post); owner to publish. Type scale: [`UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md), TB-119. |
| M-79 | Publish long-form LinkedIn article: "Convex Optimization?" | Content | P1 | Done (draft) | Full article draft in [`LINKEDIN_CONTENT_V2.md`](LINKEDIN_CONTENT_V2.md) 2026-06-20 (~1,500 words + link-post); owner to publish. Constrained feasibility: [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md). |
| M-80 | Publish long-form LinkedIn article: "I Miss Fable" | Content | P1 | Done (draft) | Full article draft in [`LINKEDIN_CONTENT_V2.md`](LINKEDIN_CONTENT_V2.md) 2026-06-20 (~1,400 words + link-post); owner to publish. Builder engine-series; personal task-model fit — no benchmark claims. |
| M-81 | Publish long-form LinkedIn article: "One Thing at a Time" | Content | P1 | Done (draft) | Full article draft in [`LINKEDIN_CONTENT_V2.md`](LINKEDIN_CONTENT_V2.md) 2026-06-20 (~1,400 words + link-post); owner to publish. WIP / gates: [`FIRST_SESSION_DISMISSAL_PLAYBOOK.md`](FIRST_SESSION_DISMISSAL_PLAYBOOK.md), [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-82 | Publish long-form LinkedIn article: "UI Development" | Content | P1 | Done (draft) | Full article draft in [`LINKEDIN_CONTENT_V2.md`](LINKEDIN_CONTENT_V2.md) 2026-06-20 (~1,500 words + link-post); owner to publish. Design wave: [`UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md), TB-114–TB-120, [`archlucid-ui/AGENTS.md`](../../archlucid-ui/AGENTS.md). |
| M-83 | Publish long-form LinkedIn article: "Dirty Secrets" | Content | P1 | Done (draft) | Full article draft in [`LINKEDIN_CONTENT_V2.md`](LINKEDIN_CONTENT_V2.md) 2026-06-20 (~1,550 words + link-post); owner to publish. Claim gates: [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md), [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md). |
| M-84 | Publish long-form LinkedIn article: "Adventures in Space!" | Content | P1 | Done (draft) | Full article draft in [`LINKEDIN_CONTENT_V2.md`](LINKEDIN_CONTENT_V2.md) 2026-06-20 (~1,400 words + link-post); owner to publish. Spacing convention: [`UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md), TB-118. |
| M-85 | Publish long-form LinkedIn article: "Can't Good Good Help" | Content | P1 | Done (draft) | Full article draft in [`LINKEDIN_CONTENT_V2.md`](LINKEDIN_CONTENT_V2.md) 2026-06-20 (~1,450 words + link-post); owner to publish. Fluency vs governance help; [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md), real-mode faithfulness rollup. |
| M-86 | Publish long-form LinkedIn article: "Big Words Hurt My Head" | Content | P1 | Done (draft) | Full article draft in [`LINKEDIN_CONTENT_V2.md`](LINKEDIN_CONTENT_V2.md) 2026-06-20 (~1,450 words + link-post); owner to publish. Plain language: [`UI_GLOSSARY_V1.md`](UI_GLOSSARY_V1.md), [`UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md). |
| M-87 | Publish long-form LinkedIn article: "Architecture Decision Records" | Content | P1 | Done (draft) | Full article draft in [`LINKEDIN_CONTENT_V2.md`](LINKEDIN_CONTENT_V2.md) 2026-06-20 (~1,550 words + link-post); owner to publish. ADR vs decision record; M-26 SKU; [`LINKEDIN_CONTENT_V1.md`](LINKEDIN_CONTENT_V1.md) M-15 alignment. |
| M-88 | Publish long-form LinkedIn article: "Checking in Broken Code" | Content | P1 | Done (draft) | Full article draft in [`LINKEDIN_CONTENT_V2.md`](LINKEDIN_CONTENT_V2.md) 2026-06-21 (~1,450 words + link-post); owner to publish. Scoped compile: [`scripts/ci/agent-compile-check.ps1`](../../scripts/ci/agent-compile-check.ps1); tree safety + pre-commit: [`docs/engineering/AGENTS.md`](../engineering/AGENTS.md). |
| M-89 | Publish long-form LinkedIn article: "Gemini Takes the Initiative, but not in a Good Way" | Content | P1 | Not started | Draft and publish from personal profile; follow proof-gated claims in [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md). |
| M-16 | Create one short demo video (screen recording of Workspace A self-demo flow) | Production | P1 | Not started | **Improvement #30 — COMPLETED (2026-05-17)**. **Deferred (planning 2026-05-21):** record after M-07 screenshots; M-04 smoke sign-off **Done (2026-07-03)**; M-18 may use live demo until video exists. Canonical owner home for historical tech-backlog **TB-142** (video half) and **TB-236** (demo video production DEFERRED; both removed from `TECH_BACKLOG.md` 2026-07-19). Storyboard prerequisite shipped as engineering **TB-233** (Done) |

### Phase 3 — Early conversations (Days 31–60)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-17 | Build outreach list: 20 architects / CTOs / security leaders (LinkedIn network, former colleagues — avoid employer conflicts and NDA-covered clients) | Outreach | P2 | Not started | None |
| M-18 | Send 20 outreach messages: offer 10-minute demo + feedback call (not a sales pitch) | Outreach | P2 | **In progress** | Agent message drafting **Done 2026-07-03** — [`M18_OUTREACH_MESSAGE_TEMPLATE.md`](M18_OUTREACH_MESSAGE_TEMPLATE.md) (connection note, warm DM, follow-up bump, persona-flavored openers, tracking log). **Owner:** personalize and send once still-open dependencies clear — M-09 (landing page live), M-16 (demo video available), and M-17 (list built) |
| M-19 | Run 5–10 live demos against Workspace A and Workspace B | Sales | P2 | Not started | **Improvement #30 — COMPLETED (2026-05-17)**; M-03 (demo script) |
| M-20 | Track objections from demos; refine one-sentence positioning and demo script | Copy iteration | P2 | Not started | M-19 (demos must start) |
| M-21 | Identify the one strongest buyer segment from demo feedback | Positioning | P2 | Not started | M-20 |
| M-38 | Run 3-session first-session dismissal cohort per `FIRST_SESSION_DISMISSAL_PLAYBOOK.md`; complete `cohort-synthesis.md` before any first-session UI batch | Market validation | P1 | Not started | Playbook + fixtures shipped 2026-06-17 |
| M-39 | Apply `PROOF_PACKET_RUN_LOG_OPERATING_CHECKLIST.md` on every real pilot; reach ≥3 qualifying G4 rows | Market validation | P0 | Not started | Checklist shipped 2026-06-17 |
| M-40 | Maintain `artifacts/bakeoff/scoreboard/frontier-ai-scoreboard.md` per `validation/FRONTIER_AI_COUNTERFACTUAL_CADENCE.md` (monthly minimum review, urgent re-run triggers, claim-update rules); append row after each bakeoff; refresh rollup at ≥3 sessions | Market validation | P1 | Not started | Scoreboard + cadence doc shipped in V1 (assessment Improvements #6); live sessions are V1.1 (**M-43**) |
| M-41 | Run 6-week second-review habit-loop cohort (3 accounts) per `SECOND_REVIEW_HABIT_LOOP_EXECUTION_BOARD.md`; file weekly digests weeks 2–5 | Market validation | P1 | Not started | Execution board shipped 2026-06-17 |
| M-42 | Run 3-session model-seats counter-positioning message test per `MODEL_SEATS_COUNTER_POSITIONING_TEST.md`; complete `cohort-synthesis.md` before external vs-ChatGPT claim expansion | Market validation | P1 | Not started | Message test shipped 2026-06-17 |
| M-34 | Align SOWs / `ORDER_FORM_TEMPLATE.md` drafts and outreach talk track to named SKUs in `SERVICE_LED_OFFERS.md` (Readiness Review, Evidence Pack, ARB Report, Azure-first review) | Business | P2 | Not started | None — `SERVICE_LED_OFFERS.md` is canonical SKU list |
| M-35 | Author ARC-AMPE pack #24 (CMS ACA / Medicaid Partner Entities) — curated rules JSON, embedded bundle, manifest bump (23→24), appendix doc, disclaimer test — per **[`POLICY_PACK_ARC_AMPE_DESIGN.md`](../library/POLICY_PACK_ARC_AMPE_DESIGN.md)** | Content + engineering | P1 | Not started | LLM → critic → human pipeline (`POLICY_PACK_CONTENT_BACKLOG.md`); does not block landing page until content lands |

### Phase 4 — Monetization (Days 61–90)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-22 | Draft paid pilot offer (Option A: architecture review package using ArchLucid) — align scope and **SKU name** to **`SERVICE_LED_OFFERS.md`**; use `ORDER_FORM_TEMPLATE.md` as starting point; private quote bands may use indicative rows in that doc | Business | P3 | Not started | M-34 (recommended before first paid signature). Recruiting pipeline doc shipped as historical **TB-161** (`PILOT_RECRUITING_PIPELINE.md`) |
| M-23 | Draft paid pilot offer (Option B: 30–60 day pilot with setup, demo workspace, review workflow, sample reports) — align deliverables to **`SERVICE_LED_OFFERS.md`** where overlapping | Business | P3 | Not started | M-34 (recommended) |
| M-24 | Create Upwork service listing: "AI Architecture Governance Review" (evidence-backed process + structured architecture review report) | Business | P2 | Not started | **Improvement #28 — COMPLETED (2026-05-17)**. With **M-25**–**M-27**, owns Upwork half of historical tech-backlog **TB-142** |
| M-25 | Create Upwork service listing: "Azure Architecture Readiness Review" (Azure extractor + security baseline + cost findings) | Business | P2 | Not started | **Improvement #29 — COMPLETED (2026-05-17)** |
| M-26 | Create Upwork service listing: "Architecture Decision Record Cleanup" (capture + decisioning flow) | Business | P2 | Not started | **Improvement #30 — COMPLETED (2026-05-17)** |
| M-27 | Run at least one Upwork engagement with ArchLucid as internal tool + demo asset | Business | P2 | Not started | M-24, M-25, or M-26; lean in to test production system. |
| M-36 | Run at least one paid pilot with ArchLucid as internal tool + demo asset | Business | P3 | Not started | M-22 or M-23; **`SERVICE_LED_OFFERS.md`** defines SKU names deliverables. Execution half of historical **TB-161** recruiting pipeline |
| M-94 | Complete invoice/SOW commercial readiness (**G-COMMERCE-01**) — tax, legal name, payment methods, currency posture per [`TRANSACTABLE_PROCUREMENT_PATH.md`](TRANSACTABLE_PROCUREMENT_PATH.md) §3 | Business | P0 | Not started | Historical **TB-163** owner half; blocks first invoice |
| M-95 | Close first paid engagement on invoice/SOW path (**G-COMMERCE-02**) — owner-reviewed SOW or order form; commercial closeout SEND/HOLD/DEFERRED_SCOPE; no Marketplace/MACC claims | Business | P0 | Not started | Historical **TB-163** owner half; **M-34** recommended; Marketplace is **V2** |
| M-28 | Request testimonial from any non-NDA-conflicted early user or pilot participant | Relationship | P3 | Not started | M-27 |

---

## Founder UI quality acceptance (target-site Playwright + Lighthouse)

**Captured 2026-07-18.** Goal: improve product quality, run existing tools against an **owner-chosen website**, and **gradually replace manual regression** with a tagged founder suite — without buying another UI-test platform and without turning Lighthouse category scores into arbitrary hard gates.

**Canonical guidance:** [`../architecture/FOUNDER_UI_ACCEPTANCE_ROUTINE.md`](../architecture/FOUNDER_UI_ACCEPTANCE_ROUTINE.md)  
**Owner cadence rows:** **G-QA-01**–**G-QA-04** (engineering-adjacent table above)  
**Already shipped (do not rebuild):** GitHub Playwright estate (mock / live / a11y / visual / UX-audit), warn-only lab Lighthouse CI ([`../architecture/UI_LIGHTHOUSE_CI.md`](../architecture/UI_LIGHTHOUSE_CI.md)), journey specs such as `live-api-journey` / buyer golden path.

**North star:** `ACCEPTANCE_BASE_URL=<your site> npm run test:e2e:founder` (+ remote Lighthouse) becomes the default pre-beta click-path check; unscripted exploration shrinks to judgment-only work.

| # | Task | Type | Priority | Status | Depends on (technical) / notes |
|---|------|------|----------|--------|--------------------------------|
| M-96 | **Target-site harness** — document and implement `ACCEPTANCE_BASE_URL` (keep `STAGING_BASE_URL` compatible/aliased) so Playwright founder runs and remote Lighthouse aim at an owner-chosen UI origin; define auth for that site (env secrets and/or Playwright `storageState`); never commit tokens or authenticated report dumps with PII | Engineering | P1 | Not started | **G-QA-01** (owner picks default URL + auth). Builds on `playwright.live.config.ts` / trial-funnel `STAGING_BASE_URL` patterns — do not fork a second E2E stack |
| M-97 | **Tag founder suite** — annotate ~20–40 high-value existing specs with `@founder`, `@critical`, `@buyer-journey`, `@release-smoke` covering auth, workspace, architecture, review, evidence, findings/citations, export, roles, settings/integrations, help/billing/privacy, and one first-time-user journey; prefer tags over a parallel suite | Engineering | P1 | Not started | Inventory `archlucid-ui/e2e/*journey*` + buyer golden path first; grow via **M-100** |
| M-98 | **npm scripts for chosen-site runs** — add `test:e2e:founder`, `test:e2e:founder:headed`, `test:e2e:founder:ui` (or equivalent) that run `--grep @founder` (and a critical variant) against `ACCEPTANCE_BASE_URL`; document copy-paste commands in the architecture routine | Engineering | P1 | Not started | **M-96**, **M-97** |
| M-99 | **Remote Lighthouse against chosen site** — wrapper or LHCI config that audits the representative public + **authenticated** route set on `ACCEPTANCE_BASE_URL` (storage state from **M-96**); median of 3–5 runs for important pages; keep category scores **warn-only**; hard-fail only on material defects (severe a11y, broken nav, huge payload, unusable mobile, insecure/deprecated, severe CLS) | Engineering | P1 | Not started | **M-96**; extend [`UI_LIGHTHOUSE_CI.md`](../architecture/UI_LIGHTHOUSE_CI.md) / `lighthouserc.cjs` rather than inventing a second budget system; lab mock CI stays as-is |
| M-100 | **Gradual manual→automated absorption** — standing process: any click-path or “page broken?” check the founder performs twice becomes a tagged `@founder` / `@critical` test before the next controlled beta; track suite growth and retire checklist rows as they are covered | Engineering + Owner | P1 | Not started | Continuous after **M-97**; fed by **G-QA-03** / **M-102** defect log |
| M-101 | **Controlled-beta acceptance checklist + defect log** — write a short checklist (CI green → founder suite on chosen URL → Lighthouse → console/network → one E2E review → one first-time journey → explicit accepted defects) and a lightweight defect-log template under `docs/go-to-market/` or `docs/architecture/`; link from the routine doc | Content + Engineering | P1 | Not started | Routine already sketched in `FOUNDER_UI_ACCEPTANCE_ROUTINE.md`; this row ships the operational checklist artifact |
| M-102 | **Unscripted exploratory cadence** — institutionalize 15–30 minutes of buyer-like use after lane-2 tools pass (questions in the routine doc); timebox shrinks as **M-100** absorbs deterministic checks; judgment/UX questions stay human | Owner process | P1 | Not started | **G-QA-03**; complements `lucid-ui-audit` / UX-audit screenshots — does not replace them |
| M-103 | **Optional scheduled / pre-release CI job** — run `@founder` (and optionally remote Lighthouse warn) against staging on a schedule or release workflow; **not** a second full Playwright matrix; keep merge-blocking policy explicit (start warn-only or release-only if flake risk is high) | Engineering | P2 | Not started | **M-96–M-98**; secrets via GitHub environment; do not block every PR until stable |
| M-104 | **Console + failed-network automation** — on founder routes against the chosen site, fail (or warn with artifact) on unexpected `pageerror` / failed XHR that today require manual DevTools inspection; allowlist known benign noise | Engineering | P1 | Not started | **M-96**, **M-97**; high leverage for cutting manual regression |
| M-105 | **axe a11y on founder routes against chosen URL** — run `@axe-core/playwright` (or reuse helper) on the founder route set against `ACCEPTANCE_BASE_URL`, not only mock-backed `chromium-accessibility` | Engineering | P1 | Not started | **M-96**, **M-97**; complements existing mock a11y job — does not replace it |
| M-106 | **First full dry-run + baseline** — after **M-96–M-99** (and preferably **M-104**), run the full pre-beta routine once against the chosen site; record wall-clock manual minutes and defects found; use as baseline to prove **M-100** is shrinking manual work each cut | Owner + Engineering | P1 | Not started | **G-QA-02**; exit: checklist executed once with logged metrics |
| M-107 | **Public proof-funnel IA decision** — owner documents whether `/showcase/claims-intake-modernization`, `/see-it`, or `/demo/preview` is the canonical anonymous proof path (or honest co-primary pair); align get-started healthcare vertical, SEO/paid landing targets, and welcome CTAs | Owner | P1 | Not started | Assessment §21 **SC-04**; engineering **TB-887**/**TB-888**; unblocks **M-108** and honest **M-09** proof copy |
| M-108 | **Showcase screenshot capture** — add `/showcase/claims-intake-modernization` frames to **M-07** gallery / **M-16** B-roll after static-first + illustrative-sample copy ship | Production | P1 | Not started | Blocked on **TB-887**/**TB-888**; subset effort of **M-07** |

**Suggested implementation order:** **G-QA-01** → **M-96** → **M-97** → **M-98** → **M-104** / **M-105** → **M-99** → **M-101** → **TB-887**/**TB-888** → **G-QA-04** → **M-107** → **M-108** → **M-106** (first dry-run) → ongoing **M-100** + **M-102** / **G-QA-03**; add **M-103** once the local/staging founder suite is stable.

**Out of scope for this cluster:** replacing GitHub’s full Playwright estate; buying Applitools/Percy/etc.; Lighthouse “every page ≥ 95” hard gates; running thousands of tests on a founder laptop.

---

## V1.1 and V2 (do not pull forward)

| # | Task | Milestone | Reason deferred |
|---|------|-----------|-----------------|
| M-29 | Publish LinkedIn post on ServiceNow integration ("ArchLucid writes architecture findings back to your ServiceNow workflow") | **V1.1** | Waits on first-party ServiceNow program ([`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13), **Improvement #25**, and **P10** (developer instance) |
| M-30 | Publish CAF / Azure landing-zone use case claim with bundled curated policy pack | **V1 GA** | Pack ships seeded per **`DEFAULT_POLICY_PACKS_V1.md`** — marketing copy must keep **thematic mapping** disclaimer |
| M-31 | Solo architect self-serve SaaS pricing page (monthly tier bands per [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md) **section 5**) and **public marketing-site** self-serve checkout CTA as primary motion | V2 | Distinguish from **V1 in-app** tenant checkout (**TB-763–TB-766**). Stripe **live keys** remain owner-gated. No public $ band as primary motion in first 90 days per **[PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md)** (**Marketing alignment Q7**); prefer **demand signal** from service-led engagements before positioning public self-serve as primary motion |
| M-32 | Reference customer / design partner case study publication | V1.1 | Depends on signed pilot and `reference-customers/PUBLICATION_CHECKLIST.md` clearance. Canonical owner home for historical tech-backlog **TB-164** (capture template already shipped: `NAMED_REFERENCE_CUSTOMER_CAPTURE.md`; **TB-164** removed from `TECH_BACKLOG.md` 2026-07-19) |
| M-33 | Cross-tenant portfolio ROI analytics marketing claim | V2 | Cross-tenant analytics deferred to V2 per `V1_DEFERRED.md` |
| M-37 | Real decision-delta cohort (10 paid pilots) using `DECISION_DELTA_INTERVIEW.md` and bakeoff packet discipline; assemble each executive proof packet per `EXECUTIVE_PAID_PILOT_PROOF_PACKET.md` (six elements incl. one remediation ticket) and rehearse it in the mock procurement review before each real call; file one buyer-safe row per pilot in `validation/PAID_PILOT_EVIDENCE_LEDGER.md` + JSON template; publish sanitized monthly rollups under `docs/go-to-market/validation-runs/` | V1.1 | The reusable paid-pilot evidence ledger shipped in V1 (assessment Improvement #3); the reusable **executive proof-packet assembly + mock-procurement-review instrument** (`EXECUTIVE_PAID_PILOT_PROOF_PACKET.md`) shipped in V1 (current assessment Improvement #4 design half). This row is the **market-execution half** — completed paid pilots, real authorized packets, and observed conversion outcomes — which a coding agent cannot perform. Market-validation motion prioritized for V1.1; do not treat as an (A) V1 headline-readiness penalty |
| M-43 | Run real (human-led) principal-architect frontier-AI bakeoff sessions per `docs/runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md`; recruit regulated/compliance buyers first; append rows to the real scoreboard at `artifacts/bakeoff/scoreboard/frontier-ai-scoreboard.md` | V1.1 | Supersedes the synthetic AI dry-run (design-uncertainty only). Produces the **market** evidence (real participants, real decisions) the dry-run cannot; do not treat its absence as an (A) V1 headline-readiness penalty |
| M-44 | Run real (human-led) 3-session first-session dismissal cohort per `FIRST_SESSION_DISMISSAL_PLAYBOOK.md` + `FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`; run head-to-head dismissal interviews per `PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md` (randomized chat-style vs governed package; 30-day reuse + pay-to-avoid questions); use `library/FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md` as the expert path under test; file per-session logs via `validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md` + JSON template; run the weekly top-2 triage runbook; recruit daily frontier-AI principal architects (not friendly champions); timestamp the commit→export gap, measure time-to-first-sendable-artifact, and complete `artifacts/first-session/<cohort>/cohort-synthesis.md` | V1.1 | Current assessment Improvement #3 is tracked here. The reusable **dismissal interview script** (`PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md`) + capture template (`templates/principal-architect-dismissal-interview.template.json`) shipped in V1 (current assessment Improvement #3 design half); the dismissal-log instrument + weekly triage runbook shipped in V1 (historical assessment Improvement #2); the **15-minute expert lane** shipped in V1 (historical assessment Improvement #4). This row is the **market-execution half** — live sessions and observed dismissal triggers — which a coding agent cannot perform. Supersedes the synthetic first-session dry-run (design-uncertainty only). Produces the **observed** 30-day voluntary-usage evidence the dry-run cannot; only ≥2-session confirmed bottlenecks may open a UI batch; do not treat its absence as an (A) V1 headline-readiness penalty |
| M-45 | Complete real (human-led) decision-delta interviews within 7 days of each real bakeoff/pilot handoff per `DECISION_DELTA_INTERVIEW.md`; file buyer-safe `validation/DECISION_CHANGE_ADDENDUM.md` per handoff; enforce one-finding-ID-per-delta attribution (PASS only when the changed decision traces to a finding the participant's own AI pass did not produce); store buyer-safe summaries under `docs/go-to-market/validation-runs/` | V1.1 | The reusable decision-change addendum format shipped in V1 (assessment Improvement #5); this row is the **market-execution half**. Supersedes the synthetic decision-delta dry-run (design-uncertainty only). Produces the **real** decision-advantage evidence (approvals/conditions/budget actually changed) the dry-run cannot; recruit regulated/compliance buyers first; do not treat its absence as an (A) V1 headline-readiness penalty |
| M-46 | Apply the **Product Decision Gate** (`FIRST_SESSION_DISMISSAL_PLAYBOOK.md` § Product decision gate) to the **real** M-44 cohort: run every confirmed (≥2-session) bottleneck through the gate, classify design vs market uncertainty, record the "do not change yet" list, and open a UI batch only for bottlenecks that clear as **Justified now** | V1.1 | The reusable gate artifact shipped in V1 (Task #5); this is its **application to observed cohort evidence**. Depends on M-44; do not treat its absence as an (A) V1 headline-readiness penalty |
| M-47 | Run the **sponsor export discovery test** (`SPONSOR_EXPORT_DISCOVERY_TEST.md`) with real first-time principal architects after Core Pilot/review-detail changes; capture time-to-export-found, wrong turns, terminology confusion, H5, and would-send-as-is; if H5/D4 repeats in ≥2 participants, route it through the product decision gate (`M-46`) | V1.1 | The reusable no-code test shipped in V1 (Task #6); this is its **execution with real participants**. Implement export-affordance UI only if a repeated failure clears the gate as **Justified now**; do not treat its absence as an (A) V1 headline-readiness penalty |
| M-48 | Run the **founder-narration dependency ledger** (`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md` § Founder-narration dependency ledger) live during the real M-44 cohort; log every facilitator intervention by type (safety-blocker / navigation-hint / product-explanation), record could-continue + per-session verdict, and report the cohort leak rate and product-led/mixed/founder-led spread | V1.1 | The reusable instrument shipped in V1 (Task #7); this is its **execution with real participants** to answer whether first value is product-led or founder-led. Depends on M-44; route ≥2-session repeated leaks through the product decision gate (`M-46`); do not treat its absence as an (A) V1 headline-readiness penalty |
| M-49 | Populate the **real-mode faithfulness rollup** (`docs/quality/REAL_MODE_FAITHFULNESS_ROLLUP.md`) from ≥3 owner-executed **real-mode** runs per `docs/runbooks/THREE_REAL_MODE_PROOF_RUNS.md`; score per-run unsupported-claim count, wrong/overstated findings, and evidence-chain completeness; record the **GOOD ENOUGH FOR SPONSOR-FACING PILOTS / HOLD** verdict before any external real-mode faithfulness claim | V1.1 | The reusable rollup instrument + sponsor-correctness gate shipped in V1 (Task #11); this is its **population with real authorized runs** (owner credentials + live access). Simulator/offline-fixture output is inadmissible. Mirrors the V1 owner runbook (`THREE_REAL_MODE_PROOF_RUNS.md` Phase D); do not treat its absence as an (A) V1 headline-readiness penalty |
| M-50 | Run the real (human-led) **blind decision-delta cohort** (≥3 sessions, target 5) per `Architect_Evaluation/BLIND_PRINCIPAL_ARCHITECT_VALIDATION_COHORT.md`: pre-register thresholds in `validation-runs/BLIND_DECISION_DELTA_COHORT_TRACKER.md` **before** session 1, score Arm A/Arm B blind with external principal architects, reveal source mapping only after scoring, then file the sanitized cohort verdict under `docs/go-to-market/validation-runs/` | V1.1 | The reusable cohort assets (playbook, scorecard, JSON/markdown templates, aggregation scripts) and the **pre-registered tracker** shipped in V1 (assessment Improvement #1); this row is the **market-execution half** — recruiting real architects and observing blind decision-delta — which a coding agent cannot perform. Recruit daily frontier-AI principal architects (not friendly champions); reduces **market** (not design) uncertainty; do not treat its absence as an (A) V1 headline-readiness penalty |
| M-90 | Run the real (human-led) **90-minute first-review dry-run cohort** with at least three non-author operators: start from the V1 first-review playbook, time setup → evidence capture/upload → committed review → ROI/proof packet/export handoff, log stalls and terminology confusion, and open product work only for repeated blockers that clear the product decision gate | V1.1 | Current assessment Improvement #2 moved to the GTM V1.1 backlog. This is market-execution work, not a coding-agent implementation batch: the V1 playbook, pilot nav profile, demo review, ZIP pre-validation, and proof-packet surfaces already exist. Do not treat absence of live cohort results as an (A) V1 headline-readiness penalty |
| M-91 | Run a **red-team procurement objection rehearsal** per `CONTROLLED_PILOT_OBJECTION_DRILL.md` and `PROCUREMENT_OBJECTION_PLAYBOOK.md`: require SOC 2, external pen test, data residency, DPA, subprocessors, deletion, and Azure access answers; measure whether the honest V1 posture (`TRUST_CENTER.md`, SOC self-assessment, SOC roadmap) earns a pilot exception | V1.1 | Current assessment Improvement #5 moved to the GTM V1.1 backlog. The V1 trust-center, SOC self-assessment, SOC roadmap, CAIQ/SIG/DPA, and objection playbooks already ship. This row is **market-execution** — a live procurement red-team with human reviewers — which a coding agent cannot perform. Do not list as assessment §17; do not treat absence of a completed rehearsal as an (A) V1 headline-readiness penalty |
| M-92 | Run the **ITSM pilot-readiness test** for the first two pilots: ask which system of record matters; if Jira/ServiceNow matters, configure and test native create (`POST /v1/integrations/itsm/outbound/issues`, health, `ItsmFindingCorrelations`) before the demo; otherwise use export/copy fallback; do not expand connectors without buyer evidence | V1.1 | Current assessment Improvement #6 moved to the GTM V1.1 backlog. The V1 outbound create slice, health, correlation, and audit events already ship; native create is intentionally configuration-gated. This row is **pilot-execution** validation per buyer — not a coding-agent batch. Do not list as assessment §17; do not treat absence of a completed pilot ITSM test as an (A) V1 headline-readiness penalty |

---

## Technical dependency map (marketing ↔ legacy engineering batches)

All V1 marketing gate improvements referenced below are **COMPLETED** as of **2026-05-17**. **M-29** is deferred to **V1.1** (first-party ServiceNow per `V1_SCOPE.md` §2.13); **P10** (ServiceNow developer instance) remains a validation unblocker.

> **Note on item numbers:** Rows use **legacy sprint improvement labels** (#19–#33) for team memory. **Shipping truth** is **`CHANGELOG`**, **`V1_SCOPE.md`**, and **`V1_DEFERRED.md`** — verify before treating a label as a live dependency.

| Legacy batch label | Status | Marketing tasks unblocked |
|---|---|---|
| **#26** — Operator UI vocabulary alignment | **COMPLETED (2026-05-17)** | All in-app copy and demo scripts use aligned vocabulary |
| **#27** — Bulk evidence upload (up to 200 files; ZIP as one file) | **COMPLETED (2026-05-17)** | Landing page copy may disclose cap; M-19 demos show bulk capture |
| **#28** — DOCX/PDF export + consultant whitelabel | **COMPLETED (2026-05-17)** | M-06, M-24 |
| **#29** — Default policy packs (AI governance + security baseline) | **COMPLETED (2026-05-17)** | M-25, all policy-pack copy claims |
| **#30** — Two curated demo workspaces (Workspace A + B) | **COMPLETED (2026-05-17)** | M-04, M-05, M-07, M-16, M-19, M-26 |
| **#31** — Landing CTA stack (walkthrough / self-demo / early access) | **COMPLETED (2026-05-17)** | M-09 |
| **#32** — Marketing landing page content | **COMPLETED (2026-05-17)** | M-09 (fully unblocked) |
| **#33** — Superseded by #32 | **COMPLETED (2026-05-17)** | — |
| **#24** — Surface finding confidence + evidence links in review UI | Actionable (open) — verify in engineering backlog / UI release notes | Supports differentiability messaging for M-08 |
| **#19** — Progressive disclosure for advanced governance routes | Actionable (open) — verify in engineering backlog | Reduces demo cognitive-load risk during M-19 |
| **#25** — ServiceNow bi-directional sync (**V1.1** program) | **Blocked on P10** | M-29 — do not publish until **V1.1** connector milestone |
