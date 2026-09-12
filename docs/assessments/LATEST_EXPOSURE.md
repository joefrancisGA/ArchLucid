> **Scope:** Canonical **broader exposure readiness** assessment (v4). Companion to [`LATEST_GPT55.md`](LATEST_GPT55.md) (strategic `(A)` headline). This file answers a different question: whether ArchLucid should be shown to people outside the founder’s direct control, and under what constraints.
> **Prompt:** [`ASSESSMENT_PROMPT_SERIES.md`](ASSESSMENT_PROMPT_SERIES.md) § Broader exposure readiness (v4).

# ArchLucid Broader Exposure Assessment — Controlled Beta: YELLOW / Public Self-Service: RED / Public Mention: YELLOW

**Pass date:** 2026-09-12, **00:39 UTC**. **Computed fresh** — companion rescore aligned with [`LATEST_GPT55.md`](LATEST_GPT55.md) ROI-batch-4 pass (prior file archived at `docs/archive/assessments/LATEST_EXPOSURE-2026-09-11-pre-roi-batch4.md`).

**Reasoning engine:** Cursor Composer 2.5, code-and-doc desk review. **No live Azure OpenAI call. No live click-through of a deployed host this pass.** Simulator unit tests (lifecycle, pre-commit gate, disposition-aware ROI) **28 passed**.

**Inspected HEAD:** `66edde7b91` (`cursor/arch-quality-roi-improvements-0d83`).

---

## 0. Broader Exposure RYG Summary

| Exposure path | RYG | Verdict | Why | Conditions to proceed |
|---|---|---|---|---|
| Controlled beta | **YELLOW** | Proceed only with founder-selected tenants, handholding, and explicit claim/cost guardrails. | (1) V1 ship Gate 1 is **UNKNOWN on this HEAD** (ship-gate hook wired; live smoke not run this pass). (2) G4 proof packets are **0 of 3**. (3) Export/audit honesty improved (sendable covers, audit CSV posture, dual-channel note on buyer audit) — reduces overclaim risk but does not replace live witness. | Founder-selected users only; Quick Scan **AI off** until **M-110**; run `release-smoke` before the first guest; Stage 0 claim allowlist; no self-serve checkout flag. |
| Public self-service | **RED** | Do not open unknown-user signup/pay. | (1) Stripe checkout URLs are **placeholders**; live keys not flipped (correctly deferred, but that **is** a self-service blocker). (2) Launch-load / LinkedIn-burst drills **not executed** (**G-SCALE-02** Not started). (3) Nobody outside the founder has a logged Real packet — self-service would expose an unproven first-review to strangers **and** to LLM cost. | At least: observed Gate 1 PASS on staging, **G-SCALE-01/02** recorded, **M-110** decided, live billing **or** an explicitly non-paywalled trial with hard AI caps proven under abuse, G4 ≥1 clean Real row. |
| LinkedIn / public mention | **YELLOW** | Mention is allowed with a **request-access** CTA and Stage 0 claims; not a blast with product screenshots. | (1) Several LinkedIn posts are already **Done** in GTM; that does not make **screenshot-ready** UI. (2) **M-07** polished workflow shots are **Not started**. (3) Public showcase is static Claims-first (**M-107** Done) — good for cost isolation — but overclaim risk (seed vs live) remains if the founder improvises. | CTA = request access / join beta; no “sign up and pay”; no live-agent claims on Workspace B; capture **M-07** before screenshot posts; keep Quick Scan sample-only. |

### Exposure Recommendation

**Proceed with controlled beta and controlled public mention, but not self-service.**

The product is past “hide it because the UI is a prototype.” It is **not** past “strangers can click Start and we will look like a governed architecture company.” Controlled beta is how you get the missing G4 rows. Public mention is how you fill a waitlist — **if** the CTA cannot create unconstrained AI spend. Public self-service is how you convert a LinkedIn spike into a cost incident and a “wrapper” screenshot thread.

