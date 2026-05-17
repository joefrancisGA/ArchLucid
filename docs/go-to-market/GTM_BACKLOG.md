> **Scope:** Internal GTM execution backlog for V1 marketing activities — task owners, priorities, milestones, and technical dependencies; not a buyer-facing document and not a substitute for LATEST.md weighted readiness scoring.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# ArchLucid GTM Backlog

**Audience:** Founder and any marketing/GTM collaborators. Engineering reads this to understand which marketing tasks create or depend on technical work.

**How this file relates to [`docs/assessments/LATEST.md`](../assessments/LATEST.md):**
- **Technical tasks** (engineering, product) stay in `LATEST.md` as numbered improvement items. They affect the weighted readiness score and release checklist.
- **Marketing tasks** (content, copy, outreach, business) live here. They do not affect the readiness score.
- The **"Depends on"** column links marketing tasks to `LATEST.md` improvement numbers where a marketing activity cannot start or complete until engineering delivers.

**Priority definitions:**
- **P0** — Blocks GA launch or must complete in days 1–15 (demo and messaging foundation)
- **P1** — Complete in days 16–30 (public credibility layer)
- **P2** — Complete in days 31–60 (early conversations)
- **P3** — Complete in days 61–90 (monetization)
- **V1.1 / V2** — Explicitly deferred; do not pull forward

**Status values:** `Not started` · `In progress` · `Blocked` · `Done`

---

## V1 Marketing Backlog

### Phase 1 — Demo and messaging foundation (Days 1–15)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-01 | Finalize one-sentence positioning tagline and update `POSITIONING.md` | Copy | P0 | Not started | None — `POSITIONING.md` exists as basis |
| M-02 | Write one-minute verbal pitch (elevator script) | Copy | P0 | Not started | None — `EXECUTIVE_SPONSOR_BRIEF.md` as basis |
| M-03 | Write five-minute demo script aligned to marketing vocabulary (Capture → Evidence → Review → Findings → Decisions → Report) | Copy | P0 | Not started | None — `DEMO_VIDEO_SCRIPT.md` exists; validate against #31 workspace flows |
| M-04 | Verify self-demo workspace (Workspace A — ArchLucid reviews ArchLucid) passes Playwright smoke | QA sign-off | P0 | Blocked | **Improvement #31** (demo workspace GA gate) |
| M-05 | Verify synthetic regulated scenario workspace (Workspace B — AI governance + cloud posture) passes Playwright smoke | QA sign-off | P0 | Blocked | **Improvement #31** (demo workspace GA gate) |
| M-06 | Download and review generated sample architecture review report from Workspace B; confirm section coverage matches landing-page narrative | Content review | P0 | Blocked | **Improvement #28** (DOCX/PDF export GA gate) |
| M-07 | Capture 6–8 polished screenshots across the full operator workflow (Capture, Evidence, Review, Findings, Decisions, Report, whitelabeled export) | Production | P0 | Blocked | **Improvement #31** (workspaces must be stable) |
| M-08 | Review and align `POSITIONING.md` "audit chain / signed manifest" differentiator language; ensure it appears in the one-minute pitch and demo script | Copy | P0 | Not started | None — content only; references `LATEST.md` #24 framing |

### Phase 2 — Public credibility (Days 16–30)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-09 | Landing page full content — hero copy, problem/solution sections, core workflow narrative, use cases (5 of 6; *exclude* CAF landing-zone pack claim until V1.1), proof section | Copy + UI | P1 | Blocked | **Improvement #33** (marketing page content implementation — see below) and **Improvement #32** (CTA stack) |
| M-10 | LinkedIn post 1: "Architecture review is broken — diagrams are not evidence" | Content | P1 | Not started | None |
| M-11 | LinkedIn post 2: "Architecture decisions need provenance — not just Confluence pages" | Content | P1 | Not started | None |
| M-12 | LinkedIn post 3: "Why AI-assisted architecture review needs human signoff" | Content | P1 | Not started | None |
| M-13 | LinkedIn post 4: "The next architecture artifact is the evidence graph" | Content | P1 | Not started | None |
| M-14 | LinkedIn post 5: "Why regulated teams need reviewable architecture records" | Content | P1 | Not started | None |
| M-15 | Publish long-form article: "Architecture Review Is Broken: Why Diagrams Are Not Evidence" | Content | P1 | Not started | None — draft from `POSITIONING.md` + `COMPETITIVE_LANDSCAPE.md` |
| M-16 | Create one short demo video (screen recording of Workspace A self-demo flow) | Production | P1 | Blocked | **Improvement #31** (workspaces must be stable before recording) |

### Phase 3 — Early conversations (Days 31–60)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-17 | Build outreach list: 20 architects / CTOs / security leaders (LinkedIn network, former colleagues — avoid employer conflicts and NDA-covered clients) | Outreach | P2 | Not started | None |
| M-18 | Send 20 outreach messages: offer 10-minute demo + feedback call (not a sales pitch) | Outreach | P2 | Not started | M-09 (landing page live), M-16 (demo video available) |
| M-19 | Run 5–10 live demos against Workspace A and Workspace B | Sales | P2 | Blocked | **Improvement #31** (workspaces must be GA-stable); M-03 (demo script) |
| M-20 | Track objections from demos; refine one-sentence positioning and demo script | Copy iteration | P2 | Not started | M-19 (demos must start) |
| M-21 | Identify the one strongest buyer segment from demo feedback | Positioning | P2 | Not started | M-20 |

