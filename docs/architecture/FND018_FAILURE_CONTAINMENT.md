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

## Integration boundaries

No cloud resources, network calls, timers, production DI registration, authorization bypass, retry loops, or automated remediation are introduced. An eventual production adapter must obtain trustworthy health facts, preserve tenant isolation, use bounded retries/circuit breakers, record state transitions durably, and verify audit/authorization freshness before permitting even read-only evidence access. Real fault injection and load testing are required before deployment.
