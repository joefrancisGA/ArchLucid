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

## Service-led GTM baseline (planning)

**Captured 2026-05-17** — complements in-repo technical scope (**[`V1_SCOPE.md`](../library/V1_SCOPE.md)**, **`V1_DEFERRED.md`**, engineering backlog).

- **Wedge:** Sell a **buyable architecture review outcome** (evidence-backed report), not “complete platform” breadth on first touch. V1 product scope stays **`V1_SCOPE.md`**; GTM copy and SOWs lead with **pain → outcome → report**.
- **Named SKUs:** Canonical menu and indicative bands live in **[`SERVICE_LED_OFFERS.md`](SERVICE_LED_OFFERS.md)**. Upwork listings (M-24–M-26) and pilot drafts (M-22–M-23) should use those **names** and deliverables.
- **ICP (first revenue):** Mid-market CTO, fractional CTO, cloud consultant, regulated startup — faster cycle than Fortune 50 unless a sponsor already exists.
- **V1.1 commerce un-hold (Stripe live / Marketplace):** Engineering milestone remains **`V1_DEFERRED.md` §6b**; **calendar alone** does not force the flip — owner validates **repeatable purchasing motion** (this file's service-led baseline notes).
- **V2 roadmap:** Platform items in **`V1_DEFERRED.md`** (e.g. cross-tenant analytics, Redis baselines) stay **candidates** until paid engagements show which buyers actually pay for them.

---

## Proof-gated rollout criteria

**Captured 2026-05-29.** This section defines **when ArchLucid is safe to sell harder and broaden**, expanding on the service-led baseline's "demand signal before broader motion" stance and the **Most Important Truth** in **[`../assessments/LATEST.md`](../assessments/LATEST.md)**: *the product is pilot-ready, not oversell-ready.*

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

1. Before each new motion expansion, score **G1–G6** as PASS/HOLD in the pilot review notes.
2. Convert HOLDs into the corresponding engineering improvement (assessment **`LATEST.md` §9**) or owner action.
3. Use early pilots **deliberately** to manufacture G1–G4 evidence — the pilots are the proof factory, not just revenue.
4. Do **not** advance claims ahead of the gate; pace marketing copy to the highest fully-passed stage.

**Cross-refs:** **[`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md)** (claim guardrails), **[`COMMERCIAL_DECISION_PACKET.md`](COMMERCIAL_DECISION_PACKET.md)** (pilot deliverables), **[`../assessments/LATEST.md`](../assessments/LATEST.md)** (improvement IDs + impact), **`V1_DEFERRED.md` §6b–§6c** (deferred commerce/assurance).

---

## V1 Marketing Backlog

### Phase 1 — Demo and messaging foundation (Days 1–15)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-01 | Finalize one-sentence positioning tagline and update `POSITIONING.md` | Copy | P0 | Done | None — `POSITIONING.md` exists as basis |
| M-02 | Write one-minute verbal pitch (elevator script) | Copy | P0 | Done | `ELEVATOR_PITCH.md` written 2026-05-21 — 30-sec, 1-min, 2-min, and consulting-line variants — `EXECUTIVE_SPONSOR_BRIEF.md` as basis |
| M-03 | Write five-minute demo script aligned to marketing vocabulary (Capture → Evidence → Review → Findings → Decisions → Report) | Copy | P0 | Done | Five-minute live-call script added to `DEMO_VIDEO_SCRIPT.md` 2026-05-21; includes Q&A prompts |
| M-04 | Verify self-demo workspace (Workspace A — ArchLucid reviews ArchLucid) passes Playwright smoke | QA sign-off | P0 | Not started | **Improvement #30 — COMPLETED (2026-05-17)** |
| M-05 | Verify synthetic regulated scenario workspace (Workspace B — AI governance + cloud posture) passes Playwright smoke | QA sign-off | P0 | Not started | **Improvement #30 — COMPLETED (2026-05-17)** |
| M-06 | Download and review generated sample architecture review report from Workspace B; confirm section coverage matches landing-page narrative | Content review | P0 | Not started | **Improvement #28 — COMPLETED (2026-05-17)** |
| M-07 | Capture 6–8 polished screenshots across the full operator workflow (Capture, Evidence, Review, Findings, Decisions, Report, whitelabeled export) | Production | P0 | Not started | **Improvement #30 — COMPLETED (2026-05-17)** |
| M-08 | Review and align `POSITIONING.md` "audit chain / signed manifest" differentiator language; ensure it appears in the one-minute pitch and demo script | Copy | P0 | Not started | **Finding-confidence UX** in review UI (**engineering backlog**) — aligns differentiability copy |

### Phase 2 — Public credibility (Days 16–30)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-09 | Landing page full content — hero copy, problem/solution sections, core workflow narrative, use cases (include Azure WAF + CAF/LZ bundled packs with disclaimer), proof section | Copy + UI | P1 | In progress | **Improvements #31 + #32 — COMPLETED (2026-05-17)**; homepage copy/sections landed 2026-05-21 (`WelcomeMarketingPage` + modular sections). **Remaining:** owner sign-off, M-06 sample report review, M-07 screenshots, deploy. |
| M-10 | LinkedIn post 1: "Architecture review is broken — diagrams are not evidence" | Content | P1 | Not started | None |
| M-11 | LinkedIn post 2: "Architecture decisions need provenance — not just Confluence pages" | Content | P1 | Not started | None |
| M-12 | LinkedIn post 3: "Why AI-assisted architecture review needs human signoff" | Content | P1 | Not started | None |
| M-13 | LinkedIn post 4: "The next architecture artifact is the evidence graph" | Content | P1 | Not started | None |
| M-14 | LinkedIn post 5: "Why regulated teams need reviewable architecture records" | Content | P1 | Not started | None |
| M-15 | Publish long-form article: "Architecture Review Is Broken: Why Diagrams Are Not Evidence" | Content | P1 | Done | Full article draft in `LINKEDIN_CONTENT_V1.md` 2026-05-21 (~1,800 words + link-post); owner to publish. Was: None — draft from `POSITIONING.md` + `COMPETITIVE_LANDSCAPE.md` |
| M-16 | Create one short demo video (screen recording of Workspace A self-demo flow) | Production | P1 | Not started | **Improvement #30 — COMPLETED (2026-05-17)**. **Deferred (planning 2026-05-21):** record after M-04 smoke + M-07 screenshots; M-18 may use live demo until video exists. |

### Phase 3 — Early conversations (Days 31–60)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-17 | Build outreach list: 20 architects / CTOs / security leaders (LinkedIn network, former colleagues — avoid employer conflicts and NDA-covered clients) | Outreach | P2 | Not started | None |
| M-18 | Send 20 outreach messages: offer 10-minute demo + feedback call (not a sales pitch) | Outreach | P2 | Not started | M-09 (landing page live), M-16 (demo video available) |
| M-19 | Run 5–10 live demos against Workspace A and Workspace B | Sales | P2 | Not started | **Improvement #30 — COMPLETED (2026-05-17)**; M-03 (demo script) |
| M-20 | Track objections from demos; refine one-sentence positioning and demo script | Copy iteration | P2 | Not started | M-19 (demos must start) |
| M-21 | Identify the one strongest buyer segment from demo feedback | Positioning | P2 | Not started | M-20 |
| M-34 | Align SOWs / `ORDER_FORM_TEMPLATE.md` drafts and outreach talk track to named SKUs in `SERVICE_LED_OFFERS.md` (Readiness Review, Evidence Pack, ARB Report, Azure-first review) | Business | P2 | Not started | None — `SERVICE_LED_OFFERS.md` is canonical SKU list |
| M-35 | Author ARC-AMPE pack #24 (CMS ACA / Medicaid Partner Entities) — curated rules JSON, embedded bundle, manifest bump (23→24), appendix doc, disclaimer test — per **[`POLICY_PACK_ARC_AMPE_DESIGN.md`](../library/POLICY_PACK_ARC_AMPE_DESIGN.md)** | Content + engineering | P1 | Not started | LLM → critic → human pipeline (`POLICY_PACK_CONTENT_BACKLOG.md`); does not block landing page until content lands |

### Phase 4 — Monetization (Days 61–90)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-22 | Draft paid pilot offer (Option A: architecture review package using ArchLucid) — align scope and **SKU name** to **`SERVICE_LED_OFFERS.md`**; use `ORDER_FORM_TEMPLATE.md` as starting point; private quote bands may use indicative rows in that doc | Business | P3 | Not started | M-34 (recommended before first paid signature) |
| M-23 | Draft paid pilot offer (Option B: 30–60 day pilot with setup, demo workspace, review workflow, sample reports) — align deliverables to **`SERVICE_LED_OFFERS.md`** where overlapping | Business | P3 | Not started | M-34 (recommended) |
| M-24 | Create Upwork service listing: "AI Architecture Governance Review" (evidence-backed process + structured architecture review report) | Business | P2 | Not started | **Improvement #28 — COMPLETED (2026-05-17)** |
| M-25 | Create Upwork service listing: "Azure Architecture Readiness Review" (Azure extractor + security baseline + cost findings) | Business | P2 | Not started | **Improvement #29 — COMPLETED (2026-05-17)** |
| M-26 | Create Upwork service listing: "Architecture Decision Record Cleanup" (capture + decisioning flow) | Business | P2 | Not started | **Improvement #30 — COMPLETED (2026-05-17)** |
| M-27 | Run at least one Upwork engagement with ArchLucid as internal tool + demo asset | Business | P2 | Not started | M-24, M-25, or M-26; lean in to test production system. |
| M-36 | Run at least one paid pilot with ArchLucid as internal tool + demo asset | Business | P3 | Not started | M-22 or M-23; **`SERVICE_LED_OFFERS.md`** defines SKU names deliverables |
| M-28 | Request testimonial from any non-NDA-conflicted early user or pilot participant | Relationship | P3 | Not started | M-27 |

---

## V1.1 and V2 (do not pull forward)

| # | Task | Milestone | Reason deferred |
|---|------|-----------|-----------------|
| M-29 | Publish LinkedIn post on ServiceNow integration ("ArchLucid writes architecture findings back to your ServiceNow workflow") | **V1.1** | Waits on first-party ServiceNow program ([`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13), **Improvement #25**, and **P10** (developer instance) |
| M-30 | Publish CAF / Azure landing-zone use case claim with bundled curated policy pack | **V1 GA** | Pack ships seeded per **`DEFAULT_POLICY_PACKS_V1.md`** — marketing copy must keep **thematic mapping** disclaimer |
| M-31 | Solo architect self-serve SaaS pricing page (monthly tier bands per [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md) **section 5**) and public self-serve checkout | V2 | Stripe live keys deferred to V1.1; self-serve funnel deferred to V2; no public $ band in first 90 days per **[PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md)** (**Marketing alignment Q7**); prefer **demand signal** from service-led engagements before positioning self-serve as primary motion |
| M-32 | Reference customer / design partner case study publication | V1.1 | Depends on signed pilot and `reference-customers/PUBLICATION_CHECKLIST.md` clearance |
| M-33 | Cross-tenant portfolio ROI analytics marketing claim | V2 | Cross-tenant analytics deferred to V2 per `V1_DEFERRED.md` |

---

## Technical dependency map (marketing ↔ legacy engineering batches)

All V1 marketing gate improvements referenced below are **COMPLETED** as of **2026-05-17**. **M-29** is deferred to **V1.1** (first-party ServiceNow per `V1_SCOPE.md` §2.13); **P10** (ServiceNow developer instance) remains a validation unblocker.

> **Note on item numbers:** Rows use **legacy sprint improvement labels** (#19–#33) for team memory. **Shipping truth** is **`CHANGELOG`**, **`V1_SCOPE.md`**, and **`V1_DEFERRED.md`** — verify before treating a label as a live dependency.

| Legacy batch label | Status | Marketing tasks unblocked |
|---|---|---|
| **#26** — Operator UI vocabulary alignment | **COMPLETED (2026-05-17)** | All in-app copy and demo scripts use aligned vocabulary |
| **#27** — Bulk evidence upload (≤30 files) | **COMPLETED (2026-05-17)** | Landing page copy may disclose cap; M-19 demos show bulk capture |
| **#28** — DOCX/PDF export + consultant whitelabel | **COMPLETED (2026-05-17)** | M-06, M-24 |
| **#29** — Default policy packs (AI governance + security baseline) | **COMPLETED (2026-05-17)** | M-25, all policy-pack copy claims |
| **#30** — Two curated demo workspaces (Workspace A + B) | **COMPLETED (2026-05-17)** | M-04, M-05, M-07, M-16, M-19, M-26 |
| **#31** — Landing CTA stack (walkthrough / self-demo / early access) | **COMPLETED (2026-05-17)** | M-09 |
| **#32** — Marketing landing page content | **COMPLETED (2026-05-17)** | M-09 (fully unblocked) |
| **#33** — Superseded by #32 | **COMPLETED (2026-05-17)** | — |
| **#24** — Surface finding confidence + evidence links in review UI | Actionable (open) — verify in engineering backlog / UI release notes | Supports differentiability messaging for M-08 |
| **#19** — Progressive disclosure for advanced governance routes | Actionable (open) — verify in engineering backlog | Reduces demo cognitive-load risk during M-19 |
| **#25** — ServiceNow bi-directional sync (**V1.1** program) | **Blocked on P10** | M-29 — do not publish until **V1.1** connector milestone |
