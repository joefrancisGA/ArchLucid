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

**Updated:** 2026-07-24 — **M-144** / **M-145** opened (transactional outbox replay-safe vs consumer idempotency — claim honesty + PA one-pager); engineering **TB-992**–**TB-994**. Prior: **M-142** / **M-143** (solo-operator pages vs support-email); engineering **TB-989**–**TB-991**. Prior: **M-140** / **M-141** (finding concurrent disposition race); engineering **TB-986**–**TB-988**. Prior: **M-138** / **M-139** (Simulator-derived ROI/savings forbid on sponsor surfaces); engineering **TB-983**–**TB-985**. Prior: **M-133**–**M-137** (showcase scenario portfolio); engineering **TB-978**–**TB-982**. Prior: **M-131** / **M-132** (INV-004); **M-129** / **M-130**; **M-127** / **M-128**; **M-119**–**M-126**; **M-117** / **M-118**; **M-115** / **M-116**; **M-113** / **M-114** **Done**. Does not duplicate **G-REAL-06**/**G-REAL-07**.

---

## Effort summary chart (owner-calibrated)

**Estimator profile (2026-07-19):** PhD computer scientist, ~35 years hands-on engineering, expert developer, Azure expert, very fast technical writer. Estimates are **your active hands-on time** (not calendar span). External waits (buyer replies, auditor/vendor slots, CPA fieldwork, pilot scheduling) are called out separately and **not** folded into the hour figures.

**Conventions:** `h` = hours · `m` = minutes · aliases (same work as another row) are marked and **excluded from rollup totals** · Done rows omitted · `Done (draft)` LinkedIn pieces count **publish-only** remaining effort.

### Rollup (open + in progress, unique work only)

| Band | Open rows (unique) | Est. hands-on |
|------|--------------------:|---------------|
| **P0** | 14 | **~23–39 h** (includes Quick Scan safety GTM **M-109**/**M-110**/**G-QA-05**; **G-REAL-04**/**M-06** Done 2026-07-19) |
| **P1** | 94 | **~122–195 h** (≈ half is LinkedIn long-form draft+publish; incl. **G-REAL-09** DOCX visual check; **G-QA-06**/**G-QA-07**/**M-112** UI perf triage; **G-SCALE-01**/**G-SCALE-02** autoscale drills; **M-115**–**M-132** / **M-138**–**M-145** PA claim-honesty / one-pager cluster; **M-133**–**M-136** showcase scenario portfolio) |
| **P2** | 14 | **~19–32 h** (+ demo/outreach calendar; incl. **M-111** demo-honesty footnote; **M-137** fictional-org trademark screen) |
| **P3** | 4 | **~6–10 h** (+ paid-engagement calendar) |
| **V1.1 / V2** | 18 | **~40–70 h** kickoff/execution slices (+ multi-week/month external calendars) |
| **Total unique open** | ~140 | **~210–342 h** active; calendar for cohorts/assurance/commerce dominates wall-clock |

---

### Engineering-adjacent (G-*)

| ID | Title | Priority | Est. (hands-on) |
|----|-------|----------|-----------------|
| G-REAL-06 | Three committed real-mode pilot runs (Run 1–3) | P0 | **4–6 h** active (wall ~1–2 days with LLM/pipeline wait) |
| G-REAL-07 | Collect proof packets + append `PROOF_PACKET_RUN_LOG` | P0 | **2–3 h** |
| G-COMMERCE-01 | Invoice/SOW commercial readiness (tax, entity, payment methods) | P0 | **2–4 h** (+ jurisdiction registration calendar if new) |
| G-COMMERCE-02 | Close first paid engagement on invoice/SOW path | P0 | **2–4 h** prep/send (+ buyer close calendar) |
| G-REAL-08 | Attach gate JSON to next RC evidence bundle | P1 | **30–45 m** (on RC cut) |
| G-REAL-09 | Live DOCX visual check of Workspace B export (waived at M-06 sign-off; do before M-16/M-19) | P1 | **10–15 m** |
| G-FAITH-01 | Flip `ARCHLUCID_FAITHFULNESS_NIGHTLY_ENFORCE=true` | P1 | **15 m** (after ≥5 green nightlies exist) |
| G-QA-01 | Pick `ACCEPTANCE_BASE_URL` + auth method | P1 | **30–45 m** |
| G-QA-02 | Controlled-beta acceptance checklist per cut | P1 | **1–1.5 h** / cut |
| G-QA-03 | 15–30 min unscripted buyer-like session | P1 | **20–30 m** / session |
| G-QA-04 | Add `/showcase/claims-intake-modernization` to controlled-beta acceptance checklist | P1 | **30–45 m** (after **TB-887**/**TB-888**) |
| G-QA-05 | Quick Scan public-safety gate on controlled-beta checklist (**TB-902**) | P0 | **30–45 m** (after **TB-902** report) |
| G-QA-06 | Monthly App Insights Web Vitals review (LCP/INP/CLS on review routes) | P1 | **20–30 m** / month |
| G-QA-07 | Pre-cut UI performance triage — First Load JS CI green + bundle vs API | P1 | **15–30 m** / cut |
| G-SCALE-01 | Staging scale-rule micro-drills A/B/(C) before launch load (**TB-946**) | P1 | **1–2 h** (after **TB-915** on staging) |
| G-SCALE-02 | Run TB-905 launch-load half; record which scale rule was hot | P1 | **1–1.5 h** (after **G-SCALE-01** pass) |
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

