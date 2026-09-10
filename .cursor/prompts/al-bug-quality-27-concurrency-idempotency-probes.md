# ABQ-27 — Concurrency / idempotency probes (commit + persist)

**After ABQ-05 and ABQ-21 (shipped).** Do not hunt a synthetic sibling-file synonym. Do not change `bugsmash` as the default hunt push target. This prompt **adds tests**, not a new defect class.

## Goal

`ArchLucid.Application` commit/persist paths have **targeted** tests for three races that `/al-bug` almost never constructs: (1) **double-submit** the same commit, (2) **kill mid-commit** then retry, (3) **two callers** proposing/committing the same run. Failures are illegal duplicate side effects or a stuck non-terminal state — class `state-machine-gap` if a hunt-ready row is ever filed later. This session ships the probes, not a hunt.

## Why

ABQ-21 cools `boolean-coercion` and `fail-open-validation` once they are farmed. `state-machine-gap` stays undersampled because seed hunts read one file top-to-bottom and write a single-threaded fact. Real commit bugs are lost updates, double-finalization, and “retried after crash created a second manifest.” Idempotency types already exist; tests mostly cover the happy hash, not the crash/retry pair.

## Context

Reuse existing orchestration — do not add a second commit pipeline:

- `ArchLucid.Application/Runs/Orchestration/AuthorityDrivenArchitectureRunCommitOrchestrator.cs`
- `ArchLucid.Application/Runs/Orchestration/Commit/AuthorityCommitIdempotencyHandler.cs`
- `ArchLucid.Application/Runs/Orchestration/Commit/IAuthorityCommitIdempotencyHandler.cs`
- `ArchLucid.Application/Runs/CommitRunIdempotencyCoordinator.cs`
- `ArchLucid.Application/Runs/ICommitRunIdempotencyCoordinator.cs`
- `ArchLucid.Persistence.Coordination/**` (if the probe needs the coordination lease / outbox; otherwise stay in Application.Tests with fakes)
- Existing tests under `ArchLucid.Application.Tests` that already mock `IAuthorityCommitIdempotencyHandler` / `ICommitRunIdempotencyCoordinator` — **extend those**, do not fork a second orchestrator test harness
- Stryker label `ApplicationCommitCriticalPaths` / `PersistenceCoordination` (ABQ-25) — low kill rate is a hint, not a hunt-ready bug
- Closed class enum stays: tag any *future* hunt-ready row ` [class:state-machine-gap]`. Do **not** grow the enum.

Grep `Idempotency` under `ArchLucid.Application.Tests` before inventing a new mock style.

## What to build

1. **Probe tests** (each type in its own file under `ArchLucid.Application.Tests`; no `ConfigureAwait(false)`):

   | Probe | Expected (document the current contract; do not invent a new one) |
   | --- | --- |
   | Double-submit same run + same idempotency key | Second call is a no-op or returns the first commit’s result; **no** second durable side effect (no second committed manifest, no second outbox payload) |
   | Cancel / throw after persist-begin, then retry with the same key | Retry completes **or** surfaces a typed conflict; run is not left in a non-terminal “committing forever” state |
   | Two overlapping commits (different keys **or** two agents) on one run | First-wins / 409 / typed conflict — **one** committed authority chain; loser does not clobber |

   Prefer public orchestrator APIs + test fakes that can throw on the **second** persist call. If SQL is required, mark `[Trait("Category", "Slow")]` and skip when the standard SQL env vars are unset (copy `TenantIsolationSmokeTests` skip pattern). Default this prompt to **in-memory / fake** probes so Cloud agents can run them.

2. **Do not** add a `/al-bug` Phase that “must hunt concurrency.” Command How-to: one sentence that seed hunts in commit/persist zones **may** read these probe names before inventing a new `state-machine-gap` candidate. Picker: no score term for “has concurrency tests.”

3. **Do not** rewrite `AuthorityDrivenArchitectureRunCommitOrchestrator` unless a probe **fails on current code**. If a probe fails:

   - Write the failing test first.
   - Minimal fix only on the idempotency/persist coordination path.
   - Do **not** start a full `/al-bug` loop, ledger tick, or `bugsmash` push unless the user also asked to hunt. File the row as a paste-ready `(candidate)` in the PR description / a comment in the test file — do not invent `PD-###`.

4. Tests to run (scoped; no full solution):

```text
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~Idempotency
```

Name the filter to the new test class(es). If you touch Coordination, add that test project’s matching filter only.

Cover: (a) double-submit does not persist twice (assert mock `Times.Once` or equivalent durable call count); (b) injected cancel-then-retry does not leave a fake run non-terminal; (c) overlapping commits: exactly one winner. Null orchestrator dependencies throw `ArgumentNullException` if you add a new composer — existing constructors already should.

## Acceptance criteria

- Three probe families exist and run in the scoped `dotnet test` above without SQL unless skipped-with-reason.
- No new defect-class id. No picker formula change. No Stryker config change.
- Historical ledger rows unchanged.
- If current code already satisfies the probes, the tests document that contract (green is success — do not weaken assertions to force a “hit”).

## Constraints

- Most invasive prompt in this wave — keep the diff inside Application commit/idempotency (+ tests). Do not refactor the whole authority pipeline.
- Do not add coverlet to PR CI. Do not run Stryker.
- Do not add English-phrase signals to the validity audit.
- Do not run `/al-bug`. Do not reopen TB-135/TB-136 or GTM cohort rows.
- Working-tree safety. Each class in its own file. Check nulls. Prefer concrete types over `var`. Blank line before `if` / `foreach` unless first in method.
- Pester 5 only if you add a script wrapper (unlikely).