**Safest next exposure move:** 2–5 founder-selected architects, Workspace A + one Real extractor ZIP, request-access landing for everyone else.

**Riskiest premature move:** flipping `NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED` **or** enabling anonymous Quick Scan AI **or** posting live-looking screenshots of seed-backed Workspace B.

**One-sentence blunt verdict:** ArchLucid is safe to show to people the founder can call back, and unsafe to show to people the founder cannot.

---

## 1. Title and Scope

**Title:** ArchLucid Broader Exposure Assessment — Controlled Beta: YELLOW / Public Self-Service: RED / Public Mention: YELLOW

- **Timestamp:** 2026-09-12 00:39 UTC
- **Engine used:** Cursor Grok 4.6 (desk review; simulator tests only)
- **Source materials inspected:** v3 read list in [`LATEST_GPT55.md`](LATEST_GPT55.md) §1, plus `PRICING_PHILOSOPHY.md`, `pricing.json`, billing/system-health/auth-callback UI tests, `CLAIM_READINESS_STATUS.md`, `CONNECTOR_READINESS_MATRIX.md`, `LOAD_TEST_BASELINE.md` (via trust-center scalability section), GTM P0 rows
- **Code / UI regions inspected:** `/pricing`, `archlucid-ui/public/pricing.json`, `OperatorBillingSettingsClient` buyer-polish tests, `SystemHealthPage` buyer-polish tests, `AuthCallbackAccessPanel`, `SelfServiceTrialAiBudgetPolicyProvisioner`, cloud-connections evidence-only copy, ITSM `NativeEnabled`, AWS/GCP extractor scripts
- **Limitations:** no deployed-environment click-through; no k6 launch-load execution; probabilities are calibrated ranges, not measured conversion

---

## 2. All Scores Up Front

| Score | Value | Feeds `(A)`? |
|---|---|---|
| **(A) V1 headline readiness** | **78.18%** | Yes (v3 model, this pass) |
| **(B) Procurement / market realism** | Informational — rigid RFP **weak**; honest packet **usable** | No (weight 0) |
| Trustworthiness | **73** | Exposure only |
| UI Polish | **72** | Exposure only |
| Demo Safety | **68** | Exposure only |
| Public Self-Service Readiness | **44** | Exposure only |
| LinkedIn / Public Mention Readiness | **67** | Exposure only |
| Controlled Beta Readiness | **74** | Exposure only |

---

## 3. Exposure Gate Scorecards

### Controlled Beta Gate

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | First review completes end to end | **UNKNOWN** | Unit lifecycle tests PASS; `release-smoke.ps1` ship-gate hook exists but live smoke not run this pass. Fastest: `scripts/release-smoke.ps1` |
| 2 | Demo workspace explorable safely | **PASS** | G-REAL-02/03 owner-signed Playwright; `@release-gate` smoke now asserts spine export strip, audit export button, classification + semantic-band chips (ROI batch 3–4) |
| 3 | No trust-breaking internal language on core beta paths | **PASS** (residuals) | No “sample shell” / “not part of the sample shell” hits in UI; help markdown strips `V1 GA`; admin ITSM may still leak config keys on **internal** routes |
| 4 | Pricing does not contradict buyer conversations | **PASS** | Single catalog: Architect $169 / Team $1169 / Professional $2299; quote-led; test Stripe labeled |
| 5 | AI spend bounded by operator control | **PASS** | Tenant AI budget + trial `DefaultTrialAiBudgetUsd` provisioner; LLM reserve/settle |
| 6 | Founder can support users directly | **PASS** | Definition of controlled beta |
| 7 | System health useful, hidden, or polished restricted | **PASS** | Buyer-polished system-health tests; admin-gated |
| 8 | Auth/access does not dead-end | **PASS** | `AuthCallbackAccessPanel` request-access; invite recovery → `/signup` |
| 9 | Architecture package flow understandable | **UNKNOWN** | Help/core-pilot exists; founder-independent score 58 — needs a guided 30-min |
| 10 | No tenant isolation uncertainty on beta path | **PASS** (residuals) | ADR 0037; G3 PASS with residuals; SPA sessionStorage disclosed |
| 11 | Cloud connector page does not alienate non-Azure | **PASS** | AWS/GCP ZIP + polling; evidence-only first-class copy |
| 12 | Survives guided 30-minute walkthrough | **UNKNOWN** | Owner-signed A/B smoke is not a hostile PA session |

