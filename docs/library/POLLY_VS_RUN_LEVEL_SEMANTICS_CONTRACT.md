> **Scope:** Contributor-reference — Polly / circuit breaker vs run-level semantics (TB-995); per-call transport resilience versus multi-agent review completeness.

# Polly / circuit breaker vs run-level semantics (**TB-995**)

> **Audience:** Contributors, principal architects, and GTM claim reviewers who need one matrix for what per-call Polly/CB covers versus multi-agent run semantics.  
> **Not** a buyer assurance claim — transport resilience ≠ finished review, finalized package, or zero duplicate provider spend.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#polly-vs-run-completeness-m-147) (GTM **M-147**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (GTM **M-146** / **M-147**).  
**Per-call SoT:** [`LLM_RETRY_AND_CIRCUIT_BREAKER.md`](LLM_RETRY_AND_CIRCUIT_BREAKER.md) · ADR 0005.

---

## Decision in one line

Polly retries and the LLM circuit breaker protect **one transport call** (completion or embedding). They do **not** decide whether a multi-agent architecture run is complete, commit-ready, cache-safe, or within run/monthly budget.

---

## Boundary matrix

| Concern | Polly / CB covers? | Shipped today (engineering) | Owning / residual TB | Buyer-visible when incomplete |
|---------|--------------------|-----------------------------|----------------------|-------------------------------|
| Transient HTTP 429 / 5xx / timeout on a single LLM call | **Yes** — retry inside breaker; one `RecordFailure` after exhaustion | [`LLM_RETRY_AND_CIRCUIT_BREAKER.md`](LLM_RETRY_AND_CIRCUIT_BREAKER.md); `CircuitBreakingAgentCompletionClient` | Done ADR 0005 / resilience options | Call fails or succeeds after retries; run status unchanged until orchestration reacts |
| Partial agent completion (some agents done, required set incomplete) | **No** | Partial-run contract + UX; selective re-execute; commit requires ReadyForCommit | **TB-937** Done · **TB-938** Done · **TB-942** / **TB-943** open | Partial / failed-partial status; commit blocked when incomplete |
| Poisoned / premature completion cache | **No** (cache sits inside breaker; Polly does not admit) | Defer set until schema commit; poison bust + metric | **TB-940** Done · **TB-944** open (semantic non-transport classes) | Stale or wrong cached body until bust / non-cache path |
| Mid-run budget / quota exhaustion | **No** | Run-scoped admit-before-batch; per-call accounting cliff | **TB-939** Done · **TB-975**–**TB-977** open (INV-004 honesty) · **TB-941** open (per-step hard cap) | Execute fails closed on budget; not a “transport error” |
| Schema remediation retries | **Partial** — Polly only on first schema attempt; remediation uses no-Polly client | **TB-043** Done (documented in LLM_RETRY) | — | Higher billed-call ceiling only on first attempt |
| ACA / host interrupt vs Polly | **No** — different plane | Interrupted-review claim path | GTM **M-121**/**M-122**; not Polly | Resume / operator procedure — not breaker recovery |
| Durable Task Framework | **No** | Not claimed for V1 | **TB-924** (out of scope here) | Do not imply DTF |

---

## Explicit non-claims

- Polly success counters ≠ completed multi-agent run or finalized package.
- Circuit breaker recovery ≠ selective re-execute or zombie reconciliation (**TB-938** / **TB-943**).
- Transport retry ≠ exactly-once provider billing (see process vs provider idempotency / FinOps claim paths).
- Done **TB-937**/**TB-938**/**TB-939**/**TB-940** do **not** close **TB-941**–**TB-945** or **TB-975**–**TB-977**.

---

## Follow-on

| ID | Owns |
|----|------|
| **TB-996** | CI / doc bridge: fail overclaims that Polly/CB guarantee run completeness, cache safety, or admit-before-spend without citing this matrix |
| **TB-941**–**TB-945** | Remaining run-level implementation / chaos gaps |
| **TB-975**–**TB-977** | INV-004 reserve/settle honesty residuals |

---

## Related

- [`LLM_RETRY_AND_CIRCUIT_BREAKER.md`](LLM_RETRY_AND_CIRCUIT_BREAKER.md)
- GTM **M-146** / **M-147** · **M-121** / **M-122** (ACA interrupt) · **M-131** / **M-132** (monthly reserve/settle)
- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-937**–**TB-945**, **TB-995**, **TB-996**
