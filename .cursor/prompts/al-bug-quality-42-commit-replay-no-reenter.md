# ABQ-42 — Commit replay must not re-enter persist

**After ABQ-27 (shipped probes).** Do not hunt. Do not start `/al-bug`. Do not invent a second coordinator. Change production **only if a probe fails on current code**.

## Goal

ABQ-27’s table said: second submit with the same idempotency key is a **no-op or returns the first result** with **no second durable side effect**. The shipped probes **document** that `CommitRunIdempotencyCoordinator` still **invokes** `commitAsync` on replay. Tighten the probe (and the coordinator if needed) so replay does **not** call the persist delegate a second time when `TryGetAsync` already returns a matching fingerprint. Cancel-then-retry and first-insert-wins stay as specified.

## Why

A replay that re-enters commit can duplicate outbox/manifest work even if the HTTP layer returns “replay.” The probe file currently spies invocation count in a way that **allows** the second call. That is the leftover of 27, not a new defect class. Class `state-machine-gap` only if you later file a hunt-ready row (you should not in this session).

## Context

- `ArchLucid.Application/Runs/CommitRunIdempotencyCoordinator.cs`
- `ArchLucid.Application.Tests/Runs/CommitRunIdempotencyProbeTests.cs`
- `ArchLucid.Application/Runs/Orchestration/Commit/AuthorityCommitIdempotencyHandler.cs` — do not fork
- Existing mocks of `ICommitRunIdempotencyRepository`
- Closed enum unchanged

Each class in its own file if you split the spy. No `ConfigureAwait(false)` in tests. Blank line before `if`/`foreach` unless first in method. Prefer concrete types over `var`. Check nulls.

## What to build

1. **Failing assertion first:** double-submit same key → `commitAsync` invocation count is **1** (or persist `TryInsertAsync` count is 1 and get-on-replay returns the stored outcome without a second insert). If current code fails that assertion, it is the bug 27 named.

2. **Minimal coordinator fix** so matching fingerprint replay returns the stored/first outcome without invoking `commitAsync` again. Do **not** return a default empty `CommitRunResult` if that would drop fields the first commit produced — store or thread the first result if the type already allows it; if the current type cannot, document the residual and still skip the second persist.

3. **Do not** change cancel-does-not-insert or first-insert-wins unless those probes break.

4. Command How-to: seed hunts in commit zones may read these probe names (already true); add “replay must not re-enter persist.”

5. Tests:

```text
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~CommitRunIdempotencyProbeTests
```

## Acceptance criteria

- Replay path does not invoke `commitAsync` twice for a matching key **or** the PR documents why the type cannot store the first result and still skips the second insert.
- No `/al-bug` ledger tick. No `bugsmash` push unless the user also asked to hunt (they did not).
- No new defect-class enum value.

## Constraints

- Do not run `/al-bug`. Do not invent `PD-###`.
- Do not reopen TB-135/TB-136 or GTM cohort rows.
- Working-tree safety.
- Do not add coverlet or Stryker to PR CI.