### Founder UI quality acceptance (M-96–M-106) + UI performance triage (M-112)

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
| M-108 | Capture showcase screenshots for **M-07** / **M-16** / paid (after **TB-887**/**TB-888**; prefer after **M-133**) | P1 | **30–45 m** (subset of **M-07** gallery) |
| M-109 | Quick Scan sample-result content + capacity-state copy review | P0 | **1–2 h** (pairs **TB-900**) |
| M-110 | Owner decision — enable anonymous Quick Scan AI publicly (after **TB-902**) | P0 | **30–60 m** decision |
| M-112 | UI performance triage playbook in founder acceptance routine (CWV → LH → bundle → SQL) | P1 | **45–90 m** |
| M-113 | Principal architect falsification script (isolation + audit/manifest + Real/Simulator) | P1 | **Done** (authored 2026-07-22; ~45–90 m to *run* live) |
| M-114 | Security-reviewer isolation one-pager | P1 | **Done** (authored 2026-07-22) |
| M-115 | Buyer-safe LLM prompt-injection posture one-pager (confinement, not “filter the PDF”) | P1 | **45–90 m** |
| M-116 | Prompt-injection honesty bullets in `WHAT_NOT_TO_PROMISE` + security procurement packet | P1 | **30–45 m** |
| M-117 | Audit Required vs informational claim honesty (`WHAT_NOT_TO_PROMISE` / procurement) | P1 | **45–90 m** |
| M-118 | Security-reviewer audit trail one-pager (Required fail-closed vs informational best-effort) | P1 | **45–90 m** |
| M-119 | Solo-operator MVO observability claim honesty (`WHAT_NOT_TO_PROMISE` / procurement) | P1 | **30–45 m** |
| M-120 | Founder P0 page-path drill cadence (solo-ops MVO) | P1 | **45–90 m** |
| M-121 | ACA Worker LLM interrupt claim honesty (no exactly-once / no zero duplicate spend) | P1 | **30–45 m** |
| M-122 | Interrupted-review buyer/PA one-pager (replica death → resume UX) | P1 | **45–90 m** |
| M-123 | Execution-failure vs quality-outcome claim honesty (HOLD ≠ outage) | P1 | **30–45 m** |
| M-124 | Model-failed vs quality-rejected PA/buyer one-pager | P1 | **45–90 m** |
| M-125 | Hostile-internet webhook claim honesty (order ≠ internet-safe; signed ≠ fully hardened) | P1 | **30–45 m** |
| M-126 | Security-reviewer inbound webhook one-pager | P1 | **45–90 m** |
| M-127 | INV-002 execution-mode claim honesty (Mixed/cache/Fallback; never promote → Real) | P1 | **30–45 m** |
| M-128 | Sponsor/PA execution-mode honesty one-pager (within-run Mixed ≠ ROI period mix) | P1 | **45–90 m** |
| M-129 | Quality-gate version / historical immutability claim honesty (pass ≠ eternal; no silent re-grade) | P1 | **30–45 m** |
| M-130 | PA quality-gate versioning + wrong-definition remediation one-pager | P1 | **45–90 m** |
| M-131 | INV-004 LLM budget reserve/settle claim honesty (cap-correct ≠ crash-proof settle / no race soft-DoS denial) | P1 | **30–45 m** |
| M-132 | PA LLM budget concurrency + crash semantics one-pager | P1 | **45–90 m** |
| M-133 | Owner ratify showcase Option D — generic intake primary + healthcare secondary; no Contoso buyer naming | P1 | **30–60 m** decision + doc note |
| M-134 | Align `/see-it` + `/demo/preview` labels to backing data (after **M-107**/**M-133**) | P1 | **45–90 m** |
| M-135 | Showcase naming hierarchy — scenario-first; ban Contoso/Northwind buyer-facing org names | P1 | **45–90 m** |
| M-136 | Lightweight scenario validation — framing variants + opportunistic reactions (ride **G-REAL-06**/**G-REAL-07**) | P1 | **1–2 h** (+ existing cohort calendar) |
| M-137 | Trademark screen for optional fictional org (Northstar / HarborPoint) — narrative copy only | P2 | **30–60 m** |
| M-138 | Simulator-derived ROI/savings forbid claim honesty (`WHAT_NOT_TO_PROMISE` / procurement) | P1 | **30–45 m** |
| M-139 | PA Simulator-ROI sponsor forbid one-pager | P1 | **45–90 m** |
| M-140 | Finding concurrent disposition race claim honesty (append-only ≠ approval-request CAS) | P1 | **30–45 m** |
| M-141 | PA finding approve/reject race one-pager | P1 | **45–90 m** |
| M-142 | Solo-ops single-tenant miss claim honesty (fleet P0 ≠ pages before every ticket) | P1 | **30–45 m** |
| M-143 | PA solo-operator pages vs support-email one-pager | P1 | **45–90 m** |
| M-144 | Outbox at-least-once / no exactly-once delivery claim honesty | P1 | **30–45 m** |
| M-145 | PA transactional outbox replay vs consumer idempotency one-pager | P1 | **45–90 m** |
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

**Suggested near-term focus (highest leverage / hour for this profile):** **G-REAL-06 → G-REAL-07** (unlocks Stage 1) · **M-107** + **M-133** → **M-134** (showcase funnel coherence — hours, not weeks) · run **M-113** script before next PA review (docs Done) · **M-115**/**M-116** + engineering **TB-949**–**TB-952** (prompt-injection confinement story) · **M-117**/**M-118** + engineering **TB-953**–**TB-956** (audit Required fail-closed story) · **G-COMMERCE-01 → M-34 → G-COMMERCE-02** (first invoice path) · **M-07 → M-16 → M-09** (credibility assets) · **G-QA-01 → M-96–M-98** (founder acceptance loop) · **TB-915 → G-SCALE-01 → G-SCALE-02** (autoscale bake-off before launch load).

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

1. Before each new motion expansion, score **G1–G6** as PASS/HOLD using the [claim readiness status appendix](CLAIM_READINESS_STATUS.md#appendix-gate-passhold-criteria) or pilot review notes.
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
| G-REAL-06 | Execute three committed real-mode pilot runs (Run 1–3) per [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md) | Owner | P0 | Not started | Stage 1 exit gate **G4**; assessment Tier 1 **#2** remainder (market-execution half); pilot stack must be PilotStrict **Real** — not a coding-agent task. Canonical owner home for historical tech-backlog **TB-141** (run half; **TB-141** removed from `TECH_BACKLOG.md` 2026-07-19). Before PA tech reviews, also run [`PRINCIPAL_ARCHITECT_FALSIFICATION_SCRIPT.md`](PRINCIPAL_ARCHITECT_FALSIFICATION_SCRIPT.md) (**M-113**) — does not replace these three runs |
| G-REAL-07 | Collect proof packets per run (`collect-first-pilot-proof.ps1 -SponsorHandoff -FailOnHold`); append [`PROOF_PACKET_RUN_LOG.md`](PROOF_PACKET_RUN_LOG.md) | Owner | P0 | Not started | **G4**; use `-CompareBaseRunId` for Run 3; founder signoff required for Stage 0 → 1 per [`REAL_MODE_EVIDENCE_COHORT.md`](../runbooks/REAL_MODE_EVIDENCE_COHORT.md). Canonical owner home for historical tech-backlog **TB-141** (packet/archive half). Claim-3 in **M-113** points here for Real-mode proof |
| G-REAL-08 | Attach committed gate JSON to next RC release evidence bundle per [`RELEASE_CLAIM_GATE.md`](../quality/RELEASE_CLAIM_GATE.md) | Owner | P1 | Not started | Gate source committed; run `Emit-ReleaseReadinessEvidence.ps1` on RC cut |
| G-REAL-09 | **Live DOCX visual check of Workspace B export (~10 min)** — the check deliberately **waived** at the G-REAL-04/M-06 sign-off (2026-07-19). **Do before the first live demo (M-19) or demo-video recording (M-16).** Steps: (1) sign in to the operator UI; (2) open the Workspace B committed run at `/reviews/61c60d76-2b80-93f9-46bb-2f66fd608b9b`; (3) run the **DOCX export** (PDF optional) using the seeded whitelabel pre-fill (**Meridian Advisory Group** / **Alpine Health — AI Governance Engagement**); (4) open the generated file and visually verify: all **9 committed findings** render with severity, `PolicyRuleId` (e.g. `ai-gov-002`, `sec-base-006`) and rationale; **decision dispositions** appear (REMEDIATE / ACCEPT_RISK / WAIVE_CONDITIONAL / DEFER plus the 3 Pending rows that support the "explicit limits" claim); whitelabel firm/engagement strings render correctly; section flow matches the six-stage landing narrative (Capture → Evidence → Review → Findings → Decisions → Report); no seed placeholder text, broken formatting, or copy implying **live agent traces** (Workspace B is seed-backed — `AiGovernanceSeed` / `SecurityBaselineSeed`) | Owner | P1 | Not started | Why it exists: the M-06 agent review ([`M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md`](M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md) §2/§5) was a **static seed/fixture-vs-copy diff** — nobody has viewed the rendered DOCX; in-repo samples (`docs/go-to-market/samples/`) use **Contoso/Northwind** branding, so this is the first Meridian/Alpine visual. Context: [`DEMO_WORKSPACES.md`](DEMO_WORKSPACES.md) Workspace B §Whitelabel. If defects found: cosmetic → defect log (**M-101**); claim-affecting → route through **M-09** copy or the engineering backlog before demos |
| G-REAL-05 | CPA SOC 2 CPA program kickoff (historical **TB-135**) — organizational, not engineering | Owner | V1.1 | Not started | Owner-execution home; tech **TB-135** Done (tracking closed in `TECH_BACKLOG.md`); zero `(A)` weight per `Assessment-Scope-V1_1.mdc` |
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
| G-QA-06 | Monthly review of App Insights `WebVitalsMetric` (LCP / INP / CLS) for `/reviews`, `/reviews/[runId]`, and `/governance` — note regressions; open or prioritize **TB-933**–**TB-935** when field CWV is bad, **TB-929**/**TB-930** when TTFB/network wait dominates | Owner | P1 | Not started | Instrumentation **TB-692** Done; playbook **M-112**; does not require raising Lighthouse hard gates |
| G-QA-07 | Before each controlled cut: confirm First Load JS CI (`check:first-load-js` / `ui-static-quality`) is green, and if operators report “slow UI,” triage per **M-112** (bundle vs API/SQL) before requesting more `dynamic()` work | Owner | P1 | Not started | Fold into **G-QA-02** checklist when **M-101** ships; engineering targets **TB-933**–**TB-935** / **TB-929**/**TB-930** |
| G-SCALE-01 | On staging, run single-signal scale micro-drills **A** (HTTP/LLM-wait), **B** (CPU-bound), and **C** (worker backlog if queue/prom scaling enabled) per **TB-946**; record time-to-first-extra-replica and dominant rule; **do not** start the TB-905 launch-load half until A and B pass | Owner | P1 | Not started | Depends on engineering **TB-915** applied to staging + **TB-946** harness/docs; pairs **TB-947** (AOAI TPM ceiling). Autoscale discussion 2026-07-22 |
| G-SCALE-02 | After **G-SCALE-01** pass: execute the **launch load** half of **TB-905** against staging; append `LAUNCH_LOAD_DRILL.md` with throughput **and** which scale rule was hot (HTTP vs CPU vs worker); note AOAI 429 / breaker opens if any | Owner | P1 | Not started | Closes launch-load evidence for **TB-905** (geo-failover half remains separate); runbook `TB-905_STAGING_RELIABILITY_DRILL.md` |

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
**Owner cadence rows:** **G-QA-01**–**G-QA-07** (engineering-adjacent table above)  
**Already shipped (do not rebuild):** GitHub Playwright estate (mock / live / a11y / visual / UX-audit), warn-only lab Lighthouse CI ([`../architecture/UI_LIGHTHOUSE_CI.md`](../architecture/UI_LIGHTHOUSE_CI.md)), journey specs such as `live-api-journey` / buyer golden path, field Web Vitals (**TB-692**), First Load JS gate (**TB-573**/**TB-691**).

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
| M-112 | **UI performance triage playbook** — extend [`FOUNDER_UI_ACCEPTANCE_ROUTINE.md`](../architecture/FOUNDER_UI_ACCEPTANCE_ROUTINE.md) with a short decision tree: (1) App Insights `WebVitalsMetric` LCP/INP/CLS by route → (2) remote/lab Lighthouse (**M-99** / **TB-693**) → (3) First Load JS / `build:analyze` (**TB-933**–**TB-934**) → (4) if CWV fine but waiting on network, API/SQL (**TB-929**/**TB-930**). Link from **G-QA-06**/**G-QA-07** and **M-101** checklist | Content + Engineering | P1 | Not started | Owner UI-performance discussion 2026-07-22; does not reopen Done **TB-691**–**TB-698**; complements **M-99** (lab) without new hard score gates |
| M-113 | **Principal architect falsification script** — 30–45 min live script: (1) forge isolation headers, (2) finding → evidence → export/verify, (3) Real vs Simulator mode badge. Artifact: [`PRINCIPAL_ARCHITECT_FALSIFICATION_SCRIPT.md`](PRINCIPAL_ARCHITECT_FALSIFICATION_SCRIPT.md) | Content | P1 | **Done** | Authored **2026-07-22**; does **not** replace **G-REAL-06**/**G-REAL-07** / **M-39**; optional Claim-4 addendum after **M-115** |
| M-114 | **Security-reviewer isolation one-pager** — buyer-safe G3 handout; complements [`TENANT_ISOLATION.md`](TENANT_ISOLATION.md). Artifact: [`SECURITY_REVIEWER_ISOLATION_ONE_PAGER.md`](SECURITY_REVIEWER_ISOLATION_ONE_PAGER.md) | Content | P1 | **Done** | Authored **2026-07-22**; pairs **TB-925** (Done) |
| M-115 | **Buyer-safe LLM prompt-injection posture one-pager** — honest claim: agents must read customer docs/repo as **DATA**; resistance = host confinement (tool allowlists, structured evidence, no exfil), Content Safety as gate not product; residual risk stated. Artifact: `PROMPT_INJECTION_RESISTANCE_BUYER_ONE_PAGER.md` (new) | Content | P1 | Not started | Engineering **TB-949**–**TB-952**; complements **M-114**; cite Content Safety + **TB-082** Done without overclaiming |
| M-116 | **Prompt-injection honesty in claim guardrails** — add “do not promise” / “do promise” bullets to [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) and a short row in [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](BUYER_SECURITY_PROCUREMENT_PACKET.md) (no “prompt-injection proof” / no “we sanitize architecture PDFs”) | Content | P1 | Not started | Pairs **M-115**; keep Stage 0 language aligned with [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) |
| M-117 | **Audit Required vs informational claim honesty** — add “do not promise” / “do promise” bullets: Required governance/finalize/identity/export events are fail-closed durable trail; cost/projection/funnel telemetry may be best-effort. Touch [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) and a short row in [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](BUYER_SECURITY_PROCUREMENT_PACKET.md) (no “every audit event is transactional”) | Content | P1 | Not started | Engineering **TB-953**–**TB-956**; pairs **M-118**; keep Stage 0 language aligned with [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md); does **not** reopen **TB-001** informational posture |
| M-118 | **Security-reviewer audit trail one-pager** — buyer-safe handout: which events are Required (fail-closed) vs informational (best-effort); how to verify a governance disposition left a durable trail; residual dual-write risk until **TB-956**. Artifact: `SECURITY_REVIEWER_AUDIT_TRAIL_ONE_PAGER.md` (new) | Content | P1 | Not started | Complements **M-114**; cite INV-003 + **TB-953** without claiming same-TX until **TB-956** ships |
| M-119 | **Solo-operator MVO observability claim honesty** — add “do not promise” / “do promise” bullets: P0 catalog ≠ enabled paging path; no second SRE platform claim. Touch [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) and a short row in [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](BUYER_SECURITY_PROCUREMENT_PACKET.md) | Content | P1 | Not started | Engineering **TB-957**–**TB-959**; pairs **M-120**; keep Stage 0 language aligned with [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) |
| M-120 | **Founder P0 page-path drill cadence** — short ops ritual: verify AMW scrape + action-group page once per release cut; log pass/fail; cite [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](../operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md) (**TB-957** Done — engineering checklist). Artifact note in `FOUNDER_UI_ACCEPTANCE_ROUTINE.md` | Owner process | P1 | Not started | Engineering **TB-957** Done; does not invent a second observability stack |
| M-121 | **ACA Worker LLM interrupt claim honesty** — no “exactly-once LLM,” no “zero duplicate spend on replica death”; resume skips persisted `(RunId,TaskId)` only. Touch [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) / procurement packet | Content | P1 | Not started | Engineering **TB-960**–**TB-962** (binds **TB-937**–**TB-943**); pairs **M-122**; does **not** invent **G-REAL-06**/**G-REAL-07** |
| M-122 | **Interrupted-review buyer/PA one-pager** — what buyers see (In progress → Ready / Needs attention) when Worker replica dies mid-run; lease resume; which spend is not re-billed. Artifact: `INTERRUPTED_REVIEW_BUYER_ONE_PAGER.md` (new) | Content | P1 | Not started | Complements **M-113** Claim-3; cite **TB-960** contract + Done **TB-039**/**TB-201** without overclaiming provider refunds |
| M-123 | **Execution-failure vs quality-outcome claim honesty** — HOLD/quality reject ≠ platform outage; no “perfect AI quality” promise. Touch [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) / procurement packet | Content | P1 | Not started | Engineering **TB-963**–**TB-965**; pairs **M-124**; sibling of **TB-944** language |
| M-124 | **Model-failed vs quality-rejected one-pager** — PA/buyer handout: transport/parse/timeout vs qualityGate; what is persisted for later audit. Artifact: `MODEL_FAILED_VS_QUALITY_REJECTED_ONE_PAGER.md` (new); optional **M-113** Claim-4 addendum | Content | P1 | Not started | Engineering **TB-963**–**TB-965**; does not reopen Done **TB-684** PilotStrict defaults |
| M-125 | **Hostile-internet webhook claim honesty** — pipeline order in docs ≠ internet-safe by itself; signed ≠ replay/DoS hardened. Touch [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) / procurement packet | Content | P1 | Not started | Engineering **TB-966**–**TB-968**; pairs **M-126**; does not claim Front Door Network Protection as app-layer complete |
| M-126 | **Security-reviewer inbound webhook one-pager** — PA-defensible order (rate → size → verify → parse), bounded body, ITSM replay gap until **TB-968**. Artifact: `SECURITY_REVIEWER_INBOUND_WEBHOOK_ONE_PAGER.md` (new) | Content | P1 | Not started | Complements **M-114**; cite INV-015 / **TB-012** Done + **TB-966** without overclaiming |
| M-127 | **INV-002 execution-mode claim honesty** — Mixed reserved/auto-rules; cache ≠ Simulator; never promote Mixed/Fallback→Real; within-run Mixed ≠ ROI period mix. Touch [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) / procurement packet | Content | P1 | Not started | Engineering **TB-969**–**TB-971**; pairs **M-128**; keep **M-113** Claim-3 aligned |
| M-128 | **Sponsor/PA execution-mode honesty one-pager** — when a package is Real vs Mixed vs Simulator/Fallback; how cache is disclosed; how to read ROI period mix footnotes (**TB-239**). Artifact: `EXECUTION_MODE_HONESTY_ONE_PAGER.md` (new) | Content | P1 | Not started | Engineering **TB-969**–**TB-971**; complements **M-113** Claim-3; does **not** replace **G-REAL-06**/**G-REAL-07** |
| M-129 | **Quality-gate version / historical immutability claim honesty** — quality pass is as-of gate definition version, not eternal AI correctness; threshold upgrades do not silently re-grade history; advisory “as if today” ≠ recorded decision. Touch [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) / procurement packet | Content | P1 | Not started | Engineering **TB-972**–**TB-974**; pairs **M-130**; keep Stage 0 language aligned with [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) |
| M-130 | **PA quality-gate versioning + wrong-definition remediation one-pager** — recorded vs advisoryCurrent; upgrade immutability; deprecate / re-execute / append-only supersede (never silent UPDATE). Artifact: `QUALITY_GATE_VERSIONING_PA_ONE_PAGER.md` (new) | Content | P1 | Not started | Engineering **TB-972**–**TB-974**; complements **M-124** / **M-113**; does **not** claim perfect gate calibration |
| M-131 | **INV-004 LLM budget reserve/settle claim honesty** — durable SQL + optimistic concurrency prevents multi-replica hard-cap bypass; does **not** promise crash-proof settle, zero orphan reserved USD, or immunity to assumed-max race soft-DoS. Touch [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) / procurement packet | Content | P1 | Not started | Engineering **TB-975**–**TB-977**; pairs **M-132**; keep Stage 0 language aligned with [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) |
| M-132 | **PA LLM budget concurrency + crash semantics one-pager** — reserve/settle under replica death, month-boundary clock, and racing requests; what is guaranteed today vs after **TB-976**/**TB-977**. Artifact: `LLM_BUDGET_RESERVE_SETTLE_PA_ONE_PAGER.md` (new) | Content | P1 | Not started | Engineering **TB-975**–**TB-977**; cite INV-004 / Quick Scan **TB-894** without claiming provider exactly-once billing |
| M-107 | **Public proof-funnel IA decision** — owner documents whether `/showcase/claims-intake-modernization`, `/see-it`, or `/demo/preview` is the canonical anonymous proof path (or honest co-primary pair); align get-started healthcare vertical, SEO/paid landing targets, and welcome CTAs | Owner | P1 | Not started | Assessment §21 **SC-04**; portfolio assessment [`showcase_scenario_strategy_assessment_2026_07_23.md`](../architecture/showcase_scenario_strategy_assessment_2026_07_23.md) F-01; pairs **M-133**/**M-134**; engineering **TB-887**/**TB-888** Done; unblocks **M-108** and honest **M-09** proof copy |
| M-108 | **Showcase screenshot capture** — add `/showcase/claims-intake-modernization` frames to **M-07** gallery / **M-16** B-roll after static-first + illustrative-sample copy ship; **after naming settles** (**M-133**/**M-135**) if primary scenario changes for creatives | Production | P1 | Not started | **TB-887**/**TB-888** Done; subset effort of **M-07**; prefer after **M-107**/**M-133** so creatives match ratified funnel |
| M-133 | **Owner ratify showcase Option D** — document decision: **Enterprise Customer Intake Modernization** as long-term primary; **Healthcare Claims Intake Modernization** retained as secondary regulated-depth example; **no Contoso** (or Northwind) as buyer-facing showcase organization; controlled beta may stay on Claims spine until **TB-981**. Artifact: short owner note in assessment or `DEMO_PREVIEW.md` | Owner | P1 | Not started | Assessment 2026-07-23 §17–§19 (weighted winner Option D = 77); engineering **TB-978**–**TB-982**; pairs **M-107**; does **not** authorize rename-in-place |
| M-134 | **Align `/see-it` + `/demo/preview` labels to backing data** — today banners/titles say Healthcare/Claims Intake while `GET /v1/demo/preview` is Contoso-backed; after **M-107**/**M-133**, make labels match data (or change data to match labels) so one funnel is not two fictional universes | Copy + IA | P1 | Not started | Assessment F-01; hours-scale fix; blocks honest **M-09** / paid creatives; engineering may help but owner IA first |
| M-135 | **Showcase naming hierarchy** — adopt scenario-first terms (Showcase / scenario name / sample review / illustrative sample); ban Contoso/Northwind in buyer-facing showcase/marketing org naming; optional fictional org only in narrative copy (never routes/IDs); update `COPY_TERMINOLOGY_AUDIT.md` / demo scripts as needed | Content | P1 | Not started | Assessment §11 / §5; engineering **TB-980**/**TB-982**; pairs **M-137** if a fictional org is desired |
| M-136 | **Lightweight scenario validation** — before **TB-981** default flip: (a) use **TB-978** scenario-tagged funnel rates; (b) 1–2 LinkedIn/landing framing variants; (c) 3–5 opportunistic architect reactions via existing conversations / **G-REAL-06**/**G-REAL-07** — **no** new formal cohort program | Owner + Content | P1 | Not started | Assessment §16; rides existing GTM V1.1 rows; engineering **TB-978** prerequisite for quantitative half |
| M-137 | **Trademark screen for optional fictional org** — if narrative copy needs a company name, screen Northstar Group / HarborPoint (avoid Contoso, Northwind, Meridian — last already used in-repo); document go/no-go | Owner | P2 | Not started | Assessment §5 / Q5; only if **M-135** chooses to use an org name; not required for scenario-first UI |
| M-138 | **Simulator-derived ROI/savings forbid claim honesty** — do not promise customer-realized $ from Simulator/demo/HOLD baselines; labeled estimates ≠ outcomes; external send still requires Real + sponsor-safe baselines. Touch [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) / procurement packet | Content | P1 | Not started | Engineering **TB-983**–**TB-985**; pairs **M-139**; keep Stage 0 language aligned with [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) G1/G2; complements **M-127**/**M-128** (execution mode) without duplicating |
| M-139 | **PA Simulator-ROI sponsor forbid one-pager** — when dollars/% are forbidden vs estimate-only; demo/HOLD/unlabeled Simulator; Email-to-sponsor vs PDF asymmetry until **TB-984**. Artifact: `SIMULATOR_ROI_SPONSOR_FORBID_ONE_PAGER.md` (new) | Content | P1 | Not started | Engineering **TB-983**–**TB-985**; cite Done **TB-239** / first-value ROI gate / `SPONSOR_CLAIM_LABEL_AUDIT` Rule 2; complements **M-113** Claim-3 |
| M-140 | **Finding concurrent disposition race claim honesty** — do not promise that finding approve/reject is mutually exclusive first-wins like the governance approval queue; dispositions are append-only (both persist; current = latest by time) unless **TB-986** option B ships a mutex. Touch [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) / procurement / operator guide language that conflates “approve finding” with approval-request finalize | Content | P1 | Not started | Engineering **TB-986**–**TB-988**; pairs **M-141**; keep Stage 0 language aligned with [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md); does not weaken approval-request CAS claims |
| M-141 | **PA finding approve/reject race one-pager** — conflict rule + durable outcome for racing operators on the same finding; contrast approval-request Serializable CAS (409 loser) vs finding trail last-by-time; ITSM `HumanReviewStatus` last-writer. Artifact: `FINDING_CONCURRENT_DISPOSITION_RACE_PA_ONE_PAGER.md` (new) | Content | P1 | Not started | Engineering **TB-986**–**TB-988**; cite `FindingDispositionService` / `TryTransitionFromReviewableAsync`; complements **M-117**/**M-118** (audit) without claiming finding mutex today |
| M-142 | **Solo-ops single-tenant miss claim honesty** — do not promise that every tenant-affecting failure pages the founder before a support ticket; fleet MVO P0s (when enabled) ≠ per-tenant stuck-run or review-path canary until **TB-958**/**TB-959**; Report Problem remains inbox-by-design. Touch [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) / procurement packet; extend **M-119** bullets with the single-tenant gap | Content | P1 | Not started | Engineering **TB-989**–**TB-991**; pairs **M-143**; complements **M-119**/**M-120** without duplicating Portal Test cadence |
| M-143 | **PA solo-operator pages vs support-email one-pager** — which failures page (critical AG), which are ops email-only, which arrive as Report Problem / support inbox, and what remains customer-first until **TB-958**/**TB-959**. Artifact: `SOLO_OPERATOR_PAGES_VS_SUPPORT_EMAIL_PA_ONE_PAGER.md` (new) | Content | P1 | Not started | Engineering **TB-989**–**TB-991**; cite [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](../operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md) + **TB-957** Done; does not claim production paging without **M-120** log |
| M-144 | **Outbox at-least-once / no exactly-once delivery claim honesty** — do not promise exactly-once integration events or side effects; publish-then-crash before `MarkProcessed` re-drains; SB duplicate detection is a short window; consumers must be idempotent. Touch [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) / procurement / integration catalog language | Content | P1 | Not started | Engineering **TB-992**–**TB-994**; pairs **M-145**; complements **M-121** (LLM interrupt / spend) without conflating bus delivery with agent billing |
| M-145 | **PA transactional outbox replay vs consumer idempotency one-pager** — crash after publish (or work) before mark; what is replay-safe vs must be idempotent; stable `MessageId`; internal SQL outboxes. Artifact: `TRANSACTIONAL_OUTBOX_REPLAY_IDEMPOTENCY_PA_ONE_PAGER.md` (new) | Content | P1 | Not started | Engineering **TB-992**–**TB-994**; cite ADR 0004/0043/0044 + `IntegrationEventOutboxProcessor`; does not claim DTF exactly-once (**TB-924**) |

