# FND-018 bounded resilience controls

This non-executing reference component provides deterministic retry decisions, circuit-breaker state transitions, and rolling failure-budget accounting.

- Retry: transient and idempotent operations only; maximum attempts, exponential capped delay and aggregate delay budget. No sleep or automatic retry is performed.
- Circuit breaker: closed/open/half-open; fail-fast during cooldown; one probe admitted in the reference state; success closes, failure reopens.
- Failure budget: bounded observation window, minimum sample count, and absolute failure threshold. Exhaustion means the caller should stop attempting optional/degradable work, never bypass authorization or mandatory auditing.
- Callers supply monotonic elapsed milliseconds. These reference states are **not thread-safe distributed coordinators**. Concurrent callers must use a durable atomic store or lock, unique attempt IDs and leases to enforce exactly one probe.
- No production dependency injection, timers, cloud calls, billable resources or autonomous remediation. Critical security failures still follow FND-018 fail-closed isolation, not retry-based bypass.

Before production integration: add persistent per-tenant/service partitioning, bounded concurrency, jitter, cancellation, deadline propagation, idempotency keys, audited circuit transitions, and fault injection under load. Verify the complete suite in CI before merging.
