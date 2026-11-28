> **Scope:** Engineering assurance for sealed reconstruction, recorded-input reproduction, and independent historical claim checks in the opt-in replay stack.

# FND-097 independent historical assurance

The three operations deliberately do not imply one another. Reconstruction checks the sealed descriptor and authorized retained artifacts. Recorded-input reproduction reuses the FND-095 worker and its stage and final comparison. Independent revalidation evaluates the original sealed claim against designated pinned observations without consuming the replay result or consulting the original graph, decision engine, or model. This slice does not perform current reassessment. A current configuration or policy is not a substitute for any historical pin.

| Product | Independently testable claim | Evidence and refusal boundary |
| --- | --- | --- |
| ArchLucid | A selected, structured `control-state-v1|resource|control|enabled-or-disabled` claim in the sealed final projection. | A separately retained, stage-bound `authority-control-observations-v1` source with complete coverage, exact subject, a pinned evidence reference, and an observation validity interval covering the original run time. Missing, expired, invalid, or conflicting observations are indeterminate. Arbitrary prose is not interpreted as a structured claim. |
| SecureNow | A sealed direct observed public-network-setting hop for the pinned inventory target. | Exact scoped inventory rows, observed public-network setting, successful complete capture, and the recorded target and freshness policy. Known setting keys are interpreted directly, without invoking graph construction. An absent or inferred hop does not establish the opposite. The result is about the observed setting, not end-to-end reachability. |

An authorized request selects the claim index and, optionally, supplies separately authorized replay execution. The service reuses FND-094 descriptor verification and FND-096 custody, restoration, and erasure checks. It checks actor/scope and custody receipts before releasing the separate append-only assurance record. It returns reconstruction readiness, reproduction status, and an independent supported, refuted, or indeterminate verdict. Drift identifies the first changed stage in deterministic dependency order, stages downstream of any changed stage, and whether the final projection changed. The audit records historical versions and scoped proof identifiers and does not copy original claim text or raw evidence. No production endpoint, capture process, customer write, or change to sealed history is introduced.

## Regression corpus and negative control

| Product | Independently observed evidence | Sealed reconstruction | Provider-disabled reproduction | Independent result |
| --- | --- | --- | --- | --- |
| ArchLucid | Retained control row agrees | Ready | Matches | Supported |
| ArchLucid | Retained control row explicitly contradicts | Ready | Matches | Refuted |
| ArchLucid | Independent observation not retained | Ready | Matches | Indeterminate |
| SecureNow | Canonical observed setting enabled | Ready | Matches | Supported |
| SecureNow | Recorded projection treated a historical metadata value as current, while the canonical captured setting was disabled | Ready | Matches | Refuted |
| SecureNow | Recorded projection found a hop, but there is no canonical observed setting | Ready | Matches | Indeterminate |

Expected answers are authored independently from the worker. The focused PR check requires all six positive-control/negative-control evidence files from the tested image, in addition to the existing tests and encrypted restore receipts. A gate that treats a replay match as truth cannot pass these fixtures. The suite also covers model retirement and changed runtime pins, partial reconstruction, restoration, stale and conflicting observations, tampered data, scope rejection, authorization changes, cancellation, audit failure and sealed-artifact immutability. Production observation availability, archived image approval, and findings outside these two narrow schemas are not established by fixture evidence.