**Suggested implementation order:** **G-QA-01** → **M-96** → **M-97** → **M-98** → **M-104** / **M-105** → **M-99** → **M-112** (perf triage playbook) → **M-101** → **G-QA-04** → **M-107** + **M-133** → **M-134** → **M-135** → **TB-978** → **M-108** → **M-136** (with **TB-979**/**TB-980**) → **TB-981** → **M-106** (first dry-run) → ongoing **M-100** + **M-102** / **G-QA-03** + **G-QA-06** (monthly CWV) / **G-QA-07** (pre-cut); add **M-103** once the local/staging founder suite is stable. Engineering bundle cuts: **TB-933** → **TB-934** → **TB-935** (only when field CWV or First Load JS evidence says so). Showcase portfolio engineering: **TB-978** → **TB-979** → **TB-980** → **TB-981** → **TB-982**.

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
| M-91 | Run a **red-team procurement objection rehearsal** per `CONTROLLED_PILOT_OBJECTION_DRILL.md` and `PROCUREMENT_OBJECTION_PLAYBOOK.md`: require SOC 2, external pen test, data residency, DPA, subprocessors, deletion, and Azure access answers; measure whether the honest V1 posture (`trust-center.md`, SOC self-assessment, SOC roadmap) earns a pilot exception | V1.1 | Current assessment Improvement #5 moved to the GTM V1.1 backlog. The V1 trust-center, SOC self-assessment, SOC roadmap, CAIQ/SIG/DPA, and objection playbooks already ship. This row is **market-execution** — a live procurement red-team with human reviewers — which a coding agent cannot perform. Do not list as assessment §17; do not treat absence of a completed rehearsal as an (A) V1 headline-readiness penalty |
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