**Controlled beta RYG: YELLOW** — two UNKNOWNs on the path a guest actually walks, plus G4 empty. Not RED: no trust-breaking core-path copy found, AI can be operator-bounded, isolation model is real.

### Public Self-Service Gate

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Public pricing and in-app billing one canonical model | **PASS** | `pricing.json` + CI single-source guards |
| 2 | Single-user Architect plan exists | **PASS** | $169 / 1 seat / 5 reviews in `pricing.json` |
| 3 | Trial signup and access-request clear | **PARTIAL** | Request-access exists; trial is TEST-mode / sales-led |
| 4 | AI budget limits visible and enforced | **PASS** (server) | Trial budget provisioner; visibility to a stranger is weaker than enforcement |
| 5 | Public demo cannot create uncontrolled AI cost | **FAIL** until **M-110** stays sample-only **and** any live demo remains static | Showcase static is good; anonymous Quick Scan AI still an owner-flip away |
| 6 | Public demo traffic rate-limited and isolated | **UNKNOWN** | Rate limiting exists; launch isolation drill not recorded |
| 7 | Load test plan passed expected launch traffic | **FAIL** | Plan/harness exist; **G-SCALE-02** Not started |
| 8 | System health buyer-safe or hidden | **PASS** | Admin / buyer-polish |
| 9 | Billing hides Stripe/internal details from normal users | **PASS** (buyer-polish tests) | Do not expose `stripeCustomerId` in polished shell |
| 10 | No raw IDs/API/debug on buyer-accessible pages | **PARTIAL** | Marketing cleaned; operator/help internals can still leak if a public user reaches them |
| 11 | Core empty states useful | **PARTIAL** | Much work shipped; still founder-shaped on Operate layer |
| 12 | Help/onboarding buyer-safe | **PARTIAL** | Getting-started improved; still dense |
| 13 | Cloud connectors platform-neutral | **PASS** | §2.19 + UI evidence-only |
| 14 | Support path clear | **PARTIAL** | `sales@archlucid.net` / trust center; no 24/7 |
| 15 | Usable without founder explanation | **FAIL** | Comprehension 58; G4 0; Gate 1 UNKNOWN |

**Public self-service RYG: RED.**

### LinkedIn / Public Mention Gate

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Landing/pricing not embarrassing or contradictory | **PASS** | Quote-led; Architect present; placeholders not sold as live |
| 2 | Public story clear in one sentence | **PARTIAL** | Positioning exists; easy to over-claim “AI review” |
| 3 | Screenshots/video without rough internal UI | **FAIL** | **M-07** Not started; **M-16** not done |
| 4 | Request-access flow works | **PASS** | Auth callback + signup recovery tests |
| 5 | Public claims do not outrun product | **PARTIAL** | Stage 0 allowlist exists; G4 HOLD must appear in founder discipline |
| 6 | Demo path controlled or gated | **PASS** | Static showcase canonical |
| 7 | Pricing not IBM/Oracle friction | **PARTIAL** | Architect SKU helps; Team/Pro bundle still needs a talk track |
| 8 | One-license path conceptually clear | **PASS** | Architect $169 |
| 9 | Health/policy/billing/trust won’t undermine if clicked | **PASS** with residual admin routes | Trust center honest; don’t deep-link `/administration/*` |
| 10 | Clear CTA: request access / guided trial / join beta | **PASS** if founder uses it | Quote + request-access; **not** “subscribe now” |

