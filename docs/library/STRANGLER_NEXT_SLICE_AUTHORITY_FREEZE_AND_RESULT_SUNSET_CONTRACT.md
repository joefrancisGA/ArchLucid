> **Scope:** Engineering source of truth — Authority product-default freeze and `POST …/result` sunset plan (**TB-1034**). Complements forbid matrix **TB-1007**; honesty CI **TB-1035**.

# Strangler next slice — Authority freeze + `/result` sunset (TB-1034)

> **Audience:** Contributors, integrators, and GTM reviewers placing run-lifecycle claims.  
> **Buyer summary:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#strangler-next-slice-result-sunset-m-185) (**M-184** / **M-185**).  
> **Forbid matrix:** [`AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md`](./AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md) (**TB-1007**).  
> **Sunset ADR:** [ADR 0066](../architecture/adrs/0066-agent-result-append-sunset.md).  
> **Honesty CI:** **TB-1035** (shipped — `scripts/ci/check_strangler_next_slice_honesty.py`; Vitest `archlucid-ui/src/lib/strangler-next-slice-honesty.test.ts`).

---

## Decision in one line

**Freeze** Authority A0 as the only product-default lifecycle after create; rename “legacy coordinator” vocabulary to **AgentTask / AgentResult extension loop**; **sunset** `POST …/result` per ADR 0066 — without reopening dual storage retirement (**TB-919** / ADR 0030).

---

## Product-default freeze checklist (no public break)

| Gate | Requirement |
| --- | --- |
| **New surfaces** | Default to Authority A0: `POST /v1/architecture/request` → poll/package — not create→execute→commit |
| **Integrator docs** | Teach extension loop only when caller owns AgentTask semantics |
| **UI / CTAs** | No new product flows that require `/result` as finish |
| **Vocabulary** | Replace “legacy coordinator” with **AgentTask / AgentResult extension loop** in Flow A docs |
| **Storage claims** | Never imply dual coordinator repositories still ship |
| **Finish path** | `/result` does **not** finalize or commit Authority packages (ADR 0042 §3) |

**Doc touchpoints:** [`ARCHITECTURE_FLOWS.md`](./ARCHITECTURE_FLOWS.md) (A0 / A0b), [`API_CONTRACTS.md`](./API_CONTRACTS.md), [`COORDINATOR_STRANGLER_INVENTORY.md`](../architecture/COORDINATOR_STRANGLER_INVENTORY.md).

---

## Keep vs sunset

| Surface | Status | Notes |
| --- | --- | --- |
| Authority pipeline (A0) | **Product-default** | Canonical for new surfaces |
| `POST …/execute` | **Keep** | Extension loop; selective re-execute (**TB-938**) |
| Task-owned `commit` / `finalize` | **Keep** | When intentionally owning AgentTasks |
| `POST …/result` | **Sunset** | ADR 0066 — deprecate → delete after window |
| Dual coordinator storage | **Removed** | Do not reopen (**TB-919**) |

---

## `/result` sunset summary (ADR 0066)

1. **Phase 0 (now):** Document append-only invariant; freeze new `/result`-dependent product surfaces.
2. **Phase 1:** RFC 8594 deprecation headers on `POST /v1/architecture/review/{runId}/result` (OpenAPI + middleware).
3. **Phase 2:** Delete route after zero first-party consumers and owner sign-off (implementation TB after ADR).

---

## Forbidden claims

| Too strong | Safe |
| --- | --- |
| Create→execute→commit is the default peer lifecycle | Authority A0 product-default; extension loop optional |
| Dual coordinator **storage** still ships | Storage strangler Done — ADR 0030 / **TB-919** |
| `/result` finalizes or commits Authority packages | Append-only in progress states only |
| “Legacy coordinator” as live second pipeline | AgentTask extension loop — not second SoR |

---

## Explicit non-claims

- Does not delete `execute` or task `commit` in this TB.
- Does not reopen coordinator repositories or alias routes.
- Full honesty CI is **TB-1035**, not this contract.

**Related:** **TB-1007** · **TB-1035** · **TB-1204** · ADR 0030 · ADR 0042 · ADR 0066 · GTM **M-184** / **M-185**.
