> **Scope:** Contributor-reference — first async-orchestration forcing workload + commit-safe run state machine freeze (**TB-1311**); not a DTF adoption decision.

# Async orchestration first-force + run state machine freeze (commit-safe split) (TB-1311)

> **Audience:** Contributors, integrators, and GTM reviewers answering *what forces async orchestration next* and *how commit semantics stay stable*.  
> **Not** a claim that V1 requires DTF/Service Bus for agents.

**GTM:** **M-231** / **M-232** · **M-162** · **M-145**.  
**Authority path:** [`AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md`](AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md) (**TB-1007**).  
**Finalize vs outbox:** [`TRANSACTIONAL_FINALIZE_VS_OUTBOX_CONTRACT.md`](TRANSACTIONAL_FINALIZE_VS_OUTBOX_CONTRACT.md) (**TB-1011**).  
**DTF gate:** **TB-921** · **TB-924** (gated). **Honesty CI:** **TB-1312** (open).

---

## Decision in one line

**Authority pipeline is already async-by-default on SQL** (ADR 0038 / `AsyncAuthorityPipeline`); **agent execute remains the sync hot path** on the API. The **first product force for async agents** is multi-agent Real execute exceeding request lifetime → SQL outbox + Worker resume (**TB-943**), **not** Service Bus or DTF as step one. **Commit/finalize stays a separate CAS verb** — never folded into orchestration activities.

---

## Correction (shipped reality)

| Path | Today | Buyer-safe pin |
| --- | --- | --- |
| Authority create → finalize pipeline | Queued on SQL when `AsyncAuthorityPipeline` enabled | Not fully in-process on API thread |
| Agent execute (`POST …/execute`) | Sync on API / ACA request thread | Remaining sync hot path |
| Integration Service Bus | Outbox fan-out (ADR 0004/0019) | **≠** agent orchestration substrate |
| DTF (`DtfAuthorityRunOrchestrator`) | Seam exists; gated by **TB-921** | **Not** V1 GA requirement |

---

## First-force ranking

| Rank | Force | Mechanism | Not first |
| --- | --- | --- | --- |
| **1** | Multi-agent Real execute > API/ACA lifetime | SQL authority outbox pattern + Worker resume; lease/zombie **TB-943** | Service Bus agent orchestration |
| **2** | DTF / durable timers | **TB-921** checklist (≥2 criteria); candidate = governance SLA auto-act (**TB-923**) | “Agents are slow” alone |
| **3** | Service Bus as agent substrate | Integration events only today | Equating SB presence with agent orchestration |

---

## Run state machine freeze (commit-safe)

```
Create → Authority pipeline (queued OK) → Agent execute
  (TasksGenerated / WaitingForResults → ReadyForCommit | PartiallyCompleted | Failed*)
  → Commit/Finalize (separate verb, CAS) → post-commit outboxes
```

| Rule | Pin |
| --- | --- |
| Execute may move hosts (API → Worker) | ADR 0038 outbox + resume |
| **Commit must not** move into agent orchestration activities | `sp_FinalizeManifest` / finalize UoW authoritative |
| ReadyForCommit precondition before finalize | CAS / first-wins (**TB-1270**) |
| Persist `(RunId, TaskId)` before LLM | Resume idempotency |
| Never rewrite sealed package from async worker except via **commit** verb | **TB-1011** / sealed registry |

---

## Allow / forbid (GTM-safe)

| Claim | Status |
| --- | --- |
| Authority queued on SQL; agent execute sync today | **Allow** |
| First async agent force = wall-clock execute + outbox resume | **Allow** |
| Commit stays separate CAS verb | **Allow** |
| “Everything runs in-process” without ADR 0038 caveat | **Forbid** |
| V1 requires DTF/Service Bus for agents | **Forbid** — **TB-921** / `V1_DEFERRED.md` §6f |
| Async execute ⇒ finalize becomes orchestration activity | **Forbid** |
| Integration SB = agent orchestration substrate | **Forbid** |

---

## TB-1312 CI anchors (named, not implemented here)

| Anchor | Purpose |
| --- | --- |
| `ASYNC_ORCHESTRATION_FIRST_FORCE_AND_RUN_STATE_MACHINE_CONTRACT.md` | Drift guard (this file) |
| Buyer/proof stub guards | Fail in-process / DTF-required / commit-inside-orchestrator claims |
| Verification | `AuthorityRunOrchestrator`, `ArchitectureRunExecuteOrchestrator`, `DtfAuthorityRunOrchestrator`, ADR 0038, **TB-921**, `sp_FinalizeManifest` |

---

## Explicit non-claims

- Does not implement async agent outbox or start gated **TB-924**.
- Does not change finalize SQL or `sp_FinalizeManifest`.
- Does not close honesty CI (**TB-1312**).

---

## Related

- [`LONG_RUNNING_OPERATIONS_CONTRACT.md`](LONG_RUNNING_OPERATIONS_CONTRACT.md) (**TB-2072**)
- [`CONCURRENT_EXECUTE_AND_COMMIT_RACE_CONTRACT.md`](CONCURRENT_EXECUTE_AND_COMMIT_RACE_CONTRACT.md) (**TB-1270**)
- ADR [0038](../architecture/adrs/0038-async-authority-pipeline-sql-queue.md) (authority SQL queue)