**LinkedIn RYG: YELLOW** — mention yes, screenshot-led blast no.

---

## 4. V1 Ship Gate

Same six items as v3 [`LATEST_GPT55.md`](LATEST_GPT55.md) §4: **1 UNKNOWN**, **2–6 PASS** (2 corpus/evaluator; 4 mechanism; 5 owner-signed Playwright not re-run). **No FAIL.** UNKNOWN on Gate 1 **caps broad exposure**, not `(A)`.

---

## 5. Weighted Quality Scorecard

Identical to this pass’s v3 model (fresh compute):

| # | Quality | Score | Weight | Contribution | Deficiency |
|---|---------|------:|-------:|-------------:|-----------:|
| 1 | Decision-Changing Insight Density | 74 | 13 | 9.62 | 338 |
| 2 | Differentiability / Defensibility | 79 | 13 | 10.27 | 273 |
| 3 | Governed Review Integrity | 83 | 13 | 10.79 | 221 |
| 4 | Correctness & Evidence Integrity | 81 | 12 | 9.72 | 228 |
| 5 | AI / Agent Readiness | 77 | 10 | 7.70 | 230 |
| 6 | Time-to-Value | 71 | 10 | 7.10 | 290 |
| 7 | Proof-of-ROI Readiness | 79 | 9 | 7.11 | 189 |
| 8 | Sponsor / Operator Comprehension | 69 | 8 | 5.52 | 248 |
| 9 | Runtime & First-Review Reliability | 76 | 7 | 5.32 | 168 |
| 10 | Adoption Friction | 73 | 5 | 3.65 | 135 |
| | **(A)** | | **100** | **76.80** | |

Per-quality justification lives in [`LATEST_GPT55.md`](LATEST_GPT55.md) §7. Exposure uses additional categories in §7–§13 below rather than re-scoring `(A)` for polish.

---

## 6. Diagnostic Scores

Reconcile with 76.80% headline: **the product can be V1-ready and still exposure-YELLOW/RED.** That is the point of v4.

| Diagnostic | Calibrated range / score | Notes |
|---|---|---|
| Decision Advantage | **61 / 100** | Packaging/enforcement, not smarter Claude |
| Frontier-AI survival (12-month) | **48–64%** | See v3 §3 |
| 30-day voluntary reuse | **18–38%** unguided; **40–58%** held beta | |
| Sponsor paid-pilot | **12–28%** pre-G4; **28–48%** post-packets+invoice | |
| Dismissal: “just a wrapper” | **55–70%** first unguided session | Reference: PA tool cynicism |
| Dismissal: UI/prototype smell | **25–40%** | Carbon work reduced this; density remains |
| Dismissal: pricing complexity | **20–35%** | Architect SKU exists; bundle still confusing |
| Dismissal: trust/security | **30–45%** on RFP path; **15–25%** on founder-led beta | Honest SOC story |
| Public self-service visitor → trial | **2–8%** if opened today | Almost none should be opened |
| Public demo → cost/ops incident (if Quick Scan AI on + LinkedIn blast) | **15–35%** | Reference: unauthenticated LLM demos |
| Differentiated vs frontier AI at 12 months | **48–64%** | Same as survival |

**Calibration method:** reference class first (enterprise review tools, AI-wrapper SaaS, public LLM demos), then ArchLucid-specific +/− from G4=0, Gate 1 UNKNOWN, shipped budgets/packs/isolation, quote-led pricing.

---

## 7. Trustworthiness Assessment

**Score: 72 / 100.** A skeptical buyer in 10–20 minutes of **marketing + showcase + pricing + trust center** can take the company seriously. The same buyer dumped into Operate-layer admin without a guide will smell internals.

### Top 10 trust breakers / reducers

