> **Scope:** Contributor-reference — concurrent execute + idempotent commit race resolution (TB-1270); not a buyer-facing trust claim.

# Concurrent execute and commit race resolution contract

**Status:** Active (V1)  
**Backlog:** **TB-1270** (this contract) · **TB-1271** (anti-exactly-once-commit / silent-double-package / retry-never-spends honesty CI — **Done** 2026-08-11)  
**Audience:** Principal architects, platform reviewers, coding agents  
**Related:** [MANIFEST_FINALIZATION_TRANSACTION.md](../architecture/MANIFEST_FINALIZATION_TRANSACTION.md) · [TRANSACTIONAL_FINALIZE_VS_OUTBOX_CONTRACT.md](./TRANSACTIONAL_FINALIZE_VS_OUTBOX_CONTRACT.md) (**TB-1011**) · [APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md](./APPEND_ONLY_AND_SEALED_EVIDENCE_CONTRACT.md) (**TB-1009**) · [COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md](./COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_CONTRACT.md) (**TB-1003**) · [DATA_CONSISTENCY_MATRIX.md](./DATA_CONSISTENCY_MATRIX.md) · [AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md](./AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md) (**TB-1007**) · [TRANSACTIONAL_OUTBOX_REPLAY_VS_IDEMPOTENCY_CONTRACT.md](./TRANSACTIONAL_OUTBOX_REPLAY_VS_IDEMPOTENCY_CONTRACT.md) (**TB-992**) · ADR [0039](../architecture/adrs/0039-append-only-sealed-evidence.md) / [0045](../architecture/adrs/0045-golden-manifest-immutability.md) · GTM **M-221** / **M-222** · Done **TB-039** / **TB-201** / **TB-303** / **TB-310** · open **TB-943** · **M-170** process-vs-provider billing

---

## 1. Purpose

Name how **commit** and **execute** races resolve under V1 — and which overclaims are forbidden.

**One line:** Commit is **first-wins** under SQL CAS; execute is **process-idempotent only after** a successful `(RunId, TaskId)` persist; finalize success ≠ async delivery complete.

---

## 2. Non-claims (say first)

| Do **not** claim | Why |
|------------------|-----|
| “Exactly-once commit end-to-end.” | Concurrent finalizers race; loser gets **409** or idempotent replay — not a universal singleton writer. |
| “Retries never spend LLM.” | Execute skip applies only after successful task persist (**M-170**); crash-before-persist may rebill at provider. |
| “Two racing executes cannot conflict.” | Pre-persist concurrent executors may both call AOAI (**TB-943** ownership limits apply). |
| “HTTP `Idempotency-Key` equals SQL CAS.” | Client convenience fingerprint ≠ `sp_FinalizeManifest` ROWVERSION CAS. |
| “Committed = indexed / delivered.” | Finalize proves sealed package; outbox/workers are async (**TB-1011** / **TB-992**). |

---

## 3. Commit race — first-wins matrix

Authority finalize path: `LockRunForFinalizationAsync` (`UPDLOCK`) → `sp_FinalizeManifest` CAS on `RowVersionStamp` → audit + integration outbox enqueue in same SQL TX when supported.

| Scenario | Outcome | HTTP / fault |
|----------|---------|--------------|
| Run already committed with **same** `ManifestId` | Idempotent success (no second package) | **200** replay |
| Run committed with **different** manifest | Loser rejected | **409** — `ManifestFinalizationFaultKind.CommittedDifferentManifest` (**50002**) |
| Stale `RowVersionStamp` / concurrent updater | Loser rejected | **409** — `ConcurrencyConflict` (**50006**) |
| Findings / artifact snapshot mismatch | Finalize blocked | **409** — `FindingsMismatch` / `ArtifactMismatch` (**50004** / **50005**) |
| Run not in committable status | Finalize blocked | **409** — `BadRunStatus` (**50003**) |
| HTTP `CommitRunIdempotency` fingerprint mismatch | Replay rejected | **409** (distinct from SQL CAS — client layer only) |
| Second sealed package for same run | Forbidden | `UQ_GoldenManifests_RunId_Active` + CAS — never silent double package |

**Conflict resolution pin:** one committed golden manifest per run; losers reconcile to the winner or receive **409** — never a silent second package (**TB-1003** / **TB-1009**).

---

## 4. Execute race — process idempotency after persist

