# FND-018 Failure Containment and Graceful Degradation

## Classification

| Dependency | Classification | Failure policy |
| --- | --- | --- |
| Authorization | Security critical | Isolate; deny protected operations |
| Mandatory audit | Security critical | Isolate; do not bypass auditing |
| Evidence integrity | Integrity critical | Isolate; do not display unverified evidence |
| AI reasoning | Degradable | Preserve only authorized, verified evidence viewing |
| Remediation planner | Degradable | Disable planning; preserve authorized, verified evidence viewing |

The reference policy requires a complete dependency health inventory. Unknown critical health is treated as failure. An active emergency stop blocks planning. Even when all dependencies are healthy, the reference **never enables remediation execution**.

The pure recovery state machine transitions from isolated/degraded to recovering and then healthy only after independently verified recovery and at least two healthy observations. Any new critical failure resets recovery. This is hysteresis in a deterministic reference model, not a running health probe or production recovery coordinator.

## Trusted fact ingestion and recovery evidence

All Boolean health and stop inputs are **proof claims supplied by an adapter**, not
trustworthy merely because they are present in a request. This reference model
accepts only the literal Boolean `True` for verified authorization, writable audit,
verified evidence and independent recovery; truthy numbers and strings do not
count as verification. The emergency-stop input defaults to **unknown** and may
be cleared only by the literal Boolean `False` from a trusted stop-state reader.
An active or unverified stop permits *at most* already-authorized, verified
evidence viewing; no new AI analysis or remediation planning. Missing evidence
proof isolates all capabilities. Execution remains ineligible in every mode.

The FND-016 reference SQL stop reader in
`scripts/integration/fnd016_trusted_stop_reader.py` implements fail-closed
stop-record decoding, but there is **no demonstrated production adapter** that
feeds that result into this FND-018 state machine. An HTTP health endpoint
or circuit-breaker status is diagnostic and cannot substitute for independent
authorization, audit, evidence and stop proofs. Recovery hysteresis counts
caller-supplied independently verified observations; this pure function does
not collect or authenticate them. A production integration would need explicit
identity, freshness, tenant binding, persistence and fail-closed enforcement
review before wiring.

## Integration boundaries

No cloud resources, network calls, timers, production DI registration, authorization bypass, retry loops, or automated remediation are introduced. An eventual production adapter must obtain trustworthy health facts, preserve tenant isolation, use bounded retries/circuit breakers, record state transitions durably, and verify audit/authorization freshness before permitting even read-only evidence access. Real fault injection and load testing are required before deployment.
