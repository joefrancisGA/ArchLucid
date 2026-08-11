> **Scope:** Engineering source of truth — ACA Worker long-running LLM failure semantics (**TB-960**). Host-bound contract for replica death, lease resume, spend rules, and buyer-visible states.

# ACA Worker long-running LLM failure semantics (TB-960)

> **Audience:** Contributors, principal architects, SRE, and coding agents implementing or reviewing Worker execute/resume on Azure Container Apps.  
> **Buyer / PA handout:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#interrupted-review-m-122) (GTM **M-121** / **M-122**).  
> **Per-call transport plane:** [`LLM_RETRY_AND_CIRCUIT_BREAKER.md`](../library/LLM_RETRY_AND_CIRCUIT_BREAKER.md) · [`POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md`](../library/POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md).  
> **Crash-recovery map:** [`CRASH_RECOVERY_LONG_RUNNING_REVIEW_CLAIM_MAP.md`](../library/CRASH_RECOVERY_LONG_RUNNING_REVIEW_CLAIM_MAP.md).

---

## Decision in one line

**SQL owns the run and task ledger.** ACA replica death is an expected host event. Polly protects **one transport call only**. Resume must **not re-bill persisted `(RunId, TaskId)`** results (Done **TB-039** / **TB-201**). Buyers never see Ready/finalize on incomplete required agents (**TB-937**).

---

## Layer model

| Layer | Owns | On replica death |
| --- | --- | --- |
| **Outbox / lease** | Work admission, lease heartbeat, ownership | Lease expires; another replica may reclaim (**TB-943** / **TB-961**) |
| **Execute ownership** | Which replica may call providers for a run batch | In-flight call may complete or be lost at provider; process state reconciles from SQL |
| **Per-task persist** | `(RunId, TaskId)` → `AgentResult` | Completed rows are idempotent-skip inputs on resume |
| **Polly / circuit breaker** | Single LLM HTTP call retries | **Does not** complete the run, drain gracefully, or reconcile zombies |

---

## Run / buyer state machine (honest)

| State | Meaning | Buyer may see |
| --- | --- | --- |
| **Running** | Execute in progress; lease may be held | In progress — not a completed package |
| **Recovering** | Lease reclaimed or resume/reconcile in flight | In progress or needs attention |
| **Partial** | Some required agents persisted; required set incomplete (**TB-937**) | Partial / needs attention; commit blocked |
| **Ready** | Required agents complete; `ReadyForCommit` satisfied | Actionable for commit/finalize paths |
| **Needs attention** | Stuck, zombie, or operator intervention required (**TB-943**) | Explicit attention — not silent success |

**Forbidden:** Promote to Ready/finalize when required agents are missing or when execute died mid-batch without reconcile.

---

## Spend rules

| Event | Process billing (ArchLucid ledger) | Provider spend |
| --- | --- | --- |
| Task persisted successfully before death | **At-most-once** re-execute — skip on resume (**TB-039**) | Provider call already occurred; not refunded |
| Mid-request provider call at SIGTERM/kill | May or may not complete at provider | **At-least-once** at provider — duplicate mid-flight spend possible; see **M-171** |
| Selective re-execute (**TB-938** Done) | Bill only targeted + invalidated dependents | Provider billed per retried call |
| Full re-execute with skip | Skip persisted `(RunId, TaskId)` | No re-bill for skipped tasks |

**Non-claims:** No provider refund guarantee; no exactly-once LLM; Polly success ≠ run complete.

---

## ACA host events (expected)

| Event | Engineering expectation | Implementation follow-on |
| --- | --- | --- |
| Replica SIGTERM / scale-in | Stop admitting new work; finish or abandon in-flight call; release lease before kill | **TB-961** (graceful drain) |
| Unexpected process crash | Lease TTL → reclaim; reconcile stuck execute | **TB-943** (zombie reconciliation) |
| Rolling deploy | Same as scale-in — no silent Ready | **TB-1563** claim map |

---

## Buyer UX table (safe copy)

| Situation | Safe operator/buyer message |
| --- | --- |
| Replica replaced mid-run | Review may show in progress; work can resume when lease reclaims |
| Some agents done, one failed | Partial — retry failed agents (**TB-938**) or investigate |
| Persisted task exists | Resume skips redoing that agent's completed work |
| Mid-flight LLM at hard kill | Outcome uncertain until reconcile; may need attention |
| Commit blocked | Required agents incomplete — not a transport glitch |

---

## Explicit non-claims

- Polly / circuit breaker recovery ≠ run-level resume or zombie cleanup.
- Graceful ACA drain ≠ shipped until **TB-961** closes.
- Staging replica-kill proof ≠ V1 buyer attestation (**G-REAL-06** / **G-REAL-07**).
- DTF saga semantics (**TB-924**) — out of scope.

---

## PA defense (one page)

1. **Ask:** Is the concern transport retry, run completeness, host kill, or provider billing?
2. **Transport:** Cite [`LLM_RETRY_AND_CIRCUIT_BREAKER.md`](../library/LLM_RETRY_AND_CIRCUIT_BREAKER.md) — single call only.
3. **Completeness:** Cite **TB-937** Done — partial/failed-partial blocks commit.
4. **Kill/resume:** Cite this contract + **M-122** — SQL ledger + idempotent skip; provider at-least-once.
5. **Proof:** Staging kill-drill is **TB-962** — do not accept narrative without evidence.

---

## Related backlog / GTM

| ID | Role |
| --- | --- |
| **TB-039** / **TB-201** | Done — idempotent skip / unique `(RunId, TaskId)` |
| **TB-937** / **TB-938** | Done — partial contract + selective re-execute |
| **TB-943** | Open — zombie / interrupted execute reconciliation |
| **TB-961** / **TB-962** | Open — graceful drain + staging kill drill |
| **TB-960** | This contract |
| **M-121** / **M-122** | GTM interrupted-review handout |