| # | Item | Class | Beta? | Blocks self-service? |
|---|---|---|---|---|
| 1 | G4 empty while copy implies proven review | Confidence-reducing (trust-breaking if claimed “proven”) | Acceptable if Stage 0 | Yes if overclaimed |
| 2 | SPA access token in `sessionStorage` | Confidence-reducing (disclosed) | Acceptable with disclosure | Security-review delay |
| 3 | No CPA SOC 2 / no 3P pen test | Confidence-reducing for RFP; honest | Acceptable | Often yes for procurement, not for PLG |
| 4 | Gate 1 UNKNOWN on this HEAD | Confidence-reducing | Fix before guests | Yes |
| 5 | Seed-backed Workspace B mistaken for live agents | Trust-breaking **if mis-narrated** | M-111 footnote helps | Yes |
| 6 | Simulator-shaped dollars as customer savings | Trust-breaking if shown | Forbidden on sponsor surfaces | Yes |
| 7 | Admin ITSM / config-key leakage on internal routes | Confidence-reducing | OK if not in beta tour | Yes if reachable anonymously |
| 8 | Placeholder Stripe URLs if presented as live checkout | Trust-breaking | Quote-led avoids | Yes — keep flag off |
| 9 | G5 real-LLM artifact dated 2026-06-25 | Harmless for beta; stale for “we just proved real” | Acceptable | Refresh before public AI claims |
| 10 | Dual audit channels (SQL vs log-only baseline) | Confidence-reducing for security reviewers | Explain | Questionnaire delay |

**Fastest fixes:** Stage 0 discipline (no new code); run smoke; do not enable checkout or Quick Scan AI.

**Regulated-enterprise evaluation:** **yes for a guided beta** with the evidence pack ZIP. **no for unattended self-serve procurement.**

---

## 8. UI Polish Assessment

**Score: 71 / 100.** Closer to Carbon enterprise than to a weekend prototype. Still founder-shaped: density, Operate-layer sprawl, first-click “what is a package.”

### Top 10 polish problems likely to hurt conversion

1. First-session cognitive load (package vs review vs governance) — **launch blocker for self-service**; **beta-acceptable**
2. Missing polished screenshot set (**M-07**) — **mention blocker**
3. Operate links visible too early — **beta-acceptable**
4. Help pages still long — **polish backlog**
5. Pricing grid vs Architect story needs a talk track — **beta-acceptable**
6. Empty Operate states for unused ITSM — **beta-acceptable**
7. Duplicate orientation strips on some hubs — **polish backlog**
8. System health too technical if a buyer is deep-linked — **hide / admin**
9. Policy pack inspect still expert-shaped — **beta-acceptable** (it **is** the moat)
10. Inconsistent “Start now” vs quote CTA — **polish backlog**

**Highest-leverage UI fixes (exposure, not `(A)`):** none required before controlled beta except **do not regress buyer-polish**. Before mention: **M-07**. Before self-service: first-click spine + empty states + no admin leaks.

**Embarrassing if screenshotted today:** dense Operate home, any raw ID that escaped disclosure, Workspace B without seed footnote.

**Acceptable now:** `/pricing`, `/showcase/claims-intake-modernization`, trust center, request-access.

**Founder-dependent?** **Yes** for first review. **No** for “what is this company” on marketing pages.

---

## 9. Pricing and Billing Coherence

**Pricing coherence score: 76.** **In-app billing coherence: 73.**

- Public and catalog share Architect / Team / Professional / Enterprise.
- Architect **$169** exists (one-license path).
- Team **$1,169** (5 seats + workspace) and Professional **$2,299** (10 seats) — not the older $499 Team footnote in stale GTM prose; **`pricing.json` `effectiveDate` 2026-09-07** is SoT.
- Workspace + seat add-ons **can** confuse; quote panel placement is the mitigation.
- Enterprise custom — hide from self-serve; fine for sales.
- AI credits + hard cutoffs exist per SKU (`llmHardCutoffUsdPerUtcMonth`).
- Feels closer to **GitHub/M365** on Architect; closer to **enterprise quoteware** on Team/Pro — appropriate for sales-led V1.

