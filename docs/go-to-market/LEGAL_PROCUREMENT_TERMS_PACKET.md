> **Scope:** Legal and procurement terms packet for founder-led paid pilots. This is a planning and conversation guide, not a substitute for executed contracts. All legal commitments require owner review and, where applicable, legal counsel sign-off.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Legal and procurement terms packet

**Audience:** Founder / operator preparing for a first paid-pilot procurement conversation; buyers' legal or procurement teams reviewing commercial terms.

**Last reviewed:** 2026-06-01

**Approval path:** Owner must review before sending to any buyer. Items marked **"owner/legal review required"** must not be committed verbally or in product copy without that review.

---

## 1. Purpose

This packet gives the founder or operator a single-document starting point for common procurement term questions. It maps each question to the current source document (or marks it as draft / not yet available) and identifies which items require owner or legal review before commitment.

---

## 2. MSA / contract terms posture

| Term area | Current status | Source | Owner action required |
| --- | --- | --- | --- |
| Master Services Agreement (MSA) template | Available — draft | [`MSA_TEMPLATE.md`](MSA_TEMPLATE.md) | Owner + buyer legal review before execution |
| SOW / quote template | Available | [`SERVICE_LED_SOW_QUOTE_TEMPLATE.md`](SERVICE_LED_SOW_QUOTE_TEMPLATE.md) | Owner review per engagement |
| Order form template | Available | [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) | Owner review per engagement |
| Data Processing Addendum (DPA) | Template available | [`DPA_TEMPLATE.md`](DPA_TEMPLATE.md) | Owner + buyer legal review before execution |
| Cross-tenant data processing addendum | Template available | [`CROSS_TENANT_DATA_PROCESSING_ADDENDUM.md`](CROSS_TENANT_DATA_PROCESSING_ADDENDUM.md) | Owner review before execution |
| Redline owner | Founder / owner | — | Owner is the redline contact for V1 pilots |
| Legal counsel engaged | Owner decision required | — | Owner must confirm before complex enterprise redlines |

---

## 3. Data-retention commitments

| Item | Current position | Notes |
| --- | --- | --- |
| Retention period | Configurable; formal default schedule pending owner definition | Do not commit a specific retention period without owner-approved schedule |
| Deletion on contract end | Intended; exact SLA is owner-review required | Do not promise a specific deletion SLA without owner approval |
| Backup retention | Azure Blob and SQL backup retention documented in trust center | [`TRUST_CENTER.md`](TRUST_CENTER.md) |
| Audit log retention | Append-only; retention period is owner-defined | Do not commit a minimum audit-log retention period without owner approval |

> **Guardrail:** Do not promise specific retention periods, deletion timelines, or data-portability SLAs in product copy, demos, or verbal commitments without owner-approved language.

---

## 4. Support and SLA terms

| Item | Current position | Source | Notes |
| --- | --- | --- | --- |
| Pilot support posture | White-glove, founder-led | [`SUPPORT_AND_PILOT_OPERATING_MODEL.md`](SUPPORT_AND_PILOT_OPERATING_MODEL.md) | Applies to V1 controlled pilots only |
| Support hours | Business hours (Eastern); reasonable effort response on critical issues | [`SUPPORT_AND_PILOT_OPERATING_MODEL.md`](SUPPORT_AND_PILOT_OPERATING_MODEL.md) | Not a 24×7 enterprise SLA |
| Response time targets | Pilot SLA: P1 same business day; P2 2 business days | [`SUPPORT_AND_PILOT_OPERATING_MODEL.md`](SUPPORT_AND_PILOT_OPERATING_MODEL.md) | Draft — owner review required before commitment |
| Uptime SLA | No formal SLA in V1; reasonable-effort availability for controlled pilots | [`SLA_SUMMARY.md`](SLA_SUMMARY.md) | Do not quote a percentage SLA without owner approval |
| Support model (GA) | Not available — post-V1 | — | Do not promise GA support tier in V1 materials |

---

## 5. Liability and indemnification posture

| Item | Current position | Notes |
| --- | --- | --- |
| Limitation of liability | Standard SaaS limitation of liability in MSA template | Owner/legal review before execution; do not commit specific caps verbally |
| Indemnification scope | Standard IP indemnification in MSA template | Owner/legal review required |
| Gross negligence / willful misconduct carve-out | Included in template | Standard; owner may negotiate |
| AI output liability | ArchLucid output is decision support; operator and user remain responsible for architecture decisions | Reinforce in all materials; do not imply automated architecture approval |
| Product warranty | No warranty beyond reasonable SaaS standard; ArchLucid makes no warranty that outputs are complete, accurate, or suitable for any specific purpose | State in pilot intake |

