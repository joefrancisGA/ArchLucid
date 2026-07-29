> **Reviewed:** 2026-07-28
>
> **Scope:** Principal-architect explanation of quality-gate versions and historical outcomes (GTM **M-130**). Not an assurance attestation.

# Quality-gate versioning (PA one-pager)

**Audience:** Principal architects, security reviewers, and governance owners.

**Verdict:** A quality decision is meaningful only with the gate definition used at execution. A later threshold change must not silently rewrite history; an “as-of-today” comparison is advisory, not the recorded decision.

## Statement / meaning

| Statement | Meaning |
| --- | --- |
| Recorded decision | The quality result produced at execution time under then-applicable rules. |
| Advisory current | A later comparison using current thresholds; it must be visibly distinct from history. |
| Versioned gate | Definition version/hash and floors are needed to reconstruct the recorded decision. |
| Wrong definition | Correct through deprecation, re-execution, or append-only supersession, never a silent update. |

## Too-strong vs safe

| Too strong | Safe |
| --- | --- |
| “Passed once means permanently correct.” | A pass is as-of its gate definition, not proof of eternal AI correctness. |
| “We re-grade all history after an upgrade.” | Historical decisions should remain immutable; later evaluation is advisory unless formally superseded. |
| “Current API evaluation is the recorded decision.” | Existing summaries can recompute with current host floors and are not a durable historical record. |

## Reviewer check

1. Ask for the gate version/hash and floors associated with a reviewed outcome.
2. Distinguish the recorded outcome from a current-threshold advisory comparison.
3. Request the remediation record if a gate definition was found incorrect.

## Posture

| Concern | Posture |
| --- | --- |
| Security | Preserves accountable, reviewable governance decisions. |
| Scalability | Versioned definitions avoid mass destructive rewrites of historical runs. |
| Reliability | Explicit supersession makes remediation traceable rather than silent. |
| Cost | Re-execution may incur model cost; no automatic re-grade promise is made. |

## Honest residuals

- **TB-972**–**TB-974** remain open for versioning, durable version/hash persistence, and wrong-gate remediation.
- **TB-964** separately owns durable quality-outcome completeness.
- Do not claim perfect gate calibration or historical immutability implementation before these items ship.

**Related:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#model-failed-vs-quality-rejected-m-124`](BUYER_SECURITY_PROCUREMENT_PACKET.md#model-failed-vs-quality-rejected-m-124) (`MODEL_FAILED_VS_QUALITY_REJECTED_ONE_PAGER.md` alias) · [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) · [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise).
> **Reviewed:** 2026-07-28

> **Scope:** PA handout for quality-gate versioning and historical immutability (GTM **M-130** / **TB-972**).

# Quality-gate versioning + wrong-definition remediation

**Audience:** Principal architects and operators interpreting quality pass/fail over time.

**Claim:** A quality pass is **as-of the gate definition version**, not eternal AI correctness. Threshold upgrades must **not** silently re-grade history. Advisory “as if today” ≠ recorded decision.

---

## Recorded vs advisory

| Mode | Meaning |
| --- | --- |
| Recorded | Outcome persisted with gate version/hash at evaluation time (**TB-973**) |
| Advisory current | Re-evaluate with today’s definition for triage — not an authoritative rewrite |

---

## Wrong-definition remediation

| Allowed | Forbidden |
| --- | --- |
| Deprecate version; selective re-execute; append-only supersede (**TB-974**) | Silent UPDATE of historical outcomes |

---

## Too strong vs safe

| Too strong | Safe |
| --- | --- |
| “Pass means forever correct” | Pass means met floors at version V |
| “We re-scored old runs in place” | New evaluation / supersede event only |

**Residuals:** **TB-972**–**TB-974**. Complements **M-124**.

**Related:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#model-failed-vs-quality-rejected-m-124`](BUYER_SECURITY_PROCUREMENT_PACKET.md#model-failed-vs-quality-rejected-m-124) (`MODEL_FAILED_VS_QUALITY_REJECTED_ONE_PAGER.md` alias).