**Monetization risk:** confusion, not missing SKU. **Near-term model:** keep quote-led; Architect as conceptual entry; do not flip Team checkout.

**Must canonicalize before self-service:** live Stripe URLs, no placeholders, in-app billing = public numbers, hard AI stop visible in UI, grandfathering rules in plain language.

---

## 10. Demo, Trial, and AI Cost-Control Readiness

**RYG: YELLOW for beta, RED for public AI demo.**

**Top risks:** anonymous Quick Scan AI; LinkedIn → public demo burst; founder enabling checkout flag; seed workspace sold as Real.

**Guardrails before public traffic:** `AnonymousExecutionEnabled` off; showcase static; trial budgets provisioned (already coded); rate limits; demo traffic isolated from paid catalogs (claim-honesty **M-217**); founder kill switch.

**Customer-owned AI provider:** not a V1 hosted gate (platform AOAI). Do not advertise BYO as self-serve.

---

## 11. Reliability and Load Exposure

**Load readiness score: 55.**

k6 CI smoke is **not** a LinkedIn-day rehearsal. **G-SCALE-01/02** Not started. Trust-center scalability section is honest (single-region, not active/active).

**Minimum load test plan before self-service:** public-showcase burst + authenticated first-review burst + AOAI 429/breaker observation + demo vs tenant isolation check. Until recorded: **no public self-service**, **no hashtag blast**.

**Launch-blocking for self-service:** unrun launch-load; Gate 1 UNKNOWN; G4 empty (operational, not k6).

---

## 12. Cloud Neutrality and Platform Advocacy

**Platform-neutrality score: 80.**

Azure **hosts** the product (ADR 0020). AWS/GCP **analysis** is V1: scripts, upload, polling, retail grounding (**TB-603 Done**), peer packs. Evidence-only is first-class. Most likely AWS/GCP objection: “you’re an Azure company.” Answer: hosting vs target-cloud — show GCP ZIP + pack auto-enable. Required before broad exposure: keep Azure-default from reading as Azure-only in the wizard (already a known copy risk — talk track, not a rebuild).

---

## 13. Core Product Comprehension

**Founder-independent comprehension: 58.**

Principal architect after 30 minutes **can** understand “governed review package” if the founder hits ingest → finding with policy id → disposition → export. They **will not** infer that path from chrome alone.

**Confusion points:** architecture package vs review vs manifest; sample vs Real; governance vs approvals; ROI headline vs per-system rows; Azure host vs AWS target.

**Minimum copy/nav fixes for beta:** none blocking. For self-service: one “Start a review” spine and hide Operate.

---

## 14. Frontier-AI Competitive Analysis

See [`LATEST_GPT55.md`](LATEST_GPT55.md) §9 for the commodity/durable table. Exposure-specific: **public mention that sounds like “AI that reviews architecture” invites wrapper dismissal in the comments.** Mention **governed packages, policy packs, audit, ITSM** or do not mention.

**Would a skilled PA believe it is materially better than Claude + prompt + pasted standards?** Not from a LinkedIn screenshot. **Yes** from a 20-minute pack-delta + audit CSV in a controlled beta. Survival probability in §6.

---

## 15. Principal Architect Dismissal Test

Persona: 45, daily frontier-AI, allergic to IBM pricing.

- **“I need this”:** their policy, their evidence, a blocked bad commit.
- **“I can do this with Claude”:** generic findings, seed demo, no pack delta.
- **Click away:** dense home, unclear CTA, Enterprise-only vibe, “V1” leftover (mostly stripped).
- **Pricing:** Architect $169 **helps**; unexplained $2,299 **hurts**.
- **UI polish:** 71 **helps vs prototype smell**; density still hurts.
- **Trust:** honesty **helps**; missing CPA **hurts** only if they are in RFP mode.
- **Single most likely trigger:** wrapper dismissal (**55–70%** unguided).

---

## 16. Founder Delusion Check