---

## 6. Approval and commitment authority

| Commitment type | Who can commit | Process |
| --- | --- | --- |
| Pilot SOW (≤ 90 days, ≤ $25K) | Founder / owner | Owner review; execute via order form or SOW |
| Annual subscription | Founder / owner | Owner review; execute via order form |
| Custom MSA redline | Founder + legal counsel (recommended) | Do not accept material redlines without counsel |
| Data-retention specific SLA | Owner only | Must be owner-approved before commitment |
| Uptime SLA commitment | Owner only | Must be owner-approved; no auto-commit from product copy |
| Any SOC 2 CPA or third-party pen-test timeline | Not available | Do not commit a timeline; refer to V1.1 roadmap only |

---

## 7. Terms that must not be committed without owner approval

> The following items must not be committed verbally, in product copy, in demo scripts, or in sales materials without explicit owner approval. Mark them as "owner review required" in any customer communication.

- [ ] Specific uptime SLA percentage (e.g., "99.9% uptime")
- [ ] Data deletion within a specific number of days after contract termination
- [ ] SOC 2 CPA attestation delivery date
- [ ] Third-party penetration test report delivery date
- [ ] ISO 27001 certification timeline
- [ ] Live Azure Marketplace or Stripe checkout availability date
- [ ] Named public reference customer quotes or case-study publication
- [ ] Guaranteed ROI dollar figure (vs. source-labeled estimate)
- [ ] Multi-region active/active SLA
- [ ] MCP or native connector GA dates (Jira, ServiceNow, etc.)

---

## 8. Purchase path summary

For current available purchase paths, see [`TRANSACTABLE_PROCUREMENT_PATH.md`](TRANSACTABLE_PROCUREMENT_PATH.md).

Short summary:
- **Available now:** Invoice / SOW / private offer (owner-executed order form)
- **Not yet available:** Stripe self-serve checkout, Azure Marketplace self-serve, automated subscription billing

---

## 9. Common procurement questions and safe answers

| Question | Safe answer |
| --- | --- |
| "Can we redline your MSA?" | "Yes. We have a draft MSA template we use as a starting point. Owner review is required before accepting any material changes." |
| "What is your data retention policy?" | "Retention is configurable. A formal default schedule is in owner review. We will confirm the applicable retention period before contract execution." |
| "Do you have cyber liability insurance?" | "Owner-decision required. Do not confirm or deny coverage without owner input." |
| "Can you sign our DPA?" | "We have a DPA template as a starting point and can review your form. Owner and, for complex terms, legal counsel review is required before execution." |
| "What is your SLA?" | "V1 is a controlled pilot with founder-led white-glove support and reasonable-effort availability. A formal SLA percentage is owner-approval-required before we commit one in writing." |
| "When will SOC 2 be done?" | "SOC 2 CPA attestation is in our V1.1 backlog. We cannot commit a timeline for V1." |

---

## 10. References

| Document | Purpose |
| --- | --- |
| [`MSA_TEMPLATE.md`](MSA_TEMPLATE.md) | Master Services Agreement template |
| [`DPA_TEMPLATE.md`](DPA_TEMPLATE.md) | Data Processing Addendum template |
| [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) | Order form template |
| [`SERVICE_LED_SOW_QUOTE_TEMPLATE.md`](SERVICE_LED_SOW_QUOTE_TEMPLATE.md) | SOW and quote template |
| [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md) | Commercial close-out checklist |
| [`TRANSACTABLE_PROCUREMENT_PATH.md`](TRANSACTABLE_PROCUREMENT_PATH.md) | Purchase path decision tree |
| [`SUPPORT_AND_PILOT_OPERATING_MODEL.md`](SUPPORT_AND_PILOT_OPERATING_MODEL.md) | Support and SLA posture |
| [`TRUST_CENTER.md`](TRUST_CENTER.md) | Trust and assurance index |
| [`SLA_SUMMARY.md`](SLA_SUMMARY.md) | SLA summary |
| [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md) | GTM overclaim guardrails |
