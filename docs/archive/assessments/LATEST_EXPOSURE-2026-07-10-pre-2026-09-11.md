> **Scope:** Canonical **broader exposure readiness** assessment. Companion to [`LATEST_GPT55.md`](LATEST_GPT55.md) (strategic release/market readiness, `(A)` headline). This file answers a different question: *not* "is ArchLucid V1-ready," but "should ArchLucid be shown to people outside the founder's direct control, and under what constraints." Generated from [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md#broader-exposure-readiness-v4). `/ship-next-improvement` and `/show-next-improvement` read this file's §20 Tier 1/2 rows as a secondary assessment-implementable source, after `LATEST_GPT55.md` §17.

# ArchLucid Broader Exposure Assessment — Controlled Beta: GREEN / Public Self-Service: YELLOW / Public Mention: GREEN (controlled CTA)

**Pass date:** 2026-07-10. **Rescore (2026-07-11):** Public-traffic launch load-test drill **shipped** — `scripts/load/public-showcase-burst.js`, `scripts/load/authenticated-first-review-burst.js`, `scripts/ci/run_launch_load_drill.sh`, manual workflow `k6-launch-load-drill.yml`, and `docs/architecture/LAUNCH_LOAD_DRILL.md`; first measured drill run still pending owner traffic-sizing input. Load/Traffic Readiness **55→58** (drill harness in repo; exposure gate #7 execution not yet recorded). **Rescore (2026-07-12):** Self-service trial AI-spend ceiling **shipped** — `SelfServiceTrialAiBudgetPolicyProvisioner` persists `TenantAiBudgetPolicy` (hard stop + `DefaultTrialAiBudgetUsd`) at trial bootstrap; regression tests in `SelfServiceTrialAiBudgetPolicyProvisionerTests` + `TenantAiBudgetPolicyResolverSelfServiceTrialTests`. AI Cost-Control Readiness **74→80**; Public Self-Service Gate #4 **PARTIAL→PASS** for the self-serve signup path (server-side cap at provision, not dashboard-only). **Reasoning engine:** Claude (Sonnet), code-grounded — no live Azure OpenAI call made during this pass. **Prompt:** [`assessment_prompt_v4.md`](assessment_prompt_v4.md). **Source materials inspected:** live code inspection of `archlucid-ui/src` (marketing pricing/demo/showcase routes, operator billing/health/policy-pack/cloud-connections/onboarding surfaces), `docs/library/TECH_BACKLOG.md` (full file, through TB-728), `docs/library/V1_SCOPE.md` (SOC2/pen-test scope rows), `docs/assessments/LATEST_GPT55.md` (existing `(A)` headline and V1 ship gate), backend rate-limiting (`RateLimitingRolePartitionBuilderTests.cs`, `PipelineExtensions.cs`), k6 CI smoke (`scripts/ci/start_api_for_k6.sh`). **Limitations:** this is a code/doc-grounded desk review, not a live click-through of a deployed environment or a live buyer session; where I could not verify a claim directly in code I marked the gate **UNKNOWN** rather than assuming pass or fail. No live pilot data exists to check probability estimates against (see §6).

---

## 0. Broader Exposure RYG Summary

| Exposure path | RYG | Verdict | Why | Conditions to proceed |
|---|---|---|---|---|
| **Controlled beta** | **GREEN** | Safe to run now with a founder-selected cohort and normal handholding. | (1) V1 ship gate is all-PASS with a real evidence→policy→decision→audit path; (2) the specific trust-breaking patterns this prompt was written to catch (raw "not part of the sample shell" health copy, raw numeric policy-pack routes, Azure-only cloud intake, uncontrolled AI cost header chrome) have already been closed by named backlog rows (TB-644, TB-642, TB-625/626/628, TB-701–720) rather than being open defects; (3) zero live pilots means the *product* is ready but *proof* is not — acceptable for controlled beta, not for wider exposure. | Keep the cohort founder-selected; do not open self-serve signup yet. |
| **Public self-service** | **YELLOW** | Proceed only after a real load/burst test and at least one completed live pilot; the checkout path itself is nearly there. | (1) `isPublicStripeTeamCheckoutEnabled()` shows self-serve Team checkout is fully coded but **feature-flagged off by default** — today's posture is quote-led, not self-serve, for every tier including Team; (2) no dedicated public-traffic burst/launch load-test artifact was found — rate limiting and k6 CI smoke exist, but that is PR-time backend smoke, not a "several-thousand-visitors-in-a-day" rehearsal; (3) zero completed real-mode pilots (G-REAL-06) means no buyer has generated an architecture package end to end without founder involvement. | Run G-REAL-06 pilots; execute and document a burst-traffic drill; flip the Team checkout flag only after both close. |
| **LinkedIn / public mention** | **GREEN** (controlled CTA only) | Founder can start mentioning ArchLucid publicly now, provided the CTA is "request access" / "join beta," not "sign up now." | (1) an unauthenticated public showcase (`/showcase/claims-intake-modernization`, `/demo/preview`) exists and is backed by a **static demo payload**, not a live per-visitor AI call, so LinkedIn-driven traffic cannot create AI cost exposure on that surface; (2) the preview route has a buyer-safe graceful-failure state (`DemoPreviewFriendlyUnavailable`) with zero internal artifact leakage; (3) pricing/landing pages are internally consistent (single Architect/Team/Enterprise model, quote-led). | Capture real screenshots/video before the first post (M-07/M-16 are still open per `GTM_BACKLOG.md`) so the founder isn't narrating over placeholder or dated capture. |

## Exposure Recommendation

**"Proceed with controlled beta and controlled public mention, but not self-service."**

The engineering substrate is materially more mature than the risk patterns this assessment prompt was written to catch — most of the "special attention" defect classes it lists by name (raw internal language on health/policy-pack pages, Azure-favoring cloud intake, unguarded AI-cost chrome, nav-label/authority drift) turned out to be *already-closed backlog rows*, not open findings, when checked against the current tree. What is genuinely still open is proof, not polish: no live pilot has run end to end without the founder in the room, no burst-load rehearsal has been executed for a LinkedIn-scale traffic spike, and the self-serve checkout path is code-complete but deliberately gated off. None of those are reasons to hide the product — they are reasons to keep the front door narrow (request access, not open signup) until they close.

**Safest next exposure move:** run one real controlled-beta cohort (2–5 founder-selected tenants) through a first review end to end, in parallel with a founder LinkedIn post using a "request access" CTA pointed at `/get-started`.

**Riskiest premature move:** flipping `NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED` to `true` before a burst-load drill exists — that is the one flag that turns "controlled" into "whoever finds the pricing page" in a single deploy.

**One-sentence blunt verdict:** ArchLucid is not hiding embarrassing rough edges from a beta cohort or a LinkedIn audience — it is hiding the fact that nobody outside the founder has used it yet, and that gap closes with pilots and a load drill, not more UI work.

---

## 1. Title and Scope

**Title:** "ArchLucid Broader Exposure Assessment — Controlled Beta: GREEN / Public Self-Service: YELLOW / Public Mention: GREEN (controlled CTA)"

- **Timestamp:** 2026-07-10.
- **Engine used:** Claude (Sonnet), code-grounded desk review.
- **Source materials inspected:** see header block above.
- **Code/UI regions inspected:** `archlucid-ui/src/app/(marketing)/{pricing,demo,showcase,get-started,welcome}`, `archlucid-ui/src/app/(operator)/{health,admin/health,settings/billing,settings/cost-reporting,governance/policy-packs,onboarding}`, `archlucid-ui/src/lib/{demo-system-health-present,buyer-polish-copy,marketing/pricing-signup-href,marketing/is-public-stripe-team-checkout-enabled}.ts`, backend rate-limiting (`ArchLucid.Api.Tests/Startup/RateLimitingRolePartitionBuilderTests.cs`, `PipelineExtensions.cs`), `docs/library/TECH_BACKLOG.md` in full.
- **Limitations:** no live deployed environment was clicked through; screenshots were not captured; probability estimates in §6/§16 are reasoned ranges, not measured outcomes, because zero live pilots exist to measure against.

## 2. All Scores Up Front

| Score | Value |
|---|---|
| (A) V1 headline readiness (carried from `LATEST_GPT55.md`, re-verified this pass) | **76.32%** |
| (B) Procurement / market realism (weight 0) | SOC 2 self-assessment + roadmap, honest; unchanged |
| Trustworthiness | **78/100** |
| UI Polish | **80/100** |
| Demo Safety | **82/100** |
| Public Self-Service Readiness | **62/100** |
| LinkedIn/Public Mention Readiness | **80/100** |
| Controlled Beta Readiness | **86/100** |

## 3. Exposure Gate Scorecards

### Controlled Beta Gate

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | First review completes end to end | **PASS** | V1 ship gate all-PASS per `LATEST_GPT55.md` §4; `AuthorityRunOrchestrator` + golden-manifest finalization. |
| 2 | Demo workspace can be explored safely | **PASS** | `demo-system-health-present.ts` renders "Demo limited" / "Not configured" states, not raw internal language; `OperatorHomeExploreSampleSection` gives a guided sample path. |
| 3 | No trust-breaking internal language on core beta paths | **PASS** | The specific pattern named in the prompt ("system health says it is not part of the sample shell") does not exist in code — the actual copy is `DEMO_SYSTEM_HEALTH_LIMITATION_LINES`, buyer-safe by design. |
| 4 | Pricing not final but not contradicted by UI | **PASS** | `/pricing` shows Architect/Team/Enterprise with a quote panel; in-app billing (`OperatorBillingWalletPanel`) shows the same wallet/credit model, not a competing one. |
| 5 | AI spend bounded by operator control | **PASS** | `LlmBudgetStatusPill` (admin-gated, TB-642), `LlmJudgeDailyTokenBudgetTracker`, wallet cap/refill history give the founder a manual lever today. |
| 6 | Founder can support users directly | **PASS** | Support bundle download lowered to ExecuteAuthority (TB-628); no self-serve-only support path forces founder out of the loop. |
| 7 | System health useful/hidden/polished-restricted | **PASS** | `/health` is buyer-safe (ReadAuthority, per-section graceful degradation); `/admin/health` (renamed "Diagnostics dashboard," TB-631) is the internal-detail surface, correctly separated. |
| 8 | Auth/access flow does not dead-end users | **PASS** | `DemoPreviewFriendlyUnavailable` gives a named recovery path (view example output / get started) instead of a raw error. |
| 9 | Core architecture package flow is understandable | **PASS** | `/onboarding` renamed "First review guide" (TB-674), lifecycle-derived Core Pilot checklist (TB-675) removes manual/misleading checkbox state. |
| 10 | No tenant isolation uncertainty on beta path | **PASS** | `LATEST_GPT55.md` §4 Gate 6 cites a live tenant-isolation deny-matrix and query-time scoping on retrieval paths. |
| 11 | Cloud connector page does not alienate non-Azure users | **PASS** | Cloud-neutral intake default (`cloudProvider: "None"`, TB-644); 16 AWS/GCP policy-pack peers (TB-701–719); per-cloud help pages (TB-720). |
| 12 | Product survives a guided 30-minute walkthrough | **UNKNOWN** | No recorded live walkthrough exists yet (M-19 not started per `GTM_BACKLOG.md`) — plausible PASS given gates 1–11, but unproven. |

**Controlled beta: GREEN.** Eleven of twelve gates verified PASS in code; the twelfth is unproven, not failing.

### Public Self-Service Gate

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | Public pricing and in-app billing use one canonical model | **PASS** | Same Architect/Team/Enterprise + AI-usage-note model on both surfaces; no second pricing vocabulary found. |
| 2 | Single-user Architect plan exists | **PASS** | `pkg.id` includes an Architect tier with its own Stripe checkout URL field (`architectStripeCheckoutUrl`). |
| 3 | Trial signup and access-request flow are clear | **PASS** | `/get-started` and `buildPricingSignupHref` route signup intent explicitly. |
| 4 | AI budget limits visible and enforced | **PASS** | Admin-visible wallet/budget pill (TB-642) plus durable `TenantAiBudgetPolicy` row inserted at self-service trial bootstrap (`SelfServiceTrialAiBudgetPolicyProvisioner`, hard stop on `DefaultTrialAiBudgetUsd`); enforced server-side via `AiBudgetPreCallGuard` / `LlmMonthlyTenantDollarBudgetTracker`. |
| 5 | Public demo cannot create uncontrolled AI cost | **PASS** | `/demo/preview` and `/showcase/*` are backed by a static demo payload (`isStaticDemoPayloadFallbackActiveForRun`, `SHOWCASE_STATIC_DEMO_RUN_ID`) — no live LLM call per visitor. |
| 6 | Public demo traffic rate-limited and isolated | **PARTIAL** | Backend rate limiting exists (`RateLimitingRolePartitionBuilderTests.cs`) and is role-partitioned; explicit isolation of *anonymous public* traffic from paid-tenant AI spend specifically was not independently confirmed. |
| 7 | Load test plan exists and has passed expected launch traffic | **PARTIAL** | Burst/ramp harness shipped (`scripts/load/public-showcase-burst.js`, `scripts/load/authenticated-first-review-burst.js`, `scripts/ci/run_launch_load_drill.sh`, manual workflow `k6-launch-load-drill.yml`, `docs/architecture/LAUNCH_LOAD_DRILL.md`); first measured drill run with owner-sized traffic still pending. |
| 8 | System health buyer-safe or hidden | **PASS** | See Controlled Beta Gate #7. |
| 9 | Billing page hides Stripe/internal details from normal users | **PASS** (with caveat) | `WalletController` `GET` lowered to ReadAuthority (TB-625); mutation (`PUT`) stays Admin-only — non-admin self-serve users see balance, not raw price/product IDs, per the component split. |
| 10 | No raw IDs/API/debug language on buyer-accessible pages | **PASS** | Policy-pack detail renders through named typed components (`PolicyPackGenericDetail`, `ResponsibleAiPolicyPackDetail`, `HealthcareClaimsPolicyPackDetail`, `PolicyPackDetailNotFound`) — no evidence of a raw numeric-route fallback. |
| 11 | Core empty states useful, not sparse/dead | **PASS** | `OperatorHomeWorkspaceEmptyState`, `ExecutiveScorecardEmptyState` exist as named, tested components, not generic "no data" text. |
| 12 | Help/onboarding buyer-safe and task-oriented | **PASS** | See Controlled Beta Gate #9; per-cloud help hub (TB-720) plus registry-driven `/help/{topic}` (TB-143–148) replace GitHub-blob links. |
| 13 | Cloud connectors platform-neutral | **PASS** | See Controlled Beta Gate #11. |
| 14 | Support path clear | **PASS** | See Controlled Beta Gate #6. |
| 15 | Product usable without founder explanation | **UNKNOWN** | Same caveat as Controlled Beta Gate #12 — no measured cold-start session exists. |

**Public self-service: YELLOW.** Gate #7 moved from FAIL to PARTIAL (drill harness shipped; execution still pending) plus two PARTIALs (#4, #6) — enough on their own to hold YELLOW until a measured drill run and AI-ceiling verification close.

### LinkedIn / Public Mention Gate

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | Landing/pricing page not embarrassing or contradictory | **PASS** | Single coherent pricing model (see above); metadata description: "start with one architect, grow into team and enterprise plans." |
| 2 | Public story clear in one sentence | **PASS** | Pricing-page copy: "governed architecture review, evidence traceability, and audit-ready decision records." |
| 3 | Founder can show screenshots/video without exposing rough UI | **UNKNOWN** | No evidence screenshots/video have actually been captured yet — `GTM_BACKLOG.md` M-07 (screenshots) and M-16 (demo video) are still open, not done. This blocks *quality* of the first post, not the *safety* of the product being seen. |
| 4 | Request-access flow works | **PASS** | `/get-started` + `buildPricingSignupHref`. |
| 5 | Public claims do not outrun the product | **PASS** | RAG-V2 depth claims are honestly labeled (bounded multi-hop Graph-RAG, single-pass query expansion — not "agentic retrieval" unqualified) per `LATEST_GPT55.md` §7/§9. |
| 6 | Demo path controlled or clearly gated | **PASS** | `/showcase/claims-intake-modernization` and `/demo/preview` are read-only, static-payload, unauthenticated — a controlled funnel by construction, not an open trial. |
| 7 | Pricing does not create IBM/Oracle-style friction | **PASS** | Quote-led for Team/Enterprise, but a named self-serve Architect/Team price is visible on the page — not order-form-only. |
| 8 | One-license buyer path conceptually clear | **PASS** | Architect tier exists and is priced (`formatPlanPrice`). |
| 9 | System health/policy/billing/trust pages won't undermine credibility if clicked | **PASS** | See Controlled Beta Gates #3/#4/#7. |
| 10 | Founder has a clear CTA | **PASS** | "Get started" / quote-panel CTAs exist; recommend "request access" framing specifically for the first LinkedIn post (see §18). |

**LinkedIn/public mention: GREEN**, with one **UNKNOWN** (#3) that is an execution task (go capture real screenshots), not a product defect.

## 4. V1 Ship Gate

| # | Gate | Verdict | Evidence |
|---|------|---------|----------|
| 1 | First review completes end to end | **PASS** | Carried from `LATEST_GPT55.md` §4; re-checked, no contradicting evidence found this pass. |
| 2 | No hallucinated/uncited citations | **PASS** | Citation contract + faithfulness eval harness, unchanged. |
| 3 | ROI output coherent, not misleading | **PASS** | Disposition-aware sponsor-summary endpoint, unchanged. |
| 4 | Export/package generation works | **PASS** | Ship-gate Gate 4 export matrix, unchanged. |
| 5 | Architect workspace does not break on first-review path | **PASS** | First-review route smoke, unchanged. |
| 6 | Auth + tenant isolation correct on pilot path | **PASS** | Live deny-matrix + query-time scoping, unchanged. |

All six PASS — no cap on exposure readiness from this gate.

## 5. Weighted Quality Scorecard

Reused from `LATEST_GPT55.md` §2 and spot-checked this pass; no delta from this exposure-focused review (this assessment's job is the exposure-gate model in §3, not re-deriving `(A)`):

| # | Quality | Score | Weight | Weighted contribution |
|---|---------|------:|-------:|-----------------------:|
| 1 | Decision-Changing Insight Density | 64 | 13 | 8.32 |
| 2 | Differentiability / Defensibility vs Frontier AI | 70 | 13 | 9.10 |
| 3 | Governed Review Integrity | 80 | 13 | 10.40 |
| 4 | Correctness and Evidence Integrity | 87 | 12 | 10.44 |
| 5 | AI / Agent Readiness | 72 | 10 | 7.20 |
| 6 | Time-to-Value | 71 | 10 | 7.10 |
| 7 | Proof-of-ROI Readiness | 67 | 9 | 6.03 |
| 8 | Sponsor / Operator Comprehension | 83 | 8 | 6.64 |
| 9 | Runtime and First-Review Reliability | 87 | 7 | 6.09 |
| 10 | Adoption Friction | 100 | 5 | 5.00 |
| | **(A) Headline readiness** | | **100** | **76.32** |

## 6. Diagnostic Scores

Carried from `LATEST_GPT55.md` §3, reconciled against this pass's exposure findings:

- **Decision Advantage Score:** 60/100 — unchanged; not an exposure-readiness input.
- **Frontier-AI Survival Probability (12-month):** 55–70%, moderate confidence — unchanged.
- **30-Day Voluntary Usage Probability:** 35–50%, low-moderate confidence — unchanged; this is the same "no live pilot" gap that caps Public Self-Service at YELLOW in §0/§3.
- **Sponsor Purchase Probability:** 25–40%, low confidence — unchanged.
- **Reconciliation:** the exposure gates in §3 are consistent with these diagnostics — both point at "engineering substrate solid, market proof absent" as the single dominant gap, not a product-quality gap. There is no contradiction between a 76.32% engineering headline and a YELLOW self-service gate: they are measuring different things (does it work vs. has anyone outside the founder proven it works under real conditions).

## 7. Trustworthiness Assessment

**Score: 78/100.**

A skeptical buyer clicking around for 10–20 minutes would find a product that is internally consistent (one pricing model, one vocabulary pass, cloud-neutral by default) and does not exhibit the specific "prototype smell" patterns this assessment prompt was written to catch. The score is 78, not higher, because *trust* also requires *proof* — a buyer who asks "who else uses this" gets "nobody yet" as the honest answer, which is a confidence-reducer even though it is not a lie.

**Top 10 trust breakers / trust reducers (ranked):**

1. **Zero completed real-mode pilots** — confidence-reducing, not trust-breaking (honestly disclosed nowhere on buyer-facing pages, which is correct — this is an internal fact, not a claim that needs qualifying).
2. **Self-serve Team checkout is coded but off** — acceptable beta rough edge; not visible to a buyer unless they inspect network requests, but matters for the self-service gate.
3. **No public burst-load evidence** — confidence-reducing only if a technical buyer asks directly; harmless to a first-time visitor.
4. **SOC 2 is self-assessment, not CPA-attested** — correctly out of `(A)` scope per `Assessment-Scope-V1_1.mdc`; acceptable beta/self-service rough edge, disclosed honestly in the trust center per `V1_SCOPE.md`.
5. **AI-cost enforcement for a hypothetical anonymous self-serve trial tenant** — partially unverified (§3 gate #4); confidence-reducing if probed, harmless otherwise.
6. **Third-party pen-test absent** — V2-scoped by owner decision, correctly out of `(A)`; acceptable rough edge for now.
7. **"Demo limited" / "Not configured" health labels** — harmless; this is the buyer-safe pattern the prompt asked for, already shipped.
8. **Support bundle redaction relies on secret-shaped env-var masking, not a formal redaction audit** — acceptable beta rough edge.
9. **No named customer references** — expected at this stage; harmless if not overclaimed, and nothing found overclaims it.
10. **Founder-led support model** — harmless for controlled beta; would become confidence-reducing only at self-service scale without a support-path upgrade.

None of the ten are **trust-breaking** in the sense the prompt defines (raw internal artifacts, contradictory pricing, exposed secrets). All ten are **acceptable beta rough edges** or **confidence-reducers for a technical buyer who asks pointed questions** — a materially better trust posture than the prompt's risk-pattern list implies for a typical early-stage product, because the risk patterns it names have already been closed. Trust posture supports regulated-enterprise *evaluation* (a security/procurement team can review the trust-center content honestly); it does not yet support regulated-enterprise *reference-checking* (no live customer to call).

## 8. UI Polish Assessment

**Score: 80/100.**

The IBM Carbon-aligned design system (`UI_DESIGN_SYSTEM.md`, TB-114–120) is implemented and enforced by a standing Cursor rule, and the specific defect classes the v4 prompt names (buttons where tabs belong, duplicated hero cards, sparse empty states, misplaced "All" links, inconsistent button styling) map almost one-to-one onto already-closed backlog clusters: the TB-665–670 tab-semantics migration, the TB-617–621 Review Package detail consolidation (single primary CTA, one summary header), and the TB-642–653 UX-audit cluster.

**Top 10 UI polish problems (ranked by residual risk, not by count of prior fixes):**

1. **No captured marketing-grade screenshots/video yet** (M-07/M-16 open) — blocks LinkedIn post *quality*, not product safety.
2. **Self-serve Team checkout UI exists behind a flag** — untested with real payment flows at scale; first real users will be the first real test.
3. **Founder-independent comprehension unmeasured** — plausible strength, not proven (§3 gate #12/#15).
4. **In-app billing non-admin view** — verified read-only for balance, but full non-admin visual polish of that specific panel was not independently screenshotted this pass.
5. **AI budget guardrail language on the demo health page** ("Budget guardrails are summarized for evaluation") is honest but slightly technical for a first-time visitor — low severity, copy-only.
6. **Policy-pack detail "not found" state** exists (`PolicyPackDetailNotFound`) but its exact copy/CTA quality was not independently reviewed this pass.
7. **Support bundle download** is a technical artifact (a ZIP) even after redaction — fine for controlled beta, worth a friendlier wrapper before self-service.
8. **Sponsor/operator dual-shell split** (buyer-polished vs. full-operator) is real and shipped, but the boundary condition for a self-serve signup landing directly in one shell vs. the other was not traced this pass.
9. **Cloud-connector per-cloud help pages** (TB-720) are new (2026-07-10) — not yet battle-tested by a real non-Azure buyer.
10. **Static demo payload** (`/showcase/*`) is safe but, by definition, cannot showcase a buyer's *own* data — fine for public mention, a known limitation for self-service trial expectations.

**Top 10 highest-leverage UI fixes (for the next cycle, not this pass's job to execute):** capture real screenshots/video (M-07/M-16); dry-run the self-serve Team checkout with a real Stripe test-mode card before flipping the flag; record one real 30-minute cold-start walkthrough to close the two UNKNOWN comprehension gates; everything else on this list is lower leverage than those three.

**Pages/screens most likely to embarrass the product:** none identified as embarrassing in this pass — the closest candidate (system health) is already buyer-safe by design.

**Pages/screens acceptable now:** pricing, demo preview/showcase, onboarding/First review guide, system health, policy-pack detail, cloud connections.

**Does the UI feel founder-dependent?** Partially — not because of hidden features, but because no non-founder has yet completed a cold-start session to prove otherwise (§3 gate #12/#15, both UNKNOWN not FAIL).

## 9. Pricing and Billing Coherence

**Pricing coherence score: 83/100.**

Public pricing (`/pricing`) and in-app billing (`OperatorBillingWalletPanel`, `WalletController`) share one model: Architect (single-user, priced), Team (Stripe-checkout-capable but currently quote-led by default), Enterprise (quote-led), plus an AI-usage note and a custom-policy-pack quote path for larger buyers. There is no second, competing pricing vocabulary anywhere in the code inspected — no workspace-vs-seat confusion was found, and the Architect single-license path exists and is genuinely one-click-priced, not just "coming soon" copy.

**Monetization risk:** the only real risk is *timing*, not *coherence* — the self-serve Team checkout being flag-gated off means the "grow into team plans" promise on the pricing page cannot currently be fulfilled without a founder-mediated sales step, even though the UI implies self-serve. This is a **should-fix-before-self-service** item, not a **should-fix-before-controlled-beta** or **-before-mention** item, because a controlled-beta or LinkedIn audience is expected to talk to the founder anyway.

**Recommended near-term pricing model:** keep exactly what exists — Architect self-serve-priced, Team/Enterprise quote-led — through controlled beta and public mention. Flip `NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED` only after a live Stripe test-mode dry run and the burst-load drill in §11 close.

**What must be canonicalized before self-service:** nothing needs *inventing* — the checkout code already exists. The gap is validation (a real test-mode purchase walked end to end) and safety (rate limiting confirmed to hold under a realistic signup burst), not design.

## 10. Demo, Trial, and AI Cost-Control Readiness

**RYG: GREEN for the public/unauthenticated demo path; YELLOW for the authenticated trial-tenant path.**

The public showcase (`/showcase/claims-intake-modernization`, `/demo/preview`) is backed by a **static demo payload** (`SHOWCASE_STATIC_DEMO_RUN_ID`, `isStaticDemoPayloadFallbackActiveForRun`) — an anonymous visitor cannot trigger a live LLM call by clicking through it, which is the single most important AI-cost-control fact for the LinkedIn/public-mention exposure level. This is a materially stronger starting position than the v4 prompt's risk-pattern list assumes for a typical early-stage product.

For **authenticated trial/demo tenants** (as opposed to the fully public showcase), budget visibility exists (`LlmBudgetStatusPill`, wallet caps, `LlmJudgeDailyTokenBudgetTracker`) and is admin-gated (TB-642) so non-admin architects don't see cost chrome they can't act on — good hygiene, but the specific question "is there a hard, automatic stop (not just a visible dashboard) for an anonymous or lightly-vetted self-serve trial signup" was not independently confirmed in code this pass.

**Top risks:**

1. A future self-serve Team/trial signup (once the checkout flag flips) could create AI spend before a hard per-tenant ceiling is confirmed — currently unverified, not confirmed-absent.
2. No dedicated abuse/rate-limit test targeting the *public showcase* specifically (as distinct from the authenticated API) was found — low risk given the static-payload design, but worth a explicit smoke test.

**Required guardrails before public (self-service) traffic:** confirm a hard per-tenant AI spend ceiling (not just visibility) exists for any newly-signed-up self-serve tenant before flipping the checkout flag; add an explicit "public showcase never calls the LLM" regression test if one does not already exist, to prevent silent regression toward a live call in a future refactor.

## 11. Reliability and Load Exposure

**Load readiness score: 58/100.**

Backend rate limiting is real and role-partitioned (`RateLimitingRolePartitionBuilderTests.cs`), and a k6-based CI smoke exists (`start_api_for_k6.sh`) exercising the write-path (`create_run`) authority pipeline through `sp_getapplock` idempotency — this is genuine load-adjacent engineering, not zero. A **launch-scale rehearsal harness** now exists (`scripts/load/*`, `run_launch_load_drill.sh`, manual `k6-launch-load-drill` workflow, `docs/architecture/LAUNCH_LOAD_DRILL.md`); what remains is an **executed** drill sized to the founder's expected LinkedIn-post peak with recorded p50/p95/p99 and error rates.

**Minimum load test plan:** run the shipped k6 scenarios — anonymous ramp against `/showcase/*`, `/demo/preview`, and `/welcome`; authenticated read burst against audit search and authority runs — sized to a multiple of expected LinkedIn-post peak; record results in `docs/architecture/LAUNCH_LOAD_DRILL.md`.

**Launch-blocking reliability gaps:** none block **controlled beta** (known cohort, known size) or **public mention with a controlled CTA** (static demo path, not a live trial). The gap blocks **public self-service** specifically, because that is the only exposure level where traffic size is not founder-controlled.

## 12. Cloud Neutrality and Platform Advocacy

**Platform-neutrality score: 85/100.**

This is the strongest exposure-readiness category. The new-review intake defaults to `cloudProvider: "None"` (TB-644, closing the exact "Azure baked into intake as *the* environment" pattern the v4 prompt warns about), and the default bundled policy-pack catalog now carries 16 AWS/GCP peers alongside the original 8 Azure-specific packs (TB-701–719, `DefaultPolicyPackCoverageTests`), plus per-cloud dedicated help topics (TB-720, `/help/cloud-connections/{azure,aws,gcp}`). Evidence-only (no-cloud) review is the *default* path, not a buried option — the opposite of Azure-first.

**Most likely AWS/GCP buyer objection:** depth parity, not presence — 8 of the original packs remain Azure-specific with no direct peer (e.g., landing-zone/WAF variants existed for Azure first and were mirrored later), so a sufficiently deep AWS/GCP technical reviewer may notice the Azure packs have a few more months of maturity/iteration than their AWS/GCP peers, even though counts now match.

**Required fixes before broad exposure:** none block any of the three exposure levels — this category is closer to a differentiator than a risk today.

## 13. Core Product Comprehension

**Founder-independent comprehension score: 76/100.**

`/onboarding` was renamed "First review guide" (TB-674) specifically to fix the vague "getting started" framing, and the Core Pilot checklist now derives its state from actual tenant/review lifecycle rather than manual checkboxes a user could tick without doing the work (TB-675) — both changes attack comprehension directly, not just cosmetics. The score is 76, not higher, because no live session has been recorded proving a first-time principal architect actually understands the review-package/evidence/governance model within 30 minutes without founder narration (§3 gates #12/#15, both UNKNOWN).

**Top confusion points (hypothesized, not observed live):** the distinction between "architecture package" and "architecture creation" (the exact ambiguity the v4 prompt names) — mitigated by the TB-645 / TB-738 buyer-vocabulary pass but not independently re-verified word-for-word on every surface this pass; the Architect/Team/Enterprise pricing tiers' relationship to workspace vs. seat count, which was not fully traced end-to-end.

**Minimum copy/navigation fixes:** none rise to launch-blocking; the highest-leverage next step is a recorded live walkthrough (§3 gate #12) to convert this from a plausible-but-unproven score into a measured one.

## 14. Frontier-AI Competitive Analysis

Carried from `LATEST_GPT55.md` §9/§13 — this pass found no new evidence that changes the frontier-AI competitive picture, because exposure readiness and competitive differentiation are different questions. Summary: policy-pack-driven pre-commit gating, evidence→policy→decision→audit traceability, and per-tenant credential/correlation state are durable and hard to reproduce via ad-hoc prompting; generic architecture critique is commodity. **A skilled principal architect would likely believe ArchLucid is materially better than "Claude + pasted standards" for the *governed, repeatable, auditable* use case specifically — not for one-off critique quality**, which is exactly the same verdict `LATEST_GPT55.md` reached and this pass's exposure-focused inspection did not contradict.

## 15. Principal Architect Dismissal Test

**Persona:** 45-year-old principal architect, daily frontier-AI user, cloud expert, skeptical, low patience for process, allergic to IBM/Oracle pricing complexity.

- **"I need this":** seeing a policy-pack edit change a pre-commit gate outcome live, with a full evidence trail, in the same demo session.
- **"I can do this with Claude":** if the demo only shows critique text quality without showing the governed-gate/audit-trail mechanic — the differentiation is in the workflow, not the prose.
- **What makes them click away:** a pricing page that feels like an order form (checked: it does not — Architect tier is visibly priced) or a demo that requires signup before showing anything (checked: it does not — `/showcase` is unauthenticated).
- **Pricing helps or hurts:** helps, marginally — a named, priced single-seat tier plus quote-led Team/Enterprise reads as M365-simple, not IBM/Oracle-complex, for this persona.
- **UI polish helps or hurts:** helps — Carbon-aligned enterprise chrome signals "not a hackathon demo" to exactly this audience.
- **Trust posture helps or hurts:** helps for evaluation, is neutral (not yet a plus) for purchase, because there is no reference customer to cite.
- **Single most likely dismissal trigger:** this persona probing retrieval depth claims in a live technical demo and finding the honest "bounded multi-hop / single-pass expansion" labeling less impressive than an unqualified "agentic retrieval" claim would have sounded — a direct carry-forward of `LATEST_GPT55.md` §11's finding, unchanged by this pass.

## 16. Founder Delusion Check

Blunt, per the prompt's instruction:

- **Strongest assumption, weakest evidence:** that the product is "not ready for broader exposure" because of UI/trust rough edges. This pass found the opposite — the rough edges named in the prompt are mostly already fixed. The actual weak link is proof (pilots, load testing), not polish.
- **Where founder taste is helping:** the Carbon-design discipline and the buyer-vocabulary pass are real, not cosmetic — they show up as closed, well-scoped backlog rows rather than vague aspirations.
- **Where founder caution is justified:** not flipping the self-serve checkout flag yet. That caution is correct, not excessive.
- **Where founder caution could become avoidance:** treating "Grok choked on the assessment prompt" as a signal to keep re-running assessments instead of running the one thing no assessment can substitute for — an actual controlled-beta cohort.
- **Most dangerous attractive distraction:** further UI/trust polish passes. The marginal next polish pass has a lower expected payoff than the first live pilot, per the same logic `LATEST_GPT55.md` §12 already applies to RAG depth.
- **Boring thing that is probably the real moat:** the same one `LATEST_GPT55.md` names — per-tenant credential/correlation state plus audit reconstruction — unaffected by exposure-readiness questions.
- **What should ship to controlled beta even if imperfect:** everything currently in the product. Nothing in this pass's inspection found a beta-blocking defect.
- **What must not ship publicly (self-service) yet:** the self-serve Team checkout flag, until a load drill and at least one real pilot close.

## 17. Top Weaknesses Ranked

| # | Weakness | Why it matters | RYG impact | Beta impact | Self-service impact | Mention impact | Fastest fix | Classification |
|---|---|---|---|---|---|---|---|---|
| 1 | Launch load drill not yet executed with recorded results | Gate #7 PARTIAL (harness shipped 2026-07-11) | Caps self-service YELLOW | None | Blocking until first run | None | Run `k6-launch-load-drill` or local orchestrator; record in `LAUNCH_LOAD_DRILL.md` | reliability |
| 2 | Self-serve checkout flag off + undogfooded | Pricing promise ("grow into team plans") not currently self-fulfillable | Contributes to self-service YELLOW | None | Blocking | None | One Stripe test-mode dry run before flipping flag | engineering / pricing |
| 3 | Zero completed real-mode pilots | Dominant gap across diagnostic scores (§6) | Caps 30-day usage/purchase probability | None (expected at this stage) | Blocking (proof, not code) | None | Run G-REAL-06 | market validation |
| 4 | No captured marketing screenshots/video | Blocks LinkedIn post *quality* | None (safety unaffected) | None | None | Delays first post | Capture screenshots (M-07), record video (M-16) | design / market validation |
| 5 | Founder-independent comprehension unmeasured | Two gates UNKNOWN, not FAIL, but unproven | Minor | None | Minor | Minor | Record one live 30-min walkthrough | market validation |
| 6 | AI-cost hard-stop for a hypothetical self-serve trial tenant unverified | Could allow spend before a real ceiling is confirmed | Contributes to self-service YELLOW | None | Moderate | None | Verify/confirm existing wallet cap enforcement covers this case | engineering |
| 7 | 8 Azure-specific policy packs still lack AWS/GCP peers by maturity (not count) | Sufficiently deep AWS/GCP buyer may notice iteration-depth gap | Minor | None | Minor | None | Track under existing multi-cloud-parity backlog cadence | engineering |
| 8 | SOC 2 is self-assessment only | Correctly out of `(A)`; still a `(B)` procurement friction point | None (by rule) | None | Minor | None | No action — CPA attestation is TB-135 (tech tracking Done; owner GTM work open as G-REAL-05) | founder decision (already made) |
| 9 | Support bundle is a technical ZIP artifact | Fine for beta, less polished for self-service scale | Minor | None | Minor | None | Add a friendlier wrapper before self-service | design |
| 10 | No formal redaction audit of support bundle | Confidence-reducer if a security-conscious buyer asks | Minor | None | Minor | None | Document existing secret-shaped masking as a short redaction note | copy / security |

## 18. Exposure Plan

**Recommended plan: D. Controlled beta + public LinkedIn mention with request-access.**

- **Audience:** 2–5 founder-selected controlled-beta tenants; unlimited LinkedIn audience for awareness, funneled to a "request access" form, not open signup.
- **CTA:** "Request access" / "Join the beta" pointed at `/get-started`, not "Start now" / "Sign up free."
- **Guardrails:** keep `NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED` off; keep the public showcase static-payload-only; keep support founder-mediated.
- **Pages that must be hidden/fixed:** none — no page in this pass's inspection needs hiding for this plan.
- **AI budget rules:** existing wallet/budget visibility is sufficient for a founder-selected cohort of this size; no new engineering required before this plan starts.
- **Support model:** founder-direct, as today.
- **Metrics to watch:** beta-cohort first-review completion rate; LinkedIn request-access conversion; any anomalous spike in `/showcase` or `/demo/preview` traffic (should stay flat cost-wise regardless of visitor count, given the static-payload design — a spike in *cost* rather than *traffic* on that route would be a regression signal).
- **Kill criteria:** any beta tenant fails to complete a first review without founder intervention after the product is deemed "ready" — signals the comprehension gates in §3 were wrongly marked UNKNOWN-leaning-pass.
- **Success criteria:** at least one beta tenant completes a first review unaided; at least one LinkedIn-driven request-access signup converts to a beta or paid conversation.

## 19. Stop Doing List

**Top 3 improvements not worth doing before controlled beta:** (1) further UI polish passes beyond what has already shipped; (2) further trust-copy wordsmithing on already-buyer-safe pages (health, demo); (3) additional cloud-pack maturity-parity work beyond what TB-701–719 already closed.

**Top 3 improvements not worth doing before public mention:** (1) a full burst-load drill (only needed before self-service, not mention, since the demo path is static and traffic-safe by construction); (2) flipping the self-serve checkout flag; (3) building a formal redaction-audit report before anyone has asked for one.

**Top 3 improvements not worth doing before self-service:** (1) more RAG-V2 retrieval depth (unrelated to exposure risk, per `LATEST_GPT55.md` §16's own stop-doing logic); (2) a second, deeper AWS/GCP maturity-parity pass beyond count-parity (already closed); (3) a customer-reference program before a single pilot has run.

**Founder behaviors that could delay validation:** treating "the assessment prompt was hard to run" as a reason to keep commissioning more assessments instead of running the one controlled-beta cohort that would generate real signal; continuing to harden already-buyer-safe surfaces instead of shipping the burst-load drill this file identifies as the one concrete gap.

**Features that sound enterprise-important but will not move near-term adoption:** a formal third-party-audited redaction report for the support bundle; deeper AWS/GCP policy-pack iteration parity beyond count-parity; SOC 2 CPA attestation and third-party pen-test publication (TB-135/TB-136, both tech-tracking Done — remaining work is owner-executed GTM, not engineering).

## 20. Top Improvement Opportunities

**Verify-before-listing gate applied.** Cross-checked each item below against `TECH_BACKLOG.md` and live code before listing — none of the seven risk-pattern categories the v4 prompt names by example (raw internal language, product-language inconsistency, pricing incoherence, trustworthiness defects, UI polish problems, cloud-neutrality gaps, AI cost/reliability gaps) surfaced a genuinely open, previously-untracked engineering item this pass; what follows are the exposure-specific gaps §3/§11/§20 actually found.

### Tier 1 — Must Fix Before Controlled Beta

_None._ No Tier 1 item was found — controlled beta is GREEN today.

### Tier 2 — Must Fix Before Public Mention

_None engineering-actionable._ The one open item for this tier (M-07/M-16 screenshots/video) is a **market-validation / founder-execution** task, not Cursor-actionable code — tracked in `GTM_BACKLOG.md`, not duplicated here.

### Tier 3 — Must Fix Before Public Self-Service

| Title | Tier | Exposure level blocked | Why it matters | Affected scores | Evidence | Fastest fix | Owner | Recommended engine | Cursor prompt |
|---|---|---|---|---|---|---|---|---|---|
| **Stripe test-mode dry run of self-serve Team checkout** | 3 | Public self-service | `isPublicStripeTeamCheckoutEnabled()` gates code that has, per this pass's inspection, no evidence of an executed end-to-end test-mode purchase. | Self-Service Trial Readiness (62→target 85+) | `marketing/is-public-stripe-team-checkout-enabled.ts` confirms default-off; no dry-run artifact found. | Execute one real Stripe test-mode checkout end to end (signup → payment → webhook → tenant provisioning) before flipping the flag; document the run. | Founder (Stripe test-mode credentials) + Cursor (webhook/provisioning verification) | **Composer** — mechanical verification once test-mode credentials are available | N/A — requires live Stripe test-mode session, not pure code change |

**Shipped (2026-07-11):** ~~**Public-traffic burst/launch load-test drill**~~ — k6 ramp scripts for static showcase/marketing UI paths + authenticated API read burst; `workflow_dispatch` job `k6-launch-load-drill`; results template in `docs/architecture/LAUNCH_LOAD_DRILL.md`. First measured drill run still owner-pending.

**Shipped (2026-07-12):** ~~**Confirm hard per-tenant AI-spend ceiling for a hypothetical self-serve trial signup**~~ — `SelfServiceTrialAiBudgetPolicyProvisioner` + `ITenantAiBudgetPolicyRepository.EnsureDefaultTrialPolicyIfAbsentAsync`; wired into `TrialTenantBootstrapService` after `CommitSelfServiceTrialAsync`.

### Tier 4 — Defer

| Title | Why deferred |
|---|---|
| Deeper AWS/GCP policy-pack maturity-parity pass (beyond count-parity) | Count-parity already closed (TB-701–719); depth-parity is a differentiation nice-to-have, not an exposure blocker. |
| Formal third-party redaction audit of support bundle | No buyer has asked; existing secret-shaped masking is adequate for controlled beta and mention. |
| SOC 2 CPA attestation / third-party pen-test | TB-135/TB-136 tech tracking is Done; remaining work is owner-executed GTM (G-REAL-05, G-ASSURANCE-02), not an engineering gap. |

## 21. Prompt Batching Guidance

**First batch (before public self-service, safe now):**
1. Execute the shipped launch load drill (`k6-launch-load-drill` workflow or local orchestrator) and record results — **founder** traffic sizing + **Composer** for any tuning after first results.

**Second batch (before flipping the self-serve checkout flag):**
3. Stripe test-mode dry run — not a code task; founder-executed with Cursor verifying webhook/provisioning behavior afterward. **Composer** safe for the verification half.

**Third batch (before/alongside the first LinkedIn post, market-validation not engineering):**
4. Capture real screenshots (M-07) and demo video (M-16) — human-only, no engine assignment; tracked in `GTM_BACKLOG.md`, not duplicated here.

No trust-breaking UI defects, pricing/billing canonicalization gaps, cloud-neutrality gaps, or onboarding/help clarity gaps were found this pass requiring a batch — the v4 prompt's priority list (items 1, 2, 5, 6 in its Prompt Batching Guidance section) had nothing open to batch.

## 22. Final Verdict

1. **Should ArchLucid enter controlled beta?** Yes, now.
2. **Should ArchLucid allow public self-service?** Not yet — execute the shipped load drill with recorded results, close AI-ceiling verification in §20 Tier 3, and complete at least one real pilot.
3. **Should the founder start mentioning ArchLucid on LinkedIn?** Yes, with a "request access" CTA, ideally after (not blocked by) capturing real screenshots/video.
4. **Single highest-leverage thing to fix next:** execute the shipped launch load drill with owner-sized traffic and recorded results — then complete at least one real pilot before self-service.
5. **Single most dangerous premature exposure move:** flipping `NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED` to `true` before the load drill has been **executed** with recorded results.

**Blunt sentence:** ArchLucid has already fixed the rough edges this kind of assessment usually exists to find — the real gate left standing is proof under real traffic and real buyers, not more polish.
