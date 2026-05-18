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

## V1 Marketing Backlog

### Phase 1 — Demo and messaging foundation (Days 1–15)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-01 | Finalize one-sentence positioning tagline and update `POSITIONING.md` | Copy | P0 | Done | None — `POSITIONING.md` exists as basis |
| M-02 | Write one-minute verbal pitch (elevator script) | Copy | P0 | Not started | None — `EXECUTIVE_SPONSOR_BRIEF.md` as basis |
| M-03 | Write five-minute demo script aligned to marketing vocabulary (Capture → Evidence → Review → Findings → Decisions → Report) | Copy | P0 | Not started | None — `DEMO_VIDEO_SCRIPT.md` exists; validate against Workspace A/B flows |
| M-04 | Verify self-demo workspace (Workspace A — ArchLucid reviews ArchLucid) passes Playwright smoke | QA sign-off | P0 | Not started | **Improvement #30 — COMPLETED (2026-05-17)** |
| M-05 | Verify synthetic regulated scenario workspace (Workspace B — AI governance + cloud posture) passes Playwright smoke | QA sign-off | P0 | Not started | **Improvement #30 — COMPLETED (2026-05-17)** |
| M-06 | Download and review generated sample architecture review report from Workspace B; confirm section coverage matches landing-page narrative | Content review | P0 | Not started | **Improvement #28 — COMPLETED (2026-05-17)** |
| M-07 | Capture 6–8 polished screenshots across the full operator workflow (Capture, Evidence, Review, Findings, Decisions, Report, whitelabeled export) | Production | P0 | Not started | **Improvement #30 — COMPLETED (2026-05-17)** |
| M-08 | Review and align `POSITIONING.md` "audit chain / signed manifest" differentiator language; ensure it appears in the one-minute pitch and demo script | Copy | P0 | Not started | **Finding-confidence UX** in review UI (**engineering backlog**) — aligns differentiability copy |

### Phase 2 — Public credibility (Days 16–30)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-09 | Landing page full content — hero copy, problem/solution sections, core workflow narrative, use cases (5 of 6; *exclude* CAF landing-zone pack claim until V1.1), proof section | Copy + UI | P1 | Not started | **Improvements #31 + #32 — COMPLETED (2026-05-17)** |
| M-10 | LinkedIn post 1: "Architecture review is broken — diagrams are not evidence" | Content | P1 | Not started | None |
| M-11 | LinkedIn post 2: "Architecture decisions need provenance — not just Confluence pages" | Content | P1 | Not started | None |
| M-12 | LinkedIn post 3: "Why AI-assisted architecture review needs human signoff" | Content | P1 | Not started | None |
| M-13 | LinkedIn post 4: "The next architecture artifact is the evidence graph" | Content | P1 | Not started | None |
| M-14 | LinkedIn post 5: "Why regulated teams need reviewable architecture records" | Content | P1 | Not started | None |
| M-15 | Publish long-form article: "Architecture Review Is Broken: Why Diagrams Are Not Evidence" | Content | P1 | Not started | None — draft from `POSITIONING.md` + `COMPETITIVE_LANDSCAPE.md` |
| M-16 | Create one short demo video (screen recording of Workspace A self-demo flow) | Production | P1 | Not started | **Improvement #30 — COMPLETED (2026-05-17)** |

### Phase 3 — Early conversations (Days 31–60)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-17 | Build outreach list: 20 architects / CTOs / security leaders (LinkedIn network, former colleagues — avoid employer conflicts and NDA-covered clients) | Outreach | P2 | Not started | None |
| M-18 | Send 20 outreach messages: offer 10-minute demo + feedback call (not a sales pitch) | Outreach | P2 | Not started | M-09 (landing page live), M-16 (demo video available) |
| M-19 | Run 5–10 live demos against Workspace A and Workspace B | Sales | P2 | Not started | **Improvement #30 — COMPLETED (2026-05-17)**; M-03 (demo script) |
| M-20 | Track objections from demos; refine one-sentence positioning and demo script | Copy iteration | P2 | Not started | M-19 (demos must start) |
| M-21 | Identify the one strongest buyer segment from demo feedback | Positioning | P2 | Not started | M-20 |
| M-34 | Align SOWs / `ORDER_FORM_TEMPLATE.md` drafts and outreach talk track to named SKUs in `SERVICE_LED_OFFERS.md` (Readiness Review, Evidence Pack, ARB Report, Azure-first review) | Business | P2 | Not started | None — `SERVICE_LED_OFFERS.md` is canonical SKU list |

### Phase 4 — Monetization (Days 61–90)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-22 | Draft paid pilot offer (Option A: architecture review package using ArchLucid) — align scope and **SKU name** to **`SERVICE_LED_OFFERS.md`**; use `ORDER_FORM_TEMPLATE.md` as starting point; private quote bands may use indicative rows in that doc | Business | P3 | Not started | M-34 (recommended before first paid signature) |
| M-23 | Draft paid pilot offer (Option B: 30–60 day pilot with setup, demo workspace, review workflow, sample reports) — align deliverables to **`SERVICE_LED_OFFERS.md`** where overlapping | Business | P3 | Not started | M-34 (recommended) |
| M-24 | Create Upwork service listing: "AI Architecture Governance Review" (evidence-backed process + structured architecture review report) | Business | P3 | Not started | **Improvement #28 — COMPLETED (2026-05-17)** |
| M-25 | Create Upwork service listing: "Azure Architecture Readiness Review" (Azure extractor + security baseline + cost findings) | Business | P3 | Not started | **Improvement #29 — COMPLETED (2026-05-17)** |
| M-26 | Create Upwork service listing: "Architecture Decision Record Cleanup" (capture + decisioning flow) | Business | P3 | Not started | **Improvement #30 — COMPLETED (2026-05-17)** |
| M-27 | Run at least one paid pilot or Upwork engagement with ArchLucid as internal tool + demo asset | Business | P3 | Not started | M-22 or M-23; **`SERVICE_LED_OFFERS.md`** defines SKU names deliverables |
| M-28 | Request testimonial from any non-NDA-conflicted early user or pilot participant | Relationship | P3 | Not started | M-27 |

---

## V1.1 and V2 (do not pull forward)

| # | Task | Milestone | Reason deferred |
|---|------|-----------|-----------------|
| M-29 | Publish LinkedIn post on ServiceNow integration ("ArchLucid writes architecture findings back to your ServiceNow workflow") | **V1.1** | Waits on first-party ServiceNow program ([`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13), **Improvement #25**, and **P10** (developer instance) |
| M-30 | Publish CAF / Azure landing-zone use case claim with bundled curated policy pack | V1.1 | CAF pack deferred to V1.1 per **`V1_DEFERRED.md`** / **`V1_SCOPE.md`** §3; content roadmap rank **#1** in **[`POLICY_PACK_CONTENT_BACKLOG.md`](../library/POLICY_PACK_CONTENT_BACKLOG.md)** |
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
