> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Crash recovery — long-running review / AgentTasks in flight

**Audience:** Engineering, SRE, principal-architect diligence. Not a buyer brochure.

**Status:** **Done** (2026-08-10) — **TB-1523** / GTM **M-277**/**M-278**. Pair honesty CI **TB-1524** (open).

**Verdict (one line):** Authority-pipeline mid-run death is **Worker-reclaimable** (SQL outbox lease → resume or dead-letter → terminal Failed); **multi-agent Real execute is still sync on the API request thread** — process death mid-`ExecuteRunAsync` leaves **`TasksGenerated` / `WaitingForResults` with 0..N persisted AgentResults**, with **no execute ownership lease / auto-reconciler** (**TB-943** open) — the tenant typically sees a **stuck “In progress” / incomplete review**, not an automatic honest failure, until re-execute or statuses are derived after a completed (non-killed) execute path.

---

## 1. Two machines (do not conflate)

| Path | Host | Durability today | Mid-death outcome |
|------|------|------------------|-------------------|
| **A0 Authority pipeline** | Worker drains `AuthorityPipelineWorkOutbox` | Lease + `LockedUntilUtc` reclaim; stage checkpoints | Peer Worker resume or dead-letter + run marker → **honest terminal fail** path exists |
| **A0b Agent execute** | `POST …/execute` on **API** via `ArchitectureRunExecuteOrchestrator` | Process-idempotent **after** `(RunId, TaskId)` persist (**TB-039**/**TB-201**) | **No** ownership lease; often **stuck non-terminal** + silent partial results |

Long-running LLM review = **A0b**. Worker finishing authority materializes `AgentTask`s (`TasksGenerated`) but **does not** run the LLM batch.

---

## 2. Resumability state machine (execute-relevant)

| Run `LegacyRunStatus` | How you get there | Crash mid-execute? |
|-----------------------|-------------------|--------------------|
| `TasksGenerated` | Authority + task materialize | **Typical stuck state** after hard kill |
| `WaitingForResults` | Selective demote / incomplete submit | Also non-terminal stuck |
| `ReadyForCommit` | Execute completed; all required agents commit-ready | Only if execute finished |
| `PartiallyCompleted` / `FailedPartial` / `Failed` | Derived on **completed** execute success/fail paths (**TB-937**) | **Not** auto-set on process kill |
| `Committed` | Finalize CAS | Unaffected by mid-execute kill |

**Resume levers (manual / API):** re-`POST …/execute` (skips persisted successes); selective execute (**TB-938**); not automatic orphan reclaim.

**Not process-idempotent:** crash after LLM spend before `AgentResult` persist → **rebill** on retry (**TB-1270** / **M-170**).

**Gap:** `AgentTaskStatus.InProgress` is largely unused on the live path — durable progress is **AgentResult rows**, not task status flips.

---

## 3. Who detects orphaned tasks?

| Actor | Detects | Reclaims / remediates? |
|-------|---------|------------------------|
| `AuthorityPipelineWorkHostedService` + outbox lease | Stale authority work | **Yes** — dequeue after `LockedUntilUtc` |
| `OrchestratorHealthCheck` | Pending outbox age / (theoretical) `InProgress` tasks | Degraded health — **no** execute reclaim |
| `DataConsistencyReconciliationService` `stale_in_flight_runs` | Non-terminal runs > ~1h | Warning finding — **no** auto mark Failed |
| Execute ownership lease / heartbeat | — | **Missing** — **TB-943** (ACA drain **TB-960**–**TB-962**) |

**Answer:** Authority orphans → Worker. Mid-execute AgentTasks → **nobody owns reconciliation today**.

---

## 4. What the tenant sees

| Scenario | Tenant experience |
|----------|-------------------|
| API/process kill mid-execute | Client timeout/reset; list badges often **Starting / In progress** (snapshot flags, not `LegacyRunStatus`); detail may show **partial AgentResults** without `PartiallyCompleted`/`Failed` |
| Execute completed with required gaps | Honest **partial** UI + commit block (**TB-937**); Retry failed agents → selective |
| Authority outbox poison | Dead-letter + Failed marker path — closer to **honest failure** |
| Re-execute after stuck | Skips persisted successes; may rebill unpersisted in-flight agents |

Closest PA label for hard kill: **stuck / silent-partial**, not automatic **honest failure**.

---

## 5. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Worker resumes agent execute after crash” | Worker resumes **authority** outbox; execute is API-sync today |
| “Orphaned AgentTasks are auto-detected and failed” | Outbox reclaim ≠ execute reconcile; **TB-943** open |
| “Crash always surfaces honest Failed/Partial” | Only when execute completion/failure handlers run |
| “Exactly-once LLM / no rebill on kill” | Process skip **after persist** only |
| “InProgress task status is the live progress signal” | Results rows are the durable signal |

---

## 6. Related owners

| ID | Role |
|----|------|
| Done **TB-039** / **TB-201** / **TB-937** / **TB-938** | Idempotent skip, uniqueness, partial statuses, selective resume |
| Open **TB-943** | Zombie / interrupted execute reconciliation (product gap) |
| Open **TB-960**–**TB-962** / **M-121**/**M-122** | ACA interrupt / SIGTERM / buyer interrupted-review |
| Open **TB-1311**–**TB-1312** / **M-231**/**M-232** | First async-agent force + state-machine freeze |
| Open **TB-1270**–**TB-1271** / **M-221**/**M-222** | Execute+commit race / process-idempotency honesty |
| **TB-1523** / **M-277** | This crash-recovery claim map (orchestrates; does not replace **TB-943**) |

---

## 7. Optional follow-ons (not required to close honesty pin)

1. Ship **TB-943** execute lease + expire → selective-resume or mark partial/fail.  
2. Align list badges with non-terminal `LegacyRunStatus` stuck states.  
3. Flip or retire unused `AgentTaskStatus.InProgress` health assumptions.  
4. Async agent execute outbox (**TB-1311**) so “Worker dies mid-run” matches the real host.