| Scenario | Process behavior | Provider / cost |
|----------|------------------|-----------------|
| Retry after successful `(RunId, TaskId)` persist | Skip re-execution (**TB-039** / **TB-201**) | No second process-side LLM call for that task |
| Two executors **before** persist completes | Both may run LLM work | Provider at-least-once spend possible (**M-170**) |
| Insert race on task completion row | Duplicate key → **409** | Documented conflict, not silent merge |
| Crash after LLM, before persist | Retry may re-invoke provider | Rebill possible — not “retry never spends” |
| Execute ownership / lease (**TB-943**) | Limits concurrent worker claim | Does not guarantee zero duplicate provider calls pre-persist |

**Separation:** execute process skip ≠ commit CAS ≠ outbox delivery (**§5**).

---

## 5. Replay and async hazards (cross-layer)

| Hazard | Layer | Honest framing |
|--------|-------|----------------|
| Crash after LLM, before task persist | Execute | May rebill; process skip not yet armed |
| Crash after finalize TX, before outbox drain | Outbox | At-least-once republish (**TB-992**) |
| Crash after consumer handler, before SB ack | Consumer | Redelivery — handler must be idempotent (**TB-993**) |
| Post-commit mutation of sealed manifest | Storage | Forbidden — append-only / new commit (**ADR 0039** / **0045**) |
| Orphan active-manifest uniqueness | SQL | Filtered unique index prevents duplicate active golden per run |

---

## 6. Mechanism map (code anchors)

| Mechanism | Location |
|-----------|----------|
| Finalize orchestration | `ManifestFinalizationService`, `AuthorityDrivenArchitectureRunCommitOrchestrator` |
| SQL finalize proc | `dbo.sp_FinalizeManifest` — see [MANIFEST_FINALIZATION_TRANSACTION.md](../architecture/MANIFEST_FINALIZATION_TRANSACTION.md) |
| Fault mapping | `ManifestFinalizationFaultKind` / `ManifestFinalizationFaultMapper` |
| Commit HTTP idempotency | `CommitRunIdempotencyRepository`, `IdempotencyFilterAttribute` on mutating controllers |
| Execute task skip | `(RunId, TaskId)` persistence checks (**TB-039** / **TB-201** — Done, do not reopen) |
| Sealed evidence | **TB-1009** / **TB-303** — Done |
| Finalize vs outbox | **TB-1011** |

---

## 7. PA review drill

1. Ask which race the buyer fears — commit CAS, execute rebill, or async delivery lag.
2. Confirm “idempotent commit” means same `ManifestId` first-wins, not universal exactly-once.
3. Confirm HTTP `Idempotency-Key` is not sold as a substitute for SQL CAS.
4. Treat silent overwrite, “retries never spend,” or “committed = delivered” as review findings.

---

## 8. Claim boundary (GTM **M-221** / **M-222**)

| Safe | Unsafe |
|------|--------|
| “First-wins commit under CAS.” | “Exactly-once commit.” |
| “Process skip after `(RunId, TaskId)` persist.” | “Retries never spend LLM.” |
| “Losers get 409 or idempotent replay.” | “Two racing commits both succeed with different packages.” |
| “Finalize ≠ async delivery.” | “Committed means indexed / ITSM delivered.” |

Buyer handout: [BUYER_SECURITY_PROCUREMENT_PACKET.md § M-222](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#concurrent-execute-commit-race-m-222). Path-stable alias: [CONCURRENT_EXECUTE_AND_COMMIT_RACE_PA_ONE_PAGER.md](../go-to-market/CONCURRENT_EXECUTE_AND_COMMIT_RACE_PA_ONE_PAGER.md).

---

## 9. Enforcement surfaces (follow-on)

| ID | Role |
|----|------|
| **TB-1271** | CI guard: forbid “exactly-once commit,” “retry never spends,” silent double-package stubs in buyer/WNTP-adjacent paths; anchor to this contract |
| **TB-943** | Execute ownership lease — limits concurrent executor races (separate implementation row) |

---

## 10. Explicit non-goals

- Reopening Done **TB-039** / **TB-201** / **TB-303** / **TB-310** as greenfield work.
- Changing `sp_FinalizeManifest` semantics or outbox redesign (**TB-920** / **TB-924**).
- Claiming DTF / Service Bus delivers exactly-once agent orchestration (**TB-1311** cluster).
