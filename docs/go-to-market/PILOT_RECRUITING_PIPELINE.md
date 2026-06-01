> **Scope:** Design-partner and pilot-recruiting pipeline artifacts — target account profile, qualification criteria, intake process, and proof-permission capture. This is a founder-led pipeline, not an automated sales CRM.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Design partner and pilot recruiting pipeline

**Audience:** Founder, sales engineer, and any team member sourcing and qualifying pilot accounts.

**Last reviewed:** 2026-06-01

**Related:** [`SERVICE_LED_OFFERS.md`](SERVICE_LED_OFFERS.md), [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md), [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md), [`PILOT_ACCEPTANCE_THRESHOLDS.md`](PILOT_ACCEPTANCE_THRESHOLDS.md).

---

## 1. Target account profile (TAP)

Use this profile to qualify inbound leads and prioritize outreach. All three primary signals should be present for a strong-fit prospect.

### 1.1 Primary signals (all three preferred)

| Signal | Description |
| --- | --- |
| **Active architecture review process** | The account conducts periodic architecture reviews, ARB sessions, or cloud design reviews — even if the current process is manual and ad hoc |
| **Azure-centric cloud footprint** | Primary or growing Azure workloads; cloud-native or cloud-migrating teams |
| **Decision-maker accessible** | CTO, VP Engineering, Principal Architect, or fractional CTO can evaluate and sponsor the pilot within 30 days |

### 1.2 Amplifying signals (increase priority)

- Mid-market or regulated enterprise (healthcare, financial services, government-adjacent): highest compliance sensitivity and clearest ROI framing
- Active or recent SOC 2 / HIPAA / ISO audit pressure
- Architecture team headcount ≥ 2 and growing
- Existing pain point: slow reviews, scattered evidence, manual documentation, post-hoc governance

### 1.3 Disqualifiers (do not advance without owner exception)

| Disqualifier | Reason |
| --- | --- |
| Requires SOC 2 CPA or ISO before pilot start | V1 cannot provide; DEFERRED_SCOPE — do not force fit |
| Requires named public reference before engaging | V1.1 GTM item; do not promise |
| Requires live Azure Marketplace or Stripe checkout | V1.1 / V2; do not promise |
| No Azure footprint and unwilling to use Azure OpenAI | V1 AI path is Azure OpenAI; no workaround in V1 |
| Autonomous infrastructure modification expected | ArchLucid is decision-support; does not push changes |
| Immediate multi-region active/active SLA required | Not available in V1 |

---

## 2. Buyer persona map

| Persona | Title examples | Primary pain | Winning message |
| --- | --- | --- | --- |
| **Architecture lead** | Principal Architect, Head of Architecture, VP Cloud | Reviews take too long; evidence is scattered; governance is inconsistent | "Replace ad hoc documentation with a structured, defensible review package built from the evidence you already have." |
| **CTO / VP Engineering** | CTO, VP Engineering, fractional CTO | Cannot scale architecture reviews without adding headcount | "Evidence-backed reviews in a fraction of the time, with an audit trail your board and auditors can read." |
| **GRC / Compliance lead** | CISO, Compliance Manager, Risk Officer | Architecture decisions lack audit trail; governance gaps before prod deploys | "Pre-commit governance gate and structured audit event trail aligned to your policy packs." |
| **Cloud consultant / boutique firm** | Principal Consultant, Solution Architect | Delivering architecture review reports is manual and hard to scale | "ArchLucid as your delivery infrastructure — bring your own evidence, produce a whitelabel report." |

---

## 3. Qualification criteria (BANT-aligned)

Score each dimension 1–3 before advancing to intake.

| Dimension | 1 — Weak | 2 — Moderate | 3 — Strong |
| --- | --- | --- | --- |
| **Budget** | No budget signal; all free/trial only | Budget exploration; director or below | Defined pilot budget or services line item; CTO/CFO aware |
| **Authority** | No sponsor identified | Technical champion; sponsor TBD | Executive sponsor identified and engaged |
| **Need** | Nice to have; no current pain | Current manual process; aware of the problem | Active pain: slow reviews, compliance gap, scaling failure |
| **Timeline** | >6 months or indefinite | 3–6 months | Ready to start within 30 days |

**Advance to intake when total score ≥ 8.** Scores below 8 → nurture or no-fit per Section 4.

---

## 4. Prospect classification

| Class | Criteria | Next action |
| --- | --- | --- |
| **Qualified** | TAP signals present; BANT score ≥ 8; no hard disqualifiers | Schedule intake call; begin pilot intake form |
| **Nurture** | Moderate fit; BANT 5–7; or one disqualifier that may resolve | Stay in contact; share EXECUTIVE_SPONSOR_BRIEF; re-qualify in 60 days |
| **No-fit** | Hard disqualifier present; BANT < 5; or TAP mismatch | Record reason; do not advance; revisit only if circumstances change |

---

## 5. Outreach artifacts