### Phase 4 — Monetization (Days 61–90)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-22 | Draft paid pilot offer (Option A: $2,500–$7,500 architecture review package using ArchLucid) — use `ORDER_FORM_TEMPLATE.md` as starting point | Business | P3 | Not started | None |
| M-23 | Draft paid pilot offer (Option B: $5,000–$15,000 / 30–60 day pilot with setup, demo workspace, review workflow, sample reports) | Business | P3 | Not started | None |
| M-24 | Create Upwork service listing: "AI Architecture Governance Review" (evidence-backed process + structured architecture review report) | Business | P3 | Not started | M-06 (sample report verified), **Improvement #28** (whitelabel export working) |
| M-25 | Create Upwork service listing: "Azure Architecture Readiness Review" (Azure extractor + security baseline + cost findings) | Business | P3 | Not started | **Improvement #29** (policy packs shipped) |
| M-26 | Create Upwork service listing: "Architecture Decision Record Cleanup" (capture + decisioning flow) | Business | P3 | Not started | **Improvement #31** (workspaces as demo) |
| M-27 | Run at least one paid pilot or Upwork engagement with ArchLucid as internal tool + demo asset | Business | P3 | Not started | M-22 or M-23 |
| M-28 | Request testimonial from any non-NDA-conflicted early user or pilot participant | Relationship | P3 | Not started | M-27 |
| M-29 | Publish LinkedIn post on ServiceNow integration ("ArchLucid writes architecture findings back to your ServiceNow workflow") | Content | P3 | Blocked | **Improvement #25** (ServiceNow bi-directional sync) and **P10** (developer instance provisioned) |

---

## V1.1 and V2 (do not pull forward)

| # | Task | Milestone | Reason deferred |
|---|------|-----------|-----------------|
| M-30 | Publish CAF / Azure landing-zone use case claim with bundled curated policy pack | V1.1 | CAF pack deferred to V1.1 per `LATEST.md` and `V1_DEFERRED.md` |
| M-31 | Solo architect self-serve SaaS pricing page ($49–$199/month) and public self-serve checkout | V2 | Stripe live keys deferred to V1.1; self-serve funnel deferred to V2; no public $ band in first 90 days per `LATEST.md` Marketing alignment Q7 |
| M-32 | Reference customer / design partner case study publication | V1.1 | Depends on signed pilot and `reference-customers/PUBLICATION_CHECKLIST.md` clearance |
| M-33 | Cross-tenant portfolio ROI analytics marketing claim | V2 | Cross-tenant analytics deferred to V2 per `V1_DEFERRED.md` |

---

## Technical dependency map (marketing → LATEST.md improvements)

This table shows which `LATEST.md` improvement items are prerequisites for marketing deliverables. Engineering should not close these items without notifying GTM.

| LATEST.md item | Status in LATEST.md | Marketing tasks unblocked |
|---|---|---|
| **#28** — Buyer-grade DOCX/PDF export + consultant whitelabel | GA gate | M-06, M-24 |
| **#29** — Default policy packs (AI governance + security baseline) | GA gate | M-25, and all policy-pack copy claims |
| **#30** — Bulk evidence upload (≤30 files; copy honesty) | GA gate | Landing page copy must disclose the cap |
| **#31** — Two curated demo workspaces (Workspace A + B) | GA gate | M-04, M-05, M-07, M-16, M-19, M-26 |
| **#32** — Landing page CTA stack (walkthrough / self-demo / early access) | GA gate | M-09 |
| **#33** — Marketing landing page content implementation | **New — see below** | M-09 |
| **#25** — ServiceNow bi-directional sync | Blocked on P10 | M-29 |
| **#24** — Surface finding confidence + evidence links in review UI | Actionable (open) | Supports differentiability messaging for M-08 |
| **#19** — Progressive disclosure for advanced governance routes | Actionable (open) | Reduces demo cognitive-load risk during M-19 |

---

## New technical task required: Improvement #33

The following technical task is **not yet tracked in `LATEST.md`** and needs to be added as improvement **#33**. It is distinct from **#32** (which covers only the CTA button hierarchy and analytics). The marketing landing page *content* — hero copy, problem/solution, use case sections, proof section — is implemented in `archlucid-ui/src/app/(marketing)/` and `WelcomeMarketingPage.tsx`, both currently untracked in git and without a corresponding improvement item.

**Proposed LATEST.md improvement #33:**

> **Implement marketing landing page content (hero, problem/solution, use cases, proof)**
>
> - Why it matters: The landing page hero copy, problem/solution narrative, use case listing, and proof section are the primary evaluator entry point. Without complete content, the CTA stack (#32) routes buyers to an incomplete or placeholder page.
> - Expected impact: Marketability, Adoption Friction, Commercial Packaging Readiness.
> - Affected qualities: Marketability, Adoption Friction.
> - Actionable: Yes — `WelcomeMarketingPage.tsx` and `archlucid-ui/src/app/(marketing)/layout.tsx` exist as untracked files; content and copy need implementation aligned to the positioning tagline (M-01) and the five use cases approved for V1 (excluding CAF landing-zone pack claim).
> - Acceptance criteria: Landing page renders hero, problem, solution, core workflow (Capture → Evidence → Review → Findings → Decisions → Report), five use cases, proof section (screenshots + sample report link), and the hybrid CTA stack from #32 — all copy reviewed against `POSITIONING.md`.

**Action required:** Add improvement #33 to `LATEST.md` under **Top Improvement Opportunities** before the next engineering sprint.
