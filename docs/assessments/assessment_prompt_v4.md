# ArchLucid Broader Exposure Readiness Assessment — Red / Yellow / Green Gate Prompt

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
Can a skilled architect using frontier AI alone reliably reproduce the same governed, policy-aware, evidence-backed, repeatable, auditable review package — with comparable consistency, role separation, executive packaging, policy traceability, and organizational adoption?

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
2. Governed repeatability across an organization — same policy-aware, evidence-backed, auditable review package produced consistently by different operators.
3. Trustworthy buyer first impression.
4. 30-day voluntary usage probability.
5. Executive purchase probability.
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
   - review packages versus architecture creation
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
| 8 | Executive / Operator Comprehension | 8 |
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
9. Core review package flow is understandable.
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
3. Executive summary / ROI output is coherent and not misleading.
4. Export/package generation works.
5. Operator UI does not break during first-review / demo path.
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
3. Executive sponsor agrees to paid pilot.
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
- Executive Purchase Probability
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
- what a review package is
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
