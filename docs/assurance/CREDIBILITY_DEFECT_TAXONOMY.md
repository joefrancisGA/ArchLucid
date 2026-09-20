# Credibility defect taxonomy

A credibility defect is a product behavior that can make a technically sophisticated reviewer doubt the integrity of the analysis, even when no customer outage occurs.

## P0 credibility defects

- Unsupported finding presented as established fact.
- Citation points to a resource, rule, snapshot, or artifact that does not exist.
- Impossible or non-traversable security path presented as reachable.
- Tenant/workspace/project evidence crosses scope boundaries.
- Sealed output changes without a new version/identity.
- Evaluation failure is presented as NO FINDING or clean coverage.
- ObservedFact is minted from inference or AI output.
- API, UI, export, sponsor report, or signed package materially disagree about the same finding.
- Current-state wording is attached to stale evidence without visible age/snapshot identity.

## P1 credibility defects

- Severity contradicts the governing rule or evidence.
- Recommendation contradicts another recommendation for the same state without exposing the tradeoff.
- Finding claims certainty above its evidence/provenance class.
- Finding references an engine/rule version that cannot be reproduced.
- Duplicate findings differ in severity or rationale without an explicit disagreement record.
- "Complete" or "secure" wording is used when evaluation coverage is partial.

## P2 credibility defects

- Evidence is real but too weak for the displayed confidence.
- A harmless presentation inconsistency makes two surfaces appear to disagree.
- A recommendation is generic enough that the user cannot connect it to cited evidence.

## Handling

A confirmed credibility defect should produce at least one of:

1. structural prevention;
2. semantic/golden corpus truth;
3. property/metamorphic invariant;
4. targeted regression test.

Prefer 1–3. Cosmetic-only regression tests are the fallback, not the default.

## Measurement

Track credibility defects separately from ordinary defects. One credibility defect can outweigh many visual or workflow defects because it attacks trust in the correctness of the system.
