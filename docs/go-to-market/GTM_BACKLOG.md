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
| G-REAL-06 | Execute three committed real-mode pilot runs (Run 1–3) per [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md) | Owner | P0 | Not started | Stage 1 exit gate **G4**; assessment Tier 1 **#2** remainder (market-execution half); pilot stack must be PilotStrict **Real** — not a coding-agent task |
| G-REAL-07 | Collect proof packets per run (`collect-first-pilot-proof.ps1 -SponsorHandoff -FailOnHold`); append [`PROOF_PACKET_RUN_LOG.md`](PROOF_PACKET_RUN_LOG.md) | Owner | P0 | Not started | **G4**; use `-CompareBaseRunId` for Run 3; founder signoff required for Stage 0 → 1 per [`REAL_MODE_EVIDENCE_COHORT.md`](../runbooks/REAL_MODE_EVIDENCE_COHORT.md) |
| G-REAL-08 | Attach committed gate JSON to next RC release evidence bundle per [`RELEASE_CLAIM_GATE.md`](../quality/RELEASE_CLAIM_GATE.md) | Owner | P1 | Not started | Gate source committed; run `Emit-ReleaseReadinessEvidence.ps1` on RC cut |
| G-REAL-05 | CPA SOC 2 CPA program kickoff (**TB-135**) — organizational, not engineering | Owner | V1.1 | Not started | Assessment **Imp-13** pending question; zero `(A)` weight per `V1_1-assurance-backlog.mdc` |
| G-FAITH-01 | Set repo variable `ARCHLUCID_FAITHFULNESS_NIGHTLY_ENFORCE=true` after ≥5 green nightly baselines | Owner | P1 | Not started | Assessment **Imp-3** — enables `--enforce` on `golden-cohort-nightly.yml` deterministic faithfulness job |
| G-CONTENT-01 | Enrich remaining **20** bundled policy packs (+5 curated rules each) | Owner / content | V1.1 | Not started | Assessment **Imp-4** partial — flagship packs **azure-waf**, **ai-governance**, **security-baseline** shipped 2026-06-18 |
| G-REAL-02 | Playwright smoke sign-off — Workspace A self-demo (**M-04**) | QA / owner | P0 | **Done** | Owner sign-off **2026-07-03** — Workspace A Playwright smoke verified; human verification after engineering **#30** |
| G-REAL-03 | Playwright smoke sign-off — Workspace B regulated scenario (**M-05**) | QA / owner | P0 | **Done** | Owner sign-off **2026-07-03** — Workspace B Playwright smoke verified; human verification after engineering **#30** |
| G-REAL-04 | Review sample architecture report from Workspace B (**M-06**) | Owner | P0 | **In progress** | Agent claim-vs-copy review **Done 2026-07-03** — [`M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md`](M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md); owner final sign-off pending (optional live DOCX visual check) |

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
| M-06 | Download and review generated sample architecture review report from Workspace B; confirm section coverage matches landing-page narrative | Content review | P0 | **In progress** | Agent mechanical review **Done 2026-07-03** — [`M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md`](M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md) (7 match / 4 partial / 1 routing mismatch); owner final sign-off pending; **Improvement #28 — COMPLETED (2026-05-17)** |
| M-07 | Capture 6–8 polished screenshots across the full operator workflow (Capture, Evidence, Review, Findings, Decisions, Report, whitelabeled export) | Production | P0 | Not started | **Improvement #30 — COMPLETED (2026-05-17)** |
| M-08 | Review and align `POSITIONING.md` "audit chain / signed manifest" differentiator language; ensure it appears in the one-minute pitch and demo script | Copy | P0 | **Done** | Agent copy alignment **Done 2026-07-03** — `POSITIONING.md` §2 adds a grounded "audit chain / signed manifest" differentiator callout (`ExplainabilityTrace` + append-only `AuditEvents` = audit chain; `ManifestHash`/`IManifestHashService` = signed manifest) plus a proof-points row and a tightened Do/Don't row; same two terms now appear in `ELEVATOR_PITCH.md` one-minute and two-minute pitches and in `DEMO_VIDEO_SCRIPT.md` five-minute Scene 4 and the two-minute storyboard. **Finding-confidence UX** in review UI (**engineering backlog**) — aligns differentiability copy |

### Phase 2 — Public credibility (Days 16–30)

| # | Task | Type | Priority | Status | Depends on (technical) |
|---|------|------|----------|--------|------------------------|
| M-09 | Landing page full content — hero copy, problem/solution sections, core workflow narrative, use cases (include Azure WAF + CAF/LZ bundled packs with disclaimer), proof section | Copy + UI | P1 | In progress | **Improvements #31 + #32 — COMPLETED (2026-05-17)**; homepage copy/sections landed 2026-05-21 (`WelcomeMarketingPage` + modular sections). **Remaining:** owner sign-off, M-06 owner final sign-off (agent review done), M-07 screenshots, deploy. |
| M-93 | Run a real ArchLucid-on-ArchLucid dogfood pilot (`DOGFOOD_PILOT_KIT.md`) against a real internal subsystem and publish the resulting live run as a citable sample-report alongside Workspace A/B — closes the M-06 audit's "seed-backed, not live" gap (assessment claim **C4**) by giving evaluators a finding with a real `EngineType` and real per-finding evidence citations, not `RegulatedScenarioWorkspaceSeed`-authored ones | Content + Engineering | P1 | Not started | **TB-640** (engineering); `DOGFOOD_PILOT_KIT.md` (internal pilot mechanics already ship); owner redaction review required before external publication (real, not synthetic, content). Owner direction 2026-07-05: can start any time, not V1.1-gated. |
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
| M-16 | Create one short demo video (screen recording of Workspace A self-demo flow) | Production | P1 | Not started | **Improvement #30 — COMPLETED (2026-05-17)**. **Deferred (planning 2026-05-21):** record after M-07 screenshots; M-04 smoke sign-off **Done (2026-07-03)**; M-18 may use live demo until video exists. |

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
