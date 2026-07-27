> **Reviewed:** 2026-07-26

> **Scope:** V1.1 GTM backlog item (TB-164). Owner checklist before named logo, public case study, or reference call; includes the first-contact email template (formerly `REFERENCE_CUSTOMER_FIRST_CONTACT_TEMPLATE.md`). Using a named reference without completing this checklist is not permitted.

> **Window:** V1.1 GTM backlog — do not treat as a V1 release requirement or headline-readiness factor.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Named reference customer capture (V1.1 owner template)

**Audience:** Founder and GTM lead managing the transition from controlled pilot to public-reference customer.

**Last reviewed:** 2026-07-26

**Related:** [`PILOT_RECRUITING_PIPELINE.md`](PILOT_RECRUITING_PIPELINE.md), [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise), [`QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist`](QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist), [`reference-customers/README.md`](reference-customers/README.md).

---

## 1. Context and guardrails

ArchLucid V1 has no approved named public references. This is not a product defect. Current materials can accurately state "no named public reference yet."

Before any named reference, logo, case study, or reference call is used externally:

1. This checklist must be completed and signed off by the owner.
2. The claim must be scoped to exactly what the reference record permits.
3. The claim must pass the copy guard in [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise).

---

## 2. Permission requirements by reference type

| Reference use | Permission required | Legal approval required | Revalidation cadence |
| --- | --- | --- | --- |
| Customer logo on website / marketing materials | Written permission (email or signed release); customer legal may require | Owner + customer legal review | Annual or on contract change |
| Public case study with company name | Signed reference agreement or case-study release | Owner + customer legal review | On content update |
| Anonymized case study (no name, no logo) | Verbal or written consent; anonymization reviewed by owner | Owner review | On content update |
| Reference call (customer speaks to prospect) | Written agreement naming scope and topics | Owner + customer review | Per call |
| Third-party review site quote (G2, TrustRadius, etc.) | Customer consent to the quote as written | Owner review | On quote update |
| ROI figure with attribution | Customer approval of specific numbers; source label applied | Owner review | On figure update |

---

## 3. Reference-readiness checklist

Complete one record per customer reference candidate.

### 3.1 Proof packet quality gate

- [ ] The pilot completed with PASS outcome per [`PILOT_ACCEPTANCE_THRESHOLDS.md`](PILOT_ACCEPTANCE_THRESHOLDS.md).
- [ ] At least one committed run with buyer-provided or buyer-accepted evidence exists.
- [ ] ROI figures are labeled by source (buyer-provided, defaulted, demo-derived).
- [ ] No HOLD rows in the final pilot scorecard remain unresolved.

### 3.2 Buyer approval gate

- [ ] Customer key contact name and title confirmed:
- [ ] Customer executive sponsor confirmed:
- [ ] Reference permission scope agreed (choose all that apply):
  - [ ] Internal use only (no public claim)
  - [ ] Anonymized case study (no name, no logo)
  - [ ] Named logo use on ArchLucid website
  - [ ] Named case study with ROI data
  - [ ] Named reference call availability
  - [ ] Third-party review quote
- [ ] What can be said (approved claim language):
- [ ] Where it can be used (channels, materials, URLs):
- [ ] What cannot be said (exclusions or caveats):

### 3.3 Legal approval gate

- [ ] Reference agreement or signed release obtained (attach reference or file location):
- [ ] Customer legal has reviewed and approved the specific claim language:
- [ ] Revocation process agreed (customer can withdraw reference by: _____________________):
- [ ] Owner has signed off on legal gate completion: _______ Date: _______

### 3.4 Claim boundary review

- [ ] Every external use of this reference has been reviewed against [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise).
- [ ] The claim does not imply SOC 2 CPA, third-party pen test, guaranteed ROI, or other unavailable assurance.
- [ ] If ROI figures are used, they include source labels and the claim scope matches what the customer approved.
- [ ] Claim has passed the commercial copy overclaim check.

---

## 4. Reference record template

Maintain one completed record per approved reference:

```
Customer reference record
=========================
Customer name (legal):
Trade name / brand:
Industry:
Reference contact (name, title, email):
Executive sponsor (name, title):
Pilot dates:
Offer SKU:
PASS outcome confirmed: Yes / No
Proof packet location:

Approved reference scope:
  Logo use: Yes / No / Conditions:
  Named case study: Yes / No / Conditions:
  Anonymized case study: Yes / No / Conditions:
  Reference calls: Yes / No / Topics permitted:
  ROI figures permitted: Yes / No / Approved language:

Approved claim language (verbatim):

Channels / materials where approved:

Exclusions and caveats:

Revocation contact and process:

Legal gate completed: Yes / No
Legal gate document location:

Owner sign-off:
  Name:
  Date:

Revalidation due date:

Notes:
```

---

## 5. First-contact email template

Copy-paste after a successful pilot for founder, sales, and customer success. Not a legal commitment or published case study.

**Pricing context:** Reference participation unlocks the standing **−15% reference discount** described in [PRICING_PHILOSOPHY.md §4.1](PRICING_PHILOSOPHY.md#41-reference-customer-discount-standardized-2026-04-21). Do not promise publication until written approval is on file.

### Subject line variants

**Short:** ArchLucid pilot wrap-up — reference request?

**Long:** Thank you for the ArchLucid pilot — optional reference participation (15% ongoing discount)

### Body template

Hello <<CUSTOMER_NAME>> team,

Thank you for completing the ArchLucid architecture review pilot on the **<<TIER>>** tier. <<PILOT_OUTCOME_SENTENCE>>

We would be grateful if you would consider becoming a published reference customer. Participation includes a **15% standing discount** on subscription pricing while the reference remains active (see our pricing philosophy for re-rate rules).

Please choose one commitment level:

1. **Logo only** — permission to display your logo on archlucid.net and sales decks.
2. **Logo + written quote** — a short attributed quote we can use in marketplace and datasheet copy.
3. **Full case study + reference call** — a one-page case study (we draft; you approve) plus up to one 30-minute reference call per quarter for qualified prospects.

**Next step:** Reply with your preferred option (1, 2, or 3) and the best contact for legal/brand review.

Thank you,  
<<SENDER_NAME>>  
ArchLucid

### Objection-handling postscript

**If your policy blocks customer references:** We can still document an **internal success summary** without public logo use. The −15% reference discount applies only after a **Published** row in [reference-customers/README.md](reference-customers/README.md) — not from this email alone.

**If legal needs more time:** We will keep your row in **Customer review** status until written approval arrives; nothing is published without your sign-off.

---

## 6. Routing for current V1 materials

Until at least one reference record has been completed and signed off:

- Current materials should say: "ArchLucid is currently conducting controlled pilots. Named public references are not yet approved."
- Do not use "a leading healthcare company" or similar implied-real language without an anonymized-case-study release.
- Route public-reference asks from prospects to this checklist, not to an informal commitment.

---

## 7. References

| Document | Purpose |
| --- | --- |
| [`PILOT_ACCEPTANCE_THRESHOLDS.md`](PILOT_ACCEPTANCE_THRESHOLDS.md) | PASS/HOLD criteria for pilot proof |
| [`PILOT_RECRUITING_PIPELINE.md`](PILOT_RECRUITING_PIPELINE.md) | Proof-permission capture during intake |
| [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) | GTM overclaim guardrails |
| [`QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist`](QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist) | Commercial close-out checklist |
| [`reference-customers/README.md`](reference-customers/README.md) | Status table + a–h tracking checklist |
| [`../library/V1_DEFERRED.md`](../library/V1_DEFERRED.md) | V1.1 GTM backlog context (TB-164) |
