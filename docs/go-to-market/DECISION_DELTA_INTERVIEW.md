> **Reviewed:** 2026-07-25
> **Scope:** Founder-led paid pilot interview template — decision-delta evidence for GTM Stage 1. Not a product spec.

# Decision-delta interview (paid pilots)

**Audience:** Founder / delivery lead after a committed real-mode or labeled simulator review.  
**Last reviewed:** 2026-07-25

**Related:** [`SERVICE_LED_OFFERS.md`](SERVICE_LED_OFFERS.md) · [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md) · [`PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md`](PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md) · [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md)

---

## When to run

Within **7 days** of sponsor PDF or proof-packet handoff on a **paid** Readiness Review / ARB Report SKU.

---

## Capture fields

| Field | Value |
| --- | --- |
| `runId` | |
| `findingIds[]` | Findings discussed |
| `interviewer` | |
| `participantTitle` | |
| `interviewDateUtc` | |

---

## Questions

1. **Counterfactual approval:** What would you have approved or deferred without ArchLucid on this packet?
2. **Changed priority:** Which finding changed severity, scope, or timeline because of ArchLucid output?
3. **Incorrect output:** Which finding was wrong or unsupported? (`findingId` + why)
4. **Frontier AI substitute:** Could Claude/GPT/Gemini on the same packet have produced an equivalent decision record? What would be missing?
5. **Repeat usage:** Will you run review #2 in ArchLucid? If no, what is the stop trigger?
6. **Budget:** Would you spend your own budget or recommend team budget? At what price band?

---

## Redaction rules (buyer-safe case study)

- Remove customer name, subscription IDs, and raw infrastructure identifiers unless permissioned.
- Keep **finding category + severity + decision outcome**; drop internal employee names unless quoted with approval.
- ROI numbers only when customer authorized external use (`<<QUOTE_APPROVAL_REFERENCE>>` pattern in reference-customer templates).
- Label execution mode (**Real / Simulator / Mixed**) on any exported excerpt.

---

## PASS / FAIL for decision advantage

| Outcome | Criteria |
| --- | --- |
| **PASS** | ≥1 documented decision change attributable to an ArchLucid finding not present in participant's manual AI pass |
| **WARN** | Outputs confirmatory only — still valuable for packaging/audit |
| **FAIL** | Participant would not run review #2; primary reason recorded |

Store summaries under `docs/go-to-market/validation-runs/` (local; do not commit customer-identifying content without permission). Merge outcomes into the per-pilot row in [`validation/PAID_PILOT_EVIDENCE_LEDGER.md`](validation/PAID_PILOT_EVIDENCE_LEDGER.md). Attach a buyer-safe [`validation/DECISION_CHANGE_ADDENDUM.md`](validation/DECISION_CHANGE_ADDENDUM.md) to the proof packet when decision delta is material.
