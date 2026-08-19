# 0054. Warm Standby Pool Sizing is Sufficient

Date: 2026-06-15

## Status

Accepted

## Context

SAQ-009 asked whether the warm standby catalog pool sizing (TB-018) is sufficient for an expected signup burst, or if signup p95 latency becomes the first economics failure mode before catalog-count tripwires.

## Decision

The owner has explicitly decided that the current warm standby pool sizing is sufficient. We will not implement dynamic scaling or increase the pool size for V1.

## Consequences

- **Positive:** Avoids premature optimization and reduces engineering complexity before V1.
- **Negative:** Accepts the risk that if a signup burst exceeds the warm pool size, the p95 signup latency will increase as new catalogs are provisioned synchronously.
- **Action:** SAQ-009 and TB-018 are closed. No further engineering work is required on this item.