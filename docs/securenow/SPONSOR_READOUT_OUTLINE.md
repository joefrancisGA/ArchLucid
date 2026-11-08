# SecureNow sponsor readout outline

> **INTERNAL DRAFT / READOUT PREPARATION.** This outline is not an approved customer offer. SecureNow beta remains **NO_GO** until the owner release checklist is cleared. Use actual, authorized evidence only; a fixture is not a customer result.

## Purpose

Give an enterprise sponsor a short, decision-oriented explanation of what the pilot showed, what it did not show, and which decision remains with the customer. The readout should make the evidence packet understandable without translating raw findings into business claims.

## Suggested 30–45 minute sequence

| Beat | Sponsor question | Show or record | Evidence handoff |
| --- | --- | --- | --- |
| 1. Scope and decision | What environment and decision are we discussing? | Authorized tenant, subscriptions, capture IDs, timestamps, completeness and decision owner | Executive packet: scope, baseline and owner rows |
| 2. Finding that matters | Which possible access path deserves attention? | One cited path, weakest provenance, uncertainty and why it outranks alternatives | Executive packet: concern, cited path IDs and limitations |
| 3. Intervention point | Where could an engineer intervene? | Advisory cut point, affected ranked paths and tradeoffs | Executive packet: recommended cut point; no automatic change claim |
| 4. Change ownership | What changed in Azure? | Customer change record and human attestation, if any | Executive packet: external change row; SecureNow does not change Azure |
| 5. Verification | What does later evidence support? | Verification capture, chronology, completed analysis and substantive postcondition | Executive packet: verified, not verified or insufficient evidence |
| 6. Effort and value | Did the investigation become easier? | Comparable tasks, analyst minutes, sample size and limitations | Pilot measurement log; capacity and cash remain separate |
| 7. Decision | What should happen next? | Sponsor objections, follow-ups, owner decision and review date | Executive packet: decision owner, remaining risks and disposition |

## Close with three explicit statements

1. A possible path is not proof that an attacker used it.
2. A customer engineer owns any Azure change; SecureNow does not apply changes.
3. A result is **NOT VERIFIED** or insufficient evidence when chronology, collection, analysis or postcondition evidence is missing.

## Facilitator guardrails

- Label every simulated result **FIXTURE** and replace it before any sponsor claim.
- Do not convert removed-path counts into dollars or claim avoided breaches.
- Do not present unmeasured savings, compliance certification, a CPA-issued SOC 2 report or a third-party penetration test.
- Keep fee amounts in [`PRIVATE_PRICE_SHEET.md`](PRIVATE_PRICE_SHEET.md); do not add pricing to this readout.
- Before sharing, complete the release claim gate in [`EXECUTIVE_PROOF_PACKET_TEMPLATE.md`](EXECUTIVE_PROOF_PACKET_TEMPLATE.md) and obtain human review.

## Sources

- [`CONTROLLED_PILOT_OFFER.md`](CONTROLLED_PILOT_OFFER.md), stage 6 and measurable acceptance criteria
- [`EXECUTIVE_PROOF_PACKET_TEMPLATE.md`](EXECUTIVE_PROOF_PACKET_TEMPLATE.md)
- [`PILOT_MEASUREMENT_LOG.md`](PILOT_MEASUREMENT_LOG.md)