- **Weakest evidence:** “GREEN controlled beta” as *unsupervised* product-readiness — this pass is **YELLOW**.
- **Taste helping:** claim honesty, ROI non-summing, cloud ZIP posture, quote-led checkout.
- **Caution justified:** not flipping live Stripe; Quick Scan sample-only.
- **Caution becoming avoidance:** not running G-REAL-06 because the UI is not perfect.
- **Dangerous distraction:** public self-service as a substitute for five beta users.
- **Boring moat:** audit + finding-id + gate.
- **Ship to controlled beta imperfect:** the current wizard + sample + Real path.
- **Must not ship publicly yet:** checkout flag, Quick Scan AI, screenshot blast, “proven in production” language.

---

## 17. Top Weaknesses Ranked

| Rank | Weakness | Why | RYG impact | Beta | Self-service | Mention | Fastest fix | Class |
|---|---|---|---|---|---|---|---|---|
| 1 | G4 = 0 Real packets | No proof | Caps mention claims | OK | Blocks | Constrains copy | G-REAL-06/07 | Market validation |
| 2 | Gate 1 UNKNOWN this HEAD | First review unwitnessed | YELLOW beta | Run smoke | Blocks | — | `release-smoke.ps1` | Reliability |
| 3 | Launch-load unrun | Burst risk | RED self-serve | OK | Blocks | Limits blast | G-SCALE-01/02 | Reliability |
| 4 | M-07 shots missing | Cannot show UI | YELLOW mention | OK | — | No screenshots | Capture | Founder |
| 5 | Wrapper dismissal | Competitive | Mention comments | Handhold | Death | Copy | Pack-delta demo | Market |
| 6 | M-110 Quick Scan undecided | Cost/trust | RED if AI on | Keep off | Blocks | — | Leave sample-only | Founder decision |
| 7 | Founder-dependent first session | Comprehension 58 | YELLOW | Handhold | FAIL #15 | — | Spine only | Design/copy |
| 8 | Checkout placeholders | Self-serve lie if flipped | RED self-serve | Quote-led | Blocks | Don’t CTA Subscribe | Keep flag off | Pricing |
| 9 | Assurance paper | RFP | `(B)` | OK | Procurement | Honest | Packet | Founder later |
| 10 | Pricing talk-track | Confusion | Partial | Explain | Hurts | Architect first | Script | Pricing |

---

## 18. Exposure Plan

**Recommended plan: C now, D after M-07 — not E/F/G.**

**C. Controlled beta + private LinkedIn DM outreach** until screenshots exist. **D. Controlled beta + public LinkedIn mention with request-access** once **M-07** exists and Stage 0 copy is locked.

| Element | Rule |
|---|---|
| Audience | 2–5 named architects; DMs to known peers |
| CTA | Request access / book a guided review — **not** self-serve pay |
| Guardrails | Quick Scan AI off; checkout flag off; Stage 0 claims; Workspace B seed-labeled |
| Hide/fix | Do not tour `/administration/integrations/itsm` internals; don’t deep-link system health |
| AI budget | Tenant/trial hard caps on; no anonymous completions |
| Support | Founder Slack/email, 1-business-day |
| Metrics | First review completed; return in 14 days; “wrapper” said Y/N; AI $ / tenant |
| Kill | Any cross-tenant symptom; any unconstrained AI bill; any public “SOC 2 certified” paraphrase |
| Success | ≥1 clean Real packet; ≥1 user completes first review without panic; no trust incident |

---

## 19. Stop Doing List

**Before controlled beta:** MCP, Marketplace, extra engines, Redis-as-default.

**Before public mention:** screenshot posts, live-agent claims, pricing “subscribe” CTAs, Quick Scan AI.

**Before self-service:** everything in public gate FAIL/UNKNOWN — do not “just flip the flag.”

**Founder behaviors that delay validation:** polishing instead of G-REAL-06; waiting for CPA; treating YELLOW as RED and hiding from five friends.

