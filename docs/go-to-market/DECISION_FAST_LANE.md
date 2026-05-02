> **Scope:** Buyer-facing one-pager — pilot vs procurement paths, honest calendars, escalation triggers; not legal advice or a substitute for executed contracts.

# Decision fast lane (pilot + procurement)

**Audience:** Sponsors, sales engineers, and procurement coordinators who need **where to start** and **what to expect** without reading the full scope contract first.

**Not this doc:** SKU math, detailed API semantics, or attestation claims — use pricing philosophy, API contracts, and Trust Center links below.

---

## A. Pilot path (first useful outcome)

Default motion: **[`docs/CORE_PILOT.md`](../CORE_PILOT.md)** — four steps.

| Step | Outcome |
|------|---------|
| 1 | Structured architecture request submitted |
| 2 | Pipeline completes |
| 3 | Review package finalized (golden manifest committed) |
| 4 | Manifest + artifacts reviewed / exported |

**Measurement:** [`docs/library/PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) (scorecard + proof-package contract).

---

## B. Procurement path (diligence)

1. **Trust index:** [`docs/trust-center.md`](../trust-center.md) (marketing route `/trust`).
2. **SIG / spreadsheet accelerator:** [`PROCUREMENT_RESPONSE_ACCELERATOR.md`](PROCUREMENT_RESPONSE_ACCELERATOR.md) (evidence pointers only).
3. **Evidence ZIP:** linked from Trust Center (`/v1/marketing/trust-center/evidence-pack.zip`).
4. **Pack request / pen-test posture:** [`HOW_TO_REQUEST_PROCUREMENT_PACK.md`](HOW_TO_REQUEST_PROCUREMENT_PACK.md), [`PROCUREMENT_FAQ.md`](PROCUREMENT_FAQ.md).

---

## C. What is signed vs template vs unavailable (V1)

| Artefact class | V1 posture | Notes |
|----------------|------------|--------|
| **DPA / MSA / order form** | **Templates** — require customer legal review before execution | Negotiation-ready; not "click-wrap finished" for every buyer — see playbook objection **DPA placeholders**. |
| **SOC 2 Type II** | **Not issued** (self-assessment + evidence) | Escalate if buyer demands CPA opinion timeline in contract. |
| **Third-party pen-test report** | **V2** vendor cycle; V1 owner-conducted testing narrative | See [`docs/library/V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6c. |
| **Reference customer logo / case study** | **V1.1** minimum for published row | Not a V1 GA gate — [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6b. |

Short answers for common stalls: [`PROCUREMENT_OBJECTION_PLAYBOOK.md`](PROCUREMENT_OBJECTION_PLAYBOOK.md).

---

## D. Typical calendar (honest ranges)

| Motion | Often |
|--------|--------|
| Self-serve / guided first session (Core Pilot) | Same day–few days (team + environment dependent) |
| Internal sponsor “pilot yes/no” | 1–4 weeks (meeting cadence) |
| Enterprise security questionnaire pass | 2–8+ weeks (committee + independent tooling) |
| Contract execution | 2–8+ weeks after paper starts (counterparty legal) |

**Sales-led V1** (live marketplace / self-serve checkout deferred per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md)): quote and order-form path — [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md), [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md).

---

## E. Escalation triggers (involve founder / legal / security lead)

- **Contractual** demand for SOC 2 Type II **attestation date** or third-party pen **vendor report** inside V1 window as a condition of pilot.
- **Custom** data-processing terms that contradict in-repo DPA / addendum stance.
- **Multi-region active/active** or rigid data-residency guarantees not in signed commercial terms.

---

## F. One-email sponsor kit

[`docs/go-to-market/EXECUTIVE_ONE_EMAIL_KIT.md`](EXECUTIVE_ONE_EMAIL_KIT.md)

---

## Related

[`docs/library/DECISION_VELOCITY_SOLUTION_QUALITY_ASSESSMENT_2026_05_02_1.29.md`](../library/DECISION_VELOCITY_SOLUTION_QUALITY_ASSESSMENT_2026_05_02_1.29.md) · [`docs/library/V1_SCOPE.md`](../library/V1_SCOPE.md)
