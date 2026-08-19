> **Reviewed:** 2026-07-29

> **Scope:** Path-stable alias for the transactional outbox replay vs idempotency handout (GTM **M-145** / **TB-992**). Does not claim exactly-once delivery. Not an assurance attestation.

# Transactional outbox: replay versus idempotency (alias)

**Last reviewed:** 2026-07-29

**Canonical handout:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#outbox-replay-vs-idempotency-m-145`](BUYER_SECURITY_PROCUREMENT_PACKET.md#outbox-replay-vs-idempotency-m-145).

**Engineering SoT:** [`../library/TRANSACTIONAL_OUTBOX_REPLAY_VS_IDEMPOTENCY_CONTRACT.md`](../library/TRANSACTIONAL_OUTBOX_REPLAY_VS_IDEMPOTENCY_CONTRACT.md) (**TB-992** Done).

Canonical guarantee separation, PA review checks, claim boundary, and residuals live only in the buyer security procurement packet. This file keeps the historical path stable for GTM **M-145** and [`PA_CLAIM_HONESTY_INDEX.md`](PA_CLAIM_HONESTY_INDEX.md).