**Enterprise-important, won’t move near-term adoption:** plugin store, CloudEvents recipes as a **marketing** story, multi-region.

---

## 20. Top Improvement Opportunities

Verify-before-listing: do not re-open TB-599–604, connectors, TB-603 costing, trial budget provisioner.

### Tier 1 — Must Fix Before Controlled Beta

**1. Observe first review on staging (release-smoke)**  
- Blocks: Controlled beta guests  
- Scores: Runtime, Demo Safety, Gate 1  
- Evidence: UNKNOWN this pass  
- Fastest fix: run existing script  
- Owner: founder / operator  
- Engine: **Composer** (invoke), not a product rewrite  
- **No new feature prompt**

**2. Keep Quick Scan AI off; record M-110**  
- Blocks: accidental public AI  
- Owner: founder  
- Engine: N/A

**3. Stage 0 claim card in the founder’s pocket**  
- Blocks: trust-breaking mention  
- Owner: founder; **Sonnet** can print a 12-line card from `PUBLIC_CLAIM_BOUNDARY_GUIDE.md`

### Tier 2 — Must Fix Before Public Mention

**4. M-07 / M-108 screenshots** — Owner: founder. Composer shot-list.  
**5. Pack-delta 8-minute demo script** — Owner: founder. **Sonnet**. Moves wrapper dismissal.  
**6. Do not use Workspace B as “live agents”** — already footnoted; enforce in posts.

### Tier 3 — Must Fix Before Public Self-Service

**7. G-SCALE-01 → G-SCALE-02 measured** — Owner: founder/ops.  
**8. Live billing canonicalization (keys, no placeholders, visible hard stops)** — Owner: founder (keys) + engineering only if smoke fails.  
**9. Founder-independent first-click spine** — Only after 5 beta sessions say the same confusion twice. **Sonnet** for copy; do not invent nav.

### Tier 4 — Defer

MCP, Marketplace, DTF, community Graph-RAG, CPA SOC 2 as a **product** gate, AT user testing.

**Cursor prompt (only if Gate 1 smoke fails — do not start otherwise):**

```
Current problem: scripts/release-smoke.ps1 failed on HEAD <sha> at stage <N>.
Desired: first review create→execute→commit→golden manifest + ≥1 artifact on the smoke path.
Scope: fix the failing stage only; no unrelated polish.
Acceptance: release-smoke green; no new public routes.
Tests: existing smoke + the failing unit/integration.
Non-goals: MCP, checkout flag, Quick Scan AI, new engines.
```

**Fable prompt (mention):** draft a LinkedIn post that names governed packages and request-access, forbids SOC-certified and live-agent claims, and does not include UI screenshots until M-07.

---

## 21. Prompt Batching Guidance

| Batch | Work | Priority | Model |
|---|---|---|---|
| First | Run smoke; Stage 0 card; confirm Quick Scan off | Trust + first-review | Composer-safe |
| Second | M-07 shot-list; pack-delta script | Demo + differentiation | Sonnet-safe |
| Third | Load-drill execution notes; billing copy if keys flip | Self-service only later | Composer; strong-model if isolation/auth touched |

Fable: mention copy only. Strong-model: anything touching review generation or tenancy.

---

## 22. Final Verdict

1. **Should ArchLucid enter controlled beta?** **Yes, with constraints** (YELLOW): founder-selected, smoke observed, Quick Scan AI off, Stage 0 claims.
2. **Should ArchLucid allow public self-service?** **No** (RED).
3. **Should the founder mention ArchLucid on LinkedIn?** **Yes, carefully** (YELLOW): request-access CTA, no screenshot blast until **M-07**, no “proven” or “certified.”
4. **Single highest-leverage next fix:** **G-REAL-06 Run 1** (and run `release-smoke` before the first guest).
5. **Single most dangerous premature exposure move:** **public self-serve checkout or anonymous Quick Scan AI on the back of a LinkedIn post.**

**Blunt sentence:** Show it to people you can phone; do not open the front door.
