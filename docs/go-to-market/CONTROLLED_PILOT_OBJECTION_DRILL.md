> **Scope:** Facilitator drill for controlled-pilot procurement conversations — practice responses before live buyer calls. Not a substitute for legal review.

# Controlled pilot procurement objection drill

**Audience:** Founder / sales engineering preparing for a controlled pilot or paid proof-of-value conversation.  
**Duration:** 45–60 minutes (solo or with a colleague playing procurement).  
**Playbook source:** [`PROCUREMENT_OBJECTION_PLAYBOOK.md`](PROCUREMENT_OBJECTION_PLAYBOOK.md)

## Purpose

Rehearse the **top procurement objections** for V1 without over-claiming deferred assurance (SOC 2 CPA, third-party pen test). The drill checks that short answers, evidence links, and escalation triggers are ready before a buyer call.

## Setup

1. Open the playbook and this drill side by side.
2. Assign roles: **Responder** (you) and **Procurement reviewer** (colleague or scripted self-review).
3. Keep [`ASSURANCE_STATUS_CANONICAL.md`](ASSURANCE_STATUS_CANONICAL.md) and [`TRUST_CENTER.md`](TRUST_CENTER.md) open for evidence links only — do not invent new claims.

## Drill rounds (minimum four)

| Round | Objection (playbook #) | Pass criteria |
| --- | --- | --- |
| 1 | SOC 2 Type II (#1) | Short answer states self-assessment; no CPA claim; cites SOC2 status doc |
| 2 | Third-party pen test (#2) | Owner-conducted testing named; external report not claimed |
| 3 | Pack completeness (#8) | Manifest hashes / deterministic pack generation mentioned |
| 4 | Real-mode AI evidence | Simulator vs real-mode boundary stated; RC claim gate referenced |

Optional fifth round: data residency (#5) or DPA placeholders (#3).

## Scoring sheet

| Round | Short answer without over-claim | Evidence link named | Escalation trigger identified | Notes |
| --- | --- | --- | --- | --- |
| 1 | ☐ | ☐ | ☐ | |
| 2 | ☐ | ☐ | ☐ | |
| 3 | ☐ | ☐ | ☐ | |
| 4 | ☐ | ☐ | ☐ | |

**Pass:** All four rounds score yes on short answer + evidence link.  
**Hold:** Any round invents assurance not in canonical docs — rewrite before the buyer call.

## After the drill

- Update private deal notes with objections that still felt weak.
- Do **not** commit buyer-specific responses to the repository.
- If the buyer requires CPA SOC 2 or external pen-test publication, route to V1.1 backlog (**TB-135**, **TB-136**) — do not promise dates in the pilot.

## Related

- [`HOW_TO_REQUEST_PROCUREMENT_PACK.md`](HOW_TO_REQUEST_PROCUREMENT_PACK.md)
- [`PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md) — product-value validation (separate from procurement)
