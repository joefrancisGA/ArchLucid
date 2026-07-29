> **Reviewed:** 2026-07-28
>
> **Scope:** Principal-architect explanation of LLM budget reserve/settle behavior across replicas (GTM **M-132**). Not an assurance attestation.

# LLM budget reserve / settle (PA one-pager)

**Audience:** Principal architects, FinOps reviewers, and security reviewers.

**Claim:** Durable SQL state and optimistic concurrency prevent concurrent replicas from bypassing the configured hard cap. They do not yet guarantee crash-proof settlement, zero orphan reservations, or immunity from assumed-max reservation pressure.

## Statement / meaning

| Statement | Meaning |
| --- | --- |
| Reserve | Reserve assumed spend before a provider call against the tenant/month budget state. |
| Settle | Replace or account for the reservation after the call outcome where the process completes. |
| Hard cap | Concurrent writers use row-version concurrency to block overspend beyond the configured cap. |
| Soft scarcity | A crash or racing requests can retain assumed reservations and deny later work without exceeding the cap. |

## Too-strong vs safe

| Too strong | Safe |
| --- | --- |
| “Provider calls are billed exactly once.” | Budget logic controls product admission; it does not control provider billing semantics. |
| “A crash always releases reserved USD.” | A crash can orphan reservation state until lifecycle reconciliation is implemented. |
| “Tenants cannot pressure the budget path.” | They cannot bypass the hard cap, but assumed-max races can create soft denial pressure. |

## Reviewer check

1. Inspect `SpentUsd`, `ReservedAssumedUsd`, and row-version concurrency in the tenant/month state.
2. Ask what occurs if the replica dies between reserve and settle.
3. Ask how month-boundary time and stale reservations are reconciled.

## Posture

| Concern | Posture |
| --- | --- |
| Security | Concurrency control prevents simple multi-replica cap bypass. |
| Scalability | A single durable state supports competing replicas without in-memory coordination alone. |
| Reliability | Crash, clock-boundary, and reconciliation semantics remain open. |
| Cost | Admission cap is enforced; true provider spend and stale reservations can differ temporarily. |

## Honest residuals

- **INV-004** and **TB-011** are Done for durable optimistic-concurrency cap enforcement.
- **TB-894** is Done for Quick Scan reservation-id reserve/commit/release patterns.
- **TB-975**–**TB-977** remain open for lifecycle, crash reconciliation, and race/clock hardening.

**Related:** [`LLM_RETRY_AND_CIRCUIT_BREAKER.md`](../library/LLM_RETRY_AND_CIRCUIT_BREAKER.md) · [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) · [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise).
> **Reviewed:** 2026-07-28

> **Scope:** PA handout for INV-004 LLM budget reserve/settle (GTM **M-132** / **TB-975**).

# LLM budget — concurrency and crash semantics

**Audience:** FinOps-minded PAs and operators.

**Claim:** Durable SQL + optimistic concurrency prevent multi-replica **hard-cap bypass**. Does **not** promise crash-proof settle, zero orphan reserved USD, or immunity to assumed-max race soft-DoS.

---

## Guaranteed today vs residual

| Guaranteed (intent) | Residual (open eng) |
| --- | --- |
| Cap-correct admission under concurrency | Orphan reserved USD after crash — **TB-976** |
| Optimistic concurrency on settle path | Assumed-max race soft-DoS — **TB-977** |
| Quick Scan pattern exists (**TB-894** Done) | Mature cost plane beyond gates — **M-225** / **TB-1287** |

---

## Too strong vs safe

| Too strong | Safe |
| --- | --- |
| “Exactly-once provider billing” | Process skip after persist (**M-170**) |
| “Crash-proof settle” | Reclaim/reconcile path required |
| “Metering = Azure invoice” | Estimates only (**M-294**/**M-295**) |

**Related:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#interrupted-review-m-122`](BUYER_SECURITY_PROCUREMENT_PACKET.md#interrupted-review-m-122) (`INTERRUPTED_REVIEW_BUYER_ONE_PAGER.md` alias) · [`PA_CLAIM_HONESTY_INDEX.md`](PA_CLAIM_HONESTY_INDEX.md).