| Stage | Artifact | Notes |
| --- | --- | --- |
| Cold/warm outreach | [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) one-pager | Link or attach; do not attach full procurement pack unsolicited |
| Discovery call follow-up | [`SHOULD_YOU_EVALUATE.md`](SHOULD_YOU_EVALUATE.md) | Helps prospect self-qualify |
| Qualification confirmed | [`SERVICE_LED_OFFERS.md`](SERVICE_LED_OFFERS.md) SKU summary | Name the offer; do not just say "ArchLucid platform" |
| Pilot proposal | [`SERVICE_LED_SOW_QUOTE_TEMPLATE.md`](SERVICE_LED_SOW_QUOTE_TEMPLATE.md) | Owner reviews each SOW before sending |

---

## 6. Pilot intake form

Collect all of the following before confirming a pilot start date.

### 6.1 Prospect and engagement information

- Account name:
- Primary contact name, title, email:
- Executive sponsor name, title, email:
- Account BANT score (from Section 3):
- TAP signals confirmed (list):
- Disqualifiers reviewed — none present? (Yes / No / Exception noted):

### 6.2 Offer and scope

- Selected offer SKU (from [`SERVICE_LED_OFFERS.md`](SERVICE_LED_OFFERS.md)):
- Agreed scope summary (3–5 sentences):
- Planned start date:
- Planned end date:
- Target number of architecture reviews during pilot:

### 6.3 Data and proof permissions

> **Do not begin a pilot without capturing these permissions.** Proof claims cannot be reused beyond their permission boundary.

- [ ] **Data boundary agreement captured:** Buyer confirms what evidence can be uploaded to ArchLucid (e.g., sanitized Azure exports, redacted diagrams, full internal evidence)
- [ ] **Proof-capture permission scope confirmed:**
  - [ ] Proof can be used internally (ArchLucid operations only)
  - [ ] Proof can be used in anonymized/synthetic form for ArchLucid marketing
  - [ ] Proof can be used as a named case study (requires separate signed release — see [`NAMED_REFERENCE_CUSTOMER_CAPTURE.md`](NAMED_REFERENCE_CUSTOMER_CAPTURE.md))
  - [ ] Proof **cannot** be used outside this engagement (restrict to operations only)
- [ ] **Public / private reference expectation settled:**
  - [ ] Buyer may be a public reference in the future (subject to separate permission — see [`NAMED_REFERENCE_CUSTOMER_CAPTURE.md`](NAMED_REFERENCE_CUSTOMER_CAPTURE.md))
  - [ ] Buyer prefers to remain anonymous; any proof used in external materials must be anonymized
  - [ ] Buyer does not consent to any external reference use

### 6.4 Expected buyer outcomes

Record the buyer's stated success criteria so pilot results can be evaluated against pre-agreed expectations.

- Primary outcome the buyer expects from the pilot:
- Specific metrics the buyer will use to judge success:
- Commercial next step if pilot meets criteria:

### 6.5 Intake approval

- Intake reviewed by founder / owner: Yes / No
- Date:
- Any exceptions or non-standard terms noted:

---

## 7. Public-reference ask routing

If a prospect asks to become a public reference, or if you want to request reference permission:

1. Do not make an informal commitment. Route to [`NAMED_REFERENCE_CUSTOMER_CAPTURE.md`](NAMED_REFERENCE_CUSTOMER_CAPTURE.md) for the formal checklist.
2. Record the request in the intake form under proof-capture permissions.
3. Public references are a V1.1 GTM item — they do not affect the V1 pilot score or release headline readiness.

---

## 8. Pipeline tracking (minimum viable)

Maintain a simple record for each active prospect:

| Field | Description |
| --- | --- |
| Account | Account name |
| Status | Qualified / Nurture / No-fit / Intake / Active Pilot / Commercial Close |
| Offer SKU | Selected service offer |
| BANT score | 1–12 |
| Proof permission | Internal / Anonymized / Named (pending release) / Restricted |
| Next action | Specific next step with date |
| Owner | Who is driving this account |

---

## 9. References

| Document | Purpose |
| --- | --- |
| [`SERVICE_LED_OFFERS.md`](SERVICE_LED_OFFERS.md) | Named offer SKUs |
| [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) | Outreach one-pager |
| [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) | Pilot measurement framework |
| [`PILOT_ACCEPTANCE_THRESHOLDS.md`](PILOT_ACCEPTANCE_THRESHOLDS.md) | PASS/HOLD criteria |
| [`NAMED_REFERENCE_CUSTOMER_CAPTURE.md`](NAMED_REFERENCE_CUSTOMER_CAPTURE.md) | Public reference permission process |
| [`SHOULD_YOU_EVALUATE.md`](SHOULD_YOU_EVALUATE.md) | Prospect self-qualification guide |
| [`BUYER_PERSONAS.md`](BUYER_PERSONAS.md) | Detailed buyer persona profiles |
| [`IDEAL_CUSTOMER_PROFILE.md`](IDEAL_CUSTOMER_PROFILE.md) | ICP detail |
| [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) | GTM overclaim guardrails |
